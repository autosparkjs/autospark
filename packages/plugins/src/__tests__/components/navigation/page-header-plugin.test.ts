/**
 * page-header 组件插件测试（组件库 P2 导航件，ADR-0018 清单权威表 navigation 行）：
 * - 组件形态官方样板：全局表注册 + 化身渲染 + 主题档位继承（autospark.base）；
 * - 标题对：title/subtitle 渲染 + subtitle 空值隐藏；
 * - back 返回钮：false 缺省隐藏 / true 图标钮（点击 back 冒泡）/ 文案字符串
 *   （图标 + 文案 + aria-label 自描述）；
 * - slots：extra（右侧动作区投影 + 空不占位）/ 默认（内容区投影 + 空不占位）；
 * - 样式规则（模板断言）：返回箭头旋转指左 + 头行底线 + 暗色兜底。
 */
import "../../setup";
import { describe, expect, test } from "bun:test";
import { AutoSpark } from "autospark";
import { mount, nextTick } from "../../helpers";
import { PAGE_HEADER_NAME, bootstrapPageHeaderPlugin } from "../../../components/navigation/page-header/index";

/** 组件模板字符串（空白归一化后断言——oxfmt 折行使逐字匹配假红） */
const tpl = () =>
    ((AutoSpark as { components: Record<string, string> }).components[PAGE_HEADER_NAME] as string).replace(/\s+/g, " ");

describe("注册面（组件形态官方样板）", () => {
    test("模块加载即注册：插件全局组件表含 autospark.page-header 模板字符串 + 主题档位继承", () => {
        const template = (AutoSpark as { components: Record<string, string> }).components[PAGE_HEADER_NAME];
        expect(typeof template).toBe("string");
        expect(template).toContain(`x-define="${PAGE_HEADER_NAME}"`);
        expect(template).toContain('x-define:inherit="autospark.base"'); // 主题档位继承（ADR-0134）
    });

    test("bootstrap 幂等：重复调用不覆盖（同键赋值幂等）", () => {
        const before = (AutoSpark as { components: Record<string, string> }).components[PAGE_HEADER_NAME];
        bootstrapPageHeaderPlugin();
        expect((AutoSpark as { components: Record<string, string> }).components[PAGE_HEADER_NAME]).toBe(before);
    });
});

describe("标题对（title / subtitle）", () => {
    test("渲染：标题 + 副标题在场；subtitle 缺省隐藏（x-show）", async () => {
        const { root } = mount(
            `<div x-component:autospark.page-header="{ title: '组件总览' }"></div>`,
            {},
        );
        await nextTick();
        expect(root.querySelector(".asc-page-header-title")!.textContent).toContain("组件总览");
        const subtitle = root.querySelector(".asc-page-header-subtitle") as HTMLElement;
        expect(subtitle).toBeTruthy();
        expect(subtitle.style.display).toBe("none"); // 空值隐藏
    });

    test("subtitle 在场渲染 + props 受控随动", async () => {
        const { root, engine } = mount(
            `<div x-component:autospark.page-header="{ title: t, subtitle: s }"></div>`,
            { t: "详情页", s: "订单 #1024" },
        );
        await nextTick();
        const subtitle = root.querySelector(".asc-page-header-subtitle") as HTMLElement;
        expect(subtitle.textContent).toContain("订单 #1024");
        expect(subtitle.style.display).toBe("");
        engine.store.state.s = "订单 #2048";
        await nextTick();
        expect(subtitle.textContent).toContain("订单 #2048");
    });
});

