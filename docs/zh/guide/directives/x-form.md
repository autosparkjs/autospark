# x-form 表单

## 概述

在 [x-model](./x-model)（散装控件双向绑定）之上提供**完整的表单能力**：表单数据声明、字段注册（[x-field](./x-field)）、提交校验门、reset 快照回滚、错误与脏态聚合——**只处理表单逻辑，不处理模板和渲染**（控件长什么样永远由模板决定）。

```html
<form x-form="{ username: '', password: '' }" @submit="register">
  <input x-field="username" />
  <input x-field="password" />
  <button type="submit">注册</button>
</form>
```

::: tip 一句话分工
**表单域用 [x-field](./x-field)，散装控件用 [x-model](./x-model)**。x-field 在标准控件上等价于 x-model 的全部能力（双向绑定 + 元数据注入），并且必须在 `x-form` 内使用——字段的声明、`$field` 上下文与全部玩法见 [x-field](./x-field)（含[与 x-model 的区别](./x-field#与-x-model-的区别)对比）。
:::

## 快速入门

<demo html="form/basic.html" />

`x-form="{...}"` 声明表单数据（自建私有域，与 [x-data](./x-data) 同款机制）；[x-field](./x-field) 在 `<input>` 上完成双向绑定；`$form.dirty` / `$form.valid` 由引擎自动维护；`重置` 按钮触发**状态回初始快照**（不是浏览器原生只重置 DOM 的 reset）；提交被恒拦截并放行给 `@submit`。

## 指南

### 指令值

`x-form` 指令用于在 `form` 元素中创建一个实时响应式表单。值三种形态：

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

### 表单上下文

x-form 容器内注入 `$form`（字段可分散于状态树，故 `getState` 是方法而非对象）：

<demo html="form/basic.html" />

| 键                     | 说明                                                                                                        |
| ---------------------- | ----------------------------------------------------------------------------------------------------------- |
| `$form.getState()`     | 聚合注册字段的值：`{ name: 值 }`（name 三层解析见 [x-field · 字段名称](./x-field#字段名称)）                |
| `$form.getState(true)` | `{ path: value }`（键为完整状态路径）                                                                       |
| `$form.valid`          | 无任何校验错误即 `true`                                                                                     |
| `$form.errors`         | `Record<字段路径, 错误信息>` 聚合                                                                           |
| `$form.dirty`          | 任一字段值 ≠ 初始快照即 `true`                                                                              |
| `$form.reset()`        | 回初始快照（与 `重置` 按钮同一条管道）                                                                      |

### 提交

x-form 恒拦截原生提交（`preventDefault`——`action` 属性留给无 JS 降级）；`validateOnSubmit`（默认开）做**校验门**：逐字段跑 `schema.validate` + 存量错误检查，任一存在错即 `stopImmediatePropagation` **阻止 `@submit` action**，通过才放行——提交逻辑写在 action 里，引擎不做隐式 fetch。`x-form-options="{validateOnSubmit:false}"` 关闭校验门直通。

<demo html="form/submit.html" />

### 校验

**写入即校验**（autostore 写入路径校验器）：schema 声明 `onInvalid: "pass"` 让错误静默收集进 `store.errors`（不阻断输入），x-form 会为未显式声明的字段补此默认。错误显示归模板——[$field.error](./x-field#字段上下文) 逐字段、`$form.errors` 聚合、`$form.valid` 联动（如 `:disabled="!$form.valid"` 控制提交按钮）；修正输入后错误自动消失。

<demo html="form/validate.html" />

### 重置

拦截原生 reset + 状态回 **applyData 后的初始深快照**（`Object.assign` 回域，永不换容器）——状态驱动架构下浏览器原生只重置 DOM 会造成显示与状态分叉，reset 必须是状态操作；`dirty` 复位、错误重算。`$form.reset()` 与 `重置` 按钮同一条管道。

<demo html="form/reset.html" />

::: warning reset 只回值、不回数组结构
字段级回滚不重建数组：reset 前删掉的行不复活、新增的行不消失（x-for 项内字段同理——项字段随项销毁自动注销，已删行的字段不参与回滚，[ADR-0076](https://github.com/zhangfisher/autospark/blob/main/packages/engine/docs/adr/0076-x-field-item-abs-path.md)）。需要整体回滚（含结构）时请在应用层对数组整体赋回快照。
:::

## 配置选项

两套指令选项：表单级 `x-form-options`（本节）、字段级 `x-field-options`（写方向修饰符、元数据覆盖与 get/set 通道见 [x-field · 配置选项](./x-field#配置选项)）——宽松 JSON 对象；读取走「指令选项 → 宿主选项 `x-options`」两层回退、缺失才回退，见[指令配置](../directive/config.md)：

```html
<!-- 表单级：validateOnSubmit（默认 true）/ onInvalid（表单级校验默认，字段 schema 覆盖之） -->
<form x-form x-form-options="{ validateOnSubmit: false, onInvalid: 'pass' }">...</form>
```

| 配置项             | 默认值   | 修饰符    | 说明                                                                                         |
| ------------------ | -------- | --------- | -------------------------------------------------------------------------------------------- |
| `validateOnSubmit` | `true`   | —         | 表单级：提交校验门——逐字段跑 `schema.validate` + 存量错误检查，任一有错即阻止 `@submit`；`false` 直通 |
| `onInvalid`        | `'pass'` | —         | 表单级：校验失败默认行为（`pass`/`throw`/`ignore`/`throw-pass`），补写进未显式声明的字段 schema；字段 schema 显式声明覆盖之 |

### 表单级（x-form-options）

url / action 异步取数形态沿用 x-data 的[异步专属选项](./x-data#异步状态反馈)（`path` / `loading` / `method` / `header`）。

::: warning 无效选项
`mount` / `global`：表单数据恒挂私有域（mount 强制 local），声明即 warn 忽略。
:::

## 注意事项

- **只能声明在 `<form>` 上**：`x-form` 写在非 form 元素上无效；表单数据恒挂私有域，`mount` / `global` 选项声明即 warn 忽略。
- **x-field 必须在 x-form 内**：表单内字段经 [x-field](./x-field) 声明——沿作用域链就近查找所属表单（含表单元素自身），脱离表单编译期报错、指令失效；字段值必须是**简单状态路径**（不支持表达式）。字段的双形态、`$field` 上下文、拆分 / 组合 / 联动等玩法见 [x-field](./x-field)。
- **reset 是状态快照回滚**（回到 applyData 后的初始深快照、`Object.assign` 回域），不是浏览器原生只重置 DOM 的 reset——状态驱动下二者会分叉。
