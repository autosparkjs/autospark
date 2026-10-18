---
title: 安装
---

# 安装

`@autospark/router` 是 AutoSpark 生态的纯前端路由库，与渲染引擎 `autospark` 协同工作。**router 不打包 engine**：engine 由应用构造并拥有，router 以 AutoSpark 插件形态在 engine 构造期自动挂载——启用只需在 engine 构造 options 声明 `routes` / `autoDiscoverRoutes`（ADR-0011 插件自举，见[关于](./index.md)）。

## 包管理器安装

::: code-group

```bash [npm]
npm install @autospark/router autospark
```

```bash [pnpm]
pnpm add @autospark/router autospark
```

```bash [yarn]
yarn add @autospark/router autospark
```

```bash [bun]
bun add @autospark/router autospark
```

:::

## 引入方式

### ES Module（推荐）

```javascript
import { AutoSpark } from "autospark";
// 副作用导入：加载即注册插件（engine 构造期自动挂载，无独立入口）
import "@autospark/router";

const host = document.getElementById("app");

// engine 构造 options 声明 routes → router 插件自举挂载
// （路由表加载、导航监听注册、初始导航由 attach 异步链自动完成）
const engine = new AutoSpark(host, {}, { routes: "routes.json" });

// router 实例挂在宿主上，供命令式导航等高级用法
const router = host.router;
```

::: warning 时序边界
`import "@autospark/router"` 须早于 engine 构造（常规 import 顺序天然满足）。若 router 晚于 engine 构造才导入，预加载队列已冻结、导入会直接抛错——这是刻意的误用提示（ADR-0114）。
:::

### IIFE（浏览器直接引入）

引入两个脚本即可——**双加载顺序兼容**：先 engine 后 router，或先 router 后 engine 皆可（router 以插件形态注册，engine 构造期自动消费）：

```html
<script src="https://unpkg.com/autospark/dist/index.global.js"></script>
<script src="./lib/autospark.router.js"></script>
<script>
    const host = document.getElementById("app");

    // engine 构造 options 声明 routes → router 插件自举挂载
    const engine = new AutoSpark(host, {}, { routes: "routes.json" });

    // router 实例挂在宿主上
    const router = host.router;
</script>
```

::: tip 自包含产物
router 的 IIFE 产物已将 `history`、`mitt` 等全部运行时依赖打包内置，除 engine 全局需在先加载外，无其他外部依赖。IIFE 全局名 `AutoSparkRouter` 保留（供调试与高级用法），挂载本身无需手动调用。
:::

## 依赖说明

- **运行时依赖** `history` / `mitt` / `asyncsignal` / `es-toolkit` / `flex-tools` / `ts-mixer` 已全部打包进产物，零外部加载
- **`autospark` 为协同依赖**：IIFE 场景经全局变量呈现；ESM 场景经插件自举在 engine 构造期自动接驳

## TypeScript

类型声明随包提供，开箱即用。导入 router 类型后，`AutoSparkOptions` 经模块声明合并自动获得 `routes` / `autoDiscoverRoutes` 字段：

```typescript
import { AutoSpark } from "autospark";
import "@autospark/router"; // 声明合并随导入自动生效
import type { AutoSparkRouteItem } from "@autospark/router";

const routes: AutoSparkRouteItem[] = [/* ... */];

// routes 字段有完整类型提示
const engine = new AutoSpark(host, {}, { routes });
```

## 前置要求

- 现代浏览器（History API、`customElements`、`DOMParser`）
- 页面须经 **HTTP(S)** 访问——路由表与视图都经 `fetch` 加载，`file://` 直开不可用

---

安装完成后，前往[快速入门](./quick-start.md)搭建第一个多页面应用。
