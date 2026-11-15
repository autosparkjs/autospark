# Table 数据表格

## 概述

Table 是 AutoSpark 的官方数据表格组件（组件库 P2 最重件 / display 分类，ADR-0018 清单权威表 display 行「table 含 virtual 模式」；接线决策见 ADR-0023）：`columns` 列定义 + `rows` 数据数组（均状态引用注入）经行 × 列双 x-for 装配 + `col-<key>` 作用域插槽自定义单元格 + `sortable` 列三态排序（升 / 降 / 取消）+ `selectable` 行选择（checkbox 列组合消费 `autospark.checkbox`，全选 / 半选）+ `loading` 覆盖层（引擎 x-loading 组合）+ 空态兜底（复用 `autospark.empty` 组合，`empty` 插槽可整体重载）+ `bordered` / `striped`（斑马纹）外观 + `virtual` 长表虚拟滚动（features/virtual 组合，表头恒渲染不虚拟化）。

**与 x-for / list 的边界**：x-for 是引擎渲染指令（全权自定义）；list 是单列数据的列表容器（空态 / 加载态 / 虚拟滚动的开箱行容器）；table 是**列结构化**数据的表格容器——表头、列对齐、列宽、排序、行选择、斑马纹这些列结构语义 list 不承载（ADR-0018 决策 2「内部装配、对外开箱」）。无结构的行列表用 list，列化数据表格用 table。

引入方式：引擎之后加载 `<script src="/autospark/autospark.table.js"></script>`（自举注册），或聚合产物 `autospark.plugins.js`。

**跨插件依赖**（按需加载须同页引入；聚合产物无此问题）：`autospark.empty.js`（空态兜底组合）；`selectable: true` 时另需 `autospark.checkbox.js`（行选择 checkbox 列）；`virtual: true` 时另需 `autospark.virtual.js`（缺位时 warn 退化全量渲染，降级不失效）。

## 快速入门

```html
<script src="autospark.js"></script>
<script src="autospark.empty.js"></script>
<script src="autospark.table.js"></script>

<x-table :columns="cols" :rows="users"></x-table>
```

```js
// columns/rows 须状态引用注入——字面量数组触发 props 更新死环（引擎已知缺陷规避）
new AutoSpark(el, {
    cols: [
        { key: "name", title: "名称", sortable: true },
        { key: "age", title: "年龄", align: "right" },
    ],
    users: [{ id: 1, name: "张三", age: 30 }],
});
```

<demo html="components/display/table/basic.html"/>

## 指南

### 列定义（columns）

**类型**: `Array<{ key, title?, width?, align?, sortable? }>`
**默认**: `[]`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| key | `string` | 列键（单元格取值字段 + 自定义插槽名后缀 + 排序键），必填 |
| title | `string` | 表头文案（缺省回退 key 直出） |
| width | `number \| string` | 列宽（数字 → px；字符串原样，如 `"20%"`） |
| align | `"left" \| "center" \| "right"` | 对齐（表头与数据单元格同名通道） |
| sortable | `boolean` | 可排序（表头可点击，缺省 false） |

`columns` 须状态**引用**注入；变更走整体替换（原地 push 不发信号——引擎跨域边界），表头与数据单元格随之重建。

### 数据源（rows）

**类型**: `Array`
**默认**: `[]`

数据数组，状态引用注入。默认单元格按 `row[column.key]` 直出：`null`/`undefined` 收敛空串、标量直出、对象 JSON 序列化兜底；对象字段建议用 `col-<key>` 插槽自定义。变更走整体替换驱动重渲。

### 自定义单元格（col-\<key\> 插槽，作用域插槽）

插槽名 = `col-<列 key>`（动态名出口，运行期按列匹配）；形参解构消费（内容在调用方作用域求值——可读调用方状态、可挂行内事件）：

```html
<x-table :columns="cols" :rows="users">
  <template x-slot:col-name="{ row, rowIndex }">
    <b x-text="row.name"></b>
    <span @click="picked = row.id">选TA</span>
  </template>
</x-table>
```

事件出口经**单元格原生冒泡**：`@click` 等直接写在插槽内容上（调用方作用域求值）。

<demo html="components/display/table/basic.html"/>

### 排序（sortable / remoteSort）

**sortable（列字段）**: `boolean`，缺省 `false`
**remoteSort**: `boolean`，缺省 `false`

点击 sortable 列表头触发三态轮转：无 → 升 → 降 → 无。本地排序按列值数值差分 / 字符串 `localeCompare`（`null` 视空；数字字符串不隐式数值化）。`remoteSort: true` 时点击只发 `sort-change` 事件、本地不重排（远端排序交调用方取数回填 rows）。

### 行选择（selectable / rowKey / selection）

**selectable**: `boolean`，缺省 `false`
**rowKey**: `string`，缺省 `"id"`
**selection**: `Array`，缺省 `[]`（状态引用注入）

