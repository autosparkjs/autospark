import { describe, expect, test, afterEach } from "bun:test";
import "../setup";
import { mount, nextTick } from "../helpers";

/**
 * x-splitter 分割器指令测试（ADR-0067）。
 *
 * 覆盖面：结构契约（两面板 + 分隔条组装 / 多余子元素 warn 丢弃 / template-script 容忍 /
 * 不足两个降级 / 2 sized 降级）、direction（字面量与响应式切换换轴重排）、data-size 家族
 * （静态值 inline / 绑定剥除与初值 / auto 面板 min/max warn）、拖拽（前后方向语义 / min-max
 * 钳制 / 绝对式数学）、双向绑定（写回状态 / 外部反向同步 / 等值短路防递归 / 表达式只读降级）、
 * 折叠（ADR-0070 组合 x-expandable：data-expandable 声明 / 点击折叠 slide·收缩 / lastSize
 * 恢复 / 初始折叠不派发 / 拖拽跨目标翻转载体布尔 / expandable:* 冒泡事件）、
 * 事件（splitter:resize + expandable:collapse/expand）、静态形态（双 auto）、键盘微调。
 *
 * 约定：happy-dom 无布局——定容面板初值走 inline（_beginSession 的 inline 优先路径），
 * 拖拽模拟用 MouseEvent 携带 pointer* 事件名（x-resize 同款）。
 */

const engines: any[] = [];
const roots: HTMLElement[] = [];
const mountSplitter = (html: string, state: any, options?: any) => {
    const m = mount(html, state, { animate: false, ...options });
    document.body.appendChild(m.root);
    roots.push(m.root);
    engines.push(m.engine);
    return m;
};

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

/** 模拟分隔条指针拖拽（水平：dx；垂直：dy） */
function drag(divider: Element, dx: number, dy = 0, from = { x: 100, y: 100 }) {
    divider.dispatchEvent(
        new MouseEvent("pointerdown", {
            bubbles: true,
            cancelable: true,
            clientX: from.x,
            clientY: from.y,
            button: 0,
        }),
    );
    divider.dispatchEvent(
        new MouseEvent("pointermove", {
            bubbles: true,
            clientX: from.x + dx,
            clientY: from.y + dy,
        }),
    );
    divider.dispatchEvent(new MouseEvent("pointerup", { bubbles: true }));
}

const panesOf = (host: Element) =>
    [...host.querySelectorAll(":scope > [data-autospark-splitter-pane]")] as HTMLElement[];
const dividerOf = (host: Element) => host.querySelector(":scope > .autospark-splitter-divider");
/** 折叠把手（ADR-0070 组合）：共享把手类名，宿主内（展开态面板内 / 滑出终态 dock 宿主内） */
const triggerOf = (host: Element) => host.querySelector(".autospark-expandable-trigger");

/** 标准 horizontal splitter：sized(300) + auto */
const H_TMPL = `<div id="app"><div x-scope>
    <div id="host" x-splitter="'horizontal'">
        <div id="p1" data-size="300"><span>a</span></div>
        <div id="p2"><span>b</span></div>
    </div>
</div></div>`;

afterEach(() => {
    while (engines.length) engines.pop()?.destroy();
    while (roots.length) roots.pop()?.remove();
});

// ── 结构契约 ──────────────────────────────────────────────────────────

