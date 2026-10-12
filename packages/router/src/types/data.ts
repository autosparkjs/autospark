/**
 * 预加载的数据类型
 * 由 renderEach 钩子填充，组件可以通过 route.data 访问这些数据
 *
 * @remarks
 * 这是一个灵活的数据类型，允许存储任意结构的数据。
 * 建议在具体应用中定义更精确的数据类型以获得更好的类型安全性。
 *
 * @param string - 简单的url数据,从远程加载数据
 * @param Record<string, any> - 任意键值对数据
 * @param () => Record<string, any> | Promise<Record<string, any>> - 支持同步或异步函数返回数据
 */

import type { AutoSparkMatchedRouteItem } from "./routes";
import type { BaseLoaderOptions } from "@/features/baseLoader";

export type AutoSparkRouteDataSource =
    | string
    | Record<string, any>
    | ((route: AutoSparkMatchedRouteItem) => Record<string, any> | Promise<Record<string, any>>);

export interface AutoSparkRouteDataOptions extends BaseLoaderOptions<AutoSparkRouteDataSource> {
    /**
     * 当加载失败时提供一些默认值
     * 加载成功后可以使用Object.assign(default,data)合并，以避免加载数据的缺失
     */
    default?: Record<string, any>;
    /**
     * 失败后的最大重试次数，默认 0（不重试）
     *
     * 如 retry=2 表示最多重试 2 次（总共最多 3 次尝试）。
     * 主动 abort（abort() 或外部 abortSignal 触发）不会重试；
     * 超时与业务错误会重试。
     */
    retry?: number;
    /**
     * 每次重试前的等待毫秒数，默认 0（立即重试）
     */
    retryDelay?: number;
    /**
     * 复用加载（基于 hash 的实例复用）
     *
     * - "off"：不启用，各实例相互独立
     * - "restart"：命中同 hash 且正在进行中的加载时，中止该加载并以首个实例重新加载
     * - "share"：命中同 hash 实例时完全共享，不中止
     *
     * 注意：AsyncLoader 的 multiplex 默认值是 "restart"（自动重启）
     */
    multiplex?: "off" | "restart" | "share";
}
