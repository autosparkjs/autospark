/**
 * autospark.skeleton 组件插件（组件库 P1 轻件，ADR-0018 清单权威表 feedback 行「skeleton（P1）」）：
 * 经插件全局组件表注册（ADR-0111 决策 5，`AutoSpark.components[name] = 模板字符串`），
 * 跨 engine 真全局——晚注册立即生效，同名后注册覆盖先注册。
 *
 * 骨架屏：CSS 闪烁动画（渐变扫过，prefers-reduced-motion 停播——badge 先例）；
 * variant 三形态（text 行块 / circle 圆 / rect 矩形块）、rows 多行 text（末行半宽）、
 * loading 插槽切换（true 骨架 / false 渲染默认插槽真实内容——核心用法，数据未到占位）、
 * animated 动画开关。纯结构占位组件。
 *
 * 与 x-loading 指令的边界（ADR-0018 决策 3 消歧）：x-loading 是 action 通道的就近消费
 * （行为指令——动作执行期间呈现 loading），本组件是静态结构占位（数据未到的骨架结构，
 * 插槽切换骨架/真容）——详见 skeleton.html 文件头边界声明。
 *
 * 无内置文案、不接 i18n（骨架无文案）；字号档位经主题通道 data-size 全跟随。
 *
 * 模板自包含：`<script setup>`（props）+ `<style global>`（CSS 变量主题化）随模板整体
 * 注册，无独立样式交付通道。
 *
 * IIFE 产物全局名 `AutoSparkSkeleton`（autospark.skeleton.js）；双加载时序由
 * {@link installPlugin} 兜底（先于引擎加载推预加载队列，晚于引擎加载直注册）。
 */
import type { AutoSpark } from "autospark";
import { captureNamespace } from "../../../utils/namespace";
import { installPlugin } from "@autospark/utils";
import skeletonTemplate from "./skeleton.html?raw";

/** 组件注册名（autospark. 点前缀命名空间，ADR-0094；kebab 免疫 DOM 属性名小写化） */
export const SKELETON_NAME = "autospark.skeleton";

/**
 * 插件注册体：写插件全局组件表（普通 Record 赋值即生效，无 API 门面）。
 */
function mountSkeletonPlugin(autospark: typeof AutoSpark): void {
    autospark.components[SKELETON_NAME] = skeletonTemplate;
}

bootstrapSkeletonPlugin();

/**
 * 双路径注册（模块加载期执行一次，经 {@link installPlugin} 单点）。
 */
function bootstrapSkeletonPlugin(): void {
    installPlugin((autospark) => {
        captureNamespace(autospark); // 运行时桥命名空间捕获（本插件当前零符号消费，预留统一通道）
        mountSkeletonPlugin(autospark);
    });
}

export { bootstrapSkeletonPlugin };
