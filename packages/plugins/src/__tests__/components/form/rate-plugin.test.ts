/**
 * rate 组件插件测试（组件库 P1 form 批轻件，ADR-0018 自绘路线）：
 * - 注册面：rate 模板入全局组件表（副作用导入内嵌 base-field 注册，继承链
 *   rate → base-field → autospark.base）+ 自绘可访问性面（role=slider 单焦点
 *   键盘模型）+ hidden 表单载体；
 * - 化身渲染：星形 ×N（max 可配，x-for 渲染引擎内置 star 图标）、点亮层 fill
 *   同步（整星/半星）、aria 语义随动；
 * - 交互：点击提交（change detail={value} + 载体同步 + x-model 回写）、悬停
 *   预览/移出恢复、clearable 同分清零、键盘 Arrow/Home/End（半星粒度）、
 *   disabled/readonly 阻断；
 * - 值桥（x-model 兼容协议，数字语域）：初始注入（expando 快照）、DOM→state、
 *   state→DOM（劫持 setter）、value props 单向同步；
 * - BaseField 骨架通道：disabled 载体出表、status aria-invalid、name 透传。
 */
import "../../setup";
import { describe, expect, test } from "bun:test";
import { AutoSpark } from "autospark";
import { mount, nextTick } from "../../helpers";
import { RATE_NAME, bootstrapRatePlugin } from "../../../components/form/rate/index";
import { BASE_FIELD_NAME } from "../../../components/base/base-field/index";

/** 取全局表模板（空白归一——oxfmt 折行使逐字匹配假红） */
const tpl = (name: string) =>
  ((AutoSpark as { components: Record<string, string> }).components[name] as string).replace(
    /\s+/g,
    " ",
  );

/** 取实例化后的宿主（.asc-field 骨架根） */
const field = (root: HTMLElement) => root.querySelector(".asc-field") as HTMLElement;
/** 取星组交互件（role=slider） */
const starsOf = (root: HTMLElement) =>
  root.querySelector(".asc-rate-stars") as HTMLElement | null;
/** 取全部星项 */
const itemsOf = (root: HTMLElement) =>
  Array.from(root.querySelectorAll(".asc-rate-item")) as HTMLElement[];
/** 取表单载体（hidden input） */
const carrierOf = (root: HTMLElement) =>
  root.querySelector(".asc-rate-carrier") as HTMLInputElement | null;
/** 取第 i 星（1 基）点亮层 fill 百分比 */
const fillOf = (root: HTMLElement, i: number) =>
  itemsOf(root)[i - 1]?.style.getPropertyValue("--asc-rate-fill") ?? "";

describe("注册面（ADR-0018 / ADR-0020）", () => {
  test("模块加载即注册：rate 以副作用导入内嵌 base-field，双模板均入全局组件表", () => {
    const table = (AutoSpark as { components: Record<string, string> }).components;
    expect(typeof table[RATE_NAME]).toBe("string");
    expect(typeof table[BASE_FIELD_NAME]).toBe("string");
    expect(tpl(RATE_NAME)).toContain(`x-define="${RATE_NAME}"`);
    expect(tpl(RATE_NAME)).toContain('x-define:inherit="autospark.base-field"');
    expect(tpl(RATE_NAME)).toContain('role="slider"'); // 自绘控件可访问性自持
    expect(tpl(RATE_NAME)).toContain('type="hidden"'); // 表单载体（自绘控件代理）
    expect(tpl(RATE_NAME)).toContain('x-icon="\'star\'"'); // 引擎内置星形图标
  });

  test("bootstrap 幂等：重复调用不覆盖（同键赋值幂等）", () => {
    const table = (AutoSpark as { components: Record<string, string> }).components;
    const before = table[RATE_NAME];
    bootstrapRatePlugin();
    expect(table[RATE_NAME]).toBe(before);
  });

  test("样式通道：tone 点亮与暗色兜底变体均在模板中（ADR-0129 三级回退链）", () => {
    const t = tpl(RATE_NAME);
    expect(t).toContain("color: var(--asc-field-tone)"); // 点亮色（status 联动骨架 tone）
    expect(t).toContain("[dark] .asc-rate-off,");
    expect(t).toContain("clip-path: inset(0 calc(100% - var(--asc-rate-fill)) 0 0)"); // 半星裁剪
  });
});

