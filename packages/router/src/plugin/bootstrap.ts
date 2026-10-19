/**
 * router 插件自举（ADR-0011）：router 以 AutoSpark 插件形态挂载，无独立入口。
 *
 * 模块加载期执行 {@link bootstrapRouterPlugin}，双路径注册（ADR-0114）：
 *
 * - `window.AutoSpark` 已存在（引擎脚本先加载）→ 直接经类静态
 *   `AutoSpark.precompile` / `AutoSpark.ready` 注册；
 * - 否则（IIFE 先于引擎加载 / ESM 无全局）→ 包成插件体推入
 *   `globalThis.__AUTOSPARK_PLUGINS__` 预加载队列，首个 engine 构造开头 drain 执行
 *   ——注册恰好赶在该 engine 的 precompile fire 之前，首编译不缺席。
 *
 * 两个回调协同完成挂载：
 *
 * - **precompile**（构造早期、template 克隆前）：对 engine.el 做 x-outlet 简写
 *   transform + 默认出口插入 + outlet 组件全局声明——entry 静态模板的 `x-outlet`
 *   简写由此生效（改写进模板、随克隆参与首编译）；
 * - **ready**（构造末尾、首编译后）：按挂载矩阵构造 AutoSparkRouter（engine 注入）。
 *
 * **挂载矩阵**（sniff `engine.options`，engine 零核心改动）：
 *
 * | engine options                                | 行为 |
 * |-----------------------------------------------|------|
 * | `routes: false`                               | 显式禁用，压过一切（含 autoDiscoverRoutes） |
 * | `routes` 有值（表 / 完整配置对象）            | 挂载该表；autoDiscoverRoutes 不触发 |
 * | 无 routes + `autoDiscoverRoutes: true`        | 挂载默认壳表 `[{path:"/"}]` + 整表发现（ADR-0010 根节点探测 `{base}/routes.json`） |
 * | 都没有                                        | 静默不挂载（纯 engine 应用零影响） |
 *
 * 时序限制：router 经 ESM import 但引擎已在其之前构造完时，预加载队列已 drain 冻结，
 * push 抛 TypeError（ADR-0114 设计如此——误用要响不要哑）；`AutoSpark.ready` 的
 * retain 语义会对已存活的 engine 补挂载，但其静态模板已编译，x-outlet 简写错过
 * precompile 不再生效（须写完整形态）。
 */

import type { AutoSpark, AutoSparkOptions, PluginBootstrap } from "autospark";
import { AutoSparkRouter } from "@/router";
import { ensureDefaultOutletElement } from "@/engine/engineHost";
import { transformXOutlet } from "@/engine/xOutlet";
import {
    OUTLET_COMPONENT_CODE,
    OUTLET_COMPONENT_NAME,
    OUTLET_COMPONENT_STYLES,
    OUTLET_STYLES_ID,
} from "@/engine/outletComponent";
import { injectStylesheet } from "@/utils/injectStylesheet";
import type { AutoSparkRouterOptions, AutoSparkRoutes } from "@/types";

/**
 * 挂载矩阵判定 + router 选项合成。
 *
 * @returns 传给 AutoSparkRouter 的选项；`null` = 不挂载（禁用 / 静默）
 */
function resolveMountOptions(engineOptions: AutoSparkOptions<any>): AutoSparkRouterOptions | null {
    const routes = engineOptions.routes;
    // 显式禁用压过一切（Q16）
    if (routes === false) return null;
    if (routes == null) {
        // 无显式表：autoDiscoverRoutes 触发整表发现——默认壳表的单根节点无 children
        // 声明，命中 ADR-0010 探测谓词，探测 {base}/routes.json 即整棵路由表
        if (engineOptions.autoDiscoverRoutes !== true) return null;
        return { routes: [{ path: "/" }], autoDiscoverRoutes: true };
    }
    // 显式表：声明完备，发现不触发（Q15）——含完整路由配置对象形态时剥掉
    // engine 级 autoDiscoverRoutes 透传（对象自身的键保留，原样采用）
    if (!Array.isArray(routes) && typeof routes === "object" && "routes" in routes) {
        const { autoDiscoverRoutes: _ignored, ...rest } = routes;
        return rest as AutoSparkRouterOptions;
    }
    return { routes: routes as AutoSparkRoutes };
}

/**
 * precompile 回调：首编译前对 engine.el 的出口预处理（仅挂载路径执行）。
 *
 * - 默认出口插入：宿主无任何出口声明时补 `<div x-outlet>`（随克隆参与首编译）；
 * - x-outlet 简写 transform：改写为 x-component:autospark.outlet 完整形态；
 * - outlet 组件全局声明（查询期委托表，编译期即命中）+ 内建样式注入（均幂等；
 *   应用经构造 options.components 预注册同名组件时实例层优先，定制不被覆盖）。
 */
function routerPrecompile(engine: AutoSpark<any>, autospark: typeof AutoSpark): void {
    if (resolveMountOptions(engine.options) === null) return;
    ensureDefaultOutletElement(engine.el);
    transformXOutlet(engine.el);
    injectStylesheet(OUTLET_COMPONENT_STYLES, { id: OUTLET_STYLES_ID });
    if (autospark.components[OUTLET_COMPONENT_NAME] == null) {
        autospark.components[OUTLET_COMPONENT_NAME] = OUTLET_COMPONENT_CODE;
    }
}

/**
 * ready 回调：按挂载矩阵构造 router（engine 注入，生命周期归应用）。
 * 构造内部 attach 异步链自行推进（出口检查 → 首导航），此处不持有实例——
 * router 经宿主 `host.router` 与文档级监听存活。
 */
function mountRouter(engine: AutoSpark<any>, _autospark: typeof AutoSpark): void {
    const routerOptions = resolveMountOptions(engine.options);
    if (routerOptions === null) return;
    new AutoSparkRouter(engine.el, {
        ...routerOptions,
        engine,
        // 语言清单声明在 engine（ADR-0013 决策 1）：engine 声明优先传递；完整路由
        // 配置对象形态自带 languages 时兜底采用
        languages: engine.options.languages ?? routerOptions.languages,
    });
}

/**
 * 双路径注册（模块加载期执行一次，见模块注释）。
 */
export function bootstrapRouterPlugin(): void {
    const register = (autospark: typeof AutoSpark) => {
        autospark.precompile(routerPrecompile);
        autospark.ready(mountRouter);
    };
    const existing = (globalThis as { AutoSpark?: typeof AutoSpark }).AutoSpark;
    if (typeof existing?.precompile === "function") {
        register(existing);
        return;
    }
    const queue = ((globalThis as { __AUTOSPARK_PLUGINS__?: PluginBootstrap[] })
        .__AUTOSPARK_PLUGINS__ ??= []);
    queue.push((_engine, autospark) => register(autospark));
}
