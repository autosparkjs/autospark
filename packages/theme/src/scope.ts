/**
 *
 *
 *  区域主题
 *
 *
 *  const scope = ThemeManager.scope()
 *
 *
 *
 */
import { presetThemes } from "./presets";
import type { DynamicThemeOptions, ThemeOptions, ThemeSize } from "./types";
import { getId, toRGBString } from "./utils";
import {
    DEFAULT_STORAGE_KEY,
    readScopeParams,
    removeRestoreTag,
    writeScopeParamsJson,
    type PersistParams,
} from "./persistence";
import { generateThemeColorVars } from "./utils/generateThemeColorVars";
import { getVarsStyles } from "./utils/getVarsStyles";
import { injectStylesheet } from "./utils/injectStylesheet";
import { toVarStyles } from "./utils/toVarStyles";
import {
    baseVars,
    radiusVars,
    derivedVars,
    darkDerivedVars,
    shadowVars,
    darkShadowVars,
    spacingVars,
    sizeVars,
    lightColorVars,
    lightColorizedColorVars,
    darkColorVars,
    darkColorizedColorVars,
} from "./vars";

/**
 * 判断值是否可解析为颜色字面量（#hex / rgb() / 命名色经 toRGBString 规范为 hex）。
 * var() 引用等返回 false，用于豁免语义色梯度化。
 */
