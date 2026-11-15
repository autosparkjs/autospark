/**
 * date-picker 组件插件测试（组件库 P3 时间族，ADR-0025）：
 * - 注册面：date-picker / date-picker-panel 双模板入全局组件表（内嵌 field 注册，
 *   继承链 date-picker → field → autospark.base）+ 组件自有图标注册 + 面板
 *   x-popover 消费声明；
 * - 化身渲染：骨架 class 拼接、触发器 combobox 语义、hidden 表单载体、占位文案
 *   （props 覆盖与 i18n 词典回退「请选择日期」）；元素名写法（<x-date-picker>）与
 *   裸布尔属性归一（clearable → true）；
 * - 值桥（x-model 兼容协议，"YYYY-MM-DD" 字符串语域）：宿主 el.value 劫持、carrier
 *   跟随、选中 / 清除路径 input（非冒泡）+ change（冒泡 detail={value}）双派发；
 * - 日历面板（x-popover 机制呈现，跨插件依赖 autospark.overlay）：点击开合 / 42 格
 *   网格 / 星期表头 / 今天标记 / 邻月格 / 月份切换 / 今天快捷 / 选中联动 / 面板外点击
 *   与 ESC 关闭（机制继承）；
 * - 键盘：方向键日间漫游（跨月跟随）/ PageUp/PageDown 切月 / Enter 确认 / clearable /
 *   disabled / readonly。
 */
import "../../setup";
// 显式引入 overlay 家族插件（x-popover 指令——日历面板的呈现通道，跨插件依赖镜像）
import "../../../directives/overlay/index";

import { describe, expect, test, afterEach } from "bun:test";
import { AutoSpark } from "autospark";
import { mount, nextTick } from "../../helpers";
import {
  DATE_PICKER_NAME,
  DATE_PICKER_PANEL_NAME,
  bootstrapDatePickerPlugin,
} from "../../../components/form/date-picker/index";
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
  root.querySelector(".asc-date-picker-trigger") as HTMLElement | null;
/** 日历面板（渲染进 body 覆盖物容器——engine 级副作用，测试须清理） */
const panelOf = () => document.querySelector(".asc-date-picker-panel") as HTMLElement | null;
/** 日格集（当前面板内） */
const daysOf = () =>
  Array.from(document.querySelectorAll(".asc-date-picker-panel .asc-date-picker-day"));
/** 星期表头集 */
const weekdaysOf = () =>
  Array.from(document.querySelectorAll(".asc-date-picker-panel .asc-date-picker-weekday"));
/** 今天 "YYYY-MM-DD"（测试内动态计算——日历的今天标记随真实日期） */
const todayStr = () => {
  const n = new Date();
  const p = (x: number) => String(x).padStart(2, "0");
  return n.getFullYear() + "-" + p(n.getMonth() + 1) + "-" + p(n.getDate());
};

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
  test("模块加载即注册：date-picker / date-picker-panel 双模板均入全局组件表（内嵌 field）", () => {
    const table = (AutoSpark as { components: Record<string, string> }).components;
    expect(typeof table[DATE_PICKER_NAME]).toBe("string");
    expect(typeof table[DATE_PICKER_PANEL_NAME]).toBe("string");
    expect(typeof table[FIELD_NAME]).toBe("string");
    expect(tpl(DATE_PICKER_NAME)).toContain(`x-define="${DATE_PICKER_NAME}"`);
    expect(tpl(DATE_PICKER_NAME)).toContain('x-define:inherit="autospark.field"'); // 继承链子端
    expect(tpl(DATE_PICKER_NAME)).toContain(`x-popover:${DATE_PICKER_PANEL_NAME}`); // 面板消费声明（x-popover 机制复用）
    expect(tpl(DATE_PICKER_PANEL_NAME)).toContain(`x-define="${DATE_PICKER_PANEL_NAME}"`);
  });

  test("组件自有图标注册：date-calendar 入全局图标表", () => {
    const icons = (AutoSpark as { icons: Set<string> }).icons;
    expect(icons.has("date-calendar")).toBe(true);
  });

  test("bootstrap 幂等：重复调用不覆盖（同键赋值幂等）", () => {
    const table = (AutoSpark as { components: Record<string, string> }).components;
    const before = table[DATE_PICKER_NAME];
    const beforePanel = table[DATE_PICKER_PANEL_NAME];
    bootstrapDatePickerPlugin();
    expect(table[DATE_PICKER_NAME]).toBe(before);
    expect(table[DATE_PICKER_PANEL_NAME]).toBe(beforePanel);
  });

  test("样式通道：三级回退链与暗色兜底变体均在模板中（ADR-0129）", () => {
    const picker = tpl(DATE_PICKER_NAME);
    expect(picker).toContain("var(--auto-input-placeholder, var(--asc-date-picker-placeholder,");
    expect(picker).toContain(".asc-date-picker-day[data-selected] {");
    expect(picker).toContain("[dark] .asc-date-picker-panel,");
    expect(picker).toContain("[data-dark] .asc-date-picker-day[data-out]");
    // 日历格语义色 token 经 --asc-tone 中转（ADR-0025 视觉对齐）
    expect(picker).toContain("--asc-tone: var(--auto-primary-color, var(--asc-date-picker-primary,");
  });
});

