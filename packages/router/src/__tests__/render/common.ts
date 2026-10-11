import type { KylinRouter } from "@/router";
import type { KylinMatchedRouteItem } from "@/types/routes";
import type { KylinRouterEvents } from "@/types/events";

/**
 * 路由事件收集器 - 用于测试中监听和验证路由事件
 */
export class RouteEventCollector {
    private events: Map<keyof KylinRouterEvents, any> = new Map();
    private router: KylinRouter;
    private cleanupCallbacks: Array<() => void> = [];

    constructor(router: KylinRouter) {
        this.router = router;
        this.setupListeners();
    }

    private setupListeners() {
        // 监听导航开始事件
        const startUnsubscribe = this.router.on("navigation:start", (data) => {
            this.events.set("navigation:start", data);
        });
        this.cleanupCallbacks.push(startUnsubscribe);

        // 监听路由匹配事件
        const matchedUnsubscribe = this.router.on("navigation:matched", (data) => {
            this.events.set("navigation:matched", data);
        });
        this.cleanupCallbacks.push(matchedUnsubscribe);

        // 监听渲染前事件
        const beforeUnsubscribe = this.router.on("render:before", (data) => {
            this.events.set("render:before", data);
        });
        this.cleanupCallbacks.push(beforeUnsubscribe);

        // 监听渲染后事件
        const afterUnsubscribe = this.router.on("render:after", (data) => {
            this.events.set("render:after", data);
        });
        this.cleanupCallbacks.push(afterUnsubscribe);
    }

    /**
     * 获取目标路由的 hash（从 navigation:matched 事件中提取）
     */
    get toRouteHash(): string | undefined {
        const matched = this.events.get("navigation:matched");
        if (matched && matched.toRoute && matched.toRoute.length > 0) {
            return matched.toRoute[matched.toRoute.length - 1].hash;
        }
        return undefined;
    }

    /**
     * 获取源路由的 hash（从 navigation:matched 事件中提取）
     */
    get fromRouteHash(): string | undefined {
        const matched = this.events.get("navigation:matched");
        if (matched && matched.fromRoute && matched.fromRoute.length > 0) {
            return matched.fromRoute[matched.fromRoute.length - 1].hash;
        }
        return undefined;
    }

    /**
     * 获取完整的目标路由数组
     */
    get toRoutes(): KylinMatchedRouteItem[] | undefined {
        const matched = this.events.get("navigation:matched");
        return matched?.toRoute;
    }

    /**
     * 获取完整的源路由数组
     */
    get fromRoutes(): KylinMatchedRouteItem[] | undefined {
        const matched = this.events.get("navigation:matched");
        return matched?.fromRoute;
    }

    /**
     * 获取导航模式（push/replace/pop）
     */
    get navigationMode(): "push" | "replace" | "pop" | undefined {
        return this.events.get("navigation:start")?.mode;
    }

    /**
     * 获取渲染前的路由数据
     */
    get renderBeforeRoutes(): KylinMatchedRouteItem[] | undefined {
        return this.events.get("render:before")?.route;
    }

    /**
     * 获取渲染后的数据（包含错误信息）
     */
    get renderAfterData(): { route: KylinMatchedRouteItem[]; error?: Error } | undefined {
        return this.events.get("render:after");
    }

    /**
     * 检查是否发生了渲染错误
     */
    get hasRenderError(): boolean {
        const afterData = this.events.get("render:after");
        return afterData?.error !== undefined;
    }

    /**
     * 获取渲染错误
     */
    get renderError(): Error | undefined {
        return this.events.get("render:after")?.error;
    }

    /**
     * 清除所有收集的事件数据
     */
    clear() {
        this.events.clear();
    }

    /**
     * 清理事件监听器
     */
    dispose() {
        this.cleanupCallbacks.forEach((cleanup) => cleanup());
        this.cleanupCallbacks = [];
        this.events.clear();
    }
}

// 模块级状态跟踪，确保 MutationObserver 只被设置一次
let _enhancedMutationObserverSetup = false;

/**
 * 设置增强的 MutationObserver（仅执行一次）
 */
