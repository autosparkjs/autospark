/**
 * 装饰动效家族共享内核（x-ripple / x-spin 双指令的源码级共享层，ADR-0007 决策 1）。
 *
 * 非插件入口——本目录不自举、无产物，仅被 x-ripple / x-spin 两个插件入口导入，构建时
 * 随各产物独立内联（自包含闭包契约 ADR-0003 允许产物级重复；聚合产物 autospark.plugins.js
 * 经 ESM 模块图去重仅存一份）。内部模块命名不受领域词汇退役约束。
 *
 * ## 家族共享契约（自 x-spark 伞形指令平移，语义零漂移）
 *
 * - **值三态**（ADR-0002 决策 3）：无值恒开 / 表达式 truthiness（响应式订阅，宿主 scope
 *   命中走 scope.watch——x-data 局部变量可读；无 scope 回退 engine.store.watch 绝对路径）/
 *   字面 `"false"` 恒关。属性值变化重建订阅（attrChanged）。
 * - **触发器**：`always`（缺省，持续循环）/ `hover`（悬停播放、移出播完当前周期）/
 *   `click`（每次点击播放一个完整周期后停止，在播中连点忽略）；三通道声明（trigger 显式键 /
 *   hover、always、click 布尔开关键 / 点修饰符），并存按 hover > always > click 取先。
 * - **停止语义**（ADR-0002 决策 6）：值转假或 hover 移出时不打断在播周期——按已播时长
 *   取模计算当前周期剩余时间，延迟到周期末移除动画（周期末本就近乎透明，复位即自然消失）；
 *   周期起点以启动时刻近似（performance.now()，误差一帧内，装饰动画无需帧级精确）。
 * - **载体策略**（ADR-0002 决策 5）：伪元素优先（宿主标记类 + 激活类），零 DOM 侵入；
 *   `getComputedStyle(el, '::after').content` 探测宿主自身伪元素占用（探测须在加激活类
 *   **之前**——激活类自带 content:"" 会自我命中），占用或宿主未连接前不定形态；占用 →
 *   自动降级为注入 position:absolute 子元素（脱离文档流不参与 flex/gap 布局）。探测
 *   setTimeout 等待宿主连接文档后定型（detached 的 getComputedStyle 伪元素解析不可靠；
 *   happy-dom 等无渲染泵环境 rAF 不调度，setTimeout 双环境语义一致），再启动挂起的播放。
 * - **徽标（badge，家族通用）**：`badge?: boolean | number`——true = 宿主右上角 8px 正圆
 *   载体（圆心恰在宿主 border box 右上角顶点，一半悬于宿主外）/ 正数字 = 自定义直径 px /
 *   非法值 warn 后不启用；启用且未显式给 color 时 color 缺省联动主题语义红。载体 z-index
 *   取 CSS 最大值覆盖宿主内容（受宿主层叠上下文约束）；宿主 overflow:hidden 会裁剪 badge
 *   （文档说明，不强制干预）。
 * - **配置归一宽松策略**：枚举/数值校验，非法值 warn 并回退默认，不中断渲染（装饰性动画
 *   的配置错误不致命）；显式 false 压制开关键（JSON 键占位阻断 modifier 注入）。
 * - **注册通道**：`AutoSpark.directive(spec)` spec 重载安装器队列（插件指令的唯一公共
 *   入口，ADR-0002 决策 2 + 决策 3 修订）：engine 侧造类（继承基类）→ 挂 spec 钩子 →
 *   指令安装器入插件机制的模块内存队列（ADR-0111 决策 5），engine 构造期 setupPluginQueue
 *   （DirectiveManager 创建后、autostart compile **前**）消费——指令参与首编译，编译器
 *   `_runtimeKeepAttr` 保留 `x-<name>` / `x-<name>-options` 属性的前提是指令先注册；
 *   晚入队（engine 已存活）广播即时安装。通道选择 Runtime（observer）而非 Compile（scope）：
 *   装饰动效是纯呈现副作用（无编译期变换、无子树占有），observer 的 mounted/unmounted/
 *   attrChanged 与其生命周期天然同构。spec 钩子的 this 是 engine 侧造的基类实例，控制器
 *   {@link DecorateDirective} 经 WeakMap 挂靠委托——实例状态全在控制器，spec 钩子只做
 *   存取转发。
 * - **双路径自举**（ADR-0002 决策 1，单点收敛于 @autospark/utils 的 installPlugin）：
 *   `globalThis.AutoSpark` 已存在（引擎脚本先加载）→ 直接入安装器队列；否则推
 *   `__AUTOSPARK_PLUGINS__` 预加载队列，首个 engine 构造开头 drain（早于同构造的
 *   setupPluginQueue 消费与首编译）。
 *
 * ## 结构
 *
 * 指令间差异全部收敛为 {@link DecorateStrategy}（配置归一 / 样式注入 / 动画名 / 载体类 /
 * 降级层样式 / CSS 变量落位 / 周期时长），状态机与生命周期由 {@link DecorateDirective}
 * 统一承载——两指令共享同一份状态机实现，行为差异显式落在策略对象上，杜绝漂移。
 */

