# Button 按钮

## 概述

Button 是 AutoSpark 的官方按钮组件：**形态（variant）与语义色（type）正交组合**，覆盖常规/主/次/虚线/文本/链接六种形态 × 五种语义色，并支持图标、加载、禁用、幽灵、块级、圆形、纵排标签、备注、标签组、尾部箭头（caret）、菜单项、可勾选（化身 checkbox 表单字段）、点击涟漪、汉字空格等完整特性面。**2-N 态循环切换**需求由 [`StateButton`](./state-button.md) 承接（ADR-0016——二元勾选在本组件、多态循环归 state-button）。

组件全盘消费 `@autospark/theme` 语义变量（`--auto-*` 三级回退链，ADR-0129）——调节主题色、切换暗色、换尺寸/圆角/间距档位**即时生效**，且不设组件级尺寸属性（字号/圆角跟随主题档位，内距以 `--auto-padding` 为基准——`data-spacing` 档位全局调节即时生效）。每个示例右侧均带**主题控制面板**，可现场验证联动。

## 快速入门

引擎之后加载组件脚本即注册完成，以元素名 `<x-button>` 直接使用——静态属性即 props（数字 / `true` / `false` / JSON 自动类型推断），`:key="expr"` 为响应式 props，子内容为默认插槽：

```html
<script src="autospark.js"></script>
<script src="autospark.button.js"></script>

<x-button variant="primary" label="主要按钮"></x-button>
<x-button variant="dashed" type="danger" label="危险虚线" disabled="true"></x-button>
<x-button icon="star" label="图标按钮"></x-button>
```

`class` / `style` / `id` / `data-*` 保留给宿主；事件监听（`@tag-click`）写在**外层包裹元素**上消费（组件默认封闭，事件经冒泡）；等价的指令值形态 `<button x-component:autospark.button="{ ... }">` 同样受支持。

<demo html="components/general/button/basic.html"/>

## 指南

### 形态（variant）

**类型**: `default | primary | secondary | dashed | text | link`

**默认**: `default`

决定按钮的外观形态：`default` 常规按钮（缺省形态，**面板实色底**、无边框——描边由 `border` prop 开关控制；与 `secondary` 以底色层次区分）、`primary` 实底主按钮、`secondary` 次级按钮（**次级淡底**，半透明叠加、更融入背景）、`dashed` 虚线描边、`text` 纯文本（透明底）、`link` 链接样式（零内距、悬停下划线）。形态只管「长相」，颜色语义归 `type` 属性。

<demo html="components/general/button/variant.html"/>

### 语义色（type）

**类型**: `primary | success | warning | danger | info`

**默认**: `primary`

语义色取 theme 的 `--auto-*-color` 变量，可与任意形态自由组合。**语义色背景须搭配实底形态**（`variant: 'primary'`）；其余形态下的呈现：`default`（缺省）配非 primary 语义色时呈**描边与文字**取色（如 `type: "danger"` 红边红字——此时描边是语义呈现而非 border 装饰；primary 语义色为缺省值豁免保持中性）、`dashed` 语义色虚线边与文字、`link` / `ghost` 语义色文字与描边。

<demo html="components/general/button/type.html"/>

### 图标（icon）

**类型**: `string | { name: string, size?: number | string, color?: string, strokeWidth?: number | string, padding?: number | string, shape?: none | circle | radius, button?: boolean, pointer?: boolean, rotate?: number | string, badge?: boolean | number | string }`

**默认**: `''`（无图标）

两种形态：

- **字符串**：图标名，经 `x-icon` 指令渲染（内置图标表或全局注册的图标均可）。尺寸跟随字号档位（默认 1em）、颜色继承按钮内容色；
- **对象**：`name` 必填（图标名），其余键即 **x-icon 选项**——按钮把 `size` / `color` / `strokeWidth` / `padding` / `shape` / `button` / `pointer` / `rotate` 经 `x-icon-options:<成员>` 逐键透传，行为与 [`x-icon` 指令](../guide/directives/x-icon.md)完全一致（含描边网格补偿、`shape` 底板包裹层、`rotate` 旋转动画）；选项随状态响应式热应用。另加按钮自有键 `badge`（右上角标，标量三形态：`true` 缺省板距 / 数字 px / 字符串 CSS 值，形态即启用，角标取 danger 语义色）。`loading` 开启时无论何种形态均被加载图标替换。

