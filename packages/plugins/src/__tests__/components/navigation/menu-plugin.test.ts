/**
 * menu 组件插件测试（组件库 P2 导航件，ADR-0018 清单权威表 navigation 行）：
 * - 组件形态官方样板：全局表注册 + 化身渲染 + 主题档位继承（autospark.base）；
 * - items 渲染：role=menu/menuitem 语义、icon 值通道、disabled 原生拦截、子菜单
 *   嵌套（data-sub 标记 + aria-expanded 随动）；
 * - 子菜单展开：点击父项切换 data-open、再点收回；disabled 父项不切换；
 * - 值通道：点击叶子激活 + change detail={value} + input 回写、同值短路、props
 *   value 受控单向、el.value 劫持桥、x-model 双向、祖先链自动展开；
 * - 形态：mode（vertical 缺省/horizontal）/ collapsed 落 body 数据属性；
 * - precompile 元素名变换：<x-menu> → div 宿主 + props 折叠 + <x-menu-item>（含
 *   嵌套 children）→ data-items JSON 通道（字面量数组 props 死环规避）。
 */
import "../../setup";
import { describe, expect, test } from "bun:test";
import { AutoSpark } from "autospark";
import { mount, nextTick } from "../../helpers";
import { MENU_NAME, bootstrapMenuPlugin } from "../../../components/navigation/menu/index";

/** 组件模板字符串（空白归一化后断言——oxfmt 折行使逐字匹配假红） */
const tpl = () =>
    ((AutoSpark as { components: Record<string, string> }).components[MENU_NAME] as string).replace(/\s+/g, " ");

/** 顶层叶子/父项按钮集（按 DOM 序） */
const links = (root: Element) => Array.from(root.querySelectorAll(".asc-menu-list > .asc-menu-item > .asc-menu-link")) as HTMLButtonElement[];
/** 子菜单项按钮集（第一个子菜单组内） */
const subLinks = (root: Element) => Array.from(root.querySelectorAll(".asc-menu-subitem > .asc-menu-link")) as HTMLButtonElement[];
/** 组项 li（带 data-sub 标记；happy-dom 空值属性选择器不稳，经 querySelectorAll 过滤） */
const groupLis = (root: Element) => Array.from(root.querySelectorAll(".asc-menu-item")).filter((li) => li.hasAttribute("data-sub"));

describe("注册面（组件形态官方样板）", () => {
    test("模块加载即注册：插件全局组件表含 autospark.menu 模板字符串 + 主题档位继承", () => {
        const template = (AutoSpark as { components: Record<string, string> }).components[MENU_NAME];
        expect(typeof template).toBe("string");
        expect(template).toContain(`x-define="${MENU_NAME}"`);
        expect(template).toContain('x-define:inherit="autospark.base"'); // 主题档位继承（ADR-0134）
    });

    test("bootstrap 幂等：重复调用不覆盖（同键赋值幂等）", () => {
        const before = (AutoSpark as { components: Record<string, string> }).components[MENU_NAME];
        bootstrapMenuPlugin();
        expect((AutoSpark as { components: Record<string, string> }).components[MENU_NAME]).toBe(before);
    });
});

describe("items 渲染与菜单语义", () => {
    test("渲染：list 为 menu、项为 menuitem（WAI-ARIA menu 模式），icon 值通道 + disabled 原生", async () => {
        const { root } = mount(
            `<div x-component:autospark.menu="{ items: menu }"></div>`,
            {
                menu: [
                    { key: "a", label: "概览", icon: "file" },
                    { key: "b", label: "禁用项", disabled: true },
                ],
            },
        );
        await nextTick();
        expect(root.querySelector(".asc-menu-list")!.getAttribute("role")).toBe("menu");
        const items = links(root);
        expect(items.length).toBe(2);
        expect(items[0]!.getAttribute("role")).toBe("menuitem");
        expect(items[0]!.textContent).toContain("概览");
        expect(items[0]!.querySelector(".asc-menu-icon")).toBeTruthy(); // icon 值通道
        expect(items[1]!.disabled).toBe(true); // 原生禁用
        // 缺省无激活项（与 tablist 恒有一项激活不同）
        expect(root.querySelector(".asc-menu-link[data-active]")).toBe(null);
    });

    test("子菜单嵌套渲染：父项 data-sub 标记 + aria-expanded 缺省 false + 子项逐个克隆", async () => {
        const { root } = mount(
            `<div x-component:autospark.menu="{ items: menu }"></div>`,
            {
                menu: [
                    {
                        key: "g",
                        label: "分组",
                        children: [
                            { key: "g1", label: "子项一", icon: "file" },
                            { key: "g2", label: "子项二", disabled: true },
                        ],
                    },
                    { key: "z", label: "独立项" },
                ],
            },
        );
        await nextTick();
        const itemEls = Array.from(root.querySelectorAll(".asc-menu-list > .asc-menu-item"));
        expect(itemEls[0]!.hasAttribute("data-sub")).toBe(true); // 父项标记
        expect(itemEls[1]!.hasAttribute("data-sub")).toBe(false); // 叶子无标记
        const parent = links(root)[0]!;
        expect(parent.getAttribute("aria-expanded")).toBe("false"); // 缺省收起
        expect(parent.querySelector(".asc-menu-arrow")).toBeTruthy(); // 展开箭头
        const subs = subLinks(root);
        expect(subs.length).toBe(2);
        expect(subs[0]!.textContent).toContain("子项一");
        expect(subs[1]!.disabled).toBe(true);
    });
});

