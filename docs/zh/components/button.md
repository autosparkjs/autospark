# Button 按钮

## 概述

Button 是 AutoSpark 的官方按钮组件：**形态（type）与语义色（color）正交组合**，覆盖主/次/虚线/文本/链接五种形态 × 五种语义色，并支持图标、加载、禁用、幽灵、块级、圆形、纵排标签、备注、标签组、菜单项、可勾选、点击涟漪、汉字空格等完整特性面。

组件全盘消费 `@autospark/theme` 语义变量（`--auto-*` 三级回退链，ADR-0129）——调节主题色、切换暗色、换尺寸/圆角档位**即时生效**，且不设组件级尺寸属性（字号/圆角/间距全跟随主题档位）。每个示例右侧均带**主题控制面板**，可现场验证联动。

## 快速入门

引擎之后加载组件脚本即注册完成，宿主元素经 `x-component` 实例化：

```html
<script src="autospark.js"></script>
<script src="autospark.button.js"></script>

<button x-component:autospark.button="{ label: '主要按钮' }"></button>
```

<demo html="components/button/basic.html"/>

## 指南

### 形态（type）

**类型**: `primary | secondary | dashed | text | link`

**默认**: `primary`

决定按钮的外观形态：`primary` 实底主按钮、`secondary` 次级底、`dashed` 虚线描边、`text` 纯文本（透明底）、`link` 链接样式（零内距、悬停下划线）。形态只管「长相」，颜色语义归 `color` 属性。

<demo html="components/button/type.html"/>

### 语义色（color）

**类型**: `primary | success | warning | danger | info`

**默认**: `primary`

语义色取 theme 的 `--auto-*-color` 变量，可与任意形态自由组合（如危险虚线钮、成功链接钮）。勾选态（checkable）、幽灵（ghost）等特性的取色同样跟随当前 color。

<demo html="components/button/color.html"/>

### 图标（icon）

**类型**: `string`

**默认**: `''`（无图标）

图标名，经 `x-icon` 指令渲染（内置图标表或全局注册的图标均可）。图标尺寸跟随字号档位（默认 1em），颜色继承按钮内容色；`loading` 开启时被加载图标替换。

<demo html="components/button/icon.html"/>

### 加载状态（loading）

**类型**: `boolean`

**默认**: `false`

加载态：左图标位替换为转圈图标（自带 SMIL 动画、无需额外样式），同时按钮**禁点**（光标 progress、视觉不淡化——loading 优先于 disabled 的视觉呈现）。常由外层异步状态驱动。

<demo html="components/button/loading.html"/>

### 禁用（disabled）

**类型**: `boolean`

**默认**: `false`

禁用按钮：视觉淡化 + 不可点击。同步为宿主原生 `disabled` 属性——表单提交、焦点、键盘激活全链路禁用。

<demo html="components/button/disabled.html"/>

### 幽灵（ghost）

**类型**: `boolean`

**默认**: `false`

幽灵按钮：背景透明、内容与描边取当前 color 的语义色，常用在有色背景上。可与任意形态、语义色组合。

<demo html="components/button/ghost.html"/>

### 装饰边框（border）

**类型**: `boolean`

**默认**: `false`

装饰性附加边框开关。只落在本身无边的形态上（secondary / text 等）——`dashed` 的虚线与 `ghost` 的语义色描边是形态固有视觉，不受此开关控制。边框颜色消费 `--auto-border-color`。

<demo html="components/button/border.html"/>

### 块级（block）

**类型**: `boolean`

**默认**: `false`

使按钮适配父宽度（`width: 100%`）。多个 block 按钮并排时按父容器均分。

<demo html="components/button/block.html"/>

### 内容对齐（align）

**类型**: `left | center | right`

**默认**: `center`

按钮**内部内容**的水平对齐，在 block 等宽内容时可见效果；按钮自身在页面中的定位交由父级布局。

