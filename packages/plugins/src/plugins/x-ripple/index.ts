/**
 * x-ripple 涟漪扩散指令（@autospark/plugins ADR-0007，取代 ADR-0005 伞形模型）：为宿主
 * 元素叠加不改变布局与内容的涟漪扩散动画层——波环自宿主边框循环向外扩散渐隐。
 *
 * ## 形态（`type` 回归形态键，ADR-0007 决策 2）
 *
 * - `ring`：外扩环——硬边环自边框长出渐散（box-shadow spread 扩散，无需感知宿主尺寸、
 *   天然贴合 border-radius、窗口缩放不失效）；
 * - `glow`：边框光晕呼吸——半周期 blur 达到 size（光晕最大）、整周期归零；
 * - `echo`（缺省）：双环回声——主环之外 ::before 载体负延迟错相第二环。
 *
 * ## 三通道等价声明
 *
 * 显式 `type` 键 / 布尔开关键 `{ring:true}` / 点修饰符 `x-ripple.ring` 三通道等价
 * （修饰符经引擎解析期按词表注入布尔开关键，与 options JSON 同一落点）。形态并存取先：
 * 缺省垫底 + 枚举声明序——`glow > ring > echo`。触发器通道（hover/always/click，缺省
 * always，并存 hover > always > click）与本通道镜像对称，修饰符词表分流、次序无关：
 * `x-ripple.glow.click` ≡ `x-ripple.click.glow`。
 *
 * ## 键面（x-ripple-options，静态求值一次——动效参数是设计期配置，改值需重挂宿主）
 *
 * - `color`：波色，缺省跟随主题主色变量（badge 启用时缺省联动语义红）；
 * - `size`：自边框向外扩散的最大距离 px（缺省 12）；
 * - `speed`：单波动画段 ms（缺省 3000）；`gap`：周期末静止段 ms（缺省 0，烘进 keyframes
 *   百分比——动画段占 speed/(speed+gap) 比例，末段保持终态即 gap 静止，单 animation 无缝循环）；
 * - `badge`：徽标（家族通用）——宿主右上角正圆载体，波环自角标圆边扩散；
 * - 跨指令键 warn 忽略（ADR-0007 决策 2）：声明 x-spin 形态词表（rotate/beam/chase）时
 *   警告忽略，不中断渲染。
 *
 * ## echo 双环节奏（ADR-0005 决策 4 修订，2026-10-24 用户定稿「双环一次起波」）
 *
 * - always/hover：第二环负延迟错相位 = -周期/2（一波未平一波又起——双环回声本义）；
 * - click：双环**同时**起波（delay 0——任何非零错位都会呈现第二道波峰，观感即「执行
 *   两遍」），双环区分改走尺寸通道（第二环同心缩小至 0.6×），起波事件严格一个。
 *
 * 值三态、触发器语义、停止语义（播完当前周期再停）、载体策略（伪元素优先/探测降级）、
 * 徽标契约、注册通道与双路径自举——家族共享契约见 src/plugins/decorate（统一承载，
 * 本模块只落形态差异）。
 *
 * 自举：模块加载即执行 {@link bootstrapRipplePlugin}（decorate 的双路径注册）。
 */

import {
    badgeLayerGeometry,
    bootstrapDecoratePlugin,
    collectSwitches,
    createDecorateSpec,
    fullLayerGeometry,
    normalizeBadge,
    normalizeNumber,
    normalizeSpeed,
    normalizeTrigger,
    resolveColor,
    warnCrossWords,
    THEME_COLOR_VAR,
    type DecorateStrategy,
    type DecorateTrigger,
} from "../decorate/index";

/** 涟漪形态：ring 外扩环 / glow 边框光晕呼吸 / echo 双环回声（缺省） */
export type XRippleMode = "ring" | "glow" | "echo";

/** x-ripple-options 配置（静态求值一次，ADR-0002 决策 3 / ADR-0007 决策 2） */
export interface XRippleOptions {
    /** 形态显式键，默认 echo */
    type?: XRippleMode;
    /** 形态布尔开关键 ≡ type（`x-ripple.<mode>` 修饰符同义注入） */
    ring?: boolean;
    /** ≡ type:'glow' */
    glow?: boolean;
    /** ≡ type:'echo' */
    echo?: boolean;
    /** 触发器显式键，默认 always（click = 点击播一个完整周期自动停止，在播中连点忽略） */
    trigger?: DecorateTrigger;
    /** hover 开关 ≡ trigger:'hover'（`x-ripple.hover` 修饰符同义注入） */
    hover?: boolean;
    /** always 开关 ≡ trigger:'always' */
    always?: boolean;
    /** click 开关 ≡ trigger:'click' */
    click?: boolean;
    /** 徽标（家族通用）：true = 宿主右上角 8px 正圆载体 / 正数字 = 自定义直径 px（启用时 color 缺省主题语义红） */
    badge?: boolean | number;
    /** 颜色，缺省跟随主题主色变量（badge 启用时缺省联动语义红） */
    color?: string;
    /** 自边框向外扩散的最大距离 px，默认 12 */
    size?: number;
    /** 单波动画段 ms（周期末静止段 gap 另计），默认 3000 */
    speed?: number;
    /** 周期末静止段 ms（烘进 keyframes 百分比），默认 0 */
    gap?: number;
}

