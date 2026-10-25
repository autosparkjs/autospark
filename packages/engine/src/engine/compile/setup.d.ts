import type { ComponentHooks, ComponentSetup } from "../../features/component/component-def";
/**
 * 实例化时求出组件 data 的 per-instance 初始值（ADR-0057，供 injectComponentSemantics 调用）。
 *
 * - 工厂函数（含合并后的混合工厂）：每实例调用一次，天然新对象；
 * - 对象字面量：**深克隆**后返回（多实例不共享嵌套引用）；
 * - 未声明 data：返回 undefined。
 */
export declare function resolveComponentData(setup: ComponentSetup | undefined): Record<string, any> | undefined;
/**
 * 求值单个 `<script setup>` 文本为 setup 对象字面量（ADR-0022 决策四-2）。
 *
 * 经 `new Function('return ' + text)()` 求值——**信任代码**（用户声明信任）。
 * 求值失败 / 返回非对象 → warn + 返回 undefined（丢弃该 `<script setup>`，不阻断组件其余部分，
 * 决策四-3 容错）。
 *
 * @param text   `<script setup>` 的 textContent（已 trim）
 * @param name   组件名（仅供日志）
 * @param warn   warn 日志函数（传入 logger.warn）
 * @returns setup 对象，或 undefined（求值失败/非对象）
 */
export declare function evalComponentSetup(text: string, name: string, warn: (msg: string) => void): ComponentSetup | undefined;
/**
 * 合并多个 `<script setup>` 求值结果（ADR-0022 决策四-1；数据模型 v2 见 ADR-0057）。
 *
 * 按段分类合并：
 * - `data`：**双形态**（ADR-0057）——对象字面量浅合并为单个对象（实例化时深克隆）、
 *   工厂函数依次调用合并返回值；对象与工厂混声明时归一化为单个工厂（先克隆各对象、再依次调工厂）；
 * - `methods`：浅合并（后者同名覆盖前者）；
 * - `locals`：浅合并（非响应式私有变量，后者同名覆盖前者）——程序化 `locals` 段与 HTML 形式的
 *   setup **顶层非保留键**同池收集；与内置上下文键重名 warn + 忽略；
 * - 同名 hook（created/mounted/...）：收集为数组，**按声明顺序串行**。
 *
 * 旧写法（ADR-0057 废弃）warn + 剪枝不生效：`state()` 函数（旧响应式工厂，现须写 `data`/`data()`）。
 * `state` 非函数值不再是保留键，按普通顶层私有变量收集。
 *
 * 无任何 setup 时返回 undefined（组件无数据/方法/钩子）。
 *
 * @param setups 各 `<script setup>` 的求值结果（按文档顺序，已过滤 undefined）
 * @param warn   warn 日志函数（传入 logger.warn，旧写法废弃/重名提示）
 */
export declare function mergeComponentSetups(setups: ComponentSetup[], warn: (msg: string) => void): ComponentSetup | undefined;
/**
 * 从合并后的 setup 提取钩子表（供实例化时克隆到 scope.hooks）。
 *
 * @returns 钩子表（无钩子则各阶段为空数组）；始终返回非 null，实例化时按数组是否空决定是否触发。
 */
export declare function extractComponentHooks(setup: ComponentSetup | undefined): ComponentHooks | undefined;
