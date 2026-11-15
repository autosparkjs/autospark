/**
 * container 组件插件测试（组件库 P2 布局件，ADR-0018 清单权威表 layout 行）：
 * - 组件形态官方样板：全局表注册 + 主题档位继承（autospark.base）+ 元素名关闭
 *   （x-define-options tag:false——x-container 标签与断点容器指令撞名规避，ADR-0133）；
 * - 四区插槽投影：header/aside/footer 命名插槽 + 默认插槽（main）；
 * - 子元素声明变换：<x-container-header|aside|footer> 折叠为 <template x-slot:名>、
 *   <x-container-main> 解包、静态属性折叠 props；
 * - 侧栏位置（asidePosition）：start/end 绑定落 body + grid 区域模板形态块（模板断言）；
 * - 三方边界（本组件 vs x-layout 指令 vs x-container 指令）声明在场（模板断言）。
 */
import "../../setup";
import { describe, expect, test } from "bun:test";
import { AutoSpark } from "autospark";
import { mount, nextTick } from "../../helpers";
import { CONTAINER_NAME, bootstrapContainerPlugin } from "../../../components/layout/container/index";

/** 组件模板字符串（空白归一化后断言——oxfmt 折行使逐字匹配假红） */
const tpl = () =>
    ((AutoSpark as { components: Record<string, string> }).components[CONTAINER_NAME] as string).replace(/\s+/g, " ");

describe("注册面（组件形态官方样板）", () => {
    test("模块加载即注册：插件全局组件表含 autospark.container 模板字符串 + 主题档位继承", () => {
        const template = (AutoSpark as { components: Record<string, string> }).components[CONTAINER_NAME];
        expect(typeof template).toBe("string");
        expect(template).toContain(`x-define="${CONTAINER_NAME}"`);
        expect(template).toContain('x-define:inherit="autospark.base"'); // 主题档位继承（ADR-0134）
    });

    test("元素名自动推导关闭：x-define-options tag:false（x-container 标签与断点容器指令撞名规避，ADR-0133）", () => {
        expect(tpl()).toContain('x-define-options="{tag:false}"');
    });

    test("bootstrap 幂等：重复调用不覆盖（同键赋值幂等）", () => {
        const before = (AutoSpark as { components: Record<string, string> }).components[CONTAINER_NAME];
        bootstrapContainerPlugin();
        expect((AutoSpark as { components: Record<string, string> }).components[CONTAINER_NAME]).toBe(before);
    });

    test("三方边界声明在场（本组件结构壳 / x-layout 窗格指令 / x-container 断点容器指令）", () => {
        const t = tpl();
        expect(t).toContain("x-layout");
        expect(t).toContain("断点容器");
        expect(t).toContain("tag:false");
    });
});

describe("四区插槽投影", () => {
    test("命名插槽 header/aside/footer + 默认插槽 main（区域语义标签承载）", async () => {
        const { root } = mount(
            `<div x-component:autospark.container style="height: 400px">
                <template x-slot:header><span class="h">顶栏</span></template>
                <template x-slot:aside><span class="s">侧栏</span></template>
                <span class="m">主区内容</span>
                <template x-slot:footer><span class="f">底栏</span></template>
            </div>`,
            {},
        );
        await nextTick();
        const header = root.querySelector(".asc-container-header")!;
        const aside = root.querySelector(".asc-container-aside")!;
        const main = root.querySelector(".asc-container-main")!;
        const footer = root.querySelector(".asc-container-footer")!;
        expect(header.tagName).toBe("HEADER");
        expect(aside.tagName).toBe("ASIDE");
        expect(main.tagName).toBe("MAIN");
        expect(footer.tagName).toBe("FOOTER");
        expect(header.querySelector(".h")!.textContent).toBe("顶栏");
        expect(aside.querySelector(".s")!.textContent).toBe("侧栏");
        expect(main.querySelector(".m")!.textContent).toBe("主区内容"); // 默认插槽 → main
        expect(footer.querySelector(".f")!.textContent).toBe("底栏");
    });

    test("空区不占位：未提供的区段整体退出（:empty 隐藏规则，模板断言 + 渲染形态）", async () => {
        const { root } = mount(
            `<div x-component:autospark.container>
                <template x-slot:header><span>仅顶栏</span></template>
                <span>主区</span>
            </div>`,
            {},
        );
        await nextTick();
        expect(root.querySelector(".asc-container-header")).toBeTruthy(); // 有内容的区在场
        expect(root.querySelector(".asc-container-aside")).toBeTruthy(); // 出口元素在场（:empty CSS 退场）
        expect(root.querySelector(".asc-container-aside")!.childElementCount).toBe(0); // 无投影内容
        expect(root.querySelector(".asc-container-footer")!.childElementCount).toBe(0);
    });
});

