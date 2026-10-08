/**
 * 主色板（Material Design 风格 10 阶梯度）生成实现。
 *
 * 从 @yosulramp/material-color-palette-js@1.0.4（MIT License，
 * https://github.com/yosulramp/material-color-palette-js ，系 Hammwerk/material-color-palette
 * 的 TypeScript 移植）中提取 createPrimaryPalette / createComplementaryPalette 及其全部
 * 依赖闭包，默认参数下算法与数值与原包完全一致（seedLightnessGap / chromaBoostCap
 * 系原包两处硬编码值的参数化，见 PaletteOptions）。
 *
 * 与原包的差异（不影响输出结果）：
 * - 原包通过 `Number.prototype` 扩展（correctGamma/coerceIn 等）实现数值工具，此处改为
 *   模块内纯函数，避免污染全局原型；
 * - 未使用的 createAnalogousPalette / createTriadicPalette 及 HslColor 调和方法中
 *   未被本包用到的成员未随迁。
 */

/* ---------------------------------- 数值工具 ---------------------------------- */
/* 原包 utilities/number-extension.ts 的 prototype 扩展，改为纯函数（逻辑逐行保留） */

/** sRGB 分量的伽马校正（线性化） */
function correctGamma(value: number): number {
    if (value <= 0.04045) {
        return value / 12.92
    }
    return Math.pow((value + 0.055) / 1.055, 2.4)
}

/** 弧度转角度 */
function toDegrees(radian: number): number {
    return (radian * 180) / Math.PI
}

/** 角度转弧度 */
function toRadians(degree: number): number {
    return (degree * Math.PI) / 180.0
}

/** 伽马校正的逆过程（线性转 sRGB） */
function reverseGammaCorrection(value: number): number {
    if (value <= 0.0031308) {
        return 12.92 * value
    }
    return 1.055 * Math.pow(value, 1.0 / 2.4) - 0.055
}

/** 将数值限制在不大于 maximumValue 的范围 */
function coerceAtMost(value: number, maximumValue: number): number {
    if (value > maximumValue) {
        return maximumValue
    }
    return value
}

/** 将数值限制在不小于 minimumValue 的范围 */
function coerceAtLeast(value: number, minimumValue: number): number {
    if (value < minimumValue) return minimumValue
    return value
}

/** 将数值限制在 [minimumValue, maximumValue] 区间 */
function coerceIn(value: number, minimumValue?: number, maximumValue?: number): number {
    if (minimumValue != null && maximumValue != null) {
        if (minimumValue > maximumValue)
            throw new Error(
                `Cannot coerce value to an empty range: maximum ${maximumValue} is less than minimum ${minimumValue}.`
            )
        if (value < minimumValue) return minimumValue
        if (value > maximumValue) return maximumValue
    }
    if (minimumValue != null && value < minimumValue) return minimumValue
    if (maximumValue != null && value > maximumValue) return maximumValue

    return value
}

/* --------------------------------- 颜色空间类 --------------------------------- */

/** HSL 颜色（原包 color-spaces/HslColor.ts） */
class HslColor {
    constructor(
        private hue: number,
        private saturation: number,
        private lightness: number,
        private alpha: number = 1.0
    ) {}

    /** 互补色：色相旋转 180° */
    get complementaryColor() {
        return this.harmonize(180)
    }

    toRgbColor(): RgbColor {
        const { hue, saturation, lightness, alpha } = this

        const chroma = (1 - Math.abs(2.0 * lightness - 1.0)) * saturation
        const huePrime = hue / 60.0
        const x = chroma * (1 - Math.abs((huePrime % 2) - 1))
        const m = lightness - chroma / 2.0

        if (huePrime < 1.0) {
            return new RgbColor(chroma + m, x + m, m, alpha)
        }
        if (huePrime < 2.0) {
            return new RgbColor(x + m, chroma + m, m, alpha)
        }
        if (huePrime < 3.0) {
            return new RgbColor(m, chroma + m, x + m, alpha)
        }
        if (huePrime < 4.0) {
            return new RgbColor(m, x + m, chroma + m, alpha)
        }
        if (huePrime < 5.0) {
            return new RgbColor(x + m, m, chroma + m, alpha)
        }
        return new RgbColor(chroma + m, m, x + m, alpha)
    }

    // ref. https://dev.to/benjaminadk/make-color-math-great-again--45of
    private harmonize(angle: number): HslColor {
        const { hue, saturation, lightness, alpha } = this

        return new HslColor((hue + angle) % 360, saturation, lightness, alpha)
    }
}

/** RGB 颜色（各分量取值 0~1；原包 color-spaces/RgbColor.ts） */
class RgbColor {
    constructor(
        private red: number,
        private green: number,
        private blue: number,
        private alpha: number = 1.0
    ) {}

