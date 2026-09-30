/**
 * 消息体系类型（ADR-0071）：引擎级统一信息记录 + 屏幕分区栈呈现。
 *
 * 家族词汇：**消息**（message——统一信息记录，kind 划分业务类别）/ **分区列**（每 pos 一列的
 * fixed 定位堆叠栈，引擎结构）/ **消息外壳**（message-shell / task-shell——单项卡片的内置
 * 私有组件，shell 机制延伸，一组件一文件）。
 *
 * 与 ADR-0068 轻提示的传承：分区队列 / 原地更新 / 离场收拢 / shell 机制 / 动画 / 图标映射
 * 机制全部沿用；API 面（title / delayClose / add / update / show）与生命周期（记录 ⇄ 展示
 * 两态分离，persist 控制记录存续）由本模块取代。
 */

/** 提示类型（沿 ADR-0068 决策 12）：5 值封闭枚举；`none` = 无图标无着色纯文本 */
export type MessageType = "none" | "info" | "success" | "warn" | "error";

/** 屏幕锚定位置（沿 ADR-0068 决策 7）：7 值枚举，命名对齐 `data-overlay-placement` 词汇 */
export type MessagePos =
    | "top-left"
    | "top-center"
    | "top-right"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right"
    | "center";

/** 记录存续策略（ADR-0071 决策 5）：默认 none 隐藏即删（toast 兼容语义） */
export type MessagePersist = "none" | "local" | "remote";

export const MESSAGE_TYPES: ReadonlySet<string> = new Set([
    "none",
    "info",
    "success",
    "warn",
    "error",
]);

export const MESSAGE_POS: ReadonlySet<string> = new Set([
    "top-left",
    "top-center",
    "top-right",
    "bottom-left",
    "bottom-center",
    "bottom-right",
    "center",
]);

/** type → 内置图标名的默认映射（沿 ADR-0068 决策 12：同名词，success 映射内置 `yes` 图标） */
export const MESSAGE_TYPE_ICONS: Record<Exclude<MessageType, "none">, string> = {
    info: "info",
    success: "yes",
    warn: "warn",
    error: "error",
};

/**
 * 消息按钮项（沿 ADR-0068 决策 14 双形态 + ADR-0071 决策 13 `value` 键）：
 * 字符串 = 全局 action 名（查 `engine.actions`；带 anchor 时沿其 scope 链解析局部 action）；
 * 对象 = 局部一次性按钮（不进全局表，点击直调）。`value` 键为**数据应答**通道——点击写入
 * `message.result`（与 `handle` 正交可并存）；`hide` 约定键对齐 x-loading（ADR-0038）：
 * 默认 true（点击后关消息）、显式 false 保留。
 */
export type MessageActionItem =
    | string
    | {
          /** 按钮文案（缺失回退 "action"） */
          title?: string;
          /** 数据应答值：点击写入 message.result（决策 13 闭环） */
          value?: any;
          /** 点击执行体（局部按钮点击直调，不走 buildAction 广播） */
          handle?: (...args: any[]) => any;
          /** 点击后是否关闭所在消息（默认 true；显式 false 保留） */
          hide?: boolean;
          [key: string]: any;
      };

/** 预解析后的按钮项（引擎注入 props 前完成——render（含自定义）拿到即此形态） */
export interface ResolvedMessageAction {
    title: string;
    /** 执行体（null = 纯数据应答按钮，如 confirm 的 value-only actions） */
    handle: ((...args: any[]) => any) | null;
    hide: boolean;
    /** 是否携带 value（value 可能是 undefined/false，须以标记区分） */
    hasValue: boolean;
    value: any;
}

/**
 * 单次消息配置（ADR-0071 决策 4 数据模型）：保留键**封闭清单**——`options.messages` 全局
 * 默认、`kinds[kind]` 与单次调用 props 同构，浅合并（逐键覆盖）。未知键 warn + 忽略。
 * `progress` 为 kind='task' 专属键：其他 kind 携带 → warn + 忽略（非通用功能，决策 12）。
 */
