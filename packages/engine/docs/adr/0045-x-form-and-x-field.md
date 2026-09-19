# ADR-0045：x-form / x-field 表单指令系统

- **状态**：Accepted
- **日期**：2026-09-19
- **关联**：[ADR-0029](0029-x-data-mount.md)（`$scopes` 挂载模型——x-form 状态复用其管道）、[ADR-0032](0032-data-script.md)（数据脚本——x-form 全额继承）、[ADR-0018](0018-x-model-two-way-binding.md)/[ADR-0023](0023-x-model-checkbox-single-boolean.md)/[ADR-0026](0026-x-model-select.md)（x-model 控件语义——控件形态全额复用）、[ADR-0020](0020-x-model-schema-auto-injection.md)（元数据自动注入白名单）、[ADR-0043](0043-attribute-spread.md)（属性展开——`x-bind="$field"` 的载体）、[ADR-0044](0044-engine-owned-store.md)（引擎自建 store + 默认 configManager——元数据管道前提）、[ADR-0007](0007-directive-options-and-modifiers.md)（x-form-options / x-field-options 形态）、[ADR-0019](0019-x-bind-config-reference-prefix.md)（`@` 配置绑定——cm.watch 桥接同款）、[CONTEXT.md](../../CONTEXT.md)（「表单层」词条族）

## 背景

表单是 x-model（散装控件双向绑定）之上的整体能力：字段元数据（label/widget/校验/enable/visible）、错误显示、提交拦截、reset、跨字段联动。autostore 侧已有完整基建：`configurable(value, schema)` 声明元数据、`store.configManager`（独立 AutoStore）注册 schema、写入路径校验器（onInvalid 四行为）、`store.errors` 收集错误。经五轮 grilling 定案 20 项决策，关键响应式行为均经 spike 实证（见「限制与避坑」）。

## 决策

### 1. 状态容器：复用 `$scopes` 私有域，不建独立 AutoStore

否决「x-form 自建独立 store 挂 `scope.store`」：引擎是单 store 管线（scope.watch / 插值 desugar / x-model 读写 / scheduler 全绑 `engine.store`，ADR-0044 后恒为引擎自建），引入第二 store 须做 scope 级 store 切换的引擎级改造，且跨 store 依赖收集断裂（spike 实证：根 store watcher 读外部 store 代理，字面量字段收不到任何依赖、computed 字段拿到陈旧缓存）。`$scopes.<id>` 私有域（ADR-0029）已满足隔离/销毁诉求，configurable builder 在域内经 GET 陷阱就地激活并注册 configManager（ADR-0032 决策 2 已验证）。

### 2. x-form：仅 `<form>` 元素，继承 DataDirective，值三形态

- **宿主约束**：仅合法于 `<form>` 元素（提交语义的前提）；其他元素 warn。
- **实现基座**：继承 DataDirective——literal / url / action 三值形态（ADR-0033）与 `<script type="autospark/data">` stash 消费（ADR-0032）全额免费；mount **强制 local**（显式 root/global 声明 warn 并按 local 处理——表单数据不进根 state）。
- **值形态终表**：
  - `x-form`（空）：纯行为壳（submit 拦截 + 校验门 + reset + 中心化监听），字段经 x-field 引用全局状态；
  - `x-form="{...}"`：对象字面量自建 `$scopes[id]` 域（x-data 同款管道）；
  - `x-form="login"`：状态路径——解析 `$scopes` 祖先链优先、全局 state 兜底，命中后**建立路径上下文**。
- **路径上下文与相对路径**：路径形态下后代 `x-field="username"` 拼接为 `login.username`（嵌套路径 `x-field="address.city"` 同理）；相对解析失败（路径不存在）warn 后回退绝对路径解析。

### 3. x-field：单指令双形态（按宿主分派），强依赖 x-form

- **控件形态**（input / textarea / select 等标准控件宿主）：= **x-model 全部语义**（ControlKind 分派、get/set、修饰符管道、ADR-0020 元数据自动注入、ADR-0023/0026 控件语义）+ `$field` 注入。表单内不再写 x-model（DRY），散装控件场景仍用 x-model。
- **容器形态**（div 等非控件宿主）：字段域声明 + `$field` 注入后代作用域，渲染完全归模板；**不** ownsChildren、**不做任何自动渲染**（x-form/x-field 只处理表单逻辑，不处理模板和渲染——领域划界）。
- **强依赖**：x-field 必须声明在 x-form 内，否则编译期报错。架构根源见决策 4。

### 4. 中心化监听（Centralized Watching）

x-form 作为**唯一订阅者**统一监听 configManager 元数据依赖（`configManager.watch(fullKey, callback, {depth:2})` 家族），各 x-field 编译期向所属 x-form **注册**（字段路径 + 消费回调），变更由 x-form 分发——避免 N 个字段建 N 份独立监听。这是 x-field 强依赖 x-form 的理由（资源与一致性）。

### 5. `$field`：Proxy 对象，响应式三分层

