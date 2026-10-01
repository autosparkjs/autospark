import type { ComponentDef } from "../../directives/component-def";
import { resolveToastRenderer } from "./toast";
import { resolveTaskRenderer } from "./task";
import { resolveConfirmRenderer } from "./confirm";

export { resolveMessageShell, SHELL_TEMPLATE, SHELL_STYLES } from "./shell";
export { TASK_RENDERER_TEMPLATE, TASK_RENDERER_STYLES } from "./task";

/**
 * 内置 kind renderer 注册表（ADR-0077 双层组合的 kind 专属链）：**一内置 kind 一 renderer**
 * ——`toast` / `task`（进度槽）/ `confirm`（空占位），名即 kind 名（命名零特例）。
 * 自定义 kind 未注册 → 无 renderer（shell kind 出口空置）。
 *
 * kind 链查找协议（manager 每条消息实例化时解析）：
 * `kinds[kind].render`（用户 kind 级）→ **内置注册表按 kind**（本表）→ 无（出口空）。
 * 与 shell 链正交（公共骨架归 shell：`options.messages.shell` → getComponent 链 →
 * `options.uiShells` → 内置 shell 兜底）。
 *
 * 后续新增内置 renderer 同规：`src/messages/renderers/` 一组件一文件 + 本表登记一行。
 */

export type BuiltinRenderer = { snapshot: HTMLElement; def: ComponentDef | null };

/** 内置 renderer 解析器表：kind → 懒构建函数（引擎私有组件，不进用户 components 命名空间） */
const BUILTIN_RENDERERS: Record<string, () => BuiltinRenderer> = {
    toast: resolveToastRenderer,
    task: resolveTaskRenderer,
    confirm: resolveConfirmRenderer,
};

/** 按 kind 取内置 renderer（注册表命中即返回；未命中 null——无专属区，出口空置） */
export function resolveBuiltinRendererByKind(kind: string): BuiltinRenderer | null {
    const resolver = BUILTIN_RENDERERS[kind];
    return resolver ? resolver() : null;
}
