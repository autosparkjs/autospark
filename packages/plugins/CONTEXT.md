# @autospark/plugins

AutoSpark 官方插件包：以「脚本即契约」的 IIFE 产物分发官方扩展能力（一域一产物 + 聚合全家桶），运行时零静态依赖 autospark（经命名空间桥解析，ADR-0003 实操守则）。本表固化插件包的领域语言。

> **词条来源**：应用级构造块指令 / for 渲染策略 / tooltip 特性自 engine 核心集外移（engine ADR-0128 定界、本包 ADR-0008 执行），领域词条自 `packages/engine/CONTEXT.md` 随迁——语义零漂移，实现载体变为对应产物（**选择性引入**：引哪个 `autospark.<域>.js` 就有哪个指令）。词条内「详见 ADR-XXXX」仍指 engine 侧 ADR（决策记录不迁移）。

## Language

### 尺寸调节层

**尺寸调节 / x-resizable（Resize）**:
宿主元素尺寸的拖拽调节指令（ADR-0064，2026-10-11 由 x-resize 更名，旧名入废弃链）：**可选值双向**——无值 = 纯 DOM 直改 `style.width/height`；有值（`x-resizable="size"`）= 双向绑定，拖拽中实时写回 `{width, height}`（px number，经调度器合并），外部改状态反向同步宿主（过「尺寸钳制」管线、等值短路防循环），语义与 x-model 的双向同源。Compile 类（编译期注入「调节手柄」+ 建绑定），动态启停用 x-if 包宿主表达，不发明值语法。
_Avoid_: 缩放（那是 transform scale 语义）、可调节（泛化）、resize 绑定（它是交互指令，值是数据通道不是绑定目标）

**调节手柄 / Resize Handle**:
编译期注入宿主的**真实子元素**（`data-autospark-resize-handle="<方向>"` 契约，不参与子树重编译），可聚焦，方向键 ±1px / Shift+方向键 ±10px 微调（同「尺寸钳制」管线）。视觉经类级 `initialize` 全局注入（幂等），CSS 变量 `--autospark-resize-handle-*` 定制。8 向完整支持需宿主 `absolute/fixed`——文档流元素只保留自然方向（e/s/se），其余方向编译期丢弃 + warn（不自动改 position）。
_Avoid_: 拖拽手柄（那是 x-tree 拖拽预留的 drag handle 概念）、grip / sizer（英文别名）、resize 控件（它是子元素不是控件）

**方向枚举 / handles**:
八方向枚举 `n/s/e/w/ne/nw/se/sw`（北=上）。声明走 `handles` 选项（逗号串或数组），修饰符 `x-resizable.e.s.se` 解析期并入（ADR-0007）；默认 `e,s,se`（流内自然最大集——流内元素左/上边缘锚定布局位，反向拖拽需补偿 left/top，非自然方向仅对定位元素开放）。**grid item 豁免**（ADR-0074）：父容器 `display:grid` 时 `w` 放行且免位置补偿——轨道定位下 width 单写即对缘让位；`n` 仍保守丢弃（行轨道下顶缘跟手性不保证）。
_Avoid_: 四边四角（口语——边和角统一叫方向）、edges（同上）、方位（泛化）

**尺寸钳制 / Clamp Chain**:
调节量的统一处理管线：**raw Δ → snap 吸附 → aspectRatio 等比 → min/max 钳制**（钳制恒最后，约束是硬边界）。约束值 `number`（px）| CSS 长度串；来源回退链：指令选项（`minWidth/maxWidth/minHeight/maxHeight`）→ 宿主 computed `min-width/max-width`（CSS 声明的约束天然生效，指令选项显式值优先）。`snap`（px 步进，默认 0 关）、`aspectRatio`（宽/高数值）。
_Avoid_: 边界限制（泛化）、min/max 选项（它们是四个独立键的统称，不是键名）、CSS 约束优先（方向反——指令选项才是权威层）

**调节事件 / resize:\***:
resize 手势生命周期的 DOM 冒泡事件（宿主派发）：`resize:start` / `resize:move`（持续） / `resize:end`，`detail = { width, height, handle }`（px number，end 为最终值），外界 `@resize:end="..."` 接。冒号命名空间对齐 `tree:*` / `tooltip:*` / `overlay:*` 惯例（grilling 共识曾为连字符，落盘时对齐家族词汇修正）；覆盖物形态同样派发在**指令宿主**（非 shell），绑定语法不变。
_Avoid_: resize-start 连字符（家族惯例是冒号命名空间）、裸 resize（与 DOM 原生 window resize 事件撞名）、resizing（英文进行态——move 对齐 tree:expand 的动词本干风格）

**覆盖物尺寸调节 / overlay resize（drawer / dialog）**:
覆盖物消费者的 `resize` 选项（ADR-0064）：`true`（方向自动推导 + 默认约束）| 对象（字段与 x-resizable 选项表同构；`handles` 只能在合法集内**收窄**，越界 warn + 忽略）。方向推导贴合形态几何：drawer 贴边内侧单边（`placement: left` → `e`，类推）、dialog 四角（`ne,nw,se,sw`）。写路径走 **shell 定位体系**（与普通元素 style 直改分离，钳制/手柄/指针核心逻辑复用）；**不写回 store**（「调节事件」detail 即数据出口——overlay 选项语法无绑定位）；尺寸**会话内记忆**（指令实例状态，重开沿用、优先于声明 `size` / CSS 尺寸，engine destroy 才清）。
_Avoid_: overlay 缩放、可拖拽面板（泛化）、宽度绑定（不写回状态）

### 分割器层

**分割器 / x-splitter（Splitter）**:
两面板分割布局的结构指令（ADR-0067）：宿主的两个渲染子元素（面板）之间由引擎注入分隔条，拖拽（或键盘）调节定容面板的主轴尺寸，自适应面板恒吸收剩余空间。值 = direction 表达式（`'horizontal'` 左右分栏 / `'vertical'` 上下分栏，**其余一切值静默归一 horizontal**；响应式切换 = 换轴重排、DOM 不重建、定容尺寸同值换轴重写）。结构契约：只认两个渲染子元素（多余 warn + 丢弃、template/script 静默容忍）、不足两个 warn 降级普通编译。嵌套零新机制。
_Avoid_: 分栏容器（泛化）、split-panel（曾用名，grilling 中期更名 x-splitter——panel 与 pane 一字之差易混淆）、布局组件（无组件机制参与）、grid 分栏（实现是 flex）

**面板 / Pane**:
分割器的**子元素**——被分割的东西。每个分割器恒两面板（分隔条前 / 后各一），面板是正常编译的子树（自身指令、嵌套分割器照常工作）。
_Avoid_: 子元素（泛化）、column/row（方向耦合词，面板在两方向下同权）、split panel（那是旧指令名，容器正名是分割器）

**定容面板 / Sized Pane**:
声明 `data-size` 的面板——拖拽调节的对象。至多一个（两个都声明 warn + 第二个按自适应处理——拖拽需要吸收方是结构前提）。`data-size` 为 CSS 长度全形态（纯数字按 px）、**保持声明单位写回**（`30%` 拖后仍 `%`，单位是布局意图）；`data-min-size` / `data-max-size` 仅它认读（自适应面板上声明 warn + 忽略）；初始声明值不钳制（声明即真相），拖拽钳制恒遵守；绑定形态 `:data-size` 简单路径双向（拖拽实时写回 / 外部反向同步 / 等值短路 + 会话抑制防递归），表达式形态 warn 一次单向降级。
_Avoid_: 固定面板（「固定」暗示不可调）、可调节元素（用户初期用语——自适应面板同样参与布局，可调节的是分隔条手势）、fixed 尺寸（position 语义撞词）

**自适应面板 / Auto Pane**:
未声明 `data-size` 的面板——恒 flex:1 吸收剩余空间，可被拖至 0 宽（无隐式防挤压下限；保底需求用定容面板的 `max` 表达）。双自适应 = 静态等分形态：分隔条退化为纯视觉分界（不可聚焦不可拖；自适应面板声明 `data-expandable` warn + 忽略——折叠仅定容面板可启用）。
_Avoid_: 自动面板（「自动」歧义）、弹性面板（flex 术语泛化）、剩余面板（实现视角词）

**分隔条 / Divider**:
两面板之间引擎注入的**真实元素**（`role="separator"` 可聚焦）——拖拽命中区（默认 10px）+ 居中 2px 指示线（CSS 变量可调）。键盘方向键 = 分隔条的几何位移方向（±1px / Shift ±10px）。
_Avoid_: 拖拽手柄（那是 x-resizable 的 Resize Handle 概念）、指示线（只是它的视觉层，命中区是本体）、分割线（泛化）、grip / sizer（英文别名）

**折叠（x-splitter）**:
定容面板声明 `data-expandable` 启用的折叠（ADR-0070：机制整体组合 x-expandable，`collapsible` 选项与分隔条把手已清除）——面板上实例化 x-expandable，把手/动画/事件全走其原生管线。**折叠布尔为真相**（expandable 持有，ADR-0067 决策七在组合语境被推翻；派生检测仅存「拖拽跨折叠目标 → 翻转布尔」单点）。折叠目标 = `data-expandable` 的 `minSize`（未声明或 0 = 负 margin 滑出、`> 0` = 收缩迷你形态，`data-minimize-size` 已删除）；`direction` 按 sized 位次推导（首位 `left`/次位 `right`，vertical 类推，options 中写无效）；展开尺寸由 splitter 写回（`lastSize` 记忆链保留——面板尺寸经拖拽动态产生；options 中 `maxSize` 无效 warn）。把手骑面板活动边线（即分隔条所在边界，几何与旧分隔条把手重合）、默认 `showTrigger:'hover'`——分隔条本身充当**全长感应线**（divider hover 经桥接类显形把手，x-expandable 感应边条在本语境被样式表抑制以免遮挡拖拽命中区）、折叠态恒显。事件 `expandable:collapse/expand` 面板派发冒泡（`splitter:collapse/expand` 已删除，宿主监听靠冒泡）；`splitter:resize` 不受影响。属性值专职 options JSON（空属性 = 全默认），折叠态内部持有、程序控制经事件外泄。初始声明尺寸等于 minSize 即初始折叠（无动画不派发）。
_Avoid_: collapsible（已删除的旧容器选项）、minimize-size（已删除，折叠目标归 `data-expandable` 的 `minSize`）、collapsed 状态（组合后布尔为真相，派生词汇过时）、收起（单向词，折叠是双向翻转）、width:0 折叠（0 目标 = 负 margin 滑出）

