import type { AutoSparkMessageRecord, MessageProps } from "./types";
import type { MessageSessionBase } from "./sessions";

/**
 * 单条消息的运行时 entry（会话实例的背后态）——**组合分层**（架构宣言）：
 * `record` = 持久化纯业务数据（`MessageRecord`，serialize/镜像/记录级写入的单一数据源）；
 * 本体其余字段 = 渲染 / 行为 / 生命周期运行时数据（不入载荷，恢复走生效默认）。
 */
export interface MessageEntry {
    id: string;
    type: string;
    /**
     * 持久化记录（纯业务数据面）：id/type/read/title/description/level/owner/status/
     * result/link + createAt/updateAt——十二键封闭，serialize 直接取此物；记录级写入
     * （update 补丁业务键 / 置已读 / result 写入）落这里并 touch 刷新 updateAt。
     */
    record: AutoSparkMessageRecord;
    /** 合并链后的生效配置（原地更新时整引用换新；level 恒归一为数字）——渲染与行为配置源 */
    props: MessageProps;
    /** 预解析图标名 */
    icon: string;
    /** 预解析按钮表 */
    actions: import("./types").ResolvedMessageAction[];
    /** 生命周期状态：queued → shown → closed（persist 0 移除 / ≥1 转隐藏） */
    state: "queued" | "shown" | "hidden" | "closed";
    /** shell 实例 scope（anchor 挂链或 rootless；teardown 统一收口） */
    scope: import("../scope").AutoSparkScope | null;
    /** type 模板实例 scope（双层组合 ADR-0077；无 renderer 为 null；teardown 统一收口） */
    rendererScope: import("../scope").AutoSparkScope | null;
    /** 卡片根元素（排队未挂 / 已摘除为 null） */
    el: HTMLElement | null;
    /** 解析后的 anchor 元素（三职合一，决策 14） */
    anchor: HTMLElement | null;
    session: MessageSessionBase;
    /** confirm 的 Promise resolve（choice 点击时调用后置空） */
    confirmResolve: ((value: any) => void) | null;
    /** 自动关闭计时器（sticky / task 进行中恒 null） */
    timer: ReturnType<typeof setTimeout> | null;
    /** 满额计时的到期时刻（hover 暂停换算剩余时间用） */
    deadline: number | null;
    /** hover 暂停时的剩余 ms（null = 未暂停） */
    pausedRemaining: number | null;
    /** 离场相配置（mount 时解析缓存） */
    leave: import("../animate").PhaseAnim | null;
    /** 卡片根委托监听（teardown 解绑） */
    clickHandler: ((e: Event) => void) | null;
    enterHandler: (() => void) | null;
    leaveHandler: (() => void) | null;
    /** 已应用的附加类名（原地更新换装用） */
    appliedClassName: string;
    /** 已应用的内联样式（原地更新换装用，ADR-0077 styles） */
    appliedStyles: string;
}