| 键 | 类型 | 等价 x-icon 写法 | 说明 |
| --- | --- | --- | --- |
| `name` | `string` | `x-icon="name"` | 图标名（必填） |
| `size` | `number \| string` | `x-icon-options="{size}"` | 数字 → px；字符串直传 CSS；缺省 `var(--auto-icon-size,1em)` |
| `color` | `string` | `x-icon-options="{color}"` | 覆盖继承色；同时联动 `shape` 底板浓板 |
| `strokeWidth` | `number \| string` | `x-icon-options="{strokeWidth}"` | 描边粗细（含网格补偿） |
| `padding` | `number \| string` | `x-icon-options="{padding}"` | 图形区外内距（`shape` 启用时落到底板包裹层） |
| `shape` | `none \| circle \| radius` | `x-icon-options="{shape}"` | 底板形态；包裹层自动创建 |
| `button` | `boolean` | `x-icon.button` | 图标按钮动效（hover/press，隐含手型） |
| `pointer` | `boolean` | `x-icon.pointer` | 手型光标 |
| `rotate` | `number \| string` | `x-icon-options="{rotate}"` | 旋转角度（number → deg，字符串直传 CSS；带 transition） |
| `badge` | `boolean \| number \| string` | —（按钮自有） | 右上角角标：`true` / 数字板距 px / 字符串 CSS 值 |

> `normalize` 是图标**注册期**的全局开关（`AutoSpark.icons.options.normalize`），不参与实例选项透传，故不在上表。

```html
<x-button icon="star" label="字符串形态"></x-button>
<x-button :icon="iconConf" label="对象形态"></x-button>
<!-- iconConf: { name: 'star', size: 24, color: '#f59e0b', strokeWidth: 2, rotate: 15 } -->
```

::: warning
icon 的**对象形态必须放外层状态再路径引用**（`:icon="iconConf"`）——与 tags / ripple 对象一样，props 字面量嵌套对象会触发引擎更新环缺陷死锁页面。
:::

<demo html="components/general/button/icon.html"/>

### 标签位置（labelPos）

**类型**: `left | right | top | bottom | none`

**默认**: `right`

label 在 icon 的哪侧（破坏性合并：原 `iconPlacement` 与 `labelBelow` 两属性移除，迁移动作 `icon-placement="end"` → `label-pos="left"`、`label-below="true"` → `label-pos="bottom"`）：

- `right`（默认）左图标右文字；`left` 图标移内容区末尾（横排右/纵排下），**并与 tags 互换**（caret 在场时图标居 caret 之前），loading 图标随行；
- `top` 文字在图标上方 / `bottom` 文字在图标下方（纵排）；
- `none` **不显示文字区**（label + memo + 插槽内容一并隐藏）——宿主无显式提示时 **label 文本自动转挂悬停提示**（tooltip 插件在场挂 `data-tooltip`、缺席挂原生 `title`，显式提示优先）。

<demo html="components/general/button/icon.html"/>

### 加载状态（loading）

**类型**: `boolean`

**默认**: `false`

加载态：左图标位替换为转圈图标（自带 SMIL 动画、无需额外样式），同时按钮**禁点**（光标 progress、视觉不淡化——loading 优先于 disabled 的视觉呈现）。常由外层异步状态驱动。

<demo html="components/general/button/loading.html"/>

### 禁用（disabled）

**类型**: `boolean`

**默认**: `false`

禁用按钮：视觉淡化 + 不可点击。同步为宿主原生 `disabled` 属性——表单提交、焦点、键盘激活全链路禁用。

<demo html="components/general/button/disabled.html"/>

### 幽灵（ghost）

**类型**: `boolean`

**默认**: `false`

幽灵按钮：背景透明、内容与描边取当前 type 的语义色，常用在有色背景上。可与任意形态、语义色组合。

<demo html="components/general/button/ghost.html"/>

### 装饰边框（border）

**类型**: `boolean`

**默认**: `false`

