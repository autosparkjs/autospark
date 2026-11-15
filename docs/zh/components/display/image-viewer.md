# ImageViewer 图片查看器

## 概述

ImageViewer 是 AutoSpark 的官方全屏图片查看器（组件库 P2 / display 分类，ADR-0018 清单权威表 display 行）：`images`（url 数组，状态引用）+ `visible`（受控显隐）+ `index`（受控当前图）+ 缩放 / 旋转 / 重置工具栏 + 前后翻页钮与计数器；键盘支持左右切换、`ESC` 请求关闭、`+ / -` 缩放；相邻图预加载（切页零等待）。

**形态裁定：自建 fixed 全屏层**（不组合 x-dialog）——全屏暗色遮罩语境的查看器不是居中对话框，x-dialog 壳的复用面（chrome/header/footer/padding/边框/居中面板）几乎全数需要反向覆盖，组合成本高于收益；ESC / 遮罩点击关闭自实现，本件**零跨插件产物依赖**（按需加载只引本件与引擎即可）。

**全屏恒暗色**：遮罩 / 工具栏 / 计数器为图上浮层的恒暗设计（全屏预览的国际惯例，不随主题明暗切换，ADR-0129 暗色兜底变体不适用——无明色态即无切换）；覆盖通道 `--asc-image-viewer-*`。

引入方式：引擎之后加载 `<script src="/autospark/autospark.image-viewer.js"></script>`（自举注册），或聚合产物 `autospark.plugins.js`。

## 快速入门

```html
<script src="autospark.js"></script>
<script src="autospark.image-viewer.js"></script>


<div @change="viewer.idx = $event.detail.index" @close="viewer.open = false">
  <x-image-viewer :images="pics" :visible="viewer.open" :index="viewer.idx"></x-image-viewer>
</div>
```

<demo html="components/display/image-viewer/basic.html"/>

## 指南

### 图片列表（images）

**类型**: `string[]`，默认 `[]`

图片 url 数组，**状态引用注入**（模板里写字面量数组会触发 props 更新死循环，ADR-0021 规避清单第 5 条）；列表变更须**整体替换**状态（对原数组的 `push/splice` 原地变异不发信号，不触发重渲）。当前页 ±1 的相邻图经 `new Image()` 预加载。空数组时全屏层不亮相（防呆）。

### 受控显隐（visible）

**类型**: `boolean`，默认 `false`

受控开关：`true` 打开全屏层。关闭**不由组件自行其是**——ESC / 关闭钮 / 遮罩点击只广播 `close` 事件（detail 空），由调用方回写 `visible = false` 闭环；不监听则保持打开。打开（false→true 边沿）时视图自动重置 1:1。

### 受控当前图（index）

**类型**: `number`，默认 `0`

当前图序号（0-based）：props 单向驱动主图 / 计数器 / 翻页钮状态；内部切换（翻页钮 / 键盘）写组件状态并广播 `change`（`detail = { index }`），调用方回写即闭环。切图时缩放 / 旋转自动重置（同值重注入不重置——幂等守卫）。

### 缩放 / 旋转 / 重置（内部操作）

工具栏（右上）自绘图标钮：放大 / 缩小（步进 0.2，夹取 `[0.2, 8]`）、左旋 / 右旋（步进 90°）、重置（1:1 / 0°）、关闭。缩放与旋转经 `transform` 内联样式作用在主图上（CSS 过渡 0.2s；`prefers-reduced-motion` 下停播）。

### 键盘

| 按键 | 行为 |
| --- | --- |
| `←` / `→` | 上一张 / 下一张（首末页不越界） |
| `ESC` | 请求关闭（close 广播） |
| `+` / `=` / `-` | 放大 / 缩小 |

document 级监听，仅 `visible` 时响应（多个实例时各实例监听各自独立，组件卸载自动摘除）。

### 与 image 组件联动（配方）

image 组件的点击原生冒泡（P1 边界声明——预览由本件承接），外挂 `@click` 即得「缩略图 → 全屏预览」：

```html

<div class="thumbs" x-for="pic of pics">
  <div class="thumb" @click="viewer.idx = $index; viewer.open = true">
    <x-image fit="cover" :src="pic"></x-image>
  </div>
</div>

<div @change="viewer.idx = $event.detail.index" @close="viewer.open = false">
  <x-image-viewer :images="pics" :visible="viewer.open" :index="viewer.idx"></x-image-viewer>
</div>
```

### 已知边界

- 自建层渲染在 engine 宿主树内（非 teleport）：宿主祖先链上有 `transform` / `filter` 时 fixed 层会相对该祖先定位（CSS 含有块规则）——避免在变换容器内实例化。
- 事件沿 DOM 树冒泡（区别于渲染进 body 容器的 overlay 家族）：`@change` / `@close` 写在实例化元素的外层包裹上即可收到（化身宿主是封闭组件域，勿写在宿主自身）。

### 主题化

全屏层恒暗色（见概述），无明暗切换需求；计数器 / 工具栏字号随 `data-size` 档位缩放（继承 `autospark.base`）。使用者覆盖通道 `--asc-image-viewer-*`：`--asc-image-viewer-mask`（遮罩浓度）、`--asc-image-viewer-btn-bg` / `--asc-image-viewer-btn-color`（控件底/图标色）、`--asc-image-viewer-btn-hover-bg`、`--asc-image-viewer-counter-bg` / `--asc-image-viewer-counter-color`、`--asc-image-viewer-z`（层叠序，缺省 1000）。

## 参考

### 属性

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| images | `string[]` | `[]` | 图片 url 数组（状态引用注入；变更整体替换驱动） |
| visible | `boolean` | `false` | 受控显隐（关闭经 close 事件回写闭环） |
| index | `number` | `0` | 受控当前图（0-based；内部切换广播 change 回写闭环） |

内部状态（scale / rotate）非 props，经工具栏与键盘操作。

### 事件

| 事件 | detail | 触发 |
| --- | --- | --- |
| change | `{ index }` | 翻页钮 / 键盘左右切换当前图 |
| close | 空 | ESC / 关闭钮 / 遮罩点击请求关闭（受控——调用方回写 `visible = false`） |

### Slots

无。
