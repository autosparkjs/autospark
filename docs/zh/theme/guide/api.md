# API 参考

## 导出总览

```ts
import {
    // 运行时
    ThemeManager, // 主题管理器（含 ThemeManagerOptions 类型）
    themeManager, // 模块级单例
    ThemeScope, // 主题作用域
    ThemeObserver, // 属性观察器
    // 预设
    presetThemes, // 预设主题表（含 PresetTheme 类型）
    // 类型
    ThemeSize, // 尺寸档位
    ThemeOptions, // 作用域选项
    DynamicThemeOptions, // 可动态更新的选项
    ThemeVariantType, // 语义色名
    // 工具
    getId, // 短随机 id
    injectStylesheet, // 注入 / 替换样式标签
    toRGB, // 颜色 → [r, g, b]
    toRGBString, // 颜色 → #hex
    isDark, // 明暗判断
    isLight, // 明暗判断（别名）
    // 错误
    KylinBitsThemeError,
    KylinBitsThemeProNotConnectedError,
} from "@autospark/theme";
```

## ThemeManager

```ts
class ThemeManager {
    constructor(options?: ThemeManagerOptions); // { storageKey?: string }
    root: ThemeScope;
    scopes?: Record<string, ThemeScope>;
    vars: Record<string, string>;
    observer: ThemeObserver;
    // 属性访问器（转发到 root）
    themeColor: string;
    dark: boolean;
    colorized: boolean;
    size: ThemeSize;
    radius: ThemeSize;
    spacing: ThemeSize;
    shadow: ThemeSize;
    readonly id: string;
    readonly presets: Record<string, PresetTheme>;
    // 方法
    update(options: Partial<DynamicThemeOptions>): void;
    addScope(options: ThemeOptions): ThemeScope | undefined;
    removeScope(id: string): void;
    hasScope(id: string): boolean;
    persistStyles(scope: ThemeScope): void;
}
```

| 方法 / 属性 | 说明 |
| --- | --- |
| `new ThemeManager({ storageKey })` | 创建并立即接管 root 作用域（attach `document.documentElement` + connect） |
| `themeManager`（单例导出） | 模块加载时自动创建；IIFE 下同名挂到全局 `ThemePro` |
| `root` | root 作用域（`cssSelector: [":host", ":root"]`） |
| `update(options)` | 只处理颜色类参数；按需重注入 `-colors` / `-semantics` |
| `addScope(options)` | 创建局部作用域；同 `id` 已存在返回 `undefined` |
| `removeScope(id)` | 断开 + 删参数 key + 从快照摘除片段 |
| `hasScope(id)` | 是否存在该局部作用域 |
| `persistStyles(scope)` | 合成并写入样式快照（内部在注入变化时调用） |

::: tip 属性 vs `update()`
`themeColor` / `dark` / `colorized` / 四尺寸走**属性**（会同步 DOM 属性并参与持久化）；`update()` 只接受 `themeColor` + 五个语义色 + 两个调色板参数。
:::

## ThemeScope {#themescope}

```ts
class ThemeScope {
    constructor(options?: ThemeOptions);
    readonly options: Required<ThemeOptions>;
    readonly id: string;
    readonly persistence: boolean;
    readonly cssChunks: string[]; // 本作用域参与快照的 CSS 片段
    coordinator: { persistStyles(scope: ThemeScope): void } | null;
    stylesheets: string[];
    elements: WeakRef<HTMLElement>[];
    connected: boolean;
    get docRoot(): HTMLElement;
    connect(): void;
    disconnect(): void;
    isConnected(): boolean;
    attach(selector: string | HTMLElement): void;
    detach(selector: string | HTMLElement): void;
    autoAttach(): void;
    update(options: Partial<DynamicThemeOptions>): void;
    toStyles(): string;
    generate(): string;
    download(): void;
}
```

| 方法 | 说明 |
| --- | --- |
| `connect()` | 幂等；**先水合参数、后注入**，并同步 DOM 属性（有水合时） |
| `disconnect()` | 移除本作用域注入的样式标签，清空注入缓存 |
| `isConnected()` | 检查 `-vars` / `-semantics` / `-colors` 样式标签是否在位 |
| `attach(el \| selector)` | 挂 `data-theme-scope="{id}"` 并记录元素（setter 据此同步属性） |
| `detach(el \| selector)` | 移除属性与记录 |
| `autoAttach()` | 在 `docRoot` 内查找 `[data-theme-scope='{id}']` 并 attach |
| `update(options)` | 更新颜色类参数并重注入对应样式块 |
| `toStyles()` | 返回「基础变量 + 语义色 + 主题标尺」的 CSS 字符串 |
| `generate()` | 同 `toStyles()`，但带注释分段（与 `download()` 共用） |
| `download()` | 把 `toStyles()` 产物下载为文件 |

