import type { KylinRouter } from "@/router";
import type { KylinRouteItem, KylinRouteDataOptions } from "@/types";

export function getRouteDataOptions(
    route: KylinRouteItem,
    router: KylinRouter,
): KylinRouteDataOptions {
    return Object.assign(
        {},
        router.options.dataOptions,
        route.data && typeof route.data === "object" && "form" in route.data
            ? route.data
            : {
                  from: route.data,
              },
    ) as KylinRouteDataOptions;
}