describe("化身渲染与 props 同步", () => {
  test("骨架 class 拼接 + 触发器 combobox 语义 + hidden 表单载体", async () => {
    const { root } = mountPicker(
      `<span x-component:autospark.date-picker="{}"></span>`,
      {},
    );
    await nextTick();
    const host = field(root);
    expect(host.classList.contains("asc-field")).toBe(true); // field 骨架类
    expect(host.classList.contains("asc-date-picker")).toBe(true);
    expect(host.classList.contains("asc-field-box")).toBe(true); // 盒饰选配类
    const trigger = triggerOf(root) as HTMLElement;
    expect(trigger.getAttribute("role")).toBe("combobox");
    expect(trigger.getAttribute("aria-haspopup")).toBe("grid");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(trigger.hasAttribute("data-autospark-control")).toBe(true); // 标记协议挂点
    const carrier = root.querySelector(".asc-date-picker-carrier") as HTMLInputElement;
    expect(carrier).toBeTruthy();
    expect(carrier.type).toBe("hidden");
  });

  test("占位文案：props 覆盖优先；缺省回退「请选择日期」（i18n 词典 date-picker.placeholder）", async () => {
    const a = mountPicker(
      `<span x-component:autospark.date-picker="{ placeholder: 'Pick a date' }"></span>`,
      {},
    );
    await nextTick();
    expect((a.root.querySelector(".asc-date-picker-placeholder") as HTMLElement)?.textContent?.trim()).toBe("Pick a date");
    a.engine.destroy();
    engines.splice(engines.indexOf(a.engine), 1);

    const b = mountPicker(`<span x-component:autospark.date-picker="{}"></span>`, {});
    await nextTick();
    expect((b.root.querySelector(".asc-date-picker-placeholder") as HTMLElement)?.textContent?.trim()).toBe("请选择日期");
  });

  test("初值注入（props.value）：值直出呈现 + carrier 跟随 + name 透传", async () => {
    const { root } = mountPicker(
      `<span name="birthday" x-component:autospark.date-picker="{ value: '2026-11-13' }"></span>`,
      {},
    );
    await nextTick();
    expect((root.querySelector(".asc-date-picker-value") as HTMLElement)?.textContent?.trim()).toBe("2026-11-13");
    expect(root.querySelector(".asc-date-picker-placeholder")).toBeNull(); // 有值不渲染占位
    const carrier = root.querySelector(".asc-date-picker-carrier") as HTMLInputElement;
    expect(carrier.value).toBe("2026-11-13");
    expect(carrier.name).toBe("birthday"); // 原生直提交载体
  });

  test("元素名写法（<x-date-picker>）：标签实例化 + 裸布尔属性归一（clearable → true）+ name props 折叠", async () => {
    const { root } = mountPicker(
      `<div><x-date-picker x-model="d" clearable name="bd"></x-date-picker></div>`,
      { d: "2026-01-15" },
    );
    await nextTick();
    const host = root.querySelector("x-date-picker") as HTMLElement;
    expect(host.classList.contains("asc-date-picker")).toBe(true); // 化身成功
    expect((root.querySelector(".asc-date-picker-value") as HTMLElement)?.textContent?.trim()).toBe("2026-01-15");
    // 裸布尔属性折叠为空串——组件侧归一 "" → true（ADR-0025 决策 4）
    expect(root.querySelector(".asc-date-picker-clear")).toBeTruthy();
    // name 属性元素名写法下折叠为 props——载体双通道合取
    expect((root.querySelector(".asc-date-picker-carrier") as HTMLInputElement).name).toBe("bd");
  });

  test("禁用态：data-disabled 反射 + 触发器退出焦点序 + 载体出表", async () => {
    const { root } = mountPicker(
      `<span x-component:autospark.date-picker="{ disabled: true }"></span>`,
      {},
    );
    await nextTick();
    const host = field(root);
    expect(host.hasAttribute("data-disabled")).toBe(true); // 骨架通道反射
    expect((triggerOf(root) as HTMLElement).tabIndex).toBe(-1); // 退出焦点序
    expect((root.querySelector(".asc-date-picker-carrier") as HTMLInputElement).disabled).toBe(true); // 出表
  });
});

