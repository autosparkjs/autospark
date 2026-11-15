/**
 * transfer 组件插件测试（组件库 P3 form 批重件，ADR-0028）：
 * - 注册面：transfer 模板入全局组件表（内嵌 checkbox 注册——组合硬依赖）+ 继承
 *   autospark.base（复合控件不继承 field）+ bootstrap 幂等 + 样式三级回退链与
 *   暗色兜底变体；
 * - 化身渲染：元素名形态实例化（`<x-transfer>`，ADR-0117——demo/文档示例统一写法），
 *   双列表按 value 划分、底部计数「N / M 项」、titles、filterable 过滤框（i18n
 *   transfer.search 回退「请输入搜索内容」）、空态（i18n transfer.empty）；
 * - 值桥（x-model 兼容协议，ADR-0028 决策 3）：宿主 el.value 数组语域劫持、x-model
 *   双向（穿梭 → state 数组回写）、change 冒泡 detail={value} / input 非冒泡、hidden
 *   载体逗号拼接 + name 透传、value props 单向同步；
 * - 选中与穿梭：行勾选（checkbox 组合 @change 通道）、行点击等价切换、全选/半选
 *   （过滤视图可用项派生）、按钮态与选中集联动、canonical data 声明序、仅清移动侧选中；
 * - filterable 本地过滤（过滤不清选中集）、disabled 行项 / 整体禁用。
 */
import "../../setup";

import { describe, expect, test, afterEach } from "bun:test";
import { AutoSpark } from "autospark";
import { mount, nextTick } from "../../helpers";
import { TRANSFER_NAME, bootstrapTransferPlugin } from "../../../components/form/transfer/index";
import { CHECKBOX_NAME } from "../../../components/form/checkbox/index";

/** 取全局表模板（空白归一——oxfmt 折行使逐字匹配假红） */
const tpl = (name: string) =>
  ((AutoSpark as { components: Record<string, string> }).components[name] as string).replace(
    /\s+/g,
    " ",
  );

/** 取实例化后的宿主（.asc-transfer 根） */
const hostOf = (root: HTMLElement) => root.querySelector(".asc-transfer") as HTMLElement;
/** 双列表容器（side: 0 源 / 1 目标） */
const listOf = (root: HTMLElement, side: 0 | 1) =>
  root.querySelectorAll(".asc-transfer-list")[side] as HTMLElement;
/** 指定侧行集 */
const rowsOf = (root: HTMLElement, side: 0 | 1) =>
  Array.from(listOf(root, side).querySelectorAll(".asc-transfer-item"));
/** 指定侧行文案集 */
const labelsOf = (root: HTMLElement, side: 0 | 1) =>
  rowsOf(root, side).map((r) => r.querySelector(".asc-transfer-item-label")?.textContent?.trim());
/** 指定侧头部全选 checkbox 原生控件（checkbox 化身并入 .asc-transfer-check 宿主） */
const headerCheckOf = (root: HTMLElement, side: 0 | 1) =>
  listOf(root, side).querySelector(".asc-transfer-check .asc-checkbox-input") as HTMLInputElement;
/** 行 checkbox 原生控件（按文案定位） */
const rowInputOf = (root: HTMLElement, label: string) => {
  const row = rowsOf(root, 0)
    .concat(rowsOf(root, 1))
    .find((r) => r.textContent?.includes(label));
  return row?.querySelector(".asc-checkbox-input") as HTMLInputElement;
};
/** 穿梭钮（dir: "right" 移入目标 / "left" 移回源） */
const btnOf = (root: HTMLElement, dir: "right" | "left") =>
  Array.from(root.querySelectorAll(".asc-transfer-btn")).find((b) =>
    dir === "right"
      ? b.getAttribute("aria-label") === "移入目标"
      : b.getAttribute("aria-label") === "移回源",
  ) as HTMLButtonElement;

/** 引擎回收（防跨用例泄漏）；双跳等待——x-for 行内 checkbox 组合渲染晚一跳（ADR-0024 后果 3 同族） */
const engines: any[] = [];
const mountTransfer = async (html: string, state: any) => {
  const m = mount(html, state, { animate: false });
  engines.push(m.engine);
  await nextTick();
  await nextTick();
  return m;
};

afterEach(() => {
  for (const e of engines.splice(0)) e.destroy?.();
});

/** 通用数据集（x-data 状态引用注入——字面量数组有引擎死环缺陷，ADR-0019 后果 2） */
const DATA = [
  { key: "bj", label: "北京" },
  { key: "sh", label: "上海" },
  { key: "gz", label: "广州", disabled: true },
  { key: "sz", label: "深圳" },
  { key: "hz", label: "杭州" },
];

