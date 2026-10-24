/**
 * x-ripple 涟漪指令（@autospark/plugins ADR-0002）：为宿主元素增加从边框开始、
 * 循环向外扩散渐隐的装饰性动画层，不改变宿主布局与内容。
 *
 * ## 形态
 *
 * - `<div x-ripple>`：恒开（无值）；
 * - `<div x-ripple="ui.show">`：表达式 truthiness 控制开/关（`x-data` 局部变量可用，
 *   求值经 `findScopeByEl` 取宿主 scope——x-error 运行时取 scope 同款先例）；
 * - `<div x-ripple="false">`：恒关；
 * - `x-ripple-options`：静态整包配置（宽松 JSON，求值一次——涟漪参数是设计期配置，
 *   改值需重挂宿主），键见 {@link XRIppleOptions}。
 *
 * ## 三种涟漪方式（type）
 *
 * - `ring`：外扩环——一圈边框色自宿主边框（box-shadow spread 0）向外扩散至
 *   `size` 并渐隐，循环；
 * - `glow`：边框光晕——box-shadow blur 呼吸式明暗脉冲（半周期最大、整周期归零），不位移；
 * - `echo`（默认）：回声双环——双载体错相位 ring（第二环负延迟半个周期），一波未平一波又起。
 *
 * `size` 统一语义 = 自边框向外扩散的最大距离（ring/echo 是外扩距离、glow 是光晕最大半径）。
 * 圆角跟随：载体 `border-radius: inherit`（box-shadow 天然贴合载体圆角）。
 *
 * ## 徽标涟漪（badge，2026-10-24 增补）
 *
 * `badge?: boolean | number` 将涟漪载体从「inset:0 全域」覆盖为「宿主右上角正圆」——圆心恰在
 * 宿主 border box 右上角顶点（top/right = -直径/2，一半悬于宿主外）。`true` = 默认直径 8px，
 * 正数字 = 自定义直径，非法值 warn 后不启用；启用且未显式给 color 时 color 缺省联动主题语义红。
 * type/trigger/size 等其余键语义零变化——波环动画复用既有 keyframes（box-shadow spread 自圆边
 * 起波），echo+click「双环一次起波」定稿语义自动继承。载体 z-index 取 CSS 最大值覆盖宿主内容
 * （受宿主层叠上下文约束）；宿主 overflow:hidden 会裁剪 badge（文档说明，不强制干预）。
 *
 * ## 停止语义（ADR-0002 决策 6）
 *
 * 指令值转假或 hover 移出时不打断在播周期：按已播时长取模计算当前周期剩余时间，
 * 延迟到周期末移除动画（周期末本就近乎透明，复位即自然消失）。周期起点以启动时刻
 * 近似（`performance.now()`，误差一帧内，装饰动画无需帧级精确）。
 *
 * ## 载体策略（ADR-0002 决策 5）
 *
 * 伪元素优先（宿主加 `.x-ripple` 标记 + `.x-ripple-on` 激活；echo 另启用 `::before`），
 * 零 DOM 侵入；`getComputedStyle(el, '::after').content` 探测宿主自身伪元素占用
 * （探测须在加激活类**之前**——激活类自带 `content:""` 会自我命中），占用或宿主未连接
 * 前不定形态；占用 → 自动降级为注入 `position:absolute` 子元素（脱离文档流不参与
 * flex/gap 布局）。纯自动检测，无显式配置项。
 *
 * 探测时机：宿主可能尚未连接文档（engine.el 未入文档 / x-if 等结构延迟挂载），setTimeout
 * 等待连接后探测一次定形态，再启动挂起的播放（detached 的 getComputedStyle 伪元素解析
 * 不可靠；happy-dom 等无渲染泵环境 rAF 不调度，setTimeout 双环境语义一致）。
 *
 * ## 注册通道：`AutoSpark.directive(spec)` 安装器队列（ADR-0002 决策 2 + 决策 3 修订）
 *
 * 本包运行时零依赖 autospark（类型导入编译期剥除）。注册走插件指令的**唯一公共入口**
 * `AutoSpark.directive(spec)` spec 重载（类重载硬性校验 `instanceof AutoSparkDirectiveBase`，
 * 零依赖类不可用）：engine 侧造类（继承基类）→ 挂 spec 钩子 → 指令安装器入**插件机制的
 * 模块内存队列**（ADR-0111 决策 5）。队列消费时机 = engine 构造期 `setupPluginQueue`
 * （DirectiveManager 创建后、autostart compile **前**）——指令参与首编译，编译器
 * `_runtimeKeepAttr` 才会保留 `x-ripple`/`x-ripple-options` 属性，dispatcher.start 的
 * 初始扫描随即 mount。晚入队（engine 已存活）广播即时安装（Runtime 指令重扫生效；
 * 首编译已剥除属性的 engine 无属性可扫——IIFE 场景按 script 顺序加载保证先注册）。
 *
 * **通道选择 Runtime（observer）而非 Compile（scope）**：涟漪是纯呈现副作用（无编译期
 * 变换、无子树占有），observer 通道的 mounted/unmounted/attrChanged 与其生命周期天然
 * 同构；且 dispatcher 晚注册重扫对「属性已保留」的场景有补挂能力（编译期卸下的元素、
 * x-if 动态挂载的宿主都靠 observer 捕获）。值表达式的相对路径支持不靠 scope 通道，而是
 * mounted 时 `engine.findScopeByEl(el)` 取宿主 scope 建订阅（scope 缺失回退
 * `engine.store.watch` 绝对路径）——语义与 Compile 的 `binding.watch` 等价（同一
 * scope.watch 实现，x-data 局部变量可读）。
 *
 * **钩子委托**：spec 钩子的 `this` 是 engine 侧造的基类实例（engine/info/value/el 契约
 * 面），控制器 {@link RippleDirective} 经 WeakMap 挂靠——实例状态（配置/定时器/载体）
 * 全在控制器，spec 钩子只做存取转发。
 *
 * 自举（ADR-0002 决策 1；单点收敛于 {@link installPlugin}）：模块加载即执行
 * {@link bootstrapRipplePlugin}——`globalThis.AutoSpark` 已存在（引擎脚本先加载）→ 经类静态
 * `directive` 直接入安装器队列；否则推 `__AUTOSPARK_PLUGINS__` 预加载队列（首个 engine 构造
 * 开头 drain，插件体内再走 `directive(spec)`，赶在同构造的 setupPluginQueue 消费之前）。
 */

