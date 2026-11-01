# x-resource 资源注册

## 概述

`x-resource` 把一个标准 REST 资源**声明为模板内可调用的资源对象**：属性参数为资源名、指令值为资源集合地址，默认映射规则自动生成 `get` / `getMany` / `add` / `update` / `delete` 五个方法，注册为**平铺点号名 action**（如 `x-resource:order` 生成 `order.get` 等），供事件表达式 `@click="order.get(1)"` 调用。纯 RPC 语义：方法返回 Promise，不写状态——结果由调用方组合。

```html
<div x-resource:order="/api/orders">
  <button @click="order.get(1)">取单个</button>
</div>
```

::: tip 插件指令
`x-resource` 由官方插件包 `@autospark/plugins` 的 resource 插件提供（engine 侧配套 ADR-0131 点号名 action / ADR-0132 script type 派发），使用前须加载插件脚本，且**先于 engine 实例化**：

```html
<script src="/autospark/autospark.js"></script>
<script src="/autospark/autospark.resource.js"></script>
```

资源声明的完整形态（手写方法集 / 混搭覆写 / engine 级与全局注册）见 [script 资源声明](#script-资源声明)与[注意事项](#注意事项)。
:::

## 快速入门

<demo html="resource/index.html"/>

```html
<div x-resource:order="/api/orders">
  <button @click.feedback="loadList">获取列表</button>
</div>
```

## 指南

### 指令值

指令值为 REST 资源集合地址（**字面量字符串**），配合属性参数（资源名）使用：

| 形态 | 语义 |
| --- | --- |
| `x-resource:order="/api/orders"` | 注册资源 `order`，五方法走默认映射 |
| `x-resource:order`（缺值） | 警告并忽略本声明 |
| `x-resource="/api/orders"`（缺参数） | 警告并忽略本声明 |

`x-resource` 只承载**纯 REST 形态**——手写方法集与混搭覆写走 [`<script type="autospark/resources">`](#script-资源声明)。

### REST 默认映射

默认映射规则要求服务端满足标准 REST 语义（`url` 为集合地址）：

| 方法 | HTTP 请求 |
| --- | --- |
| `order.get(id)` | `GET {url}/{id}` |
| `order.get(options)` | `GET {url}?{条件序列化}`——**条件形态**（对象实参即[通用条件选项](#通用条件选项)，返回单条还是集合由后端解释） |
| `order.getMany(options?)` | `GET {url}?{条件序列化}`——通用条件选项（`where` / `order` / 分页） |
| `order.add(data \| [data...])` | `POST {url}`，body 原样（数组一次发） |
| `order.update({id, ...})` | `PUT {url}/{id}`，body 原样 |
| `order.update([{...}, {...}, ...])` | `PUT {url}`，数组体一次发（批量更新） |
| `order.update(data, options)` | `PUT {url}?{条件序列化}`，body 原样——**条件更新**（显式 `options` 优先于 id 路由；PATCH 语义按方法覆写自定） |
| `order.delete(id)` | `DELETE {url}/{id}` |
| `order.delete([id1, id2, ...])` | `DELETE {url}?ids=id1,id2,...` |
| `order.delete(options)` | `DELETE {url}?{条件序列化}`——**条件删除**（`{where:{ids:[1,2]}}` 经序列化约定自然得 `?ids=1,2`） |

<demo html="resource/index.html"/>

#### 通用条件选项

`options`（get / getMany / update / delete 的条件形态）共用同一机制 `{ where, order, page, pageSize, …任意透传键 }`：

- `where`：过滤条件，**双形态**——对象逐键展开进 query（`{where:{status:"open"}}` → `?status=open`）；字符串作为单一 `where` 参数直传（后端方言解释，如 `{where:"amount>99"}` → `?where=amount>99`）；
- `order`：排序描述直传（`{order:"id desc"}` → `?order=id desc`）；
- `page` / `pageSize`：分页字段（仅传入时出现，对齐 `{items,total,…}` 响应壳约定）；
- 其余任意键原样透传 query（数组值逗号连接，如 `tags=a,b`；`undefined` / `null` 跳过）。
- 分页响应壳约定 `{items, total, pageSize, pageCount, page}`（分页字段仅启用分页时出现），后端壳不同时用 [`unwrap` 钩子](#请求选项与三层回退)适配；
- 资源方法调用即 action：`@click.feedback` / `.pending` 修饰符开箱联动（返回值捕获，不受注册层级限制）；**总线信号** `actions/order.get/pending|resolved|rejected` 须资源注册在 engine 级（script `global`）及以上——`x-resource` 声明的是 scope 级，方法只 DOM 冒泡（`action:order.get` 事件）。

### script 资源声明

`<script type="autospark/resources">`（内容为对象字面量，`new Function` 求值——手写方法支持箭头函数与闭包）承载 `x-resource` 放不下的三种形态：

```html
<!-- 形态一：纯方法集（完全自定义，this 为 action 上下文） -->
<script type="autospark/resources">
{
  order: {
    async get(id) { return (await fetch('/api/orders/' + id)).json() },
  },
}
</script>

<!-- 形态二：url 字符串（等价 x-resource，默认映射生成） -->
<script type="autospark/resources">{ order: "/api/orders" }</script>

<!-- 形态三：混搭——url 打底 + 手写覆写个别方法 + 内联请求选项 -->
<script type="autospark/resources">
{
  order: {
    url: "/api/orders",
    async getMany(options) { /* 仅此方法走自定义，其余沿用映射 */ },
  },
}
</script>
```

注入位置由 `global` 属性分流：默认挂**最近祖先 scope**（沿链就近覆盖同名资源）；`<script type="autospark/resources" global>` 挂 **engine 级**（本 engine 任意 scope 可见）。跨 engine 的全局资源经 `AutoSpark.resources.add(name, def)` 动态注册（详见[注意事项](#注意事项)）。

<demo html="resource/index.html"/>

### 映射规则定制

默认映射表可按方法**覆盖合并**（浅合并——只改差的那条，其余沿用默认；无整表替换）。合并链：默认表 → `options.resources.mapping` → 资源定义内联 `mapping`。规则条目为函数 `(url, ...args) => RequestDesc`（`{ method, url, query?, body? }` 四字段封顶）：

```ts
new AutoSpark(el, state, {
  resources: {
    baseUrl: "/api",
    mapping: {
      // 后端分页协议不同：只换 getMany，get/add/delete 仍走默认
      getMany: (url, options = {}) => ({
        method: "GET", url, query: { p: options.page, s: options.pageSize },
      }),
    },
  },
});
```

### 请求选项与三层回退

`baseUrl` / `fetch` / `headers` / `unwrap` 四个请求选项按**就近三层**解析（缺失才回退）：**资源定义内联 > `options.resources`（engine 级）> `AutoSpark.resources.options`（全局默认）**。

<demo html="resource/index.html"/>

- `baseUrl`：拼接在规则产出的相对 url 前（规则 url 以 `http(s)://` 开头时跳过）；
- `fetch`：自定义 fetch——测试 mock / 拦截器 / token 注入的统一入口；
- `headers`：默认请求头（逐请求合并；带 body 时自动补 `Content-Type: application/json`）;
- `unwrap`：响应解包钩子 `(data, desc) => any`（默认恒等）——适配 `{code, data, message}` 类包裹壳。

## 配置选项

`x-resource` 无指令选项与修饰符——资源配置统一走 `AutoSparkOptions.resources`（engine 级配置层，五项）：

| 配置项 | 默认值 | 修饰符 | 说明 |
| --- | --- | --- | --- |
| `baseUrl` | — | — | 资源 url 前缀（string；三层回退的内联 > 本表 > 全局默认） |
| `fetch` | `globalThis.fetch` | — | 自定义 fetch（测试 / 拦截器） |
| `headers` | — | — | 默认请求头（`Record<string, string>`，逐请求合并） |
| `unwrap` | 恒等 | — | 响应解包钩子（`(data, desc) => any`） |
| `mapping` | 默认 REST 表 | — | 按方法覆盖默认映射（浅合并，无整表替换） |

::: info 关于指令配置体系
指令选项 / 修饰符 / 宿主选项 / 两层回退见[指令配置](../directive/config.md)。
:::

## 注意事项

- **加载顺序契约**：插件脚本须先于 engine 实例化加载（`x-resource` 属性与 `autospark/resources` script 均在编译期消费；晚加载的存量声明已被剥除）。
- **纯 RPC 语义**：资源方法只发请求返回 Promise（resolve = 解包后数据；reject = `ResourceError`，含 `status` / `url` / `method` 标量），**不写状态、无本地缓存**——把结果写入 state 由调用方组合（如经 `<script type="autospark/actions">` 的 action 内 `await` 后赋值）。
- **调用边界**：点号名 action 只在**事件表达式顶层**可达（`@click="order.get(1)"`）；作为子表达式内嵌（如 `x-text="order.get(1).title"`）不可达——资源不在表达式求值上下文中。
- **三级注册位**：scope 级（`x-resource` / 局部 script，就近覆盖）→ engine 级（`global` script / `engine.resources.add`）→ 应用级（`AutoSpark.resources.add(name, def)`——跨 engine 全局唯一动态入口，同名覆盖 + 警告）。
- **响应壳约定**：默认裸 JSON + `{items, total, ...}` 分页壳；非 2xx 一律视为失败（reject `ResourceError`）；204 / 空响应体 resolve `null`。
- **网络与分页细节**：网络错误 reject（`status: 0`）；分页字段仅传入时出现在 query 中（对齐响应壳约定）。