describe("化身渲染", () => {
  test("星形 ×N（max 可配）+ 双层结构（灰底 + 亮覆盖层）+ 内置 star 图标引用", async () => {
    const { root } = mount(`<span x-component:autospark.rate></span>`, {});
    await nextTick();
    const host = field(root);
    expect(host.classList.contains("asc-field")).toBe(true);
    expect(host.classList.contains("asc-rate")).toBe(true);
    expect(host.classList.contains("asc-field-box")).toBe(false); // 裸态无盒饰
    const its = itemsOf(root);
    expect(its.length).toBe(5); // 缺省 max=5
    expect(its[0].querySelector(".asc-rate-off use")).toBeTruthy(); // 灰底星（symbol 引用）
    expect(its[0].querySelector(".asc-rate-on use")).toBeTruthy(); // 亮覆盖层星
    expect(fillOf(root, 1)).toBe("0%"); // 缺省 0 分全灰
  });

  test("max 配置星数 + aria-valuemax 随动 + max 变化重建", async () => {
    const { root, engine } = mount(
      `<span x-component:autospark.rate="{ max: mx, value: 2 }"></span>`,
      { mx: 3 },
    );
    await nextTick();
    expect(itemsOf(root).length).toBe(3);
    expect(starsOf(root)!.getAttribute("aria-valuemax")).toBe("3");
    engine.store.state.mx = 8;
    await nextTick();
    await nextTick(); // x-for 重渲染一跳
    expect(itemsOf(root).length).toBe(8);
    expect(starsOf(root)!.getAttribute("aria-valuemax")).toBe("8");
  });

  test("hidden 载体控件标记 + name 透传 + 宿主 aria-label 透传（零内置文案标注通道）", async () => {
    const { root } = mount(
      `<span name="score" aria-label="服务评分" x-component:autospark.rate></span>`,
      {},
    );
    await nextTick();
    const carrier = carrierOf(root)!;
    expect(carrier.type).toBe("hidden");
    expect(carrier.hasAttribute("data-autospark-control")).toBe(true); // 骨架同步目标
    expect(carrier.getAttribute("name")).toBe("score");
    expect(starsOf(root)!.getAttribute("aria-label")).toBe("服务评分");
  });
});

describe("交互", () => {
  test("点击第 n 星：fill 逐星点亮 + aria-valuenow + 载体同步 + change detail", async () => {
    const { root } = mount(`<span x-component:autospark.rate></span>`, {});
    await nextTick();
    const host = field(root);
    let detail: any = null;
    host.addEventListener("change", (e) => {
      detail = (e as CustomEvent).detail;
    });
    itemsOf(root)[2].dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    await nextTick();
    expect(fillOf(root, 1)).toBe("100%");
    expect(fillOf(root, 2)).toBe("100%");
    expect(fillOf(root, 3)).toBe("100%");
    expect(fillOf(root, 4)).toBe("0%");
    expect(starsOf(root)!.getAttribute("aria-valuenow")).toBe("3");
    expect(carrierOf(root)!.value).toBe("3"); // 表单载体恒随
    expect(detail && detail.value === 3).toBe(true); // change detail = { value }
  });

  test("悬停预览：mousemove 点亮预览态（data-hover）+ mouseleave 恢复实际值", async () => {
    const { root } = mount(`<span x-component:autospark.rate="{ value: 1 }"></span>`, {});
    await nextTick();
    const host = field(root);
    itemsOf(root)[3].dispatchEvent(new MouseEvent("mousemove", { bubbles: true }));
    await nextTick();
    expect(host.hasAttribute("data-hover")).toBe(true); // 预览态标记
    expect(fillOf(root, 4)).toBe("100%"); // 预览到第 4 星
    expect(carrierOf(root)!.value).toBe("1"); // 载体不随预览（实际值恒随）
    host.dispatchEvent(new Event("mouseleave"));
    await nextTick();
    expect(host.hasAttribute("data-hover")).toBe(false);
    expect(fillOf(root, 2)).toBe("0%"); // 恢复实际值 1 分
    expect(fillOf(root, 1)).toBe("100%");
  });

  test("clearable：再次点击同分清零", async () => {
    const { root } = mount(
      `<span x-component:autospark.rate="{ value: 3, clearable: true }"></span>`,
      {},
    );
    await nextTick();
    const host = field(root);
    let detail: any = null;
    host.addEventListener("change", (e) => {
      detail = (e as CustomEvent).detail;
    });
    itemsOf(root)[2].dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    await nextTick();
    expect(detail && detail.value === 0).toBe(true); // 同分清零
    expect(fillOf(root, 1)).toBe("0%");
    expect(carrierOf(root)!.value).toBe("0");
  });

  test("allowHalf：键盘半星粒度（ArrowRight +0.5）+ 半星 fill 50%", async () => {
    const { root } = mount(
      `<span x-component:autospark.rate="{ allowHalf: true }"></span>`,
      {},
    );
    await nextTick();
    const stars = starsOf(root)!;
    stars.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true }),
    );
    await nextTick();
    expect(fillOf(root, 1)).toBe("50%"); // 0.5 分半星
    expect(stars.getAttribute("aria-valuenow")).toBe("0.5");
    stars.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true }),
    );
    await nextTick();
    expect(fillOf(root, 1)).toBe("100%"); // 1 分整星
    expect(fillOf(root, 2)).toBe("0%");
  });

  test("键盘 ArrowUp/ArrowDown/Home/End（整星粒度 + 默认行为阻断）", async () => {
    const { root } = mount(`<span x-component:autospark.rate></span>`, {});
    await nextTick();
    const stars = starsOf(root)!;
    let prevented = false;
    field(root).addEventListener("keydown", (e) => {
      prevented = e.defaultPrevented;
    });
    stars.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true, cancelable: true }),
    );
    await nextTick();
    expect(stars.getAttribute("aria-valuenow")).toBe("1");
    stars.dispatchEvent(
      new KeyboardEvent("keydown", { key: "End", bubbles: true, cancelable: true }),
    );
    await nextTick();
    expect(stars.getAttribute("aria-valuenow")).toBe("5");
    expect(prevented).toBe(true);
    stars.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Home", bubbles: true, cancelable: true }),
    );
    await nextTick();
    expect(stars.getAttribute("aria-valuenow")).toBe("0");
    stars.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true }),
    );
    await nextTick();
    expect(stars.getAttribute("aria-valuenow")).toBe("0"); // 下界顶死
  });

  test("disabled / readonly 阻断提交与预览", async () => {
    const { root } = mount(`<span x-component:autospark.rate="{ disabled: true }"></span>`, {});
    await nextTick();
    itemsOf(root)[2].dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    await nextTick();
    expect(starsOf(root)!.getAttribute("aria-valuenow")).toBe("0");
    expect(starsOf(root)!.getAttribute("aria-disabled")).toBe("true");

    const { root: r2 } = mount(
      `<span x-component:autospark.rate="{ readonly: true }"></span>`,
      {},
    );
    await nextTick();
    itemsOf(r2)[2].dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    await nextTick();
    expect(starsOf(r2)!.getAttribute("aria-valuenow")).toBe("0");
  });
});

