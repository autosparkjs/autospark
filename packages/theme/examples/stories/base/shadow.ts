import { html } from "lit";
import { repeat } from "lit/directives/repeat.js";
import type { StoryModule } from "../story";

/** 阴影档位清单 */
const SHADOWS = ["none", "x-small", "small", "medium", "large", "x-large"];

/** 阴影：转译自 src/stories/base/shadow.story.ts（主题控制交由右侧面板） */
export default {
    title: "阴影",
    render: () => html`
        <div class="auto-card story-intro">
            <div class="story-intro-title">特性说明：阴影（Shadow）</div>
            <p>
                阴影梯度为浮层、卡片等提供层次感。基础变量 <code>--k-shadow-*</code> 提供六级强度
                （<code>none</code> 至 <code>x-large</code>），别名 <code>--auto-shadow</code> 指向当前选中档位，
                卡片 / 按钮 / 提示组件默认消费该别名。
            </p>
            <ul>
                <li>五档可调：<code>x-small / small / medium / large / x-large</code>（<code>medium</code> 为默认态）</li>
                <li><code>none</code> 用于无阴影的扁平场景</li>
                <li>局部换档：任意容器加 <code>data-shadow="档位"</code> 属性即可让内部元素局部生效</li>
            </ul>
            <pre>ThemePro.shadow = 'small'  // 等价 document.documentElement.dataset.shadow = 'small'</pre>
        </div>
        <div class="auto-card">
            <div class="auto-card-header">阴影档位对比（同尺寸元素，仅阴影不同）</div>
            <div class="auto-card-body col">
                <div style="display:flex;gap:1rem;flex-wrap:wrap;align-items:flex-start;padding:1rem 0.5rem;">
                    ${repeat(
                        SHADOWS,
                        (level) => html`
                            <div style="display:flex;flex-direction:column;align-items:center;gap:0.4rem;">
                                <div
                                    style="width:4.5rem;height:2.8rem;background:var(--auto-bgcolor);border-radius:var(--auto-border-radius);box-shadow:var(--k-shadow-${level});display:flex;align-items:center;justify-content:center;font-size:0.72rem;"
                                >
                                    ${level}
                                </div>
                                <code style="font-size:0.68rem;color:var(--auto-third-color);">--k-shadow-${level}</code>
                            </div>
                        `,
                    )}
                </div>
            </div>
        </div>
        <div class="auto-card">
            <div class="auto-card-header">不同尺寸元素 × 同档阴影（medium）</div>
            <div class="auto-card-body col">
                <div class="auto-card-body-item" style="gap:1.5rem;align-items:flex-end;flex-wrap:wrap;padding:1rem 0.5rem;">
                    <span
                        style="display:inline-flex;align-items:center;justify-content:center;width:2.5rem;height:2.5rem;border-radius:var(--auto-border-radius);background:var(--auto-bgcolor);box-shadow:var(--k-shadow-medium);font-size:0.7rem;"
                        >小</span
                    >
                    <span
                        style="display:inline-flex;align-items:center;justify-content:center;width:5rem;height:4rem;border-radius:var(--auto-border-radius);background:var(--auto-bgcolor);box-shadow:var(--k-shadow-medium);font-size:0.75rem;"
                        >中</span
                    >
                    <span
                        style="display:inline-flex;align-items:center;justify-content:center;width:9rem;height:5.5rem;border-radius:var(--auto-border-radius);background:var(--auto-bgcolor);box-shadow:var(--k-shadow-medium);font-size:0.8rem;"
                        >大</span
                    >
                </div>
                <p style="margin:0;color:var(--auto-third-color);font-size:0.8rem;">
                    同一档阴影在不同尺寸元素上层次感不同：小元素阴影相对更显「浮起」，大元素更显沉稳——
                    小控件可选 <code>x-small/small</code>，大面积浮层（弹窗/抽屉）可选 <code>large/x-large</code>。
                </p>
            </div>
        </div>
        <div class="auto-card">
            <div class="auto-card-header">自动阴影：局部固定 vs 跟随全局（在右侧面板切换「阴影」观察）</div>
            <div class="auto-card-body col">
                <div style="display:flex;gap:1rem;flex-wrap:wrap;">
                    ${["x-small", "none", "large"].map(
                        (level) => {
                            // "none" 表示不加 data-shadow 属性：容器不覆盖变量，内部元素继承 :root 的全局档位
                            const isGlobal = level === "none";
                            return html`
                                <div
                                    data-shadow="${isGlobal ? undefined : level}"
                                    style="flex:1;min-width:11rem;display:flex;flex-direction:column;gap:0.7rem;padding:0.9rem;border:1px dashed ${isGlobal ? "var(--auto-theme-color)" : "var(--auto-border-color)"};border-radius:var(--auto-border-radius);"
                                >
                                    <div style="font-size:0.75rem;color:${isGlobal ? "var(--auto-theme-color)" : "var(--auto-third-color)"};">
                                        ${isGlobal ? "无属性（跟随全局档位联动）" : `data-shadow="${level}"（局部固定）`}
                                    </div>
                                    <div class="auto-btn small">按钮（--auto-shadow）</div>
                                    <div
                                        style="padding:0.6rem;background:var(--auto-bgcolor);border-radius:var(--auto-border-radius);box-shadow:var(--auto-shadow);"
                                    >
                                        色块卡片（--auto-shadow）
                                    </div>
                                </div>
                            `;
                        },
                    )}
                </div>
                <p style="margin:0;color:var(--auto-third-color);font-size:0.8rem;">
                    切换全局阴影档位：只有「跟随全局」列（主题色虚线框）变化，左右两列纹丝不动——
                    CSS 自定义属性按继承链就近取值，<code>[data-shadow=x]</code> 在容器层覆盖了
                    <code>--auto-shadow</code>，全局（:root）的档位变化透不进容器内部；
                    局部固定的用途正是让某块区域（如侧边栏）不随全局换肤漂移。
                </p>
            </div>
        </div>
    `,
} satisfies StoryModule;
