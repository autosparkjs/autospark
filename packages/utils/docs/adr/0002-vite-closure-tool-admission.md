# ADR-0002: 准入 vite 闭包构建工具——plugins 包身份纯化

- 状态：已接受（Accepted）
- 日期：2026-10-28
- 关联：utils ADR-0001（包定位与准入纪律）；plugins ADR-0003（包身份）、ADR-0004（决策 3 本决策修订，构建工具三项职责定谳处）、ADR-0006（外壳模式）；theme ADR-0007（库型插件）；engine ADR-0114（预加载队列）

## 背景

plugins ADR-0004 决策 3 将 vite 闭包构建工具以子路径 `@autospark/plugins/vite` 随官方插件包分发——它是该包 exports map 中**唯一**的运行时模块面。随之产生的身份混杂：

1. **产物包携带模块面**：@autospark/plugins 的定位是「官方插件产物包」（脚本即契约，IIFE-only），却因构建工具保留了一条模块出口，包身份长期双面；
2. **自举闭环内嵌**：工具本体 `dist/vite/` 由 plugins 自己的 vite.config 在 closeBundle 中构建——产物包的构建编排里嵌着「工具的自我构建」步骤；
3. **工具族分裂**：docs 教程已把 `@autospark/utils`（installPlugin）与 `@autospark/plugins/vite`（installAutosparkPlugin）并称为「插件开发工具」——同一受众的工具分居两包。

## 决策

**vite 闭包构建工具迁入 @autospark/utils，子路径 `@autospark/utils/vite` 导出**（utils ADR-0001「逐项准入」纪律下的首个扩容项）。动机：plugins 包身份纯化（产物包不带模块面）；伴生收益：插件开发工具单包化（安装面从两包收敛为一包）。

**形态**：

- `exports` map 新增 `"./vite"`（source-entry：`./src/vite/index.ts`，与主入口一致不建 dist 管道——两包均未发布，YAGNI）；
- `vite` 以 devDependencies 进入 utils（类型解析 + 漂移锁测试的 fixture 构建）；工具对 vite **仅 `import type`**，运行时零依赖——ADR-0001 零依赖纪律约束的是 @autospark 家族包与运行时足迹，不破；
- 类型面纪律：公开符号仅 `buildAutoSparkPlugin`（含 `shell` 选项；2026-10-28 自 `installAutosparkPlugin` 更名，见后果节）；source-entry 阶段 exports 只挂 `import` 条件、类型面=源码全量（TS 对相对说明符恒先解析 `.ts`，手写 d.ts 收窄在主入口会经 re-export 穿透——半吊子强制不如不接线）；`src/vite/index.d.ts` 是**未来 dist 化时**的收窄面规格，届时 exports 翻转到 dist 路径后生效；
- **队列键单源**：`__AUTOSPARK_PLUGINS__` 字面量原先在 vite 工具（`PRELOAD_QUEUE_KEY` 常量）与 installPlugin（内联字面量）双写，迁入同包后收敛为 installPlugin 模块导出常量，vite 模块单向引用（无环）。

**连带**：plugins exports map 整体退役（纯 IIFE 产物包身份完整）、`buildViteTool()` 构建步骤退役（`dist/vite` 消亡）、漂移锁测试 7 例随迁 utils（无 DOM 依赖，无需 bunfig/happy-dom）、theme 构建与 docs 三篇引用改 `@autospark/utils/vite`、错误前缀更名 `[autospark/utils/vite]`。

## 备选方案

- **独立 `@autospark/vite` 包**：否决——单函数开新包违反「家族公共工具收敛单点」纪律（ADR-0001），家族包数量膨胀无对应收益。
- **并入 engine**：否决——运行时包承载构建工具，依赖方向比现状更糟。
- **留守 plugins**：否决——身份混杂与自举闭环内嵌维持现状，docs 教程两包并称的分裂同样维持。

## 后果

- 第三方插件作者的开发依赖收敛为 `bun add @autospark/utils` + `bun add -d autospark vite`（`@autospark/plugins` 退役出插件开发依赖清单——它是官方插件产物包，是引用对象不是开发依赖）；
- plugins dev 缓存失效正则 `INVALIDATE_RE` 的 `vite` 分支保留即覆盖 utils 新路径（`packages/utils/src/vite/` 天然命中 `src/vite` 特征）；
- theme 的 `@autospark/utils` 手写类型垫片**不扩** vite 工具签名——theme 经 vite config 加载器直转译消费源码 TS，不经垫片；
- **工厂更名 `buildAutoSparkPlugin`**（2026-10-28，迁入当日）：原命名 `installAutosparkPlugin` 与运行时 `installPlugin` 共用「安装」词汇，但本工具是**构建期**闭包打包器、不做任何注册——build 词汇与运行时安装消歧，取代 plugins ADR-0004 决策 3 的命名理由（「与安装词汇同构」原为该决策的取舍点，据此修订）。三项职责与外壳契约不变（定谳处仍在 plugins ADR-0004）。