describe("back 返回钮", () => {
    test("back 缺省 false：钮隐藏（x-show）", async () => {
        const { root } = mount(
            `<div x-component:autospark.page-header="{ title: '页面' }"></div>`,
            {},
        );
        await nextTick();
        expect((root.querySelector(".asc-page-header-back") as HTMLElement).style.display).toBe("none");
    });

    test("back=true 图标钮：点击派发 back 冒泡事件（外层包裹元素可监听）+ aria-label 以标题自描述", async () => {
        const fired: number[] = [];
        const { root } = mount(
            `<div @back="fired.push(1)">
                <div x-component:autospark.page-header="{ title: '详情页', back: true }"></div>
            </div>`,
            { fired },
        );
        await nextTick();
        const btn = root.querySelector(".asc-page-header-back") as HTMLElement;
        expect(btn.style.display).toBe(""); // 在场
        expect(btn.getAttribute("aria-label")).toBe("详情页"); // 图标钮以标题自描述
        expect(root.querySelector(".asc-page-header-back-text")).toBeTruthy(); // 文案出口在场
        expect((root.querySelector(".asc-page-header-back-text") as HTMLElement).style.display).toBe("none"); // 无文案
        btn.click();
        await nextTick();
        expect(fired.length).toBe(1); // back 冒泡到外层
    });

    test("back=文案字符串：图标 + 文案渲染 + aria-label 取文案", async () => {
        const { root } = mount(
            `<div x-component:autospark.page-header="{ title: '详情页', back: '返回列表' }"></div>`,
            {},
        );
        await nextTick();
        const btn = root.querySelector(".asc-page-header-back") as HTMLElement;
        expect(btn.getAttribute("aria-label")).toBe("返回列表");
        expect((root.querySelector(".asc-page-header-back-text") as HTMLElement).style.display).toBe("");
        expect(root.querySelector(".asc-page-header-back-text")!.textContent).toContain("返回列表");
    });
});

describe("slots（extra / 默认内容区）", () => {
    test("extra 命名插槽：投影到右侧动作区 + 空不占位（:empty）", async () => {
        const withExtra = mount(
            `<div x-component:autospark.page-header="{ title: '页面' }">
                <template x-slot:extra><button type="button" class="act">操作</button></template>
            </div>`,
            {},
        );
        await nextTick();
        expect(withExtra.root.querySelector(".asc-page-header-extra")!.querySelector(".act")).toBeTruthy();

        const bare = mount(`<div x-component:autospark.page-header="{ title: '页面' }"></div>`, {});
        await nextTick();
        const extra = bare.root.querySelector(".asc-page-header-extra") as HTMLElement;
        expect(extra.textContent).toBe(""); // 空
    });

    test("默认插槽：投影到内容区 + 空不占位（:empty）", async () => {
        const { root } = mount(
            `<div x-component:autospark.page-header="{ title: '页面' }">
                <p class="body">页面描述内容</p>
            </div>`,
            {},
        );
        await nextTick();
        expect(root.querySelector(".asc-page-header-content")!.querySelector(".body")).toBeTruthy();
        expect(root.querySelector(".asc-page-header-content")!.textContent).toContain("页面描述内容");

        const bare = mount(`<div x-component:autospark.page-header="{ title: '页面' }"></div>`, {});
        await nextTick();
        expect((bare.root.querySelector(".asc-page-header-content") as HTMLElement).textContent).toBe("");
    });
});

describe("样式规则（模板断言）", () => {
    test("返回箭头旋转指左 + 头行底线 + 暗色兜底在场", () => {
        const t = tpl();
        // 返回箭头：内置 arrow 指右，旋转 180° 指左
        expect(t).toContain(".asc-page-header-back-icon { display: inline-flex; transform: rotate(180deg); }");
        // 头行底线（页头分隔惯例）
        expect(t).toContain(".asc-page-header-row {");
        expect(t).toContain("border-bottom:");
        // extra 右推动作区 + 空不占位
        expect(t).toContain(".asc-page-header-extra {");
        expect(t).toContain(".asc-page-header-extra:empty { display: none; }");
        expect(t).toContain(".asc-page-header-content:empty { display: none; }");
        // 暗色兜底变体在场（ADR-0129）
        expect(t).toContain("[dark] .asc-page-header-row,");
        expect(t).toContain("[data-dark] .asc-page-header-title {");
    });
});
