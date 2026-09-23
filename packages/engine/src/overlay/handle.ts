import { deepMerge } from "flex-tools/object/deepMerge";
import type { ComponentDef } from "../directives/component-def";
import type { AutoSpark } from "../engine";
import { OVERLAY_DEFAULTS, type OverlayConfig, splitReservedKeys } from "./types";
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
    /** getOverlay 传入的消费者配置级（命令式合并链第二层，等价声明式 x-dialog-options） */
    private _options: Record<string, any>;

    constructor(
        engine: AutoSpark<any>,
        name: string,
        snapshot: HTMLElement,
        def: ComponentDef | null,
        options: Record<string, any> | null,
    ) {
        this.engine = engine;
        this.name = name;
        this.snapshot = snapshot;
        this.def = def;
        this._options = options ?? {};
    }

    /**
     * 打开：options 的 `scope`（**元素**，数据视图基准，缺省 → rootless 全局视图，ADR-0052 决策 16）
     * 与 `visible`（命令式无意义，warn 忽略）为特殊键；`closeOnMask`/`animate`/`at` 保留配置键
     * 进合并链顶层（`at` 支持字符串/元素简写，进链前归一化）；**其余键全部作 props**
     * 注入组件 data 域（修订共识 7，`params` 键已删除）。
     */
    open(opts?: Record<string, any>): OverlayInstance {
        let openOpts: Record<string, any> | undefined;
        if (opts && typeof opts === "object") {
            if (opts.visible !== undefined) {
                this.engine.logger.warn(
                    `engine.getOverlay("${this.name}"): "visible" 键在命令式打开中无意义，已忽略（ADR-0052 决策 17）`,
                );
            }
            openOpts = opts;
        }
        const { config: inlineConfig, props } = splitReservedKeys(openOpts);
        const resolved = resolveOverlayConfig(this.def, this._options, inlineConfig);
        const scopeEl =
            opts?.scope instanceof HTMLElement ? (opts.scope as HTMLElement) : null;
        const inst = new OverlayInstance(this.engine, this.name, this.snapshot, this.def, resolved, {
            parentScope: scopeEl ? this.engine.findScopeByEl(scopeEl) ?? null : null,
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
 * 组装覆盖物生效配置（ADR-0052 修订共识 6）：三级深度合并（相邻层 deepMerge：数组替换、
 * undefined 不覆盖、函数整体覆盖）——`内置默认 < x-dialog-options < 值对象内联保留配置键`；
 * 命令式少值对象一级。visible/scope(元素) 是消费者特殊键、props 由 `splitReservedKeys` 剥离，
 * 调用方在传入前分流。
 */
export function resolveOverlayConfig(
    _def: ComponentDef | null,
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
