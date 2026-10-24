/**
 * autospark.button 组件插件（@autospark/plugins ADR-0003 组件形态官方样板）：
 * 经插件全局组件表注册（ADR-0111 决策 5，`AutoSpark.components[name] = 模板字符串`），
 * 跨 engine 真全局——晚注册立即生效，同名后注册覆盖先注册。
 *
 * 查找链语义（engine `_resolveGlobalComponent`）：`scope 局部 → options.components →
 * 本表 → builtinComponents`——业务侧 `options.components` 同名声明优先级高于本表，
 * 覆盖通道完好（button 无继承家族，无 notifications 那样的 per-engine 种子诉求）。
 *
 * 模板自包含：`<script setup>`（type/size/label/disabled 状态与 mounted 同步）+
 * `<style global>`（CSS 变量主题化）随模板整体注册，无独立样式交付通道。
 *
 * IIFE 产物全局名 `AutoSparkButton`（autospark.button.js）；双加载时序由
 * {@link installPlugin} 兜底（先于引擎加载推预加载队列，晚于引擎加载直注册）。
 */
import type { AutoSpark } from "autospark";
import { captureNamespace } from "../../runtime/bridge";
import { installPlugin } from "../../runtime/bootstrap";
import buttonTemplate from "./button.html?raw";

/** 组件注册名（autospark. 点前缀命名空间，ADR-0094） */
export const BUTTON_NAME = "autospark.button";

/**
 * 插件注册体：写插件全局组件表（普通 Record 赋值即生效，无 API 门面）。
 */
function mountButtonPlugin(autospark: typeof AutoSpark): void {
    autospark.components[BUTTON_NAME] = buttonTemplate;
}

bootstrapButtonPlugin();

/**
 * 双路径注册（模块加载期执行一次，经 {@link installPlugin} 单点）。
 */
function bootstrapButtonPlugin(): void {
    installPlugin("autospark.button", "components", (autospark) => {
        captureNamespace(autospark); // 运行时桥命名空间捕获（本插件当前零符号消费，预留统一通道）
        mountButtonPlugin(autospark);
    });
}

export { bootstrapButtonPlugin };
