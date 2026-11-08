/**
 * x-scrollbar 滚动条皮肤指令（ADR-0013）：为宿主元素叠加**渐显自定义滚动条**——
 * 隐藏原生滚动条，注入轨道（rail）+ 滑块（thumb）overlay 层，鼠标进入宿主渐显、
 * 移出延迟渐隐；不改变宿主布局与内容，原生滚动能力全保留。
 *
 * ## 内核路线（ADR-0013 决策 1：原生滚动保留的 overlay 路线）
 *
 * 参考库 perfect-scrollbar 的内核是 `overflow:hidden` + 手写五 handler（wheel/touch/
 * keyboard 全补偿），这是 2016 年浏览器无法隐藏原生滚动条时代的产物。本指令取其视觉
 * 与显隐交互（rail/thumb 形态、渐显渐隐、hover 增粗、minScrollbarLength），内核改走
 * 现代路线：宿主保留原生 `overflow:auto`，经 `scrollbar-width:none`（标准）+
 * `::-webkit-scrollbar{display:none}`（Chromium/Safari）隐藏原生滚动条——触摸、
 * 键盘滚动、无障碍原生免费。**例外（2026-11-08 修订）**：wheel 被 preventDefault
 * 接管走 rAF 平滑逼近——原生滚动走合成线程而轨道补偿经 scroll 事件回主线程恒滞后
 * 一帧，滚轮每格「滑块先随轨道被带走、补偿到达再弹回」（用户实测跳动）；接管后
 * 滚动写入与补偿**同帧**完成。缩放手势 / 边界方向 / 拖拽中放行，嵌套冒泡不破坏。
 *
 * ## 显隐语义（ADR-0013 决策 3：严格 enter/leave）
 *
 * - mouseenter → 轨道渐显（`fadeDuration` 过渡）；mouseleave → 延迟 `delay` ms 后渐隐
 *   （延迟防指针快速掠过闪灭）；
 * - 拖拽 / 轨道交互中强制维持显示（拖拽结束时按指针坐标补判定，指针已出宿主则补渐隐）；
 * - 键盘滚动**不**触发显示（忠实「仅 mouse 进入宿主时呈现」语义）；触摸设备无
 *   mouseenter → 滚动条永不显示，原生滚动照常（overlay 路线免费降级）。
 *
 * ## 交互（ADR-0013 决策 2：默认启用，无开关）
 *
 * - thumb 拖拽：Pointer Events + `setPointerCapture` 直接反写 `scrollTop/scrollLeft`；
 * - 轨道点击跳页：点击轨道空白处滚动一容器高（clientHeight/clientWidth），点击点在
 *   thumb 上侧向上、下侧向下（perfect-scrollbar click-rail 语义）；
 * - 滚轮 / 触摸 / 键盘滚动走宿主原生能力，`scroll` 事件同步 thumb 位置。
 *
 * ## 几何（ADR-0013 决策 4/5）
 *
 * - 方向**双向自动按需**（`.x`/`.y` 修饰符可限定单向）：哪个方向溢出（scroll 尺寸 >
 *   client 尺寸）才激活哪个方向的轨道，都不溢出则轨道不渲染（display:none）；
 * - 刷新三件套（决策 5，不上 MutationObserver——对 x-for 高频子树变化太贵）：
 *   `ResizeObserver`(宿主) + mouseenter 强制全量重算（显示前保证所见即所得）+
 *   `scroll` 事件同步 thumb 位置。鼠标悬停期间内容大幅变化导致 thumb 尺寸滞后的
 *   局限见文档注意事项。
 * - thumb 长度 = client/scroll 比例 × 轨道可用长（`minSize` 兜底、轨道全长封顶），
 *   位置 = 滚动进度 × 剩余空隙（perfect-scrollbar 同式）。
 *
 * ## 键面（x-scrollbar-options，静态求值一次——设计期配置，改值需重挂宿主）
 *
 * - `width`：轨道厚度 px（缺省 12）；`thumbWidth`：滑块粗细 px（缺省 5，hover/拖拽
 *   增粗 +5px 由样式内置）；
 * - `color`：滑块色，缺省中性灰链 `var(--autospark-scrollbar-color, rgba(0,0,0,0.25))`
 *   （暗色下可被外部覆盖变量调亮）；
 * - `delay`：mouseleave 后渐隐延迟 ms（缺省 300）；`fadeDuration`：渐显渐隐过渡 ms
 *   （缺省 200，`prefers-reduced-motion` 下停过渡直接切换）；
 * - `minSize`：thumb 最小长度 px（缺省 20，perfect-scrollbar `minScrollbarLength` 语义）。
 *
 * ## 契约（家族对齐 + 独立承载）
 *
 * - 值三态 / Runtime 通道 / 双路径自举 / attrChanged 仅重绑值订阅——语义对齐装饰
 *   动效家族契约（src/utils/decorate.ts，ADR-0002 决策 3）；但滚动条是**持续交互
 *   控件**（拖拽状态机 / scroll 同步 / ResizeObserver），与 DecorateStrategy 的
 *   装饰动效生命周期不同构，故控制器独立内聚本模块（ADR-0013 决策 6），仅复用
 *   decorate 的导出面（bootstrap / 数值归一），decorate.ts 零改动。
 * - 约定式（决策 7）：指令不碰宿主 `overflow` 与尺寸——宿主须自身是滚动容器
 *   （overflow:auto/scroll + 限定尺寸），不满足则指令静默不激活。
 * - 纯视觉（决策 8）：不写 store、不暴露滚动位置、不发信号；滚动位置读写用原生 API。
 * - rail 直挂宿主内部（决策 9，不 reparent——与 x-for 等结构指令零冲突）；宿主的
 *   子元素选择器（`> *` 类）可能误中 rail，文档注明。
 *
 * 自举：模块加载即执行 {@link bootstrapScrollbarPlugin}（decorate 同款双路径注册）。
 */

