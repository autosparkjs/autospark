/**
 * select 组件插件测试（组件库 P1 form 批重件，ADR-0022）：
 * - 注册面：select / select-panel 双模板入全局组件表（内嵌 base-field 注册，继承链
 *   select → base-field → autospark.base）+ 组件自有图标注册 + 面板 x-popover 消费声明；
 * - 化身渲染：骨架 class 拼接、触发器 combobox 语义、hidden 表单载体、占位文案
 *   （props 覆盖与 i18n 词典回退「请选择」）；
 * - 值桥（x-model 兼容协议，对齐 ADR-0020）：宿主 el.value 劫持、carrier 跟随、
 *   选中 / 清除路径 input（非冒泡）+ change（冒泡 detail={value}）双派发；
 * - 下拉面板（x-popover 机制呈现，跨插件依赖 autospark.overlay）：点击开合 / 选项渲染 /
 *   面板外点击与 ESC 关闭（机制继承）/ 选中联动；
 * - filterable 本地过滤、键盘导航（上下高亮 / Enter 确认）、clearable、disabled /
 *   readonly、loading、virtual 分支（happy-dom 无布局 → 虚拟化降级全量，断言分支渲染）。
 */
import "../../setup";
// 显式引入 overlay 家族插件（x-popover 指令——select 下拉面板的呈现通道，跨插件依赖镜像）
import "../../../directives/overlay/index";

import { describe, expect, test, afterEach } from "bun:test";
import { AutoSpark } from "autospark";
import { mount, nextTick } from "../../helpers";
import {
  SELECT_NAME,
  SELECT_PANEL_NAME,
  bootstrapSelectPlugin,
} from "../../../components/form/select/index";
import { BASE_FIELD_NAME } from "../../../components/base/base-field/index";

/** 取全局表模板（空白归一——oxfmt 折行使逐字匹配假红） */
const tpl = (name: string) =>
  ((AutoSpark as { components: Record<string, string> }).components[name] as string).replace(
    /\s+/g,
    " ",
  );

/** 取实例化后的宿主（.asc-field 骨架根） */
const field = (root: HTMLElement) => root.querySelector(".asc-field") as HTMLElement;
/** 触发器（popover 宿主 / combobox） */
const triggerOf = (root: HTMLElement) =>
  root.querySelector(".asc-select-trigger") as HTMLElement | null;
/** 下拉面板（渲染进 body 覆盖物容器——engine 级副作用，测试须清理） */
const panelOf = () => document.querySelector(".asc-select-panel") as HTMLElement | null;
/** 选项集（当前面板内） */
const optionsOf = () =>
  Array.from(document.querySelectorAll(".asc-select-panel .asc-select-option"));

/** 引擎回收（面板挂 body 覆盖物容器——engine destroy 级联清理，防跨用例泄漏） */
const engines: any[] = [];
const mountSelect = (html: string, state: any) => {
  const m = mount(html, state, { animate: false });
  engines.push(m.engine);
  return m;
};

afterEach(() => {
  for (const e of engines.splice(0)) e.destroy?.();
});

/** 通用选项集（x-data 状态引用注入——字面量数组有引擎死环缺陷，ADR-0022） */
const CITIES = [
  { label: "北京", value: "bj" },
  { label: "上海", value: "sh" },
  { label: "广州", value: "gz", disabled: true },
  { label: "深圳", value: "sz" },
];

