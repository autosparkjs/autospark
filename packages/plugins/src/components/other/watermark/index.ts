/**
 * autospark.watermark 组件插件（组件库 P4 other 长尾件，ADR-0018 清单权威表
 * other 行 / ADR-0030 affix 与 watermark 轻件对 ADR）：水印——整页（fullPage
 * 挂 body）或容器（absolute 覆盖插槽内容）水印层；canvas 离屏绘制旋转文本单元
 * → data URL 平铺背景（repeating CSS 无法渲染旋转文字，canvas 是工程合理解——
 * ADR-0030 技术路线声明）；content 多行（string | string[]）；props 变化签名
 * 比对幂等重绘；无 canvas 2D 上下文环境（旧 happy-dom）静默降级（层透明）。
 *
 * 内容保护（antd 的 pointer-events 拦截层）与 MutationObserver 防删除按简
 * 不做（ADR-0030 边界声明）。
 *
 * 元素名快速写法 `<x-watermark>` 由本文件的 precompile DOM 变换承载（link 止血
 * 路线 ADR-0133，div 容器语义保真）：静态属性折叠为 props 字面量（类型推断；
 * 裸属性按 HTML 语义归一 true）、`:key="expr"` 响应式项以原始表达式拼进值对象
 * 字面量，class/style/id 与 data-、x-、@ 前缀属性保留给宿主，子内容随迁为默认
 * 插槽（容器形态的被覆盖内容）。**数组面标量分流**：裸 `content` / `gap` 属性
 * 以 `[` 开头的 JSON 字符串（多行文案 / [x, y] 间隙）分流 `data-content` /
 * `data-gap` 通道（字符串标量，规避值对象内字面量数组 props 死环——P0 固化
 * 规避清单第 1 条），组件 mounted 解析写 data 响应重绘。
 *
 * IIFE 产物全局名 `AutoSparkWatermark`（autospark.watermark.js）；双加载时序由
 * {@link installPlugin} 兜底（先于引擎加载推预加载队列，晚于引擎加载直注册）。
 */
import type { AutoSpark } from "autospark";
import { captureNamespace } from "../../../utils/namespace";
import { installPlugin } from "@autospark/utils";
import { kebabToCamel } from "../../../utils/kebabToCamel";
import { propKey } from "../../../utils/propKey";
import { inferPropValue } from "../../../utils/inferPropValue";
import watermarkTemplate from "./watermark.html?raw";

/** 组件注册名（autospark. 点前缀命名空间，ADR-0094；kebab 免疫 DOM 属性名小写化） */
export const WATERMARK_NAME = "autospark.watermark";

/**
 * 插件注册体：写插件全局组件表（普通 Record 赋值即生效，无 API 门面）。
 */
function mountWatermarkPlugin(autospark: typeof AutoSpark): void {
  autospark.components[WATERMARK_NAME] = watermarkTemplate;
  autospark.precompile?.((engine: InstanceType<typeof AutoSpark>) => {
    for (const el of Array.from(engine.el.querySelectorAll("x-watermark"))) {
      // 宿主替换为 div（水印容器语义；化身后宿主即组件根——内容出口 + 水印层锚）
      const host = document.createElement("div");
      // —— 属性折叠（anchor/float-button 变换同款规则；数组面标量分流）——
      const parts: string[] = [];
      for (const attr of Array.from(el.attributes)) {
        if (attr.name.startsWith(":")) {
          parts.push(`${propKey(kebabToCamel(attr.name.slice(1)))}: (${attr.value})`);
          continue;
        }
        // 数组面标量分流：裸 content/gap 的 JSON 数组字符串走 data-* 通道
        // （不折进 props 值对象——字面量数组死环规避，见文件头注释）
        if ((attr.name === "content" || attr.name === "gap") && attr.value.trim().startsWith("[")) {
          host.setAttribute(`data-${attr.name}`, attr.value);
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
        // 裸属性（无值，如 <x-watermark full-page>）按 HTML 语义归一 true——
        // inferPropValue("") 返回空串（falsy），布尔糖会静默失效
        parts.push(
          `${propKey(kebabToCamel(attr.name))}: ${JSON.stringify(attr.value === "" ? true : inferPropValue(attr.value))}`,
        );
      }
      host.setAttribute(`x-component:${WATERMARK_NAME}`, `{ ${parts.join(", ")} }`);
      while (el.firstChild) host.appendChild(el.firstChild);
      el.replaceWith(host);
    }
  });
}

bootstrapWatermarkPlugin();

/**
 * 双路径注册（模块加载期执行一次，经 {@link installPlugin} 单点）。
 */
function bootstrapWatermarkPlugin(): void {
  installPlugin((autospark) => {
    captureNamespace(autospark); // 运行时桥命名空间捕获（本插件当前零符号消费，预留统一通道）
    mountWatermarkPlugin(autospark);
  });
}

export { bootstrapWatermarkPlugin };
