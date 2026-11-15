/**
 * dropdown 组件插件测试（组件库 P3 下拉族 navigation 件，ADR-0027）：
 * - 注册面：dropdown / dropdown-panel 双模板入全局组件表 + trigger/placement 经
 *   x-popover-options 成员属性表达式透传声明 + bootstrap 幂等 + 样式回退链；
 * - 触发区：默认插槽投影（任意内容包裹交互）+ tabindex 聚焦位 + aria（hasmenu/
 *   expanded 随开合）；
 * - items 渲染：状态引用注入（icon / disabled / divided / danger 标记、WAI-ARIA
 *   menu 语义）+ 空态「暂无数据」+ 热更新；
 * - 开合：click 触发 toggle / hover 触发（mouseenter 开 + mouseleave 关，程序化
 *   开合按模型分派）/ ESC 关闭（机制继承）/ 面板外点击关闭；
 * - 选中：菜单项点击 → select detail={key,item} + 面板关 + 高亮复位；禁用项跳过；
 * - 键盘（WAI-ARIA menu 模式，高亮漫游）：上下移动（跳过禁用、环绕）+ Enter 触发 /
 *   无高亮关面板 + preventDefault；
 * - 悬停高亮回传（hoverTick 哨兵）；
 * - precompile 元素名变换：<x-dropdown> 属性折叠 + <x-dropdown-item> 声明折叠
 *   data-items JSON 通道 + 裸 items JSON 属性（字面量数组死环规避，menu 同款）。
 */
import "../../setup";
// 显式引入 overlay 家族插件（x-popover 指令——菜单面板的呈现通道，跨插件依赖镜像）
import "../../../directives/overlay/index";

import { describe, expect, test, afterEach } from "bun:test";
import { AutoSpark } from "autospark";
import { mount, nextTick } from "../../helpers";
import {
  DROPDOWN_NAME,
  DROPDOWN_PANEL_NAME,
  bootstrapDropdownPlugin,
} from "../../../components/navigation/dropdown/index";

/** 取全局表模板（空白归一——oxfmt 折行使逐字匹配假红） */
const tpl = (name: string) =>
  ((AutoSpark as { components: Record<string, string> }).components[name] as string).replace(
    /\s+/g,
    " ",
  );

/** 触发器包裹层（popover 宿主） */
const triggerOf = (root: HTMLElement) =>
  root.querySelector(".asc-dropdown-trigger") as HTMLElement | null;
/** 菜单面板（渲染进 body 覆盖物容器——engine 级副作用，测试须清理） */
const panelOf = () => document.querySelector(".asc-dropdown-panel") as HTMLElement | null;
/** 菜单项集（当前面板内） */
const itemsOf = () =>
  Array.from(document.querySelectorAll(".asc-dropdown-panel .asc-dropdown-item"));

/** 引擎回收（面板挂 body 覆盖物容器——engine destroy 级联清理，防跨用例泄漏） */
const engines: any[] = [];
const mountDd = (html: string, state: any) => {
  const m = mount(html, state, { animate: false });
  engines.push(m.engine);
  return m;
};

afterEach(() => {
  for (const e of engines.splice(0)) e.destroy?.();
});

/** 通用菜单集（状态引用注入——字面量数组有引擎死环缺陷，menu 同款） */
const ACTIONS = [
  { key: "new", label: "新建", icon: "file" },
  { key: "copy", label: "复制" },
  { key: "del", label: "删除", disabled: true },
  { key: "cut", label: "剪切", divided: true },
  { key: "drop", label: "卸载", danger: true },
];

/** 点击触发器开面板（popover click toggle） */
const openByClick = async (root: HTMLElement) => {
  triggerOf(root)!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  await nextTick();
  await nextTick();
};

