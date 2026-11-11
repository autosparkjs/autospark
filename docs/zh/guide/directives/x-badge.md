# x-badge 徽标

## 概述

`x-badge` 为宿主元素叠加**内容徽标**——小红点（dot）或数字角标（count），右上角骑跨定位、白色 1px 分离边、可选常驻脉冲动画。值是**响应式数字**：未读数清零徽标自动消失，超过上限自动折叠为 `"99+"`。空宿主 + dot 即独立状态点（列表状态位用法）。

```html
<button x-badge>消息</button>
<button x-badge="unread" x-badge-options="{type:'count'}">消息</button>
```

::: tip 插件指令
`x-badge` 由官方插件包 `@autospark/plugins` 以插件形态提供（engine 侧零改动），使用前须加载插件脚本，且**先于 engine 实例化**：

```html
<script src="/autospark/autospark.js"></script>
<script src="/autospark/autospark.badge.js"></script>
```

未加载插件时 `x-badge` 属性会被编译器当作普通属性剥除，徽标不生效且无提示。
:::

## 快速入门

<demo html="badge/basic.html"/>

```html
<button x-badge>消息</button>                                    <!-- 小红点（无值恒显） -->
<button x-badge="unread" x-badge-options="{type:'count'}">消息</button> <!-- 数字徽标 -->
<button x-badge.count="unread">消息</button>                      <!-- 修饰符糖同上 -->
```

## 指南

### 指令值

指令值是 **count 表达式**（字面量数字 / 状态路径），响应式重求值：

| 形态                              | 语义                                               |
| --------------------------------- | -------------------------------------------------- |
| 无值 `x-badge`                    | dot 形态恒显（红点不依赖数字）；count 形态不渲染   |
| 表达式 `x-badge="unread"`         | 订阅状态路径，值变化实时更新（支持 `x-data` 局部变量） |
| 字面量 `x-badge="5"`              | 不订阅直读（常量数字）                             |

**零值规则**：值求值为 `0 / null / undefined / false / ''`（含转数字非有限或 ≤0）时**不渲染徽标**——「0 条未读 = 无消息」，宿主干净无残留。注意无值与零值语义正交：`x-badge`（无值）恒显红点、`x-badge="0"` 隐藏。

### 形态（type）

| 形态     | 视觉                                             | 值的使用                     |
| -------- | ------------------------------------------------ | ---------------------------- |
| `dot`    | 8px 正圆红点（缺省）                             | 有值即显（非零），数字被忽略 |
| `count`  | 数字胶囊：高 16 / 字号 12 / 单数字正圆、多位自适应 | 渲染为溢出格式化文本         |

修饰符糖 `x-badge.count` / `x-badge.dot` ≡ `type:'count'` / `type:'dot'`（显式 `type` 声明优先）。

<demo html="badge/basic.html"/>

### 溢出格式化（overflowCount）

`count > overflowCount` 时显示 `"${overflowCount}+"`（**严格大于**：99 → `99`，100 → `99+`）：

```html
<button x-badge="msgs" x-badge-options="{type:'count',overflowCount:9}">消息</button>
<!-- msgs = 10 时显示 "9+" -->
```

<demo html="badge/basic.html"/>

### 脉冲动画（ripple）

`ripple: true`（或 `x-badge.ripple` 修饰符）启用**常驻脉冲动画**，默认关闭。动画参考内置图标 `ripple` 的几何（中心点 + 双错相扩散渐隐环），载体按形态分派：

- **dot + ripple**：红点自边缘向外扩散双层渐隐环（SMIL 动画）；
- **count + ripple**：数字胶囊外的扩散环（CSS 动画）。

::: warning 与 x-ripple 指令的区别
`x-badge` 的 `ripple` 选项是**常驻脉冲动画**（徽标持续播发）；[`x-ripple`](./x-ripple.md) 指令是**点击涟漪扩散**（交互反馈）。同词不同面，两者可同宿主并用。
:::

系统开启「减弱动态效果」（`prefers-reduced-motion: reduce`）时动画自动停播（保留静态徽标）。

<demo html="badge/style.html"/>

### 颜色（color）

`color` 接受任意合法 CSS 颜色值，缺省走三级回退链：

```
var(--auto-danger-color, var(--autospark-badge-color, #ef4444))
```

即 theme 派生 danger 令牌 → 插件独立覆盖变量 `--autospark-badge-color` → 校准红色 `#ef4444`——接入 `@autospark/theme` 时随主题与暗色自动翻转，不接入则取插件变量或字面值。

