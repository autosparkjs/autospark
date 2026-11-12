/**
 * tabs 组件插件测试（组件库 P1 导航件，ADR-0018 清单权威表 navigation 行 / 决策 3
 * segmented 并入本件作 variant）：
 * - 组件形态官方样板：全局表注册 + 化身渲染 + 主题档位继承（autospark.base）；
 * - items 渲染与缺省激活：role=tablist/tab 语义、首可用项缺省激活（active/aria/tabindex）；
 * - 值通道：点击激活 + change detail={value} + input 回写、同值短路、disabled 拦截、
 *   props value 受控单向、el.value 劫持桥、x-model 双向；
 * - 键盘导航（tablist 语义）：左右移焦环形 + 自动激活、Home/End、disabled 跳过；
 * - 形态 variant：line/card/segmented 落 body data-variant；
 * - 面板区：默认插槽投影 + :empty 隐藏规则（模板断言）；
 * - precompile 元素名变换：<x-tabs> → div 宿主 + props 折叠 + <x-tab> → data-items
 *   JSON 通道（字面量数组 props 死环规避）。
 */
import "../../setup";
import { describe, expect, test } from "bun:test";
import { AutoSpark } from "autospark";
import { mount, nextTick } from "../../helpers";
import { TABS_NAME, bootstrapTabsPlugin } from "../../../components/navigation/tabs/index";

/** 组件模板字符串（空白归一化后断言——oxfmt 折行使逐字匹配假红） */
const tpl = () =>
    ((AutoSpark as { components: Record<string, string> }).components[TABS_NAME] as string).replace(/\s+/g, " ");

/** 键盘事件派发（tablist 键盘导航用例） */
const pressKey = (el: Element, key: string) =>
    el.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));

describe("注册面（组件形态官方样板）", () => {
    test("模块加载即注册：插件全局组件表含 autospark.tabs 模板字符串 + 主题档位继承", () => {
        const template = (AutoSpark as { components: Record<string, string> }).components[TABS_NAME];
        expect(typeof template).toBe("string");
        expect(template).toContain(`x-define="${TABS_NAME}"`);
        expect(template).toContain('x-define:inherit="autospark.base"'); // 主题档位继承（ADR-0134）
    });

    test("bootstrap 幂等：重复调用不覆盖（同键赋值幂等）", () => {
        const before = (AutoSpark as { components: Record<string, string> }).components[TABS_NAME];
        bootstrapTabsPlugin();
        expect((AutoSpark as { components: Record<string, string> }).components[TABS_NAME]).toBe(before);
    });
});

describe("items 渲染与激活语义", () => {
    test("渲染：页签按钮逐项生成，bar 为 tablist、页签为 tab（WAI-ARIA tabs 模式）", async () => {
        const { root } = mount(
            `<div x-component:autospark.tabs="{ items: tabs }"></div>`,
            {
                tabs: [
                    { key: "a", label: "详情" },
                    { key: "b", label: "设置", icon: "settings" },
                ],
            },
        );
        await nextTick();
        expect(root.querySelector(".asc-tabs-bar")!.getAttribute("role")).toBe("tablist");
        const tabs = root.querySelectorAll(".asc-tabs-tab");
        expect(tabs.length).toBe(2);
        expect(tabs[0]!.getAttribute("role")).toBe("tab");
        expect(tabs[0]!.textContent).toContain("详情");
        expect(tabs[1]!.querySelector(".asc-tabs-tab-icon")).toBeTruthy(); // icon 值通道
    });

    test("缺省激活：未指定 value 时激活首个可用项（disabled 首项被跳过）", async () => {
        const { root } = mount(
            `<div x-component:autospark.tabs="{ items: tabs }"></div>`,
            {
                tabs: [
                    { key: "a", label: "禁用", disabled: true },
                    { key: "b", label: "次项" },
                    { key: "c", label: "三项" },
                ],
            },
        );
        await nextTick();
        const tabs = Array.from(root.querySelectorAll(".asc-tabs-tab"));
        expect(tabs[1]!.hasAttribute("data-active")).toBe(true);
        expect(tabs[1]!.getAttribute("aria-selected")).toBe("true");
        expect(tabs[1]!.getAttribute("tabindex")).toBe("0"); // 焦点漫游：激活项 0
        expect(tabs[2]!.getAttribute("aria-selected")).toBe("false");
        expect(tabs[2]!.getAttribute("tabindex")).toBe("-1"); // 其余 -1
    });

    test("props value 指定激活项；tablist 键语义绑定随 data 值随动", async () => {
        const { root } = mount(
            `<div x-component:autospark.tabs="{ items: tabs, value: 'b' }"></div>`,
            { tabs: [{ key: "a", label: "A" }, { key: "b", label: "B" }] },
        );
        await nextTick();
        const tabs = Array.from(root.querySelectorAll(".asc-tabs-tab"));
        expect(tabs[0]!.getAttribute("aria-selected")).toBe("false");
        expect(tabs[1]!.hasAttribute("data-active")).toBe(true);
    });
});

