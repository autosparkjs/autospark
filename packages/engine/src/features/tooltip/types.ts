import { relaxedToJson } from "../../utils/relaxedToJson";

/**
 * 工具提示体系类型（ADR-0061）：`data-tooltip` 属性约定驱动的全局 tooltip。
 *
 * 家族词汇：**工具提示**（tooltip——引擎树内零声明的悬浮提示）/ **浮层**（tip——每引擎
 * 单例的浮层元素）/ **触发元素**（带 `title`/`data-tooltip` 属性并委托命中的元素）。
 */

/**
 * tooltip 配置（ADR-0061 决策 8）：保留键**封闭清单**——字符串/JSON 值形态、
 * `options.tooltip` 全局默认、命令式 `engine.tooltip.show(opts)` 三面同构，
 * 元素级覆盖全局（浅合并，每键独立覆盖）。
 */
export interface TooltipOptions {
    /** 内容（HTML 字符串；经 options.sanitizer 消毒——x-html 同通道）。JSON 形态的内容载体 */
    content?: string;
    /**
     * 弹出方向：floating-ui 12 方向值。**默认 `'top'`**（业界惯例）+ flip 视口翻转兜底；
     * 不支持 `'auto'`（autoPlacement 对小浮层意义有限，与惯例不符——ADR-0061 被否决清单）
     */
    placement?: string;
    /** 透传 offset 中间件（间距；未配置时箭头默认让位 8px——12×12 载体配套露出更大） */
    offset?: any;
    /** 透传 shift 中间件（视口内滑移 padding） */
    shift?: any;
    /** 视口翻转，默认 true */
    flip?: boolean;
    /** 箭头：默认 true（复用菱形伪元素视觉，载体 `autospark-tooltip-arrow`） */
    arrow?: boolean;
    /** 显示延迟 ms（默认 0；悬停后延迟显示，期间移出取消） */
    showDelay?: number;
    /** 隐藏延迟 ms（默认 150；移出后延迟隐藏，期间重新进入触发元素或移入浮层均取消——给鼠标跨越间隙移入浮层的时间，可交互 tooltip） */
    hideDelay?: number;
    /** 附加类名（追加在 `autospark-tooltip` 之后，主题定制通道） */
    className?: string;
    /**
     * 浮层最大宽度（数字 = px，字符串原样透传 CSS；默认 CSS 变量 `70vw`）。
     * 溢出行为：内容先按宽度 wrap，超出 max-height 的部分经 -webkit-line-clamp 截断并显示省略号
     */
    maxWidth?: number | string;
    /** 浮层最大高度（数字 = px，字符串原样透传 CSS；默认 CSS 变量 `70vh`）。溢出经 line-clamp 截断显示省略号 */
    maxHeight?: number | string;
    /** 浮层 1px 边框，默认 true（对齐 overlay border 键先例；颜色经 --autospark-tooltip-border） */
    border?: boolean;
    /** 进出场动画（ADR-0039 三形态；默认 'slide'——方向自适应覆写层见 styles.ts） */
    animate?: any;
}

/** 内置默认（合并链第一层）：placement top + flip、arrow/border 开、延迟 0/80、slide 动画 */
export const TOOLTIP_DEFAULTS: Required<Pick<TooltipOptions, "placement" | "flip" | "arrow" | "border" | "showDelay" | "hideDelay" | "animate">> = {
    placement: "top",
    flip: true,
    arrow: true,
    border: true,
    showDelay: 0,
    hideDelay: 150,
    animate: "slide",
};

/** 保留键封闭清单（ADR-0061 决策 8）：JSON 形态出现清单外键 → warn + 忽略 */
export const TOOLTIP_RESERVED_KEYS: ReadonlySet<string> = new Set([
    "content",
    "placement",
    "offset",
    "shift",
    "flip",
    "arrow",
    "showDelay",
    "hideDelay",
    "className",
    "maxWidth",
    "maxHeight",
    "border",
    "animate",
]);

/** 值解析产物：消毒前的内容 + 配置层（全局默认的覆盖层） */
export interface ParsedTooltipValue {
    content: string;
    options: TooltipOptions;
}

