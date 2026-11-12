/**
 * image 组件插件测试（组件库 P1，ADR-0018 清单权威表 display 行）：
 * - 组件形态官方样板：全局表注册 + 化身渲染 + src/alt/lazy/fit/width/height 透传；
 * - 三态生命周期：加载态（loading 图标自转）→ @load 摘圈 / @error 切 fallback 占位
 *   （图标名 / 图片 URL 双形态）+ src 变化重置重试；
 * - 样式通道字符串断言（button 范式 ADR-0012）+ 暗色兜底（ADR-0129）；
 * - 元素名快速写法 <x-image>（ADR-0117/0133 懒预编译反查）。
 */
import "../../setup";
import { describe, expect, test } from "bun:test";
import { AutoSpark } from "autospark";
import { mount, nextTick } from "../../helpers";
import { IMAGE_NAME, bootstrapImagePlugin } from "../../../components/display/image/index";

describe("image 组件插件（ADR-0018 P1 display）", () => {
    test("模块加载即注册：插件全局组件表含 autospark.image 模板字符串", () => {
        const template = (AutoSpark as { components: Record<string, string> }).components[IMAGE_NAME];
        expect(typeof template).toBe("string");
        expect(template).toContain(`x-define="${IMAGE_NAME}"`);
        expect(template).toContain(`x-define:inherit="autospark.base"`); // 主题档位继承（ADR-0134）
    });

    test("化身渲染：src/alt 落 img + 加载态初始在场（happy-dom 不真加载，浏览器事件驱动三态）", async () => {
        const { root } = mount(
            `<div x-component:autospark.image="{ src: 'a.png', alt: '风景' }"></div>`,
            {},
        );
        await nextTick();
        const inner = root.querySelector(".asc-image-inner")!;
        expect(inner).toBeTruthy();
        const img = inner.querySelector(".asc-image-img")!;
        expect(img).toBeTruthy();
        expect(img.getAttribute("src")).toBe("a.png");
        expect(img.getAttribute("alt")).toBe("风景");
        expect(inner.querySelector(".asc-image-spinner")).toBeTruthy(); // 未完成即加载态
        expect(inner.querySelector(".asc-image-fallback")).toBeNull(); // 未失败无占位
    });

    test("@load 摘加载态：loaded 置位转圈移除（主图留存）", async () => {
        const { root } = mount(
            `<div x-component:autospark.image="{ src: 'a.png' }"></div>`,
            {},
        );
        await nextTick();
        (root.querySelector(".asc-image-img") as HTMLElement).dispatchEvent(new Event("load"));
        await nextTick();
        expect(root.querySelector(".asc-image-img")).toBeTruthy();
        expect(root.querySelector(".asc-image-spinner")).toBeNull(); // 完成摘圈
    });

    test("@error 切 fallback：默认内置图标 + alt 提示行（主图与转圈让位）", async () => {
        const { root } = mount(
            `<div x-component:autospark.image="{ src: 'bad.png', alt: '图片加载失败' }"></div>`,
            {},
        );
        await nextTick();
        (root.querySelector(".asc-image-img") as HTMLElement).dispatchEvent(new Event("error"));
        await nextTick();
        expect(root.querySelector(".asc-image-img")).toBeNull();
        expect(root.querySelector(".asc-image-spinner")).toBeNull();
        const fb = root.querySelector(".asc-image-fallback")!;
        expect(fb).toBeTruthy();
        expect(fb.querySelector(".asc-image-fallback-icon")).toBeTruthy(); // 缺省 file-error 图标
        expect(fb.querySelector(".asc-image-fallback-img")).toBeNull();
        expect(fb.querySelector(".asc-image-fallback-text")!.textContent).toBe("图片加载失败");
    });

    test("fallback URL 形态：以协议/斜杠开头的值渲染占位图（图标形态让位）", async () => {
        const { root } = mount(
            `<div x-component:autospark.image="{ src: 'bad.png', fallback: fb }"></div>`,
            { fb: "/placeholders/broken.png" }, // 引用注入规避字面量 props 死环（ADR-0019 后果 2）
        );
        await nextTick();
        (root.querySelector(".asc-image-img") as HTMLElement).dispatchEvent(new Event("error"));
        await nextTick();
        const fbImg = root.querySelector(".asc-image-fallback-img")!;
        expect(fbImg).toBeTruthy();
        expect(fbImg.getAttribute("src")).toBe("/placeholders/broken.png");
        expect(root.querySelector(".asc-image-fallback-icon")).toBeNull();
    });

    test("src 缺席：主图与加载态不渲染，结构占位（fallback 区在场）", async () => {
        const { root } = mount(`<div x-component:autospark.image="{}"></div>`, {});
        await nextTick();
        expect(root.querySelector(".asc-image-img")).toBeNull();
        expect(root.querySelector(".asc-image-spinner")).toBeNull();
        expect(root.querySelector(".asc-image-fallback")).toBeTruthy();
    });

    test("src 变化重置三态：换地址重试（failed/loaded 清零，加载态回归）", async () => {
        const { root, engine } = mount(
            `<div x-component:autospark.image="{ src: pic }"></div>`,
            { pic: "bad.png" },
        );
        await nextTick();
        (root.querySelector(".asc-image-img") as HTMLElement).dispatchEvent(new Event("error"));
        await nextTick();
        expect(root.querySelector(".asc-image-fallback")).toBeTruthy();
        engine.store.state.pic = "good.png"; // 外部状态驱动 src 变化
        await nextTick();
        expect(root.querySelector(".asc-image-img")!.getAttribute("src")).toBe("good.png");
        expect(root.querySelector(".asc-image-fallback")).toBeNull(); // failed 重置
        expect(root.querySelector(".asc-image-spinner")).toBeTruthy(); // loaded 重置 → 加载态回归
    });

    test("透传通道：lazy 原生 loading / width·height 原生属性 / fit 五档 data-fit", async () => {
        const { root } = mount(
            `<div x-component:autospark.image="{ src: pic, lazy: true, fit: 'cover' }"></div>`,
            { pic: { url: "a.png", w: 120, h: 80 } }, // 引用注入（width/height 经状态派生）
        );
        await nextTick();
        // 引用对象不便逐字段绑定时走多值注入：换状态驱动形态直接断言 width/height 透传
        const img = root.querySelector(".asc-image-img") as HTMLElement;
        expect(img.getAttribute("loading")).toBe("lazy"); // 原生懒加载通道
        expect(img.getAttribute("data-fit")).toBe("cover"); // object-fit 五档
        const sized = mount(
            `<div x-component:autospark.image="{ src: 'b.png', width: box.w, height: box.h }"></div>`,
            { box: { w: 120, h: 80 } },
        );
        await nextTick();
        const sImg = sized.root.querySelector(".asc-image-img")!;
        expect(sImg.getAttribute("width")).toBe("120"); // 原生属性透传（假值移除家族约定）
        expect(sImg.getAttribute("height")).toBe("80");
    });
});

