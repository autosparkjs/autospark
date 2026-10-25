import type { ModifierDesc } from "../types";
/**
 * 内置修饰符注册表：name → descriptor。
 *
 * OnDirective 据 modifiers 列表按名查表，按 type 分派（option 合并 / guard AND 链 / wrapper 包裹）。
 * 未知名静默跳过（便于未来扩展或用户自定义修饰符不报错）。
 */
export declare const MODIFIERS: Record<string, ModifierDesc>;
