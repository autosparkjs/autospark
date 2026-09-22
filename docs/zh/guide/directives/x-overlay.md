# 覆盖层定义（x-overlay）

## 概述

`x-overlay` 在模板中声明一个**覆盖层定义**（弹层模板资源）——对话框、抽屉、气泡等浮层的「内容模板」。声明在编译期被**剪枝缓存**为冻结快照（不进结果 DOM、声明处无闪现），由消费者指令（[x-dialog](./x-dialog) 等）状态驱动地实例化渲染到 `document.body` 下的容器中。

```html
<!-- 声明：编译期剪枝缓存 -->
<div x-overlay:login="dialog">
    <h3>{{title}}</h3>
</div>

<!-- 消费：x-dialog 状态驱动 -->
<button x-dialog:login="ui.loginVisible" @click="ui.loginVisible = true">登录</button>
```

覆盖层模板具**完整组件能力**——`<script setup>`（data / methods / 生命周期）、`<style>`（scoped CSS）随消费实例化生效。命名走冒号 attr（`x-overlay:<名称>`），与 `x-on:click` 的 attr 参数同构。

## 快速入门

<demo html="overlay/declare.html"/>

声明元素在结果 DOM 中不存在（编译期剪枝）；点击按钮时消费者沿 scope 链找到定义、克隆编译、渲染进 `body` 下的覆盖层容器——模板内表达式读**声明处** scope 的数据。

## 指南

### 声明语法：名称走冒号 attr

```html
<div x-overlay:login="dialog">…</div>      <!-- 名称 login，类型 dialog -->
<div x-overlay:note>…</div>                <!-- 无值 = 通用类型，任何消费者可消费 -->
```

- **名称**（`:` 后）是查找键，必需——缺失 warn + 剪枝丢弃；
- **值**是**类型认领**标记：`dialog` / `drawer` / `popup` / `popover`（v1 仅 `dialog` 有对应消费者，其余类型留给后续消费者认领）；消费者消费类型不匹配的定义时 warn 但仍渲染（类型是文档契约，不是运行时门槛）；允许任意自定义字符串；
- **同名定义**归属同一 scope 时 warn + 后者覆盖。

### `.global` 全局定义

带 `.global` 修饰符的定义升 **engine 级**全局表——任何 scope 链上的消费者（沿链查找的终点兜底）与命令式 `engine.getOverlay`（只查全局表）都能消费：

<demo html="overlay/global.html"/>

```html
<!-- 顶层声明全局定义 -->
<div x-overlay:confirm.global="dialog">…</div>

<!-- 深层嵌套的消费者：scope 链到顶兜底命中 -->
<button x-dialog:confirm="ui.showConfirm"></button>
```

::: info 命令式 = 全局消费
`engine.getOverlay(name)` 只查全局表——只有 `.global` 声明的定义命令式可达。局部定义请用 `x-dialog` 声明式消费。
:::

### 存储与查找：scope 链就近 + 全局兜底

查找协议与组件（`getComponent`）同构：消费者从自身 scope 起沿 parent 链向上取首个含该名定义的 scope（**就近覆盖**——内层同名定义遮蔽外层），到顶兜底 `engine` 全局表：

```
消费者 scope → 各祖先 scope.overlays[name] → engine._globalOverlays（.global 注入）
```

支持「公共全局样式 + 局部特例」：`.global` 声明通用确认框，某个子树内用同名局部定义覆盖它。未命中（整条链含全局）时消费者 warn + 不渲染。

定义的生命周期随归属：局部定义随声明 scope 回收；`.global` 定义的声明 scope 销毁时自动从全局表注销（不会留下悬空定义）。

### 完整组件能力

覆盖层模板经消费编译管道实例化——`<script setup>` 的 data / methods / 四阶段生命周期钩子与 `<style>` scoped CSS **全部生效**：

<demo html="overlay/component-capability.html"/>

```html
<div x-overlay:counter="dialog">
    <style>
        .cnt-panel { /* scoped CSS：只作用于本覆盖层实例 */ }
    </style>
    <script setup>
        {
            data() { return { count: 0 } },
            methods: { inc() { this.data.count++ } },
        }
    </script>
    <div class="cnt-panel">
        <div x-text="count"></div>
        <button @click="inc()">+1</button>
    </div>
</div>
```

配合消费者的 `singleton`（默认开启），单例覆盖层关闭是**隐藏保活**——组件内部状态（如计数）跨开合保留。

## 配置

`x-overlay-options`（声明处指令选项）是覆盖层的**默认配置层**，被消费处的配置覆盖。四级合并链与配置项详见 [x-dialog 的配置](./x-dialog#配置)。

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| `type` | 声明值 | 类型认领标记（`dialog` 等）；无值 = 通用 |
| `singleton` | `true` | 单例：懒实例化 + 关闭隐藏保活；`false` 每次新实例、可并存、关闭即销毁 |
| `closeOnMask` | `true` | 点击遮罩请求关闭 |
| `animate` | `"fade"` | 进出场动画（字符串 / 对象 / 分相 / `false`），复用[进出场动画](../animate.md)机制 |
| `scope` | `"declarer"` | scope 基准：表达式上下文 / 挂链 / 生命周期三合一（`declarer` 声明处、`consumer` 消费处） |
| `anchor` | 无（居中） | 定位锚配置：`{at, placement, offset, shift, flip, arrow}`，经 floating-ui 贴锚定位 |

::: info 关于指令配置体系
指令选项 / 修饰符 / 宿主选项见[指令配置](../config.md)。覆盖层的合并是**跨位置深度合并**（声明处默认 ← 消费处覆盖），与同元素的两层回退（ADR-0007）并存、边界见 ADR-0052。
:::

## 注意事项

- **声明处无闪现**：定义元素编译期被剪枝，不进结果 DOM——无需 `x-if` / `display:none` 之类的手工隐藏。
- **渲染位置在 body 下**：实例渲染进 `document.body` 下本 engine 的容器（`.autospark-overlays`），**不在 engine 宿主树内**——engine 树内模板元素的 DOM 事件监听收不到覆盖层内部冒泡的事件，跨层通信用引擎事件总线（`engine.on("overlay:close")`）。
- **声明元素上的其他指令随快照冻结**：与组件语义一致，`x-overlay` 元素上的 `x-text` 等指令在消费实例化时才编译执行。
- **名称必需**：`x-overlay`（无冒号名称）无法被查找，编译期 warn + 剪枝丢弃。
