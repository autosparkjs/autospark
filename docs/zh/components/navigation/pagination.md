# Pagination 分页

## 概述

Pagination 是 AutoSpark 的官方分页器组件（组件库 P2 导航件，ADR-0018 清单权威表 navigation 行）：受控当前页（`page`，`el.value` 桥 + `change` 事件 `detail = { page, pageSize }` + `input` 回写 x-model）+ 每页条数切换（`pageSizes`，原生 select）+ 总条数（`total`）+ 极简形态（`simple`）。

页码窗口自动省略号折叠：总页数 ≤ 7 全量直出；> 7 时「首页 + 省略号 + 当前页 ±2 五宽窗口 + 省略号 + 末页」。上/下一页与首/末页按钮在边界自动禁用（原生 disabled），越界 page 自动钳位到 `[1, pageCount]`。

内置文案走 i18n 词典（ADR-0018 决策 6 约定 1）：`pagination.first` / `pagination.prev` / `pagination.next` / `pagination.last` / `pagination.total`（"共 {n} 条"插值）/ `pagination.pageSize`（"{n} 条/页"插值）——未装 i18n 插件或词典无键时回退硬编码中文。装 i18n 后可经 `x-locales` / `autospark/locales` script / `options.i18n.messages` 任意语言覆译，语言切换即时生效。

引入方式：引擎之后加载 `<script src="/autospark/autospark.pagination.js"></script>`（自举注册），或聚合产物 `autospark.plugins.js`。

## 快速入门

```html
<script src="autospark.js"></script>
<script src="autospark.pagination.js"></script>


<div @change="page = $event.detail.page">
  <x-pagination total="200" :page="page" x-pagination-options="{ props: { pageSize: 10 } }"></x-pagination>
</div>
```

```js
new AutoSpark(el, { page: 5 });
```

等价的 x-model 形态：宿主直接挂 `x-model="page"`（input 非冒泡通道回写）。

<demo html="components/navigation/pagination/basic.html"/>

## 指南

### 当前页（page）与值通道

**类型**: `number`
**默认**: `1`

受控页码（1-based），三通道同构（tabs/button-group 选中模式同款）：

- **props 单向驱动**：`:page="p"` 变化即时迁移激活页 + 窗口重排；越界值自动钳位（page > pageCount 归位末页）；
- **点击 / 程序写值**：写组件内部状态 + 双派发——`input`（非冒泡，x-model 监听回写）+ `change`（冒泡，`detail = { page, pageSize }`）；
- **el.value 桥**：宿主 `value` 属性劫持（读 = 当前页数字、写 = 静默归位），程序读写皆经此。

同值点击短路（不重复派发）；`total = 0` 空态：单页直出、翻页全禁用。

### 每页条数（pageSize）与总条数（total）

**类型**: `number` / `number`
**默认**: `10` / `0`

`pageCount` 由二者派生（`Math.ceil(total / pageSize)`，至少 1）；total / pageSize 变化自动重排窗口并钳位当前页。`total` 为 0 时呈现单页空态。

### 条数切换（pageSizes）

**类型**: `Array<number>`
**默认**: `[]`

每页条数切换数组（原生 select 原生增强）。切换后**页码自动重置 1**，change 携新对 `detail = { page: 1, pageSize }`。

> **注入提示**：pageSizes 恒经**状态引用**注入（`pageSizes: sizes`）——值对象内的字面量数组 props 存在无限更新缺陷（ADR-0019 规避清单第 1 条）。元素名形态可用裸属性 `page-sizes="[10,20,50]"`（JSON 字符串，precompile 改道 `data-page-sizes` 通道）或宿主 `data-page-sizes` 属性。

### 极简形态（simple）

**类型**: `boolean`
**默认**: `false`

极简形态：`‹ 3 / 20 ›`——隐藏总条数、条数切换、页码窗口、首/末页按钮，只保留上/下一页与「当前 / 总页」文本。窄空间与移动端推荐。

### 页码窗口与边界

总页数 ≤ 7 全量直出；> 7 时窗口 = 首页 + [左省略号] + 当前页 ±2 + [右省略号] + 末页（省略号随窗口贴边单侧收缩）。首/末为双箭头按钮，上/下页为单箭头（内置 arrow 图标），边界自动禁用（原生 disabled，键盘天然拦截）。

### i18n 文案

六键走词典（命名参数 `{n}` 插值）：

| 键 | 回退中文 | 说明 |
| --- | --- | --- |
| `pagination.total` | `共 {n} 条` | 总条数文案（命名插值） |
| `pagination.pageSize` | `{n} 条/页` | 条数切换选项文案 |
| `pagination.first` / `pagination.last` | `首页` / `末页` | 首/末页按钮 aria-label |
| `pagination.prev` / `pagination.next` | `上一页` / `下一页` | 上/下一页按钮 aria-label |

覆译示例（装 autospark.i18n.js 后）：

```html
<script type="autospark/locales">
{
  "pagination.total": { "en": "Total {n} items" },
  "pagination.prev": { "en": "Previous" },
  "pagination.next": { "en": "Next" }
}
</script>
```

### 与 x-for.paging 配方

`.paging` 是引擎内置的数据层切片机制（loader / `:data-paging` 双向 / 项内 `$page`），本组件是页码 UI 控件——一条状态链打通：

```html
<div x-data="{ paging: { page: 1, pageSize: 5 } }">
  
  <ul x-for.paging="item of goods" :data-paging="paging" x-for-options="{pageSize:5}">
    <li x-text="item.name"></li>
  </ul>
  
  <div @change="paging.page = $event.detail.page">
    <!-- 保留值形态：pageSize 受控双向（paging.pageSize 双写）——动态 camelCase 键在元素名形态无 :绑定通道 -->
    <div x-component:autospark.pagination="{ total: 37, pageSize: paging.pageSize, page: paging.page }"></div>
  </div>
</div>
```

<demo html="components/navigation/pagination/paging.html"/>

服务端分页（loader）场景同理：`:data-paging` 绑定对象承担翻页状态，本组件 change 回写 `paging.page` 触发 loader。

### 事件

| 事件 | 形态 | 说明 |
| --- | --- | --- |
| change | 冒泡，`detail = { page, pageSize }` | 页码或条数变化（点击翻页/条数切换时派发；props 驱动变化不广播防回环） |
| input | 非冒泡 | x-model 回写通道（同 change 时机） |

### 主题化

字号档位：任意祖先容器挂 `data-size`（theme 手动通道，经 autospark.base 继承——按钮高度/间距随字号缩放）；暗色：容器裸挂 `data-dark`。使用者覆盖通道 `--asc-pagination-*`（如 `--asc-pagination-primary`、`--asc-pagination-hover-bg`、`--asc-pagination-border`）。

## 参考

### 属性

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| page | `number` | `1` | 受控当前页（1-based；越界钳位；el.value 桥） |
| pageSize | `number` | `10` | 每页条数 |
| total | `number` | `0` | 总条数（0 = 单页空态） |
| pageSizes | `Array<number>` | `[]` | 条数切换数组（状态引用注入；切换重置第 1 页） |
| simple | `boolean` | `false` | 极简形态（‹ 3 / 20 ›） |

### 事件

| 事件 | 参数 | 说明 |
| --- | --- | --- |
| change | `detail: { page, pageSize }` | 页码/条数变化冒泡（外层一行回写惯用法） |
| input | — | x-model 回写通道（非冒泡） |

### Slots

| 插槽 | 说明 |
| --- | --- |
| — | 无插槽（页码 UI 控件） |
