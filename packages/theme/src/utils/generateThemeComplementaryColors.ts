import { createComplementaryPalette } from './createPrimaryPalette'
import { toThemeColorHex } from './toThemeColorHex'

export function generateThemeComplementaryColors(color: string) {
    const palette = createComplementaryPalette(toThemeColorHex(color))
    return palette!.map((rgbColor) => `#${rgbColor.rgbHex}`)
}
