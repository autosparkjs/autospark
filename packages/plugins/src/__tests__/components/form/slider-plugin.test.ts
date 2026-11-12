/**
 * slider 组件插件测试（组件库 P1 form 批轻件，ADR-0018 决策 7 原生增强）：
 * - 注册面：slider 模板入全局组件表（副作用导入内嵌 base-field 注册，继承链
 *   slider → base-field → autospark.base）+ 原生 range 覆盖层形态；
 * - 化身渲染：骨架 class 拼接（裸态无盒饰）、原生 range（data-autospark-control +
 *   min/max/step 属性同步）、自绘轨道/滑块结构；
 * - 值桥（x-model 兼容协议，数字语域）：初始注入（expando 快照）、DOM→state
 *   （原生 input 冒泡）、state→DOM（劫持 setter）、value props 单向同步；
 * - 视觉同步：--asc-slider-pos 百分比随值（min/max 归一）；
 * - change 归位：clamp 防御 + 阻断重派发 detail={value}；
 * - showInput 联动（可选实现）：内嵌 autospark.input-number 双向同步（slider→输入框
 *   写值、输入框输入→slider 取值）；
 * - BaseField 骨架通道：disabled 同步 range（原生阻断）+ 宿主反射。
 */
import "../../setup";
import { describe, expect, test } from "bun:test";
import { AutoSpark } from "autospark";
import { mount, nextTick } from "../../helpers";
import { SLIDER_NAME, bootstrapSliderPlugin } from "../../../components/form/slider/index";
import { BASE_FIELD_NAME } from "../../../components/base/base-field/index";
import "../../../components/form/input-number/index"; // showInput 联动组件（跨产物组合，测试内注册）

/** 取全局表模板（空白归一——oxfmt 折行使逐字匹配假红） */
const tpl = (name: string) =>
  ((AutoSpark as { components: Record<string, string> }).components[name] as string).replace(
    /\s+/g,
    " ",
  );

/** 取实例化后的宿主（.asc-field 骨架根） */
const field = (root: HTMLElement) => root.querySelector(".asc-field") as HTMLElement;
/** 取内层原生 range */
const rangeOf = (root: HTMLElement) =>
  root.querySelector(".asc-slider-native") as HTMLInputElement | null;
/** 取轨道（视觉变量宿主） */
const trackOf = (root: HTMLElement) => root.querySelector(".asc-slider-track") as HTMLElement | null;
/** 取 showInput 联动输入框宿主（化身后的 input-number 根） */
const numHostOf = (root: HTMLElement) =>
  root.querySelector(".asc-input-number") as HTMLElement | null;

describe("注册面（ADR-0018 / ADR-0020）", () => {
  test("模块加载即注册：slider 以副作用导入内嵌 base-field，双模板均入全局组件表", () => {
    const table = (AutoSpark as { components: Record<string, string> }).components;
    expect(typeof table[SLIDER_NAME]).toBe("string");
    expect(typeof table[BASE_FIELD_NAME]).toBe("string");
    expect(tpl(SLIDER_NAME)).toContain(`x-define="${SLIDER_NAME}"`);
    expect(tpl(SLIDER_NAME)).toContain('x-define:inherit="autospark.base-field"');
    expect(tpl(SLIDER_NAME)).toContain('type="range"'); // 原生真身（覆盖层模式）
    expect(tpl(SLIDER_NAME)).not.toContain('class="asc-field-box"'); // 裸态无盒饰
  });

  test("bootstrap 幂等：重复调用不覆盖（同键赋值幂等）", () => {
    const table = (AutoSpark as { components: Record<string, string> }).components;
    const before = table[SLIDER_NAME];
    bootstrapSliderPlugin();
    expect(table[SLIDER_NAME]).toBe(before);
  });

  test("样式通道：tone 联动与暗色兜底变体均在模板中（ADR-0129 三级回退链）", () => {
    const t = tpl(SLIDER_NAME);
    expect(t).toContain("background: var(--asc-field-tone)"); // 填充段主色（status 联动骨架 tone）
    expect(t).toContain("[dark] .asc-slider-track,");
    expect(t).toContain("--asc-slider-pos"); // 填充/滑块同源位置变量
  });
});

