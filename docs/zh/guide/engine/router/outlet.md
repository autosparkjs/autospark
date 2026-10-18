---
title: 路由出口
---

# 路由出口

## 关于

路由出口（`autospark.outlet`）是一个 engine 组件，是**匹配视图的挂载点**。router 渲染层把每层匹配路由的视图写入所在层级的出口数据域，由出口负责编译激活、缓存复用、加载态显示。

出口维护一个 append-only 的**视图清单**（`{hash, url, title, html, ready}` 条目 + `active` 指针）：缓存视图离开时不销毁（DOM 常驻、`x-show` 隐藏），切回时原样复用——表单输入等运行态得以保留。

## 指南

### 声明出口

出口有两种等价写法：

```html
<!-- 简写（推荐）：等价糖衣，值透传为 props -->
<div x-outlet></div>
<div x-outlet="{ keepAlive: true, mode: 'tabs' }"></div>

<!-- 完整形态 -->
<div x-component:autospark.outlet></div>
<div x-component:autospark.outlet="{ keepAlive: true }"></div>
```

两种写法的生效场景不同：

| 场景 | 简写可用性 |
| --- | --- |
| **插件自举**（构造第三参声明 `routes`） | 可用——router 在宿主首编译前自动把简写改写为完整形态 |
| **远程视图模板** | 可用——渲染器在编译前对远程 HTML 做同样的预处理 |
| **直接装配**（`options.engine` 注入自建 engine） | 不可用——静态模板已编译，错过预处理，须写完整形态 |

::: tip 默认出口
插件自举时，宿主模板中**没有任何出口声明**的话，router 会在首编译前自动补一个 `<div x-outlet>`——最简单的应用连出口都不用写。
:::

### 嵌套出口

每层路由对应一个出口。父层视图（布局）内部再声明出口，子路由视图就渲染在那里：

```html
<!-- views/layout.html：父层视图 -->
<aside>侧边栏（子路由切换时保持不动）</aside>
<main x-outlet></main>
```

```json
{
    "path": "/",
    "view": "/views/layout.html",
    "children": [
        { "path": "home", "view": "/views/home.html", "default": true },
        { "path": "user/:id", "view": "/views/user.html" }
    ]
}
```

导航到 `/user/123`：`layout.html` 渲染进根出口，`user.html` 渲染进 layout 内部的出口。某层没有更深的子路由渲染进来时，该出口保持空转（不显示 loading）。

<demo html="router/nested.html"/>

### 出口 props

出口组件接受两个 props（经简写值或完整形态值注入）：

| prop | 默认 | 说明 |
| --- | --- | --- |
| `keepAlive` | `false` | 本出口内**未显式声明** `keepAlive` 的路由，是否默认缓存视图 |
| `mode` | `"stack"` | `stack` 堆叠模式（默认）或 `tabs` 页签模式 |

缓存优先级：出口 `mode="tabs"`（全视图常驻）> 路由项 `keepAlive` 显式声明 > 出口 `keepAlive` prop。详见[缓存](./cache.md)。

```html
<div x-outlet="{ keepAlive: true }"></div>
```

### 页签模式

`mode="tabs"` 时出口内建页签条，多页签并存、全视图常驻（类似浏览器多标签页）：

```html
<div x-outlet="{ mode: 'tabs' }"></div>
```

行为要点：

- 页签标题取路由 `title`，缺失时回退视图 hash
- 点击页签走 router 导航（URL 是唯一真相源）
- 页签可关闭：关闭即销毁该视图缓存；关闭当前激活页签时自动导航到相邻页签；仅剩一个页签时不显示关闭按钮
- tabs 模式下全部视图常驻，临时视图通道不启用

<demo html="router/outlet-tabs.html"/>

页签条样式可整体定制：组件注册时注入内建样式表（元素 id 为 `autospark-outlet-styles`），应用**提前注入同 id 样式表即可整体替换**；也可用 CSS 自定义属性（`--autospark-outlet-tab-*`）与 `.autospark-outlet-tab` 等类钩子做局部覆盖：

```css
:root {
    --autospark-outlet-tab-active-color: #722ed1;
    --autospark-outlet-tab-active-bg: #f9f0ff;
    --autospark-outlet-tab-radius: 8px 8px 0 0;
}
```

### 渲染细节

出口对视图内容分两条通道处理：

- **模板视图**（默认）：经 `x-html.compile` 编译激活——远程 HTML 中的 `x-*` 指令、嵌套 `x-outlet` 全部生效
- **raw 视图**（`!` 前缀或降级产生，条目带 raw 标志）：普通 `x-html` 直接 innerHTML 挂载——不经编译，其中 `x-*` 指令不激活、`script` 不执行、`x-outlet` 不生效（性能旁路）

内容未就绪时出口呈现 x-loading 门控加载遮罩（覆盖视图区域）；加载失败或 URL 未匹配时呈现内建错误块（状态码 + 重试/返回动作），详见[错误呈现与重试](./error-presentation.md)。

### 定制出口组件

出口是普通 engine 组件。应用可在 engine 构造 `options.components` 中**预注册同名组件**（`autospark.outlet`）——router 检测到既有声明时跳过注册，你的定制不被覆盖：

```js
const engine = new AutoSpark(host, {}, {
    components: {
        "autospark.outlet": `<div x-define="autospark.outlet" data-autospark-outlet>
            <!-- 自定义出口模板，数据域契约见下 -->
        </div>`
    },
    routes: [/* ... */]
});
```

::: warning 数据域契约
自定义出口组件须遵守内建出口的数据域契约（`views` 视图清单 / `ephemeral` 临时视图槽 / `active` 激活 hash / `mode` / `keepAlive` props），宿主元素须带 `data-autospark-outlet` 标记（router 查找出口的锚点）。
:::
