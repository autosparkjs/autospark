/**
 * Render 特性 - 路由渲染系统
 *
 * 提供完整的路由渲染功能：
 * - 逐级嵌套路由渲染（autospark.outlet 组件出口，x-html.compile 编译激活远程模板）
 * - beforeRender/afterRender 钩子集成
 * - autospark/data script 数据注入：动态数据以 script 追加到视图 HTML 尾部，
 *   engine 编译期 deepMerge（文档序后者覆盖）→ 动态数据覆盖远程模板自带的静态数据
 * - keepalive：同 hash 视图复用（activateView 不触碰内容，运行态保留）；非缓存视图走临时容器
 * - 错误处理和降级（错误页按所在通道渲染）
 *
 * @module features/render
 */

import { findOutlet } from "@/utils/findOutlet";
import type { AutoSparkRouter } from "@/router";
import type { AutoSparkMatchedRouteItem, AutoSparkRouteItem } from "@/types";
import type { IAsyncSignal } from "asyncsignal";
import { AutoSparkRouterError } from "@/errors";

type RouteSignalReuslt<T = any> = {
    value: T;
    error?: AutoSparkRouterError;
    hash: string;
};

/** 视图挂载载荷（outlet 组件 methods 的入参契约） */
interface ViewPayload {
    hash: string;
    html: string;
    ready: boolean;
}

/** outlet 组件实例的最小驱动面（engine.getComponent 门面的子集） */
interface OutletComponentHandle {
    data: {
        views: Array<{ hash: string; html: string; ready: boolean }>;
        active: string;
    };
    methods: {
        activateView(hash: string): void;
        mountView(view: ViewPayload): void;
        mountEphemeral(view: ViewPayload): void;
    };
}

export class Render {
    private async _loadSignal(signal: IAsyncSignal | null) {
        if (!signal) {
            return;
        }
        const data: Record<string, any> = {};
        try {
            const result = await signal();
            // 解包 loader 通道的 AutoSparkRemoteLoadResult（{value} 包装，见 baseLoader.onLoadSuccess
            // 的 signal.resolve(data)）——data/value 两通道同构，直接取 value 本体
            data.value =
                result && typeof result === "object" && "value" in result ? result.value : result;
            data.hash = signal.meta.hash;
        } catch (e: any) {
            data.error = new AutoSparkRouterError((e as Error).message, e.status || 500);
        }
        return data as RouteSignalReuslt;
    }
    private async _loadView(matched: AutoSparkMatchedRouteItem) {
        const route = matched.route as Required<AutoSparkRouteItem>;
        return (await this._loadSignal(route._getView)) as RouteSignalReuslt;
    }
    private async _loadData(matched: AutoSparkMatchedRouteItem) {
        const route = matched.route as Required<AutoSparkRouteItem>;
        return await this._loadSignal(route._getData);
    }
    private _routeReject(
        this: AutoSparkRouter,
        error: any,
        outletComp: OutletComponentHandle | null,
        viewHash: string,
        keepAlive: boolean,
        toRoute: AutoSparkMatchedRouteItem[],
    ) {
        this.hooks.runRouteError({
            error,
            to: toRoute,
        });
        if (!outletComp) return;
        // 错误页按所在通道渲染（与原 slot.reject 行为对齐：错误内容挂在视图位置）
        const page = this._getErrorPage(error, toRoute);
        const payload: ViewPayload = { hash: viewHash, html: page.outerHTML, ready: true };
        if (keepAlive) {
            outletComp.methods.mountView(payload);
        } else {
            outletComp.methods.mountEphemeral(payload);
        }
    }
    private _getCommonRouteIndex(
        this: AutoSparkRouter,
        fromRoute: AutoSparkMatchedRouteItem[] | undefined,
        toRoute: AutoSparkMatchedRouteItem[],
    ): number {
        // 找出 fromRoute 和 toRoute 的公共路由层级
        // 公共路由不需要重新渲染，保持已激活视图即可
        let commonRouteIndex = 0;
        if (fromRoute && fromRoute.length > 0) {
            for (let i = 0; i < Math.min(fromRoute.length, toRoute.length); i++) {
                if (fromRoute[i].url === toRoute[i].url) {
                    commonRouteIndex = i + 1;
                } else {
                    break;
                }
            }
        }
        this.logger.debug("{} -> 公共路由层数: {}", toRoute[0].id, commonRouteIndex);
        return commonRouteIndex;
    }

