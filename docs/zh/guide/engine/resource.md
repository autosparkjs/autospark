# 资源

## 概述

资源（resource）是**服务端数据的命名操作集**：把一个 REST 端点声明为模板内可调用的资源对象，默认映射规则自动展开 `get` / `getMany` / `add` / `update` / `delete` 五个方法，注册为**平铺点号名 action**（`order.get` 等），事件表达式 `@click="order.get(1)"` 直接调用。三个核心特性：

- **纯 RPC 语义**——方法只发请求返回 Promise（resolve = 解包后数据，reject = `ResourceError`），不写状态、无本地缓存；结果写入 state 由调用方组合；
- **action 家族成员**——资源方法经 action 体系包装，`pending` / `resolved` / `rejected` 三通道信号与 `.feedback` 反馈联动开箱即得（见[动作](./action.md)）；
- **声明即路由**——标准 REST 由默认映射覆盖，非标协议按方法覆写（见[映射规则定制](#映射规则定制)）。

::: tip 插件机制
资源由官方插件包 `@autospark/plugins` 的 resource 插件提供（engine 侧配套 ADR-0131 点号名 action / ADR-0132 script type 派发），使用前须加载插件脚本且**先于 engine 实例化**：

```html
<script src="/autospark/autospark.js"></script>
<script src="/autospark/autospark.resource.js"></script>
```
:::

## 快速入门

一行声明 + 一个按钮：`x-resource:order="/api/orders"` 注册资源 `order`，按钮直接调用资源方法（本页无真实后端——`options.resources.fetch` 注入 mock，右下日志即每次请求的映射形态）。

<demo html="resource/index.html"/>

```html
<div x-resource:order="/api/orders">
  <!-- 顶层直调：fire-and-forget，信号与反馈联动照常 -->
  <button @click.feedback="order.get(1)">取单个</button>
</div>
```

要拿到结果写入状态，用 action 组合（资源不碰状态，组合归调用方）：

```html
<script type="autospark/actions">
  {
    async load() {
      // 资源方法经 action 链取到，await 后自行写入 state
      const list = await this.scope.getAction("order.getMany").handle.call(this, { page: 1 });
      this.engine.state.orders = list.items;
    },
  }
</script>
```

## 指南

### 定义资源

三个注册位，按可见范围从内到外（同名**逐名**就近覆盖，见[资源域与就近覆盖](#资源域与就近覆盖)）：

| 注册位 | 声明方式 | 可见范围 |
| --- | --- | --- |
| scope 级 | `x-resource:order="/api/orders"`（纯 REST）或局部 `<script type="autospark/resources">` | 宿主 / 最近祖先 scope 的整个子树 |
| engine 级 | `<script type="autospark/resources" global>` 或 `engine.resources.add(name, def)` | 本 engine 任意 scope |
| 应用级 | `AutoSpark.resources.add(name, def)` | 跨 engine 全局（唯一动态入口，同名覆盖 + 警告） |

`<script type="autospark/resources">`（内容为对象字面量，`new Function` 求值——手写方法支持箭头函数与闭包）承载三种资源定义形态：

```html
<!-- 形态一：纯方法集（完全自定义，this 为 action 上下文，this.engine 可用） -->
<script type="autospark/resources">
  {
    order: {
      async get(id) { return (await fetch('/api/orders/' + id)).json() },
    },
  }
</script>

<!-- 形态二：url 字符串（等价 x-resource，默认映射生成五方法） -->
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

方法解析优先级：**手写函数键 > 合并映射表命中**（「后端只差一个方法协议」时不必放弃整个默认映射）。

<demo html="resource/index.html"/>

### 资源域与就近覆盖

资源沿 **scope 链逐名就近**：内层声明只遮蔽它定义的那几个**点号名**（`user.get`），未声明的名字（`user.getMany`）继续沿链向外解析——**不是整资源覆盖**。查找链与组件 / action 同构：`scope.actions` 沿 parent 链 → `engine.actions` → 类静态 `AutoSpark.resources` 全局表兜底。

<demo html="resource/lookup.html"/>

三级同名共存的裁决效果：

| 层 | 声明 | 内层子树调 `user.get` | 内层子树调 `user.getMany` |
| --- | --- | --- | --- |
| 应用级 | `AutoSpark.resources.add("user", …)` | （被外层遮蔽） | （被外层遮蔽） |
| engine 级 | `<script type="autospark/resources" global>` | 被 scope 层遮蔽 | **命中本层** |
| scope 级 | 局部 `<script type="autospark/resources">` | **命中本层** | 未声明，向外穿透 |

### REST 默认映射

默认映射要求服务端满足标准 REST 语义（`url` 为集合地址）：

| 方法 | HTTP 请求 |
| --- | --- |
| `order.get(id)` | `GET {url}/{id}` |
| `order.get(options)` | `GET {url}?{条件序列化}`——**条件形态**（对象实参即[通用条件选项](#通用条件选项)） |
| `order.getMany(options?)` | `GET {url}?{条件序列化}`——通用条件选项（`where` / `order` / 分页） |
| `order.add(data \| [data...])` | `POST {url}`，body 原样（数组一次发） |
| `order.update({id, ...})` | `PUT {url}/{id}`，body 原样 |
| `order.update([{...}, {...}, ...])` | `PUT {url}`，数组体一次发（批量更新） |
| `order.update(data, options)` | `PUT {url}?{条件序列化}`，body 原样——**条件更新**（显式 `options` 优先于 id 路由；PATCH 语义按方法覆写自定） |
| `order.delete(id)` | `DELETE {url}/{id}` |
| `order.delete([id1, id2, ...])` | `DELETE {url}?ids=id1,id2,...` |
| `order.delete(options)` | `DELETE {url}?{条件序列化}`——**条件删除**（`{where:{ids:[1,2]}}` 自然得 `?ids=1,2`） |

#### 通用条件选项

条件形态方法的 `options` 共用**同一套通用机制** `{ where, order, page, pageSize, …任意透传键 }`——一处学会，四处可用：

```js
order.getMany({ where: { status: "open" }, order: "id desc", page: 1, pageSize: 10 });
// → GET /api/orders?status=open&order=id desc&page=1&pageSize=10

order.getMany({ where: "amount>99" });   // 字符串形态：后端方言直传
// → GET /api/orders?where=amount>99

order.update({ status: "closed" }, { where: { tenant: "a" } });  // 条件更新
order.delete({ where: { status: "draft" } });                     // 条件删除
```

- `where` **双形态**：对象逐键展开进 query；字符串作为单一 `where` 参数直传（后端方言解释）；
- `order` 排序描述直传；`page` / `pageSize` 分页字段仅传入时出现（对齐响应壳约定）；
- 其余任意键原样透传 query（数组值逗号连接，如 `tags=a,b`）。

<demo html="resource/index.html"/>

- 序列化细节：简单值 `key=value`、`undefined` / `null` 跳过（数组逗号连接见上）；
- 分页响应壳约定 `{items, total, pageSize, pageCount, page}`（分页字段仅启用分页时出现）；后端壳不同用 [`unwrap` 钩子](#请求选项与三层回退)适配。

### 映射规则定制

默认映射表可按方法**覆盖合并**（浅合并——只改差的那条，其余沿用默认；无整表替换）。规则条目为函数 `(url, ...args) => RequestDesc`（`{ method, url, query?, body? }` 四字段封顶，不发明声明式 DSL）：

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

合并链（逐层浅合并）：**默认 REST 表 → `AutoSpark.resources.options.mapping`（全局）→ `options.resources.mapping`（engine 级）→ 资源定义内联 `mapping`**。

<demo html="resource/mapping.html"/>

### 请求选项与三层回退

四个请求选项按**就近三层**解析（缺失才回退）：**资源定义内联 > `options.resources`（engine 级）> `AutoSpark.resources.options`（全局默认）**。

| 选项 | 默认值 | 说明 |
| --- | --- | --- |
| `baseUrl` | — | 拼接在规则产出的相对 url 前（规则 url 以 `http(s)://` 开头时跳过） |
| `fetch` | `globalThis.fetch` | 自定义 fetch——测试 mock / 拦截器 / token 注入的统一入口 |
| `headers` | — | 默认请求头（`Record<string, string>`，逐请求合并；带 body 时自动补 `Content-Type: application/json`） |
| `unwrap` | 恒等 | 响应解包钩子 `(data, desc) => any`——适配 `{code, data, message}` 类包裹壳 |

<demo html="resource/mapping.html"/>

### 信号与反馈联动

资源方法即 action：每次调用自动广播 `actions/{id}/pending|resolved|rejected`（`id` 为完整点号名，如 `actions/order.get/resolved`）——全局 loading、执行反馈、日志观测都可声明式接上，无需资源侧任何代码。

<demo html="resource/signals.html"/>

- **总线信号须 engine 级及以上注册**：scope 级资源（`x-resource` / 局部 script）的方法只 **DOM 冒泡**（`action:order.get` 事件），不进全局总线——要经 `engine.on` 订阅信号，资源须声明在 engine 级（script `global`）或应用级；`@click.feedback` 走返回值捕获，不受此限；
- `@click.feedback` 裸修饰符默认为**类名模式**（pending / resolved / rejected 三态类名），不设加载遮罩；要遮罩须显式 `x-on-options="{feedback:{loading:true}}"`；
- rejected 的 payload 形态为 `{ id, action, error }`（`error` 即 `ResourceError`）。

### 错误处理

资源调用失败统一 reject **`ResourceError`**（标量字段 `status` / `url` / `method`，随信号 `error` 通道携带）：

| 场景 | 行为 |
| --- | --- |
| 非 2xx 响应 | reject（`status` = HTTP 状态码） |
| 网络错误 / 中断 | reject（`status: 0`） |
| 204 / 空响应体 | resolve `null` |
| 响应壳不符 | `unwrap` 返回什么就是什么（钩子内自行抛错则按 rejected 处理） |

错误呈现交给调用方组合：`.feedback` 的 rejected 类名、信号订阅、或 action 内 `try/catch` 后写入 `$error` 类状态。

### 与动作的关系

资源不是独立体系，是 action 的**声明式生产器**：定义展开为平铺点号名 action（ADR-0131），注册进现有 action 容器（`scope.actions` / `engine.actions` / 全局 action 表），生命周期广播、`this` 上下文、`getAction` 链全部继承。调用边界：

- **事件表达式顶层可达**：`@click="order.get(1)"`、`@click="order.delete([1,2])"`；
- **子表达式内不可达**：`x-text="order.get(1).title"` 无效——资源不在表达式求值上下文中，取结果须在 action 内 `await` 后写入 state；
- action 内互调：scope 级资源经 `this.scope.getAction("order.get")` 沿链取，engine 级 / 应用级经 `this.engine.actions["order.get"]` 直达。

## 注意事项

- **加载顺序契约**：插件脚本须先于 engine 实例化加载（`x-resource` 属性与 `autospark/resources` script 均在编译期消费）；
- **资源不进 state**：资源是 action 不是状态——状态库会把 state 中的函数当 computed 处理（读属性即执行），资源对象挂 state 必然错位；资源只住 action 容器；
- **纯 RPC 无缓存**：每次调用都是真实请求；列表刷新、乐观更新等策略由调用方在 action 层组合；
- **指令与 script 的分工**：`x-resource` 只承载纯 REST 形态，手写方法集 / 混搭覆写 / engine 级与全局注册走 `<script type="autospark/resources">` 与编程入口——指令侧语法细节见 [x-resource](../directives/x-resource.md)。
