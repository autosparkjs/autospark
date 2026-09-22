import { deepMerge } from "flex-tools/object/deepMerge";
import type { AutoSpark } from "../engine";
import type { AutoSparkScope } from "../scope";
import { OVERLAY_DEFAULTS, type OverlayConfig, type OverlayDef } from "./types";
import { OverlayInstance } from "./instance";
import { registerInstance, getInstances } from "./registry";

/**
 * 覆盖层定义句柄（ADR-0052 决策 15）：定义的**编程视图**，命令式消费入口。
 *
 * `engine.getOverlay(name, options?)` 工厂产出。仅 `.global` 声明的定义命令式可达
 * （「命令式 = 全局消费」）；`open()` 返回实例句柄（非单例多实例并存时唯一能精确关闭
 * 单个实例的通道）；`close()` 关该定义当前**全部**打开实例。
 */
export class OverlayHandle {
    readonly engine: AutoSpark<any>;
    readonly def: OverlayDef;
    readonly name: string;
    /** getOverlay 传入的消费者配置级（命令式合并链第三层，等价声明式 x-dialog-options） */
    private _options: Record<string, any>;

    constructor(engine: AutoSpark<any>, def: OverlayDef, options: Record<string, any> | null) {
        this.engine = engine;
        this.def = def;
        this.name = def.name;
        this._options = options ?? {};
    }

    /**
     * 打开（单例幂等，决策 18）：options 的 `scope`（元素，数据视图基准，缺省 → 全局根视图）与
     * `params` 为保留键，其余键并入配置合并链最顶层；`visible` 键在命令式无意义——出现时 warn 忽略。
     */
    open(opts?: Record<string, any>): OverlayInstance {
        let openOpts: Record<string, any> | undefined;
        if (opts && typeof opts === "object") {
            if (opts.visible !== undefined) {
                this.engine.logger.warn(
                    `engine.getOverlay("${this.name}"): "visible" 键在命令式打开中无意义，已忽略（ADR-0052 决策 17）`,
                );
            }
            const { scope: _scope, params: _params, visible: _visible, ...rest } = opts;
            openOpts = rest;
        }
        const config = resolveOverlayConfig(this.def, this._options, openOpts);
        const scopeEl =
            opts?.scope instanceof HTMLElement ? (opts.scope as HTMLElement) : null;
        const inst = acquireInstance(this.engine, this.def, config, {
            parentScope: scopeEl ? this.engine.findScopeByEl(scopeEl) ?? null : null,
            searchRoot: scopeEl,
            scopeEl,
        });
        inst.open(opts?.params && typeof opts.params === "object" ? opts.params : undefined);
        return inst;
    }

    /** 关闭该定义当前全部打开实例（逐个走「请求关闭」，决策 15） */
    close(): void {
        for (const inst of getInstances(this.def)) {
            inst.requestClose("api");
        }
    }
}


/**
 * 组装覆盖层生效配置（ADR-0052 决策 4/17）：四级深度合并（相邻层 deepMerge：数组替换、
 * undefined 不覆盖、函数整体覆盖）。声明式：内置默认 < x-overlay-options < x-dialog-options <
 * 值对象内联；命令式少一级 x-dialog-options。visible/params 是消费者值对象保留键、非配置，
 * 由调用方在传入前剥离。
 */
export function resolveOverlayConfig(
    def: OverlayDef,
    ...layers: Array<Record<string, any> | null | undefined>
): OverlayConfig {
    let merged: Record<string, any> = { ...OVERLAY_DEFAULTS };
    for (const layer of [def.options, ...layers]) {
        if (layer && typeof layer === "object") {
            merged = deepMerge(merged, layer, {}) as Record<string, any>;
        }
    }
    return merged as OverlayConfig;
}

/**
 * 获取（或复用）实例（决策 10/18）：singleton 且单例槽存活 → 复用（替换为最新合并配置——
 * 换锚即换位置）；否则新建（singleton 时占槽 + 登记）。
 */
export function acquireInstance(
    engine: AutoSpark<any>,
    def: OverlayDef,
    config: OverlayConfig,
    opts: { parentScope?: AutoSparkScope | null; searchRoot?: HTMLElement | null; scopeEl?: HTMLElement | null },
): OverlayInstance {
    if (config.singleton) {
        const existing = def.singletonInstance;
        if (existing && !existing.destroyed) {
            existing.config = config;
            return existing;
        }
    }
    const inst = new OverlayInstance(engine, def, config, opts);
    if (config.singleton) def.singletonInstance = inst;
    registerInstance(def, inst);
    return inst;
}
