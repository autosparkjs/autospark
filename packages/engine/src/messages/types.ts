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
 *
 * 状态暴露（ADR-0072）：`store.state.$messages = { items, options }` 保留键——items 为
 * 记录镜像（`shallow(items, shallow选项)`，AutoSparkMessage 纯数据）、options 为生效配置真身
 * （AutoSparkMessagesOptions，可直写）。词汇全链路统一：正文 `description`（旧 body 弃用）、
 * 链接 `link`（旧 href 弃用——HTML 属性仍 href）。
 *
 * 会话与双层渲染（ADR-0077）：`add()` 按 kind 返回 **AutoSparkMessageSession** 行为句柄
 * （原 MessageTask 家族正名扩容——show/hide/remove 统一基类面，Task/Confirm 子类扩展）；
 * 渲染改双层正交组合——**公共 shell**（所有 kind 共享骨架：close/type/title/description/
 * kind 出口/actions 最底）+ **kind renderer**（专属区组件，经 shell 默认出口 `x-slot` 嵌入，
 * 一 kind 一文件于 `src/messages/renderers/`）；卡片子树注入 **`$session`** 派生变量
 * （localData 通道——x-for `$index` 同构，行为专职、非响应式）。
 */
import type { ShallowObject } from "autostore";

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

/**
 * 记录存续级别（ADR-0071 决策 5 → ADR-0077 数值化，旧字符串值 'none'/'local'/'remote' 弃用）：
 * `0` 隐藏即销毁（toast 兼容语义，默认）；`1` **会话缓冲**——隐藏不销毁但不持久化，复用
 * maxLen 溢出 FIFO 清除（管理界面可再查看，刷新即失）；`2` localStorage 持久化；`3` 服务器
 * 持久化（fetchOptions.url POST 全量覆盖）。
 */
export type MessagePersistLevel = 0 | 1 | 2 | 3;

/** persist 语义常量（裸数字同合法；命名对齐 MESSAGE_* 常量惯例） */
export const MESSAGE_PERSIST = {
    /** 隐藏即销毁（默认，toast 语义） */
    NONE: 0,
    /** 会话缓冲：隐藏不销毁但不持久化，maxLen 溢出 FIFO 清除 */
    SESSION: 1,
    /** localStorage 持久化 */
    LOCAL: 2,
    /** 服务器持久化（POST 全量覆盖式同步） */
    REMOTE: 3,
} as const;

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
    /** 可选正文（HTML 同通道），渲染在 title 下一行、字号小一号；缺省不渲染行。
     * 全链路统一词（ADR-0072）：输入 / 渲染 props / 记录面同名 description */
    description?: string;
    /** 自动关闭延迟 ms（默认全局 delayClose=3000；`0` = sticky；hover 暂停/恢复剩余时间制） */
    delayClose?: number;
    /** 屏幕锚定位置（默认 'top-right'）；非法值 warn + 回退全局默认 */
    pos?: MessagePos;
    /** 分区列与屏幕边缘的间距（数字 = px，字符串透传 CSS）——仅列创建时生效，已建列不迁移 */
    offset?: number | string;
    /** 关闭按钮（默认 false；开启出 ×，内置 no 图标） */
    closable?: boolean;
    /** 可选链接：尾随 external 图标（新标签 + noopener；点击不关闭、置已读）。
     * 全链路统一词（ADR-0072）：记录面同名 link；HTML 属性仍为 href */
    link?: string;
    /** 归属者：业务透传（收件人/来源模块等），引擎不解释、不代填（ADR-0072） */
    owner?: string;
    /** 级别（默认 0，ADR-0072）：越大展示越靠列边端；同级按创建序 FIFO。
     * 入列时快照定序——update 改 level 不移动已展示卡；不影响 maxLen 淘汰 */
    level?: number;
    /** 已读标记（卡片任意点击自动置位；编程式走 markRead） */
    read?: boolean;
    /** 业务层状态：引擎纯透传存储 + `message:status` 事件，零解释 */
    status?: number | string;
    /** action value 应答结果（点击写入；task 只读 getter，写走 update） */
    result?: any;
    /** 记录存续级别（默认 0 隐藏即删；1 会话缓冲 / 2 local / 3 remote 隐藏转「已隐藏」态存活） */
    persist?: MessagePersistLevel;
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
    /** 内联样式（cssText 字符串，如 "border-left:3px solid red"）——卡片根追加语义，
     * 与 className 同点消费；渲染键不入持久化载荷（恢复走生效默认，ADR-0077） */
    styles?: string;
}

