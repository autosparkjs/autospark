/**
 * RuntimeObserverDispatcher —— engine 级共享 MutationObserver 分发器（ADR-0003 决策 7）。
 *
 * 取代此前每条 runtime 指令各自建 observer 的做法（如 loading.ts 旧版的 static initialize）：
 * 在 `engine.el` 上建**单一** MutationObserver，attributeFilter 为全部 runtime 指令属性名的并集，
 * 把 childList 增/删与 attributes 变化路由到对应指令类的 `mounted`/`unmounted`/`attrChanged`，
 * 并广播 `directive/<name>/{mounted|unmounted|attr-changed}` 事件。
 *
 * **实例化工厂沿用** runtime 标准模式：`new Cls(engine, undefined, info)` + `inst.el = el` + `inst.mounted()`
 * （见 base.ts 构造函数；Runtime 实例无 scope/binding）。
 *
 * **处理 `DirectiveKind.Runtime` 与 `DirectiveKind.Hybrid`**（编译器对两者同款致盲+保属性，
 * 见 compiler._runtimeKeepAttr；Hybrid 的 mounted/unmounted/attrChanged 亦走本通道——
 * scope 实例管编译期装配、observer 实例管运行期生命周期，两实例状态互不共享）。
 *
 * **已知限制（与旧 loading observer 一致，刻意保留）**：attributeFilter 只含裸属性 `x-<name>`，
 * 故修饰符形式（如 `x-loading.screen`）的运行时**值变化**不触发 attrChanged；其增/删仍生效。
 */
import type { AutoSpark } from "../../../engine/engine";
import { AutoSparkDirectiveBase } from "../base";
export declare class RuntimeObserverDispatcher {
    readonly engine: AutoSpark<any>;
    /** name → 注册条目 */
    private registry;
    /** name → (el → 实例)；一个元素可挂多个 runtime 指令 */
    private instances;
    private mo;
    /**
     * isolate 盲区根集合（ADR-0006 决策 8）：x-isolate 宿主登记于此。
     * 盲区内子树的 runtime 指令（如 child engine 写入的 x-loading）由 child engine 自身 dispatcher
     * 负责，父 dispatcher 对其**致盲**——避免父/子双 dispatcher 抢管同一节点、重复 mount。
     */
    private isolateRoots;
    /**
     * 额外观察根集合（ADR-0052 决策 14）：覆盖层实例外壳登记于此——实例 DOM 渲染到
     * `document.body` 容器（engine.el 子树之外），不纳入观察则子树内 Runtime 指令
     * （x-loading 等）的 mounted/unmounted/attrChanged 全部失明。
     *
     * 与 `isolateRoots` 盲区机制对称：盲区把子树**排除**出观察（child engine 管辖），
     * 观察根把外部子树**纳入**观察。实现上对每个额外根单独 `mo.observe(el, 同款 options)`
     * （同一 observer 可观察多根）；登记时对根做一次初始扫描（元素可能已挂载）。
     */
    private extraRoots;
    constructor(engine: AutoSpark<any>);
    /**
     * 启动：枚举 engine.directives 中 `kind !== Compile`（Runtime + Hybrid）的类建 registry，
     * 连 observer，初始扫描。
     *
     * 须在 `initializeAll()`（含各指令的 injectStyles 等 FOUC 防御副作用）**之后**调用——
     * 初始扫描会同步触发首次 mounted → mountOverlay，依赖样式已注入。
     */
    start(): void;
    /** 晚注册的 runtime 指令（DirectiveManager.set 触发）：入 registry → 重建 observer → 重扫该属性 */
    onDirectiveRegistered(name: string, Cls: typeof AutoSparkDirectiveBase): void;
    private _register;
    /**
     * 登记 isolate 盲区根（x-isolate 宿主）。盲区内子树不参与本 dispatcher 的 mount/attr 派发。
     * 由 IsolateDirective.created() 调用；对称地在 destroy() 经 removeIsolateRoot 注销。
     */
    addIsolateRoot(el: HTMLElement): void;
    /** 注销 isolate 盲区根（IsolateDirective.destroy() 调用）。 */
    removeIsolateRoot(el: HTMLElement): void;
    /**
     * 登记额外观察根（覆盖层实例挂载时调用，ADR-0052 决策 14）：纳入 observer 观察 + 初始扫描。
     * 实例销毁时须**先摘 DOM**（observer 收到 removedNodes → unmount 子树 Runtime 指令）
     * 再 {@link removeExtraRoot}——顺序反了会跳过 unmount。
     */
    addExtraRoot(el: HTMLElement): void;
    /** 注销额外观察根（覆盖层实例销毁时调用；须在摘 DOM 之后）。 */
    removeExtraRoot(el: HTMLElement): void;
    /**
     * 元素是否落在任一 isolate 盲区的**严格后代**子树内（不含盲区根本身）。
     * 无盲区时短路返回 false（热路径零开销）。用于 collectEls / _handle 过滤掉 child engine 管辖的子树。
     *
     * **不含盲区根本身**：isolate 宿主自身的 runtime 指令（如 fetch 期间 x-isolate 添加的 `x-loading`）
     * 仍归本 dispatcher 管理与 mount；仅其**子树**（child engine 编译产物）致盲，避免双 dispatcher 抢管。
     */
    private _inIsolateRoot;
    /** （重建）共享 observer：attributeFilter 为全部 runtime 裸属性并集 */
    private _buildObserver;
    /**
     * 收集 root（含自身）子树下、挂有任何 runtime 指令属性的元素 → 该元素命中的指令名列表。
     *
     * querySelectorAll 无法匹配任意修饰符前缀，故遍历属性名对各 attrRe 做测试（同旧 loading 实现）。
     */
    collectEls(root: HTMLElement): Map<HTMLElement, string[]>;
    /** 挂载实例（已存在则跳过）：实例化 → 注入 el → mounted → 广播 */
    mount(el: HTMLElement, name: string): void;
    /** 卸载实例（不存在则跳过）：unmounted → 删 → 广播 */
    unmount(el: HTMLElement, name: string): void;
    /** 属性值变化：attrChanged（保留实例状态如 delay 定时器）→ 广播 */
    private attrChange;
    /** observer 回调：childList 增/删 → collectEls 逐指令 mount/unmount；attributes → 三态路由 */
    private _handle;
    /** 属性三态：新增属性→mount / 删除属性→unmount / 值变→attrChange（同旧 loading observer 语义） */
    private _attrThreeState;
    /** engine.destroy 调用：断开 observer + 全实例 unmounted + 清空（不移除全局共享样式，KISS） */
    dispose(): void;
}