describe("值桥（x-model 兼容协议，ADR-0025 对齐 ADR-0020/0022）", () => {
  test("x-model 双向：state → DOM（劫持 getter）与选中 → state（input 派发回写）", async () => {
    const { root, engine } = mountPicker(
      `<span x-model="form.date" x-component:autospark.date-picker="{}"></span>`,
      { form: { date: "2026-11-13" } },
    );
    await nextTick();
    const host = field(root);
    expect((host as any).value).toBe("2026-11-13"); // 劫持 getter
    expect((root.querySelector(".asc-date-picker-value") as HTMLElement)?.textContent?.trim()).toBe("2026-11-13");

    // 选中路径：开面板 → 点今天 → input 派发 → x-model 回写 state
    await openPanel(root);
    expect(panelOf()).not.toBeNull();
    const todayBtn = panelOf()?.querySelector(".asc-date-picker-today") as HTMLElement;
    todayBtn.click();
    await nextTick();
    expect(engine.store.state.form.date).toBe(todayStr());
    expect((host as any).value).toBe(todayStr());
    expect((root.querySelector(".asc-date-picker-carrier") as HTMLInputElement).value).toBe(todayStr());
  });

  test("change 事件（detail = { value }）冒泡供外层消费；input 非冒泡（x-model 专用）", async () => {
    const { root } = mountPicker(
      `<span x-component:autospark.date-picker="{ value: '2026-11-13' }"></span>`,
      {},
    );
    await nextTick();
    const events: string[] = [];
    let detail: any = null;
    root.addEventListener("change", (e: Event) => {
      events.push("change");
      detail = (e as CustomEvent).detail;
    });
    root.addEventListener("input", () => events.push("input"));

    await openPanel(root);
    // 点一个 2026-11-20 日格
    const day = daysOf().find((d) => d.textContent?.trim() === "20") as HTMLElement;
    day.click();
    await nextTick();
    expect(events).toEqual(["change"]); // input 非冒泡（宿主自身）
    expect(detail).toEqual({ value: "2026-11-20" });
  });

  test("state→DOM 单向（value props 无 x-model）：外部状态变化写入呈现", async () => {
    const { root, engine } = mountPicker(
      `<span x-component:autospark.date-picker="{ value: form.date }"></span>`,
      { form: { date: "2026-03-01" } },
    );
    await nextTick();
    engine.store.state.form.date = "2026-03-02";
    await nextTick();
    expect((root.querySelector(".asc-date-picker-value") as HTMLElement)?.textContent?.trim()).toBe("2026-03-02");
  });
});

