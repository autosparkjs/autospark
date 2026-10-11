import type { ErrorPageHandler, KylinMatchedRouteItem } from "@/types";

/**
 * 默认的通用错误页面处理器（兜底）
 */

export const DefaultErrorPage: ErrorPageHandler = (
    error: any,
    route: KylinMatchedRouteItem[],
): HTMLElement => {
    const statusCode = error?.status || error?.statusCode || 500;
    const message = error?.message || "未知错误";

    const el = document.createElement("kylin-feedback");
    el.type = "error";
    el.message = String(statusCode);
    el.description = message;
    el.retryable = true;
    el.backable = true;
    return el;
};
