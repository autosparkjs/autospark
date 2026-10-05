import type { AutoSparkMessageRecord, MessageProps, ResolvedMessageAction } from "./types";
import type { ComponentInstance } from "../component-instance";
import type { AutoSparkScope } from "../scope";
import type { PhaseAnim } from "../animate";

/**
 * 单条消息的运行时 entry（会话实例时代的背后态 → **ADR-0089 组件化**）——**组合分层**：
 * `record` = 持久化纯业务数据（`AutoSparkMessageRecord`，serialize/镜像/记录级写入的单一
 * 数据源，十二键封闭）；`instance` = **type 组件实例**（ComponentInstance——行为/渲染/
 * 运行态视图的宿主，add 即建、display 模型下与记录同生命周期）；本体其余字段 = 编排层
 * 运行数据（计时、监听、换装缓存——不入载荷）。
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
    /** 合并链后的生效配置（原地更新时整引用换新；level 恒归一为数字）——组件注水面源 */
    props: MessageProps;
    /** 预解析图标名 */
    icon: string;
    /** 预解析按钮表 */
    actions: ResolvedMessageAction[];
    /** 生命周期状态：queued → shown → closed（persist 0 移除 / ≥1 转隐藏；可见性 = display，ADR-0089 决策四） */
    state: "queued" | "shown" | "hidden" | "closed";
    /** type 组件实例（ADR-0089：add 即建——data/methods/props 视图宿主；未装配/已销毁为 null） */
    instance: ComponentInstance | null;
    /** shell 实例 scope（anchor 挂链或 rootless；type 组件 scope 经 instance.scope 可达） */
    scope: AutoSparkScope | null;
    /** 卡片根元素（恒挂容器——display:none = 挂起/排队/隐藏；remove 才摘除） */
    el: HTMLElement | null;
    /** 解析后的 anchor 元素（三职合一，决策 14） */
    anchor: HTMLElement | null;
    /** confirm 的 choice resolve（choice promise 归 manager；then 经 defineProperty 附到实例） */
    confirmResolve: ((value: any) => void) | null;
    /** 自动关闭计时器（sticky / holdOpen 期间恒 null） */
    timer: ReturnType<typeof setTimeout> | null;
    /** remaining 约定键联动 interval（1s 写 data.remaining——倒计时 UI 面；未计时常 null） */
    tickTimer: ReturnType<typeof setInterval> | null;
    /** 满额计时的到期时刻（hover 暂停换算剩余时间用） */
    deadline: number | null;
    /** hover 暂停时的剩余 ms（null = 未暂停） */
    pausedRemaining: number | null;
    /** 离场相配置（装配时解析缓存） */
    leave: PhaseAnim | null;
    /** 卡片根委托监听（teardown 解绑） */
    clickHandler: ((e: Event) => void) | null;
    enterHandler: (() => void) | null;
    leaveHandler: (() => void) | null;
    /** 已应用的附加类名（原地更新换装用） */
    appliedClassName: string;
    /** 已应用的内联样式（原地更新换装用，ADR-0077 styles） */
    appliedStyles: string;
}
