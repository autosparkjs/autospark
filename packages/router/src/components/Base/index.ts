import type { AutoSparkRouter } from "@/router";
import { triggerEvent } from "@/utils/triggerEvent";

/**
 * Context 回调函数类型
 */
type ContextCallback<ValueType> = (value: ValueType, unsubscribe?: () => void) => void;

/**
 * AutoSparkRouter 组件基类（原生 Web Components 版本）
 *
 * - 为所有继承此基类的组件提供获取 router 实例的能力
 * - 不依赖 LitElement，使用原生 Web Components API
 * - 使用 Light DOM 模式，子类直接操作 DOM
 *
 * 使用示例：
 * - 继承此类即可自动获取 router 实例
 * - 在 connectedCallback 或其他方法中通过 this.router 访问路由
 *
 * 注意：这是抽象基类，不需要注册为自定义元素
 */
export class AutoSparkRouterElementBase extends HTMLElement {
    /**
     * Router 实例引用，由 AutoSparkRouter 通过 context 提供
     */
    router?: AutoSparkRouter;

    /**
     * 是否已经分发过 context-request 事件
     */
    private _contextRequested = false;

    connectedCallback() {
        // 在组件连接到 DOM 后请求 context
        if (!this._contextRequested) {
            // 优先尝试同步获取 router 实例
            const syncRouter = this._getRouterSync();
            if (syncRouter) {
                this.router = syncRouter;
                this.onRouterReady();
            } else {
                // 同步获取失败，使用异步方式
                this.getRouter();
            }
            this._contextRequested = true;
        }
    }

    disconnectedCallback() {
        // 清理逻辑（子类可重写）
    }

    /**
     * 子类可重写的方法：router 就绪时的处理
     * 当同步获取到 router 实例时调用
     */
    protected onRouterReady() {
        // 子类可重写此方法进行初始化操作
    }

    /**
     * 同步获取 router 实例
     * 向上遍历 DOM 树，按优先级查找：
     * 1. 具有 data-autospark-router 属性的元素（router 宿主元素）
     * 2. 具有 router 实例的 AutoSparkRouterElementBase 祖先元素
     *
     * @returns router 实例或 undefined
     */
    private _getRouterSync(): AutoSparkRouter | undefined {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        let currentElement: Element | null = this;
        const walk: string[] = [];

        while (currentElement) {
            // 记录遍历路径用于调试
            walk.push(
                currentElement instanceof HTMLElement
                    ? `${currentElement.tagName.toLowerCase()}${currentElement.id ? "#" + currentElement.id : ""}${currentElement.className ? "." + currentElement.className : ""}`
                    : currentElement.tagName,
            );

            // 优先查找 router 宿主元素（data-autospark-router 属性）
            if (
                currentElement instanceof HTMLElement &&
                currentElement.hasAttribute("data-autospark-router")
            ) {
                return (currentElement as any).router;
            }
            // 检查是否是 AutoSparkRouterElementBase 且具有有效的 router 实例
            if (currentElement instanceof AutoSparkRouterElementBase && currentElement.router) {
                return currentElement.router;
            }
            currentElement = currentElement.parentElement;
        }
        return undefined;
    }

    /**
     * 分发 context-request 事件来请求 router 实例
     * 与 src/features/context.ts 的 onContextRequest 逻辑匹配
     */
    protected getRouter(callback: ContextCallback<AutoSparkRouter> = this._contextCallback) {
        if (this.router) {
            // 已经有 router 实例，直接调用回调
            callback(this.router);
            return;
        }
        // 使用 ContextRequestEvent 确保事件格式与 onContextRequest 期望的一致
        triggerEvent(this, "context-request", {
            context: "AutoSparkRouter",
            contextTarget: this,
            callback: (router: AutoSparkRouter) => {
                this.router = router;
                callback(router);
            },
        });
    }

    /**
     * Context 回调函数，当 AutoSparkRouter 响应 context-request 时被调用
     *
     * @param router - AutoSparkRouter 实例
     * @param unsubscribe - 取消订阅函数
     */
    private _contextCallback: ContextCallback<AutoSparkRouter> = (router: AutoSparkRouter) => {
        // 保存 router 实例
        this.router = router;
        // 触发 router 就绪回调
        this.onRouterReady();
    };
}
