import type { OverlayDef } from "./types";
import type { OverlayInstance } from "./instance";

/**
 * 实例登记表（ADR-0052 决策 15）：按定义登记全部存活实例。
 *
 * 服务 `OverlayHandle.close()`（关该定义当前**全部**打开实例）；单例复用不走本表判定
 * （走 def.singletonInstance 槽位，决策 10/18）。WeakMap 持定义、Set 持实例——定义随 scope
 * 回收后登记自然失效；实例 destroy 时注销（acquire 时登记）。
 */
const registry = new WeakMap<OverlayDef, Set<OverlayInstance>>();

/** 登记实例（acquire 时调用；重复登记幂等） */
export function registerInstance(def: OverlayDef, inst: OverlayInstance): void {
    let set = registry.get(def);
    if (!set) {
        set = new Set();
        registry.set(def, set);
    }
    set.add(inst);
}

/** 注销实例（destroy 时调用） */
export function unregisterInstance(def: OverlayDef, inst: OverlayInstance): void {
    registry.get(def)?.delete(inst);
}

/** 该定义当前全部存活实例（无则空数组） */
export function getInstances(def: OverlayDef): OverlayInstance[] {
    return Array.from(registry.get(def) ?? []);
}
