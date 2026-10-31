/** 浅响应包装（autostore API，engine 全量转导出）：depth 0/1 控制浅层深度——nsMember 具名包装 */
import { nsMember } from "./namespace";

export function shallow<T>(value: T, depth: 0 | 1): T {
    return nsMember<(value: any, depth: 0 | 1) => T>("shallow")(value, depth);
}
