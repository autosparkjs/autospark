/**
 * resource 插件对 engine 类型面的声明合并（ADR-0011；对称 notifications augment 先例）。
 *
 * - `AutoSparkOptions.resources`：engine 级配置层（baseUrl/fetch/headers/unwrap/mapping
 *   五项——**不含资源定义**：全局资源唯一动态入口是 `AutoSpark.resources.add`，共识修订
 *   已移除 globals 键）；
 * - `AutoSpark` 实例属性 `resources`：ready 自举挂载的 engine 级管理器视图。
 *
 * 类静态 `AutoSpark.resources`（全局单例）无法经 interface 声明合并覆盖（TS 对导出类
 * 静态成员无 augmentation 接缝）——运行时由 bootstrap 挂载，类型消费方经插件导出的
 * `AutoSparkResourceManager` 类型断言使用。
 *
 * 纯类型文件：无运行时代码。经插件入口 index.ts 副作用导入进入编译图。
 */
import type { AutoSparkResourceManager } from "../manager";
import type { ResourcesOptions } from "../types";

declare module "autospark" {
    interface AutoSparkOptions<State extends Record<string, any> = Record<string, any>> {
        /**
         * 资源配置层（ADR-0011，仅装载 resource 插件后生效）：
         *
         * - `baseUrl`：资源 url 前缀；
         * - `fetch`：自定义 fetch（测试 mock / 拦截器）；
         * - `headers`：默认请求头（逐请求合并）；
         * - `unwrap`：响应解包钩子（默认恒等，适配包裹壳）；
         * - `mapping`：按方法覆盖默认 REST 映射表（浅合并，无整表替换）。
         *
         * 三层回退：资源定义内联 > 本表 > `AutoSpark.resources.options` 全局默认。
         */
        resources?: ResourcesOptions;
    }

    interface AutoSpark<State extends Record<string, any> = Record<string, any>> {
        /**
         * engine 级资源管理器视图（插件 ready 自举挂载）：`add()` 注册 engine 生命周期
         * 私有资源；`options` 即 `options.resources` 编程面。未装插件时无此属性
         * （访问即"该装插件了"的引导）。跨 engine 全局资源经类静态
         * `AutoSpark.resources.add`（运行时挂载）。
         */
        readonly resources: AutoSparkResourceManager;
    }
}
