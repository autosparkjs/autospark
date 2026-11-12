/**
 * autospark.base-field 组件插件（组件库 P0 form 基座，ADR-0018 决策 7 / ADR-0020）：
 * 经插件全局组件表注册（ADR-0111 决策 5），跨 engine 真全局——晚注册立即生效，同名
 * 后注册覆盖先注册。
 *
 * 表单域骨架基类（base/ 目录首个产物，ADR-0017 决策 4：内部基类不进侧边栏/文档投影，
 * 非用户直接消费）：为 form 域组件（input / checkbox / radio / switch / select /
 * input-number …）提供继承基座——状态色通道（status → data-status → --asc-field-tone
 * 派生）、焦点态追踪（data-focus）、disabled/readonly 同步（data-* 标记协议）、
 * .asc-field-box 盒饰选配类。宁薄勿胖（ADR-0018：form 前瞻唯一例外，其余基类演进式）。
 *
 * 模板自包含：`<script setup>`（状态 props 与同步钩子）+ `<style global>`（状态色
 * CSS 变量与盒饰约定）随模板整体注册，无独立样式交付通道。
 *
 * IIFE 产物全局名 `AutoSparkBaseField`（autospark.base-field.js）；双加载时序由
 * {@link installPlugin} 兜底（先于引擎加载推预加载队列，晚于引擎加载直注册）。
 * 子组件产物（如 autospark.input.js）以副作用导入内嵌本注册——按需加载场景无须
 * 单独引入本产物。
 */
import type { AutoSpark } from "autospark";
import { captureNamespace } from "../../../utils/namespace";
import { installPlugin } from "@autospark/utils";
import baseFieldTemplate from "./base-field.html?raw";

/** 组件注册名（autospark. 点前缀命名空间，ADR-0094；kebab 免疫 DOM 属性名小写化） */
export const BASE_FIELD_NAME = "autospark.base-field";

/**
 * 插件注册体：写插件全局组件表（普通 Record 赋值即生效，无 API 门面）。
 */
function mountBaseFieldPlugin(autospark: typeof AutoSpark): void {
  autospark.components[BASE_FIELD_NAME] = baseFieldTemplate;
}

bootstrapBaseFieldPlugin();

/**
 * 双路径注册（模块加载期执行一次，经 {@link installPlugin} 单点）。
 */
function bootstrapBaseFieldPlugin(): void {
  installPlugin((autospark) => {
    captureNamespace(autospark); // 运行时桥命名空间捕获（本插件当前零符号消费，预留统一通道）
    mountBaseFieldPlugin(autospark);
  });
}

export { bootstrapBaseFieldPlugin };
