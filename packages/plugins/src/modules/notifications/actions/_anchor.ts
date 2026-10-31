/**
 * 内置 action 共享件：从 action 触发上下文取 anchor（ADR-0071 决策 23）。
 *
 * buildAction 包装内 `this` = AutoSparkActionContext（经 x-on 触发时含 `el` = 发起元素）；
 * 命令式直调无 el → null（编程式 API 无注入——anchor 仅显式传时生效）。
 */
export function triggerAnchor(ctx: unknown): HTMLElement | null {
    const el = (ctx as any)?.el;
    return el instanceof HTMLElement ? el : null;
}