describe("注册面（ADR-0027）", () => {
  test("模块加载即注册：dropdown / dropdown-panel 双模板均入全局组件表（含 popover 透传声明）", () => {
    const table = (AutoSpark as { components: Record<string, string> }).components;
    expect(typeof table[DROPDOWN_NAME]).toBe("string");
    expect(typeof table[DROPDOWN_PANEL_NAME]).toBe("string");
    expect(tpl(DROPDOWN_NAME)).toContain(`x-define="${DROPDOWN_NAME}"`);
    expect(tpl(DROPDOWN_NAME)).toContain('x-define:inherit="autospark.base"'); // 主题档位继承（ADR-0134）
    expect(tpl(DROPDOWN_NAME)).toContain(`x-popover:${DROPDOWN_PANEL_NAME}`); // 面板消费声明
    // trigger / placement 经成员属性表达式透传（决策 7）
    expect(tpl(DROPDOWN_NAME)).toContain(`x-popover-options.trigger="trigger"`);
    expect(tpl(DROPDOWN_NAME)).toContain(`x-popover-options.at="{ placement: placement }"`);
    expect(tpl(DROPDOWN_PANEL_NAME)).toContain(`x-define="${DROPDOWN_PANEL_NAME}"`);
  });

  test("bootstrap 幂等：重复调用不覆盖（同键赋值幂等）", () => {
    const table = (AutoSpark as { components: Record<string, string> }).components;
    const before = table[DROPDOWN_NAME];
    const beforePanel = table[DROPDOWN_PANEL_NAME];
    bootstrapDropdownPlugin();
    expect(table[DROPDOWN_NAME]).toBe(before);
    expect(table[DROPDOWN_PANEL_NAME]).toBe(beforePanel);
  });

  test("样式通道：三级回退链与暗色兜底变体均在模板中（ADR-0129）", () => {
    const dd = tpl(DROPDOWN_NAME);
    expect(dd).toContain("var(--auto-hover-bgcolor, var(--asc-dropdown-item-hover-bg,");
    expect(dd).toContain(".asc-dropdown-item[data-danger] {");
    expect(dd).toContain(".asc-dropdown-item[data-divided] {");
    expect(dd).toContain("[dark] .asc-dropdown-panel,");
    expect(dd).toContain("[data-dark] .asc-dropdown-item[data-disabled]");
  });
});

describe("触发区（默认插槽包裹交互）", () => {
  test("插槽内容投影进触发器 + tabindex 聚焦位 + aria-haspopup", async () => {
    const { root } = mountDd(
      `<div x-component:autospark.dropdown="{ items: acts }"><button type="button">更多</button></div>`,
      { acts: ACTIONS },
    );
    await nextTick();
    const trigger = triggerOf(root) as HTMLElement;
    expect(trigger).toBeTruthy();
    expect(trigger.getAttribute("aria-haspopup")).toBe("menu");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(trigger.tabIndex).toBe(0); // 键盘可达聚焦位
    const btn = trigger.querySelector("button") as HTMLButtonElement; // 使用者内容投影（出口即触发器本体）
    expect(btn.textContent).toContain("更多");
  });

  test("禁用：根 data-disabled 反射（CSS 拦截通道）+ 退出焦点序 + 拦截声明在场", async () => {
    const { root } = mountDd(
      `<div x-component:autospark.dropdown="{ items: acts, disabled: true }"><button type="button">更多</button></div>`,
      { acts: ACTIONS },
    );
    await nextTick();
    await nextTick();
    const host = root.querySelector(".asc-dropdown") as HTMLElement;
    expect(host.hasAttribute("data-disabled")).toBe(true); // 根反射（CSS 拦截开面板通道）
    expect((triggerOf(root) as HTMLElement).tabIndex).toBe(-1); // 退出焦点序
    const tplStr = tpl(DROPDOWN_NAME);
    expect(tplStr).toContain(".asc-dropdown[data-disabled] .asc-dropdown-trigger {"); // CSS 拦截声明
  });
});

