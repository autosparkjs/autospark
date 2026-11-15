/**
 * autospark.dropdown 组件插件（组件库 P3 下拉族 navigation 件，ADR-0018 清单权威表
 * navigation 行 / ADR-0027）：经插件全局组件表注册（ADR-0111 决策 5），跨 engine 真
 * 全局——晚注册立即生效，同名后注册覆盖先注册。
 *
 * 下拉菜单（动作触发型轻量菜单）：触发区 = 默认插槽（任意内容——button / 文本 / 图标，
 * 包裹交互：触发器包裹 span 即 popover 宿主 + 键盘监听点 + tabindex 聚焦位）；菜单面板
 * 不自建弹层——复用 x-popover 指令机制呈现，面板组件 autospark-dropdown-panel（内部
 * 组件，随本插件注册，连字符注册名免疫 attr 参数点号切分——ADR-0022 决策 1 同款成因）。
 *
 * **菜单项语义自持，不嵌套消费 autospark.menu**（ADR-0027 决策 6）：menu = 页面导航区
 * 常驻组件（路由激活态 / 子菜单展开态 / 自身状态域），dropdown = 按钮旁弹出的动作
 * 菜单（即点即走、select 后即复位）——items 声明面（{ key, label, icon?, disabled?,
 * divided?, danger? }[] 状态引用或 `<x-dropdown-item>` 子元素声明双形态，后者经
 * precompile 变换折叠为 items JSON 落 data-items 字符串通道——字面量数组 props 死环
 * 规避，menu 同款）+ WAI-ARIA menu 键盘漫游 + select 事件（detail = { key, item }）。
 *
 * trigger（hover 缺省 | click）/ placement 透传经 x-popover-options 成员属性表达式通道
 * （热切换；程序化开合按触发模型分派 click / mouseenter·mouseleave，ADR-0027 决策 7）。
 * 面板 ↔ 触发器通信走 scope 链哨兵键（pickTick/pickKey、hoverTick/hoverKey）。
 *
 * **跨插件依赖声明**：面板呈现须同引 `autospark.overlay.js`（聚合产物无此问题；缺席时
 * 触发区仍正常渲染，仅无菜单面板）。
 *
 * IIFE 产物全局名 `AutoSparkDropdown`（autospark.dropdown.js）；双加载时序由
 * {@link installPlugin} 兜底（先于引擎加载推预加载队列，晚于引擎加载直注册）。
 */
import type { AutoSpark } from "autospark";
import { captureNamespace } from "../../../utils/namespace";
import { installPlugin } from "@autospark/utils";
import { kebabToCamel } from "../../../utils/kebabToCamel";
import { propKey } from "../../../utils/propKey";
import { inferPropValue } from "../../../utils/inferPropValue";
import dropdownTemplate from "./dropdown.html?raw";
import panelTemplate from "./panel.html?raw";

/** 组件注册名（autospark. 点前缀命名空间，ADR-0094；kebab 免疫 DOM 属性名小写化） */
export const DROPDOWN_NAME = "autospark.dropdown";
/**
 * 菜单面板内部组件注册名（非用户直接消费，无文档页投影）。**连字符形态是有意的**
 * （ADR-0022 决策 1 同款成因）：面板经 x-popover 指令 attr 参数消费，指令解析器把
 * attr 参数的点号切为修饰符（`autospark.dropdown-panel` → 组件名截断 MISS）——连字符
 * 免疫切分且保留 autospark 前缀命名空间意图。
 */
export const DROPDOWN_PANEL_NAME = "autospark-dropdown-panel";

/** 布尔 props（无值裸属性形态归一 true——HTML 布尔属性惯例，menu 同款） */
const DROPDOWN_BOOL_PROPS = new Set(["disabled"]);

/**
 * 递归收集 `<x-dropdown-item>` 声明子树为 items 数据：key/label 必收，icon/disabled/
 * divided/danger 可选（裸属性归一 true），动作菜单一层平铺（无嵌套 children——与 menu
 * 的导航语义分界，ADR-0027 决策 6）。
 */
function collectDropdownItem(el: Element): Record<string, unknown> {
    const entry: Record<string, unknown> = {
        key: el.getAttribute("key") ?? "",
        label: el.getAttribute("label") ?? "",
    };
    const icon = el.getAttribute("icon");
    if (icon != null) entry.icon = icon;
    if (el.hasAttribute("disabled")) entry.disabled = true;
    if (el.hasAttribute("divided")) entry.divided = true;
    if (el.hasAttribute("danger")) entry.danger = true;
    return entry;
}

