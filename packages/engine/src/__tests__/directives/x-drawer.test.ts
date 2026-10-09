import { describe, expect, test, afterEach, beforeEach } from "bun:test";
import "../setup";
import { mount, nextTick } from "../helpers";
// 静态样式段已随组件文件走（ADR-0092）——断言源 = 组件文件全文（规则文本仍逐字命中）
import DRAWER_SHELL_STYLES from "../../components/drawer-shell.html?raw";

/** CSS 断言面空白归一化（`\s+` → 单空格）：oxfmt 会折行长选择器/换行花括号，规则文本不变 */
const flatCss = (css: string): string => css.replace(/\s+/g, " ");

/**
 * x-drawer 贴边抽屉形态测试（ADR-0063）。
 *
 * 覆盖面：屏幕贴边四方向定位与 placement 归一（默认 right / auto 与 -start 静默归一 /
 * 非法值回退）、模态默认与 mask:false、元素贴边锚定（长轴 = 锚边长 + 首帧 placement 预写 +
 * flip 默认关 + 无箭头载体）、锚定未命中回退屏幕贴边（非退居中）、visible 驱动四形态继承
 * （简单路径回写 / 字面量 / 空值 warn）、'drawer' 默认动画与显式 animate 尊重、嵌套
 * （ESC 只关栈顶）、drawer-shell 默认与自定义 shell 替换、引擎级默认 shell。
 *
 * 约定：定位 inline 与 placement 属性是引擎同步写入的契约断言面（happy-dom 无布局，
 * floating-ui 的异步写回不断言具体坐标）。
 */

const engines: any[] = [];
const mountDrawer = (html: string, state: any, options?: any) => {
    const m = mount(html, state, { animate: false, ...options });
    engines.push(m.engine);
    return m;
};

const containerOf = (): HTMLElement | null => document.querySelector(".autospark-overlays");
const panelOf = (name: string): HTMLElement | null =>
    document.querySelector(`[data-overlay="${name}"]`);
const maskOf = (name: string): HTMLElement | null =>
    panelOf(name)?.closest(".autospark-dialog-mask") ?? null;

/** 劫持 console.warn 收集（覆盖 await 窗口——打开期 warn 经 scheduler 微任务 flush） */
async function catchWarnsAsync(open: () => void): Promise<string[]> {
    const warns: string[] = [];
    const orig = console.warn;
    console.warn = (...args: any[]) => warns.push(String(args[0] ?? ""));
    try {
        open();
        await nextTick();
    } finally {
        console.warn = orig;
    }
    return warns;
}

afterEach(() => {
    while (engines.length) engines.pop()?.destroy();
});

