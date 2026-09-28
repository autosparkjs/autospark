import type { AutoSpark } from "../../engine";
import { registerShellStyles } from "../../overlay/wrappers";
import { VisibleOverlayDirective } from "./visible-overlay";
import type { ResizeDirection } from "./resize";

/**
 * x-dialog：覆盖物消费者的**模态形态**（ADR-0052 修订版，共识 4 薄子类）。
 *
 * 仅叠加模态形态于 {@link VisibleOverlayDirective} 之上：遮罩外壳（`autospark-dialog-mask`，
 * 恒模态——ADR-0062）+ `closeOnMask` + flex 居中默认；visible 驱动四形态/写回（决策 6/7/8）、
 * 查找/防护/等待/props/配置链/scope 基准全部继承。x-drawer（贴边形态，ADR-0063）/ x-popover
 * （悬浮形态，ADR-0060）为平级同构薄子类。
 *
 * props 与配置不在值上（v2.3 三者正交）：props 走选项成员属性 `x-dialog-options.props`
 * （表达式 + 持续热更新，见基座）；配置走 `x-dialog-options`（两级合并链，可定向）。
 */
export class DialogDirective extends VisibleOverlayDirective {
    /** 形态键（ADR-0062）：引擎级默认 shell 的配置键（options.overlay.dialog.shell） */
    protected override readonly overlayKind = "dialog";
    // warn 前缀 directiveLabel 沿用基座默认 'x-dialog'

    /** 类级初始化：注入 shell 默认视觉样式（幂等；FOUC 防御——先于任何实例打开） */
    static override initialize(_engine: AutoSpark): void {
        registerShellStyles();
    }

    /** 模态形态（共识 4）：遮罩外壳 + closeOnMask + 居中默认（x-dialog 恒模态，ADR-0062） */
    protected override get _modalMask(): boolean {
        return true;
    }

    /** resize 形态合法集（ADR-0064）：居中浮层四角——四边拖会改居中锚定语义，角已覆盖主场景 */
    protected override _resizeAllowedHandles(): ResizeDirection[] | null {
        return ["ne", "nw", "se", "sw"];
    }
}
