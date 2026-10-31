/** 动画选项解析（engine 公开 API）：进出场动画三形态归一（字符串/对象/分相）——nsMember 具名包装 */
import { nsMember } from "./namespace";

export function resolveAnimate(option: unknown) {
    return nsMember<(option: unknown) => any>("resolveAnimate")(option);
}
