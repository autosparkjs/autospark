/**
 * 路由表管理功能
 *
 * 负责：
 * - 路由表初始化和规范化
 * - 远程子表 / 约定子表的后台渐进展开（ADR-0007）
 * - 路由匹配和参数提取
 *
 * 不负责：运行时路由表增删改（addRoute / removeRoute / loadRemoteRoutes），
 * 该议题涉及 current、namedRouteItems 与已渲染视图的失效，另行处理。
 */

import type { AutoSparkRouter } from "@/router";
import type { AutoSparkRouteItem, AutoSparkMatchedRouteItem } from "@/types";

import { matchRoute } from "@/utils/matchRoute";
import { normalizeRoutes } from "@/utils/normalizeRoutes";
import { resolveChildrenUrl } from "@/utils/resolveChildrenUrl";
import { joinPath } from "@/utils/joinPath";

/** 导航回调函数类型 */
export interface NavigationCallbacks {
    push: (path: string) => void;
    getLocation: () => { pathname: string; search: string };
    setIsNavigating: (value: boolean) => void;
}

/**
 * 待展开节点：路由项 + 其累积路由路径（用于解析远程地址与插值）
 */
interface PendingNode {
    item: AutoSparkRouteItem;
    /** 祖先+自身的完整路由路径，如 `/products` */
    path: string;
}

/** 约定子表默认文件名（ADR-0007） */
const DEFAULT_ROUTES_FILE = "routes.json";
/** 远程子表默认最大展开深度（ADR-0007） */
const DEFAULT_MAX_CHILDREN_DEPTH = 10;

export class AutoSparkRouteTable {
    /** 根路由 - 规范化后的路由树根节点 */
    root: AutoSparkRouteItem = normalizeRoutes();
    /** 当前路由状态 */
    public current?: AutoSparkMatchedRouteItem[];
    /**
     * 用于缓存命名路由项，方便通过name进行快速重定向或路由
     *
     * 注意： name必须是全局唯一，重复命名只会记住一个
     *
     */
    namedRouteItems?: Map<string, WeakRef<AutoSparkRouteItem>>;
    router: AutoSparkRouter;
    /**
     * 展开过程的 Promise——后台渐进进行，不阻塞首屏（ADR-0007 决策 3）
     */
    private _expansion?: Promise<void>;
    /** 仍处于 pending 的节点数 */
    private _pendingCount: number = 0;
    /**
     * 远程响应缓存：按 URL 缓存解析结果。
     *
     * 同一地址被多个分支引用时复用一次网络请求；挂载点各自跑一次 `normalizeRoutes`，
     * 得到彼此独立的路由项对象（不会共享 `_getView` / `_dataLoadState` 等运行时状态）。
     */
    private _responseCache: Map<string, Promise<any>> = new Map();

    constructor(router: AutoSparkRouter) {
        this.router = router;
    }

