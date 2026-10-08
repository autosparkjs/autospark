import { html } from "lit";
import { repeat } from "lit/directives/repeat.js";
import type { StoryModule } from "../story";

/** 图标：转译自 src/stories/components/icon.story.ts（主题控制交由右侧面板） */
const ICONS = [
    "home", "info", "close", "settings", "star", "tag", "checked", "unchecked", "yes", "no",
    "important", "file", "folder", "folder-open", "triangle", "save", "loading", "alert", "bell", "arrow",
];

const SIZES = ["x-small", "small", "medium", "large", "x-large"];

export default {
    title: "图标 Icon",
    render: () => html`
        <div class="auto-card story-intro">
            <div class="story-intro-title">特性说明：图标（Icon）</div>
            <p>
                内置 20 个常用图标（纯 CSS mask 实现，无字体文件依赖），类名 <code>.auto-icon-{名称}</code>。
                图标默认与文字同尺寸：消费 <code>--auto-icon-size</code>，随全局尺寸档位联动；
                可用 <code>colorized</code> 属性切换为主题色、内联 <code>color</code> 指定任意颜色，
                尺寸类（<code>x-small</code>..<code>x-large</code>）覆盖为绝对档位。
            </p>
            <ul>
                <li>内置名称：<code>home / info / close / settings / star / tag / checked / unchecked / yes / no / important / file / folder / folder-open / triangle / save / loading / alert / bell / arrow</code></li>
                <li>尺寸变量：<code>--x-icon-size-{size}</code> 五档；默认继承 <code>font-size</code></li>
            </ul>
            <pre>&lt;span class="auto-icon home"&gt;&lt;/span&gt;
&lt;span class="auto-icon star" colorized&gt;&lt;/span&gt;
&lt;span class="auto-icon bell" large&gt;&lt;/span&gt;</pre>
        </div>
        <div class="auto-card">
            <div class="auto-card-header">内置图标 - 自动尺寸与字体大小相同</div>
            <div class="auto-card-body">
                <div>
                    ${repeat(ICONS, (icon) => html`<span class="auto-icon ${icon}"></span>`)}
                </div>
            </div>
        </div>
        <div class="auto-card" data-size="large">
            <div class="auto-card-header">主题颜色图标</div>
            <div class="auto-card-body col">
                <div>
                    ${repeat(ICONS, (icon) => html`<span class="auto-icon ${icon}" colorized></span>`)}
                </div>
            </div>
        </div>
        <div class="auto-card" data-size="large">
            <div class="auto-card-header">彩色图标</div>
            <div class="auto-card-body col">
                <div>
                    <span class="auto-icon home"></span>
                    <span class="auto-icon info" style="color:red;"></span>
                    <span class="auto-icon close" style="color:green"></span>
                    <span class="auto-icon settings" style="color:blue;"></span>
                    <span class="auto-icon star" style="color:yellow;"></span>
                    <span class="auto-icon tag" style="color:purple;"></span>
                    <span class="auto-icon checked" style="color:green;"></span>
                    <span class="auto-icon unchecked" style="color:red"></span>
                    <span class="auto-icon yes"></span>
                    <span class="auto-icon no"></span>
                    <span class="auto-icon important"></span>
                    <span class="auto-icon file"></span>
                    <span class="auto-icon folder"></span>
                    <span class="auto-icon folder-open"></span>
                    <span class="auto-icon triangle"></span>
                    <span class="auto-icon save"></span>
                    <span class="auto-icon loading"></span>
                    <span class="auto-icon alert"></span>
                    <span class="auto-icon bell"></span>
                    <span class="auto-icon arrow"></span>
                </div>
            </div>
        </div>
        <div class="auto-card">
            <div class="auto-card-header">指定大小，取值 x-small / small / medium / large / x-large</div>
            <div class="auto-card-body col">
                ${repeat(SIZES, (size) => html`
                    <div class="field">
                        <div class="label">${size}</div>
                        <div class="value">
                            ${repeat(ICONS.slice(0, 4), (icon) => html`<span class="auto-icon ${icon}" ${size}></span>`)}
                        </div>
                    </div>
                `)}
            </div>
        </div>
    `,
} satisfies StoryModule;
