/** 状态路径写值（autostore API，engine 全量转导出）——nsMember 具名包装 */
import { nsMember } from "./namespace";

export function setVal<T>(state: object, path: string, value: T): void {
    return nsMember<(state: object, path: string, value: T) => void>("setVal")(state, path, value);
}
