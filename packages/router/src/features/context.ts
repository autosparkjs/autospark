/**
 * 为路由根元素下的所有outlet提供路由实例
 * 通过context传递路由实例，避免prop drilling
 * 组件树中的outlet可以通过context获取路由实例，访问路由状态和方法
 * 这种设计使得路由状态在组件树中更易于访问和管理
 * 同时也保持了组件的独立性和可复用性
 */

import type { KylinRouter } from "@/router";

export class Context {
    private _onContextRequest?: (this: KylinRouter, event: Event) => void;
    /**
     * 监听 context-request 事件，提供 router 实例
     * 基于 @lit/context 的 ContextProvider 原理实现
     */
    protected attachContextProvider(this: KylinRouter) {
        this._onContextRequest = this.onContextRequest.bind(this);
        this.host.addEventListener("context-request", this._onContextRequest);
    }

    protected removeContextProvider(this: KylinRouter) {
        if (this._onContextRequest) {
            this.host.removeEventListener("context-request", this._onContextRequest);
        }
    }
    /**
     * 处理 context-request 事件
     * 当请求的 context 匹配 routerContext 时，提供当前 router 实例
     */
    protected onContextRequest(this: KylinRouter, event: Event): void {
        const contextRequestEvent = (event as any).detail as unknown as {
            context: "KylinRouter";
            callback: (value: KylinRouter) => void;
            contextTarget?: Element;
            stopPropagation: () => void;
        };
        if (contextRequestEvent.context === "KylinRouter") {
            event.stopPropagation();
            // 提供 router 实例
            contextRequestEvent.callback(this);
        }
    }
}
