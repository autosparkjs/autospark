import { AutoSparkDirectiveBase } from "../features/directive/base";

/**
 * x-icons：图标集声明标记（ADR-0058）。
 *
 * **声明性资源，非渲染指令**——本身不建 scope、不订阅、不渲染、甚至**不被实例化**。
 * compiler 的前置 collector（`compiler._collectIcons`）在 `compileElement` 之前即拦截
 * `x-icons` 元素（含 `x-icons.global` 修饰符形态）：内联多个带 id 的 `<svg>` 收集为
 * symbol + 远程 IconifyJSON 清单 kick，归最近祖先 scope（孤立 / `.global` 归全局）后
 * 剪枝（不进结果 DOM）。因 first-match-wins，本指令类**永不会被 `createDirectives`
 * 实例化**——它只是 presetDirectives 里的一等名位（与 x-define 同构，ADR-0022/0054 先例）。
 *
 * 声明形态（ADR-0058 决策 5）：`<template x-icons>`（纯内联多 svg）/ `<template
 * x-icons="save,home">`（远程清单值简写）/ 二者合并 / `x-icons-options` 整包
 * （url / icons / modify / global）。旧 `x-icon-define` 已硬移除（注册表不注册、静默失效）。
 */
export class IconsDirective extends AutoSparkDirectiveBase {}
