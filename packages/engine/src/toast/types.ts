/**
 * 轻提示体系类型（ADR-0068）：引擎级全局非阻塞通知。
 *
 * 家族词汇：**轻提示**（toast——屏幕分区栈短暂浮现的全局通知）/ **分区列**（每 pos 一列的
 * fixed 定位堆叠栈，引擎结构）/ **轻提示外壳**（toast-shell——单项卡片的内置私有组件，
 * shell 机制延伸）。
 */

/** 提示类型（ADR-0068 决策 12）：5 值封闭枚举；`none` = 无图标无着色纯文本 */
export type ToastType = "none" | "info" | "success" | "warn" | "error";

/** 屏幕锚定位置（ADR-0068 决策 7）：7 值枚举，命名对齐 `data-overlay-placement` 词汇 */
export type ToastPos =
    | "top-left"
    | "top-center"
    | "top-right"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right"
    | "center";

export const TOAST_TYPES: ReadonlySet<string> = new Set([
    "none",
    "info",
    "success",
    "warn",
    "error",
]);

export const TOAST_POS: ReadonlySet<string> = new Set([
    "top-left",
    "top-center",
    "top-right",
    "bottom-left",
    "bottom-center",
    "bottom-right",
    "center",
]);

/** type → 内置图标名的默认映射（ADR-0068 决策 12：同名词，success 映射内置 `yes` 图标） */
export const TOAST_TYPE_ICONS: Record<Exclude<ToastType, "none">, string> = {
    info: "info",
    success: "yes",
    warn: "warn",
    error: "error",
};

/**
 * toast 按钮项（ADR-0068 决策 14，两栖）：字符串 = 全局 action 名（查 `engine.actions`
 * 解析）；对象 = 局部一次性按钮（不进全局表，点击直调不广播）。`hide` 约定键对齐 x-loading
 * （ADR-0038）：默认 true（点击后关 toast）、显式 false 保留（如「撤销失败，重试」续显）。
 */
export type ToastActionItem =
    | string
    | {
          /** 按钮文案（缺失回退 "action"） */
          title?: string;
          /** 点击执行体（点击直调，不走 buildAction 广播——局部按钮无人监听生命周期事件） */
          handle: (...args: any[]) => any;
          /** 点击后是否关闭所在 toast（默认 true；显式 false 保留） */
          hide?: boolean;
          [key: string]: any;
      };

/** 预解析后的按钮项（引擎注入 props 前完成——shell（含自定义）拿到即此形态） */
export interface ResolvedToastAction {
    title: string;
    handle: (...args: any[]) => any;
    hide: boolean;
}

/**
 * 单次 toast 配置（ADR-0068 决策 4/5）：保留键**封闭清单**——`options.toast` 全局默认与
 * 单次调用 props 同构，浅合并（单次覆盖全局，每键独立）。未知键 warn + 忽略。
 */
export interface ToastProps {
    /** 实例 id（缺省自动生成补齐；同 id = 原地更新——换内容 + 重置计时，不重播动画） */
    id?: string;
    /** 提示类型（默认 'none'）：驱动图标与语义色 */
    type?: ToastType;
    /** 消息内容（HTML；经 options.sanitizer 消毒——x-html 同通道） */
    message?: string;
    /** 自动关闭延迟 ms（默认全局 delay=3000；`0` = sticky 永不自动关；hover 暂停/恢复剩余时间制） */
    delay?: number;
    /** 屏幕锚定位置（默认 'top-right'）；非法值 warn + 回退全局默认 */
    pos?: ToastPos;
    /** 分区列与屏幕边缘的间距（数字 = px，字符串透传 CSS）——仅列创建时生效，已建列不迁移 */
    offset?: number | string;
    /** 按钮行（字符串 = 全局 action 名 / 对象 = 局部按钮） */
    actions?: ToastActionItem[];
    /** 关闭按钮（默认 false——自动消失的轻提示不设手关钮；开启出 ×，内置 no 图标） */
    closable?: boolean;
    /** 进出场动画（ADR-0039 三形态；默认 'slide' + 按 pos 的方向自适应覆写层） */
    animate?: any;
    /** 附加类名（追加在 `autospark-toast` 之后，主题定制通道） */
    className?: string;
}

