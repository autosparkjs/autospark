import { html } from "lit";
import type { StoryModule } from "../story";

/** 提示：转译自 src/stories/components/alert.story.ts（修正原文孤立 &lt;/span&gt; 笔误；主题控制交由右侧面板） */
export default {
    title: "提示 Alert",
    render: () => html`
        <div class="auto-card story-intro">
            <div class="story-intro-title">特性说明：提示（Alert）</div>
            <p>
                <code>.auto-alert</code> 用于页面内的重要信息提示：默认形态带信息图标，
                语义类（<code>success / warning / primary / danger</code>）切换配色与图标，
                内嵌 <code>.closeable</code> 提供关闭按钮（悬停有反馈动画），<code>.title</code>
                子元素提供「标题 + 正文」结构。
            </p>
            <ul>
                <li>背景留白基于 <code>--auto-spacing</code>，随间距档位联动</li>
                <li>语义背景由 <code>color-mix(语义色, white 90%)</code> 自动派生浅色调</li>
            </ul>
            <pre>&lt;div class="auto-alert warning"&gt;
    &lt;div class="title"&gt;标题&lt;span class="closeable"&gt;&lt;/span&gt;&lt;/div&gt;
    这是一条警告信息
&lt;/div&gt;</pre>
        </div>
        <div class="auto-card">
            <div class="auto-card-header">简单提示信息</div>
            <div class="auto-card-body col">
                <div class="auto-alert">这是一条普通提示信息</div>
                <div class="auto-alert success">这是一条成功信息 success</div>
                <div class="auto-alert warning">这是一条警告信息 warning</div>
                <div class="auto-alert primary">这是一条关键信息 primary</div>
                <div class="auto-alert danger">这是一条错误信息 danger</div>
            </div>
        </div>
        <div class="auto-card">
            <div class="auto-card-header">提示信息 - 包含关闭按钮</div>
            <div class="auto-card-body col">
                <div class="auto-alert">这是一条提示信息<span class="closeable"></span></div>
                <div class="auto-alert success">这是一条成功信息 success<span class="closeable"></span></div>
                <div class="auto-alert warning">这是一条警告信息 warning<span class="closeable"></span></div>
                <div class="auto-alert primary">这是一条关键信息 primary<span class="closeable"></span></div>
                <div class="auto-alert danger">这是一条错误信息 danger<span class="closeable"></span></div>
            </div>
        </div>
        <div class="auto-card">
            <div class="auto-card-header">带标题结构（.title + 正文）</div>
            <div class="auto-card-body col">
                <div class="auto-alert warning">
                    <div class="title">注意<span class="closeable"></span></div>
                    <div class="description">这是一条带标题的警告信息，标题行与正文自动分隔</div>
                </div>
                <div class="auto-alert success">
                    <div class="title">操作成功</div>
                    <div class="description">数据已保存至服务器，title 内可放关闭按钮或操作链接</div>
                </div>
            </div>
        </div>
    `,
} satisfies StoryModule;