import type { AutoSpark, DirectiveSpec } from "autospark";
import { captureNamespace } from "../runtime/bridge";
import { installPlugin } from "@autospark/utils";

/* ────────────────────────── 家族共享类型与常量 ────────────────────────── */

/** 触发器（家族统一）：always 持续循环 / hover 仅悬停期间播放 / click 每次点击播放一个完整周期后停止 */
export type DecorateTrigger = "always" | "hover" | "click";

/** 触发器归一优先序：多处声明并存时取先者（缺省 always 垫底——跨通道统一值序） */
export const TRIGGER_PRIORITY: readonly DecorateTrigger[] = ["hover", "always", "click"];

/* 主题化色链（ADR-0129 三级样式回退链）：theme 派生令牌 → 覆盖变量（按插件独立覆盖位，
   Q17 决策）→ theme 默认浅色校准值。色链经 inline 变量写入，暗色兜底变体不适用 inline
   ——theme 缺席 + dark 下主色兜底取浅色校准值（暗底可辨）；theme 在场时第一级自动跟随暗色 */
/** 涟漪缺省色链（x-ripple）：主题主色 → --autospark-ripple-color → 校准值 */
export const RIPPLE_COLOR_VAR = "var(--auto-theme-color, var(--autospark-ripple-color, #009aff))";

/** 旋噪缺省色链（x-spin）：主题主色 → --autospark-spin-color → 校准值 */
export const SPIN_COLOR_VAR = "var(--auto-theme-color, var(--autospark-spin-color, #009aff))";

/** 涟漪徽标缺省色链（badge 家族特性）：主题语义红 → --autospark-ripple-badge-color → 校准值 */
export const RIPPLE_BADGE_COLOR =
    "var(--auto-danger-color, var(--autospark-ripple-badge-color, #ef4444))";

/** 旋噪徽标缺省色链（badge 家族特性）：主题语义红 → --autospark-spin-badge-color → 校准值 */
export const SPIN_BADGE_COLOR = "var(--auto-danger-color, var(--autospark-spin-badge-color, #ef4444))";

/** 徽标火花默认直径 px（badge: true 时） */
export const BADGE_DEFAULT_SIZE = 8;

/** 徽标载体 z-index（CSS 最大值：覆盖宿主内容与同上下文定位元素；受宿主层叠上下文约束） */
export const BADGE_Z_INDEX = 2147483647;

/** 缺省速度回退值（speed 非法/非正回退，两指令同源） */
export const DEFAULT_SPEED = 3000;

/** 宿主 scope 最小结构契约（鸭子类型：值表达式响应式订阅，零 engine 类型依赖） */
interface DecorateScope {
    watch(expr: string, cb: (payload: { value: any }) => void): any;
}

/** 全局 store fallback watcher 的最小 off 契约 */
interface DecorateWatcher {
    off?: () => void;
}

/* ────────────────────────── 共享归一 helpers ────────────────────────── */

/** 非负数值归一：缺失返回 undefined；非法 warn 后返回 undefined（调用方回退默认） */
export function normalizeNumber(
    raw: Record<string, any> | undefined,
    key: string,
    warn: (msg: string) => void,
    name: string,
): number | undefined {
    const v = raw?.[key];
    if (v === undefined) return undefined;
    if (typeof v !== "number" || !Number.isFinite(v) || v < 0) {
        warn(`${name}: ${key} 须为非负数字，已回退默认值`);
        return undefined;
    }
    return v;
}