describe("注册面（ADR-0022）", () => {
  test("模块加载即注册：select / select-panel 双模板均入全局组件表（内嵌 base-field）", () => {
    const table = (AutoSpark as { components: Record<string, string> }).components;
    expect(typeof table[SELECT_NAME]).toBe("string");
    expect(typeof table[SELECT_PANEL_NAME]).toBe("string");
    expect(typeof table[BASE_FIELD_NAME]).toBe("string");
    expect(tpl(SELECT_NAME)).toContain(`x-define="${SELECT_NAME}"`);
    expect(tpl(SELECT_NAME)).toContain('x-define:inherit="autospark.base-field"'); // 继承链子端
    expect(tpl(SELECT_NAME)).toContain(`x-popover:${SELECT_PANEL_NAME}`); // 面板消费声明（x-popover 机制复用）
    expect(tpl(SELECT_PANEL_NAME)).toContain(`x-define="${SELECT_PANEL_NAME}"`);
  });

  test("组件自有图标注册：select-down 入全局图标表", () => {
    const icons = (AutoSpark as { icons: Set<string> }).icons;
    expect(icons.has("select-down")).toBe(true);
  });

  test("bootstrap 幂等：重复调用不覆盖（同键赋值幂等）", () => {
    const table = (AutoSpark as { components: Record<string, string> }).components;
    const before = table[SELECT_NAME];
    const beforePanel = table[SELECT_PANEL_NAME];
    bootstrapSelectPlugin();
    expect(table[SELECT_NAME]).toBe(before);
    expect(table[SELECT_PANEL_NAME]).toBe(beforePanel);
  });

  test("样式通道：三级回退链与暗色兜底变体均在模板中（ADR-0129）", () => {
    const select = tpl(SELECT_NAME);
    expect(select).toContain("var(--auto-input-placeholder, var(--asc-select-placeholder,");
    expect(select).toContain(".asc-select-option[data-selected] {");
    expect(select).toContain("[dark] .asc-select-panel,");
    expect(select).toContain("[data-dark] .asc-select-option[data-active]:not([data-selected])");
  });
});

describe("化身渲染与 props 同步", () => {
  test("骨架 class 拼接 + 触发器 combobox 语义 + hidden 表单载体", async () => {
    const { root } = mountSelect(
      `<span x-component:autospark.select="{ options: opts }"></span>`,
      { opts: CITIES },
    );
    await nextTick();
    const host = field(root);
    expect(host.classList.contains("asc-field")).toBe(true); // base-field 骨架类
    expect(host.classList.contains("asc-select")).toBe(true);
    expect(host.classList.contains("asc-field-box")).toBe(true); // 盒饰选配类
    const trigger = triggerOf(root) as HTMLElement;
    expect(trigger.getAttribute("role")).toBe("combobox");
    expect(trigger.getAttribute("aria-haspopup")).toBe("listbox");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(trigger.hasAttribute("data-autospark-control")).toBe(true); // 标记协议挂点（焦点受让者）
    const carrier = root.querySelector(".asc-select-carrier") as HTMLInputElement;
    expect(carrier).toBeTruthy();
    expect(carrier.type).toBe("hidden");
  });

  test("占位文案：props 覆盖优先；缺省回退「请选择」（i18n 词典 select.placeholder）", async () => {
    const a = mountSelect(
      `<span x-component:autospark.select="{ options: opts, placeholder: 'Pick one' }"></span>`,
      { opts: CITIES },
    );
    await nextTick();
    expect((a.root.querySelector(".asc-select-placeholder") as HTMLElement)?.textContent?.trim()).toBe("Pick one");
    a.engine.destroy();
    engines.splice(engines.indexOf(a.engine), 1);

    const b = mountSelect(
      `<span x-component:autospark.select="{ options: opts }"></span>`,
      { opts: CITIES },
    );
    await nextTick();
    expect((b.root.querySelector(".asc-select-placeholder") as HTMLElement)?.textContent?.trim()).toBe("请选择");
  });

  test("初值注入（props.value）：选中文案呈现 + carrier 跟随 + name 透传", async () => {
    const { root } = mountSelect(
      `<span name="city" x-component:autospark.select="{ options: opts, value: 'sh' }"></span>`,
      { opts: CITIES },
    );
    await nextTick();
    expect((root.querySelector(".asc-select-value") as HTMLElement)?.textContent?.trim()).toBe("上海");
    expect(root.querySelector(".asc-select-placeholder")).toBeNull(); // 有值不渲染占位
    const carrier = root.querySelector(".asc-select-carrier") as HTMLInputElement;
    expect(carrier.value).toBe("sh");
    expect(carrier.name).toBe("city"); // 原生直提交载体
  });

  test("禁用态：data-disabled 反射 + 触发器退出焦点序 + 载体出表", async () => {
    const { root } = mountSelect(
      `<span x-component:autospark.select="{ options: opts, disabled: true }"></span>`,
      { opts: CITIES },
    );
    await nextTick();
    const host = field(root);
    expect(host.hasAttribute("data-disabled")).toBe(true); // 骨架通道反射
    expect((triggerOf(root) as HTMLElement).tabIndex).toBe(-1); // 退出焦点序
    expect((root.querySelector(".asc-select-carrier") as HTMLInputElement).disabled).toBe(true); // 出表
  });
});