import type { AutoSpark, DirectiveSpec } from "autospark";
import { captureNamespace } from "../../runtime/bridge";
import { installPlugin } from "../../runtime/bootstrap";

/** 涟漪方式：ring 外扩环 / glow 边框光晕呼吸 / echo 双环回声 */
export type XRIppleType = "ring" | "glow" | "echo";

/** 触发器：always 挂载后持续循环 / hover 仅悬停期间播放 / click 每次点击播放一个完整周期后停止 */
export type XRIppleTrigger = "always" | "hover" | "click";

/** x-ripple-options 配置（静态求值一次，ADR-0002 决策 3） */
export interface XRIppleOptions {
    /** 涟漪方式，默认 echo */
    type?: XRIppleType;
    /** 触发器显式键，默认 always（click = 点击播一个完整周期自动停止，在播中连点忽略） */
    trigger?: XRIppleTrigger;
    /** hover 开关 ≡ trigger:'hover'（`x-ripple.hover` 修饰符同义注入） */
    hover?: boolean;
    /** always 开关 ≡ trigger:'always'（`x-ripple.always` 修饰符同义注入） */
    always?: boolean;
    /** click 开关 ≡ trigger:'click'（`x-ripple.click` 修饰符同义注入） */
    click?: boolean;
    /** 徽标涟漪：true = 宿主右上角 8px 正圆载体 / 正数字 = 自定义直径 px（启用时 color 缺省主题语义红） */
    badge?: boolean | number;
    /** 涟漪颜色，缺省跟随主题主色变量 */
    color?: string;
    /** 自边框向外扩散的最大距离 px，默认 12 */
    size?: number;
    /** 动画段时长 ms（不含 gap），默认 2000 */
    speed?: number;
    /** 周期末静止段 ms（烘进 keyframes 百分比），默认 0 */
    gap?: number;
}