/** speed 归一：非负数字 + 正数校验（总周期为 0 将无法产生动画），非法/非正回退 DEFAULT_SPEED */
export function normalizeSpeed(raw: Record<string, any> | undefined, warn: (msg: string) => void, name: string): number {
    const v = normalizeNumber(raw, "speed", warn, name) ?? DEFAULT_SPEED;
    if (v <= 0) {
        warn(`${name}: speed 须为正数（总周期为 0 将无法产生动画），已回退 ${DEFAULT_SPEED}`);
        return DEFAULT_SPEED;
    }
    return v;
}

/**
 * 触发器三通道归一：trigger 显式键 + hover/always/click 布尔开关键（`x-<name>.hover` 等
 * 修饰符经引擎解析期等价注入为布尔键——getDirectives.ts 的 modifier 开关注入，与
 * options JSON 同一落点）。多处并存按 TRIGGER_PRIORITY 取先；均未声明回退默认 always。
 */
export function normalizeTrigger(raw: Record<string, any> | undefined, warn: (msg: string) => void, name: string): DecorateTrigger {
    const seen = new Set<DecorateTrigger>();
    if (raw?.trigger !== undefined) {
        if (TRIGGER_PRIORITY.includes(raw.trigger)) seen.add(raw.trigger);
        else warn(`${name}: trigger 取值非法（${JSON.stringify(raw.trigger)}），已忽略`);
    }
    for (const key of TRIGGER_PRIORITY) {
        const v = raw?.[key];
        if (v === true) seen.add(key);
        else if (v !== undefined && v !== false) warn(`${name}: ${key} 开关须为布尔值，已忽略`);
    }
    return TRIGGER_PRIORITY.find((t) => seen.has(t)) ?? "always";
}

/**
 * 布尔开关键收集（形态词表/触发器词表共用）：true 收集、false 压制（JSON 键占位阻断
 * modifier 注入）、其余非布尔值 warn 忽略。
 */
export function collectSwitches(
    raw: Record<string, any> | undefined,
    keys: readonly string[],
    warn: (msg: string) => void,
    name: string,
): Set<string> {
    const seen = new Set<string>();
    if (!raw) return seen;
    for (const key of keys) {
        const v = raw[key];
        if (v === true) seen.add(key);
        else if (v !== undefined && v !== false) warn(`${name}: ${key} 开关须为布尔值，已忽略`);
    }
    return seen;
}

/** 跨指令键 warn 忽略（ADR-0007 决策 2）：声明兄弟指令形态词表的键时警告忽略不中断渲染 */
export function warnCrossWords(
    raw: Record<string, any> | undefined,
    words: readonly string[],
    otherName: string,
    warn: (msg: string) => void,
    name: string,
): void {
    if (!raw) return;
    for (const key of words) {
        const v = raw[key];
        if (v !== undefined && v !== false) warn(`${name}: ${key} 是 ${otherName} 的形态键，已忽略`);
    }
}

/** badge 归一：true = 默认直径；正数字 = 自定义直径 px；false/缺省 = 不启用；非法值 warn 后不启用 */
export function normalizeBadge(raw: Record<string, any> | undefined, warn: (msg: string) => void, name: string): number {
    const v = raw?.badge;
    if (v === undefined || v === false) return 0;
    if (v === true) return BADGE_DEFAULT_SIZE;
    if (typeof v === "number" && Number.isFinite(v) && v > 0) return v;
    warn(`${name}: badge 须为 true 或正数字（直径 px），已忽略`);
    return 0;
}

/** 插件缺省色对（ADR-0129：覆盖位按插件独立，resolveColor 由各插件传入自己的链常量） */
export interface DecorateDefaultColors {
    /** 常态缺省色链（主题主色系） */
    color: string;
    /** badge 启用时的缺省色链（主题语义红系） */
    badgeColor: string;
}

/** color 归一：显式非空字符串恒优先；badge 启用且未显式给 color → 语义红链；其余回退主色链 */
export function resolveColor(
    rawColor: unknown,
    defaults: DecorateDefaultColors,
    badge: number,
    warn: (msg: string) => void,
    name: string,
): string {
    if (rawColor !== undefined) {
        if (typeof rawColor === "string" && rawColor.trim() !== "") return rawColor;
        warn(`${name}: color 须为非空字符串，已回退默认色`);
    }
    return badge > 0 ? defaults.badgeColor : defaults.color;
}

