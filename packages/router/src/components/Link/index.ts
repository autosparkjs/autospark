import type { AutoSparkRouter } from "@/router";
import { prefixBaseUrl } from "@/utils/prefixBaseUrl";
import { AutoSparkRouterElementBase } from "../Base";

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
 * AutoSparkLink 组件（原生 Web Components 版本）
 *
 * 路由链接组件，提供声明式导航：
 * - 使用 Light DOM 模式，**内层是真实的 `<a>` 元素**（见下方「为什么内层是 `<a>`」）
 * - `href` 属性是 `to` 的别名（双向），便于静态声明与 SEO 工具识别
 * - 内部路由：`<a>` 的 href 带 base 前缀（真实可爬），点击由 router 接管（SPA 导航）
 * - 外部链接：不接管默认行为，浏览器直接跳转
 * - 修饰键 / 中键点击：交给浏览器（新标签打开真实 href），不做 SPA 拦截
 *
 * ## 为什么内层是 `<a>`
 *
 * 爬虫与「预 JS」环境只能看到静态 DOM。若 `auto-link` 自身伪装成链接（只在自定义元素上
 * 挂 href），爬虫拿不到任何链接；内层 `<a href>` 让链接在 JS 未执行时就可被发现与跟随。
 *
 * ## 导航接管在哪
 *
 * 组件自身**不绑定**点击监听——导航由 router 的**文档级点击委托**统一接管
 * （`AutoSparkRouter.attach` 注册、`detach` 注销）：命中的 `auto-link`
 * 调用其 {@link AutoSparkLink.handleClick}；普通 `<a href>` 指向内部路由时
 * 亦被同一委托接管（组件的价值在 base 前缀自动化与 `replace` 声明，ADR-0009）。
 * 这样链接无需逐个注册监听，也天然覆盖运行期才插入 DOM 的链接。
 *
 * ## 样式
 *
 * 内层 `<a>` 会带上浏览器默认的链接样式。需要融入宿主排版时用：
 * `auto-link > a { color: inherit; text-decoration: inherit }`
 * （示例与应用侧样式表提供，组件不内建注入）。
 */
export class AutoSparkLink extends AutoSparkRouterElementBase {
    // 私有属性存储
    private _to = "";
    private _replace = false;
    private _target = "";
    private _rel = "";

    /** 内层真实锚点 */
    private _anchor: HTMLAnchorElement | null = null;

    // 声明观察的属性（`href` 是 `to` 的别名）
    static observedAttributes = ["to", "replace", "target", "rel", "href"];

    // 属性访问器
    get to(): string {
        return this._to;
    }
    set to(value: string) {
        const oldValue = this._to;
        this._to = value;
        if (oldValue !== value) {
            this._updateAnchor();
        }
    }

    /** `href` 别名：与 `to` 双向同步（声明式写 href 等价于写 to） */
    get href(): string {
        return this._to;
    }
    set href(value: string) {
        this.to = value;
    }

    get replace(): boolean {
        return this._replace;
    }
    set replace(value: boolean) {
        this._replace = value;
    }

    get target(): string {
        return this._target;
    }
    set target(value: string) {
        const oldValue = this._target;
        this._target = value;
        if (oldValue !== value) {
            this._updateAnchor();
        }
    }

    get rel(): string {
        return this._rel;
    }
    set rel(value: string) {
        const oldValue = this._rel;
        this._rel = value;
        if (oldValue !== value) {
            this._updateAnchor();
        }
    }

    connectedCallback() {
        super.connectedCallback();
        this._render();
    }

    /**
     * 属性变化回调
     * `href` 归一到 `to`（别名），其余同名映射
     */
    attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
        if (name === "href") {
            if (newValue !== null) this.to = newValue;
            return;
        }
        const propName = this._attributeToProperty(name);
        if (newValue !== null) {
            (this as any)[propName] = this._coerceAttributeValue(propName, newValue);
        }
    }

    /**
     * 渲染：构造内层 `<a>` 并收纳既有子节点
     * Light DOM 下子节点会被移入 `<a>`，链接文案与结构因此与原生 `<a>` 一致
     */
    private _render() {
        if (!this._anchor) {
            this._anchor = document.createElement("a");
            // 把已有子节点收进内层 <a>（保留调用方的文案/结构）
            while (this.firstChild) {
                this._anchor.appendChild(this.firstChild);
            }
            this.appendChild(this._anchor);
        }
        this._updateAnchor();
    }

    /**
     * 同步内层 `<a>` 的 href / target / rel
     *
     * - 内部路由：href 带 base 前缀（`prefixBaseUrl`），保证 `/shop` 这类子应用下
     *   爬虫拿到的是真实可跟随的地址
     * - 外部链接：原样输出（含 `://`），浏览器直接跳转
     */
    private _updateAnchor() {
        if (!this._anchor) return;
        const anchor = this._anchor;

        const href = this._resolveHref(this._to);
        if (href) {
            anchor.setAttribute("href", href);
        } else {
            anchor.removeAttribute("href");
        }

        if (this._target) {
            anchor.setAttribute("target", this._target);
        } else {
            anchor.removeAttribute("target");
        }

        const computedRel = this._getComputedRel();
        if (computedRel) {
            anchor.setAttribute("rel", computedRel);
        } else {
            anchor.removeAttribute("rel");
        }
    }

    /** 解析最终 href：内部路由加 base 前缀；外部 / 绝对地址原样 */
    private _resolveHref(target: string): string {
        if (!target) return "";
        if (!isInternalLink(target)) return target;
        return prefixBaseUrl(target, this.router?.options?.base);
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

    /**
     * 处理点击事件（由 router 的文档级点击委托调用）
     * - 修饰键 / 中键：不拦截，交给浏览器（新标签打开真实 href）
     * - 外部链接：不阻止默认行为，允许浏览器直接跳转
     * - 危险协议：阻止默认行为，不执行任何导航
     * - 内部路由：阻止默认行为，使用 router 导航
     * - 无 router 实例：降级为普通 `<a>` 标签（内层 href 由浏览器跟随）
     */
    handleClick(event: MouseEvent) {
        // 修饰键 / 中键点击：交给浏览器处理（用真实 href 开新标签）
        if (
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey ||
            event.button === 1
        ) {
            return;
        }

        const target = this.to;

        // 安全检查：拒绝危险协议
        if (isDangerousProtocol(target)) {
            event.preventDefault();
            return;
        }

        // 外部链接 - 不阻止默认行为，允许浏览器直接跳转
        if (!isInternalLink(target)) {
            return;
        }

        this.getRouter(() => {
            if (!this.router) {
                // 没有 router 实例，降级为普通 <a> 标签（不阻止默认行为）
                return;
            }

            // 根据 replace 属性选择导航方式
            if (this.replace) {
                this.router.replace(target);
            } else {
                this.router.push(target);
            }
        });

        // 阻止默认的链接跳转行为
        event.preventDefault();
    }

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
if (!customElements.get("auto-link")) {
    customElements.define("auto-link", AutoSparkLink);
}

declare global {
    interface HTMLElementTagNameMap {
        "auto-link": AutoSparkLink;
    }
}
