# x-spin 色环旋转

## 概述

`x-spin` 为宿主元素叠加**旋转色环动效层**（进行中指示）——环绕宿主边界的 conic 色环匀速旋转。不改变宿主布局与内容，指针事件全穿透。装饰动效家族拆分为两条独立指令：[x-ripple](./x-ripple.md)（涟漪扩散）与本页的 `x-spin`（色环旋转）。

```html
<div x-spin>内容</div>
```

::: tip 插件指令
`x-spin` 由官方插件包 `@autospark/plugins` 以插件形态提供（engine 侧零改动），使用前须加载插件脚本，且**先于 engine 实例化**：

```html
<script src="/autospark/autospark.js"></script>
<script src="/autospark/autospark.spin.js"></script>
```

未加载插件时 `x-spin` 属性会被编译器当作普通属性剥除，动效不生效且无提示。
:::

## 快速入门

<demo html="spin/basic.html"/>

```html
<div x-spin>恒开（无值，默认 beam 光段跑边）</div>
<div x-spin.chase>双段追逐（修饰符速记）</div>
<div x-spin="ui.loading">跟随表达式显隐</div>
<div x-spin="false">恒关</div>
```

## 指南

### 指令值

指令值三态（truthiness 总开关）：

| 形态                     | 语义                                         |
| ------------------------ | -------------------------------------------- |
| 无值 `<div x-spin>`      | 恒开——挂载后持续循环                         |
| 表达式 `x-spin="ui.loading"` | 响应式跟随表达式真假，支持 `x-data` 局部变量 |
| 字面 `"false"`           | 恒关——永不播放                               |

转假时**不打断在播周期**：色环播完当前圈再自然停止；重新转真立即重启。

<demo html="spin/value.html"/>

### 形态

`type` 选择色环形态，默认 `beam`。三形态共用同一角度动画（conic-gradient 角度扫描 + mask 环带挖洞），仅渐变模板不同：

| type     | 效果                                                   |
| -------- | ------------------------------------------------------ |
| `rotate` | 整环匀速旋转——主色渐隐至透明的整环匀速旋转             |
| `beam`   | 光束——窄扇区高亮光束沿边框扫过（默认）                 |
| `chase`  | 双段追逐——两段色块间隔分布，追逐旋转                   |

形态有三种等价声明方式：`type` 显式键、`rotate/beam/chase` 布尔开关键、`x-spin.beam` 等点修饰符速记（三者经引擎解析期等价注入）。多处并存时按 **chase > rotate > beam** 取先者；显式 `false` 可压制速记开关。

```html
<div x-spin></div>
<div x-spin x-spin-options="{type:'rotate'}"></div>
<div x-spin.chase></div>
```

<demo html="spin/modes.html"/>

::: warning 跨指令词表忽略
声明姊妹指令 x-ripple 的形态词表（`ring`/`glow`/`echo`）或涟漪专属的 `gap`（x-spin 恒转无静止段）时警告并忽略，不中断渲染；其余未知键静默处理。
:::

### 触发器

`trigger` 控制播放时机，默认 `always`（挂载后持续循环）：

- `always`：挂载即播，持续循环；
- `hover`：默认静止，悬停期间旋转，移出后播完当前圈再停；
- `click`：默认静止，每次点击旋转一圈后自动停止；在播中连点忽略，一圈结束后可再次点击重播（与 x-ripple click「单周期播放」语义严格对齐）。

触发器有三种等价声明方式：`trigger` 显式键、`hover/always/click` 布尔开关键、点修饰符速记。多处并存时按 **hover > always > click** 取先者；显式 `false` 可压制速记开关。

修饰符链支持级联，形态与触发器两段词表分流、次序无关——`x-spin.chase.click` ≡ `x-spin.click.chase` ≡ `{type:'chase', trigger:'click'}`：

```html
<!-- 以下四例等价（均为双段追逐 + 点击触发） -->
<div x-spin.chase.click></div>
<div x-spin.click x-spin-options="{chase:true}"></div>
<div x-spin x-spin-options="{chase:true, click:true}"></div>
<div x-spin x-spin-options="{type:'chase', trigger:'click'}"></div>
```

`hover` 与指令值叠加生效：值恒开 + hover = 纯悬停动效；值表达式 + hover = 两者同时为真才播放。

<demo html="spin/trigger.html"/>

### 环宽与转速

- `size`：色环环宽 px，默认 4（mask 环带挖洞的 padding，环带视觉厚度）；
- `speed`：旋转一圈时长 ms，默认 3000，恒为 linear 匀速（与涟漪 ease-out 分流）；
- `gap` 非本指令键——色环恒转无静止段，声明时警告忽略。

环带沿宿主轮廓（含圆角）扫描，`border-radius: inherit` 自动贴合宿主圆角。

<demo html="spin/geometry.html"/>

### 颜色

`color` 缺省跟随主题主色变量 `--auto-theme-color`（随 ThemeManager 动态主题联动），显式传值优先：

```html
<div x-spin x-spin-options="{color:'#f59e0b'}"></div>
```

<demo html="spin/color.html"/>

### 载体与降级

动效层默认挂在宿主**伪元素**上（`::after`），零 DOM 侵入。宿主自身伪元素已被占用时（如装饰角标）自动降级为注入 `position:absolute` 子元素——脱离文档流，不参与 flex/gap 布局。降级子层与伪元素形态共享同一渐变模板与动画，色环照常旋转。纯自动检测，无配置项。

