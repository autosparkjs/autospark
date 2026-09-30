import { describe, expect, test, afterEach } from "bun:test";
import "./setup";
import { mount, nextTick } from "./helpers";
import {
    clampSize,
    resolveHandles,
    resolveResizeConstraints,
    NO_CONSTRAINTS,
} from "../directives/presets/resize";

/**
 * x-resize 尺寸调节指令测试（ADR-0064）。
 *
 * 覆盖面：钳制管线纯函数（snap → aspectRatio → min/max 顺序）、方向归一（选项/修饰符/默认）、
 * 约束解析（选项直取与回退链）、手柄注入契约（data 属性/可聚焦）、流内降级（非定位元素丢
 * 非自然方向 + warn）、拖拽纯 DOM（e/se 手柄、定位元素 w 补偿）、三事件契约（start/move/end
 * 与 detail）、可选值双向（实时写回 + 反向通道 + 只读降级）、键盘微调（±1 / Shift ±10）、
 * overlay 集成（drawer 单边推导与会话记忆、dialog 四角、handles 收窄、事件宿主派发）。
 *
 * 约定：happy-dom 无布局——初始尺寸走 inline `style="width:..px"`（readElementSize 的
 * style 回退路径），拖拽模拟用 MouseEvent 携带 pointer* 事件名（type 匹配即触发）。
 */

const engines: any[] = [];
const roots: HTMLElement[] = [];
const mountResize = (html: string, state: any, options?: any) => {
    const m = mount(html, state, { animate: false, ...options });
    // resize 手柄注入在挂载后微任务（isConnected 判据）——root 须连接 document
    document.body.appendChild(m.root);
    roots.push(m.root);
    engines.push(m.engine);
    return m;
};

/** 劫持 console.warn 收集（同步窗口） */
function catchWarns(open: () => void): string[] {
    const warns: string[] = [];
    const orig = console.warn;
    console.warn = (...args: any[]) => warns.push(String(args[0] ?? ""));
    try {
        open();
    } finally {
        console.warn = orig;
    }
    return warns;
}

/** 模拟指针拖拽（MouseEvent 携带 pointer* 事件名——setPointerCapture 缺失环境监听挂手柄本体） */
function drag(handle: Element, dx: number, dy = 0, from = { x: 100, y: 100 }) {
    handle.dispatchEvent(
        new MouseEvent("pointerdown", {
            bubbles: true,
            cancelable: true,
            clientX: from.x,
            clientY: from.y,
            button: 0,
        }),
    );
    handle.dispatchEvent(
        new MouseEvent("pointermove", {
            bubbles: true,
            clientX: from.x + dx,
            clientY: from.y + dy,
        }),
    );
    handle.dispatchEvent(new MouseEvent("pointerup", { bubbles: true }));
}

/** 模拟键盘调节 */
function keydown(handle: Element, key: string, shift = false) {
    handle.dispatchEvent(
        new KeyboardEvent("keydown", { key, shiftKey: shift, bubbles: true, cancelable: true }),
    );
}

const handleOf = (host: Element, dir: string) =>
    host.querySelector(`[data-autospark-resize-handle="${dir}"]`);
const handleDirs = (host: Element) =>
    [...host.querySelectorAll("[data-autospark-resize-handle]")].map((h) =>
        h.getAttribute("data-autospark-resize-handle"),
    );

afterEach(() => {
    while (engines.length) engines.pop()?.destroy();
    while (roots.length) roots.pop()?.remove();
});

// ── 钳制管线（纯函数）──────────────────────────────────────────────────

