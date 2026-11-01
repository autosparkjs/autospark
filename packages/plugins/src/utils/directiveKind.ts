/** 指令执行通道枚举（engine 公开导出 DirectiveKind）——nsMember 具名包装 */
import { nsMember } from "./namespace";

export function directiveKind(): Record<string, number> {
    return nsMember<Record<string, number>>("DirectiveKind");
}
