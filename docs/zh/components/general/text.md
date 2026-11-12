# Text 排版文本

## 概述

Text 是 AutoSpark 的官方排版文本组件（组件库 P0 轻件，ADR-0019）：**层级 / 语义色（type）**、加粗（strong）、**溢出省略（ellipsis——单行省略号 / 多行 line-clamp）**、**复制（copyable——navigator.clipboard + 成功反馈）**。纯展示语义，无内置文案、不接 i18n（复制反馈走图标而非文案）；`editable` 不做（ADR-0018 决策 1 备注）。

组件全盘消费 `@autospark/theme` 语义变量（`--auto-*` 三级回退链，ADR-0129），**不设自有字号属性**——字号档位经主题通道 `data-size` 全跟随（挂在任意祖先容器即整片生效，与 button 同范式 ADR-0012）；暗色态容器裸挂 `data-dark` 即局部切换。

引入方式：引擎之后加载 `<script src="/autospark/autospark.text.js"></script>`（自举注册），或聚合产物 `autospark.plugins.js`。

## 快速入门

引擎之后加载组件脚本即注册完成，以指令值形态实例化（静态属性即 props），或元素名快速写法 `<x-text>`（引擎归一化推导，注册名前缀自动剥离）：

```html
<script src="autospark.js"></script>
<script src="autospark.text.js"></script>

<span x-component:autospark.text="{ label: '一段正文' }"></span>
<x-text label="等价元素名写法" type="secondary"></x-text>
```

插槽内容优先于 `label` 兜底；`copy` 事件经冒泡到外层消费（组件默认封闭）。

<demo html="components/general/text/basic.html"/>

## 指南

### 层级 / 语义色（type）

**类型**: `default | secondary | third | primary | success | warning | danger | info`
**默认**: `default`

文本层级三中性档：`default` 正文色、`secondary` 次要（说明性补充）、`third` 辅助（占位、脚注等最弱层级）；语义色五档对齐 button 色板（`--auto-*-color` 变量，切主题色 / 暗色即时跟随）。纯样式件以中性档为主，语义色用于状态性文本（如「危险操作已生效」提示行）。

<demo html="components/general/text/type.html"/>

### 加粗（strong）

**类型**: `boolean`
**默认**: `false`

加粗语义，字重取 `--x-font-weight-large` 标尺档（约 600）。与 type 轴正交，可任意组合。

### 溢出省略（ellipsis）

**类型**: `false | true | number`
**默认**: `false`

- `true`：**单行省略号**——容器宽度受约束时溢出截断（`text-overflow: ellipsis`）；
- `number n`：**多行截断**——超出 n 行以 line-clamp 截断（行数经 `--asc-text-lines` 变量内联下发）；
- `false`：不省略（缺省，自然换行）。

截断发生时**自动挂提示**（双轨，对齐 button 范式）：tooltip 插件在场挂 `data-tooltip`（样式统一），缺席挂原生 `title`（浏览器黄框兜底）；宿主显式 `title` / `data-tooltip` 永不覆盖。纯静态检测（不引入 ResizeObserver），插槽内容后续变化不重查为已知边界。

<demo html="components/general/text/ellipsis.html"/>

### 复制（copyable）

**类型**: `false | true | { text?: string }`
**默认**: `false`

- `true`：文本尾部出现复制图标，点击复制**渲染文本**（插槽出口文本）；
- `{ text }`：复制**指定文本**——展示文案与剪贴板内容解耦（如掩码序列号复制完整值）。

复制经 `navigator.clipboard.writeText`（需安全上下文 https/localhost）；成功反馈为图标换勾 + success 色点亮（约 1.5s 自复原），同时冒泡 `copy` 事件；失败 `console.warn` 响而不哑、不误报成功。

> **对象 props 注入提示**：`{ text }` 对象形态请经**状态引用**注入（`copyable: myConf`，`myConf` 为状态对象）——当前引擎版本对值对象内的**字面量**对象/数组 props 存在无限更新缺陷（修复在途），字面量写法会触发死循环；标量（`true` / 数字 / 字符串）props 不受影响。

<demo html="components/general/text/copyable.html"/>

### 事件

| 事件 | detail | 说明 |
| --- | --- | --- |
| `copy` | `{ text }` | 复制成功冒泡（写在**外层包裹元素**上消费，组件默认封闭） |

### 主题化

字号档位：任意祖先容器挂 `data-size="xs | sm | md | lg | xl"`（theme 手动通道）整片生效；暗色：容器裸挂 `data-dark`。使用者覆盖通道 `--asc-text-*`（如 `--asc-text-color`、`--asc-text-font-size`）；层级/语义色均可被同名覆盖变量接管（三级回退链第二级）。

## 参考

### 属性

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| label | `string` | `""` | 兜底文案（插槽内容优先） |
| type | `default \| secondary \| third \| primary \| success \| warning \| danger \| info` | `default` | 文本层级/语义色 |
| strong | `boolean` | `false` | 加粗 |
| ellipsis | `false \| true \| number` | `false` | 溢出省略（单行/多行截断 + 自动挂提示） |
| copyable | `false \| true \| { text?: string }` | `false` | 复制（成功反馈 + copy 事件冒泡） |

### 事件

| 事件 | 参数 | 说明 |
| --- | --- | --- |
| copy | `{ text: string }` | 复制成功冒泡 |

### Slots

| 插槽 | 说明 |
| --- | --- |
| 默认 | 文本内容（优先于 label 兜底；省略/复制均以其渲染文本为准） |