describe("clampSize 钳制管线", () => {
    test("min/max 硬边界钳制", () => {
        const c = { ...NO_CONSTRAINTS, minWidth: 100, maxWidth: 300 };
        expect(clampSize(80, 50, "e", c).width).toBe(100);
        expect(clampSize(340, 50, "e", c).width).toBe(300);
        expect(clampSize(200, 50, "e", c).width).toBe(200);
    });

    test("snap 吸附（四舍五入到步进倍数）", () => {
        const c = { ...NO_CONSTRAINTS, snap: 8 };
        expect(clampSize(203, 50, "e", c).width).toBe(200);
        expect(clampSize(205, 50, "e", c).width).toBe(208);
        expect(clampSize(50, 203, "s", c).height).toBe(200);
    });

    test("aspectRatio：横向主轴（宽→高）与纵向主轴（高→宽）", () => {
        const c = { ...NO_CONSTRAINTS, aspectRatio: 2 }; // 宽:高 = 2:1
        expect(clampSize(200, 50, "e", c)).toEqual({ width: 200, height: 100 });
        expect(clampSize(200, 50, "se", c)).toEqual({ width: 200, height: 100 });
        expect(clampSize(50, 100, "s", c)).toEqual({ width: 200, height: 100 }); // 纵向主轴：高→宽
    });

    test("管线顺序：snap → aspect → clamp（钳制恒最后，min/max 是硬边界）", () => {
        const c = { ...NO_CONSTRAINTS, snap: 50, aspectRatio: 1, maxHeight: 80 };
        // snap 175→200，aspect h=200，clamp h→80（比值为软约束让位）
        expect(clampSize(175, 50, "e", c)).toEqual({ width: 200, height: 80 });
    });
});

// ── 方向与约束归一（纯函数）────────────────────────────────────────────

describe("resolveHandles 方向归一", () => {
    test("缺省默认 e,s,se（流内自然最大集）", () => {
        expect(resolveHandles(null)).toEqual(["e", "s", "se"]);
        expect(resolveHandles({})).toEqual(["e", "s", "se"]);
    });

    test("逗号串 / 数组声明", () => {
        expect(resolveHandles({ handles: "n,w" })).toEqual(["n", "w"]);
        expect(resolveHandles({ handles: ["nw", "sw"] })).toEqual(["nw", "sw"]);
    });

    test("修饰符布尔键并入（x-resize.e.se 解析期形态）", () => {
        expect(resolveHandles({ e: true, se: true })).toEqual(["e", "se"]);
        // 修饰符与 handles 声明合并去重
        expect(resolveHandles({ handles: "e", s: true })).toEqual(["e", "s"]);
    });

    test("非法方向 warn 剪枝", () => {
        const warns: string[] = [];
        expect(resolveHandles({ handles: "e,north,se" }, (m) => warns.push(m))).toEqual([
            "e",
            "se",
        ]);
        expect(warns.join()).toContain("north");
    });
});

describe("resolveResizeConstraints 约束解析", () => {
    test("number 与 px 串直取", () => {
        const c = resolveResizeConstraints({ minWidth: 120, maxWidth: "360px" }, null);
        expect(c.minWidth).toBe(120);
        expect(c.maxWidth).toBe(360);
    });

    test("aspectRatio 比值串（'16:9' / '4/3'）与非法串 warn", () => {
        expect(resolveResizeConstraints({ aspectRatio: "16:9" }, null).aspectRatio).toBeCloseTo(16 / 9);
        expect(resolveResizeConstraints({ aspectRatio: "4/3" }, null).aspectRatio).toBeCloseTo(4 / 3);
        const warns: string[] = [];
        const c = resolveResizeConstraints({ aspectRatio: "wide" }, null, (m) => warns.push(m));
        expect(c.aspectRatio).toBe(0);
        expect(warns.join()).toContain("aspectRatio");
    });

    test("computed 回退：inline min-width/max-width 生效", () => {
        const el = document.createElement("div");
        el.style.minWidth = "80px";
        el.style.maxWidth = "500px";
        document.body.appendChild(el);
        const c = resolveResizeConstraints(null, el);
        expect(c.minWidth).toBe(80);
        expect(c.maxWidth).toBe(500);
        el.remove();
    });

    test("选项显式值优先阻断 computed 回退", () => {
        const el = document.createElement("div");
        el.style.minWidth = "80px";
        document.body.appendChild(el);
        const c = resolveResizeConstraints({ minWidth: 120 }, el);
        expect(c.minWidth).toBe(120);
        el.remove();
    });

    test("非法约束值 warn 忽略", () => {
        const warns: string[] = [];
        const c = resolveResizeConstraints(
            { maxWidth: "abc" },
            null,
            (m) => warns.push(m),
        );
        expect(c.maxWidth).toBeNull();
        expect(warns.join()).toContain("maxWidth");
    });
});