### 布局层

**布局容器 / x-layout（Layout）**:
grid 骨架结构指令（ADR-0074）：宿主直接子元素中只认 x-pane 标记的**布局窗格**（其余编译期剪枝 + warn），编译期按窗格组合动态生成 `grid-template-areas`——header 全宽是缺省态，行带归属由窗格存在性与 through 组合决定。gap = 所有相邻窗格间距（number 按 px / 字符串原样作 CSS `gap` 值）。纯布局零视觉（背景/边框全由用户窗格自带），所有窗格 `position:relative`。嵌套零新机制（窗格归属**最近 x-layout 祖先**，窗格内是正常编译子树——可嵌 x-splitter / 子 layout）。ownsChildren：宿主区域自动成为 engine.patch 动态区域。
_Avoid_: 布局组件（无组件机制参与）、页面框架（泛化）、面板容器（那是 x-splitter 语境词汇）

**布局窗格 / Layout Pane（x-pane）**:
布局容器的**布局单元**——`x-pane:参数` 标记的直接子元素，参数词表固定 `header | content | sidebar | footer`；`sidebar` 必带 `.left` / `.right` 修饰符（缺省按 `.left`），参数不在词表 warn + 剪枝。content 必需（缺失 warn + 降级渲染空容器），header/footer/sidebar 可选。同侧多窗格按 DOM 序并排，**仅首个有 through 资格**。存在性与 x-if / x-show 正交配合（见「布局回流」）。
_Avoid_: 面板 / Pane（那是 x-splitter 的子元素正名——两概念并存，须以全称 Layout Pane / 分割器面板消歧）、x-slot（那是组件插槽出口，ADR-0056，命名竞选时因撞名被否）、区域 / region（命名竞选中落选词，勿混用）、布局块（x-block 更旧义已废弃——组件机制前身已由 x-define 承接；x-block 名后经溢出折叠容器三度使用并更名 x-foldable，勿混用）

**贯穿 / through**:
sidebar 窗格**纵向跨过 header / footer 行带**的声明（`"up"` / `"down"` / `"up,down"`；`.up` / `.down` 修饰符为等价简写）：`up` = 该侧栏上延至容器顶、header 被推向对侧；`down` = 下延至容器底、footer 同理；左右都 up 时 header 夹在中间。仅 sidebar 支持（header/footer 上声明 warn + 忽略）；**header 全宽是缺省态**，由 sidebar 未声明 through 自然表达，无独立配置。编译期静态，变更需重编译。
_Avoid_: 通栏、横跨（语义反向——是 sidebar 贯穿行带，不是 header 额外配置）、浮动侧栏（不脱离文档流）、穿透（组件数据边界术语）

**布局回流（Layout Reflow）**:
窗格存在性变化时的布局重算契约：x-pane 编译期订阅同元素 x-if / x-show 的存在性表达式（scope.watch 双轨），变化 → 重算 grid-template-areas，被剔除窗格挂 `data-layout-absent`（`display:none!important` 契约，压过 x-show 的 inline display）。**窗格元素永不 reparent**（焦点/滚动/指令运行态全保留）；x-if 的标准移除语义、x-show 的显隐语义均不被接管，x-pane 只读同一表达式驱动模板。
_Avoid_: 重排（浏览器 layout 术语撞词）、重建（反契约——恰恰不重建）、显隐接管（x-pane 不改写 x-if/x-show 语义）

**窗格分割（Pane Splitting）**:
同侧 ≥2 窗格并排时，x-layout 编译期创建分割容器并**程序化组合 x-splitter**（3+ 走嵌套链）：窗格间分隔条**守恒分割**（两窗格反向增减、该侧总宽不变），splitter 的键盘/拖拽/折叠联动能力全部继承；窗格被编译期一次性 reparent 进分割容器（静态，无运行态损失）。单窗格侧不分割。
_Avoid_: 内建分隔条（组合而非自建，ADR-0070「机制唯一实现 + 组合」基调）、均分（默认各 240px 可经窗格选项覆盖，非均分语义）

**窗格尺寸调节（Pane Resizing）**:
未参与分割的窗格的尺寸通道：**sidebar 默认注入** x-resizable（内缘单方向手柄——left 拖东缘 / right 拖西缘）+ x-expandable（`compose` 程序化组合，ADR-0070 先例），拖拽跨折叠目标自动翻转折叠布尔（折叠目标 / lastSize 恢复链沿用 splitter 模型）；header / footer 显式挂 `x-resizable` 合法（auto 轨道跟随元素尺寸）、content 上挂 warn（1fr 轨道拖拽无效）。**显式声明优先于默认注入**（options 全生效）；默认注入 = 内部态，状态绑定须显式 `x-expandable="路径"`；opt-out = `x-pane-options={expandable:false}` / `{resize:false}`；注入实例的 options 读同元素 `x-expandable-options`。默认尺寸（header/footer 64px、sidebar 240px）经 CSS 变量注入——用户 CSS 与窗格选项（`{height}` / `{width}`，inline）两条覆盖路都通。
_Avoid_: 默认可调（header/footer/sidebar 之外的窗格无默认注入）、单向吸收（pane 间分割是守恒语义，单侧吸收被否决）

**溢出折叠容器 / x-foldable（Foldable）**:
nowrap flex 容器结构指令（ADR-0098 重写版，2026-10-10 由 x-block 更名，旧名入废弃链）：值 = 主轴 `row | column`（裸词按字面量，其余按响应式表达式求值——状态变化换轴，折叠元素先按原位锚复位再全量重算，触发按钮弹出方位随轴热更）。容器 `display:flex` + `nowrap` + `align-items:center`（row/column 对称）；**直接子元素强制 `flex-grow:0` / `flex-shrink:0`**（引擎全局样式唯一决定，无伸缩直通出口——伸缩态主轴尺寸是拉伸布局宽而非自然宽，污染溢出求和判据；空间不足交给折叠机制而非 flex 压缩/拉伸）。gap 由用户 CSS 承载（引擎不预设），克隆语义使其在面板内天然延续。与 x-layout 分工：x-layout 管整页 grid 骨架，x-foldable 管行内溢出折叠（工具栏 / 面包屑 / 标签条）。
_Avoid_: 布局条 / 三段分区（初稿废弃模型——`x-foldable:header|body|footer` 分区标记已废除，attr 非空即误用 warn）、布局块（更旧义，见已废弃区——组件机制前身已由 x-define 承接）、工具栏（典型场景不是本体）、面板 / 窗格（各归 x-splitter Pane / x-layout Layout Pane）

**溢出折叠（Overflow Collapse，x-foldable）**:
容器的核心机制：空间不足时**从主轴末尾起把可见子元素逐个折入 more 按钮的弹出面板**，空间恢复按 LIFO 原序还原。判定 = **对齐无关求和**（`contentMain = Σ可见子元素与触发按钮的主轴尺寸 + gap×(n-1)` > 主轴内容可用宽 `clientMain − 主轴 padding`（子元素布局在 content box 内）即溢出——不读 scrollWidth：flex-end 等主轴对齐下溢出向起始侧不计入、不溢出态又取 max(内容, client)，两态皆不可靠）+ **步进收敛**（每步一次真实布局：折叠 = 末个**可见**子元素缓存自然尺寸与原位锚后真实搬移出文档存 stash；`display:none` 子元素宽 0 永不折叠、栈中隐藏者跳过恢复等可见后自然回位；恢复 = 从栈顶真实放回后按 contentMain 复验，放不下同帧折回本人并停步（防振荡；面板开态跳过栈内已挂入面板出口的元素，面板关闭摘回后自然回位））。宿主 `min-width`（column 对称 `min-height`）= 触发按钮主轴尺寸，首次折叠写入后不撤（同值不重写防 RO 循环）。**重估通道**：ResizeObserver（宿主 + 子元素）+ MutationObserver（childList + 换轴 data-direction 属性变化）+ window resize 兜底——子元素增删、内容尺寸变化全部跟随，「绑定生效但布局不跟随」零容忍。**已知代价**：Runtime 类指令（x-loading 等）随搬移 unmount/重挂、运行态重置（交互控件类子元素无感）。
_Avoid_: 阈值判定 / 渐进收缩链 / 分区收缩（初稿废弃模型词汇）、收起（单向词，折叠是双向）、渲染副本（搬移不是复制——绑定全程存活）、移动内容（reparent 是搬移，但语义重点是「折叠态」而非动作本身）

**more 按钮（More Trigger，x-foldable）**:
溢出时宿主**末尾**出现的折叠入口按钮（容器直接子元素、`flex-shrink:0`；未溢出 `display:none`——不参与 flex 布局、不计 gap，显示与折叠态单一真相在指令）。内置 `more` 图标 + `aria-label="更多"`，hover 触发弹出面板（PopoverDirective 全权接管开关/定位/动画，键盘 Enter/Space 等价开关）。
_Avoid_: 点击弹出（more 入口固定悬浮触发，未随 x-popover 的 `trigger` 选项暴露 click）、more 定制入口（v1 无——仅 CSS 变量视觉定制）、溢出菜单（泛化）

