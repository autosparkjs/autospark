# x-on 事件处理

## 概述

`x-on:event`（简写 `@event`）监听任意事件，触发一个**动作**（action）或求值一段表达式。它是交互的入口——动作里改写状态，状态变化再驱动界面更新。

```html
<button @click="save">保存</button> <input @input="onInput($event)" />
```

## 快速入门

<demo html="on/basic.html"/>

```html
<button @click="inc">+1</button>
<button @click.ctrl="ctrlClick">Ctrl+点击</button>
<input @keydown.enter="onEnter($event)" />
```

事件名写在属性参数上（`@click` / `x-on:click`）；值是动作名还是表达式见[指令值](#指令值)，详见[动作](../action.md)。

## 指南

### 指令值

指令值**必填**，按形态双轨分派：匹配「裸标识符 / 标识符(参数)」者按**动作**查找；否则按**表达式**求值。事件名本身由属性参数给出（`@click` 的 `click`）。

#### 动作名

查找顺序：组件 `<script setup>` 方法 → scope 动作链（局部 `<script type="autospark/actions">` → `engine.actions`），**每次触发时查**（后注册可覆盖）：

```html
<!-- 无参：直接引用动作名 -->
<button @click="save">保存</button>
<!-- 带参：动作名(参数)，参数按表达式求值 -->
<button @click="remove(item.id)">删除</button>
```

#### 表达式

不匹配动作形态（或动作查不到）时走 `with(data)` 表达式兜底，`$event` 注入事件对象：

```html
<button @click="count++">+1</button>
<input @input="onInput($event)" />
```

### 修饰符

修饰符串联在事件名后，按类型分三类：

| 类型    | 修饰符                                                                                                   | 作用                              |
| ------- | -------------------------------------------------------------------------------------------------------- | --------------------------------- |
| option  | `.once` `.capture` `.passive`                                                                            | 合并进 `addEventListener` 第 3 参 |
| guard   | `.self` `.ctrl` `.alt` `.shift` `.meta` `.exact` `.enter` `.esc` `.space` ... `.left` `.right` `.middle` | 组成 AND 链，任一不满足则短路     |
| wrapper | `.debounce` `.feedback`                                                                                  | 由外向内包裹整条管道              |

<demo html="on/basic.html"/>

```html
<!-- 只触发一次 -->
<button @click.once="init">初始化</button>
<!-- 需 Ctrl + 点击 -->
<button @click.ctrl="adminOp">管理操作</button>
<!-- 回车键提交（input 上） -->
<input @keydown.enter="submit($event)" />
```

修饰符与指令选项等价：`@click.ctrl` 等同 `@click="fn" x-on-options="{ctrl:true}"`。

### .debounce 防抖

`.debounce` 让动作延迟触发、期间重复事件只算最后一次。修饰符只负责**开启**（默认 300ms），自定义时长经指令选项配置：

<demo html="on/debounce.html"/>

```html
<input @input.debounce="search" x-on-options="{ debounce: 500 }" />
```

::: warning 时长只能走指令选项
修饰符位不接受数值（`.debounce.500` 的数字段不注入）——需要非默认时长必须写 `x-on-options="{debounce:N}"`。
:::

### .feedback 执行反馈

`.feedback` 为触发元素提供**声明式执行反馈**——动作 pending 时加 `pending` 类、resolved 加 `resolved` 类、rejected 加 `rejected` 类：

<demo html="on/feedback.html"/>

```html
<!-- 裸 .feedback：用默认反馈类 -->
<button @click.feedback="save">保存</button>
<!-- 自定义反馈类、目标、终态延时 -->
<button
    @click.feedback="save"
    x-on-options="{ feedback: { pendingClass: 'loading', resolvedClass: 'ok', timeout: 1000 } }"
>
    保存
</button>
```

feedback 捕获动作返回的 Promise 精确反馈，连点时用 generation 计数防陈旧覆盖。详见[动作 · feedback](../action.md#feedback-修饰符声明式反馈)。

### phase 修饰符与祖先聚合

监听**后代**触发的动作生命周期，用 `@action:<name>` 配合 `.pending` / `.resolved` / `.rejected` 按阶段过滤——靠 DOM 冒泡聚合后代，天然按层级隔离：

<demo html="on/phase.html"/>

```html
<form @action:submit.pending="onStart" @action:submit.resolved="onDone">
    <button @click="submit">提交</button>
    <button @click="submit">保存草稿</button>
</form>
```

## 配置选项

下列配置项控制触发条件与反馈。**修饰符与指令选项等价**（`@click.ctrl` ≡ `x-on-options="{ctrl:true}"`）；数值 / 对象形态（如 `debounce` 时长、`feedback` 子键）只能走指令选项。修饰符管道只读指令选项层——**不回退宿主 `x-options`**。未注册的选项键原样透传给动作内的 `this.$options`。

| 配置项                                                                                          | 默认值                               | 修饰符  | 说明                                                                                |
| ----------------------------------------------------------------------------------------------- | ------------------------------------ | ------- | ----------------------------------------------------------------------------------- |
| `debounce`                                                                                      | `300`（`.debounce` 裸用）            | ✅ `.debounce`  | 防抖毫秒；`.debounce` 开启默认 300ms，`x-on-options="{debounce:N}"` 自定义           |
| `feedback`                                                                                      | 类名 `pending`/`resolved`/`rejected` | ✅ `.feedback`  | 执行反馈对象，子键见下表；`.feedback` 裸用即全默认                                   |
| `once` / `capture` / `passive`                                                                  | 未启用                               | ✅ 同名  | 合并进 `addEventListener` 第 3 参                                                    |
| guard（`.self` `.ctrl` `.alt` `.shift` `.meta` `.exact` `.enter` `.esc` … 共 21 键）             | 未启用                               | ✅ 同名  | 组成 AND 链，任一不满足则短路；`.pending` `.resolved` `.rejected` 按动作阶段过滤      |

`feedback` 子键（写法 `x-on-options="{feedback:{…}}"`）：

| 子键              | 默认值               | 说明                                                                                     |
| ----------------- | -------------------- | ---------------------------------------------------------------------------------------- |
| `at`              | 宿主元素             | 反馈挂载目标：省略 = 宿主；`@…` = `document.querySelector`；其余 = `el.closest`          |
| `timeout`         | `0`                  | 终态类移除延时（毫秒；`0` = 常驻保留）                                                   |
| `pendingClass`    | `pending`            | 动作 pending 期附加的类名                                                                |
| `resolvedClass`   | `resolved`           | 动作成功后的类名                                                                         |
| `rejectedClass`   | `rejected`           | 动作失败后的类名                                                                         |
| `loading`         | `false`              | pending 期 loading 效果：`false` 仅类名；`true` / 对象启用完整 loading UI                |

::: info 关于指令配置体系
指令选项 / 修饰符 / 宿主选项 / 两层回退见[指令配置](../directive/config.md)。
:::

## 注意事项

- **`singleton=false`**：同一元素可绑多个 `@event`（不同事件类型），互不影响。
- **修饰符是 AND 关系**：多个 guard 修饰符（如 `.ctrl.shift`）需同时满足。
- **表达式兜底**：动作名查不到时退化为表达式求值——`@click="count++"` 直接改状态也行。
- **feedback / phase 的完整语义**（同步异步统一、防陈旧、祖先聚合）见[动作](../action.md)。