describe("值桥（x-model 兼容协议，ADR-0022 对齐 ADR-0020）", () => {
  test("x-model 双向：state → DOM（劫持 getter）与选中 → state（input 派发回写）", async () => {
    const { root, engine } = mountSelect(
      `<span x-model="form.city" x-component:autospark.select="{ options: opts }"></span>`,
      { form: { city: "sz" }, opts: CITIES },
    );
    await nextTick();
    const host = field(root);
    expect((host as any).value).toBe("sz"); // 劫持 getter
    expect((root.querySelector(".asc-select-value") as HTMLElement)?.textContent?.trim()).toBe("深圳");

    // 选中路径：开面板 → 点选项 → input 派发 → x-model 回写 state
    (triggerOf(root) as HTMLElement).dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await nextTick();
    await nextTick();
    expect(panelOf()).not.toBeNull();
    const bjOpt = optionsOf().find((o) => o.textContent?.includes("北京")) as HTMLElement;
    bjOpt.click();
    await nextTick();
    expect(engine.store.state.form.city).toBe("bj");
    expect((host as any).value).toBe("bj");
    expect((root.querySelector(".asc-select-value") as HTMLElement)?.textContent?.trim()).toBe("北京");
    expect((root.querySelector(".asc-select-carrier") as HTMLInputElement).value).toBe("bj");
  });

  test("change 事件（detail = { value }）冒泡供外层消费；input 非冒泡（x-model 专用）", async () => {
    const { root } = mountSelect(
      `<span x-component:autospark.select="{ options: opts }"></span>`,
      { opts: CITIES },
    );
    await nextTick();
    const events: string[] = [];
    let detail: any = null;
    root.addEventListener("change", (e: Event) => {
      events.push("change");
      detail = (e as CustomEvent).detail;
    });
    root.addEventListener("input", () => events.push("input"));

    (triggerOf(root) as HTMLElement).dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await nextTick();
    await nextTick();
    (optionsOf().find((o) => o.textContent?.includes("上海")) as HTMLElement).click();
    await nextTick();
    expect(events).toEqual(["change"]); // input 非冒泡（宿主自身，checkbox/switch 同款）
    expect(detail).toEqual({ value: "sh" }); // 标量投影断言（防重型对象 OOM）
  });

  test("state→DOM 单向（value props 无 x-model）：外部状态变化写入呈现", async () => {
    const { root, engine } = mountSelect(
      `<span x-component:autospark.select="{ options: opts, value: form.city }"></span>`,
      { form: { city: "bj" }, opts: CITIES },
    );
    await nextTick();
    engine.store.state.form.city = "sz";
    await nextTick();
    expect((root.querySelector(".asc-select-value") as HTMLElement)?.textContent?.trim()).toBe("深圳");
  });
});

