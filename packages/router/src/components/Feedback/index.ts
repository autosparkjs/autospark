import { styles } from "./styles";

// 创建解析器实例
let parser: any = null;
try {
    // @ts-ignore
    const rjson = require("really-relaxed-json");
    parser = rjson.createParser();
} catch {
    // 如果解析器不可用，使用 JSON.parse
    parser = {
        stringToJson: (str: string) => JSON.parse(str)
    };
}

const parseJson = (str: string) => parser.stringToJson(str);

/**
 * 内置错误类型
 */
type ErrorType = "info" | "warn" | "error" | "success";

/**
 * 动作配置类型
 */
interface ActionConfig {
    /** 动作名称/标识 */
    name: string;
    /** 按钮标题 */
    title?: string;
    /** 按钮提示文本 */
    tips?: string;
    /** 图标（SVG字符串或图片URL） */
    icon?: string;
    /** 是否为主要按钮 */
    primary?: boolean;
}

/**
 * kylin:action 事件详情类型
 */
interface ActionEventDetail extends ActionConfig {}

/**
 * 内置图标 SVG
 */
const BUILTIN_ICONS: Record<ErrorType, string> = {
    info: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`,
    warn: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`,
    error: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`,
    success: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>`,
};

/**
 * 默认动作图标
 */
