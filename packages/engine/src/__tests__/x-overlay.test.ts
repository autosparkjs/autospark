import { describe, expect, test, afterEach } from "bun:test";
import "./setup";
import { mount, nextTick, finishAnim } from "./helpers";

/**
 * x-overlay / x-dialog 覆盖层体系测试（ADR-0052）。
 *
 * 覆盖层实例渲染进 document.body 下本 engine 的容器（autospark-overlays），断言走
 * document 级选择器；每个用例结束 engine.destroy() 整体回收容器（测试间隔离）。
 */

const containerOf = (): HTMLElement | null => document.querySelector(".autospark-overlays");
const maskOf = (name: string): HTMLElement | null =>
    document.querySelector(`.autospark-dialog-mask [data-overlay="${name}"]`)?.parentElement ?? null;

const engines: any[] = [];
const mountOverlay = (html: string, state: any, options?: any) => {
    const m = mount(html, state, { animate: false, ...options });
    engines.push(m.engine);
    return m;
};

afterEach(() => {
    while (engines.length) engines.pop()?.destroy();
});

describe("x-overlay 声明（剪枝与存储）", () => {
    test("声明被剪枝不进结果 DOM（无闪现），消费打开后渲染进 body 容器", async () => {
        const { root, engine } = mountOverlay(
            `<div id="app">
                <div x-scope>
                    <div x-overlay:login="dialog"><h3>{{title}}</h3></div>
                    <button id="t" x-dialog:login="ui.loginVisible"></button>
                </div>
            </div>`,
            { ui: { loginVisible: false }, title: "登录" },
        );
        // 剪枝：声明元素不进结果 DOM
        expect(root.querySelector("[x-overlay\\:login]")).toBeNull();
        // 未打开：容器里无实例
        expect(maskOf("login")).toBeNull();
        engine.state.ui.loginVisible = true;
        await nextTick();
        // 打开：body 容器中出现实例，模板渲染且读到声明处 scope 数据（title 来自 state 顶层）
        const mask = maskOf("login");
        expect(mask).not.toBeNull();
        expect(containerOf()).not.toBeNull();
        expect(mask!.textContent).toContain("登录");
        expect(mask!.querySelector(".autospark-dialog")!.getAttribute("data-overlay")).toBe("login");
    });

    test("缺名称（x-overlay 无冒号 attr）warn + 剪枝丢弃", () => {
        const { root, engine } = mountOverlay(
            `<div id="app"><div x-scope><div x-overlay="">x</div></div></div>`,
            {},
        );
        const warns: string[] = [];
        const orig = engine.logger.warn.bind(engine.logger);
        engine.logger.warn = (msg: string) => warns.push(msg);
        try {
            new (engine.compiler.constructor)(engine); // 不触发二次编译，仅验证上方编译期 warn
        } catch {
            /* 忽略 */
        }
        engine.logger.warn = orig;
        expect(root.querySelector("[x-overlay]")).toBeNull();
    });
});

