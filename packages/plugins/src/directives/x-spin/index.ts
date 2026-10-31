/**
 * x-spin 色环旋转指令（@autospark/plugins ADR-0007，取代 ADR-0005 伞形模型）：为宿主
 * 元素叠加不改变布局与内容的旋转色环动画层（进行中指示）——环绕宿主边界的旋转色环。
 *
 * ## 形态（`type` 回归形态键，ADR-0007 决策 2）
 *
 * - `rotate`：整环匀速旋转——conic-gradient 渐变环沿宿主边界整体转动；
 * - `beam`（缺省）：光段跑边——一段亮弧沿 border 循环跑动；
 * - `chase`：双段追逐——两段对置亮弧间隔追逐。
 *
 * ## 三通道等价声明
 *
 * 显式 `type` 键 / 布尔开关键 `{beam:true}` / 点修饰符 `x-spin.beam` 三通道等价
 * （修饰符经引擎解析期按词表注入布尔开关键，与 options JSON 同一落点）。形态并存取先：
 * 缺省垫底 + 枚举声明序——`chase > rotate > beam`。触发器通道（hover/always/click，缺省
 * always，并存 hover > always > click）与本通道镜像对称，修饰符词表分流、次序无关：
 * `x-spin.beam.click` ≡ `x-spin.click.beam`。
 *
 * ## 键面（x-spin-options，静态求值一次——动效参数是设计期配置，改值需重挂宿主）
 *
 * - `color`：色环颜色，缺省跟随主题主色变量（badge 启用时缺省联动语义红）；
 * - `size`：色环环宽 px（缺省 4——环带 mask 挖洞 padding，环带视觉厚度的合理档位）；
 * - `speed`：旋转一圈时长 ms（缺省 3000，匀速 linear——与涟漪 ease-out 分流）；
 * - `badge`：徽标（家族通用）——宿主右上角正圆载体，色环在角标圆内旋转；
 * - 跨指令键 warn 忽略（ADR-0007 决策 2）：声明 x-ripple 形态词表（ring/glow/echo）或
 *   `gap`（涟漪专属静止段——x-spin 恒转无静止段）时警告忽略，不中断渲染。
 *
 * ## 渐变直连契约（ADR-0005 决策 3 修订平移）
 *
 * 注册属性动画的 paint 失效传播只保证覆盖「计算时直接解析到该变量的属性」——渐变
 * background 必须**直连** `--x-spin-angle` 角度变量，禁止经宿主级未注册自定义属性中转：
 * 经未注册变量中转的间接引用链在部分 Chromium 版本上不触发重绘，表现为角度在跑
 * （getComputedStyle 可见 angle 递增）而色环静止不转。伪元素静态规则与降级层内联样式
 * 共用 {@link spinGradientCss} 模板，保证三形态渐变单一来源。
 *
 * 环几何贴合宿主 border-radius（mask 环带 + 圆角继承）；click = 每次点击转一圈播完即停
 * （与涟漪 click「单周期播放」严格对齐）；badge 下色环在角标圆内旋转。
 *
 * 值三态、触发器语义、停止语义（播完当前周期再停）、载体策略（伪元素优先/探测降级）、
 * 徽标契约、注册通道与双路径自举——家族共享契约见 src/utils/decorate.ts（统一承载，
 * 本模块只落形态差异）。
 *
 * 自举：模块加载即执行 {@link bootstrapSpinPlugin}（decorate 的双路径注册）。
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
    SPIN_COLOR_VAR,
    SPIN_BADGE_COLOR,
    type DecorateStrategy,
    type DecorateTrigger,
} from "../../utils/decorate";

/** 色环形态：rotate 整环匀速旋转 / beam 光段跑边（缺省）/ chase 双段追逐 */
export type XSpinMode = "rotate" | "beam" | "chase";

