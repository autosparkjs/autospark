/**
 * 纯状态路径判定（engine 公开导出，scope.ts:34）：纯标识符路径走精准订阅通道的判据。
 * ——nsMember 具名包装
 */
import { nsMember } from "./namespace";

export function isSimpleStatePath(value: string): boolean {
    return nsMember<(value: string) => boolean>("isSimpleStatePath")(value);
}
