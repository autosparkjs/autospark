/**
 * 组件 `<style>` 响应式绑定改写器（ADR-0022 决策四-4.1）。
 *
 * 在 scoped CSS（决策四-4，属性后缀法）之上，把 `<style>` 声明值里的 `bind(expr)` 占位替换为
 * CSS 变量引用，并产出一份声明性 bind 清单供实例化期建订阅。
 *
 * 工作原理：
 * 1. **编译期**（本模块，`extractStyleBinds`）：遍历 CSS 声明体，识别 `bind(expr)`，
 *    按 expr 派生变量名（纯路径 → `--{路径}`，表达式 → `--h{hash}`），把占位替换为
 *    `var(--name, unset)`，产出 `{ rewritten, binds }`。rewritten 随后喂现有 `rewriteScopedCss`
 *    （两步正交：bind 替换只动属性值区，scoped 只动选择器区）。
 * 2. **实例化期**（compiler.instantiateComponent）：遍历 binds 调 `hostScope.watch(expr)`，
 *    求值结果写入**组件根元素**的 CSS 变量（每实例独立）；null/undefined 不写、走 `unset` 回退。
 *
 * **按表达式复用**（决策四-4.1-(2)，本机制的性能与正确性基石）：同 expr → 同变量名 → 一处 watch、
 * 多处 `var()` 共享。跨多个 `<style>` 块由调用方传入合并后做全局去重（见 extractStyleBindsFromMany）。
 */
import { type AutoSparkScope } from "../engine/scope";
import type { Watcher } from "autostore";
/** 单个 bind 绑定：表达式 + 派生的 CSS 变量名。声明性清单，多实例共享只读。 */
export interface StyleBind {
    /** bind 的表达式原文（已去引号、去首尾空白） */
    expr: string;
    /** 派生的 CSS 变量名，如 `--order-style` / `--h1a2b3c`（不含 `var()` 包裹） */
    varName: string;
}
/** extractStyleBinds 的产出：改写后的 CSS 文本 + bind 清单。 */
export interface ExtractStyleBindsResult {
    /** `bind(...)` 已替换为 `var(--name, unset)` 的 CSS 文本（供 rewriteScopedCss 继续 scoped 改写） */
    rewritten: string;
    /** 提取出的 bind 清单（按 expr 全局去重，保持首次出现顺序） */
    binds: StyleBind[];
}
/**
 * 把表达式派生为 CSS 变量名（决策四-4.1-(2)）。
 *
 * - **纯路径**（命中现有 `isSimpleStatePath`，正则 `^[\w$]+(?:\.[\w$]+)*$`）：`--{路径}`，
 *   `.`→`-`、`*`→`_`，其余原样保留（驼峰/下划线不动，如 `user.firstName` → `--user-firstName`）。
 *   注意 `isSimpleStatePath` 的 `\w` 不含 `-`，故**路径段含连字符**（如 `order-foo.bar`）**不匹配纯路径**，
 *   会走表达式 hash 分支——这与 core 路径定义一致（含 `-` 的路径本就非"简单路径"，watch 时亦走表达式支路）。
 * - **表达式**（非纯路径）：`--h{hash36}`——`h` 前缀保证首字符非数字（CSS Custom Properties
 *   要求 `--` 后构成合法 identifier，不能以数字开头，否则浏览器丢弃整条声明）。
 *
 * 不考虑 hash 变量名与纯路径变量名或用户自定义变量（`--my-color`）的冲突（决策四-4.1-(2)，
 * 罕见重叠可接受）。
 */
export declare function exprToVarName(expr: string): string;
/** `bind\s*\(` 调用形态检测（决策四-4.1：global 段不支持 bind，仅 warn 不提取；
 *  x-html.compile 的 `<style global>` 段同规则复用） */
export declare const BIND_CALL_RE: RegExp;
/**
 * 提取 CSS 文本中所有 `bind(...)` 占位并替换为 `var(--name, unset)`（决策四-4.1-(5)）。
 *
 * 复用 scoped 改写器同款状态机（按 `{`/`}` 深度遍历、跳过注释）：仅遍历**声明体**层
 * （选择器 `{ ... }` 内部），对每个声明 `prop: value;` 检查 value 是否以 `bind(` 开头且
 * 括号闭合——命中则替换为 `var(...)`、记录 bind；不命中则原样保留。
 *
 * @-rule 处理边界：
 * - `@media`/`@supports`/`@container`：递归进其内部规则体处理（包裹，内部仍是普通规则）；
 * - `@keyframes`：整体保留不提取（关键帧声明体 `from/50%/to` 的 bind 无意义）；
 * - 无 body 的 @-rule（`@import`）：原样保留。
 *
 * @param cssText 原始 `<style>` 文本
 * @param bindMap 跨块共享的 expr→StyleBind 映射（多 `<style>` 合并去重用，单块传新 Map）
 * @returns { rewritten, binds }
 */
export declare function extractStyleBinds(cssText: string, bindMap?: Map<string, StyleBind>): ExtractStyleBindsResult;
/**
 * 把值归一化为可写入 CSS 变量的字符串（决策四-4.1-(4) B1）。
 *
 * - `null` / `undefined` → 返回 `null`（调用方据此 `removeProperty`，CSS 走 `var(--name, unset)` 回退）；
 * - 其余 → `String(value)`（数字 `100` → `"100"`，布尔 `true` → `"true"`，字符串透传，对象走 `String()`）。
 */
export declare function coerceStyleValue(value: unknown): string | null;
/**
 * 为 `<style>` bind 清单建立 CSS 变量订阅（ADR-0022 决策四-4.1，组件实例化与
 * x-html.compile 样式通道共用）。
 *
 * 遍历 `binds`，对每个 bind 调 `scope.watch(expr)`——watch 返回当前值做首写、
 * watcher 进 `scope.watchers`。求值结果经 `coerceStyleValue` 归一化后写入 `rootEl`
 * 的 CSS 变量：null/undefined 不写（removeProperty，CSS 走 `var(--name, unset)` 回退），
 * 其余 `String(value)` 写入。
 *
 * 表达式经 scope 的聚合视图求值（`getContext` 沿 parent 链）——宿主 scope 的祖先
 * x-data 键可读，与普通模板插值同一数据视图。
 *
 * @param scope   watcher 寄主 scope（组件实例 scope / x-html 宿主 scope）
 * @param rootEl  变量挂载点元素（组件根 / x-html 宿主）
 * @param binds   bind 清单（组件侧编译期提取多实例共享只读；x-html 侧每轮 apply 提取）
 * @returns 本轮新建的 watcher 列表——**寄主 scope 销毁自动 off**（组件路径零额外接线）；
 *          生命周期短于 scope 的调用方（x-html.compile 每轮换血）须自行 off + 移出 watchers
 */
export declare function bindStyleVars(scope: AutoSparkScope, rootEl: HTMLElement, binds: StyleBind[]): Watcher[];
