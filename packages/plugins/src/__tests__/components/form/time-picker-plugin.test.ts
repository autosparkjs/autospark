/**
 * time-picker 组件插件测试（组件库 P3 时间族，ADR-0025）：
 * - 注册面：time-picker / time-picker-panel 双模板入全局组件表（内嵌 field
 *   注册）+ 组件自有图标注册 + 面板 x-popover 消费声明；
 * - 化身渲染：骨架 class 拼接、触发器 combobox 语义、hidden 表单载体、占位文案
 *   （props 覆盖与 i18n 词典回退「请选择时间」）；元素名写法（<x-time-picker>）；
 * - 值桥（x-model 兼容协议，"HH:mm" 字符串语域）：宿主 el.value 劫持、carrier 跟随、
 *   input（非冒泡）+ change（冒泡 detail={value}）双派发；
 * - 时间面板（两列滚动列表，ADR-0025 决策 2）：点击开合 / 24 时格 + 60 分格 /
 *   部分提交语义（点格更新对应位 + change 派发 + **面板保持开**）/ 选中标记跟随 /
 *   空值点选缺省位（时列 → HH:00、分列 → 00:MM）/ 面板外点击与 ESC 关闭（机制继承）；
 * - 键盘（按简）：Enter/ArrowDown 开面板、再 Enter 收起；clearable / disabled /
 *   readonly（pick guard）。
 */
import "../../setup";
// 显式引入 overlay 家族插件（x-popover 指令——时间面板的呈现通道，跨插件依赖镜像）
import "../../../directives/overlay/index";

import { describe, expect, test, afterEach } from "bun:test";
import { AutoSpark } from "autospark";
import { mount, nextTick } from "../../helpers";
import {
  TIME_PICKER_NAME,
  TIME_PICKER_PANEL_NAME,
  bootstrapTimePickerPlugin,
} from "../../../components/form/time-picker/index";
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
  root.querySelector(".asc-time-picker-trigger") as HTMLElement | null;
/** 时间面板（渲染进 body 覆盖物容器——engine 级副作用，测试须清理） */
const panelOf = () => document.querySelector(".asc-time-picker-panel") as HTMLElement | null;
/** 时/分列（面板内，0=时列 1=分列） */
const colOf = (i: number) =>
  document.querySelectorAll(".asc-time-picker-panel .asc-time-picker-col")[i] as HTMLElement;
/** 指定列的格集 */
const cellsOf = (i: number) =>
  Array.from(colOf(i)?.querySelectorAll(".asc-time-picker-cell") ?? []);

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
  test("模块加载即注册：time-picker / time-picker-panel 双模板均入全局组件表（内嵌 field）", () => {
    const table = (AutoSpark as { components: Record<string, string> }).components;
    expect(typeof table[TIME_PICKER_NAME]).toBe("string");
    expect(typeof table[TIME_PICKER_PANEL_NAME]).toBe("string");
    expect(typeof table[FIELD_NAME]).toBe("string");
    expect(tpl(TIME_PICKER_NAME)).toContain(`x-define="${TIME_PICKER_NAME}"`);
    expect(tpl(TIME_PICKER_NAME)).toContain('x-define:inherit="autospark.field"');
    expect(tpl(TIME_PICKER_NAME)).toContain(`x-popover:${TIME_PICKER_PANEL_NAME}`); // 面板消费声明
    expect(tpl(TIME_PICKER_PANEL_NAME)).toContain(`x-define="${TIME_PICKER_PANEL_NAME}"`);
  });

  test("组件自有图标注册：time-clock 入全局图标表", () => {
    const icons = (AutoSpark as { icons: Set<string> }).icons;
    expect(icons.has("time-clock")).toBe(true);
  });

  test("bootstrap 幂等：重复调用不覆盖（同键赋值幂等）", () => {
    const table = (AutoSpark as { components: Record<string, string> }).components;
    const before = table[TIME_PICKER_NAME];
    const beforePanel = table[TIME_PICKER_PANEL_NAME];
    bootstrapTimePickerPlugin();
    expect(table[TIME_PICKER_NAME]).toBe(before);
    expect(table[TIME_PICKER_PANEL_NAME]).toBe(beforePanel);
  });

  test("样式通道：三级回退链与暗色兜底变体均在模板中（ADR-0129）", () => {
    const picker = tpl(TIME_PICKER_NAME);
    expect(picker).toContain("var(--auto-input-placeholder, var(--asc-time-picker-placeholder,");
    expect(picker).toContain(".asc-time-picker-cell[data-selected] {");
    expect(picker).toContain("[dark] .asc-time-picker-panel,");
    expect(picker).toContain("[data-dark] .asc-time-picker-panel");
    // 格位语义色 token 经 --asc-tone 中转（ADR-0025 视觉对齐）
    expect(picker).toContain("--asc-tone: var(--auto-primary-color, var(--asc-time-picker-primary,");
  });
});

