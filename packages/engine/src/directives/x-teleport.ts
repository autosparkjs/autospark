import { AutoSparkDirectiveBase } from "../features/directive/base";
import type { AutoDirectiveInfo } from "../features/directive/types";
import { queryRelElement } from "../utils/queryRelElement";

/**
 * x-teleport：传送（ADR-0059）。
 *
 * 把宿主元素**一次性**搬到目标位置——脱离声明父级，挂到指定目标下（弹窗逃逸
 * `overflow:hidden`、渲染到 body 等场景）。值为目标选择器**静态字面量**，经
 * `queryRelElement(宿主, 值)` 解析（四形态：`/.foo` 全局、`../.foo` 父级爬升、
 * `.foo` 宿主内、`^form` closest）；不作表达式求值、不 watch（运行时换挂载点不支持）。
 *
 * ## 架构：ownsChildren + 延迟编译（ADR-0059 决策一）
 *
 * 编译期剪枝子树（模板只读）；结果树挂载后的微任务（scheduler，x-if 首渲 defer 先例）
 * 完成「解析目标 → 校验 → 原位锚点注释 → 搬移宿主 → 按基准施加上下文 → 编译子树」。
 * 查询必须 defer：编译期 queryRelElement 会命中尚未替换的旧模板树。
 *
 * 延迟编译是 `dataContext:'host'` 正确性的根基：宿主 scope 重挂到目标 scope 链**之后**
 * 子树才编译，精准订阅按新链解析——纯编译期搬移路线（绑定已按声明处解析）无法自洽
 * （with 求值与精准订阅将读到两个上下文）。
 *
 * ## dataContext（数据视图基准，ADR-0059 决策三）
 *
 * - `declarer`（默认）：声明处上下文——宿主 scope 保持编译期 parent 链，DOM 移走、视图不动；
 * - `host`：挂载点上下文——`findScopeByEl(目标)` 重挂宿主 scope parent；目标无所属 scope
 *   （engine 外直挂如 `/.body`）→ `dataBoundary = true`（仅全局 state，即 rootless 全局
 *   视图，对齐 overlay 命令式缺省的防御姿态）；
 * - `.host` 修饰符 ≡ `x-teleport-options="{host:true}"`（ADR-0007 修饰符即选项）；
 * - 无效值 warn + 按 `declarer`。
 *
 * ## 失败降级（warn + 原地渲染，等效未写指令——传送失败不破坏内容可达性）
 *
 * 三类校验（ADR-0059 决策四）：未命中/非法选择器；环与自引用（target === el 或
 * el.contains(target)，appendChild 将抛 HierarchyRequestError）；目标断连（无任何
 * 父节点的孤儿，如目标已被摘除）。宿主自身无 parentNode（外层 keepalive 摘除态）
 * 同样静默不搬移。所有降级均照常原地编译子树。
 *
 * ## 组合矩阵（ADR-0059 决策六）
 *
 * - `x-show` 同元素支持（display 正交于位置）；
 * - 同元素其他 ownsChildren 结构指令（x-for/eager x-if/x-component/x-isolate/eager
 *   x-switch/x-tree）→ warn + **完全退出**（子树归对方接管；U3 对称让位，compiler
 *   已豁免 teleport 不参与通用抛错）；
 * - 同元素 keepalive x-if / x-switch（不占子树；keepalive 切回把宿主插回原位锚点——
 *   重插位置所有权冲突）→ warn + 拒绝传送（子树仍由本指令原地编译）；
 * - 祖先链含 keepalive 显隐指令 → 编译期 warn 不阻止（外层摘除时宿主物理在目标下
 *   不受影响，显隐失效仍可见；DOM 断链后无事件可感知，只能编译期告知）；
 * - 分支根（x-else-if/x-case）由既有「分支根禁结构指令」防线拒绝，不特判。
 *
 * ## 生命周期
 *
 * destroy（engine.destroy / 祖先 scope 级联销毁）：取消未执行的搬移；已搬移则从目标下
 * 摘除宿主（防残留泄漏，子树 scope 随 binding 级联销毁）；注销 observer 额外观察根；
 * 移除原位锚点。目标后续被移除则宿主成 detached 孤儿，不追踪（文档声明）。
 * engine 外目标登记 `dispatcher.addExtraRoot`（overlay 先例：engine 外的 Runtime 指令
 * 默认在 observer 视野外），destroy 对称注销。嵌套 x-teleport 允许（内层搬移在外层
 * 子树编译后执行，以内层为准）。与 x-dialog 分工：静态轻量弹层，无遮罩/打开栈/实例管理。
 */
export class TeleportDirective extends AutoSparkDirectiveBase {
    static override readonly priority = 80;

