---
title: 多语言
---

# 多语言

## 关于

静态多语言站点的典型诉求：**同一路由路径、按语言取不同内容文件**（`/a/home.html` ↔ `/a/home_zh-CN.html`）。router 内置多语言内容通道：声明一次语言清单，视图、路由表等内容请求自动按当前语言重写 URL，切换语言即重载当前路由——路由路径语言无关，本地化落点收敛到内容 URL 一处。

| 能力 | 说明 |
| --- | --- |
| 语言清单 | engine 构造 options 声明，非空即启用 |
| URL 重写 | 视图与路由表按内置文件名后缀规则重写，或由钩子完全接管 |
| 语言解析 | `'auto'` 按浏览器语言三级匹配；`$.language` 恒为具体 code |
| 切换 | 赋值 `$.language` 即触发完整导航管线重入（不写历史） |
| 缓存隔离 | 数据缓存与 keepAlive 自动按语言隔离 |

::: tip 语言清单由 engine 声明
`languages` 写在 engine 构造第三参（`AutoSparkOptions`）上，经插件挂载传递给 router——与[路由启用方式](./router/installation.md)一致。单独使用 router 时写在 router options 上，效果相同。
:::

## 指南

### 声明语言清单

`languages` 非空即启用多语言；空/缺省时整套机制关闭（不重写、不注入 `$.language`）：

```js
const engine = new AutoSpark(host, {}, {
    languages: [
        { code: "en", name: "English", nativeName: "English" },   // languages[0] 为默认语言
        { code: "zh-CN", name: "简体中文", nativeName: "中文" },
    ],
    routes: [/* ... */],
});
```

- `code`：语言标签，**完整 BCP 47 连字符风格**（`zh-CN`、`en`），重写后缀原样使用；
- `name` / `nativeName`：供语言切换 UI 展示的元数据，运行时不消费。

### 内置 URL 重写规则