const ACTION_ICONS = {
    close: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`,
    retry: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>`,
    back: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>`,
};

/**
 * 反馈页面组件（原生 Web Components 版本）
 *
 * 用于显示各种类型的消息、错误和状态页面。
 * 支持自定义图标、内置类型、动作按钮等功能。
 *
 * @example
 * ```html
 * <kylin-feedback
 *   type="error"
 *   message="加载失败"
 *   description="无法获取资源，请稍后重试"
 *   retryable
 *   backable
 * ></kylin-feedback>
 * ```
 */
export class KylinFeedback extends HTMLElement {
    // 私有属性存储
    private _message?: string;
    private _description?: string;
    private _icon?: string;
    private _type?: ErrorType;
    private _actions?: ActionConfig[] | string;
    private _closeable = false;
    private _retryable = false;
    private _backable = false;
    private _inline = false;

    // 声明观察的属性
    static observedAttributes = [
        "message",
        "description",
        "icon",
        "type",
        "actions",
        "closeable",
        "retryable",
        "backable",
        "inline"
    ];

    // 属性访问器
    get message(): string | undefined {
        return this._message;
    }
    set message(value: string | undefined) {
        this._message = value;
        this._render();
    }

    get description(): string | undefined {
        return this._description;
    }
    set description(value: string | undefined) {
        this._description = value;
        this._render();
    }

    get icon(): string | undefined {
        return this._icon;
    }
    set icon(value: string | undefined) {
        this._icon = value;
        this._render();
    }

    get type(): ErrorType | undefined {
        return this._type;
    }
    set type(value: ErrorType | undefined) {
        this._type = value;
        this._render();
    }

    get actions(): ActionConfig[] | string | undefined {
        return this._actions;
    }
    set actions(value: ActionConfig[] | string | undefined) {
        this._actions = value;
        this._render();
    }

    get closeable(): boolean {
        return this._closeable;
    }
    set closeable(value: boolean) {
        this._closeable = value;
        this._render();
    }

    get retryable(): boolean {
        return this._retryable;
    }
    set retryable(value: boolean) {
        this._retryable = value;
        this._render();
    }

    get backable(): boolean {
        return this._backable;
    }
    set backable(value: boolean) {
        this._backable = value;
        this._render();
    }

    get inline(): boolean {
        return this._inline;
    }
    set inline(value: boolean) {
        this._inline = value;
        this._render();
    }

    connectedCallback() {
        // 创建 Shadow DOM
        this.attachShadow({ mode: "open" });
        // 应用样式
        if (this.shadowRoot) {
            this.shadowRoot.adoptedStyleSheets = [styles];
        }
        // 初始渲染
        this._render();
    }

    /**
     * 属性变化回调
     */
    attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
        if (oldValue === newValue) return;

        switch (name) {
            case "message":
                this.message = newValue || undefined;
                break;
            case "description":
                this.description = newValue || undefined;
                break;
            case "icon":
                this.icon = newValue || undefined;
                break;
            case "type":
                this.type = newValue as ErrorType;
                break;
            case "actions":
                this.actions = newValue || undefined;
                break;
            case "closeable":
                this.closeable = newValue !== null;
                break;
            case "retryable":
                this.retryable = newValue !== null;
                break;
            case "backable":
                this.backable = newValue !== null;
                break;
            case "inline":
                this.inline = newValue !== null;
                break;
        }
    }

    /**
     * 解析后的动作列表
     */
    private get _parsedActions(): ActionConfig[] {
        if (!this._actions) return [];

        let parsed: ActionConfig[];
        if (typeof this._actions === "string") {
            try {
                parsed = parseJson(this._actions) as ActionConfig[];
            } catch {
                console.warn("[kylin-feedback] Failed to parse actions:", this._actions);
                return [];
            }
        } else {
            parsed = this._actions;
        }

        // 解析每个 action 的 icon 字段（可能是 JSON 字符串）
        return parsed.map((action) => {
            if (action.icon && typeof action.icon === "string") {
                try {
                    const parsedIcon = parseJson(action.icon);
                    return { ...action, icon: parsedIcon };
                } catch {
                    // 保持原样
                    return action;
                }
            }
            return action;
        });
    }

    /**
     * 获取所有要显示的动作按钮
     */
    private get _allActions(): ActionConfig[] {
        const result: ActionConfig[] = [...this._parsedActions];

        if (this._backable) {
            result.unshift({
                name: "back",
                title: "返回",
                icon: ACTION_ICONS.back,
            });
        }

        if (this._retryable) {
            result.unshift({
                name: "retry",
                title: "重试",
                icon: ACTION_ICONS.retry,
                primary: true,
            });
        }

        if (this._closeable) {
            result.push({
                name: "close",
                title: "关闭",
                icon: ACTION_ICONS.close,
            });
        }

        return result;
    }

    /**
     * 渲染图标 HTML
     */
    private _renderIcon(): HTMLElement | null {
        const iconDiv = document.createElement("div");

        // 优先使用自定义 icon
        if (this._icon) {
            iconDiv.className = "icon";
            // 判断是否为 SVG（以 <svg 开头）
            if (this._icon.trim().startsWith("<svg")) {
                iconDiv.innerHTML = this._icon;
                return iconDiv;
            }
            // 作为图片 URL 处理
            const img = document.createElement("img");
            img.className = "icon";
            img.src = this._icon;
            img.alt = "";
            return img;
        }

        // 使用内置类型图标
        if (this._type && BUILTIN_ICONS[this._type]) {
            iconDiv.className = `icon ${this._type}`;
            iconDiv.innerHTML = BUILTIN_ICONS[this._type];
            return iconDiv;
        }

        // 默认使用 error 图标
        iconDiv.className = "icon error";
        iconDiv.innerHTML = BUILTIN_ICONS.error;
        return iconDiv;
    }

    /**
     * 处理动作按钮点击
     */
    private _handleAction(action: ActionConfig, event: Event): void {
        // 阻止默认行为
        event.preventDefault();
        event.stopPropagation();

        // 分发自定义事件，冒泡并允许穿越 Web Component 边界
        const customEvent = new CustomEvent<ActionEventDetail>("kylin:action", {
            detail: action,
            bubbles: true,
            composed: true, // 允许穿越 Shadow DOM 边界
        });

        this.dispatchEvent(customEvent);
    }

    /**
     * 渲染单个动作按钮
     */
    private _renderActionButton(action: ActionConfig): HTMLElement {
        const button = document.createElement("button");
        button.className = "action-button";
        if (action.primary) {
            button.classList.add("primary");
        }
        button.title = action.tips || action.title || action.name;

        // 添加图标
        if (action.icon) {
            const iconSpan = document.createElement("span");
            iconSpan.className = "action-icon";
            iconSpan.innerHTML = action.icon;
            button.appendChild(iconSpan);
        }

        // 添加标题
        const titleNode = document.createTextNode(action.title || action.name);
        button.appendChild(titleNode);

        // 绑定点击事件
        button.addEventListener("click", (e) => this._handleAction(action, e));

        return button;
    }

    /**
     * 渲染方法
     */
    private _render() {
        if (!this.shadowRoot) return;

        // 创建容器
        const container = document.createElement("div");
        container.className = "container";

        // 渲染图标
        const iconHtml = this._renderIcon();
        if (iconHtml) {
            container.appendChild(iconHtml);
        }

        // 渲染消息
        if (this._message) {
            const messageDiv = document.createElement("div");
            messageDiv.className = "message";
            messageDiv.textContent = this._message;
            container.appendChild(messageDiv);
        }

        // 渲染描述
        if (this._description) {
            const descriptionDiv = document.createElement("div");
            descriptionDiv.className = "description";
            descriptionDiv.textContent = this._description;
            container.appendChild(descriptionDiv);
        }

        // 渲染动作按钮
        const actions = this._allActions;
        if (actions.length > 0) {
            const actionsDiv = document.createElement("div");
            actionsDiv.className = "actions";
            actions.forEach((action) => {
                actionsDiv.appendChild(this._renderActionButton(action));
            });
            container.appendChild(actionsDiv);
        }

        // 清空并添加新内容
        this.shadowRoot.innerHTML = "";
        this.shadowRoot.appendChild(container);
    }
}

// 注册自定义元素
if (!customElements.get("kylin-feedback")) {
    customElements.define("kylin-feedback", KylinFeedback);
}

declare global {
    interface HTMLElementTagNameMap {
        "kylin-feedback": KylinFeedback;
    }

    interface HTMLElementEventMap {
        "kylin:action": CustomEvent<ActionEventDetail>;
    }
}
