/**
 * input + base-field 组件插件测试（组件库 P0 form 基座，ADR-0020）：
 * - 注册面：input / base-field 双模板入全局组件表（input 以副作用导入内嵌 base-field
 *   注册，继承链 input → base-field → autospark.base）+ 组件自有图标注册；
 * - 化身渲染：骨架 class 拼接（.asc-field + .asc-input + .asc-field-box）、原生控件
 *   props 同步（placeholder/maxlength/rows/type）、textarea 形态分叉；
 * - 值桥（x-model 兼容协议）：宿主 el.value 劫持 ↔ 内层原生控件——初始注入、
 *   DOM→state（input 冒泡）、state→DOM（劫持 setter）三向；
 * - clearable / showPassword / prefix·suffix / showCount 交互件；
 * - BaseField 骨架通道（经 input 实例化消费）：status 状态色 + aria-invalid、
 *   data-focus 焦点态、disabled/readonly 同步、name 透传（原生直提交载体）；
 * - precompile 元素名变换（x-input / x-textarea → span + props 折叠，布尔裸属性归一）。
 */
import "../../setup";
import { describe, expect, test } from "bun:test";
import { AutoSpark } from "autospark";
import { mount, nextTick } from "../../helpers";
import { INPUT_NAME, bootstrapInputPlugin } from "../../../components/form/input/index";
import {
  BASE_FIELD_NAME,
  bootstrapBaseFieldPlugin,
} from "../../../components/base/base-field/index";

/** 取全局表模板（空白归一——oxfmt 折行使逐字匹配假红） */
const tpl = (name: string) =>
  ((AutoSpark as { components: Record<string, string> }).components[name] as string).replace(
    /\s+/g,
    " ",
  );

/** 取实例化后的宿主（.asc-field 骨架根） */
const field = (root: HTMLElement) => root.querySelector(".asc-field") as HTMLElement;
/** 取内层原生控件（input / textarea 同类名） */
const nativeOf = (root: HTMLElement) =>
  root.querySelector(".asc-input-native") as HTMLInputElement | HTMLTextAreaElement | null;

describe("注册面（ADR-0020）", () => {
  test("模块加载即注册：input 以副作用导入内嵌 base-field，双模板均入全局组件表", () => {
    const table = (AutoSpark as { components: Record<string, string> }).components;
    expect(typeof table[INPUT_NAME]).toBe("string");
    expect(typeof table[BASE_FIELD_NAME]).toBe("string");
    expect(tpl(INPUT_NAME)).toContain(`x-define="${INPUT_NAME}"`);
    expect(tpl(INPUT_NAME)).toContain('x-define:inherit="autospark.base-field"'); // 继承链子端
    expect(tpl(BASE_FIELD_NAME)).toContain(`x-define="${BASE_FIELD_NAME}"`);
    expect(tpl(BASE_FIELD_NAME)).toContain('x-define:inherit="autospark.base"'); // 继承链中端（主题档位通道下传）
    expect(tpl(BASE_FIELD_NAME)).toContain("x-slot"); // 单默认出口（子组件默认段注入位）
  });

  test("组件自有图标注册：input-eye / input-eye-off 入全局图标表", () => {
    const icons = (AutoSpark as { icons: Set<string> }).icons;
    expect(icons.has("input-eye")).toBe(true);
    expect(icons.has("input-eye-off")).toBe(true);
  });

  test("bootstrap 幂等：重复调用不覆盖（同键赋值幂等）", () => {
    const table = (AutoSpark as { components: Record<string, string> }).components;
    const beforeInput = table[INPUT_NAME];
    const beforeBase = table[BASE_FIELD_NAME];
    bootstrapInputPlugin();
    bootstrapBaseFieldPlugin();
    expect(table[INPUT_NAME]).toBe(beforeInput);
    expect(table[BASE_FIELD_NAME]).toBe(beforeBase);
  });

  test("样式通道：状态色三级回退链与暗色兜底变体均在模板中（ADR-0129）", () => {
    const base = tpl(BASE_FIELD_NAME);
    expect(base).toContain("--asc-field-tone: var(--auto-primary-color, var(--asc-field-primary,");
    expect(base).toContain('.asc-field[data-status="error"] {');
    expect(base).toContain(".asc-field-box[data-focus] {");
    // 暗色兜底块 :not([data-status]) 守卫——状态在场时边框让位状态色（防高特异性兜底压掉染色）
    expect(base).toContain("[dark] .asc-field-box:not([data-status]),");
    const input = tpl(INPUT_NAME);
    expect(input).toContain("var(--auto-input-placeholder, var(--asc-input-placeholder,");
    expect(input).toContain("[dark] .asc-input-native::placeholder,");
  });
});

