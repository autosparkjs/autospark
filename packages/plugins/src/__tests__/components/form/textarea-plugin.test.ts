/**
 * textarea 组件插件测试（ADR-0032：多行文本框自 input 的 type 变体拆出独立成件）：
 * - 注册面：textarea / field 双模板入全局组件表（textarea 以副作用导入内嵌 field
 *   注册，继承链 textarea → field → autospark.base）；
 * - 化身渲染：骨架 class 拼接（.asc-field + .asc-textarea + .asc-field-box）、
 *   原生控件 props 同步（placeholder/maxlength/rows/value）；
 * - autosize：默认开启（resize:none + 高度通道），关闭后尊重 resize；
 * - 值桥（x-model 兼容协议）：宿主 el.value 劫持 ↔ 内层原生控件——初始注入、
 *   DOM→state、state→DOM 三向 + value props 单向同步；
 * - clearable / 计数（maxlength 自动显示 / showCount）/ actions 上下分侧；
 * - Field 骨架通道（经 textarea 实例化消费）：status + aria-invalid、disabled/readonly、
 *   name 透传（原生直提交载体）；
 * - precompile 元素名变换（x-textarea → span + props 折叠 + 子文本折叠 value）。
 */
import "../../setup";
import { describe, expect, test } from "bun:test";
import { AutoSpark } from "autospark";
import { mount, nextTick } from "../../helpers";
import { TEXTAREA_NAME, bootstrapTextareaPlugin } from "../../../components/form/textarea/index";
import { FIELD_NAME, bootstrapFieldPlugin } from "../../../components/base/field/index";
// 融合动作组合依赖：button 组件注册（actions 渲染段内嵌实例化，ADR-0020 修订二）
import "../../../components/general/button/index";

/** 取全局表模板（空白归一——oxfmt 折行使逐字匹配假红） */
const tpl = (name: string) =>
  ((AutoSpark as { components: Record<string, string> }).components[name] as string).replace(
    /\s+/g,
    " ",
  );
/** 全脱空格形态（var() 链内折行免疫——结构性子串断言用） */
const tplx = (name: string) => tpl(name).replace(/\s+/g, "");

/** 取实例化后的宿主（.asc-field 骨架根） */
const field = (root: HTMLElement) => root.querySelector(".asc-field") as HTMLElement;
/** 取内层原生控件 */
const nativeOf = (root: HTMLElement) =>
  root.querySelector(".asc-textarea-native") as HTMLTextAreaElement | null;

describe("注册面（ADR-0032）", () => {
  test("模块加载即注册：textarea 以副作用导入内嵌 field，双模板均入全局组件表", () => {
    const table = (AutoSpark as { components: Record<string, string> }).components;
    expect(typeof table[TEXTAREA_NAME]).toBe("string");
    expect(typeof table[FIELD_NAME]).toBe("string");
    expect(tpl(TEXTAREA_NAME)).toContain(`x-define="${TEXTAREA_NAME}"`);
    expect(tpl(TEXTAREA_NAME)).toContain('x-define:inherit="autospark.field"'); // 继承链子端
  });

  test("bootstrap 幂等：重复调用不覆盖（同键赋值幂等）", () => {
    const table = (AutoSpark as { components: Record<string, string> }).components;
    const beforeTextarea = table[TEXTAREA_NAME];
    const beforeField = table[FIELD_NAME];
    bootstrapTextareaPlugin();
    bootstrapFieldPlugin();
    expect(table[TEXTAREA_NAME]).toBe(beforeTextarea);
    expect(table[FIELD_NAME]).toBe(beforeField);
  });

  test("样式通道：组件覆盖变量 + 暗色兜底变体 + actions 上下布局均在模板中", () => {
    const css = tpl(TEXTAREA_NAME);
    expect(css).toContain("var(--auto-input-placeholder, var(--asc-textarea-placeholder,");
    expect(css).toContain("[dark] .asc-textarea-native::placeholder,");
    // 纵向排布：控件 + actions 段（field 的横向融合让位）
    expect(css).toContain("flex-direction: column;");
    expect(css).toContain(".asc-textarea .asc-field-actions-before {");
    expect(css).toContain("order: -1;");
    // 计数器浮层右下角
    expect(css).toContain(".asc-textarea-count {");
    expect(css).toContain("position: absolute;");
  });
});