/** 归一后的全量配置（带默认值） */
interface RippleConfig {
    type: XRIppleType;
    trigger: XRIppleTrigger;
    /** 徽标直径 px（0 = 未启用） */
    badge: number;
    color: string;
    size: number;
    speed: number;
    gap: number;
}

/** 触发器归一优先序：多处声明并存时取先者（决策 4「取第一个值」——跨通道统一值序） */
const TRIGGER_PRIORITY: readonly XRIppleTrigger[] = ["hover", "always", "click"];

const DEFAULT_CONFIG: RippleConfig = {
    type: "echo",
    trigger: "always",
    badge: 0,
    color: "var(--auto-theme-color, #1677ff)",
    size: 12,
    speed: 2000,
    gap: 0,
};

/** 主题主色变量名（@autospark/theme 标尺，跟随 ThemeManager 动态主题） */
const THEME_COLOR_VAR = "var(--auto-theme-color, #1677ff)";

/** 宿主标记类（position 兜底 + CSS 变量默认值；无伪元素定义——伪元素挂在激活类上） */
const HOST_CLASS = "x-ripple";
/** 激活类：伪元素涟漪层定义 + animation 生效开关 */
const ACTIVE_CLASS = "x-ripple-on";
/** echo 双环标记：额外启用 ::before 载体（负延迟错相） */
const ECHO_CLASS = "x-ripple-echo";
/** 降级子元素载体类 */
const LAYER_CLASS = "x-ripple-layer";
/** 徽标涟漪宿主标记类：载体定位覆盖为右上角正圆（伪元素与降级子层同几何） */
const BADGE_CLASS = "x-ripple-badge";
/** 徽标涟漪默认直径 px（badge: true 时） */
const BADGE_DEFAULT_SIZE = 8;
/** 徽标涟漪缺省色：主题语义红（跟随 ThemeManager 语义标尺，主题未加载兜底固定红） */
const BADGE_COLOR = "var(--auto-danger-color, #ff4d4f)";
/** 徽标载体 z-index（CSS 最大值：覆盖宿主内容与同上下文定位元素；受宿主层叠上下文约束） */
const BADGE_Z_INDEX = 2147483647;

/** 宿主 scope 最小结构契约（鸭子类型：值表达式响应式订阅，零 engine 类型依赖） */
interface RippleScope {
    watch(expr: string, cb: (payload: { value: any }) => void): any;
}

/** 全局 store fallback watcher 的最小 off 契约 */
interface RippleWatcher {
    off?: () => void;
}

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
  --x-ripple-duration: 2000ms;
  --x-ripple-anim: x-ripple-ring-2000-0;
  --x-ripple-echo-delay: -1000ms;
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
  z-index: ${BADGE_Z_INDEX};
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
  z-index: ${BADGE_Z_INDEX};
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
 * 环形态用 box-shadow spread 扩散（硬边环自边框长出渐散）而非 transform scale——
 * 前者无需感知宿主尺寸、天然贴合 border-radius、窗口缩放不失效。
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

/**
 * 伪元素占用探测（可被测试替换的模块级函数）：宿主自身 `::after` 的 content 非
 * none/normal 即视为占用。须在宿主连接文档后、加激活类前调用（激活类自带 content 会自我命中）。
 */
export function probePseudoOccupied(el: HTMLElement): boolean {
    try {
        const content = getComputedStyle(el, "::after")?.content;
        return content !== undefined && content !== "none" && content !== "normal";
    } catch {
        return false;
    }
}

/* ────────────────────────── 配置归一 ────────────────────────── */

/**
 * 归一 options：枚举/数值校验，非法值 warn 并回退默认（宽松策略——装饰性动画的
 * 配置错误不致命，不中断渲染）。
 */