describe("注册面（ADR-0028）", () => {
  test("模块加载即注册：transfer 模板入全局组件表（内嵌 checkbox 组合依赖）", () => {
    const table = (AutoSpark as { components: Record<string, string> }).components;
    expect(typeof table[TRANSFER_NAME]).toBe("string");
    expect(typeof table[CHECKBOX_NAME]).toBe("string"); // 硬依赖内嵌（对照 table 的可选依赖）
    expect(tpl(TRANSFER_NAME)).toContain(`x-define="${TRANSFER_NAME}"`);
    expect(tpl(TRANSFER_NAME)).toContain('x-define:inherit="autospark.base"'); // 复合控件不继承 field
    expect(tpl(TRANSFER_NAME)).toContain("x-component:autospark.checkbox"); // 复选项组合（table 先例）
  });

  test("bootstrap 幂等：重复调用不覆盖（同键赋值幂等）", () => {
    const table = (AutoSpark as { components: Record<string, string> }).components;
    const before = table[TRANSFER_NAME];
    bootstrapTransferPlugin();
    expect(table[TRANSFER_NAME]).toBe(before);
  });

  test("样式通道：三级回退链与暗色兜底变体均在模板中（ADR-0129）", () => {
    const transfer = tpl(TRANSFER_NAME);
    expect(transfer).toContain("var(--auto-border-color, var(--asc-transfer-border-color,");
    expect(transfer).toContain(".asc-transfer-btn[disabled] {");
    expect(transfer).toContain("[dark] .asc-transfer-list,");
    expect(transfer).toContain(
      "[data-dark] .asc-transfer-item[data-disabled] .asc-transfer-item-label",
    );
  });
});

describe("化身渲染与 props", () => {
  test("元素名形态实例化：双列表按 value 划分 + 底部计数「N / M 项」+ 空态", async () => {
    const { root } = await mountTransfer(
      `<x-transfer :data="items" :value="picked"></x-transfer>`,
      { items: DATA, picked: ["sz", "hz"] },
    );
    await nextTick();
    const host = hostOf(root);
    expect(host).toBeTruthy();
    expect(host.classList.contains("asc-transfer")).toBe(true);
    expect(labelsOf(root, 0)).toEqual(["北京", "上海", "广州"]); // 源 = data - value
    expect(labelsOf(root, 1)).toEqual(["深圳", "杭州"]); // 目标 = value 侧
    const footers = Array.from(root.querySelectorAll(".asc-transfer-footer"));
    expect(footers[0]?.textContent).toContain("3 / 5 项"); // 源计数（含禁用项）
    expect(footers[1]?.textContent).toContain("2 / 5 项"); // 目标计数
    // 两侧均有行 → 空态均不渲染
    expect(listOf(root, 0).querySelector(".asc-transfer-empty")).toBeNull();
    expect(listOf(root, 1).querySelector(".asc-transfer-empty")).toBeNull();
  });

  test("值对象形态等价：x-component:autospark.transfer 实例化同构渲染 + 目标侧空态", async () => {
    const { root } = await mountTransfer(
      `<div x-component:autospark.transfer="{ data: items }"></div>`,
      { items: DATA },
    );
    expect(labelsOf(root, 0)).toEqual(["北京", "上海", "广州", "深圳", "杭州"]);
    expect(labelsOf(root, 1)).toEqual([]);
    // 无 value 时目标侧空态（i18n transfer.empty 回退「暂无数据」）
    expect(listOf(root, 1).querySelector(".asc-transfer-empty")?.textContent?.trim()).toBe(
      "暂无数据",
    );
  });

  test("titles 双标题 + filterable 过滤框（i18n transfer.search 回退）", async () => {
    const { root } = await mountTransfer(
      `<x-transfer :data="items" :titles="titles" filterable="true"></x-transfer>`,
      { items: DATA, titles: ["可选", "已选"] },
    );
    await nextTick();
    const titles = Array.from(root.querySelectorAll(".asc-transfer-title"));
    expect(titles[0]?.textContent?.trim()).toBe("可选");
    expect(titles[1]?.textContent?.trim()).toBe("已选");
    const inputs = Array.from(root.querySelectorAll(".asc-transfer-search-input"));
    expect(inputs.length).toBe(2); // 每侧独立过滤框
    expect((inputs[0] as HTMLInputElement).placeholder).toBe("请输入搜索内容");
  });

  test("禁用行项：data-disabled 标记 + checkbox 原生禁用 + 行点击不选中", async () => {
    const { root } = await mountTransfer(`<x-transfer :data="items"></x-transfer>`, {
      items: DATA,
    });
    await nextTick();
    const gzRow = rowsOf(root, 0).find((r) => r.textContent?.includes("广州")) as HTMLElement;
    expect(gzRow.hasAttribute("data-disabled")).toBe(true);
    const gzInput = rowInputOf(root, "广州") as HTMLInputElement;
    expect(gzInput.disabled).toBe(true);
    gzRow.click();
    await nextTick();
    expect((btnOf(root, "right") as HTMLButtonElement).disabled).toBe(true); // 禁用项不可选中 → 穿梭钮不动
  });
});