/**
 * 命令式 API 窄面（ADR-0061 决策 18，`engine.tooltip` getter 的返回类型）：
 * 与委托同一显示管道（配置解析/延迟/动画/事件全同构）；`opts` 与元素级保留键同构、
 * 单次生效。`options.tooltip: false` 时调用 warn + no-op。
 */
export interface TooltipAPI {
    /** 命令式显示（`content` 键可无 DOM 属性注入内容） */
    show(el: HTMLElement, opts?: TooltipOptions): void;
    /** 命令式隐藏：立即（不走 hideDelay）；未显示时 no-op */
    hide(): void;
}

/**
 * 解析 `data-tooltip` 属性值（ADR-0061 决策 7，两栖）：
 *
 * - **字符串形态**：整个值为内容（HTML；消毒在消费侧经 sanitizer 统一进行）；
 * - **JSON 形态**（trim 后以 `{` 开头）：relaxed-json 宽松解析（无引号键/单引号/尾逗号，
 *   ADR-0007），`content` 键载内容（缺失 → warn 空内容），其余保留键进配置层，
 *   未知键 warn + 忽略；解析失败 → warn + null（不显示）。
 *
 * @param raw  属性原始值
 * @param warn 告警出口（engine.logger）
 * @returns 解析产物；空值/解析失败返回 null（静默不显示 / warn 不显示）
 */
export function parseTooltipValue(
    raw: string,
    warn: (msg: string) => void,
): ParsedTooltipValue | null {
    const trimmed = raw.trim();
    if (trimmed === "") return null;
    if (!trimmed.startsWith("{")) {
        return { content: raw, options: {} };
    }
    let obj: any;
    try {
        obj = JSON.parse(relaxedToJson(trimmed));
    } catch (e: any) {
        warn(`data-tooltip: JSON 配置解析失败，已忽略: ${e?.message ?? e}`);
        return null;
    }
    if (obj == null || typeof obj !== "object" || Array.isArray(obj)) {
        warn(`data-tooltip: JSON 配置须为对象，已忽略`);
        return null;
    }
    // 未知键 warn（对齐 x-define 未知修饰符先例）——保留键封闭清单的排错面
    for (const key of Object.keys(obj)) {
        if (!TOOLTIP_RESERVED_KEYS.has(key)) {
            warn(`data-tooltip: 未知配置键 "${key}"，已忽略（保留键清单见 ADR-0061 决策 8）`);
        }
    }
    const { content, ...options } = obj;
    if (content == null) {
        warn(`data-tooltip: JSON 配置缺少 content 键（内容载体），无内容可显示`);
        return null;
    }
    return { content: String(content), options };
}

/**
 * 编译期静态 `title` → `data-tooltip` 转换（ADR-0061 决策 4/5，作用于模板 clone——模板只读契约）：
 *
 * - `title` 存在且无 `data-tooltip` → 值转移至 `data-tooltip`；
 * - 两者并存 → `data-tooltip` 优先，仅剥 `title`（原生 tooltip 与自定义浮层同屏双显是 bug）；
 * - 无 `title`（仅 `data-tooltip`，手写约定）→ 原样放行（幂等，双挂点安全）。
 *
 * **绑定形态 `:title` / `x-bind:title` 不在本函数职责内**：`scope.compile()` 从只读模板收集
 * 指令（scope.ts），clone 侧转换拦不住绑定注册——重定向由 `BindDirective.created` 承担
 * （写回落 `data-tooltip`，覆盖全编译通道）。
 *
 * @returns 转换后的 clone（调用方继续子树递归）；无 `title` 时返回原元素（零拷贝放行）
 */
export function convertTooltipTitle(el: HTMLElement): HTMLElement {
    if (!el.hasAttribute("title")) return el;
    const clone = el.cloneNode(false) as HTMLElement;
    const title = clone.getAttribute("title") ?? "";
    clone.removeAttribute("title");
    if (!clone.hasAttribute("data-tooltip")) {
        clone.setAttribute("data-tooltip", title);
    }
    return clone;
}
