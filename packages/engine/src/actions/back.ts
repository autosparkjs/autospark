/**
 * back：自带执行体的内置 action（ADR-0065）——点击即 `history.back()`（SSR 守卫静默），
 * 内置 error 组件的返回按钮依赖，非纯信号。
 */
export const backAction = {
    title: "返回",
    handle: () => {
        if (typeof history !== "undefined") history.back();
    },
};
