import type { AutoSpark } from "../../engine/engine";
import { type ResolvedViewportBreakpoints } from "./types";
/**
 * 解析生效阈值表（ADR-0105 决策 4）：`options.viewport.breakpoints` → 内置缺省表。
 * 非法项 warn + 忽略（xs 入表 / 未知档名 / 非 px 阈值）；整表无有效项回退内置 + warn。
 * 纯函数（单测直击）。
 */
export declare function resolveViewportBreakpoints(raw: Record<string, number | string> | undefined, warn?: (msg: string) => void): ResolvedViewportBreakpoints;
/**
 * ViewportManager：全局视口档位监测（ADR-0105）。
 *
 * engine 构造期装配（对齐 TooltipManager / NotificationManager 惯例）；每 engine 一例、
 * 不取进程级单例（mql 为浏览器原生对象、每 engine 份开销可忽略，单例反引入共享可变
 * 状态与多配置冲突）。`options.viewport: false` 构造即短路（enabled false，全 no-op）。
 */
export declare class ViewportManager {
    private readonly engine;
    /** 当前档（null = 未定——首值必写，此后同档短路） */
    private _tier;
    private _mqls;
    private _enabled;
    constructor(engine: AutoSpark<any>);
    /** 是否已启用（`options.viewport: false` 或无 matchMedia 时 false） */
    get enabled(): boolean;
    /** engine.destroy()：反注册 mql + 摘根元素属性（`$.viewport` 残留——destroy 不清保留键） */
    dispose(): void;
    /**
     * 元容器注入（ADR-0105 决策 1，严格保留键语义）：state.$ 缺失 → 注入
     * `{ viewport }` 空容器（挂 META_MARK 框架所有物标记）；已有框架标记 → 复用；
     * 用户注入（无标记）→ warn + delete + 重建。
     *
     * 公开给 engine 构造期 `options.version` 注入复用同一入口（ADR-0119——`$.version`
     * 与 `$.viewport` 同住元容器，注入/复用/重建语义唯一）。
     */
    ensureMetaContainer(): Record<string, any>;
    /**
     * 启动监测：元容器注入 + 按档 mql 监听 + 首值同步（构造期写 `$.viewport` 初值与
     * 根元素 `data-viewport`，消灭首渲染空档）。无 matchMedia 环境 warn + 返回 false。
     */
    private _setup;
}