describe("下拉面板（x-popover 机制呈现）", () => {
  test("点击触发器开合（trigger:click toggle）：选项渲染 + 再点关闭", async () => {
    const { root } = mountSelect(
      `<span x-component:autospark.select="{ options: opts }"></span>`,
      { opts: CITIES },
    );
    await nextTick();
    const host = field(root);
    (triggerOf(root) as HTMLElement).dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await nextTick();
    await nextTick();
    const panel = panelOf();
    expect(panel).not.toBeNull();
    expect(optionsOf().length).toBe(CITIES.length);
    expect(host.hasAttribute("data-open")).toBe(true); // 开合态（面板 mounted 沿链写回）
    expect((triggerOf(root) as HTMLElement).getAttribute("aria-expanded")).toBe("true");

    // 选中态基准：:data-selected 绑定（假值移除——无选中项无属性）
    expect((optionsOf().find((o) => o.textContent?.includes("北京")) as HTMLElement).hasAttribute("data-selected")).toBe(false);

    (triggerOf(root) as HTMLElement).dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await nextTick();
    await nextTick();
    expect(panelOf()).toBeNull(); // 关闭即销毁（无 keepalive）
    expect(host.hasAttribute("data-open")).toBe(false);
  });

  test("面板外点击关闭（机制继承）+ 关闭后过滤词复位", async () => {
    const { root } = mountSelect(
      `<span x-component:autospark.select="{ options: opts, filterable: true }"></span>`,
      { opts: CITIES },
    );
    await nextTick();
    (triggerOf(root) as HTMLElement).dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await nextTick();
    await nextTick();
    expect(panelOf()).not.toBeNull();
    document.body.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await nextTick();
    await nextTick();
    expect(panelOf()).toBeNull();
  });

  test("ESC 关闭（popover 打开栈机制继承）", async () => {
    const { root } = mountSelect(
      `<span x-component:autospark.select="{ options: opts }"></span>`,
      { opts: CITIES },
    );
    await nextTick();
    (triggerOf(root) as HTMLElement).dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await nextTick();
    await nextTick();
    expect(panelOf()).not.toBeNull();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await nextTick();
    await nextTick();
    expect(panelOf()).toBeNull();
  });

  test("选中联动：选项点击 → 值 / 文案 / carrier / 面板关闭 + 焦点回触发器", async () => {
    const { root } = mountSelect(
      `<span x-component:autospark.select="{ options: opts }"></span>`,
      { opts: CITIES },
    );
    await nextTick();
    const trigger = triggerOf(root) as HTMLElement;
    trigger.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await nextTick();
    await nextTick();
    const szOpt = optionsOf().find((o) => o.textContent?.includes("深圳")) as HTMLElement;
    expect(szOpt.hasAttribute("data-selected")).toBe(false);
    szOpt.click();
    await nextTick();
    await nextTick();
    expect(panelOf()).toBeNull(); // 选中即关面板
    expect((root.querySelector(".asc-select-value") as HTMLElement)?.textContent?.trim()).toBe("深圳");
    expect((root.querySelector(".asc-select-carrier") as HTMLInputElement).value).toBe("sz");
    // 重开面板：选中项 data-selected 命中 + check 图标渲染
    trigger.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await nextTick();
    await nextTick();
    const now = optionsOf().find((o) => o.textContent?.includes("深圳")) as HTMLElement;
    expect(now.hasAttribute("data-selected")).toBe(true);
    expect(now.querySelector(".asc-select-option-check")).toBeTruthy();
  });

  test("禁用选项不可选（pick guard）+ data-disabled 淡化标记", async () => {
    const { root } = mountSelect(
      `<span x-component:autospark.select="{ options: opts }"></span>`,
      { opts: CITIES },
    );
    await nextTick();
    (triggerOf(root) as HTMLElement).dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await nextTick();
    await nextTick();
    const gzOpt = optionsOf().find((o) => o.textContent?.includes("广州")) as HTMLElement;
    expect(gzOpt.hasAttribute("data-disabled")).toBe(true);
    gzOpt.click();
    await nextTick();
    expect(panelOf()).not.toBeNull(); // 未关面板 = 未选中
    expect(field(root).querySelector(".asc-select-value")).toBeNull();
  });

  test("同值再选：仅关面板不派发变更", async () => {
    const { root } = mountSelect(
      `<span x-component:autospark.select="{ options: opts, value: 'bj' }"></span>`,
      { opts: CITIES },
    );
    await nextTick();
    let changeCount = 0;
    root.addEventListener("change", () => changeCount++);
    (triggerOf(root) as HTMLElement).dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await nextTick();
    await nextTick();
    (optionsOf().find((o) => o.textContent?.includes("北京")) as HTMLElement).click();
    await nextTick();
    await nextTick();
    expect(panelOf()).toBeNull();
    expect(changeCount).toBe(0);
  });

  test("只读态：面板可开浏览但选中被阻断", async () => {
    const { root } = mountSelect(
      `<span x-component:autospark.select="{ options: opts, value: 'bj', readonly: true }"></span>`,
      { opts: CITIES },
    );
    await nextTick();
    expect(field(root).hasAttribute("data-readonly")).toBe(true); // 骨架通道反射
    (triggerOf(root) as HTMLElement).dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await nextTick();
    await nextTick();
    expect(panelOf()).not.toBeNull(); // 只读可浏览
    (optionsOf().find((o) => o.textContent?.includes("上海")) as HTMLElement).click();
    await nextTick();
    expect(panelOf()).not.toBeNull(); // 选中被 pick guard 阻断（面板不关）
    expect((root.querySelector(".asc-select-value") as HTMLElement)?.textContent?.trim()).toBe("北京");
  });

  test("options 状态引用热更新：面板列表跟随重建", async () => {
    const { root, engine } = mountSelect(
      `<span x-component:autospark.select="{ options: opts }"></span>`,
      { opts: CITIES },
    );
    await nextTick();
    (triggerOf(root) as HTMLElement).dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await nextTick();
    await nextTick();
    expect(optionsOf().length).toBe(CITIES.length);
    engine.store.state.opts = [
      { label: "杭州", value: "hz" },
      { label: "成都", value: "cd" },
    ];
    await nextTick();
    await nextTick();
    expect(optionsOf().length).toBe(2);
    expect(optionsOf().some((o) => o.textContent?.includes("杭州"))).toBe(true);
  });
});

