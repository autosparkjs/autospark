/**
 * 路由数据加载器基类
 * 提取 DataLoader 和 ViewLoader 的公共逻辑
 *
 * @module features/baseLoader
 */

import type { KylinRouter } from "@/router";
import type { KylinMatchedRouteItem } from "@/types/routes";
import { asyncSignal, type IAsyncSignal } from "asyncsignal";
import { getRouteVars } from "@/utils/getRouteVars";
import { prefixBaseUrl } from "@/utils/prefixBaseUrl";
import { getSignalHash } from "@/utils/getSignalHash";
import { KylinRouterLoadError, KylinRouterTimeoutError } from "@/errors";
import { isUrlSource } from "@/utils/isUrlSource";
import { isFunction } from "flex-tools/typecheck/isFunction";
import { isPlainObject } from "flex-tools/typecheck/isPlainObject";
import type { ViewRenderOptions } from "@/renderers/types";

export type KylinRemoteLoadResult<T = any> = {
    value?: T;
    error?: Error | null;
    meta?: Record<string, any>;
};

/**
 * 加载器类型标识
 */
export type LoadType = "data" | "view";

/**
 * 基础加载器数据来源类型
 *
 * - string: URL,支持插值
 * - Data: 直接的数据对象
 * - (route) => Data 函数返回数据
 * - true: 简化配置，当data=true时，则自动使用与view同名地址的JSON.
 *         例如view="pages/a.html"时，data=true会自动加载"pages/a.json"
 */
export type BaseLoaderSource<Data = any> =
    | true // 简化配置
    | string
    | Data
    | ((route: KylinMatchedRouteItem) => Data);

/**
 * 基础加载选项接口
 * 所有加载器共享的基础选项
 */
export interface BaseLoaderOptions<Data = any> {
    /**
     * 加载器名称
     * 可选：用于标识加载器的名称，
     * 对于数据加载器，名称将Alpine.data(name)的键名，
     */
    name?: string;
    /**
     * 数据/视图来源
     * - TData: 直接的数据/视图值（如对象、HTMLElement）
     * - string: URL 地址
     * - (matched) => TData | Promise<TData>: 函数返回数据
     */
    from: BaseLoaderSource<Data>;
    /**
     * 路由hash值，用于生成缓存键
     * 例如："{path}"表示使用路由的路径作为hash值
     */
    hash?: string;
    /** 缓存时间（毫秒），0 表示不缓存 */
    cache?: number;
    /** 加载超时时间（毫秒） */
    timeout?: number;
    /**
     * 是否预加载
     * - true: 在路由实例创建时自动预加载进缓存，这可以加速数据加载
     * - false: 默认值，不预加载
     */
    preload?: boolean;
}

/**
 * 缓存项基础结构
 */
export interface CacheItem<T> {
    value: T;
    timestamp: number;
}

/**
 * 路由数据加载器基类
 * 通过 TLoadType 泛型参数实现精确的类型推导
 *
 * @template LoadType - 加载器类型
 * @template Options - 加载器选项类型
 * @template Data - 从远程加载的数据类型
 * @template TCacheItem - 缓存项类型
 */
export abstract class RouteDataLoaderBase<
    LoadType extends string,
    Options extends BaseLoaderOptions<Data>,
    Data extends any = any,
