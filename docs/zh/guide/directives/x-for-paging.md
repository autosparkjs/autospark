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

**服务端分页**：配置 `loader` action，远程加载数据追加到 items。

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
| `$total`     | `number`         | 总条数（0 = 未知）                 |

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

绑定对象包含：`page`、`pageSize`、`pageCount`、`hasMore`、`loading`、`error`、`total`。

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

### 加载更多

<demo html="for/paging-load-more.html"/>

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
<ul x-for.paging="item of items" x-for-options="{pageSize:10, loader:'loadData', autoLoad:false}">
  <li x-text="item.name"></li>
</ul>
```

关闭后需手动触发首次加载。

## 配置

| 配置项     | 默认值 | 说明                                         |
| ---------- | ------ | -------------------------------------------- |
| `pageSize` | `10`   | 每页条数                                     |
| `loader`   | 无     | 服务端分页的 loader action 名（标准 action） |
| `autoLoad` | `true` | 首次是否自动加载第一页                       |

## 注意事项

## 互斥

- `.paging` 与 `.virtual` 互斥。同时声明时 `.paging` 优先，`.virtual` 被忽略并输出警告。