/**
 * 插件注册体：写插件全局组件表（触发器 + 面板双模板）+ precompile 元素名变换。
 *
 * precompile 变换（menu 同款折叠规则）：`<x-dropdown-item>` 声明子元素（含裸 items
 * JSON 属性）折叠为 items JSON 落宿主 data-items 字符串属性（标量通道绕开值对象字面量
 * 数组死环）；静态属性折叠为 props 字面量（类型推断）、`:key="expr"` 响应式项以原始
 * 表达式拼进值对象字面量，class/style/id 与 data-/x-/@ 前缀属性保留给宿主；触发区
 * 内容随迁为默认插槽。
 */
function mountDropdownPlugin(autospark: typeof AutoSpark): void {
  autospark.components[DROPDOWN_NAME] = dropdownTemplate;
  autospark.components[DROPDOWN_PANEL_NAME] = panelTemplate;
  autospark.precompile?.((engine: InstanceType<typeof AutoSpark>) => {
    for (const el of Array.from(engine.el.querySelectorAll("x-dropdown"))) {
      const host = document.createElement("span");
      // —— 子元素声明形态：<x-dropdown-item> 静量折叠为 items JSON 落 data-items ——
      // 声明子元素恒摘除（其语法载体非内容）；JSON 序列化仅在 items 未声明时落盘
      // （props 状态引用优先）。裸 items 属性（JSON 字符串）同通道分流，不进 props 值对象
      const itemEls = Array.from(el.children).filter((c) => c.tagName.toLowerCase() === "x-dropdown-item");
      const bareItems = el.getAttribute("items");
      const boundItems = el.hasAttribute(":items");
      el.removeAttribute("items"); // JSON 字符串语义走 data-items 通道（不折进 props）
      const declared = itemEls.length > 0 || (bareItems != null && bareItems !== "");
      if (declared && !boundItems) {
        let items: unknown = null;
        if (itemEls.length) {
          items = itemEls.map(collectDropdownItem);
        } else {
          // 裸 items 属性：期望 JSON 数组字符串，非法形态静默忽略（容错缺省空组）
          try {
            const parsed = JSON.parse(bareItems!);
            if (Array.isArray(parsed)) items = parsed;
          } catch {
            /* 非法 JSON 忽略 */
          }
        }
        if (items) host.setAttribute("data-items", JSON.stringify(items));
      }
      for (const it of itemEls) it.remove();
      // —— 属性折叠（menu 变换同款规则）——
      const parts: string[] = [];
      for (const attr of Array.from(el.attributes)) {
        if (attr.name.startsWith(":")) {
          parts.push(`${propKey(kebabToCamel(attr.name.slice(1)))}: (${attr.value})`);
          continue;
        }
        const kept =
          attr.name === "class" ||
          attr.name === "style" ||
          attr.name === "id" ||
          attr.name.startsWith("data-") ||
          attr.name.startsWith("x-") || // 指令/选项族（x-model、x-on 等）留给引擎编译消费
          attr.name.startsWith("@"); // 事件绑定（化身封闭域求值，外层状态事件写包裹元素）
        if (kept) {
          host.setAttribute(attr.name, attr.value);
          continue;
        }
        if (attr.value === "" && DROPDOWN_BOOL_PROPS.has(attr.name)) {
          parts.push(`${propKey(kebabToCamel(attr.name))}: true`);
          continue;
        }
        parts.push(`${propKey(kebabToCamel(attr.name))}: ${JSON.stringify(inferPropValue(attr.value))}`);
      }
      host.setAttribute(`x-component:${DROPDOWN_NAME}`, `{ ${parts.join(", ")} }`);
      while (el.firstChild) host.appendChild(el.firstChild);
      el.replaceWith(host);
    }
  });
}

bootstrapDropdownPlugin();

/**
 * 双路径注册（模块加载期执行一次，经 {@link installPlugin} 单点）。
 */
function bootstrapDropdownPlugin(): void {
  installPlugin((autospark) => {
    captureNamespace(autospark); // 运行时桥命名空间捕获（本插件当前零符号消费，预留统一通道）
    mountDropdownPlugin(autospark);
  });
}

export { bootstrapDropdownPlugin };
