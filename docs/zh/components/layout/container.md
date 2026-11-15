# Container 页面容器

## 概述

Container 是 AutoSpark 的官方页面容器壳组件（组件库 P2 布局件，ADR-0018 清单权威表 layout 行）：header / aside / main / footer 四区 grid 版式（纯样式结构壳——无状态无事件），侧栏位置可调（`asidePosition`：start 左 / end 右），空区自动退场（grid 轨道塌缩）。

**三方名字撞车边界消歧（必读）**——"container" 一名三物：

| 物 | 形态 | 职责 |
| --- | --- | --- |
| **本组件 `autospark.container`** | 组件（`x-component` / `<x-container>` 元素） | 四区版式结构壳（header 横贯顶、aside 侧栏、main 主区、footer 横贯底），纯 CSS grid |
| **x-container 指令** | 属性（`<div x-container>`） | 响应式断点容器——按视口档位切 max-width + 居中（Bootstrap `.container` 心智，ADR-0101/0105，autospark.layout.js） |
| **x-layout 指令** | 属性 + x-pane 窗格 | grid 窗格布局机制——窗格声明 / 分割调节（ADR-0074，autospark.layout.js） |

选型：整页四区版式用本组件；窗格分割/调节用 x-layout；内容宽度收束用 x-container 指令——**三者可叠用**（x-container 指令约束外层宽度、本件组四区版式、x-layout 在 main 区内做窗格分割）。

> **撞名规避**：本组件模板显式 `x-define-options="{tag:false}"` 关闭元素名自动推导（缺省推导 `<x-container>` 标签会与同名指令撞名，ADR-0133 撞名规则 fail-fast）；`<x-container>` 元素形态由本插件的 precompile 变换独占承载，`<div x-container>`（属性形态）恒指断点容器指令——两通道互不干扰。

引入方式：引擎之后加载 `<script src="/autospark/autospark.container.js"></script>`（自举注册），或聚合产物 `autospark.plugins.js`。

## 快速入门

```html
<script src="autospark.js"></script>
<script src="autospark.container.js"></script>

<!-- 子元素声明：四区各归其位（容器壳满父高——外层给定高度） -->
<div style="height: 400px">
  <x-container>
    <x-container-header>顶栏</x-container-header>
    <x-container-aside>侧栏</x-container-aside>
    <x-container-main>主区内容</x-container-main>
    <x-container-footer>底栏</x-container-footer>
  </x-container>
</div>
```

等价的插槽形态：`<template x-slot:header>` / `x-slot:aside` / `x-slot:footer` + 默认插槽（main）。

<demo html="components/layout/container/basic.html"/>

## 指南

### 四区内容（插槽 / 子元素声明）

四区内容通道双形态：

- **插槽形态**：`header` / `aside` / `footer` 命名插槽 + 默认插槽（main）；
- **子元素声明形态**：`<x-container-header>` / `<x-container-aside>` / `<x-container-footer>` 由 precompile 变换折叠为插槽声明（子内容随迁）；`<x-container-main>` 解包——子内容直落默认插槽。

未提供内容的区段整段退场（`:empty` 隐藏，grid 轨道自动塌缩）——纯顶栏壳、顶栏+主区+底栏等任意组合都成立。

### 侧栏位置（asidePosition）

**类型**: `start | end`
**默认**: `start`

侧栏落位：`start` 左（缺省）/ `end` 右（grid 区域模板与列轨对调）。侧栏宽度默认随内容自适应，可经 `--asc-container-aside-width` 覆盖变量定宽。

### 高度与滚动语义

容器壳**满父高**（`height: 100%`——四区自分割的价值前提是外层给定高度；未定高时 1fr 主区退化为内容高，空壳有最小高度下限）。滚动收敛在主区（`main` 区 `overflow: auto`），header / aside / footer 恒可见。

### 与 x-layout / x-container 指令的叠用

```html
<!-- x-container 指令约束整页内容宽度，本件组四区版式，main 区内再做窗格分割 -->
<div x-container>
  <x-container>
    <x-container-header>应用标题</x-container-header>
    <x-container-aside>导航</x-container-aside>
    <x-container-main>
      <div x-layout>……x-pane 窗格……</div>
    </x-container-main>
  </x-container>
</div>
```

（叠用 x-layout 须同页引 `autospark.layout.js`。）

### 主题化

区间距/内距：任意祖先容器挂 `data-spacing`（theme 手动通道，经 autospark.base 继承——`--auto-padding` 族）；暗色：容器裸挂 `data-dark`。使用者覆盖通道 `--asc-container-*`（如 `--asc-container-aside-width`、`--asc-container-border-color`、`--asc-container-header-bg`）。

## 参考

### 属性

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| asidePosition | `start \| end` | `start` | 侧栏位置（grid 区域模板对调） |

### 事件

| 事件 | 参数 | 说明 |
| --- | --- | --- |
| — | — | 纯样式结构壳，无事件 |

### Slots

| 插槽 | 说明 |
| --- | --- |
| 默认 | 主区（main） |
| header | 顶栏（横贯顶） |
| aside | 侧栏（start 左 / end 右） |
| footer | 底栏（横贯底） |
