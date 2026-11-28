// resize 组合渐进增强依赖 expandable（layout 产物）——drawer 用例须加载
import "../../directives/layout/index";

// 显式引入 overlay 家族插件（外移后测试须自挂双路径自举）
import "../../directives/overlay/index";

import { describe, expect, test, afterEach } from "bun:test";
import "../setup";
import { mount, nextTick } from "../helpers";
import { buildLoadingMinExpr } from "../../directives/overlay/mechanism/types";

/**
 * 面板尺寸四键测试（ADR-0035）：width / height / maxWidth / maxHeight。
 *
 * 覆盖面：值域三态（number / CSS 串 / 非法 warn 忽略 / 缺省不写）、四键 inline 写入
 * （dialog mask 形态 + popover bare 形态）、fit 轴级互斥（显式声明轴 fit 不写不清）、
 * drawer 剥离 warn、loading 占位钳制（min() 表达式）、重开回声明值（新面板重写）。
 *
 * happy-dom 无真实布局：几何断言只看 inline style 字符串（写入面），不做布局验证
 * （传导链 / 滚动行为归真浏览器 e2e，ADR-0035 后果注记）。
 */

const containerOf = (): HTMLElement | null => document.querySelector(".autospark-overlays");
const maskPanelOf = (name: string): HTMLElement | null =>
    document.querySelector(`.autospark-dialog-mask [data-overlay="${name}"]`) ?? null;
const barePanelOf = (name: string): HTMLElement | null =>
    document.querySelector(`.autospark-overlays > [data-overlay="${name}"]`);

const engines: any[] = [];
const mountOverlay = (html: string, state: any, options?: any) => {
    const m = mount(html, state, { animate: false, ...options });
    engines.push(m.engine);
    return m;
};

/** 引擎运行期 warn 收集（打开路径的非法值 warn 在 instance 层，经 engine.logger） */
function catchWarns(engine: any, fn: () => void | Promise<void>): Promise<string[]> {
    const warns: string[] = [];
    const orig = engine.logger.warn.bind(engine.logger);
    engine.logger.warn = (msg: string) => warns.push(String(msg ?? ""));
    return (async () => {
        try {
            await fn();
        } finally {
            engine.logger.warn = orig;
        }
        return warns;
    })();
}

/** 悬浮事件辅助：mouseenter 不冒泡，直接对目标元素派发 */
const enter = (el: Element) => el.dispatchEvent(new MouseEvent("mouseenter"));

/** happy-dom 无真实布局：stub offsetWidth/offsetHeight 模拟宿主尺寸（fit 用例） */
function stubHostSize(el: HTMLElement, w: number, h: number) {
    Object.defineProperty(el, "offsetWidth", { value: w, configurable: true });
    Object.defineProperty(el, "offsetHeight", { value: h, configurable: true });
}

afterEach(() => {
    while (engines.length) engines.pop()?.destroy();
});

