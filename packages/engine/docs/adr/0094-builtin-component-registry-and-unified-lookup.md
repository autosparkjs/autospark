# ADR-0094：内置组件注册面收敛、`options.builtinComponents` 独立注册位与组件查找统一

- 状态：已采纳
- 日期：2026-10-09
- 关联：ADR-0092（内置组件单文件化种子表——本 ADR 演进其决策 1/4）、ADR-0091（模板 ?raw 化）、ADR-0093（四层结构——engine 门面豁免）、ADR-0079（未发布零迁移先例）、ADR-0052（getOverlay 协议先例）、ADR-0086（全局组件定义表单表）

## 背景

ADR-0092 后仍有四处残留：

1. **导入面分散且层次倒挂**：9 张模板的 `?raw` 导入分居两处——`engine/engine.ts`（4 张 shell/error）
   与 `features/messages/presets.ts`（5 张消息件）。engine 门面反向 `import` features 层的
   presets.ts（`MESSAGE_PRESET_COMPONENTS`），数据资产被 features 截留，违反「数据资产层被上层
   单向引用」纪律；presets.ts 还带全仓无消费者的死 re-export（`BASE_TEMPLATE`/`ACTIONS_TEMPLATE`）。
2. **内置注册位不设防**：`builtinComponents` 是构造期内部合成表（ADR-0092 决策 4），以
   `{ ...builtinComponents, ...userComponents }` 展开混入 `options.components`——用户的业务配置流
   （对象展开 / 合并 / 粘贴配置）可把内置注册名意外冲掉，且引擎无从分辨「蓄意接管」与「误伤」。
3. **查找 API 不对称**：`engine.getComponentDeclaration(el, name)` 中 el 必填，且 el 反查不到
   scope 时返回 undefined **不兜底全局**——与「scope 链到顶兜底全局」协议自相矛盾；命令式先例
   `getOverlay(el | null, name, options?)` 已支持「el 传 null 仅查全局」，同一协议两种参数形态。
4. **shell 查找特判通道**：裸键（dialog/popover/drawer/message）经 `UI_SHELL_COMPONENT_NAMES`
   映射到点前缀注册名（`autospark.overlays.panel-shell` 等）后走 `_resolveUiShell` **纯全局**，
   绕过 scope 链；接管判定 `_isBuiltinUiShell` 按注册名**引擎级**判定（一处接管 = 全引擎接管）。
   四个消费者（声明式 overlay / 命令式 getOverlay / 实例防御路径 / messages）四条路径不一致。
   error 组件已是「裸键即注册名、就近遮蔽即定制」先例，shell 未跟上。

## 决策

### 1. `src/components/index.ts` 唯一注册面，features 层零 `?raw` 导入

9 张模板的 `?raw` 导入收敛到 `components/index.ts`，同处导出全部内置注册名常量
（`ACTIONS_PRESET_NAME` / `BASE_PRESET_NAME` / `presetComponentName` 自 `messages/types.ts` 迁入，
types.ts re-export 维持既有导入面）与聚合种子表 `BUILTIN_COMPONENTS: Record<string, string>`。
`engine.ts` 单点导入，`features/messages/presets.ts` 退役（`resolveTypeDefaults` 收编 manager.ts），
core→features 反向依赖清零。测试直接 `?raw` 导入模板原文做断言属合法用途，豁免本纪律。

### 2. `options.builtinComponents` 独立注册位，`components` 优先级更高

构造期合成 `{ ...BUILTIN_COMPONENTS, ...用户传入的 builtinComponents }`，同名覆盖、追加自由、
不校验键空间（内置名集合随版本演化，warn 会在升级时误伤——伪防线）。查找优先级：

```
局部 x-define > 运行时注册表 > options.components > options.builtinComponents
```