function setupEnhancedMutationObserver() {
    if (_enhancedMutationObserverSetup) {
        return;
    }
    _enhancedMutationObserverSetup = true;

    // 增强的 MutationObserver - 使 Alpine.js 能够正常工作
    // Alpine.js 使用 MutationObserver 来检测 DOM 变化并初始化组件
    class EnhancedMutationObserver implements MutationObserver {
        private callback: MutationCallback;
        private isObserving = false;

        constructor(callback: MutationCallback) {
            this.callback = callback;
        }

        observe(node: Node, options: MutationObserverInit): void {
            this.isObserving = true;

            // 保存原始方法引用（仅第一次）
            const originalAppendChild = Node.prototype.appendChild;
            const originalRemoveChild = Node.prototype.removeChild;
            const originalInsertBefore = Node.prototype.insertBefore;
            const originalReplaceChild = Node.prototype.replaceChild;
            const originalSetAttribute = Element.prototype.setAttribute;
            const originalRemoveAttribute = Element.prototype.removeAttribute;

            const self = this;

            // 简化的 DOM 变化检测 - 只在 appendChild 时触发
            const wrappedAppendChild = function (this: Node, child: Node): Node {
                const result = originalAppendChild.call(this, child);

                if (self.isObserving) {
                    queueMicrotask(() => {
                        self.callback(
                            [
                                {
                                    type: "childList",
                                    target: this,
                                    addedNodes: [child],
                                    removedNodes: [],
                                    attributeName: null,
                                    attributeNamespace: null,
                                    nextSibling: null,
                                    oldValue: null,
                                    previousSibling: null,
                                } as MutationRecord,
                            ],
                            self as unknown as MutationObserver,
                        );
                    });
                }

                return result;
            };

            const wrappedRemoveChild = function (this: Node, child: Node): Node {
                const result = originalRemoveChild.call(this, child);

                if (self.isObserving) {
                    queueMicrotask(() => {
                        self.callback(
                            [
                                {
                                    type: "childList",
                                    target: this,
                                    addedNodes: [],
                                    removedNodes: [child],
                                    attributeName: null,
                                    attributeNamespace: null,
                                    nextSibling: null,
                                    oldValue: null,
                                    previousSibling: null,
                                } as MutationRecord,
                            ],
                            self as unknown as MutationObserver,
                        );
                    });
                }

                return result;
            };

            const wrappedSetAttribute = function (this: Element, name: string, value: string): void {
                const oldValue = this.getAttribute(name);
                originalSetAttribute.call(this, name, value);

                if (self.isObserving && (options.attributes || options.attributeFilter)) {
                    if (options.attributeFilter && !options.attributeFilter.includes(name)) {
                        return;
                    }

                    queueMicrotask(() => {
                        self.callback(
                            [
                                {
                                    type: "attributes",
                                    target: this,
                                    addedNodes: [],
                                    removedNodes: [],
                                    attributeName: name,
                                    attributeNamespace: null,
                                    nextSibling: null,
                                    oldValue: options.attributeOldValue ? oldValue : null,
                                    previousSibling: null,
                                } as MutationRecord,
                            ],
                            self as unknown as MutationObserver,
                        );
                    });
                }
            };

            // 只在第一次包装原型方法（使用 WeakMap 检测）
            const wrappedMap = new WeakMap();

            if (!wrappedMap.has(Node.prototype)) {
                wrappedMap.set(Node.prototype, true);
                Node.prototype.appendChild = wrappedAppendChild as any;
                Node.prototype.removeChild = wrappedRemoveChild as any;
            }

            if (!wrappedMap.has(Element.prototype)) {
                wrappedMap.set(Element.prototype, true);
                Element.prototype.setAttribute = wrappedSetAttribute as any;
            }
        }

        disconnect(): void {
            this.isObserving = false;
        }

        takeRecords(): MutationRecord[] {
            return [];
        }
    }

    // @ts-ignore
    globalThis.MutationObserver = EnhancedMutationObserver;
}

/**
 * 创建测试用的 DOM 环境
 * 正确支持 happy-dom 的 WebComponents
 */
