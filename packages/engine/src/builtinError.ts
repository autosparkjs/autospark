/**
 * 内置 error 组件（ADR-0065）：engine 初始化注册进 `options.components` 的默认错误呈现组件。
 *
 * 与 loading 的「约定名 + CSS 兜底」模式不同，error **真内置**（自带完整默认 UI）——loader
 * 失败的缺省呈现，亦可 `x-component:error` 显式实例化渲染任意错误。用户同名 `x-define` /
 * `options.components.error` 声明经组件查找链顺序**天然覆盖**内置（构造入参展开在后、局部
 * x-define 沿链遮蔽，均无需特判）。
 *
 * props 契约（经 initialData 注入组件 data 域）：
 * - `error: Error` —— 原始错误对象；`message: string` —— 引擎生成的友好文案；
 * - `icon?: string` —— 图标名称（x-icon 渲染，未注册 miss 走默认图标；未传时 x-show 隐藏）；
 * - `hasRetry? / hasClose? / hasBack?` —— **布尔显隐键**（`undefined` 不渲染对应按钮）；执行体走
 *   **action 通道**（loader 场景注入实例 scope.actions；`back` 天然命中内置 action）——**函数值
 *   不得入响应式 data 域**（autostore 视为 computed，依赖收集时执行——无限循环，实测抓栈证实）；
 *   `retry`/`close` 由 loader 场景注入（重新 fetch / 清除本实例 error + 广播 close 信号），
 *   `back` 走内置 action（`history.back()`，ADR-0065 决策八），按钮点击经 x-on 的
 *   「Action 优先 + 表达式兜底」双轨触达（闭包在 data 域，表达式求值即调用）。
 *
 * 样式经 `ensureErrorStyle` 幂等注入 `<style id="autospark-error">`（document 级资产，
 * engine.destroy 不清理，与 icons 同纪律）。
 */

/** 内置 error 组件模板（全局组件字符串形态；单根，自动包装规则尊重已有 x-define） */
export const BUILTIN_ERROR_COMPONENT = `<div x-define="error" class="as-error">
    <span class="as-error-icon" x-show="icon" x-icon="icon"></span>
    <div class="as-error-message">{{ message }}</div>
    <div class="as-error-actions">
        <button type="button" class="as-error-btn" x-show="hasRetry" @click="retry">重试</button>
        <button type="button" class="as-error-btn" x-show="hasClose" @click="close">关闭</button>
        <button type="button" class="as-error-btn" x-show="hasBack" @click="back">返回</button>
    </div>
</div>`;

/** 样式表 id（document 级共享） */
const ERROR_STYLE_ID = "autospark-error";

/** 样式是否已注入（模块级防重，多 engine 共享 document） */
let styleInjected = false;

/**
 * 幂等注入内置 error 组件样式（engine 构造器调用——组件注册即注入，体积小无需惰性）。
 * SSR 无 document 时静默跳过。
 */
export function ensureErrorStyle(): void {
    if (styleInjected) return;
    if (typeof document === "undefined") return;
    if (document.getElementById(ERROR_STYLE_ID)) {
        styleInjected = true;
        return;
    }
    const style = document.createElement("style");
    style.id = ERROR_STYLE_ID;
    style.textContent = `
.as-error { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 24px; color: #888; font-size: 14px; }
.as-error-icon { display: inline-flex; width: 28px; height: 28px; color: #c0c4cc; }
.as-error-message { text-align: center; line-height: 1.5; word-break: break-word; }
.as-error-actions { display: flex; gap: 8px; margin-top: 4px; }
.as-error-btn { padding: 4px 16px; border: 1px solid #dcdfe6; border-radius: 6px; background: #fff; color: #606266; font-size: 13px; cursor: pointer; transition: all 0.15s; }
.as-error-btn:hover { border-color: #c0c4cc; color: #409eff; }
`;
    document.head.appendChild(style);
    styleInjected = true;
}
