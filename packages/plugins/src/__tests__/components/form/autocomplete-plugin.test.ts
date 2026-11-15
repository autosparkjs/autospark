/**
 * autocomplete 组件插件测试（组件库 P3 下拉族 form 件，ADR-0027）：
 * - 注册面：autocomplete / autocomplete-panel 双模板入全局组件表（内嵌 field
 *   注册，继承链 autocomplete → field → autospark.base）+ 面板 x-popover 消费声明；
 * - 化身渲染：骨架 class 拼接、原生控件 combobox 语义、占位文案（props 覆盖与 i18n
 *   词典回退「请输入」）、name 表单桥透传、禁用态；
 * - 值桥（文本语域，ADR-0020 input 范式）：宿主 el.value 劫持、输入自然冒泡（x-model
 *   直收）、value props 单向同步；
 * - 建议面板（x-popover 机制呈现，跨插件依赖 autospark.overlay）：点击开合 / 聚焦
 *   确保开 / 本地过滤（含 string[] 归一化与无匹配空态）/ 选中三派发（input + change +
 *   select detail={value}）/ suggestions 状态引用热更新 / 面板外点击与 ESC 关闭（机制继承）；
 * - fetch 异步通道（ADR-0027 决策 3）：异步建议 + loading 指示 + 防抖合流 + 次序守卫
 *   + 全权接管；
 * - 键盘导航（select 同款高亮漫游模型）：上下移动高亮（跳过禁用项）+ Enter 确认 / 关面板；
 * - IME 组合态守卫：composing 期不驱动建议管道；
 * - precompile 元素名变换：<x-autocomplete> 属性折叠（静态 / :绑定 / 裸布尔）。
 */
import "../../setup";
// 显式引入 overlay 家族插件（x-popover 指令——建议面板的呈现通道，跨插件依赖镜像）
import "../../../directives/overlay/index";

import { describe, expect, test, afterEach } from "bun:test";
import { AutoSpark } from "autospark";
import { mount, nextTick } from "../../helpers";
import {
  AUTOCOMPLETE_NAME,
  AUTOCOMPLETE_PANEL_NAME,
  bootstrapAutocompletePlugin,
} from "../../../components/form/autocomplete/index";
import { FIELD_NAME } from "../../../components/base/field/index";

/** 取全局表模板（空白归一——oxfmt 折行使逐字匹配假红） */
const tpl = (name: string) =>
  ((AutoSpark as { components: Record<string, string> }).components[name] as string).replace(
    /\s+/g,
    " ",
  );

/** 取实例化后的宿主（.asc-field 骨架根） */
const field = (root: HTMLElement) => root.querySelector(".asc-field") as HTMLElement;
/** 内层原生控件 */
const nativeOf = (root: HTMLElement) =>
  root.querySelector(".asc-autocomplete-native") as HTMLInputElement | null;
/** 触发器包裹层（popover 宿主） */
const triggerOf = (root: HTMLElement) =>
  root.querySelector(".asc-autocomplete-trigger") as HTMLElement | null;
/** 建议面板（渲染进 body 覆盖物容器——engine 级副作用，测试须清理） */
const panelOf = () => document.querySelector(".asc-autocomplete-panel") as HTMLElement | null;
/** 建议项集（当前面板内） */
const optionsOf = () =>
  Array.from(document.querySelectorAll(".asc-autocomplete-panel .asc-autocomplete-option"));

/** 引擎回收（面板挂 body 覆盖物容器——engine destroy 级联清理，防跨用例泄漏） */
const engines: any[] = [];
const mountAc = (html: string, state: any, options?: any) => {
  const m = mount(html, state, { animate: false, ...options });
  engines.push(m.engine);
  return m;
};

afterEach(() => {
  for (const e of engines.splice(0)) e.destroy?.();
});

