/**
 * float-button 组件插件测试（组件库 P3 other 分类首件，ADR-0018 清单权威表 other 行 /
 * 修订吸收原 backtop 独立条目 / ADR-0029 轻件对 ADR）：
 * - 组件形态官方样板：全局表注册 + 化身渲染 + 主题档位继承（autospark.base）；
 * - 渲染：icon 经 x-icon 注入、形态绑定落 body（T4=B）、label 默认插槽投影 + :empty；
 * - 定位偏移：right/bottom JS 通道写宿主内联（number → px / string 原样）+ watch 随动；
 * - back-to-top：滚动超 visibilityHeight 阈值渐显标记（data-visible）+ 回落隐藏 +
 *   阈值自定义 + 点击回顶 window.scrollTo（reduced-motion 瞬时归位）；
 * - 常规形态：恒显 + click 原生冒泡事件出口（不内建滚动）；
 * - unmounted 清理：destroy 后 scroll 监听摘除（grid 的 matchMedia 先例）；
 * - precompile 元素名变换：<x-float-button> → 真 button 宿主（type 固定 button）+
 *   props 折叠 + back-to-top 裸属性糖 + 裸属性布尔归一。
 *
 * happy-dom 无真实滚动：滚动位置经 window.scrollY 补丁注入，scroll 事件手动派发——
 * 渐显动效与回顶平滑滚动的真浏览器链路见 docs demo（e2e 验证面）。
 */
import "../../setup";
import { afterEach, describe, expect, test } from "bun:test";
import { AutoSpark } from "autospark";
import { mount, nextTick } from "../../helpers";
import { FLOAT_BUTTON_NAME, bootstrapFloatButtonPlugin } from "../../../components/general/float-button/index";

/** 组件模板字符串（空白归一化后断言——oxfmt 折行使逐字匹配假红） */
const tpl = () =>
    ((AutoSpark as { components: Record<string, string> }).components[FLOAT_BUTTON_NAME] as string).replace(/\s+/g, " ");

/** 挂载（float-button 无 document 解析依赖，detached 树即可）；返回清理器 */
const mountButton = async (html: string, state: any) => {
    const { root, engine } = mount(html, state);
    await nextTick();
    return {
        root,
        engine,
        cleanup: () => { engine.destroy(); },
    };
};

/** window.scrollY 补丁（渐显判定消费——happy-dom 无真实滚动） */
const patchScrollY = (v: number) => {
    Object.defineProperty(window, "scrollY", { value: v, configurable: true });
};

/** window.scrollTo 间谍（回顶断言面） */
const spyScrollTo = () => {
    const calls: any[] = [];
    const original = window.scrollTo;
    (window as any).scrollTo = (...args: any[]) => { calls.push(args[0] ?? {}); };
    return { calls, restore: () => { (window as any).scrollTo = original; } };
};

const fireScroll = () => window.dispatchEvent(new Event("scroll"));

/** 本文件所有挂载的统一回收（scroll 监听卫生：防用例间串扰） */
const cleanups: Array<() => void> = [];
afterEach(() => {
    while (cleanups.length) cleanups.pop()!();
    Object.defineProperty(window, "scrollY", { value: 0, configurable: true, writable: true });
});

describe("注册面（组件形态官方样板）", () => {
    test("模块加载即注册：插件全局组件表含 autospark.float-button 模板字符串 + 主题档位继承", () => {
        const template = (AutoSpark as { components: Record<string, string> }).components[FLOAT_BUTTON_NAME];
        expect(typeof template).toBe("string");
        expect(template).toContain(`x-define="${FLOAT_BUTTON_NAME}"`);
        expect(template).toContain('x-define:inherit="autospark.base"'); // 主题档位继承（ADR-0134）
    });

    test("bootstrap 幂等：重复调用不覆盖（同键赋值幂等）", () => {
        const before = (AutoSpark as { components: Record<string, string> }).components[FLOAT_BUTTON_NAME];
        bootstrapFloatButtonPlugin();
        expect((AutoSpark as { components: Record<string, string> }).components[FLOAT_BUTTON_NAME]).toBe(before);
    });
});

