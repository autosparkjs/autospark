/**
 * radio 组件插件测试（组件库 P0 form 批轻件，ADR-0019 合批 / ADR-0020 BaseField
 * 消费契约）：
 * - 注册面：radio 模板入全局组件表（副作用导入内嵌 base-field 注册，继承链
 *   radio → base-field → autospark.base）；
 * - 化身渲染：骨架 class 拼接（裸态无盒饰）、真实原生 input[type=radio] +
 *   data-autospark-control 标记、label props 兜底、value/name 透传；
 * - 组语义（原生 name 同名互斥，不建组容器组件）：同 x-model 路径多枚经引擎缺省
 *   name 注入天然同组——勾选互斥 + 值桥按值匹配；
 * - 值桥（checked 值桥）：初始注入（expando 按值匹配）、DOM→state（原生 change →
 *   仅勾选态派发 input → x-model 回写 state = 本钮值）、state→DOM（按值匹配勾选）、
 *   checked props 单向同步；
 * - BaseField 骨架通道（经 radio 实例化消费）：disabled 同步、status 状态色 +
 *   aria-invalid、焦点态追踪。
 */
import "../../setup";
import { describe, expect, test } from "bun:test";
import { AutoSpark } from "autospark";
import { mount, nextTick } from "../../helpers";
import { RADIO_NAME, bootstrapRadioPlugin } from "../../../components/form/radio/index";
import { BASE_FIELD_NAME } from "../../../components/base/base-field/index";

/** 取全局表模板（空白归一——oxfmt 折行使逐字匹配假红） */
const tpl = (name: string) =>
  ((AutoSpark as { components: Record<string, string> }).components[name] as string).replace(
    /\s+/g,
    " ",
  );

/** 取实例化后的宿主（.asc-field 骨架根） */
const field = (root: HTMLElement) => root.querySelector(".asc-field") as HTMLElement;
/** 取全部内层原生控件（组场景多枚） */
const nativesOf = (root: HTMLElement) =>
  Array.from(root.querySelectorAll(".asc-radio-input")) as HTMLInputElement[];

describe("注册面（ADR-0019 合批 / ADR-0020）", () => {
  test("模块加载即注册：radio 以副作用导入内嵌 base-field，双模板均入全局组件表", () => {
    const table = (AutoSpark as { components: Record<string, string> }).components;
    expect(typeof table[RADIO_NAME]).toBe("string");
    expect(typeof table[BASE_FIELD_NAME]).toBe("string");
    expect(tpl(RADIO_NAME)).toContain(`x-define="${RADIO_NAME}"`);
    expect(tpl(RADIO_NAME)).toContain('x-define:inherit="autospark.base-field"'); // 继承链子端
    expect(tpl(RADIO_NAME)).toContain('type="radio"'); // 真实原生控件（原生增强路线）
  });

  test("bootstrap 幂等：重复调用不覆盖（同键赋值幂等）", () => {
    const table = (AutoSpark as { components: Record<string, string> }).components;
    const before = table[RADIO_NAME];
    bootstrapRadioPlugin();
    expect(table[RADIO_NAME]).toBe(before);
  });

  test("样式通道：选中圆点/暗色兜底选择器均在模板中（ADR-0129 三级回退链）", () => {
    const t = tpl(RADIO_NAME);
    expect(t).toContain("--asc-field-tone"); // 状态色/选中态语义色经骨架 tone 通道消费
    expect(t).toContain(".asc-radio-box:has(> .asc-radio-input:checked)"); // 选中视觉（原生伪类驱动）
    expect(t).toContain("var(--auto-border-color, var(--asc-radio-border,"); // 三级回退链
    expect(t).toContain("[dark] .asc-radio-box,"); // 暗色兜底变体
  });
});

describe("化身渲染与 props 同步", () => {
  test("骨架 class 拼接（裸态无盒饰）+ 真实原生 radio + 控件标记 + label 兜底", async () => {
    const { root } = mount(
      `<span x-component:autospark.radio="{ value: 'a', label: '选项 A' }"></span>`,
      {},
    );
    await nextTick();
    const host = field(root);
    expect(host.classList.contains("asc-field")).toBe(true); // base-field 骨架类
    expect(host.classList.contains("asc-radio")).toBe(true); // 子组件类（根属性并入拼接）
    expect(host.classList.contains("asc-field-box")).toBe(false); // 裸态控件不加盒饰（ADR-0020 决策 3）
    const input = nativesOf(root)[0]!;
    expect(input.type).toBe("radio");
    expect(input.hasAttribute("data-autospark-control")).toBe(true); // 标记协议挂点
    expect(input.value).toBe("a"); // 本钮值落内层（x-model 按值匹配的锚点）
    expect(host.querySelector(".asc-radio-label")!.textContent).toBe("选项 A");
  });

  test("name 透传：宿主显式 name 落原生控件（同名即组，原生互斥载体）", async () => {
    const { root } = mount(
      `<span name="city" x-component:autospark.radio="{ value: 'a' }"></span>`,
      {},
    );
    await nextTick();
    expect(nativesOf(root)[0]!.getAttribute("name")).toBe("city");
  });

  test("checked props 非受控初值（无 x-model，组内缺省勾选项）", async () => {
    const { root } = mount(
      `<span x-component:autospark.radio="{ value: 'a', checked: true }"></span>`,
      {},
    );
    await nextTick();
    expect(nativesOf(root)[0]!.checked).toBe(true);
  });
});

