import { setVal } from "autostore";
import { AutoSparkDirectiveBase } from "../base";
import { isSimpleStatePath } from "../../scope";
import type { AutoSpark } from "../../engine";

/**
 * x-expandable：展开折叠（ADR-0069）——宿主元素的通用展开/折叠指令，值为**显式展开态布尔**
 * （true=展开）双向绑定，把 x-splitter 的 collapsible 把手与 x-drawer 的抽屉把手能力
 * 通用化（两指令后续阶段将组合本指令，消灭三份拷贝）。
 *
 * **值形态**（决策二）：简单路径（如 `ui.open`）双向——点击把手经 setVal 回写翻转
 * （x-model 防循环纪律：watcher 等值短路）；复杂表达式 warn 一次 + **只读降级**（点击
 * no-op，不本地假切换——UI 与状态背离是隐性 bug 源）；`true`/`false` 字面量（裸或引号）
 * 恒定态；空值 warn + 指令不作为。
 *
 * **direction = 收起方向**（决策三，停靠边）：`left`=向左收起（把手骑活动边=右边缘）、
 * 默认 `left`；top/bottom 走 height 轴。
 *
 * **折叠双通道由 minSize 分派**（决策四）：
 * - `minSize=0`（默认）= **滑出折叠**，宽度/高度**保持不改**，终态持续保持不归零：
 *   - `collapse:'margin'`（默认）：inline 负 margin 滑出（占位归零、兄弟流入、内容不挤压，
 *     与 splitter slide 通道同构）；需要父容器 `overflow:hidden` 裁剪（见「父容器注入」）。
 *   - `collapse:'slide'`：`translateX/Y(±100%)` 平移（占位不变，服务 fixed 覆盖形态）。
 * - `minSize>0` = 纯尺寸收缩（width/height 过渡至 minSize），子内容**不隐藏**。
 * 展开：maxSize 有值写 inline 尺寸、缺省**移除** inline 尺寸让 CSS 决定（不快照记忆）。
 * 初始值 false：编译期挂终态、**无动画**（splitter「初始折叠不派发事件」惯例）；margin
 * 通道的滑出距离依赖布局测量，整体推迟到编译后微任务（x-resize 先例——元素挂载后执行）。
 *
 * **子内容隐藏**（决策五）：滑出折叠态经 `[data-collapsed] > :not(把手){visibility:hidden}`
 * 隐藏——**宿主自身不能 overflow:hidden**（宽度保持的盒子会把 absolute 把手一并裁掉）；
 * 宿主 `data-collapsed` 仅滑出折叠挂（内容隐藏钩子），把手 `data-collapsed` 独立挂
 * （箭头翻转，minSize>0 折叠也翻转——两处分离，splitter 先例）。
 *
 * **把手**（决策六）：样式契约同 splitter 折叠把手（20px 圆 + 全局图标 `arrow`、
 * role=button、Enter/Space、指针 stopPropagation）；滑轨坐标 `pos` 三态（`'center'` 默认
 * ≡ `'50%'` / number=px / CSS 长度串负值距对端，越界样式表钳制——把手是唯一重开触点）。
 * **动态挂载（reparent）**：展开态挂宿主骑活动边；滑出折叠**完成后**（transitionend /
 * 600ms 兜底）移入父容器贴停靠边内侧（宿主滑出后其内子元素随容器裁剪，把手外迁保常驻
 * 可达）；展开动画**启动前**移回宿主。两态定位全 CSS 化（`--as-pos` 变量 + 样式表
 * 钳制，splitter 手法）：展开态相对宿主（rail=活动边长）、折叠态相对父容器（rail=停靠
 * 边长）——同名变量两套规则，reparent 零 JS 测量（实施修订：较 ADR 草案的 rect 快照
 * 反算更简，happy-dom 无布局可测）。`minSize>0` 折叠**永不迁移**（宿主不滑出）。
 *
 * **父容器注入**（决策七）：margin 通道需要父容器裁剪滑出部分。默认
 * `injectOverflow:true` **折叠期间**由指令注入——折叠开始挂 `data-autospark-expandable-clip`
 * （overflow:hidden；父容器本为 hidden/clip 幂等跳过）+ `data-autospark-expandable-dock`
 * （position:relative，把手 reparent 的定位上下文，恒注入），**保持至展开动画完成后**
 * （属性驱动，用户 inline/类样式不受影响；多实例共享父容器 WeakMap 引用计数、最后一个
 * 展开完成才摘）；原值 `auto/scroll` 滚动条折叠期间暂失为已知副作用。`false` 显式禁用
 * 后回落检测：父容器 computed overflow 非 hidden/clip 时 warn 一次、用户自负。
 *
 * **事件**（决策八）：`expandable:expand` / `expandable:collapse`（宿主派发、DOM 冒泡、
 * detail `{ size }`——展开为 maxSize 格式化值或 null，折叠为 0 或 minSize 格式化值）；
 * 初始应用不派发。
 *
 * **静态特性**（决策一）：Compile（编译期 createElement 注入把手——不在模板树、天然
 * 不被 walk，无需 ownsChildren）、priority 50（bind/on 同级）、singleton。
 */
