# ADR-0007: theme 插件化——engine.themeManager 单例注入与库型插件形态

- 状态：已接受（Accepted）
- 日期：2026-10-25
- 关联：包内 ADR-0004/0005/0006（静态主题包体系）；plugins ADR-0006（外壳模式选项与自举基建上移）、ADR-0004（vite 闭包构建）；utils ADR-0001（自举基建收敛）；engine ADR-0111（全局命名空间）、ADR-0114（预加载队列）

## 背景

@autospark/theme 自成体系：模块加载期即创建默认管理器单例并挂 `globalThis.AutoSparkThemeManager`（实例而非类，[manager.ts] 尾部副作用），root scope 构造即 attach `documentElement` + connect；纯库消费（不装引擎）与文档站 21 个 theme demo 依赖「引入即生效」。但引擎侧对 theme 零引用，`engine.themeManager` 不存在——引擎用户必须手取全局或自行实例化，theme 与家族插件机制（ADR-0114 预加载队列、`$.ready` 挂载时序）无接线。

本决策把 theme 封装为 AutoSpark 插件：引擎构造即得 `engine.themeManager`，同时保持独立库身份零漂移。theme 是家族第四插件（notifications / x-spark / button 之后），也是首个**库型插件**（见决策 2）。

## 决策

### 决策 1：注入语义——单例引用挂载，插件不负责实例化

- **实例化在模块加载期（引入即尽可能早）**：默认管理器单例创建 + `globalThis.AutoSparkThemeManager` 挂载保持现状语义，逐位零漂移——纯库消费与既有 demo 不受影响；
- **ready 回调 = 纯引用注入**：`engine.themeManager = AutoSparkThemeManager`（全局单例）。不构造、无 options 通道、无 dispose 挂钩；
- **多 engine 共享同一实例**：root scope 物理绑定 `documentElement`，per-engine `new` 会产生双 root 冲突——单例是物理必然，不是权宜；
- **engine destroy 不清理**：挂载是「指针接入」而非「生命周期所有权」，与 notifications 的 per-engine 实例 + dispose 语义刻意不同，文档需明示这一差异。

### 决策 2：库型插件外壳——立即执行变体（家族首个实例）

ADR-0003/plugins ADR-0004 标准闭包外壳在 `AutoSpark === undefined` 时**整包入预加载队列**、延迟到首个 engine 构造 drain 才执行。对 notifications 这正确（没引擎就没通知子系统），对 theme 是破坏性的：整包延迟 = 单例不创建 = 无引擎纯库消费与 21 个 demo 全挂。

theme 的关键事实：**包体对引擎零运行时引用**（仅 `import type { AutoSpark }`，编译期剥除）——标准外壳的整包排队对 theme 是纯冗余，且双路径自举本就由源码级 `installPlugin` 承担（其队列语义只入队 register 回调，从不排整包）。故 theme 产物外壳为**立即执行闭包**（无 `run` 延迟分支）：

```js
(function (AutoSpark) {
    "use strict";
    /* 打包体加载即执行：单例创建 → 全局挂载 → installPlugin 双路径自举 */
})(globalThis.AutoSpark);
```

外壳模式选项与适用边界（包体零引擎运行时引用 + 引入即生效副作用）定谳于 plugins ADR-0006，theme 为首个适用实例。

### 决策 3：构建全 vite，tsup 退役

theme 保留 npm 库身份（ESM 消费、d.ts、CSS 产物、CLI），不随 plugins 包 IIFE-only 化；但 JS 构建载体**全部收敛 vite**：

1. **主构建 = ESM lib**（`src/index.ts` → `dist/index.js`，保留 exports 面）；
2. **closeBundle 嵌套 IIFE 闭包构建**：注入 `installAutosparkPlugin({ shell: "immediate" })`，产物 `dist/autospark.theme.js`；原设计闭包全局名 `AutoSparkTheme`（模块命名空间）与 `AutoSparkThemeManager`（单例实例）二元并存——**实现期裁决命名空间不实现**：grep 证实全部 docs 消费面只用单例全局，命名空间无真实消费者，不为「对称」引入无消费面（修订记录：产物全局面仅 `AutoSparkThemeManager` 一个）；
3. **d.ts 由 `tsc --emitDeclarationOnly` 单独生成**（tsup 时代已确认 rollup-plugin-dts 与 TS7 不兼容，此路径沿用）；
4. `src/themes` → dist 资产复制迁入 vite 编排（esbuild-copy-files-plugin 随 tsup 退役）；CSS 链（lessc / generate-theme 脚本）非打包器职责，保持脚本形态；
5. vite.config.ts 按 plugins 包三态分治先例改造（serve = examples demo / build = 包构建）。

### 决策 4：代码组织——plugin.ts 为唯一自举面

- **plugin.ts** 承载全部模块加载期副作用（顺序：创建单例 → 挂全局 → `installPlugin("theme", "ready", ...)`）+ `declare module "autospark"` 类型增强（`engine.themeManager: AutoSparkThemeManager`）；单例创建代码自 manager.ts 移入，manager.ts 回归纯类定义；
- **index.ts** 追加 `export * from "./plugin"`——npm ESM 消费者 import 即自举，零配置获得 `engine.themeManager` 注入；exports map 只有 "." 入口，无子路径绕过自举的风险；
- 插件 tag = `theme`、probe = `ready`（沿 notifications 先例）。

