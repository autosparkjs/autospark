/**
 * autospark.affix 组件插件（组件库 P4 other 长尾件，ADR-0018 清单权威表 other 行 /
 * ADR-0030 affix 与 watermark 轻件对 ADR）：固钉——滚动过 offset 阈值后内容固定
 * （fixed 吸附视口顶/底，position 决定吸附边），原位占位撑高防跳动（脱流前几何
 * 快照写宿主 CSS 变量下发）+ change 冒泡 detail = { fixed }；scroll/resize 监听
 * （passive，unmounted 清理——grid 的 matchMedia 先例）。
 *
 * 与 float-button / anchor 的边界（ADR-0030 声明）：float-button 是 fixed 悬浮
 * 动作钮（恒悬浮语义）、anchor 是滚动高亮导航——本件是**内容区固钉吸附**（常态
 * 随文档流、越线脱流吸附），三者正交。容器相对形态（target 指定吸附容器）v1
 * 不做（viewport 起步，按需增补——ADR-0030 边界声明）。
 *
 * 元素名快速写法 `<x-affix>` 由本文件的 precompile DOM 变换承载（link 止血路线
 * ADR-0133，div 容器语义保真）：静态属性折叠为 props 字面量（类型推断；裸属性
 * 按 HTML 语义归一 true）、`:key="expr"` 响应式项以原始表达式拼进值对象字面量，
 * class/style/id 与 data-、x-、@ 前缀属性保留给宿主，子内容随迁为默认插槽
 * （固钉内容）。本件 props 全标量（offset 数字 / position 字符串），无数组面
 * ——无需 JSON 标量分流通道。
 *
 * IIFE 产物全局名 `AutoSparkAffix`（autospark.affix.js）；双加载时序由
 * {@link installPlugin} 兜底（先于引擎加载推预加载队列，晚于引擎加载直注册）。
 */
import type { AutoSpark } from "autospark";
import { captureNamespace } from "../../../utils/namespace";
import { installPlugin } from "@autospark/utils";
import { kebabToCamel } from "../../../utils/kebabToCamel";
import { propKey } from "../../../utils/propKey";
import { inferPropValue } from "../../../utils/inferPropValue";
import affixTemplate from "./affix.html?raw";

/** 组件注册名（autospark. 点前缀命名空间，ADR-0094；kebab 免疫 DOM 属性名小写化） */
export const AFFIX_NAME = "autospark.affix";

/**
 * 插件注册体：写插件全局组件表（普通 Record 赋值即生效，无 API 门面）。
 */
function mountAffixPlugin(autospark: typeof AutoSpark): void {
  autospark.components[AFFIX_NAME] = affixTemplate;
  autospark.precompile?.((engine: InstanceType<typeof AutoSpark>) => {
    for (const el of Array.from(engine.el.querySelectorAll("x-affix"))) {
      // 宿主替换为 div（固钉内容容器语义；化身后宿主即组件根——占位撑高载体）
      const host = document.createElement("div");
      // —— 属性折叠（anchor/float-button 变换同款规则）——
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
          attr.name.startsWith("x-") || // 指令/选项族（x-on 等）留给引擎编译消费
          attr.name.startsWith("@"); // 事件绑定（化身封闭域求值，外层状态事件写包裹元素）
        if (kept) {
          host.setAttribute(attr.name, attr.value);
          continue;
        }
        // 裸属性（无值，如 <x-affix disabled>）按 HTML 语义归一 true——
        // inferPropValue("") 返回空串（falsy），布尔糖会静默失效
        parts.push(
          `${propKey(kebabToCamel(attr.name))}: ${JSON.stringify(attr.value === "" ? true : inferPropValue(attr.value))}`,
        );
      }
      host.setAttribute(`x-component:${AFFIX_NAME}`, `{ ${parts.join(", ")} }`);
      while (el.firstChild) host.appendChild(el.firstChild);
      el.replaceWith(host);
    }
  });
}

bootstrapAffixPlugin();

/**
 * 双路径注册（模块加载期执行一次，经 {@link installPlugin} 单点）。
 */
function bootstrapAffixPlugin(): void {
  installPlugin((autospark) => {
    captureNamespace(autospark); // 运行时桥命名空间捕获（本插件当前零符号消费，预留统一通道）
    mountAffixPlugin(autospark);
  });
}

export { bootstrapAffixPlugin };