<demo html="components/button/align.html"/>

### 形状（shape）

**类型**: `default | circle`

**默认**: `default`

`circle` 圆形按钮：纯图标用法呈正圆（须显式 `label: ''`，label 默认「按钮」非空会占位）；带文字时自动降级为胶囊形（不报错、不静默忽略）。圆角档位对 circle 无效（恒胶囊半径）。

<demo html="components/button/shape.html"/>

### 纵排标签（labelBelow）

**类型**: `boolean`

**默认**: `false`

将 label 显示在图标下方（纵排布局），工具栏 / 画布操作区常用形态。可与 memo（备注在 label 正下方）组合。

<demo html="components/button/label-below.html"/>

### 备注（memo）

**类型**: `string`

**默认**: `''`（无备注）

显示在 label 下方的注释文本：小一号（0.75em）且淡化（按内容色 color-mix 派生——实底上呈淡白、透明底上呈淡灰）。

<demo html="components/button/memo.html"/>

### 标签组（tags）

**类型**: `{ icon?: string, tooltip?: string, name?: string }[]`

**默认**: `[]`

在按钮最右侧渲染一组小一号的圆形小按钮，具有独立的点击事件（冒泡 `tag-click`，携带 `name`——详见「事件」）。tag 背景按按钮内容色派生（实底上呈淡白、透明底上呈淡灰、幽灵上呈淡语义色），与按钮主背景形成色差；`tooltip` 走原生 title 悬停提示。

::: warning
**嵌套对象 / 数组 props（tags、ripple 的对象形态）必须放外层状态再路径引用**（`tags: myTags`、`ripple: myRipConf`）——props 字面量嵌套值存在引用比较层面的更新环缺陷（引擎侧修复中），**字面量写法会死锁页面**；原始值（布尔 / 字符串 / 数字）与路径引用不受影响。
:::

<demo html="components/button/tags.html"/>

### 菜单形态（menu）

**类型**: `boolean`

**默认**: `false`

将按钮整体呈现为菜单项：占满容器宽、透明底、内容左对齐、悬停淡底。可与 `checkable` 组合做可勾选菜单项（勾选态呈左竖条 + 淡色底，消费 `--auto-selected-*` 变量）。

<demo html="components/button/menu.html"/>

### 可勾选（checkable / value）

**类型**: `checkable: boolean`、`value: boolean`

**默认**: `false` / `false`

`checkable` 开启勾选模式：点击**自动翻转** value 并冒泡 `change` 事件；`value` 为 true 时使用与当前 color 匹配的背景色。表单集成走「受控半双工」——显示方向经 props 单向注入响应，翻转方向经 change 冒泡回写：

```html
<span @change="picked = $event.detail.value">
    <button x-component:autospark.button="{ checkable: true, value: picked, label: '仅看优惠' }"></button>
</span>
```

> engine 无自定义组件双向绑定协议（x-model 对非表单元素静默按 text 分型），两行即得双向是最简官方通道——详见 ADR-0012 决策 3。

<demo html="components/button/checkable.html"/>

### 点击涟漪（ripple）

**类型**: `boolean | object`

**默认**: `false`

`ripple` 就是 [`x-ripple`](../guide/directives/x-ripple.md) 的 props 值：`false`（默认）不启用；`true` 以缺省配置 **`{ trigger: "click", inside: true }`** 挂载——点击时自点击点在按钮内部铺开（圆角跟随、连点取消重起），播一个完整周期自止。传对象即最终配置、全键可覆盖缺省（**对象须放外层状态路径引用**，见下方警示）：

- **触发器 `trigger`**：`click`（缺省，点击播一个周期）/ `always`（始终循环播放）/ `hover`（悬停播放、移出播完即停）
- **动画形态 `type`**：`inside`（缺省，按钮内部铺开）为独立键；`inside: false` 切换为外扩族——`echo` 双环回声 / `ring` 单环外扩 / `glow` 光晕呼吸（inside 与外扩形态互斥）
- **视觉参数**：`color` / `speed` / `size` / `gap` / `badge` 等全部键面透传（完整词表见 x-ripple 指令文档）

