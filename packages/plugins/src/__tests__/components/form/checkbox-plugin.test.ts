/**
 * checkbox 组件插件测试（组件库 P0 form 批轻件，ADR-0019 合批 / ADR-0020 BaseField
 * 消费契约）：
 * - 注册面：checkbox 模板入全局组件表（副作用导入内嵌 base-field 注册，继承链
 *   checkbox → base-field → autospark.base）；
 * - 化身渲染：骨架 class 拼接（.asc-field + .asc-checkbox，裸态无 .asc-field-box）、
 *   真实原生 input[type=checkbox] + data-autospark-control 标记、label 插槽兜底/覆盖、
 *   name 透传（原生直提交载体）；
 * - 值桥（x-model 兼容协议，布尔语域）：初始注入（expando 快照）、DOM→state（原生
 *   change → 宿主 input 派发 → x-model 回写，.boolean 类型保真）、state→DOM（劫持
 *   setter 按值勾选）、checked props 单向同步；
 * - indeterminate 半选态（JS 通道设原生属性）；
 * - BaseField 骨架通道（经 checkbox 实例化消费）：disabled 同步 + data-disabled、
 *   status 状态色 + aria-invalid、焦点态追踪、原生 change 冒泡供外层 @change。
 */
import "../../setup";
import { describe, expect, test } from "bun:test";
import { AutoSpark } from "autospark";
import { mount, nextTick } from "../../helpers";
import { CHECKBOX_NAME, bootstrapCheckboxPlugin } from "../../../components/form/checkbox/index";
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
  root.querySelector(".asc-checkbox-input") as HTMLInputElement | null;

describe("注册面（ADR-0019 合批 / ADR-0020）", () => {
  test("模块加载即注册：checkbox 以副作用导入内嵌 base-field，双模板均入全局组件表", () => {
    const table = (AutoSpark as { components: Record<string, string> }).components;
    expect(typeof table[CHECKBOX_NAME]).toBe("string");
    expect(typeof table[BASE_FIELD_NAME]).toBe("string");
    expect(tpl(CHECKBOX_NAME)).toContain(`x-define="${CHECKBOX_NAME}"`);
    expect(tpl(CHECKBOX_NAME)).toContain('x-define:inherit="autospark.base-field"'); // 继承链子端
    expect(tpl(CHECKBOX_NAME)).toContain('type="checkbox"'); // 真实原生控件（原生增强路线）
  });

  test("bootstrap 幂等：重复调用不覆盖（同键赋值幂等）", () => {
    const table = (AutoSpark as { components: Record<string, string> }).components;
    const before = table[CHECKBOX_NAME];
    bootstrapCheckboxPlugin();
    expect(table[CHECKBOX_NAME]).toBe(before);
  });

  test("样式通道：勾形/半选/暗色兜底选择器均在模板中（ADR-0129 三级回退链）", () => {
    const t = tpl(CHECKBOX_NAME);
    expect(t).toContain("--asc-field-tone"); // 状态色/开态语义色经骨架 tone 通道消费
    expect(t).toContain(".asc-checkbox-box:has(> .asc-checkbox-input:checked)"); // 勾选视觉（原生伪类驱动）
    expect(t).toContain(".asc-checkbox-box:has(> .asc-checkbox-input:indeterminate)"); // 半选视觉
    expect(t).toContain("var(--auto-border-color, var(--asc-checkbox-border,"); // 三级回退链
    expect(t).toContain("[dark] .asc-checkbox-box,"); // 暗色兜底变体
  });
});

describe("化身渲染与 props 同步", () => {
  test("骨架 class 拼接（裸态无盒饰）+ 真实原生 checkbox + 控件标记", async () => {
    const { root } = mount(
      `<span x-component:autospark.checkbox="{ label: '苹果' }"></span>`,
      {},
    );
    await nextTick();
    const host = field(root);
    expect(host.classList.contains("asc-field")).toBe(true); // base-field 骨架类
    expect(host.classList.contains("asc-checkbox")).toBe(true); // 子组件类（根属性并入拼接）
    expect(host.classList.contains("asc-field-box")).toBe(false); // 裸态控件不加盒饰（ADR-0020 决策 3）
    const input = nativeOf(root) as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.type).toBe("checkbox");
    expect(input.hasAttribute("data-autospark-control")).toBe(true); // 标记协议挂点（骨架同步目标）
    expect(input.value).toBe("true"); // 提交值（原生 checkbox 语义：勾选提交 name=true）
  });

  test("label props 兜底渲染；消费者内容经 base-field 出口整段替换控件区（逃生通道）", async () => {
    const { root } = mount(
      `<div><span x-component:autospark.checkbox="{ label: '苹果' }"></span><span x-component:autospark.checkbox>自定义内容</span></div>`,
      {},
    );
    await nextTick();
    const hosts = root.querySelectorAll(".asc-checkbox");
    expect(hosts[0]!.querySelector(".asc-checkbox-label")!.textContent).toBe("苹果"); // props 兜底
    // 继承形态下嵌套 x-slot 被忽略（ADR-0056）：消费者内容替换 .asc-field-body 出口内容（input 同款语义）
    const body = hosts[1]!.querySelector(".asc-field-body")!;
    expect(body.textContent).toBe("自定义内容");
    expect(hosts[1]!.querySelector(".asc-checkbox-input")).toBeNull(); // 控件区被整段替换（逃生通道）
  });

  test("name 透传：宿主 name 落原生控件（原生直提交载体，ADR-0020 决策 6）", async () => {
    const { root } = mount(`<span name="agree" x-component:autospark.checkbox></span>`, {});
    await nextTick();
    expect(nativeOf(root)!.getAttribute("name")).toBe("agree");
  });
});

