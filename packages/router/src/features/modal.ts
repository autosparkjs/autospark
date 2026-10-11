/**
 * Modal 特性 - 模态路由系统
 *
 * 提供模态窗口管理功能，支持：
 * - 模态容器和模态栈管理
 * - 背景遮罩控制
 * - 多种模态类型（dialog/drawer）和位置
 * - 自动关闭功能
 * - ESC 键和点击遮罩关闭
 * - 与普通路由共存（不改变 URL）
 *
 * @module features/modal
 */

import type { KylinRouter } from "@/router";
import type {
    KylinRouteItem,
    ModalConfig,
    ModalState,
    ModalStackItem,
    ModalOptions,
} from "@/types";

/**
 * Modal Mixin 类 - 负责模态窗口的所有功能
 *
 * 注意：此 Mixin 依赖以下在 KylinRouter 中定义的属性：
 * - modalContainer: HTMLElement | null
 * - modalState: ModalState
 * - maxModals: number
 */
export class Modal {
    // =========================================================================
    // 公共 API - 这些方法暴露给 KylinRouter 用户
    // =========================================================================

    /**
     * 打开模态
     * @param options - 模态选项
     */
    async openModal(this: KylinRouter, options: ModalOptions): Promise<void> {
        const modalState = this.modalState as ModalState;
        const maxModals = this.maxModals as number;

        // 解析路由配置
        const route = (this as any)._resolveModalRoute(options);
        if (!route) {
            throw new Error("Invalid modal route");
        }

        // 检查模态配置
        const modalConfig = (this as any)._getModalConfig(route);
        if (!modalConfig) {
            throw new Error("Route is not configured as modal");
        }

        // 检查模态栈限制
        if (modalState.stack.length >= maxModals) {
            console.warn("Maximum modal stack depth reached");
            return;
        }

        // 创建模态元素
        const modalElement = await (this as any)._createModalElement(route);

        // 创建背景遮罩
        let backdropElement: HTMLElement | undefined;
        if (modalConfig.backdrop !== false) {
            backdropElement = (this as any)._createBackdrop(modalConfig);
        }

        // 添加到模态栈
        const stackItem: ModalStackItem = {
            route,
            element: modalElement,
            backdrop: backdropElement,
            timestamp: Date.now(),
        };
        modalState.stack.push(stackItem);
        modalState.current = stackItem;

        // 渲染模态内容
        await (this as any)._renderModal(stackItem);

        // 触发事件
        this.emit("modal/open", {
            route,
            stackItem,
        });

        // 自动关闭功能
        if (modalConfig.autoClose && modalConfig.autoClose > 0) {
            setTimeout(() => {
                // 检查模态是否仍然是顶层模态
                if (modalState.current === stackItem) {
                    (this as any)._closeTopModal();
                }
            }, modalConfig.autoClose);
        }

        // 更新 URL（不影响主页面的历史记录）
        (this as any)._updateModalURL(route);
    }

    /**
     * 关闭模态
     * @param route - 可选，指定要关闭的模态路由
     */
    async closeModal(this: KylinRouter, route?: KylinRouteItem | string): Promise<void> {
        const modalState = (this as any).modalState as ModalState;

        if (route) {
            // 关闭指定模态
            let targetRoute: KylinRouteItem | null;
            if (typeof route === "string") {
                // 通过路径查找路由
                const matched = this.routes.match(route);
                targetRoute = matched?.route || null;
            } else {
                targetRoute = route;
            }

            if (!targetRoute) return;

            const index = modalState.stack.findIndex((item) => item.route === targetRoute);
            if (index !== -1) {
                // 关闭该模态及上面的所有模态
                while (modalState.stack.length > index) {
                    await (this as any)._closeTopModal();
                }
            }
        } else {
            // 关闭顶层模态
            await (this as any)._closeTopModal();
        }
    }

    /**
     * 关闭所有模态
     */
    async closeAllModals(this: KylinRouter): Promise<void> {
        while ((this as any).modalState.stack.length > 0) {
            await (this as any)._closeTopModal();
        }
    }

    /**
     * 检查是否有打开的模态
     */
    get hasOpenModals(): boolean {
        return (this as any).modalState.stack.length > 0;
    }

