/**
 * empty 组件插件测试（组件库 P0，ADR-0019）：
 * - 组件形态官方样板：全局表注册 + 化身渲染 + image/default 双插槽；
 * - 内置文案走 i18n 词典（ADR-0018 决策 6 约定 1）：empty.description 键查表覆译 +
 *   未装/未命中回退硬编码中文（t 恒等返回键本身 → 键等值判定切兜底）；
 * - icon 双形态与 image 槽换图；
 * - 元素名快速写法 <x-empty>（ADR-0117/0133 懒预编译反查）。
 *
 * 注：本文件 import i18n 模块（词典机制在场）——无词典场景与「未装 i18n」输出一致
 * （引擎兜底 t 与 i18n 查表 miss 同样返回键本身），键等值回退路径被双场景共用。
 */
import "../../setup";
import { describe, expect, test } from "bun:test";
import { AutoSpark } from "autospark";
import { mount, nextTick } from "../../helpers";
import "../../../modules/i18n/index"; // i18n 插件在场（translate 槽覆写 + ready 换血）
import { EMPTY_NAME, bootstrapEmptyPlugin } from "../../../components/display/empty/index";

describe("empty 组件插件（ADR-0019 P0）", () => {
    test("模块加载即注册：插件全局组件表含 autospark.empty 模板字符串", () => {
        const template = (AutoSpark as { components: Record<string, string> }).components[EMPTY_NAME];
        expect(typeof template).toBe("string");
        expect(template).toContain(`x-define="${EMPTY_NAME}"`);
        expect(template).toContain(`x-define:inherit="autospark.base"`); // 主题档位继承（ADR-0134）
    });

    test("化身渲染：默认图标落 image 兜底 + 描述回退硬编码中文「暂无数据」", async () => {
        const { root } = mount(`<div x-component:autospark.empty="{}"></div>`, {});
        await nextTick();
        const host = root.querySelector(".asc-empty")!;
        expect(host).toBeTruthy();
        expect(host.querySelector(".asc-empty-image .asc-empty-icon")).toBeTruthy(); // 默认经 x-icon 内置图标
        expect(host.querySelector(".asc-empty-desc")!.textContent).toBe("暂无数据"); // 词典未命中回退
    });

    test("description 显式传入优先于词典兜底", async () => {
        const { root } = mount(
            `<div x-component:autospark.empty="{ description: '列表为空' }"></div>`,
            {},
        );
        await nextTick();
        expect(root.querySelector(".asc-empty-desc")!.textContent).toBe("列表为空");
    });
});

describe("i18n 词典机制（ADR-0018 决策 6 约定 1）", () => {
    test("options.i18n.messages 覆译：按语言取译文（ready 换血后生效）", async () => {
        const { root } = mount(
            `<div x-component:autospark.empty="{}"></div>`,
            {},
            {
                i18n: {
                    language: "en",
                    messages: { "empty.description": { en: "No data" } },
                },
            },
        );
        await nextTick();
        expect(root.querySelector(".asc-empty-desc")!.textContent).toBe("No data");
    });

    test("zh-CN 覆译与语言码归一（zh 命中 zh-CN 主子标签）", async () => {
        const { root } = mount(
            `<div x-component:autospark.empty="{}"></div>`,
            {},
            {
                i18n: {
                    language: "zh",
                    messages: { "empty.description": { "zh-CN": "还没有任何记录" } },
                },
            },
        );
        await nextTick();
        expect(root.querySelector(".asc-empty-desc")!.textContent).toBe("还没有任何记录");
    });
});

describe("插槽与图标", () => {
    test("image 槽整体换图：兜底图标不渲染", async () => {
        const { root } = mount(
            `<div x-component:autospark.empty="{}"><template x-slot:image><img src="blank.png" alt="空" /></template></div>`,
            {},
        );
        await nextTick();
        expect(root.querySelector(".asc-empty-image img")).toBeTruthy();
        expect(root.querySelector(".asc-empty-icon")).toBeNull(); // 兜底图标让位
    });

    test("默认插槽：描述下方附加内容", async () => {
        const { root } = mount(
            `<div x-component:autospark.empty="{ description: '无项目' }"><span>新建项目</span></div>`,
            {},
        );
        await nextTick();
        expect(root.querySelector(".asc-empty-extra")!.textContent).toBe("新建项目");
    });

    test("icon 双形态：字符串图标名与 { name } 对象切换默认图", async () => {
        const { root } = mount(
            `<div x-component:autospark.empty="{ icon: 'folder' }"></div>`,
            {},
        );
        await nextTick();
        expect(root.querySelector(".asc-empty-icon")).toBeTruthy();
        const obj = mount(
            `<div x-component:autospark.empty="{ icon: ic }"></div>`,
            { ic: { name: "file-error" } }, // 引用注入规避字面量对象 props 死环（家族已知缺陷修复在途）
        );
        await nextTick();
        expect(obj.root.querySelector(".asc-empty-icon")).toBeTruthy();
    });
});

describe("样式通道（button 范式 ADR-0012）", () => {
    test("三级回退链 + 次要/辅助文字色 + 暗色兜底（ADR-0129）", () => {
        const t = ((AutoSpark as { components: Record<string, string> }).components[EMPTY_NAME] as string)
            .replace(/\s+/g, " "); // ?raw CSS 断言空白归一化（oxfmt 折行防假红）
        expect(t).toContain("padding: var(--auto-padding, var(--asc-empty-padding, 0.8rem));");
        expect(t).toContain("color: var(--auto-third-color, var(--asc-empty-image-color, rgba(0, 0, 0, 0.35)));");
        expect(t).toContain("color: var(--auto-secondary-color, var(--asc-empty-desc-color, rgba(0, 0, 0, 0.55)));");
        expect(t).toContain('[dark] .asc-empty-desc, [data-dark] .asc-empty-desc {');
        expect(t).toContain("color: var(--auto-secondary-color, var(--asc-empty-desc-color, rgba(255, 255, 255, 0.65)));");
    });
});

describe("元素名快速写法（ADR-0117 自动组件 / ADR-0133 反查）", () => {
    test("<x-empty> 静态属性折叠 props（与 x-for/x-tree 的 x-empty 属性标记分属元素/属性两通道）", async () => {
        const { root } = mount(
            `<div><x-empty description="暂无订单"></x-empty></div>`,
            {},
        );
        await nextTick();
        const host = root.querySelector(".asc-empty")!;
        expect(host).toBeTruthy();
        expect(host.querySelector(".asc-empty-desc")!.textContent).toBe("暂无订单");
        expect(host.hasAttribute("description")).toBe(false); // 静态属性已折叠进 props
    });
});

describe("installPlugin 自举（ADR-0003）", () => {
    test("bootstrapEmptyPlugin 幂等：重复调用不覆盖（同键赋值幂等）", () => {
        const before = (AutoSpark as { components: Record<string, string> }).components[EMPTY_NAME];
        bootstrapEmptyPlugin();
        expect((AutoSpark as { components: Record<string, string> }).components[EMPTY_NAME]).toBe(before);
    });
});
