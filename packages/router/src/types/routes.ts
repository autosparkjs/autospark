/**
 * 路由配置相关类型定义
 */

import type {
    AfterRenderHook,
    AfterRouteHook,
    BeforeRenderHook,
    BeforeRouteHook,
    RouteErrorHook,
} from "./hooks";
import type { AutoSparkRouteDataOptions } from "./data";
import type { AutoSparkRouteDataSource } from "./data";
import type { ErrorBoundaryOptions, RetryOptions } from "./config";
import type { ModalConfig } from "./modals";
import type { IAsyncSignal } from "asyncsignal";
import type { AsyncLoader } from "asyncsignal/loader";
import type { BaseLoaderOptions } from "@/features/baseLoader";
import type { DataLoaderMeta } from "@/features/dataLoader";
import type { AutoSparkRouterViewRendererBase } from "@/renderers/base";
// 重新导出 RouteData 以保持向后兼容
export type { AutoSparkRouteDataSource as RouteData };

// 重新导出模态相关类型以保持向后兼容
export type { ModalConfig, ModalState, ModalStackItem, ModalOptions } from "./modals";

// ============================================================================
// 渲染系统相关类型定义
// ============================================================================

/**
 * 渲染模式枚举
 * - replace: 替换模式，新内容替换 outlet 中的旧内容（默认）
 * - append: 追加模式，新内容添加到现有内容之后
 */
export type AutoSparkRenderMode = "replace" | "append";

/**
 * 模板数据类型
 * 用于存储模板变量和对应的值
 */
export type TemplateData = Record<string, any>;

/**
 * 视图源类型
 *
 * - string: 视图URL，用于从远程加载HTML内容
 * - HTMLElement: 直接使用指定的HTMLElement元素作为视图内容
 * - () => Promise<any>: 通过函数动态加载视图，支持动态导入和异步加载
 */
export type AutoSparkRouteViewSource =
    | string
    | HTMLElement
    | ((route: AutoSparkMatchedRouteItem) => string | HTMLElement | Promise<string | HTMLElement>);
/**
 * 渲染上下文接口
 * 提供模板渲染时所需的上下文数据
 */
export interface AutoSparkRouteViewContext {
    /**
     * 当前路由对象，包含预加载的数据
     */
    $route: AutoSparkRouteItem;
    /**
     * 查询参数对象
     */
    $query: Record<string, string>;
    /**
     * 路由参数对象
     */
    $params: Record<string, string>;
    /**
     * route.data 的字段会被展开为局部变量
     * 允许通过键值对访问其他上下文数据
     */
    [key: string]: any;
}

/**
 * 渲染选项接口
 * 配置组件渲染行为
 */
export interface AutoSparkRenderOptions {
    /**
     * 渲染模式（默认 replace）
     */
    mode?: AutoSparkRenderMode;

    /**
     * 目标 outlet 元素
     */
    outlet?: HTMLElement;

    /**
     * 模板字符串（可选）
     */
    template?: string;
}

// ============================================================================
// 组件加载相关类型定义
// ============================================================================

/**
 * 视图加载配置选项
 * 当 view 需要特殊配置时使用
 */
export interface AutoSparkRouteViewOptions<T = string> extends BaseLoaderOptions<T> {
    renderer?: AutoSparkRouterViewRendererBase;
}
/**
 * 路由配置项
 */
export interface AutoSparkRouteItem {
    name?: string;

    /**
     * 路由路径，支持以下语法：
     * - 静态路径：/user、/about
     * - 动态参数：/user/:id、/user/<id>
     * - 正则约束：/user/:id(\d+)
     * - 通则符：* 匹配任意路径
     */
    path: string;

    /**
     * 路由标题，通常用于显示在导航菜单或标签页上
     */
    title?: string;

    /**
     * 调用url加载HTML时传递的路由参数
     */
    query?: Record<string, any>;

    /**
     * 调用url加载HTML时传递的路由参数
     */
    params?: Record<string, any>;

    /**
     * 路由图标，通常用于显示在导航菜单上
     */
    icon?: string;

