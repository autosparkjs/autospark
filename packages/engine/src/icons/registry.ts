/**
 * 全局图标注册表（ADR-0046 决策 2/8/10、ADR-0047 决策 5）。
 *
 * `IconRegistry extends Set`：`AutoSpark.icons` 静态暴露的 document 级单例，多 engine 共享
 * （注入的样式表天然 document 级，engine 实例隔离是假隔离）。遍历产出**名称字符串**
 * （SVG 数据不外露）；`add(name, svg)` 双参注册（显式扩展 Set 契约——单值无法携带 SVG）；
 * 移除仅 `delete`（无 remove 别名，严守 Set 契约），删除不存在的名称静默返回 false。
 * `engine.destroy()` 不清理本表与样式表（对齐基类 dispose 不移除 document 级共享资源先例）。
 *
 * 变更通知（ADR-0046 决策 9）：add/delete 广播给监听器——未命中实例唤醒补渲染、
 * 使用中实例回退默认图标。
 *
 * 样式下发（ADR-0046 决策 6）：`<style id="autospark-icons">` 惰性建表（`typeof document`
 * 守卫，SSR 安全），任一变更后脏标记全量重生成——基础 `.as-icon` 规则 + 每图标两条规则
 * （`:root` 变量按默认 strokeWidth 生成 + `.as-icon.<名>` mask 引用）。
 */
import {
    canonicalizeSvg,
    iconDataUrl,
    invalidateIconDataUrls,
    normalizeStrokeWidth,
    fetchRemoteIcon,
    DEFAULT_ICON_STROKE_WIDTH,
    ICON_NAME_RE,
    REMOTE_ICON_RE,
} from "./factory";
import { persistEnabled, setPersistEnabled } from "./persist";

/** 图标样式表 id（document 级共享） */
const ICON_STYLE_ID = "autospark-icons";
/** 基础类名（保留名，禁作图标名——类体系的名字空间前缀） */
export const ICON_BASE_CLASS = "as-icon";
/** badge 修饰类名（保留名——`badge` 选项挂类承载，规则常驻基础样式表） */
export const ICON_BADGE_CLASS = "as-icon-badge";
/** button 修饰类名（保留名——`button` 选项挂类承载，规则常驻基础样式表，ADR-0049） */
export const ICON_BUTTON_CLASS = "as-icon-button";
/** 保留名集合（ADR-0046 决策 10） */
const RESERVED_NAMES = new Set([ICON_BASE_CLASS, ICON_BADGE_CLASS, ICON_BUTTON_CLASS]);

export type IconChangeAction = "add" | "delete" | "options";
export type IconChangeListener = (name: string, action: IconChangeAction) => void;

/** 图标渲染选项（全局默认配置 `AutoSpark.icons.options` 的形态） */
export interface IconOptions {
    strokeWidth?: number | string;
    size?: number | string;
    color?: string;
    padding?: number | string;
    /**
     * 修饰：图标底板——比 currentColor 淡的圆角矩形背景（伪元素通道，独立于 mask）。
     * 标量三形态（形态即启用）：true 开关（板 padding 走「显式 padding 选项 > 默认 0.3em」）、
     * number 板 padding（→ px，须 ≥ 0）、string 板 padding（CSS 值直传，空串按 true）。
     */
    badge?: boolean | number | string;
    /** 修饰：图标按钮——hover/press 交互动效（载体动效型，隐含 pointer，ADR-0049） */
    button?: boolean;
    /** 修饰：手型光标（`cursor: pointer`，可点击语义） */
    pointer?: boolean;
}

function warn(msg: string): void {
    console.warn(`[autospark/icons] ${msg}`);
}

