/**
 * switch 组件插件测试（组件库 P0 form 批轻件，ADR-0019 合批 / ADR-0020 BaseField
 * 消费契约）：
 * - 注册面：switch 模板入全局组件表（副作用导入内嵌 base-field 注册，继承链
 *   switch → base-field → autospark.base）；
 * - 化身渲染：骨架 class 拼接（裸态无盒饰）、自绘轨道可访问性面（role=switch +
 *   aria-checked + tabindex + data-autospark-action 交互件标记）、表单载体
 *   input[type=hidden]（data-autospark-control，disabled 同步目标）；
 * - 交互：点击翻转（aria/data-checked/载体三向同步 + change detail={value}）、
 *   键盘 Space/Enter 切换、loading 阻断、disabled/readonly 阻断；
 * - 值桥（x-model 兼容协议，布尔语域）：初始注入（expando 快照）、DOM→state
 *   （派发 input → x-model.boolean 保真回写）、state→DOM（劫持 setter）；
 * - BaseField 骨架通道（经 switch 实例化消费）：disabled 载体出表、status 状态色
 *   （轨道 aria-invalid）、焦点态追踪。
 */
import "../../setup";
import { describe, expect, test } from "bun:test";
import { AutoSpark } from "autospark";
import { mount, nextTick } from "../../helpers";
import { SWITCH_NAME, bootstrapSwitchPlugin } from "../../../components/form/switch/index";
import { BASE_FIELD_NAME } from "../../../components/base/base-field/index";

/** 取全局表模板（空白归一——oxfmt 折行使逐字匹配假红） */
const tpl = (name: string) =>
  ((AutoSpark as { components: Record<string, string> }).components[name] as string).replace(
    /\s+/g,
    " ",
  );

/** 取实例化后的宿主（.asc-field 骨架根） */
const field = (root: HTMLElement) => root.querySelector(".asc-field") as HTMLElement;
/** 取自绘轨道（交互件） */
const trackOf = (root: HTMLElement) => root.querySelector(".asc-switch-track") as HTMLElement | null;
/** 取表单载体（hidden input） */
const carrierOf = (root: HTMLElement) =>
  root.querySelector(".asc-switch-carrier") as HTMLInputElement | null;

describe("注册面（ADR-0019 合批 / ADR-0020）", () => {
  test("模块加载即注册：switch 以副作用导入内嵌 base-field，双模板均入全局组件表", () => {
    const table = (AutoSpark as { components: Record<string, string> }).components;
    expect(typeof table[SWITCH_NAME]).toBe("string");
    expect(typeof table[BASE_FIELD_NAME]).toBe("string");
    expect(tpl(SWITCH_NAME)).toContain(`x-define="${SWITCH_NAME}"`);
    expect(tpl(SWITCH_NAME)).toContain('x-define:inherit="autospark.base-field"'); // 继承链子端
    expect(tpl(SWITCH_NAME)).toContain('role="switch"'); // 自绘控件可访问性自持
    expect(tpl(SWITCH_NAME)).toContain('type="hidden"'); // 表单载体
  });

  test("bootstrap 幂等：重复调用不覆盖（同键赋值幂等）", () => {
    const table = (AutoSpark as { components: Record<string, string> }).components;
    const before = table[SWITCH_NAME];
    bootstrapSwitchPlugin();
    expect(table[SWITCH_NAME]).toBe(before);
  });

  test("样式通道：开态 tone/暗色兜底选择器均在模板中（ADR-0129 三级回退链）", () => {
    const t = tpl(SWITCH_NAME);
    expect(t).toContain(".asc-switch[data-checked] .asc-switch-track"); // 开态视觉（宿主 data-checked 通道）
    expect(t).toContain("background: var(--asc-field-tone)"); // 开态主色（status 联动骨架 tone）
    expect(t).toContain(".asc-switch[data-loading] .asc-switch-thumb"); // loading 态视觉
    expect(t).toContain("[dark] .asc-switch-track,"); // 暗色兜底变体
  });
});

