/**
 * Loader 特性 - 视图加载系统
 *
 * 提供本地组件和远程 HTML 的加载能力
 * 支持多种组件格式：HTML 元素名、动态导入函数、远程 URL
 *
 * @module features/viewLoader
 */

import type { KylinRouter } from "@/router";
import type { KylinMatchedRouteItem, KylinRouteViewOptions } from "@/types/routes";
import { RouteDataLoaderBase, type KylinRemoteLoadResult } from "./baseLoader";
import type { ViewRenderOptions } from "@/renderers/types";
import { KylinRouterHTMLViewRenderer } from "@/renderers/html";
import type { KylinRouterViewRendererBase, ViewRenderResult } from "@/renderers/base";

/**
 * ViewLoader 类 - 负责加载视图组件
 * 继承自 RouteDataLoaderBase 基类
 */
export class ViewLoader extends RouteDataLoaderBase<
    "view",
    KylinRouteViewOptions<ViewRenderResult>,
    ViewRenderResult
> {
    renderers: KylinRouterViewRendererBase[] = [];
    defaultRenderer: KylinRouterHTMLViewRenderer;
    constructor(router: KylinRouter) {
        super(
            router,
            "view",
            Object.assign({}, router.options.viewOptions) as Required<
                Omit<KylinRouteViewOptions<ViewRenderResult>, "from">
            >,
        );
        this._initRenderers();
        this.renderers = router.options.renderers!;
        this.defaultRenderer = this.renderers.find(
            (renderer) => renderer instanceof KylinRouterHTMLViewRenderer,
        )!;
    }

    private _initRenderers() {
        const index = this.router.renderers.findIndex(
            (renderer) => renderer && renderer instanceof KylinRouterHTMLViewRenderer,
        );
        if (index === -1) {
            this.router.renderers.push(new KylinRouterHTMLViewRenderer(this.router));
        }
    }

    /**
     *
     * 并发加载匹配路由的视图
     * @param routes - 匹配的路由数组
     * @param navSignal - 导航级别的中止信号
     */
    async loadViews(routes: KylinMatchedRouteItem[], navSignal?: AbortSignal) {
        return this.loadRoutes(routes, navSignal);
    }

    protected selectRenderer(response: Response, matched: KylinMatchedRouteItem) {
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
        matched: KylinMatchedRouteItem,
        options: ViewRenderOptions,
    ): Promise<KylinRemoteLoadResult> {
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