/** 归一后的全量配置（带默认值） */
interface RippleConfig {
    type: XRippleMode;
    trigger: DecorateTrigger;
    /** 徽标直径 px（0 = 未启用） */
    badge: number;
    color: string;
    size: number;
    speed: number;
    gap: number;
}

/** 形态归一优先序：多处声明并存时取先者（缺省垫底 + 枚举声明序——与触发器值序同构） */
const MODE_PRIORITY: readonly XRippleMode[] = ["glow", "ring", "echo"];

/** 形态词表（type 显式键合法值 + 布尔开关键/修饰符词表） */
const MODE_WORDS: readonly XRippleMode[] = ["ring", "glow", "echo"];

/** 跨指令词表：x-spin 形态键（声明时 warn 忽略，ADR-0007 决策 2） */
const CROSS_WORDS: readonly string[] = ["rotate", "beam", "chase"];

const DEFAULT_CONFIG: RippleConfig = {
    type: "echo",
    trigger: "always",
    badge: 0,
    color: THEME_COLOR_VAR,
    size: 12,
    speed: 3000,
    gap: 0,
};

/** 宿主标记类（position 兜底 + CSS 变量默认值；无伪元素定义——伪元素挂在激活类上） */
const HOST_CLASS = "x-ripple";
/** 激活类：伪元素涟漪层定义 + animation 生效开关 */
const ACTIVE_CLASS = "x-ripple-on";
/** echo 双环标记：额外启用 ::before 载体（负延迟错相） */
const ECHO_CLASS = "x-ripple-echo";
/** 降级子元素载体类 */
const LAYER_CLASS = "x-ripple-layer";
/** 徽标宿主标记类：载体定位覆盖为右上角正圆（伪元素与降级子层同几何） */
const BADGE_CLASS = "x-ripple-badge";

/* ────────────────────────── 样式注入 ────────────────────────── */

/** 静态样式是否已注入（文档级共享，多 engine 安全——内容相同幂等） */
let stylesInjected = false;

/** 动态 keyframes 缓存：key = `${type}|${speed}|${gap}` → keyframes 名（参数组合全局去重） */
const keyframesCache = new Map<string, string>();

/** 动态 keyframes 的挂载 <style>（懒建，追加式累积） */
let keyframesStyleEl: HTMLStyleElement | null = null;

/**
 * 注入静态样式（首个指令实例化时执行一次）：
 *
 * - `:where(.x-ripple)`：宿主 position 兜底——特异性 0，宿主自有定位规则（内联/类）可覆盖；
 * - `.x-ripple`：CSS 变量默认值（color 缺省主题主色，消费端可被指令写入的实例变量覆盖）；
 * - `.x-ripple.x-ripple-on::after` / `::before`：伪元素涟漪层基底（inset:0 + 圆角继承 +
 *   穿透指针）与动画；echo 的 `::before` 负延迟错相；
 * - badge 规则：载体几何覆盖为宿主右上角正圆（实底圆点 + 波环自圆边扩散）；
 * - `prefers-reduced-motion: reduce`：系统减弱动效时停播（装饰性动画的可访问性底线）。
 */
