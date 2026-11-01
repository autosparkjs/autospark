# ADR-0132: 自定义 script type 通用派发点

- 状态：已接受（Accepted，2026-11-01）
- 日期：2026-11-01
- 关联：plugins 包 ADR-0011（resource 插件——本决策的第一消费者）；ADR-0031（script type 命名空间化：`autospark/actions` / `autospark/setup`）、ADR-0032（`autospark/data`）、ADR-0111（插件机制——注册表=查询期委托模式）、ADR-0114（预加载队列）

## 背景

`autospark/*` 是引擎保留的 script type 命名空间（ADR-0031 家族），但 compiler 的前置 transformer **硬编码**只识别内置三种（actions 提取 / data 剪枝 / setup 组件内路径）——插件无法注册自定义 script 声明形态。resource 插件需要 `<script type="autospark/resources">` 作为模板内资源声明载体（手写方法含箭头函数，不适合塞进属性值），两条路：engine 硬编码 `autospark/resources` 分支委托处理（改动更小，但 engine 代码出现 plugins 包的领域词汇，破坏包边界），或提供通用派发点。

## 决策

### 决策 1：`AutoSpark.scriptType(type, handler)` 通用注册表

新增类静态注册入口 + `features/script-type/` 注册表（类静态全局 Map）。compiler 的 transformer 表在**内置条目之后**追加一条派发条目：命中 `autospark/*` 前缀且**非内置**的 script type 时查注册表，命中则调 handler（入参 `(script, 最近 scope, engine)`——scope 由 compiler 经 templateScopeMap 解析后传入，与 `extractScript` 入参模式同构），script 统一剪枝；未注册的 `autospark/*` 类型 warn + 剪枝（保留命名空间内容不泄漏进渲染 DOM）。

### 决策 2：与指令注册表同构（ADR-0111 模式复用）

- **类静态全局 Map、查询期委托**：编译时现查，插件晚注册（后于 engine 加载）对后续编译天然生效，无需广播；
- **注册校验**：type 须为 `autospark/<kebab-name>`（小写字母/数字/连字符）；内置名（actions/data/setup）不开放注册——warn + 拒绝（防插件劫持引擎语义）；handler 非函数拒绝；
- **重复注册** warn + 后者覆盖（与 `DirectiveManager.install` 撞自定义名同构——同插件双脚本标签重复加载时后者生效）；
- **handler 无返回值**：script 声明性内容统一「提取后剪枝」语义（同 actions/data）。

### 决策 3：内置类型跳过派发（行为零漂移）

派发条目以 `isBuiltinScriptType` 排除内置三种——顶层游离的 `autospark/setup` 等存量路径完全不受影响（`autospark/data` 由前面的内置条目消化，其余专用通道不变）。内置优先级由 transformer 表顺序表达（first-match-wins）。

### 决策 4：ActionManager 补 `registerScoped` 公共方法（配套收编）

`extractScript` 的局部分支（`_normalize(local=true)` + 合并进 `scope.actions`）收编为 public 方法——插件侧 handler 注册局部 action 时复用同一包装管线，**存储层全量规范化不变量**（scope.actions 值恒为 ActionDesc，ADR-0036 决策 1）由 engine 单点保证，插件不自行拼装描述符。行为零变化（extractScript 改为调用它）。

## 后果

- engine 对「资源」一无所知——`autospark/resources` 的词汇、求值与注入逻辑全部住在 plugins 包；engine 只提供命名空间开放规则。
- 未来任何插件声明形态（如 `autospark/icons`、`autospark/themes`）零 engine 改动接入——与 `$.directive` 收敛指令注册同一精神。
- 未注册的 `autospark/*` 从「原样保留进 DOM」变为「warn + 剪枝」——命名空间保留字的显式化，拼写错误的声明类型会得到提示而非静默残留。
