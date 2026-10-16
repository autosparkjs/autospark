---
title: 内置元素
---

# 内置自定义元素

## 关于

`@autospark/router` 包加载时自动注册以下自定义元素（引包即注册，无需手动 `customElements.define`）：

| 标签名 | 类 | 用途 |
| --- | --- | --- |
| `<auto-link>` | `AutoSparkLink` | 声明式路由链接 |
| `<autospark-loading>` | `AutoSparkLoading` | 加载提示 |
| `<autospark-feedback>` | `AutoSparkFeedback` | 消息/错误/状态反馈页 |
| `<autospark-view-meta>` | `AutoSparkViewMeta` | 视图级元数据声明 |
| `<autospark.outlet>` | — | 路由出口（由 router 自动注册，详见[路由出口](../guide/outlet.md)） |

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

## autospark-loading

加载提示组件，路由 `loading` 默认开启时显示于导航过程中。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `message` | `string` | `"Loading..."` | 提示文本 |

```html
<autospark-loading message="加载中"></autospark-loading>
```

## autospark-feedback

消息/错误/状态反馈组件，`errorPages` 与错误边界的常用载体。

```html
<autospark-feedback
  type="error"
  message="加载失败"
  description="无法获取资源，请稍后重试"
  retryable
  backable
></autospark-feedback>
```

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| `type` | `"info" \| "warn" \| "error" \| "success"` | 反馈类型（决定内置图标与配色） |
| `message` | `string` | 主消息 |
| `description` | `string` | 补充描述 |
| `icon` | `string` | 自定义图标（SVG 字符串或图片 URL），覆盖内置图标 |
| `actions` | `string`（宽松 JSON） | 动作按钮配置数组 |
| `closeable` | `boolean` | 显示关闭按钮 |
| `retryable` | `boolean` | 显示重试按钮（点击发出 `autospark:action` 事件，`detail.name = "retry"`） |
| `backable` | `boolean` | 显示返回按钮（`detail.name = "back"`） |
| `inline` | `boolean` | 内联模式（不占整页） |

`actions` 配置（宽松 JSON，允许无引号键名/单引号/尾逗号）：

```ts
interface ActionConfig {
    /** 动作名称/标识 */
    name: string;
    /** 按钮标题 */
    title?: string;
    /** 按钮提示文本 */
    tips?: string;
    /** 图标（SVG 字符串或图片 URL） */
    icon?: string;
    /** 是否为主要按钮 */
    primary?: boolean;
}
```

动作点击通过 `autospark:action` 事件消费，`event.detail` 即命中的 `ActionConfig`（内置 `close` / `retry` / `back` 动作有默认图标）。

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
