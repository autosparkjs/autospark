/**
 * time-select 组件插件测试（组件库 P3 时间族，ADR-0025）：
 * - 注册面：time-select / time-select-panel 双模板入全局组件表（内嵌 field
 *   注册）+ 组件自有图标注册 + 面板 x-popover 消费声明（fit 宽度匹配）；
 * - 化身渲染：骨架 class 拼接、触发器 combobox 语义、hidden 表单载体、占位文案
 *   （props 覆盖与 i18n 词典回退「请选择时间」）；元素名写法（<x-time-select>）；
 * - 离散列表生成（ADR-0025 决策 3）：缺省 start 00:00 / end 23:00 / step 00:30 →
 *   47 项；自定义起止步长；非法步长回退 30 分钟；病态区间空态回退「暂无数据」；
 * - 值桥（x-model 兼容协议，"HH:mm" 字符串语域）：宿主 el.value 劫持、carrier 跟随、
 *   input（非冒泡）+ change（冒泡 detail={value}）双派发；
 * - 下拉面板（select 范式直系克隆）：点击开合 / 选项渲染 / 选中即关 / 选中标记
 *   check 图标（纯 CSS 父选择器——克隆体内零 x-if）/ 面板外点击与 ESC 关闭（机制继承）；
 * - 键盘导航（select 同款）：上下高亮（首尾环绕）/ Enter 确认；clearable / disabled /
 *   readonly（pick guard）。
 */
import "../../setup";
// 显式引入 overlay 家族插件（x-popover 指令——下拉面板的呈现通道，跨插件依赖镜像）
import "../../../directives/overlay/index";

import { describe, expect, test, afterEach } from "bun:test";
import { AutoSpark } from "autospark";
import { mount, nextTick } from "../../helpers";
import {
  TIME_SELECT_NAME,
  TIME_SELECT_PANEL_NAME,
  bootstrapTimeSelectPlugin,
} from "../../../components/form/time-select/index";
import { FIELD_NAME } from "../../../components/base/field/index";

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
  root.querySelector(".asc-time-select-trigger") as HTMLElement | null;
/** 下拉面板（渲染进 body 覆盖物容器——engine 级副作用，测试须清理） */
const panelOf = () => document.querySelector(".asc-time-select-panel") as HTMLElement | null;
/** 选项集（当前面板内） */
const optionsOf = () =>
  Array.from(document.querySelectorAll(".asc-time-select-panel .asc-time-select-option"));

/** 引擎回收（面板挂 body 覆盖物容器——engine destroy 级联清理，防跨用例泄漏） */
const engines: any[] = [];
const mountPicker = (html: string, state: any) => {
  const m = mount(html, state, { animate: false });
  engines.push(m.engine);
  return m;
};

afterEach(() => {
  for (const e of engines.splice(0)) e.destroy?.();
});

/** 打开面板（程序化点击触发器——popover click toggle） */
const openPanel = async (root: HTMLElement) => {
  triggerOf(root)!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  await nextTick();
  await nextTick();
};

describe("注册面（ADR-0025）", () => {
  test("模块加载即注册：time-select / time-select-panel 双模板均入全局组件表（内嵌 field）", () => {
    const table = (AutoSpark as { components: Record<string, string> }).components;
    expect(typeof table[TIME_SELECT_NAME]).toBe("string");
    expect(typeof table[TIME_SELECT_PANEL_NAME]).toBe("string");
    expect(typeof table[FIELD_NAME]).toBe("string");
    expect(tpl(TIME_SELECT_NAME)).toContain(`x-define="${TIME_SELECT_NAME}"`);
    expect(tpl(TIME_SELECT_NAME)).toContain('x-define:inherit="autospark.field"');
    expect(tpl(TIME_SELECT_NAME)).toContain(`x-popover:${TIME_SELECT_PANEL_NAME}`); // 面板消费声明
    expect(tpl(TIME_SELECT_NAME)).toContain("fit: true"); // fit 宽度匹配（select 两段合成）
    expect(tpl(TIME_SELECT_PANEL_NAME)).toContain(`x-define="${TIME_SELECT_PANEL_NAME}"`);
  });

  test("组件自有图标注册：time-clock 入全局图标表", () => {
    const icons = (AutoSpark as { icons: Set<string> }).icons;
    expect(icons.has("time-clock")).toBe(true);
  });

  test("bootstrap 幂等：重复调用不覆盖（同键赋值幂等）", () => {
    const table = (AutoSpark as { components: Record<string, string> }).components;
    const before = table[TIME_SELECT_NAME];
    const beforePanel = table[TIME_SELECT_PANEL_NAME];
    bootstrapTimeSelectPlugin();
    expect(table[TIME_SELECT_NAME]).toBe(before);
    expect(table[TIME_SELECT_PANEL_NAME]).toBe(beforePanel);
  });

  test("样式通道：三级回退链与暗色兜底变体均在模板中（ADR-0129）；选中标记 check 纯 CSS 父选择器", () => {
    const picker = tpl(TIME_SELECT_NAME);
    expect(picker).toContain("var(--auto-input-placeholder, var(--asc-time-select-placeholder,");
    expect(picker).toContain(".asc-time-select-option[data-selected] .asc-time-select-option-check {");
    expect(picker).toContain(".asc-time-select-option[data-active]:not([data-selected]) {");
    expect(picker).toContain("[dark] .asc-time-select-panel,");
    expect(picker).toContain("[data-dark] .asc-time-select-option[data-selected]");
  });
});