describe("屏幕贴边（默认定位）", () => {
    test("默认 right：fixed 贴右缘全高展开 + placement 写回 + drawer-shell 双类名", async () => {
        mountDrawer(
            `<div id="app"><div x-scope>
                <div x-define="panel"><b>抽屉内容</b></div>
                <button x-drawer:panel="ui.open"></button>
            </div></div>`,
            { ui: { open: true } },
        );
        const panel = panelOf("panel")!;
        expect(panel).not.toBeNull();
        expect(panel.style.position).toBe("fixed");
        // happy-dom 内联样式序列化：数值补 px 单位
        expect(panel.style.top).toBe("0px");
        expect(panel.style.bottom).toBe("0px");
        expect(panel.style.right).toBe("0px");
        expect(panel.style.left).toBe("");
        // 短轴 inline 恒写（未配置 size → CSS 变量表达式，不依赖样式表注入时机）
        expect(panel.style.width).toBe("var(--autospark-drawer-size, 280px)");
        expect(panel.getAttribute("data-overlay-placement")).toBe("right");
        // drawer-shell 模板根双类名：继承 dialog 外壳联动样式 + 抽屉形态覆写
        expect(panel.classList.contains("autospark-dialog")).toBe(true);
        expect(panel.classList.contains("autospark-drawer")).toBe(true);
    });

    test("placement 四方向 inline 定位", async () => {
        const dirs: Array<[string, string[]]> = [
            ["left", ["top", "bottom", "left"]],
            ["top", ["top", "left", "right"]],
            ["bottom", ["bottom", "left", "right"]],
        ];
        for (const [placement, edges] of dirs) {
            const { engine } = mountDrawer(
                `<div id="app"><div x-scope>
                    <div x-define="p"><span>x</span></div>
                    <button x-drawer:p="ui.open" x-drawer-options.at="{placement: '${placement}'}"></button>
                </div></div>`,
                { ui: { open: true } },
            );
            const panel = panelOf("p")!;
            for (const edge of edges) expect(panel.style[edge as any]).toBe("0px");
            expect(panel.getAttribute("data-overlay-placement")).toBe(placement);
            engine.destroy();
        }
    });

    test("placement 归一：-start/-end 后缀剥离、auto 与非法值回退 right（静默无 warn）", async () => {
        const cases: Array<[string, string]> = [
            ["left-start", "left"],
            ["right-end", "right"],
            ["auto", "right"],
            ["side", "right"],
        ];
        for (const [placement, expected] of cases) {
            const warns = await catchWarnsAsync(() => {
                mountDrawer(
                    `<div id="app"><div x-scope>
                        <div x-define="p"><span>x</span></div>
                        <button x-drawer:p="ui.open" x-drawer-options.at="{placement: '${placement}'}"></button>
                    </div></div>`,
                    { ui: { open: true } },
                );
            });
            expect(panelOf("p")!.getAttribute("data-overlay-placement")).toBe(expected);
            expect(warns.filter((w) => w.includes("placement"))).toEqual([]);
            // 清理本轮 engine（同面板名不跨用例残留）
            engines.pop()?.destroy();
        }
    });

    test("模态默认：遮罩外壳 + closeOnMask 点击回写", async () => {
        const { engine } = mountDrawer(
            `<div id="app"><div x-scope>
                <div x-define="panel"><span>x</span></div>
                <button x-drawer:panel="ui.open"></button>
            </div></div>`,
            { ui: { open: true } },
        );
        const mask = maskOf("panel")!;
        expect(mask).not.toBeNull();
        expect(panelOf("panel")!.parentElement).toBe(mask);
        mask.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        await nextTick();
        expect(engine.state.ui.open).toBe(false);
    });

    test("mask: false：裸面板直挂容器（无遮罩），遮罩点击关闭通道不存在", async () => {
        const { engine } = mountDrawer(
            `<div id="app"><div x-scope>
                <div x-define="panel"><span>x</span></div>
                <button x-drawer:panel="ui.open" x-drawer-options="{mask: false}"></button>
            </div></div>`,
            { ui: { open: true } },
        );
        expect(maskOf("panel")).toBeNull();
        const panel = panelOf("panel")!;
        expect(panel.parentElement).toBe(containerOf());
        expect(panel.style.position).toBe("fixed");
        // 状态归假仍可关闭（visible 是唯一真相源）
        engine.state.ui.open = false;
        await nextTick();
        expect(panelOf("panel")).toBeNull();
    });
});

describe("元素贴边锚定（at.selector）", () => {
    const anchoredHtml = (placement?: string) => `
        <div id="app"><div x-scope>
            <div x-define="panel"><span>x</span></div>
            <button x-drawer:panel="ui.open" x-drawer-options.at="{selector: '#a1'${
                placement ? `, placement: '${placement}'` : ""
            }}"><i id="a1">锚</i></button>
        </div></div>`;

    test("锚定命中：fixed 定位 + 主方向归一预写 + 长轴 = 锚边长（右抽屉高 = 锚高）", async () => {
        const { root, engine } = mountDrawer(anchoredHtml("right"), { ui: { open: false } });
        // happy-dom 无布局：mock 锚元素尺寸（先定义再打开——_show 同步读锚边长）
        const anchor = root.querySelector("#a1")!;
        Object.defineProperty(anchor, "offsetHeight", { value: 260, configurable: true });
        engine.state.ui.open = true;
        await nextTick();
        const panel = panelOf("panel")!;
        expect(panel.style.position).toBe("fixed");
        // -start 后缀剥离 + 首帧 placement 预写（动画方向不闪；最终值由定位管线写回）
        expect(panel.getAttribute("data-overlay-placement")).toBe("right");
        expect(panel.style.height).toBe("260px");
        // 短轴 inline（未配置 size → CSS 变量表达式）
        expect(panel.style.width).toBe("var(--autospark-drawer-size, 280px)");
    });

    test("上下抽屉锚定：长轴 = 锚宽", async () => {
        const { root, engine } = mountDrawer(anchoredHtml("top"), { ui: { open: false } });
        const anchor = root.querySelector("#a1")!;
        Object.defineProperty(anchor, "offsetWidth", { value: 480, configurable: true });
        engine.state.ui.open = true;
        await nextTick();
        const panel = panelOf("panel")!;
        expect(panel.style.width).toBe("480px");
        expect(panel.style.height).toBe("var(--autospark-drawer-size, 280px)");
    });

    test("锚定未命中：warn 退屏幕贴边（非退居中）", async () => {
        const warns = await catchWarnsAsync(() => {
            const { engine } = mountDrawer(
                `<div id="app"><div x-scope>
                    <div x-define="panel"><span>x</span></div>
                    <button x-drawer:panel="ui.open" x-drawer-options.at="{selector: '#nope'}"></button>
                </div></div>`,
                { ui: { open: true } },
            );
            engines.push(engine);
        });
        expect(warns.some((w) => w.includes("#nope") && w.includes("退屏幕贴边"))).toBe(true);
        const panel = panelOf("panel")!;
        expect(panel.style.position).toBe("fixed");
        expect(panel.getAttribute("data-overlay-placement")).toBe("right");
    });

    test("锚定模式无箭头载体（drawer-shell 不渲染，at.arrow 显式 true 亦静默无效）", async () => {
        mountDrawer(
            `<div id="app"><div x-scope>
                <div x-define="panel"><span>x</span></div>
                <button x-drawer:panel="ui.open" x-drawer-options.at="{selector: '#a1', arrow: true}"><i id="a1">锚</i></button>
            </div></div>`,
            { ui: { open: true } },
        );
        await nextTick();
        expect(panelOf("panel")!.querySelector(".autospark-overlay-arrow")).toBeNull();
    });
});

