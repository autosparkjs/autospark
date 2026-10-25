/**
 * CSS 颜色解析工具
 *
 * ## 为何手写、不依赖原生
 *
 * 需求是"把任意合法 CSS 颜色按指定 alpha 合成"（如遮罩底色 = bgColor 的 alpha 通道）。
 * 两条原生路径在**测试环境（happy-dom）**都不可用，故自包含解析以保证 **生产浏览器与
 * happy-dom 测试行为一致**：
 *
 * - `getComputedStyle(el).color`：happy-dom **不规范化**——`"red"` 读回仍是 `"red"`、
 *   `"hsl(...)"` 仍是 hsl、`"oklch(...)"` 被静默吞成 `"white"`，无法当解析器；
 * - CSS `color-mix()`：happy-dom 视为非法值**直接丢弃**（`style.background` 变空串），
 *   连渲染都做不到。
 *
 * 故本模块手写 hex / rgb() / hsl() / 常用颜色名 的解析，返回三通道数组，供调用方合成。
 * 不支持的现代语法（oklch / color() / lab 等）返回 null，调用方回退默认色。
 */
/** RGB 三通道类型别名 */
export type RGB = readonly [number, number, number];
/**
 * 常用 CSS 颜色名表（CSS Level 1-3 常用子集）。
 *
 * 生僻名走 hex/rgb/hsl 分支，仍不可识别则由调用方回退默认色。
 * 导出供需要颜色名查找的场景复用。
 */
export declare const NAMED_COLORS: Record<string, RGB>;
/** hex（#rgb / #rgba / #rrggbb / #rrggbbaa）→ [r,g,b]，丢弃 alpha 通道；非法返回 null */
export declare function hexToRgb(hex: string): RGB | null;
/** hsl(h,s%,l%) → [r,g,b]（入参 h 为 0~360，s/l 为 0~100，内部归一化） */
export declare function hslToRgb(h: number, s: number, l: number): RGB;
/**
 * 解析任意合法 CSS 颜色为 [r,g,b]。
 *
 * 支持：hex（全形态）/ rgb() / rgba() / hsl() / hsla() / 常用颜色名。
 * 不支持（返回 null）：oklch / color() / lab 等现代语法——调用方回退默认色。
 *
 * @returns 三通道数组；不可识别返回 null
 */
export declare function parseColor(input: string): RGB | null;
/**
 * 合成 `rgba(color, alpha)`：color 经 parseColor 解析为三通道，alpha 经 clamp 到 [0,1]。
 *
 * parseColor 失败（不可识别颜色）时回退黑色——这是"alpha 合成"场景的合理默认
 * （典型用途如 loading 遮罩底色默认即黑）。
 *
 * @param color 任意合法 CSS 颜色字符串
 * @param alpha 不透明度，超出 [0,1] 会被 clamp
 */
export declare function rgba(color: string, alpha: number): string;
