/**
 * 纯信号型内置 action 表（ADR-0036 决策 7）——yes / no / cancel / close。
 *
 * handle 为参数透传（`close(1)` → resolved 广播 `result:1`）：价值不在执行体而在**广播语义**
 * ——模板任意元素 `@click="close"` 触发，祖先监听 `action:close` DOM 冒泡事件（或总线
 * `actions/close/*`）即可驱动关闭对话框/确认/取消等通用交互；透传首参让信号可携带载荷
 * （如 `close("cancel-icon")`、`yes(formData)`），监听方从 `detail.result` 读取。
 * 值 = 展示标题（value=title 供 UI 消费，x-loading 按钮文案等）。
 */
export const SIGNAL_ACTIONS: Record<string, string> = {
    yes: "确认",
    no: "否",
    cancel: "取消",
    close: "关闭",
};
