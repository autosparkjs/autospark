import { AutoSparkDirectiveBase } from "../features/directive/base";
import type { AutoSpark } from "../engine/engine";

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
export class IsolateDirective extends AutoSparkDirectiveBase {
    /** 结构指令档（介于 if=80 / for=100）；x-isolate 不能与 x-for/eager-x-if 同元素（ownership 冲突） */
    static override readonly priority = 90;
    static override readonly singleton = true;
    /**
     * x-isolate 永远占有子树：inline 由 child engine 接管子节点（父编译器不得递归进内部模板），
     * remote 由 child engine 异步接管（ADR-0006 决策 1 的 ownsChildren 身份沿用）。
     */
    static override ownsChildren(): boolean {
        return true;
    }

    /** 当前模式的 child engine（inline 同步建 / remote fetch 成功后建；url 空或销毁后为 undefined） */
    private childEngine?: AutoSpark;
    /** 当前在途 fetch 的中止控制器（url 变化 / scope 销毁时 abort，丢弃过期结果） */
    private abortCtrl?: AbortController;

    override created() {
        // 登记 dispatcher 盲区：父 dispatcher 对本宿主子树致盲（ADR-0006 决策 8 沿用）
        this.engine.dispatcher.addIsolateRoot(this.el);

        const expr = this.value == null ? "" : String(this.value).trim();
        if (expr === "") {
            // 无值 → inline：空 store，内部模板 x-data 自治
            this._mountInline({});
            return;
        }
        if (expr.startsWith("{")) {
            // 值以 { 开头 → inline + 种子 state：父 scope 求值一次（初值快照，不订阅）
            this._mountInline(this._evalState(expr));
            return;
        }
        // 其余 → remote：url 响应式（与 x-text 同构的 watch 双轨）
        this._warnIfInnerContent();
        // 初值立即 fetch；后续 url 变化经 cb 销毁旧 engine + 重 fetch + 重建（ADR-0006 决策 4 沿用）
        const initialUrl = this.binding.watch(this.value, ({ value: url }) => {
            this._loadUrl(url);
        });
        this._loadUrl(initialUrl);
    }

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
    private _mountInline(state: Record<string, any>): void {
        const tpl = this.template;
        if (tpl) {
            for (const child of Array.from(tpl.childNodes)) {
                this.el.appendChild(child.cloneNode(true));
            }
        }
        // 经 this.engine.constructor 创建同类实例——避免 import engine 类引入循环依赖
        // （isolate → engine → manager → presets → isolate），且子类化 AutoSpark 时自动跟随（v1 先例）
        const EngineCtor = this.engine.constructor as new (
            el: HTMLElement,
            state: any,
            options?: any,
        ) => AutoSpark;
        this.childEngine = new EngineCtor(this.el, state, this.options);
    }

    /**
     * 种子 state 表达式求值一次：`with(scope)` 在父 scope 聚合视图上求值（loading.ts
     * resolveLiteral 同款内核），可写纯字面量也可引用父状态/局部变量取初值快照。
     * 求值失败 / nullish / 非对象 → warn + 空对象兜底（child 仍建立，失效可发现）。
     */
    private _evalState(expr: string): Record<string, any> {
        let val: any;
        try {
            const getter = new Function("scope", `with(scope){ return (${expr}); }`) as (
                scope: any,
            ) => any;
            val = getter(this.binding.getContext());
        } catch (e: any) {
            this.warn(`x-isolate: 种子状态表达式求值失败 "${expr}"（${e?.message ?? e}），已按空状态建立`);
            return {};
        }
        if (val == null) {
            this.warn(`x-isolate: 种子状态表达式求值为空（${expr}），已按空状态建立`);
            return {};
        }
        if (typeof val !== "object") {
            this.warn(`x-isolate: 种子状态须为对象（${expr} 得到 ${typeof val}），已按空状态建立`);
            return {};
        }
        return val;
    }

