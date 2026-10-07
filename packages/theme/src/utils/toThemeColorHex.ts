import { toRGBString } from './toRGBString'

/**
 * 将任意 CSS 颜色字符串规范化为色板生成（createPrimaryPalette）所需的
 * 无 `#` 前缀 6 位小写 hex。
 *
 * - 支持 toRGB 能解析的形态：`#RGB` / `#RRGGBB`（大小写均可）、`rgb()` / `rgba()`、常见命名色
 * - `#RRGGBBAA` 截断 alpha 通道（色板生成忽略透明度）
 * - 其余不可解析的输入回退黑色 `000000`（对齐 @ant-design/fast-color 的容错行为）
 */
export function toThemeColorHex(color: string): string {
    const normalized = toRGBString(color.trim())
    if (/^#[0-9a-f]{6}$/.test(normalized)) {
        return normalized.slice(1)
    }
    // 8 位 hex：toRGBString 不识别会原样返回，此处截断 alpha
    const rgba = normalized.match(/^#([0-9a-f]{6})[0-9a-f]{2}$/i)
    if (rgba) {
        return rgba[1].toLowerCase()
    }
    return '000000'
}
