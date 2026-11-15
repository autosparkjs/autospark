# Breadcrumb 面包屑

## 概述

Breadcrumb 是 AutoSpark 的官方面包屑组件（组件库 P1 导航件，ADR-0018 清单权威表 navigation 行）：展示当前页在站点层级中的路径——**末项恒为当前页**（`aria-current="page"`），带 `href` 的项渲染为真 `a` 链接（原生导航语义保真），无 `href` 的项渲染为纯文本。

两形态（统一收敛到 items 数据面渲染）：

- **items 数据驱动**：`{ label, href?, icon? }[]` 经**状态引用**注入；
- **子元素声明**（静态路径）：`<x-breadcrumb-item label href icon>` 快捷写法，经 precompile 变换折叠为 items JSON（`data-items` 通道）。

分隔符（`separator`）：`"arrow"` 渲染 x-icon 内置箭头，其他任意字符串原样文本（缺省 `"/"`）；末项分隔符恒隐藏。

引入方式：引擎之后加载 `<script src="/autospark/autospark.breadcrumb.js"></script>`（自举注册），或聚合产物 `autospark.plugins.js`。

## 快速入门

```html
<script src="autospark.js"></script>
<script src="autospark.breadcrumb.js"></script>


<x-breadcrumb :items="crumbs"></x-breadcrumb>


<x-breadcrumb>
  <x-breadcrumb-item label="首页" href="/"></x-breadcrumb-item>
  <x-breadcrumb-item label="组件库" href="/zh/components/"></x-breadcrumb-item>
  <x-breadcrumb-item label="Breadcrumb 面包屑"></x-breadcrumb-item>
</x-breadcrumb>
```

```js
// 页面状态（items 恒经状态引用注入）
new AutoSpark(el, {
  crumbs: [
    { label: "首页", href: "/" },
    { label: "组件库", href: "/zh/components/" },
    { label: "当前页" }, // 末项：无 href → 纯文本 + aria-current="page"
  ],
});
```

`class` / `style` / `id` 与 `data-*` / `x-*` / `@` 前缀属性保留给宿主。

<demo html="components/navigation/breadcrumb/basic.html"/>

## 指南

### 面包屑项（items）

**类型**: `Array<{ label: string, href?: string, icon?: string }>`
**默认**: `[]`

数据驱动形态：`label` 为项文案；`href` 在场渲染为真 `a` 链接（primary 色），缺席渲染为纯文本（正文色）；`icon` 为项级图标名（x-icon 渲染，尺寸随字号档位）。

> **注入提示**：items 恒经**状态引用**注入（`items: crumbs`，`crumbs` 为页面/局部状态）——当前引擎版本对值对象内的**字面量**数组 props 存在无限更新缺陷，字面量写法会触发死循环。静态路径请用子元素声明形态（或裸 `items='[...]'` JSON 字符串属性，precompile 变换会分流到 `data-items` 通道）。

末项语义：最后一项恒标注 `aria-current="page"`（不论有无 href）——「当前页」由位置表达，无需手工标记。数据变化（数组整体替换）即时重渲染，末项语义随项数变化自动迁移。

### 子元素声明（`<x-breadcrumb-item>`）

静态路径的快捷写法：`label` / `href` / `icon` 三个标量属性，由 precompile DOM 变换折叠为 items JSON 落宿主 `data-items` 属性（字符串标量通道，规避字面量数组 props），组件 mounted 解析渲染；声明元素本身从 DOM 摘除。`:items` 状态引用在场时恒优先（声明子元素仍被摘除、不参与渲染）。声明形态仅支持静态标量——动态路径请用 items 状态引用。

### 分隔符（separator）

**类型**: `string`
**默认**: `"/"`

`"arrow"` 渲染 x-icon 内置箭头图标；其他任意字符串（`"/"`、`"·"`、`">"` …）原样文本渲染。末项分隔符经 CSS `:last-child` 隐藏（当前页后无路径）。

<demo html="components/navigation/breadcrumb/separator.html"/>

### router 配方（纯状态驱动，不耦合 router）

组件遵循 router 隔离约定（ADR-0018 决策 6 约定 2）：**不 import router 包**，激活态由状态表达。联动两步：

```html


<div id="crumb-wrap">
  <x-breadcrumb :items="route.crumbs"></x-breadcrumb>
</div>
```

```js
// 路由切换时更新状态（route.crumbs 由当前 matched 路径映射生成）
document.getElementById("crumb-wrap").addEventListener(
  "click",
  (e) => {
    const a = e.target instanceof Element ? e.target.closest("a[href]") : null;
    if (!a) return;
    e.preventDefault(); // 拦截默认导航
    router.push(a.getAttribute("href")); // 交由路由接管
  },
  true, // capture：先于链接默认行为
);
```

<demo html="components/navigation/breadcrumb/router.html"/>

### 事件

`click` 原生冒泡（链接项默认导航放行——拦截见上方 router 配方）。组件自身不派发自定义事件。

### 主题化

字号档位：任意祖先容器挂 `data-size`（theme 手动通道，经 autospark.base 继承）；暗色：容器裸挂 `data-dark`。使用者覆盖通道 `--asc-breadcrumb-*`（如 `--asc-breadcrumb-link`、`--asc-breadcrumb-current`、`--asc-breadcrumb-sep`）。

## 参考

### 属性

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| items | `Array<{ label, href?, icon? }>` | `[]` | 面包屑项（状态引用注入；末项恒当前页） |
| separator | `string` | `"/"` | 分隔符（`"arrow"` 图标 / 任意文本字符） |

### 事件

| 事件 | 参数 | 说明 |
| --- | --- | --- |
| click | 原生事件 | 链接项原生点击冒泡（默认导航放行） |

### Slots

| 插槽 | 说明 |
| --- | --- |
| — | 无插槽（内容全部由 items 数据驱动） |
