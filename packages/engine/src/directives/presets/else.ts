import { AutoSparkDirectiveBase } from "../base";

/**
 * x-else-if / x-else：条件分支标记（ADR-0034）。
 *
 * **声明性标记，非渲染指令**——不建 scope、不订阅、不渲染、且**永不被实例化**（同 x-define
 * 的注册名位模式）。条件分支链的全部逻辑在 IfDirective 与 compiler 剪枝层：
 *
 * - **收集**：IfDirective.`created` 主动扫描 x-if 宿主的**直接子元素**，把带 `x-else-if` /
 *   `x-else` 属性者 `cloneNode(true)` 为冻结快照（模板只读契约，ADR-0002），建立
 *   「主表达式 → elseif 链（文档顺序、首个真者胜）→ 裸 x-else 兜底」的短路求值链；
 * - **剪枝**：compiler 前置 transformer 拦截分支元素返回 null——eager 的 `compileSubtree`
 *   与 keepalive 的主 walk 两条子树编译通道统一不把分支编进结果 DOM；父元素无 x-if 属性
 *   时 warn（孤儿分支，丢弃，同 x-define 孤儿惯例）。
 *
 * 注册 `else-if` / `else` 两个名（presetDirectives 显式映射到本类），仅为合法可发现名位——
 * 让 x-else-if / x-else 成为合法指令名（文档/类型友好），勿依赖类名。
 */
export class ElseDirective extends AutoSparkDirectiveBase {}
