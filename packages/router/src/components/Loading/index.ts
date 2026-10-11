import { styles } from "./styles";

/**
 * kylin-loading 组件（原生 Web Components 版本）
 *
 * 加载状态指示器组件
 * - 使用 Shadow DOM 进行样式隔离
 * - 支持自定义加载消息
 * - 动画加载指示器
 */
export class KylinLoading extends HTMLElement {
    // 私有属性存储
    private _message: string = "Loading...";

    // 声明观察的属性
    static observedAttributes = ["message"];

    // 属性访问器
    get message(): string {
        return this._message;
    }
    set message(value: string) {
        const oldValue = this._message;
        this._message = value || "Loading...";
        if (oldValue !== this._message) {
            this._render();
        }
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
        if (name === "message" && newValue !== oldValue) {
            this.message = newValue || "Loading...";
        }
    }

    /**
     * 渲染方法
     */
    private _render() {
        if (!this.shadowRoot) return;

        // 清空现有内容
        this.shadowRoot.innerHTML = "";

        // 创建 spinner
        const spinner = document.createElement("div");
        spinner.className = "spinner";

        // 创建 message
        const message = document.createElement("div");
        message.className = "message";
        message.textContent = this._message;

        // 组装 DOM
        this.shadowRoot.appendChild(spinner);
        this.shadowRoot.appendChild(message);
    }
}

// 注册自定义元素
if (!customElements.get("kylin-loading")) {
    customElements.define("kylin-loading", KylinLoading);
}

declare global {
    interface HTMLElementTagNameMap {
        "kylin-loading": KylinLoading;
    }
}
