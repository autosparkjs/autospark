# 分页

`x-for.paging` 为列表提供分页能力：支持**客户端分页**（全量数据已在本地，自动 slice）和**服务端分页**（通过 loader action 远程加载数据追加到 items）。

## 快速入门

<demo html="for/paging-basic.html"/>

**客户端分页**：items 已有全量数据，directive 自动按页 slice。

```html
<ul x-for.paging="item of items" x-for-options="{pageSize:10}">
  <li>{{ item.name }}</li>
</ul>
```

<demo html="for/paging-server.html"/>

**服务端分页**：配置 `loader` action，远程加载数据追加到 items，翻页时只渲染当前页。

```html
<ul x-for.paging="item of items" x-for-options="{pageSize:10, loader:'loadUsers'}">
  <li>{{ item.name }}</li>
</ul>
```

```javascript
engine.actions.loadUsers = async ({ page, pageSize }) => {
  const res = await fetch(`/api/users?page=${page}&size=${pageSize}`);
  const json = await res.json();
  // 返回 { data: [...], page, pageSize, pageCount }
  return json;
};
```

## 指南

### 分页变量

分页模式下，项模板内自动注入以下变量：

| 变量         | 类型             | 说明                               |
| ------------ | ---------------- | ---------------------------------- |
| `$page`      | `number`         | 当前页码（1-based）                |
| `$pageSize`  | `number`         | 每页条数                           |
| `$pageCount` | `number`         | 总页数（0 = 未知，用于 load-more） |
| `$hasMore`   | `boolean`        | 是否还有下一页                     |
| `$loading`   | `boolean`        | loader 执行中                      |
| `$error`     | `string \| null` | 错误信息                           |
| `$total`     | `number`         | 总条数估算值（pageCount×pageSize，尾页不满时偏大；load-more 模式为 0） |

```html
<ul x-for.paging="item of items" :data-paging="paging" x-for-options="{pageSize:5}">
  <li>
    {{ item.name }}
    <span x-show="$loading">加载中...</span>
  </li>
</ul>
<p x-show="paging.hasMore">第 {{ paging.page }}/{{ paging.pageCount }} 页</p>
```

### 翻页操作

通过设置 `$page` 变量自动触发翻页（服务端模式调用 loader，客户端模式重新 slice）。`$page` 只在 `x-for.paging` 容器内部可用，容器外需通过 `:data-paging` 绑定外部对象控制：

```html
<div x-data="{ paging: { page: 1, pageSize: 10 } }">
  <ul x-for.paging="item of items" :data-paging="paging" x-for-options="{pageSize:10}">
    <li x-text="item.name"></li>
  </ul>
  <button @click="paging.page = Number(paging.page) - 1" :disabled="paging.page <= 1">
    上一页
  </button>
  <button @click="paging.page = Number(paging.page) + 1" :disabled="!paging.hasMore">下一页</button>
</div>
```

设置 `$pageSize` 会自动重置到第一页并重新加载。

### data-paging

<demo html="for/paging-data-binding.html"/>

通过 `:data-paging` 将分页状态双向绑定到一个对象，支持从外部读写分页状态：

```html
<div x-data="{ paging: { page: 1, pageSize: 10 } }">
  <ul
    x-for.paging="item of items"
    :data-paging="paging"
    x-for-options="{pageSize:10, loader:'loadData'}"
  >
    <li>{{ item.name }}</li>
  </ul>
  <button @click="paging.page = 2">跳到第2页</button>
</div>
```

绑定对象包含 7 个字段，按读写权限分为两组：

| 字段 | 读写 | 说明 |
| ---- | ---- | ---- |
| `page`、`pageSize` | **可写** | 外部修改触发翻页（page 越界自动钳位到末页；pageSize 变化重置回第 1 页并重新加载） |
| `pageCount`、`hasMore`、`loading`、`error`、`total` | **只读** | 由分页功能更新，外部修改不会应用到分页模块（静默忽略） |

引擎回写的值恒等于内部当前值，因此回写不会再次触发翻页（无循环更新）。`total` 为估算值（`pageCount × pageSize`），尾页不满时比真实条数偏大。

### scope.paging

<demo html="for/paging-scope.html"/>

不写 `:data-paging` 时，分页状态可通过容器 scope 上的 `scope.paging` **只读快照**在 JS / action 中读取：

```javascript
const scope = engine.findScopeByEl(document.querySelector("ul"));
scope.paging;
// { page, pageSize, pageCount, hasMore, loading, error, total }
```

- **只读冻结快照**：分页状态每次变化由引擎整体重建（`Object.freeze`），对快照写入会抛错
- **不进状态树**：不注入 `store.state`（含 `$scopes`），模板表达式不可见
- **有无 `:data-paging` 均存在**

