# x-viewport 视口档位显隐

## 概述

视口档位显隐指令（[ADR-0106](https://github.com/zhangfisher/autospark/blob/main/packages/engine/docs/adr/0106-x-viewport-directive.md)）：`$.viewport`（[视口断点](../viewport.md)全局档位）的**声明式显隐糖**——`x-viewport="md"` 仅 md 档可见、`x-viewport="xs,sm"` 多档可见、`x-viewport.hide="md"` 除 md 外可见。

与 [x-show](./x-show.md) 的关系：x-viewport 内部订阅全局 `$.viewport` 判定，但显隐走**独立的类通道**（挂 `autospark-viewport-hidden` 类 = `display:none !important`），不碰 inline display——与 x-show 同元素组合时**档位隐藏恒胜**，x-show 的显隐 / 动画 / 用户 CSS 只在档位可见时有话语权。与 [x-if](./x-if.md)（条件存在性，摘 DOM）正交。

<demo html="viewport/hide.html"/>

::: tip 插件指令
`x-viewport` 由官方插件包 `@autospark/plugins` 提供（ADR-0128 核心集外移），使用前须加载插件脚本，且**先于 engine 实例化**：

```html
<script src="/autospark/autospark.js"></script>
<script src="/autospark/autospark.layout.js"></script>
```

npm 场景：`npm install @autospark/plugins` 后自 `node_modules/@autospark/plugins/dist/` 复制所需产物进项目（本包仅 IIFE 产物，无 ESM import 通道，ADR-0128）；CDN 直引把上例 `src` 换为 `https://unpkg.com/@autospark/plugins/dist/autospark.layout.js`。

未加载插件时 `x-viewport` 属性会被编译器当作普通属性剥除，指令不生效。`autospark.layout.js` 同时包含布局家族全部指令（x-layout / x-pane / x-splitter / x-expandable / x-resizable / x-container / x-viewport），加载一次即全家族可用。聚合产物 `autospark.plugins.js` 一个标签包含全部官方插件。
:::

## 快速入门

```html
<!-- 仅 md 档可见 -->
<div x-viewport="md">仅在 md 档可见</div>

<!-- 多档可见（逗号分隔） -->
<div x-viewport="xs,sm">小屏内容</div>

<!-- 反向：除 lg 外可见 -->
<div x-viewport.hide="lg">lg 大屏上藏掉</div>
```

隐藏 = 挂 `autospark-viewport-hidden` 类（`display:none !important`），可见 = 摘类；拖动浏览器宽度即可观察显隐切换。

<demo html="viewport/hide.html"/>

## 指南

### 指令值

值为**档名列表**（逗号分隔，空白容忍）：当前档位落在列表内即可见，否则隐藏。合法档名固定六档枚举 `xs / sm / md / lg / xl / xxl`（自定义 `options.viewport.breakpoints` 只改阈值、不改枚举）。

**空值 / 全部无效档名**：warn + 指令整体忽略（元素恒可见）；**未知档名**：静默跳过（不告警）——`x-viewport="md,foo"` 中 `md` 照常生效。

### `.hide` 反向

`.hide` 修饰符翻转语义：列出档**隐藏**、其余可见——「md 大屏上藏掉它」比五档列举直观：

```html
<div x-viewport.hide="lg">除 lg 外可见</div>
```

<demo html="viewport/hide.html"/>

### 与 x-show / x-if 组合

x-viewport 与 [x-show](./x-show.md) / [x-if](./x-if.md) 正交，可同元素组合：

```html
<!-- 组合：档位隐藏恒胜——x-show 只在 md 档内有话语权 -->
<div x-viewport="md" x-show="expanded">…</div>
```

组合规则一句话：**档位隐藏恒胜**（`!important` 类）——`x-show` 的 inline display、进出场动画、用户 CSS 全部只在档位可见时生效。x-viewport 自身不参与动画编排（要动画用表达式形态 `x-show="['md'].includes($.viewport)"`）。

<demo html="viewport/hide.html"/>

### 失效语义

全局档位不可知时（`options.viewport: false` 关闭 / 环境无 `matchMedia` / `$.viewport` 被违约写入非法值）指令**静默失效**：不做任何显隐动作（正向 / 反向均恒可见），**零告警**——不添乱原则。域内 `x-data` 定义 `$` 键会遮蔽全局档位读（保留键约定，见[视口断点](../viewport.md)）。

## 配置选项

**宿主级 `x-viewport-options`**：

| 配置项 | 默认值 | 修饰符 | 说明 |
| --- | --- | --- | --- |
| `hide` | `false` | `.hide` | 反向语义：列出档隐藏、其余可见 |

无其他配置项——档位判定直接消费全局 `$.viewport`，阈值表在引擎级 `options.viewport.breakpoints`（见[视口断点](../viewport.md)）。

## 注意事项

- **档位隐藏恒胜**：`!important` 类无法被用户 CSS 覆盖——这是"档位显隐"的语义强度（Bootstrap `d-none` 同款取舍）；需要可覆盖的隐藏用 x-show 表达式形态。
- **无动画**：切类不经 animate 编排；需要进出场动画用 `x-show="$.viewport === 'md'"` 表达式形态（继承 `x-show-options.animate`）。
- **宿主永留 DOM**：隐藏只是 `display:none`——子树仍渲染、watcher 仍存活、表单仍提交；要存在性（摘 DOM 省渲染）用 `x-if="['md'].includes($.viewport)"`。
- **失效即恒可见**：档位未知时元素不会被隐藏（零告警）——依赖档位隐藏的关键内容不要假设 `viewport: false` 场景下仍会隐藏。
- **与 `$.viewport` 的分工**：本指令只做"档位 → 显隐"映射；需要把档位用于非显隐逻辑（换 class、算布局）直接订阅 `$.viewport`（见[视口断点](../viewport.md)）。
