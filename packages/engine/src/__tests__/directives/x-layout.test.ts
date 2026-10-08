import { describe, expect, test, afterEach } from "bun:test";
import "../setup";
import { mount, nextTick } from "../helpers";

/**
 * x-layout 布局容器测试（ADR-0072，M1–M4 全阶段）。
 *
 * 覆盖面：结构契约（五窗格 areas / 缺省降级 / 缺 content 降级 / 全无窗格空容器 / 非 pane
 * 剪枝 / template-script 容忍）、词表（sidebar 缺省 .left / 词表外剪枝 / 孤儿 pane warn）、
 * through（up / down / up,down / 双侧夹 header / header-footer 上声明 warn / 同侧非首个
 * warn）、同侧多窗格与窗格分割（x-splitter 组合 / 嵌套链 / data-size 迁移）、选项（gap /
 * height/width inline / 无效组合 warn / 未知键 warn）、存在性回流（x-show 剔除与恢复 /
 * x-if eager 移除 / keepalive 复挂）、行为组合（默认注入 expandable/resize / 显式优先 /
 * opt-out / direction 接管 / 拖拽折叠联动与 lastSize 恢复链）、patch 动态区域拒绝。
 *
 * 约定：happy-dom 无布局——断言 inline style 的模板串与契约属性，不做几何断言；
 * resize 手柄经 compile 微任务建连、expandable 组合实例同步挂把手（把手点击即驱动 driver）。
 */

