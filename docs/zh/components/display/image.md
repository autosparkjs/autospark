# Image 图片

## 概述

Image 是 AutoSpark 的官方图片组件（组件库 P1 / display 分类，ADR-0018 清单权威表 display 行）：`src` / `alt` / `lazy`（原生 loading=lazy）/ `fit`（object-fit 五档）/ `width`·`height`（img 原生属性透传）+ `fallback`（加载失败占位：图标名或图片 URL 双形态）+ 加载态转圈（内置 loading 图标 SMIL 自转，零 CSS 动画依赖）。

**点击预览不做**：预览大图由 P2 的 image-viewer 组件承接（ADR-0018 清单表 image-viewer 行边界）；本件点击原生冒泡，使用者可自行挂 `@click` 接入未来的预览层。

引入方式：引擎之后加载 `<script src="/autospark/autospark.image.js"></script>`（自举注册），或聚合产物 `autospark.plugins.js`。

## 快速入门

```html
<script src="autospark.js"></script>
<script src="autospark.image.js"></script>

<x-image src="a.png" alt="风景"></x-image>                  <!-- 元素名快速写法 -->
<div x-component:autospark.image="{ src: pic, fit: 'cover' }"></div>  <!-- 指令值形态 -->
```

<demo html="components/display/image/basic.html"/>

## 指南

### 地址与替代文本（src / alt）

**类型**: `string`，默认 `""`

`src` 在场即渲染 `<img>`；`alt` 透传替代文本，兼职失败占位的提示行。`src` 变化时重置加载态重试新地址。

### 加载态与失败占位（内置 / fallback）

三态生命周期（浏览器事件驱动）：

- **加载态**：`src` 在场未完成——居中转圈（内置 `loading` 图标 SMIL 自转）；
- **完成**：`@load` 摘转圈；
- **失败**：`@error` 切 `fallback` 占位（主图与转圈让位）。

**fallback 双形态**：`string`，默认 `"file-error"`（内置图标名）。值以协议（`https://`、`data:` 等）、`//`、`/`、`./`、`../` 开头判定为图片 URL（渲染占位图），否则按 x-icon 内置图标名渲染。

<demo html="components/display/image/fallback.html"/>

### 懒加载（lazy）

**类型**: `boolean`
**默认**: `false`

走原生 `loading="lazy"`（按简——IntersectionObserver 自实现不引入）；进入视口前不发起请求。

### 填充方式（fit）

**类型**: `"fill" | "contain" | "cover" | "none" | "scale-down"`
**默认**: `""`（浏览器缺省 fill）

object-fit 五档，经 `data-fit` 变体属性驱动 CSS 档位块。

### 尺寸透传（width / height）

**类型**: `number | string`，默认 `""`（不写）

透传 img 原生属性（布局属性，预留宽高比防塌陷）；空值不写（假值属性移除家族约定）。

### 主题化

占位底色走 `--auto-third-bgcolor`、转圈/占位图标 `--auto-third-color`、提示行 `--auto-secondary-color`（三级回退链，ADR-0129）；暗色：容器裸挂 `data-dark`。使用者覆盖通道 `--asc-image-*`（如 `--asc-image-bg` 占位底色、`--asc-image-radius` 圆角、`--asc-image-virtual-` 之外的 `--asc-image-spinner-color` 转圈色）。

## 参考

### 属性

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| src | `string` | `""` | 图片地址（变化时重置三态重试） |
| alt | `string` | `""` | 替代文本（兼职占位提示行） |
| lazy | `boolean` | `false` | 原生 loading=lazy 懒加载 |
| fit | `"fill" \| "contain" \| "cover" \| "none" \| "scale-down"` | `""` | object-fit 五档（空=缺省） |
| width | `number \| string` | `""` | img 原生宽属性透传 |
| height | `number \| string` | `""` | img 原生高属性透传 |
| fallback | `string` | `"file-error"` | 失败占位：图标名或图片 URL 双形态 |

### 事件

无内建事件（`@load`/`@error` 内部消费驱动三态；点击原生冒泡——预览场景外挂 `@click`，P2 image-viewer 承接）。

### Slots

无。