const isColorLiteral = (value: string): boolean => {
    const normalized = toRGBString(value.trim());
    return /^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(normalized);
};
export class ThemeScope {
    options: Required<ThemeOptions>;
    private _selectors: string[] = [];
    stylesheets: string[] = []; //
    connected: boolean = false;
    elements: WeakRef<HTMLElement>[] = [];
    /**
     * 快照协调器（ADR-0003）：由 ThemeManager 构造后注入，负责把本 scope 的 CSS
     * 合成进全局样式快照；独立使用的 scope 为 null（仅参数持久化，无样式快照）。
     */
    coordinator: { persistStyles(scope: ThemeScope): void } | null = null;
    /** 已注入样式内容缓存（styleId → css）：内容未变跳过重解析；也是样式快照的数据源（不查 DOM） */
    private _cssMap = new Map<string, string>();
    /** 上次持久化的参数 JSON：值未变跳过 localStorage 写入 */
    private _lastParamsJson: string | null = null;
    constructor(options?: ThemeOptions) {
        this.options = Object.assign(
            {
                id: getId(),
                themeColor: "blue",
                cssSelector: [],
                size: "medium",
                dark: false,
                colorized: false,
                radius: "medium",
                spacing: "medium",
                shadow: "medium",
                border: "1px",
                primary: "var(--auto-theme-color)",
                success: "#22c55e",
                warning: "#f59e0b",
                danger: "#ef4444",
                info: "#71717a",
                autoConnect: true,
                autoAttach: true,
                persistence: true,
                storageKey: DEFAULT_STORAGE_KEY,
                docRoot: globalThis.document ? document?.documentElement : undefined,
            },
            options,
        ) as Required<ThemeOptions>;
        this._selectors = this.options.cssSelector;
        if (this.options.cssSelector && this.options.cssSelector.length === 0) {
            this.options.cssSelector.push(`[data-theme-scope='${this.id}']`);
        }
        if (this.options.autoConnect) this.connect();
        if (this.options.autoAttach) this.autoAttach();
    }
    get id() {
        return this.options.id;
    }
    /** 是否参与持久化（默认 true，显式传 false 退出：不读写 localStorage，照常渲染） */
    get persistence() {
        return this.options.persistence !== false;
    }
    /** 本 scope 已注入的 CSS 片段（样式快照合成数据源，供 coordinator 读取） */
    get cssChunks(): string[] {
        return [...this._cssMap.values()];
    }
    get docRoot() {
        return this.options.docRoot as HTMLElement;
    }
    get size() {
        return this.options.size as ThemeSize;
    }
    set size(value: ThemeSize) {
        this.options.size = value;
        if (value === "medium") {
            this._forEachElements((el) => {
                el.removeAttribute("data-size");
            });
        } else {
            this._forEachElements((el) => {
                el.dataset.size = value;
            });
        }
        this._persistParams();
    }
    get dark() {
        return this.options.dark;
    }
    set dark(value: boolean) {
        this.options.dark = value;
        if (value === false) {
            this._forEachElements((el) => {
                el.removeAttribute("dark");
            });
        } else {
            this._forEachElements((el) => {
                el.setAttribute("dark", "");
            });
        }
        this._persistParams();
    }
    get spacing(): ThemeSize {
        return this.options.spacing;
    }
    set spacing(value: ThemeSize) {
        this.options.spacing = value;
        if (value === "medium") {
            this._forEachElements((el) => {
                el.removeAttribute("data-spacing");
            });
        } else {
            this._forEachElements((el) => {
                el.dataset.spacing = value;
            });
        }
        this._persistParams();
    }
    get shadow() {
        return this.options.shadow as ThemeSize;
    }
    set shadow(value: ThemeSize) {
        this.options.shadow = value;
        if (value === "medium") {
            this._forEachElements((el) => {
                el.removeAttribute("data-shadow");
            });
        } else {
            this._forEachElements((el) => {
                el.dataset.shadow = value;
            });
        }
        this._persistParams();
    }
    get colorized() {
        return this.options.colorized;
    }
    set colorized(value: boolean) {
        this.options.colorized = value;
        if (value === false) {
            this._forEachElements((el) => {
                el.removeAttribute("colorized");
            });
        } else {
            this._forEachElements((el) => {
                el.setAttribute("colorized", "");
            });
        }
        this._persistParams();
    }
    get radius(): ThemeSize {
        return (this.options.radius || "medium") as ThemeSize;
    }
    set radius(value: ThemeSize) {
        this.options.radius = value;
        if (value === "medium") {
            this._forEachElements((el) => {
                el.removeAttribute("data-radius");
            });
        } else {
            this._forEachElements((el) => {
                el.dataset.radius = value;
            });
        }
        this._persistParams();
    }
    get themeColor(): string {
        return this.options.themeColor || "light";
    }
    set themeColor(value: string) {
        if (value === "light") {
            this._forEachElements((el) => {
                el.removeAttribute("data-theme");
            });
        } else {
            this._forEachElements((el) => {
                el.dataset.theme =
                    value in presetThemes ? presetThemes[value].color : toRGBString(value);
            });
        }
        this.options.themeColor = value;
        this.update({ themeColor: value });
    }
    private _forEachElements(callback: (el: HTMLElement) => void) {
        this.elements.forEach((elRef) => {
            const el = elRef.deref();
            if (el) {
                callback(el);
            }
        });
        // 清除已失效的元素引用
        this.elements = this.elements.filter((elRef) => elRef.deref());
    }
    /**
     * 生成主题颜色的CSS样式字符串
     * @returns {string} 包含主题颜色变量的CSS样式字符串，支持亮色和暗色模式
     */
    protected _generateThemeColorStyles() {
        const themeColor = this.options.themeColor;
        const selectors = this._selectors.join(",");
        // 主题标尺规则不依赖 DOM 上的 data-theme 属性：scope 实例一域一色、样式表按固定
        // id replace 更新，实例 options.themeColor 即唯一主题源。此前 dark 反转块要求
        // [data-theme] 属性命中，而挂载链路（attach/autoAttach/connect）不写该属性，
        // 局部作用域 dark+colorized 时继承全局未反转标尺导致标尺映射整体反向。
        return `${selectors}{\n    color-scheme: light;\n${toVarStyles(this._createThemeColorVars(themeColor))};\n}\n${selectors}[dark]{\n    color-scheme: dark;\n${toVarStyles(this._createThemeColorVars(themeColor, true))};\n}`;
    }