    /**
     * 动态数据序列化为 `<script type="autospark/data">`（ADR-0032 契约）。
     * engine 编译期对多脚本 deepMerge（文档序后者覆盖），router 写入的 script 追加在
     * 视图 HTML 尾部 → 动态数据覆盖远程模板自带的同名静态键（Q6=A）。
     * `<` 统一转义为 `<`，防止数据值中的 `</script>` 提前闭合标签。
     */
    private _buildDataScript(this: AutoSparkRouter, data: Record<string, any> | undefined): string {
        if (!data || typeof data !== "object") return "";
        const json = JSON.stringify(data).replace(/</g, "\\u003c");
        return `<script type="autospark/data">${json}<\/script>`;
    }

    /**
     * 取 outlet 宿主关联的组件驱动面（宿主未实例化时 error 返回 null）
     */
    private _getOutletComponent(
        this: AutoSparkRouter,
        outlet: HTMLElement,
    ): OutletComponentHandle | null {
        const comp = this.engine?.getComponent(outlet);
        if (!comp) {
            this.logger.error("{} -> outlet 宿主未关联组件实例，无法渲染视图", outlet.tagName);
            return null;
        }
        return comp as unknown as OutletComponentHandle;
    }

    private _getRootOutlet(this: AutoSparkRouter): HTMLElement | null {
        return findOutlet(this.host)[0] ?? null;
    }

    /**
     * 在父出口的指定视图容器内查找嵌套出口（远程模板里的 x-outlet 经编译激活后落位于此）
     */
    private _findNestedOutlet(
        this: AutoSparkRouter,
        parentOutlet: HTMLElement,
        viewHash: string,
    ): HTMLElement | null {
        const viewHost = parentOutlet.querySelector(`[data-view-hash="${viewHash}"]`);
        if (!(viewHost instanceof HTMLElement)) return null;
        return findOutlet(viewHost)[0] ?? null;
    }

    /**
     * 嵌套出口定位（带有限微任务重试）：上一层 mountView 落位后，x-html.compile 的编译
     * 落地是多级微任务链（compile → schedule → flush，ADR-0017），深层路由连续渲染时单次
     * `await Promise.resolve()` 不保证视图容器内的出口已就位——让出微任务重试至多
     * {@link NESTED_OUTLET_MICROTASK_RETRIES} 次，仍 miss 才判失败（导航中止立即停）。
     */
    private static readonly NESTED_OUTLET_MICROTASK_RETRIES = 20;

    private async _awaitNestedOutlet(
        this: AutoSparkRouter,
        navSignal: AbortSignal,
        parentOutlet: HTMLElement,
        viewHash: string,
    ): Promise<HTMLElement | null> {
        for (let attempt = 0; attempt <= Render.NESTED_OUTLET_MICROTASK_RETRIES; attempt++) {
            if (navSignal.aborted) return null;
            const found = this._findNestedOutlet(parentOutlet, viewHash);
            if (found) return found;
            await Promise.resolve();
        }
        return null;
    }