describe("化身渲染与 props 同步", () => {
  test("骨架 class 拼接 + 触发器 combobox 语义 + hidden 表单载体", async () => {
    const { root } = mountPicker(`<span x-component:autospark.time-picker="{}"></span>`, {});
    await nextTick();
    const host = field(root);
    expect(host.classList.contains("asc-field")).toBe(true);
    expect(host.classList.contains("asc-time-picker")).toBe(true);
    expect(host.classList.contains("asc-field-box")).toBe(true);
    const trigger = triggerOf(root) as HTMLElement;
    expect(trigger.getAttribute("role")).toBe("combobox");
    expect(trigger.getAttribute("aria-haspopup")).toBe("listbox");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(trigger.hasAttribute("data-autospark-control")).toBe(true);
    const carrier = root.querySelector(".asc-time-picker-carrier") as HTMLInputElement;
    expect(carrier).toBeTruthy();
    expect(carrier.type).toBe("hidden");
  });

  test("占位文案：props 覆盖优先；缺省回退「请选择时间」（i18n 词典 time-picker.placeholder）", async () => {
    const a = mountPicker(
      `<span x-component:autospark.time-picker="{ placeholder: 'Pick a time' }"></span>`,
      {},
    );
    await nextTick();
    expect((a.root.querySelector(".asc-time-picker-placeholder") as HTMLElement)?.textContent?.trim()).toBe("Pick a time");
    a.engine.destroy();
    engines.splice(engines.indexOf(a.engine), 1);

    const b = mountPicker(`<span x-component:autospark.time-picker="{}"></span>`, {});
    await nextTick();
    expect((b.root.querySelector(".asc-time-picker-placeholder") as HTMLElement)?.textContent?.trim()).toBe("请选择时间");
  });

  test("初值注入（props.value「09:30」）：值直出呈现 + carrier 跟随 + name 透传", async () => {
    const { root } = mountPicker(
      `<span name="meet" x-component:autospark.time-picker="{ value: '09:30' }"></span>`,
      {},
    );
    await nextTick();
    expect((root.querySelector(".asc-time-picker-value") as HTMLElement)?.textContent?.trim()).toBe("09:30");
    expect(root.querySelector(".asc-time-picker-placeholder")).toBeNull();
    const carrier = root.querySelector(".asc-time-picker-carrier") as HTMLInputElement;
    expect(carrier.value).toBe("09:30");
    expect(carrier.name).toBe("meet");
  });

  test("元素名写法（<x-time-picker>）：标签实例化 + 裸布尔属性归一（clearable → true）", async () => {
    const { root } = mountPicker(
      `<div><x-time-picker x-model="t" clearable></x-time-picker></div>`,
      { t: "18:45" },
    );
    await nextTick();
    const host = root.querySelector("x-time-picker") as HTMLElement;
    expect(host.classList.contains("asc-time-picker")).toBe(true); // 化身成功
    expect((root.querySelector(".asc-time-picker-value") as HTMLElement)?.textContent?.trim()).toBe("18:45");
    expect(root.querySelector(".asc-time-picker-clear")).toBeTruthy(); // 裸布尔归一（ADR-0025）
  });

  test("禁用态：data-disabled 反射 + 触发器退出焦点序 + 载体出表", async () => {
    const { root } = mountPicker(
      `<span x-component:autospark.time-picker="{ disabled: true }"></span>`,
      {},
    );
    await nextTick();
    expect(field(root).hasAttribute("data-disabled")).toBe(true);
    expect((triggerOf(root) as HTMLElement).tabIndex).toBe(-1);
    expect((root.querySelector(".asc-time-picker-carrier") as HTMLInputElement).disabled).toBe(true);
  });
});

