import { AutoSparkDirectiveBase } from "../base";

/**
 * x-define：命名组件定义标记（ADR-0054 更名自 x-component；机制承接 ADR-0022，向上承接 ADR-0021 的 x-block 升级）。
 *
 * **声明性资源，非渲染指令**——本身不建 scope、不订阅、不渲染、甚至**不被实例化**。
 * compiler 的前置 transformer（见 `compiler._collectComponent`）在 `compileElement` 之前即拦截
 * `x-define` 元素：深克隆为冻结快照 → 挂最近祖先 scope 的 `components` → 剪枝（不进结果 DOM）。
 * 因 first-match-wins，本指令类**永不会被 `createDirectives` 实例化**——它只是注册表里的
 * 一等名位，让 `x-define` 成为合法可发现的指令名（文档/类型友好）。
 *
 * 组件定义的完整能力（ADR-0022）：
 * - 子节点可含 `<script setup>`（数据/方法/生命周期钩子）与 `<style>`（组件作用域 CSS），由
 *   `_collectComponent` 提取并求值，从快照中移除；
 * - 嵌套 x-define 声明构成**定义 scope 链**（私有子组件）；
 * - 经 `x-component:名称` 实例化（ComponentDirective）时触发四阶段生命周期钩子（scope.hooks）。
 *
 * 这些逻辑全部在 compiler 的 `_collectComponent` / ComponentDirective（实例化指令）中实现，
 * 本类仍只是注册名位。
 */
export class DefineDirective extends AutoSparkDirectiveBase {}
