import { createPrimaryPalette } from './createPrimaryPalette'
import { toThemeColorHex } from './toThemeColorHex'

export function generateThemeGradientColors(color: string) {
    const customPrimaryPalette = createPrimaryPalette(toThemeColorHex(color))
    return customPrimaryPalette!.map((rgbColor) => `#${rgbColor.rgbHex}`)
}
