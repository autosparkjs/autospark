/**
 * x-badge 徽标指令（ADR-0015）：为宿主元素叠加**内容徽标**——小红点（dot）或数字
 * 角标（count），右上角骑跨定位、白色 1px 分离边、可选常驻脉冲动画（ripple）；
 * 空宿主 + dot 即独立徽标形态（列表状态点用法）。
 *
 * ## 值与选项分工（ADR-0015 决策 3）
 *
 * - 值**专职 count 表达式**（字面量数字 / 状态路径，响应式重求值）；dot 形态值可
 *   省略——红点不依赖数字（`x-badge` 无值恒显、`x-badge="0"` 隐藏，二者正交）；
 * - 选项走 `x-badge-options`（relaxed-json，静态求值一次——设计期配置，改值需重挂）：
 *   `type`（`'dot'` 缺省 / `'count'`）、`overflowCount`（默认 99，`count > overflowCount`
 *   显示 `"99+"`——「超过」即严格大于）、`color`（CSS 颜色值，缺省三级回退链）、
 *   `ripple`（常驻脉冲动画，默认 false）；
 * - 修饰符糖三通道等价（ADR-0007）：`x-badge.count` ≡ `type:'count'`、`x-badge.dot`
 *   ≡ `type:'dot'`、`x-badge.ripple` ≡ `ripple:true`（显式 type 字符串优先于布尔键）。
 *
 * ## 零值隐藏（ADR-0015 决策 4）
 *
 * 值求值为 `0 / null / undefined / false / ''`（含转数字后非有限或 ≤0）→ **不渲染
 * 徽标**（「0 条未读 = 无消息」）；dot 无值时恒显。`showZero` YAGNI 未立项。
 *
 * ## 视觉（ADR-0015 决策 5/6）
 *
 * - 右上角骑跨（`translate(38%,-38%)`），placement 四角 YAGNI；宿主 static 由
 *   `:where()` 类兜底 `position:relative`（特异性 0，宿主自有定位规则可覆盖）；
 * - dot 8px 正圆；count 高 16px / 字号 12px / 水平 padding 4px / `min-width:16px` /
 *   圆角 `999px`——单数字正圆、多位自适应胶囊宽；
 * - 白 1px 分离边走 `box-shadow`（`outline` 属性圆角兼容坑），暗色下仍白（徽标与
 *   宿主内容的分离边，非主题色）；
 * - 徽标元素 `aria-hidden="true"`（纯视觉装饰不进读屏，数字信息由宿主内容传达）。
 *
 * ## ripple 动画（ADR-0015 决策 7，默认关）
 *
 * 参考物是 engine 内置图标 `ripple`（SMIL：中心点呼吸 + 双错相扩散渐隐环）。载体按
 * 形态分派：**dot + ripple** 内联 SMIL SVG 复刻——mark 背景即中心实心点，SVG 只画
 * 两个错相扩散环（r 自 mark 边缘 4 → 11 渐隐，忠实「波环自圆边扩散」几何；`begin:"-1s"`
 * 相位提前——Runtime 动态插入场景下文档时钟已过正 begin 会让两环同相失效）；**count +
 * ripple** 数字 + `::before/::after` 双伪元素 scale 扩散环（不叠 SVG——会遮数字）。
 * `prefers-reduced-motion: reduce` 停播（CSS 环 media query 停；SMIL 环不渲染）。
 *
 * ## 契约（家族对齐 + 独立承载，ADR-0015 决策 1）
 *
 * Runtime 通道（observer 三钩子）+ 值订阅双轨 + 双路径自举——语义对齐装饰动效家族
 * 契约（ADR-0002 决策 3）；但徽标是**常驻内容渲染**（响应式数字文本），与
 * DecorateStrategy 的动效生命周期不同构，控制器独立内聚本模块（照 x-scrollbar 先例，
 * ADR-0013 决策 6），仅复用 decorate 导出面（bootstrap / 数值归一），decorate.ts 零改动。
 *
 * 自举：模块加载即执行 {@link bootstrapBadgePlugin}（decorate 同款双路径注册）。
 */

