# x-spark 装饰动效

## 概述

`x-spark` 为宿主元素增加**装饰性动效层**，是动效装饰的伞形指令：通过 `type` 选择效果族——`ripple`（涟漪，一圈边框色沿宿主轮廓向外扩散渐隐）或 `spin`（色环旋转，环绕宿主边框的 conic 色环持续旋转）。不改变宿主布局与内容，指针事件全穿透。

```html
<div x-spark>内容</div>
```

::: tip 插件指令
`x-spark` 由官方插件包 `@autospark/plugins` 以插件形态提供（engine 侧零改动），使用前须加载插件脚本，且**先于 engine 实例化**：

```html
<script src="/autospark/autospark.js"></script>
<script src="/autospark/autospark.spark.js"></script>
```

未加载插件时 `x-spark` 属性会被编译器当作普通属性剥除，动效不生效且无提示。
:::

## 快速入门

<demo html="spark/basic.html"/>

```html
<div x-spark>恒开（无值，默认涟漪）</div>
<div x-spark.spin>色环旋转（修饰符速记）</div>
<div x-spark="ui.show">跟随表达式显隐</div>
<div x-spark="false">恒关</div>
```

## 指南

### 指令值

指令值三态（truthiness 总开关）：

| 形态                     | 语义                                       |
| ------------------------ | ------------------------------------------ |
| 无值 `<div x-spark>`     | 恒开——挂载后持续循环                       |
| 表达式 `x-spark="ui.show"` | 响应式跟随表达式真假，支持 `x-data` 局部变量 |
| 字面 `"false"`           | 恒关——永不播放                             |

转假时**不打断在播周期**：动效播完当前周期（周期末本就近乎透明）再自然停止；重新转真立即重启。

<demo html="spark/value.html"/>

### 效果族

`type` 选择动效效果族，默认 `ripple`：

| type     | 效果                                                       |
| -------- | ---------------------------------------------------------- |
| `ripple` | 涟漪——一圈边框色自宿主边框向外扩散渐隐（默认效果族）       |
| `spin`   | 色环旋转——环绕宿主边框的 conic 色环持续旋转                |

效果族有三种等价声明方式：`type` 显式键、`spin/ripple` 布尔开关键、`x-spark.spin` 等点修饰符速记（三者经引擎解析期等价注入）。多处并存时按 **spin > ripple** 取先者；显式 `false` 可压制速记开关。

```html
<!-- 以下三例等价（均为色环旋转） -->
<div x-spark.spin></div>
<div x-spark x-spark-options="{spin:true}"></div>
<div x-spark x-spark-options="{type:'spin'}"></div>
```

<demo html="spark/basic.html"/>

### 涟漪形态

效果族为涟漪时，`rippleMode` 提供三种形态，默认 `echo`：

| rippleMode | 效果                                                       |
| ---------- | ---------------------------------------------------------- |
| `ring`     | 外扩环——一圈边框色自宿主边框向外扩散至 `size` 并渐隐       |
| `glow`     | 边框光晕——box-shadow 呼吸式明暗脉冲，不位移                |
| `echo`     | 回声双环——双环错相位（相位差半个周期），一波未平一波又起   |

<demo html="spark/ripple-mode.html"/>

### 色环旋转形态

效果族为色环旋转时，`spinMode` 提供三种形态，默认 `beam`。三形态共用同一角度动画（conic-gradient 角度扫描 + mask 环带挖洞），仅渐变模板不同：

| spinMode | 效果                                                                 |
| -------- | -------------------------------------------------------------------- |
| `rotate` | 匀色环——主色渐隐至透明的整环匀速旋转                                 |
| `beam`   | 光束——窄扇区高亮光束沿边框扫过（默认）                               |
| `chase`  | 双段追逐——两段色块间隔分布，追逐旋转                                 |

```html
<div x-spark.spin></div>
<div x-spark x-spark-options="{type:'spin', spinMode:'rotate'}"></div>
<div x-spark x-spark-options="{type:'spin', spinMode:'chase'}"></div>
```

色环宽度由 `size` 控制（默认 4px，语义 = 环宽），旋转恒为 linear 匀速，`speed` 即旋转一周时长。