// ── 手柄注入与流内降级 ─────────────────────────────────────────────────

describe("手柄注入", () => {
    test("默认 e,s,se 三个手柄 + 契约属性（data/tabindex/role）", async () => {
        const { root } = mountResize(
            `<div id="app"><div x-scope><div id="box" x-resize style="width:200px;height:100px"></div></div></div>`,
            {},
        );
        await nextTick();
        const host = root.querySelector("#box")!;
        expect(handleDirs(host).sort()).toEqual(["e", "s", "se"].sort());
        const h = handleOf(host, "se")!;
        expect(h.getAttribute("tabindex")).toBe("0");
        expect(h.getAttribute("role")).toBe("separator");
        // 手柄定位锚：宿主无 inline position 时补 relative（ADR-0064 修订注）
        expect((host as HTMLElement).style.position).toBe("relative");
    });

    test("handles 选项自定义 + 修饰符糖形态", async () => {
        const opts = mountResize(
            `<div id="app"><div x-scope><div id="a" x-resize x-resize-options="{handles:'w,n'}" style="position:absolute;width:100px;height:100px"></div><div id="b" x-resize.e.se style="width:100px;height:100px"></div></div></div>`,
            {},
        );
        await nextTick();
        expect(handleDirs(opts.root.querySelector("#a")!)).toEqual(["w", "n"]);
        expect(handleDirs(opts.root.querySelector("#b")!).sort()).toEqual(["e", "se"].sort());
    });

    test("流内降级：非定位元素丢非自然方向 + warn，absolute 保留全向", async () => {
        const warns: string[] = [];
        const orig = console.warn;
        console.warn = (...a: any[]) => warns.push(String(a[0] ?? ""));
        let m: any;
        try {
            m = mountResize(
                `<div id="app"><div x-scope>
                    <div id="flow" x-resize x-resize-options="{handles:'e,w,n,se'}" style="width:100px;height:100px"></div>
                    <div id="abs" x-resize x-resize-options="{handles:'e,w,n,se'}" style="position:absolute;width:100px;height:100px"></div>
                </div></div>`,
                {},
            );
            await nextTick();
        } finally {
            console.warn = orig;
        }
        expect(handleDirs(m.root.querySelector("#flow")!).sort()).toEqual(["e", "se"].sort());
        expect(handleDirs(m.root.querySelector("#abs")!).sort()).toEqual(
            ["e", "w", "n", "se"].sort(),
        );
        expect(warns.join()).toContain("w,n");
    });
});

// ── 拖拽（纯 DOM）──────────────────────────────────────────────────────

