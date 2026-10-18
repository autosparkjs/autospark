import { html } from "lit";
import { themeManager, type AutoSparkThemeScope } from "../../../src/index.ts";
import type { StoryModule } from "../story";

/**
 * 独立样式域：演示 data-light / data-dark / data-colorized / data-uncolored
 * 四属性手动通道——模式维度与色彩维度各一对，任意元素裸挂属性即可独立启用，
 * 与 JS setter 写作用域元素的 dark / colorized 属性通道并存。
 *
 * 覆盖：基础三卡（data-dark / data-colorized / 同挂）+ 组件联动（alert 的
 * [data-dark] 与 [data-light] 规则）+ 混合组合（JS 通道与手动通道同元素）
 * + 三新卡（暗内亮 data-light / 彩内灰 data-uncolored / 作用域子树约束）。
 */

/** 十阶主题梯度色块：dark 下梯度反转，是模式切换最直观的指示条 */
const SWATCHES = Array.from({ length: 10 }, (_, i) => i);

const TOGGLE_STYLE =
    "padding:0.15rem 0.6rem;cursor:pointer;font-size:0.75rem;border:var(--auto-border);border-radius:var(--auto-border-radius);user-select:none;";

/** 作用域主题梯度条 */
const strip = () => html`<div style="display:flex;gap:0.3rem;">
    ${SWATCHES.map(
    (i) =>
        html`<span
                style="flex:1;height:1.6em;background-color:var(--x-color-theme-${i});border-radius:calc(var(--auto-border-radius) * 0.5);margin:0.5em;"
            ></span>`,
)}
</div>`;

/** 受模式影响的正文样例：前景/背景/边框全部取自 --auto-* */
const sample = (text: string) => html`<div
    style="padding:0.5rem 0.7rem;border:var(--auto-border);border-radius:var(--auto-border-radius);color:var(--auto-color);background:var(--auto-secondary-bgcolor);font-size:0.85rem;"
>
    ${text}
</div>`;