    /**
     * 加载路由表
     *
     * 取回声明 → 规范化为骨架 → 标记待展开节点 → **后台**启动远程子表展开。
     *
     * 本方法只等骨架就绪（`routes:loaded`）；远程子表的展开不在此等待范围内——
     * 首屏匹配与渲染优先（ADR-0007 决策 3）。需要等表长全时用 {@link whenExpanded}。
     */
    async load(): Promise<void> {
        const routeArgs = this.router.options.routes || [];
        const toArray = async (arg: any): Promise<AutoSparkRouteItem[]> => {
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
        // 标记待展开节点（必须在选项继承之前：_applyRouteOptions 会递归 children）
        this._markPending(this.root, "/");
        // 处理选项继承
        this._applyRouteOptions(this.root);
        this.router.emit("routes:loaded", undefined);
        // 后台渐进展开，失败不外溢（展开失败一律局部降级，见 _expandAll）
        this._expansion = this._expandAll();
    }

    /**
     * 是否仍有待展开的远程子表
     */
    public hasPending(): boolean {
        return this._pendingCount > 0;
    }

    /**
     * 等待路由表展开完成（成功与失败降级均算完成）
     *
     * @param timeout - 等待上限（毫秒）；0/undefined 表示不设上限。
     *   调用方传入既有 `timeout` 来源链的值，避免一个挂死的 json 把导航拖死。
     */
    public async whenExpanded(timeout?: number): Promise<void> {
        // 展开过程自身一律不外溢：失败已按节点局部降级，等待方不应因之拒绝
        const settled = this._expansion?.catch(() => {});
        if (!settled) return;
        if (!timeout || timeout <= 0) {
            await settled;
            return;
        }
        await Promise.race([
            settled,
            new Promise<void>((resolve) => setTimeout(resolve, timeout)),
        ]);
    }

    /**
     * 匹配路径并返回匹配结果
     * @param pathname - 要匹配的路径
     * @returns 匹配结果或 null
     */
    public match(pathname: string): ReturnType<typeof matchRoute> {
        return matchRoute(pathname, this.root) || null;
    }

    // ========================================================================
    // 远程子表展开（ADR-0007）
    // ========================================================================

    /**
     * 遍历规范化后的骨架，把声明为远程的 `children` 收敛为待展开态
     *
     * 收敛后 `children` 一律为数组（空数组），使 `matchRoute` 与 `forEach` 无需关心
     * 非数组形态；原始声明留存在 `_childrenSource` 供解析与溯源。
     */
    private _markPending(item: AutoSparkRouteItem, path: string): void {
        const childPath = item.path && item.path !== "/" ? joinPath(path, item.path) : path;
        if (typeof item.children === "string" || item.children === true) {
            item._childrenSource = item.children;
            item.children = [];
            item._childrenState = "pending";
            this._pendingCount++;
        }
        if (Array.isArray(item.children)) {
            item.children.forEach((child) => this._markPending(child, childPath));
        }
    }

    /**
     * 收集子树内的全部待展开节点
     */
    private _collectPending(
        item: AutoSparkRouteItem,
        path: string,
        out: PendingNode[] = [],
    ): PendingNode[] {
        const childPath = item.path && item.path !== "/" ? joinPath(path, item.path) : path;
        if (item._childrenState === "pending") {
            out.push({ item, path: childPath });
        }
        if (Array.isArray(item.children)) {
            item.children.forEach((child) => this._collectPending(child, childPath, out));
        }
        return out;
    }

    /**
     * 逐层并发展开全部远程子表（BFS）
     *
     * 同层的全部远程子表并行 fetch、全部 settle 后进入下一层——总耗时 = 层数 × 单层最慢请求。
     * 深度触顶时残余节点降级为 error，保证展开过程必定收敛。
     */
    private async _expandAll(): Promise<void> {
        const maxDepth = this.router.options.maxChildrenDepth ?? DEFAULT_MAX_CHILDREN_DEPTH;
        let frontier = this._collectPending(this.root, "/");
        let depth = 0;

        while (frontier.length > 0 && depth < maxDepth) {
            depth++;
            const next: PendingNode[] = [];
            await Promise.all(
                frontier.map(async (node) => {
                    const added = await this._expandNode(node);
                    next.push(...added);
                }),
            );
            frontier = next;
        }

        if (frontier.length > 0) {
            const error = new Error(
                `[AutoSparkRouter] 远程子表展开超出最大深度 ${maxDepth}，残余 ${frontier.length} 个节点已降级`,
            );
            frontier.forEach((node) => {
                this.router.logger.warn(error.message);
                this._degrade(node.item, error);
            });
        }

        this.router.emit("routes:expanded", undefined);
    }

    /**
     * 展开单个节点的远程子表
     *
     * @returns 本次新挂载的子树内的待展开节点（供下一层处理）
     */
    private async _expandNode(node: PendingNode): Promise<PendingNode[]> {
        const { item, path } = node;
        const url = resolveChildrenUrl(
            item._childrenSource!,
            {
                path,
                name: item.name,
                meta: item.meta,
                routesFile: this.router.options.routesFile ?? DEFAULT_ROUTES_FILE,
            },
            this.router.options.base,
        );
        try {
            const data = await this._fetchChildren(url, item);
            const declared = this._toRouteItems(data, url);
            // 局部归一化：使远程子项也能写扁平 path（如 `a/b/c`）并复用同 path 覆盖语义。
            // 每次调用都产出新的路由项对象——同一地址被多处引用时运行时状态互不共享。
            const normalized = normalizeRoutes(declared);
            const mounted: AutoSparkRouteItem[] = Array.isArray(normalized.children)
                ? normalized.children
                : [];
            // 远程子项是后到的，须补跑选项继承才能与静态声明等价（namedRouteItems + 全局缺省）
            mounted.forEach((child) => this._applyRouteOptions(child));
            item.children = mounted;
            this._settle(item, "ok");
            const out: PendingNode[] = [];
            mounted.forEach((child) => {
                // 远程子项自身也可能声明了远程子表：同样收敛为待展开，交由下一层处理
                this._markPending(child, path);
                this._collectPending(child, path, out);
            });
            return out;
        } catch (e: any) {
            this._degrade(item, e instanceof Error ? e : new Error(String(e)), url);
            return [];
        }
    }

    /**
     * 取回远程子表内容
     *
     * 按 URL 缓存响应；带超时信号但**不接导航取消信号**——子表是表结构的一部分，
     * 用户点快了就掐断会让路由表永久缺一块（ADR-0007 决策 3）。
     */
    private _fetchChildren(url: string, item: AutoSparkRouteItem): Promise<any> {
        const cached = this._responseCache.get(url);
        if (cached) return cached;

        const timeout = item.timeout ?? this.router.options.routeOptions?.timeout ?? 0;
        const controller = new AbortController();
        const timer =
            timeout > 0
                ? setTimeout(() => controller.abort(new Error(`Timeout when load ${url}`)), timeout)
                : null;

        const pending = fetch(url, { signal: controller.signal })
            .then(async (response) => {
                if (!response.ok) {
                    throw new Error(`Fail when load ${url} : ${response.statusText}`);
                }
                return await response.json();
            })
            .finally(() => {
                if (timer) clearTimeout(timer);
            });

        this._responseCache.set(url, pending);
        return pending;
    }

    /**
     * 校验并归一远程响应为路由项声明数组（接受数组或单个对象）
     */
    private _toRouteItems(data: any, url: string): AutoSparkRouteItem[] {
        if (Array.isArray(data)) return data as AutoSparkRouteItem[];
        if (data && typeof data === "object") return [data as AutoSparkRouteItem];
        throw new Error(`[AutoSparkRouter] 远程子表 ${url} 返回的不是路由项声明`);
    }

    /**
     * 落账：展开成功（或失败降级），并递减待展开计数
     */
    private _settle(item: AutoSparkRouteItem, state: "ok" | "error"): void {
        if (item._childrenState === "pending") {
            this._pendingCount--;
        }
        item._childrenState = state;
    }

    /**
     * 局部降级：本节点退化为无子路由（其祖先与兄弟照常可用）
     *
     * `children` 置为 `[]` 而非 `undefined`——保持类型稳定，匹配与遍历不炸。
     */
    private _degrade(item: AutoSparkRouteItem, error: Error, url?: string): void {
        item.children = [];
        this._settle(item, "error");
        this.router.emit("routes:error", { url, path: item.path, error });
    }

    /**
     * 规范化路由配置
     * 将全局配置应用到路由选项
     */
    private _applyRouteOptions(route: AutoSparkRouteItem): void {
        const overrideItems = ["keepAlive", "cache", "timeout", "preload"];
        const processRoute = (r: AutoSparkRouteItem) => {
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
                    // 全局 routeOptions 仅作缺省值：路由项显式声明优先（方向反了会令全局
                    // 配置对未声明路由失效、且反向覆盖路由显式值，ADR-0003 默认翻转语义）
                    // @ts-ignore
                    if (r[item] === undefined && routeOptions[item] !== undefined) {
                        // @ts-ignore
                        r[item] = routeOptions[item];
                    }
                });
            }
            // 递归处理子路由
            if (Array.isArray(r.children)) {
                r.children.forEach(processRoute);
            }
        };
        processRoute(route);
    }
    /**
     * 从根节点开始遍历路由表
     * @param callback
     */
    forEach(callback: (route: AutoSparkRouteItem, parent: AutoSparkRouteItem | null) => void): void {
        function forEachRoute(route: AutoSparkRouteItem, parent: AutoSparkRouteItem | null): void {
            callback(route, parent);
            if (Array.isArray(route.children)) {
                route.children.forEach((child) => forEachRoute(child, route));
            }
        }
        forEachRoute(this.root, null);
    }
}