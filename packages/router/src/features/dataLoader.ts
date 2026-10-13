/**
 * Loader 特性 - 数据加载系统
 *
 * 提供本地数据和远程数据的加载能力
 * 支持多种数据格式：JSON、对象、动态函数、远程 URL
 *
 * @module features/dataLoader
 */

import type { AutoSparkRouter } from "@/router";
import type { AutoSparkMatchedRouteItem } from "@/types/routes";
import type { AutoSparkRouteDataOptions } from "@/types/data";
import { asyncSignal, type IAsyncSignal } from "asyncsignal";
import { getRouteVars } from "@/utils/getRouteVars";
import { prefixBaseUrl } from "@/utils/prefixBaseUrl";
import { getSignalHash } from "@/utils/getSignalHash";
import { getJsonFileFromUrl } from "@/utils/getJsonFileFromUrl";
import { isPlainObject } from "es-toolkit/predicate";
import { isFunction } from "flex-tools/typecheck/isFunction";
import { isUrlSource } from "@/utils/isUrlSource";
import type { ViewRenderOptions } from "@/renderers/types";
import { AutoSparkRouterLoadError } from "@/errors";
import { AsyncLoader, type IAsyncLoader } from "asyncsignal/loader";

/**
 * DataLoader 元数据类型
 * AsyncLoader 的 meta 泛型参数，提供类型安全的元数据访问
 */
export interface DataLoaderMeta {
    /** 路由哈希值，用于缓存键 */
    hash: string;
    /** 数据加载 URL（远程加载时设置） */
    url?: string;
    /** HTTP 状态码（加载失败时设置） */
    statusCode?: number;
}

/**
 * 缓存项基础结构
 * 存储的是 {@link CacheItem}（`{ value, timestamp }`），由 AsyncLoader 的 storage 读写
 */
interface CacheItem<T> extends CacheItemBase {
    value: T;
    timestamp: number;
}

interface CacheItemBase {
    value: any;
    timestamp: number;
}

/**
 * DataLoader 类 - 负责加载路由数据
 * 不继承任何基类，独立实现所有功能
 */
export class DataLoader {
    // ========================================
    // 公共属性
    // ========================================

    router: AutoSparkRouter;

    // ========================================
    // 私有属性
    // ========================================

    private cache: Map<string, CacheItem<any>> = new Map();
    private options: Required<Omit<AutoSparkRouteDataOptions, "from">>;

    // ========================================
    // 构造函数
    // ========================================

    constructor(router: AutoSparkRouter) {
        this.router = router;
        this.options = Object.assign(
            {
                timeout: 0,
                cache: 0,
                hash: "{path}",
            },
            router.options.dataOptions || {},
        ) as Required<Omit<AutoSparkRouteDataOptions, "from">>;
    }

    // ========================================
    // AsyncLoader 管理
    // ========================================

    /**
     * 获取路由的 AsyncLoader 实例
     * 提供类型安全的访问方式
     */
    public getLoader(matched: AutoSparkMatchedRouteItem): AsyncLoader<any, DataLoaderMeta> | undefined {
        return (matched.route as any)._getData as AsyncLoader<any, DataLoaderMeta>;
    }

    /**
     * 获取路由的数据加载信号（兼容性方法）
     * 用于需要直接访问 signal 的场景
     */
    public getSignal(matched: AutoSparkMatchedRouteItem): IAsyncSignal | undefined {
        const loader = this.getLoader(matched);
        return loader?.signal;
    }

