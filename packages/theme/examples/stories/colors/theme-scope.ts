import { html } from "lit";
import { repeat } from "lit/directives/repeat.js";
import { themeManager } from "../../../src/index.ts";
import type { StoryModule } from "../story";

/** 三个独立局部主题作用域（id 即 data-theme-scope 值与 CSS 选择器锚点） */
const SCOPES = [
    { id: "scopeA", title: "侧边栏主题" },
    { id: "scopeB", title: "内容区主题" },
    { id: "scopeC", title: "工具栏主题" },
];

/**
 * 局部主题：转译自 src/stories/colors/theme.scope.story.ts 并扩展为多作用域演示。
 * 三个示例卡片各自挂独立 ThemeScope，可分别切换主题色 / 暗色 / 多彩，互不干扰、不影响全局。
 */
export default {
    title: "局部主题",
    render: () => html`
        <div class="story-intro">
            <div class="story-intro-title">特性说明：局部主题（ThemeScope）</div>
            <p>
                <code>ThemeScope</code> 让同一页面内多个区域拥有各自独立的主题：每个作用域独立注入
                CSS 变量样式，挂载元素（<code>data-theme-scope</code>）及其子树内使用标准变量即可。
                下方三张卡片各挂一个作用域，可分别控制、互不干扰——右侧全局面板的切换也不影响它们。
            </p>
            <ul>
                <li><code>ThemePro.addScope({ id })</code> 创建命名作用域；<code>scope.attach(el)</code> 挂载</li>
                <li>作用域级开关：<code>scope.themeColor / scope.dark / scope.colorized</code>，与全局 API 同构</li>
                <li><code>ThemePro.removeScope(id)</code> 移除作用域并清理注入的样式</li>
                <li>支持 WebComponent：<code>docRoot</code> 指向 shadowRoot、选择器用 <code>:host</code></li>
            </ul>
            <pre>const scope = ThemePro.addScope({ id: 'sidebar' })
scope.attach('#sidebar')
scope.themeColor = 'purple'   // 仅 sidebar 区域变紫</pre>
        </div>

        <div class="auto-card">
            <div class="auto-card-header">效果对比：全局主题 vs 局部主题（下方三卡不受全局切换影响）</div>
            <div class="auto-card-body row">
                <div class="auto-card">
                    <div class="auto-card-header">跟随全局</div>
                    <div class="auto-card-body" style="color:var(--auto-theme-color);">
                        道可道，非常道；名可名，非常名。无名天地之始；有名万物之母。
                    </div>
                </div>
                <div class="auto-card" data-theme-scope="scopeA">
                    <div class="auto-card-header">局部（scopeA）</div>
                    <div class="auto-card-body" style="color:var(--auto-theme-color);">
                        道可道，非常道；名可名，非常名。无名天地之始；有名万物之母。
                    </div>
                </div>
                <div class="auto-card" data-theme-scope="scopeB" dark>
                    <div class="auto-card-header">局部 + dark（scopeB）</div>
                    <div class="auto-card-body" style="color:var(--auto-theme-color);">
                        道可道，非常道；名可名，非常名。无名天地之始；有名万物之母。
                    </div>
                </div>
            </div>
        </div>

        ${repeat(
            SCOPES,
            ({ id, title }) => html`
                <div class="auto-card" id="${id}">
                    <div class="auto-card-header">${title}（data-theme-scope="${id}"）</div>
                    <div class="auto-card-body col">
                        <!-- 本卡专属控制条：色块与开关均携带 data-scope-id 标识归属 -->
                        <div style="display:flex;gap:0.35rem;flex-wrap:wrap;align-items:center;padding:0.3rem 0;">
                            ${repeat(
                                Object.entries(themeManager.presets),
                                ([name, theme]) => html`<span
                                    class="scope-swatch"
                                    data-scope-id="${id}"
                                    data-color="${theme.color}"
                                    title="${theme.title} (${name})"
                                    style="width:1.15rem;height:1.15rem;cursor:pointer;border-radius:var(--auto-border-radius);background-color:${theme.color};border:1px solid var(--auto-border-color);display:inline-block;"
                                ></span>`,
                            )}
                            <span
                                class="scope-toggle"
                                data-scope-id="${id}"
                                data-toggle="dark"
                                style="padding:0.15rem 0.6rem;cursor:pointer;font-size:0.75rem;border:var(--auto-border);border-radius:var(--auto-border-radius);"
                                >Dark</span
                            >
                            <span
                                class="scope-toggle"
                                data-scope-id="${id}"
                                data-toggle="colorized"
                                style="padding:0.15rem 0.6rem;cursor:pointer;font-size:0.75rem;border:var(--auto-border);border-radius:var(--auto-border-radius);"
                                >多彩</span
                            >
                        </div>
                        <!-- 本作用域当前主题梯度 -->
                        <div style="display:flex;gap:0.3rem;">
                            ${repeat(
                                Array.from({ length: 10 }),
                                (_, i) => html`<span
                                    style="flex:1;height:1.6em;background-color:var(--k-color-theme-${i});border-radius:calc(var(--auto-border-radius) * 0.5);"
                                ></span>`,
                            )}
                        </div>
                        <div
                            style="padding:0.5rem 0.7rem;border:var(--auto-border);border-radius:var(--auto-border-radius);color:var(--auto-color);background:var(--auto-secondary-bgcolor);font-size:0.85rem;"
                        >
                            本区域内的卡片 / 文字 / 背景（<code>--auto-*</code>）均取自 ${id} 作用域，与全局及相邻作用域隔离。
                        </div>
                    </div>
                </div>
            `,
        )}
    `,
    mounted(host: HTMLElement) {
        // 为三个卡片各创建独立作用域并挂载（attach 即写入 data-theme-scope 属性并应用变量）
        const scopes = SCOPES.map(({ id }) => {
            const scope = themeManager.addScope({ id });
            if (scope) scope.attach(`#${id}`);
            return scope;
        });
        const byId = new Map(SCOPES.map(({ id }, i) => [id, scopes[i]]));

        // 事件委托：色块 / 开关均携带 data-scope-id，一次监听分派到对应作用域
        const onClick = (e: Event) => {
            const target = e.target as HTMLElement;
            const scopeId = target.dataset.scopeId;
            if (!scopeId) return;
            const scope = byId.get(scopeId);
            const card = document.getElementById(scopeId);
            if (!scope || !card) return;
            if (target.classList.contains("scope-swatch")) {
                scope.themeColor = target.dataset.color!;
            } else if (target.dataset.toggle === "dark") {
                scope.dark = !card.hasAttribute("dark");
            } else if (target.dataset.toggle === "colorized") {
                scope.colorized = !card.hasAttribute("colorized");
            }
        };
        host.addEventListener("click", onClick);

        return () => {
            host.removeEventListener("click", onClick);
            SCOPES.forEach(({ id }) => themeManager.removeScope(id));
        };
    },
} satisfies StoryModule;