function normalizeConfig(raw: Record<string, any> | undefined, warn: (msg: string) => void): RippleConfig {
    const cfg: RippleConfig = { ...DEFAULT_CONFIG };
    if (!raw) return cfg;

    if (raw.type !== undefined) {
        if (raw.type === "ring" || raw.type === "glow" || raw.type === "echo") cfg.type = raw.type;
        else warn(`x-ripple: type 取值非法（${JSON.stringify(raw.type)}），已回退 "echo"`);
    }
    // 触发器三通道归一（决策 4 增补）：trigger 显式键 + hover/always/click 布尔开关
    // （`x-ripple.hover` 修饰符经引擎解析期等价注入为 {hover:true}——getDirectives.ts 的
    // modifier 开关注入，与 x-ripple-options JSON 同一落点）。多处并存时按
    // hover > always > click 取先者；均未声明回退默认 always。显式 false = 压制开关
    // （JSON 键占位阻断 modifier 注入，ADR-0007「显式声明含 false 压制」语义自然成立）。
    const triggerSeen = new Set<XRIppleTrigger>();
    if (raw.trigger !== undefined) {
        if (raw.trigger === "always" || raw.trigger === "hover" || raw.trigger === "click") triggerSeen.add(raw.trigger);
        else warn(`x-ripple: trigger 取值非法（${JSON.stringify(raw.trigger)}），已忽略`);
    }
    for (const key of ["hover", "always", "click"] as const) {
        const v = raw[key];
        if (v === true) triggerSeen.add(key);
        else if (v !== undefined && v !== false) warn(`x-ripple: ${key} 开关须为布尔值，已忽略`);
    }
    const resolvedTrigger = TRIGGER_PRIORITY.find((t) => triggerSeen.has(t));
    if (resolvedTrigger) cfg.trigger = resolvedTrigger;
    // badge 归一（决策 4 增补）：true = 默认直径；正数字 = 自定义直径 px；false/缺省 = 不启用；
    // 非法值 warn 后不启用（宽松策略与其余键一致）
    if (raw.badge !== undefined && raw.badge !== false) {
        if (raw.badge === true) cfg.badge = BADGE_DEFAULT_SIZE;
        else if (typeof raw.badge === "number" && Number.isFinite(raw.badge) && raw.badge > 0) cfg.badge = raw.badge;
        else warn(`x-ripple: badge 须为 true 或正数字（直径 px），已忽略`);
    }
    let colorExplicit = false;
    if (raw.color !== undefined) {
        if (typeof raw.color === "string" && raw.color.trim() !== "") {
            cfg.color = raw.color;
            colorExplicit = true;
        } else warn("x-ripple: color 须为非空字符串，已回退默认色");
    }
    // color 缺省联动：badge 启用且未显式给 color → 主题语义红（显式 color 恒优先）
    if (cfg.badge > 0 && !colorExplicit) cfg.color = BADGE_COLOR;
    for (const key of ["size", "speed", "gap"] as const) {
        const v = raw[key];
        if (v === undefined) continue;
        if (typeof v !== "number" || !Number.isFinite(v) || v < 0) {
            warn(`x-ripple: ${key} 须为非负数字，已回退默认值`);
            continue;
        }
        cfg[key] = v;
    }
    if (cfg.speed <= 0) {
        warn("x-ripple: speed 须为正数（总周期为 0 将无法产生动画），已回退 2000");
        cfg.speed = 2000;
    }
    return cfg;
}

/* ────────────────────────── 指令类 ────────────────────────── */

/**
 * RippleDirective（涟漪控制器，ADR-0002 决策 2）：实例状态与全部逻辑的宿主。注册形态
 * 走 `AutoSpark.directive(spec)` spec 重载（见模块头「注册通道」节）——engine 侧造的
 * 指令类继承基类，spec 钩子经 WeakMap 委托到本类实例（{@link bootstrapRipplePlugin}）。
 *
 * 生命周期：`mounted()` 解析配置 + 建值订阅 + 接线触发器；`unmounted()` 清理定时器、
 * 载体与宿主类（scope 通道 watcher 由 scope.destroy 统一回收，fallback 句柄自行 off）。
 *
 * 状态机（enabled = 值 truthiness 总开关；playing = 当前是否在播）：
 * - enabled=false → 永不播放；转假时若在播 → 播完当前周期再停（决策 6）；
 * - enabled=true → always 立即启动循环；hover 待 mouseenter 播放、mouseleave 播完当前周期。
 */
export class RippleDirective {
    /**
     * 载体探测函数（实例化时经 constructor 取用——非 readonly，测试可替换以驱动
     * 「伪元素被占用 → 降级子元素」路径；运行时恒为 {@link probePseudoOccupied}）。
     */
    static probe: (el: HTMLElement) => boolean = probePseudoOccupied;