/**
 * fetch 透传配置（ADR-0072，原 `url` + `headers` 两键合并）：`url` + RequestInit 子集。
 * `method` / `body` 由引擎契约固定（GET 拉取 / POST 全量数组）——类型剥除防误配。
 * 进 `$messages.options` 真身：鉴权头运行时可刷新（token 续期场景），controller 每次
 * fetch 现读 state。警示：鉴权头随 state 可见——自行持久化整个 state 时请剥除。
 */
export interface MessageFetchOptions extends Omit<RequestInit, "method" | "body"> {
    /** load 拉取与 persist remote 同步端点 */
    url: string;
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
    /** 传输配置（load 拉取与 persist remote 同步；原 url/headers 两键合并，ADR-0072） */
    fetchOptions?: MessageFetchOptions;
    /** type → 图标名重映射（默认同名词映射；未注册名照传，缺图不破相兜底） */
    icons?: Partial<Record<MessageType, string>>;
    /**
     * 公共骨架选择器（ADR-0077 双层组合：所有 kind 共享的 shell 组件名，默认 'message'）。
     * 解析链：getComponent 链（scope 局部 → options.components）→ `options.uiShells` 引擎级
     * 注册表 → 内置默认。运行时直写换键对后续 `add` 生效、已展示卡不回溯（options 真身契约）。
     */
    shell?: string;
    /**
     * `$messages.items` 的 shallow 深度参数（ADR-0077，透传 autostore `shallow(items, deep)`
     * ——值域 `0 | 1`）：默认 `1`——数组结构变更 + 成员一层字段读写有事件（模板可绑
     * `r.title` 等记录字段）；`0` = 成员不代理，仅数组结构变更（增删/整替换）有事件——
     * 超大消息列表的最省形态（字段级绑定失效，聚合面板须走结构变更驱动的整行替换）。
     * 非零值一律归 1。**构造期一次性键**：运行时直写静默忽略（shallow 包装无法换壳——
     * options 真身「直写即生效」契约的第一条例外）。
     */
    shallow?: 0 | 1;
    /** 按 kind 的默认值与渲染插槽（值仅允许消息级键，manager 级键 warn + 忽略） */
    kinds?: Record<string, MessageKindOptions>;
}

/** kinds[kind] 的值形态：消息级键 + render 渲染插槽（ADR-0071 决策 16） */
export interface MessageKindOptions extends MessageProps {
    /** 该 kind 的渲染组件名（查找协议第一级：kinds[kind].render → shell → 内置注册表 → message-shell） */
    render?: string;
}

/** 内置默认（合并链第一层；persist 显式入表——merged 恒为数值级别，ADR-0077） */
export const MESSAGE_DEFAULTS: Required<
    Pick<MessageOptions, "type" | "pos" | "delayClose" | "showCount" | "closable" | "animate" | "level" | "persist">
> = {
    type: "none",
    pos: "top-right",
    delayClose: 3000,
    showCount: 5,
    closable: false,
    animate: "slide",
    level: 0,
    persist: 0,
};

/** 保留键封闭清单（含 kind='task' 域的 progress）：props 出现清单外键 → warn + 忽略 */
export const MESSAGE_RESERVED_KEYS: ReadonlySet<string> = new Set([
    "id",
    "kind",
    "type",
    "icon",
    "title",
    "description",
    "delayClose",
    "pos",
    "offset",
    "closable",
    "link",
    "owner",
    "level",
    "read",
    "status",
    "result",
    "persist",
    "actions",
    "anchor",
    "progress",
    "animate",
    "className",
    "styles",
]);

/**
 * 消息会话（ADR-0077，原 MessageTask 更名扩容）：单条消息**渲染生命周期的行为句柄**——
 * `messages.add()` 按 kind 分派返回（内置映射 `{ toast, task, confirm }`，自定义 kind 回
 * 基类）；`messages.sessions` 即全部存活会话的注册表（manager Map 面正名，同一张表）。
 * 数据投影（read/status/result）只读 getter——写走 `update(id, patch)`；`remove()` 后会话
 * 死亡（后续方法 no-op + warn，不复活）。卡片子树内可经 `$session` 派生变量访问本对象。
 */