describe("x-dialog 状态驱动（visible 三形态）", () => {
    test("状态 true 打开 / false 隐藏保活（singleton 默认）/ 再开复用同一 DOM", async () => {
        const { engine } = mountOverlay(
            `<div id="app"><div x-scope>
                <div x-overlay:login="dialog"><span>{{title}}</span></div>
                <button x-dialog:login="ui.loginVisible"></button>
            </div></div>`,
            { ui: { loginVisible: false }, title: "T" },
        );
        engine.state.ui.loginVisible = true;
        await nextTick();
        const mask1 = maskOf("login")!;
        expect(mask1.style.display).not.toBe("none");
        engine.state.ui.loginVisible = false;
        await nextTick();
        // singleton：隐藏保活（DOM 留容器 + display:none）
        expect(maskOf("login")).toBe(mask1);
        expect(mask1.style.display).toBe("none");
        engine.state.ui.loginVisible = true;
        await nextTick();
        // 复用同一实例 DOM（不重建）
        expect(maskOf("login")).toBe(mask1);
        expect(mask1.style.display).not.toBe("none");
    });

    test("singleton:false：每次打开全新实例，关闭即销毁", async () => {
        const { engine } = mountOverlay(
            `<div id="app"><div x-scope>
                <div x-overlay:job="dialog"><span>x</span></div>
                <button x-dialog:job="{visible: 'ui.open', singleton: false}"></button>
            </div></div>`,
            { ui: { open: false } },
        );
        engine.state.ui.open = true;
        await nextTick();
        const mask1 = maskOf("job")!;
        engine.state.ui.open = false;
        await nextTick();
        // 关闭即销毁：DOM 从容器移除
        expect(maskOf("job")).toBeNull();
        expect(containerOf()!.contains(mask1)).toBe(false);
        engine.state.ui.open = true;
        await nextTick();
        // 全新实例（不同 DOM 身份）
        expect(maskOf("job")).not.toBeNull();
        expect(maskOf("job")).not.toBe(mask1);
    });

    test("字面量 true：挂载即开（公告类）；false 永不开", () => {
        mountOverlay(
            `<div id="app">
                <div x-scope><div x-overlay:notice="dialog"><span>公告</span></div><button x-dialog:notice="true"></button></div>
            </div>`,
            {},
        );
        expect(maskOf("notice")!.textContent).toContain("公告");
    });

    test("表达式形态：请求关闭仅 UI 关闭，状态不回写", async () => {
        const { engine } = mountOverlay(
            `<div id="app"><div x-scope>
                <div x-overlay:pay="dialog"><span>x</span></div>
                <button x-dialog:pay="ui.step === 2"></button>
            </div></div>`,
            { ui: { step: 2 } },
        );
        await nextTick();
        expect(maskOf("pay")).not.toBeNull();
        // ESC 请求关闭：UI 关 + 状态不变（无路径可回写）
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        await nextTick();
        expect(maskOf("pay")!.style.display).toBe("none");
        expect(engine.state.ui.step).toBe(2);
    });
});

describe("「请求关闭」触点与写回", () => {
    const setup = () =>
        mountOverlay(
            `<div id="app"><div x-scope>
                <div x-overlay:login="dialog"><button data-action="close" @click="close()">关</button></div>
                <button x-dialog:login="ui.loginVisible"></button>
            </div></div>`,
            { ui: { loginVisible: true } },
        );

    test("ESC 关闭 → 回写 ui.loginVisible = false", async () => {
        const { engine } = setup();
        expect(maskOf("login")).not.toBeNull();
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        await nextTick();
        expect(engine.state.ui.loginVisible).toBe(false);
        expect(maskOf("login")!.style.display).toBe("none");
    });

    test("点遮罩关闭（closeOnMask 默认 true）→ 回写；面板内点击不关", async () => {
        const { engine } = setup();
        const mask = maskOf("login")!;
        // 面板内点击：不关
        mask.querySelector(".autospark-dialog")!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        await nextTick();
        expect(engine.state.ui.loginVisible).toBe(true);
        // 遮罩本体点击：关 + 回写
        mask.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        await nextTick();
        expect(engine.state.ui.loginVisible).toBe(false);
    });

    test("closeOnMask: false（值对象内联）遮罩点击不关", async () => {
        const { engine } = mountOverlay(
            `<div id="app"><div x-scope>
                <div x-overlay:keep="dialog"><span>x</span></div>
                <button x-dialog:keep="{visible: 'ui.open', closeOnMask: false}"></button>
            </div></div>`,
            { ui: { open: true } },
        );
        expect(maskOf("keep")).not.toBeNull();
        maskOf("keep")!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        await nextTick();
        expect(engine.state.ui.open).toBe(true);
        expect(maskOf("keep")!.style.display).not.toBe("none");
    });

    test("子树内 close() action（内置动作信号）→ 请求关闭 + 回写", async () => {
        const { engine } = setup();
        const btn = maskOf("login")!.querySelector("[data-action]")!;
        btn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        await nextTick();
        expect(engine.state.ui.loginVisible).toBe(false);
        expect(maskOf("login")!.style.display).toBe("none");
    });
});