describe("化身渲染与 props 同步", () => {
  test("骨架 class 拼接（裸态无盒饰）+ 原生 range 属性同步（min/max/step）", async () => {
    const { root } = mount(
      `<span x-component:autospark.slider="{ min: 10, max: 20, step: 2, value: 14 }"></span>`,
      {},
    );
    await nextTick();
    const host = field(root);
    expect(host.classList.contains("asc-field")).toBe(true);
    expect(host.classList.contains("asc-slider")).toBe(true);
    expect(host.classList.contains("asc-field-box")).toBe(false); // 裸态
    const range = rangeOf(root)!;
    expect(range.tagName).toBe("INPUT");
    expect(range.type).toBe("range");
    expect(range.getAttribute("min")).toBe("10");
    expect(range.getAttribute("max")).toBe("20");
    expect(range.getAttribute("step")).toBe("2");
    expect(range.value).toBe("14");
    expect(range.hasAttribute("data-autospark-control")).toBe(true); // 骨架同步目标
    expect(trackOf(root)).toBeTruthy(); // 自绘轨道
    expect(host.querySelector(".asc-slider-thumb")).toBeTruthy(); // 自绘滑块
  });

  test("max<=min 倒界防御：max 视为 min+1（除零保护）", async () => {
    const { root } = mount(
      `<span x-component:autospark.slider="{ min: 5, max: 5, value: 5 }"></span>`,
      {},
    );
    await nextTick();
    const range = rangeOf(root)!;
    expect(range.getAttribute("max")).toBe("6");
    expect(range.value).toBe("5"); // 不抛、值有效
  });

  test("name 透传：宿主 name 落原生 range（原生直提交载体，无 hidden 代理）", async () => {
    const { root } = mount(
      `<span name="volume" x-component:autospark.slider></span>`,
      {},
    );
    await nextTick();
    expect(rangeOf(root)!.getAttribute("name")).toBe("volume");
    expect(root.querySelector("input[type=hidden]")).toBeNull(); // range 即真身
  });
});

describe("值桥（x-model 兼容协议，数字语域）", () => {
  test("初始注入：x-model 编译期写入（expando）经劫持快照落到原生 range", async () => {
    const { root } = mount(
      `<span x-model.number="vol" x-component:autospark.slider="{ min: 0, max: 100 }"></span>`,
      { vol: 30 },
    );
    await nextTick();
    expect(rangeOf(root)!.value).toBe("30");
  });

  test("DOM→state：原生 input 事件冒泡过宿主，x-model 读劫持 el.value 回写", async () => {
    const { root, engine } = mount(
      `<span x-model.number="vol" x-component:autospark.slider="{ min: 0, max: 100 }"></span>`,
      { vol: 0 },
    );
    await nextTick();
    const range = rangeOf(root)!;
    range.value = "66";
    range.dispatchEvent(new Event("input", { bubbles: true }));
    await nextTick();
    expect(engine.store.state.vol).toBe(66);
  });

  test("state→DOM：状态变更经劫持 setter 写回原生 range（clamp 防御）", async () => {
    const { root, engine } = mount(
      `<span x-model.number="vol" x-component:autospark.slider="{ min: 0, max: 100 }"></span>`,
      { vol: 0 },
    );
    await nextTick();
    engine.store.state.vol = 55;
    await nextTick();
    expect(rangeOf(root)!.value).toBe("55");
    engine.store.state.vol = 999; // 越界写入
    await nextTick();
    expect(rangeOf(root)!.value).toBe("100"); // JS 自持夹取
  });

  test("value props 单向同步（无 x-model）：外部状态变化经 watch 写 range", async () => {
    const { root, engine } = mount(
      `<span x-component:autospark.slider="{ value: vol, min: 0, max: 100 }"></span>`,
      { vol: 10 },
    );
    await nextTick();
    expect(rangeOf(root)!.value).toBe("10");
    engine.store.state.vol = 88;
    await nextTick();
    expect(rangeOf(root)!.value).toBe("88");
  });

  test("劫持 getter 数字语域：读 range 现值字符串", async () => {
    const { root } = mount(`<span x-component:autospark.slider></span>`, {});
    await nextTick();
    const host = field(root);
    expect(host.value).toBe("0"); // 缺省 min
    host.value = 42; // 劫持 setter（外部程序写）
    expect(host.value).toBe("42");
    expect(rangeOf(root)!.value).toBe("42");
  });
});