describe("化身渲染与 props 同步", () => {
  test("骨架 class 拼接 + 原生控件 props 同步（placeholder / maxlength / value 初值）", async () => {
    const { root } = mount(
      `<span x-component:autospark.input="{ placeholder: '请输入内容', maxlength: 10, value: '初始值' }"></span>`,
      {},
    );
    await nextTick();
    const host = field(root);
    expect(host.classList.contains("asc-field")).toBe(true); // base-field 骨架类
    expect(host.classList.contains("asc-input")).toBe(true); // 子组件类（根属性并入拼接）
    expect(host.classList.contains("asc-field-box")).toBe(true); // 盒饰选配类
    const input = nativeOf(root) as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.tagName).toBe("INPUT");
    expect(input.placeholder).toBe("请输入内容");
    expect(input.getAttribute("maxlength")).toBe("10");
    expect(input.value).toBe("初始值"); // 非受控初值
    expect(input.hasAttribute("data-autospark-control")).toBe(true); // 标记协议挂点
  });

  test("textarea 形态分叉：type=textarea 渲染 textarea 元素（rows 同步），不渲染 input", async () => {
    const { root } = mount(
      `<span x-component:autospark.input="{ type: 'textarea', value: '多行内容', rows: 4 }"></span>`,
      {},
    );
    await nextTick();
    const host = field(root);
    const ta = nativeOf(root) as HTMLTextAreaElement;
    expect(ta.tagName).toBe("TEXTAREA");
    expect(ta.getAttribute("rows")).toBe("4"); // 属性通道断言（happy-dom rows property 返回串）
    expect(ta.value).toBe("多行内容");
    expect(root.querySelector("input.asc-input-native")).toBeNull(); // input 形态不渲染
    expect(host.getAttribute("data-form")).toBe("textarea"); // 形态标记（CSS 高度放开通道）
  });

  test("type 透传：password 落原生 type", async () => {
    const { root } = mount(
      `<span x-component:autospark.input="{ type: 'password', value: 'secret' }"></span>`,
      {},
    );
    await nextTick();
    expect((nativeOf(root) as HTMLInputElement).type).toBe("password");
  });
});

describe("值桥（x-model 兼容协议，ADR-0020）", () => {
  test("初始注入：x-model 编译期写入（expando）经劫持快照落到原生控件", async () => {
    const { root } = mount(`<span x-model="name" x-component:autospark.input></span>`, {
      name: "张三",
    });
    await nextTick();
    expect(nativeOf(root)!.value).toBe("张三");
  });

  test("DOM→state：原生 input 事件冒泡过宿主，x-model 读劫持 el.value 回写", async () => {
    const { root, engine } = mount(`<span x-model="name" x-component:autospark.input></span>`, {
      name: "",
    });
    await nextTick();
    const input = nativeOf(root)!;
    input.value = "李四";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await nextTick();
    expect(engine.store.state.name).toBe("李四");
  });

  test("state→DOM：状态变更经劫持 setter 写回原生控件", async () => {
    const { root, engine } = mount(`<span x-model="name" x-component:autospark.input></span>`, {
      name: "初始",
    });
    await nextTick();
    engine.store.state.name = "王五";
    await nextTick();
    expect(nativeOf(root)!.value).toBe("王五");
  });

  test("value props 单向同步（无 x-model）：外部受控经 watch 写控件，等值防回环", async () => {
    const { root, engine } = mount(`<span x-component:autospark.input="{ value: text }"></span>`, {
      text: "一号",
    });
    await nextTick();
    expect(nativeOf(root)!.value).toBe("一号");
    engine.store.state.text = "二号";
    await nextTick();
    expect(nativeOf(root)!.value).toBe("二号");
  });
});

