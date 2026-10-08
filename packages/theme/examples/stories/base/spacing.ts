import { html } from "lit";
import { repeat } from "lit/directives/repeat.js";
import type { StoryModule } from "../story";

/** 间距档位清单 */
const SPACINGS = ["none", "x-small", "small", "medium", "large", "x-large"];

/**
 * 间距：补建故事（原 src/stories/base/spacing.ts 是 font 的坏复制且未被登记，本文件为真正内容）。
 * 演示 --x-spacing-* 梯度与 --auto-spacing / --auto-padding / --auto-margin 别名。
 */
export default {
    title: "间距",
    render: () => html`
        <div class="auto-card story-intro">
            <div class="story-intro-title">特性说明：间距（Spacing）—— 界面的稀疏度</div>
            <p>
                间距梯度调节的是界面的<strong>整体稀疏度</strong>：同一屏幕内内容与留白的比例，即信息密度。
                调高一档，卡片留白、元素内边距、布局间隙同步放宽，页面更「透气」；调低一档则更紧凑、
                单屏可容纳更多信息。基础变量 <code>--x-spacing-{size}</code> 提供六档绝对值
                （<code>none</code> 至 <code>x-large</code>），
                别名 <code>--auto-spacing</code> / <code>--auto-padding</code> / <code>--auto-margin</code>
                统一指向当前选中档位，组件样式均消费别名——改一档，全站稀疏度联动。
            </p>
            <ul>
                <li>稀疏度联动面：卡片留白（<code>--auto-spacing</code>）、元素内边距（<code>--auto-padding</code>）、布局间隙（<code>--auto-margin</code>）</li>
                <li>选档建议：数据密集型界面（表格、仪表盘）选 <code>x-small / small</code> 提高信息密度；展示型 / 阅读型页面选 <code>large / x-large</code> 更透气；<code>none</code> 为零间距（留白完全消除），适合表格单元格等需要自行控制留白的紧凑场景</li>
                <li>与「尺寸」档的分工：<code>size</code> 调字号与行高、<code>spacing</code> 调留白，两者组合决定最终密度——只调 spacing 时字号不变</li>
                <li>六档取值：<code>none / x-small / small / medium / large / x-large</code>（<code>medium</code> 为默认态）</li>
                <li>局部换档：任意容器加 <code>data-spacing="档位"</code> 属性即可让内部元素局部生效、与全局隔离</li>
            </ul>
            <pre>ThemePro.spacing = 'large'  // 等价 document.documentElement.dataset.spacing = 'large'</pre>
        </div>

        <div class="auto-card">
            <div class="auto-card-header">间距档位对比（同尺寸外框，仅内边距不同）</div>
            <div class="auto-card-body col">
                <div style="display:flex;gap:1rem;flex-wrap:wrap;align-items:flex-start;">
                    ${repeat(
                        SPACINGS,
                        (level) => html`
                            <div style="display:flex;flex-direction:column;align-items:center;gap:0.4rem;">
                                <div
                                    style="border:1px dashed var(--auto-border-color);border-radius:var(--auto-border-radius);display:inline-flex;"
                                >
                                    <span
                                        style="padding:var(--x-spacing-${level});background:var(--auto-selected-bgcolor);border-radius:calc(var(--auto-border-radius) * 0.6);"
                                    >
                                        文本
                                    </span>
                                </div>
                                <code style="font-size:0.68rem;color:var(--auto-third-color);">--x-spacing-${level}</code>
                            </div>
                        `,
                    )}
                </div>
                <p style="margin:0;color:var(--auto-third-color);font-size:0.8rem;">
                    外框（虚线）尺寸一致，色块内边距取各档值——色块越大间距越宽松。
                </p>
            </div>
        </div>

        <div class="auto-card">
            <div class="auto-card-header">三别名对照：--auto-padding / --auto-margin / --auto-spacing</div>
            <div class="auto-card-body col">
                <!-- --auto-padding：元素内边距，内容与自身边界的距离 -->
                <div class="auto-card-body-item" style="flex-direction:column;align-items:flex-start;gap:0.4rem;">
                    <code style="font-size:0.72rem;color:var(--auto-third-color);">--auto-padding（内边距：内容与自身边界的距离）</code>
                    <div style="border:1px dashed var(--auto-border-color);border-radius:var(--auto-border-radius);display:inline-flex;">
                        <span
                            style="padding:var(--auto-padding);background:var(--auto-selected-bgcolor);border:1px solid var(--auto-selected-border-color);border-radius:calc(var(--auto-border-radius) * 0.6);"
                        >
                            色块文本（padding 撑开的间隙即 --auto-padding）
                        </span>
                    </div>
                </div>
                <!-- --auto-margin：元素外边距，与相邻元素/容器边缘的距离 -->
                <div class="auto-card-body-item" style="flex-direction:column;align-items:flex-start;gap:0.4rem;">
                    <code style="font-size:0.72rem;color:var(--auto-third-color);">--auto-margin（外边距：与相邻元素的距离）</code>
                    <div style="border:1px dashed var(--auto-border-color);border-radius:var(--auto-border-radius);width:100%;box-sizing:border-box;">
                        <div style="display:flex;align-items:center;">
                            <span
                                style="margin:var(--auto-margin);background:var(--auto-secondary-bgcolor);border-radius:calc(var(--auto-border-radius) * 0.6);padding:0.3em 0.8em;"
                                >色块 A</span
                            >
                            <span
                                style="margin:var(--auto-margin);background:var(--auto-secondary-bgcolor);border-radius:calc(var(--auto-border-radius) * 0.6);padding:0.3em 0.8em;"
                                >色块 B</span
                            >
                        </div>
                    </div>
                    <span style="font-size:0.72rem;color:var(--auto-third-color);"
                        >色块与虚线框边缘、色块与色块之间的空隙即 --auto-margin</span
                    >
                </div>
                <!-- --auto-spacing：通用间距，适合 flex gap 等场景 -->
                <div class="auto-card-body-item" style="flex-direction:column;align-items:flex-start;gap:0.4rem;">
                    <code style="font-size:0.72rem;color:var(--auto-third-color);">--auto-spacing（通用间距：flex gap / 尺寸参照）</code>
                    <div style="display:flex;gap:var(--auto-spacing);">
                        <span
                            style="width:calc(3 * var(--auto-spacing));height:calc(3 * var(--auto-spacing));display:inline-flex;align-items:center;justify-content:center;background:var(--auto-hover-bgcolor);border-radius:calc(var(--auto-border-radius) * 0.6);font-size:0.7rem;"
                            >3x</span
                        >
                        <span
                            style="width:calc(3 * var(--auto-spacing));height:calc(3 * var(--auto-spacing));display:inline-flex;align-items:center;justify-content:center;background:var(--auto-hover-bgcolor);border-radius:calc(var(--auto-border-radius) * 0.6);font-size:0.7rem;"
                            >3x</span
                        >
                        <span
                            style="width:calc(3 * var(--auto-spacing));height:calc(3 * var(--auto-spacing));display:inline-flex;align-items:center;justify-content:center;background:var(--auto-hover-bgcolor);border-radius:calc(var(--auto-border-radius) * 0.6);font-size:0.7rem;"
                            >3x</span
                        >
                    </div>
                    <span style="font-size:0.72rem;color:var(--auto-third-color);"
                        >元素间空隙为 <code>gap: var(--auto-spacing)</code>，元素尺寸为 <code>calc(3 * var(--auto-spacing))</code></span
                    >
                </div>
                <p style="margin:0;color:var(--auto-third-color);font-size:0.8rem;">
                    三别名同源同值（均指向当前间距档），按用途选名可让样式语义更清晰；
                    在右侧面板切换「间距」档位，本卡三组示例同步联动。
                </p>
            </div>
        </div>
        <div class="auto-card">
            <div class="auto-card-header">局部固定 vs 跟随全局（在右侧面板切换「间距」观察）</div>
            <div class="auto-card-body col">
                <div style="display:flex;gap:1rem;flex-wrap:wrap;">
                    ${["x-small", "global", "large"].map((level) => {
                        const isGlobal = level === "global";
                        return html`
                            <div
                                data-spacing="${isGlobal ? undefined : level}"
                                style="flex:1;min-width:11rem;display:flex;flex-direction:column;gap:0.5rem;padding:0.9rem;border:1px dashed ${isGlobal ? "var(--auto-theme-color)" : "var(--auto-border-color)"};border-radius:var(--auto-border-radius);"
                            >
                                <div style="font-size:0.75rem;color:${isGlobal ? "var(--auto-theme-color)" : "var(--auto-third-color)"};">
                                    ${isGlobal ? "无属性（跟随全局档位联动）" : `data-spacing="${level}"（局部固定）`}
                                </div>
                                <div
                                    style="padding:var(--auto-padding);background:var(--auto-bgcolor);border:var(--auto-border);border-radius:var(--auto-border-radius);"
                                >
                                    色块卡片（--auto-padding）
                                </div>
                                <div class="auto-alert">提示组件留白（--auto-spacing）</div>
                            </div>
                        `;
                    })}
                </div>
                <p style="margin:0;color:var(--auto-third-color);font-size:0.8rem;">
                    三列即三种稀疏度并排：左（紧凑）→ 右（宽松），色块留白与提示组件高度逐列放大。
                    切换全局间距档位：只有「跟随全局」列（主题色虚线框）变化，左右两列纹丝不动——
                    <code>[data-spacing=x]</code> 在容器层覆盖了间距别名，全局（:root）的档位变化透不进容器内部。
                </p>
            </div>
        </div>

        <div class="auto-card">
            <div class="auto-card-header">组件联动：按钮内边距随档位联动</div>
            <div class="auto-card-body col" style="gap:var(--auto-spacing);">
                <div>
                    <div class="auto-btn small">小按钮（内边距随 --x-spacing-small）</div>
                    <div class="auto-btn medium">中按钮（内边距随 --x-spacing-medium）</div>
                    <div class="auto-btn large">大按钮（内边距随 --x-spacing-large）</div>
                </div>
                <p style="margin:0;color:var(--auto-third-color);font-size:0.8rem;">
                    按钮的尺寸类同时决定字号与内边距（<code>.auto-btn.large { padding: calc(0.5*var(--x-spacing-large)) }</code>）；
                    在右侧面板切换「间距」档位不会影响这三个按钮（它们消费的是各尺寸类的固定档），
                    只有未指定尺寸类、消费 <code>--auto-*</code> 别名的元素才随档位联动。
                </p>
            </div>
        </div>
    `,
} satisfies StoryModule;