/* ────────────────────────── 降级层几何 helpers ────────────────────────── */

/** 全域载体几何（inset:0 铺满宿主，圆角继承） */
export function fullLayerGeometry(): string {
    return `position:absolute;inset:0;border-radius:inherit;pointer-events:none;display:block;`;
}

/** 徽标载体几何：宿主右上角正圆（圆心恰在 border box 右上角顶点，一半悬于宿主外） */
export function badgeLayerGeometry(badge: number): string {
    return (
        `position:absolute;top:${-badge / 2}px;right:${-badge / 2}px;width:${badge}px;height:${badge}px;` +
        `border-radius:50%;pointer-events:none;display:block;z-index:${BADGE_Z_INDEX};`
    );
}

/* ────────────────────────── 策略接口 ────────────────────────── */

/**
 * 指令差异策略面：x-ripple / x-spin 的全部行为差异显式落在此接口（状态机零分叉）。
 * C 为各指令归一后的全量配置类型（至少携带 trigger 供状态机分流）。
 */
export interface DecorateStrategy<C> {
    /** 宿主标记类（position 兜底 + CSS 变量默认值；无伪元素定义——伪元素挂在激活类上） */
    hostClass: string;
    /** 激活类：伪元素载体定义 + animation 生效开关 */
    activeClass: string;
    /** 降级子元素载体类 */
    layerClass: string;
    /** 注入静态样式（首个实例 mounted 时执行一次；模块级幂等——文档级共享，多 engine 安全） */
    ensureStyles(): void;
    /** 配置归一（宽松策略）：枚举/数值校验，非法值 warn 并回退默认 */
    normalize(raw: Record<string, any> | undefined, warn: (msg: string) => void): C;
    /** 探测定型时随宿主标记类一并添加的类（形态类 / 徽标类） */
    hostClasses(cfg: C): string[];
    /** 伪元素激活时随激活类一并添加的类（如涟漪 echo 双环标记） */
    activeClasses(cfg: C): string[];
    /** 动画名（涟漪参数组合 keyframes 全局去重缓存 / spin 固定角度 keyframes） */
    animName(cfg: C): string;
    /** 完整 animation 简写（名称 时长 缓动 循环） */
    animationCss(cfg: C, anim: string): string;
    /** 周期时长 ms（播完当前周期的收口窗口与剩余计算基准） */
    period(cfg: C): number;
    /** 降级子元素层数 */
    layerCount(cfg: C): number;
    /** 降级子元素内联样式（不含 animation——start 时由控制器统一写入） */
    layerCssText(cfg: C): string;
    /** 降级子元素激活追加样式（如涟漪 echo 第二环 delay/size；可选） */
    applyLayerExtras?(layers: HTMLElement[], cfg: C): void;
    /** 实例级 CSS 变量落位（宿主 style 上，子元素载体经继承读取） */
    applyVars(el: HTMLElement, cfg: C, anim: string): void;
}

/* ────────────────────────── 伪元素占用探测 ────────────────────────── */

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

/* ────────────────────────── 通用控制器 ────────────────────────── */

/**
 * 装饰动效通用控制器：实例状态与全部状态机逻辑的宿主，指令差异经策略对象注入。
 *
 * 生命周期：`mounted()` 样式注入 + 配置落位 + 值订阅 + 接线触发器；`unmounted()` 清理
 * 定时器、载体与宿主类（scope 通道 watcher 由 scope.destroy 统一回收，fallback 句柄自行 off）。
 *
 * 状态机（enabled = 值 truthiness 总开关；playing = 当前是否在播）：
 * - enabled=false → 永不播放；转假时若在播 → 播完当前周期再停（决策 6）；
 * - enabled=true → always 立即启动循环；hover 待 mouseenter 播放、mouseleave 播完当前周期。
 */
export class DecorateDirective<C extends { trigger: DecorateTrigger }> {
    /**
     * 载体探测函数（类静态，测试可替换以驱动「伪元素被占用 → 降级子元素」路径；
     * 运行时恒为 {@link probePseudoOccupied}——两指令共享同一静态，测试 afterEach 复位）。
     */
    static probe: (el: HTMLElement) => boolean = probePseudoOccupied;

