import { OutletLayoutBase } from "./base.layout";
import type { KylinOutlet } from "./index";
import type { KylinSlot } from "../Slot";
import { css } from "lit";

/**
 * Tabs 布局
 * - 自动创建 kylin-tabs-header
 * - 点击 kylin-link 触发路由，由路由机制切换视图
 * - 不需要 JS 控制 tab 切换
 */
export class TabsLayout extends OutletLayoutBase {
    static styles = css`
        /* Tabs 基础布局 */
        kylin-outlet[layout="tabs"] {
            display: flex;
            flex-direction: column;
        }

        /* Tabs header */
        .kylin-tabs-header {
            display: flex;
            gap: var(--kylin-tabs-gap, 4px);
            padding: var(--kylin-tabs-padding, 8px 12px);
            background: var(--kylin-tabs-bg, #f5f5f5);
            border-bottom: var(--kylin-tabs-border-bottom, 1px solid #e0e0e0);
            overflow-x: auto;
            flex-shrink: 0;
        }

        /* kylin-link 样式 */
        kylin-outlet[layout="tabs"] .kylin-tabs-header kylin-link {
            display: inline-flex;
            align-items: center;
            padding: var(--kylin-tab-padding, 8px 16px);
            border-radius: var(--kylin-tab-radius, 6px 6px 0 0);
            font-size: var(--kylin-tab-font-size, 14px);
            font-weight: var(--kylin-tab-font-weight, 500);
            color: var(--kylin-tab-color, #666);
            text-decoration: none;
            cursor: pointer;
            transition: all 0.2s ease;
            white-space: nowrap;
        }

        kylin-outlet[layout="tabs"] .kylin-tabs-header kylin-link:hover {
            color: var(--kylin-tab-hover-color, #333);
            background: var(--kylin-tab-hover-bg, rgba(0, 0, 0, 0.05));
        }

        kylin-outlet[layout="tabs"] .kylin-tabs-header kylin-link.active {
            color: var(--kylin-tab-active-color, #1890ff);
            background: var(--kylin-tab-active-bg, #fff);
            font-weight: var(--kylin-tab-active-font-weight, 600);
        }

        /* 内容区域 */
        kylin-outlet[layout="tabs"] > kylin-slot {
            display: none;
            flex: 1;
            overflow: auto;
            padding: var(--kylin-view-padding, 16px);
        }

        kylin-outlet[layout="tabs"] > kylin-slot.active {
            display: block;
            animation: kylin-view-fade-in var(--kylin-view-transition-duration, 0.2s) ease-out;
        }

        /* Left 方向 */
        :host([layout="tabs"][tab-direction="left"]) {
            flex-direction: row;
        }

        :host([layout="tabs"][tab-direction="left"]) .kylin-tabs-header {
            flex-direction: column;
            border-right: 1px solid #e0e0e0;
            border-bottom: none;
            min-width: 120px;
            max-width: 250px;
        }

        /* Right 方向 */
        :host([layout="tabs"][tab-direction="right"]) {
            flex-direction: row-reverse;
        }

        :host([layout="tabs"][tab-direction="right"]) .kylin-tabs-header {
            flex-direction: column;
            border-left: 1px solid #e0e0e0;
            border-bottom: none;
            min-width: 120px;
            max-width: 250px;
        }

        /* Bottom 方向 */
        :host([layout="tabs"][tab-direction="bottom"]) {
            flex-direction: column-reverse;
        }

        :host([layout="tabs"][tab-direction="bottom"]) .kylin-tabs-header {
            border-top: 1px solid #e0e0e0;
            border-bottom: none;
        }

        /* 响应式 */
        @media (max-width: 768px) {
            :host([layout="tabs"][tab-direction="left"]),
            :host([layout="tabs"][tab-direction="right"]) {
                flex-direction: column;
            }

            :host([layout="tabs"][tab-direction="left"]) .kylin-tabs-header,
            :host([layout="tabs"][tab-direction="right"]) .kylin-tabs-header {
                flex-direction: row;
                width: 100%;
                max-width: none;
                border-right: none;
                border-left: none;
                border-bottom: 1px solid #e0e0e0;
            }
        }
    `;

    private _tabsHeader: HTMLElement | null = null;
    private _observer: MutationObserver | null = null;

    init(): void {
        this._createTabsHeader();
        this._setupActiveObserver();
    }

    cleanup(): void {
        if (this._tabsHeader && this._tabsHeader.parentElement === this.outlet) {
            this._tabsHeader.remove();
        }
        if (this._observer) {
            this._observer.disconnect();
        }
    }

    onSlotChange(): void {
        // 当视图容器变化时，重建 tabs
        this._rebuildTabs();
    }

    onPropertyChanged(name: string): void {
        if (name === "tabDirection") {
            // 方向变化时，调整 tabs 位置
            this._repositionHeader();
        }
    }

    /**
     * 创建 tabs 头部
     */
    private _createTabsHeader(): void {
        if (this._tabsHeader) return;

        const header = document.createElement("div");
        header.className = "kylin-tabs-header";
        this._tabsHeader = header;

        this._repositionHeader();
        this._rebuildTabs();
    }

    /**
     * 根据方向调整 tabs 位置
     */
    private _repositionHeader(): void {
        if (!this._tabsHeader) return;

        const tabDirection = (this.outlet as any).tabDirection || "top";

        if (tabDirection === "bottom") {
            this.outlet.appendChild(this._tabsHeader);
        } else {
            this.outlet.insertBefore(this._tabsHeader, this.outlet.firstChild);
        }
    }

    /**
     * 重建 tabs 内容
     */
    private _rebuildTabs(): void {
        if (!this._tabsHeader) return;

        const views = this.outlet.getSlots();
        this._tabsHeader.innerHTML = "";

        views.forEach((view) => {
            const slot = view as KylinSlot;
            const url = slot.url || slot.getAttribute("data-url");
            if (!url) return;

            const link = document.createElement("kylin-link");
            link.setAttribute("to", url);

            const label = view.getAttribute("data-label") || this._extractLabelFromUrl(url);
            link.textContent = label;

            if (view.hasAttribute("active")) {
                link.classList.add("active");
            }

            this._tabsHeader!.appendChild(link);
        });
    }

    /**
     * 从 URL 提取标签
     */
    private _extractLabelFromUrl(url: string): string {
        const parts = url.split("/").filter(Boolean);
        const lastPart = parts[parts.length - 1];
        if (!lastPart) return "Home";
        return lastPart.charAt(0).toUpperCase() + lastPart.slice(1);
    }

    /**
     * 监听视图的 active 状态变化，同步到 tabs
     */
    private _setupActiveObserver(): void {
        this._observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === "attributes" && mutation.attributeName === "class") {
                    const target = mutation.target as HTMLElement;
                    if (target.classList.contains("kylin-slot")) {
                        this._syncTabActiveState(target);
                    }
                }
            });
        });

        this._observer.observe(this.outlet, {
            attributes: true,
            attributeFilter: ["class"],
            subtree: true,
        });
    }

    /**
     * 同步 tab 的 active 状态
     */
    private _syncTabActiveState(view: HTMLElement): void {
        if (!this._tabsHeader) return;

        const url = view.getAttribute("data-url");
        if (!url) return;

        const links = this._tabsHeader.querySelectorAll("kylin-link");
        links.forEach((link) => {
            if (link.getAttribute("to") === url) {
                if (view.hasAttribute("active")) {
                    link.classList.add("active");
                } else {
                    link.classList.remove("active");
                }
            }
        });
    }
}
