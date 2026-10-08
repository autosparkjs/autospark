import { html } from "lit";
import { repeat } from "lit/directives/repeat.js";
import type { StoryModule } from "../story";

/** 按钮：转译自 src/stories/components/button.story.ts（主题控制交由右侧面板） */
const SIZES = ["x-small", "small", "medium", "large", "x-large"];

export default {
    title: "按钮 Button",
    render: () => html`
        <div class="auto-card story-intro">
            <div class="story-intro-title">特性说明：按钮（Button）</div>
            <p>
                <code>.auto-btn</code> 提供完整的按钮形态系统：尺寸类（五档）、语义类（六种）、形状类
                （<code>circle</code> 正圆 / <code>pill</code> 胶囊）、密度类（<code>compact</code> 紧凑）。
                内边距、圆角、阴影、字体全部消费 <code>--auto-*</code> 变量，随主题与尺寸档位联动；
                悬停/按下有自动的明暗反馈。
            </p>
            <ul>
                <li>语义色：<code>primary / success / warning / danger（别名 error）/ info</code></li>
                <li><code>compact</code>：更小的内边距，适合工具栏 / 表格内操作</li>
            </ul>
            <pre>&lt;button class="auto-btn primary large"&gt;主要操作&lt;/button&gt;
&lt;button class="auto-btn pill"&gt;胶囊按钮&lt;/button&gt;</pre>
        </div>
        <div class="auto-card">
            <div class="auto-card-header">按钮大小</div>
            <div class="auto-card-body col">
                <div>
                    ${repeat(SIZES, (size) => html`<div class="auto-btn ${size}">确定</div>`)}
                </div>
            </div>
        </div>
        <div class="auto-card">
            <div class="auto-card-header">语义按钮</div>
            <div class="auto-card-body col">
                <div>
                    <div class="auto-btn">Normal</div>
                    <div class="auto-btn primary">Primary</div>
                    <div class="auto-btn success">Success</div>
                    <div class="auto-btn warning">Warning</div>
                    <div class="auto-btn danger">Danger</div>
                    <div class="auto-btn info">Info</div>
                </div>
            </div>
        </div>
        <div class="auto-card">
            <div class="auto-card-header">按钮形状</div>
            <div class="auto-card-body col">
                <div>
                    ${repeat(SIZES, (size) => html`<div class="auto-btn ${size} circle">确定</div>`)}
                </div>
                <div>
                    ${repeat(SIZES, (size) => html`<div class="auto-btn ${size} pill">取消</div>`)}
                </div>
            </div>
        </div>
        <div class="auto-card">
            <div class="auto-card-header">紧凑与别名形态</div>
            <div class="auto-card-body col">
                <div>
                    <div class="auto-btn compact">compact 紧凑</div>
                    <div class="auto-btn primary compact">primary compact</div>
                    <div class="auto-btn danger compact">danger compact</div>
                </div>
                <div>
                    <div class="auto-btn error">error（danger 的别名类）</div>
                    <div class="auto-btn danger">danger</div>
                </div>
                <p style="margin:0;color:var(--auto-third-color);font-size:0.8rem;">
                    悬停 / 按下按钮观察 <code>--auto-hover-*</code> / <code>--auto-active-*</code> 派生态。
                </p>
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