describe("子菜单展开切换", () => {
    test("点击父项展开：subwrap 落 data-open + aria-expanded 迁移 true；再点收回", async () => {
        const { root } = mount(
            `<div x-component:autospark.menu="{ items: menu }"></div>`,
            {
                menu: [
                    { key: "g", label: "分组", children: [{ key: "g1", label: "子项一" }] },
                ],
            },
        );
        await nextTick();
        const parent = links(root)[0]!;
        const wrap = root.querySelector(".asc-menu-subwrap")!;
        expect(wrap.hasAttribute("data-open")).toBe(false); // 缺省收起
        parent.click();
        await nextTick();
        expect(wrap.hasAttribute("data-open")).toBe(true); // 展开
        expect(parent.getAttribute("aria-expanded")).toBe("true");
        expect(wrap.hasAttribute("data-open")).toBe(true);
        parent.click(); // 再点收回
        await nextTick();
        expect(wrap.hasAttribute("data-open")).toBe(false);
        expect(parent.getAttribute("aria-expanded")).toBe("false");
    });

    test("disabled 父项：点击不切换展开、不激活", async () => {
        const { root } = mount(
            `<div x-component:autospark.menu="{ items: menu }"></div>`,
            {
                menu: [
                    { key: "g", label: "禁用组", disabled: true, children: [{ key: "g1", label: "子项一" }] },
                ],
            },
        );
        await nextTick();
        const wrap = root.querySelector(".asc-menu-subwrap")!;
        links(root)[0]!.click();
        await nextTick();
        expect(wrap.hasAttribute("data-open")).toBe(false); // 禁用拦截
    });
});

describe("交互与值通道（受控单选）", () => {
    test("点击叶子激活：change 冒泡 detail={value} + input 派发 + data-active 迁移 + el.value 桥读", async () => {
        const changes: string[] = [];
        const { root, engine } = mount(
            `<div @change="changes.push($event.detail.value)">
                <div x-model="active" x-component:autospark.menu="{ items: menu }"></div>
            </div>`,
            { active: "", changes, menu: [{ key: "a", label: "A" }, { key: "b", label: "B" }] },
        );
        await nextTick();
        const host = root.querySelector(".asc-menu")!;
        links(root)[1]!.click();
        await nextTick();
        expect(changes).toEqual(["b"]); // change 冒泡 detail={value}
        expect(engine.store.state.active).toBe("b"); // input 派发 → x-model 回写
        expect(links(root)[1]!.hasAttribute("data-active")).toBe(true);
        expect((host as unknown as { value: string }).value).toBe("b"); // el.value 劫持桥读
    });

    test("点击已激活项短路：不派发 change/input（同值幂等）", async () => {
        const changes: string[] = [];
        const { root } = mount(
            `<div @change="changes.push($event.detail.value)">
                <div x-component:autospark.menu="{ items: menu, value: 'a' }"></div>
            </div>`,
            { changes, menu: [{ key: "a", label: "A" }, { key: "b", label: "B" }] },
        );
        await nextTick();
        links(root)[0]!.click();
        await nextTick();
        expect(changes).toEqual([]);
    });

    test("disabled 叶子项：点击不激活、不派发", async () => {
        const changes: string[] = [];
        const { root } = mount(
            `<div @change="changes.push($event.detail.value)">
                <div x-component:autospark.menu="{ items: menu }"></div>
            </div>`,
            { changes, menu: [{ key: "a", label: "可用" }, { key: "b", label: "禁用", disabled: true }] },
        );
        await nextTick();
        links(root)[1]!.click();
        await nextTick();
        expect(changes).toEqual([]);
        expect(root.querySelector(".asc-menu-link[data-active]")).toBe(null);
    });

    test("props value 受控单向：state 变化 → 激活迁移（无点击不广播）", async () => {
        const changes: string[] = [];
        const { root, engine } = mount(
            `<div @change="changes.push($event.detail.value)">
                <div x-component:autospark.menu="{ items: menu, value: active }"></div>
            </div>`,
            { active: "a", changes, menu: [{ key: "a", label: "A" }, { key: "b", label: "B" }] },
        );
        await nextTick();
        engine.store.state.active = "b";
        await nextTick();
        expect(links(root)[1]!.hasAttribute("data-active")).toBe(true);
        expect(changes).toEqual([]); // props 驱动不广播防回环
    });

    test("el.value 劫持桥：程序写值即激活迁移（受控 DOM 通道）", async () => {
        const { root } = mount(
            `<div x-component:autospark.menu="{ items: menu, value: 'a' }"></div>`,
            { menu: [{ key: "a", label: "A" }, { key: "b", label: "B" }] },
        );
        await nextTick();
        const host = root.querySelector(".asc-menu") as unknown as { value: string };
        host.value = "b";
        await nextTick();
        expect(links(root)[1]!.hasAttribute("data-active")).toBe(true);
        expect(host.value).toBe("b");
    });

    test("x-model 双向：state 外部变更 → 激活迁移（x-model expando 初值激活）", async () => {
        const { root, engine } = mount(
            `<div><div x-model="active" x-component:autospark.menu="{ items: menu }"></div></div>`,
            { active: "b", menu: [{ key: "a", label: "A" }, { key: "b", label: "B" }] },
        );
        await nextTick();
        expect(links(root)[1]!.hasAttribute("data-active")).toBe(true);
        engine.store.state.active = "a";
        await nextTick();
        expect(links(root)[0]!.hasAttribute("data-active")).toBe(true);
    });
});

