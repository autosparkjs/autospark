/**
 * color-picker 组件插件测试（组件库 P3 form 批重件，ADR-0028）：
 * - 注册面：color-picker / color-panel 双模板入全局组件表（内嵌 field 注册）+
 *   x-popover 消费声明（连字符面板注册名）+ bootstrap 幂等 + 样式三级回退链与暗色
 *   兜底变体；
 * - 化身渲染：元素名形态实例化（`<x-color-picker>`，ADR-0117）、色块预览（liveHex
 *   绑定）、触发器 combobox 语义、hidden 表单载体、值归一（#rgb/#rrggbb/无 # 前缀/
 *   大小写/非法 → #000000）；
 * - 值桥（x-model 兼容协议，ADR-0028 决策 7）：宿主 el.value hex 语域劫持、x-model
 *   双向（提交路径 → state 回写）、change 冒泡 detail={value} / input 非冒泡、
 *   value props 单向同步（HSV 重建）；
 * - 取色面板（x-popover 机制呈现，跨插件依赖 autospark.overlay）：点击开合 / 面板外
 *   点击与 ESC 关闭（机制继承）/ SV 拖拽（rect 桩 + pointer 事件序列：拖拽实时改色、
 *   提交恒在 pointerup 不逐帧派发 change）/ H 拖拽 / 预设色板点击（data-active 高亮、
 *   不关面板）/ hex 输入应用（非法回显不应用）；
 * - HSV 转换正确性：thumb 百分比定位（#ff0000 → SV 右上 + H 左端；#00ff00 → H 1/3）。
 */
import "../../setup";
// 显式引入 overlay 家族插件（x-popover 指令——取色面板的呈现通道，跨插件依赖镜像）
import "../../../directives/overlay/index";

import { describe, expect, test, afterEach } from "bun:test";
import { AutoSpark } from "autospark";
import { mount, nextTick } from "../../helpers";
import {
  COLOR_PICKER_NAME,
  COLOR_PICKER_PANEL_NAME,
  bootstrapColorPickerPlugin,
} from "../../../components/form/color-picker/index";

/** 取全局表模板（空白归一——oxfmt 折行使逐字匹配假红） */
const tpl = (name: string) =>
  ((AutoSpark as { components: Record<string, string> }).components[name] as string).replace(
    /\s+/g,
    " ",
  );

/** 取实例化后的宿主（.asc-field 骨架根） */
const field = (root: HTMLElement) => root.querySelector(".asc-color-picker") as HTMLElement;
/** 触发器（popover 宿主 / combobox） */
const triggerOf = (root: HTMLElement) =>
  root.querySelector(".asc-color-picker-trigger") as HTMLElement;
/** 色块预览 */
const swatchOf = (root: HTMLElement) =>
  root.querySelector(".asc-color-picker-swatch") as HTMLElement;
/** 取色面板（渲染进 body 覆盖物容器——engine 级副作用，测试须清理） */
const panelOf = () => document.querySelector(".asc-color-panel") as HTMLElement | null;
/** SV 面板 / H 条 / hex 输入 / 预设集（当前面板内） */
const svOf = () => panelOf()?.querySelector(".asc-color-sv") as HTMLElement;
const hueOf = () => panelOf()?.querySelector(".asc-color-hue") as HTMLElement;
const hexInputOf = () => panelOf()?.querySelector(".asc-color-hex-input") as HTMLInputElement;
const presetsOf = () => Array.from(panelOf()?.querySelectorAll(".asc-color-preset") ?? []);

/** style 归一（happy-dom 序列化在冒号后插空格——空白剥除后做包含断言） */
const styleOf = (el: HTMLElement) => (el.getAttribute("style") ?? "").replace(/\s+/g, "");
/** rect 桩（happy-dom 无布局——getBoundingClientRect 恒 0；拖拽数学须真实尺寸） */
const stubRect = (el: HTMLElement, w: number, h: number) => {
  (el as any).getBoundingClientRect = () => ({
    left: 0,
    top: 0,
    right: w,
    bottom: h,
    width: w,
    height: h,
    x: 0,
    y: 0,
    toJSON() {
      return {};
    },
  });
};
/** 指针事件（happy-dom 无 PointerEvent——MouseEvent 按类型派发，监听按类型命中） */
const pointer = (el: HTMLElement, type: string, x: number, y: number) =>
  el.dispatchEvent(new MouseEvent(type, { clientX: x, clientY: y, bubbles: true }));

