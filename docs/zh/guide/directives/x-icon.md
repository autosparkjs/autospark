# 图标

## 概述

声明式的矢量图标方案：模板内 `<template x-icon-define>` 定义图标（SVG），`x-icon` 按名渲染。渲染采用 **CSS mask**——图标颜色天然跟随宿主文字色（`currentColor`），尺寸默认 `1em` 随字号缩放。

也可直接使用**远程图标**：按 `baseUrl/<图标集>/<图标名>.svg` 通用协议取图（默认 baseUrl 为 [Iconify](https://iconify.design) 公共 API，30 万+ 图标开箱即用；不限于 Iconify，任何兼容服务可自托管），无需预先定义：

```html
<span x-icon="mdi-light/bell"></span>
```

## 快速入门

<demo html="icon/basic.html"/>

```html
<!-- 定义：名称走指令值，SVG 走 template 内容（零转义） -->
<template x-icon-define="close">
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 6l12 12M18 6L6 18" /></svg>
</template>

<!-- 渲染：颜色随文字色，尺寸随字号 -->
<span x-icon="close"></span>
```

定义元素在编译期被收集后**剪枝**（不进渲染 DOM）；同名图标后者覆盖前者。

## 指南

### 值与通道

`x-icon` 的值是表达式（响应式），求值结果按形态分流到本地 / 远程两条通道，随时切换：

| 值               | 通道   | 说明                                                                    |
| ---------------- | ------ | ----------------------------------------------------------------------- |
| `close`          | 本地   | 纯图标名（CSS ident），查全局图标注册表                                 |
| `mdi-light/bell` | 远程   | 值含 `/` 即走远程：`baseUrl/<图标集>/<图标名>.svg` 通用协议（仅斜杠形） |
| `state.icon`     | 表达式 | 求值结果再按上表分流                                                    |

<demo html="icon/reactive.html"/>

::: tip 裸图标名的求值语义（值两栖）
裸图标名不是合法的 JS 表达式——求值为空时回退为**字面量**图标名；含点的路径（如 `state.icon` 求值为空）不回退，维持空占位。状态命中优先：`state.close` 有值用值。
:::

### 图标颜色

图标颜色**主权在宿主元素**：mask 只取形状（alpha 通道），实际颜色 = 宿主的 `background-color`（默认 `currentColor`）——所以 `color` 级联到哪、图标就是什么色，与文字混排天然一致，主题组件（按钮/标签）内自动适配：

<demo html="icon/color.html"/>

三种控制方式（按粒度）：

| 方式       | 写法                                                | 生效范围                   |
| ---------- | --------------------------------------------------- | -------------------------- |
| 宿主文字色 | CSS `color` / `:style="{color: c}"`（**可响应式**） | 随级联，改 `color` 即换色  |
| 指令选项   | `x-icon-options="{color:'#f03d5e'}"`                | 单实例内联覆盖，不随文字色 |
| 全局默认   | `AutoSpark.icons.options = { color: '#' }`          | 全部实例（指令级覆盖仍胜） |

### 图标尺寸

默认 **`1em` 随宿主字号缩放**——与文字同行混排无需任何配置；要固定尺寸用 `size` 选项（数字 → `Npx`、字符串直传 CSS），响应式尺寸绑宿主 `font-size` 即可（默认 1em 模型）：

<demo html="icon/size.html"/>

- `padding` 是**图形区之外**的内边距：总占位 = size + 2×padding（`box-sizing: content-box` 钉死，免疫页面全局 border-box reset，语义恒定）
- **flex / grid 容器免疫（无需任何配置）**：基础规则内置三重防护——① `flex: none`（主轴不伸不缩：`flex-grow: 0` 不被拉宽、`flex-shrink: 0` 行内挤压不变形）；② 恒有显式宽高（默认 `1em` / `size` 内联）——交叉轴 `align-items: stretch` 只作用于 auto 尺寸的项，显式尺寸天然免疫；③ `box-sizing: content-box` 免疫全局 reset。若图标被**包裹元素**（自身的 div 被 stretch）带动变化，那是外层布局问题——给外层 `align-items: center` 或让图标直接作 flex 项
- 全局默认：`AutoSpark.icons.options = { size: 20 }`（四级配置链，指令级覆盖仍胜）

### 修饰

两个外观修饰选项（均可作修饰符快捷写法，走四级配置链）：

| 选项        | 修饰符写法        | 效果                                                                                                    |
| ----------- | ----------------- | ------------------------------------------------------------------------------------------------------- |
| `badge`     | `x-icon.badge`    | 图标底板——**比 currentColor 淡的圆角矩形背景**（`currentColor 12%`，随宿主文字色联动）；**默认 `padding: 0.5em`**（板与图形的间距，总占位 = size + 2×padding——显式 `padding` 声明优先，`padding:0` 板贴图形） |
| `pointer`   | `x-icon.pointer`  | 手型光标 `cursor: pointer`（可点击语义）                                                                |

<demo html="icon/decorate.html"/>

`badge` 走**包裹层通道**：宿主的 mask 裁剪整个元素渲染（含伪元素与阴影——伪元素板实测不可见），底板必须由**不受该 mask 影响的独立盒**承载——指令自动为 badge 实例包裹一层 `<span class="as-icon-badge">`（板：圆角 + 淡色背景），图标子元素完整渲染居中其中。板色经 `color-mix` 引用 `currentColor`，改宿主 `color` 即换底板色，与图标色天然同源。注意：包裹层会引入一层 DOM——`.parent > .as-icon` 之类**子选择器**在 badge 场景会断开，请用后代选择器。

### 动态注册联动

注册表的增删与已渲染实例**实时联动**：

- **未注册 → 后注册**：`x-icon="late"` 先渲染默认图标，脚本随后 `add("late", svg)` 后**自动变为真图标**
- **使用中 → 删除**：`delete(name)` 后正在显示该图标的实例**回退默认图标**

<demo html="icon/registry.html"/>

默认图标是注册表内置条目 `default`（缺图时渲染的回退图标，「缺图不破相」）——可 `add("default", svg)` 同名覆盖自定义，删除后未命中退回空占位。

### 远程图标

值含 `/` 即走远程通道，按 `baseUrl/<图标集>/<图标名>.svg` 通用协议获取 SVG——**不限于 Iconify**：默认 `baseUrl` 指向 Iconify 公共 API（开箱即用 30 万+ 图标），指向任何按此布局伺服 SVG 的服务即可（自建图标服务 / 内网镜像）。本地图标名受 CSS ident 约束天然不含 `/`，两通道零冲突：

<demo html="icon/remote.html"/>

- **管线与本地同构**：fetch SVG → 规范化 → data URL——`strokeWidth` / `size` / `color` 选项照常生效，颜色同样跟随文字色
- **规则化复用**：取回后升格为 `.as-icon[data-as-icon="集/名"]` 规则（进指令自管样式表），同图标多实例共享一条规则——实例只挂 `data-as-icon` 短属性，DOM 不背内联 data URL；非默认 `strokeWidth` 才内联变体
- **三态**：加载中空占位（保留尺寸）；失败（404 / 网络错）warn + 默认图标；重取保留旧图不闪断
- **缓存与限流（五层）**：模块级内存缓存 → **localStorage 持久缓存**（跨会话，二次访问**零网络同步渲染**；DevTools → 应用 → 本地存储 → 当前源下的键 `autospark:icons:v1`，首次远程取回约 300ms 后出现）→ 同图标并发请求合并 → 并发上限 4 路 + 429 退避重试 → 浏览器 HTTP 缓存（Network 面板 Size 列 `disk cache`）。持久层按源分组（换 `baseUrl` 不串图）、无过期（图标版本不可变）、500 条 LRU、配额超限自动淘汰；`AutoSpark.icons.persist = false` 可关（环境不可用时静默退回内存缓存）
- **预取**：`AutoSpark.icons.prefetch("mdi-light/home" | ["mdi/a", "mdi/b"])`——提前取回（闲时/悬停时预热下一屏图标），走限流、落持久缓存、失败静默；持久缓存只救二次访问，首次使用的等待只能靠提前量
- **自托管 / 换源**：`AutoSpark.icons.baseUrl = "https://icons.internal"`——内网、隐私或彻底离线的通用解法（[Iconify 官方亦支持自建](https://iconify.design/docs/api/hosting/)）

::: warning 在线依赖
默认 baseUrl 依赖 Iconify 公共 API 的在线可用性；离线 / 内网场景请把 `baseUrl` 指向自托管服务，或改用本地定义。
:::

### 图标注册表

图标注册表是 **document 级全局单例**（多 engine 共享），`AutoSpark.icons` 静态暴露，形态为 `Set` 子类：

```ts
import { AutoSpark } from "autospark";

AutoSpark.icons.add("close", '<svg viewBox="0 0 24 24"><path d="M6 6l12 12"/></svg>'); // 注册
AutoSpark.icons.delete("close"); // 移除（不存在静默返回 false）
AutoSpark.icons.baseUrl = "https://icons.internal"; // 远程源自托管基址
AutoSpark.icons.prefetch(["mdi-light/home", "mdi-light/bell"]); // 预取：提前取回落持久缓存
AutoSpark.icons.persist = false; // 关闭 localStorage 持久缓存（默认 true）
AutoSpark.icons.options = { size: 20, strokeWidth: 1.5 }; // 全局默认配置（见「配置」）
for (const name of AutoSpark.icons) {
  /* 遍历产出名称字符串 */
}
```

声明入口三通道：

1. 模板 `<template x-icon-define="名">...</template>`
2. 编程 `AutoSpark.icons.add(name, svg)`
3. 构造种子 `new AutoSpark(el, state, { icons: { close: "<svg.../>" } })`

### 渲染机制速览

- 输出形态：本地 `<span class="as-icon close">`（裸名类 + 尺寸内联）；远程 `<span class="as-icon" data-as-icon="mdi/home">`（属性选择器规则承载 mask）；颜色 = 宿主 `background-color`（默认 `currentColor`）
- 定义收集时向 `<head>` 注入 `<style id="autospark-icons">`：`:root` 变量（`--as-icon-<名>`，默认 strokeWidth 1.25）+ `.as-icon.<名>` mask 规则
- **描边归一化**：注册时 strip 全部 `stroke-width`（生效宽度是渲染参数，渲染期注入）；root 缺 `stroke` 才补 `currentColor`——fill 型图标（Material 风）显式属性不受影响
- 图标名约束：CSS ident（`[A-Za-z0-9_-]`、非数字开头），`as-icon` 为保留名；非法名 warn + 拒绝注册

## 配置

### 全局默认：AutoSpark.icons.options

应用级默认配置（document 级全局，多 engine 共享）。**整体赋值**会重建样式表并**即时重渲染已渲染的图标**（主题切换场景）；深修改（`options.size = 48`）不广播，仅影响后续渲染：

```ts
AutoSpark.icons.options = { strokeWidth: 1.5, size: 20, color: "#485fc7", padding: 2 };
```

### 配置链（四级）

单键读取按 **指令选项（`x-icon-options`）> 宿主选项（`x-options`）> 全局默认（`icons.options`）> 内置默认** 回退——指令级**键级覆盖**全局（声明 `size` 不影响全局 `color` 继续生效）：

<demo html="icon/options.html"/>

| 选项          | 类型               | 内置默认       | 说明                                                                                                                       |
| ------------- | ------------------ | -------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `strokeWidth` | `number`           | `1.25`         | 描边宽度（渲染期注入，非图标数据）。**生效默认（含全局层）参与规则烘焙**——默认路径始终走共享规则零内联，仅指令级覆盖才内联 |
| `size`        | `number \| string` | `"1em"`        | 宽高（图形区）。数字 → `Npx`，字符串直传 CSS                                                                               |
| `color`       | `string`           | `currentColor` | 图标颜色（内联 `background-color`，默认随文字色）                                                                          |
| `padding`     | `number \| string` | —              | 内边距（图形区之外），单位语义同 `size`，总占位 = size + 2×padding                                                         |

## 注意事项

- **排版免疫**：基础规则内置 `box-sizing:content-box`（免疫页面全局 `*{border-box}` reset——`size` 恒指图形区，`padding` 恒为图形区外内边距，总占位 = size + 2×padding）、`flex:none`（flex 容器内不伸不缩，行内挤压不变形）与 `aspect-ratio:1`（**比例恒 1:1**——单边显式尺寸时另一边按比例自动补齐）；显式宽高天然免疫 grid / flex 项的默认 stretch（其只作用于 auto 尺寸）。垂直对齐已内置 `vertical-align:-0.125em`（基线微调，与文字混排居中）
- `engine.destroy()` **不清理**注册表与样式表（document 级共享资产，与全局样式注入惯例一致）
- 多页面 / 多 engine 同页场景下注册表共享：同名定义后到者胜（warn 提示）
- 模板里的 `<svg>` **无需手写 `xmlns`**——规范形自动补齐（data URL 中的 SVG 按 XML 图像解析，缺失声明会解析失败、图标隐形）
- SVG 数据经 `encodeURIComponent` 编码为 data URL（mask 只取 alpha 通道，SVG 中的 `currentColor` 不生效——颜色主权在宿主元素）
