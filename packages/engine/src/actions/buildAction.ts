/**
 * buildAction —— 把 action 描述符的 handle 包装为**双通道广播生命周期事件**的版本
 * （ADR-0010 / 0011 / 0012 / 0036）。
 *
 * **同步/异步统一**（ADR-0011）：所有 action（无论同步或 async）均广播完整 lifecycle——
 * pending（执行前）→ resolved（成功）/ rejected（失败）。不再仅 async 广播。
 *
 * **双通道（正交并存，ADR-0010）**：
 * 1. **总线**（ADR-0003）：emit `actions/<name>/{pending,resolved,rejected}` —— 全局消费者。
 * 2. **DOM 冒泡**（ADR-0010）：在触发元素上 dispatchEvent `action:<name>` CustomEvent
 *    （`bubbles+composed`，detail 不带 el/scope）—— 祖先聚合后代 action。
 *
 * **全局 vs 局部（ADR-0012）**：
 * - **全局 action**（engine.actions）：双发（总线 + DOM 冒泡）。
 * - **局部 action**（scope.actions，`<script type="autospark/actions">`）：**只 DOM 冒泡，不进总线**——
 *   总线是全局通道，局部 action 同名进总线会与其他 scope 同名局部 action 串扰（消费者无法区分）；
 *   DOM 冒泡天然隔离作用域（冒泡只到祖先）。经 `local` 标志区分（ActionManager 提取入口传 true、
 *   全局注册入口默认 false）。
 *
 * **descriptor 签名（ADR-0036 决策 4/5/6）**：入参/返回值均为已规范化的 `ActionDesc`——
 * 包装其 `handle` 并**就地替换**（存储 / 广播 payload / `this.action` 自引用同源一致）：
 * - **广播带完整描述符**（决策 5）：两通道 payload/detail 均新增嵌套 `action` 字段 = 完整
 *   descriptor（含 name/title/icon/自由元数据/handle 函数本体）；顶层既有字段（name/phase/
 *   result/error）原样不动；payload **不承诺可序列化**（handle 是函数）。
 * - **`this.action` 自引用注入**（决策 4）：handle 调用时向 this（AutoSparkActionContext）就地
 *   写入 `action = desc`（活引用：元数据可读写但无响应式承诺）；`this === desc`
 *   （递归 `this.action.handle(...)`）时不注入，防 descriptor 自环污染；命令式直调
 *   （this 为 undefined）跳过注入，`this.action` 不可达（非 ctx 调用无自引用）。
 * - **防双重包装移到 descriptor 级**（决策 6）：handle 已包装（`__buildActionWrapped` 标记）
 *   直接返回，重复赋值同一 handle 不双重广播。
 *
 * **dispatch 源 = AutoSparkActionContext.el**：wrapped 内 `this = AutoSparkActionContext`（经 x-on 触发），
 * 闭包捕获 `this.el` 作 triggerEl。命令式直调（this 非 ctx、无 el）→ triggerEl 为空：
 * 全局 action 仍 emit 总线（只不走 DOM）；局部 action 既无总线也无 DOM = 静默（组件内部调用，自知结果）。
 *
 * **detail 不带 el/scope**：作用域由**冒泡路径**表达、触发元素由 **event.target** 表达
 * （规避 ADR-0008 否决的「payload 带 el」）。
 *
 * **时序**：pending 在 handle 执行**之前**（=「开始执行」）；resolved/rejected 在完成时
 * ——同步同 tick 内 pending→resolved（或抛错 pending→rejected），异步经 `then`。
 *
 * **错误传播**：同步抛错先 broadcast `rejected` 再 **rethrow**（保持错误传播——x-on eval.ts catch
 * 记日志 / 命令式调用者仍收到错误）；async reject 经内部 `then(_, onRejected)` 消费广播 `rejected`
 * （消除 unhandled rejection）。两者互斥（async 函数体 throw 被包装为 rejected promise）。
 */

import type { ActionDesc } from "./types";

/** 总线广播函数类型：emit `actions/<name>/<verb>`（调用点绑 engine.emit）。 */
type ActionEmit = (type: string, payload: Record<string, any>) => void;

/**
 * 把一个已规范化的 action 描述符的 handle 包装为**双通道广播生命周期事件**的版本
 * （同步/异步统一），就地替换 `desc.handle` 并返回同一 descriptor。
 *
 * @param emit   总线广播函数（调用点绑 engine.emit；动态事件名由调用点 `as any` 适配）
 * @param desc   已规范化的 action 描述符（name 已注入；浅拷贝体，安全就地突变）
 * @param local  局部 action（scope.actions）：只 DOM 冒泡、不进总线（ADR-0012，默认 false=全局）
 * @returns 同一 descriptor（handle 已替换为包装后版本）
 */
export function buildAction(emit: ActionEmit, desc: ActionDesc, local = false): ActionDesc {
    // 防御性防重包装：handle 已包装直接返回。正常路径（ActionManager._normalize）对已包装
    // 描述符先解包（__rawAction）再以本次注册键重包装，不经此分支；此处兜底直接调用方。
    if ((desc.handle as any).__buildActionWrapped) return desc;
    const raw = desc.handle;
    const name = desc.name;
    const wrapped = function (this: unknown, ...args: any[]) {
        // 触发元素：仅 AutoSparkActionContext（经 x-on 触发）有 el；命令式直调无 el
        const triggerEl = (this as any)?.el as HTMLElement | undefined;
        // 双通道广播：总线（全局通配，仅全局 action）+ DOM 冒泡（祖先聚合，全局+局部）。
        // local=true（局部 action）：跳过 emit，只 DOM——避免同名局部 action 总线串扰（ADR-0012）。
        // triggerEl 为空（命令式直调）：跳过 DOM；全局 action 仍 emit 总线，局部 action 静默。
        // action 字段 = 完整 descriptor（含 handle 函数本体，ADR-0036 决策 5；不承诺可序列化）。
        const broadcast = (phase: string, extra: Record<string, any> = {}) => {
            if (!local) emit(`actions/${name}/${phase}`, { name, action: desc, ...extra });
            if (triggerEl) {
                triggerEl.dispatchEvent(
                    new CustomEvent(`action:${name}`, {
                        bubbles: true,
                        composed: true,
                        detail: { name, phase, action: desc, ...extra },
                    }),
                );
            }
        };
        // pending 在执行前（开始执行）；同步/异步统一
        broadcast("pending");
        // this.action 自引用注入（ADR-0036 决策 4）：一次性 ctx 就地写入，活引用；
        // this === desc（递归 this.action.handle(...)）不注入，防 descriptor 自环
        if (this && typeof this === "object" && this !== desc) {
            (this as any).action = desc;
        }
        let result: any;
        try {
            result = raw.apply(this, args);
        } catch (error) {
            // 同步抛错：广播 rejected 后 rethrow（保持错误传播：x-on eval.ts catch / 命令式调用者）
            broadcast("rejected", { error });
            throw error;
        }
        // 成功完成：同步立即 resolved；异步（thenable）等 then
        if (result && typeof (result as any).then === "function") {
            (result as Promise<any>).then(
                (value) => broadcast("resolved", { result: value }),
                (error) => broadcast("rejected", { error }),
            );
        } else {
            broadcast("resolved", { result });
        }
        return result;
    };
    (wrapped as any).__buildActionWrapped = true;
    // 保留原始 handle 引用：跨名/重复赋值同一描述符时由 _normalize 解包重包装（广播名跟随注册键）
    (wrapped as any).__rawAction = raw;
    desc.handle = wrapped;
    return desc;
}
