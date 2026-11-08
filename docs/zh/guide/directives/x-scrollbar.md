# x-scrollbar 滚动条皮肤

## 概述

`x-scrollbar` 为宿主元素叠加**渐显自定义滚动条**——隐藏原生滚动条，注入轨道（rail）+ 滑块（thumb）皮肤层：鼠标进入宿主渐显、移出延迟渐隐；滑块可拖拽、轨道可点击翻页。**原生滚动能力全保留**（滚轮惯性、触摸、键盘滚动、无障碍照常），指令只替换滚动条的「皮」。

```html
<div x-scrollbar style="height:200px;overflow:auto"><!-- 长内容 --></div>
```

::: tip 插件指令
`x-scrollbar` 由官方插件包 `@autospark/plugins` 以插件形态提供（engine 侧零改动），使用前须加载插件脚本，且**先于 engine 实例化**：

```html
<script src="/autospark/autospark.js"></script>
<script src="/autospark/autospark.scrollbar.js"></script>
```

未加载插件时 `x-scrollbar` 属性会被编译器当作普通属性剥除，皮肤不生效且无提示。
:::

## 快速入门

<demo html="scrollbar/basic.html"/>

```html
<div x-scrollbar>恒开（无值）</div>
<div x-scrollbar="ui.on">跟随表达式（关闭后原生滚动条回归）</div>
<div x-scrollbar="false">恒关（保留原生滚动条）</div>
```

## 指南

### 指令值

指令值三态（truthiness 总开关）：

| 形态                          | 语义                                             |
| ----------------------------- | ------------------------------------------------ |
| 无值 `<div x-scrollbar>`      | 恒开——隐藏原生滚动条，挂载皮肤层                 |
| 表达式 `x-scrollbar="ui.on"`  | 响应式跟随表达式真假，支持 `x-data` 局部变量     |
| 字面 `"false"`                | 恒关——不隐藏原生滚动条                           |

转假时**立即全摘**（轨道 DOM 与宿主类移除，原生滚动条回归）；重新转真立即重挂——与装饰动效家族的「播完当前周期再停」不同，滚动条是持续交互控件，无「周期」可收尾。

### 宿主约定

指令**约定式**，不碰宿主布局：宿主须自身是滚动容器（`overflow: auto/scroll` + 限定高度/宽度），内容不溢出时轨道静默不激活。指令自动兜底宿主 `position: relative`（特异性 0，宿主自有定位可覆盖）；轨道直接注入宿主内部末尾（不 reparent 宿主内容，与 `x-for` 等结构指令零冲突）——宿主的直接子元素选择器（如 `> *`）可能选中轨道，样式注意。

### 方向

默认**双向自动按需**：哪个方向溢出（内容尺寸 > 可视尺寸）才激活哪个方向的轨道，都不溢出则轨道不渲染。`.x` / `.y` 修饰符（或 options 布尔键）可限定单向；双向同时激活时两轨互不重叠（横向轨道让出纵向厚度），点击目标无歧义。

```html
<div x-scrollbar>双向按需（缺省）</div>
<div x-scrollbar.y>仅纵向（横向溢出也不出横轨）</div>
<div x-scrollbar.x>仅横向</div>
```

<demo html="scrollbar/axis.html"/>

### 显隐

严格 **enter/leave** 语义：

- 鼠标进入宿主 → 轨道渐显（`fadeDuration` 过渡）；移出 → 延迟 `delay` ms 后渐隐（默认 300ms，防指针快速掠过闪灭）；
- 拖拽滑块或点击轨道期间强制维持显示（拖拽结束时按指针位置补判定）；
- **键盘滚动不触发显示**（忠实「仅鼠标进入时呈现」语义）；
- 触摸设备无 mouseenter → 滚动条永不显示，原生滚动照常（免费降级）。

`delay` 与 `fadeDuration` 调节显隐节奏；系统开启「减弱动态效果」（`prefers-reduced-motion: reduce`）时过渡自动停用，直接显隐。

<demo html="scrollbar/fade.html"/>

### 交互

两组交互默认启用，无配置开关：

- **滑块拖拽**：按住滑块直接拖动（Pointer Events，拖拽期间滑块自动增粗）；
- **轨道点击翻页**：点击轨道空白处滚动一容器高——点击点在滑块上侧向上翻、下侧向下翻（点在滑块上不触发）。

滚轮、触摸滑动、键盘滚动全部走宿主**原生滚动能力**，滑块位置经 `scroll` 事件实时同步。

### 尺寸与颜色

`width` 轨道厚度（默认 12）、`thumbWidth` 滑块粗细（默认 5，hover 与拖拽时自动增粗 5px）、`minSize` 滑块最小长度（默认 20——内容极多时滑块不会缩成一条线）。`color` 缺省中性灰 `rgba(0,0,0,0.25)`，可被全局变量 `--autospark-scrollbar-color` 覆盖（暗色主题下调亮一处的统一入口）：

