/** loading 遮罩合成（engine 公开 API，loading 合成协议 ADR-0126）——nsMember 具名包装 */
import { nsMember } from "./namespace";

export function createLoadingMask(el: HTMLElement): any {
    return nsMember<(el: HTMLElement) => any>("createLoadingMask")(el);
}
