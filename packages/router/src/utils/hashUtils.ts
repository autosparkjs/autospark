/**
 * Hash 模式工具函数
 *
 * 提供 Hash 路由模式的支持：
 * - normalizeHashPath: 规范化 Hash 路径格式
 * - createHashHistoryFromLib: 创建 HashHistory 实例
 *
 * 按照 CONTEXT.md 决策 D-29 到 D-32 实现 Hash 模式
 */

import { createHashHistory } from "history";

/**
 * 规范化 Hash 路径
 *
 * 统一处理 #/path 和 #path 两种格式，规范化为 /path 格式
 * 移除重复的斜杠
 *
 * 按照 D-29: Hash 路径规范化
 *
 * @param hash - Hash 值，如 "#/user" 或 "#user"
 * @returns 规范化后的路径，如 "/user"
 */
export function normalizeHashPath(hash: string): string {
    // 移除 # 前缀
    let path = hash.replace(/^#\/?/, "");

    // 确保以 / 开头
    if (!path.startsWith("/")) {
        path = "/" + path;
    }

    // 移除重复的斜杠
    path = path.replace(/\/+/g, "/");

    // 移除末尾斜杠（除非是根路径）
    if (path.length > 1) {
        path = path.replace(/\/+$/, "");
    }

    return path;
}

/**
 * 创建 HashHistory 实例
 *
 * 使用 history 库的 createHashHistory 创建 Hash 模式的历史管理器
 * 支持基础路径（base）配置
 *
 * @param base - 基础路径，默认为 ""
 * @returns HashHistory 实例
 */
export function createHashHistoryFromLib() {
    return createHashHistory();
}