describe("面板尺寸四键（ADR-0035）：值域与写入", () => {
    test("number（px）/ CSS 长度串 / 纯数字串三态写入 popover 裸面板 shell 根", async () => {
        const { root } = mountOverlay(
            `<div id="app"><div x-scope>
                <div x-define="tip"><span>x</span></div>
                <button id="t" x-popover:tip x-popover-options="{delayShow: 0, width: 320, height: '40%', maxWidth: '20rem', maxHeight: 150}">悬停</button>
            </div></div>`,
            {},
        );
        enter(root.querySelector("#t")!);
        await nextTick();
        const panel = barePanelOf("tip")!;
        expect(panel).not.toBeNull();
        // number → px；CSS 长度串直写；纯数字串按 px
        expect(panel.style.width).toBe("320px");
        expect(panel.style.height).toBe("40%");
        expect(panel.style.maxWidth).toBe("20rem");
        expect(panel.style.maxHeight).toBe("150px");
    });

    test("dialog（mask 形态）同样写入——家族通用（声明式与命令式共享 OverlayInstance 路径）", async () => {
        const { engine } = mountOverlay(
            `<div id="app"><div x-scope>
                <div x-define="form"><span>x</span></div>
                <button x-dialog:form="ui.open" x-dialog-options="{ width: 480, height: 320 }"></button>
            </div></div>`,
            { ui: { open: false } },
        );
        engine.state.ui.open = true;
        await nextTick();
        const panel = maskPanelOf("form")!;
        expect(panel).not.toBeNull();
        expect(panel.style.width).toBe("480px");
        expect(panel.style.height).toBe("320px");
    });

    test("非法值（负数 / 0 / 布尔）warn + 忽略；缺省键不写 inline", async () => {
        const { root, engine } = mountOverlay(
            `<div id="app"><div x-scope>
                <div x-define="tip"><span>x</span></div>
                <button id="t" x-popover:tip x-popover-options="{delayShow: 0, width: -5, height: 0, maxWidth: true}">悬停</button>
            </div></div>`,
            {},
        );
        const warns = await catchWarns(engine, async () => {
            enter(root.querySelector("#t")!);
            await nextTick();
        });
        const panel = barePanelOf("tip")!;
        // 非法值不写（maxHeight 未声明也不写）——面板保持 shrink-wrap
        expect(panel.style.width).toBe("");
        expect(panel.style.height).toBe("");
        expect(panel.style.maxWidth).toBe("");
        expect(panel.style.maxHeight).toBe("");
        // 三键各 warn 一次（失效可发现）
        expect(warns.filter((w) => w.includes("width") && w.includes("ADR-0035")).length).toBe(1);
        expect(warns.filter((w) => w.includes("height") && w.includes("ADR-0035")).length).toBe(1);
        expect(warns.filter((w) => w.includes("maxWidth") && w.includes("ADR-0035")).length).toBe(1);
    });

    test("缺省（无任何声明）零写入——不破坏 shrink-wrap 现状", async () => {
        const { root } = mountOverlay(
            `<div id="app"><div x-scope>
                <div x-define="tip"><span>x</span></div>
                <button id="t" x-popover:tip x-popover-options="{delayShow: 0}">悬停</button>
            </div></div>`,
            {},
        );
        enter(root.querySelector("#t")!);
        await nextTick();
        const panel = barePanelOf("tip")!;
        expect(panel.style.width).toBe("");
        expect(panel.style.height).toBe("");
        expect(panel.style.maxWidth).toBe("");
        expect(panel.style.maxHeight).toBe("");
    });
});

describe("面板尺寸四键（ADR-0035）：fit 轴级互斥（显式声明轴 fit 不写不清）", () => {
    test("fit + width 声明（上下弹出主轴 = width）：声明值保持、height 仍被 fit 清", async () => {
        const { root } = mountOverlay(
            `<div id="app"><div x-scope>
                <div x-define="tip"><span>x</span></div>
                <button id="t" x-popover:tip x-popover-options="{delayShow: 0, fit: true, width: 320, at: {placement: 'top'}}">悬停</button>
            </div></div>`,
            {},
        );
        const host = root.querySelector("#t")! as HTMLElement;
        stubHostSize(host, 200, 50);
        enter(host);
        await nextTick();
        await nextTick();
        await nextTick();
        const panel = barePanelOf("tip")!;
        // 主轴 width 被 width 声明钉住——不被宿主 200px 覆盖
        expect(panel.style.width).toBe("320px");
        // height 未声明 → fit 照常清（原语义）
        expect(panel.style.height).toBe("");
    });

    test("fit + height 声明（上下弹出副轴 = height）：fit 不清声明值", async () => {
        const { root } = mountOverlay(
            `<div id="app"><div x-scope>
                <div x-define="tip"><span>x</span></div>
                <button id="t" x-popover:tip x-popover-options="{delayShow: 0, fit: true, height: 240, at: {placement: 'top'}}">悬停</button>
            </div></div>`,
            {},
        );
        const host = root.querySelector("#t")! as HTMLElement;
        stubHostSize(host, 200, 50);
        enter(host);
        await nextTick();
        await nextTick();
        await nextTick();
        const panel = barePanelOf("tip")!;
        // width 未声明 → fit 照常写主轴（宿主 200px）
        expect(panel.style.width).toBe("200px");
        // height 已声明 → fit 不清（原语义会清 ""，互斥后保持声明）
        expect(panel.style.height).toBe("240px");
    });

    test("fit 无声明：两轴全管（现状回归）", async () => {
        const { root } = mountOverlay(
            `<div id="app"><div x-scope>
                <div x-define="tip"><span>x</span></div>
                <button id="t" x-popover:tip x-popover-options="{delayShow: 0, fit: true, at: {placement: 'top'}}">悬停</button>
            </div></div>`,
            {},
        );
        const host = root.querySelector("#t")! as HTMLElement;
        stubHostSize(host, 200, 50);
        enter(host);
        await nextTick();
        await nextTick();
        await nextTick();
        const panel = barePanelOf("tip")!;
        expect(panel.style.width).toBe("200px");
        expect(panel.style.height).toBe("");
    });
});

