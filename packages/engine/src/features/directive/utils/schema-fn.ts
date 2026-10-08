/**
 * schema 转换函数（toInput/toState）应用工具（ADR-0050）。
 *
 * ModelDirective（控件形态）与 FieldDirective（容器形态 $field）共用的转换语义：
 * - 数组（select multiple）逐项转换（对齐 ADR-0026 决策 8 的逐项修饰符管道）；
 * - 失败「不破坏」（.number NaN 回退同款原则，warn 由调用方负责去重）：
 *   - 读方向（toInputValue）：单项失败回退该项原值，不中断数组其余项；
 *   - 写方向（toStateValue）：任一项失败放弃**整次**写入（返回 TRANSFORM_ABORT）。
 */

/** toStateValue 放弃写入的哨兵（toState 合法返回 undefined，不能用 undefined 表达放弃） */
export const TRANSFORM_ABORT = Symbol("autospark:transform-abort");

/**
 * 读方向应用 toInput（state→输入值）：恒喂（空值也喂——声明即接管空值显示，ADR-0050 决策 4）。
 * 数组逐项；单项 throw → warn（回调）+ 该项回退原值。
 */
export function toInputValue(fn: (v: any) => any, v: any, warn: (msg: string) => void): any {
    const conv = (x: any): any => {
        try {
            return fn(x);
        } catch (err: any) {
            warn(`toInput 执行失败: ${err?.message ?? err}（该项回退原值）`);
            return x;
        }
    };
    return Array.isArray(v) ? v.map(conv) : conv(v);
}

/**
 * 写方向应用 toState（输入值→state）：数组逐项；任一项 throw → warn（回调）+
 * 返回 TRANSFORM_ABORT（调用方放弃本次写入）。
 */
export function toStateValue(fn: (v: any) => any, v: any, warn: (msg: string) => void): any {
    const conv = (x: any): any => {
        try {
            return fn(x);
        } catch (err: any) {
            warn(`toState 执行失败: ${err?.message ?? err}（放弃本次写入）`);
            return TRANSFORM_ABORT;
        }
    };
    if (Array.isArray(v)) {
        const out: any[] = [];
        for (const item of v) {
            const r = conv(item);
            if (r === TRANSFORM_ABORT) return TRANSFORM_ABORT;
            out.push(r);
        }
        return out;
    }
    return conv(v);
}