export type ExpandableDirection = "left" | "right" | "top" | "bottom";
export type ExpandableMode = "margin" | "slide";

/** 方向合法值集 */
const DIRECTIONS: readonly ExpandableDirection[] = ["left", "right", "top", "bottom"];
/** 滑出通道合法值集 */
const MODES: readonly ExpandableMode[] = ["margin", "slide"];

/** 滑出折叠的 transform 位移（slide 通道，% 相对自身——无需布局测量） */
const SLIDE_TRANSFORMS: Record<ExpandableDirection, string> = {
    left: "translateX(-100%)",
    right: "translateX(100%)",
    top: "translateY(-100%)",
    bottom: "translateY(100%)",
};

/** 滑出折叠的负 margin 属性（margin 通道，按收起方向分派） */
const MARGIN_PROPS: Record<ExpandableDirection, string> = {
    left: "margin-left",
    right: "margin-right",
    top: "margin-top",
    bottom: "margin-bottom",
};

/**
 * 父容器注入引用计数（决策七）：父元素 → 活跃折叠实例数；归零摘除 dock/clip 属性
 * （多实例共享父容器时最后一个展开完成才恢复原值）。
 */
const dockCounts = new WeakMap<HTMLElement, number>();

/** 滑轨钳制表达式（把手圆心坐标钳到 [half, rail−half]，splitter 手法）：定义一次复用 */
const RAIL_CLAMP = "max(var(--as-pos-half),min(calc(100% - var(--as-pos-half)),var(--as-pos,50%)))";

