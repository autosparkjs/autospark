/**
 * Loader 特性 - 数据加载系统
 *
 * 提供本地数据和远程数据的加载能力
 * 支持多种数据格式：JSON、对象、动态函数、远程 URL
 *
 * @module features/dataLoader
 */

import type { KylinRouter } from "@/router";
import type { KylinMatchedRouteItem } from "@/types/routes";
import type { KylinRouteDataOptions } from "@/types/data";
import { asyncSignal, type IAsyncSignal } from "asyncsignal";
import { getRouteVars } from "@/utils/getRouteVars";
import { prefixBaseUrl } from "@/utils/prefixBaseUrl";
import { getSignalHash } from "@/utils/getSignalHash";
import Alpine from "alpinejs";
import { getJsonFileFromUrl } from "@/utils/getJsonFileFromUrl";
import { cloneDeep } from "es-toolkit/object";
import { isPlainObject } from "es-toolkit/predicate";
import { isFunction } from "flex-tools/typecheck/isFunction";
import { isUrlSource } from "@/utils/isUrlSource";
import type { ViewRenderOptions } from "@/renderers/types";
import { KylinRouterLoadError, KylinRouterTimeoutError } from "@/errors";
import { AsyncLoader } from "asyncsignal";

/**
 * 远程加载结果类型
 */
type KylinRemoteLoadResult<T = any> = {
    value?: T;
    error?: Error | null;
    meta?: Record<string, any>;
};