describe("结构契约", () => {
    test("两面板 + 分隔条组装（文档序：pane1 / divider / pane2）", () => {
        const { root } = mountSplitter(H_TMPL, {});
        const host = root.querySelector("#host")!;
        expect(host.classList.contains("autospark-splitter")).toBe(true);
        expect(host.getAttribute("data-direction")).toBe("horizontal");
        const children = [...host.children];
        expect(children.length).toBe(3);
        expect(children[0]!.id).toBe("p1");
        expect(children[1]!.tagName).toBe("DIV");
        expect(children[1]!.classList.contains("autospark-splitter-divider")).toBe(true);
        expect(children[2]!.id).toBe("p2");
        const [p1, p2] = panesOf(host);
        expect(p1!.getAttribute("data-autospark-splitter-sized")).toBe("");
        expect(p2!.hasAttribute("data-autospark-splitter-sized")).toBe(false);
    });

    test("分隔条契约：role=separator + tabindex + aria-orientation（水平分割 → 竖直分隔条）", () => {
        const { root } = mountSplitter(H_TMPL, {});
        const d = dividerOf(root.querySelector("#host")!)!;
        expect(d.getAttribute("role")).toBe("separator");
        expect(d.getAttribute("tabindex")).toBe("0");
        expect(d.getAttribute("aria-orientation")).toBe("vertical");
        expect(d.hasAttribute("data-static")).toBe(false);
    });

    test("template / script 子元素静默容忍（不计数不编译）", () => {
        const warns = catchWarns(() =>
            mountSplitter(
                `<div id="app"><div x-scope><div id="host" x-splitter="'horizontal'">
                    <template><div>shadow</div></template>
                    <script type="text/x-t">x</` +
                    `script>
                    <div data-size="100">a</div>
                    <div>b</div>
                </div></div></div>`,
                {},
            ),
        );
        const { root } = engines.length ? { root: roots[roots.length - 1]! } : ({} as any);
        const host = root.querySelector("#host")!;
        expect(host.querySelectorAll("[data-autospark-splitter-pane]").length).toBe(2);
        expect(host.querySelector("template")).toBeNull();
        expect(warns.join()).not.toContain("多余");
    });

    test("多余渲染子元素 warn + 丢弃", () => {
        const warns: string[] = [];
        const orig = console.warn;
        console.warn = (...a: any[]) => warns.push(String(a[0] ?? ""));
        let m: any;
        try {
            m = mountSplitter(
                `<div id="app"><div x-scope><div id="host" x-splitter="'horizontal'">
                    <div data-size="100">a</div><div>b</div><div>c</div>
                </div></div></div>`,
                {},
            );
        } finally {
            console.warn = orig;
        }
        const host = m.root.querySelector("#host")!;
        expect(host.querySelectorAll("[data-autospark-splitter-pane]").length).toBe(2);
        expect(warns.join()).toContain("多余");
    });

    test("不足两个面板 warn + 降级普通编译（内容不丢）", () => {
        const warns: string[] = [];
        const orig = console.warn;
        console.warn = (...a: any[]) => warns.push(String(a[0] ?? ""));
        let m: any;
        try {
            m = mountSplitter(
                `<div id="app"><div x-scope><div id="host" x-splitter="'horizontal'">
                    <div>only</div>
                </div></div></div>`,
                {},
            );
        } finally {
            console.warn = orig;
        }
        const host = m.root.querySelector("#host")!;
        expect(warns.join()).toContain("至少需要两个");
        // 降级：无分隔条、子元素原样编译保留
        expect(dividerOf(host)).toBeNull();
        expect(host.textContent).toContain("only");
    });

    test("双 sized：第二个 warn + 按自适应处理", () => {
        const warns: string[] = [];
        const orig = console.warn;
        console.warn = (...a: any[]) => warns.push(String(a[0] ?? ""));
        let m: any;
        try {
            m = mountSplitter(
                `<div id="app"><div x-scope><div id="host" x-splitter="'horizontal'">
                    <div data-size="100">a</div><div data-size="200">b</div>
                </div></div></div>`,
                {},
            );
        } finally {
            console.warn = orig;
        }
        const [p1, p2] = panesOf(m.root.querySelector("#host")!);
        expect(p1!.getAttribute("data-autospark-splitter-sized")).toBe("");
        expect(p2!.hasAttribute("data-autospark-splitter-sized")).toBe(false);
        expect(warns.join()).toContain("至多一个定容面板");
    });

    test("auto 面板上的 min/max warn + 忽略", () => {
        const warns: string[] = [];
        const orig = console.warn;
        console.warn = (...a: any[]) => warns.push(String(a[0] ?? ""));
        try {
            mountSplitter(
                `<div id="app"><div x-scope><div id="host" x-splitter="'horizontal'">
                    <div data-size="100">a</div><div data-min-size="50">b</div>
                </div></div></div>`,
                {},
            );
        } finally {
            console.warn = orig;
        }
        expect(warns.join()).toContain("仅定容面板");
    });
});

// ── direction ─────────────────────────────────────────────────────────

describe("direction", () => {
    test("非法值 / undefined 静默归一 horizontal", () => {
        const { root } = mountSplitter(
            `<div id="app"><div x-scope><div id="host" x-splitter="missing.path">
                <div>a</div><div>b</div>
            </div></div></div>`,
            {},
        );
        expect(root.querySelector("#host")!.getAttribute("data-direction")).toBe("horizontal");
    });

    test("响应式切换：换轴重排 + sized 尺寸同值重写（旧轴 inline 清理）", async () => {
        const { root, engine } = mountSplitter(
            `<div id="app"><div x-scope><div id="host" x-splitter="ui.dir">
                <div id="p1" data-size="300">a</div><div>b</div>
            </div></div></div>`,
            { ui: { dir: "horizontal" } },
        );
        const host = root.querySelector("#host")! as HTMLElement;
        const p1 = root.querySelector("#p1")! as HTMLElement;
        expect(host.getAttribute("data-direction")).toBe("horizontal");
        expect(p1.style.width).toBe("300px");
        (engine.state as any).ui.dir = "vertical";
        await nextTick();
        expect(host.getAttribute("data-direction")).toBe("vertical");
        expect(p1.style.height).toBe("300px");
        expect(p1.style.width).toBe(""); // 旧轴 inline 清理
        // 切回
        (engine.state as any).ui.dir = "horizontal";
        await nextTick();
        expect(p1.style.width).toBe("300px");
        expect(p1.style.height).toBe("");
    });
});

// ── data-size 家族 ────────────────────────────────────────────────────

describe("data-size 家族", () => {
    test("静态声明 inline 写入（CSS 长度全形态）", () => {
        const { root } = mountSplitter(
            `<div id="app"><div x-scope><div id="host" x-splitter="'horizontal'">
                <div id="p1" data-size="30%">a</div><div>b</div>
            </div></div></div>`,
            {},
        );
        expect((root.querySelector("#p1")! as HTMLElement).style.width).toBe("30%");
    });

    test("绑定形态：伪属性剥除（不双通道）+ 状态初值应用", async () => {
        const { root } = mountSplitter(
            `<div id="app"><div x-scope><div id="host" x-splitter="'horizontal'">
                <div id="p1" :data-size="layout.sidebar">a</div><div>b</div>
            </div></div></div>`,
            { layout: { sidebar: 260 } },
        );
        await nextTick();
        const p1 = root.querySelector("#p1")! as HTMLElement;
        expect(p1.hasAttribute(":data-size")).toBe(false);
        expect(p1.hasAttribute("x-bind:data-size")).toBe(false);
        expect(p1.style.width).toBe("260px");
    });

    test("绑定 min/max：简单路径订阅（外部变更进入钳制快照）", async () => {
        const { root, engine } = mountSplitter(
            `<div id="app"><div x-scope><div id="host" x-splitter="'horizontal'">
                <div id="p1" :data-size="s.w" :data-min-size="s.min" :data-max-size="s.max">a</div><div>b</div>
            </div></div></div>`,
            { s: { w: 200, min: 100, max: 400 } },
        );
        await nextTick();
        const host = root.querySelector("#host")! as HTMLElement;
        const d = dividerOf(host)!;
        // 外部写 max=250 → 拖拽越界被钳
        (engine.state as any).s.max = 250;
        await nextTick();
        drag(d, 200, 0, { x: 100, y: 0 });
        expect((root.querySelector("#p1")! as HTMLElement).style.width).toBe("250px");
    });

    test("非法静态值 warn + 忽略（初始不钳制，声明即真相）", () => {
        const warns = catchWarns(() =>
            mountSplitter(
                `<div id="app"><div x-scope><div id="host" x-splitter="'horizontal'">
                    <div id="p1" data-size="wide">a</div><div>b</div>
                </div></div></div>`,
                {},
            ),
        );
        expect(warns.join()).toContain("无法解析为 CSS 长度");
        const { root } = mountSplitter(H_TMPL, {});
        void root;
    });
});

