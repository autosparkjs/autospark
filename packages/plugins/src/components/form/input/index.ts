/**
 * autospark.input 组件插件（组件库 P0 批最重件，ADR-0018 清单权威表 form 行 /
 * ADR-0020）：经插件全局组件表注册（ADR-0111 决策 5），跨 engine 真全局——晚注册
 * 立即生效，同名后注册覆盖先注册。
 *
 * 输入框（原生增强路线，ADR-0018 决策 7）：真实原生 input / textarea 控件 + 骨架
 * 样式包裹，不自绘输入面。继承 autospark.base-field 表单域骨架（状态色/焦点态/
 * disabled 同步/盒饰 chrome）——本产物以副作用导入内嵌 base-field 注册（继承链
 * input → base-field → autospark.base，ADR-0020），按需加载场景无须单独引入
 * autospark.base-field.js。
 *
 * 值通道 = x-model 兼容协议（宿主 el.value 劫持 ↔ 内层原生控件，ADR-0020）；表单
 * 提交 = 原生直提交（宿主 name 透传到原生控件）。无内置文案、不接 i18n
 * （ADR-0018 决策 1）；尺寸档位经主题 data-size 通道全跟随（不设自有尺寸属性，
 * button 同范式 ADR-0012）。
 *
 * 元素名快速写法 `<x-input placeholder="...">` / `<x-textarea>` 由本文件的 precompile
 * DOM 变换承载（宿主替换为 span 包裹层——原生 input 是内层真身，宿主无须原生语义，
 * 与 button/link 的「宿主即真身」变换动机不同：此处仅为语义化标签与属性折叠，
 * ADR-0117 元名形态对全局表惰性组件的时序缺口同款止血）。
 *
 * IIFE 产物全局名 `AutoSparkInput`（autospark.input.js）；双加载时序由
 * {@link installPlugin} 兜底（先于引擎加载推预加载队列，晚于引擎加载直注册）。
 */
import type { AutoSpark } from "autospark";
import { captureNamespace } from "../../../utils/namespace";
import { installPlugin } from "@autospark/utils";
import { kebabToCamel } from "../../../utils/kebabToCamel";
import { propKey } from "../../../utils/propKey";
import { inferPropValue } from "../../../utils/inferPropValue";
import "../../base/base-field/index";
import inputTemplate from "./input.html?raw";

/** 组件注册名（autospark. 点前缀命名空间，ADR-0094；kebab 免疫 DOM 属性名小写化） */
export const INPUT_NAME = "autospark.input";

/** 密码可见切换图标（lucide eye / eye-off 造型，与 engine 内置图标同族描边风格） */
const ICON_EYE =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>';
const ICON_EYE_OFF =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/><path d="m2 2 20 20"/></svg>';

/** 布尔 props（无值裸属性形态归一 true——HTML 布尔属性惯例，button-group 同款） */
const INPUT_BOOL_PROPS = new Set([
  "disabled",
  "readonly",
  "clearable",
  "show-password",
  "show-count",
]);

/**
 * 插件注册体：写插件全局组件表 + 组件自有图标注册 + precompile 元素名变换。
 *
 * - 图标注册走全局图标表编程通道（`AutoSpark.icons.add`，ADR-0058）：名字空间化前缀
 *   `input-`（图标名不支持点号），同名静默覆盖（ADR-0058 决策 12）——使用者可后注册
 *   同名图标定制视觉；幂等注册无重复注入；
 * - precompile 变换（与 button/link 同款折叠规则）：静态属性折叠为 props 字面量
 *   （类型推断）、`:key="expr"` 响应式项以原始表达式拼进值对象字面量，class / style /
 *   id / name（表单桥——mounted 透传到原生控件）/ data- 前缀 / x- 前缀 / @ 前缀属性
 *   保留给宿主；`<x-textarea>` 变换时缺省补 `type: "textarea"`（显式声明优先）。
 */