const engines: any[] = [];
const roots: HTMLElement[] = [];
const mountLayout = (html: string, state: any = {}, options?: any) => {
    const m = mount(html, state, options);
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

/** 宿主 grid 模板三件套读值 */
const gridOf = (host: Element) => ({
    areas: (host as HTMLElement).style.gridTemplateAreas,
    rows: (host as HTMLElement).style.gridTemplateRows,
    cols: (host as HTMLElement).style.gridTemplateColumns,
});
const panesOf = (host: Element) =>
    [...host.querySelectorAll("[data-autospark-layout-pane]")] as HTMLElement[];

/** 标准五窗格布局 */
const FULL_TMPL = `<div id="app"><div x-scope>
    <div id="host" x-layout>
        <div id="hd" x-pane:header>H</div>
        <div id="ct" x-pane:content>C</div>
        <div id="ls" x-pane:sidebar.left>L</div>
        <div id="rs" x-pane:sidebar.right>R</div>
        <div id="ft" x-pane:footer>F</div>
    </div>
</div></div>`;

afterEach(() => {
    while (engines.length) engines.pop()?.destroy();
    while (roots.length) roots.pop()?.remove();
});

// ── 结构契约 ──────────────────────────────────────────────────────────

describe("结构契约", () => {
    test("五窗格默认布局：全宽 header/footer + 三列中部（header 全宽是缺省态）", () => {
        const { root } = mountLayout(FULL_TMPL, {});
        const host = root.querySelector("#host")!;
        expect(host.classList.contains("autospark-layout")).toBe(true);
        expect(gridOf(host)).toEqual({
            areas: `"header header header" "left content right" "footer footer footer"`,
            rows: "auto 1fr auto",
            cols: "auto 1fr auto",
        });
        const panes = panesOf(host);
        expect(panes.length).toBe(5);
        expect(panes.map((p) => p.id)).toEqual(["hd", "ls", "ct", "rs", "ft"]);
        expect(panes[0]!.style.gridArea).toBe("header");
        expect(panes[1]!.style.gridArea).toBe("left");
        expect(panes[2]!.style.gridArea).toBe("content");
        // x-pane 属性已从结果 DOM 剥除；窗格恒 position:relative（CSS 类承担）
        expect(root.querySelector("[x-pane]")).toBeNull();
    });

    test("只有 content：单格 areas", () => {
        const { root } = mountLayout(
            `<div id="app"><div x-scope><div id="host" x-layout><div id="ct" x-pane:content>C</div></div></div></div>`,
            {},
        );
        expect(gridOf(root.querySelector("#host")!)).toEqual({
            areas: `"content"`,
            rows: "1fr",
            cols: "1fr",
        });
    });

    test("缺 content：warn + 降级（容器照建、content 位 `.` 空洞）", () => {
        let m: any;
        const warns = catchWarns(() => {
            m = mountLayout(
                `<div id="app"><div x-scope><div id="host" x-layout>
                    <div id="hd" x-pane:header>H</div>
                    <div id="ft" x-pane:footer>F</div>
                </div></div></div>`,
                {},
            );
        });
        expect(warns.some((w) => w.includes("x-pane:content"))).toBe(true);
        const host = m.root.querySelector("#host")!;
        expect(gridOf(host).areas).toBe(`"header" "." "footer"`);
    });

    test("全无窗格：warn + 空容器（剪枝语义一致，不回退普通编译）", () => {
        let m: any;
        const warns = catchWarns(() => {
            m = mountLayout(
                `<div id="app"><div x-scope><div id="host" x-layout><div>stray</div></div></div></div>`,
                {},
            );
        });
        expect(warns.some((w) => w.includes("未发现任何 x-pane"))).toBe(true);
        expect(panesOf(m.root.querySelector("#host")!).length).toBe(0);
    });

    test("非 pane 子元素剪枝 + warn；template/script 静默容忍", () => {
        let m: any;
        const warns = catchWarns(() => {
            m = mountLayout(
                `<div id="app"><div x-scope><div id="host" x-layout>
                    <template><div>t</div></template>
                    <script type="text/x-t">x</` +
                    `script>
                    <div>stray</div>
                    <div id="ct" x-pane:content>C</div>
                </div></div></div>`,
                {},
            );
        });
        expect(warns.some((w) => w.includes("已被剪枝"))).toBe(true);
        const host = m.root.querySelector("#host")!;
        expect(host.querySelectorAll("template, script").length).toBe(0);
        expect(panesOf(host).length).toBe(1);
    });
});

// ── 词表与语法 ────────────────────────────────────────────────────────

describe("词表与语法", () => {
    test("sidebar 缺 .left/.right 缺省按 .left", () => {
        const { root } = mountLayout(
            `<div id="app"><div x-scope><div id="host" x-layout>
                <div id="ls" x-pane:sidebar>L</div>
                <div id="ct" x-pane:content>C</div>
            </div></div></div>`,
            {},
        );
        expect(gridOf(root.querySelector("#host")!).areas).toBe(`"left content"`);
        const ls = root.querySelector("#ls")!;
        expect(ls.style.gridArea).toBe("left");
    });

    test("参数词表外剪枝 + warn", () => {
        let m: any;
        const warns = catchWarns(() => {
            m = mountLayout(
                `<div id="app"><div x-scope><div id="host" x-layout>
                    <div id="bad" x-pane:aside>B</div>
                    <div id="ct" x-pane:content>C</div>
                </div></div></div>`,
                {},
            );
        });
        expect(warns.some((w) => w.includes("不在布局单元词表内"))).toBe(true);
        expect(m.root.querySelector("#bad")).toBeNull();
    });

    test("孤儿 x-pane（无 x-layout 祖先）warn + 子树照常编译", () => {
        let m: any;
        const warns = catchWarns(() => {
            m = mountLayout(
                `<div id="app"><div x-scope><div id="lonely" x-pane:header>L</div></div></div>`,
                {},
            );
        });
        expect(warns.some((w) => w.includes("仅可作为 x-layout 的直接子元素"))).toBe(true);
        expect(m.root.querySelector("#lonely")!.textContent).toBe("L");
    });

    test("深层 x-pane warn（窗格必须是 x-layout 直接子元素）", () => {
        const warns = catchWarns(() =>
            mountLayout(
                `<div id="app"><div x-scope><div id="host" x-layout>
                    <div id="ct" x-pane:content><div x-pane:header>deep</div></div>
                </div></div></div>`,
                {},
            ),
        );
        expect(warns.some((w) => w.includes("仅可作为 x-layout 的直接子元素"))).toBe(true);
    });
});

// ── through 贯穿 ──────────────────────────────────────────────────────

describe("through 贯穿", () => {
    test("sidebar.left through=up（修饰符形态）：上延占 header 行带、header 推向对侧", () => {
        const { root } = mountLayout(
            `<div id="app"><div x-scope><div id="host" x-layout>
                <div id="hd" x-pane:header>H</div>
                <div id="ct" x-pane:content>C</div>
                <div id="ls" x-pane:sidebar.left.up>L</div>
            </div></div></div>`,
            {},
        );
        expect(gridOf(root.querySelector("#host")!).areas).toBe(`"left header" "left content"`);
    });

    test("through=up,down（选项形态 ≡ 修饰符形态）：上下贯通、header/footer 均被推让", () => {
        const { root } = mountLayout(
            `<div id="app"><div x-scope><div id="host" x-layout>
                <div id="hd" x-pane:header>H</div>
                <div id="ct" x-pane:content>C</div>
                <div id="ft" x-pane:footer>F</div>
                <div id="ls" x-pane:sidebar.left x-pane-options="{through:'up,down'}">L</div>
            </div></div></div>`,
            {},
        );
        expect(gridOf(root.querySelector("#host")!).areas).toBe(
            `"left header" "left content" "left footer"`,
        );
    });

    test("through=down：下延占 footer 行带、footer 推向对侧", () => {
        const { root } = mountLayout(
            `<div id="app"><div x-scope><div id="host" x-layout>
                <div id="ct" x-pane:content>C</div>
                <div id="ft" x-pane:footer>F</div>
                <div id="ls" x-pane:sidebar.left x-pane-options="{through:'down'}">L</div>
            </div></div></div>`,
            {},
        );
        expect(gridOf(root.querySelector("#host")!).areas).toBe(`"left content" "left footer"`);
    });

    test("双侧 through=up：header 被夹在中间", () => {
        const { root } = mountLayout(
            `<div id="app"><div x-scope><div id="host" x-layout>
                <div id="hd" x-pane:header>H</div>
                <div id="ct" x-pane:content>C</div>
                <div id="ls" x-pane:sidebar.left.up>L</div>
                <div id="rs" x-pane:sidebar.right.up>R</div>
            </div></div></div>`,
            {},
        );
        expect(gridOf(root.querySelector("#host")!).areas).toBe(
            `"left header right" "left content right"`,
        );
    });

    test("右侧 through=up、左侧未贯穿：header 让位于右、覆盖左上方", () => {
        const { root } = mountLayout(
            `<div id="app"><div x-scope><div id="host" x-layout>
                <div id="hd" x-pane:header>H</div>
                <div id="ct" x-pane:content>C</div>
                <div id="ls" x-pane:sidebar.left>L</div>
                <div id="rs" x-pane:sidebar.right.up>R</div>
            </div></div></div>`,
            {},
        );
        expect(gridOf(root.querySelector("#host")!).areas).toBe(
            `"header header right" "left content right"`,
        );
    });

    test("header/footer 上的 through 声明 warn + 忽略", () => {
        let m: any;
        const warns = catchWarns(() => {
            m = mountLayout(
                `<div id="app"><div x-scope><div id="host" x-layout>
                    <div id="hd" x-pane:header.up>H</div>
                    <div id="ct" x-pane:content>C</div>
                </div></div></div>`,
                {},
            );
        });
        expect(warns.some((w) => w.includes("仅 sidebar 支持"))).toBe(true);
        expect(gridOf(m.root.querySelector("#host")!).areas).toBe(`"header" "content"`);
    });

    test("同侧非首个 sidebar 的 through 声明 warn + 忽略（资格 = DOM 首个）", () => {
        let m: any;
        const warns = catchWarns(() => {
            m = mountLayout(
                `<div id="app"><div x-scope><div id="host" x-layout>
                    <div id="ct" x-pane:content>C</div>
                    <div id="l1" x-pane:sidebar.left>L1</div>
                    <div id="l2" x-pane:sidebar.left.up>L2</div>
                </div></div></div>`,
                {},
            );
        });
        expect(warns.some((w) => w.includes("仅 DOM 首个 sidebar 支持 through"))).toBe(true);
        // 侧容器内并排，容器是唯一 grid item
        expect(gridOf(m.root.querySelector("#host")!).areas).toBe(`"left content"`);
    });
});

// ── 同侧多窗格 ────────────────────────────────────────────────────────

describe("同侧多窗格", () => {
    test("同侧 ≥2 窗格：容器是该侧唯一 grid item（gap 不进分割容器——间距由分隔条承载）", async () => {
        const { root } = mountLayout(
            `<div id="app"><div x-scope><div id="host" x-layout x-layout-options="{gap:8}">
                <div id="ct" x-pane:content>C</div>
                <div id="l1" x-pane:sidebar.left>L1</div>
                <div id="l2" x-pane:sidebar.left>L2</div>
            </div></div></div>`,
            {},
        );
        await nextTick();
        const host = root.querySelector("#host")!;
        const side = host.querySelector(":scope > [data-autospark-layout-side]") as HTMLElement;
        expect(side).not.toBeNull();
        expect(side.style.gridArea).toBe("left");
        // 宿主 gap 只作用于窗格间（grid gap），不进分割容器
        expect(host.style.gap).toBe("8px");
        expect(side.style.gap).toBe("");
    });
});

// ── 选项 ──────────────────────────────────────────────────────────────

describe("选项", () => {
    test("gap：number 按 px、string 原样透传（含双值形态）", () => {
        const { root } = mountLayout(
            `<div id="app"><div x-scope><div id="h1" x-layout x-layout-options="{gap:8}">
                <div id="ct" x-pane:content>C</div></div>
                <div id="h2" x-layout x-layout-options="{gap:'12px 24px'}">
                <div id="ct2" x-pane:content>C</div></div>
            </div></div>`,
            {},
        );
        expect((root.querySelector("#h1") as HTMLElement).style.gap).toBe("8px");
        expect((root.querySelector("#h2") as HTMLElement).style.gap).toBe("12px 24px");
    });

    test("height/width 选项走 inline（显式优先）；非法挂点 warn", () => {
        let m: any;
        const warns = catchWarns(() => {
            m = mountLayout(
                `<div id="app"><div x-scope><div id="host" x-layout>
                    <div id="hd" x-pane:header x-pane-options="{height:48}">H</div>
                    <div id="ct" x-pane:content x-pane-options="{height:48}">C</div>
                    <div id="ls" x-pane:sidebar.left x-pane-options="{width:'20rem'}">L</div>
                </div></div></div>`,
                {},
            );
        });
        expect(warns.some((w) => w.includes("height 仅 header/footer"))).toBe(true);
        const hd = m.root.querySelector("#hd") as HTMLElement;
        const ls = m.root.querySelector("#ls") as HTMLElement;
        expect(hd.style.height).toBe("48px");
        expect(ls.style.width).toBe("20rem");
        expect((m.root.querySelector("#ct") as HTMLElement).style.height).toBe("");
    });

    test("未知键 warn 忽略；其余键照常生效", () => {
        let m: any;
        const warns = catchWarns(() => {
            m = mountLayout(
                `<div id="app"><div x-scope><div id="host" x-layout>
                    <div id="ls" x-pane:sidebar.left x-pane-options="{width:200,color:'red'}">L</div>
                    <div id="ct" x-pane:content>C</div>
                </div></div></div>`,
                {},
            );
        });
        expect(warns.some((w) => w.includes("未知键"))).toBe(true);
        expect((m.root.querySelector("#ls") as HTMLElement).style.width).toBe("200px");
    });

    test("x-pane-options 成员属性形态不支持：warn + 剥除", () => {
        let m: any;
        const warns = catchWarns(() => {
            m = mountLayout(
                `<div id="app"><div x-scope><div id="host" x-layout>
                    <div id="ls" x-pane:sidebar.left x-pane-options.through="'up'">L</div>
                    <div id="ct" x-pane:content>C</div>
                </div></div></div>`,
                {},
            );
        });
        expect(warns.some((w) => w.includes("成员属性形态"))).toBe(true);
        expect(m.root.querySelector("[x-pane-options\\.through]")).toBeNull();
    });

    test("content 上挂 x-resize warn（1fr 轨道拖拽无效）；非法 relaxed-json warn", () => {
        const warns = catchWarns(() =>
            mountLayout(
                `<div id="app"><div x-scope><div id="host" x-layout>
                    <div id="ct" x-pane:content x-resize x-pane-options="{bad json">C</div>
                </div></div></div>`,
                {},
            ),
        );
        expect(warns.some((w) => w.includes("x-resize 无效"))).toBe(true);
        expect(warns.some((w) => w.includes("不是合法配置"))).toBe(true);
    });
});

// ── 存在性回流（决策四）──────────────────────────────────────────────

describe("存在性回流", () => {
    test("x-show 翻转：剔除窗格 → 列消失 + absent；恢复 → 列重现", async () => {
        const m = mountLayout(
            `<div id="app"><div x-scope><div id="host" x-layout>
                <div id="ls" x-pane:sidebar.left x-show="ui.open">L</div>
                <div id="ct" x-pane:content>C</div>
            </div></div></div>`,
            { ui: { open: true } },
        );
        await nextTick();
        const host = m.root.querySelector("#host")!;
        const ls = m.root.querySelector("#ls") as HTMLElement;
        expect(gridOf(host).areas).toBe(`"left content"`);
        expect(ls.hasAttribute("data-autospark-layout-absent")).toBe(false);

        m.engine.state.ui.open = false;
        await nextTick();
        expect(ls.getAttribute("data-autospark-layout-absent")).toBe("");
        expect(gridOf(host).areas).toBe(`"content"`);

        m.engine.state.ui.open = true;
        await nextTick();
        expect(ls.hasAttribute("data-autospark-layout-absent")).toBe(false);
        expect(gridOf(host).areas).toContain("left");
    });

    test("header 窗格 x-show false：header 行消失、中部上移占首行", async () => {
        const m = mountLayout(
            `<div id="app"><div x-scope><div id="host" x-layout>
                <div id="hd" x-pane:header x-show="ui.open">H</div>
                <div id="ct" x-pane:content>C</div>
                <div id="ft" x-pane:footer>F</div>
            </div></div></div>`,
            { ui: { open: true } },
        );
        await nextTick();
        const host = m.root.querySelector("#host")!;
        expect(gridOf(host).areas).toBe(`"header" "content" "footer"`);
        m.engine.state.ui.open = false;
        await nextTick();
        expect(gridOf(host).areas).toBe(`"content" "footer"`);
    });

    test("eager x-if 初值 false：窗格被移除、模板不含其区域", async () => {
        const m = mountLayout(
            `<div id="app"><div x-scope><div id="host" x-layout>
                <div id="ls" x-pane:sidebar.left x-if="ui.open">L</div>
                <div id="ct" x-pane:content>C</div>
            </div></div></div>`,
            { ui: { open: false } },
        );
        await nextTick();
        const host = m.root.querySelector("#host")!;
        expect(m.root.querySelector("#ls")).toBeNull();
        expect(gridOf(host).areas).toBe(`"content"`);
    });

    test("keepalive x-if：false 摘宿主 + 模板剔除，true 原宿主复挂", async () => {
        const m = mountLayout(
            `<div id="app"><div x-scope><div id="host" x-layout>
                <div id="ls" x-pane:sidebar.left x-if.keepalive="ui.open">L</div>
                <div id="ct" x-pane:content>C</div>
            </div></div></div>`,
            { ui: { open: true } },
        );
        await nextTick();
        const host = m.root.querySelector("#host")!;
        expect(gridOf(host).areas).toBe(`"left content"`);
        m.engine.state.ui.open = false;
        await nextTick();
        expect(gridOf(host).areas).toBe(`"content"`);
        m.engine.state.ui.open = true;
        await nextTick();
        expect(gridOf(host).areas).toBe(`"left content"`);
        expect(m.root.querySelector("#ls")!.textContent).toBe("L");
    });

    test("同侧多窗格全部剔除：侧容器一并 absent", async () => {
        const m = mountLayout(
            `<div id="app"><div x-scope><div id="host" x-layout>
                <div id="l1" x-pane:sidebar.left x-show="ui.open">L1</div>
                <div id="l2" x-pane:sidebar.left x-show="ui.open">L2</div>
                <div id="ct" x-pane:content>C</div>
            </div></div></div>`,
            { ui: { open: true } },
        );
        await nextTick();
        const host = m.root.querySelector("#host")!;
        const side = host.querySelector(":scope > [data-autospark-layout-side]") as HTMLElement;
        expect(side.hasAttribute("data-autospark-layout-absent")).toBe(false);
        m.engine.state.ui.open = false;
        await nextTick();
        expect(side.getAttribute("data-autospark-layout-absent")).toBe("");
        expect(gridOf(host).areas).toBe(`"content"`);
    });
});

// ── 行为组合（决策六）────────────────────────────────────────────────

describe("行为组合", () => {
    test("sidebar 默认注入 expandable：把手常驻 + direction 按 side 推导", () => {
        const { root } = mountLayout(
            `<div id="app"><div x-scope><div id="host" x-layout>
                <div id="ls" x-pane:sidebar.left>L</div>
                <div id="rs" x-pane:sidebar.right>R</div>
                <div id="ct" x-pane:content>C</div>
            </div></div></div>`,
            {},
        );
        // 把手（共享把手模块）两侧各一
        expect(root.querySelectorAll(".autospark-expandable-trigger").length).toBe(2);
        // 默认注入不落模板属性（compose 旁路）；无 data-collapsed（初始展开）
        expect(root.querySelector("#ls")!.hasAttribute("data-collapsed")).toBe(false);
    });

    test("显式 x-expandable 优先（不重复注入把手）；opt-out 关闭默认注入", () => {
        const { root } = mountLayout(
            `<div id="app"><div x-scope><div id="host" x-layout>
                <div id="l1" x-pane:sidebar.left x-expandable="ui.a">L1</div>
                <div id="l2" x-pane:sidebar.left x-pane-options="{expandable:false}">L2</div>
                <div id="ct" x-pane:content>C</div>
            </div></div></div>`,
            { ui: { a: true } },
        );
        // 显式（1 把手）+ opt-out（0）——默认注入只对无声明侧栏生效，这里两侧均非默认路径
        expect(root.querySelectorAll(".autospark-expandable-trigger").length).toBe(1);
    });

    test("direction 接管：用户声明与推导不符 warn", () => {
        const warns = catchWarns(() =>
            mountLayout(
                `<div id="app"><div x-scope><div id="host" x-layout>
                    <div id="ls" x-pane:sidebar.left x-expandable-options="{direction:'top'}">L</div>
                    <div id="ct" x-pane:content>C</div>
                </div></div></div>`,
                {},
            ),
        );
        expect(warns.some((w) => w.includes("direction 由布局接管"))).toBe(true);
    });

    test("sidebar 默认注入内缘手柄（left→e / right→w）；opt-out / 显式声明各自生效", async () => {
        const { root } = mountLayout(
            `<div id="app"><div x-scope>
                <div id="host" x-layout style="display:grid">
                    <div id="l1" x-pane:sidebar.left>L1</div>
                    <div id="r1" x-pane:sidebar.right>R1</div>
                    <div id="ct" x-pane:content>C</div>
                </div>
                <div id="host2" x-layout style="display:grid">
                    <div id="l2" x-pane:sidebar.left x-pane-options="{resize:false}">L2</div>
                    <div id="r2" x-pane:sidebar.right x-resize.se>R2</div>
                    <div id="ct2" x-pane:content>C2</div>
                </div>
            </div></div>`,
            {},
        );
        await nextTick(); // 手柄经 compile 微任务建连（x-resize 先例）
        const handleOf = (id: string) =>
            root.querySelector(`#${id} [data-autospark-resize-handle]`);
        // 内缘单方向：left 拖东缘、right 拖西缘（w 依赖 x-resize 的 grid item 感知）
        expect(handleOf("l1")!.getAttribute("data-autospark-resize-handle")).toBe("e");
        expect(handleOf("r1")!.getAttribute("data-autospark-resize-handle")).toBe("w");
        expect(handleOf("l2")).toBeNull();
        // 显式 x-resize.se：用户方向保留（自然方向，流内可用）
        expect(handleOf("r2")!.getAttribute("data-autospark-resize-handle")).toBe("se");
    });

    test("拖拽折叠联动：resize:end 终值 ≤ 阈值 → 折叠；把手点击展开走 lastSize 恢复", async () => {
        const { root } = mountLayout(
            `<div id="app"><div x-scope><div id="host" x-layout>
                <div id="ls" x-pane:sidebar.left x-expandable-options="{minSize:24}">L</div>
                <div id="ct" x-pane:content>C</div>
            </div></div></div>`,
            {},
        );
        await nextTick();
        const pane = root.querySelector("#ls") as HTMLElement;
        const trigger = root.querySelector("#ls .autospark-expandable-trigger") as HTMLElement;
        const fireResize = (type: string, width: number) =>
            pane.dispatchEvent(
                new CustomEvent(type, { detail: { width, height: 0, handle: "e" }, bubbles: true }),
            );
        // 非折叠宽度持续记忆（lastSize）
        fireResize("resize:move", 180);
        fireResize("resize:move", 40);
        // 终值 30 > 阈值 24：不折叠（收缩通道折叠态标志挂把手）
        fireResize("resize:end", 30);
        expect(trigger.hasAttribute("data-collapsed")).toBe(false);
        // 终值 10 ≤ 阈值 24：折叠（收缩通道 → inline 宽度写到 minSize）
        fireResize("resize:end", 10);
        expect(trigger.getAttribute("data-collapsed")).toBe("");
        expect(pane.style.width).toBe("24px");
        // 把手点击 → 展开（lastSize 恢复链：折叠前最后有效宽度 30）
        trigger.click();
        expect(pane.style.width).toBe("30px");
        expect(trigger.hasAttribute("data-collapsed")).toBe(false);
    });

    test("无组合实例的窗格 resize 事件不联动（header 无折叠语义）", () => {
        const { root } = mountLayout(
            `<div id="app"><div x-scope><div id="host" x-layout>
                <div id="hd" x-pane:header x-resize>H</div>
                <div id="ct" x-pane:content>C</div>
            </div></div></div>`,
            {},
        );
        // 不抛错即通过（header 无 compose 实例，联动短路）
        (root.querySelector("#hd") as HTMLElement).dispatchEvent(
            new CustomEvent("resize:end", {
                detail: { width: 0, height: 0, handle: "s" },
                bubbles: true,
            }),
        );
        expect(true).toBe(true);
    });

    test("minSize 非法值 warn + 联动回落 0 阈值", async () => {
        let m: any;
        const warns = catchWarns(() => {
            m = mountLayout(
                `<div id="app"><div x-scope><div id="host" x-layout>
                    <div id="ls" x-pane:sidebar.left x-expandable-options="{minSize:'2rem'}">L</div>
                    <div id="ct" x-pane:content>C</div>
                </div></div></div>`,
                {},
            );
        });
        expect(warns.some((w) => w.includes("minSize"))).toBe(true);
        await nextTick();
        const pane = m.root.querySelector("#ls") as HTMLElement;
        pane.dispatchEvent(
            new CustomEvent("resize:end", {
                detail: { width: 0, height: 0, handle: "e" },
                bubbles: true,
            }),
        );
        expect(pane.getAttribute("data-collapsed")).toBe("");
    });
});

// ── 窗格分割（决策七）────────────────────────────────────────────────

describe("窗格分割", () => {
    test("同侧 ≥2 窗格：x-splitter 容器 + 分隔条 + 面板契约（首窗格 data-size 定容）", async () => {
        const { root } = mountLayout(
            `<div id="app"><div x-scope><div id="host" x-layout>
                <div id="l1" x-pane:sidebar.left x-pane-options="{width:200}">L1</div>
                <div id="l2" x-pane:sidebar.left>L2</div>
                <div id="ct" x-pane:content>C</div>
            </div></div></div>`,
            {},
        );
        await nextTick();
        const host = root.querySelector("#host")!;
        const side = host.querySelector(":scope > [data-autospark-layout-side]") as HTMLElement;
        expect(side).not.toBeNull();
        expect(side.classList.contains("autospark-splitter")).toBe(true);
        expect(side.style.gridArea).toBe("left");
        // 面板契约：首窗格定容（宽度选项值迁移为 data-size）、次窗格自适应；中间分隔条
        const panes = side.querySelectorAll("[data-autospark-splitter-pane]");
        expect(panes.length).toBe(2);
        expect(panes[0]!.id).toBe("l1");
        expect(panes[0]!.getAttribute("data-autospark-splitter-sized")).toBe("");
        expect(panes[0]!.getAttribute("data-size")).toBe("200px");
        expect(panes[1]!.id).toBe("l2");
        expect(panes[1]!.hasAttribute("data-autospark-splitter-sized")).toBe(false);
        expect(side.querySelector(".autospark-splitter-divider")).not.toBeNull();
        // 分割窗格不再有默认 resize 手柄（调节走分隔条）
        expect(side.querySelector("[data-autospark-resize-handle]")).toBeNull();
    });

    test("3+ 窗格嵌套链：每层首窗格定容", async () => {
        const { root } = mountLayout(
            `<div id="app"><div x-scope><div id="host" x-layout>
                <div id="l1" x-pane:sidebar.left>L1</div>
                <div id="l2" x-pane:sidebar.left>L2</div>
                <div id="l3" x-pane:sidebar.left>L3</div>
                <div id="ct" x-pane:content>C</div>
            </div></div></div>`,
            {},
        );
        await nextTick();
        const side = root.querySelector("#host > [data-autospark-layout-side]")!;
        // 外层 [l1 sized | 内层[l2 sized | l3 auto]]——内层容器同时是外层的自适应面板（双标记同元素）
        const inners = side.querySelectorAll(
            "[data-autospark-layout-side][data-autospark-splitter-pane]",
        );
        expect(inners.length).toBe(1);
        const sizeds = side.querySelectorAll("[data-autospark-splitter-sized]");
        expect([...sizeds].map((s) => s.id)).toEqual(["l1", "l2"]);
    });

    test("分割窗格的存在性剔除照常（absent + 侧容器联动）", async () => {
        const m = mountLayout(
            `<div id="app"><div x-scope><div id="host" x-layout>
                <div id="l1" x-pane:sidebar.left x-show="ui.open">L1</div>
                <div id="l2" x-pane:sidebar.left x-show="ui.open">L2</div>
                <div id="ct" x-pane:content>C</div>
            </div></div></div>`,
            { ui: { open: true } },
        );
        await nextTick();
        const side = m.root.querySelector("#host > [data-autospark-layout-side]") as HTMLElement;
        expect(side.hasAttribute("data-autospark-layout-absent")).toBe(false);
        m.engine.state.ui.open = false;
        await nextTick();
        expect(side.getAttribute("data-autospark-layout-absent")).toBe("");
        expect(m.root.querySelector("#host")!.style.gridTemplateAreas).toBe(`"content"`);
    });
});

// ── patch 动态区域 ────────────────────────────────────────────────────

describe("patch 动态区域", () => {
    test("engine.patch 拒绝落入 x-layout 子树（ownsChildren 自动登记）", async () => {
        mountLayout(
            `<div id="app"><div x-scope><div id="host" x-layout>
                <div id="ct" x-pane:content><span id="in">a</span></div>
            </div></div></div>`,
            {},
        );
        const engine = engines[0]!;
        const warns = catchWarns(() => engine.patch("#in", () => {}));
        expect(warns.length).toBeGreaterThan(0);
    });
});