describe("值桥（x-model 兼容协议，ADR-0028 决策 3）", () => {
  test("x-model 双向：初值数组语域劫持 + 穿梭后 state 数组回写（canonical data 声明序）", async () => {
    const { root, engine } = await mountTransfer(
      `<x-transfer x-model="picked" :data="items"></x-transfer>`,
      { items: DATA, picked: ["sz"] },
    );
    await nextTick();
    const host = hostOf(root);
    expect((host as any).value).toEqual(["sz"]); // 劫持 getter（数组语域）
    // 源侧勾选北京 → 穿梭 → state 回写为 data 声明序 ["bj","sz"]
    rowInputOf(root, "北京").dispatchEvent(new Event("change", { bubbles: true }));
    await nextTick();
    await nextTick();
    (btnOf(root, "right") as HTMLButtonElement).click();
    await nextTick();
    expect(engine.store.state.picked).toEqual(["bj", "sz"]); // canonical data 声明序
    expect((host as any).value).toEqual(["bj", "sz"]);
    const carrier = root.querySelector(".asc-transfer-carrier") as HTMLInputElement;
    expect(carrier.value).toBe("bj,sz"); // hidden 载体逗号拼接（表单提交字符串域）
    expect(labelsOf(root, 1)).toEqual(["北京", "深圳"]); // 目标侧渲染跟随
  });

  test("change 冒泡 detail={value}；input 非冒泡（x-model 专用）", async () => {
    const { root } = await mountTransfer(`<x-transfer :data="items"></x-transfer>`, {
      items: DATA,
    });
    await nextTick();
    const events: string[] = [];
    let detail: any = null;
    root.addEventListener("change", (e: Event) => {
      events.push("change");
      detail = (e as CustomEvent).detail;
    });
    root.addEventListener("input", () => events.push("input"));
    rowInputOf(root, "上海").dispatchEvent(new Event("change", { bubbles: true }));
    await nextTick();
    await nextTick();
    (btnOf(root, "right") as HTMLButtonElement).click();
    await nextTick();
    expect(events).toEqual(["change"]); // input 非冒泡（宿主自身）
    expect(detail?.value).toEqual(["sh"]); // 标量投影断言（防重型对象 OOM）
  });

  test("name 透传 hidden 载体（元素名形态折叠 props 优先）", async () => {
    const a = await mountTransfer(`<x-transfer :data="items" name="cities"></x-transfer>`, {
      items: DATA,
    });
    await nextTick();
    expect((a.root.querySelector(".asc-transfer-carrier") as HTMLInputElement).name).toBe("cities");
    a.engine.destroy();
    engines.splice(engines.indexOf(a.engine), 1);

    const b = await mountTransfer(
      `<div name="cities2" x-component:autospark.transfer="{ data: items }"></div>`,
      { items: DATA },
    );
    await nextTick();
    expect((b.root.querySelector(".asc-transfer-carrier") as HTMLInputElement).name).toBe(
      "cities2",
    );
  });

  test("state→DOM 单向（value props 无 x-model）：外部状态整体替换重划两侧", async () => {
    const { root, engine } = await mountTransfer(
      `<x-transfer :data="items" :value="picked"></x-transfer>`,
      { items: DATA, picked: [] as string[] },
    );
    await nextTick();
    expect(labelsOf(root, 1)).toEqual([]);
    engine.store.state.picked = ["bj", "gz"];
    await nextTick();
    await nextTick();
    expect(labelsOf(root, 1)).toEqual(["北京", "广州"]); // 禁用项也可在目标侧（只是不可再移动）
    expect((root.querySelector(".asc-transfer-carrier") as HTMLInputElement).value).toBe("bj,gz");
  });

  test("劫持 setter 程序赋值：重划两侧 + 载体跟随（无派发）", async () => {
    const { root } = await mountTransfer(`<x-transfer :data="items"></x-transfer>`, {
      items: DATA,
    });
    await nextTick();
    let changeCount = 0;
    root.addEventListener("change", () => changeCount++);
    (hostOf(root) as any).value = ["sh"];
    await nextTick();
    expect(labelsOf(root, 1)).toEqual(["上海"]);
    expect((root.querySelector(".asc-transfer-carrier") as HTMLInputElement).value).toBe("sh");
    expect(changeCount).toBe(0); // 程序赋值不派发（受控语义）
  });
});

