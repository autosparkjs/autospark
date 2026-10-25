/**
 * x-spark 装饰动效伞形指令（@autospark/plugins ADR-0005，取代 ADR-0002）：为宿主元素
 * 叠加不改变布局与内容的装饰性动画层。效果族经 `type` 声明：
 *
 * - `ripple`（缺省）：涟漪扩散——从边框开始循环向外扩散渐隐（原 x-ripple 全语义平移）；
 * - `spin`：色环旋转——环绕宿主边界的旋转色环动画（进行中指示）。
 *
 * ## 形态
 *
 * - `<div x-spark>`：恒开（无值）；
 * - `<div x-spark="ui.show">`：表达式 truthiness 控制开/关（`x-data` 局部变量可用，
 *   求值经 `findScopeByEl` 取宿主 scope——x-error 运行时取 scope 同款先例）；
 * - `<div x-spark="false">`：恒关；
 * - `x-spark-options`：静态整包配置（宽松 JSON，求值一次——动效参数是设计期配置，
 *   改值需重挂宿主），键见 {@link XSparkOptions}。
 *
 * ## 三维配置模型（ADR-0005 决策 2）：type × (rippleMode | spinMode) × trigger
 *
 * - `type: 'ripple' | 'spin'`（缺省 ripple，裸 x-spark 行为零漂移）；
 * - `rippleMode: 'ring' | 'glow' | 'echo'`（涟漪形态，缺省 echo——原 x-ripple 的 type
 *   键与外层效果族撞名让位改名）；
 * - `spinMode: 'rotate' | 'beam' | 'chase'`（spin 形态，缺省 beam）；
 * - `trigger: 'always' | 'hover' | 'click'`（家族统一，缺省 always）。
 *
 * 三通道等价声明（修饰符链级联）：`x-spark.spin.click`（第一段效果族、第二段触发器）
 * ≡ `{type:'spin',trigger:'click'}`；布尔键（`{spin:true}`/`{click:true}`）同通道等价；
 * 效果族并存按 spin > ripple 取先、触发器按 hover > always > click 取先（跨通道统一值序）。
 * 键面平铺按 type 分流：size 在 ripple 下=扩散距离、spin 下=环宽；gap 为 ripple 专属
 * （spin 恒转无静止段，声明时 warn 忽略）；rippleMode/spinMode 交叉声明 warn 忽略。
 *
 * ## spin 视觉契约（ADR-0005 决策 3）
 *
 * - `rotate`：整环匀速旋转——conic-gradient 渐变环沿宿主边界整体转动；
 * - `beam`（缺省）：光段跑边——一段亮弧沿 border 循环跑动；
 * - `chase`：双段追逐——两段对置亮弧间隔追逐。
 *
 * 环几何贴合宿主 border-radius（mask 环带 + 圆角继承）；环宽 = `size`（缺省 4px）；
 * `speed` = 旋转一圈时长（匀速 linear，与涟漪 ease-out 分流）；click = 每次点击转一圈
 * 播完即停（与 ripple click「单周期播放」严格对齐）；badge 下色环在角标圆内旋转。
 *
 * ## 徽标火花（badge，家族通用，ADR-0005 决策 4）
 *
 * `badge?: boolean | number` 将载体从「inset:0 全域」覆盖为「宿主右上角正圆」——圆心恰在
 * 宿主 border box 右上角顶点（top/right = -直径/2，一半悬于宿主外）。`true` = 默认直径 8px，
 * 正数字 = 自定义直径，非法值 warn 后不启用；启用且未显式给 color 时 color 缺省联动主题
 * 语义红（全家族生效）。ripple 下波环自角标圆边扩散；spin 下色环在角标圆内旋转。载体
 * z-index 取 CSS 最大值覆盖宿主内容（受宿主层叠上下文约束）；宿主 overflow:hidden 会
 * 裁剪 badge（文档说明，不强制干预）。
 *
 * ## 停止语义（ADR-0002 决策 6 平移）
 *
 * 指令值转假或 hover 移出时不打断在播周期：按已播时长取模计算当前周期剩余时间，
 * 延迟到周期末移除动画（周期末本就近乎透明，复位即自然消失）。周期起点以启动时刻
 * 近似（`performance.now()`，误差一帧内，装饰动画无需帧级精确）。
 *
 * ## 载体策略（ADR-0002 决策 5 平移）
 *
 * 伪元素优先（宿主加 `.x-spark` 标记 + `.x-spark-on` 激活；ripple echo 另启用 `::before`；
 * spin 加 `.x-spark-spin` + `.x-spark-spin-<mode>` 形态类），
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
 * `_runtimeKeepAttr` 才会保留 `x-spark`/`x-spark-options` 属性，dispatcher.start 的
 * 初始扫描随即 mount。晚入队（engine 已存活）广播即时安装（Runtime 指令重扫生效；
 * 首编译已剥除属性的 engine 无属性可扫——IIFE 场景按 script 顺序加载保证先注册）。
 *
 * **通道选择 Runtime（observer）而非 Compile（scope）**：spark 是纯呈现副作用（无编译期
 * 变换、无子树占有），observer 通道的 mounted/unmounted/attrChanged 与其生命周期天然
 * 同构；且 dispatcher 晚注册重扫对「属性已保留」的场景有补挂能力（编译期卸下的元素、
 * x-if 动态挂载的宿主都靠 observer 捕获）。值表达式的相对路径支持不靠 scope 通道，而是
 * mounted 时 `engine.findScopeByEl(el)` 取宿主 scope 建订阅（scope 缺失回退
 * `engine.store.watch` 绝对路径）——语义与 Compile 的 `binding.watch` 等价（同一
 * scope.watch 实现，x-data 局部变量可读）。
 *
 * **钩子委托**：spec 钩子的 `this` 是 engine 侧造的基类实例（engine/info/value/el 契约
 * 面），控制器 {@link SparkDirective} 经 WeakMap 挂靠——实例状态（配置/定时器/载体）
 * 全在控制器，spec 钩子只做存取转发。
 *
 * 自举（ADR-0002 决策 1；单点收敛于 {@link installPlugin}）：模块加载即执行
 * {@link bootstrapSparkPlugin}——`globalThis.AutoSpark` 已存在（引擎脚本先加载）→ 经类静态
 * `directive` 直接入安装器队列；否则推 `__AUTOSPARK_PLUGINS__` 预加载队列（首个 engine 构造
 * 开头 drain，插件体内再走 `directive(spec)`，赶在同构造的 setupPluginQueue 消费之前）。
 */