    protected _injectThemeColorStyles() {
        if (this.options.themeColor === "light") return;
        const css = this._generateThemeColorStyles();
        const styleId: string = `autospark-${this.id}-colors`;
        this._writeStylesheet(styleId, css);
        this._addStyleheetId(styleId);
        return css;
    }
    /**
     * 创建语义化颜色样式并注入到页面中
     * @param {boolean} [inject=true] - 是否立即将样式注入到页面
     * @returns {string|undefined} 生成的CSS样式字符串，如果未覆盖默认颜色则返回undefined
     * @private
     */
    protected _injectSemanticColorStyles() {
        const styleId = `autospark-${this.id}-semantics`;
        const css = this._generateSemanticColorStyles();
        if (css) {
            this._writeStylesheet(styleId, css);
            this._addStyleheetId(styleId);
        }
        return css;
    }
    /**
     * 创建语义化颜色样式并注入到页面中
     * @returns {string|undefined} 生成的CSS样式字符串，如果未覆盖默认颜色则返回undefined
     * @private
     */
    /**
     * 生成语义化颜色样式。
     *
     * 语义色作为梯度种子统一生成 10 阶标尺（--x-color-{name}-0..9，0 最浅 9 最深，
     * 与 palette.less 色系惯例同向）：light 直引种子原值（行为与固定 hex 时代零差异），
     * dark 提亮引用第 3 档——深底上语义色需提亮而非变暗（ADR-0002）。
     *
     * var() 引用等不可解析为颜色字面量的种子豁免梯度化，直接注入原值且无 dark 覆盖
     * （primary 默认值 var(--auto-theme-color) 即此情形，其 dark 适配由 theme 标尺
     * 提档承担）。
     */
    protected _generateSemanticColorStyles() {
        const semanticColors: Record<string, string> = {
            primary: this.options.primary,
            success: this.options.success,
            warning: this.options.warning,
            danger: this.options.danger,
            info: this.options.info,
        };
        const selectors = this._selectors.join(",");
        const scaleBlocks: string[] = [];
        const lightVars: Record<string, string> = {};
        const darkVars: Record<string, string> = {};

        for (const [name, value] of Object.entries(semanticColors)) {
            if (!value) continue;
            if (isColorLiteral(value)) {
                const scale = generateThemeColorVars(value, {
                    prefix: `--x-color-${name}-`,
                    seedLightnessGap: this.options.seedLightnessGap,
                    chromaBoostCap: this.options.chromaBoostCap,
                });
                scaleBlocks.push(`${selectors}{\n${toVarStyles(scale)}\n}`);
                lightVars[`--x-color-${name}`] = value;
                darkVars[`--x-color-${name}`] = `var(--x-color-${name}-3)!important`;
            } else {
                lightVars[`--x-color-${name}`] = value;
            }
        }
        if (!Object.keys(lightVars).length) return;

        return [
            ...scaleBlocks,
            `${selectors}{\n${toVarStyles(lightVars)}\n}`,
            `${selectors}[dark]{\n${toVarStyles(darkVars)}\n}`,
        ].join("\n");
    }

