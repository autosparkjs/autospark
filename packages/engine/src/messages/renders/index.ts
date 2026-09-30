import type { ComponentDef } from "../../directives/component-def";
import { resolveBuiltinMessageShell } from "./message-shell";
import { resolveBuiltinTaskShell } from "./task-shell";

/**
 * 内置 render 注册表（ADR-0071 决策 16 四级查找协议的第三级）：**按 kind 的引擎内置渲染**
 * ——kind='task' → task-shell（进度槽全权渲染）；其余 kind / 未知 kind → message-shell 兜底。
 *
 * 查找协议（manager 每条消息按其 kind 实例化时解析）：
 * `kinds[kind].render`（用户 kind 级插槽）→ `options.messages.shell`（用户全局兜底）→
 * **内置注册表按 kind**（本表）→ 内置 message-shell（最终默认）。前两级用户配置恒压过后两级
 * 引擎内置；未命中用户组件名 warn + 回退。
 *
 * 后续新增内置 render 同规：`src/messages/renders/` 一组件一文件 + 本表登记一行。
 */

export type BuiltinShell = { snapshot: HTMLElement; def: ComponentDef | null };

/** 内置 render 解析器表：kind → 懒构建函数（引擎私有组件，不进用户 components 命名空间） */
const BUILTIN_RENDERS: Record<string, () => BuiltinShell> = {
    task: resolveBuiltinTaskShell,
};

/** 最终默认兜底：message-shell（任何 kind 未命中专用内置 render 时） */
export function resolveDefaultBuiltinShell(): BuiltinShell {
    return resolveBuiltinMessageShell();
}

/** 按 kind 取内置 render（注册表命中即专用，未命中回退 message-shell） */
export function resolveBuiltinRenderByKind(kind: string): BuiltinShell {
    const resolver = BUILTIN_RENDERS[kind];
    return resolver ? resolver() : resolveDefaultBuiltinShell();
}