/** 通用建议集（状态引用注入——字面量数组有引擎死环缺陷，ADR-0022） */
const CITIES = [
  { value: "bj", label: "北京" },
  { value: "sh", label: "上海" },
  { value: "gz", label: "广州", disabled: true },
  { value: "sz", label: "深圳" },
];

/** 点击触发器开面板（popover click toggle，select 同款驱动方式） */
const openByClick = async (root: HTMLElement) => {
  triggerOf(root)!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  await nextTick();
  await nextTick();
};

/** 输入（设值 + 冒泡 input；可选先聚焦使 applyItems 自动开面板——聚焦仅一次，
 *  连续键入复用既有焦点，模拟真实打字（每键重聚焦会重复触发 focus 确保开路径）） */
const focusedRoots = new WeakSet<HTMLElement>();
const typeInto = (root: HTMLElement, text: string, focus = true) => {
  const n = nativeOf(root)!;
  if (focus && !focusedRoots.has(root)) {
    focusedRoots.add(root);
    n.focus();
    n.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
  }
  n.value = text;
  n.dispatchEvent(new Event("input", { bubbles: true }));
};

describe("注册面（ADR-0027）", () => {
  test("模块加载即注册：autocomplete / autocomplete-panel 双模板均入全局组件表（内嵌 field）", () => {
    const table = (AutoSpark as { components: Record<string, string> }).components;
    expect(typeof table[AUTOCOMPLETE_NAME]).toBe("string");
    expect(typeof table[AUTOCOMPLETE_PANEL_NAME]).toBe("string");
    expect(typeof table[FIELD_NAME]).toBe("string");
    expect(tpl(AUTOCOMPLETE_NAME)).toContain(`x-define="${AUTOCOMPLETE_NAME}"`);
    expect(tpl(AUTOCOMPLETE_NAME)).toContain('x-define:inherit="autospark.field"'); // 继承链子端
    expect(tpl(AUTOCOMPLETE_NAME)).toContain(`x-popover:${AUTOCOMPLETE_PANEL_NAME}`); // 面板消费声明
    expect(tpl(AUTOCOMPLETE_PANEL_NAME)).toContain(`x-define="${AUTOCOMPLETE_PANEL_NAME}"`);
  });

  test("bootstrap 幂等：重复调用不覆盖（同键赋值幂等）", () => {
    const table = (AutoSpark as { components: Record<string, string> }).components;
    const before = table[AUTOCOMPLETE_NAME];
    const beforePanel = table[AUTOCOMPLETE_PANEL_NAME];
    bootstrapAutocompletePlugin();
    expect(table[AUTOCOMPLETE_NAME]).toBe(before);
    expect(table[AUTOCOMPLETE_PANEL_NAME]).toBe(beforePanel);
  });

  test("样式通道：三级回退链与暗色兜底变体均在模板中（ADR-0129）", () => {
    const ac = tpl(AUTOCOMPLETE_NAME);
    expect(ac).toContain("var(--auto-input-placeholder, var(--asc-autocomplete-placeholder,");
    expect(ac).toContain(".asc-autocomplete-option[data-active] {");
    expect(ac).toContain("[dark] .asc-autocomplete-panel,");
    expect(ac).toContain("[data-dark] .asc-autocomplete-option[data-disabled]");
  });
});

