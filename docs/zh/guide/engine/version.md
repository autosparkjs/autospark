---
title: 版本
---

# 版本

## 关于

多版本站点的典型诉求：**同一份页面骨架、按当前版本显隐不同区块**。engine 提供三件轻量机制：`AutoSparkOptions.versions` 声明版本清单（仅用于渲染侧）、构造期把元状态 `$.version` 归一为具体版本、[x-version](../references/directives/x-version.md) 按**版本匹配表达式**声明式显隐。版本是纯渲染态——对 `$.version` 赋值只触发响应式显隐重算，不导航、不重载、不参与 URL。

| 能力 | 说明 |
| --- | --- |
| 版本清单 | `AutoSparkOptions.versions: string[]`，旧→新排列，末项为默认版本 |
| 元状态 | `$.version` 响应式字符串，构造期归一初值 |
| 切换 | 赋值 `$.version` 即生效——纯响应式，无校验、无导航 |
| 显隐指令 | `x-version` 版本匹配表达式声明式显隐 |

::: warning ADR-0120 收敛
路由版本化机制（按版本重写内容 URL、切换触发导航重入、缓存按版本隔离）已废弃——版本不再是路由概念，router 侧无任何版本选项。需要「按版本加载不同内容文件」的效果时，用 x-version 切换显隐，或在应用层监听 `$.version` 自行取数。
:::

## 指南

### 声明版本清单

`versions` 声明在 engine 构造第三参（`AutoSparkOptions`）：

```js
const engine = new AutoSpark(host, {}, {
    versions: ["1", "2"],   // 旧到新排列；末项 "2" 为默认版本
});
```

版本按**旧到新**排列，清单末项是**默认版本**。注意方向与[多语言](./language.md)相反（语言首项为默认）。

清单只有一个用途：**构造期归一 `$.version` 初值**（见下节）——运行时赋值不经清单校验。

仅使用 `x-version` 指令、不需要默认版本归一时，无需声明 `versions`：用 `options.version` 直接注入初值即可：

```js
const engine = new AutoSpark(host, {}, { version: "2" });
```

### $.version 与构造期归一

`$.version` 是状态根上的响应式字符串，模板全局可用：

```html
<p>{{ $.version }}</p>
```

构造期初值归一规则：

- `options.version` 预置（非空串）→ 直接注入；
- `versions` 清单非空时二次归一：当前值空缺 → 写入默认版本（清单末项）；预置未命中清单 → 控制台 warn 并回退末项；命中 → 尊重该值；
- 无清单 → 只认 `options.version` 预置，无默认注入。

无 `'auto'` 特殊值——版本没有自动探测场景。

### 切换版本

对 `$.version` 赋值即切换——纯响应式元状态写入：

```js
engine.store.state.$.version = "1";
```

语义边界：

- **无导航语义**：不触发路由重入、不重取数据，地址栏与历史记录均不变——页面显隐经 x-version 即时响应；
- **不做运行时清单校验**：赋任意值（包括清单外的值、`undefined`）原样生效——清单校验只发生在构造期归一，`$.version` 为 `undefined` 时 x-version 静默短路、全部恒渲染；
- 想要「按版本加载不同内容」的效果，用 x-version 切换显隐或应用层监听 `$.version` 自行取数。

### x-version 指令

「按版本显隐元素」的声明式糖 [x-version](../references/directives/x-version.md)：`x-version="2"` 仅版本 2 可见、`x-version="<=2,=1"` 多子句 OR、`x-version="/^2\./"` 正则匹配——显隐经 `!important` 类恒胜 x-show，表达式语法与组合规则见其参考页。该指令不依赖 `versions` 清单：对任意 `$.version` 值求值、不做清单校验。

### 规划中

版本持久化（localStorage）与切换 UI 组件在规划中，当前版本如需请自行实现——对 `$.version` 赋值即切换。

## 示例

**指令显隐**：赋值 `$.version` 快速切换，观察各表达式形态的显隐（隐藏 = `autospark-version-hidden` 类，`display:none !important`）；置为未知（undefined）时指令静默短路、全部恒渲染：

<demo html="version/basic.html"/>
