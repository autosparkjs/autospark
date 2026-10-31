/** 免代理标记（autostore API，engine 全量转导出）：落响应式域的对象须绕过代理语义时使用——nsMember 具名包装 */
import { nsMember } from "./namespace";

export function markRaw<T>(value: T): T {
    return nsMember<(value: any) => T>("markRaw")(value);
}
