# ADR-0098：x-block 溢出折叠容器——flex 布局 + 溢出子元素折叠（完全重写）

- 状态：已采纳（2026-10-10 重写共识落盘并实施；初稿「行内三段分区布局」同日废弃，见背景）
- 日期：2026-10-10
- 关联：ADR-0021/0022（x-block 旧义——组件前身演进链，本 ADR 二次复用其名）、ADR-0056
  （x-slot 出口——克隆壳默认出口）、ADR-0060（x-popover 悬浮触发模型——more 按钮弹出通道）、
  ADR-0062（overlay shell——外壳解析链）、ADR-0067（x-splitter——值响应式先例）、
  ADR-0094（组件注册面——克隆壳编程式注册进宿主 scope）、ADR-0052 修订共识 5
  （覆盖物关闭即销毁——stash 抢救通道的存在理由）

## 背景

工具栏、面包屑、标签条等场景需要一条 nowrap 容器：空间不足时**从末尾起把子元素
逐个折入 more 按钮（省略号）的弹出面板**，空间恢复时按原序还原。初稿曾把本指令
设计为「行内三段分区布局（header/body/footer）+ 分区阈值收缩」，实施完成后经
grilling 复审裁决：需求本体是「子元素级溢出折叠」而非「分区级收缩」，两模型在
折叠单位、判定算法、面板形态上全面分歧，且初稿存在实质缺陷（kind 未声明 Hybrid
导致 observer 通道生产环境不启动，溢出重估只靠 window resize 兜底）。裁决**完全
重写、无兼容层**：旧实现、旧单元测试、`block-popover` 载体别名同日废弃（ADR 从未
提交入库，就地改写不留取代链）。三轮 grilling（Q1~Q10 + 算法追问 + 克隆壳合并与
shell 选项两轮补充）闭合全部决策面，本文记录定案。

## 决策

### 1. 完全重写、名复用、无兼容层

`x-block` 名二度复用（旧义组件机制 → 三段分区 → 本版溢出折叠容器），历史两义均死、
无承继关系。注册名 `block` 不变；原 `x-block:header|body|footer` 分区标记语法废除
（attr 非空一律 warn 误用）；原单元测试删除随新实现重写。

### 2. 布局契约

- 宿主 `display:flex` + `nowrap` + `align-items:center`（row/column 对称，column
  即 `flex-direction:column`）；
- **全部直接子元素默认 `flex-grow:0` / `flex-shrink:0`**——不伸不缩，空间不足交给
  折叠机制而非 flex 压缩（shrink:0 同时是溢出检测布局数学的前提，见决策 4）；
- 子元素以 `data-grow` / `data-shrink` 契约属性**独立直通** CSS（只写属性 = 1、
  显式数值原样、`"0"` = 显式关闭；非法/负值 warn 一次 + 回退 1）；两属性互相独立、
  无隐含、**无豁免类别**（grow 子元素不豁免折叠——title 只写 data-grow 时空间不足
  也会被折叠，需弹性收缩请并写 data-shrink）；
- gap 由用户 CSS 承载（类规则或内联样式克隆语义延续到面板），引擎不预设。

### 3. 指令值 = 轴（字面量分流 + 响应式表达式）

裸词 `row` / `column` 按字面量（主轴书写场景免引号）；其余按 scope 表达式订阅，
结果 `"column"` → column、其余静默归一 row（表达式过渡态不 warn——x-splitter 先例）。
状态变化换轴：折叠子元素按原位锚全部复位后按新轴全量重算；触发按钮弹出方位随轴
热更（row：bottom-end / column：right-end，`_resolveConfig` 每次打开现读）。

### 4. 溢出判定：布局数学直读 + 步进收敛

shrink:0 + nowrap 的布局恒等式保证：溢出态 `scrollMain = Σ子元素自然宽 + gap`，
不溢出态 `scrollMain = clientMain`（grow 吃掉富余撑满）。「是否溢出」**直读
`scrollMain > clientMain`**，无需逐元素理论求和；more 按钮宽与 gap 不进公式——
more 显隐本身改变布局，由步进循环每步重读自然吸收。算法：

- **折叠步**：溢出 → 折叠最后一个**可见**子元素（`display:none` 者跳过且永不折叠）；
  折叠时刻缓存其自然主轴尺寸与原位锚（nextSibling），真实搬移出文档存 stash；
- **恢复步**：有富余 → 从栈顶试恢复（`scroll + gap + 缓存尺寸 ≤ client` 才放回
  原位锚；失败即停）。栈顶隐藏者跳过留栈（x-show 恢复后经重估通道自然回位）；
- **正确性论证**：grow 只在正剩余空间生效而折叠只发生在溢出态，故折叠时刻的
  测量值即自然宽，缓存不受 grow 拉伸污染；单步折叠后「刚折者放得回」在数学上
  不可能（折叠前 `S > C` 蕴含 `S-w+w > C`），步进天然防多折；恢复判定失败即停
  防振荡；循环上限在循环外定死（折叠使现存子元素减少，动态上限会收紧余量）；
- **宿主 min 尺寸**：`min-width`（column 对称 `min-height`）= 触发按钮主轴尺寸，
  首次折叠写入后不撤（同值不重写防 RO 循环）——按钮永不被挤没。

### 5. 触发通道：三观察器 + Hybrid kind

