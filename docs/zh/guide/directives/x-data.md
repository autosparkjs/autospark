# 局域数据

`x-data` 在元素上声明一份**局部响应式数据**，供该元素子树的表达式读取。它把模板所需的临时状态就近放在一起，无需全部塞进全局 store。

```html
<div x-data="{ count: 0, tab: 'home' }">
  <span x-text="count"></span>
  <span x-text="tab"></span>
</div>
```

`x-data` 的值是**宽松 JSON 对象**（不是表达式），编译期一次性解析注入。

## 快速入门

<demo html="data/local.html"/>

```html
<div x-data="{ msg: '你好', times: 1 }">
  <p>{{ msg }}（第 {{ times }} 次）</p>
</div>
```

## 指南

### 私有响应域

默认（`x-data="{...}"`）把数据写入元素的**私有响应式域**（`store.state.$scopes[scope.id]`）：子树可见、scope 间隔离，字段级细粒度更新。

<demo html="data/local.html"/>

```html
<div x-data="{ msg: '你好', times: 1 }">
  <p>{{ msg }}（第 {{ times }} 次）</p>
  <button @click="bump">+1</button>
</div>
```

### 数据脚本

`<script type="autospark/data">` 把数据声明从属性搬进**元素体内容**——大型 JSON 不再受属性转义折磨（可换行、可注释）。它**只作用于其直接父元素**，等效（且强于）在父元素上写 `x-data`：

```html
<div>
  <script type="autospark/data">
    {
        user: { name: '张三', roles: ['admin', 'dev'] },
        pageSize: 20
    }
  </script>
  <span x-text="user.name"></span>
</div>
```

**内容是 JS 对象字面量**（x-data 宽松 JSON 的超集）——求值时注入 `computed` / `configurable` / `watch` 三个函数，计算属性、可配置状态、侦听声明首次可以在模板里书写：

```html
<div>
  <script type="autospark/data">
    {
        base: 2,
        double: computed((s) => s.base * 2),                    // 计算属性（依赖变更自动重算）
        price: configurable(5, { widget: 'InputNumber' }),      // 带 schema 的可配置状态
        tick: watch((sc) => console.log(sc.path, sc.value),     // 侦听（纯副作用声明）
                    (path) => path.join('.').endsWith('base'))
    }
  </script>
  <span x-text="double"></span>
</div>
```

普通函数值直接就是 computed 简写：`triple: (s) => s.base * 3`。方法 / 事件回调不放这里——归 `<script type="autospark/actions">` 或组件 `<script setup>`。

**合并规则**（`deepMerge` 深合并：嵌套对象递归、数组整体替换、`undefined` 不覆盖已有值）：

- 多个数据脚本 → 按**文档顺序**后者覆盖前者；
- 与 `x-data` 同时存在 → 同样深合并，**x-data 最后合并、优先级最高**——脚本装大对象基底、属性写微调覆盖（如上例想覆盖某项，写 `x-data="{ pageSize: 50 }"` 即可）；
- 脚本在父元素子树内的**书写位置不影响首渲**（编译前预扫合成，再统一注入）。

**`options` 属性**：承载与 `x-data-options` 同款的挂载配置（`mount` / `global` / `nearest`）——父元素没有 x-data 时由脚本自带挂载声明；父元素已有 `x-data-options` 则以父元素为权威（脚本 options 被忽略并 warn）：

```html
<div>
  <script type="autospark/data" options="{mount:'ui.panel'}">
    { count: 1 }
  </script>
  <span x-text="count"></span>
</div>
<!-- 任意位置可读 ui.panel.count -->
```

**边界**：

- 只作用于**直接父元素**（不是最近祖先）——想给哪层建域，就把脚本放进那层元素的直接子级；
- 不能直接声明在结构指令（x-for / eager x-if / x-isolate）宿主的直接子级（其子节点是项模板）——移入项模板内目标元素的直接子级，每项实例独立数据域；
- 编译后 script 从渲染 DOM 移除；求值失败的脚本按空对象继续（error 日志，不中断）；
- `watch` 请声明在数据对象**顶层**（激活机制依赖注入后首读）；内容字符串含 `</script>` 时须写 `<\/script>`（HTML 解析限制）。

