/**
 * autospark.tour 组件插件（组件库 P4 other 分类，ADR-0018 清单权威表 other 行
 * 「tour（P4）」；取舍声明见 ADR-0031）：经插件全局组件表注册（ADR-0111 决策 5），
 * 跨 engine 真全局——晚注册立即生效，同名后注册覆盖先注册。
 *
 * 漫游引导：分步高亮目标元素（box-shadow 大投影单元素遮罩——intro.js 同款路线，
 * ADR-0031 选型声明）+ fixed 气泡（自绘简版锚定：下方优先/上翻/视口 clamp——不组合
 * x-popover 指令，触发模型与锚定宿主两点不适配的取舍见 ADR-0031）。visible 受控
 * （el.value 桥）+ current 受控（change detail={current}）+ 末步自动关（close 广播 +
 * input 回写）。目标 miss 时 warn 跳步；动作钮自绘轻量钮（page-header 先例，保按需
 * 加载自包含）。文案走 i18n 键 tour.prev/next/skip/finish 键等值判定回退中文。
 *
 * 元素名快速写法 `<x-tour :steps="steps" :visible="on">` 由 engine 元素名自动组件
 * 承载（ADR-0117 缺省注册 x-tour 标签，:expr 响应式条目引擎折叠），本插件无须自持
 * precompile 变换（无 x-tour 指令撞名、无宿主级特殊属性转移需求）。
 *
 * IIFE 产物全局名 `AutoSparkTour`（autospark.tour.js）；双加载时序由
 * {@link installPlugin} 兜底（先于引擎加载推预加载队列，晚于引擎加载直注册）。
 */
import type { AutoSpark } from "autospark";
import { captureNamespace } from "../../../utils/namespace";
import { installPlugin } from "@autospark/utils";
import tourTemplate from "./tour.html?raw";

/** 组件注册名（autospark. 点前缀命名空间，ADR-0094；kebab 免疫 DOM 属性名小写化） */
export const TOUR_NAME = "autospark.tour";

/**
 * 插件注册体：写插件全局组件表（普通 Record 赋值即生效，无 API 门面）。
 */
function mountTourPlugin(autospark: typeof AutoSpark): void {
  autospark.components[TOUR_NAME] = tourTemplate;
}

bootstrapTourPlugin();

/**
 * 双路径注册（模块加载期执行一次，经 {@link installPlugin} 单点）。
 */
function bootstrapTourPlugin(): void {
  installPlugin((autospark) => {
    captureNamespace(autospark); // 运行时桥命名空间捕获（本插件当前零符号消费，预留统一通道）
    mountTourPlugin(autospark);
  });
}

export { bootstrapTourPlugin };
