# 组件

AutoSpark 官方组件（组件型插件，`@autospark/plugins`）——每个组件同时是一个插件，经 `autospark.<name>.js` IIFE 产物按需引入（引擎之后加载），或聚合产物 `autospark.plugins.js` 一个标签挂全部。

组件按功能域分为八类（ADR-0017）：`base`（基类，不出独立产物）/ `general`（常规）/ `layout`（布局）/ `feedback`（反馈）/ `navigation`（导航）/ `display`（展示）/ `form`（表单）/ `other`（其他）——侧边栏与文档目录按同一分类组织（base 除外，见下）。

组件遵循同一套约定：

- **主题合规**：视觉全走 `--auto-*` 语义变量三级回退链（theme 在场自动换肤，不在场吃 `--asc-<name>-*` 覆盖变量与兜底值）；
- **档位继承**：均继承 `autospark.base` 抽象基组件（ADR-0134）——`data-size` / `data-shadow` / `data-radius` / `data-spacing` / `data-dark` / `data-colorized` 六键即主题通道，级联生效；
- **事件出口**：组件默认封闭，交互事件经冒泡到外层消费（`@change="v = $event.detail.value"` 惯用法）。

## 主题档位与 autospark.base

> ADR-0134。`autospark.base` 是 **engine 内置的抽象基组件**（`x-define.abstract`）——所有官方组件均继承它，为组件族统一提供**主题档位 props** 的宿主属性物化行为。它**不可直接实例化**、不贡献模板，仅可被 `x-define:inherit="autospark.base"` 继承（base 是代码组织概念而非面向用户的组件，故无独立文档页与产物）。

组件消费 `--auto-*` 语义变量即可自动响应主题（ADR-0129 三级回退链）；`autospark.base` 在此之上补齐**局部覆盖**通道——把六个主题档位 props 物化为宿主化身根上的 `data-*` 属性，接通 @autospark/theme 的手动通道 CSS（根域裸 `[data-size]` / `[data-dark]` 等属性选择器直接覆盖 `--auto-*` 变量、子树继承），形成**局部主题**。零依赖 theme 代码：base 只做 DOM 属性写入——theme 在场时 CSS 命中、不在场时属性静默无效。

| 键 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `data-size` | `ThemeSize` | `""` | 字号/图标等尺寸档（缺省继承祖先 scope 档位） |
| `data-shadow` | `ThemeSize` | `""` | 阴影档 |
| `data-radius` | `ThemeSize` | `""` | 圆角档 |
| `data-spacing` | `ThemeSize` | `""` | 内外间距/行高密度档 |
| `data-dark` | `boolean` | `false` | 局部暗色语境（`true` 写存在性属性） |
| `data-colorized` | `boolean` | `false` | 局部多彩语境 |

`ThemeSize = none | x-small | small | medium | large | x-large`（透传不校验——theme 是唯一真值源）。六键用法与消费通道选型（静态散属性 / 指令形态 props / 全局状态绑定三层）见各组件文档的「主题档位」章节（如 [Button · 主题档位](./general/button.md#主题档位)）。

**组件开发者注意**：继承时**不要**在自己的 `data()` 里声明这六键（子胜会静默击穿主题通道）、**不要**用这六个属性名做自有变体（theme 在场时会被档位块意外命中）；`theme`（换主题色）与 `border` 不在档位面——theme 无对应手动通道。

## 组件列表

| 组件 | 分类 | 一句话定位 | 引入顺序说明 |
| --- | --- | --- | --- |
| [Button 按钮](./general/button.md) | 常规 | 形态×语义色正交的全功能按钮（图标/加载/tags 子钮） | `autospark.button.js` |
| [StateButton 状态按钮](./general/state-button.md) | 常规 | 2-N 态循环切换的单钮（继承 button 骨架、decorate 装饰、灰色无匹配态） | `autospark.state-button.js` **须与 button 同页加载** |
| [ButtonGroup 按钮组](./general/button-group.md) | 常规 | 按钮容器：融合/间隔布局 + 缺省下发 + x-model 单选选中 | `autospark.button-group.js` **须先于 button 加载** |
| [Text 排版文本](./general/text.md) | 常规 | 层级/语义色 + 溢出省略（单行/多行）+ 复制 | `autospark.text.js` |
| [Link 链接](./general/link.md) | 常规 | 语义色链接（href/target/disabled/icon，元素名 `<x-link>` 为真 a） | `autospark.link.js` |
| [Divider 分割线](./layout/divider.md) | 布局 | 装饰性分割线（水平/垂直/虚线/带文字位置/间距） | `autospark.divider.js` |
| [Space 间距](./layout/space.md) | 布局 | 间距容器（档位/两轴数组、方向、对齐、换行；纯样式容器） | `autospark.space.js` |
| [Grid 栅格](./layout/grid.md) | 布局 | 通用栅格容器（固定/自适应/响应式档位列数、间隙、分布、对齐） | `autospark.grid.js` |
| [Alert 警示条](./feedback/alert.md) | 反馈 | 页内警示条（语义色五档/标题描述/关闭/图标映射/通栏） | `autospark.alert.js` |
| [Card 卡片](./display/card.md) | 展示 | 卡片容器（header/body/footer 三段插槽 + 边框/悬停/可折叠） | `autospark.card.js` |
| [Tag 标签](./display/tag.md) | 展示 | 行内语义标签（语义色×形态正交 + icon + closable） | `autospark.tag.js` |
| [Empty 空状态](./display/empty.md) | 展示 | 空状态展示（i18n 内置文案 + image 槽换图 + 附加动作） | `autospark.empty.js` |
| [Input 输入框](./form/input.md) | 表单 | 原生增强输入框（type 文本族/textarea/clearable/密码切换/前后置/计数，携 BaseField 骨架基座） | `autospark.input.js`（内嵌 base-field 注册，无须另引） |
| [Checkbox 复选框](./form/checkbox.md) | 表单 | 原生增强复选框（真 input + 自绘勾形/半选视觉，x-model.boolean 布尔语域值桥） | `autospark.checkbox.js`（内嵌 base-field 注册，无须另引） |
| [Radio 单选钮](./form/radio.md) | 表单 | 原生增强单选钮（真 input + 自绘圆点，原生 name 同名互斥组语义 + checked 值桥） | `autospark.radio.js`（内嵌 base-field 注册，无须另引） |
| [Switch 开关](./form/switch.md) | 表单 | 自绘开关（role=switch 可访问性自持，loading 态 + hidden 载体表单桥 + change 事件） | `autospark.switch.js`（内嵌 base-field 注册，无须另引） |

其余分类（导航 / 其他）待首个组件落地后补充——分类全集见 ADR-0017。
