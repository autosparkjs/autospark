import { OutletLayoutBase } from "./base.layout";
import type { KylinOutlet } from "./index";
import { css } from "lit";

/**
 * Stack 布局
 * 默认布局，所有 kylin-view 元素只显示 .active 的元素
 */
export class StackLayout extends OutletLayoutBase {
    static styles = css`
        /* 默认 stack 布局：没有 layout 属性或 layout="stack" */
        kylin-outlet:not([layout]) > .kylin-view,
        kylin-outlet[layout="stack"] > .kylin-view {
            display: none;
        }

        kylin-outlet:not([layout]) > .kylin-view.active,
        kylin-outlet[layout="stack"] > .kylin-view.active {
            display: block;
            animation: kylin-view-fade-in var(--kylin-view-transition-duration, 0.2s)
                var(--kylin-view-transition-easing, ease-out);
        }
    `;

    init(): void {
        // Stack 布局无需额外初始化
    }

    cleanup(): void {
        // Stack 布局无需清理
    }

    onSlotChange(): void {
        // Stack 布局无需处理 slot 变化
    }

    onPropertyChanged(): void {
        // Stack 布局无需处理属性变化
    }
}