    /**
     * 执行渲染步骤
     * 支持逐级嵌套路由渲染、beforeRender/afterRender 钩子
     * 包含并发控制，防止快速导航时渲染混乱
     */
    protected async _renderRoutes(
        this: AutoSparkRouter,
        toRoute: AutoSparkMatchedRouteItem[],
        fromRoute: AutoSparkMatchedRouteItem[] | undefined,
        navSignal: AbortSignal,
    ): Promise<void> {
        let hasError: any;
        let activeOutlet: HTMLElement | null = null;
        try {
            const rootOutlet = this._getRootOutlet();
            if (!rootOutlet) {
                // 自建 engine 模式已在 engineHost 兜底插入默认出口；走到这里说明
                // 注入模式下应用模板未声明任何出口（x-outlet / x-component:autospark.outlet）
                this.logger.error(
                    "宿主内未找到 autospark.outlet 出口，跳过渲染（注入模式须在模板中声明出口元素）",
                );
                this.emit("render:after", { route: toRoute, error: hasError, slot: null });
                return;
            }
            this.emit("render:before", { route: toRoute });
            const commonRouteIndex: number = this._getCommonRouteIndex(fromRoute, toRoute);
            let preViewHash: string;
            let currentOutlet: HTMLElement | null = rootOutlet;
            // 上一层是否挂载了视图（有无 view 声明）：嵌套出口只在上一层有视图容器时才存在
            let prevHadView = false;
            for (let i = 0; i < toRoute.length; i++) {
                // 检查是否被导航中止
                if (navSignal.aborted) {
                    return;
                }

                const matched = toRoute[i];
                const curRouteItem = matched.route;

                if (curRouteItem) {
                    // 定位本层出口：首层 = 根出口；嵌套层 = 上一层激活视图容器内的出口。
                    // x-html.compile 首渲 defer 至微任务（ADR-0017），先让出一个微任务等
                    // 上一层视图内容编译就位，嵌套出口才存在于运行 DOM。
                    // 无 view 的中间层（如根路由 "/" 仅为布局占位）不挂视图容器——
                    // 不推进出口，子层沿用当前出口（否则嵌套出口必落空）。
                    if (i === 0) {
                        currentOutlet = rootOutlet;
                    } else if (prevHadView) {
                        currentOutlet = await this._awaitNestedOutlet(
                            navSignal,
                            currentOutlet!,
                            preViewHash!,
                        );
                    }

                    const viewHash = matched.hash;
                    preViewHash = viewHash;

                    // 是否指定了View参数（含公共路由跳过层的记录，出口推进依赖此状态）
                    const hasView = !!matched.route?.view;
                    prevHadView = hasView;

                    // 公共路由跳过逻辑：视图已激活，直接跳过
                    if (i < commonRouteIndex) {
                        continue;
                    }

                    // 检查 currentOutlet 是否有效
                    if (!currentOutlet) {
                        this.logger.error(
                            "{} -> 无法找到出口，跳过渲染（层 {}，路径链 {}）",
                            toRoute[0].id,
                            i,
                            toRoute.map((r) => r.route?.path ?? "?").join(" > "),
                        );
                        continue;
                    }


                    const keepAlive = curRouteItem.keepAlive !== false;
                    const outletComp = hasView ? this._getOutletComponent(currentOutlet) : null;
                    if (hasView) {
                        this._lastViewSlot = currentOutlet;
                        activeOutlet = currentOutlet;
                    }

                    try {
                        // 检查导航是否被中止
                        if (navSignal.aborted) {
                            this.logger.debug("数据加载前被中止");
                            return;
                        }

                        const data = await this._loadData(matched);

                        if (navSignal.aborted) {
                            this.logger.debug("视图加载前被中止");
                            return;
                        }

                        const view = await this._loadView(matched);

                        // keepalive 复用判断：同 hash 视图已就绪 → 仅激活，不触碰内容（运行态保留）
                        const existing =
                            outletComp?.data.views.find(
                                (v) => v.hash === viewHash && v.ready,
                            ) ?? null;
                        const isReuse = !!(keepAlive && existing);

                        // 非复用：先落加载占位（内容就绪前显示 autospark-loading）
                        if (!isReuse && outletComp && view) {
                            const placeholder: ViewPayload = {
                                hash: viewHash,
                                html: "",
                                ready: false,
                            };
                            if (keepAlive) {
                                outletComp.methods.mountView(placeholder);
                            } else {
                                outletComp.methods.mountEphemeral(placeholder);
                            }
                        }
                        if (outletComp) {
                            outletComp.methods.activateView(viewHash);
                        }

                        // 如果 view 为 null/undefined，即没有创建
                        if (view) {
                            if (view.error) {
                                this._routeReject(
                                    view.error,
                                    outletComp,
                                    viewHash,
                                    keepAlive,
                                    toRoute,
                                );
                                break;
                            } else {
                                await this._runBeforeRender(
                                    fromRoute || [],
                                    toRoute,
                                    currentOutlet,
                                    data?.value,
                                );
                                if (outletComp) {
                                    if (isReuse) {
                                        outletComp.methods.activateView(viewHash);
                                    } else {
                                        // 远程模板 + 动态数据 script 合并（动态覆盖静态，Q6=A）
                                        const mergedHtml =
                                            view.value + this._buildDataScript(data?.value);
                                        const payload: ViewPayload = {
                                            hash: viewHash,
                                            html: mergedHtml,
                                            ready: true,
                                        };
                                        if (keepAlive) {
                                            outletComp.methods.mountView(payload);
                                        } else {
                                            outletComp.methods.mountEphemeral(payload);
                                        }
                                    }
                                }
                                this._runAfterRender(fromRoute || [], toRoute, currentOutlet);
                            }
                        }
                    } catch (loadingError) {
                        this.logger.error("视图或数据加载失败", loadingError);
                        if (outletComp) {
                            this._routeReject(
                                loadingError,
                                outletComp,
                                viewHash,
                                keepAlive,
                                toRoute,
                            );
                        }
                        break;
                    }
                }
            }
        } catch (error: any) {
            this.logger.error(`渲染失败: ${error.message}`, error);
            hasError = error;
        } finally {
            this.emit("render:after", { route: toRoute, error: hasError, slot: activeOutlet });
        }
    }