// 全局样式（类级 initialize 注入，幂等；CSS 变量定制视觉，对齐 splitter 惯例）
const EXPANDABLE_STYLE_ID = "autospark-expandable-styles";
const EXPANDABLE_CSS = `
/* 宿主：滑出折叠子内容隐藏（visibility 不触发子树 reflow，把手排除——宿主不可自身
   overflow:hidden：宽度保持的盒子会把把手一并裁掉，ADR-0069 决策五）。
   把手 absolute 定位上下文不在此强制（JS 微任务补——CSS 强写 position:relative 会覆盖
   fixed/absolute 宿主，而 fixed 覆盖形态恰是 slide 通道的目标场景） */
.autospark-expandable[data-collapsed]>:not(.autospark-expandable-trigger){visibility:hidden;}
/* 折叠态翻转动画（决策四）：margin（滑出）/ width/height（收缩）/ transform（slide）统一时长 */
.autospark-expandable[data-animating]{transition:width var(--autospark-expandable-duration,.25s) ease,height var(--autospark-expandable-duration,.25s) ease,margin var(--autospark-expandable-duration,.25s) ease,transform var(--autospark-expandable-duration,.25s) ease;}
/* 把手（决策六：样式契约同 splitter 折叠把手） */
.autospark-expandable-trigger{position:absolute;z-index:5;width:var(--autospark-expandable-trigger-size,20px);height:var(--autospark-expandable-trigger-size,20px);border-radius:50%;border:1px solid var(--autospark-expandable-trigger-border,#cbd5e1);background:var(--autospark-expandable-trigger-bg,#fff);box-shadow:0 1px 3px rgba(0,0,0,.1);cursor:pointer;display:flex;align-items:center;justify-content:center;user-select:none;-webkit-user-select:none;transition:border-color .15s,background .15s;color:var(--autospark-expandable-trigger-fg,#64748b);}
.autospark-expandable-trigger>svg{width:var(--autospark-expandable-trigger-icon-size,12px);height:var(--autospark-expandable-trigger-icon-size,12px);stroke-width:1.5;transition:transform .15s,width .15s,height .15s;}
.autospark-expandable-trigger:hover{border-color:var(--autospark-expandable-trigger-border-hover,#94a3b8);background:var(--autospark-expandable-trigger-bg-hover,#f8fafc);}
/* 把手滑轨定位基建：圆心坐标变量 + 钳制表达式（越界静默钳到 [half, rail−half]——把手是唯一重开触点） */
.autospark-expandable-trigger{--as-pos-half:calc(var(--autospark-expandable-trigger-size,20px)/2);--as-pos-clamp:${RAIL_CLAMP};}
/* 把手展开态定位（宿主内）：**圆心骑活动边线**（一半突出宿主外）+ 沿边滑轨
   （--as-pos 圆心坐标，负值距对端）——滑出全程圆心恒贴边线，reparent 零跳变 */
.autospark-expandable[data-direction="left"]>.autospark-expandable-trigger{right:calc(-1*var(--as-pos-half));top:calc(var(--as-pos-clamp) - var(--as-pos-half));}
.autospark-expandable[data-direction="left"]>.autospark-expandable-trigger[data-pos-negative]{top:auto;bottom:calc(var(--as-pos-clamp) - var(--as-pos-half));}
.autospark-expandable[data-direction="right"]>.autospark-expandable-trigger{left:calc(-1*var(--as-pos-half));top:calc(var(--as-pos-clamp) - var(--as-pos-half));}
.autospark-expandable[data-direction="right"]>.autospark-expandable-trigger[data-pos-negative]{top:auto;bottom:calc(var(--as-pos-clamp) - var(--as-pos-half));}
.autospark-expandable[data-direction="top"]>.autospark-expandable-trigger{bottom:calc(-1*var(--as-pos-half));left:calc(var(--as-pos-clamp) - var(--as-pos-half));}
.autospark-expandable[data-direction="top"]>.autospark-expandable-trigger[data-pos-negative]{left:auto;right:calc(var(--as-pos-clamp) - var(--as-pos-half));}
.autospark-expandable[data-direction="bottom"]>.autospark-expandable-trigger{top:calc(-1*var(--as-pos-half));left:calc(var(--as-pos-clamp) - var(--as-pos-half));}
.autospark-expandable[data-direction="bottom"]>.autospark-expandable-trigger[data-pos-negative]{left:auto;right:calc(var(--as-pos-clamp) - var(--as-pos-half));}
/* 把手折叠态定位（reparent 至父容器后）：**圆心骑停靠边线**——外一半被父容器
   overflow 裁掉呈半圆（drawer 把手折叠态形态）；rail=父容器边长；
   与展开态规则天然互斥（把手同一时刻只在一处），同名 --as-pos 变量复用 */
[data-autospark-expandable-dock]>.autospark-expandable-trigger[data-direction="left"]{left:calc(-1*var(--as-pos-half));top:calc(var(--as-pos-clamp) - var(--as-pos-half));}
[data-autospark-expandable-dock]>.autospark-expandable-trigger[data-direction="left"][data-pos-negative]{top:auto;bottom:calc(var(--as-pos-clamp) - var(--as-pos-half));}
[data-autospark-expandable-dock]>.autospark-expandable-trigger[data-direction="right"]{right:calc(-1*var(--as-pos-half));top:calc(var(--as-pos-clamp) - var(--as-pos-half));}
[data-autospark-expandable-dock]>.autospark-expandable-trigger[data-direction="right"][data-pos-negative]{top:auto;bottom:calc(var(--as-pos-clamp) - var(--as-pos-half));}
[data-autospark-expandable-dock]>.autospark-expandable-trigger[data-direction="top"]{top:calc(-1*var(--as-pos-half));left:calc(var(--as-pos-clamp) - var(--as-pos-half));}
[data-autospark-expandable-dock]>.autospark-expandable-trigger[data-direction="top"][data-pos-negative]{left:auto;right:calc(var(--as-pos-clamp) - var(--as-pos-half));}
[data-autospark-expandable-dock]>.autospark-expandable-trigger[data-direction="bottom"]{bottom:calc(-1*var(--as-pos-half));left:calc(var(--as-pos-clamp) - var(--as-pos-half));}
[data-autospark-expandable-dock]>.autospark-expandable-trigger[data-direction="bottom"][data-pos-negative]{left:auto;right:calc(var(--as-pos-clamp) - var(--as-pos-half));}
/* 箭头旋转矩阵：基箭头指右，指向「下一步动作」方向，按把手自带 data-direction × data-collapsed
   分派（属性随身——reparent 至父容器后仍生效） */
.autospark-expandable-trigger[data-direction="left"]>svg{transform:rotate(180deg);}
.autospark-expandable-trigger[data-direction="right"]>svg{transform:rotate(0deg);}
.autospark-expandable-trigger[data-direction="top"]>svg{transform:rotate(-90deg);}
.autospark-expandable-trigger[data-direction="bottom"]>svg{transform:rotate(90deg);}
/* 折叠态（滑出）：圆心骑停靠边线只显内半圆——图标缩至 0.65 倍并平移 1/4 圆径
   （size/4）移入半圆中心，保证不被父容器裁掉（drawer 把手同款数学）；
   translate 前置于 rotate（视觉坐标平移，不随旋转改向） */
.autospark-expandable-trigger[data-collapsed]>svg{width:calc(var(--autospark-expandable-trigger-icon-size,12px)*0.65);height:calc(var(--autospark-expandable-trigger-icon-size,12px)*0.65);}
.autospark-expandable-trigger[data-collapsed][data-direction="left"]>svg{transform:translateX(calc(var(--autospark-expandable-trigger-size,20px)/4)) rotate(0deg);}
.autospark-expandable-trigger[data-collapsed][data-direction="right"]>svg{transform:translateX(calc(var(--autospark-expandable-trigger-size,20px)*-1/4)) rotate(180deg);}
.autospark-expandable-trigger[data-collapsed][data-direction="top"]>svg{transform:translateY(calc(var(--autospark-expandable-trigger-size,20px)/4)) rotate(90deg);}
.autospark-expandable-trigger[data-collapsed][data-direction="bottom"]>svg{transform:translateY(calc(var(--autospark-expandable-trigger-size,20px)*-1/4)) rotate(-90deg);}
/* 父容器注入（决策七，折叠期间挂、展开完成摘）：dock=把手 reparent 定位上下文（恒注入）、
   clip=滑出溢出裁剪（injectOverflow 通道，父容器本为 hidden/clip 时不挂——幂等） */
[data-autospark-expandable-dock]{position:relative;}
[data-autospark-expandable-clip]{overflow:hidden;}
`;