**面板外壳（Panel Shell，x-foldable）**:
弹出面板的容器形态：**默认无壳**——走 x-popover 内置 `autospark.popover` 种子 shell（自带边框/默认出口/箭头载体，锚定模式 arrow 默认开启，默认 `padding:0.5em`），宿主样式不克隆延续；`x-foldable-options.shell` 显式指定组件名时才以用户外壳为容器（须自带默认出口，解析走 popover 的 scope 链 + 全局组件表协议）。折叠子元素挂入面板出口时打 `autospark-foldable-panel` 类——垂直堆叠布局 + 兜底 gap（CSS 变量 `--autospark-foldable-panel-gap`）。`x-foldable-options.popover` 对象整包透传合并进触发按钮的 `x-popover-options`（用户值优先）。
_Avoid_: 宿主克隆壳（旧机制，已随 ADR-0098 修订记录 10 移除——不再克隆宿主作面板容器）；克隆延续（面板视觉与宿主解耦是新版语义）

### 视口糖层

**视口显隐 / x-viewport（Viewport Visibility）**:
视口档位的声明式显隐糖（ADR-0106）：`x-viewport="md"` 仅 md 档可见、`x-viewport="xs,sm"` 多档可见、`x-viewport.hide="md"` 除 md 外可见。内部订阅全局视口档位状态 `$.viewport` 判定：隐藏 = 挂 `autospark-viewport-hidden` 类（`display:none !important`）、可见 = 摘类——**不碰 inline display**，与 x-show 同元素组合时**档位隐藏恒胜**（x-show 的显隐 / 动画 / 用户 CSS 只在档位可见时有话语权）；与 x-if（存在性）正交。档位未知（viewport: false / 无 matchMedia / 非法写入）时静默失效恒可见（零告警）。v1 无动画。
_Avoid_: `x-viewport="!md"` 反向语法（反向走 `.hide` 修饰符）、未知档名告警预期（静默跳过）、x-viewport-options（无配置项）、范围语法 md+（未立项——`['md','lg','xl','xxl'].includes($.viewport)` 表达）、把它当存在性指令（摘 DOM 走 x-if）

**响应式容器 / x-container（Responsive Container）**:
Bootstrap `.container` 心智的断点容器指令：宿主获得 `width:100%` + 按档 `max-width` + 居中（`margin-inline:auto`，默认开不可关——想不居中别用容器）+ gutter（`padding-inline: var(--autospark-container-gutter, 0.75rem)`，仅 CSS 变量无选项面）的视觉契约。**档位真相全局唯一**（视口档位状态 `$.viewport`，ADR-0105）——指令自身不做断点判定，仅订阅 `$.viewport` 切换宿主常驻的 `data-breakpoint="<档名>"`（纯 CSS 子代选择器与测试的 DOM 暴露面）；按档 max-width 走纯 CSS media query（engine 生效阈值表 × 实例 `maxWidths` 指纹 scoped style）。`.fluid` 修饰符关闭按档 max-width（恒 100% 通栏），`data-breakpoint` 照常——「纯状态探针 + 无约束容器」用法。
_Avoid_: 布局容器（那是 x-layout 正名——grid 骨架）、@container / 容器查询（CSS 原生概念，`.self` 判定刻意不用它）、响应式（本表默认 reactive 语义——指断点语义须写全称）、档名写回 / `x-container="path"` / viewport:change（ADR-0105 已废——订阅 `$.viewport` 表达式替代）

### 版本糖层

**版本显隐 / x-version（Version Visibility）**:
版本匹配表达式的声明式显隐糖（engine ADR-0119）：`x-version="2"` 仅版本 2 可见、`x-version="<=3,=1,2"` 任一子句命中即可见（逗号 OR、无 AND）、`!=` 排除、`/re/flags` 正则（斜杠定界、正则内逗号不分割）；裸值 ≡ `=`；有序比较数值优先、点分数字段逐段比较、不可比子句 false。x-show 机制族（可见性）：隐藏 = 挂 `autospark-version-hidden` 类（`display:none !important`）、可见 = 摘类，**不碰 inline display**——与 x-show 同元素**版本隐藏恒胜**；与 x-viewport 两类独立、任一命中即隐；与 x-if/x-for/x-switch 正交可共存（不占子树）。订阅 `$.version` 响应式重算；`$.version` undefined 或表达式为空 → 静默忽略恒渲染；非法子句 → warn + 指令整体忽略。v1 无动画。
_Avoid_: inline display 直写（与 x-show 冲突——走类）、存在性摘除（那是 x-if）、`.hide` 反向修饰符（未立项——`!=` 与正则覆盖）、x-version-options（无配置项）、AND 组合（v1 无——嵌套元素表达）

### 展开折叠层

**展开折叠 / x-expandable（Expandable）**:
宿主元素的通用展开/折叠指令：值是**展开态布尔**（true=展开）双向绑定——简单路径点击把手经 `setVal` 回写（x-model 防循环纪律同款）、表达式 warn 一次只读降级。`direction` 指收起方向（停靠边：`left` = 向左收起，把手骑活动边即对侧边线；默认 `left`）。折叠通道由 `minSize` 分派：`0`（默认）= **滑出折叠**——宽度/高度保持不改，`collapse:'margin'`（默认）负 margin 滑出（占位归零、兄弟流入）或 `'slide'` transform 平移（占位不变，服务 fixed 覆盖形态），终态持续保持不归零；`> 0` = 尺寸收缩动画（width/height 过渡至 minSize，子内容不隐藏——迷你形态内容可见）。展开时 `maxSize` 有值写内联尺寸、缺省移除内联尺寸由 CSS 决定（不快照记忆）。初始值 false 编译期立即应用折叠态、无动画（splitter 惯例）。**折叠机制唯一实现**（ADR-0070 组合落定）：x-splitter 经面板 `data-expandable` 声明全机制组合（折叠布尔由本指令持有，splitter 折叠不再是纯派生态）；x-drawer 经共享把手模块统一把手层（折叠 ≡ visible 归假语义不变）。**内建单边 resize**（ADR-0072 内建 + ADR-0073 迁移）：`resize` 选项启用（方向由折叠方向推导、复用 x-resizable 的 ResizeSession 核心、拖出尺寸接管展开尺寸真相），`enable:false` 退化为纯单边 resize——**与 x-resizable 同元素互斥**（x-resizable 自失效，边线交互单指令独占）；把手与手柄同骑活动边线时**把手压手柄之上**（宿主 `data-resize` 标记 + 样式表抬层级——手柄带盖住把手会让折叠不可点）、**感应边条让位手柄**（手柄 hover/聚焦经 `data-edge-hover` 桥接显形把手，与 splitter/drawer 同一契约）；drawer 的 resize 迁移至此通道（组合 `resized` 钩子路由会话记忆，dialog 四角保留 overlay 机制；splitter 面板调节走分隔条拖拽、`data-expandable` 的 resize 被接管 warn 忽略）。事件 `expandable:expand` / `expandable:collapse`（宿主派发、冒泡、detail `{size}`）。
_Avoid_: collapsed 状态（splitter 组合后布尔为真相，派生词汇已过时）、收起（单向词）、toggle / trigger（drawer 把手先后废弃的旧选项名，统一 `expandable`）、推挤 / push（未实现形态勿暗示）

**展开把手（Expandable Trigger）**:
**圆心骑边线**的圆形折叠控制按钮（20px、内置全局图标 `arrow`、样式契约同 splitter 折叠把手；`role=button` 键盘可达、箭头随折叠态翻转指向下一步动作）：展开态圆心骑宿主**活动边线**（外半圆突出）；滑出折叠态圆心骑父容器**停靠边线**（外一半被裁呈半圆把手，drawer 形态），图标缩至 0.65 倍并平移 1/4 圆径移入半圆中心保完整可见。滑轨坐标 `pos` 三态对齐家族惯例（`'center'` 默认 ≡ `'50%'` / number=px / CSS 长度串负值距对端，越界静默钳制——把手是唯一重开触点）。**动态挂载（reparent）**：展开态挂宿主内骑活动边；滑出折叠（minSize=0）完成后移入父容器骑停靠边线（宿主滑出后其内子元素随容器裁剪，把手外迁保常驻可达；滑出全程圆心恒贴边线，reparent 零跳变），展开动画启动前移回宿主；minSize>0 折叠不迁移（宿主不滑出）。折叠态子内容经 `[data-collapsed]` 规则 `visibility:hidden`（把手排除）——宿主自身不能 `overflow:hidden`（宽度保持的盒子会把 absolute 把手一并裁掉）；把手定位上下文由指令在宿主 computed `position` 为 static 时 inline 补 `relative`（fixed/absolute 宿主不动——slide 通道的覆盖形态）。**层级**：把手 z5、感应边条 z4、resize 手柄 z10；**同宿主启用内建 resize 时把手压手柄之上**（z11，否则调节线横穿圆面且命中被拦 → hover 模式下折叠不可点），手柄 hover/聚焦经 `data-edge-hover` 桥接显形把手（drawer 让位语义方向相反：其把手在覆盖物容器、层级抬不动只能把命中让给手柄）。**共享把手模块**（ADR-0070）：把手机制（元素构建/滑轨坐标/半圆折叠态/箭头矩阵）抽为独立模块，x-drawer 为第二消费者——抽屉把手不再有独立实现，本词条类名与变量族即全引擎折叠把手的唯一契约。
_Avoid_: 抽屉把手（x-drawer 已组合本机制，见「抽屉把手」词条）、拖拽手柄 / resize handle（x-resizable 词汇）、grip（英文别名）、toggle 按钮（同已废弃词）

**父容器注入 / injectOverflow（Overflow Injection）**:
滑出折叠（margin 通道）对宿主父容器的 `overflow:hidden` 注入契约：默认（`injectOverflow: true`）**折叠期间**由指令注入——折叠动画开始挂、保持至展开动画完成后恢复原值（终态宿主滑出在外，动画瞬间注入摘除会令溢出重新可见）；父容器本为 `hidden/clip` 幂等跳过；多实例共享父容器引用计数、最后一个展开完成才恢复；原值 `auto/scroll` 的滚动条折叠期间暂失（已知副作用）。`false` 显式禁用后回落编译期检测：父容器 computed overflow 非 `hidden/clip` 时 warn 一次、由用户自负。
_Avoid_: 自动裁剪（泛化）、overflow 选项（语义不完整——它只表达注入开关）