// ── 拖拽 ──────────────────────────────────────────────────────────────

describe("拖拽", () => {
    test("sized 在前：分隔条右移 = 增、左移 = 减", () => {
        const { root } = mountSplitter(H_TMPL, {});
        const host = root.querySelector("#host")! as HTMLElement;
        const p1 = root.querySelector("#p1")! as HTMLElement;
        drag(dividerOf(host)!, 50);
        expect(p1.style.width).toBe("350px");
        drag(dividerOf(host)!, -100);
        expect(p1.style.width).toBe("250px");
    });

    test("sized 在后：方向反向（分隔条左移 = 增）", () => {
        const { root } = mountSplitter(
            `<div id="app"><div x-scope><div id="host" x-splitter="'horizontal'">
                <div>a</div><div id="p2" data-size="200">b</div>
            </div></div></div>`,
            {},
        );
        const host = root.querySelector("#host")! as HTMLElement;
        const p2 = root.querySelector("#p2")! as HTMLElement;
        drag(dividerOf(host)!, -80);
        expect(p2.style.width).toBe("280px");
    });

    test("vertical：分隔条下移 = sized 在前增（写 height）", () => {
        const { root } = mountSplitter(
            `<div id="app"><div x-scope><div id="host" x-splitter="'vertical'">
                <div id="p1" data-size="120">a</div><div>b</div>
            </div></div></div>`,
            {},
        );
        const host = root.querySelector("#host")! as HTMLElement;
        const p1 = root.querySelector("#p1")! as HTMLElement;
        drag(dividerOf(host)!, 0, 30);
        expect(p1.style.height).toBe("150px");
    });

    test("静态 min/max 钳制（混用单位统一 px 比较）", () => {
        const { root } = mountSplitter(
            `<div id="app"><div x-scope><div id="host" x-splitter="'horizontal'">
                <div id="p1" data-size="300" data-min-size="200" data-max-size="350">a</div><div>b</div>
            </div></div></div>`,
            {},
        );
        const host = root.querySelector("#host")! as HTMLElement;
        const p1 = root.querySelector("#p1")! as HTMLElement;
        drag(dividerOf(host)!, -200);
        expect(p1.style.width).toBe("200px"); // min 钳制
        drag(dividerOf(host)!, 300);
        expect(p1.style.width).toBe("350px"); // max 钳制
    });

    test("绝对式位移数学：多段 move 不累积钳制残差", () => {
        const { root } = mountSplitter(
            `<div id="app"><div x-scope><div id="host" x-splitter="'horizontal'">
                <div id="p1" data-size="200" data-min-size="240">a</div><div>b</div>
            </div></div></div>`,
            {},
        );
        const host = root.querySelector("#host")! as HTMLElement;
        const p1 = root.querySelector("#p1")! as HTMLElement;
        const d = dividerOf(host)!;
        // 第一段被 min 钳到 240（残差 -20）；第二段从会话初值 200 + 总位移 100 = 300（非 240 + 80 残差递进）
        d.dispatchEvent(
            new MouseEvent("pointerdown", {
                bubbles: true,
                cancelable: true,
                clientX: 100,
                clientY: 0,
                button: 0,
            }),
        );
        d.dispatchEvent(new MouseEvent("pointermove", { bubbles: true, clientX: 60, clientY: 0 }));
        expect(p1.style.width).toBe("240px");
        d.dispatchEvent(new MouseEvent("pointermove", { bubbles: true, clientX: 200, clientY: 0 }));
        expect(p1.style.width).toBe("300px");
        d.dispatchEvent(new MouseEvent("pointerup", { bubbles: true }));
    });

    test("双 auto 静态形态：分隔条 data-static 不可拖不可聚焦", () => {
        const { root } = mountSplitter(
            `<div id="app"><div x-scope><div id="host" x-splitter="'horizontal'">
                <div>a</div><div>b</div>
            </div></div></div>`,
            {},
        );
        const host = root.querySelector("#host")! as HTMLElement;
        const d = dividerOf(host)!;
        expect(d.getAttribute("data-static")).toBe("");
        expect(d.getAttribute("tabindex")).toBeNull();
        const p1 = host.children[0]! as HTMLElement;
        drag(d, 50);
        expect(p1.style.width).toBe(""); // 拖拽无效
    });
});

// ── 双向绑定 ──────────────────────────────────────────────────────────