function ensureStyles(): void {
    if (stylesInjected || typeof document === "undefined") return;
    stylesInjected = true;
    const style = document.createElement("style");
    style.setAttribute("data-x-ripple", "");
    style.textContent = `
:where(.${HOST_CLASS}) { position: relative; }
.${HOST_CLASS} {
  --x-ripple-color: ${THEME_COLOR_VAR};
  --x-ripple-size: 12px;
  --x-ripple-duration: 3000ms;
  --x-ripple-anim: x-ripple-echo-3000-0;
  --x-ripple-echo-delay: -1500ms;
  --x-ripple-echo-size: 7.2px;
  --x-ripple-badge-size: 8px;
}
.${HOST_CLASS}.${ACTIVE_CLASS}::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  animation: var(--x-ripple-anim) var(--x-ripple-duration) ease-out infinite;
}
.${HOST_CLASS}.${ACTIVE_CLASS}.${ECHO_CLASS}::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  /* click 触发器双环同时起波：第二环同心缩小（--x-ripple-echo-size），与主环同拍收束；
     always/hover 维持负延迟错相位（同尺寸）——第二环尺寸仅在 click 下有别于主环 */
  --x-ripple-size: var(--x-ripple-echo-size);
  animation: var(--x-ripple-anim) var(--x-ripple-duration) ease-out infinite;
  animation-delay: var(--x-ripple-echo-delay);
}
.${HOST_CLASS}.${BADGE_CLASS}.${ACTIVE_CLASS}::after {
  /* badge 徽标形态：载体缩为宿主右上角正圆（圆心恰在角点），实底圆点 + 波环自圆边扩散 */
  inset: auto;
  top: calc(-1 * var(--x-ripple-badge-size) / 2);
  right: calc(-1 * var(--x-ripple-badge-size) / 2);
  width: var(--x-ripple-badge-size);
  height: var(--x-ripple-badge-size);
  border-radius: 50%;
  background: var(--x-ripple-color);
  z-index: 2147483647;
}
.${HOST_CLASS}.${BADGE_CLASS}.${ACTIVE_CLASS}.${ECHO_CLASS}::before {
  /* echo 第二环同 badge 几何（双环同心，仅 delay/spread 通道区分） */
  inset: auto;
  top: calc(-1 * var(--x-ripple-badge-size) / 2);
  right: calc(-1 * var(--x-ripple-badge-size) / 2);
  width: var(--x-ripple-badge-size);
  height: var(--x-ripple-badge-size);
  border-radius: 50%;
  background: var(--x-ripple-color);
  z-index: 2147483647;
}
@media (prefers-reduced-motion: reduce) {
  .${HOST_CLASS}.${ACTIVE_CLASS}::after,
  .${HOST_CLASS}.${ACTIVE_CLASS}.${ECHO_CLASS}::before { animation: none; }
}`;
    document.head.appendChild(style);
}

/**
 * 生成/复用涟漪 keyframes（ADR-0002 决策 4：静止段烘进 keyframes 百分比——
 * 动画段占 speed/(speed+gap) 比例，末段保持终态即 gap 静止，单 animation 无缝循环）。
 *
 * keyframes 语法百分比不支持 var()，参数组合（type/speed/gap）动态生成并全局去重缓存。
 */
function ensureKeyframes(cfg: RippleConfig): string {
    const key = `${cfg.type}|${cfg.speed}|${cfg.gap}`;
    const cached = keyframesCache.get(key);
    if (cached) return cached;

    const name = `x-ripple-${cfg.type}-${cfg.speed}-${cfg.gap}`;
    const period = cfg.speed + cfg.gap;
    const animPct = period > 0 ? Math.round((cfg.speed / period) * 100) : 100;
    let frames: string;
    if (cfg.type === "glow") {
        // 呼吸光晕：半周期 blur 达到 size（光晕最大）、整周期归零，纯 box-shadow 明暗循环
        const peak = Math.round(animPct / 2);
        frames = `
  0% { box-shadow: 0 0 0 0 transparent; }
  ${peak}% { box-shadow: 0 0 var(--x-ripple-size) 0 var(--x-ripple-color); }
  ${animPct}% { box-shadow: 0 0 0 0 transparent; }
  100% { box-shadow: 0 0 0 0 transparent; }`;
    } else {
        // ring / echo：外扩环——spread 自 0（贴边框）扩散至 size，颜色同步渐隐
        frames = `
  0% { box-shadow: 0 0 0 0 var(--x-ripple-color); }
  ${animPct}% { box-shadow: 0 0 0 var(--x-ripple-size) transparent; }
  100% { box-shadow: 0 0 0 var(--x-ripple-size) transparent; }`;
    }

    if (!keyframesStyleEl) {
        keyframesStyleEl = document.createElement("style");
        keyframesStyleEl.setAttribute("data-x-ripple-keyframes", "");
        document.head.appendChild(keyframesStyleEl);
    }
    keyframesStyleEl.textContent += `\n@keyframes ${name} {${frames}\n}`;
    keyframesCache.set(key, name);
    return name;
}

/* ────────────────────────── 配置归一 ────────────────────────── */

/** echo 第二环相位差：always/hover 恒定错相位 = -周期/2；click = 0（双环同时起波） */
function echoDelay(cfg: RippleConfig): number {
    return cfg.trigger === "click" ? 0 : -(cfg.speed + cfg.gap) / 2;
}

/** echo 第二环尺寸：click 下同心缩小至 0.6 倍（一环一次波的双环区分手段）；其余同主环 */
function echoSize(cfg: RippleConfig): number {
    return cfg.trigger === "click" ? Math.round(cfg.size * 0.6 * 10) / 10 : cfg.size;
}

/**
 * 归一 options：枚举/数值校验，非法值 warn 并回退默认（宽松策略——装饰性动画的
 * 配置错误不致命，不中断渲染）。形态三通道（type 显式键 + ring/glow/echo 布尔开关，
 * `x-ripple.<mode>` 修饰符经引擎解析期等价注入）并存按 MODE_PRIORITY 取先；
 * 跨指令键（x-spin 形态词表）warn 忽略（ADR-0007 决策 2）。
 */