describe("拖拽纯 DOM", () => {
    test("e 手柄：宽随 Δ 增减", async () => {
        const { root } = mountResize(
            `<div id="app"><div x-scope><div id="box" x-resize style="width:200px;height:100px"></div></div></div>`,
            {},
        );
        await nextTick();
        const host = root.querySelector("#box")! as HTMLElement;
        drag(handleOf(host, "e")!, 40);
        expect(host.style.width).toBe("240px");
        drag(handleOf(host, "e")!, -60);
        expect(host.style.width).toBe("180px");
    });

    test("se 手柄双轴；s 手柄只影响高", async () => {
        const { root } = mountResize(
            `<div id="app"><div x-scope><div id="box" x-resize style="width:200px;height:100px"></div></div></div>`,
            {},
        );
        await nextTick();
        const host = root.querySelector("#box")! as HTMLElement;
        drag(handleOf(host, "se")!, 30, 20);
        expect(host.style.width).toBe("230px");
        expect(host.style.height).toBe("120px");
        drag(handleOf(host, "s")!, 999, 50);
        expect(host.style.width).toBe("230px"); // s 不影响宽
        expect(host.style.height).toBe("170px");
    });

    test("定位元素 w 手柄：宽度增加且左缘补偿（右缘坐标不变——定位坐标系基准）", async () => {
        const { root } = mountResize(
            `<div id="app"><div x-scope><div id="box" x-resize.e.w style="position:absolute;left:50px;top:40px;width:200px;height:100px"></div></div></div>`,
            {},
        );
        await nextTick();
        const host = root.querySelector("#box")! as HTMLElement;
        drag(handleOf(host, "w")!, -30); // 指针左移 30 = 宽 +30
        expect(host.style.width).toBe("230px");
        // 补偿基准是定位坐标系 inline left（50）：left = 50 + 200 - 230 = 20 —— 右缘 50+200 = 20+230 = 250 不变。
        // （回归：曾误用视口坐标 rect.left 作基准，offsetParent 有偏移时 w/n 拖拽瞬移跳动）
        expect(host.style.left).toBe("20px");
        expect(host.style.top).toBe("40px"); // n 轴未拖不动
    });

    test("约束选项生效：minWidth 钳制拖拽下限", async () => {
        const { root } = mountResize(
            `<div id="app"><div x-scope><div id="box" x-resize x-resize-options="{minWidth:150}" style="width:200px;height:100px"></div></div></div>`,
            {},
        );
        await nextTick();
        const host = root.querySelector("#box")! as HTMLElement;
        drag(handleOf(host, "e")!, -100);
        expect(host.style.width).toBe("150px");
    });

    test("snap 吸附与 aspectRatio 等比（拖拽链路）", async () => {
        const { root } = mountResize(
            `<div id="app"><div x-scope><div id="box" x-resize x-resize-options="{snap:20,aspectRatio:2}" style="width:200px;height:100px"></div></div></div>`,
            {},
        );
        await nextTick();
        const host = root.querySelector("#box")! as HTMLElement;
        drag(handleOf(host, "e")!, 35); // snap 235→240，aspect h = 120
        expect(host.style.width).toBe("240px");
        expect(host.style.height).toBe("120px");
    });

    test("绝对式位移数学：多段 move 不因 snap 归格残差跳变（跳动修复回归）", async () => {
        const { root } = mountResize(
            `<div id="app"><div x-scope><div id="box" x-resize x-resize-options="{snap:50}" style="width:200px;height:100px"></div></div></div>`,
            {},
        );
        await nextTick();
        const host = root.querySelector("#box")! as HTMLElement;
        const h = handleOf(host, "e")!;
        // 反例数值：总位移 70 → f(270)=250（残差 -20 被归格吞掉）；继续拖到总位移 85：
        // 绝对式 f(285)=300 ✓；递进式 f(250+85)=350 ✗（一次跳 50px）
        h.dispatchEvent(
            new MouseEvent("pointerdown", {
                bubbles: true,
                cancelable: true,
                clientX: 100,
                clientY: 100,
                button: 0,
            }),
        );
        h.dispatchEvent(new MouseEvent("pointermove", { bubbles: true, clientX: 170, clientY: 100 }));
        expect(host.style.width).toBe("250px");
        h.dispatchEvent(new MouseEvent("pointermove", { bubbles: true, clientX: 185, clientY: 100 }));
        expect(host.style.width).toBe("300px");
        h.dispatchEvent(new MouseEvent("pointerup", { bubbles: true }));
    });
});

// ── 事件契约 ───────────────────────────────────────────────────────────

describe("resize:* 三事件", () => {
    test("start → move → end 序列与 detail 载荷（宿主派发、冒泡）", async () => {
        const { root } = mountResize(
            `<div id="app"><div x-scope><div id="box" x-resize style="width:200px;height:100px"></div></div></div>`,
            {},
        );
        await nextTick();
        const host = root.querySelector("#box")! as HTMLElement;
        const seq: string[] = [];
        let lastDetail: any = null;
        host.addEventListener("resize:start", () => seq.push("start"));
        host.addEventListener("resize:move", (e: any) => {
            seq.push("move");
            lastDetail = e.detail;
        });
        host.addEventListener("resize:end", (e: any) => {
            seq.push("end");
            lastDetail = e.detail;
        });
        drag(handleOf(host, "se")!, 30, 20);
        expect(seq).toEqual(["start", "move", "end"]);
        expect(lastDetail).toEqual({ width: 230, height: 120, handle: "se" });
    });
});

