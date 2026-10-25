import type { BuiltinActionSpec } from "../features/action/types";
/**
 * 组装完整内置 action 表：注册键 → 展示标题（或 { title, handle } 自定义执行体）。
 */
export declare function buildBuiltinActions(): Record<string, BuiltinActionSpec>;
