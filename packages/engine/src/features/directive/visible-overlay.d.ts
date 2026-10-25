import type { OverlayInstance } from "../overlay/instance";
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
export declare abstract class VisibleOverlayDirective extends OverlayDirective {
    /** 可写回的 visible 状态路径（简单路径形态才有；表达式/字面量 null）。
     *  protected：形态子类消费（x-drawer 折叠把手折叠态点击须写回 true） */
    protected _visiblePath: string | null;
    /** visible 驱动表达式（非字面量形态） */
    private _visibleExpr;
    created(): void;
    /** 消费者销毁：打开中的实例走请求关闭（写回 false）；等待中的 x-import 监听经 super 清理 */
    destroy(): void;
    /** 请求关闭写回（决策 7）：visible 为简单路径时回写 false（落点解析） */
    protected _makeCloseRequest(): ((inst: OverlayInstance, source: string) => void) | null;
    /** 可见性驱动总入口（状态归假 → 直接 close，不走写回——状态已是 false） */
    private _toggle;
    /** 字面量判定：`true`/`false`（大小写不敏感）为静态布尔，其余 null 走反应式 */
    private _resolveLiteral;
    /**
     * visible 写回落点解析：沿 scope 链找首个持有首段键的容器（locals → x-data 响应式域），
     * 逐段深入直写（_data 写即响应式）；全链无局部落点 → `setVal` 写全局 state（x-model 同款快路径）。
     */
    protected _writeVisible(value: boolean): void;
}