describe("化身渲染与 props 同步", () => {
  test("骨架 class 拼接 + 原生控件 props 同步（placeholder / maxlength / rows / value）", async () => {
    const { root } = mount(
      `<span x-component:autospark.textarea="{ placeholder: '请输入简介', maxlength: 10, rows: 4, value: '初始值' }"></span>`,
      {},
    );
    await nextTick();
    const host = field(root);
    expect(host.classList.contains("asc-field")).toBe(true); // field 骨架类
    expect(host.classList.contains("asc-textarea")).toBe(true); // 子组件类
    expect(host.classList.contains("asc-field-box")).toBe(true); // 盒饰选配类
    const ta = nativeOf(root)!;
    expect(ta.tagName).toBe("TEXTAREA");
    expect(ta.placeholder).toBe("请输入简介");
    expect(ta.getAttribute("maxlength")).toBe("10");
    expect(ta.getAttribute("rows")).toBe("4");
    expect(ta.value).toBe("初始值"); // 非受控初值
    expect(ta.hasAttribute("data-autospark-control")).toBe(true); // 标记协议挂点
  });

  test("autosize 默认开启：强制 resize:none 并写入高度通道", async () => {
    const { root } = mount(`<span x-component:autospark.textarea="{ rows: 3 }"></span>`, {});
    await nextTick();
    const ta = nativeOf(root)!;
    expect(ta.style.resize).toBe("none");
    expect(ta.style.height).not.toBe(""); // 自动增高写内联高度
    expect(ta.style.overflowY).not.toBe("");
  });

  test("autosize=false：交给原生拖拽，缺省 vertical；resize 属性覆盖", async () => {
    const { root } = mount(
      `<span x-component:autospark.textarea="{ autosize: false }"></span>`,
      {},
    );
    await nextTick();
    const ta = nativeOf(root)!;
    expect(ta.style.resize).toBe("vertical");
    expect(ta.style.height).toBe(""); // 不写自动高度
    expect(ta.style.overflowY).toBe("auto"); // 溢出交还原生滚动（不被 autosize 隐藏裁切）

    const second = mount(
      `<span x-component:autospark.textarea="{ autosize: false, resize: 'both' }"></span>`,
      {},
    );
    await nextTick();
    expect(nativeOf(second.root)!.style.resize).toBe("both");
  });
});

describe("值桥（x-model 兼容协议，ADR-0020）", () => {
  test("初始注入：x-model 编译期写入（expando）经劫持快照落到原生控件", async () => {
    const { root } = mount(`<span x-model="bio" x-component:autospark.textarea></span>`, {
      bio: "多行\n内容",
    });
    await nextTick();
    expect(nativeOf(root)!.value).toBe("多行\n内容");
  });

  test("DOM→state：原生 input 事件冒泡过宿主，x-model 读劫持 el.value 回写", async () => {
    const { root, engine } = mount(`<span x-model="bio" x-component:autospark.textarea></span>`, {
      bio: "",
    });
    await nextTick();
    const ta = nativeOf(root)!;
    ta.value = "第一行\n第二行";
    ta.dispatchEvent(new Event("input", { bubbles: true }));
    await nextTick();
    expect(engine.store.state.bio).toBe("第一行\n第二行");
  });

  test("state→DOM：状态变更经劫持 setter 写回原生控件", async () => {
    const { root, engine } = mount(`<span x-model="bio" x-component:autospark.textarea></span>`, {
      bio: "初始",
    });
    await nextTick();
    engine.store.state.bio = "更新";
    await nextTick();
    expect(nativeOf(root)!.value).toBe("更新");
  });

  test("value props 单向同步（无 x-model）：外部受控经 watch 写控件，等值防回环", async () => {
    const { root, engine } = mount(
      `<span x-component:autospark.textarea="{ value: text }"></span>`,
      { text: "一号" },
    );
    await nextTick();
    expect(nativeOf(root)!.value).toBe("一号");
    engine.store.state.text = "二号";
    await nextTick();
    expect(nativeOf(root)!.value).toBe("二号");
  });
});