装饰性附加边框开关。只落在本身无边的形态上（secondary / text 等）——`dashed` 的虚线与 `ghost` 的语义色描边是形态固有视觉，不受此开关控制。边框颜色消费 `--auto-border-color`。

<demo html="components/general/button/border.html"/>

### 块级（block）

**类型**: `boolean`

**默认**: `false`

使按钮适配父宽度（`width: 100%`）。多个 block 按钮并排时按父容器均分。

<demo html="components/general/button/block.html"/>

### 内容对齐（align）

**类型**: `left | center | right`

**默认**: `center`

按钮**内部内容**的水平对齐，在 block 等宽内容时可见效果；按钮自身在页面中的定位交由父级布局。

<demo html="components/general/button/align.html"/>

### 形状（shape）

**类型**: `default | circle`

**默认**: `default`

`circle` 圆形按钮：纯图标用法呈正圆（须显式 `label: ''`，label 默认「按钮」非空会占位）；带文字时自动降级为胶囊形（不报错、不静默忽略）。圆角档位对 circle 无效（恒胶囊半径）。

<demo html="components/general/button/shape.html"/>

### 备注（memo）

**类型**: `string`

**默认**: `''`（无备注）

显示在 label 下方的注释文本：小一号（0.75em）且淡化（按内容色 color-mix 派生——实底上呈淡白、透明底上呈淡灰）。**最多两行**，超出自动截断显示省略号；memo 在场时图标默认 **2 倍大**，与 label+memo 文本块垂直居中。

<demo html="components/general/button/memo.html"/>

### 文本换行（wrap）

**类型**: `boolean`

**默认**: `false`（单行）

label 的换行控制——**默认单行**：宽度受限时（block / menu / 容器挤压）溢出自动显示**省略号**，按钮高度恒定；`wrap: true` 解除截断自动折行，按钮高度随行数增长（可能撑开布局，**显式声明才换行**）。宽度充裕的常规按钮收缩到内容宽，两种模式无差异。

截断发生时自动在宿主挂**悬停提示**显示完整文案（挂载双轨：页面已加载 tooltip 插件挂 `data-tooltip`、缺席挂原生 `title`；宿主已有显式提示时**不覆盖**）。溢出检测为静态（挂载与 label / wrap 变化时重查），容器宽度单独变化后提示可能过期（截断本身始终正确）。

wrap 只管 label——memo 保持两行截断不变；与 `shape: "circle"` 组合时折行呈竖长胶囊，视觉责任归使用者。

<demo html="components/general/button/wrap.html"/>

### 标签组（tags）

**类型**: `{ icon?: string, label?: string, tooltip?: string, styles?: string, classes?: string, value?: any, checkable?: boolean, checkValues?: [any, any], shape?: none | circle | radius }[]`

**默认**: `[]`

在按钮内容区**右端**渲染一组小按钮（`margin-left: auto` 吸收剩余空间贴右缘；按钮收缩到内容宽时退化为紧跟主文本，最小间距由内容区 gap 保证），具有独立的点击事件（冒泡 `tag-click`，detail 平铺 `{ name, label, value, tag }`——详见「事件」）。键面：`icon` 图标；`label` 文字标签（在场呈**胶囊**形态）；`tooltip` 悬停提示；`styles` 额外内联样式（**cssText 字符串**）；`classes` 额外类名；`value` 使用者数据（**原样透传**进 detail，对象/数字皆可）；`checkable` 可切换——在场时 `value` 兼任勾选载体（`value === 真值` 即 checked，点击翻转真值 ↔ 假值并**写回外部状态**；`tag-click` 的 `detail.value` 为切换后新值）；`checkValues` `[真值, 假值]` 缺省 `[true, false]`（残缺项逐项回退，`??` 语义对假值真值如 `0` 无损）；checked 呈语义色淡底「点亮」态；`shape` 底板——默认 `none` **无背景**，`circle` 圆形底板 / `radius` 主题圆角底板（板色按内容色派生淡底，胶囊 tag 的 9999px 优先）。**图标与 label 恒 1rem**（不随字号档位）；tag 背景按按钮内容色派生（实底上呈淡白、透明底上呈淡灰、幽灵上呈淡语义色），与按钮主背景形成色差。