/** 引擎回收（面板挂 body 覆盖物容器——engine destroy 级联清理，防跨用例泄漏）；
 *  双跳等待——嵌套渲染晚一跳（ADR-0024 后果 3 同族） */
const engines: any[] = [];
const mountPicker = async (html: string, state: any) => {
  const m = mount(html, state, { animate: false });
  engines.push(m.engine);
  await nextTick();
  await nextTick();
  return m;
};

afterEach(() => {
  for (const e of engines.splice(0)) e.destroy?.();
});

/** 预设色板（状态引用注入） */
const PRESETS = ["#ff0000", "#00ff00", "#0000ff", "#ffffff"];

describe("注册面（ADR-0028）", () => {
  test("模块加载即注册：color-picker / color-panel 双模板均入全局组件表（内嵌 field）", () => {
    const table = (AutoSpark as { components: Record<string, string> }).components;
    expect(typeof table[COLOR_PICKER_NAME]).toBe("string");
    expect(typeof table[COLOR_PICKER_PANEL_NAME]).toBe("string");
    expect(tpl(COLOR_PICKER_NAME)).toContain(`x-define="${COLOR_PICKER_NAME}"`);
    expect(tpl(COLOR_PICKER_NAME)).toContain('x-define:inherit="autospark.field"'); // 盒饰形态（select 同款 chrome）
    expect(tpl(COLOR_PICKER_NAME)).toContain(`x-popover:${COLOR_PICKER_PANEL_NAME}`); // 面板消费声明（连字符注册名）
    expect(tpl(COLOR_PICKER_PANEL_NAME)).toContain(`x-define="${COLOR_PICKER_PANEL_NAME}"`);
  });

  test("bootstrap 幂等：重复调用不覆盖（同键赋值幂等）", () => {
    const table = (AutoSpark as { components: Record<string, string> }).components;
    const before = table[COLOR_PICKER_NAME];
    const beforePanel = table[COLOR_PICKER_PANEL_NAME];
    bootstrapColorPickerPlugin();
    expect(table[COLOR_PICKER_NAME]).toBe(before);
    expect(table[COLOR_PICKER_PANEL_NAME]).toBe(beforePanel);
  });

  test("样式通道：三级回退链与暗色兜底变体均在模板中（ADR-0129）", () => {
    const picker = tpl(COLOR_PICKER_NAME);
    expect(picker).toContain("var(--auto-primary-color, var(--asc-color-panel-primary,");
    expect(picker).toContain(".asc-color-preset[data-active] {");
    expect(picker).toContain("[dark] .asc-color-panel,");
    expect(picker).toContain("[data-dark] .asc-color-hex-swatch {");
  });
});

