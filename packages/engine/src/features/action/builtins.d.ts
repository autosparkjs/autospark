import { type ActionEmit } from "./buildAction";
import type { ActionDecl, AutoSparkAction, BuiltinActionSpec } from "./types";
/** 构造单个内置 action 描述符（信号型）：默认 handle 透传首参 + `title` + `builtin: true` 标记 */
export declare function createBuiltinAction(id: string, spec: BuiltinActionSpec, emit: ActionEmit): AutoSparkAction;
/**
 * 把内置 action 补进全局表：**只补用户未占用的键**（用户同名声明先扫先占，覆盖内置）。
 *
 * @param target 全局 action 表（`options.actions`，声明入参形态；构造期已扫过用户声明、
 *               逐条规范化，运行时值恒为 ActionDesc）
 * @param emit   总线广播函数（调用点绑 engine.emit）
 */
export declare function registerBuiltinActions(target: Record<string, ActionDecl>, emit: ActionEmit): void;
