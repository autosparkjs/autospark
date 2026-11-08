# Button 按钮

## 概述

Button 是 AutoSpark 的官方按钮组件：**形态（variant）与语义色（type）正交组合**，覆盖常规/主/次/虚线/文本/链接六种形态 × 五种语义色，并支持图标、加载、禁用、幽灵、块级、圆形、纵排标签、备注、标签组、菜单项、可勾选、点击涟漪、汉字空格等完整特性面。

组件全盘消费 `@autospark/theme` 语义变量（`--auto-*` 三级回退链，ADR-0129）——调节主题色、切换暗色、换尺寸/圆角/间距档位**即时生效**，且不设组件级尺寸属性（字号/圆角跟随主题档位，内距以 `--auto-padding` 为基准——`data-spacing` 档位全局调节即时生效）。每个示例右侧均带**主题控制面板**，可现场验证联动。

## 快速入门

引擎之后加载组件脚本即注册完成，以元素名 `<x-button>` 直接使用——静态属性即 props（数字 / `true` / `false` / JSON 自动类型推断），`:key="expr"` 为响应式 props，子内容为默认插槽：

```html
<script src="autospark.js"></script>
<script src="autospark.button.js"></script>

<x-button variant="primary" label="主要按钮"></x-button>
<x-button variant="dashed" type="danger" label="危险虚线" disabled="true"></x-button>
<x-button checkable="true" :value="picked" label="仅看优惠"></x-button>
```

`class` / `style` / `id` / `data-*` 保留给宿主；事件监听（`@change` / `@tag-click`）写在**外层包裹元素**上消费（组件默认封闭，事件经冒泡）；等价的指令值形态 `<button x-component:autospark.button="{ ... }">` 同样受支持。

<demo html="components/button/basic.html"/>

## 指南

### 形态（variant）

**类型**: `default | primary | secondary | dashed | text | link`

**默认**: `default`

决定按钮的外观形态：`default` 常规按钮（缺省形态，**面板实色底**、无边框——描边由 `border` prop 开关控制；与 `secondary` 以底色层次区分）、`primary` 实底主按钮、`secondary` 次级按钮（**次级淡底**，半透明叠加、更融入背景）、`dashed` 虚线描边、`text` 纯文本（透明底）、`link` 链接样式（零内距、悬停下划线）。形态只管「长相」，颜色语义归 `type` 属性。

<demo html="components/button/variant.html"/>

### 语义色（type）

**类型**: `primary | success | warning | danger | info`

**默认**: `primary`

语义色取 theme 的 `--auto-*-color` 变量，可与任意形态自由组合。**语义色背景须搭配实底形态**（`variant: 'primary'`）；其余形态下的呈现：`default`（缺省）配非 primary 语义色时呈**描边与文字**取色（如 `type: "danger"` 红边红字——此时描边是语义呈现而非 border 装饰；primary 语义色为缺省值豁免保持中性）、`dashed` 语义色虚线边与文字、`link` / `ghost` 语义色文字与描边。勾选态（checkable）取色同样跟随当前 type。

<demo html="components/button/type.html"/>

### 图标（icon）

**类型**: `string | { name: string, size?: number | string, color?: string, strokeWidth?: number, padding?: number | string, badge?: boolean | number | string }`

**默认**: `''`（无图标）

两种形态：

- **字符串**：图标名，经 `x-icon` 指令渲染（内置图标表或全局注册的图标均可）。尺寸跟随字号档位（默认 1em）、颜色继承按钮内容色；
- **对象**：完整图标配置——`name` 必填（图标名），`size`（数字 px 或任意 CSS 值）、`color`（覆盖继承色）、`strokeWidth`（描边粗细，经 `--as-icon-sw` 变量下发、含网格补偿）、`padding`（图标内距留白）、`badge`（右上角角标，x-icon 同款标量三形态：`true` 缺省板距 / 数字 px / 字符串 CSS 值，形态即启用，角标取 danger 语义色）。实现与 x-icon 原生内联等价；`loading` 开启时无论何种形态均被加载图标替换。

