import { createBrowserHistory, createHashHistory } from "history";
import type { Update } from "history";

import type {
    AutoSparkRouterOptions,
    AutoSparkRouteItem,
    ModalState,
    AutoSparkMatchedRouteItem,
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
import { getBaseUrl, getDocumentBase } from "@/utils/getBaseUrl";

import { HookManager } from "./features/hooks";
import { AutoSparkRouteTable } from "./features/routes";
import { setupRouterEngine, type RouterEngineBinding } from "./engine/engineHost";
import type { AutoSpark } from "autospark";

import { joinPath, matchRoute } from "./utils";
import { createLogger, type AutoSparkRouterLogger } from "./logger";
import { removePathPrefix } from "./utils/removePathPrefix";
import { errorPages } from "./pages/errors"; 

export class AutoSparkRouter extends Mixin(
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

    /** 路由表注册器 */
    public routes!: AutoSparkRouteTable;

    /** 钩子管理器 */
    public hooks!: HookManager;

    /** 组件加载器 */
    protected viewLoader!: ViewLoader;

    /** 数据加载器 */
    protected dataLoader!: DataLoader;
    private _logger?: AutoSparkRouterLogger;
    /** 是否正在导航 */
    isNavigating: boolean = false;

    /** 待处理的导航类型，用于在 onRouteUpdate 中判断导航来源 */
    private _pendingNavigationType?: "push" | "replace" | "pop";

    /** 上一个路由，用于 afterLeave 守卫 */
    protected previous?: AutoSparkRouteItem & {
        matchedRoutes?: Array<{
            route: AutoSparkRouteItem;
            params: Record<string, string>;
            remainingPath: string;
        }>;
        params?: Record<string, string>;
        query?: Record<string, string>;
    };

    public options: AutoSparkRouterOptions;

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
    protected _lastMatched: AutoSparkMatchedRouteItem[] | null = null;

    /** 模态容器元素 */
    protected modalContainer: HTMLElement | null = null;

    /** 模态状态管理 */
    protected modalState: ModalState = {
        stack: [],
        current: null,
    };

    /** 最大模态层数，防止无限堆叠 */
    protected maxModals: number = 10;

    /** engine 绑定（注入或自建，见 engineHost.ts） */
    protected _engineBinding?: RouterEngineBinding;

    /** 关联的 AutoSpark engine 实例（渲染激活与组件注册的运行时基座） */
    get engine(): AutoSpark | undefined {
        return this._engineBinding?.engine;
    }

    /**
     * 构造函数 - 仅负责配置初始化，不操作 DOM
     * @param host - 宿主元素
     * @param options - 路由配置选项
     */
    constructor(
        host: HTMLElement | string,
        options: AutoSparkRouterOptions | AutoSparkRouterOptions["routes"] = [],
    ) {
        super();
        // 设置 host 元素
        this.host = typeof host === "string" ? (document.querySelector(host) as HTMLElement) : host;
        if (!(this.host instanceof HTMLElement)) {
            throw new Error("[AutoSparkRouter] Host must be a valid HTMLElement");
        } // 标记 host 元素
        this.host.setAttribute("data-autospark-router", "");
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

    private _initOptions(options: AutoSparkRouterOptions | AutoSparkRouterOptions["routes"] = []) {
        this.options = Object.assign(
            {
                mode: "history",
                debug: false,
                home: "/",
                keeyAlive: true,
                data: {},
                errorPages: {},
                renderers: [], // 视图渲染器
                // 公共路由配置（仅作应用级缺省，路由项显式声明优先）。
                // 不预置 keepAlive:true——ADR-0003 默认翻转：路由与出口均未声明时不缓存
                routeOptions: {},
                viewOptions: {},
            },
            options && typeof options === "object" && "routes" in options
                ? options
                : {
                      routes: options,
                  },
        );
        // base 缺省链（ADR-0006 决策 2a/2b）：显式配置 > 文档 <base href> 标签 > URL 目录推断。
        // base 移出 defaults 由本处条件填充——显式传 undefined 视为未设置（不再覆盖推断值）。
        // <base href> 信号服务于动态入口（服务端渲染入口 HTML、URL 无文件名）：深层直达的
        // URL 不含「前缀到哪结束」的信号，getBaseUrl 目录规则会把路由路径误判为目录
        if (this.options.base === undefined) {
            this.options.base = getDocumentBase() ?? getBaseUrl();
        }
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
        fromRoute: AutoSparkMatchedRouteItem[] | undefined;
        toRoute: AutoSparkMatchedRouteItem[];
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

        let fromRoute: AutoSparkMatchedRouteItem[] | undefined;

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

            // 公共层数：fromRoute 与 toRoute 的 URL 前缀公共部分（ADR-0004 加载域公共层跳过）。
            // 加载域：i < commonRouteIndex 且加载成功过的层跳过加载（复用既有 signal）；
            // 渲染域同算法跳过公共层渲染（_renderRoutes 内自算，同一判定键 matched.url）
            const commonRouteIndex = this._getCommonRouteIndex(fromRoute, toRoute);

            // 传递 navSignal 给 dataLoader 和 viewLoader
            // 这样当导航被中止时，正在进行的网络请求也会被取消
            this.dataLoader.loadDatas(toRoute, navSignal, commonRouteIndex);
            this.viewLoader.loadViews(toRoute, navSignal, commonRouteIndex);

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
                "[AutoSparkRouter] Cannot navigate: router is not attached to a host element. Call attach() first.",
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
        this.routes = new AutoSparkRouteTable(this);
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

                // engine 接管（替代 Alpine 桥）：注入或自建 + outlet 组件注册（ADR-0002）
                this._engineBinding = setupRouterEngine(this);

                // 出口兜底检查（自建模式已在 engineHost 编译前插入；注入模式仅告警）
                this._ensureDefaultOutlet();
                this.attached = true;
                this.emit("routes:attached", undefined);
                // 标记为已绑定
                // 初始导航：按当前 URL 恢复路由状态（直达/刷新/前进后退落地）；
                // 入口文档直开（ADR-0006 修订版）：原始 pathname 以 .html/.htm 结尾（对齐
                // getBaseUrl 的扩展名集合）即视为载体直开（如 /public/shop/index.html、
                // /shop/a.html、/shop/x/y/z.html）——先试真实匹配，命中（路由 path 带 .html
                // 的合法场景）正常渲染，仅 unmatched 才归位 home（地址栏落 base 根）。
                // 未显式 base 时 getBaseUrl 构造期已把入口文件所在目录推断为 base，
                // 归位即落目录根（/shop/x/y/z.html → /shop/x/y/z）
                const rawPathname = this.history.location.pathname;
                const currentPath = removePathPrefix(rawPathname, this.options.base);
                if (currentPath === "" || currentPath === "/") {
                    this.home();
                } else if (rawPathname.endsWith(".html") || rawPathname.endsWith(".htm")) {
                    // 试匹配输入与 onRouteUpdate 同构（base 剥离后的路径 + search）；
                    // toRoute 首项是根路由（route 恒有值），真实匹配看首项之后
                    const matched = this._matchRoute(currentPath, this.history.location.search);
                    const hasRealMatch = matched.toRoute
                        .slice(1)
                        .some((m) => m.route !== undefined);
                    if (hasRealMatch) {
                        this.replace(rawPathname);
                    } else {
                        this.home();
                    }
                } else {
                    this.replace(rawPathname);
                }
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

        // 销毁自建的 engine（注入的 engine 由应用拥有，不处置）
        if (this._engineBinding?.owned) {
            this._engineBinding.engine.destroy();
        }
        this._engineBinding = undefined;

        // 清理 AbortController
        this.abortController.abort();

        // 移除 context provider
        this.removeContextProvider();

        // 清理 host 引用
        if (this.host instanceof HTMLElement) {
            this.host.removeAttribute("data-autospark-router");
            delete (this.host as any).router;
        }

        // 标记为未绑定
        this.attached = false;
    }
}
