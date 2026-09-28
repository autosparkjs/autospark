import { setVal } from "autostore";
import type { AutoSparkScope } from "../../scope";
import { isSimpleStatePath } from "../../scope";
import type { OverlayInstance } from "../../overlay/instance";
import { OverlayDirective } from "./overlay";

/**
 * VisibleOverlayDirective：visible 驱动的覆盖物消费者**中间抽象基座**（ADR-0063）。
 *
 * 自 DialogDirective 提取（纯重构，dialog 行为零变化）：「纯状态驱动」家族语义（ADR-0052
 * 决策 6/7/8）的单一承载点——宿主是纯声明点（无隐式点击），指令值专职 visible 布尔控制：
 * - 简单路径 `x-dialog:login="ui.flag"`——watch，可写回（请求关闭回写 false）；
 * - 表达式 `x-dialog:pay="ui.step === 2"`——watch 只读；UI 关闭后依赖变化重求值仍真会重开
 *   （文档明示的已知边界，ADR-0052 决策 7）；
 * - 字面量 `x-dialog:login="true"`——挂载即开（公告类）；"false" 永不开；
 * - 空值——warn「缺少 visible 绑定」恒不开（ADR-0052 决策 6）；
 * - 对象形态已硬删（ADR-0052 v2.3）——值遇 `{` warn + 忽略整个指令。
 *
 * 请求关闭写回（决策 7）：visible 为简单路径时，关闭触点（ESC/遮罩/close action）经落点解析
 * 回写 `false`（locals → x-data 响应式域 → 全局 state 依次落点）。
 *
 * 形态差异（遮罩/定位/触发模型/默认动画）仍由子类叠加：DialogDirective（模态居中）、
 * DrawerDirective（贴边抽屉，ADR-0063）等平级继承本类——「模态」与「visible 驱动」正交
 * （mask 可配的 drawer 两者都要）。
 */
export abstract class VisibleOverlayDirective extends OverlayDirective {
    // warn 前缀 directiveLabel 继承基座（默认 'x-dialog'）；异名子类（x-drawer 等）覆写字段

    /** 可写回的 visible 状态路径（简单路径形态才有；表达式/字面量 null）。
     *  protected：形态子类消费（x-drawer 折叠把手折叠态点击须写回 true） */
    protected _visiblePath: string | null = null;
    /** visible 驱动表达式（非字面量形态） */
    private _visibleExpr: string | null = null;

    override created(): void {
        // 基座：选项表达式统一管道 + props 通道（ADR-0007 修订 / ADR-0052 v2.3）
        super.created();
        const raw = String(this.value ?? "").trim();
        // 对象形态已硬删（ADR-0052 v2.3）：值专职 visible——visible 写指令值、props 写
        // x-{name}-options.props、配置写 x-{name}-options。warn + 忽略整个指令（失效可发现）。
        if (raw.startsWith("{")) {
            this.warn(
                `${this.directiveLabel}:${this.attr}: 对象形态已删除（ADR-0052 v2.3）——visible 写指令值、props 写 ${this.directiveLabel}-options.props、配置写 ${this.directiveLabel}-options，指令被忽略`,
            );
            return;
        }
        this._visibleExpr = raw;
        // 空值守卫（ADR-0052 决策 6）：warn 恒不开。守卫须先于字面量分流——空表达式不
        // 是合法字面量（_resolveLiteral 返回 null 会落反应式分支，watch("") 直接 SyntaxError）
        if (this._visibleExpr === "") {
            this.warn(
                `${this.directiveLabel}:${this.attr}: 缺少 visible 绑定，恒不打开。请声明状态路径或表达式（ADR-0052 决策 6）`,
            );
            return;
        }
        // 字面量分流（对齐 x-loading resolveLiteral：裸属性恒开语义不适用——覆盖物无 visible 即非法）
        const literal = this._resolveLiteral(this._visibleExpr);
        if (literal !== null) {
            if (literal) {
                this._driveOn = true;
                this._open();
            }
            return;
        }
        // 反应式：可见性驱动（相对消费处 scope 求值，ADR-0052 决策 6）
        this._visiblePath = isSimpleStatePath(this._visibleExpr) ? this._visibleExpr : null;
        const initial = this.binding.watch(this._visibleExpr!, ({ value }) =>
            this._toggle(!!value),
        );
        this._toggle(!!initial);
    }

    /** 消费者销毁：打开中的实例走请求关闭（写回 false）；等待中的 x-import 监听经 super 清理 */
    override destroy(): void {
        const inst = this._overlayInstance;
        this._overlayInstance = null;
        if (inst && !inst.destroyed && inst.visible) inst.requestClose("consumer-destroyed");
        super.destroy();
    }

    /** 请求关闭写回（决策 7）：visible 为简单路径时回写 false（落点解析） */
    protected override _makeCloseRequest():
        | ((inst: OverlayInstance, source: string) => void)
        | null {
        return this._visiblePath ? () => this._writeVisible(false) : null;
    }

    // ── 内部 ──────────────────────────────────────────────────────────

    /** 可见性驱动总入口（状态归假 → 直接 close，不走写回——状态已是 false） */
    private _toggle(on: boolean): void {
        this._driveOn = on;
        if (on) {
            this._open();
        } else {
            this._close();
        }
    }

    /** 字面量判定：`true`/`false`（大小写不敏感）为静态布尔，其余 null 走反应式 */
    private _resolveLiteral(expr: string | null): boolean | null {
        const v = (expr ?? "").trim().toLowerCase();
        if (v === "true") return true;
        if (v === "false") return false;
        return null;
    }

    /**
     * visible 写回落点解析：沿 scope 链找首个持有首段键的容器（locals → x-data 响应式域），
     * 逐段深入直写（_data 写即响应式）；全链无局部落点 → `setVal` 写全局 state（x-model 同款快路径）。
     */
    protected _writeVisible(value: boolean): void {
        const path = this._visiblePath!;
        const segs = path.split(this.engine.store.delimiter);
        let s: AutoSparkScope | null = this.binding;
        while (s) {
            const container =
                s.locals && segs[0]! in s.locals
                    ? s.locals
                    : s._data && segs[0]! in s._data
                      ? s._data
                      : null;
            if (container) {
                let obj: any = container;
                for (let i = 0; i < segs.length - 1; i++) {
                    obj = obj?.[segs[i]!];
                    if (obj == null) return; // 中途断裂：状态源不完整，放弃写回
                }
                obj[segs[segs.length - 1]!] = value;
                return;
            }
            s = s.parent;
        }
        try {
            setVal(this.engine.store.state, segs, value);
        } catch (e: any) {
            this.warn(
                `${this.directiveLabel}:${this.attr}: visible 回写失败（"${path}"）: ${e?.message ?? e}`,
            );
        }
    }
}
