import { css } from "lit";

export const styles = css`
    kylin-outlet {
        display: block;
    }

    /* 视图淡入动画 */
    @keyframes kylin-view-fade-in {
        from {
            opacity: 0;
            transform: translateY(8px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    /* CSS 变量定义（默认值） */
    kylin-outlet {
        /* 通用 */
        --kylin-view-transition-duration: 0.2s;
        --kylin-view-transition-easing: ease-out;
        --kylin-view-padding: 16px;

        /* Tabs */
        --kylin-tabs-gap: 4px;
        --kylin-tabs-padding: 8px 12px;
        --kylin-tabs-bg: #f5f5f5;
        --kylin-tabs-border-bottom: 1px solid #e0e0e0;
        --kylin-tab-padding: 8px 16px;
        --kylin-tab-radius: 6px 6px 0 0;
        --kylin-tab-font-size: 14px;
        --kylin-tab-font-weight: 500;
        --kylin-tab-color: #666;
        --kylin-tab-hover-color: #333;
        --kylin-tab-hover-bg: rgba(0, 0, 0, 0.05);
        --kylin-tab-active-color: #1890ff;
        --kylin-tab-active-bg: #fff;
        --kylin-tab-active-font-weight: 600;

        /* Collapse */
        --kylin-collapse-gap: 8px;
        --kylin-collapse-border: 1px solid #e0e0e0;
        --kylin-collapse-radius: 8px;
        --kylin-collapse-bg: #fff;
        --kylin-collapse-transition: 0.3s;
        --kylin-collapse-collapsed-height: 48px;
    }
`;
