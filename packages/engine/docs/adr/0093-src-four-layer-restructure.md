# ADR-0093：src 四层目录重组（引擎核心 / 特性机制 / 指令实现 / 内置资产）

- 状态：已采纳（实施待启动）
- 日期：2026-10-08
- 关联：ADR-0001（指令双通道）、ADR-0030（入口与构建形态）、ADR-0091/0092（内置组件资产化）

## 背景

src 根目录平铺与特性目录自然生长并存：`icons/`、`tooltip/`、`overlay/`、`messages/`、
`components/`、`actions/` 已具特性形态，但引擎核心文件（engine/scope/scheduler/types…）与
特性、指令机制（manager/base/utils）与指令实现（presets/）、数据与机制（图标数据长在
registry、内置 action 混在 ActionManager 域内）相互混杂，依赖方向无显式约束——engine 门面
运行时 import 全部六个特性的 manager，3 处 Symbol 常量下行（`SCOPES_KEY`×2、`MESSAGES_KEY`）
构成仅存的运行时环。

## 决策

### 1. 四层模型与依赖方向

```
directives/、actions/（指令与动作实现）
    → features/*（特性机制，横向 DAG 禁环）
    → engine/（核心：scope / scheduler / compile）
    → consts.ts、errors.ts、types/、utils/（最底层）
components/、icons.ts（内置资产）——被上层引用，不引用任何层
```

- **运行时单向**：上述方向为运行时 import 的硬约束；`import type` 引用**宽松豁免**
  （编译期擦除、无运行时危害，如 overlay 类型引用 x-resize 的 `ResizeOptions` 留原地）。
- **门面豁免**：`engine/engine.ts`（AutoSpark 门面）是**组装根**——全引擎唯一允许 import
  所有层的位置（构造期装配各特性 manager）；引擎核心模块（scope/scheduler/compile）不得
  反向触碰特性。
- 分层动机：为特性扩张铺路 + 显式约束依赖方向；可读性是副产品。

### 2. 目录映射

| 现状 | 去向 |
| --- | --- |
| `engine.ts` / `scope.ts` / `scheduler.ts` / `compile/` | `engine/`（门面即组装根） |
| 根 `types.ts` + 跨模块共享类型 | `types/index.ts`（模块私有类型留模块内） |
| `utils/` | `utils/`（≥2 层消费者；单一特性消费者下沉 `features/<f>/utils/`，逐文件判定表实施时附） |
| `directives/` 根 7 文件（manager、runtime、async-source、branch、component-def） | `features/directive/`（机制；`component-def` 归 `features/component/`——五方共享的组件机制本体） |
| `directives/utils/` 10 文件 | `features/directive/utils/` |
| `directives/presets/` 70 文件 | `directives/` 平铺（见决策 3） |
| `component-instance.ts` / `animate.ts` | `features/component/` / `features/animate/`（animate 零依赖自包含，被三特性共用） |
| `icons/` `tooltip/` `overlay/` `messages/` `actions/`（manager/buildAction/types） | `features/icons/` `features/tooltip/` `features/overlay/` `features/messages/` `features/action/` |
| `components/` 9 个 `.html` | 原地不动（`?raw` 资产，ADR-0091/0092） |
| `actions/builtins.ts` | 顶层 `actions/`（见决策 6） |
| `__tests__/` | 一层分组镜像：`engine/` `features/` `directives/` `utils/`（保留 `x-for/` 子目录习惯） |

**删除**：`context.ts`（187 行零引用死代码）、`directives/presets/popup.ts` 与
`compile/transformers.ts`（0 字节占位；x-popup 真身为 popover）。

### 3. 指令层：规范名平铺 + 注册表随实现走

- 具体指令全部平铺 `directives/`，文件名 = **规范指令名统一带 `x-` 前缀**
  （`on/` → `x-on/`、`bind-spread.ts` → `x-bind-spread.ts`、`popover.ts` → `x-popover.ts`）——
  目录清单即「引擎支持哪些指令」的权威索引。
- `presetDirectives` 注册表随实现走 `directives/index.ts`——「新增指令 = 加文件 + 注册表加一行」
  心智闭合。
- **体量豁免**：复杂指令允许指令级子目录（`x-on/index.ts` + `x-on/modifiers/*.ts`，26 个修饰符
  文件原样下移）；平铺是默认、子目录是豁免，修饰符不移机制层（离开所属指令导航反而变差）。

### 4. `consts.ts` 与解环