```html
<x-button icon="star" label="字符串形态"></x-button>
<x-button :icon="iconConf" label="对象形态"></x-button>
<!-- iconConf: { name: 'star', size: 24, color: '#f59e0b', strokeWidth: 2 } -->
```

::: warning
icon 的**对象形态必须放外层状态再路径引用**（`:icon="iconConf"`）——与 tags / ripple 对象一样，props 字面量嵌套对象会触发引擎更新环缺陷死锁页面。
:::

<demo html="components/button/icon.html"/>

### 标签位置（labelPos）

**类型**: `left | right | top | bottom | none`

**默认**: `right`

label 在 icon 的哪侧（破坏性合并：原 `iconPlacement` 与 `labelBelow` 两属性移除，迁移动作 `icon-placement="end"` → `label-pos="left"`、`label-below="true"` → `label-pos="bottom"`）：

- `right`（默认）左图标右文字；`left` 图标移内容区末尾（横排右/纵排下），**并与 tags 互换**（图标恒最末），loading 图标随行；
- `top` 文字在图标上方 / `bottom` 文字在图标下方（纵排）；`check-style: icon` 的勾选占位恒最前不受影响；
- `none` **不显示文字区**（label + memo + 插槽内容一并隐藏）——宿主无显式提示时 **label 文本自动转挂悬停提示**（tooltip 插件在场挂 `data-tooltip`、缺席挂原生 `title`，显式提示优先）。

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

幽灵按钮：背景透明、内容与描边取当前 type 的语义色，常用在有色背景上。可与任意形态、语义色组合。

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

### 备注（memo）

**类型**: `string`

**默认**: `''`（无备注）

显示在 label 下方的注释文本：小一号（0.75em）且淡化（按内容色 color-mix 派生——实底上呈淡白、透明底上呈淡灰）。**最多两行**，超出自动截断显示省略号；memo 在场时图标默认 **2 倍大**，与 label+memo 文本块垂直居中。

<demo html="components/button/memo.html"/>

### 文本换行（wrap）

**类型**: `boolean`

**默认**: `false`（单行）

label 的换行控制——**默认单行**：宽度受限时（block / menu / 容器挤压）溢出自动显示**省略号**，按钮高度恒定；`wrap: true` 解除截断自动折行，按钮高度随行数增长（可能撑开布局，**显式声明才换行**）。宽度充裕的常规按钮收缩到内容宽，两种模式无差异。

截断发生时自动在宿主挂**悬停提示**显示完整文案（挂载双轨：页面已加载 tooltip 插件挂 `data-tooltip`、缺席挂原生 `title`；宿主已有显式提示时**不覆盖**）。溢出检测为静态（挂载与 label / wrap 变化时重查），容器宽度单独变化后提示可能过期（截断本身始终正确）。

wrap 只管 label——memo 保持两行截断不变；与 `shape: "circle"` 组合时折行呈竖长胶囊，视觉责任归使用者。

<demo html="components/button/wrap.html"/>

### 标签组（tags）

**类型**: `{ icon?: string, label?: string, tooltip?: string, styles?: string, classes?: string, value?: any, ripple?: boolean | object, shape?: none | circle | radius }[]`

**默认**: `[]`

在按钮最右侧渲染一组小按钮，具有独立的点击事件（冒泡 `tag-click`，detail 平铺 `{ name, label, value, tag }`——详见「事件」）。键面：`icon` 图标；`label` 文字标签（在场呈**胶囊**形态）；`tooltip` 悬停提示；`styles` 额外内联样式（**cssText 字符串**）；`classes` 额外类名；`value` 使用者数据（**原样透传**进 detail，对象/数字皆可）；`ripple` tag 级涟漪（默认 false，经 ADR-0010 双属性挂载，未加载 autospark.ripple.js 静默无效）；`shape` 底板——默认 `none` **无背景**，`circle` 圆形底板 / `radius` 主题圆角底板（板色按内容色派生淡底，胶囊 tag 的 9999px 优先）。**图标与 label 恒 1rem**（不随字号档位）；tag 背景按按钮内容色派生（实底上呈淡白、透明底上呈淡灰、幽灵上呈淡语义色），与按钮主背景形成色差。

