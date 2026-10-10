# ADR-0098：x-block 布局条——行内三段分区布局与溢出折叠（x-block 名复用正名）

- 状态：已采纳（2026-10-10 共识落盘，实施未开始）
- 日期：2026-10-10
- 关联：ADR-0021/0022（x-block 旧义——组件前身演进链，本 ADR 复用其名）、ADR-0056（x-slot
  组件插槽——分区标记避开之）、ADR-0060（x-popover 悬浮触发模型——溢出折叠弹出层组合之）、
  ADR-0062（overlay shell——popover shell 载体）、ADR-0067（x-splitter——值响应式换轴与
  ownsChildren 先例）、ADR-0070/0074（机制唯一实现 + 程序化组合基调）、ADR-0092/0094
  （内置组件注册面——popover 组件裸键）

## 背景

工具栏、卡片头、表单行等场景需要一条「头部 | 主体 | 尾部」的行内三段条状布局：
两端定宽收缩、中间弹性吸收、空间不足时两端内容折入弹出面板。现有布局指令均不覆盖
此形态——x-layout（ADR-0074）管整页 grid 骨架，x-splitter（ADR-0067）管双面板拖拽
分割。grilling 会话闭合全部决策面（两轮共 16 问），本文记录定案。

## 决策

### 1. 指令名复用 x-block（解除废弃 + 消歧）

`x-block` 曾是组件机制前身（ADR-0021，已演进为 x-define / x-component，词条废弃）。
本 ADR 复用其名承载布局条指令：旧义已死、无真实撞车面，改名（x-band / x-bar / x-strip）
收益低。CONTEXT.md 已废弃区词条加消歧注（两义无承继关系）、x-pane 词条等 Avoid 引用
同步修正。

### 2. 分区标记 x-block:参数（否决 x-slot:*）

`x-slot:header` 是组件插槽出口语法（ADR-0056），非组件宿主子级会被组件机制按内容段
收集 → warn + 丢弃——设计稿初稿写法按现状跑不通。分区标记采用参数化属性
`x-block:header|body|footer`（`x-pane:参数` 完全同构）：单指令名位、参数词表校验
（非法 warn + 剪枝）。body 缺失**不 warn、静默空渲染**（否决 x-layout content 缺失
的 warn 先例——弹性区缺席不构成误用，用户明确选择静默）；header/footer 缺失静默跳过。

### 3. 布局契约

- 容器 `display:flex`（column 时 `flex-direction:column`）+ `align-items:stretch`
  （分区等高）+ 分区内部 `align-items:center`（内容交叉轴居中）——两级分离化解
  「等高」与「居中」的表面矛盾（容器级 center 会使分区收缩不等高）；
- 三段 `white-space:nowrap` 不换行；header/footer `flex-shrink:0`、body
  `flex-grow:1` 恒为弹性区；
- `align` 选项值域 **`start | center | end`**（默认 `start`）——轴无关逻辑值，换轴
  随 justify-content 语义自然翻转；否决 `left|right`（column 下词义错位）与随轴换
  词表 `top|middle|bottom`（键值双换心智负担）；写旧值 warn + 忽略；
- `gap`（默认 0）/ `padding`（默认 0）/ `align` 编译期静态（number=px / CSS 长度串
  原样）；指令值 `row | column` 响应式换轴重排（x-splitter 先例）；
- 分区书写序不限、按语义序渲染（header → body → footer）；分区子树照常编译（不
  接管编译语义），x-if / x-show 分区存在性正交、变化触发溢出重算；嵌套零新机制。

### 4. 溢出折叠：溢出检测 + 渐进链

判定 = **分区级溢出**（修订记录见下）——分区被 flex 压缩后自身主轴
`scrollWidth/Height > client + 1px` 容差即「尺寸较小」的直接信号，ResizeObserver
驱动，否决阈值选项（用户需自测魔法数）。渐进收缩链：**footer 溢出先收 footer、
header 溢出再收 header，body 永不收**（弹性区收了布局即塌；body 溢出交容器裁切）。
终态：无可收分区 → 容器 `overflow:hidden` 裁切，机制到头（否决 body 内滚——用户
CSS 一行可达，YAGNI）。`overflow:false` 整体禁用（默认开启）。

> **修订一（2026-10-10 实施期）**：判据由「容器级溢出」（宿主
> `scrollWidth > clientWidth`）修订为「分区级溢出」，同时删除决策三初稿的
> header/footer `flex-shrink:0`。理由：定容（shrink:0）使两端分区永不缩小，容器变窄
> 只压缩 body，「分区尺寸变小」这一原始需求信号无从产生；分区级判据下三段随容器
> 等比压缩，分区自身被压溢出即触发折入——与设计稿「当 footer 尺寸较小时」的语义
> 精确对齐。body `flex-grow:1` 恒弹性不变。