> {
    // 基础属性
    router: KylinRouter;
    protected readonly loadType: LoadType;
    protected options: Required<Omit<Options, "from">>;
    cache: Map<string, CacheItem<Data>> = new Map();

    // 根据 TLoadType 精确推导的键名类型
    protected readonly _signalKey: `_get${Capitalize<LoadType>}`;
    protected readonly _optionsKey: `_${LoadType}Options`;
    protected readonly _optionKey: LoadType;

    constructor(
        router: KylinRouter,
        type: LoadType,
        defaultOptions: Required<Omit<Options, "from">>,
    ) {
        this.router = router;
        this.loadType = type;
        this.options = Object.assign(
            {
                timeout: 0,
                cache: 0,
                hash: "{path}",
                datatype: "json",
            },
            defaultOptions,
        );

        // 根据 loadType 自动推导键名（运行时值）
        this._signalKey =
            `_get${type.charAt(0).toUpperCase() + type.slice(1)}` as `_get${Capitalize<LoadType>}`;
        this._optionsKey = `_${type}Options` as `_${LoadType}Options`;
        this._optionKey = type;
    }

    // ========================================
    // 类型安全的属性访问器（核心简化点）
    // ========================================

    /**
     * 获取路由当前正在使用的加载信号
     * 根据 signalKey 自动访问 _getData 或 _getView
     */
    protected getSignal(matched: KylinMatchedRouteItem): IAsyncSignal | undefined {
        return (matched.route as any)[this._signalKey] as IAsyncSignal | undefined;
    }

    /**
     * 创建新的加载信号
     * 先 abort 旧 signal 避免并发问题（只 abort pending 状态的 signal）
     */
    protected createSignal(matched: KylinMatchedRouteItem, options: Options): IAsyncSignal {
        // 先 abort 旧 signal，避免并发竞态条件
        const oldSignal = this.getSignal(matched);
        if (oldSignal) {
            oldSignal.abort();
        }
        const signal = asyncSignal();
        (matched.route as any)[this._signalKey] = signal;
        signal.meta.hash = this._getHash(matched, options);
        return signal;
    }
    protected _removeSignal(matched: KylinMatchedRouteItem) {
        if (matched.route) {
            delete (matched.route as any)[this._signalKey];
        }
    }
    /**
     * 获取路由的配置选项
     */
    protected getRouteOptions(matched: KylinMatchedRouteItem): Required<Options> {
        if (!(matched.route as any)[this._optionsKey]) {
            (matched.route as any)[this._optionsKey] = this._mergeRouteOptions(matched) as any;
        }
        return (matched.route as any)[this._optionsKey] as unknown as Required<Options>;
    }

    /**
     * 判断是否为配置对象
     */
    protected isOptionsObject(data: unknown): data is Options {
        return typeof data === "object" && data !== null && "from" in data;
    }

    /**
     * 并发加载多个路由
     * @param routes - 匹配的路由数组
     * @param navSignal - 导航级别的中止信号
     */
    public loadRoutes(
        routes: KylinMatchedRouteItem[],
        navSignal?: AbortSignal,
    ): Promise<PromiseSettledResult<void>[]> {
        return Promise.allSettled(routes.map((matched) => this.loadRoute(matched, navSignal)));
    }

    private _createErrorSignal(matched: KylinMatchedRouteItem, error: any, options: Options) {
        const signal = this.createSignal(matched, options);
        this.onLoadError(matched, error, signal, options);
    }
    private _createSuccessSignal(matched: KylinMatchedRouteItem, data: any, options: Options) {
        const signal = this.createSignal(matched, options);
        this.onLoadSuccess(matched, data, signal, options);
    }
    /**
     * 加载单个路由
     * @param matched - 匹配的路由项
     * @param navSignal - 导航级别的中止信号
     */
    protected async loadRoute(matched: KylinMatchedRouteItem, navSignal?: AbortSignal) {
        // @ts-ignore
        if (!matched.route[this._optionKey]) return;
        const options = this.getRouteOptions(matched);
        let signal: IAsyncSignal;
        try {
            // 1. 缓存优先策略 - 先检查缓存，避免不必要的数据源调用
            if (this.hitCache(matched, options)) {
                return;
            }

            // 2. 检查是否是静态数据，直接返回
            if (this.isValidData(options.from) && !isUrlSource(options.from)) {
                this._createSuccessSignal(matched, options.from, options);
                return;
            }

            // 检查导航是否被中止
            if (navSignal?.aborted) {
                return;
            }

            // 3. 异步加载流程
            signal = this.createSignal(matched, options);
            let loader: any;
            let url: string | undefined;

            if (isUrlSource(options.from)) {
                url = options.from as string;
                signal.meta.url = url;
                loader = this._loadFromRemote(url, signal, matched, options, navSignal);
            } else if (options.from === true) {
                url = this.getAutoUrl(matched);
                if (url) {
                    signal.meta.url = url;
                    loader = this._loadFromRemote(url, signal, matched, options, navSignal);
                } else {
                    this._removeSignal(matched);
                    return;
                }
            } else if (isFunction(options.from)) {
                loader = options.from(matched);
            }

            if (loader == undefined) {
                this._removeSignal(matched);
                return;
            }

            Promise.resolve(loader)
                .then((data) => this.onLoadSuccess(matched, data, signal, options))
                .catch((error) => this.onLoadError(matched, error, signal, options));
        } catch (e: any) {
            // AbortError 通常是由于用户导航取消导致的，不需要创建 error signal
            if (e.name !== "AbortError") {
                this._createErrorSignal(matched, e, options);
            }
        }
    }

    /**
     * 检测缓存是否过期
     * @param cacheItem
     * @param options
     * @returns
     */
    private _isCacheExpired(cacheItem: CacheItem<Data> | undefined, options: Options): boolean {
        if (!cacheItem) return true;
        const cacheTime = options.cache || 0;
        // cacheTime <= 0 表示禁用缓存，永远返回 true
        if (cacheTime <= 0) return true;
        return Date.now() - cacheItem.timestamp > cacheTime;
    }

    /**
     * 尝试使用缓存数据
     * @param matched - 匹配的路由项
     * @param options - 加载选项配置
     * @returns 是否成功使用缓存数据，true 表示使用缓存成功，false 表示需要重新加载
     */
    private hitCache(matched: KylinMatchedRouteItem, options: Options): boolean {
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

    private _getHash(matched: KylinMatchedRouteItem, options: Options) {
        if (options.hash) {
            return getSignalHash(options.hash, matched);
        }
        return getSignalHash(options.hash || "{path}", matched);
    }

    protected getAutoUrl(_matched: KylinMatchedRouteItem): string | undefined {
        return undefined;
    }
    /**
     * 检查是否是合法的内容
     *
     * dataLoader： 必须是一个{}
     * viewHhtml: 必须是一个String
     */
    protected isValidData(_data: any): boolean {
        return true;
    }

    protected abstract onResponse(
        response: Response,
        _matched: KylinMatchedRouteItem,
        _options: ViewRenderOptions,
    ): Promise<KylinRemoteLoadResult>;

    /**
     * 从远程 URL 加载数据
     * 统一的远程加载逻辑，用于处理 URL 字符串
     * @param url - 远程 URL
     * @param signal - 内部信号
     * @param matched - 匹配的路由项
     * @param options - 加载选项
     * @param navSignal - 导航级别的中止信号
     */
    private _loadFromRemote(
        url: string,
        signal: IAsyncSignal,
        matched: KylinMatchedRouteItem,
        options: Options,
        navSignal?: AbortSignal,
    ): Promise<Data> {
        const finalUrl = prefixBaseUrl(url.params(getRouteVars(matched)), this.router.options.base);
        const { timeout = 0 } = options;

        // 创建用于内部超时控制的 AbortController
        const timeoutController = new AbortController();

        // 获取外部取消信号（仅获取一次，避免混淆）
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

        // 设置超时控制器，并在触发时打上专属标记
        if (timeout > 0) {
            timeoutId = setTimeout(() => {
                // 关键修复：标记此次中止是由超时引起的
                (timeoutController as any).isTimeout = true;
                timeoutController.abort();
            }, timeout);
        }

        // 构建合并后的 fetch signal
        // 包含：超时信号 + 外部信号 + 导航级别信号
        const signals = [timeoutController.signal];
        if (externalSignal) signals.push(externalSignal);
        if (navSignal) signals.push(navSignal);

        // 兼容不支持 AbortSignal.any 的环境
        const fetchSignal =
            typeof AbortSignal.any === "function" ? AbortSignal.any(signals) : signals[0];

        // 使用 try-catch 包裹以捕获可能存在的同步构建异常，防止内存泄漏
        try {
            return fetch(finalUrl, { signal: fetchSignal })
                .then(async (response) => {
                    // 检查 HTTP 状态码
                    if (!response.ok) {
                        throw new KylinRouterLoadError(
                            `Fail when load ${finalUrl} : ${response.statusText}`,
                            response.status,
                        );
                    }
                    return (await this.onResponse(response, matched, {
                        signal: fetchSignal,
                        hash: signal.meta.hash,
                    })) as Data;
                })
                .catch((error) => {
                    // 精确分类 AbortError
                    if (error instanceof DOMException && error.name === "AbortError") {
                        if ((timeoutController as any).isTimeout) {
                            // 真正的超时抛出 TimeoutError
                            throw new KylinRouterTimeoutError();
                        } else {
                            throw error; // 外部主动取消或导航中止，抛出专门的错误或直接静默处理
                        }
                    }
                    // 其他网络错误或业务错误直接向上抛出
                    throw error;
                })
                .finally(() => {
                    cleanup(); // 无论成功、失败还是取消，都确保资源被释放
                });
        } catch (syncError: any) {
            cleanup(); // 如果在构建阶段发生同步异常（极端情况），确保立即清理
            return Promise.reject(syncError);
        }
    }
    protected isCacheEnable(options: Options) {
        return (options.cache || 0) > 0;
    }

    protected onLoadSuccess(
        matched: KylinMatchedRouteItem,
        data: KylinRemoteLoadResult,
        signal: IAsyncSignal,
        options: Options,
    ): void {
        try {
            // 是否启用缓存
            if (this.isCacheEnable(options)) {
                const hash = this._getHash(matched, options);
                // 缓存未经处理的数据
                this.cache.set(hash, {
                    value: data,
                    timestamp: Date.now(),
                } as CacheItem<Data>);
            }
            if (data.error && data.error instanceof Error) {
                signal.reject(new KylinRouterLoadError(data.error.message));
            } else {
                signal.resolve(data);
            }
        } catch (e: any) {
            signal.reject(e);
        }
    }

    protected onLoadError(
        matched: KylinMatchedRouteItem,
        error: Error,
        signal: IAsyncSignal,
        options: Options,
    ): void {
        if (error.name === "AbortError") {
            signal.resolve(undefined);
        } else {
            signal.meta.statusCode = (error as KylinRouterLoadError).status || 500;
            // 使用正确的缓存键
            const hash = this._getHash(matched, options);
            this.cache.delete(hash);
            signal.reject(error);
        }
    }
    /**
     * 路由配置合并
     * @param matched
     * @returns
     */
    private _mergeRouteOptions(matched: KylinMatchedRouteItem): Required<Options> {
        const dataSource = (matched.route as any)[this._optionKey] || {};
        const isSourceOptions = isPlainObject(dataSource) && "from" in dataSource;
        return {
            ...this.options,
            ...(isSourceOptions ? dataSource : { from: dataSource }),
        } as Required<Options>;
    }

    /**
     * 清理资源
     */
    public cleanup(): void {
        this.cache.clear();
    }
}