::: warning
**嵌套对象 / 数组 props（tags、ripple、icon 的对象形态）必须放外层状态再路径引用**（`tags: myTags`、`ripple: myRipConf`、`:icon="iconConf"`）——props 字面量嵌套值存在引用比较层面的更新环缺陷（引擎侧修复中），**字面量写法会死锁页面**；原始值（布尔 / 字符串 / 数字）与路径引用不受影响。
:::

<demo html="components/button/tags.html"/>

### 菜单形态（menu）

**类型**: `boolean`

**默认**: `false`

将按钮整体呈现为菜单项：占满容器宽、透明底、内容左对齐、悬停淡底。可与 `checkable` 组合做可勾选菜单项（勾选态按 `checkStyle` 渲染，与普通按钮一致）。

<demo html="components/button/menu.html"/>

### 可勾选（checkable / value / checkValues / checkStyle）

**类型**: `checkable: boolean`、`value: any`、`checkValues: [any, any]`、`checkStyle: solid | icon | corner`

**默认**: `false` / `false` / `[true, false]` / `solid`

`checkable` 开启勾选模式——按钮**化身 checkbox**：内嵌隐藏真 `input[type=checkbox]`（表单提交载体），点击按 `checkValues` 二元组翻转 `value` 并冒泡 `change`。四个子特性：

#### value 通道（受控半双工）

显示方向经 props 单向注入响应，翻转方向经 change 冒泡回写：

```html
<span @change="picked = $event.detail.value">
    <x-button checkable="true" :check-values="['on','off']" :value="picked" label="仅看优惠"></x-button>
</span>
```

#### x-model 双向绑定（化身 checkbox）

宿主上 `x-model` 经组件桥转发到内嵌 input——与原生 checkbox 一致的**布尔语域**，配 `x-model.boolean` 类型保真：

```html
<x-button checkable="true" check-style="icon" x-model.boolean="flag" label="同意条款" name="agree"></x-button>
```

多枚按钮绑**同一根 state 变量**即「全选组」——任一翻转、全体联动。::: warning
x-model 绑定的变量须在**根 state**（构造入参），放祖先 `x-data` 局部域会因引擎封闭域写断裂而失联（写入会凭空建根键）。表单提交：勾选时以 `name=String(checkValues[0])` 提交、未勾选不提交（原生语义）。
:::

<demo html="components/button/checkable.html"/>

#### checkValues 任意值

`[checked 值, unchecked 值]` 二元组（任意类型，严格相等判定）——`"on"/"off"`、`1/0` 均可；决定 value 通道取值、change detail 与表单提交值（对象须外层状态引用）。

#### checkStyle 三种选中渲染

指示色统一取主题色（有 `type` 时语义色）；未勾选均维持原 variant 形态：

| 值 | 选中呈现 |
| --- | --- |
| `solid`（默认） | tone 实底 + 反白字 |
| `icon` | 最左 1.2em 固定占位显示/隐藏打勾（背景不变、无布局跳动） |
| `corner` | tone 描边 + 右上角小三角（直角边随圆角半径走弦线、紧贴描边右上角）内嵌反白打勾 |

<demo html="components/button/checkable.html"/>

### 点击涟漪（ripple）

**类型**: `boolean | object`

**默认**: `true`

`ripple` 就是 [`x-ripple`](../guide/directives/x-ripple.md) 的 props 值：**默认开启**（`true` ≡ 缺省配置 **`{ trigger: "click", inside: true }`**——点击时自点击点在按钮内部铺开、圆角跟随、连点取消重起，播一个完整周期自止）；`false` 关闭；传对象即最终配置、全键可覆盖缺省（**对象须放外层状态路径引用**，见下方警示）：

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