import type { AutoSpark, DirectiveSpec } from "autospark";
import { captureNamespace } from "../../runtime/bridge";
import { installPlugin } from "@autospark/utils";

/** 效果族：ripple 涟漪扩散（缺省）/ spin 色环旋转 */
export type XSparkType = "ripple" | "spin";

/** 涟漪形态：ring 外扩环 / glow 边框光晕呼吸 / echo 双环回声 */
export type XRippleMode = "ring" | "glow" | "echo";

/** spin 形态：rotate 整环匀速旋转 / beam 光段跑边 / chase 双段追逐 */
export type XSpinMode = "rotate" | "beam" | "chase";

/** 触发器：always 持续循环 / hover 仅悬停期间播放 / click 每次点击播放一个完整周期后停止 */
export type XSparkTrigger = "always" | "hover" | "click";

/** x-spark-options 配置（静态求值一次，ADR-0002 决策 3 / ADR-0005 决策 5） */
export interface XSparkOptions {
    /** 效果族，默认 ripple */
    type?: XSparkType;
    /** 涟漪形态（type:'ripple' 下生效），默认 echo */
    rippleMode?: XRippleMode;
    /** spin 形态（type:'spin' 下生效），默认 beam */
    spinMode?: XSpinMode;
    /** 触发器显式键，默认 always（click = 点击播一个完整周期自动停止，在播中连点忽略） */
    trigger?: XSparkTrigger;
    /** spin 开关 ≡ type:'spin'（`x-spark.spin` 修饰符同义注入） */
    spin?: boolean;
    /** ripple 开关 ≡ type:'ripple'（`x-spark.ripple` 修饰符同义注入） */
    ripple?: boolean;
    /** hover 开关 ≡ trigger:'hover'（`x-spark.hover` 修饰符同义注入） */
    hover?: boolean;
    /** always 开关 ≡ trigger:'always'（`x-spark.always` 修饰符同义注入） */
    always?: boolean;
    /** click 开关 ≡ trigger:'click'（`x-spark.click` 修饰符同义注入） */
    click?: boolean;
    /** 徽标火花（家族通用）：true = 宿主右上角 8px 正圆载体 / 正数字 = 自定义直径 px（启用时 color 缺省主题语义红） */
    badge?: boolean | number;
    /** 颜色，缺省跟随主题主色变量（badge 启用时缺省联动语义红） */
    color?: string;
    /** ripple：自边框向外扩散的最大距离 px（默认 12）/ spin：色环宽度 px（默认 4） */
    size?: number;
    /** 单循环周期 ms（ripple = 单波动画段 / spin = 旋转一圈），默认 3000 */
    speed?: number;
    /** 周期末静止段 ms（仅涟漪支持，烘进 keyframes 百分比），默认 0 */
    gap?: number;
}

/** 归一后的全量配置（带默认值） */
interface SparkConfig {
    type: XSparkType;
    rippleMode: XRippleMode;
    spinMode: XSpinMode;
    trigger: XSparkTrigger;
    /** 徽标直径 px（0 = 未启用） */
    badge: number;
    color: string;
    size: number;
    speed: number;
    gap: number;
}