### 决策 5：`state.$.theme` 七键投影——单向同步（state → manager，Q10 修订）

ready 注入不止挂指针：同时在元状态容器挂 `state.$.theme = { dark, themeColor, size, spacing, shadow, radius, colorized }` 七键普通数据对象（`state.$.viewport`/`state.$.version` 同构的元状态投影，ADR-0112/0105 词汇），并建立**单向同步**（Q10 定谳 b，取代初版双向绑定设计）——state 是可写投影，写入即驱动主题切换；manager 直改不回写投影：

- **state → manager**：插件内 `watch("$.theme.*", callback)` 通配符订阅（autostore watch 通道），回调按变更键同步 manager 对应维度（如 dark 变化 → `themeManager.dark = v`）；守卫三道：未知键不落（七键白名单 includes 守卫）、delete 不落（`value === undefined` 直接返回）、同值短路（manager 当前值已同即返回，幂等零扰动）；
- **manager → state 不回写（初版广播机制取消，实现期裁决）**：初版为 manager 层轻量变更广播（scope 7 setter + `update()` 两处调用点）+ 双向同值短路防环。实现期裁决取消——manager 直改的既有消费面（theme-controls、demo、纯库调用方）本就不经 state，双向回写只服务「engine.state 读回」单一场景，不值得引入广播机制与防环复杂度；投影初值以 ready 期 manager 当前值播种；
- **destroy 语义精确化（决策 1 修订）**：themeManager 实例本身不清理（单例跨 engine 存活），但 ready 注册的 **watch 订阅**必须摘除（`engine/destroy/before` → `watcher.off()`）——否则多 engine 场景死订阅向已销毁 store 回写必炸；多 engine 各自接线互不干扰；
- **accessor 活视图方案否决**（曾考虑 `state.$.theme` 挂 getter/setter 代理直通 manager——零同步零清理的最薄形态）：autostore 探针实证 accessor 属性**写入可透传但 watch 完全不触发**（依赖收集/通知断链），响应式不可用；`state.$.theme` 必须是普通数据对象，同步靠显式机制；
- **订阅陷阱前置守则**：watch 通配符依赖整对象预播种（未声明末段 key 的 watch 依赖收集断链，autostore 实测教训）——七键必须在 watch 注册前以整对象字面量一次性写入。

## 备选方案

- **per-engine `new AutoSparkThemeManager()`（notifications 先例）**：否决——root scope 物理唯一，双实例互相覆盖注入样式，行为错乱。
- **`state.$.theme` 只读单向投影（viewport 同构）**：否决——viewport 是环境事实（resize 驱动，用户不该写），theme 是用户意图（暗色开关、选色），只读投影逼用户绕 action 调 manager；最终采纳的是**可写单向同步**变体（决策 5，Q10 修订）：state 可写（写即驱动 manager），只是 manager 不回写。
- **accessor 活视图（getter/setter 代理直通 manager）**：否决——见决策 5 否决记录，autostore 对 accessor 属性 watch 断链（探针实证）。
- **ready 期懒创建单例 + options.theme 配置通道**：否决——破坏独立库身份（import 不再立即生效），docs demo 与纯库消费全需迁移；options 通道（storageKey）暂无真实需求，为它付出行为破坏不成立。
- **标准排队外壳强对齐（家族形态统一优先）**：否决——「引入即实例化」是 theme 的本质特征，整包延迟杀死无引擎消费面；统一到牺牲核心语义是本末倒置。
- **双产物并存（tsup IIFE 库形态 + vite 闭包插件形态）**：否决——两个 IIFE 全局面（`autospark-theme.js` 与 `autospark.theme.js`）是漂移温床，维护双份形态锁成本高于收益。
- **tsup 保留 ESM 环节（混合构建）**：否决——构建载体分裂（同包两种打包器两套行为差异），全 vite 单载体消除「产物形态因构建器而异」的排查负担。
- **theme import @autospark/plugins 的 runtime 基建**：否决——语义倒置（主题包依赖插件集合包），且 plugins 包 bootstrap 即将上移 utils（plugins ADR-0006），无此必要。

## 后果

- `engine.themeManager` 成为一等公民注入：npm ESM 消费（入口自举）与 script 直引（闭包内自举）双路径零配置；多 engine 共享、manager 本体无清理的语义差异须在 install.md 插件形态小节明示。
- `state.$.theme` 七键成为引擎模板的可绑定状态面：`theme.dark = !theme.dark` 等声明式写入即驱动主题切换（scope 求值链第 4 层根 state 可裸访问）；同步语义为**单向**（state → manager 经 watch 通道，微任务级），manager 直改不回显投影。
- 产物改名刚性联动：`docs/public/autospark-theme.js` → `autospark.theme.js`，全部 theme demo（85 个 html）与 theme-controls.js 加载链全量更新（ADR-0006 附录「随构建自然更新」的路径随之作废更替）。
- 构建链换血：tsup / @swc/core / esbuild-copy-files-plugin 自 theme 包 devDependencies 退役；ESM 产物形态（vite lib vs tsup 的 tree-shaking 差异）需回归比对。
- 全局面单极化：`AutoSparkThemeManager`（单例实例）为唯一全局面（决策 3 修订记录：`AutoSparkTheme` 命名空间不实现）。
