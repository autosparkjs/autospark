import { html } from "lit";
import { themeManager } from "../../../src/index.ts";
import type { StoryModule } from "../story";

/** 语义颜色：转译自 src/stories/colors/semantics.story.ts（主题控制交由右侧面板） */
export default {
    title: "语义颜色",
    render: () => html`
        <div class="auto-card story-intro">
            <div class="story-intro-title">特性说明：语义颜色（Semantic Colors）</div>
            <p>
                语义色为「操作结果」提供固定语言：<code>primary</code>（品牌/主操作）、<code>success</code>（成功）、
                <code>warning</code>（警告）、<code>danger</code>（危险）、<code>info</code>（中性信息）。
                每个语义色有 <code>--k-color-*</code>（基础值）与 <code>--auto-*-color</code>（组件消费别名）两层。
            </p>
            <ul>
                <li>暗色模式下自动提亮：语义色作为梯度种子生成 <code>--k-color-{name}-0..9</code> 标尺，dark 引用第 3 档（ADR-0002）</li>
                <li>可通过 <code>update()</code> 自定义任意语义色（见下方演示卡片）</li>
            </ul>
            <pre>ThemePro.update({ primary: '#7c3aed', success: '#16a34a' })  // 运行时覆盖语义色</pre>
        </div>
        <div class="auto-card">
            <div class="auto-card-header">语义颜色</div>
            <div class="auto-card-body col">
                <pre><code>ThemePro</code> 支持 primary / success / danger / warning / info</pre>
                <div class="auto-card-body-item center" style="color:var(--k-color-gray-10);background-color:var(--auto-primary-color)">
                    --auto-primary-color: var(--k-color-primary)
                </div>
                <div class="auto-card-body-item center" style="color:var(--k-color-gray-10);background-color:var(--auto-secondary-color)">
                    --auto-secondary-color: var(--k-color-secondary)
                </div>
                <div class="auto-card-body-item center" style="color:var(--k-color-gray-10);background-color:var(--auto-success-color)">
                    --auto-success-color: var(--k-color-success)
                </div>
                <div class="auto-card-body-item center" style="color:var(--k-color-gray-10);background-color:var(--auto-danger-color)">
                    --auto-danger-color: var(--k-color-danger)
                </div>
                <div class="auto-card-body-item center" style="color:var(--k-color-gray-10);background-color:var(--auto-warning-color)">
                    --auto-warning-color: var(--k-color-warning)
                </div>
                <div class="auto-card-body-item center" style="color:var(--k-color-gray-10);background-color:var(--auto-info-color)">
                    --auto-info-color: var(--k-color-info)
                </div>
            </div>
        </div>
        <div class="auto-card">
            <div class="auto-card-header">自定义语义色：点击按钮经 ThemePro.update() 覆盖 primary</div>
            <div class="auto-card-body col">
                <div>
                    <button class="auto-btn primary" @click=${() => themeManager.update({ primary: "#7c3aed" })}>
                        覆盖 primary = #7c3aed
                    </button>
                    <button
                        class="auto-btn"
                        @click=${() => themeManager.update({ primary: "var(--auto-theme-color)" })}
                    >
                        恢复默认（跟随主题色）
                    </button>
                </div>
                <div class="auto-card-body-item center" style="color:var(--k-color-gray-10);background-color:var(--auto-primary-color)">
                    观察 --auto-primary-color 的变化（按钮 / 上方 primary 色块联动）
                </div>
            </div>
        </div>
        <div class="auto-card">
            <div class="auto-card-header">暗色模式下的语义色派生</div>
            <div class="auto-card-body col">
                <p style="margin:0;color:var(--auto-third-color);font-size:0.8rem;">
                    在右侧面板开启「暗色模式」：语义色自动切换到梯度第 3 档（提亮），无需为暗色单独配色。
                </p>
                <div class="auto-card-body-item center" style="color:var(--k-color-primary);border:var(--auto-border);">
                    color: var(--k-color-primary) — 暗/亮两模式对比
                </div>
            </div>
        </div>
    `,
} satisfies StoryModule;
