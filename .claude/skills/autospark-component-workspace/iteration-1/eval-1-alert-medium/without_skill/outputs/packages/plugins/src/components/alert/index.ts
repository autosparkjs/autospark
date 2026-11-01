/**
 * autospark.alert 组件插件（组件形态，样板同 autospark.button）：经插件全局组件表注册
 * （ADR-0111 决策 5，`AutoSpark.components[name] = 模板字符串`），跨 engine 真全局——
 * 晚注册立即生效，同名后注册覆盖先注册。
 *
 * 查找链语义（engine `_resolveGlobalComponent`）：`scope 局部 → options.components →
 * 本表 → builtinComponents`——业务侧 `options.components` 同名声明优先级高于本表，
 * 覆盖通道完好（alert 无继承家族，无 per-engine 种子诉求）。
 *
 * 警告条契约：四种语义色（info/success/warning/danger）+ 标题/描述两行布局 + 可选左侧
 * 图标（true=按 type 语义图标 / 字符串=自定义 / false=关闭）+ closable 关闭（点击收起，
 * `open` 受控键绑定父组件状态可控制重新显示，关闭时派发 `close` 事件冒泡）。
 *
 * 模板自包含：`<script setup>`（状态 + methods + mounted 订阅同步）+ `<style global>`
 * （CSS 变量主题化）随模板整体注册，无独立样式交付通道。
 *
 * IIFE 产物 `autospark.alert.js`（script 直引消费契约）；双加载时序由
 * {@link installPlugin} 兜底（先于引擎加载推预加载队列，晚于引擎加载直注册）。
 */
import type { AutoSpark } from "autospark";
import { captureNamespace } from "../../utils/namespace";
import { installPlugin } from "@autospark/utils";
import alertTemplate from "./alert.html?raw";

/** 组件注册名（autospark. 点前缀命名空间，ADR-0094） */
export const ALERT_NAME = "autospark.alert";

/**
 * 插件注册体：写插件全局组件表（普通 Record 赋值即生效，无 API 门面）。
 */
function mountAlertPlugin(autospark: typeof AutoSpark): void {
    autospark.components[ALERT_NAME] = alertTemplate;
}

bootstrapAlertPlugin();

/**
 * 双路径注册（模块加载期执行一次，经 {@link installPlugin} 单点）。
 */
function bootstrapAlertPlugin(): void {
    installPlugin((autospark) => {
        captureNamespace(autospark); // 运行时桥命名空间捕获（本插件当前零符号消费，预留统一通道）
        mountAlertPlugin(autospark);
    });
}

export { bootstrapAlertPlugin };