分页状态的三条访问通道职责正交：

| 通道 | 位置 | 读写 | 适用场景 |
| ---- | ---- | ---- | -------- |
| `$page` 等 `$*` 变量 | 项模板内 | `$page` / `$pageSize` 可写，其余只读 | 模板内消费与控制 |
| `scope.paging` | 容器 scope（JS / action） | 只读 | JS 读取（调试、日志、程序化展示） |
| `:data-paging` | 外部状态对象 | `page` / `pageSize` 可写，7 字段被回写 | 跨作用域共享与外部控制 |

### 加载页面

服务端分页的 `loader` 是一个标准 action，签名如下：

```typescript
// 输入参数
{ page: number, pageSize: number }

// 返回值
{
    data: any[],       // 当前页数据
    page: number,      // 当前页码
    pageSize: number,  // 每页条数
    pageCount: number  // 总页数（0 = 未知，启用 load-more 模式）
}
```

loader 返回的数据基于**页偏移去重追加**到 items：已有位置做替换，超出部分做追加。pageSize 变化时自动对齐数据，不会重复加载。

### 加载状态（x-loading）

<demo html="for/paging-loading.html"/>

`:data-paging` 绑定对象的 `loading` 字段由引擎在每次加载时维护，配合 `x-loading` 声明式显示加载覆盖层——首载、翻页均自动生效：

```html
<div x-loading="{ value:'paging.loading', message:'正在加载订单…', delay:300 }">
  <ul x-for.paging="item of orders" :data-paging="paging"
      x-for-options="{pageSize:5, loader:'loadOrders'}">
    <li>{{ item.id }} - {{ item.book }}</li>
  </ul>
</div>
```

`delay:300` 让覆盖层延迟 300ms 出现，快速完成的请求不会闪烁。loader 抛错时 `paging.error` 同步更新，可配合 `x-show` 展示错误条与重试按钮。详见 [x-loading](./x-loading.md)。

### 加载更多

<demo html="for/paging-load-more.html"/>

服务端分页按总页数是否已知分流渲染：`pageCount > 0`（总页数已知）为**翻页渲染**——只显示当前页数据（数据仍全量累积在 items，翻回已加载页直接命中缓存切片）；`pageCount = 0`（总页数未知）为 **load-more 模式**——累积渲染全部已加载页。

当 `pageCount` 返回 `0` 时，表示总页数未知，启用 load-more 模式：

```html
<div x-data="{ paging: { page: 1, pageSize: 10 } }">
  <ul
    x-for.paging="item of items"
    :data-paging="paging"
    x-for-options="{pageSize:10, loader:'loadMore'}"
  >
    <li x-text="item.name"></li>
  </ul>
  <button x-show="paging.hasMore" @click="paging.page = Number(paging.page) + 1">加载更多</button>
  <p x-show="!paging.hasMore && !paging.loading">没有更多数据</p>
</div>
```

loader 返回空 `data` 数组时，`$hasMore` 自动变为 `false`。

### autoLoad

<demo html="for/paging-auto-load.html"/>

默认首次编译时自动调用 loader 加载第一页。通过 `autoLoad:false` 关闭：

```html
<ul x-for.paging="item of items" :data-paging="paging" x-for-options="{pageSize:10, loader:'loadData', autoLoad:false}">
  <li x-text="item.name"></li>
</ul>
<button @click="paging.page = 1">首次加载</button>
```

关闭后需手动触发首次加载：向 `:data-paging` 绑定对象写入 `page`。**初值请省略 `page` 字段**——未完成首次加载前引擎不回写 `page`，首次写入 `page=1` 才是值变化、能触发加载；若初值预设 `page:1`，同值写入不产生变更信号，无法触发。

## 配置

| 配置项     | 默认值 | 说明                                         |
| ---------- | ------ | -------------------------------------------- |
| `pageSize` | `10`   | 每页条数                                     |
| `loader`   | 无     | 服务端分页的 loader action 名（标准 action） |
| `autoLoad` | `true` | 首次是否自动加载第一页                       |

## 注意事项

- `total` 为估算值（`pageCount × pageSize`），尾页不满时比真实条数偏大；需要精确总数请在业务侧维护。
- 响应式数组不发射 `length` 路径信号：插值 `items.length` 不会随 `push` / 索引赋值更新，精确计数请在 action 中维护独立状态字段。
- 外部修改 `:data-paging` 的只读字段（`pageCount` / `hasMore` / `loading` / `error` / `total`）会被静默忽略。
- `scope.paging` 为冻结快照，写入会抛错；翻页控制请走 `$page`（项模板内）或 `:data-paging`（外部）。

### 互斥

- `.paging` 与 `.virtual` 互斥。同时声明时 `.paging` 优先，`.virtual` 被忽略并输出警告。