// ── 可选值双向 ─────────────────────────────────────────────────────────

describe("可选值双向绑定", () => {
    test("状态初值应用（建连前到达的 pending 值）", async () => {
        const { root, engine } = mountResize(
            `<div id="app"><div x-scope><div id="box" x-resize="box" style="width:100px;height:80px"></div></div></div>`,
            { box: { width: 260, height: 140 } },
        );
        await nextTick();
        const host = root.querySelector("#box")! as HTMLElement;
        expect(host.style.width).toBe("260px");
        expect(host.style.height).toBe("140px");
        void engine;
    });

    test("拖拽实时写回状态", async () => {
        const { root, engine } = mountResize(
            `<div id="app"><div x-scope><div id="box" x-resize="box" style="width:200px;height:100px"></div></div></div>`,
            { box: { width: 200, height: 100 } },
        );
        await nextTick();
        const host = root.querySelector("#box")! as HTMLElement;
        drag(handleOf(host, "e")!, 50);
        expect(host.style.width).toBe("250px");
        expect((engine.state as any).box.width).toBe(250);
        expect((engine.state as any).box.height).toBe(100); // 未拖轴不写
    });

    test("反向通道：外部改状态 → 宿主尺寸同步（过钳制）", async () => {
        const { root, engine } = mountResize(
            `<div id="app"><div x-scope><div id="box" x-resize="box" x-resize-options="{minWidth:100,maxWidth:300}" style="width:200px;height:100px"></div></div></div>`,
            { box: { width: 200, height: 100 } },
        );
        await nextTick();
        const host = root.querySelector("#box")! as HTMLElement;
        (engine.state as any).box.width = 280;
        await nextTick();
        expect(host.style.width).toBe("280px");
        (engine.state as any).box.width = 999; // 钳制到 maxWidth
        await nextTick();
        expect(host.style.width).toBe("300px");
    });

    test("局部上下文（x-data 域祖先）下反向通道照常（子键订阅分流，ADR-0043 边界适配）", async () => {
        const { root, engine } = mountResize(
            `<div id="app"><div x-data><div id="box" x-resize="box" style="width:200px;height:100px"></div></div></div>`,
            { box: { width: 200, height: 100 } },
        );
        await nextTick();
        const host = root.querySelector("#box")! as HTMLElement;
        // 表达式支路无 depth 概念（依赖止于 box 引用）——修复前此场景内部键变化不触发
        (engine.state as any).box.width = 300;
        await nextTick();
        expect(host.style.width).toBe("300px");
        // 拖拽写回照常（落点解析走全局 setVal）
        drag(handleOf(host, "e")!, 20);
        expect((engine.state as any).box.width).toBe(320);
    });

    test("双向亚像素稳定（跳动修复回归）：拖出小数、写回后 watcher 迟到回调不覆盖取整值", async () => {
        const { root, engine } = mountResize(
            `<div id="app"><div x-scope><div id="box" x-resize="box" style="width:200px;height:100px"></div></div></div>`,
            { box: { width: 200, height: 100 } },
        );
        await nextTick();
        const host = root.querySelector("#box")! as HTMLElement;
        // 拖出亚像素位移（0.4px）：style 与 state 都是精确值，等值短路生效
        drag(handleOf(host, "e")!, 0.4);
        expect(host.style.width).toBe("200.4px");
        expect((engine.state as any).box.width).toBeCloseTo(200.4);
        // pointerup 后 watcher 迟到 flush（active 已 false）：精确等值 → 跳过，不二次写
        await nextTick();
        expect(host.style.width).toBe("200.4px");
    });

    test("表达式值只读降级 warn（状态→DOM 照常）", async () => {
        const warns: string[] = [];
        const orig = console.warn;
        console.warn = (...a: any[]) => warns.push(String(a[0] ?? ""));
        let m: any;
        try {
            m = mountResize(
                `<div id="app"><div x-scope><div id="box" x-resize="box.w ?? box.f" style="width:100px;height:80px"></div></div></div>`,
                { box: { w: { width: 180, height: 90 }, f: null } },
            );
            await nextTick();
        } finally {
            console.warn = orig;
        }
        expect(warns.join()).toContain("只读");
        expect((m.root.querySelector("#box") as HTMLElement).style.width).toBe("180px");
    });
});

