/**
 * Render 特性 - 路由渲染系统
 *
 * 提供完整的路由渲染功能：
 * - 逐级嵌套路由渲染（autospark.outlet 组件出口，x-html.compile 编译激活远程模板）
 * - beforeRender/afterRender 钩子集成
 * - autospark/data script 数据注入：动态数据以 script 追加到视图 HTML 尾部，
 *   engine 编译期 deepMerge（文档序后者覆盖）→ 动态数据覆盖远程模板自带的静态数据
 * - keepalive：同 hash 视图复用（仅激活不触碰内容，运行态保留）；非缓存视图走临时容器；
 *   KeepAlive 两级优先级——出口 mode=tabs > 路由显式 keepAlive > 出口 keepAlive prop（ADR-0003）
 * - 驱动面：经 `engine.data(outletEl, …)` 直写出口组件数据域（ADR-0003 决策 6，methods 驱动面已废弃）
 * - 错误处理和降级（错误页按所在通道渲染）
 *
 * @module features/render
 */

import { findOutlet } from "@/utils/findOutlet";
import type { AutoSparkRouter } from "@/router";
import type { AutoSparkMatchedRouteItem, AutoSparkRouteItem } from "@/types";
import type { IAsyncSignal } from "asyncsignal";
import type { AsyncLoader } from "asyncsignal/loader";
import type { DataLoaderMeta } from "./dataLoader";
import { AutoSparkRouterError } from "@/errors";

type RouteSignalReuslt<T = any> = {
    value: T;
    error?: AutoSparkRouterError;
    hash: string;
};

/** 原始文本元素：无元素子节点、内容按文本处理，不承载视图绑定 */
const RAW_TEXT_TAGS = new Set(["STYLE", "SCRIPT", "TITLE", "TEXTAREA"]);

/**
 * 加载通道载体（`route._getData` / `route._getView` 的实际形态）：
 *
 * - 视图通道（ViewLoader）：可调用的 `IAsyncSignal`；
 * - 数据通道（DataLoader）：`AsyncLoader` 实例——本身不可调用，结果经其内部 `signal` 取得
 *   （见 features/dataLoader 的 `_createLoader`）。
 *
 * 两通道取值语义同构，故取值前统一归一化到 `IAsyncSignal`。
 */
type LoaderChannel =
    | IAsyncSignal
    | AsyncLoader<Record<string, any>, DataLoaderMeta>
    | null
    | undefined;

/** 视图清单条目（出口数据域 append-only 记录；url/title 即页签元数据，ADR-0003 决策 7） */
interface OutletViewEntry {
    hash: string;
    url: string;
    title: string;
    html: string;
    ready: boolean;
}

/** 视图挂载载荷（render → outlet 数据域的写入单元） */
interface ViewPayload {
    hash: string;
    url: string;
    title: string;
    html: string;
    ready: boolean;
}

/** outlet 组件实例的最小读取面（engine.getComponent 门面的子集；写入一律走 engine.data） */
interface OutletComponentHandle {
    data: {
        views: OutletViewEntry[];
        active: string;
        /** 出口模式 prop（'stack' | 'tabs'，缺省 stack） */
        mode?: string;
        /** 出口级 keepAlive 默认值 prop（缺省 false，ADR-0003 决策 2） */
        keepAlive?: boolean;
    };
}