<demo html="data/script.html"/>

### 远程异步数据源

x-data 的值以 `/`、`//`、`http://`、`https://`、`./`、`../` 开头即 **url 形态**——编译期首取、经 `fetch` 异步取数落域（挂载三形态 / 回收语义照常，数据只是「晚点到」）：

```html
<div x-data="/api/books?order={book.order}">
  <span x-text="title"></span>
  <div x-fallback>加载中…（{{ $loading }}）</div>
</div>
```

<demo html="data/async-url.html"/>

**url 插值与自动重取**：`{表达式}` 单花括号（RFC 6570 同构），求值于宿主作用域（可读父链与全局状态），插值段自动 `encodeURIComponent`；**依赖变化自动重新 fetch**（旧值保留、不闪断），过期响应按请求序号丢弃：

```html
<div x-data="/api/books?page={page}"><span x-text="total"></span></div>
<!-- 改 page → 自动带新参数重取；重取期间旧数据照常显示 -->
```

**响应映射**：结果必须是**对象**（裸数组 / 标量 → `$error`，数据不落地）；REST 包壳用 `path` 选项提取：

```html
<div x-data="/api/list" x-data-options="{path:'data'}">...</div>
<!-- 响应 {code:0, data:{...}} → 取 data 字段落域 -->
```

**method / header**：`method` 选项直传 fetch（默认 GET）；`header` 传额外 HTTP 头（静态对象）。请求体（body）不支持——非幂等 / 带体请求用 action 形态。

**分页表格实战**：把 `page` / `size` 写进插值即得响应式数据源——翻页、调整每页条数自动重取；重取期间旧表格保留（`$loading` 可见、不闪断），失败时 `$error` 展示且旧值不丢，首载由 x-fallback 占位：

<demo html="data/async-fetch.html"/>

### 从动作获取异步数据

值形如 `标识符` 或 `标识符(实参)` 即 **action 形态**——经 getAction 链（局部 `autospark/actions` → 全局 `engine.actions`）查找执行，返回值 / Promise resolve 经与 fetch 相同的映射（对象-only + `path` 提取）落域；加载状态反馈与 x-fallback / x-loading 机制共用（见上节）。

**实参是表达式**（宿主作用域求值），依赖变化**对称重执行**（与 url 插值同一套「依赖收集 → 变化重取」机制）；action 内 `this` 与 x-on 调用时一致（`this.data` / `this.globalState` 可用）：

```html
<div x-data="loadBooks(page)">
  <span x-text="title"></span>
  <div x-fallback>失败：{{ $error.message }}</div>
</div>
```

<demo html="data/async-action-basic.html"/>

::: tip 适用场景
url 形态是声明式幂等取数（GET 为主）；action 形态覆盖命令式全能力——POST / 带请求体 / 本地计算 / 多源聚合，只要返回对象（或经 `path` 提取）即可作为数据源。
:::

<demo html="data/async-action.html"/>

### 异步状态反馈

:::warning 提示
`fetch`/`action`支持异步状态反馈
:::

异步形态在数据域注入两个元状态键，模板随时可读：

- **`$loading`**（布尔）：请求进行中为 `true`；
- **`$error`**（Error 实例）：加载失败时落地，`$error.message` 可读；新一轮请求发起时自动清空。

**x-fallback（可选）**：异步宿主的**特例子节点**（x-empty 之于 x-for 同构），非就绪态（加载中或失败）且**域内尚无数据**时替换渲染正常子树，就绪后自动复原。首载显示、**重取不闪断**（旧值保留）、失败也认领（可读 `$error`）：