describe("选中集与穿梭联动（ADR-0028 决策 4）", () => {
  test("按钮态与选中集联动：无选中禁用 → 勾选启用 → 穿梭后复位；仅清移动侧选中", async () => {
    const { root } = await mountTransfer(
      `<x-transfer :data="items" :value="picked"></x-transfer>`,
      { items: DATA, picked: ["sz"] },
    );
    await nextTick();
    const right = btnOf(root, "right") as HTMLButtonElement;
    const left = btnOf(root, "left") as HTMLButtonElement;
    expect(right.disabled).toBe(true); // 无选中
    expect(left.disabled).toBe(true);
    // 勾选源侧北京 + 目标侧深圳（跨两侧单集制）
    rowInputOf(root, "北京").dispatchEvent(new Event("change", { bubbles: true }));
    rowInputOf(root, "深圳").dispatchEvent(new Event("change", { bubbles: true }));
    await nextTick();
    await nextTick();
    expect(right.disabled).toBe(false);
    expect(left.disabled).toBe(false);
    right.click();
    await nextTick();
    expect(labelsOf(root, 1)).toEqual(["北京", "深圳"]);
    // 移动后仅清源侧选中：目标侧深圳选中保留 → 移回钮仍可用
    expect(right.disabled).toBe(true);
    expect(left.disabled).toBe(false);
  });

  test("行点击与 checkbox 点击等价切换（checkbox 区内点击不双触发）", async () => {
    const { root } = await mountTransfer(`<x-transfer :data="items"></x-transfer>`, {
      items: DATA,
    });
    await nextTick();
    const bjRow = rowsOf(root, 0).find((r) => r.textContent?.includes("北京")) as HTMLElement;
    bjRow.click(); // 行文字点击 → 切换选中
    await nextTick();
    await nextTick();
    expect(rowInputOf(root, "北京").checked).toBe(true); // checkbox checked props 跟随选中集
    expect((btnOf(root, "right") as HTMLButtonElement).disabled).toBe(false);
    bjRow.click(); // 再点 → 取消
    await nextTick();
    expect(rowInputOf(root, "北京").checked).toBe(false);
    expect((btnOf(root, "right") as HTMLButtonElement).disabled).toBe(true);
  });

  test("头部全选/半选（过滤视图可用项派生；disabled 项跳过）+ 全选穿梭", async () => {
    const { root } = await mountTransfer(`<x-transfer :data="items"></x-transfer>`, {
      items: DATA,
    });
    await nextTick();
    const headerInput = headerCheckOf(root, 0);
    // 勾两项（可用 4 项中 2 项）→ 半选
    rowInputOf(root, "北京").dispatchEvent(new Event("change", { bubbles: true }));
    rowInputOf(root, "上海").dispatchEvent(new Event("change", { bubbles: true }));
    await nextTick();
    await nextTick();
    expect(headerInput.checked).toBe(false);
    expect(headerInput.indeterminate).toBe(true);
    // 头部点击（半选 → 全选，原生行为对齐）：经原生 change 通道触发 onToggleSourceAll
    headerInput.checked = true;
    headerInput.dispatchEvent(new Event("change", { bubbles: true }));
    await nextTick();
    await nextTick();
    expect(headerInput.indeterminate).toBe(false);
    // 可用 4 项全选中（广州禁用跳过）→ 穿移 → 目标 4 项 + 源仅剩禁用项
    (btnOf(root, "right") as HTMLButtonElement).click();
    await nextTick();
    expect(labelsOf(root, 1)).toEqual(["北京", "上海", "深圳", "杭州"]);
    expect(labelsOf(root, 0)).toEqual(["广州"]);
    // 目标侧禁用项 gz 不存在；移回钮全选后禁用（无选中）
    expect((btnOf(root, "left") as HTMLButtonElement).disabled).toBe(true);
  });

  test("moveLeft 移回源：目标侧选中剔除 + 空目标空态", async () => {
    const { root } = await mountTransfer(
      `<x-transfer :data="items" :value="picked"></x-transfer>`,
      { items: DATA, picked: ["bj", "sh"] },
    );
    await nextTick();
    rowInputOf(root, "北京").dispatchEvent(new Event("change", { bubbles: true }));
    await nextTick();
    await nextTick();
    (btnOf(root, "left") as HTMLButtonElement).click();
    await nextTick();
    expect(labelsOf(root, 1)).toEqual(["上海"]);
    expect(labelsOf(root, 0)).toEqual(["北京", "广州", "深圳", "杭州"]); // canonical 序回源
    expect((root.querySelector(".asc-transfer-carrier") as HTMLInputElement).value).toBe("sh");
  });

  test("整体禁用：data-disabled 反射 + 勾选/穿梭/载体全阻断", async () => {
    const { root } = await mountTransfer(
      `<x-transfer :data="items" disabled="true"></x-transfer>`,
      { items: DATA },
    );
    await nextTick();
    const host = hostOf(root);
    expect(host.hasAttribute("data-disabled")).toBe(true);
    expect((root.querySelector(".asc-transfer-carrier") as HTMLInputElement).disabled).toBe(true);
    rowInputOf(root, "北京").dispatchEvent(new Event("change", { bubbles: true }));
    await nextTick();
    await nextTick();
    expect((btnOf(root, "right") as HTMLButtonElement).disabled).toBe(true); // canRight 含禁用判定
    (btnOf(root, "right") as HTMLButtonElement).click();
    await nextTick();
    expect(labelsOf(root, 1)).toEqual([]); // 穿梭被 guard 阻断
  });
});