describe("visible 驱动（VisibleOverlayDirective 继承）", () => {
    test("ESC 关闭 → 回写状态 false", async () => {
        const { engine } = mountDrawer(
            `<div id="app"><div x-scope>
                <div x-define="panel"><span>x</span></div>
                <button x-drawer:panel="ui.open"></button>
            </div></div>`,
            { ui: { open: true } },
        );
        expect(panelOf("panel")).not.toBeNull();
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        await nextTick();
        expect(engine.state.ui.open).toBe(false);
        expect(panelOf("panel")).toBeNull();
    });

    test("字面量 true 挂载即开；空值 warn 恒不开（决策 6）", async () => {
        const warns = await catchWarnsAsync(() => {
            mountDrawer(
                `<div id="app"><div x-scope>
                    <div x-define="a"><span>x</span></div>
                    <div x-define="b"><span>y</span></div>
                    <button x-drawer:a="true"></button>
                    <button x-drawer:b=""></button>
                </div></div>`,
                {},
            );
        });
        expect(panelOf("a")).not.toBeNull();
        expect(panelOf("b")).toBeNull();
        expect(warns.some((w) => w.includes("x-drawer:b") && w.includes("缺少 visible 绑定"))).toBe(
            true,
        );
    });

    test("表达式驱动：依赖变化开合", async () => {
        const { engine } = mountDrawer(
            `<div id="app"><div x-scope>
                <div x-define="panel"><span>x</span></div>
                <button x-drawer:panel="ui.step === 2"></button>
            </div></div>`,
            { ui: { step: 1 } },
        );
        expect(panelOf("panel")).toBeNull();
        engine.state.ui.step = 2;
        await nextTick();
        expect(panelOf("panel")).not.toBeNull();
    });
});

describe("'drawer' 默认动画", () => {
    test("默认 animate: 'drawer'——enter 起始帧 from+active 挂实例根（默认名注入）", async () => {
        const { engine } = mount(
            `<div id="app"><div x-scope>
                <div x-define="panel"><span>x</span></div>
                <button x-drawer:panel="ui.open"></button>
            </div></div>`,
            { ui: { open: true } },
        );
        engines.push(engine);
        const mask = maskOf("panel")!;
        // 类挂实例根（模态形态 = 遮罩根）；'drawer' 动画名来自默认注入。
        // enter 起始帧同步挂 from+active；from→to 切换经双 rAF（新插入元素插入帧内
        // 切换不产生 transition，from 态须先渲染一帧）——无 duration 的默认形态在
        // happy-dom（无真实 transition）下由 0ms 兜底立即收尾，故此处只断言起始帧
        expect(mask.classList.contains("drawer-enter-from")).toBe(true);
        expect(mask.classList.contains("drawer-enter-active")).toBe(true);
        expect(mask.classList.contains("drawer-enter-to")).toBe(false);
    });

    test("enter from→to 经双 rAF 切换（from 态先渲染一帧才启动过渡）", async () => {
        const { engine } = mount(
            `<div id="app"><div x-scope>
                <div x-define="panel"><span>x</span></div>
                <button x-drawer:panel="ui.open" x-drawer-options="{animate: {name: 'drawer', duration: 5000}}"></button>
            </div></div>`,
            { ui: { open: true } },
        );
        engines.push(engine);
        const mask = maskOf("panel")!;
        // 长 duration 使动画在断言窗口内稳定「在播」（helpers 约定）
        expect(mask.classList.contains("drawer-enter-from")).toBe(true);
        await new Promise((r) => requestAnimationFrame(() => r()));
        await new Promise((r) => requestAnimationFrame(() => r()));
        await new Promise((r) => setTimeout(r, 30)); // happy-dom rAF 定时器偏移兜底
        expect(mask.classList.contains("drawer-enter-from")).toBe(false);
        expect(mask.classList.contains("drawer-enter-to")).toBe(true);
        expect(mask.classList.contains("drawer-enter-active")).toBe(true);
    });

    test("显式 animate 整键尊重（animate: 'fade' 挂 fade 类；false 无类）", async () => {
        const { engine } = mount(
            `<div id="app"><div x-scope>
                <div x-define="a"><span>x</span></div>
                <div x-define="b"><span>y</span></div>
                <button x-drawer:a="ui.a" x-drawer-options="{animate: 'fade'}"></button>
                <button x-drawer:b="ui.b" x-drawer-options="{animate: false}"></button>
            </div></div>`,
            { ui: { a: true, b: true } },
        );
        engines.push(engine);
        expect(maskOf("a")!.classList.contains("fade-enter-active")).toBe(true);
        expect(maskOf("b")!.className).not.toContain("drawer-enter");
        expect(maskOf("b")!.className).not.toContain("fade-enter");
    });
});

