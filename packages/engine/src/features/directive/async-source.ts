/**
 * AsyncSourceRunner —— 异步源家族的共享取数执行器（ADR-0035 决策 5，ADR-0121 收编）。
 *
 * x-data 与 x-html 异步逻辑的**逐字重复面**精确收敛于此：形态判定入口、url 插值 →
 * watch 依赖重取、action 调用（getAction 链 + 类 x-on 上下文）。两物种指令**持有**本类
 * 实例（组合优于继承——拒绝指令基类：DataDirective 的主体与异步无关，is-a 不成立）。
 *
 * **ADR-0121**：执行内核统一收编到 AsyncLoader（远程加载统一内核，见 remote-load.ts）——
 * 中止 / 超时 / 重试 / 缓存白得；fetch 通道经 `createRemoteLoader`（fetcher 出站口 +
 * request/method/header 合并 + res.ok 归一），action 形态走同源 AsyncLoader 编排
 * （loaderFn = action 调用，重试 = 重新调用 action；timeout 语义 = 「放弃等待」）。
 * lastUrl 判重与「当前 loader 身份校验」留在本层（适配层职责，决策 1）。
 *
 * 落地点统一走 `get()`/`refresh()` 的 **Promise**（而非 onPending/onFulfilled 回调）——
 * AsyncLoader 缓存命中不触发回调但 Promise 照常 resolve，回调模型会漏掉缓存命中落数。
 *
 * 物种差异经回调注入（钩子契约不变）：
 * - `responseParser`：fetch 响应解析（x-data：`res.json()`；x-html：`res.text()`）；
 * - `onLoading` / `onResult` / `onError`：状态反馈与产物消费（元键 / 覆盖层 / 落域 / 注入）。
 *
 * 无 DOM 耦合（仅经 binding 求值与查 action），可独立单测；未来第三家异步源指令
 * （如 x-for 远程列表）即持即用。
 */
import type { AutoSparkScope } from "../../engine/scope";
import { AsyncLoader } from "asyncsignal/loader";
import {
    createRemoteLoader,
    normalizeLoadError,
    resolveLoaderOptions,
    type RemoteLoadMeta,
} from "./remote-load";
import { buildUrlWatchExpr, detectDataForm, parseActionRef } from "./async-source-utils";

/** 物种指令注入的回调集 */
export interface AsyncSourceHooks {
    /** fetch 响应解析（x-data：`res.json()`；x-html：`res.text()`）。`!res.ok` 已由内核抛错 */
    responseParser: (res: Response) => Promise<unknown>;
    /** 请求发起（首取与每次依赖重取；x-data 写 `$loading`、x-html 切覆盖层） */
    onLoading: () => void;
    /** 产物到达（**原始值**——物种指令自行校验/映射/落地，如对象-only / text-only） */
    onResult: (value: unknown) => void;
    /** 失败（HTTP 错误 / 网络错误 / action 抛错）。warn 日志由物种侧执行（带指令名前缀） */
    onError: (err: Error) => void;
}

/**
 * 创建异步源公共 onError 回调（DRY：data.ts 与 html.ts 的 warn + 调度模式统一）。
 *
 * @param warnFn   指令级 warn 方法（基类 protected warn）
 * @param handler  物种特定的失败处理（设置 $error / 覆盖层状态等）
 */
export function createAsyncOnError(
    warnFn: (msg: string) => void,
    handler: (err: Error) => void,
): (err: Error) => void {
    return (err) => {
        warnFn(err.message);
        handler(err);
    };
}

export class AsyncSourceRunner {
    /** 上次已请求的 url（依赖变化但插值结果未变 → 跳过重取） */
    private lastUrl: string | null = null;
    /** 当前加载的 AsyncLoader 实例（url 变化重取 = abort 旧 + 新建；action 实参变化同理） */
    private currentLoader: AsyncLoader<unknown, RemoteLoadMeta> | null = null;
    /** url 形态：本轮加载的外部中止信号（destroy / 重取时 abort——决策 3 不重试不呈现） */
    private abortCtrl: AbortController | null = null;
    /** destroy 后拒收一切在途结果 */
    private destroyed = false;

    constructor(
        /** 宿主 scope：url 插值 / action 实参经其 watch 求值（依赖自动收集），action 经 getAction 链查找 */
        private binding: AutoSparkScope,
        /** 选项读取（指令 getOption 闭包：method / header / request / retry / timeout / cache …） */
        private getOption: (key: string) => any,
        private hooks: AsyncSourceHooks,
    ) {}

