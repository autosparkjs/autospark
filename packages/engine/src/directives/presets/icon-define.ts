import { AutoSparkDirectiveBase } from "../base";

/**
 * x-icon-define：图标定义标记（ADR-0046）。
 *
 * **声明性资源，非渲染指令**——本身不建 scope、不订阅、不渲染、甚至**不被实例化**。
 * compiler 的前置 collector（`compiler._collectIconDefine`）在 `compileElement` 之前即拦截
 * `x-icon-define` 元素：取首个 `<svg>` 子元素上交全局图标注册表（`AutoSpark.icons`，document
 * 级共享）→ 剪枝（不进结果 DOM）。因 first-match-wins，本指令类**永不会被 `createDirectives`
 * 实例化**——它只是注册表里的一等名位（与 x-define 同构，ADR-0022/0054 先例）。
 *
 * 声明形态：`<template x-icon-define="close"><svg>...</svg></template>`——名称走指令值
 * （对齐 x-define 惯例），SVG 走 template 内容（浏览器原生不渲染 template，零转义容器）。
 */
export class IconDefineDirective extends AutoSparkDirectiveBase {}
