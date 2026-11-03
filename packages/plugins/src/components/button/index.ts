/**
 * autospark.button 组件插件（@autospark/plugins ADR-0003 组件形态官方样板）：
 * 经插件全局组件表注册（ADR-0111 决策 5，`AutoSpark.components[name] = 模板字符串`），
 * 跨 engine 真全局——晚注册立即生效，同名后注册覆盖先注册。
 *
 * 查找链语义（engine `_resolveGlobalComponent`）：`scope 局部 → options.components →
 * 本表 → builtinComponents`——业务侧 `options.components` 同名声明优先级高于本表，
 * 覆盖通道完好（button 无继承家族，无 notifications 那样的 per-engine 种子诉求）。
 *
 * 元素名形态（ADR-0133）：注册名 `autospark.button` 推导标签 `<x-button>`（官方命名空间
 * 剥离 + 归一化），懒预编译时序缺口已由引擎编译期反查修复（未知 `x-*` 标签触发全局表
 * 预编译），本插件**无需任何自举**——早期 precompile DOM 变换 workaround 已退役。
 *
 * 模板自包含：`<script setup>`（形态/语义色/图标/加载/勾选/tags 等 props 与 mounted
 * 同步）+ `<style global>`（CSS 变量主题化）随模板整体注册，无独立样式交付通道。
 *
 * IIFE 产物全局名 `AutoSparkButton`（autospark.button.js）；双加载时序由
 * {@link installPlugin} 兜底（先于引擎加载推预加载队列，晚于引擎加载直注册）。
 */
import type { AutoSpark } from "autospark";
import { captureNamespace } from "../../utils/namespace";
import { installPlugin } from "@autospark/utils";
import buttonTemplate from "./button.html?raw";

/** 组件注册名（autospark. 点前缀命名空间，ADR-0094） */
export const BUTTON_NAME = "autospark.button";

/**
 * 插件注册体：写插件全局组件表（普通 Record 赋值即生效，无 API 门面）。
 * `<x-button>` 标签形态由引擎元素名通道原生承接（ADR-0133），无需插件侧预处理。
 */
function mountButtonPlugin(autospark: typeof AutoSpark): void {
    autospark.components[BUTTON_NAME] = buttonTemplate;
}

bootstrapButtonPlugin();

/**
 * 双路径注册（模块加载期执行一次，经 {@link installPlugin} 单点）。
 */
function bootstrapButtonPlugin(): void {
    installPlugin((autospark) => {
        captureNamespace(autospark); // 运行时桥命名空间捕获（本插件当前零符号消费，预留统一通道）
        mountButtonPlugin(autospark);
    });
}

export { bootstrapButtonPlugin };
