/**
 * autospark.textarea 组件插件（ADR-0032）：经插件全局组件表注册（ADR-0111 决策 5），
 * 跨 engine 真全局——晚注册立即生效，同名后注册覆盖先注册。
 *
 * 多行文本框（原生增强路线，ADR-0018 决策 7）：真实原生 <textarea> 控件 + 骨架样式
 * 包裹，不自绘输入面。继承 autospark.field 表单域骨架（状态色/焦点态/disabled 同步/
 * 盒饰 chrome）——本产物以副作用导入内嵌 field 注册（继承链 textarea → field →
 * autospark.base），按需加载场景无须单独引入 autospark.field.js。
 *
 * 与 input 的关系（ADR-0032 推翻 ADR-0020 决策 4）：多行能力自 input 的 type 变体
 * 拆出独立成件。值桥 / 计数 / 清除逻辑按「复制而非嵌套」先例（ADR-0021）在组件内
 * 自持，不继承 input——避免单行专属逻辑（type 文本族 / showPassword / prefix /
 * suffix）渗透，也让两件可各自演进。
 *
 * 值通道 = x-model 兼容协议（宿主 el.value 劫持 ↔ 内层原生控件，ADR-0020）；表单
 * 提交 = 原生直提交（宿主 name 透传到原生控件）。无内置文案、不接 i18n
 * （ADR-0018 决策 1）；尺寸档位经主题 data-size 通道全跟随。
 *
 * 元素名快速写法 `<x-textarea rows="4">初始值</x-textarea>` 由本文件的 precompile
 * DOM 变换承载（宿主替换为 span 包裹层——原生 textarea 是内层真身，宿主无须原生
 * 语义，ADR-0117 元名形态对全局表惰性组件的时序缺口同款止血）。`x-textarea`
 * 由本文件独占，input 的 precompile 不再匹配该标签（ADR-0032）。
 *
 * IIFE 产物全局名 `AutoSparkTextarea`（autospark.textarea.js）；双加载时序由
 * {@link installPlugin} 兜底（先于引擎加载推预加载队列，晚于引擎加载直注册）。
 */
import type { AutoSpark } from "autospark";
import { captureNamespace } from "../../../utils/namespace";
import { installPlugin } from "@autospark/utils";
import { kebabToCamel } from "../../../utils/kebabToCamel";
import { propKey } from "../../../utils/propKey";
import { inferPropValue } from "../../../utils/inferPropValue";
import "../../base/field/index";
import textareaTemplate from "./textarea.html?raw";

/** 组件注册名（autospark. 点前缀命名空间，ADR-0094；kebab 免疫 DOM 属性名小写化） */
export const TEXTAREA_NAME = "autospark.textarea";

/** 布尔 props（无值裸属性形态归一 true——HTML 布尔属性惯例，button-group 同款） */
const TEXTAREA_BOOL_PROPS = new Set([
  "disabled",
  "readonly",
  "clearable",
  "show-count",
  "autosize",
]);

/**
 * 插件注册体：写插件全局组件表 + precompile 元素名变换。
 *
 * precompile 变换（与 input / button 同款折叠规则）：静态属性折叠为 props 字面量
 * （类型推断）、`:key="expr"` 响应式项以原始表达式拼进值对象字面量，class / style /
 * id / name（表单桥——mounted 透传到原生控件）/ data- 前缀 / x- 前缀 / @ 前缀属性
 * 保留给宿主；`<x-textarea>` 的纯文本子内容折叠为 `value` 初值（原生直觉写法），
 * 显式 value 声明优先、元素子内容（插槽逃生通道）不折叠随迁。
 */
function mountTextareaPlugin(autospark: typeof AutoSpark): void {
  autospark.components[TEXTAREA_NAME] = textareaTemplate;
  autospark.precompile?.((engine: InstanceType<typeof AutoSpark>) => {
    for (const el of Array.from(engine.el.querySelectorAll("x-textarea"))) {
      const host = document.createElement("span");
      // props 字面量键用裸标识符形态（引擎值解析对「引号键 + 表达式值」组合的成员
      // 求值会静默丢弃——button 实测结论）；属性名 kebab-case 归一 camelCase
      // （HTML 属性名被 DOM 全量小写化，show-count → showCount）
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
          attr.name === "name" || // 表单桥载体——保留给宿主（mounted 透传到原生控件，ADR-0020）
          attr.name === "title" || // HTML 全局提示属性——保留给宿主
          attr.name.startsWith("data-") ||
          attr.name.startsWith("x-") || // 指令/选项族（x-model、x-on 等）留给引擎编译消费
          attr.name.startsWith("@"); // 事件绑定（宿主化身封闭域求值，外层状态事件应写包裹元素）
        if (kept) {
          host.setAttribute(attr.name, attr.value);
          continue;
        }
        const camel = kebabToCamel(attr.name);
        if (attr.value === "" && TEXTAREA_BOOL_PROPS.has(attr.name)) {
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
      host.setAttribute(`x-component:${TEXTAREA_NAME}`, `{ ${parts.join(", ")} }`);
      while (el.firstChild) host.appendChild(el.firstChild);
      el.replaceWith(host);
    }
  });
}

bootstrapTextareaPlugin();

/**
 * 双路径注册（模块加载期执行一次，经 {@link installPlugin} 单点）。
 */
function bootstrapTextareaPlugin(): void {
  installPlugin((autospark) => {
    captureNamespace(autospark); // 运行时桥命名空间捕获（本插件当前零符号消费，预留统一通道）
    mountTextareaPlugin(autospark);
  });
}

export { bootstrapTextareaPlugin };