    /**
     * 路由显示组件
     *
     * 可以是以下两种类型之一：
     *
     * 1. ViewSource - 视图源：
     *    - string: 从此路径加载HTML内容，支持相对路径和绝对路径
     *    - HTMLElement: 使用指定的HTMLElement元素作为路由显示组件
     *    - () => Promise<any>: 通过动态导入函数加载组件，支持本地组件和远程HTML内容
     *
     * 2. ViewOptions - 视图配置：
     *    - from: ViewSource - 视图源
     *    - allowUnsafeHTML: 是否允许不安全的HTML（默认 false）
     *    - timeout: 加载超时时间（默认 5000ms）
     *    - selector: 自定义内容提取选择器
     */
    view?: AutoSparkRouteViewSource | AutoSparkRouteViewOptions;
    /**
     * 内部属性：视图模板缓存
     * 用于存储已加载的视图内容，避免重复加载
     * 包含缓存内容和缓存时间戳
     *
     * 同一视图的视图数据是一样的
     *
     * @internal
     */
    _getView?: IAsyncSignal<string | HTMLElement> | null;
    _viewOptions?: Required<AutoSparkRouteViewOptions>;
    /**
     *
     * 在导航到此路由时预加载的数据，可以是以下类型：
     *
     * 这些数据会被作为路由视图渲染时使用的变量
     */
    data?: AutoSparkRouteDataSource | AutoSparkRouteDataOptions | true;
    /**
     * 缓存数据
     *
     * 不同url可能数据是不同的，比如/posts/:id
     * 调用不同的id参数时，需要分别进行加载和缓存
     *
     * 实际载体：DataLoader 写入 AsyncLoader 实例（非可调用体，结果经 `.signal` 取得）；
     * 兼容旧通道时也可能是可调用的 IAsyncSignal。取值侧见 features/render 的 _loadSignal。
     */
    _getData?:
    | AsyncLoader<Record<string, any>, DataLoaderMeta>
    | IAsyncSignal<Record<string, any>>
    | null;
    _dataOptions?: Required<AutoSparkRouteDataOptions>;
    /**
     * 内部属性：本路由项 view 通道最近一次加载的结果标记
     * "ok" = 加载成功（公共层跳过的前提，ADR-0004）；"error" = 失败（公共层也重新加载）。
     * 挂在持久路由表项上——生命周期 = 路由表（应用级），页面刷新才重置。
     *
     * @internal
     */
    _viewLoadState?: "ok" | "error";
    /** 内部属性：本路由项 data 通道最近一次加载的结果标记（语义同 {@link _viewLoadState}）
     * @internal
     */
    _dataLoadState?: "ok" | "error";
    /**
     * 是否缓存此路由对应的视图（KeepAlive 两级优先级的中层声明，ADR-0003）
     *
     * 优先级：出口 `mode=tabs`（全视图常驻）> 本字段显式声明 > 出口 `keepAlive` prop（默认 false）。
     * **默认已翻转**：路由与出口均未声明时不再缓存（ADR-0002 时代默认缓存）。
     *
     * 缓存的视图离开时不销毁（DOM 常驻、x-show 隐藏），再次进入时原样复用——
     * 表单输入等运行态保留。这对于需要保持状态的页面（表单页、数据列表页）非常有用。
     *
     * 解析为 false 时，视图走临时容器、每次进入重编译，离开即无态可丢。
     */
    keepAlive?: boolean;
    /** 缓存时间（毫秒），0 表示不缓存 */
    cache?: number;
    /** 加载超时时间（毫秒） */
    timeout?: number;
    /**
     * 在load(url)方法加载HTML时，是否显示全局Loading组件，默认为 true
     * - true：显示全局Loading组件，直到HTML内容加载完成后才隐藏
     * - false：不显示全局Loading组件，HTML内容加载过程中不会有任何加载提示
     * - string：显示自定义的HTML内容作为加载提示，直到HTML内容加载完成后才隐藏
     * - HTMLElement：显示指定的HTMLElement元素作为加载提示，直到HTML内容加载完成后才隐藏
     */
    loading?: boolean | string | HTMLElement;