### 树形渲染层

**树形渲染 / x-tree（Tree Rendering）**:
嵌套子容器递归渲染树数据：`x-tree="node of nodes"`（`of` 必写，对齐 x-for），DOM 即树（`ul > li > ul > li…`）。容器直接子元素只认 `x-tree-node`（无值布尔标记，值 warn 忽略），其余 warn 丢弃；折叠两态对齐 x-if 家族——默认 eager（销毁子行）/ `.keepalive`（`display:none` 保活）。数据归一化：单根 `{...}` 与多根 `[{...}]` 归一为根数组；id 重复 / 循环引用 warn。节点 key 唯一来源 `idField`（默认 `"id"`，无 id 回退层级路径），`:key` 在宿主上 warn 忽略。空态 `x-empty` 只认真空数组 `[]`。详见 ADR-0040。
_Avoid_: 扁平连续段（已否决的结构：动画/保活/懒加载挂载全面劣势）、x-tree-node 带值特化（已否决：无场景输入，纯标记）、虚拟滚动（嵌套结构不可行，超大树靠折叠）、format:list / 平铺建树（已移除，ADR-0040 修订三：建树是数据转换职责归数据层，指令只接受嵌套格式）

**子容器 / x-tree-children（Children Container）**:
节点模板内声明「子节点渲染到这里」的无值标记（取第一个、多余 warn；模板无此标记 → warn + 不递归）。子容器位置天生固定（节点行的一部分），折叠 = `display` 翻转（keepalive 到此为止）或翻转 + 销毁子行 scope（eager）——**不走 x-if 的 detach/锚点机制**（位置固定无需锚点，且 display 翻转保住 CSS 过渡通道）。动画以子容器**整体**接入 Animator（见「进出场动画」），默认 `expand` 高度过渡（后续节点平滑跟随；类名型 transform/opacity 不参与布局，树上后续节点会跳位），折叠离场延迟最终态与 x-show 同构。
_Avoid_: 子树容器（泛化）、嵌套槽（x-tree 行模板不经插槽传递，ADR-0040；勿与 x-isolate 隔离快照混淆）、递归点（实现视角词，用户词汇是容器）

**节点模板三级优先（Node Template Priority）**:
x-tree 渲染节点行的模板来源优先级：原地 `<li x-tree-node>`（用户定制）> `tree-node` 组件（scope 链 `getComponentDeclaration` 就近 + `engine.options.components` 全局兜底）> 引擎内置默认节点模板（缩进 + 箭头 + `nameField` 字段，默认 `"name"`）——与 x-loading 的 DEFAULT_BLOCK 组件覆盖机制同构。「实例化消费整棵树」由通用组件机制承担（用户 `x-define="my-tree"` 包装 x-tree 容器），引擎不内置递归组件。
_Avoid_: 插槽传节点模板（x-tree 行模板三级优先不经 x-slot 插槽传递，ADR-0040；组件内容投影另走 x-slot）、内置递归组件（已否决：每节点组件实例开销 + 无工具链模板字符串）、默认模板（泛指——是三级中的最末级，非独立机制）

**展开回退（Expand Fallback）**:
节点有效展开态的回退规则：`expandField 有值 ? !!值 : (level + 1 < defaultExpandLevel)`——回退**永不落盘**；仅用户 toggle 时刻写 `expandField = !有效值`（惰性写回，引擎写用户数据的唯一例外场景之一）。`defaultExpandLevel = N` 即前 N 层可见（默认 `1` = 根层可见、根不展开），声明 `<1` 按 1 处理；`$level` 0-based（根 = 0）。否决「初始化期写数据」：异步数据下初始化时机不稳且反复污染源数据。toggle 触点：默认整行；模板内 `x-tree-toggle`（标记属性）收窄；声明 `selectedField`（P2）后整行点击自动改为选中、展开仅认 toggle 标记。
_Avoid_: expend（错拼，意为「花费」）、初始化展开（写盘时机不稳的已否决方案）、expandField 全量落盘（只有 toggle 才写）

**懒加载节点 / 加载指示字段（Load Marker Field）**:
节点数据带**加载指示字段**（`loadedField` 选项指定字段名，默认 `"loaded"`）即为**懒加载节点**：`true` = 子数据已取回、`false` = 未取回；**无此字段即非懒加载节点**，永不触发任何加载。判据必须是显式字段——「childrenField 缺失」是已否决的隐式判据（分不清「确定叶子」与「尚未加载」）。**未加载不等于叶子**：`loaded:false` 的节点可展开、不可按叶子处理；叶子判定只对「已加载 / 非懒加载」节点用 children 有无。**成功路径宿主只写 children**——children 到达即由引擎自动置 `loaded = true`（自动翻转只挂 children 到达路径：`loaded` 写入是宿主权威信号，`false` = 失效重载）；手动补写 `true` 幂等兼容。**失败路径**：宿主调 `tree:load` detail 携带的 `fail(err)` → 错误挂行生命周期（不落盘）——图标转红 `file-error` + 行挂 `data-tooltip = err.message`；清除 = 完成信号到达 / 重发（重展开、写回 `loaded:false`）/ eager 折叠（keepalive 保留）。写回 `loaded: false` 即**失效重载**（已展开原位重发、折叠态留待展开过渡）。触发门 = 未加载 && 有效展开 && 模板递归，命中即广播 `tree:load`（请求，detail 含 `fail`）；在途去重挂**行生命周期**——eager 折叠清在途（再展开 = 免 API 重试）、keepalive 保留。详见 ADR-0090。
_Avoid_: children 缺失即懒加载（隐式判据，已否决）、懒加载 = 按需渲染（那是 eager 折叠的既有语义，折叠只销毁 DOM 不碰数据）、视口触发加载 / load-when-visible（未做）、分页（x-for `.paging` 的机制，不进 x-tree）、reload API（已否决——写回 loaded:false 即重载）、宿主手动写回 loaded:true（已废除——引擎 children 到达自动翻转）、漏写防呆 warn（引擎代写后无从发生）、超时 / tree:load-error（仍否决；失败经 detail.fail）

**树循环变量（Tree Loop Variables）**:
x-tree 注入节点模板求值作用域的 `$` 前缀派生变量（对齐 x-for 派生变量惯例，不占用户命名空间）：`$level`（层级，根 0）、`$children`（原始子数据数组）、`$expanded`（**含回退的有效展开态**——不必手写 `node.expand ?? $level<2`）、`$leaf`（无子——仅对已加载/非懒节点成立，**未加载恒假**，ADR-0090）、`$index` / `$first` / `$last`（兄弟内序号/首末）、`$parent`（父节点数据引用，根 null）、`$indeterminate`（复选半选派生态）、`$loading`（懒加载在途派生态）、`$error`（懒加载失败派生态，`Error | null`——`fail(err)` 挂行的读量）、`$icon`（节点图标派生态，状态机见「节点图标」词条）——后四者均不落盘，UI 态与数据态分离。
_Avoid_: $depth（与 $level 撞义）、$hasChildren（用 $leaf 的反义已覆盖）、循环变量（泛指——这是树专属十二元组）、$leaf = children 未加载节点也恒假（判据含 !未加载）

**节点图标 / icon（Node Icon）**:
默认模板节点类型图标（箭头 → 图标 → 复选 → 文本，箭头与图标**共存**——箭头 = 可展开信号、图标 = 身份信号）。`$icon` 派生状态机（优先级链）：`loading`（在途）> `file-error`（`fail(err)` 错误态——压过节点覆盖，异常必须可见；行标红经 `data-x-tree-error` 注入 CSS，错误消息行级 `data-tooltip`）> 未加载 `unknown` > `node[iconField]` 覆盖 > 有子 `folder` / `folder-open`（随 `$expanded`）> 叶子 `file`（内置图标名 `folder-open` / `file-error` 为连字符形态）。图标覆盖字段 `iconField`（默认 `"icon"`），值 = 单图标名或 `"close,open"` 逗号对（首项收起、次项展开；叶子静默取首项）。三 option：`icon`（默认 true——只开关默认模板图标元素，false 回到无图标布局）、`iconField`、`$icon` **恒注入**（不受 icon 开关影响，自定义模板 `x-icon="$icon"` 一行消费）。详见 ADR-0090。
_Avoid_: 图标兼任箭头（两种信号合并，已否决）、对象形态 {close, open}（已否决）、固定键 icon 不可配（已否决）、$icon 落盘（派生量不落盘）、节点覆盖压过错误态（已否决——异常必须可见）

**树交互三路分流（check / toggle / select）**:
x-tree 行点击的容器级委托判定序：① `x-tree-check` 标记元素 → 复选（级联 + `$indeterminate` 派生）；② `x-tree-toggle` 标记元素 → 展开/折叠（未启用选中且无标记时整行触发）；③ 启用选中（配置 `selectedField`，显式声明——它改变整行语义）后整行 → 选中（单选 toggle 清全树 / `multiSelect`）。复选启用**双通道**：自定义模板声明 `x-tree-check` 标记（标记即交互），或零模板场景 `checkedField` 显式声明（选项即标记，默认模板自动带三态触点——与 selectedField 声明哲学对称）。
_Avoid_: 独立复选开关选项（check:true 之类——启用语义已由「标记 / checkedField 声明」承担，开关是第三条不一致通道）、selectedField 默认启用（行为变更必须显式）