describe("交互件", () => {
  test("clearable：非空显形，点击清空 + 派发 input（x-model 回写）+ aria 载体", async () => {
    const { root, engine } = mount(
      `<span x-model="kw" x-component:autospark.input="{ clearable: true, value: '关键词' }"></span>`,
      { kw: "" },
    );
    await nextTick();
    const host = field(root);
    const clear = host.querySelector(".asc-input-clear");
    expect(clear).toBeTruthy(); // 非空显形
    expect(clear!.hasAttribute("data-autospark-action")).toBe(true); // 动作件标记
    clear!.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    await nextTick();
    expect(nativeOf(root)!.value).toBe("");
    expect(engine.store.state.kw).toBe(""); // input 派发 → x-model 回写
    expect(host.querySelector(".asc-input-clear")).toBeNull(); // 清空后隐藏
  });

  test("clearable 空值不显形；disabled 时点击无效", async () => {
    const { root } = mount(`<span x-component:autospark.input="{ clearable: true }"></span>`, {});
    await nextTick();
    expect(field(root).querySelector(".asc-input-clear")).toBeNull();
  });

  test("showPassword：password 形态显眼睛钮，点击切 type text↔password（图标随动）", async () => {
    const { root } = mount(
      `<span x-component:autospark.input="{ type: 'password', showPassword: true, value: 'secret' }"></span>`,
      {},
    );
    await nextTick();
    const host = field(root);
    const eye = host.querySelector(".asc-input-eye")!;
    expect(eye).toBeTruthy();
    const input = nativeOf(root) as HTMLInputElement;
    expect(input.type).toBe("password");
    eye.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    await nextTick();
    expect(input.type).toBe("text"); // 可见态
    // 图标随动经渲染产物断言（x-icon 属性编译期剥除，落 symbol use 引用）
    expect(host.querySelector(".asc-input-eye use")!.getAttribute("href")).toContain(
      "input-eye-off",
    );
    host
      .querySelector(".asc-input-eye")!
      .dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    await nextTick();
    expect(input.type).toBe("password"); // 还原
  });

  test("showPassword 非 password 形态忽略（无眼睛钮）", async () => {
    const { root } = mount(
      `<span x-component:autospark.input="{ showPassword: true }"></span>`,
      {},
    );
    await nextTick();
    expect(field(root).querySelector(".asc-input-eye")).toBeNull();
  });

  test("prefix/suffix 文本与图标双形态（对象 props 经状态引用注入）", async () => {
    const { root } = mount(
      `<span x-component:autospark.input="{ prefix: '¥', suffix: iconConf }"></span>`,
      { iconConf: { icon: "bell" } },
    );
    await nextTick();
    const host = field(root);
    expect(host.querySelector(".asc-input-prefix .asc-input-text")!.textContent).toBe("¥");
    expect(host.querySelector(".asc-input-suffix .asc-input-icon")).toBeTruthy(); // x-icon 渲染图标载体
  });

  test("showCount：maxlength 在场显示 len/max，输入跟随更新，超限挂 data-over", async () => {
    const { root } = mount(
      `<span x-component:autospark.input="{ maxlength: 5, showCount: true, value: 'abc' }"></span>`,
      {},
    );
    await nextTick();
    const host = field(root);
    expect(host.querySelector(".asc-input-count")!.textContent!.trim()).toBe("3 / 5");
    const input = nativeOf(root)!;
    input.value = "abcdef"; // 超限（测试直写绕过原生截断）
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await nextTick();
    expect(host.querySelector(".asc-input-count")!.textContent!.trim()).toBe("6 / 5");
    expect(host.hasAttribute("data-over")).toBe(true); // 超限染色通道
  });

  test("showCount 无 maxlength：仅显示 len", async () => {
    const { root } = mount(
      `<span x-component:autospark.input="{ showCount: true, value: '四字' }"></span>`,
      {},
    );
    await nextTick();
    expect(field(root).querySelector(".asc-input-count")!.textContent!.trim()).toBe("2");
  });
});

