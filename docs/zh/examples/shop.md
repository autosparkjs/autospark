# 示例

`autospark` 不是"给静态页面加点交互"的小工具，而是一套可以直接搭建完整前端应用的引擎。下面这个示例就是一次完整实践：**7 个页面、跨页共享状态、路由跳转、表单校验、全局通知**，全部由静态 HTML + JSON 组成，没有构建步骤、没有打包产物。

## 星辰手机商店

一个手机品牌的官网 + 商城：首页、新闻、产品、服务、关于、购物车、登录七个页面，导航与路由同步高亮，购物车与登录态跨页面共享。

<div class="demo-frame">
    <iframe src="/autospark/examples/shop/index.html" title="星辰手机商店示例" loading="lazy"></iframe>
</div>

<p class="demo-actions">
    <a href="/autospark/examples/shop/index.html" target="_blank" rel="noreferrer">在新窗口打开示例 →</a>
</p>

可以试一试：在产品页加入购物车 → 导航栏角标变化 → 购物车页调整数量、看合计重算 → 未登录点结算会被拦去登录页 → 登录后下单清空购物车。

### 示例覆盖的能力

| 能力 | 在本示例中的体现 |
| --- | --- |
| 应用状态 | 根状态 `cart` / `user` / `ui` 全站可见；购物车件数与合计是状态上的计算属性（`cartCount` / `cartTotal`），各处直接读 |
| 模板绑定 | 顶部品牌、角标、筛选、空态等全部由 `x-text` / `x-show` / `x-for` / `:class` 驱动 |
| 路由 | `@autospark/router` 的 hash 模式，7 条路由 + `titleTemplate`，静态托管下深链直达可用 |
| 视图与数据加载 | 每条路由声明 `view`（`views/*.html`）与 `data`（同名 `*.json`），路由切换时自动加载 |
| 动作 | `addToCart` / `changeQty` / `checkout` / `login` / `logout` 等写成全局 action，模板里按名调用 |
| 表单 | `x-model` 双向绑定 + `x-form` 拦截原生提交（校验不通过不放行 `@submit` action） |
| 通知 | 通知插件（`engine.notifications`）的 `toast` 提供加购、下单、登录等全局轻提示 |
| 响应式布局 | 窄屏切换为汉堡菜单，视图私有样式写在各自模板的 `<style>` 内，公共样式集中在 `styles.css` |

### 文件结构

```text
examples/shop/
├── index.html          # 外壳：导航 / 路由出口 / 页脚 + 全局状态与 actions + 路由表
├── styles.css          # 公共样式（壳层、按钮、卡片、栅格）
└── views/
    ├── home.html       # 首页（含 <style> 私有样式）
    ├── home.json       # 首页数据（轮播、热销、资讯摘要…）
    ├── news.html       # 新闻列表 + 分类筛选 + 展开全文
    ├── news.json
    ├── products.html   # 产品网格 + 分类筛选 + 加购
    ├── products.json
    ├── services.html   # 服务卡片 + FAQ 手风琴
    ├── services.json
    ├── about.html      # 品牌故事 + 统计 + 发展历程
    ├── about.json
    ├── cart.html       # 购物车：增减数量、移除、合计与运费实时聚合
    └── login.html      # 登录：校验、加载态、登录后回跳
```

### 关键写法

视图模板就是普通 HTML 片段，用指令绑定数据，不需要任何前缀：

```html
<!-- views/products.html：产品网格 + 分类筛选 + 加购 -->
<div x-for="p of products.filter((p) => ui.productCat === '全部' || p.category === ui.productCat)">
    <h3 x-text="p.name"></h3>
    <b x-text="'¥' + p.price"></b>
    <button @click="addToCart(p)">加入购物车</button>
</div>
```

路由表在 `index.html` 构造 engine 时一并声明（第三参），`router` 插件自举挂载：

```javascript
const engine = new AutoSpark(host, { cart: [], user: null /* … */ }, {
    actions: {
        checkout() {
            /* … */
        },
        login() {
            /* … */
        },
    },
    routes: {
        // hash 模式：静态托管下刷新 / 深链直达均可用
        mode: "hash",
        routes: [
            { path: "/", title: "首页", view: "views/home.html", data: true, default: true },
            { path: "/products", title: "产品", view: "views/products.html", data: true },
            // …
        ],
        head: { titleTemplate: "%s - 星辰手机商店" },
    },
});
```

入口按顺序引入 engine、router 与通知插件即可，全部是普通 `<script>`，无需构建：

