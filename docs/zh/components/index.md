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
| [Button 按钮](./general/button.md) | 常规 | 形态×语义色正交的全功能按钮（图标/加载/可勾选/tags 子钮） | `autospark.button.js` |
| [StateButton 状态按钮](./general/state-button.md) | 常规 | 2-N 态循环切换的单钮（继承 button 骨架、decorate 装饰、灰色无匹配态） | `autospark.state-button.js` **须与 button 同页加载** |
| [ButtonGroup 按钮组](./general/button-group.md) | 常规 | 按钮容器：融合/间隔布局 + 缺省下发 + x-model 单选选中 | `autospark.button-group.js` **须先于 button 加载** |
| [Text 排版文本](./general/text.md) | 常规 | 层级/语义色 + 溢出省略（单行/多行）+ 复制 | `autospark.text.js` |
| [Link 链接](./general/link.md) | 常规 | 语义色链接（href/target/disabled/icon，元素名 `<x-link>` 为真 a） | `autospark.link.js` |
| [FloatButton 悬浮按钮](./general/float-button.md) | 常规 | 悬浮按钮（fixed 右下 + back-to-top 回顶形态渐显/回顶 + shape/定位偏移 + label 胶囊形态） | `autospark.float-button.js` |
| [Divider 分割线](./layout/divider.md) | 布局 | 装饰性分割线（水平/垂直/虚线/带文字位置/间距） | `autospark.divider.js` |
| [Space 间距](./layout/space.md) | 布局 | 间距容器（档位/两轴数组、方向、对齐、换行；纯样式容器） | `autospark.space.js` |
| [Grid 栅格](./layout/grid.md) | 布局 | 通用栅格容器（固定/自适应/响应式档位列数、间隙、分布、对齐） | `autospark.grid.js` |
| [Container 页面容器](./layout/container.md) | 布局 | 页面四区版式壳（header/aside/main/footer 插槽 + 侧栏位置；与 x-layout/x-container 指令三方消歧） | `autospark.container.js` |
| [Alert 警示条](./feedback/alert.md) | 反馈 | 页内警示条（语义色五档/标题描述/关闭/图标映射/通栏） | `autospark.alert.js` |
| [Progress 进度条](./feedback/progress.md) | 反馈 | 进度条（line/circle 双形态、完成自动 success、status 语义色） | `autospark.progress.js` |
| [Skeleton 骨架屏](./feedback/skeleton.md) | 反馈 | 骨架屏（text/circle/rect、rows 多行、loading 插槽切换骨架/真容） | `autospark.skeleton.js` |
| [MessageBox 确认询问](./feedback/message-box.md) | 反馈 | 确认询问对话（x-dialog 组合壳、type 图标、i18n 双钮文案） | `autospark.message-box.js` **须与 overlay、button 同页加载** |
| [Result 结果页](./feedback/result.md) | 反馈 | 操作终态页（语义色大图标 + 标题描述 + 动作区插槽；纯展示） | `autospark.result.js` |
| [Card 卡片](./display/card.md) | 展示 | 卡片容器（header/body/footer 三段插槽 + 边框/悬停/可折叠） | `autospark.card.js` |
| [Tag 标签](./display/tag.md) | 展示 | 行内语义标签（语义色×形态正交 + icon + closable） | `autospark.tag.js` |
| [Empty 空状态](./display/empty.md) | 展示 | 空状态展示（i18n 内置文案 + image 槽换图 + 附加动作） | `autospark.empty.js` |
| [Avatar 头像](./display/avatar.md) | 展示 | 头像（src/icon/label 首字符三源回退 + shape；角标经 x-badge 外挂组合） | `autospark.avatar.js` |
| [Image 图片](./display/image.md) | 展示 | 图片（lazy/fit/宽高透传 + fallback 失败占位双形态 + 加载态转圈；预览 P2 承接） | `autospark.image.js` |
| [List 列表](./display/list.md) | 展示 | 数据驱动列表容器（row 作用域插槽 + 空态/loading/virtual 组合 + 边框分隔） | `autospark.list.js` **须与 empty 同页加载**（virtual 另需 `autospark.virtual.js`） |
| [Descriptions 描述列表](./display/descriptions.md) | 展示 | 描述列表（items/子元素声明两形态 + columns/span 跨位 + bordered 表格 + vertical） | `autospark.descriptions.js` |
| [Timeline 时间线](./display/timeline.md) | 展示 | 时间线（items/子元素声明两形态 + 三 mode + 节点语义色/空心/自定义图标） | `autospark.timeline.js` |
| [Statistic 统计数值](./display/statistic.md) | 展示 | 统计数值（Intl 按语言环境格式化 + precision/千分位/分组符 + 前后缀插槽 + valueStyle） | `autospark.statistic.js` |
| [ImageViewer 图片查看器](./display/image-viewer.md) | 展示 | 全屏图片查看器（自建 fixed 层 + 缩放/旋转/键盘 + 受控 visible/index；image 联动配方） | `autospark.image-viewer.js`（联动缩略图另需 `autospark.image.js`） |
| [Carousel 轮播](./display/carousel.md) | 展示 | 轮播（items 双形态 + autoplay/loop/indicator/arrows + scroll-snap 真滚动/fade 双档 + change/el.value） | `autospark.carousel.js` |
| [Table 数据表格](./display/table.md) | 展示 | 数据表格（columns×rows 双循环 + col-\<key\> 插槽 + 排序/行选择/斑马纹 + virtual 万行网格分叉） | `autospark.table.js` **须与 empty 同页加载**（selectable 另需 `autospark.checkbox.js`、virtual 另需 `autospark.virtual.js`） |
| [Collapse 折叠面板](./display/collapse.md) | 展示 | 折叠面板组（items/子元素声明双形态 + 受控展开集 + 手风琴互斥 + grid 高度过渡） | `autospark.collapse.js` |
| [Input 输入框](./form/input.md) | 表单 | 原生增强输入框（type 文本族/clearable/密码切换/前后置/计数，携 Field 骨架基座） | `autospark.input.js`（内嵌 field 注册，无须另引） |
| [Textarea 多行文本框](./form/textarea.md) | 表单 | 原生增强多行输入（autosize/minRows/maxRows + resize/清除/计数/上下 actions，携 Field 骨架基座） | `autospark.textarea.js`（内嵌 field 注册，无须另引；actions 另需 `autospark.button.js`） |
| [Checkbox 复选框](./form/checkbox.md) | 表单 | 原生增强复选框（真 input + 自绘勾形/半选视觉，x-model.boolean 布尔语域值桥） | `autospark.checkbox.js`（内嵌 field 注册，无须另引） |
| [Radio 单选钮](./form/radio.md) | 表单 | 原生增强单选钮（真 input + 自绘圆点，原生 name 同名互斥组语义 + checked 值桥） | `autospark.radio.js`（内嵌 field 注册，无须另引） |
| [Switch 开关](./form/switch.md) | 表单 | 自绘开关（role=switch 可访问性自持，loading 态 + hidden 载体表单桥 + change 事件） | `autospark.switch.js`（内嵌 field 注册，无须另引） |
| [InputNumber 数字输入框](./form/input-number.md) | 表单 | 数字输入（步进钮+键盘、min/max 夹取、precision 修约、NaN 防御，change detail={value}） | `autospark.input-number.js`（内嵌 field 注册，无须另引） |
| [Slider 滑动条](./form/slider.md) | 表单 | 原生 range 增强（藏起仍可交互+自绘轨道视觉，showInput 配 input-number 联动，range 直提交） | `autospark.slider.js`（内嵌 field 注册；showInput 须同引 input-number 产物） |
| [Rate 评分](./form/rate.md) | 表单 | 自绘评分（内置 star ×N、半星/清零、role=slider 键盘模型、hidden 载体表单桥 + change 事件） | `autospark.rate.js`（内嵌 field 注册，无须另引） |
| [Select 选择器](./form/select.md) | 表单 | 下拉选择器（x-popover 机制面板 + 键盘导航/过滤/虚拟化，hidden 载体表单桥 + change detail={value}） | `autospark.select.js`（内嵌 field；面板须同引 `autospark.overlay.js`，virtual 另需 `autospark.virtual.js`） |
| [Transfer 穿梭框](./form/transfer.md) | 表单 | 穿梭框（双列表+穿梭钮，组合 checkbox，全选/过滤/禁用项，hidden 载体数组桥 + change detail={value}） | `autospark.transfer.js`（内嵌 checkbox/field，无跨产物依赖） |
| [ColorPicker 颜色选择器](./form/color-picker.md) | 表单 | 颜色选择器（x-popover 面板 + 自绘 HSV：SV 面板/H 条/预设色板/hex 输入，拖拽实时改色松手提交，hidden 载体 + change detail={value}） | `autospark.color-picker.js`（内嵌 field；面板须同引 `autospark.overlay.js`） |
| [DatePicker 日期选择器](./form/date-picker.md) | 表单 | 日期选择器（x-popover 日历面板：6×7 月视图/切月/今天快捷/方向键跨月漫游，hidden 载体 + change detail={value}） | `autospark.date-picker.js`（内嵌 field；面板须同引 `autospark.overlay.js`） |
| [TimePicker 时间选择器](./form/time-picker.md) | 表单 | 时间选择器（两列时/分滚动列表，点选部分提交面板保持开，hidden 载体 + change 连发） | `autospark.time-picker.js`（内嵌 field；面板须同引 `autospark.overlay.js`） |
| [TimeSelect 时间点下拉](./form/time-select.md) | 表单 | 时间点下拉（start/end/step 离散列表，select 面板直系克隆：键盘导航 + fit 宽度匹配，hidden 载体） | `autospark.time-select.js`（内嵌 field；面板须同引 `autospark.overlay.js`） |
| [Autocomplete 自动补全](./form/autocomplete.md) | 表单 | 自动补全输入（真 input + x-popover 建议面板：本地过滤 / fetch action 名异步 + 防抖 + 次序守卫 + IME 守卫，键盘上下 / Enter，select + change detail={value}） | `autospark.autocomplete.js`（内嵌 field；面板须同引 `autospark.overlay.js`） |
| [Breadcrumb 面包屑](./navigation/breadcrumb.md) | 导航 | 面包屑（items 状态引用 / 子元素声明两形态，末项当前页 aria-current + router 配方） | `autospark.breadcrumb.js` |
| [Tabs 页签](./navigation/tabs.md) | 导航 | 页签 / 分段控制器（受控 value + tablist 键盘导航 + 插槽面板区 x-show/x-if 切换） | `autospark.tabs.js` |
| [Menu 导航菜单](./navigation/menu.md) | 导航 | 导航菜单（items/子元素声明双形态，一层子菜单嵌套，受控 value + 祖先自动展开，vertical/horizontal + collapsed 图标条） | `autospark.menu.js` |
| [Steps 步骤条](./navigation/steps.md) | 导航 | 步骤条（受控 current + finish/process/wait 状态机 + clickable 点击切换 + 连线进度染色，horizontal/vertical） | `autospark.steps.js` |
| [PageHeader 页头](./navigation/page-header.md) | 导航 | 页头（title/subtitle + back 事件出口 + extra/默认双插槽，纯结构件零 i18n） | `autospark.page-header.js` |
| [Pagination 分页](./navigation/pagination.md) | 导航 | 分页器（受控 page + 页码窗口省略号折叠 + 条数切换 + simple 极简；i18n 文案 + x-for.paging 配方） | `autospark.pagination.js` |
| [Anchor 锚点导航](./navigation/anchor.md) | 导航 | 锚点导航（items 双形态 + scroll 判定线高亮 + offset/affix + 点击平滑滚动，change detail={key}） | `autospark.anchor.js` |
| [Dropdown 下拉菜单](./navigation/dropdown.md) | 导航 | 下拉菜单（默认插槽触发区 + x-popover 面板：items 双形态、hover/click、placement 透传、键盘漫游，select detail={key,item}） | `autospark.dropdown.js`（面板须同引 `autospark.overlay.js`） |
| [Affix 固钉](./other/affix.md) | 其他 | 固钉（滚动过 offset 阈值 fixed 吸附视口顶/底 + 占位撑高防跳动 + change detail={fixed}；v1 viewport 单线） | `autospark.affix.js` |
| [Watermark 水印](./other/watermark.md) | 其他 | 水印（canvas 旋转文本单元 data URL 平铺；容器/全页双形态 + 多行文案 + 主题取色三级回退） | `autospark.watermark.js` |
| [Tour 漫游引导](./other/tour.md) | 其他 | 漫游引导（steps 分步高亮 + box-shadow 遮罩 + fixed 气泡；visible/current 受控 + 末步自动关 + miss 跳步；i18n 文案） | `autospark.tour.js` |
| [Countdown 倒计时](./other/countdown.md) | 其他 | 倒计时（time 毫秒时长变化即重启 + format token 模板 {d}{h}{m}{s} + 绝对 deadline 真值计时 + finish 事件；statistic 排版语言） | `autospark.countdown.js` |

八分类全数有件落地（base 为代码组织概念不产出组件文档）。
