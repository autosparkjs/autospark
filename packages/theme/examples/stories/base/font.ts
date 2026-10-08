import { html } from "lit";
import type { StoryModule } from "../story";

/** 字体：转译自 src/stories/base/font.story.ts（主题控制交由右侧面板） */
export default {
    title: "字体",
    render: () => html`
        <div class="auto-card story-intro">
            <div class="story-intro-title">特性说明：字体（Font）</div>
            <p>
                字体梯度提供字号与字重的五档标准值。基础变量 <code>--x-font-size-*</code> /
                <code>--x-font-weight-*</code> 提供绝对值；组合速写 <code>--auto-font</code>
                聚合了字重、字号、行高与字体族，一次消费即可获得与全局尺寸档位联动的完整排版。
            </p>
            <ul>
                <li>分解别名：<code>--auto-font-size</code> / <code>--auto-font-weight</code> / <code>--auto-font-family</code></li>
                <li>速写：<code>font: var(--auto-font)</code> 等价于 <code>var(--auto-font-weight) var(--auto-font-size)/1.5 var(--auto-font-family)</code></li>
                <li>标题排版：<code>font: var(--auto-title-font)</code></li>
            </ul>
            <pre>ThemePro.size = 'large'  // 字号/字重别名随全局尺寸档位联动</pre>
        </div>
        <div class="auto-card">
            <div class="auto-card-header">字体大小</div>
            <div class="auto-card-body col">
                <div class="auto-card-body-item" style="font-size:var(--x-font-size-x-small)">
                    道可道非常道，名可名非常名。--x-font-size-x-small
                </div>
                <div class="auto-card-body-item" style="font-size:var(--x-font-size-small)">
                    道可道非常道，名可名非常名。--x-font-size-small
                </div>
                <div class="auto-card-body-item" style="font-size:var(--x-font-size-medium)">
                    道可道非常道，名可名非常名。--x-font-size-medium
                </div>
                <div class="auto-card-body-item" style="font-size:var(--x-font-size-large)">
                    道可道非常道，名可名非常名。--x-font-size-large
                </div>
                <div class="auto-card-body-item" style="font-size:var(--x-font-size-x-large)">
                    道可道非常道，名可名非常名。--x-font-size-x-large
                </div>
            </div>
        </div>
        <div class="auto-card">
            <div class="auto-card-header">字体粗细</div>
            <div class="auto-card-body col">
                <div class="auto-card-body-item" style="font-weight:var(--x-font-weight-x-small)">
                    道可道非常道，名可名非常名。--x-font-weight-x-small
                </div>
                <div class="auto-card-body-item" style="font-weight:var(--x-font-weight-small)">
                    道可道非常道，名可名非常名。--x-font-weight-small
                </div>
                <div class="auto-card-body-item" style="font-weight:var(--x-font-weight-medium)">
                    道可道非常道，名可名非常名。--x-font-weight-medium
                </div>
                <div class="auto-card-body-item" style="font-weight:var(--x-font-weight-large)">
                    道可道非常道，名可名非常名。--x-font-weight-large
                </div>
                <div class="auto-card-body-item" style="font-weight:var(--x-font-weight-x-large)">
                    道可道非常道，名可名非常名。--x-font-weight-x-large
                </div>
            </div>
        </div>
        <div class="auto-card">
            <div class="auto-card-header">全局字体: <code>var(--auto-font)</code></div>
            <div class="auto-card-body col">
                <pre>--auto-font: var(--auto-font-weight) var(--auto-font-size)/1.5 var(--auto-font-family)</pre>
                <div class="list">
                    <div class="item" style="font:var(--auto-font)">
                        道可道，非常道；名可名，非常名。无名天地之始，有名万物之母。故常无欲，以观其妙；常有欲，以观其徼（jiào）。此两者同出而异名，同谓之玄，玄之又玄，众妙之门。
                    </div>
                </div>
            </div>
        </div>
    `,
} satisfies StoryModule;