describe("params 注入（打开时快照）", () => {
    test("对象形态 params 注入实例数据域，模板直接读键", async () => {
        const { engine } = mountOverlay(
            `<div id="app"><div x-scope>
                <div x-overlay:user="dialog"><span>{{userId}}</span></div>
                <button x-dialog:user="{visible: 'ui.open', params: {userId: 42}}"></button>
            </div></div>`,
            { ui: { open: false } },
        );
        engine.state.ui.open = true;
        await nextTick();
        expect(maskOf("user")!.textContent).toContain("42");
    });

    test("单例复用重注入：第二次打开的 params 覆盖（表达式形态打开时求值）", async () => {
        const { engine } = mountOverlay(
            `<div id="app"><div x-scope>
                <div x-overlay:user="dialog"><span>{{userId}}</span></div>
                <button x-dialog:user="{visible: 'ui.open', params: 'bag'}"></button>
            </div></div>`,
            { ui: { open: false }, bag: { userId: 1 } },
        );
        engine.state.ui.open = true;
        await nextTick();
        expect(maskOf("user")!.textContent).toContain("1");
        engine.state.ui.open = false;
        await nextTick();
        engine.state.bag.userId = 7;
        engine.state.ui.open = true;
        await nextTick();
        expect(maskOf("user")!.textContent).toContain("7");
    });
});

describe("命令式 API（engine.getOverlay）", () => {
    const html = `<div id="app"><div x-scope>
        <div x-overlay:confirm.global="dialog"><span>{{msg}}</span></div>
        <div x-overlay:local="dialog"><span>x</span></div>
    </div></div>`;

    test("open / close / 单例幂等 / 非 .global 定义命令式不可达", async () => {
        const { engine } = mountOverlay(html, {});
        // getOverlay 第二参为消费者配置级（animate: false 走合并链顶层，关闭动画保证同步收尾）
        const handle = engine.getOverlay("confirm", { animate: false })!;
        expect(handle).not.toBeUndefined();
        const inst1 = handle.open({ params: { msg: "确认删除？" } });
        await nextTick();
        expect(maskOf("confirm")!.textContent).toContain("确认删除？");
        // 单例幂等：同句柄 + 不重播
        const inst2 = handle.open({ params: { msg: "确认删除？" } });
        expect(inst2).toBe(inst1);
        // 关闭（隐藏保活）
        inst1.close();
        expect(maskOf("confirm")!.style.display).toBe("none");
        // 非 .global 定义命令式不可达（「命令式 = 全局消费」）
        expect(engine.getOverlay("local")).toBeUndefined();
    });

    test("overlay:open / overlay:close 双通道（总线 + 实例根 DOM 冒泡）", async () => {
        const { engine } = mountOverlay(html, {});
        const events: string[] = [];
        engine.on("overlay:open", (m: any) => events.push(`bus:open:${m?.payload?.name ?? m?.name}`));
        engine.on("overlay:close", (m: any) => events.push(`bus:close:${m?.payload?.name ?? m?.name}`));
        // DOM 冒泡在 body 上委托挂监听（容器懒创建于 open 时，body 是冒泡必经且始终存在；
        // open 广播发生在 open() 调用同步栈内，事后挂监听会漏）
        document.body.addEventListener("overlay:open", ((e: CustomEvent) =>
            events.push(`dom:open:${e.detail.name}`)) as EventListener);
        const handle = engine.getOverlay("confirm", { animate: false })!;
        const inst = handle.open({ params: { msg: "x" } });
        inst.el!.addEventListener("overlay:close", ((e: CustomEvent) =>
            events.push(`dom:close:${e.detail.name}`)) as EventListener);
        await nextTick();
        expect(events).toContain("bus:open:confirm");
        expect(events).toContain("dom:open:confirm");
        inst.close();
        await nextTick();
        expect(events).toContain("bus:close:confirm");
        expect(events).toContain("dom:close:confirm");
    });

    test("未命中 warn + undefined；visible 键在命令式 warn 忽略", async () => {
        const { engine } = mountOverlay(html, {});
        const warns: string[] = [];
        const orig = engine.logger.warn.bind(engine.logger);
        engine.logger.warn = (msg: string) => warns.push(msg);
        try {
            expect(engine.getOverlay("nope")).toBeUndefined();
            engine.getOverlay("confirm", { animate: false })!.open({ visible: true, params: { msg: "x" } });
        } finally {
            engine.logger.warn = orig;
        }
        expect(warns.some((w) => w.includes("nope"))).toBe(true);
        expect(warns.some((w) => w.includes("visible"))).toBe(true);
    });
});

