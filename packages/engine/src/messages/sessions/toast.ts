import { MessageSessionBase } from "./base";
import type { AutoSparkMessageSession, MessageProps } from "../types";

/**
 * toast 专属 props（**type 分型**：公共键见 `MessageProps`；本 type 当前无专属键——
 * 空扩展为结构占位，后续 toast 专属键落此，与其他 type 分型对称）。
 */
export interface ToastMessageProps extends MessageProps {}

/**
 * toast 会话（type='toast'）：基类面即全部——瞬时提示无专属行为。
 * 行为与渲染模板同文件（ADR-0083 变体 A 聚合）。
 */
export class MessageToastSession extends MessageSessionBase implements AutoSparkMessageSession {
    /** 本 type 的预设渲染组件名（全局组件表查找；与 presetComponentName 约定等值） */
    static readonly component = "autospark.messages.toast";
}

/** toast 预设组件模板：纯继承 base（ADR-0088 起基承载默认内容——icon/title/desc/actions），
 *  零覆盖段。存在意义：用户同名覆盖 `autospark.messages.toast` 做全局定制（免 types 配置） */
export const TOAST_TEMPLATE = `<div x-define="autospark.messages.toast" x-define:inherit="autospark.messages.base"></div>`;