- ResizeObserver（宿主 + 全部子元素，子元素增删后同步补挂——内容尺寸变化跟随）；
- MutationObserver（宿主子树 childList + `attributeFilter: [data-grow, data-shrink]`，
  回调宏任务化防自触发重入——属性变化即重算，杜绝「绑定生效但布局不跟随」的
  静默失效）；
- window resize 兜底（亦是 happy-dom 测试驱动通道）；
- **`static kind = Hybrid` 显式声明**：scope 通道管编译期装配（克隆壳/触发按钮），
  observer 通道管生命周期（mounted 启动观察）。初稿未声明 kind（默认 Compile）
  导致 mounted 永不触发的教训记录在案。

### 6. more 按钮 + popover 全权接管

溢出时宿主**末尾**显示 more 触发按钮（容器直接子元素、`flex-shrink:0`，内置 `more`
图标 + `aria-label="更多"`；未溢出 `display:none`——不参与 flex 不计 gap，显示与
折叠态单一真相在指令）。按钮声明 `x-popover:autospark-block-content`（共享空内容
组件，per engine 经 `static initialize` 注册；attr 必填的通道契约，`display:contents`
不产生盒子，实际内容由 overlay 中继挂入）+ `x-popover-options`（`shell` + `at`）。
PopoverDirective（ADR-0060 **hover 模型**）全权接管开关/定位/动画/delay，x-block
零自建弹层管理；键盘 Enter/Space 模拟 mouseenter/mouseleave（hover 模型补偿）。

### 7. 面板外壳 = 宿主浅克隆（编程式组件）

- **默认外壳**：宿主模板元素 `cloneNode(false)` 浅克隆（仅标签+属性）→ 清洗（剥离
  `x-*` / `:*` / `@*` / 含 `{{}}` 的属性与容器契约类——壳经组件编译且 shell scope
  rootless，残留绑定会误求值）→ 加 `autospark-block-panel` 标识类 + 内嵌无名
  `x-slot` 出口 → `buildComponentDef` + `registerComponentDef` + 注册进**宿主
  scope 的 components 表**（shell 解析走 scope 链，随 scope 生死、零全局污染）。
  用户 class / data-* / style 全保留——宿主类上的样式上下文（gap、后代选择器、
  主题变量）在面板内原样延续，这是克隆方案的动机本体；
- 面板边框兜底（`data-overlay-border` 视觉）与 overlay 容器 z-index 契约由指令
  全局样式自带（克隆壳无 `autospark-dialog` 类，popover-shell 的样式不命中）；
  克隆壳无箭头元素，旧「隐藏面板箭头」规则不再需要；
- `x-block-options.shell`：显式指定外壳组件名（须提供默认出口；未出口时 overlay
  基座 warn + 中继直挂面板根，可用性不破）——替换默认克隆壳，视觉责任随 shell
  转移。非法值 warn + 回退克隆壳；
- **`block-popover` 载体别名退役**：种子表回归全点前缀契约（8 键），删别名与
  builtin-components 契约测试的豁免断言。

### 8. stash 真实搬移（否决渲染副本）

折叠 = 子元素真实 `remove()` 出文档入 stash（绑定与 DOM 态全程存活；Compile 类
指令与 DOM 位置解耦）。**已知代价**：子元素上的 Runtime 类指令随移出引擎根 unmount、
移入面板（extra root）重挂，运行态重置——工具栏子元素以交互控件为主，接受。
中继通道：`overlay:open` 广播按 `config.at.selector` 认领本指令按钮的实例 → 按
DOM 序挂入面板出口（`display:contents` 透明，gap 生效面 = 面板根）；`overlay:close`
广播（面板 DOM 尚在的动画窗口）摘回 stash——覆盖物实例关闭即销毁（ADR-0052 修订
共识 5），摘回是控件状态跨开关保留的唯一途径。

### 9. 不做清单（v1 裁决）

无事件广播（`block:collapse/expand` 不再提供）、无 more 定制入口（仅 CSS 变量
`--autospark-block-trigger-*` 视觉定制）、`x-block-options` 仅 `shell` 一键
（delayShow/delayHide 用 popover 默认 200/150ms）、无面板分组/搜索增强。

## 后果

- kind = Hybrid，`x-block` 属性保留在结果 DOM（observer 通道前提）；不声明
  ownsChildren，子元素照常编译，与 x-for / x-if / x-show 正交；
- 溢出判定依赖真实布局测量；happy-dom 测试经 `Object.defineProperty` 覆写宿主
  scroll/client 尺寸（scroll 侧动态 getter 模拟折叠收敛）+ window resize 驱动
  （x-drawer 先例）；断言面落内联样式与契约属性；
- 样式经类级 `initialize` 全局注入（幂等），CSS 变量 `--autospark-block-*` /
  `--autospark-overlay-*` 定制；
- 克隆壳组件名带模块级序号（`autospark-block-shell-N`），注册进宿主 scope 随其
  回收；x-if 分支反复重建会为新宿主注册新壳，旧壳随 scope 销亡；
- 落盘物：`src/directives/x-block.ts` 重写 + 测试重写 + `components/index.ts`
  别名删除 + `builtin-components.test.ts` 断言回 8 键 + 本 ADR 就地改写 +
  CONTEXT.md 词条改写（布局条 → 溢出折叠容器、分区词条删除、溢出折叠重定义）
  + 指南五段骨架 + basic/overflow 双 demo 重写（全部已完成）。