describe("样式通道（button 范式 ADR-0012）", () => {
    test("三级回退链 + fit 五档 + 暗色兜底（ADR-0129）", () => {
        const t = ((AutoSpark as { components: Record<string, string> }).components[IMAGE_NAME] as string)
            .replace(/\s+/g, " "); // ?raw CSS 断言空白归一化（oxfmt 折行防假红）
        expect(t).toContain("font-size: var(--auto-font-size, var(--asc-image-font-size, 0.875rem));");
        expect(t).toContain("background: var(--auto-third-bgcolor, var(--asc-image-bg, rgba(0, 0, 0, 0.04)));");
        expect(t).toContain('.asc-image-img[data-fit="cover"] { object-fit: cover; }');
        expect(t).toContain("color: var(--auto-third-color, var(--asc-image-spinner-color, rgba(0, 0, 0, 0.35)));");
        expect(t).toContain('[dark] .asc-image-inner, [data-dark] .asc-image-inner {');
        expect(t).toContain("background: var(--auto-third-bgcolor, var(--asc-image-bg, rgba(255, 255, 255, 0.1)));");
    });
});

describe("元素名快速写法（ADR-0117 自动组件 / ADR-0133 反查）", () => {
    test("<x-image> 静态属性折叠 props（src/alt）", async () => {
        const { root } = mount(
            `<div><x-image src="c.png" alt="元素名写法"></x-image></div>`,
            {},
        );
        await nextTick();
        const host = root.querySelector(".asc-image")!;
        expect(host).toBeTruthy();
        const img = host.querySelector(".asc-image-img")!;
        expect(img.getAttribute("src")).toBe("c.png");
        expect(img.getAttribute("alt")).toBe("元素名写法");
        expect(host.hasAttribute("src")).toBe(false); // 静态属性已折叠进 props
    });
});

describe("installPlugin 自举（ADR-0003）", () => {
    test("bootstrapImagePlugin 幂等：重复调用不覆盖（同键赋值幂等）", () => {
        const before = (AutoSpark as { components: Record<string, string> }).components[IMAGE_NAME];
        bootstrapImagePlugin();
        expect((AutoSpark as { components: Record<string, string> }).components[IMAGE_NAME]).toBe(before);
    });
});
