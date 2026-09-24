# 动画

## 概述

结构指令（[x-if](./directives/x-if.md) / [x-show](./directives/x-show.md) / [x-for](./directives/x-for.md) / [x-switch](./directives/x-switch.md)）显隐切换时的**进出场动画**：挂载播进场、卸载播离场（离场动画期间元素延迟移除），由各指令的 `animate` 选项声明。内置 `fade` / `slide` / `expand` 三个开箱即用的动画，自定义动画只需按约定写 CSS、零注册。

```html
<button @click="toggle">切换</button>
<div x-if="on" x-if-options="{animate:'fade'}">淡入淡出</div>
```

::: tip 与 `:style` 的 `.transition` 修饰符正交
`.transition`（[x-style](./directives/x-style.md)）是「**值在变**」——内联样式变化的 CSS 属性过渡；`animate` 是「**元素在进出**」——挂载/卸载的转场。二者作用于不同层面，可同时使用。
:::

## 快速入门

用进出场动画从零搭一个完整的**手风琴组件**——分四步，每步只加一层能力。

### 第 1 步：列表骨架（x-for 渲染条目）

数据驱动渲染手风琴条目，先不管展开：

```html
<div class="accordion" x-for="item of items" :key="item.id">
  <div class="acc-item">
    <div class="acc-head">
      <span x-text="item.title"></span>
      <span class="acc-arrow">▸</span>
    </div>
    <div class="acc-body"><!-- 展开体，第 2 步实现 --></div>
  </div>
</div>
```

```javascript
const engine = new AutoSpark(el, {
  items: [
    { id: 1, title: "什么是 AutoSpark？", content: "声明式模板渲染引擎……" },
    { id: 2, title: "动画怎么声明？", content: "结构指令的 animate 选项……" },
    { id: 3, title: "展开为什么平滑？", content: "grid-template-rows 过渡……" },
  ],
});
```

`x-for` 容器渲染一次、`acc-item` 作为项模板整体重复；`:key` 用业务 id 保证增删时条目身份稳定。

### 第 2 步：点击展开 / 收起（@click + x-if）

加一个 `open` 状态与 `toggle` 动作（**单开**手风琴：点另一项切换展开、再点同一项收起），展开体的显隐交给 `x-if`：

```html
<div class="acc-head" @click="toggle(item.id)">
  <span x-text="item.title"></span>
  <span class="acc-arrow">▸</span>
</div>
<div class="acc-body" x-if="open === item.id">
  <div class="acc-content" x-text="item.content"></div>
</div>
```

```javascript
// state 增加 open（当前展开项 id；null = 全收起），actions 增加 toggle
actions: {
    toggle: (id) => {
        engine.state.open = engine.state.open === id ? null : id;
    },
},
```

此时功能已完整，但显隐是**直出直入**——展开体瞬间占满高度，下方条目被瞬间推开，收起时高度瞬跳。

### 第 3 步：展开动画（自定义 col + animate 选项）