    /** 形如 `FFEBEE` 的 6 位大写十六进制（不含 # 前缀） */
    get rgbHex(): string {
        const { red, green, blue } = this
        const redHex = Math.round(red * 0xff)
            .toString(16)
            .padStart(2, '0')
        const greenHex = Math.round(green * 0xff)
            .toString(16)
            .padStart(2, '0')
        const blueHex = Math.round(blue * 0xff)
            .toString(16)
            .padStart(2, '0')

        return `${redHex}${greenHex}${blueHex}`.toUpperCase()
    }

    toHslColor(): HslColor {
        const max = Math.max(this.red, this.green, this.blue)
        const min = Math.min(this.red, this.green, this.blue)
        const delta = max - min

        const hue = () => {
            const calculator = (value: number) =>
                Math.round((60.0 * value + 360.0) % 360.0)
            if (delta == 0) {
                return 0
            }
            if (max == this.red) {
                return calculator((this.green - this.blue) / delta)
            }
            if (max == this.green) {
                return calculator((this.blue - this.red) / delta + 2)
            }
            return calculator((this.red - this.green) / delta + 4)
        }

        const saturation = () => {
            if (max == 0.0 || min == 1.0) return 0.0
            return delta / (1 - Math.abs(max + min - 1))
        }

        const lightness = (max + min) / 2.0

        return new HslColor(hue(), saturation(), lightness, this.alpha)
    }

    toXyzColor(): XyzColor {
        const { red, green, blue, alpha } = this
        const x =
            0.4124564 * correctGamma(red) +
            0.3575761 * correctGamma(green) +
            0.1804375 * correctGamma(blue)
        const y =
            0.2126729 * correctGamma(red) +
            0.7151522 * correctGamma(green) +
            0.072175 * correctGamma(blue)
        const z =
            0.0193339 * correctGamma(red) +
            0.119192 * correctGamma(green) +
            0.9503041 * correctGamma(blue)
        return new XyzColor(x, y, z, alpha)
    }
}

/** CIE XYZ 颜色（原包 color-spaces/XyzColor.ts） */
class XyzColor {
    constructor(
        private x: number,
        private y: number,
        private z: number,
        private alpha: number = 1
    ) {}

    toLabColor(): LabColor {
        const { x, y, z, alpha } = this

        const lightness = 116.0 * this.f(y) - 16
        const a = 500.0 * (this.f(x / 0.95047) - this.f(y))
        const b = 200.0 * (this.f(y) - this.f(z / 1.08883))
        return new LabColor(lightness, a, b, alpha)
    }

    toRgbColor(): RgbColor {
        const { x, y, z, alpha } = this

        const red = coerceIn(
            reverseGammaCorrection(3.2404542 * x + -1.5371385 * y + -0.4985314 * z),
            0.0,
            1.0
        )
        const green = coerceIn(
            reverseGammaCorrection(-0.969266 * x + 1.8760108 * y + 0.041556 * z),
            0.0,
            1.0
        )
        const blue = coerceIn(
            reverseGammaCorrection(0.0556434 * x + -0.2040259 * y + 1.0572252 * z),
            0.0,
            1.0
        )

        return new RgbColor(red, green, blue, alpha)
    }

    private f(value: number): number {
        const delta = 6.0 / 29.0

        if (value > Math.pow(delta, 3)) {
            return Math.pow(value, 1.0 / 3.0)
        }
        return value / (3.0 * Math.pow(delta, 2)) + 4.0 / 29.0
    }
}

/**
 * CIE Lab 颜色（原包 color-spaces/LabColor.ts）。
 * 字段对外只读公开：原包在 LchColor.deltaE 中经 Object.assign 解构私有字段（esbuild
 * 不做类型检查故可编译），此处改为显式只读字段以通过 tsc 严格检查，运行时行为一致。
 */
class LabColor {
    constructor(
        readonly lightness: number,
        readonly a: number,
        readonly b: number,
        readonly alpha: number = 1.0
    ) {}

    toLchColor(): LchColor {
        const { lightness, a, b, alpha } = this

        const chroma = Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2))
        const hue = () => {
            if (1e-4 > Math.abs(b) && 1e-4 > Math.abs(a)) {
                return 0
            }
            return (toDegrees(Math.atan2(b, a)) + 360.0) % 360.0
        }
        return new LchColor(lightness, chroma, hue(), alpha)
    }

    toXyzColor(): XyzColor {
        const { lightness, a, b, alpha } = this

        const x = 0.95047 * this.fInv((lightness + 16.0) / 116.0 + a / 500.0)
        const y = 1 * this.fInv((lightness + 16.0) / 116.0)
        const z = 1.08883 * this.fInv((lightness + 16.0) / 116.0 - b / 200.0)

        return new XyzColor(x, y, z, alpha)
    }

    private fInv(value: number): number {
        const delta = 6.0 / 29.0

        if (value > delta) {
            return Math.pow(value, 3)
        }
        return 3.0 * Math.pow(delta, 2) * (value - 4.0 / 29.0)
    }
}

