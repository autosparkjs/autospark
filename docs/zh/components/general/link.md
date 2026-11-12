# Link 链接

## 概述

Link 是 AutoSpark 的官方链接组件（组件库 P0 轻件，ADR-0019）：`href` / `target` / `disabled` / `icon` / 下划线档位（`underline`），**语义色（type）体系对齐 button 范式**（ADR-0012：`--asc-tone` 中转变量 + `--auto-*-color` 语义变量 + theme 档位全跟随）。

元素名快速写法 `<x-link>` 由 precompile DOM 变换替换为**真 a 元素**——原生导航语义（中键 / 右键 / 键盘 / 爬取）保真（button 同款止血路线，ADR-0133）；`target` 含 `_blank` 时自动补 `rel="noopener"`（显式 `rel` 优先）。

引入方式：引擎之后加载 `<script src="/autospark/autospark.link.js"></script>`（自举注册），或聚合产物 `autospark.plugins.js`。

## 快速入门

```html
<script src="autospark.js"></script>
<script src="autospark.link.js"></script>

<x-link href="https://example.com" label="普通链接"></x-link>
<x-link href="https://example.com" target="_blank" label="新窗口（自动补 noopener）"></x-link>
<a x-component:autospark.link="{ label: '指令值形态', href: '#' }"></a>
```

`class` / `style` / `id` / `rel` / `data-*` 保留给宿主；插槽内容优先于 `label` 兜底。

<demo html="components/general/link/basic.html"/>

## 指南

### 链接地址（href）与打开方式（target）

**类型**: `string`
**默认**: `""`（空）

`href` 为空时呈现**非链接态**：宿主无 `href` 属性（不导航、无链接指针），语义色保留——用于「纯视觉提示」场景。`target` 透传原生打开方式；含 `_blank` 时组件自动补 `rel="noopener"`（新窗口安全默认，宿主显式 `rel` 声明优先不覆盖）。两个属性均响应式（`:href="state.url"` 变化即时同步宿主）。

### 语义色（type）

**类型**: `primary | success | warning | danger | info | default`
**默认**: `primary`

对齐 button 范式的语义色轴（ADR-0012）：缺省 `primary` 主色链接；`default` 为正文色中性档（纯样式件以中性为主，语义色按需映射）。语义色取 theme 的 `--auto-*-color` 变量，切主题色 / 暗色即时跟随。

<demo html="components/general/link/type.html"/>

### 下划线档位（underline）

**类型**: `hover | always | none`
**默认**: `hover`

`hover` 悬停显示（缺省）、`always` 恒显示、`none` 恒不显示。与 type 轴正交。

### 禁用（disabled）

**类型**: `boolean`
**默认**: `false`

三重禁用：**摘除 href**（目标不可达、不可中键新窗）、**aria-disabled 标注**（可访问性）、**点击拦截**（preventDefault，键盘 Enter 同走 click 通道）；视觉淡化（`--auto-disable-color`）+ 禁用指针。响应式翻转即时恢复（href 写回）。

### 图标（icon）

**类型**: `string | { name: string }`
**默认**: `""`（无图标）

字符串为图标名（内置图标表或全局注册均可），对象形态 `{ name }` 等价；图标经 engine 内置 `x-icon` 指令渲染——尺寸随字号档位（1em）、颜色继承语义色。外链提示常用内置图标 `external`。

> **对象 props 注入提示**：对象形态请经**状态引用**注入（`icon: myIcon`，`myIcon` 为状态对象）——当前引擎版本对值对象内的**字面量**对象/数组 props 存在无限更新缺陷（修复在途），字面量写法会触发死循环；标量 props 不受影响。

<demo html="components/general/link/icon.html"/>

### 事件

`click` 原生冒泡（写在**外层包裹元素**上消费，组件默认封闭）；disabled 态默认导航动作被拦截（事件本身仍可监听）。

### 主题化

字号档位：任意祖先容器挂 `data-size`（theme 手动通道）；暗色：容器裸挂 `data-dark`。使用者覆盖通道 `--asc-link-*`（如 `--asc-link-primary`、`--asc-link-color`、`--asc-link-font-size`）。

## 参考

### 属性

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| label | `string` | `""` | 兜底文案（插槽内容优先） |
| href | `string` | `""` | 链接地址（空 = 非链接态） |
| target | `string` | `""` | 打开方式（`_blank` 自动补 noopener） |
| type | `primary \| success \| warning \| danger \| info \| default` | `primary` | 语义色（button 范式） |
| icon | `string \| { name: string }` | `""` | 图标（x-icon 渲染） |
| disabled | `boolean` | `false` | 禁用（摘 href + aria-disabled + 拦截点击） |
| underline | `hover \| always \| none` | `hover` | 下划线档位 |

### 事件

| 事件 | 参数 | 说明 |
| --- | --- | --- |
| click | 原生事件 | 原生冒泡（disabled 态默认动作被拦截） |

### Slots

| 插槽 | 说明 |
| --- | --- |
| 默认 | 链接内容（优先于 label 兜底，富文本均可） |
