import type { ErrorPageHandler, AutoSparkMatchedRouteItem } from "@/types";

/**
 * 默认的 404 错误页面处理器
 * 使用 autospark-feedback 组件显示
 */

export const NotFoundPage: ErrorPageHandler = (
    error: any,
    route: AutoSparkMatchedRouteItem[],
): HTMLElement => {
    const el = document.createElement("autospark-feedback");
    el.type = "error";
    el.message = "404";
    el.description = "页面未找到，请检查 URL 是否正确";
    el.backable = true;
    return el;
};
