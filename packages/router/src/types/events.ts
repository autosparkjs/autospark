import type { Update } from "history";
import type { AutoSparkRouteItem } from "./index";
import type { AutoSparkMatchedRouteItem, ModalStackItem } from "./routes";
import type { AutoSparkSlot } from "@/components/Slot";

export type NavigationLocation = Update;

export type AutoSparkRouterEvents = {
    /**
     * 路由表加载完成（骨架就绪，ADR-0007 保持此语义——远程子表仍在后台展开中）
     */
    "routes:loaded": undefined;
    /**
     * 路由表挂载到DOM元素
     */
    "routes:attached": undefined;
    /**
     * 路由表展开完成（ADR-0007）
     *
     * 全部远程子表解析完毕——无论成功或失败降级。骨架就绪见 `routes:loaded`
     */
    "routes:expanded": undefined;
    /**
     * 单个远程子表展开失败或被深度上限截断（ADR-0007）
     *
     * 该节点已局部降级为无子路由，路由表其余部分照常可用
     */
    "routes:error": { url?: string; path: string; error: Error };
    "navigation:start": NavigationLocation;
    "navigation:cancel": NavigationLocation;
    "navigation:end": NavigationLocation;
    /**
     * 当导航匹配后
     */
    "navigation:matched": {
        fromRoute: AutoSparkMatchedRouteItem[] | undefined;
        toRoute: AutoSparkMatchedRouteItem[];
    };
    "route:updated": {
        route: AutoSparkRouteItem | undefined;
        params: Record<string, string>;
        query: Record<string, string>;
        location: Update;
    };

    "render:before": { route: AutoSparkMatchedRouteItem[] };
    "render:after": { route: AutoSparkMatchedRouteItem[]; error?: Error; slot?: AutoSparkSlot | null };

    "modal:open": {
        route: AutoSparkRouteItem;
        stackItem: ModalStackItem;
    };
    "modal:close": {
        route: AutoSparkRouteItem;
        stackItem: ModalStackItem;
    };
    "data:loading": {
        route: AutoSparkRouteItem;
    };
    "data:loaded": {
        route: AutoSparkRouteItem;
    };
    "data:error": {
        route: AutoSparkRouteItem;
        error: Error;
    };
    "view:loading": {
        route: AutoSparkRouteItem;
    };
    "view:loaded": {
        route: AutoSparkRouteItem;
    };
    "view:error": {
        route: AutoSparkRouteItem;
    };
    "hook:error": AutoSparkRouteItem;
};