describe("items 渲染（菜单项语义自持）", () => {
  test("渲染：menu/menuitem 语义 + icon 值通道 + disabled/divided/danger 标记", async () => {
    const { root } = mountDd(
      `<div x-component:autospark.dropdown="{ items: acts, trigger: 'click' }"><button type="button">更多</button></div>`,
      { acts: ACTIONS },
    );
    await nextTick();
    await openByClick(root);
    expect(panelOf()).not.toBeNull();
    const menu = panelOf()!.querySelector(".asc-dropdown-menu") as HTMLElement;
    expect(menu.getAttribute("role")).toBe("menu");
    const items = itemsOf();
    expect(items.length).toBe(ACTIONS.length);
    expect(items[0]!.getAttribute("role")).toBe("menuitem");
    expect(items[0]!.querySelector(".asc-dropdown-item-icon")).toBeTruthy(); // icon 值通道
    expect(items[0]!.textContent).toContain("新建");
    expect(items[2]!.hasAttribute("data-disabled")).toBe(true); // 禁用
    expect(items[2]!.getAttribute("aria-disabled")).toBe("true");
    expect(items[3]!.hasAttribute("data-divided")).toBe(true); // 分隔线
    expect(items[4]!.hasAttribute("data-danger")).toBe(true); // 危险色
    expect(items[1]!.hasAttribute("data-divided")).toBe(false);
  });

  test("空态：items 空 → 「暂无数据」（i18n 词典 dropdown.empty 回退）", async () => {
    const { root } = mountDd(
      `<div x-component:autospark.dropdown="{ trigger: 'click' }"><button type="button">更多</button></div>`,
      {},
    );
    await nextTick();
    await openByClick(root);
    const empty = panelOf()?.querySelector(".asc-dropdown-empty") as HTMLElement;
    expect(empty?.textContent?.trim()).toBe("暂无数据");
  });

  test("items 状态引用热更新：面板列表跟随重建", async () => {
    const { root, engine } = mountDd(
      `<div x-component:autospark.dropdown="{ items: acts, trigger: 'click' }"><button type="button">更多</button></div>`,
      { acts: ACTIONS },
    );
    await nextTick();
    await openByClick(root);
    expect(itemsOf().length).toBe(ACTIONS.length);
    engine.store.state.acts = [
      { key: "a", label: "动作一" },
      { key: "b", label: "动作二" },
    ];
    await nextTick();
    await nextTick();
    expect(itemsOf().length).toBe(2);
    expect(itemsOf()[0]!.textContent).toContain("动作一");
  });
});

describe("开合与选中", () => {
  test("click 触发 toggle：点击开 / 再点关 + select detail={key,item} + 选中即关 + 高亮复位", async () => {
    const { root } = mountDd(
      `<div x-component:autospark.dropdown="{ items: acts, trigger: 'click' }"><button type="button">更多</button></div>`,
      { acts: ACTIONS },
    );
    await nextTick();
    const trigger = triggerOf(root) as HTMLElement;
    let detail: any = null;
    let count = 0;
    root.addEventListener("select", (e) => {
      count++;
      detail = (e as CustomEvent).detail;
    });
    await openByClick(root);
    expect(panelOf()).not.toBeNull();
    expect(trigger.getAttribute("aria-expanded")).toBe("true"); // JS 通道随开合同步
    expect(root.querySelector(".asc-dropdown")!.hasAttribute("data-open")).toBe(true);

    (itemsOf().find((o) => o.textContent?.includes("复制")) as HTMLElement).click();
    await nextTick();
    await nextTick();
    expect(count).toBe(1);
    expect(detail.key).toBe("copy"); // 标量投影断言（防重型对象 OOM）
    expect(detail.item.label).toBe("复制"); // item 快照（浅拷贝）
    expect(panelOf()).toBeNull(); // 选中即关面板
    expect(trigger.getAttribute("aria-expanded")).toBe("false");

    // 重开面板：高亮复位（动作菜单无激活态持久语义）
    await openByClick(root);
    expect(itemsOf().some((o) => o.hasAttribute("data-active"))).toBe(false);

    trigger.dispatchEvent(new MouseEvent("click", { bubbles: true })); // 再点关
    await nextTick();
    await nextTick();
    expect(panelOf()).toBeNull();
  });

  test("禁用项不可选（pick guard）+ 点击不关面板", async () => {
    const { root } = mountDd(
      `<div x-component:autospark.dropdown="{ items: acts, trigger: 'click' }"><button type="button">更多</button></div>`,
      { acts: ACTIONS },
    );
    await nextTick();
    let count = 0;
    root.addEventListener("select", () => count++);
    await openByClick(root);
    (itemsOf().find((o) => o.textContent?.includes("删除")) as HTMLElement).click();
    await nextTick();
    await nextTick();
    expect(count).toBe(0); // 未触发
    expect(panelOf()).not.toBeNull(); // 未关面板
  });

  test("hover 触发模型：mouseenter 开 + mouseleave 关（程序化开合按模型分派，决策 7）", async () => {
    const { root } = mountDd(
      `<div x-component:autospark.dropdown="{ items: acts, trigger: 'hover' }"><button type="button">更多</button></div>`,
      { acts: ACTIONS },
    );
    await nextTick();
    const trigger = triggerOf(root) as HTMLElement;
    trigger.dispatchEvent(new MouseEvent("mouseenter"));
    await nextTick();
    await nextTick();
    await new Promise((r) => setTimeout(r, 260)); // delayShow 200ms 悬浮意图延迟
    expect(panelOf()).not.toBeNull();
    trigger.dispatchEvent(new MouseEvent("mouseleave"));
    await new Promise((r) => setTimeout(r, 220)); // delayHide 150ms 宽限
    expect(panelOf()).toBeNull();
  });

  test("hover 模型键盘开面板（合成 mouseenter 通道）+ ESC 关闭（popover 打开栈机制继承）", async () => {
    const { root } = mountDd(
      `<div x-component:autospark.dropdown="{ items: acts, trigger: 'hover' }"><button type="button">更多</button></div>`,
      { acts: ACTIONS },
    );
    await nextTick();
    const trigger = triggerOf(root) as HTMLElement;
    trigger.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    await new Promise((r) => setTimeout(r, 260)); // 合成 mouseenter 含 delayShow
    expect(panelOf()).not.toBeNull();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await nextTick();
    await nextTick();
    expect(panelOf()).toBeNull();
  });

  test("面板外点击关闭（click 模型机制继承）", async () => {
    const { root } = mountDd(
      `<div x-component:autospark.dropdown="{ items: acts, trigger: 'click' }"><button type="button">更多</button></div>`,
      { acts: ACTIONS },
    );
    await nextTick();
    await openByClick(root);
    expect(panelOf()).not.toBeNull();
    document.body.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await nextTick();
    await nextTick();
    expect(panelOf()).toBeNull();
  });
});

