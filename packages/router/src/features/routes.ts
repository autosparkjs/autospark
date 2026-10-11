/**
 * 路由表管理功能
 *
 * 负责：
 * - 路由表初始化和规范化
 * - 动态路由注册（addRoute/removeRoute）
 * - 远程路由表加载（loadRemoteRoutes）
 * - 路由匹配和参数提取
 */

import type { KylinRouter } from "@/router";
import type { KylinRouteItem, KylinMatchedRouteItem } from "@/types";

import { matchRoute } from "@/utils/matchRoute";
import { normalizeRoutes } from "@/utils/normalizeRoutes";

/** 导航回调函数类型 */
export interface NavigationCallbacks {
    push: (path: string) => void;
    getLocation: () => { pathname: string; search: string };
    setIsNavigating: (value: boolean) => void;
}

export class KylinRouteTable {
    /** 根路由 - 规范化后的路由树根节点 */
    root: KylinRouteItem = normalizeRoutes();
    /** 当前路由状态 */
    public current?: KylinMatchedRouteItem[];
    /**
     * 用于缓存命名路由项，方便通过name进行快速重定向或路由
     *
     * 注意： name必须是全局唯一，重复命名只会记住一个
     *
     */
    namedRouteItems?: Map<string, WeakRef<KylinRouteItem>>;
    router: KylinRouter;
    constructor(router: KylinRouter) {
        this.router = router;
    }

    /**
     * 加载路由表
     *
     */
    async load(): Promise<void> {
        const routeArgs = this.router.options.routes || [];
        const toArray = async (arg: any): Promise<KylinRouteItem[]> => {
            if (typeof arg === "function") {
                arg = await arg();
            } else if (typeof arg === "string") {
                arg = await fetch(arg).then((res) => res.json());
            }
            return Array.isArray(arg) ? arg : [arg];
        };
        const routesArray = await toArray(routeArgs);
        // 规范化路由结构
        this.root = normalizeRoutes(routesArray);
        // 处理选项继承
        this._applyRouteOptions(this.root);
        this.router.emit("routes:loaded", undefined);
    }

    /**
     * 匹配路径并返回匹配结果
     * @param pathname - 要匹配的路径
     * @returns 匹配结果或 null
     */
    public match(pathname: string): ReturnType<typeof matchRoute> {
        return matchRoute(pathname, this.root) || null;
    }

    /**
     * 规范化路由配置
     * 将全局配置应用到路由选项
     */
    private _applyRouteOptions(route: KylinRouteItem): void {
        const overrideItems = ["keepAlive", "cache", "timeout", "preload"];
        const processRoute = (r: KylinRouteItem) => {
            // 缓存命名路由项
            if (r.name && r.name.length > 0) {
                if (!this.namedRouteItems) {
                    this.namedRouteItems = new Map();
                }
                this.namedRouteItems!.set(r.name, new WeakRef(r));
            }
            if (this.router.options.routeOptions) {
                const routeOptions = this.router.options.routeOptions;
                overrideItems.forEach((item) => {
                    // @ts-ignore
                    if (r[item] !== undefined && routeOptions[item] !== undefined) {
                        // @ts-ignore
                        r[item] = routeOptions[item];
                    }
                });
            }
            // 递归处理子路由
            if (r.children) {
                r.children.forEach(processRoute);
            }
        };
        processRoute(route);
    }
    /**
     * 从根节点开始遍历路由表
     * @param callback
     */
    forEach(callback: (route: KylinRouteItem, parent: KylinRouteItem | null) => void): void {
        function forEachRoute(route: KylinRouteItem, parent: KylinRouteItem | null): void {
            callback(route, parent);
            if (route.children) {
                route.children.forEach((child) => forEachRoute(child, route));
            }
        }
        forEachRoute(this.root, null);
    }
}