import {
    bootstrapDecoratePlugin,
    normalizeNumber,
} from "../../utils/decorate";
import { readStorePath } from "../../utils/readStorePath";
import type { AutoSpark, DirectiveSpec } from "autospark";

/** 展示形态：dot 小红点（缺省）/ count 数字胶囊（与 button 插件 type 同词同义） */
export type XBadgeType = "dot" | "count";

/** x-badge-options 配置（静态求值一次，ADR-0015 决策 3） */
export interface XBadgeOptions {
    /** 展示形态（`x-badge.count` / `x-badge.dot` 修饰符同义注入布尔键） */
    type?: XBadgeType | boolean;
    /** 溢出上限，`count > overflowCount` 显示 `"${overflowCount}+"`，默认 99 */
    overflowCount?: number;
    /** 徽标色（任意合法 CSS 颜色值），缺省三级回退链 */
    color?: string;
    /** 常驻脉冲动画（`x-badge.ripple` 修饰符同义注入），默认 false */
    ripple?: boolean;
}

/** 归一后的全量配置（带默认值；count/dot 为修饰符注入的布尔开关键，归一后收敛进 type） */
interface BadgeConfig {
    type: XBadgeType;
    overflowCount: number;
    color: string;
    ripple: boolean;
}

/** 徽标缺省色链：theme 派生令牌 → 插件独立覆盖变量 → 校准字面值（ADR-0129 三级回退） */
const BADGE_COLOR_VAR = "var(--auto-danger-color, var(--autospark-badge-color, #ef4444))";

const DEFAULT_CONFIG: BadgeConfig = {
    type: "dot",
    overflowCount: 99,
    color: BADGE_COLOR_VAR,
    ripple: false,
};

/** 宿主标记类：定位兜底（`:where()` 特异性 0，宿主自有定位规则可覆盖） */
const HOST_CLASS = "x-badge";
/** 徽标本体类（宿主直接子元素，右上角骑跨） */
const MARK_CLASS = "x-badge-mark";
/** 形态类：dot 8px 正圆 / count 数字胶囊 */
const DOT_CLASS = "x-badge-dot";
const COUNT_CLASS = "x-badge-count";
/** 脉冲动画修饰类（dot → SMIL SVG 环；count → 双伪元素 CSS 环） */
const RIPPLE_CLASS = "x-badge-ripple";
/** dot + ripple 的内联 SMIL 扩散环 SVG 类 */
const WAVES_CLASS = "x-badge-waves";

/* ────────────────────────── 样式注入 ────────────────────────── */

/** 静态样式是否已注入（文档级共享，多 engine 安全——内容相同幂等） */
let stylesInjected = false;

/**
 * 注入静态样式（首个指令实例 mounted 时执行一次）：
 *
 * - 宿主标记类 `:where()` position 兜底（ADR-0015 决策 5——static 宿主自动 relative，
 *   fixed/absolute 宿主不动）；CSS 变量默认值同点位声明（无实例变量时的回退面）；
 * - 徽标本体：右上角骑跨 + 白 1px 分离边（box-shadow，决策 6）+ `aria-hidden` 由
 *   JS 挂（属性不属于样式层）；`pointer-events:none` 纯视觉不挡宿主交互；
 * - dot / count 形态类分别落尺寸（决策 6）；count 文字恒白（红底白字的分离边语义，
 *   不随 color 联动）；
 * - ripple：count 双伪元素 scale 扩散环（错相 1s，同源 x-icon ripple 双环几何）；
 *   dot 的 SMIL 环由 SVG 承担（不在 CSS）；
 * - `prefers-reduced-motion: reduce`：CSS 环停播（SMIL 环由 JS 侧不渲染承担）。
 */