describe("双向绑定", () => {
    test("拖拽实时写回状态（px number）", async () => {
        const { root, engine } = mountSplitter(
            `<div id="app"><div x-scope><div id="host" x-splitter="'horizontal'">
                <div id="p1" :data-size="s.w">a</div><div>b</div>
            </div></div></div>`,
            { s: { w: 200 } },
        );
        await nextTick();
        drag(dividerOf(root.querySelector("#host")!)!, 50);
        expect((engine.state as any).s.w).toBe(250);
    });

    test("外部改状态 → 面板同步（等值短路防递归：写回触发的自身 watcher 不循环）", async () => {
        const { root, engine } = mountSplitter(
            `<div id="app"><div x-scope><div id="host" x-splitter="'horizontal'">
                <div id="p1" :data-size="s.w">a</div><div>b</div>
            </div></div></div>`,
            { s: { w: 200 } },
        );
        await nextTick();
        const p1 = root.querySelector("#p1")! as HTMLElement;
        (engine.state as any).s.w = 320;
        await nextTick();
        expect(p1.style.width).toBe("320px");
        // 写回链路自恰：拖拽写回 → watcher 迟到回调等值短路，值稳定不抖
        drag(dividerOf(root.querySelector("#host")!)!, 30);
        await nextTick();
        expect((engine.state as any).s.w).toBe(350);
        expect(p1.style.width).toBe("350px");
    });

    test("保持声明单位：% 声明外部写回保持 % 形态", async () => {
        const { root, engine } = mountSplitter(
            `<div id="app"><div x-scope><div id="host" x-splitter="'horizontal'">
                <div id="p1" :data-size="s.w">a</div><div>b</div>
            </div></div></div>`,
            { s: { w: "30%" } },
        );
        await nextTick();
        const p1 = root.querySelector("#p1")! as HTMLElement;
        expect(p1.style.width).toBe("30%");
        (engine.state as any).s.w = "45.5%";
        await nextTick();
        expect(p1.style.width).toBe("45.5%");
    });

    test("表达式形态只读降级 warn（状态→DOM 照常）", async () => {
        const warns: string[] = [];
        const orig = console.warn;
        console.warn = (...a: any[]) => warns.push(String(a[0] ?? ""));
        let m: any;
        try {
            m = mountSplitter(
                `<div id="app"><div x-scope><div id="host" x-splitter="'horizontal'">
                    <div id="p1" :data-size="s.w + 100">a</div><div>b</div>
                </div></div></div>`,
                { s: { w: 100 } },
            );
            await nextTick();
        } finally {
            console.warn = orig;
        }
        expect(warns.join()).toContain("非简单状态路径");
        expect((m.root.querySelector("#p1")! as HTMLElement).style.width).toBe("200px");
    });
});

// ── 折叠 ──────────────────────────────────────────────────────────────