export interface MessageProps {
    /** 记录 id（缺省自动生成补齐；同 id = 展示 props 原地更新） */
    id?: string;
    /** 业务类别（开放集合，默认 'toast'）；引擎仅 'toast' 与 'task' 有内置语义 */
    kind?: string;
    /** 提示类型（默认 'none'）：驱动图标与语义色（全边 border + 淡底） */
    type?: MessageType;
    /** 显式图标名（优先于 type 默认映射） */
    icon?: string;
    /** 消息标题（HTML；经 options.sanitizer 消毒——x-html 同通道） */
    title?: string;
    /** 可选正文（HTML 同通道），渲染在 title 下一行、字号小一号；缺省不渲染行 */
    body?: string;
    /** 自动关闭延迟 ms（默认全局 delayClose=3000；`0` = sticky；hover 暂停/恢复剩余时间制） */
    delayClose?: number;
    /** 屏幕锚定位置（默认 'top-right'）；非法值 warn + 回退全局默认 */
    pos?: MessagePos;
    /** 分区列与屏幕边缘的间距（数字 = px，字符串透传 CSS）——仅列创建时生效，已建列不迁移 */
    offset?: number | string;
    /** 关闭按钮（默认 false；开启出 ×，内置 no 图标） */
    closable?: boolean;
    /** 可选链接：尾随 external 图标（新标签 + noopener；点击不关闭、置已读） */
    href?: string;
    /** 已读标记（卡片任意点击自动置位；编程式走 markRead） */
    read?: boolean;
    /** 业务层状态：引擎纯透传存储 + `message:status` 事件，零解释 */
    status?: number | string;
    /** action value 应答结果（点击写入；task 只读 getter，写走 update） */
    result?: any;
    /** 记录存续策略（默认 'none' 隐藏即删；local/remote 隐藏转「已隐藏」态存活） */
    persist?: MessagePersist;
    /** 按钮行（字符串 = action 名 / 对象 = 局部按钮；value 键数据应答） */
    actions?: MessageActionItem[];
    /**
     * 上下文元素（三职合一，ADR-0071 决策 14）：① 局部 action 解析根 ② action 事件派发根
     * ③ 渲染数据视图基准（dataContext——render 组件挂链其 scope）。非定位（元素定位是
     * fast-follow）。字符串 = add 时一次性 querySelector，未命中 warn + 按无 anchor 处理。
     */
    anchor?: HTMLElement | string;
    /**
     * 初始进度 0~100（**kind='task' 专属键**——非通用消息功能，其他 kind 携带 warn + 忽略）；
     * task-shell 全权渲染进度槽。
     */
    progress?: number;
    /** 进出场动画（ADR-0039 三形态；默认 'slide' + 按 pos 的方向自适应覆写层） */
    animate?: any;
    /** 附加类名（追加在 `autospark-message` 之后，主题定制通道） */
    className?: string;
}

/**
 * 消息全局默认配置（`options.messages` 配置对象层，ADR-0071 决策 15）：MessageProps 全键 +
 * 管理器级键。`false` = 整体关闭（不初始化——不建容器、不注样式，调用 warn + no-op）。
 */
export interface MessageOptions extends MessageProps {
    /** 同屏显示上限（默认 5）——**按 pos 分区各计**，满员 FIFO 排队、自动关闭后按序补位 */
    showCount?: number;
    /** 存活记录数上限（溢出 FIFO 丢最旧；默认不限）；构造期固化（决策 6） */
    maxLen?: number;
    /** load 拉取与 persist remote 同步端点 */
    url?: string;
    /** fetch 透传头（如鉴权 token） */
    headers?: Record<string, string>;
    /** type → 图标名重映射（默认同名词映射；未注册名照传，缺图不破相兜底） */
    icons?: Partial<Record<MessageType, string>>;
    /** 自定义单项外壳组件名（全局兜底层——render 四级查找的第二级） */
    shell?: string;
    /** 按 kind 的默认值与渲染插槽（值仅允许消息级键，manager 级键 warn + 忽略） */
    kinds?: Record<string, MessageKindOptions>;
}

/** kinds[kind] 的值形态：消息级键 + render 渲染插槽（ADR-0071 决策 16） */
export interface MessageKindOptions extends MessageProps {
    /** 该 kind 的渲染组件名（查找协议第一级：kinds[kind].render → shell → 内置注册表 → message-shell） */
    render?: string;
}

/** 内置默认（合并链第一层） */
export const MESSAGE_DEFAULTS: Required<
    Pick<MessageOptions, "type" | "pos" | "delayClose" | "showCount" | "closable" | "animate">
> = {
    type: "none",
    pos: "top-right",
    delayClose: 3000,
    showCount: 5,
    closable: false,
    animate: "slide",
};

/** 保留键封闭清单（含 kind='task' 域的 progress）：props 出现清单外键 → warn + 忽略 */
export const MESSAGE_RESERVED_KEYS: ReadonlySet<string> = new Set([
    "id",
    "kind",
    "type",
    "icon",
    "title",
    "body",
    "delayClose",
    "pos",
    "offset",
    "closable",
    "href",
    "read",
    "status",
    "result",
    "persist",
    "actions",
    "anchor",
    "progress",
    "animate",
    "className",
]);