```html
<div x-data="/api/books">
  <p x-text="title"></p>
  <div x-fallback>失败：{{ $error ? $error.message : '加载中…' }}</div>
</div>
```

**x-loading 覆盖层**：异步形态默认自动合成（绑定 `$loading`）；声明了 `x-fallback` 则默认不合成（避免双重加载指示）。异步专属选项：

| 选项      | 默认值 | 说明                                                                                    |
| --------- | ------ | --------------------------------------------------------------------------------------- |
| `path`    | —      | 响应提取路径（getVal 下钻，如 `'data'`）                                                |
| `loading` | 自动   | `false` 恒关；`{...}` 直传 x-loading 配置（message/color/delay…），且与 x-fallback 并存 |
| `method`  | `GET`  | url 形态直传 fetch                                                                      |
| `header`  | —      | url 形态额外 HTTP 头（静态对象）                                                        |

<demo html="data/async-loading.html"/>

::: warning 边界

- 裸词相对 url（如 `api/books`）不支持（与 action 名不可判定）——相对路径写 `./api/books`；
- **响应键遮蔽**：响应体的键落域后优先于全局状态同名键（聚合视图 data 层优先）——若接口回显 `page`/`size` 等参数而全局状态恰有同名控制键，插值重求值会读到域内旧值、依赖重取静默失效（引擎会 warn 提示）。建议控制键改名，或让接口不回显；
- `x-fallback` 必须是异步 x-data 宿主的**直接子级**；孤立声明按普通元素渲染并 warn；
- 元素销毁时进行中的请求被中止（AbortController），action 在途结果不落地。
  :::

### 全局合并

`.global` 修饰符把数据**合并进全局 store 根键**——所有 scope 可见，**不止声明它的子树**。任意独立子树、其他 `x-data` 私有域都能读到，改全局时所有订阅者同步更新。

<demo html="data/global.html"/>

```html
<!-- 声明处：theme/lang 合并进 store 根键 -->
<div x-data.global="{ theme: 'green', lang: 'zh' }">...</div>

<!-- 独立子树（未声明 x-data）也能读 —— 全局可见 -->
<div><p>主题：{{ theme }}</p></div>

<!-- 另一个 x-data 私有域：私有数据隔离，但仍能读全局 theme -->
<div x-data="{ local: '私有' }"><p>{{ local }} / {{ theme }}</p></div>
```

改全局直接操作 `engine.state.<键>` 即可（数据已在 store 根键）。元素销毁时，global 模式按 CAS 删除自己写入、且未被后写者覆盖的键。

`.global` **只做挂根这一件事**：不设 `this.data`、不改变当前 scope 的任何行为（运行时改全局请直接操作 `engine.state`）。要挂到根以外的位置，用下面的 `mount`。

### 指定挂载位置（mount）

`mount` 选项把数据挂到全局状态树的**任意位置**——`x-data` 的数据总要挂进状态树某个容器，`mount` 说清挂在哪：

| 形态   | 写法                             | 落点                                            |
| ------ | -------------------------------- | ----------------------------------------------- |
| 默认   | `x-data="{a:1}"`                 | 私有域 `$scopes.<id>`（子树可见、scope 间隔离） |
| 挂根   | `.global` ≡ `mount:""`           | 根键 `state.a`（不设 `this.data`）              |
| 挂路径 | `x-data-options="{mount:'x.y'}"` | `state.x.y`（merge 进容器）                     |

```html
<!-- 数据挂到 state.ui.panel：中间路径 ui 不存在则自动创建 -->
<div x-data="{ count: 0 }" x-data-options="{mount:'ui.panel'}">
  <!-- 声明子树内：{{count}} 直读（与默认模式体验一致） -->
  <span x-text="count"></span>
</div>

<!-- 任意位置：全路径可读 -->
<span x-text="ui.panel.count"></span>
```

**mount 模式的能力红利**（`_data` 指向挂载容器，与默认模式行为同构）：

