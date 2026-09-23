import { AutoSparkDirectiveBase } from "../base";

/**
 * x-case / x-default：分支选择标记（ADR-0037）。
 *
 * **声明性标记，非渲染指令**——不建 scope、不订阅、不渲染、且**永不被实例化**（同 x-else /
 * x-define 的注册名位模式）。分支选择的全部逻辑在 SwitchDirective 与 compiler 剪枝层：
 *
 * - **收集**：SwitchDirective.`created` 主动扫描 x-switch 宿主的**直接子元素**，把带 `x-case`
 *   （relaxed-json 字面量，多值数组任一命中）/ 裸 `x-default`（兜底，位置无关）属性者
 *   `cloneNode(true)` 为冻结快照（模板只读契约，ADR-0002），主表达式单 watcher 求值一次、
 *   SameValueZero 匹配；
 * - **剪枝**：compiler 前置 transformer 拦截分支元素返回 null——eager 的 `compileSubtree`
 *   与 keepalive 的主 walk 两条子树编译通道统一不把分支编进结果 DOM；父元素无 x-switch
 *   属性时 warn（孤儿分支，丢弃，同 x-else-if 孤儿惯例）。
 *
 * 注册 `case` / `default` 两个名（presetDirectives 显式映射到本类），仅为合法可发现名位——
 * 让 x-case / x-default 成为合法指令名（文档/类型友好），勿依赖类名。
 */
export class CaseDirective extends AutoSparkDirectiveBase {}
