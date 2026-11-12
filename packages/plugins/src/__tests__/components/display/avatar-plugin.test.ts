/**
 * avatar 组件插件测试（组件库 P1，ADR-0018 清单权威表 display 行）：
 * - 组件形态官方样板：全局表注册 + 化身渲染 + 三源回退链（src → icon → label 首字符 → 兜底图标）；
 * - 图片失败回退：@error 置 failed 切回退层 + src 变化重置重试；
 * - shape 变体（circle 缺省 / square）落 inner data-* 通道；
 * - 样式通道字符串断言（button 范式 ADR-0012）+ em 基准（data-size 档位跟随）；
 * - 元素名快速写法 <x-avatar>（ADR-0117/0133 懒预编译反查）。
 */
import "../../setup";
import { describe, expect, test } from "bun:test";
import { AutoSpark } from "autospark";
import { mount, nextTick } from "../../helpers";
import { AVATAR_NAME, bootstrapAvatarPlugin } from "../../../components/display/avatar/index";

describe("avatar 组件插件（ADR-0018 P1 display）", () => {
    test("模块加载即注册：插件全局组件表含 autospark.avatar 模板字符串", () => {
        const template = (AutoSpark as { components: Record<string, string> }).components[AVATAR_NAME];
        expect(typeof template).toBe("string");
        expect(template).toContain(`x-define="${AVATAR_NAME}"`);
        expect(template).toContain(`x-define:inherit="autospark.base"`); // 主题档位继承（ADR-0134）
    });

    test("化身渲染：src 注入 → img 渲染 + alt 透传 label", async () => {
        const { root } = mount(
            `<div x-component:autospark.avatar="{ src: 'a.png', label: '张三' }"></div>`,
            {},
        );
        await nextTick();
        const inner = root.querySelector(".asc-avatar-inner")!;
        expect(inner).toBeTruthy();
        const img = inner.querySelector(".asc-avatar-img")!;
        expect(img).toBeTruthy();
        expect(img.getAttribute("src")).toBe("a.png");
        expect(img.getAttribute("alt")).toBe("张三");
        expect(root.querySelector(".asc-avatar-char")).toBeNull(); // 图片在场不渲染字符回退
    });

    test("图片失败回退：@error → img 移除 + label 首字符（码点截取）", async () => {
        const { root } = mount(
            `<div x-component:autospark.avatar="{ src: 'bad.png', label: '李四' }"></div>`,
            {},
        );
        await nextTick();
        const img = root.querySelector(".asc-avatar-img") as HTMLElement;
        expect(img).toBeTruthy();
        img.dispatchEvent(new Event("error"));
        await nextTick();
        expect(root.querySelector(".asc-avatar-img")).toBeNull(); // 失败切回退层
        expect(root.querySelector(".asc-avatar-char")!.textContent).toBe("李");
    });

    test("src 变化重置失败态：换地址重试新图（回退层让位）", async () => {
        const { root, engine } = mount(
            `<div x-component:autospark.avatar="{ src: pic, label: '王五' }"></div>`,
            { pic: "bad.png" },
        );
        await nextTick();
        (root.querySelector(".asc-avatar-img") as HTMLElement).dispatchEvent(new Event("error"));
        await nextTick();
        expect(root.querySelector(".asc-avatar-char")!.textContent).toBe("王");
        engine.store.state.pic = "good.png"; // 外部状态驱动 src 变化
        await nextTick();
        const img = root.querySelector(".asc-avatar-img") as HTMLElement;
        expect(img).toBeTruthy(); // failed 重置 → 图片层回归
        expect(img.getAttribute("src")).toBe("good.png");
        expect(root.querySelector(".asc-avatar-char")).toBeNull();
    });

    test("icon 回退：无 src 时内置图标渲染（字符串名形态）", async () => {
        const { root } = mount(
            `<div x-component:autospark.avatar="{ icon: 'star', label: '赵六' }"></div>`,
            {},
        );
        await nextTick();
        expect(root.querySelector(".asc-avatar-img")).toBeNull();
        expect(root.querySelector(".asc-avatar-icon")).toBeTruthy(); // x-icon 值通道渲染
        expect(root.querySelector(".asc-avatar-char")).toBeNull(); // icon 优先于 label 首字符
    });

    test("icon 对象形态：{ name } 引用注入同样生效", async () => {
        const { root } = mount(
            `<div x-component:autospark.avatar="{ icon: ic }"></div>`,
            { ic: { name: "star" } }, // 引用注入规避字面量对象 props 死环（ADR-0019 后果 2）
        );
        await nextTick();
        expect(root.querySelector(".asc-avatar-icon")).toBeTruthy();
    });

    test("三源皆空：内置 default 图标兜底（视觉不空白）", async () => {
        const { root } = mount(`<div x-component:autospark.avatar="{}"></div>`, {});
        await nextTick();
        expect(root.querySelector(".asc-avatar-icon")).toBeTruthy();
        expect(root.querySelector(".asc-avatar-char")).toBeNull();
        expect(root.querySelector(".asc-avatar-img")).toBeNull();
    });

    test("shape 变体：square 落 inner data-shape，缺省 circle", async () => {
        const { root } = mount(
            `<div x-component:autospark.avatar="{ label: '甲', shape: 'square' }"></div>`,
            {},
        );
        await nextTick();
        expect(root.querySelector(".asc-avatar-inner")!.getAttribute("data-shape")).toBe("square");
        const plain = mount(`<div x-component:autospark.avatar="{ label: '乙' }"></div>`, {});
        await nextTick();
        expect(plain.root.querySelector(".asc-avatar-inner")!.getAttribute("data-shape")).toBe("circle");
    });
});

