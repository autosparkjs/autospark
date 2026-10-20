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
| 应用状态 | 根状态 `cart` / `user` / `ui` 全站可见，视图内直接读写 |
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

购物车是这个示例里唯一"跨页面且读写频繁"的数据，它的处理方式能代表引擎里状态设计的典型取舍：**状态只存最小事实，派生值在读取时现算**。

#### 1. 状态里只放"选了什么"

```javascript
// index.html：购物车是根状态的一个普通数组，每个元素就是一条明细
cart: [],
// 形如：{ id, name, price, emoji, color, qty }
```

没有 `cartCount`、`cartTotal`、`subtotal` 这类派生字段——件数、合计、行小计都能由 `cart` 唯一推出来。少一份派生状态，就少一处"忘了同步"的可能。

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

#### 3. 三个读点共用一套表达式

购物车的"读取"散落在三处，但都是对同一份根状态的同一种聚合：

```html
<!-- 外壳：导航栏角标 -->
<span class="badge" x-show="cart.length > 0" x-text="cart.reduce((t, i) => t + i.qty, 0)"></span>

<!-- 产品页：底部结算条 -->
<span>已选 <b x-text="cart.reduce((t, i) => t + i.qty, 0)"></b> 件 · 合计 ¥<span x-text="cart.reduce((t, i) => t + i.qty * i.price, 0)"></span></span>

<!-- 购物车页：行内小计与订单摘要 -->
<span x-text="item.price * item.qty"></span>
<span x-text="cart.reduce((t, i) => t + i.qty * i.price, 0) >= 3000 ? '免运费' : '¥0（满 3000 免）'"></span>
```

`cart` 定义在 engine 的根状态上，视图编译后沿 scope 链向上查找就能拿到，所以**任何页面都能读写同一份购物车**，不需要逐层传参、也不需要事件总线。产品页加购后返回首页，角标、快捷入口文案、购物车页摘要会同时是对的——它们本来就是同一份数据的三个投影。

#### 4. 为什么派生值不写成 `computed`

最初这版示例把件数/合计写成了派生状态：

```javascript
// ⚠️ 反例：item.qty 变化不在这份派生的依赖范围内，角标与合计不会刷新
cartCount: AutoSparkSpaces.computed((s) => s.cart.reduce((t, i) => t + i.qty, 0)),
```

问题出在**依赖粒度**。模板求值分两路：纯路径（如 `user.name`）按路径精准订阅；含运算符 / 函数调用的复合表达式则在求值时**按实际读到的路径收集依赖**再订阅——`cart.reduce(...)` 会读到 `cart`、每个下标、以及每一项的 `qty` / `price`，所以项内字段一变就重算。

而把同样的聚合挪进一个独立的派生键后，实测行为是：数组**结构**变化（push 新行、整行替换）会重算，但**项内 `qty` 的变更不会**——角标与合计就停在旧数字上。

因此约定是：**派生值优先写成模板表达式**（读时现算，依赖跟着实际读取走，天然同步）。真到了聚合开销不可忽略的规模，再改成"显式订阅 `cart` 变化 → 自己重算并写回一个字段"，把同步责任摆在明面上，而不是依赖一个看不见的依赖收集。

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
    const count = s.cart.reduce((t, i) => t + i.qty, 0);
    const total = s.cart.reduce((t, i) => t + i.qty * i.price, 0);
    s.cart.splice(0); // 清空 → 所有读点同帧内一起收敛
    toast(`下单成功：${count} 件商品，合计 ¥${total}（演示订单）`, "success");
    host.router && host.router.push("/");
}
```

::: tip 想加持久化？
购物车目前是内存状态，刷新即清空。要持久化，可在 action 里把 `cart` 写进 `localStorage`，并在构造 engine 时用它做初始值——注意初始值仍应是"明细数组"，件数/合计继续由模板现算，别把派生值一起存进存储。
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