    /**
     * 视图哈希标识
     
     * 路由哈希标识，用于视图缓存与 keepAlive 复用判定（同 hash 同 ready 的视图仅激活不重渲染）
     * 支持字符串插值，可用变量：
     * - {path}: 路由模式路径（如 /products/:category，不含实际参数值）
     * - {url}: 解析后的实际 URL（如 /products/smartphones）
     * - {basepath}: 基础路径
     * - {timestamp}: 时间戳 
     * @default "{url}"
     * @example
     * hash: "user-{params.id}" // 生成类似 "user-123" 的哈希
     * hash: "posts-{query.category}" // 生成类似 "posts-tech" 的哈希
     */
    hash?: string;
    /**
     * 是否预加载视图
     *
     * - true: 在初始化时自动加载视图数据
     */
    preload?: boolean;
    /**
     * 重定向到其他路由
     * 支持绝对路径和相对路径
     * - string: 重定向到指定路径（默认 replace 模式）
     * - NamedRedirectTarget: 命名路由重定向 { name: 'home' }
     * - RedirectResult: 重定向到指定路径并指定模式 { path: '/target', mode: 'push' }
     * - RedirectFunction: 动态计算重定向目标
     */
    redirect?: RedirectTarget | RedirectFunction;
    /**
     * 路由别名（URL 不变，使用目标路由配置）
     */
    alias?: string | string[];
    /**
     * 子路由声明，三种形态（ADR-0007）：
     *
     * 1. `AutoSparkRouteItem[]` — 静态子路由项数组
     * 2. `string` — **远程子表**：远程地址，初始化期取回子路由项声明并展开为本节点的子路由
     * 3. `true` — **约定子表**：远程子表的约定式简写，地址取 `options.routesFile`（默认 `routes.json`）
     */
    children?: AutoSparkRouteChildren;
    /**
     * 内部属性：远程子表的展开状态（ADR-0007 决策 3）
     *
     * - `"pending"` = **待展开**——已声明为远程但尚未就位；匹配到此只能判定为「未知」，
     *   而非「该节点无子路由」（首屏 unmatched 重试与运行时导航挂起都以此为前提）
     * - `"ok"` = 展开成功
     * - `"error"` = 失败或触顶降级，本节点退化为无子路由
     *
     * @internal
     */
    _childrenState?: "pending" | "ok" | "error";
    /**
     * 内部属性：远程子表的原始声明（`string` 地址 或 `true` 约定式简写），展开后仍保留以便溯源
     * @internal
     */
    _childrenSource?: string | true;
    /**
     * 内部属性：本节点子表是否来自自动发现（ADR-0010）
     *
     * `true` = 探测节点（**投机性请求**）：404 / 200 但非 JSON 为阴性结果，静默落定为
     * 无子路由；网络错误/5xx 仍降级。显式声明（`children: true | string`）为
     * **断言性请求**，失败一律报错——两类来源的错误分级全凭此标记区分。
     *
     * @internal
     */
    _autoProbe?: boolean;
    meta?: Record<string, any>;

    beforeRoute?: BeforeRouteHook | BeforeRouteHook[];
    afterRoute?: AfterRouteHook | AfterRouteHook[];
    beforeRender?: BeforeRenderHook | BeforeRenderHook[];
    afterRender?: AfterRenderHook | AfterRenderHook[];
    routeError?: RouteErrorHook | RouteErrorHook[];

    /**
     * 错误边界配置
     */
    errorBoundary?: ErrorBoundaryOptions;
    /**
     * 当导航到此出错进的回退路由
     */
    fallback?: string;
    /**
     * 重试策略配置
     */
    retry?: RetryOptions;

    /**
     * 模态路由配置
     * - boolean: true 表示为模态路由，使用默认配置
     * - ModalConfig: 自定义模态配置
     */
    modal?: boolean | ModalConfig;

    /**
     * 是否为默认路由
     * 当父路由路径完全匹配但没有其他子路由匹配时，会自动选择此路由
     *
     * 默认路由的判断标准（按优先级）：
     * 1. path 为 "" 或 "/" 或 "./" （高优先级）
     * 2. 或者显式设置 default: true （低优先级）
     * 3. 当有多个默认路由时，按配置顺序选择第一个
     */
    default?: boolean;
}

/**
 * 子路由声明（ADR-0007）
 *
 * - `AutoSparkRouteItem[]`：静态子路由项
 * - `string`：**远程子表**地址
 * - `true`：**约定子表**简写，地址取 `options.routesFile`
 */