describe("祖先链自动展开", () => {
    test("受控 value 指向子项：父项子菜单自动展开（初值落定）", async () => {
        const { root } = mount(
            `<div x-component:autospark.menu="{ items: menu, value: 'g2' }"></div>`,
            {
                menu: [
                    { key: "g", label: "分组", children: [{ key: "g1", label: "一" }, { key: "g2", label: "二" }] },
                ],
            },
        );
        await nextTick();
        const wrap = root.querySelector(".asc-menu-subwrap")!;
        expect(wrap.hasAttribute("data-open")).toBe(true); // 祖先自动展开
        expect(subLinks(root)[1]!.hasAttribute("data-active")).toBe(true); // 子项激活
    });

    test("运行中激活迁移到子项：祖先链跟随展开", async () => {
        const { root } = mount(
            `<div x-component:autospark.menu="{ items: menu, value: active }"></div>`,
            {
                active: "a",
                menu: [
                    { key: "a", label: "A" },
                    { key: "g", label: "分组", children: [{ key: "g1", label: "一" }] },
                ],
            },
        );
        await nextTick();
        const wrap = groupLis(root)[0]!.querySelector(".asc-menu-subwrap")!;
        expect(wrap.hasAttribute("data-open")).toBe(false); // 初值在叶子
        const host = root.querySelector(".asc-menu") as unknown as { value: string };
        host.value = "g1";
        await nextTick();
        expect(wrap.hasAttribute("data-open")).toBe(true); // 值变化 → 祖先展开
        expect(subLinks(root)[0]!.hasAttribute("data-active")).toBe(true);
    });
});

describe("形态（mode / collapsed）", () => {
    test("形态绑定落 body（T4=B）：vertical 缺省 / horizontal / collapsed", async () => {
        const vertical = mount(`<div x-component:autospark.menu="{ items: menu }"></div>`, {
            menu: [{ key: "a", label: "A" }],
        });
        await nextTick();
        expect(vertical.root.querySelector(".asc-menu-body")!.getAttribute("data-mode")).toBe("vertical");
        expect(vertical.root.querySelector(".asc-menu-body")!.hasAttribute("data-collapsed")).toBe(false);

        const horiz = mount(`<div x-component:autospark.menu="{ items: menu, mode: 'horizontal' }"></div>`, {
            menu: [{ key: "a", label: "A" }],
        });
        await nextTick();
        expect(horiz.root.querySelector(".asc-menu-body")!.getAttribute("data-mode")).toBe("horizontal");

        const rail = mount(`<div x-component:autospark.menu="{ items: menu, collapsed: true }"></div>`, {
            menu: [{ key: "a", label: "A", icon: "file" }],
        });
        await nextTick();
        expect(rail.root.querySelector(".asc-menu-body")!.hasAttribute("data-collapsed")).toBe(true);
    });

    test("形态样式规则（模板断言）：vertical 收张动画 + horizontal/collapsed 浮层面板 + 激活 tint + 暗色兜底", () => {
        const t = tpl();
        // vertical：grid-rows 动画收张
        expect(t).toContain(".asc-menu-subwrap[data-open] { grid-template-rows: 1fr; }");
        // horizontal 浮层：hover/focus-within 展开 + 面板底
        expect(t).toContain('[data-mode="horizontal"] .asc-menu-item[data-sub]:hover > .asc-menu-subwrap,');
        expect(t).toContain(".asc-menu-body[data-mode=\"horizontal\"] .asc-menu-item[data-sub] > .asc-menu-subwrap,");
        // collapsed 图标条：顶层文字/箭头隐藏
        expect(t).toContain('[data-mode="vertical"][data-collapsed] > .asc-menu-list > .asc-menu-item > .asc-menu-link > .asc-menu-label,');
        // 激活项：主色文字 + tint 底
        expect(t).toContain(".asc-menu-link[data-active] {");
        // 暗色兜底变体在场（ADR-0129）
        expect(t).toContain("[dark] .asc-menu-link,");
        expect(t).toContain("[data-dark] .asc-menu-body[data-mode=\"horizontal\"] .asc-menu-item[data-sub] > .asc-menu-subwrap,");
    });
});

