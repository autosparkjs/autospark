import type { ErrorPageHandler, KylinMatchedRouteItem } from "@/types";

/**
 * 默认的 500 错误页面处理器
 */
export const ServiceErrorPage: ErrorPageHandler = (
    error: any,
    route: KylinMatchedRouteItem[],
): HTMLElement => {
    const el = document.createElement("kylin-feedback");
    el.type = "error";
    el.message = "500";
    el.description = error?.message || "服务器内部错误";
    el.retryable = true;
    el.backable = true;
    return el;
};