function ensureStyles(): void {
    if (stylesInjected || typeof document === "undefined") return;
    stylesInjected = true;
    const style = document.createElement("style");
    style.setAttribute("data-x-badge", "");
    style.textContent = `
:where(.${HOST_CLASS}) { position: relative; }
.${HOST_CLASS} {
  --x-badge-color: var(--auto-danger-color, var(--autospark-badge-color, #ef4444));
}
.${HOST_CLASS} .${MARK_CLASS} {
  position: absolute;
  top: 0;
  right: 0;
  transform: translate(38%, -38%);
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: var(--x-badge-color, var(--auto-danger-color, var(--autospark-badge-color, #ef4444)));
  color: var(--x-badge-color, var(--auto-danger-color, var(--autospark-badge-color, #ef4444)));
  box-shadow: 0 0 0 1px var(--autospark-badge-outline, #fff);
  pointer-events: none;
  white-space: nowrap;
  z-index: 1;
}
/* dot：8px 正圆（对齐 decorate badge 载体惯例尺寸；color 通道留给 SVG currentColor 染色） */
.${HOST_CLASS} .${MARK_CLASS}.${DOT_CLASS} {
  width: 8px;
  height: 8px;
  padding: 0;
}
/* count：数字胶囊——高 16 / 字号 12 / 水平 padding 4 / min-width 16（单数字正圆、多位自适应） */
.${HOST_CLASS} .${MARK_CLASS}.${COUNT_CLASS} {
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  font-size: 12px;
  line-height: 1;
  font-weight: 600;
  color: #fff;
}
/* dot + ripple：SMIL 扩散环 SVG——mark 背景即中心点，环自圆边（viewBox r=4）向外扩散 */
.${HOST_CLASS} .${WAVES_CLASS} {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 24px;
  height: 24px;
  transform: translate(-50%, -50%);
  overflow: visible;
  pointer-events: none;
}
/* count + ripple：双伪元素 scale 扩散环（错相 1s，同源 x-icon ripple 双环几何） */
.${HOST_CLASS} .${MARK_CLASS}.${RIPPLE_CLASS}::before,
.${HOST_CLASS} .${MARK_CLASS}.${RIPPLE_CLASS}::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 999px;
  border: 1px solid var(--x-badge-color, var(--auto-danger-color, var(--autospark-badge-color, #ef4444)));
  animation: x-badge-pulse 2s ease-out infinite;
}
.${HOST_CLASS} .${MARK_CLASS}.${RIPPLE_CLASS}::after {
  animation-delay: 1s;
}
@keyframes x-badge-pulse {
  from {
    transform: scale(1);
    opacity: 0.7;
  }
  to {
    transform: scale(1.9);
    opacity: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .${HOST_CLASS} .${MARK_CLASS}.${RIPPLE_CLASS}::before,
  .${HOST_CLASS} .${MARK_CLASS}.${RIPPLE_CLASS}::after {
    animation: none;
  }
}`;
    document.head.appendChild(style);
}

/* ────────────────────────── 配置归一 ────────────────────────── */

/**
 * 归一 options：宽松策略（家族同款——配置错误不致命，warn 回退不中断渲染）。
 * 形态取值优先级：显式 `type` 字符串 > 修饰符注入的布尔开关键（count/dot）> 默认 dot
 * （ADR-0007「modifier 不覆盖显式 options 已写的键」的归一层延伸——糖让位于显式声明）。
 */
