import { html } from "lit";
import type { StoryModule } from "../story";

/** 派生变量：按派生种类分卡展示，每种内做值对比。转译自 src/stories/colors/derived.story.ts 并重构 */
export default {
    title: "派生变量",
    render: () => html`
        <style>
            /* 交互态演示 */
            .demo-row {
                display: flex;
                gap: 0.8rem;
                flex-wrap: wrap;
            }
            .demo-row > .cell {
                flex: 1;
                min-width: 10rem;
                padding: 0.7rem 0.9rem;
                border-radius: var(--auto-border-radius);
                border: var(--auto-border);
                color: var(--auto-color);
                background: var(--auto-bgcolor);
                cursor: pointer;
                user-select: none;
                font-size: 0.85rem;
            }
            .cell:hover {
                color: var(--auto-hover-color);
                background: var(--auto-hover-bgcolor);
                border: var(--auto-hover-border);
            }
            .cell:active {
                color: var(--auto-active-color);
                background: var(--auto-active-bgcolor);
                border: var(--auto-active-border);
            }
            .cell.selected {
                color: var(--auto-selected-color);
                background: var(--auto-selected-bgcolor);
                border: var(--auto-selected-border);
            }
            .cell.disabled {
                color: var(--auto-disable-color);
                background: var(--auto-disable-bgcolor);
                border: var(--auto-disable-border);
                cursor: not-allowed;
            }
            /* 交互态对比卡：静态复现四态外观（并排同时呈现） */
            .state-cells > .cell.sim-hover {
                color: var(--auto-hover-color);
                background: var(--auto-hover-bgcolor);
                border: var(--auto-hover-border);
            }
            .state-cells > .cell.sim-active {
                color: var(--auto-active-color);
                background: var(--auto-active-bgcolor);
                border: var(--auto-active-border);
            }
            .state-cells > .cell.sim-selected {
                color: var(--auto-selected-color);
                background: var(--auto-selected-bgcolor);
                border: var(--auto-selected-border);
            }
            .state-cells > .cell.sim-disable {
                color: var(--auto-disable-color);
                background: var(--auto-disable-bgcolor);
                border: var(--auto-disable-border);
            }
        </style>

        <div class="auto-card story-intro">
            <div class="story-intro-title">特性说明：派生变量（Derived Vars）</div>
            <p>
                派生变量是主题系统的最上层封装：<code>--auto-*</code> 系列按「用途」而非「数值」命名，
                由底层基础变量组合派生。组件与页面样式只消费这一层，即可随主题色、暗色、多彩、尺寸四类开关全自动联动。
                下方按派生种类分卡，每种内做值对比。
            </p>
            <ul>
                <li>派生种类：语义色调 / 交互活动色（hover·active·selected·disable）/ 字体颜色 / 背景透明度阶梯 /
                    边框（五态）/ 排版字体 / 面板 / 输入框 / 间距圆角阴影图标</li>
                <li>层叠关系：基础值（<code>--x-*</code>）→ 用途派生（<code>--auto-*</code>）→ 组件类（<code>.auto-card</code> 等）</li>
            </ul>
            <pre>.my-panel { background: var(--auto-bgcolor); border: var(--auto-border); box-shadow: var(--auto-shadow); }</pre>
        </div>

        <!-- 种类一：语义色调 -->
        <div class="auto-card">
            <div class="auto-card-header">种类一：语义色调（六色并排对比）</div>
            <div class="auto-card-body col">
                <div style="display:flex;gap:0.7rem;flex-wrap:wrap;">
                    ${["primary", "success", "danger", "warning", "info", "theme"].map(
                        (name) => html`
                            <div
                                style="flex:1;min-width:7rem;text-align:center;padding:0.6rem;color:white;border-radius:var(--auto-border-radius);background:var(--auto-${name}-color);"
                            >
                                --auto-${name}-color
                            </div>
                        `,
                    )}
                </div>
                <p style="margin:0;color:var(--auto-third-color);font-size:0.8rem;">
                    五个固定语义 + 一个跟随主题色（<code>--auto-theme-color → theme-5</code> 中值）；
                    语义色可经 <code>ThemePro.update()</code> 覆盖。
                </p>
            </div>
        </div>

        <!-- 种类二：交互活动色 -->
        <div class="auto-card">
            <div class="auto-card-header">种类二：交互活动色（同款元素四态并排对比）</div>
            <div class="auto-card-body col">
                <div class="demo-row state-cells">
                    <div class="cell sim-hover">hover 态<br /><code style="font-size:0.68rem;">--auto-hover-*</code></div>
                    <div class="cell sim-active">active 态<br /><code style="font-size:0.68rem;">--auto-active-*</code></div>
                    <div class="cell sim-selected">selected 态<br /><code style="font-size:0.68rem;">--auto-selected-*</code></div>
                    <div class="cell sim-disable">disable 态<br /><code style="font-size:0.68rem;">--auto-disable-*</code></div>
                </div>
                <p style="margin:0;color:var(--auto-third-color);font-size:0.8rem;">
                    四态派生链各不相同：hover = 主题色 + 85% 透明底、active = <code>theme-8</code>（深一档）+ 85% 透明底、
                    selected = <code>theme-5</code> + 80% 透明底、disable = 文字色混灰 50% + currentColor 60% 透明底。
                    切换主题色观察四态同步跟随。
                </p>
                <div class="demo-row">
                    <div class="cell">真实交互项：悬停 / 按下体验动态效果</div>
                    <div class="cell selected">真实选中项</div>
                    <div class="cell disabled">真实禁用项</div>
                </div>
            </div>
        </div>

        <!-- 种类三：字体颜色 -->
        <div class="auto-card">
            <div class="auto-card-header">种类三：字体颜色（三档对比）</div>
            <div class="auto-card-body col">
                <div style="display:flex;gap:1rem;flex-wrap:wrap;">
                    ${[
                        { name: "--auto-color", ref: "var(--x-color-1)", tag: "主要文字" },
                        { name: "--auto-secondary-color", ref: "var(--x-color-2)", tag: "次要文字" },
                        { name: "--auto-third-color", ref: "var(--x-color-3)", tag: "辅助文字" },
                    ].map(
                        (item) => html`
                            <div
                                style="flex:1;min-width:10rem;padding:0.8rem;background:var(--auto-bgcolor);border:var(--auto-border);border-radius:var(--auto-border-radius);"
                            >
                                <div style="font-size:0.75rem;color:${item.ref};font-weight:600;">${item.tag}</div>
                                <div style="color:${item.ref};">道可道，非常道；名可名，非常名。</div>
                                <code style="font-size:0.68rem;color:var(--auto-third-color);">${item.name} → ${item.ref.slice(4, -1)}</code>
                            </div>
                        `,
                    )}
                </div>
            </div>
        </div>

        <!-- 种类四：背景透明度阶梯 -->
        <div class="auto-card">
            <div class="auto-card-header">种类四：背景透明度阶梯（四层剖面对比）</div>
            <div class="auto-card-body col">
                <div style="padding:0.9rem;background:var(--auto-workspace-bgcolor);border-radius:var(--auto-border-radius);border:var(--auto-border);">
                    <div style="font-size:0.72rem;color:var(--auto-third-color);margin-bottom:0.4rem;">--auto-workspace-bgcolor（工作区，实色沉底）</div>
                    <div style="padding:0.9rem;background:var(--auto-bgcolor);border-radius:var(--auto-border-radius);border:var(--auto-border);">
                        <div style="font-size:0.72rem;color:var(--auto-third-color);margin-bottom:0.4rem;">--auto-bgcolor（面板，实色容器）</div>
                        <div style="padding:0.8rem;background:var(--auto-secondary-bgcolor);border-radius:var(--auto-border-radius);">
                            <div style="font-size:0.72rem;color:var(--auto-third-color);margin-bottom:0.4rem;">--auto-secondary-bgcolor（原料 45% 不透明）</div>
                            <div style="padding:0.6rem;background:var(--auto-third-bgcolor);border-radius:var(--auto-border-radius);color:var(--auto-color);font-size:0.8rem;">
                                --auto-third-bgcolor（同一原料 75% 不透明）
                            </div>
                        </div>
                    </div>
                </div>
                <p style="margin:0;color:var(--auto-third-color);font-size:0.8rem;">
                    语义背景以<strong>透明度</strong>区分：面板为实色，次级 / 内嵌共用原料（<code>bgcolor-2</code>）以
                    45% / 75% 两档不透明度叠加，light / dark / 多彩下阶梯恒单调。
                </p>
            </div>
        </div>

        <!-- 种类五：边框五态 -->
        <div class="auto-card">
            <div class="auto-card-header">种类五：边框（默认 + 四交互态并排对比）</div>
            <div class="auto-card-body col">
                <div class="demo-row">
                    <div style="flex:1;min-width:8rem;padding:0.7rem;border:var(--auto-border);border-radius:var(--auto-border-radius);background:var(--auto-bgcolor);">
                        默认<br /><code style="font-size:0.68rem;">--auto-border</code>
                    </div>
                    <div style="flex:1;min-width:8rem;padding:0.7rem;border:var(--auto-hover-border);border-radius:var(--auto-border-radius);background:var(--auto-bgcolor);">
                        hover<br /><code style="font-size:0.68rem;">--auto-hover-border</code>
                    </div>
                    <div style="flex:1;min-width:8rem;padding:0.7rem;border:var(--auto-active-border);border-radius:var(--auto-border-radius);background:var(--auto-bgcolor);">
                        active<br /><code style="font-size:0.68rem;">--auto-active-border</code>
                    </div>
                    <div style="flex:1;min-width:8rem;padding:0.7rem;border:var(--auto-selected-border);border-radius:var(--auto-border-radius);background:var(--auto-bgcolor);">
                        selected<br /><code style="font-size:0.68rem;">--auto-selected-border</code>
                    </div>
                    <div style="flex:1;min-width:8rem;padding:0.7rem;border:var(--auto-disable-border);border-radius:var(--auto-border-radius);background:var(--auto-bgcolor);">
                        disable<br /><code style="font-size:0.68rem;">--auto-disable-border</code>
                    </div>
                </div>
                <p style="margin:0;color:var(--auto-third-color);font-size:0.8rem;">
                    五态边框与交互色同源（<code>--auto-border = 尺寸 + --auto-border-color</code>，四态边框色取对应交互色），
                    组合 <code>border: var(--auto-border)</code> 一条声明即得完整边框。
                </p>
                <div style="font-size:0.72rem;color:var(--auto-third-color);">真实交互：鼠标悬停 / 按下下列元素，观察边框从默认 → hover → active 的实时切换</div>
                <div class="demo-row">
                    <div class="cell">悬停我：border → var(--auto-hover-border)</div>
                    <div class="cell">按住我：border → var(--auto-active-border)</div>
                    <div class="cell selected">选中态：border → var(--auto-selected-border)</div>
                    <div class="cell disabled">禁用态：border → var(--auto-disable-border)</div>
                </div>
            </div>
        </div>

        <!-- 种类六：排版字体 -->
        <div class="auto-card">
            <div class="auto-card-header">种类六：排版字体（默认 vs 标题对比）</div>
            <div class="auto-card-body col">
                <div style="display:flex;gap:1rem;flex-wrap:wrap;">
                    <div style="flex:1;min-width:12rem;padding:0.8rem;background:var(--auto-bgcolor);border:var(--auto-border);border-radius:var(--auto-border-radius);font:var(--auto-font);">
                        默认字体 font: var(--auto-font)<br />道可道，非常道；名可名，非常名。
                    </div>
                    <div style="flex:1;min-width:12rem;padding:0.8rem;background:var(--auto-bgcolor);border:var(--auto-border);border-radius:var(--auto-border-radius);font:var(--auto-title-font);">
                        标题字体 font: var(--auto-title-font)<br />道可道，非常道；名可名，非常名。
                    </div>
                </div>
                <p style="margin:0;color:var(--auto-third-color);font-size:0.8rem;">
                    <code>--auto-title-font</code> 在默认字体基础上派生（权重 +100、字号 ×1.05）；
                    分解变量 <code>--auto-font-size / weight / family / letter-spacing / line-height</code> 随全局尺寸档联动。
                </p>
            </div>
        </div>

        <!-- 种类七：面板 -->
        <div class="auto-card" style="border:none;">
            <div class="auto-card-header">种类七：面板（header 与 body 派生组合）</div>
            <div class="auto-card-body">
                <div
                    style="margin-bottom:1em;background-color:var(--auto-panel-header-bgcolor);font:var(--auto-panel-header);color:var(--auto-panel-header-color);padding:0.6rem 0.9rem;border-radius:var(--auto-border-radius) var(--auto-border-radius) 0 0;"
                >
                    面板头部：font(--auto-panel-header) / color(--auto-panel-header-color) / bg(--auto-panel-header-bgcolor)
                </div>
                <div class="auto-card-body-item" style="background-color:var(--auto-panel-bgcolor);border:var(--auto-border);">
                    面板主体背景: var(--auto-panel-bgcolor)
                </div>
            </div>
        </div>

        <!-- 种类八：输入框 -->
        <div class="auto-card">
            <div class="auto-card-header">种类八：输入框（--auto-input-* 系列）</div>
            <div class="auto-card-body col">
                <div style="display:flex;gap:1rem;flex-wrap:wrap;align-items:flex-end;">
                    <div style="flex:1;min-width:12rem;">
                        <div style="font-size:0.72rem;color:var(--auto-third-color);margin-bottom:0.3rem;">派生组合的输入框</div>
                        <input
                            type="text"
                            placeholder="--auto-input-*"
                            style="width:100%;box-sizing:border-box;font:var(--auto-input-font);color:var(--auto-color);background:var(--auto-input-bgcolor);border:var(--auto-input-border);border-radius:var(--auto-input-radius);padding:var(--auto-input-padding);height:calc(1.5 * var(--auto-input-height));outline:none;"
                        />
                    </div>
                    <div style="flex:1;min-width:12rem;">
                        <div style="font-size:0.72rem;color:var(--auto-third-color);margin-bottom:0.3rem;">组件类 .auto-input（内部消费同一批派生值）</div>
                        <input type="text" class="auto-input" placeholder="请输入内容" style="width:100%;" />
                    </div>
                </div>
                <p style="margin:0;color:var(--auto-third-color);font-size:0.8rem;">
                    输入框系列 <code>--auto-input-{font/border/bgcolor/padding/radius/height}</code> 全部转发到对应通用派生值——
                    自定义输入控件时逐项引用即可获得与 <code>.auto-input</code> 一致的观感。
                </p>
            </div>
        </div>

        <!-- 种类九：间距 / 圆角 / 阴影 / 图标 -->
        <div class="auto-card">
            <div class="auto-card-header">种类九：间距 / 圆角 / 阴影 / 图标尺寸</div>
            <div class="auto-card-body col">
                <div style="display:flex;gap:1rem;flex-wrap:wrap;">
                    <div style="flex:1;min-width:9rem;padding:var(--auto-padding);border:var(--auto-border);border-radius:var(--auto-border-radius);box-shadow:var(--auto-shadow);background:var(--auto-bgcolor);">
                        padding: var(--auto-padding)
                    </div>
                    <div style="flex:1;min-width:9rem;padding:var(--auto-padding);border:var(--auto-border);border-radius:var(--auto-border-radius);box-shadow:var(--auto-shadow);background:var(--auto-bgcolor);display:flex;align-items:center;gap:0.5rem;">
                        <span class="auto-icon home" style="width:var(--auto-icon-size);height:var(--auto-icon-size);"></span>
                        icon: var(--auto-icon-size)
                    </div>
                </div>
                <p style="margin:0;color:var(--auto-third-color);font-size:0.8rem;">
                    四个尺寸类派生值（<code>--auto-spacing / border-radius / shadow / icon-size</code>）随全局尺寸档整体联动，
                    在右侧面板切换「尺寸」观察。
                </p>
            </div>
        </div>
    `,
} satisfies StoryModule;