describe("嵌套（drawer 内再开 drawer）", () => {
    test("父子并存层叠；ESC 只关栈顶子，再 ESC 关父", async () => {
        const { engine } = mountDrawer(
            `<div id="app"><div x-scope>
                <div x-define="parent">
                    <script setup>{ data: { childOpen: false } }</script>
                    <button @click="childOpen = true">开子抽屉</button>
                    <div x-drawer:child="childOpen"></div>
                </div>
                <div x-define="child"><span>子抽屉</span></div>
                <button x-drawer:parent="ui.open"></button>
            </div></div>`,
            { ui: { open: true } },
        );
        expect(panelOf("parent")).not.toBeNull();
        // 父面板内按钮 → 子 drawer 打开（组件 data 域驱动）
        panelOf("parent")!.querySelector("button")!.dispatchEvent(
            new MouseEvent("click", { bubbles: true }),
        );
        await nextTick();
        expect(panelOf("child")).not.toBeNull();
        expect(panelOf("parent")).not.toBeNull();
        // DOM 追加序：子实例在后（层叠在上）
        const panels = Array.from(containerOf()!.querySelectorAll("[data-overlay]"));
        expect(panels.indexOf(panelOf("child")!)).toBeGreaterThan(
            panels.indexOf(panelOf("parent")!),
        );
        // ESC 只关栈顶（子）
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        await nextTick();
        expect(panelOf("child")).toBeNull();
        expect(panelOf("parent")).not.toBeNull();
        // 再 ESC 关父
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        await nextTick();
        expect(panelOf("parent")).toBeNull();
    });
});

describe("size 选项（短轴尺寸，方向中立）", () => {
    const sizeHtml = (option: string) => `
        <div id="app"><div x-scope>
            <div x-define="panel"><span>x</span></div>
            <button x-drawer:panel="ui.open" x-drawer-options="{${option}}"></button>
        </div></div>`;

    test("number 按 px、纯数字字符串按 px、CSS 长度原样（左右抽屉 → width）", async () => {
        const cases: Array<[string, string]> = [
            ["size: 480", "480px"],
            ["size: '480'", "480px"],
            ["size: '40%'", "40%"],
            ["size: '20rem'", "20rem"],
        ];
        for (const [option, expected] of cases) {
            mountDrawer(sizeHtml(option), { ui: { open: true } });
            expect(panelOf("panel")!.style.width).toBe(expected);
            engines.pop()?.destroy();
        }
    });

    test("上下抽屉 → height；成员属性表达式打开时求值", async () => {
        mountDrawer(
            `<div id="app"><div x-scope>
                <div x-define="a"><span>x</span></div>
                <div x-define="b"><span>y</span></div>
                <button x-drawer:a="ui.a" x-drawer-options.at="{placement: 'top'}" x-drawer-options="{size: '50%'}"></button>
                <button x-drawer:b="ui.b" x-drawer-options.at="{placement: 'bottom'}" x-drawer-options.size="ui.w"></button>
            </div></div>`,
            { ui: { a: true, b: false, w: 360 } },
        );
        expect(panelOf("a")!.style.height).toBe("50%");
        // 表达式形态：打开时求值（重开生效）
        engines[engines.length - 1].state.ui.b = true;
        await nextTick();
        expect(panelOf("b")!.style.height).toBe("360px");
    });

    test("非法值 warn 回退默认（CSS 变量表达式）", async () => {
        const warns = await catchWarnsAsync(() => {
            mountDrawer(sizeHtml("size: -100"), { ui: { open: true } });
        });
        expect(panelOf("panel")!.style.width).toBe("var(--autospark-drawer-size, 280px)");
        expect(warns.some((w) => w.includes("x-drawer:panel") && w.includes("size"))).toBe(true);
    });
});

