# x-container 响应式容器

## 概述

响应式容器指令（[ADR-0101](https://github.com/zhangfisher/autospark/blob/main/packages/engine/docs/adr/0101-x-container.md) 立、[ADR-0105](https://github.com/zhangfisher/autospark/blob/main/packages/engine/docs/adr/0105-viewport-global-feature.md) 重写）：`x-container` 宿主获得 Bootstrap `.container` 心智的视觉契约——`width:100%` + **按断点档位切换的 max-width** + 居中 + gutter 内边距。

**档位真相全局唯一**（ADR-0105）：断点判定由全局[视口断点特性](../viewport.md)完成并写入 `$.viewport`，本指令**不做任何断点判定**——只订阅 `$.viewport` 切换宿主常驻的 `data-breakpoint` 属性，视觉约束（按档 max-width）走纯 CSS media query。需要感知档位的模板逻辑请直接订阅 `$.viewport`（见[视口断点](../viewport.md)）。

与 [x-layout](./x-layout.md) 分工：x-layout 管页内 Grid 骨架（布局容器），x-container 管断点宽度容器；与 CSS 原生 `@container`（容器查询）亦无关——判定基准恒为**视口宽度**，元素级响应请用 CSS 原生容器查询。

<demo html="container/basic.html"/>

::: tip 插件指令
`x-container` 由官方插件包 `@autospark/plugins` 提供（ADR-0128 核心集外移），使用前须加载插件脚本，且**先于 engine 实例化**：

```html
<script src="/autospark/autospark.js"></script>
<script src="/autospark/autospark.layout.js"></script>
```

npm 场景：`npm install @autospark/plugins` 后自 `node_modules/@autospark/plugins/dist/` 复制所需产物进项目；CDN 直引把上例 `src` 换为 `https://unpkg.com/@autospark/plugins/dist/autospark.layout.js`。

未加载插件时 `x-container` 属性会被编译器当作普通属性剥除，指令不生效。`autospark.layout.js` 同时包含布局家族全部指令（x-layout / x-pane / x-splitter / x-expandable / x-resizable / x-container / x-viewport），加载一次即全家族可用。聚合产物 `autospark.plugins.js` 一个标签包含全部官方插件。
:::

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

**无值语义**——`x-container` 恒为纯视觉容器，属性值留空；任何非空值被忽略（ADR-0105 起无档名写回）。需要档位状态请直接订阅全局 `$.viewport`（见下文「档位联动」）。

```html
<div x-container></div>
```

### 断点档位

档位语义为 **mobile-forward `min-width`**：宽度 ≥ 档位阈值即命中该档，**当前档 = 命中档中最大者**（如视口 1000px：命中 xs/sm/md/lg，当前档 `lg`）。`xs` 是 < sm 的**隐含兜底档**、无阈值。判定基准恒为**视口宽度**，由全局视口特性统一监测（`matchMedia` 按档监听，跨越才触发）。

| 档位 | 阈值 | 容器 max-width（默认） |
| --- | --- | --- |
| xs | —（<576 兜底） | 100% |
| sm | ≥576px | 540px |
| md | ≥768px | 720px |
| lg | ≥992px | 960px |
| xl | ≥1200px | 1140px |
| xxl | ≥1400px | 1320px |

<demo html="container/basic.html"/>

### 档位联动：data-breakpoint 与 $.viewport

宿主常驻 `data-breakpoint="<档名>"` 属性——纯 CSS 也能按档定制子元素：

```css
[data-breakpoint="md"] .sidebar { display: none; }
```

档位联动**直接订阅全局 `$.viewport`**（ADR-0105 起无值写回与 `viewport:change` 事件）——任意元素、任意表达式可及，无需依赖容器：

```html
<div x-container>
  <div x-show="$.viewport === 'md'">仅在 md 档可见</div>
  <span>当前档：{{ $.viewport }}</span>
</div>
```

全局档位同时写在引擎根元素 `data-viewport` 属性上，CSS 可按全局档定制任意元素：

```css
[data-viewport="md"] .compact-nav { display: none; }
```

<demo html="container/basic.html"/>

### 自定义断点与 max-width

**阈值表 `breakpoints` 是 engine 级唯一真相**（`options.viewport.breakpoints`）——视口档位判定与本指令的 media 样式同源消费，实例级自定义已废除（会与全局 `$.viewport` 档位语义打架）。**`maxWidths` 是实例级**（按档 max-width 视觉，各自整表替换不合并）：

```html
<div x-container x-container-options="{ maxWidths:{ sm:'560px', lg:'840px' } }"></div>
```

```ts
// 引擎构造选项：阈值表全站唯一 + max-width 全局兜底（实例声明优先）
new AutoSpark(el, state, {
  viewport: { breakpoints: { sm: 600, lg: 900 }, maxWidths: { sm: "560px", lg: "840px" } },
});
```

- `maxWidths` 回退链：实例 `x-container-options` / 宿主 `x-options` → `options.viewport.maxWidths` → 内置缺省表；
- 与「内置阈值 × 内置 max-width」不一致的组合按内容指纹去重注入一份 scoped 样式（同表多实例共享），阈值用内置表且未自定义 max-width 时直接共享全局样式表。

<demo html="container/custom.html"/>

### `.fluid` 通栏

`.fluid` 修饰符关闭按档 max-width（恒 100% 通栏），`data-breakpoint` 照常——「纯状态探针 + 无约束容器」用法（只要档位属性、不要宽度约束时用）：

```html
<div x-container.fluid></div>
```

<demo html="container/custom.html"/>

## 配置选项

**宿主级 `x-container-options`**：

| 配置项 | 默认值 | 修饰符 | 说明 |
| --- | --- | --- | --- |
| `maxWidths` | 内置表（540/720/960/1140/1320） | — | **对象**，按档 max-width 表（值 = number 按 px 或任意 CSS 长度串），**整表替换**；未声明档无规则（CSS 级联语义：低档规则延续） |
| `fluid` | `false` | `.fluid` | 关闭按档 max-width（恒 100% 通栏），`data-breakpoint` 照常 |

引擎级 `options.viewport`（构造选项，见[视口断点](../viewport.md)）：`breakpoints`（阈值表，**engine 级唯一真相**，本指令 media 样式同源消费）+ `maxWidths`（全局兜底）。~~`options.container` 与实例级 `breakpoints` 已废除~~（ADR-0105）。

## 注意事项

- **居中不可关**：`margin-inline:auto` 是容器契约的一部分（想不居中就别用容器）；gutter 内边距经 CSS 变量 `--autospark-container-gutter` 定制（默认 `0.75rem`）。
- **整表替换语义**：声明 `maxWidths` 即全表生效——想微调一档也要把整表写全（回退不合并，与引擎选项回退链惯例一致）。
- **阈值只收 px 形态**：阈值进 media query 需确定像素值，`rem` / `%` 不可（warn + 忽略）；`maxWidths` 值进 CSS 声明，任意长度形态都收。
- **无值写回、无事件**：档位联动统一走 `$.viewport` 响应式订阅（x-show / 插值 / watch 全通）；旧 `x-container="path"` 写回与 `@viewport:change` 已废除（ADR-0105）。
- **`options.viewport: false` 时**：全局档位状态不存在，`data-breakpoint` 缺席；media 视觉约束与 JS 无关、照常生效（CSS 原生）。
- **命名消歧**：本指令与 x-layout（布局容器 / Grid 骨架）、CSS 原生 `@container` 容器查询均无关；判定只按视口——元素级响应（侧栏内容器按自身宽度变化）请用 CSS 原生容器查询（见 ADR-0101 决策 4 与修订记录）。