function mountInputPlugin(autospark: typeof AutoSpark): void {
  const icons = (autospark as { icons?: { add?: (name: string, svg: string) => unknown } }).icons;
  icons?.add?.("input-eye", ICON_EYE);
  icons?.add?.("input-eye-off", ICON_EYE_OFF);
  autospark.components[INPUT_NAME] = inputTemplate;
  autospark.precompile?.((engine: InstanceType<typeof AutoSpark>) => {
    for (const el of Array.from(engine.el.querySelectorAll("x-input, x-textarea"))) {
      const host = document.createElement("span");
      // props 字面量键用裸标识符形态（引擎值解析对「引号键 + 表达式值」组合的成员
      // 求值会静默丢弃——button 实测结论）；属性名 kebab-case 归一 camelCase
      // （HTML 属性名被 DOM 全量小写化，show-password → showPassword）
      const parts: string[] = [];
      const isTextarea = el.tagName === "X-TEXTAREA";
      if (isTextarea) parts.push(`type: "textarea"`);
      for (const attr of Array.from(el.attributes)) {
        if (attr.name.startsWith(":")) {
          parts.push(`${propKey(kebabToCamel(attr.name.slice(1)))}: (${attr.value})`);
          continue;
        }
        const kept =
          attr.name === "class" ||
          attr.name === "style" ||
          attr.name === "id" ||
          attr.name === "name" || // 表单桥载体——保留给宿主（mounted 透传到原生控件，ADR-0020）
          attr.name === "title" || // HTML 全局提示属性——保留给宿主
          attr.name.startsWith("data-") ||
          attr.name.startsWith("x-") || // 指令/选项族（x-model、x-on 等）留给引擎编译消费
          attr.name.startsWith("@"); // 事件绑定（宿主化身封闭域求值，外层状态事件应写包裹元素）
        if (kept) {
          host.setAttribute(attr.name, attr.value);
          continue;
        }
        // 布尔键无值形态归一 true（裸 disabled/clearable 等）；x-textarea 的
        // 显式 type 声明优先于缺省补入（后者不覆盖已声明键）
        const camel = kebabToCamel(attr.name);
        if (camel === "type" && isTextarea) {
          parts[0] = `type: ${JSON.stringify(inferPropValue(attr.value))}`;
          continue;
        }
        if (attr.value === "" && INPUT_BOOL_PROPS.has(attr.name)) {
          parts.push(`${propKey(camel)}: true`);
          continue;
        }
        parts.push(`${propKey(camel)}: ${JSON.stringify(inferPropValue(attr.value))}`);
      }
      // 子文本内容折叠：纯文本子内容 = 原生初值语义（`<x-textarea>初始值</x-textarea>`
      // 的直觉写法）；显式 value 声明优先、元素子内容（插槽覆盖逃生通道）不折叠随迁。
      // 不折叠则会随迁为默认插槽内容、整段替换控件区（出口三层覆盖语义）
      const text = el.textContent?.trim() ?? "";
      const hasValuePart = parts.some((p) => p.startsWith("value:"));
      const hasElementChild = el.children.length > 0;
      if (text !== "" && !hasValuePart && !hasElementChild) {
        parts.push(`value: ${JSON.stringify(text)}`);
        el.textContent = "";
      }
      host.setAttribute(`x-component:${INPUT_NAME}`, `{ ${parts.join(", ")} }`);
      while (el.firstChild) host.appendChild(el.firstChild);
      el.replaceWith(host);
    }
  });
}

bootstrapInputPlugin();

/**
 * 双路径注册（模块加载期执行一次，经 {@link installPlugin} 单点）。
 */
function bootstrapInputPlugin(): void {
  installPlugin((autospark) => {
    captureNamespace(autospark); // 运行时桥命名空间捕获（本插件当前零符号消费，预留统一通道）
    mountInputPlugin(autospark);
  });
}

export { bootstrapInputPlugin };
