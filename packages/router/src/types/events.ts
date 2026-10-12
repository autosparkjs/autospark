import type { Update } from "history";
import type { AutoSparkRouteItem } from "./index";
import type { AutoSparkMatchedRouteItem, ModalStackItem } from "./routes";
import type { AutoSparkSlot } from "@/components/Slot";

export type NavigationLocation = Update;

export type AutoSparkRouterEvents = {
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