### 5. 弹出层：x-popover 指令接管 + 常驻面板

- **触发按钮编译期预置**（修订二，见下）：分区子树编译期在分区内预置触发按钮并声明
  `x-popover:block-popover`——PopoverDirective（ADR-0060 悬浮模型）完整接管开关 /
  定位 / 动画 / shell 解析 / delayShow·delayHide / 组件等待重试；未收缩时按钮
  display:none（随收缩类切换），x-block 零自建弹层管理；
- **内容注入是唯一旁路**：活 DOM 内容无声明式投影通道——订阅 `overlay:open` 广播，
  按 `config.at.selector` 反查分区认领实例后把 stash 挂入面板；
- **载体别名 block-popover**（点自由名）：声明式 attr（`x-popover:名`）经修饰符语法
  解析，点号截断为修饰符——点前缀注册名无法经 attr 声明；别名同模板同视觉，种子表
  「全点前缀」契约显式豁免此一条（builtin-components 契约测试已记录）；
- **锚定方位随轴**：row 下 header=bottom-start / footer=bottom-end（用户裁决），
  column 对称翻转 right-start / right-end——换轴经指令实例 options 热更
  （`_resolveConfig` 每次打开现读）；
- **常驻面板偏离**：内容折叠期间常驻 stash、hover 开关仅显隐——偏离覆盖物
  「每次打开新实例、关闭即销毁」标准语义（ADR-0052）：reparent 进去的内容有原主，
  随实例销毁即丢失；实现经 `overlay:close` 广播（面板 DOM 尚在的窗口）把 stash 摘回，
  控件状态跨开关保留。偏离必要、有意记录。

> **修订二（2026-10-10 实施期）**：弹出层由「程序化组合 uiShells popover shell +
> 自建 hover 管线（getOverlay 命令式）」修订为「x-popover 指令全权接管」。动机：
> 悬浮模型的开关延迟 / 共享 hover 域 / 组件等待重试不再重复实现（自建版 ~80 行
> 手动面板管理删除）；`overlay:open` 广播的存在消解了活 DOM 注入时机难题。
>
> **修订三（2026-10-10 实施期）**：收缩单位由「分区子节点 reparent 进 stash 包装」
> 修订为「**整个分区元素** reparent（原位放引擎占位壳承载触发按钮）」——用户的分区
> class / padding 样式在面板内原样生效，分区外观由开发者自行控制（用户裁决）。
> 连带：body 增加 `bodyMinSize` 收缩下限（决策三修订）确立收缩次序
> （body 吸收 → 两端压缩 → 两端折入）。

### 6. reparent 搬移（否决渲染副本）

收缩动作三件套：分区内容 DOM reparent 进弹出面板 + 分区内注入图标按钮（footer =
more、header = menu，内置图标已有）+ 分区挂 `x-block-collapsed` 类。渲染副本方案
状态分裂、控件 ID 冲突，否决。展开恢复 = 搬回、摘类、拆按钮。按钮为真
`<button type="button">`（可聚焦），键盘通道 Enter/Space 开面板、Escape 关
（shell 既有能力）。

### 7. 事件与标识

- 事件 `block:collapse` / `block:expand`（宿主派发、冒泡，`detail = { part }`）——
  对齐 `splitter:*` / `expandable:*` / `tree:*` 冒泡家族惯例（连字符已否决的先例
  适用于全家族）；
- 收缩态标识走 **class**（`x-block-collapsed`，用户决策；引擎 `data-*` 惯例落选——
  用户明确要 class 供 CSS 断言）。

## 后果

- kind = Compile + ownsChildren（x-splitter 同型），宿主区域成为 engine.patch 动态
  区域；溢出检测/收缩管线为指令内部态，无状态绑定（v1 无写回通道）；
- 溢出检测依赖真实布局测量，happy-dom 测试经注入测量函数驱动（x-drawer 视口为 0
  的先例）；
- 样式经类级 `initialize` 全局注入（幂等），CSS 变量 `--autospark-block-*` 定制；
- 落盘物：CONTEXT.md 新词条「布局条 / x-block」「分区（Part，x-block）」「溢出折叠」
  及两处消歧修正（已完成）；实施物：`src/directives/x-block.ts` + 注册 + 文档五段
  骨架 + 测试（待实施）。
