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

`x-form` 指令用于在 `form` 元素中创建一个实时响应式表单。

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

`x-field` 指令用于在 `x-form` 表单内部创建响应式表单字段。**必须声明在 `x-form` 内**（沿作用域链就近查找所属表单，含表单元素自身），脱离表单则编译期报错、指令失效。

#### 指定字段值

值指定字段绑定的**状态路径**，必须为**简单状态路径**（不支持表达式，否则编译期报错、指令失效）。两种写法：

| 写法                 | 语义                                                                                                                    | 典型场景                                |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| 字段名（相对路径）   | 沿祖先链就近解析：字面量私有域（`x-form="{...}"`）解析为域内字段；路径上下文（`x-form="login"`）拼接为 `login.username` | 字段归属表单自身数据（最常用）          |
| 状态路径（绝对路径） | 按原路径解析，指向全局状态或域内深层位置                                                                                | 纯行为壳表单（`x-form` 空值）的唯一写法 |

- **拼接优先，失败回退**：路径上下文拼接后在作用域链内解析不到时 warn，按原路径重新解析；
- **解析产物（绝对状态路径）是唯一真相源**：双向绑定、`$field.value` 读写、表单订阅 / 快照 / `getState` 全走它。

#### 用在标准表单控件上（控件形态）

`x-field` 声明在 `input`/`textarea`/`select` 三类**标准控件**上时，行为与 `x-model` 完全一致（ControlKind 分派、`.trim`/`.number` 修饰符、[元数据自动注入](./x-model#元数据自动注入)），并额外注入 `$field`——表单内不必再写 `x-model`：

```html
<form x-form="{ age: 18 }">
  <input x-field.number="age" />
  <!-- 双向绑定 + number 转换 -->
</form>
```

<demo html="form/field-control.html" />

#### 用在非表单输入控件上（容器形态）

`x-field` 声明在 `div` 等非控件元素上时**只声明字段域**：把 `$field` 注入后代，引擎不渲染任何控件——DOM 结构与样式完全由模板决定。后代经 `<input x-bind="$field" />`（[控件属性展开](#控件属性展开)）或 <span v-pre>`{{ $field.label }}`</span> 消费：

```html
<form x-form="{ rating: 0 }">
  <div x-field="rating" x-field-options="{ label: '满意度' }">
    <label>{{ $field.label }}</label>
    <input x-bind="$field" />
  </div>
</form>
```

自绘非标准控件（星级评分、开关等）与元数据驱动的完整玩法见[自定义渲染](#自定义渲染)。

### 字段上下文

`$field` 是注入后代作用域的 Proxy 对象，三种读取来源分层响应：

| 键                                                                         | 来源                                                               | 响应式                  |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------ | ----------------------- |
| `$field.value`                                                             | 字段输入值（可读可写——schema 声明 toInput/toState 时为转换值，未声明即状态值） | ✅ 自动（依赖收集穿透） |
| `$field.error`                                                             | 校验错误（`store.errors` 桥接）      | ✅ refresh 驱动         |
| `$field.onInput` / `$field.onChange`                                       | 写方向事件封装                       | —（挂载用）             |
| `$field.enable` / `$field.visible` / `$field.disabled` / `$field.readOnly` | 动态控制白名单（configManager 桥接） | ✅ refresh 驱动         |
| `$field.label` / `$field.widget` / `$field.placeholder` / ...              | 任意 `configurable(v, {...})` 元数据 | 静态快照                |

元数据读取走**覆盖链**：`x-field-options` > `configurable` schema > 默认值。覆盖只作用于模板视图，**不写回** schema 本体：

```html
<div x-field="login.username" x-field-options="{ label: '账号', name: 'user' }"></div>
```

### 视图转换（toInput / toState）

字段的[元数据](#元数据自动注入)提供 `toInput` / `toState` 转换函数时，x-field 自动让其在**全部读写通道**生效（ADR-0050）——典型场景：状态存编码值（`sex: 1`），控件显示文案（`"男"`）：

```ts
import { configurable } from "autospark";

const state = {
  user: {
    sex: configurable(1, {
      toInput: (v) => (v === 1 ? "男" : v === 0 ? "女" : ""), // state → 输入值
      toState: (v) => (v === "男" ? 1 : v === "女" ? 0 : v),  // 输入值 → state
    }),
  },
};
```

```html
<form x-form>
  <input x-field="user.sex" />
  <!-- 显示「男」；输入「女」→ state 存 0 -->
  <span x-text="$field.value"></span>
  <!-- 容器形态/插值同样显示「男」（$field.value 即字段输入值） -->
</form>
```

**管道位置**：

- 读方向：`state → toInput → 写控件`（空值同样喂给 toInput，空值处理归你的函数）；
- 写方向：`输入值 → .trim/.number/.boolean 修饰符 → toState → 写 state`（修饰符在前做类型规范化，toState 在后做业务转换）；select 多选**逐项**转换；
- checkbox 写方向：勾选恒布尔 → toState（是让 state 存 `1/0` 而非 `true/false` 的唯一通道）；读方向 `toInput → Boolean()` 得勾选态（返回值须能被 Boolean 正确转换）。

**规则与边界**：

- **声明 toInput 即接管空值显示**：`undefined/null` 也喂给 toInput，schema 的 `default` 回填不再参与；未声明 toInput 的字段空值回填照旧；
- **显式 `get` 优先**：`x-field-options="{get:'...'}"` 声明后 toInput 忽略（不叠加）；
- **radio/select 的 toInput 返回值须与 `option.value`（字符串）匹配**——数字 state 配字符串选项正是它的用武之地；
- **仅 schema 来源**：函数字面量无法写在 `x-field-options` 的 JSON 里；created 期静态读取，schema 须先于引擎编译注册；
- **失败不破坏**：转换函数 throw → warn 一次，读方向回退原值、写方向放弃本次写入；
- **form 层恒原始值**：`$form.getState()` / `dirty` / 快照回滚均用原始状态值，不受转换影响。

### 控件属性展开

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

### 字段拆分

**一个字段值拆到多个输入框编辑，写回时重组。** 典型如 IP 地址：`server.ip` 拆成 4 段输入框。

控件形态是**直写绑定**（写方向恒为「输入值直写字段」，不支持 x-model 的 `get`/`set` 变换），拆分场景走**容器形态 + action 双向变换**：容器 `x-field` 声明字段域（注册进表单——校验 / dirty / reset / `getState` 整字段共享），内部若干输入框各显示一段、编辑经 action 重组写回：

<demo html="form/field-split.html" />

```html
<form x-form="server">
  <div x-field="ip">
    <input :value="String($field.value).split('.')[0]" @input="setOctet(0, $event.target.value)" />
    <input :value="String($field.value).split('.')[1]" @input="setOctet(1, $event.target.value)" />
    <!-- 第 3、4 段同理 -->
  </div>
</form>
```

```js
actions: {
    // 替换第 index 段后重组写回——state 是唯一真相源，各段显示随状态自动重放
    setOctet: function (index, v) {
        const parts = String(this.globalState.server.ip).split(".");
        parts[index] = v;
        this.globalState.server.ip = parts.join(".");
    },
}
```

工作方式：输入 → action 重组写回 `server.ip` → 字段值变更 → 四个 `:value` 表达式重新求值、显示重放——段间互不覆盖；校验针对完整 `ip` 值，reset 一步回滚全部段。

### 字段组合

**多个字段组合到一个输入框，编辑后拆解写回各字段。** 典型如姓名：`user.first` + `user.last` 合显为全名框。组合框没有单一状态路径、**不是字段**——它是**派生视图**（`:value` 表达式显示，字段值变更自动重放）+ 写回 action（拆解到各字段）；被组合的字段仍是正经 `x-field`，校验 / 快照 / `getState()` 照常：

<demo html="form/field-combine.html" />

```html
<form x-form="user">
  <input x-field="first" />
  <input x-field="last" />
  <!-- 组合显示（路径上下文形态下表达式用完整相对路径）+ 编辑拆回 -->
  <input :value="user.first + ' ' + user.last" @input="splitName($event.target.value)" />
</form>
```

```js
actions: {
    // 把「名 姓」按空格拆回两个字段（组合框的写回通道）
    splitName: function (v) {
        const parts = String(v).split(" ");
        this.globalState.user.first = parts[0] ?? "";
        this.globalState.user.last = parts[1] ?? "";
    },
}
```

::: tip 与 x-model 的分工
散装控件（无表单能力诉求）的拆分 / 组合直接用 x-model 的 get/set 变换——见 [x-model · 字段拆分](./x-model#字段拆分) / [字段组合](./x-model#字段组合)；要字段注册、校验、重置等表单能力就用本节的 `$field` + action。
:::

### 字段联动

一个字段的值驱动其他字段的状态，两条正道按场景选：

- **模板表达式联动**（简单场景）：联动逻辑直接写在目标处——`:disabled="network.dhcp"`。值在变的联动最直白，但同一条件驱动多个字段时模板要重复多处；
- **元数据联动**（跨字段收口）：联动条件驱动 `enable` / `visible`（动态控制白名单），用一处 `engine.store.watch("源字段路径", 回调)` 监听源字段、程序改写目标字段的 `schema.enable` / `schema.visible`——目标侧零改动（`x-bind="$field"` 自动展开 disabled、`x-if="$field.visible"` 自动显隐），变更经 configManager 桥接 + refresh 生效。经典 ipconfig 场景：DHCP 开关一拨，IP/网关禁用、子网掩码隐藏。

<demo html="form/linkage.html" />

::: warning 已知限制（联动正道）
schema 元数据写 computed 联动在 x-field 下**不可用**——闭包直引（`computed(() => state.xxx)`）因 autostore 跨 store 失效链断裂得**陈旧缓存**；x-model 的 `ref()` 形式在 `$field` / spread 消费路径上同样不解析、不随源字段刷新。联动一律走**模板表达式**或**字面量元数据 + watch 程序改写**（上例两种皆是）；需要 schema computed 联动请用散装 [x-model · 字段联动](./x-model#字段联动)（其合成 `@` 绑定通道支持）。
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

两套指令选项：表单级 `x-form-options`、字段级 `x-field-options`（宽松 JSON 对象；读取走「指令选项 → 宿主选项 `x-options`」两层回退、缺失才回退，见[指令配置](../directive/config.md)）。

```html
<!-- 表单级：validateOnSubmit（默认 true）/ onInvalid（表单级校验默认，字段 schema 覆盖之） -->
<form x-form x-form-options="{ validateOnSubmit: false, onInvalid: 'pass' }">...</form>

<!-- 字段级：元数据覆盖（优先于 configurable schema） -->
<div x-field="login.name" x-field-options="{ label: '覆盖名', name: 'userName' }">...</div>
```

### 表单级（x-form-options）

| 配置项             | 默认值   | 说明                                                                                         |
| ------------------ | -------- | -------------------------------------------------------------------------------------------- |
| `validateOnSubmit` | `true`   | 提交校验门：逐字段跑 `schema.validate` + 存量错误检查，任一有错即阻止 `@submit`；`false` 直通 |
| `onInvalid`        | `'pass'` | 表单级校验失败默认行为（`pass`/`throw`/`ignore`/`throw-pass`），补写进未显式声明的字段 schema；字段 schema 显式声明覆盖之 |

url / action 异步取数形态沿用 x-data 的[异步专属选项](./x-data#异步状态反馈)（`path` / `loading` / `method` / `header`）。

::: warning 无效选项
`mount` / `global`：表单数据恒挂私有域（mount 强制 local），声明即 warn 忽略。
:::

### 字段级（x-field-options）

**写方向修饰符**（✅，解析期并入指令选项，与 x-model 同款管道 `trim → number → boolean`）：

| 修饰符      | 说明                                               |
| ----------- | -------------------------------------------------- |
| `.trim`     | 写回前去首尾空白（仅字符串）                       |
| `.number`   | 写回前转数字（NaN 回退原值，不破坏输入）           |
| `.boolean`  | `'true'`/`'false'`/`''` 转布尔（严格集外保留原值） |

**元数据覆盖**（覆盖链最高层 `x-field-options` > `configurable` schema > 默认；只作用于视图读取，**不写回 schema 本体**）：

| 键                                                  | 说明                                                                                        |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `name`                                              | 字段名显式覆盖（`getState()` 键 / 控件 `name` 属性；三层链第一层，同表单冲突后者覆盖 + warn） |
| `widget`                                            | 控件类型——`$field.type` 的 input 系映射、spread 的 `type`/`value`/`checked` 键选择依据       |
| `label` / `help` / `tooltip` / `placeholder` / ...  | 任意 configurable 元数据，`$field.<key>` 视图消费（静态快照）                                |
| `enable` / `visible` / `disabled` / `readOnly`      | 动态控制白名单（refresh 驱动；spread 中 `enable` 反向映射为 `disabled`）                     |

**get / set 变换通道**：`get` 透传内部 x-model 作**显示变换**（`x-field-options="{get:'...'}"`，表达式形参 `value` 或 action 名，同 x-model 的 get / set 变换）；写方向 `set` **由引擎接管**为直写表达式（声明的 set 被覆盖）——写方向变换（拆分 / 组合）用容器形态 + action，见[字段拆分](#字段拆分) / [字段组合](#字段组合)。

两点边界：

- **展开出键只认 schema**：`required` / `pattern` / `minlength` / `maxlength` / `min` / `max` / `step` / `choices` 等约束属性是否展开到控件由 schema 决定（[控件属性展开](#控件属性展开)），`x-field-options` 覆盖不影响出键判定；
- **校验三件套属 schema**：`validate` / `onInvalid` / `errorMessage` 的校验行为本身走 schema（写入即校验 + 提交门直调 `schema.validate`）；完整元数据键集以 autostore `configurable` 为准。

::: warning 已知限制
schema 字段写 `computed` 联动全局状态会得到陈旧缓存（autostore 跨 store 失效链断裂）——联动请写模板表达式（`:disabled="level <= 0"`）或字面量元数据 + 程序改写。详见 ADR-0045「限制与避坑」。
:::