describe("shell 集成（ADR-0062）", () => {
    test("自定义 shell 整体替换 drawer-shell", async () => {
        mountDrawer(
            `<div id="app"><div x-scope>
                <div x-define="my-shell" class="my-shell"><div x-slot></div></div>
                <div x-define="panel"><span>x</span></div>
                <button x-drawer:panel="ui.open" x-drawer-options="{shell: 'my-shell'}"></button>
            </div></div>`,
            { ui: { open: true } },
        );
        const panel = panelOf("panel")!;
        expect(panel.classList.contains("my-shell")).toBe(true);
        // 自定义 shell 不带内置类名——贴边定位契约（placement 属性 + inline）仍在
        expect(panel.style.position).toBe("fixed");
        expect(panel.getAttribute("data-overlay-placement")).toBe("right");
    });

    test("引擎级默认 shell（options.overlay.drawer.shell）", async () => {
        mountDrawer(
            `<div id="app"><div x-scope>
                <div x-define="eng-shell" class="eng-shell"><div x-slot></div></div>
                <div x-define="panel"><span>x</span></div>
                <button x-drawer:panel="ui.open"></button>
            </div></div>`,
            { ui: { open: true } },
            { overlay: { drawer: { shell: "eng-shell" } } },
        );
        expect(panelOf("panel")!.classList.contains("eng-shell")).toBe(true);
    });
});

