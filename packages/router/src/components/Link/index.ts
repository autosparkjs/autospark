import type { KylinRouter } from "@/router";
import { joinPath } from "@/utils/joinPath";
import { KylinRouterElementBase } from "../Base";

/**
 * 判断目标路径是否为内部路由
 * 内部路由：以 / 开头且不包含 ://
 * 外部链接：包含 ://（如 https://、http://）
 */
export function isInternalLink(path: string): boolean {
    if (!path) return false;
    return path.startsWith("/") && !path.includes("://");
}

/**
 * 检查路径是否为危险协议（javascript:、data:）
 * 按照 T-02-01 威胁缓解策略实现
 */
export function isDangerousProtocol(path: string): boolean {
    const trimmed = path.trim().toLowerCase();
    return trimmed.startsWith("javascript:") || trimmed.startsWith("data:");
}

/**
 * KylinLink 组件（原生 Web Components 版本）
 *
 * 路由链接组件，提供声明式导航
 * - 使用 Light DOM 模式
 * - 元素本身表现为 <a> 标签的行为
 * - 支持内部路由和外部链接
 */
export class KylinLink extends KylinRouterElementBase {
    // 私有属性存储
    private _to = "";
    private _replace = false;
    private _target = "";
    private _rel = "";

    // 声明观察的属性
    static observedAttributes = ["to", "replace", "target", "rel"];

    // 属性访问器
    get to(): string {
        return this._to;
    }
    set to(value: string) {
        const oldValue = this._to;
        this._to = value;
        if (oldValue !== value) {
            this._updateAttributes();
        }
    }

    get replace(): boolean {
        return this._replace;
    }
    set replace(value: boolean) {
        const oldValue = this._replace;
        this._replace = value;
        if (oldValue !== value) {
            // replace 属性不需要反映到 DOM，但可能需要更新状态
        }
    }

    get target(): string {
        return this._target;
    }
    set target(value: string) {
        const oldValue = this._target;
        this._target = value;
        if (oldValue !== value) {
            this._updateAttributes();
        }
    }

    get rel(): string {
        return this._rel;
    }
    set rel(value: string) {
        const oldValue = this._rel;
        this._rel = value;
        if (oldValue !== value) {
            this._updateAttributes();
        }
    }

    /**
     * 计算最终的 rel 属性
     * - 如果用户已设置 rel，使用用户设置的值
     * - 如果 target="_blank"，自动添加 noopener noreferrer 防止安全漏洞
     */
    private _getComputedRel(): string {
        if (this.rel) {
            return this.rel;
        }
        if (this.target === "_blank") {
            return "noopener noreferrer";
        }
        return "";
    }

    connectedCallback() {
        super.connectedCallback();
        // 使用 Light DOM 模式
        this._render();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        // 移除事件监听器
        this.removeEventListener("click", this._boundHandleClick);
    }

    /**
     * 属性变化回调
     */
    attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
        const propName = this._attributeToProperty(name);
        if (newValue !== null) {
            (this as any)[propName] = this._coerceAttributeValue(propName, newValue);
        }
    }

    /**
     * 渲染方法 - Light DOM 模式
     */
    private _render() {
        // 将属性设置到元素本身（Light DOM）
        this._updateAttributes();

        // 绑定点击事件到元素本身
        if (!this._boundHandleClick) {
            this._boundHandleClick = this.handleClick.bind(this);
        }
        this.addEventListener("click", this._boundHandleClick);
    }

    /**
     * 更新元素属性
     */
    private _updateAttributes() {
        // 设置 href 属性
        if (this._to) {
            this.setAttribute("href", this._to);
        } else {
            this.removeAttribute("href");
        }

        // 设置 target 属性
        if (this._target) {
            this.setAttribute("target", this._target);
        } else {
            this.removeAttribute("target");
        }

        // 设置 rel 属性（计算后的值）
        const computedRel = this._getComputedRel();
        if (computedRel) {
            this.setAttribute("rel", computedRel);
        } else {
            this.removeAttribute("rel");
        }
    }

    /**
     * 处理点击事件
     * - 内部路由：阻止默认行为，使用 router 导航
     * - 外部链接：不阻止默认行为，允许浏览器直接跳转
     * - 危险协议：阻止默认行为，不执行任何导航
     * - 无 router 实例：降级为普通 <a> 标签
     */
    handleClick(event: Event) {
        const target = this.to;

        // 安全检查：拒绝危险协议
        if (isDangerousProtocol(target)) {
            event.preventDefault();
            return;
        }

        // 判断是否为内部路由
        if (!isInternalLink(target)) {
            // 外部链接 - 不阻止默认行为，允许浏览器直接跳转
            return;
        }

        // 内部路由处理
        this.getRouter(() => {
            if (!this.router) {
                // 没有 router 实例，降级为普通 <a> 标签（不阻止默认行为）
                return;
            }

            // 自动添加 base URL 前缀
            const baseUrl = this.router.options.base || "";
            let finalPath = target;

            // 如果路径不以 / 开头（相对路径），添加 base 前缀
            if (!target.startsWith("/")) {
                finalPath = joinPath(baseUrl, target);
            } else if (baseUrl !== "/" && baseUrl !== "") {
                // 如果路径以 / 开头且 base 不是根路径，需要检查是否需要添加前缀
                // 检查路径是否已经包含 base 前缀
                if (!target.startsWith(baseUrl)) {
                    finalPath = joinPath(baseUrl, target);
                }
            }

            // 根据 replace 属性选择导航方式
            if (this.replace) {
                this.router.replace(finalPath);
            } else {
                this.router.push(finalPath);
            }
        });

        // 阻止默认的链接跳转行为
        event.preventDefault();
    }

    // 辅助方法
    private _boundHandleClick?: (event: Event) => void;

    private _attributeToProperty(attr: string): string {
        // 将 attribute-name 转换为 propertyName
        return attr;
    }

    private _coerceAttributeValue(name: string, value: string): any {
        // 类型转换逻辑
        switch (name) {
            case "replace":
                return value !== null && value !== "false";
            default:
                return value;
        }
    }
}

// 注册自定义元素
if (!customElements.get("kylin-link")) {
    customElements.define("kylin-link", KylinLink);
}

declare global {
    interface HTMLElementTagNameMap {
        "kylin-link": KylinLink;
    }
}
