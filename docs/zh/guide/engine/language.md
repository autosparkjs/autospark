---
title: 多语言
---

# 多语言

## 概述

AutoSpark 提供两种互补的多语言实现方式，可单独使用，也可结合使用：

| | 方式一：多语言字典 | 方式二：路由方式 |
| --- | --- | --- |
| 载体 | i18n 插件（`autospark.i18n.js`，按需加载） | router（`autospark.router.js`） |
| 本地化粒度 | **字符串级**——模板内文案实时翻译 | **内容文件级**——按语言加载不同 URL 的视图/数据/路由表 |
| 切换行为 | 原地重渲染（依赖收集自动更新，无网络请求） | 完整导航管线重入当前路径（重新取内容文件） |
| 声明位置 | `x-locales` / `<script type="autospark/locales">` / `options.i18n.messages` | 语言清单 + URL 重写规则（内置后缀或钩子） |
| 典型场景 | 组件库、应用内交互文案、无路由页面 | 静态多语言站点、页面内容本地化（`home_zh-CN.html` ↔ `home_en.html`） |

两种方式**共用同一运行时真相** `state.$.language`：写字典方式装了 i18n 插件、路由方式装了 router，任一侧切换语言另一侧自动跟随。选型建议一句话：**组件开发用字典方式，静态站点内容用路由方式**（详见[最佳实践](#最佳实践)）。

两种方式的语言清单同源：统一声明在 engine 的 `options.i18n.languages`，router 未显式传 `languages` 时自动取用（详见[语言清单与启用](#语言清单与启用)）。

## 基于多语言字典（i18n 插件）

> 完整机制与指令文档见 [x-locales 字典声明](../directives/x-locales.md)；本节按特性速览，形态细节以指令文档为准。

### 启用与配置

加载 `autospark.i18n.js`（须早于 `new AutoSpark()`——参与首编译的注册晚到不被已编译树识别），并在 engine 构造第三参声明 `options.i18n`：

```js
<script src="/autospark/autospark.js"></script>
<script src="/autospark/autospark.i18n.js"></script>
<script>
    const engine = new AutoSpark("#app", {}, {
        i18n: {
            language: "zh-CN",   // 当前语言初值（$.language 未设置时注入）
            default: "zh-CN",    // 字典键的书写语言（仅元数据）
            fallback: "en",      // 二级回退语言
            languages: [/* 语言清单，与路由方式共用 */],
            messages: {          // 全局字典层（最低优先级）
                "提交成功": { "en": "Saved" },
            },
        },
    });
</script>
```

未装插件时模板里的 `t(...)` 走引擎内置兜底（恒等 + 插值）——不报错、平滑降级。

<demo html="locales/config.html"/>

### 字典声明（三源）

字典有三条声明通道，查表按**就近覆盖**——子层命中即收口：

| 通道 | 层级 | 适用 |
| --- | --- | --- |
| `x-locales="{...}"` | 自身作用域 | 元素级补充覆盖（Compile 静态，编译期求值一次） |
| `<script type="autospark/locales">` | 最近祖先作用域；顶层游离自动全局；`global` 属性显式全局 | 大字典声明（JS 对象字面量） |
| `options.i18n.messages` | 全局层（最低） | 应用级字典 |

字典形态：**以默认语言原文为键**、语言码为子键，值 = 译文串或复数数组（注意与 vue-i18n 按 locale 分组的 `{en:{key:val}}` 形态不同）。同作用域内 `x-locales` > script 块（后声明覆盖同键）。查表按**分层语言链**：同 key 同语言近层胜，近层缺的语言由远层补——**组件只内置部分语言包时，使用处可在消费容器上用 `x-locales` 注入其他语言**（详见 [x-locales 字典声明](../directives/x-locales.md#为组件补充语言包)）。

<demo html="locales/three-sources.html"/>

### t() 实时响应式翻译

`t()` 是全局翻译函数，**任意绑定表达式可用**——插值、`:attr`、`x-text`、`@click` 事件表达式通吃：

```html
<span x-text="t('提交成功')"></span>
<button :title="t('保存')">...</button>
<button @click="msg = t('已删除{}条', count)"></button>
```

**实时响应式**是字典方式的核心特性：`t()` 内部读 `$.language` 走响应式代理，经表达式依赖收集自动入集——**写 `$.language` 即全页翻译原地刷新**，无重载、无网络请求：

```html
<button @click="$.language = 'en'">English</button>
```

<demo html="locales/t-reactive.html"/>

### 插值与复数

- 插值：`{}` 位置参数 / `{name}` 命名参数，与 `params` 工具同语义；
- 复数：翻译值为**数组**即复数模式——第一个数字参数（或第一个 `$` 数字变量）选下标 `clamp(floor(n), 0, 长度-1)`，无数字取末项；数字/`$` 变量同时照常参与插值；

```html
<div x-locales="{ '我有{}辆车': { 'en': ['I have no car', 'I have one car', 'I have {} cars'] } }">
    <!-- n=0 → "I have no car"；n=1 → "I have one car"；n=5 → "I have 5 cars" -->
    <span x-text="t('我有{}辆车', n)"></span>
    <!-- 命名通道：{$count} 变量兼作复数选择器与插值 -->
    <b x-text="t('{name}有{$count}辆车', { name: '张三', $count: 1 })"></b>
</div>
```

<demo html="locales/plural.html"/>

### 回退链

查不到译文时按序回退：当前语言全等 → 主子标签（`zh-TW` 命中 `zh-CN` 键）→ `fallback` 全等 → `fallback` 主子标签 → **返回原文键本身**（键也照常插值）。命中失败在开发环境告警一次（按 key 去重），零配置时不告警。

<demo html="locales/fallback-chain.html"/>

### 示例

三源声明 + 三语言切换 + 复数联动（`n−−`/`归零`/`n++` 调节演示 0/1/≥2 三种复数形态）：

<demo html="locales/basic.html"/>

## 基于路由方式（router 语言机制）

静态多语言站点的典型诉求：**同一路由路径、按语言取不同内容文件**（`/a/home.html` ↔ `/a/home_zh-CN.html`）。router 内置多语言内容通道：声明一次语言清单，视图、路由表等内容请求自动按当前语言重写 URL，切换语言即重载当前路由——路由路径语言无关，本地化落点收敛到内容 URL 一处。

| 能力 | 说明 |
| --- | --- |
| 语言清单 | `options.i18n.languages` 非空即启用 |
| URL 重写 | 视图与路由表按内置文件名后缀规则重写，或由钩子完全接管 |
| 语言解析 | `'auto'` 按浏览器语言三级匹配；`$.language` 恒为具体 code |
| 切换 | 赋值 `$.language` 即触发完整导航管线重入（不写历史） |
| 缓存隔离 | 数据缓存与 keepAlive 自动按语言隔离 |

### 语言清单与启用

清单**唯一源是 engine 的 `options.i18n.languages`**（与字典方式同一处声明）：

```js
const engine = new AutoSpark(host, {}, {
    i18n: {
        languages: [
            { code: "en", name: "English", nativeName: "English" },   // languages[0] 为默认语言
            { code: "zh-CN", name: "简体中文", nativeName: "中文" },
        ],
    },
    routes: [/* ... */],
});
```

声明位置按挂载方式二选一（显式传入优先）：

- 直接创建 router：`new AutoSparkRouter(host, { languages: [...], ... })` 显式传入；
- 经 router 插件挂载：清单写在 `options.i18n.languages`，挂载时自动传递给 router。

`languages` 非空即启用多语言；空/缺省时整套机制关闭（不重写、不注入 `$.language`）。清单项字段：`code` 为完整 BCP 47 连字符风格标签（重写后缀原样使用）；`name` / `nativeName` 为切换 UI 展示元数据，运行时不消费。

::: tip 兼容旧顶层键
ADR-0136 之前清单声明在顶层 `options.languages`，该写法仍被接受（优先级高于 `i18n.languages`）——存量应用零迁移；新项目统一写 `options.i18n.languages`。
:::

<demo html="router/language-resolve.html"/>

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

<demo html="router/language-resolve.html"/>

### 内置 URL 重写规则

未提供钩子时（见下文 [getLanguageUrl 钩子](#getlanguageurl-钩子)），按通道矩阵重写：

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

<demo html="router/language.html"/>

### 切换语言

对 `$.language` 赋值即切换——触发**完整导航管线重入**当前路径：守卫、`navigation:*` 事件、加载与渲染全按既有语义重跑：

```js
// 推荐写法：$ 容器根引用替换——嵌套直写（state.$.language = code）不通知
// autostore 的 $.language 路径订阅（router 内部写入同样做根回写兜底）
engine.store.state.$ = { ...engine.store.state.$, language: "zh-CN" };
```

语义边界：

- **不写 history**：地址栏不变、不产生历史记录，刷新页面回到初始语言（`auto` 则回浏览器语言）；
- **同值赋值无效果**（如切回当前语言）；
- 赋值不在清单中的值会在控制台 warn 并回退原值。

切换期间的数据缓存与 keepAlive 视图按新语言重新取数（见下节），已加载状态全部重置。

<demo html="router/language.html"/>

### 缓存隔离

默认 hash 模板自动并入当前语言（`{url}` → `{url}@{language}`），因此**数据缓存与 keepAlive 自动按语言隔离**，零额外配置——切回旧语言命中旧语言的缓存，切到新语言重新加载。

::: warning 自定义 hash 须自行纳入
路由项显式声明 `hash` 模板时不含语言分量，须按语言隔离缓存的应用自行纳入（如 `hash: "{url}-{$language}"`），否则不同语言共享同一视图实例。
:::

<demo html="router/language-data.html"/>

### getLanguageUrl 钩子

内置规则不满足（如路径前缀式 `/en/products`、按目录分语言）时，提供 `getLanguageUrl` 钩子**完全接管**三通道——默认矩阵不再兜底（默认语言豁免、data 不重写等均由钩子自行分流）：

::: warning 钩子声明位置
钩子是**路由配置面**的键——直接创建 router 时写在 options 顶层；经 engine options 挂载时须写在 **`routes` 配置对象内**（与 `mode`/`base` 同级）。写在 engine options 顶层不经挂载矩阵透传，钩子会被静默丢弃。
:::

```js
const engine = new AutoSpark(host, {}, {
    i18n: { languages: [{ code: "en" }, { code: "zh-CN" }] },
    routes: {
        // 提供钩子 = view / data / routes 三通道完全接管
        getLanguageUrl: (language, url, type) => {
            if (language.code === "en") return url;              // en 免重写
            if (type === "data") return url;                     // API 不参与语言重写
            return url.replace(/(\.\w+)?$/, `_${language.code}$1`);
        },
        routes: [/* ... */],
    },
});
```

钩子参数：

| 参数 | 含义 |
| --- | --- |
| `language` | 目标语言清单项（`{ code, name?, nativeName? }`） |
| `url` | 待重写 URL——视图/数据通道为**参数插值后、base 前缀前**的具体 URL |
| `type` | 内容通道：`'view'` / `'data'` / `'routes'` |

**返回 `null` 或 `undefined` = 该次不重写、直接用原 URL**（而非回退内置规则）——这是钩子模式下的唯一逃生口。

<demo html="router/language-data.html"/>

### 规划中

`localStorage` 持久化与 `<link rel="alternate" hreflang>` 输出在规划中，当前版本如需请自行实现（监听 `navigation:end` + 写 `<head>`）。

### 示例

以下 demo 中 `en` 均为默认语言（免重写），且未预置语言（视同 `'auto'`）——**初始语言由浏览器语言解析决定**，中文浏览器打开即是 `zh-CN`。

**视图重写**：切换到 `zh-CN` 后视图请求自动重写为 `lang-home_zh-CN.html`，`$language` 与 `document.lang` 同步更新；切回 `en` 时命中默认语言的视图缓存：

<demo html="router/language.html"/>

**数据本地化**：默认矩阵下 data 通道不重写，提供 `getLanguageUrl` 钩子后由钩子分流——视图共用一份，数据文件按语言取 `profile.json` ↔ `profile_zh-CN.json`。切换语言时导航重入、数据缓存键含语言分量，新语言自动重新取数：

<demo html="router/language-data.html"/>

**本地化路由表**：路由表以字符串形态声明（fetch 该 URL）。启动时先解析语言（早于路由表加载），`routes` 通道走内置后缀规则——中文环境请求 `routes_zh-CN.json`、英文环境请求 `routes.json`，两表路径相同、仅 `title` 等元数据不同。注意路由表仅在启动时按已解析语言加载一次：切换语言不重新加载路由表（`$route.title` 保持初始语言），刷新页面回浏览器语言重新解析：

<demo html="router/language-routes.html"/>

## 最佳实践

### 按场景选型

- **组件开发 → 字典方式**。组件是自包含单元：字典随模板声明（`x-locales` / script 块），随组件分发、不依赖路由存在，`t()` 在任意表达式可用；组件消费方无需为组件单独维护内容文件。官方插件（如未来的通知/按钮文案）均走此方式。
- **静态站点内容 → 路由方式**。页面级内容（文章、营销页、表单流程）本地化天然是「按语言一份文件」：默认语言免重写保证既有 URL 可寻址，浏览器语言自动解析免手动选择，`getLanguageUrl` 钩子兜住任意部署形态（路径前缀式、目录分语言）。

### 结合使用

两种方式共用 `$.language` 单一真相，典型的组合形态是**路由管页面、字典管组件**：

- 路由方式负责页面骨架与内容文件的本地化（切换即重入导航取对应语言文件）；
- 重入后的页面内，组件文案由字典承接——页面模板里的 `t()` 绑定在导航重入重编译后按当前语言首渲，页面内再切语言则原地刷新；
- 清单只声明一次（`options.i18n.languages`），两侧自动对齐——这也是清单收敛为唯一源的动机：避免「router 一份、i18n 一份」的清单漂移。

### 注意事项

- **加载顺序**：`autospark.i18n.js` / `autospark.router.js` 都须早于 `new AutoSpark()`（选择性引入契约——参与首编译的注册晚到不被识别）。
- **切换语义差异**：字典切换是原地重渲染（轻、无请求）；路由切换是导航重入（重取内容、缓存重置）——页面内高频交互文案不要放内容文件。
- **路由表只按启动语言加载一次**：切换语言不重新加载本地化路由表，需动态路由表标题的场景监听语言变化自行处理。
- **数据 API 不参与内置重写**：接口语言语义（`Accept-Language` / 查询参数）由应用在 `getLanguageUrl` 钩子或请求层自行处理。