按六类名契约写一个 `col` 展开动画（高度 0 ↔ auto，见[避免高度跳动](#避免高度跳动)配方三），再在 `x-if` 上声明一行选项接入：

```css
.col-enter-active,
.col-leave-active {
  display: grid;
  grid-template-rows: 1fr;
  transition:
    grid-template-rows 0.3s ease,
    opacity 0.3s ease;
}
.col-enter-from,
.col-leave-to {
  grid-template-rows: 0fr;
  opacity: 0;
}
.col-enter-active > *,
.col-leave-active > * {
  overflow: hidden;
}
```

```html
<div class="acc-body" x-if="open === item.id" x-if-options="{animate:'col'}">
  <div class="acc-clip">
    <div class="acc-content" x-text="item.content"></div>
  </div>
</div>
```

`grid-template-rows: 0fr ↔ 1fr` 让高度在 0 与内容高度之间平滑过渡——下方条目被平滑推开 / 收回。三条硬性约束（违反则收起收不到 0 / 高度不塌陷）：动画宿主**恰好一个子元素**；子元素（裁剪层）高度**内容驱动**且**不带 padding**——显式 `height` 或 padding 都会垫住 `0fr` 行（padding 计入盒高贡献，收起会停在 padding 高度，移除瞬间跳变）；需要内边距就再加一层（`acc-clip` 只管裁剪，`acc-content` 承载 padding）。

### 第 4 步：箭头指示（可选补强）

箭头随展开旋转 90°，与展开体动画同步：

```html
<span class="acc-arrow" :class="open === item.id ? 'acc-arrow on' : 'acc-arrow'">▸</span>
```

```css
.acc-arrow {
  transition: transform 0.2s ease;
  display: inline-block;
}
.acc-arrow.on {
  transform: rotate(90deg);
}
```

箭头旋转是纯 CSS `transition`（**值在变**），与进出场动画（**元素在进出**）正交，各走各的通道。

### 完整示例

四步合并（外观样式见 demo 源码）：

<demo html="animate/accordion.html"/>

```html
<div class="accordion" x-for="item of items" :key="item.id">
  <div class="acc-item">
    <div class="acc-head" @click="toggle(item.id)">
      <span x-text="item.title"></span>
      <span class="acc-arrow" :class="open === item.id ? 'acc-arrow on' : 'acc-arrow'">▸</span>
    </div>
    <div class="acc-body" x-if="open === item.id" x-if-options="{animate:'col'}">
      <div class="acc-clip">
        <div class="acc-content" x-text="item.content"></div>
      </div>
    </div>
  </div>
</div>
```

### 总结

- **分层清晰**：`x-for` 管结构、`open` + `toggle` 管状态、`x-if` 管存在性、`animate` 管动画——全程零手动 DOM 操作，交互逻辑收敛在一个 8 行的 action 里；
- **动画是增强不是耦合**：去掉 `x-if-options` 组件照常工作，加上即得平滑展开——进出场动画只作用于挂载 / 卸载时机，不侵入组件逻辑；
- **高度平滑的关键**是配方三（`grid-template-rows: 0fr ↔ 1fr`）及其三条约束：单子元素 + 内容驱动高度 + padding 不放裁剪层；
- 想改**多开**手风琴：把 `open` 换成集合（如 `opens` 数组），判定改 `opens.includes(item.id)`、toggle 改增删元素即可。

内置动画则一行即用，四指令同一写法：

<demo html="animate/basic.html"/>

```html
<div x-if="on" x-if-options="{animate:'fade'}">条件存在性 + 淡入淡出</div>
<div x-show="on" x-show-options="{animate:'slide'}">条件可见性 + 上滑浮入</div>
```

`animate` 读取遵循[指令配置](./directive.md#指令配置)的回退链：指令选项 → 宿主选项（`x-options` 中的 `animate` 同样生效）。

## 指南

### 配置形态

`animate` 支持三种形态（值为 relaxed-json）：

**字符串**——进出同名：

```html
<div x-if="on" x-if-options="{animate:'fade'}"></div>
```

**对象**——指定动画名与参数（`duration` / `delay` / `easing` 经内联样式同时覆盖 CSS 中的 transition 与 animation 属性）：

```html
<div x-if="on" x-if-options="{animate:{name:'slide',duration:500,easing:'ease-out'}}"></div>
```

**分相覆盖**——`enter` / `leave` 各自独立配置（字符串 | 对象 | `false` 单相禁用），未指定的相位回退顶层参数：

```html
<!-- 进场上滑、离场淡出 -->
<div x-show="on" x-show-options="{animate:{enter:'slide',leave:'fade'}}"></div>

<!-- 只动画进场，离场直接消失 -->
<div x-if="on" x-if-options="{animate:{enter:'fade',leave:false}}"></div>
```

### 自定义动画

自定义动画 = 按约定命名写 CSS 类，传名即用（与 Vue transition 同构的六类名契约）：

<demo html="animate/custom.html"/>

```html
<style>
  /* 进场：起始态 → 过渡属性 */
  .zoom-enter-from {
    opacity: 0;
    transform: scale(0.8);
  }
  .zoom-enter-active {
    transition:
      opacity 0.3s,
      transform 0.3s;
  }
  /* keyframe 型也支持：.zoom-enter-active { animation: my-zoom 0.3s; } */
</style>

<div x-if="on" x-if-options="{animate:'zoom'}">缩放浮入</div>
```

六类名的挂摘时序：

| 阶段       | 挂载的类                                    |
| ---------- | ------------------------------------------- |
| 进场起始帧 | `{name}-enter-from` + `{name}-enter-active` |
| 进场过渡帧 | `{name}-enter-active` + `{name}-enter-to`   |
| 离场起始帧 | `{name}-leave-from` + `{name}-leave-active` |
| 离场过渡帧 | `{name}-leave-active` + `{name}-leave-to`   |
| 结束       | 全部移除（离场元素此刻真正离开 DOM）        |

动画结束由 `transitionend` / `animationend` 判定（内置超时兜底），自定义 CSS 无需额外声明。

### 避免高度跳动

进出场动画期间的高度跳动有三个来源：

1. **进场瞬时占位**——元素插入即占满布局高度（`transform` / `opacity` 不参与布局），下方内容瞬间被推开，动画只是视觉上的淡入；
2. **离场延迟移除**——离场动画期间元素仍占位，播完移除时容器高度才塌落（跳动被「延迟」到动画结束时刻）；
3. **分支共演堆叠**（最明显）——x-switch / x-else-if 切换时新旧分支短暂同处文档流，容器高度短暂 = 旧 + 新之和。

三个纯 CSS 配方按场景选用（下列均已在 Chrome 实测）：

<demo html="animate/height.html"/>

### 内置 expand

来源 1/2（进场瞬时占位 / 离场延迟移除）最省事的解法是内置 `expand`——引擎测量内容高度做 `height` 0↔auto 过渡，**无需任何 CSS**：

```html
<div class="acc-body" x-if="open === item.id" x-if-options="{animate:'expand'}">…</div>
```

与配方三（grid 0fr/1fr）的效果等同，但没有它的三条硬性约束（单子元素 / 内容驱动高度 / padding 分层）——多子元素、任意 padding 都照常工作。[x-tree](./directives/x-tree.md) 的展开/折叠默认即 `expand`。配方三适合坚持纯 CSS 或需要与自定义类动画组合的场景。

### 离场绝对定位

离场元素立即退出文档流（浮在原位淡出），容器即刻落到新内容的高度：

```css
/* 包裹层（x-switch 宿主的父级）提供定位上下文 */
.tab-wrap {
  position: relative;
}
/* 离场中的分支不再占位 */
.tab-wrap .fade-leave-active {
  position: absolute;
  width: 100%;
}
```

新旧分支高度相同或相近时完全平滑；高度不同则容器**一次到位**落在新分支的高度，不再出现「旧 + 新」双高。

### grid 同格叠放

包裹层作 grid、子元素全部叠同一格——新旧分支**重叠**而非堆叠，容器高度始终取两者较高者：

```css
.tab-stack {
  display: grid;
}
.tab-stack > * {
  grid-area: 1/1;
  margin: 0;
}
```

新旧分支同时淡入淡出形成真正的 cross-fade，推荐用于 tab / 分支切换（`margin: 0` 归零叠放元素的边距——外边距会计入行高，破坏「取较高者」的预期）。

### 手风琴展开/收起

`grid-template-rows: 0fr ↔ 1fr` 让高度在 0 与 auto 之间平滑过渡（下方内容被平滑推开/收回），经自定义动画声明：

```css
.col-enter-active,
.col-leave-active {
  display: grid;
  grid-template-rows: 1fr;
  transition:
    grid-template-rows 0.3s ease,
    opacity 0.3s ease;
}
.col-enter-from,
.col-leave-to {
  grid-template-rows: 0fr;
  opacity: 0;
}
.col-enter-active > *,
.col-leave-active > * {
  overflow: hidden;
}
```

```html
<div x-if="on" x-if-options="{animate:'col'}">
  <div>
    <!-- 裁剪层：overflow:hidden 由动画类注入，自身不要加 padding -->
    <div>高度由内容决定的任意内容（padding 加在这一层）</div>
  </div>
</div>
```

三条硬性约束：

- 动画宿主**恰好一个子元素**——多个子节点会形成多行 grid track，`0fr` 只作用于第一行；
- 子元素高度须**内容驱动**——显式 `height`（如 `height:140px`）会垫住 `0fr` 行（定高子项的 min-content 贡献使行高无法塌到 0），要定高请改用 `min-height`；
- **padding 不放在裁剪层（直接子元素）上**——padding 同样计入子元素的盒高贡献，把 `0fr` 行垫在 padding 高度（收起收不到 0，移除瞬间产生跳变）；需要内边距时加一层（宿主 → 裁剪层 → 内容层），padding 放最内层。

### 高度展开 + 视觉滑动

内置 `slide` 只动画 `transform` / `opacity`（不参与布局，边界有瞬跳，见本节开头的来源 1/2）。把 `transform` 并入配方三的 transition，**高度展开与上滑浮入同时发生**（`transform` 与 `grid-template-rows` 可共存于同一过渡，已实测）：

```css
.scol-enter-active,
.scol-leave-active {
  display: grid;
  grid-template-rows: 1fr;
  transition:
    grid-template-rows 0.3s ease,
    transform 0.3s ease,
    opacity 0.3s ease;
}
.scol-enter-from,
.scol-leave-to {
  grid-template-rows: 0fr;
  opacity: 0;
  transform: translateY(-12px);
}
.scol-enter-active > *,
.scol-leave-active > * {
  overflow: hidden;
}
```

### 行为语义

- **首次渲染静默**：引擎初次编译不播动画，只有**状态变化**引起的挂载/卸载才动画（x-for 首渲 N 项不会整队 fade-in）。
- **抢占**：动画播到一半状态又翻转时，在播动画立即取消（离场的延迟移除同步完成）、按新状态全新处理、新动画从头播——快速连点不会错乱。
- **分支共演**：x-switch / x-else-if 切换时旧分支离场与新分支进场**同时**进行，两者短暂同处文档流，容器高度会跳动——平滑方案见[避免高度跳动](#避免高度跳动)。
- **keepalive 同权**：`x-if.keepalive` / `x-switch.keepalive` 的保活切换播同样的进出场动画。
- **x-empty 同权**：x-for 的空状态挂载/卸载与列表项一样播动画。
- **无障碍降级**：用户偏好减弱动效时，一行 CSS 即可全局降级（引擎按 0 时长立即完成，天然兼容）：

```css
@media (prefers-reduced-motion: reduce) {
  .fade-enter-active,
  .fade-leave-active,
  .slide-enter-active,
  .slide-leave-active {
    transition: none;
  }
}
```

## 内置动画

| 名称     | 效果                                                                            | 默认时长 |
| -------- | ------------------------------------------------------------------------------- | -------- |
| `fade`   | 透明度淡入淡出                                                                  | 300ms    |
| `slide`  | 上滑浮入（translateY -12px → 0 + 淡入），离场反向                               | 300ms    |
| `expand` | **高度过渡**（0 ↔ 内容高度 + 淡入）——布局参与动画，后续内容平滑跟随，无高度跳动 | 300ms    |

`fade` / `slide` 的样式由引擎自动注入（裸类名 `.fade-enter-active` 等），**可被你的同名 CSS 覆盖**——给 `.slide-enter-active` 写自己的规则即可定制内置动画的时长/缓动。`expand` 经 JS 测量内容高度做 `height` inline 过渡（from/to 是动态值，无法用静态 CSS 类表达），无需类 CSS；[x-tree](./directives/x-tree.md) 默认启用它作为展开/折叠动画。

## 注意事项

- **x-for 仅项级进出**：新项进场、消失项出场；**项的移动不做动画**（无 FLIP），排序变化瞬时就位。
- **离场元素 inert**：x-if（eager）/ x-switch（eager）离场动画期间元素内容冻结（watcher 已销毁、状态变更不再影响它），播完即移除。
- **x-show 离场延迟隐藏**：离场动画期间 `display` 尚未置 `none`，播完才隐藏；宿主本就永留 DOM，无其他差异。
- `animate` 是指令选项，不存在独立的 `x-transition` 指令。
