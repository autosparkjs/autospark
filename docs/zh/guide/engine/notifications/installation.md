---
title: 安装
---

# 安装

通知模块以官方插件形态随 `@autospark/plugins` 包分发（ADR-0001：通知子系统自 engine 迁出），与渲染引擎 `autospark` 协同工作。**插件不打包 engine**：脚本加载即自举，engine 构造期自动挂载 `engine.notifications`、注册内置组件模板与 `toast` / `confirm` / `task` 三件套 action——启用只需引入插件，无独立入口、无手动注册。

## 包管理器安装

包内产物为 IIFE 脚本（ADR-0003：插件只提供 IIFE，脚本即契约），安装后从包目录取用 `dist/` 下产物（或经 CDN 直引）：

::: code-group

```bash [npm]
npm install @autospark/plugins autospark
```

```bash [pnpm]
pnpm add @autospark/plugins autospark
```

```bash [yarn]
yarn add @autospark/plugins autospark
```

```bash [bun]
bun add @autospark/plugins autospark
```

:::

## 引入方式（IIFE 脚本）

引入两个脚本即可——**双加载顺序兼容**：先 engine 后插件，或先插件后 engine 皆可（插件经全局 `AutoSpark.ready` / `__AUTOSPARK_PLUGINS__` 预加载队列双路径注册，engine 构造期自动消费，ADR-0114）：

```html
<script src="https://unpkg.com/autospark/dist/index.global.js"></script>
<!-- 一插件一产物 -->
<script src="./node_modules/@autospark/plugins/dist/plugins/notifications/index.global.js"></script>
<!-- 或聚合产物：一个 script 挂全部官方插件（含 x-ripple / autospark.button） -->
<!-- <script src="./node_modules/@autospark/plugins/dist/index.global.js"></script> -->
<script>
    const host = document.getElementById("app");
    const engine = new AutoSpark(host, {}, { notifications: { pos: "top-right" } });

    // 通知管理器挂在 engine 实例上
    engine.notifications.add("已保存");
</script>
```

::: tip 自包含产物
插件的插件闭包产物已打包全部运行时资源（4 件内置组件模板 / 样式），除 engine 全局外无其他外部依赖。产物为纯闭包外壳（无全局名，ADR-0004），挂载本身无需手动调用。
:::

## 依赖说明

- **插件产物零外部运行时依赖**：内置组件模板、样式与运行时全部打包内置；对 `autospark` 零静态值导入——运行时能力经全局命名空间解析（ADR-0003 实操守则）；
- **`autospark` 为协同依赖**：以全局 `AutoSpark` 呈现，插件自举在 engine 构造期自动接驳。

## TypeScript

脚本场景的运行时常量经引擎实例 API 取用：persist 语义常量挂载在 `engine.notifications.PERSIST`（ADR-0004，闭包无 exports 面后 IIFE 全局名退役）。包内 TS 模块导出（类型与常量）服务源码级消费与测试，不随 IIFE 产物分发类型声明。

```html
<script>
    engine.notifications.add({
        title: "x",
        persist: engine.notifications.PERSIST.SESSION, // ≡ persist: 1（裸数字同合法）
    });
</script>
```

---

安装完成后，前往[关于](./index.md)了解通知的概念与用法。
