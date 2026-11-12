/**
 * autospark.space 组件插件（组件库 P0 轻件，ADR-0018 清单权威表 layout 行 /
 * ADR-0019）：经插件全局组件表注册（ADR-0111 决策 5），跨 engine 真全局——
 * 晚注册立即生效，同名后注册覆盖先注册。
 *
 * 间距容器组件：为子元素之间提供统一间距——间距档位（size，标尺五档 CSS 变量档 /
 * number px / 任意 CSS 值 / [水平, 垂直] 两轴）、排列方向（direction）、交叉轴对齐
 * （align）、换行（wrap）。纯样式容器：子元素正常编译（插槽出口 display:contents，
 * 子项穿透成为 flex 直接子项）。与 engine layout 七指令（x-layout 管页面骨架窗格）
 * 互补不重叠——彼是页面结构分割，此是成组内容的间距编排。
 *
 * 无内置文案、不接 i18n（ADR-0018 决策 1）；零色彩消费（暗色模式天然无感）。
 *
 * 模板自包含：`<script setup>`（size 值形态的 JS 通道同步）+ `<style global>`
 * （CSS 变量主题化）随模板整体注册，无独立样式交付通道。
 *
 * IIFE 产物全局名 `AutoSparkSpace`（autospark.space.js）；双加载时序由
 * {@link installPlugin} 兜底（先于引擎加载推预加载队列，晚于引擎加载直注册）。
 */
import type { AutoSpark } from "autospark";
import { captureNamespace } from "../../../utils/namespace";
import { installPlugin } from "@autospark/utils";
import spaceTemplate from "./space.html?raw";

/** 组件注册名（autospark. 点前缀命名空间，ADR-0094；kebab 免疫 DOM 属性名小写化） */
export const SPACE_NAME = "autospark.space";

/**
 * 插件注册体：写插件全局组件表（普通 Record 赋值即生效，无 API 门面）。
 */
function mountSpacePlugin(autospark: typeof AutoSpark): void {
    autospark.components[SPACE_NAME] = spaceTemplate;
}

bootstrapSpacePlugin();

/**
 * 双路径注册（模块加载期执行一次，经 {@link installPlugin} 单点）。
 */
function bootstrapSpacePlugin(): void {
    installPlugin((autospark) => {
        captureNamespace(autospark); // 运行时桥命名空间捕获（本插件当前零符号消费，预留统一通道）
        mountSpacePlugin(autospark);
    });
}

export { bootstrapSpacePlugin };