describe("filterable 本地过滤（P1 简实现）", () => {
  test("过滤框输入 → filteredOptions 过滤 + 无匹配空态回退「暂无数据」", async () => {
    const { root } = mountSelect(
      `<span x-component:autospark.select="{ options: opts, filterable: true }"></span>`,
      { opts: CITIES },
    );
    await nextTick();
    (triggerOf(root) as HTMLElement).dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await nextTick();
    await nextTick();
    const input = panelOf()?.querySelector(".asc-select-filter-input") as HTMLInputElement;
    expect(input).toBeTruthy();
    input.value = "北京";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await nextTick();
    await nextTick();
    expect(optionsOf().length).toBe(1);
    expect(optionsOf()[0]!.textContent?.includes("北京")).toBe(true);

    input.value = "不存在的城市";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await nextTick();
    await nextTick();
    expect(optionsOf().length).toBe(0);
    const empty = panelOf()?.querySelector(".asc-select-empty") as HTMLElement;
    expect(empty?.textContent?.trim()).toBe("暂无数据");
  });

  test("过滤词在面板关闭后复位（重开列表全量）", async () => {
    const { root } = mountSelect(
      `<span x-component:autospark.select="{ options: opts, filterable: true }"></span>`,
      { opts: CITIES },
    );
    await nextTick();
    const trigger = triggerOf(root) as HTMLElement;
    trigger.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await nextTick();
    await nextTick();
    const input = panelOf()?.querySelector(".asc-select-filter-input") as HTMLInputElement;
    input.value = "广州";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await nextTick();
    await nextTick();
    expect(optionsOf().length).toBe(1);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await nextTick();
    await nextTick();
    trigger.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await nextTick();
    await nextTick();
    expect(optionsOf().length).toBe(CITIES.length); // 复位
  });
});