/**
 * 缓存项基础结构
 * 存储的是 KylinRemoteLoadResult 格式：{ value: data, timestamp: number }
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

    router: KylinRouter;

    // ========================================
    // 私有属性
    // ========================================

    private cache: Map<string, CacheItem<any>> = new Map();
    private options: Required<Omit<KylinRouteDataOptions, "from">>;

    // ========================================
    // 构造函数
    // ========================================

    constructor(router: KylinRouter) {
        this.router = router;
        this.options = Object.assign(
            {
                timeout: 0,
                cache: 0,
                hash: "{path}",
            },
            router.options.dataOptions || {},
        ) as Required<Omit<KylinRouteDataOptions, "from">>;
    }

    // ========================================
    // 信号管理
    // ========================================

    /**
     * 获取路由当前正在使用的数据加载信号
     */
    private _getSignal(matched: KylinMatchedRouteItem): IAsyncSignal | undefined {
        return (matched.route as any)._getData as IAsyncSignal | undefined;
    }

    /**
     * 创建新的数据加载信号
     * 先 abort 旧 signal 避免并发问题
     */
    private _createSignal(
        matched: KylinMatchedRouteItem,
        options: KylinRouteDataOptions,
    ): IAsyncSignal {
        const oldSignal = this._getSignal(matched);
        if (oldSignal) {
            oldSignal.abort();
        }
        const signal = asyncSignal();
        (matched.route as any)._getData = signal;
        signal.meta.hash = this._getHash(matched, options);
        return signal;
    }

    /**
     * 移除路由的数据加载信号
     */
    private _removeSignal(matched: KylinMatchedRouteItem): void {
        if (matched.route) {
            delete (matched.route as any)._getData;
        }
    }

    // ========================================
    // 路由选项管理
    // ========================================

    /**
     * 获取路由的数据配置选项
     */
    private _getRouteOptions(matched: KylinMatchedRouteItem): Required<KylinRouteDataOptions> {
        if (!(matched.route as any)._dataOptions) {
            (matched.route as any)._dataOptions = this._mergeRouteOptions(matched) as any;
        }
        return (matched.route as any)._dataOptions as unknown as Required<KylinRouteDataOptions>;
    }

    /**
     * 合并路由配置
     */
    private _mergeRouteOptions(matched: KylinMatchedRouteItem): Required<KylinRouteDataOptions> {
        const dataSource = (matched.route as any).data || {};
        const isSourceOptions = isPlainObject(dataSource) && "from" in dataSource;
        return {
            ...this.options,
            ...(isSourceOptions ? dataSource : { from: dataSource }),
        } as Required<KylinRouteDataOptions>;
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
        routes: KylinMatchedRouteItem[],
        navSignal?: AbortSignal,
    ): Promise<PromiseSettledResult<void>[]> {
        return Promise.allSettled(routes.map((matched) => this._loadRoute(matched, navSignal)));
    }

    /**
     * 加载单个路由的数据
     * @param matched - 匹配的路由项
     * @param navSignal - 导航级别的中止信号
     */
    private async _loadRoute(
        matched: KylinMatchedRouteItem,
        navSignal?: AbortSignal,
    ): Promise<void> {
        if (!matched.route?.data) return;

        const options = this._getRouteOptions(matched);

        let loader: AsyncLoader;

        let signal: IAsyncSignal;

        try {
            // 1. 缓存优先策略
            if (this._hitCache(matched, options)) {
                return;
            }

            // 2. 检查是否是静态数据
            if (this._isValidData(options.from) && !isUrlSource(options.from)) {
                loader = new AsyncLoader(async () => {
                    return options.from;
                });
                return;
            }

            // 检查导航是否被中止
            if (navSignal?.aborted) {
                return;
            }

            // 3. 异步加载流程
            signal = this._createSignal(matched, options);
            let loader: any;
            let url: string | undefined;

            if (isUrlSource(options.from)) {
                url = options.from as string;
                signal.meta.url = url;
                loader = this._loadFromRemote(url, signal, matched, options, navSignal);
            } else if (options.from === true) {
                url = this._getAutoUrl(matched);
                if (url) {
                    signal.meta.url = url;
                    loader = this._loadFromRemote(url, signal, matched, options, navSignal);
                } else {
                    this._removeSignal(matched);
                    return;
                }
            } else if (isFunction(options.from)) {
                loader = options.from(matched);
                // 对于函数返回值，如果是 falsy 值（除了 false），则不创建 signal
                // false 有特殊用途（触发 getAutoUrl）
                if (loader === null || loader === undefined || loader === 0) {
                    this._removeSignal(matched);
                    return;
                }
            }

            if (loader === undefined) {
                this._removeSignal(matched);
                return;
            }

            Promise.resolve(loader)
                .then((data) => this._onLoadSuccess(matched, data, signal, options))
                .catch((error) => this._onLoadError(matched, error, signal, options));
        } catch (e: any) {
            // AbortError 通常是由于用户导航取消导致的
            if (e.name !== "AbortError") {
                this._createErrorSignal(matched, e, options);
            }
        }
    }

    // ========================================
    // 缓存管理
    // ========================================

    /**
     * 检查缓存是否过期
     */
    private _isCacheExpired(
        cacheItem: CacheItem<any> | undefined,
        options: KylinRouteDataOptions,
    ): boolean {
        if (!cacheItem) return true;
        const cacheTime = options.cache || 0;
        if (cacheTime <= 0) return true;
        return Date.now() - cacheItem.timestamp > cacheTime;
    }

    /**
     * 尝试使用缓存数据
     */
    private _hitCache(matched: KylinMatchedRouteItem, options: KylinRouteDataOptions): boolean {
        const hash = this._getHash(matched, options);
        const cacheItem = this.cache.get(hash);

        if ((options.cache || 0) > 0 && cacheItem && !this._isCacheExpired(cacheItem, options)) {
            this._createSuccessSignal(matched, cacheItem.value, options);
            return true;
        } else if ((options.cache || 0) > 0 && this.cache.has(hash)) {
            this.cache.delete(hash);
        }

        return false;
    }

    /**
     * 获取缓存键
     */
    private _getHash(matched: KylinMatchedRouteItem, options: KylinRouteDataOptions): string {
        if (options.hash) {
            return getSignalHash(options.hash, matched);
        }
        return getSignalHash("{path}", matched);
    }

    // ========================================
    // 信号创建辅助方法
    // ========================================

    private _createErrorSignal(
        matched: KylinMatchedRouteItem,
        error: any,
        options: KylinRouteDataOptions,
    ): void {
        const signal = this._createSignal(matched, options);
        this._onLoadError(matched, error, signal, options);
    }

    private _createSuccessSignal(
        matched: KylinMatchedRouteItem,
        data: any,
        options: KylinRouteDataOptions,
    ): void {
        const signal = this._createSignal(matched, options);
        this._onLoadSuccess(matched, data, signal, options);
    }

    // ========================================
    // 远程加载
    // ========================================

    /**
     * 从远程 URL 加载数据
     */
    private _loadFromRemote(
        url: string,
        signal: IAsyncSignal,
        matched: KylinMatchedRouteItem,
        options: KylinRouteDataOptions,
        navSignal?: AbortSignal,
    ): Promise<any> {
        const finalUrl = prefixBaseUrl(url.params(getRouteVars(matched)), this.router.options.base);
        const { timeout = 0 } = options;

        // 创建用于内部超时控制的 AbortController
        const timeoutController = new AbortController();

        // 获取外部取消信号
        const externalSignal = signal.getAbortSignal();

        let timeoutId: ReturnType<typeof setTimeout> | null = null;

        // 资源清理函数
        const cleanup = () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }
            if (externalSignal) {
                externalSignal.removeEventListener("abort", abortHandler);
            }
        };

        // 外部信号触发时的处理函数
        const abortHandler = () => {
            timeoutController.abort();
        };

        // 注册外部信号监听
        if (externalSignal) {
            externalSignal.addEventListener("abort", abortHandler);
        }

        // 设置超时控制器
        if (timeout > 0) {
            timeoutId = setTimeout(() => {
                (timeoutController as any).isTimeout = true;
                timeoutController.abort();
            }, timeout);
        }

        // 构建合并后的 fetch signal
        const signals = [timeoutController.signal];
        if (externalSignal) signals.push(externalSignal);
        if (navSignal) signals.push(navSignal);

        // 兼容不支持 AbortSignal.any 的环境
        const fetchSignal =
            typeof AbortSignal.any === "function" ? AbortSignal.any(signals) : signals[0];

        try {
            return fetch(finalUrl, { signal: fetchSignal })
                .then(async (response) => {
                    if (!response.ok) {
                        throw new KylinRouterLoadError(
                            `Fail when load ${finalUrl} : ${response.statusText}`,
                            response.status,
                        );
                    }
                    return (await this._onResponse(response, matched, {
                        signal: fetchSignal,
                        hash: signal.meta.hash,
                    })) as any;
                })
                .catch((error) => {
                    if (error instanceof DOMException && error.name === "AbortError") {
                        if ((timeoutController as any).isTimeout) {
                            throw new KylinRouterTimeoutError();
                        } else {
                            throw error;
                        }
                    }
                    throw error;
                })
                .finally(() => {
                    cleanup();
                });
        } catch (syncError: any) {
            cleanup();
            return Promise.reject(syncError);
        }
    }

    // ========================================
    // 响应处理
    // ========================================

    /**
     * 处理 HTTP 响应
     */
    private async _onResponse(
        response: Response,
        _matched: KylinMatchedRouteItem,
        _options: ViewRenderOptions,
    ): Promise<KylinRemoteLoadResult> {
        try {
            const data = await response.json();
            return {
                value: data,
            };
        } catch (e: any) {
            return {
                error: e,
            };
        }
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
     * 检查是否启用缓存
     */
    private _isCacheEnable(options: KylinRouteDataOptions): boolean {
        return (options.cache || 0) > 0;
    }

    // ========================================
    // 加载成功/失败处理
    // ========================================

    /**
     * 加载成功处理
     */
    private _onLoadSuccess(
        matched: KylinMatchedRouteItem,
        data: KylinRemoteLoadResult | any,
        signal: IAsyncSignal,
        options: KylinRouteDataOptions,
    ): void {
        try {
            // 提取实际数据
            const actualData = this._isRemoteLoadResult(data) ? data.value || {} : data;

            // 验证数据有效性（必须是纯对象）
            if (!this._isValidData(actualData)) {
                signal.reject(
                    new KylinRouterLoadError("Invalid data format: expected plain object"),
                );
                return;
            }

            // 启用缓存则缓存数据（直接缓存实际数据，不是 KylinRemoteLoadResult）
            if (this._isCacheEnable(options)) {
                const hash = this._getHash(matched, options);
                // 缓存结构：{ value: actualData, timestamp: number }
                this.cache.set(hash, {
                    value: actualData,
                    timestamp: Date.now(),
                });
            }

            // 处理错误情况
            if (this._isRemoteLoadResult(data) && data.error && data.error instanceof Error) {
                signal.reject(new KylinRouterLoadError(data.error.message));
                return;
            }

            // 处理数据（Alpine.js 集成）
            const processedData = this._onHandleData(actualData, signal, matched, options);
            signal.resolve(processedData);
        } catch (e: any) {
            signal.reject(e);
        }
    }

    /**
     * 检查是否为 KylinRemoteLoadResult 格式
     */
    private _isRemoteLoadResult(data: any): data is KylinRemoteLoadResult {
        return data && typeof data === "object" && ("value" in data || "error" in data);
    }

    /**
     * 加载失败处理
     */
    private _onLoadError(
        matched: KylinMatchedRouteItem,
        error: Error,
        signal: IAsyncSignal,
        options: KylinRouteDataOptions,
    ): void {
        if (error.name === "AbortError") {
            signal.resolve(undefined);
        } else {
            signal.meta.statusCode = (error as KylinRouterLoadError).status || 500;
            const hash = this._getHash(matched, options);
            this.cache.delete(hash);
            signal.reject(error);
        }
    }

    // ========================================
    // 数据处理（Alpine.js 集成）
    // ========================================

    /**
     * 处理加载的数据，集成 Alpine.js
     */
    private _onHandleData(
        data: Record<string, any>,
        signal: IAsyncSignal,
        matched: KylinMatchedRouteItem,
        options: KylinRouteDataOptions,
    ): any {
        const { store } = options;
        const hash = signal.meta.hash;

        // 将 $params 和 $query 添加到数据对象中
        const mergedData = {
            ...cloneDeep(data),
            $params: matched.params || {},
            $query: matched.query || {},
            $state: matched.state || {},
        };

        try {
            if (typeof store === "string") {
                Alpine.store(store, mergedData);
            } else {
                Alpine.data(hash, () => mergedData);
            }
        } catch (e: any) {
            this.router.logger.error(
                `{} -> Failed to create route dataObject : ${e.message}`,
                () => [matched.id, e],
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
    private _getAutoUrl(matched: KylinMatchedRouteItem): string | undefined {
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
    async loadDatas(routes: KylinMatchedRouteItem[], navSignal?: AbortSignal) {
        return this.loadRoutes(routes, navSignal);
    }

    /**
     * 清理资源
     */
    public cleanup(): void {
        this.cache.clear();
    }
}