**设计动机**：`components` 是开发者日常业务组件注册位，一般定制内置组件**应使用 `components`
同名覆盖**（优先级更高）；`builtinComponents` 独立保存的目的是**避免内置默认被业务配置流意外
覆盖**——供明确接管框架内建件时使用。接管判定（引擎类名契约有无）取**任一侧同名即接管**——
胜出模板决定契约，与查找优先级自洽。`engine.builtinComponents` 公开字段删除（运行时事实源 =
合并后的 `this.options.builtinComponents`）。

### 3. `getComponentDeclaration(name, el?)`——el 可选 + 反查失败兜底全局

参数对调为 `(name: string, el?: HTMLElement)`（未发布零迁移，ADR-0079 先例）：查组件的主语是
名字，el 是可选范围修饰——省略 el 即纯全局查找。行为统一：

- el 有值且反查到 scope → scope 链就近 + 全局兜底（协议不变）；
- el 省略**或反查失败** → 兜底全局（修复不对称——不在任何 engine 内的元素等价于全局消费者）。

查找规则与 `getOverlay` 同构；参数形态不同（后者的 el 是定位锚、语义必需），文档显式说明。

### 4. shell 查找裸键化，统一标准组件链

内置 shell 注册名裸键化（error 先例推广）：`message` / `dialog` / `popover` / `drawer`
（panel-shell 同模板注册 `dialog`、`popover` 双键）。`UI_SHELL_COMPONENT_NAMES` 映射、
`_resolveUiShell`、`_isBuiltinUiShell` 特判通道全部退役，四个消费者收敛到
`getComponentDeclaration(name, el?)` 标准链：用户局部 `x-define="dialog"` 即就近遮蔽、
`components.dialog` 全局接管、内置 `builtinComponents.dialog` 末端兜底。接管判定改**命中点级**
——「命中源是否 `builtinComponents` 原版」：scope 链 / `components` 命中 → 按用户模板装配
（无引擎类名契约）；`builtinComponents` 命中 → 内置模板。同一引擎内可 A scope 局部接管、
B scope 仍用内置。命中点级标记由 `ComponentDef.builtin` 承载（懒预编译时按「模板与内置种子表
逐字相同」写入，`_resolveGlobalComponent` 两个 def 构建分支统一赋值）。

**实施期修订（ADR-0092 决策一的边界澄清）**：「单模板注册 `dialog`、`popover` 双键」与
ADR-0092 决策一「模板根直接写 `x-define="<注册名>"`」矛盾（一个 `x-define` 无法声明两个名）。
落地取**拆分**而非「模板根去 `x-define` 靠自动包装打名」——后者违反「components/*.html 均为
标准 autospark 组件（自带声明）」的形态约定：`panel-shell.html` 拆为 `dialog-shell.html`
（`x-define="dialog"`）与 `popover-shell.html`（`x-define="popover"`）两份**各自自包含**的
标准组件文件（同构形态、样式段独立 id——`autospark-shell-styles` / `autospark-popover-styles`
，接管任一键整组替换只影响本键）；notification-shell / drawer-shell 单名注册，模板根
`x-define` 原样保留。「一组件一文件、一文件一声明」全表成立（10 文件 10 声明）。代价是
dialog/popover 模板内容重复（同构形态的物理副本）——换取声明形态的统一与接管替换的精确
隔离，worth it。`wrappers/index.ts` 预热随之三键全开（popover 样式段独立后不再被 dialog
预热顺带覆盖）。此外 `_hasGlobalComponentSource`（定义表 / 双注册位任一命中）供运行时注册
的覆盖 warn 判据——运行时注册同名覆盖内置同样告警。

## 影响

- 消费点迁移：`x-tree` / `x-loading` 签名对调（传 el 语义不变）、overlay 三消费者与 messages
  改标准链、`wrappers/index.ts` 预热改新键。
- `messages/types.ts` 预设名 re-export、`assembly.ts` 的 `resolveShell` 收敛单链。
- 未发布破坏性变更：`getComponentDeclaration` 参数顺序、`builtinComponents` 注册名
  （`autospark.messages.shell` 等点前缀名退役为裸键）。
- shell 实例模型（装配形态）不在本 ADR 范围——见 ADR-0095。