- **双径读取**：声明子树内经 `x-text="count"` 直读；全树任意处经 `x-text="ui.panel.count"` 全路径读；
- **`this.data.count` 可写**：action 内直写挂载容器，细粒度响应式更新；
- **`engine.data(el, …)` 直接 merge 进容器**：不建私有域、不重建子树。

**写入是 merge**：挂载点已有的旧键保留（容器是共享容器，他人的数据不动），只追加/更新声明键。元素销毁时**键级 CAS 删除**（只删自己写入且未被后写者覆盖的键）；键删完后容器若变空，连同路径上变空的中间容器向上回收（`ui.panel` 空 → 删 `panel`，`ui` 因此变空 → 连 `ui` 一起删）。`engine.data()` 运行时追加的键**不回收**——视为用户接管。

<demo html="data/mount.html"/>

#### 相对挂载语法

`mount` 值以 `.` / `..` 开头时是**相对当前 scope** 的路径，段间用 `/` 分隔（与 x-teleport 语法同构）：

| 写法                  | 落点                                            |
| --------------------- | ----------------------------------------------- |
| `mount:'./x'`         | 自身容器下建 `x`（默认模式即 `$scopes.<id>.x`） |
| `mount:'../shared'`   | **直接父 scope** 容器下（不跳层）               |
| `mount:'../../deep'`  | 走两级直接父 scope                              |
| 越顶（`..` 超出链顶） | 落根 `state.<段>`                               |

- **无容器则创建**：`./` / `..` 命中的 scope 没有 `x-data` → 就地为它创建空私有域再挂入（含 x-for 的 item scope，数据随 item 生死）；
- **`.nearest` 修饰符**（`x-data.nearest="{...}"` ≡ `x-data-options="{nearest:true}"`）：改变每级 `..` 的步进单位——从「直接父 scope」变为「最近的持有数据的祖先 scope」（跳过 x-if/x-for/x-scope 等占位元素）；`./` 仍指自身容器；上溯途中再无数据祖先 → 落根；配绝对路径时静默忽略。

```html
<div x-data="{ pv: 0 }">
  <!-- 直接父有 x-data：挂到父容器下 $scopes.<pid>.shared -->
  <div x-data="{ v: 1 }" x-data-options="{mount:'../shared'}">...</div>
</div>
```

#### 无效路径与边界

- **中间路径不存在** → 逐级自动创建（`mount:'x.y'` 建出 `x:{y:{...}}`）；
- **中途断裂**（存在但非对象，如 `state.x=5`）或**任一段是数组** → `warn` + **降级默认私有域**（数据不丢、子树照常读，只是没落到指定路径；绝不覆盖用户数据）；
- **`mount:'$scopes.3'` 直指他域私有域** → `warn` + **放行**（后果自负：目标 scope 销毁时整删条目，挂载数据被连带蒸发）；
- **优先级**：`mount`（非空串）> `global` > 默认；两者同写 `mount` 胜出并 `warn`；`mount:""` 等价 `.global`；`mount` 值非字符串（误写 `.mount` 修饰符产生 `true`）→ `warn` + 忽略、回默认私有域。

### 嵌套作用域

父子元素的 data 经 `getContext` 的 parent 链层叠，读取时**就近命中**：

- **同名键覆盖**：子层声明的同名键覆盖父层——子读到自己那份，父层值不受影响。
- **未声明键继承**：子层没声明的键，沿 parent 链向上取最近一层的值（父 → 祖父 → … → 全局 state）。
- **写入命中本层**：`this.data.<键> = v` 只改本层 data 已有的键；本层没有则向上委托。

<demo html="data/nested.html"/>

```html
<div x-data="{ user: '张三', role: 'admin' }">
  <!-- 祖父层：user=张三  role=admin -->
  <div x-data="{ user: '李四', score: 88 }">
    <!-- 父层：user 覆盖=李四  role 继承祖父=admin  score 新增=88 -->
    <div x-data="{ score: 100 }">
      <!-- 子层：user 继承父=李四  role 继承祖父=admin  score 覆盖父=100 -->
    </div>
  </div>
</div>
```

