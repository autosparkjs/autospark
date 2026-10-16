/**
 * @autospark/router 对 engine 类型面的声明合并（ADR-0011）。
 *
 * router 以 AutoSpark 插件形态挂载（engine 构造 options 声明路由意图，ready 回调
 * sniff 后构造 AutoSparkRouter），路由键因此进入 engine 的 options 类型面：
 *
 * - `AutoSparkOptions.routes` / `AutoSparkOptions.autoDiscoverRoutes`：挂载矩阵的
 *   两个声明键（false 显式禁用 / 显式表 / 整表发现开关）；
 * - `AutoSparkMeta.route`：导航 commit 后 router 写入 `state.$.route` 的响应式
 *   路由快照（path/fullPath/params/query），模板与状态消费方借此类型化读取。
 *
 * 纯类型文件：无运行时代码，仅声明合并。经 `types/index.ts` 转导出进入编译图。
 */
import type { Dict } from "autospark";
import type { AutoSparkRoutes } from "./routes";
import type { AutoSparkRouterOptions } from "./config";

declare module "autospark" {
    interface AutoSparkOptions<State extends Dict = any> {
        /**
         * 路由挂载声明（ADR-0011 挂载矩阵，仅插件自举通道消费）：
         *
         * - `false`：**显式禁用**——压过一切（含 autoDiscoverRoutes），engine 不挂载路由；
         * - 数组 / 单项 / 字符串（远程表 URL）/ 函数：显式路由表，挂载该表（autoDiscoverRoutes
         *   不触发——显式表视为声明完备，发现机制仅服务零声明场景）；
         * - 完整路由配置对象（含 `routes` 键的 {@link AutoSparkRouterOptions} 形态）：挂载并
         *   采用其路由配置，同样忽略 autoDiscoverRoutes；
         * - 缺省：不声明路由——`autoDiscoverRoutes: true` 时挂载默认壳表 `[{path:"/"}]` +
         *   整表发现（ADR-0010 逐节点探测，根节点探测 `{base}/routes.json` 即整棵路由表），
         *   否则**静默不挂载**。
         */
        routes?:
            | false
            | AutoSparkRoutes
            | Omit<AutoSparkRouterOptions, "engine">;
        /**
         * 路由表自动发现开关（ADR-0010 / ADR-0011）：仅在**未声明 routes** 时作为整表
         * 发现的挂载触发器；声明了 routes（含 `false`）时本键被忽略。
         *
         * 默认 `false`——engine 侧路由挂载静默（纯 engine 应用不受任何影响）。
         */
        autoDiscoverRoutes?: boolean;
    }

    interface AutoSparkMeta {
        /**
         * 当前路由快照（ADR-0011）：导航 commit（渲染完成，含错误页）后由 router 写入，
         * 响应式更新——模板 `$.route.path` / 状态订阅皆可消费。无 engine 挂载路由时无此键。
         */
        route?: {
            /** 当前路径（location.pathname，含 base 前缀） */
            path: string;
            /** 完整路径（pathname + search） */
            fullPath: string;
            /** 路由匹配参数（各层 matched params 自浅到深合并） */
            params: Record<string, string>;
            /** 查询参数（search 解析为普通对象） */
            query: Record<string, string>;
        };
    }
}
