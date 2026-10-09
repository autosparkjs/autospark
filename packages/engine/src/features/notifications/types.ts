/**
 * 通知体系类型（ADR-0071）：引擎级统一信息记录 + 屏幕分区栈呈现。
 *
 * 家族词汇：**通知**（message——统一信息记录，type 划分业务类别）/ **分区列**（每 pos 一列的
 * fixed 定位堆叠栈，引擎结构）/ **通知外壳**（notification-shell / task-shell——单项卡片的内置
 * 私有组件，shell 机制延伸，一组件一文件）。
 *
 * 与 ADR-0068 轻提示的传承：分区队列 / 原地更新 / 离场收拢 / shell 机制 / 动画 / 图标映射
 * 机制全部沿用；API 面（title / delayClose / add / update / show）与生命周期（记录 ⇄ 展示
 * 两态分离，persist 控制记录存续）由本模块取代。
 *
 * 状态暴露（ADR-0072 → ADR-0089 纯化）：`store.state.$notifications = { items, options }` 保留键
 * ——items 为记录镜像（`shallow(items, shallow选项)`，**AutoSparkNotificationRecord 纯业务数据**
 * ——与持久化载荷零转换同构；渲染配置与运行态归组件实例，ADR-0089 决策七之三）、options
 * 为生效配置真身（AutoSparkNotificationsOptions，可直写）。词汇全链路统一：正文 `description`
 * （旧 body 弃用）、链接 `link`（旧 href 弃用——HTML 属性仍 href）。
 *
 * type 组件化（ADR-0089，取代 ADR-0077/0083/0088 的 session class 体系）：`add()` 恒返回
 * **组件实例**（ComponentInstance——data 响应式视图 / methods 直调 / props 别名）；一个
 * type = 一个 autospark 组件（x-define + `<script setup>` data/methods + scoped style，
 * 强制继承 base 族根——结构+行为双继承）；可见性 = display 模型（挂起/排队/隐藏
 * display:none，remove 真销毁）；`$session` 派生变量退役（模板内 methods 直达）。
 *
 * 三键更名（ADR-0079，未发布零迁移）：`kind` → **`type`**（业务类别——开放集合，驱动
 * types 默认与 type renderer 分派）；原 `type`（语义色五值）→ **`level`**（严重度，
 * `AutoSparkNotificationLevel` 数值枚举——宽松入参收数字或名字符串）；原排序用 `level`
 * （数字级别）**移除**——列内与镜像均纯到达序（FIFO）。
 */
import type { ShallowObject } from "autostore";
import type { AutoSparkAction } from "../action/types";
// manager.ts 等消费面从本模块导入 AutoSparkAction（约定键 actions 的元素类型）——本地用 + re-export
export type { AutoSparkAction };

/**
 * 通知严重度级别（ADR-0079，原 `type` 五值语义色数值化）：`0` = 无图标无着色纯文本
 * （默认）。宽松入参——数字与名字符串同收（归一见 `normalizeNotificationLevel`），内部恒数字。
 */
export type AutoSparkNotificationLevel = 0 | 1 | 2 | 3 | 4;

/** level 语义常量（裸数字同合法；命名对齐 NOTIFICATION_PERSIST 惯例） */
export const NOTIFICATION_LEVEL = {
    /** 无图标无着色纯文本（默认） */
    NONE: 0,
    /** 信息 */
    INFO: 1,
    /** 成功 */
    SUCCESS: 2,
    /** 警告 */
    WARN: 3,
    /** 错误 */
    ERROR: 4,
} as const;

/** level 名字面（数值 → 名映射表；DOM `data-notification-level` 属性值即名字） */
export const NOTIFICATION_LEVEL_NAMES = ["none", "info", "success", "warn", "error"] as const;

/** level 名形态（宽松入参与 `options.notifications.icons` 重映射的键形态） */
export type NotificationLevelName = (typeof NOTIFICATION_LEVEL_NAMES)[number];