<demo html="badge/style.html"/>

白色 1px 分离边由 `box-shadow` 承载（`--autospark-badge-outline` 可覆盖，默认 `#fff`），暗色主题下仍默认白——它是徽标与宿主内容的分离边，不随主题联动。

### 独立状态点

空宿主 + dot 即独立徽标形态——无内容宿主上红点就是全部（列表状态位、头像在线点等用法）：

```html
<span x-badge></span>
```

<demo html="badge/style.html"/>

### 运行时动态挂载

`x-badge` 走运行时通道（MutationObserver），**不经编译也能挂载**——engine 存活期间对观察根内元素动态 `setAttribute("x-badge", "")` 即生效，`removeAttribute` 即失效（徽标与宿主类立即清理）；动态插入带属性的元素同样生效：

```html
el.setAttribute("x-badge", "unread");                       // 挂载即生效
el.setAttribute("x-badge", "120");                          // 改值重新求值渲染
el.removeAttribute("x-badge");                              // 移除即失效
```

边界约定：

- 仅 engine 观察根内生效（`engine.el` 子树与覆盖层容器；x-isolate 子树归子引擎的观察器）；
- `x-badge-options` 在挂载时求值一次——运行时改配置值无效，须移除重加 `x-badge` 属性重挂；
- 插件脚本晚于首编译加载时，存量静态属性已被编译器剥除（见[注意事项](#注意事项)加载顺序契约）——运行时动态添加不受此限。

<demo html="badge/style.html"/>

## 配置选项

`x-badge-options` 为静态整包配置，**求值一次**——徽标参数是设计期配置，改值需重挂宿主。

| 配置项          | 默认值   | 修饰符    | 说明                                                     |
| --------------- | -------- | --------- | -------------------------------------------------------- |
| `type`          | `'dot'`  | `.count` / `.dot` | 展示形态：`'dot'` 小红点 / `'count'` 数字胶囊    |
| `overflowCount` | `99`     | —         | 溢出上限，`count > overflowCount` 显示 `"${overflowCount}+"`（正整数） |
| `color`         | 三级回退链 | —       | 徽标色（string，任意合法 CSS 颜色值；全局覆盖位 `--autospark-badge-color`） |
| `ripple`        | `false`  | `.ripple` | 常驻脉冲动画开关（reduced-motion 停播）                  |

非法取值不中断渲染：类型校验失败时警告并回退默认值。

::: info 关于指令配置体系
指令选项 / 修饰符 / 宿主选项 / 两层回退见[指令配置](../directive/config.md)。
:::

## 注意事项

- **加载顺序契约**：插件脚本须先于 engine 实例化加载。晚于首编译加载时，存量 DOM 上的 `x-badge` 属性已被编译器剥除，指令不生效（此后动态添加的宿主仍生效）。
- **静态求值一次**：`x-badge-options` 不响应式，改配置需重挂宿主；指令**值**（count 表达式）响应式。
- **定位兜底**：宿主 `position: static` 时自动兜底 `relative`（`:where()` 特异性 0，宿主自有定位规则可覆盖）；徽标右上角骑跨（`translate(38%,-38%)`），固定方位不开放配置。
- **无障碍**：徽标元素 `aria-hidden="true"`（纯视觉装饰不进读屏）——数字信息应由宿主内容或状态本身传达，读屏用户不依赖角标。
- **`badge` 同名不同物**：`x-ripple` / `x-spin` 的 `badge` 选项是装饰动效的**波纹角标载体**（波环动画的圆边宿主），与本指令的通用内容徽标不同物，勿混用。
- **样式钩子**：类钩子 `x-badge` / `x-badge-mark` / `x-badge-dot` / `x-badge-count` / `x-badge-ripple` / `x-badge-waves`，实例变量 `--x-badge-color`（宿主内联），全局覆盖位 `--autospark-badge-color`（缺省徽标色）/ `--autospark-badge-outline`（分离边色，默认白），供主题与业务层重载。
- **子元素选择器**：徽标直挂宿主内部末尾，宿主 `> *` 类选择器可能误中——必要时以 `:not(.x-badge-mark)` 排除。

---

下一步：装饰动效指令（涟漪扩散 / 色环旋转）见 [x-ripple](./x-ripple.md) 与 [x-spin](./x-spin.md)；插件接入机制见[插件开发](../plugin/index.md)。
