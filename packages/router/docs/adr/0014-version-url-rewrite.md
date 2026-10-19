# ADR-0014：版本化内容通道——versions 清单、getVersionUrl 重写与 $.version 切换语义

- 状态：**已被 engine [ADR-0120](../../../engine/docs/adr/0120-version-render-state.md) 取代并废弃**（superseded，2026-10-19）——路由版本化机制整体拆除：`AutoSparkRouterOptions.versions` / `getVersionUrl` / 内置后缀重写 / 切换导航重入 / hash 版本分量全部移除，`src/features/version.ts`（VersionManager）已删除；版本收敛为 engine 渲染侧纯元状态——`AutoSparkOptions.versions` 清单仅用于构造期归一 `$.version` 初值（engine ADR-0120），运行时赋值无校验、无导航。本 ADR 正文保留作历史记录，下文所述机制均不再存在。
- 关联：[ADR-0013](0013-language-url-rewrite.md)（多语言通道——本 ADR 的结构镜像）、
  [ADR-0011](0011-router-plugin-bootstrap.md)（插件自举与模块增强）、
  [ADR-0008](0008-renderer-pipeline-and-raw-channel.md)（raw 通道）、
  [ADR-0004](0004-loaded-layer-skip-full-path-url.md)（路由 hash 模板与缓存键）

## 背景

静态多版本站点需要同一套路由路径按版本取不同内容文件（`/a/x.html` ↔ `/a/x_v1.html`）。
ADR-0013 已为语言建立完整机制（清单声明、单钩子三通道、内置后缀规则、赋值切换重载、
缓存隔离），版本是同构问题：`AutoSparkOptions.versions: string[]` 声明版本清单、
`getVersionUrl` 单钩子重写、赋值 `$.version` 触发当前路由重载。engine 侧配套的
`x-version` 指令只认 `$.version`（engine ADR-0119），本 ADR 管内容 URL 面。

## 决策

### 决策 1：版本清单声明在 engine，末项为默认版本

`AutoSparkOptions.versions?: string[]`——**非空即启用**，经挂载矩阵传递为
`AutoSparkRouterOptions.versions`；空/缺省 = 不启用：钩子整体忽略、`$.version` 不注入
不 watch。**末项（`versions[versions.length - 1]`）为默认版本**——免重写（与语言
「首项默认」方向相反：版本按旧到新排列，未后缀文件对应最新版，用户裁决）。纯 engine
应用中 `versions` 无消费方（指令面解耦，engine ADR-0119 决策 4）。

### 决策 2：单钩子 + type 分流，三通道参与（镜像 ADR-0013 决策 2）

`AutoSparkRouterOptions.getVersionUrl?: (version, url, type: 'view' | 'data' | 'routes')
=> string | null | undefined`——首参为具体版本号字符串（`versions` 是 `string[]`，无
清单项对象结构）。**默认矩阵（未提供钩子）**：view 与 routes 走内置后缀规则，data 不
重写；**提供钩子 = 三通道完全接管**（默认版本豁免不再强制），返回 `null`/`undefined`
= 该次不重写、用原 URL。

### 决策 3：内置后缀规则与默认版本豁免（镜像 ADR-0013 决策 3）

默认规则仅作用 view/routes：默认版本（末项）**免重写**；其余版本在末段扩展名前插
`_v${version}`（`x.html → x_v2.html`；无扩展名末段同插 `/a/x → /a/x_v2`）；query/hash
原样保留在末尾；根路径与目录形 URL 不重写。`version` 原样使用（`"2.1"` →
`x_v2.1.html`），无格式变换魔法。`!` raw 通道同样参与重写。

### 决策 4：启动归一——缺省回退默认版本，无 auto

attach 早期（早于路由表加载；router 自建 engine 时早于宿主首编译，消除 x-version
首帧闪现）执行：`$.version` 未设/空 → 写入默认版本（末项）；显式值未命中清单 →
warn + 回写当前生效值。**不引入 `auto` 特殊值**——版本无自动探测场景（语言有
navigator 协商，版本没有）。注入 engine 的静态模板先编译完成时归一晚于首编译，
闪现窗口由应用负责（文档标注：用 `options.version` 构造期给值）。

### 决策 5：切换 = 完整导航管线重入（镜像 ADR-0013 决策 5）

`store.watch("$.version")` 监听赋值：值变化且命中清单 → 对当前 `fullPath` 完整导航
管线重入（guards、事件、渲染链重跑），经内部放行标记绕过同 URL 去重短路，**不写
历史**。启动期首次写入在 watch 注册前，天然不触发重载。未命中清单 warn + 回写。

### 决策 6：版本并入默认 hash 模板，缓存自动隔离（镜像 ADR-0013 决策 6）

loader 默认 hash 模板并入已解析版本——数据缓存与 keepAlive 自动按版本隔离，零额外
机制。自定义 `options.hash` 的应用文档提示自行纳入版本。

### 决策 7：重写复合顺序——先版本后语言

同一 URL 的重写链：**版本先行，语言随后**——`getVersionUrl` 收到的是未语言化的原
URL（插值后、base 前缀前，时机同 ADR-0013 决策 7），`getLanguageUrl` 收到的是版本化
后的 URL；内置规则同序组合，最终形态 `x_v2_zh.html`（版本后缀贴文件名词干、语言后缀
贴扩展名）。语言重写点的既有位置不变，版本重写插在其前。

### 决策 8：范围外

无 `document.*` 副作用（语言有 `document.lang` 跟随，版本无对应物）；版本持久化
（localStorage）与版本切换 UI 门面**规划中**不实现——`$.version` 直接赋值是唯一
公开入口。

## 后果

**正面**：

- 与语言机制同构：心智、代码形态、测试基座三重复用，`applyLanguageSuffix` 抽出共享
  纯函数后版本规则零新增解析逻辑；
- 缓存与 keepAlive 隔离随 hash 并入版本免费获得。

**代价 / 边界**：

- 默认版本在清单**末项**与语言**首项**方向相反——两机制并用的应用须分别记忆；
- 版本与语言同时启用且均提供钩子时，`getVersionUrl` 先行：其返回值直接成为语言钩子
  的输入，钩子作者需知晓复合顺序；
- 提供钩子后内置规则不兜底——`null` 语义是唯一逃生口。

## 实施落点

- `src/types/config.ts`——`AutoSparkRouterOptions` 增 `versions` / `getVersionUrl`；
  `src/types/augment.ts`——`AutoSparkOptions.versions` / `AutoSparkOptions.version` /
  `getVersionUrl` 模块增强（`$.version` 已在 engine `AutoSparkPresetMeta` 预留）；
- `src/features/version.ts`（新增）——VersionManager：清单传递、启动归一、重写调度
  （按 type）、`$.version` 注入与 watch；
- `src/features/language.ts`——`applyLanguageSuffix` 参数化（后缀串由调用方给）或抽出
  共享纯函数供版本复用；
- `src/features/baseLoader.ts`——版本重写点（语言重写点之前）、`_getHash` 默认模板
  并入版本；
- `src/features/routes.ts`——路由表与远程子表 fetch 纳入 `type: 'routes'` 版本重写；
- `src/router.ts`——切换重入（放行标记复用语言的既有机制，泛化或并列）；
- 单测：默认规则矩阵 / 启动归一 / 切换重载 / 缓存隔离 / 钩子接管与 null 语义 /
  复合顺序（先版本后语言）；
- docs：指南（版本）+ API 参考（options 字段）。
