import type { OverlayInstance } from "./instance";
/** 登记实例（创建时调用；重复登记幂等） */
export declare function registerInstance(snapshot: HTMLElement, inst: OverlayInstance): void;
/** 注销实例（destroy 时调用） */
export declare function unregisterInstance(snapshot: HTMLElement, inst: OverlayInstance): void;
/** 该覆盖物当前全部存活实例（无则空数组） */
export declare function getInstances(snapshot: HTMLElement): OverlayInstance[];