import {
    bootstrapDecoratePlugin,
    normalizeNumber,
} from "../../utils/decorate";
import type { AutoSpark, DirectiveSpec } from "autospark";

/** 方向：both 双向自动按需（缺省）/ x 仅横向 / y 仅纵向（`.x`/`.y` 修饰符限定） */
export type XScrollbarAxis = "both" | "x" | "y";

/** x-scrollbar-options 配置（静态求值一次，ADR-0013 决策 4） */
export interface XScrollbarOptions {
    /** 仅横向（`x-scrollbar.x` 修饰符同义注入） */
    x?: boolean;
    /** 仅纵向（`x-scrollbar.y` 修饰符同义注入） */
    y?: boolean;
    /** 轨道厚度 px，默认 12 */
    width?: number;
    /** 滑块粗细 px，默认 5（hover/拖拽增粗 +5px 样式内置） */
    thumbWidth?: number;
    /** 滑块色（任意合法 CSS 颜色值），缺省中性灰链 */
    color?: string;
    /** mouseleave 后渐隐延迟 ms，默认 300 */
    delay?: number;
    /** 渐显渐隐过渡时长 ms，默认 200 */
    fadeDuration?: number;
    /** thumb 最小长度 px，默认 20 */
    minSize?: number;
}

/** 归一后的全量配置（带默认值） */
interface ScrollbarConfig {
    axis: XScrollbarAxis;
    width: number;
    thumbWidth: number;
    color: string;
    delay: number;
    fadeDuration: number;
    minSize: number;
}

/** 滑块缺省色链：覆盖变量 → 校准值（中性灰，非主题主色系——暗色下可被外部变量调亮） */
const THUMB_COLOR_VAR = "var(--autospark-scrollbar-color, rgba(0,0,0,0.25))";

const DEFAULT_CONFIG: ScrollbarConfig = {
    axis: "both",
    width: 12,
    thumbWidth: 5,
    color: THUMB_COLOR_VAR,
    delay: 300,
    fadeDuration: 200,
    minSize: 20,
};

/** wheel 平滑逼近系数（每帧收敛比例，~0.25 约 10 帧内到位，近似原生滚轮手感；YAGNI 不开配置键） */
const WHEEL_EASE = 0.25;

/** 宿主标记类：隐藏原生滚动条 + 定位兜底 + CSS 变量默认值 */
const HOST_CLASS = "x-scrollbar";
/** 可见类（宿主）：轨道渐显开关（mouseenter 加 / leave 延迟摘） */
const VISIBLE_CLASS = "x-scrollbar-visible";
/** 方向激活类（宿主）：轨道 display 开关（refresh 按溢出方向 toggle） */
const ACTIVE_X_CLASS = "x-scrollbar-active-x";
const ACTIVE_Y_CLASS = "x-scrollbar-active-y";
/** 轨道 / 滑块 / 拖拽中滑块类 */
const RAIL_CLASS = "x-scrollbar-rail";
const RAIL_X_CLASS = "x-scrollbar-rail-x";
const RAIL_Y_CLASS = "x-scrollbar-rail-y";
const THUMB_CLASS = "x-scrollbar-thumb";
const THUMB_DRAG_CLASS = "x-scrollbar-thumb-drag";

/* ────────────────────────── 样式注入 ────────────────────────── */

/** 静态样式是否已注入（文档级共享，多 engine 安全——内容相同幂等） */
let stylesInjected = false;

/**
 * 注入静态样式（首个指令实例 mounted 时执行一次）：
 *
 * - 宿主标记类：`scrollbar-width:none`（标准）+ `::-webkit-scrollbar` 隐藏原生滚动条
 *   （overlay 路线核心，ADR-0013 决策 1）；`:where()` position 兜底特异性 0，宿主
 *   自有定位规则可覆盖；
 * - 轨道：默认 `display:none`（未激活方向）+ `opacity:0`（激活但未显示），可见类
 *   渐显；定位贴宿主内缘内缩 2px 全长，对向激活时才让位（互向不重叠）；
 * - 滑块：中性灰圆角条，hover / 拖拽增粗（+5px，样式内置），`user-select:none` 防拖拽选中；
 * - `prefers-reduced-motion: reduce`：停过渡直接切换（可访问性底线，家族同款）。
 */
