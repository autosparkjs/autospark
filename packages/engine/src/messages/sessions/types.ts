import type { AutoSparkMessageSession, MessageProps } from "../types";

/**
 * 会话域共享类型与哨兵资产（ADR-0083 拆目录：class 家族一文件一类，本文件承载非 class 资产）。
 */

/**
 * factory 函数类型（ADR-0083）：`add(async (session) => ...)` / `show` / 快捷方式的
 * 异步工厂——挂起会话注入 + return 初始展示配置（`undefined` / `void` → 静默不弹）。
 */
export type MessageSessionFactory = (session: AutoSparkMessageSession) => Promise<MessageProps | void | undefined>;

/** 全关 / 无效调用返回的死会话（共享单例：行为方法无效、closed 恒真——ADR-0077/0083） */
export const DEAD_SESSION: AutoSparkMessageSession = {
    id: "",
    type: "toast",
    el: null,
    show() {},
    hide() {},
    remove() {},
    update() {},
    cancel() {},
    get closed() {
        return true;
    },
    get read() {
        return false;
    },
    get status() {
        return undefined;
    },
    get result() {
        return undefined;
    },
};