`selectable: true` 渲染前置 checkbox 列（组合消费 `autospark.checkbox`，**须同页引入其产物**）：行勾选、表头全选 / 半选。选中集以 `rowKey` 字段值定位（字段缺失回退行索引——排序后选中集跟随位置而非数据，建议行数据恒含 rowKey 字段）；`selection` props 为受控单向内同步（外部整体替换生效，行内交互不回写）；变更经 `selection-change` 事件外发。

<demo html="components/display/table/selection.html"/>

### 加载态（loading）与空态（empty 插槽）

**loading**: `boolean`，缺省 `false`

`true` 时表格覆盖加载层（引擎 x-loading 组合，铺满表格容器）。

`rows` 为空数组时渲染空态段：默认组合 `autospark.empty` 组件（描述文案走其 i18n 通道，缺省「暂无数据」）；`empty` 插槽可整体重载：

```html
<x-table :columns="cols" :rows="users">
  <template x-slot:empty><div>一条数据都没有</div></template>
</x-table>
```

### 外观（bordered / striped）与主题档位

**bordered**: `boolean`，缺省 `true`；**striped**: `boolean`，缺省 `false`

`bordered: false` 边框转透明色（占位稳定不跳变）；`striped: true` 偶数行浅底斑马纹 + 行悬停语义色。尺寸 / 圆角 / 明暗等档位经宿主 `data-size` / `data-dark` 等主题通道全跟随（继承 `autospark.base`）。

### 虚拟滚动（virtual）

**类型**: `boolean`
**默认**: `false`

`true` 启用长表虚拟滚动（x-for.virtual 组合 features/virtual 策略）：只渲染可见窗口 + overscan 缓冲，万级数据不卡。**须同页引入 `autospark.virtual.js`**——缺位时 warn 退化全量渲染（降级不失效）。滚动容器定高（`--asc-table-virtual-height` 缺省 20em 可覆盖）；**行定高 40px**（虚拟化等高约束，与字号档位解耦——覆盖须同改 CSS 与 itemHeight 两处）；表头恒渲染不虚拟化（滚动容器外置）。列宽在虚拟分叉经 CSS grid 列模板承载（`width` 数字 / 字符串两形态照常生效；缺省 `minmax(6em, 1fr)` 均分）。

<demo html="components/display/table/virtual.html"/>

### 主题化

底色 / 边框走 `--auto-bgcolor` / `--auto-border-color`、表头面板色 `--auto-panel-header-bgcolor`、单元格文本 `--auto-color`、悬停 `--auto-hover-bgcolor`、斑马纹 `--auto-secondary-bgcolor`、选中行高亮 `--asc-tone` 中转（`--auto-primary-color`）color-mix 派生（三级回退链，ADR-0129）；单元格内距经 `--asc-pad` 中转（`--auto-padding`，随 `data-spacing` 档位）calc 派生（card 同款）；字号随 `data-size` 主题通道（不设自有字号）；暗色：容器裸挂 `data-dark`。使用者覆盖通道 `--asc-table-*`（如 `--asc-table-bg` 底色、`--asc-table-radius` 圆角、`--asc-table-padding` 内距基准、`--asc-table-virtual-height` 虚拟容器高度、`--asc-table-stripe-bg` 斑马纹底色）。

## 参考

### 属性

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| columns | `Array` | `[]` | 列定义（状态引用注入；变更整体替换驱动） |
| rows | `Array` | `[]` | 数据数组（状态引用注入；变更整体替换驱动） |
| rowKey | `string` | `"id"` | 行键字段名（选择集定位；缺失回退行索引） |
| selectable | `boolean` | `false` | 行选择开关（须同页引入 autospark.checkbox.js） |
| selection | `Array` | `[]` | 受控选中集（行键数组，单向内同步） |
| remoteSort | `boolean` | `false` | 远端排序（true 只发事件不本地重排） |
| loading | `boolean` | `false` | 加载覆盖层（引擎 x-loading 组合） |
| bordered | `boolean` | `true` | 外框开关（false 转透明色） |
| striped | `boolean` | `false` | 斑马纹（偶数行浅底） |
| virtual | `boolean` | `false` | 虚拟滚动（须同页引入 autospark.virtual.js；行定高 40px） |

### 事件

| 事件 | detail | 说明 |
| --- | --- | --- |
| sort-change | `{ key, order }` | 排序变化（order 为 `asc` / `desc` / `""`；取消时 key 为空串）。冒泡，监听挂内层包裹元素 |
| selection-change | `{ keys }` | 选中集变化（行键数组标量投影）。冒泡，监听挂内层包裹元素 |

### Slots

| 插槽 | 形参 | 说明 |
| --- | --- | --- |
| col-\<key\> | `{ row, column, rowIndex, colIndex }` | 列单元格模板（按列 key 命名；缺省时默认单元格直出） |
| empty | — | 空态整体重载（缺省组合 autospark.empty） |
