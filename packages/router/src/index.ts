// 导入组件定义以注册自定义元素
import "./components";
import "./utils/params";

// 重新导出类型和API
export * from "./components";
export * from "./utils";
// ADR-0011：AutoSparkRouter 类不再运行时导出（仅类型）——挂载经插件自举（engine
// 构造 options 声明 routes / autoDiscoverRoutes）或注入构造（options.engine）
export type { AutoSparkRouter } from "./router";
export * from "./logger";
// 全部类型定义（AutoSparkRouterOptions / HeadConfigOptions / 路由与钩子类型…）
export * from "./types";

// engine 集成层（outlet 组件注册 / x-outlet 预处理，供高级用法与测试）
export {
    OUTLET_COMPONENT_NAME,
    OUTLET_COMPONENT_CODE,
    registerOutletComponent,
} from "./engine/outletComponent";
export { X_OUTLET_ATTR, OUTLET_COMPONENT_ATTR, transformXOutlet } from "./engine/xOutlet";
export type { RouterEngineBinding } from "./engine/engineHost";

// 渲染器（ADR-0008 及其修订：内置渲染器类 + 基类与类型，可显式实例化注册；
// `!` 前缀强制 raw；无自动格式判定——Json/Image 渲染器需注册到 options.renderers 生效）
export { AutoSparkRouterViewRendererBase } from "./renderers/base";
export type { ViewRenderResult } from "./renderers/base";
export { AutoSparkTemplateViewRenderer } from "./renderers/template";
export { AutoSparkRawViewRenderer } from "./renderers/raw";
export { AutoSparkJsonViewRenderer } from "./renderers/json";
export { AutoSparkImageViewRenderer, IMAGE_EXTENSIONS } from "./renderers/image";
export type { ViewRenderOptions } from "./renderers/types";

// 插件自举（ADR-0011）：模块加载即注册 precompile/ready 双回调——engine 构造 options
// 声明 routes / autoDiscoverRoutes 时自动挂载路由；双路径见 plugin/bootstrap.ts
import { bootstrapRouterPlugin } from "./plugin/bootstrap";
bootstrapRouterPlugin();