/**
 * level 宽松归一（ADR-0079）：数字（0~4）或名字符串（`"warn"`）→ 数值；非法值返回
 * `null`（调用方 warn + 回退 NONE）。入参可读性优先——模板 action 里 `level: "error"`
 * 与 `level: NOTIFICATION_LEVEL.ERROR` 同权。
 */
export function normalizeNotificationLevel(v: unknown): AutoSparkNotificationLevel | null {
    if (typeof v === "number") {
        return Number.isInteger(v) && v >= 0 && v <= 4 ? (v as AutoSparkNotificationLevel) : null;
    }
    if (typeof v === "string") {
        const i = (NOTIFICATION_LEVEL_NAMES as readonly string[]).indexOf(v);
        return i >= 0 ? (i as AutoSparkNotificationLevel) : null;
    }
    return null;
}

/** level 数值 → DOM 名字面（`data-notification-level` 属性值；越界归 none） */
export function notificationLevelName(level: AutoSparkNotificationLevel): NotificationLevelName {
    return NOTIFICATION_LEVEL_NAMES[level] ?? "none";
}

/** 屏幕锚定位置（沿 ADR-0068 决策 7）：7 值枚举，命名对齐 `data-overlay-placement` 词汇 */
export type NotificationPos =
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
export type NotificationPersistLevel = 0 | 1 | 2 | 3;

/** persist 语义常量（裸数字同合法；命名对齐 NOTIFICATION_* 常量惯例） */
export const NOTIFICATION_PERSIST = {
    /** 隐藏即销毁（默认，toast 语义） */
    NONE: 0,
    /** 会话缓冲：隐藏不销毁但不持久化，maxLen 溢出 FIFO 清除 */
    SESSION: 1,
    /** localStorage 持久化 */
    LOCAL: 2,
    /** 服务器持久化（POST 全量覆盖式同步） */
    REMOTE: 3,
} as const;

export const NOTIFICATION_POS: ReadonlySet<string> = new Set([
    "top-left",
    "top-center",
    "top-right",
    "bottom-left",
    "bottom-center",
    "bottom-right",
    "center",
]);

/** level 名 → 内置图标名默认映射（沿原 type 映射：同名词，success 映射内置 `yes` 图标；none 无图标） */
export const NOTIFICATION_LEVEL_ICONS: Record<Exclude<NotificationLevelName, "none">, string> = {
    info: "info",
    success: "yes",
    warn: "warn",
    error: "error",
};


/** 预解析后的按钮项（引擎注入 props 前完成——render（含自定义）拿到即此形态） */
export interface ResolvedNotificationAction {
    title: string;
    /** 执行体（null = 纯数据应答按钮，如 confirm 的 value-only actions） */
    handle: ((...args: any[]) => any) | null;
    hide: boolean;
    /** 是否携带 value（value 可能是 undefined/false，须以标记区分） */
    hasValue: boolean;
    value: any;
}

/**
 * record 面入参（ADR-0089 决策九**两分法**）：复用 `AutoSparkNotificationRecord`——时间戳引擎
 * 生成不收；`level` 宽松入参（数字或名字符串，归一后落 record）。提平进 record，由
 * `persist` 分级决定是否持久化（type 种子默认差异化：toast 默认 0——隐于全局默认）。
 */
export type NotificationRecordInput = Partial<Omit<AutoSparkNotificationRecord, "createAt" | "updateAt" | "level">> & {
    level?: AutoSparkNotificationLevel | NotificationLevelName;
};

/**
 * 组件面 props（ADR-0089 决策九）：注水组件实例 data 域的配置——**永不持久化**；type
 * 自有键（task 的 `progress/canPause/canCancel/canStop` 等）经索引签名开放（随 type 组件
 * 契约）。调用语法与 record 面单包混传（分流是持久化语义，非可见性语义——组件可见全量：
 * 注水面 = record 面 + 组件面）。
 */