describe("交互与值通道（button-group 选中模式同构）", () => {
    test("点击切换：change 冒泡 detail={value} + input 派发 + 激活态迁移（aria/data-active/tabindex）", async () => {
        const changes: string[] = [];
        const { root, engine } = mount(
            `<div @change="changes.push($event.detail.value)">
                <div x-model="tab" x-component:autospark.tabs="{ items: tabs }"></div>
            </div>`,
            { tab: "a", changes, tabs: [{ key: "a", label: "A" }, { key: "b", label: "B" }] },
        );
        await nextTick();
        const host = root.querySelector(".asc-tabs")!;
        const tabs = Array.from(root.querySelectorAll(".asc-tabs-tab"));
        expect(tabs[0]!.getAttribute("aria-selected")).toBe("true"); // x-model 初值激活 a
        (tabs[1] as HTMLElement).click();
        await nextTick();
        expect(changes).toEqual(["b"]); // change 冒泡 detail={value}
        expect(engine.store.state.tab).toBe("b"); // input 派发 → x-model 回写
        expect(tabs[1]!.getAttribute("aria-selected")).toBe("true");
        expect(tabs[1]!.hasAttribute("data-active")).toBe(true);
        expect(tabs[1]!.getAttribute("tabindex")).toBe("0");
        expect(tabs[0]!.getAttribute("aria-selected")).toBe("false");
        expect((host as unknown as { value: string }).value).toBe("b"); // el.value 劫持桥读
    });

    test("点击已激活项短路：不派发 change/input（同值幂等）", async () => {
        const changes: string[] = [];
        const { root } = mount(
            `<div @change="changes.push($event.detail.value)">
                <div x-component:autospark.tabs="{ items: tabs, value: 'a' }"></div>
            </div>`,
            { changes, tabs: [{ key: "a", label: "A" }, { key: "b", label: "B" }] },
        );
        await nextTick();
        (root.querySelectorAll(".asc-tabs-tab")[0] as HTMLElement).click();
        await nextTick();
        expect(changes).toEqual([]);
    });

    test("disabled 项：原生 disabled 属性在场、点击不激活", async () => {
        const changes: string[] = [];
        const { root } = mount(
            `<div @change="changes.push($event.detail.value)">
                <div x-component:autospark.tabs="{ items: tabs }"></div>
            </div>`,
            { changes, tabs: [{ key: "a", label: "可用" }, { key: "b", label: "禁用", disabled: true }] },
        );
        await nextTick();
        const tabs = Array.from(root.querySelectorAll(".asc-tabs-tab")) as HTMLButtonElement[];
        expect(tabs[1]!.disabled).toBe(true); // 原生禁用（键盘/点击原生拦截）
        tabs[1].click();
        await nextTick();
        expect(changes).toEqual([]);
        expect(tabs[0]!.getAttribute("aria-selected")).toBe("true"); // 激活不动
    });

    test("props value 受控单向：state 变化 → 激活迁移（无点击不广播）", async () => {
        const { root, engine } = mount(
            `<div x-component:autospark.tabs="{ items: tabs, value: view }"></div>`,
            { view: "a", tabs: [{ key: "a", label: "A" }, { key: "b", label: "B" }] },
        );
        await nextTick();
        engine.store.state.view = "b";
        await nextTick();
        const tabs = Array.from(root.querySelectorAll(".asc-tabs-tab"));
        expect(tabs[1]!.hasAttribute("data-active")).toBe(true);
        expect(tabs[0]!.getAttribute("aria-selected")).toBe("false");
    });

    test("el.value 劫持桥：程序写值即激活迁移（受控 DOM 通道）", async () => {
        const { root } = mount(
            `<div x-component:autospark.tabs="{ items: tabs, value: 'a' }"></div>`,
            { tabs: [{ key: "a", label: "A" }, { key: "b", label: "B" }] },
        );
        await nextTick();
        const host = root.querySelector(".asc-tabs") as unknown as { value: string };
        host.value = "b";
        await nextTick();
        expect(root.querySelectorAll(".asc-tabs-tab")[1]!.hasAttribute("data-active")).toBe(true);
        expect(host.value).toBe("b");
    });

    test("x-model 双向：state 外部变更 → 激活迁移（x-model expando 初值激活）", async () => {
        const { root, engine } = mount(
            `<div><div x-model="tab" x-component:autospark.tabs="{ items: tabs }"></div></div>`,
            { tab: "b", tabs: [{ key: "a", label: "A" }, { key: "b", label: "B" }] },
        );
        await nextTick();
        expect(root.querySelectorAll(".asc-tabs-tab")[1]!.getAttribute("aria-selected")).toBe("true");
        engine.store.state.tab = "a";
        await nextTick();
        expect(root.querySelectorAll(".asc-tabs-tab")[0]!.hasAttribute("data-active")).toBe(true);
    });
});