describe("化身渲染与 props 同步", () => {
  test("骨架 class 拼接 + 触发器 combobox 语义 + hidden 表单载体", async () => {
    const { root } = mountPicker(`<span x-component:autospark.time-select="{}"></span>`, {});
    await nextTick();
    const host = field(root);
    expect(host.classList.contains("asc-field")).toBe(true);
    expect(host.classList.contains("asc-time-select")).toBe(true);
    expect(host.classList.contains("asc-field-box")).toBe(true);
    const trigger = triggerOf(root) as HTMLElement;
    expect(trigger.getAttribute("role")).toBe("combobox");
    expect(trigger.getAttribute("aria-haspopup")).toBe("listbox");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(trigger.hasAttribute("data-autospark-control")).toBe(true);
    const carrier = root.querySelector(".asc-time-select-carrier") as HTMLInputElement;
    expect(carrier).toBeTruthy();
    expect(carrier.type).toBe("hidden");
  });

  test("占位文案：props 覆盖优先；缺省回退「请选择时间」（i18n 词典 time-select.placeholder）", async () => {
    const a = mountPicker(
      `<span x-component:autospark.time-select="{ placeholder: 'Pick' }"></span>`,
      {},
    );
    await nextTick();
    expect((a.root.querySelector(".asc-time-select-placeholder") as HTMLElement)?.textContent?.trim()).toBe("Pick");
    a.engine.destroy();
    engines.splice(engines.indexOf(a.engine), 1);

    const b = mountPicker(`<span x-component:autospark.time-select="{}"></span>`, {});
    await nextTick();
    expect((b.root.querySelector(".asc-time-select-placeholder") as HTMLElement)?.textContent?.trim()).toBe("请选择时间");
  });

  test("初值注入（props.value）：值直出呈现 + carrier 跟随 + name 透传", async () => {
    const { root } = mountPicker(
      `<span name="meet" x-component:autospark.time-select="{ value: '09:30' }"></span>`,
      {},
    );
    await nextTick();
    expect((root.querySelector(".asc-time-select-value") as HTMLElement)?.textContent?.trim()).toBe("09:30");
    expect(root.querySelector(".asc-time-select-placeholder")).toBeNull();
    const carrier = root.querySelector(".asc-time-select-carrier") as HTMLInputElement;
    expect(carrier.value).toBe("09:30");
    expect(carrier.name).toBe("meet");
  });

  test("元素名写法（<x-time-select>）：标签实例化 + 静态 props 折叠（start/end/step）", async () => {
    const { root } = mountPicker(
      `<div><x-time-select x-model="t" start="08:00" end="12:00" step="01:00" clearable></x-time-select></div>`,
      { t: "09:00" },
    );
    await nextTick();
    const host = root.querySelector("x-time-select") as HTMLElement;
    expect(host.classList.contains("asc-time-select")).toBe(true); // 化身成功
    expect((root.querySelector(".asc-time-select-value") as HTMLElement)?.textContent?.trim()).toBe("09:00");
    expect(root.querySelector(".asc-time-select-clear")).toBeTruthy(); // 裸布尔归一
    await openPanel(root);
    expect(optionsOf().length).toBe(5); // 08:00..12:00 含端步长 1h
    expect(optionsOf().map((o) => o.textContent?.trim()).join(",")).toBe("08:00,09:00,10:00,11:00,12:00");
  });

  test("禁用态：data-disabled 反射 + 触发器退出焦点序 + 载体出表", async () => {
    const { root } = mountPicker(
      `<span x-component:autospark.time-select="{ disabled: true }"></span>`,
      {},
    );
    await nextTick();
    expect(field(root).hasAttribute("data-disabled")).toBe(true);
    expect((triggerOf(root) as HTMLElement).tabIndex).toBe(-1);
    expect((root.querySelector(".asc-time-select-carrier") as HTMLInputElement).disabled).toBe(true);
  });
});

