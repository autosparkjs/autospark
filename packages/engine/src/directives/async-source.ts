/**
 * AsyncSourceRunner —— 异步源家族的共享取数执行器（ADR-0035 决策 5）。
 *
 * x-data 与 x-html 异步逻辑的**逐字重复面**精确收敛于此：形态判定入口、url 插值 →
 * watch 依赖重取、fetch（url 判重 / 请求序号竞态丢弃 / AbortController / method /
 * header）、action 调用（getAction 链 + 类 x-on 上下文）。两物种指令**持有**本类
 * 实例（组合优于继承——拒绝指令基类：DataDirective 的主体与异步无关，is-a 不成立）。
 *
 * 物种差异经回调注入：
 * - `responseParser`：fetch 响应解析（x-data：`res.json()`；x-html：`res.text()`）；
 * - `onLoading` / `onResult` / `onError`：状态反馈与产物消费（元键 / 覆盖层 / 落域 / 注入）。
 *
 * 无 DOM 耦合（仅经 binding 求值与查 action），可独立单测；未来第三家异步源指令
 * （如 x-for 远程列表）即持即用。
 */
import type { AutoSparkScope } from "../scope";
import { buildUrlWatchExpr, detectDataForm, parseActionRef } from "./presets/async-source";

/** 物种指令注入的回调集 */
export interface AsyncSourceHooks {
    /** fetch 响应解析（x-data：`res.json()`；x-html：`res.text()`）。`!res.ok` 已由 runner 抛错 */
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
    /** 请求序号：竞态丢弃过期响应（后发先至的旧响应直接扔，ADR-0033 决策 5） */
    private loaderSeq = 0;
    /** url 形态：进行中请求的中止器（destroy / 重取时 abort） */
    private abortCtrl: AbortController | null = null;
    /** 上次已请求的 url（依赖变化但插值结果未变 → 跳过重取） */
    private lastUrl: string | null = null;
    /** destroy 后拒收一切在途结果 */
    private destroyed = false;

    constructor(
        /** 宿主 scope：url 插值 / action 实参经其 watch 求值（依赖自动收集），action 经 getAction 链查找 */
        private binding: AutoSparkScope,
        /** 选项读取（指令 getOption 闭包：method / header） */
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
            const first = this.binding.watch(expr, ({ value }) => void this.fetchUrl(String(value)));
            void this.fetchUrl(String(first));
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
     * url 形态取数（ADR-0033 决策 5）：method 选项直传 fetch（默认 GET）、header 选项传
     * headers；`!res.ok` → 加载失败；重取时 abort 上一请求；过期响应（序号不匹配 /
     * 已销毁）丢弃；url 全值相同跳过（lastUrl 判重）。
     */
    private async fetchUrl(url: string): Promise<void> {
        if (this.destroyed || this.lastUrl === url) return;
        this.lastUrl = url;
        const seq = ++this.loaderSeq;
        this.abortCtrl?.abort();
        const ctrl = (this.abortCtrl = new AbortController());
        this.hooks.onLoading();
        try {
            const method = String(this.getOption("method") ?? "GET").toUpperCase();
            const headers = this.getOption("header");
            const init: RequestInit = { method, signal: ctrl.signal };
            if (headers && typeof headers === "object") (init as any).headers = headers;
            const res = await fetch(url, init);
            if (!res.ok) throw new Error(`HTTP ${res.status}${res.statusText ? ` ${res.statusText}` : ""}`);
            const value = await this.hooks.responseParser(res);
            if (seq !== this.loaderSeq || this.destroyed) return;
            this.hooks.onResult(value);
        } catch (e: any) {
            if (this.destroyed || seq !== this.loaderSeq || e?.name === "AbortError") return;
            this.hooks.onError(e instanceof Error ? e : new Error(String(e)));
        }
    }

    /**
     * action 形态取数（ADR-0033 决策 6）：getAction 链查找（局部 autospark/actions →
     * 全局 engine.actions）；命令式直调（this = 类 x-on 的上下文形态，buildAction 包装的
     * 信号语义照常）；无 AbortController——destroy 以序号 + destroyed 标志保证结果不落地。
     * 值恒为 ActionDesc 描述符（ADR-0036），取 .handle 调用——行为不变。
     */
    private async invokeAction(name: string, args: any[]): Promise<void> {
        if (this.destroyed) return;
        const seq = ++this.loaderSeq;
        this.hooks.onLoading();
        try {
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
            const result = await desc.handle.call(ctx, ...args);
            if (seq !== this.loaderSeq || this.destroyed) return;
            this.hooks.onResult(result);
        } catch (e: any) {
            if (this.destroyed || seq !== this.loaderSeq) return;
            this.hooks.onError(e instanceof Error ? e : new Error(String(e)));
        }
    }

    /** 销毁：中止进行中 fetch + 序号失效（action 在途结果不落地，ADR-0033 决策 7） */
    destroy(): void {
        this.destroyed = true;
        this.loaderSeq++;
        this.abortCtrl?.abort();
    }
}
