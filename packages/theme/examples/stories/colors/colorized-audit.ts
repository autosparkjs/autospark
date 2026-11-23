import { LitElement, html, type TemplateResult } from "lit";
import { repeat } from "lit/directives/repeat.js";
import type { StoryModule } from "../story";
import {
    auditMatrix,
    auditSummary,
    contrast,
    flatten,
    hex,
    hue,
    hueDelta,
    lstar,
    parseColor,
    relLum,
    toHsl,
    type AuditRow,
    type Metric,
    type RGBA,
} from "../../colorized-audit.data";

type Severity = "阻断" | "高" | "中" | "低";

const SEVERITY_CLASS: Record<Severity, string> = {
    阻断: "ca-sev-block",
    高: "ca-sev-high",
    中: "ca-sev-mid",
    低: "ca-sev-low",
};

const cssColor = (c: RGBA) =>
    `rgba(${Math.round(c[0] * 255)}, ${Math.round(c[1] * 255)}, ${Math.round(c[2] * 255)}, ${c[3]})`;

const ratio = (n: number) => `${n.toFixed(2)}:1`;

/** 审核页：把评估清单做成可现场切换主题/模式的完整示例。 */
class ColorizedAudit extends LitElement {
    static properties = {
        onlyFail: { type: Boolean },
        modeFilter: { type: String },
    };

    onlyFail = false;
    modeFilter = "all";

    private _mo?: MutationObserver;
    private _raf = 0;
    private _probe?: HTMLSpanElement;

    /** 渲染到 light DOM：复用全局 .auto-card / .auto-input 等组件样式 */
    createRenderRoot() {
        return this;
    }

    connectedCallback() {
        // 探针必须先于首次 render 存在（render 内同步读取 CSS 变量）
        this._probe = document.createElement("span");
        this._probe.style.cssText =
            "position:absolute;width:0;height:0;overflow:hidden;pointer-events:none;";
        document.body.appendChild(this._probe);

        super.connectedCallback();

        this._mo = new MutationObserver(() => this._schedule());
        this._mo.observe(document.documentElement, {
            attributes: true,
            attributeFilter: [
                "dark",
                "colorized",
                "data-theme",
                "data-dark",
                "data-colorized",
                "data-light",
                "data-uncolored",
                "data-theme-scope",
            ],
        });
        // 运行时换色会改写 head 中的注入样式文本
        this._mo.observe(document.head, { childList: true, subtree: true, characterData: true });
    }

    disconnectedCallback() {
        this._mo?.disconnect();
        this._mo = undefined;
        if (this._raf) cancelAnimationFrame(this._raf);
        this._raf = 0;
        this._probe?.remove();
        this._probe = undefined;
        super.disconnectedCallback();
    }

    private _schedule() {
        if (this._raf) return;
        this._raf = requestAnimationFrame(() => {
            this._raf = 0;
            this.requestUpdate();
        });
    }

    /** 通过探针读取当前 CSS 变量链的最终颜色（含 color-mix 与 var 替换） */
    private _read(name: string): RGBA {
        if (!this._probe) return [0, 0, 0, 1];
        this._probe.style.color = `var(${name})`;
        try {
            return parseColor(getComputedStyle(this._probe).color);
        } catch {
            return [0, 0, 0, 1];
        }
    }

    private _cssValue(name: string) {
        return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    }

    private _badge(pass: boolean, text: string) {
        return html`<span class="ca-badge ${pass ? "ca-badge-pass" : "ca-badge-fail"}">${text}</span>`;
    }

    private _info(text: string) {
        return html`<span class="ca-badge ca-badge-info">${text}</span>`;
    }

    private _swatch(label: string, color: RGBA, sub?: string) {
        return html`
            <div class="ca-swatch">
                <div class="ca-swatch-chip" style="background:${cssColor(color)}"></div>
                <div class="ca-swatch-label">${label}</div>
                <div class="ca-swatch-sub">${hex(color)}${sub ? ` · ${sub}` : ""}</div>
            </div>
        `;
    }

    private _issue(
        no: number,
        title: string,
        severity: Severity,
        desc: TemplateResult,
        evidence: TemplateResult,
    ) {
        return html`
            <div class="auto-card ca-issue">
                <div class="auto-card-header ca-issue-head">
                    <span class="ca-issue-no">${no}</span>
                    <span class="ca-issue-title">${title}</span>
                    <span class="ca-sev ${SEVERITY_CLASS[severity]}">${severity}</span>
                </div>
                <div class="auto-card-body ca-issue-body">
                    <p class="ca-desc">${desc}</p>
                    ${evidence}
                </div>
            </div>
        `;
    }

