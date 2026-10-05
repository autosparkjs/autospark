import { html } from "lit";
import { repeat } from "lit/directives/repeat.js";
import type { StoryModule } from "../story";

/** 圆角档位清单：label 为显示名，radius 为对应变量 */
const RADII = [
    { label: "none", radius: "var(--k-border-radius-none)" },
    { label: "x-small", radius: "var(--k-border-radius-x-small)" },
    { label: "small", radius: "var(--k-border-radius-small)" },
    { label: "medium", radius: "var(--k-border-radius-medium)" },
    { label: "large", radius: "var(--k-border-radius-large)" },
    { label: "x-large", radius: "var(--k-border-radius-x-large)" },
    { label: "pill", radius: "var(--k-border-radius-pill)" },
    { label: "circle", radius: "var(--k-border-radius-circle)" },
];

/** 圆角：转译自 src/stories/base/radius.story.ts（主题控制交由右侧面板） */
export default {
    title: "圆角",
    render: () => html`
        <div class="auto-card story-intro">
            <div class="story-intro-title">特性说明：圆角（Border Radius）</div>
            <p>
                圆角梯度为面板、按钮等组件提供统一的圆角语言。基础变量 <code>--k-border-radius-*</code>
                提供绝对值，别名 <code>--auto-border-radius</code> 指向当前选中档位，组件样式统一消费别名。
            </p>
            <ul>
                <li>五档可调：<code>x-small / small / medium / large / x-large</code>（<code>medium</code> 为默认态）</li>
                <li>特殊值：<code>none</code>（直角）、<code>pill</code>（胶囊 9999px）、<code>circle</code>（正圆 50%，需搭配正方形容器）</li>
                <li>局部换档：任意容器加 <code>data-radius="档位"</code> 属性即可让内部元素局部生效，无需改全局</li>
            </ul>
            <pre>ThemePro.radius = 'large'  // 等价 document.documentElement.dataset.radius = 'large'</pre>
        </div>
        <div class="auto-card">
            <div class="auto-card-header">圆角档位对比（同尺寸元素，仅圆角不同）</div>
            <div class="auto-card-body col">
                <div style="display:flex;gap:0.9rem;flex-wrap:wrap;align-items:flex-start;">
                    ${repeat(
                        RADII,
                        ({ label, radius }, i) => html`
                            <div style="display:flex;flex-direction:column;align-items:center;gap:0.35rem;">
                                <div
                                    style="width:4.2rem;height:2.8rem;border-radius:${radius};background:var(--k-color-theme-${i + 1});border:var(--auto-border);display:flex;align-items:center;justify-content:center;font-size:0.72rem;"
                                >
                                    ${label}
                                </div>
                                <code style="font-size:0.68rem;color:var(--auto-third-color);">--k-border-radius-${label}</code>
                            </div>
                        `,
                    )}
                </div>
                <p style="margin:0;color:var(--auto-third-color);font-size:0.8rem;">
                    八种取值同尺寸横排对比：<code>none</code> 直角 → <code>x-large</code> 大圆角连续过渡，
                    <code>pill</code>（9999px）在矩形上呈完整胶囊，<code>circle</code>（50%）在矩形上呈椭圆——
                    需正方形才是正圆（见下方形状特写）。
                </p>
            </div>
        </div>
        <div class="auto-card">
            <div class="auto-card-header">形状特写：pill 与 circle 的实际用途</div>
            <div class="auto-card-body col">
                <div class="auto-card-body-item" style="gap:1rem;flex-wrap:wrap;">
                    <span
                        style="display:inline-flex;align-items:center;justify-content:center;width:3rem;height:3rem;border-radius:var(--k-border-radius-circle);background:var(--auto-theme-color);color:white;font-size:0.8rem;"
                        >头像</span
                    >
                    <span
                        style="display:inline-flex;align-items:center;padding:0.3em 1em;border-radius:var(--k-border-radius-pill);background:var(--auto-selected-bgcolor);color:var(--auto-selected-color);border:1px solid var(--auto-selected-border-color);"
                        >胶囊标签 pill</span
                    >
                    <span
                        style="display:inline-flex;align-items:center;padding:0.3em 1em;border-radius:var(--k-border-radius-pill);background:var(--auto-secondary-bgcolor);color:var(--auto-secondary-color);"
                        >状态 · 运行中</span
                    >
                </div>
                <p style="margin:0;color:var(--auto-third-color);font-size:0.8rem;">
                    <code>circle</code> 需搭配正方形容器（头像/图标底座）；<code>pill</code> 天然适配标签与开关。
                </p>
            </div>
        </div>
        <div class="auto-card">
            <div class="auto-card-header">同一圆角在不同尺寸元素上的观感</div>
            <div class="auto-card-body col">
                <div class="auto-card-body-item" style="gap:1rem;align-items:flex-end;flex-wrap:wrap;">
                    <span
                        style="display:inline-flex;align-items:center;justify-content:center;width:2rem;height:2rem;border-radius:var(--k-border-radius-medium);background:var(--k-color-theme-1);font-size:0.7rem;"
                        >小</span
                    >
                    <span
                        style="display:inline-flex;align-items:center;justify-content:center;width:4rem;height:4rem;border-radius:var(--k-border-radius-medium);background:var(--k-color-theme-2);font-size:0.75rem;"
                        >中</span
                    >
                    <span
                        style="display:inline-flex;align-items:center;justify-content:center;width:7rem;height:5rem;border-radius:var(--k-border-radius-medium);background:var(--k-color-theme-3);font-size:0.8rem;"
                        >大</span
                    >
                </div>
                <p style="margin:0;color:var(--auto-third-color);font-size:0.8rem;">
                    圆角相同（<code>medium</code>）而尺寸不同：小元素视觉接近直角、大容器更显圆润——
                    小控件宜选 <code>x-small/small</code>，大面积容器宜选 <code>large/x-large</code>。
                </p>
            </div>
        </div>
        <div class="auto-card">
            <div class="auto-card-header">四角组合：仅顶部圆角（卡片头形态）</div>
            <div class="auto-card-body col">
                <div class="auto-card-body-item" style="flex-direction:column;align-items:stretch;gap:0;padding:0;border:var(--auto-border);background:transparent;">
                    <div
                        style="padding:0.6em 1em;background:var(--auto-card-header-bgcolor);border-radius:var(--k-border-radius-medium) var(--k-border-radius-medium) 0 0;border-bottom:var(--auto-border);"
                    >
                        顶部两角圆、底部两角直
                    </div>
                    <div style="padding:0.8em 1em;background:var(--auto-bgcolor);">
                        常用于「头部 + 主体」的连通卡片：<code>border-radius: var(--k-border-radius-medium) var(--k-border-radius-medium) 0 0</code>
                    </div>
                </div>
                <div class="auto-card-body-item" style="align-items:center;justify-content:center;height:3rem;border-radius:var(--k-border-radius-large) 0 var(--k-border-radius-large) 0;background:var(--auto-selected-bgcolor);border:1px solid var(--auto-selected-border-color);">
                    对角圆：large 0 large 0
                </div>
            </div>
        </div>
        <div class="auto-card">
            <div class="auto-card-header">局部圆角作用域：data-radius 属性（无需改全局）</div>
            <div class="auto-card-body col">
                <p style="margin:0;color:var(--auto-third-color);font-size:0.8rem;">
                    主题为每个档位生成了 <code>[data-radius=x]</code> 选择器，任意容器加属性即可让内部所有消费
                    <code>--auto-border-radius</code> 的元素局部换档：
                </p>
                <div style="display:flex;gap:1rem;flex-wrap:wrap;">
                    <div data-radius="x-small" style="flex:1;min-width:14rem;display:flex;flex-direction:column;gap:0.6rem;padding:0.8rem;border:1px dashed var(--auto-border-color);border-radius:var(--auto-border-radius);">
                        <div style="font-size:0.75rem;color:var(--auto-third-color);">data-radius="x-small"</div>
                        <div class="auto-btn small">按钮</div>
                        <div class="auto-input-wrapper"><input type="text" placeholder="输入框" /></div>
                        <div style="padding:0.5rem;background:var(--auto-secondary-bgcolor);border-radius:var(--auto-border-radius);">色块</div>
                    </div>
                    <div data-radius="large" style="flex:1;min-width:14rem;display:flex;flex-direction:column;gap:0.6rem;padding:0.8rem;border:1px dashed var(--auto-border-color);border-radius:var(--auto-border-radius);">
                        <div style="font-size:0.75rem;color:var(--auto-third-color);">data-radius="large"</div>
                        <div class="auto-btn small">按钮</div>
                        <div class="auto-input-wrapper"><input type="text" placeholder="输入框" /></div>
                        <div style="padding:0.5rem;background:var(--auto-secondary-bgcolor);border-radius:var(--auto-border-radius);">色块</div>
                    </div>
                </div>
            </div>
        </div>
        <div class="auto-card">
            <div class="auto-card-header">全局圆角大小: <code>var(--auto-border-radius)</code></div>
            <div class="auto-card-body col">
                <pre>使用 ThemePro.radius='x-small' 设置全局圆角大小</pre>
                <div class="list">
                    <div class="item" style="border-radius:var(--auto-border-radius)">--auto-border-radius</div>
                    <div class="item" style="border-radius:var(--auto-border-radius)">--auto-border-radius</div>
                    <div class="item" style="border-radius:var(--auto-border-radius)">--auto-border-radius</div>
                    <div class="item" style="border-radius:var(--auto-border-radius)">--auto-border-radius</div>
                    <div class="item" style="border-radius:var(--auto-border-radius)">--auto-border-radius</div>
                </div>
            </div>
        </div>
    `,
} satisfies StoryModule;
