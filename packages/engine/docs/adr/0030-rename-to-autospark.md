# ADR-0030：品牌更名为 AutoSpark 与自包含发行策略

- **状态**：Accepted
- **日期**：2026-09-12
- **关联**：[CONTEXT.md](../../CONTEXT.md)（「AutoTemplate / AutoStore Template」已废弃词条）、[ADR-0001](0001-directive-kinds.md) 等 0001~0029 全部历史决策（正文保留更名前旧称，作为决策当时的记录）

## 背景

项目自 init 起仓库名、npm 包名即已定为 `autospark`（github `autosparkjs/autospark`，npm 裸名 `autospark` 已由作者占位 0.0.1），但代码标识符、IIFE 全局变量、文档品牌仍停留在旧名（且并存「AutoTemplate」「AutoStore Template」两种词形）。本决策一次性统一品牌，并顺带把发行形态升级为**自包含**：autostore 打包进产物并全量转导出，消费者单包即用。**包从未发布（无 tag、无 version），是零成本 breaking 窗口，故不留任何兼容别名。**

## 决策

### 1. 品牌与命名映射

| 表面 | 旧 | 新 |
| --- | --- | --- |
| 产品称谓 | AutoTemplate Engine / AutoStore Template | **AutoSpark**（描述性全称 AutoSpark Engine 按需使用） |
| 代码标识符前缀 | `AutoTemplate*`（Engine/Scope/DirectiveBase/Compiler/Context 等 10 个） | `AutoSpark*`，单条机械规则全覆盖 |
| 门面类 | `AutoTemplateEngine` | **裸名 `AutoSpark`**（不用 `AutoSparkEngine`——品牌主名留给最核心的类；连带 `AutoSparkOptions` / `AutoSparkEvents`） |
| IIFE 全局变量 | `AutoTemplateSpaces` | **`AutoSparkSpaces`**（保留 `Spaces` 家族后缀——全局对象是命名空间，与裸类名 `AutoSpark` 区分） |
| 产物文件 | `docs/public/template.js` | `docs/public/autospark.js` |
| 运行时日志前缀 | `[AutoTemplate]` | `[AutoSpark]` |
| 安装名（文档） | `@autostorejs/template` | `autospark`（与 package.json、GitHub org 一致） |

**不动区**：`x-*`/`@*`/`:*` 指令属性、`{{}}` 插值、`x-options` 体系、`_scopes` 保留键、`SCOPES_KEY` 常量——用户可见 DSL 与品牌解耦（中立前缀），更名零波及。

**类名与全局名分离**：ESM 侧即 `import { AutoSpark } from "autospark"`；IIFE 全局对象为 `AutoSparkSpaces`，script 场景构造写法 `new AutoSparkSpaces.AutoSpark(...)`，亦可解构 `const { AutoSpark } = AutoSparkSpaces;`。曾短暂令全局与类同名（`new AutoSpark.AutoSpark(...)`），因写法重复、且 `const { AutoSpark } = AutoSpark;` 触发全局词法 TDZ（ReferenceError）而废弃。

**历史层**：ADR 0001~0029 正文**不改写**（决策当时的事实记录）；specs / glossary / CONTEXT.md 属活文档，随代码更新，旧名进 CONTEXT.md「已废弃」节。

### 2. 入口全量转导出 autostore

`src/index.ts` 增加 `export * from "autostore"`。消费者 `import { AutoSpark, AutoStore } from "autospark"` 单入口可得 autostore 完整 API（~80 运行时成员 + ~100 类型）。曾评估「精选转导」（实测 demo 仅用 AutoStore/ConfigManager/configurable/computed 四件），裁决**全量**：转导出面即消费者的 autostore 唯一入口，精选清单会成为持续维护负担。无命名冲突（autostore 无 `AutoSpark`/`SCOPES_KEY`）。

### 3. 自包含发行：运行时 bundle + 类型三小件依赖

- **运行时**：`noExternal: ["autostore", "really-relaxed-json"]` 把 autostore（含其传递依赖 fastevent/flex-tools）打进 esm/cjs/iife 三格式（gzip ~95KB）。IIFE 全局 `AutoSpark.*` 覆盖引擎 + autostore 全部成员。
- **类型**：d.ts 内联 autostore 与 really-relaxed-json 的类型声明（约 9.7k 行），但 rollup-plugin-dts 无法递归内联**子路径引用**（`fastevent/lite`、`flex-tools/misc/logger`）与深层类型工具包（`type-fest`）——工具链边界，`dts.resolve` 清单与 `noExternal` 扩展均试过无效（前者还产生断裂的相对引用）。裁决：`fastevent`/`flex-tools`/`type-fest` 声明为 `dependencies`（皆小包、type-fest 纯类型，运行时零加载），消费者类型解析走 npm 传递依赖。即「**运行时完全自足 + 类型三小件**」。
- 依赖纪律：src 零引用的 `asyncsignal`、`fastevent`（直引）已从依赖中移除；`autostore`、`really-relaxed-json` 移入 devDependencies（仅构建期需要）。
- 附带修复：`engine.ts` 的 `logger` getter 需显式注解 `AutoStore<any>["logger"]`——推断类型穿透到 flex-tools，声明发射不可移植（TS2742）；tsconfig 移除失效的 `ignoreDeprecations: "6.0"`（编译 TS 不接受该值，TS5103）。

### 4. 文档站开发链路：esbuild watch 源码直供 + 自动刷新

`docs/.vitepress/config` 增加仅 `apply: "serve"` 的 Vite 插件：dev 期接管 `/autospark/autospark.js`，用 esbuild watch 从 `packages/engine/src/index.ts` 现场 build IIFE（缓存于内存），源码变更即增量重建并经 Vite WebSocket 广播**整页刷新**——保存即见，无需手动刷新或构建。

**为何不让 demos 直接 `import` engine 源码**：demos 经 vitepress-demo-plugin 以 `?raw` 字符串 + `srcdoc` iframe 内嵌，不进入 Vite 转换管线，`<script type="module">` 与裸模块说明符在 srcdoc 中无从解析——消费模型只能是「普通 script URL + 全局 `AutoSparkSpaces`」，故由服务端接管该 URL 是唯一挂载点。备选方案 `tsup --watch` 被否——它仍是重建 tsup 全量产物，仅省去手动执行。生产构建不受影响（`apply: "serve"` 不参与 build，仍用 tsup 复制的产物）。根目录 `bun run dev` 即启动文档站。

## 后果

- 消费者视角：`bun add autospark` 单包获得引擎 + AutoStore 全量 API；类型开箱即用。
- 更名以 `rg 'AutoTemplate|AutoStore Template'` 终检收敛（仅 ADR 0001~0029 命中为合法残留）。
- 正式发布时以真实版本覆盖 npm 上的 0.0.1 占位。
- 「完全零依赖类型」若未来成为硬需求，路径是换 dts 工具（dts-bundle-generator / api-extractor），本决策不阻塞。