describe("渲染（icon / 形态绑定 / label 插槽）", () => {
    test("icon 经 x-icon 注入 + 形态绑定落 body（T4=B）+ 默认插槽 label 投影", async () => {
        const { root, cleanup } = await mountButton(
            `<button x-component:autospark.float-button="{ icon: 'bell' }">客服</button>`,
            {},
        );
        cleanups.push(cleanup);
        const host = root.querySelector(".asc-float-button")!;
        expect(host.tagName).toBe("BUTTON"); // button 宿主化身（原生 type 由模板根静态并入）
        expect((host as HTMLButtonElement).type).toBe("button");
        const body = root.querySelector(".asc-float-button-body")!;
        expect(body.getAttribute("data-type")).toBe("default"); // 缺省形态
        expect(body.getAttribute("data-shape")).toBe("circle"); // 缺省形状
        const icon = root.querySelector(".asc-float-button-icon")!;
        expect(icon.querySelector("svg")).toBeTruthy(); // x-icon 注入（bell 命中内置图标）
        expect(icon.hasAttribute("data-default-icon")).toBe(false); // 自定义 icon 不落缺省标记
        expect(root.querySelector(".asc-float-button-label")!.textContent).toBe("客服"); // 插槽投影
    });

    test("shape/label：square 形态 + 无 label 时 :empty 不占位（模板断言）", async () => {
        const { root, cleanup } = await mountButton(
            `<button x-component:autospark.float-button="{ icon: 'edit', shape: 'square' }"></button>`,
            {},
        );
        cleanups.push(cleanup);
        expect(root.querySelector(".asc-float-button-body")!.getAttribute("data-shape")).toBe("square");
        expect(root.querySelector(".asc-float-button-label")!.textContent).toBe("");
    });

    test("样式规则（模板断言）：语义色/圆角/阴影走 --auto-* 档位 + 渐显块 + reduced-motion 停播 + 暗色兜底", () => {
        const t = tpl();
        // 语义色/底色/边框/阴影三级回退链（--auto-* 语义层为主入口）
        expect(t).toContain("background: var(--auto-bgcolor, var(--asc-float-button-bg, #ffffff));");
        expect(t).toContain("color: var(--auto-color, var(--asc-float-button-color, #606060));");
        expect(t).toContain("box-shadow: var(--auto-shadow, var(--asc-float-button-shadow, 0 2px 8px rgba(0, 0, 0, 0.12)));");
        // 阴影走 data-shadow 主题通道的注释声明在场
        expect(t).toContain("data-shadow");
        // square 圆角走 --auto-border-radius 档位
        expect(t).toContain(".asc-float-button:has(> .asc-float-button-body[data-shape=\"square\"]) {");
        // back-to-top 渐显：未越阈值隐藏（opacity/位移/visibility/交互阻断）
        expect(t).toContain(".asc-float-button:has(> .asc-float-button-body[data-type=\"back-to-top\"]):not([data-visible]) {");
        // reduced-motion 停播过渡
        expect(t).toContain("@media (prefers-reduced-motion: reduce) {");
        // 缺省 arrow 上旋指顶（自定义 icon 不旋）
        expect(t).toContain(".asc-float-button-body[data-type=\"back-to-top\"] .asc-float-button-icon[data-default-icon] {");
        // 暗色兜底变体在场（ADR-0129）
        expect(t).toContain("[dark] .asc-float-button,");
    });
});

describe("定位偏移（right / bottom JS 通道）", () => {
    test("number → px 内联写宿主 + string 带单位原样", async () => {
        const { root, cleanup } = await mountButton(
            `<button x-component:autospark.float-button="{ icon: 'bell', right: 80, bottom: '3rem' }"></button>`,
            {},
        );
        cleanups.push(cleanup);
        const host = root.querySelector(".asc-float-button") as HTMLElement;
        expect(host.style.right).toBe("80px");
        expect(host.style.bottom).toBe("3rem");
    });

    test("watch 随动：right 状态变化 → 内联同步（信封解构整组重同步）", async () => {
        const { root, engine, cleanup } = await mountButton(
            `<button x-component:autospark.float-button="{ icon: 'bell', right: edge }"></button>`,
            { edge: 40 },
        );
        cleanups.push(cleanup);
        const host = root.querySelector(".asc-float-button") as HTMLElement;
        expect(host.style.right).toBe("40px");
        engine.store.state.edge = 120;
        await nextTick();
        expect(host.style.right).toBe("120px");
    });
});

describe("back-to-top 形态（渐显 + 回顶）", () => {
    test("渐显阈值判定：未越阈值隐藏（无 data-visible）→ 越线显现 → 回落隐藏", async () => {
        const { root, cleanup } = await mountButton(
            `<button x-component:autospark.float-button="{ type: 'back-to-top' }"></button>`,
            {},
        );
        cleanups.push(cleanup);
        const host = root.querySelector(".asc-float-button")!;
        expect(host.hasAttribute("data-visible")).toBe(false); // scrollY=0 < 400（缺省阈值）
        patchScrollY(400);
        fireScroll();
        expect(host.hasAttribute("data-visible")).toBe(true); // 越线（>= 阈值）
        patchScrollY(120);
        fireScroll();
        expect(host.hasAttribute("data-visible")).toBe(false); // 回落隐藏
    });

    test("visibilityHeight 自定义阈值 + 缺省图标 arrow 上旋标记", async () => {
        const { root, cleanup } = await mountButton(
            `<button x-component:autospark.float-button="{ type: 'back-to-top', visibilityHeight: 100 }"></button>`,
            {},
        );
        cleanups.push(cleanup);
        const host = root.querySelector(".asc-float-button")!;
        const icon = root.querySelector(".asc-float-button-icon")!;
        expect(icon.hasAttribute("data-default-icon")).toBe(true); // icon 缺席落缺省标记（arrow 上旋）
        expect(icon.querySelector("svg")).toBeTruthy(); // 缺省 arrow 命中内置图标
        patchScrollY(150);
        fireScroll();
        expect(host.hasAttribute("data-visible")).toBe(true); // 自定义阈值 100 生效
    });

    test("点击回顶：window.scrollTo({ top: 0, behavior: 'smooth' })", async () => {
        const spy = spyScrollTo();
        const { root, cleanup } = await mountButton(
            `<button x-component:autospark.float-button="{ type: 'back-to-top' }"></button>`,
            {},
        );
        cleanups.push(() => { cleanup(); spy.restore(); });
        (root.querySelector(".asc-float-button") as HTMLElement).click();
        await nextTick();
        expect(spy.calls.length).toBe(1);
        expect(spy.calls[0]!.top).toBe(0);
        expect(spy.calls[0]!.behavior).toBe("smooth");
    });
});