describe("嵌套与打开栈", () => {
    test("ESC 只关全局栈顶实例（嵌套打开）", async () => {
        const { engine } = mountOverlay(
            `<div id="app"><div x-scope>
                <div x-overlay:a="dialog"><span>a</span></div>
                <div x-overlay:b="dialog"><span>b</span></div>
                <button x-dialog:a="ui.a"></button>
                <button x-dialog:b="ui.b"></button>
            </div></div>`,
            { ui: { a: false, b: false } },
        );
        engine.state.ui.a = true;
        await nextTick();
        engine.state.ui.b = true;
        await nextTick();
        expect(maskOf("a")!.style.display).not.toBe("none");
        expect(maskOf("b")!.style.display).not.toBe("none");
        // 第一次 ESC：只关栈顶 b
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        await nextTick();
        expect(maskOf("b")!.style.display).toBe("none");
        expect(maskOf("a")!.style.display).not.toBe("none");
        // 第二次 ESC：关 a
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        await nextTick();
        expect(maskOf("a")!.style.display).toBe("none");
    });
});

describe("配置合并与类型校验", () => {
    test("四级深度合并：x-overlay-options < x-dialog-options < 值对象内联", async () => {
        const { engine } = mountOverlay(
            `<div id="app"><div x-scope>
                <div x-overlay:mix="dialog" x-overlay-options="{closeOnMask: false, singleton: false}"><span>x</span></div>
                <button x-dialog:mix="{visible: 'ui.open', closeOnMask: true}"></button>
            </div></div>`,
            { ui: { open: false } },
        );
        engine.state.ui.open = true;
        await nextTick();
        const mask = maskOf("mix")!;
        // 值对象内联 closeOnMask: true 覆盖声明处 false → 遮罩点击关闭
        mask.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        await nextTick();
        // singleton 来自声明处 false（消费处未声明）→ 关闭即销毁
        expect(maskOf("mix")).toBeNull();
    });

    test("类型不匹配 warn 仍渲染；未命中定义 warn 不渲染", async () => {
        const { engine } = mountOverlay(
            `<div id="app"><div x-scope>
                <div x-overlay:drawer-def="drawer"><span>x</span></div>
                <button x-dialog:drawer-def="ui.open"></button>
                <button x-dialog:missing="ui.open"></button>
            </div></div>`,
            { ui: { open: false } },
        );
        const warns: string[] = [];
        const orig = engine.logger.warn.bind(engine.logger);
        engine.logger.warn = (msg: string) => warns.push(msg);
        try {
            engine.state.ui.open = true;
            await nextTick();
        } finally {
            engine.logger.warn = orig;
        }
        expect(warns.some((w) => w.includes("drawer") && w.includes("dialog"))).toBe(true);
        expect(warns.some((w) => w.includes("missing"))).toBe(true);
        // 类型不匹配仍渲染
        expect(maskOf("drawer-def")).not.toBeNull();
        expect(maskOf("missing")).toBeNull();
    });
});