新建顶层 `consts.ts` 收**跨层共享的运行时常量**：`SCOPES_KEY`、`MESSAGES_KEY`（自
engine.ts / messages/manager.ts 抽出——即 3 处运行时下行 Symbol，抽出即解环）、`LOCAL_PATHS`
（自 scope.ts）、指令属性前缀（自 `directives/utils/isDirectiveAttr.ts`）、CSS 类名前缀等全局
约定字符串。特性私有常量（如 icons 的 `SVG_NS`、symbol 正则）不进，留特性内。

### 5. `errors.ts`

新建顶层 `errors.ts`：`AutoSparkError` 基类（code + message + context）+ 子类
（`CompileError`、`DirectiveError`、`ActionError`…）。现状全仓零自定义 Error（30+ 处裸
`throw new Error`）；**本次仅收敛编译期错误**（compiler、getDirectives 等少数几处），其余散点
后续逐步迁移——重组本体是搬结构，全量换 throw 会混进行为变化、使「纯搬家」不可验证。

### 6. 内置资产出仓

- **`icons.ts`**（新建顶层）：内置图标 SVG 注册数据自 `icons/registry.ts` 出仓（机制留
  `features/icons/`）——「加图标只改这一个文件」。
- **顶层 `actions/`**：执行型一文件一动作（`toast.ts` / `confirm.ts` / `task.ts` / `back.ts` 各自
  完整描述符）；纯信号型（yes/no/cancel/close，一行标题数据）合 `signals.ts` 一表；注册表
  `actions/index.ts` 聚合。机制（`createBuiltinAction` / `registerBuiltinActions` /
  `triggerAnchor`）留 `features/action/`。

### 7. 桶导出与文件粒度

- 仅三层配桶：`src/index.ts`（公共 API）+ `types/index.ts` + `features/<特性>/index.ts`（特性
  对外面）；`utils/`、`directives/` 平铺文件深路径直连（`directives/index.ts` 例外——它就是
  注册表）。
- utils 粒度为「**一个内聚单元一文件**」：纯函数逐个拆，内聚 API 域（如 slot 8 函数）整体
  保留、文件内按域分区——严格逐函数拆会产生大量碎文件。

### 8. 落地纪律

- **Big-bang 单变更集**：`git mv` 保历史 + 全量 import 改写；`bun test` 全绿为准入。
- **对外 API 与构建产物零变化**：`src/index.ts` 与 `__tests__/setup.ts` 位置不动，tsup /
  package.json / bunfig / docs esbuild watch **零改动**（已核实：entry 均指向 `src/index.ts`，
  `?raw` 插件按相对路径解析）。
- 文档路径引用**全量改写**（含 ADR 正文）——见「约束与后果」第 1 条。

## 否决的备选

- **全面依赖反转**（engine 空心化，六个特性 manager 全部由 `src/index.ts` 组装注入）：分层彻底
  闭合，但改动面远超「重组结构」，且无第三方替换内置特性的需求方——YAGNI，弃。门面豁免制以
  最小代价（抽 3 个 Symbol）清零全部运行时环。
- **纯搬家不立分层规则**：`features/` 名不副实（engine 仍可伸手进任意层），依赖方向继续无约束
  ——弃。
- **严格一函数一文件**（utils）：`slot.ts`（499 行 13 导出）等内聚 API 域碎化——弃，改「内聚
  单元一文件」。
- **x-on 强制单文件 / 修饰符移机制层**：2000+ 行单文件不可维护；修饰符离开所属指令导航变差
  ——均弃。
- **features 间横向禁止**：overlay 类基元被迫上提 engine，污染核心层——弃，允许横向 DAG。

## 约束与后果

- **ADR 正文路径改写是对「历史档案不动」惯例（ADR-0030 先例）的显式偏离**：经明确决策，全部
  文档（含 ADR 正文）批量改写为新路径，以本 ADR 为授权依据；已失效引用（`src/toast/`、行号
  漂移等）顺手修正。
- 两级 CLAUDE.md 的结构描述与 ADR 范围同步更新（其「ADR 0001~0088」描述在 0089~0092 落地后
  已过时）；CONTEXT.md 新增「引擎结构层」词条（特性 / 组装根 / 内置资产）。
- `import type` 豁免意味着少量类型引用跨层存续（如 `overlay/types → x-resize`）——属预期，
  不视为分层违规。
- utils 归属判定表、70 个指令文件的改名映射表为实施附件，随实施变更集提交。
