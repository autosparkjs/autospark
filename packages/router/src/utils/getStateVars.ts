/**
 * 元状态插值变量提取（ADR-0122）
 *
 * 从 `engine.state.$` 提取可进地址/hash 插值的扁平变量：
 * - 自有可枚举键 + 原始值白名单（`string | number | boolean`）——对象/函数/null/undefined 跳过
 * - `route` 键排除：插值发生在加载期、commit 之前，`$.route` 是上一导航的快照
 *
 * 常开、静默容缺：`router.engine` 缺失（最小测试 stub）或 `state.$` 不存在时返回空对象，
 * 其余插值变量不受影响。
 */

import type { AutoSparkRouter } from "@/router";

/** 可进插值的原始值类型 */
export type StateInterpolationVars = Record<string, string | number | boolean>;

/**
 * 提取 `state.$` 中可参与插值的成员
 *
 * @param router - 路由器实例（可容缺，缺失时返回空对象）
 */
export function getStateVars(router?: Partial<AutoSparkRouter>): StateInterpolationVars {
    const engine = (router?.engine ?? undefined) as any;
    // 真实 engine 的 state 即 store.state；最小测试 stub 可能只暴露 store
    const meta = engine?.state?.$ ?? engine?.store?.state?.$;
    if (!meta || typeof meta !== "object") return {};

    const vars: StateInterpolationVars = {};
    for (const key of Object.keys(meta)) {
        if (key === "route") continue;
        const value = (meta as Record<string, any>)[key];
        const type = typeof value;
        if (type === "string" || type === "number" || type === "boolean") {
            vars[key] = value;
        }
    }
    return vars;
}