// ── 键盘微调 ───────────────────────────────────────────────────────────

describe("键盘微调", () => {
    test("方向键 ±1 / Shift ±10（e 手柄 ArrowRight）", async () => {
        const { root } = mountResize(
            `<div id="app"><div x-scope><div id="box" x-resize style="width:200px;height:100px"></div></div></div>`,
            {},
        );
        await nextTick();
        const host = root.querySelector("#box")! as HTMLElement;
        const h = handleOf(host, "e")!;
        keydown(h, "ArrowRight");
        expect(host.style.width).toBe("201px");
        keydown(h, "ArrowRight", true);
        expect(host.style.width).toBe("211px");
        keydown(h, "ArrowLeft");
        expect(host.style.width).toBe("210px");
    });

    test("键盘会话事件：keydown start+move、keyup end", async () => {
        const { root } = mountResize(
            `<div id="app"><div x-scope><div id="box" x-resize style="width:200px;height:100px"></div></div></div>`,
            {},
        );
        await nextTick();
        const host = root.querySelector("#box")! as HTMLElement;
        const h = handleOf(host, "e")!;
        const seq: string[] = [];
        host.addEventListener("resize:start", () => seq.push("start"));
        host.addEventListener("resize:move", () => seq.push("move"));
        host.addEventListener("resize:end", () => seq.push("end"));
        keydown(h, "ArrowRight");
        h.dispatchEvent(new KeyboardEvent("keyup", { key: "ArrowRight", bubbles: true }));
        expect(seq).toEqual(["start", "move", "end"]);
        expect(host.style.width).toBe("201px");
    });
});

// ── overlay 集成（ADR-0064 决策八）────────────────────────────────────

const panelOf = (name: string): HTMLElement | null =>
    document.querySelector(`[data-overlay="${name}"]`);