describe("抽屉把手（expandable 组合共享把手，ADR-0070）", () => {
    const triggerOf = (i = 0): HTMLElement | null =>
        document.querySelectorAll(".autospark-expandable-trigger")[i] as HTMLElement ?? null;

    test("默认带把手：类名/属性契约（direction=placement + 折叠态 data-collapsed/data-half），挂覆盖物容器", () => {
        const { engine } = mountDrawer(
            `<div id="app"><div x-scope>
                <div x-define="panel"><span>x</span></div>
                <button x-drawer:panel="ui.open"></button>
            </div></div>`,
            { ui: { open: false } },
        );
        // 初始折叠（visible=false）：把手即存在（实例外常驻），折叠态标记在
        const t = triggerOf();
        expect(t).not.toBeNull();
        expect(t!.className).toBe("autospark-expandable-trigger"); // 共享把手契约（ADR-0070）
        expect(t!.getAttribute("data-direction")).toBe("right");
        expect(t!.hasAttribute("data-collapsed")).toBe(true);
        expect(t!.hasAttribute("data-half")).toBe(true); // 半圆形态判据
        expect(containerOf()?.contains(t!)).toBe(true);
        expect(engine.state.ui.open).toBe(false);
    });

    test("expandable: false 显式关闭：无把手", () => {
        mountDrawer(
            `<div id="app"><div x-scope>
                <div x-define="panel"><span>x</span></div>
                <button x-drawer:panel="ui.open" x-drawer-options="{expandable: false}"></button>
            </div></div>`,
            { ui: { open: false } },
        );
        expect(triggerOf()).toBeNull();
    });

    test("showTrigger 默认 hover；always 透传；非法值 warn 回退 hover", () => {
        const warns: string[] = [];
        const orig = console.warn;
        console.warn = (...a: any[]) => warns.push(String(a[0] ?? ""));
        let always: HTMLElement | null = null;
        try {
            mountDrawer(
                `<div id="app"><div x-scope>
                    <div x-define="panel"><span>x</span></div>
                    <button x-drawer:panel="ui.open" x-drawer-options="{expandable: {showTrigger: 'always'}}"></button>
                </div></div>`,
                { ui: { open: false } },
            );
            always = triggerOf();
            mountDrawer(
                `<div id="app"><div x-scope>
                    <div x-define="panel2"><span>x</span></div>
                    <button x-drawer:panel2="ui.open2" x-drawer-options="{expandable: {showTrigger: 'bad'}}"></button>
                </div></div>`,
                { ui: { open2: false } },
            );
        } finally {
            console.warn = orig;
        }
        // 默认（非法值回退）= hover（第二次挂载 → 索引 1）
        expect(triggerOf(1)!.getAttribute("data-show-trigger")).toBe("hover");
        expect(warns.some((w) => w.includes("showTrigger"))).toBe(true);
        expect(always!.getAttribute("data-show-trigger")).toBe("always");
        // hover 显隐 CSS 契约：展开态隐藏 + hover/聚焦显形 + 折叠态恒显（唯一重开触点）+ 触屏恒显
        const css = flatCss(DRAWER_SHELL_STYLES);
        expect(css).toMatch(
            /\.autospark-overlays > \.autospark-expandable-trigger\[data-show-trigger="hover"\] \{ opacity: 0;/,
        );
        expect(css).toContain('.autospark-overlays > .autospark-expandable-trigger[data-show-trigger="hover"]:hover');
        expect(css).toContain('.autospark-overlays > .autospark-expandable-trigger[data-show-trigger="hover"]:focus-visible');
        expect(css).toMatch(/\.autospark-overlays > \.autospark-expandable-trigger\[data-collapsed\] \{ box-shadow: 0[^}]*opacity: 1;/);
        expect(css).toContain("@media (hover: none)");
    });

    test("字面量形态不建把手（状态不可写，点击无意义）", () => {
        mountDrawer(
            `<div id="app"><div x-scope>
                <div x-define="panel"><span>x</span></div>
                <button x-drawer:panel="true"></button>
            </div></div>`,
            {},
        );
        expect(triggerOf()).toBeNull();
    });

    test("折叠态点击把手：写回 true → 面板重开；展开态点击：请求关闭 → 写回 false + 面板销毁", async () => {
        const { engine } = mountDrawer(
            `<div id="app"><div x-scope>
                <div x-define="panel"><span>x</span></div>
                <button x-drawer:panel="ui.open"></button>
            </div></div>`,
            { ui: { open: false } },
        );
        // 折叠 → 展开
        triggerOf()!.click();
        await nextTick();
        expect(engine.state.ui.open).toBe(true);
        expect(panelOf("panel")).not.toBeNull();
        expect(triggerOf()!.hasAttribute("data-collapsed")).toBe(false);
        // 展开 → 折叠（请求关闭链：回写 false + leave 后销毁；animate:false 同步销毁）
        triggerOf()!.click();
        await nextTick();
        expect(engine.state.ui.open).toBe(false);
        expect(panelOf("panel")).toBeNull();
        expect(triggerOf()!.hasAttribute("data-collapsed")).toBe(true);
        // 把手仍在（实例外常驻）
        expect(triggerOf()).not.toBeNull();
    });

    test("键盘触发（Enter 兑现 role=button——共享把手管线）", async () => {
        const { engine } = mountDrawer(
            `<div id="app"><div x-scope>
                <div x-define="panel"><span>x</span></div>
                <button x-drawer:panel="ui.open"></button>
            </div></div>`,
            { ui: { open: false } },
        );
        triggerOf()!.dispatchEvent(
            new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }),
        );
        await nextTick();
        expect(engine.state.ui.open).toBe(true);
    });

    test("resize 启用（hover 默认）：边条抑制 + 面板手柄桥接显形；无 resize 时边条存在", () => {
        mountDrawer(
            `<div id="app"><div x-scope>
                <div x-define="panel"><span>x</span></div>
                <button x-drawer:panel="ui.open" x-drawer-options="{resize: true}"></button>
            </div></div>`,
            { ui: { open: true } },
        );
        // 边条抑制（z 高于面板内手柄会拦截拖拽——手柄充当全长感应线）
        expect(document.querySelector(".autospark-expandable-edge")).toBeNull();
        // 手柄桥接：hover 置位把手 data-edge-hover（统一桥接契约）
        const handle = document.querySelector("[data-autospark-resize-handle]")!;
        handle.dispatchEvent(new MouseEvent("mouseenter"));
        expect(triggerOf()!.hasAttribute("data-edge-hover")).toBe(true);
        handle.dispatchEvent(new MouseEvent("mouseleave"));
        expect(triggerOf()!.hasAttribute("data-edge-hover")).toBe(false);
        engines.pop()?.destroy();
        // 无 resize：hover 模式边条存在（全长感应）
        mountDrawer(
            `<div id="app"><div x-scope>
                <div x-define="panel"><span>x</span></div>
                <button x-drawer:panel="ui.open"></button>
            </div></div>`,
            { ui: { open: true } },
        );
        expect(document.querySelector(".autospark-expandable-edge")).not.toBeNull();
    });

    test("resize 让位：把手区域内 pointerdown 转发手柄（resize 启动、折叠被抑制）", () => {
        const { engine, root } = mountDrawer(
            `<div id="app"><div x-scope>
                <div x-define="panel"><span>x</span></div>
                <button id="host" x-drawer:panel="ui.open" x-drawer-options="{resize: true}"></button>
            </div></div>`,
            { ui: { open: true } },
        );
        let started = 0;
        root.querySelector("#host")!.addEventListener("resize:start", () => started++);
        const handle = document.querySelector("[data-autospark-resize-handle]") as HTMLElement;
        // happy-dom 无布局：mock 手柄带几何（视口内 20×20 带）
        handle.getBoundingClientRect = () =>
            ({ left: 90, top: 90, right: 110, bottom: 110, width: 20, height: 20 } as DOMRect);
        const t = triggerOf()!;
        // 把手区域内下压 → 转发手柄（resize:start 派发）且不折叠
        t.dispatchEvent(
            new MouseEvent("pointerdown", { bubbles: true, clientX: 100, clientY: 100, button: 0 }),
        );
        expect(started).toBe(1);
        expect(engine.state.ui.open).toBe(true);
        // 同一次按压的 click（真实浏览器由 pointerdown preventDefault 抑制兼容链）→ 标志位兜底不折叠
        t.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        expect(engine.state.ui.open).toBe(true);
        // 新的一次点击（无前置让位下压）→ 照常折叠
        t.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        expect(engine.state.ui.open).toBe(false);
    });

    test("多实例各自独立把手；engine 销毁全部摘除", () => {
        const m = mountDrawer(
            `<div id="app"><div x-scope>
                <div x-define="a"><span>x</span></div>
                <div x-define="b"><span>y</span></div>
                <button x-drawer:a="ui.a"></button>
                <button x-drawer:b="ui.b"></button>
            </div></div>`,
            { ui: { a: false, b: false } },
        );
        expect(document.querySelectorAll(".autospark-expandable-trigger").length).toBe(2);
        m.engine.destroy();
        expect(document.querySelectorAll(".autospark-expandable-trigger").length).toBe(0);
    });
});

