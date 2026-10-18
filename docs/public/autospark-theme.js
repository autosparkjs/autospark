"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  // src/presets.ts
  var presetThemes = {
    blue: {
      color: "#1677ff",
      title: "\u62C2\u6653\u84DD"
    },
    red: {
      color: "#f5222d",
      title: "\u8584\u66AE"
    },
    volcano: {
      color: "#fa541c",
      title: "\u706B\u5C71"
    },
    orange: {
      color: "#fa8c16",
      title: "\u65E5\u66AE"
    },
    lime: {
      color: "#a0d911",
      title: "\u9752\u67E0"
    },
    gold: {
      color: "#faad14",
      title: "\u91D1\u76CF\u82B1"
    },
    green: {
      color: "#52c41a",
      title: "\u6781\u5149\u7EFF"
    },
    cyan: {
      color: "#13c2c2",
      title: "\u660E\u9752"
    },
    geekblue: {
      color: "#2f54eb",
      title: "\u6781\u5BA2\u84DD"
    },
    techblue: {
      color: "#3fb3ff",
      title: "\u79D1\u6280\u84DD"
    },
    purple: {
      color: "#722ed1",
      title: "\u9171\u7D2B"
    },
    magenta: {
      color: "#eb2f96",
      title: "\u6CD5\u5F0F\u6D0B\u7EA2"
    }
  };

  // src/utils/getId.ts
  function getId(len = 10) {
    return Math.random().toString(36).substring(2, len + 2);
  }
  __name(getId, "getId");

  // src/utils/injectStylesheet.ts
  function injectStylesheet(css, options) {
    if (globalThis.document === void 0) return;
    const { id, mode, location = "head" } = Object.assign({
      mode: "replace"
    }, options);
    let style = document.head.querySelector(`#${id}`);
    const scopeId = id || getId();
    if (!style) {
      style = document.createElement("style");
      style.id = scopeId;
      if (location === "body") {
        document.body.appendChild(style);
      } else if (location instanceof HTMLElement) {
        location.appendChild(style);
      } else {
        document.head.appendChild(style);
      }
    }
    if (mode === "append") {
      style.innerHTML += css;
    } else {
      style.innerHTML = css;
    }
    return scopeId;
  }
  __name(injectStylesheet, "injectStylesheet");

  // src/utils/toRGB.ts
  var colorNames = {
    black: "#000000",
    white: "#FFFFFF",
    red: "#FF0000",
    green: "#008000",
    blue: "#0000FF",
    yellow: "#FFFF00",
    purple: "#800080",
    orange: "#FFA500",
    gray: "#808080",
    grey: "#808080",
    pink: "#FFC0CB",
    brown: "#A52A2A",
    cyan: "#00FFFF",
    magenta: "#FF00FF",
    silver: "#C0C0C0",
    maroon: "#800000",
    olive: "#808000",
    lime: "#00FF00",
    teal: "#008080",
    navy: "#000080"
  };
  function toRGB(color) {
    if (!color) return null;
    color = color.trim().toLowerCase();
    if (color.startsWith("#")) {
      return hexToRGB(color);
    }
    if (color.startsWith("rgb")) {
      return rgbStringToRGB(color);
    }
    if (color in colorNames) {
      return hexToRGB(colorNames[color]);
    }
    return null;
  }
  __name(toRGB, "toRGB");
  function hexToRGB(hex) {
    hex = hex.replace("#", "");
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    if (hex.length !== 6) return null;
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
    return [
      r,
      g,
      b
    ];
  }
  __name(hexToRGB, "hexToRGB");
  function rgbStringToRGB(rgbString) {
    const match = rgbString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/i);
    if (!match) return null;
    const r = parseInt(match[1], 10);
    const g = parseInt(match[2], 10);
    const b = parseInt(match[3], 10);
    if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
    return [
      r,
      g,
      b
    ];
  }
  __name(rgbStringToRGB, "rgbStringToRGB");

  // src/utils/toRGBString.ts
  function toRGBString(color) {
    const rgb = toRGB(color);
    if (!rgb) return color;
    return `#${rgb[0].toString(16).padStart(2, "0")}${rgb[1].toString(16).padStart(2, "0")}${rgb[2].toString(16).padStart(2, "0")}`;
  }
  __name(toRGBString, "toRGBString");

  // src/utils/isDark.ts
  function isDark(color) {
    const rgb = toRGB(color);
    if (!rgb) return false;
    const luminance = 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2];
    return luminance < 128;
  }
  __name(isDark, "isDark");

  // src/utils/isLight.ts
  function isLight(color) {
    return isDark(color);
  }
  __name(isLight, "isLight");

  // src/persistence.ts
  var RESTORE_STYLE_ID = "autospark-theme-restore";
  var DEFAULT_STORAGE_KEY = "autospark-theme";
  var scopeParamsKey = /* @__PURE__ */ __name((storageKey, id) => `${storageKey}-scope-${id}`, "scopeParamsKey");
  var stylesSnapshotKey = /* @__PURE__ */ __name((storageKey) => `${storageKey}-styles`, "stylesSnapshotKey");
  function readScopeParams(storageKey, id) {
    try {
      const raw = globalThis.localStorage?.getItem(scopeParamsKey(storageKey, id));
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
  __name(readScopeParams, "readScopeParams");
  function writeScopeParamsJson(storageKey, id, json) {
    try {
      globalThis.localStorage?.setItem(scopeParamsKey(storageKey, id), json);
    } catch {
    }
  }
  __name(writeScopeParamsJson, "writeScopeParamsJson");
  function removeScopeParams(storageKey, id) {
    try {
      globalThis.localStorage?.removeItem(scopeParamsKey(storageKey, id));
    } catch {
    }
  }
  __name(removeScopeParams, "removeScopeParams");
  function writeStylesSnapshot(storageKey, css) {
    try {
      globalThis.localStorage?.setItem(stylesSnapshotKey(storageKey), css);
    } catch {
    }
  }
  __name(writeStylesSnapshot, "writeStylesSnapshot");
  function removeStylesSnapshot(storageKey) {
    try {
      globalThis.localStorage?.removeItem(stylesSnapshotKey(storageKey));
    } catch {
    }
  }
  __name(removeStylesSnapshot, "removeStylesSnapshot");
  function removeRestoreTag(doc) {
    try {
      doc.getElementById(RESTORE_STYLE_ID)?.remove();
    } catch {
    }
  }
  __name(removeRestoreTag, "removeRestoreTag");

  // src/utils/createPrimaryPalette.ts
  function correctGamma(value) {
    if (value <= 0.04045) {
      return value / 12.92;
    }
    return Math.pow((value + 0.055) / 1.055, 2.4);
  }
  __name(correctGamma, "correctGamma");
  function toDegrees(radian) {
    return radian * 180 / Math.PI;
  }
  __name(toDegrees, "toDegrees");
  function toRadians(degree) {
    return degree * Math.PI / 180;
  }
  __name(toRadians, "toRadians");
  function reverseGammaCorrection(value) {
    if (value <= 31308e-7) {
      return 12.92 * value;
    }
    return 1.055 * Math.pow(value, 1 / 2.4) - 0.055;
  }
  __name(reverseGammaCorrection, "reverseGammaCorrection");
  function coerceAtMost(value, maximumValue) {
    if (value > maximumValue) {
      return maximumValue;
    }
    return value;
  }
  __name(coerceAtMost, "coerceAtMost");
  function coerceAtLeast(value, minimumValue) {
    if (value < minimumValue) return minimumValue;
    return value;
  }
  __name(coerceAtLeast, "coerceAtLeast");
  function coerceIn(value, minimumValue, maximumValue) {
    if (minimumValue != null && maximumValue != null) {
      if (minimumValue > maximumValue) throw new Error(`Cannot coerce value to an empty range: maximum ${maximumValue} is less than minimum ${minimumValue}.`);
      if (value < minimumValue) return minimumValue;
      if (value > maximumValue) return maximumValue;
    }
    if (minimumValue != null && value < minimumValue) return minimumValue;
    if (maximumValue != null && value > maximumValue) return maximumValue;
    return value;
  }
  __name(coerceIn, "coerceIn");
  var _a;
  var HslColor = (_a = class {
    constructor(hue, saturation, lightness, alpha = 1) {
      __publicField(this, "hue");
      __publicField(this, "saturation");
      __publicField(this, "lightness");
      __publicField(this, "alpha");
      this.hue = hue;
      this.saturation = saturation;
      this.lightness = lightness;
      this.alpha = alpha;
    }
    /** 互补色：色相旋转 180° */
    get complementaryColor() {
      return this.harmonize(180);
    }
    toRgbColor() {
      const { hue, saturation, lightness, alpha } = this;
      const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
      const huePrime = hue / 60;
      const x = chroma * (1 - Math.abs(huePrime % 2 - 1));
      const m = lightness - chroma / 2;
      if (huePrime < 1) {
        return new RgbColor(chroma + m, x + m, m, alpha);
      }
      if (huePrime < 2) {
        return new RgbColor(x + m, chroma + m, m, alpha);
      }
      if (huePrime < 3) {
        return new RgbColor(m, chroma + m, x + m, alpha);
      }
      if (huePrime < 4) {
        return new RgbColor(m, x + m, chroma + m, alpha);
      }
      if (huePrime < 5) {
        return new RgbColor(x + m, m, chroma + m, alpha);
      }
      return new RgbColor(chroma + m, m, x + m, alpha);
    }
    // ref. https://dev.to/benjaminadk/make-color-math-great-again--45of
    harmonize(angle) {
      const { hue, saturation, lightness, alpha } = this;
      return new _a((hue + angle) % 360, saturation, lightness, alpha);
    }
  }, __name(_a, "HslColor"), _a);
  var _a2;
  var RgbColor = (_a2 = class {
    constructor(red, green, blue, alpha = 1) {
      __publicField(this, "red");
      __publicField(this, "green");
      __publicField(this, "blue");
      __publicField(this, "alpha");
      this.red = red;
      this.green = green;
      this.blue = blue;
      this.alpha = alpha;
    }
    /** 形如 `FFEBEE` 的 6 位大写十六进制（不含 # 前缀） */
    get rgbHex() {
      const { red, green, blue } = this;
      const redHex = Math.round(red * 255).toString(16).padStart(2, "0");
      const greenHex = Math.round(green * 255).toString(16).padStart(2, "0");
      const blueHex = Math.round(blue * 255).toString(16).padStart(2, "0");
      return `${redHex}${greenHex}${blueHex}`.toUpperCase();
    }
    toHslColor() {
      const max = Math.max(this.red, this.green, this.blue);
      const min = Math.min(this.red, this.green, this.blue);
      const delta = max - min;
      const hue = /* @__PURE__ */ __name(() => {
        const calculator = /* @__PURE__ */ __name((value) => Math.round((60 * value + 360) % 360), "calculator");
        if (delta == 0) {
          return 0;
        }
        if (max == this.red) {
          return calculator((this.green - this.blue) / delta);
        }
        if (max == this.green) {
          return calculator((this.blue - this.red) / delta + 2);
        }
        return calculator((this.red - this.green) / delta + 4);
      }, "hue");
      const saturation = /* @__PURE__ */ __name(() => {
        if (max == 0 || min == 1) return 0;
        return delta / (1 - Math.abs(max + min - 1));
      }, "saturation");
      const lightness = (max + min) / 2;
      return new HslColor(hue(), saturation(), lightness, this.alpha);
    }
    toXyzColor() {
      const { red, green, blue, alpha } = this;
      const x = 0.4124564 * correctGamma(red) + 0.3575761 * correctGamma(green) + 0.1804375 * correctGamma(blue);
      const y = 0.2126729 * correctGamma(red) + 0.7151522 * correctGamma(green) + 0.072175 * correctGamma(blue);
      const z = 0.0193339 * correctGamma(red) + 0.119192 * correctGamma(green) + 0.9503041 * correctGamma(blue);
      return new XyzColor(x, y, z, alpha);
    }
  }, __name(_a2, "RgbColor"), _a2);
  var _a3;
  var XyzColor = (_a3 = class {
    constructor(x, y, z, alpha = 1) {
      __publicField(this, "x");
      __publicField(this, "y");
      __publicField(this, "z");
      __publicField(this, "alpha");
      this.x = x;
      this.y = y;
      this.z = z;
      this.alpha = alpha;
    }
    toLabColor() {
      const { x, y, z, alpha } = this;
      const lightness = 116 * this.f(y) - 16;
      const a = 500 * (this.f(x / 0.95047) - this.f(y));
      const b = 200 * (this.f(y) - this.f(z / 1.08883));
      return new LabColor(lightness, a, b, alpha);
    }
    toRgbColor() {
      const { x, y, z, alpha } = this;
      const red = coerceIn(reverseGammaCorrection(3.2404542 * x + -1.5371385 * y + -0.4985314 * z), 0, 1);
      const green = coerceIn(reverseGammaCorrection(-0.969266 * x + 1.8760108 * y + 0.041556 * z), 0, 1);
      const blue = coerceIn(reverseGammaCorrection(0.0556434 * x + -0.2040259 * y + 1.0572252 * z), 0, 1);
      return new RgbColor(red, green, blue, alpha);
    }
    f(value) {
      const delta = 6 / 29;
      if (value > Math.pow(delta, 3)) {
        return Math.pow(value, 1 / 3);
      }
      return value / (3 * Math.pow(delta, 2)) + 4 / 29;
    }
  }, __name(_a3, "XyzColor"), _a3);
  var _a4;
  var LabColor = (_a4 = class {
    constructor(lightness, a, b, alpha = 1) {
      __publicField(this, "lightness");
      __publicField(this, "a");
      __publicField(this, "b");
      __publicField(this, "alpha");
      this.lightness = lightness;
      this.a = a;
      this.b = b;
      this.alpha = alpha;
    }
    toLchColor() {
      const { lightness, a, b, alpha } = this;
      const chroma = Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2));
      const hue = /* @__PURE__ */ __name(() => {
        if (1e-4 > Math.abs(b) && 1e-4 > Math.abs(a)) {
          return 0;
        }
        return (toDegrees(Math.atan2(b, a)) + 360) % 360;
      }, "hue");
      return new LchColor(lightness, chroma, hue(), alpha);
    }
    toXyzColor() {
      const { lightness, a, b, alpha } = this;
      const x = 0.95047 * this.fInv((lightness + 16) / 116 + a / 500);
      const y = 1 * this.fInv((lightness + 16) / 116);
      const z = 1.08883 * this.fInv((lightness + 16) / 116 - b / 200);
      return new XyzColor(x, y, z, alpha);
    }
    fInv(value) {
      const delta = 6 / 29;
      if (value > delta) {
        return Math.pow(value, 3);
      }
      return 3 * Math.pow(delta, 2) * (value - 4 / 29);
    }
  }, __name(_a4, "LabColor"), _a4);
  var _a5;
  var LchColor = (_a5 = class {
    constructor(lightness, chroma, hue, alpha = 1) {
      __publicField(this, "lightness");
      __publicField(this, "chroma");
      __publicField(this, "hue");
      __publicField(this, "alpha");
      this.lightness = lightness;
      this.chroma = chroma;
      this.hue = hue;
      this.alpha = alpha;
    }
    getLightness() {
      return this.lightness;
    }
    getChroma() {
      return this.chroma;
    }
    /** CIEDE2000 色差 */
    deltaE(other) {
      const { lightness, chroma } = this;
      const deltaLightness = lightness - other.lightness;
      const meanLightness = (lightness + other.lightness) / 2;
      const meanChroma = (chroma + other.chroma) / 2;
      const aFactor = 1 - Math.sqrt(Math.pow(meanChroma, 7) / (Math.pow(meanChroma, 7) + Math.pow(25, 7)));
      const thisPrime = (() => {
        const labColor = this.toLabColor();
        return new LabColor(labColor.lightness, labColor.a + labColor.a / 2 * aFactor, labColor.b, labColor.alpha).toLchColor();
      })();
      const otherPrime = (() => {
        const labColor = other.toLabColor();
        return new LabColor(labColor.lightness, labColor.a + labColor.a / 2 * aFactor, labColor.b, labColor.alpha).toLchColor();
      })();
      const deltaChromaPrime = thisPrime.chroma - otherPrime.chroma;
      const meanChromaPrime = (thisPrime.chroma + otherPrime.chroma) / 2;
      const deltaHuePrime = thisPrime.hueDelta(otherPrime);
      const deltaHPrime = 2 * Math.sqrt(thisPrime.chroma * otherPrime.chroma) * Math.sin(toRadians(deltaHuePrime / 2));
      const meanHuePrime = thisPrime.meanHue(otherPrime);
      const t = 1 - 0.17 * Math.cos(toRadians(meanHuePrime - 30)) + 0.24 * Math.cos(toRadians(2 * meanHuePrime)) + 0.32 * Math.cos(toRadians(3 * meanHuePrime + 6)) - 0.2 * Math.cos(toRadians(4 * meanHuePrime - 63));
      const sL = 1 + 0.015 * Math.pow(meanLightness - 50, 2) / Math.sqrt(20 + Math.pow(meanLightness - 50, 2));
      const sC = 1 + 0.045 * meanChromaPrime;
      const sH = 1 + 0.015 * meanChromaPrime * t;
      const rT = -2 * Math.sqrt(Math.pow(meanChromaPrime, 7) / (Math.pow(meanChromaPrime, 7) + Math.pow(25, 7))) * Math.sin(toRadians(60 * Math.exp(-Math.pow((meanHuePrime - 275) / 25, 2))));
      return Math.sqrt(Math.pow(deltaLightness / sL, 2) + Math.pow(deltaChromaPrime / sC, 2) + Math.pow(deltaHPrime / sH, 2) + rT * (deltaChromaPrime / sC) * (deltaHPrime / sH));
    }
    toLabColor() {
      const { lightness, chroma, hue, alpha } = this;
      const a = chroma * Math.cos(toRadians(hue));
      const b = chroma * Math.sin(toRadians(hue));
      return new LabColor(lightness, a, b, alpha);
    }
    minus(other) {
      const newLightness = this.lightness - other.lightness;
      const newChroma = this.chroma - other.chroma;
      const newHue = this.hue - other.hue;
      return new _a5(newLightness, newChroma, newHue);
    }
    adjustLightness(block) {
      const { lightness, chroma, hue, alpha } = this;
      return new _a5(block(lightness), chroma, hue, alpha);
    }
    adjustChroma(block) {
      const { lightness, chroma, hue, alpha } = this;
      return new _a5(lightness, block(chroma), hue, alpha);
    }
    adjustHue(block) {
      const { lightness, chroma, hue, alpha } = this;
      return new _a5(lightness, chroma, block(hue), alpha);
    }
    hueDelta(other) {
      const { hue } = this;
      if (hue - other.hue >= -180 && hue - other.hue <= 180) {
        return hue - other.hue;
      }
      if (hue <= other.hue) {
        return hue - other.hue + 360;
      }
      return hue - other.hue - 360;
    }
    meanHue(other) {
      const { hue } = this;
      if (hue - other.hue >= -180 && hue - other.hue <= 180) {
        return (other.hue + hue) / 2;
      }
      if (other.hue + hue < 360) {
        return (other.hue + hue + 360) / 2;
      }
      return (other.hue + hue - 360) / 2;
    }
  }, __name(_a5, "LchColor"), _a5);
  var _a6;
  var GoldenPalette = (_a6 = class {
    constructor(colors) {
      __publicField(this, "colors");
      __publicField(this, "lightnessFactors", [
        2.048875457,
        5.124792061,
        8.751659557,
        12.07628774,
        13.91449542,
        15.92738893,
        15.46585818,
        15.09779227,
        15.13738673,
        15.09818372
      ]);
      __publicField(this, "chromaFactors", [
        1.762442714,
        4.213532634,
        7.395827458,
        11.07174158,
        13.89634504,
        16.37591477,
        16.27071136,
        16.54160806,
        17.35916727,
        19.88410864
      ]);
      this.colors = colors;
    }
    minDeltaE(color) {
      const colorDeltaList = this.colors.map((classColor) => color.deltaE(classColor));
      return Math.min(...colorDeltaList);
    }
    getClosestColor(color) {
      const colorDeltaList = this.colors.map((classColor) => color.deltaE(classColor));
      const minDeltaOfColors = Math.min(...colorDeltaList);
      const indexOfColorDeltaList = colorDeltaList.indexOf(minDeltaOfColors);
      return this.colors[indexOfColorDeltaList];
    }
    createCustomPalette(customBaseColor, options) {
      const { seedLightnessGap = 1.7, chromaBoostCap = 1.25 } = options ?? {};
      let maxLightness = 100;
      const closestGoldenPaletteColor = this.getClosestColor(customBaseColor);
      const closestColorIndex = this.colors.indexOf(closestGoldenPaletteColor);
      const adjustMaxLightness = /* @__PURE__ */ __name((color) => coerceAtLeast(color.getLightness() - seedLightnessGap, 0), "adjustMaxLightness");
      return this.colors.map((color, index) => {
        if (color === closestGoldenPaletteColor) {
          maxLightness = adjustMaxLightness(customBaseColor);
          return customBaseColor;
        }
        const adjustedColor = color.minus(closestGoldenPaletteColor.minus(customBaseColor).adjustLightness((lightness) => lightness * (this.lightnessFactors[index] / this.lightnessFactors[closestColorIndex])).adjustChroma((chroma) => chroma * (this.hasMainColorLowChroma() ? 1 : coerceAtMost(this.chromaFactors[index] / this.chromaFactors[closestColorIndex], chromaBoostCap)))).adjustLightness((lightness) => coerceIn(lightness, 0, maxLightness)).adjustChroma((chroma) => coerceAtLeast(chroma, 0)).adjustHue((hue) => (hue + 360) % 360);
        maxLightness = adjustMaxLightness(adjustedColor);
        return adjustedColor;
      });
    }
    hasMainColorLowChroma() {
      return this.colors[5].getChroma() < 30;
    }
  }, __name(_a6, "GoldenPalette"), _a6);
  var lab = /* @__PURE__ */ __name((lightness, a, b) => new LabColor(lightness, a, b).toLchColor(), "lab");
  var goldenPalettes = [
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
      lab(39.555187078007386, 58.703681355389975, 41.66495027798629)
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
      lab(29.699290034849604, 51.90485023721311, -4.830186634107636)
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
      lab(23.16724235420436, 48.51764437280498, -55.16267949015293)
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
      lab(21.98627670328218, 44.29296076245473, -60.93653655172098)
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
      lab(19.751201587921678, 30.60784576895101, -52.13866519297474)
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
      lab(32.17757793894193, 18.96054990229354, -53.45146365049088)
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
      lab(36.34401147057282, 5.067812404713545, -43.11786257561915)
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
      lab(36.52725894264432, -22.129641744194515, -9.176159146894303)
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
      lab(28.58363043701477, -24.585465516136413, 1.8037402162492389)
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
      lab(34.685655305814514, -34.75343878510312, 28.866739034359767)
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
      lab(39.41191983353878, -32.80460974352642, 35.255490585630014)
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
      lab(49.498610881452535, -6.485230564384715, 49.67432722833751)
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
      lab(65.48207757431567, 39.647064970476094, 68.34872841768654)
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
      lab(63.86460405565717, 50.94648214505959, 72.17815682124423)
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
      lab(54.77571742962287, 55.282751019360035, 65.10193403547922)
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
      lab(43.86477994548343, 52.970887703910726, 52.30067989225532)
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
      lab(18.35055226514404, 10.225725550338765, 7.058582769882571)
    ]),
    new GoldenPalette([
      lab(98.27202740980219, -16418393644634932e-21, 6567357457853973e-21),
      lab(96.53749336548567, -1616917905122861e-20, 6467671598286984e-21),
      lab(94.0978378987781, -1581865383126768e-20, 6327461532507073e-21),
      lab(89.17728373493613, -1511167768697419e-20, 6044671074789676e-21),
      lab(76.61119902231323, -1330620591488696e-20, 5322482343750323e-21),
      lab(65.11424774127516, -11654345155598378e-21, 4661738062239351e-21),
      lab(49.238989620828065, -9373417431124409e-21, 37493669724497636e-22),
      lab(41.14266843804848, -8210152946386273e-21, 32840611896567395e-22),
      lab(27.974857206003705, -6318226192236764e-21, 25272904768947058e-22),
      lab(12.740011331302725, -4129311698131133e-21, 16517246792524531e-22)
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
      lab(19.958338450799914, -3.3116721453186617, -5.4486142104736786)
    ])
  ];
  var toRgbColorOrNull = /* @__PURE__ */ __name((hexColor) => {
    const rgbAsInt = parseInt(hexColor, 16);
    let rgbColor = null;
    if (hexColor.length === 8) {
      const red = (rgbAsInt >> 24 & 255) / 255;
      const green = (rgbAsInt >> 16 & 255) / 255;
      const blue = (rgbAsInt >> 8 & 255) / 255;
      const alpha = (rgbAsInt & 255) / 255;
      rgbColor = new RgbColor(red, green, blue, alpha);
    }
    if (hexColor.length === 6) {
      const red = (rgbAsInt >> 16 & 255) / 255;
      const green = (rgbAsInt >> 8 & 255) / 255;
      const blue = (rgbAsInt & 255) / 255;
      rgbColor = new RgbColor(red, green, blue);
    }
    return rgbColor;
  }, "toRgbColorOrNull");
  var createPalette = /* @__PURE__ */ __name((hslColor, options) => {
    const lchColor = hslColor.toRgbColor().toXyzColor().toLabColor().toLchColor();
    const customPalette = getClosestGoldenPalette(lchColor).createCustomPalette(lchColor, options);
    const customPaletteAsRgb = customPalette.map((color) => color.toLabColor().toXyzColor().toRgbColor());
    return customPaletteAsRgb;
  }, "createPalette");
  var getClosestGoldenPalette = /* @__PURE__ */ __name((color) => {
    const goldenPaletteMinDeltaList = goldenPalettes.map((goldenPalette) => {
      return goldenPalette.minDeltaE(color);
    });
    const goldenPaletteMinDelta = Math.min(...goldenPaletteMinDeltaList);
    const indexOfGoldenPaletteMinDelta = goldenPaletteMinDeltaList.indexOf(goldenPaletteMinDelta);
    return goldenPalettes[indexOfGoldenPaletteMinDelta];
  }, "getClosestGoldenPalette");
  var createPrimaryPalette = /* @__PURE__ */ __name((hexColor, options) => {
    const hexToRgbColor = toRgbColorOrNull(hexColor);
    if (hexToRgbColor == null) {
      return null;
    }
    const hslColor = hexToRgbColor.toHslColor();
    return createPalette(hslColor, options);
  }, "createPrimaryPalette");

  // src/utils/toThemeColorHex.ts
  function toThemeColorHex(color) {
    const normalized = toRGBString(color.trim());
    if (/^#[0-9a-f]{6}$/.test(normalized)) {
      return normalized.slice(1);
    }
    const rgba = normalized.match(/^#([0-9a-f]{6})[0-9a-f]{2}$/i);
    if (rgba) {
      return rgba[1].toLowerCase();
    }
    return "000000";
  }
  __name(toThemeColorHex, "toThemeColorHex");

  // src/utils/generateThemeGradientColors.ts
  function generateThemeGradientColors(color, options) {
    const customPrimaryPalette = createPrimaryPalette(toThemeColorHex(color), options);
    return customPrimaryPalette.map((rgbColor) => `#${rgbColor.rgbHex}`);
  }
  __name(generateThemeGradientColors, "generateThemeGradientColors");

  // src/utils/generateThemeColorVars.ts
  function generateThemeColorVars(color, options) {
    const { prefix, reverse = false, seedLightnessGap, chromaBoostCap } = Object.assign({}, options);
    const colors = generateThemeGradientColors(color, {
      seedLightnessGap,
      chromaBoostCap
    });
    if (reverse) colors.reverse();
    const vars = {};
    colors.reduce((all, cur, i) => {
      vars[`${prefix}${i}`] = cur;
      return all;
    }, {});
    return vars;
  }
  __name(generateThemeColorVars, "generateThemeColorVars");

  // src/utils/mapSelector.ts
  function mapCssSelector(selectors, attrs, includeEmpty = false) {
    const attrMap = Object.entries(attrs).map(([name, value]) => {
      return !value || typeof value === "string" && value.trim() === "" ? `[${name}]` : `[${name}='${value}']`;
    }).join("");
    const results = [];
    if (includeEmpty) results.push(selectors.join(","));
    if (Object.keys(attrs).length > 0) {
      results.push(selectors.map((selector) => {
        if (selector === ":host") {
          return `${selector}(${attrMap})`;
        } else {
          return `${selector}${attrMap}`;
        }
      }).join(","));
    } else {
      if (!includeEmpty) results.push(selectors.join(","));
    }
    return results.join(",");
  }
  __name(mapCssSelector, "mapCssSelector");

  // src/utils/toVarStyles.ts
  function toVarStyles(vars) {
    return `${Object.entries(vars).filter((e) => e[1] !== void 0).map(([key, value]) => {
      return value ? `    ${key}:${value}` : void 0;
    }).join(";\n")};`;
  }
  __name(toVarStyles, "toVarStyles");

  // src/utils/getVarsStyles.ts
  function getVarsStyles(vars, selectors, attrName, isRootScope = true) {
    return Object.entries(vars).map(([key, value]) => {
      const strSelector = mapCssSelector(selectors, {
        [attrName]: key
      });
      const elemSelector = isRootScope ? `[${attrName}=${key}]` : selectors.map((s) => `${s} [${attrName}=${key}]`).join(",");
      return `${strSelector},${elemSelector}{
${toVarStyles(value)}
}`;
    }).join("\n");
  }
  __name(getVarsStyles, "getVarsStyles");

  // src/utils/staticFingerprint.ts
  var STATIC_FINGERPRINT_VAR = "--x-theme-static";
  var STATIC_SCHEMA = 2;
  var DEFAULT_SEED_LIGHTNESS_GAP = 1.7;
  var DEFAULT_CHROMA_BOOST_CAP = 1.25;
  var STATIC_DEFAULT_DIMENSIONS = {
    dark: false,
    colorized: false,
    size: "medium",
    spacing: "medium",
    shadow: "medium",
    radius: "medium"
  };
  var FIELD_LABELS = [
    "schema",
    "\u4E3B\u9898\u8272",
    "\u660E\u5EA6\u95F4\u9694(seedLightnessGap)",
    "\u5F69\u5EA6\u4E0A\u9650(chromaBoostCap)",
    "primary",
    "success",
    "warning",
    "danger",
    "info"
  ];
  var COLOR_FIELD_COUNT = 9;
  var FINGERPRINT_FIELD_COUNT = 15;
  var isHexLiteral = /* @__PURE__ */ __name((value) => /^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(value.trim()), "isHexLiteral");
  function resolveThemeHex(color) {
    const source = (color ?? "").trim();
    if (source in presetThemes) return presetThemes[source].color.toLowerCase();
    return toRGBString(source).toLowerCase();
  }
  __name(resolveThemeHex, "resolveThemeHex");
  function resolveSeed(value) {
    const v = (value ?? "").trim();
    if (!v) return "";
    if (isHexLiteral(v)) return toRGBString(v).toLowerCase();
    return v;
  }
  __name(resolveSeed, "resolveSeed");
  function gapField(value) {
    return String(value ?? DEFAULT_SEED_LIGHTNESS_GAP);
  }
  __name(gapField, "gapField");
  function capField(value) {
    return String(value ?? DEFAULT_CHROMA_BOOST_CAP);
  }
  __name(capField, "capField");
  var boolField = /* @__PURE__ */ __name((value) => value ? "1" : "0", "boolField");
  var sizeField = /* @__PURE__ */ __name((value) => value ?? STATIC_DEFAULT_DIMENSIONS.size, "sizeField");
  function buildStaticFingerprint(options) {
    return [
      `v${STATIC_SCHEMA}`,
      resolveThemeHex(options.themeColor),
      gapField(options.seedLightnessGap),
      capField(options.chromaBoostCap),
      resolveSeed(options.primary),
      resolveSeed(options.success),
      resolveSeed(options.warning),
      resolveSeed(options.danger),
      resolveSeed(options.info),
      boolField(options.dark),
      boolField(options.colorized),
      sizeField(options.size),
      sizeField(options.spacing),
      sizeField(options.shadow),
      sizeField(options.radius)
    ].join("|");
  }
  __name(buildStaticFingerprint, "buildStaticFingerprint");
  function staticFingerprintRule(options) {
    return `:host,:root{${STATIC_FINGERPRINT_VAR}:${buildStaticFingerprint(options)};}
`;
  }
  __name(staticFingerprintRule, "staticFingerprintRule");
  function parseStaticFingerprint(token) {
    const parts = (token ?? "").trim().split("|");
    if (parts.length !== FINGERPRINT_FIELD_COUNT || parts.some((p) => p === "")) return null;
    return parts;
  }
  __name(parseStaticFingerprint, "parseStaticFingerprint");
  function parseStaticDimensions(token) {
    const parts = parseStaticFingerprint(token);
    if (!parts) return null;
    return {
      dark: parts[9] === "1",
      colorized: parts[10] === "1",
      size: parts[11],
      spacing: parts[12],
      shadow: parts[13],
      radius: parts[14]
    };
  }
  __name(parseStaticDimensions, "parseStaticDimensions");
  function normalizeField(field) {
    return /^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(field) ? field.toLowerCase() : field;
  }
  __name(normalizeField, "normalizeField");
  function matchStaticFingerprint(token, options) {
    const actual = parseStaticFingerprint(token);
    if (!actual) return false;
    const expected = buildStaticFingerprint(options).split("|");
    return actual.slice(0, COLOR_FIELD_COUNT).every((field, i) => normalizeField(field) === expected[i]);
  }
  __name(matchStaticFingerprint, "matchStaticFingerprint");
  function describeStaticMismatch(token, options) {
    const actual = parseStaticFingerprint(token);
    if (!actual) return "\u9759\u6001\u4E3B\u9898\u5305\u6307\u7EB9\u683C\u5F0F\u975E\u6CD5\uFF08\u5B57\u6BB5\u7F3A\u5931\u6216\u635F\u574F\uFF09";
    const expected = buildStaticFingerprint(options).split("|").slice(0, COLOR_FIELD_COUNT).map(normalizeField);
    for (let i = 0; i < expected.length; i++) {
      if (actual[i] !== expected[i]) {
        return `${FIELD_LABELS[i]} \u9759\u6001\u503C=${actual[i]}\uFF0C\u751F\u6548\u503C=${expected[i]}`;
      }
    }
    return "\u672A\u77E5\u5931\u914D";
  }
  __name(describeStaticMismatch, "describeStaticMismatch");
  var VAR_REF_RE = /^var\(\s*(--[A-Za-z0-9-]+)\s*(?:,[^)]*)?\)$/;
  function resolveVarSeeds(options, lookup) {
    const resolve = /* @__PURE__ */ __name((value) => {
      const v = (value ?? "").trim();
      const match = v.match(VAR_REF_RE);
      if (!match) return value;
      const resolved = lookup(match[1]).trim();
      return resolved || value;
    }, "resolve");
    return {
      ...options,
      primary: resolve(options.primary),
      success: resolve(options.success),
      warning: resolve(options.warning),
      danger: resolve(options.danger),
      info: resolve(options.info)
    };
  }
  __name(resolveVarSeeds, "resolveVarSeeds");
  function resolveFingerprintOptions(options, docRoot) {
    let view;
    try {
      view = docRoot.ownerDocument?.defaultView;
    } catch {
      return options;
    }
    if (!view) return options;
    return resolveVarSeeds(options, (name) => {
      try {
        return view.getComputedStyle(docRoot).getPropertyValue(name);
      } catch {
        return "";
      }
    });
  }
  __name(resolveFingerprintOptions, "resolveFingerprintOptions");
  function readStaticFingerprint(docRoot) {
    try {
      return docRoot.ownerDocument?.defaultView?.getComputedStyle(docRoot).getPropertyValue(STATIC_FINGERPRINT_VAR).trim() ?? "";
    } catch {
      return "";
    }
  }
  __name(readStaticFingerprint, "readStaticFingerprint");

  // src/vars/base.ts
  var baseVars = {
    "--x-border-radius-none": "none",
    "--x-border-radius-x-small": "0.2rem",
    "--x-border-radius-small": "0.3rem",
    "--x-border-radius-medium": "0.5rem",
    "--x-border-radius-large": "0.8rem",
    "--x-border-radius-x-large": "1rem",
    "--x-border-radius-circle": "50%",
    "--x-border-radius-pill": "9999px",
    "--x-shadow-none": "none",
    "--x-shadow-x-small": "0 1px 2px hsl(240 3.8% 46.1% / 6%)",
    "--x-shadow-small": "0 1px 2px hsl(240 3.8% 46.1% / 12%)",
    "--x-shadow-medium": "0 2px 4px hsl(240 3.8% 46.1% / 12%)",
    "--x-shadow-large": "0 2px 8px hsl(240 3.8% 46.1% / 12%)",
    "--x-shadow-x-large": "0 4px 16px hsl(240 3.8% 46.1% / 12%)",
    "--x-font-size-x-small": "0.75rem",
    "--x-font-size-small": "0.875rem",
    "--x-font-size-medium": "1rem",
    "--x-font-size-large": "1.125rem",
    "--x-font-size-x-large": "1.25rem",
    "--x-font-weight-x-small": "200",
    "--x-font-weight-small": "300",
    "--x-font-weight-medium": "400",
    "--x-font-weight-large": "500",
    "--x-font-weight-x-large": "600",
    /* 间距 */
    "--x-spacing-none": "0",
    "--x-spacing-x-small": "0.4rem",
    "--x-spacing-small": "0.6rem",
    "--x-spacing-medium": "0.8rem",
    "--x-spacing-large": "1.0rem",
    "--x-spacing-x-large": "1.2rem",
    /* 行高 */
    "--x-line-height-x-small": "var(--x-spacing-medium)* 1.5",
    "--x-line-height-small": "calc(var(--x-spacing-medium) * 1.7)",
    "--x-line-height-medium": "calc(var(--x-spacing-medium) * 1.9)",
    "--x-line-height-large": "calc(var(--x-spacing-medium) * 2.1)",
    "--x-line-height-x-large": "calc(var(--x-spacing-medium) * 2.3)",
    /* 字间距 */
    "--x-letter-spacing-x-small": "calc(var(--x-spacing-medium) * 0.02)",
    "--x-letter-spacing-small": "calc(var(--x-spacing-medium) * 0.04)",
    "--x-letter-spacing-medium": "calc(var(--x-spacing-medium) * 0.06)",
    "--x-letter-spacing-large": "calc(var(--x-spacing-medium) * 0.08)",
    "--x-letter-spacing-x-large": "calc(var(--x-spacing-medium) * 0.1)",
    "--x-icon-size-x-small": "calc(1.2 * var(--x-font-size-x-small))",
    "--x-icon-size-small": "calc(1.2 * var(--x-font-size-small))",
    "--x-icon-size-medium": "calc(1.2 * var(--x-font-size-medium))",
    "--x-icon-size-large": "calc(1.2 * var(--x-font-size-large))",
    "--x-icon-size-x-large": "calc(1.2 * var(--x-font-size-x-large))"
  };

  // src/vars/derived.ts
  var derivedVars = {
    /* 语义色调 */
    "--auto-primary-color": "var(--x-color-primary)",
    "--auto-success-color": "var(--x-color-success)",
    "--auto-danger-color": "var(--x-color-danger)",
    "--auto-warning-color": "var(--x-color-warning)",
    "--auto-info-color": "var(--x-color-info)",
    "--auto-theme-color": "var(--x-color-theme-5)",
    /** 活动颜色 */
    "--auto-selected-color": "var(--x-color-theme-5)!important",
    "--auto-selected-bgcolor": "color-mix(in srgb, var(--auto-selected-color), transparent 80% )!important",
    "--auto-hover-color": "var(--auto-theme-color)!important",
    "--auto-hover-bgcolor": "color-mix(in srgb, var(--auto-hover-color), transparent 85%)!important",
    "--auto-active-color": "var(--x-color-theme-8)!important",
    "--auto-active-bgcolor": "color-mix(in srgb, var(--auto-active-color), transparent 85%)!important",
    "--auto-disable-color": "color-mix(in srgb, var(--x-color-8), gray 50%)!important",
    "--auto-disable-bgcolor": "color-mix(in srgb, currentColor, transparent 80%)!important",
    /* 字体颜色 */
    /* 字体颜色：三档引用 color 标尺的 1/3/4 档（light 下 59/109/149，档距均匀；
    * 次要文字白底对比约 5.3:1 达 WCAG AA。勿取相邻档（次要/辅助难分）或跨 4 档（梯度失衡） */
    "--auto-color": "var(--x-color-1)",
    "--auto-text-color": "var(--auto-color)",
    "--auto-secondary-color": "color-mix(in srgb, var(--x-color-1), transparent 25%)",
    "--auto-third-color": "color-mix(in srgb, var(--x-color-1), transparent 45%)",
    /* 背景颜色: 用于面板/对话框/组件的背景 */
    /* 背景语义按透明度阶梯区分：面板为实色容器，次级/内嵌为同一原料（bgcolor-2）的不同不透明度叠加
    * （45% / 75%），light 与 dark 下均落在可辨区间；!important 移除（模式覆盖作用于基变量，此处无需） */
    "--auto-bgcolor": "var(--x-bgcolor-0)",
    "--auto-secondary-bgcolor": "color-mix(in srgb, var(--x-bgcolor-2), transparent 55%)",
    "--auto-third-bgcolor": "color-mix(in srgb, var(--x-bgcolor-2), transparent 25%)",
    "--auto-workspace-bgcolor": "var(--x-bgcolor-1)",
    /* 边框 */
    "--auto-border-size": "1px",
    "--auto-border-color": "var(--x-color-6)",
    "--auto-border": "var(--auto-border-size) solid var(--auto-border-color)",
    // hover
    "--auto-hover-border-color": "var(--auto-hover-color)",
    "--auto-hover-border": "1px solid var(--auto-hover-border-color)",
    // selected
    "--auto-selected-border-color": "var(--auto-selected-color)",
    "--auto-selected-border": "1px solid var(--auto-selected-border-color)",
    // active
    "--auto-active-border-color": "var(--auto-active-color)",
    "--auto-active-border": "1px solid var(--auto-active-border-color)",
    // disable
    "--auto-disable-border-color": "var(--auto-disable-color)",
    "--auto-disable-border": "1px solid var(--auto-disable-border-color)",
    /* 排版/字体 */
    "--auto-font": "var(--x-font-weight-medium) var(--auto-font-size)/1.5 var(--auto-font-family)",
    "--auto-text": "var(--x-font)",
    "--auto-font-family": "Lantinghei SC,Microsoft Yahei,Hiragino Sans GB,Microsoft Sans Serif,WenQuanYi Micro Hei,sans-serif",
    "--auto-font-size": "var(--x-font-size-medium)",
    "--auto-text-size": "var(--x-font-size)",
    "--auto-font-weight": "var(--x-font-weight-medium)",
    "--auto-letter-spacing": "var(--x-letter-spacing-medium)",
    "--auto-line-height": "var(--x-line-height-medium)",
    "--auto-title-font": "calc(var(--auto-font-weight) + 100) calc(var(--auto-font-size) * 1.05)/1.5 var(--auto-font-family)",
    /* 面板: 用于导航/标题栏/标签页标题 */
    "--auto-panel-header-color": "var(--auto-color)",
    "--auto-panel-header": "var(--auto-title-font)",
    /** 标题背景颜色：用于标题/标题栏的背景颜色*/
    "--auto-panel-header-bgcolor": "var(--auto-secondary-bgcolor)",
    /* 面板背景颜色：用于面板/区块/Drawer等背景颜色*/
    "--auto-panel-bgcolor": "var(--auto-bgcolor)",
    /* 边框/间距 */
    "--auto-border-radius": "var(--x-border-radius-medium)",
    "--auto-spacing": "var(--x-spacing-medium)",
    "--auto-padding": "var(--x-spacing-medium)",
    "--auto-margin": "var(--x-spacing-medium)",
    "--auto-shadow": "var(--x-shadow-medium)",
    /* 输入框 */
    /** 输入框背景颜色：用于输入框背景颜色*/
    "--auto-input-font": "var(--auto-font)",
    "--auto-input-border": "var(--auto-border)",
    "--auto-input-bgcolor": "var(--auto-bgcolor)",
    /** 输入框占位符颜色：主文字色 40% 不透明（弱于三档正文，随模式自动适配） */
    "--auto-input-placeholder": "color-mix(in srgb, var(--auto-color), transparent 60%)",
    "--auto-input-padding": "var(--auto-padding)",
    "--auto-input-radius": "var(--auto-border-radius)",
    "--auto-input-height": "var(--auto-line-height)",
    /** 其他 */
    "--auto-icon-size": "var(--x-icon-size-medium)"
  };
  var scaleVarKeys = /* @__PURE__ */ new Set([
    "--auto-border-size",
    "--auto-font",
    "--auto-text",
    "--auto-font-family",
    "--auto-font-size",
    "--auto-text-size",
    "--auto-font-weight",
    "--auto-letter-spacing",
    "--auto-line-height",
    "--auto-title-font",
    "--auto-panel-header",
    "--auto-border-radius",
    "--auto-spacing",
    "--auto-padding",
    "--auto-margin",
    "--auto-shadow",
    "--auto-input-font",
    "--auto-input-padding",
    "--auto-input-radius",
    "--auto-input-height",
    "--auto-icon-size"
  ]);
  var derivedColorVars = Object.fromEntries(Object.entries(derivedVars).filter(([key]) => !scaleVarKeys.has(key)));
  var darkDerivedVars = {
    /* 主色基准：交互文字/primary 上游随此联动（hover-color 等引用 --auto-theme-color） */
    "--auto-theme-color": "var(--x-color-theme-6)",
    /* 交互态：selected-color 由 theme-5 提至主色同档；bgcolor 与 light 同百分比即感知对称 */
    "--auto-selected-color": "var(--auto-theme-color)!important",
    "--auto-selected-bgcolor": "color-mix(in srgb, var(--auto-selected-color), transparent 82%)!important",
    "--auto-hover-bgcolor": "color-mix(in srgb, var(--auto-hover-color), transparent 85%)!important",
    "--auto-active-bgcolor": "color-mix(in srgb, var(--auto-active-color), transparent 85%)!important",
    /* 禁用态：derivedVars 取 --x-color-8（dark 下为深灰，对面板仅 ≈1.9:1 近乎消失），
     * 提至中灰档保底可辨（≈4.3:1，仍明显弱于正文 13.5） */
    "--auto-disable-color": "color-mix(in srgb, var(--x-color-8), gray 80%)!important",
    /* 边框提亮（覆盖后 --auto-border 等引用自动跟随） */
    "--auto-border-color": "var(--x-color-8)",
    /* 输入框凹陷：dark 下 --x-bgcolor-1 为工作区最沉色 */
    "--auto-input-bgcolor": "var(--x-bgcolor-1)"
  };

  // src/vars/size.ts
  function getSizeVars(size) {
    return {
      /** 段落与字体 */
      "--auto-font-size": `var(--x-font-size-${size})`,
      "--auto-font-weight": `var(--x-font-weight-${size})`,
      "--auto-letter-spacing": `var(--x-letter-spacing-${size})`,
      "--auto-line-height": `var(--x-line-height-${size})`,
      /*
       * font 速写必须在每个档位选择器内重定义：
       * CSS 自定义属性的 var() 替换发生在定义元素（:root）的 computed value 阶段，
       * 若仅在 derivedVars（裸选择器）以 var(--auto-font-size) 组合定义，
       * 子元素继承的是已展开的具体值——局部 data-size 容器内无法联动。
       */
      "--auto-font": `var(--x-font-weight-${size}) var(--x-font-size-${size})/1.5 var(--auto-font-family)`,
      "--auto-title-font": `calc(var(--x-font-weight-${size}) + 200) calc(var(--x-font-size-${size}) * 1.05)/1.5 var(--auto-font-family)`,
      /* 用于内边距和外边距 */
      "--auto-spacing": `var(--x-spacing-${size})`,
      "--auto-padding": `var(--x-spacing-${size})`,
      "--auto-margin": `var(--x-spacing-${size})`,
      "--auto-shadow": `var(--x-shadow-${size})`,
      "--auto-icon-size": `calc(1.5 * var(--x-font-size-${size}))`,
      /* 输入框 */
      "--auto-input-height": `var(--x-input-height-${size})`,
      /* 消费方（button.less/input.less）取 var(--auto-input-padding)——它在 derivedVars
       * 中组合 var(--auto-padding)，仅 :root 有值（继承已替换值），局部档位容器不联动；
       * 与 --auto-padding 同步按档直引梯度重定义。 */
      "--auto-input-padding": `var(--x-spacing-${size})`
    };
  }
  __name(getSizeVars, "getSizeVars");
  var sizeVars = {
    "x-small": getSizeVars("x-small"),
    small: getSizeVars("small"),
    medium: getSizeVars("medium"),
    large: getSizeVars("large"),
    "x-large": getSizeVars("x-large")
  };

  // src/vars/radius.ts
  function getRadiusVars(radius) {
    return {
      "--auto-border-radius": `var(--x-border-radius-${radius})!important`
    };
  }
  __name(getRadiusVars, "getRadiusVars");
  var radiusVars = {
    "none": getRadiusVars("none"),
    "x-small": getRadiusVars("x-small"),
    small: getRadiusVars("small"),
    medium: getRadiusVars("medium"),
    large: getRadiusVars("large"),
    "x-large": getRadiusVars("x-large")
  };

  // src/vars/spacing.ts
  function getSpacingVars(spacing) {
    return {
      "--auto-spacing": `var(--x-spacing-${spacing}) !important`,
      "--auto-padding": `var(--x-spacing-${spacing}) !important`,
      "--auto-margin": `var(--x-spacing-${spacing}) !important`,
      /* 消费方（button.less/input.less）取 var(--auto-input-padding)——它在
       * derivedVars 中组合 var(--auto-padding)，与 --auto-padding 同步按档直引梯度。 */
      "--auto-input-padding": `var(--x-spacing-${spacing}) !important`
    };
  }
  __name(getSpacingVars, "getSpacingVars");
  var spacingVars = {
    "none": getSpacingVars("none"),
    "x-small": getSpacingVars("x-small"),
    small: getSpacingVars("small"),
    medium: getSpacingVars("medium"),
    large: getSpacingVars("large"),
    "x-large": getSpacingVars("x-large")
  };

  // src/vars/shadow.ts
  function getShadowVars(size) {
    return {
      "--auto-shadow": `var(--x-shadow-${size})!important`
    };
  }
  __name(getShadowVars, "getShadowVars");
  var shadowVars = {
    "none": getShadowVars("none"),
    "x-small": getShadowVars("x-small"),
    small: getShadowVars("small"),
    medium: getShadowVars("medium"),
    large: getShadowVars("large"),
    "x-large": getShadowVars("x-large")
  };
  var darkShadowVars = {
    "--x-shadow-x-small": "0 1px 2px hsl(0 0% 0% / 35%)",
    "--x-shadow-small": "0 1px 2px hsl(0 0% 0% / 45%)",
    "--x-shadow-medium": "0 2px 4px hsl(0 0% 0% / 50%)",
    "--x-shadow-large": "0 2px 8px hsl(0 0% 0% / 55%)",
    "--x-shadow-x-large": "0 4px 16px hsl(0 0% 0% / 60%)",
    "--auto-shadow": "var(--x-shadow-medium)"
  };

  // src/vars/light.ts
  var lightColorVars = {
    /* 灰色方向（亮：color-0 最深文字 gray-9，递亮至 color-9=gray-0） */
    "--x-plain-color-0": "var(--x-color-gray-9)",
    "--x-plain-color-1": "var(--x-color-gray-8)",
    "--x-plain-color-2": "var(--x-color-gray-7)",
    "--x-plain-color-3": "var(--x-color-gray-6)",
    "--x-plain-color-4": "var(--x-color-gray-5)",
    "--x-plain-color-5": "var(--x-color-gray-4)",
    "--x-plain-color-6": "var(--x-color-gray-3)",
    "--x-plain-color-7": "var(--x-color-gray-2)",
    "--x-plain-color-8": "var(--x-color-gray-1)",
    "--x-plain-color-9": "var(--x-color-gray-0)",
    "--x-plain-bgcolor-0": "var(--x-color-gray-0)",
    "--x-plain-bgcolor-1": "var(--x-color-gray-1)",
    "--x-plain-bgcolor-2": "var(--x-color-gray-2)",
    "--x-plain-bgcolor-3": "var(--x-color-gray-3)",
    "--x-plain-bgcolor-4": "var(--x-color-gray-4)",
    "--x-plain-bgcolor-5": "var(--x-color-gray-5)",
    "--x-plain-bgcolor-6": "var(--x-color-gray-6)",
    "--x-plain-bgcolor-7": "var(--x-color-gray-7)",
    "--x-plain-bgcolor-8": "var(--x-color-gray-8)",
    "--x-plain-bgcolor-9": "var(--x-color-gray-9)",
    /* 多彩映射（亮：color-i=theme-{9-i} 深底浅字，bgcolor-i=theme-i） */
    "--x-tinted-color-0": "var(--x-color-theme-9)",
    "--x-tinted-color-1": "var(--x-color-theme-8)",
    "--x-tinted-color-2": "var(--x-color-theme-7)",
    "--x-tinted-color-3": "var(--x-color-theme-6)",
    "--x-tinted-color-4": "var(--x-color-theme-5)",
    "--x-tinted-color-5": "var(--x-color-theme-4)",
    "--x-tinted-color-6": "var(--x-color-theme-3)",
    "--x-tinted-color-7": "var(--x-color-theme-2)",
    "--x-tinted-color-8": "var(--x-color-theme-1)",
    "--x-tinted-color-9": "var(--x-color-theme-0)",
    "--x-tinted-bgcolor-0": "var(--x-color-theme-0)",
    "--x-tinted-bgcolor-1": "var(--x-color-theme-1)",
    "--x-tinted-bgcolor-2": "var(--x-color-theme-2)",
    "--x-tinted-bgcolor-3": "var(--x-color-theme-3)",
    "--x-tinted-bgcolor-4": "var(--x-color-theme-4)",
    "--x-tinted-bgcolor-5": "var(--x-color-theme-5)",
    "--x-tinted-bgcolor-6": "var(--x-color-theme-6)",
    "--x-tinted-bgcolor-7": "var(--x-color-theme-7)",
    "--x-tinted-bgcolor-8": "var(--x-color-theme-8)",
    "--x-tinted-bgcolor-9": "var(--x-color-theme-9)",
    /* 实际值：默认态（无属性）即灰色方向 */
    "--x-color-0": "var(--x-plain-color-0)",
    "--x-color-1": "var(--x-plain-color-1)",
    "--x-color-2": "var(--x-plain-color-2)",
    "--x-color-3": "var(--x-plain-color-3)",
    "--x-color-4": "var(--x-plain-color-4)",
    "--x-color-5": "var(--x-plain-color-5)",
    "--x-color-6": "var(--x-plain-color-6)",
    "--x-color-7": "var(--x-plain-color-7)",
    "--x-color-8": "var(--x-plain-color-8)",
    "--x-color-9": "var(--x-plain-color-9)",
    "--x-bgcolor-0": "var(--x-plain-bgcolor-0)",
    "--x-bgcolor-1": "var(--x-plain-bgcolor-1)",
    "--x-bgcolor-2": "var(--x-plain-bgcolor-2)",
    "--x-bgcolor-3": "var(--x-plain-bgcolor-3)",
    "--x-bgcolor-4": "var(--x-plain-bgcolor-4)",
    "--x-bgcolor-5": "var(--x-plain-bgcolor-5)",
    "--x-bgcolor-6": "var(--x-plain-bgcolor-6)",
    "--x-bgcolor-7": "var(--x-plain-bgcolor-7)",
    "--x-bgcolor-8": "var(--x-plain-bgcolor-8)",
    "--x-bgcolor-9": "var(--x-plain-bgcolor-9)"
  };
  var lightColorizedColorVars = {
    "--x-color-0": "var(--x-tinted-color-0)",
    "--x-color-1": "var(--x-tinted-color-1)",
    "--x-color-2": "var(--x-tinted-color-2)",
    "--x-color-3": "var(--x-tinted-color-3)",
    "--x-color-4": "var(--x-tinted-color-4)",
    "--x-color-5": "var(--x-tinted-color-5)",
    "--x-color-6": "var(--x-tinted-color-6)",
    "--x-color-7": "var(--x-tinted-color-7)",
    "--x-color-8": "var(--x-tinted-color-8)",
    "--x-color-9": "var(--x-tinted-color-9)",
    "--x-bgcolor-0": "var(--x-tinted-bgcolor-0)",
    "--x-bgcolor-1": "var(--x-tinted-bgcolor-1)",
    "--x-bgcolor-2": "var(--x-tinted-bgcolor-2)",
    "--x-bgcolor-3": "var(--x-tinted-bgcolor-3)",
    "--x-bgcolor-4": "var(--x-tinted-bgcolor-4)",
    "--x-bgcolor-5": "var(--x-tinted-bgcolor-5)",
    "--x-bgcolor-6": "var(--x-tinted-bgcolor-6)",
    "--x-bgcolor-7": "var(--x-tinted-bgcolor-7)",
    "--x-bgcolor-8": "var(--x-tinted-bgcolor-8)",
    "--x-bgcolor-9": "var(--x-tinted-bgcolor-9)"
  };
  var uncoloredColorVars = {
    "--x-color-0": "var(--x-plain-color-0)",
    "--x-color-1": "var(--x-plain-color-1)",
    "--x-color-2": "var(--x-plain-color-2)",
    "--x-color-3": "var(--x-plain-color-3)",
    "--x-color-4": "var(--x-plain-color-4)",
    "--x-color-5": "var(--x-plain-color-5)",
    "--x-color-6": "var(--x-plain-color-6)",
    "--x-color-7": "var(--x-plain-color-7)",
    "--x-color-8": "var(--x-plain-color-8)",
    "--x-color-9": "var(--x-plain-color-9)",
    "--x-bgcolor-0": "var(--x-plain-bgcolor-0)",
    "--x-bgcolor-1": "var(--x-plain-bgcolor-1)",
    "--x-bgcolor-2": "var(--x-plain-bgcolor-2)",
    "--x-bgcolor-3": "var(--x-plain-bgcolor-3)",
    "--x-bgcolor-4": "var(--x-plain-bgcolor-4)",
    "--x-bgcolor-5": "var(--x-plain-bgcolor-5)",
    "--x-bgcolor-6": "var(--x-plain-bgcolor-6)",
    "--x-bgcolor-7": "var(--x-plain-bgcolor-7)",
    "--x-bgcolor-8": "var(--x-plain-bgcolor-8)",
    "--x-bgcolor-9": "var(--x-plain-bgcolor-9)"
  };

  // src/vars/dark.ts
  var darkColorVars = {
    /* 灰色方向（暗：color-i=gray-i，color-0 最沉；背景与前景分离映射——
     * bgcolor-0（面板）取 gray-8 浮起于 bgcolor-1（工作区，最沉的 gray-9），
     * bgcolor-2..9 递亮供透明度叠加原料与扩展档使用，保证整条背景梯度单调） */
    "--x-plain-color-0": "var(--x-color-gray-0) !important",
    "--x-plain-color-1": "var(--x-color-gray-1) !important",
    "--x-plain-color-2": "var(--x-color-gray-2) !important",
    "--x-plain-color-3": "var(--x-color-gray-3) !important",
    "--x-plain-color-4": "var(--x-color-gray-4) !important",
    "--x-plain-color-5": "var(--x-color-gray-5) !important",
    "--x-plain-color-6": "var(--x-color-gray-6) !important",
    "--x-plain-color-7": "var(--x-color-gray-7) !important",
    "--x-plain-color-8": "var(--x-color-gray-8) !important",
    "--x-plain-color-9": "var(--x-color-gray-9) !important",
    "--x-plain-bgcolor-0": "var(--x-color-gray-8) !important",
    "--x-plain-bgcolor-1": "var(--x-color-gray-9) !important",
    "--x-plain-bgcolor-2": "var(--x-color-gray-7) !important",
    "--x-plain-bgcolor-3": "var(--x-color-gray-6) !important",
    "--x-plain-bgcolor-4": "var(--x-color-gray-5) !important",
    "--x-plain-bgcolor-5": "var(--x-color-gray-4) !important",
    "--x-plain-bgcolor-6": "var(--x-color-gray-3) !important",
    "--x-plain-bgcolor-7": "var(--x-color-gray-2) !important",
    "--x-plain-bgcolor-8": "var(--x-color-gray-1) !important",
    "--x-plain-bgcolor-9": "var(--x-color-gray-0) !important",
    /*
     * 多彩映射（暗：厚重的多彩暗底）。
     * ⚠ 关键前提：[dark] 下主题梯度已反转（theme-0=最深、theme-9=最浅），因此：
     * - 前景 color-i = theme-{9-i}，反转后 color-0 为最浅文字（深底浅字，
     *   与灰色方向前景一致）
     * - 背景结构与灰色方向同构（面板浮起）：
     *   bgcolor-0=theme-0（面板，各主题最深档——theme-1 作面板时 blue 下正文仅
     *   3.7:1 不达 AA，见 scripts/check-dark-contrast.ts）/ bgcolor-1=theme-0 混黑
     *   30%（工作区：彩色梯度无更深档可用，从最深档压暗保色相——多彩语义要求全域
     *   色调浸染，灰阶幕布会丢失多彩氛围且与 light colorized（工作区=theme-1）
     *   不对称）/ bgcolor-2..9=theme-2..9（透明度叠加原料起两档，与档位索引对齐）
     */
    "--x-tinted-color-0": "var(--x-color-theme-9) !important",
    "--x-tinted-color-1": "var(--x-color-theme-8) !important",
    "--x-tinted-color-2": "var(--x-color-theme-7) !important",
    "--x-tinted-color-3": "var(--x-color-theme-6) !important",
    "--x-tinted-color-4": "var(--x-color-theme-5) !important",
    "--x-tinted-color-5": "var(--x-color-theme-4) !important",
    "--x-tinted-color-6": "var(--x-color-theme-3) !important",
    "--x-tinted-color-7": "var(--x-color-theme-2) !important",
    "--x-tinted-color-8": "var(--x-color-theme-1) !important",
    "--x-tinted-color-9": "var(--x-color-theme-0) !important",
    "--x-tinted-bgcolor-0": "var(--x-color-theme-0) !important",
    "--x-tinted-bgcolor-1": "color-mix(in srgb, var(--x-color-theme-0), black 30%) !important",
    "--x-tinted-bgcolor-2": "var(--x-color-theme-2) !important",
    "--x-tinted-bgcolor-3": "var(--x-color-theme-3) !important",
    "--x-tinted-bgcolor-4": "var(--x-color-theme-4) !important",
    "--x-tinted-bgcolor-5": "var(--x-color-theme-5) !important",
    "--x-tinted-bgcolor-6": "var(--x-color-theme-6) !important",
    "--x-tinted-bgcolor-7": "var(--x-color-theme-7) !important",
    "--x-tinted-bgcolor-8": "var(--x-color-theme-8) !important",
    "--x-tinted-bgcolor-9": "var(--x-color-theme-9) !important",
    /* 实际值：默认态（无属性）即灰色方向 */
    "--x-color-0": "var(--x-plain-color-0) !important",
    "--x-color-1": "var(--x-plain-color-1) !important",
    "--x-color-2": "var(--x-plain-color-2) !important",
    "--x-color-3": "var(--x-plain-color-3) !important",
    "--x-color-4": "var(--x-plain-color-4) !important",
    "--x-color-5": "var(--x-plain-color-5) !important",
    "--x-color-6": "var(--x-plain-color-6) !important",
    "--x-color-7": "var(--x-plain-color-7) !important",
    "--x-color-8": "var(--x-plain-color-8) !important",
    "--x-color-9": "var(--x-plain-color-9) !important",
    "--x-bgcolor-0": "var(--x-plain-bgcolor-0) !important",
    "--x-bgcolor-1": "var(--x-plain-bgcolor-1) !important",
    "--x-bgcolor-2": "var(--x-plain-bgcolor-2) !important",
    "--x-bgcolor-3": "var(--x-plain-bgcolor-3) !important",
    "--x-bgcolor-4": "var(--x-plain-bgcolor-4) !important",
    "--x-bgcolor-5": "var(--x-plain-bgcolor-5) !important",
    "--x-bgcolor-6": "var(--x-plain-bgcolor-6) !important",
    "--x-bgcolor-7": "var(--x-plain-bgcolor-7) !important",
    "--x-bgcolor-8": "var(--x-plain-bgcolor-8) !important",
    "--x-bgcolor-9": "var(--x-plain-bgcolor-9) !important"
  };
  var darkColorizedColorVars = {
    "--x-color-0": "var(--x-tinted-color-0) !important",
    "--x-color-1": "var(--x-tinted-color-1) !important",
    "--x-color-2": "var(--x-tinted-color-2) !important",
    "--x-color-3": "var(--x-tinted-color-3) !important",
    "--x-color-4": "var(--x-tinted-color-4) !important",
    "--x-color-5": "var(--x-tinted-color-5) !important",
    "--x-color-6": "var(--x-tinted-color-6) !important",
    "--x-color-7": "var(--x-tinted-color-7) !important",
    "--x-color-8": "var(--x-tinted-color-8) !important",
    "--x-color-9": "var(--x-tinted-color-9) !important",
    "--x-bgcolor-0": "var(--x-tinted-bgcolor-0) !important",
    "--x-bgcolor-1": "var(--x-tinted-bgcolor-1) !important",
    "--x-bgcolor-2": "var(--x-tinted-bgcolor-2) !important",
    "--x-bgcolor-3": "var(--x-tinted-bgcolor-3) !important",
    "--x-bgcolor-4": "var(--x-tinted-bgcolor-4) !important",
    "--x-bgcolor-5": "var(--x-tinted-bgcolor-5) !important",
    "--x-bgcolor-6": "var(--x-tinted-bgcolor-6) !important",
    "--x-bgcolor-7": "var(--x-tinted-bgcolor-7) !important",
    "--x-bgcolor-8": "var(--x-tinted-bgcolor-8) !important",
    "--x-bgcolor-9": "var(--x-tinted-bgcolor-9) !important"
  };

  // src/utils/staticThemeCss.ts
  var MODE_GUARD_ATTRS = {
    dark: ":not([dark]):not([data-dark]):not([data-light])",
    colorized: ":not([colorized]):not([data-colorized]):not([data-uncolored])"
  };
  var guardSelector = /* @__PURE__ */ __name((nots) => `:host${nots},:root${nots}`, "guardSelector");
  function bakeDimensionGuards(options) {
    const blocks = [];
    if (options.dark) {
      const { "--auto-shadow": _dropped, ...darkShadowBase } = darkShadowVars;
      blocks.push(`${guardSelector(MODE_GUARD_ATTRS.dark)}{
    color-scheme: dark;
${toVarStyles(darkColorVars)}
${toVarStyles(darkShadowBase)}
${toVarStyles(darkDerivedVars)}
}`);
    }
    if (options.colorized) {
      blocks.push(`${guardSelector(MODE_GUARD_ATTRS.colorized)}{
${toVarStyles(lightColorizedColorVars)}
}`);
    }
    if (options.dark && options.colorized) {
      blocks.push(`${guardSelector(`${MODE_GUARD_ATTRS.dark}${MODE_GUARD_ATTRS.colorized}`)}{
${toVarStyles(darkColorizedColorVars)}
}`);
    }
    const sizeGuards = [
      [
        "data-size",
        sizeVars,
        options.size
      ],
      [
        "data-spacing",
        spacingVars,
        options.spacing
      ],
      [
        "data-shadow",
        shadowVars,
        options.shadow
      ],
      [
        "data-radius",
        radiusVars,
        options.radius
      ]
    ];
    for (const [attr, table, value] of sizeGuards) {
      if (value === "medium") continue;
      const vars = table[value];
      if (!vars) continue;
      blocks.push(`${guardSelector(`:not([${attr}])`)}{
${toVarStyles(vars)}
}`);
    }
    return blocks.length ? `
/* baked defaults (ADR-0005) */
${blocks.join("\n")}
` : "";
  }
  __name(bakeDimensionGuards, "bakeDimensionGuards");
  function assembleStaticThemeCss(css, options) {
    return `${staticFingerprintRule(options)}${css}${bakeDimensionGuards(options)}`;
  }
  __name(assembleStaticThemeCss, "assembleStaticThemeCss");

  // src/scope.ts
  var isColorLiteral = /* @__PURE__ */ __name((value) => {
    const normalized = toRGBString(value.trim());
    return /^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(normalized);
  }, "isColorLiteral");
  var _AutoSparkThemeScope = class _AutoSparkThemeScope {
    constructor(options) {
      __publicField(this, "options");
      __publicField(this, "_selectors", []);
      __publicField(this, "stylesheets", []);
      __publicField(this, "connected", false);
      __publicField(this, "elements", []);
      /**
       * 快照协调器（ADR-0003）：由 ThemeManager 构造后注入，负责把本 scope 的 CSS
       * 合成进全局样式快照；独立使用的 scope 为 null（仅参数持久化，无样式快照）。
       */
      __publicField(this, "coordinator", null);
      /** 已注入样式内容缓存（styleId → css）：内容未变跳过重解析；也是样式快照的数据源（不查 DOM） */
      __publicField(this, "_cssMap", /* @__PURE__ */ new Map());
      /**
       * 静态主题包满足标记（ADR-0004）：root scope 水合后指纹与静态 <link>
       * 完全一致时为 true，三块运行时注入全部跳过，静态文件即永久样式来源。
       * 运行时 update() 换色后动态块照常注入并常驻，本标记不回退（刷新回归纯静态路径）。
       */
      __publicField(this, "_staticSatisfied", false);
      /**
       * 静态包声明的维度默认（ADR-0005）：指纹命中时从指纹解析。两个用途：
       * 首访（无水合）采纳为初始参数；setter/水合同步的「medium/亮/灰回退」
       * 显式化判据（烘焙维度下「无属性」= 烘焙值而非库默认，回退须显式写
       * data-X="medium" / data-light / data-uncolored 命中对应块）。
       */
      __publicField(this, "_staticDims", null);
      /** 上次持久化的参数 JSON：值未变跳过 localStorage 写入 */
      __publicField(this, "_lastParamsJson", null);
      this.options = Object.assign({
        id: getId(),
        themeColor: "blue",
        cssSelector: [],
        size: "medium",
        dark: false,
        colorized: false,
        radius: "medium",
        spacing: "medium",
        shadow: "medium",
        border: "1px",
        primary: "var(--auto-theme-color)",
        success: "#22c55e",
        warning: "#f59e0b",
        danger: "#ef4444",
        info: "#71717a",
        autoConnect: true,
        autoAttach: true,
        persistence: true,
        storageKey: DEFAULT_STORAGE_KEY,
        docRoot: globalThis.document ? document?.documentElement : void 0
      }, options);
      this._selectors = this.options.cssSelector;
      if (this.options.cssSelector && this.options.cssSelector.length === 0) {
        this.options.cssSelector.push(`[data-theme-scope='${this.id}']`);
      }
      if (this.options.autoConnect) this.connect();
      if (this.options.autoAttach) this.autoAttach();
    }
    get id() {
      return this.options.id;
    }
    /** 是否参与持久化（默认 true，显式传 false 退出：不读写 localStorage，照常渲染） */
    get persistence() {
      return this.options.persistence !== false;
    }
    /** 本 scope 已注入的 CSS 片段（样式快照合成数据源，供 coordinator 读取） */
    get cssChunks() {
      return [
        ...this._cssMap.values()
      ];
    }
    get docRoot() {
      return this.options.docRoot;
    }
    get size() {
      return this.options.size;
    }
    set size(value) {
      this.options.size = value;
      this._forEachElements((el) => this._applySizeAttr(el, "size", value));
      this._persistParams();
    }
    get dark() {
      return this.options.dark;
    }
    set dark(value) {
      this.options.dark = value;
      this._forEachElements((el) => this._applyDarkAttr(el, value));
      this._persistParams();
    }
    get spacing() {
      return this.options.spacing;
    }
    set spacing(value) {
      this.options.spacing = value;
      this._forEachElements((el) => this._applySizeAttr(el, "spacing", value));
      this._persistParams();
    }
    get shadow() {
      return this.options.shadow;
    }
    set shadow(value) {
      this.options.shadow = value;
      this._forEachElements((el) => this._applySizeAttr(el, "shadow", value));
      this._persistParams();
    }
    get colorized() {
      return this.options.colorized;
    }
    set colorized(value) {
      this.options.colorized = value;
      this._forEachElements((el) => this._applyColorizedAttr(el, value));
      this._persistParams();
    }
    get radius() {
      return this.options.radius || "medium";
    }
    set radius(value) {
      this.options.radius = value;
      this._forEachElements((el) => this._applySizeAttr(el, "radius", value));
      this._persistParams();
    }
    get themeColor() {
      return this.options.themeColor || "light";
    }
    set themeColor(value) {
      if (value === "light") {
        this._forEachElements((el) => {
          el.removeAttribute("data-theme");
        });
      } else {
        this._forEachElements((el) => {
          el.dataset.theme = value in presetThemes ? presetThemes[value].color : toRGBString(value);
        });
      }
      this.options.themeColor = value;
      this.update({
        themeColor: value
      });
    }
    _forEachElements(callback) {
      this.elements.forEach((elRef) => {
        const el = elRef.deref();
        if (el) {
          callback(el);
        }
      });
      this.elements = this.elements.filter((elRef) => elRef.deref());
    }
    /**
     * 规模维度回退 medium 的属性写入（ADR-0005 显式化配套）：静态包烘焙了非
     * medium 默认档时，「无属性」经守卫块命中烘焙档，回 medium 必须显式写
     * data-X="medium"（medium 档块本就存在于全量产物中）；否则维持移除语义。
     */
    _applySizeAttr(el, attr, value) {
      if (value === "medium") {
        if (this._staticDims && this._staticDims[attr] !== STATIC_DEFAULT_DIMENSIONS[attr]) {
          el.dataset[attr] = "medium";
        } else {
          el.removeAttribute(`data-${attr}`);
        }
      } else {
        el.dataset[attr] = value;
      }
    }
    /**
     * dark 回退亮的属性写入（ADR-0005）：烘焙 dark 时切亮须显式 data-light
     * （守卫 :not 链出口）；data-light 原为纯手动通道，仅烘焙场景下由本类代管。
     */
    _applyDarkAttr(el, value) {
      if (value) {
        el.setAttribute("dark", "");
        if (this._staticDims?.dark) el.removeAttribute("data-light");
      } else {
        el.removeAttribute("dark");
        if (this._staticDims?.dark) el.setAttribute("data-light", "");
      }
    }
    /** colorized 回退灰的属性写入（ADR-0005）：烘焙多彩时切灰须显式 data-uncolored */
    _applyColorizedAttr(el, value) {
      if (value) {
        el.setAttribute("colorized", "");
        if (this._staticDims?.colorized) el.removeAttribute("data-uncolored");
      } else {
        el.removeAttribute("colorized");
        if (this._staticDims?.colorized) el.setAttribute("data-uncolored", "");
      }
    }
    /**
     * 本作用域是否为文档根域（:host/:root 选择器，即 manager 的 root scope）。
     * 根域子树即文档，data-* 手动通道可裸追加；其余作用域须收敛到自身子树。
     */
    get _isRootScope() {
      return this._selectors.every((s) => s === ":host" || s === ":root");
    }
    /**
     * data-* 手动通道的替选择器（Q2a：约束到本作用域子树）：根域保持裸属性
     * 追加——其子树即文档，裸命中即正确；其余作用域由 _selectors 逐个产出
     * 「自身 + 后代」两式（S[data-X],S [data-X]），把命中约束在本作用域子树内
     * ——跨作用域裸命中会错拿别的作用域的字面量梯度（自定义属性继承的是
     * 解析后的值，裸属性无法感知所属作用域）。
     */
    _dataAlt(attr) {
      if (this._isRootScope) return `[${attr}]`;
      return this._selectors.flatMap((s) => [
        `${s}[${attr}]`,
        `${s} [${attr}]`
      ]).join(",");
    }
    /**
     * 暗色+多彩叠加块选择器：根域沿用四组合裸写（既有纯遗留 + 三个裸组合，
     * 同元素命中）；作用域收敛为「自身四组合 + 后代守卫」——后代守卫
     * S [data-dark][colorized] / S [data-dark][data-colorized] 以更高特异性
     * 压过本作用域暗色块的 S [data-dark]（!important 灰），否则作用域内
     * data-dark+data-colorized 会被降级为灰（Q5 组合修复的特异性前提）。
     */
    _comboSelector() {
      if (this._isRootScope) {
        return `${this._selectors.join(",")}[dark][colorized],[dark][data-colorized],[data-dark][colorized],[data-dark][data-colorized]`;
      }
      const self = this._selectors.flatMap((s) => [
        `${s}[dark][colorized]`,
        `${s}[dark][data-colorized]`,
        `${s}[data-dark][colorized]`,
        `${s}[data-dark][data-colorized]`
      ]);
      const guards = this._selectors.flatMap((s) => [
        `${s} [data-dark][colorized]`,
        `${s} [data-dark][data-colorized]`
      ]);
      return [
        ...self,
        ...guards
      ].join(",");
    }
    /**
     * 生成主题颜色的CSS样式字符串
     * @returns {string} 包含主题颜色变量的CSS样式字符串，支持亮色和暗色模式
     */
    _generateThemeColorStyles() {
      const themeColor = this.options.themeColor;
      const selectors = this._selectors.join(",");
      return `${selectors},${this._dataAlt("data-light")}{
    color-scheme: light;
${toVarStyles(this._createThemeColorVars(themeColor))};
}
${selectors}[dark],${this._dataAlt("data-dark")}{
    color-scheme: dark;
${toVarStyles(this._createThemeColorVars(themeColor, true))};
}`;
    }
    _injectThemeColorStyles() {
      if (this.options.themeColor === "light") return;
      const css = this._generateThemeColorStyles();
      const styleId = `autospark-${this.id}-colors`;
      this._writeStylesheet(styleId, css);
      this._addStyleheetId(styleId);
      return css;
    }
    /**
     * 创建语义化颜色样式并注入到页面中
     * @param {boolean} [inject=true] - 是否立即将样式注入到页面
     * @returns {string|undefined} 生成的CSS样式字符串，如果未覆盖默认颜色则返回undefined
     * @private
     */
    _injectSemanticColorStyles() {
      const styleId = `autospark-${this.id}-semantics`;
      const css = this._generateSemanticColorStyles();
      if (css) {
        this._writeStylesheet(styleId, css);
        this._addStyleheetId(styleId);
      }
      return css;
    }
    /**
     * 创建语义化颜色样式并注入到页面中
     * @returns {string|undefined} 生成的CSS样式字符串，如果未覆盖默认颜色则返回undefined
     * @private
     */
    /**
    * 生成语义化颜色样式。
    *
    * 语义色作为梯度种子统一生成 10 阶标尺（--x-color-{name}-0..9，0 最浅 9 最深，
    * 与 palette.less 色系惯例同向）：light 直引种子原值（行为与固定 hex 时代零差异），
    * dark 提亮引用第 3 档——深底上语义色需提亮而非变暗（ADR-0002）。
    *
    * var() 引用等不可解析为颜色字面量的种子豁免梯度化，直接注入原值且无 dark 覆盖
    * （primary 默认值 var(--auto-theme-color) 即此情形，其 dark 适配由 theme 标尺
    * 提档承担）。
    */
    _generateSemanticColorStyles() {
      const semanticColors = {
        primary: this.options.primary,
        success: this.options.success,
        warning: this.options.warning,
        danger: this.options.danger,
        info: this.options.info
      };
      const selectors = this._selectors.join(",");
      const scaleBlocks = [];
      const lightVars = {};
      const darkVars = {};
      for (const [name, value] of Object.entries(semanticColors)) {
        if (!value) continue;
        if (isColorLiteral(value)) {
          const scale = generateThemeColorVars(value, {
            prefix: `--x-color-${name}-`,
            seedLightnessGap: this.options.seedLightnessGap,
            chromaBoostCap: this.options.chromaBoostCap
          });
          scaleBlocks.push(`${selectors}{
${toVarStyles(scale)}
}`);
          lightVars[`--x-color-${name}`] = value;
          darkVars[`--x-color-${name}`] = `var(--x-color-${name}-3)!important`;
        } else {
          lightVars[`--x-color-${name}`] = value;
        }
      }
      if (!Object.keys(lightVars).length) return;
      return [
        ...scaleBlocks,
        `${selectors},${this._dataAlt("data-light")}{
${toVarStyles(lightVars)}
}`,
        `${selectors}[dark],${this._dataAlt("data-dark")}{
${toVarStyles(darkVars)}
}`
      ].join("\n");
    }
    /**
     * 生成主题颜色相关的CSS变量
     * @param {string} [color=this.themeColor] - 主题颜色值，可以是预设主题名或自定义颜色值
     * @param {boolean} [reverse=false] - 是否反转渐变颜色顺序
     * @returns {Record<string, string>} 包含主题颜色CSS变量的对象
     */
    _createThemeColorVars(color = this.options.themeColor, reverse = false) {
      const themeColor = color in presetThemes ? presetThemes[color].color : color;
      const vars = generateThemeColorVars(themeColor, {
        prefix: "--x-color-theme-",
        reverse,
        seedLightnessGap: this.options.seedLightnessGap,
        chromaBoostCap: this.options.chromaBoostCap
      });
      return vars;
    }
    _addStyleheetId(id) {
      if (!this.stylesheets.includes(id)) {
        this.stylesheets.push(id);
      }
    }
    _generateBaseStyles() {
      const baseStyles = `${this._selectors.join(",")},${this._dataAlt("data-light")}{
    color-scheme: light;
${toVarStyles(baseVars)}
${toVarStyles(lightColorVars)}
${toVarStyles(derivedVars)}}
`;
      const sizeStyles = getVarsStyles(sizeVars, this._selectors, "data-size", this._isRootScope);
      const radiusStyles = getVarsStyles(radiusVars, this._selectors, "data-radius", this._isRootScope);
      const spacingStyles = getVarsStyles(spacingVars, this._selectors, "data-spacing", this._isRootScope);
      const shadowStyles = getVarsStyles(shadowVars, this._selectors, "data-shadow", this._isRootScope);
      const darkStyles = `${this._selectors.join(",")}[dark],${this._dataAlt("data-dark")}{
    color-scheme: dark;
${toVarStyles(darkColorVars)}
}
`;
      const darkShadowStyles = `${this._selectors.join(",")}[dark],${this._dataAlt("data-dark")}{
${toVarStyles(darkShadowVars)}
}
`;
      const lightColorizedStyles = `${this._selectors.join(",")}[colorized],${this._dataAlt("data-colorized")}{
${toVarStyles(lightColorizedColorVars)}
}
`;
      const darkColorizedStyles = `${this._comboSelector()}{
${toVarStyles(darkColorizedColorVars)}
}
`;
      const uncoloredStyles = `${this._isRootScope ? "" : `${this._selectors.join(",")},`}${this._dataAlt("data-uncolored")}{
${toVarStyles(uncoloredColorVars)}
}
`;
      const derivedStyles = `${this._selectors.join(",")},${this._dataAlt("data-light")},${this._dataAlt("data-dark")},${this._dataAlt("data-colorized")},${this._dataAlt("data-uncolored")}{
${toVarStyles(derivedColorVars)}}
`;
      const darkDerivedStyles = `${this._selectors.join(",")}[dark],${this._dataAlt("data-dark")}{
${toVarStyles(darkDerivedVars)}
}
`;
      return `${baseStyles}
${darkStyles}
${darkShadowStyles}
${lightColorizedStyles}
${darkColorizedStyles}
${uncoloredStyles}
${sizeStyles}
${radiusStyles}
${spacingStyles}
${shadowStyles}
${derivedStyles}
${darkDerivedStyles}`;
    }
    /**
     * 注入主题基础样式到页面中
     * @param {boolean} [inject=true] - 是否立即将样式注入到页面中
     * @returns {string} 生成的CSS样式字符串
     * @private
     */
    _injectBaseStyles() {
      const styleId = `autospark-${this.id}-vars`;
      const css = this._generateBaseStyles();
      this._writeStylesheet(styleId, css);
      this._addStyleheetId(styleId);
      return css;
    }
    /**
     * 注入样式（内容去重版，ADR-0003）：与缓存相同则跳过重解析与快照重写——
     * 取色器拖动的 @input 逐像素触发与 MutationObserver 回环在此收敛为
     * 「值真变才写一次」。代价：外部移除 style 标签后同内容重注入不会重建
     * 标签（disconnect 清缓存兜底重连场景）。
     */
    _writeStylesheet(styleId, css) {
      if (this._cssMap.get(styleId) === css) return;
      injectStylesheet(css, {
        id: styleId
      });
      this._cssMap.set(styleId, css);
      if (this.persistence) this.coordinator?.persistStyles(this);
    }
    _collectParams() {
      return {
        themeColor: this.options.themeColor,
        dark: this.options.dark,
        colorized: this.options.colorized,
        size: this.options.size,
        radius: this.options.radius,
        spacing: this.options.spacing,
        shadow: this.options.shadow
      };
    }
    /** 持久化当前参数（ADR-0003）：序列化后与上次相同则跳过写 IO */
    _persistParams() {
      if (!this.persistence) return;
      const json = JSON.stringify(this._collectParams());
      if (json === this._lastParamsJson) return;
      this._lastParamsJson = json;
      writeScopeParamsJson(this.options.storageKey, this.id, json);
    }
    /** 读取参数快照水合 options；返回是否存在水合数据 */
    _hydrateParams() {
      if (!this.persistence) return false;
      const params = readScopeParams(this.options.storageKey, this.id);
      if (params) {
        if (params.themeColor !== void 0) this.options.themeColor = params.themeColor;
        if (params.dark !== void 0) this.options.dark = params.dark;
        if (params.colorized !== void 0) this.options.colorized = params.colorized;
        if (params.size !== void 0) this.options.size = params.size;
        if (params.radius !== void 0) this.options.radius = params.radius;
        if (params.spacing !== void 0) this.options.spacing = params.spacing;
        if (params.shadow !== void 0) this.options.shadow = params.shadow;
      }
      this._lastParamsJson = JSON.stringify(this._collectParams());
      return params != null;
    }
    /**
     * 将水合后的参数同步为 DOM 属性（与各 setter 的属性语义一致：medium 移除、
     * false 移除）。水合发生在 connect 早期（先于注入，防二次闪烁），当时元素
     * 尚未 attach、setter 走不到目标元素，故由此统一补齐。
     */
    _syncPersistedAttrs() {
      this._forEachElements((el) => {
        this._applyDarkAttr(el, this.options.dark);
        this._applyColorizedAttr(el, this.options.colorized);
        if (this.options.themeColor && this.options.themeColor !== "light") {
          el.dataset.theme = this.options.themeColor in presetThemes ? presetThemes[this.options.themeColor].color : toRGBString(this.options.themeColor);
        }
        this._applySizeAttr(el, "size", this.options.size);
        this._applySizeAttr(el, "radius", this.options.radius);
        this._applySizeAttr(el, "spacing", this.options.spacing);
        this._applySizeAttr(el, "shadow", this.options.shadow);
      });
    }
    /**
     * 更新主题
     */
    update(options) {
      const { themeColor } = options;
      const paletteTuned = "seedLightnessGap" in options || "chromaBoostCap" in options;
      if (themeColor) {
        this.options.themeColor = themeColor in presetThemes ? presetThemes[themeColor].color : toRGBString(themeColor);
        this._injectThemeColorStyles();
      } else if (paletteTuned) {
        Object.assign(this.options, options);
        this._injectThemeColorStyles();
        this._injectSemanticColorStyles();
      } else if (options.primary || options.success || options.warning || options.danger || options.info) {
        Object.assign(this.options, options);
        this._injectSemanticColorStyles();
      }
      this._persistParams();
    }
    /**
     * 静态主题包指纹校验（ADR-0004）：仅 root 作用域参与——静态包选择器固定
     * :host,:root，局部作用域即使经继承读到指纹也不代表其样式被覆盖。
     * 比对发生在 _hydrateParams 之后（拿到的是 localStorage 水合后的生效参数）；
     * 指纹缺失（未引静态包/SSR 无 DOM）返回 false 走现行注入路径；指纹存在但
     * 不一致 → warn 一次并返回 false，由动态注入（后注入胜出）接管静态文件。
     */
    _satisfiedByStaticLayer() {
      if (!this._isRootScope) return false;
      if (typeof globalThis.document === "undefined" || !this.docRoot?.ownerDocument) {
        return false;
      }
      const token = readStaticFingerprint(this.docRoot);
      if (!token) return false;
      const rawOptions = {
        themeColor: this.options.themeColor,
        seedLightnessGap: this.options.seedLightnessGap,
        chromaBoostCap: this.options.chromaBoostCap,
        primary: this.options.primary,
        success: this.options.success,
        warning: this.options.warning,
        danger: this.options.danger,
        info: this.options.info
      };
      const options = resolveFingerprintOptions(rawOptions, this.docRoot);
      if (matchStaticFingerprint(token, options)) {
        this._staticDims = parseStaticDimensions(token);
        return true;
      }
      console.warn(`[@autospark/theme] \u9759\u6001\u4E3B\u9898\u5305\u4E0E\u5F53\u524D\u751F\u6548\u4E3B\u9898\u53C2\u6570\u4E0D\u5339\u914D\uFF08${describeStaticMismatch(token, options)}\uFF09\uFF0C\u5DF2\u56DE\u9000\u8FD0\u884C\u65F6\u6CE8\u5165\uFF1B\u8BF7\u7528 generate-theme \u91CD\u65B0\u751F\u6210\u9759\u6001\u4E3B\u9898\u5305\u3002`);
      return false;
    }
    /**
     * 首访采纳指纹维度默认（ADR-0005）：仅在水合缺失时由 connect 调用——水合态
     * 恒优先（用户选择 > 包默认）。与库默认有差异才写入 options 并返回 true，
     * 属性物化由 _syncPersistedAttrs 统一补齐，connect 尾部 _persistParams 随
     * 基线漂移自然落盘（与首访写默认参数的现行行为一致）。
     */
    _adoptStaticDims() {
      const d = this._staticDims;
      if (!d) return false;
      if (d.dark === this.options.dark && d.colorized === this.options.colorized && d.size === this.options.size && d.spacing === this.options.spacing && d.shadow === this.options.shadow && d.radius === this.options.radius) {
        return false;
      }
      Object.assign(this.options, d);
      return true;
    }
    connect() {
      if (this.connected) return;
      const hydrated = this._hydrateParams();
      this._staticSatisfied = this._satisfiedByStaticLayer();
      const adopted = this._staticSatisfied && !hydrated && this._adoptStaticDims();
      if (this._staticSatisfied) {
        this.coordinator?.clearStylesSnapshot?.(this);
      } else {
        this._injectBaseStyles();
        this._injectThemeColorStyles();
        this._injectSemanticColorStyles();
      }
      this._applyToElements();
      this.connected = true;
      if (hydrated || adopted) this._syncPersistedAttrs();
      if (this.id === "root" && this.docRoot?.ownerDocument) {
        removeRestoreTag(this.docRoot.ownerDocument);
      }
      this._persistParams();
    }
    /**
     * 将主题样式应用到匹配选择器的所有元素
     * @private
     * @throws {TypeError} 如果元素不是HTMLElement实例
     */
    _applyToElements() {
      const selectors = this.options.elements || [];
      selectors.forEach((selector) => {
        const els = this.docRoot.querySelectorAll(selector);
        for (let i = 0; i < els.length; i++) {
          const el = els[i];
          if (el && el instanceof HTMLElement) this.attach(el);
        }
      });
    }
    disconnect() {
      this.stylesheets.forEach((id) => {
        const style = document.getElementById(id);
        if (style) {
          style.remove();
        }
      });
      this._cssMap.clear();
      this._staticSatisfied = false;
      this._staticDims = null;
      this.connected = false;
    }
    isConnected() {
      if (this._staticSatisfied) return true;
      const styleIds = [
        `autospark-${this.id}-vars`,
        `autospark-${this.id}-semantics`,
        `autospark-${this.id}-colors`,
        `autospark-${this.id}-mode`
      ];
      return styleIds.some((id) => this.docRoot.ownerDocument.getElementById(id) !== null);
    }
    /**
     * 生成作用域全量 CSS 字符串（base → colors → semantics，与 connect 注入
     * 顺序一致）。构建期静态产物（ADR-0004，经 generateStaticThemeCss）与
     * download() 均走本方法——物理上不存在第二套组装路径（ADR-0006）。
     */
    toStyles() {
      return `${this._generateBaseStyles()}
/* colors */
 ${this._generateThemeColorStyles()}
/*  Semantic Colors */
${this._generateSemanticColorStyles()}`;
    }
    /**
     * download() 的产物决策（ADR-0006）：root 作用域经 assembleStaticThemeCss
     * 出合规静态主题包（指纹头 + 三块 + 当前维度烘焙守卫块，与 CLI
     * generate-theme 产物逐字节一致，挂 <link> 即可被运行时指纹接管）；
     * 非 root 作用域出 toStyles() 快照——静态层契约只服务 root，局部产物
     * 挂 <link> 不会被指纹识别，warn 防误用。
     */
    _resolveDownloadCss() {
      if (this._isRootScope) {
        return assembleStaticThemeCss(this.toStyles(), this.options);
      }
      console.warn(`[@autospark/theme] \u5C40\u90E8\u4F5C\u7528\u57DF\uFF08${this.id}\uFF09\u7684 download() \u4EA7\u7269\u662F\u4F5C\u7528\u57DF\u6837\u5F0F\u5FEB\u7167\uFF0C\u4E0D\u53EF\u4F5C\u9759\u6001\u4E3B\u9898\u5305\u4F7F\u7528\uFF08\u9759\u6001\u5C42\u53EA\u670D\u52A1 root \u4F5C\u7528\u57DF\uFF0CADR-0004\uFF09\u3002`);
      return this.toStyles();
    }
    download() {
      const blob = new Blob([
        this._resolveDownloadCss()
      ], {
        type: "text/css"
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `autospark_${this.id}.css`;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    autoAttach() {
      const scopeEls = this.docRoot.querySelectorAll(`[data-theme-scope='${this.id}']`);
      for (const el of scopeEls) {
        if (!(el instanceof HTMLElement)) continue;
        this.attach(el);
      }
    }
    /**
     * 将主题作用域应用到指定的DOM元素上
     * @param {string | HTMLElement} selector - CSS选择器字符串或HTMLElement元素
     */
    attach(selector) {
      const els = typeof selector === "string" ? document.querySelectorAll(selector) : [
        selector
      ];
      for (const el of els) {
        if (el && el instanceof HTMLElement) {
          if (el !== document.documentElement) {
            el.setAttribute("data-theme-scope", this.id);
          }
          if (this.elements.length === 0 || !this.elements.every((elRef) => elRef.deref() === el)) {
            this.elements.push(new WeakRef(el));
          }
        }
      }
    }
    /**
     * 从主题作用域中分离指定的元素
     * @param {string|HTMLElement} selector - CSS选择器字符串或HTMLElement元素
     * @returns {void}
     */
    detach(selector) {
      const els = typeof selector === "string" ? document.querySelectorAll(selector) : [
        selector
      ];
      for (const el of els) {
        if (el && el instanceof HTMLElement) {
          el.removeAttribute("data-theme-scope");
          this.elements = this.elements.filter((ref) => ref.deref() !== el);
        }
      }
    }
  };
  __name(_AutoSparkThemeScope, "AutoSparkThemeScope");
  var AutoSparkThemeScope = _AutoSparkThemeScope;

  // src/observer.ts
  var themeAttrs = [
    "data-theme",
    "data-border",
    "data-primary",
    "data-success",
    "data-warning",
    "data-danger",
    "data-info"
  ];
  var _ThemeObserver = class _ThemeObserver {
    constructor(scope, el) {
      __publicField(this, "scope");
      __publicField(this, "el");
      __publicField(this, "observer", null);
      __publicField(this, "connected", false);
      this.scope = scope;
      this.el = el;
      this.connect();
    }
    _onThemeAttrChange(attrName, attrValue) {
      if (!attrValue) return;
      const themeAttr = attrName.replace("data-", "");
      this.scope.update({
        [themeAttr === "theme" ? "themeColor" : themeAttr]: attrValue
      });
    }
    connect() {
      if (this.connected) return;
      this.observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === "attributes" && mutation.attributeName && themeAttrs.includes(mutation.attributeName)) {
            const newValue = this.el.getAttribute(mutation.attributeName);
            this._onThemeAttrChange(mutation.attributeName, newValue);
          }
        });
      });
      this.observer.observe(this.el, {
        attributes: true,
        attributeFilter: themeAttrs
      });
      this.connected = true;
    }
    disconnect() {
      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }
    }
  };
  __name(_ThemeObserver, "ThemeObserver");
  var ThemeObserver = _ThemeObserver;

  // src/manager.ts
  var _AutoSparkThemeManager = class _AutoSparkThemeManager {
    constructor(options) {
      __publicField(this, "vars", {});
      __publicField(this, "scopes");
      __publicField(this, "root");
      __publicField(this, "options");
      __publicField(this, "observer");
      /** 上次写入的样式快照内容：合成结果未变时跳过写 IO */
      __publicField(this, "_lastStylesSnapshot", null);
      this.options = Object.assign({
        storageKey: DEFAULT_STORAGE_KEY
      }, options);
      this.root = this._createRootScope();
      this.observer = new ThemeObserver(this.root, document.documentElement);
    }
    get id() {
      return this.root.id;
    }
    get size() {
      return this.root.size;
    }
    set size(value) {
      this.root.size = value;
    }
    get dark() {
      return this.root.dark;
    }
    set dark(value) {
      this.root.dark = value;
    }
    get spacing() {
      return this.root.spacing;
    }
    set spacing(value) {
      this.root.spacing = value;
    }
    get shadow() {
      return this.root.shadow;
    }
    set shadow(value) {
      this.root.shadow = value;
    }
    get colorized() {
      return this.root.colorized;
    }
    set colorized(value) {
      this.root.colorized = value;
    }
    get radius() {
      return this.root.radius;
    }
    set radius(value) {
      this.root.radius = value;
    }
    get themeColor() {
      return this.root.themeColor;
    }
    set themeColor(value) {
      this.root.themeColor = value;
    }
    get presets() {
      return presetThemes;
    }
    /**
     * 更新主题
     */
    update(options) {
      this.root.update(options);
    }
    download() {
      this.root.download();
    }
    /**
     * 合成样式快照并写入 localStorage（ADR-0003）：root 与全部未退出持久化的
     * scope 的 CSS 按注册序 concat（数据源为各 scope 的注入缓存，不查 DOM）；
     * 合成结果未变则跳过写 IO。运行时每次注入变化都会重写全量快照——这就是
     * 自愈：库升级改变输出后，下一次启动即覆盖旧快照。
     */
    persistStyles(scope) {
      if (!scope.persistence) return;
      const sources = [
        this.root ?? scope,
        ...Object.values(this.scopes ?? {})
      ];
      const css = sources.filter((s) => s.persistence).flatMap((s) => s.cssChunks).join("\n");
      if (!css || css === this._lastStylesSnapshot) return;
      this._lastStylesSnapshot = css;
      writeStylesSnapshot(this.options.storageKey, css);
    }
    /**
     * 清空样式快照（ADR-0004）：root scope 静态主题包指纹命中时回调。
     * 同时复位去重基线，使随后运行时换色产生的动态块仍能正常重写快照（自愈）。
     */
    clearStylesSnapshot(scope) {
      if (!scope.persistence) return;
      removeStylesSnapshot(this.options.storageKey);
      this._lastStylesSnapshot = null;
    }
    _createRootScope() {
      const scope = new AutoSparkThemeScope({
        id: "root",
        cssSelector: [
          ":host",
          ":root"
        ],
        autoAttach: false,
        // 先 attach 再 connect：水合参数同步 DOM 属性时元素已就绪（ADR-0003）
        autoConnect: false,
        storageKey: this.options.storageKey
      });
      scope.coordinator = this;
      scope.attach(document.documentElement);
      scope.connect();
      return scope;
    }
    hasScope(id) {
      return id in (this.scopes || {});
    }
    /**
     * 创建主题作用域
     * addScope("#sidebar",{
     *     id:'sidebar',
     * })
     * @param elementSelector
     * @param options
     * @returns
     */
    addScope(options) {
      const { id } = options;
      if (this.hasScope(id)) return;
      if (!this.scopes) this.scopes = {};
      const scope = new AutoSparkThemeScope({
        storageKey: this.options.storageKey,
        ...options
      });
      scope.coordinator = this;
      this.scopes[id] = scope;
      if (scope.connected) this.persistStyles(scope);
      return scope;
    }
    removeScope(id) {
      const scope = this.scopes?.[id];
      if (scope) {
        scope.disconnect();
        delete this.scopes?.[id];
        removeScopeParams(this.options.storageKey, id);
        this.persistStyles(scope);
      }
    }
  };
  __name(_AutoSparkThemeManager, "AutoSparkThemeManager");
  var AutoSparkThemeManager = _AutoSparkThemeManager;
  var themeManager = new AutoSparkThemeManager();
  globalThis.ThemePro = themeManager;

  // src/errors.ts
  var _KylinBitsThemeError = class _KylinBitsThemeError extends Error {
  };
  __name(_KylinBitsThemeError, "KylinBitsThemeError");
  var KylinBitsThemeError = _KylinBitsThemeError;
  var _KylinBitsThemeProNotConnectedError = class _KylinBitsThemeProNotConnectedError extends KylinBitsThemeError {
  };
  __name(_KylinBitsThemeProNotConnectedError, "KylinBitsThemeProNotConnectedError");
  var KylinBitsThemeProNotConnectedError = _KylinBitsThemeProNotConnectedError;
})();
//# sourceMappingURL=index.global.js.map