export class Render {
    private async _loadSignal(channel: LoaderChannel) {
        if (!channel) {
            return;
        }
        // 数据通道载体是 AsyncLoader（非可调用体）：取内部 signal，与视图通道归一
        const signal = typeof channel === "function" ? channel : channel.signal;
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
        outlet: HTMLElement | null,
        outletComp: OutletComponentHandle | null,
        viewMeta: Omit<ViewPayload, "html" | "ready">,
        keepAlive: boolean,
        toRoute: AutoSparkMatchedRouteItem[],
    ) {
        this.hooks.runRouteError({
            error,
            to: toRoute,
        });
        if (!outlet || !outletComp) return;
        // 错误页按所在通道渲染（与原 slot.reject 行为对齐：错误内容挂在视图位置）
        const page = this._getErrorPage(error, toRoute);
        const view: ViewPayload = { ...viewMeta, html: page.outerHTML, ready: true };
        if (keepAlive) {
            this._mountView(outlet, outletComp, view);
        } else {
            this._mountEphemeral(outlet, view);
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
     * 路由数据注入视图 HTML（ADR-0032 契约）。
     *
     * 载荷 = 路由数据 + 渲染上下文（`$params`/`$query`/`$state`，ADR-0002 决策 6）——
     * 视图绑定 `$params.xxx` 等路由上下文即取自此；engine 编译期多脚本 deepMerge
     * （文档序后者覆盖），动态数据覆盖远程模板自带的同名静态键（Q6=A）。
     *
     * 注入位置：数据脚本**置入视图的每个元素根内部**（而非作为其尾部兄弟）——数据脚本只
     * 作用于直接父元素（ADR-0032 决策 3），两种位置对视图内绑定等价；但注入内容经
     * `x-html.compile` 编译时（outlet 通道），顶层数据脚本会被剪枝转换器当作「被丢弃的根元素」
     * 而中断整次注入（transformElement 抛错 → 内容整段不编译），内部形态是 engine 当前唯一
     * 可支持的位置。多根视图（如 product-detail.html）逐个根注入，各根各自持数据。
     *
     * `<` 统一转义为 `\u003c`，防止数据值中的 `</script>` 提前闭合标签。
     */
    private _injectRouteData(
        this: AutoSparkRouter,
        html: string,
        data: Record<string, any> | undefined,
        matched: AutoSparkMatchedRouteItem,
    ): string {
        if (!data || typeof data !== "object") return html;
        const payload = {
            ...data,
            $params: matched.params || {},
            $query: matched.query || {},
            $state: matched.state || {},
        };
        const json = JSON.stringify(payload).replace(/</g, "\\u003c");
        const script = `<script type="autospark/data">${json}<\/script>`;
        const tpl = document.createElement("template");
        tpl.innerHTML = html;
        let placed = false;
        for (const el of Array.from(tpl.content.children)) {
            // 原始文本元素（style/script 等）不承载绑定，脚本写入会变成其文本内容
            if (RAW_TEXT_TAGS.has(el.tagName)) continue;
            el.insertAdjacentHTML("beforeend", script);
            placed = true;
        }
        if (!placed) {
            this.logger.debug("{} -> 视图无可注入元素根，路由数据未注入", matched.id);
            return html;
        }
        // 序列化 template 内容：注释 / 文本节点与元素根一并保留（仅插入位置改变）
        return tpl.innerHTML;
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
     * KeepAlive 两级优先级（ADR-0003 决策 2）：
     * 出口 mode=tabs（全视图常驻，临时通道不启用）> 路由项 keepAlive 显式声明 >
     * 出口 keepAlive prop（缺省 false——默认已翻转，不再缓存）。
     */
    private _resolveKeepAlive(
        route: AutoSparkRouteItem,
        outletComp: OutletComponentHandle | null,
    ): boolean {
        if (outletComp?.data.mode === "tabs") return true;
        if (typeof route.keepAlive === "boolean") return route.keepAlive;
        return outletComp?.data.keepAlive === true;
    }

    /** 经 engine.data 直写出口数据域（ADR-0003 决策 6：methods 驱动面已废弃） */
    private _outletData(this: AutoSparkRouter, outlet: HTMLElement, patch: Record<string, any>) {
        this.engine?.data(outlet, patch);
    }

    /**
     * 挂载/更新缓存视图（视图清单 append-only：无则追加；占位补全不重建；随后激活）。
     * 以不可变数组整体写回——x-for 按 :key 复用，同 key 同 index 不触碰内容（运行态保留）。
     */
    private _mountView(
        this: AutoSparkRouter,
        outlet: HTMLElement,
        outletComp: OutletComponentHandle,
        view: ViewPayload,
    ): void {
        const views = outletComp.data.views;
        const found = views.find((v) => v.hash === view.hash);
        if (found && found.ready) {
            this._outletData(outlet, { active: view.hash });
            return;
        }
        const next: OutletViewEntry[] = found
            ? views.map((v) =>
                v.hash === view.hash ? { ...v, html: view.html || "", ready: !!view.ready } : v,
            )
            : [
                ...views,
                {
                    hash: view.hash,
                    url: view.url,
                    title: view.title,
                    html: view.html || "",
                    ready: !!view.ready,
                },
            ];
        this._outletData(outlet, { views: next, active: view.hash });
    }

    /** 挂载非缓存视图（单一临时容器，整体替换重编译） */
    private _mountEphemeral(this: AutoSparkRouter, outlet: HTMLElement, view: ViewPayload): void {
        this._outletData(outlet, {
            ephemeral: { hash: view.hash, html: view.html || "", ready: !!view.ready },
            active: view.hash,
        });
    }

    /**
     * 在父出口的指定视图容器内查找嵌套出口（远程模板里的 x-outlet 经编译激活后落位于此）。
     * 两条挂载通道均有锚点：views 清单容器（:data-view-hash="view.hash"）与
     * 临时容器（:data-view-hash="ephemeral.hash"，见 outletComponent.ts 模板）。
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
     * 嵌套出口定位（带有限微任务重试）：上一层视图挂载落位后，x-html.compile 的编译
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
     * 激活前提判定（ADR-0005 决策 2）：本层视图是否仍是其出口的当前激活视图。
     * 公共层跳过的前提——不成立时跳过转为重挂（出口已被更深回退视图置换，或
     * 后退裁剪后激活态指向其他层）。轻量读取出口数据域，不做组件缺失告警。
     */
    private _isOutletActive(
        this: AutoSparkRouter,
        outlet: HTMLElement,
        viewHash: string,
    ): boolean {
        const comp = this.engine?.getComponent(outlet);
        return (comp as unknown as OutletComponentHandle | null)?.data.active === viewHash;
    }

    /**
     * 从元素向上找最近的出口宿主（不越过 root）。裁剪清理用：定位被裁层视图
     * 挂载的出口（= 其视图容器的最近出口祖先）；root 本身不参与（起点的激活态
     * 由激活前提管理，永不因裁剪清空）。
     */
    private _closestOutlet(
        this: AutoSparkRouter,
        el: HTMLElement,
        root: HTMLElement,
    ): HTMLElement | null {
        let parent = el.parentElement;
        while (parent && parent !== root) {
            if (parent instanceof HTMLElement && parent.hasAttribute("data-autospark-outlet")) {
                return parent;
            }
            parent = parent.parentElement;
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
            let preViewHash = "";
            // 回退语义（ADR-0005 决策 1）下 currentOutlet 恒非空：根出口缺失已在入口提前返回，
            // 嵌套查找失败沿用上一层出口，不再置空
            let currentOutlet: HTMLElement = rootOutlet;
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
                    // 定位本层出口：首层 = 根出口；嵌套层 = 上一层视图容器内的出口。
                    // x-html.compile 首渲 defer 至微任务（ADR-0017），先让出一个微任务等
                    // 上一层视图内容编译就位，嵌套出口才存在于运行 DOM。
                    // 无 view 的中间层（如根路由 "/" 仅为布局占位）不挂视图容器——
                    // 不推进出口，子层沿用当前出口（否则嵌套出口必落空）。
                    // 出口回退（ADR-0005 决策 1）：上一层视图未提供嵌套出口时不推进出口，
                    // 本层视图沿用上一层出口挂载（置换上一层视图），更深匹配层继续在同一
                    // 出口逐级置换、最深者胜；回退视图自带 x-outlet 时更深层自然向下扎根
                    // （查找协议不变）。检测以挂载后的 DOM 真相为准，不做 HTML 预判。
                    if (i === 0) {
                        currentOutlet = rootOutlet;
                    } else if (prevHadView) {
                        const nested = await this._awaitNestedOutlet(
                            navSignal,
                            currentOutlet,
                            preViewHash,
                        );
                        if (navSignal.aborted) {
                            return;
                        }
                        if (nested) {
                            currentOutlet = nested;
                        } else {
                            this.logger.warn(
                                "{} -> 层 {} 未找到嵌套出口，回退沿用上一层出口（路径链 {}）",
                                toRoute[0].id,
                                i,
                                toRoute.map((r) => r.route?.path ?? "?").join(" > "),
                            );
                        }
                    }

                    const viewHash = matched.hash;
                    preViewHash = viewHash;

                    // 是否指定了View参数（含公共路由跳过层的记录，出口推进依赖此状态）
                    const hasView = !!matched.route?.view;
                    prevHadView = hasView;

                    // 公共路由跳过逻辑（ADR-0005 决策 2「激活前提」）：本层视图仍是其出口的
                    // 当前激活视图时才跳过——目标链短于当前链（后退裁剪）或出口已被更深回退
                    // 视图置换时，跳过前提不成立，正常执行挂载（signal 已由加载域备好，零网络
                    // 成本：keepAlive 视图仅激活不触碰 DOM，ephemeral 视图重挂恢复）
                    if (
                        i < commonRouteIndex &&
                        (!hasView || this._isOutletActive(currentOutlet, viewHash))
                    ) {
                        continue;
                    }

                    const outletComp = hasView ? this._getOutletComponent(currentOutlet) : null;
                    // KeepAlive 两级优先级（ADR-0003 决策 2：mode=tabs > 路由显式声明 > 出口 prop）
                    const keepAlive = this._resolveKeepAlive(curRouteItem, outletComp);
                    // 页签元数据：标题取路由 title、缺省回退 hash（ADR-0003 决策 3）
                    const viewMeta = {
                        hash: viewHash,
                        url: matched.url,
                        title: curRouteItem.title || viewHash,
                    };
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
                                ...viewMeta,
                                html: "",
                                ready: false,
                            };
                            if (keepAlive) {
                                this._mountView(currentOutlet, outletComp, placeholder);
                            } else {
                                this._mountEphemeral(currentOutlet, placeholder);
                            }
                        }
                        if (outletComp) {
                            this._outletData(currentOutlet, { active: viewHash });
                        }

                        // 如果 view 为 null/undefined，即没有创建
                        if (view) {
                            if (view.error) {
                                this._routeReject(
                                    view.error,
                                    currentOutlet,
                                    outletComp,
                                    viewMeta,
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
                                        this._outletData(currentOutlet, { active: viewHash });
                                    } else {
                                        // 远程模板 + 动态数据 script 合并（动态覆盖静态，Q6=A）
                                        const mergedHtml = this._injectRouteData(
                                            view.value,
                                            data?.value,
                                            matched,
                                        );
                                        const payload: ViewPayload = {
                                            ...viewMeta,
                                            html: mergedHtml,
                                            ready: true,
                                        };
                                        if (keepAlive) {
                                            this._mountView(currentOutlet, outletComp, payload);
                                        } else {
                                            this._mountEphemeral(currentOutlet, payload);
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
                                currentOutlet,
                                outletComp,
                                viewMeta,
                                keepAlive,
                                toRoute,
                            );
                        }
                        break;
                    }
                }
            }

            // 裁剪清理（ADR-0005 决策 2）：from 链比 to 链长出的层级，其视图仍激活在
            // 挂载出口中（如后退裁剪后详情残留在列表视图的嵌套出口内）——从渲染终点
            // 出口起按被裁层逐级下探：按容器锚点找到被裁层视图，向上定位其挂载出口，
            // 清空激活态休眠（keepAlive 条目保留可复用，ephemeral 容器随 x-show 隐藏）；
            // 容器不存在（已被置换）即无残留
            if (fromRoute && fromRoute.length > toRoute.length && !navSignal.aborted) {
                let scope: HTMLElement = currentOutlet;
                for (let i = toRoute.length; i < fromRoute.length; i++) {
                    if (navSignal.aborted) break;
                    const trimmed = fromRoute[i];
                    if (!trimmed.route?.view) break;
                    const viewHost = scope.querySelector(`[data-view-hash="${trimmed.hash}"]`);
                    if (!(viewHost instanceof HTMLElement)) break;
                    const mountedOutlet = this._closestOutlet(viewHost, scope);
                    if (!mountedOutlet) break;
                    this._outletData(mountedOutlet, { active: "" });
                    scope = mountedOutlet;
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