describe("化身渲染与可访问性面", () => {
  test("骨架 class 拼接（裸态无盒饰）+ 轨道交互件标记 + hidden 载体控件标记", async () => {
    const { root } = mount(`<span x-component:autospark.switch="{ label: '通知' }"></span>`, {});
    await nextTick();
    const host = field(root);
    expect(host.classList.contains("asc-field")).toBe(true); // base-field 骨架类
    expect(host.classList.contains("asc-switch")).toBe(true);
    expect(host.classList.contains("asc-field-box")).toBe(false); // 裸态控件不加盒饰
    const track = trackOf(root)!;
    expect(track.getAttribute("role")).toBe("switch");
    expect(track.getAttribute("aria-checked")).toBe("false");
    expect(track.getAttribute("tabindex")).toBe("0"); // 可聚焦（键盘通道）
    expect(track.hasAttribute("data-autospark-action")).toBe(true); // 交互件标记（点击不转发焦点）
    const carrier = carrierOf(root)!;
    expect(carrier.type).toBe("hidden");
    expect(carrier.hasAttribute("data-autospark-control")).toBe(true); // 骨架同步目标
    expect(host.querySelector(".asc-switch-label")!.textContent).toBe("通知"); // label props 兜底
  });

  test("name 透传：宿主 name 落表单载体（hidden 恒提交当前布尔）", async () => {
    const { root } = mount(`<span name="enabled" x-component:autospark.switch></span>`, {});
    await nextTick();
    expect(carrierOf(root)!.getAttribute("name")).toBe("enabled");
  });
});

describe("交互", () => {
  test("点击轨道翻转：aria-checked / 宿主 data-checked / 载体 value 三向同步 + change detail", async () => {
    const { root } = mount(`<span x-component:autospark.switch></span>`, {});
    await nextTick();
    const host = field(root);
    let detail: any = null;
    host.addEventListener("change", (e) => {
      detail = (e as CustomEvent).detail;
    });
    trackOf(root)!.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    await nextTick();
    expect(trackOf(root)!.getAttribute("aria-checked")).toBe("true");
    expect(host.hasAttribute("data-checked")).toBe(true);
    expect(carrierOf(root)!.value).toBe("true"); // 表单载体恒随
    expect(detail && detail.value === true).toBe(true); // change detail = { value: 新布尔 }
    // 再点翻回
    trackOf(root)!.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    await nextTick();
    expect(trackOf(root)!.getAttribute("aria-checked")).toBe("false");
    expect(carrierOf(root)!.value).toBe("false");
  });

  test("点击文案热区亦触发切换（整组热区）", async () => {
    const { root } = mount(`<span x-component:autospark.switch="{ label: '热区' }"></span>`, {});
    await nextTick();
    const label = field(root).querySelector(".asc-switch-label")!;
    label.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    await nextTick();
    expect(trackOf(root)!.getAttribute("aria-checked")).toBe("true");
  });

  test("键盘 Space/Enter 切换（自绘控件自持，Space 阻断页面滚动）", async () => {
    const { root } = mount(`<span x-component:autospark.switch></span>`, {});
    await nextTick();
    const track = trackOf(root)!;
    let prevented = false;
    track.dispatchEvent(
      new KeyboardEvent("keydown", { key: " ", bubbles: true, cancelable: true }),
    );
    await nextTick();
    expect(track.getAttribute("aria-checked")).toBe("true"); // Space 切换
    track.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }),
    );
    await nextTick();
    expect(track.getAttribute("aria-checked")).toBe("false"); // Enter 切换
    // preventDefault 在宿主级委托监听里执行——断言监听挂宿主（晚于组件监听注册，读取最终态）
    field(root).addEventListener("keydown", (e) => {
      prevented = e.defaultPrevented;
    });
    track.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true, cancelable: true }));
    expect(prevented).toBe(true); // 默认行为被阻断
  });

  test("loading 阻断切换 + 宿主 data-loading 通道（视觉不淡化）", async () => {
    const { root, engine } = mount(
      `<span x-component:autospark.switch="{ loading: busy }"></span>`,
      { busy: true },
    );
    await nextTick();
    const host = field(root);
    expect(host.hasAttribute("data-loading")).toBe(true); // loading 视觉通道（CSS 旋转圈）
    trackOf(root)!.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    await nextTick();
    expect(trackOf(root)!.getAttribute("aria-checked")).toBe("false"); // 阻断
    engine.store.state.busy = false;
    await nextTick();
    expect(host.hasAttribute("data-loading")).toBe(false);
    trackOf(root)!.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    await nextTick();
    expect(trackOf(root)!.getAttribute("aria-checked")).toBe("true"); // loading 退出可切
  });

  test("disabled / readonly 阻断切换", async () => {
    const { root } = mount(`<span x-component:autospark.switch="{ disabled: true }"></span>`, {});
    await nextTick();
    trackOf(root)!.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    await nextTick();
    expect(trackOf(root)!.getAttribute("aria-checked")).toBe("false"); // disabled 阻断

    const { root: r2 } = mount(`<span x-component:autospark.switch="{ readonly: true }"></span>`, {});
    await nextTick();
    trackOf(r2)!.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    await nextTick();
    expect(trackOf(r2)!.getAttribute("aria-checked")).toBe("false"); // readonly 阻断（值不可变语义）
  });
});

