/**
 * autospark.divider 组件插件（组件库 P0 轻件，ADR-0018 清单权威表 layout 行 /
 * ADR-0019；layout 分类首件）：经插件全局组件表注册（ADR-0111 决策 5），
 * 跨 engine 真全局——晚注册立即生效，同名后注册覆盖先注册。
 *
 * 分割线组件：水平（缺省）/ 垂直（vertical）、虚线（dashed）、带文字位置
 * （align，仅水平态）、间距（spacing）。纯装饰性分隔（与 x-splitter 分割器的
 * 可拖拽分栏正交——彼是布局结构指令，此是视觉分割线）。
 *
 * 模板自包含：`<script setup>`（spacing 的宿主 margin 同步）+ `<style global>`
 * （CSS 变量主题化）随模板整体注册，无独立样式交付通道。
 *
 * IIFE 产物全局名 `AutoSparkDivider`（autospark.divider.js）；双加载时序由
 * {@link installPlugin} 兜底（先于引擎加载推预加载队列，晚于引擎加载直注册）。
 */
import type { AutoSpark } from "autospark";
import { captureNamespace } from "../../../utils/namespace";
import { installPlugin } from "@autospark/utils";
import dividerTemplate from "./divider.html?raw";

/** 组件注册名（autospark. 点前缀命名空间，ADR-0094；kebab 免疫 DOM 属性名小写化） */
export const DIVIDER_NAME = "autospark.divider";

/**
 * 插件注册体：写插件全局组件表（普通 Record 赋值即生效，无 API 门面）。
 */
function mountDividerPlugin(autospark: typeof AutoSpark): void {
    autospark.components[DIVIDER_NAME] = dividerTemplate;
}

bootstrapDividerPlugin();

/**
 * 双路径注册（模块加载期执行一次，经 {@link installPlugin} 单点）。
 */
function bootstrapDividerPlugin(): void {
    installPlugin((autospark) => {
        captureNamespace(autospark); // 运行时桥命名空间捕获（本插件当前零符号消费，预留统一通道）
        mountDividerPlugin(autospark);
    });
}

export { bootstrapDividerPlugin };