**拖拽三态定位（Drop Position）**:
x-tree 拖拽（`draggable: true`）的落点语义：目标行行线上 1/4 → `before`（移到其前）、下 1/4 → `after`（移到其后）、中段 → `inside`（收纳为子 + 自动展开）。分段基于**行线**（行根顶至子容器顶的高度）而非行根（li）全高——li 的 rect 含已展开子树，按全高分段会把 inside / after 区挤进子树区域（孙及更深后代占高时，悬停自身行线只落 before、无法接受拖入；子树区域归子行各自三段）。拖入自身子孙被环检测拒绝；单根数据的根行仅允许 `inside`。数据 splice 写回（同父移动修正索引偏移；收纳叶子目标先建 childrenField 容器）。
_Avoid_: 拖拽手柄（v1 整行可拖，手柄等真实需求）、FLIP 移动动画（落点即数据重排，watcher 驱动重渲染）、按行根全高分段（已修复的 bug——子树高度不得参与三态分段）

**树事件 / tree:\*（Tree Events）**:
树交互的 DOM 冒泡广播事件：`tree:expand` / `tree:collapse` / `tree:select` / `tree:check` / `tree:drop` / `tree:load` / `tree:loaded`，宿主 `dispatchEvent`，`detail` 统一 `{ id, node, level }`（id 取 `idField` 值，无 id 为 undefined；check 另带 `checked`、drop 为 `{source, target, position}` 三段式——source/target 各含 `{id, node, level}`）。懒加载**双事件**（ADR-0090，修正 ADR-0040 决策 11 的 detail 归属）：`tree:load` = 请求（无 children——发出时还不存在；**另带 `fail(err)` 失败回调**）、`tree:loaded` = 完成（**另带 `children`** 到达快照，仅在途结算时广播）。命名对齐 action 广播 `action:<name>` 惯例，外界 `@tree:expand="..."` 监听。
_Avoid_: 展开回调（配置函数形态已弃——事件广播解耦）、tree-expand 连字符（对齐冒号命名空间惯例）、tree:error / tree:load-error（失败经 detail.fail，不加事件）

### 虚拟列表层（策略插件）

**虚拟列表 / Virtual Scrolling（x-for）**:
x-for 的 `.virtual` 修饰符启用的渲染模式：只渲染可见项 + 缓冲区（overscan），回收池复用离开视口的 DOM 节点，解决大数据集（10000+ 项）的性能瓶颈。语法：`x-for.virtual="item of items"`。滚动容器为 x-for 宿主元素，不限制高度（支持固定高度和自适应高度），通过 ResizeObserver 监听容器尺寸变化重新计算可见范围。详见 ADR-0041。**实现载体**：`autospark.virtual.js` 策略插件（ADR-0128——指令本体留 engine 核心，策略经 ForRenderStrategy 注册表接入；未加载插件时 warn + 退化全量渲染）。
_Avoid_: 虚拟滚动（泛化）、虚拟化渲染（virtual scrolling 是标准术语）、infinite scroll（那是无限滚动，不同机制）

**回收池 / Recycling Pool**:
虚拟列表的核心机制：存放离开视口的 DOM 节点以供复用。池大小自适应（`visibleCount × 2`），无需用户配置。滚动时从池中取节点更新数据，而非销毁重建，避免频繁 DOM 操作的 GC 抖动。
_Avoid_: 对象池（泛化）、节点池（recycling pool 是虚拟列表标准术语）

**缓冲区 / Overscan**:
虚拟列表在可见区域外额外渲染的项数，避免快速滚动时出现白屏。默认 `overscan: 5`（可见区域外上下各多渲染 5 项），通过 `x-for-options="{overscan:10}"` 配置。
_Avoid_: 预渲染区（overscan 是标准术语）、缓冲项（overscan 更精确）

**视口 / Viewport**:
虚拟列表中「可见区域」的载体，即 x-for 宿主元素。视口尺寸通过 ResizeObserver 动态监测，不假设固定高度。
_Avoid_: 滚动容器（viewport 更精确，强调「可见区域」语义）

**itemHeight（虚拟列表）**:
虚拟列表的项高度配置，通过 `x-for-options="{itemHeight:40}"` 声明。可选：未指定时自动取第一项的实际高度作为基准。用户需通过 CSS 保证项等高。
_Avoid_: 行高（itemHeight 是虚拟列表专属配置，强调「每项高度」）

**滚动位置绑定 / data-index（Virtual Scrolling）**:
虚拟列表通过 `:data-index` 实现的声明式滚动位置控制：滚动时自动更新绑定的状态变量为第一个可见项索引（读），设置状态变量自动滚动到对应索引（写）。`data-index` 属性始终反射当前索引（即使未绑定状态），便于调试。更新频率与可见项计算同步，rAF 节流（每帧最多一次）。详见 ADR-0041。
_Avoid_: scrollTo（那是命令式 API，本机制是声明式绑定）、scrollPosition（data-index 是属性名，语义更精确）

**默认滚动条样式（Virtual Scrolling）**:
虚拟列表容器（`autospark-virtual` 属性）的轻量级滚动条样式：Firefox 用 `scrollbar-width: thin` + `scrollbar-color`，Chrome/Safari 用 `::-webkit-scrollbar` 伪元素。默认细滚动条（6px 宽）、半透明滑块（`rgba(0,0,0,0.3)`）、透明轨道。用户可通过 CSS 覆盖。注入时机：`ForDirective.initialize(engine)` 时一次性注入。详见 ADR-0041。
_Avoid_: 滚动条主题（那是配置项，本机制是默认样式）、自定义滚动条（泛化）

**itemHeight 边界处理（Virtual Scrolling）**:
虚拟列表的 `itemHeight` 为 0、负数或非数字时的行为：`logger.warn` + 退化为全量渲染（禁用虚拟列表，回退为普通 x-for）。降级而非崩溃，功能不受影响。详见 ADR-0041。
_Avoid_: 抛错（降级更友好）、默认值回退（warn 是更好的用户反馈）

**边界数据场景（Virtual Scrolling）**:
虚拟列表对特殊数据的处理：空列表（items 为空数组）退化不启用回收池，x-empty 生效；单项退化不启用回收池；项高度超出视口时仍按固定行高计算，项可能被裁切（用户通过 CSS 处理）。详见 ADR-0041。
_Avoid_: 特殊处理（退化是更简单的策略）

**浏览器兼容性（Virtual Scrolling）**:
虚拟列表支持现代浏览器：Chrome 80+、Firefox 80+、Safari 14+、Edge 80+。ResizeObserver 在现代浏览器广泛支持，无需 polyfill；IE11 已停止支持，不提供 polyfill。详见 ADR-0041。
_Avoid_: 全浏览器支持（IE11 已停止维护）、polyfill 由用户提供（增加包体积）

### 分页层（策略插件）

**分页模式 / Paging Mode（x-for）**:
x-for 的 `.paging` 修饰符启用的分页渲染模式：支持客户端分页（全量数组 slice）和服务端分页（loader action 远程加载）；服务端按总页数是否已知分流渲染——`pageCount>0` 翻页渲染当前页，`pageCount=0`（load-more）累积渲染。语法：`x-for.paging="item of items"`。通过 `x-for-options="{pageSize:10, loader:'actionName'}"` 配置。详见 ADR-0042。**实现载体**：`autospark.paging.js` 策略插件（ADR-0128；未加载插件时 warn + 退化全量渲染）。
_Avoid_: 翻页（泛化）、分页加载（paging mode 是标准术语）

**loader（x-for 分页）**:
x-for 分页模式的远程数据加载函数，是标准 action。签名：`({ page, pageSize }) => Promise<{ data, page, pageSize, pageCount }>`。`pageCount=0` 表示总页数未知（load-more 模式）。通过 `x-for-options="{loader:'actionName'}"` 声明。
_Avoid_: 数据加载器（loader 是标准术语）、分页函数

**分页状态绑定 / :data-paging（Paging State Binding）**:
x-for 分页模式与外部状态对象的双向绑定：`:data-paging="pagingState"` 将分页状态（page, pageSize, pageCount, hasMore, loading, error, total）同步到绑定对象。仅 page、pageSize 接受外部写入（触发翻页），其余 5 个字段只读、外部写入静默忽略；total 为估算值（pageCount×pageSize）。详见 ADR-0042。
_Avoid_: 分页对象（paging state binding 是标准术语）、单向同步（page/pageSize 可外部写）

**分页状态读取器 / scope.paging（Paging State Reader）**:
x-for 分页模式下挂载在容器 scope 上的只读视图：返回 7 个分页字段的冻结快照，供 JS/action 读取；不注入状态树（`$scopes`）。项模板内读取走 `$*` 分页变量，跨作用域共享走「分页状态绑定」——三通道职责正交。详见 ADR-0042。
_Avoid_: 分页状态注入（不进状态树）、分页对象（与 :data-paging 的绑定对象混淆）

**load-more 模式**:
x-for 分页模式的特殊形态：`pageCount=0` 时总页数未知，只有"下一页"语义。loader 返回空 data 数组时 `$hasMore=false`，表示没有更多数据。
_Avoid_: 无限滚动（load-more 是显式触发，不是自动滚动加载）

### 覆盖物（Overlay）

**覆盖物（Overlay）**:
任意组件被渲染到 `document.body` 容器的**消费方式**——内容就是普通组件（`x-define` 声明 / `options.components` 全局注册 / `x-import` 加载），**无独立声明指令**（旧 `x-overlay` 声明语法已删）。消费者指令（x-dialog 等）按组件名沿 scope 链就近 + 全局兜底查找（镜像组件查找协议 `getComponentDeclaration`），状态驱动地实例化渲染到 body 下本 engine 的覆盖物容器。详见 ADR-0052（修订版：组件化统一）。**实现载体**：`autospark.overlay.js` 指令插件（ADR-0128——机制主体随产物外移，核心留 getOverlayContainer 薄层）。
_Avoid_: 覆盖层（旧称，随声明指令一起废弃）、弹层模板（泛化）、overlay 组件（无 x-component 参与）、内联弹层