<demo html="spin/carrier.html"/>

### 徽标

`badge` 将动效载体缩为**宿主右上角顶点处的正圆**（圆心恰在角点，一半悬于宿主外），色环在角标圆内旋转——角标加载指示的经典形态：

- `badge: true`：默认直径 8px；
- `badge: 16`：自定义直径 px（正数字）；
- 非法值（字符串 / 0 / 负数）警告后不启用。

启用且未显式给 `color` 时，颜色缺省联动**主题语义红** `var(--auto-danger-color)`（随主题联动，主题未加载兜底 `#ff4d4f`）；显式 `color` 恒优先。`type`/`trigger`/`size` 等其余配置语义不变——`size` 仍管环宽，与直径相互独立；各形态与触发器组合照常生效。

```html
<div x-spin x-spin-options="{badge: true}"></div>
<div x-spin.click x-spin-options="{badge: 16}"></div>
```

badge 载体带最高层级 z-index，覆盖宿主内容与同层定位元素（宿主若自带 `transform` 等创建了层叠上下文，badge 无法穿透逃逸）；宿主 `overflow: hidden` 会裁剪 badge 与动效层，此类宿主请预留角部空间。

<demo html="spin/badge.html"/>

## 配置选项

`x-spin-options` 为静态整包配置，**求值一次**——动效参数是设计期配置，改值需重挂宿主。

| 配置项     | 类型                                   | 默认值                    | 说明                                     |
| ---------- | -------------------------------------- | ------------------------- | ---------------------------------------- |
| `type`     | `'rotate' \| 'beam' \| 'chase'`        | `'beam'`                  | 形态显式键                               |
| `rotate`   | `boolean`                              | `-`                       | 开关 ≡ `type:'rotate'`（点修饰符同义）   |
| `beam`     | `boolean`                              | `-`                       | 开关 ≡ `type:'beam'`（点修饰符同义）     |
| `chase`    | `boolean`                              | `-`                       | 开关 ≡ `type:'chase'`（点修饰符同义）    |
| `trigger`  | `'always' \| 'hover' \| 'click'`       | `'always'`                | 触发器显式键                             |
| `hover`    | `boolean`                              | `-`                       | 开关 ≡ `trigger:'hover'`（点修饰符同义） |
| `always`   | `boolean`                              | `-`                       | 开关 ≡ `trigger:'always'`（点修饰符同义）|
| `click`    | `boolean`                              | `-`                       | 开关 ≡ `trigger:'click'`（点修饰符同义） |
| `badge`    | `boolean \| number`                    | `-`                       | 徽标：`true` = 右上角 8px 圆，正数字 = 自定义直径 px（启用时 color 缺省主题语义红） |
| `color`    | `string`                               | `var(--auto-theme-color)` | 色环颜色（任意合法 CSS 颜色值）          |
| `size`     | `number`                               | `4`                       | 环宽 px                                  |
| `speed`    | `number`                               | `3000`                    | 旋转一圈时长 ms（linear 匀速）           |

非法取值不中断渲染：枚举/数值校验失败时警告并回退默认值。

::: info 关于指令配置体系
指令选项 / 修饰符 / 宿主选项 / 两层回退见[指令配置](../directive/config.md)。
:::

## 注意事项

- **加载顺序契约**：插件脚本须先于 engine 实例化加载。晚于首编译加载时，存量 DOM 上的 `x-spin` 属性已被编译器剥除，指令不生效（此后动态添加的宿主仍生效）。
- **静态求值一次**：`x-spin-options` 不响应式，改配置需重挂宿主。
- **减弱动效**：系统 `prefers-reduced-motion: reduce` 下自动停播（装饰性动画的可访问性底线）。
- **宿主定位**：宿主需建立定位上下文承载动效层——宿主未声明 `position` 时指令自动兜底 `position: relative`（特异性 0，不覆盖宿主自有定位）。
- **装饰性语义**：动效纯装饰，不承载交互反馈责任；指针事件全穿透，不影响宿主子元素交互。
- **样式钩子**：类钩子 `x-spin` / `x-spin-on` / `x-spin-<mode>` / `x-spin-layer` / `x-spin-badge`，变量 `--x-spin-color` / `--x-spin-size` / `--x-spin-duration` / `--x-spin-angle` / `--x-spin-badge-size`，供主题与业务层重载。
- **渐变直连契约**：色环渐变 background 直连角度变量 `--x-spin-angle`（注册属性动画的 paint 失效传播只覆盖直接解析到该变量的属性——经未注册自定义属性中转的间接引用链在部分 Chromium 版本上不触发重绘，表现为角度在跑而色环静止）；伪元素规则与降级层内联共用同一渐变模板，自定义重载请保持直连。
- **硬切迁移**：`x-spin` 由 `x-spark` 伞形指令拆分而来（ADR-0007），无别名兼容——效果族通道退役、色环形态键 `spinMode` 更名为 `type`，涟漪整体迁移至独立指令 [x-ripple](./x-ripple.md)；产物名（`autospark.spin.js`）、CSS 变量与类钩子（`--x-spin-*` / `x-spin*`）均已更名，存量 `x-spark` 色环用法需同步迁移。

---

下一步：涟漪扩散动效见 [x-ripple](./x-ripple.md)；插件接入机制见[插件开发](../plugin/index.md)。
