import { html } from "lit";
import type { StoryModule } from "../story";

/** 段落：转译自 src/stories/base/paragraph.story.ts（主题控制交由右侧面板） */
export default {
    title: "段落",
    render: () => html`
        <div class="auto-card story-intro">
            <div class="story-intro-title">特性说明：段落（Paragraph）</div>
            <p>
                段落排版由行高与字间距两个梯度控制，服务于大段文本的阅读密度。
                基础变量 <code>--k-line-height-*</code> / <code>--k-letter-spacing-*</code> 提供五档绝对值，
                别名 <code>--auto-line-height</code> / <code>--auto-letter-spacing</code> 随全局尺寸档位联动，
                并被 <code>--auto-font</code> 速写一并聚合。
            </p>
            <ul>
                <li>行高：文本行间的垂直间距，值越大阅读越松弛</li>
                <li>字间距：字符间的水平距离，中文排版通常保持默认</li>
                <li>自动段落 vs 固定段落：消费 <code>--auto-*</code> 别名的段落随档位联动，写死 <code>--k-*</code> 基础值的段落不联动（见下方对比卡）</li>
            </ul>
            <pre>p { font: var(--auto-font); line-height: var(--auto-line-height); }</pre>
        </div>
        <div class="auto-card">
            <div class="auto-card-header">行高</div>
            <div class="auto-card-body col">
                ${["x-small", "small", "medium", "large", "x-large"].map(
                    (size) => html`
                        <div class="auto-card-body-item" style="line-height:var(--k-line-height-${size})">
                            道可道，非常道；名可名，非常名。无名天地之始，有名万物之母。故常无欲，以观其妙；常有欲，以观其徼（jiào）。此两者同出而异名，同谓之玄，玄之又玄，众妙之门。--k-line-height-${size}
                        </div>
                    `,
                )}
            </div>
        </div>
        <div class="auto-card">
            <div class="auto-card-header">字间距</div>
            <div class="auto-card-body col">
                ${["x-small", "small", "medium", "large", "x-large"].map(
                    (size) => html`
                        <div class="auto-card-body-item" style="letter-spacing:var(--k-letter-spacing-${size})">
                            道可道，非常道；名可名，非常名。无名天地之始，有名万物之母。故常无欲，以观其妙；常有欲，以观其徼（jiào）。此两者同出而异名，同谓之玄，玄之又玄，众妙之门。--k-letter-spacing-${size}
                        </div>
                    `,
                )}
            </div>
        </div>
        <div class="auto-card">
            <div class="auto-card-header">不同档位的自动段落对比（data-size 局部作用域）</div>
            <div class="auto-card-body col">
                <p style="margin:0;color:var(--auto-third-color);font-size:0.8rem;">
                    三段文字内容相同、样式完全一致（全部消费 <code>--auto-*</code> 别名），仅容器档位不同——
                    段落形态随档位整体联动：
                </p>
                <div style="display:flex;gap:1rem;flex-wrap:wrap;">
                    ${["x-small", "medium", "large"].map(
                        (size) => html`
                            <div
                                data-size="${size}"
                                style="flex:1;min-width:13rem;padding:0.8rem;border:1px dashed var(--auto-border-color);border-radius:var(--auto-border-radius);"
                            >
                                <div style="font-size:0.7rem;color:var(--auto-third-color);margin-bottom:0.4rem;">
                                    data-size="${size}"
                                </div>
                                <div style="font:var(--auto-font);line-height:var(--auto-line-height);letter-spacing:var(--auto-letter-spacing);">
                                    道可道，非常道；名可名，非常名。无名天地之始，有名万物之母。故常无欲，以观其妙；常有欲，以观其徼（jiào）。此两者同出而异名，同谓之玄，玄之又玄，众妙之门。
                                </div>
                            </div>
                        `,
                    )}
                </div>
            </div>
        </div>
        <div class="auto-card">
            <div class="auto-card-header">自动段落 vs 固定段落（在右侧面板切换「尺寸」观察差异）</div>
            <div class="auto-card-body col">
                <div style="display:flex;gap:1rem;flex-wrap:wrap;">
                    <div style="flex:1;min-width:13rem;padding:0.8rem;border:1px dashed var(--auto-theme-color);border-radius:var(--auto-border-radius);">
                        <div style="font-size:0.7rem;color:var(--auto-theme-color);margin-bottom:0.4rem;">
                            自动段落（--auto-*，随全局档位联动）
                        </div>
                        <div style="font:var(--auto-font);line-height:var(--auto-line-height);letter-spacing:var(--auto-letter-spacing);">
                            道可道，非常道；名可名，非常名。无名天地之始，有名万物之母。故常无欲，以观其妙；常有欲，以观其徼（jiào）。此两者同出而异名，同谓之玄，玄之又玄，众妙之门。
                        </div>
                    </div>
                    <div style="flex:1;min-width:13rem;padding:0.8rem;border:1px dashed var(--auto-border-color);border-radius:var(--auto-border-radius);">
                        <div style="font-size:0.7rem;color:var(--auto-third-color);margin-bottom:0.4rem;">
                            固定段落（--k-* medium 写死，不随档位变化）
                        </div>
                        <div
                            style="font-weight:var(--k-font-weight-medium);font-size:var(--k-font-size-medium);line-height:var(--k-line-height-medium);letter-spacing:var(--k-letter-spacing-medium);"
                        >
                            道可道，非常道；名可名，非常名。无名天地之始，有名万物之母。故常无欲，以观其妙；常有欲，以观其徼（jiào）。此两者同出而异名，同谓之玄，玄之又玄，众妙之门。
                        </div>
                    </div>
                </div>
                <p style="margin:0;color:var(--auto-third-color);font-size:0.8rem;">
                    两段初始观感相同（全局默认 medium）；切换右面板「尺寸」到 <code>x-small</code> 或
                    <code>x-large</code>：自动段落整体缩放，固定段落保持不变——这正是消费别名与写死基础值的本质区别。
                </p>
            </div>
        </div>
    `,
} satisfies StoryModule;
