# 模板

## 概述

模板是 autospark 描述界面的方式——**挂载元素内部的普通 HTML 就是模板**，不需要学另一门模板语言。在 HTML 之上只有三种语法要素：

| 要素 | 写法 | 作用 |
| --- | --- | --- |
| 文本插值 | <span v-pre>`{{ 表达式 }}`</span> | 把状态值写进文本节点（等价 `x-text`） |
| 属性插值 | <span v-pre>`href="/users/{{ id }}"`</span> | 属性值内插值，编译期归一化为属性绑定 |
| 指令 | `x-text` / `:class` / `@click` | 属性形式的行为声明，见[模板指令](./template-directives.md) |

引擎构造时把挂载元素**深克隆为只读模板快照**（`engine.template`），编译产物挂回挂载元素；此后状态变化只 **patch 受影响的节点**，不重建子树——焦点、滚动、未提交输入都保留。

## 快速入门

一个例子看全三种要素：文本插值穿插多段、属性插值拼 href、`:class` / `@click` 简写与 `.once` 修饰符。

<demo html="template/syntax.html"/>

## 指南

### 文本插值

文本节点里的双花括号插值，花括号内写**路径或表达式**，效果与 `x-text` 等价：

```html
<!-- 一段文本穿插多个值 -->
<p>{{ user.name }}（{{ user.age }} 岁）</p>
<!-- 表达式 -->
<p>合计：{{ order.price * order.count }} 元</p>
```

- 按段拆分订阅——每个插值段独立求值、独立更新，字面量段是静态文本
- 写 `textContent`（转义文本），天然防 XSS；要注入原始 HTML 用 [x-html](./directives/x-html.md)

### 属性插值

属性值里也能插值，编译期**归一化为属性绑定**（等价 `:attr`），复用 `x-bind` 的分派逻辑：

```html
<a href="/users/{{ user.id }}">主页</a>
<span class="card {{ user.role }}">标签</span>
<input disabled="{{ form.locked }}" />
```

::: tip 整体单段 vs 混合段
整个属性值恰好是一对双花括号时，保留值的**原始类型**（boolean 就是 boolean）；字面量与插值混排时按字符串拼接。后者规避了布尔属性写成字符串恒真的 HTML 坑。
:::

插值的响应式机制与细节见[状态](./state.md#文本插值)。

### 指令

指令是宿主元素上**属性形式的行为声明**，识别三种前缀：

| 前缀 | 形态 | 示例 | 归一化 |
| --- | --- | --- | --- |
| `x-*` | 全称指令 | `x-text` `x-if` `x-for` | 原样 |
| `:*` | 属性绑定简写 | `:class` `:title` | `x-bind:*` |
| `@*` | 事件绑定简写 | `@click` `@input` | `x-on:*` |

一条声明可携带参数与修饰符：`x-on:click.enter.once="submit"`——指令名 `x-on`、参数 `click`、修饰符 `.enter` `.once`、值 `submit`。指令的完整索引与协作示例见[模板指令](./template-directives.md)，逐指令参考见侧边栏「指令」。

### 表达式与作用域

插值与指令值里写的是**表达式**：状态路径、算术、三元、方法调用皆可：

```html
<p>{{ todos.filter((t) => !t.done).length }} 项未完成</p>
<button :disabled="count >= max" @click="add(count + 1)">添加</button>
```

表达式按当前**作用域（scope）**解析路径：

| 写法 | 解析为 |
| --- | --- |
| `user.name` | 当前 scope 的相对路径（默认指向全局 state） |
| `todo.text`（`x-for` 项内） | 当前迭代项的字段 |
| `count`（`x-data` 作用域内） | 该元素声明的局部数据，覆盖同名全局状态 |
| `$store.count` | 显式访问全局 store（绕过局部覆盖） |

事件指令的值有特殊约定：裸标识符（`@click="add"`）按**动作名**查找，带调用括号（`@click="add(1)"`）按表达式执行。详见[动作](./action.md)、[状态·作用域与路径](./state.md#作用域与路径)。

### 模板的生命周期

| 阶段 | 说明 |
| --- | --- |
| 声明 | 挂载元素内部的 HTML 即模板源，引擎构造时深克隆为 `engine.template`（只读快照） |
| 编译 | `compile()` 基于只读模板生成产物（剥除指令属性），挂回挂载元素 |
| 更新 | 状态变化 → 订阅该路径的 watcher 精确 patch 文本/属性，不重建子树 |
| 销毁 | `destroy()` 清调度、销毁 scope、断开 observer |

需要在**运行时改变模板结构本身**（增删元素、替换片段）时用 `engine.patch()` 修改模板快照，引擎增量同步到运行树——见[动态模板](./patch.md)；模板片段也可以放在服务端按需加载——见[远程模板](./template-remote.md)。

::: warning HTML 解析约束
模板先经浏览器 HTML 解析器，再经引擎编译——`<ul>` 里只放 `<li>`、`<table>` 里遵循表格内容模型，否则浏览器会在解析期挪动节点，模板与预期失配。
:::

---

下一步：[模板指令](./template-directives.md)浏览全部指令的分组索引。