**覆盖物实例（Overlay Instance）**:
覆盖物被消费者打开渲染出的**活体**：组件快照经独立 scope + watcher 子树编译（data/props、methods、hooks、scoped CSS 全生效），渲染进 body 下本 engine 的覆盖物容器。**每次打开新实例**（singleton 未引入）、关闭动画播完即销毁（keepalive 挂起是唯一例外，见「覆盖物保活」）、多实例可并存；层叠 = DOM 追加顺序。挂链即基准（数据视图基准 `dataContext` 三合一：表达式上下文 / 数据视图 / 生命周期统一由 parentScope 表达，默认 `declarer`）。
_Avoid_: overlay 对象、弹层实例（泛化）、对话框实例（那是 x-dialog 消费者视角的产物）、单例（机制未引入）

**覆盖物消费者（Overlay Consumer）**:
把覆盖物组件实例化并驱动其生命周期的指令族（x-dialog / x-popover / x-drawer 已落地，x-popup 预留）：`OverlayDirective` 基座（继承组件实例化基座 `ComponentDirective`，ADR-0054 更名）上的**薄子类**，只叠加形态差异（外壳 / 定位 / 触发 / 关闭行为）；visible 驱动四形态承载于中间抽象基座 `VisibleOverlayDirective`（dialog 与 drawer 平级继承，ADR-0063）。**纯状态驱动**（家族默认；x-popover 的悬浮/点击触发为唯一显式偏离，见「悬浮触发」「点击触发」）——宿主是纯声明点（无隐式交互），值**专职 visible 布尔控制**（简单路径可回写 / 表达式 / 字面量，对象形态已废弃，ADR-0052 v2.3），真值即开；props 经「选项成员属性」`x-dialog-options.props` 注入组件 data 域（表达式求值 + 持续热更新，与 x-component props 同构）。配置两级合并：`内置默认 < x-dialog-options`（可定向到特定组件名实例；组件 def 不携带配置）。保活 / 缓存身份 / 远程加载三扩展配置同通道（`keepalive` / `key` / `url`，ADR-0119，详见「覆盖物保活」「保活缓存键」「覆盖物远程内容」）。形态与模态**正交**：x-dialog 恒模态，x-drawer 默认模态、`mask: false` 可关（ADR-0062 官方 mask 选项的声明式读取面）。
_Avoid_: 触发器（家族默认宿主无隐式交互；悬浮/点击形态例外见「悬浮触发」「点击触发」）、弹出指令（泛化）、调用方（action 语境词汇）、保留键封闭清单（非保留键隐式作 props 的分流已删除，ADR-0052 v2.3）

**贴边抽屉（Drawer）**:
覆盖物消费者的贴边形态（x-drawer，ADR-0063）：面板从屏幕四边（默认）或锚元素边缘滑入滑出。**双定位模式**——屏幕贴边（无 `at`：fixed 贴视口对应边，贴边轴全屏展开）与**元素贴边锚定**（`at.selector` 命中：面板终态贴锚元素对应边**内侧**、恒在锚内不越界，**长轴 = 锚边长**随锚/视口变化重同步）；经实例定位策略钩子（`positioner`）整体接管，锚定未命中**回退屏幕贴边**（非家族「退居中」——居中对抽屉无意义）。`at.placement` 四主方向（展开/滑入起始边）、默认 `right`（`auto`/`-start/-end`/非法值两模式一律静默归一；浮动定位子键 `flip`/`offset`/`shift` 静默忽略）、无箭头。短轴尺寸走 `size` 选项（number/CSS 长度，方向中立，引擎 inline 写入，ADR-0063 实施期修订），缺省回退 CSS 变量 `--autospark-drawer-size`；声明 `resize` 选项启用拖拽调短轴后，会话内记忆值优先于声明 `size` 生效（见「覆盖物尺寸调节」）；默认动画 `'drawer'`（遮罩淡入淡出 + 面板位移滑入滑出，主流 drawer 形态语言）；默认带**抽屉把手**（`expandable` 选项，见专条，`expandable: false` 显式关闭、`pos` 沿边线滑轨可定位）；内置外壳 `drawer-shell`（直角、无箭头载体）。嵌套零新机制（子消费者声明在父组件模板内，ESC 打开栈只关栈顶）。
_Avoid_: 侧滑菜单（泛化场景词）、局部抽屉（指锚定模式时直说「元素贴边锚定」）、推挤模式（push mode 未实现，勿暗示）

**抽屉把手（Drawer Trigger）**:
贴边抽屉的常驻折叠/展开控制按钮（x-drawer `expandable` 选项，**默认开启**、`false` 显式关闭；ADR-0070：把手机制由 x-expandable 共享把手模块统一提供，旧 `trigger` 选项与 `.autospark-drawer-trigger` 类名、`--autospark-drawer-trigger-size` 变量已删除，契约统一为 `.autospark-expandable-trigger` / `--autospark-expandable-trigger-*`）。**折叠 ≡ visible 归假**（无第三态）：点把手即写回状态，面板滑出销毁、重开重建（「每次打开新实例」家族语义，内容运行态不保留）；把手是覆盖物家族**首个实例外常驻交互元素**——面板销毁后存活（生命周期挂指令实例，宿主脱离 / scope 死亡 / engine 销毁时摘除），折叠后骑屏幕边（屏幕模式）或锚内侧边线（锚定模式）露**面板展开侧**半圆，展开/折叠时沿边线同步滑移（与面板同曲线）。沿边线**滑轨位置**由 `expandable: { pos }` 控制（**边缘锚定模型**：正距主边 top/left、负距对面边 bottom/right 的绝对距离，`true` = 居中语法糖 ≡ `'50%'`；越界静默钳制——把手是唯一重开触发点，永可达），支持成员属性表达式响应式重定位；展开态无阴影（视觉属于面板）、折叠态保留阴影（独立浮起提示可点）。显隐 `showTrigger` 默认 `'hover'`：展开态隐藏、hover/聚焦显形（含全长固定定位感应边条，随把手同一边线基准同步）；**折叠态恒显**（唯一重开触点不可让渡）、触屏恒显。与 `mask` 正交。
_消歧_: 本词条的把手是**引擎生成的常驻按钮**——区别于 x-popover / x-tooltip 的「宿主触发器」（用户模板中的元素，见「悬浮触发」「点击触发」）与 action 的 triggerEl（事件派发点）；x-popover 的 `trigger` 选项（触发方式枚举）与本词条已删除的旧选项名 trigger **同名不同义**。文档中指涉把手时优先用「把手」、写选项名时用 `expandable`。
_Avoid_: trigger（已删除的旧选项名——限 x-drawer 语境；x-popover 的 `trigger` 是触发方式选项，同名不同义）、toggle（更早废弃的选项名）、停靠 / dock、折叠态 / collapsed state、peek、最小化 / minimize（均在暗示「折叠是独立第三态」——折叠就是 visible 归假）、收起按钮（泛化，把手的语义是双向控制不只是收）

**面板外壳（Shell）**:
覆盖物**面板层形态**的可替换载体——一个声明了默认出口的普通组件，负责面板的边框 / 圆角 / 背景 / 箭头 / 内容布局；内容组件经默认出口进入外壳。**外壳不含遮罩**（遮罩是引擎结构，模态行为的一部分，换外壳不影响遮罩 / 定位 / 动画 / 关闭等行为）；箭头由外壳渲染、引擎定位。家族通用面板视觉挂引擎契约属性选择器 `[data-overlay]`（形态中立——position/圆角/边框/层级/箭头定位，ADR-0062 修订），形态类名只承载形态特异（`.autospark-dialog` / `.autospark-popover` / `.autospark-drawer` 各归各形态；通知面板无该属性——渲染不走覆盖物实例，视觉自包含）。内置默认外壳寄存于 `options.uiShells` 引擎级注册表（ADR-0077——键 = 消费者裸名 `dialog` / `popover` / `drawer`，用户同键浅覆盖）开箱即用、不占用户组件命名空间；自定义外壳与内容组件同一查找协议，未命中回退内置默认。配置链：实例选项 > 宿主选项 > 引擎级默认（`options.overlay.{kind}.shell`）> uiShells > 内置默认。
_Avoid_: 包装器（wrapper，曾用名，已定名 shell）、皮肤（弱化了结构 + 出口职责）、容器（与覆盖物容器撞名）、mask（遮罩不归外壳）、面板（面板是外壳渲染出的那一层 DOM，外壳是渲染它的组件）、dialog-shell / popover-shell / drawer-shell（旧组件名已退役——uiShells 键为 dialog/popover/drawer）、autospark-dialog 基类 / 面板基类（泛化旧义已退役，ADR-0062 修订——家族通用视觉按 [data-overlay] 属性选择器写，该类回归 dialog 形态专属）

