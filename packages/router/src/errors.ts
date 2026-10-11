import type { KylinMatchedRouteItem } from "./types";

export class KylinRouterError extends Error {
    status: number = 0;
    route?: KylinMatchedRouteItem[];
    constructor(message?: string, status?: number, route?: KylinMatchedRouteItem[]) {
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
export class KylinRouteError extends Error {
    route?: KylinMatchedRouteItem;
    constructor(message: string, route?: KylinMatchedRouteItem) {
        super(message);
        this.route = route;
    }
}
/**
 * 当调用matchRoutes时如果被重定向到外部时，触发发错误
 */
export class KylinExternalRouteError extends Error {
    target: "_self" | "_blank" = "_self";
    url?: string; // 外部链接地址
    name = "KylinExternalRouteError";
    constructor(url: string, target: "_self" | "_blank" = "_self") {
        super(`External redirect: ${url}`);
        this.url = url;
        this.target = target;
    }
}

/**
 * 重定向目标未找到错误
 */
export class KylinNotFoundRouteError extends KylinRouteError {
    target: string;
    constructor(target: string, route: KylinMatchedRouteItem) {
        super(`Redirect target not found: ${target}`, route);
        this.name = "KylinNotFoundRouteError";
        this.target = target;
    }
}

/**
 * 最大重定向次数超出错误
 */
export class KylinMaxRedirectRouteError extends KylinRouteError {
    constructor(route: KylinMatchedRouteItem) {
        const chainStr = route.redirectFrom?.map((item) => item.url).join(" -> ");
        super(`Maximum redirect limit exceeded:${chainStr} -> ...`, route);
    }
}

/**
 * 重定向循环检测错误
 */
export class KylinLoopRouteError extends KylinRouteError {
    constructor(route: KylinMatchedRouteItem) {
        const chainStr = route.redirectFrom?.map((item) => item.url).join(" -> ");
        super(`Redirect loop detected: ${chainStr} -> ${chainStr}`, route);
    }
}

export class KylinRouterLoadError extends KylinRouterError {}
export class KylinRouterTimeoutError extends KylinRouterError {}
export class KylinRouterInvalidDataError extends KylinRouterError {}
