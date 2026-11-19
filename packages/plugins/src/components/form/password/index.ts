/**
 * autospark.password 组件插件（ADR-0034）：经插件全局组件表注册（ADR-0111 决策 5），
 * 跨 engine 真全局——晚注册立即生效，同名后注册覆盖先注册。
 *
 * 密码框 = 单行输入 + 前缀钥匙装饰 + 明文可见切换（ADR-0034）。**真继承
 * autospark.input**（继承链 password → input → field → autospark.base）：值桥
 * （宿主 el.value 劫持）、原生属性同步、清除钮、prefix/suffix props、styles 拼接
 * 全部复用。与 textarea 的「复制而非嵌套」先例（ADR-0032 / ADR-0021）判据不同——
 * textarea 否决继承是为避免**单行专属逻辑渗透**，而本组件的多出面恰恰是单行 input
 * 的两个附加件，渗透即目的；代价是默认段整段重声明（模板不随父层传导）。
 *
 * 本产物以副作用导入内嵌 input / field 注册，按需加载场景一个
 * `autospark.password.js` 即自包含（无须单独引入 input / field 产物）。
 *
 * type 归属（ADR-0034 决策 2）：组件身份即密码框，`type` 由组件**冻结**为
 * `password`——`<x-password type="…">` 折叠期直接丢弃该属性，运行时再经 data 归一
 * 与明文态重裁定兜底。需要其它 type 请用 autospark.input。
 *
 * 元素名快速写法 `<x-password placeholder="…">` 由本文件的 precompile DOM 变换承载
 * （宿主替换为 span 包裹层——原生 input 是内层真身，宿主无须原生语义，ADR-0117
 * 元名形态对全局表惰性组件的时序缺口同款止血）。
 *
 * IIFE 产物全局名 `AutoSparkPassword`（autospark.password.js）；双加载时序由
 * {@link installPlugin} 兜底（先于引擎加载推预加载队列，晚于引擎加载直注册）。
 */
import type { AutoSpark } from "autospark";
import { captureNamespace } from "../../../utils/namespace";
import { installPlugin } from "@autospark/utils";
import { kebabToCamel } from "../../../utils/kebabToCamel";
import { propKey } from "../../../utils/propKey";
import { inferPropValue } from "../../../utils/inferPropValue";
import "../input/index";
import passwordTemplate from "./password.html?raw";

/** 组件注册名（autospark. 点前缀命名空间，ADR-0094；kebab 免疫 DOM 属性名小写化） */
export const PASSWORD_NAME = "autospark.password";

/** 布尔 props（无值裸属性形态归一 true——HTML 布尔属性惯例，input / textarea 同款） */
const PASSWORD_BOOL_PROPS = new Set([
  "disabled",
  "readonly",
  "clearable",
  "viewable",
]);

/**
 * 插件注册体：写插件全局组件表 + precompile 元素名变换。
 *
 * 折叠规则与 input 同款（静态属性折叠为 props 字面量 + 类型推断、`:key="expr"`
 * 响应式项原样拼入、class / style / id / name（表单桥）/ title / data- / x- / @
 * 前缀属性保留给宿主、纯文本子内容折叠为 `value` 初值），唯一差异：`type` 属性
 * **丢弃**——密码框身份冻结（ADR-0034 决策 2），静默忽略而非报错。
 */
function mountPasswordPlugin(autospark: typeof AutoSpark): void {
  autospark.components[PASSWORD_NAME] = passwordTemplate;
  autospark.precompile?.((engine: InstanceType<typeof AutoSpark>) => {
    for (const el of Array.from(engine.el.querySelectorAll("x-password"))) {
      const host = document.createElement("span");
      // props 字面量键用裸标识符形态（引擎值解析对「引号键 + 表达式值」组合的成员
      // 求值会静默丢弃——button 实测结论）；属性名 kebab-case 归一 camelCase
      // （HTML 属性名被 DOM 全量小写化，auto-complete → autoComplete 同理）
      const parts: string[] = [];
      for (const attr of Array.from(el.attributes)) {
        if (attr.name.startsWith(":")) {
          parts.push(`${propKey(kebabToCamel(attr.name.slice(1)))}: (${attr.value})`);
          continue;
        }
        // type 冻结：显式声明一律丢弃（组件身份即密码框，ADR-0034 决策 2）
        if (attr.name === "type") continue;
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
        // 布尔键无值形态归一 true（裸 disabled/clearable/viewable 等）
        const camel = kebabToCamel(attr.name);
        if (attr.value === "" && PASSWORD_BOOL_PROPS.has(attr.name)) {
          parts.push(`${propKey(camel)}: true`);
          continue;
        }
        parts.push(`${propKey(camel)}: ${JSON.stringify(inferPropValue(attr.value))}`);
      }
      // 子文本内容折叠：纯文本子内容 = 原生初值语义（`<x-password>初始值</x-password>`）；
      // 显式 value 声明优先、元素子内容（插槽覆盖逃生通道）不折叠随迁
      const text = el.textContent?.trim() ?? "";
      const hasValuePart = parts.some((p) => p.startsWith("value:"));
      const hasElementChild = el.children.length > 0;
      if (text !== "" && !hasValuePart && !hasElementChild) {
        parts.push(`value: ${JSON.stringify(text)}`);
        el.textContent = "";
      }
      host.setAttribute(`x-component:${PASSWORD_NAME}`, `{ ${parts.join(", ")} }`);
      while (el.firstChild) host.appendChild(el.firstChild);
      el.replaceWith(host);
    }
  });
}

bootstrapPasswordPlugin();

/**
 * 双路径注册（模块加载期执行一次，经 {@link installPlugin} 单点）。
 */
function bootstrapPasswordPlugin(): void {
  installPlugin((autospark) => {
    captureNamespace(autospark); // 运行时桥命名空间捕获（本插件当前零符号消费，预留统一通道）
    mountPasswordPlugin(autospark);
  });
}

export { bootstrapPasswordPlugin };