describe("键盘导航（触发器焦点）", () => {
  const keydown = (el: Element, key: string) =>
    el.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));

  test("ArrowDown 未开先开 → 高亮移动（跳过禁用项）→ Enter 确认选中并关面板", async () => {
    const { root } = mountSelect(
      `<span x-component:autospark.select="{ options: opts, value: 'bj' }"></span>`,
      { opts: CITIES },
    );
    await nextTick();
    const trigger = triggerOf(root) as HTMLElement;
    // 打开时高亮落当前选中项（北京 = index 0）
    keydown(trigger, "ArrowDown");
    await nextTick();
    await nextTick();
    expect(panelOf()).not.toBeNull(); // 未开先开（程序化 click toggle）
    const activeOf = () => optionsOf().find((o) => o.hasAttribute("data-active"));
    expect(activeOf()?.textContent?.includes("北京")).toBe(true);

    keydown(trigger, "ArrowDown"); // → 上海（index 1）
    await nextTick();
    expect(activeOf()?.textContent?.includes("上海")).toBe(true);
    keydown(trigger, "ArrowDown"); // → 跳过禁用的广州 → 深圳（index 3）
    await nextTick();
    expect(activeOf()?.textContent?.includes("深圳")).toBe(true);
    keydown(trigger, "ArrowDown"); // → 环绕回北京
    await nextTick();
    expect(activeOf()?.textContent?.includes("北京")).toBe(true);

    keydown(trigger, "Enter");
    await nextTick();
    await nextTick();
    expect(panelOf()).toBeNull();
    expect((root.querySelector(".asc-select-value") as HTMLElement)?.textContent?.trim()).toBe("北京");
  });

  test("Enter 未开先开（不误选）", async () => {
    const { root } = mountSelect(
      `<span x-component:autospark.select="{ options: opts }"></span>`,
      { opts: CITIES },
    );
    await nextTick();
    const trigger = triggerOf(root) as HTMLElement;
    keydown(trigger, "Enter");
    await nextTick();
    await nextTick();
    expect(panelOf()).not.toBeNull();
    expect(field(root).querySelector(".asc-select-value")).toBeNull(); // 未选中
  });

  test("过滤框内键盘经哨兵键走同一导航 + Enter 确认", async () => {
    const { root } = mountSelect(
      `<span x-component:autospark.select="{ options: opts, filterable: true }"></span>`,
      { opts: CITIES },
    );
    await nextTick();
    (triggerOf(root) as HTMLElement).dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await nextTick();
    await nextTick();
    const input = panelOf()?.querySelector(".asc-select-filter-input") as HTMLInputElement;
    // 打开无选中 → activeIndex -1 → ArrowDown 从 -1 起步环找到首个非禁用项（北京）
    keydown(input, "ArrowDown");
    await nextTick();
    expect(optionsOf().find((o) => o.hasAttribute("data-active"))?.textContent?.includes("北京")).toBe(true);
    keydown(input, "ArrowDown");
    await nextTick();
    expect(optionsOf().find((o) => o.hasAttribute("data-active"))?.textContent?.includes("上海")).toBe(true);
    keydown(input, "Enter");
    await nextTick();
    await nextTick();
    expect(panelOf()).toBeNull();
    expect((root.querySelector(".asc-select-value") as HTMLElement)?.textContent?.trim()).toBe("上海");
  });
});

describe("clearable / loading / virtual", () => {
  test("clearable：清除钮非空显形 → 点击清空 + 双派发 + 焦点回触发器", async () => {
    const { root } = mountSelect(
      `<span x-component:autospark.select="{ options: opts, value: 'bj', clearable: true }"></span>`,
      { opts: CITIES },
    );
    await nextTick();
    const clear = root.querySelector(".asc-select-clear") as HTMLElement;
    expect(clear).toBeTruthy();
    const events: string[] = [];
    let detail: any = null;
    root.addEventListener("change", (e: Event) => {
      events.push("change");
      detail = (e as CustomEvent).detail;
    });
    clear.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await nextTick();
    expect((root.querySelector(".asc-select-value") as HTMLElement | null)).toBeNull(); // 清空 → 占位回归
    expect((root.querySelector(".asc-select-carrier") as HTMLInputElement).value).toBe("");
    expect(events).toEqual(["change"]);
    expect(detail).toEqual({ value: null });
    expect(root.querySelector(".asc-select-clear")).toBeNull(); // 无值隐藏
    expect(panelOf()).toBeNull(); // stopPropagation 防误开面板
  });

  test("loading：触发器 data-loading 标记 + 面板列表 x-loading 遮罩通道", async () => {
    const { root, engine } = mountSelect(
      `<span x-component:autospark.select="{ options: opts, loading: loading }"></span>`,
      { opts: CITIES, loading: false },
    );
    await nextTick();
    const host = field(root);
    expect(host.hasAttribute("data-loading")).toBe(false);
    engine.store.state.loading = true;
    await nextTick();
    expect(host.hasAttribute("data-loading")).toBe(true); // JS 通道同步（箭头旋转图标切换的 CSS 钩子）
  });

  test("virtual 分支：x-for.virtual 列表渲染（happy-dom 无布局 → 降级全量，分支可渲染即证）", async () => {
    const { root } = mountSelect(
      `<span x-component:autospark.select="{ options: opts, virtual: true }"></span>`,
      { opts: CITIES },
    );
    await nextTick();
    (triggerOf(root) as HTMLElement).dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await nextTick();
    await nextTick();
    expect(panelOf()).not.toBeNull();
    expect(optionsOf().length).toBe(CITIES.length); // 降级全量渲染（真虚拟化走浏览器 e2e）
    (optionsOf().find((o) => o.textContent?.includes("上海")) as HTMLElement).click();
    await nextTick();
    expect((root.querySelector(".asc-select-value") as HTMLElement)?.textContent?.trim()).toBe("上海");
  });
});
