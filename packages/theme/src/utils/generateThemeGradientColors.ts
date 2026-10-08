import { createPrimaryPalette, type PaletteOptions } from './createPrimaryPalette'
import { toThemeColorHex } from './toThemeColorHex'

export function generateThemeGradientColors(color: string, options?: PaletteOptions) {
    const customPrimaryPalette = createPrimaryPalette(toThemeColorHex(color), options)
    return customPrimaryPalette!.map((rgbColor) => `#${rgbColor.rgbHex}`)
}
