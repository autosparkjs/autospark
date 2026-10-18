# 初始化

## 概述

主题库的入口是 `ThemeManager`——它是主题的**总协调者**：持有一个 root 作用域、管理若干局部作用域，并把各作用域生成的 CSS 合成样式快照持久化。本章讲清它的构造、单例、属性/方法清单与生命周期。

## 指南

### 单例（推荐默认用法）

```js
import { themeManager } from "@autospark/theme";
```

模块被引入时即创建单例，并完成三件事：

1. 建 root 作用域（选择器 `:host` / `:root`，即整篇文档）；
2. `attach(document.documentElement)` + `connect()` —— 立即注入基础变量、主题标尺、语义色；
3. 首次注入后写入样式快照（若有 localStorage）。

IIFE 产物下同一对象挂为全局 `ThemePro`。

### 构造自己的管理器

需要命名空间隔离（同源多应用）时自行构造：

```js
import { ThemeManager } from "@autospark/theme";

const themeManager = new ThemeManager({
    storageKey: "myapp", // 默认 "autospark-theme"
});
```

| 参数 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `storageKey` | `string` | `"autospark-theme"` | 持久化命名空间前缀：样式快照存 `{storageKey}-styles`，作用域参数存 `{storageKey}-scope-{id}` |

::: tip 前缀是公共接口
宿主恢复片段硬编码了默认前缀，改名属破坏性变更。多应用共存时**必须**用不同前缀，否则会互相覆盖快照。
:::

### 属性与方法

**属性（转发到 root 作用域）**

| 属性 | 类型 | 读 / 写 | 说明 |
| --- | --- | --- | --- |
| `themeColor` | `string` | 读写 | 主题色：预设名 / 任意色值 / `"light"`（关闭）。读回是解析后的 hex |
| `dark` | `boolean` | 读写 | 暗色模式 |
| `colorized` | `boolean` | 读写 | 多彩模式 |
| `size` | `ThemeSize` | 读写 | 字号 / 行高 / 间距体系 |
| `radius` | `ThemeSize` | 读写 | 圆角 |
| `spacing` | `ThemeSize` | 读写 | 内外间距 |
| `shadow` | `ThemeSize` | 读写 | 阴影 |
| `presets` | `Record<string, PresetTheme>` | 只读 | 预设主题表 |
| `root` | `ThemeScope` | 只读 | root 作用域（`:host` / `:root`） |
| `id` | `string` | 只读 | root 作用域的 id（恒为 `"root"`） |
| `scopes` | `Record<string, ThemeScope>` | 只读 | 已创建的局部作用域表（无则 `undefined`） |

```js
themeManager.themeColor = "green";
themeManager.dark = true;
themeManager.size = "small";
```

**方法**

| 方法 | 说明 |
| --- | --- |
| `update(options)` | 更新颜色类参数（`themeColor` / 五个语义色 / `seedLightnessGap` / `chromaBoostCap`），按需重注入对应样式块 |
| `addScope(options)` | 创建局部作用域；同 id 已存在则返回 `undefined` |
| `removeScope(id)` | 断开作用域、摘除其 CSS 片段、清理其参数持久化 |
| `hasScope(id)` | 判断局部作用域是否存在 |
| `persistStyles(scope)` | 合成并写入样式快照（各作用域注入变化时由内部调用；一般不需要手动调） |

```js
themeManager.update({ themeColor: "#13c2c2", success: "#00b96b" });
```

::: warning `update()` 只管颜色
模式（`dark` / `colorized`）与四个尺寸**不在** `update()` 的参数里，它们是属性通道。见[常见问题](../intro/question.md#update-colors-only)。
:::

### 生命周期

`ThemeManager` 自身没有 stop/destroy——它的生命周期就是「构造即接管 root」，随着页面存在。真正有生命周期的是**作用域**：

```js
const scope = themeManager.addScope({ id: "preview", elements: ["#preview"] });
scope.isConnected(); // true（自动 connect 过）
scope.disconnect(); // 移除样式标签；参数仍保留在 localStorage
scope.connect(); // 重新注入（先水合参数再注入）
themeManager.removeScope("preview"); // 断开 + 删除参数 + 从快照摘除
```

- `connect()` 幂等（已连接直接返回），且**先水合参数、再注入**——注入值即恢复值，避免「恢复 → 默认 → 恢复」的二次闪烁；
- `disconnect()` 会清空注入内容缓存，保证重连时一定重新注入；
- root 作用域在 `id === "root"` 时会移除恢复片段插入的 `#autospark-theme-restore` 标签（运行时接管）。

### 属性观察器

`ThemeManager` 构造时会为 root 元素建一个 `ThemeObserver`，监听 `data-theme` / `data-border` / `data-primary` / `data-success` / `data-warning` / `data-danger` / `data-info` 七个属性的变化，并据此调用 `scope.update(...)`。

```html
<!-- 改 DOM 属性即可驱动主题更新 -->
<html data-theme="purple" data-primary="#722ed1"></html>
```

```js
import { ThemeObserver } from "@autospark/theme";

// 为任意元素单独建观察器（构造即连接）
const observer = new ThemeObserver(scope, el);
observer.disconnect();
```

注意：观察器只把 `data-*` 属性**映射**为 scope 的颜色参数（`data-theme` → `themeColor`），模式与尺寸不在此通道。日常用法中直接调 setter 更直观，观察器主要服务于「主题也由 DOM 约束」的场景（如 SSR 输出属性、外部脚本改属性）。

---

下一步：[工作原理](./how-it-works.md)。
