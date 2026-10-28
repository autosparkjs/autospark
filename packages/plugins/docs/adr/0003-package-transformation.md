# ADR-0003: 包身份转型——@autospark/components 更名 @autospark/plugins，插件开发方式载体化

- 状态：已接受（Accepted）
- 日期：2026-10-24
- 关联：包内 ADR-0001（通知插件化，决策 2/4 已标注修订）、ADR-0002（x-ripple 插件化，决策 2/后果已标注修订）、ADR-0004（vite 插件闭包构建，决策 4 已标注修订）；engine ADR-0111（jQuery 风格插件机制）、ADR-0114（插件预加载队列）

## 背景

`@autospark/components` 的定位已经漂移：名为「组件资产包」，实际内容是 notifications 复合插件 + x-ripple 指令插件 + 一个孤立的组件资产种子表（`AUTOSPARK_COMPONENTS`，仅 button.html 一项，仅包内 demo 消费）。包内两种消费形态并存——种子表喂 `options.components`（前插件时代形态）与插件自举（ADR-0111 机制）——语义不一致。

同时，插件作为扩展 autospark 的机制已在 engine 侧完备（ADR-0111 全局命名空间 + ADR-0114 预加载队列：`$.components` / `$.actions` / `$.directive(spec)` / `$.icons.add` / `$.ready` / `$.precompile`），包身份应与其对齐：**插件可以是组件、指令、图标、动作等任意扩展 autospark 功能的形态**，包即是插件开发方式的官方载体。

## 决策

### 决策 1：更名与定位——`packages/plugins`（@autospark/plugins），官方插件集 + 插件开发方式载体

`git mv` 更名（保留历史）。三种扩展形态各留一个官方样板，使包成为完整插件开发参照系：

| 样板 | 形态 | 注册面 |
| --- | --- | --- |
| notifications | 复合插件 | `$.ready` + 组件表 + actions 三件套 + 事件清理 |
| x-ripple | 指令插件 | `$.directive(spec)` spec 重载 + 钩子委托 |
| autospark.button | 组件插件 | `$.components["autospark.button"] = 模板` |

### 决策 2：种子表退役，button 转组件插件

`src/index.ts` 的 `AUTOSPARK_COMPONENTS` 聚合种子表、`./global` 导出、tsup 配置 A 整体退役；button.html 迁入 `src/plugins/button/`，经 `AutoSpark.components` 全局组件表自举注册（跨 engine 真全局，晚注册即生效；查找链 `scope 局部 → options.components → 全局表 → builtinComponents`，业务同名覆盖通道完好）。button 模板自包含（`<style global>` 随模板），无独立样式交付通道。

### 决策 3：按插件组织，一插件一目录

`src/components/`、`src/directives/` 种类目录删除，统一 `src/plugins/<name>/` 自包含（模板 + 逻辑 + 自举），一目录 = 一产物入口。共享基建收 `src/runtime/`：

- `bridge.ts`（既有）：命名空间双捕获（`globalThis.AutoSpark` 直取 / 预加载队列插件体第二参 `captureNamespace`）；
- `bootstrap.ts`（新增）：**自举单点 `installPlugin(tag, probe, register)`**——notifications / ripple 各自内联的双路径注册收敛于此，消重复；顺带修复 notifications 缺失的冻结队列检查（原实现 push 已冻结队列在严格模式抛未捕获 TypeError，统一为 console.error 响而不哑）。

### 决策 4：产物 IIFE-only，脚本即契约

插件只提供 IIFE 产物，**不再提供 ESM/CJS**，`package.json` 的 `exports` map 与 `module` 字段随之退役（jQuery 分发模型，与 ADR-0111 机制哲学一致）。**（ADR-0004 修订：exports 措辞收窄——运行时产物无 exports 面，构建工具子路径 `@autospark/plugins/vite` 是唯一模块导出；下表全局名已全部退役，产物为纯闭包插件闭包，运行时常量改经引擎实例 API 取用，如 `engine.notifications.PERSIST`。）（2026-10-28 再修订：构建工具迁 `@autospark/utils/vite`（utils ADR-0002），exports map 整体回归退役——本决策原文形态完整复位。）**产物面：

| 产物 | 全局名 | 说明 |
| --- | --- | --- |
| `autospark.plugins.js` | `AutoSparkPlugins` | 聚合入口（`src/index.ts` 副作用导入全部官方插件），一个 script 标签挂全部 |
| `autospark.notifications.js` | `AutoSparkNotifications` | 一插件一产物（名称不变，消费契约稳定） |
| `autospark.ripple.js` | `AutoSparkRipple` | 同上 |
| `autospark.button.js` | `AutoSparkButton` | 新增，命名随 `autospark.<plugin>.js` 惯例 |

产物命名与全局名是消费契约，与包名解耦——包更名不连带改名。**（ADR-0004 修订：产物命名契约保留，全局名契约退役。）**npm 形态仍可安装取用 `dist/` 产物；官方消费方式即 `<script>` 直引（双加载时序由 ADR-0114 预加载队列兜底）。

### 决策 5：范式表态——只认裸机制，不造第二套词汇

官方插件开发范式 = 引擎已有裸机制（IIFE `(function($){...})(AutoSpark)` + 预加载队列双路径），包内不引入 `definePlugin` 等统一插件抽象；`installPlugin` 是包内私有基建，不公开为公共 API。第三方插件按 ADR-0111 词汇直接注册。

## 备选方案

- **button 直接删除**（无外部消费面）：否决——包定位是插件开发方式载体，组件形态缺样板则参照系残缺；现有 demo 可平移。
- **保留种类目录**（components/ + directives/）：否决——插件边界是功能单元而非文件种类，按种类切分破坏自包含交付。
- **`.` 聚合 ESM 导出（副作用 + 具名重导出）**：否决——与 IIFE-only 冲突；按需加载已由一插件一产物承接，等真实需求出现再评估。
- **`definePlugin({ name, setup })` 统一抽象**：否决——ADR-0111 已定谳词汇表，扩展包再造第二套词汇违反一致性原则；且现役三插件的自举差异（ready 回调 / directive 入队 / 全局表赋值）用 5 行 register 闭包表达已足。
- **同步更名产物文件与全局名**：否决——产物名本就符合 `autospark.<plugin>.js` 惯例，改名徒增 docs/demo 引用爆炸半径。

## 后果

- 包名引用全量替换：docs（installation / index / x-ripple 等）、CLAUDE.md、engine 源码历史注释（ADR-0001 引用点）、根 CONTEXT.md。
- **ESM 消费方式退役**：`import "@autospark/plugins/notifications"` 不再受支持——notifications 安装文档改写为 script 形态；`NOTIFICATION_PERSIST` 等运行时常量改经 IIFE 全局取用（`AutoSparkNotifications.NOTIFICATION_PERSIST`）；类型面声明合并不再随包分发。
- 双产物 → 单产物：notifications（15.43 kB gzip）/ ripple（3.04 kB）/ button（1.71 kB）/ 聚合（18.64 kB，含前两者与 button）。
- 测试迁移 + 新增 6 例（button 注册与化身渲染 / installPlugin 直注册与冻结队列 error / bootstrap 幂等），包内 61 例全绿；engine 侧零代码改动（仅历史注释包名替换）。
- 新增文档面：`docs/zh/guide/plugin/`（插件开发总纲 + 2 demo），sidebar 新增「插件开发」分组；x-ripple / notifications 安装叙述收口链接至该页。