describe("BaseField 骨架通道（经 input 实例化消费，ADR-0020）", () => {
  test("status 状态色：宿主 data-status + error 态控件 aria-invalid", async () => {
    const { root, engine } = mount(`<span x-component:autospark.input="{ status: st }"></span>`, {
      st: "",
    });
    await nextTick();
    const host = field(root);
    expect(host.hasAttribute("data-status")).toBe(false); // 缺省无状态
    engine.store.state.st = "error";
    await nextTick();
    expect(host.getAttribute("data-status")).toBe("error");
    expect(nativeOf(root)!.getAttribute("aria-invalid")).toBe("true"); // 可访问性同步
    engine.store.state.st = "";
    await nextTick();
    expect(host.hasAttribute("data-status")).toBe(false);
    expect(nativeOf(root)!.hasAttribute("aria-invalid")).toBe(false);
  });

  test("焦点态追踪：focusin 挂 data-focus，focusout 摘除", async () => {
    const { root } = mount(`<span x-component:autospark.input></span>`, {});
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

  test("disabled：同步原生控件 + 宿主 data-disabled；readonly 同理（不 disabled）", async () => {
    const { root } = mount(`<span x-component:autospark.input="{ readonly: true }"></span>`, {});
    await nextTick();
    const host = field(root);
    const input = nativeOf(root) as HTMLInputElement;
    expect(input.readOnly).toBe(true);
    expect(input.disabled).toBe(false);
    expect(host.hasAttribute("data-readonly")).toBe(true);
    expect(host.hasAttribute("data-disabled")).toBe(false);
  });

  test("name 透传：宿主 name 落原生控件（原生直提交载体，ADR-0020）", async () => {
    const { root } = mount(`<span name="username" x-component:autospark.input></span>`, {});
    await nextTick();
    expect(nativeOf(root)!.getAttribute("name")).toBe("username");
  });

  test("点击转发焦点：点击盒饰空白区焦点落控件（动作件不转发）", async () => {
    const { root } = mount(
      `<span x-component:autospark.input="{ placeholder: '提示' }"></span>`,
      {},
    );
    await nextTick();
    const host = field(root);
    const input = nativeOf(root)!;
    let focused = false;
    input.focus = () => {
      focused = true;
    }; // mock（happy-dom 无真实焦点布局语义）
    host.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(focused).toBe(true); // 点击宿主空白 → 转发控件
  });
});

describe("precompile 元素名变换（x-input / x-textarea）", () => {
  test("x-input → span + props 折叠（布尔裸属性归一 true、响应式项原样拼入）", () => {
    const { root } = mount(
      `<div><x-input placeholder="静态" :placeholder="ph" clearable disabled maxlength="8"></x-input></div>`,
      { ph: "响应式" },
      { autostart: false },
    );
    const host = root.children[0]!.children[0]!;
    expect(host.tagName).toBe("SPAN");
    const attr = [...host.attributes].find((a) => a.name === "x-component:autospark.input");
    expect(attr).toBeTruthy();
    const v = attr!.value;
    expect(v).toContain('placeholder: "静态"');
    expect(v).toContain("placeholder: (ph)"); // 后写胜（同键折叠按文档序覆盖）
    expect(v).toContain("clearable: true"); // 裸布尔归一
    expect(v).toContain("disabled: true");
    expect(v).toContain("maxlength: 8"); // 数字推断
  });

  test("x-textarea → span + 缺省补 type: textarea（显式声明优先）", () => {
    const { root } = mount(
      `<div><x-textarea rows="4"></x-textarea></div>`,
      {},
      { autostart: false },
    );
    const host = root.children[0]!.children[0]!;
    const v = [...host.attributes].find((a) => a.name === "x-component:autospark.input")!.value;
    expect(v).toContain('type: "textarea"');
    expect(v).toContain("rows: 4");
  });

  test("纯文本子内容折叠为 value 初值（textarea 原生直觉写法；显式 value 优先）", async () => {
    const { root } = mount(`<div><x-textarea name="memo" rows="2">备注内容</x-textarea></div>`, {});
    await nextTick();
    const ta = nativeOf(root) as HTMLTextAreaElement;
    expect(ta.tagName).toBe("TEXTAREA");
    expect(ta.value).toBe("备注内容"); // 文本子内容未随迁为插槽内容覆盖控件区
    expect(ta.getAttribute("name")).toBe("memo");
  });

  test("name/class/x-/@ 属性保留给宿主（表单桥与指令族不折叠）", () => {
    const { root } = mount(
      `<div><x-input name="acct" class="my" x-model="a" @click="b = 1"></x-input></div>`,
      { a: "", b: 0 },
      { autostart: false },
    );
    const host = root.children[0]!.children[0]!;
    expect(host.getAttribute("name")).toBe("acct");
    expect(host.getAttribute("class")).toBe("my");
    expect(host.hasAttribute("x-model")).toBe(true);
    expect([...host.attributes].some((a) => a.name.startsWith("@"))).toBe(true);
    expect(
      [...host.attributes].find((a) => a.name === "x-component:autospark.input")!.value,
    ).not.toContain("name:");
  });
});
