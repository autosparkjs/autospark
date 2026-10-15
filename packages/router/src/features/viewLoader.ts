/**
 * Loader 特性 - 视图加载系统
 *
 * 提供本地组件和远程 HTML 的加载能力
 * 支持多种组件格式：HTML 元素名、动态导入函数、远程 URL
 *
 * 渲染器选择链（ADR-0008 及其修订，fetch 后的 onResponse 内，优先级从高到低）：
 * 0. URL `!` 前缀——强制 raw 渲染，最高优先级（前缀与业务 query 无冲突，fetch 前剥除）
 * 1. 路由级显式 `view.renderer`
 * 2. `options.renderers` 自定义渲染器逐个 test()（注册顺序即探测顺序）
 * 3. 模板渲染器兜底（test 恒真）
 *
 * 无自动格式判定、无全局渲染器钩子。Json / Image 渲染器类保留导出，
 * 由用户显式注册到 options.renderers 后按 test() 探测生效。
 *
 * 渲染降级链（ADR-0008）：选中渲染器加工失败（抛异常或返回 error）→ 先试模板渲染器
 * → 再失败落 raw 通道原样输出；全链失败才落错误页。fetch 失败不降级。
 *
 * @module features/viewLoader
 */

import type { AutoSparkRouter } from "@/router";
import type { AutoSparkMatchedRouteItem, AutoSparkRouteViewOptions } from "@/types/routes";
import { RouteDataLoaderBase, type AutoSparkRemoteLoadResult } from "./baseLoader";
import type { ViewRenderOptions } from "@/renderers/types";
import type { AutoSparkRouterViewRendererBase, ViewRenderResult } from "@/renderers/base";
import { AutoSparkTemplateViewRenderer } from "@/renderers/template";
import { AutoSparkRawViewRenderer } from "@/renderers/raw";
import { getDeclaredViewUrl, hasRawPrefix, stripRawPrefix } from "@/utils/rawPrefix";

/**
 * ViewLoader 类 - 负责加载视图组件
 * 继承自 RouteDataLoaderBase 基类
 */
export class ViewLoader extends RouteDataLoaderBase<
    "view",
    AutoSparkRouteViewOptions<ViewRenderResult>,
    ViewRenderResult
> {
    /** 自定义渲染器（options.renderers，位于模板兜底之前） */
    renderers: AutoSparkRouterViewRendererBase[] = [];
    /** 模板渲染器：选择链的兜底 + 渲染降级链的中间站 */
    defaultRenderer: AutoSparkTemplateViewRenderer;
    /** raw 渲染器：`!` 前缀强制选中 + 渲染降级链的末站 */
    private _rawRenderer: AutoSparkRawViewRenderer;

    constructor(router: AutoSparkRouter) {
        super(
            router,
            "view",
            Object.assign({}, router.options.viewOptions) as Required<
                Omit<AutoSparkRouteViewOptions<ViewRenderResult>, "from">
            >,
        );
        this.renderers = router.options.renderers || [];
        this.defaultRenderer = new AutoSparkTemplateViewRenderer(router);
        this._rawRenderer = new AutoSparkRawViewRenderer(router);
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

    /**
     * fetch URL 预处理：剥除 `!` raw 前缀（ADR-0008 修订）
     *
     * 前缀是给 router 的指令，不应发给服务器；须在插值与 base 前缀之前剥除，
     * 避免 `!` 被当作路径字符参与 base 拼接。检测基于路由声明的视图源，不受影响。
     */
    protected override prepareFetchUrl(url: string, _matched: AutoSparkMatchedRouteItem): string {
        return stripRawPrefix(url);
    }

    /**
     * 渲染器选择链（ADR-0008 修订）：
     * `!` 前缀强制 raw（最高） > 路由级显式 renderer > 自定义渲染器 test() > 模板兜底
     */
    protected selectRenderer(
        response: Response,
        matched: AutoSparkMatchedRouteItem,
        _options: ViewRenderOptions,
    ): AutoSparkRouterViewRendererBase {
        // 0. `!` 前缀强制 raw（最高优先级：前缀语义独立于业务 query，见 ADR-0008 修订）
        if (hasRawPrefix(getDeclaredViewUrl(matched) ?? "")) {
            return this._rawRenderer;
        }
        // 1. 路由级显式渲染器
        const explicit = matched.route?._viewOptions?.renderer;
        if (explicit) return explicit;
        // 2. 自定义渲染器（注册顺序即探测顺序）
        for (const renderer of this.renderers) {
            try {
                if (renderer && renderer.test(response, matched)) return renderer;
            } catch {
                // 探测异常视为不匹配，继续下一个
            }
        }
        // 3. 模板渲染器兜底（test 恒真）
        return this.defaultRenderer;
    }

    protected async onResponse(
        response: Response,
        matched: AutoSparkMatchedRouteItem,
        options: ViewRenderOptions,
    ): Promise<AutoSparkRemoteLoadResult> {
        const selected = this.selectRenderer(response, matched, options);
        // 渲染降级链（ADR-0008）：选中 → 模板 → raw；去重，每个至多一次
        const chain: AutoSparkRouterViewRendererBase[] = [selected];
        if (!(selected instanceof AutoSparkTemplateViewRenderer)) {
            chain.push(this.defaultRenderer);
        }
        if (!chain.includes(this._rawRenderer)) {
            chain.push(this._rawRenderer);
        }
        // 首次渲染会消费响应体，降级重读用预克隆（须在任何读取前克隆）
        const clones: Response[] = [];
        for (let i = 0; i < chain.length - 1; i++) {
            try {
                clones.push(response.clone());
            } catch (e: any) {
                this.router.logger.warn(
                    "{} -> 响应体不可克隆，渲染降级链可能不可用: {}",
                    matched.id,
                    e?.message ?? e,
                );
                break;
            }
        }
        let source: Response = response;
        let lastError: Error = new Error("视图渲染失败");
        for (let i = 0; i < chain.length; i++) {
            const renderer = chain[i];
            try {
                const result = await renderer.render(source, matched, options);
                if (!result.error) {
                    return { value: result.value, meta: result.meta };
                }
                lastError = result.error;
                this.router.logger.warn(
                    "{} -> 渲染器 {} 加工失败（{}），降级下一渲染器",
                    matched.id,
                    renderer.constructor.name,
                    result.error.message,
                );
            } catch (e: any) {
                lastError = e instanceof Error ? e : new Error(String(e));
                this.router.logger.warn(
                    "{} -> 渲染器 {} 执行异常（{}），降级下一渲染器",
                    matched.id,
                    renderer.constructor.name,
                    lastError.message,
                );
            }
            source = clones[i] ?? source;
        }
        return { error: lastError };
    }
}
