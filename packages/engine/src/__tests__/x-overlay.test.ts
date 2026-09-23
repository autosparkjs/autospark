import { describe, expect, test, afterEach } from "bun:test";
import "./setup";
import { mount, nextTick, finishAnim } from "./helpers";

/**
 * 覆盖物体系测试（ADR-0052 修订版——组件化统一）。
 *
 * 覆盖物内容 = 任意组件（x-component 声明 / options.components 全局 / x-import），消费者
 * x-dialog 渲染进 document.body 下本 engine 的容器（autospark-overlays），断言走 document 级
 * 选择器；每个用例结束 engine.destroy() 整体回收容器（测试间隔离）。
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

describe("消费模型（组件即覆盖物内容）", () => {
    test("x-component 声明剪枝不闪现；消费打开后渲染进 body 容器，读声明处数据", async () => {
        const { root, engine } = mountOverlay(
            `<div id="app">
                <div x-scope>
                    <div x-component="login"><h3>{{title}}</h3></div>
                    <button id="t" x-dialog:login="ui.loginVisible"></button>
                </div>
            </div>`,
            { ui: { loginVisible: false }, title: "登录" },
        );
        // 声明被剪枝：组件声明元素不进结果 DOM（无闪现）
        expect(root.querySelector("[x-component]")).toBeNull();
        // 未打开：容器里无实例
        expect(maskOf("login")).toBeNull();
        engine.state.ui.loginVisible = true;
        await nextTick();
        // 打开：body 容器中出现实例；declarer 基准（默认）沿挂链读声明处可见的 state.title
        const mask = maskOf("login");
        expect(mask).not.toBeNull();
        expect(containerOf()).not.toBeNull();
        expect(mask!.textContent).toContain("登录");
        expect(mask!.querySelector(".autospark-dialog")!.getAttribute("data-overlay")).toBe("login");
    });

    test("全局组件（options.components）可被消费；scope 链就近覆盖全局", async () => {
        const { engine } = mountOverlay(
            `<div id="app"><div x-scope>
                <button x-dialog:g-confirm="ui.open"></button>
            </div></div>`,
            { ui: { open: false }, greet: "全局" },
            { components: { "g-confirm": "<div><span>{{greet}}</span></div>" } },
        );
        engine.state.ui.open = true;
        await nextTick();
        expect(maskOf("g-confirm")!.textContent).toContain("全局");
    });

    test("未命中（scope 链与全局均无）warn + 不渲染", async () => {
        const { engine } = mountOverlay(
            `<div id="app"><div x-scope>
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
        expect(maskOf("missing")).toBeNull();
        expect(warns.some((w) => w.includes("missing"))).toBe(true);
    });

    test("x-import 延迟就绪：component/registered 后自动打开；等待期间归假则放弃", async () => {
        const { root, engine } = mountOverlay(
            `<div id="app"><div x-scope id="host">
                <button x-dialog:late="ui.open"></button>
            </div></div>`,
            { ui: { open: false } },
        );
        engine.state.ui.open = true;
        await nextTick();
        // 未命中：等待中不渲染
        expect(maskOf("late")).toBeNull();
        // 模拟 x-import 就绪：注册组件 + 广播 registered
        const hostScope = engine.findScopeByEl(root.querySelector("#host")!)!;
        const compEl = document.createElement("div");
        compEl.innerHTML = "<span>迟到组件</span>";
        hostScope.components = { late: compEl };
        engine.emit("component/registered", { name: "late" });
        await nextTick();
        expect(maskOf("late")!.textContent).toContain("迟到组件");

        // 等待期间 visible 已归假 → 就绪后不打开
        engine.state.ui.open = false;
        await nextTick();
        expect(maskOf("late")).toBeNull();
        hostScope.components = {};
        engine.state.ui.open = true;
        await nextTick();
        expect(maskOf("late")).toBeNull(); // 未命中 → 等待
        engine.state.ui.open = false;
        await nextTick();
        const compEl2 = document.createElement("div");
        compEl2.innerHTML = "<span>x</span>";
        hostScope.components = { late: compEl2 };
        engine.emit("component/registered", { name: "late" });
        await nextTick();
        expect(maskOf("late")).toBeNull(); // 已归假，放弃打开
    });
});

describe("x-dialog 状态驱动（visible 形态）", () => {
    test("每次打开新实例：关闭即销毁（共识 5 无 singleton），再开全新 DOM", async () => {
        const { engine } = mountOverlay(
            `<div id="app"><div x-scope>
                <div x-component="login"><span>x</span></div>
                <button x-dialog:login="ui.loginVisible"></button>
            </div></div>`,
            { ui: { loginVisible: false } },
        );
        engine.state.ui.loginVisible = true;
        await nextTick();
        const mask1 = maskOf("login")!;
        expect(mask1.style.display).not.toBe("none");
        engine.state.ui.loginVisible = false;
        await nextTick();
        // 关闭即销毁：DOM 从容器移除（非隐藏保活）
        expect(maskOf("login")).toBeNull();
        expect(containerOf()!.contains(mask1)).toBe(false);
        engine.state.ui.loginVisible = true;
        await nextTick();
        // 全新实例（不同 DOM 身份）
        expect(maskOf("login")).not.toBeNull();
        expect(maskOf("login")).not.toBe(mask1);
    });

    test("字面量 true：挂载即开（公告类）；false 永不开", () => {
        mountOverlay(
            `<div id="app">
                <div x-scope><div x-component="notice"><span>公告</span></div><button x-dialog:notice="true"></button></div>
            </div>`,
            {},
        );
        expect(maskOf("notice")!.textContent).toContain("公告");
    });

    test("表达式形态：请求关闭仅 UI 关闭，状态不回写", async () => {
        const { engine } = mountOverlay(
            `<div id="app"><div x-scope>
                <div x-component="pay"><span>x</span></div>
                <button x-dialog:pay="ui.step === 2"></button>
            </div></div>`,
            { ui: { step: 2 } },
        );
        await nextTick();
        expect(maskOf("pay")).not.toBeNull();
        // ESC 请求关闭：UI 关 + 状态不变（无路径可回写）
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        await nextTick();
        expect(maskOf("pay")).toBeNull(); // 关闭即销毁
        expect(engine.state.ui.step).toBe(2);
    });
});

describe("「请求关闭」触点与写回", () => {
    const setup = () =>
        mountOverlay(
            `<div id="app"><div x-scope>
                <div x-component="login"><button data-action="close" @click="close()">关</button></div>
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
        expect(maskOf("login")).toBeNull();
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
                <div x-component="keep"><span>x</span></div>
                <button x-dialog:keep="{visible: 'ui.open', closeOnMask: false}"></button>
            </div></div>`,
            { ui: { open: true } },
        );
        expect(maskOf("keep")).not.toBeNull();
        maskOf("keep")!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        await nextTick();
        expect(engine.state.ui.open).toBe(true);
        expect(maskOf("keep")).not.toBeNull();
    });

    test("子树内 close() action（内置动作信号）→ 请求关闭 + 回写", async () => {
        const { engine } = setup();
        const btn = maskOf("login")!.querySelector("[data-action]")!;
        btn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        await nextTick();
        expect(engine.state.ui.loginVisible).toBe(false);
        expect(maskOf("login")).toBeNull();
    });
});

describe("props 注入（共识 7：非保留键全作 props）", () => {
    test("值对象非保留键注入组件 data 域，覆盖 data() 默认", async () => {
        const { engine } = mountOverlay(
            `<div id="app"><div x-scope>
                <div x-component="user">
                    <script setup>{ data() { return { userId: 0, extra: "默认" } } }</script>
                    <span>{{userId}}-{{extra}}</span>
                </div>
                <button x-dialog:user="{visible: 'ui.open', userId: 42}"></button>
            </div></div>`,
            { ui: { open: false } },
        );
        engine.state.ui.open = true;
        await nextTick();
        // props 覆盖 data() 默认（userId: 42），未声明的键保留 data() 默认（extra）
        expect(maskOf("user")!.textContent).toContain("42-默认");
    });

    test("visible 驱动键不作 props；params 键已删除（作普通 props 注入）", async () => {
        const { engine } = mountOverlay(
            `<div id="app"><div x-scope>
                <div x-component="bag"><span>{{params}}</span></div>
                <button x-dialog:bag="{visible: 'ui.open', params: '旧键即普通props'}"></button>
            </div></div>`,
            { ui: { open: false } },
        );
        engine.state.ui.open = true;
        await nextTick();
        expect(maskOf("bag")!.textContent).toContain("旧键即普通props");
    });
});

describe("配置三级链（共识 6）", () => {
    test("内置默认 < x-dialog-options < 值对象内联", async () => {
        const { engine } = mountOverlay(
            `<div id="app"><div x-scope>
                <div x-component="mix"><span>x</span></div>
                <div x-component="mix2"><span>x</span></div>
                <button x-dialog:mix="{visible: 'ui.open', closeOnMask: true}" x-dialog-options="{closeOnMask: false}"></button>
                <button x-dialog:mix2="ui.open2" x-dialog-options="{closeOnMask: false}"></button>
            </div></div>`,
            { ui: { open: false, open2: false } },
        );
        // 值对象内联 closeOnMask: true 覆盖 x-dialog-options 的 false → 遮罩点击关闭
        engine.state.ui.open = true;
        await nextTick();
        const mask1 = maskOf("mix")!;
        mask1.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        await nextTick();
        expect(maskOf("mix")).toBeNull();

        // 内联未写 → x-dialog-options 的 false 覆盖内置默认 true → 遮罩点击不关
        engine.state.ui.open2 = true;
        await nextTick();
        const mask2 = maskOf("mix2")!;
        mask2.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        await nextTick();
        expect(maskOf("mix2")).not.toBeNull();
    });

    test("x-dialog-options 独立生效（animate 走消费处选项）", async () => {
        const { engine } = mountOverlay(
            `<div id="app"><div x-scope>
                <div x-component="an"><span>x</span></div>
                <button x-dialog:an="ui.open" x-dialog-options="{animate: {name: 'fade', duration: 5000}}"></button>
            </div></div>`,
            { ui: { open: false } },
        );
        engine.state.ui.open = true;
        await nextTick();
        const mask = maskOf("an")!;
        expect(mask.className).toContain("fade-enter-active");
        finishAnim(mask);
        engine.state.ui.open = false;
        await nextTick();
        // leave 动画在播：DOM 尚未移除（延迟移除语义）
        expect(containerOf()!.contains(mask)).toBe(true);
        finishAnim(mask);
        expect(containerOf()!.contains(mask)).toBe(false);
    });
});

describe("命令式 API（engine.getOverlay，共识 10 镜像 getComponent）", () => {
    const html = `<div id="app"><div x-scope id="host">
        <div x-component="confirm"><span>{{msg}}</span></div>
    </div></div>`;

    test("el 起链查找 / 省略 el 仅查全局 / open / close / visible warn", async () => {
        const { root, engine } = mountOverlay(html, {}, {
            components: { global: "<div><span>全局覆盖物</span></div>" },
        });
        const host = root.querySelector("#host")!;
        // el 起链查找命中局部 x-component 声明
        const handle = engine.getOverlay(host, "confirm", { animate: false })!;
        expect(handle).not.toBeUndefined();
        const inst1 = handle.open({ msg: "确认删除？" });
        await nextTick();
        expect(maskOf("confirm")!.textContent).toContain("确认删除？");
        inst1.close();
        await nextTick();
        expect(containerOf()!.contains(inst1.el!)).toBe(false);

        // 省略 el：仅查全局（局部定义不可达）
        expect(engine.getOverlay(null, "confirm")).toBeUndefined();
        const gHandle = engine.getOverlay(null, "global")!;
        gHandle.open();
        await nextTick();
        expect(maskOf("global")!.textContent).toContain("全局覆盖物");

        // visible 键在命令式 warn 忽略
        const warns: string[] = [];
        const orig = engine.logger.warn.bind(engine.logger);
        engine.logger.warn = (msg: string) => warns.push(msg);
        try {
            handle.open({ visible: true });
        } finally {
            engine.logger.warn = orig;
        }
        expect(warns.some((w) => w.includes("visible"))).toBe(true);
    });

    test("OverlayHandle.close 关该覆盖物当前全部打开实例", async () => {
        const { root, engine } = mountOverlay(html, {});
        const host = root.querySelector("#host")!;
        const handle = engine.getOverlay(host, "confirm")!;
        const a = handle.open({ msg: "a" });
        const b = handle.open({ msg: "b" });
        await nextTick();
        expect(a).not.toBe(b); // 多实例并存
        handle.close();
        await nextTick();
        expect(containerOf()!.contains(a.el!)).toBe(false);
        expect(containerOf()!.contains(b.el!)).toBe(false);
    });

    test("overlay:open / overlay:close 双通道；payload 收窄 {name, instance, scope}", async () => {
        const { root, engine } = mountOverlay(html, {});
        const host = root.querySelector("#host")!;
        const handle = engine.getOverlay(host, "confirm", { animate: false })!;
        const events: string[] = [];
        engine.on("overlay:open", (m: any) => {
            const p = m?.payload ?? m;
            events.push(`bus:open:${p.name}:type=${p.type === undefined}`);
        });
        document.body.addEventListener("overlay:open", ((e: CustomEvent) =>
            events.push(`dom:open:${e.detail.name}:inst=${!!e.detail.instance}`)) as EventListener);
        const inst = handle.open({ msg: "x" });
        inst.el!.addEventListener("overlay:close", ((e: CustomEvent) =>
            events.push(`dom:close:${e.detail.name}`)) as EventListener);
        await nextTick();
        expect(events).toContain("bus:open:confirm:type=true"); // type 键已删除
        expect(events).toContain("dom:open:confirm:inst=true");
        inst.close();
        await nextTick();
        expect(events).toContain("dom:close:confirm");
    });
});

describe("嵌套与打开栈", () => {
    test("ESC 只关全局栈顶实例（嵌套打开）", async () => {
        const { engine } = mountOverlay(
            `<div id="app"><div x-scope>
                <div x-component="a"><span>a</span></div>
                <div x-component="b"><span>b</span></div>
                <button x-dialog:a="ui.a"></button>
                <button x-dialog:b="ui.b"></button>
            </div></div>`,
            { ui: { a: false, b: false } },
        );
        engine.state.ui.a = true;
        await nextTick();
        engine.state.ui.b = true;
        await nextTick();
        expect(maskOf("a")).not.toBeNull();
        expect(maskOf("b")).not.toBeNull();
        // 第一次 ESC：只关栈顶 b
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        await nextTick();
        expect(maskOf("b")).toBeNull();
        expect(maskOf("a")).not.toBeNull();
        // 第二次 ESC：关 a
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        await nextTick();
        expect(maskOf("a")).toBeNull();
    });
});

describe("dataContext 数据视图基准（共识 8：declarer 默认 / host / 废弃兼容）", () => {
    // 组件声明须在消费者的祖先链上（getComponent 协议）；嵌套 x-data：外层 = 声明处、内层 = 消费处
    const html = (options: string) => `<div id="app"><div x-scope>
        <div x-data="{ title: '声明处' }">
            <div x-component="basis"><span>{{title}}</span></div>
            <div x-data="{ title: '消费处' }">
                <button x-dialog:basis="ui.open"${options}></button>
            </div>
        </div>
    </div></div>`;

    test("declarer 默认：实例读声明处数据，消费者销毁仅关闭（实例随声明处 scope）", async () => {
        const { engine } = mountOverlay(html(""), { ui: { open: true } });
        await nextTick();
        expect(maskOf("basis")!.textContent).toContain("声明处");
        // 关闭再开仍读声明处
        engine.state.ui.open = false;
        await nextTick();
        engine.state.ui.open = true;
        await nextTick();
        expect(maskOf("basis")!.textContent).toContain("声明处");
    });

    test("host 基准：实例读消费处数据", async () => {
        const { engine } = mountOverlay(html(` x-dialog-options="{dataContext: 'host'}"`), {
            ui: { open: true },
        });
        await nextTick();
        expect(maskOf("basis")!.textContent).toContain("消费处");
    });

    test("废弃值 consumer：warn + 映射 host（读消费处数据）", async () => {
        const { engine } = mountOverlay(html(` x-dialog-options="{dataContext: 'consumer'}"`), {
            ui: { open: false },
        });
        const warns: string[] = [];
        const orig = engine.logger.warn.bind(engine.logger);
        engine.logger.warn = (msg: string) => warns.push(msg);
        try {
            engine.state.ui.open = true; // 打开时才解析基准 → warn 在此发生
            await nextTick();
        } finally {
            engine.logger.warn = orig;
        }
        expect(warns.some((w) => w.includes("consumer") && w.includes("host"))).toBe(true);
        expect(maskOf("basis")!.textContent).toContain("消费处");
    });

    test("废弃键 scope：warn + 兜底按 dataContext 解析", async () => {
        const { engine } = mountOverlay(html(` x-dialog-options="{scope: 'host'}"`), {
            ui: { open: false },
        });
        const warns: string[] = [];
        const orig = engine.logger.warn.bind(engine.logger);
        engine.logger.warn = (msg: string) => warns.push(msg);
        try {
            engine.state.ui.open = true;
            await nextTick();
        } finally {
            engine.logger.warn = orig;
        }
        expect(warns.some((w) => w.includes("scope") && w.includes("dataContext"))).toBe(true);
        expect(maskOf("basis")!.textContent).toContain("消费处");
    });
});

describe("delayClose 自动关闭", () => {
    test("delayClose > 0：打开后延时自动请求关闭（走标准链，回写 visible）", async () => {
        const { engine } = mountOverlay(
            `<div id="app"><div x-scope>
                <div x-component="notice"><span>通知</span></div>
                <button x-dialog:notice="{visible: 'ui.open', delayClose: 50}"></button>
            </div></div>`,
            { ui: { open: true } },
        );
        await nextTick();
        expect(maskOf("notice")).not.toBeNull();
        // 50ms 后自动 requestClose('delay') → 简单路径回写 visible = false → 关闭销毁
        await new Promise((r) => setTimeout(r, 150));
        expect(engine.state.ui.open).toBe(false);
        expect(maskOf("notice")).toBeNull();
    });

    test("delayClose 缺省：不自动关闭", async () => {
        const { engine } = mountOverlay(
            `<div id="app"><div x-scope>
                <div x-component="notice2"><span>x</span></div>
                <button x-dialog:notice2="{visible: 'ui.open'}"></button>
            </div></div>`,
            { ui: { open: true } },
        );
        await nextTick();
        expect(maskOf("notice2")).not.toBeNull();
        await new Promise((r) => setTimeout(r, 100));
        expect(maskOf("notice2")).not.toBeNull();
    });
});

describe("at 锚定定位（ADR-0052 决策 21–24）", () => {
    afterEach(() => {
        document.getElementById("tmp-anchor-root")?.remove();
    });

    test("at 未命中 → warn + 退屏幕居中（面板无 fixed 定位、无箭头载体残留）", async () => {
        const { root, engine } = mountOverlay(
            `<div id="app"><div x-scope>
                <div x-component="tip"><span>x</span></div>
                <button x-dialog:tip="ui.open" x-dialog-options="{at: '/#no-such-anchor'}"></button>
            </div></div>`,
            { ui: { open: false } },
        );
        root.id = "tmp-anchor-root";
        document.body.appendChild(root); // / 全局选择器走 document
        const warns: string[] = [];
        const orig = engine.logger.warn.bind(engine.logger);
        engine.logger.warn = (msg: string) => warns.push(msg);
        try {
            engine.state.ui.open = true;
            await nextTick();
        } finally {
            engine.logger.warn = orig;
        }
        expect(warns.some((w) => w.includes('"/#no-such-anchor"'))).toBe(true);
        const panel = maskOf("tip")!.querySelector(".autospark-dialog") as HTMLElement;
        expect(panel.style.position).not.toBe("fixed");
        // 退居中不注入箭头载体（避免未定位载体残留孤立菱形）
        expect(panel.querySelector(":scope > .autospark-overlay-arrow")).toBeNull();
    });

    test("placement 未配置：默认 auto（autoPlacement 自动选位并写回最终方向）", async () => {
        const { root, engine } = mountOverlay(
            `<div id="app"><div x-scope>
                <div x-component="tip"><span>x</span></div>
                <div id="anchor-el">锚</div>
                <button x-dialog:tip="ui.open" x-dialog-options="{at: '/#anchor-el'}"></button>
            </div></div>`,
            { ui: { open: false } },
        );
        root.id = "tmp-anchor-root";
        document.body.appendChild(root);
        engine.state.ui.open = true;
        await nextTick();
        await nextTick();
        const panel = maskOf("tip")!.querySelector(".autospark-dialog") as HTMLElement;
        // autoPlacement 经 reset 自主决定 placement，最终值写回面板（候选序首个可容纳方向）
        const final = panel.getAttribute("data-overlay-placement")!;
        expect(final).not.toBe("");
        expect(["top", "bottom", "left", "right", "top-start", "top-end", "bottom-start", "bottom-end", "left-start", "left-end", "right-start", "right-end"]).toContain(final);
        // staticSide 偏移按最终方向设置（方向→对侧映射：top/bottom→bottom/top，left/right→right/left）
        const staticSide = { top: "bottom", bottom: "top", left: "right", right: "left" }[final.split("-")[0] as string]!;
        const arrow = panel.querySelector(":scope > .autospark-overlay-arrow") as HTMLElement;
        expect(arrow.style[staticSide as any]).not.toBe("");
    });

    test("锚定命中：箭头默认开启 + staticSide 反向偏移（floating-ui 融合协议）+ placement 写回", async () => {
        const { root, engine } = mountOverlay(
            `<div id="app"><div x-scope>
                <div x-component="tip"><span>x</span></div>
                <div id="anchor-el">锚</div>
                <button x-dialog:tip="ui.open" x-dialog-options="{at: {selector: '/#anchor-el', placement: 'top'}}"></button>
                <button x-dialog:tip="ui.open2" x-dialog-options="{at: {selector: '/#anchor-el', placement: 'top', arrow: false}, border: false}"></button>
                <button x-dialog:tip="ui.bordered" x-dialog-options="{at: {selector: '/#anchor-el', placement: 'top'}, border: true}"></button>
            </div></div>`,
            { ui: { open: false, open2: false, bordered: false } },
        );
        root.id = "tmp-anchor-root";
        document.body.appendChild(root);
        // 默认（不写 arrow）：锚定模式箭头开启
        engine.state.ui.open = true;
        await nextTick();
        await nextTick(); // computePosition 的 promise 微任务
        const panel = maskOf("tip")!.querySelector(".autospark-dialog") as HTMLElement;
        expect(panel.getAttribute("data-overlay-placement")).toBe("top");
        // 默认（不写 border）：面板外壳带 1px 边框标记（border 默认 true，外壳模式：背景+边框+圆角）
        expect(panel.hasAttribute("data-overlay-border")).toBe(true);
        const arrow = panel.querySelector(":scope > .autospark-overlay-arrow") as HTMLElement;
        expect(arrow).not.toBeNull();
        // staticSide 偏移（top → 载体 bottom 负偏移尺寸一半，载体中心落在面板边缘线上）：
        // happy-dom 无布局（offsetWidth 0）得 "0px"，真实浏览器 8px 载体得 "-4px"——断言已被设置
        expect(arrow.style.bottom).not.toBe("");
        // 未配置 offset + 箭头开启 → 默认让位 6px（面板距锚点留出三角尖高度，尖点锚元素边缘而非覆盖其上）
        expect(panel.style.top).toBe("-6px");
        // 显式 arrow: false / border: false：不注入载体、无边框标记（实例并存，断言按序取）
        engine.state.ui.open2 = true;
        await nextTick();
        await nextTick();
        expect(
            document.querySelectorAll(".autospark-dialog-mask .autospark-overlay-arrow").length,
        ).toBe(1);
        const panels2 = document.querySelectorAll('.autospark-dialog-mask [data-overlay="tip"]');
        expect((panels2[1] as HTMLElement).hasAttribute("data-overlay-border")).toBe(false);
        // border: true（显式）：面板写 data-overlay-border 标记（箭头双层变色融合由 CSS 契约承担）
        // —— 三个同名实例并存，bordered 实例最后打开（DOM 追加序在最后）
        engine.state.ui.bordered = true;
        await nextTick();
        await nextTick();
        const panels = document.querySelectorAll('.autospark-dialog-mask [data-overlay="tip"]');
        expect((panels[panels.length - 1] as HTMLElement).hasAttribute("data-overlay-border")).toBe(
            true,
        );
    });

    test("at 字符串简写进链前归一化：值对象换锚只覆盖 selector、继承 x-dialog-options 的 placement", async () => {
        const { root, engine } = mountOverlay(
            `<div id="app"><div x-scope>
                <div x-component="tip"><span>x</span></div>
                <div id="anchor-el">锚</div>
                <button
                    x-dialog:tip="{visible: 'ui.open', at: '/#anchor-el'}"
                    x-dialog-options="{at: {selector: '/#anchor-el', placement: 'top'}}"
                ></button>
            </div></div>`,
            { ui: { open: false } },
        );
        root.id = "tmp-anchor-root";
        document.body.appendChild(root);
        engine.state.ui.open = true;
        await nextTick();
        await nextTick(); // computePosition 的 promise 微任务
        // 若简写在合并后才归一化，字符串会整体覆盖对象、placement 丢失 → autoPlacement
        // 自选方向而非固定 'top'。进链前归一化保证局部覆盖：placement: 'top' 保留。
        const panel = maskOf("tip")!.querySelector(".autospark-dialog") as HTMLElement;
        expect(panel.getAttribute("data-overlay-placement")).toBe("top");
        expect(panel.style.position).toBe("fixed");
    });
});
