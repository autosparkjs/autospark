import type { OverlayInstance } from "./instance";

/**
 * 覆盖物体系类型（ADR-0052 修订版——组件化统一）。
 *
 * 家族词汇：**覆盖物**（任意组件被渲染到 body 容器的消费方式）/ **覆盖物实例**（消费渲染产物 →
 * OverlayInstance）/ **覆盖物消费者**（x-dialog 等指令 + 命令式 OverlayHandle）。
 * 覆盖物**内容**就是普通组件（x-component 声明 / options.components 全局注册 / x-import 加载）——
 * 无独立声明指令（旧 x-overlay 声明语法已删，ADR-0052 修订共识 1）。
 */

/**
 * 定位锚配置（ADR-0052 决策 21）：与 scope 正交——scope 管数据视图、anchor 管显示位置。
 * 键名对齐 floating-ui（placement/offset/shift/flip/arrow），减少映射层。
 */
export interface OverlayAnchorConfig {
    /**
     * 定位锚（两栖，决策 22）：字符串选择器走相对查询（`utils/queryRelElement`——无前缀在
     * searchRoot 子树内查、`../` 父级爬升、`^` closest、`/` 全局 document，打开时现查，
     * 未命中 warn + 退屏幕居中）或元素引用（命令式）。与 x-loading 的 `selector` 同语法同基准。
     */
    selector?: string | HTMLElement;
    /**
     * 面板相对锚点的方向。**默认 `'auto'`**——视口空间自动选位（autoPlacement，与 flip 互斥）；
     * 显式配置 floating-ui 的 12 个方向值（`top|bottom|left|right` × `''|-start|-end`）则固定方向
     * + flip 视口翻转（默认开，`flip: false` 关）。
     */
    placement?: string;
    /** 透传 offset 中间件（间距） */
    offset?: any;
    /** 透传 shift 中间件（视口内滑移 padding） */
    shift?: any;
    /** 视口翻转，默认 true（floating-ui 推荐默认）；placement: 'auto' 时无 flip（互斥） */
    flip?: boolean;
    /** 箭头：true 时引擎自动注入载体元素 + 伪元素默认视觉（8×8 旋转 45°，决策 24） */
    arrow?: boolean;
}

/**
 * 覆盖物生效配置：三级深度合并后的形态（ADR-0052 修订共识 6）：
 *
 * ```
 * 内置默认（基座） < x-dialog-options（消费处指令选项） < 值对象内联（保留配置键）
 * ```
 *
 * 旧「声明处 x-overlay-options」层随声明指令消失（组件 def 不携带 options，无承载物）；
 * 命令式少值对象一级：`内置默认 < getOverlay options < open options`。
 */
export interface OverlayConfig {
    /**
     * 面板 1px 边框，**默认 true**（`border: false` 显式关闭）。边框画在**外壳**上并配套
     * 背景 + 圆角（外壳模式，同色背景填平圆角微差），箭头双层自动变色融合：底层菱形变
     * **边框色**、覆盖层变**面板背景色**并外扩（外向留出 ≈1.17px 边框色斜带与面板 border
     * 连续，内向仍完整遮蔽嵌入段的边框色与阴影）。颜色经 CSS 变量定制：
     * `--autospark-overlay-border`（边框色）/ `--autospark-overlay-bg`（面板背景色）。
     */
    border: boolean;
    /** 点击遮罩请求关闭（默认 true；仅模态遮罩形态有意义） */
    closeOnMask: boolean;
    /** 进出场动画（ADR-0039 三形态：字符串 | 对象 | false；默认 'fade'，经 resolveAnimate 解析） */
    animate: any;
    /**
     * **数据视图基准**（原 `scope` 更名——`scope` 与 x-scope/AutoSparkScope 撞名）：决定实例
     * 的表达式上下文/数据视图/生命周期挂链挂谁（挂链即基准）。`declarer`（默认，挂声明处
     * scope=定义闭包）| `host`（挂消费处 scope）。缺省 = `'declarer'`（默认值下沉到消费者——
     * 需区分「未声明」以支持旧键 `scope` 的兜底解析 + warn）；旧值 `'consumer'` 废弃（映射
     * `'host'` + warn）。
     */
    dataContext?: "declarer" | "host";
    /**
     * 自动关闭延迟（ms）：**> 0** 时打开后延时自动「请求关闭」（source `'delay'`，走标准
     * 关闭链——可回写的 visible 照常回写）；0/缺省不自动关。通知/公告类弹层的开箱即用通道。
     */
    delayClose?: number;
    /**
     * 定位锚（可选；无锚或未命中时 dialog 恒屏幕居中，ADR-0052 决策 21/24）。三态：
     * **字符串 / 元素简写**（≡ `{ selector }`——进合并链前归一化，只覆盖 selector、
     * 保留上层 placement/flip/arrow 等其余锚成员）或完整 {@link OverlayAnchorConfig} 对象。
     */
    at?: string | HTMLElement | OverlayAnchorConfig;
    /** 其余自由键原样保留（开放配置，供消费者指令/自定义 UI 消费） */
    [key: string]: any;
}