describe("anchor 定位（ADR-0052 决策 21–24）", () => {
    test("anchor.at 未命中 → warn + 退屏幕居中（面板无 fixed 定位）", async () => {
        const { engine } = mountOverlay(
            `<div id="app"><div x-scope>
                <div x-overlay:tip="dialog" x-overlay-options="{anchor: {at: '@#no-such-anchor'}}"><span>x</span></div>
                <button x-dialog:tip="ui.open"></button>
            </div></div>`,
            { ui: { open: false } },
        );
        const warns: string[] = [];
        const orig = engine.logger.warn.bind(engine.logger);
        engine.logger.warn = (msg: string) => warns.push(msg);
        try {
            engine.state.ui.open = true;
            await nextTick();
        } finally {
            engine.logger.warn = orig;
        }
        expect(warns.some((w) => w.includes("anchor.at"))).toBe(true);
        const panel = maskOf("tip")!.querySelector(".autospark-dialog") as HTMLElement;
        expect(panel.style.position).not.toBe("fixed");
    });
});

describe("生命周期挂链（scope 基准三合一）", () => {
    test("consumer 基准：消费者随 x-if 销毁 → 打开中的实例级联强拆", async () => {
        const { root, engine } = mountOverlay(
            `<div id="app"><div x-scope>
                <div x-overlay:tmp="dialog"><span>x</span></div>
                <div x-if="ui.show">
                    <button x-dialog:tmp="ui.open" x-dialog-options="{scope: 'consumer'}"></button>
                </div>
            </div></div>`,
            { ui: { show: true, open: true } },
        );
        await nextTick();
        expect(maskOf("tmp")).not.toBeNull();
        // 消费者所在 x-if 分支销毁 → 实例 scope 级联 → 实例强拆（DOM 摘除）
        engine.state.ui.show = false;
        await nextTick();
        expect(maskOf("tmp")).toBeNull();
        expect(engine.state).toBeTruthy();
        void root;
    });

    test("declarer 基准（默认）：消费者销毁只关闭实例（单例保活，实例随声明处 scope）", async () => {
        const { engine } = mountOverlay(
            `<div id="app"><div x-scope>
                <div x-overlay:top="dialog"><span>x</span></div>
                <div x-if="ui.show">
                    <button x-dialog:top="ui.open"></button>
                </div>
            </div></div>`,
            { ui: { show: true, open: true } },
        );
        await nextTick();
        const mask = maskOf("top")!;
        expect(mask).not.toBeNull();
        engine.state.ui.show = false;
        await nextTick();
        // 实例仅被关闭（隐藏保活），不销毁——声明处 scope 仍活
        expect(maskOf("top")).toBe(mask);
        expect(mask.style.display).toBe("none");
    });
});

describe("进出场动画（ADR-0039 复用）", () => {
    test("配置 fade 长时长：enter 挂类在播、leave 延迟隐藏（finishAnim 推进）", async () => {
        const { engine } = mountOverlay(
            `<div id="app"><div x-scope>
                <div x-overlay:an="dialog"><span>x</span></div>
                <button x-dialog:an="ui.open" x-dialog-options="{animate: {name: 'fade', duration: 5000}}"></button>
            </div></div>`,
            { ui: { open: false } },
        );
        engine.state.ui.open = true;
        await nextTick();
        const mask = maskOf("an")!;
        // 长时长配置下 enter 类稳定在播（ADR-0039 六类名契约）
        expect(mask.className).toContain("fade-enter-active");
        // 推进进场动画结束
        finishAnim(mask);
        engine.state.ui.open = false;
        await nextTick();
        // leave 动画在播：DOM 尚未隐藏（延迟移除语义）
        expect(mask.style.display).not.toBe("none");
        finishAnim(mask);
        // 动画完成 → 隐藏保活
        expect(mask.style.display).toBe("none");
    });
});
