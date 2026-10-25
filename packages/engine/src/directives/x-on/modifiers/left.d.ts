import type { GuardModifierDesc } from "../types";
/**
 * `.left` 双义（按事件类型自动消歧，无需用户区分）：
 * - mouse 事件（mousedown/mouseup/click/contextmenu）→ 鼠标左键（e.button===0）
 * - key 事件（keydown/keyup/keypress）→ 方向键 ←（e.key==="ArrowLeft"）
 * - 其他事件类型不支持，返回 false
 */
declare const _default: GuardModifierDesc;
export default _default;
