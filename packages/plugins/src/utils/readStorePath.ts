/**
 * 绝对路径直读 store state（指令值订阅「无 scope 回退分支」的 initial 通道）：
 * AutoStore 实例**无 `read` 方法**，`store.read?.(path)` 恒 undefined（可选链静默降级），
 * 会让表达式值的动态挂载——无 scope 宿主（运行时 `setAttribute` / 动态插入元素，
 * 不在编译期 scopeMap）——静默落入零值/恒关分支不渲染（ADR-0015 实施期发现）。
 *
 * 官方取值通道是 autostore 的 `getVal(state, path)`：经 engine IIFE 全量转导出挂运行时
 * 命名空间（ADR-0030/0111），与 engine 侧 `scope.watchPath` 同一取值实现；零静态依赖
 * 纪律下经 `nsMember` 运行时解析（缺位即 error，响而不哑）。
 *
 * 消费面：decorate.ts（x-ripple / x-spin）/ x-scrollbar / x-badge 的 bindValue 回退分支
 * （家族共病统一修复，2026-11-10）。
 */
import type { AutoSpark } from "autospark";
import { nsMember } from "./namespace";

export function readStorePath(engine: AutoSpark<any>, path: string): any {
    const getVal = nsMember<(state: any, path: string) => any>("getVal");
    return getVal(engine.store.state, path);
}
