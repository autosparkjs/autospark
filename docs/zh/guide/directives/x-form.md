# 表单

## 概述

在 [x-model](./x-model)（散装控件双向绑定）之上提供**完整的表单能力**：字段元数据驱动（label / widget / 校验 / enable）、错误显示、提交校验门、reset 快照回滚、跨字段联动——**只处理表单逻辑，不处理模板和渲染**（控件长什么样永远由模板决定）。

```html
<form x-form="{ username: '', password: '' }" @submit="register">
  <input x-field="username" />
  <input x-field="password" />
  <button type="submit">注册</button>
</form>
```

::: tip 一句话分工
**表单域用 x-field，散装控件用 x-model**。x-field 在标准控件上等价于 x-model 的全部能力（双向绑定 + 元数据注入），并且必须在 `x-form` 内使用。
:::

## 快速入门

<demo html="form/basic.html" />

`x-form="{...}"` 声明表单数据（自建私有域，与 [x-data](./x-data) 同款机制）；`x-field` 在 `<input>` 上完成双向绑定；`$form.dirty` / `$form.valid` 由引擎自动维护；`重置` 按钮触发**状态回初始快照**（不是浏览器原生只重置 DOM 的 reset）；提交被恒拦截并放行给 `@submit`。

## 指南

### 声明表单

`x-form`指令于在`form`元素中创建一个实时响应式表单。

| 值形态           | 语义                                                                                          | 适用                            |
| ---------------- | --------------------------------------------------------------------------------------------- | ------------------------------- |
| `x-form`（空）   | 绑定**全局状态**                                                                              | 状态已在别处声明（如构造入参）  |
| `x-form="{...}"` | 对象字面量**自建私有域**（`$scopes[id]`，页面局部）                                           | 快速原型、独立表单              |
| `x-form="login"` | **路径上下文**——指向已有状态（`$scopes` 祖先链优先、全局兜底），后代 x-field 可用**相对路径** | 全局/局部已有数据结构的表单片区 |

#### 绑定全局状态

`x-form` 空值 = 纯行为壳（提交门 / 校验 / reset 照常），不建任何数据——字段经**绝对路径**引用全局状态（构造入参或别处声明），表单外与表单内同源可见：

<demo html="form/declare-global.html" />

#### 字面量自建私有域

`x-form="{...}"` 把表单数据写进属性（与 [x-data](./x-data) 同款私有域机制）：域内插值**直读字段名**（不必写全路径），数据只在表单子树可见、随表单销毁自动回收：

<demo html="form/declare-literal.html" />

#### 路径上下文

`x-form="login"` 指向已有状态（`$scopes` 祖先链优先、全局兜底）并建立**路径上下文**——后代 x-field 用相对路径（`username` → `login.username`，嵌套 `address.city` 同理）；拼接失败 warn 后回退原路径：

<demo html="form/path-context.html" />

x-form 还完整继承 x-data 的值形态：url（`x-form="/api/user"` 拉取初始数据）、`<script type="autospark/data">` 数据脚本声明。

::: warning 约束
x-form 只能声明在 `<form>` 元素上；表单数据恒挂私有域（`mount` 强制 local，`mount`/`global` 选项被忽略）。
:::

### 声明字段

`x-field`指令于在`x-form/form`元素内部创建响应式表单字段。

#### 控件形态

