/**
 * autospark.alert 组件插件（组件库 P0 轻件，ADR-0018 清单权威表 feedback 行 / ADR-0019）：
 * 经插件全局组件表注册（ADR-0111 决策 5，`AutoSpark.components[name] = 模板字符串`），
 * 跨 engine 真全局——晚注册立即生效，同名后注册覆盖先注册。
 *
 * 页内警示条：语义色五档（type：success/warning/danger/info + default 中性——语义色
 * 基线在非 button 组件的首个落地，--asc-tone 中转 + :has() 反驱宿主，button ADR-0012
 * 同款组织，可复制）、标题/描述（title/description，默认插槽可换描述）、关闭
 * （closable：closed 置位 + close 事件冒泡）、图标（icon 覆盖 / 按 type 映射内置
 * 图标经 x-icon 渲染）、通栏形态（banner）。静态展示组件——与 x-error 指令
 * （error 事件通道就近消费）正交，详见 alert.html 文件头边界声明。
 *
 * 无内置文案、不接 i18n（title/description 均使用者传入，ADR-0018 决策 6.1 的
 * i18n 通道对本件无消费面）；字号档位经主题通道 data-size 全跟随（不设自有字号
 * 属性，button 同范式 ADR-0012）。
 *
 * 模板自包含：`<script setup>`（props 与 mounted 同步）+ `<style global>`（CSS 变量
 * 主题化）随模板整体注册，无独立样式交付通道。
 *
 * IIFE 产物全局名 `AutoSparkAlert`（autospark.alert.js）；双加载时序由
 * {@link installPlugin} 兜底（先于引擎加载推预加载队列，晚于引擎加载直注册）。
 */
import type { AutoSpark } from "autospark";
import { captureNamespace } from "../../../utils/namespace";
import { installPlugin } from "@autospark/utils";
import alertTemplate from "./alert.html?raw";

/** 组件注册名（autospark. 点前缀命名空间，ADR-0094；kebab 免疫 DOM 属性名小写化） */
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
