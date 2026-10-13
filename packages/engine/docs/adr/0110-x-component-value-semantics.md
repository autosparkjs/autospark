# ADR-0110：x-component 值语义三分与 options 扩展

- 状态：已采纳（2026-10-13 grilling 三轮共识落盘，实施随本 ADR 进行）
- 日期：2026-10-13
- 关联：ADR-0054（组件定义与实例化更名——值专职 props 的原始约定）、ADR-0066（x-component 远程直接实例化 loader，源码注释中的 ADR-0065 即本 ADR）、ADR-0007（指令配置体系——选项成员属性 / 宿主回退）、ADR-0053（组件数据边界 open/dataContext）

## 背景

ADR-0054 定约「属性参数承载组件名、值专职 props」后，远程组件消费须两段声明：
`x-component:detail` + `x-component-options.loader="detailUrl"`——最常见的一次性远程
实例化写法冗长。同时 props 只能经指令值单通道传递，url 简写形态下 props 无处安放；
`x-define-options` 的边界声明（`open`/`dataContext`）组件作者定死后，消费侧无法按
实例微调。

## 决策

### 1. 值语义三分：文本级 `isLiteralLoaderUrl` 消歧

指令值按**表达式文本形态**分流（判定与 loader 通道既有 `isLiteralLoaderUrl` 同源——
`/` `./` `../` `http(s)://` `file://` 开头即字面量 url）：

| 形态 | 值解释 | props 来源 |
| --- | --- | --- |
| `x-component:名称="props表达式"` | props（ADR-0054 原语义，不变） | 指令值 |
| `x-component:名称="<字面量url>"` | url 通道直载 | `x-component-options.props` |
| `x-component="<url>"` | **无参简写：值专职 url** | `x-component-options.props` |

零歧义依据：props 表达式永不以 url 前缀字符开头（表达式以标识符 / 引号开头），文本级
判定无需求值。已有限制（与 loader 通道同款，文档声明）：以 `/` 开头的动态拼接表达式
被当字面量，须先落状态再绑定。

**否决项**：求值后类型分流（string→url / object→props）——会把 `x-component:box="obj"`
的语义从 props 翻转为 url，破坏现有代码；显式 `.loader` 修饰符——修饰符混入
`_resolveComponentName` 的点号组件名候选集，污染名字解析。

### 2. 无参形态：值专职 url，组件名随清单重新决策

- 字面量直载；非字面量按表达式 watch 求值：string→url、object→loader 配置、
  null→静默（对齐 props 绑定 nullish 静默先例）；undefined 且值为纯标识符形态 →
  **一次性迁移提示**（疑似旧组件名写法 `x-component="counter"`，指向属性参数）——
  不做「恒 undefined」判定的精确化（异步不可判定），首帧 undefined 即提示、标志位防刷屏；
- **不做本地组件名简写**（`x-component="counter"` ≡ `x-component:counter`）：与迁移
  提示语义冲突，YAGNI；
- 多组件返回取**文档序首个 + warn**（用户裁决 B，否决 error 呈现案）；warn 按
  per-url 去重（url 回切会重新提示，字面去重实现）；
- **组件名非静态**：每次加载从远程清单重新决策（`_anonymousUrl` 标志）——url 响应式
  变化后新清单不含旧名时**不得**误走有参形态的同名校验失败分支；加载完成前
  `componentName` 为 null，error 文案退化为「远程组件」。

### 3. props 双源合并

- 通道**仅** `x-component-options.props`：整包静态对象（无热更新）或成员属性表达式
  （`watch` 响应式，overlay 基座 `_onPropsChange` 同款模式）；
  **否决 `x-component.props` 短语法**——getDirectives 会把它解析为独立指令信息
  （name=component + `.props` 修饰符），与同元素 `x-component="<url>"` 形成两条
  singleton 同名指令，须解析器为单指令开特例，破坏 `-options` 后缀家族的解析正交规则；
- 合并：`Object.assign(optionsProps, 指令值)`——options.props 打底、**指令值覆盖同名
  键**（用户裁决 B）；浅合并，嵌套对象键整体替换（与既有 props 覆盖语义一致）；
- 无效源（标量 / 数组 warn）按缺失处理，另一源独走；两源各自订阅，任一变化重算合并，
  经既有 `_propsEqual` 防抖 + `_updateProps`（值没变不打回、组件内部状态不重置）；
- url 形态下指令值被占用，props 单源 = options.props，不 warn。

### 4. loader 配置平铺归一

- url 优先级：**指令值 > `options.loader.url`**；双 url 声明 warn + 指令值胜；
- `fallback` / `error` / `width` / `height` / `request` 平铺读 `x-component-options`
  顶层同名键（经 `getOption` 三层：成员表达式 > 整包 > 宿主回退，成员属性形态天然
  响应式）；同名键**顶层平铺 > loader 对象内嵌**（与 url 的「更外显者胜」心智一致）；
- `loader` 对象形态保留兼容，不废弃、不 warn。

### 5. 实例级边界覆盖（extends x-define-options）

- `x-component-options` 支持 `open` / `dataContext` 与作者侧同键：**显式布尔 open
  （含 `false`）覆盖 `def.open`**——三级优先级：消费显式声明 > 作者声明 > 默认封闭。
  这是对 ADR-0053 修订一「消费侧 `.open` 是豁免（OR 语义）」的收紧：消费侧从「只能
  打开」变为「可开可关」（实例级，浅克隆 def 传入实例化，不回写冻结快照与注册表，
  同组件多实例互不影响）；`dataContext` 校验沿用 `finalizeBoundaryOptions` 语义
  （实例 `open !== true` 时消费侧 dataContext warn + 忽略）；
- 消费侧 open 维持**只读指令选项层**（不经宿主 `x-options` 回退，ADR-0007 隔离例外不变）；
- **不做** `x-component:名.open` 之外的新修饰符形态——`.open` 修饰符现状可用
  （解析期注入 options.open），行为随覆盖语义自然升级。

### 6. 兼容与术语

- `x-component:名称="{props}"`、`x-component-options.loader` 全保留，**不发废弃
  warn**，文档标注推荐新写法；`.global` 修饰符与全部新形态正交；
- CONTEXT.md「指令选项」词条 Avoid 列表的 `props` 为**泛称禁用**：`x-component-options.props`
  是组件域正名（`ComponentInstance.props` / `_updateProps`）的专名键，词条已加豁免注。

## 测试

- `x-component-value-semantics.test.ts`（新增 18 例）：三分形态、无参响应式重载（名字
  重新决策）、多组件取首个、双源合并（覆盖 / 响应式 / 无效源 / 防抖）、平铺键优先级、
  双声明 warn、open=false 实例覆盖（含与 open 组件共存互不影响）；
- `x-component-props.test.ts`：两个「缺参 warn」用例按新语义改写（url 通道激活 /
  undefined 迁移提示）；
- 既有 x-component / boundary / overlay / dialog / drawer / popover 全绿（314 pass）。

## 后记（实施期发现）

调试中发现**预存行为**：x-text 绑定**非空元素**时最终文本为「新值 + 原占位」拼接
（宿主直用 / 本地组件 / 远程三处对照一致，与本次改动无关）——既有 x-text 测试全部
使用空元素故未暴露。疑似编译器把模板文本子节点 append 回指令 created 已清空的 el
（指令 created 早于子节点处理）。未在本 ADR 范围内修复，待独立排查。
