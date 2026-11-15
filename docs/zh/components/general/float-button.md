# FloatButton 悬浮按钮

## 概述

FloatButton 是 AutoSpark 的官方悬浮按钮组件（组件库 P3 **other 分类首件**，ADR-0018 清单权威表 other 行 / 修订吸收原 backtop 独立条目为 `back-to-top` 形态——antd 5 同款路线 / ADR-0029）：fixed 右下悬浮钮，type 双形态：

- **default 常规**：icon 必选（x-icon 渲染）+ click 原生冒泡事件出口（外层 `@click` 一行消费）；
- **back-to-top 回顶**：滚动超 `visibilityHeight` 阈值渐显 + 点击平滑回顶（icon 缺省内置 arrow 上旋指顶）。

语义色 / 圆角 / 阴影走 `--auto-*` 档位（阴影即走 `data-shadow` 主题手动通道）；reduced-motion 停播过渡。组形态（group 多钮展开菜）为 P4 增补面（ADR-0029 声明）。

引入方式：引擎之后加载 `<script src="/autospark/autospark.float-button.js"></script>`（自举注册），或聚合产物 `autospark.plugins.js`。

## 快速入门

```html
<script src="autospark.js"></script>
<script src="autospark.float-button.js"></script>

<!-- 常规形态：icon + label（默认插槽）+ click 事件出口 -->
<div @click="hits += 1">
  <x-float-button icon="bell">在线客服</x-float-button>
</div>

<!-- 回顶形态：滚动渐显 + 点击回顶（裸属性糖 = type="back-to-top"） -->
<x-float-button back-to-top></x-float-button>
```

静态属性直写（`icon` / `shape` / `right`）、响应式数据走 `:属性` 绑定、`back-to-top` 裸属性糖归一 `type` props——元素名写法经 precompile DOM 变换折叠为 props 注入（宿主替换为真 `button` 且固定 `type="button"`，防表单内默认 submit 误触）。

<demo html="components/general/float-button/basic.html"/>

## 指南

### 形态（type）

**类型**: `default | back-to-top`
**默认**: `default`

`default` 常规悬浮钮（恒显）；`back-to-top` 回顶形态——初始隐藏，滚动位置 ≥ `visibilityHeight` 阈值渐显（opacity/位移过渡 + 交互阻断），回落隐藏；点击 `window.scrollTo({ top: 0, behavior: "smooth" })` 平滑回顶（reduced-motion 环境瞬时归位）。`back-to-top` 裸属性糖等价于 `type="back-to-top"`（显式 type 声明在场时糖失效）。

<demo html="components/general/float-button/back-to-top.html"/>

### 图标（icon）

**类型**: `string`
**默认**: `""`（back-to-top 缺省内置 `arrow` 上旋指顶）

图标名经 x-icon 渲染（内置图标 / 用户注册图标均可）。常规形态 icon **必选**——空值渲染 default 占位图（缺图不破相）；back-to-top 形态 icon 缺省取内置 `arrow` 并上旋 90° 指顶（自定义 icon 不旋）。

### 显现阈值（visibilityHeight）

**类型**: `number`
**默认**: `400`

back-to-top 形态的渐显阈值（px）：滚动位置超出渐显、回落隐藏；常规形态不消费。props 变化即时重判。

### 定位偏移（right / bottom）

**类型**: `number | string`
**默认**: `40`（即 40px）

右缘 / 下缘偏移：number 按 px；string 带单位原样（如 `right="6rem"`）。JS 通道写宿主内联（覆盖 CSS 缺省），props 变化随动。基准尺寸经 `--asc-float-button-size`（缺省 2.5rem）定制。

### 形状（shape）

**类型**: `circle | square`
**默认**: `circle`

`circle` 正圆（缺省）；`square` 圆角方——圆角走 `--auto-border-radius` 档位（theme 在场时随 `data-radius` 手动通道）。

### 文案（默认插槽）

默认插槽承载可选 label：非空时按钮呈宽幅胶囊形态（图标 + 文案横排），空时不占位。tooltip 提示形态可经 overlay 指令外挂组合（文档配方）。

### 事件

| 事件 | 形态 | 说明 |
| --- | --- | --- |
| click | 原生冒泡 | 事件出口（组件默认封闭——外层 `@click` 消费）；back-to-top 形态点击额外内建回顶 |

```html
<!-- 常规形态事件出口：包裹元素 @click 一行消费 -->
<div @click="hits += 1">
  <x-float-button icon="bell">在线客服</x-float-button>
</div>
```

### 主题化

阴影：任意祖先容器挂 `data-shadow`（theme 手动通道覆写 `--auto-shadow`）；圆角 `data-radius`（square 形态）；字号 `data-size`（随档位整体缩放）；暗色：容器裸挂 `data-dark`。使用者覆盖通道 `--asc-float-button-*`（如 `--asc-float-button-bg`、`--asc-float-button-size`、`--asc-float-button-shadow`）。

reduced-motion：全部过渡停播（渐显/交互瞬时），回顶滚动瞬时归位。

### 写法对照

元素名写法与值对象写法等价（后者为引擎底层通道，元素名写法由 precompile 变换自动折叠）：

```html
<!-- 元素名写法（推荐） -->
<x-float-button back-to-top shape="square" right="120">回到顶部</x-float-button>

<!-- 值对象写法（底层通道） -->
<button x-component:autospark.float-button="{ type: 'back-to-top', shape: 'square', right: 120 }">回到顶部</button>
```

## 参考

### 属性

| 属性 | 类型 | 默认 | 说明 |
|---|---|---|---|
| type | `default \| back-to-top` | `default` | 形态（回顶形态渐显 + 点击回顶） |
| icon | `string` | `""` | 图标名（x-icon；常规形态必选，back-to-top 缺省 arrow 上旋） |
| visibilityHeight | `number` | `400` | back-to-top 渐显阈值（px） |
| right | `number \| string` | `40` | 右缘偏移（number→px / string 带单位） |
| bottom | `number \| string` | `40` | 下缘偏移（同上） |
| shape | `circle \| square` | `circle` | 形状（square 圆角走 --auto-border-radius） |

### 事件

| 事件 | 参数 | 说明 |
|---|---|---|
| click | — | 原生冒泡事件出口（back-to-top 形态额外内建回顶滚动） |

### Slots

| 插槽 | 说明 |
|---|---|
| 默认 | 可选 label 文案（非空时宽幅胶囊形态，空时不占位） |