    /**
     * 生成主题颜色相关的CSS变量
     * @param {string} [color=this.themeColor] - 主题颜色值，可以是预设主题名或自定义颜色值
     * @param {boolean} [reverse=false] - 是否反转渐变颜色顺序
     * @returns {Record<string, string>} 包含主题颜色CSS变量的对象
     */
    protected _createThemeColorVars(
        color: string = this.options.themeColor,
        reverse: boolean = false,
    ) {
        const themeColor = color in presetThemes ? presetThemes[color].color : color;
        const vars: Record<string, string> = generateThemeColorVars(themeColor, {
            prefix: "--x-color-theme-",
            reverse,
            seedLightnessGap: this.options.seedLightnessGap,
            chromaBoostCap: this.options.chromaBoostCap,
        });
        return vars;
    }
    protected _addStyleheetId(id: string) {
        if (!this.stylesheets.includes(id)) {
            this.stylesheets.push(id);
        }
    }
    protected _generateBaseStyles() {
        const baseStyles = `${this._selectors.join(",")}{\n${toVarStyles(baseVars)}\n${toVarStyles(lightColorVars)}\n${toVarStyles(derivedVars)}}\n`;
        const sizeStyles = getVarsStyles(sizeVars, this._selectors, "data-size");
        const radiusStyles = getVarsStyles(radiusVars, this._selectors, "data-radius");
        const spacingStyles = getVarsStyles(spacingVars, this._selectors, "data-spacing");
        const shadowStyles = getVarsStyles(shadowVars, this._selectors, "data-shadow");

        // color-scheme：原生控件（滚动条/表单）随暗色换肤；与 _generateThemeColorStyles
        // 中的声明重复无害，且此处覆盖 themeColor="light" + dark 的缺口
        const darkStyles = `${this._selectors.join(",")}[dark]{\n    color-scheme: dark;\n${toVarStyles(darkColorVars)}\n}\n`;
        // 暗色阴影：覆盖 baseStyles 中的 --x-shadow-* 基值（尺寸切换走 --auto-shadow 引用，自动生效）
        const darkShadowStyles = `${this._selectors.join(",")}[dark]{\n${toVarStyles(darkShadowVars)}\n}\n`;
        const lightColorizedStyles = `${this._selectors.join(",")}[colorized]{\n${toVarStyles(lightColorizedColorVars)}\n}\n`;
        const darkColorizedStyles = `${this._selectors.join(",")}[dark][colorized]{\n${toVarStyles(darkColorizedColorVars)}\n}\n`;
        const derivedStyles = `${this._selectors.join(",")}{\n${toVarStyles(derivedVars)}}\n`;
        // 暗色派生：置于 derivedStyles 之后以覆盖同名变量（同特异性下后者胜出）
        const darkDerivedStyles = `${this._selectors.join(",")}[dark]{\n${toVarStyles(darkDerivedVars)}\n}\n`;

        return `${baseStyles}\n${darkStyles}\n${darkShadowStyles}\n${lightColorizedStyles}\n${darkColorizedStyles}\n${sizeStyles}\n${radiusStyles}\n${spacingStyles}\n${shadowStyles}\n${derivedStyles}\n${darkDerivedStyles}`;
    }