<demo html="spark/spin.html"/>

::: warning 形态键与效果族配套
`rippleMode` 仅在 `type:'ripple'` 下生效，`spinMode` 仅在 `type:'spin'` 下生效。交叉声明时警告并忽略，不中断渲染。
:::

### 触发器

`trigger` 控制播放时机，效果族统一适用，默认 `always`（挂载后持续循环）：

- `always`：挂载即播，持续循环；
- `hover`：默认静止，悬停期间播放，移出后播完当前周期再停。
- `click`：默认静止，每次点击播放一个完整周期后自动停止；在播中连点忽略，周期结束后可再次点击重播。涟漪 `echo` 组合时双环**同时起波**——第二环以 0.6 倍同心尺寸与主环同拍收束，一次点击严格呈现一次波；色环旋转点击转一圈后收口，无额外波尾。

触发器有三种等价声明方式：`trigger` 显式键、`hover/always/click` 布尔开关键、点修饰符速记（三者经引擎解析期等价注入）。多处并存时按 **hover > always > click** 取先者；显式 `false` 可压制速记开关。

修饰符链支持级联：第一段为效果族、第二段为触发器——`x-spark.spin.click` ≡ `{type:'spin', trigger:'click'}`：

```html
<!-- 以下四例等价（均为色环旋转 + 点击触发） -->
<div x-spark.spin.click></div>
<div x-spark.click x-spark-options="{spin:true}"></div>
<div x-spark x-spark-options="{spin:true, click:true}"></div>
<div x-spark x-spark-options="{type:'spin', trigger:'click'}"></div>
```

`hover` 与指令值叠加生效：值恒开 + hover = 纯悬停动效；值表达式 + hover = 两者同时为真才播放。

<demo html="spark/trigger.html"/>

### 尺寸与节奏

`size` 语义随效果族分流：涟漪下 = 自边框向外扩散的最大距离（默认 12px），色环旋转下 = 环宽（默认 4px）。`speed` = 动画周期时长 ms，家族统一默认 3000；`gap` = 涟漪周期末静止段 ms（默认 0，烘进 keyframes 百分比无缝循环）——仅涟漪支持，色环旋转下声明时警告并忽略。

涟漪载体 `border-radius: inherit` 自动跟随宿主圆角——50% 圆、局部圆角均一致贴合，无需配置；色环旋转环带沿宿主轮廓（含圆角）扫描。

<demo html="spark/geometry.html"/>

### 颜色

`color` 缺省跟随主题主色变量 `--auto-theme-color`（随 ThemeManager 动态主题联动），显式传值优先，效果族通用：

```html
<div x-spark x-spark-options="{color:'#10b981'}"></div>
<div x-spark.spin x-spark-options="{color:'#f59e0b'}"></div>
```

<demo html="spark/color.html"/>

### 载体与降级

动效层默认挂在宿主**伪元素**上（`::after`，涟漪 echo 另占 `::before`），零 DOM 侵入。宿主自身伪元素已被占用时（如装饰角标）自动降级为注入 `position:absolute` 子元素——脱离文档流，不参与 flex/gap 布局。纯自动检测，无配置项；色环旋转降级子层与伪元素形态共享同一渐变模板与动画。

<demo html="spark/carrier.html"/>

### 徽标火花

`badge` 将动效载体缩为**宿主右上角顶点处的正圆**（圆心恰在角点，一半悬于宿主外），效果族通用——涟漪下波环自角标圆边向外扩散（消息红点脉冲的经典形态），色环旋转下色环在角标圆内旋转：

- `badge: true`：默认直径 8px；
- `badge: 16`：自定义直径 px（正数字）；
- 非法值（字符串 / 0 / 负数）警告后不启用。

启用且未显式给 `color` 时，颜色缺省联动**主题语义红** `var(--auto-danger-color)`（随主题联动，主题未加载兜底 `#ff4d4f`）；显式 `color` 恒优先。`type`/`trigger`/`size` 等其余配置语义不变——`size` 在涟漪下仍管自圆边向外的扩散距离、色环旋转下仍管环宽，与直径相互独立；各形态与触发器组合照常生效。