/** CIE LCh(ab) 颜色（原包 color-spaces/LchColor.ts） */
class LchColor {
    constructor(
        private lightness: number,
        private chroma: number,
        private hue: number,
        private alpha: number = 1.0
    ) {}

    getLightness() {
        return this.lightness
    }

    getChroma() {
        return this.chroma
    }

    /** CIEDE2000 色差 */
    deltaE(other: LchColor): number {
        const { lightness, chroma } = this

        const deltaLightness = lightness - other.lightness
        const meanLightness = (lightness + other.lightness) / 2.0
        const meanChroma = (chroma + other.chroma) / 2.0
        const aFactor =
            1 -
            Math.sqrt(
                Math.pow(meanChroma, 7) / (Math.pow(meanChroma, 7) + Math.pow(25.0, 7))
            )
        const thisPrime = (() => {
            const labColor = this.toLabColor()
            return new LabColor(
                labColor.lightness,
                labColor.a + (labColor.a / 2.0) * aFactor,
                labColor.b,
                labColor.alpha
            ).toLchColor()
        })()
        const otherPrime = (() => {
            const labColor = other.toLabColor()
            return new LabColor(
                labColor.lightness,
                labColor.a + (labColor.a / 2.0) * aFactor,
                labColor.b,
                labColor.alpha
            ).toLchColor()
        })()
        const deltaChromaPrime = thisPrime.chroma - otherPrime.chroma
        const meanChromaPrime = (thisPrime.chroma + otherPrime.chroma) / 2.0
        const deltaHuePrime = thisPrime.hueDelta(otherPrime)
        const deltaHPrime =
            2.0 *
            Math.sqrt(thisPrime.chroma * otherPrime.chroma) *
            Math.sin(toRadians(deltaHuePrime / 2.0))
        const meanHuePrime = thisPrime.meanHue(otherPrime)
        const t =
            1.0 -
            0.17 * Math.cos(toRadians(meanHuePrime - 30.0)) +
            0.24 * Math.cos(toRadians(2.0 * meanHuePrime)) +
            0.32 * Math.cos(toRadians(3.0 * meanHuePrime + 6.0)) -
            0.2 * Math.cos(toRadians(4.0 * meanHuePrime - 63.0))
        const sL =
            1.0 +
            (0.015 * Math.pow(meanLightness - 50.0, 2)) /
                Math.sqrt(20.0 + Math.pow(meanLightness - 50.0, 2))

        const sC = 1.0 + 0.045 * meanChromaPrime
        const sH = 1.0 + 0.015 * meanChromaPrime * t
        const rT =
            -2.0 *
            Math.sqrt(
                Math.pow(meanChromaPrime, 7) /
                    (Math.pow(meanChromaPrime, 7) + Math.pow(25, 7))
            ) *
            Math.sin(
                toRadians(60.0 * Math.exp(-Math.pow((meanHuePrime - 275.0) / 25.0, 2)))
            )
        return Math.sqrt(
            Math.pow(deltaLightness / sL, 2) +
                Math.pow(deltaChromaPrime / sC, 2) +
                Math.pow(deltaHPrime / sH, 2) +
                rT * (deltaChromaPrime / sC) * (deltaHPrime / sH)
        )
    }

    toLabColor(): LabColor {
        const { lightness, chroma, hue, alpha } = this

        const a = chroma * Math.cos(toRadians(hue))
        const b = chroma * Math.sin(toRadians(hue))
        return new LabColor(lightness, a, b, alpha)
    }

    minus(other: LchColor) {
        const newLightness = this.lightness - other.lightness
        const newChroma = this.chroma - other.chroma
        const newHue = this.hue - other.hue
        return new LchColor(newLightness, newChroma, newHue)
    }

    adjustLightness(block: (lightness: number) => number) {
        const { lightness, chroma, hue, alpha } = this

        return new LchColor(block(lightness), chroma, hue, alpha)
    }

    adjustChroma(block: (chroma: number) => number) {
        const { lightness, chroma, hue, alpha } = this

        return new LchColor(lightness, block(chroma), hue, alpha)
    }

    adjustHue(block: (hue: number) => number) {
        const { lightness, chroma, hue, alpha } = this

        return new LchColor(lightness, chroma, block(hue), alpha)
    }

    private hueDelta(other: LchColor) {
        const { hue } = this

        if (hue - other.hue >= -180.0 && hue - other.hue <= 180.0) {
            return hue - other.hue
        }
        if (hue <= other.hue) {
            return hue - other.hue + 360.0
        }
        return hue - other.hue - 360.0
    }

