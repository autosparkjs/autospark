import { AutoSparkDirectiveBase } from "../features/directive/base";
/**
 * x-isolate：engine 边界 / inline 子引擎 / 远程子引擎（ADR-0060，废止 ADR-0006 决策 1/2）。
 *
 * 在模板中划一块**独立于父 engine 的引擎边界**——宿主成为一个完全独立 child engine 的根。
 * 三种形态（由值分派）：
 *
 * - **inline（无值 `<div x-isolate>`）**：内部模板由**完全独立的 child engine** 编译
 *   （`new AutoSpark(host, {})`，engine 自建空 store），内层 `x-data`/指令/`{{}}` 正常生效，
 *   与父 engine 状态零耦合。
 *
 * - **inline + 种子 state（`x-isolate="{...}"`，值 trim 后以 `{` 开头）**：表达式在**父 scope
 *   求值一次**得对象，作为 child 初始 state（初值快照，**不订阅**——父后续变化不影响 child；
 *   引用传递不深拷贝）。求值失败 / nullish / 非对象 → warn + 空对象兜底。
 *
 * - **remote（`x-isolate="expr"`，其余值）**：expr 经 `scope.watch` 求值得 **url（响应式）**；
 *   fetch url → 在宿主上建完全独立的 child engine。url 变化 → 销毁当前 child engine +
 *   重新 fetch + 重建。宿主内部声明内容 → warn + 忽略（互斥，加载占位由 x-loading 遮罩承担）。
 *
 * child engine 的 options 经 **`x-isolate-options`**（relaxed-json，ADR-0007 回退链）全量透传，
 * **不自动继承**父 options；编译期静态（不进 ADR-0051 覆盖清单）。
 *
 * **威胁边界**：仅防 T1（反应式刷新不擦内容——子树归 child engine，父 watcher 不存在）；
 * T2（结构重建：x-if toggle / engine.data / patch）与 T3（全量重编译）与普通元素一视同仁——
 * 宿主被销毁则 child engine 随销，重建时 inline 重回填模板 / remote 重 fetch。
 * **外部 DOM API 直接删除宿主**父 engine 不知情、child engine 泄漏——不担保（T2，失联检测 fast-follow）。
 *
 * **teardown**：child engine 挂指令实例 `this.childEngine`，随 `scope.destroy()` 销毁
 * （destroy 调 `childEngine.destroy()` + abort 在途 fetch），零额外接线、无泄漏。
 *
 * **engine 根标识**：宿主被 child engine 构造打上 `data-autospark`（ADR-0060），
 * 真实 DOM 上爬查找（queryRelElement 的 `^`/`../`）遇之止步，不越入父 engine 的 DOM。
 *
 * **dispatcher 盲区**：created() 登记宿主为盲区，父 dispatcher 跳过其子树的 runtime 指令派发
 * （隔离 child engine 的 runtime 属性被父 dispatcher 二次 mount，ADR-0006 决策 8 沿用）。
 *
 * @example inline 子引擎（内部模板独立编译，x-data 自治）
 * <div x-isolate><div x-data="{ n: 1 }"><span x-text="n"></span></div></div>
 *
 * @example inline + 种子 state（父状态初值快照，引用传递）
 * <div x-isolate="{ n: parentCount, theme: config.theme }">...</div>
 *
 * @example 远程子引擎（url 响应式，options 透传）
 * <div x-isolate="postUrl" x-isolate-options="{ sanitizer: mySanitizer }"></div>
 */
