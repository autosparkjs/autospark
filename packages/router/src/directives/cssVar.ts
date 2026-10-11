/**
 * x-cssvar 自定义指令
 *
 * 将 Alpine.js 响应式数据同步为 CSS 变量
 * 支持响应式更新：当数据变化时，CSS 变量自动更新
 *
 * @example
 * <div x-data="{ titleColor: '#333', fontSize: '24px' }" x-cssvar="titleColor, fontSize">
 *   <h1 :style="{ color: 'var(--title-color)', fontSize: 'var(--font-size)' }">标题</h1>
 * </div>
 *
 * @module directives/cssVar
 */

import type { Alpine } from "alpinejs";

/**
 * 注册 x-cssvar 自定义指令
 */
export function registerCssVarDirective(Alpine: Alpine): void {
    Alpine.directive(
        "cssvar",
        (el, { expression }, { evaluate, cleanup, effect }) => {
            // 解析变量名，例如 'primaryColor, fontSize' -> ['primaryColor', 'fontSize']
            const varNames = expression.split(",").map((name) => name.trim());

            // 更新函数：将数据同步为 CSS 变量
            const updateVars = () => {
                try {
                    const scope = evaluate("$data");

                    for (const name of varNames) {
                        // 支持嵌套路径，如 'theme.primary'
                        const value = name.split(".").reduce((obj: any, key: string) => obj?.[key], scope);

                        if (value !== undefined) {
                            // 驼峰转短横：primaryColor -> --primary-color
                            const cssVarName = `--${name.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()}`;
                            el.style.setProperty(cssVarName, toCssValue(value));
                        }
                    }
                } catch (e) {
                    // 忽略错误（可能在组件卸载时触发）
                }
            };

            // 初始设置
            updateVars();

            // 响应式追踪
            const effectCleanup = effect(updateVars);

            // 清理
            cleanup(() => {
                effectCleanup?.();
            });
        },
    );
}

/**
 * 将 JavaScript 值转换为 CSS 值
 * @param value - JavaScript 值
 * @returns CSS 值字符串
 */
function toCssValue(value: unknown): string {
    if (typeof value === "number") {
        return `${value}px`;
    }
    if (typeof value === "string") {
        return value;
    }
    if (value === null || value === undefined) {
        return "";
    }
    return String(value);
}

/**
 * 导出默认注册函数
 */
export default function install(Alpine: Alpine): void {
    registerCssVarDirective(Alpine);
}
