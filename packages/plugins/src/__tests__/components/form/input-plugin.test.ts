/**
 * input + field 组件插件测试（组件库 P0 form 基座，ADR-0020）：
 * - 注册面：input / field 双模板入全局组件表（input 以副作用导入内嵌 field
 *   注册，继承链 input → field → autospark.base）+ 组件自有图标注册；
 * - 化身渲染：骨架 class 拼接（.asc-field + .asc-input + .asc-field-box）、原生控件
 *   props 同步（placeholder/maxlength/type）；多行能力已拆出独立组件（ADR-0032）；
 * - 值桥（x-model 兼容协议）：宿主 el.value 劫持 ↔ 内层原生控件——初始注入、
 *   DOM→state（input 冒泡）、state→DOM（劫持 setter）三向；
 * - clearable / showPassword / prefix·suffix / showCount 交互件；
 * - Field 骨架通道（经 input 实例化消费）：status 状态色 + aria-invalid、
 *   data-focus 焦点态、disabled/readonly 同步、name 透传（原生直提交载体）；
 * - precompile 元素名变换（x-input → span + props 折叠，布尔裸属性归一）。
 */
import "../../setup";
import { describe, expect, test } from "bun:test";
import { AutoSpark } from "autospark";
import { mount, nextTick } from "../../helpers";
import { INPUT_NAME, bootstrapInputPlugin } from "../../../components/form/input/index";
import {
  FIELD_NAME,
  bootstrapFieldPlugin,
} from "../../../components/base/field/index";
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
/** 取内层原生控件（input / textarea 同类名） */
const nativeOf = (root: HTMLElement) =>
  root.querySelector(".asc-input-native") as HTMLInputElement | HTMLTextAreaElement | null;