    /**
     * 获取当前打开的模态数量
     */
    get modalCount(): number {
        return (this as any).modalState.stack.length;
    }

    /**
     * 获取当前活动的模态
     */
    get currentModal(): ModalStackItem | null {
        return (this as any).modalState.current;
    }

    // =========================================================================
    // 内部方法 - 使用 _ 前缀标识私有方法
    // =========================================================================

    /**
     * 初始化模态系统
     * 在路由器 attach 时调用
     */
    _initModals(this: KylinRouter): void {
        this._createModalContainer();
        this._setupModalEventListeners();
        this._injectModalStyles();
    }
    /**
     * 注入模态样式
     * 添加模态容器和背景遮罩的默认样式
     */
    protected injectModalStyles(): void {
        // 检查是否已注入样式
        if (document.querySelector("#kylin-modal-styles")) {
            return;
        }

        const style = document.createElement("style");
        style.id = "kylin-modal-styles";
        style.textContent = `
            .kylin-modals {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 9999;
                pointer-events: none;
            }
            .kylin-modal-backdrop {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                pointer-events: auto;
            }
            .kylin-modal-content {
                position: relative;
                pointer-events: auto;
                z-index: 1;
                background: white;
                padding: 20px;
                border-radius: 4px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            }
            /* Drawer 样式 */
            .kylin-modal-drawer {
                background: white;
                box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
            }
            .kylin-modal-drawer.kylin-modal-left {
                box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
            }
            .kylin-modal-drawer.kylin-modal-top {
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            }
            .kylin-modal-drawer.kylin-modal-bottom {
                box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
            }
            /* 默认内容样式 */
            .kylin-modal-content .custom-modal-content {
                padding: 0;
            }
        `;
        document.head.appendChild(style);
    }
    /**
     * 创建模态容器
     * 如果容器不存在则创建，并返回容器元素
     */
    _createModalContainer(this: KylinRouter): HTMLElement {
        let container = this.host.querySelector(".kylin-modals") as HTMLElement;
        if (!container) {
            container = document.createElement("div");
            container.className = "kylin-modals";
            this.host.appendChild(container);
        }
        (this as any).modalContainer = container;
        return container;
    }

    /**
     * 设置模态事件监听
     * 监听 ESC 键关闭模态
     */
    _setupModalEventListeners(this: KylinRouter): void {
        // ESC 键关闭模态
        document.addEventListener("keydown", (e) => {
            const modalState = (this as any).modalState as ModalState;
            if (e.key === "Escape" && modalState.current) {
                const config = (this as any)._getModalConfig(modalState.current.route);
                if (config?.closeOnEsc !== false) {
                    (this as any)._closeTopModal();
                }
            }
        });
    }

    /**
     * 获取模态配置
     * 从路由配置中提取模态配置
     */
    _getModalConfig(this: KylinRouter, route: KylinRouteItem): ModalConfig | null {
        if (typeof route.modal === "boolean") {
            return route.modal ? {} : null;
        }
        return route.modal || null;
    }