    engine: AutoSpark<any>;
    info: Record<string, any>;
    el: HTMLElement;

    /** 原始指令值（表达式字符串；无值 undefined = 恒开） */
    value: string | undefined;
    /** 归一后的全量配置 */
    config: RippleConfig;

    /** 存活标记：unmounted 后值订阅回调短路（scope.watch 无句柄，真 off 留给 scope.destroy） */
    private alive = true;
    /** 值总开关（truthiness）；false 时永不播放 */
    private enabled = true;
    /** 当前是否在播 */
    private playing = false;
    /** 载体形态（探测定时器定型后赋值；null = 未定） */
    private carrier: "pseudo" | "element" | null = null;
    /** 降级子元素载体（echo 双环注入两个） */
    private layers: HTMLElement[] = [];
    /** 播完当前周期的停止定时器 */
    private stopTimer: ReturnType<typeof setTimeout> | null = null;
    /** 载体探测定时器（探测定型前循环重试；unmounted 取消） */
    private probeTimer: ReturnType<typeof setTimeout> | null = null;
    /** 本轮播放起点（周期剩余时长的取模基准） */
    private activatedAt = 0;
    /** 定形态前挂起的播放请求（探测完成后续播） */
    private pendingStart = false;
    /** hover 事件卸载器 */
    private offHover: (() => void) | null = null;
    /** click 事件卸载器 */
    private offClick: (() => void) | null = null;
    /** 无 scope fallback（engine.store.watch）的 watcher 句柄——unmounted 自行 off */
    private valueOff: (() => void) | null = null;

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
     * observer 通道入口（dispatcher mount 时调用，宿主已注入）：配置落位 + 值订阅 +
     * 触发器接线。此时宿主可能尚未连接文档（engine.el detached）——载体探测经
     * setTimeout 等待连接（见 probeCarrier）。
     */
    mounted(): void {
        if (!this.el) return;
        ensureStyles();
        this.applyCssVars();
        this.bindValue();
        if (this.config.trigger === "hover") {
            this.bindHover();
            // hover 模式同样预探测定形态（不挂起播放）：悬停触发 requestStart 时形态已定，
            // 播放零延迟（探测与触发器无关，宿主未连接时循环重试，连接后仅定型）
            this.probeCarrier();
        } else if (this.config.trigger === "click") {
            this.bindClick();
            this.probeCarrier(); // 同 hover：预探测定形态，首次点击零探测延迟
        } else if (this.enabled) {
            this.requestStart();
        }
    }

    /** observer 卸载（元素移除 / engine.destroy）：清定时器/订阅、摘载体与宿主类、解绑 hover */
    unmounted(): void {
        this.alive = false;
        if (this.stopTimer != null) clearTimeout(this.stopTimer);
        this.stopTimer = null;
        if (this.probeTimer != null) clearTimeout(this.probeTimer);
        this.probeTimer = null;
        this.valueOff?.();
        this.valueOff = null;
        this.offHover?.();
        this.offHover = null;
        this.offClick?.();
        this.offClick = null;
        for (const layer of this.layers) layer.remove();
        this.layers = [];
        this.el?.classList.remove(HOST_CLASS, ACTIVE_CLASS, ECHO_CLASS, BADGE_CLASS);
        this.playing = false;
    }

    /**
     * 属性值变化（observer attrChanged）：重建值订阅（新表达式生效），状态机按新值复位。
     * 载体/悬停接线不重建（形态与配置无关，options 静态求值一次）。
     */
    attrChanged(newVal: string): void {
        this.value = newVal === "" ? undefined : newVal;
        this.enabled = true; // 重订阅后由初始求值决定
        this.valueOff?.();
        this.valueOff = null;
        if (this.playing) {
            // 旧表达式在播、新值待定：先按周期末停止，订阅回调立即按新值接管
            this.scheduleStop();
        }
        this.bindValue();
    }

