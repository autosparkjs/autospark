# x-import 远程组件加载

## 概述

`x-import` 从远程 url **fetch HTML 加载组件定义**（fetched HTML 内可含 1-N 个 `x-define`），注册到当前引擎：默认注册为**作用域组件**（挂最近祖先 scope，仅本作用域可见）；`.global` 修饰符注册为**全局组件**（`engine.options.components`，全引擎复用）。

```html
<!-- 作用域组件：仅本作用域及子树可见 -->
<div x-import="/components/card.html"></div>

<!-- 全局组件：全引擎复用 -->
<div x-import.global="/components/widgets.html"></div>
```

它是**声明性指令**：本身不渲染（无 DOM 输出），仅副作用（加载注册）。

## 快速入门

`x-import` 加载远程 HTML 里的组件定义；组件未就绪时 `x-component` 显示 loading 占位，加载完成后自动重试实例化（异步占位）；同一 url 有缓存，重复 import 不重复 fetch。

<demo html="component/import.html"/>

## 指南

### 指令值

指令值是**目标 url**（必填，空值 `warn` 跳过），双轨解析：

#### 字面量 url

`/a.html`、`./a.html`、`../a.html`、`http(s)://…`、纯路径等**直接加载**——不经表达式求值，避免 `/` 被当除法、`http://` 被当注释：

```html
<div x-import="/components/card.html"></div>
```

#### 表达式：响应式 url

含空白 / 花括号 / 状态变量的值按**表达式**经 `watch` 求值得 url——**url 响应式**，变化自动重载（abort 旧请求、丢弃过期结果）：

```html
<!-- 响应式 url：切语言重载对应组件包 -->
<div x-import="'/components/' + lang + '/card.html'"></div>
```

### 作用域与全局注册

| 形态 | 注册目标 | 可见范围 |
| --- | --- | --- |
| `<div x-import="url">` | 最近祖先 `scope.components` | 本作用域及子树（同层兄弟 `x-component` 可见） |
| `<div x-import.global="url">` | `engine.options.components` | 全引擎（scope 链终点兜底） |

一个远程文件可含**多个 `x-define`**（批量注册）；`.global` 批量注册时每个组件独立入全局表。

<demo html="component/import-global.html"/>

### 异步占位时序

`x-import` 编译期尽早发起 fetch（priority = 75，先于 `x-component` 的 70），但网络到达仍是异步的：

1. `x-component:名称` 实例化时组件未就绪 → 宿主挂 **loading 占位**（`x-loading` 机制）；
2. fetch 完成、组件注册 → 广播 `component/registered`；
3. pending 的 `x-component` 监听到目标名就绪 → 移除占位、自动重试实例化。

<demo html="component/import.html"/>

### name 属性校验

`x-import` 元素可声明 `name` 属性作**加载后自检**：加载完成后校验该名组件已注册，未注册 `warn`（诊断「url 拼写对但组件名不对」的错位）。

```html
<div x-import="/components/card.html" name="card"></div>
```

### 容错

- 网络错误 / HTTP 非 2xx → `warn` + 该 url 组件视为未注册（**不阻断其余 url 的加载**）；
- **url 缓存**：同一 url 重复 import 命中缓存，不重复 fetch；
- **循环 import 检测**：A import B、B import A 的环被检测并中断该导入链（`warn`）；
- 加载中途 url 变化 → abort 旧请求丢弃过期结果。

## 配置选项

| 配置项   | 默认值 | 修饰符   | 说明                                                                                                       |
| -------- | ------ | -------- | ---------------------------------------------------------------------------------------------------------- |
| `global` | `false` | `.global` | 注册为全局组件（`engine.options.components`），等价 `x-import-options="{global:true}"` 或宿主 `x-options` |

`name` 是原生 HTML 属性（非指令选项），见[name 属性校验](#name-属性校验)。

::: info 关于指令配置体系
指令选项 / 修饰符 / 宿主选项 / 两层回退见[指令配置](../directive/config.md)。
:::

## 注意事项

- **远程内容是组件定义**：fetched HTML 的顶级元素须带 `x-define`（引擎按该属性筛注册）；普通 HTML 片段不会被注册为组件；
- **fetched HTML 同样支持 `<script setup>` / `<style>`**：加载注册时一并提取求值，能力与本地声明等价——**仅加载可信来源**（`new Function` 信任求值）；
- **不渲染自身**：`x-import` 元素无 DOM 输出，可写在任意位置（通常放消费处附近或统一容器）；
- **消费侧**：加载的组件经 `x-component:名称` 实例化，见 [x-component](./x-component.md)。