::: warning
**嵌套对象 / 数组 props（tags、ripple、icon 的对象形态）必须放外层状态再路径引用**（`tags: myTags`、`ripple: myRipConf`、`:icon="iconConf"`）——props 字面量嵌套值存在引用比较层面的更新环缺陷（引擎侧修复中），**字面量写法会死锁页面**；原始值（布尔 / 字符串 / 数字）与路径引用不受影响。
:::

<demo html="components/general/button/tags.html"/>

### 尾部箭头（caret）

**类型**: `none | left | top | right | bottom`

**默认**: `none`

在内容区**最右端**渲染一枚 `arrow` 图标（经 `x-icon`），并按 `caret` 指定方向旋转：`right` 为基准姿态，`bottom` / `left` / `top` 分别旋转 90° / 180° / 270°。方向切换复用同一 svg 载体，经 x-icon 的 `rotate` 选项 **连续旋转**（默认 0.3s，可经 `--as-icon-rotate-duration` 覆盖）——不更换图标节点、无闪变。与 `tags` 并存时 caret 恒在最末（右缘）；与 `labelPos="left"` 并存时图标位于 tags 之后、caret 之前。caret 为纯视觉方向指示，不改变按钮点击语义。

<demo html="components/general/button/caret.html"/>

### 菜单形态（menu）

**类型**: `boolean`

**默认**: `false`

将按钮整体呈现为菜单项：占满容器宽、透明底、内容左对齐、悬停淡底。可与 `checkable` 组合做可勾选菜单项（勾选态按 `checkStyle` 渲染，与普通按钮一致），也可与 `tags` 组合在菜单项右端放置快捷操作小圆钮 / 胶囊标签（点击冒泡 `tag-click`，不触发菜单项自身）。

<demo html="components/general/button/menu.html"/>

### 可勾选（checkable / value / checkValues / checkStyle）

**类型**: `checkable: boolean`、`value: any`、`checkValues: [any, any]`、`checkStyle: solid | check | corner | ripple`

**默认**: `false` / `false` / `[true, false]` / `corner`

`checkable: true` 时按钮**化身 checkbox 表单字段**——内嵌隐藏真 `input[type=checkbox]`（`name` 透传宿主；勾选以 `name=String(checkValues[0])` 提交、未勾选不提交），点击按 `checkValues` 二元组翻转 `value` 并冒泡 `change`；`checkable: false`（缺省）为普通按钮、非表单字段。四种选中渲染（指示色统一取主题色 / 当前 `type` 语义色；`check` 与 `ripple` 为最左 1.2em 常驻占位、零布局跳动）：

| 值 | 选中呈现 |
| --- | --- |
| `solid` | tone 实底 + 反白字 |
| `check` | 最左占位显示打勾 ✓（背景不变） |
| `corner`（默认） | tone 描边 + 右上角小三角内嵌反白打勾（按压即预显描边） |
| `ripple` | 勾选时宿主整体恒开 [`x-ripple`](../guide/directives/x-ripple.md) **echo 双环**涟漪（`always` 常驻 · 外扩形态非 inside；取消勾选回退 ripple prop 原配置；需同页加载 `autospark.ripple.js`） |

```html
<!-- 受控半双工：显示方向 props 注入、翻转方向 change 冒泡回写 -->
<span @change="picked = $event.detail.value">
    <x-button checkable="true" :check-values="['on','off']" :value="picked" label="仅看优惠"></x-button>
</span>

<!-- x-model 双向（化身 checkbox，.boolean 保真）+ 表单提交 -->
<x-button checkable="true" check-style="check" x-model.boolean="flag" label="同意条款" name="agree"></x-button>
```

::: warning
`checkValues` 数组与 `checkStyle` 动态值**放外层状态再路径引用**（`:check-values="cv"`）——字面量数组触发引擎更新环缺陷死锁页面（与 tags 同款约束）。x-model 绑定变量须在**根 state**。
:::

<demo html="components/general/button/checkable.html"/>

### 点击涟漪（ripple）

**类型**: `boolean | object`

**默认**: `true`