    /**
     * 值订阅（决策 3 修订）：宿主 scope 命中走 scope.watch（相对表达式可用——x-data 局部
     * 变量；watcher 注册进 scope.watchers，scope.destroy 统一回收，回调经 alive 守卫短路）；
     * 无 scope（宿主未编译/游离元素）回退 engine.store.watch（绝对路径），句柄自行 off。
     * 无值恒开。返回的初始值立即驱动一次状态机。
     */
    private bindValue(): void {
        if (this.value == null) {
            this.setEnabled(true);
            return;
        }
        const expr = this.value;
        const listener = ({ value }: { value: any }) => {
            if (this.alive) this.setEnabled(!!value);
        };
        const scope = this.engine.findScopeByEl(this.el) as RippleScope | undefined;
        if (scope && typeof scope.watch === "function") {
            const initial = scope.watch(expr, listener);
            this.setEnabled(!!initial);
        } else {
            const watcher = (this.engine as any).store.watch(expr, listener) as RippleWatcher;
            this.valueOff = () => watcher?.off?.();
            this.setEnabled(!!this.engine.store.read?.(expr));
        }
    }

    /* ── 状态机 ── */

    /** 值总开关翻转：转假 → 播完当前周期再停；转真 → always 立即启动 / hover 待悬停 */
    private setEnabled(on: boolean): void {
        if (this.enabled === on) return;
        this.enabled = on;
        if (!on) {
            this.pendingStart = false;
            if (this.playing) this.scheduleStop();
            return;
        }
        if (this.config.trigger === "always") {
            this.requestStart();
        }
        // hover 模式转真：不自动播放，等下一次 mouseenter（语义：值开 ≠ 播放，触发器才是播放时机）
    }

    /** hover 接线：进入播放、移出播完当前周期（决策 6 同款停止语义） */
    private bindHover(): void {
        const el = this.el;
        const onEnter = () => {
            if (this.enabled) this.requestStart();
        };
        const onLeave = () => {
            if (this.playing) this.scheduleStop();
        };
        el.addEventListener("mouseenter", onEnter);
        el.addEventListener("mouseleave", onLeave);
        this.offHover = () => {
            el.removeEventListener("mouseenter", onEnter);
            el.removeEventListener("mouseleave", onLeave);
        };
    }

    /**
     * click 接线：点击启动（start 内按触发器自动排周期末收口——一个完整周期后停止），
     * 在播中连点忽略（requestStart 的 playing 守卫，不重启不打断）；值关（enabled=false）
     * 点击不播。载体未定时走 requestStart 的挂起探测链（连接后续播 + 自动收口）。
     */
    private bindClick(): void {
        const el = this.el;
        const onClick = () => {
            if (!this.enabled || this.playing) return;
            this.requestStart();
        };
        el.addEventListener("click", onClick);
        this.offClick = () => el.removeEventListener("click", onClick);
    }

    /** 请求启动：形态已定直接 start；未定则挂起并探测（等待宿主连接文档） */
    private requestStart(): void {
        if (this.playing) return;
        if (this.carrier != null) {
            this.start();
            return;
        }
        this.pendingStart = true;
        if (this.probeTimer == null) this.probeCarrier();
    }

    /**
     * 探测定形态：宿主连接后探测伪元素占用 → 伪元素/子元素形态，随后续播挂起请求。
     *
     * 用 setTimeout 而非 rAF：探测本质只需「连接后的一次异步机会」（Compile created 时
     * 宿主尚未连接文档，detached 的 getComputedStyle 伪元素解析不可靠）；rAF 在无渲染
     * 泵的环境（happy-dom）不调度，setTimeout 双环境语义一致。未连接则下一拍重试
     * （x-if 等结构延迟挂载；destroy 取消探测）。
     */
    private probeCarrier(): void {
        this.probeTimer = setTimeout(() => {
            this.probeTimer = null;
            if (!this.el?.isConnected) {
                if (this.pendingStart || this.config.trigger !== "always") this.probeCarrier();
                return;
            }
            this.carrier = ((this.constructor as typeof RippleDirective).probe ?? probePseudoOccupied)(this.el)
                ? "element"
                : "pseudo";
            this.el.classList.add(HOST_CLASS);
            if (this.config.badge > 0) this.el.classList.add(BADGE_CLASS);
            if (this.carrier === "element") this.injectLayers();
            if (this.pendingStart) {
                this.pendingStart = false;
                this.start();
            }
        }, 0);
    }

