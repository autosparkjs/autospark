/**
 * input-number 组件插件测试（组件库 P1 form 批轻件，ADR-0018 决策 7 原生增强）：
 * - 注册面：input-number 模板入全局组件表（副作用导入内嵌 base-field 注册，继承链
 *   input-number → base-field → autospark.base）+ 复制 input 结构（非嵌套消费）；
 * - 化身渲染：骨架 class 拼接（.asc-field + .asc-input-number + 盒饰 .asc-field-box）、
 *   原生控件（inputmode=decimal + role=spinbutton + data-autospark-control）、
 *   步进钮组（controls 开关）；
 * - 步进：点击上/下钮（step 步进 + min/max 夹取 + precision 修约 + change
 *   detail={value} + 边界顶死不派发）、键盘 ArrowUp/ArrowDown；
 * - 值桥（x-model 兼容协议，数字语域）：初始注入（expando 快照）、DOM→state
 *   （原生 input 冒泡 + capture 先行）、state→DOM（劫持 setter）、value props
 *   单向同步、等值短路（输入中间态保护）；
 * - change 归位：blur/Enter 夹取 + 修约 + 规范文本 + 重派发 detail；NaN 防御
 *   （非法字符保持旧值、清空归 null）；
 * - BaseField 骨架通道（经 input-number 实例化消费）：disabled/readonly 同步、
 *   name 透传（原生直提交载体）。
 */
import "../../setup";
import { describe, expect, test } from "bun:test";
import { AutoSpark } from "autospark";
import { mount, nextTick } from "../../helpers";
import {
  INPUT_NUMBER_NAME,
  bootstrapInputNumberPlugin,
} from "../../../components/form/input-number/index";
import { BASE_FIELD_NAME } from "../../../components/base/base-field/index";

/** 取全局表模板（空白归一——oxfmt 折行使逐字匹配假红） */
const tpl = (name: string) =>
  ((AutoSpark as { components: Record<string, string> }).components[name] as string).replace(
    /\s+/g,
    " ",
  );

/** 取实例化后的宿主（.asc-field 骨架根） */
const field = (root: HTMLElement) => root.querySelector(".asc-field") as HTMLElement;
/** 取内层原生控件 */
const nativeOf = (root: HTMLElement) =>
  root.querySelector(".asc-input-number-native") as HTMLInputElement | null;

describe("注册面（ADR-0018 / ADR-0020）", () => {
  test("模块加载即注册：input-number 以副作用导入内嵌 base-field，双模板均入全局组件表", () => {
    const table = (AutoSpark as { components: Record<string, string> }).components;
    expect(typeof table[INPUT_NUMBER_NAME]).toBe("string");
    expect(typeof table[BASE_FIELD_NAME]).toBe("string");
    expect(tpl(INPUT_NUMBER_NAME)).toContain(`x-define="${INPUT_NUMBER_NAME}"`);
    expect(tpl(INPUT_NUMBER_NAME)).toContain('x-define:inherit="autospark.base-field"'); // 继承链子端
    expect(tpl(INPUT_NUMBER_NAME)).not.toContain("x-component:autospark.input"); // 复制结构而非嵌套消费
  });

  test("bootstrap 幂等：重复调用不覆盖（同键赋值幂等）", () => {
    const table = (AutoSpark as { components: Record<string, string> }).components;
    const before = table[INPUT_NUMBER_NAME];
    bootstrapInputNumberPlugin();
    expect(table[INPUT_NUMBER_NAME]).toBe(before);
  });

  test("样式通道：三级回退链与暗色兜底变体均在模板中（ADR-0129）", () => {
    const t = tpl(INPUT_NUMBER_NAME);
    expect(t).toContain("var(--auto-input-placeholder, var(--asc-input-number-placeholder,");
    expect(t).toContain("[dark] .asc-input-number-step,");
    expect(t).toContain("[data-dark] .asc-input-number-btn");
  });
});

