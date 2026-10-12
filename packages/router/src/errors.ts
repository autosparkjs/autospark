import type { AutoSparkMatchedRouteItem } from "./types";

export class AutoSparkRouterError extends Error {
    status: number = 0;
    route?: AutoSparkMatchedRouteItem[];
    constructor(message?: string, status?: number, route?: AutoSparkMatchedRouteItem[]) {
        super(message);
        this.status = status || 0;
        this.route = route;
    }
}

// ============================================================================
// 路由匹配错误类型
// ============================================================================

/**
 * 路由匹配错误基类
 */
export class AutoSparkRouteError extends Error {
    route?: AutoSparkMatchedRouteItem;
    constructor(message: string, route?: AutoSparkMatchedRouteItem) {
        super(message);
        this.route = route;
    }
}
/**
 * 当调用matchRoutes时如果被重定向到外部时，触发发错误
 */
export class AutoSparkExternalRouteError extends Error {
    target: "_self" | "_blank" = "_self";
    url?: string; // 外部链接地址
    name = "AutoSparkExternalRouteError";
    constructor(url: string, target: "_self" | "_blank" = "_self") {
        super(`External redirect: ${url}`);
        this.url = url;
        this.target = target;
    }
}

/**
 * 重定向目标未找到错误
 */
export class AutoSparkNotFoundRouteError extends AutoSparkRouteError {
    target: string;
    constructor(target: string, route: AutoSparkMatchedRouteItem) {
        super(`Redirect target not found: ${target}`, route);
        this.name = "AutoSparkNotFoundRouteError";
        this.target = target;
    }
}

/**
 * 最大重定向次数超出错误
 */
export class AutoSparkMaxRedirectRouteError extends AutoSparkRouteError {
    constructor(route: AutoSparkMatchedRouteItem) {
        const chainStr = route.redirectFrom?.map((item) => item.url).join(" -> ");
        super(`Maximum redirect limit exceeded:${chainStr} -> ...`, route);
    }
}

/**
 * 重定向循环检测错误
 */
export class AutoSparkLoopRouteError extends AutoSparkRouteError {
    constructor(route: AutoSparkMatchedRouteItem) {
        const chainStr = route.redirectFrom?.map((item) => item.url).join(" -> ");
        super(`Redirect loop detected: ${chainStr} -> ${chainStr}`, route);
    }
}

export class AutoSparkRouterLoadError extends AutoSparkRouterError {}
export class AutoSparkRouterTimeoutError extends AutoSparkRouterError {}
export class AutoSparkRouterInvalidDataError extends AutoSparkRouterError {}