```html
<div x-spark x-spark-options="{badge: true}"></div>
<div x-spark.spin x-spark-options="{badge: true}"></div>
<div x-spark x-spark-options="{badge: 16, trigger: 'click'}"></div>
```

badge 载体带最高层级 z-index，覆盖宿主内容与同层定位元素（宿主若自带 `transform` 等创建了层叠上下文，badge 无法穿透逃逸）；宿主 `overflow: hidden` 会裁剪 badge 与动效层，此类宿主请预留角部空间。

<demo html="spark/badge.html"/>

## 配置选项

`x-spark-options` 为静态整包配置，**求值一次**——动效参数是设计期配置，改值需重挂宿主。

| 配置项       | 类型                                   | 默认值                          | 说明                                     |
| ------------ | -------------------------------------- | ------------------------------- | ---------------------------------------- |
| `type`       | `'ripple' \| 'spin'`                   | `'ripple'`                      | 效果族显式键                             |
| `rippleMode` | `'ring' \| 'glow' \| 'echo'`           | `'echo'`                        | 涟漪形态（仅 `type:'ripple'` 下生效）    |
| `spinMode`   | `'rotate' \| 'beam' \| 'chase'`        | `'beam'`                        | 色环旋转形态（仅 `type:'spin'` 下生效）   |
| `spin`       | `boolean`                              | `-`                             | 开关 ≡ `type:'spin'`（点修饰符同义）     |
| `ripple`     | `boolean`                              | `-`                             | 开关 ≡ `type:'ripple'`（点修饰符同义）   |
| `trigger`    | `'always' \| 'hover' \| 'click'`       | `'always'`                      | 触发器显式键                             |
| `hover`      | `boolean`                              | `-`                             | 开关 ≡ `trigger:'hover'`（点修饰符同义） |
| `always`     | `boolean`                              | `-`                             | 开关 ≡ `trigger:'always'`（点修饰符同义）|
| `click`      | `boolean`                              | `-`                             | 开关 ≡ `trigger:'click'`（点修饰符同义） |
| `badge`      | `boolean \| number`                    | `-`                             | 徽标火花：`true` = 右上角 8px 圆，正数字 = 自定义直径 px（启用时 color 缺省主题语义红） |
| `color`      | `string`                               | `var(--auto-theme-color)`       | 动效颜色（任意合法 CSS 颜色值）          |
| `size`       | `number`                               | 涟漪 `12` / 旋转 `4`            | 涟漪 = 扩散距离 px；旋转 = 环宽 px       |
| `speed`      | `number`                               | `3000`                          | 动画周期时长 ms                          |
| `gap`        | `number`                               | `0`                             | 涟漪周期末静止段 ms（仅涟漪支持）        |

非法取值不中断渲染：枚举/数值校验失败时警告并回退默认值；`size` 未声明或非法时按效果族分流回退。

::: info 关于指令配置体系
指令选项 / 修饰符 / 宿主选项 / 两层回退见[指令配置](../directive/config.md)。
:::

## 注意事项

- **加载顺序契约**：插件脚本须先于 engine 实例化加载。晚于首编译加载时，存量 DOM 上的 `x-spark` 属性已被编译器剥除，指令不生效（此后动态添加的宿主仍生效）。
- **静态求值一次**：`x-spark-options` 不响应式，改配置需重挂宿主。
- **减弱动效**：系统 `prefers-reduced-motion: reduce` 下自动停播（装饰性动画的可访问性底线，效果族通用）。
- **宿主定位**：宿主需建立定位上下文承载动效层——宿主未声明 `position` 时指令自动兜底 `position: relative`（特异性 0，不覆盖宿主自有定位）。
- **装饰性语义**：动效纯装饰，不承载交互反馈责任（按钮按下反馈等请用既有组件能力）；指针事件全穿透，不影响宿主子元素交互。
- **硬切迁移**：`x-spark` 由 `x-ripple` 硬切升级而来，无别名兼容——属性、选项键（`type` 拆分为 `rippleMode`/`spinMode`）、产物名（`autospark.spark.js`）、CSS 变量与类钩子（`--x-spark-*` / `x-spark*`）均已更名，存量 `x-ripple` 用法需同步迁移。