- **API 面**：`.value`（字段状态值，getter/setter 读写）、`.error`（当前校验错误）、`.onInput` / `.onChange`（写方向事件封装，双给）、`.xxx`（任意 configurable 元数据，经元数据覆盖链解析，见决策 9）。
- **响应式三分层**（spike 实证的硬约束）：
  - `value`：getter 读根 store 状态路径——求值栈内依赖收集**穿透成立**（schema.value getter 桥接业务 store，实测收集到根 store 路径），零桥接；
  - `error` + **动态控制白名单**（`enable` / `visible` / `disabled` / `readOnly`）：字面量元数据与 `store.errors` 对根 store 管线**不可见**（实测依赖收集为空 / errors 是非响应式普通对象）——经 `configManager.watch` 桥接（ADR-0019 同款）维护本地副本，变更时更新副本 + `scheduler.schedule(refresh)`（复用 x-data locals 的 refresh 机制）；
  - 其余元数据（label / widget / placeholder / choices / ...）：**静态快照**（表单声明期 schema 已定格，运行时改 label 属配置面板场景，YAGNI）。

### 6. 控件展开：`x-bind="$field"` 复用属性展开 + 控件白名单键集

载体是 ADR-0043 属性展开（`x-bind` 无参形态）。`$field` 作为展开源时 ownKeys 暴露**控件白名单键集**（与 `$field.xxx` 任意元数据读取共存——Proxy get 与 ownKeys 职责分离）：

- `type`（widget 映射：AutoStoreWidgets 键与原生 input type 近恒等，textarea/select/checkbox/radio 为控件标签级映射，不匹配 warn）+ `value` + `name`；
- ADR-0020 注入白名单属性（placeholder/title/required/readonly/pattern/minlength/maxlength/min/max/step，schema 有才出键；`enable`→`disabled` 反向）；
- `onInput` / `onChange`（addEventListener 挂载，读值→修饰符管道→写状态，x-model 同款）；
- **不展开**：label/help/tooltip/widget 原键/choices/validate 等非控件元数据；
- **select 边界（决策 6 修订，demo 阶段裁决）**：`x-bind="$field"` 在 `<select>` 上展开 value/onChange/name/required/disabled，**choices 出键并渲染 `<option>` 子树**（widget=select 且 schema.choices 存在；SpreadBinder 特判键——数组值 + select 宿主 → 全量重建，静态手写 `<option>` 优先，与 x-model 三源同序；选中态经 value 键的 microtask 重放恢复，schema.choices 变更经 form 的 schema watcher 桥接驱动重建）。原「不做 choices 渲染」的边界被修订推翻——选项数据的声明源（schema）与消费点（spread 到 select）天然成对，强令手写违背「元数据驱动」初衷；
- 残留清理：动态键集 diff（上次有 `placeholder`、本次 schema 无 → removeAttribute，SpreadBinder 的 lastApplied 同款思路）。

### 7. `$form`：注入 x-form 容器的表单上下文

键集五元：`getState()` / `valid` / `errors` / `dirty` / `reset()`。

- **`getState()`** 双形态：无参返回 `{ name: 值 }`（name 经三层解析，见下）；`getState(true)` 返回 `{ path: value }`（键为完整状态路径）。聚合**已注册 x-field 的字段**（字段可分散于状态树，故不提供 `$form.state` 单一对象）；
- **name 三层解析**：默认 = 字段路径末段（`login.username` → `username`）→ `configurable(v, {name})` schema 指定 → `x-field-options="{name}"` 最高（与决策 9 覆盖链同构）；同名冲突 warn + 后者覆盖（与数据合成 deepMerge 后到覆盖惯例一致）；
- `valid` / `errors`：由 `store.errors` 桥接（响应式，同决策 5 白名单通道）；`errors` 为 `Record<字段路径, 信息>`；
- `dirty`：任何已注册字段值 ≠ 初始快照即 true（中心化监听免费驱动）；
- `reset()`：与 reset 按钮同一条管道（决策 8）。

### 8. 表单行为：submit 门 / reset 快照 / 写入即校验

- **submit**：默认拦截（preventDefault）+ 校验门（validateOnSubmit 开启时全量校验，存在错误即阻止）+ 放行 `@submit` action；`action` 属性留给无 JS 原生降级（渐进增强）。**不做内置 fetch**（序列化/文件上传/错误协议不进指令，提交逻辑归 action 体系——ADR-0036 描述符、x-loading 联动免费）。
- **reset**：拦截原生 reset 事件 + 状态回 applyData 后的**初始深快照**（Object.assign 回域，永不整体替换容器）——原生 reset 只重置 DOM 不重置 state，状态驱动架构下行为精神分裂，必须接管；接受随之而来的重渲染。
- **校验**：写入即校验（表单级 onInvalid 默认 `pass` 静默收集进 `store.errors`，不阻断输入），错误显示归模板（`{{ $field.error }}` / `:class="{invalid:$field.error}"`）。touched/pristine 留后续版本。

### 9. 配置：x-form-options / x-field-options（ADR-0007 标准形态）

