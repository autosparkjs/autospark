import type { OutletRefs } from "@/utils/traverseOutlet";
import { createBrowserHistory, createHashHistory } from "history";
import type { Update } from "history";

import type {
    KylinRouterOptions,
    KylinRouteItem,
    ModalState,
    KylinMatchedRouteItem,
} from "./types/index";
import { Mixin } from "ts-mixer";
import {
    Context,
    KeepAlive,
    Transition,
    Preload,
    Render,
    DataLoader,
    ViewLoader,
    Emitter,
    Redirect,
    Modal,
} from "./features";
import { getBaseUrl } from "@/utils/getBaseUrl";

import { HookManager } from "./features/hooks";
import { KylinRouteTable } from "./features/routes";
import { AlpineManager } from "./features/alpine";

import { joinPath, matchRoute } from "./utils";
import { createLogger, type KylinRouterLogger } from "./logger";
import { removePathPrefix } from "./utils/removePathPrefix";
import { errorPages } from "./pages/errors";
import { KylinRouterError } from "./errors";
import { KylinRouterHTMLViewRenderer } from "./renderers/html";

export class KylinRouter extends Mixin(
    Context,
    KeepAlive,
    Transition,
    Modal,
    Preload,
    Render,
    Redirect,
    Emitter,
) {
    // 用于存储一需要清理的副作用函数，比如 history.listen 返回的取消监听函数
    protected _cleanups: Array<() => void> = [];
    /** 宿主元素，在 attach() 方法调用后设置 */
    host!: HTMLElement;
    history!: ReturnType<typeof createBrowserHistory>;

    outlets?: OutletRefs;
    /** 路由表注册器 */
    public routes!: KylinRouteTable;

    /** 钩子管理器 */
    public hooks!: HookManager;

    /** 组件加载器 */
    protected viewLoader!: ViewLoader;

    /** 数据加载器 */
    protected dataLoader!: DataLoader;
    private _logger?: KylinRouterLogger;
    /** 是否正在导航 */
    isNavigating: boolean = false;

    /** 待处理的导航类型，用于在 onRouteUpdate 中判断导航来源 */
    private _pendingNavigationType?: "push" | "replace" | "pop";

    /** 上一个路由，用于 afterLeave 守卫 */
    protected previous?: KylinRouteItem & {
        matchedRoutes?: Array<{
            route: KylinRouteItem;
            params: Record<string, string>;
            remainingPath: string;
        }>;
        params?: Record<string, string>;
        query?: Record<string, string>;
    };

    public options: KylinRouterOptions;

    /** 是否已绑定到 DOM */
    public attached: boolean = false;

    /** 当前导航版本号（D-23） */
    public currentNavVersion: number = 0;

    /** AbortController 用于取消进行中的请求（D-24） */
    private abortController: AbortController = new AbortController();

    /** 导航级别的 AbortController，用于取消进行中的导航操作 */
    protected _navAbortController: AbortController | null = null;

    /** 当前导航的 AbortSignal，供 dataLoader、viewLoader、render 使用 */
    get navSignal(): AbortSignal {
        return this._navAbortController?.signal || new AbortController().signal;
    }

    /** 当前正在处理的路由 URL，用于检测重复导航 */
    private _currentNavUrl?: string;
    protected _lastViewSlot: HTMLElement | null = null;
    protected _lastMatched: KylinMatchedRouteItem[] | null = null;

    /** 模态容器元素 */
    protected modalContainer: HTMLElement | null = null;

    /** 模态状态管理 */
    protected modalState: ModalState = {
        stack: [],
        current: null,
    };

    /** 最大模态层数，防止无限堆叠 */
    protected maxModals: number = 10;

    /** Alpine.js 管理器 */
    protected alpineManager?: AlpineManager;

    /**
     * 构造函数 - 仅负责配置初始化，不操作 DOM
     * @param host - 宿主元素
     * @param options - 路由配置选项
     */
    constructor(
        host: HTMLElement | string,
        options: KylinRouterOptions | KylinRouterOptions["routes"] = [],
    ) {
        super();
        // 设置 host 元素
        this.host = typeof host === "string" ? (document.querySelector(host) as HTMLElement) : host;
        if (!(this.host instanceof HTMLElement)) {
            throw new Error("[KylinRouter] Host must be a valid HTMLElement");
        } // 标记 host 元素
        this.host.setAttribute("data-kylin-router", "");
        (this.host as any).router = this;
        this.options = this._initOptions(options);
        this.attach();
    }
    /**
     * 获取路由模式
     * @returns 路由模式（history 或 hash）
     */
    get mode() {
        return this.options.mode;
    }
    /**
     * 获取基础路径
     * @returns 基础路径（例如：/app）
     */
    get base() {
        return this.options.base;
    }
    /**
     * 是否启用调试模式
     * */
    get debug() {
        return this.options.debug;
    }
    get logger() {
        if (!this._logger) {
            if (this.options.logger) {
                this._logger = this.options.logger;
            } else {
                this._logger = createLogger(this.options);
            }
        }
        return this._logger!;
    }

    get location() {
        return this.history.location;
    }
    /**
     * 最后一次渲染的视图元素slot
     */
    get lastViewSlot() {
        return this._lastViewSlot;
    }
    /**
     * 最后一次匹配的路由对象
     */
    get lastMatched() {
        return this._lastMatched;
    }
    /**
     *
     */
    get renderers() {
        return this.options.renderers!;
    }

    private _initOptions(options: KylinRouterOptions | KylinRouterOptions["routes"] = []) {
        this.options = Object.assign(
            {
                mode: "history",
                base: getBaseUrl(), // 自动检测 base URL
                debug: false,
                home: "/",
                keeyAlive: true,
                data: {},
                errorPages: {},
                renderers: [], // 视图渲染器
                // 公共路由配置
                routeOptions: {
                    keepAlive: true,
                },
                viewOptions: {},
            },
            options && typeof options === "object" && "routes" in options
                ? options
                : {
                      routes: options,
                  },
        );
        this.options.errorPages = { ...errorPages, ...this.options.errorPages };
        return this.options;
    }
    /**
     * 执行路由匹配并构造导航上下文
     * @param pathname - 路径名称
     * @param search - 查询参数
     * @returns 导航上下文，包含 fromRoute、toRoute 等信息
     */
    protected _matchRoute(
        pathname: string,
        search: string,
        state?: unknown,
    ): {
        fromRoute: KylinMatchedRouteItem[] | undefined;
        toRoute: KylinMatchedRouteItem[];
    } {
        const fromRoute = this.routes.current;
        // location.search 已经包含了 ? 前缀，所以直接拼接即可
        // 当 search 为 "" 时：pathname + "" = pathname
        // 当 search 为 "?q=test" 时：pathname + "?q=test" = pathname?q=test
        const fullPath = pathname + search;
        const toRoute = matchRoute(fullPath, this.routes.root, {});
        // 将 history state 填充到 matched 路由项中
        if (state) {
            toRoute.forEach((matchedItem) => {
                matchedItem.state = state;
            });
        }
        return { fromRoute, toRoute };
    }

    /**
     * 路由更新回调 - 在 URL 变化时被调用
     * 执行路由匹配和参数提取
     */
    async onRouteUpdate(location: Update) {
        // 标记正在导航
        this.isNavigating = true;
        // 触发 navigation/start 事件
        this.emit("navigation:start", location);
        const pathname = location.location.pathname;
        const search = location.location.search;
        this._lastViewSlot = null;
        // 执行路由匹配并获取导航上下文
        const matched = this._matchRoute(
            removePathPrefix(pathname, this.options.base),
            search,
            location.location.state,
        );
        this.emit("navigation:matched", matched);

        const toRoute = matched.toRoute;

        // 获取目标路由的完整 URL（用于对比）
        const targetUrl = toRoute.length > 0 ? toRoute[toRoute.length - 1].url : "";

        // 防重入检测：对比当前正在处理的路由 URL
        // 如果目标路由 URL 相同，说明是重复导航，直接忽略
        if (this._currentNavUrl === targetUrl) {
            this.logger.debug("忽略重复导航: {}", targetUrl);
            // 触发 navigation/start 事件
            this.emit("navigation:cancel", location);
            return;
        }

        // 记录当前正在处理的路由 URL
        this._currentNavUrl = targetUrl;

        // 递增导航版本号
        ++this.currentNavVersion;
        const navVersion = this.currentNavVersion;

        // 中止之前的导航操作（包括 dataLoader、viewLoader、render）
        if (this._navAbortController) {
            this.logger.debug("中止之前的导航操作");
            this._navAbortController.abort();
        }

        // 创建新的导航 AbortController
        this._navAbortController = new AbortController();
        const navSignal = this._navAbortController.signal;

        let fromRoute: KylinMatchedRouteItem[] | undefined;

        try {
            // 检查是否在路由匹配后被中止
            if (navSignal.aborted) {
                this.logger.debug("导航在路由匹配后被中止");
                return;
            }

            this.emit("navigation:matched", matched);

            fromRoute = matched.fromRoute;

            this.logger.debug("{} -> 导航到: {} {}, 匹配: {} ", () => [
                toRoute[0].id,
                pathname,
                search,
                toRoute,
            ]);

            // 执行全局前置守卫（beforeEach）
            const shouldContinue = await this.hooks.runBeforeRoute({
                from: fromRoute,
                to: toRoute,
            });

            // 检查是否在守卫执行后被中止
            if (navSignal.aborted) {
                this.logger.debug("导航在守卫执行后被中止");
                return;
            }

            if (!shouldContinue) {
                this.logger.debug("beforeEach 守卫返回 false，取消导航");
                this.emit("navigation:cancel", location);
                return;
            }

            // 传递 navSignal 给 dataLoader 和 viewLoader
            // 这样当导航被中止时，正在进行的网络请求也会被取消
            this.dataLoader.loadDatas(toRoute, navSignal);
            this.viewLoader.loadViews(toRoute, navSignal);

            // 执行渲染，传递 navSignal
            await this._renderRoutes(toRoute, fromRoute, navSignal);
        } finally {
            // 清理导航状态（只有当前导航版本才清理）
            if (navVersion === this.currentNavVersion) {
                this.isNavigating = false;
                this._currentNavUrl = undefined;

                // 清理导航 AbortController
                if (this._navAbortController) {
                    this._navAbortController = null;
                }
            }
            this.hooks.runAfterRoute({
                to: toRoute!,
            });
            this.routes.current = toRoute!;
            this.isNavigating = false;
            this.emit("navigation:end", location);
        }
    }

    /**
     * 等待结束导航
     */
    async isStopNavigating() {
        if (this.isNavigating) {
            return new Promise<void>((resolve) => {
                let endSubscriber: (() => void) | null = null;

                const cancelSubscriber = this.once("navigation:cancel", () => {
                    endSubscriber?.();
                    resolve();
                });

                endSubscriber = this.once("navigation:end", () => {
                    cancelSubscriber();
                    resolve();
                });
            });
        }
    }

    protected _ensureAttached(): void {
        if (!this.attached) {
            throw new Error(
                "[KylinRouter] Cannot navigate: router is not attached to a host element. Call attach() first.",
            );
        }
    }

    protected handleGuardFailure(matchedRoutes: any[]): void {
        if (matchedRoutes.length > 1) {
            // 有父路由，回退到父路由
            const parentRoute = matchedRoutes[matchedRoutes.length - 2].route;
            this.replace(parentRoute.path);
        } else {
            // 无父路由，回退到根路径
            this.replace("/");
        }
    }
    push(path: string, state?: Record<string, any>) {
        this._ensureAttached();
        this._pendingNavigationType = "push";
        // 检查是否为模态路由（! 前缀）
        if (path.startsWith("!")) {
            const modalPath = path.slice(1); // 移除 ! 前缀
            // 直接触发模态路由，不进入 history
            this.openModal({ route: modalPath });
            return;
        }

        if (state !== undefined) {
            this.history.push(path, state);
        } else {
            this.history.push(path);
        }
    }
    replace(path: string, state?: Record<string, any>) {
        this._ensureAttached();
        this._pendingNavigationType = "replace";
        if (state !== undefined) {
            this.history.replace(path, state);
        } else {
            this.history.replace(path);
        }
    }

    /**
     * 导航到主页
     * 主页路径由 options.home 指定（默认为 "/"）
     */
    home() {
        this._ensureAttached();
        const homePath = joinPath(this.options.base || "", this.options.home || "/");
        this.replace(homePath);
    }

    back() {
        this._ensureAttached();
        this._pendingNavigationType = "pop";

        // 如果有打开的模态，先关闭模态（D-20）
        if (this.modalState.stack.length > 0) {
            this.closeTopModal();
            return;
        }

        this.history.back();
    }
    forward() {
        this._ensureAttached();
        this._pendingNavigationType = "pop";
        this.history.forward();
    }
    go(delta: number) {
        this._ensureAttached();
        this._pendingNavigationType = "pop";
        this.history.go(delta);
    }

    attach(): void {
        if (this.attached) {
            throw new Error("Already attached to a host element");
        }

        this.history = this.mode === "hash" ? createHashHistory() : createBrowserHistory();

        // 初始化路由表注册器
        this.routes = new KylinRouteTable(this);
        // 初始化钩子管理器
        this.hooks = new HookManager(this);
        this.routes
            .load()
            .then(() => {
                // 初始化组件加载器，传递全局视图选项
                this.viewLoader = new ViewLoader(this);
                // 初始化数据加载器，传递全局数据选项
                this.dataLoader = new DataLoader(this);
                // 开始监听路由变化
                this._cleanups.push(this.history.listen(this.onRouteUpdate.bind(this)));

                // 设置 context provider
                this.attachContextProvider();

                // 初始化模态容器
                // this._initModals();

                // 初始化 Alpine.js
                this.alpineManager = new AlpineManager(this);

                // 自动插入默认 outlet（如果 host 内部没有 outlet）
                this._ensureDefaultOutlet();
                this.attached = true;
                this.emit("routes:attached", undefined);
                // 标记为已绑定
                // 自动导航到主页
                this.home();
            })
            .catch((e) => {
                this.logger.error("路由表加载失败:{}", e);
            });
    }
    /**
     * 解除 router 与 host 的绑定并清理所有监听器
     */
    detach(): void {
        if (!this.attached) {
            return; // 或抛出警告
        }

        // 清理所有副作用
        this._cleanups.forEach((unsubscribe) => unsubscribe());
        this._cleanups = [];

        // 清理 Loader 资源
        this.viewLoader.cleanup();

        // 清理 DataLoader 资源
        this.dataLoader.cleanup();

        // 清理 Alpine.js
        if (this.alpineManager) {
            this.alpineManager.cleanup();
        }

        // 清理 AbortController
        this.abortController.abort();

        // 移除 context provider
        this.removeContextProvider();

        // 清理 host 引用
        if (this.host instanceof HTMLElement) {
            this.host.removeAttribute("data-kylin-router");
            delete (this.host as any).router;
        }

        // 标记为未绑定
        this.attached = false;
    }
}