export interface NotificationComponentProps {
    /** 显式图标名（优先于 level 默认映射） */
    icon?: string;
    /** 自动关闭延迟 ms（默认全局 delayClose=3000；`0` = sticky；hover 暂停/恢复剩余时间制） */
    delayClose?: number;
    /** 屏幕锚定位置（默认 'top-right'）；非法值 warn + 回退全局默认 */
    pos?: NotificationPos;
    /** 分区列与屏幕边缘的间距（数字 = px，字符串透传 CSS）——仅列创建时生效，已建列不迁移 */
    offset?: number | string;
    /** 关闭按钮（默认 false；开启出 ×，内置 no 图标） */
    closable?: boolean;
    /** 按钮行（字符串 = action 名 / 对象 = 局部按钮；value 键数据应答） */
    actions?: AutoSparkAction[];
    /**
     * 上下文元素（三职合一，ADR-0071 决策 14）：① 局部 action 解析根 ② action 事件派发根
     * ③ 渲染数据视图基准（type 组件挂链其 scope）。非定位（元素定位是 fast-follow）。
     * 字符串 = add 时一次性 querySelector，未命中 warn + 按无 anchor 处理。
     */
    anchor?: HTMLElement | string;
    /** 进出场动画（ADR-0039 三形态；默认 'slide' + 按 pos 的方向自适应覆写层） */
    animate?: any;
    /** 附加类名（追加在 `autospark-notification` 之后，主题定制通道） */
    className?: string;
    /** 内联样式（cssText 字符串，如 "border-left:3px solid red"）——卡片根追加语义，
     * 与 className 同点消费；渲染键不入持久化载荷（恢复走生效默认，ADR-0077） */
    styles?: string;
    /** 卡片宽度（默认 'auto'——不写内联）；number = px、字符串原样 CSS 长度 */
    width?: number | string;
    /** 卡片高度（默认 'auto'） */
    height?: number | string;
    /** 最小宽度（number = px） */
    minWidth?: number | string;
    /** 最大宽度（缺省不写——内置 shell 的 CSS 层另有 `--autospark-notification-max-w: 360px` 兜底，
     * 显式声明时 inline 覆盖之） */
    maxWidth?: number | string;
    /** 最小高度（number = px） */
    minHeight?: number | string;
    /** type 自有键开放通道（ADR-0089）：task 的 progress/canPause/canCancel/canStop 等——
     * 随各 type 组件契约（types/*.ts 注释声明），引擎不解释透传注水 */
    [key: string]: any;
}

/**
 * 单次通知配置（ADR-0071 决策 4 → **ADR-0089 两分法组合**）：record 面（可持久化）×
 * 组件面（注水）单包混传——类型即架构宣言（键零重复声明：record 键单一来源
 * `AutoSparkNotificationRecord`）。`options.notifications` 全局默认、`types[type]` 同构，浅合并。
 */
export type NotificationProps = NotificationRecordInput & NotificationComponentProps;

/**
 * fetch 透传配置（ADR-0072，原 `url` + `headers` 两键合并）：`url` + RequestInit 子集。
 * `method` / `body` 由引擎契约固定（GET 拉取 / POST 全量数组）——类型剥除防误配。
 * 进 `$notifications.options` 真身：鉴权头运行时可刷新（token 续期场景），controller 每次
 * fetch 现读 state。警示：鉴权头随 state 可见——自行持久化整个 state 时请剥除。
 */
export interface NotificationFetchOptions extends Omit<RequestInit, "method" | "body"> {
    /** load 拉取与 persist remote 同步端点 */
    url: string;
}

/**
 * 通知全局默认配置（`options.notifications` 配置对象层，ADR-0071 决策 15）：NotificationProps 全键 +
 * 管理器级键。`false` = 整体关闭（不初始化——不建容器、不注样式，调用 warn + no-op）。
 */