describe("化身渲染与 props 同步", () => {
  test("骨架 class 拼接 + 原生控件 combobox 语义 + data-autospark-control 标记", async () => {
    const { root } = mountAc(
      `<span x-component:autospark.autocomplete="{ suggestions: opts }"></span>`,
      { opts: CITIES },
    );
    await nextTick();
    const host = field(root);
    expect(host.classList.contains("asc-field")).toBe(true); // field 骨架类
    expect(host.classList.contains("asc-autocomplete")).toBe(true);
    expect(host.classList.contains("asc-field-box")).toBe(true); // 盒饰选配类（input 同款）
    const n = nativeOf(root) as HTMLInputElement;
    expect(n.tagName).toBe("INPUT"); // 真 input（复制 input 结构，ADR-0027 决策 1）
    expect(n.getAttribute("role")).toBe("combobox");
    expect(n.getAttribute("aria-haspopup")).toBe("listbox");
    expect(n.getAttribute("aria-autocomplete")).toBe("list");
    expect(n.getAttribute("aria-expanded")).toBe("false");
    expect(n.hasAttribute("data-autospark-control")).toBe(true); // 标记协议挂点（骨架同步目标）
    expect(triggerOf(root)).toBeTruthy(); // popover 宿主
  });

  test("占位文案：props 覆盖优先；缺省回退「请输入」（i18n 词典 autocomplete.placeholder）", async () => {
    const a = mountAc(
      `<span x-component:autospark.autocomplete="{ suggestions: opts, placeholder: '输入城市' }"></span>`,
      { opts: CITIES },
    );
    await nextTick();
    expect(nativeOf(a.root)!.placeholder).toBe("输入城市");
    a.engine.destroy();
    engines.splice(engines.indexOf(a.engine), 1);

    const b = mountAc(
      `<span x-component:autospark.autocomplete="{ suggestions: opts }"></span>`,
      { opts: CITIES },
    );
    await nextTick();
    expect(nativeOf(b.root)!.placeholder).toBe("请输入");
  });

  test("初值注入（props.value）+ name 透传（原生直提交载体）", async () => {
    const { root } = mountAc(
      `<span name="city" x-component:autospark.autocomplete="{ suggestions: opts, value: 'bj' }"></span>`,
      { opts: CITIES },
    );
    await nextTick();
    await nextTick();
    const n = nativeOf(root)!;
    expect(n.value).toBe("bj");
    expect(n.name).toBe("city"); // 表单桥：宿主 name 透传原生控件
  });

  test("禁用态：骨架通道 data-disabled 反射 + 原生控件出交互", async () => {
    const { root } = mountAc(
      `<span x-component:autospark.autocomplete="{ suggestions: opts, disabled: true }"></span>`,
      { opts: CITIES },
    );
    await nextTick();
    await nextTick();
    expect(field(root).hasAttribute("data-disabled")).toBe(true);
    expect(nativeOf(root)!.disabled).toBe(true); // 骨架同步原生控件
  });
});

describe("值桥（文本语域，ADR-0020 input 范式对齐）", () => {
  test("el.value 劫持：getter 读原生控件 / setter 写原生控件", async () => {
    const { root } = mountAc(
      `<span x-component:autospark.autocomplete="{ suggestions: opts }"></span>`,
      { opts: CITIES },
    );
    await nextTick();
    await nextTick();
    const host = field(root) as any;
    const n = nativeOf(root)!;
    n.value = "abc";
    expect(host.value).toBe("abc"); // getter 跟随控件
    host.value = "xyz";
    expect(n.value).toBe("xyz"); // setter 写控件
  });

  test("x-model 双向：输入自然冒泡回写 state（零手动派发）", async () => {
    const { root, engine } = mountAc(
      `<span x-model="form.q" x-component:autospark.autocomplete="{ suggestions: opts, debounce: 0 }"></span>`,
      { form: { q: "" }, opts: CITIES },
    );
    await nextTick();
    await nextTick();
    typeInto(root, "北");
    await nextTick();
    expect(engine.store.state.form.q).toBe("北"); // 原生 input 冒泡过宿主 → x-model 回写
  });

  test("value props 单向同步（无 x-model）：外部状态变化写入控件", async () => {
    const { root, engine } = mountAc(
      `<span x-component:autospark.autocomplete="{ suggestions: opts, value: form.q }"></span>`,
      { form: { q: "bj" }, opts: CITIES },
    );
    await nextTick();
    await nextTick();
    expect(nativeOf(root)!.value).toBe("bj");
    engine.store.state.form.q = "sz";
    await nextTick();
    await nextTick();
    expect(nativeOf(root)!.value).toBe("sz");
  });
});

