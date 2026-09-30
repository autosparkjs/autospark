# ADR-0074：x-layout 布局容器——x-pane 窗格、through 贯穿与 grid 骨架

- **状态**：Accepted
- **日期**：2026-09-30
- **关联**：[ADR-0067](0067-x-splitter.md)（被组合的分割器）、[ADR-0069](0069-x-expandable.md) / [ADR-0070](0070-x-expandable-compose.md)（`compose` 程序化组合先例与共享把手）、[ADR-0064](0064-x-resize.md)（被注入的尺寸调节指令）、[ADR-0056](0056-x-slot.md)（命名避让的证实——x-slot 已是组件插槽出口）、[ADR-0007](0007-directive-options.md)（指令选项体系）、[ADR-0002](0002-engine-patch.md)（ownsChildren → patch 动态区域）、[CONTEXT.md](../../CONTEXT.md)（「布局容器」「布局窗格」「贯穿」「布局回流」「窗格分割」「窗格尺寸调节」词条）
- **共识来源**：grilling Q1–Q29 六轮闭合（flex vs grid 结构论证、pane/panel 词汇占用的事实重开、拖拽折叠联动与窗格分割两处用户反转）+ 两轮代码事实调查（指令清单与 x-slot / x-resize 现状；x-expandable / x-splitter / patch 机制）

## 背景

参考 ant.design Layout（Header / Content / Sider / Footer）实现声明式布局容器：宿主 `x-layout`，子元素以 `x-pane:参数` 声明布局单元，支持嵌套、through 贯穿、与 x-expandable / x-resize / x-splitter 的行为组合。原始提案（仓库根 `x-layout.md` 草稿）使用 `x-slot:header` / `x-slot:sidebar.left` 语法与 `data-through` 属性。grilling 过程中被事实推翻的两处前提：① `x-slot` 已存在（ADR-0056 组件插槽出口，ownsChildren），且 DirectiveManager 为「一名一指令、同名静默覆盖」——复用即顶掉组件插槽；② 「面板 / Pane」已是 x-splitter 子元素的 CONTEXT.md 正名、panel/split-panel 是其 Avoid 废弃词——pane/panel 命名竞选须带着词汇占用事实重开。

## 决策

### 一、定名与语法

- 布局容器 `x-layout`，布局单元 `x-pane`（正名「布局窗格 / Layout Pane」）。x-panel 否决（panel 是 splitter 废弃 Avoid 词）；`x-layout:参数` 参数化标记方案否决（一类双角色分派成本、单文档双角色混乱），独立 x-pane 胜出——中文「窗格」与「面板」自然分词，词条互设 Avoid 消歧英文语境。
- 参数词表固定 `header | content | sidebar | footer`；`sidebar` 必带 `.left` / `.right` 修饰符，**缺省按 `.left`**（不 warn）。参数不在词表 / sidebar 修饰符非法 → warn + 剪枝该窗格。
- through 载体双形等价：`x-pane-options={through:"up,down"}`（relaxed-json，ADR-0007 体系）与 `.up` / `.down` 修饰符（解析期并入选项）。`data-through` 否决（脱离 x-* 属性体系）。
- 选项词汇表：`x-pane-options = { height, width, through, expandable, resize }`。无效组合（content 上 height、非首个 sidebar 上 through 等）warn + 忽略该键，其余键照常。

### 二、布局引擎：grid 子集 + 动态 areas

单容器 CSS Grid，编译期按「窗格存在性 × through 组合 × 同侧窗格数」动态生成 `grid-template-areas` 与列/行模板；窗格元素即 grid item（`grid-area` 按参数定名），**永不 reparent**。默认轨道：header/footer 行 auto（默认 64px 经 CSS 变量落在窗格元素样式，用户 CSS 可覆盖）、middle 行 1fr、sidebar 列 auto（默认 240px 同理）。

**flex 路线否决**：through（同一窗格纵跨 header/footer 行带）+ 存在性回流（窗格消失补位且元素不动）是二维区域语义，flex 一维模型无法声明式表达——除非 reparent（破坏运行态保留承诺）或 JS 算坐标（丢 CSS 红利）；「flex 兼容性更好」的前提不成立（grid 自 2017 年起为全主流基线）。折中的 flex 嵌套壳方案（16 种组合形态生成 + 手工 gap 矩阵）复杂度高一个量级，一并否决。

