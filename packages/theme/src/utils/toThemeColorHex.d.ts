/**
 * 将任意 CSS 颜色字符串规范化为色板生成（createPrimaryPalette）所需的
 * 无 `#` 前缀 6 位小写 hex。
 *
 * - 支持 toRGB 能解析的形态：`#RGB` / `#RRGGBB`（大小写均可）、`rgb()` / `rgba()`、常见命名色
 * - `#RRGGBBAA` 截断 alpha 通道（色板生成忽略透明度）
 * - 其余不可解析的输入回退黑色 `000000`（对齐 @ant-design/fast-color 的容错行为）
 */
export declare function toThemeColorHex(color: string): string;