export class IconRegistry extends Set<string> {
    /** 远程图标协议基址：URL 约定 `baseUrl/<图标集>/<图标名>.svg`，默认 Iconify 公共 API，任何兼容服务可自托管（ADR-0047 决策 5） */
    baseUrl = "https://api.iconify.design";
    private _options: IconOptions = {};
    /**
     * 全局图标默认配置（ADR-0046 配置链的第三级）：指令选项（`x-icon-options`）> 宿主选项
     * （`x-options`）> **本配置** > 内置默认（1em / sw 1.25）。`strokeWidth` 参与规则烘焙
     * （全局默认 sw 直接烘进 `:root` 变量与远程规则，实例仅在指令级覆盖时才内联）。
     * **整体赋值**（`icons.options = {...}`）重建样式表并广播重渲染已渲染实例；深修改
     * （`icons.options.size = 48`）不广播，仅影响后续渲染——主题切换请整体赋值。
     */
    get options(): IconOptions {
        return this._options;
    }
    set options(v: IconOptions) {
        this._options = v && typeof v === "object" ? v : {};
        iconStyleDirty = true;
        refreshIconStyle();
        for (const fn of this.listeners) fn("", "options");
    }

    /**
     * 持久缓存开关（ADR-0048）：true（默认）时远程图标经 localStorage 跨会话复用
     * （二次访问零网络同步渲染）；false 或环境不可用（SSR / 隐私模式）静默退回内存缓存。
     */
    get persist(): boolean {
        return persistEnabled();
    }
    set persist(v: boolean) {
        setPersistEnabled(v);
    }

    /**
     * 图标预取（ADR-0048 决策 6）：提前取回远程图标（走限流、落内存与持久缓存、失败静默）。
     * 持久缓存只救二次访问，首次使用的等待只能靠提前量（下一屏 / 悬停目标的闲时预热）。
     * 非远程形态的值静默忽略。
     */
    prefetch(names: string | string[]): void {
        const list = Array.isArray(names) ? names : [names];
        for (const raw of list) {
            const key = String(raw).trim();
            if (REMOTE_ICON_RE.test(key)) {
                void fetchRemoteIcon(key, this.baseUrl).catch(() => {});
            }
        }
    }
    /** name → 规范形 SVG（内部存储，不外露） */
    private svgs = new Map<string, string>();
    /** 同名覆盖 warn 去重（按 name——动态区域幂等重注册不刷屏，ADR-0046 决策 10） */
    private overrideWarned = new Set<string>();
    /** 变更监听器 */
    private listeners = new Set<IconChangeListener>();

    /**
     * 注册图标（扩展 Set 契约的双参形态）。校验失败（非法名/保留名/无 svg）warn + 拒绝；
     * 同名覆盖 + warn 按 name 去重（覆盖是特性，静默会吞拼写错误）。
     */
    override add(name: string, svg: string): this {
        if (typeof name !== "string" || !ICON_NAME_RE.test(name) || RESERVED_NAMES.has(name)) {
            warn(
                `图标名 "${name}" 非法（须为 CSS ident：[A-Za-z0-9_-] 且非数字开头）或为保留名（${ICON_BASE_CLASS}），已拒绝注册（ADR-0046 决策 10）`,
            );
            return this;
        }
        if (typeof svg !== "string" || !svg.includes("<svg")) {
            warn(`图标 "${name}" 的 SVG 数据无效（未找到 <svg>），已拒绝注册`);
            return this;
        }
        if (this.svgs.has(name) && !this.overrideWarned.has(name)) {
            this.overrideWarned.add(name);
            warn(`图标 "${name}" 重复定义，后者覆盖前者（ADR-0046 决策 3）`);
        }
        // 同名覆盖：失效该名的 data URL 缓存（缓存键不含 SVG 内容，不失效则引用旧图）
        if (this.svgs.has(name)) invalidateIconDataUrls(name);
        this.svgs.set(name, canonicalizeSvg(svg));
        super.add(name);
        this._changed(name, "add");
        return this;
    }

    /** 移除图标（Set 契约：不存在的名称静默返回 false）；使用中实例经变更通知回退默认图标 */
    override delete(name: string): boolean {
        if (typeof name !== "string" || !super.delete(name)) return false;
        this.svgs.delete(name);
        this.overrideWarned.delete(name);
        this._changed(name, "delete");
        return true;
    }

    /** 取规范形 SVG（渲染期注入生效 strokeWidth 用）；不存在返回 undefined */
    getSvg(name: string): string | undefined {
        return this.svgs.get(name);
    }