describe("值桥（x-model 兼容协议，ADR-0025 对齐 ADR-0020/0022）", () => {
  test("x-model 双向：state → DOM（劫持 getter）与点选 → state（input 派发回写）", async () => {
    const { root, engine } = mountPicker(
      `<span x-model="form.time" x-component:autospark.time-picker="{}"></span>`,
      { form: { time: "08:15" } },
    );
    await nextTick();
    const host = field(root);
    expect((host as any).value).toBe("08:15");

    // 点选路径：开面板 → 点时格 14 → input 派发 → x-model 回写 state
    await openPanel(root);
    (cellsOf(0).find((c) => c.textContent?.trim() === "14") as HTMLElement).click();
    await nextTick();
    expect(engine.store.state.form.time).toBe("14:15"); // 分位保留
    expect((host as any).value).toBe("14:15");
    expect((root.querySelector(".asc-time-picker-carrier") as HTMLInputElement).value).toBe("14:15");
  });

  test("change 事件（detail = { value }）冒泡供外层消费；input 非冒泡", async () => {
    const { root } = mountPicker(`<span x-component:autospark.time-picker="{}"></span>`, {});
    await nextTick();
    const events: string[] = [];
    let detail: any = null;
    root.addEventListener("change", (e: Event) => {
      events.push("change");
      detail = (e as CustomEvent).detail;
    });
    root.addEventListener("input", () => events.push("input"));

    await openPanel(root);
    (cellsOf(1).find((c) => c.textContent?.trim() === "45") as HTMLElement).click();
    await nextTick();
    expect(events).toEqual(["change"]);
    expect(detail).toEqual({ value: "00:45" }); // 空值点分列 → 时位缺省 0
  });

  test("state→DOM 单向（value props 无 x-model）：外部状态变化写入呈现", async () => {
    const { root, engine } = mountPicker(
      `<span x-component:autospark.time-picker="{ value: form.time }"></span>`,
      { form: { time: "07:00" } },
    );
    await nextTick();
    engine.store.state.form.time = "07:30";
    await nextTick();
    expect((root.querySelector(".asc-time-picker-value") as HTMLElement)?.textContent?.trim()).toBe("07:30");
  });
});

describe("时间面板（两列滚动列表，ADR-0025 决策 2）", () => {
  test("点击触发器开合：时列 24 格 + 分列 60 格；再点关闭", async () => {
    const { root } = mountPicker(`<span x-component:autospark.time-picker="{}"></span>`, {});
    await nextTick();
    const host = field(root);
    await openPanel(root);
    expect(panelOf()).not.toBeNull();
    expect(cellsOf(0).length).toBe(24); // 时列
    expect(cellsOf(1).length).toBe(60); // 分列
    expect((cellsOf(0)[9] as HTMLElement).textContent?.trim()).toBe("09");
    expect((cellsOf(1)[30] as HTMLElement).textContent?.trim()).toBe("30");
    expect(host.hasAttribute("data-open")).toBe(true);
    expect((triggerOf(root) as HTMLElement).getAttribute("aria-expanded")).toBe("true");

    triggerOf(root)!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await nextTick();
    await nextTick();
    expect(panelOf()).toBeNull();
    expect(host.hasAttribute("data-open")).toBe(false);
  });

  test("部分提交（核心语义）：点时格更新时位 + 面板保持开 + 选中标记跟随；再点分格完成选择", async () => {
    const { root } = mountPicker(
      `<span x-component:autospark.time-picker="{ value: '08:15' }"></span>`,
      {},
    );
    await nextTick();
    await openPanel(root);
    // 初值选中标记：时列 08 / 分列 15
    expect((cellsOf(0).find((c) => c.hasAttribute("data-selected")) as HTMLElement)?.textContent?.trim()).toBe("08");
    expect((cellsOf(1).find((c) => c.hasAttribute("data-selected")) as HTMLElement)?.textContent?.trim()).toBe("15");

    // 点时格 20 → "20:15"，面板保持开（两列连续选择语义）
    (cellsOf(0).find((c) => c.textContent?.trim() === "20") as HTMLElement).click();
    await nextTick();
    expect(panelOf()).not.toBeNull();
    expect((root.querySelector(".asc-time-picker-value") as HTMLElement)?.textContent?.trim()).toBe("20:15");
    expect((cellsOf(0).find((c) => c.hasAttribute("data-selected")) as HTMLElement)?.textContent?.trim()).toBe("20");

    // 点分格 40 → "20:40"，面板仍保持开
    (cellsOf(1).find((c) => c.textContent?.trim() === "40") as HTMLElement).click();
    await nextTick();
    expect(panelOf()).not.toBeNull();
    expect((root.querySelector(".asc-time-picker-value") as HTMLElement)?.textContent?.trim()).toBe("20:40");
    expect((cellsOf(1).find((c) => c.hasAttribute("data-selected")) as HTMLElement)?.textContent?.trim()).toBe("40");
  });

  test("空值点选缺省位：点时列 →「HH:00」（分位缺省 0）", async () => {
    const { root } = mountPicker(`<span x-component:autospark.time-picker="{}"></span>`, {});
    await nextTick();
    await openPanel(root);
    (cellsOf(0).find((c) => c.textContent?.trim() === "09") as HTMLElement).click();
    await nextTick();
    expect((root.querySelector(".asc-time-picker-value") as HTMLElement)?.textContent?.trim()).toBe("09:00"); // 分位缺省 0
  });

  test("同值点选幂等：不派发变更", async () => {
    const { root } = mountPicker(
      `<span x-component:autospark.time-picker="{ value: '09:30' }"></span>`,
      {},
    );
    await nextTick();
    let changeCount = 0;
    root.addEventListener("change", () => changeCount++);
    await openPanel(root);
    (cellsOf(0).find((c) => c.hasAttribute("data-selected")) as HTMLElement).click(); // 再点同一时格
    await nextTick();
    expect(changeCount).toBe(0);
  });

  test("面板外点击关闭与 ESC 关闭（机制继承）", async () => {
    const a = mountPicker(`<span x-component:autospark.time-picker="{}"></span>`, {});
    await nextTick();
    await openPanel(a.root);
    expect(panelOf()).not.toBeNull();
    document.body.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await nextTick();
    await nextTick();
    expect(panelOf()).toBeNull();
    a.engine.destroy();
    engines.splice(engines.indexOf(a.engine), 1);

    const b = mountPicker(`<span x-component:autospark.time-picker="{}"></span>`, {});
    await nextTick();
    await openPanel(b.root);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await nextTick();
    await nextTick();
    expect(panelOf()).toBeNull();
  });

  test("只读态：面板可开浏览但点选被阻断（applyPart guard）", async () => {
    const { root } = mountPicker(
      `<span x-component:autospark.time-picker="{ value: '08:15', readonly: true }"></span>`,
      {},
    );
    await nextTick();
    expect(field(root).hasAttribute("data-readonly")).toBe(true);
    await openPanel(root);
    expect(panelOf()).not.toBeNull();
    (cellsOf(0).find((c) => c.textContent?.trim() === "20") as HTMLElement).click();
    await nextTick();
    expect((root.querySelector(".asc-time-picker-value") as HTMLElement)?.textContent?.trim()).toBe("08:15"); // 未变
  });
});

