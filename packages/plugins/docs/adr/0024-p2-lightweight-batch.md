# ADR-0024: P2 轻件合批——展示/导航/反馈/布局十二件

- 状态：已接受（Accepted，2026-11-13）
- 日期：2026-11-13
- 关联：ADR-0018（组件库路线图）、ADR-0019/0021（P0/P1 轻件合批先例与规避清单）、ADR-0023（table——P2 唯一重件，独立 ADR 不入本合批）

## 背景

P2 批 13 件中 12 件为轻件/组合件（唯 table 为重件独立 ADR-0023），按 ADR-0018 决策 8 合批一个 ADR。每件一节：归类声明、API 面、复用说明/取舍。全局约定继承 ADR-0018 决策 6；**视觉对齐**（2026-11-13 用户追加硬性要求）：全库视觉 token 统一——间距 `--x-spacing-*` 标尺、色板 `--asc-tone` 中转 + color-mix 派生（alert 定型）、字号经 data-size 主题通道、圆角/边框/底色 `--auto-*` 三级回退、em 基准随档位、同分类件观感互相对齐。

## 决策

### 1. descriptions 描述列表（display，P2）

**归类声明**：`src/components/display/descriptions/`，产物 `autospark.descriptions.js`。

**API 面**：items（`{ label, value, span? }[]` 状态引用）与子元素声明 `​<x-descriptions-item label span>`（precompile 折叠 data-items 标量通道，breadcrumb 范式）双形态、columns（每行列数缺省 3）、span（项级跨位，克隆体 :style 内联 grid-column）、bordered（表格形态：容器 gap 1px 间隙显线 + label 格灰底；缺省简洁形态 label：value 横排中文冒号引导）、title（空不占位）、layout（horizontal 缺省/vertical）。纯展示无事件无插槽——value 纯文本，富内容调用方模板自组（边界声明）。

**复用说明**：内部装配 x-for；columns/layout/bordered 经 JS 通道写 body 容器（x-for 宿主绑定不编译规避）；无跨插件依赖。

### 2. timeline 时间线（display，P2）

**归类声明**：`src/components/display/timeline/`，产物 `autospark.timeline.js`。

**API 面**：items（`{ content, time?, icon?, type?, hollow? }[]`）双形态；mode（left 缺省/alternate 奇偶交错 nth-child 纯 CSS/right 镜像，三态全量）；节点 = 语义色圆点（--asc-dot 中转）+ hollow 空心 + icon 自定义节点（x-icon，色随 type）；轴线末项隐藏。纯展示。

**轻件边界**：time 与 content 同侧渲染（antd alternate 对侧不做）；无 pending 态。

### 3. statistic 统计数值（display，P2）

**归类声明**：`src/components/display/statistic/`，产物 `autospark.statistic.js`。

**API 面**：value（number 经 Intl.NumberFormat / string 直出）、precision（null 保留原精度）、grouping（千分位缺省 true）、groupSeparator（formatToParts 定位替换）、prefix/suffix/title（props + 同名插槽双通道）、valueStyle（内联样式对象状态引用）。纯展示。

**语言环境联动**：locale 取全局 `$.language`（i18n 在场随词典语言，切换即时重算；未装回退 zh——依赖松弛）。**引擎边界实证**：`$` 是框架保留键（ADR-0105），语言注入须运行时经代理写创建容器，模板绑定对缺席容器写入静默失败（engine 侧根治项：模板 set trap 对 `$` 容器惰性建）。

### 4. image-viewer 图片查看器（display，P2）

**归类声明**：`src/components/display/image-viewer/`，产物 `autospark.image-viewer.js`——image 组件 P1 边界声明的预览承接件。

**API 面**：images（url 数组状态引用）/ visible（受控显隐）/ index（受控当前图：props 单向 + 内部切换写 data 广播 change 回写闭环）；缩放（scale 步进 0.2 夹取 [0.2,8]）/旋转（步进 90°），切图/打开边沿自动重置；键盘（document 级仅 visible 响应：←/→ 切换、ESC 请求关闭、+/- 缩放）；相邻图 new Image() 预加载。事件：change（detail={index}）/ close（受控语义不自行隐藏）。

**形态取舍声明（自建 fixed 全屏层，不组合 x-dialog）**：全屏暗色遮罩查看器非居中对话框——x-dialog 壳复用面几乎全数需反向覆盖，组合成本高于收益且引入跨产物依赖；自建层渲染在 engine 宿主树内（非 teleport），事件沿 DOM 冒泡外层可直接收到。已知边界：宿主祖先链 transform/filter 时 fixed 相对该祖先。全屏恒暗色声明（无明色态即无切换）。与 image 联动以配方文档交付。

