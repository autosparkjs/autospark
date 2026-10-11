// 导入组件定义以注册自定义元素
import "./components";
import "./utils/params";

// 重新导出类型和API
export * from "./components";
export * from "./utils";
export * from "./router";
export * from "./logger";

// 导出路由器类型
export type { KylinRouterOptions as KylinRouterOptiopns } from "./types";

// 导入 KylinRouter 类以创建工厂函数
import { KylinRouter } from "./router";
import type { KylinRouterOptions as KylinRouterOptionsType } from "./types";

/**
 * 创建路由器实例的工厂函数
 * @param host - 宿主元素
 * @param options - 路由配置选项
 * @returns KylinRouter 实例
 */
export function createRouter(
    host: HTMLElement,
    options: KylinRouterOptionsType | KylinRouterOptionsType["routes"],
): KylinRouter {
    const router = new KylinRouter(host, options);
    return router;
}