    /** 结构指令：编译期剪枝子树，微任务搬移后延迟编译（ADR-0059 决策一） */
    static override ownsChildren(_info: AutoDirectiveInfo): boolean {
        return true;
    }

    /** destroy 取消标志：祖先 scope 级联销毁时中断未执行的微任务搬移 */
    private _cancelled = false;
    /** 拒绝传送（keepalive 同元素 / 值缺失 / 校验失败降级）：不搬移，仍原地编译子树 */
    private _skipMove = false;
    /** 同元素其他 ownsChildren owner → 完全退出（子树归对方，微任务亦跳过） */
    private _yield = false;
    /** 宿主已搬至目标（destroy 时须从目标下摘除） */
    private _moved = false;
    /** 已登记 observer 额外观察根（engine 外目标，destroy 对称注销） */
    private _extraRoot = false;
    /** 原位锚点注释（BranchHost 同款 DOM 书签） */
    private _anchor: Comment | null = null;

    override created() {
        // U3 对称让位（先于一切）：同元素其他 ownsChildren owner → 完全退出。
        // compiler._resolveOwnership 已豁免 teleport 不抛错（通用抛错早于 created，
        // 不豁免则 warn 无机会），处置路径与 x-component U3 warn 同构。
        if (this._hasOtherStructuralOwner()) {
            this.warn(
                "x-teleport: 宿主元素含其他结构指令（x-for/eager x-if/x-component 等占子树指令），已放弃传送，子树由该指令接管（ADR-0059）。" +
                    "传送与结构渲染各居一层即可（外层包裹）。",
            );
            this._yield = true;
            return;
        }
        // 值校验：静态字面量必填（空值 warn + 降级原地渲染）
        const selector = this.value == null ? "" : String(this.value).trim();
        if (selector === "") {
            this.warn(
                "x-teleport: 缺少目标选择器（值须为 queryRelElement 选择器），按未声明处理——原地渲染（ADR-0059）",
            );
            this._skipMove = true;
        }
        // 同元素 keepalive 显隐指令：keepalive 切回把宿主插回原位锚点（重插位置所有权
        // 冲突）→ 拒绝传送；子树仍由本指令编译（keepalive 变体不占子树，职责无人可让）
        if (this._hasSameElKeepaliveToggle()) {
            this.warn(
                "x-teleport: 与 x-if.keepalive / x-switch.keepalive 同元素——keepalive 切回会把宿主插回原位（锚点书签），传送将失效，已拒绝传送（原地渲染，ADR-0059）。" +
                    "请改为外层包裹（注意外层 keepalive 摘除时传送内容仍可见）。",
            );
            this._skipMove = true;
        }
        // 祖先链 keepalive 显隐指令：编译期 warn 不阻止（ADR-0059 决策六）
        this._warnKeepaliveAncestor();
        // 微任务：结果树挂载后解析目标 + 搬移 + 延迟编译（created 同步期宿主尚未挂进父树，
        // transformElement 的 appendChild 还没发生，同 x-for 首渲 defer 先例）
        this.engine.scheduler.schedule(() => this._apply(selector));
    }

    override destroy() {
        this._cancelled = true;
        if (this._extraRoot) {
            this._extraRoot = false;
            this.engine.dispatcher.removeExtraRoot(this.el);
        }
        if (this._moved) {
            this._moved = false;
            // 从目标下摘除，防残留泄漏；子树 scope 随 binding 由 scope.destroy 递归清理
            this.el.remove();
        }
        this._anchor?.remove();
        this._anchor = null;
    }