describe("键盘导航（tablist 语义）", () => {
    test("ArrowRight/ArrowLeft：移焦 + 自动激活，环形环绕", async () => {
        const { root } = mount(
            `<div x-component:autospark.tabs="{ items: tabs, value: 'a' }"></div>`,
            { tabs: [{ key: "a", label: "A" }, { key: "b", label: "B" }, { key: "c", label: "C" }] },
        );
        await nextTick();
        const tabs = Array.from(root.querySelectorAll(".asc-tabs-tab")) as HTMLElement[];
        pressKey(tabs[0], "ArrowRight");
        await nextTick();
        expect(tabs[1]!.hasAttribute("data-active")).toBe(true);
        pressKey(tabs[1], "ArrowRight");
        await nextTick();
        expect(tabs[2]!.hasAttribute("data-active")).toBe(true);
        pressKey(tabs[2], "ArrowRight"); // 末项右移 → 环形回首项
        await nextTick();
        expect(tabs[0]!.hasAttribute("data-active")).toBe(true);
        pressKey(tabs[0], "ArrowLeft"); // 首项左移 → 环形回末项
        await nextTick();
        expect(tabs[2]!.hasAttribute("data-active")).toBe(true);
        expect(document.activeElement === tabs[2]).toBe(true); // 移焦（roving tabindex）
    });

    test("Home/End 直达首末；disabled 项被键盘序列跳过", async () => {
        const { root } = mount(
            `<div x-component:autospark.tabs="{ items: tabs, value: 'c' }"></div>`,
            {
                tabs: [
                    { key: "a", label: "A" },
                    { key: "b", label: "禁用", disabled: true },
                    { key: "c", label: "C" },
                    { key: "d", label: "D" },
                ],
            },
        );
        await nextTick();
        const tabs = Array.from(root.querySelectorAll(".asc-tabs-tab")) as HTMLElement[];
        pressKey(tabs[2], "End");
        await nextTick();
        expect(tabs[3]!.hasAttribute("data-active")).toBe(true);
        pressKey(tabs[3], "Home");
        await nextTick();
        expect(tabs[0]!.hasAttribute("data-active")).toBe(true);
        pressKey(tabs[0], "ArrowRight"); // b 禁用被跳过 → 直达 c
        await nextTick();
        expect(tabs[2]!.hasAttribute("data-active")).toBe(true);
    });

    test("非方向键不拦截：普通按键放行（keydown 未被 preventDefault）", async () => {
        const { root } = mount(
            `<div x-component:autospark.tabs="{ items: tabs }"></div>`,
            { tabs: [{ key: "a", label: "A" }, { key: "b", label: "B" }] },
        );
        await nextTick();
        const tab = root.querySelectorAll(".asc-tabs-tab")[0]!;
        const ev = new KeyboardEvent("keydown", { key: "x", bubbles: true, cancelable: true });
        tab.dispatchEvent(ev);
        expect(ev.defaultPrevented).toBe(false);
    });
});

