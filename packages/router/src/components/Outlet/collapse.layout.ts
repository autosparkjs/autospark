import { OutletLayoutBase } from "./base.layout";
import type { KylinOutlet } from "./index";
import { css } from "lit";

/**
 * Collapse 布局
 * - 允许同时展开多个视图容器
 * - 维护展开的视图容器 ID 数组
 * - .active 只控制焦点（第一次导航时）
 */
export class CollapseLayout extends OutletLayoutBase {
    static styles = css`
        kylin-outlet[layout="collapse"] {
            display: flex;
            flex-direction: column;
            gap: var(--kylin-collapse-gap, 8px);
        }

        kylin-outlet[layout="collapse"] > kylin-slot {
            border: var(--kylin-collapse-border, 1px solid #e0e0e0);
            border-radius: var(--kylin-collapse-radius, 8px);
            background: var(--kylin-collapse-bg, #fff);
            overflow: hidden;
            transition: all var(--kylin-collapse-transition, 0.3s) ease;
        }

        /* 折叠状态 */
        kylin-outlet[layout="collapse"] > kylin-slot:not(.expanded) {
            max-height: var(--kylin-collapse-collapsed-height, 48px);
        }

        kylin-outlet[layout="collapse"] > kylin-slot:not(.expanded) > * {
            display: none;
        }

        /* 展开状态 */
        kylin-outlet[layout="collapse"] > kylin-slot.expanded {
            max-height: none;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        kylin-outlet[layout="collapse"] > kylin-slot.expanded > * {
            display: contents;
        }

        /* Active 焦点样式 */
        kylin-outlet[layout="collapse"] > kylin-slot.active {
            border-color: #1890ff;
        }

        /* 悬停效果 */
        kylin-outlet[layout="collapse"] > kylin-slot:hover:not(.expanded) {
            border-color: #bbb;
        }
    `;

    /**
     * 展开的视图容器 ID 集合
     */
    private _expandedIds = new Set<string>();

    /**
     * 点击处理器引用
     */
    private _clickHandler: ((e: Event) => void) | null = null;

    init(): void {
        this._clickHandler = this._handleClick.bind(this);
        this.outlet.addEventListener("click", this._clickHandler);

        // 初始化时，将当前 active 的视图添加到展开集合
        const activeView = this.outlet.querySelector(":scope > kylin-slot.active");
        if (activeView && activeView.id) {
            this._expandedIds.add(activeView.id);
        }
    }

    cleanup(): void {
        if (this._clickHandler) {
            this.outlet.removeEventListener("click", this._clickHandler);
        }
        this._expandedIds.clear();
    }

    onSlotChange(mutations: MutationRecord[]): void {
        // 当视图容器被移除时，从展开集合中移除
        mutations.forEach((mutation) => {
            mutation.removedNodes.forEach((node) => {
                if (node instanceof HTMLElement && node.classList.contains("kylin-slot")) {
                    this._expandedIds.delete(node.id);
                }
            });
        });
    }

    onPropertyChanged(name: string, _oldValue: any, newValue: any): void {
        if (name === "view" && newValue) {
            // 当路由导航到新视图时，将其添加到展开集合
            this._expandedIds.add(newValue);
            this._updateExpandedState();
        }
    }

    /**
     * 处理点击事件
     */
    private _handleClick(e: Event): void {
        const target = e.target as HTMLElement;
        const view = target.closest(".kylin-view");

        if (view instanceof HTMLElement && view.id) {
            const isExpanded = this._expandedIds.has(view.id);

            if (isExpanded) {
                // 如果已展开，点击则折叠
                this._expandedIds.delete(view.id);
            } else {
                // 如果未展开，点击则展开
                this._expandedIds.add(view.id);
            }

            this._updateExpandedState();
        }
    }

    /**
     * 更新所有视图的展开状态
     */
    private _updateExpandedState(): void {
        const views = this.outlet.getSlots();

        views.forEach((view) => {
            if (this._expandedIds.has(view.id)) {
                view.classList.add("expanded");
            } else {
                view.classList.remove("expanded");
            }
        });
    }

    /**
     * 获取当前展开的视图 ID 数组
     */
    getExpandedIds(): string[] {
        return Array.from(this._expandedIds);
    }

    /**
     * 设置展开的视图 ID 数组
     */
    setExpandedIds(ids: string[]): void {
        this._expandedIds = new Set(ids);
        this._updateExpandedState();
    }

    /**
     * 切换指定视图的展开状态
     */
    toggleExpanded(id: string): void {
        if (this._expandedIds.has(id)) {
            this._expandedIds.delete(id);
        } else {
            this._expandedIds.add(id);
        }
        this._updateExpandedState();
    }

    /**
     * 展开指定视图
     */
    expand(id: string): void {
        this._expandedIds.add(id);
        this._updateExpandedState();
    }

    /**
     * 折叠指定视图
     */
    collapse(id: string): void {
        this._expandedIds.delete(id);
        this._updateExpandedState();
    }
}
