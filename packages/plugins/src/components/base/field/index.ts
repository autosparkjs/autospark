/**
 * autospark.field 组件插件（组件库 P0 form 基座，ADR-0018 决策 7 / ADR-0020）：
 * 经插件全局组件表注册（ADR-0111 决策 5），跨 engine 真全局——晚注册立即生效，同名
 * 后注册覆盖先注册。
 *
 * 表单域骨架基类（base/ 目录首个产物；2026-11-14 修订：转公开文档组件——侧边栏
 * 「表单」组 + demo + 文档页，可直接实例化）：为 form 域组件（input / checkbox /
 * radio / switch / select / input-number …）提供继承基座——状态色通道
 * （status → data-status → --asc-field-tone 派生）、焦点态追踪（data-focus）、
 * disabled/readonly 同步（data-* 标记协议）、.asc-field-box 盒饰选配类、
 * prefix/suffix 具名装饰出口（轻装饰/重装饰分层，ADR-0020 修订版）。
 * 宁薄勿胖（ADR-0018：form 前瞻唯一例外，其余基类演进式）。
 *
 * 模板自包含：`<script setup>`（状态 props 与同步钩子）+ `<style global>`（状态色
 * CSS 变量与盒饰约定）随模板整体注册，无独立样式交付通道。
 *
 * IIFE 产物全局名 `AutoSparkField`（autospark.field.js）；双加载时序由
 * {@link installPlugin} 兜底（先于引擎加载推预加载队列，晚于引擎加载直注册）。
 * 子组件产物（如 autospark.input.js）以副作用导入内嵌本注册——按需加载场景无须
 * 单独引入本产物。
 */
import type { AutoSpark } from "autospark";
import { captureNamespace } from "../../../utils/namespace";
import { installPlugin } from "@autospark/utils";
import fieldTemplate from "./field.html?raw";

/** 组件注册名（autospark. 点前缀命名空间，ADR-0094；kebab 免疫 DOM 属性名小写化） */
export const FIELD_NAME = "autospark.field";

/**
 * 插件注册体：写插件全局组件表（普通 Record 赋值即生效，无 API 门面）。
 */
function mountFieldPlugin(autospark: typeof AutoSpark): void {
  autospark.components[FIELD_NAME] = fieldTemplate;
}

bootstrapFieldPlugin();

/**
 * 双路径注册（模块加载期执行一次，经 {@link installPlugin} 单点）。
 */
function bootstrapFieldPlugin(): void {
  installPlugin((autospark) => {
    captureNamespace(autospark); // 运行时桥命名空间捕获（本插件当前零符号消费，预留统一通道）
    mountFieldPlugin(autospark);
  });
}

export { bootstrapFieldPlugin };
