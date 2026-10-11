import type { KylinRouter } from "@/router";
import type { ViewRenderOptions } from "./types";
import type { KylinMatchedRouteItem } from "@/types";

export type ViewRenderResult = {
    value: string;
    error?: Error | null;
    meta?: Record<string, any>;
};

export class KylinRouterViewRendererBase {
    router: KylinRouter;
    constructor(router: KylinRouter) {
        this.router = router;
    }

    /**
     * 根据url决定选用哪一种渲染器
     * @param url
     */
    test(_response: Response, _matched: KylinMatchedRouteItem) {
        return true;
    }
    /**
     *
     */
    render(
        _response: Response,
        _matched: KylinMatchedRouteItem,
        options: ViewRenderOptions,
    ): Promise<ViewRenderResult> {
        return Promise.resolve({
            value: "",
            hash: options.hash,
        });
    }
}