export function createTestDOM() {
    // 设置增强的 MutationObserver（仅首次调用生效）
    setupEnhancedMutationObserver();

    const { Window } = require("happy-dom");
    const win = new Window({ url: "http://localhost/" });

    // 设置全局对象
    // @ts-ignore
    globalThis.window = win;
    // @ts-ignore
    globalThis.document = win.document;
    // @ts-ignore
    globalThis.history = win.history;
    // @ts-ignore
    globalThis.location = win.location;
    // @ts-ignore
    globalThis.Event = win.Event;
    // @ts-ignore
    globalThis.CustomEvent = win.CustomEvent;
    // @ts-ignore
    globalThis.HTMLElement = win.HTMLElement;
    // @ts-ignore
    globalThis.URLSearchParams = win.URLSearchParams;
    // @ts-ignore
    globalThis.DOMParser = win.DOMParser;
    // @ts-ignore
    globalThis.ShadowRoot = win.ShadowRoot;
    // @ts-ignore
    globalThis.Node = win.Node;
    // @ts-ignore
    globalThis.Element = win.Element;
    // @ts-ignore
    globalThis.DocumentFragment = win.DocumentFragment;
    // @ts-ignore
    globalThis.Document = win.Document;
    // @ts-ignore
    globalThis.CSSStyleSheet = win.CSSStyleSheet;

    // 确保 MutationObserver 在 window 和 globalThis 上都可用
    // @ts-ignore
    win.MutationObserver = globalThis.MutationObserver;

    // 确保 SyntaxError 可用（happy-dom 需要）
    // @ts-ignore
    globalThis.SyntaxError = win.SyntaxError || SyntaxError;

    // 关键：确保 globalThis.customElements 指向 happy-dom 的 customElements
    // 这样 document.createElement() 才能正确创建自定义元素实例
    // @ts-ignore
    globalThis.customElements = win.customElements;

    // 创建 host 元素
    // @ts-ignore
    const host = document.createElement("div") as HTMLElement;
    // @ts-ignore
    document.body.appendChild(host);
    return { host, win };
}

/**
 * 获取路由匹配的 hash 值（使用事件监听）
 * @param collector - 路由事件收集器实例
 * @returns 当前路由的 hash 值
 */
export function getRouteHashFromCollector(collector: RouteEventCollector): string {
    const hash = collector.toRouteHash;
    return hash || "";
}

/**
 * 获取路由匹配的 hash 值（使用私有 API，已弃用）
 * @deprecated 请使用 getRouteHashFromCollector 或 RouteEventCollector.toRouteHash
 * @param router - KylinRouter 实例
 * @returns 当前路由的 hash 值
 */
export function getRouteHash(router: KylinRouter): string {
    // @ts-ignore
    const matchedRoutes = router._matchRoute(router.location.pathname, router.location.search);
    if (matchedRoutes.toRoute && matchedRoutes.toRoute.length > 0) {
        return matchedRoutes.toRoute[matchedRoutes.toRoute.length - 1].hash;
    }
    return "";
}

/**
 * 验证元素在 kylin-outlet 内
 * @param host - 宿主元素
 * @param selector - 要查找的元素选择器
 * @returns 是否找到在 outlet 内的元素
 */
export function findElementInOutlet(host: HTMLElement, selector: string): Element | null {
    const outlet = host.querySelector("kylin-outlet");
    if (!outlet) return null;
    return outlet.querySelector(selector);
}

/**
 * 验证视图容器存在（查找 kylin-slot）
 * @param host - 宿主元素
 * @param hash - kylin-slot 的 id（即路由 hash）
 * @returns kylin-slot 元素或 null
 */
export function findViewContainer(host: HTMLElement, hash: string): Element | null {
    const outlet = host.querySelector("kylin-outlet");
    if (!outlet) return null;
    return outlet.querySelector(`kylin-slot[id="${hash}"]`);
}

/**
 * 验证渲染结构（使用事件监听）
 * @param host - 宿主元素
 * @param collector - 路由事件收集器实例
 * @param contentSelector - 渲染内容的选择器
 * @returns 验证结果
 */
export function validateRenderStructure(
    host: HTMLElement,
    collector: RouteEventCollector,
    contentSelector: string,
): {
    outletExists: boolean;
    contentInOutlet: boolean;
    viewContainerExists: boolean;
    hash: string;
} {
    const outlet = host.querySelector("kylin-outlet");
    const hash = getRouteHashFromCollector(collector);
    const contentInOutlet = findElementInOutlet(host, contentSelector);
    const viewContainer = hash ? findViewContainer(host, hash) : null;

    return {
        outletExists: !!outlet,
        contentInOutlet: !!contentInOutlet,
        viewContainerExists: !!viewContainer,
        hash,
    };
}

/**
 * 便捷的断言函数：验证渲染内容在 kylin-outlet 内且视图容器存在
 * @param host - 宿主元素
 * @param router - KylinRouter 实例
 * @param contentSelector - 渲染内容的选择器
 * @param textContent - 可选，验证渲染内容的文本
 */