### 三、窗格模型

- content 必需：缺失 **warn + 降级**（容器照建、无中心区）——与 ADR-0031 宽容语气一致，不 throw。header/footer/sidebar 可选，缺失则行/列整体不出现。
- 非 x-pane 直接子元素：**编译期剪枝 + dev warn**（x-define 剪枝先例）。
- 同侧多窗格：按 DOM 序并排，各默认 240px（选项可覆盖），**仅 DOM 首个有 through 资格**。
- through 仅 sidebar（`up`/`down` 可组合）：`up` 上延至容器顶、header 推向对侧；`down` 对称；左右皆 up 时 header 夹中间。header/footer 上声明 warn + 忽略。**header 全宽是缺省态**，由 sidebar 未声明 through 自然表达——提案中「控制 header 贯穿的直观配置」即 through 本身，无独立配置面。

### 四、响应式边界：存在性回流是唯一响应式维度

x-pane 编译期订阅同元素 x-if / x-show 的存在性表达式（scope.watch 双轨），变化 → 重算模板 + 被剔除窗格挂 `data-layout-absent`（`display:none!important` 契约，压过 x-show 的 inline display）。**x-if 的标准移除语义、x-show 的显隐语义不被接管**——x-pane 只读同一表达式，两指令各司其职；窗格元素永不移动（焦点/滚动/指令运行态保留）。eager x-if 移除窗格时经 `x-pane.destroy` 通知 layout 剔除注册并销毁组合实例。其余全部编译期静态：through / gap / height / width / 窗格组合变更需 `engine.patch` 重编。

### 五、错误与视觉契约

纯布局零视觉入侵（背景/边框/配色全由用户窗格自带）；所有窗格 `position:relative`。拖拽 affordance 视觉由 x-resize / x-expandable 既有机制自带，x-layout 不新增视觉元素。

### 六、默认行为组合（sidebar）

- **默认注入**（未显式声明时）：x-expandable 经 `ExpandableDirective.compose()` 程序化组合（ADR-0070 splitter 同款）+ x-resize 内缘单方向手柄（left 拖东缘 / right 拖西缘）。
- **显式优先**：窗格显式写 `x-expandable` / `x-resize` 时以显式为准（其 options 全生效）；注入实例的 options 读同元素 `x-expandable-options`——选项与「是否显式写指令属性」解耦。
- **状态语义**：默认注入 = 内部态（展开布尔由组合实例持有）；store 绑定/持久化须显式 `x-expandable="路径"`。
- **opt-out**：`x-pane-options={expandable:false}` / `{resize:false}`。
- **拖拽↔折叠联动**：拖拽跨折叠目标自动翻转折叠布尔（splitter `_applyPx` 单点收敛先例），折叠目标 / lastSize 恢复链沿用 splitter 模型。
- header/footer 显式挂 `x-resize` 合法（auto 轨道跟随）；content 上挂 warn（1fr 轨道拖拽无效）。

### 七、窗格分割（同侧 ≥2 窗格）

x-layout 编译期创建分割容器并**程序化组合 x-splitter**（嵌套链支持 3+；窗格编译期一次性 reparent 进分割容器）：窗格间分隔条**守恒分割**（反向增减、该侧总宽不变），splitter 的键盘/拖拽/折叠联动能力全部继承。自建分隔条（DRY 违背）与「抽取 splitter 核心」重构方案否决——ADR-0070「机制唯一实现 + 组合」基调的延续。单窗格侧不分割，走第六条的 resize 通道。

### 八、样式注入与默认尺寸

`static initialize` 幂等注入全局样式（style 元素 id 去重，splitter/registerSplitterStyles 先例）：grid 骨架类、`position:relative`、`[data-layout-absent]` 规则、默认尺寸 CSS 变量族（`--autospark-layout-*`）。默认尺寸**不落 inline**（inline 压过用户样式表，破坏「CSS 可覆盖」承诺）；`x-pane-options` 的 `height` / `width` 走 inline（显式声明 > 样式表，语义自洽）。

