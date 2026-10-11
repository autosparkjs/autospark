/**
 * 钩子系统相关类型定义
 */

import type { KylinRouter } from "@/router";
import type { KylinMatchedRouteItem } from "./routes";
import type { KylinRouteDataSource } from "./data";
import type { KylinRouterError } from "@/errors";

// ============================================================================
// 现有钩子类型（保留原有结构和功能）
// ============================================================================

/**
 * beforeEach 钩子函数类型
 * 在导航执行前执行，可以取消导航或重定向
 * @param to - 目标路由
 * @param from - 来源路由
 * @param next - 控制导航流程的回调函数
 * @param router - 路由器实例
 * @returns 可以返回 void 或 Promise<void>，通过 next 回调控制导航
 */
export type BeforeRouteHookArgs = {
    from: KylinMatchedRouteItem[] | undefined;
    to: KylinMatchedRouteItem[];
};
export type BeforeRouteHook = (
    args: BeforeRouteHookArgs,
) => boolean | string | Promise<boolean | string>;

/**
 * afterEach 钩子函数类型
 * 在导航完成后执行
 * @param to - 目标路由
 * @param from - 来源路由
 * @param router - 路由器实例
 * @returns 可以返回 void 或 Promise<void>
 */
export type AfterRouteHookArgs = {
    to: KylinMatchedRouteItem[];
};
export type AfterRouteHook = (args: AfterRouteHookArgs) => void | Promise<void>;

export type RouteErrorHookArgs = {
    error: KylinRouterError;
    to: KylinMatchedRouteItem[];
};
/**
 * 当路由发生错误时的钩子函数类型
 * @param args - 包含错误信息和目标路由的参数对象
 * @returns 可以返回 boolean 或 string 来控制错误处理流程，或者返回 Promise 以支持异步操作
 */
export type RouteErrorHook = (args: RouteErrorHookArgs) => void;

/**
 * renderEach 钩子函数类型
 * 在组件加载后、渲染前执行，用于数据预取
 * @param to - 目标路由
 * @param from - 来源路由
 * @param next - 控制钩子流程的回调函数，可以传递预加载的数据
 * @param router - 路由器实例
 * @returns 可以返回 void、Promise<void>、RouteData 或 Promise<RouteData>
 */
export type BeforeRenderHookArgs = {
    from: KylinMatchedRouteItem[];
    to: KylinMatchedRouteItem[];
    view: HTMLElement;
    data: KylinRouteDataSource | undefined;
};
export type BeforeRenderHook = (args: BeforeRenderHookArgs) => void | Promise<void>;

export type AfterRenderHookArgs = {
    from: KylinMatchedRouteItem[];
    to: KylinMatchedRouteItem[];
    el: HTMLElement | undefined;
};
export type AfterRenderHook = (args: AfterRenderHookArgs) => void | Promise<void>;

/**
 * 钩子集合对象类型
 * 包含所有可用的全局钩子数组
 */
export type KylinRouterHooks = {
    beforeRoute: BeforeRouteHook[];
    afterRoute: AfterRouteHook[];
    beforeRender: BeforeRenderHook[];
    afterRender: AfterRenderHook[];
    routeError: RouteErrorHook[];
};

// ============================================================================
// 从 types.ts 扩展的类型
// ============================================================================

/**
 * 通用钩子函数类型
 * 与 BeforeEachHook 类似但更通用，可用于各种钩子场景
 * @param to - 目标路由
 * @param from - 来源路由
 * @param next - 控制导航流程的回调函数
 * @returns 可以返回 void 或 Promise<void>，通过 next 回调控制导航
 *
 * @remarks
 */
export type IRouteHook = (
    from: KylinMatchedRouteItem[],
    to: KylinMatchedRouteItem[],
    next: (result?: boolean | string) => void,
    router: KylinRouter,
) => void | Promise<void>;

/**
 * 钩子类型的键
 * 用于索引访问 KylinRouterHooks 对象
 */
export type KylinRouterHookType = keyof KylinRouterHooks;