### 5. carousel 轮播（display，P2）

**归类声明**：`src/components/display/carousel/`，产物 `autospark.carousel.js`。

**API 面**：items 双形态（状态引用：string url | { src?, alt?, caption?, html? }；子元素声明 precompile 折叠 data-items）、autoplay（毫秒 0 关；reduced-motion 停播；非循环末页自然停；间隔热重启）、loop、indicator（top/bottom/false）、arrows（悬停显影触屏恒显）、effect（scroll|fade）；change（detail={index}）+ el.value 桥（读当前页/写 goTo）；键盘左右（stage tabindex=0）。

**实现取舍声明**：scroll 档 CSS scroll-snap 真滚动（原生惯性免费；程序切换 scrollTo(smooth)，smooth 中间态由 settleTarget 旗吞掉防路过页误广播；用户拖动实时反推同步）；fade 档纯 CSS 叠放透明度。**高度策略按效果分档**：scroll 档图片 height: var(--asc-carousel-height, auto)（无定高链挂 100% 会塌 0——真浏览器实证），fade 档满高填充；两档共用 --asc-carousel-height。**引擎边界实证**：x-for 缺省循环索引名 `index` 在克隆体内遮蔽组件 data 同名键（双真值陷阱）——组件状态键避开 index（改名 current 规避，根治归 engine）。

### 6. collapse 折叠面板（display，P2）

**归类声明**：`src/components/display/collapse/`，产物 `autospark.collapse.js`。ADR-0018 决策 3 裁定入清单：x-foldable 单面板 +「组+互斥手风琴」增量。

**API 面**：面板元信息双形态（items：`{ key, title, disabled?, content? }[]`，content 为 HTML 字符串经 x-html 服务端数据直驱 / 子元素声明：`​<x-collapse-item>` 子元素即面板模板内容，precompile 展开三层结构经默认插槽投影）；value（展开 key 集受控：数组/逗号·空格分隔字符串归一；el.value 桥 + change detail={value}）/ accordion（互斥）/ expandIconPosition（start|end）。开合态 JS 同步（data-open 属性 + aria-expanded）驱动 CSS。

**与 x-foldable 的边界（取舍声明）**：x-foldable 是 nowrap flex 容器的行内溢出折叠（ADR-0098）——无受控 value 集、无互斥、弹出面板非原地展开，与本件「内容面板垂直展开」语义不同构，不适配。面板开合自实现 CSS 高度过渡：`grid-template-rows: 0fr→1fr` + 单子层 overflow hidden（DOM 恒保留——表单输入态/滚动位不丢；reduced-motion 停播）。

### 7. menu 导航菜单（navigation，P2）

**归类声明**：`src/components/navigation/menu/`，产物 `autospark.menu.js`。

**API 面**：items（`{ key, label, icon?, disabled?, children?[] }[]`）双形态；mode（vertical 缺省/horizontal——子菜单 hover 浮层，focus-within 键盘可达）；collapsed（vertical 专属收起图标条，子菜单右飞浮层）；受控 value（el.value 桥 + change + input 回写，缺省无激活项）；openKeys（组件内整体替换维护，可注入初始展开）；带 children 父项点击展开收起（grid-rows 动画）；激活值受控变化时祖先链自动展开（antd 同款，幂等写防 watcher 抖动）。

**取舍与边界**：children 仅一层嵌套（模板静态结构）；inline 形态不做（vertical + 常驻展开近似）；键盘漫游不做（叶子真 button 原生 Tab 可达）。router 隔离：配方文档交付。

### 8. steps 步骤条（navigation，P2）

**归类声明**：`src/components/navigation/steps/`，产物 `autospark.steps.js`。

**API 面**：items（`{ title, description?, icon? }[]`）双形态；current（受控缺省 0，number 语域归一，越上界不钳制）、status（process 缺省/finish/error 当前步态）；先行步恒 finish 打勾（x-icon 内置 yes）、后续恒 wait，状态机由 current 内联表达式推导；direction（horizontal/vertical）；clickable（点击切换 + change detail={current} + input + el.value 桥，同值短路）；连接线随所属步 finish 染主色。

**真浏览器实证并修复**：Chromium 下 abspos 子项 `align-self:flex-start` 参与高度解析使纵排竖线高度塌 0（flex 容器 abspos 对齐坑——vertical 线加 `align-self:auto` 规避，后续含 abspos 拉伸元素组件照此执行）。

### 9. page-header 页头（navigation，P2）

**归类声明**：`src/components/navigation/page-header/`，产物 `autospark.page-header.js`。