describe("化身渲染与 props 同步", () => {
  test("骨架 class 拼接（盒饰类）+ 原生控件标记 + 步进钮组在场", async () => {
    const { root } = mount(
      `<span x-component:autospark.input-number="{ value: 5, placeholder: '请输入数量' }"></span>`,
      {},
    );
    await nextTick();
    const host = field(root);
    expect(host.classList.contains("asc-field")).toBe(true); // base-field 骨架类
    expect(host.classList.contains("asc-input-number")).toBe(true);
    expect(host.classList.contains("asc-field-box")).toBe(true); // 盒饰选配类（input 类控件 chrome）
    const input = nativeOf(root)!;
    expect(input.tagName).toBe("INPUT");
    expect(input.getAttribute("inputmode")).toBe("decimal"); // 数字键盘联动
    expect(input.getAttribute("role")).toBe("spinbutton"); // 自持语义
    expect(input.hasAttribute("data-autospark-control")).toBe(true); // 标记协议挂点
    expect(input.value).toBe("5"); // 非受控初值
    expect(input.placeholder).toBe("请输入数量");
    expect(host.querySelector(".asc-input-number-up")).toBeTruthy(); // 步进钮组（缺省开）
    expect(host.querySelector(".asc-input-number-down")).toBeTruthy();
  });

  test("controls=false：步进钮组不渲染（纯数字输入形态）", async () => {
    const { root } = mount(
      `<span x-component:autospark.input-number="{ controls: false }"></span>`,
      {},
    );
    await nextTick();
    expect(field(root).querySelector(".asc-input-number-step")).toBeNull();
  });

  test("min/max 同步 aria 边界 + name 透传（原生直提交载体）", async () => {
    const { root } = mount(
      `<span name="qty" x-component:autospark.input-number="{ min: 0, max: 10, value: 3 }"></span>`,
      {},
    );
    await nextTick();
    const input = nativeOf(root)!;
    expect(input.getAttribute("aria-valuemin")).toBe("0");
    expect(input.getAttribute("aria-valuemax")).toBe("10");
    expect(input.getAttribute("aria-valuenow")).toBe("3");
    expect(input.getAttribute("name")).toBe("qty"); // 宿主 name 透传到原生控件
  });
});

describe("步进", () => {
  test("点击上/下钮：step 步进 + 双派发（input→x-model 回写 + change detail）", async () => {
    const { root, engine } = mount(
      `<span x-model.number="num" x-component:autospark.input-number="{ value: 5, min: 0, max: 10 }"></span>`,
      { num: 5 },
    );
    await nextTick();
    const host = field(root);
    let detail: any = null;
    host.addEventListener("change", (e) => {
      detail = (e as CustomEvent).detail;
    });
    host.querySelector(".asc-input-number-up")!.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }),
    );
    await nextTick();
    expect(nativeOf(root)!.value).toBe("6");
    expect(engine.store.state.num).toBe(6); // input 派发 → x-model 回写
    expect(detail && detail.value === 6).toBe(true); // change detail = { value }
    host.querySelector(".asc-input-number-down")!.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }),
    );
    await nextTick();
    expect(nativeOf(root)!.value).toBe("5");
  });

  test("夹取：越上界顶死不派发；空值步进从 min 起", async () => {
    const { root } = mount(
      `<span x-component:autospark.input-number="{ value: 10, min: 2, max: 10 }"></span>`,
      {},
    );
    await nextTick();
    const host = field(root);
    let changed = 0;
    host.addEventListener("change", () => {
      changed++;
    });
    host.querySelector(".asc-input-number-up")!.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }),
    );
    await nextTick();
    expect(nativeOf(root)!.value).toBe("10"); // 顶死
    expect(changed).toBe(0); // 不派发

    const { root: r2 } = mount(
      `<span x-component:autospark.input-number="{ min: 2, max: 10 }"></span>`,
      {},
    );
    await nextTick();
    field(r2).querySelector(".asc-input-number-up")!.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }),
    );
    await nextTick();
    expect(nativeOf(r2)!.value).toBe("3"); // 空值基值 = min(2) + step(1)
  });

  test("precision 修约：步进与显示均按固定小数位", async () => {
    const { root } = mount(
      `<span x-component:autospark.input-number="{ value: 0, step: 0.1, precision: 2 }"></span>`,
      {},
    );
    await nextTick();
    field(root).querySelector(".asc-input-number-up")!.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }),
    );
    await nextTick();
    expect(nativeOf(root)!.value).toBe("0.10");
  });

  test("键盘 ArrowUp/ArrowDown 步进（默认行为阻断）", async () => {
    const { root } = mount(
      `<span x-component:autospark.input-number="{ value: 5 }"></span>`,
      {},
    );
    await nextTick();
    const input = nativeOf(root)!;
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true, cancelable: true }));
    await nextTick();
    expect(input.value).toBe("6");
    let prevented = false;
    field(root).addEventListener("keydown", (e) => {
      prevented = e.defaultPrevented;
    });
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true }));
    await nextTick();
    expect(input.value).toBe("5");
    expect(prevented).toBe(true);
  });

  test("disabled / readonly 阻断步进", async () => {
    const { root } = mount(
      `<span x-component:autospark.input-number="{ value: 5, disabled: true }"></span>`,
      {},
    );
    await nextTick();
    field(root).querySelector(".asc-input-number-up")!.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }),
    );
    await nextTick();
    expect(nativeOf(root)!.value).toBe("5");

    const { root: r2 } = mount(
      `<span x-component:autospark.input-number="{ value: 5, readonly: true }"></span>`,
      {},
    );
    await nextTick();
    field(r2).querySelector(".asc-input-number-up")!.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }),
    );
    await nextTick();
    expect(nativeOf(r2)!.value).toBe("5");
  });
});