describe("化身渲染与值归一", () => {
  test("元素名形态实例化：骨架盒饰 + 色块预览 + 触发器 combobox 语义 + hidden 载体", async () => {
    const { root } = await mountPicker(
      `<x-color-picker :value="color" name="theme"></x-color-picker>`,
      { color: "#4098fc" },
    );
    const host = field(root);
    expect(host.classList.contains("asc-field")).toBe(true); // field 骨架类
    expect(host.classList.contains("asc-color-picker")).toBe(true);
    expect(host.classList.contains("asc-field-box")).toBe(true); // 盒饰选配类
    const trigger = triggerOf(root);
    expect(trigger.getAttribute("role")).toBe("combobox");
    expect(trigger.getAttribute("aria-haspopup")).toBe("dialog");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(trigger.hasAttribute("data-autospark-control")).toBe(true);
    const carrier = root.querySelector(".asc-color-picker-carrier") as HTMLInputElement;
    expect(carrier.type).toBe("hidden");
    expect(carrier.value).toBe("#4098fc");
    expect(carrier.name).toBe("theme"); // 元素名形态折叠 props 通道
  });

  test("值归一：#rgb 展开 / 无 # 前缀 / 大小写 / 非法归 #000000", async () => {
    const a = await mountPicker(`<x-color-picker value="#F00"></x-color-picker>`, {});
    expect((field(a.root) as any).value).toBe("#ff0000");
    a.engine.destroy();
    engines.splice(engines.indexOf(a.engine), 1);

    const b = await mountPicker(`<x-color-picker value="00ff00"></x-color-picker>`, {});
    expect((field(b.root) as any).value).toBe("#00ff00");
    b.engine.destroy();
    engines.splice(engines.indexOf(b.engine), 1);

    const c = await mountPicker(`<x-color-picker value="not-a-color"></x-color-picker>`, {});
    expect((field(c.root) as any).value).toBe("#000000");
  });

  test("色块预览与 hex 文案随 liveHex 绑定", async () => {
    const { root } = await mountPicker(`<x-color-picker :value="color"></x-color-picker>`, {
      color: "#123456",
    });
    expect(styleOf(swatchOf(root))).toContain("background-color:#123456");
    expect(triggerOf(root).querySelector(".asc-color-picker-hex")?.textContent?.trim()).toBe(
      "#123456",
    );
  });
});

describe("值桥（x-model 兼容协议，ADR-0028 决策 7）", () => {
  test("x-model 双向：初值劫持 + 预设点击 → state 回写 + change detail={value}", async () => {
    const { root, engine } = await mountPicker(
      `<x-color-picker x-model="color" :presets="palette"></x-color-picker>`,
      { color: "#00ff00", palette: PRESETS },
    );
    const host = field(root);
    expect((host as any).value).toBe("#00ff00"); // 劫持 getter

    // 开面板 → 点红色预设 → input 派发 → x-model 回写 state
    triggerOf(root).dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await nextTick();
    await nextTick();
    expect(panelOf()).not.toBeNull();
    (presetsOf()[0] as HTMLElement).click();
    await nextTick();
    await nextTick();
    expect(engine.store.state.color).toBe("#ff0000");
    expect((host as any).value).toBe("#ff0000");
    expect((root.querySelector(".asc-color-picker-carrier") as HTMLInputElement).value).toBe(
      "#ff0000",
    );
  });

  test("change 冒泡 detail={value}；input 非冒泡（x-model 专用）", async () => {
    const { root } = await mountPicker(`<x-color-picker :presets="palette"></x-color-picker>`, {
      palette: PRESETS,
    });
    const events: string[] = [];
    let detail: any = null;
    root.addEventListener("change", (e: Event) => {
      events.push("change");
      detail = (e as CustomEvent).detail;
    });
    root.addEventListener("input", () => events.push("input"));
    triggerOf(root).dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await nextTick();
    await nextTick();
    (presetsOf()[1] as HTMLElement).click(); // 绿预设
    await nextTick();
    expect(events).toEqual(["change"]); // input 非冒泡（宿主自身）
    expect(detail?.value).toBe("#00ff00");
  });

  test("state→DOM 单向（value props 无 x-model）：外部状态变化 → 色块 + HSV 重建", async () => {
    const { root, engine } = await mountPicker(`<x-color-picker :value="color"></x-color-picker>`, {
      color: "#ff0000",
    });
    expect(styleOf(swatchOf(root))).toContain("background-color:#ff0000");
    engine.store.state.color = "#0000ff";
    await nextTick();
    await nextTick();
    expect(styleOf(swatchOf(root))).toContain("background-color:#0000ff");
    // HSV 重建验证：开面板看 H thumb 位置（蓝 = 240/360 = 2/3 处）
    triggerOf(root).dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await nextTick();
    await nextTick();
    const hueThumb = hueOf().querySelector(".asc-color-hue-thumb") as HTMLElement;
    expect(styleOf(hueThumb)).toContain("left:66.66");
  });

  test("劫持 setter 程序赋值：归一 + 视觉跟随（无派发）", async () => {
    const { root } = await mountPicker(`<x-color-picker></x-color-picker>`, {});
    let changeCount = 0;
    root.addEventListener("change", () => changeCount++);
    (field(root) as any).value = "#0af"; // 简写形态
    await nextTick();
    expect((field(root) as any).value).toBe("#00aaff");
    expect(styleOf(swatchOf(root))).toContain("background-color:#00aaff");
    expect(changeCount).toBe(0); // 程序赋值不派发（受控语义）
  });
});

