import type { Update } from "history";
import type { KylinRouteItem } from "./index";
import type { KylinMatchedRouteItem, ModalStackItem } from "./routes";
import type { KylinSlot } from "@/components/Slot";

export type NavigationLocation = Update;

export type KylinRouterEvents = {
    /**
     * 路由表加载完成
     */
    "routes:loaded": undefined;
    /**
     * 路由表挂载到DOM元素
     */
    "routes:attached": undefined;
    "navigation:start": NavigationLocation;
    "navigation:cancel": NavigationLocation;
    "navigation:end": NavigationLocation;
    /**
     * 当导航匹配后
     */
    "navigation:matched": {
        fromRoute: KylinMatchedRouteItem[] | undefined;
        toRoute: KylinMatchedRouteItem[];
    };
    "route:updated": {
        route: KylinRouteItem | undefined;
        params: Record<string, string>;
        query: Record<string, string>;
        location: Update;
    };

    "render:before": { route: KylinMatchedRouteItem[] };
    "render:after": { route: KylinMatchedRouteItem[]; error?: Error; slot?: KylinSlot | null };

    "modal:open": {
        route: KylinRouteItem;
        stackItem: ModalStackItem;
    };
    "modal:close": {
        route: KylinRouteItem;
        stackItem: ModalStackItem;
    };
    "data:loading": {
        route: KylinRouteItem;
    };
    "data:loaded": {
        route: KylinRouteItem;
    };
    "data:error": {
        route: KylinRouteItem;
        error: Error;
    };
    "view:loading": {
        route: KylinRouteItem;
    };
    "view:loaded": {
        route: KylinRouteItem;
    };
    "view:error": {
        route: KylinRouteItem;
    };
    "hook:error": KylinRouteItem;
};
