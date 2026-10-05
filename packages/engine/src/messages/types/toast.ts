/**
 * toast type 组件（ADR-0089）：纯继承 base——零覆盖段、零自有 methods（瞬时提示无专属行为，
 * ADR-0083 沿用）。存在意义：用户同名覆盖 `autospark.messages.toast` 的 per-type 定制点
 * （免 types 配置）；渲染与公共行为全由 base 族根下渗。
 */
export const TOAST_TEMPLATE = `<div x-define="autospark.messages.toast" x-define:inherit="autospark.messages.base"></div>`;

/** toast 种子默认：无（width auto 跟内容；persist 沿全局默认 0 = 隐藏即删的 toast 语义） */
export const TOAST_DEFAULTS: Record<string, any> = {};