export interface NotificationOptions extends NotificationProps {
    /** 同屏显示上限（默认 5）——**按 pos 分区各计**，满员 FIFO 排队、自动关闭后按序补位 */
    showCount?: number;
    /** 存活记录数上限（溢出 FIFO 丢最旧；默认不限）；构造期固化（决策 6） */
    maxLen?: number;
    /** 传输配置（load 拉取与 persist remote 同步；原 url/headers 两键合并，ADR-0072） */
    fetchOptions?: NotificationFetchOptions;
    /** level 名 → 图标名重映射（默认同名词映射；未注册名照传，缺图不破相兜底） */
    icons?: Partial<Record<NotificationLevelName, string>>;
    /**
     * `$notifications.items` 的 shallow 深度参数（ADR-0077，透传 autostore `shallow(items, deep)`
     * ——值域 `0 | 1`）：默认 `1`——数组结构变更 + 成员一层字段读写有事件（模板可绑
     * `r.title` 等记录字段）；`0` = 成员不代理，仅数组结构变更（增删/整替换）有事件——
     * 超大通知列表的最省形态（字段级绑定失效，聚合面板须走结构变更驱动的整行替换）。
     * 非零值一律归 1。**构造期一次性键**：运行时直写静默忽略（shallow 包装无法换壳——
     * options 真身「直写即生效」契约的第一条例外）。
     */
    shallow?: 0 | 1;
    /** 按 type 的默认值与渲染插槽（原 kinds 更名，ADR-0079；值仅允许通知级键，manager 级键 warn + 忽略） */
    types?: Record<string, NotificationTypeOptions>;
}

/** types[type] 的值形态：通知级键 + render 渲染插槽（ADR-0071 决策 16；原 NotificationKindOptions 更名） */
export interface NotificationTypeOptions extends NotificationProps {
    /** 该 type 的渲染组件名（查找协议第一级：types[type].render → shell → 内置注册表 → notification-shell） */
    render?: string;
}

/** 内置默认（合并链第一层；persist/level 显式入表——merged 恒为数值，ADR-0077/0079；
 *  type（业务类别）不入表——缺省 'toast' 在合并处兜底，沿原 kind 先例） */
export const NOTIFICATION_DEFAULTS: Required<
    Pick<NotificationOptions, "pos" | "delayClose" | "showCount" | "closable" | "animate" | "level" | "persist">
> = {
    pos: "top-right",
    delayClose: 3000,
    showCount: 5,
    closable: false,
    animate: "slide",
    level: 0,
    persist: 0,
};

/** 保留键封闭清单（含 type='task' 域的 progress）：props 出现清单外键 → warn + 忽略 */
export const NOTIFICATION_RESERVED_KEYS: ReadonlySet<string> = new Set([
    "id",
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
    "canPause",
    "canCancel",
    "canStop",
    "animate",
    "className",
    "styles",
    "width",
    "height",
    "minWidth",
    "maxWidth",
    "minHeight",
]);

export type ParsedNotificationProps = NotificationProps;

/**
 * 归一化 `add(...)` 入参（ADR-0071 决策 7，三态）：字符串简写 ≡ `{ title }`；对象原样。
 * factory 形态不入此函数（调用方分派）。**未知键不再校验**（ADR-0088 整包直传——自定义
 * type 的自有键合法，白名单排错面随投影退役）。
 *
 * @param input 字符串 | 配置对象
 * @param warn  告警出口（engine.logger）
 * @returns 校验后的 props；非对象/数组返回 null（warn）
 */
export function parseNotificationProps(
    input: string | NotificationProps,
    warn: (msg: string) => void,
): ParsedNotificationProps | null {
    const props: NotificationProps = typeof input === "string" ? { title: input } : input;
    if (props == null || typeof props !== "object" || Array.isArray(props)) {
        warn("engine.notifications.add: 入参须为通知字符串或配置对象，已忽略");
        return null;
    }
    return props;
}

/** 尺寸值格式化（offset）：数字 → px，字符串原样透传 CSS */
export function formatNotificationSize(v: number | string): string {
    return typeof v === "number" ? `${v}px` : v;
}