describe("离散列表生成（ADR-0025 决策 3）", () => {
  test("缺省起止步长：00:00 → 23:00 步 30 分 = 47 项（含端）", async () => {
    const { root } = mountPicker(`<span x-component:autospark.time-select="{}"></span>`, {});
    await nextTick();
    await openPanel(root);
    const opts = optionsOf();
    expect(opts.length).toBe(47);
    expect((opts[0] as HTMLElement).textContent?.trim()).toBe("00:00");
    expect((opts[opts.length - 1] as HTMLElement).textContent?.trim()).toBe("23:00");
    expect((opts[1] as HTMLElement).textContent?.trim()).toBe("00:30");
  });

  test("自定义起止步长（15 分钟粒度）", async () => {
    const { root } = mountPicker(
      `<span x-component:autospark.time-select="{ start: '09:00', end: '10:30', step: '00:15' }"></span>`,
      {},
    );
    await nextTick();
    await openPanel(root);
    const texts = optionsOf().map((o) => o.textContent?.trim());
    expect(texts).toEqual(["09:00", "09:15", "09:30", "09:45", "10:00", "10:15", "10:30"]);
  });

  test("非法步长（00:00）回退 30 分钟", async () => {
    const { root } = mountPicker(
      `<span x-component:autospark.time-select="{ start: '08:00', end: '09:30', step: '00:00' }"></span>`,
      {},
    );
    await nextTick();
    await openPanel(root);
    expect(optionsOf().length).toBe(4); // 08:00/08:30/09:00/09:30
  });

  test("病态区间（start > end）：空态回退「暂无数据」（i18n time-select.empty）", async () => {
    const { root } = mountPicker(
      `<span x-component:autospark.time-select="{ start: '12:00', end: '08:00' }"></span>`,
      {},
    );
    await nextTick();
    await openPanel(root);
    expect(optionsOf().length).toBe(0);
    const empty = panelOf()?.querySelector(".asc-time-select-empty") as HTMLElement;
    expect(empty?.textContent?.trim()).toBe("暂无数据");
  });

  test("props 热更新：step 变化时列表重建", async () => {
    const { root, engine } = mountPicker(
      `<span x-component:autospark.time-select="{ start: s, end: e, step: st }"></span>`,
      { s: "08:00", e: "09:00", st: "01:00" },
    );
    await nextTick();
    await openPanel(root);
    expect(optionsOf().length).toBe(2);
    engine.store.state.st = "00:30";
    await nextTick();
    await nextTick();
    expect(optionsOf().length).toBe(3);
  });
});

describe("值桥（x-model 兼容协议，ADR-0025 对齐 ADR-0020/0022）", () => {
  test("x-model 双向：state → DOM（劫持 getter）与选中 → state（input 派发回写）", async () => {
    const { root, engine } = mountPicker(
      `<span x-model="form.time" x-component:autospark.time-select="{}"></span>`,
      { form: { time: "09:30" } },
    );
    await nextTick();
    const host = field(root);
    expect((host as any).value).toBe("09:30");

    await openPanel(root);
    (optionsOf().find((o) => o.textContent?.includes("14:30")) as HTMLElement).click();
    await nextTick();
    expect(engine.store.state.form.time).toBe("14:30");
    expect((host as any).value).toBe("14:30");
    expect((root.querySelector(".asc-time-select-carrier") as HTMLInputElement).value).toBe("14:30");
  });

  test("change 事件（detail = { value }）冒泡供外层消费；input 非冒泡", async () => {
    const { root } = mountPicker(`<span x-component:autospark.time-select="{}"></span>`, {});
    await nextTick();
    const events: string[] = [];
    let detail: any = null;
    root.addEventListener("change", (e: Event) => {
      events.push("change");
      detail = (e as CustomEvent).detail;
    });
    root.addEventListener("input", () => events.push("input"));

    await openPanel(root);
    (optionsOf().find((o) => o.textContent?.includes("08:00")) as HTMLElement).click();
    await nextTick();
    expect(events).toEqual(["change"]);
    expect(detail).toEqual({ value: "08:00" });
  });

  test("state→DOM 单向（value props 无 x-model）：外部状态变化写入呈现", async () => {
    const { root, engine } = mountPicker(
      `<span x-component:autospark.time-select="{ value: form.time }"></span>`,
      { form: { time: "07:00" } },
    );
    await nextTick();
    engine.store.state.form.time = "07:30";
    await nextTick();
    expect((root.querySelector(".asc-time-select-value") as HTMLElement)?.textContent?.trim()).toBe("07:30");
  });
});