`ripple` 就是 [`x-ripple`](../guide/directives/x-ripple.md) 的 props 值：**默认开启**（`true` ≡ 缺省配置 **`{ trigger: "click", inside: true }`**——点击时自点击点在按钮内部铺开、圆角跟随、连点取消重起，播一个完整周期自止）；`false` 关闭；传对象即最终配置、全键可覆盖缺省（**对象须放外层状态路径引用**，见下方警示）：

- **触发器 `trigger`**：`click`（缺省，点击播一个周期）/ `always`（始终循环播放）/ `hover`（悬停播放、移出播完即停）
- **动画形态 `type`**：`inside`（缺省，按钮内部铺开）为独立键；`inside: false` 切换为外扩族——`echo` 双环回声 / `ring` 单环外扩 / `glow` 光晕呼吸（inside 与外扩形态互斥）
- **视觉参数**：`color` / `speed` / `size` / `gap` / `badge` 等全部键面透传（完整词表见 x-ripple 指令文档）

经 ADR-0010 运行时挂载契约动态生效；**需页面已加载 `autospark.ripple.js`**——未加载时静默跳过，按钮功能不受影响。

<demo html="components/general/button/ripple.html"/>

### 汉字空格（autoInsertSpace）

**类型**: `boolean`

**默认**: `true`

label 恰为**两个汉字**时自动在中间插入空格（「提交」→「提 交」，双字按钮视觉更均衡）；设为 `false` 关闭。三字及以上不受影响。

<demo html="components/general/button/auto-insert-space.html"/>

### 主题档位（data-size / data-shadow / data-radius / data-spacing / data-dark / data-colorized）