describe("组语义（原生 name 同名互斥，不建组容器组件）", () => {
  test("同 x-model 路径两枚：引擎缺省 name 注入天然同组，勾选互斥", async () => {
    const { root } = mount(
      `<div><span x-model="picked" x-component:autospark.radio="{ value: 'a', label: 'A' }"></span>` +
        `<span x-model="picked" x-component:autospark.radio="{ value: 'b', label: 'B' }"></span></div>`,
      { picked: "" },
    );
    await nextTick();
    const [a, b] = nativesOf(root);
    expect(a.getAttribute("name")).toBe("picked"); // x-model 缺省注入 name=路径 → 透传内层
    expect(b.getAttribute("name")).toBe("picked"); // 同名即组
    expect(a.checked).toBe(false); // 初始值 "" 不匹配任何钮
    expect(b.checked).toBe(false);
    // 勾选 b：原生同名互斥自动摘 a
    b.checked = true;
    b.dispatchEvent(new Event("change", { bubbles: true })); // happy-dom 点击不派发 change，手动派发
    await nextTick();
    expect(a.checked).toBe(false); // 原生互斥
    expect(b.checked).toBe(true);
  });
});

describe("值桥（checked 值桥，与 x-model 原生 radio 语义同构）", () => {
  test("初始注入：x-model 编译期写入（expando）按值匹配勾选本钮", async () => {
    const { root } = mount(
      `<div><span x-model="picked" x-component:autospark.radio="{ value: 'a' }"></span>` +
        `<span x-model="picked" x-component:autospark.radio="{ value: 'b' }"></span></div>`,
      { picked: "b" },
    );
    await nextTick();
    const [a, b] = nativesOf(root);
    expect(b.checked).toBe(true); // 按值匹配
    expect(a.checked).toBe(false);
  });

  test("DOM→state：原生 change（勾选态）派发 input，x-model 回写 state = 本钮值", async () => {
    const { root, engine } = mount(
      `<div><span x-model="picked" x-component:autospark.radio="{ value: 'a' }"></span>` +
        `<span x-model="picked" x-component:autospark.radio="{ value: 'b' }"></span></div>`,
      { picked: "a" },
    );
    await nextTick();
    const [, b] = nativesOf(root);
    b.checked = true;
    b.dispatchEvent(new Event("change", { bubbles: true }));
    await nextTick();
    expect(engine.store.state.picked).toBe("b"); // state = 本钮 value
    expect((root.children[0]!.children[1] as HTMLInputElement).value).toBe("b"); // 劫持 getter 读本钮值（x-model 读源）
  });

  test("DOM→state：取消态不派发（被勾选的另一枚接管——x-model 原生 radio 同款语义）", async () => {
    const { root, engine } = mount(
      `<span x-model="picked" x-component:autospark.radio="{ value: 'a' }"></span>`,
      { picked: "" },
    );
    await nextTick();
    const a = nativesOf(root)[0]!;
    a.dispatchEvent(new Event("change", { bubbles: true })); // 未勾选态的 change 直通不派发
    await nextTick();
    expect(engine.store.state.picked).toBe(""); // state 不被取消态污染
  });

  test("state→DOM：状态变更按值匹配勾选（含切换到另一枚）", async () => {
    const { root, engine } = mount(
      `<div><span x-model="picked" x-component:autospark.radio="{ value: 'a' }"></span>` +
        `<span x-model="picked" x-component:autospark.radio="{ value: 'b' }"></span></div>`,
      { picked: "a" },
    );
    await nextTick();
    const [a, b] = nativesOf(root);
    expect(a.checked).toBe(true);
    engine.store.state.picked = "b";
    await nextTick();
    expect(b.checked).toBe(true); // 新匹配项勾选
    expect(a.checked).toBe(false); // 原项失勾（值匹配语义）
  });

  test("checked props 单向同步（无 x-model）：外部状态变化经 watch 写勾选", async () => {
    const { root, engine } = mount(
      `<span x-component:autospark.radio="{ value: 'a', checked: flag }"></span>`,
      { flag: false },
    );
    await nextTick();
    expect(nativesOf(root)[0]!.checked).toBe(false);
    engine.store.state.flag = true;
    await nextTick();
    expect(nativesOf(root)[0]!.checked).toBe(true);
  });
});

describe("BaseField 骨架通道（经 radio 实例化消费，ADR-0020）", () => {
  test("disabled：同步原生控件 + 宿主 data-disabled（整体淡化通道）", async () => {
    const { root } = mount(`<span x-component:autospark.radio="{ value: 'a', disabled: true }"></span>`, {});
    await nextTick();
    const host = field(root);
    expect(nativesOf(root)[0]!.disabled).toBe(true);
    expect(host.hasAttribute("data-disabled")).toBe(true);
  });

  test("status 状态色：宿主 data-status + error 态控件 aria-invalid", async () => {
    const { root, engine } = mount(
      `<span x-component:autospark.radio="{ value: 'a', status: st }"></span>`,
      { st: "" },
    );
    await nextTick();
    const host = field(root);
    engine.store.state.st = "error";
    await nextTick();
    expect(host.getAttribute("data-status")).toBe("error");
    expect(nativesOf(root)[0]!.getAttribute("aria-invalid")).toBe("true"); // 可访问性同步
  });

  test("焦点态追踪：focusin 挂 data-focus，focusout 摘除", async () => {
    const { root } = mount(`<span x-component:autospark.radio="{ value: 'a' }"></span>`, {});
    await nextTick();
    const host = field(root);
    const input = nativesOf(root)[0]!;
    input.dispatchEvent(new Event("focusin", { bubbles: true }));
    await nextTick();
    expect(host.hasAttribute("data-focus")).toBe(true);
    input.dispatchEvent(new Event("focusout", { bubbles: true }));
    await nextTick();
    expect(host.hasAttribute("data-focus")).toBe(false);
  });
});
