import type { KylinMatchedRouteItem } from "@/types";
import { KylinRouterViewRendererBase } from "./base";

export class KylinRouterImageViewRenderer extends KylinRouterViewRendererBase {
    test(_response: Response, _matched: KylinMatchedRouteItem) {
        return true;
    }
}