export interface AutoSparkMessageSession {
    /** 记录 id（factory 形态下 resolve 后回填，挂起期为空串） */
    readonly id: string;
    /** 业务类别 */
    readonly kind: string;
    /** 卡片根元素（排队未显示 / 已关闭 / 已隐藏为 null） */
    readonly el: HTMLElement | null;
    /** 展示是否已关闭（隐藏记录 closed 为 true，但记录仍存活、可 show() 重显） */
    readonly closed: boolean;
    /** 已读标记（只读） */
    readonly read: boolean;
    /** 业务状态（只读透传） */
    readonly status: number | string | undefined;
    /** action value 应答（只读） */
    readonly result: any;
    /** 重显已隐藏记录（完整展示管线；展示中 / 排队中幂等 no-op；死后 no-op + warn） */
    show(): void;
    /** 关闭（走离场动画；幂等；factory 挂起期 = 取消） */
    hide(): void;
    /** 硬移除记录（含持久化数据同步删除：local 即写 / remote 即 flush 全量覆盖） */
    remove(): void;
}

/** toast 会话（kind='toast'）：基类面即全部——瞬时提示无专属行为 */
export interface AutoSparkToastMessageSession extends AutoSparkMessageSession {}

/**
 * 任务会话（kind='task'，原 ProgressTask 正名）：进度能力归 kind='task' 提供（非通用
 * 功能）。pause 为闸门语义（pause 后 progress 调用被忽略）；创建不自启；progress(100) /
 * stop() 完成态按 delayClose 收口、cancel() 立即关。
 */
