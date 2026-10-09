/**
 * builtins —— 内置 action 的**注册机制**（ADR-0036 决策 7；ADR-0093 决策 6 数据出仓）。
 *
 * 数据面（信号表 / 各执行体声明）已出仓至顶层 `src/actions/`（纯数据资产层，
 * 「加内置 action = 加文件 + actions/index.ts 登记一行」）；本文件只保留机制：
 * `createBuiltinAction` 描述符构造与 `registerBuiltinActions` 补齐编排——
 * `ActionManager.registerGlobals` 只保留「先扫用户声明、后补内置缺失键」的注册次序，
 * **只补用户未占用的键**（用户同名声明覆盖内置）。
 */
import type { AutoSpark } from "../../engine/engine";
import { buildBuiltinActions } from "../../actions";
import { buildAction, type ActionEmit } from "./buildAction";
import type { ActionDecl, AutoSparkAction, BuiltinActionSpec } from "./types";

/** 构造单个内置 action 描述符（信号型）：默认 handle 透传首参 + `title` + `builtin: true` 标记 */
export function createBuiltinAction(name: string, spec: BuiltinActionSpec, emit: ActionEmit): AutoSparkAction {
    const normalized = typeof spec === "string" ? { title: spec } : spec;
    return buildAction(emit, {
        handle: normalized.handle ?? ((payload?: any) => payload),
        name,
        title: normalized.title,
        builtin: true,
    });
}

/**
 * 把内置 action 补进全局表：**只补用户未占用的键**（用户同名声明先扫先占，覆盖内置）。
 *
 * @param target 全局 action 表（`options.actions`，声明入参形态；构造期已扫过用户声明、
 *               逐条规范化，运行时值恒为 ActionDesc）
 * @param emit   总线广播函数（调用点绑 engine.emit）
 * @param engine engine 实例（配套 action 三件套的执行体依赖——handle 转发 engine.notifications.*，
 *               ADR-0071 决策 22/23；广播语义经 buildAction 包装照常保留）
 */
export function registerBuiltinActions(
    target: Record<string, ActionDecl>,
    emit: ActionEmit,
    engine?: AutoSpark<any>,
): void {
    for (const [name, spec] of Object.entries(buildBuiltinActions(engine))) {
        if (name in target) continue;
        target[name] = createBuiltinAction(name, spec, emit);
    }
}