    /**
     * remote 模式宿主内部声明内容 → warn + 忽略（互斥，ADR-0060 决策四）：
     * 不引入「内部内容 = fallback」语义，避免内部模板经历「编译 → 覆盖时销毁」的
     * engine 生命周期纠缠；加载占位由 x-loading 遮罩承担。
     */
    private _warnIfInnerContent(): void {
        const tpl = this.template;
        if (!tpl) return;
        const hasContent =
            tpl.children.length > 0 ||
            Array.from(tpl.childNodes).some(
                (n) => n.nodeType === Node.TEXT_NODE && (n.nodeValue ?? "").trim() !== "",
            );
        if (hasContent) {
            this.warn(
                `x-isolate: remote 模式（值 = url 表达式）忽略宿主内部内容；如需内部模板建独立引擎请去掉值（inline）或传 {…} 种子状态`,
            );
        }
    }

    /**
     * 加载远程 url：销毁旧 child engine + abort 旧 fetch → 渲染 loading → fetch → 建 child engine。
     *
     * - url 假/空（表达式暂未解析出 url）→ 清空宿主、无 engine；
     * - 有效 url → 在宿主添加 `x-loading` 属性（复用运行时指令，dispatcher 自动 mount 遮罩）+
     *   fetch → 成功则移除 `x-loading`、建 child engine（options 同样透传 `x-isolate-options`）；
     *   失败则移除 `x-loading`、错误占位 + log。
     *
     * 每次用一个独立 AbortController；url 变化或 scope 销毁会 abort 旧请求，其在下个 await 点丢弃结果。
     */
    private async _loadUrl(url: any): Promise<void> {
        this._teardownEngine();
        const urlStr = url == null ? "" : String(url).trim();
        if (urlStr === "") {
            this.el.replaceChildren();
            return;
        }
        // 复用 x-loading 运行时指令：宿主加属性即由 dispatcher mount 遮罩（ADR-0006 决策 6）。
        // 宿主自身不在 isolate 盲区内（仅子树盲），故父 dispatcher 能观测到此属性变化。
        this.el.setAttribute("x-loading", "true");
        const myCtrl = (this.abortCtrl = new AbortController());
        try {
            const res = await fetch(urlStr, { signal: myCtrl.signal });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const html = await res.text();
            // 销毁 / 被新 url 取代 → 已 abort，丢弃本次结果（避免向已销毁宿主或被取代的 isolate 写入）
            if (myCtrl.signal.aborted) return;
            this.el.removeAttribute("x-loading"); // 移除遮罩（dispatcher unmount）
            this.el.replaceChildren();
            this.el.innerHTML = html;
            // 完全独立 child engine：空状态 {} 由 engine 自建 store，fetched HTML 用自身 x-data 自治声明状态。
            // options 同样经 x-isolate-options 透传（与 inline 一致，不自动继承父）
            const EngineCtor = this.engine.constructor as new (
                el: HTMLElement,
                store: any,
                options?: any,
            ) => AutoSpark;
            this.childEngine = new EngineCtor(this.el, {}, this.options);
        } catch (e: any) {
            if (myCtrl.signal.aborted) return; // 主动 abort（销毁 / 取代），非真错误
            this.el.removeAttribute("x-loading");
            this._renderError();
            this.error(`x-isolate: 加载远程模板失败 "${urlStr}": ${e?.message ?? e}`);
        } finally {
            // 仅当仍是本次控制器时清空（被新 url 取代则不动新控制器）
            if (this.abortCtrl === myCtrl) this.abortCtrl = undefined;
        }
    }

    /** 销毁当前 child engine + abort 在途 fetch + 移除 x-loading（url 变化 / scope 销毁时调用） */
    private _teardownEngine(): void {
        this.abortCtrl?.abort();
        this.abortCtrl = undefined;
        this.childEngine?.destroy();
        this.childEngine = undefined;
        this.el.removeAttribute("x-loading");
    }

    /** 渲染极简错误占位到宿主，替换现有子节点（loading 已由 x-loading 遮罩承担） */
    private _renderError(): void {
        this.el.replaceChildren();
        const el = document.createElement("div");
        el.className = "x-isolate-error";
        el.textContent = "模板加载失败";
        this.el.appendChild(el);
    }

    /**
     * 销毁：abort 在途 fetch + 销毁 child engine + 注销 dispatcher 盲区。
     * 由 scope.destroy() 级联调用（宿主/祖先被移除、engine.destroy 等），无泄漏。
     */
    override destroy(): void {
        this._teardownEngine();
        this.engine.dispatcher.removeIsolateRoot(this.el);
    }
}