export function assertRenderInOutlet(
    host: HTMLElement,
    router: any,
    contentSelector: string,
    textContent?: string,
): void {
    // 验证 kylin-outlet 存在
    const outlet = host.querySelector("kylin-outlet");
    if (!outlet) {
        throw new Error("kylin-outlet 不存在");
    }

    // 验证渲染内容在 kylin-outlet 内
    const contentElement = findElementInOutlet(host, contentSelector);
    if (!contentElement) {
        throw new Error(`在 kylin-outlet 内未找到元素: ${contentSelector}`);
    }

    // 验证文本内容（如果提供）
    if (textContent !== undefined) {
        const actualText = contentElement.textContent;
        if (actualText !== textContent) {
            throw new Error(`文本内容不匹配。期望: "${textContent}", 实际: "${actualText}"`);
        }
    }

    // 验证视图容器存在（根据 router.routes.current）
    const currentRoutes = router.routes.current;
    if (!currentRoutes || currentRoutes.length === 0) {
        throw new Error("当前路由不存在");
    }

    const routeHash = currentRoutes[currentRoutes.length - 1].hash;
    if (!routeHash) {
        throw new Error("无法获取路由 hash");
    }

    const viewContainer = findViewContainer(host, routeHash);
    if (!viewContainer) {
        throw new Error(`视图容器不存在: hash=${routeHash}`);
    }

    // 验证视图容器是 kylin-slot 元素
    if (viewContainer.tagName.toLowerCase() !== "kylin-slot") {
        throw new Error(`视图容器不是 kylin-slot 元素: ${viewContainer.tagName}`);
    }
}

/**
 * 等待渲染完成并返回事件收集器
 * @param router - KylinRouter 实例
 * @param timeout - 超时时间（毫秒），默认 5000
 * @returns 路由事件收集器实例
 */
export async function waitForRender(
    router: KylinRouter,
    timeout: number = 5000,
): Promise<RouteEventCollector> {
    const collector = new RouteEventCollector(router);

    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            collector.dispose();
            reject(new Error(`等待渲染超时: ${timeout}ms`));
        }, timeout);

        // 监听渲染完成事件
        const unsubscribe = router.on("render:after", () => {
            clearTimeout(timer);
            unsubscribe();
            resolve(collector);
        });
    });
}

/**
 * 等待导航匹配完成
 * @param router - KylinRouter 实例
 * @param timeout - 超时时间（毫秒），默认 1000
 * @returns 路由事件收集器实例
 */
export async function waitForNavigationMatched(
    router: KylinRouter,
    timeout: number = 1000,
): Promise<RouteEventCollector> {
    const collector = new RouteEventCollector(router);

    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            collector.dispose();
            reject(new Error(`等待导航匹配超时: ${timeout}ms`));
        }, timeout);

        // 监听导航匹配事件
        const unsubscribe = router.on("navigation:matched", () => {
            clearTimeout(timer);
            unsubscribe();
            resolve(collector);
        });
    });
}

/**
 * 断言导航模式
 * @param collector - 路由事件收集器实例
 * @param expectedMode - 期望的导航模式
 */
export function assertNavigationMode(
    collector: RouteEventCollector,
    expectedMode: "push" | "replace" | "pop",
): void {
    const actualMode = collector.navigationMode;
    if (actualMode !== expectedMode) {
        throw new Error(`导航模式不匹配。期望: "${expectedMode}", 实际: "${actualMode}"`);
    }
}

/**
 * 断言路由切换（源路由和目标路由的 hash）
 * @param collector - 路由事件收集器实例
 * @param fromHash - 期望的源路由 hash（可选）
 * @param toHash - 期望的目标路由 hash
 */
export function assertRouteTransition(
    collector: RouteEventCollector,
    toHash: string,
    fromHash?: string,
): void {
    const actualToHash = collector.toRouteHash;
    if (actualToHash !== toHash) {
        throw new Error(`目标路由 hash 不匹配。期望: "${toHash}", 实际: "${actualToHash}"`);
    }

    if (fromHash !== undefined) {
        const actualFromHash = collector.fromRouteHash;
        if (actualFromHash !== fromHash) {
            throw new Error(`源路由 hash 不匹配。期望: "${fromHash}", 实际: "${actualFromHash}"`);
        }
    }
}

/**
 * 断言渲染没有错误
 * @param collector - 路由事件收集器实例
 */
export function assertNoRenderError(collector: RouteEventCollector): void {
    if (collector.hasRenderError) {
        const error = collector.renderError;
        throw new Error(`渲染发生错误: ${error?.message || "未知错误"}`);
    }
}