    strategy: DecorateStrategy<C>;
    engine: AutoSpark<any>;
    info: Record<string, any>;
    el: HTMLElement;

    /** 原始指令值（表达式字符串；无值 undefined = 恒开） */
    value: string | undefined;
    /** 归一后的全量配置 */
    config: C;

    /** 存活标记：unmounted 后值订阅回调短路（scope.watch 无句柄，真 off 留给 scope.destroy） */
    private alive = true;
    /** 值总开关（truthiness）；false 时永不播放 */
    private enabled = true;
    /** 当前是否在播 */
    private playing = false;
    /** 载体形态（探测定时器定型后赋值；null = 未定） */
    private carrier: "pseudo" | "element" | null = null;
    /** 降级子元素载体 */
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

    constructor(strategy: DecorateStrategy<C>, engine: AutoSpark<any>, info: Record<string, any>) {
        this.strategy = strategy;
        this.engine = engine;
        this.info = info;
        this.value = info?.value;
        this.config = strategy.normalize(info?.options, (msg) => this.warn(msg));
    }

    /** 指令级 warn 快捷方法（对齐基类纪律；消息前缀由各策略自带指令名） */
    private warn(msg: string): void {
        this.engine.logger.warn(msg);
    }

    /**
     * observer 通道入口（dispatcher mount 时调用，宿主已注入）：样式注入 + 配置落位 +
     * 值订阅 + 触发器接线。此时宿主可能尚未连接文档（engine.el detached）——载体探测经
     * setTimeout 等待连接（见 probeCarrier）。
     */
    mounted(): void {
        if (!this.el) return;
        this.strategy.ensureStyles();
        this.applyVars();
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

    /** observer 卸载（元素移除 / engine.destroy）：清定时器/订阅、摘载体与宿主类、解绑事件 */
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
        this.el?.classList.remove(
            this.strategy.hostClass,
            this.strategy.activeClass,
            ...this.strategy.hostClasses(this.config),
            ...this.strategy.activeClasses(this.config),
        );
        this.playing = false;
    }

    /**
     * 属性值变化（observer attrChanged）：重建值订阅（新表达式生效），状态机按新值复位。
     * 载体/事件接线不重建（形态与配置无关，options 静态求值一次）。
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
     * 值订阅（ADR-0002 决策 3）：宿主 scope 命中走 scope.watch（相对表达式可用——x-data 局部
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
        const scope = this.engine.findScopeByEl(this.el) as DecorateScope | undefined;
        if (scope && typeof scope.watch === "function") {
            const initial = scope.watch(expr, listener);
            this.setEnabled(!!initial);
        } else {
            const watcher = (this.engine as any).store.watch(expr, listener) as DecorateWatcher;
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
            this.carrier = ((this.constructor as typeof DecorateDirective).probe ?? probePseudoOccupied)(this.el)
                ? "element"
                : "pseudo";
            this.el.classList.add(this.strategy.hostClass, ...this.strategy.hostClasses(this.config));
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
        this.applyVars();
        const anim = this.strategy.animationCss(this.config, this.strategy.animName(this.config));
        if (this.carrier === "pseudo") {
            this.el.classList.add(this.strategy.activeClass, ...this.strategy.activeClasses(this.config));
        } else {
            for (const layer of this.layers) layer.style.animation = anim;
            this.strategy.applyLayerExtras?.(this.layers, this.config);
        }
        this.activatedAt = performance.now();
        this.playing = true;
        // click 触发器单周期收口：启动即排周期末停止（elapsed≈0 → remaining=整周期），
        // 挂起探测的延迟启动同样经此自动收口，无需调用方分别处理
        if (this.config.trigger === "click") this.scheduleStop();
    }

    /** 播完当前周期再停（决策 6）：剩余 = 周期 - (已播 mod 周期)，到期移除动画复位载体 */
    private scheduleStop(): void {
        if (this.stopTimer != null) clearTimeout(this.stopTimer);
        const period = this.strategy.period(this.config);
        const elapsed = performance.now() - this.activatedAt;
        const remaining = Math.max(0, period - (elapsed % period));
        this.stopTimer = setTimeout(() => {
            this.stopTimer = null;
            this.playing = false;
            if (this.carrier === "pseudo") {
                this.el.classList.remove(this.strategy.activeClass, ...this.strategy.activeClasses(this.config));
            } else {
                for (const layer of this.layers) layer.style.animation = "";
            }
        }, remaining);
    }

