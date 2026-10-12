import type { AutoSparkMatchedRouteItem } from "@/types";
import { AutoSparkRouterViewRendererBase } from "./base";

export class AutoSparkRouterImageViewRenderer extends AutoSparkRouterViewRendererBase {
    test(_response: Response, _matched: AutoSparkMatchedRouteItem) {
        return true;
    }
}