::: tip 改某层只影响该层及后代的读取
点 demo 里「祖父级 · 改本层 user」只动祖父层，父/子层因已覆盖 user 而**纹丝不动**；点「父级 · 改本层 user」则子层（继承父）**跟变**、祖父层不变。这正是 x-data 作用域隔离的核心。
:::

### 运行时更新

`x-data` 仅在编译期注入一次，不监听属性变化。运行时改局部数据有两条路：

- **在动作内**（推荐）：直接写 `this.data.<键> = v`——AutoSparkActionContext.data 的 set 陷阱透传到本层私有响应式域，触发细粒度更新。
- **命令式 `engine.data(el, data)`**：合并进 el 对应 scope 的私有域，路径订阅自动驱动。适合在动作之外（定时器、外部回调）更新。

<demo html="data/runtime.html"/>

```javascript
// 动作内：最简，直接写本层 data
bump: function () { this.data.times++; }

// 命令式：el 必须是挂 DOM 的 scope 元素（见下方警告）
engine.data(document.getElementById("block"), { times: 10 });
```

::: warning engine.data 的 el 不能是根挂载容器
`engine.data(el)` 靠 `_findScopeByEl(el)` 比对 `scope.el === el` 定位 scope。根挂载容器的 scope 绑在编译期的**内部克隆节点**上（engine 只把子节点挂回容器、容器本身的 scope 不进 DOM），传入根容器会命中不到、被静默忽略。el 必须是挂 DOM 的 scope 元素——含 x-data 的子元素，engine 构造后经 `getElementById` / `querySelector` 取到的即是 `scope.el`。
:::

## 配置

`x-data` 的指令值是宽松 JSON 对象（必填，非表达式，编译期解析注入）。下列配置项控制注入目标；带 ✅ 者可用修饰符方式启用。

| 配置项    | 默认值 | 修饰符                    | 说明                                                               |
| --------- | ------ | ------------------------- | ------------------------------------------------------------------ |
| `mount`   | —      | —（无参开关不可携带路径） | 挂载位置：绝对路径 `'x.y'` / 相对 `'./x'`、`'../a/b'`；`""` 等价根 |
| `global`  | 未启用 | ✅                        | 挂到根（≡ `mount:""`）；不设 `this.data`、不改 scope 行为          |
| `nearest` | 未启用 | ✅                        | 相对挂载时 `..` 按最近数据祖先步进（跳过占位 scope）               |

优先级：`mount`（非空串）> `global` > 默认私有域。

::: info 关于指令配置体系
指令选项 / 修饰符 / 宿主选项 / 两层回退见[指令配置](../directive.md#指令配置)。
:::

## 注意事项

- **值是 JSON 字面量，不是表达式**：`x-data="{a:1+1}"` 不会求值 `1+1`，需直接写 `{a:2}`。运行时计算用动作改 state。
- **仅编译期注入**：`x-data` 不监听属性变化，运行时更新用 `engine.data(el, data)`。
- **局部数据隔离**：默认模式下各 scope 的私有域互不影响；要共享就用 `mount`（指定位置）或 `.global`（挂根）。
- **永不整体替换私有域**：内部按字段 `Object.assign`，不要试图整体替换 `$scopes[id]`。
- **`.global` 与 `mount` 的分工**：`.global` 只挂根、不设 `this.data`（运行时改全局写 `engine.state.<键>`）；`mount` 挂任意位置、行为与默认模式同构（`this.data` / `engine.data()` 直接作用于挂载容器）。
- **数据脚本与 x-data 的分工**：大宗数据（大 JSON、computed、configurable、watch）放 `<script type="autospark/data">`；零星覆盖放 x-data 属性（最后合并、优先级最高）。详见上方「数据脚本」小节。
