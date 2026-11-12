/**
 * skeleton 组件插件测试（组件库 P1 轻件，ADR-0018 清单权威表 feedback 行）：
 * - 组件形态官方样板：全局表注册 + 化身渲染 + 形态数据属性通道；
 * - variant 三形态（text/circle/rect）与 rows 多行 text（末行半宽标记、circle/rect 恒单块）；
 * - loading 插槽切换（核心用法）：骨架/真容互斥显隐（x-show 不摘 DOM）；
 * - animated 动画开关 + 闪烁动画 CSS（prefers-reduced-motion 停播——badge 先例）；
 * - 样式基线（button 范式 ADR-0012）：淡底 color-mix 单源派生 + 三级回退链 + 暗色兜底。
 */
import "../../setup";
import { describe, expect, test } from "bun:test";
import { AutoSpark } from "autospark";
import { mount, nextTick } from "../../helpers";
import { SKELETON_NAME, bootstrapSkeletonPlugin } from "../../../components/feedback/skeleton/index";

/** 取全局表模板（空白归一——oxfmt 折行使逐字匹配假红） */
const tpl = () =>
    ((AutoSpark as { components: Record<string, string> }).components[SKELETON_NAME] as string).replace(/\s+/g, " ");

/** 骨架块组容器显隐（x-show 通道，不摘 DOM） */
const itemsShown = (root: HTMLElement) => root.querySelector<HTMLElement>(".asc-skeleton-items")!.style.display !== "none";
const contentShown = (root: HTMLElement) => root.querySelector<HTMLElement>(".asc-skeleton-content")!.style.display !== "none";

describe("skeleton 组件插件（ADR-0018 P1 轻件）", () => {
    test("模块加载即注册：插件全局组件表含 autospark.skeleton 模板字符串", () => {
        const template = (AutoSpark as { components: Record<string, string> }).components[SKELETON_NAME];
        expect(typeof template).toBe("string");
        expect(template).toContain(`x-define="${SKELETON_NAME}"`);
        expect(template).toContain(`x-define:inherit="autospark.base"`); // 主题档位继承（ADR-0134）
    });

    test("化身渲染：text 缺省形态单行骨架 + loading 缺省骨架态（真容隐藏）", async () => {
        const { root } = mount(
            `<div x-component:autospark.skeleton="{}"><span>真实内容</span></div>`,
            {},
        );
        await nextTick();
        const body = root.querySelector(".asc-skeleton-body")!;
        expect(body).toBeTruthy();
        expect(body.getAttribute("data-variant")).toBe("text"); // text 缺省形态
        expect(root.querySelectorAll(".asc-skeleton-item").length).toBe(1); // rows 缺省归 1
        expect(itemsShown(root)).toBe(true);   // loading 缺省骨架态
        expect(contentShown(root)).toBe(false); // 真容隐藏
        expect(root.querySelector(".asc-skeleton-content")!.textContent).toContain("真实内容"); // 投影在场（编译期完成）
    });

    test("rows 多行 text：行块序列 + 末行半宽标记（data-last）", async () => {
        const { root } = mount(
            `<div x-component:autospark.skeleton="{ rows: 3 }"></div>`,
            {},
        );
        await nextTick();
        const items = [...root.querySelectorAll(".asc-skeleton-item")];
        expect(items.length).toBe(3);
        expect(items[2].hasAttribute("data-last")).toBe(true);  // 末行半宽标记
        expect(items[0].hasAttribute("data-last")).toBe(false); // 非末行无标记（假值属性整个移除）
    });

    test("rows 钳制：0/缺省/非法值归 1 行", async () => {
        const { root } = mount(
            `<div><div x-component:autospark.skeleton="{ rows: 0 }"></div>` +
            `<div x-component:autospark.skeleton="{ rows: 'x' }"></div></div>`,
            {},
        );
        await nextTick();
        for (const g of root.querySelectorAll(".asc-skeleton")) {
            expect(g.querySelectorAll(".asc-skeleton-item").length).toBe(1);
        }
    });

    test("variant 三形态：text/circle/rect 落 body data-variant；circle/rect 恒单块（rows 不放大）", async () => {
        const { root } = mount(
            `<div><div x-component:autospark.skeleton="{ variant: 'circle', rows: 3 }"></div>` +
            `<div x-component:autospark.skeleton="{ variant: 'rect', rows: 3 }"></div></div>`,
            {},
        );
        await nextTick();
        const variants = [...root.querySelectorAll(".asc-skeleton-body")].map((b) => b.getAttribute("data-variant"));
        expect(variants).toEqual(["circle", "rect"]);
        for (const g of root.querySelectorAll(".asc-skeleton")) {
            expect(g.querySelectorAll(".asc-skeleton-item").length).toBe(1); // 多行无语义恒单块
        }
    });
});