    private meanHue(other: LchColor) {
        const { hue } = this

        if (hue - other.hue >= -180.0 && hue - other.hue <= 180.0) {
            return (other.hue + hue) / 2.0
        }
        if (other.hue + hue < 360.0) {
            return (other.hue + hue + 360.0) / 2.0
        }
        return (other.hue + hue - 360.0) / 2.0
    }
}

/* ------------------------------ 基准色板与派生 ------------------------------ */

/** 调色板形态参数；缺省值与原包（material-color-palette-js）硬编码值一致 */
export type PaletteOptions = {
    /** 种子明度间隔：梯度相邻档间的最小明度递减间隔（maxLightness 阶梯约束，实测可波及种子两侧的临界档），默认 1.7（建议 ≥0，负值破坏梯度单调性） */
    seedLightnessGap?: number
    /** 彩度放大上限：非种子档彩度缩放倍率的上限，默认 1.25（<1 可压低饱和度） */
    chromaBoostCap?: number
}

/**
 * Material 基准色板（原包 GoldenPalette.ts）：以一组 LCH 基准色为骨架，
 * 按明度/彩度缩放因子将自定义主色扩散为 10 阶梯度。
 */
class GoldenPalette {
    constructor(private colors: LchColor[]) {}

    minDeltaE(color: LchColor): number {
        const colorDeltaList = this.colors.map((classColor) =>
            color.deltaE(classColor)
        )
        return Math.min(...colorDeltaList)
    }

    getClosestColor(color: LchColor): LchColor {
        const colorDeltaList = this.colors.map((classColor) =>
            color.deltaE(classColor)
        )
        const minDeltaOfColors = Math.min(...colorDeltaList)
        const indexOfColorDeltaList = colorDeltaList.indexOf(minDeltaOfColors)
        return this.colors[indexOfColorDeltaList]
    }

    createCustomPalette(customBaseColor: LchColor, options?: PaletteOptions): LchColor[] {
        const { seedLightnessGap = 1.7, chromaBoostCap = 1.25 } = options ?? {}
        let maxLightness = 100.0

        const closestGoldenPaletteColor = this.getClosestColor(customBaseColor)
        const closestColorIndex = this.colors.indexOf(closestGoldenPaletteColor)
        const adjustMaxLightness = (color: LchColor) =>
            coerceAtLeast(color.getLightness() - seedLightnessGap, 0.0)

        return this.colors.map((color, index) => {
            if (color === closestGoldenPaletteColor) {
                maxLightness = adjustMaxLightness(customBaseColor)
                return customBaseColor
            }

            const adjustedColor = color
                .minus(
                    closestGoldenPaletteColor
                        .minus(customBaseColor)
                        .adjustLightness(
                            (lightness: number) =>
                                lightness *
                                (this.lightnessFactors[index] /
                                    this.lightnessFactors[closestColorIndex])
                        )
                        .adjustChroma(
                            (chroma: number) =>
                                chroma *
                                (this.hasMainColorLowChroma()
                                    ? 1.0
                                    : coerceAtMost(
                                          this.chromaFactors[index] /
                                              this.chromaFactors[closestColorIndex],
                                          chromaBoostCap
                                      ))
                        )
                )
                .adjustLightness((lightness: number) =>
                    coerceIn(lightness, 0.0, maxLightness)
                )
                .adjustChroma((chroma: number) => coerceAtLeast(chroma, 0.0))
                .adjustHue((hue: number) => (hue + 360.0) % 360)

            maxLightness = adjustMaxLightness(adjustedColor)
            return adjustedColor
        })
    }

    hasMainColorLowChroma() {
        return this.colors[5].getChroma() < 30
    }

    private lightnessFactors = [
        2.048875457, 5.124792061, 8.751659557, 12.07628774, 13.91449542,
        15.92738893, 15.46585818, 15.09779227, 15.13738673, 15.09818372,
    ]

    private chromaFactors = [
        1.762442714, 4.213532634, 7.395827458, 11.07174158, 13.89634504,
        16.37591477, 16.27071136, 16.54160806, 17.35916727, 19.88410864,
    ]
}

/** 便捷构造：Lab → LCh（基准数据以 Lab 三元组记录） */
const lab = (lightness: number, a: number, b: number) =>
    new LabColor(lightness, a, b).toLchColor()

/**
 * Material Design 19 组基准色板（原包 constants/golden-palette.ts），
 * 每组 10 阶，数值与原包逐项一致。
 */
