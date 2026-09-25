# 配置选项

## 组件声明配置

| 项 | 位置 | 说明 |
| --- | --- | --- |
| `x-define="name"` | 元素属性 | 声明作用域组件，`name` 为组件名（裸属性取名 `default`） |
| `x-define.open` | 修饰符 | 开放数据边界（≡ `x-define-options="{open:true}"`，详见[数据边界](./data.md#数据边界默认封闭与-open)） |
| `x-define-options` | 元素属性 | 组件选项：`open`（开放边界开关）、`dataContext`（`'host'\|'declarer'` 数据上下文，须配合 `open`） |
| `x-scope` | 元素属性 | 为纯容器建 scope 锚点，让内部 `x-define` 有归属（详见 [x-scope](../directives/x-scope.md)） |
| `options.components` | engine 构造选项 | 声明全局组件，`Record<string, string>`（字符串模板，自动包装；`open`/`dataContext` 写在字符串根元素上） |

## `x-component` 配置

```html
<!-- 字面量组件名 -->
<div x-component:counter></div>

<!-- 值专职 props（组件名在属性参数中，对象内无特殊键） -->
<div x-component:counter="{count: 100, step: 5 }"></div>

<!-- 消费侧 .open 豁免：打开封闭组件（≡ x-component-options="{open:true}"，不 warn） -->
<div x-component:counter.open></div>

<!-- 指令选项：覆盖已开放组件的数据上下文（对完全封闭组件无效，warn） -->
<div x-component:counter x-component-options="{ dataContext: 'declarer' }"></div>
```

指令选项与修饰符：`.open`（消费侧豁免，≡ `x-component-options="{open:true}"`）与 `x-component-options.dataContext`（数据上下文覆盖，见[数据边界](./data.md#数据边界默认封闭与-open)）；值即组件名或 props 对象。

## `x-import` 配置

```html
<!-- 作用域加载（默认） -->
<div x-import="/components.html"></div>

<!-- 全局加载（.global 修饰符） -->
<div x-import.global="/components.html"></div>

<!-- name 属性（可选诊断）：加载后校验该名组件已注册，未注册则 warn -->
<div x-import="/components.html" name="my-button"></div>
```

| 项 | 说明 |
| --- | --- |
| 指令值 | url 字面量（`/`、`./`、`http(s)://` 开头）或响应式表达式 |
| `.global` | 修饰符，注册为全局组件（默认作用域） |
| `name` | 可选属性，加载后校验该名组件已注册 |

::: info 关于指令配置体系
指令选项 / 修饰符 / 宿主选项 / 两层回退见[指令配置](../directive/config.md)。
:::
