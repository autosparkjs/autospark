# autospark.alert 警告条

## 概述

`autospark.alert` 为页面提供**常驻语义警告条**——标题 + 描述两行布局、四种语义色（`info` / `success` / `warning` / `danger`）、可选左侧图标、可关闭（点击收起，父组件状态可控制重新显示）。适用于操作反馈、风险提示、错误告知等横幅场景；轻量浮出的 toast 通知请改用[通知](../engine/notifications/)。

```html
<div x-component:autospark.alert="{ type: 'warning', title: '注意警告', description: '当前操作存在风险，请确认后继续。' }"></div>
```

::: tip 插件组件
`autospark.alert` 由官方插件包 `@autospark/plugins` 以组件插件形态提供（engine 侧零改动），使用前须加载插件脚本（与引擎的先后次序不限——预加载队列兜底双时序）：

```html
<script src="/autospark/autospark.js"></script>
<script src="/autospark/autospark.alert.js"></script>
```

也可一键挂载全部官方插件（含本组件）：`<script src="/autospark/autospark.plugins.js"></script>`。
:::

## 快速入门

<demo html="alert/basic.html"/>

```html
<div x-component:autospark.alert="{ type: 'info', title: '信息提示', description: '这是一条信息语义色的警告条。' }"></div>
```

props 以 `x-component` 的**值**注入（静态字面量 / 状态对象展开均可）；宿主化身组件根，`class` / `style` 照常属性继承。

## 指南

### 语义色（type）

`type` 选择语义色变体，缺省 `info`：

| type | 语义 | 主题变量（缺省校准值） |
| --- | --- | --- |
| `info` | 信息提示 | `--auto-info-color`（#71717a） |
| `success` | 操作成功 | `--auto-success-color`（#22c55e） |
| `warning` | 注意警告 | `--auto-warning-color`（#f59e0b） |
| `danger` | 错误危险 | `--auto-danger-color`（#ef4444） |

语义色驱动描边、浅色底与图标着色；加载 [theme 插件](../engine/theme/index.md)后随主题动态联动（含暗色模式），未加载时回退内置校准值。`type` 是响应式 props——绑定状态切换时外观即时跟随（见下方图标 demo 的切换按钮）。

### 标题与描述

内容区为**两行布局**：

- `title`：标题行，字重稍大（纯文本，`x-text` 渲染）；
- `description`：描述行，字号稍小、颜色弱化；缺省（空字符串）不渲染第二行，仅标题单行。

```html
<div x-component:autospark.alert="{ type: 'success', title: '仅标题' }"></div>
```

### 左侧图标（icon）

`icon` 三态控制左侧图标，缺省 `true`（按 `type` 取语义图标）：

| icon 值 | 语义 |
| --- | --- |
| `true` / 缺省 | 语义图标——`info` / `success` / `warning` / `danger` 分别渲染 info、success、warn、error 内置图标 |
| 字符串 | 自定义图标名（走 `x-icon` 图标域解析，含远程/自定义注册图标） |
| `false` | 关闭图标 |

<demo html="alert/icon.html"/>

### 关闭与重新显示（closable / open）

`closable` 开启右侧关闭钮（缺省 `false`，显式声明开启——与通知组件的常显约定不同，警告条是常驻内容）。点击 × 后警告条**整块收起**（不留空盒），同时向组件根派发冒泡的 `close` 自定义事件。

重新显示经 `open` 受控键实现：`open` 绑定父组件状态，转 `true`（含假→真翻转）时复位内部收起标记。推荐配套在**包裹元素**上监听 `@close` 同步父状态——此后「重新显示」就是一次普通的 `show = true` 赋值：

<demo html="alert/closable.html"/>

```html
<div x-data="{ show: true }" @close="show = false">
    <div x-component:autospark.alert="{ type: 'danger', title: '可关闭', closable: true, open: show }"></div>
</div>
<button @click="show = true">重新显示</button>
```

::: warning 事件监听位置
组件默认封闭——宿主上的表达式在组件域求值，见不到外层状态。`@close` 须写在**组件外的包裹元素**上（事件冒泡触发），不能写在实例化宿主自身。
:::

不绑 `open` 的非受控用法：点击 × 收起后，重新显示须移除再挂回宿主（如外层 `x-if` 翻转重挂）。

## 配置选项

props 经 `x-component` 值注入（缺省值见表；未知 `type` 回退基础外观）：

| props | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `type` | `'info' \| 'success' \| 'warning' \| 'danger'` | `'info'` | 语义色变体（响应式） |
| `title` | `string` | `''` | 标题行（纯文本；空则不渲染） |
| `description` | `string` | `''` | 描述行（纯文本；空则不渲染第二行） |
| `icon` | `boolean \| string` | `true` | 左侧图标：`true`=按 type 语义图标 / 字符串=自定义图标名 / `false`=关闭 |
| `closable` | `boolean` | `false` | 右侧关闭钮（点击收起并派发 `close` 事件） |
| `open` | `boolean` | `true` | 受控显隐键：绑定父状态后可控制显隐与重新显示（转 true 复位收起标记） |

组件事件：

| 事件 | 触发时机 | 载荷 |
| --- | --- | --- |
| `close` | 点击关闭钮（收起同时） | 无（`CustomEvent`，冒泡，监听写在外层包裹元素） |

## 注意事项

- **封闭域**：组件默认封闭，宿主上的表达式见不到外层状态——事件监听（`@close`）写在组件外的包裹元素上，点击经冒泡触发（同 [autospark.button](../plugin/index.md) 样板）。
- **收起不留空盒**：点击关闭后宿主整块 `display: none`（内层标记经 `:has()` 驱动），不残留空白占位。
- **重新显示通道**：`open` 转 `true` 复位内部收起标记；父状态已是 `true` 时直接再赋 `true` 不触发更新——推荐 `@close` 同步父状态为 `false`，此后置 `true` 即重显。
- **主题化**：三级回退链 `var(--auto-X, var(--asc-alert-X, 校准兜底值))`——theme 插件在场随主题联动（含 `[dark]` 暗色校准值），业务侧可经 `--asc-alert-*` 变量或同名类（`asc-alert` / `asc-alert-body` / `asc-alert-title` / `asc-alert-description` / `asc-alert-close` 等）重载。
- **覆盖通道**：业务侧 `options.components` 同名声明 `autospark.alert` 优先于插件全局表——整模板替换自定义，无继承家族负担。

---

下一步：插件开发方式见[插件开发](../plugin/index.md)；浮出式通知（toast / 确认 / 任务）见[通知](../engine/notifications/)。