describe("子元素声明变换（precompile）", () => {
    test("区段声明折叠：<x-container-header|aside|footer> → template x-slot:名 + 子内容随迁", () => {
        const { root } = mount(
            `<div><x-container>
                <x-container-header><span class="h">顶栏</span></x-container-header>
                <x-container-aside><span class="s">侧栏</span></x-container-aside>
                <x-container-main><span class="m">主区</span></x-container-main>
                <x-container-footer><span class="f">底栏</span></x-container-footer>
            </x-container></div>`,
            {},
            { autostart: false },
        );
        const host = root.children[0]!.children[0]!;
        expect(host.tagName).toBe("DIV");
        const attrOf = (el: Element, name: string): string | undefined =>
            [...el.attributes].find((a) => a.name === name)?.value;
        expect(attrOf(host, "x-component:autospark.container")).toBe("{  }"); // 无静态 props 可折叠
        const tpls = Array.from(host.children);
        expect(tpls.length).toBe(4);
        expect(tpls[0]!.tagName).toBe("TEMPLATE");
        expect(tpls[0]!.hasAttribute("x-slot:header")).toBe(true);
        expect(tpls[1]!.hasAttribute("x-slot:aside")).toBe(true);
        // main 解包：子内容直落宿主层（默认插槽通道，落位在声明顺序处）
        expect(tpls[2]!.tagName).toBe("SPAN");
        expect(tpls[2]!.classList.contains("m")).toBe(true);
        expect(tpls[3]!.hasAttribute("x-slot:footer")).toBe(true);
    });

    test("声明形态渲染还原：四区投影到位（变换产物全链）", async () => {
        const { root } = mount(
            `<div><x-container>
                <x-container-header><b>声明顶栏</b></x-container-header>
                <x-container-aside>声明侧栏</x-container-aside>
                声明主区
                <x-container-footer>声明底栏</x-container-footer>
            </x-container></div>`,
            {},
        );
        await nextTick();
        expect(root.querySelector("x-container")).toBeNull(); // 声明元素替换完成
        expect(root.querySelector(".asc-container-header b")!.textContent).toBe("声明顶栏");
        expect(root.querySelector(".asc-container-aside")!.textContent).toContain("声明侧栏");
        expect(root.querySelector(".asc-container-main")!.textContent).toContain("声明主区");
        expect(root.querySelector(".asc-container-footer")!.textContent).toContain("声明底栏");
    });

    test("静态属性折叠 props：aside-position 归一 asidePosition + class 保留宿主", () => {
        const { root } = mount(
            `<div><x-container aside-position="end" class="shell"></x-container></div>`,
            {},
            { autostart: false },
        );
        const host = root.children[0]!.children[0]!;
        const props = [...host.attributes].find((a) => a.name === "x-component:autospark.container")?.value;
        expect(props).toContain('asidePosition: "end"'); // kebab → camel 折叠
        expect(host.getAttribute("class")).toBe("shell"); // class 保留
    });
});

describe("侧栏位置（asidePosition）与样式组织", () => {
    test("asidePosition 绑定落 body（T4=B）：start 缺省 / end 对调区域模板", async () => {
        const start = mount(`<div x-component:autospark.container></div>`, {});
        await nextTick();
        expect(start.root.querySelector(".asc-container-body")!.getAttribute("data-aside")).toBe("start");

        const end = mount(
            `<div x-component:autospark.container="{ asidePosition: 'end' }"></div>`,
            {},
        );
        await nextTick();
        expect(end.root.querySelector(".asc-container-body")!.getAttribute("data-aside")).toBe("end");
    });

    test("grid 区域模板形态块 + 三级回退链 + 暗色兜底变体（模板断言）", () => {
        const t = tpl();
        // start 缺省区域模板：header 横贯顶 / aside 左 / main / footer 横贯底
        expect(t).toContain('"header header" "aside main" "footer footer"');
        // end 对调：main 左、aside 右
        expect(t).toContain('"header header" "main aside" "footer footer"');
        expect(t).toContain('grid-template-columns: 1fr auto'); // end 列轨对调
        // 侧栏宽度覆盖通道 + 主区滚动容器
        expect(t).toContain("--asc-container-aside-width");
        expect(t).toContain("overflow: auto");
        // 三级回退链（ADR-0129）+ 暗色兜底
        expect(t).toContain("var(--auto-color, var(--asc-container-color,");
        expect(t).toContain("[dark] .asc-container,");
        expect(t).toContain("[data-dark] .asc-container-aside");
    });
});