    /**
     * 注入模态样式
     * 添加模态容器和背景遮罩的默认样式，包含动画效果
     */
    _injectModalStyles(this: KylinRouter): void {
        // 检查是否已注入样式
        if (document.querySelector("#kylin-modal-styles")) {
            return;
        }

        const style = document.createElement("style");
        style.id = "kylin-modal-styles";
        style.textContent = `
            /* ==================== 模态容器 ==================== */
            .kylin-modals {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 9999;
                pointer-events: none;
            }

            /* ==================== 背景遮罩 ==================== */
            .kylin-modal-backdrop {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                pointer-events: auto;
                animation: kylin-fade-in 0.2s ease-out;
            }

            .kylin-modal-backdrop.closing {
                animation: kylin-fade-out 0.2s ease-in forwards;
            }

            /* ==================== 模态内容基础样式 ==================== */
            .kylin-modal-content {
                position: fixed;
                pointer-events: auto;
                z-index: 10000;
                background: white;
                padding: 20px;
                border-radius: 4px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            }

            /* ==================== Dialog 样式和动画 ==================== */
            .kylin-modal-dialog {
                max-width: 600px;
                max-height: 80vh;
                overflow: auto;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
            }

            /* 居中对话框 */
            .kylin-modal-dialog.kylin-modal-center {
                animation: kylin-dialog-center-in 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .kylin-modal-dialog.kylin-modal-center.closing {
                animation: kylin-dialog-center-out 0.2s ease-in forwards;
            }

            /* 顶部对话框 */
            .kylin-modal-dialog.kylin-modal-top {
                top: 0;
                left: 50%;
                transform: translateX(-50%);
                animation: kylin-dialog-top-in 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .kylin-modal-dialog.kylin-modal-top.closing {
                animation: kylin-dialog-top-out 0.2s ease-in forwards;
            }

            /* 左上对话框 */
            .kylin-modal-dialog.kylin-modal-top-left {
                top: 0;
                left: 0;
                animation: kylin-dialog-top-left-in 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .kylin-modal-dialog.kylin-modal-top-left.closing {
                animation: kylin-dialog-top-left-out 0.2s ease-in forwards;
            }

            /* 右上对话框 */
            .kylin-modal-dialog.kylin-modal-top-right {
                top: 0;
                right: 0;
                animation: kylin-dialog-top-right-in 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .kylin-modal-dialog.kylin-modal-top-right.closing {
                animation: kylin-dialog-top-right-out 0.2s ease-in forwards;
            }

            /* 右侧对话框 */
            .kylin-modal-dialog.kylin-modal-right {
                top: 50%;
                right: 0;
                animation: kylin-dialog-right-in 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .kylin-modal-dialog.kylin-modal-right.closing {
                animation: kylin-dialog-right-out 0.2s ease-in forwards;
            }

            /* 右下对话框 */
            .kylin-modal-dialog.kylin-modal-bottom-right {
                bottom: 0;
                right: 0;
                animation: kylin-dialog-bottom-right-in 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .kylin-modal-dialog.kylin-modal-bottom-right.closing {
                animation: kylin-dialog-bottom-right-out 0.2s ease-in forwards;
            }

            /* 底部对话框 */
            .kylin-modal-dialog.kylin-modal-bottom {
                bottom: 0;
                left: 50%;
                transform: translateX(-50%);
                animation: kylin-dialog-bottom-in 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .kylin-modal-dialog.kylin-modal-bottom.closing {
                animation: kylin-dialog-bottom-out 0.2s ease-in forwards;
            }

            /* 左下对话框 */
            .kylin-modal-dialog.kylin-modal-bottom-left {
                bottom: 0;
                left: 0;
                animation: kylin-dialog-bottom-left-in 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .kylin-modal-dialog.kylin-modal-bottom-left.closing {
                animation: kylin-dialog-bottom-left-out 0.2s ease-in forwards;
            }

            /* 左侧对话框 */
            .kylin-modal-dialog.kylin-modal-left {
                top: 50%;
                left: 0;
                animation: kylin-dialog-left-in 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .kylin-modal-dialog.kylin-modal-left.closing {
                animation: kylin-dialog-left-out 0.2s ease-in forwards;
            }

            /* ==================== Drawer 样式和动画 ==================== */
            .kylin-modal-drawer {
                background: white;
                max-height: 100vh;
                overflow: auto;
            }

            /* 左侧抽屉 - 水平滑动，固定高度 */
            .kylin-modal-drawer.kylin-modal-left {
                width: 300px;
                top: 0;
                left: 0;
                height: 100vh;
                animation: kylin-slide-in-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .kylin-modal-drawer.kylin-modal-left.closing {
                animation: kylin-slide-out-left 0.2s ease-in forwards;
            }

            /* 右侧抽屉 - 水平滑动，固定高度 */
            .kylin-modal-drawer.kylin-modal-right {
                width: 300px;
                top: 0;
                right: 0;
                height: 100vh;
                animation: kylin-slide-in-right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .kylin-modal-drawer.kylin-modal-right.closing {
                animation: kylin-slide-out-right 0.2s ease-in forwards;
            }

            /* 顶部抽屉 - 从顶部滑入，满宽 */
            .kylin-modal-drawer.kylin-modal-top {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                width: 100vw;
                max-width: 100vw;
                height: 300px;
                box-sizing: border-box;
                padding: 0;
                border-radius: 0;
                animation: kylin-slide-in-top 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
            }

            /* 顶部抽屉内容满宽 */
            .kylin-modal-drawer.kylin-modal-top .custom-modal-content {
                max-width: none;
                width: auto;
            }

            .kylin-modal-drawer.kylin-modal-top.closing {
                animation: kylin-slide-out-top 0.2s ease-in forwards;
            }

            /* 底部抽屉 - 从底部滑入，满宽 */
            .kylin-modal-drawer.kylin-modal-bottom {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                width: 100vw;
                max-width: 100vw;
                height: 300px;
                box-sizing: border-box;
                padding: 0;
                border-radius: 0;
                animation: kylin-slide-in-bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
            }

            /* 底部抽屉内容满宽 */
            .kylin-modal-drawer.kylin-modal-bottom .custom-modal-content {
                max-width: none;
                width: auto;
            }

            .kylin-modal-drawer.kylin-modal-bottom.closing {
                animation: kylin-slide-out-bottom 0.2s ease-in forwards;
            }

            /* ==================== 动画关键帧 ==================== */
            /* 淡入/淡出 */
            @keyframes kylin-fade-in {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            @keyframes kylin-fade-out {
                from { opacity: 1; }
                to { opacity: 0; }
            }

            /* 对话框动画 */
            @keyframes kylin-dialog-center-in {
                from {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(0.9);
                }
                to {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1);
                }
            }

            @keyframes kylin-dialog-center-out {
                from {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1);
                }
                to {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(0.9);
                }
            }

            @keyframes kylin-dialog-top-in {
                from {
                    opacity: 0;
                    transform: translate(-50%, -20px);
                }
                to {
                    opacity: 1;
                    transform: translate(-50%, 0);
                }
            }

            @keyframes kylin-dialog-top-out {
                from {
                    opacity: 1;
                    transform: translate(-50%, 0);
                }
                to {
                    opacity: 0;
                    transform: translate(-50%, -20px);
                }
            }

            @keyframes kylin-dialog-top-left-in {
                from {
                    opacity: 0;
                    transform: translate(-20px, -20px);
                }
                to {
                    opacity: 1;
                    transform: translate(0, 0);
                }
            }

            @keyframes kylin-dialog-top-left-out {
                from {
                    opacity: 1;
                    transform: translate(0, 0);
                }
                to {
                    opacity: 0;
                    transform: translate(-20px, -20px);
                }
            }

            @keyframes kylin-dialog-top-right-in {
                from {
                    opacity: 0;
                    transform: translate(20px, -20px);
                }
                to {
                    opacity: 1;
                    transform: translate(0, 0);
                }
            }

            @keyframes kylin-dialog-top-right-out {
                from {
                    opacity: 1;
                    transform: translate(0, 0);
                }
                to {
                    opacity: 0;
                    transform: translate(20px, -20px);
                }
            }

            @keyframes kylin-dialog-right-in {
                from {
                    opacity: 0;
                    transform: translate(20px, -50%);
                }
                to {
                    opacity: 1;
                    transform: translate(0, -50%);
                }
            }

            @keyframes kylin-dialog-right-out {
                from {
                    opacity: 1;
                    transform: translate(0, -50%);
                }
                to {
                    opacity: 0;
                    transform: translate(20px, -50%);
                }
            }

            @keyframes kylin-dialog-bottom-right-in {
                from {
                    opacity: 0;
                    transform: translate(20px, 20px);
                }
                to {
                    opacity: 1;
                    transform: translate(0, 0);
                }
            }

            @keyframes kylin-dialog-bottom-right-out {
                from {
                    opacity: 1;
                    transform: translate(0, 0);
                }
                to {
                    opacity: 0;
                    transform: translate(20px, 20px);
                }
            }

            @keyframes kylin-dialog-bottom-in {
                from {
                    opacity: 0;
                    transform: translate(-50%, 20px);
                }
                to {
                    opacity: 1;
                    transform: translate(-50%, 0);
                }
            }

            @keyframes kylin-dialog-bottom-out {
                from {
                    opacity: 1;
                    transform: translate(-50%, 0);
                }
                to {
                    opacity: 0;
                    transform: translate(-50%, 20px);
                }
            }

            @keyframes kylin-dialog-bottom-left-in {
                from {
                    opacity: 0;
                    transform: translate(-20px, 20px);
                }
                to {
                    opacity: 1;
                    transform: translate(0, 0);
                }
            }

            @keyframes kylin-dialog-bottom-left-out {
                from {
                    opacity: 1;
                    transform: translate(0, 0);
                }
                to {
                    opacity: 0;
                    transform: translate(-20px, 20px);
                }
            }

            @keyframes kylin-dialog-left-in {
                from {
                    opacity: 0;
                    transform: translate(-20px, -50%);
                }
                to {
                    opacity: 1;
                    transform: translate(0, -50%);
                }
            }

            @keyframes kylin-dialog-left-out {
                from {
                    opacity: 1;
                    transform: translate(0, -50%);
                }
                to {
                    opacity: 0;
                    transform: translate(-20px, -50%);
                }
            }

            /* 抽屉动画 */
            @keyframes kylin-slide-in-left {
                from { transform: translateX(-100%); }
                to { transform: translateX(0); }
            }

            @keyframes kylin-slide-out-left {
                from { transform: translateX(0); }
                to { transform: translateX(-100%); }
            }

            @keyframes kylin-slide-in-right {
                from { transform: translateX(100%); }
                to { transform: translateX(0); }
            }

            @keyframes kylin-slide-out-right {
                from { transform: translateX(0); }
                to { transform: translateX(100%); }
            }

            @keyframes kylin-slide-in-top {
                from {
                    transform: translateY(-100%);
                }
                to {
                    transform: translateY(0);
                }
            }

            @keyframes kylin-slide-out-top {
                from {
                    transform: translateY(0);
                }
                to {
                    transform: translateY(-100%);
                }
            }

            @keyframes kylin-slide-in-bottom {
                from {
                    transform: translateY(100%);
                }
                to {
                    transform: translateY(0);
                }
            }

            @keyframes kylin-slide-out-bottom {
                from {
                    transform: translateY(0);
                }
                to {
                    transform: translateY(100%);
                }
            }

            /* ==================== 自定义内容样式 ==================== */
            .kylin-modal-content .custom-modal-content {
                padding: 0;
            }

            /* ==================== 无动画支持 ==================== */
            .kylin-modal-content.no-animation,
            .kylin-modal-backdrop.no-animation {
                animation: none !important;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * 关闭顶层模态
     */
    _closeTopModal(this: KylinRouter): Promise<void> {
        const modalState = (this as any).modalState as ModalState;

        if (modalState.stack.length === 0) {
            return Promise.resolve();
        }

        const stackItem = modalState.stack.pop();
        if (!stackItem) return Promise.resolve();

        // 添加关闭动画类
        stackItem.element.classList.add("closing");
        if (stackItem.backdrop) {
            stackItem.backdrop.classList.add("closing");
        }

        // 等待动画完成（0.2秒）
        return new Promise<void>((resolve) => {
            setTimeout(() => {
                // 移除模态元素和遮罩
                stackItem.element.remove();
                stackItem.backdrop?.remove();

                // 更新当前模态
                modalState.current = modalState.stack[modalState.stack.length - 1] || null;

                // 触发事件
                this.emit("modal/close", {
                    route: stackItem.route,
                    stackItem,
                });

                // 恢复 URL
                (this as any)._restoreModalURL();

                resolve();
            }, 200);
        });
    }

    /**
     * 创建模态元素
     */
    protected _createModalElement(this: KylinRouter, route: KylinRouteItem): Promise<HTMLElement> {
        const element = document.createElement("div");
        element.className = "kylin-modal-content";

        // 加载组件
        if (route.view) {
            // 处理不同类型的 view
            if (typeof route.view === "string") {
                // 字符串类型：可能是 URL 或元素名
                const loadResult = (this as any).viewLoader.loadView(
                    route.view,
                    (route as any).remoteOptions,
                );

                return loadResult.then(async (result: any) => {
                    if (result.success && result.content) {
                        // 使用 Render mixin 的 renderToOutlet 方法
                        await this.renderToOutlet(result, element, {
                            mode: "replace",
                        });
                    }
                    return element;
                });
            } else {
                // HTMLElement 类型（包括 HTMLTemplateElement）
                const viewElement = route.view as HTMLElement;

                // 检查是否为 template 元素
                if (viewElement.tagName === "TEMPLATE") {
                    // HTMLTemplateElement 类型：克隆模板内容并附加
                    const templateElement = viewElement as HTMLTemplateElement;
                    const clone = templateElement.content.cloneNode(true);
                    element.appendChild(clone);
                } else {
                    // 普通 HTMLElement：直接附加到模态元素
                    element.appendChild(viewElement);
                }
            }
        }

        return Promise.resolve(element);
    }

    /**
     * 创建模态容器（D-17）
     * 如果容器不存在则创建，并返回容器元素
     */
    private createModalContainer(this: KylinRouter): HTMLElement {
        let container = this.host.querySelector(".kylin-modals") as HTMLElement;
        if (!container) {
            container = document.createElement("div");
            container.className = "kylin-modals";
            this.host.appendChild(container);
        }
        this.modalContainer = container;
        return container;
    }

    /**
     * 设置模态事件监听
     * 监听 ESC 键关闭模态
     */
    private setupModalEventListeners(this: KylinRouter): void {
        // ESC 键关闭模态
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && this.modalState.current) {
                const config = this.getModalConfig(this.modalState.current.route);
                if (config?.closeOnEsc !== false) {
                    this.closeTopModal();
                }
            }
        });
    }

    /**
     * 获取模态配置
     * 从路由配置中提取模态配置
     */
    private getModalConfig(route: KylinRouteItem): ModalConfig | null {
        if (typeof route.modal === "boolean") {
            return route.modal ? {} : null;
        }
        return route.modal || null;
    }
    /**
     * 关闭顶层模态（D-20）
     */
    async closeTopModal(this: KylinRouter): Promise<void> {
        if (this.modalState.stack.length === 0) {
            return;
        }

        const stackItem = this.modalState.stack.pop();
        if (!stackItem) return;

        // 移除模态元素和遮罩
        stackItem.element.remove();
        stackItem.backdrop?.remove();

        // 更新当前模态
        this.modalState.current = this.modalState.stack[this.modalState.stack.length - 1] || null;

        // 触发事件
        this.emit("modal-close", {
            route: stackItem.route,
            stackItem,
        });

        // 恢复 URL
        this._restoreModalURL();
    }
    /**
     * 创建背景遮罩
     */
    protected _createBackdrop(this: KylinRouter, config: ModalConfig): HTMLElement | undefined {
        // 检查是否隐藏遮罩（backdrop: false 表示不显示）
        if (config.backdrop === false) {
            return undefined;
        }

        const backdrop = document.createElement("div");
        backdrop.className = "kylin-modal-backdrop";

        // 点击遮罩关闭模态
        if (config.closeOnBackdropClick !== false) {
            backdrop.addEventListener("click", () => {
                (this as any)._closeTopModal();
            });
        }

        return backdrop;
    }

    /**
     * 渲染模态
     */
    protected _renderModal(this: KylinRouter, stackItem: ModalStackItem): Promise<void> {
        const modalContainer = (this as any).modalContainer as HTMLElement;

        // 获取模态配置
        const modalConfig = (this as any)._getModalConfig(stackItem.route);

        // 添加背景遮罩
        if (stackItem.backdrop) {
            modalContainer.appendChild(stackItem.backdrop);
        }

        // 应用模态样式（类型、位置、偏移）
        (this as any)._applyModalStyles(stackItem.element, modalConfig);

        // 添加模态内容
        modalContainer.appendChild(stackItem.element);

        return Promise.resolve();
    }

    /**
     * 应用模态样式
     */
    protected _applyModalStyles(
        this: KylinRouter,
        element: HTMLElement,
        config: ModalConfig | null,
    ): void {
        if (!config) return;

        const type = config.type || "dialog";
        const position = config.position || "center";
        const offset = config.offset || [0, 0];

        // 设置类型样式类
        element.classList.add(`kylin-modal-${type}`);
        element.classList.add(`kylin-modal-${position}`);

        // 应用位置样式
        (this as any)._applyPositionStyles(element, type, position, offset);
    }

    /**
     * 应用位置样式
     * 注意：位置样式已通过 CSS 类在动画中定义，不需要内联样式
     */
    protected _applyPositionStyles(
        this: KylinRouter,
        element: HTMLElement,
        type: string,
        position: string,
        offset: [number, number],
    ): void {
        const style = element.style;

        // 重置基本样式
        style.position = "fixed";
        style.zIndex = "10000";

        // 根据类型应用默认样式
        if (type === "dialog") {
            // dialog 默认有固定的宽度和最大高度
            style.maxWidth = "600px";
            style.maxHeight = "80vh";
            style.overflow = "auto";
        } else if (type === "drawer") {
            // drawer 根据位置设置不同的默认样式
            if (position === "left" || position === "right") {
                // 左右抽屉：固定宽度 300px
                style.width = "300px";
                style.maxHeight = "100vh";
                style.overflow = "auto";
            } else {
                // 上下抽屉：宽度由 CSS 控制（100%），高度 300px
                style.maxHeight = "100vh";
                style.overflow = "auto";
            }
        }

        // 应用位置
        // 注意：drawer 类型的位置由 CSS 类控制，不需要内联样式（除了可能的偏移）
        if (type === "drawer") {
            // drawer 的位置样式已在 CSS 中定义，这里只需处理偏移
            // 但为了保持灵活性，仍为非标准位置提供基本定位
            return;
        }

        switch (position) {
            case "center":
                style.top = "50%";
                style.left = "50%";
                style.transform = `translate(calc(-50% + ${offset[0]}px), calc(-50% + ${offset[1]}px))`;
                break;
            case "top":
                style.top = `${offset[1]}px`;
                style.left = "50%";
                style.transform = `translateX(calc(-50% + ${offset[0]}px))`;
                break;
            case "top-left":
                style.top = `${offset[1]}px`;
                style.left = `${offset[0]}px`;
                break;
            case "top-right":
                style.top = `${offset[1]}px`;
                style.right = `${offset[0]}px`;
                break;
            case "right":
                style.top = "50%";
                style.right = `${offset[0]}px`;
                style.transform = `translateY(calc(-50% + ${offset[1]}px))`;
                break;
            case "bottom-right":
                style.bottom = `${offset[1]}px`;
                style.right = `${offset[0]}px`;
                break;
            case "bottom":
                style.bottom = `${offset[1]}px`;
                style.left = "50%";
                style.transform = `translateX(calc(-50% + ${offset[0]}px))`;
                break;
            case "bottom-left":
                style.bottom = `${offset[1]}px`;
                style.left = `${offset[0]}px`;
                break;
            case "left":
                style.top = "50%";
                style.left = `${offset[0]}px`;
                style.transform = `translateY(calc(-50% + ${offset[1]}px))`;
                break;
        }
    }

    /**
     * 解析模态路由
     */
    protected _resolveModalRoute(this: KylinRouter, options: ModalOptions): KylinRouteItem | null {
        if (options.route) {
            if (typeof options.route === "string") {
                // 通过路径查找路由
                return this.routes.match(options.route)?.route || null;
            } else {
                // 直接使用路由配置
                return options.route;
            }
        }
        return null;
    }

    /**
     * 更新模态 URL（不改变 URL，模态路由与普通路由共存）
     * 模态路由通过内部状态管理，不改变浏览器 URL
     */
    _updateModalURL(this: KylinRouter, _route: KylinRouteItem): void {
        // 模态路由不改变 URL，保持当前 URL 不变
        // 这样模态路由可以与普通路由共存
    }

    /**
     * 恢复模态 URL（不需要恢复，因为 URL 从未改变）
     */
    protected _restoreModalURL(this: KylinRouter): void {
        // 不需要恢复，因为模态路由不改变 URL
    }
}