**API 面**：title/subtitle（空不渲染）；back（false 缺省/true 图标钮/文案串 = 图标+文案；点击派发 back 冒泡事件——组件不执行 history.back，接管由消费者决定，router 隔离）；slots：extra（头行右缘）+ 默认（内容区），:empty 不占位。纯结构件零 i18n。

**复用说明**：返回钮自绘轻量图标钮（quiet 形态）而非嵌套消费 button——单一钮盒饰成本低于跨产物依赖（保按需加载自包含；message-box 组合 button 的对照取舍）；箭头复用内置 arrow 旋转 180°。

### 10. pagination 分页器（navigation，P2）

**归类声明**：`src/components/navigation/pagination/`，产物 `autospark.pagination.js`。

**API 面**：page（受控 1-based，越界钳位 [1,pageCount]；el.value 数字桥 + change detail={page,pageSize} + input）/ pageSize（10）/ total（0=单页空态）/ pageSizes（条数切换数组，元素名形态经 precompile 改道 data-page-sizes——死环规避）/ simple（极简形态）。页码窗口：≤7 全量直出；>7 首页+省略号+当前页±2 五宽窗口+末页（watch 幂等——序列化签名比对同值不写，防 i18n refresh 污染）；边界原生 disabled。**i18n 六键**：`pagination.first/prev/next/last/total（"共 {n} 条"插值）/pageSize（"{n} 条/页"插值）`，键等值判定回退中文。

**复用与边界**：与 x-for.paging（引擎数据层切片）正交组合——配方：容器 `:data-paging="paging"` + 本组件 `@change="paging.page = $event.detail.page"` 一行打通。原生 select 原生增强（不引入 autospark.select）；onSizeChange 截断原生 change 冒泡（detail undefined 防外层解构炸，alert 同款纪律）。

### 11. result 结果页（feedback，P2）

**归类声明**：`src/components/feedback/result/`，产物 `autospark.result.js`。

**API 面**：type（success/error/warning/info 四档语义色 4em 大图标）/ title / description；slots：默认（动作区，button 组合配方位）+ icon（整体换图）。纯展示。

**与 alert 边界**：alert 是页内警示条（行内横条随文中断）；result 是操作终态页（居中纵排大图标+动作区，流程终点占位）——正交。语义色组织 alert 同款定型结构。

### 12. container 页面容器（layout，P2）

**归类声明**：`src/components/layout/container/`，产物 `autospark.container.js`。

**API 面**：asidePosition（start|end，grid 区域模板对调）；slots：header/aside/footer 命名 + 默认（main）；子元素声明 `​<x-container-header|aside|footer|main>`（precompile 折叠为 template x-slot:名）。纯样式结构壳——空区自动退场（:empty + grid 轨道塌缩）；滚动收敛 main；侧栏宽 `--asc-container-aside-width` 可定宽。

**三方名字撞车边界消歧（必写）**："container" 一名三物——本组件 = 四区版式结构壳（纯 CSS grid）；**x-container 指令**（autospark.layout.js）= 响应式断点容器（ADR-0101/0105）；**x-layout 指令** = grid 窗格布局机制（ADR-0074）。三者可叠用。**撞名规避实施**：本组件 `x-define-options="{tag:false}"` 关闭元素名自动推导（缺省推导与同名指令撞名——ADR-0133 撞名规则 fail-fast，聚合产物双载必炸）；`<x-container>` 元素形态由本插件 precompile 独占承载。

## 后果

- 本 ADR 定稿即 P2 轻件十二件全量入册（P3/P4 轻件另立合批 ADR；重件各组一 ADR）。
- **视觉对齐基线自本批强制**（用户指令）：间距 `--x-spacing-*` 标尺、`--asc-tone` color-mix 派生、字号经 data-size、圆角/边框 `--auto-*` 回退、em 基准随档位、hover 反馈强度同域同源（tabs 轻反馈档）；批级视觉一致性审查成为固定环节。
- 本批实证的引擎边界追加（根治归 engine 侧）：① x-for 缺省索引名 `index` 遮蔽组件 data 同名键（carousel）；② `:key` 表达式闭包仅见循环变量、组件域引用静默回退 index 键（table）；③ 嵌套 x-for 内层渲染晚一跳（table）；④ props 初值注入可晚于 mounted watch 注册（table）；⑤ happy-dom 下语义 `<table>` 内 `<template>` content 丢失（table——全 div 规避）；⑥ `$` 保留键注入须运行时代理写（statistic）；⑦ abspos 子项 align-self 参与高度解析（steps 竖线塌 0）；⑧ x-define-options tag:false 撞名规避通道（container 先例）。