const goldenPalettes = [
    new GoldenPalette([
        lab(94.67497003305085, 7.266715066863771, 1.000743882272359),
        lab(86.7897416761699, 18.370736761658012, 4.23637133971424),
        lab(72.0939162832561, 31.7948058298117, 13.2972443996896),
        lab(61.79353370051851, 44.129498163764545, 20.721477326799608),
        lab(57.194195398949574, 59.6450006197361, 34.999830012940194),
        lab(55.603951071861374, 66.01287384845483, 47.67169313982772),
        lab(51.66348502954747, 64.7487785020625, 43.244876694855286),
        lab(47.09455666350969, 62.29836039074277, 40.67775424698388),
        lab(43.77122063388739, 60.28633509183384, 40.31444686692952),
        lab(39.555187078007386, 58.703681355389975, 41.66495027798629),
    ]),
    new GoldenPalette([
        lab(92.68053776327665, 9.515385232804263, -0.8994072969754852),
        lab(81.86756643628922, 25.05688089723257, -1.9475235115390621),
        lab(70.90987389545768, 42.21705257720526, -1.095154624057959),
        lab(61.08140805216186, 58.871233307587204, 2.1008764804626434),
        lab(54.97970219986448, 68.56530938366889, 7.327430728560569),
        lab(50.872250340749176, 74.60459195925529, 15.353576256896073),
        lab(47.27738650144558, 70.77855776427805, 11.70434273264508),
        lab(42.58424189486517, 65.5411953138309, 7.595596439803797),
        lab(37.977492407254836, 60.74362621842075, 2.9847124951453474),
        lab(29.699290034849604, 51.90485023721311, -4.830186634107636),
    ]),
    new GoldenPalette([
        lab(92.4362655169016, 7.542927467702299, -6.039842848605881),
        lab(81.07399776904751, 19.563870217805036, -15.719625491986044),
        lab(68.71394717711831, 33.79992812490556, -26.49539972339321),
        lab(56.596161226236305, 47.5856631835152, -36.480816605410915),
        lab(48.002791217624434, 57.30866443934879, -43.2561127152548),
        lab(40.66211534692161, 64.01910773818436, -48.05930162591041),
        lab(37.690702208992185, 61.13762767732481, -49.384803274243026),
        lab(33.56291870731981, 57.637381239254104, -51.39557249855828),
        lab(29.865391314234515, 54.29737439901333, -52.6601973712463),
        lab(23.16724235420436, 48.51764437280498, -55.16267949015293),
    ]),
    new GoldenPalette([
        lab(92.49103426017201, 4.712320025752947, -6.532868071709763),
        lab(81.24668319505597, 11.50642734909485, -16.666600637245367),
        lab(68.61488216554629, 20.395329051982824, -28.522018851715416),
        lab(55.60369793053023, 30.933537768905005, -41.16439122358484),
        lab(45.834566190969426, 39.28806272235674, -50.523322052772635),
        lab(36.608620229358664, 47.29686002828143, -59.111766586186846),
        lab(34.189791237562616, 46.60426065139123, -59.53961627676729),
        lab(30.52713367338361, 46.01498224754519, -60.19975052509064),
        lab(27.44585524877222, 44.96180431854785, -60.46395810756433),
        lab(21.98627670328218, 44.29296076245473, -60.93653655172098),
    ]),
    new GoldenPalette([
        lab(92.86314411983918, 1.5318147061061937, -6.025243528950552),
        lab(81.8348073705298, 4.460934955458907, -15.873561009736136),
        lab(69.7796913795672, 7.9043652558912765, -26.3170846346932),
        lab(57.48786519938736, 12.681019504822533, -37.23202012914528),
        lab(47.74592578811101, 18.520799302452374, -46.47540679000397),
        lab(38.334403614455404, 25.57700668170812, -55.28224153299287),
        lab(35.15116453901552, 26.231812080381168, -54.53700978785404),
        lab(31.080429988007957, 27.07394930110124, -53.97505274579958),
        lab(27.026672080454922, 28.165266427558983, -53.28987325482218),
        lab(19.751201587921678, 30.60784576895101, -52.13866519297474),
    ]),
    new GoldenPalette([
        lab(94.70682457348717, -2.835484735987326, -6.978044694792707),
        lab(86.8839842970016, -5.16908728759552, -17.88561192754956),
        lab(79.0451532401558, -6.817753527015746, -28.968537490432176),
        lab(71.15083697242613, -5.994763756850707, -39.72549451158927),
        lab(65.48106058907833, -2.735745792537936, -48.15471238926561),
        lab(60.43009440850862, 2.079928897321559, -55.10935847069616),
        lab(55.62267676922188, 4.998684384486918, -55.02164729429915),
        lab(49.27006645904875, 8.470398370314381, -54.494796838457546),
        lab(43.16828856394358, 11.968483076143844, -53.972567377977974),
        lab(32.17757793894193, 18.96054990229354, -53.45146365049088),
    ]),
    new GoldenPalette([
        lab(95.35713467762652, -4.797149155388203, -6.550002550504308),
        lab(88.27942649540043, -10.836006614583892, -16.359361821940375),
        lab(81.10009044900976, -15.323054522981716, -26.419121191320947),
        lab(74.44713958259777, -16.664432625362547, -35.19702686900037),
        lab(69.87836465637318, -14.291515332054693, -41.827430329755174),
        lab(65.68851259178913, -9.612635721963692, -47.34091616039191),
        lab(60.88357994308973, -7.252819027184943, -46.67753731595634),
        lab(54.26166495426166, -3.8141836897908066, -45.97939475762498),
        lab(48.10661895072673, -1.378998784464347, -44.34466750206778),
        lab(36.34401147057282, 5.067812404713545, -43.11786257561915),
    ]),
    new GoldenPalette([
        lab(95.69295154599753, -6.898716127301141, -3.994284229654421),
        lab(89.52842524059004, -16.412398289601725, -9.260466069266693),
        lab(83.32031214655748, -24.83036840728098, -14.568673583304603),
        lab(77.35338313752958, -30.201708572215104, -18.92358284721101),
        lab(73.45322093857781, -31.88590390189383, -21.130459992513686),
        lab(69.97638465064783, -30.679850324547953, -23.186685661136707),
        lab(64.44491716553777, -29.08337434584457, -21.154935769156214),
        lab(56.99816432961103, -27.31081477279451, -17.86988815767443),
        lab(49.75464182255671, -25.335383503694242, -15.024722591662787),
        lab(36.52725894264432, -22.129641744194515, -9.176159146894303),
    ]),
    new GoldenPalette([
        lab(94.18453941589918, -6.08351703428972, -1.5488916051161983),
        lab(85.68177077414457, -15.333179440298606, -2.8519825761476048),
        lab(76.85067847190405, -24.844059173189713, -3.8750785132192656),
        lab(68.02762242570138, -32.566861154120716, -4.015231084407134),
        lab(61.667257304525464, -36.06752603289354, -3.4734046401753815),
        lab(55.67310397390196, -36.66069960626328, -2.125617915169653),
        lab(51.059149495197715, -34.65019160301408, -1.3910484300432513),
        lab(45.269081019218405, -32.13244775422941, -0.4526371852697775),
        lab(39.36899076059384, -29.25264468583161, -0.03562564673170732),
        lab(28.58363043701477, -24.585465516136413, 1.8037402162492389),
    ]),
    new GoldenPalette([
        lab(95.30530183565223, -6.430415645739263, 4.292950594459599),
        lab(88.49014579152143, -15.23147744952702, 10.848261177683138),
        lab(81.22616870575376, -24.993886168551583, 18.144696803330884),
        lab(74.30361721558802, -35.56088696067356, 26.781515251907727),
        lab(69.0430995277442, -42.61556126595995, 33.17109563126665),
        lab(63.977421814072926, -48.54292673319982, 39.73241526342939),
        lab(58.777960853461366, -46.1153692478013, 37.838910745225576),
        lab(52.41108688974904, -43.21761792485762, 35.62250659009424),
        lab(46.2813873076426, -40.25816227675361, 33.32343229338761),
        lab(34.685655305814514, -34.75343878510312, 28.866739034359767),
    ]),
    new GoldenPalette([
        lab(96.70518169355954, -4.929987845095463, 6.397084523168894),
        lab(91.66416061199438, -12.057032041945693, 16.054604579275143),
        lab(86.2244395865449, -19.613646834080622, 26.384906423454236),
        lab(80.83404879636919, -27.080171840756893, 37.378493742021334),
        lab(76.79543725108964, -32.76659719736752, 45.912190572444445),
        lab(72.90025297028019, -37.549139223927384, 53.51959496103027),
        lab(67.21532310272079, -36.56304870773486, 50.49629051268894),
        lab(59.91051142210195, -35.77011466063357, 46.56465847976187),
        lab(52.51015841084511, -34.47903440699235, 42.20723868724268),
        lab(39.41191983353878, -32.80460974352642, 35.255490585630014),
    ]),
    new GoldenPalette([
        lab(97.99506057883428, -4.059632482741494, 9.355797602381521),
        lab(94.80926235976536, -9.237091467352855, 23.230650064824985),
        lab(91.85205843526167, -15.053917327011114, 38.86115182206598),
        lab(88.75812142080242, -19.542900400164097, 53.71785675783709),
        lab(86.27404180729515, -22.173992891121596, 63.978639065232514),
        lab(84.20566835376492, -24.270643520989342, 72.79624067033038),
        lab(78.27915100603997, -21.181850056402496, 68.82763412297965),
        lab(70.82385811892824, -17.788148932525672, 64.00327817988128),
        lab(62.936867012868035, -13.697412111684903, 58.513000509287835),
        lab(49.498610881452535, -6.485230564384715, 49.67432722833751),
    ]),
    new GoldenPalette([
        lab(98.93885129752759, -3.0098470288543178, 10.765736833790008),
        lab(97.22689784824074, -6.174599368734491, 26.22932417355146),
        lab(95.58092947828766, -8.907132848473886, 43.56297291446567),
        lab(94.09009515702486, -10.509628942710735, 60.20019514231188),
        lab(93.06546746683087, -11.008558476013008, 71.76500826005477),
        lab(92.12975017760128, -10.830023094868302, 80.9090559640089),
        lab(87.12188349168609, -2.3764300099239355, 78.14868195373407),
        lab(80.96200442419905, 8.849333792729064, 75.05050700092679),
        lab(75.00342770718086, 20.340173566879283, 72.24841925958934),
        lab(65.48207757431567, 39.647064970476094, 68.34872841768654),
    ]),
    new GoldenPalette([
        lab(97.5642392074337, -1.445525639405032, 11.881254316297674),
        lab(93.67057953749456, -1.8693096862072434, 30.02888670415651),
        lab(89.94571492804107, -1.0224503814769692, 49.649542361642276),
        lab(86.71009164153801, 1.0496066396428194, 68.77377342409739),
        lab(83.78773993319211, 5.248231820098425, 78.92920457852716),
        lab(81.52191382080228, 9.403655370707199, 82.69257112982746),
        lab(78.17240973804697, 16.628512886531887, 81.09358318806208),
        lab(73.80899654381052, 26.53614315250874, 78.21754052181723),
        lab(70.1134511665764, 35.3007623359744, 75.87510992138593),
        lab(63.86460405565717, 50.94648214505959, 72.17815682124423),
    ]),
    new GoldenPalette([
        lab(96.30459517801387, 0.923151172282477, 10.598439446083074),
        lab(90.68320082865087, 4.103774964681062, 26.485793721916128),
        lab(85.00055287186233, 9.047181758866651, 44.51407622580792),
        lab(79.42428495742953, 16.452610724439875, 62.08721739074201),
        lab(75.47792699289774, 23.395742928451867, 72.64347611236501),
        lab(72.04246561548388, 30.681921012382098, 77.08579298904603),
        lab(68.94724338946975, 35.22014778433863, 74.88425044595111),
        lab(64.83017495535229, 40.91200730099703, 71.9596053545428),
        lab(60.8534207471871, 46.41483590510681, 69.18061963415211),
        lab(54.77571742962287, 55.282751019360035, 65.10193403547922),
    ]),
    new GoldenPalette([
        lab(93.69219844671957, 5.763979334358293, 3.1700162796469034),
        lab(86.04629434276428, 15.750843803958192, 14.828476927090994),
        lab(77.54010042938336, 27.90113842540043, 25.99645229289065),
        lab(69.74095456707857, 41.14487377552256, 39.443320178900024),
        lab(64.37085344539341, 51.890379620443575, 50.81312471046415),
        lab(60.06780837277435, 61.65258736118817, 61.54771829165221),
        lab(57.28707915232363, 60.3250664308812, 60.07341536376447),
        lab(53.810052616293845, 58.36760943780162, 58.19586806694884),
        lab(50.301352405105874, 56.40104898089937, 55.924141992404344),
        lab(43.86477994548343, 52.970887703910726, 52.30067989225532),
    ]),
    new GoldenPalette([
        lab(93.29864888069987, 0.9915456090475727, 1.442353076378411),
        lab(82.80884359004081, 3.116221903342209, 3.3523059451463055),
        lab(70.95493047668185, 5.469742193344784, 5.449009494553492),
        lab(58.712934619103066, 7.990991075363385, 8.352488495367627),
        lab(49.150208552875895, 10.570984981000397, 10.831440151197924),
        lab(39.63200151837749, 13.138881961627241, 13.531574711511885),
        lab(35.600996682015754, 12.40352847757295, 12.10432183902449),
        lab(30.084271265759952, 11.317148149878081, 10.547484304296217),
        lab(24.555014696416578, 10.816613316782464, 8.506555306791984),
        lab(18.35055226514404, 10.225725550338765, 7.058582769882571),
    ]),
    new GoldenPalette([
        lab(98.27202740980219, -1.6418393644634932e-5, 6.567357457853973e-6),
        lab(96.53749336548567, -1.616917905122861e-5, 6.467671598286984e-6),
        lab(94.0978378987781, -1.581865383126768e-5, 6.327461532507073e-6),
        lab(89.17728373493613, -1.511167768697419e-5, 6.044671074789676e-6),
        lab(76.61119902231323, -1.330620591488696e-5, 5.322482343750323e-6),
        lab(65.11424774127516, -1.1654345155598378e-5, 4.661738062239351e-6),
        lab(49.238989620828065, -9.373417431124409e-6, 3.7493669724497636e-6),
        lab(41.14266843804848, -8.210152946386273e-6, 3.2840611896567395e-6),
        lab(27.974857206003705, -6.318226192236764e-6, 2.5272904768947058e-6),
        lab(12.740011331302725, -4.129311698131133e-6, 1.6517246792524531e-6),
    ]),
    new GoldenPalette([
        lab(94.27665212516236, -0.637571046109342, -1.313515378996688),
        lab(85.77788001492097, -2.2777811084512822, -3.0177758416151557),
        lab(76.12296325015231, -3.401502988883809, -5.16867892977908),
        lab(66.16340108908365, -4.819627183079045, -7.520697631614404),
        lab(58.35752478513645, -5.7195089100892105, -9.165988916613488),
        lab(50.70748082202715, -6.837992965799455, -10.956055112409357),
        lab(44.85917867647632, -6.411990559239578, -9.74511982878765),
        lab(36.92458930566504, -5.319878610845596, -8.341943474561553),
        lab(29.115334784637618, -4.168907828645069, -6.8629962199973304),
        lab(19.958338450799914, -3.3116721453186617, -5.4486142104736786),
    ]),
]