/** 注入 x-expandable 全局样式（幂等；多 engine 共享、destroy 不移除——全局样式惯例） */
export function registerExpandableStyles(): void {
    if (document.getElementById(EXPANDABLE_STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = EXPANDABLE_STYLE_ID;
    style.textContent = EXPANDABLE_CSS;
    document.head.appendChild(style);
}

/**
 * x-expandable 指令（ADR-0069）：Compile 类（priority 50、singleton、无 ownsChildren——
 * 把手 createElement 注入不在模板树，天然不被编译；宿主子树照常编译）。实现结构见类头注释。
 */
export class ExpandableDirective extends AutoSparkDirectiveBase {
    static override readonly priority = 50;
    static override readonly singleton = true;

    /** 类级初始化：注入全局样式（幂等） */
    static override initialize(_engine: AutoSpark): void {
        registerExpandableStyles();
    }

    // ── 配置（created 期静态读取，optionExprs 求值层已并入 getOption）────────

    /** 收起方向（停靠边），默认 left */
    private _dir: ExpandableDirection = "left";
    /** 滑出通道（仅 minSize=0 折叠生效），默认 margin */
    private _mode: ExpandableMode = "margin";
    /** maxSize 展开尺寸声明（null = 缺省：展开时移除 inline 尺寸、CSS 决定） */
    private _maxDecl: { value: number; unit: string } | null = null;
    /** minSize 折叠尺寸声明（null 或 ≤0 = 滑出折叠；>0 = 尺寸收缩） */
    private _minDecl: { value: number; unit: string } | null = null;

    // ── 运行态 ──────────────────────────────────────────────────────────

    /** 当前展开态（UI 真相；watcher 等值短路的判据） */
    private _expanded = true;
    /** 双向回写路径（null = 字面量恒态或表达式只读降级——点击 no-op） */
    private _expandedPath: string | null = null;
    /** 值为空 → 指令不作为（不建把手） */
    private _dead = false;
    /** 表达式只读降级 warn 已发（一次） */
    private _warnedReadonly = false;
    /** injectOverflow=false 的父容器检测 warn 已发（一次） */
    private _warnedOverflow = false;
    /** 初始应用哨兵（初始态不派发事件） */
    private _initialized = false;
    /** 把手元素 */
    private _trigger: HTMLElement | null = null;
    /** 把手当前是否 reparent 在父容器（折叠滑出终态） */
    private _docked = false;
    /** 本指令写过主轴 inline 尺寸（maxSize/minSize 应用时置位——展开移除仅限自己写过的，
        用户模板自带 inline 尺寸不动） */
    private _ownSizeProp = false;
    /** 本实例已注入父容器（dock/clip 计数所有权） */
    private _injected = false;
    /** 动画摘除兜底计时器 */
    private _animTimer: ReturnType<typeof setTimeout> | null = null;
    /** 微任务初始应用前被销毁（快速 x-if 切换防护） */
    private _destroyed = false;

    // ── 生命周期 ──────────────────────────────────────────────────────

    override created(): void {
        // 选项成员表达式管道（pos 坐标可表达式化；热应用见 _onOptionExprChange）
        this._watchOptionExprs();
        this._readOptions();
        this._setupValue();
    }

    override compile(): void {
        if (this._dead) return;
        // 宿主身份 + 把手注入（createElement 注入不在模板树，天然不被 walk 编译）
        this.el.classList.add("autospark-expandable");
        this.el.setAttribute("data-direction", this._dir);
        this._buildTrigger();
        // 初始展开 + maxSize 有值：写 inline 展开尺寸（无布局依赖，编译期即可）
        if (this._expanded && this._maxDecl) {
            this.el.style[this._sizeProp as "width"] = this._formatCss(this._maxDecl);
            this._ownSizeProp = true;
        }
        // 初始折叠：margin 通道的滑出距离与父容器检测依赖布局测量，推迟到编译后微任务
        // （x-resize 先例——元素挂载后执行；slide 通道 transform % 相对自身本可编译期写，
        //  统一走微任务保持路径单一）。无动画（splitter「初始折叠不派发事件」惯例）。
        // 同微任务补把手定位上下文：宿主 computed position 为 static 才 inline 补 relative
        // （fixed/absolute 宿主不动——slide 通道的目标覆盖形态）。
        Promise.resolve().then(() => {
            if (this._destroyed) return;
            this._ensurePositionContext();
            if (!this._expanded) {
                this._applyExpanded(false, false);
                this._initialized = true;
            } else {
                this._initialized = true;
            }
        });
    }

    override destroy(): void {
        this._destroyed = true;
        if (this._animTimer != null) {
            clearTimeout(this._animTimer);
            this._animTimer = null;
        }
        this._releaseParentInjection();
        this._trigger?.remove();
        this._trigger = null;
    }

    /** 选项成员表达式热应用：pos 坐标变化即重定位把手（splitter collapsible 同款） */
    protected override _onOptionExprChange(key: string, _value: any): void {
        if (key === "pos") this._positionTrigger();
    }

    // ── 配置读取 ──────────────────────────────────────────────────────

    /** direction / collapse / maxSize / minSize 静态读取（非法值 warn 回退默认） */
    private _readOptions(): void {
        const rawDir = this.getOption("direction");
        if (rawDir != null && rawDir !== "") {
            const v = typeof rawDir === "string" ? (rawDir.trim() as ExpandableDirection) : (null as any);
            if (typeof rawDir === "string" && DIRECTIONS.includes(v)) {
                this._dir = v;
            } else {
                this.warn(
                    `x-expandable: direction 值 "${rawDir}" 无效（left/right/top/bottom），已回退 left`,
                );
            }
        }
        const rawMode = this.getOption("collapse");
        if (rawMode != null && rawMode !== "") {
            if (rawMode === "slide" || rawMode === "margin") {
                this._mode = rawMode;
            } else {
                this.warn(`x-expandable: collapse 值 "${rawMode}" 无效（margin/slide），已回退 margin`);
            }
        }
        for (const [key, setter] of [
            ["maxSize", (d: any) => (this._maxDecl = d)],
            ["minSize", (d: any) => (this._minDecl = d)],
        ] as const) {
            const raw = this.getOption(key);
            if (raw == null || raw === "") continue;
            const d = this._parseLength(raw);
            if (d == null) {
                this.warn(
                    `x-expandable: ${key} 值 "${raw}" 无法解析为 CSS 长度（支持 px/%/rem/em/vw/vh），已忽略`,
                );
            } else setter(d);
        }
    }

    /** CSS 长度解析（number=px；非法 null）——splitter parseLength 同款 */
    private _parseLength(raw: unknown): { value: number; unit: string } | null {
        if (typeof raw === "number") {
            return Number.isFinite(raw) ? { value: raw, unit: "px" } : null;
        }
        if (typeof raw !== "string") return null;
        const m = /^(-?(?:\d+(?:\.\d+)?))\s*(px|%|rem|em|vw|vh)?$/i.exec(raw.trim());
        if (!m) return null;
        const value = parseFloat(m[1]!);
        return Number.isFinite(value) ? { value, unit: (m[2] ?? "px").toLowerCase() } : null;
    }

    /** CSS 值形态（写 inline）：px 整数、其余两位小数 */
    private _formatCss(d: { value: number; unit: string }): string {
        return d.unit === "px"
            ? `${Math.round(d.value)}px`
            : `${Math.round(d.value * 100) / 100}${d.unit}`;
    }

    // ── 值绑定 ────────────────────────────────────────────────────────

    /** 值解析：空 warn 不作为 / 字面量恒态 / 简单路径双向 / 表达式只读降级 */
    private _setupValue(): void {
        const raw = String(this.value ?? "").trim();
        if (raw === "") {
            this.warn(`x-expandable: 值须为展开状态路径或表达式（如 x-expandable="ui.open"），指令未生效`);
            this._dead = true;
            return;
        }
        // 字面量：裸或引号包裹的 true/false（恒定态，点击 no-op）
        const quoted = /^(['"])(.*)\1$/.exec(raw);
        const lit = quoted?.[2] ?? raw;
        if (lit === "true" || lit === "false") {
            this._expanded = lit === "true";
            return;
        }
        if (!isSimpleStatePath(raw) && !this._warnedReadonly) {
            this._warnedReadonly = true;
            this.warn(
                `x-expandable: 值 "${raw}" 非简单状态路径，退化为只读（状态→DOM 照常；点击把手不回写）`,
            );
        } else if (isSimpleStatePath(raw)) {
            this._expandedPath = raw;
        }
        const initial = this.binding.watch(raw, ({ value }) => this._applyFromState(value));
        this._expanded = !!initial;
    }

    /** 外部状态 → DOM（watcher 回调）：等值短路（防循环——点击回写触发的回流在此被吸收） */
    private _applyFromState(value: any): void {
        if (this._destroyed || value == null) return;
        const expanded = !!value;
        if (expanded === this._expanded) return; // 等值短路
        this._applyExpanded(expanded, true);
    }

    /** 把手点击：仅双向路径翻转回写（字面量/只读降级 no-op，ADR-0069 决策二） */
    private _toggle(): void {
        if (this._destroyed || this._expandedPath == null) return;
        try {
            setVal(
                this.engine.store.state,
                this._expandedPath.split(this.engine.store.delimiter),
                !this._expanded,
            );
        } catch (e: any) {
            this.warn(`x-expandable: 状态写回失败（"${this._expandedPath}"）: ${e?.message ?? e}`);
        }
    }

    /**
     * 把手 absolute 定位上下文保障：宿主 computed position 为 static 时 inline 补
     * `position:relative`（微任务挂载后检测——detached 元素 computed 不可靠）。fixed /
     * absolute / 用户显式定位**不动**（slide 通道的目标覆盖形态是 fixed 宿主，CSS 强写
     * relative 会把它覆盖掉）。
     */
    private _ensurePositionContext(): void {
        const el = this.el;
        if (typeof getComputedStyle !== "function") return;
        if (getComputedStyle(el).position === "static") {
            el.style.position = "relative";
        }
    }

    // ── 把手 ──────────────────────────────────────────────────────────

    /** 构建把手（样式契约同 splitter 折叠把手；role=button 键盘可达） */
    private _buildTrigger(): void {
        const trigger = document.createElement("div");
        trigger.className = "autospark-expandable-trigger";
        trigger.setAttribute("role", "button");
        trigger.setAttribute("aria-label", "展开/折叠");
        trigger.tabIndex = 0;
        // 箭头 = 全局图标 arrow（registry 模块加载时已注入 sprite；use 文档全局解析，
        // 用户同名覆盖自动跟随）——splitter 把手同款
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("aria-hidden", "true");
        const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
        use.setAttribute("href", "#as-arrow");
        svg.appendChild(use);
        trigger.appendChild(svg);
        trigger.addEventListener("click", () => this._toggle());
        trigger.addEventListener("keydown", (ev) => {
            if (ev.key !== "Enter" && ev.key !== " ") return;
            ev.preventDefault();
            this._toggle();
        });
        this._trigger = trigger;
        this.el.appendChild(trigger);
        this._positionTrigger();
    }

    /** 把手定位：inline 只写坐标变量 --as-pos + data-pos-negative（定位/钳制归样式表两态规则） */
    private _positionTrigger(): void {
        const t = this._trigger;
        if (!t) return;
        t.setAttribute("data-direction", this._dir);
        const pos = this._parsePos();
        t.style.setProperty("--as-pos", pos.value);
        t.toggleAttribute("data-pos-negative", pos.negative);
        t.toggleAttribute("data-collapsed", !this._expanded);
    }

    /**
     * pos 坐标解析（边缘锚定模型，对齐 splitter collapsible / drawer trigger）：
     * `'center'`（默认）≡ `'50%'`；number = px；string = CSS 长度（负号 = 距对端）。
     * 非法 warn 回退居中。
     */
    private _parsePos(): { value: string; negative: boolean } {
        const raw = this.getOption("pos");
        if (raw === true || raw == null || raw === "" || raw === "center") {
            return { value: "50%", negative: false };
        }
        if (typeof raw === "number") {
            if (!Number.isFinite(raw)) return { value: "50%", negative: false };
            return { value: `${Math.abs(raw)}px`, negative: raw < 0 };
        }
        if (typeof raw === "string") {
            const s = raw.trim();
            if (s === "center") return { value: "50%", negative: false };
            const m = /^(-?[\d.]+)\s*(%|px|rem|em|vw|vh)?$/i.exec(s);
            if (!m) {
                this.warn(
                    `x-expandable: pos 值 "${raw}" 无法解析为坐标（center/数字 px/CSS 长度串），已按居中处理`,
                );
                return { value: "50%", negative: false };
            }
            return {
                value: `${m[1]!.replace("-", "")}${m[2]?.toLowerCase() ?? "px"}`,
                negative: m[1]!.startsWith("-"),
            };
        }
        return { value: "50%", negative: false };
    }

    // ── 折叠/展开应用（核心） ─────────────────────────────────────────

    /** 主轴尺寸属性：left/right → width、top/bottom → height */
    private get _sizeProp(): "width" | "height" {
        return this._dir === "top" || this._dir === "bottom" ? "height" : "width";
    }

    /** 滑出负 margin 属性（按收起方向分派：向哪边收起抵消哪边占位） */
    private get _marginProp(): "margin-left" | "margin-right" | "margin-top" | "margin-bottom" {
        return MARGIN_PROPS[this._dir] as any;
    }

    /** 是否滑出折叠形态（minSize 未声明或 ≤0） */
    private _isSlideCollapse(): boolean {
        return this._minDecl == null || this._minDecl.value <= 0;
    }

    /** 滑出距离：主轴 inline 数值优先（亚像素精确、无布局环境可用），布局 rect 兜底 */
    private _readExtent(): number {
        const prop = this._sizeProp;
        const inline = parseFloat(this.el.style[prop]);
        if (Number.isFinite(inline) && inline > 0) return inline;
        const rect = this.el.getBoundingClientRect();
        return rect[prop] || 0;
    }

    /** 应用展开/折叠终态（决策四双通道 + 决策六 reparent + 决策七注入 + 决策八事件） */
    private _applyExpanded(expanded: boolean, animate: boolean): void {
        const el = this.el;
        const from = this._expanded;
        const slideHide = !expanded && this._isSlideCollapse();
        this._expanded = expanded;
        // 宿主 data-collapsed 仅滑出折叠挂（子内容隐藏钩子）；minSize>0 收缩内容可见。
        // 把手 data-collapsed 独立挂（箭头翻转，minSize>0 折叠也翻转）——两处分离，splitter 先例
        el.toggleAttribute("data-collapsed", slideHide);
        this._trigger?.toggleAttribute("data-collapsed", !expanded);

        if (expanded) {
            // 展开：清滑出痕迹 + 恢复尺寸（maxSize 有值写 inline、缺省移除**本指令写过的**
            // inline 让 CSS 决定——不快照；用户模板自带 inline 不动）
            this._clearSlide();
            if (this._maxDecl) {
                el.style[this._sizeProp] = this._formatCss(this._maxDecl) as any;
                this._ownSizeProp = true;
            } else if (this._ownSizeProp) {
                el.style.removeProperty(this._sizeProp);
                this._ownSizeProp = false;
            }
            // 把手迁回宿主须在**动画启动前**（ADR-0069 决策六——此刻宿主活动边在停靠边，位置连续）
            this._undockTrigger();
        } else if (slideHide) {
            // 折叠 = 滑出（minSize=0）：尺寸保持不改，终态持续保持
            this._dockParent();
            if (this._mode === "slide") {
                el.style.removeProperty(this._marginProp);
                el.style.transform = SLIDE_TRANSFORMS[this._dir];
            } else {
                el.style.removeProperty("transform");
                el.style[this._marginProp] = `-${this._readExtent()}px` as any;
            }
        } else {
            // 折叠 = 尺寸收缩（minSize>0）：纯尺寸动画，无滑出无隐藏，把手不迁移
            this._clearSlide();
            el.style[this._sizeProp] = this._formatCss(this._minDecl!) as any;
            this._ownSizeProp = true;
        }

        // 态翻转：动画（滑出折叠的把手 reparent 在动画完成后）；初始应用（from === expanded
        // ——created 已把 _expanded 同步为初值）无动画、直接迁移（_dockTrigger 幂等，重复
        // 折叠调用不重复移动）
        if (from !== expanded) {
            if (animate) {
                if (slideHide) this._playAnimation(() => this._dockTrigger());
                else this._playAnimation();
            } else if (slideHide) {
                this._dockTrigger();
            }
            // 翻转事件（初始应用不派发——事件只反馈变更）
            if (this._initialized) {
                el.dispatchEvent(
                    new CustomEvent(expanded ? "expandable:expand" : "expandable:collapse", {
                        detail: { size: this._detailSize(expanded) },
                        bubbles: true,
                    }),
                );
            }
        } else if (slideHide) {
            this._dockTrigger();
        }
    }

    /** 清滑出痕迹（负 margin / transform / 父容器注入释放） */
    private _clearSlide(): void {
        this.el.style.removeProperty(this._marginProp);
        this.el.style.removeProperty("transform");
        this._releaseParentInjection();
    }

    /** 事件 detail.size：展开 = maxSize 格式化值或 null（无约束）；折叠 = 0 或 minSize */
    private _detailSize(expanded: boolean): number | string | null {
        if (expanded) return this._maxDecl ? this._formatCss(this._maxDecl) : null;
        return this._minDecl && this._minDecl.value > 0 ? this._formatCss(this._minDecl) : 0;
    }

    /** 挂动画属性（data-animating → CSS transition），transitionend/兜底超时摘除 + 完成回调 */
    private _playAnimation(onDone?: () => void): void {
        if (this._animTimer != null) clearTimeout(this._animTimer);
        this.el.setAttribute("data-animating", "");
        const done = () => {
            this.el.removeAttribute("data-animating");
            if (this._animTimer != null) {
                clearTimeout(this._animTimer);
                this._animTimer = null;
            }
            onDone?.();
        };
        this.el.addEventListener("transitionend", done, { once: true });
        // transitionend 不触发的环境（无布局/happy-dom/被禁用）兜底摘除——600ms 后仍执行 reparent
        this._animTimer = setTimeout(done, 600);
    }

    // ── 父容器注入（决策七） ──────────────────────────────────────────

    /** injectOverflow 默认 true（显式 false 才禁用） */
    private _shouldInjectOverflow(): boolean {
        return this.getOption("injectOverflow") !== false;
    }

    /** 父容器 computed overflow 是否已裁剪（hidden/clip 任一轴） */
    private _parentClips(parent: HTMLElement): boolean {
        if (typeof getComputedStyle !== "function") return false;
        const cs = getComputedStyle(parent);
        return [cs.overflow, cs.overflowX, cs.overflowY].some((v) => v === "hidden" || v === "clip");
    }

    /** 折叠期间注入：dock（定位上下文，恒挂）+ clip（overflow，注入通道开启且父容器未裁剪时挂） */
    private _dockParent(): void {
        if (this._injected) return; // 幂等（本实例）
        const parent = this.el.parentElement;
        if (!parent) return;
        dockCounts.set(parent, (dockCounts.get(parent) ?? 0) + 1);
        parent.setAttribute("data-autospark-expandable-dock", "");
        if (this._shouldInjectOverflow()) {
            if (!this._parentClips(parent)) {
                parent.setAttribute("data-autospark-expandable-clip", "");
            }
        } else if (!this._warnedOverflow && !this._parentClips(parent)) {
            // 禁用注入回落检测（决策七）：warn 一次、用户自负
            this._warnedOverflow = true;
            this.warn(
                `x-expandable: injectOverflow 已禁用且父容器 overflow 非 hidden/clip——滑出折叠过程宿主将溢出父容器可见，请自行处理裁剪`,
            );
        }
        this._injected = true;
    }

    /** 展开完成后释放（引用计数归零才摘属性——多实例共享父容器） */
    private _releaseParentInjection(): void {
        if (!this._injected) return;
        this._injected = false;
        const parent = this.el.parentElement;
        if (!parent) return;
        const n = (dockCounts.get(parent) ?? 1) - 1;
        if (n <= 0) {
            dockCounts.delete(parent);
            parent.removeAttribute("data-autospark-expandable-dock");
            parent.removeAttribute("data-autospark-expandable-clip");
        } else {
            dockCounts.set(parent, n);
        }
    }

    // ── 把手 reparent（决策六：展开态宿主内 / 滑出折叠终态父容器内） ──

    /** 把手移入父容器（折叠滑出完成后；CSS 折叠态规则接管定位，零 JS 测量） */
    private _dockTrigger(): void {
        const t = this._trigger;
        const parent = this.el.parentElement;
        if (!t || !parent || this._destroyed) return;
        if (t.parentElement !== parent) parent.appendChild(t);
        this._docked = true;
    }

    /** 把手移回宿主（展开动画启动前；清 inline 无需——两态定位全在样式表） */
    private _undockTrigger(): void {
        const t = this._trigger;
        if (!t || !this._docked) return;
        this.el.appendChild(t);
        this._docked = false;
    }
}