export interface AutoSparkTaskMessageSession extends AutoSparkMessageSession {
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

/**
 * 确认会话（kind='confirm'，ADR-0077 升内置 kind）：三方法 ≡ 点击对应按钮（value 闭环：
 * 写 result → `message:action` 事件 → confirm resolve → hide 判定），与 DOM 点击同一条
 * 执行路径（事件观察者无感知差异）。**thenable**：`await show({kind:'confirm'})` 直接得
 * choice 应答（value；sticky 永不 settle——原 confirm() 糖的 Promise 语义由会话本体承载）。
 */
export interface AutoSparkConfirmMessageSession extends AutoSparkMessageSession {
    /** 确认（≡ 点击 yes 按钮） */
    yes(): void;
    /** 拒绝（≡ 点击 no 按钮） */
    no(): void;
    /** 取消（≡ 关闭消息，无应答写入） */
    cancel(): void;
    /** thenable：await 会话 = 等 choice 应答（value；sticky 永不 settle、永不 reject） */
    then<TResult1 = any, TResult2 = never>(
        onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | null,
        onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
    ): Promise<TResult1 | TResult2>;
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
 * 持久化序列化（ADR-0071 决策 18，ADR-0072 收紧）：**剥除所有函数与运行态**——handle /
 * factory / anchor / el / progress 不入持久化载荷；渲染/行为/生命周期配置（className /
 * styles / icon / pos / offset / closable / delayClose / closed / persist）一并剥除——恢复时
 * 走生效默认。载荷字段 = `AutoSparkMessageRecord` 数据字段全集。
 */
export const PERSIST_FIELDS: ReadonlyArray<keyof AutoSparkMessageRecord> = [
    "id",
    "kind",
    "type",
    "title",
    "description",
    "read",
    "owner",
    "level",
    "status",
    "result",
    "link",
];

/**
 * 单条记录 → 可序列化 JSON（persist 载荷，`AutoSparkMessageRecord & { actions?: string[] }`）：
 * - actions 仅保留**字符串项**（对象项含 handle 函数，剥除——恢复后字符串 action 可重查全局表；
 *   字符串动作名为 persist 专属恢复通道，不进 Record 类型——live 镜像里 actions 是解析后对象形态）；
 * - 不在 PERSIST_FIELDS 清单内的运行态键一律不入。
 */
export function serializeMessage(props: MessageProps): AutoSparkMessageRecord & { actions?: string[] } {
    const out: Record<string, any> = {};
    for (const key of PERSIST_FIELDS) {
        const v = (props as any)[key];
        if (v !== undefined) out[key as string] = v;
    }
    const stringActions = (props.actions ?? []).filter(
        (a): a is string => typeof a === "string",
    );
    if (stringActions.length > 0) out.actions = stringActions;
    return out as AutoSparkMessageRecord & { actions?: string[] };
}

// ── 状态暴露类型（ADR-0072：$messages 保留键） ─────────────────────

/**
 * 消息数据记录：纯业务数据面——服务器通知 DTO 形态，persist/remote 持久化载荷与
 * `$messages.items` 的公共基底。只承载跨会话有意义的业务字段；渲染/行为/生命周期配置
 * 不入（恢复时走生效默认）。id/kind/read 恒有（add / 恢复时归一补齐）。
 */
export interface AutoSparkMessageRecord {
    /** 记录 id（恒有；缺省自动生成补齐） */
    id: string;
    /** 业务类别（恒有；默认 'toast'） */
    kind: string;
    /** 已读标记（恒有——未读跨会话有意义，恢复后按需重弹未读） */
    read: boolean;
    /** 归属者：业务透传（收件人/来源模块等），引擎不解释、不代填 */
    owner?: string;
    /** 级别（默认 0）：越大展示越靠列边端（top 列在上 / bottom 列在下）；同级按创建序
     * FIFO。入列时快照定序——update 改 level 不移动已展示卡 */
    level?: number;
    /** 语义严重度（业务分类——error/info 是业务事实，非纯渲染） */
    type?: MessageType;
    /** 消息标题 */
    title?: string;
    /** 消息正文（全链路统一词：输入 / 渲染 / 记录同名） */
    description?: string;
    /** 业务状态（引擎纯透传） */
    status?: number | string;
    /** action value 应答结果 */
    result?: any;
    /** 业务链接 */
    link?: string;
}

/**
 * 消息记录（`$messages.items` 元素）= 数据记录 + 渲染/行为/生命周期字段。
 * 仍是纯数据形态：无函数（actions 为解析后剥 handle 形态）、无 DOM 引用（anchor 不入）。
 * 写通道仅 manager（记录级变更 = `items[i]` 整替换）；模板直写为违约自理（纪律不加机制）。
 */
export interface AutoSparkMessage extends AutoSparkMessageRecord {
    /** 记录⇄展示两态（恒有——恢复时由策略统一置 true，不读载荷） */
    closed: boolean;
    /** 显式图标名（优先于 type 默认映射） */
    icon?: string;
    /** 屏幕锚定位置（7 值枚举） */
    pos?: MessagePos;
    /** 分区列与屏幕边缘间距（仅列首次创建时生效） */
    offset?: number | string;
    /** 关闭按钮 */
    closable?: boolean;
    /** 进出场动画 */
    animate?: any;
    /** 附加类名（主题定制通道） */
    className?: string;
    /** 自动关闭延迟 ms（0 = sticky） */
    delayClose?: number;
    /** 内联样式（cssText——渲染键，ADR-0077） */
    styles?: string;
    /** 记录存续级别（恢复时按存储介质反推：local 存储 → 2 / remote → 3） */
    persist?: MessagePersistLevel;
    /** 进度（kind='task' 专属；每写同步进镜像） */
    progress?: number;
    /** 按钮行数据面（解析后、剥执行体） */
    actions?: AutoSparkMessageAction[];
}

/** 按钮项数据投影：`ResolvedMessageAction` 剥执行体——title/value/hide 是数据，handle 是行为 */
export type AutoSparkMessageAction = Omit<ResolvedMessageAction, "handle">;

/**
 * `$messages.options` 真身类型：生效全局配置（构造期注入「内置默认 < options.messages」
 * 合并结果）。Omit 两键的硬边界（ADR-0072）：`anchor`（DOM 引用）与 `actions`（函数值
 * 会被 autostore 按计算属性语义劫持）不入 state、构造期私有固化。state 写入为**信任
 * 通道**（不走 parseMessageProps 校验）；运行时修改对后续操作生效、已展示卡片不回溯。
 */
export type AutoSparkMessagesOptions = Omit<MessageOptions, "anchor" | "actions">;

/** $messages 容器（engine 注入 store.state 的保留键形态，ADR-0072） */
export interface AutoSparkMessagesState {
    /** 记录镜像：`shallow(items, options.shallow)`——默认 1：数组结构变更 + 成员一层字段
     * 读写有事件（孙级起 raw）；0：仅结构变更有事件。深度为构造期一次性配置（运行时改静默忽略） */
    items: ShallowObject<AutoSparkMessage[], 1>;
    /** 生效全局配置真身（普通对象 → autostore 默认深层代理，孙级可写有事件） */
    options: AutoSparkMessagesOptions;
}
