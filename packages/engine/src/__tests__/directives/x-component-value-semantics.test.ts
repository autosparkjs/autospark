import { describe, test, expect, afterEach } from "bun:test";
import { mount, nextTick } from "../helpers";
import "../setup";
import { AutoSpark } from "../../engine/engine";

/**
 * x-component 值语义三分与 options 扩展测试（ADR-0110）。
 *
 * 覆盖：
 * - 无参 url 简写：字面量直载（单组件自动命名）/ 表达式求值（string→url 响应式重载、
 *   object→loader 配置）/ props 走 x-component-options.props（整包静态 + 成员表达式）
 * - 多组件返回：无参取文档序首个 + warn（per-url 去重）；有参显式指定（includes 校验）
 * - props 双源合并：Object.assign(optionsProps, 指令值)——指令值覆盖同名键；无效源独走；
 *   响应式重算合并；合并防抖（内部交互状态不被重置）
 * - loader 平铺归一：fallback/error 等顶层键（成员属性响应式）> loader 对象内嵌同名键；
 *   双 url 声明 warn + 指令值胜
 * - 实例级边界覆盖：x-component-options.open 显式布尔（含 false）覆盖 def.open
 */

/** 挂载并拦截 logger.warn（编译期同步 warn 也可靠捕获） */
function mountCaptureWarn(html: string, state: any) {
    const root = document.createElement("div");
    root.innerHTML = html.trim();
    const engine = new AutoSpark(root, state, { autostart: false });
    const warns: string[] = [];
    (engine.logger as any).warn = (msg: any) => warns.push(String(msg));
    engine.compile();
    return { root, engine, warns };
}

/** 原始 fetch（afterEach 恢复，防 mock 泄漏） */
const realLoaderFetch = globalThis.fetch;