- **x-form-options** 初始键集两枚：`validateOnSubmit`（默认 `true`，校验门开关）、`onInvalid`（表单级校验失败行为默认值，**字段 schema 的 onInvalid 覆盖之**）。无 `resetAfterSubmit`、无 `submit` action 直配（不与 `@submit` 双轨）。
- **x-field-options**：字段级元数据覆盖，优先级链 **`x-field-options` > `configurable` schema > 默认值**。覆盖仅作用于 `$field` 读取视图与行为（`$field.label`、getState() 键、name 属性注入），**不写回** configManager 注册的 schema 本体——schema 是状态层资产，指令选项是视图层覆盖（层责分离）。

### 10. 边界

- x-form 嵌套 x-form：warn 并内层独立成立（表单域不合并）；
- x-field 路径解析：路径上下文（决策 2）+ 绑定作用域（`$scopes` 祖先链 / 全局）叠加，局部覆盖全局——与表达式解析心智一致；
- 容器形态嵌套 x-field：内层遮蔽外层 `$field`（就近原则，与 localData 层叠同构）；
- 字段路径无对应 schema：绑定照常（x-model 语义），`$field` 元数据键返回 undefined（不 warn——schema 是增强非前提）。

## 限制与避坑（spike 实证，文档化）

1. **schema 字段写 computed 联动根 store 会得陈旧缓存**：`enable: computed(() => state.xxx > 0)` ——cm 侧 computed 的缓存不被根 store 变更失效（跨 store 失效链断裂，实测 watcher 触发但求值得旧值）。联动正道：模板表达式（`:disabled="level<=0"`）或字面量元数据 + 程序改写（走决策 5 桥接）。
2. **字面量元数据运行时改写对根 store 管线不可见**：`{{ $field.enable }}` 的依赖收集为空（实测），改写必须经 `configManager` 响应式代理且由桥接通道（决策 5）驱动刷新。
3. `store.errors` 是懒创建普通对象（非响应式代理），一切错误读取走桥接副本。

## 被否决的方案

- **独立 AutoStore 表单域**（`scope.store`）：引擎级 store 切换改造 + 跨 store 依赖收集断裂，违背 KISS（决策 1）。
- **通用 `{...expr}` 属性 spread 语法**：happy-dom 拆碎属性名、与浏览器解析不一致（ADR-0043 已否决的载体）；`x-bind="$field"` 特化形态胜出。
- **x-field 独立于 x-form**：每字段独立建监听，资源浪费；强依赖换取中心化监听（决策 4）。
- **内置 fetch 提交管道**：指令长出 HTTP 客户端（序列化/上传/错误协议/成功回调全要设计），提交逻辑归 action 体系（决策 8）。
- **widget 自动渲染器**（x-field 容器无内容时按 widget 生成控件）：引擎变 UI 组件库（每 widget 一渲染器 + 注册表 + 定制点爆炸）；AutoSpark 渲染模板，不生成模板（决策 3）。
- **`$field.input` 专属属性包**（grilling 中间形态）：并入 `$field` 本体（Proxy get/ownKeys 分离，决策 5/6）。
- **`$form.state` 单一对象**：字段可分散于状态树，无单一 state 可指——改 `getState()` 聚合方法（决策 7）。
- **x-field 收敛为容器形态 only**：控件形态（= x-model 语义）保留——`<input x-field="username"/>` 是最高频书写形态。

## 后果

- ✅ 表单三件套（提交门 / 校验 / reset）+ 元数据驱动（configurable 声明一处，$field/$form/spread 三态消费）落地，零 UI 生成。
- ✅ 全额复用既有机制：$scopes 域（0029）、数据脚本（0032）、x-model 控件语义（0018/0023/0026）、元数据注入（0020）、属性展开（0043）、默认 configManager（0044）、配置体系（0007）。
- ⚠️ 元数据响应式限动态白名单（enable/visible/disabled/readOnly + error），其余静态快照；schema computed 联动是已记录陷阱（限制 1）。
- **实现落点**：`src/directives/presets/form.ts`（FormDirective，继承 DataDirective）、`src/directives/presets/field.ts`（FieldDirective，组合 ModelDirective）、`$field`/`$form` 上下文注入（scope locals **独立拷贝层**——`_linkParent` 把父 locals 以共享引用下传，直接加键会污染整个子树）、SpreadBinder 的 `$field` 键集扩展 + **`on*` 函数键事件挂载分支**（bind-spread.ts）、presets 注册。
- **实现注记（根容器事件盲点）**：挂载容器自身的指令在 template 克隆根上执行，`addEventListener` 挂在克隆上收不到真实事件——FormDirective 经 `binding.template === engine.template` 判定根容器形态、把 submit/reset 挂到 `engine.el` 实容器（`_hostEl`）；**x-on 在根容器上仍有此盲点**（引擎既有局限，超出本 ADR 范围），demo 指引：需要绑定事件的元素作为容器后代出现。
- **交付**：x-form.test.ts（19）/ x-field.test.ts（23）、CONTEXT.md「表单层」词条族、docs/zh/guide/directives/x-form.md + docs/demos/form/（basic / metadata / path-context / submit-validate，Playwright 端到端验证：双向绑定、spread 展开、错误显示/消失、校验门拦截与放行、reset 回滚、dirty/getState 全链路通过）。