describe("折叠（data-expandable 组合，ADR-0070）", () => {
    test("未声明无折叠能力；data-expandable 空属性启用（面板组合身份 + 把手 hover 显隐默认）", async () => {
        const { root } = mountSplitter(H_TMPL, {});
        await nextTick();
        expect(triggerOf(root.querySelector("#host")!)).toBeNull();
        const { root: root2 } = mountSplitter(
            `<div id="app"><div x-scope><div id="host" x-splitter="'horizontal'">
                <div id="p1" data-size="300" data-expandable>a</div><div>b</div>
            </div></div></div>`,
            {},
        );
        await nextTick();
        const p1 = root2.querySelector("#p1")! as HTMLElement;
        // 面板获得 x-expandable 组合身份（把手/动画/事件全管线挂面板）
        expect(p1.classList.contains("autospark-expandable")).toBe(true);
        expect(p1.getAttribute("data-direction")).toBe("left"); // sized 在前 → 向左收
        expect(p1.getAttribute("data-show-trigger")).toBe("hover"); // 默认 hover（ADR-0070 修订）
        const t = triggerOf(root2.querySelector("#host")!)! as HTMLElement;
        expect(t.getAttribute("role")).toBe("button");
        expect(t.getAttribute("tabindex")).toBe("0");
        expect(t.getAttribute("data-direction")).toBe("left");
        // 感应边条前置兄弟（共享把手契约；splitter 语境样式表抑制显示）
        expect(p1.querySelector(".autospark-expandable-edge")).not.toBeNull();
    });

    test("showTrigger：分隔条 hover 桥接显形（边条抑制）；always 显式透传", async () => {
        const { root } = mountSplitter(
            `<div id="app"><div x-scope>
                <div id="h1" x-splitter="'horizontal'">
                    <div id="p1" data-size="300" data-expandable>a</div><div>b</div></div>
                <div id="h2" x-splitter="'horizontal'">
                    <div id="p2" data-size="300" data-expandable='{"showTrigger":"always"}'>a</div><div>b</div></div>
            </div></div>`,
            {},
        );
        await nextTick();
        const p1 = document.getElementById("p1")! as HTMLElement;
        const p2 = document.getElementById("p2")! as HTMLElement;
        expect(p2.getAttribute("data-show-trigger")).toBe("always");
        // 边条抑制（splitter 语境：分隔条本身充当全长感应线）
        const css = document.getElementById("autospark-splitter-styles")!.textContent!;
        expect(css).toContain(
            ".autospark-splitter>.autospark-expandable>.autospark-expandable-edge{display:none!important;}",
        );
        // hover 桥接：分隔条 enter/leave 置位把手 data-edge-hover（统一桥接契约）
        const divider = dividerOf(document.getElementById("h1")!)!;
        const t1 = triggerOf(document.getElementById("h1")!)! as HTMLElement;
        divider.dispatchEvent(new MouseEvent("mouseenter", { bubbles: false }));
        expect(t1.hasAttribute("data-edge-hover")).toBe(true);
        divider.dispatchEvent(new MouseEvent("mouseleave", { bubbles: false }));
        expect(t1.hasAttribute("data-edge-hover")).toBe(false);
    });

    test("collapsible 旧选项已删除：声明不建把手（回归锁定）", async () => {
        const { root } = mountSplitter(
            `<div id="app"><div x-scope><div id="host" x-splitter="'horizontal'" x-splitter-options="{collapsible: true}">
                <div id="p1" data-size="300">a</div><div>b</div>
            </div></div></div>`,
            {},
        );
        await nextTick();
        expect(triggerOf(root.querySelector("#host")!)).toBeNull();
    });

    test("options JSON：pos 三态坐标透传；非法 JSON warn + 默认启用", async () => {
        const warns = catchWarns(() =>
            mountSplitter(
                `<div id="app"><div x-scope>
                    <div id="h1" x-splitter="'horizontal'">
                        <div data-size="100" data-expandable='{"pos": 80}'>a</div><div>b</div></div>
                    <div id="h2" x-splitter="'horizontal'">
                        <div data-size="100" data-expandable='{"pos":"-20%"}'>a</div><div>b</div></div>
                    <div id="h3" x-splitter="'horizontal'">
                        <div data-size="100" data-expandable='{bad}'>a</div><div>b</div></div>
                </div></div>`,
                {},
            ),
        );
        await nextTick();
        const g = (id: string) => triggerOf(document.getElementById(id)!)! as HTMLElement;
        expect(g("h1")).not.toBeNull();
        expect(g("h1").style.getPropertyValue("--as-pos")).toBe("80px");
        expect(g("h1").hasAttribute("data-pos-negative")).toBe(false);
        expect(g("h2").style.getPropertyValue("--as-pos")).toBe("20%");
        expect(g("h2").hasAttribute("data-pos-negative")).toBe(true);
        expect(g("h3").style.getPropertyValue("--as-pos")).toBe("50%"); // 解析失败回退居中（仍启用）
        expect(warns.join()).toContain("不是合法 JSON");
    });

    test("点击折叠（slide）：宽度保持 + 负 margin 滑出 + data-half；再点展开恢复（lastSize）", async () => {
        const { root } = mountSplitter(
            `<div id="app"><div x-scope><div id="host" x-splitter="'horizontal'">
                <div id="p1" data-size="300" data-expandable>a</div><div>b</div>
            </div></div></div>`,
            {},
        );
        await nextTick();
        const p1 = root.querySelector("#p1")! as HTMLElement;
        const t = triggerOf(root.querySelector("#host")!)!;
        t.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        // slide 隐藏（组合实例 margin 通道）：宽度保持（内容不挤压），负 margin 拉回占位
        expect(p1.style.width).toBe("300px");
        expect(p1.style.marginLeft).toBe("-300px");
        expect(p1.hasAttribute("data-collapsed")).toBe(true); // 宿主级（滑出折叠）
        expect(t.hasAttribute("data-collapsed")).toBe(true);
        expect(t.hasAttribute("data-half")).toBe(true); // 半圆形态判据（共享把手）
        t.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        expect(p1.style.marginLeft).toBe(""); // margin 清理
        expect(p1.style.width).toBe("300px"); // lastSize 恢复（composeSetMaxSize 喂给组合实例）
        expect(p1.hasAttribute("data-collapsed")).toBe(false);
        expect(t.hasAttribute("data-collapsed")).toBe(false);
        expect(t.hasAttribute("data-half")).toBe(false);
    });

    test("sized 在后：direction=right，slide 向右缘滑出（margin-right）", async () => {
        const { root } = mountSplitter(
            `<div id="app"><div x-scope><div id="host" x-splitter="'horizontal'">
                <div>a</div><div id="p2" data-size="200" data-expandable>b</div>
            </div></div></div>`,
            {},
        );
        await nextTick();
        const p2 = root.querySelector("#p2")! as HTMLElement;
        expect(p2.getAttribute("data-direction")).toBe("right");
        triggerOf(root.querySelector("#host")!)!.dispatchEvent(
            new MouseEvent("click", { bubbles: true }),
        );
        expect(p2.style.marginRight).toBe("-200px");
    });

    test("minSize>0：收缩折叠（width=minSize + data-shrunk）；拖拽跨目标翻转；lastSize 跟随拖拽", async () => {
        const { root } = mountSplitter(
            `<div id="app"><div x-scope><div id="host" x-splitter="'horizontal'">
                <div id="p1" data-size="300" data-expandable='{"minSize": 80}'>a</div><div>b</div>
            </div></div></div>`,
            {},
        );
        await nextTick();
        const host = root.querySelector("#host")! as HTMLElement;
        const p1 = root.querySelector("#p1")! as HTMLElement;
        const t = triggerOf(host)!;
        t.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        // 收缩模式：width 写目标值、无 margin 位移；pane 挂 data-shrunk（收缩态钩子）
        expect(p1.style.width).toBe("80px");
        expect(p1.style.marginLeft).toBe("");
        expect(p1.hasAttribute("data-shrunk")).toBe(true);
        expect(p1.hasAttribute("data-collapsed")).toBe(false); // data-collapsed 仅滑出折叠挂
        expect(t.hasAttribute("data-half")).toBe(false); // 收缩折叠全圆（不缩放图标）
        // 拖拽跨折叠目标 → 翻转为展开（组合实例接管 inline 尺寸）
        drag(dividerOf(host)!, 300);
        expect(p1.style.width).toBe("380px");
        expect(p1.hasAttribute("data-shrunk")).toBe(false);
        // 再折叠：lastSize 已更新为拖拽结果
        t.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        t.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        expect(p1.style.width).toBe("380px");
    });

    test("初始声明 == minSize = 初始折叠（收缩模式，不派发事件）", async () => {
        const { root } = mountSplitter(
            `<div id="app"><div x-scope><div id="host" x-splitter="'horizontal'">
                <div id="p1" data-size="80" data-expandable='{"minSize": 80}'>a</div><div>b</div>
            </div></div></div>`,
            {},
        );
        await nextTick(); // 初始应用在编译后微任务
        const host = root.querySelector("#host")! as HTMLElement;
        const p1 = root.querySelector("#p1")! as HTMLElement;
        expect(p1.hasAttribute("data-shrunk")).toBe(true);
        expect(p1.style.width).toBe("80px");
        let fired = 0;
        host.addEventListener("expandable:collapse", () => fired++);
        host.addEventListener("expandable:expand", () => fired++);
        triggerOf(host)!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        expect(fired).toBe(1); // 仅 expand（初始折叠不派发）
    });

    test("初始 data-size=0 = 初始折叠（slide，不派发事件）；展开回退默认 200px", async () => {
        const { root } = mountSplitter(
            `<div id="app"><div x-scope><div id="host" x-splitter="'horizontal'">
                <div id="p1" data-size="0" data-expandable>a</div><div>b</div>
            </div></div></div>`,
            {},
        );
        await nextTick();
        const host = root.querySelector("#host")! as HTMLElement;
        const p1 = root.querySelector("#p1")! as HTMLElement;
        expect(p1.hasAttribute("data-collapsed")).toBe(true);
        const t = triggerOf(host)!;
        expect(t.hasAttribute("data-collapsed")).toBe(true);
        expect(t.hasAttribute("data-half")).toBe(true);
        let fired = 0;
        host.addEventListener("expandable:collapse", () => fired++);
        host.addEventListener("expandable:expand", () => fired++);
        t.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        expect(p1.style.width).toBe("200px"); // 声明值 0 不可恢复 → 兜底 200px
        expect(fired).toBe(1); // 仅 expand（初始折叠不派发）
    });

    test("绑定形态：折叠写回状态 0 / 展开写回恢复值", async () => {
        const { root, engine } = mountSplitter(
            `<div id="app"><div x-scope><div id="host" x-splitter="'horizontal'">
                <div id="p1" :data-size="s.w" data-expandable>a</div><div>b</div>
            </div></div></div>`,
            { s: { w: 240 } },
        );
        await nextTick();
        const t = triggerOf(root.querySelector("#host")!)!;
        t.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        await nextTick();
        expect((engine.state as any).s.w).toBe(0);
        t.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        await nextTick();
        expect((engine.state as any).s.w).toBe(240);
        expect((root.querySelector("#p1") as HTMLElement).style.width).toBe("240px");
    });

    test("外部状态写 0 = 折叠；写非目标值 = 展开", async () => {
        const { root, engine } = mountSplitter(
            `<div id="app"><div x-scope><div id="host" x-splitter="'horizontal'">
                <div id="p1" :data-size="s.w" data-expandable>a</div><div>b</div>
            </div></div></div>`,
            { s: { w: 240 } },
        );
        await nextTick();
        const p1 = root.querySelector("#p1")! as HTMLElement;
        engine.state.s.w = 0;
        await nextTick();
        expect(p1.style.marginLeft).toBe("-240px"); // 折叠（slide）
        engine.state.s.w = 260;
        await nextTick();
        expect(p1.style.marginLeft).toBe(""); // 展开
        expect(p1.style.width).toBe("260px");
    });

    test("折叠写 0 绕过 min 钳制（slide 隐藏）；拖拽仍遵守 min", async () => {
        const { root } = mountSplitter(
            `<div id="app"><div x-scope><div id="host" x-splitter="'horizontal'">
                <div id="p1" data-size="300" data-min-size="120" data-expandable>a</div><div>b</div>
            </div></div></div>`,
            {},
        );
        await nextTick();
        const host = root.querySelector("#host")! as HTMLElement;
        const p1 = root.querySelector("#p1")! as HTMLElement;
        triggerOf(host)!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        expect(p1.style.marginLeft).toBe("-300px"); // slide 绕过 min
        triggerOf(host)!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        expect(p1.style.width).toBe("300px"); // lastSize 恢复
        drag(dividerOf(host)!, -500);
        expect(p1.style.width).toBe("120px"); // 拖拽遵守 min
    });

    test("拖拽跨折叠目标翻转载体布尔（slide 终态由组合实例承接）", async () => {
        const { root } = mountSplitter(
            `<div id="app"><div x-scope><div id="host" x-splitter="'horizontal'">
                <div id="p1" data-size="300" data-expandable>a</div><div>b</div>
            </div></div></div>`,
            {},
        );
        await nextTick();
        const host = root.querySelector("#host")! as HTMLElement;
        const p1 = root.querySelector("#p1")! as HTMLElement;
        drag(dividerOf(host)!, -400);
        expect(p1.style.marginLeft).toBe("-300px"); // 跨 0 → slide 隐藏
        expect(p1.hasAttribute("data-collapsed")).toBe(true);
        drag(dividerOf(host)!, 500);
        expect(p1.style.marginLeft).toBe(""); // 反向拖拽 → 展开
        expect(p1.hasAttribute("data-collapsed")).toBe(false);
    });

    test("direction/maxSize 由分割器接管（声明 warn 忽略）；把手箭头 = 全局图标 arrow", async () => {
        const warns = catchWarns(() =>
            mountSplitter(
                `<div id="app"><div x-scope><div id="host" x-splitter="'horizontal'">
                    <div id="p1" data-size="300" data-expandable='{"direction":"top","maxSize":500}'>a</div><div>b</div>
                </div></div></div>`,
                {},
            ),
        );
        await nextTick();
        expect(warns.join()).toContain("由分割器接管");
        const p1 = document.querySelector("#p1")! as HTMLElement;
        expect(p1.getAttribute("data-direction")).toBe("left"); // 位次推导覆盖声明
        const use = triggerOf(p1)! .querySelector("use");
        expect(use).not.toBeNull();
        expect(use!.getAttribute("href")).toBe("#as-arrow");
    });

    test("自适应面板声明 data-expandable：warn + 忽略；双 auto 无把手", async () => {
        const warns = catchWarns(() =>
            mountSplitter(
                `<div id="app"><div x-scope>
                    <div id="h1" x-splitter="'horizontal'">
                        <div data-expandable>a</div><div id="s2" data-size="300">b</div></div>
                    <div id="h2" x-splitter="'horizontal'">
                        <div data-expandable>a</div><div data-expandable>b</div></div>
                </div></div>`,
                {},
            ),
        );
        await nextTick();
        expect(warns.join()).toContain("仅定容面板");
        expect(triggerOf(document.getElementById("h1")!)).toBeNull();
        expect(triggerOf(document.getElementById("h2")!)).toBeNull();
    });

    test("真实事件序：把手 pointerdown（stopPropagation）不启动拖拽，后续 click 正常折叠", async () => {
        const { root } = mountSplitter(
            `<div id="app"><div x-scope><div id="host" x-splitter="'horizontal'">
                <div id="p1" data-size="300" data-expandable>a</div><div>b</div>
            </div></div></div>`,
            {},
        );
        await nextTick();
        const p1 = root.querySelector("#p1")! as HTMLElement;
        const t = triggerOf(root.querySelector("#host")!)!;
        // 回归：把手 pointerdown 须不落入分隔条拖拽（共享把手 onActivate 与拖拽正交）
        t.dispatchEvent(
            new MouseEvent("pointerdown", { bubbles: true, clientX: 100, clientY: 100, button: 0 }),
        );
        t.dispatchEvent(
            new MouseEvent("pointermove", { bubbles: true, clientX: 150, clientY: 100 }),
        );
        expect(p1.style.width).toBe("300px"); // 拖拽会话未启动
        t.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        expect(p1.style.marginLeft).toBe("-300px"); // click 折叠生效（slide 隐藏）
    });

    test("把手键盘触发（Enter / Space 兑现 role=button）", async () => {
        const { root } = mountSplitter(
            `<div id="app"><div x-scope><div id="host" x-splitter="'horizontal'">
                <div id="p1" data-size="300" data-expandable>a</div><div>b</div>
            </div></div></div>`,
            {},
        );
        await nextTick();
        const p1 = root.querySelector("#p1")! as HTMLElement;
        const t = triggerOf(root.querySelector("#host")!)!;
        expect(t.getAttribute("tabindex")).toBe("0");
        t.dispatchEvent(
            new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }),
        );
        expect(p1.style.marginLeft).toBe("-300px");
        t.dispatchEvent(
            new KeyboardEvent("keydown", { key: " ", bubbles: true, cancelable: true }),
        );
        expect(p1.style.marginLeft).toBe("");
        expect(p1.style.width).toBe("300px");
    });

    test("offset 默认注入分隔条宽度一半（与 sized 位次相关：首位 + / 次位 −）；显式声明覆盖", async () => {        const { root } = mountSplitter(
            `<div id="app"><div x-scope>
                <div id="h1" x-splitter="'horizontal'">
                    <div data-size="300" data-expandable>a</div><div>b</div></div>
                <div id="h2" x-splitter="'horizontal'">
                    <div>a</div><div id="p2" data-size="200" data-expandable>b</div></div>
                <div id="h3" x-splitter="'horizontal'">
                    <div data-size="300" data-expandable='{"offset": 6}'>a</div><div>b</div></div>
            </div></div>`,
            {},
        );
        await nextTick();
        const t1 = triggerOf(document.getElementById("h1")!)! as HTMLElement;
        const t2 = triggerOf(document.getElementById("h2")!)! as HTMLElement;
        const t3 = triggerOf(document.getElementById("h3")!)! as HTMLElement;
        // 首位（direction left，分隔条在跨轴正方向）→ +half；次位 → −half
        expect(t1.style.getPropertyValue("--as-offset")).toBe(
            "calc(var(--autospark-splitter-hit-size, 4px) / 2)",
        );
        expect(t2.style.getPropertyValue("--as-offset")).toBe(
            "calc(-1 * var(--autospark-splitter-hit-size, 4px) / 2)",
        );
        // 用户显式声明 offset → 尊重不覆盖
        expect(t3.style.getPropertyValue("--as-offset")).toBe("6px");
    });

    test("data-expandable 的 resize 由分割器接管（warn 忽略，面板调节走分隔条拖拽，ADR-0073 修订）", async () => {
        const warns = catchWarns(() =>
            mountSplitter(
                `<div id="app"><div x-scope><div id="host" x-splitter="'horizontal'">
                    <div id="p1" data-size="300" data-expandable='{"resize": true}'>a</div><div>b</div>
                </div></div></div>`,
                {},
            ),
        );
        await nextTick();
        expect(warns.some((w) => w.includes('"resize" 由分割器接管'))).toBe(true);
        // 面板无内建 resize 手柄（调节入口唯一 = 分隔条拖拽）
        const p1 = document.getElementById("p1")! as HTMLElement;
        expect(p1.querySelector("[data-autospark-resize-handle]")).toBeNull();
    });
});