describe("键盘导航（WAI-ARIA menu 模式，高亮漫游）", () => {
  const keydown = (el: Element, key: string) =>
    el.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));

  test("ArrowDown 未开先开 → 高亮移动（跳过禁用、首尾环绕）→ Enter 触发 select", async () => {
    const { root } = mountDd(
      `<div x-component:autospark.dropdown="{ items: acts, trigger: 'click' }"><button type="button">更多</button></div>`,
      { acts: ACTIONS },
    );
    await nextTick();
    const trigger = triggerOf(root) as HTMLElement;
    let detail: any = null;
    root.addEventListener("select", (e) => { detail = (e as CustomEvent).detail; });
    keydown(trigger, "ArrowDown"); // 未开先开
    await nextTick();
    await nextTick();
    expect(panelOf()).not.toBeNull();
    const activeOf = () => itemsOf().find((o) => o.hasAttribute("data-active"));
    keydown(trigger, "ArrowDown"); // 无高亮 → 首项
    await nextTick();
    expect(activeOf()?.textContent?.includes("新建")).toBe(true);
    keydown(trigger, "ArrowDown"); // → 复制
    await nextTick();
    expect(activeOf()?.textContent?.includes("复制")).toBe(true);
    keydown(trigger, "ArrowDown"); // → 跳过禁用的删除 → 剪切
    await nextTick();
    expect(activeOf()?.textContent?.includes("剪切")).toBe(true);
    keydown(trigger, "ArrowUp"); // ← 回复制
    await nextTick();
    expect(activeOf()?.textContent?.includes("复制")).toBe(true);
    keydown(trigger, "ArrowUp"); // ← 新建（首项）
    await nextTick();
    expect(activeOf()?.textContent?.includes("新建")).toBe(true);
    keydown(trigger, "ArrowUp"); // ← 首尾环绕到末项（卸载）
    await nextTick();
    expect(activeOf()?.textContent?.includes("卸载")).toBe(true);

    keydown(trigger, "Enter");
    await nextTick();
    await nextTick();
    expect(detail?.key).toBe("drop"); // Enter 触发当前高亮项
    expect(panelOf()).toBeNull();
  });

  test("Enter 开态无高亮：关面板 + 拦截默认（防误触发表单提交）；关态放行", async () => {
    const { root } = mountDd(
      `<div x-component:autospark.dropdown="{ items: acts, trigger: 'click' }"><button type="button">更多</button></div>`,
      { acts: ACTIONS },
    );
    await nextTick();
    const trigger = triggerOf(root) as HTMLElement;
    keydown(trigger, "ArrowDown");
    await nextTick();
    await nextTick();
    expect(panelOf()).not.toBeNull();
    let prevented: boolean | undefined;
    trigger.addEventListener("keydown", (e) => { prevented = e.defaultPrevented; }, { once: true });
    keydown(trigger, "Enter"); // 开态无高亮 → 关面板
    await nextTick();
    await nextTick();
    expect(panelOf()).toBeNull();
    expect(prevented).toBe(true);
  });
});

