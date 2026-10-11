import type { KylinSlot } from "../Slot";
import type { KylinMatchedRouteItem } from "@/types";
import { OutletLayoutBase } from "./base.layout";
import { StackLayout } from "./stack.layout";
import { TabsLayout } from "./tabs.layout";
import { CollapseLayout } from "./collapse.layout";
import { findOutlet } from "@/utils/findOutlet";
import { KylinRouterElementBase } from "../Base";
import { styles as commonStyles } from "./styles";

/**
 * KylinOutlet 组件（原生 Web Components 版本）
 *
 * 路由出口组件，用于渲染匹配的视图
 * - 使用 Light DOM 模式
 * - 支持多种布局模式（stack、tabs、collapse）
 * - 支持 keepalive 缓存
 */
export class KylinOutlet extends KylinRouterElementBase {
    // 私有属性存储
    private _keepalive: boolean = true;
    private _loading: boolean = false;
    private _view?: string;
    private _layout: "stack" | "tabs" | "collapse" = "stack";
    private _tabDirection: "top" | "left" | "right" | "bottom" = "top";

    private mutationObserver: MutationObserver | null = null;
    private _layoutInstance: OutletLayoutBase | null = null;

    // 声明观察的属性
    static observedAttributes = [
        "keepalive",
        "loading",
        "view",
        "layout",
        "tabdirection"
    ];

    // 属性访问器
    get keepalive(): boolean {
        return this._keepalive;
    }
    set keepalive(value: boolean) {
        const oldValue = this._keepalive;
        const coercedValue = this._coerceBoolean(value);
        this._keepalive = coercedValue;
        this._onPropertyChanged("keepalive", oldValue, coercedValue);
        // 强制 keepalive 约束
        this._enforceKeepaliveConstraint();
    }

    get loading(): boolean {
        return this._loading;
    }
    set loading(value: boolean) {
        const oldValue = this._loading;
        const coercedValue = this._coerceBoolean(value);
        this._loading = coercedValue;
        this._onPropertyChanged("loading", oldValue, coercedValue);
    }

    get view(): string | undefined {
        return this._view;
    }
    set view(value: string | undefined) {
        const oldValue = this._view;
        this._view = value;
        this._onPropertyChanged("view", oldValue, value);
    }

    get layout(): "stack" | "tabs" | "collapse" {
        return this._layout;
    }
    set layout(value: "stack" | "tabs" | "collapse") {
        const oldValue = this._layout;
        this._layout = value;
        this._onPropertyChanged("layout", oldValue, value);
        // 强制 keepalive 约束
        this._enforceKeepaliveConstraint();
    }

    get tabDirection(): "top" | "left" | "right" | "bottom" {
        return this._tabDirection;
    }
    set tabDirection(value: "top" | "left" | "right" | "bottom") {
        const oldValue = this._tabDirection;
        this._tabDirection = value;
        this._onPropertyChanged("tabDirection", oldValue, value);
    }

    connectedCallback() {
        super.connectedCallback();
        this._injectStyles();
        this._switchLayout();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
            this.mutationObserver = null;
        }
        if (this._layoutInstance) {
            this._layoutInstance.cleanup();
            this._layoutInstance = null;
        }
    }

    /**
     * 属性变化回调
     */
    attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
        const propName = this._attributeToProperty(name);
        if (newValue !== null) {
            const coercedValue = this._coerceAttributeValue(propName, newValue);
            (this as any)[propName] = coercedValue;
        }
    }

    /**
     * 属性变化处理（替代 updated()）
     */
    private _onPropertyChanged(name: string, oldValue: any, newValue: any) {
        // 布局切换时重新初始化
        if (name === "layout" && oldValue !== newValue) {
            this._switchLayout();
        }

        // 通知布局实例
        if (this._layoutInstance) {
            this._layoutInstance.onPropertyChanged(name, oldValue, newValue);
        }
    }

    /**
     * 强制 keepalive 约束
     * 当 layout="tabs" 或 "collapse" 时，自动将 keepalive 设置为 true
     */
    private _enforceKeepaliveConstraint() {
        if ((this._layout === "tabs" || this._layout === "collapse") && !this._keepalive) {
            this._keepalive = true;
            // 反映到 DOM
            this.setAttribute("keepalive", "");
        }
    }

    /**
     * 获取当前布局实例
     */
    private _getLayout(): OutletLayoutBase | null {
        switch (this._layout) {
            case "stack":
                return new StackLayout(this);
            case "tabs":
                return new TabsLayout(this);
            case "collapse":
                return new CollapseLayout(this);
            default:
                return new StackLayout(this);
        }
    }

    /**
     * 切换布局时重新初始化
     */
    private _switchLayout(): void {
        // 清理旧布局
        if (this._layoutInstance) {
            this._layoutInstance.cleanup();
        }

        // 创建新布局
        this._layoutInstance = this._getLayout();
        this._layoutInstance?.init();
    }

    /**
     * 注入样式到 document.head
     * 仅在首次初始化时注入，如果已存在则忽略
     */
    private _injectStyles(): void {
        const styleId = "kylin-outlet";

        // 如果 head 中已存在，忽略
        const existingStyle = document.head.querySelector(`#${styleId}`);
        if (existingStyle) {
            return;
        }

        // 合并所有样式
        const allStyles = [
            commonStyles.cssText,
            StackLayout.styles.cssText,
            TabsLayout.styles.cssText,
            CollapseLayout.styles.cssText,
        ].join("\n");

        // 创建 style 元素
        const style = document.createElement("style");
        style.id = styleId;
        style.textContent = allStyles;

        document.head.appendChild(style);
    }

    /**
     * 根据 hash 获取 routeSlot
     * @param hash - routeSlot 的 hash
     * @returns routeSlot 元素
     */
    getSlot(hash: string): HTMLElement | null {
        return this.querySelector(`kylin-slot[id="${hash}"]`);
    }

    /**
     * 获取所有 viewContainer (kylin-slot 元素)
     */
    getSlots(): HTMLElement[] {
        return Array.from(this.querySelectorAll(":scope > kylin-slot[id]")) as HTMLElement[];
    }

    findOutlet(viewHash?: string): KylinOutlet {
        if (viewHash) {
            const viewContainer = this.getSlot(viewHash);
            if (viewContainer) {
                const outlet = findOutlet(viewContainer)[0];
                return outlet || this;
            }
        }
        return this;
    }

    // 辅助方法
    private _attributeToProperty(attr: string): string {
        // 将 attribute-name 转换为 propertyName
        if (attr === "tabdirection") {
            return "tabDirection";
        }
        return attr;
    }

    private _coerceAttributeValue(name: string, value: string): any {
        switch (name) {
            case "keepalive":
            case "loading":
                return this._coerceBoolean(value);
            default:
                return value;
        }
    }

    private _coerceBoolean(value: string | boolean | null): boolean {
        return value !== null && value !== "false" && value !== false;
    }
}

// 注册自定义元素
if (!customElements.get("kylin-outlet")) {
    customElements.define("kylin-outlet", KylinOutlet);
}

export type { KylinSlot } from "../Slot";

declare global {
    interface HTMLElementTagNameMap {
        "kylin-outlet": KylinOutlet;
    }
}