### 主题档位（data-size / data-shadow / data-radius / data-spacing / data-dark / data-colorized）

button 继承内置抽象基组件 [`autospark.base`](./base.md)（ADR-0134），自动获得六个主题档位 props——**名即通道**：props 物化为宿主上的同名 `data-*` 属性，接通 @autospark/theme 的手动通道 CSS，在按钮局部覆盖祖先 scope 的全局档位（**局部主题**）。

- **静态写法**（元素名散属性，theme CSS 直通）：

```html
<x-button type="primary" data-size="small" data-shadow="large">保存</x-button>
<x-button data-dark>局部暗色语境按钮</x-button>
```

- **动态写法**（指令形态 props，消费方上下文响应式）：

```html
<button x-component:autospark.button="{ 'data-spacing': dense ? 'x-small' : 'large' }"></button>
```

值域 `ThemeSize = none | x-small | small | medium | large | x-large`；`data-dark` / `data-colorized` 为布尔；缺省不写属性（继承全局档位）；theme 不在场时静默无效（吃三级回退链兜底值）。完整契约与通道选型见 [Base 基类组件](./base.md)。

<demo html="components/button/theme.html"/>

### 缩进（indent）

**类型**: `number | string`

**默认**: `0`

内容的额外左缩进（数字按 px，字符串为任意 CSS 值如 `"2em"`）。加性作用于内容左缘——不影响宿主内距与对齐；菜单/树形层级展开场景配合 em 单位可随字号档位缩放。

```html
<x-button menu="true" indent="1.5em" icon="folder-open" label="项目文件"></x-button>
```

<demo html="components/button/indent.html"/>

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
| variant | `default \| primary \| secondary \| dashed \| text \| link` | `default` | 形态（常规面板底 / 实底 / 次级淡底 / 虚线 / 文本 / 链接） |
| type | `primary \| success \| warning \| danger \| info` | `primary` | 语义色（与任意形态组合） |
| label | `string` | `"按钮"` | 兜底文案（插槽无内容时显示；labelPos none 时隐藏并转悬停提示） |
| labelPos | `left | right | top | bottom | none` | `right` | label 在 icon 哪侧（left 与 tags 互换；none 隐藏文字区、label 转悬停提示） |
| icon | `string \| object` | `''` | 图标名或配置对象 `{ name, size?, color?, strokeWidth?, padding? }`（对象须路径引用；loading 时被替换） |
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
| tags | `{icon?, tooltip?, name?}[]` | `[]` | 右侧小圆钮组（点击冒泡 tag-click） |
| menu | `boolean` | `false` | 菜单项形态 |
| data-size | `ThemeSize` | `''` | 主题尺寸档（继承 autospark.base，ADR-0134） |
| data-shadow | `ThemeSize` | `''` | 主题阴影档 |
| data-radius | `ThemeSize` | `''` | 主题圆角档 |
| data-spacing | `ThemeSize` | `''` | 主题间距密度档 |
| data-dark | `boolean` | `false` | 局部暗色语境 |
| data-colorized | `boolean` | `false` | 局部多彩语境 |
| checkable | `boolean` | `false` | 可勾选模式（化身 checkbox：内嵌真 input、x-model 可绑宿主） |
| value | `any` | `false` | 勾选值（=== checkValues[0] 即选中态） |
| checkValues | `[any, any]` | `[true, false]` | 勾选二元组 [checked 值, unchecked 值]（任意类型严格相等；对象须路径引用） |
| checkStyle | `solid | icon | corner` | `solid` | 选中渲染（实底 / 打勾占位 / 描边三角） |
| ripple | `boolean \| object` | `true` | x-ripple props 值透传（默认开启）：true ≡ `{ trigger: "click", inside: true }`，false 关闭，对象全键可覆盖（trigger / type / color / speed…；需加载 autospark.ripple.js，未加载时静默跳过） |
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
<x-button variant="primary"><b>加粗</b>插槽内容</x-button>
```
