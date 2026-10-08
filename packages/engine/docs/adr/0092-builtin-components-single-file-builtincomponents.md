# ADR-0092：内置组件单文件化与 `options.builtinComponents` 统一种子表

- 状态：已采纳
- 日期：2026-10-08
- 关联：ADR-0022（组件机制）、ADR-0062/0063（overlay shell）、ADR-0071/0088/0089（消息域）、ADR-0087（组件 global 样式）、ADR-0091（模板 ?raw 化）

## 背景

ADR-0091 将内置组件模板迁为 `.html` 后，组件仍被拆在多处：模板在 `components/`（当时散落原位）、
默认值在 `types/*.ts` 常量（`*_DEFAULTS`）、样式在独立 `.css` 经注入函数（`injectMessageStyles` /
`registerShellStyles` / `ensureErrorStyle`）手工灌入；shell（消息 shell / 面板 shell / 抽屉 shell）
另设 `options.uiShells` 独立注册表（ADR-0077），与组件注册双轨。「一组件」的**结构 + 逻辑 + 默认值 +
样式**分居三四个文件/通道，IDE 与心智均不友好。

## 决策

### 1. 严格一组件一 `.html`，统一住 `src/components/`

内置组件全部单文件自包含，扁平存放（域前缀仅消歧）：

| 文件 | 注册名 | 自包含内容 |
| --- | --- | --- |
| `toast.html` | `autospark.messages.toast` | 结构 |
| `confirm.html` | `autospark.messages.confirm` | 结构 + defaults |
| `task.html` | `autospark.messages.task` | 结构 + defaults + scoped 排版 |
| `base.html` | `autospark.messages.base` | 结构 + scoped 排版 + global 内容结构基线 |
| `actions.html` | `autospark.messages.actions` | 结构 + global 按钮行样式 |
| `message-shell.html` | `autospark.messages.shell` | 结构 + global 卡片 chrome |
| `panel-shell.html` | `autospark.overlays.panel-shell` | 结构 + global 面板视觉 |
| `drawer-shell.html` | `autospark.overlays.drawer-shell` | 结构 + global 抽屉静态样式 |
| `error.html` | `error`（既有公开名不变） | 结构 + global 组件样式 |

模板根直接写 `x-define="<注册名>"`（不再由消费侧动态打名）。内部注册经 `?raw` 导入、各域注册面
直接引用（presets.ts / engine.ts），不设中央转发层。

### 2. defaults 迁入 `<script setup>` 保留键

`defaults` 列为 setup **段键**（不落入 locals），静态对象字面量浅合并、随 `ComponentDef.defaults`
暴露。合并链 type 种子层（ADR-0089 决策九）改经 `resolveTypeDefaults`（组件表懒解析 → `def.defaults`
+ manager 侧 Proxy 缓存，`typeDefaults[type]` 消费形态不变）。**覆盖语义升级**：用户同名覆盖 type
组件时，覆盖组件自带的 defaults 自然生效（覆盖彻底性）；未声明 defaults 则该 type 无种子层。
`x-define:inherit` 继承时 defaults 子胜、子未声明沿父（浅合并）。

### 3. 样式迁入 `<style global>`，声明独立 id 容器

组件样式按归属拆入各自文件的 `<style global id>` 段（ADR-0087 注册期注入、同名覆盖整组替换）：

- `id="autospark-message-styles"`：消息 chrome（message-shell）/ 内容结构基线（base）/ 按钮行（actions）
  ——沿用旧注入通道容器名，三段同 id 按声明序追加；
- `id="autospark-shell-styles"`：面板视觉（panel-shell）/ 抽屉静态段（drawer-shell）；
- `id="autospark-error"`：error 组件样式。

三个注入函数（`injectMessageStyles` 的 SHELL_STYLES 部分 / `registerShellStyles` 的静态部分 /
`ensureErrorStyle`）随之退役；**保留两处动态/结构例外**：抽屉滑入/滑出动画矩阵（`buildSlideRules()`
生成）仍由 `registerShellStyles(engine)` 注入（职责收敛为「指令 initialize 预热 shell 组件解析」）；
消息分区列定位样式（`COLUMN_STYLES`，容器列引擎结构 + GAP 插值）留在 `messages/styles.ts`。

shell 样式的**注入时机语义变化**：从「引擎构造期（指令 initialize）无条件注入」变为「组件首次解析
（懒预编译）注入」+ 指令 initialize 预热面板/抽屉两件（FOUC 防御不变）。共享容器 `autospark-styles`
不再被内置样式占用（内置段全走 id 容器）——共享容器回归「用户组件无 id global 段」的专属。

### 4. `options.builtinComponents` 统一种子表，`options.uiShells` 退役

全部内置组件（消息五件 + 三 shell + error）在 engine 构造期合成为 `engine.builtinComponents`
（只读、构造期固化），并入组件查找链（`components = { ...builtinComponents, ...userComponents }`）。
**shell 即组件**：用户经 `options.components` 写注册名同名覆盖即接管（`autospark.messages.shell` /
`autospark.overlays.panel-shell` / `autospark.overlays.drawer-shell`），原 `options.uiShells`
键（message/dialog/popover/drawer）与 `_uiShells`/`_uiShellCache` 独立注册表删除——外壳查找
（`_resolveUiShell`）收敛为「外壳键 → 注册名映射 → 统一组件链」；接管判定（builtin / wrapper 装配）
改按「用户 components 是否含注册名」（构造期固化 `_userOverriddenBuiltins`）。

## 否决的备选

- **构造期预热全部内置组件**（触发 global 段注册期注入的「声明即生效」字面语义）：实测破坏 head
  环境惰性假设（共享容器被提前创建），引发 global-style 测试域卡死——**弃**。注入时机收敛为
  「首次懒预编译即注入（先于任何实例挂载）+ 消费域 initialize 定点预热」。
- **内置样式进共享容器 `autospark-styles`**：与「共享容器专属用户组件」的测试/环境假设冲突——**弃**，
  内置段一律声明 id 容器。
- **保留 `uiShells` 双轨**：两层覆盖语义重复，违背「shell 本身也是组件」——**弃**。

## 约束与后果

- 同名接管 shell/base 后，该组件的 global 段整组替换（ADR-0087 既有语义延伸）——**默认视觉随定义
  消失**，接管者自带样式；「复用类名继承默认视觉」的便利特性退役。
- 用户覆盖 type 组件不带 defaults 段时无种子层（如 confirm 覆盖版须自带 sticky/双钮默认）。
- `DRAWER_SHELL_STYLES` 旧导出名退役；其断言源在测试中切为组件文件全文（规则文本逐字命中）。
- 预存层序矛盾（非本 ADR 引入，记录待并行会话对齐）：manager 构造期把 `MESSAGE_DEFAULTS`（含
  delayClose 3000）烘进 `state.options`，合并链 options 层会覆盖种子层的 `delayClose: 0`——
  confirm 的 sticky 种子在「用户未显式配置 delayClose」时不生效，需后续裁决（种子层上移或烘入排除）。
