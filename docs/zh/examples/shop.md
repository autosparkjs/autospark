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