function ensureStyles(): void {
    if (stylesInjected || typeof document === "undefined") return;
    stylesInjected = true;
    const style = document.createElement("style");
    style.setAttribute("data-x-scrollbar", "");
    style.textContent = `
:where(.${HOST_CLASS}) { position: relative; }
.${HOST_CLASS} {
  scrollbar-width: none;
  -ms-overflow-style: none;
  --x-scrollbar-width: 12px;
  --x-scrollbar-thumb: 5px;
  --x-scrollbar-color: rgba(0,0,0,0.25);
  --x-scrollbar-fade: 200ms;
}
.${HOST_CLASS}::-webkit-scrollbar { width: 0; height: 0; display: none; }
.${HOST_CLASS} .${RAIL_CLASS} {
  position: absolute;
  display: none;
  opacity: 0;
  transition: opacity var(--x-scrollbar-fade, 200ms) ease;
  pointer-events: none;
  /* 补偿 transform 与合成线程滚动同层应用，减轻 scroll 事件后置补偿的滞后抖动 */
  will-change: transform;
}
.${HOST_CLASS}.${ACTIVE_Y_CLASS} .${RAIL_Y_CLASS} { display: block; }
.${HOST_CLASS}.${ACTIVE_X_CLASS} .${RAIL_X_CLASS} { display: block; }
.${HOST_CLASS}.${VISIBLE_CLASS} .${RAIL_CLASS} {
  opacity: 1;
  pointer-events: auto;
}
/* 默认贴宿主内缘全长（thumb 可走满全程）；对向激活时才让位（互向不重叠，点击目标无歧义） */
.${HOST_CLASS} .${RAIL_Y_CLASS} {
  top: 2px;
  right: 2px;
  bottom: 2px;
  width: var(--x-scrollbar-width, 12px);
}
.${HOST_CLASS} .${RAIL_X_CLASS} {
  left: 2px;
  bottom: 2px;
  right: 2px;
  height: var(--x-scrollbar-width, 12px);
}
.${HOST_CLASS}.${ACTIVE_X_CLASS} .${RAIL_Y_CLASS} {
  bottom: calc(var(--x-scrollbar-width, 12px) + 4px);
}
.${HOST_CLASS}.${ACTIVE_Y_CLASS} .${RAIL_X_CLASS} {
  right: calc(var(--x-scrollbar-width, 12px) + 4px);
}
.${HOST_CLASS} .${THUMB_CLASS} {
  position: absolute;
  /* 滑块恒无边框——thumb/rail 是裸 span，宿主页面的全局/元素级边框规则可误中，皮肤自持 */
  border: none;
  border-radius: calc(var(--x-scrollbar-thumb, 5px) / 2);
  background: var(--x-scrollbar-color, rgba(0,0,0,0.25));
  user-select: none;
}
.${HOST_CLASS} .${RAIL_Y_CLASS} .${THUMB_CLASS} {
  right: 0;
  width: var(--x-scrollbar-thumb, 5px);
}
.${HOST_CLASS} .${RAIL_X_CLASS} .${THUMB_CLASS} {
  bottom: 0;
  height: var(--x-scrollbar-thumb, 5px);
}
/* hover / 拖拽增粗（+5px，观感反馈内置，perfect-scrollbar 同款节奏） */
.${HOST_CLASS} .${RAIL_Y_CLASS}:hover .${THUMB_CLASS},
.${HOST_CLASS} .${RAIL_Y_CLASS} .${THUMB_DRAG_CLASS} {
  width: calc(var(--x-scrollbar-thumb, 5px) + 5px);
}
.${HOST_CLASS} .${RAIL_X_CLASS}:hover .${THUMB_CLASS},
.${HOST_CLASS} .${RAIL_X_CLASS} .${THUMB_DRAG_CLASS} {
  height: calc(var(--x-scrollbar-thumb, 5px) + 5px);
}
@media (prefers-reduced-motion: reduce) {
  .${HOST_CLASS} .${RAIL_CLASS} { transition: none; }
}`;
    document.head.appendChild(style);
}

/* ────────────────────────── 配置归一 ────────────────────────── */

/**
 * 归一 options：宽松策略（家族同款——配置错误不致命，warn 回退不中断渲染）。
 * 方向为独立布尔开关（非互斥枚举）：`.x`/`.y` 任一声明即限定单向，均未声明双向按需。
 */
