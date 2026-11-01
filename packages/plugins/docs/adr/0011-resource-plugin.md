# ADR-0011: resource 插件——服务端资源的抽象操作层

- 状态：已接受（Accepted，2026-11-01）
- 日期：2026-11-01
- 关联：engine ADR-0131（点号名 action——资源方法的调用通道）、ADR-0132（script type 通用派发——`autospark/resources` 的编译期入口）；ADR-0111（插件机制——类静态命名空间 / pluginActions 惰性物化）、ADR-0114（预加载队列）、ADR-0003（包身份与插件形态）、ADR-0009（形态四区）、ADR-0012（局部 action 只 DOM 冒泡）、ADR-0036（ActionDesc 规范化）

## 背景

需要把「对服务端资源的操作」（REST CRUD 与自定义 RPC）以声明形态暴露给模板：按钮点击即调 `order.add(args)`，且自动获得 action 生命周期广播（loading 联动 / 错误呈现）。经 grilling 三轮 21 问收敛设计共识（纯 RPC / 复用 action 包装 / REST 默认映射细则 / 双层 ResourceManager / mapping 覆盖合并 / 三层选项回退等），本 ADR 固化终态。

## 决策

### 决策 1：资源方法 = 平铺点号名 action（纯 RPC 语义）

资源 `order` 展开为 `order.get` / `order.getMany` / `order.add` / `order.delete`…（平铺点号名）注册进**现有 action 容器**（零新容器）——经 engine 的 `_normalize` + `buildAction` 包装后即标准 action，`actions/<id>/pending|resolved|rejected` 信号、DOM 冒泡、`@click.feedback` 返回值捕获三通道全部继承（engine ADR-0131 提供点号调用通道）。

**纯 RPC**：方法返回 Promise（resolve = 解包后数据；reject = `ResourceError`，含 `status`/`url`/`method` 标量），**不写状态、无本地缓存**——AutoSpark 已有完整响应式状态层，资源层再建缓存即重复状态管理；结果写入 state 由调用方组合。

### 决策 2：三条注册路径 × 三级作用域（就近覆盖）

| 层级 | 容器 | 声明/注册入口 |
| --- | --- | --- |
| scope 级 | `scope.actions`（沿链就近覆盖） | `<script type="autospark/resources">`（默认）/ `x-resource:名="url"` 指令 |
| engine 级 | `engine.actions` | `<script ... global>` / `engine.resources.add()` |
| 应用级（跨 engine） | 类静态 `AutoSpark.actions` 插件全局表（惰性物化，ADR-0111） | `AutoSpark.resources.add(name, def)`（唯一动态入口） |

**共识修订（实施前定稿）**：`options.resources.globals` 移除——options 收窄为纯配置层，全局资源只经 `AutoSpark.resources.add` / script `global` 属性（消除双入口同职能冗余）。

`AutoSpark.resources`（类静态单例，`AutoSparkResourceManager`）= 全局资源定义表 + 全局默认选项 + `add`（同名覆盖 + warn）；`engine.resources`（ready 挂载）= engine 级视图（add 进本 engine / options 即 `options.resources` 编程面）。一个类双用途（有无 engine 构造）。

### 决策 3：`x-resource` 指令 = 纯 REST 声明位（Compile 剪枝）

spec 重载注册（Compile 通道缺省）：`created` 编译期把 url 经映射管线展开挂宿主 `scope.actions`（`engine.actionsManager.registerScoped`——ADR-0132 决策 4 的公共收编方法），指令属性随编译剪枝（x-define 同款声明性名位）。只承载 url 字符串形态；手写/混搭走 script。

### 决策 4：资源定义三形态（script 载体）

`{ name: def }` 对象字面量（`new Function` 求值，同 actions script 先例）：**url 字符串**（纯 REST）/ **方法集**（完全自定义，`this` = action 上下文）/ **混搭**（`{url, mapping?, 方法覆写, 请求选项内联}`——手写方法优先于映射生成；适配「后端只差一个方法协议」的场景）。覆盖按**点号名逐名就近**（内层未声明的方法沿链命中外层，非整资源覆盖）。

### 决策 5：映射规则函数化 + 按方法覆盖合并

规则 = `(url, ...args) => RequestDesc`（`{method, url, query?, body?}` 四字段封顶），不发明声明式 DSL。默认 REST 表（get → `GET {url}/{id}`；getMany → `GET {url}?{options}`，砍 find——条件过滤经 options 任意键；add → `POST` body 原样数组一次发；delete 单个 `{url}/{id}`、批量 `?ids=1,2,3`）。合并链（逐层浅合并，无整表替换）：默认表 → `AutoSpark.resources.options.mapping` → `options.resources.mapping` → 资源内联 `mapping`。序列化约定：数组 query 值逗号连接（`tags=a,b`）；分页字段仅传入时出现（对齐 `{items,total,pageSize,pageCount,page}` 响应壳约定）。

**修订追加（2026-11-01）**：①默认表补 `update`（`PUT` 系，body 恒原样、数组一次发）——单条 `update({id,…})` → `PUT {url}/{id}`；批量 `update([…])` → `PUT {url}`；条件 `update(data, options)` → `PUT {url}?{条件序列化}`（**显式条件优先于 id 路由**——显式传条件即按条件更新集合的意图；无 id 无条件退化 `PUT {url}`）；PATCH 语义按方法覆写自定。②**通用条件选项（ResourceCondition）**：条件形态方法（`get(options)` / `getMany(options)` / `update(data, options)` / `delete(options)`）共用 `{where, order, page, pageSize, …任意透传键}`，经 `conditionQuery` 归一化进 query——`where` 双形态（对象逐键展开 / 字符串作单一 `where` 参数后端方言直传），`get` / `delete` 以**非空普通对象实参**为条件形态判据（基元/数组沿用既有语义）。

### 决策 6：执行管线共享 + 请求选项三层回退

规则只拼 RequestDesc；query 序列化 / body JSON 化 / headers 合并 / fetch / 非 2xx → `ResourceError` / `unwrap` 解包统一在 `executeRequest`（自定义映射与默认映射同管线，DRY）。选项（`baseUrl`/`fetch`/`headers`/`unwrap`）按**就近三层**：资源定义内联 > `options.resources` > `AutoSpark.resources.options`（缺失才回退，与 ADR-0007 精神一致）。映射方法执行体经 `this.engine` **活取** engine 级配置——声明无状态，跨 engine 共享安全（与 pluginActions 惰性物化语义兼容）。

## 后果

- engine 侧配套两处小改动（ADR-0131 点号 / ADR-0132 派发 + registerScoped 收编），resource 实现全住本包 `src/modules/resource/`（复合插件形态，ADR-0009）；产物 `autospark.resource.js`（gzip ~2.7kB）。
- 未装插件：`autospark/resources` script 未注册被 warn 丢弃、`x-resource` 未知指令、`AutoSpark.resources` 缺失——报错即引导（硬切不留薄桥，ADR-0003 纪律）。
- 局部资源方法只 DOM 冒泡不进总线（ADR-0012）——总线信号消费须 engine 级及以上注册；feedback 联动走返回值捕获不受限。
- 第一版不做：`find`（砍）、token 刷新/重试/超时（自定义 `fetch` 全可实现）、ESM 产物（script-first，ADR-0128 决策 6 口径）。
- 类型面经 `declare module "autospark"` 声明合并（options.resources / engine.resources）；类静态 `AutoSpark.resources` 无 TS augmentation 接缝（导出类静态成员不可合并），消费方经插件导出的类型断言使用。
