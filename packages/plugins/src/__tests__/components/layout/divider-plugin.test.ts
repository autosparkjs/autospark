/**
 * divider 组件插件测试（组件库 P0 轻件 / layout 分类首件，ADR-0019）：
 * - 组件形态官方样板：全局表注册 + 化身渲染 + 方向/虚线/对齐变体数据属性通道；
 * - spacing 间距同步（宿主 margin 的 JS 通道，水平/垂直双轴 + vertical 切换重同步）；
 * - 带文字态结构（插槽文字嵌线，空插槽出口隐藏）。
 */
import "../../setup";
import { describe, expect, test } from "bun:test";
import { AutoSpark } from "autospark";
import { mount, nextTick } from "../../helpers";
import { DIVIDER_NAME, bootstrapDividerPlugin } from "../../../components/layout/divider/index";

describe("divider 组件插件（ADR-0019 P0 轻件）", () => {
    test("模块加载即注册：插件全局组件表含 autospark.divider 模板字符串", () => {
        const template = (AutoSpark as { components: Record<string, string> }).components[DIVIDER_NAME];
        expect(typeof template).toBe("string");
        expect(template).toContain(`x-define="${DIVIDER_NAME}"`);
        expect(template).toContain(`x-define:inherit="autospark.base"`); // 主题档位继承（ADR-0134）
    });

    test("化身渲染：默认水平态 + 空插槽出口隐藏（两段线连成整线）", async () => {
        const { root } = mount(
            `<div x-component:autospark.divider="{}"></div>`,
            {},
        );
        await nextTick();
        const host = root.querySelector(".asc-divider")!;
        expect(host).toBeTruthy();
        const body = host.querySelector(".asc-divider-body")!;
        expect(body.hasAttribute("data-vertical")).toBe(false); // 假值属性移除（绑定家族约定）
        expect(host.querySelector(".asc-divider-text")!.textContent).toBe("");
    });

    test("带文字：插槽内容渲染于文字出口（嵌线文字）", async () => {
        const { root } = mount(
            `<div x-component:autospark.divider="{}">分隔标题</div>`,
            {},
        );
        await nextTick();
        expect(root.querySelector(".asc-divider-text")!.textContent).toBe("分隔标题");
    });

    test("方向/虚线/对齐变体：vertical/dashed/align 落 body 数据属性", async () => {
        const { root } = mount(
            `<div x-component:autospark.divider="{ vertical: true, dashed: true, align: 'left' }"></div>`,
            {},
        );
        await nextTick();
        const body = root.querySelector(".asc-divider-body")!;
        expect(body.getAttribute("data-vertical")).toBe("true");
        expect(body.getAttribute("data-dashed")).toBe("true");
        expect(body.getAttribute("data-align")).toBe("left");
    });

    test("样式通道：线色三级回退链 + 垂直态纵排线段 + 暗色兜底（ADR-0129）", () => {
        const t = ((AutoSpark as { components: Record<string, string> }).components[DIVIDER_NAME] as string)
            .replace(/\s+/g, " ");
        expect(t).toContain("--asc-line: var(--auto-border-color, var(--asc-divider-color, #d9d9d9));");
        expect(t).toContain('.asc-divider-body[data-dashed="true"]::before, .asc-divider-body[data-dashed="true"]::after { border-top-style: dashed; }');
        expect(t).toContain('.asc-divider:has(> .asc-divider-body[data-vertical="true"]) { display: inline-block;');
        expect(t).toContain('[dark] .asc-divider, [data-dark] .asc-divider { --asc-line: var(--auto-border-color, var(--asc-divider-color, #4d4d4d)); }');
    });
});

describe("spacing 间距同步（宿主 margin JS 通道）", () => {
    test("水平态：number 归一 px 写上下 margin，左右不动", async () => {
        const { root } = mount(
            `<div x-component:autospark.divider="{ spacing: 16 }"></div>`,
            {},
        );
        await nextTick();
        const host = root.querySelector(".asc-divider") as HTMLElement;
        expect(host.style.marginTop).toBe("16px");
        expect(host.style.marginBottom).toBe("16px");
        expect(host.style.marginLeft).toBe("");
        expect(host.style.marginRight).toBe("");
    });

    test("垂直态：写左右 margin；字符串 CSS 值原样透传", async () => {
        const { root } = mount(
            `<div x-component:autospark.divider="{ vertical: true, spacing: '0.5em' }"></div>`,
            {},
        );
        await nextTick();
        const host = root.querySelector(".asc-divider") as HTMLElement;
        expect(host.style.marginLeft).toBe("0.5em");
        expect(host.style.marginRight).toBe("0.5em");
        expect(host.style.marginTop).toBe("");
    });

    test("缺省无边距（零侵入，间距编排交给 space 组件/使用者布局）", async () => {
        const { root } = mount(
            `<div x-component:autospark.divider="{}"></div>`,
            {},
        );
        await nextTick();
        const host = root.querySelector(".asc-divider") as HTMLElement;
        expect(host.style.marginTop).toBe("");
        expect(host.style.marginLeft).toBe("");
    });

    test("vertical 响应式切换：margin 轴随方向重同步", async () => {
        const { root, engine } = mount(
            `<div x-component:autospark.divider="{ vertical: vert, spacing: 12 }"></div>`,
            { vert: false },
        );
        await nextTick();
        const host = root.querySelector(".asc-divider") as HTMLElement;
        expect(host.style.marginTop).toBe("12px");
        engine.store.state.vert = true; // 换轴重同步（watch vertical）
        await nextTick();
        expect(host.style.marginLeft).toBe("12px");
        expect(host.style.marginTop).toBe(""); // 原轴清除
        expect(host.querySelector(".asc-divider-body")!.getAttribute("data-vertical")).toBe("true");
    });
});

describe("installPlugin 自举（ADR-0003）", () => {
    test("bootstrapDividerPlugin 幂等：重复调用不覆盖（同键赋值幂等）", () => {
        const before = (AutoSpark as { components: Record<string, string> }).components[DIVIDER_NAME];
        bootstrapDividerPlugin();
        expect((AutoSpark as { components: Record<string, string> }).components[DIVIDER_NAME]).toBe(before);
    });
});
