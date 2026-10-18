---
title: 安装
---

# 安装

通知模块以官方插件形态随 `@autospark/components` 包分发（ADR-0001：通知子系统自 engine 迁出），与渲染引擎 `autospark` 协同工作。**插件不打包 engine**：模块加载即自举，engine 构造期自动挂载 `engine.notifications`、注册内置组件模板与 `toast` / `confirm` / `task` 三件套 action——启用只需引入插件，无独立入口、无手动注册。

## 包管理器安装

::: code-group

```bash [npm]
npm install @autospark/components autospark
```

```bash [pnpm]
pnpm add @autospark/components autospark
```

```bash [yarn]
yarn add @autospark/components autospark
```

```bash [bun]
bun add @autospark/components autospark
```

:::

## 引入方式

### ES Module（推荐）

```javascript
import { AutoSpark } from "autospark";
// 副作用导入：加载即注册插件（engine 构造期自动挂载，无独立入口）
import "@autospark/components/notifications";

const host = document.getElementById("app");
const engine = new AutoSpark(host, {}, { notifications: { pos: "top-right" } });

// 通知管理器挂在 engine 实例上
engine.notifications.add("已保存");
```

::: tip 时序边界
`import "@autospark/components/notifications"` 应早于 engine 构造（常规 import 顺序天然满足）。插件经 `AutoSpark.ready` 挂载，**retain 语义**——晚于 engine 构造加载时对全部存活 engine 补挂载。
:::

### IIFE（浏览器直接引入）

引入两个脚本即可——**双加载顺序兼容**：先 engine 后插件，或先插件后 engine 皆可（插件经全局 `AutoSpark.ready` / `__AUTOSPARK_PLUGINS__` 预加载队列双路径注册，engine 构造期自动消费，ADR-0114）：

```html
<script src="https://unpkg.com/autospark/dist/index.global.js"></script>
<script src="./lib/autospark.notifications.js"></script>
<script>
    const host = document.getElementById("app");
    const engine = new AutoSpark(host, {}, {});

    // 通知管理器挂在 engine 实例上
    engine.notifications.add("已保存");
</script>
```

::: tip 自包含产物
插件的 IIFE 产物已打包全部运行时资源（4 件内置组件模板 / 样式），除 engine 全局外无其他外部依赖。IIFE 全局名 `AutoSparkNotifications` 保留（供调试与高级用法），挂载本身无需手动调用。
:::

## 依赖说明

- **插件产物零外部运行时依赖**：内置组件模板、样式与运行时全部打包内置（ESM / CJS 产物将 `autospark` 外置，消费方自带 engine）；
- **`autospark` 为协同依赖**：IIFE 场景经全局变量呈现；ESM 场景经插件自举在 engine 构造期自动接驳。

## TypeScript

导入插件后，对 engine 类型面的**声明合并**随导入自动生效——`AutoSparkOptions.notifications`、`AutoSparkEvents` 的 `notifications/<type>/<id>/<verb>` 事件键、`AutoSpark` 实例属性 `notifications` 三者齐备，类型面与运行时一致；未装插件时这些键在类型面同样不存在——缺失即「该装插件了」的类型级引导。运行时常量与类型自插件子路径导出：

```typescript
import { AutoSpark } from "autospark";
import "@autospark/components/notifications"; // 声明合并随导入自动生效
import { NOTIFICATION_PERSIST } from "@autospark/components/notifications";
import type { NotificationOptions } from "@autospark/components/notifications";

const engine = new AutoSpark(host, {}, {
    // notifications 字段有完整类型提示
    notifications: { pos: "top-right", delayClose: 3000 },
});
```

---

安装完成后，前往[关于](./index.md)了解通知的概念与用法。
