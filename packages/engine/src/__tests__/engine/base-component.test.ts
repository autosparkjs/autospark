import { describe, expect, test } from "bun:test";
import "../setup";
import { mount, nextTick } from "../helpers";

/**
 * 内置 autospark.base 抽象基组件测试（ADR-0134）。
 *
 * 覆盖内置链路（BUILTIN_COMPONENTS 种子表 → 懒预编译 → 继承反查）与 props 物化契约：
 * - builtin 层可达 + def.base 标记；
 * - 子组件（options.components 字符串）x-define:inherit="autospark.base" 展开成功；
 * - 六键物化：有值写属性 / 缺省不写（继承祖先）/ 布尔存在性属性 / props 后写胜出；
 * - watch 响应式：外部状态绑定翻转 → 宿主属性同步（props 数据流最后一公里）。
 */

/** 测试用子组件：继承 base（点号名，贴近官方组件注册形态） */
const PANEL_TPL = `<div class="panel" x-define="my.panel" x-define:inherit="autospark.base"><span class="body">面板</span></div>`;

describe("autospark.base 内置注册", () => {
    test("builtin 层可达 + def.base 标记（懒预编译）", async () => {
        const { engine } = mount(`<div x-scope></div>`, {});
        const snap = (engine as any)._resolveGlobalComponent("autospark.base");
        expect(snap).toBeTruthy();
        expect(engine.getGlobalComponentDef("autospark.base")?.base).toBe(true);
    });
});

describe("autospark.base 散属性直通（元素名形态）", () => {
    /** 元素名形态组件（自动标签 x-tagged）：data-* 是保留属性、留宿主直通 theme CSS */
    const TAGGED_TPL = `<div class="tagged" x-define="tagged" x-define:inherit="autospark.base"><span class="body">TAG</span></div>`;

    test("静态散属性直通：化身后保留在宿主（不被物化首跑抹掉），theme CSS 直接命中", async () => {
        const { root } = mount(
            `<div x-scope><x-tagged class="inst" data-size="small" data-dark></x-tagged></div>`,
            {},
            { components: { tagged: TAGGED_TPL } },
        );
        await nextTick();
        const inst = root.querySelector(".inst") as HTMLElement;
        expect(inst.classList.contains("tagged")).toBe(true); // 实例化成功（class 并入）
        expect(inst.getAttribute("data-size")).toBe("small"); // 散属性保留
        expect(inst.hasAttribute("data-dark")).toBe(true); // 存在性属性保留
    });

    test(":data-* 纯绑定直通（bind 直写、物化不竞争），状态翻转实时跟随", async () => {
        const { root, engine } = mount(
            `<div x-scope><x-tagged class="inst" :data-size="uiSize" :data-dark="dense"></x-tagged></div>`,
            { uiSize: "large", dense: true },
            { components: { tagged: TAGGED_TPL } },
        );
        await nextTick();
        const inst = root.querySelector(".inst") as HTMLElement;
        // bind 直写通道：首值物化为属性（物化对 external 缺席键为 no-op，不与 bind 竞争）
        expect(inst.getAttribute("data-size")).toBe("large");
        expect(inst.hasAttribute("data-dark")).toBe(true);
        // 状态翻转 → bind patch 实时跟随（档位切换 / 布尔摘除）
        (engine.store.state as any).uiSize = "x-large";
        (engine.store.state as any).dense = false;
        await nextTick();
        expect(inst.getAttribute("data-size")).toBe("x-large");
        expect(inst.hasAttribute("data-dark")).toBe(false);
    });
});

describe("autospark.base 主题档位 props 物化", () => {
    test("有值写属性 / 缺省不写 / 布尔存在性 / 子模板根胜出", async () => {
        const { root } = mount(
            `<div class="inst" x-component:my.panel="{ 'data-size': 'small', 'data-shadow': 'large', 'data-dark': true }"></div>`,
            {},
            { components: { "my.panel": PANEL_TPL } },
        );
        await nextTick();
        const inst = root.querySelector(".inst") as HTMLElement;
        // 四档维有值即写（theme 手动通道 [data-size=small] 命中即覆盖 --auto-*）
        expect(inst.getAttribute("data-size")).toBe("small");
        expect(inst.getAttribute("data-shadow")).toBe("large");
        // 布尔存在性属性
        expect(inst.hasAttribute("data-dark")).toBe(true);
        expect(inst.getAttribute("data-dark")).toBe("");
        // 缺省键不写属性（继承祖先 scope 档位）
        expect(inst.hasAttribute("data-radius")).toBe(false);
        expect(inst.hasAttribute("data-spacing")).toBe(false);
        expect(inst.hasAttribute("data-colorized")).toBe(false);
        // 子模板根胜出：panel 根的 class 并入宿主、子树渲染
        expect(inst.classList.contains("panel")).toBe(true);
        expect(inst.querySelector(".body")?.textContent).toBe("面板");
    });

    test("watch 响应式：外部状态绑定翻转 → 宿主属性同步（档位 + 布尔）", async () => {
        const { root, engine } = mount(
            `<div class="inst" x-component:my.panel="ui"></div>`,
            { ui: { "data-size": "small", "data-dark": false } },
            { components: { "my.panel": PANEL_TPL } },
        );
        await nextTick();
        const inst = root.querySelector(".inst") as HTMLElement;
        expect(inst.getAttribute("data-size")).toBe("small");
        expect(inst.hasAttribute("data-dark")).toBe(false);
        // 外部状态翻转（纯路径 props 深层触发 → Object.assign 更新 → base watch 物化）
        (engine.store.state as any).ui["data-size"] = "x-large";
        (engine.store.state as any).ui["data-dark"] = true;
        await nextTick();
        expect(inst.getAttribute("data-size")).toBe("x-large");
        expect(inst.hasAttribute("data-dark")).toBe(true);
    });
});