describe("建议面板（x-popover 机制呈现）", () => {
  test("点击触发器开合（trigger:click toggle）：建议渲染 + 再点关闭", async () => {
    const { root } = mountAc(
      `<span x-component:autospark.autocomplete="{ suggestions: opts }"></span>`,
      { opts: CITIES },
    );
    await nextTick();
    await nextTick();
    await openByClick(root);
    expect(panelOf()).not.toBeNull();
    expect(optionsOf().length).toBe(CITIES.length);
    expect(field(root).hasAttribute("data-open")).toBe(true); // 开合态（面板 mounted 沿链写回）
    expect(nativeOf(root)!.getAttribute("aria-expanded")).toBe("true");

    triggerOf(root)!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await nextTick();
    await nextTick();
    expect(panelOf()).toBeNull(); // 关闭即销毁（无 keepalive）
    expect(field(root).hasAttribute("data-open")).toBe(false);
  });

  test("聚焦确保开（focusin → 面板开 + 全量建议，键盘可达路径）", async () => {
    const { root } = mountAc(
      `<span x-component:autospark.autocomplete="{ suggestions: opts, debounce: 0 }"></span>`,
      { opts: CITIES },
    );
    await nextTick();
    await nextTick();
    const n = nativeOf(root)!;
    n.focus();
    n.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    await nextTick();
    await nextTick();
    expect(panelOf()).not.toBeNull(); // 聚焦即开（query 空显示全量）
    expect(optionsOf().length).toBe(CITIES.length);
  });

  test("本地过滤：输入收缩列表 + 无匹配空态「暂无建议」+ 面板自动关", async () => {
    const { root } = mountAc(
      `<span x-component:autospark.autocomplete="{ suggestions: opts, debounce: 0 }"></span>`,
      { opts: CITIES },
    );
    await nextTick();
    await nextTick();
    typeInto(root, "上");
    await nextTick();
    await nextTick();
    expect(panelOf()).not.toBeNull();
    expect(optionsOf().length).toBe(1);
    expect(optionsOf()[0]!.textContent).toContain("上海");

    typeInto(root, "不存在的城市");
    await nextTick();
    await nextTick();
    expect(optionsOf().length).toBe(0);
    // 建议空自动关（ADR-0027 决策 5）——空态经重开可见
    expect(panelOf()).toBeNull();
    await openByClick(root);
    const empty = panelOf()?.querySelector(".asc-autocomplete-empty") as HTMLElement;
    expect(empty?.textContent?.trim()).toBe("暂无建议");
  });

  test("string[] 建议源归一化（value = label = 原串）", async () => {
    const { root } = mountAc(
      `<span x-component:autospark.autocomplete="{ suggestions: words }"></span>`,
      { words: ["apple", "banana"] },
    );
    await nextTick();
    await nextTick();
    await openByClick(root);
    expect(optionsOf().length).toBe(2);
    expect(optionsOf()[0]!.textContent).toContain("apple");
  });

  test("选中联动：点击建议 → 控件值 + input/change/select 三派发 + 面板关 + 焦点回", async () => {
    const { root } = mountAc(
      `<span x-component:autospark.autocomplete="{ suggestions: opts }"></span>`,
      { opts: CITIES },
    );
    await nextTick();
    await nextTick();
    const events: string[] = [];
    const details: Record<string, any> = {};
    root.addEventListener("change", (e) => {
      events.push("change");
      details.change = (e as CustomEvent).detail;
    });
    root.addEventListener("select", (e) => {
      events.push("select");
      details.select = (e as CustomEvent).detail;
    });
    root.addEventListener("input", (e) => {
      if (!e.bubbles) return; // 过滤 x-model 类非冒泡监听噪音（本组件 input 恒冒泡自原生控件）
      events.push("input");
    });
    await openByClick(root);
    (optionsOf().find((o) => o.textContent?.includes("上海")) as HTMLElement).click();
    await nextTick();
    await nextTick();
    expect(nativeOf(root)!.value).toBe("sh"); // 控件值 = 建议 value（文本语域）
    expect(panelOf()).toBeNull(); // 选中即关面板
    expect(events).toEqual(["input", "change", "select"]); // 三派发
    expect(details.change).toEqual({ value: "sh" }); // 标量投影断言（防重型对象 OOM）
    expect(details.select).toEqual({ value: "sh" });
  });

  test("禁用建议不可选（pick guard）+ data-disabled 淡化标记", async () => {
    const { root } = mountAc(
      `<span x-component:autospark.autocomplete="{ suggestions: opts }"></span>`,
      { opts: CITIES },
    );
    await nextTick();
    await nextTick();
    await openByClick(root);
    const gz = optionsOf().find((o) => o.textContent?.includes("广州")) as HTMLElement;
    expect(gz.hasAttribute("data-disabled")).toBe(true);
    gz.click();
    await nextTick();
    expect(panelOf()).not.toBeNull(); // 未关面板 = 未选中
    expect(nativeOf(root)!.value).toBe("");
  });

  test("suggestions 状态引用热更新：建议列表跟随重建", async () => {
    const { root, engine } = mountAc(
      `<span x-component:autospark.autocomplete="{ suggestions: opts }"></span>`,
      { opts: CITIES },
    );
    await nextTick();
    await nextTick();
    await openByClick(root);
    expect(optionsOf().length).toBe(CITIES.length);
    engine.store.state.opts = [{ value: "hz", label: "杭州" }];
    await nextTick();
    await nextTick();
    expect(optionsOf().length).toBe(1);
    expect(optionsOf()[0]!.textContent).toContain("杭州");
  });

  test("面板外点击关闭 + ESC 关闭（popover 机制继承）", async () => {
    const a = mountAc(
      `<span x-component:autospark.autocomplete="{ suggestions: opts }"></span>`,
      { opts: CITIES },
    );
    await nextTick();
    await nextTick();
    await openByClick(a.root);
    document.body.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await nextTick();
    await nextTick();
    expect(panelOf()).toBeNull();
    a.engine.destroy();
    engines.splice(engines.indexOf(a.engine), 1);

    const b = mountAc(
      `<span x-component:autospark.autocomplete="{ suggestions: opts }"></span>`,
      { opts: CITIES },
    );
    await nextTick();
    await nextTick();
    await openByClick(b.root);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await nextTick();
    await nextTick();
    expect(panelOf()).toBeNull();
  });

  test("clearable：清除钮非空显形 → 点击清空 + input 派发 + 收面板 + 不误开面板", async () => {
    const { root } = mountAc(
      `<span x-component:autospark.autocomplete="{ suggestions: opts, value: 'bj', clearable: true, debounce: 0 }"></span>`,
      { opts: CITIES },
    );
    await nextTick();
    await nextTick();
    const clear = root.querySelector(".asc-autocomplete-clear") as HTMLElement;
    expect(clear).toBeTruthy();
    clear.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await nextTick();
    await nextTick();
    expect(nativeOf(root)!.value).toBe(""); // 清空
    expect(root.querySelector(".asc-autocomplete-clear")).toBeNull(); // 无值隐藏
    expect(panelOf()).toBeNull(); // stopPropagation 防误开 + 清空收面板
  });
});

