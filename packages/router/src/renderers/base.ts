import type { AutoSparkRouter } from "@/router";
import type { ViewRenderOptions } from "./types";
import type { AutoSparkMatchedRouteItem } from "@/types";

export type ViewRenderResult = {
    value: string;
    error?: Error | null;
    meta?: Record<string, any>;
};

export class AutoSparkRouterViewRendererBase {
    router: AutoSparkRouter;
    constructor(router: AutoSparkRouter) {
        this.router = router;
    }

    /**
     * 根据url决定选用哪一种渲染器
     * @param url
     */
    test(_response: Response, _matched: AutoSparkMatchedRouteItem) {
        return true;
    }
    /**
     *
     */
    render(
        _response: Response,
        _matched: AutoSparkMatchedRouteItem,
        options: ViewRenderOptions,
    ): Promise<ViewRenderResult> {
        return Promise.resolve({
            value: "",
            hash: options.hash,
        });
    }
}
