import type { WrapperModifierDesc } from "../types";
/**
 * `.debounce`：防抖。`.debounce` 默认 300ms；自定义时长走 `x-on-options="{debounce:N}"`（ADR-0007）。
 *
 * 连续触发仅在最后一次后等待 ms 才执行业务；destroy 时经 cleanup.cancel 清 pending timer。
 * wrapper 处于 guard 之外（管道最外层），守卫检查的是防抖触发后"最后一次累积事件"。
 */
declare const _default: WrapperModifierDesc;
export default _default;
