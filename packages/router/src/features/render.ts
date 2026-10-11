/**
 * Render 特性 - 路由渲染系统
 *
 * 提供完整的路由渲染功能，包括：
 * - 逐级嵌套路由渲染
 * - beforeRender/afterRender 钩子集成
 * - routeSlot 管理
 * - 错误处理和降级
 * - Outlet 查找和创建辅助方法
 *
 * @module features/render
 */

import { findOutlet } from "@/utils/findOutlet";
import type { KylinRouter } from "@/router";
import type { KylinMatchedRouteItem, KylinRouteItem } from "@/types";
import type { KylinOutlet } from "@/components/Outlet";
import type { IAsyncSignal } from "asyncsignal";
import { KylinRouterError } from "@/errors";
import type { KylinSlot } from "@/components/Slot";
import Alpine from "alpinejs";
import { isEmptyObject } from "es-toolkit";

type RouteSignalReuslt<T = any> = {
    value: T;
    error?: KylinRouterError;
    hash: string;
};

export class Render {
    private async _loadSignal(signal: IAsyncSignal | null) {
        if (!signal) {
            return;
        }
        const data: Record<string, any> = {};
        try {
            const result = await signal();
            data.value = result;
            data.hash = signal.meta.hash;
        } catch (e: any) {
            data.error = new KylinRouterError((e as Error).message, e.status || 500);
        }
        return data as RouteSignalReuslt;
    }
    private async _loadView(matched: KylinMatchedRouteItem) {
        const route = matched.route as Required<KylinRouteItem>;
        return (await this._loadSignal(route._getView)) as RouteSignalReuslt;
    }
    private async _loadData(matched: KylinMatchedRouteItem) {
        const route = matched.route as Required<KylinRouteItem>;
        return await this._loadSignal(route._getData);
    }
    private _routeReject(
        this: KylinRouter,
        error: any,
        slot: KylinSlot,
        toRoute: KylinMatchedRouteItem[],
    ) {
        this.hooks.runRouteError({
            error,
            to: toRoute,
        });
        slot.reject(error, this._getErrorPage(error, toRoute));
    }
    private _getCommonRouteIndex(
        this: KylinRouter,
        fromRoute: KylinMatchedRouteItem[] | undefined,
        toRoute: KylinMatchedRouteItem[],
    ): number {
        // 找出 fromRoute 和 toRoute 的公共路由层级
        // 公共路由不需要重新渲染，直接激活已存在的视图容器即可
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
    private _getRootOutlet(this: KylinRouter): KylinOutlet {
        let outlet: KylinOutlet | null = findOutlet(this.host)[0];
        if (!outlet) {
            outlet = document.createElement("kylin-outlet");
            this.host.appendChild(outlet);
        }
        return outlet;
    }
    private _injectRouteParams(slot: KylinSlot, matched: KylinMatchedRouteItem) {
        const params = {
            $params: matched.params || {},
            $query: matched.query || {},
            $state: matched.state || {},
        };
        if (!isEmptyObject(params)) {
            slot.setAttribute("x-inject-data", JSON.stringify(params));
        }
    }
    /**
     * 在指定的 Outlet 内部创建或复用 kylin-slot 元素
     *
     * @param outlet - 父级 Outlet 元素
     * @param options - 配置选项
     * @returns kylin-slot 元素
     */
    private _createSlot(
        this: KylinRouter,
        matched: KylinMatchedRouteItem,
        outlet: KylinOutlet,
        options: {
            id: string; // slot ID，用于唯一标识和复用
            url?: string; // 当前 URL，用于参数变化检测
            keepAlive?: boolean; // 是否启用缓存，默认 true
        },
    ): KylinSlot {
        const { id, url, keepAlive = true } = options;

        // 查找已存在的 slot（基于 hash 复用）
        const existingSlot = outlet.querySelector<KylinSlot>(`kylin-slot[id="${id}"]`);

        // keepAlive=false 时删除旧 slot 并创建新的
        if (existingSlot && !keepAlive) {
            existingSlot.remove();
        }

        // keepAlive=true 时复用已存在的 slot（hash 相同即复用，忽略 url）
        if (existingSlot && keepAlive) {
            return existingSlot;
        }

        // 创建新 slot
        const slot = document.createElement("kylin-slot") as KylinSlot;
        slot.id = id;
        if (url) slot.url = url;
        slot.loading = true; // 渲染前显示 Loading
        this._injectRouteParams(slot, matched);
        outlet.appendChild(slot);

        return slot;
    }
    /**
     * 执行渲染步骤 - 新的渲染系统
     * 支持逐级嵌套路由渲染、beforeRender/afterRender 钩子、layout 布局等
     * 包含并发控制，防止快速导航时渲染混乱
     */
    protected async _renderRoutes(
        this: KylinRouter,
        toRoute: KylinMatchedRouteItem[],
        fromRoute: KylinMatchedRouteItem[] | undefined,
        navSignal: AbortSignal,
    ): Promise<void> {
        let hasError: any;
        let slot: KylinSlot | null | undefined;
        try {
            let currentOutlet: KylinOutlet | null = this._getRootOutlet();
            this.emit("render:before", { route: toRoute });
            const commonRouteIndex: number = this._getCommonRouteIndex(fromRoute, toRoute);
            let preViewHash: string;
            for (let i = 0; i < toRoute.length; i++) {
                // 检查是否被导航中止
                if (navSignal.aborted) {
                    return;
                }

                const matched = toRoute[i];
                const curRouteItem = matched.route;

                if (curRouteItem) {
                    currentOutlet =
                        i === 0 ? this._getRootOutlet() : currentOutlet.findOutlet(preViewHash!);

                    const viewHash = matched.hash;
                    preViewHash = viewHash;

                    // 公共路由跳过逻辑：直接跳过，currentOutlet 保持不变
                    if (i < commonRouteIndex) {
                        continue;
                    }

                    // keepAlive 逻辑已在 _createSlot() 内部处理

                    // 检查 currentOutlet 是否有效
                    if (!currentOutlet) {
                        this.logger.error("{} -> 无法找到 outlet，跳过渲染", toRoute[0].id);
                        continue;
                    }
                    // 是否指定了View参数，如果没有指定
                    const hasView = matched.route?.view;

                    // 创建 kylin-slot: 用于渲染视图内容或错误页
                    slot = hasView
                        ? this._createSlot(matched, currentOutlet, {
                              id: viewHash,
                              url: matched.url,
                              keepAlive: curRouteItem.keepAlive !== false,
                          })
                        : null;
                    this._lastViewSlot = slot;
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
                        // 如果 view 为 null/undefined，即没有创建
                        if (view) {
                            if (view.error) {
                                this._routeReject(view.error, slot!, toRoute);
                                break;
                            } else {
                                await this._runBeforeRender(
                                    fromRoute || [],
                                    toRoute,
                                    slot!,
                                    data?.value,
                                );
                                slot?.resolve(view.value, data);
                                slot!.active = true;
                                this._runAfterRender(fromRoute || [], toRoute, slot!);
                            }
                        }
                    } catch (loadingError) {
                        this.logger.error("视图或数据加载失败", loadingError);
                        if (slot) this._routeReject(loadingError, slot, toRoute);
                        break;
                    } finally {
                        if (slot) {
                            slot.finally();
                            Alpine.initTree(slot);
                        }
                    }
                }
            }
        } catch (error: any) {
            this.logger.error(`渲染失败: ${error.message}`, error);
            hasError = error;
        } finally {
            // 渲染完成后，从渲染根开始重新初始化 Alpine
            // 这样可以让 Alpine 处理动态插入的子路由内容
            Alpine.initTree(this.host);
            this.emit("render:after", { route: toRoute, error: hasError, slot });
        }
    }