/** fetch 调用记录 + 可编程应答（同 x-component.test.ts 约定） */
function mockLoaderFetch(handler: (url: string, init?: RequestInit) => any) {
    const calls: Array<{ url: string }> = [];
    (globalThis as any).fetch = async (url: any, init?: any) => {
        calls.push({ url: String(url) });
        let res = handler(String(url), init);
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
function loaderDeferred<T>() {
    let resolve!: (v: T) => void;
    const promise = new Promise<T>((res) => {
        resolve = res;
    });
    return { promise, resolve };
}

/** 等 fetch 微任务链 + scheduler flush（宏任务一跳） */
const flushLoader = async () => {
    await Promise.resolve();
    await new Promise<void>((r) => setTimeout(r, 0));
};

describe("x-component 值语义三分（ADR-0110）", () => {
    afterEach(() => {
        (globalThis as any).fetch = realLoaderFetch;
    });

    test("无参字面量 url 直载：单组件自动命名实例化", async () => {
        mockLoaderFetch(() => ({
            body: `<div x-define="ra"><b class="v">内容</b></div>`,
        }));
        const { root, warns } = mountCaptureWarn(
            `<div x-scope><div id="h" x-component="/rc.html"></div></div>`,
            {},
        );
        await flushLoader();
        expect(root.querySelector("#h .v")?.textContent).toBe("内容");
        expect(warns.some((w) => w.includes("取文档序首个"))).toBe(false);
    });

    test("无参 url + x-component-options.props 整包静态：props 注入", async () => {
        mockLoaderFetch(() => ({
            body: `<div x-define="ra"><b class="v" x-text="msg"></b></div>`,
        }));
        const { root } = mountCaptureWarn(
            `<div x-scope><div id="h" x-component="/rc.html" x-component-options.props="{ msg: '外部注入' }"></div></div>`,
            {},
        );
        await flushLoader();
        expect(root.querySelector("#h .v")?.textContent).toBe("外部注入");
    });

    test("无参 url + props 成员属性表达式：响应式（状态变化 → 组件更新）", async () => {
        mockLoaderFetch(() => ({
            body: `<div x-define="ra"><b class="v" x-text="msg"></b></div>`,
        }));
        const { root, engine } = mountCaptureWarn(
            `<div x-scope><div id="h" x-component="/rc.html" x-component-options.props="ps"></div></div>`,
            { ps: { msg: "初值" } },
        );
        await flushLoader();
        expect(root.querySelector("#h .v")?.textContent).toBe("初值");
        (engine.store.state as any).ps = { msg: "新值" };
        await nextTick();
        expect(root.querySelector("#h .v")?.textContent).toBe("新值");
    });

    test("无参 url 表达式：string→url 响应式重载（名字随新清单重新决策）", async () => {
        mockLoaderFetch((url) => ({
            body:
                url === "/1.html"
                    ? `<div x-define="p1"><b class="v">页一</b></div>`
                    : `<div x-define="p2"><b class="v">页二</b></div>`,
        }));
        const { root, engine } = mountCaptureWarn(
            `<div x-scope><div id="h" x-component="urlState"></div></div>`,
            { urlState: "/1.html" },
        );
        await flushLoader();
        expect(root.querySelector("#h .v")?.textContent).toBe("页一");
        (engine.store.state as any).urlState = "/2.html";
        await nextTick();
        await flushLoader();
        // url 变化后清单不含旧名 p1：无参形态重新决策为 p2（而非误走同名校验失败）
        expect(root.querySelector("#h .v")?.textContent).toBe("页二");
    });

    test("无参 url 表达式：object→loader 配置（平铺 fallback 生效）", async () => {
        const gate = loaderDeferred<{ body: string }>();
        mockLoaderFetch(() => gate.promise);
        const { root } = mountCaptureWarn(
            `<div x-scope><div id="h" x-component="cfg"></div></div>`,
            { cfg: { url: "/rc.html", fallback: `<i class="ph">载入中</i>` } },
        );
        await flushLoader();
        expect(root.querySelector("#h .ph")?.textContent).toBe("载入中");
        gate.resolve({ body: `<div x-define="ra"><b>ok</b></div>` });
        await flushLoader();
        expect(root.querySelector("#h .ph")).toBeNull();
        expect(root.querySelector("#h b")?.textContent).toBe("ok");
    });

    test("无参 url 返回多组件：取文档序首个 + warn 一次（per-url 去重）", async () => {
        mockLoaderFetch(() => ({
            body: `<div x-define="first"><b class="v">首个</b></div><div x-define="second"><i>次个</i></div>`,
        }));
        const { root, warns } = mountCaptureWarn(
            `<div x-scope><div id="h" x-component="/m.html"></div></div>`,
            {},
        );
        await flushLoader();
        expect(root.querySelector("#h .v")?.textContent).toBe("首个");
        const hits = warns.filter((w) => w.includes("取文档序首个"));
        expect(hits.length).toBe(1);
        expect(hits[0]).toContain('x-component:first="/m.html"');
    });

    test("有参 url 字面量：显式指定多组件之一（includes 校验命中）", async () => {
        mockLoaderFetch(() => ({
            body: `<div x-define="first"><b>首个</b></div><div x-define="second"><i class="v">次个</i></div>`,
        }));
        const { root, warns } = mountCaptureWarn(
            `<div x-scope><div id="h" x-component:second="/m.html"></div></div>`,
            {},
        );
        await flushLoader();
        expect(root.querySelector("#h .v")?.textContent).toBe("次个");
        expect(warns.some((w) => w.includes("取文档序首个"))).toBe(false);
    });

    test("有参 url 字面量 + options.props：url 占值，props 单源生效", async () => {
        mockLoaderFetch(() => ({
            body: `<div x-define="second"><i class="v" x-text="msg"></i></div>`,
        }));
        const { root } = mountCaptureWarn(
            `<div x-scope><div id="h" x-component:second="/m.html" x-component-options.props="{ msg: '显式名场景' }"></div></div>`,
            {},
        );
        await flushLoader();
        expect(root.querySelector("#h .v")?.textContent).toBe("显式名场景");
    });
});

describe("props 双源合并（ADR-0110）", () => {
    test("指令值 props 与 options.props 合并：指令值覆盖同名键、异名键并集", async () => {
        const { root } = mount(
            `<div x-scope>
                <div id="h" x-component:box="{ a: 1, b: 2 }" x-component-options.props="{ b: 20, c: 30 }"></div>
                <div x-define="box">
                    <span class="a" x-text="a"></span><span class="b" x-text="b"></span><span class="c" x-text="c"></span>
                </div>
             </div>`,
            {},
        );
        await nextTick();
        expect(root.querySelector(".a")?.textContent).toBe("1");
        expect(root.querySelector(".b")?.textContent).toBe("2"); // 指令值覆盖
        expect(root.querySelector(".c")?.textContent).toBe("30"); // options.props 独有
    });

    test("options.props 成员属性表达式响应式：变化重算合并", async () => {
        const { root, engine } = mount(
            `<div x-scope>
                <div id="h" x-component:box="{ a: 1 }" x-component-options.props="ps"></div>
                <div x-define="box">
                    <span class="a" x-text="a"></span><span class="b" x-text="b"></span>
                </div>
             </div>`,
            { ps: { b: "一" } },
        );
        await nextTick();
        expect(root.querySelector(".b")?.textContent).toBe("一");
        (engine.store.state as any).ps = { b: "二" };
        await nextTick();
        expect(root.querySelector(".a")?.textContent).toBe("1"); // 指令值源稳定
        expect(root.querySelector(".b")?.textContent).toBe("二");
    });

    test("指令值标量 warn：options.props 独走（无效源按缺失处理）", async () => {
        const root = document.createElement("div");
        root.innerHTML = `<div x-scope>
                <div id="h" x-component:box="order.label" x-component-options.props="{ a: '选项源' }"></div>
                <div x-define="box"><span class="a" x-text="a"></span></div>
             </div>`.trim();
        const engine = new AutoSpark(root, { order: { label: "标量" } }, { autostart: false });
        const warns: string[] = [];
        (engine.logger as any).warn = (msg: any) => warns.push(String(msg));
        engine.compile();
        await nextTick();
        expect(root.querySelector(".a")?.textContent).toBe("选项源");
        expect(warns.some((w) => w.includes("props 值须为对象"))).toBe(true);
    });

    test("双源合并防抖：字面量 props 实例内部交互状态不被任意状态变化重置", async () => {
        const { root, engine } = mount(
            `<div x-scope>
                <div x-define="counter">
                    <span class="c" x-text="count"></span>
                    <button class="inc" x-on:click="count = count + 1">+</button>
                </div>
                <div id="h" x-component:counter="{ count: 100 }" x-component-options.props="{ step: 5 }"></div>
             </div>`,
            {},
        );
        await nextTick();
        expect(root.querySelector(".c")?.textContent).toBe("100");
        root.querySelector<HTMLButtonElement>(".inc")!.click();
        await nextTick();
        // 无关状态变化触发合并重算（键值相同的新对象）：浅等跳过，101 不被打回 100
        (engine.store.state as any).noise = 1;
        await nextTick();
        expect(root.querySelector(".c")?.textContent).toBe("101");
    });
});

describe("loader 平铺归一（ADR-0110）", () => {
    afterEach(() => {
        (globalThis as any).fetch = realLoaderFetch;
    });

    test("平铺 fallback 成员属性：加载中显示、完成后清除", async () => {
        const gate = loaderDeferred<{ body: string }>();
        mockLoaderFetch(() => gate.promise);
        const { root } = mount(
            `<div x-scope><div id="h" x-component:rb="/rc.html" x-component-options.fallback="'<i class=ph>平铺载入</i>'"></div></div>`,
            {},
        );
        await flushLoader();
        expect(root.querySelector("#h .ph")?.textContent).toBe("平铺载入");
        gate.resolve({ body: `<div x-define="rb"><b>ok</b></div>` });
        await flushLoader();
        expect(root.querySelector("#h .ph")).toBeNull();
        expect(root.querySelector("#h b")?.textContent).toBe("ok");
    });

    test("平铺键 > loader 对象内嵌同名键", async () => {
        const gate = loaderDeferred<{ body: string }>();
        mockLoaderFetch(() => gate.promise);
        const { root } = mount(
            `<div x-scope><div id="h" x-component:rb x-component-options="{ loader: { url: '/rc.html', fallback: '<i class=inner>内嵌</i>' }, fallback: '<i class=flat>平铺</i>' }"></div></div>`,
            {},
        );
        await flushLoader();
        expect(root.querySelector("#h .flat")?.textContent).toBe("平铺");
        expect(root.querySelector("#h .inner")).toBeNull();
        gate.resolve({ body: `<div x-define="rb"><b>ok</b></div>` });
        await flushLoader();
    });

    test("双 url 声明：warn + 指令值 url 胜", async () => {
        const calls = mockLoaderFetch(() => ({
            body: `<div x-define="rb"><b class="v">指令值版</b></div>`,
        }));
        const { root, warns } = mountCaptureWarn(
            `<div x-scope><div id="h" x-component:rb="/v.html" x-component-options.loader="/l.html"></div></div>`,
            {},
        );
        await flushLoader();
        expect(calls.length).toBe(1);
        expect(calls[0]!.url).toBe("/v.html");
        expect(root.querySelector("#h .v")?.textContent).toBe("指令值版");
        expect(warns.some((w) => w.includes("双声明"))).toBe(true);
    });
});

describe("实例级边界覆盖（ADR-0110 extends x-define-options）", () => {
    test("x-component-options.open=false：关闭已 open 的组件（显式布尔覆盖 def.open）", async () => {
        const { root } = mount(
            `<div x-data="{ tip: '外部数据' }">
                <div x-scope>
                    <div x-define="card" x-define-options="{ open: true }"><span x-text="tip"></span></div>
                    <div id="h" x-component:card x-component-options="{ open: false }"></div>
                </div>
             </div>`,
            {},
        );
        await nextTick();
        // 实例级覆盖为封闭：读不到宿主数据域（渲染空），且不回写 def（其他实例不受影响）
        expect(root.querySelector<HTMLSpanElement>("#h span")!.textContent!.trim()).toBe("");
    });

    test("open:true 组件与 open:false 实例共存：互不影响（覆盖仅实例级）", async () => {
        const { root } = mount(
            `<div x-data="{ tip: '外部数据' }">
                <div x-scope>
                    <div x-define="card" x-define-options="{ open: true }"><span x-text="tip"></span></div>
                    <div id="h1" x-component:card></div>
                    <div id="h2" x-component:card x-component-options="{ open: false }"></div>
                </div>
             </div>`,
            {},
        );
        await nextTick();
        expect(root.querySelector<HTMLSpanElement>("#h1 span")!.textContent).toBe("外部数据");
        expect(root.querySelector<HTMLSpanElement>("#h2 span")!.textContent!.trim()).toBe("");
    });

    test("open=false + dataContext 声明：warn + 保持封闭（沿用 ADR-0053 校验）", async () => {
        const root = document.createElement("div");
        root.innerHTML = `<div x-data="{ tip: '外部数据' }">
                <div x-scope>
                    <div x-define="card" x-define-options="{ open: true }"><span x-text="tip"></span></div>
                    <div id="h" x-component:card x-component-options="{ open: false, dataContext: 'declarer' }"></div>
                </div>
             </div>`.trim();
        const engine = new AutoSpark(root, {}, { autostart: false });
        const warns: string[] = [];
        (engine.logger as any).warn = (msg: any) => warns.push(String(msg));
        engine.compile();
        await nextTick();
        expect(root.querySelector("#h span")!.textContent!.trim()).toBe("");
        expect(warns.some((w) => w.includes("未声明 open"))).toBe(true);
    });
});