/**
 * 断言渲染发生错误
 * @param collector - 路由事件收集器实例
 * @param expectedErrorMessage - 期望的错误消息（可选）
 */
export function assertRenderError(
    collector: RouteEventCollector,
    expectedErrorMessage?: string,
): void {
    if (!collector.hasRenderError) {
        throw new Error("期望渲染发生错误，但渲染成功");
    }

    if (expectedErrorMessage !== undefined) {
        const actualError = collector.renderError;
        if (!actualError?.message.includes(expectedErrorMessage)) {
            throw new Error(
                `错误消息不匹配。期望包含: "${expectedErrorMessage}", 实际: "${actualError?.message}"`,
            );
        }
    }
}

/**
 * 动态导入 KylinRouter
 */
export async function createRouter(host: HTMLElement, win: any, options: any) {
    // Mock really-relaxed-json 导入以解决模块解析问题
    // @ts-ignore
    const moduleCache = require.cache;
    if (moduleCache) {
        const mockPath = require.resolve("really-relaxed-json");
        if (moduleCache[mockPath]) {
            moduleCache[mockPath].exports = {
                createParser: () => ({ stringToJson: (str: string) => JSON.parse(str) }),
                createParserFactory: () => ({
                    createParser: () => ({ stringToJson: (str: string) => JSON.parse(str) }),
                }),
                parse: JSON.parse,
                PrettyPrinter: {},
                Options: {},
            };
        }
    }

    // 先导入组件以确保自定义元素被注册
    const componentsModule = await import("@/components");
    const { KylinSlot } = await import("@/components/Slot");

    // 确保 happy-dom 的 customElements 有正确的注册
    // 重新注册所有自定义元素到 win.customElements
    const { KylinOutlet, KylinLink, KylinLoading, KylinFeedback, KylinViewMeta } = componentsModule;

    // 手动注册到 happy-dom 的 customElements（如果尚未注册）
    if (!win.customElements.get("kylin-outlet") && KylinOutlet) {
        win.customElements.define("kylin-outlet", KylinOutlet);
    }
    if (!win.customElements.get("kylin-link") && KylinLink) {
        win.customElements.define("kylin-link", KylinLink);
    }
    if (!win.customElements.get("kylin-loading") && KylinLoading) {
        win.customElements.define("kylin-loading", KylinLoading);
    }
    if (!win.customElements.get("kylin-feedback") && KylinFeedback) {
        win.customElements.define("kylin-feedback", KylinFeedback);
    }
    if (!win.customElements.get("kylin-view-meta") && KylinViewMeta) {
        win.customElements.define("kylin-view-meta", KylinViewMeta);
    }
    if (!win.customElements.get("kylin-slot") && KylinSlot) {
        win.customElements.define("kylin-slot", KylinSlot);
    }

    const { KylinRouter } = await import("@/router");
    const router = new KylinRouter(host, options);

    // 等待 router 真正 attached 完成
    // attach() 是异步的，需要等待 routes:attached 事件
    // 注意：routes:attached 在 home() 之前触发，所以需要等待 navigation:end
    return new Promise<KylinRouter>((resolve, reject) => {
        let routesAttached = false;
        let navigationCompleted = false;

        // 设置超时保护
        const timeout = setTimeout(() => {
            if (!routesAttached) {
                reject(new Error("Router attach timeout - routes:attached event not fired"));
            } else if (!navigationCompleted) {
                reject(new Error("Router initial navigation timeout - navigation:end event not fired"));
            }
        }, 5000);

        // 监听 attached 事件
        // @ts-ignore
        router.on("routes:attached", () => {
            routesAttached = true;

            // 检查是否已经在导航中
            if (router.isNavigating) {
                // 等待导航完成
                router.isStopNavigating().then(() => {
                    clearTimeout(timeout);
                    navigationCompleted = true;
                    resolve(router);
                }).catch((error: Error) => {
                    clearTimeout(timeout);
                    reject(error);
                });
            } else {
                // 如果没有在导航中，可能已经完成或还未开始
                // 等待一小段时间确保导航完成
                setTimeout(() => {
                    clearTimeout(timeout);
                    resolve(router);
                }, 100);
            }
        });

        // 监听导航结束事件（fallback）
        // @ts-ignore
        router.on("navigation:end", () => {
            if (routesAttached && !navigationCompleted) {
                clearTimeout(timeout);
                navigationCompleted = true;
                resolve(router);
            }
        });
    });
}