未提供钩子时（见下文 [getLanguageUrl](#getlanguageurl-钩子)），按通道矩阵重写：

| 通道 | 重写 | 说明 |
| --- | --- | --- |
| 视图（`view`） | ✓ | 内置文件名后缀规则 |
| 路由表（`routes`） | ✓ | 顶层表与远程子表 fetch 均重写 |
| 数据（`data`） | ✗ | API 语言语义交由应用自行处理 |

内置规则（仅作用于 view/routes 两通道）：

- **默认语言免重写**：`languages[0]` 视为默认语言，请求 URL 原样——静态站既有文件布局（默认语言无后缀）继续承担可寻址性；
- **其余语言**：URL 末段**扩展名前**插入 `_${code}`：

| 原 URL | zh-CN 下实际请求 |
| --- | --- |
| `pages/home.html` | `pages/home_zh-CN.html` |
| `pages/home` | `pages/home_zh-CN` |
| `pages/home.html?tab=1#a` | `pages/home_zh-CN.html?tab=1#a`（query/hash 原样保留） |
| `/` 或 `pages/`（目录形） | 不重写 |

重写时机在**参数插值之后、base 前缀之前**：`{params}` 已替换为实际值，`!` raw 前缀通道剥前缀后同样参与重写。

### 语言解析与 $.language

启用后，engine 状态根自动注入响应式 `$.language`，**恒为清单中的具体 code**，模板全局可用：

```html
<p x-text="$language"></p>
```

`'auto'` 只是输入值：router 启动时**先解析再写入**（早于路由表加载——本地化 `routes.json` 首次 fetch 即按已解析语言请求）。解析三级匹配：

1. **tag 全等**：大小写与 `-`/`_` 归一（`zh_cn` ≡ `zh-CN`）；
2. **主语言子标签相同**：浏览器 `zh-HK` 命中配置 `zh-CN`；
3. **回退 `languages[0]`**。

在 `$.language` 预置 `'auto'`（或任意清单值）可控制初始语言，缺省视同 `'auto'`（跟随浏览器语言）。同时 `document.documentElement.lang` 自动跟随当前语言。

### 切换语言

对 `$.language` 赋值即切换——触发**完整导航管线重入**当前路径：守卫、`navigation:*` 事件、加载与渲染全按既有语义重跑：

```js
engine.store.state.$.language = "zh-CN";
```

语义边界：

- **不写 history**：地址栏不变、不产生历史记录，刷新页面回到初始语言（`auto` 则回浏览器语言）；
- **同值赋值无效果**（如切回当前语言）；
- 赋值不在清单中的值会在控制台 warn 并回退原值。

切换期间的数据缓存与 keepAlive 视图按新语言重新取数（见下节），已加载状态全部重置。

### 缓存隔离

默认 hash 模板自动并入当前语言（`{url}` → `{url}@{language}`），因此**数据缓存与 keepAlive 自动按语言隔离**，零额外配置——切回旧语言命中旧语言的缓存，切到新语言重新加载。

::: warning 自定义 hash 须自行纳入
路由项显式声明 `hash` 模板时不含语言分量，须按语言隔离缓存的应用自行纳入（如 `hash: "{url}-{$language}"`），否则不同语言共享同一视图实例。
:::

### getLanguageUrl 钩子

内置规则不满足（如路径前缀式 `/en/products`、按目录分语言）时，提供 `getLanguageUrl` 钩子**完全接管**三通道——默认矩阵不再兜底（默认语言豁免、data 不重写等均由钩子自行分流）：

```js
const engine = new AutoSpark(host, {}, {
    languages: [{ code: "en" }, { code: "zh-CN" }],
    // 提供钩子 = view / data / routes 三通道完全接管
    getLanguageUrl: (language, url, type) => {
        if (language.code === "en") return url;              // en 免重写
        if (type === "data") return url;                     // API 不参与语言重写
        return url.replace(/(\.\w+)?$/, `_${language.code}$1`);
    },
    routes: [/* ... */],
});
```

钩子参数：

| 参数 | 含义 |
| --- | --- |
| `language` | 目标语言清单项（`{ code, name?, nativeName? }`） |
| `url` | 待重写 URL——视图/数据通道为**参数插值后、base 前缀前**的具体 URL |
| `type` | 内容通道：`'view'` / `'data'` / `'routes'` |

**返回 `null` 或 `undefined` = 该次不重写、直接用原 URL**（而非回退内置规则）——这是钩子模式下的唯一逃生口。

### 规划中

`localStorage` 持久化与 `<link rel="alternate" hreflang>` 输出在规划中，当前版本如需请自行实现（监听 `navigation:end` + 写 `<head>`）。

## 示例

以下 demo 中 `en` 均为默认语言（免重写），且未预置语言（视同 `'auto'`）——**初始语言由浏览器语言解析决定**，中文浏览器打开即是 `zh-CN`。

**视图重写**：切换到 `zh-CN` 后视图请求自动重写为 `lang-home_zh-CN.html`，`$language` 与 `document.lang` 同步更新；切回 `en` 时命中默认语言的视图缓存：

<demo html="router/language.html"/>

**数据本地化**：默认矩阵下 data 通道不重写，提供 `getLanguageUrl` 钩子后由钩子分流——视图共用一份，数据文件按语言取 `profile.json` ↔ `profile_zh-CN.json`。切换语言时导航重入、数据缓存键含语言分量，新语言自动重新取数：

<demo html="router/language-data.html"/>

**本地化路由表**：路由表以字符串形态声明（fetch 该 URL）。启动时先解析语言（早于路由表加载），`routes` 通道走内置后缀规则——中文环境请求 `routes_zh-CN.json`、英文环境请求 `routes.json`，两表路径相同、仅 `title` 等元数据不同。注意路由表仅在启动时按已解析语言加载一次：切换语言不重新加载路由表（`$route.title` 保持初始语言），刷新页面回浏览器语言重新解析：

<demo html="router/language-routes.html"/>
