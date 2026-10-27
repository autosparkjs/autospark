# 开发插件

## 概述

开发一个 AutoSpark 插件有两条路线，**殊途同归于同一产物形态**——「插件闭包」IIFE 脚本（`<script>` 直引即是消费契约，ADR-0003）：

| | 路线一：手写 IIFE（简单插件） | 路线二：源码 + 官方工具（大型插件） |
| --- | --- | --- |
| 适合 | 一两个注册面、单文件、页面内嵌、零构建链 | 多文件、TypeScript、复用 npm 依赖、批量产物 |
| 写法 | 一个 IIFE，形参 `$` 直取全局 `AutoSpark` | 常规 ESM 源码（可 `import`），构建期剥除导入 |
| 自举 | 直接注册 / 手写预加载队列判断 | `@autospark/utils` 的 `installPlugin` 单点 |
| 构建 | 无 | `vite build` + `@autospark/plugins/vite` 剥导入、包闭包外壳 |
| 参考实现 | [about · 快速入门](./about.md#快速入门) | 官方包 `packages/plugins` |

两条路线的**注册面完全一致**（`$.components` / `$.actions` / `$.directive` / `$.icons` / `$.ready` / `$.precompile`），API 速查见[插件开发方式](/zh/guide/plugin/)；机制语义（全局注册表、查找链、retain、前置加载约束）见[插件](./about.md)，类型扩展见[类型扩展](./types.md)。本页只讲**怎么写、怎么构建、怎么发布**。

---

## 路线一：手写 IIFE（简单插件）

### 最小插件

单个 js 文件，无任何构建步骤——写一个 IIFE，形参约定缩写作 `$`（正式名是 `AutoSpark`，jQuery 的 `$` 同构），函数体里按需挂载扩展能力，**加载即注册**：

```html
<!-- my-plugin.js：<template> 内联，或独立文件经 <script src> 引入 -->
<script>
    (function ($) {
        $.components["my.hello-card"] = "<div x-text='title'></div>"; // 全局组件
        $.actions["my.greet"] = () => "hello";                        // 全局 action
        $.directive({ name: "my-highlight", kind: 1, mounted() {      // 全局指令
            this.el.style.background = "yellow";
        } });
        $.icons.add("my-star", "<svg>...</svg>");                     // 全局图标
        $.ready((engine) => { /* per-engine 初始化 */ });             // 就绪回调
    })(AutoSpark);
</script>
```

消费即两个标签——**需在 `new AutoSpark()` 之前引入**：

```html
<script src="autospark.js"></script>
<script src="my-plugin.js"></script>
<script>
    new AutoSpark("#app", { title: "demo" });
</script>
```

### 双加载时序（可选前置）

默认假设插件写在 `autospark.js` **之后**。若插件要出现在引擎脚本**之前**，把注册体包成函数推入预加载队列 `__AUTOSPARK_PLUGINS__`（ADR-0114），首个 engine 构造时 drain 回放：

```html
<!-- my-plugin.js：可出现在 autospark.js 之前 -->
<script>
    (globalThis.__AUTOSPARK_PLUGINS__ ??= []).push((engine, $) => {
        // 第二参即命名空间，注册写法不变
        $.components["my.hello-card"] = "<div x-text='title'></div>";
    });
</script>
<script src="autospark.js"></script>
```

队列只 drain 一次、消费后冻结（再 push 会抛错）；队列函数体只执行一次，需要每引擎实例的行为必须包进 `$.ready`。约束清单见[关于 · 前置加载](./about.md#前置加载)。

<demo html="plugin/preload.html"/>

### 适合与边界

- **适合**：注册面少、无状态依赖、想直接嵌页或走 CDN，不打算引入 Node 工程链。
- **边界**：纯 JS 无类型、模板只能手写字符串、无法组织多文件与复用 npm 包；规模一旦上去（多文件、需要类型扩展、需要定时样式注入等），转路线二。

---

## 路线二：源码 + 官方工具（大型插件）

大型插件按**插件工程**的方式开发——TypeScript 源码、`?raw` 导入模板、构建出 IIFE 闭包产物。规范以官方包 `packages/plugins` 为先例，三根支柱：**一插件一目录**、**`installPlugin` 自举单点**、**`@autospark/plugins/vite` 闭包构建**。

### 工程结构

一插件一目录自包含（模板 + 逻辑 + 自举同居一处，`src/plugins/<name>/index.ts` 即入口）：

```
my-plugin/
├── package.json
├── vite.config.ts
└── src/
    ├── index.ts        # 插件入口：注册体 + 模块尾部自举
    ├── toast.html      # 组件模板（?raw 导入）
    └── helpers.ts      # 内部逻辑（正常 import，构建期并入单一产物）
```

### 安装依赖

```bash
bun add @autospark/utils                        # 运行时自举基建（installPlugin，体积可忽略）
bun add -d @autospark/plugins autospark vite    # @autospark/plugins/vite 构建工具 + 引擎类型 + vite
```

- `@autospark/utils` 与 `@autospark/plugins/vite` 是插件开发工具（官方插件包同款基建，ADR-0006）；
- `autospark` 仅作为 devDependency 提供**类型**（`import type`），对引擎的运行时依赖仍是零——插件产物不打包引擎，消费者自带。

### 插件源码：installPlugin 自举双路径

源码按常规 ESM 写。自举统一走 `@autospark/utils` 的 `installPlugin(register)`——**双路径注册单点**（插件入口模块加载期调用一次，仅收注册体，置于模块尾部）：

```ts
// src/index.ts
import type { AutoSpark } from "autospark";
import { installPlugin } from "@autospark/utils";
import toastTemplate from "./toast.html?raw";

/** 组件注册名：autospark. 点前缀或自有前缀，与业务命名零冲突 */
const TOAST_NAME = "my.toast";
/** action/事件等键同样加前缀：my.xxx */

installPlugin((autospark: typeof AutoSpark) => {
    // autospark 即全局命名空间（typeof AutoSpark：既是类又是注册区）
    autospark.components[TOAST_NAME] = toastTemplate;
    autospark.actions["my.toast.show"] = () => {
        /* ... */
    };
    autospark.ready((engine) => {
        engine.actions["my.toast.dismiss"] = () => { /* ... */ }; // 仅供本引擎的资源走引擎级注册位
    });
});
```

`installPlugin` 内部做了路线一「双加载时序」的手工判断等价物：

- **`globalThis.AutoSpark` 存在且 probe 命中**（引擎脚本已先加载）→ 直接调 `register(autospark)`；
- **否则**把 `register` 回调推入 `__AUTOSPARK_PLUGINS__` 预加载队列（ADR-0114），首个 engine 构造 drain 时以命名空间回放——源码无须判断时序，两条路径殊途同归；
- **队列已消费冻结且全局类不可达** → `console.error` 报出——「响而不哑」纪律：集成错误显式声张，不静默失效。

时序判定在 `installPlugin` 内部完成：用每个引擎形态必有的最小注册面（`ready`）做 identity 探测——全局名已被其他脚本占用（无 `ready` 函数的冒名对象）时直取不命中，自动转入队列路径，引擎加载 drain 时拿到真命名空间再注册，不把注册写到冒名全局上。

### vite 构建：产物即闭包

`vite.config.ts` 引入 `@autospark/plugins/vite` 的 `installAutosparkPlugin()`，注入 vite build 即得单产物闭包打包：

```ts
// vite.config.ts
import { defineConfig } from "vite";
import { installAutosparkPlugin } from "@autospark/plugins/vite";

export default defineConfig({
    build: {
        outDir: "dist",
        sourcemap: true,
        minify: true,
        rollupOptions: {
            // 入口名即产物名：按消费契约 autospark.<plugin>.js 命名
            input: { "autospark.my-plugin": "./src/index.ts" },
            output: { entryFileNames: "[name].js" },
        },
    },
    plugins: [installAutosparkPlugin()],
});
```

```bash
bun run build   # 产物 dist/autospark.my-plugin.js
```

构建工具替你做三件事（ADR-0004）：

1. **剥除 `from "autospark"` 的值导入**——源码级的「创作糖」：可以正常写 import（如 `import { markRaw } from "autospark"`），构建期剥除并把引用落定到闭包参数，产物零静态导入：

   | 源码写法 | 产物中的落定 |
   | --- | --- |
   | `import { AutoSpark } from "autospark"` | 闭包参数直接绑定，零发射 |
   | `import { markRaw } from "autospark"`（其他具名） | `const { markRaw } = AutoSpark`（命名空间成员） |
   | `import * as NS` / `import Default` | `const NS = AutoSpark` / `const Default = AutoSpark` |
   | `import type { ... }` | 原样保留（TS 编译期剥除，产物零痕迹） |
   | `import "autospark"`（副作用） | 整语句剥除 |

2. **剥除 exports 面**——闭包无 exports，入口的具名导出语句整体移除；残留其他 export 形态构建期报错；
3. **包裹闭包外壳**——产物形态：

   ```js
   (function (AutoSpark) {
       "use strict";
       /* 打包体：注册能力经闭包参数落定 */
   })(globalThis.AutoSpark);
   ```

   外壳自带**双加载时序**：引擎已加载则即刻执行；`AutoSpark === undefined`（插件先于引擎加载）则插件体推入预加载队列，engine 构造 drain 时以命名空间回放。

::: tip 多产物纪律
一个插件包要同时产出多个闭包脚本（如「一插件一产物 + 聚合产物」）时，**一产物一次 `vite build`**（rollup 多入口会用 rollup 默认产物提取共享 chunk，破坏「一产物一自包含闭包」契约）——官方包 `packages/plugins/vite.config.ts` 即此编排先例（主构建聚合产物，`closeBundle` 循环构建其余）。
:::

### 消费

`<script>` 直引是唯一官方消费方式（产物命名 `autospark.<plugin>.js`）：

```html
<script src="autospark.js"></script>
<script src="./dist/autospark.my-plugin.js"></script>
<script>
    new AutoSpark("#app", { /* ... */ });
</script>
```

---

## 发布

- **产物即契约**：npm `files` 只带 `dist`，产物为独立 IIFE 脚本，不产 ESM/CJS——脚本即契约，`<script>` 直引或 CDN 分发；
- **零外部运行时依赖**：产物不包含（也不应包含）engine 与其他 npm 运行时依赖——autospark 能力经全局命名空间运行期解析，消费者自带引擎；
- **命名空间**：注册名统一加前缀（`autospark.` 点前缀或自有前缀如 `my.`），与业务命名零冲突；同名后注册覆盖先注册；
- **类型扩展随包发布**：声明合并接缝（`AutoSparkOptions` / `AutoSparkMeta` / `AutoSparkEvents`）写在**模块形态**的 `.d.ts` 里随包分发（`import "my-plugin"` 自动载入增强），写法见[类型扩展](./types.md)；
- **本地验收**：官方包的 demo 服务（`packages/plugins` 下 `bun run dev`，5181 端口）验证了「改源码 → 刷新页面即取新产物」的闭环，自有插件可参照此形态配一个直引产物的静态 demo 页。

## 实操守则

与官方插件包一致的工程纪律（`packages/plugins` 内先例）：

- **零静态值导入引擎**：运行时能力全部经全局命名空间解析；源码级 static import 仅是构建期剥除的创作糖（见上文导入剥除表），产物零痕迹；
- **响而不哑**：注册通道关闭、命名空间成员缺失等集成错误显式 error，不静默失效（`installPlugin` 自带此守卫，消费其他引擎符号时同样遵守）；
- **自举置模块尾部**：入口模块加载即自举（依赖 `installPlugin` 或闭包外壳，不自起判断逻辑），一插件一目录自包含；
- **per-engine 资源走 `$.ready`**：仅供指定引擎实例的资源（action、事件订阅、状态写入）写在 `$.ready` 回调内的引擎级注册位（`engine.actions` / `options.builtinComponents` 等），不落全局表——全局表是跨引擎真全局；
- **指令插件有硬时序**：指令必须先于 engine 实例化注册——晚于首编译则存量 DOM 上的 `x-<name>` 属性已被剥除，指令对存量 DOM 无从生效；指令定义的形态（spec/类双重载）见[自定义指令](../directive/custom.md)；
- **无卸载语义**：全局注册不随 `engine.destroy()` 回滚，全局资源生命周期即页面生命周期——插件设计时不要依赖可逆注册。

## 深入阅读

- [插件](./about.md)——机制语义权威说明：全局注册表查找链、`$.ready` retain、前置加载队列与全部约束
- [插件开发方式](/zh/guide/plugin/)——官方包 API 速查、三形态官方样板（组件 / 指令 / 复合）与「插件闭包与构建工具」专页
- [类型扩展](./types.md)——`declare module "autospark"` 三接缝的声明合并
- [自定义指令](../directive/custom.md)——spec / 类双重载的完整形态
- ADR-0111 / ADR-0114 / ADR-0003 / ADR-0004 / ADR-0006（`packages/engine/docs/adr/` 与 `packages/plugins/docs/adr/`）——插件机制、预加载队列、包形态与构建工具的决策由来