/** 效果族归一优先序：多处声明并存时取先者（与触发器「跨通道统一值序」同构） */
const TYPE_PRIORITY: readonly XSparkType[] = ["spin", "ripple"];

/** 触发器归一优先序：多处声明并存时取先者（ADR-0002 决策 4「取第一个值」——跨通道统一值序） */
const TRIGGER_PRIORITY: readonly XSparkTrigger[] = ["hover", "always", "click"];

const DEFAULT_CONFIG: SparkConfig = {
    type: "ripple",
    rippleMode: "echo",
    spinMode: "beam",
    trigger: "always",
    badge: 0,
    color: "var(--auto-theme-color, #1677ff)",
    size: 12,
    speed: 3000,
    gap: 0,
};

/** 主题主色变量名（@autospark/theme 标尺，跟随 ThemeManager 动态主题） */
const THEME_COLOR_VAR = "var(--auto-theme-color, #1677ff)";

/** 宿主标记类（position 兜底 + CSS 变量默认值；无伪元素定义——伪元素挂在激活类上） */
const HOST_CLASS = "x-spark";
/** 激活类：伪元素 spark 层定义 + animation 生效开关 */
const ACTIVE_CLASS = "x-spark-on";
/** echo 双环标记：额外启用 ::before 载体（负延迟错相，仅涟漪 echo 形态） */
const ECHO_CLASS = "x-spark-echo";
/** spin 形态标记类：伪元素/降级层切换为旋转色环载体（环带 mask + 角度动画） */
const SPIN_CLASS = "x-spark-spin";
/** 降级子元素载体类 */
const LAYER_CLASS = "x-spark-layer";
/** 徽标火花宿主标记类：载体定位覆盖为右上角正圆（伪元素与降级子层同几何） */
const BADGE_CLASS = "x-spark-badge";
/** 徽标火花默认直径 px（badge: true 时） */
const BADGE_DEFAULT_SIZE = 8;
/** 徽标火花缺省色：主题语义红（跟随 ThemeManager 语义标尺，主题未加载兜底固定红） */
const BADGE_COLOR = "var(--auto-danger-color, #ff4d4f)";
/** 徽标载体 z-index（CSS 最大值：覆盖宿主内容与同上下文定位元素；受宿主层叠上下文约束） */
const BADGE_Z_INDEX = 2147483647;

/** spin 默认环宽 px（涟漪扩散距离缺省 12，色环环宽独立缺省——环带视觉厚度的合理档位） */
const SPIN_DEFAULT_SIZE = 4;
/** spin 缺省速度回退值（speed 非法回退文案与 DEFAULT_CONFIG 同源） */
const DEFAULT_SPEED = 3000;

/** spin 形态标记类：`x-spark-spin-<mode>`（rotate/beam/chase 各自的 conic 渐变模板） */
const spinModeClass = (mode: XSpinMode): string => `${SPIN_CLASS}-${mode}`;

/**
 * spin 三形态的 conic 渐变模板（background 值，直接引用 `var(--x-spark-angle)`）。
 *
 * 渐变必须直连角度变量，禁止经宿主级未注册自定义属性中转（如 `--x-spark-spin-bg`）：
 * 注册属性动画的 paint 失效传播只保证覆盖「计算时直接解析到该变量的属性」——经
 * 未注册变量中转的间接引用链在部分 Chromium 版本上不触发重绘，表现为角度在跑
 * （getComputedStyle 可见 angle 递增）而色环静止不转。伪元素静态规则与降级层
 * 内联样式共用本模板，保证三形态渐变单一来源。
 */
function spinGradientCss(mode: XSpinMode): string {
    switch (mode) {
        case "beam":
            return `conic-gradient(from var(--x-spark-angle), transparent 0deg, var(--x-spark-color) 30deg, transparent 70deg)`;
        case "chase":
            return `conic-gradient(from var(--x-spark-angle), var(--x-spark-color) 0deg 12deg, transparent 12deg 168deg, var(--x-spark-color) 168deg 180deg, transparent 180deg)`;
        default:
            return `conic-gradient(from var(--x-spark-angle), var(--x-spark-color), transparent 75%)`;
    }
}

/**
 * spin 降级子层的环带内联样式：mask 挖出环带（内环 = 载体 content-box，padding = 环宽）。
 * conic 渐变背景由调用处按形态经 spinGradientCss() 拼接（直接引用角度变量，见其注释）。
 */
const SPIN_LAYER_CSS =
    `padding:var(--x-spark-size);` +
    `-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);` +
    `-webkit-mask-composite:xor;` +
    `mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);` +
    `mask-composite:exclude;`;

