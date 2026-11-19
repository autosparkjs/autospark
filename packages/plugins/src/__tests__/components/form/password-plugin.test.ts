/**
 * password 组件插件测试（ADR-0034）：
 * - 注册面：password / input / field 三模板入全局组件表（password 以副作用导入内嵌
 *   input / field 注册，继承链 password → input → field → autospark.base）；
 * - 继承渲染：骨架 class 拼接（.asc-field + .asc-input + .asc-password + 盒饰）、
 *   input 的 props 面（placeholder / maxlength / value / name 透传）原样生效；
 * - type 冻结：props 注入与 precompile 折叠双路径都压回 password；
 * - 密码场景增量：key 前缀装饰、明文态切换（原生 type + 图标 + aria）、viewable
 *   能力开关、清空/禁用/只读联动；
 * - minlength / autocomplete 原生属性透传（input 无此通道）；
 * - precompile 元素名变换（x-password → span + props 折叠，type 丢弃）。
 */
import "../../setup";
import { describe, expect, test } from "bun:test";
import { AutoSpark } from "autospark";
import { mount, nextTick } from "../../helpers";
import {
  PASSWORD_NAME,
  bootstrapPasswordPlugin,
} from "../../../components/form/password/index";
import { INPUT_NAME } from "../../../components/form/input/index";
import { FIELD_NAME } from "../../../components/base/field/index";

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
  root.querySelector(".asc-input-native") as HTMLInputElement | null;
/** 取眼睛钮 */
const eyeOf = (root: HTMLElement) => field(root).querySelector(".asc-password-eye");
/** 图标载体当前 href（x-icon 渲染形态 #as-<name>） */
const iconHref = (el: Element | null) => el?.querySelector("use")?.getAttribute("href") ?? "";

describe("注册面（ADR-0034）", () => {
  test("模块加载即注册：password 以副作用导入内嵌 input / field，三模板均入全局组件表", () => {
    const table = (AutoSpark as { components: Record<string, string> }).components;
    expect(typeof table[PASSWORD_NAME]).toBe("string");
    expect(typeof table[INPUT_NAME]).toBe("string");
    expect(typeof table[FIELD_NAME]).toBe("string");
    expect(tpl(PASSWORD_NAME)).toContain(`x-define="${PASSWORD_NAME}"`);
    expect(tpl(PASSWORD_NAME)).toContain('x-define:inherit="autospark.input"'); // 继承链子端
  });

  test("bootstrap 幂等：重复调用不覆盖", () => {
    const table = (AutoSpark as { components: Record<string, string> }).components;
    const before = table[PASSWORD_NAME];
    bootstrapPasswordPlugin();
    expect(table[PASSWORD_NAME]).toBe(before);
  });

  test("样式通道：复用继承的 input 动作件规则 + 原生显露钮抑制", () => {
    const cssx = tplx(PASSWORD_NAME);
    // 浏览器原生密码显露钮/清除钮抑制（Edge/IE）——本组件眼睛/清除是唯一动作面
    expect(cssx).toContain(".asc-password.asc-input-native::-ms-reveal,");
    expect(cssx).toContain(".asc-password.asc-input-native::-ms-clear{display:none;}");
    // 动作件 / 装饰容器样式仍来自继承的 input 模板拼接
    expect(tpl(INPUT_NAME)).toContain(".asc-input-action {");
    expect(tpl(PASSWORD_NAME)).toContain("asc-input-action asc-password-eye");
  });
});

describe("继承渲染（password → input → field）", () => {
  test("骨架 class 拼接 + input 的 props 面生效（placeholder / maxlength / value 初值）", async () => {
    const { root } = mount(
      `<span x-component:autospark.password="{ placeholder: '请输入密码', maxlength: 12, value: 'initial' }"></span>`,
      {},
    );
    await nextTick();
    const host = field(root);
    expect(host.classList.contains("asc-field")).toBe(true); // field 骨架类
    expect(host.classList.contains("asc-input")).toBe(true); // input 类（继承根拼接）
    expect(host.classList.contains("asc-password")).toBe(true); // 本组件类
    expect(host.classList.contains("asc-field-box")).toBe(true); // 盒饰
    const input = nativeOf(root)!;
    expect(input.type).toBe("password");
    expect(input.placeholder).toBe("请输入密码");
    expect(input.getAttribute("maxlength")).toBe("12");
    expect(input.value).toBe("initial");
    expect(input.hasAttribute("data-autospark-control")).toBe(true);
  });

  test("值桥继承：x-model 编译期初值经劫持快照落原生控件", async () => {
    const { root } = mount(`<span x-model="pwd" x-component:autospark.password></span>`, {
      pwd: "hunter2",
    });
    await nextTick();
    expect(nativeOf(root)!.value).toBe("hunter2");
  });

  test("name 透传继承：宿主 name 落原生控件（原生直提交载体）", async () => {
    const { root } = mount(`<span name="password" x-component:autospark.password></span>`, {});
    await nextTick();
    expect(nativeOf(root)!.getAttribute("name")).toBe("password");
  });
});

