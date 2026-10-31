/** 引擎渲染根（overlay 容器宿主；engine 公开 API）——nsMember 具名包装 */
import { nsMember } from "./namespace";

export function getOverlayContainer(engine: any): HTMLElement | null {
    return nsMember<(engine: any) => HTMLElement | null>("getOverlayContainer")(engine);
}