describe("常规形态（恒显 + click 事件出口）", () => {
    test("恒显（无 data-visible 通道）+ click 原生冒泡外层可达 + 不内建滚动", async () => {
        const spy = spyScrollTo();
        const clicks: string[] = [];
        const { root, cleanup } = await mountButton(
            `<div @click="clicks.push('hit')">
                <button x-component:autospark.float-button="{ icon: 'bell' }"></button>
            </div>`,
            { clicks },
        );
        cleanups.push(() => { cleanup(); spy.restore(); });
        patchScrollY(800);
        fireScroll();
        const host = root.querySelector(".asc-float-button") as HTMLElement;
        expect(host.hasAttribute("data-visible")).toBe(false); // 常规形态不挂渐显标记（恒显）
        host.click();
        await nextTick();
        expect(clicks).toEqual(["hit"]); // 原生冒泡事件出口
        expect(spy.calls.length).toBe(0); // 不内建滚动
    });
});

describe("unmounted 清理（grid 的 matchMedia 先例）", () => {
    test("destroy 后 scroll 监听摘除：渐显标记不再随滚动切换（无泄漏）", async () => {
        const { root, engine } = await mountButton(
            `<button x-component:autospark.float-button="{ type: 'back-to-top' }"></button>`,
            {},
        );
        const host = root.querySelector(".asc-float-button")!;
        patchScrollY(500);
        fireScroll();
        expect(host.hasAttribute("data-visible")).toBe(true);
        engine.destroy(); // 本用例自行回收（不进 cleanups）
        patchScrollY(0);
        fireScroll();
        expect(host.hasAttribute("data-visible")).toBe(true); // destroy 后监听已摘，状态冻结
    });
});

describe("元素名快速写法（precompile 变换）", () => {
    test("<x-float-button> 替换为真 button 宿主（type 固定 button）+ 静态属性折叠 props", () => {
        const { root } = mount(
            `<div><x-float-button icon="bell" right="120">客服</x-float-button></div>`,
            {},
            { autostart: false },
        );
        const host = root.children[0]!.children[0]!;
        expect(host.tagName).toBe("BUTTON");
        expect((host as HTMLButtonElement).getAttribute("type")).toBe("button"); // 固定 type=button（防表单 submit 误触）
        const attrOf = (el: Element, name: string): string | undefined =>
            [...el.attributes].find((a) => a.name === name)?.value;
        const props = attrOf(host, "x-component:autospark.float-button")!;
        expect(props).toContain('icon: "bell"');
        expect(props).toContain("right: 120");
        expect(host.textContent).toBe("客服"); // 子内容随迁为默认插槽
    });

    test("back-to-top 裸属性糖：归一 type props + 糖属性不残留；显式 type 在场时糖失效", () => {
        const sugar = mount(`<div><x-float-button back-to-top></x-float-button></div>`, {}, { autostart: false });
        const host = sugar.root.children[0]!.children[0]!;
        const props = [...host.attributes].find((a) => a.name === "x-component:autospark.float-button")!.value;
        expect(props).toContain('type: "back-to-top"');
        expect(host.hasAttribute("back-to-top")).toBe(false); // 糖属性不残留宿主

        const explicit = mount(
            `<div><x-float-button type="back-to-top" icon="bell"></x-float-button></div>`,
            {},
            { autostart: false },
        );
        const host2 = explicit.root.children[0]!.children[0]!;
        const props2 = [...host2.attributes].find((a) => a.name === "x-component:autospark.float-button")!.value;
        expect(props2).toContain('type: "back-to-top"'); // 显式声明（糖缺席同样到达）
        expect(props2).toContain('icon: "bell"');
    });

    test("元素名形态渲染还原：<x-float-button back-to-top> 全链（渐显 + 回顶）", async () => {
        const spy = spyScrollTo();
        const { root, cleanup } = await mountButton(
            `<div><x-float-button back-to-top></x-float-button></div>`,
            {},
        );
        cleanups.push(() => { cleanup(); spy.restore(); });
        const host = root.querySelector(".asc-float-button")!;
        expect(host.hasAttribute("data-visible")).toBe(false); // scrollY=0
        patchScrollY(600);
        fireScroll();
        expect(host.hasAttribute("data-visible")).toBe(true);
        (host as HTMLElement).click();
        await nextTick();
        expect(spy.calls.length).toBe(1); // 裸属性糖全链到达（type 已归一）
    });
});