describe("悬停高亮回传（hoverTick 哨兵）", () => {
  test("面板内悬停菜单项 → data-active 跟随（含禁用项不动）", async () => {
    const { root } = mountDd(
      `<div x-component:autospark.dropdown="{ items: acts, trigger: 'click' }"><button type="button">更多</button></div>`,
      { acts: ACTIONS },
    );
    await nextTick();
    await openByClick(root);
    const items = itemsOf();
    (items[1] as HTMLElement).dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
    await nextTick();
    expect(items[1].hasAttribute("data-active")).toBe(true);
    (items[2] as HTMLElement).dispatchEvent(new MouseEvent("mouseenter", { bubbles: true })); // 禁用项
    await nextTick();
    expect(items[2].hasAttribute("data-active")).toBe(false); // 禁用不落高亮
  });
});

describe("precompile 元素名变换（<x-dropdown>）", () => {
  test("静态属性折叠（trigger/placement 类型推断）+ <x-dropdown-item> 声明折叠 data-items 通道", async () => {
    const { root } = mountDd(
      `<div><x-dropdown trigger="click" placement="top"><button type="button">操作</button>
        <x-dropdown-item key="a" label="动作甲"></x-dropdown-item>
        <x-dropdown-item key="b" label="动作乙" icon="file" disabled divided danger></x-dropdown-item>
      </x-dropdown></div>`,
      {},
    );
    await nextTick();
    await nextTick();
    const host = root.querySelector(".asc-dropdown") as HTMLElement;
    expect(host).toBeTruthy(); // 变换为 span 宿主 + x-component 实例化
    expect(host.hasAttribute("data-items")).toBe(false); // mounted 已解析摘除
    const trigger = triggerOf(root) as HTMLElement;
    expect(trigger).toBeTruthy();
    // trigger: click 生效：点击开面板（声明折叠验证）
    trigger.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await nextTick();
    await nextTick();
    expect(panelOf()).not.toBeNull();
    const items = itemsOf();
    expect(items.length).toBe(2);
    expect(items[0]!.textContent).toContain("动作甲");
    expect(items[1]!.hasAttribute("data-disabled")).toBe(true); // 裸布尔折叠
    expect(items[1]!.hasAttribute("data-divided")).toBe(true);
    expect(items[1]!.hasAttribute("data-danger")).toBe(true);
    expect(items[1]!.querySelector(".asc-dropdown-item-icon")).toBeTruthy(); // icon 折叠
  });

  test("裸 items JSON 属性走 data-items 通道（字面量数组死环规避，menu 同款）", async () => {
    const { root } = mountDd(
      `<div><x-dropdown trigger="click" items='[{"key":"x","label":"静量项"}]'><button type="button">操作</button></x-dropdown></div>`,
      {},
    );
    await nextTick();
    await nextTick();
    await openByClick(root);
    expect(itemsOf().length).toBe(1);
    expect(itemsOf()[0]!.textContent).toContain("静量项");
  });

  test(":items 绑定优先于声明形态（boundItems 在场不落 data-items）", async () => {
    const { root } = mountDd(
      `<div><x-dropdown trigger="click" :items="acts"><button type="button">操作</button>
        <x-dropdown-item key="z" label="声明项"></x-dropdown-item>
      </x-dropdown></div>`,
      { acts: [{ key: "s", label: "状态引用项" }] },
    );
    await nextTick();
    await nextTick();
    await openByClick(root);
    const texts = itemsOf().map((o) => o.textContent);
    expect(texts.some((t) => t?.includes("状态引用项"))).toBe(true); // props 状态引用优先
    expect(texts.some((t) => t?.includes("声明项"))).toBe(false); // 声明形态让位
  });
});