/** 宿主 scope 最小结构契约（鸭子类型：值表达式响应式订阅，零 engine 类型依赖） */
interface SparkScope {
    watch(expr: string, cb: (payload: { value: any }) => void): any;
}

/** 全局 store fallback watcher 的最小 off 契约 */
interface SparkWatcher {
    off?: () => void;
}

/* ────────────────────────── 样式注入 ────────────────────────── */

/** 静态样式是否已注入（文档级共享，多 engine 安全——内容相同幂等） */
let stylesInjected = false;

/** 动态 keyframes 缓存：key = `${rippleMode}|${speed}|${gap}` → keyframes 名（参数组合全局去重） */
const keyframesCache = new Map<string, string>();

/** 动态 keyframes 的挂载 <style>（懒建，追加式累积） */
let keyframesStyleEl: HTMLStyleElement | null = null;

/** spin 旋转动画 keyframes 名（固定——匀速整圈，时长走 animation-duration，无参数烘焙） */
const SPIN_KEYFRAMES = "x-spark-rotate";

/**
 * 注入静态样式（首个指令实例化时执行一次）：
 *
 * - `:where(.x-spark)`：宿主 position 兜底——特异性 0，宿主自有定位规则（内联/类）可覆盖；
 * - `.x-spark`：CSS 变量默认值（color 缺省主题主色，消费端可被指令写入的实例变量覆盖）；
 * - `.x-spark.x-spark-on::after` / `::before`：伪元素涟漪层基底（inset:0 + 圆角继承 +
 *   穿透指针）与动画；echo 的 `::before` 负延迟错相；
 * - badge 规则：载体几何覆盖为宿主右上角正圆（实底圆点）；
 * - spin 规则：载体切换为旋转色环——conic 渐变 + mask 环带（padding=环宽，content-box
 *   exclude 挖洞）+ @property 角度动画（`--x-spark-angle` 注册后可参与 transition/animation）；
 *   spin 规则置于 badge 之后（同特异性后者胜——background 从实底圆点覆盖为渐变环带）；
 * - `prefers-reduced-motion: reduce`：系统减弱动效时停播（装饰性动画的可访问性底线）。
 */
function ensureStyles(): void {
    if (stylesInjected || typeof document === "undefined") return;
    stylesInjected = true;
    const style = document.createElement("style");
    style.setAttribute("data-x-spark", "");
    style.textContent = `
@property --x-spark-angle {
  syntax: "<angle>";
  inherits: false;
  initial-value: 0deg;
}
@keyframes ${SPIN_KEYFRAMES} { to { --x-spark-angle: 360deg; } }
:where(.${HOST_CLASS}) { position: relative; }
.${HOST_CLASS} {
  --x-spark-color: ${THEME_COLOR_VAR};
  --x-spark-size: 12px;
  --x-spark-duration: ${DEFAULT_SPEED}ms;
  --x-spark-anim: x-spark-ring-${DEFAULT_SPEED}-0;
  --x-spark-echo-delay: -${DEFAULT_SPEED / 2}ms;
  --x-spark-echo-size: 7.2px;
  --x-spark-badge-size: 8px;
}
.${HOST_CLASS}.${ACTIVE_CLASS}::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  animation: var(--x-spark-anim) var(--x-spark-duration) ease-out infinite;
}
.${HOST_CLASS}.${ACTIVE_CLASS}.${ECHO_CLASS}::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  /* click 触发器双环同时起波：第二环同心缩小（--x-spark-echo-size），与主环同拍收束；
     always/hover 维持负延迟错相位（同尺寸）——第二环尺寸仅在 click 下有别于主环 */
  --x-spark-size: var(--x-spark-echo-size);
  animation: var(--x-spark-anim) var(--x-spark-duration) ease-out infinite;
  animation-delay: var(--x-spark-echo-delay);
}
.${HOST_CLASS}.${BADGE_CLASS}.${ACTIVE_CLASS}::after {
  /* badge 徽标形态：载体缩为宿主右上角正圆（圆心恰在角点），实底圆点 + 波环自圆边扩散 */
  inset: auto;
  top: calc(-1 * var(--x-spark-badge-size) / 2);
  right: calc(-1 * var(--x-spark-badge-size) / 2);
  width: var(--x-spark-badge-size);
  height: var(--x-spark-badge-size);
  border-radius: 50%;
  background: var(--x-spark-color);
  z-index: ${BADGE_Z_INDEX};
}
.${HOST_CLASS}.${BADGE_CLASS}.${ACTIVE_CLASS}.${ECHO_CLASS}::before {
  /* echo 第二环同 badge 几何（双环同心，仅 delay/spread 通道区分） */
  inset: auto;
  top: calc(-1 * var(--x-spark-badge-size) / 2);
  right: calc(-1 * var(--x-spark-badge-size) / 2);
  width: var(--x-spark-badge-size);
  height: var(--x-spark-badge-size);
  border-radius: 50%;
  background: var(--x-spark-color);
  z-index: ${BADGE_Z_INDEX};
}
.${HOST_CLASS}.${SPIN_CLASS}.${ACTIVE_CLASS}::after {
  /* spin 载体（伪元素形态）：conic 渐变环带绕宿主边界匀速旋转——mask 挖出内环
     （padding = 环宽 size，content-box exclude），border-radius 继承贴合宿主圆角。
     渐变 background 不在本公共规则声明——三形态各自由下方规则直写（直接引用角度变量，
     经未注册变量中转的间接链在部分 Chromium 上不触发重绘），并保持置于 badge 规则之后：
     badge+spin 组合下 background 覆盖实底圆点，几何继承 badge 规则（色环画在角标圆内） */
  padding: var(--x-spark-size);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  mask-composite: exclude;
  animation: ${SPIN_KEYFRAMES} var(--x-spark-duration) linear infinite;
}
.${HOST_CLASS}.${spinModeClass("rotate")}.${ACTIVE_CLASS}::after {
  background: ${spinGradientCss("rotate")};
}
.${HOST_CLASS}.${spinModeClass("beam")}.${ACTIVE_CLASS}::after {
  background: ${spinGradientCss("beam")};
}
.${HOST_CLASS}.${spinModeClass("chase")}.${ACTIVE_CLASS}::after {
  background: ${spinGradientCss("chase")};
}
@media (prefers-reduced-motion: reduce) {
  .${HOST_CLASS}.${ACTIVE_CLASS}::after,
  .${HOST_CLASS}.${ACTIVE_CLASS}.${ECHO_CLASS}::before,
  .${HOST_CLASS}.${SPIN_CLASS}.${ACTIVE_CLASS}::after { animation: none; }
}`;
    document.head.appendChild(style);
}