    /** 启动播放：写动画变量 + 加激活类（伪元素）或设置 layer animation（子元素） */
    private start(): void {
        if (this.stopTimer != null) {
            clearTimeout(this.stopTimer);
            this.stopTimer = null;
        }
        this.applyCssVars();
        const anim = `${this.animName} ${this.config.speed + this.config.gap}ms ease-out infinite`;
        if (this.carrier === "pseudo") {
            this.el.classList.add(ACTIVE_CLASS);
            if (this.config.type === "echo") this.el.classList.add(ECHO_CLASS);
        } else {
            this.layers.forEach((layer, i) => {
                layer.style.animation = anim;
                // click 双环同时起波：第二环同心缩小（0.6×）；always/hover 错相位同尺寸
                if (i > 0) {
                    layer.style.animationDelay = `${this.echoDelay}ms`;
                    layer.style.setProperty("--x-ripple-size", `${this.echoSize}px`);
                }
            });
        }
        this.activatedAt = performance.now();
        this.playing = true;
        // click 触发器单周期收口：启动即排周期末停止（elapsed≈0 → remaining=整周期），
        // 挂起探测的延迟启动同样经此自动收口，无需调用方分别处理
        if (this.config.trigger === "click") this.scheduleStop();
    }

    /** 播完当前周期再停（决策 6）：剩余 = 周期 - (已播 mod 周期)，到期移除动画复位载体。
     * 窗口恒为整周期（speed+gap，含末尾静止段）——echo+click 的第二环经压缩时长同拍收束。 */
    private scheduleStop(): void {
        if (this.stopTimer != null) clearTimeout(this.stopTimer);
        const period = this.config.speed + this.config.gap;
        const elapsed = performance.now() - this.activatedAt;
        const remaining = Math.max(0, period - (elapsed % period));
        this.stopTimer = setTimeout(() => {
            this.stopTimer = null;
            this.playing = false;
            if (this.carrier === "pseudo") {
                this.el.classList.remove(ACTIVE_CLASS, ECHO_CLASS);
            } else {
                for (const layer of this.layers) layer.style.animation = "";
            }
        }, remaining);
    }

    /* ── 载体与变量 ── */

    /** 动画名（参数组合 keyframes，全局去重缓存） */
    private get animName(): string {
        return ensureKeyframes(this.config);
    }

    /**
     * echo 第二环相位差（决策 4 修订，2026-10-24 用户三度反馈后定稿「双环一次起波」）：
     * always/hover 恒定错相位 = -周期/2（一波未平一波又起——双环回声本义）；click = 0
     * （双环**同时**起波——任何非零错位都会呈现第二道波峰，观感即「执行两遍」）。
     * 双环区分改走尺寸通道（echoSize 同心缩小），起波事件严格一个。
     */
    private get echoDelay(): number {
        const period = this.config.speed + this.config.gap;
        return this.config.trigger === "click" ? 0 : -period / 2;
    }

    /**
     * echo 第二环尺寸：click 下同心缩小至 0.6 倍（一环一次波的双环区分手段）；
     * always/hover 错相位双环同尺寸（回声本义不变）。
     */
    private get echoSize(): number {
        return this.config.trigger === "click" ? Math.round(this.config.size * 0.6 * 10) / 10 : this.config.size;
    }

    /** 实例级 CSS 变量落位（宿主 style 上，子元素载体经继承读取） */
    private applyCssVars(): void {
        const style = this.el.style;
        style.setProperty("--x-ripple-color", this.config.color || THEME_COLOR_VAR);
        style.setProperty("--x-ripple-size", `${this.config.size}px`);
        style.setProperty("--x-ripple-duration", `${this.config.speed + this.config.gap}ms`);
        style.setProperty("--x-ripple-anim", this.animName);
        style.setProperty("--x-ripple-echo-delay", `${this.echoDelay}ms`);
        style.setProperty("--x-ripple-echo-size", `${this.echoSize}px`);
        if (this.config.badge > 0) style.setProperty("--x-ripple-badge-size", `${this.config.badge}px`);
    }

