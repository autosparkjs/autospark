import { html } from "lit";
import { repeat } from "lit/directives/repeat.js";
import { themeManager } from "../../../src/index.ts";
import type { StoryModule } from "../story";

/**
 * 局部主题：转译自 src/stories/colors/theme.scope.story.ts
 *
 * 原故事把初始化逻辑写在 lit 模板内嵌 <script> 中（lit 渲染不会执行 script，实际是失效的），
 * 转译后改为 mounted 生命周期钩子真实生效：创建命名作用域并挂载到 #scopeCard 容器。
 */
export default {
    title: "局部主题",
    render: () => html`
        <div class="auto-card story-intro">
            <div class="story-intro-title">特性说明：局部主题（ThemeScope）</div>
            <p>
                <code>ThemeScope</code> 让同一页面内的不同区域拥有独立主题：每个作用域独立注入
                CSS 变量样式，挂载元素（<code>data-theme-scope</code>）及其子树内使用标准变量即可，
                互不干扰——如下方卡片矩阵中，右侧卡片受局部作用域控制，左侧仍跟随全局。
            </p>
            <ul>
                <li><code>ThemePro.addScope({ id })</code> 创建命名作用域；<code>scope.attach(el)</code> 挂载到元素</li>
                <li>作用域级开关：<code>scope.themeColor / scope.dark / scope.colorized</code>，与全局 API 同构</li>
                <li><code>ThemePro.removeScope(id)</code> 移除作用域并清理注入的样式</li>
                <li>支持 WebComponent 场景：<code>docRoot</code> 指向 shadowRoot、选择器用 <code>:host</code></li>
            </ul>
            <pre>const scope = ThemePro.addScope({ id: 'sidebar' })
scope.attach('#sidebar')      // 或 scope.attach(element)
scope.themeColor = 'purple'   // 仅 sidebar 区域变紫</pre>
        </div>
        <div class="auto-card">
            <div class="auto-card-header">局部主题效果对比（右下卡片受局部作用域控制）</div>
            <div class="auto-card-body row">
                <div class="auto-card">
                    <div class="auto-card-header">全局主题</div>
                    <div class="auto-card-body">
                        道可道，非常道；名可名，非常名。无名天地之始；有名万物之母。故常无，欲以观其妙；常有，欲以观其徼（jiào)
                    </div>
                </div>
                <div class="auto-card" data-theme-scope="scopeCard">
                    <div class="auto-card-header">局部主题</div>
                    <div class="auto-card-body">
                        道可道，非常道；名可名，非常名。无名天地之始；有名万物之母。故常无，欲以观其妙；常有欲，以观其徼（jiào)
                    </div>
                </div>
            </div>
        </div>
        <div class="auto-card" id="scopeCard">
            <div class="auto-card-header">局部主题控制（独立于全局主题）</div>
            <div class="auto-card-body col">
                <div id="scope-swatches" style="display:flex;gap:0.4rem;flex-wrap:wrap;padding:1em;">
                    ${repeat(
                        Object.entries(themeManager.presets),
                        ([name, theme]) => html`<span
                            class="scope-swatch"
                            data-color="${theme.color}"
                            title="${theme.title} (${name})"
                            style="padding:0.5em 1em;cursor:pointer;color:white;border-radius:var(--auto-border-radius);background-color:${theme.color};"
                            >${theme.title}</span
                        >`,
                    )}
                    <span
                        class="scope-toggle"
                        data-toggle="dark"
                        style="padding:0.5em 1em;cursor:pointer;color:var(--auto-color);border:var(--auto-border);border-radius:var(--auto-border-radius);"
                        >Dark</span
                    >
                    <span
                        class="scope-toggle"
                        data-toggle="colorized"
                        style="padding:0.5em 1em;cursor:pointer;color:var(--auto-color);border:var(--auto-border);border-radius:var(--auto-border-radius);"
                        >多彩</span
                    >
                </div>
                <div class="auto-card-body-item" style="color:var(--k-color-theme-8)">--k-color-theme-8</div>
                ${repeat(
                    Array.from({ length: 10 }),
                    (_, i) => html`
                        <div class="auto-card-body-item" style="background-color:var(--k-color-theme-${i})">
                            --k-color-theme-${i}
                        </div>
                    `,
                )}
            </div>
        </div>
    `,
    mounted() {
        // 创建命名局部作用域并挂载（作用于 #scopeCard 容器及其内部）
        const scope = themeManager.addScope({ id: "scopeCard" });
        if (scope) scope.attach("#scopeCard");

        const root = document.getElementById("scopeCard");
        const onClick = (e: Event) => {
            const target = e.target as HTMLElement;
            if (!scope || !root) return;
            if (target.classList.contains("scope-swatch")) {
                scope.themeColor = target.dataset.color!;
            } else if (target.dataset.toggle === "dark") {
                scope.dark = !root.hasAttribute("dark");
            } else if (target.dataset.toggle === "colorized") {
                scope.colorized = !root.hasAttribute("colorized");
            }
        };
        root?.addEventListener("click", onClick);
        return () => {
            // 切换故事时移除局部作用域（同时移除其注入的样式）
            themeManager.removeScope("scopeCard");
        };
    },
} satisfies StoryModule;