```html
<div x-scrollbar x-scrollbar-options="{width:20,thumbWidth:9,color:'#3273dc'}"></div>
```

<demo html="scrollbar/color.html"/>

### 运行时动态挂载

`x-scrollbar` 走运行时通道（MutationObserver），**不经编译也能挂载**——engine 存活期间对观察根内元素动态 `setAttribute("x-scrollbar", "")` 即生效，`removeAttribute` 即失效（轨道与宿主类立即清理，原生滚动条回归）；动态插入带属性的元素同样生效：

```html
el.setAttribute("x-scrollbar", "");                          // 挂载即生效
el.setAttribute("x-scrollbar-options", "{width:20}");        // 配置随挂载读取
el.removeAttribute("x-scrollbar");                           // 移除即失效
```

边界约定：

- 仅 engine 观察根内生效（`engine.el` 子树与覆盖层容器；x-isolate 子树归子引擎的观察器）；
- `x-scrollbar-options` 在挂载时求值一次——运行时改配置值无效，须移除重加 `x-scrollbar` 属性重挂；
- 修饰符形式（如 `x-scrollbar.y`）的**值变化**不触发重求值（增/删属性不受限）；
- 插件脚本晚于首编译加载时，存量静态属性已被编译器剥除（见[注意事项](#注意事项)加载顺序契约）——运行时动态添加不受此限。

<demo html="scrollbar/runtime.html"/>

## 配置选项

`x-scrollbar-options` 为静态整包配置，**求值一次**——皮肤参数是设计期配置，改值需重挂宿主。

| 配置项          | 默认值              | 修饰符 | 说明                                        |
| --------------- | ------------------- | ------ | ------------------------------------------- |
| `x`             | `false`             | `.x`   | 仅横向开关（与 `.y` 并用为双向按需）        |
| `y`             | `false`             | `.y`   | 仅纵向开关                                  |
| `width`         | `12`                | —      | 轨道厚度 px（number）                       |
| `thumbWidth`    | `5`                 | —      | 滑块粗细 px（number；hover/拖拽增粗 +5px 内置） |
| `color`         | `rgba(0,0,0,0.25)`  | —      | 滑块色（string，任意合法 CSS 颜色值；全局覆盖位 `--autospark-scrollbar-color`） |
| `delay`         | `300`               | —      | mouseleave 后渐隐延迟 ms（number）          |
| `fadeDuration`  | `200`               | —      | 渐显渐隐过渡时长 ms（number；reduced-motion 停过渡） |
| `minSize`       | `20`                | —      | 滑块最小长度 px（number）                   |

非法取值不中断渲染：布尔/数值校验失败时警告并回退默认值。

::: info 关于指令配置体系
指令选项 / 修饰符 / 宿主选项 / 两层回退见[指令配置](../directive/config.md)。
:::

## 注意事项

- **加载顺序契约**：插件脚本须先于 engine 实例化加载。晚于首编译加载时，存量 DOM 上的 `x-scrollbar` 属性已被编译器剥除，指令不生效（此后动态添加的宿主仍生效）。
- **静态求值一次**：`x-scrollbar-options` 不响应式，改配置需重挂宿主。
- **宿主约定**：宿主自带 `overflow: auto/scroll` 与限定尺寸，指令不代设；内容不溢出时轨道静默不激活。
- **几何刷新边界**：内容尺寸变化经 ResizeObserver（容器变化）+ 鼠标进入时强制重算感知——鼠标悬停**期间**内容大幅变化，滑块尺寸更新滞后到下一次进入/滚动（不上 MutationObserver 观察子树，代价过高）。
- **轨道补偿滞后**：轨道钉在可视区靠 scroll 事件驱动的 transform 补偿（已提合成层），极快速滚轮下轨道可能有一帧级的先随内容微移再弹回——这是原生滚动路径（编译期不接管滚动）的固有代价。
- **RTL**：`dir="rtl"` 的横向滚动定位未适配（纵向不受影响），首版明确不支持。
- **样式钩子**：类钩子 `x-scrollbar` / `x-scrollbar-visible` / `x-scrollbar-active-x` / `x-scrollbar-active-y` / `x-scrollbar-rail(-x/-y)` / `x-scrollbar-thumb` / `x-scrollbar-thumb-drag`，变量 `--x-scrollbar-width` / `--x-scrollbar-thumb` / `--x-scrollbar-color` / `--x-scrollbar-fade`，供主题与业务层重载；全局覆盖位 `--autospark-scrollbar-color`（缺省滑块色）。
- **子元素选择器**：轨道直挂宿主内部，宿主 `> *` 类选择器可能误中——必要时以 `:not(.x-scrollbar-rail)` 排除。

---

下一步：装饰动效指令（涟漪扩散 / 色环旋转）见 [x-ripple](./x-ripple.md) 与 [x-spin](./x-spin.md)；插件接入机制见[插件开发](../plugin/index.md)。