/** x-spin-options 配置（静态求值一次，ADR-0002 决策 3 / ADR-0007 决策 2） */
export interface XSpinOptions {
    /** 形态显式键，默认 beam */
    type?: XSpinMode;
    /** 形态布尔开关键 ≡ type（`x-spin.<mode>` 修饰符同义注入） */
    rotate?: boolean;
    /** ≡ type:'beam' */
    beam?: boolean;
    /** ≡ type:'chase' */
    chase?: boolean;
    /** 触发器显式键，默认 always（click = 点击转一圈自动停止，在播中连点忽略） */
    trigger?: DecorateTrigger;
    /** hover 开关 ≡ trigger:'hover'（`x-spin.hover` 修饰符同义注入） */
    hover?: boolean;
    /** always 开关 ≡ trigger:'always' */
    always?: boolean;
    /** click 开关 ≡ trigger:'click' */
    click?: boolean;
    /** 徽标（家族通用）：true = 宿主右上角 8px 正圆载体 / 正数字 = 自定义直径 px（启用时 color 缺省主题语义红） */
    badge?: boolean | number;
    /** 颜色，缺省跟随主题主色变量（badge 启用时缺省联动语义红） */
    color?: string;
    /** 色环环宽 px，默认 4 */
    size?: number;
    /** 旋转一圈时长 ms（匀速 linear），默认 3000 */
    speed?: number;
}

/** 归一后的全量配置（带默认值；spin 恒转无静止段——无 gap 键） */
interface SpinConfig {
    type: XSpinMode;
    trigger: DecorateTrigger;
    /** 徽标直径 px（0 = 未启用） */
    badge: number;
    color: string;
    size: number;
    speed: number;
}

/** 形态归一优先序：多处声明并存时取先者（缺省垫底 + 枚举声明序——与触发器值序同构） */
const MODE_PRIORITY: readonly XSpinMode[] = ["chase", "rotate", "beam"];

/** 形态词表（type 显式键合法值 + 布尔开关键/修饰符词表） */
const MODE_WORDS: readonly XSpinMode[] = ["rotate", "beam", "chase"];

/** 跨指令词表：x-ripple 形态键（声明时 warn 忽略，ADR-0007 决策 2） */
const CROSS_WORDS: readonly string[] = ["ring", "glow", "echo"];

const DEFAULT_CONFIG: SpinConfig = {
    type: "beam",
    trigger: "always",
    badge: 0,
    color: SPIN_COLOR_VAR,
    size: 4,
    speed: 3000,
};

/** 宿主标记类（position 兜底 + CSS 变量默认值；无伪元素定义——伪元素挂在激活类上） */
const HOST_CLASS = "x-spin";
/** 激活类：伪元素色环载体定义 + animation 生效开关 */
const ACTIVE_CLASS = "x-spin-on";
/** 降级子元素载体类 */
const LAYER_CLASS = "x-spin-layer";
/** 徽标宿主标记类：载体定位覆盖为右上角正圆（伪元素与降级子层同几何） */
const BADGE_CLASS = "x-spin-badge";

/** 形态标记类：`x-spin-<mode>`（rotate/beam/chase 各自的 conic 渐变模板选择器） */
const modeClass = (mode: XSpinMode): string => `${HOST_CLASS}-${mode}`;

/** 旋转动画 keyframes 名（固定——匀速整圈角度变量动画，时长走 animation-duration，无参数烘焙） */
const SPIN_KEYFRAMES = "x-spin-angle";

/* ────────────────────────── 样式注入 ────────────────────────── */

/** 静态样式是否已注入（文档级共享，多 engine 安全——内容相同幂等） */
let stylesInjected = false;

/**
 * 三形态的 conic 渐变模板（background 值，直接引用 `var(--x-spin-angle)`）。
 *
 * 渐变必须直连角度变量，禁止经宿主级未注册自定义属性中转（如 `--x-spin-bg`）：
 * 注册属性动画的 paint 失效传播只保证覆盖「计算时直接解析到该变量的属性」——经
 * 未注册变量中转的间接引用链在部分 Chromium 版本上不触发重绘，表现为角度在跑
 * （getComputedStyle 可见 angle 递增）而色环静止不转。伪元素静态规则与降级层
 * 内联样式共用本模板，保证三形态渐变单一来源。
 */
function spinGradientCss(mode: XSpinMode): string {
    switch (mode) {
        case "beam":
            return `conic-gradient(from var(--x-spin-angle), transparent 0deg, var(--x-spin-color) 30deg, transparent 70deg)`;
        case "chase":
            return `conic-gradient(from var(--x-spin-angle), var(--x-spin-color) 0deg 12deg, transparent 12deg 168deg, var(--x-spin-color) 168deg 180deg, transparent 180deg)`;
        default:
            return `conic-gradient(from var(--x-spin-angle), var(--x-spin-color), transparent 75%)`;
    }
}

/**
 * 降级子层的环带内联样式：mask 挖出环带（内环 = 载体 content-box，padding = 环宽）。
 * conic 渐变背景由调用处按形态经 spinGradientCss() 拼接（直接引用角度变量，见其注释）。
 */