    /**
     * 启动：形态判定（detectDataForm）+ watch 接线 + 首次取数。
     *
     * url 形态经 `buildUrlWatchExpr` 转模板字面量 watch（插值依赖变化自动重取）；
     * action 形态实参经 `[实参]` 数组字面量 watch（依赖变化对称重执行）。
     */
    start(raw: string): void {
        if (detectDataForm(raw) === "url") {
            const expr = buildUrlWatchExpr(raw);
            const first = this.binding.watch(expr, ({ value }) => void this.loadUrl(String(value)));
            void this.loadUrl(String(first));
        } else {
            const { name, argsExpr } = parseActionRef(raw);
            if (argsExpr) {
                const first = this.binding.watch(`[${argsExpr}]`, ({ value }) =>
                    void this.invokeAction(name, Array.isArray(value) ? value : [value]),
                );
                void this.invokeAction(name, Array.isArray(first) ? (first as any[]) : [first]);
            } else {
                void this.invokeAction(name, []);
            }
        }
    }

    /**
     * 手动重试弹药（决策 4）：执行体 = 当前 loader 的 `refresh()`（在途先中止再重启），
     * 落地与首取同路径（wireLanding）。返回落定 Promise（x-error 的 retryLoad 弹药语义：
     * resolved 后清除呈现；失败经新一轮 dispatchLoadError 更新呈现）。
     */
    retry(): Promise<unknown> | undefined {
        const loader = this.currentLoader;
        if (!loader) return undefined;
        return this.wireLanding(loader, loader.refresh());
    }

    /**
     * url 形态取数（ADR-0033 决策 5 / ADR-0121）：走统一内核——method/header/request 选项
     * 合并（request 显式键优先）、`!res.ok` 归一、超时 / 重试 / 缓存由 AsyncLoader 编排；
     * 重取时 abort 上一 loader；url 全值相同跳过（lastUrl 判重）。
     */
    private loadUrl(url: string): void {
        if (this.destroyed || this.lastUrl === url) return;
        this.lastUrl = url;
        this.abortCurrent();
        const ctrl = (this.abortCtrl = new AbortController());
        const loader = createRemoteLoader({
            engine: this.binding.engine,
            url,
            getOption: this.getOption,
            responseParser: this.hooks.responseParser,
            abortSignal: ctrl.signal,
        });
        this.currentLoader = loader;
        this.wireLanding(loader, loader.get());
    }

    /**
     * action 形态取数（ADR-0033 决策 6 / ADR-0121 决策 3）：getAction 链查找（局部
     * autospark/actions → 全局 engine.actions）；命令式直调（this = 类 x-on 的上下文形态）。
     * loaderFn = action 调用（AsyncLoader 重试 = 重新调用 action）；**无真中止**——destroy
     * / 取代靠「当前 loader 身份校验 + destroyed 标志」保证在途结果不落地（timeout 语义 =
     * 「放弃等待」，无法中止同步执行中的 action）。
     */
    private invokeAction(name: string, args: any[]): void {
        if (this.destroyed) return;
        this.abortCurrent();
        const loader = new AsyncLoader<unknown, RemoteLoadMeta>(
            async () => {
                const desc = this.binding.getAction(name);
                if (!desc) {
                    throw new Error(`未找到 action "${name}"（局部 autospark/actions → 全局 engine.actions）`);
                }
                const ctx = {
                    el: this.binding.el,
                    data: this.binding.getContext(),
                    scope: this.binding,
                    store: this.binding.engine.store,
                    state: this.binding.engine.store.state,
                    engine: this.binding.engine,
                };
                return await desc.handle.call(ctx, ...args);
            },
            { ...resolveLoaderOptions(this.getOption), autostart: false },
        );
        this.currentLoader = loader;
        this.wireLanding(loader, loader.get());
    }

    /**
     * 统一落地点：发起即 onLoading（含清上轮错误语义，由物种钩子承载）→ Promise 落定分流
     * onResult / onError。仅「当前 loader + 未销毁」的结果落地；主动 abort（AbortError）
     * 静默丢弃（决策 3：不重试、不呈现、不算错误）。返回落定链（retry 弹药复用）。
     */
    private wireLanding(
        loader: AsyncLoader<unknown, RemoteLoadMeta>,
        p: Promise<unknown>,
    ): Promise<unknown> {
        this.hooks.onLoading();
        return p.then(
            (value) => {
                if (this.destroyed || loader !== this.currentLoader) return;
                this.hooks.onResult(value);
            },
            (err: unknown) => {
                if (this.destroyed || loader !== this.currentLoader) return;
                if ((err as Error)?.name === "AbortError") return;
                this.hooks.onError(normalizeLoadError(err, loader.meta));
            },
        );
    }

    /** 中止当前在途加载（url 变化 / 实参变化 / destroy 共用）：abort 信号 + abort loader（静默不重试） */
    private abortCurrent(): void {
        this.abortCtrl?.abort();
        this.abortCtrl = null;
        this.currentLoader?.abort();
        this.currentLoader = null;
    }

    /** 销毁：中止进行中加载（ADR-0033 决策 7——action 在途结果不落地） */
    destroy(): void {
        this.destroyed = true;
        this.abortCurrent();
    }
}