describe("面板尺寸四键（ADR-0035）：drawer 剥离", () => {
    test("drawer 声明四键 → warn + 忽略（尺寸走 size 选项）", async () => {
        const { engine } = mountOverlay(
            `<div id="app"><div x-scope>
                <div x-define="panel"><span>x</span></div>
                <button x-drawer:panel="ui.open" x-drawer-options="{ width: 480, height: 320, maxWidth: 600 }"></button>
            </div></div>`,
            { ui: { open: false } },
        );
        const warns = await catchWarns(engine, async () => {
            engine.state.ui.open = true;
            await nextTick();
        });
        const panel = document.querySelector(`[data-overlay="panel"]`) as HTMLElement;
        expect(panel).not.toBeNull();
        // 三键全部剥离：maxWidth/height/maxHeight 无 inline；width 是短轴（默认 right 方向）
        // 归贴边定位器 size 通道（var 表达式）——证明四键剥离后短轴走既有机制
        expect(panel.style.maxWidth).toBe("");
        expect(panel.style.maxHeight).toBe("");
        expect(panel.style.height).toBe("");
        expect(panel.style.width).toBe("var(--autospark-drawer-size, 280px)");
        expect(warns.filter((w) => w.includes("x-drawer") && w.includes("不受支持")).length).toBe(3);
    });
});

describe("面板尺寸四键（ADR-0035）：loading 占位钳制（表达式纯函数）", () => {
    // happy-dom 丢弃 var()/min() 复杂值的 style 读回——单测直接断言表达式构造，
    // 落 DOM 生效（min-width 实际收敛）归真浏览器 e2e（ADR-0035 验收面）
    test("声明值参与 min()：同轴固定值与 max 值齐参与；无声明轴保持原 var 单值", () => {
        expect(
            buildLoadingMinExpr("width", { width: "120px", height: null, maxWidth: null, maxHeight: null }),
        ).toBe("min(var(--autospark-overlay-loading-min-width, 240px), 120px)");
        expect(
            buildLoadingMinExpr("height", { width: "120px", height: "80px", maxWidth: null, maxHeight: "90px" }),
        ).toBe("min(var(--autospark-overlay-loading-min-height, 120px), 80px, 90px)");
        // 无声明轴：原 var 单值（现状零变化）
        expect(
            buildLoadingMinExpr("height", { width: "120px", height: null, maxWidth: null, maxHeight: null }),
        ).toBe("var(--autospark-overlay-loading-min-height, 120px)");
        // 全空 decl（防御）：两轴均原 var 单值
        expect(buildLoadingMinExpr("width", null)).toBe(
            "var(--autospark-overlay-loading-min-width, 240px)",
        );
        expect(buildLoadingMinExpr("height", null)).toBe(
            "var(--autospark-overlay-loading-min-height, 120px)",
        );
    });

    test("声明值大于占位下限 → min() 仍写（浏览器裁决取下限，表达式统一不做 JS 侧比较）", () => {
        expect(
            buildLoadingMinExpr("width", { width: "480px", height: null, maxWidth: null, maxHeight: null }),
        ).toBe("min(var(--autospark-overlay-loading-min-width, 240px), 480px)");
        // 异单位并存：多参 min() 由浏览器统一裁决
        expect(
            buildLoadingMinExpr("width", { width: "40%", height: null, maxWidth: "20rem", maxHeight: null }),
        ).toBe("min(var(--autospark-overlay-loading-min-width, 240px), 40%, 20rem)");
    });
});

describe("面板尺寸四键（ADR-0035）：重开回声明值（决策 5）", () => {
    test("拖拽改写 inline 后重开 → 新面板重写声明值（声明是持久真相源）", async () => {
        const { engine } = mountOverlay(
            `<div id="app"><div x-scope>
                <div x-define="form"><span>x</span></div>
                <button x-dialog:form="ui.open" x-dialog-options="{ width: 480 }"></button>
            </div></div>`,
            { ui: { open: false } },
        );
        engine.state.ui.open = true;
        await nextTick();
        let panel = maskPanelOf("form")!;
        expect(panel.style.width).toBe("480px");
        // 模拟 resize 拖拽改写 inline（animate:false 下 close 即销毁）
        panel.style.width = "999px";
        engine.state.ui.open = false;
        await nextTick();
        expect(maskPanelOf("form")).toBeNull(); // 已关闭销毁
        engine.state.ui.open = true;
        await nextTick();
        // 重开：新面板（新实例）重写声明值
        panel = maskPanelOf("form")!;
        expect(panel.style.width).toBe("480px");
    });
});