    /**
     * 为单个路由创建 AsyncLoader 实例
     */
    private _createLoader(
        matched: AutoSparkMatchedRouteItem,
        options: AutoSparkRouteDataOptions,
        navSignal?: AbortSignal,
    ): AsyncLoader<any, DataLoaderMeta> {
        const loaderFn = this._createLoaderFn(matched, options);
        const loader = new AsyncLoader<any, DataLoaderMeta>(loaderFn, {
            hash: matched.hash, // 直接使用 matched route 的 hash
            // meta 与 `args.meta` 共享同一引用：加载函数写入的状态码在外部可读
            meta: { hash: matched.hash },
            cache: options.cache,
            timeout: options.timeout,
            retry: options.retry,
            retryDelay: options.retryDelay,
            multiplex: options.multiplex,
            defaultValue: options.default,
            abortSignal: navSignal,
            storage: this.cache,
        });

        // 存储 AsyncLoader 实例（关键设计变更）
        (matched.route as any)._getData = loader;
        return loader;
    }

    /**
     * 创建加载器函数，适配 AsyncLoader 的 IAsyncLoader 接口。
     *
     * 数据校验在加载函数内完成——必须落在 AsyncLoader 的 signal.resolve 之前：
     * 信号一旦落定不可重写（只读结果由渲染层序列化，见 features/render 的 _loadSignal）。
     * `$params/$query/$state` 由渲染层在序列化时叠加，此处只交给路由自身数据。
     */
    private _createLoaderFn(
        matched: AutoSparkMatchedRouteItem,
        options: AutoSparkRouteDataOptions,
    ): IAsyncLoader {
        return async ({ abortSignal, meta }) => {
            const dataSource = options.from;

            // 静态数据
            if (isPlainObject(dataSource) && !isUrlSource(dataSource)) {
                return this._validateData(dataSource);
            }

            // URL 数据
            if (isUrlSource(dataSource) || dataSource === true) {
                const url =
                    dataSource === true ? this._getAutoUrl(matched) : (dataSource as string);

                if (!url) {
                    throw new AutoSparkRouterLoadError("No valid URL found");
                }

                const finalUrl = prefixBaseUrl(
                    url.params(getRouteVars(matched)),
                    this.router.options.base,
                );
                meta.url = finalUrl;

                const response = await fetch(finalUrl, {
                    signal: abortSignal,
                });

                if (!response.ok) {
                    // HTTP 状态码进 meta（DataLoaderMeta.statusCode），供错误页/调试读取
                    meta.statusCode = response.status;
                    throw new AutoSparkRouterLoadError(
                        `Failed to load ${finalUrl} : ${response.statusText}`,
                        response.status,
                    );
                }

                return this._validateData(await response.json());
            }

            // 函数数据
            if (isFunction(dataSource)) {
                return this._validateData(await dataSource(matched));
            }

            throw new AutoSparkRouterLoadError("Invalid data source");
        };
    }

    // ========================================
    // 路由选项管理
    // ========================================

    /**
     * 获取路由的数据配置选项
     */
    private _getRouteOptions(matched: AutoSparkMatchedRouteItem): Required<AutoSparkRouteDataOptions> {
        if (!(matched.route as any)._dataOptions) {
            (matched.route as any)._dataOptions = this._mergeRouteOptions(matched) as any;
        }
        return (matched.route as any)._dataOptions as unknown as Required<AutoSparkRouteDataOptions>;
    }

    /**
     * 合并路由配置
     */
    private _mergeRouteOptions(matched: AutoSparkMatchedRouteItem): Required<AutoSparkRouteDataOptions> {
        const dataSource = (matched.route as any).data || {};
        const isSourceOptions = isPlainObject(dataSource) && "from" in dataSource;
        return {
            ...this.options,
            ...(isSourceOptions ? dataSource : { from: dataSource }),
        } as Required<AutoSparkRouteDataOptions>;
    }

    // ========================================
    // 路由加载
    // ========================================

    /**
     * 并发加载多个路由的数据
     * @param routes - 匹配的路由数组
     * @param navSignal - 导航级别的中止信号
     */
    public loadRoutes(
        routes: AutoSparkMatchedRouteItem[],
        navSignal?: AbortSignal,
    ): Promise<PromiseSettledResult<void>[]> {
        return Promise.allSettled(routes.map((matched) => this._loadRoute(matched, navSignal)));
    }