尺寸 / 模式 / 主题色的访问器：`size` / `radius` / `spacing` / `shadow` / `dark` / `colorized` / `themeColor`，语义与 `ThemeManager` 上的同名属性一致。setter 会：

1. 更新 `options`；
2. 给已 attach 的元素同步 DOM 属性（`data-size` / `data-radius` / `data-spacing` / `data-shadow` / `dark` / `colorized` / `data-theme`；`medium` 与 `false` 表示移除属性）；
3. 持久化参数（可感参数）。

主题色 setter 额外触发 `update({ themeColor })` 重注入标尺。

```js
const scope = new ThemeScope({ id: "chart", autoConnect: false, autoAttach: false });
scope.attach("#chart");
scope.connect();
console.log(scope.cssChunks.length);
console.log(scope.toStyles());
```

## ThemeObserver

```ts
class ThemeObserver {
    constructor(scope: ThemeScope, el: HTMLElement); // 构造即连接
    connect(): void;
    disconnect(): void;
}
```

监听 `data-theme` / `data-border` / `data-primary` / `data-success` / `data-warning` / `data-danger` / `data-info`，把变化映射为 `scope.update({...})`（`data-theme` → `themeColor`）。

## 预设主题表

```ts
type PresetTheme = {
    color: string;
    title?: string;
    primary?: string;
    success?: string;
    warning?: string;
    danger?: string;
    info?: string;
};

const presetThemes: Record<string, PresetTheme>;
```

当前 12 项：`blue` / `red` / `volcano` / `orange` / `lime` / `gold` / `green` / `cyan` / `geekblue` / `techblue` / `purple` / `magenta`（名称、标题、种子色见[主题色](./color.md#presets)）。表的 `primary` / `success` 等可选项目前未在默认值中使用，供业务自定义扩展。

## 类型

```ts
type ThemeSize = "none" | "x-small" | "small" | "medium" | "large" | "x-large";
type ThemeVariantType = "primary" | "success" | "warning" | "danger" | "info";

type ThemeOptions = { … }; // 见「主题作用域 · 作用域选项」
type DynamicThemeOptions = Pick<
    ThemeOptions,
    "themeColor" | "primary" | "success" | "warning" | "danger" | "info" | "seedLightnessGap" | "chromaBoostCap"
>;
```

## 工具函数

| 函数 | 签名 | 说明 |
| --- | --- | --- |
| `getId` | `(len = 10) => string` | 生成 `Math.random().toString(36)` 截取的短 id |
| `injectStylesheet` | `(css, options?: { id?, location?: "head" \| "body" \| HTMLElement, mode?: "replace" \| "append" }) => string` | 无 DOM 时 no-op；默认 `mode: "replace"`；复用同 id 标签；返回实际使用的 id |
| `toRGB` | `(color: string) => [number, number, number] \| null` | 支持 `#RGB` / `#RRGGBB` / `rgb()` / `rgba()` / 常见命名色 |
| `toRGBString` | `(color: string) => string` | 归一化为小写 hex；不可解析时**原样返回** |
| `isDark` | `(color: string) => boolean` | 加权亮度 `0.299R + 0.587G + 0.114B < 128` 判为暗色；解析失败返回 `false` |
| `isLight` | `(color: string) => boolean` | **当前实现与 `isDark` 同义**（`return isDark(color)`），需要严格的「亮色判断」请用 `!isDark(color)` |

## 错误类

```ts
class KylinBitsThemeError extends Error {}
class KylinBitsThemeProNotConnectedError extends KylinBitsThemeError {}
```

历史包名（`kylinbits-theme` 系）遗留的命名，保留导出以兼容既有 `catch` 分支；当前实现路径不主动抛出。

## 不在公共面内的模块

以下模块未从入口导出（可从深路径导入，但不构成公共契约）：`persistence`（key schema 与读写助手）、`vars/*`（变量表）、`utils/generateThemeColorVars`、`utils/createPrimaryPalette`、`utils/getVarsStyles`、`utils/mapSelector`、`utils/toVarStyles`、`utils/toThemeColorHex`。

其中**常量值**属于公共知识（恢复片段要硬编码）：`storageKey` 默认 `autospark-theme`、快照 key 后缀 `-styles`、参数 key 前缀 `-scope-`、恢复标签 id `autospark-theme-restore`。

## 相关脚本

```bash
cd packages/theme
bun run dev # 示例页（vite，5180）
bun run build # 编译 CSS + 打包 JS/类型（dist）
bun test # 作用域生成 / 持久化测试
bun scripts/check-dark-contrast.ts # 对比度校准（FAIL 退出码 1）
```

---

回到[指南总览](./initial.md)，或看[快速入门](../intro/get-started.md)的完整示例。