describe("overlay：x-drawer resize", () => {
    test("resize: true → 贴边内侧单边手柄（默认 right 抽屉 → w）", async () => {
        mountResize(
            `<div id="app"><div x-scope>
                <div x-define="p"><span>x</span></div>
                <button id="host" x-drawer:p="ui.open" x-drawer-options="{resize: true}"></button>
            </div></div>`,
            { ui: { open: true } },
        );
        const panel = panelOf("p")!;
        expect(panel).not.toBeNull();
        const dirs = [...panel.querySelectorAll("[data-autospark-resize-handle]")].map((h) =>
            h.getAttribute("data-autospark-resize-handle"),
        );
        expect(dirs).toEqual(["w"]);
    });

    test("placement left → e 手柄；拖拽写面板短轴 + 会话记忆优先于声明 size", async () => {
        const { engine } = mountResize(
            `<div id="app"><div x-scope>
                <div x-define="p"><span>x</span></div>
                <button x-drawer:p="ui.open" x-drawer-options="{resize: true, size: 300, at: {placement: 'left'}}"></button>
            </div></div>`,
            { ui: { open: true } },
        );
        const panel = panelOf("p")!;
        expect(handleDirs(panel)).toEqual(["e"]);
        expect(panel.style.width).toBe("300px"); // 声明 size 初值
        drag(handleOf(panel, "e")!, 80);
        expect(panel.style.width).toBe("380px");
        // 关 → 开：会话记忆优先（新实例、同指令实例记忆，ADR-0064 决策八）
        (engine.state as any).ui.open = false;
        await nextTick();
        (engine.state as any).ui.open = true;
        await nextTick();
        const reopened = panelOf("p")!;
        expect(reopened.style.width).toBe("380px");
    });

    test("resize 会话把手跟随：调节改变开口边线，把手同步重定位（ADR-0070 修订）", async () => {
        mountResize(
            `<div id="app"><div x-scope>
                <div x-define="p"><span>x</span></div>
                <button id="host" x-drawer:p="ui.open" x-drawer-options="{resize: true, size: 300}"></button>
            </div></div>`,
            { ui: { open: true } },
        );
        const panel = panelOf("p")!;
        // happy-dom 无布局：mock offsetLeft = 视口宽 − 当前 inline 宽（右抽屉开口边真实几何）；
        // mock 晚于 open 期定位，派发 viewport resize 触发同步重定位后再取基准
        Object.defineProperty(panel, "offsetLeft", {
            get: () => 1024 - (parseFloat(panel.style.width) || 0),
            configurable: true,
        });
        window.dispatchEvent(new Event("resize"));
        const trigger = document.querySelector(
            ".autospark-expandable-trigger",
        ) as HTMLElement;
        const half = 10; // 共享把手契约半径（20px / 2）
        expect(trigger.style.left).toBe(`${1024 - 300 - half}px`); // 展开态骑开口边线
        drag(handleOf(panel, "w")!, 80);
        await nextTick();
        // w 手柄右拖 80 = 收窄（300 → 220）→ 开口边线右移 80 → 把手同步跟随
        // （未修复时停留在过期边线 714px）
        expect(trigger.style.left).toBe(`${1024 - 220 - half}px`);
    });

    test("handles 子键不适用单边语义：warn 忽略（合法集 = placement 推导单方向，ADR-0073）", async () => {
        const warns: string[] = [];
        const orig = console.warn;
        console.warn = (...a: any[]) => warns.push(String(a[0] ?? ""));
        try {
            mountResize(
                `<div id="app"><div x-scope>
                    <div x-define="p"><span>x</span></div>
                    <button x-drawer:p="ui.open" x-drawer-options="{resize: {handles: 'e,s,se'}, at: {placement: 'left'}}"></button>
                </div></div>`,
                { ui: { open: true } },
            );
        } finally {
            console.warn = orig;
        }
        // expandable 剥除 handles（单边语义）→ 仅剩 placement 推导的方向（left → e）
        expect(handleDirs(panelOf("p")!)).toEqual(["e"]);
        expect(warns.join()).toContain("handles/aspectRatio");
    });

    test("resize:* 事件派发在指令宿主（非面板）", async () => {
        const { root } = mountResize(
            `<div id="app"><div x-scope>
                <div x-define="p"><span>x</span></div>
                <button id="host" x-drawer:p="ui.open" x-drawer-options="{resize: true, size: 300}"></button>
            </div></div>`,
            { ui: { open: true } },
        );
        const host = root.querySelector("#host")!;
        let detail: any = null;
        host.addEventListener("resize:end", (e: any) => (detail = e.detail));
        drag(handleOf(panelOf("p")!, "w")!, -60);
        expect(detail).toEqual({ width: 360, height: 0, handle: "w" });
    });
});

describe("overlay：x-dialog resize", () => {
    test("resize: true → 四角手柄（ne,nw,se,sw）；拖 se 双轴变", async () => {
        mountResize(
            `<div id="app"><div x-scope>
                <div x-define="p"><span>x</span></div>
                <button x-dialog:p="ui.open" x-dialog-options="{resize: true}"></button>
            </div></div>`,
            { ui: { open: true } },
        );
        const panel = panelOf("p")!;
        expect(handleDirs(panel).sort()).toEqual(["ne", "nw", "se", "sw"].sort());
        // dialog 面板无 inline 初值 → readElementSize 0 起，拖拽 Δ 即终值
        drag(handleOf(panel, "se")!, 100, 60);
        expect(panel.style.width).toBe("100px");
        expect(panel.style.height).toBe("60px");
    });

    test("handles 收窄四角子集", async () => {
        mountResize(
            `<div id="app"><div x-scope>
                <div x-define="p"><span>x</span></div>
                <button x-dialog:p="ui.open" x-dialog-options="{resize: {handles: 'se'}}"></button>
            </div></div>`,
            { ui: { open: true } },
        );
        expect(handleDirs(panelOf("p")!)).toEqual(["se"]);
    });
});