    /**
     * 执行 beforeRender 钩子
     *
     * 渲染之前的钩子可以修改视图容器
     *
     * @param from - 来源路由
     * @param to - 目标路由
     * @param view - 视图容器
     * @param data - 路由数据
     */
    protected async _runBeforeRender(
        this: KylinRouter,
        from: KylinMatchedRouteItem[],
        to: KylinMatchedRouteItem[],
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
     * @param el - 视图元素
     */
    protected _runAfterRender(
        this: KylinRouter,
        from: KylinMatchedRouteItem[],
        to: KylinMatchedRouteItem[],
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
        this: KylinRouter,
        error: KylinRouterError,
        route: KylinMatchedRouteItem[],
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
    protected _findOutlet(this: KylinRouter, parent: HTMLElement): KylinOutlet | null {
        const outlets = findOutlet(parent);
        return outlets[0] || null;
    }

    /**
     * 确保 host 元素内部有至少一个 outlet
     * 如果没有，自动创建并插入一个默认 outlet
     */
    protected _ensureDefaultOutlet(this: KylinRouter): void {
        const outlets = findOutlet(this.host);
        if (outlets.length > 0) {
            return;
        }
        const defaultOutlet = document.createElement("kylin-outlet");
        this.host.appendChild(defaultOutlet);
    }
}