### 九、嵌套与 patch

窗格归属**最近 x-layout 祖先**；窗格内是正常编译子树（嵌套 x-splitter / 子 layout / 任意指令照常）。LayoutDirective 覆写 `static ownsChildren` → 编译器跳递归、`engine.patch` 动态区域拒绝、x-if 分支根检测等**全部按既有机制自动生效**，无额外登记。

## 被否决的方案

- **复用 `x-slot` 语法**（原始提案）：ADR-0056 已占用（组件插槽出口，ownsChildren），一名一指令注册表下复用即静默顶掉组件插槽。
- **`x-panel` 命名**：panel 是 x-splitter 的废弃 Avoid 词（split-panel 曾用名）。
- **`x-layout:参数` 参数化标记**：一类双角色分派 + 单文档双角色，维护税不值零新词收益。
- **flex 实现**（含嵌套壳折中变体）：见决策二。
- **缺 content 编译期 throw**：宽容降级与 ADR-0031 家族语气一致。
- **v1 resize 仅 sidebar**（初版决策）：机制事实（auto 轨道零成本支持）推翻，放宽为非 content 窗格显式合法。
- **拖拽折叠联动 / 窗格间分割不做**（初版推荐）：用户裁决反转——都做（决策六/七）。
- **`data-through` 属性载体**：脱离 x-* 体系，框架指令不读 data-*。

## 后果

- breaking：无（全新指令）。
- 全链同步清单：`presets/index.ts` 注册 `layout` / `pane`；`presets/layout.ts` + `presets/pane.ts` 新指令；全局样式；测试 `x-layout.test.ts`；文档 `docs/zh/guide/directives/x-layout.md`（五段骨架）+ `docs/demos/layout/*` + 导航；CONTEXT.md 六词条（已随本 ADR 落盘）。
- **实现验证清单**（实施期必须实测）：
  1. expandable 默认负 margin 通道在 grid auto 轨道下的塌缩行为（margin box 参与轨道 sizing 理论可行但未验证）——不行则给组合实例强制 minSize 收缩通道；
  2. eager x-if 移除窗格与模板重算的微任务时序（同一次 flush 内最终一致，闪烁窗口可接受性）；
  3. happy-dom 无布局环境断言策略（先例：断言属性/CSS 变量/模板字符串，不做几何断言；视口为 0、`getBoundingClientRect` 兜底惯例）；
  4. 组合 splitter 的嵌套链 DOM 深度与 gap 在分割容器内外的衔接。
- 仓库根 `x-layout.md` 为提案历史草稿，实施后不删不改（决策记录，非活文档）。
- **实施期新发现（2026-09-30 实施修订）**：
  1. **默认 resize 手柄内缘单方向落地（left→`e` / right→`w`）**：决策六的「内缘」初版受 x-resize 流内降级限制（`w` 需位置补偿被编译期丢弃）曾退化为两侧统一 `e`，浏览器实测否决（right 侧抓外缘语义错误）。最终方案 = **x-resize 增加 grid item 感知**：父容器 computed `display:grid` 时 `w` 方向豁免流内降级且免位置补偿——轨道定位下 width 单写即对缘让位、拖拽数学与流内 `e` 完全同构；`n` 仍保守丢弃（行轨道下顶缘跟手性不保证）。
  2. **折叠态标志按通道分派**：收缩通道（minSize>0）的折叠标志挂**把手**（宿主不挂 `data-collapsed`，子内容保持可见——迷你形态语义）；联动/测试断言须按通道选取判据。
  3. 决策一修正：`x-expandable-options` / `x-resize-options` 附属属性**不算**「显式声明」——显式判定只认指令属性（含修饰符形态），单独的 options 与默认注入合并（Q25b 解耦承诺的实现口径）。

## 修订记录

- 2026-09-30 初版（grilling Q1–Q29 闭合即初版，实施随修订追加）。
- 2026-09-30 实施修订：M1–M4 落地（结构拓扑 / 存在性回流 / 行为组合 / 窗格分割），后果清单追加实施期新发现三条（e 手柄限制、折叠标志通道分派、options 不算显式）。负 margin 通道 grid 实测与构建产物验证待浏览器环境（M5 收尾清单）。