    /**
     * 加载单个路由的数据
     * @param matched - 匹配的路由项
     * @param navSignal - 导航级别的中止信号
     */
    private async _loadRoute(matched: AutoSparkMatchedRouteItem, navSignal?: AbortSignal): Promise<void> {
        if (!matched.route?.data) return;

        const options = this._getRouteOptions(matched);

        try {
            // 创建 AsyncLoader 并触发加载
            const loader = this._createLoader(matched, options, navSignal);

            // 触发加载（AsyncLoader 内部处理缓存、超时、重试）
            await loader.get();
        } catch (e: any) {
            // AbortError 通常是由于用户导航取消导致的，无需处理
            if (e.name !== "AbortError") {
                this.router.logger.error(
                    `DataLoader: Failed to load data for route ${matched.path}`,
                    () => [e],
                );
            }
        }
    }

    // ========================================
    // 响应处理（已由 AsyncLoader 内置处理）
    // ========================================

    /**
     * 获取缓存键（保留用于其他场景）
     */
    private _getHash(matched: AutoSparkMatchedRouteItem, options: AutoSparkRouteDataOptions): string {
        if (options.hash) {
            return getSignalHash(options.hash, matched);
        }
        return getSignalHash("{path}", matched);
    }

    // ========================================
    // 数据验证
    // ========================================

    /**
     * 检查是否是合法的数据对象（必须是纯对象）
     */
    private _isValidData(data: any): boolean {
        return isPlainObject(data);
    }

    /**
     * 数据校验：路由数据须为纯对象（数组/标量视为无效）
     *
     * 无效时抛 AutoSparkRouterLoadError，由 AsyncLoader 落为 reject
     */
    private _validateData(data: any): Record<string, any> {
        if (!this._isValidData(data)) {
            throw new AutoSparkRouterLoadError(
                "Invalid data format: expected plain object",
            );
        }
        return data;
    }

    // ========================================
    // 自动URL生成
    // ========================================

    /**
     * 当 data=true 时，自动生成数据URL
     */
    private _getAutoUrl(matched: AutoSparkMatchedRouteItem): string | undefined {
        if (matched.route) {
            const viewSrc = matched.route.view;
            const viewUrl = typeof viewSrc === "function" ? viewSrc(matched) : viewSrc;
            if (typeof viewUrl === "string") {
                return getJsonFileFromUrl(viewUrl);
            }
        }
        return undefined;
    }

    /**
     * 并发加载匹配路由的数据（公共 API）
     * @param routes - 匹配的路由数组
     * @param navSignal - 导航级别的中止信号
     */
    async loadDatas(routes: AutoSparkMatchedRouteItem[], navSignal?: AbortSignal) {
        return this.loadRoutes(routes, navSignal);
    }

    // ========================================
    // 便利方法（AsyncLoader 操作）
    // ========================================

    /**
     * 使指定路由的数据缓存失效
     */
    public invalidateRoute(matched: AutoSparkMatchedRouteItem): void {
        const loader = this.getLoader(matched);
        loader?.invalidate();
    }

    /**
     * 强制重新加载指定路由的数据
     */
    public async refreshRoute(matched: AutoSparkMatchedRouteItem): Promise<any> {
        const loader = this.getLoader(matched);
        if (!loader) {
            throw new Error("No loader found for this route");
        }
        return await loader.refresh();
    }

    /**
     * 中止指定路由的数据加载
     */
    public abortRoute(matched: AutoSparkMatchedRouteItem): void {
        const loader = this.getLoader(matched);
        loader?.abort();
    }

    /**
     * 检查路由数据是否正在加载
     */
    public isLoading(matched: AutoSparkMatchedRouteItem): boolean {
        const loader = this.getLoader(matched);
        return loader?.loading || false;
    }

    /**
     * 清理资源
     */
    public cleanup(): void {
        this.cache.clear();
    }
}