describe("fetch 异步通道（ADR-0027 决策 3：action 名字符串经 scope.getAction 延迟解析）", () => {
  test("异步建议回填 + loading 指示在场 + 全权接管（suggestions 被忽略）", async () => {
    let release: ((v: unknown) => void) | null = null;
    const searchCity = (q: string) =>
      new Promise((res) => {
        release = () => res(["远程:" + q]);
      });
    const { root } = mountAc(
      `<span x-component:autospark.autocomplete="{ suggestions: opts, fetch: 'searchCity', debounce: 0 }"></span>`,
      { opts: CITIES },
      { actions: { searchCity } },
    );
    await nextTick();
    await nextTick();
    typeInto(root, "he");
    await nextTick();
    expect(root.querySelector(".asc-autocomplete-loading")).toBeTruthy(); // 在途指示
    release!(null);
    await nextTick();
    await nextTick();
    expect(root.querySelector(".asc-autocomplete-loading")).toBeNull(); // 回包退场
    expect(panelOf()).not.toBeNull(); // 聚焦在场自动开面板
    expect(optionsOf().length).toBe(1);
    expect(optionsOf()[0]!.textContent).toContain("远程:he"); // fetch 产物（本地 suggestions 不参与）
  });

  test("防抖合流：窗口内多次输入只发一次请求，携带最终词", async () => {
    const calls: string[] = [];
    const logQuery = (q: string) => {
      calls.push(q);
      return Promise.resolve([]);
    };
    const { root } = mountAc(
      `<span x-component:autospark.autocomplete="{ fetch: 'logQuery', debounce: 30 }"></span>`,
      {},
      { actions: { logQuery } },
    );
    await nextTick();
    await nextTick();
    typeInto(root, "a");
    typeInto(root, "ab");
    typeInto(root, "abc");
    await new Promise((r) => setTimeout(r, 80));
    expect(calls).toEqual(["abc"]); // 合流为最终词单次请求
  });

  test("次序守卫：过期回包丢弃（新输入的回包胜出）", async () => {
    const releases: Array<(v: unknown) => void> = [];
    const slowSearch = () =>
      new Promise((res) => {
        releases.push(res as (v: unknown) => void);
      });
    const { root } = mountAc(
      `<span x-component:autospark.autocomplete="{ fetch: 'slowSearch', debounce: 0 }"></span>`,
      {},
      { actions: { slowSearch } },
    );
    await nextTick();
    await nextTick();
    typeInto(root, "a"); // 请求 1
    await nextTick();
    typeInto(root, "ab"); // 请求 2（seq 递增，请求 1 即刻过期）
    await nextTick();
    releases[0]!(["过期"]); // 过期回包后到
    await nextTick();
    await nextTick();
    releases[1]!(["新鲜"]);
    await nextTick();
    await nextTick();
    const texts = optionsOf().map((o) => o.textContent);
    expect(texts.some((t) => t?.includes("新鲜"))).toBe(true); // 新回包生效
    expect(texts.some((t) => t?.includes("过期"))).toBe(false); // 过期回包被守卫丢弃
  });
});