describe("形态（variant）与面板区", () => {
    test("variant 绑定落 body（T4=B：根上动态绑定不求值）：line 缺省 / segmented / card", async () => {
        const line = mount(`<div x-component:autospark.tabs="{ items: tabs }"></div>`, {
            tabs: [{ key: "a", label: "A" }],
        });
        await nextTick();
        expect(line.root.querySelector(".asc-tabs-body")!.getAttribute("data-variant")).toBe("line");

        const seg = mount(`<div x-component:autospark.tabs="{ items: tabs, variant: 'segmented' }"></div>`, {
            tabs: [{ key: "a", label: "A" }, { key: "b", label: "B" }],
        });
        await nextTick();
        expect(seg.root.querySelector(".asc-tabs-body")!.getAttribute("data-variant")).toBe("segmented");

        const card = mount(`<div x-component:autospark.tabs="{ items: tabs, variant: 'card' }"></div>`, {
            tabs: [{ key: "a", label: "A" }],
        });
        await nextTick();
        expect(card.root.querySelector(".asc-tabs-body")!.getAttribute("data-variant")).toBe("card");
    });

    test("默认插槽面板区：投影内容落 .asc-tabs-content（消费者以 x-show/x-if 切面板）", async () => {
        const { root } = mount(
            `<div><div x-component:autospark.tabs="{ items: tabs, value: view }">
                <p x-show="view === 'a'" class="pane-a">面板 A</p>
                <p x-show="view === 'b'" class="pane-b">面板 B</p>
            </div></div>`,
            { view: "a", tabs: [{ key: "a", label: "A" }, { key: "b", label: "B" }] },
        );
        await nextTick();
        const content = root.querySelector(".asc-tabs-content")!;
        expect(content.querySelector(".pane-a")).toBeTruthy();
        // 面板随激活切换（x-show 家族：宿主永留 DOM，变可见性）
        expect((content.querySelector(".pane-a") as HTMLElement).style.display).toBe("");
        expect((content.querySelector(".pane-b") as HTMLElement).style.display).toBe("none");
        (root.querySelectorAll(".asc-tabs-tab")[1] as HTMLElement).click();
        await nextTick();
        expect((content.querySelector(".pane-b") as HTMLElement).style.display).toBe("");
        expect((content.querySelector(".pane-a") as HTMLElement).style.display).toBe("none");
    });

    test("形态样式规则（模板断言）：segmented 实底反白 + line 下划线 + card 连线 + :empty 隐藏 + 暗色兜底", () => {
        const t = tpl();
        // segmented：激活 tone 实底反白（语义色底白字恒定设计）+ 浅底容器
        expect(t).toContain('.asc-tabs-body[data-variant="segmented"] .asc-tabs-tab[data-active] { color: var(--asc-tabs-seg-ink, #ffffff); background: var(--asc-tone); }');
        expect(t).toContain('.asc-tabs-body[data-variant="segmented"] .asc-tabs-bar {');
        // line：激活下划线 scaleX 展开
        expect(t).toContain('.asc-tabs-body[data-variant="line"] .asc-tabs-tab[data-active]::after { transform: scaleX(1); }');
        // card：激活卡盖底线（z 抬层）+ 内容区三边线上缘压叠
        expect(t).toContain('.asc-tabs-body[data-variant="card"] .asc-tabs-tab[data-active] {');
        expect(t).toContain(".asc-tabs-content:empty { display: none; }");
        // 暗色兜底变体在场（ADR-0129）
        expect(t).toContain("[dark] .asc-tabs-tab,");
        expect(t).toContain("[data-dark] .asc-tabs-body[data-variant=\"segmented\"] .asc-tabs-bar {");
    });
});