    /** 订阅注册表变更（未命中唤醒 / 删除联动）；返回退订函数 */
    onChange(listener: IconChangeListener): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    /** 变更出口：标记样式脏 + 重建 + 广播监听器 */
    private _changed(name: string, action: IconChangeAction): void {
        iconStyleDirty = true;
        refreshIconStyle();
        for (const fn of this.listeners) fn(name, action);
    }
}

// ── 样式下发（ADR-0046 决策 6）──────────────────────────────────────────────

let iconStyleEl: HTMLStyleElement | null = null;
let iconStyleDirty = true;

/**
 * 基础 .as-icon 规则：尺寸默认 1em、颜色主权（background-color:currentColor）、mask 三件套。
 * 排版免疫（显式 width/height 已天然免疫 grid/flex 的 stretch——其只作用于 auto 尺寸）：
 * - `box-sizing:content-box`：免疫全局 `*{border-box}` reset——padding 选项语义恒定为
 *   「图形区（size）之外加内边距」，总占位 = size + 2×padding，不因页面 reset 而分叉；
 * - `flex:none`：flex 容器内不伸不缩——flex-shrink 默认 1 且空内容 min-width:auto=0，
 *   行内挤压时会被压缩变形。
 */
const BASE_RULE =
    `.${ICON_BASE_CLASS}{display:inline-block;box-sizing:content-box;flex:none;aspect-ratio:1;` +
    "width:1em;height:1em;background-color:currentColor;vertical-align:-.125em;" +
    "-webkit-mask-size:contain;mask-size:contain;" +
    "-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;" +
    "-webkit-mask-position:center;mask-position:center}";

/**
 * badge 修饰规则（`badge` 选项，常驻基础样式表）：比 currentColor 淡的圆角矩形背景板。
 * 走**包裹层通道**——宿主 mask 裁剪整个元素渲染（含伪元素/阴影，实测伪元素板不可见），
 * 板必须由**不受该 mask 影响的独立盒**承载：指令为 badge 实例包裹一层同类名 wrapper，
 * wrapper 自身做板（圆角 + 淡色背景），图标子元素完整渲染。板色 `color-mix(currentColor 5%)`
 * 跟随文字色级联（wrapper 无色、继承宿主上下文 color）；`inline-flex` 包裹宿主
 * （含 padding 的总占位），`border-radius:25%` 圆角矩形。
 * 排版免疫与宿主同构：`flex:none`（flex 项不伸不缩）+ `height:fit-content`（**非 auto**
 * 交叉轴尺寸——`align-items:stretch` 只拉 auto 高度的项；aspect-ratio 在 stretch 下会被
 * 覆盖，不能靠它防拉）+ `aspect-ratio:1`（比例保险，单边显式时按比例补齐）——板恒
 * 正方形、不被容器拉伸。
 */
const BADGE_RULE =
    `.${ICON_BADGE_CLASS}{display:inline-flex;flex:none;aspect-ratio:1;height:fit-content;border-radius:25%;` +
    "background:color-mix(in srgb,currentColor 5%,transparent)}";

/**
 * button 修饰规则（`button` 选项，常驻基础样式表，ADR-0049 载体动效型）：图标按钮交互态——
 * 动效作用于**既有视觉载体**，不新增视觉结构、不改布局占位。两套规则以基类归属天然互斥
 * （宿主恒有 `as-icon`、wrapper 恒有 `as-icon-badge` 且无 `as-icon`，同名 button 类挂谁
 * 规则就命谁）。触发走纯 CSS `:hover` / `:active`（零事件监听，触屏同样生效）。
 * - 非 badge（载体 = 图形本身）：hover 加深 `brightness(.75)` + press 缩放 `scale(.9)`。
 *   **必须避开 `background-color` 通道**——`color` 选项内联该属性，类规则 hover 打不过
 *   内联样式；加深走 `filter:brightness`（作用在 mask 渲染结果上）。opacity 变淡方案已
 *   否决（demo 观感评审：非 badge 无板时变淡存在感不足）；暗色主题（浅色图形）下
 *   brightness 降对比为已接受取舍（主题化反向动效走同名 CSS 覆盖）。
 * - badge（载体 = 底板）：板色三梯度加深（5% → hover 10% → press 15%）+ press 缩放
 *   wrapper 整体 `scale(.94)`（板与图形一起动，视觉自洽）。
 * pointer 隐含（图标按钮没有不是手型的理由），由类规则承载、不经内联通道（`pointer`
 * 选项保持独立可用）。动效参数内置常量——自定义走同名 CSS 覆盖（对齐 fade/slide
 * 内置动画「同名 CSS 可覆盖」惯例）。
 */