// ── 预设组件名约定（ADR-0083 → ADR-0094 收敛至 components/index.ts 注册面——注册名与
//    种子表同处定义，杜绝 drift；本模块 re-export 维持既有 `from "./types"` 导入面） ──────────────────────

export { ACTIONS_PRESET_NAME, BASE_PRESET_NAME, presetComponentName } from "../../components";

// ── 状态暴露类型（ADR-0072：$notifications 保留键） ─────────────────────

/**
 * 通知数据记录：纯业务数据面——服务器通知 DTO 形态，persist/remote 持久化载荷与
 * `$notifications.items` 的公共基底。只承载跨会话有意义的业务字段；渲染/行为/生命周期配置
 * 不入（恢复时走生效默认）。id/type/read 恒有（add / 恢复时归一补齐）。
 */
export interface AutoSparkNotificationRecord {
    /** 记录 id（恒有；缺省自动生成补齐） */
    id: string;
    /** 业务类别（恒有；默认 'toast'。原 kind 更名，ADR-0079） */
    type: string;
    /** 已读标记（恒有——未读跨会话有意义，恢复后按需重弹未读） */
    read: boolean;
    /** 归属者：业务透传（收件人/来源模块等），引擎不解释、不代填 */
    owner?: string;
    /** 严重度（默认 0 = none，原 type 语义色数值化，ADR-0079）：驱动图标与语义色；
     * 语义严重度是业务事实（error/info），非纯渲染。持久化载荷存数值 */
    level?: AutoSparkNotificationLevel;
    /** 通知标题 */
    title?: string;
    /** 通知正文（全链路统一词：输入 / 渲染 / 记录同名） */
    description?: string;
    /** 业务状态（引擎纯透传） */
    status?: number | string;
    /** action value 应答结果 */
    result?: any;
    /** 业务链接 */
    link?: string;
    /** 创建时间戳（ms；恒有——entry.createdAt 同源，恢复时从载荷还原） */
    createAt: number;
    /**
     * 最近数据变更时间戳（ms；恒有——`update()` 补丁 / 同 id 原地更新 / 置已读 /
     * action result 写入四入口刷新；创建时 = createAt。纯运行态变化不刷新）
     */
    updateAt: number;
}


/**
 * `$notifications.options` 真身类型：生效全局配置（构造期注入「内置默认 < options.notifications」
 * 合并结果）。Omit 两键的硬边界（ADR-0072）：`anchor`（DOM 引用）与 `actions`（函数值
 * 会被 autostore 按计算属性语义劫持）不入 state、构造期私有固化。state 写入为**信任
 * 通道**（不走 parseNotificationProps 校验）；运行时修改对后续操作生效、已展示卡片不回溯。
 */
export type AutoSparkNotificationsOptions = Omit<NotificationOptions, "anchor" | "actions">;

/**
 * $notifications 容器（engine 注入 store.state 的保留键形态，ADR-0072；sessions 键 ADR-0083 →
 * **ADR-0089 退役**——display 模型下在屏观察 = DOM / 组件 data.visible，第三通道可派生）。
 * items 纯 record 化（ADR-0089 决策七之三）：与持久化载荷零转换同构；渲染配置与运行态
 * 归组件实例（props 注水面 / data 域——`notifications.get(id).data` 直读）。
 */
export interface AutoSparkNotificationsState {
    /** 记录镜像：`shallow(items, options.shallow)`——默认 1：数组结构变更 + 成员一层字段
     * 读写有事件（孙级起 raw）；0：仅结构变更有事件。深度为构造期一次性配置（运行时改静默忽略）。
     * 元素 = AutoSparkNotificationRecord 纯业务数据（只管数据） */
    items: ShallowObject<AutoSparkNotificationRecord[], 1>;
    /** 生效全局配置真身（普通对象 → autostore 默认深层代理，孙级可写有事件） */
    options: AutoSparkNotificationsOptions;
}