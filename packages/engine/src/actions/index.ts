/**
 * 内置 action 聚合注册表（ADR-0093 决策 6）——**纯数据面**资产层：
 * 执行型一文件一动作（back），纯信号型合 `signals.ts` 一表；新增内置 action = 加文件 +
 * 此处登记一行。
 *
 * 机制（buildAction 包装、补齐次序）住 `features/action/builtins.ts`；
 * `BUILTIN_ACTIONS` 旧导出名由 builtins.ts 兼容转发（内部消费本表）。
 *
 * 通知门面三件套（toast/confirm/task）已随通知插件迁出（@autospark/components ADR-0001）
 * ——它们是通知类型的 action 门面而非引擎内置，由插件 ready 时注册进 `engine.actions`。
 */
import { SIGNAL_ACTIONS } from "./signals";
import { backAction } from "./back";
import type { BuiltinActionSpec } from "../features/action/types";

/**
 * 组装完整内置 action 表：注册键 → 展示标题（或 { title, handle } 自定义执行体）。
 */
export function buildBuiltinActions(): Record<string, BuiltinActionSpec> {
    return {
        ...SIGNAL_ACTIONS,
        back: backAction,
    };
}
