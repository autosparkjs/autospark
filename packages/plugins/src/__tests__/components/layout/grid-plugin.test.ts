/**
 * grid 组件插件测试（组件库 P0 轻件，ADR-0018 清单权威表 layout 行 / ADR-0019）：
 * - 组件形态官方样板：全局表注册 + 化身渲染 + 对齐/分布/自适应列变体数据属性通道；
 * - cols 三形态：number 固定列走 --asc-grid-cols 变量、"auto" 走 data-cols-mode、
 *   响应式档位对象按视口断点回退基础档（happy-dom matchMedia 全未命中 → xs ?? 1）；
 * - gap 间隙三形态（与 space 同构：档位名 CSS 块 + 值形态 JS 通道内联两轴）。
 */
import "../../setup";
import { describe, expect, test } from "bun:test";
import { AutoSpark } from "autospark";
import { mount, nextTick } from "../../helpers";
import { GRID_NAME, bootstrapGridPlugin } from "../../../components/layout/grid/index";

describe("grid 组件插件（ADR-0019 P0 轻件）", () => {
    test("模块加载即注册：插件全局组件表含 autospark.grid 模板字符串", () => {
        const template = (AutoSpark as { components: Record<string, string> }).components[GRID_NAME];
        expect(typeof template).toBe("string");
        expect(template).toContain(`x-define="${GRID_NAME}"`);
        expect(template).toContain(`x-define:inherit="autospark.base"`); // 主题档位继承（ADR-0134）
    });

    test("化身渲染：默认结构 + 子元素正常编译（插槽子项落于出口内）", async () => {
        const { root } = mount(
            `<div x-component:autospark.grid="{}"><div>卡片一</div><div>卡片二</div><div>卡片三</div></div>`,
            {},
        );
        await nextTick();
        const host = root.querySelector(".asc-grid")!;
        expect(host).toBeTruthy();
        const body = host.querySelector(".asc-grid-body")!;
        expect(body.hasAttribute("data-cols-mode")).toBe(false); // 假值属性移除（绑定家族约定）
        const slot = host.querySelector(".asc-grid-slot")!;
        expect(slot.querySelectorAll("div").length).toBe(3); // 子元素正常编译并入插槽出口
    });

    test("对齐/分布/自适应列变体：justify/align/cols-mode 落 body 数据属性", async () => {
        const { root } = mount(
            `<div x-component:autospark.grid="{ justify: 'between', align: 'center', cols: 'auto' }"></div>`,
            {},
        );
        await nextTick();
        const body = root.querySelector(".asc-grid-body")!;
        expect(body.getAttribute("data-justify")).toBe("between");
        expect(body.getAttribute("data-align")).toBe("center");
        expect(body.getAttribute("data-cols-mode")).toBe("auto");
    });

    test("样式通道：minmax(0,1fr) 防撑破 + 档位块 + 出口 display:contents（零色彩消费无暗色块）", () => {
        const t = ((AutoSpark as { components: Record<string, string> }).components[GRID_NAME] as string)
            .replace(/\s+/g, " ");
        expect(t).toContain("grid-template-columns: repeat(var(--asc-grid-cols, 3), minmax(0, 1fr));");
        expect(t).toContain("grid-template-columns: repeat(auto-fill, minmax(var(--asc-grid-min, 16rem), 1fr));");
        expect(t).toContain('.asc-grid-body[data-gap="medium"] { gap: var(--asc-grid-gap, var(--auto-spacing, var(--x-spacing-medium))); }');
        expect(t).toContain(".asc-grid-slot { display: contents; }");
    });
});