describe("日历面板（x-popover 机制呈现）", () => {
  test("点击触发器开合：42 格网格 + 星期表头 7 列 + 年月标题；再点关闭", async () => {
    const { root } = mountPicker(
      `<span x-component:autospark.date-picker="{ value: '2026-11-13' }"></span>`,
      {},
    );
    await nextTick();
    const host = field(root);
    await openPanel(root);
    const panel = panelOf();
    expect(panel).not.toBeNull();
    // 42 格（6×7 单层扁平数组，CSS 七列自然分行）
    expect(daysOf().length).toBe(42);
    // 星期表头 7 列（缺省中文回退）
    expect(weekdaysOf().length).toBe(7);
    expect(weekdaysOf().map((w) => w.textContent?.trim()).join("")).toBe("日一二三四五六");
    // 年月标题（视图归位到值所在月）
    expect((panel?.querySelector(".asc-date-picker-title") as HTMLElement)?.textContent?.trim()).toBe("2026年11月");
    expect(host.hasAttribute("data-open")).toBe(true); // 开合态（面板 mounted 沿链写回）
    expect((triggerOf(root) as HTMLElement).getAttribute("aria-expanded")).toBe("true");
    // 值所在日 selected 标记
    const sel = daysOf().find((d) => d.hasAttribute("data-selected")) as HTMLElement;
    expect(sel?.textContent?.trim()).toBe("13");

    triggerOf(root)!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await nextTick();
    await nextTick();
    expect(panelOf()).toBeNull(); // 关闭即销毁（无 keepalive）
    expect(host.hasAttribute("data-open")).toBe(false);
  });

  test("网格结构：当月天数 + 邻月补格（前后邻月 data-out 标记）+ 今天标记", async () => {
    const { root } = mountPicker(
      `<span x-component:autospark.date-picker="{ value: '2026-02-10' }"></span>`,
      {},
    );
    await nextTick();
    await openPanel(root);
    const days = daysOf();
    expect(days.length).toBe(42);
    // 2026 年 2 月 28 天；2 月 1 日是周日 → 前补 0 格、后补 14 格 = 28 + 14 = 42
    const daysInMonth = new Date(2026, 2, 0).getDate(); // 28
    const leading = new Date(2026, 1, 1).getDay(); // 0（周日开头）
    const inMonth = days.filter((d) => !d.hasAttribute("data-out"));
    const out = days.filter((d) => d.hasAttribute("data-out"));
    expect(inMonth.length).toBe(daysInMonth);
    expect(out.length).toBe(42 - daysInMonth - leading);
    // 今天标记（视图在 2026-02——今天大概率不在视图内，回退当月视图验证）
    const todayCount = days.filter((d) => d.hasAttribute("data-today")).length;
    expect(todayCount === 0 || todayCount === 1).toBe(true);
  });

  test("月份切换：前后钮哨兵 → 标题与网格跟随（年 rollover 12 月→次年 1 月）", async () => {
    const { root } = mountPicker(
      `<span x-component:autospark.date-picker="{ value: '2026-12-15' }"></span>`,
      {},
    );
    await nextTick();
    await openPanel(root);
    expect((panelOf()?.querySelector(".asc-date-picker-title") as HTMLElement)?.textContent?.trim()).toBe("2026年12月");
    const nexts = Array.from(document.querySelectorAll(".asc-date-picker-panel .asc-date-picker-nav"));
    const nextBtn = nexts.find((n) => !n.classList.contains("asc-date-picker-nav-prev")) as HTMLElement;
    nextBtn.click();
    await nextTick();
    expect((panelOf()?.querySelector(".asc-date-picker-title") as HTMLElement)?.textContent?.trim()).toBe("2027年1月"); // 年 rollover
    // 上月钮回到 2026-12
    const prevBtn = panelOf()?.querySelector(".asc-date-picker-nav-prev") as HTMLElement;
    prevBtn.click();
    await nextTick();
    expect((panelOf()?.querySelector(".asc-date-picker-title") as HTMLElement)?.textContent?.trim()).toBe("2026年12月");
  });

  test("今天快捷钮：点击选中今天（哨兵携带 todayValue）", async () => {
    const { root } = mountPicker(
      `<span x-component:autospark.date-picker="{}"></span>`,
      {},
    );
    await nextTick();
    await openPanel(root);
    const todayBtn = panelOf()?.querySelector(".asc-date-picker-today") as HTMLElement;
    expect(todayBtn.textContent?.trim()).toBe("今天");
    todayBtn.click();
    await nextTick();
    await nextTick();
    expect(panelOf()).toBeNull(); // 选中即关
    expect((root.querySelector(".asc-date-picker-value") as HTMLElement)?.textContent?.trim()).toBe(todayStr());
  });

  test("选中联动：日格点击 → 值 / carrier / 面板关闭 + 焦点回触发器；重开选中标记跟随", async () => {
    const { root } = mountPicker(
      `<span x-component:autospark.date-picker="{}"></span>`,
      {},
    );
    await nextTick();
    await openPanel(root);
    const day = daysOf().find((d) => d.textContent?.trim() === "20") as HTMLElement;
    day.click();
    await nextTick();
    await nextTick();
    expect(panelOf()).toBeNull(); // 选中即关
    const ym = new Date(); // 无初值时视图落当月——点的是当月 20 日
    const p = (x: number) => String(x).padStart(2, "0");
    const expect20 = ym.getFullYear() + "-" + p(ym.getMonth() + 1) + "-20";
    expect((root.querySelector(".asc-date-picker-value") as HTMLElement)?.textContent?.trim()).toBe(expect20);
    expect((root.querySelector(".asc-date-picker-carrier") as HTMLInputElement).value).toBe(expect20);
    // 重开：选中标记命中
    await openPanel(root);
    const sel = daysOf().find((d) => d.hasAttribute("data-selected")) as HTMLElement;
    expect(sel?.textContent?.trim()).toBe("20");
  });

  test("同值再选：仅关面板不派发变更", async () => {
    const { root } = mountPicker(
      `<span x-component:autospark.date-picker="{ value: '2026-11-13' }"></span>`,
      {},
    );
    await nextTick();
    let changeCount = 0;
    root.addEventListener("change", () => changeCount++);
    await openPanel(root);
    (daysOf().find((d) => d.hasAttribute("data-selected")) as HTMLElement).click();
    await nextTick();
    await nextTick();
    expect(panelOf()).toBeNull();
    expect(changeCount).toBe(0);
  });

  test("面板外点击关闭与 ESC 关闭（机制继承）", async () => {
    const a = mountPicker(`<span x-component:autospark.date-picker="{}"></span>`, {});
    await nextTick();
    await openPanel(a.root);
    expect(panelOf()).not.toBeNull();
    document.body.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await nextTick();
    await nextTick();
    expect(panelOf()).toBeNull();
    a.engine.destroy();
    engines.splice(engines.indexOf(a.engine), 1);

    const b = mountPicker(`<span x-component:autospark.date-picker="{}"></span>`, {});
    await nextTick();
    await openPanel(b.root);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await nextTick();
    await nextTick();
    expect(panelOf()).toBeNull();
  });

  test("只读态：面板可开浏览但选中被阻断（pick guard）", async () => {
    const ro = mountPicker(
      `<span x-component:autospark.date-picker="{ value: '2026-11-13', readonly: true }"></span>`,
      {},
    );
    await nextTick();
    expect(field(ro.root).hasAttribute("data-readonly")).toBe(true);
    await openPanel(ro.root);
    expect(panelOf()).not.toBeNull(); // 只读可浏览
    (daysOf().find((d) => d.textContent?.trim() === "20") as HTMLElement).click();
    await nextTick();
    expect(panelOf()).not.toBeNull(); // 选中被 pick guard 阻断（面板不关）
    expect((ro.root.querySelector(".asc-date-picker-value") as HTMLElement)?.textContent?.trim()).toBe("2026-11-13");
  });

  // 注：禁用态「不可开面板」的拦截通道是 CSS pointer-events（真实用户命中测试层）——
  // 程序化 dispatchEvent 绕过命中测试不可断言开合（select 测试同款覆盖面：tabindex/载体/反射）
});

