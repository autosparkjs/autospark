# Alert 警示条

## 概述

Alert 是 AutoSpark 的官方页内警示条组件（组件库 P0 轻件 / **feedback 分类首件**，ADR-0019）：语义色五档（`type`）、标题/描述（`title` / `description`，描述可由默认插槽替换）、关闭（`closable`）、图标（`icon` 覆盖或按 type 映射内置图标）、边缘通栏形态（`banner`）。

**语义色基线的首个非 button 落地**：`--asc-tone` 中转变量 + 内层 `data-type` 变体属性经 `:has()` 反驱宿主——与 button（ADR-0012）同款组织方式，本件验证该范式在全库的可复制性；警示条形态 = 语义色淡底（tone 10%）+ 半透明语义色边框（tone 38%）+ 标题/图标取语义色、描述取正文色。色值全部走 `--auto-*` 语义变量三级回退链（ADR-0129），theme 切换 / 暗色即时跟随。

**与 x-error 指令的边界**：x-error 是 error 事件通道的**就近消费**（行为指令——捕获子树运行时错误并呈现，含 overlay/addErrorClass 等行为）；alert 是**静态展示组件**——内容（title / description）全部使用者传入，不监听 error 通道。动态错误呈现用 x-error，静态警示条用 alert，两者正交不互相替代。

无内置文案、不接 i18n（title / description 均使用者传入）；字号档位经主题通道 `data-size` 全跟随（无自有字号属性，button 同范式）。

引入方式：引擎之后加载 `<script src="/autospark/autospark.alert.js"></script>`（自举注册），或聚合产物 `autospark.plugins.js`。

## 快速入门

```html
<script src="autospark.js"></script>
<script src="autospark.alert.js"></script>

<div x-component:autospark.alert="{ title: '警告', description: '注意：当前配置将在发布后生效。', type: 'warning' }"></div>
<div x-component:autospark.alert="{}">仅描述（默认插槽）</div>
```

<demo html="components/feedback/alert/basic.html"/>

## 指南

### 语义色（type）

**类型**: `success | warning | danger | info | default`
**默认**: `default`

五档语义色，对齐 button 语义色 CSS 变量体系（`--auto-success-color` / `--auto-warning-color` / `--auto-danger-color` / `--auto-info-color`）：`success` 成功 / `warning` 警告 / `danger` 危险 / `info` 信息 / `default` 中性（缺省，正文色淡底）。淡底与边框由语义色经 `color-mix` 派生（单源 `--asc-tone`，使用者只需覆盖一个变量即可整体换色）。

### 标题（title）

**类型**: `string`
**默认**: `""`

标题文案（语义色 + medium 字重）。空则不渲染标题行——仅描述的警示条同样成立。

### 描述（description）

**类型**: `string`
**默认**: `""`

描述文案（标题下方、正文色）。**默认插槽内容优先于 description 兜底**——插槽可传富内容（加粗片段、链接等）替换纯文案描述。

### 图标（icon）

**类型**: `string | { name: string } | false`
**默认**: `""`

图标位渲染在标题/描述左侧（1.25em、语义色）。缺省（空）按 type 映射内置图标：`success→success` / `warning→warn` / `danger→error` / `info→info` / `default→bell`；传图标名或 `{ name }` 对象覆盖映射；`false` 关闭图标位。图标经 engine 内置 `x-icon` 指令渲染（零额外引入）。

### 关闭（closable）

**类型**: `boolean`
**默认**: `false`

渲染右端关闭图标。点击后：内部 `closed` 置位 → 宿主挂 `data-closed` 属性（CSS `display: none` 隐藏；属性驱动而非直接内联——使用者可经自定义 CSS 接管关闭动画）→ 广播 `close` 事件；原生 click 冒泡被阻断（不误触外层点击域）。`closed` 亦可由外部状态注入驱动（重开通道：置回 `false` 摘属性恢复显示）。

### 通栏形态（banner）

**类型**: `boolean`
**默认**: `false`

边缘通栏形态：圆角清零、满宽贴容器边缘（页面顶部公告常用）。可与 type / closable 自由组合。

### 主题化

语义色走 `--auto-*-color` 语义变量（theme 在场自动换肤）；字号档位经主题通道 `data-size` 全跟随；暗色：容器裸挂 `data-dark`。使用者覆盖通道 `--asc-alert-*`（如 `--asc-alert-success` 某档语义色、`--asc-alert-radius` 圆角、`--asc-alert-padding` 内距）。

## 参考

### 属性

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| type | `success \| warning \| danger \| info \| default` | `default` | 语义色五档（中性缺省） |
| title | `string` | `""` | 标题文案（空则不渲染标题行） |
| description | `string` | `""` | 描述文案（默认插槽内容优先） |
| closable | `boolean` | `false` | 关闭按钮（closed 置位隐藏 + close 事件冒泡） |
| icon | `string \| { name: string } \| false` | `""` | 图标覆盖；空 = 按 type 映射内置图标；`false` 关闭 |
| banner | `boolean` | `false` | 通栏形态（无圆角满宽） |
| closed | `boolean` | `false` | 关闭态（内部状态；外部状态注入兼作重开通道） |

### 事件

| 事件 | 说明 |
| --- | --- |
| close | 关闭图标点击冒泡（detail 为空；closed 已置位、宿主已隐藏） |

### Slots

| 插槽 | 说明 |
| --- | --- |
| 默认 | 描述内容（优先于 description 兜底；富内容可传） |

> 对象形态 props（如 `icon: { name }`）经**状态引用**注入（引擎对值对象内的字面量对象 props 存在已知缺陷，button tags / text copyable 同款规避）。
