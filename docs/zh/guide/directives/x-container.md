# x-container 响应式容器

## 概述

响应式容器指令（[ADR-0101](https://github.com/zhangfisher/autospark/blob/main/packages/engine/docs/adr/0101-x-container.md)）：`x-container` 宿主获得 Bootstrap `.container` 心智的视觉契约——`width:100%` + **按断点档位切换的 max-width** + 居中 + gutter 内边距；同时是一个**响应式状态源**——把当前档名暴露给状态与其他指令联动。页面最外层的内容容器、以及「模板逻辑需要感知当前屏幕档位」的场景。

与 [x-layout](./x-layout.md) 分工：x-layout 管页内 Grid 骨架（布局容器），x-container 管断点宽度容器；与 CSS 原生 `@container`（容器查询）亦无关——判定基准恒为**视口宽度**，元素级响应请用 CSS 原生容器查询。

<demo html="container/basic.html"/>

## 快速入门

```html
<div x-container>
  <!-- 视口 ≥992px 时本容器 max-width:960px 并水平居中；收窄自动切档 -->
</div>
```

- 默认断点表与 Bootstrap 5 对齐：`sm:576 / md:768 / lg:992 / xl:1200 / xxl:1400`，对应容器 max-width `540 / 720 / 960 / 1140 / 1320`（px），`xs`（<576）通栏；
- 视觉约束走纯 CSS media query（零 JS 布局开销），拖动浏览器宽度即可观察切档。

<demo html="container/basic.html"/>

## 指南

### 指令值

值双态（与 [x-resizable](./x-resizable.md) 同构）：

#### 空值（纯视觉容器）

```html
<div x-container></div>
```

只应用视觉契约，不产生任何状态联动。

#### 状态路径（档名写回）

```html
<div x-container="ui.viewport"></div>
```

当前档名（`"xs"` / `"sm"` / `"md"` / `"lg"` / `"xl"` / `"xxl"` 字符串）随切换**实时单向写回**——档位是测量真相，外部对绑定路径的写不解释、不反向驱动布局（区别于 [x-model](./x-model.md) 的双向）。非简单路径的值（含运算符 / 函数调用）warn 一次后忽略写回，视觉契约照常。

### 断点档位

档位语义为 **mobile-forward `min-width`**：宽度 ≥ 档位阈值即命中该档，**当前档 = 命中档中最大者**（如视口 1000px：命中 xs/sm/md/lg，当前档 `lg`）。`xs` 是 < sm 的**隐含兜底档**、无阈值——写入阈值表 warn + 忽略。判定基准恒为**视口宽度**（Bootstrap 心智，全页一致）：视觉约束走纯 CSS media query（零 JS 布局开销），档位状态走 `matchMedia` 监听（跨越才触发）。

| 档位 | 阈值 | 容器 max-width（默认） |
| --- | --- | --- |
| xs | —（<576 兜底） | 100% |
| sm | ≥576px | 540px |
| md | ≥768px | 720px |
| lg | ≥992px | 960px |
| xl | ≥1200px | 1140px |
| xxl | ≥1400px | 1320px |

<demo html="container/basic.html"/>

### 自定义断点表

两张表经 `x-container-options` 声明、**各自整表替换**（不做按键合并）：`breakpoints`（阈值表）与 `maxWidths`（按档 max-width 表）。全站统一改表走引擎构造选项 `options.container`（实例声明优先于它）：

```html
<div x-container
     x-container-options="{ breakpoints:{ sm:600, lg:900 }, maxWidths:{ sm:'560px', lg:'840px' } }">
</div>
```

```ts
// 引擎级全局默认（实例未声明时兜底）
new AutoSpark(el, state, {
  container: { breakpoints: { sm: 600, lg: 900 }, maxWidths: { sm: "560px", lg: "840px" } },
});
```

三级回退：实例 `x-container-options` / 宿主 `x-options` → `options.container` → 内置 Bootstrap 5 缺省表。与缺省表不同的自定义表会按内容指纹去重注入一份 scoped 样式（同表多实例共享）。

<demo html="container/custom.html"/>

### 档位联动：data-breakpoint 与档名写回

宿主**无论是否绑定值**都常驻 `data-breakpoint="<档名>"` 属性——纯 CSS 也能按档定制子元素：

```css
[data-breakpoint="md"] .sidebar { display: none; }
```

绑定状态路径时，档名随切换实时写回（单向）——声明式联动直接消费该状态：

```html
<div x-show="ui.viewport === 'md'">仅在 md 档可见</div>
```

<demo html="container/basic.html"/>

### 事件：viewport:change

档位**跨越**时派发 `viewport:change`（`detail = { from, to }` 档名字符串），**向下传播**——`@viewport:change` 声明在**容器子树内的任意元素**上都能收到（响应视口变化的通常是容器内部的组件），宿主自身与祖先照常经冒泡收到，派发顺序先下后上。派发语义：

- 一次跨越**多个档位只派发一次**（`from` = 跨越前档、`to` = 落定档）；
- **首值同步不派发**（监听编译期才建立，初值经写回 / `data-breakpoint` 读取）；
- 每个监听元素恰好收到一次；嵌套容器各自独立派发（同刻跨档时内部监听会收到多层事件）；
- 事件与状态写回是正交通道：声明式联动用写回，命令式监听用事件。

```html
<div x-container="ui.viewport">
  <div @viewport:change="tick++">容器内部——向下传播可及</div>
</div>
```

<demo html="container/event.html"/>

### `.fluid` 通栏

`.fluid` 修饰符关闭按档 max-width（恒 100% 通栏），档位判定、`data-breakpoint`、写回与事件**照常**——「纯状态探针 + 无约束容器」用法（只要断点状态、不要宽度约束时用）：

```html
<div x-container.fluid="ui.viewport"></div>
```

<demo html="container/custom.html"/>

## 配置选项

**宿主级 `x-container-options`**：

| 配置项 | 默认值 | 修饰符 | 说明 |
| --- | --- | --- | --- |
| `breakpoints` | 内置 Bootstrap 5 表 | — | **对象**，档位阈值表（键 = 档名、值 = number 按 px 或 `'576px'` 串），**整表替换**。xs 无阈值（声明 warn + 忽略）；非 px 形态（rem/%）阈值 warn + 忽略；整表无效回退内置表 |
| `maxWidths` | 内置表（540/720/960/1140/1320） | — | **对象**，按档 max-width 表（值 = number 按 px 或任意 CSS 长度串），**整表替换**；未声明档无规则（CSS 级联语义：低档规则延续） |
| `fluid` | `false` | `.fluid` | 关闭按档 max-width（恒 100% 通栏），档位通道照常 |

引擎级 `options.container`（构造选项）承载 `{ breakpoints, maxWidths }` 全局默认，语义同上表同名键。

## 注意事项

- **居中不可关**：`margin-inline:auto` 是容器契约的一部分（想不居中就别用容器）；gutter 内边距经 CSS 变量 `--autospark-container-gutter` 定制（默认 `0.75rem`）。
- **整表替换语义**：声明 `breakpoints` / `maxWidths` 即全表生效——想微调一档也要把整表写全（回退不合并，与引擎选项回退链惯例一致）。
- **阈值只收 px 形态**：阈值进 media query 需确定像素值，`rem` / `%` 不可（warn + 忽略）；`maxWidths` 值进 CSS 声明，任意长度形态都收。
- **写回是单向的**：外部改绑定路径不会驱动任何布局变化（档位由视口宽度测量决定）。
- **`viewport:change` 初值静默**：首次同步不派发（编译顺序可靠性），需要初值就读绑定状态或 `data-breakpoint`。
- **命名消歧**：本指令与 x-layout（布局容器 / Grid 骨架）、CSS 原生 `@container` 容器查询均无关；判定只按视口——元素级响应（侧栏内容器按自身宽度变化）请用 CSS 原生容器查询（见 ADR-0101 决策 4 与修订记录）。