describe("type 冻结（组件身份，ADR-0034 决策 2）", () => {
  test("props 注入任意 type 均压回 password", async () => {
    const { root } = mount(
      `<span x-component:autospark.password="{ type: 'email', value: 'secret' }"></span>`,
      {},
    );
    await nextTick();
    await nextTick();
    expect(nativeOf(root)!.type).toBe("password");
  });

  test("precompile 折叠期丢弃 type 属性", () => {
    const { root } = mount(
      `<div><x-password type="text" placeholder="静态"></x-password></div>`,
      {},
      { autostart: false },
    );
    const host = root.children[0]!.children[0]!;
    const attr = [...host.attributes].find((a) => a.name === `x-component:${PASSWORD_NAME}`);
    expect(attr).toBeTruthy();
    expect(attr!.value).not.toContain("type:");
    expect(attr!.value).toContain('placeholder: "静态"');
  });
});

describe("前缀钥匙装饰（prefix 出口覆盖段）", () => {
  test("key 恒在，消费方 prefix 装饰排在其后（单根容器承接出口注入类）", async () => {
    const { root } = mount(
      `<span x-component:autospark.password="{ prefix: '账号' }"></span>`,
      {},
    );
    await nextTick();
    const pre = field(root).querySelector(".asc-field-prefix")!;
    expect(pre).toBeTruthy();
    expect(pre.classList.contains("asc-input-affix")).toBe(true); // 出口注入类落单根容器
    const key = pre.querySelector(".asc-password-key")!;
    expect(key).toBeTruthy();
    expect(iconHref(key)).toContain("as-key"); // 内置图标
    expect(pre.querySelector(".asc-input-text")!.textContent).toBe("账号");
    // key 在文本之前（DOM 序即呈现序）
    const seq = Array.from(pre.querySelectorAll("i, span")).map((n) => n.className);
    expect(seq[0]).toContain("asc-password-key");
  });

  test("无 prefix props 时仅钥匙（出口不消失——钥匙是组件身份装饰）", async () => {
    const { root } = mount(`<span x-component:autospark.password></span>`, {});
    await nextTick();
    const pre = field(root).querySelector(".asc-field-prefix")!;
    expect(pre.querySelector(".asc-password-key")).toBeTruthy();
    expect(pre.querySelector(".asc-input-text")).toBeNull();
  });

  test("消费方投影 prefix 插槽 → 整段让位（key 随覆盖链消失）；suffix props 装饰继承可用", async () => {
    const { root } = mount(
      [
        `<span x-component:autospark.password="{ suffix: '安全' }">`,
        `<template x-slot:prefix><b class="proj">投影</b></template>`,
        `</span>`,
      ].join(""),
      {},
    );
    await nextTick();
    const host = field(root);
    const pre = host.querySelector(".asc-field-prefix")!;
    expect(pre.classList.contains("proj")).toBe(true);
    expect(pre.querySelector(".asc-password-key")).toBeNull(); // 显式接管：key 让位
    // suffix 走继承来的 input 覆盖段（眼睛在其内侧，装饰在最外）
    const suf = host.querySelector(".asc-field-suffix")!;
    expect(suf.querySelector(".asc-input-text")!.textContent).toBe("安全");
  });
});

describe("明文态切换（revealed）", () => {
  test("眼睛钮：掩码态 eye → 点击转 text + eye-off + aria 同步；再点回掩码", async () => {
    const { root } = mount(
      `<span x-component:autospark.password="{ value: 'secret' }"></span>`,
      {},
    );
    await nextTick();
    const input = nativeOf(root)!;
    const eye = eyeOf(root)!;
    expect(eye).toBeTruthy();
    expect(eye.hasAttribute("data-autospark-action")).toBe(true); // 动作件标记（不转发焦点）
    expect(eye.getAttribute("role")).toBe("button");
    expect(eye.getAttribute("aria-pressed")).toBe("false");
    expect(eye.getAttribute("aria-label")).toBe("显示密码");
    expect(iconHref(eye)).toContain("as-eye");

    eye.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    await nextTick();
    expect(input.type).toBe("text"); // 明文态只改原生 type
    expect(input.value).toBe("secret"); // 值不变
    expect(eye.getAttribute("aria-pressed")).toBe("true");
    expect(eye.getAttribute("aria-label")).toBe("隐藏密码");
    expect(iconHref(eye)).toContain("as-eye-off");

    eye.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    await nextTick();
    expect(input.type).toBe("password");
    expect(eye.getAttribute("aria-pressed")).toBe("false");
  });

  test("点击照常冒泡（不阻断，与清除钮不同）", async () => {
    const { root } = mount(`<span x-component:autospark.password></span>`, {});
    await nextTick();
    let hostClicks = 0;
    field(root).addEventListener("click", () => hostClicks++);
    eyeOf(root)!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await nextTick();
    expect(hostClicks).toBe(1);
  });

  test("disabled：点击零效果（不进入明文态）", async () => {
    const { root } = mount(
      `<span x-component:autospark.password="{ value: 'secret', disabled: true }"></span>`,
      {},
    );
    await nextTick();
    eyeOf(root)!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await nextTick();
    expect(nativeOf(root)!.type).toBe("password");
    expect(eyeOf(root)!.getAttribute("aria-pressed")).toBe("false");
  });

  test("readonly：仍可切换（只读禁止编辑，不禁止查看）", async () => {
    const { root } = mount(
      `<span x-component:autospark.password="{ value: 'secret', readonly: true }"></span>`,
      {},
    );
    await nextTick();
    eyeOf(root)!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await nextTick();
    expect(nativeOf(root)!.type).toBe("text");
    expect(nativeOf(root)!.readOnly).toBe(true);
  });

  test("清空复位：清除钮清空后回掩码态", async () => {
    const { root } = mount(
      `<span x-component:autospark.password="{ value: 'secret', clearable: true }"></span>`,
      {},
    );
    await nextTick();
    eyeOf(root)!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await nextTick();
    expect(nativeOf(root)!.type).toBe("text");
    const clear = field(root).querySelector(".asc-input-clear")!;
    clear.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    await nextTick();
    expect(nativeOf(root)!.value).toBe("");
    expect(nativeOf(root)!.type).toBe("password"); // 清空即复位
    expect(eyeOf(root)!.getAttribute("aria-pressed")).toBe("false");
  });
});