function normalizeConfig(
    raw: Record<string, any> | undefined,
    warn: (msg: string) => void,
): ScrollbarConfig {
    const cfg: ScrollbarConfig = { ...DEFAULT_CONFIG };
    if (!raw) return cfg;

    const axes = new Set<string>();
    for (const key of ["x", "y"] as const) {
        const v = raw[key];
        if (v === true) axes.add(key);
        else if (v !== undefined && v !== false) warn(`x-scrollbar: ${key} 开关须为布尔值，已忽略`);
    }
    if (axes.size === 1) cfg.axis = axes.has("x") ? "x" : "y";

    cfg.width = normalizeNumber(raw, "width", warn, "x-scrollbar") ?? DEFAULT_CONFIG.width;
    cfg.thumbWidth =
        normalizeNumber(raw, "thumbWidth", warn, "x-scrollbar") ?? DEFAULT_CONFIG.thumbWidth;
    cfg.delay = normalizeNumber(raw, "delay", warn, "x-scrollbar") ?? DEFAULT_CONFIG.delay;
    cfg.minSize = normalizeNumber(raw, "minSize", warn, "x-scrollbar") ?? DEFAULT_CONFIG.minSize;
    cfg.fadeDuration =
        normalizeNumber(raw, "fadeDuration", warn, "x-scrollbar") ?? DEFAULT_CONFIG.fadeDuration;
    if (raw.color !== undefined) {
        if (typeof raw.color === "string" && raw.color.trim() !== "") cfg.color = raw.color;
        else warn(`x-scrollbar: color 须为非空字符串，已回退默认色`);
    }
    return cfg;
}

/* ────────────────────────── 控制器 ────────────────────────── */

/** 拖拽会话（pointerdown 建立、up/cancel 结束；railLen/thumbLen 取拖起时快照） */
interface DragSession {
    axis: "x" | "y";
    pointerId: number;
    /** 拖起时指针坐标（clientY/clientX） */
    start: number;
    /** 拖起时宿主滚动位置 */
    startScroll: number;
    /** 轨道可用长（offsetHeight/offsetWidth）与滑块长（拖起时快照） */
    railLen: number;
    thumbLen: number;
    thumb: HTMLElement;
}

/** 宿主 scope 最小结构契约（鸭子类型，零 engine 类型依赖——decorate 同款） */
interface ScrollbarScope {
    watch(expr: string, cb: (payload: { value: any }) => void): any;
}

/** 全局 store fallback watcher 的最小 off 契约（decorate 同款） */
interface ScrollbarWatcher {
    off?: () => void;
}

/**
 * 滚动条皮肤控制器（独立承载，ADR-0013 决策 6）：状态机与生命周期全内聚本模块——
 * 与装饰动效家族共享契约语义（值三态 / Runtime 三钩子），不共享控制器实现。
 *
 * 状态机：`enabled`（值 truthiness 总开关）翻转走 setup/teardown 对称挂摘——转假
 * 摘轨道与宿主类（原生滚动条回归）、断监听；转真重挂。`dragging` 期间 leave 渐隐
 * 被守卫，拖拽结束时按指针坐标补判定。
 */
export class ScrollbarDirective {
    /**
     * 帧调度（类静态，测试可替换驱动 wheel 动画——happy-dom 无渲染泵 rAF 不调度，
     * x-ripple DecorateDirective.probe 同款可测注入先例）
     */
    static scheduleFrame(cb: FrameRequestCallback): number {
        return requestAnimationFrame(cb);
    }
    static cancelFrame(id: number): void {
        cancelAnimationFrame(id);
    }

    engine: AutoSpark<any>;
    info: Record<string, any>;
    el: HTMLElement;

    /** 原始指令值（表达式字符串；无值 undefined = 恒开） */
    value: string | undefined;
    /** 归一后的全量配置 */
    config: ScrollbarConfig;

    /** 存活标记：unmounted 后值订阅回调短路（scope.watch 无句柄，真 off 留给 scope.destroy） */
    private alive = true;
    /** 值总开关（truthiness）；false 时轨道不挂载（原生滚动条回归） */
    private enabled = true;
    /** 拖拽会话（null = 空闲） */
    private drag: DragSession | null = null;
    /** 轨道 DOM（直挂宿主内部；setup 建 / teardown 摘） */
    private railX: HTMLElement | null = null;
    private railY: HTMLElement | null = null;
    private thumbX: HTMLElement | null = null;
    private thumbY: HTMLElement | null = null;
    /** leave 渐隐延迟定时器 */
    private hideTimer: ReturnType<typeof setTimeout> | null = null;
    /** 宿主 ResizeObserver（几何刷新三件套之一；环境缺失时静默跳过，靠 enter 强刷兜底） */
    private ro: ResizeObserver | null = null;
    /** 无 scope fallback（engine.store.watch）的 watcher 句柄——unmounted 自行 off */
    private valueOff: (() => void) | null = null;
    /** 事件卸载器集合（setup 接线 / teardown 统一摘） */
    private offs: Array<() => void> = [];
    /** wheel 平滑滚动会话（null = 空闲；raf 0 = 无在途帧） */
    private wheel: { tx: number; ty: number; raf: number } | null = null;

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
     * observer 通道入口（dispatcher mount 时调用）：样式注入 + 值订阅（初始值驱动
     * setup/teardown）。宿主可能尚未连接文档（client 尺寸为 0）——几何首算延迟一拍，
     * 连接后的正确性由 mouseenter 强刷与 ResizeObserver 兜底（refresh 幂等全量重算）。
     */
    mounted(): void {
        if (!this.el) return;
        ensureStyles();
        this.applyVars();
        this.bindValue();
        if (this.enabled) this.setup();
    }