export type AutoSparkRouteChildren = AutoSparkRouteItem[] | string | true;

/**
 * 路由配置类型
 * 支持多种配置形式
 * 路由配置类型
 * 支持多种配置形式：
 * - 对象：具有一个根路由的路由配置
 * - 数组：多个根路由 配置
 * - 字符串：URL路径，从该路径加载路由表
 * - 函数：动态返回路由配置
 */
export type AutoSparkRoutes =
    | AutoSparkRouteItem[]
    | AutoSparkRouteItem
    | string
    | (() =>
        | AutoSparkRouteItem[]
        | AutoSparkRouteItem
        | Promise<AutoSparkRouteItem>
        | Promise<AutoSparkRouteItem[]>);

export type NormalizedAutoSparkRoutes = {
    path: "/";
    children?: AutoSparkRouteItem[];
} & Omit<AutoSparkRouteItem, "path" | "children">;

/**
 * 路由匹配结果
 */
export interface MatchedRoute {
    /** 匹配的路由配置 */
    route: AutoSparkRouteItem;
    /** 提取的路径参数 */
    params: Record<string, string>;
    /** 提取的查询参数 */
    query: Record<string, string>;

    /** 剩余未匹配的路径，用于嵌套路由 */
    remainingPath: string;
}

// ============================================================================
// 重定向相关类型定义
// ============================================================================

/**
 * 命名路由重定向目标
 */
export interface NamedRedirectTarget {
    /** 目标路由名称 */
    name: string;
    /** 要替换的参数 */
    params?: Record<string, string>;
    /** 要合并的查询参数 */
    query?: Record<string, string>;
    /** 重定向模式 */
    mode?: "replace" | "push";
    /** 目标窗口：_self 当前窗口，_blank 新窗口 */
    target?: "_self" | "_blank";
}

/**
 * 重定向结果对象
 */
export interface RedirectResult {
    /** 目标路径 */
    path: string;
    /** 重定向模式（默认 'replace'） */
    mode?: "replace" | "push";
    /** 要合并的状态数据 */
    state?: Record<string, any>;
    /** 目标窗口：_self 当前窗口，_blank 新窗口 */
    target?: "_self" | "_blank";
}

/**
 * 重定向目标类型（合并所有形式）
 */
export type RedirectTarget = string | NamedRedirectTarget | RedirectResult;

/**
 * 重定向函数类型
 * @param route - 当前匹配的路由项
 * @returns 重定向目标或结果对象
 */
export type RedirectFunction = (route: AutoSparkMatchedRouteItem) => RedirectTarget | null;

// ============================================================================
// 路由匹配相关类型定义
// ============================================================================

export type AutoSparkMatchedRouteItem = {
    /** 匹配的路由配置 */
    route: AutoSparkRouteItem | undefined;
    /** 提取的路径参数 */
    params: Record<string, string | number>;
    /** 提取的查询参数 */
    query: Record<string, string>;
    state: Record<string, any>;
    /** 目标窗口：_self 当前窗口，_blank 新窗口 */
    target?: "_self" | "_blank";
    /**
     * 完整路由路径
     * 保留路由参数
     * /user/:id/
     *
     *
     */
    path: string;
    /**
     * 经过路由参数处理的完整路由路径
     *
     * 如： route.path=/user/:id/
     * 时url=/user/123
     *
     * path和url的区别是：

     * path是路由的原始路径， 包含路由参数

     * url是经过路由参数处理后的路径， 路由参数已经被替换为实际的值
     *
     */
    url: string;

    /**
     * 计算后的路由视图哈希标识
     */
    hash: string;
    id: number;
    /**
     * 重定向历史记录数组
     * 记录从原始路径到当前路径的完整重定向链
     * @example [{ url: '/old-path', mode: 'replace' }, { url: '/intermediate', mode: 'push' }]
     * 表示从 /old-path(replace) -> /intermediate(push) -> 当前路径
     */
    redirectFrom?: Array<{ url: string; mode: "replace" | "push" }>;
    /**
     * 匹配错误
     * 当路由匹配或重定向过程中发生错误时设置
     * 渲染层可通过此字段渲染错误页面
     */
    error?: Error;
};
