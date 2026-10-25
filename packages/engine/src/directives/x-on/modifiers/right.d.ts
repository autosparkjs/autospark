import type { GuardModifierDesc } from "../types";
/**
 * `.right` 双义（按事件类型自动消歧）：
 * - mouse 事件 → 鼠标右键（e.button===2，常配 `.prevent` 阻止右键菜单，但 prevent 未内置）
 * - key 事件 → 方向键 →（e.key==="ArrowRight"）
 * - 其他事件类型不支持，返回 false
 */
declare const _default: GuardModifierDesc;
export default _default;