    /**
     * 执行 beforeRender 钩子
     *
     * 渲染之前的钩子可以修改视图容器
     *
     * @param from - 来源路由
     * @param to - 目标路由
     * @param view - 视图出口宿主元素
     * @param data - 路由数据
     */
    protected async _runBeforeRender(
        this: AutoSparkRouter,
        from: AutoSparkMatchedRouteItem[],
        to: AutoSparkMatchedRouteItem[],
        view: HTMLElement,
        data?: Record<string, any>,
    ): Promise<void> {
        try {
            await this.hooks.runBeforeRender({
                from,
                to,
                view,
                data,
            });
        } catch (hookError) {
            this.logger.error("渲染流程: beforeRender 钩子执行失败", hookError);
        }
    }

    /**
     * 执行 afterRender 钩子（异步，不等待）
     * @param from - 来源路由
     * @param to - 目标路由
     * @param el - 视图出口宿主元素
     */
    protected _runAfterRender(
        this: AutoSparkRouter,
        from: AutoSparkMatchedRouteItem[],
        to: AutoSparkMatchedRouteItem[],
        el: HTMLElement,
    ): void {
        this.hooks
            .runAfterRender({
                from,
                to,
                el,
            })
            .catch((hookError) => {
                this.logger.error("渲染流程: afterRender 钩子执行失败", hookError);
            });
    }

    /**
     * 根据错误对象获取对应的错误页面元素
     * @param error - 错误对象
     * @param route - 完整的目标路由数组（用于错误页面处理器获取路由上下文）
     * @returns 错误页面 HTMLElement
     */
    protected _getErrorPage(
        this: AutoSparkRouter,
        error: AutoSparkRouterError,
        route: AutoSparkMatchedRouteItem[],
    ): HTMLElement {
        const statusCode = String(error.status || 500);

        // 查找对应的错误页面处理器（errorPages 在初始化时已设置，必定存在）
        const errorPages = this.options.errorPages!;
        const errorHandler = errorPages[statusCode] || errorPages["*"];

        try {
            if (typeof errorHandler === "function") {
                return errorHandler(error, route);
            }
            return errorHandler!;
        } catch (handlerError) {
            // 错误处理器本身出错，使用兜底的 * 处理器
            this.logger.error("错误处理器执行失败", handlerError);
            const fallbackHandler = errorPages["*"]!;
            return typeof fallbackHandler === "function"
                ? fallbackHandler(handlerError, route)
                : fallbackHandler;
        }
    }

    /**
     * 在父元素内部查找 outlet
     * @param parent - 父元素
     * @returns 找到的第一个 outlet 元素，未找到返回 null
     */
    protected _findOutlet(this: AutoSparkRouter, parent: HTMLElement): HTMLElement | null {
        const outlets = findOutlet(parent);
        return outlets[0] || null;
    }

    /**
     * 确保 host 元素内部有至少一个 outlet
     *
     * 自建 engine 模式已在 engineHost 兜底（编译前插入，可正常激活）；
     * 注入模式下宿主已编译，无法再插入激活——仅告警提示应用声明出口。
     */
    protected _ensureDefaultOutlet(this: AutoSparkRouter): void {
        if (findOutlet(this.host).length > 0) {
            return;
        }
        this.logger.warn(
            "宿主内未找到 autospark.outlet 出口：注入 engine 模式下请在模板中声明 " +
                "<div x-component:autospark.outlet>（x-outlet 简写仅对自建模式与远程模板生效）",
        );
    }
}
