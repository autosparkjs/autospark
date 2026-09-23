import type { OverlayInstance } from "./instance";

/**
 * 实例登记表（ADR-0052 决策 15）：按组件快照登记全部存活实例。
 *
 * 服务 `OverlayHandle.close()`（关该覆盖物当前**全部**打开实例）。WeakMap 持组件冻结快照根、
 * Set 持实例——快照随定义回收后登记自然失效；实例 destroy 时注销（创建时登记）。
 */
const registry = new WeakMap<HTMLElement, Set<OverlayInstance>>();

/** 登记实例（创建时调用；重复登记幂等） */
export function registerInstance(snapshot: HTMLElement, inst: OverlayInstance): void {
    let set = registry.get(snapshot);
    if (!set) {
        set = new Set();
        registry.set(snapshot, set);
    }
    set.add(inst);
}

/** 注销实例（destroy 时调用） */
export function unregisterInstance(snapshot: HTMLElement, inst: OverlayInstance): void {
    registry.get(snapshot)?.delete(inst);
}

/** 该覆盖物当前全部存活实例（无则空数组） */
export function getInstances(snapshot: HTMLElement): OverlayInstance[] {
    return Array.from(registry.get(snapshot) ?? []);
}
