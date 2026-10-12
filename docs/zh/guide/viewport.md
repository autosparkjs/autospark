# 视口断点（Viewport）

## 概述

全局视口特性（[ADR-0105](https://github.com/zhangfisher/autospark/blob/main/packages/engine/docs/adr/0105-viewport-global-feature.md)）：引擎自动监测当前视口宽度落入的**断点档位**，作为全局响应式状态写入 **`$.viewport`**——应用内**任何位置**（任意元素、任意表达式、任意组件）都能直接订阅当前屏幕档位，无需声明、无需监听事件。

档位判定是全局事实：引擎构造期即同步写入初值（无首渲染空档），此后视口宽度跨越阈值时自动更新。配套在引擎根元素常驻 `data-viewport="<档名>"` 属性，作为纯 CSS 的档位钩子。

## 快速入门

```html
<div class="demo-app">
  <!-- 插值：直接读当前档名 -->
  <span>当前档位：{{ $.viewport }}</span>

  <!-- 响应式联动：按档显隐 -->
  <div x-show="$.viewport === 'md'">仅在 md 档可见</div>
  <div x-show="$.viewport === 'xs' || $.viewport === 'sm'">小屏内容</div>
</div>
```

```ts
new AutoSparkSpaces.AutoSpark(document.querySelector(".demo-app"), {});
// 无需任何视口相关配置——默认开启
```

<demo html="viewport/basic.html"/>

## 指南

### 断点档位

档位语义为 **mobile-forward `min-width`**（Bootstrap 5 对齐）：宽度 ≥ 档位阈值即命中该档，**当前档 = 命中档中最大者**。`xs` 是 < sm 的隐含兜底档、无阈值。

| 档位 | 阈值 | 说明 |
| --- | --- | --- |
| xs | —（<576 兜底） | 手机竖屏 |
| sm | ≥576px | 手机横屏 / 小平板 |
| md | ≥768px | 平板 |
| lg | ≥992px | 桌面 |
| xl | ≥1200px | 桌面大屏 |
| xxl | ≥1400px | 大屏显示器 |

视口宽度跨越阈值时 `$.viewport` 响应式更新（`matchMedia` 按档监听，只在跨越时触发）——订阅它的插值、`x-show`、`$watch`、action 表达式全部自动联动。

### 模板内订阅

```html
<!-- 按档切换布局方向 -->
<div :class="'layout-' + $.viewport">…</div>

<!-- 计算属性形态 -->
<div x-data="{ isMobile() { return $.viewport === 'xs' || $.viewport === 'sm' } }">
  <span x-show="isMobile()">移动端视图</span>
</div>
```

组件 `<script setup>` 内经 `this.globalState.$.viewport` 读取同样响应式。

### 根元素 data-viewport：纯 CSS 钩子

引擎根元素常驻 `data-viewport="<档名>"`（构造期写初值、跨档即改）——**不写 JS** 也能做按档样式：

```css
/* 全局档位驱动的样式切换 */
[data-viewport="xs"] .sidebar { display: none; }
[data-viewport="lg"] .page { max-width: 960px; }
```

与 [x-container](./directives/x-container.md) 宿主的 `data-breakpoint`（容器实例档位）两级并存：`data-viewport` 管全局、`data-breakpoint` 管单个容器。

### 与 x-container 的关系

[x-container](./directives/x-container.md)（Bootstrap `.container` 心智的断点宽度容器）消费同一个全局档位：宿主 `data-breakpoint` 即随 `$.viewport` 切换，按档 max-width 走纯 CSS media query（与本特性的判定同源同阈值）。「要档位状态」用本特性，「要断点宽度容器视觉」用 x-container，两者可独立使用。

「按档显隐元素」另有声明式糖 [x-viewport](./directives/x-viewport.md)（`x-viewport="md"` 仅 md 档可见、`.hide` 反向）——档位隐藏经 `!important` 类恒胜 x-show，组合规则见其指南。

## 配置选项

引擎构造选项 `options.viewport`，三态：

```ts
new AutoSpark(el, state, {
  // ① 缺省：默认开启 + 内置 Bootstrap 5 断点表
  // ② false：整体关闭——不监测、不写 $.viewport、不挂 data-viewport
  viewport: false,
  // ③ 配置对象：自定义阈值表（engine 级唯一真相）
  viewport: {
    breakpoints: { sm: 600, lg: 900 },   // 档位阈值表（number 按 px / '600px' 串；xs 无阈值）
    maxWidths: { sm: "560px", lg: "840px" }, // x-container 按档 max-width 的全局兜底表
  },
});
```

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| （整体） | 开启 | `false` 整体关闭（`tooltip: false` 同款三态惯例）；关闭后 `$.viewport` 不存在，读它得 `undefined` |
| `breakpoints` | 内置 Bootstrap 5 表 | **engine 级唯一阈值真相**——视口判定与 x-container 的 media 样式同源消费；各档**整表替换**（不做按键合并）；xs 入表 / 未知档名 / 非 px 阈值 warn + 忽略；整表无有效项回退内置表 |
| `maxWidths` | 内置表 | x-container 的 engine 级 max-width 兜底（实例 `x-container-options` 声明优先） |

构造期配置语义：运行时突变 `options.viewport` 不生效。

## 注意事项

- **只读约定**：`$.viewport` 是测量真相——外部写它不解释、不驱动任何布局，下次跨越阈值时自然被覆盖。
- **`$` 是保留键**：`state.$` 是引擎内部状态容器（`$.viewport` 是其首个居民）；用户 state 顶层不要使用 `$` 键——构造期发现即 warn + 删除；`x-data` 域内定义 `$` 数据键会遮蔽全局档位读（保留键约定）。
- **无 SSR**：特性依赖 `matchMedia`，无此 API 的环境 warn 一次、`$.viewport` 不可用。
- **destroy 语义**：引擎销毁后 mql 监听反注册、根元素 `data-viewport` 摘除；`$.viewport` 键残留在 state（保留键不清）。
- **域内遮蔽自查**：模板读到 `$.viewport` 为 `undefined` 时，先查是否有 `x-data` 域定义了 `$` 键遮蔽了全局读。
