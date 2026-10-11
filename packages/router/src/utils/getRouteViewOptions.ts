import type { KylinRouter } from "@/router";
import type { KylinRouteItem, KylinRouteViewOptions } from "@/types";

export function getRouteViewOptions(
    route: KylinRouteItem,
    router: KylinRouter,
): KylinRouteViewOptions {
    return Object.assign(
        {},
        router.options.viewOptions,
        route.view && typeof route.view === "object" && "form" in route.view
            ? route.view
            : {
                  from: route.view,
              },
    ) as KylinRouteViewOptions;
}