function normalizeConfig(
    raw: Record<string, any> | undefined,
    warn: (msg: string) => void,
): BadgeConfig {
    const cfg: BadgeConfig = { ...DEFAULT_CONFIG };
    if (!raw) return cfg;

    if (raw.type !== undefined) {
        if (raw.type === "dot" || raw.type === "count") cfg.type = raw.type;
        else if (raw.type !== true && raw.type !== false)
            warn(`x-badge: type 须为 'dot' | 'count'，已回退默认 '${DEFAULT_CONFIG.type}'`);
    }
    // 修饰符布尔键（.count/.dot）——仅显式 type 缺失或本身是布尔时参与
    const switchKey = raw.count === true ? "count" : raw.dot === true ? "dot" : null;
    if (switchKey && (raw.type === undefined || typeof raw.type === "boolean")) cfg.type = switchKey;

    const overflow = normalizeNumber(raw, "overflowCount", warn, "x-badge");
    if (overflow !== undefined) {
        const floored = Math.floor(overflow); // 先取整再校验（0.5 floor 后 0 须拦截）
        if (floored > 0) cfg.overflowCount = floored;
        else warn(`x-badge: overflowCount 须为正数，已回退默认 ${DEFAULT_CONFIG.overflowCount}`);
    }

    if (raw.ripple !== undefined) {
        if (typeof raw.ripple === "boolean") cfg.ripple = raw.ripple;
        else warn(`x-badge: ripple 须为布尔值，已忽略`);
    }

    if (raw.color !== undefined) {
        if (typeof raw.color === "string" && raw.color.trim() !== "") cfg.color = raw.color;
        else warn(`x-badge: color 须为非空字符串，已回退默认色`);
    }
    return cfg;
}

/* ────────────────────────── 控制器 ────────────────────────── */

/** 宿主 scope 最小结构契约（鸭子类型，零 engine 类型依赖——decorate 同款） */
interface BadgeScope {
    watch(expr: string, cb: (payload: { value: any }) => void): any;
}

/** 全局 store fallback watcher 的最小 off 契约（decorate 同款） */
interface BadgeWatcher {
    off?: () => void;
}

/**
 * 徽标控制器（独立承载，ADR-0015 决策 1）：内容渲染与值订阅全内聚本模块——与装饰
 * 动效家族共享契约语义（Runtime 三钩子 / 订阅双轨），不共享控制器实现。
 *
 * 与 x-scrollbar 的关键差异：值不是 truthiness 开关而是 **count 数据流**——订阅回调
 * 直接驱动 {@link render}（零值摘徽标 / dot 恒显 / count 更新文本），无 setup/teardown
 * 对称翻转；徽标 DOM 按需建摘（零值即 remove，宿主干净）。
 */
export class BadgeDirective {
    engine: AutoSpark<any>;
    info: Record<string, any>;
    el: HTMLElement;

    /** 原始指令值（表达式字符串；无值 undefined = dot 恒显 / count 无数字不渲染） */
    value: string | undefined;
    /** 归一后的全量配置 */
    config: BadgeConfig;

    /** 存活标记：unmounted 后值订阅回调短路（scope.watch 无句柄，真 off 留给 scope.destroy） */
    private alive = true;
    /** 徽标本体（挂宿主末尾；render 零值时 remove + 置空） */
    private mark: HTMLElement | null = null;
    /** 无 scope fallback（engine.store.watch）的 watcher 句柄——unmounted 自行 off */
    private valueOff: (() => void) | null = null;
    /** reduced-motion 只读一次（SMIL 环不渲染的判据；动态响应变化 YAGNI） */
    private reducedMotion =
        typeof matchMedia === "function" &&
        matchMedia("(prefers-reduced-motion: reduce)").matches;

    constructor(engine: AutoSpark<any>, info: Record<string, any>) {
        this.engine = engine;
        this.info = info;
        this.value = info?.value;
        this.config = normalizeConfig(info?.options, (msg) => this.warn(msg));
    }

    /** 指令级 warn 快捷方法（对齐基类纪律） */
    private warn(msg: string): void {
        this.engine.logger.warn(msg);
    }

    /**
     * observer 通道入口（dispatcher mount 时调用）：样式注入 + 实例变量 + 值订阅
     * （初始值立即驱动 render）。
     */
    mounted(): void {
        if (!this.el) return;
        ensureStyles();
        this.el.classList.add(HOST_CLASS);
        this.applyVars();
        this.bindValue();
    }

