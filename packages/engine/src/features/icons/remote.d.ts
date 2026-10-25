import type { AutoSpark } from "../../engine/engine";
import type { IconifyJSON } from "./iconify";
/**
 * 默认远程 url（ADR-0058：Iconify 公共 API 的 material-symbols-light 图标集，可经 options.url 覆盖）。
 * 清单占位符用 `{modify-icons}`——未声明 modify 时退化为原名清单（行为同 `{icons}`），声明后
 * 自动取后缀变体（`delete-rounded` 等），modify 与默认 url 开箱即用。
 */
export declare const DEFAULT_REMOTE_URL = "https://api.iconify.design/material-symbols-light.json?icons={modify-icons}";
/** modify 值域（越界 warn + 按未声明处理，ADR-0058 决策 8） */
export declare const MODIFY_VALUES: readonly ["rounded", "sharp", "outline", "outline-rounded", "outline-sharp"];
export type IconModify = (typeof MODIFY_VALUES)[number];
/**
 * url 插值（ADR-0058 决策 8）：`{icons}` 原名清单**原始直书零编码**（Iconify API 直收逗号）、
 * `{modify}` 未声明 → 空串、`{modify-icons}` 未声明 → 退化为 `{icons}`、未知占位符保留
 * 原样 + warn 一次。
 */
export declare function interpolateUrl(tpl: string, icons: string[], modify?: string): string;
/**
 * fetch 图标集 JSON（ADR-0121 收编）：经 AsyncLoader 统一内核执行。
 * `multiplex:"share"` 合并同 url 并发请求（替代旧 jsonCache in-flight Map）；
 * `storage` 适配 localStorage（替代旧手动 TTL 层）；`cache` 映射 TTL（毫秒）。
 * 失败不落缓存（AsyncLoader 天然语义），非 200 / 非 JSON / 非 IconifyJSON 结构按失败 reject。
 */
export declare function fetchIconifySet(url: string, ttl?: number, engine?: AutoSpark): Promise<IconifyJSON>;
/** 测试专用：清空 multiplex 实例缓存表（模拟页面重载/跨会话内存清空）。localStorage 持久层由用例自理。 */
export declare function resetIconCacheForTest(): void;