    /**
     * 注入主题基础样式到页面中
     * @param {boolean} [inject=true] - 是否立即将样式注入到页面中
     * @returns {string} 生成的CSS样式字符串
     * @private
     */
    private _injectBaseStyles() {
        const styleId = `autospark-${this.id}-vars`;
        const css = this._generateBaseStyles();
        this._writeStylesheet(styleId, css);
        this._addStyleheetId(styleId);
        return css;
    }
    /**
     * 注入样式（内容去重版，ADR-0003）：与缓存相同则跳过重解析与快照重写——
     * 取色器拖动的 @input 逐像素触发与 MutationObserver 回环在此收敛为
     * 「值真变才写一次」。代价：外部移除 style 标签后同内容重注入不会重建
     * 标签（disconnect 清缓存兜底重连场景）。
     */
    private _writeStylesheet(styleId: string, css: string) {
        if (this._cssMap.get(styleId) === css) return;
        injectStylesheet(css, { id: styleId });
        this._cssMap.set(styleId, css);
        if (this.persistence) this.coordinator?.persistStyles(this);
    }
    private _collectParams(): PersistParams {
        return {
            themeColor: this.options.themeColor,
            dark: this.options.dark,
            colorized: this.options.colorized,
            size: this.options.size,
            radius: this.options.radius,
            spacing: this.options.spacing,
            shadow: this.options.shadow,
        };
    }
    /** 持久化当前参数（ADR-0003）：序列化后与上次相同则跳过写 IO */
    protected _persistParams() {
        if (!this.persistence) return;
        const json = JSON.stringify(this._collectParams());
        if (json === this._lastParamsJson) return;
        this._lastParamsJson = json;
        writeScopeParamsJson(this.options.storageKey, this.id, json);
    }
    /** 读取参数快照水合 options；返回是否存在水合数据 */
    private _hydrateParams(): boolean {
        if (!this.persistence) return false;
        const params = readScopeParams(this.options.storageKey, this.id);
        if (params) {
            if (params.themeColor !== undefined)
                this.options.themeColor = params.themeColor;
            if (params.dark !== undefined) this.options.dark = params.dark;
            if (params.colorized !== undefined) this.options.colorized = params.colorized;
            if (params.size !== undefined) this.options.size = params.size as ThemeSize;
            if (params.radius !== undefined)
                this.options.radius = params.radius as ThemeSize;
            if (params.spacing !== undefined)
                this.options.spacing = params.spacing as ThemeSize;
            if (params.shadow !== undefined)
                this.options.shadow = params.shadow as ThemeSize;
        }
        // 以水合结果预填去重基线：connect 尾部 _persistParams 与存储一致时零写 IO
        this._lastParamsJson = JSON.stringify(this._collectParams());
        return params != null;
    }
    /**
     * 将水合后的参数同步为 DOM 属性（与各 setter 的属性语义一致：medium 移除、
     * false 移除）。水合发生在 connect 早期（先于注入，防二次闪烁），当时元素
     * 尚未 attach、setter 走不到目标元素，故由此统一补齐。
     */
    private _syncPersistedAttrs() {
        this._forEachElements((el) => {
            if (this.options.dark) el.setAttribute("dark", "");
            else el.removeAttribute("dark");
            if (this.options.colorized) el.setAttribute("colorized", "");
            else el.removeAttribute("colorized");
            if (this.options.themeColor && this.options.themeColor !== "light") {
                el.dataset.theme =
                    this.options.themeColor in presetThemes
                        ? presetThemes[this.options.themeColor].color
                        : toRGBString(this.options.themeColor);
            }
            for (const [attr, value] of [
                ["size", this.options.size],
                ["radius", this.options.radius],
                ["spacing", this.options.spacing],
                ["shadow", this.options.shadow],
            ] as const) {
                if (value === "medium") el.removeAttribute(`data-${attr}`);
                else el.dataset[attr] = value;
            }
        });
    }
    /**
     * 更新主题
     */
    update(options: Partial<DynamicThemeOptions>) {
        const { themeColor } = options;
        // 调色板参数：主题标尺与语义标尺共用生成参数，需同时重注入（in 判断以支持传 undefined 重置为默认）
        const paletteTuned =
            "seedLightnessGap" in options || "chromaBoostCap" in options;
        if (themeColor) {
            this.options.themeColor =
                themeColor in presetThemes
                    ? presetThemes[themeColor].color
                    : toRGBString(themeColor);
            this._injectThemeColorStyles();
        } else if (paletteTuned) {
            Object.assign(this.options, options);
            this._injectThemeColorStyles();
            this._injectSemanticColorStyles();
        } else if (
            options.primary ||
            options.success ||
            options.warning ||
            options.danger ||
            options.info
        ) {
            Object.assign(this.options, options);
            this._injectSemanticColorStyles();
        }
        // themeColor 属参数持久化范围；语义色/调色板参数变化时 JSON 不变，去重自然跳过
        this._persistParams();
    }
    connect() {
        if (this.connected) return;
        // 先水合参数再注入（ADR-0003）：注入值即恢复值，避免
        // 「恢复主题→默认主题→恢复主题」的二次闪烁
        const hydrated = this._hydrateParams();
        this._injectBaseStyles();
        this._injectThemeColorStyles();
        this._injectSemanticColorStyles();
        this._applyToElements();
        this.connected = true;
        // 水合值不经 setter（元素未 attach），DOM 属性在此补齐；首访无水合零开销
        if (hydrated) this._syncPersistedAttrs();
        // 运行时接管：移除恢复片段的快照标签（root 是 manager 下首个 connect 的 scope）；
        // docRoot 守卫覆盖 SSR 直接导入（无 DOM）场景
        if (this.id === "root" && this.docRoot?.ownerDocument) {
            removeRestoreTag(this.docRoot.ownerDocument);
        }
        this._persistParams();
    }
    /**
     * 将主题样式应用到匹配选择器的所有元素
     * @private
     * @throws {TypeError} 如果元素不是HTMLElement实例
     */
    private _applyToElements() {
        const selectors = this.options.elements || [];
        selectors.forEach((selector) => {
            const els = this.docRoot.querySelectorAll(selector);
            for (let i = 0; i < els.length; i++) {
                const el = els[i];
                if (el && el instanceof HTMLElement) this.attach(el);
            }
        });
    }
    disconnect() {
        this.stylesheets.forEach((id) => {
            const style = document.getElementById(id);
            if (style) {
                style.remove();
            }
        });
        // 清空内容缓存：标签已被移除，重连时若缓存命中会跳过注入导致样式缺失
        this._cssMap.clear();
        this.connected = false;
    }
    isConnected() {
        const styleIds: string[] = [
            `autospark-${this.id}-vars`,
            `autospark-${this.id}-semantics`,
            `autospark-${this.id}-colors`,
            `autospark-${this.id}-mode`,
        ];
        return styleIds.some((id) => this.docRoot.ownerDocument.getElementById(id) !== null);
    }
    /**
     * 生成所有需要注入的css样式
     */
    toStyles() {
        return `${this._generateBaseStyles()}${this._generateSemanticColorStyles()}${this._generateThemeColorStyles()}`;
    }
    download() {
        // 创建 Blob 对象
        const blob = new Blob([this.toStyles()], { type: "text/plain" });
        // 创建临时 URL
        const url = URL.createObjectURL(blob);
        // 创建隐藏的下载链接
        const a = document.createElement("a");
        a.href = url;
        a.download = `autoaprkd_${this.id}.css`;
        a.style.display = "none";
        // 添加到文档并触发点击
        document.body.appendChild(a);
        a.click();
        // 清理资源
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    autoAttach() {
        const scopeEls = this.docRoot.querySelectorAll(`[data-theme-scope='${this.id}']`);
        for (const el of scopeEls) {
            if (!(el instanceof HTMLElement)) continue;
            this.attach(el);
        }
    }
    /**
     * 将主题作用域应用到指定的DOM元素上
     * @param {string | HTMLElement} selector - CSS选择器字符串或HTMLElement元素
     */
    attach(selector: string | HTMLElement) {
        const els = typeof selector === "string" ? document.querySelectorAll(selector) : [selector];
        for (const el of els) {
            if (el && el instanceof HTMLElement) {
                if (el !== document.documentElement) {
                    el.setAttribute("data-theme-scope", this.id);
                }
                if (
                    this.elements.length === 0 ||
                    !this.elements.every((elRef) => elRef.deref() === el)
                ) {
                    this.elements.push(new WeakRef(el));
                }
            }
        }
    }
    /**
     * 从主题作用域中分离指定的元素
     * @param {string|HTMLElement} selector - CSS选择器字符串或HTMLElement元素
     * @returns {void}
     */
    detach(selector: string | HTMLElement) {
        const els = typeof selector === "string" ? document.querySelectorAll(selector) : [selector];
        for (const el of els) {
            if (el && el instanceof HTMLElement) {
                el.removeAttribute("data-theme-scope");
                this.elements = this.elements.filter((ref) => ref.deref() !== el);
            }
        }
    }
    generate() {
        return `${this._generateBaseStyles()}\n/* colors */\n ${this._generateThemeColorStyles()}\n/*  Semantic Colors */\n${this._generateSemanticColorStyles()}`;
    }
}
