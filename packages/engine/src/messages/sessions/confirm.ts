import { MessageSessionBase } from "./base";
import type { AutoSparkConfirmMessageSession, MessageProps } from "../types";

/**
 * confirm 专属 props（**type 分型**：公共键见 `MessageProps`；本 type 当前无专属
 * props 键——`yes/no` 是 confirm() 快捷方式的**可提取参数**（剥离转按钮文案，不落
 * 消息 props），故不入本接口。空扩展为结构占位，后续专属键落此）。
 */
export interface ConfirmMessageProps extends MessageProps {}

/**
 * confirm 会话（type='confirm'）：三方法 ≡ 点击对应按钮 + thenable（await 会话 = 等 choice
 * 应答）。行为与渲染模板同文件（ADR-0083 变体 A 聚合）。
 */
export class MessageConfirmSession extends MessageSessionBase implements AutoSparkConfirmMessageSession {
    /** 本 type 的预设渲染组件名（全局组件表查找；与 presetComponentName 约定等值） */
    static readonly component = "autospark.messages.confirm";

    /** choice promise（manager 在 entry 建立时经 `_bindChoice` 注入；挂起期为 null） */
    private _choice: Promise<any> | null = null;

    /** manager 内部绑定出口（entry 创建时——confirmResolve 闭环的 await 面） */
    _bindChoice(choice: Promise<any>): void {
        this._choice = choice;
    }

    /** 确认（≡ 点击 yes 按钮——value 写 result → 事件 → resolve → hide 判定） */
    yes(): void {
        this.manager._fireConfirmChoice(this as any, true);
    }
    /** 拒绝（≡ 点击 no 按钮） */
    no(): void {
        this.manager._fireConfirmChoice(this as any, false);
    }

    /** thenable：await 会话 = 等 choice 应答（value；sticky 永不 settle、永不 reject）；挂起期 await 永挂起 */
    then<TResult1 = any, TResult2 = never>(
        onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | null,
        onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
    ): Promise<TResult1 | TResult2> {
        return (this._choice ?? new Promise<any>(() => {})).then(onfulfilled, onrejected);
    }
}

/** confirm 预设组件模板：纯继承 base（ADR-0088 起基承载默认内容），零覆盖段——确认
 *  按钮行走 actions 组件（confirm = value-only actions 糖），type 无专属视觉 */
export const CONFIRM_TEMPLATE = `<div x-define="autospark.messages.confirm" x-define:inherit="autospark.messages.base"></div>`;
