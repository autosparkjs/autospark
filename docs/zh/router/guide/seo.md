---
title: SEO优化
---

# SEO优化

## 关于

纯前端路由无法被爬虫直接抓取子路由内容。router 内置 **SEO `<head>` 管理**（默认开启）：把"当前路由声明了什么"写入文档 `<head>`——标题、描述、canonical、robots、Open Graph 与 JSON-LD 结构化数据，使**执行 JS 的爬虫**（Google / Bing）在渲染 SPA 后拿到完整的页面元信息。

::: warning 能力边界
不执行 JS 的弱爬虫（如百度）看不到这些内容——如需覆盖，需要服务端配合（预渲染/动态 UA 响应），这不在 router 职责内。
:::

## 指南

### 开关与站点配置

`head` 选项控制 head 管理：

```js
const engine = new AutoSpark(host, {}, {
    routes: [/* ... */],
    head: {
        siteUrl: "https://example.com",   // 站点绝对地址：相对 canonical / og:url 解析为绝对地址
        titleTemplate: "%s - 麒麟商店"    // 标题模板：%s 替换为最终标题
    }
});

// head: false  → 整体关闭，router 不再读写 <head>
// head 缺省    → 以默认配置开启
```

`titleTemplate` 不含 `%s` 时退化为 `"{标题} - {模板}"` 形态。

### 路由级声明

声明来源是路由表：`route.title` + `route.meta` 的固定键，**父 → 子合并、子覆盖**：

```js
routes: [
    {
        path: "/",
        title: "首页",                       // → document.title
        children: [
            {
                path: "products",
                title: "商品列表",
                meta: {
                    description: "全品类商品一览",          // meta description
                    canonical: "/products",                  // canonical（相对地址经 siteUrl 解析）
                    robots: "index,follow",                  // meta robots
                    og: {                                    // Open Graph（自动归一 og: 前缀）
                        title: "麒麟商店",
                        image: "https://cdn.example.com/og.png"
                    },
                    jsonLd: {                                // JSON-LD 结构化数据（对象或数组）
                        "@context": "https://schema.org",
                        "@type": "ItemList"
                    }
                }
            }
        ]
    }
]
```

沿匹配链合并意味着：父路由声明的骨架（如站点级 `og`、`robots`）被子路由继承，子路由同名键覆盖。

### 视图级覆盖

路由渲染后，router 延后一个宏任务读取已挂载视图里的 **`<autospark-view-meta>`** 元素，其同名属性与路由级声明**合并后再整体写入**——视图声明覆盖路由声明：

```html
<!-- views/product.html：视图侧补充/覆盖 SEO 声明 -->
<autospark-view-meta
    description="视图内声明的描述"
    og:updated_time="2026-01-01"
></autospark-view-meta>
<h1 x-text="product.name"></h1>
```

两阶段时序的意义：路由级声明在渲染完成时立即可见（阶段 A），视图级声明在视图挂载后补充（阶段 B）——SPA 首屏响应速度与元信息完整度兼得。导航版本号变化时，未落地的阶段 B 写入自动作废。

### 单路由关闭

`meta.seo: false` 关闭该路由的 head 管理（不写任何受管标签）：

```js
{
    path: "/admin",
    meta: { seo: false }   // 后台页不参与 SEO
}
```

### 受管标签的识别与还原

router 写入的标签带 `data-autospark-seo` 标记属性；复用页面既有标签（如同名 `meta`）时记录原始属性快照，导航离开时还原。`router.detach()` 撤销全部 head 写入。

### 特殊场景

- **模态路由**（`push("!...")`）**不经过 head 管理**——模态是叠加浮层，改 `document.title` 会破坏底页语义
- **hash 模式**：`#` 后的路径不参与服务端请求，canonical/OG 随 URL 变化的 SEO 硬能力不成立——router 仅保留 head 管理本身，attach 时一次性告警提示

::: tip canonical 不会自动构造
canonical 仅在**显式声明**时注入（路由 `meta.canonical` 或视图声明），router 不按当前 URL 自动生成——避免把带参 URL 固化为规范地址。
:::
