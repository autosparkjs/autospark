import type { AutoSparkRouter } from "@/router";
import type { AutoSparkRouteItem, AutoSparkRouteViewOptions } from "@/types";

export function getRouteViewOptions(
    route: AutoSparkRouteItem,
    router: AutoSparkRouter,
): AutoSparkRouteViewOptions {
    return Object.assign(
        {},
        router.options.viewOptions,
        route.view && typeof route.view === "object" && "form" in route.view
            ? route.view
            : {
                  from: route.view,
              },
    ) as AutoSparkRouteViewOptions;
}
