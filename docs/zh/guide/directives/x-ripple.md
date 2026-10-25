# x-ripple 涟漪扩散

## 概述

`x-ripple` 为宿主元素叠加**涟漪扩散动效层**——一圈边框色自宿主边框循环向外扩散渐隐。不改变宿主布局与内容，指针事件全穿透。装饰动效家族拆分为两条独立指令：本页的 `x-ripple`（涟漪扩散）与 [x-spin](./x-spin.md)（色环旋转）。

```html
<div x-ripple>内容</div>
```

::: tip 插件指令
`x-ripple` 由官方插件包 `@autospark/plugins` 以插件形态提供（engine 侧零改动），使用前须加载插件脚本，且**先于 engine 实例化**：

```html
<script src="/autospark/autospark.js"></script>
<script src="/autospark/autospark.ripple.js"></script>
```

未加载插件时 `x-ripple` 属性会被编译器当作普通属性剥除，动效不生效且无提示。
:::

## 快速入门

<demo html="ripple/basic.html"/>

```html
<div x-ripple>恒开（无值，默认 echo 双环）</div>
<div x-ripple.glow>边框光晕呼吸（修饰符速记）</div>
<div x-ripple="ui.show">跟随表达式显隐</div>
<div x-ripple="false">恒关</div>
```

## 指南

### 指令值

指令值三态（truthiness 总开关）：

| 形态                       | 语义                                         |
| -------------------------- | -------------------------------------------- |
| 无值 `<div x-ripple>`      | 恒开——挂载后持续循环                         |
| 表达式 `x-ripple="ui.show"` | 响应式跟随表达式真假，支持 `x-data` 局部变量 |
| 字面 `"false"`             | 恒关——永不播放                               |

转假时**不打断在播周期**：动效播完当前周期（周期末本就近乎透明）再自然停止；重新转真立即重启。

<demo html="ripple/value.html"/>

### 形态

`type` 选择涟漪形态，默认 `echo`：

| type   | 效果                                                         |
| ------ | ------------------------------------------------------------ |
| `ring` | 外扩环——一圈边框色自宿主边框向外扩散至 `size` 并渐隐         |
| `glow` | 边框光晕——box-shadow 呼吸式明暗脉冲，不位移                  |
| `echo` | 回声双环——双环错相位（相位差半个周期），一波未平一波又起（默认） |

形态有三种等价声明方式：`type` 显式键、`ring/glow/echo` 布尔开关键、`x-ripple.glow` 等点修饰符速记（三者经引擎解析期等价注入）。多处并存时按 **glow > ring > echo** 取先者；显式 `false` 可压制速记开关。

```html
<!-- 以下三例等价（均为边框光晕） -->
<div x-ripple.glow></div>
<div x-ripple x-ripple-options="{glow:true}"></div>
<div x-ripple x-ripple-options="{type:'glow'}"></div>
```

<demo html="ripple/modes.html"/>

::: warning 跨指令词表忽略
声明姊妹指令 x-spin 的形态词表（`rotate`/`beam`/`chase`）时警告并忽略，不中断渲染；其余未知键静默处理。
:::

### 触发器

`trigger` 控制播放时机，默认 `always`（挂载后持续循环）：

- `always`：挂载即播，持续循环；
- `hover`：默认静止，悬停期间播放，移出后播完当前周期再停；
- `click`：默认静止，每次点击播放一个完整周期后自动停止；在播中连点忽略，周期结束后可再次点击重播。

触发器有三种等价声明方式：`trigger` 显式键、`hover/always/click` 布尔开关键、点修饰符速记。多处并存时按 **hover > always > click** 取先者；显式 `false` 可压制速记开关。

修饰符链支持级联，形态与触发器两段词表分流、次序无关——`x-ripple.glow.click` ≡ `x-ripple.click.glow` ≡ `{type:'glow', trigger:'click'}`：

```html
<!-- 以下四例等价（均为边框光晕 + 点击触发） -->
<div x-ripple.glow.click></div>
<div x-ripple.click x-ripple-options="{glow:true}"></div>
<div x-ripple x-ripple-options="{glow:true, click:true}"></div>
<div x-ripple x-ripple-options="{type:'glow', trigger:'click'}"></div>
```

`hover` 与指令值叠加生效：值恒开 + hover = 纯悬停动效；值表达式 + hover = 两者同时为真才播放。

缺省形态 `echo` 与 `click` 组合时双环**同时起波**——第二环以 0.6 倍同心尺寸与主环同拍收束，一次点击严格呈现一次波；`always`/`hover` 下双环负延迟错相位（相位差半个周期），一波未平一波又起。

<demo html="ripple/trigger.html"/>

### 尺寸与节奏

- `size`：波环自宿主边框向外扩散的最大距离 px，默认 12；
- `speed`：单波动画段时长 ms，默认 3000；
- `gap`：周期末静止段 ms，默认 0——静止段烘进 keyframes 百分比，单 animation 无缝循环。

涟漪载体 `border-radius: inherit` 自动跟随宿主圆角——50% 圆、局部圆角均一致贴合，无需配置。

<demo html="ripple/geometry.html"/>

### 颜色

`color` 缺省跟随主题主色变量 `--auto-theme-color`（随 ThemeManager 动态主题联动），显式传值优先：

```html
<div x-ripple x-ripple-options="{color:'#10b981'}"></div>
```

<demo html="ripple/color.html"/>

### 载体与降级

