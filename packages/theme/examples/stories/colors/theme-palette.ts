import { html } from "lit";
import { repeat } from "lit/directives/repeat.js";
import type { StoryModule } from "../story";

/** 主题调色板：转译自 src/stories/colors/theme.story.ts（主题控制交由右侧面板） */
export default {
    title: "主题调色板",
    render: () => html`
        <div class="auto-card story-intro">
            <div class="story-intro-title">特性说明：主题调色板（Theme Color Palette）</div>
            <p>
                主题系统从单个主题色（<code>themeColor</code>）算法生成 10 阶梯度
                <code>--k-color-theme-0..9</code>（0 浅 → 9 深），无需为每阶手工配色。
                暗色模式下梯度自动反转（浅深互换），保证两种模式的可读性。
            </p>
            <ul>
                <li>主题色来源：13 个预设（<code>presetThemes</code>，如 <code>blue</code>、<code>red</code>）或任意 CSS 色值</li>
                <li>常用取值：<code>theme-5</code> 为中值（即 <code>--auto-theme-color</code>），浅背景用 <code>0-2</code>，强调用 <code>7-9</code></li>
                <li>切换后写入 <code>:root</code> 的 <code>data-theme</code> 属性并重注入梯度样式</li>
            </ul>
            <pre>ThemePro.themeColor = 'red'        // 预设名
ThemePro.themeColor = '#7c3aed'   // 任意色值</pre>
        </div>
        <div class="auto-card">
            <div class="auto-card-header">主题梯度颜色</div>
            <div class="auto-card-body">
                <div style="padding:1em;display:flex;gap:0.5rem;align-items:center;">
                    ${repeat(
                        Array.from({ length: 10 }),
                        (_, i) => html`<span
                            style="text-align:center;flex:1;height:2em;background-color:var(--k-color-theme-${i});"
                            >${i}</span
                        >`,
                    )}
                </div>
            </div>
        </div>
        <div class="auto-card">
            <div class="auto-card-header">主题色</div>
            <div class="auto-card-body col">
                <div class="auto-card-body-item" style="color:var(--k-color-theme-0)">--k-color-theme-0</div>
                ${repeat(
                    Array.from({ length: 10 }),
                    (_, i) => html`
                        <div class="auto-card-body-item" style="background-color:var(--k-color-theme-${i})">
                            --k-color-theme-${i}
                        </div>
                    `,
                )}
            </div>
        </div>
    `,
} satisfies StoryModule;