    /** observer 卸载（元素移除 / engine.destroy）：摘徽标与宿主类 + 值订阅 off + 熄活 */
    unmounted(): void {
        this.unmountMark();
        this.el?.classList.remove(HOST_CLASS);
        this.alive = false;
        this.valueOff?.();
        this.valueOff = null;
    }

    /** 属性值变化：仅重建值订阅（options 静态求值一次，家族契约） */
    attrChanged(newVal: string): void {
        this.value = newVal === "" ? undefined : newVal;
        this.valueOff?.();
        this.valueOff = null;
        this.bindValue();
    }

    /**
     * 值订阅（对齐家族契约 ADR-0002 决策 3，实现内联——生命周期不同构不共享控制器）：
     * 宿主 scope 命中走 scope.watch（相对表达式可用），无 scope 回退 engine.store.watch
     * （绝对路径，句柄自行 off）；纯数字字面量不订阅（无常量路径可 watch，直读）。
     * 无值 = dot 恒显 / count 无数字不渲染（render(undefined) 自分流）。
     */
    private bindValue(): void {
        if (this.value == null) {
            this.render(undefined);
            return;
        }
        if (/^\d+$/.test(this.value.trim())) {
            this.render(Number(this.value));
            return;
        }
        const expr = this.value;
        const listener = ({ value }: { value: any }) => {
            if (this.alive) this.render(value);
        };
        const scope = this.engine.findScopeByEl(this.el) as BadgeScope | undefined;
        if (scope && typeof scope.watch === "function") {
            const initial = scope.watch(expr, listener);
            this.render(initial);
        } else {
            const watcher = (this.engine as any).store.watch(expr, listener) as BadgeWatcher;
            this.valueOff = () => watcher?.off?.();
            this.render(readStorePath(this.engine, expr));
        }
    }

    /**
     * 渲染分发（ADR-0015 决策 4——零值规则的唯一裁决点）：
     *
     * - dot：无值/空串恒显（红点不依赖数字）；有值则转数字判定（非有限或 ≤0 摘除，
     *   即 `x-badge="0"` 隐藏）；数字本身被忽略（dot 形态不显示数字）；
     * - count：值缺失或转数字非有限/≤0 → 摘除；否则挂载并写溢出格式化文本
     *   （`n > overflowCount` → `"${overflowCount}+"`，严格大于）。
     */
    private render(value: unknown): void {
        const n = Number(value);
        const zero = value == null || value === "" || value === false || !Number.isFinite(n) || n <= 0;
        if (zero) {
            // dot 无值恒显的例外：value 为 null/undefined 且无值声明（非表达式求值得空）
            if (this.config.type === "dot" && this.value == null) this.mountMark();
            else this.unmountMark();
            return;
        }
        if (this.config.type === "dot") {
            this.mountMark();
            return;
        }
        this.mountMark();
        const { overflowCount } = this.config;
        this.mark!.textContent = n > overflowCount ? `${overflowCount}+` : String(n);
    }

    /**
     * 挂载徽标本体（幂等）：形态/动画类一次成型（options 静态求值一次），dot + ripple
     * 且未 reduced-motion 时内联 SMIL 扩散环 SVG（环自圆边扩散、双环错相 `begin:"-1s"`
     * ——Runtime 动态插入场景文档时钟已过正 begin 会让两环同相，负相位恒错相）。
     */
    private mountMark(): void {
        if (this.mark) return; // 已挂守卫
        const { type, ripple } = this.config;
        const mark = document.createElement("span");
        mark.className = `${MARK_CLASS} ${type === "count" ? COUNT_CLASS : DOT_CLASS}`;
        mark.setAttribute("aria-hidden", "true");
        if (ripple) mark.classList.add(RIPPLE_CLASS);
        if (type === "dot" && ripple && !this.reducedMotion) {
            mark.insertAdjacentHTML("afterbegin", buildWavesSvg());
        }
        this.el.appendChild(mark);
        this.mark = mark;
    }