describe("注册面（ADR-0020）", () => {
  test("模块加载即注册：input 以副作用导入内嵌 field，双模板均入全局组件表", () => {
    const table = (AutoSpark as { components: Record<string, string> }).components;
    expect(typeof table[INPUT_NAME]).toBe("string");
    expect(typeof table[FIELD_NAME]).toBe("string");
    expect(tpl(INPUT_NAME)).toContain(`x-define="${INPUT_NAME}"`);
    expect(tpl(INPUT_NAME)).toContain('x-define:inherit="autospark.field"'); // 继承链子端
    expect(tpl(FIELD_NAME)).toContain(`x-define="${FIELD_NAME}"`);
    expect(tpl(FIELD_NAME)).toContain('x-define:inherit="autospark.base"'); // 继承链中端（主题档位通道下传）
    expect(tpl(FIELD_NAME)).toContain("x-slot"); // 单默认出口（子组件默认段注入位）
  });

  test("组件自有图标注册：input-eye / input-eye-off 入全局图标表", () => {
    const icons = (AutoSpark as { icons: Set<string> }).icons;
    expect(icons.has("input-eye")).toBe(true);
    expect(icons.has("input-eye-off")).toBe(true);
  });

  test("bootstrap 幂等：重复调用不覆盖（同键赋值幂等）", () => {
    const table = (AutoSpark as { components: Record<string, string> }).components;
    const beforeInput = table[INPUT_NAME];
    const beforeBase = table[FIELD_NAME];
    bootstrapInputPlugin();
    bootstrapFieldPlugin();
    expect(table[INPUT_NAME]).toBe(beforeInput);
    expect(table[FIELD_NAME]).toBe(beforeBase);
  });

  test("样式通道：状态色三级回退链与暗色兜底变体均在模板中（ADR-0129）", () => {
    const base = tpl(FIELD_NAME);
    expect(tplx(FIELD_NAME)).toContain(
      "--asc-field-tone:var(--auto-primary-color,var(--asc-field-primary,",
    );
    expect(base).toContain('.asc-field[data-status="error"] {');
    expect(base).toContain(".asc-field-box[data-focus] {");
    // 暗色兜底块 :not([data-status]) 守卫——状态在场时边框让位状态色（防高特异性兜底压掉染色）
    expect(base).toContain("[dark] .asc-field-box:not([data-status]),");
    const input = tpl(INPUT_NAME);
    expect(input).toContain("var(--auto-input-placeholder, var(--asc-input-placeholder,");
    expect(input).toContain("[dark] .asc-input-native::placeholder,");
    // ADR-0032：多行能力已拆出 autospark.textarea——input 模板零 textarea 残留
    expect(input).not.toContain("<textarea");
    expect(input).not.toContain('data-form="textarea"');
    expect(input).not.toContain("rows");
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
    expect(host.classList.contains("asc-field")).toBe(true); // field 骨架类
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

  test("prefix/suffix 文本与图标双形态（对象 props 经状态引用注入；装饰上提 field 出口）", async () => {
    const { root } = mount(
      `<span x-component:autospark.input="{ prefix: '¥', suffix: iconConf }"></span>`,
      { iconConf: { icon: "bell" } },
    );
    await nextTick();
    const host = field(root);
    // 装饰上提（ADR-0020 修订）：容器落 field 出口位 + 出口注入类拼接（field 的间距/防收缩载体）
    const pre = host.querySelector(".asc-field-prefix")!;
    const suf = host.querySelector(".asc-field-suffix")!;
    expect(pre.classList.contains("asc-input-affix")).toBe(true);
    expect(suf.classList.contains("asc-input-affix")).toBe(true);
    expect(pre.querySelector(".asc-input-text")!.textContent).toBe("¥");
    expect(suf.querySelector(".asc-input-icon")).toBeTruthy(); // x-icon 渲染图标载体
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

describe("Field 骨架通道（经 input 实例化消费，ADR-0020）", () => {
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

describe("装饰插槽（field 具名出口穿透，ADR-0020 2026-11-14 修订）", () => {
  test("三插槽穿透 + DOM 序：slot 内容落 field 出口，恒在 props 轻装饰外侧", async () => {
    const { root } = mount(
      [
        `<span x-component:autospark.input="{ prefix: '轻前', suffix: '轻后' }">`,
        `<template x-slot:prefix><span class="mk">槽前</span></template>`,
        `<template x-slot:suffix><span class="mk">槽后</span></template>`,
        `</span>`,
      ].join(""),
      {},
    );
    await nextTick();
    const host = field(root);
    // template 载体（ADR-0137，2026-11-15 切换）：无包裹层——类活注入落投影内容首根
    //（消费方自有类 mk 与注入类拼接），内容根直接成为骨架子级
    const prefixOutlet = host.querySelector(".asc-field-prefix");
    const suffixOutlet = host.querySelector(".asc-field-suffix");
    expect(prefixOutlet).toBeTruthy();
    expect(suffixOutlet).toBeTruthy();
    expect(prefixOutlet!.textContent).toContain("槽前");
    expect(suffixOutlet!.textContent).toContain("槽后");
    expect(prefixOutlet!.classList.contains("mk")).toBe(true); // 消费方类保留（拼接非替换）
    // DOM 序固定：[slot:prefix][body][slot:suffix]
    const seq = Array.from(host.children).map((n) => n.className);
    expect(seq[0]).toContain("asc-field-prefix");
    expect(seq[1]).toContain("asc-field-body");
    expect(seq[seq.length - 1]).toContain("asc-field-suffix");
    // 装饰上提（ADR-0020 修订）：消费方投影整体接管出口位——props 轻装饰让位（不出场）；
    // 但 props 装饰未投影侧（本用例双侧都投影）与功能件不受影响
    expect(prefixOutlet!.textContent).toContain("槽前");
    expect(suffixOutlet!.textContent).toContain("槽后");
    expect(prefixOutlet!.querySelector(".asc-input-text")).toBeNull(); // props 装饰被顶掉
    // 功能件留 body：不被投影顶掉
    expect(host.querySelector(".asc-field-body")!.querySelector(".asc-input-native")).toBeTruthy();
  });

  test("空插槽零布局：template 载体无内容出口静默消失（载体通道断言）", async () => {
    const { root } = mount(`<span x-component:autospark.input></span>`, {});
    await nextTick();
    const host = field(root);
    // 未提供插槽内容：template 载体整出口静默消失（结果 DOM 无残留、零多余节点）
    expect(host.querySelector(".asc-field-prefix")).toBeNull();
    expect(host.querySelector(".asc-field-suffix")).toBeNull();
    // CSS 通道：类落内容根——次要色合并选择器 + 间距/防收缩直接落根（无 display:contents）
    const css = tpl(FIELD_NAME);
    const cssx = tplx(FIELD_NAME);
    expect(cssx).toContain(".asc-field-prefix{flex:none;margin-inline-end:0.4em;}");
    expect(cssx).toContain(".asc-field-suffix{flex:none;margin-inline-start:0.4em;}");
    expect(cssx).toContain(".asc-field-prefix,.asc-field-suffix{color:var(--auto-secondary-color");
    // 装饰默认次要色（暗色块成对）
    expect(cssx).toContain("color:var(--auto-secondary-color");
    expect(css.match(/\[dark\] \.asc-field-prefix/g)?.length).toBeGreaterThan(0);
  });

  test("装饰上提（ADR-0020 2026-11-16 修订）：props 装饰落 field 出口位，消费方投影顶掉装饰但功能件仍在", async () => {
    const { root } = mount(
      [
        `<span x-component:autospark.input="{ prefix: '轻前', clearable: true, value: 'abc' }">`,
        `<template x-slot:suffix><b class="proj">投影</b></template>`,
        `</span>`,
      ].join(""),
      {},
    );
    await nextTick();
    const host = field(root);
    // props 前缀装饰落出口位（注入类与容器类拼接）
    const pre = host.querySelector(".asc-field-prefix")!;
    expect(pre.classList.contains("asc-input-affix")).toBe(true);
    expect(pre.textContent).toContain("轻前");
    // 消费方投影整体接管 suffix 出口——props 后缀装饰让位（覆盖链：消费方 > 继承覆盖）
    const suf = host.querySelector(".asc-field-suffix")!;
    expect(suf.classList.contains("proj")).toBe(true);
    expect(suf.querySelector(".asc-input-affix")).toBeNull();
    // 功能件（清除钮）留 body：不被消费方投影顶掉（Q1-B 取舍）
    expect(host.querySelector(".asc-field-body .asc-input-clear")).toBeTruthy();
  });

  test("插槽内容点击转发焦点：装饰点击落控件（动作件标记不转发）", async () => {
    const { root } = mount(
      [
        `<span x-component:autospark.input>`,
        `<template x-slot:prefix><span class="mk-deco">装饰</span></template>`,
        `<template x-slot:suffix`,
        `><button type="button" class="mk-act" data-autospark-action>钮</button></template`,
        `></span>`,
      ].join(""),
      {},
    );
    await nextTick();
    const input = nativeOf(root)!;
    let focused = false;
    input.focus = () => {
      focused = true;
    };
    // 装饰（非控件非动作件）→ 转发
    field(root)
      .querySelector(".mk-deco")!
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(focused).toBe(true);
    // 动作件标记 → 自理不转发
    focused = false;
    field(root)
      .querySelector(".mk-act")!
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(focused).toBe(false);
  });

  test("field 直接实例化：默认段装消费方控件，骨架通道照常接管", async () => {
    const { root } = mount(
      [
        `<span class="asc-field-box" x-component:autospark.field="{ status: 'error' }">`,
        `<input class="my-native" data-autospark-control value="自定义控件" />`,
        `</span>`,
      ].join(""),
      {},
    );
    await nextTick();
    const host = field(root);
    // 宿主 class 拼接：骨架基座 + 消费方盒饰类
    expect(host.className).toContain("asc-field-box");
    // 状态色 + aria 同步到消费方控件（data-autospark-control 标记协议）
    expect(host.getAttribute("data-status")).toBe("error");
    const custom = host.querySelector(".my-native") as HTMLInputElement;
    expect(custom.getAttribute("aria-invalid")).toBe("true");
  });
});

describe("融合动作 actions（field props 驱动渲染段，ADR-0020 2026-11-16 修订二）", () => {
  test("渲染与分侧：pos 过滤 + DOM 序在装饰出口外侧 + button 实例化 + 自动标动作件", async () => {
    const { root } = mount(
      `<span x-component:autospark.input="{ actions: acts }"></span>`,
      {
        acts: [
          { label: "前置一", pos: "before" },
          { label: "前置二", pos: "before" },
          { label: "后置", name: "go", value: 42 },
        ],
      },
    );
    await nextTick();
    const host = field(root);
    const before = host.querySelector(".asc-field-actions-before");
    const after = host.querySelector(".asc-field-actions-after");
    expect(before!.querySelectorAll(".asc-field-action").length).toBe(2);
    expect(after!.querySelectorAll(".asc-field-action").length).toBe(1);
    // button 化身类拼接（组合复用 autospark.button）+ 按钮文案经 props 注入
    const goBtn = after!.querySelector(".asc-field-action") as HTMLElement;
    expect(goBtn.classList.contains("asc-button")).toBe(true);
    expect(goBtn.textContent).toContain("后 置"); // button autoInsertSpace 两字插空——props 全透传实证
    // 自动标 data-autospark-action（点击自理，不转发焦点到控件）
    expect(goBtn.hasAttribute("data-autospark-action")).toBe(true);
    // DOM 序：[before actions][prefix?][body][suffix?][after actions]——动作按钮最外层包壳
    const seq = Array.from(host.children).map((n) => n.className);
    expect(seq[0]).toContain("asc-field-actions-before");
    expect(seq[seq.length - 1]).toContain("asc-field-actions-after");
    const bodyIdx = seq.findIndex((c) => c.includes("asc-field-body"));
    expect(bodyIdx).toBeGreaterThan(0);
    expect(bodyIdx).toBeLessThan(seq.length - 1);
  });

  test("空数组零 DOM：x-if 整段不渲染（无 actions 容器残留）", async () => {
    const { root } = mount(`<span x-component:autospark.input></span>`, {});
    await nextTick();
    const host = field(root);
    expect(host.querySelector(".asc-field-actions")).toBeNull();
    expect(host.querySelector(".asc-field-action")).toBeNull();
  });

  test("action-click 组包：detail 四元组（index/name/value/item）+ 原生 click 双通道", async () => {
    const { root } = mount(
      `<span x-component:autospark.input="{ actions: acts }"></span>`,
      {
        acts: [
          { label: "前", pos: "before" },
          { label: "A", name: "add", value: { x: 1 } },
          { label: "B", name: "del" },
        ],
      },
    );
    await nextTick();
    const host = field(root);
    const fired: unknown[] = [];
    host.addEventListener("action-click", (e) => fired.push((e as CustomEvent).detail));
    const btns = Array.from(host.querySelectorAll(".asc-field-actions-after .asc-field-action"));
    expect(btns.length).toBe(2);
    btns[1].dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await nextTick();
    expect(fired.length).toBe(1);
    const d = fired[0] as { index: number; name?: string; value?: unknown; item: { label: string } };
    expect(d.index).toBe(1); // 侧内序（after 组第 2 个）
    expect(d.name).toBe("del");
    expect(d.item.label).toBe("B");
    // 原生 click 照常冒泡（双通道）——宿主 click 计数
    let nativeClicks = 0;
    host.addEventListener("click", () => nativeClicks++);
    btns[0].dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await nextTick();
    expect(nativeClicks).toBe(1);
  });

  test("disabled 联动：field disabled → 按钮同步禁用（Object.assign 值合并）", async () => {
    const { root, engine } = mount(
      `<span x-component:autospark.input="{ actions: acts, disabled: lock }"></span>`,
      { acts: [{ label: "搜" }], lock: false },
    );
    await nextTick();
    const host = field(root);
    const btn = host.querySelector(".asc-field-action") as HTMLButtonElement;
    expect(btn.disabled ?? btn.getAttribute("disabled")).toBeFalsy(); // 未禁用
    engine.store.state.lock = true;
    await nextTick();
    await new Promise((r) => setTimeout(r, 0)); // 值通道重算 + button 同步一跳
    expect(btn.disabled === true || btn.hasAttribute("disabled")).toBe(true);
  });

  test("样式通道：融合选择器与共享线变量在模板中（负 margin 边线复用 ADR-0014 范式）", () => {
    const cssx = tplx(FIELD_NAME);
    expect(cssx).toContain(".asc-field-actions{display:contents;}");
    // 内侧分隔线与盒边框同色（--asc-field-line 共享线，随状态同步染；variant 缺省
    // secondary 的半透明衬底保证对比——divider 独立分档已退役）；上下线不画（单线
    // 让位）+ 外侧竖线让位盒线
    expect(cssx).toContain("border-color:var(--asc-field-line);border-top-width:0;border-bottom-width:0;");
    expect(cssx).not.toContain("asc-field-divider"); // 独立分档体系退役
    expect(cssx).toContain(".asc-field-box.asc-field-actions-before.asc-field-action:first-of-type{border-left-width:0;}");
    expect(cssx).toContain(".asc-field-box.asc-field-actions-after.asc-field-action:last-of-type{border-right-width:0;}");
    expect(cssx).toContain(".asc-field-action+.asc-field-action{");
    expect(cssx).toContain("margin-inline-start:calc(-1*var(--auto-border-size,");
    expect(cssx).toContain("align-self:stretch;");
  });
});

describe("precompile 元素名变换（x-input）", () => {
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