describe("取色面板（x-popover 机制呈现）", () => {
  test("点击触发器开合（trigger:click toggle）：SV/H/hex/预设渲染 + 再点关闭", async () => {
    const { root } = await mountPicker(
      `<x-color-picker :value="color" :presets="palette"></x-color-picker>`,
      { color: "#ff0000", palette: PRESETS },
    );
    triggerOf(root).dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await nextTick();
    await nextTick();
    const panel = panelOf();
    expect(panel).not.toBeNull();
    expect(svOf()).toBeTruthy();
    expect(hueOf()).toBeTruthy();
    expect(hexInputOf()).toBeTruthy();
    expect(presetsOf().length).toBe(PRESETS.length);
    expect((hexInputOf() as HTMLInputElement).value).toBe("#ff0000");
    // 预设不渲染（presets 缺省）由下一用例覆盖；再点关闭
    triggerOf(root).dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await nextTick();
    await nextTick();
    expect(panelOf()).toBeNull(); // 关闭即销毁（无 keepalive）
  });

  test("presets 缺省：色板区不渲染；面板外点击与 ESC 关闭（机制继承）", async () => {
    const a = await mountPicker(`<x-color-picker :value="color"></x-color-picker>`, {
      color: "#ff0000",
    });
    triggerOf(a.root).dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await nextTick();
    await nextTick();
    expect(panelOf()?.querySelector(".asc-color-presets")).toBeNull();
    document.body.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await nextTick();
    await nextTick();
    expect(panelOf()).toBeNull();
    a.engine.destroy();
    engines.splice(engines.indexOf(a.engine), 1);

    const b = await mountPicker(`<x-color-picker :value="color"></x-color-picker>`, {
      color: "#ff0000",
    });
    triggerOf(b.root).dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await nextTick();
    await nextTick();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await nextTick();
    await nextTick();
    expect(panelOf()).toBeNull();
  });

  test("SV 拖拽：pointerdown 吸附 + move 实时改色 + up 提交（change 恒一次在松手）", async () => {
    const { root } = await mountPicker(`<x-color-picker :value="color"></x-color-picker>`, {
      color: "#ff0000",
    });
    let changeCount = 0;
    let lastDetail: any = null;
    root.addEventListener("change", (e: Event) => {
      changeCount++;
      lastDetail = (e as CustomEvent).detail;
    });
    triggerOf(root).dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await nextTick();
    await nextTick();
    const sv = svOf();
    stubRect(sv, 200, 100);
    // 按下：吸附 (150, 25) → s=0.75, v=0.75（实时改色、不派发）
    pointer(sv, "pointerdown", 150, 25);
    await nextTick();
    expect(changeCount).toBe(0); // 拖拽中不派发（提交恒在 pointerup）
    expect(swatchOf(root).getAttribute("style")).not.toContain("#ff0000");
    // 移动到 (100, 0) → s=0.5, v=1
    pointer(sv, "pointermove", 100, 0);
    await nextTick();
    expect(changeCount).toBe(0);
    // 松手 → 提交一次（s=0.5, v=1, h=0 → rgb(255,128,128) = #ff8080）
    pointer(sv, "pointerup", 100, 0);
    await nextTick();
    await nextTick();
    expect(changeCount).toBe(1);
    expect(lastDetail?.value).toBe("#ff8080");
  });

  test("H 拖拽：色相条横向 → h 写入 + SV 底色跟随", async () => {
    const { root } = await mountPicker(`<x-color-picker :value="color"></x-color-picker>`, {
      color: "#ff0000",
    });
    triggerOf(root).dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await nextTick();
    await nextTick();
    const hue = hueOf();
    stubRect(hue, 360, 10);
    pointer(hue, "pointerdown", 120, 5); // 1/3 处 → h=120（绿）
    await nextTick();
    const sv = svOf();
    expect(styleOf(sv)).toContain("background-color:#00ff00"); // hueColor 跟随
    const hueThumb = hue.querySelector(".asc-color-hue-thumb") as HTMLElement;
    expect(styleOf(hueThumb)).toContain("left:33.33");
    pointer(hue, "pointerup", 120, 5);
    await nextTick();
    await nextTick();
    expect((root.querySelector(".asc-color-picker-carrier") as HTMLInputElement).value).toBe(
      "#00ff00",
    );
  });

  test("预设点击：应用 + data-active 高亮 + 不关面板（连续试色）", async () => {
    const { root } = await mountPicker(
      `<x-color-picker :value="color" :presets="palette"></x-color-picker>`,
      { color: "#ffffff", palette: PRESETS },
    );
    triggerOf(root).dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await nextTick();
    await nextTick();
    expect(presetsOf()[3].hasAttribute("data-active")).toBe(true); // #ffffff 当前色
    (presetsOf()[0] as HTMLElement).click(); // 红
    await nextTick();
    await nextTick();
    expect(panelOf()).not.toBeNull(); // 不关面板
    expect(presetsOf()[0].hasAttribute("data-active")).toBe(true);
    expect(presetsOf()[3].hasAttribute("data-active")).toBe(false);
    expect(styleOf(swatchOf(root))).toContain("background-color:#ff0000");
  });

  test("hex 输入：合法应用（简写归一）；非法回显当前色不应用", async () => {
    const { root } = await mountPicker(`<x-color-picker :value="color"></x-color-picker>`, {
      color: "#123456",
    });
    triggerOf(root).dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await nextTick();
    await nextTick();
    let changeCount = 0;
    root.addEventListener("change", () => changeCount++);
    // 合法简写
    const input = hexInputOf();
    input.value = "#0af";
    input.dispatchEvent(new Event("change", { bubbles: true }));
    await nextTick();
    await nextTick();
    expect(changeCount).toBe(1);
    expect((root.querySelector(".asc-color-picker-carrier") as HTMLInputElement).value).toBe(
      "#00aaff",
    );
    // 非法：回显当前色、不应用不派发
    const input2 = hexInputOf();
    input2.value = "zzz";
    input2.dispatchEvent(new Event("change", { bubbles: true }));
    await nextTick();
    await nextTick();
    expect(changeCount).toBe(1);
    expect((hexInputOf() as HTMLInputElement).value).toBe("#00aaff");
  });

  test("HSV 转换正确性：thumb 定位（#ff0000 → SV 右上 + H 左端）", async () => {
    const { root } = await mountPicker(`<x-color-picker :value="color"></x-color-picker>`, {
      color: "#ff0000",
    });
    triggerOf(root).dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await nextTick();
    await nextTick();
    const svThumb = svOf().querySelector(".asc-color-sv-thumb") as HTMLElement;
    expect(styleOf(svThumb)).toContain("left:100%"); // s=1
    expect(styleOf(svThumb)).toContain("top:0%"); // v=1
    const hueThumb = hueOf().querySelector(".asc-color-hue-thumb") as HTMLElement;
    expect(styleOf(hueThumb)).toContain("left:0%"); // h=0
  });

  test("disabled：触发器 pointer-events 拦截 + tabindex 退出焦点序 + 载体出表", async () => {
    const { root } = await mountPicker(
      `<x-color-picker :value="color" disabled="true"></x-color-picker>`,
      { color: "#ff0000" },
    );
    const host = field(root);
    expect(host.hasAttribute("data-disabled")).toBe(true); // 骨架通道反射
    expect(triggerOf(root).tabIndex).toBe(-1);
    expect((root.querySelector(".asc-color-picker-carrier") as HTMLInputElement).disabled).toBe(
      true,
    );
  });
});