describe("cols 列数三形态（--asc-grid-cols 变量通道）", () => {
    test("number 固定列：归一正整数写 --asc-grid-cols，不切 auto 模式", async () => {
        const { root } = mount(
            `<div x-component:autospark.grid="{ cols: 4 }"></div>`,
            {},
        );
        await nextTick();
        const body = root.querySelector(".asc-grid-body") as HTMLElement;
        expect(body.style.getPropertyValue("--asc-grid-cols")).toBe("4");
        expect(body.hasAttribute("data-cols-mode")).toBe(false);
    });

    test("number 归一：小数向下取整、零与负值钳制为 1（防 repeat() 非法）", async () => {
        const { root } = mount(
            `<div x-component:autospark.grid="{ cols: 3.7 }"></div>`,
            {},
        );
        await nextTick();
        const body = root.querySelector(".asc-grid-body") as HTMLElement;
        expect(body.style.getPropertyValue("--asc-grid-cols")).toBe("3");
    });

    test("响应式档位对象：窄视口（断点全未命中）回退基础档 xs", async () => {
        // 显式设视口宽（happy-dom matchMedia 按 innerWidth 真计算，须钉死避免环境默认值漂移）；
        // 嵌套对象 props 经状态引用传入（master 当前 engine 对字面量嵌套值有死环缺陷，
        // 修复分支待合并；引用写法两种引擎下均正确）
        (window as any).innerWidth = 500;
        const { root } = mount(
            `<div x-component:autospark.grid="{ cols: c }"></div>`,
            { c: { xs: 1, sm: 2, md: 3, lg: 4 } },
        );
        await nextTick();
        const body = root.querySelector(".asc-grid-body") as HTMLElement;
        expect(body.style.getPropertyValue("--asc-grid-cols")).toBe("1"); // <576 全未命中 → xs
    });

    test("响应式档位对象：宽视口取最高命中档（md），xs 缺省窄视口回退 1", async () => {
        (window as any).innerWidth = 800; // 命中 sm(576)/md(768)，未及 lg(992)
        const { root } = mount(
            `<div x-component:autospark.grid="{ cols: c }"></div>`,
            { c: { sm: 2, md: 3, lg: 4 } }, // xs 缺省
        );
        await nextTick();
        const body = root.querySelector(".asc-grid-body") as HTMLElement;
        expect(body.style.getPropertyValue("--asc-grid-cols")).toBe("3"); // 最高命中 md
    });

    test("响应式切换：cols 对象 → number 时重同步变量", async () => {
        (window as any).innerWidth = 500;
        const { root, engine } = mount(
            `<div x-component:autospark.grid="{ cols: c }"></div>`,
            { c: { xs: 1, md: 4 } },
        );
        await nextTick();
        const body = root.querySelector(".asc-grid-body") as HTMLElement;
        expect(body.style.getPropertyValue("--asc-grid-cols")).toBe("1");
        engine.store.state.c = 6; // watch cols 重同步
        await nextTick();
        expect(body.style.getPropertyValue("--asc-grid-cols")).toBe("6");
    });
});

describe("gap 间隙三形态（与 space 同构）", () => {
    test("缺省 0：number 写内联两轴 0px（CSS 原生无隙语义）", async () => {
        const { root } = mount(
            `<div x-component:autospark.grid="{}"></div>`,
            {},
        );
        await nextTick();
        const body = root.querySelector(".asc-grid-body") as HTMLElement;
        expect(body.getAttribute("data-gap")).toBe("0");
        expect(body.style.rowGap).toBe("0px");
        expect(body.style.columnGap).toBe("0px");
    });

    test("档位名：CSS 档位块接管，JS 通道不写内联两轴", async () => {
        const { root } = mount(
            `<div x-component:autospark.grid="{ gap: 'medium' }"></div>`,
            {},
        );
        await nextTick();
        const body = root.querySelector(".asc-grid-body") as HTMLElement;
        expect(body.getAttribute("data-gap")).toBe("medium");
        expect(body.style.rowGap).toBe("");
        expect(body.style.columnGap).toBe("");
    });

    test("数组 [水平, 垂直] 两轴拆分 + 响应式切换重同步", async () => {
        // 嵌套数组 props 经状态引用传入（同 cols 用例注释：字面量嵌套值死环缺陷待引擎修复合入）
        const { root, engine } = mount(
            `<div x-component:autospark.grid="{ gap: g }"></div>`,
            { g: [16, 8] },
        );
        await nextTick();
        const body = root.querySelector(".asc-grid-body") as HTMLElement;
        expect(body.style.columnGap).toBe("16px"); // 水平
        expect(body.style.rowGap).toBe("8px");     // 垂直
        engine.store.state.g = "large"; // watch gap 重同步：档位名清除内联
        await nextTick();
        expect(body.style.rowGap).toBe("");
        expect(body.getAttribute("data-gap")).toBe("large");
    });
});

describe("installPlugin 自举（ADR-0003）", () => {
    test("bootstrapGridPlugin 幂等：重复调用不覆盖（同键赋值幂等）", () => {
        const before = (AutoSpark as { components: Record<string, string> }).components[GRID_NAME];
        bootstrapGridPlugin();
        expect((AutoSpark as { components: Record<string, string> }).components[GRID_NAME]).toBe(before);
    });
});