describe("把手坐标（expandable.pos，边缘锚定模型）", () => {
    const triggerOf = (i = 0): HTMLElement | null =>
        document.querySelectorAll(".autospark-expandable-trigger")[i] as HTMLElement ?? null;
    const vh = (): number => document.documentElement.clientHeight;
    const vw = (): number => document.documentElement.clientWidth;
    // happy-dom 无视口布局（clientHeight/clientWidth = 0）：mock 固定视口使滑轨计算可断言
    beforeEach(() => {
        Object.defineProperty(document.documentElement, "clientHeight", {
            value: 768,
            configurable: true,
        });
        Object.defineProperty(document.documentElement, "clientWidth", {
            value: 1024,
            configurable: true,
        });
    });
    afterEach(() => {
        delete (document.documentElement as any).clientHeight;
        delete (document.documentElement as any).clientWidth;
    });
    const triggerHtml = (option: string, placement?: string) => `
        <div id="app"><div x-scope>
            <div x-define="panel"><span>x</span></div>
            <button x-drawer:panel="ui.open" x-drawer-options="{${option}}"${
                placement ? ` x-drawer-options.at="{placement: '${placement}'}"` : ""
            }></button>
        </div></div>`;

    test("0 是合法坐标（距主边 0，不误判为关闭）：钳制到把手半径 → top 0", () => {
        mountDrawer(triggerHtml("expandable: {pos: 0}"), { ui: { open: false } });
        expect(triggerOf()!.style.top).toBe("0px");
    });

    test("true 与缺省 = 居中（≡ '50%'），对象 pos 数字按 px（滑轨 top = 坐标 - 半径 10）", () => {
        const center = vh() / 2 - 10;
        mountDrawer(triggerHtml("expandable: true"), { ui: { open: false } });
        expect(triggerOf()!.style.top).toBe(`${center}px`);
        engines.pop()?.destroy();
        mountDrawer(triggerHtml("expandable: {pos: 100}"), { ui: { open: false } });
        expect(triggerOf()!.style.top).toBe("90px");
    });

    test("负值 = 距对面边绝对距离（pos '-25%' = 距底 25%）", () => {
        mountDrawer(triggerHtml("expandable: {pos: '-25%'}"), { ui: { open: false } });
        expect(triggerOf()!.style.top).toBe(`${vh() * 0.75 - 10}px`);
    });

    test("CSS 长度字符串：纯数字按 px、rem 按根字号换算", () => {
        mountDrawer(triggerHtml("expandable: {pos: '60'}"), { ui: { open: false } });
        expect(triggerOf()!.style.top).toBe("50px");
        engines.pop()?.destroy();
        mountDrawer(triggerHtml("expandable: {pos: '2rem'}"), { ui: { open: false } });
        // happy-dom 根字号缺 16px（取不到亦回退 16）→ 32px
        expect(triggerOf()!.style.top).toBe("22px");
    });

    test("越界静默钳制到滑轨内（负向正向均可达，把手永可点）", () => {
        // '-110%' 越过主边外 → 钳回主边端；99999px 越过对面边 → 钳对面端
        mountDrawer(triggerHtml("expandable: {pos: '-110%'}"), { ui: { open: false } });
        expect(triggerOf()!.style.top).toBe("0px");
        engines.pop()?.destroy();
        mountDrawer(triggerHtml("expandable: {pos: 99999}"), { ui: { open: false } });
        expect(triggerOf()!.style.top).toBe(`${vh() - 20}px`);
    });

    test("锚定模式：滑轨长 = 锚边长、以锚起点为视口基准（把手恒在锚内）", () => {
        const { root } = mountDrawer(
            `<div id="app"><div x-scope>
                <div x-define="panel"><span>x</span></div>
                <button x-drawer:panel="ui.open" x-drawer-options.at="{selector: '#a1'}" x-drawer-options="{expandable: {pos: '-25%'}}"><i id="a1">锚</i></button>
            </div></div>`,
            { ui: { open: false } },
        );
        // happy-dom 无布局：mock 锚 rect（视口内 top=100、高 260）；把手 created 期定位时
        // rect 尚全 0，派发 scroll（viewport 监听同步重定位）后断言
        const anchor = root.querySelector("#a1")!;
        anchor.getBoundingClientRect = () =>
            ({ top: 100, left: 40, right: 460, bottom: 360, width: 420, height: 260 } as DOMRect);
        window.dispatchEvent(new Event("scroll"));
        const t = triggerOf()!;
        // pos '-25%' → 距锚底 25%：top = 锚顶 100 + (260 - 65) - 半径 10 = 285
        expect(t.style.top).toBe("285px");
        // 折叠态骑锚内侧边线：left = 锚右缘 460 - 10
        expect(t.style.left).toBe("450px");
    });

    test("上下抽屉滑轨 = 水平 left（屏幕模式滑轨长 = 视口宽）", () => {
        mountDrawer(
            triggerHtml("expandable: {pos: '-25%'}", "top"),
            { ui: { open: false } },
        );
        expect(triggerOf()!.style.left).toBe(`${vw() * 0.75 - 10}px`);
    });

    test("成员属性表达式：created 期求值 + 变化热应用（把手常驻、折叠态坐标即时更新）", async () => {
        const { engine } = mountDrawer(
            `<div id="app"><div x-scope>
                <div x-define="panel"><span>x</span></div>
                <button x-drawer:panel="ui.open" x-drawer-options.expandable="ui.exp"></button>
            </div></div>`,
            { ui: { open: false, exp: { pos: 100 } } },
        );
        expect(triggerOf()!.style.top).toBe("90px");
        engine.state.ui.exp = { pos: "-25%" };
        await nextTick();
        expect(triggerOf()!.style.top).toBe(`${vh() * 0.75 - 10}px`);
    });

    test("非法值 warn 回退居中", async () => {
        const warns = await catchWarnsAsync(() => {
            mountDrawer(triggerHtml("expandable: {pos: 'abc'}"), { ui: { open: false } });
        });
        expect(triggerOf()!.style.top).toBe(`${vh() / 2 - 10}px`);
        expect(warns.some((w) => w.includes("x-drawer:panel") && w.includes("expandable"))).toBe(
            true,
        );
    });

    test("折叠裁切契约：四方向露面板展开侧（top 露下半 / bottom 露上半，与 right/left 同构）", () => {
        const css = flatCss(DRAWER_SHELL_STYLES);
        expect(css).toContain(
            '.autospark-overlays > .autospark-expandable-trigger[data-collapsed][data-direction="top"] { clip-path: inset(50% 0 0 0); }',
        );
        expect(css).toContain(
            '.autospark-overlays > .autospark-expandable-trigger[data-collapsed][data-direction="bottom"] { clip-path: inset(0 0 50% 0); }',
        );
        expect(css).toContain(
            '.autospark-overlays > .autospark-expandable-trigger[data-collapsed][data-direction="right"] { clip-path: inset(0 50% 0 0); }',
        );
        expect(css).toContain(
            '.autospark-overlays > .autospark-expandable-trigger[data-collapsed][data-direction="left"] { clip-path: inset(0 0 0 50%); }',
        );
    });

    test("阴影契约：展开态无 box-shadow，折叠态保留（[data-collapsed] 独立规则）", () => {
        // 基础规则显式关闭阴影（展开态视觉属于面板；压过共享基座的默认阴影）
        const base = DRAWER_SHELL_STYLES.match(
            /\.autospark-overlays > \.autospark-expandable-trigger \{[^}]*\}/,
        )![0];
        expect(base).toContain("box-shadow: none");
        // 折叠态独立加回（独立浮起提示可点）
        expect(DRAWER_SHELL_STYLES).toMatch(
            /\.autospark-overlays > \.autospark-expandable-trigger\[data-collapsed\] \{\s*box-shadow:/,
        );
    });
});
