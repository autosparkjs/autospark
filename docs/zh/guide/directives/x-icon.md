# x-icon 图标

## 概述

声明式的矢量图标方案（ADR-0058）：`<template x-icons>` 声明图标集（内联 SVG 与远程清单皆可），`x-icon` 按名渲染。渲染采用 **SVG symbol + `<use>`**——图标以 symbol 住进 document 级 sprite，`x-icon` 注入 `<svg><use href="#as-…"/></svg>` 引用；颜色经 `currentColor` CSS 继承天然跟随宿主文字色，尺寸默认 `1em` 随字号缩放。

图标定义归属**图标域**：默认挂最近祖先 scope（后代沿链就近使用、随 scope 销毁回收），`x-icons.global` 声明为全局（document 级共享）；也可经 `x-icons-options` 从远程批量加载 [IconifyJSON](https://iconify.design/docs/types/iconify-json/) 图标集（默认 Iconify 公共 API，30 万+ 图标开箱即用，不限于 Iconify——任何返回该格式的服务可自托管）。

## 快速入门

<demo html="icon/basic.html"/>

```html
<!-- 声明：一个 template 集中多个 <svg id="名">（编译期收集为 symbol 后剪枝，不进渲染 DOM） -->
<template x-icons>
  <svg id="close" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 6l12 12M18 6L6 18" /></svg>
  <svg id="check" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 6 9 17l-5-5" /></svg>
</template>

<!-- 渲染：颜色随文字色，尺寸随字号 -->
<span x-icon="close"></span>
```

声明元素在编译期被收集后**剪枝**；同一 template 内可声明任意多个图标，同名后声明者静默覆盖。

## 指南

### 指令值

指令值分两层：`<template x-icons>` 声明图标集（**资源**，纯静态），`x-icon` 的值为图标名表达式（**引用**，响应式）。

#### 图标集声明（x-icons）

| 形态 | 写法 | 说明 |
| ---- | ---- | ---- |
| 内联 | `<template x-icons><svg id="名">…</svg>…</template>` | 每个 `<svg id>` 收集为一个 symbol；`id` 即图标名 |
| 远程清单 | `<template x-icons="save,home,edit">` | 值简写承载逗号分隔清单（等效 `x-icons-options.icons`），编译期即 fetch |
| options 整包 | `<template x-icons-options="{icons:'save,home', url:'…', modify:'rounded', cache:86400000}">` | 详见「远程图标」 |
| 合并 | 内联 + 值简写同写 | 两通道合并进同一图标域；同名时**远程覆盖内联**（内联在加载窗口期先显形） |

`x-icons` 是**纯静态声明**——编译期一次求值，不响应式（图标集是声明性资源，对齐 x-define）。选项只支持 `x-icons-options` 整包与值简写（不支持选项成员属性——不引入带值修饰符是 ADR-0007 的既定纪律）。

#### 图标引用（x-icon）

`x-icon` 的值是表达式（响应式切换即换图标），宿主元素不变，指令注入唯一子节点 `<svg aria-hidden><use href="#as-…"/></svg>` 撑满宿主：

<demo html="icon/reactive.html"/>

::: tip 裸图标名的求值语义（值两栖）
裸图标名不是合法的 JS 表达式——求值为空时回退为**字面量**图标名；含点 / 斜杠等复杂形态不回退，维持空占位。状态命中优先：`state.close` 有值用值。
:::

渲染三态：

| 状态 | 表现 | 说明 |
| ---- | ---- | ---- |
| 就绪 | `<use href="#as-…">` 引用 symbol | 本地内联 / 注册表 / 远程已到达 |
| 待定 | 空占位（保留尺寸） | 远程清单**已声明未到达**——不闪默认图标，symbol 注入后自动显形 |
| 未命中 | warn + 默认图标 | 根本没声明（或声明失败）——「缺图不破相」 |

### 图标域与作用范围

图标定义的可见范围默认是**最近祖先 scope**（任意深度，与 x-define 归属同构）：后代 `x-icon` 沿 scope 链就近解析，**内层遮蔽外层**，到顶兜底全局注册表——与组件 / action 的链式查找范式统一：

```html
<div x-data="{ tone: 'dark' }">
  <!-- 归属此 scope：整个子树可用 -->
  <template x-icons><svg id="close">…</svg></template>
  <span x-icon="close"></span>
  <section x-data="{ open: true }">
    <!-- 内层就近遮蔽：此子树内 close 用这枚 -->
    <template x-icons><svg id="close">…（另一形态）…</svg></template>
    <span x-icon="close"></span>
  </section>
</div>
```

- **`.global` 修饰符**（≡ `x-icons-options="{global:true}"`）：声明为全局——进全局注册表（`AutoSpark.icons`），document 级多 engine 共享
- **孤立声明**（沿链无任何 scope 祖先）静默归全局——图标是纯资源，无需就近惩罚
- **生命周期**：局部 symbol 随 scope 销毁回收（x-if 切走 / engine.destroy）；同一声明源（含 x-for / 组件克隆）按内容哈希令牌去重共享 symbol——**克隆不放大**；全局 symbol 不随 engine 销毁清理（document 级资产）

### 图标颜色

图标颜色**主权在宿主元素**：symbol 内容的 `currentColor` 经 CSS 继承直达——`color` 级联到哪、图标就是什么色，与文字混排天然一致，主题组件（按钮/标签）内自动适配：

<demo html="icon/color.html"/>

三种控制方式（按粒度）：

| 方式       | 写法                                       | 生效范围                   |
| ---------- | ------------------------------------------ | -------------------------- |
| 宿主文字色 | CSS `color` / `:style="{color: c}"`（**可响应式**） | 随级联，改 `color` 即换色  |
| 指令选项   | `x-icon-options="{color:'#f03d5e'}"`       | 单实例内联 `color` 覆盖    |
| 全局默认   | `AutoSpark.icons.options = { color: '#' }`  | 全部实例（指令级覆盖仍胜） |

### 图标尺寸

默认 **`1em` 随宿主字号缩放**——与文字同行混排无需任何配置；要固定尺寸用 `size` 选项（数字 → `Npx`、字符串直传 CSS），响应式尺寸绑宿主 `font-size` 即可（默认 1em 模型）：

<demo html="icon/size.html"/>

- `padding` 是**图形区之外**的内边距：总占位 = size + 2×padding（`box-sizing: content-box` 钉死，免疫页面全局 border-box reset，语义恒定）
- **flex / grid 容器免疫（无需任何配置）**：基础规则内置 `flex: none`（不伸不缩）+ 恒有显式宽高（交叉轴 stretch 只作用于 auto 尺寸）+ `box-sizing: content-box`
- 全局默认：`AutoSpark.icons.options = { size: 20 }`（四级配置链，指令级覆盖仍胜）

### 描边宽度（strokeWidth）

「宽度不是图标的一部分，是渲染参数」——收集期剥离全部 `stroke-width`，生效宽度经基础规则 `stroke-width: var(--as-icon-sw, 1.25)` 下发（CSS 继承直达 symbol 内容，覆盖永远可靠）：

<demo html="icon/stroke.html"/>

```html
<span x-icon="close"></span>                                <!-- 默认 1.25（零内联，规则兜底） -->
<span x-icon="close" x-icon-options="{strokeWidth:2}"></span> <!-- 内联 --as-icon-sw: 2 -->
```

::: tip 响应式描边：绑 CSS 变量即可
`--as-icon-sw` 是普通 CSS 自定义属性——在容器上 `:style` 绑定它（如 `:style="{'--as-icon-sw': sw}"` + range 滑杆 `x-model="sw"`），拖动即**纯 CSS 通道实时生效**，无需指令重渲染；实例内联变量（指令级覆盖）优先于容器继承值。
:::

- 多笔画故意异宽的图标会被压平为统一宽度（已知限制）
- fill 型图标集（Iconify 的 material 系）是填充体系，`strokeWidth` 无效——宽度属于描边体系图标（lucide / tabler 风手写 svg）
- 全局默认：`AutoSpark.icons.options = { strokeWidth: 1.5 }`——生效默认（含全局层）恒走规则零内联，仅指令级覆盖才内联变量

### 修饰

三个外观修饰选项（均可作修饰符快捷写法，走四级配置链）：

| 选项      | 修饰符写法       | 效果                                                                                                    |
| --------- | ---------------- | ------------------------------------------------------------------------------------------------------- |
| `badge`   | `x-icon.badge`   | 图标底板——**比 currentColor 淡的圆角矩形背景**（`currentColor 5%`，随宿主文字色联动）。标量三形态（形态即启用）：`true` 开关（**默认 `padding: 0.3em` 作用于底板**）、`number` / `string` **自定义板 padding**（如 `{badge:'1em'}`，压倒独立 `padding` 选项）；总占位 = size + 2×板 padding，图形恒 size 不放大 |
| `button`  | `x-icon.button`  | 图标按钮——hover / press 交互动效（**载体动效**，见下节）；**隐含手型光标**（类规则承载，不经内联）       |
| `pointer` | `x-icon.pointer` | 手型光标 `cursor: pointer`（可点击语义）                                                                |

<demo html="icon/decorate.html"/>

`badge` 走**包裹层通道**：底板由独立盒承载——指令自动为 badge 实例包裹一层 `<span class="as-icon-badge">`（圆角 + 淡色背景），图标子元素完整渲染居中其中。板色经 `color-mix` 引用 `currentColor`，改宿主 `color` 即换底板色。注意：包裹层会引入一层 DOM——`.parent > .as-icon` 之类**子选择器**在 badge 场景会断开，请用后代选择器。

### 图标按钮

<demo html="icon/button.html"/>

`button` 声明**纯视觉的图标按钮交互态**：hover / press 动效 + 隐含手型光标。两个设计原则：

- **载体动效**：不新增任何视觉结构、不改布局占位，动效作用于**既有视觉载体**——未开 `badge` 时载体是图形本身（hover 加深 `brightness(.75)` + press 缩放 `scale(.9)`）；开 `badge` 时载体是底板（板色三梯度加深 `5% → hover 10% → press 15%` + press 整体缩放 `scale(.94)`）。与 `badge`（管「板常驻」）正交
- **纯视觉可供性**：不承载控件语义（无 `role` / `tabindex` / 键盘激活）——点击行为归用户 `@click` 声明，需要真按钮时包 `<button>` 元素

### 动态注册联动

全局注册表的增删与已渲染实例**实时联动**：

- **未注册 → 后注册**：`x-icon="late"` 先渲染默认图标，脚本随后 `add("late", svg)` 后**自动变为真图标**
- **使用中 → 删除**：`delete(name)` 后正在显示该图标的实例**回退默认图标**

<demo html="icon/registry.html"/>

默认图标是注册表内置条目 `default`（缺图时渲染的回退图标，「缺图不破相」）——可 `add("default", svg)` 同名覆盖自定义，删除后未命中退回空占位。

### 远程图标（IconifyJSON 批量加载）

远程图标在**声明处批量加载**：编译期收集即按 url fetch 图标集 JSON，转为 symbol 后以**原名**注册进图标域。

<demo html="icon/remote.html"/>

```html
<!-- 值简写 + 默认 url（Iconify 公共 API 的 material-symbols-light 图标集） -->
<template x-icons="save,home,edit,delete"></template>

<!-- options 整包：自定义 url / modify 变体 -->
<template
  x-icons="save,home"
  x-icons-options="{url:'https://api.iconify.design/mdi-light.json?icons={icons}', modify:'rounded'}"
></template>
```

`x-icons-options` 四个键：

| 键       | 说明                                                                                                        |
| -------- | ----------------------------------------------------------------------------------------------------------- |
| `url`    | 图标集地址，默认 `https://api.iconify.design/material-symbols-light.json?icons={modify-icons}`（清单占位符用 `{modify-icons}`——未声明 modify 时即原名清单，声明后自动取后缀变体）。三个占位符：`{icons}`（原名清单，原始直书）、`{modify}`（未声明为空串）、`{modify-icons}`（未声明退化为 `{icons}`）；未知占位符保留原样 + warn |
| `icons`  | 逗号分隔图标清单（与值简写等效；值简写优先）                                                                |
| `modify` | 变体后缀，值域 `rounded / sharp / outline / outline-rounded / outline-sharp`——url 按 `{modify-icons}` 用 `原名-后缀` 取数，**symbol 仍以原名注册**（`x-icon="save"` 不感知 modify）；越界 warn + 按未声明处理 |
| `cache`  | TTL 持久缓存时长（**毫秒**，正数启用，默认 `0` 不缓存）——详见下文「持久缓存」小节 |

行为要点：

- **编译期即取**：收集即发起 fetch；**会话内存缓存 + in-flight 合并**——同 url 多声明只发一次请求；`cache > 0` 再叠加 TTL 持久层（见「持久缓存」）
- **待定名三态**：加载窗口期空占位（不闪默认图标）→ symbol 注入自动显形 → `not_found` / 网络失败逐名 warn + 默认图标（内联同名者存活——远程失败不杀内联）
- **别名与变换**：IconifyJSON 的 `aliases` 就地解引用；`rotate` / `hFlip` / `vFlip` 转换为 `<g transform>`；viewBox 按「根级默认 ← 图标级 ← 别名」合成
- **自托管 / 换源**：把 `url` 指向任何返回 IconifyJSON 的服务即可（内网镜像、自建服务，[Iconify 官方亦支持自建](https://iconify.design/docs/api/hosting/)）

::: warning 在线依赖
默认 url 依赖 Iconify 公共 API 的在线可用性；离线 / 内网场景请把 `url` 指向自托管服务，或改用内联声明。
:::

### 持久缓存（cache）

远程声明可经 `cache` 选项启用 **TTL 持久缓存**：fetch 成功把图标集 JSON 落 localStorage，TTL 内的二次访问——**含跨会话的页面重载**——零网络同步渲染，观感等同内联声明。默认 `0` 不启用：

```html
<!-- 一天（毫秒） -->
<template x-icons="home,search" x-icons-options="{cache:86400000}"></template>

<!-- 一周；与 url / modify 组合 -->
<template
  x-icons="home,search"
  x-icons-options="{url:'https://api.iconify.design/mdi-light.json?icons={icons}', cache:7*86400000}"
></template>
```

行为语义：

- **存储**：键 `autospark:icon-cache:v1:{url}`（DevTools → 应用 → 本地存储 → 当前源可查；按 url 隔离，换源不串图）
- **TTL 过期即弃**：过期条目读取时即删除并重新 fetch——图标集更新靠 TTL 到期自然刷新，按图标集的变更频率选时长
- **损坏条目即弃**；隐私模式 / 配额超限 / 无 localStorage 环境**静默降级**内存缓存
- **无效值**（非正数）warn + 按未启用处理；仅作用于远程清单——内联声明本就在本地，无需缓存

三层缓存的分工：

| 层             | 载体                            | 生命周期        | 命中效果                       |
| -------------- | ------------------------------- | --------------- | ------------------------------ |
| 会话内存       | 模块级 Map（恒开启）            | 页面会话        | 同 url 多声明零请求 + in-flight 合并 |
| TTL 持久层     | localStorage（`cache > 0`）     | 声明的 TTL      | 跨会话零网络                   |
| HTTP 缓存      | 浏览器（服务端缓存头）          | 由响应头决定    | 有网络往返但免传输             |

::: tip 何时开启
默认不开（批量声明天然少量请求 + HTTP 缓存兜底已够用）；图标集**变更低频而访问频繁**、或**弱网 / 离线二次访问**体验敏感的页面按需开启——自托管内网源同样适用。
:::

### 图标注册表

图标注册表是 **document 级全局单例**（多 engine 共享），`AutoSpark.icons` 静态暴露，形态为 `Set` 子类——图标域的全局兜底层：

```ts
import { AutoSpark } from "autospark";

AutoSpark.icons.add("close", '<svg viewBox="0 0 24 24"><path d="M6 6l12 12"/></svg>'); // 注册（注入全局 symbol）
AutoSpark.icons.delete("close"); // 移除（摘除 symbol；不存在静默返回 false）
AutoSpark.icons.options = { size: 20, strokeWidth: 1.5 }; // 全局默认配置（见「配置选项」）
for (const name of AutoSpark.icons) {
  /* 遍历产出名称字符串 */
}
```

声明入口三通道：

1. 模板 `<template x-icons.global>…</template>`（或值简写 `<template x-icons.global="save,home">`）
2. 编程 `AutoSpark.icons.add(name, svg)`
3. 构造种子 `new AutoSpark(el, state, { icons: { close: "<svg.../>" } })`

### 渲染机制速览

- **sprite**：document 级唯一隐藏 `<svg>`（`width=0 height=0`），全部 symbol 同住其中、靠 id 前缀区分——全局 `as-{name}`、局部 `as-i{声明令牌}-{name}`（令牌按声明内容哈希，克隆同源共享）；`as-` 为引擎保留前缀
- 输出形态：宿主内注入 `<svg aria-hidden><use href="#as-…"/></svg>`（撑满宿主），无内联数据、无每图标 CSS 规则
- **symbol 归一化**：收集时剥离全部 `stroke-width`（生效宽度经 `--as-icon-sw` 变量下发）；缺 `stroke` 且 `fill="none"` 才补 `currentColor`——fill 型图标零干扰；`<svg>` 无需手写 `xmlns`（symbol 住 DOM，不走 data URL）
- 图标名约束：CSS ident（`[A-Za-z0-9_-]`、非数字开头），`as-icon` 为保留名；非法名 warn + 剔除

## 配置选项

单键读取按 **指令选项（`x-icon-options`）> 宿主选项（`x-options`）> 全局默认（`icons.options`）> 内置默认** 回退——指令级**键级覆盖**全局（声明 `size` 不影响全局 `color` 继续生效）：

<demo html="icon/options.html"/>

| 配置项      | 默认值       | 修饰符     | 说明                                                                                                        |
| ----------- | ------------ | ---------- | ----------------------------------------------------------------------------------------------------------- |
| `strokeWidth` | `1.25`     | —          | number。描边宽度（渲染参数，经 `--as-icon-sw` 变量下发）。与生效默认一致零内联，仅指令级覆盖才内联变量；fill 型图标集无效 |
| `size`      | `"1em"`      | —          | number \| string。宽高（图形区）。数字 → `Npx`，字符串直传 CSS                                               |
| `color`     | `currentColor` | —        | string。图标颜色（内联 `color`，currentColor 继承体系）                                                      |
| `padding`   | —            | —          | number \| string。内边距（图形区之外），单位语义同 `size`，总占位 = size + 2×padding                          |
| `badge`     | —            | `.badge`   | boolean \| number \| string。图标底板（淡色圆角背景板，包裹层通道）。`true` 开关（板 padding 默认 `0.3em`，显式 `padding` 声明优先）；`number` / `string` 自定义板 padding（数字 → px，值压倒独立 `padding` 选项） |
| `button`    | —            | `.button`  | boolean。图标按钮（hover / press 载体动效，隐含手型光标），见「图标按钮」                                     |
| `pointer`   | —            | `.pointer` | boolean。手型光标 `cursor: pointer`（可点击语义）                                                             |

**全局默认**（应用级默认配置，document 级全局、多 engine 共享）：**整体赋值**会**即时重渲染已渲染的图标**（主题切换场景）；深修改（`options.size = 48`）不广播，仅影响后续渲染：

```ts
AutoSpark.icons.options = { strokeWidth: 1.5, size: 20, color: "#485fc7", padding: 2 };
```

## 注意事项

- **排版免疫**：基础规则内置 `box-sizing:content-box`（免疫全局 `*{border-box}` reset）、`flex:none`（flex 容器内不伸不缩）与 `aspect-ratio:1`（比例恒 1:1）；显式宽高天然免疫 grid / flex 项的默认 stretch。垂直对齐已内置 `vertical-align:-0.125em`（与文字混排居中）
- `engine.destroy()` 回收本引擎编译的**局部** symbol（scope 级联）；**不清理**全局注册表 / 全局 symbol / 样式表（document 级共享资产）
- sprite 与注册表是 document 级共享：多页面 / 多 engine 同页同名——局部就近遮蔽互不影响；全局同名后声明者胜（静默覆盖）
- symbol id 以 `as-` 为保留前缀——页面自身手写 `<svg id="as-…">` 请避开该前缀
- 旧写法迁移：`<template x-icon-define="名"><svg>…</svg></template>` → `<template x-icons><svg id="名">…</svg></template>`（旧指令已硬移除、静默失效）；`color` 选项从 `background-color` 语义迁移为 `color`；`x-icon="集/名"` 远程值形与 `AutoSpark.icons.baseUrl` / `persist` / `prefetch` API 已随 per-icon 远程物种移除，远程加载统一走 `x-icons` 声明