/** 内置默认配置（合并链第一层；dataContext 缺省——默认值在消费者下沉以支持旧键兜底） */
export const OVERLAY_DEFAULTS: OverlayConfig = {
    border: true,
    closeOnMask: true,
    animate: "fade",
    delayClose: 0,
};

/**
 * 消费者保留键封闭清单（ADR-0052 修订共识 7）：声明式值对象 / 命令式 options 中命中本清单
 * 的键**不作 props**——`visible` 是驱动键（命令式中无意义，warn 忽略），其余进配置合并链；
 * 清单之外的键**全部作 props** 注入组件 data 域（x-use 约定，覆盖 data() 默认）。撞保留键的
 * 风险由本封闭清单文档化（组件 props 避免使用这些名字）。`scope` 为已废弃旧键（值兜底解析）。
 */
export const OVERLAY_RESERVED_KEYS: ReadonlySet<string> = new Set([
    "visible",
    "border",
    "closeOnMask",
    "animate",
    "at",
    "scope",
    "dataContext",
    "delayClose",
]);

/**
 * `at` 键三态归一（Q2/Q3 共识）：字符串 / 元素简写归一为 `{ selector }`，对象原样返回；
 * null/undefined 返回 null。调用方（resolveOverlayConfig 合并链 / OverlayInstance._show）
 * 统一经此获得纯 `OverlayAnchorConfig` 形态。
 */
export function normalizeAtConfig(
    value: string | HTMLElement | OverlayAnchorConfig | null | undefined,
): OverlayAnchorConfig | null {
    if (value == null) return null;
    if (typeof value === "string" || value instanceof HTMLElement) return { selector: value };
    return value;
}

/**
 * 从消费处值对象/命令式 options 中分流保留键与 props（修订共识 7）。
 *
 * @returns `config` 为命中保留清单的配置键子集（进合并链顶层）；`props` 为其余键（注入组件 data 域）
 */
export function splitReservedKeys(
    input: Record<string, any> | null | undefined,
): { config: Record<string, any> | null; props: Record<string, any> | undefined } {
    if (!input || typeof input !== "object") return { config: null, props: undefined };
    const config: Record<string, any> = {};
    const props: Record<string, any> = {};
    let hasConfig = false;
    let hasProps = false;
    for (const key of Object.keys(input)) {
        if (OVERLAY_RESERVED_KEYS.has(key)) {
            config[key] = input[key];
            hasConfig = true;
        } else {
            props[key] = input[key];
            hasProps = true;
        }
    }
    return {
        config: hasConfig ? config : null,
        props: hasProps ? props : undefined,
    };
}

/** 事件双通道 payload（修订共识 9 收窄：type 删除）：覆盖物打开/关闭广播 */
export interface OverlayEventDetail {
    /** 覆盖物名（消费 attr 名） */
    name: string;
    /** 实例句柄 */
    instance: OverlayInstance;
    /** 数据视图基准元素（命令式 options.scope；声明式为 undefined） */
    scope?: HTMLElement;
}