describe("filterable 本地过滤（ADR-0028 决策 4）", () => {
  test("过滤视图渲染 + 无匹配空态；过滤不清选中集（隐藏选中仍可穿梭）", async () => {
    const { root } = await mountTransfer(
      `<x-transfer :data="items" filterable="true"></x-transfer>`,
      { items: DATA },
    );
    await nextTick();
    const search = listOf(root, 0).querySelector(".asc-transfer-search-input") as HTMLInputElement;
    search.value = "北京";
    search.dispatchEvent(new Event("input", { bubbles: true }));
    await nextTick();
    await nextTick();
    expect(labelsOf(root, 0)).toEqual(["北京"]); // 过滤命中
    // 底部计数恒全量（N / M 不随过滤变化）
    expect(listOf(root, 0).querySelector(".asc-transfer-footer")?.textContent).toContain(
      "5 / 5 项",
    );
    // 过滤视图内勾选北京
    rowInputOf(root, "北京").dispatchEvent(new Event("change", { bubbles: true }));
    await nextTick();
    await nextTick();
    // 清空过滤词 → 北京行复现且保持选中（过滤不清选中集）
    search.value = "";
    search.dispatchEvent(new Event("input", { bubbles: true }));
    await nextTick();
    await nextTick();
    expect(rowInputOf(root, "北京").checked).toBe(true);
    expect((btnOf(root, "right") as HTMLButtonElement).disabled).toBe(false);
    // 无匹配 → 空态（i18n transfer.empty）
    search.value = "不存在";
    search.dispatchEvent(new Event("input", { bubbles: true }));
    await nextTick();
    await nextTick();
    expect(labelsOf(root, 0)).toEqual([]);
    expect(listOf(root, 0).querySelector(".asc-transfer-empty")?.textContent?.trim()).toBe(
      "暂无数据",
    );
  });

  test("头部全选作用于过滤视图：只勾可见可用项（disabled 项跳过）", async () => {
    const { root } = await mountTransfer(
      `<x-transfer :data="items" filterable="true"></x-transfer>`,
      { items: DATA },
    );
    const search = listOf(root, 0).querySelector(".asc-transfer-search-input") as HTMLInputElement;
    search.value = "州"; // 命中 广州（禁用）+ 杭州（可用）
    search.dispatchEvent(new Event("input", { bubbles: true }));
    await nextTick();
    await nextTick();
    expect(labelsOf(root, 0)).toEqual(["广州", "杭州"]);
    const headerInput = headerCheckOf(root, 0);
    headerInput.checked = true;
    headerInput.dispatchEvent(new Event("change", { bubbles: true }));
    await nextTick();
    await nextTick();
    // 只勾视图内可用项（杭州）——广州禁用跳过（未过滤项不在视图内，选中集只含视图项）
    expect(rowInputOf(root, "杭州").checked).toBe(true);
    expect(rowInputOf(root, "广州").checked).toBe(false); // 禁用项跳过
    expect((btnOf(root, "right") as HTMLButtonElement).disabled).toBe(false);
    // 清空过滤词后：仅杭州选中（全选只作用于过滤视图，不波及未过滤项）
    search.value = "";
    search.dispatchEvent(new Event("input", { bubbles: true }));
    await nextTick();
    await nextTick();
    expect(rowInputOf(root, "深圳").checked).toBe(false);
    expect((btnOf(root, "right") as HTMLButtonElement).disabled).toBe(false);
  });
});