describe("元素名快速写法（precompile 变换）", () => {
    test("<x-tabs> 替换为 div 宿主 + 静态属性折叠 props（autostart:false 断言变换产物）", () => {
        const { root } = mount(
            `<div><x-tabs variant="card"><span>面板占位</span></x-tabs></div>`,
            {},
            { autostart: false },
        );
        const host = root.children[0]!.children[0]!;
        expect(host.tagName).toBe("DIV");
        const attrOf = (el: Element, name: string): string | undefined =>
            [...el.attributes].find((a) => a.name === name)?.value;
        const props = attrOf(host, "x-component:autospark.tabs")!;
        expect(props).toContain('variant: "card"');
        expect(host.querySelector("span")!.textContent).toBe("面板占位"); // 子内容随迁为默认插槽
    });

    test("<x-tab> 子元素声明：折叠为 items JSON 落 data-items + 声明元素摘除 + 渲染还原", async () => {
        const { root } = mount(
            `<div><x-tabs value="b">
                <x-tab key="a" label="详情"></x-tab>
                <x-tab key="b" label="设置" icon="settings"></x-tab>
                <x-tab key="c" label="禁用" disabled></x-tab>
            </x-tabs></div>`,
            {},
        );
        await nextTick();
        expect(root.querySelector("x-tab")).toBe(null); // 声明元素不残留
        const tabs = Array.from(root.querySelectorAll(".asc-tabs-tab")) as HTMLButtonElement[];
        expect(tabs.length).toBe(3);
        expect(tabs[0]!.textContent).toContain("详情");
        expect(tabs[1]!.querySelector(".asc-tabs-tab-icon")).toBeTruthy(); // icon 折叠进 JSON 通道
        expect(tabs[2]!.disabled).toBe(true); // 裸 disabled 归一 true
        expect(tabs[1]!.hasAttribute("data-active")).toBe(true); // value="b" 静态折叠激活
    });

    test(":items 状态引用在场：data-items 不落盘（props 优先）+ 声明子元素仍摘除", async () => {
        const { root } = mount(
            `<div><x-tabs :items="tabs"><x-tab key="z" label="声明形态被忽略"></x-tab></x-tabs></div>`,
            { tabs: [{ key: "a", label: "状态引用" }] },
        );
        await nextTick();
        const host = root.querySelector(".asc-tabs")!;
        expect(host.hasAttribute("data-items")).toBe(false);
        expect(root.querySelector("x-tab")).toBe(null);
        expect(root.querySelectorAll(".asc-tabs-tab").length).toBe(1);
        expect(root.querySelector(".asc-tabs-tab")!.textContent).toContain("状态引用");
    });

    test("裸 items 属性（JSON 字符串）走 data-items 通道（不进 props 值对象——字面量数组死环规避）", async () => {
        const { root } = mount(
            `<div><x-tabs items='[{"key":"a","label":"JSON 形态"},{"key":"b","label":"B"}]'></x-tabs></div>`,
            {},
        );
        await nextTick();
        const tabs = root.querySelectorAll(".asc-tabs-tab");
        expect(tabs.length).toBe(2);
        expect(tabs[0]!.textContent).toContain("JSON 形态");
        expect(tabs[0]!.hasAttribute("data-active")).toBe(true); // 缺省激活首项
    });
});