const SPIN_LAYER_CSS =
    `padding:var(--x-spin-size);` +
    `-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);` +
    `-webkit-mask-composite:xor;` +
    `mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);` +
    `mask-composite:exclude;`;

/**
 * 注入静态样式（首个指令实例化时执行一次）：
 *
 * - `@property --x-spin-angle`：角度变量注册后可参与 transition/animation（旋转的载体）；
 * - `:where(.x-spin)`：宿主 position 兜底——特异性 0，宿主自有定位规则（内联/类）可覆盖；
 * - `.x-spin`：CSS 变量默认值（color 缺省主题主色，消费端可被指令写入的实例变量覆盖）；
 * - `.x-spin.x-spin-on::after`：伪元素色环载体基底（mask 环带 + 匀速角度动画）；渐变
 *   background 不在公共规则声明——三形态各自由下方规则直写（直接引用角度变量，经未注册
 *   变量中转的间接链在部分 Chromium 上不触发重绘）；
 * - badge 规则：载体几何覆盖为宿主右上角正圆（实底圆点）；形态渐变规则置于 badge 之后
 *   （同特异性后者胜——background 从实底圆点覆盖为渐变环带，几何继承 badge 规则）；
 * - `prefers-reduced-motion: reduce`：系统减弱动效时停播（装饰性动画的可访问性底线）。
 */
function ensureStyles(): void {
    if (stylesInjected || typeof document === "undefined") return;
    stylesInjected = true;
    const style = document.createElement("style");
    style.setAttribute("data-x-spin", "");
    style.textContent = `
@property --x-spin-angle {
  syntax: "<angle>";
  inherits: false;
  initial-value: 0deg;
}
@keyframes ${SPIN_KEYFRAMES} { to { --x-spin-angle: 360deg; } }
:where(.${HOST_CLASS}) { position: relative; }
.${HOST_CLASS} {
  --x-spin-color: ${SPIN_COLOR_VAR};
  --x-spin-size: 4px;
  --x-spin-duration: 3000ms;
  --x-spin-badge-size: 8px;
}
.${HOST_CLASS}.${ACTIVE_CLASS}::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  /* 色环载体（伪元素形态）：conic 渐变环带绕宿主边界匀速旋转——mask 挖出内环
     （padding = 环宽 size，content-box exclude），border-radius 继承贴合宿主圆角。
     渐变 background 不在本公共规则声明——三形态各自由下方规则直写（直接引用角度变量，
     经未注册变量中转的间接链在部分 Chromium 上不触发重绘），并保持置于 badge 规则之后：
     badge+spin 组合下 background 覆盖实底圆点，几何继承 badge 规则（色环画在角标圆内） */
  padding: var(--x-spin-size);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  mask-composite: exclude;
  animation: ${SPIN_KEYFRAMES} var(--x-spin-duration) linear infinite;
}
.${HOST_CLASS}.${BADGE_CLASS}.${ACTIVE_CLASS}::after {
  /* badge 徽标形态：载体缩为宿主右上角正圆（圆心恰在角点），实底圆点 + 色环画在角标圆内 */
  inset: auto;
  top: calc(-1 * var(--x-spin-badge-size) / 2);
  right: calc(-1 * var(--x-spin-badge-size) / 2);
  width: var(--x-spin-badge-size);
  height: var(--x-spin-badge-size);
  border-radius: 50%;
  background: var(--x-spin-color);
  z-index: 2147483647;
}
.${HOST_CLASS}.${modeClass("rotate")}.${ACTIVE_CLASS}::after {
  background: ${spinGradientCss("rotate")};
}
.${HOST_CLASS}.${modeClass("beam")}.${ACTIVE_CLASS}::after {
  background: ${spinGradientCss("beam")};
}
.${HOST_CLASS}.${modeClass("chase")}.${ACTIVE_CLASS}::after {
  background: ${spinGradientCss("chase")};
}
@media (prefers-reduced-motion: reduce) {
  .${HOST_CLASS}.${ACTIVE_CLASS}::after { animation: none; }
}`;
    document.head.appendChild(style);
}

/* ────────────────────────── 配置归一 ────────────────────────── */