describe("键盘导航（select 同款高亮漫游模型）", () => {
  const keydown = (el: Element, key: string) =>
    el.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));

  test("ArrowDown 未开先开 → 高亮移动（跳过禁用项、首尾环绕）→ Enter 确认选中", async () => {
    const { root } = mountAc(
      `<span x-component:autospark.autocomplete="{ suggestions: opts, debounce: 0 }"></span>`,
      { opts: CITIES },
    );
    await nextTick();
    await nextTick();
    const n = nativeOf(root)!;
    keydown(n, "ArrowDown"); // 未开先开（建议在场）
    await nextTick();
    await nextTick();
    expect(panelOf()).not.toBeNull();
    const activeOf = () => optionsOf().find((o) => o.hasAttribute("data-active"));
    keydown(n, "ArrowDown"); // -1 → 首项北京
    await nextTick();
    expect(activeOf()?.textContent?.includes("北京")).toBe(true);
    keydown(n, "ArrowDown"); // → 上海
    await nextTick();
    expect(activeOf()?.textContent?.includes("上海")).toBe(true);
    keydown(n, "ArrowDown"); // → 跳过禁用的广州 → 深圳
    await nextTick();
    expect(activeOf()?.textContent?.includes("深圳")).toBe(true);
    keydown(n, "ArrowDown"); // → 环绕回北京
    await nextTick();
    expect(activeOf()?.textContent?.includes("北京")).toBe(true);

    keydown(n, "Enter");
    await nextTick();
    await nextTick();
    expect(panelOf()).toBeNull(); // 确认即关
    expect(nativeOf(root)!.value).toBe("bj");
  });

  test("Enter 开态无高亮：关面板 + 拦截默认（防误触发表单）；关态放行", async () => {
    const { root } = mountAc(
      `<span x-component:autospark.autocomplete="{ suggestions: opts, debounce: 0 }"></span>`,
      { opts: CITIES },
    );
    await nextTick();
    await nextTick();
    const n = nativeOf(root)!;
    keydown(n, "ArrowDown");
    await nextTick();
    await nextTick();
    expect(panelOf()).not.toBeNull();
    let prevented = false;
    n.addEventListener("keydown", (e) => { prevented = e.defaultPrevented; }, { once: true });
    keydown(n, "Enter"); // 开态无高亮 → 关面板
    await nextTick();
    await nextTick();
    expect(panelOf()).toBeNull();
    expect(prevented).toBe(true); // preventDefault（防误触发表单提交）
    expect(nativeOf(root)!.value).toBe(""); // 未选中
  });
});