describe("键盘（按简，ADR-0025 边界声明）", () => {
  const keydown = (el: Element, key: string) =>
    el.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));

  test("Enter 未开先开；面板开时 Enter 收起（确认语义）", async () => {
    const { root } = mountPicker(`<span x-component:autospark.time-picker="{}"></span>`, {});
    await nextTick();
    const trigger = triggerOf(root) as HTMLElement;
    keydown(trigger, "Enter");
    await nextTick();
    await nextTick();
    expect(panelOf()).not.toBeNull(); // 未开先开
    keydown(trigger, "Enter");
    await nextTick();
    await nextTick();
    expect(panelOf()).toBeNull(); // 再 Enter 收起
  });

  test("ArrowDown 开面板（与 Enter 同通道）", async () => {
    const { root } = mountPicker(`<span x-component:autospark.time-picker="{}"></span>`, {});
    await nextTick();
    keydown(triggerOf(root) as HTMLElement, "ArrowDown");
    await nextTick();
    await nextTick();
    expect(panelOf()).not.toBeNull();
  });
});

describe("clearable", () => {
  test("清除钮非空显形 → 点击清空 + 双派发 + 焦点回触发器；空值隐藏", async () => {
    const { root } = mountPicker(
      `<span x-component:autospark.time-picker="{ value: '09:30', clearable: true }"></span>`,
      {},
    );
    await nextTick();
    const clear = root.querySelector(".asc-time-picker-clear") as HTMLElement;
    expect(clear).toBeTruthy();
    const events: string[] = [];
    let detail: any = null;
    root.addEventListener("change", (e: Event) => {
      events.push("change");
      detail = (e as CustomEvent).detail;
    });
    clear.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await nextTick();
    expect((root.querySelector(".asc-time-picker-value") as HTMLElement | null)).toBeNull();
    expect((root.querySelector(".asc-time-picker-carrier") as HTMLInputElement).value).toBe("");
    expect(events).toEqual(["change"]);
    expect(detail).toEqual({ value: "" }); // 字符串空语域
    expect(root.querySelector(".asc-time-picker-clear")).toBeNull();
    expect(panelOf()).toBeNull(); // stopPropagation 防误开面板
  });
});
