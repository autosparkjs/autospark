import { deepMerge } from "flex-tools/object/deepMerge";
import type { ComponentDef } from "../directives/component-def";
import type { AutoSpark } from "../engine";
import type { AutoSparkScope } from "../scope";
import {
    OVERLAY_DEFAULTS,
    resolveDataContext,
    type OverlayConfig,
} from "./types";
import { OverlayInstance } from "./instance";
import { registerInstance, getInstances } from "./registry";

/**
 * 覆盖物定义句柄（ADR-0052 决策 15）：覆盖物的**编程视图**，命令式消费入口。
 *
 * `engine.getOverlay(el, name, options?)` 工厂产出（镜像 `getComponent` 查找协议——修订共识 10）。
 * `open()` 返回实例句柄（多实例并存时唯一能精确关闭单个实例的通道）；`close()` 关该覆盖物
 * 当前**全部**打开实例。
 */
export class OverlayHandle {
    readonly engine: AutoSpark<any>;
    /** 覆盖物名（消费 attr 名 / 组件名） */
    readonly name: string;
    /** 组件冻结快照根（实例化模板来源；registry 登记键） */
    readonly snapshot: HTMLElement;
    /** 组件定义（可 null：纯快照组件无 setup） */
    readonly def: ComponentDef | null;
    /** getOverlay 传入的消费者配置级（命令式合并链第二层，等价声明式 x-dialog-options；props 键已剥离） */
    private _options: Record<string, any>;
    /** getOverlay options 的 `props` 键（句柄级默认 props，ADR-0052 v2.3——被 open({props}) 覆盖） */
    private _defaultProps: Record<string, any> | undefined;
    /** 查找锚点 el 所属 scope（`'host'` 基准的挂链目标；getOverlay 无 el 时为 null） */
    private readonly _anchorScope: AutoSparkScope | null;

    constructor(
        engine: AutoSpark<any>,
        name: string,
        snapshot: HTMLElement,
        def: ComponentDef | null,
        options: Record<string, any> | null,
        anchorScope: AutoSparkScope | null = null,
    ) {
        this.engine = engine;
        this.name = name;
        this.snapshot = snapshot;
        this.def = def;
        const { props, ...rest } = options ?? {};
        this._defaultProps = props;
        this._options = rest;
        this._anchorScope = anchorScope;
    }

    /**
     * 打开（ADR-0052 v2.3：props 显式键化——`open({props: {...}, ...配置键})`）：
     *
     * - `props`：显式 props 键，注入组件 data 域（**打开时快照**——JS 对象无表达式载体，
     *   无声明式的持续热更新；覆盖句柄级默认 props）；
     * - `dataContext`（**两栖数据视图基准**，ADR-0053 修订更名自 `scope`）：元素（基准载体）→
     *   `findScopeByEl` 挂链 + 兼作 searchRoot；`'host'`/`'declarer'`（基准名）→ `resolveDataContext`
     *   解析（host 挂 getOverlay 锚点 scope）；缺省 → rootless 全局视图（决策 16 命令式缺省）；
     * - 其余键进配置合并链顶层（`closeOnMask`/`animate`/`at` 等已知配置键；`at` 支持字符串/元素
     *   简写，进链前归一化）。**未知键零防御**（v2.3）：旧隐式 props 写法（`open({userId: 42})`）
     *   与 `visible` 键静默沦入 `OverlayConfig` 自由键，不告警——删干净不设防，排错靠自觉。
     */
    open(opts?: Record<string, any>): OverlayInstance {
        let configLayer: Record<string, any> | undefined;
        let props: Record<string, any> | undefined = this._defaultProps;
        if (opts && typeof opts === "object") {
            const { props: openProps, ...rest } = opts;
            if (openProps !== undefined) props = openProps;
            configLayer = rest;
        }
        const resolved = resolveOverlayConfig(this._options, configLayer);
        // 数据视图基准（两栖）：缺省 = rootless（决策 16 命令式缺省）；其余统一经 resolveDataContext 分派
        const { parentScope, scopeEl } =
            resolved.dataContext === undefined
                ? { parentScope: null, scopeEl: null }
                : resolveDataContext(
                      resolved.dataContext,
                      this.def,
                      this._anchorScope,
                      this.engine,
                      (m) => this.engine.logger.warn(`engine.getOverlay("${this.name}"): ${m}`),
                  );
        const inst = new OverlayInstance(this.engine, this.name, this.snapshot, this.def, resolved, {
            parentScope,
            searchRoot: scopeEl,
            scopeEl,
            // 命令式消费与 x-dialog 同为模态形态（遮罩外壳 + closeOnMask + 居中默认）
            mask: true,
        });
        registerInstance(this.snapshot, inst);
        inst.open(props);
        return inst;
    }

    /** 关闭该覆盖物当前全部打开实例（逐个走「请求关闭」，决策 15） */
    close(): void {
        for (const inst of getInstances(this.snapshot)) {
            inst.requestClose("api");
        }
    }
}

/**
 * 组装覆盖物生效配置（ADR-0052 v2.3 两级链）：深度合并（相邻层 deepMerge：数组替换、
 * undefined 不覆盖、函数整体覆盖）——声明式 `内置默认 < x-dialog-options`（一层）；命令式
 * `内置默认 < getOverlay options < open options`（两层，props 键由调用方在传入前剥离）。
 */
export function resolveOverlayConfig(
    ...layers: Array<Record<string, any> | null | undefined>
): OverlayConfig {
    let merged: Record<string, any> = { ...OVERLAY_DEFAULTS };
    for (const layer of layers) {
        if (layer && typeof layer === "object") {
            // at 简写（字符串/元素）进链前归一化为 { selector }——deepMerge 才能局部覆盖：
            // 换锚只覆盖 selector、保留上层 placement/flip/arrow 等其余锚成员
            let normalized: Record<string, any> = layer;
            const at = layer.at;
            if (at != null && (typeof at === "string" || at instanceof HTMLElement)) {
                normalized = { ...layer, at: { selector: at } };
            }
            merged = deepMerge(merged, normalized, {}) as Record<string, any>;
        }
    }
    return merged as OverlayConfig;
}
