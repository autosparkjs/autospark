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
        <code>--x-color-theme-0..9</code>（0 浅 → 9 深），无需为每阶手工配色。
        暗色模式下梯度自动反转（浅深互换），保证两种模式的可读性。
      </p>
      <ul>
        <li>
          主题色来源：13 个预设（<code>presetThemes</code>，如
          <code>blue</code>、<code>red</code>）或任意 CSS 色值
        </li>
        <li>
          常用取值：主色档位 light 取 <code>theme-8</code>、dark 取 <code>theme-5</code>
          （即 <code>--auto-theme-color</code>），浅背景用 <code>0-2</code>，强调用
          <code>7-9</code>
        </li>
        <li>切换后写入 <code>:root</code> 的 <code>data-theme</code> 属性并重注入梯度样式</li>
        <li>
          双轨灰阶（ADR-0008）：亮灰阶 <code>--x-color-gray-0..9</code>（0 白 → 9
          深，重锚 VSCode Light Modern）与暗灰阶 <code>--x-color-dgray-0..9</code>（0 白 →
          9 深，档位锚自 VSCode Dark Modern 面板族）均为静态固定梯度，不随主题色派生；
          dark 的语义灰（<code>--x-plain-color-*</code> /
          <code>--x-plain-bgcolor-*</code>）引用 <code>dgray</code> 标尺（非 gray 反转）
        </li>
      </ul>
      <pre>
AutoSparkThemeManager.themeColor = 'red'        // 预设名
AutoSparkThemeManager.themeColor = '#7c3aed'   // 任意色值</pre>
    </div>
    <div class="auto-card">
      <div class="auto-card-header">主题梯度颜色</div>
      <div class="auto-card-body">
        <div style="padding:1em;display:flex;gap:0.5rem;align-items:center;">
          ${repeat(
            Array.from({ length: 10 }),
            (_, i) => html`<span
              style="text-align:center;flex:1;height:2em;background-color:var(--x-color-theme-${i});"
              >${i}</span
            >`,
          )}
        </div>
      </div>
    </div>
    <div class="auto-card">
      <div class="auto-card-header">主题色</div>
      <div class="auto-card-body col">
        <div class="auto-card-body-item" style="color:var(--x-color-theme-0)">
          --x-color-theme-0
        </div>
        ${repeat(
          Array.from({ length: 10 }),
          (_, i) => html`
            <div class="auto-card-body-item" style="background-color:var(--x-color-theme-${i})">
              <span style="color:var(--x-color-${i > 3 ? 9 : 0})">--x-color-theme-${i}</span>
            </div>
          `,
        )}
      </div>
    </div>
    <div class="auto-card">
      <div class="auto-card-header">亮灰阶颜色（gray，light 用）</div>
      <div class="auto-card-body col">
        <div class="auto-card-body-item" style="color:var(--x-color-gray-9)">--x-color-gray-9</div>
        ${repeat(
          Array.from({ length: 10 }),
          (_, i) => html`
            <div class="auto-card-body-item" style="background-color:var(--x-color-gray-${i})">
              <span style="color:var(--x-color-gray-${i > 5 ? 0 : 9})">--x-color-gray-${i}</span>
            </div>
          `,
        )}
      </div>
    </div>
    <div class="auto-card">
      <div class="auto-card-header">暗灰阶颜色（dgray，dark 专属标尺）</div>
      <div class="auto-card-body col">
        <div class="auto-card-body-item" style="color:var(--x-color-dgray-1)">--x-color-dgray-1（dark 正文 #CCCCCC）</div>
        ${repeat(
          Array.from({ length: 10 }),
          (_, i) => html`
            <div class="auto-card-body-item" style="background-color:var(--x-color-dgray-${i})">
              <span style="color:var(--x-color-dgray-${i > 3 ? 0 : 9})">--x-color-dgray-${i}</span>
            </div>
          `,
        )}
        <div class="auto-card-body-item" style="background-color:var(--x-bgcolor-0)">
          dark 面板 = bgcolor-0 = dgray-8 #1F1F1F ／ 工作区 = bgcolor-1 = dgray-9 #181818
        </div>
      </div>
    </div>
  `,
} satisfies StoryModule;
