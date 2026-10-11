/**
 * KylinSlot - 路由槽位组件（原生 Web Component）
 *
 * 用于在 kylin-outlet 中渲染单个路由视图
 *
 * @module components/Slot
 */

import type { RouteSignalReuslt } from "./types";
import { styles } from "./styles";

export class KylinSlot extends HTMLElement {
    static styles = styles;
    // ============================================
    // 属性定义
    // ============================================

    static observedAttributes = ["url", "loading", "active"];

    /**
     * 当前 URL，用于参数变化检测
     */
    get url(): string | undefined {
        return this.getAttribute("url") || undefined;
    }
    set url(value: string | undefined) {
        if (value === undefined) {
            this.removeAttribute("url");
        } else {
            this.setAttribute("url", value);
        }
    }

    /**
     * 是否显示 Loading 状态
     */
    get loading(): boolean {
        return this.hasAttribute("loading");
    }
    set loading(value: boolean) {
        if (value) {
            this.setAttribute("loading", "");
        } else {
            this.removeAttribute("loading");
        }
    }

    /**
     * 是否为活动状态
     * 当设置为 true 时，自动将同一父元素下的其他 slot 的 active 设为 false
     */
    get active(): boolean {
        return this.hasAttribute("active");
    }
    set active(value: boolean) {
        if (value) {
            this.setAttribute("active", "");
        } else {
            this.removeAttribute("active");
        }
    }

    // ============================================
    // 生命周期回调
    // ============================================

    constructor() {
        super();
    }
    connectedCallback() {
        this.adoptLightStyles();
    }
    adoptLightStyles() {
        const styles = (this.constructor as any).styles as any;
        if (document.adoptedStyleSheets) {
            document.adoptedStyleSheets = [...document.adoptedStyleSheets, styles];
        } else {
            // 降级方案：创建 <style> 标签并添加到 <head>
            const style = document.createElement("style");
            style.textContent = styles.cssText;
            document.head.appendChild(style);
        }
    }
    attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
        if (oldValue === newValue) return;

        // active 变化时更新兄弟节点
        if (name === "active" && newValue !== null) {
            this.#updateSiblingsActive();
        }

        // loading 变化时显示/隐藏 loading 组件
        if (name === "loading") {
            if (newValue !== null) {
                this.showLoading();
            } else {
                this.hideLoading();
            }
        }
    }

    // ============================================
    // 公共方法
    // ============================================

    /**
     * 显示 Loading 状态
     * 在内部插入 kylin-loading 元素，不覆盖其他子元素
     */
    showLoading(): void {
        // 如果已经有 kylin-loading，不重复添加
        if (this.querySelector("kylin-loading")) {
            return;
        }
        const loading = document.createElement("kylin-loading");
        loading.style.cssText = "z-index: 9;";
        this.appendChild(loading);
    }

    /**
     * 隐藏 Loading 状态
     * 删除内部的 kylin-loading 元素
     */
    hideLoading(): void {
        const loading = this.querySelector("kylin-loading");
        if (loading) {
            loading.remove();
        }
    }

    /**
     * 解析视图内容到槽位中
     *
     * @param view - 视图内容（HTML字符串或HTMLElement）
     * @param data - 路由数据（RouteSignalReuslt类型，可选）
     * @param cssVars - CSS变量列表（预留参数）
     * @returns this - 返回 slot 元素本身，用于传递给 afterRender 钩子
     */
    resolve(view: string | HTMLElement, data?: RouteSignalReuslt, cssVars?: string[]): KylinSlot {
        // 设置 Alpine x-data 属性
        if (data?.hash) {
            this.setAttribute("x-data", data.hash);
        } else {
            this.setAttribute("x-data", "{}");
        }

        // 直接设置内容
        if (typeof view === "string") {
            this.innerHTML = view;
        } else {
            this.innerHTML = "";
            this.appendChild(view);
        }

        // 解析完成后设置 loading = false
        this.loading = false;

        return this;
    }

    /**
     * 拒绝视图加载，显示错误页面
     *
     * @param error - 错误对象
     * @param errorElement - 错误页面元素
     */
    reject(_error: any, errorElement: HTMLElement): void {
        this.innerHTML = "";
        this.appendChild(errorElement.cloneNode(true));
        this.loading = false;
    }

    /**
     * 完成渲染，移除Loading状态
     */
    finally(): void {
        this.loading = false;
    }

    /**
     * 销毁槽位，从DOM中移除
     */
    abort(): void {
        this.remove();
    }

    // ============================================
    // 私有方法
    // ============================================

    /**
     * 更新兄弟节点的 active 状态
     */
    #updateSiblingsActive(): void {
        if (!this.parentElement) return;

        const siblings = Array.from(
            this.parentElement.querySelectorAll<KylinSlot>(":scope > kylin-slot"),
        );

        siblings.forEach((sibling) => {
            if (sibling !== this && sibling.active) {
                sibling.active = false;
            }
        });
    }
}

// 注册自定义元素
if (!customElements.get("kylin-slot")) {
    customElements.define("kylin-slot", KylinSlot);
}

declare global {
    interface HTMLElementTagNameMap {
        "kylin-slot": KylinSlot;
    }
}