// ── 事件 ──────────────────────────────────────────────────────────────

describe("事件", () => {
    test("splitter:resize（end 时派发，detail.size 保持声明形态，宿主冒泡）", () => {
        const { root } = mountSplitter(
            `<div id="app"><div x-scope><div id="host" x-splitter="'horizontal'">
                <div id="p1" :data-size="s.w">a</div><div>b</div>
            </div></div></div>`,
            { s: { w: 200 } },
        );
        const host = root.querySelector("#host")!;
        let detail: any = null;
        host.addEventListener("splitter:resize", (e: any) => (detail = e.detail));
        drag(dividerOf(host)!, 45);
        expect(detail).toEqual({ size: 245 });
    });

    test("expandable:collapse / expand 面板派发冒泡到宿主（splitter:collapse/expand 已删除）", async () => {
        const { root } = mountSplitter(
            `<div id="app"><div x-scope><div id="host" x-splitter="'horizontal'">
                <div id="p1" data-size="300" data-expandable>a</div><div>b</div>
            </div></div></div>`,
            {},
        );
        await nextTick();
        const host = root.querySelector("#host")!;
        const seq: string[] = [];
        let lastDetail: any = null;
        host.addEventListener("expandable:collapse", (e: any) => {
            seq.push("collapse");
            lastDetail = e.detail;
        });
        host.addEventListener("expandable:expand", (e: any) => {
            seq.push("expand");
            lastDetail = e.detail;
        });
        const t = triggerOf(host)!;
        t.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        t.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        expect(seq).toEqual(["collapse", "expand"]);
        expect(lastDetail).toEqual({ size: "300px" }); // 展开尺寸 = lastSize（formatCss 形态）
        // 拖拽（非跨 0）不派发折叠事件
        seq.length = 0;
        drag(dividerOf(host)!, 50);
        expect(seq).toEqual([]);
    });

    test("拖拽跨折叠目标：事件即时派发（跨目标瞬间）+ end 派发 resize", async () => {
        const { root } = mountSplitter(
            `<div id="app"><div x-scope><div id="host" x-splitter="'horizontal'">
                <div id="p1" data-size="80" data-expandable>a</div><div>b</div>
            </div></div></div>`,
            {},
        );
        await nextTick();
        const host = root.querySelector("#host")!;
        const seq: string[] = [];
        host.addEventListener("expandable:collapse", () => seq.push("collapse"));
        host.addEventListener("expandable:expand", () => seq.push("expand"));
        host.addEventListener("splitter:resize", () => seq.push("resize"));
        drag(dividerOf(host)!, -200);
        expect(seq).toEqual(["collapse", "resize"]); // 跨目标瞬间派发（组合实例事件管线）
    });
});

