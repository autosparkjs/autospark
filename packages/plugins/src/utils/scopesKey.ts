/**
 * scope 注册表键（store.state[SCOPES_KEY][scope.id]）：按路径精准订阅 scope 数据的
 * 坐标前缀。点路径订阅同步 fire（per 写入触发）——契约广播类订阅（如 task 运行键的
 * update 事件「首个真实变更不吞」，ADR-0102）必须走此通道；scope.watch 经 scheduler
 * 微任务合并，连续写入只保留末值，不适用。——nsMember 具名包装
 */
import { nsMember } from "./namespace";

export function scopesKey(): string {
    return nsMember<string>("SCOPES_KEY");
}