    /** 摘除徽标本体（零值 / unmounted 共用；宿主类保留——指令仍在宿主上声明着） */
    private unmountMark(): void {
        this.mark?.remove();
        this.mark = null;
    }

    /** 实例级 CSS 变量落位（宿主 style 上；overflowCount 是 JS 格式化值不进 CSS） */
    private applyVars(): void {
        this.el.style.setProperty("--x-badge-color", this.config.color);
    }
}

/**
 * dot + ripple 的 SMIL 扩散环 SVG（ADR-0015 决策 7）：复刻 engine 内置图标 `ripple`
 * 的双错相扩散渐隐环几何（r 2→11 / fill-opacity 0.3→0 / 次环 begin 1s），适配到
 * 8px 中心点场景——mark 背景即中心实心点，环起点 r=4（8px 圆在 24 viewBox 中的
 * 边缘）忠实「波环自圆边扩散」；`currentColor` 染色（mark 的 color 通道）。
 */
function buildWavesSvg(): string {
    const circle = (begin: string) =>
        `<circle cx="12" cy="12" r="4" fill="currentColor" fill-opacity="0.35">` +
        `<animate attributeName="r" values="4;11" dur="2s" begin="${begin}" repeatCount="indefinite" />` +
        `<animate attributeName="fill-opacity" values="0.35;0" dur="2s" begin="${begin}" repeatCount="indefinite" />` +
        `</circle>`;
    return (
        `<svg class="${WAVES_CLASS}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">` +
        circle("0s") +
        circle("-1s") +
        `</svg>`
    );
}

/* ──────────────── 插件自举（对齐 decorate 双路径注册，ADR-0015 决策 1） ──────────────── */

/** spec 基类实例 → 控制器挂靠表（spec 钩子委托的桥；实例随基类实例 GC 回收） */
const controllers = new WeakMap<object, BadgeDirective>();

/** spec 钩子的 this 契约面（engine/info/el，与基类实例一致） */
interface SpecThis {
    engine: AutoSpark<any>;
    el: HTMLElement;
    info: Record<string, any>;
}

/**
 * 指令 spec 构造（`AutoSpark.directive(spec)` spec 重载）：Runtime 通道（observer 的
 * mounted/unmounted/attrChanged 与宿主动态插入的内容渲染天然同构——动态插入 DOM 即
 * 生效、改属性即重绑值，「同时支持运行时」的本体）+ 三钩子委托控制器。
 */
function createBadgeSpec(): DirectiveSpec {
    function mounted(this: SpecThis): void {
        if (!this.el) return;
        const controller = new BadgeDirective(this.engine, this.info);
        controller.el = this.el;
        controllers.set(this, controller);
        controller.mounted();
    }
    function unmounted(this: object): void {
        const controller = controllers.get(this);
        controllers.delete(this);
        controller?.unmounted();
    }
    function attrChanged(this: object, newVal: string): void {
        controllers.get(this)?.attrChanged(newVal);
    }
    return {
        name: "badge",
        kind: 1, // Runtime（observer 通道）
        priority: 0,
        mounted: mounted as DirectiveSpec["mounted"],
        unmounted: unmounted as DirectiveSpec["unmounted"],
        attrChanged: attrChanged as DirectiveSpec["attrChanged"],
    };
}

/**
 * 双路径注册（模块加载期执行一次，decorate 同款单点收敛）：
 * AutoSpark 已存在 → 直接入安装器队列；否则推 `__AUTOSPARK_PLUGINS__` 预加载队列，
 * 首个 engine 构造开头 drain。两路径殊途同归 `AutoSpark.directive(spec)`。
 */
export function bootstrapBadgePlugin(): void {
    bootstrapDecoratePlugin(createBadgeSpec());
}

// 模块加载即自举（对称 x-ripple / x-scrollbar：置于模块尾部）
bootstrapBadgePlugin();
