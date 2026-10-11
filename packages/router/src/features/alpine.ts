/**
 * Alpine.js 集成管理器
 * 提供 Alpine.js store 初始化和 x-data 绑定功能
 */

import Alpine from "alpinejs";
import type { KylinRouter } from "@/router";
import type { ModalOptions } from "@/types/modals";
import { registerCssVarDirective } from "@/directives/cssVar";
import { registerInjectDataDirective } from "@/directives/injectData";

/**
 * Alpine.js 全局 store 接口
 */
export interface KylinAlpineStore {
    /** 当前路由信息 */
    current: {
        route: any;
        params: Record<string, string>;
        query: Record<string, string>;
        matchedRoutes?: any[];
    };
    /** 模态信息和方法 */
    modal: {
        stack: any[];
        current: any;
        openModal: (options: ModalOptions) => void;
        closeModal: () => void;
    };
    /** 路由注册表访问 */
    routes: any;
    /** 自定义数据 */
    [key: string]: any;
}

/**
 * Alpine.js 管理器
 * 负责初始化 Alpine.js store 和绑定 x-data 到 host 元素
 */
export class AlpineManager {
    private router: KylinRouter;

    constructor(router: KylinRouter) {
        this.router = router;
        this.initStore(this.router.options.data);
        this.bindHost(this.router.host);
    }

    /**
     * 初始化 Alpine.js store
     * @param initialData - 自定义初始数据
     */
    initStore(initialData: Record<string, any> = {}): void {
        // 保存 router 引用用于闭包
        const router = this.router;

        // 创建全局 store
        Alpine.store("router", {
            // current: 当前路由信息
            get current() {
                return router.routes.current;
            },

            // modal: 模态信息和方法
            get modal() {
                return {
                    get stack() {
                        // 通过反射访问 protected 属性
                        // @ts-ignore - Alpine store 需要访问 modalState
                        return (router as any).modalState?.stack || [];
                    },
                    get current() {
                        // @ts-ignore - Alpine store 需要访问 modalState
                        return (router as any).modalState?.current || null;
                    },
                    openModal: (options: ModalOptions) => router.openModal(options),
                    closeModal: () => router.closeTopModal(),
                };
            },

            // routes: 访问 RouteRegistry
            get routes() {
                return router.routes;
            },
        } as unknown as KylinAlpineStore);
        // 通过$store.data.xxx访问全局数据
        Alpine.store("data", initialData);
        //@ts-ignore
        globalThis.Alpine = Alpine;
        // 注册自定义指令（必须在 Alpine.start() 之前）
        registerCssVarDirective(Alpine);
        registerInjectDataDirective(Alpine);
        // 启动 Alpine.js（如果还未启动）
        if (!Alpine.version) {
            Alpine.start();
        }
    }

    /**
     * 为 host 元素绑定 x-data
     * @param host - 宿主元素
     */
    bindHost(host: HTMLElement): void {
        // 添加 x-data 属性，使整个 host 树可以访问 Alpine store
        // 使用空对象，避免无效表达式错误
        host.setAttribute("x-data", "{}");
    }

    /**
     * 清理资源
     * Alpine.js 不需要特殊清理，但保留此方法以备将来扩展
     */
    cleanup(): void {
        // Alpine.js 会自动清理，无需手动干预
    }
}
