/**
 * autospark.list 组件插件（组件库 P1，ADR-0018 清单权威表 display 行「list（P1）」）：
 * 经插件全局组件表注册（ADR-0111 决策 5），跨 engine 真全局——晚注册立即生效，
 * 同名后注册覆盖先注册。
 *
 * 数据驱动列表容器：items（状态引用注入——字面量数组触发 props 死循环，ADR-0019
 * 后果 2 规避）经内层 x-for 渲染；行内容默认插槽模板自定义（作用域插槽形参
 * `{ item, $index }` 解构消费，无插槽时 label/title/name/value 四键探测兜底）；
 * virtual（x-for.virtual 组合 features/virtual 插件）、loading（引擎 x-loading 经
 * 绑定通道组合覆盖层）、empty 兜底（复用 autospark.empty 组件 + empty 插槽可整体
 * 重载）、bordered / split（行间分隔线）。
 *
 * 与 x-for 指令的边界（ADR 消歧）：x-for 是引擎渲染指令（全权自定义，项模板/键/派生
 * 变量全暴露）；list 是带空态/加载态/虚拟滚动/边框分隔的开箱容器——内部装配 x-for，
 * 对外收敛 props。裸渲染需求用 x-for，开箱列表用 list。
 *
 * 元素名快速写法 `<x-list>` 由 engine 元素名自动组件承载（ADR-0117 缺省注册 x-list
 * 标签）；div 根无原生语义损失，不做 precompile 变换（ADR-0019 link 判据）。
 *
 * 跨插件依赖（按需加载须同页引入，聚合产物 autospark.plugins.js 无此问题）：
 * autospark.empty.js（空态兜底组合）、autospark.virtual.js（virtual=true 时）。
 *
 * IIFE 产物全局名 `AutoSparkList`（autospark.list.js）；双加载时序由
 * {@link installPlugin} 兜底（先于引擎加载推预加载队列，晚于引擎加载直注册）。
 */
import type { AutoSpark } from "autospark";
import { captureNamespace } from "../../../utils/namespace";
import { installPlugin } from "@autospark/utils";
import listTemplate from "./list.html?raw";

/** 组件注册名（autospark. 点前缀命名空间，ADR-0094；kebab 免疫 DOM 属性名小写化） */
export const LIST_NAME = "autospark.list";

/**
 * 插件注册体：写插件全局组件表（普通 Record 赋值即生效，无 API 门面）。
 */
function mountListPlugin(autospark: typeof AutoSpark): void {
    autospark.components[LIST_NAME] = listTemplate;
}

bootstrapListPlugin();

/**
 * 双路径注册（模块加载期执行一次，经 {@link installPlugin} 单点）。
 */
function bootstrapListPlugin(): void {
    installPlugin((autospark) => {
        captureNamespace(autospark); // 运行时桥命名空间捕获（本插件当前零符号消费，预留统一通道）
        mountListPlugin(autospark);
    });
}

export { bootstrapListPlugin };