`x-field` 声明在 `input`/`textarea`/`select` 等**标准控件**上时，行为与 `x-model` 完全一致（ControlKind 分派、`.trim`/`.number` 修饰符、[元数据自动注入](./x-model#元数据自动注入)），并额外注入 `$field`：

```html
<form x-form="{ age: 18 }">
  <input x-field.number="age" />
  <!-- 双向绑定 + number 转换 -->
</form>
```

<demo html="form/field-control.html" />

#### 容器形态（自定义渲染）

声明在**非控件元素**（如 `<div>`）上时，x-field 只做**字段域声明 + `$field` 注入**——渲染完全归模板。这是元数据驱动表单的主力形态：

```html
<form x-form>
  <div x-field="login.username">
    <label>{{ $field.label }}</label>
    <input x-bind="$field" />
    <!-- 一行展开全部绑定属性与事件 -->
    <p class="error" x-text="$field.error"></p>
  </div>
</form>
```

<demo html="form/metadata.html" />

### $field：字段上下文

`$field` 是注入后代作用域的 Proxy 对象，三种读取来源分层响应：

| 键                                                                         | 来源                                 | 响应式                  |
| -------------------------------------------------------------------------- | ------------------------------------ | ----------------------- |
| `$field.value`                                                             | 字段状态值（可读可写）               | ✅ 自动（依赖收集穿透） |
| `$field.error`                                                             | 校验错误（`store.errors` 桥接）      | ✅ refresh 驱动         |
| `$field.onInput` / `$field.onChange`                                       | 写方向事件封装                       | —（挂载用）             |
| `$field.enable` / `$field.visible` / `$field.disabled` / `$field.readOnly` | 动态控制白名单（configManager 桥接） | ✅ refresh 驱动         |
| `$field.label` / `$field.widget` / `$field.placeholder` / ...              | 任意 `configurable(v, {...})` 元数据 | 静态快照                |

元数据读取走**覆盖链**：`x-field-options` > `configurable` schema > 默认值。覆盖只作用于模板视图，**不写回** schema 本体：

```html
<div x-field="login.username" x-field-options="{ label: '账号', name: 'user' }"></div>
```

### x-bind="$field"：控件展开

`x-bind` 无参形态（[属性展开](./x-bind#属性展开)）以 `$field` 为源时，按**控件白名单键集**展开——一行拿到标准控件的全部绑定：

<demo html="form/spread.html" />

| 键                                                                                       | 内容                                                                                                 |
| ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `type`                                                                                   | `widget` 映射（`email`/`number`/...；textarea/select 是标签级映射不出此键）                          |
| `value`                                                                                  | 字段值（`widget:"checkbox"` 时为 `checked` 布尔键）                                                  |
| `name`                                                                                   | schema.name > 路径末段                                                                               |
| `placeholder`/`required`/`readonly`/`pattern`/`minlength`/`maxlength`/`min`/`max`/`step` | schema 有的才出键（动态交集）                                                                        |
| `disabled`                                                                               | `enable` 反向映射（`schema.disabled` 显式优先）                                                      |
| `onInput` / `onChange`                                                                   | 事件封装（控件感知读值 + 修饰符管道 + 写回状态）                                                     |
| `choices`                                                                                | 仅 `widget:"select"` 且 schema.choices 存在时出键——select 宿主上渲染 `<option>` 子树（静态手写优先） |

`label`/`help` 等非控件元数据**不进键集**（用 <span v-pre>`{{ $field.label }}`</span> 消费）。radio 不支持 spread 消费（checked 需与宿主 value 比对，请用控件形态）。

### 标准表单字段

input / textarea / select 三类标准控件一律 `<控件 x-bind="$field" />` 快速绑定；**select 的 schema.choices 自动渲染 `<option>` 子树**（响应式：程序改写 `schema.choices` 经 configManager 桥接触发全量重建，选中态自动重放）。静态手写 `<option>` 优先于 choices（与 [x-model 选项三源](./x-model#选项列表) 同序）。

<demo html="form/native-fields.html" />

### 自定义渲染

标准控件之外，`$field` 让你**用任意 DOM 表达一个字段**——引擎只提供元数据与值（`label` / `help` / `required` / `visible` / `error` / `value`），DOM 结构、class、样式完全由模板层控制：

- **元数据组装**：<span v-pre>`{{ $field.label }}`</span>、`x-show="$field.required"`（必填标记）、`x-show="$field.help"`（帮助文字）、`x-class="{ 'is-error': $field.error }"`（错误态描边）——卡片、行内、栅格随意搭；
- **非标准控件**：星级评分、开关、颜色板等引擎没有的控件，用普通元素自绘——`@click="$field.value = n"` 直写值（`.value` 可写），`x-class="{ on: $field.value >= n }"` 按值点亮；
- **联动显隐**：`$field.visible` 属动态控制白名单（configManager 桥接，refresh 驱动）——程序改写 `schema.visible` 即可控制字段去留（`x-if="$field.visible"`）。

<demo html="form/custom-render.html" />

### 字段联动

一个字段的值驱动其他字段的状态，两条正道按场景选：

- **模板表达式联动**（简单场景）：联动逻辑直接写在目标处——`:disabled="network.dhcp"`。值在变的联动最直白，但同一条件驱动多个字段时模板要重复多处；
- **元数据联动**（跨字段收口）：联动条件驱动 `enable` / `visible`（动态控制白名单），用一处 `engine.store.watch("源字段路径", 回调)` 监听源字段、程序改写目标字段的 `schema.enable` / `schema.visible`——目标侧零改动（`x-bind="$field"` 自动展开 disabled、`x-if="$field.visible"` 自动显隐），变更经 configManager 桥接 + refresh 生效。经典 ipconfig 场景：DHCP 开关一拨，IP/网关禁用、子网掩码隐藏。

<demo html="form/linkage.html" />

::: warning 已知限制（联动正道）
schema 字段写 `enable: computed(() => state.xxx)` 联动全局状态会得到**陈旧缓存**（autostore 跨 store 失效链断裂）——联动一律走**模板表达式**或**字面量元数据 + watch 程序改写**（上例两种皆是）。
:::

### 字段名称

每个字段有一个**名称 name**，按三层解析（高优先者胜）：

| 层级      | 声明位置                           | 示例                          |
| --------- | ---------------------------------- | ----------------------------- |
| 1（最高） | `x-field-options="{name:'...'}"`   | 字段级显式覆盖                |
| 2         | `configurable(v, { name: '...' })` | schema 元数据                 |
| 3（默认） | 路径末段                           | `login.username` → `username` |

两个消费点：

- **`$form.getState()` 无参形态的键**——`{ name: 值 }`（`getState(true)` 用完整路径键，不受 name 影响）；
- **控件的 `name` 属性**——`x-bind="$field"` 展开的 `name` 键（表单提交语义），同走三层链。

同名冲突（两个字段解析出同一 name）：**后者覆盖 + warn**——与数据合成「后到覆盖」惯例一致，改名请走第一层显式声明。

<demo html="form/field-name.html" />

### 表单上下文

x-form 容器内注入 `$form`（字段可分散于状态树，故 `getState` 是方法而非对象）：

| 键                     | 说明                                                                                          |
| ---------------------- | --------------------------------------------------------------------------------------------- |
| `$form.getState()`     | 聚合注册字段的值：`{ name: 值 }`（name 三层解析：`x-field-options` > schema.name > 路径末段） |
| `$form.getState(true)` | `{ path: value }`（键为完整状态路径）                                                         |
| `$form.valid`          | 无任何校验错误即 `true`                                                                       |
| `$form.errors`         | `Record<字段路径, 错误信息>` 聚合                                                             |
| `$form.dirty`          | 任一字段值 ≠ 初始快照即 `true`                                                                |
| `$form.reset()`        | 回初始快照（与 `重置` 按钮同一条管道）                                                        |

### 提交

x-form 恒拦截原生提交（`preventDefault`——`action` 属性留给无 JS 降级）；`validateOnSubmit`（默认开）做**校验门**：逐字段跑 `schema.validate` + 存量错误检查，任一存在错即 `stopImmediatePropagation` **阻止 `@submit` action**，通过才放行——提交逻辑写在 action 里，引擎不做隐式 fetch。`x-form-options="{validateOnSubmit:false}"` 关闭校验门直通。

<demo html="form/submit.html" />

### 校验

**写入即校验**（autostore 写入路径校验器）：schema 声明 `onInvalid: "pass"` 让错误静默收集进 `store.errors`（不阻断输入），x-form 会为未显式声明的字段补此默认。错误显示归模板——`$field.error` 逐字段、`$form.errors` 聚合、`$form.valid` 联动（如 `:disabled="!$form.valid"` 控制提交按钮）；修正输入后错误自动消失。

<demo html="form/validate.html" />

### 重置

拦截原生 reset + 状态回 **applyData 后的初始深快照**（`Object.assign` 回域，永不换容器）——状态驱动架构下浏览器原生只重置 DOM 会造成显示与状态分叉，reset 必须是状态操作；`dirty` 复位、错误重算。`$form.reset()` 与 `重置` 按钮同一条管道。

<demo html="form/reset.html" />

## 配置

```html
<!-- 表单级：validateOnSubmit（默认 true）/ onInvalid（表单级校验默认，字段 schema 覆盖之） -->
<form x-form x-form-options="{ validateOnSubmit: false, onInvalid: 'pass' }">...</form>

<!-- 字段级：元数据覆盖（优先于 configurable schema） -->
<div x-field="login.name" x-field-options="{ label: '覆盖名', name: 'userName' }">...</div>
```

::: warning 已知限制
schema 字段写 `computed` 联动全局状态会得到陈旧缓存（autostore 跨 store 失效链断裂）——联动请写模板表达式（`:disabled="level <= 0"`）或字面量元数据 + 程序改写。详见 ADR-0045「限制与避坑」。
:::