button 继承内置抽象基组件 `autospark.base`（ADR-0134，完整契约见[总览](../index.md#主题档位与-autosparkbase)），自动获得六个主题档位 props——**名即通道**：props 物化为宿主上的同名 `data-*` 属性，接通 @autospark/theme 的手动通道 CSS，在按钮局部覆盖祖先 scope 的全局档位（**局部主题**）。

- **静态写法**（元素名散属性，theme CSS 直通）：

```html
<x-button type="primary" data-size="small" data-shadow="large">保存</x-button>
<x-button data-dark>局部暗色语境按钮</x-button>
```

- **动态写法**（指令形态 props，消费方上下文响应式）：

```html
<x-button :data-spacing="dense ? 'x-small' : 'large'"></x-button>
```

值域 `ThemeSize = none | x-small | small | medium | large | x-large`；`data-dark` / `data-colorized` 为布尔；缺省不写属性（继承全局档位）；theme 不在场时静默无效（吃三级回退链兜底值）。完整契约与通道选型见 [总览 · 主题档位与 autospark.base](../index.md#主题档位与-autosparkbase)。

<demo html="components/general/button/theme.html"/>

### 缩进（indent）

**类型**: `number | string`

**默认**: `0`

内容的额外左缩进（数字按 px，字符串为任意 CSS 值如 `"2em"`）。加性作用于内容左缘——不影响宿主内距与对齐；菜单/树形层级展开场景配合 em 单位可随字号档位缩放。

```html
<x-button menu="true" indent="1.5em" icon="folder-open" label="项目文件"></x-button>
```

<demo html="components/general/button/indent.html"/>

### 事件

组件默认封闭（宿主上的表达式在组件域求值），事件经**冒泡**到外层消费——绑定写在组件外的包裹元素上：

| 事件 | detail | 触发时机 |
| --- | --- | --- |
| `change` | `{ value }` | checkable 点击翻转后 |
| `tag-click` | `{ name, label, value, tag }` | tags 小圆钮点击（已阻断冒泡；tag 级 checkable 时 `detail.value` 为切换后新值） |

<demo html="components/general/button/events.html"/>

## 参考

### 属性

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| variant | `default \| primary \| secondary \| dashed \| text \| link` | `default` | 形态（常规面板底 / 实底 / 次级淡底 / 虚线 / 文本 / 链接） |
| type | `primary \| success \| warning \| danger \| info` | `primary` | 语义色（与任意形态组合） |
| label | `string` | `"按钮"` | 兜底文案（插槽无内容时显示；labelPos none 时隐藏并转悬停提示） |
| labelPos | `left | right | top | bottom | none` | `right` | label 在 icon 哪侧（left 与 tags 互换、caret 在场时图标居其前；none 隐藏文字区、label 转悬停提示） |
| icon | `string \| object` | `''` | 图标名或 x-icon 选项对象 `{ name, size?, color?, strokeWidth?, padding?, shape?, button?, pointer?, rotate?, badge? }`（对象须路径引用；选项随状态响应式；loading 时被替换） |
| loading | `boolean` | `false` | 加载态：图标位转圈并禁点 |
| disabled | `boolean` | `false` | 禁用（同步宿主原生属性） |
| ghost | `boolean` | `false` | 幽灵：透明底、语义色内容 |
| border | `boolean` | `false` | 装饰性附加边框（默认无） |
| block | `boolean` | `false` | 适配父宽度 |
| align | `left \| center \| right` | `center` | 内容水平对齐 |
| indent | `number \| string` | `0` | 内容额外左缩进（数字 px / CSS 值；菜单层级缩进常用） |
| shape | `default \| circle` | `default` | 圆形（带文字自动胶囊） |
| wrap | `boolean` | `false` | label 换行：false 单行溢出省略号（截断时自动挂悬停提示——tooltip 插件在场挂 data-tooltip、缺席挂原生 title，显式提示优先）；true 折行（按钮高度随行数增长） |
| memo | `string` | `''` | label 下方备注（小一号、淡化） |
| tags | `{icon?, tooltip?, name?}[]` | `[]` | 右端小圆钮组（`margin-left:auto` 贴右缘，点击冒泡 tag-click） |
| caret | `none \| left \| top \| right \| bottom` | `none` | 尾部方向箭头（最右端 x-icon arrow，按方向旋转；切换经 rotate 选项连续旋转） |
| menu | `boolean` | `false` | 菜单项形态 |
| data-size | `ThemeSize` | `''` | 主题尺寸档（继承 autospark.base，ADR-0134） |
| data-shadow | `ThemeSize` | `''` | 主题阴影档 |
| data-radius | `ThemeSize` | `''` | 主题圆角档 |
| data-spacing | `ThemeSize` | `''` | 主题间距密度档 |
| data-dark | `boolean` | `false` | 局部暗色语境 |
| data-colorized | `boolean` | `false` | 局部多彩语境 |
| ripple | `boolean \| object` | `true` | x-ripple props 值透传（默认开启）：true ≡ `{ trigger: "click", inside: true }`，false 关闭，对象全键可覆盖（trigger / type / color / speed…；需加载 autospark.ripple.js，未加载时静默跳过） |
| checkable | `boolean` | `false` | 可复选：true 化身 checkbox 表单字段（内嵌真 input、x-model 可绑宿主、点击翻转 value） |
| value | `any` | `false` | 勾选值（=== checkValues[0] 即选中态） |
| checkValues | `[any, any]` | `[true, false]` | 勾选二元组 [checked 值, unchecked 值]（任意类型严格相等；数组须路径引用） |
| checkStyle | `solid \| check \| corner \| ripple` | `corner` | 选中渲染（实底 / 打勾占位 / 描边三角 / 涟漪动画占位——四值语义同 state-button 的 decorate 项键） |
| autoInsertSpace | `boolean` | `true` | 两汉字 label 自动插空格 |

### 事件

| 事件 | detail | 说明 |
| --- | --- | --- |
| change | `{ value: any }` | checkable 点击翻转后冒泡（`value` 为切换后新值）；表单同步惯用法 `@change="flag = $event.detail.value"` |
| tag-click | `{ name: string, label: string, value: any, tag: object }` | tags 小圆钮点击冒泡；tag 元素已 stopPropagation 阻断冒泡；tag 级 checkable 时 `value` 为切换后新值 |
| click | 原生事件 | 原生冒泡点击，外层包裹元素直接 `@click` 消费 |

### Slots

| 插槽 | 说明 |
| --- | --- |
| default | 按钮文字内容。提供插槽内容时覆盖 `label` 兜底文案（可含任意行内标记）；未提供时显示 label。变体数据属性（对齐/纵排等）不受插槽影响 |

```html
<!-- 插槽内容覆盖 label -->
<x-button variant="primary"><b>加粗</b>插槽内容</x-button>
```