describe("视觉同步与 change 归位", () => {
  test("--asc-slider-pos 百分比随值（min/max 归一）", async () => {
    const { root } = mount(
      `<span x-component:autospark.slider="{ min: 0, max: 200, value: 50 }"></span>`,
      {},
    );
    await nextTick();
    const track = trackOf(root)!;
    expect(track.style.getPropertyValue("--asc-slider-pos")).toBe("25%"); // 50/200
    const range = rangeOf(root)!;
    range.value = "150";
    range.dispatchEvent(new Event("input", { bubbles: true }));
    await nextTick();
    expect(track.style.getPropertyValue("--asc-slider-pos")).toBe("75%"); // 拖动跟随
  });

  test("change 归位：clamp 防御 + 阻断重派发 detail={value}", async () => {
    const { root } = mount(
      `<span x-component:autospark.slider="{ min: 0, max: 100, value: 50 }"></span>`,
      {},
    );
    await nextTick();
    const host = field(root);
    let detail: any = null;
    host.addEventListener("change", (e) => {
      detail = (e as CustomEvent).detail;
    });
    const range = rangeOf(root)!;
    range.value = "80";
    range.dispatchEvent(new Event("change", { bubbles: true }));
    await nextTick();
    expect(detail && detail.value === 80).toBe(true); // 重派发 detail
    expect(range.value).toBe("80");
  });
});

describe("showInput 联动（可选实现，跨产物组合）", () => {
  test("在场渲染 autospark.input-number：初值下发 + slider 拖动→输入框同步", async () => {
    const { root } = mount(
      `<span x-component:autospark.slider="{ min: 0, max: 100, value: 30, showInput: true }"></span>`,
      {},
    );
    await nextTick();
    await nextTick(); // input-number 一跳初始化后再对齐
    const nh = numHostOf(root)!;
    expect(nh).toBeTruthy();
    expect(nh.value).toBe("30"); // 初值下发（经其劫持 setter）
    const range = rangeOf(root)!;
    range.value = "77";
    range.dispatchEvent(new Event("input", { bubbles: true }));
    await nextTick();
    expect(nh.value).toBe("77"); // 拖动联动
  });

  test("输入框确认→slider 取值（change 通道反向同步）", async () => {
    const { root } = mount(
      `<span x-component:autospark.slider="{ min: 0, max: 100, value: 30, showInput: true }"></span>`,
      {},
    );
    await nextTick();
    await nextTick();
    const nh = numHostOf(root)!;
    nh.value = "66"; // 写 input-number 劫持 setter（更新其控件显示）
    nh.dispatchEvent(new Event("input", { bubbles: false })); // 其 input 派发非冒泡在自身
    await nextTick();
    expect(rangeOf(root)!.value).toBe("66"); // slider 反向取值
    expect(trackOf(root)!.style.getPropertyValue("--asc-slider-pos")).toBe("66%");
  });

  test("缺省不渲染联动框", async () => {
    const { root } = mount(`<span x-component:autospark.slider></span>`, {});
    await nextTick();
    expect(numHostOf(root)).toBeNull();
  });
});

describe("BaseField 骨架通道（经 slider 实例化消费，ADR-0020）", () => {
  test("disabled：同步原生 range（原生阻断）+ 宿主 data-disabled；readonly 反射", async () => {
    const { root } = mount(
      `<span x-component:autospark.slider="{ disabled: true }"></span>`,
      {},
    );
    await nextTick();
    const host = field(root);
    expect(rangeOf(root)!.disabled).toBe(true); // 原生阻断
    expect(host.hasAttribute("data-disabled")).toBe(true);

    const { root: r2 } = mount(
      `<span x-component:autospark.slider="{ readonly: true }"></span>`,
      {},
    );
    await nextTick();
    expect(field(r2).hasAttribute("data-readonly")).toBe(true); // 反射（交互阻断走 CSS 通道）
  });

  test("status 状态色：宿主 data-status 通道（tone 联动填充段/滑块）", async () => {
    const { root, engine } = mount(
      `<span x-component:autospark.slider="{ status: st }"></span>`,
      { st: "" },
    );
    await nextTick();
    const host = field(root);
    expect(host.hasAttribute("data-status")).toBe(false);
    engine.store.state.st = "error";
    await nextTick();
    expect(host.getAttribute("data-status")).toBe("error");
  });
});