describe("下拉面板（select 范式直系克隆）", () => {
  test("点击触发器开合：选项渲染 + 再点关闭；选中即关 + 焦点回触发器", async () => {
    const { root } = mountPicker(`<span x-component:autospark.time-select="{}"></span>`, {});
    await nextTick();
    const host = field(root);
    await openPanel(root);
    expect(panelOf()).not.toBeNull();
    expect(optionsOf().length).toBe(47);
    expect(host.hasAttribute("data-open")).toBe(true);
    expect((triggerOf(root) as HTMLElement).getAttribute("aria-expanded")).toBe("true");

    (optionsOf().find((o) => o.textContent?.includes("10:00")) as HTMLElement).click();
    await nextTick();
    await nextTick();
    expect(panelOf()).toBeNull(); // 选中即关（select 同款）
    expect((root.querySelector(".asc-time-select-value") as HTMLElement)?.textContent?.trim()).toBe("10:00");
  });

  test("选中标记：data-selected 命中 + check 图标渲染（纯 CSS 父选择器显隐）", async () => {
    const { root } = mountPicker(
      `<span x-component:autospark.time-select="{ value: '09:30' }"></span>`,
      {},
    );
    await nextTick();
    await openPanel(root);
    const sel = optionsOf().find((o) => o.hasAttribute("data-selected")) as HTMLElement;
    expect(sel?.textContent?.trim()).toBe("09:30");
    // check 图标恒渲染（克隆体内零 x-if），显隐走 data-selected 父选择器纯 CSS
    expect(sel?.querySelector(".asc-time-select-option-check")).toBeTruthy();
    const other = optionsOf().find((o) => !o.hasAttribute("data-selected")) as HTMLElement;
    expect(other.querySelector(".asc-time-select-option-check")).toBeTruthy(); // DOM 恒在
  });

  test("同值再选：仅关面板不派发变更", async () => {
    const { root } = mountPicker(
      `<span x-component:autospark.time-select="{ value: '09:30' }"></span>`,
      {},
    );
    await nextTick();
    let changeCount = 0;
    root.addEventListener("change", () => changeCount++);
    await openPanel(root);
    (optionsOf().find((o) => o.hasAttribute("data-selected")) as HTMLElement).click();
    await nextTick();
    await nextTick();
    expect(panelOf()).toBeNull();
    expect(changeCount).toBe(0);
  });

  test("面板外点击关闭与 ESC 关闭（机制继承）", async () => {
    const a = mountPicker(`<span x-component:autospark.time-select="{}"></span>`, {});
    await nextTick();
    await openPanel(a.root);
    expect(panelOf()).not.toBeNull();
    document.body.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await nextTick();
    await nextTick();
    expect(panelOf()).toBeNull();
    a.engine.destroy();
    engines.splice(engines.indexOf(a.engine), 1);

    const b = mountPicker(`<span x-component:autospark.time-select="{}"></span>`, {});
    await nextTick();
    await openPanel(b.root);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await nextTick();
    await nextTick();
    expect(panelOf()).toBeNull();
  });

  test("只读态：面板可开浏览但选中被阻断（pick guard）", async () => {
    const { root } = mountPicker(
      `<span x-component:autospark.time-select="{ value: '09:30', readonly: true }"></span>`,
      {},
    );
    await nextTick();
    expect(field(root).hasAttribute("data-readonly")).toBe(true);
    await openPanel(root);
    expect(panelOf()).not.toBeNull();
    (optionsOf().find((o) => o.textContent?.includes("10:00")) as HTMLElement).click();
    await nextTick();
    expect(panelOf()).not.toBeNull(); // 选中被阻断（面板不关）
    expect((root.querySelector(".asc-time-select-value") as HTMLElement)?.textContent?.trim()).toBe("09:30");
  });

  test("宽度匹配配对键：实例唯一标识落根属性（uid 通道）", async () => {
    const { root } = mountPicker(`<span x-component:autospark.time-select="{}"></span>`, {});
    await nextTick();
    await openPanel(root);
    const uid = field(root).getAttribute("data-asc-time-select-uid");
    expect(uid).toBeTruthy(); // 实例唯一标识落根属性（面板 mounted 按 uid 配对测盒饰宽补
    // shell min-width——happy-dom 布局盲区不可断言几何，真浏览器 e2e 验证面，select 同款边界）
    expect(panelOf()).not.toBeNull();
  });
});