describe("值桥（x-model 兼容协议，数字语域）", () => {
  test("初始注入：x-model 编译期写入（expando）经劫持快照落到原生控件", async () => {
    const { root } = mount(
      `<span x-model.number="num" x-component:autospark.input-number></span>`,
      { num: 42 },
    );
    await nextTick();
    expect(nativeOf(root)!.value).toBe("42");
  });

  test("DOM→state：原生 input 事件冒泡过宿主，x-model 读劫持 el.value 回写", async () => {
    const { root, engine } = mount(
      `<span x-model.number="num" x-component:autospark.input-number></span>`,
      { num: 0 },
    );
    await nextTick();
    const input = nativeOf(root)!;
    input.value = "7";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await nextTick();
    expect(engine.store.state.num).toBe(7);
  });

  test("输入中间态自由：合法即缓存不夹取（999 超 max 显示原样），state 随动", async () => {
    const { root, engine } = mount(
      `<span x-model.number="num" x-component:autospark.input-number="{ max: 10 }"></span>`,
      { num: 1 },
    );
    await nextTick();
    const input = nativeOf(root)!;
    input.value = "999";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await nextTick();
    expect(engine.store.state.num).toBe(999); // 输入过程不夹取（change 归位才夹）
    expect(input.value).toBe("999"); // 显示原样
  });

  test("state→DOM：状态变更经劫持 setter 写回原生控件", async () => {
    const { root, engine } = mount(
      `<span x-model.number="num" x-component:autospark.input-number></span>`,
      { num: 1 },
    );
    await nextTick();
    engine.store.state.num = 8;
    await nextTick();
    expect(nativeOf(root)!.value).toBe("8");
  });

  test("value props 单向同步（无 x-model）：外部状态变化经 watch 写控件", async () => {
    const { root, engine } = mount(
      `<span x-component:autospark.input-number="{ value: qty, min: 0, max: 10 }"></span>`,
      { qty: 3 },
    );
    await nextTick();
    expect(nativeOf(root)!.value).toBe("3");
    engine.store.state.qty = 9;
    await nextTick();
    expect(nativeOf(root)!.value).toBe("9");
  });

  test("劫持 getter 数字语域：空值为空串（配 .number 修饰符语义）", async () => {
    const { root } = mount(`<span x-component:autospark.input-number></span>`, {});
    await nextTick();
    const host = field(root);
    expect(host.value).toBe(""); // 空态
    host.value = 12; // 劫持 setter（外部程序写）
    expect(host.value).toBe("12");
    expect(nativeOf(root)!.value).toBe("12");
  });
});

describe("change 归位与 NaN 防御", () => {
  test("change（blur/Enter）：夹取 + 修约 + 规范文本 + 重派发 detail={value}", async () => {
    const { root } = mount(
      `<span x-component:autospark.input-number="{ min: 0, max: 10, precision: 1, value: 5 }"></span>`,
      {},
    );
    await nextTick();
    const host = field(root);
    let detail: any = null;
    host.addEventListener("change", (e) => {
      detail = (e as CustomEvent).detail;
    });
    const input = nativeOf(root)!;
    input.value = "999";
    input.dispatchEvent(new Event("change", { bubbles: true }));
    await nextTick();
    expect(input.value).toBe("10.0"); // 夹取 + 修约规范文本（precision=1 固定小数位）
    expect(detail && detail.value === 10).toBe(true); // 重派发 detail（值域 number）
  });

  test("非法字符保持旧值（输入过程）；清空归 null（getter 空串）", async () => {
    const { root, engine } = mount(
      `<span x-model.number="num" x-component:autospark.input-number="{ value: 5 }"></span>`,
      { num: 5 },
    );
    await nextTick();
    const input = nativeOf(root)!;
    input.value = "abc";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await nextTick();
    expect(field(root).value).toBe("5"); // 非法保持旧值

    input.value = "";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await nextTick();
    expect(field(root).value).toBe(""); // 清空归空（组件语域空串）
    expect(engine.store.state.num).toBe(0); // x-model.number 对空串的引擎语义（回写已发生：5 → 0）
  });

  test("props.value 非法（NaN）防御：忽略保持空态", async () => {
    const { root } = mount(
      `<span x-component:autospark.input-number="{ value: NaN }"></span>`,
      {},
    );
    await nextTick();
    expect(nativeOf(root)!.value).toBe("");
    expect(field(root).value).toBe("");
  });
});

describe("BaseField 骨架通道（经 input-number 实例化消费，ADR-0020）", () => {
  test("disabled：同步原生控件 + 宿主 data-disabled；readonly 同理", async () => {
    const { root } = mount(
      `<span x-component:autospark.input-number="{ readonly: true }"></span>`,
      {},
    );
    await nextTick();
    const host = field(root);
    const input = nativeOf(root) as HTMLInputElement;
    expect(input.readOnly).toBe(true);
    expect(input.disabled).toBe(false);
    expect(host.hasAttribute("data-readonly")).toBe(true);
    expect(host.hasAttribute("data-disabled")).toBe(false);
  });

  test("status 状态色：宿主 data-status 通道（CSS 染色由骨架承担）", async () => {
    const { root, engine } = mount(
      `<span x-component:autospark.input-number="{ status: st }"></span>`,
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