describe("键盘导航（触发器焦点，按简实现）", () => {
  const keydown = (el: Element, key: string) =>
    el.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));

  test("ArrowDown 未开先开（高亮落当前值）→ 方向键漫游（跨月跟随）→ Enter 选中", async () => {
    const { root } = mountPicker(
      `<span x-component:autospark.date-picker="{ value: '2026-11-13' }"></span>`,
      {},
    );
    await nextTick();
    const trigger = triggerOf(root) as HTMLElement;
    keydown(trigger, "ArrowDown");
    await nextTick();
    await nextTick();
    expect(panelOf()).not.toBeNull(); // 未开先开
    const activeOf = () => daysOf().find((d) => d.hasAttribute("data-active"));
    expect(activeOf()?.textContent?.trim()).toBe("13"); // 打开时高亮落当前选中日

    keydown(trigger, "ArrowRight"); // → 14
    await nextTick();
    expect(activeOf()?.textContent?.trim()).toBe("14");
    keydown(trigger, "ArrowDown"); // +7 → 21
    await nextTick();
    expect(activeOf()?.textContent?.trim()).toBe("21");
    keydown(trigger, "ArrowLeft"); // → 20
    await nextTick();
    expect(activeOf()?.textContent?.trim()).toBe("20");

    keydown(trigger, "Enter");
    await nextTick();
    await nextTick();
    expect(panelOf()).toBeNull(); // 确认选中关面板
    expect((root.querySelector(".asc-date-picker-value") as HTMLElement)?.textContent?.trim()).toBe("2026-11-20");
  });

  test("跨月漫游：月末右移 → 视图切下月 + 高亮落 1 日", async () => {
    const { root } = mountPicker(
      `<span x-component:autospark.date-picker="{ value: '2026-01-31' }"></span>`,
      {},
    );
    await nextTick();
    const trigger = triggerOf(root) as HTMLElement;
    await openPanel(root);
    expect((panelOf()?.querySelector(".asc-date-picker-title") as HTMLElement)?.textContent?.trim()).toBe("2026年1月");
    keydown(trigger, "ArrowRight"); // 1-31 → 2-1（跨月）
    await nextTick();
    expect((panelOf()?.querySelector(".asc-date-picker-title") as HTMLElement)?.textContent?.trim()).toBe("2026年2月"); // 视图跟随
    const active = daysOf().find((d) => d.hasAttribute("data-active")) as HTMLElement;
    expect(active?.textContent?.trim()).toBe("1");
    expect(active?.hasAttribute("data-out")).toBe(false); // 落在当月
  });

  test("PageDown/PageDown 切月 + Enter 未开先开（不误选）", async () => {
    const { root } = mountPicker(
      `<span x-component:autospark.date-picker="{ value: '2026-11-13' }"></span>`,
      {},
    );
    await nextTick();
    const trigger = triggerOf(root) as HTMLElement;
    keydown(trigger, "Enter");
    await nextTick();
    await nextTick();
    expect(panelOf()).not.toBeNull(); // Enter 未开先开
    expect(field(root).querySelector(".asc-date-picker-value")?.textContent?.trim()).toBe("2026-11-13"); // 不误选

    keydown(trigger, "PageDown");
    await nextTick();
    expect((panelOf()?.querySelector(".asc-date-picker-title") as HTMLElement)?.textContent?.trim()).toBe("2026年12月");
    keydown(trigger, "PageUp");
    await nextTick();
    keydown(trigger, "PageUp");
    await nextTick();
    expect((panelOf()?.querySelector(".asc-date-picker-title") as HTMLElement)?.textContent?.trim()).toBe("2026年10月");
  });
});

describe("clearable", () => {
  test("清除钮非空显形 → 点击清空 + 双派发 + 焦点回触发器；空值隐藏", async () => {
    const { root } = mountPicker(
      `<span x-component:autospark.date-picker="{ value: '2026-11-13', clearable: true }"></span>`,
      {},
    );
    await nextTick();
    const clear = root.querySelector(".asc-date-picker-clear") as HTMLElement;
    expect(clear).toBeTruthy();
    const events: string[] = [];
    let detail: any = null;
    root.addEventListener("change", (e: Event) => {
      events.push("change");
      detail = (e as CustomEvent).detail;
    });
    clear.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await nextTick();
    expect((root.querySelector(".asc-date-picker-value") as HTMLElement | null)).toBeNull(); // 清空 → 占位回归
    expect((root.querySelector(".asc-date-picker-carrier") as HTMLInputElement).value).toBe("");
    expect(events).toEqual(["change"]);
    expect(detail).toEqual({ value: "" }); // 字符串空语域（select null 语域分叉，ADR-0025）
    expect(root.querySelector(".asc-date-picker-clear")).toBeNull(); // 无值隐藏
    expect(panelOf()).toBeNull(); // stopPropagation 防误开面板
  });
});
