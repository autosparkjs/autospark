/**
 * 统一导出所有类型定义
 *
 * 这个文件重新导出所有类型，提供统一的访问入口
 * 同时保持向后兼容性，支持从 'src/types' 导入所有类型
 */

// 路由配置相关类型
export * from "./routes";

// 钩子系统相关类型
export * from "./hooks";

// 路由器配置相关类型
export * from "./config";
export * from "./events";

// 模态路由相关类型
export * from "./modals";

// 渲染系统相关类型（从 routes.ts 导出）
export type {
    KylinRenderMode as RenderMode,
    TemplateData,
    KylinRouteViewContext as RenderContext,
    KylinRenderOptions as RenderOptions,
} from "./routes";

export * from "./utils";