/* ---------------------------------- 对外接口 ---------------------------------- */

/** 解析 6/8 位十六进制颜色（不含 # 前缀）为 RgbColor，长度非法时返回 null */
const toRgbColorOrNull = (hexColor: string): RgbColor | null => {
    const rgbAsInt = parseInt(hexColor, 16)
    let rgbColor = null
    if (hexColor.length === 8) {
        const red = ((rgbAsInt >> 24) & 0xff) / 255
        const green = ((rgbAsInt >> 16) & 0xff) / 255
        const blue = ((rgbAsInt >> 8) & 0xff) / 255
        const alpha = (rgbAsInt & 0x000000ff) / 255
        rgbColor = new RgbColor(red, green, blue, alpha)
    }

    if (hexColor.length === 6) {
        const red = ((rgbAsInt >> 16) & 0xff) / 255
        const green = ((rgbAsInt >> 8) & 0xff) / 255
        const blue = (rgbAsInt & 0xff) / 255
        rgbColor = new RgbColor(red, green, blue)
    }

    return rgbColor
}

/** 由 HSL 主色生成 10 阶 LCH 色板后转回 RGB（原包 index.ts 的 createPalette） */
const createPalette = (hslColor: HslColor, options?: PaletteOptions): RgbColor[] => {
    const lchColor = hslColor.toRgbColor().toXyzColor().toLabColor().toLchColor()

    const customPalette =
        getClosestGoldenPalette(lchColor).createCustomPalette(lchColor, options)

    const customPaletteAsRgb = customPalette.map((color) =>
        color.toLabColor().toXyzColor().toRgbColor()
    )

    return customPaletteAsRgb
}