```html
<script src="/autospark/autospark.js"></script>
<script src="/autospark/autospark.router.js"></script>
<script src="/autospark/autospark.notifications.js"></script>
```

### 购物车实现原理

购物车是这个示例里唯一"跨页面且读写频繁"的数据，它的处理方式能代表引擎里状态设计的典型取舍：**状态只存最小事实（明细数组），派生值用计算属性声明，让它们自己跟着算**。

#### 1. 状态：明细数组 + 计算属性

```javascript
// index.html：购物车是根状态的一个普通数组，每个元素就是一条明细
cart: [],
// 形如：{ id, name, price, emoji, color, qty }
```

件数、合计这类聚合值**不手工维护**：不用在 action 里加减累加器，也不用在每次变更后手动同步——而是用计算属性声明在状态上，`cart` 一变就自动重算：

```javascript
cart: [],
cartCount: computed((s) => s.cart.reduce((t, i) => t + i.qty, 0), { depends: ["cart.**"] }),
cartTotal: computed((s) => s.cart.reduce((t, i) => t + i.qty * i.price, 0), { depends: ["cart.**"] }),
```

示例里状态以**裸对象**作为第二个参数传给 engine，因此 `computed` 从命名空间取：`AutoSparkSpaces.computed(...)`。若把状态写在 `<script type="autospark/data">` 里，`computed` / `configurable` / `watch` 由引擎作为形参注入，直接写 `computed(...)` 即可（见 [x-data](/zh/references/directives/x-data)）。

`{ depends: ["cart.**"] }` 不是可有可无的润色，原因见第 4 节。

#### 2. 四个写入口，统一收在 actions 里

```javascript
actions: {
    // 加入购物车：同款累加数量，不重复占一行
    addToCart(p) {
        const s = engine.state;
        const item = s.cart.find((i) => i.id === p.id);
        if (item) item.qty += 1;
        else s.cart.push({ id: p.id, name: p.name, price: p.price, emoji: p.emoji, color: p.color, qty: 1 });
    },
    // 数量增减：减到 0 及以下自动移除该行
    changeQty(id, delta) {
        const s = engine.state;
        const item = s.cart.find((i) => i.id === id);
        if (!item) return;
        item.qty += delta;
        if (item.qty <= 0) s.cart.splice(s.cart.indexOf(item), 1);
    },
    // 移除单条 / 清空
    removeFromCart(id) {
        const s = engine.state;
        const idx = s.cart.findIndex((i) => i.id === id);
        if (idx >= 0) s.cart.splice(idx, 1);
    },
    clearCart() {
        engine.state.cart.splice(0);
    },
}
```

写入口只有这几个动作，模板里全部按名调用（`@click="changeQty(item.id, 1)"`），不在模板里写赋值语句——业务规则（同款合并、减到 0 移除）集中在一处，视图只负责呈现。

#### 3. 三个读点直接用计算属性

购物车的"读取"散落在三处，但三处都只是**读同一个计算属性**，不各自写聚合逻辑：

```html
<!-- 外壳：导航栏角标 -->
<span class="badge" x-show="cartCount > 0" x-text="cartCount"></span>

<!-- 产品页：底部结算条 -->
<span>已选 <b x-text="cartCount"></b> 件 · 合计 ¥<span x-text="cartTotal"></span></span>

<!-- 购物车页：行内小计与订单摘要 -->
<span x-text="item.price * item.qty"></span>
<span x-text="cartTotal >= 3000 ? '免运费' : '¥0（满 3000 免）'"></span>
```

`cart` / `cartCount` / `cartTotal` 都在 engine 的根状态上，视图编译后沿 scope 链向上查找就能拿到，所以**任何页面都能读写同一份购物车**，不需要逐层传参、也不需要事件总线。产品页加购后返回首页，角标、快捷入口文案、购物车页摘要会同时是对的——它们本来就是同一份数据的三个投影。

action 里同理，不需要重新遍历数组：

```javascript
addToCart(p) {
    /* …加购逻辑… */
    toast(`已加入购物车：${p.name}（${engine.state.cartCount} 件）`, "success");
}
```

#### 4. 计算属性的依赖颗粒度（为什么要 `depends: ["cart.**"]`）

计算属性默认**自动收集依赖**，但粒度只到 `computed` 函数体里读到的**顶层键**：`s.cart` 会把 `cart` 登记为依赖。于是：

