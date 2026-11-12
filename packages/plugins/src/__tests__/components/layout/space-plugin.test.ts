/**
 * space 组件插件测试（组件库 P0 轻件，ADR-0018 清单权威表 layout 行 / ADR-0019）：
 * - 组件形态官方样板：全局表注册 + 化身渲染 + 方向/对齐/换行变体数据属性通道；
 * - size 间距三形态：档位名走 CSS 档位块（data-gap 属性）、number/字符串/数组走
 *   JS 通道内联两轴（row-gap/column-gap），响应式切换重同步；
 * - 插槽出口 display:contents（子项穿透成为 flex 直接子项的结构前提）。
 */
import "../../setup";
import { describe, expect, test } from "bun:test";
import { AutoSpark } from "autospark";
import { mount, nextTick } from "../../helpers";
import { SPACE_NAME, bootstrapSpacePlugin } from "../../../components/layout/space/index";

describe("space 组件插件（ADR-0019 P0 轻件）", () => {
    test("模块加载即注册：插件全局组件表含 autospark.space 模板字符串", () => {
        const template = (AutoSpark as { components: Record<string, string> }).components[SPACE_NAME];
        expect(typeof template).toBe("string");
        expect(template).toContain(`x-define="${SPACE_NAME}"`);
        expect(template).toContain(`x-define:inherit="autospark.base"`); // 主题档位继承（ADR-0134）
    });

    test("化身渲染：默认水平态 + 子元素正常编译（插槽子项落于出口内）", async () => {
        const { root } = mount(
            `<div x-component:autospark.space="{}"><button>按钮一</button><button>按钮二</button></div>`,
            {},
        );
        await nextTick();
        const host = root.querySelector(".asc-space")!;
        expect(host).toBeTruthy();
        const body = host.querySelector(".asc-space-body")!;
        expect(body.getAttribute("data-direction")).toBe("horizontal"); // 缺省水平（字符串真值恒在，CSS 只写垂直块）
        const slot = host.querySelector(".asc-space-slot")!;
        expect(slot.querySelectorAll("button").length).toBe(2); // 子元素正常编译并入插槽出口
    });

    test("方向/对齐/换行变体：vertical/align/wrap 落 body 数据属性", async () => {
        const { root } = mount(
            `<div x-component:autospark.space="{ direction: 'vertical', align: 'start', wrap: true }"></div>`,
            {},
        );
        await nextTick();
        const body = root.querySelector(".asc-space-body")!;
        expect(body.getAttribute("data-direction")).toBe("vertical");
        expect(body.getAttribute("data-align")).toBe("start");
        expect(body.getAttribute("data-wrap")).toBe("true");
    });

    test("样式通道：间距档位块 + 出口 display:contents + 主题联动（零色彩消费无暗色块）", () => {
        const t = ((AutoSpark as { components: Record<string, string> }).components[SPACE_NAME] as string)
            .replace(/\s+/g, " ");
        // 缺省 medium 档经 --auto-spacing 接通 theme spacing 档位（三级回退链形态）
        expect(t).toContain("gap: var(--asc-space-gap, var(--auto-spacing, var(--x-spacing-medium)));");
        expect(t).toContain('.asc-space-body[data-gap="large"] { gap: var(--asc-space-gap, var(--x-spacing-large)); }');
        expect(t).toContain('.asc-space-body[data-direction="vertical"] { flex-direction: column;');
        expect(t).toContain(".asc-space-slot { display: contents; }");
    });
});

describe("size 间距三形态（CSS 档位块 + JS 通道内联）", () => {
    test("档位名（缺省 medium）：data-gap 属性命中 CSS 档位块，不写内联两轴", async () => {
        const { root } = mount(
            `<div x-component:autospark.space="{}"></div>`,
            {},
        );
        await nextTick();
        const body = root.querySelector(".asc-space-body") as HTMLElement;
        expect(body.getAttribute("data-gap")).toBe("medium");
        expect(body.style.rowGap).toBe(""); // 档位名走 CSS 块，JS 通道不写
        expect(body.style.columnGap).toBe("");
    });

    test("number 归一 px：两轴同值写内联", async () => {
        const { root } = mount(
            `<div x-component:autospark.space="{ size: 16 }"></div>`,
            {},
        );
        await nextTick();
        const body = root.querySelector(".asc-space-body") as HTMLElement;
        expect(body.style.rowGap).toBe("16px");
        expect(body.style.columnGap).toBe("16px");
        expect(body.getAttribute("data-gap")).toBe("16"); // 非档位名不命中任何档位块
    });

    test("数组 [水平, 垂直] 两轴拆分（antd 序），单元素缺省垂直同水平", async () => {
        // 嵌套数组/对象 props 经状态引用传入（master 当前 engine 对字面量嵌套值有
        // 死环缺陷，修复分支待合并；引用写法两种引擎下均正确）
        const { root } = mount(
            `<div x-component:autospark.space="{ size: g }"></div>`,
            { g: [24, 8] },
        );
        await nextTick();
        const body = root.querySelector(".asc-space-body") as HTMLElement;
        expect(body.style.columnGap).toBe("24px"); // 水平
        expect(body.style.rowGap).toBe("8px");     // 垂直
    });

    test("字符串 CSS 值透传（em 单位）", async () => {
        const { root } = mount(
            `<div x-component:autospark.space="{ size: '1.5em' }"></div>`,
            {},
        );
        await nextTick();
        const body = root.querySelector(".asc-space-body") as HTMLElement;
        expect(body.style.rowGap).toBe("1.5em");
        expect(body.style.columnGap).toBe("1.5em");
    });

    test("响应式切换：number → 档位名时清除内联两轴（回 CSS 档位块）", async () => {
        const { root, engine } = mount(
            `<div x-component:autospark.space="{ size: gap }"></div>`,
            { gap: 16 },
        );
        await nextTick();
        const body = root.querySelector(".asc-space-body") as HTMLElement;
        expect(body.style.rowGap).toBe("16px");
        engine.store.state.gap = "large"; // watch size 重同步
        await nextTick();
        expect(body.style.rowGap).toBe("");      // 内联清除
        expect(body.style.columnGap).toBe("");
        expect(body.getAttribute("data-gap")).toBe("large"); // 档位块接管
    });
});

describe("installPlugin 自举（ADR-0003）", () => {
    test("bootstrapSpacePlugin 幂等：重复调用不覆盖（同键赋值幂等）", () => {
        const before = (AutoSpark as { components: Record<string, string> }).components[SPACE_NAME];
        bootstrapSpacePlugin();
        expect((AutoSpark as { components: Record<string, string> }).components[SPACE_NAME]).toBe(before);
    });
});