describe("IME 组合态守卫（决策 3）", () => {
  test("composing 期输入不驱动建议管道，compositionend 补一次解析", async () => {
    const calls: string[] = [];
    const logQuery = (q: string) => {
      calls.push(q);
      return Promise.resolve([]);
    };
    const { root } = mountAc(
      `<span x-component:autospark.autocomplete="{ fetch: 'logQuery', debounce: 0 }"></span>`,
      {},
      { actions: { logQuery } },
    );
    await nextTick();
    await nextTick();
    const n = nativeOf(root)!;
    n.dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true }));
    typeInto(root, "bei"); // 组合中间态
    await nextTick();
    await new Promise((r) => setTimeout(r, 20));
    expect(calls).toEqual([]); // composing 期未驱动
    n.value = "北";
    n.dispatchEvent(new CompositionEvent("compositionend", { bubbles: true }));
    await nextTick();
    await new Promise((r) => setTimeout(r, 20));
    expect(calls).toEqual(["北"]); // 组合结束补一次解析
  });
});

describe("precompile 元素名变换（<x-autocomplete>）", () => {
  test("静态属性折叠（类型推断）+ :绑定原样拼入 + 裸布尔归一 true + name 保留宿主", async () => {
    const { root } = mountAc(
      `<div><x-autocomplete name="kw" placeholder="搜索" debounce="50" value="bj" clearable :suggestions="opts"></x-autocomplete></div>`,
      { opts: CITIES },
    );
    await nextTick();
    await nextTick();
    const host = field(root);
    expect(host).toBeTruthy(); // 变换为 span 宿主 + x-component 实例化
    expect(nativeOf(root)!.name).toBe("kw"); // name 保留宿主 → mounted 透传原生控件
    expect(nativeOf(root)!.placeholder).toBe("搜索");
    expect(nativeOf(root)!.value).toBe("bj"); // 静态字符串折叠为 value props
    expect(root.querySelector(".asc-autocomplete-clear")).toBeTruthy(); // 裸 clearable 归一 true + 有值显形
  });

  test("props 注入面：绑定的 suggestions 生效（渲染走状态引用）", async () => {
    const { root, engine } = mountAc(
      `<div><x-autocomplete :suggestions="opts"></x-autocomplete></div>`,
      { opts: CITIES },
    );
    await nextTick();
    await nextTick();
    const n = root.querySelector(".asc-autocomplete-native") as HTMLInputElement;
    expect(n).toBeTruthy();
    n.focus();
    n.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    await nextTick();
    await nextTick();
    expect(panelOf()).not.toBeNull();
    expect(optionsOf().length).toBe(CITIES.length);
    engine.store.state.opts = [{ value: "hz", label: "杭州" }];
    await nextTick();
    await nextTick();
    expect(optionsOf().length).toBe(1);
  });
});
