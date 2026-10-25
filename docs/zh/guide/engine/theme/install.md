# 安装

`@autospark/theme` 是 AutoSpark 生态的运行时主题库，包内自带类型声明与静态样式层产物。

## 包管理器安装

::: code-group

```bash [npm]
npm install @autospark/theme
```

```bash [pnpm]
pnpm add @autospark/theme
```

```bash [yarn]
yarn add @autospark/theme
```

```bash [bun]
bun add @autospark/theme
```

:::

## 引入方式

主题库由**两部分**组成，通常都要引：静态样式层（CSS）与运行时（JS）。

### 1. 静态样式层（CSS）

```html
<link rel="stylesheet" href="/path/to/@autospark/theme/dist/index.css" />
```

或在打包工具里：

```javascript
import "@autospark/theme/index.css";
```

这份 CSS 包含 reset、工具类与组件类（`.auto-btn` / `.auto-card` / `.auto-alert` / `.auto-input` 等）。若你只想用运行时变量、样式全部自己写，可以跳过它。

::: tip 组件类不在聚合入口里
`input.less`（表单微调）与 `src/components/*`（组件类）**未**聚合进 `index.css` 的入口链，需要时按需单独引入；具体见[静态主题包](../guide/static.md)。
:::

### 2. 运行时（JS）

```javascript
import { themeManager } from "@autospark/theme";

themeManager.themeColor = "purple";
themeManager.dark = true;
```

模块加载时会**自动创建单例 `themeManager`**（根作用域挂在 `document.documentElement`，样式随之注入），无需手动 `new`。需要隔离命名空间（同源多应用）或自定义持久化前缀时，自行构造：

```javascript
import { ThemeManager } from "@autospark/theme";

const themeManager = new ThemeManager({ storageKey: "myapp" });
```

### IIFE（浏览器直接引入）

```html
<link rel="stylesheet" href="/path/to/@autospark/theme/dist/index.css" />
<script src="/path/to/@autospark/theme/dist/autospark.theme.js"></script>
<script>
    // 全局单例名为 AutoSparkThemeManager（与库内一致）
    AutoSparkThemeManager.themeColor = "green";
    AutoSparkThemeManager.dark = true;
</script>
```

::: warning 全局名是 `AutoSparkThemeManager`
IIFE 产物为**立即执行外壳**（库型插件，引入即生效）：脚本加载即创建单例并暴露为 `globalThis.AutoSparkThemeManager`。需用类本身（`ThemeManager` / `ThemeScope`）时，请走 ESM 入口。
:::

## 插件形态（与 engine 协同） {#插件形态-与-engine-协同}

`@autospark/theme` 同时是 AutoSpark 家族的**首个库型插件**（ADR-0007）：包体对引擎零运行时引用，上面的纯库消费不受 engine 影响；页面中同时存在 engine 时自动接驳——

- **双路径自举**：脚本先于 engine 加载时经 `__AUTOSPARK_PLUGINS__` 预加载队列在 engine 构造期注册；晚于 engine 加载时经 `AutoSpark.ready` 直取补挂（与官方插件统一机制，见[插件机制](../plugin.md)）；
- **`engine.themeManager`**：engine ready 期注入全局单例引用——多 engine 共享同一实例（root 作用域物理唯一），engine destroy 不清理；
- **`state.$.theme` 七键投影**：engine ready 期向根数据域播种 `dark` / `themeColor` / `size` / `spacing` / `shadow` / `radius` / `colorized` 七键，业务侧改状态即驱动主题切换——模板表达式可直接裸访问：

```html
<button @click="theme.dark = !theme.dark">切换暗色</button>
```

::: tip manager 是唯一真相源（单向同步）
`state.$.theme` 是 manager 的可写投影视图，不是独立状态：初值以 engine ready 期 manager 当前值播种；此后写入 `$.theme.*` 经 watch 通配符订阅自动同步到 manager 同名维度，manager 直改**不回写**投影。直接操作 `themeManager`（或经 theme-controls 组件）的变更同样生效，只是不经投影回显。
:::

## 预设主题 CSS（可选）

包内 `src/themes/*.less` 提供**静态**预设主题（`blue` / `red` / `volcano` / `orange` / `lime` / `green` / `cyan` / `purple` / `magenta` / `yellow` / `dark`），适合完全不经运行时的消费者：给元素挂 `data-theme=blue` 即得该套色阶。

```html
<div data-theme="blue">…</div>
```

::: tip 静态预设 ≠ JS 预设
静态主题文件与运行时预设表**不是同一份清单**：运行时预设（`themeManager.presets`）另含 `gold` / `geekblue` / `techblue`，且由算法现场派生 10 阶标尺，必然与静态文件的字面值一致。选运行时还是静态层，见[静态主题包](../guide/static.md)。
:::

## 依赖说明

运行时依赖 `@yosulramp/material-color-palette-js`（Material 风格色板生成算法的 TS 移植，随包自动安装）。类型解析无需额外小包。

## TypeScript

自带类型声明，开箱即用：

```typescript
import { ThemeManager } from "@autospark/theme";
import type { ThemeOptions, ThemeSize, DynamicThemeOptions } from "@autospark/theme";

const options: ThemeOptions = { id: "preview", themeColor: "purple", dark: true };
themeManager.addScope(options);

const patch: Partial<DynamicThemeOptions> = { themeColor: "#13c2c2" };
themeManager.update(patch);
```

## 无 DOM 环境（SSR / 单元测试）

- 注入是 DOM 操作：无 `document` 时 `injectStylesheet` 直接 no-op，不会报错；
- `ThemeScope` 的 `docRoot` 默认取 `document?.documentElement`，SSR 下需显式传入或延迟到客户端再构造；
- 需要构建期产物时，用 `scope.toStyles()` 取 CSS 字符串（见 [API 参考](../guide/api.md)）。

---

安装完成后，前往[快速入门](./get-started.md)做第一个主题。
