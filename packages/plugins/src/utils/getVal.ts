/** 状态路径取值（autostore API，engine 全量转导出）——nsMember 具名包装 */
import { nsMember } from "./namespace";

export function getVal<T = unknown>(state: object, path: string): T {
    return nsMember<(state: object, path: string) => T>("getVal")(state, path);
}
