import { AutoSparkDirectiveBase } from "../features/directive/base";
import type { AutoSparkAction } from "../features/action/types";
import type { AsyncLoader } from "asyncsignal/loader";
import {
    createRemoteLoader,
    dispatchLoadError,
    normalizeLoadError,
    resolveRequestInit,
    type RemoteLoadMeta,
} from "../features/directive/remote-load";

/**
 * 判定 x-import 值是否为**字面量 url**（不经表达式求值，ADR-0022 决策六）。
 *
 * 典型 url 形态：以 `/` `./` `../` 开头（相对/绝对路径）、`http:` `https:` 协议、或纯域名路径。
 * 这类值直接作 url 加载，避免被表达式求值误解析（`/cmp.html` 当正则、`http://` 当注释等）。
 * 含空白/花括号/运算符的值视为表达式（响应式 url，watch 求值）。
 */
export function isLiteralUrl(raw: string): boolean {
    if (/\s/.test(raw)) return false; // 含空白 → 表达式
    if (raw.startsWith("/") || raw.startsWith("./") || raw.startsWith("../")) return true;
    if (/^https?:\/\//i.test(raw) || /^file:\/\//i.test(raw)) return true;
    // 纯标识符段 + .html 等（如 localhost/c.html、a.html）→ 字面量
    return /^[\w.:@-]+(?:[/?#][\w.:@-]*)*$/.test(raw) && !/[{}()=]/.test(raw);
}

/**
 * x-import：远程组件加载指令（ADR-0022 决策六）。
 *
 * fetch 远程 url 加载组件定义（fetched HTML 内可含 1-N 个 `<div x-define>`），注册到当前 engine：
 *
 * - **作用域组件**（默认 `<div x-import="url">`）：注册到最近祖先 scope.components，仅本作用域可见；
 * - **全局组件**（`.global` 修饰符 `<div x-import.global="url">`）：注册到 engine.options.components，
 *   全引擎复用。
 *
 * url 支持**响应式**（经 `scope.watch` 求值，支持路径/表达式/x-data 局部）；url 变化 → 重新加载。
 * 加载经 `engine.importComponentsFromUrl`（url 缓存 + 循环 import 检测 + `<script setup>`/`<style>` 提取），
 * 注册后发 `components/<名>/registered`（retain，ADR-0085），供 pending 的 x-component 重新实例化（异步占位 R6=B）。
 *
 * **声明性指令**：x-import 本身不渲染（无 DOM 输出），仅副作用（加载注册）。`name` 属性可选——
 * 若声明则加载完成后校验该名组件已注册（未注册 warn）。
 *
 * **fetch 失败容错**（决策六-6）：网络错误/HTTP 非 2xx → warn + 该 url 组件视为未注册（不阻断其余）。
 *
 * @example 作用域组件加载
 * <div x-import="/components.html"></div>
 * @example 全局组件加载
 * <div x-import.global="/global-components.html"></div>
 */
export class ImportDirective extends AutoSparkDirectiveBase {
    /** 优先级与 x-component 协同（70）：import 须在编译期尽早发起，但不占子树 */
    static override readonly priority = 75;
    static override readonly singleton = true;

    /** 当前加载的 AsyncLoader 实例（ADR-0121：url 变化 / scope 销毁时 abort，落地身份校验丢弃过期结果） */
    private loader: AsyncLoader<unknown, RemoteLoadMeta> | null = null;
    /** 当前加载的 url（去重 + 变化检测） */
    private currentUrl: string | null = null;

    /** .global 修饰符（经解析期注入为 options.global，ADR-0007） */
    private get globalMode(): boolean {
        return !!this.getOption("global");
    }

    override created() {
        const raw = this.value == null ? "" : String(this.value).trim();
        if (raw === "") {
            this.warn(`x-import: 缺少 url，已跳过。`);
            return;
        }
        // ADR-0121 决策 4：统一注入 retry action（执行体 = loader.refresh()；用户同名 action 不覆盖）。
        // x-import 无宿主呈现面（决策 5 表格），retry 供 x-error 等捕获方经 getAction 链命中。
        const scope = this.binding;
        if (!scope.actions?.retry) {
            scope.actions = {
                ...(scope.actions ?? {}),
                retry: { id: "retry", title: "重试", handle: () => this._retry() } as AutoSparkAction,
            };
        }
        // 值解析双轨（ADR-0022 决策六）：
        // - 字面量 url（如 `/cmp.html`、`./a.html`、`http://x/c.html`）→ 直接加载，不经表达式求值
        //   （避免 `/cmp.html` 被当正则字面量、`http://...` 被当注释）；
        // - 含表达式特征（空白、花括号、状态变量等）→ watch 求值得 url（响应式）。
        if (isLiteralUrl(raw)) {
            this._load(raw);
            return;
        }
        // 表达式：watch 求值得 url（响应式，url 变化重载）
        const initialUrl = this.binding.watch(this.value, ({ value: url }) => {
            this._load(url);
        });
        this._load(initialUrl);
    }

    /**
     * 加载 url（ADR-0121 收编）：abort 旧 loader → 经统一内核编排
     * `engine.importComponentsFromUrl`（loaderFn 自定义注入——产物是「注册组件名数组」而非
     * 原始响应，responseParser 不适用）；retry/retryDelay/timeout/cache 与 request/method/header
     * 由 `x-import-options` 供给。
     *
     * url 假/空或与当前相同 → 跳过。**signal 透传修复**（决策 10①）：内核中止信号直达
     * importComponentsFromUrl → fetchHtml（此前 AbortController 空转）。
     */
    private _load(url: any): void {
        const urlStr = url == null ? "" : String(url).trim();
        if (urlStr === "" || urlStr === this.currentUrl) return;
        this.currentUrl = urlStr;
        this.loader?.abort();
        const loader = createRemoteLoader({
            engine: this.engine,
            url: urlStr,
            getOption: (key) => this.options?.[key],
            loaderFn: async ({ abortSignal }) => {
                // request 权威整包 + method/header 简写（决策 7）；signal 不进 request
                // （engine 缓存键含 request 序列化——signal 非可序列化字段，单列透传）
                const init = resolveRequestInit((key) => this.options?.[key], abortSignal);
                const { signal: initSignal, ...requestInit } = init;
                const signal = initSignal ?? undefined;
                // 仅剩内核默认补的 method:"GET" 时视为无自定义请求——保持 engine 缓存键为裸 url
                // （与 x-component loader 缺省形态一致，避免同 url 双键双 fetch）
                const hasCustomRequest =
                    Object.keys(requestInit).length > 1 || requestInit.method !== "GET";
                const registered = await this.engine.importComponentsFromUrl(
                    urlStr,
                    this.globalMode ? null : this.binding.parent,
                    this.globalMode,
                    hasCustomRequest ? requestInit : undefined,
                    signal,
                );
                // null = 加载失败（engine 内已 warn）；抛错交内核归一/重试编排
                if (registered === null) throw new Error(`远程内容加载失败（${urlStr}）`);
                return registered;
            },
        });
        this.loader = loader;
        this._wireLanding(loader, loader.get());
    }

    /**
     * 手动重试弹药（决策 4）：执行体 = 当前 loader 的 `refresh()`（在途先中止再重启），
     * 落地与首取同路径。
     */
    private _retry(): void {
        const loader = this.loader;
        if (!loader) return;
        this._wireLanding(loader, loader.refresh());
    }

    /**
     * 统一落地点：成功 → 校验 name 属性声明；失败（重试耗尽）→ 错误归一 + warn +
     * 派发 load 错误事件（x-error 第三错误源，可捕获；x-import 无宿主呈现面，不渲染错误块）。
     * 主动 abort（AbortError）静默丢弃（决策 3）。
     */
    private _wireLanding(loader: AsyncLoader<unknown, RemoteLoadMeta>, p: Promise<unknown>): void {
        p.then(
            () => {
                if (loader !== this.loader) return;
                // 校验 name 属性声明的组件是否注册成功（可选诊断）
                const expectedName = this.el.getAttribute("name");
                if (expectedName) {
                    const found = this.binding.getComponentDeclaration(expectedName);
                    if (!found) {
                        this.warn(
                            `x-import: url "${loader.meta.url}" 加载完成，但未找到 name 属性声明的组件 "${expectedName}"。`,
                        );
                    }
                }
            },
            (err: unknown) => {
                if (loader !== this.loader) return;
                if ((err as Error)?.name === "AbortError") return; // 主动 abort，非真错误
                const loadErr = normalizeLoadError(err, loader.meta);
                this.warn(`x-import: 加载 "${loadErr.url}" 失败: ${loadErr.message}`);
                dispatchLoadError(this.el, loadErr, () => this._retry());
            },
        );
    }

    override destroy(): void {
        this.loader?.abort();
        this.loader = null;
    }
}