describe("交互件", () => {
  test("clearable：非空显形，点击清空 + 派发 input（x-model 回写）", async () => {
    const { root, engine } = mount(
      `<span x-model="memo" x-component:autospark.textarea="{ clearable: true, value: '内容' }"></span>`,
      { memo: "" },
    );
    await nextTick();
    const host = field(root);
    const clear = host.querySelector(".asc-textarea-clear");
    expect(clear).toBeTruthy(); // 非空显形
    expect(clear!.hasAttribute("data-autospark-action")).toBe(true); // 动作件标记
    clear!.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    await nextTick();
    expect(nativeOf(root)!.value).toBe("");
    expect(engine.store.state.memo).toBe(""); // input 派发 → x-model 回写
    expect(host.querySelector(".asc-textarea-clear")).toBeNull(); // 清空后隐藏
  });

  test("clearable 空值不显形", async () => {
    const { root } = mount(`<span x-component:autospark.textarea="{ clearable: true }"></span>`, {});
    await nextTick();
    expect(field(root).querySelector(".asc-textarea-clear")).toBeNull();
  });

  test("maxlength 自动显示计数（无需 showCount），输入跟随，超限挂 data-over", async () => {
    const { root } = mount(
      `<span x-component:autospark.textarea="{ maxlength: 5, value: 'abc' }"></span>`,
      {},
    );
    await nextTick();
    const host = field(root);
    expect(host.querySelector(".asc-textarea-count")!.textContent!.trim()).toBe("3 / 5");
    const ta = nativeOf(root)!;
    ta.value = "abcdef"; // 超限（测试直写绕过原生截断）
    ta.dispatchEvent(new Event("input", { bubbles: true }));
    await nextTick();
    expect(host.querySelector(".asc-textarea-count")!.textContent!.trim()).toBe("6 / 5");
    expect(host.hasAttribute("data-over")).toBe(true); // 超限染色通道
  });

  test("showCount 无 maxlength：显式显示当前字数", async () => {
    const { root } = mount(
      `<span x-component:autospark.textarea="{ showCount: true, value: '四字内容' }"></span>`,
      {},
    );
    await nextTick();
    expect(field(root).querySelector(".asc-textarea-count")!.textContent!.trim()).toBe("4");
  });

  test("无 maxlength 且无 showCount：不渲染计数器", async () => {
    const { root } = mount(`<span x-component:autospark.textarea></span>`, {});
    await nextTick();
    expect(field(root).querySelector(".asc-textarea-count")).toBeNull();
  });
});

describe("actions 上下分侧（field 渲染段，ADR-0032 布局调整）", () => {
  test("pos=before 在上、after 在下；button 实例化 + 自动标动作件", async () => {
    const { root } = mount(`<span x-component:autospark.textarea="{ actions: acts }"></span>`, {
      acts: [
        { label: "取消", pos: "before" },
        { label: "保存", name: "save", value: 1 },
      ],
    });
    await nextTick();
    const host = field(root);
    const before = host.querySelector(".asc-field-actions-before")!;
    const after = host.querySelector(".asc-field-actions-after")!;
    expect(before.querySelectorAll(".asc-field-action").length).toBe(1);
    expect(after.querySelectorAll(".asc-field-action").length).toBe(1);
    // DOM 序：[before actions][body][after actions]——纵向排布下即「上 / 下」
    const seq = Array.from(host.children).map((n) => n.className);
    expect(seq[0]).toContain("asc-field-actions-before");
    expect(seq[seq.length - 1]).toContain("asc-field-actions-after");
    const btn = after.querySelector(".asc-field-action") as HTMLElement;
    expect(btn.classList.contains("asc-button")).toBe(true);
    expect(btn.hasAttribute("data-autospark-action")).toBe(true);
  });

  test("action-click 组包：detail 四元组 + 原生 click 双通道", async () => {
    const { root } = mount(`<span x-component:autospark.textarea="{ actions: acts }"></span>`, {
      acts: [{ label: "保存", name: "save", value: 7 }],
    });
    await nextTick();
    const host = field(root);
    const fired: unknown[] = [];
    host.addEventListener("action-click", (e) => fired.push((e as CustomEvent).detail));
    const btn = host.querySelector(".asc-field-action") as HTMLElement;
    btn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await nextTick();
    expect(fired.length).toBe(1);
    expect((fired[0] as { name: string }).name).toBe("save");
  });
});