describe("值桥（x-model 兼容协议，数字语域）", () => {
  test("初始注入：x-model 编译期写入（expando）经劫持快照落点亮", async () => {
    const { root } = mount(
      `<span x-model.number="score" x-component:autospark.rate></span>`,
      { score: 4 },
    );
    await nextTick();
    expect(fillOf(root, 4)).toBe("100%");
    expect((root.children[0] as HTMLInputElement).value).toBe("4"); // 劫持 getter 数字语域
    expect(carrierOf(root)!.value).toBe("4");
  });

  test("DOM→state：点击提交派发 input，x-model.number 保真回写", async () => {
    const { root, engine } = mount(
      `<span x-model.number="score" x-component:autospark.rate></span>`,
      { score: 0 },
    );
    await nextTick();
    itemsOf(root)[1].dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    await nextTick();
    expect(engine.store.state.score).toBe(2); // 数字语域 + .number 保真
  });

  test("state→DOM：状态变更经劫持 setter 同步点亮与载体", async () => {
    const { root, engine } = mount(
      `<span x-model.number="score" x-component:autospark.rate></span>`,
      { score: 0 },
    );
    await nextTick();
    engine.store.state.score = 3;
    await nextTick();
    expect(fillOf(root, 3)).toBe("100%");
    expect(fillOf(root, 4)).toBe("0%");
    expect(carrierOf(root)!.value).toBe("3");
  });

  test("value props 单向同步（无 x-model）：外部状态变化经 watch 同步", async () => {
    const { root, engine } = mount(
      `<span x-component:autospark.rate="{ value: sc }"></span>`,
      { sc: 2 },
    );
    await nextTick();
    expect(fillOf(root, 2)).toBe("100%");
    engine.store.state.sc = 5;
    await nextTick();
    expect(fillOf(root, 5)).toBe("100%");
  });
});

describe("BaseField 骨架通道（经 rate 实例化消费，ADR-0020）", () => {
  test("disabled：载体随禁用出表（原生表单语义）+ 宿主 data-disabled", async () => {
    const { root } = mount(`<span x-component:autospark.rate="{ disabled: true }"></span>`, {});
    await nextTick();
    const host = field(root);
    expect(host.hasAttribute("data-disabled")).toBe(true);
    expect(carrierOf(root)!.disabled).toBe(true); // 禁用即出表
  });

  test("status 状态色：宿主 data-status + error 态星组 aria-invalid", async () => {
    const { root, engine } = mount(
      `<span x-component:autospark.rate="{ status: st }"></span>`,
      { st: "" },
    );
    await nextTick();
    const host = field(root);
    expect(host.hasAttribute("data-status")).toBe(false);
    engine.store.state.st = "error";
    await nextTick();
    expect(host.getAttribute("data-status")).toBe("error");
    expect(starsOf(root)!.getAttribute("aria-invalid")).toBe("true"); // 自绘控件语义同步
  });
});