    /* ── 载体与变量 ── */

    /** 实例级 CSS 变量落位（宿主 style 上，子元素载体经继承读取） */
    private applyVars(): void {
        this.strategy.applyVars(this.el, this.config, this.strategy.animName(this.config));
    }

    /** 注入降级子元素载体（absolute 脱离文档流，不参与 flex/gap 布局；层数由策略决定） */
    private injectLayers(): void {
        const count = this.strategy.layerCount(this.config);
        for (let i = 0; i < count; i++) {
            const layer = document.createElement("span");
            layer.className = this.strategy.layerClass;
            layer.style.cssText = this.strategy.layerCssText(this.config);
            this.el.appendChild(layer);
            this.layers.push(layer);
        }
    }
}

/* ────────────────────────── spec 构造与自举 ────────────────────────── */

/** spec 基类实例 → 控制器挂靠表（spec 钩子委托的桥；实例随基类实例 GC 回收） */
const controllers = new WeakMap<object, DecorateDirective<any>>();

/** spec 钩子的 this 契约面（engine/info/el，与基类实例一致） */
interface SpecThis {
    engine: AutoSpark<any>;
    el: HTMLElement;
    info: Record<string, any>;
}

/**
 * 指令 spec 构造（`AutoSpark.directive(spec)` spec 重载）：Runtime 通道 + 三钩子委托。
 * kind/priority 挂类静态；钩子挂原型（this = engine 侧造的基类实例）。singleton 与
 * initialize/dispose 均取基类默认（单例去重 + no-op）——无类级资源。
 */
export function createDecorateSpec<C extends { trigger: DecorateTrigger }>(
    name: string,
    strategy: DecorateStrategy<C>,
): DirectiveSpec {
    /** spec 钩子入口（mounted）：建控制器挂靠 + 转发（el 为 dispatcher 注入的宿主） */
    function mounted(this: SpecThis): void {
        if (!this.el) return;
        const controller = new DecorateDirective(strategy, this.engine, this.info);
        controller.el = this.el;
        controllers.set(this, controller);
        controller.mounted();
    }
    /** spec 钩子入口（unmounted）：转发 + 摘挂靠 */
    function unmounted(this: object): void {
        const controller = controllers.get(this);
        controllers.delete(this);
        controller?.unmounted();
    }
    /** spec 钩子入口（attrChanged）：转发（实例保留，仅重绑值订阅） */
    function attrChanged(this: object, newVal: string): void {
        controllers.get(this)?.attrChanged(newVal);
    }
    return {
        name,
        kind: 1, // Runtime（observer 通道，ADR-0002 决策 3 修订）
        priority: 0,
        mounted: mounted as DirectiveSpec["mounted"],
        unmounted: unmounted as DirectiveSpec["unmounted"],
        attrChanged: attrChanged as DirectiveSpec["attrChanged"],
    };
}

/**
 * 双路径注册（各插件入口模块加载期执行一次）：
 *
 * - `globalThis.AutoSpark` 已存在（引擎脚本先加载）→ 经类静态 `directive(spec)` 入安装器
 *   队列（构造期 setupPluginQueue 消费；存活 engine 广播即时安装）；
 * - 否则（IIFE 先于引擎加载 / ESM 无全局）→ 包成插件体推入 `globalThis.__AUTOSPARK_PLUGINS__`
 *   预加载队列，首个 engine 构造开头 drain（早于同构造的 setupPluginQueue 消费与首编译）。
 *
 * 两路径殊途同归 `AutoSpark.directive(spec)`——唯一公共入口保证参与首编译（编译器
 * `_runtimeKeepAttr` 保留 x-<name> 属性的前提是指令先注册）。
 */
export function bootstrapDecoratePlugin(spec: DirectiveSpec): void {
    installPlugin((autospark) => {
        captureNamespace(autospark); // 运行时桥命名空间捕获（对称 notifications；当前零符号消费，预留统一通道）
        autospark.directive(spec);
    });
}