/**
 * toast 全局默认配置（`options.toast` 配置对象层，ADR-0068 决策 6）：ToastProps 全键 +
 * 管理器级键。`false` = 整体关闭（不初始化——不建容器、不注样式，调用 warn + no-op）。
 */
export interface ToastOptions extends ToastProps {
    /** 同屏显示上限（默认 5）——**按 pos 分区各计**，满员 FIFO 排队、自动关闭后按序补位 */
    showCount?: number;
    /** type → 图标名重映射（默认同名词映射 TOAST_TYPE_ICONS；未注册名照传，缺图不破相兜底） */
    icons?: Partial<Record<ToastType, string>>;
    /** 自定义单项外壳组件名（查找协议：`options.components` 全局表 → 内置默认；未命中 warn 回退） */
    shell?: string;
}

/** 内置默认（合并链第一层） */
export const TOAST_DEFAULTS: Required<
    Pick<ToastOptions, "type" | "pos" | "delay" | "showCount" | "closable" | "animate">
> = {
    type: "none",
    pos: "top-right",
    delay: 3000,
    showCount: 5,
    closable: false,
    animate: "slide",
};

/** 保留键封闭清单（ADR-0068 决策 4）：props 出现清单外键 → warn + 忽略 */
export const TOAST_RESERVED_KEYS: ReadonlySet<string> = new Set([
    "id",
    "type",
    "message",
    "delay",
    "pos",
    "offset",
    "actions",
    "closable",
    "animate",
    "className",
]);

/**
 * toast 任务句柄（ADR-0068 决策 4，最小面）：`engine.toast(...)` 的返回值。
 * `el` 在排队未显示时为 null（DOM 未挂）、关闭后亦为 null（DOM 已摘）；`hide()` 幂等、
 * 走离场动画；async factory 形态下挂起期 `hide()` = 取消（resolve 后不显示）。
 */
export interface ToastTask {
    /** 实例 id（factory 形态下 resolve 后回填，挂起期为空串） */
    readonly id: string;
    /** 卡片根元素（排队未显示 / 已关闭为 null） */
    readonly el: HTMLElement | null;
    /** 关闭（走离场动画；幂等） */
    hide(): void;
    /** 是否已关闭 */
    readonly closed: boolean;
}

/** 值解析产物：保留键校验 + 全局默认合并前的用户 props（仅含清单内键） */
export type ParsedToastProps = ToastProps;

/**
 * 归一化 `engine.toast(...)` 入参（ADR-0068 决策 4，三态）：字符串简写 ≡ `{ message }`；
 * 对象原样（保留键校验由调用方执行）。factory 形态不入此函数（调用方分派）。
 *
 * @param input 字符串 | 配置对象
 * @param warn  告警出口（engine.logger）
 * @returns 校验后的 props；非对象/数组返回 null（warn）
 */
export function parseToastProps(input: string | ToastProps, warn: (msg: string) => void): ParsedToastProps | null {
    const props: ToastProps = typeof input === "string" ? { message: input } : input;
    if (props == null || typeof props !== "object" || Array.isArray(props)) {
        warn("engine.toast: 入参须为消息字符串或配置对象，已忽略");
        return null;
    }
    // 未知键 warn（ADR-0061 决策 8 同构——保留键封闭清单的排错面）
    for (const key of Object.keys(props)) {
        if (!TOAST_RESERVED_KEYS.has(key)) {
            warn(`engine.toast: 未知配置键 "${key}"，已忽略（保留键清单见 ADR-0068 决策 4）`);
        }
    }
    return props;
}

/** 尺寸值格式化（offset）：数字 → px，字符串原样透传 CSS */
export function formatToastSize(v: number | string): string {
    return typeof v === "number" ? `${v}px` : v;
}