动效层默认挂在宿主**伪元素**上（`::after`；echo 双环另占 `::before`），零 DOM 侵入。宿主自身伪元素已被占用时（如装饰角标）自动降级为注入 `position:absolute` 子元素（echo 注入两个子环）——脱离文档流，不参与 flex/gap 布局。纯自动检测，无配置项。

<demo html="ripple/carrier.html"/>

### 徽标

`badge` 将动效载体缩为**宿主右上角顶点处的正圆**（圆心恰在角点，一半悬于宿主外），波环自角标圆边向外扩散——消息红点脉冲的经典形态：

- `badge: true`：默认直径 8px；
- `badge: 16`：自定义直径 px（正数字）；
- 非法值（字符串 / 0 / 负数）警告后不启用。

启用且未显式给 `color` 时，颜色缺省联动**主题语义红** `var(--auto-danger-color)`（随主题联动，主题未加载兜底 `#ff4d4f`）；显式 `color` 恒优先。`type`/`trigger`/`size` 等其余配置语义不变——`size` 仍管自圆边向外的扩散距离，与直径相互独立；各形态与触发器组合照常生效。

```html
<div x-ripple x-ripple-options="{badge: true}"></div>
<div x-ripple.click x-ripple-options="{badge: 16}"></div>
```

badge 载体带最高层级 z-index，覆盖宿主内容与同层定位元素（宿主若自带 `transform` 等创建了层叠上下文，badge 无法穿透逃逸）；宿主 `overflow: hidden` 会裁剪 badge 与动效层，此类宿主请预留角部空间。

<demo html="ripple/badge.html"/>

## 配置选项

`x-ripple-options` 为静态整包配置，**求值一次**——动效参数是设计期配置，改值需重挂宿主。

| 配置项     | 类型                                   | 默认值                    | 说明                                     |
| ---------- | -------------------------------------- | ------------------------- | ---------------------------------------- |
| `type`     | `'ring' \| 'glow' \| 'echo'`           | `'echo'`                  | 形态显式键                               |
| `ring`     | `boolean`                              | `-`                       | 开关 ≡ `type:'ring'`（点修饰符同义）     |
| `glow`     | `boolean`                              | `-`                       | 开关 ≡ `type:'glow'`（点修饰符同义）     |
| `echo`     | `boolean`                              | `-`                       | 开关 ≡ `type:'echo'`（点修饰符同义）     |
| `trigger`  | `'always' \| 'hover' \| 'click'`       | `'always'`                | 触发器显式键                             |
| `hover`    | `boolean`                              | `-`                       | 开关 ≡ `trigger:'hover'`（点修饰符同义） |
| `always`   | `boolean`                              | `-`                       | 开关 ≡ `trigger:'always'`（点修饰符同义）|
| `click`    | `boolean`                              | `-`                       | 开关 ≡ `trigger:'click'`（点修饰符同义） |
| `badge`    | `boolean \| number`                    | `-`                       | 徽标：`true` = 右上角 8px 圆，正数字 = 自定义直径 px（启用时 color 缺省主题语义红） |
| `color`    | `string`                               | `var(--auto-theme-color)` | 波色（任意合法 CSS 颜色值）              |
| `size`     | `number`                               | `12`                      | 扩散距离 px                              |
| `speed`    | `number`                               | `3000`                    | 单波动画段时长 ms                        |
| `gap`      | `number`                               | `0`                       | 周期末静止段 ms                          |

非法取值不中断渲染：枚举/数值校验失败时警告并回退默认值。

::: info 关于指令配置体系
指令选项 / 修饰符 / 宿主选项 / 两层回退见[指令配置](../directive/config.md)。
:::

## 注意事项

- **加载顺序契约**：插件脚本须先于 engine 实例化加载。晚于首编译加载时，存量 DOM 上的 `x-ripple` 属性已被编译器剥除，指令不生效（此后动态添加的宿主仍生效）。
- **静态求值一次**：`x-ripple-options` 不响应式，改配置需重挂宿主。
- **减弱动效**：系统 `prefers-reduced-motion: reduce` 下自动停播（装饰性动画的可访问性底线）。
- **宿主定位**：宿主需建立定位上下文承载动效层——宿主未声明 `position` 时指令自动兜底 `position: relative`（特异性 0，不覆盖宿主自有定位）。
- **装饰性语义**：动效纯装饰，不承载交互反馈责任（按钮按下反馈等请用既有组件能力）；指针事件全穿透，不影响宿主子元素交互。
- **样式钩子**：类钩子 `x-ripple` / `x-ripple-on` / `x-ripple-echo` / `x-ripple-layer` / `x-ripple-badge`，变量 `--x-ripple-color` / `--x-ripple-size` / `--x-ripple-duration` / `--x-ripple-anim` / `--x-ripple-echo-delay` / `--x-ripple-echo-size` / `--x-ripple-badge-size`，供主题与业务层重载。
- **硬切迁移**：`x-ripple` 由 `x-spark` 伞形指令拆分而来（ADR-0007），无别名兼容——效果族通道退役、涟漪形态键 `rippleMode` 更名为 `type`，色环旋转整体迁移至独立指令 [x-spin](./x-spin.md)；产物名（`autospark.ripple.js`）、CSS 变量与类钩子（`--x-ripple-*` / `x-ripple*`）均已更名，存量 `x-spark` 涟漪用法需同步迁移。

---

下一步：进行中指示（色环旋转）见 [x-spin](./x-spin.md)；插件接入机制见[插件开发](../plugin/index.md)。