/**
 * 生成/复用涟漪 keyframes（ADR-0002 决策 4：静止段烘进 keyframes 百分比——
 * 动画段占 speed/(speed+gap) 比例，末段保持终态即 gap 静止，单 animation 无缝循环）。
 *
 * keyframes 语法百分比不支持 var()，参数组合（rippleMode/speed/gap）动态生成并全局去重缓存。
 * 环形态用 box-shadow spread 扩散（硬边环自边框长出渐散）而非 transform scale——
 * 前者无需感知宿主尺寸、天然贴合 border-radius、窗口缩放不失效。
 * spin 不走此函数（角度动画是固定 keyframes，时长走 animation-duration）。
 */
function ensureKeyframes(cfg: SparkConfig): string {
    const key = `${cfg.rippleMode}|${cfg.speed}|${cfg.gap}`;
    const cached = keyframesCache.get(key);
    if (cached) return cached;

    const name = `x-spark-${cfg.rippleMode}-${cfg.speed}-${cfg.gap}`;
    const period = cfg.speed + cfg.gap;
    const animPct = period > 0 ? Math.round((cfg.speed / period) * 100) : 100;
    let frames: string;
    if (cfg.rippleMode === "glow") {
        // 呼吸光晕：半周期 blur 达到 size（光晕最大）、整周期归零，纯 box-shadow 明暗循环
        const peak = Math.round(animPct / 2);
        frames = `
  0% { box-shadow: 0 0 0 0 transparent; }
  ${peak}% { box-shadow: 0 0 var(--x-spark-size) 0 var(--x-spark-color); }
  ${animPct}% { box-shadow: 0 0 0 0 transparent; }
  100% { box-shadow: 0 0 0 0 transparent; }`;
    } else {
        // ring / echo：外扩环——spread 自 0（贴边框）扩散至 size，颜色同步渐隐
        frames = `
  0% { box-shadow: 0 0 0 0 var(--x-spark-color); }
  ${animPct}% { box-shadow: 0 0 0 var(--x-spark-size) transparent; }
  100% { box-shadow: 0 0 0 var(--x-spark-size) transparent; }`;
    }

    if (!keyframesStyleEl) {
        keyframesStyleEl = document.createElement("style");
        keyframesStyleEl.setAttribute("data-x-spark-keyframes", "");
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
 * 配置错误不致命，不中断渲染）。键面平铺按 type 分流（ADR-0005 决策 5）：
 * rippleMode 仅 ripple 消费、spinMode 仅 spin 消费（交叉声明 warn 忽略）、gap 仅涟漪支持。
 */
function normalizeConfig(raw: Record<string, any> | undefined, warn: (msg: string) => void): SparkConfig {
    const cfg: SparkConfig = { ...DEFAULT_CONFIG };
    if (!raw) return cfg;

    // 效果族三通道归一（ADR-0005 决策 2）：type 显式键 + spin/ripple 布尔开关
    // （`x-spark.spin` 修饰符经引擎解析期等价注入为 {spin:true}——getDirectives.ts 的
    // modifier 开关注入，与 x-spark-options JSON 同一落点；修饰符链级联 x-spark.spin.click
    // 双段分别注入两键）。多处并存时按 spin > ripple 取先者；均未声明回退默认 ripple。
    // 显式 false = 压制开关（JSON 键占位阻断 modifier 注入，ADR-0007 语义自然成立）。
    const typeSeen = new Set<XSparkType>();
    if (raw.type !== undefined) {
        if (raw.type === "ripple" || raw.type === "spin") typeSeen.add(raw.type);
        else warn(`x-spark: type 取值非法（${JSON.stringify(raw.type)}），已回退 "ripple"（涟漪形态请用 rippleMode 声明）`);
    }
    for (const key of ["spin", "ripple"] as const) {
        const v = raw[key];
        if (v === true) typeSeen.add(key);
        else if (v !== undefined && v !== false) warn(`x-spark: ${key} 开关须为布尔值，已忽略`);
    }
    const resolvedType = TYPE_PRIORITY.find((t) => typeSeen.has(t));
    if (resolvedType) cfg.type = resolvedType;

    // 触发器三通道归一（ADR-0002 决策 4 平移）：trigger 显式键 + hover/always/click 布尔开关
    const triggerSeen = new Set<XSparkTrigger>();
    if (raw.trigger !== undefined) {
        if (raw.trigger === "always" || raw.trigger === "hover" || raw.trigger === "click") triggerSeen.add(raw.trigger);
        else warn(`x-spark: trigger 取值非法（${JSON.stringify(raw.trigger)}），已忽略`);
    }
    for (const key of ["hover", "always", "click"] as const) {
        const v = raw[key];
        if (v === true) triggerSeen.add(key);
        else if (v !== undefined && v !== false) warn(`x-spark: ${key} 开关须为布尔值，已忽略`);
    }
    const resolvedTrigger = TRIGGER_PRIORITY.find((t) => triggerSeen.has(t));
    if (resolvedTrigger) cfg.trigger = resolvedTrigger;

    // 效果形态键按 type 分流：rippleMode 仅涟漪消费 / spinMode 仅 spin 消费（交叉声明 warn 忽略）
    if (raw.rippleMode !== undefined) {
        if (cfg.type !== "ripple") warn("x-spark: rippleMode 仅在 type:'ripple' 下生效，已忽略");
        else if (raw.rippleMode === "ring" || raw.rippleMode === "glow" || raw.rippleMode === "echo") cfg.rippleMode = raw.rippleMode;
        else warn(`x-spark: rippleMode 取值非法（${JSON.stringify(raw.rippleMode)}），已回退 "echo"`);
    }
    if (raw.spinMode !== undefined) {
        if (cfg.type !== "spin") warn("x-spark: spinMode 仅在 type:'spin' 下生效，已忽略");
        else if (raw.spinMode === "rotate" || raw.spinMode === "beam" || raw.spinMode === "chase") cfg.spinMode = raw.spinMode;
        else warn(`x-spark: spinMode 取值非法（${JSON.stringify(raw.spinMode)}），已回退 "beam"`);
    }

    // badge 归一（ADR-0005 决策 4，家族通用）：true = 默认直径；正数字 = 自定义直径 px；
    // false/缺省 = 不启用；非法值 warn 后不启用（宽松策略与其余键一致）
    if (raw.badge !== undefined && raw.badge !== false) {
        if (raw.badge === true) cfg.badge = BADGE_DEFAULT_SIZE;
        else if (typeof raw.badge === "number" && Number.isFinite(raw.badge) && raw.badge > 0) cfg.badge = raw.badge;
        else warn(`x-spark: badge 须为 true 或正数字（直径 px），已忽略`);
    }
    let colorExplicit = false;
    if (raw.color !== undefined) {
        if (typeof raw.color === "string" && raw.color.trim() !== "") {
            cfg.color = raw.color;
            colorExplicit = true;
        } else warn("x-spark: color 须为非空字符串，已回退默认色");
    }
    // color 缺省联动：badge 启用且未显式给 color → 主题语义红（显式 color 恒优先）
    if (cfg.badge > 0 && !colorExplicit) cfg.color = BADGE_COLOR;

    // size/speed 数值归一（gap 单独处理——效果专属键）。size 缺省按 type 分流：
    // 涟漪扩散距离 12 / 色环环宽 4——未显式声明或非法回退时统一走此分流
    let sizeDeclared = false;
    for (const key of ["size", "speed"] as const) {
        const v = raw[key];
        if (v === undefined) continue;
        if (typeof v !== "number" || !Number.isFinite(v) || v < 0) {
            warn(`x-spark: ${key} 须为非负数字，已回退默认值`);
            continue;
        }
        if (key === "size") sizeDeclared = true;
        cfg[key] = v;
    }
    if (!sizeDeclared) cfg.size = cfg.type === "spin" ? SPIN_DEFAULT_SIZE : DEFAULT_CONFIG.size;
    if (cfg.speed <= 0) {
        warn(`x-spark: speed 须为正数（总周期为 0 将无法产生动画），已回退 ${DEFAULT_SPEED}`);
        cfg.speed = DEFAULT_SPEED;
    }
    // gap 仅涟漪支持（spin 恒转无静止段）：非法值按数值规则 warn 回退；spin 下声明 warn 忽略
    if (raw.gap !== undefined) {
        if (cfg.type !== "spin") {
            if (typeof raw.gap !== "number" || !Number.isFinite(raw.gap) || raw.gap < 0) {
                warn("x-spark: gap 须为非负数字，已回退默认值");
            } else {
                cfg.gap = raw.gap;
            }
        } else {
            warn("x-spark: gap 仅涟漪支持（spin 恒转无静止段），已忽略");
        }
    }
    return cfg;
}

/* ────────────────────────── 指令类 ────────────────────────── */

/**
 * SparkDirective（spark 控制器，ADR-0002 决策 2 平移）：实例状态与全部逻辑的宿主。注册形态
 * 走 `AutoSpark.directive(spec)` spec 重载（见模块头「注册通道」节）——engine 侧造的
 * 指令类继承基类，spec 钩子经 WeakMap 委托到本类实例（{@link bootstrapSparkPlugin}）。
 *
 * 生命周期：`mounted()` 解析配置 + 建值订阅 + 接线触发器；`unmounted()` 清理定时器、
 * 载体与宿主类（scope 通道 watcher 由 scope.destroy 统一回收，fallback 句柄自行 off）。
 *
 * 状态机（enabled = 值 truthiness 总开关；playing = 当前是否在播）：
 * - enabled=false → 永不播放；转假时若在播 → 播完当前周期再停（决策 6）；
 * - enabled=true → always 立即启动循环；hover 待 mouseenter 播放、mouseleave 播完当前周期。
 */
export class SparkDirective {
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
    config: SparkConfig;

    /** 存活标记：unmounted 后值订阅回调短路（scope.watch 无句柄，真 off 留给 scope.destroy） */
    private alive = true;
    /** 值总开关（truthiness）；false 时永不播放 */
    private enabled = true;
    /** 当前是否在播 */
    private playing = false;
    /** 载体形态（探测定时器定型后赋值；null = 未定） */
    private carrier: "pseudo" | "element" | null = null;
    /** 降级子元素载体（ripple echo 双环注入两个） */
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

    /** spin 效果族快捷判断 */
    private get isSpin(): boolean {
        return this.config.type === "spin";
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
        this.el?.classList.remove(
            HOST_CLASS,
            ACTIVE_CLASS,
            ECHO_CLASS,
            BADGE_CLASS,
            SPIN_CLASS,
            spinModeClass("rotate"),
            spinModeClass("beam"),
            spinModeClass("chase"),
        );
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
        const scope = this.engine.findScopeByEl(this.el) as SparkScope | undefined;
        if (scope && typeof scope.watch === "function") {
            const initial = scope.watch(expr, listener);
            this.setEnabled(!!initial);
        } else {
            const watcher = (this.engine as any).store.watch(expr, listener) as SparkWatcher;
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
            this.carrier = ((this.constructor as typeof SparkDirective).probe ?? probePseudoOccupied)(this.el)
                ? "element"
                : "pseudo";
            this.el.classList.add(HOST_CLASS);
            if (this.isSpin) this.el.classList.add(SPIN_CLASS, spinModeClass(this.config.spinMode));
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
        // spin 匀速整圈（linear，speed = 一圈时长）；涟漪 ease-out 波周期（speed+gap 烘焙 keyframes）
        const anim = this.isSpin
            ? `${SPIN_KEYFRAMES} ${this.config.speed}ms linear infinite`
            : `${this.animName} ${this.config.speed + this.config.gap}ms ease-out infinite`;
        if (this.carrier === "pseudo") {
            this.el.classList.add(ACTIVE_CLASS);
            if (!this.isSpin && this.config.rippleMode === "echo") this.el.classList.add(ECHO_CLASS);
        } else {
            this.layers.forEach((layer, i) => {
                layer.style.animation = anim;
                // click 双环同时起波：第二环同心缩小（0.6×）；always/hover 错相位同尺寸
                if (!this.isSpin && i > 0) {
                    layer.style.animationDelay = `${this.echoDelay}ms`;
                    layer.style.setProperty("--x-spark-size", `${this.echoSize}px`);
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
     * 窗口恒为整周期（speed+gap，含末尾静止段）——echo+click 的第二环经压缩时长同拍收束；
     * spin 下 gap 恒 0，窗口 = 一圈时长。 */
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

    /** 动画名（涟漪参数组合 keyframes，全局去重缓存；spin 恒固定角度 keyframes） */
    private get animName(): string {
        return this.isSpin ? SPIN_KEYFRAMES : ensureKeyframes(this.config);
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
        style.setProperty("--x-spark-color", this.config.color || THEME_COLOR_VAR);
        style.setProperty("--x-spark-size", `${this.config.size}px`);
        style.setProperty("--x-spark-duration", `${this.config.speed + this.config.gap}ms`);
        style.setProperty("--x-spark-anim", this.animName);
        style.setProperty("--x-spark-echo-delay", `${this.echoDelay}ms`);
        style.setProperty("--x-spark-echo-size", `${this.echoSize}px`);
        if (this.config.badge > 0) style.setProperty("--x-spark-badge-size", `${this.config.badge}px`);
    }

    /**
     * 注入降级子元素载体（ripple echo 双环注入两个）：absolute 脱离文档流，不参与 flex/gap
     * 布局。badge 启用时层同样定位为右上角正圆（与伪元素形态同几何，内联样式承载——降级层
     * 本就全内联）；spin 下层为环带载体（SPIN_LAYER_CSS 内联 mask 环带 + 渐变环）。
     */
    private injectLayers(): void {
        const count = !this.isSpin && this.config.rippleMode === "echo" ? 2 : 1;
        const badge = this.config.badge > 0 ? this.config.badge : 0;
        for (let i = 0; i < count; i++) {
            const layer = document.createElement("span");
            layer.className = LAYER_CLASS;
            layer.style.cssText = badge
                ? `position:absolute;top:${-badge / 2}px;right:${-badge / 2}px;width:${badge}px;height:${badge}px;` +
                  `border-radius:50%;pointer-events:none;display:block;z-index:${BADGE_Z_INDEX};` +
                  (this.isSpin ? `${SPIN_LAYER_CSS}background:${spinGradientCss(this.config.spinMode)};` : `background:var(--x-spark-color);`)
                : `position:absolute;inset:0;border-radius:inherit;pointer-events:none;display:block;` +
                  (this.isSpin ? `${SPIN_LAYER_CSS}background:${spinGradientCss(this.config.spinMode)};` : "");
            this.el.appendChild(layer);
            this.layers.push(layer);
        }
    }
}

/* ──────────────── 插件自举（ADR-0002 决策 1；注册通道见模块头「注册通道」节） ──────────────── */

/** spec 基类实例 → 控制器挂靠表（spec 钩子委托的桥；实例随基类实例 GC 回收） */
const controllers = new WeakMap<object, SparkDirective>();

/** spec 钩子入口（mounted）：建控制器挂靠 + 转发（el 为 dispatcher 注入的宿主） */
function sparkMounted(this: { engine: AutoSpark<any>; el: HTMLElement; info: Record<string, any> }): void {
    if (!this.el) return;
    const controller = new SparkDirective(this.engine, this.info);
    controller.el = this.el;
    controllers.set(this, controller);
    controller.mounted();
}

/** spec 钩子入口（unmounted）：转发 + 摘挂靠 */
function sparkUnmounted(this: object): void {
    const controller = controllers.get(this);
    controllers.delete(this);
    controller?.unmounted();
}

/** spec 钩子入口（attrChanged）：转发（实例保留，仅重绑值订阅） */
function sparkAttrChanged(this: object, newVal: string, oldVal?: string): void {
    controllers.get(this)?.attrChanged(newVal, oldVal);
}

/**
 * 指令 spec（`AutoSpark.directive(spec)` spec 重载）：Runtime 通道 + 三钩子委托。
 * kind/priority 挂类静态；钩子挂原型（this = engine 侧造的基类实例）。singleton 与
 * initialize/dispose 均取基类默认（单例去重 + no-op）——无类级资源。
 */
const SPARK_SPEC: DirectiveSpec = {
    name: "spark",
    kind: 1, // Runtime（observer 通道，ADR-0002 决策 3 修订）
    priority: 0,
    mounted: sparkMounted as DirectiveSpec["mounted"],
    unmounted: sparkUnmounted as DirectiveSpec["unmounted"],
    attrChanged: sparkAttrChanged as DirectiveSpec["attrChanged"],
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
 * `_runtimeKeepAttr` 保留 x-spark 属性的前提是指令先注册）。
 */
export function bootstrapSparkPlugin(): void {
    installPlugin("x-spark", "directive", (autospark) => {
        captureNamespace(autospark); // 运行时桥命名空间捕获（对称 notifications；本指令当前零符号消费，预留统一通道）
        autospark.directive(SPARK_SPEC);
    });
}

// 模块加载即自举（对称 notifications 插件：置于模块尾部）
bootstrapSparkPlugin();