    /**
     * 注入降级子元素载体（echo 双环注入两个）：absolute 脱离文档流，不参与 flex/gap 布局。
     * badge 启用时层同样定位为右上角正圆（与伪元素形态同几何，内联样式承载——降级层本就全内联）。
     */
    private injectLayers(): void {
        const count = this.config.type === "echo" ? 2 : 1;
        const badge = this.config.badge > 0 ? this.config.badge : 0;
        for (let i = 0; i < count; i++) {
            const layer = document.createElement("span");
            layer.className = LAYER_CLASS;
            layer.style.cssText = badge
                ? `position:absolute;top:${-badge / 2}px;right:${-badge / 2}px;width:${badge}px;height:${badge}px;` +
                  `border-radius:50%;background:var(--x-ripple-color);pointer-events:none;display:block;z-index:${BADGE_Z_INDEX};`
                : "position:absolute;inset:0;border-radius:inherit;pointer-events:none;display:block;";
            this.el.appendChild(layer);
            this.layers.push(layer);
        }
    }
}

/* ──────────────── 插件自举（ADR-0002 决策 1；注册通道见模块头「注册通道」节） ──────────────── */

/** spec 基类实例 → 控制器挂靠表（spec 钩子委托的桥；实例随基类实例 GC 回收） */
const controllers = new WeakMap<object, RippleDirective>();

/** spec 钩子入口（mounted）：建控制器挂靠 + 转发（el 为 dispatcher 注入的宿主） */
function rippleMounted(this: { engine: AutoSpark<any>; el: HTMLElement; info: Record<string, any> }): void {
    if (!this.el) return;
    const controller = new RippleDirective(this.engine, this.info);
    controller.el = this.el;
    controllers.set(this, controller);
    controller.mounted();
}

/** spec 钩子入口（unmounted）：转发 + 摘挂靠 */
function rippleUnmounted(this: object): void {
    const controller = controllers.get(this);
    controllers.delete(this);
    controller?.unmounted();
}

/** spec 钩子入口（attrChanged）：转发（实例保留，仅重绑值订阅） */
function rippleAttrChanged(this: object, newVal: string, oldVal?: string): void {
    controllers.get(this)?.attrChanged(newVal, oldVal);
}

/**
 * 指令 spec（`AutoSpark.directive(spec)` spec 重载）：Runtime 通道 + 三钩子委托。
 * kind/priority 挂类静态；钩子挂原型（this = engine 侧造的基类实例）。singleton 与
 * initialize/dispose 均取基类默认（单例去重 + no-op）——无类级资源。
 */
const RIPPLE_SPEC: DirectiveSpec = {
    name: "ripple",
    kind: 1, // Runtime（observer 通道，ADR-0002 决策 3 修订）
    priority: 0,
    mounted: rippleMounted as DirectiveSpec["mounted"],
    unmounted: rippleUnmounted as DirectiveSpec["unmounted"],
    attrChanged: rippleAttrChanged as DirectiveSpec["attrChanged"],
};

/**
 * 双路径注册（模块加载期执行一次）：
 *
 * - `globalThis.AutoSpark` 已存在（引擎脚本先加载）→ 经类静态 `directive(spec)` 入安装器
 *   队列（构造期 setupPluginQueue 消费；存活 engine 广播即时安装）；
 * - 否则（IIFE 先于引擎加载 / ESM 无全局）→ 包成插件体推入 `globalThis.__AUTOSPARK_PLUGINS__`
 *   预加载队列，首个 engine 构造开头 drain（早于同构造的 setupPluginQueue 消费与首编译）。
 *
 * 两路径殊途同归 `AutoSpark.directive(spec)`——唯一公共入口保证参与首编译（编译器
 * `_runtimeKeepAttr` 保留 x-ripple 属性的前提是指令先注册）。
 */
export function bootstrapRipplePlugin(): void {
    installPlugin("x-ripple", "directive", (autospark) => {
        captureNamespace(autospark); // 运行时桥命名空间捕获（对称 notifications；本指令当前零符号消费，预留统一通道）
        autospark.directive(RIPPLE_SPEC);
    });
}

// 模块加载即自举（对称 notifications 插件：置于模块尾部）
bootstrapRipplePlugin();