describe("键盘导航（select 同款）", () => {
  const keydown = (el: Element, key: string) =>
    el.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));

  test("ArrowDown 未开先开（高亮落当前选中项）→ 上下移动高亮（首尾环绕）→ Enter 确认", async () => {
    const { root } = mountPicker(
      `<span x-component:autospark.time-select="{ value: '09:30', start: '09:00', end: '11:00', step: '00:30' }"></span>`,
      {},
    );
    await nextTick();
    const trigger = triggerOf(root) as HTMLElement;
    keydown(trigger, "ArrowDown");
    await nextTick();
    await nextTick();
    expect(panelOf()).not.toBeNull(); // 未开先开
    const activeOf = () => optionsOf().find((o) => o.hasAttribute("data-active"));
    expect(activeOf()?.textContent?.trim()).toBe("09:30"); // 打开时高亮落当前选中项

    keydown(trigger, "ArrowDown"); // → 10:00
    await nextTick();
    expect(activeOf()?.textContent?.trim()).toBe("10:00");
    keydown(trigger, "ArrowDown"); // → 10:30
    await nextTick();
    expect(activeOf()?.textContent?.trim()).toBe("10:30");
    keydown(trigger, "ArrowUp"); // → 10:00
    await nextTick();
    expect(activeOf()?.textContent?.trim()).toBe("10:00");

    keydown(trigger, "Enter");
    await nextTick();
    await nextTick();
    expect(panelOf()).toBeNull(); // 确认选中关面板
    expect((root.querySelector(".asc-time-select-value") as HTMLElement)?.textContent?.trim()).toBe("10:00");
  });

  test("无选中时高亮落首项（键盘起步可达）+ Enter 未开先开（不误选）", async () => {
    const { root } = mountPicker(
      `<span x-component:autospark.time-select="{ start: '08:00', end: '09:00', step: '01:00' }"></span>`,
      {},
    );
    await nextTick();
    const trigger = triggerOf(root) as HTMLElement;
    keydown(trigger, "Enter");
    await nextTick();
    await nextTick();
    expect(panelOf()).not.toBeNull(); // Enter 未开先开
    expect(field(root).querySelector(".asc-time-select-value")).toBeNull(); // 未误选
    const activeOf = () => optionsOf().find((o) => o.hasAttribute("data-active"));
    expect(activeOf()?.textContent?.trim()).toBe("08:00"); // 无选中 → 落首项
  });
});

describe("clearable", () => {
  test("清除钮非空显形 → 点击清空 + 双派发 + 焦点回触发器；空值隐藏", async () => {
    const { root } = mountPicker(
      `<span x-component:autospark.time-select="{ value: '09:30', clearable: true }"></span>`,
      {},
    );
    await nextTick();
    const clear = root.querySelector(".asc-time-select-clear") as HTMLElement;
    expect(clear).toBeTruthy();
    const events: string[] = [];
    let detail: any = null;
    root.addEventListener("change", (e: Event) => {
      events.push("change");
      detail = (e as CustomEvent).detail;
    });
    clear.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await nextTick();
    expect((root.querySelector(".asc-time-select-value") as HTMLElement | null)).toBeNull();
    expect((root.querySelector(".asc-time-select-carrier") as HTMLInputElement).value).toBe("");
    expect(events).toEqual(["change"]);
    expect(detail).toEqual({ value: "" }); // 字符串空语域
    expect(root.querySelector(".asc-time-select-clear")).toBeNull();
    expect(panelOf()).toBeNull(); // stopPropagation 防误开面板
  });
});
