/**
 * 远程加载统一内核（ADR-0121）：六处远程加载（异步 x-data / x-html、x-component loader、
 * x-import、x-isolate remote、x-icons 远程源）共享的执行内核装配层。
 *
 * 分工：**家族适配层**管「形态判定 + watch 接线 + 产物消费 + 错误归一」（各指令私有），
 * **AsyncLoader** 管「怎么取」（中止 / 超时 / 重试 / 缓存 / multiplex / 生命周期回调），
 * 本模块是两者之间的装配缝——loaderFn 工厂（fetcher 出站口 → request/method/header 合并 →
 * res.ok 检查 → responseParser）、统一错误对象归一、指令选项 → AsyncLoader 选项映射、
 * retry action 与 x-error 事件派发两件公共弹药。
 *
 * 无 DOM / 无物种耦合，可独立单测。
 */
import { AsyncLoader, type AsyncLoaderOptions, type IAsyncLoader } from "asyncsignal/loader";
import type { AutoSpark } from "../../engine/engine";
import type { AutoSparkAction } from "../action/types";
/** AsyncLoader meta 载体（决策 5：statusCode 经 meta 透出——loaderFn 写入、适配层读回） */
export interface RemoteLoadMeta {
    /** 本次请求的 url（hash / 错误归一 / 调试共用） */
    url: string;
    /** HTTP 状态码（!res.ok 时写入；网络错误无此字段） */
    statusCode?: number;
}
/**
 * 统一错误对象（决策 5）：Error 实例 + 结构化字段。
 *
 * 保持 Error 实例身份（x-data `$error` 元键契约为 Error 实例），同时携带
 * `url` / `statusCode` / `source:"load"` 供 x-error 归一化与调试读取。
 */
export interface RemoteLoadError extends Error {
    url?: string;
    statusCode?: number;
    source: "load";
}
/** fetch 通道 loaderFn 装配入参 */
export interface FetchLoaderSpec {
    /** 引擎实例（fetcher 出站口读取点，决策 8） */
    engine: AutoSpark;
    /** 请求 url（适配层已插值完成） */
    url: string;
    /** 指令选项读取闭包（request / method / header） */
    getOption: (key: string) => any;
    /** 物种响应解析（x-data：res.json()；x-html / x-isolate：res.text()） */
    responseParser: (res: Response) => Promise<unknown>;
}
/** createRemoteLoader 装配入参（loaderFn 缺省 = fetch 通道；action 形态注入自定义 loaderFn） */
export interface RemoteLoaderSpec {
    engine: AutoSpark;
    getOption: (key: string) => any;
    /** 物种加载函数；缺省时按 url + responseParser 组装 fetch 通道 */
    loaderFn?: IAsyncLoader<unknown, RemoteLoadMeta>;
    /** fetch 通道必填（同时作 hash / meta.url）；自定义 loaderFn 时仅作 hash/meta 用途可缺省 */
    url?: string;
    /** fetch 通道必填：物种响应解析 */
    responseParser?: (res: Response) => Promise<unknown>;
    /** 外部中止信号（destroy / url 变化重取时 abort——主动 abort 不重试、不呈现） */
    abortSignal?: AbortSignal;
    /** 生命周期回调（映射物种钩子契约：onLoading / onResult / onError） */
    onLoading?: () => void;
    onResult?: (value: unknown) => void;
    onError?: (err: RemoteLoadError) => void;
}
/**
 * 合并请求 init（决策 7：request 权威整包通道 + method/header 便捷简写，**request 显式键优先**）。
 *
 * - `request`（RequestInit 对象）整体为基底；
 * - `method` 简写仅在 request 未显式给 method 时生效（默认 GET 由 fetch 自身兜底）；
 * - `header` 简写同理（对 request.headers）；
 * - `signal` 恒由内核接管（AsyncLoader 合并信号——超时 + 主动 abort），用户 request.signal 被覆盖。
 */
export declare function resolveRequestInit(getOption: (key: string) => any, signal: AbortSignal): RequestInit;
/**
 * fetch 通道 loaderFn 工厂（决策 1/7/8）：
 * `engine.options.fetcher`（缺省 = 原生 fetch）单点出站 → init 合并 → `!res.ok` 抛错
 * （statusCode 写 meta）→ 物种 responseParser。中止信号恒透传（含超时合并信号）。
 */
export declare function createFetchLoaderFn(spec: FetchLoaderSpec): IAsyncLoader<unknown, RemoteLoadMeta>;
/**
 * 最终错误（重试耗尽）归一为统一错误对象（决策 5）：Error 实例 + url/statusCode/source 字段。
 * 非 Error 值（字符串 / 普通对象）兜成 Error。
 */
export declare function normalizeLoadError(err: unknown, meta?: RemoteLoadMeta): RemoteLoadError;
/**
 * 指令选项 → AsyncLoader 选项映射（决策 3/9）：
 * `retry` / `retryDelay` / `timeout` / `cache` 原样透传（默认全 0 = 行为零变化）；
 * 非数字 / 负数静默归 0（指令选项来自 relaxed-json，类型容错姿态同 x-data 各选项）。
 */
export declare function resolveLoaderOptions(getOption: (key: string) => any): Pick<AsyncLoaderOptions<unknown, RemoteLoadMeta>, "retry" | "retryDelay" | "timeout" | "cache">;
/**
 * 装配 AsyncLoader（决策 1）：loaderFn（fetch 通道缺省组装 / action 形态自定义注入）+
 * 指令选项映射 + meta（url 载体）+ 生命周期回调映射。
 *
 * - `hash` 恒 = url（决策 9：`cache>0` 时跨实例缓存命中以 url 归一）；
 * - `autostart:false` 恒定：由调用方在拿到实例后显式 `get()` 启动——避免构造期同步
 *   触发回调时闭包引用未就位（TDZ），也让「先存引用再启动」成为唯一时序；
 * - onRejected 过滤 AbortError（主动 abort 静默丢弃——不重试、不呈现、不算错误，决策 3）；
 * - 其余最终错误经 normalizeLoadError 归一后交物种 onError。
 */
export declare function createRemoteLoader(spec: RemoteLoaderSpec): AsyncLoader<unknown, RemoteLoadMeta>;
/**
 * 统一 retry action 弹药（决策 4）：执行体 = `loader.refresh()`（在途先中止再重启）。
 * 家族适配层注入宿主 `scope.actions`，错误呈现内 `@click="retry"` 经 getAction 链命中。
 * 用户同名 action 存在时由适配层裁决（不覆盖用户声明）。
 */
export declare function createRetryAction(loader: AsyncLoader<unknown, RemoteLoadMeta>): AutoSparkAction;
/**
 * load 错误源事件派发（决策 5：x-error 第三错误源）：宿主元素派发 `error` CustomEvent
 * （bubbles + composed，与 buildAction 桥接 / raise 同款通道），detail.error 为归一化
 * 普通对象（Error 实例不进响应式域，ADR-0118 决策 6）；detail.retry 携带重试弹药
 * （x-error 的 retry 执行体 = loader.refresh()）。
 */
export declare function dispatchLoadError(el: HTMLElement, err: RemoteLoadError, retry: () => void): void;
