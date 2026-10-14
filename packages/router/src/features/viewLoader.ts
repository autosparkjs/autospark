/**
 * Loader 特性 - 视图加载系统
 *
 * 提供本地组件和远程 HTML 的加载能力
 * 支持多种组件格式：HTML 元素名、动态导入函数、远程 URL
 *
 * @module features/viewLoader
 */

import type { AutoSparkRouter } from "@/router";
import type { AutoSparkMatchedRouteItem, AutoSparkRouteViewOptions } from "@/types/routes";
import { RouteDataLoaderBase, type AutoSparkRemoteLoadResult } from "./baseLoader";
import type { ViewRenderOptions } from "@/renderers/types";
import { AutoSparkRouterHTMLViewRenderer } from "@/renderers/html";
import type { AutoSparkRouterViewRendererBase, ViewRenderResult } from "@/renderers/base";

/**
 * ViewLoader 类 - 负责加载视图组件
 * 继承自 RouteDataLoaderBase 基类
 */
export class ViewLoader extends RouteDataLoaderBase<
    "view",
    AutoSparkRouteViewOptions<ViewRenderResult>,
    ViewRenderResult
> {
    renderers: AutoSparkRouterViewRendererBase[] = [];
    defaultRenderer: AutoSparkRouterHTMLViewRenderer;
    constructor(router: AutoSparkRouter) {
        super(
            router,
            "view",
            Object.assign({}, router.options.viewOptions) as Required<
                Omit<AutoSparkRouteViewOptions<ViewRenderResult>, "from">
            >,
        );
        this._initRenderers();
        this.renderers = router.options.renderers!;
        this.defaultRenderer = this.renderers.find(
            (renderer) => renderer instanceof AutoSparkRouterHTMLViewRenderer,
        )!;
    }

    private _initRenderers() {
        const index = this.router.renderers.findIndex(
            (renderer) => renderer && renderer instanceof AutoSparkRouterHTMLViewRenderer,
        );
        if (index === -1) {
            this.router.renderers.push(new AutoSparkRouterHTMLViewRenderer(this.router));
        }
    }

    /**
     *
     * 并发加载匹配路由的视图
     * @param routes - 匹配的路由数组
     * @param navSignal - 导航级别的中止信号
     * @param fromIndex - 公共层起点：已成功加载过的层跳过，只加载新增层（ADR-0004）
     */
    async loadViews(
        routes: AutoSparkMatchedRouteItem[],
        navSignal?: AbortSignal,
        fromIndex: number = 0,
    ) {
        return this.loadRoutes(routes, navSignal, fromIndex);
    }

    protected selectRenderer(response: Response, matched: AutoSparkMatchedRouteItem) {
        try {
            for (let renderer of this.router.renderers) {
                if (renderer.test(response, matched)) {
                    return renderer;
                }
            }
            return this.defaultRenderer;
        } catch {
            return this.defaultRenderer;
        }
    }

    protected async onResponse(
        response: Response,
        matched: AutoSparkMatchedRouteItem,
        options: ViewRenderOptions,
    ): Promise<AutoSparkRemoteLoadResult> {
        const renderer =
            matched.route?._viewOptions?.renderer || this.selectRenderer(response, matched)!;
        const renderResult = await renderer.render(response, matched, options);
        if (renderResult.error) {
            return { error: renderResult.error };
        } else {
            return {
                value: renderResult.value,
            };
        }
    }
}
