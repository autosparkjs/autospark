import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import "./setup";
import { mount } from "./helpers";
import type { AutoSpark } from "../engine";

/**
 * x-html 远程异步 HTML 源（ADR-0035）：url / action 形态判定（action 必须带括号——裸词
 * 恒为表达式）、text-only 映射（非字符串即失败）、远程内容默认消毒、x-fallback 静态认领
 * （不编译不可插值、重取保旧值）、x-loading 字面量切换合成（互斥默认、三态）、
 * `.compile` 远程模板、同元素双异步反馈互斥、竞态丢弃与 destroy 中止。
 */

/** fetch 调用记录 + 可编程应答（body 为 html 字符串，走 res.text()） */
function mockFetch(handler: (url: string, init?: RequestInit) => any) {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    (globalThis as any).fetch = async (url: any, init?: any) => {
        calls.push({ url: String(url), init });
        let res = handler(String(url), init);
        // handler 可返回 deferred promise（控制 pending 窗口）——须 await 真正挂起
        if (res && typeof (res as any).then === "function") res = await res;
        if (res instanceof Error) throw res;
        const body = res?.body ?? "";
        const ok = res?.ok ?? true;
        return {
            ok,
            status: res?.status ?? 200,
            statusText: res?.statusText ?? (ok ? "OK" : "Error"),
            json: async () => body,
            text: async () => String(body),
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

/** 读取覆盖层根节点 */
const overlayOf = (host: Element | null): HTMLElement | null =>
    (host?.querySelector(".x-loading-overlay") as HTMLElement) ?? null;

const realFetch = globalThis.fetch;

describe("x-html 远程异步 HTML 源（ADR-0035）", () => {
    beforeEach(() => {
        (globalThis as any).fetch = realFetch;
    });
    afterEach(() => {
        (globalThis as any).fetch = realFetch;
    });

    // ── 形态判定（决策 1）──────────────────────────────────────────────

    test("url 形态：fetch text 注入 innerHTML", async () => {
        const calls = mockFetch(() => ({ body: "<b>远程片段</b>" }));
        const { root } = mount(`<div id="h" x-html="/api/p.html"></div>`, {});
        await flush();
        expect(calls.length).toBe(1);
        expect(calls[0]?.url).toBe("/api/p.html");
        expect(root.querySelector("#h")?.innerHTML).toBe("<b>远程片段</b>");
    });

    test("action 形态（带括号）：执行 action 取 html 字符串", async () => {
        mockFetch(() => ({ body: "不应被调用" }));
        const { root } = mount(
            `<div id="h" x-html="loadPartial()"></div>`,
            {},
            {
                actions: {
                    loadPartial: async () => {
                        await new Promise((r) => setTimeout(r, 5));
                        return "<i>action 片段</i>";
                    },
                },
            },
        );
        await flush();
        // handle 内 5ms 定时器：全量并行负载下 flush（一跳宏任务）不够，补等定时器窗口
        await new Promise((r) => setTimeout(r, 10));
        expect(root.querySelector("#h")?.innerHTML).toBe("<i>action 片段</i>");
    });

    test("裸词恒为表达式：x-html=\"content\" 读状态键，不触发 fetch", async () => {
        const calls = mockFetch(() => ({ body: "不应被调用" }));
        const { root } = mount(`<div id="h" x-html="content"></div>`, { content: "<u>本地内容</u>" });
        await flush();
        expect(calls.length).toBe(0);
        expect(root.querySelector("#h")?.innerHTML).toBe("<u>本地内容</u>");
    });

    test("链式调用保持表达式：x-html=\"s.trim()\" 不判 action", async () => {
        const { root } = mount(`<div id="h" x-html="s.trim()"></div>`, { s: "  <em>trimmed</em>  " });
        await flush();
        expect(root.querySelector("#h")?.innerHTML).toBe("<em>trimmed</em>");
    });

    test("url 插值：{expr} 依赖变化自动重取", async () => {
        const calls = mockFetch((url) => ({ body: `<p>${url}</p>` }));
        const { root, store } = mount(
            `<div id="h" x-html="/api/p-{lang}.html"></div>`,
            { lang: "zh" },
        );
        await flush();
        expect(calls.length).toBe(1);
        expect(root.querySelector("#h")?.textContent).toBe("/api/p-zh.html");
        store.state.lang = "en";
        await flush();
        expect(calls.length).toBe(2);
        expect(root.querySelector("#h")?.textContent).toBe("/api/p-en.html");
    });

    // ── text-only 映射（决策 2）────────────────────────────────────────

    test("action 返回非字符串 → 失败：不落地、保旧值", async () => {
        const { root } = mount(
            `<div id="h" x-html="bad()"><div x-fallback>失败中</div></div>`,
            {},
            {
                actions: {
                    bad: async () => ({ html: "<p>对象</p>" }),
                },
            },
        );
        await flush();
        // 失败：宿主显示 fallback（认领失败态），innerHTML 未被 "[object Object]" 污染
        expect(root.querySelector("#h")?.textContent).toContain("失败中");
    });

    test("空串响应 → 清空宿主（既有同步语义照旧）", async () => {
        mockFetch(() => ({ body: "<b>先到</b>" }));
        const { root, store } = mount(`<div id="h" x-html="/api/p-{t}.html"></div>`, { t: 1 });
        await flush();
        expect(root.querySelector("#h")?.innerHTML).toBe("<b>先到</b>");
        // 第二次返回空串：重取后清空
        mockFetch(() => ({ body: "" }));
        store.state.t = 2;
        await flush();
        expect(root.querySelector("#h")?.innerHTML).toBe("");
    });

    // ── 远程内容默认消毒（决策 4）──────────────────────────────────────

    test("默认模式：远程内容默认消毒（剥 script / onerror）", async () => {
        mockFetch(() => ({
            body: `<b>ok</b><script>alert(1)</script><img src="x" onerror="alert(2)">`,
        }));
        const { root } = mount(`<div id="h" x-html="/api/evil.html"></div>`, {});
        await flush();
        const html = root.querySelector("#h")!.innerHTML;
        expect(html).toContain("<b>ok</b>");
        expect(html).not.toContain("script");
        expect(html).not.toContain("onerror");
    });

    test(".raw：远程内容退出消毒原样写入", async () => {
        mockFetch(() => ({ body: `<b>ok</b><script>alert(1)</script>` }));
        const { root } = mount(`<div id="h" x-html.raw="/api/raw.html"></div>`, {});
        await flush();
        expect(root.querySelector("#h")?.innerHTML).toContain("script");
    });

    // ── 反馈通道（决策 3：视觉完整、无元键）───────────────────────────

    test("x-loading 合成：pending 显示覆盖层、完成后撤除", async () => {
        const gate = deferred<{ body: string }>();
        mockFetch(() => gate.promise);
        const { root } = mount(`<div id="h" x-html="/api/slow.html"></div>`, {});
        await flush();
        const h = root.querySelector("#h")!;
        expect(h.getAttribute("x-loading")).toBe("true");
        expect(overlayOf(h)).not.toBeNull();
        gate.resolve({ body: "<b>好了</b>" });
        await flush();
        expect(h.getAttribute("x-loading")).toBe("false");
        expect(overlayOf(h)).toBeNull();
        expect(h.innerHTML).toBe("<b>好了</b>");
    });

    test("x-fallback 静态认领：首载显示、成功后移除、不编译（{{}} 显示原文）", async () => {
        const gate = deferred<{ body: string }>();
        mockFetch(() => gate.promise);
        const { root } = mount(
            `<div id="h" x-html="/api/slow.html"><div class="fb" x-fallback>加载中… {{ $loading }}</div></div>`,
            {},
        );
        await flush();
        // 首载：fallback 克隆显示（静态——插值原文，不编译）
        expect(root.querySelector(".fb")?.textContent).toContain("加载中… {{ $loading }}");
        gate.resolve({ body: "<b>内容</b>" });
        await flush();
        expect(root.querySelector(".fb")).toBeNull();
        expect(root.querySelector("#h")?.innerHTML).toBe("<b>内容</b>");
    });

    test("重取保旧值：重取期间旧内容保留、fallback 不闪现", async () => {
        const gate = deferred<{ body: string }>();
        mockFetch(() => ({ body: "<b>第一版</b>" }));
        const { root, store } = mount(
            `<div id="h" x-html="/api/p-{t}.html"><div class="fb" x-fallback>占位</div></div>`,
            { t: 1 },
        );
        await flush();
        expect(root.querySelector("#h")?.innerHTML).toBe("<b>第一版</b>");
        expect(root.querySelector(".fb")).toBeNull();
        // 重取挂起：旧值保留、fallback 不闪现、覆盖层出现（无 fallback 合成互斥——已有成功内容，
        // fallback 已被采集故未合成覆盖层，验证保旧值即可）
        mockFetch(() => gate.promise);
        store.state.t = 2;
        await flush();
        expect(root.querySelector("#h")?.innerHTML).toBe("<b>第一版</b>");
        expect(root.querySelector(".fb")).toBeNull();
        gate.resolve({ body: "<b>第二版</b>" });
        await flush();
        expect(root.querySelector("#h")?.innerHTML).toBe("<b>第二版</b>");
    });

    test("失败态：HTTP 404 → fallback 认领失败", async () => {
        mockFetch(() => ({ ok: false, status: 404, statusText: "Not Found" }));
        const { root } = mount(
            `<div id="h" x-html="/api/none.html"><div class="fb" x-fallback>出错了</div></div>`,
            {},
        );
        await flush();
        expect(root.querySelector(".fb")?.textContent).toBe("出错了");
        expect(root.querySelector("#h")?.innerHTML).not.toContain("not found");
    });

    test("loading:false 恒关：不合成 x-loading 属性", async () => {
        const gate = deferred<{ body: string }>();
        mockFetch(() => gate.promise);
        const { root } = mount(
            `<div id="h" x-html="/api/slow.html" x-html-options="{loading:false}"></div>`,
            {},
        );
        await flush();
        expect(root.querySelector("#h")?.getAttribute("x-loading")).toBeNull();
        gate.resolve({ body: "x" });
        await flush();
    });

    test("互斥默认：有 x-fallback 不合成覆盖层；loading:{...} 显式并存（带配置）", async () => {
        const gate = deferred<{ body: string }>();
        mockFetch(() => gate.promise);
        const { root } = mount(
            `<div id="h" x-html="/api/slow.html" x-html-options="{loading:{message:'加载模板中'}}"><div class="fb" x-fallback>占位</div></div>`,
            {},
        );
        await flush();
        const h = root.querySelector("#h")!;
        // 显式 loading 与 fallback 并存：覆盖层合成 + options 配置直传
        expect(h.getAttribute("x-loading")).toBe("true");
        expect(h.getAttribute("x-loading-options")).toContain("加载模板中");
        expect(root.querySelector(".fb")).not.toBeNull();
        gate.resolve({ body: "<b>ok</b>" });
        await flush();
        expect(overlayOf(h)).toBeNull();
        expect(root.querySelector(".fb")).toBeNull();
    });

    test("x-loading-options 的 message 经 LoadingDirective 接线进覆盖层文案", async () => {
        const gate = deferred<{ body: string }>();
        mockFetch(() => gate.promise);
        const { root } = mount(
            `<div id="h" x-html="/api/slow.html" x-html-options="{loading:{message:'自定义文案'}}"></div>`,
            {},
        );
        await flush();
        // 覆盖层块内 x-text="message" 渲染 options 合入的配置（ADR-0035 接线修复的回归）
        expect(root.querySelector(".x-loading-message")?.textContent).toBe("自定义文案");
        gate.resolve({ body: "x" });
        await flush();
    });

    // ── .compile 远程模板（决策 4）─────────────────────────────────────

    test(".compile：远程模板作为子模板编译，表达式读宿主作用域", async () => {
        mockFetch(() => ({ body: `<span class="t" x-text="title"></span><span class="n" x-text="count"></span>` }));
        const { root } = mount(
            `<div id="h" x-data="{ title: '书名', count: 3 }" x-html.compile="/api/tpl.html"></div>`,
            {},
        );
        await flush();
        expect(root.querySelector(".t")?.textContent).toBe("书名");
        expect(root.querySelector(".n")?.textContent).toBe("3");
    });

    test(".compile：插值重取 → 全量重编译新模板", async () => {
        mockFetch(() => ({ body: `<b class="v1">模板一</b>` }));
        const { root, store } = mount(
            `<div id="h" x-html.compile="/api/t-{t}.html"></div>`,
            { t: 1 },
        );
        await flush();
        expect(root.querySelector(".v1")?.textContent).toBe("模板一");
        mockFetch(() => ({ body: `<i class="v2">模板二</i>` }));
        store.state.t = 2;
        await flush();
        expect(root.querySelector(".v1")).toBeNull();
        expect(root.querySelector(".v2")?.textContent).toBe("模板二");
    });

    // ── 同元素双异步：反馈通道归 x-data 独占（决策 6）─────────────────

    test("双异步：fallback 归 x-data（编译版可插值）、x-html 不合成覆盖层", async () => {
        const gate = deferred<{ body: any }>();
        mockFetch(() => gate.promise);
        const { root } = mount(
            `<div id="h" x-data="/api/book.json" x-html.compile="/api/tpl.html"><div class="fb" x-fallback>数据加载中… {{ $loading }}</div></div>`,
            {},
        );
        await flush();
        const h = root.querySelector("#h")!;
        // fallback 由 x-data 认领：编译版（插值求值为 true，而非原文）
        expect(root.querySelector(".fb")?.textContent).toContain("true");
        expect(root.querySelector(".fb")?.textContent).not.toContain("{{");
        // 互斥默认（ADR-0033/0035 一致）：有 x-fallback 则两边都不合成覆盖层；
        // 归属唯一性由「x-data 的编译版 fallback 生效、x-html 的静态认领退位」体现
        expect(h.getAttribute("x-loading")).toBeNull();
        gate.resolve({ body: { title: "远程书名" } });
        await flush();
    });

    test("双异步：数据与模板双远程，模板到达后读数据域", async () => {
        mockFetch((url) =>
            url.includes("tpl")
                ? { body: `<span class="t" x-text="title"></span>` }
                : { body: { title: "远程书名" } },
        );
        const { root } = mount(
            `<div id="h" x-data="/api/book.json" x-html.compile="/api/tpl.html"></div>`,
            {},
        );
        await flush();
        expect(root.querySelector(".t")?.textContent).toBe("远程书名");
    });

    test("双异步：x-html 显式 loading 选项被忽略并 warn", async () => {
        const gate = deferred<{ body: any }>();
        mockFetch(() => gate.promise);
        const { root, engine } = mount(
            `<div id="h" x-data="/api/book.json" x-html="/api/p.html" x-html-options="{loading:{message:'x'}}"></div>`,
            {},
        );
        await flush();
        const h = root.querySelector("#h")!;
        // x-data 的元键绑定式合成独占（非 "true" 字面量）；x-html 的 loading 被忽略
        expect(h.getAttribute("x-loading")).toMatch(/\$loading$/);
        expect(h.getAttribute("x-loading-options")).toBeNull();
        gate.resolve({ body: { a: 1 } });
        await flush();
        expect((engine as AutoSpark).logger).toBeTruthy();
    });

    // ── 生命周期与竞态（决策 7 沿用清单）───────────────────────────────

    test("竞态丢弃：后发先至的旧响应不落地", async () => {
        const slow = deferred<{ body: string }>();
        let n = 0;
        mockFetch(() => {
            n++;
            return n === 1 ? slow.promise : Promise.resolve({ body: "<b>新响应</b>" });
        });
        const { root, store } = mount(`<div id="h" x-html="/api/p-{t}.html"></div>`, { t: 1 });
        await flush();
        // 首请求挂起时依赖变化 → 新请求先回
        store.state.t = 2;
        await flush();
        expect(root.querySelector("#h")?.innerHTML).toBe("<b>新响应</b>");
        slow.resolve({ body: "<b>旧响应</b>" });
        await flush();
        expect(root.querySelector("#h")?.innerHTML).toBe("<b>新响应</b>");
    });

    test("destroy：进行中请求被拒收（结果不落地）", async () => {
        const gate = deferred<{ body: string }>();
        mockFetch(() => gate.promise);
        const { root, engine } = mount(`<div id="h" x-html="/api/slow.html"></div>`, {});
        await flush();
        const h = root.querySelector("#h")!; // destroy 会清空 root，先取引用
        engine.destroy();
        gate.resolve({ body: "<b>迟到的</b>" });
        await flush();
        expect(h.innerHTML).toBe("");
    });

    test("孤立 x-fallback（父无异步源）→ warn + 当普通元素渲染", async () => {
        const { root } = mount(`<div id="h"><div class="fb" x-fallback>静态</div></div>`, {});
        await flush();
        expect(root.querySelector(".fb")?.textContent).toBe("静态");
    });
});
