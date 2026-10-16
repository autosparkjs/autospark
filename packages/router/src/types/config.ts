/**
 * 路由器配置相关类型定义
 */

import type { AutoSparkRoutes, AutoSparkRouteItem, AutoSparkMatchedRouteItem } from "./routes";
import type { AutoSparkRouteViewOptions } from "./routes";
import type { AutoSpark } from "autospark";
import type { AutoSparkRouteDataOptions } from "./data";
import type { AfterRenderHook, AfterRouteHook, BeforeRenderHook, BeforeRouteHook } from "./hooks";
import type { AutoSparkRouterLogger } from "@/logger";
import type { AutoSparkRouterViewRendererBase } from "@/renderers/base";

/**
 * 错误页面处理函数类型
 * @param error - 错误对象，可能包含 status/statusCode 属性
 * @param route - 当前匹配的路由项数组
 * @returns 错误页面的 HTMLElement
 */
export type ErrorPageHandler = (error: any, route: AutoSparkMatchedRouteItem[]) => HTMLElement;

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
    /** 自定义加载模板（HTML 字符串） */
    template?: string;
    /** 加载超时时间，单位毫秒 */
    timeout?: number;
    /** 错误时是否显示加载状态（默认 false） */
    showOnError?: boolean;
}

/**
 * SEO `<head>` 管理配置
 *
 * 由 `AutoSparkRouterOptions.head` 承载，缺省（不声明或声明为空对象）即**开启**，
 * 传 `false` 整体关闭（router 不再读写 `<head>`）。
 *
 * 路由侧的声明是纯约定：`route.title` + `route.meta` 的固定键
 * （`title` / `description` / `canonical` / `robots` / `og` / `jsonLd` / `seo`），
 * 视图侧用 `<autospark-view-meta>` 同名属性覆盖。
 */
export type HeadConfigOptions = {
    /**
     * 站点绝对地址（如 `https://example.com`）
     *
     * 用于把相对形式的 `canonical` / `og:url` 解析为绝对地址；不声明时相对地址原样
     * 输出（浏览器与 Google 会按文档地址解析）。
     */
    siteUrl?: string;
    /**
     * 标题模板，`%s` 会被替换为最终标题（如 `"%s - 麒麟商店"`）
     *
     * 模板不含 `%s` 时退化为 `"{标题} - {模板}"`。
     */
    titleTemplate?: string;
};

/**
 * 路由器配置选项
 */
export type AutoSparkRouterOptions = {
    /** 路由模式：'history' 使用 BrowserHistory，'hash' 使用 HashHistory（默认 'history'） */
    mode?: "hash" | "history";
    /**
     * 注入的 AutoSpark engine 实例（混合所有权，ADR-0002）
     *
     * - 提供时 router 纯消费该实例（生命周期归应用所有，detach 不销毁）；
     *   应用的静态模板此时已编译完成，x-outlet 简写不再生效（请书写
     *   `<div x-component:autospark.outlet>` 完整形态；远程模板中的 x-outlet 不受影响）。
     * - 缺省时 router 在 attach 时自建 engine（host 首编译激活 x-outlet），
     *   并在 detach 时销毁。
     *
     * 运行时契约：HTML 先加载 AutoSpark.js（全局 AutoSparkSpaces）再加载 router。
     */
    engine?: AutoSpark;
    /** 基础路径，用于 Hash 模式（默认 ''） */
    base?: string;
    /** 路由配置 */
    routes: AutoSparkRoutes;
    /**
     * 约定子表的默认文件名（ADR-0007）
     *
     * `children: true` 与自动发现（ADR-0010）的解析地址均为此文件名，默认 `"routes.json"`
     */
    routesFile?: string;
    /**
     * 远程子表的最大展开深度（ADR-0007），默认 10
     *
     * 触顶时该节点降级为无子路由并落 error 状态。用于界定循环引用（子表的子项又指回祖先，
     * 其地址因拼祖先路径而无限增长）的最坏情况——本包不做循环检测，仅以此兜底
     */
    maxChildrenDepth?: number;
    /**
     * 路由表自动发现（ADR-0010）
     *
     * `true` 时路由表遍历中对每个未声明 `children` 且非重定向的节点，按约定探测
     * `{累积路径}/{routesFile}`（默认 `routes.json`）的远程子表；显式 `children: []`
     * 视为声明无子路由（单节点 opt-out）。探测为投机性请求：404 与「200 但非 JSON」
     * （SPA 托管 index fallback）按阴性结果静默落定（仅 logger.debug），网络错误/5xx
     * 仍降级并发 `routes:error`；缓存成功与阴性结果，不缓存其他失败。
     *
     * 默认 `false`——关闭时行为与未引入本选项完全一致。
     */
    autoDiscoverRoutes?: boolean;
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
     *     const el = document.createElement('autospark-feedback');
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
    logger?: AutoSparkRouterLogger;
    /** 全局视图加载配置 */
    viewOptions?: Omit<AutoSparkRouteViewOptions, "from">;
    /** 全局数据加载配置 */
    dataOptions?: Omit<AutoSparkRouteDataOptions, "from">;
    /**
     * 全局路由参数配置
     * AutoSparkRouteItem中的配置项可以覆盖全局配置
     */
    routeOptions?: Partial<Pick<AutoSparkRouteItem, "cache" | "keepAlive" | "preload" | "timeout">>;
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
     * 所以渲染器的注册顺序比较重要。
     * 位于路由级显式 renderer 与模板兜底之间（ADR-0008 修订：
     * `!` 前缀强制 raw 优先于本列表）。
     */
    renderers?: AutoSparkRouterViewRendererBase[];

    /**
     * SEO `<head>` 管理（默认开启）
     *
     * - `false`：整体关闭，router 不再读写 `<head>`
     * - `{ siteUrl?, titleTemplate? }`：开启并配置站点地址 / 标题模板
     * - 不声明：以默认配置开启
     *
     * 单条路由可用 `meta: { seo: false }` 关闭该路由的 head 管理。
     *
     * @example
     * ```ts
     * head: { siteUrl: "https://example.com", titleTemplate: "%s - 示例站" }
     * ```
     */
    head?: false | HeadConfigOptions;
};