/** 找到与目标色 CIEDE2000 色差最小的基准色板 */
const getClosestGoldenPalette = (color: LchColor): GoldenPalette => {
    const goldenPaletteMinDeltaList = goldenPalettes.map((goldenPalette) => {
        return goldenPalette.minDeltaE(color)
    })
    const goldenPaletteMinDelta = Math.min(...goldenPaletteMinDeltaList)
    const indexOfGoldenPaletteMinDelta = goldenPaletteMinDeltaList.indexOf(
        goldenPaletteMinDelta
    )

    return goldenPalettes[indexOfGoldenPaletteMinDelta]
}

/**
 * 由十六进制主色（不含 # 前缀，6/8 位）生成 Material 风格 10 阶主色板；
 * 长度非法时返回 null。
 */
export const createPrimaryPalette = (
    hexColor: string,
    options?: PaletteOptions
): RgbColor[] | null => {
    const hexToRgbColor = toRgbColorOrNull(hexColor)
    if (hexToRgbColor == null) {
        return null
    }

    const hslColor = hexToRgbColor.toHslColor()

    return createPalette(hslColor, options)
}

/**
 * 由十六进制主色（不含 # 前缀，6/8 位）生成其互补色（色相 +180°）的
 * Material 风格 10 阶色板；长度非法时返回 null。
 */
export const createComplementaryPalette = (
    hexColor: string,
    options?: PaletteOptions
): RgbColor[] | null => {
    const hexToRgbColor = toRgbColorOrNull(hexColor)
    if (hexToRgbColor == null) {
        return null
    }

    const hslColor = hexToRgbColor.toHslColor().complementaryColor

    return createPalette(hslColor, options)
}

export type { RgbColor }