**覆盖物内容组件（Overlay Content Component）**:
覆盖物家族的**全局结构骨架组件**（`autospark.overlay`，ADR-0124）：header（icon + title + actions.top + close）/ body（默认出口 + padding）/ footer（actions.left + actions.right）三段结构，**供三个内置 shell 内嵌消费**（模板内 `x-component:autospark.overlay`，body 出口内容即 shell 默认出口的直通位）——**不面向开发者直接消费**：开发者经覆盖物配置间接驱动（OverlayConfig 五字段 `title` / `icon` / `closeable` / `actions` / `padding` 走 options 通道，config 注入 shell data 域后 shell 模板透传 props），经自定义 shell + x-super 间接扩展。header/footer **有内容才渲染**（title/icon/出口内容/pos=top 的 actions 任一命中——`closeable` 不参与 header 判定，决策 3 修订）；**close 按钮双形态**：header 有内容 → 行内 x（top actions 最右）；header 无内容且可关 → 根级绝对定位浮动 x（右上角，两份 DOM 互斥）。`closeable` 缺省分形态：dialog ≙ `true`（默认表 undefined、模板 `!== false` 缺省即开）/ popover、drawer 经 `_resolveConfig` 形态覆写补 `false`。`header` 出口整块替换——title/actions.top/close 全部让位（替换者全权，决策 2 保持），`title` 出口只替换标题文本区。actions 渲染归组件自身：动作区三出口 **`actions.top` / `actions.left` / `actions.right`**（点分命名空间，裸 `actions` 为 `actions.right` 的收集侧等价别名——「actions 默认是 right actions」）的 **fallback** 按 `pos` 过滤渲染（`top`→actions.top、`left`→actions.left、`right`/`auto`/`bottom`/无 pos→actions.right，组内 `order` 升序稳定排序），声明双通道打开时合并——消费处 scope（**显式 pos ∈ {top,left,right} 才准入**，防页面级 actions 污染）在前、`config.actions` 在后，同 id **后进覆盖先进**。close 按钮触发全局 close 信号 action（`action:close` 冒泡至实例根委托 → requestClose，零新机制）。消费者宿主子级的 chrome 名分段（`x-slot:actions.left` 等）经**上行转发**触达对应出口：三内置 shell 在内嵌 overlay 元素上声明 `x-component-options.slots="*"` 承担查找（ADR-0125 通用机制），收集裁决家族专用——内容组件 `def.slots` 声明优先、未声明且属 chrome 契约名才收进 shell 内容集，`default`/`body` 永不转发；转发段表达式以消费者 scope 求值、段内 `x-super` 展开出口 fallback，自定义 shell 自行声明 slots 即接入。详见 ADR-0124。
_Avoid_: autospark.overlay.content（初始提案名，已收敛为 `autospark.overlay`）、内容宿主（那是 ADR-0123 的内容委托宿主元素——本组件是结构骨架，二者正交：内容宿主经 shell 默认出口直挂 body 区）、通用弹窗组件（弱化了「仅经 shell 间接使用」的定位——直接消费不在契约内）、标题栏组件（它承载 header/footer/body 全结构，非仅标题）

**悬浮触发（Hover Trigger）**:
x-popover 的**默认**触发方式（`trigger: 'hover'`；ADR-0060 修订：触发方式扩展为悬浮/点击两形态，家族「纯状态驱动」的显式偏离）：宿主是**悬浮触发器**——`mouseenter`/`mouseleave` 悬浮意图语义（非字面 mouseover）驱动显示；指令值不参与驱动、无 visible 真相源（非空值 warn）。**共享 hover 域**：宿主与面板（body 容器内、DOM 分离）双侧监听视为同一域，宿主↔面板互移不闪关；离开域经 `delayHide`（默认 150ms）宽限关闭、宽限内回域取消；`delayShow`（默认 200ms）为悬浮意图延迟，快速掠过不触发。**hover 链**：嵌套 popover 经 document 级打开中注册表把后代域并入祖先域（指针位于任一后代 popover 上祖先保持），后代关闭后祖先经最后指针坐标 `elementFromPoint` 重估、已出域才关（ESC 关子父不残留）。形态默认：裸面板、锚=宿主自身、`placement` 默认 `'bottom'`（`at` 显式换锚只改位置不换触发关系）。悬浮离开走直接 UI 关闭（无写回目标，不经「请求关闭」）；ESC 照常走打开栈请求关闭。触摸设备 hover 不适配（触屏场景改 `trigger: 'click'`，见「点击触发」；或用 x-dialog）。
_Avoid_: mouseover 触发（字面 mouseover 冒泡、子元素间移动反复触发，非本语义）、tooltip（悬浮提示只是场景之一，本词条是触发模型）、外点关闭（hover 方式下已否决的关闭触点——离开即关场景冗余；click 方式的主关闭通道见「点击触发」）、混合驱动（悬浮之外再挂 visible 值通道 = 两个真相源，已否决）

**点击触发（Click Trigger）**:
x-popover 的 `trigger: 'click'` 触发方式（ADR-0060 修订；触屏适配主路径——点按开关 + 外点关闭）：宿主是**点击触发器**——click 即 **toggle**（开↔关，一次点击语义一致）。关闭触点三通道：再点宿主（toggle）、**点击面板外部**（document 级判定，命中目标不在活跃面板内即关——点其他 popover 宿主算外部，关旧开新自然发生）、ESC（打开栈栈顶，机制继承）；**面板内点击不关**。hover 设施整体不生效（宿主/面板悬浮监听按当前 trigger 现读分流忽略——鼠标移出面板无反应，面板内交互控件可安全使用）；`delayShow`/`delayHide` 静默不适用（不 warn）。触发方式热切换（选项成员为表达式）：打开中的面板不重估不打断，切换自下一次触发生效（对齐家族「重开生效、不热应用」）。hover 链解耦：click 消费者打开时仍登记 document 级打开中注册表（充当 hover 后代的域容器——嵌套 hover 子级的链判定需要），但自身不受域豁免保护、不参与后代关闭后的重估（子级关闭重估不误关 click 父——其关闭只听点击/外点/ESC）；hover 父 + click 子经既有链机制天然成立。指令值不参与驱动、同宿主多声明 warn 与悬浮方式共用（措辞按触发方式中性化）。
_Avoid_: manual / 手动模式（未实现——程序化开关是 x-dialog 状态驱动的领地，与本指令「无 visible 真相源」原则冲突）、focus / 焦点触发（未实现——键盘可达经 button 宿主 Enter/Space 天然获得）、点外关闭 / 外点关（口语变体，统一「点击面板外部关闭」）、混合触发（同一消费者同一时刻只取一种触发方式）

**请求关闭（Request Close）**:
覆盖物关闭动作（ESC / 点遮罩 / close action）的统一语义——关闭是「请求」不是命令：visible 可回写（简单路径）则回写 `false`（状态是唯一真相源）；不可回写（表达式/字面量）仅 UI 关闭 + `overlay:close` 广播由用户善后。已知边界：表达式形态关闭后依赖变化重求值仍真会**重开**。子树内 close action 由消费者在实例根上委托监听（覆盖物 DOM 在 body 下，engine 树收不到冒泡）。
_Avoid_: 强制关闭（它是请求语义）、自动回写（仅简单路径可回写）、关闭回调（事件广播解耦，非配置函数）

**覆盖物保活（Overlay KeepAlive）**:
覆盖物关闭语义的**挂起例外**（`keepalive: true`，ADR-0119）：close 的 leave 动画播完后**不销毁**，改为容器内 `display:none` 隐藏（router keepAlive 同款语义，非摘除 DOM）——DOM、instanceScope/shellScope、watcher 全存活，重开走恢复路径（重新定位 + enter 动画 + 入栈 + 广播 open；props 无需恢复时补应用——ADR-0123：挂起期间 x-component props watch 存活，浅合并已删）。关闭语义零变化（visible 回写、`overlay:close` 广播、ESC/遮罩/close action 三触点照常）。**声明式专属**：命令式句柄 `open({keepalive})` 不生效并 warn（命令式无缓存归属方，挂起实例会孤儿化）。回收点：宿主指令 destroy 销毁其全部挂起实例（含打开中/关闭动画中）、`engine.destroy` 全回收；v1 无 LRU、无手动清缓存 API。**打开即准入**（ADR-0123）：pending 占位 / 加载中实例挂起无害（watcher 存活，恢复后继续等注册/加载）；错误呈现期间关闭 = 销毁不挂起（「失败不进缓存」精神保留）。正典配置 `x-dialog-options="{keepalive: true}"` 或成员属性表达式 `x-dialog-options.keepalive="..."`；修饰符糖 `x-dialog:name.keepalive="值"`（修饰符与 visible 值同声明）经解析器 modifier 注入同名选项（ADR-0007）自动生效。缓存身份见「保活缓存键」。
_Avoid_: keep-alive（连字符变体）、缓存组件（挂起的是整实例非组件定义）、visible 保持（关闭时 visible 照常回写归假，保活只是 DOM 挂起）、页面保活（那是 router keepAlive——机制同款语义，归属不同特性）

**保活缓存键（Overlay Cache Key）**:
keepalive 实例的缓存身份：**`组件名 + key + url` 复合**（`buildOverlayCacheKey`）。同键且有存活挂起实例 → 重开复用（防重复堆叠，对已可见实例 open no-op）；不同键 → 各自独立实例并存（多页签场景）。`key` 为表达式，每次打开求值一次（不 watch——key 变化即新缓存身份，下次打开生效）；无 key 时键退化为单实例位。key 对非 keepalive 路径不生效（无缓存），仅随 `overlay:open`/`overlay:close` 广播 payload（`OverlayEventDetail.key`）携带。
_Avoid_: 热切换键（key 不 watch，变化即新身份、下次打开生效）、实例 ID（key 是声明方给的缓存命名空间，非系统分配标识）、DOM key（与列表 diff 复用语义无关——这里是缓存身份，无 diff 概念）