    /** observer 卸载（元素移除 / engine.destroy）：teardown 全清 + 值订阅 off + 熄活 */
    unmounted(): void {
        this.teardown();
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
     * （绝对路径，句柄自行 off）；无值恒开。初始值立即驱动 setup/teardown。
     */
    private bindValue(): void {
        if (this.value == null) {
            this.setEnabled(true);
            return;
        }
        if (this.value === "false") {
            this.setEnabled(false);
            return;
        }
        const expr = this.value;
        const listener = ({ value }: { value: any }) => {
            if (this.alive) this.setEnabled(!!value);
        };
        const scope = this.engine.findScopeByEl(this.el) as ScrollbarScope | undefined;
        if (scope && typeof scope.watch === "function") {
            const initial = scope.watch(expr, listener);
            this.setEnabled(!!initial);
        } else {
            const watcher = (this.engine as any).store.watch(expr, listener) as ScrollbarWatcher;
            this.valueOff = () => watcher?.off?.();
            this.setEnabled(!!this.engine.store.read?.(expr));
        }
    }

    /** 值总开关翻转：转真挂载轨道（隐藏原生条）；转假全摘（原生条回归） */
    private setEnabled(on: boolean): void {
        if (this.enabled === on) return;
        this.enabled = on;
        if (on) this.setup();
        else this.teardown();
    }

    /* ── 挂载 / 摘除 ── */

    /** 挂载轨道层：宿主类 + 实例变量 + rail DOM + 事件接线 + RO + 延迟一拍首算几何 */
    private setup(): void {
        const el = this.el;
        if (!el || this.railY) return; // 已挂守卫
        el.classList.add(HOST_CLASS);
        this.applyVars();
        this.buildRails();
        this.bindEvents();
        if (typeof ResizeObserver !== "undefined") {
            this.ro = new ResizeObserver(() => this.refresh());
            this.ro.observe(el);
        }
        // 首算延迟一拍：宿主可能尚未连接（client 尺寸 0 → 误判不溢出），连接后的
        // 正确性由 mouseenter 强刷 / RO 兜底（refresh 幂等全量重算）
        setTimeout(() => this.refresh(), 0);
        this.refresh();
    }

    /** 摘除轨道层：断 RO / 事件 / 定时器，摘 rail 与宿主类（原生滚动条回归） */
    private teardown(): void {
        if (this.hideTimer != null) clearTimeout(this.hideTimer);
        this.hideTimer = null;
        if (this.wheel) {
            if (this.wheel.raf) ScrollbarDirective.cancelFrame(this.wheel.raf);
            this.wheel = null;
        }
        this.ro?.disconnect();
        this.ro = null;
        for (const off of this.offs) off();
        this.offs = [];
        this.endDrag(true);
        this.railX?.remove();
        this.railY?.remove();
        this.railX = this.railY = this.thumbX = this.thumbY = null;
        this.el?.classList.remove(HOST_CLASS, VISIBLE_CLASS, ACTIVE_X_CLASS, ACTIVE_Y_CLASS);
    }

    /** 注入轨道 DOM（双向恒建，display 由方向激活类控制——DOM 恒定，refresh 只 toggle 类） */
    private buildRails(): void {
        const mk = (railCls: string): { rail: HTMLElement; thumb: HTMLElement } => {
            const rail = document.createElement("span");
            rail.className = `${RAIL_CLASS} ${railCls}`;
            const thumb = document.createElement("span");
            thumb.className = THUMB_CLASS;
            rail.appendChild(thumb);
            this.el.appendChild(rail);
            return { rail, thumb };
        };
        const y = mk(RAIL_Y_CLASS);
        this.railY = y.rail;
        this.thumbY = y.thumb;
        const x = mk(RAIL_X_CLASS);
        this.railX = x.rail;
        this.thumbX = x.thumb;
    }

    /** 实例级 CSS 变量落位（宿主 style 上；minSize/delay 是 JS 几何/定时器值不进 CSS） */
    private applyVars(): void {
        const style = this.el.style;
        style.setProperty("--x-scrollbar-width", `${this.config.width}px`);
        style.setProperty("--x-scrollbar-thumb", `${this.config.thumbWidth}px`);
        style.setProperty("--x-scrollbar-color", this.config.color);
        style.setProperty("--x-scrollbar-fade", `${this.config.fadeDuration}ms`);
    }

    /** 事件接线（登记进 offs，teardown 统一摘） */
    private listen(target: EventTarget, type: string, fn: (ev: any) => void): void {
        target.addEventListener(type, fn as EventListener);
        this.offs.push(() => target.removeEventListener(type, fn as EventListener));
    }

    /** 事件接线：宿主显隐/滚动 + 双向轨道点击 + 滑块拖拽（Pointer Events） */
    private bindEvents(): void {
        const el = this.el;
        // 显隐（ADR-0013 决策 3）：enter 强刷 + 渐显；leave 延迟渐隐（拖拽中被守卫）
        this.listen(el, "mouseenter", () => {
            this.refresh();
            this.show();
        });
        this.listen(el, "mouseleave", () => this.scheduleHide());
        // 滚动同步（三件套之三）：thumb 位置跟手（wheel 动画路径已同帧补偿，此处跳过）
        this.listen(el, "scroll", () => {
            if (this.drag || this.wheel) return;
            this.updateThumb("y");
            this.updateThumb("x");
        });
        this.bindWheel();

        this.bindRail("y", this.railY!, this.thumbY!);
        this.bindRail("x", this.railX!, this.thumbX!);
    }

    /**
     * wheel 接管（ADR-0013 决策 1 修订，2026-11-08）：原生滚动走合成线程，轨道补偿
     * 经 scroll 事件回主线程永远滞后一帧——滚轮每格滚动滑块先随轨道被内容带走、
     * 补偿到达再弹回（用户实测「先向上再向下」跳动）。根治 = preventDefault 接管
     * wheel，rAF 平滑逼近目标 scrollTop——**滚动写入与轨道补偿同帧完成**（runWheel
     * 每帧先写 scrollTop 再 updateThumb），空窗不存在。
     *
     * 放行边界：缩放手势（ctrlKey）/ 拖拽中 / 对应轴未溢出 / 已滚到对应边界
     * （交还父级冒泡滚动，嵌套容器行为不破坏）。
     */
    private bindWheel(): void {
        this.listen(this.el, "wheel", (ev: WheelEvent) => {
            if (ev.ctrlKey || this.drag) return;
            const el = this.el;
            const unit = ev.deltaMode === 1 ? 16 : 1; // 行模式换算像素（近似行高）
            const dy = ev.deltaY * unit;
            const dx = ev.deltaX * unit;
            const maxY = el.scrollHeight - el.clientHeight;
            const maxX = el.scrollWidth - el.clientWidth;
            const takeY =
                dy !== 0 && maxY > 0 && !(dy < 0 && el.scrollTop <= 0) && !(dy > 0 && el.scrollTop >= maxY);
            const takeX =
                dx !== 0 && maxX > 0 && !(dx < 0 && el.scrollLeft <= 0) && !(dx > 0 && el.scrollLeft >= maxX);
            if (!takeY && !takeX) return;
            ev.preventDefault();
            const w = this.wheel ?? (this.wheel = { tx: el.scrollLeft, ty: el.scrollTop, raf: 0 });
            if (takeY) w.ty = Math.min(Math.max(w.ty + dy, 0), maxY);
            if (takeX) w.tx = Math.min(Math.max(w.tx + dx, 0), maxX);
            if (w.raf === 0) this.runWheel();
        });
    }

    /** wheel 平滑逼近循环：每帧 ease 收敛滚动位并同帧补偿轨道（决策核心——两写同帧） */
    private runWheel(): void {
        const w = this.wheel!;
        const step = () => {
            w.raf = 0;
            const el = this.el;
            if (!el || !this.enabled || !this.wheel) {
                this.wheel = null;
                return;
            }
            let done = true;
            const dyT = w.ty - el.scrollTop;
            if (Math.abs(dyT) >= 1) {
                el.scrollTop += dyT * WHEEL_EASE;
                done = false;
            } else if (dyT !== 0) el.scrollTop = w.ty;
            const dxT = w.tx - el.scrollLeft;
            if (Math.abs(dxT) >= 1) {
                el.scrollLeft += dxT * WHEEL_EASE;
                done = false;
            } else if (dxT !== 0) el.scrollLeft = w.tx;
            // 滚动写入与补偿同帧——先写 scrollTop 再 updateThumb（读最新滚动位写 transform）
            this.updateThumb("y");
            this.updateThumb("x");
            if (!done) w.raf = ScrollbarDirective.scheduleFrame(step);
            else this.wheel = null;
        };
        w.raf = ScrollbarDirective.scheduleFrame(step);
    }

    /** 单向轨道接线：轨道点击跳页 + 滑块拖拽 */
    private bindRail(axis: "x" | "y", rail: HTMLElement, thumb: HTMLElement): void {
        // 滑块拖拽：pointerdown 建会话 + capture，move 反写滚动位置，up/cancel 收口
        this.listen(thumb, "pointerdown", (ev: PointerEvent) => this.dragStart(axis, ev, thumb, rail));
        this.listen(thumb, "pointermove", (ev: PointerEvent) => this.dragMove(ev));
        this.listen(thumb, "pointerup", (ev: PointerEvent) => this.dragEnd(ev));
        this.listen(thumb, "pointercancel", () => this.endDrag(true));

        // 轨道点击跳页：点击点在滑块上侧向上翻、下侧向下翻（点滑块冒泡到此不触发）
        this.listen(rail, "pointerdown", (ev: PointerEvent) => {
            if (ev.button !== 0 || ev.target !== rail) return;
            ev.preventDefault();
            const el = this.el;
            const rect = rail.getBoundingClientRect();
            // 补偿 transform 平移整个轨道（含滑块）：视觉偏移（clientY - rect.top）与
            // 滑块 offsetTop（轨道内偏移）天然同系，直接比较——无需补偿项换算
            const along = axis === "y" ? ev.clientY - rect.top : ev.clientX - rect.left;
            const thumbPos = axis === "y" ? thumb.offsetTop : thumb.offsetLeft;
            const page = axis === "y" ? el.clientHeight : el.clientWidth;
            if (axis === "y") el.scrollTop += along < thumbPos ? -page : page;
            else el.scrollLeft += along < thumbPos ? -page : page;
            // 滚动位与补偿同帧（两轴——对向轨道补偿同样依赖本轴滚动位）
            this.updateThumb("y");
            this.updateThumb("x");
        });
    }

    /* ── 几何 ── */

    /**
     * 全量重算（幂等）：按溢出方向 toggle 激活类 + 更新滑块几何。
     * client 尺寸为 0（宿主游离 / display:none）视为不溢出——连接后由 enter/RO 兜底。
     */
    private refresh(): void {
        if (!this.enabled || !this.el) return;
        const el = this.el;
        const yActive = this.config.axis !== "x" && el.clientHeight > 0 && el.scrollHeight > el.clientHeight;
        const xActive = this.config.axis !== "y" && el.clientWidth > 0 && el.scrollWidth > el.clientWidth;
        el.classList.toggle(ACTIVE_Y_CLASS, yActive);
        el.classList.toggle(ACTIVE_X_CLASS, xActive);
        if (yActive) this.updateThumb("y");
        if (xActive) this.updateThumb("x");
    }

    /**
     * 更新单向滑块几何：长度 = client/scroll 比例 × 轨道长（minSize 兜底、轨道长封顶），
     * 位置 = 滚动进度 × 剩余空隙。取整输出（浮点尾数不泄漏进内联样式，测试断言友好）。
     *
     * 同时给轨道写**正向滚动补偿**（双向 `translate(scrollLeft, scrollTop)`）：轨道是
     * 滚动宿主的 absolute 子元素，滚动时随内容一起滚出可视区（滚动容器内 absolute
     * 子元素的标准行为）——**两轴都要补**（纵向滚动时横轨同样会被带走），补偿后轨道
     * 钉回可视区（perfect-scrollbar 单元素直挂结构同款思路，其 update-geometry 在
     * scroll 事件里重算轨道位置）。补偿平移整个轨道（含滑块）：轨道点击判定的视觉
     * 偏移（`clientY - rect.top`）与滑块 `offsetTop`（轨道内偏移）天然同系，直接比较。
     */
    private updateThumb(axis: "x" | "y"): void {
        const el = this.el;
        const rail = axis === "y" ? this.railY : this.railX;
        const thumb = axis === "y" ? this.thumbY : this.thumbX;
        if (!el || !rail || !thumb) return;
        const client = axis === "y" ? el.clientHeight : el.clientWidth;
        const scroll = axis === "y" ? el.scrollHeight : el.scrollWidth;
        const scrollPos = axis === "y" ? el.scrollTop : el.scrollLeft;
        if (scroll <= client) return; // 未溢出（display:none 由激活类管，几何跳过）

        const railLen = axis === "y" ? rail.offsetHeight : rail.offsetWidth;
        if (railLen <= 0) return; // 轨道不可测（display:none / 游离）——enter 强刷兜底
        const len = Math.round(
            Math.min(railLen, Math.max(this.config.minSize, (client / scroll) * railLen)),
        );
        const maxScroll = scroll - client;
        const pos = Math.round((scrollPos / maxScroll) * (railLen - len));
        // 双向补偿：任一轴滚动都会带走两条轨道，统一按当前滚动位补两轴
        rail.style.transform = `translate(${el.scrollLeft}px, ${el.scrollTop}px)`;
        if (axis === "y") {
            thumb.style.height = `${len}px`;
            thumb.style.top = `${pos}px`;
        } else {
            thumb.style.width = `${len}px`;
            thumb.style.left = `${pos}px`;
        }
    }

    /* ── 显隐 ── */

    /** 渐显：清渐隐定时器 + 挂可见类（轨道 opacity 1 / 指针可交互） */
    private show(): void {
        if (this.hideTimer != null) {
            clearTimeout(this.hideTimer);
            this.hideTimer = null;
        }
        this.el?.classList.add(VISIBLE_CLASS);
    }

    /** 延迟渐隐（ADR-0013 决策 3）：leave 后等 delay ms 再摘可见类（防快速掠过闪灭） */
    private scheduleHide(): void {
        if (this.drag) return; // 拖拽中不隐藏（拖起时指针可能在轨道上，leave 是预期内噪声）
        if (this.hideTimer != null) clearTimeout(this.hideTimer);
        this.hideTimer = setTimeout(() => {
            this.hideTimer = null;
            this.el?.classList.remove(VISIBLE_CLASS);
        }, this.config.delay);
    }

    /* ── 拖拽（Pointer Events + setPointerCapture，ADR-0013 决策 2） ── */

    /** 建立拖拽会话：主键按下 + capture + 滑块增粗类 + 渐显锁定 */
    private dragStart(
        axis: "x" | "y",
        ev: PointerEvent,
        thumb: HTMLElement,
        rail: HTMLElement,
    ): void {
        if (ev.button !== 0 || this.drag) return;
        ev.preventDefault();
        this.show();
        const railLen = axis === "y" ? rail.offsetHeight : rail.offsetWidth;
        this.drag = {
            axis,
            pointerId: ev.pointerId,
            start: axis === "y" ? ev.clientY : ev.clientX,
            startScroll: axis === "y" ? this.el.scrollTop : this.el.scrollLeft,
            railLen,
            thumbLen: axis === "y" ? thumb.offsetHeight : thumb.offsetWidth,
            thumb,
        };
        thumb.classList.add(THUMB_DRAG_CLASS);
        try {
            thumb.setPointerCapture(ev.pointerId);
        } catch {
            // 环境不支持 capture（如部分测试环境）——move/up 仍绑在 thumb 上照常工作
        }
    }

    /** 拖拽移动：位移按轨道/滑块长度比换算为滚动距离，反写原生滚动位置 */
    private dragMove(ev: PointerEvent): void {
        const drag = this.drag;
        if (!drag || ev.pointerId !== drag.pointerId) return;
        const el = this.el;
        const axis = drag.axis;
        const client = axis === "y" ? el.clientHeight : el.clientWidth;
        const scroll = axis === "y" ? el.scrollHeight : el.scrollWidth;
        const scrollable = drag.railLen - drag.thumbLen;
        if (scrollable <= 0) return; // 滑块占满轨道（内容近全可见）——无拖拽自由度
        const delta = (axis === "y" ? ev.clientY : ev.clientX) - drag.start;
        const next = drag.startScroll + (delta / scrollable) * (scroll - client);
        if (axis === "y") el.scrollTop = next;
        else el.scrollLeft = next;
        // 滚动位与补偿同帧（两轴：本轴写滚动位，对向轨道补偿也依赖该滚动位）
        this.updateThumb("y");
        this.updateThumb("x");
        // 对向轨道钉回补偿：滚动带动双向轨道（两轴都要补，见 updateThumb），而拖拽中
        // scroll 事件被守卫挡掉（防回环与 move 抖动竞争）——对向 rail 的补偿 transform
        // 只能在此驱动，缺此一步拖横滑块会带走垂直轨道、反之亦然（both 双激活才可见）
        this.updateThumb(axis === "y" ? "x" : "y");
    }

    /** 拖拽收口（pointerup）：结束会话 + 按指针坐标补显隐判定 */
    private dragEnd(ev: PointerEvent): void {
        if (!this.drag || ev.pointerId !== this.drag.pointerId) return;
        this.endDrag(false);
        // capture 期间 leave 已被守卫挡掉——收口时按指针是否仍在宿主内补判定
        const rect = this.el.getBoundingClientRect();
        const inside =
            ev.clientX >= rect.left &&
            ev.clientX <= rect.right &&
            ev.clientY >= rect.top &&
            ev.clientY <= rect.bottom;
        if (inside) this.show();
        else this.scheduleHide();
    }

    /** 结束拖拽会话（up/cancel/teardown 共用；silent = 不补显隐判定） */
    private endDrag(silent: boolean): void {
        const drag = this.drag;
        if (!drag) return;
        this.drag = null;
        drag.thumb.classList.remove(THUMB_DRAG_CLASS);
        try {
            drag.thumb.releasePointerCapture(drag.pointerId);
        } catch {
            // 已被隐式释放（up 后自动）——幂等
        }
        if (!silent) this.refresh();
    }
}

/* ──────────────── 插件自举（对齐 decorate 双路径注册，ADR-0013 决策 6） ──────────────── */

/** spec 基类实例 → 控制器挂靠表（spec 钩子委托的桥；实例随基类实例 GC 回收） */
const controllers = new WeakMap<object, ScrollbarDirective>();

/** spec 钩子的 this 契约面（engine/info/el，与基类实例一致） */
interface SpecThis {
    engine: AutoSpark<any>;
    el: HTMLElement;
    info: Record<string, any>;
}

/**
 * 指令 spec 构造（`AutoSpark.directive(spec)` spec 重载）：Runtime 通道（observer 的
 * mounted/unmounted/attrChanged 与持续交互控件生命周期天然同构）+ 三钩子委托控制器。
 */
function createScrollbarSpec(): DirectiveSpec {
    function mounted(this: SpecThis): void {
        if (!this.el) return;
        const controller = new ScrollbarDirective(this.engine, this.info);
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
        name: "scrollbar",
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
export function bootstrapScrollbarPlugin(): void {
    bootstrapDecoratePlugin(createScrollbarSpec());
}

// 模块加载即自举（对称 x-ripple：置于模块尾部）
bootstrapScrollbarPlugin();
