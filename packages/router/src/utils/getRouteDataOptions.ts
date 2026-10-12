import type { AutoSparkRouter } from "@/router";
import type { AutoSparkRouteItem, AutoSparkRouteDataOptions } from "@/types";

export function getRouteDataOptions(
    route: AutoSparkRouteItem,
    router: AutoSparkRouter,
): AutoSparkRouteDataOptions {
    return Object.assign(
        {},
        router.options.dataOptions,
        route.data && typeof route.data === "object" && "form" in route.data
            ? route.data
            : {
                  from: route.data,
              },
    ) as AutoSparkRouteDataOptions;
}