describe("元素名快速写法（precompile 变换）", () => {
    test("<x-menu> 替换为 div 宿主 + 静态属性折叠 props（autostart:false 断言变换产物）", () => {
        const { root } = mount(
            `<div><x-menu mode="horizontal"><span>占位</span></x-menu></div>`,
            {},
            { autostart: false },
        );
        const host = root.children[0]!.children[0]!;
        expect(host.tagName).toBe("DIV");
        const attrOf = (el: Element, name: string): string | undefined =>
            [...el.attributes].find((a) => a.name === name)?.value;
        const props = attrOf(host, "x-component:autospark.menu")!;
        expect(props).toContain('mode: "horizontal"');
        expect(host.querySelector("span")!.textContent).toBe("占位"); // 子内容随迁为默认插槽
    });

    test("<x-menu-item> 子元素声明（含嵌套 children）：折叠为 items JSON 落 data-items + 声明元素摘除 + 渲染还原", async () => {
        const { root } = mount(
            `<div><x-menu value="g1">
                <x-menu-item key="a" label="概览" icon="file"></x-menu-item>
                <x-menu-item key="g" label="分组">
                    <x-menu-item key="g1" label="子项一"></x-menu-item>
                    <x-menu-item key="g2" label="禁用子项" disabled></x-menu-item>
                </x-menu-item>
            </x-menu></div>`,
            {},
        );
        await nextTick();
        expect(root.querySelector("x-menu-item")).toBe(null); // 声明元素不残留
        const items = links(root);
        expect(items.length).toBe(2);
        expect(items[0]!.textContent).toContain("概览");
        expect(items[0]!.querySelector(".asc-menu-icon")).toBeTruthy(); // icon 折叠进 JSON 通道
        const subs = subLinks(root);
        expect(subs.length).toBe(2); // 嵌套 children 折叠还原
        expect(subs[0]!.textContent).toContain("子项一");
        expect(subs[1]!.disabled).toBe(true); // 裸 disabled 归一 true
        expect(subs[0]!.hasAttribute("data-active")).toBe(true); // value="g1" 静态折叠激活
        expect(groupLis(root)[0]!.querySelector(".asc-menu-subwrap")!.hasAttribute("data-open")).toBe(true); // 祖先自动展开
    });

    test(":items 状态引用在场：data-items 不落盘（props 优先）+ 声明子元素仍摘除", async () => {
        const { root } = mount(
            `<div><x-menu :items="menu"><x-menu-item key="z" label="声明形态被忽略"></x-menu-item></x-menu></div>`,
            { menu: [{ key: "a", label: "状态引用" }] },
        );
        await nextTick();
        const host = root.querySelector(".asc-menu")!;
        expect(host.hasAttribute("data-items")).toBe(false);
        expect(root.querySelector("x-menu-item")).toBe(null);
        expect(links(root).length).toBe(1);
        expect(links(root)[0]!.textContent).toContain("状态引用");
    });

    test("裸 items 属性（JSON 字符串）走 data-items 通道（不进 props 值对象——字面量数组死环规避）", async () => {
        const { root } = mount(
            `<div><x-menu items='[{"key":"a","label":"JSON 形态"},{"key":"g","label":"组","children":[{"key":"g1","label":"子"}]}]'></x-menu></div>`,
            {},
        );
        await nextTick();
        expect(links(root).length).toBe(2);
        expect(links(root)[0]!.textContent).toContain("JSON 形态");
        expect(subLinks(root).length).toBe(1); // JSON 通道保留 children 嵌套
    });
});