describe("值桥（x-model 兼容协议，布尔语域）", () => {
  test("初始注入：x-model 编译期写入（expando）经劫持快照落勾选", async () => {
    const { root } = mount(`<span x-model="on" x-component:autospark.switch></span>`, {
      on: true,
    });
    await nextTick();
    expect(trackOf(root)!.getAttribute("aria-checked")).toBe("true");
    expect((root.children[0] as HTMLInputElement).value).toBe("true"); // 劫持 getter 布尔语域
  });

  test("DOM→state：切换派发 input，x-model.boolean 保真回写", async () => {
    const { root, engine } = mount(
      `<span x-model.boolean="on" x-component:autospark.switch></span>`,
      { on: false },
    );
    await nextTick();
    trackOf(root)!.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    await nextTick();
    expect(engine.store.state.on).toBe(true); // 布尔语域 + .boolean 类型保真
  });

  test("state→DOM：状态变更经劫持 setter 同步视觉与载体", async () => {
    const { root, engine } = mount(`<span x-model="on" x-component:autospark.switch></span>`, {
      on: false,
    });
    await nextTick();
    engine.store.state.on = true;
    await nextTick();
    expect(trackOf(root)!.getAttribute("aria-checked")).toBe("true");
    expect(carrierOf(root)!.value).toBe("true");
    expect(field(root).hasAttribute("data-checked")).toBe(true);
  });

  test("checked props 单向同步（无 x-model）：外部状态变化经 watch 同步", async () => {
    const { root, engine } = mount(`<span x-component:autospark.switch="{ checked: flag }"></span>`, {
      flag: false,
    });
    await nextTick();
    engine.store.state.flag = true;
    await nextTick();
    expect(trackOf(root)!.getAttribute("aria-checked")).toBe("true");
  });
});

describe("BaseField 骨架通道（经 switch 实例化消费，ADR-0020）", () => {
  test("disabled：载体随禁用出表（原生表单语义）+ 宿主 data-disabled", async () => {
    const { root } = mount(`<span x-component:autospark.switch="{ disabled: true }"></span>`, {});
    await nextTick();
    const host = field(root);
    expect(host.hasAttribute("data-disabled")).toBe(true);
    expect(carrierOf(root)!.disabled).toBe(true); // 禁用即出表
  });

  test("status 状态色：宿主 data-status + error 态轨道 aria-invalid（自绘控件语义同步）", async () => {
    const { root, engine } = mount(`<span x-component:autospark.switch="{ status: st }"></span>`, {
      st: "",
    });
    await nextTick();
    const host = field(root);
    engine.store.state.st = "error";
    await nextTick();
    expect(host.getAttribute("data-status")).toBe("error");
    expect(trackOf(root)!.getAttribute("aria-invalid")).toBe("true"); // 轨道（role=switch）标注
  });

  test("焦点态追踪：轨道聚焦挂 data-focus，失焦摘除", async () => {
    const { root } = mount(`<span x-component:autospark.switch></span>`, {});
    await nextTick();
    const host = field(root);
    const track = trackOf(root)!;
    track.dispatchEvent(new Event("focusin", { bubbles: true }));
    await nextTick();
    expect(host.hasAttribute("data-focus")).toBe(true);
    track.dispatchEvent(new Event("focusout", { bubbles: true }));
    await nextTick();
    expect(host.hasAttribute("data-focus")).toBe(false);
  });
});
