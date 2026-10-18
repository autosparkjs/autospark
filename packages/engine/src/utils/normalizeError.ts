/**
 * 错误对象归一化（ADR-0118 决策 6）：注入呈现层的 error 恒为**普通对象**——
 * Error 实例不进响应式域（原型链对象进 AutoStore 响应式域无收益且有序列化包袱）。
 *
 * 归一形态：
 * - `"文本"`（string）→ `{ message: "文本", source }`
 * - `new Error(...)` → `{ name, message, stack, source }`
 * - 普通对象 → 原样展开保留并注入 `source`
 * - 其他（number/null/undefined 等）→ `{ message: String(error), source }`
 *
 * 三方共用：buildAction rejected 桥接（source:"action"）、raise 内置 action（source:"raise"）、
 * x-error 对第三方自 dispatch 的缺字段 error 事件兜底归一。
 */

/** 归一化后的错误对象（普通对象，可安全进响应式域） */
export interface NormalizedError {
    /** 错误名（Error 实例带入，如 "TypeError"） */
    name?: string;
    /** 错误消息（恒存在） */
    message: string;
    /** 堆栈（Error 实例带入） */
    stack?: string;
    /** 错误来源："action"=action 失败桥接 / "raise"=raise 显式触发 */
    source: string;
    /** action 源携带：失败 action 的完整描述符（重试的弹药之一） */
    action?: any;
    /** action 源携带：原调用 args 数组（重试的弹药之一） */
    args?: any[];
    [key: string]: any;
}

/**
 * 把任意 thrown/dispatch 的错误值归一化为普通对象。
 *
 * @param error  原始错误值（Error / string / 普通对象 / 其他）
 * @param source 来源标记（"action" | "raise" | 兜底场景自定义）
 */
export function normalizeError(error: any, source: string): NormalizedError {
    if (error instanceof Error) {
        return { name: error.name, message: error.message, stack: error.stack, source };
    }
    if (typeof error === "string") {
        return { message: error, source };
    }
    if (error && typeof error === "object") {
        return { ...error, source };
    }
    return { message: String(error), source };
}
