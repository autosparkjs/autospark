import { LitElement, html, css } from "lit";
import { repeat } from "lit/directives/repeat.js";
import { presetThemes, themeManager } from "../src/index.ts";

/**
 * 右侧主题控制面板：lit web component（shadow DOM，样式自包含）
 *
 * 面板自身配色消费从 :root 继承穿透的 --auto-* CSS 变量，主题切换时面板随动。
 * 采用 static properties 而非装饰器声明响应式属性，规避 esbuild 标准装饰器转译差异。
 */
const SIZES = ["x-small", "small", "medium", "large", "x-large"];

const SIZE_ATTRS = [
    { attr: "size", label: "尺寸" },
    { attr: "radius", label: "圆角" },
    { attr: "spacing", label: "间距" },
    { attr: "shadow", label: "阴影" },
] as const;

type SizeAttr = (typeof SIZE_ATTRS)[number]["attr"];

export class ThemeControls extends LitElement {
    static properties = {
        dark: { type: Boolean },
        colorized: { type: Boolean },
        currentColor: { type: String },
    };

    // 四个尺寸属性当前值（medium 为默认态，与 ThemeScope 的"medium 移除属性"语义一致）
    private sizeValues: Record<SizeAttr, string> = {
        size: "medium",
        radius: "medium",
        spacing: "medium",
        shadow: "medium",
    };

    constructor() {
        super();
        this.dark = false;
        this.colorized = false;
        this.currentColor = "blue";
    }

    static styles = css`
        :host {
            display: block;
            padding: 1rem;
            font-size: 0.85rem;
            color: var(--auto-color, #333);
            box-sizing: border-box;
        }
        h3 {
            margin: 0 0 0.75rem;
            font-size: 0.95rem;
            color: var(--auto-secondary-color, #666);
        }
        .group {
            margin-bottom: 1.1rem;
        }
        .group-title {
            margin-bottom: 0.4rem;
            color: var(--auto-third-color, #999);
            font-size: 0.75rem;
        }
        .swatches {
            display: flex;
            flex-wrap: wrap;
            gap: 0.35rem;
        }
        .swatch {
            width: 1.3rem;
            height: 1.3rem;
            border-radius: var(--auto-border-radius, 4px);
            cursor: pointer;
            border: 1px solid var(--auto-border-color, #e9e9e9);
        }
        .swatch.active {
            outline: 2px solid var(--auto-theme-color, #1677ff);
            outline-offset: 2px;
        }
        .color-row {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-top: 0.5rem;
        }
        input[type="color"] {
            width: 2.2rem;
            height: 1.6rem;
            padding: 0;
            border: 1px solid var(--auto-border-color, #e9e9e9);
            border-radius: var(--auto-border-radius, 4px);
            background: none;
            cursor: pointer;
        }
        .switch-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0.3rem 0;
            cursor: pointer;
        }
        .switch {
            width: 2.4rem;
            height: 1.25rem;
            border-radius: 9999px;
            background: var(--auto-border-color, #d9d9d9);
            position: relative;
            transition: background 0.2s;
        }
        .switch::after {
            content: "";
            position: absolute;
            top: 0.125rem;
            left: 0.125rem;
            width: 1rem;
            height: 1rem;
            border-radius: 50%;
            background: #fff;
            transition: left 0.2s;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }
        .switch.on {
            background: var(--auto-theme-color, #1677ff);
        }
        .switch.on::after {
            left: 1.27rem;
        }
        .size-group {
            margin-bottom: 0.6rem;
        }
        .size-label {
            font-size: 0.75rem;
            color: var(--auto-third-color, #999);
            margin-bottom: 0.25rem;
        }
        .segments {
            display: flex;
            gap: 0.25rem;
        }
        .segment {
            flex: 1;
            text-align: center;
            padding: 0.25rem 0;
            font-size: 0.68rem;
            cursor: pointer;
            border: 1px solid var(--auto-border-color, #e9e9e9);
            border-radius: var(--auto-border-radius, 4px);
            color: var(--auto-secondary-color, #666);
            user-select: none;
        }
        .segment:hover {
            color: var(--auto-hover-color);
            background: var(--auto-hover-bgcolor);
        }
        .segment.active {
            color: var(--auto-selected-color);
            background: var(--auto-selected-bgcolor);
            border-color: var(--auto-selected-border-color, var(--auto-theme-color));
        }
    `;

    /** 切换主题色：预设名或任意色值 */
    private _setThemeColor(value: string) {
        this.currentColor = value;
        themeManager.themeColor = value;
    }

    private _setSize(attr: SizeAttr, value: string) {
        this.sizeValues = { ...this.sizeValues, [attr]: value };
        (themeManager as any)[attr] = value;
        this.requestUpdate();
    }

    protected render() {
        return html`
            <h3>主题控制</h3>

            <div class="group">
                <div class="group-title">主题色</div>
                <div class="swatches">
                    ${repeat(
                        Object.entries(presetThemes),
                        ([name, theme]) => html`<span
                            class="swatch ${this.currentColor === name || this.currentColor === theme.color ? "active" : ""}"
                            title="${theme.title} (${name})"
                            style="background-color:${theme.color};"
                            @click=${() => this._setThemeColor(name)}
                        ></span>`,
                    )}
                </div>
                <div class="color-row">
                    <input
                        type="color"
                        title="自定义主题色"
                        @input=${(e: Event) => this._setThemeColor((e.target as HTMLInputElement).value)}
                    />
                    <span>自定义颜色</span>
                </div>
            </div>

            <div class="group">
                <div class="group-title">模式</div>
                <div class="switch-row" @click=${() => (this.dark = themeManager.dark = !this.dark)}>
                    <span>暗色模式</span>
                    <span class="switch ${this.dark ? "on" : ""}"></span>
                </div>
                <div
                    class="switch-row"
                    @click=${() => (this.colorized = themeManager.colorized = !this.colorized)}
                >
                    <span>多彩模式</span>
                    <span class="switch ${this.colorized ? "on" : ""}"></span>
                </div>
            </div>

            <div class="group">
                <div class="group-title">尺寸参数（ThemeSize）</div>
                ${SIZE_ATTRS.map(
                    ({ attr, label }) => html`
                        <div class="size-group">
                            <div class="size-label">${label}（${attr}）</div>
                            <div class="segments">
                                ${SIZES.map(
                                    (size) => html`<span
                                        class="segment ${this.sizeValues[attr] === size ? "active" : ""}"
                                        @click=${() => this._setSize(attr, size)}
                                        >${size}</span
                                    >`,
                                )}
                            </div>
                        </div>
                    `,
                )}
            </div>
        `;
    }
}

customElements.define("theme-controls", ThemeControls);