| 变更 | 命中依赖 `cart`？ | 默认 computed 是否重算 |
| --- | --- | --- |
| `cart.push(...)` / `cart.splice(...)`（结构变化） | 命中 | ✅ 重算 |
| `cart[0].qty = 5`（项内字段） | 不命中（路径是 `cart.0.qty`） | ❌ 不重算 |

在最小复现里实测过两种写法（`autostore` 4.x，直接 `new AutoStore({ cart: [], derived: computed(...) })`）：

```text
默认                      push: 1  | qty=5: 1   | 再 push: 7
{ depends: ["cart.**"] }  push: 1  | qty=5: 5   | 再 push: 7
```

也就是说：**不加 `depends` 时，加减数量不会让角标与合计刷新，只有整行增删才刷新**——这正是“看起来能跑、点两下就露馅”的典型坑。把依赖显式声明到项级（`cart.**`）后，`qty` / `price` 的变更同样触发重算。

```javascript
cartCount: computed((s) => s.cart.reduce((t, i) => t + i.qty, 0), { depends: ["cart.**"] }),
```

::: warning 不写 `depends` 会怎样
代码不报错、首屏也对，只有“加减数量”时数字不动（新增行、删除行却正常）——这是最容易被漏掉的坑。购物车、清单、订单明细这类“数组元素内部字段频繁变更”的场景，请把依赖声明到 `**`。
:::

经验法则：**计算属性读到的依赖里含数组元素内部字段时，用 `**` 把依赖声明到项级**；只依赖顶层标量（如 `s.base * 2`）时默认自动收集就够了。

另一种写法是干脆不声明派生键，直接在模板里写聚合表达式（`x-text="cart.reduce(...)"`）——模板的复合表达式在求值时按**实际读取的路径**收集依赖，`cart.**` 的效果天然具备。但同一份聚合散落到多处模板时会重复且难改，所以本示例选择：**状态上声明一次，模板各处直接用**。

#### 5. 列表、空态与结算

- 列表用 `x-for="item of cart" :key="item.id"`，按 `id` 复用节点——改数量时只 patch 那一个 `<span>` 的文本，行节点、名称节点、数量节点身份都不变，按钮焦点也不会丢；
- 空态用 `x-show="cart.length === 0"` 与列表互斥切换，不写额外状态；
- 结算 `checkout` 先做登录校验，未登录时轻提示 + `router.push('/login')`；已登录则**先算出件数与合计**（清空前取值），再 `cart.splice(0)` 清空——一次状态变更同时驱动角标归零、列表切空态、首页摘要复位。

```javascript
checkout() {
    const s = engine.state;
    if (!s.user) {
        toast("请先登录后再结算", "warn");
        host.router && host.router.push("/login");
        return;
    }
    const count = s.cartCount; // 计算属性：清空前取值
    const total = s.cartTotal;
    s.cart.splice(0); // 清空 → 计算属性重算为 0，所有读点同帧内一起收敛
    toast(`下单成功：${count} 件商品，合计 ¥${total}（演示订单）`, "success");
    host.router && host.router.push("/");
}
```

::: tip 想加持久化？
购物车目前是内存状态，刷新即清空。要持久化，可把 `cart` 写进 `localStorage`，并在构造 engine 时用它做初始值——只存明细数组，别把 `cartCount` / `cartTotal` 一起存：它们是计算属性，恢复明细后会自动算出新值。
:::

::: tip 在本地运行
运行 `bun run dev` 启动文档站后，直接访问 `/autospark/examples/shop/index.html`；源码位于仓库 `docs/public/examples/shop/`，改完保存刷新即可看到效果（示例自身没有热更新，因为它不经过打包）。
:::

## 更多示例

- [快速入门](/zh/guide/intro/get-started)：最小可运行页面
- [路由快速入门](/zh/guide/engine/router/quick-start)：路由与视图加载
- [组件开发](/zh/guide/engine/component/develop)：`x-define` 自定义组件
- [通知插件](/zh/guide/engine/notifications/)：轻提示、确认框与任务

<style scoped>
.demo-frame {
    margin: 1.5rem 0 0.75rem;
    border: 1px solid var(--vp-c-divider);
    border-radius: 12px;
    overflow: hidden;
    background: var(--vp-c-bg-soft);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
}

.demo-frame iframe {
    display: block;
    width: 100%;
    height: 720px;
    border: 0;
}

.demo-actions {
    margin: 0 0 1.5rem;
    font-size: 0.9rem;
}

@media (max-width: 640px) {
    .demo-frame iframe {
        height: 520px;
    }
}
</style>