describe("Field 骨架通道（经 textarea 实例化消费）", () => {
  test("status：宿主 data-status + error 态控件 aria-invalid", async () => {
    const { root, engine } = mount(`<span x-component:autospark.textarea="{ status: st }"></span>`, {
      st: "error",
    });
    await nextTick();
    const host = field(root);
    expect(host.getAttribute("data-status")).toBe("error");
    expect(nativeOf(root)!.getAttribute("aria-invalid")).toBe("true");
    engine.store.state.st = "";
    await nextTick();
    expect(host.hasAttribute("data-status")).toBe(false);
    expect(nativeOf(root)!.hasAttribute("aria-invalid")).toBe(false);
  });

  test("disabled / readonly：同步原生控件 + 宿主反射", async () => {
    const { root } = mount(
      `<span x-component:autospark.textarea="{ readonly: true }"></span>`,
      {},
    );
    await nextTick();
    const host = field(root);
    const ta = nativeOf(root)!;
    expect(ta.readOnly).toBe(true);
    expect(ta.disabled).toBe(false);
    expect(host.hasAttribute("data-readonly")).toBe(true);
  });

  test("name 透传：宿主 name 落原生控件（原生直提交载体）", async () => {
    const { root } = mount(`<span name="memo" x-component:autospark.textarea></span>`, {});
    await nextTick();
    expect(nativeOf(root)!.getAttribute("name")).toBe("memo");
  });
});

describe("precompile 元素名变换（x-textarea）", () => {
  test("x-textarea → span + props 折叠（rows 数字推断、布尔裸属性归一 true）", () => {
    const { root } = mount(
      `<div><x-textarea rows="4" autosize="false" clearable show-count></x-textarea></div>`,
      {},
      { autostart: false },
    );
    const host = root.children[0]!.children[0]!;
    expect(host.tagName).toBe("SPAN");
    const v = [...host.attributes].find((a) => a.name === "x-component:autospark.textarea")!.value;
    expect(v).toContain("rows: 4");
    expect(v).toContain("autosize: false");
    expect(v).toContain("clearable: true");
    expect(v).toContain("showCount: true");
    expect(v).not.toContain("type:"); // 不再注入 textarea 形态标记
  });

  test("纯文本子内容折叠为 value 初值；name 保留给宿主", async () => {
    const { root } = mount(`<div><x-textarea name="memo" rows="2">备注内容</x-textarea></div>`, {});
    await nextTick();
    const ta = nativeOf(root)!;
    expect(ta.tagName).toBe("TEXTAREA");
    expect(ta.value).toBe("备注内容"); // 文本子内容未随迁为插槽内容覆盖控件区
    expect(ta.getAttribute("name")).toBe("memo");
  });

  test("x-/@ 属性保留给宿主（指令族不折叠）", () => {
    const { root } = mount(
      `<div><x-textarea class="my" x-model="a" @click="b = 1"></x-textarea></div>`,
      { a: "", b: 0 },
      { autostart: false },
    );
    const host = root.children[0]!.children[0]!;
    expect(host.getAttribute("class")).toBe("my");
    expect(host.hasAttribute("x-model")).toBe(true);
    expect([...host.attributes].some((a) => a.name.startsWith("@"))).toBe(true);
  });
});