**覆盖物远程内容（Overlay Remote Content）**:
消费者配置 `url` 声明的**打开时按需加载**通道（ADR-0119 引入；ADR-0123 重写实现形态为**内容宿主双委托**）：overlay 不自渲染内容——按组件注册状态生成**内容宿主元素**，以消费处 scope 为父编译进 shell 出口（compileChild 程序化编译，shell 面板 rootless 数据基准不变），渲染全委托既有指令。三态一律 **shell 先开**（本地/远程/pending 统一时序）：组件已注册 → 宿主 `x-component:名称="props表达式"`（指令值 props 通道，全契约 + 热更新）；未注册 + url → 先走**探测管线**（x-import 管线 importComponentsFromUrl：fetch + 解析 + 注册到消费处 scope + url 缓存）——同名 `x-define` 命中转 x-component 本地形态（远程模板其余内容放弃：x-define 已注册备用、HTML 不渲染），未命中 → 宿主 `x-html.compile="url"`（url 形态 fetch → 子模板编译，`$loading`/`$error` 元键、竞态/中止/消毒语义全继承）；未注册无 url → x-component pending 占位（ADR-0022 R6=B + component/registered 重试，warn 保留）。**片段无 props 概念**——props 求值结果程序化转换为片段数据域（x-data 同语义：compileChild 初始 data + `_onPropsChange` 热应用 Object.assign；不用字面 x-data 属性——纯状态路径形态被裸词 action 判定劫持、求值一次无热更新）。**错误通道 = raise → x-error 边界**（ADR-0118）：探测失败 / 片段加载失败（watch `$error`）统一 raise（retryable/closeable + retry/close actions）面板内呈现；retry = 销毁内容宿主重走探测/生成，close = requestClose；错误呈现期间关闭 = 销毁不挂起（「失败不进 keepalive 缓存」精神保留）。url **不缓存**（x-html「同 url 各取各的」语义，重开重新 fetch——浏览器 HTTP 缓存兜底，高频场景用 keepalive）；url 经成员表达式每次打开重求值，url 变 = 新缓存身份 = 重建（见「保活缓存键」）。
_Avoid_: x-import 替代（x-import 是预加载后按名消费，本词条是打开时按需加载）、overlay 自渲染远程内容（ADR-0119 旧实现 attachRemote/attachFragment/占位锚/自建 error 占位已随 ADR-0123 全删——直说委托）、远程组件（片段路径无组件概念，直说「片段」）、懒加载（lazy loading 泛化——直说按需加载）

**覆盖物定义句柄（Overlay Handle）**:
`engine.getOverlay(el, name, options?)` 返回的**定义编程视图**（命令式消费入口）：`open(options?)` 打开、`close()` 关闭该覆盖物当前全部打开实例。查找镜像 `getComponentDeclaration` 协议（`el` 起 scope 链就近 + 全局兜底；省略 `el` 仅查全局）；options 是消费者配置级（与 x-dialog-options 同级），其 `props` 键为**句柄级默认 props**（被 `open({props})` 覆盖）。命令式 props 为**打开时快照**（无热更新，ADR-0052 v2.3）。
_Avoid_: overlay 对象（泛化）、定义引用（「句柄」对齐 handle 惯例）、组件句柄（与 x-component 撞义）

**覆盖物实例句柄（Overlay Instance Handle）**:
定义句柄 `open(options?)` 返回的**单个实例编程视图**：`close()` 精确关闭、`el` / `name` / `dataContextEl` 读取——多实例并存时唯一能精确关闭单个实例的通道。`dataContext` 是**两栖键**：声明式给基准名（`'declarer' | 'host'`），命令式 `open()` 给基准载体（HTMLElement——元素所属 scope 即挂链目标，缺省 rootless 全局视图）；命令式实例与声明式实例**同权**（同一容器 / 事件双通道 / 配置链 / 打开栈）。
_Avoid_: anchor（那是定位锚点，数据视图基准是 dataContext，二者正交）、实例对象（泛化）

**打开栈（Open Stack）**:
document 级共享的**打开实例顺序栈**（所有 engine 的实例同栈同权，声明式与命令式同权入栈）：ESC 经此只关**全局栈顶**实例（多 engine 并存也不连环关）；遮罩点击不依赖它——DOM 层叠天然让点击命中最上层。
_Avoid_: 层级栈（z-index 显式层级管理是另一件事）、单 engine 栈（跨 engine 全局协调正是决策核心）

**定位锚点（Anchor）**:
`at` 配置指定的**显示定位参考**（与 scope 正交：scope 管数据视图、at 管位置）。顶层键三态：字符串 / 元素**简写**（≡ `{selector}`，进合并链前归一化——只覆盖 selector、保留上层其余锚成员）或完整锚配置对象；`at.selector` 两栖——字符串选择器（相对查询：`/` 前缀全局 / 无前缀 scope 子树内查 / `../` 父级爬升 / `^` closest，打开时现查，未命中 warn 退屏幕居中）或元素引用。dialog 恒模态——锚定只改位置不改模态性（有 at 遮罩照常渲染）；定位计算经 floating-ui（`placement` 默认 `'auto'` 视口自动选位 [autoPlacement，与 flip 互斥]，显式 12 方向值则固定 + flip 翻转默认开 / offset / shift），**锚定模式下箭头默认开启**（`arrow: false` 显式关闭）：引擎自动注入载体 + 双伪元素默认视觉（带阴影 8×8 菱形 + 无阴影 10×10 菱形朝面板内侧偏移 4px=阴影模糊半径，完全遮蔽嵌入段阴影残留——露出段阴影保留立体感），按 floating-ui 协议沿 staticSide 反向偏移载体尺寸的一半（菱形一半嵌入面板同色融合、一半露出形成小三角），未配置 offset 时默认让位 6px（三角尖点在锚元素边缘上）；`border` 面板 1px 边框为**面板级配置**（默认 true，与锚定无关、无 at 也生效）：外壳模式——面板视觉（背景 `--autospark-overlay-bg` + 边框 `--autospark-overlay-border` + 圆角 `--autospark-overlay-radius`）由 panel 外壳统一承担，同色背景填平圆角微差（四角无缝），箭头双层变色融合（底层变边框色、覆盖层变面板背景色外扩至 12×12——露出段留 ≈1.17px 边框色斜带与面板 border 连续、嵌入段完整遮蔽）；退居中不注入箭头。视觉三层全部收敛在 floating-ui 协议必需的单一载体元素上（伪元素承担分层），**零额外真实 DOM**——面板保持 box-shadow（无 filter 的 containing block 副作用），阴影连续性不靠外层包裹容器。
_Avoid_: 锚点 el（顶层键是 at、锚选择器是 selector）、dataContext 锚点（dataContext 是数据视图基准，二者正交）、popup 专属（dialog 有 at 时同样锚定定位）

### 工具提示（Tooltip）

**工具提示 / data-tooltip（Tooltip）**:
`data-tooltip` 属性约定驱动的**全局工具提示**（ADR-0061）——引擎树内任意元素**零声明**生效（引擎级子系统 `TooltipManager`，非指令、非 overlay 消费者）。编译期静态 `title` 自动转换剥除（`title` → `data-tooltip` 值转移，双挂点：主 walk transformer + `compileChild` 项根 clone 行；`:title`/`x-bind:title` 绑定经 `BindDirective.created` 重定向写回 `data-tooltip`——「结果 DOM 无 title」不变量，原生浏览器 tooltip 从根上不可能出现）；手写 `data-tooltip` 委托照常生效（悬停现读属性，转换与消费两机制正交）。值两栖：字符串 = HTML 内容（经 `options.sanitizer` 消毒，x-html 同通道）；`{...}` = relaxed-json 配置（保留键封闭清单：`content`/`placement`/`offset`/`shift`/`flip`/`arrow`/`showDelay`/`hideDelay`/`className`/`maxWidth`/`maxHeight`/`border`/`animate`，未知键 warn）。委托监听 `mouseover`/`mouseout` + `focusin`/`focusout`（键盘可达）挂引擎根 + overlay 容器（body 侧渲染产物一并覆盖）；嵌套引擎按 `data-autospark` 根标识归属过滤防双显。**单例浮层**（每引擎一个共享 tip 元素常驻容器，内容随悬停目标切换）+ `showDelay`/`hideDelay` 延迟防抖（期间重新进入取消；移入浮层内取消隐藏——可交互 tooltip）。定位 floating-ui（`placement` 默认 `'top'` + flip，**不支持 `'auto'`**——小浮层与业界惯例，区别于 overlay 的 auto 默认），箭头默认开（复用 overlay 菱形伪元素视觉协议，载体类名 `autospark-tooltip-arrow`），`border` 默认开（暗底白字，配色 `--autospark-tooltip-bg/-fg/-border` CSS 变量）；最终方向写回 `data-tooltip-placement`。动画默认 `'slide'` **方向自适应**（复用全局 slide 六类名 + `.autospark-tooltip` 限定覆写层按弹出方位换 from 值——flip 改向动画自动跟随，150ms）。事件双通道 `tooltip:show`/`tooltip:hide`（payload `{el, tip}`，一切隐藏路径均广播）；命令式 `engine.tooltip.show(el, opts?)` / `hide()`（opts 与保留键同构单次覆盖，`content` 键优先于属性解析——无 DOM 属性注入内容）。`options.tooltip` 三态：缺省开启 / `false` 全关（title 保留原生、命令式 warn + no-op）/ 配置对象 = 全局默认（元素级覆盖）。详见 ADR-0061。**实现载体**：`autospark.tooltip.js` 特性插件（ADR-0128 薄壳化——**选择性引入即开关**：不加载插件 title 保持原生行为，`engine.tooltip` 命令式面在插件未加载时 warn + no-op）。
_Avoid_: data-tips（grilling 过程中的过渡命名，从未实施）、autospark-tip 类名（现行契约 `autospark-tooltip`）、x-tips 指令（非指令——属性约定驱动，与 observer 通道的 x-* 触发机制冲突）、title 属性（启用引擎后不进结果 DOM——全局转换剥除）、placement 'auto'（tooltip 不支持，小浮层用固定方向 + flip）

**浮层（Tip）**:
tooltip 的**单例浮层元素**（`autospark-tooltip` 类名契约）——每引擎一个、常驻 `autospark-tooltips` body 容器（首个 tooltip 显示时懒创建、`destroy()` 整体移除，overlays 容器先例），显示 = 填充内容 + 定位 + display，隐藏 = 离场动画后 display:none（不反复摘挂 DOM）。内容随悬停目标切换、上一目标的类名/边框/箭头全量重置。显示期间 rAF 兜底「曾连接 → 断开」跳变（x-for 回收 / patch / DOM 移除无事件可感知，立即隐藏）；`engine.stop()` 同步隐藏。
_Avoid_: tooltip 实例（无实例化概念——单例复用）、每元素独立浮层（单例是防多显的设计决策）