export declare class IsolateDirective extends AutoSparkDirectiveBase {
    /** 结构指令档（介于 if=80 / for=100）；x-isolate 不能与 x-for/eager-x-if 同元素（ownership 冲突） */
    static readonly priority = 90;
    static readonly singleton = true;
    /**
     * x-isolate 永远占有子树：inline 由 child engine 接管子节点（父编译器不得递归进内部模板），
     * remote 由 child engine 异步接管（ADR-0006 决策 1 的 ownsChildren 身份沿用）。
     */
    static ownsChildren(): boolean;
    /** 当前模式的 child engine（inline 同步建 / remote fetch 成功后建；url 空或销毁后为 undefined） */
    private childEngine?;
    /** 当前远程加载的 AsyncLoader 实例（ADR-0121：url 变化 / scope 销毁时 abort，落地身份校验丢弃过期结果） */
    private loader;
    /** 合成遮罩句柄（ADR-0126 共享层）：守卫 / 所有权闸 / toggle 显隐状态内聚，宿主元素恒定故惰性创建一次 */
    private loadingMask;
    /** 默认/自定义错误块的编译 scope（teardown / 新一轮落地前销毁 + 回收 $scopes[id]） */
    private errorScope;
    created(): void;
    /**
     * inline 模式：回填原始模板子节点到宿主 + 同步建 child engine。
     *
     * - **回填**：结果树中 ownsChildren 宿主的子节点为空（transformElement 挂接时跳过递归），
     *   原始模板在 `this.template` 快照里——深克隆回填，**保留指令属性不剥除**（它们是
     *   child engine 的编译输入，这正是 inline 与已废止 static 的本质区别）。
     * - **同步建 engine**：inline 无网络等待，defer 的动机（查结果树、等上下文确定）不存在
     *   （child 上下文 = 宿主自身）——同步无中间态、无 FOUC（ADR-0060 决策七）。
     * - options 透传 `this.options`（`x-isolate-options` 解析产物），不自动继承父 options；
     *   state 引用传递不深拷贝（种子语义，隔离责任在书写者）。
     */
    private _mountInline;
    /**
     * 种子 state 表达式求值一次：`with(scope)` 在父 scope 聚合视图上求值（loading.ts
     * resolveLiteral 同款内核），可写纯字面量也可引用父状态/局部变量取初值快照。
     * 求值失败 / nullish / 非对象 → warn + 空对象兜底（child 仍建立，失效可发现）。
     */
    private _evalState;
    /**
     * remote 模式宿主内部声明内容 → warn + 忽略（互斥，ADR-0060 决策四）：
     * 不引入「内部内容 = fallback」语义，避免内部模板经历「编译 → 覆盖时销毁」的
     * engine 生命周期纠缠；加载占位由 x-loading 遮罩承担。
     */
    private _warnIfInnerContent;
    /**
     * 加载远程 url（ADR-0121 收编）：销毁旧 child engine + abort 旧 loader → x-loading 遮罩 →
     * 经统一内核 `createRemoteLoader`（fetcher 出站口 + request/method/header 合并 + res.ok 归一，
     * retry/retryDelay/timeout/cache 由 `x-isolate-options` 供给）→ 落地建 child engine。
     *
     * - url 假/空（表达式暂未解析出 url）→ 清空宿主、无 engine；
     * - 落地点走 `get()`/`refresh()` 的 Promise（AsyncLoader 缓存命中不触发回调但 Promise 照常
     *   resolve——回调模型会漏掉缓存命中），身份校验（loader !== this.loader）丢弃被取代结果。
     */
    private _loadUrl;
    /**
     * 手动重试弹药（ADR-0121 决策 4）：执行体 = 当前 loader 的 `refresh()`（在途先中止再重启），
     * 落地与首取同路径。宿主 scope.actions 与错误块 scope.actions 的 retry 均汇于此。
     */
    private _retry;
    /**
     * 统一落地点：成功 → 清错误块 / 移除遮罩 / 建 child engine；失败（重试耗尽）→ 移除遮罩 +
     * 错误归一 + 派发 load 错误事件（x-error 第三错误源）+ 默认错误块呈现。
     * 主动 abort（AbortError）静默丢弃（ADR-0121 决策 3：不重试、不呈现、不算错误）。
     */
    private _wireLanding;
    /** 销毁当前 child engine + abort 在途 loader + 清错误块 + 摘除合成遮罩（url 变化 / scope 销毁时调用） */
    private _teardownEngine;
    /** 销毁错误块编译 scope + 回收其 $scopes[id] 响应式数据（x-error clear 同款姿势） */
    private _clearErrorBlock;
    /**
     * 错误呈现（ADR-0121 决策 5）：先派发 load 错误事件（携带 retry 弹药）——x-error 在场
     * （`closest("[x-error]")` 命中）即接管呈现，默认错误块退位；否则默认错误块升级为
     * ADR-0118 同款契约注入 `{error, message, url, retryable, closeable, actions}`，
     * `x-isolate-options.error` 支持自定义占位（协议对齐 x-component：HTML 字符串静态插入 /
     * `{name, props}` 具名组件编译，引擎注入上下文优先于用户 props）。
     */
    private _renderError;
    /**
     * 销毁：abort 在途加载 + 销毁 child engine + 注销 dispatcher 盲区。
     * 由 scope.destroy() 级联调用（宿主/祖先被移除、engine.destroy 等），无泄漏。
     */
    destroy(): void;
}