    /** 微任务主流程：解析目标 → 校验 → 搬移 → 施加基准 → 延迟编译子树 */
    private _apply(selector: string) {
        if (this._cancelled) return;
        const el = this.el;
        const tpl = this.template;
        if (!el || !tpl) return;
        if (this._skipMove) {
            this._compileInPlace();
            return;
        }
        const target = queryRelElement(el, selector);
        if (!target) {
            this.warn(`x-teleport: 目标未命中（"${selector}"），原地渲染（ADR-0059）`);
            this._compileInPlace();
            return;
        }
        if (target === el || el.contains(target)) {
            this.warn(
                `x-teleport: 目标落在宿主自身子树内（"${selector}"），将形成 DOM 环，原地渲染（ADR-0059）`,
            );
            this._compileInPlace();
            return;
        }
        // 目标断连 = 无任何父节点的孤儿（已被摘除）。不用 isConnected：engine 根可能
        // 自身脱离 document（测试形态），isConnected 恒 false 会误伤（BranchHost 同款判定）
        if (!target.parentNode) {
            this.warn(`x-teleport: 目标未连接（"${selector}"，可能已被摘除），原地渲染（ADR-0059）`);
            this._compileInPlace();
            return;
        }
        // 宿主自身无 parentNode（外层 keepalive 摘除态等）：无「原位」可言，静默不搬移、原地编译
        if (!el.parentNode) {
            this._compileInPlace();
            return;
        }
        // dataContext:'host'：重挂宿主 scope 到目标所属 scope 链——须早于子树编译
        //（精准订阅按新链解析，ADR-0059 决策一）；目标无所属 scope → 封闭为全局视图
        if (this._resolveDataContext() === "host") {
            this._applyHostBasis(target as HTMLElement);
        }
        // 原位锚点注释（x-if 家族同款 DOM 书签）+ 搬移（appendChild 追加，多宿主声明序 = 文档序）
        this._anchor = document.createComment("x-teleport");
        el.parentNode.insertBefore(this._anchor, el);
        target.appendChild(el);
        this._moved = true;
        // engine 外目标：登记 observer 额外观察根（overlay 先例——engine 外的 Runtime 指令
        // 默认在 observer 视野外），destroy 对称注销
        if (!this.engine.el.contains(target)) {
            this.engine.dispatcher.addExtraRoot(el);
            this._extraRoot = true;
        }
        // 延迟编译子树（上下文已确定）
        this.engine.compiler.compileSubtree(el, tpl, this.binding);
    }

    /** 降级编译：原地（不搬移）编译子树 */
    private _compileInPlace() {
        if (this._cancelled) return;
        this.engine.compiler.compileSubtree(this.el, this.template, this.binding);
    }

    /**
     * 数据视图基准解析（ADR-0059 决策三）：`dataContext` 显式声明优先，`.host` 修饰符
     * （解析期注入布尔选项 `host`，ADR-0007）次之，缺省 `declarer`；无效值 warn + 回落。
     */
    private _resolveDataContext(): "declarer" | "host" {
        const ctx = this.getOption("dataContext");
        if (ctx === "host" || ctx === "declarer") return ctx;
        if (ctx !== undefined) {
            this.warn(
                `x-teleport-options.dataContext: 无效值 ${JSON.stringify(ctx)}（须 'host'|'declarer'），按默认 'declarer' 处理（ADR-0059）`,
            );
        }
        return this.getOption("host") === true ? "host" : "declarer";
    }

    /**
     * host 基准施加：目标有所属 scope → 重挂宿主 scope parent（生命周期级联随新链——
     * 目标在 x-for 项内时随项销毁，与 DOM 归属一致）；无所属 scope（engine 外直挂）→
     * `dataBoundary = true`（仅全局 state，即 rootless 全局视图，ADR-0053 封闭语义复用）。
     */
    private _applyHostBasis(target: HTMLElement) {
        const hostScope = this.engine.findScopeByEl(target);
        if (!hostScope) {
            this.binding.dataBoundary = true;
            this.binding.invalidateScopeView();
            return;
        }
        const binding = this.binding;
        if (binding === hostScope || binding.parent === hostScope) return;
        binding.parent?.children.delete(binding);
        hostScope.addChild(binding);
    }

    /** 同元素是否含其他 ownsChildren 结构指令（判定与 compiler._resolveOwnership 同源；参照 x-component U3） */
    private _hasOtherStructuralOwner(): boolean {
        return this.binding.directives.some((d) => {
            if (d.info.name === "teleport") return false;
            const cls = this.engine.directives.get(d.info.name);
            return !!cls?.ownsChildren?.(d.info);
        });
    }

    /**
     * 同元素 keepalive 显隐指令（x-if.keepalive / x-switch.keepalive）：keepalive 变体
     * 不占子树（eager 变体已由 _hasOtherStructuralOwner 捕获），判据 = if/switch 且
     * `ownsChildren(info)` 为假。
     */
    private _hasSameElKeepaliveToggle(): boolean {
        return this.binding.directives.some((d) => this._isKeepaliveToggle(d.info.name, d.info));
    }

    /** 祖先链含 keepalive 显隐指令 → warn 一次（首个命中即止） */
    private _warnKeepaliveAncestor() {
        for (let s = this.binding.parent; s; s = s.parent) {
            if (s.directives.some((d) => this._isKeepaliveToggle(d.info.name, d.info))) {
                this.warn(
                    "x-teleport: 祖先链含 keepalive 显隐指令（x-if.keepalive / x-switch.keepalive）——外层摘除时传送内容物理在目标下、不受影响（显隐失效仍可见），请确认符合预期（ADR-0059）",
                );
                return;
            }
        }
    }

    private _isKeepaliveToggle(name: string, info: AutoDirectiveInfo): boolean {
        if (name !== "if" && name !== "switch") return false;
        const cls = this.engine.directives.get(name);
        return !!cls && !cls.ownsChildren?.(info);
    }
}
