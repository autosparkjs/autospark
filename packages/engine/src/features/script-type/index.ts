/**
 * 自定义 script type 注册表（ADR-0132）——插件侧脚本声明处理的**唯一入口**。
 *
 * `autospark/*` 是引擎保留的 script type 命名空间（ADR-0031 家族：actions / data / setup
 * 为内置）。本注册表把该命名空间向插件开放：插件经类静态 `AutoSpark.scriptType(type, handler)`
 * 注册自定义类型（如 resource 插件的 `autospark/resources`），编译期 transformer 命中后
 * **派发**给 handler 处理（提取/解析/注入），script 本身剪枝不进渲染 DOM。
 *
 * 设计要点（与 ADR-0111 指令注册表同构）：
 * - **注册表是类静态全局 Map**（非 engine 实例态）：查询期委托——编译时现查，晚注册
 *   （插件后于 engine 加载）对后续编译天然生效，无需广播；
 * - **内置优先**：内置三种 type 不进派发（compiler 的内置 transformer 在前），注册
 *   内置名 → warn + 拒绝（防插件劫持引擎语义）；
 * - **重复注册 warn + 覆盖**（与 `DirectiveManager.install` 撞自定义名同构）——同插件
 *   双脚本标签重复加载时后者生效；
 * - **handler 无返回值**：script 声明性内容统一"提取后剪枝"语义（同 actions/data）。
 */
import type { AutoSpark } from "../../engine/engine";
import type { AutoSparkScope } from "../../engine/scope";

/**
 * script type 处理器：`(script, scope, engine) => void`。
 *
 * - `script`：命中的 `<script type="autospark/...">` 元素（textContent 为声明内容）；
 * - `scope`：compiler 经 templateScopeMap 解析的**最近祖先 scope**（顶层游离声明时为
 *   undefined，handler 自行决定全局分流是否消费——同 `extractScript` 入参模式）；
 * - `engine`：当前编译所属 engine 实例。
 */
export type AutoSparkScriptHandler = (
    script: HTMLScriptElement,
    scope: AutoSparkScope | undefined,
    engine: AutoSpark<any>,
) => void;

/** 内置 script type（ADR-0031 命名空间家族）——不开放注册，派发时跳过 */
const BUILTIN_SCRIPT_TYPES = new Set(["autospark/actions", "autospark/data", "autospark/setup"]);

/** 注册表（类静态全局，查询期委托——见模块头） */
const registry = new Map<string, AutoSparkScriptHandler>();

/** script type 合法形态：autospark/ 前缀 + 小写字母/数字/连字符（kebab-name） */
const TYPE_RE = /^autospark\/[a-z][a-z0-9-]*$/;

/**
 * 注册自定义 script type 处理器（经类静态 `AutoSpark.scriptType` 调用）。
 *
 * 非法形态（非 `autospark/kebab-name`、内置名、handler 非函数）warn + 拒绝；
 * 同名重复注册 warn + 后者覆盖。
 */
export function registerScriptType(type: string, handler: AutoSparkScriptHandler): void {
    if (!TYPE_RE.test(type)) {
        console.warn(
            `[autospark] AutoSpark.scriptType: type "${type}" 非法——须为 autospark/<kebab-name>（ADR-0132），已拒绝`,
        );
        return;
    }
    if (BUILTIN_SCRIPT_TYPES.has(type)) {
        console.warn(
            `[autospark] AutoSpark.scriptType: type "${type}" 为内置 script type（ADR-0031），不开放注册，已拒绝`,
        );
        return;
    }
    if (typeof handler !== "function") {
        console.warn(
            `[autospark] AutoSpark.scriptType: type "${type}" 的 handler 须为函数，已拒绝`,
        );
        return;
    }
    if (registry.has(type)) {
        console.warn(
            `[autospark] AutoSpark.scriptType: type "${type}" 重复注册，后者覆盖（ADR-0132）`,
        );
    }
    registry.set(type, handler);
}

/**
 * 查询 type 的已注册 handler；未注册返回 undefined。
 * 编译期派发 transformer 调用（查询期委托，晚注册天然生效）。
 */
export function getScriptTypeHandler(type: string): AutoSparkScriptHandler | undefined {
    return registry.get(type);
}

/**
 * 是否内置 script type——派发 transformer 据以跳过（内置走各自专用通道，行为不变）。
 */
export function isBuiltinScriptType(type: string): boolean {
    return BUILTIN_SCRIPT_TYPES.has(type);
}
