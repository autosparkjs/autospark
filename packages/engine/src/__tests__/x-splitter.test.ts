import { describe, expect, test, afterEach } from "bun:test";
import "./setup";
import { mount, nextTick } from "./helpers";

/**
 * x-splitter 分割器指令测试（ADR-0067）。
 *
 * 覆盖面：结构契约（两面板 + 分隔条组装 / 多余子元素 warn 丢弃 / template-script 容忍 /
 * 不足两个降级 / 2 sized 降级）、direction（字面量与响应式切换换轴重排）、data-size 家族
 * （静态值 inline / 绑定剥除与初值 / auto 面板 min/max warn）、拖拽（前后方向语义 / min-max
 * 钳制 / 绝对式数学）、双向绑定（写回状态 / 外部反向同步 / 等值短路防递归 / 表达式只读降级）、
 * 折叠（把手三态坐标 / 点击折叠写 0 / lastSize 恢复 / 初始 0 不派发事件 / 折叠绕过 min）、
 * 事件（splitter:resize/collapse/expand）、静态形态（双 auto）、键盘微调。
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
const triggerOf = (host: Element) => host.querySelector(".autospark-splitter-trigger");

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

describe("折叠（collapsible）", () => {
    test("默认不建把手；collapsible: true 建居中把手（坐标变量 50%、无负向属性）", () => {
        const { root } = mountSplitter(H_TMPL, {});
        expect(triggerOf(root.querySelector("#host")!)).toBeNull();
        const { root: root2 } = mountSplitter(
            `<div id="app"><div x-scope><div id="host" x-splitter="'horizontal'" x-splitter-options="{collapsible: true}">
                <div id="p1" data-size="300">a</div><div>b</div>
            </div></div></div>`,
            {},
        );
        const t = triggerOf(root2.querySelector("#host")!)! as HTMLElement;
        expect(t.getAttribute("data-side")).toBe("first");
        expect(t.style.getPropertyValue("--as-rail")).toBe("50%");
        expect(t.hasAttribute("data-rail-negative")).toBe(false);
    });

    test("三态坐标：number 正值主端 / 负值对端（data-rail-negative）；非法值 warn 回退居中", () => {
        const warns: string[] = [];
        const orig = console.warn;
        console.warn = (...a: any[]) => warns.push(String(a[0] ?? ""));
        let m: any;
        try {
            m = mountSplitter(
                `<div id="app"><div x-scope>
                    <div id="h1" x-splitter="'horizontal'" x-splitter-options="{collapsible: 80}">
                        <div data-size="100">a</div><div>b</div></div>
                    <div id="h2" x-splitter="'horizontal'" x-splitter-options="{collapsible: '-20%'}">
                        <div data-size="100">a</div><div>b</div></div>
                    <div id="h3" x-splitter="'horizontal'" x-splitter-options="{collapsible: 'bad'}">
                        <div data-size="100">a</div><div>b</div></div>
                </div></div>`,
                {},
            );
        } finally {
            console.warn = orig;
        }
        const t1 = triggerOf(m.root.querySelector("#h1")!)! as HTMLElement;
        const t2 = triggerOf(m.root.querySelector("#h2")!)! as HTMLElement;
        const t3 = triggerOf(m.root.querySelector("#h3")!)! as HTMLElement;
        expect(t1.style.getPropertyValue("--as-rail")).toBe("80px");
        expect(t1.hasAttribute("data-rail-negative")).toBe(false);
        expect(t2.style.getPropertyValue("--as-rail")).toBe("20%");
        expect(t2.hasAttribute("data-rail-negative")).toBe(true);
        expect(t3.style.getPropertyValue("--as-rail")).toBe("50%");
        expect(warns.join()).toContain("无法解析为坐标");
    });

    test("点击折叠（默认 0 目标 = slide 隐藏）：宽度保持 + 负 margin 滑出；再点展开恢复", () => {
        const { root } = mountSplitter(
            `<div id="app"><div x-scope><div id="host" x-splitter="'horizontal'" x-splitter-options="{collapsible: true}">
                <div id="p1" data-size="300">a</div><div>b</div>
            </div></div></div>`,
            {},
        );
        const host = root.querySelector("#host")! as HTMLElement;
        const p1 = root.querySelector("#p1")! as HTMLElement;
        const t = triggerOf(host)!;
        t.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        // slide 隐藏：宽度保持（内容不挤压），负 margin 拉回占位——面板整体滑出容器左缘
        expect(p1.style.width).toBe("300px");
        expect(p1.style.marginLeft).toBe("-300px");
        expect(p1.hasAttribute("data-collapsed")).toBe(true);
        expect(t.hasAttribute("data-collapsed")).toBe(true);
        t.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        expect(p1.style.marginLeft).toBe(""); // margin 清理
        expect(p1.style.width).toBe("300px"); // lastSize 恢复
        expect(p1.hasAttribute("data-collapsed")).toBe(false);
        // 展开态 data-collapsed 为存在性属性：必须不存在（恒 setAttribute(String) 会让
        // "false" 命中 CSS [data-collapsed]——箭头恒显示折叠方向的根因回归）
        expect(t.hasAttribute("data-collapsed")).toBe(false);
    });

    test("sized 在后：slide 向右缘滑出（margin-right）", () => {
        const { root } = mountSplitter(
            `<div id="app"><div x-scope><div id="host" x-splitter="'horizontal'" x-splitter-options="{collapsible: true}">
                <div>a</div><div id="p2" data-size="200">b</div>
            </div></div></div>`,
            {},
        );
        const p2 = root.querySelector("#p2")! as HTMLElement;
        triggerOf(root.querySelector("#host")!)!.dispatchEvent(
            new MouseEvent("click", { bubbles: true }),
        );
        expect(p2.style.marginRight).toBe("-200px");
    });

    test("data-minimize-size > 0：折叠收缩到指定尺寸（非 slide）；展开恢复", () => {
        const { root } = mountSplitter(
            `<div id="app"><div x-scope><div id="host" x-splitter="'horizontal'" x-splitter-options="{collapsible: true}">
                <div id="p1" data-size="300" data-minimize-size="80">a</div><div>b</div>
            </div></div></div>`,
            {},
        );
        const host = root.querySelector("#host")! as HTMLElement;
        const p1 = root.querySelector("#p1")! as HTMLElement;
        const t = triggerOf(host)!;
        t.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        // 目标 > 0 = 收缩模式：width 写目标值，无 margin 位移
        expect(p1.style.width).toBe("80px");
        expect(p1.style.marginLeft).toBe("");
        expect(p1.hasAttribute("data-collapsed")).toBe(true);
        // 拖拽仍遵守 min（minimize 不参与拖拽钳制）：从折叠值 80 拖 +300 = 380
        drag(dividerOf(host)!, 300);
        expect(p1.style.width).toBe("380px");
        expect(p1.hasAttribute("data-collapsed")).toBe(false);
        // 再折叠：lastSize 已更新为拖拽结果
        t.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        t.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        expect(p1.style.width).toBe("380px");
    });

    test("初始 data-size=minimize 值 = 初始折叠态（收缩模式）", () => {
        const { root } = mountSplitter(
            `<div id="app"><div x-scope><div id="host" x-splitter="'horizontal'" x-splitter-options="{collapsible: true}">
                <div id="p1" data-size="80" data-minimize-size="80">a</div><div>b</div>
            </div></div></div>`,
            {},
        );
        const p1 = root.querySelector("#p1")! as HTMLElement;
        expect(p1.hasAttribute("data-collapsed")).toBe(true);
        expect(p1.style.width).toBe("80px");
    });

    test("箭头 = 全局图标 arrow（svg use 载体）", () => {
        const { root } = mountSplitter(
            `<div id="app"><div x-scope><div id="host" x-splitter="'horizontal'" x-splitter-options="{collapsible: true}">
                <div data-size="300">a</div><div>b</div>
            </div></div></div>`,
            {},
        );
        const t = triggerOf(root.querySelector("#host")!)!;
        const use = t.querySelector("use");
        expect(use).not.toBeNull();
        expect(use!.getAttribute("href")).toBe("#as-arrow");
    });

    test("绑定形态折叠：写回状态 0 / 恢复写回记忆值", async () => {
        const { root, engine } = mountSplitter(
            `<div id="app"><div x-scope><div id="host" x-splitter="'horizontal'" x-splitter-options="{collapsible: true}">
                <div id="p1" :data-size="s.w">a</div><div>b</div>
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
    });

    test("初始 data-size=0 = 初始折叠态（不派发事件）", () => {
        const { root } = mountSplitter(
            `<div id="app"><div x-scope><div id="host" x-splitter="'horizontal'" x-splitter-options="{collapsible: true}">
                <div id="p1" data-size="0">a</div><div>b</div>
            </div></div></div>`,
            {},
        );
        const host = root.querySelector("#host")! as HTMLElement;
        const p1 = root.querySelector("#p1")! as HTMLElement;
        expect(p1.hasAttribute("data-collapsed")).toBe(true);
        expect(triggerOf(host)!.hasAttribute("data-collapsed")).toBe(true);
        let fired = 0;
        host.addEventListener("splitter:collapse", () => fired++);
        host.addEventListener("splitter:expand", () => fired++);
        // 展开恢复走声明值缺失 → 回退默认 200px
        triggerOf(host)!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        expect(p1.style.width).toBe("200px");
        expect(fired).toBe(1); // 仅 expand（初始折叠不派发）
    });

    test("折叠写 0 绕过 min 钳制（slide 隐藏）；拖拽仍遵守 min", () => {
        const { root } = mountSplitter(
            `<div id="app"><div x-scope><div id="host" x-splitter="'horizontal'" x-splitter-options="{collapsible: true}">
                <div id="p1" data-size="300" data-min-size="120">a</div><div>b</div>
            </div></div></div>`,
            {},
        );
        const host = root.querySelector("#host")! as HTMLElement;
        const p1 = root.querySelector("#p1")! as HTMLElement;
        triggerOf(host)!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        expect(p1.style.marginLeft).toBe("-300px"); // slide 绕过 min
        triggerOf(host)!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        expect(p1.style.width).toBe("300px"); // lastSize 恢复
        drag(dividerOf(host)!, -500);
        expect(p1.style.width).toBe("120px"); // 拖拽遵守 min
    });

    test("双 auto 静态形态 collapsible 不生效（无把手）", () => {
        const { root } = mountSplitter(
            `<div id="app"><div x-scope><div id="host" x-splitter="'horizontal'" x-splitter-options="{collapsible: true}">
                <div>a</div><div>b</div>
            </div></div></div>`,
            {},
        );
        expect(triggerOf(root.querySelector("#host")!)).toBeNull();
    });

    test("真实事件序：把手 pointerdown（stopPropagation）不启动拖拽，后续 click 正常折叠", () => {
        const { root } = mountSplitter(
            `<div id="app"><div x-scope><div id="host" x-splitter="'horizontal'" x-splitter-options="{collapsible: true}">
                <div id="p1" data-size="300">a</div><div>b</div>
            </div></div></div>`,
            {},
        );
        const host = root.querySelector("#host")! as HTMLElement;
        const p1 = root.querySelector("#p1")! as HTMLElement;
        const t = triggerOf(host)!;
        // 回归：分隔条 pointerdown 的 preventDefault 会抑制合成 click——把手必须拦截冒泡
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

    test("把手键盘触发（Enter / Space 兑现 role=button）", () => {
        const { root } = mountSplitter(
            `<div id="app"><div x-scope><div id="host" x-splitter="'horizontal'" x-splitter-options="{collapsible: true}">
                <div id="p1" data-size="300">a</div><div>b</div>
            </div></div></div>`,
            {},
        );
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

    test("跨 0 翻转派发 collapse / expand；非跨 0 变更不派发", () => {
        const { root } = mountSplitter(
            `<div id="app"><div x-scope><div id="host" x-splitter="'horizontal'" x-splitter-options="{collapsible: true}">
                <div id="p1" data-size="300">a</div><div>b</div>
            </div></div></div>`,
            {},
        );
        const host = root.querySelector("#host")!;
        const seq: string[] = [];
        let lastDetail: any = null;
        host.addEventListener("splitter:collapse", (e: any) => {
            seq.push("collapse");
            lastDetail = e.detail;
        });
        host.addEventListener("splitter:expand", (e: any) => {
            seq.push("expand");
            lastDetail = e.detail;
        });
        const t = triggerOf(host)!;
        t.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        t.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        expect(seq).toEqual(["collapse", "expand"]);
        expect(lastDetail).toEqual({ size: 300 });
        // 拖拽（非跨 0）不派发折叠事件
        seq.length = 0;
        drag(dividerOf(host)!, 50);
        expect(seq).toEqual([]);
    });

    test("拖拽跨 0 翻转补派发折叠事件（会话中抑制、end 统一派发）", () => {
        const { root } = mountSplitter(
            `<div id="app"><div x-scope><div id="host" x-splitter="'horizontal'">
                <div id="p1" data-size="80" data-min-size="0">a</div><div>b</div>
            </div></div></div>`,
            {},
        );
        const host = root.querySelector("#host")!;
        const seq: string[] = [];
        host.addEventListener("splitter:collapse", () => seq.push("collapse"));
        host.addEventListener("splitter:expand", () => seq.push("expand"));
        host.addEventListener("splitter:resize", () => seq.push("resize"));
        drag(dividerOf(host)!, -200);
        expect(seq).toEqual(["resize", "collapse"]);
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