/** 消息任务句柄（ADR-0071 决策 8，最小面）：read/status/result 只读 getter——写走 update(id, patch) */
export interface MessageTask {
    /** 记录 id（factory 形态下 resolve 后回填，挂起期为空串） */
    readonly id: string;
    /** 业务类别 */
    readonly kind: string;
    /** 卡片根元素（排队未显示 / 已关闭 / 已隐藏为 null） */
    readonly el: HTMLElement | null;
    /** 关闭（走离场动画；幂等） */
    hide(): void;
    /** 展示是否已关闭（隐藏记录 closed 为 true，但记录仍存活、可 show(id) 重显） */
    readonly closed: boolean;
    /** 已读标记（只读） */
    readonly read: boolean;
    /** 业务状态（只读透传） */
    readonly status: number | string | undefined;
    /** action value 应答（只读） */
    readonly result: any;
}

/**
 * 进度任务句柄（ADR-0071 决策 12）：`progressbar()` 返回——`extends MessageTask`。
 * 进度能力归 kind='task' 提供（非通用功能）；pause 为闸门语义（pause 后 progress 调用被忽略）；
 * 创建不自启；progress(100)/stop() 完成态按 delayClose 收口、cancel() 立即关。
 */
export interface ProgressTask extends MessageTask {
    /** 开始接受进度推进（创建不自启，显式调用） */
    start(): void;
    /** 推进进度（clamp [0,100]；未 start / 已 pause / 已完成时调用被忽略） */
    progress(n: number): void;
    /** 闸门关闭：progress(n) 调用被忽略 */
    pause(): void;
    /** 闸门打开：恢复接受 progress(n) */
    resume(): void;
    /** 标记完成（≡ progress(100)）：完成态按 delayClose 展示后关 */
    stop(): void;
    /** 中止：立即关（无完成态） */
    cancel(): void;
}

/** 值解析产物：保留键校验前的用户 props（仅含清单内键的原始对象） */
export type ParsedMessageProps = MessageProps;

/**
 * 归一化 `add(...)` 入参（ADR-0071 决策 7，三态）：字符串简写 ≡ `{ title }`；对象原样
 * （保留键校验由调用方执行）。factory 形态不入此函数（调用方分派）。
 *
 * @param input 字符串 | 配置对象
 * @param warn  告警出口（engine.logger）
 * @returns 校验后的 props；非对象/数组返回 null（warn）
 */
export function parseMessageProps(
    input: string | MessageProps,
    warn: (msg: string) => void,
): ParsedMessageProps | null {
    const props: MessageProps = typeof input === "string" ? { title: input } : input;
    if (props == null || typeof props !== "object" || Array.isArray(props)) {
        warn("engine.messages.add: 入参须为消息字符串或配置对象，已忽略");
        return null;
    }
    // 未知键 warn（ADR-0061 决策 8 同构——保留键封闭清单的排错面）
    for (const key of Object.keys(props)) {
        if (!MESSAGE_RESERVED_KEYS.has(key)) {
            warn(`engine.messages: 未知配置键 "${key}"，已忽略（保留键清单见 ADR-0071 决策 4）`);
        }
    }
    return props;
}

/** 尺寸值格式化（offset）：数字 → px，字符串原样透传 CSS */
export function formatMessageSize(v: number | string): string {
    return typeof v === "number" ? `${v}px` : v;
}

/**
 * 持久化序列化（ADR-0071 决策 18）：**剥除所有函数与运行态**——handle / factory / anchor /
 * el / progress 不入持久化载荷；actions 仅保留字符串名（内联 handle 跨会话永久丢失）。
 * 序列化字段 = 数据字段全集。
 */
export const PERSIST_FIELDS: ReadonlyArray<keyof MessageProps> = [
    "id",
    "kind",
    "type",
    "icon",
    "title",
    "body",
    "read",
    "delayClose",
    "pos",
    "offset",
    "closable",
    "href",
    "status",
    "result",
    "persist",
    "className",
];

/**
 * 单条记录 → 可序列化 JSON（persist 载荷）：
 * - actions 仅保留**字符串项**（对象项含 handle 函数，剥除——恢复后字符串 action 可重查全局表）；
 * - 不在 PERSIST_FIELDS 清单内的运行态键一律不入。
 */
export function serializeMessage(props: MessageProps): Record<string, any> {
    const out: Record<string, any> = {};
    for (const key of PERSIST_FIELDS) {
        const v = (props as any)[key];
        if (v !== undefined) out[key as string] = v;
    }
    const stringActions = (props.actions ?? []).filter(
        (a): a is string => typeof a === "string",
    );
    if (stringActions.length > 0) out.actions = stringActions;
    return out;
}