经 ADR-0010 运行时挂载契约动态生效；**需页面已加载 `autospark.ripple.js`**——未加载时静默跳过，按钮功能不受影响。

<demo html="components/button/ripple.html"/>

### 汉字空格（autoInsertSpace）

**类型**: `boolean`

**默认**: `true`

label 恰为**两个汉字**时自动在中间插入空格（「提交」→「提 交」，双字按钮视觉更均衡）；设为 `false` 关闭。三字及以上不受影响。

<demo html="components/button/auto-insert-space.html"/>

### 事件

组件默认封闭（宿主上的表达式在组件域求值），事件经**冒泡**到外层消费——绑定写在组件外的包裹元素上：

| 事件 | detail | 触发时机 |
| --- | --- | --- |
| `change` | `{ value }` | checkable 点击翻转后 |
| `tag-click` | `{ name, tag }` | tags 小圆钮点击（已阻断宿主翻转与点击） |

<demo html="components/button/events.html"/>

## 参考

### 属性

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| type | `primary \| secondary \| dashed \| text \| link` | `primary` | 形态（实底 / 次底 / 虚线 / 文本 / 链接） |
| color | `primary \| success \| warning \| danger \| info` | `primary` | 语义色（与任意形态组合） |
| label | `string` | `"按钮"` | 兜底文案（插槽无内容时显示） |
| icon | `string` | `''` | 图标名（x-icon 渲染；loading 时被替换） |
| loading | `boolean` | `false` | 加载态：图标位转圈并禁点 |
| disabled | `boolean` | `false` | 禁用（同步宿主原生属性） |
| ghost | `boolean` | `false` | 幽灵：透明底、语义色内容 |
| border | `boolean` | `false` | 装饰性附加边框（默认无） |
| block | `boolean` | `false` | 适配父宽度 |
| align | `left \| center \| right` | `center` | 内容水平对齐 |
| shape | `default \| circle` | `default` | 圆形（带文字自动胶囊） |
| labelBelow | `boolean` | `false` | label 显示在图标下方 |
| memo | `string` | `''` | label 下方备注（小一号、淡化） |
| tags | `{icon?, tooltip?, name?}[]` | `[]` | 右侧小圆钮组（点击冒泡 tag-click） |
| menu | `boolean` | `false` | 菜单项形态 |
| checkable | `boolean` | `false` | 可勾选模式（点击翻转 value） |
| value | `boolean` | `false` | 勾选值（checkable 模式） |
| ripple | `boolean \| object` | `false` | x-ripple props 值透传：true ≡ `{ trigger: "click", inside: true }`，对象全键可覆盖（trigger / type / color / speed…；需加载 autospark.ripple.js） |
| autoInsertSpace | `boolean` | `true` | 两汉字 label 自动插空格 |

### 事件

| 事件 | detail | 说明 |
| --- | --- | --- |
| change | `{ value: boolean }` | checkable 点击翻转后冒泡；表单同步惯用法 `@change="flag = $event.detail.value"` |
| tag-click | `{ name: string, tag: object }` | tags 小圆钮点击冒泡；tag 元素已 stopPropagation，不触发宿主翻转 |
| click | 原生事件 | 原生冒泡点击，外层包裹元素直接 `@click` 消费 |

### Slots

| 插槽 | 说明 |
| --- | --- |
| default | 按钮文字内容。提供插槽内容时覆盖 `label` 兜底文案（可含任意行内标记）；未提供时显示 label。变体数据属性（对齐/纵排等）不受插槽影响 |

```html
<!-- 插槽内容覆盖 label -->
<button x-component:autospark.button="{ type: 'primary' }"><b>加粗</b>插槽内容</button>
```
