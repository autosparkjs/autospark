---
title: 内置元素
---

# 内置自定义元素

## 关于

`@autospark/router` 包加载时自动注册以下自定义元素（引包即注册，无需手动 `customElements.define`）：

| 标签名 | 类 | 用途 |
| --- | --- | --- |
| `<auto-link>` | `AutoSparkLink` | 声明式路由链接 |
| `<autospark-view-meta>` | `AutoSparkViewMeta` | 视图级元数据声明 |
| `<autospark.outlet>` | — | 路由出口（由 router 自动注册，详见[路由出口](../guide/outlet.md)） |

::: tip 加载指示与错误呈现已内建
`autospark-loading` / `autospark-feedback` 自定义元素已删除（ADR-0012）——加载中指示由出口内建 x-loading 门控遮罩承担，错误呈现由出口内建错误块与 `errorPages` 承担，详见[错误呈现与重试](../guide/engine/router/error-presentation.md)。
:::

## auto-link

路由链接组件，Light DOM 内层是**真实的 `<a>` 元素**（爬虫与预 JS 环境可发现链接）。

```html
<auto-link to="/users/42">用户 42</auto-link>
<auto-link href="/about" replace>关于（replace 导航）</auto-link>
<auto-link to="https://example.com" target="_blank">外部链接</auto-link>
```

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `to` | `string` | `""` | 目标路径；**`href` 是 `to` 的别名**（双向同步，写哪个都等价） |
| `replace` | `boolean` | `false` | `true` 时使用 `router.replace` 导航 |
| `target` | `string` | `""` | 同 `<a target>`；`_blank` 新窗口打开 |
| `rel` | `string` | 自动 | 用户设置优先；`target="_blank"` 时自动追加 `noopener noreferrer` |

行为要点：

- 内部路由（`/` 开头且不含 `://`）：内层 `<a>` 的 href 自动加 base 前缀（真实可爬），点击由 router 的**文档级点击委托**接管为 SPA 导航
- 外部链接（含 `://`）：浏览器直接跳转，不接管
- 修饰键 / 中键 / 非左键点击：交还浏览器（新标签打开真实 href）
- 组件自身不绑定点击监听——统一由 router 的文档级委托处理（`attach` 注册、`detach` 注销），天然覆盖运行期插入的链接
- 普通 `<a href>` 指向内部路由时同样被委托接管；`auto-link` 的价值在 base 前缀自动化与 `replace` 声明
- 危险协议（`javascript:` / `data:`）被拦截且不导航

样式：内层 `<a>` 带浏览器默认链接样式，需要融入排版时用 `auto-link > a { color: inherit; text-decoration: inherit }`。

## autospark-view-meta

视图级元数据声明组件：不占空间、不参与排版（`display: none`），支持任意自定义属性。这些元数据可被父组件或其他系统读取，用于配置页面行为、SEO、权限控制等；head 管理约定键（`title` / `description` / `canonical` / `robots` / `og` / `jsonLd` / `seo`）的同名属性会覆盖路由 `meta` 声明。

```html
<autospark-view-meta
  title="页面标题"
  description="页面描述"
  keep-alive="true"
  roles="admin,user"
></autospark-view-meta>
```

方法 API：

```ts
class AutoSparkViewMeta extends HTMLElement {
    /** 读取指定元数据，不存在返回 null */
    get(name: string): string | null;
    /** 写入元数据；value 传 null 删除该属性 */
    set(name: string, value: string | null): void;
    /** 读取全部元数据（键值对对象） */
    getAll(): Record<string, string>;
}
```

```js
const meta = document.querySelector("autospark-view-meta");
const roles = meta?.get("roles")?.split(",");
meta?.set("title", "新标题");
meta?.set("description", null); // 删除
```