// ── 键盘微调 ──────────────────────────────────────────────────────────

describe("键盘微调", () => {
    test("方向键 = 分隔条位移方向（±1 / Shift ±10），sized 在前时 ArrowRight 增", () => {
        const { root } = mountSplitter(H_TMPL, {});
        const host = root.querySelector("#host")! as HTMLElement;
        const p1 = root.querySelector("#p1")! as HTMLElement;
        const d = dividerOf(host)!;
        d.dispatchEvent(
            new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true }),
        );
        expect(p1.style.width).toBe("301px");
        d.dispatchEvent(
            new KeyboardEvent("keydown", {
                key: "ArrowRight",
                shiftKey: true,
                bubbles: true,
                cancelable: true,
            }),
        );
        expect(p1.style.width).toBe("311px");
        d.dispatchEvent(
            new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true, cancelable: true }),
        );
        expect(p1.style.width).toBe("310px");
        // sized 在后：ArrowLeft = 分隔条左移 = 增
        const { root: root2 } = mountSplitter(
            `<div id="app"><div x-scope><div id="host" x-splitter="'horizontal'">
                <div>a</div><div id="p2" data-size="200">b</div>
            </div></div></div>`,
            {},
        );
        const p2 = root2.querySelector("#p2")! as HTMLElement;
        dividerOf(root2.querySelector("#host")!)!.dispatchEvent(
            new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true, cancelable: true }),
        );
        expect(p2.style.width).toBe("201px");
    });

    test("键盘会话 keyup 收尾（end 事件）", () => {
        const { root } = mountSplitter(H_TMPL, {});
        const host = root.querySelector("#host")! as HTMLElement;
        const seq: string[] = [];
        host.addEventListener("splitter:resize", () => seq.push("resize"));
        const d = dividerOf(host)!;
        d.dispatchEvent(
            new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true }),
        );
        d.dispatchEvent(new KeyboardEvent("keyup", { key: "ArrowRight", bubbles: true }));
        expect(seq).toEqual(["resize"]);
    });
});

// ── 嵌套 ──────────────────────────────────────────────────────────────

describe("嵌套", () => {
    test("面板内嵌套 splitter 正常编译（零新机制）", () => {
        const { root } = mountSplitter(
            `<div id="app"><div x-scope><div id="host" x-splitter="'horizontal'">
                <div id="p1" data-size="300" x-splitter="'vertical'">
                    <div data-size="100">t</div><div>m</div>
                </div>
                <div>b</div>
            </div></div></div>`,
            {},
        );
        const p1 = root.querySelector("#p1")!;
        expect(p1.getAttribute("data-direction")).toBe("vertical");
        expect(p1.querySelectorAll(":scope > [data-autospark-splitter-pane]").length).toBe(2);
    });
});
