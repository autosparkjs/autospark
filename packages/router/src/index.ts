// 导入组件定义以注册自定义元素
import "./components";
import "./utils/params";

// 重新导出类型和API
export * from "./components";
export * from "./utils";
export * from "./router";
export * from "./logger";

// engine 集成层（outlet 组件注册 / x-outlet 预处理，供高级用法与测试）
export {
    OUTLET_COMPONENT_NAME,
    OUTLET_COMPONENT_CODE,
    registerOutletComponent,
} from "./engine/outletComponent";
export { X_OUTLET_ATTR, OUTLET_COMPONENT_ATTR, transformXOutlet } from "./engine/xOutlet";
export type { RouterEngineBinding } from "./engine/engineHost";

// 导入 AutoSparkRouter 类以创建工厂函数
import { AutoSparkRouter } from "./router";
import type { AutoSparkRouterOptions as AutoSparkRouterOptionsType } from "./types";

/**
 * 创建路由器实例的工厂函数
 * @param host - 宿主元素
 * @param options - 路由配置选项
 * @returns AutoSparkRouter 实例
 */
export function createRouter(
    host: HTMLElement,
    options: AutoSparkRouterOptionsType | AutoSparkRouterOptionsType["routes"],
): AutoSparkRouter {
    const router = new AutoSparkRouter(host, options);
    return router;
}
