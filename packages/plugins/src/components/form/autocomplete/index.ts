/**
 * autospark.autocomplete 组件插件（组件库 P3 下拉族 form 件，ADR-0018 清单权威表
 * form 行 / ADR-0027）：经插件全局组件表注册（ADR-0111 决策 5），跨 engine 真全局
 * ——晚注册立即生效，同名后注册覆盖先注册。
 *
 * 自动补全输入（真 input + 输入驱动建议面板）：触发器**复制 input 结构而非嵌套消费**
 * autospark.input（input-number「复制而非嵌套」先例——输入事件被建议管道消费，嵌套
 * 则两层面语义互渗 + 跨插件产物依赖），真原生 input + field 盒饰继承（继承链
 * autocomplete → field → autospark.base，本产物以副作用导入内嵌 field
 * 注册）。建议面板不自建弹层——复用 x-popover 指令机制（trigger:click 形态，
 * ADR-0022 协议整体沿袭）：面板组件 autospark-autocomplete-panel（内部组件，随本
 * 插件注册，连字符注册名免疫 attr 参数点号切分）渲染进 body 覆盖物容器，经 scope
 * 链哨兵键（pickTick/hoverTick）与触发器通信；uid 根属性配对测盒饰宽补面板
 * min-width（fit 两段合成同 select）。
 *
 * 建议数据源双通道（ADR-0027 决策 3）：suggestions 本地（string[] | {value,label?}[]
 * 状态引用 + 包含过滤）与 fetch 异步（**action 名字符串**——autostore 对状态函数「见函数
 * 即求值」（computed 语义），props 值对象里的函数引用经表达式读取即被求值不可达，故
 * 走 action 通道（options.actions / engine.actions Proxy / script type 三入口统一），
 * 组件内经 scope.getAction 延迟解析（支持晚注册）；函数引用形态保留为兼容位）；fetch
 * 在场全权接管；debounce 默认 300ms；次序守卫防过期回包；IME 组合态守卫（composing
 * 期不驱动建议）。
 *
 * 值桥（文本语域，ADR-0020 input 范式对齐）：宿主 el.value 劫持 ↔ 内层原生控件；
 * 输入路径原生事件自然冒泡（x-model 直收）；pick 路径手动派发 input + change
 * （detail={value}）+ select（detail={value}，仅选中建议时触发）。
 *
 * 元素名快速写法 `<x-autocomplete>` 由本文件的 precompile DOM 变换承载（input/menu
 * 同款折叠规则）。**跨插件依赖声明**：面板呈现须同引 `autospark.overlay.js`
 * （聚合产物无此问题；缺席时输入仍可用，仅无建议面板）。
 *
 * IIFE 产物全局名 `AutoSparkAutocomplete`（autospark.autocomplete.js）；双加载时序由
 * {@link installPlugin} 兜底（先于引擎加载推预加载队列，晚于引擎加载直注册）。
 */
import type { AutoSpark } from "autospark";
import { captureNamespace } from "../../../utils/namespace";
import { installPlugin } from "@autospark/utils";
import { kebabToCamel } from "../../../utils/kebabToCamel";
import { propKey } from "../../../utils/propKey";
import { inferPropValue } from "../../../utils/inferPropValue";
import "../../base/field/index";
import autocompleteTemplate from "./autocomplete.html?raw";
import panelTemplate from "./panel.html?raw";

/** 组件注册名（autospark. 点前缀命名空间，ADR-0094；kebab 免疫 DOM 属性名小写化） */
export const AUTOCOMPLETE_NAME = "autospark.autocomplete";
/**
 * 建议面板内部组件注册名（非用户直接消费，无文档页投影）。**连字符形态是有意的**
 * （ADR-0022 决策 1 同款成因）：面板经 x-popover 指令 attr 参数消费，指令解析器把
 * attr 参数的点号切为修饰符（`autospark.autocomplete-panel` → 组件名截断 MISS）——
 * 连字符免疫切分且保留 autospark 前缀命名空间意图。
 */
export const AUTOCOMPLETE_PANEL_NAME = "autospark-autocomplete-panel";

/** 布尔 props（无值裸属性形态归一 true——HTML 布尔属性惯例，input 同款） */
const AUTOCOMPLETE_BOOL_PROPS = new Set(["disabled", "readonly", "clearable"]);

/**
 * 插件注册体：写插件全局组件表（触发器 + 面板双模板）+ precompile 元素名变换。
 *
 * precompile 变换（input 同款折叠规则）：静态属性折叠为 props 字面量（类型推断）、
 * `:key="expr"` 响应式项以原始表达式拼进值对象字面量，class / style / id / name
 * （表单桥——mounted 透传到原生控件）/ data- 前缀 / x- 前缀 / @ 前缀属性保留给宿主。
 */
function mountAutocompletePlugin(autospark: typeof AutoSpark): void {
  autospark.components[AUTOCOMPLETE_NAME] = autocompleteTemplate;
  autospark.components[AUTOCOMPLETE_PANEL_NAME] = panelTemplate;
  autospark.precompile?.((engine: InstanceType<typeof AutoSpark>) => {
    for (const el of Array.from(engine.el.querySelectorAll("x-autocomplete"))) {
      const host = document.createElement("span");
      // props 字面量键用裸标识符形态（引擎值解析对「引号键 + 表达式值」组合的成员
      // 求值会静默丢弃——button 实测结论）；属性名 kebab-case 归一 camelCase
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
          attr.name.startsWith("data-") ||
          attr.name.startsWith("x-") || // 指令/选项族（x-model、x-on 等）留给引擎编译消费
          attr.name.startsWith("@"); // 事件绑定（宿主化身封闭域求值，外层状态事件应写包裹元素）
        if (kept) {
          host.setAttribute(attr.name, attr.value);
          continue;
        }
        // 布尔键无值形态归一 true（裸 disabled/clearable 等）
        if (attr.value === "" && AUTOCOMPLETE_BOOL_PROPS.has(attr.name)) {
          parts.push(`${propKey(kebabToCamel(attr.name))}: true`);
          continue;
        }
        parts.push(`${propKey(kebabToCamel(attr.name))}: ${JSON.stringify(inferPropValue(attr.value))}`);
      }
      host.setAttribute(`x-component:${AUTOCOMPLETE_NAME}`, `{ ${parts.join(", ")} }`);
      while (el.firstChild) host.appendChild(el.firstChild);
      el.replaceWith(host);
    }
  });
}

bootstrapAutocompletePlugin();

/**
 * 双路径注册（模块加载期执行一次，经 {@link installPlugin} 单点）。
 */
function bootstrapAutocompletePlugin(): void {
  installPlugin((autospark) => {
    captureNamespace(autospark); // 运行时桥命名空间捕获（本插件当前零符号消费，预留统一通道）
    mountAutocompletePlugin(autospark);
  });
}

export { bootstrapAutocompletePlugin };