/**
 * 归一 options：枚举/数值校验，非法值 warn 并回退默认（宽松策略——装饰性动画的
 * 配置错误不致命，不中断渲染）。形态三通道（type 显式键 + rotate/beam/chase 布尔开关，
 * `x-spin.<mode>` 修饰符经引擎解析期等价注入）并存按 MODE_PRIORITY 取先；
 * 跨指令键（x-ripple 形态词表 + gap）warn 忽略（ADR-0007 决策 2）。
 */
function normalizeConfig(raw: Record<string, any> | undefined, warn: (msg: string) => void): SpinConfig {
    const cfg: SpinConfig = { ...DEFAULT_CONFIG };
    if (!raw) return cfg;

    // 形态三通道归一：type 显式键 + 布尔开关键，并存取先（缺省垫底 + 枚举声明序）
    const seen = collectSwitches(raw, MODE_WORDS, warn, "x-spin");
    if (raw.type !== undefined) {
        if (MODE_WORDS.includes(raw.type)) seen.add(raw.type);
        else warn(`x-spin: type 取值非法（${JSON.stringify(raw.type)}），已回退 "beam"`);
    }
    const resolvedType = MODE_PRIORITY.find((m) => seen.has(m));
    if (resolvedType) cfg.type = resolvedType;

    // 跨指令键：x-ripple 形态词表 + gap（涟漪专属静止段——x-spin 恒转无静止段）warn 忽略
    warnCrossWords(raw, CROSS_WORDS, "x-ripple", warn, "x-spin");
    if (raw.gap !== undefined) warn("x-spin: gap 仅涟漪支持（x-spin 恒转无静止段），已忽略");

    cfg.trigger = normalizeTrigger(raw, warn, "x-spin");
    cfg.badge = normalizeBadge(raw, warn, "x-spin");
    cfg.color = resolveColor(
        raw.color,
        { color: SPIN_COLOR_VAR, badgeColor: SPIN_BADGE_COLOR },
        cfg.badge,
        warn,
        "x-spin",
    );
    cfg.size = normalizeNumber(raw, "size", warn, "x-spin") ?? DEFAULT_CONFIG.size;
    cfg.speed = normalizeSpeed(raw, warn, "x-spin");
    return cfg;
}

/* ────────────────────────── 策略 ────────────────────────── */

/** x-spin 差异策略（状态机/载体/触发器/徽标等家族契约由 decorate 统一承载） */
const SPIN_STRATEGY: DecorateStrategy<SpinConfig> = {
    hostClass: HOST_CLASS,
    activeClass: ACTIVE_CLASS,
    layerClass: LAYER_CLASS,
    ensureStyles,
    normalize: normalizeConfig,
    hostClasses: (cfg) => [modeClass(cfg.type), ...(cfg.badge > 0 ? [BADGE_CLASS] : [])],
    activeClasses: () => [],
    animName: () => SPIN_KEYFRAMES,
    animationCss: (cfg, anim) => `${anim} ${cfg.speed}ms linear infinite`,
    period: (cfg) => cfg.speed,
    layerCount: () => 1,
    layerCssText: (cfg) =>
        cfg.badge > 0
            ? `${badgeLayerGeometry(cfg.badge)}${SPIN_LAYER_CSS}background:${spinGradientCss(cfg.type)};`
            : `${fullLayerGeometry()}${SPIN_LAYER_CSS}background:${spinGradientCss(cfg.type)};`,
    applyVars: (el, cfg) => {
        const style = el.style;
        style.setProperty("--x-spin-color", cfg.color || SPIN_COLOR_VAR);
        style.setProperty("--x-spin-size", `${cfg.size}px`);
        style.setProperty("--x-spin-duration", `${cfg.speed}ms`);
        if (cfg.badge > 0) style.setProperty("--x-spin-badge-size", `${cfg.badge}px`);
    },
};

/* ──────────────── 插件自举（ADR-0002 决策 1；注册通道见 decorate 模块头） ──────────────── */

/**
 * 双路径注册（模块加载期执行一次，decorate 的 installPlugin 单点收敛）：
 * AutoSpark 已存在 → 直接入安装器队列；否则推 `__AUTOSPARK_PLUGINS__` 预加载队列，
 * 首个 engine 构造开头 drain。两路径殊途同归 `AutoSpark.directive(spec)`。
 */
export function bootstrapSpinPlugin(): void {
    bootstrapDecoratePlugin(createDecorateSpec("spin", SPIN_STRATEGY));
}

// 模块加载即自举（对称 notifications 插件：置于模块尾部）
bootstrapSpinPlugin();
