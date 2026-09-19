import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import "./setup";
import { mount } from "./helpers";
import type { AutoSpark } from "../engine";

/**
 * x-data 异步数据源（ADR-0033）：url / action 形态、path 提取、$loading/$error 元状态、
 * x-fallback 双态兜底（重取保旧值）、x-loading 合成（互斥默认）、插值重取与竞态丢弃、
 * method/header、mount 兼容、数据脚本基底合成次序、destroy 中止。
 */

/** fetch 调用记录 + 可编程应答 */
function mockFetch(handler: (url: string, init?: RequestInit) => any) {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    (globalThis as any).fetch = async (url: any, init?: any) => {
        calls.push({ url: String(url), init });
        let res = handler(String(url), init);
        // handler 可返回 deferred promise（控制 pending 窗口）——须 await 真正挂起
        if (res && typeof (res as any).then === "function") res = await res;
        if (res instanceof Error) throw res;
        const body = res?.body ?? {};
        const ok = res?.ok ?? true;
        return {
            ok,
            status: res?.status ?? 200,
            statusText: res?.statusText ?? (ok ? "OK" : "Error"),
            json: async () => body,
        };
    };
    return calls;
}

/** 手动放行的延迟应答（控制 pending 窗口） */
function deferred<T>() {
    let resolve!: (v: T) => void;
    let reject!: (e: any) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

/** 等 fetch 微任务链 + scheduler flush（宏任务一跳） */
const flush = async () => {
    await Promise.resolve();
    await new Promise<void>((r) => setTimeout(r, 0));
};

const realFetch = globalThis.fetch;

describe("x-data 异步数据源（ADR-0033）", () => {
    beforeEach(() => {
        (globalThis as any).fetch = realFetch;
    });
    afterEach(() => {
        (globalThis as any).fetch = realFetch;
    });

    test("url 形态：首取落域、$loading 生命周期、数据渲染", async () => {
        const calls = mockFetch(() => ({ body: { msg: "hi", n: 1 } }));
        const { root } = mount(
            `<div id="host" x-data="/api/books"><span x-text="msg + n"></span></div>`,
            {},
        );
        await flush();
        expect(calls.length).toBe(1);
        expect(calls[0]?.url).toBe("/api/books");
        expect(calls[0]?.init?.method).toBe("GET");
        expect(root.querySelector("span")?.textContent).toBe("hi1");
    });

    test("url 形态：$loading 在 pending 期间为 true，成功后 false", async () => {
        const gate = deferred<{ body: any }>();
        mockFetch(() => gate.promise);
        const { root, engine } = mount(
            `<div id="host" x-data="/api/slow"><span class="l" x-text="$loading"></span></div>`,
            {},
        );
        await flush();
        expect(root.querySelector(".l")?.textContent).toBe("true");
        gate.resolve({ body: { ok: 1 } });
        await flush();
        expect(root.querySelector(".l")?.textContent).toBe("false");
        expect(engine).toBeTruthy();
    });

    test("失败姿态：reject → $error 落地（Error 实例）、数据不落", async () => {
        mockFetch(() => new Error("网络炸了"));
        const { root } = mount(
            `<div id="host" x-data="/api/bad"><span class="e" x-text="$error.message"></span><span class="d" x-text="msg"></span></div>`,
            {},
        );
        await flush();
        expect(root.querySelector(".e")?.textContent).toBe("网络炸了");
        expect(root.querySelector(".d")?.textContent).toBe("");
    });

    test("HTTP 非 2xx → 加载失败", async () => {
        mockFetch(() => ({ ok: false, status: 404, statusText: "Not Found" }));
        const { root } = mount(
            `<div id="host" x-data="/api/404"><span class="e" x-text="$error.message"></span></div>`,
            {},
        );
        await flush();
        expect(root.querySelector(".e")?.textContent).toContain("404");
    });

    test("path 提取：从包壳响应下钻取对象；提取后非对象 → 失败", async () => {
        mockFetch(() => ({ body: { code: 0, data: { a: 1 } } }));
        const { root } = mount(
            `<div id="host" x-data="/api/wrapped" x-data-options="{path:'data'}"><span x-text="a"></span></div>`,
            {},
        );
        await flush();
        expect(root.querySelector("span")?.textContent).toBe("1");
    });

    test("非对象响应（裸数组）→ $error、数据不落", async () => {
        mockFetch(() => ({ body: [1, 2] }));
        const { root } = mount(
            `<div id="host" x-data="/api/arr"><span class="e" x-text="$error ? $error.message : 'no'"></span></div>`,
            {},
        );
        await flush();
        expect(root.querySelector(".e")?.textContent).toContain("对象");
    });

    test("插值重取：依赖变化触发第二次 fetch（新 url、编码）；依赖变但 url 未变不重取", async () => {
        let n = 0;
        const calls = mockFetch(() => ({ body: { v: ++n } }));
        const { root, engine } = mount(
            `<div id="host" x-data="/api?order={q}"><span x-text="v"></span></div>`,
            { q: "a" },
        );
        await flush();
        expect(calls.length).toBe(1);
        expect(calls[0]?.url).toBe("/api?order=a");
        expect(root.querySelector("span")?.textContent).toBe("1");
        (engine.state as any).q = "中文 x";
        await flush();
        expect(calls.length).toBe(2);
        expect(calls[1]?.url).toBe(`/api?order=${encodeURIComponent("中文 x")}`);
        expect(root.querySelector("span")?.textContent).toBe("2");
        // 同值再写：url 未变 → 不重取
        (engine.state as any).q = "中文 x";
        await flush();
        expect(calls.length).toBe(2);
    });

    test("竞态丢弃：慢的旧请求后到不落地", async () => {
        const gates = [deferred<{ body: any }>(), deferred<{ body: any }>()];
        let i = 0;
        mockFetch(() => gates[i++]!.promise);
        const { root, engine } = mount(
            `<div id="host" x-data="/api?o={o}"><span x-text="v"></span></div>`,
            { o: 1 },
        );
        await flush();
        (engine.state as any).o = 2;
        await flush();
        // 后发先回：新请求先 resolve
        gates[1]!.resolve({ body: { v: "new" } });
        await flush();
        expect(root.querySelector("span")?.textContent).toBe("new");
        // 旧请求后到：被序号丢弃
        gates[0]!.resolve({ body: { v: "stale" } });
        await flush();
        expect(root.querySelector("span")?.textContent).toBe("new");
    });

    test("action 形态：调用返回对象落域；实参求值与依赖重执行", async () => {
        let called = 0;
        const { root, engine } = mount(
            `<div id="host" x-data="loadBooks(page)"><span x-text="title"></span></div>`,
            { page: 1 },
            {
                actions: {
                    loadBooks: function (p: number) {
                        called++;
                        return { title: "第" + p + "页" };
                    },
                },
            },
        );
        await flush();
        expect(called).toBe(1);
        expect(root.querySelector("span")?.textContent).toBe("第1页");
        (engine.state as any).page = 2;
        await flush();
        expect(called).toBe(2);
        expect(root.querySelector("span")?.textContent).toBe("第2页");
    });

    test("action 未找到 → $error", async () => {
        const { root } = mount(
            `<div id="host" x-data="nope"><span class="e" x-text="$error.message"></span></div>`,
            {},
        );
        await flush();
        expect(root.querySelector(".e")?.textContent).toContain("nope");
    });

    test("x-fallback：pending 显示（子树隐藏）、到达后复原渲染数据", async () => {
        const gate = deferred<{ body: any }>();
        mockFetch(() => gate.promise);
        const { root } = mount(
            `<div id="host" x-data="/api/slow">
  <p class="content" x-text="msg"></p>
  <div x-fallback><span class="fb">加载中（{{ $loading }}）</span></div>
</div>`,
            {},
        );
        await flush();
        // pending：fallback 挂载、正常子树 detach
        expect(root.querySelector(".fb")?.textContent).toContain("加载中（true）");
        expect(root.querySelector(".content")).toBeNull();
        gate.resolve({ body: { msg: "ok" } });
        await flush();
        // 到达：fallback 销毁、子树复原
        expect(root.querySelector(".fb")).toBeNull();
        expect(root.querySelector(".content")?.textContent).toBe("ok");
    });

    test("x-fallback：失败认领（$error 可读）", async () => {
        mockFetch(() => new Error("500"));
        const { root } = mount(
            `<div id="host" x-data="/api/bad">
  <p class="content">不应出现</p>
  <div x-fallback><span class="fb">失败：{{ $error.message }}</span></div>
</div>`,
            {},
        );
        await flush();
        expect(root.querySelector(".fb")?.textContent).toBe("失败：500");
        expect(root.querySelector(".content")).toBeNull();
    });

    test("重取保旧值：已有数据后依赖变化，fallback 不闪现、旧值保留", async () => {
        let n = 0;
        const gates = [deferred<{ body: any }>(), deferred<{ body: any }>()];
        mockFetch(() => gates[n++]!.promise);
        const { root, engine } = mount(
            `<div id="host" x-data="/api?o={o}">
  <p class="content" x-text="v"></p>
  <div x-fallback><span class="fb">fallback</span></div>
</div>`,
            { o: 1 },
        );
        gates[0]!.resolve({ body: { v: "old" } });
        await flush();
        expect(root.querySelector(".content")?.textContent).toBe("old");
        expect(root.querySelector(".fb")).toBeNull();
        // 重取：pending 但有旧值 → 不显示 fallback
        (engine.state as any).o = 2;
        await flush();
        expect(root.querySelector(".fb")).toBeNull();
        expect(root.querySelector(".content")?.textContent).toBe("old");
        gates[1]!.resolve({ body: { v: "new" } });
        await flush();
        expect(root.querySelector(".content")?.textContent).toBe("new");
    });

    test("孤立 x-fallback：warn + 当普通元素渲染（保留在 DOM）", async () => {
        const { root } = mount(
            `<div id="host" x-data="{a:1}"><div x-fallback><span class="fb">内容</span></div></div>`,
            {},
        );
        await flush();
        expect(root.querySelector(".fb")?.textContent).toBe("内容");
    });

    test("x-loading 合成：无 fallback 默认合成（绑 $loading 路径）；有 fallback 互斥不合成", async () => {
        const gate = deferred<{ body: any }>();
        mockFetch(() => gate.promise);
        const { root } = mount(`<div id="host" x-data="/api/x"><p>内容</p></div>`, {});
        await flush();
        const host = root.querySelector("#host")!;
        const attr = host.getAttribute("x-loading");
        expect(attr).toBeTruthy();
        expect(attr).toMatch(/\$loading$/);
        gate.resolve({ body: {} });
        await flush();
    });

    test("x-loading 合成：有 x-fallback 时不合成；loading:false 恒关；loading:{...} 显式并存", async () => {
        mockFetch(() => ({ body: { a: 1 } }));
        const { root: r1 } = mount(
            `<div id="h1" x-data="/api/a"><div x-fallback>fb</div></div>`,
            {},
        );
        const { root: r2 } = mount(
            `<div id="h2" x-data="/api/b" x-data-options="{loading:false}"><p>x</p></div>`,
            {},
        );
        const { root: r3 } = mount(
            `<div id="h3" x-data="/api/c" x-data-options="{loading:{message:'自定义'}}"><div x-fallback>fb</div></div>`,
            {},
        );
        await flush();
        expect(r1.querySelector("#h1")!.getAttribute("x-loading")).toBeNull();
        expect(r2.querySelector("#h2")!.getAttribute("x-loading")).toBeNull();
        const h3 = r3.querySelector("#h3")!;
        expect(h3.getAttribute("x-loading")).toMatch(/\$loading$/);
        expect(h3.getAttribute("x-loading-options")).toContain("自定义");
    });

    test("method / header 选项直传 fetch", async () => {
        const calls = mockFetch(() => ({ body: { a: 1 } }));
        mount(
            `<div id="host" x-data="/api/post" x-data-options="{method:'POST', header:{'X-Token':'t1'}}"><p>x</p></div>`,
            {},
        );
        await flush();
        expect(calls[0]?.init?.method).toBe("POST");
        expect((calls[0]?.init?.headers as any)["X-Token"]).toBe("t1");
    });

    test("mount 兼容：异步数据落挂载容器、元键同域", async () => {
        mockFetch(() => ({ body: { count: 7 } }));
        const { root, engine } = mount(
            `<div id="host" x-data="/api/panel" x-data-options="{mount:'ui.panel'}"><span x-text="count"></span></div>`,
            {},
        );
        await flush();
        expect(root.querySelector("span")?.textContent).toBe("7");
        expect((engine.state as any).ui.panel.count).toBe(7);
        expect((engine.state as any).ui.panel.$loading).toBe(false);
    });

    test("数据脚本基底：先落脚本数据，url 到达 deepMerge 覆盖", async () => {
        mockFetch(() => ({ body: { a: 2, extra: true } }));
        const { root } = mount(
            `<div id="host" x-data="/api/merge">
  <script type="autospark/data">{ a: 1, base: '脚本' }</script>
  <span x-text="a + ',' + base + ',' + extra"></span>
</div>`,
            {},
        );
        await flush();
        // url 覆盖 a=2；脚本独有 base 保留；url 新增 extra
        expect(root.querySelector("span")?.textContent).toBe("2,脚本,true");
    });

    test("destroy 中止：pending 期 destroy，resolve 后数据不落地", async () => {
        const gate = deferred<{ body: any }>();
        mockFetch(() => gate.promise);
        const { engine } = mount(`<div id="host" x-data="/api/late"><p>x</p></div>`, {});
        await flush();
        engine.destroy();
        gate.resolve({ body: { v: 1 } });
        await flush();
        const scopes = (engine.state as any).$scopes as Record<string, any>;
        // 私有域条目已回收、迟到数据未落地
        expect(Object.keys(scopes).length).toBe(0);
    });

    test("值形态分发：裸词相对 url 不支持（归 literal，warn 不取数）", async () => {
        const calls = mockFetch(() => ({ body: {} }));
        mount(`<div id="host" x-data="api/books"><span x-text="msg"></span></div>`, {});
        await flush();
        expect(calls.length).toBe(0);
        expect((globalThis as any).__x).toBeUndefined();
    });

    test("响应键遮蔽：接口回显与全局控制键同名的键 → 遮蔽全局键、重取静默失效（引擎 warn）", async () => {
        const calls = mockFetch((url) => {
            const page = Number(new URL(url, "http://x").searchParams.get("page") ?? 1);
            // 回显 page（与全局控制键撞名）——遮蔽：插值重求值读到域内旧值，重取失效
            return { body: { page, v: "第" + page + "页" } };
        });
        const { root, engine } = mount(
            `<div id="host" x-data="/api/list?page={page}"><span x-text="v"></span></div>`,
            { page: 1 },
        );
        await flush();
        expect(root.querySelector("span")?.textContent).toBe("第1页");
        (engine.state as any).page = 2;
        await flush();
        // 全局 page=2 的通知到达 watcher，但重求值读到域内被遮蔽的 page=1 → url 未变 → 不重取
        expect(calls.length).toBe(1);
        expect(root.querySelector("span")?.textContent).toBe("第1页");
    });

    test('短路依赖漂移：:disabled="page <= 1 || $loading" 翻页后正确解禁（依赖动态重收集回归）', async () => {
        const gate = deferred<{ body: any }>();
        mockFetch(() => gate.promise);
        const { root, engine } = mount(
            `<div id="host" x-data="/api/slow?page={page}"><button class="prev" :disabled="page <= 1 || $loading">←</button></div>`,
            { page: 1 },
        );
        await flush();
        // 首载 pending：page<=1 短路为真 → 禁用（$loading 未被读，依赖集不含 $loading）
        expect((root.querySelector(".prev") as HTMLButtonElement).disabled).toBe(true);
        gate.resolve({ body: { a: 1 } });
        await flush();
        // 数据到、$loading=false——依赖集不含 $loading，本不通知；page 未变也不通知。
        // 数据到达本身（a 键落域）不在依赖里……此处按钮应仍禁用（page=1 短路）：
        expect((root.querySelector(".prev") as HTMLButtonElement).disabled).toBe(true);
        // 翻页：page=2 → update 重跑（page 在依赖里）→ 短路解除、读到 $loading=true（重取中）
        // → 动态重收集补订 $loading → 重取完成 $loading=false 回落通知 → 解禁
        (engine.state as any).page = 2;
        await flush();
        await flush();
        expect((root.querySelector(".prev") as HTMLButtonElement).disabled).toBe(false);
    });

    test("值形态分发：./ 与 ../ 前缀归 url", async () => {
        const calls = mockFetch(() => ({ body: { a: 1 } }));
        mount(`<div id="host" x-data="./api/rel"><span x-text="a"></span></div>`, {});
        await flush();
        expect(calls[0]?.url).toBe("./api/rel");
    });
});