const BUTTON_HOST_RULE =
    `.${ICON_BASE_CLASS}.${ICON_BUTTON_CLASS}{transition:filter .15s ease,transform .15s ease;cursor:pointer}` +
    `.${ICON_BASE_CLASS}.${ICON_BUTTON_CLASS}:hover{filter:brightness(.75)}` +
    `.${ICON_BASE_CLASS}.${ICON_BUTTON_CLASS}:active{transform:scale(.9)}`;
const BUTTON_BADGE_RULE =
    `.${ICON_BADGE_CLASS}.${ICON_BUTTON_CLASS}{transition:background .15s ease,transform .15s ease;cursor:pointer}` +
    `.${ICON_BADGE_CLASS}.${ICON_BUTTON_CLASS}:hover{background:color-mix(in srgb,currentColor 10%,transparent)}` +
    `.${ICON_BADGE_CLASS}.${ICON_BUTTON_CLASS}:active{background:color-mix(in srgb,currentColor 15%,transparent);transform:scale(.94)}`;

/** 全量重生成样式表文本：基础规则 + :root 变量（生效默认 sw = 全局配置 ?? 内置）+ 裸名类规则 */
function buildStyleSheet(): string {
    const rules: string[] = [BASE_RULE, BADGE_RULE, BUTTON_HOST_RULE, BUTTON_BADGE_RULE];
    const vars: string[] = [];
    const classRules: string[] = [];
    const sw = normalizeStrokeWidth(iconRegistry.options?.strokeWidth) ?? DEFAULT_ICON_STROKE_WIDTH;
    for (const name of iconRegistry) {
        const svg = iconRegistry.getSvg(name);
        if (!svg) continue;
        const url = iconDataUrl(name, svg, sw);
        vars.push(`--as-icon-${name}:url("${url}")`);
        classRules.push(
            `.${ICON_BASE_CLASS}.${name}{-webkit-mask-image:var(--as-icon-${name});mask-image:var(--as-icon-${name})}`,
        );
    }
    if (vars.length > 0) rules.push(`:root{${vars.join(";")}}`);
    rules.push(...classRules);
    return rules.join("\n");
}

/**
 * 惰性建表 + 脏标记重生成（幂等；SSR 无 document 守卫）。注册表变更后调用；远程-only
 * 场景由 IconDirective 首渲染调用（无注册表变更也要有基础规则）。
 */
export function refreshIconStyle(): void {
    if (typeof document === "undefined" || !document.head) return;
    if (!iconStyleEl || !iconStyleEl.isConnected) {
        iconStyleEl = document.getElementById(ICON_STYLE_ID) as HTMLStyleElement | null;
        if (!iconStyleEl) {
            iconStyleEl = document.createElement("style");
            iconStyleEl.id = ICON_STYLE_ID;
            document.head.appendChild(iconStyleEl);
        }
        iconStyleDirty = true;
    }
    if (iconStyleDirty) {
        iconStyleEl.textContent = buildStyleSheet();
        iconStyleDirty = false;
    }
}

/** 全局图标注册表单例（`AutoSpark.icons` 静态暴露同一实例） */
export const iconRegistry = new IconRegistry();

// 内置默认图标（ADR-0046 决策 8）：未命中（未注册或已删除）的替换渲染——「缺图不破相」。
// 以条目 default 驻注册表：可被用户同名覆盖自定义；delete("default") 后未命中退回空占位
// （对齐内置动作 yes/no/close 可被同名覆盖的惯例）。
iconRegistry.add(
    "default",
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="5" y="5" width="14" height="14" rx="3"/></svg>',
);
