/**
 * 内置 action 聚合注册表（ADR-0093 决策 6）——**纯数据面**资产层：
 * 执行型一文件一动作（back / toast / confirm / task），纯信号型合 `signals.ts` 一表；
 * 新增内置 action = 加文件 + 此处登记一行。
 *
 * 机制（buildAction 包装、补齐次序）住 `features/action/builtins.ts`；
 * `BUILTIN_ACTIONS` 旧导出名由 builtins.ts 兼容转发（内部消费本表）。
 */
import { SIGNAL_ACTIONS } from "./signals";
import { backAction } from "./back";
import { createConfirmSpec } from "./confirm";
import { createTaskSpec } from "./task";
import { createToastSpec } from "./toast";
import type { AutoSpark } from "../engine/engine";
import type { BuiltinActionSpec } from "../features/action/types";

/**
 * 组装完整内置 action 表：注册键 → 展示标题（或 { title, handle } 自定义执行体）。
 *
 * engine 缺省（纯信号语境）时三件套落标题占位；有 engine 时绑定执行体
 * （转发 engine.messages.*，ADR-0071 决策 22/23）。
 */
export function buildBuiltinActions(engine?: AutoSpark<any>): Record<string, BuiltinActionSpec> {
    return {
        ...SIGNAL_ACTIONS,
        back: backAction,
        toast: engine ? createToastSpec(engine) : "提示",
        confirm: engine ? createConfirmSpec(engine) : "确认",
        task: engine ? createTaskSpec(engine) : "任务",
    };
}