describe("样式通道（button 范式 ADR-0012）", () => {
    test("三级回退链 + em 基准（data-size 档位缩放源）+ 暗色兜底（ADR-0129）", () => {
        const t = ((AutoSpark as { components: Record<string, string> }).components[AVATAR_NAME] as string)
            .replace(/\s+/g, " "); // ?raw CSS 断言空白归一化（oxfmt 折行防假红）
        expect(t).toContain("font-size: var(--auto-font-size, var(--asc-avatar-font-size, 0.875rem));");
        expect(t).toContain("background: var(--auto-third-bgcolor, var(--asc-avatar-bg, rgba(0, 0, 0, 0.06)));");
        expect(t).toContain('.asc-avatar-inner[data-shape="square"] {');
        expect(t).toContain("border-radius: var(--auto-border-radius, var(--asc-avatar-radius, 0.375rem));");
        expect(t).toContain('[dark] .asc-avatar-inner, [data-dark] .asc-avatar-inner {');
        expect(t).toContain("background: var(--auto-third-bgcolor, var(--asc-avatar-bg, rgba(255, 255, 255, 0.14)));");
    });
});

describe("元素名快速写法（ADR-0117 自动组件 / ADR-0133 反查）", () => {
    test("<x-avatar> 静态属性折叠 props + label 首字符渲染", async () => {
        const { root } = mount(
            `<div><x-avatar label="陈七"></x-avatar></div>`,
            {},
        );
        await nextTick();
        const host = root.querySelector(".asc-avatar")!;
        expect(host).toBeTruthy();
        expect(host.querySelector(".asc-avatar-char")!.textContent).toBe("陈");
        expect(host.hasAttribute("label")).toBe(false); // 静态属性已折叠进 props
    });
});

describe("installPlugin 自举（ADR-0003）", () => {
    test("bootstrapAvatarPlugin 幂等：重复调用不覆盖（同键赋值幂等）", () => {
        const before = (AutoSpark as { components: Record<string, string> }).components[AVATAR_NAME];
        bootstrapAvatarPlugin();
        expect((AutoSpark as { components: Record<string, string> }).components[AVATAR_NAME]).toBe(before);
    });
});