export default {
    title: "元素样式域",
    render: () => html`
        <div class="auto-card story-intro">
            <div class="story-intro-title">特性说明：四属性独立样式域（模式维度 × 色彩维度）</div>
            <p>
                模式维度（<code>data-light</code> / <code>data-dark</code>）与色彩维度（<code>data-colorized</code> /
                <code>data-uncolored</code>）各一对手动通道，任意元素裸挂属性即可独立启用，维度可自由组合——
                与 JS 通道（<code>scope.dark</code> 等 setter 写作用域元素的
                <code>dark</code> / <code>colorized</code> 属性）长期并存。
            </p>
            <pre>&lt;div data-dark&gt;…&lt;/div&gt;                   // 仅此元素进入暗色
&lt;div data-light&gt;…&lt;/div&gt;                  // 暗语境中单独切回亮（含 color-scheme）
&lt;div data-colorized&gt;…&lt;/div&gt;             // 仅此元素进入多彩（模式随语境）
&lt;div data-uncolored&gt;…&lt;/div&gt;             // 色彩回灰、模式随语境
&lt;div data-dark data-colorized&gt;…&lt;/div&gt;   // 同元素叠加暗色 + 多彩</pre>
            <ul>
                <li>
                    组合语义：<b>模式切换会把色彩重置为灰</b>——两维度要同时生效须同元素组合
                    （如 <code>data-dark data-colorized</code>）；单独的色彩开关则<b>保留语境模式</b>
                    （<code>data-colorized</code> 在暗语境取暗多彩映射，<code>data-uncolored</code> 在暗语境回暗灰）
                </li>
                <li>
                    作用域约束：根域（<code>:host</code> / <code>:root</code>）裸属性追加；其余作用域收敛为
                    「自身 + 后代」两式（<code>S[data-X]</code> / <code>S [data-X]</code>）——跨作用域裸命中会错拿
                    别的作用域的字面量梯度
                </li>
                <li>
                    仍存限制：叠加态要求属性落在<b>同一元素</b>——html 挂 <code>dark</code>、后代单独挂
                    <code>data-colorized</code> 不会叠加（可降级用 <code>data-uncolored</code> 回灰保留模式）
                </li>
            </ul>
        </div>

        <div class="auto-card">
            <div class="auto-card-header">基础三卡：data-dark / data-colorized / 同挂（页面其余部分保持亮色）</div>
            <div class="auto-card-body row">
                <div class="auto-card" id="dm-dark" data-dark>
                    <div class="auto-card-header">单独 data-dark（含组件联动）</div>
                    <div class="auto-card-body col">
                        <span class="dm-toggle" data-target="dm-dark" data-attr="data-dark" style="${TOGGLE_STYLE}"></span>
                        ${strip()}
                        ${sample("本卡仅以 data-dark 单独启用暗色，页面其余部分不受影响。")}
                        <div class="auto-alert warning">
                            data-dark 卡片内的 alert：命中 alert.less 的 [data-dark] 规则，面板底色随暗色换肤
                        </div>
                    </div>
                </div>

                <div class="auto-card" id="dm-colorized" data-colorized>
                    <div class="auto-card-header">单独 data-colorized</div>
                    <div class="auto-card-body col">
                        <span
                            class="dm-toggle"
                            data-target="dm-colorized"
                            data-attr="data-colorized"
                            style="${TOGGLE_STYLE}"
                        ></span>
                        ${strip()}
                        ${sample("本卡仅以 data-colorized 单独启用多彩，灰阶幕布换为主题色浸染。")}
                    </div>
                </div>

                <div class="auto-card" id="dm-both" data-dark data-colorized>
                    <div class="auto-card-header">data-dark + data-colorized 同挂（叠加态）</div>
                    <div class="auto-card-body col">
                        <span style="display:flex;gap:0.35rem;">
                            <span class="dm-toggle" data-target="dm-both" data-attr="data-dark" style="${TOGGLE_STYLE}"></span>
                            <span
                                class="dm-toggle"
                                data-target="dm-both"
                                data-attr="data-colorized"
                                style="${TOGGLE_STYLE}"
                            ></span>
                        </span>
                        ${strip()}
                        ${sample("同元素同时挂两个属性即命中叠加块：暗色 + 多彩的厚重暗底。")}
                    </div>
                </div>
            </div>
        </div>

        <div class="auto-card">
            <div class="auto-card-header">
                混合组合：JS 通道 + 手动通道同元素（命中 [dark][data-colorized] / [data-dark][colorized]）
            </div>
            <div class="auto-card-body row">
                <div class="auto-card" id="mix-a" data-theme-scope="mixA" data-colorized>
                    <div class="auto-card-header">手动 data-colorized + scope.dark（JS 写 dark）</div>
                    <div class="auto-card-body col">
                        <span
                            class="dm-toggle"
                            data-target="mix-a"
                            data-scope="mixA"
                            data-toggle="dark"
                            style="${TOGGLE_STYLE}"
                        ></span>
                        ${strip()}
                        ${sample(
        "开关让作用域把 dark 属性写到本卡——与手动 data-colorized 同元素命中 [dark][data-colorized] 组合块。",
    )}
                    </div>
                </div>

                <div class="auto-card" id="mix-b" data-theme-scope="mixB" data-dark>
                    <div class="auto-card-header">手动 data-dark + scope.colorized（JS 写 colorized）</div>
                    <div class="auto-card-body col">
                        <span
                            class="dm-toggle"
                            data-target="mix-b"
                            data-scope="mixB"
                            data-toggle="colorized"
                            style="${TOGGLE_STYLE}"
                        ></span>
                        ${strip()}
                        ${sample(
        "开关让作用域把 colorized 属性写到本卡——与手动 data-dark 同元素命中 [data-dark][colorized] 组合块。",
    )}
                    </div>
                </div>
            </div>
        </div>

        <div class="auto-card">
            <div class="auto-card-header">维度独立：暗内亮（data-light）/ 彩内灰（data-uncolored）</div>
            <div class="auto-card-body row">
                <div class="auto-card" id="dim-light" data-dark>
                    <div class="auto-card-header">暗卡中的亮元素（data-light）</div>
                    <div class="auto-card-body col">
                        <span class="dm-toggle" data-target="dim-light" data-attr="data-dark" style="${TOGGLE_STYLE}"></span>
                        ${sample("外层暗卡（data-dark）。")}
                        <div
                            class="auto-card"
                            id="dim-light-inner"
                            data-light
                            style="border-color:var(--auto-border);"
                        >
                            <div class="auto-card-header">内层 data-light：完整亮域</div>
                            <div class="auto-card-body col">
                                <span
                                    class="dm-toggle"
                                    data-target="dim-light-inner"
                                    data-attr="data-light"
                                    style="${TOGGLE_STYLE}"
                                ></span>
                                ${strip()}
                                ${sample("亮域含非反转梯度、亮灰方向与 color-scheme: light（滚动条等原生控件一并回亮）。")}
                                <div class="auto-alert success">
                                    暗卡中的亮 alert：命中 [data-light] 对偶反规则，还原白混底 + 彩字
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="auto-card" id="dim-plain" data-colorized>
                    <div class="auto-card-header">彩卡中的灰元素（data-uncolored）</div>
                    <div class="auto-card-body col">
                        <span
                            class="dm-toggle"
                            data-target="dim-plain"
                            data-attr="data-colorized"
                            style="${TOGGLE_STYLE}"
                        ></span>
                        ${sample("外层彩卡（data-colorized）：主题色浸染。")}
                        <div
                            class="auto-card"
                            id="dim-plain-inner"
                            data-uncolored
                        >
                            <div class="auto-card-header">内层 data-uncolored：色彩回灰、模式随语境</div>
                            <div class="auto-card-body col">
                                <span
                                    class="dm-toggle"
                                    data-target="dim-plain-inner"
                                    data-attr="data-uncolored"
                                    style="${TOGGLE_STYLE}"
                                ></span>
                                ${strip()}
                                ${sample("灰色方向由语境模式块的 --x-plain-* 别名决定——外层切暗时这里回暗灰。")}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="auto-card">
            <div class="auto-card-header">作用域子树约束：data-dark 只影响本作用域内（不跨域错拿梯度）</div>
            <div class="auto-card-body row">
                <div class="auto-card" id="guard-host">
                    <div class="auto-card-header">作用域外宿主（自带 data-theme 青色梯度）</div>
                    <div class="auto-card-body col">
                        ${sample("本卡不属于任何作用域，data-theme 走全局默认蓝色梯度。")}
                         ${strip()}
                        <div data-dark style="padding:0.5rem;border:var(--auto-border);border-radius:var(--auto-border-radius);">
                            ${sample("作用域外的 data-dark：命中根域裸暗色块（本作用域约束不涉及它）。")}
                        </div>
                    </div>
                </div>

                <div class="auto-card" id="guard-scope" data-theme-scope="guardA">
                    <div class="auto-card-header">作用域 guardA（青色 cyan 梯度）</div>
                    <div class="auto-card-body col">
                        ${sample("本卡挂 data-theme-scope=guardA，作用域 themeColor=cyan——字面量梯度与根域不同。")}
                        <div data-dark style="padding:0.5rem;border:var(--auto-border);border-radius:var(--auto-border-radius);">
                            ${strip()}
                            ${sample(
        "作用域内的 data-dark：命中 S [data-dark]——青色作用域自己的暗色块（梯度为 cyan 反转），而非根域的蓝梯度暗色块。",
    )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    mounted(host: HTMLElement) {
        // 混合组合卡：各挂一个作用域，setter 经 JS 通道把 dark/colorized 属性写到卡片自身
        const mixA: AutoSparkThemeScope | undefined = themeManager.addScope({ id: "mixA" });
        if (mixA) mixA.attach("#mix-a");
        const mixB: AutoSparkThemeScope | undefined = themeManager.addScope({ id: "mixB" });
        if (mixB) mixB.attach("#mix-b");
        // 作用域约束卡：teal 梯度作用域
        const guardA: AutoSparkThemeScope | undefined = themeManager.addScope({ id: "guardA", themeColor: "teal" });
        if (guardA) guardA.attach("#guard-scope");

        const cardOf = (btn: HTMLElement) => host.querySelector<HTMLElement>(`#${btn.dataset.target}`);

        /** 按钮文案与透明度跟随属性现状（开=亮、关=暗） */
        const sync = () => {
            host.querySelectorAll<HTMLElement>(".dm-toggle").forEach((btn) => {
                const card = cardOf(btn);
                if (!card) return;
                const on = btn.dataset.attr
                    ? card.hasAttribute(btn.dataset.attr)
                    : btn.dataset.toggle === "dark"
                        ? card.hasAttribute("dark")
                        : card.hasAttribute("colorized");
                const name = btn.dataset.attr ?? `scope.${btn.dataset.toggle}`;
                btn.textContent = `${name}: ${on ? "开" : "关"}`;
                btn.style.opacity = on ? "1" : "0.55";
            });
        };

        // 事件委托：手动通道直接翻转属性；JS 通道走作用域 setter（与手动通道同元素叠加）
        const onClick = (e: Event) => {
            const btn = (e.target as HTMLElement).closest<HTMLElement>(".dm-toggle");
            if (!btn || !host.contains(btn)) return;
            const card = cardOf(btn);
            if (!card) return;
            if (btn.dataset.attr) {
                card.toggleAttribute(btn.dataset.attr);
            } else if (btn.dataset.scope) {
                const scope = btn.dataset.scope === "mixA" ? mixA : mixB;
                if (!scope) return;
                if (btn.dataset.toggle === "dark") {
                    scope.dark = !card.hasAttribute("dark");
                } else {
                    scope.colorized = !card.hasAttribute("colorized");
                }
            }
            sync();
        };

        host.addEventListener("click", onClick);
        sync();

        return () => {
            host.removeEventListener("click", onClick);
            themeManager.removeScope("mixA");
            themeManager.removeScope("mixB");
            themeManager.removeScope("guardA");
        };
    },
} satisfies StoryModule;
