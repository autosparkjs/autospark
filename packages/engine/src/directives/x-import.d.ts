import { AutoSparkDirectiveBase } from "../features/directive/base";
/**
 * 判定 x-import 值是否为**字面量 url**（不经表达式求值，ADR-0022 决策六）。
 *
 * 典型 url 形态：以 `/` `./` `../` 开头（相对/绝对路径）、`http:` `https:` 协议、或纯域名路径。
 * 这类值直接作 url 加载，避免被表达式求值误解析（`/cmp.html` 当正则、`http://` 当注释等）。
 * 含空白/花括号/运算符的值视为表达式（响应式 url，watch 求值）。
 */
export declare function isLiteralUrl(raw: string): boolean;
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
export declare class ImportDirective extends AutoSparkDirectiveBase {
    /** 优先级与 x-component 协同（70）：import 须在编译期尽早发起，但不占子树 */
    static readonly priority = 75;
    static readonly singleton = true;
    /** 当前加载的 AsyncLoader 实例（ADR-0121：url 变化 / scope 销毁时 abort，落地身份校验丢弃过期结果） */
    private loader;
    /** 当前加载的 url（去重 + 变化检测） */
    private currentUrl;
    /** .global 修饰符（经解析期注入为 options.global，ADR-0007） */
    private get globalMode();
    created(): void;
    /**
     * 加载 url（ADR-0121 收编）：abort 旧 loader → 经统一内核编排
     * `engine.importComponentsFromUrl`（loaderFn 自定义注入——产物是「注册组件名数组」而非
     * 原始响应，responseParser 不适用）；retry/retryDelay/timeout/cache 与 request/method/header
     * 由 `x-import-options` 供给。
     *
     * url 假/空或与当前相同 → 跳过。**signal 透传修复**（决策 10①）：内核中止信号直达
     * importComponentsFromUrl → fetchHtml（此前 AbortController 空转）。
     */
    private _load;
    /**
     * 手动重试弹药（决策 4）：执行体 = 当前 loader 的 `refresh()`（在途先中止再重启），
     * 落地与首取同路径。
     */
    private _retry;
    /**
     * 统一落地点：成功 → 校验 name 属性声明；失败（重试耗尽）→ 错误归一 + warn +
     * 派发 load 错误事件（x-error 第三错误源，可捕获；x-import 无宿主呈现面，不渲染错误块）。
     * 主动 abort（AbortError）静默丢弃（决策 3）。
     */
    private _wireLanding;
    destroy(): void;
}