    private _metricCells(row: AuditRow) {
        return row.metrics.map(
            (m: Metric) => html`
                <td
                    class=${m.pass ? "ca-pass" : "ca-fail"}
                    title="${m.label}：${ratio(m.ratio)}（门槛 ${m.min}:1）"
                >
                    ${m.ratio.toFixed(2)}
                </td>
            `,
        );
    }

    render() {
        const dark = document.documentElement.hasAttribute("dark");
        const colorized = document.documentElement.hasAttribute("colorized");
        const mode = dark ? "dark" : "light";
        const themeColor = document.documentElement.dataset.theme ?? "light";

        const panel = this._read("--auto-bgcolor");
        const workspace = this._read("--auto-workspace-bgcolor");
        const text = this._read("--auto-color");
        const accent = this._read("--auto-theme-color");
        const panelL = lstar(panel);
        const workspaceL = lstar(workspace);
        const workspaceHsl = toHsl(workspace);
        // HSL 的 s 在浅色上天然偏高（如 #E6F4FF 也接近 100%），
        // 用 chroma = s·(1-|2l-1|) 更接近“肉眼看到的彩度”
        const workspaceChroma =
            (workspaceHsl.s / 100) * (1 - Math.abs((2 * workspaceHsl.l) / 100 - 1)) * 100;

        const inputBg = this._read("--auto-input-bgcolor");
        const placeholder = this._read("--auto-input-placeholder");
        const inputRatio = contrast(text, inputBg, inputBg);
        const placeholderRatio = contrast(placeholder, inputBg, inputBg);

        const selectedText = this._read("--auto-selected-color");
        const selectedBg = flatten(this._read("--auto-selected-bgcolor"), panel);
        const selectedRatio = contrast(selectedText, selectedBg, selectedBg);

        const border = this._read("--auto-border-color");
        const borderRatio = contrast(border, panel, panel);
        const borderWorkspaceRatio = contrast(border, workspace, workspace);
        const panelWorkspaceRatio = contrast(panel, workspace, workspace);

        const palette = Array.from({ length: 10 }, (_, i) => this._read(`--x-color-theme-${i}`));
        const paletteHues = palette.map((c) => hue(c));
        let maxHueDelta = 0;
        for (let i = 0; i < paletteHues.length; i++) {
            for (let j = i + 1; j < paletteHues.length; j++) {
                maxHueDelta = Math.max(maxHueDelta, hueDelta(paletteHues[i], paletteHues[j]));
            }
        }

        const semantic = (
            [
                ["success", "--x-color-success"],
                ["warning", "--x-color-warning"],
                ["danger", "--x-color-danger"],
                ["info", "--x-color-info"],
            ] as const
        ).map(([name, varName]) => {
            const color = this._read(varName);
            return { name, color, delta: hueDelta(hue(color), hue(text)) };
        });
        const minSemanticDelta = Math.min(...semantic.map((s) => s.delta));

        const accentRatio = contrast(accent, panel, panel);
        const sameAsText = hex(text) === hex(accent);

        const shadowValue = this._cssValue("--x-shadow-medium");
        const warmTheme = hue(accent) >= 20 && hue(accent) <= 70;

        const rows = auditMatrix.filter(
            (r) =>
                (!this.onlyFail || r.metrics.some((m) => !m.pass)) &&
                (this.modeFilter === "all" || r.mode === this.modeFilter),
        );
        const metricDefs = auditMatrix[0].metrics;

        const chain =
            mode === "light"
                ? [
                      ["--auto-color", "--x-color-1 → --x-tinted-color-1 → --x-color-theme-8"],
                      ["--auto-bgcolor", "--x-bgcolor-0 → --x-tinted-bgcolor-0 → --x-color-theme-0"],
                      [
                          "--auto-workspace-bgcolor",
                          "--x-bgcolor-1 → --x-tinted-bgcolor-1 → --x-color-theme-1",
                      ],
                      ["--auto-input-bgcolor", "--x-bgcolor-0 → --x-tinted-bgcolor-0 → --x-color-theme-0"],
                      ["--auto-border-color", "--x-color-6 → --x-tinted-color-6 → --x-color-theme-3"],
                      ["--auto-theme-color", "--x-color-theme-8"],
                      ["--auto-selected-color", "--auto-theme-color → --x-color-theme-8"],
                      [
                          "--auto-selected-bgcolor",
                          "color-mix(theme-8, transparent 80%)",
                      ],
                  ]
                : [
                      ["--auto-color", "--x-color-1 → --x-tinted-color-1 → --x-color-theme-8"],
                      ["--auto-bgcolor", "--x-bgcolor-0 → --x-tinted-bgcolor-0 → --x-color-theme-0"],
                      [
                          "--auto-workspace-bgcolor",
                          "--x-bgcolor-1 → --x-tinted-bgcolor-1 → color-mix(theme-0, black 30%)",
                      ],
                      ["--auto-input-bgcolor", "--x-bgcolor-3 → --x-tinted-bgcolor-3 → --x-color-theme-3"],
                      ["--auto-border-color", "color-mix(--auto-panel-bgcolor, white 12%)"],
                      ["--auto-theme-color", "--x-color-theme-5"],
                      ["--auto-selected-color", "--auto-theme-color → --x-color-theme-5"],
                      [
                          "--auto-selected-bgcolor",
                          "color-mix(theme-5, transparent 82%)",
                      ],
                  ];

        return html`
            <style>
                .ca-muted {
                    color: var(--auto-secondary-color);
                }
                .ca-issue-head {
                    gap: 0.5rem;
                    align-items: center;
                }
                /* 全局 .auto-card > .auto-card-header > * 是 flex-grow:1，
                   这里用同权重（0,2,0）覆盖，否则序号圆点会被拉成椭圆 */
                .auto-card.ca-issue > .auto-card-header.ca-issue-head > * {
                    flex-grow: 0;
                }
                .auto-card.ca-issue > .auto-card-header.ca-issue-head > .ca-issue-title {
                    flex: 1 1 auto;
                }
                .ca-issue-no {
                    display: inline-flex;
                    width: 1.5rem;
                    height: 1.5rem;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    background: var(--auto-theme-color);
                    color: var(--auto-bgcolor);
                    font-size: 0.75rem;
                    font-weight: 700;
                    flex-shrink: 0;
                }
                .ca-issue-title {
                    font-weight: 600;
                }
                .ca-sev {
                    margin-left: auto;
                    padding: 0.1rem 0.45rem;
                    border-radius: 9999px;
                    font-size: 0.68rem;
                    line-height: 1.6;
                    flex-shrink: 0;
                }
                .ca-sev-block {
                    background: #cf222e;
                    color: #fff;
                }
                .ca-sev-high {
                    background: #bc4c00;
                    color: #fff;
                }
                .ca-sev-mid {
                    background: #9a6700;
                    color: #fff;
                }
                .ca-sev-low {
                    background: var(--auto-secondary-bgcolor);
                    color: var(--auto-color);
                }
                .ca-issue-body {
                    gap: 0.6rem;
                }
                .ca-desc {
                    margin: 0;
                    font-size: 0.85rem;
                    line-height: 1.6;
                    color: var(--auto-secondary-color);
                }
                .ca-desc code {
                    color: var(--auto-theme-color);
                }
                .ca-badge {
                    display: inline-block;
                    padding: 0.08rem 0.45rem;
                    border-radius: 9999px;
                    font-size: 0.7rem;
                    line-height: 1.7;
                    border: 1px solid transparent;
                }
                .ca-badge-pass {
                    color: #1a7f37;
                    background: rgba(26, 127, 55, 0.1);
                    border-color: rgba(26, 127, 55, 0.3);
                }
                .ca-badge-fail {
                    color: #cf222e;
                    background: rgba(207, 34, 46, 0.1);
                    border-color: rgba(207, 34, 46, 0.3);
                }
                .ca-badge-info {
                    color: var(--auto-secondary-color);
                    background: var(--auto-secondary-bgcolor);
                    border-color: var(--auto-border-color);
                }
                .ca-swatches {
                    display: flex;
                    gap: 0.5rem;
                    flex-wrap: wrap;
                }
                .ca-swatch {
                    min-width: 6.2rem;
                    flex: 1 1 6.2rem;
                    border: var(--auto-border);
                    border-radius: var(--auto-border-radius);
                    overflow: hidden;
                    background: var(--auto-bgcolor);
                }
                .ca-swatch-chip {
                    height: 2.6rem;
                }
                .ca-swatch-label {
                    padding: 0.25rem 0.4rem 0;
                    font-size: 0.72rem;
                    color: var(--auto-color);
                }
                .ca-swatch-sub {
                    padding: 0 0.4rem 0.3rem;
                    font-size: 0.65rem;
                    color: var(--auto-third-color);
                    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
                }
                .ca-kv {
                    font-size: 0.78rem;
                    color: var(--auto-secondary-color);
                    display: flex;
                    gap: 0.4rem;
                    flex-wrap: wrap;
                    align-items: center;
                }
                .ca-form-demo {
                    display: flex;
                    flex-direction: column;
                    gap: 0.4rem;
                    max-width: 28rem;
                }
                .ca-input-meta {
                    font-size: 0.72rem;
                    color: var(--auto-third-color);
                    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
                }
                .ca-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.35rem;
                    max-width: 28rem;
                }
                .ca-list-item {
                    padding: 0.55rem 0.75rem;
                    border: 1px solid transparent;
                    border-radius: var(--auto-border-radius);
                    background: var(--auto-bgcolor);
                    color: var(--auto-color);
                    font-size: 0.85rem;
                }
                .ca-border-demo {
                    padding: 0.8rem 1rem;
                    border-radius: var(--auto-border-radius);
                    font-size: 0.82rem;
                    color: var(--auto-color);
                }
                .ca-surface-stack {
                    padding: 0.9rem;
                    border-radius: var(--auto-border-radius);
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }
                .ca-surface {
                    padding: 0.55rem 0.75rem;
                    border-radius: var(--auto-border-radius);
                    font-size: 0.78rem;
                    color: var(--auto-color);
                    border: var(--auto-border);
                }
                .ca-palette {
                    display: flex;
                    gap: 2px;
                    border-radius: var(--auto-border-radius);
                    overflow: hidden;
                    border: var(--auto-border);
                }
                .ca-palette-chip {
                    flex: 1;
                    min-width: 0;
                    padding: 0.35rem 0.1rem;
                    text-align: center;
                    font-size: 0.68rem;
                    color: #fff;
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.45);
                }
                .ca-palette-chip small {
                    display: block;
                    font-size: 0.6rem;
                    opacity: 0.85;
                }
                .ca-shadow-stage {
                    display: flex;
                    gap: 1rem;
                    padding: 1.2rem;
                    border-radius: var(--auto-border-radius);
                    flex-wrap: wrap;
                }
                .ca-shadow-card {
                    flex: 1 1 10rem;
                    padding: 0.8rem;
                    font-size: 0.78rem;
                    color: var(--auto-color);
                }
                .ca-summary-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
                    gap: 0.75rem;
                }
                .ca-summary-title {
                    font-weight: 600;
                    margin-bottom: 0.35rem;
                    font-size: 0.82rem;
                }
                .ca-summary-row {
                    display: flex;
                    justify-content: space-between;
                    gap: 1rem;
                    padding: 0.16rem 0;
                    font-size: 0.78rem;
                    border-bottom: 1px dashed var(--auto-border-color);
                }
                .ca-summary-row b.ok {
                    color: #1a7f37;
                }
                .ca-summary-row b.warn {
                    color: #cf222e;
                }
                .ca-toolbar {
                    display: flex;
                    gap: 1rem;
                    align-items: center;
                    flex-wrap: wrap;
                    font-size: 0.8rem;
                    color: var(--auto-secondary-color);
                    margin-bottom: 0.6rem;
                }
                .ca-toolbar label {
                    display: inline-flex;
                    gap: 0.35rem;
                    align-items: center;
                }
                .ca-table-wrap {
                    overflow-x: auto;
                }
                .ca-matrix {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 0.72rem;
                    white-space: nowrap;
                }
                .ca-matrix th,
                .ca-matrix td {
                    padding: 0.3rem 0.38rem;
                    border-bottom: 1px solid var(--auto-border-color);
                    text-align: center;
                }
                .ca-matrix th {
                    position: sticky;
                    top: 0;
                    background: var(--auto-secondary-bgcolor);
                    color: var(--auto-color);
                    font-weight: 600;
                    z-index: 1;
                }
                .ca-matrix td.ca-preset {
                    text-align: left;
                }
                .ca-matrix td.ca-preset code {
                    margin-left: 0.3rem;
                    font-size: 0.65rem;
                    color: var(--auto-third-color);
                }
                .ca-dot {
                    display: inline-block;
                    width: 0.65rem;
                    height: 0.65rem;
                    border-radius: 50%;
                    margin-right: 0.3rem;
                    vertical-align: -0.05rem;
                    border: 1px solid rgba(0, 0, 0, 0.15);
                }
                .ca-matrix td.ca-pass {
                    color: #1a7f37;
                }
                .ca-matrix td.ca-fail {
                    color: #cf222e;
                    font-weight: 700;
                    background: rgba(207, 34, 46, 0.08);
                }
                .ca-chain {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 0.72rem;
                }
                .ca-chain th,
                .ca-chain td {
                    padding: 0.3rem 0.4rem;
                    border-bottom: 1px solid var(--auto-border-color);
                    text-align: left;
                    vertical-align: top;
                }
                .ca-chain th {
                    color: var(--auto-secondary-color);
                    font-weight: 600;
                }
                .ca-chain code {
                    font-size: 0.68rem;
                }
                .ca-link-demo {
                    padding: 0.8rem;
                    border: var(--auto-border);
                    border-radius: var(--auto-border-radius);
                    background: var(--auto-bgcolor);
                    font-size: 0.9rem;
                    line-height: 1.8;
                }
                .ca-link-demo a {
                    color: var(--auto-theme-color);
                    text-decoration: underline;
                    cursor: pointer;
                }
                .ca-note {
                    margin: 0;
                    font-size: 0.78rem;
                    line-height: 1.6;
                    color: var(--auto-third-color);
                }
                .ca-note code {
                    color: var(--auto-secondary-color);
                }
                .story-intro{
                    margin-bottom: 1em;
                }
            </style>
            <div style="display:flex;flex-direction:column;gap:1em">
            <div class="auto-card story-intro">
                <div class="story-intro-title">特性说明：多彩模式（colorized）配色审核</div>
                <p>
                    本页把评估清单落成可现场复核的示例：右侧切换
                    <strong>主题色 / 暗色模式 / 多彩模式</strong>，下方实时区块读取当前
                    CSS 变量；矩阵表一次性覆盖 12 个预设 × light/dark colorized，口径与
                    <code>scripts/contrast-lib.ts</code> 一致。
                </p>
                <ul>
                    <li>
                        实时区块：<code>--auto-*</code> / <code>--x-color-theme-*</code>
                        由探针读取浏览器计算值（含 <code>var()</code> 与
                        <code>color-mix()</code> 解析）
                    </li>
                    <li>
                        矩阵表：离线按同一变量表构建顺序计算，用于发现「blue 通过但
                        gold 失败」这类预设差异
                    </li>
                    <li>
                        门槛：正文/次要/强调/选中/输入文字 ≥ 4.5:1；边框/面板层级 ≥
                        1.2:1（库内基线，WCAG 非文本边界通常要求 3:1）
                    </li>
                </ul>
                <p class="ca-note">
                    当前：主题 <code>${themeColor}</code> · 模式
                    <code>${mode}${colorized ? " + colorized" : ""}</code>
                </p>
            </div>

            <div class="auto-card">
                <div class="auto-card-header">总览：12 个预设的通过数</div>
                <div class="auto-card-body">
                    <div class="ca-summary-grid">
                        ${(["light", "dark"] as const).map((m) => {
                            const list = auditSummary.filter((s) => s.mode === m);
                            return html`
                                <div>
                                    <div class="ca-summary-title">${m} + colorized</div>
                                    ${list.map(
                                        (s) => html`
                                            <div class="ca-summary-row">
                                                <span>${s.label}</span>
                                                <b class=${s.pass === s.total ? "ok" : "warn"}
                                                    >${s.pass}/${s.total}</b
                                                >
                                            </div>
                                        `,
                                    )}
                                </div>
                            `;
                        })}
                    </div>
                    <p class="ca-note" style="margin-top:0.6rem;">
                        关键信号：light 次要文字 <b>0/12</b>、dark 强调色 <b>0/12</b>、dark
                        输入文字 <b>1/12</b>；这三项不是个别预设问题，而是映射结构问题。
                    </p>
                </div>
            </div>

            <div class="auto-card">
                <div class="auto-card-header">清单现场：逐项复核</div>
                <div class="auto-card-body ca-issue-body">
                    <p class="ca-note">
                        以下 9 项与评估清单一一对应；每项先给实时证据，再给判定。切换主题色 /
                        暗色 / 多彩时数字与色块随动。
                    </p>
                </div>
            </div>

            ${this._issue(
                1,
                "暗色多彩不“暗”",
                "阻断",
                html`dark colorized 下 <code>--auto-bgcolor = theme-0</code>。对 blue
                    这类深色种子，theme-0 是深蓝；对 gold/orange，theme-0 仍是高亮面（gold
                    #F76B12，L* 约 62），与主流暗面 L* 6–25 相距很远，暗色语义失效。`,
                html`
                    <div class="ca-swatches">
                        ${this._swatch("工作区", workspace)}
                        ${this._swatch("面板", panel)}
                        ${this._swatch("theme-0", this._read("--x-color-theme-0"))}
                        ${this._swatch("theme-3", this._read("--x-color-theme-3"))}
                        ${this._swatch("正文", text)}
                    </div>
                    <div class="ca-kv">
                        <span>面板 L* ${panelL.toFixed(1)}</span>
                        <span>工作区 L* ${workspaceL.toFixed(1)}</span>
                        ${dark
                            ? this._badge(
                                  panelL <= 35,
                                  panelL <= 35
                                      ? "面板在暗色区间"
                                      : "面板偏亮：暗色语义失效",
                              )
                            : this._info("非暗色模式，不适用")}
                    </div>
                `,
            )}
            ${this._issue(
                2,
                "输入框反层级",
                "阻断",
                html`dark 下 <code>--auto-input-bgcolor = --x-bgcolor-3 = theme-3</code>。
                    theme-3 在暖色种子上是亮黄/亮橙，输入框成为页面上最亮、最饱和的元素；
                    文字压在亮底上只有 1.6–2.9:1，和主流 dark 输入框「略亮于面板、低彩度」
                    的做法相反。`,
                html`
                    <div class="ca-form-demo">
                        <input
                            class="auto-input"
                            placeholder="请输入内容（占位符）"
                            value="输入文字可读性检查"
                        />
                        <div class="ca-input-meta">
                            --auto-input-bgcolor ${hex(inputBg)} · 文字
                            ${ratio(inputRatio)} · 占位符 ${ratio(placeholderRatio)}
                        </div>
                    </div>
                    <div class="ca-kv">
                        ${this._badge(
                            inputRatio >= 4.5,
                            inputRatio >= 4.5 ? "输入文字达 AA" : "输入文字低于 4.5",
                        )}
                        ${this._badge(
                            placeholderRatio >= 3,
                            placeholderRatio >= 3 ? "占位符可辨（≥3）" : "占位符低于 3.0",
                        )}
                        ${this._info("输入底 = theme-3")}
                        ${!dark
                            ? this._info("该项针对 dark 模式，请切到暗色复核")
                            : ""}
                    </div>
                `,
            )}
            ${this._issue(
                3,
                "选中态同色叠加",
                "高",
                html`<code>--auto-selected-color = --auto-theme-color</code>，
                    <code>--auto-selected-bgcolor</code> 又是同一颜色的 18%–20% 透明。
                    品牌色文字 + 品牌色底，选中文字对比度被自己压低；主流做法是「低彩度 tint
                    底 + on-surface 文字」。`,
                html`
                    <div class="ca-list">
                        <div class="ca-list-item">普通项</div>
                        <div
                            class="ca-list-item"
                            style="color:var(--auto-selected-color);background:var(--auto-selected-bgcolor);border:var(--auto-selected-border)"
                        >
                            选中项（当前路由）
                        </div>
                        <div
                            class="ca-list-item"
                            style="color:var(--auto-disable-color);cursor:not-allowed;"
                        >
                            禁用项
                        </div>
                    </div>
                    <div class="ca-kv">
                        <span>选中底 ${hex(selectedBg)}</span>
                        ${this._badge(
                            selectedRatio >= 4.5,
                            selectedRatio >= 4.5
                                ? "选中文字达 AA"
                                : `选中文字 ${ratio(selectedRatio)}，低于 4.5`,
                        )}
                    </div>
                `,
            )}
            ${this._issue(
                4,
                "边框在亮彩面板上失效",
                "高",
                html`dark 边框由面板混白 12% 派生：深蓝面板有效（约 1.33），gold
                    面板只有约 1.13，低于设计自己定的 1.2；light 边框取
                    <code>theme-3</code>，在 gold/lime 工作区上也只有 1.2 左右。`,
                html`
                    <div class="ca-border-demo" style="border:var(--auto-border)">
                        border: var(--auto-border) · ${hex(border)}
                    </div>
                    <div class="ca-kv">
                        ${this._badge(
                            borderRatio >= 1.2,
                            `边框/面板 ${ratio(borderRatio)}（基线 1.2）`,
                        )}
                        ${this._badge(
                            borderWorkspaceRatio >= 1.2,
                            `边框/工作区 ${ratio(borderWorkspaceRatio)}`,
                        )}
                        ${this._info("WCAG 非文本边界通常要求 3:1")}
                    </div>
                `,
            )}
            ${this._issue(
                5,
                "亮色工作区是大面积高彩 pastel",
                "中",
                html`light workspace = <code>theme-1</code>。red 是 #FFCCD2、gold 是
                    #FEEAB3，12 个预设实测 chroma 18–29% / L* 81–93；主流 tinted 背景通常在
                    L* 92–96、低彩度（C &lt; 10%）。面板/工作区只有 1.11–1.35，gold/lime
                    下卡片几乎浮不出来。`,
                html`
                    <div
                        class="ca-surface-stack"
                        style="background:var(--auto-workspace-bgcolor)"
                    >
                        <div class="ca-surface" style="background:var(--auto-bgcolor)">
                            panel · ${hex(panel)}
                        </div>
                        <div
                            class="ca-surface"
                            style="background:var(--auto-secondary-bgcolor)"
                        >
                            secondary
                        </div>
                        <div class="ca-surface" style="background:var(--auto-third-bgcolor)">
                            third
                        </div>
                    </div>
                    <div class="ca-kv">
                        <span
                            >workspace C ${workspaceChroma.toFixed(0)}% / L*
                            ${workspaceL.toFixed(0)}</span
                        >
                        ${this._badge(
                            panelWorkspaceRatio >= 1.2,
                            `面板/工作区 ${ratio(panelWorkspaceRatio)}`,
                        )}
                        ${dark
                            ? this._info("该项针对 light 模式，请切到亮色复核")
                            : workspaceChroma > 15
                              ? this._badge(false, "高彩度大面积，偏离主流 tinted 背景")
                              : this._info("当前组合未触发高彩提示")}
                    </div>
                `,
            )}
            ${this._issue(
                6,
                "暖色色阶有 hue drift",
                "中",
                html`Material golden palette 在暖色上会跑 hue：gold 面板 h23 →
                    输入 h40 → 正文 h44，跨 21°；orange h19 → h31 → h35。结果是「金色主题看起来像
                    橙色页面 + 黄色文字」。主流 tonal palette 固定 hue，只调 chroma/lightness。`,
                html`
                    <div class="ca-palette">
                        ${palette.map(
                            (c, i) => html`
                                <div
                                    class="ca-palette-chip"
                                    style="background:${cssColor(c)};color:${relLum(c) > 0.45
                                        ? "#1f2328"
                                        : "#fff"};text-shadow:${relLum(c) > 0.45
                                        ? "none"
                                        : "0 1px 2px rgba(0,0,0,0.45)"}"
                                >
                                    ${i}<small>h${paletteHues[i].toFixed(0)}</small>
                                </div>
                            `,
                        )}
                    </div>
                    <div class="ca-kv">
                        ${this._badge(
                            maxHueDelta <= 12,
                            maxHueDelta <= 12
                                ? `色相漂移 ${maxHueDelta.toFixed(0)}°（可接受）`
                                : `最大色相漂移 ${maxHueDelta.toFixed(0)}°`,
                        )}
                        ${this._info("固定 hue 的 tonal 色阶不会出现该漂移")}
                    </div>
                `,
            )}
            ${this._issue(
                7,
                "语义色撞色",
                "中",
                html`正文被染色后，状态色与品牌色同族：blue 正文 #0067C2 vs info
                    #0969DA；red 正文 #D6001F vs danger #CF222E；green 正文 #008C00 vs
                    success #1A7F37。语义色的「异常/成功/提示」辨识度被稀释。`,
                html`
                    <div class="ca-swatches">
                        ${semantic.map((s) =>
                            this._swatch(s.name, s.color, `Δh ${s.delta.toFixed(0)}°`),
                        )}
                        ${this._swatch("正文", text, `h${hue(text).toFixed(0)}`)}
                    </div>
                    <div class="ca-kv">
                        ${this._badge(
                            minSemanticDelta >= 20,
                            minSemanticDelta >= 20
                                ? "语义色与正文有区分"
                                : `最小色相差 ${minSemanticDelta.toFixed(0)}°，语义色与正文同族`,
                        )}
                        ${this._info("色相差只是信号，明度/彩度也需一起看")}
                    </div>
                `,
            )}
            ${this._issue(
                8,
                "无强调层级 / 强调比正文更难读",
                "高",
                html`light 下 <code>--auto-color</code> 与
                    <code>--auto-theme-color</code> 都是 <code>theme-8</code>，链接和正文同色；
                    dark 下正文取 <code>theme-8</code>、强调取 <code>theme-5</code>，强调色对面板
                    反而更弱（blue 3.24、gold 1.84）。主流：正文近中性，强调色只用于控件/链接。`,
                html`
                    <div class="ca-link-demo">
                        正文示例：<span style="color:var(--auto-color)">道可道，非常道；名可名，非常名。</span><br />
                        链接示例：<a>查看详情（--auto-theme-color）</a>
                    </div>
                    <div class="ca-kv">
                        ${sameAsText
                            ? this._badge(false, "正文与强调同色：没有层级")
                            : this._info("正文与强调不同色")}
                        ${this._badge(
                            accentRatio >= 4.5,
                            `强调/面板 ${ratio(accentRatio)}`,
                        )}
                    </div>
                `,
            )}
            ${this._issue(
                9,
                "阴影色相不匹配",
                "低",
                html`<code>--x-shadow-*</code> 固定使用
                    <code>hsl(240 3.8% 46.1%)</code> 冷灰。放在 gold/orange 的暖彩底上会发灰、发脏；
                    主流通常用黑色低透明度，或随表面色相微调。`,
                html`
                    <div
                        class="ca-shadow-stage"
                        style="background:var(--auto-workspace-bgcolor)"
                    >
                        <div class="auto-card ca-shadow-card">--auto-shadow</div>
                        <div class="auto-card ca-shadow-card">shadow on workspace</div>
                    </div>
                    <div class="ca-kv">
                        ${this._info(`--x-shadow-medium: ${shadowValue || "(未定义)"}`)}
                        ${warmTheme
                            ? this._badge(false, "暖色底 + 冷灰阴影，易发脏")
                            : this._info("当前主题为冷色，阴影色相接近")}
                    </div>
                `,
            )}

            <div class="auto-card">
                <div class="auto-card-header">
                    全预设 × 全模式矩阵（colorized）
                </div>
                <div class="auto-card-body">
                    <div class="ca-toolbar">
                        <label>
                            <input
                                type="checkbox"
                                .checked=${this.onlyFail}
                                @change=${(e: Event) =>
                                    (this.onlyFail = (e.target as HTMLInputElement).checked)}
                            />
                            只看有失败项的行
                        </label>
                        <label>
                            模式
                            <select
                                .value=${this.modeFilter}
                                @change=${(e: Event) =>
                                    (this.modeFilter = (e.target as HTMLSelectElement).value)}
                            >
                                <option value="all">全部</option>
                                <option value="light">light</option>
                                <option value="dark">dark</option>
                            </select>
                        </label>
                        <span class="ca-muted">共 ${rows.length} 行 / ${auditMatrix.length} 行</span>
                    </div>
                    <div class="ca-table-wrap">
                        <table class="ca-matrix">
                            <thead>
                                <tr>
                                    <th>预设</th>
                                    <th>模式</th>
                                    ${metricDefs.map((m) => html`<th>${m.label}</th>`)}
                                    <th>通过</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${repeat(
                                    rows,
                                    (r) => `${r.preset}-${r.mode}`,
                                    (r) => html`
                                        <tr>
                                            <td class="ca-preset">
                                                <span
                                                    class="ca-dot"
                                                    style="background:${r.seed}"
                                                ></span>
                                                ${r.title}<code>${r.preset}</code>
                                            </td>
                                            <td>${r.mode}</td>
                                            ${this._metricCells(r)}
                                            <td
                                                class=${r.passCount === r.metrics.length
                                                    ? "ca-pass"
                                                    : "ca-fail"}
                                            >
                                                ${r.passCount}/${r.metrics.length}
                                            </td>
                                        </tr>
                                    `,
                                )}
                            </tbody>
                        </table>
                    </div>
                    <p class="ca-note" style="margin-top:0.6rem;">
                        表中数值为 WCAG 对比度。绿色 ≥ 门槛，红色 &lt; 门槛；边框与面板层级
                        门槛 1.2（库内基线），其余 4.5。矩阵是浏览器内重算，与
                        <code>scripts/check-dark-contrast.ts</code> 的变量表同序；后者目前只跑
                        blue 且没有 light+colorized 项。
                    </p>
                </div>
            </div>

            <div class="auto-card">
                <div class="auto-card-header">变量溯源（当前模式）</div>
                <div class="auto-card-body">
                    <table class="ca-chain">
                        <thead>
                            <tr>
                                <th>语义变量</th>
                                <th>解析链</th>
                                <th>当前值</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${chain.map(
                                ([name, path]) => html`
                                    <tr>
                                        <td><code>${name}</code></td>
                                        <td><code>${path}</code></td>
                                        <td><code>${hex(this._read(name))}</code></td>
                                    </tr>
                                `,
                            )}
                        </tbody>
                    </table>
                    <p class="ca-note" style="margin-top:0.6rem;">
                        这张表解释「为什么换一个预设就崩」：surface / text / accent 都落在同一条
                        <code>theme-0..9</code> 上，暖色种子没有足够深的暗端，也没有低彩度的
                        on-surface 档。
                    </p>
                </div>
            </div></div>
        `;
    }
}

customElements.define("colorized-audit", ColorizedAudit);

export default {
    title: "多彩模式审核",
    render: () => html`<colorized-audit></colorized-audit>`,
} satisfies StoryModule;