function normalizeConfig(raw: Record<string, any> | undefined, warn: (msg: string) => void): RippleConfig {
    const cfg: RippleConfig = { ...DEFAULT_CONFIG };
    if (!raw) return cfg;

    // 形态三通道归一：type 显式键 + 布尔开关键，并存取先（缺省垫底 + 枚举声明序）
    const seen = collectSwitches(raw, MODE_WORDS, warn, "x-ripple");
    if (raw.type !== undefined) {
        if (MODE_WORDS.includes(raw.type)) seen.add(raw.type);
        else warn(`x-ripple: type 取值非法（${JSON.stringify(raw.type)}），已回退 "echo"`);
    }
    const resolvedType = MODE_PRIORITY.find((m) => seen.has(m));
    if (resolvedType) cfg.type = resolvedType;

    // 跨指令键：x-spin 形态词表 warn 忽略
    warnCrossWords(raw, CROSS_WORDS, "x-spin", warn, "x-ripple");

    cfg.trigger = normalizeTrigger(raw, warn, "x-ripple");
    cfg.badge = normalizeBadge(raw, warn, "x-ripple");
    cfg.color = resolveColor(raw.color, cfg.badge, warn, "x-ripple");
    cfg.size = normalizeNumber(raw, "size", warn, "x-ripple") ?? DEFAULT_CONFIG.size;
    cfg.speed = normalizeSpeed(raw, warn, "x-ripple");
    cfg.gap = normalizeNumber(raw, "gap", warn, "x-ripple") ?? 0;
    return cfg;
}

/* ────────────────────────── 策略 ────────────────────────── */

/** x-ripple 差异策略（状态机/载体/触发器/徽标等家族契约由 decorate 统一承载） */
const RIPPLE_STRATEGY: DecorateStrategy<RippleConfig> = {
    hostClass: HOST_CLASS,
    activeClass: ACTIVE_CLASS,
    layerClass: LAYER_CLASS,
    ensureStyles,
    normalize: normalizeConfig,
    hostClasses: (cfg) => (cfg.badge > 0 ? [BADGE_CLASS] : []),
    activeClasses: (cfg) => (cfg.type === "echo" ? [ECHO_CLASS] : []),
    animName: (cfg) => ensureKeyframes(cfg),
    animationCss: (cfg, anim) => `${anim} ${cfg.speed + cfg.gap}ms ease-out infinite`,
    period: (cfg) => cfg.speed + cfg.gap,
    layerCount: (cfg) => (cfg.type === "echo" ? 2 : 1),
    layerCssText: (cfg) =>
        cfg.badge > 0
            ? `${badgeLayerGeometry(cfg.badge)}background:var(--x-ripple-color);`
            : fullLayerGeometry(),
    applyLayerExtras: (layers, cfg) => {
        // echo 第二环：错相位/同拍（click）delay + 同心缩小尺寸（变量写在层上覆盖宿主继承值）
        const second = layers[1];
        if (second) {
            second.style.animationDelay = `${echoDelay(cfg)}ms`;
            second.style.setProperty("--x-ripple-size", `${echoSize(cfg)}px`);
        }
    },
    applyVars: (el, cfg, anim) => {
        const style = el.style;
        style.setProperty("--x-ripple-color", cfg.color || THEME_COLOR_VAR);
        style.setProperty("--x-ripple-size", `${cfg.size}px`);
        style.setProperty("--x-ripple-duration", `${cfg.speed + cfg.gap}ms`);
        style.setProperty("--x-ripple-anim", anim);
        style.setProperty("--x-ripple-echo-delay", `${echoDelay(cfg)}ms`);
        style.setProperty("--x-ripple-echo-size", `${echoSize(cfg)}px`);
        if (cfg.badge > 0) style.setProperty("--x-ripple-badge-size", `${cfg.badge}px`);
    },
};

/* ──────────────── 插件自举（ADR-0002 决策 1；注册通道见 decorate 模块头） ──────────────── */

/**
 * 双路径注册（模块加载期执行一次，decorate 的 installPlugin 单点收敛）：
 * AutoSpark 已存在 → 直接入安装器队列；否则推 `__AUTOSPARK_PLUGINS__` 预加载队列，
 * 首个 engine 构造开头 drain。两路径殊途同归 `AutoSpark.directive(spec)`。
 */
export function bootstrapRipplePlugin(): void {
    bootstrapDecoratePlugin("x-ripple", createDecorateSpec("ripple", RIPPLE_STRATEGY));
}

// 模块加载即自举（对称 notifications 插件：置于模块尾部）
bootstrapRipplePlugin();
