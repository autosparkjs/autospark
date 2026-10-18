# 模板指令

## 概述

指令是写在元素属性上的**行为声明**——插值负责「把值放进模板」，指令负责「让模板按状态行动」：渲染内容、控制结构、绑定属性与事件、组织数据与组件。引擎识别三种前缀的属性：

| 前缀 | 形态 | 示例 | 归一化 |
| --- | --- | --- | --- |
| `x-*` | 全称指令 | `x-text` `x-if` `x-for` | 原样 |
| `:*` | 属性绑定简写 | `:class` `:title` | `x-bind:*` |
| `@*` | 事件绑定简写 | `@click` `@input` | `x-on:*` |

本页只给**概览与索引**——逐指令的完整语义、配置与示例见「指令参考」各页（下方索引表直达）。

## 快速入门

一个面板串联多个指令家族：`x-data` 开局部数据域，`x-model` 双向绑定，`x-for` + `x-show` 控制结构，`:style` + `@click` 绑定属性与事件，插值读全局计算属性。

<demo html="template/directives.html"/>

## 指南

### 一条声明的组成

```html
<button x-on:click.enter.once="submit"></button>
<!--       └┬┘ └─┬─┘ └─┬─┘ └─┬─┘ └──┬── -->
<!--      指令名  参数  修饰符 修饰符  指令值(表达式) -->
```

- **指令名**：`x-on`
- **参数**：`click`——指令作用于哪个目标（事件名、属性名、组件名…）
- **修饰符**：`.enter` `.once`——无值开关，注入为指令选项
- **指令值**：表达式或动作名

参数、修饰符、指令选项的通用机制见[指令](./directive/index.md)与[指令配置](./directive/config.md)。

### 编译时与运行时

指令分两类执行通道：

- **编译时指令**（绝大多数）：模板编译期变换结构或建立绑定，指令属性被剥除，不进渲染 DOM；响应式来源支持相对路径、`x-data` 局部变量、`x-for` 项。
- **运行时指令**（`x-loading`）：编译器「致盲」、属性保留在渲染 DOM，由 `MutationObserver` 运行时驱动；响应式来源只接受绝对路径。

### 指令索引

按用途分组。组内只列一句话定位，细节点进各指令文档。

#### 内容渲染

| 指令 | 定位 |
| --- | --- |
| [x-text](./directives/x-text.md) | 文本绑定，写 `textContent`（与 `{{ }}` 等价） |
| [x-html](./directives/x-html.md) | HTML 绑定，写 `innerHTML`（默认消毒；`.compile` 作子模板编译） |
| [x-icon](./directives/x-icon.md) | 按名渲染 SVG 图标（symbol + `<use>`） |

#### 结构渲染

| 指令 | 定位 |
| --- | --- |
| [x-if](./directives/x-if.md) | 条件渲染，配套 `x-else-if` / `x-else` |
| [x-show](./directives/x-show.md) | 条件显隐（切换 display，不拆子树） |
| [x-switch](./directives/x-switch.md) | 多分支匹配渲染（`x-case` / `x-default`） |
| [x-for](./directives/x-for.md) | 列表渲染（容器 + 项模板），另有[分页](./directives/x-for-paging.md)、[虚拟列表](./directives/x-for-virtual.md) |
| [x-tree](./directives/x-tree.md) | 树形数据渲染 |
| [x-viewport](./directives/x-viewport.md) | 按视口断点条件渲染 |

#### 状态数据

| 指令 | 定位 |
| --- | --- |
| [x-data](./directives/x-data.md) | 局部响应式数据域（含异步数据源） |
| [x-scope](./directives/x-scope.md) | 零副作用哨兵：让裸元素可被 `engine.patch` 定位 |
| [x-isolate](./directives/x-isolate.md) | 隔离边界：宿主成为独立子引擎的根 |

#### 属性与事件

| 指令 | 定位 |
| --- | --- |
| [x-bind](./directives/x-bind.md) | 属性绑定（`:` 简写），`:class` / `:style` 是其特例 |
| [x-on](./directives/x-on.md) | 事件绑定（`@` 简写），支持按键/行为修饰符 |

#### 表单

| 指令 | 定位 |
| --- | --- |
| [x-model](./directives/x-model.md) | 控件双向绑定 |
| [x-form](./directives/x-form.md) | 表单容器：提交门、校验、reset |
| [x-field](./directives/x-field.md) | 表单字段声明（注入 `$field` 元数据） |

#### 组件

| 指令 | 定位 |
| --- | --- |
| [x-define](./directives/x-define.md) | 模板内定义组件 |
| [x-component](./directives/x-component.md) | 实例化组件（本地或远程 url） |
| [x-slot](./directives/x-slot.md) | 插槽出口与内容分发 |
| [x-slots](./directives/x-slots.md) | 覆盖物多消费者时的内容归属容器 |
| [x-super](./directives/x-super.md) | 组件继承中引用父组件插槽内容 |
| [x-import](./directives/x-import.md) | 远程加载组件定义并注册 |

#### 布局

| 指令 | 定位 |
| --- | --- |
| [x-container](./directives/x-container.md) | 响应式容器 |
| [x-layout](./directives/x-layout.md) | 布局编排（pane / block） |
| [x-foldable](./directives/x-foldable.md) | 可折叠面板 |
| [x-splitter](./directives/x-splitter.md) | 分栏拖拽 |
| [x-expandable](./directives/x-expandable.md) | 可展开区域 |
| [x-resizable](./directives/x-resizable.md) | 尺寸拖拽调整 |

#### 覆盖物

| 指令 | 定位 |
| --- | --- |
| [x-dialog](./directives/x-dialog.md) | 对话框 |
| [x-drawer](./directives/x-drawer.md) | 抽屉 |
| [x-popover](./directives/x-popover.md) | 气泡浮层 |
| [x-teleport](./directives/x-teleport.md) | 把内容传送到指定容器 |
| [x-loading](./directives/x-loading.md) | 加载覆盖层（运行时指令） |

::: tip 指令不够用？
注册自己的指令类，见[自定义指令](./directive/custom.md)。
:::

---

下一步：[远程模板](./template-remote.md)了解如何把模板片段放到服务端按需加载。
