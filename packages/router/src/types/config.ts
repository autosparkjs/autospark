/**
 * 路由器配置相关类型定义
 */

import type { KylinRoutes, KylinRouteItem, KylinMatchedRouteItem } from "./routes";
import type { TemplateResult } from "lit";
import type { KylinRouteViewOptions } from "./routes";
import type { KylinRouteDataOptions } from "./data";
import type { AfterRenderHook, AfterRouteHook, BeforeRenderHook, BeforeRouteHook } from "./hooks";
import type { KylinRouterLogger } from "@/logger";
import type { KylinRouterViewRendererBase } from "@/renderers/base";

/**
 * 错误页面处理函数类型
 * @param error - 错误对象，可能包含 status/statusCode 属性
 * @param route - 当前匹配的路由项数组
 * @returns 错误页面的 HTMLElement
 */
export type ErrorPageHandler = (error: any, route: KylinMatchedRouteItem[]) => HTMLElement;

/**
 * 错误页面配置类型
 * - HTMLElement: 直接使用该元素作为错误页面
 * - ErrorPageHandler: 动态生成错误页面的函数
 */
export type ErrorPageSource = HTMLElement | ErrorPageHandler;

/**
 * 重试策略配置
 */
export interface RetryOptions {
    /** 最大重试次数（默认 3） */
    max?: number;
    /** 重试延迟，单位毫秒（默认 1000） */
    delay?: number;
    /** 退避策略：'linear' 线性增长，'exponential' 指数增长（默认 linear） */
    backoff?: "linear" | "exponential";
    /** 重试回调函数，每次重试时调用 */
    onRetry?: (attempt: number, error: Error) => void;
}

/**
 * 错误边界配置
 */
export interface ErrorBoundaryOptions {
    /** 错误组件：字符串路径或动态导入函数 */
    component?: string | (() => Promise<any>);
    /** 回退 UI：错误时显示的 HTML 字符串 */
    fallback?: string;
    /** 错误回调函数 */
    onError?: (error: Error, errorInfo: any) => void;
    /** 是否重试：true 表示使用默认重试策略，对象表示自定义重试策略 */
    retry?: boolean | RetryOptions;
}

/**
 * 加载状态配置
 */
export interface LoadingOptions {
    /** 自定义加载模板 */
    template?: TemplateResult | string;
    /** 加载超时时间，单位毫秒 */
    timeout?: number;
    /** 错误时是否显示加载状态（默认 false） */
    showOnError?: boolean;
}

/**
 * 路由器配置选项
 */
export type KylinRouterOptions = {
    /** 路由模式：'history' 使用 BrowserHistory，'hash' 使用 HashHistory（默认 'history'） */
    mode?: "hash" | "history";
    /** 基础路径，用于 Hash 模式（默认 ''） */
    base?: string;
    /** 路由配置 */
    routes: KylinRoutes;
    /**
     * 错误页面配置
     *
     * 支持按错误状态码配置不同的错误页面：
     * - '404': 未匹配路由时的页面
     * - '500': 服务器错误页面
     * - '*': 通用错误页面（兜底，当找不到对应状态码时使用）
     *
     * 每个错误页可以是 HTMLElement 或返回 HTMLElement 的函数
     *
     * @example
     * ```ts
     * errorPages: {
     *   '404': (error, route) => {
     *     const el = document.createElement('kylin-feedback');
     *     el.type = 'error';
     *     el.message = '404 - 页面未找到';
     *     return el;
     *   },
     *   '500': document.createElement('div'), // 直接使用元素
     *   '*': createDefaultErrorPage()        // 通用兜底
     * }
     * ```
     */
    errorPages?: Partial<Record<string, ErrorPageSource>>;
    /** 起始路径 */
    home?: string;
    /** 是否启用调试模式，启用后会输出详细的导航日志（默认 false） */
    debug?: boolean;
    /** 宿主元素或选择器字符串（可选，用于 attach 方法） */
    host?: HTMLElement | string;
    /** 全局错误组件：字符串路径或动态导入函数 */
    defaultErrorComponent?: string | (() => Promise<any>);
    /** 日志记录器配置 */
    logger?: KylinRouterLogger;
    /** 全局视图加载配置 */
    viewOptions?: Omit<KylinRouteViewOptions, "from">;
    /** 全局数据加载配置 */
    dataOptions?: Omit<KylinRouteDataOptions, "from">;
    /**
     * 全局路由参数配置
     * KylinRouteItem中的配置项可以覆盖全局配置
     */
    routeOptions?: Partial<Pick<KylinRouteItem, "cache" | "keepAlive" | "preload" | "timeout">>;
    /**
     * Alpine.js 全局 store 初始数据
     **/
    data?: Record<string, any>;
    /**
     * 钩子函数配置
     */
    hookOptions?: {
        timeout?: number;
    };
    /**
     * 路由导航后的钩子函数
     * 可以是函数或函数数组
     */
    beforeRoute?: BeforeRouteHook | BeforeRouteHook[];
    afterRoute?: AfterRouteHook | AfterRouteHook[];
    beforeRender?: BeforeRenderHook | BeforeRenderHook[];
    afterRender?: AfterRenderHook | AfterRenderHook[];

    /**
     * 注册视图渲染器
     *
     * 在加载视图时会依次执行test方法，如果true则使用方渲染器
     * 所以渲染器的注册顺序比较重要
     */
    renderers?: KylinRouterViewRendererBase[];
};