describe("viewable 能力开关", () => {
  test("默认 true：眼睛钮在场", async () => {
    const { root } = mount(`<span x-component:autospark.password></span>`, {});
    await nextTick();
    expect(eyeOf(root)).toBeTruthy();
  });

  test("false：眼睛钮零 DOM", async () => {
    const { root } = mount(
      `<span x-component:autospark.password="{ viewable: false }"></span>`,
      {},
    );
    await nextTick();
    expect(eyeOf(root)).toBeNull();
    expect(field(root).querySelector(".asc-input-native")).toBeTruthy(); // 控件照常
  });

  test("运行时翻 false：强制复位隐藏（防明文无钮可关的悬空态）", async () => {
    const { root, engine } = mount(
      `<span x-component:autospark.password="{ value: 'secret', viewable: canView }"></span>`,
      { canView: true },
    );
    await nextTick();
    eyeOf(root)!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await nextTick();
    expect(nativeOf(root)!.type).toBe("text");

    engine.store.state.canView = false;
    await nextTick();
    await nextTick();
    expect(eyeOf(root)).toBeNull();
    expect(nativeOf(root)!.type).toBe("password"); // 复位
  });
});

describe("密码场景原生属性透传（minlength / autocomplete）", () => {
  test("落原生属性；置 0 / 空串后移除", async () => {
    const { root, engine } = mount(
      `<span x-component:autospark.password="{ minlength: min, autocomplete: ac }"></span>`,
      { min: 8, ac: "new-password" },
    );
    await nextTick();
    const input = nativeOf(root)!;
    expect(input.getAttribute("minlength")).toBe("8");
    expect(input.getAttribute("autocomplete")).toBe("new-password");

    engine.store.state.min = 0;
    engine.store.state.ac = "";
    await nextTick();
    await nextTick();
    expect(input.hasAttribute("minlength")).toBe(false);
    expect(input.hasAttribute("autocomplete")).toBe(false);
  });

  test("裸属性形态折叠：minlength 数字推断、autocomplete 字符串、viewable 布尔归一", () => {
    const { root } = mount(
      `<div><x-password minlength="6" autocomplete="current-password" viewable></x-password></div>`,
      {},
      { autostart: false },
    );
    const host = root.children[0]!.children[0]!;
    const v = [...host.attributes].find((a) => a.name === `x-component:${PASSWORD_NAME}`)!.value;
    expect(v).toContain("minlength: 6");
    expect(v).toContain('autocomplete: "current-password"');
    expect(v).toContain("viewable: true");
  });
});

describe("precompile 元素名变换（x-password）", () => {
  test("x-password → span + props 折叠；name/class/x-/@ 保留给宿主", () => {
    const { root } = mount(
      `<div><x-password name="pwd" class="my" x-model="a" @click="b = 1" placeholder="提示"></x-password></div>`,
      { a: "", b: 0 },
      { autostart: false },
    );
    const host = root.children[0]!.children[0]!;
    expect(host.tagName).toBe("SPAN");
    expect(host.getAttribute("name")).toBe("pwd");
    expect(host.getAttribute("class")).toBe("my");
    expect(host.hasAttribute("x-model")).toBe(true);
    expect([...host.attributes].some((a) => a.name.startsWith("@"))).toBe(true);
    const v = [...host.attributes].find((a) => a.name === `x-component:${PASSWORD_NAME}`)!.value;
    expect(v).toContain('placeholder: "提示"');
    expect(v).not.toContain("name:");
  });

  test("纯文本子内容折叠为 value 初值", () => {
    const { root } = mount(
      `<div><x-password>initial</x-password></div>`,
      {},
      { autostart: false },
    );
    const host = root.children[0]!.children[0]!;
    const v = [...host.attributes].find((a) => a.name === `x-component:${PASSWORD_NAME}`)!.value;
    expect(v).toContain('value: "initial"');
    expect(host.textContent).toBe("");
  });
});