describe("值桥（x-model 兼容协议，布尔语域）", () => {
  test("初始注入：x-model 编译期写入（expando）经劫持快照落到原生勾选", async () => {
    const { root } = mount(`<span x-model="agree" x-component:autospark.checkbox></span>`, {
      agree: true,
    });
    await nextTick();
    expect(nativeOf(root)!.checked).toBe(true);
  });

  test("初始注入 false：expando \"false\" 归未勾选", async () => {
    const { root } = mount(`<span x-model="agree" x-component:autospark.checkbox></span>`, {
      agree: false,
    });
    await nextTick();
    expect(nativeOf(root)!.checked).toBe(false);
  });

  test("checked props 非受控初值（无 x-model）", async () => {
    const { root } = mount(`<span x-component:autospark.checkbox="{ checked: true }"></span>`, {});
    await nextTick();
    expect(nativeOf(root)!.checked).toBe(true);
  });

  test("DOM→state：原生 change 冒泡过宿主派发 input，x-model.boolean 保真回写", async () => {
    const { root, engine } = mount(
      `<span x-model.boolean="agree" x-component:autospark.checkbox></span>`,
      { agree: false },
    );
    await nextTick();
    const input = nativeOf(root)!;
    input.checked = true;
    input.dispatchEvent(new Event("change", { bubbles: true })); // happy-dom 点击不派发 change，手动派发
    await nextTick();
    expect(engine.store.state.agree).toBe(true); // 布尔语域 + .boolean 类型保真
    expect(field(root).value).toBe("true"); // 劫持 getter 读原生勾选
  });

  test("DOM→state 无 .boolean：state 为 \"true\" 字符串（x-model 惯用法自担）", async () => {
    const { root, engine } = mount(`<span x-model="agree" x-component:autospark.checkbox></span>`, {
      agree: false,
    });
    await nextTick();
    const input = nativeOf(root)!;
    input.checked = true;
    input.dispatchEvent(new Event("change", { bubbles: true }));
    await nextTick();
    expect(engine.store.state.agree).toBe("true");
  });

  test("state→DOM：状态变更经劫持 setter 写回原生勾选（含取消）", async () => {
    const { root, engine } = mount(`<span x-model="agree" x-component:autospark.checkbox></span>`, {
      agree: true,
    });
    await nextTick();
    expect(nativeOf(root)!.checked).toBe(true);
    engine.store.state.agree = false;
    await nextTick();
    expect(nativeOf(root)!.checked).toBe(false);
  });

  test("checked props 单向同步（无 x-model）：外部状态变化经 watch 写勾选", async () => {
    const { root, engine } = mount(`<span x-component:autospark.checkbox="{ checked: flag }"></span>`, {
      flag: false,
    });
    await nextTick();
    expect(nativeOf(root)!.checked).toBe(false);
    engine.store.state.flag = true;
    await nextTick();
    expect(nativeOf(root)!.checked).toBe(true);
  });
});

describe("indeterminate 半选态", () => {
  test("JS 通道设原生 indeterminate 属性（无 HTML 属性形态）+ watch 跟随", async () => {
    const { root, engine } = mount(
      `<span x-component:autospark.checkbox="{ indeterminate: half }"></span>`,
      { half: true },
    );
    await nextTick();
    const input = nativeOf(root)!;
    expect(input.indeterminate).toBe(true); // 初始注入
    expect(input.checked).toBe(false); // 半选与勾选正交
    engine.store.state.half = false;
    await nextTick();
    expect(input.indeterminate).toBe(false); // watch 跟随
  });
});

describe("BaseField 骨架通道（经 checkbox 实例化消费，ADR-0020）", () => {
  test("disabled：同步原生控件 + 宿主 data-disabled（整体淡化通道）", async () => {
    const { root } = mount(`<span x-component:autospark.checkbox="{ disabled: true }"></span>`, {});
    await nextTick();
    const host = field(root);
    expect(nativeOf(root)!.disabled).toBe(true);
    expect(host.hasAttribute("data-disabled")).toBe(true);
  });

  test("status 状态色：宿主 data-status + error 态控件 aria-invalid", async () => {
    const { root, engine } = mount(`<span x-component:autospark.checkbox="{ status: st }"></span>`, {
      st: "",
    });
    await nextTick();
    const host = field(root);
    expect(host.hasAttribute("data-status")).toBe(false);
    engine.store.state.st = "error";
    await nextTick();
    expect(host.getAttribute("data-status")).toBe("error");
    expect(nativeOf(root)!.getAttribute("aria-invalid")).toBe("true"); // 可访问性同步
  });

  test("焦点态追踪：focusin 挂 data-focus，focusout 摘除", async () => {
    const { root } = mount(`<span x-component:autospark.checkbox></span>`, {});
    await nextTick();
    const host = field(root);
    const input = nativeOf(root)!;
    input.dispatchEvent(new Event("focusin", { bubbles: true }));
    await nextTick();
    expect(host.hasAttribute("data-focus")).toBe(true);
    input.dispatchEvent(new Event("focusout", { bubbles: true }));
    await nextTick();
    expect(host.hasAttribute("data-focus")).toBe(false);
  });

  test("原生 change 冒泡供外层 @change 消费（组件不拦截原生事件面）", async () => {
    const { root, engine } = mount(
      `<span @change="fired = true" x-component:autospark.checkbox></span>`,
      { fired: false },
    );
    await nextTick();
    const input = nativeOf(root)!;
    input.checked = true;
    input.dispatchEvent(new Event("change", { bubbles: true }));
    await nextTick();
    expect(engine.store.state.fired).toBe(true); // 原生 change 冒泡到外层
  });
});