describe("loading 插槽切换（核心用法）", () => {
    test("loading=true 骨架 / false 真容互斥（x-show 不摘 DOM）", async () => {
        const { root, engine } = mount(
            `<div x-component:autospark.skeleton="{ loading: fetching }"><span>订单列表已就绪</span></div>`,
            { fetching: true },
        );
        await nextTick();
        expect(itemsShown(root)).toBe(true);
        expect(contentShown(root)).toBe(false);
        (engine.store.state as { fetching: boolean }).fetching = false;
        await nextTick();
        expect(itemsShown(root)).toBe(false);
        expect(contentShown(root)).toBe(true);
        expect(root.querySelector(".asc-skeleton-content")!.textContent).toContain("订单列表已就绪");
        // 骨架块仍在 DOM（x-show 显隐不摘——loading 再置 true 零重建成本）
        expect(root.querySelector(".asc-skeleton-items")).toBeTruthy();
    });

    test("真容出口可含指令（插槽投影内容正常编译，响应消费处状态）", async () => {
        const { root, engine } = mount(
            `<div x-component:autospark.skeleton="{ loading: loading }">{{ count }} 条记录</div>`,
            { loading: false, count: 3 },
        );
        await nextTick();
        const content = root.querySelector(".asc-skeleton-content")!;
        expect(content.textContent).toContain("3 条记录");
        (engine.store.state as { count: number }).count = 10;
        await nextTick();
        expect(content.textContent).toContain("10 条记录"); // 插值响应式生效
    });
});

describe("animated 动画开关（badge 先例动效纪律）", () => {
    test("animated 缺省开：骨架块组挂 data-animated=\"true\"（CSS 动画通道）", async () => {
        const { root } = mount(
            `<div x-component:autospark.skeleton="{}"></div>`,
            {},
        );
        await nextTick();
        expect(root.querySelector(".asc-skeleton-items")!.getAttribute("data-animated")).toBe("true");
    });

    test("animated=false：data-animated 整个移除（静态淡底）", async () => {
        const { root } = mount(
            `<div x-component:autospark.skeleton="{ animated: false }"></div>`,
            {},
        );
        await nextTick();
        expect(root.querySelector(".asc-skeleton-items")!.hasAttribute("data-animated")).toBe(false);
    });

    test("动画 CSS：渐变扫过 keyframes + prefers-reduced-motion 停播在场", () => {
        const t = tpl();
        expect(t).toContain(".asc-skeleton-items[data-animated=\"true\"] .asc-skeleton-item {");
        expect(t).toContain("animation: asc-skeleton-wave 1.4s ease infinite;");
        expect(t).toContain("@keyframes asc-skeleton-wave {");
        expect(t).toContain("@media (prefers-reduced-motion: reduce) {");
    });
});

describe("样式基线（button 范式 ADR-0012 / ADR-0129）", () => {
    test("淡底双色 --auto-color 单源派生（color-mix）+ 三级回退链 + 暗色兜底", () => {
        const t = tpl();
        expect(t).toContain("--asc-skel-base: color-mix(in srgb, var(--auto-color, var(--asc-skeleton-color, #606060)) 10%, transparent);");
        expect(t).toContain("--asc-skel-hi: color-mix(in srgb, var(--auto-color, var(--asc-skeleton-color, #606060)) 5%, transparent);");
        expect(t).toContain("[dark] .asc-skeleton, [data-dark] .asc-skeleton {");
        expect(t).toContain("--asc-skel-base: color-mix(in srgb, var(--auto-color, var(--asc-skeleton-color, #fafafa)) 12%, transparent);");
    });

    test("形态块：text 末行半宽 / circle 正圆 / rect 大块（body data-variant 后代选择器）", () => {
        const t = tpl();
        expect(t).toContain(".asc-skeleton-item[data-last] { width: 60%; }");
        expect(t).toContain('.asc-skeleton-body[data-variant="circle"] .asc-skeleton-item {');
        expect(t).toContain('.asc-skeleton-body[data-variant="rect"] .asc-skeleton-item {');
    });

    test("与 x-loading 的边界声明在文件头（ADR-0018 决策 3 消歧）", () => {
        expect(tpl()).toContain("与 x-loading 指令的边界");
    });
});

describe("installPlugin 自举（ADR-0003）", () => {
    test("bootstrapSkeletonPlugin 幂等：重复调用不覆盖（同键赋值幂等）", () => {
        const before = (AutoSpark as { components: Record<string, string> }).components[SKELETON_NAME];
        bootstrapSkeletonPlugin();
        expect((AutoSpark as { components: Record<string, string> }).components[SKELETON_NAME]).toBe(before);
    });
});
