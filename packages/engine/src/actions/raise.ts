/**
 * raise：显式触发错误呈现的内置全局 action（ADR-0118 决策 2）——模板侧的显式触发入口
 * （表单校验失败、前置条件不满足等场景）。同步在触发元素 dispatch `error` CustomEvent
 * （bubbles+composed），由冒泡路径上最近的 x-error 宿主捕获呈现。
 *
 * 归一化（决策 6）：`raise("文本")` → `{message}`；`raise(new Error(...))` → `{name,message,stack}`；
 * `raise({...})` → 原样保留；均注入 `source:"raise"`（Error 实例不进响应式域）。
 *
 * 第二参 options 的 `props` / `closeable` / `retryable` / `actions` 透传进事件 detail——
 * 事件层配置优先于宿主 x-error-options 静态层（决策 7：raise 调用点比宿主声明更懂这次错误
 * 要什么按钮）。注意 raise 源 `retryable:true` 也不渲染重试按钮（无源可重，x-error 侧拦截 warn）。
 *
 * 命令式直调（无触发元素）不派发——与 buildAction 桥接同一边界：无元素可挂事件，错误归调用方。
 *
 * @example
 * <button @click="age < 18 ? raise('未成年不可提交', { closeable: false }) : submit()">提交</button>
 */
import { normalizeError } from "../utils/normalizeError";

/** raise 第二参：事件层呈现配置（优先级高于 x-error-options 静态层，ADR-0118 决策 7） */
export interface RaiseOptions {
    /** 注入错误组件 data 的自由 props（与静态层 props 合并） */
    props?: Record<string, any>;
    /** 是否提供关闭按钮（覆盖静态层） */
    closeable?: boolean;
    /** 是否提供重试按钮（覆盖静态层；raise 源恒不渲染——无源可重） */
    retryable?: boolean;
    /** 额外动作按钮（覆盖静态层；data-action 点击委托，ADR-0038 同款） */
    actions?: Array<string | Record<string, any>>;
}

export const raiseAction = {
    title: "抛出错误",
    handle: function (this: any, error?: any, options?: RaiseOptions) {
        const el = this?.el as HTMLElement | undefined;
        if (!el) {
            // 命令式直调无触发元素：不派发（边界同 buildAction 桥接——错误归调用方代码）
            this?.engine?.logger?.warn?.("raise: 无触发元素（命令式直调），error 事件未派发");
            return;
        }
        const normalized = normalizeError(error, "raise");
        el.dispatchEvent(
            new CustomEvent("error", {
                bubbles: true,
                composed: true,
                detail: {
                    error: normalized,
                    // options 字段透传（仅显式携带的键；事件层优先于静态层由 x-error 合并）
                    ...(options?.props !== undefined ? { props: options.props } : {}),
                    ...(options?.closeable !== undefined ? { closeable: options.closeable } : {}),
                    ...(options?.retryable !== undefined ? { retryable: options.retryable } : {}),
                    ...(options?.actions !== undefined ? { actions: options.actions } : {}),
                },
            }),
        );
        return normalized;
    },
};
