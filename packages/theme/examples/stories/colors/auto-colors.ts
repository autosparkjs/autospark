import { html } from "lit";
import { repeat } from "lit/directives/repeat.js";
import type { StoryModule } from "../story";

/** 自动颜色变量：转译自 src/stories/colors/theme.autocolor.story.ts，按场景重构演示 */
export default {
    title: "自动颜色变量",
    render: () => html`
        <style>
            /* 交互态演示：真实列表的悬停 / 按下 / 选中反馈 */
            .demo-list {
                display: flex;
                flex-direction: column;
                gap: 0.4rem;
            }
            .demo-list > .item {
                display: flex;
                align-items: center;
                gap: 0.6rem;
                padding: 0.55rem 0.8rem;
                border: 1px solid transparent;
                border-radius: var(--auto-border-radius);
                color: var(--auto-color);
                background: var(--auto-bgcolor);
                cursor: pointer;
                user-select: none;
                transition: all 0.15s;
            }
            .demo-list > .item:hover {
                color: var(--auto-hover-color);
                background: var(--auto-hover-bgcolor);
            }
            .demo-list > .item:active {
                color: var(--auto-active-color);
                background: var(--auto-active-bgcolor);
                border: var(--auto-active-border);
            }
            .demo-list > .item.selected {
                color: var(--auto-selected-color);
                background: var(--auto-selected-bgcolor);
                border: var(--auto-selected-border);
            }
            .demo-list > .item.disabled {
                color: var(--auto-disable-color);
                background: var(--auto-disable-bgcolor);
                cursor: not-allowed;
            }
        </style>

        <div class="auto-card story-intro">
            <div class="story-intro-title">特性说明：自动颜色变量（Auto Colors）</div>
            <p>
                <code>--auto-*</code> 颜色别名是面向组件的语义层：<strong>文字层级、背景层级、交互反馈、禁用态</strong>
                各有专属变量，底层随主题色、暗色、多彩模式自动切换——组件只按「场景」选变量，永不需要写死颜色。
            </p>
            <ul>
                <li>文字层级：<code>--auto-color</code>（主要）/ <code>--auto-secondary-color</code>（次要）/ <code>--auto-third-color</code>（辅助）</li>
                <li>背景层级：<code>--auto-workspace-bgcolor</code>（工作区）/ <code>--auto-bgcolor</code>（面板）/ <code>--auto-secondary-bgcolor</code>（次级）</li>
                <li>交互反馈：<code>--auto-hover-*</code>（悬停）/ <code>--auto-active-*</code>（按下）/ <code>--auto-selected-*</code>（选中）</li>
                <li>禁用态：<code>--auto-disable-*</code>（不可用元素整体降调）</li>
            </ul>
            <pre>.item:hover { color: var(--auto-hover-color); background: var(--auto-hover-bgcolor); }</pre>
        </div>

        <div class="auto-card">
            <div class="auto-card-header">主题色梯度（auto 颜色的源头）</div>
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
            <div class="auto-card-header">场景一：文字层级（通知列表项）</div>
            <div class="auto-card-body col">
                <p style="margin:0;color:var(--auto-third-color);font-size:0.8rem;">
                    同一条目内三种信息各取所需：标题抓眼球、摘要次之、时间戳最弱——
                </p>
                <div style="padding:0.8rem;border:var(--auto-border);border-radius:var(--auto-border-radius);background:var(--auto-bgcolor);display:flex;flex-direction:column;gap:0.25rem;">
                    <div style="display:flex;align-items:baseline;justify-content:space-between;gap:1rem;">
                        <span style="color:var(--auto-color);font-weight:600;">构建任务 #128 完成 <code style="font-size:0.72rem;">--auto-color</code></span>
                        <span style="color:var(--auto-third-color);font-size:0.75rem;flex-shrink:0;">3 分钟前 <code style="font-size:0.72rem;">--auto-third-color</code></span>
                    </div>
                    <div style="color:var(--auto-secondary-color);font-size:0.85rem;">
                        产物 autospark.js（IIFE 248KB）已发布到测试环境，回归用例 412/412 通过。
                        <code style="font-size:0.72rem;">--auto-secondary-color</code>
                    </div>
                </div>
                <p style="margin:0;color:var(--auto-third-color);font-size:0.8rem;">
                    开启暗色模式或切换主题色，三层文字自动重排明暗——无需为每种模式写一套颜色。
                </p>
            </div>
        </div>

        <div class="auto-card">
            <div class="auto-card-header">文字三档对比（同文同底，仅档位不同）</div>
            <div class="auto-card-body col">
                <div style="display:flex;gap:1rem;flex-wrap:wrap;">
                    ${[
                        { name: "--auto-color", ref: "var(--auto-color)", tag: "主要文字" },
                        { name: "--auto-secondary-color", ref: "var(--auto-secondary-color)", tag: "次要文字" },
                        { name: "--auto-third-color", ref: "var(--auto-third-color)", tag: "辅助文字" },
                    ].map(
                        (item) => html`
                            <div
                                style="flex:1;min-width:11rem;padding:0.9rem;background:var(--auto-bgcolor);border:var(--auto-border);border-radius:var(--auto-border-radius);display:flex;flex-direction:column;gap:0.45rem;"
                            >
                                <div style="font-size:0.75rem;color:${item.ref};font-weight:600;">${item.tag}</div>
                                <div style="color:${item.ref};">道可道，非常道；名可名，非常名。</div>
                                <code style="font-size:0.68rem;color:var(--auto-third-color);">${item.name} → ${item.ref.slice(4, -1)}</code>
                            </div>
                        `,
                    )}
                </div>
                <p style="margin:0;color:var(--auto-third-color);font-size:0.8rem;">
                    三档分别引用文字标尺的 <code>color-1 / color-3 / color-4</code> 档（light 下
                    #3B3B3B / #6D6D6D / #959595，档距均匀）：逐档变浅，
                    dark 与多彩模式下随 <code>--x-color-*</code> 标尺整体换值，但「主要 &gt; 次要 &gt; 辅助」的层级恒成立——
                    在右侧面板切换暗色 / 多彩观察三档联动。
                </p>
            </div>
        </div>
        <div class="auto-card">
            <div class="auto-card-header">场景二：背景层级（页面结构剖面）</div>
            <div class="auto-card-body col">
                <p style="margin:0;color:var(--auto-third-color);font-size:0.8rem;">
                    从外到内四层嵌套，每层一个背景变量，自然形成深度——
                </p>
                <div style="padding:0.9rem;background:var(--auto-workspace-bgcolor);border-radius:var(--auto-border-radius);border:var(--auto-border);">
                    <div style="font-size:0.72rem;color:var(--auto-third-color);margin-bottom:0.4rem;">--auto-workspace-bgcolor（工作区 / 应用底）</div>
                    <div style="padding:0.9rem;background:var(--auto-bgcolor);border-radius:var(--auto-border-radius);border:var(--auto-border);">
                        <div style="font-size:0.72rem;color:var(--auto-third-color);margin-bottom:0.4rem;">--auto-bgcolor（面板 / 卡片）</div>
                        <div style="padding:0.8rem;background:var(--auto-secondary-bgcolor);border-radius:var(--auto-border-radius);">
                            <div style="font-size:0.72rem;color:var(--auto-third-color);margin-bottom:0.4rem;">--auto-secondary-bgcolor（次级面板 / 分区）</div>
                            <div style="padding:0.6rem;background:var(--auto-third-bgcolor);border-radius:var(--auto-border-radius);color:var(--auto-color);font-size:0.8rem;">
                                --auto-third-bgcolor（代码块 / 内嵌提示）
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="auto-card">
            <div class="auto-card-header">场景三：交互反馈（菜单 / 列表项，悬停、按下、选中、禁用）</div>
            <div class="auto-card-body col">
                <div class="demo-list">
                    <div class="item">
                        <span class="auto-icon home"></span> 普通项 —— 鼠标悬停看 <code>--auto-hover-*</code>，按下看 <code>--auto-active-*</code>
                    </div>
                    <div class="item selected">
                        <span class="auto-icon checked"></span> 选中项 —— 持续使用 <code>--auto-selected-*</code>（当前路由 / 当前筛选）
                    </div>
                    <div class="item disabled">
                        <span class="auto-icon no"></span> 禁用项 —— <code>--auto-disable-*</code> 整体降调且光标禁止
                    </div>
                </div>
                <p style="margin:0;color:var(--auto-third-color);font-size:0.8rem;">
                    一组状态变量覆盖列表 / 菜单 / 标签页 / 工具条的常见反馈；主题色变化时反馈色同步跟随。
                </p>
            </div>
        </div>

        <div class="auto-card">
            <div class="auto-card-header">变量速查</div>
            <div class="auto-card-body col">
                <div class="auto-card-body-item" style="border:var(--auto-border);color:var(--auto-color);background-color:var(--auto-bgcolor)">
                    color:var(--auto-color);background-color:var(--auto-bgcolor) —— 主要文字 / 面板底
                </div>
                <div class="auto-card-body-item" style="border:var(--auto-border);color:var(--auto-selected-color);background-color:var(--auto-selected-bgcolor)">
                    color:var(--auto-selected-color);background-color:var(--auto-selected-bgcolor) —— 选中态
                </div>
                <div class="auto-card-body-item" style="border:var(--auto-border);color:var(--auto-hover-color);background-color:var(--auto-hover-bgcolor)">
                    color:var(--auto-hover-color);background-color:var(--auto-hover-bgcolor) —— 悬停态
                </div>
                <div class="auto-card-body-item" style="border:var(--auto-border);color:var(--auto-active-color);background-color:var(--auto-active-bgcolor)">
                    color:var(--auto-active-color);background-color:var(--auto-active-bgcolor) —— 按下态
                </div>
                <div class="auto-card-body-item" style="border:var(--auto-border);color:var(--auto-disable-color);">
                    color:var(--auto-disable-color);background-color:var(--auto-disable-bgcolor) —— 禁用态
                </div>
            </div>
        </div>
    `,
} satisfies StoryModule;
