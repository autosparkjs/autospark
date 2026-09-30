# ADR-0070：折叠机制统一组合——x-splitter `data-expandable` 与 x-drawer 共享把手

- **状态**：Accepted
- **日期**：2026-09-30
- **关联**：[ADR-0069](0069-x-expandable.md)（被组合的唯一折叠实现、两阶段策略的第二阶段）、[ADR-0067](0067-x-splitter.md)（被清除的 `collapsible` 折叠机制、决策七修订）、[ADR-0063](0063-x-drawer.md)（被取代的 `trigger` 把手实现、坐标模型语义来源）、ADR-0052（visible 唯一真相源——保留不动）、[CONTEXT.md](../../CONTEXT.md)（「折叠（x-splitter）」「展开把手」「抽屉把手」词条）
- **共识来源**：grilling 决策 Q1–Q9 全闭合 + 用户两条终局裁决（旧机制清除、级联推论确认）+ 两轮代码事实调查（x-drawer / x-splitter 实现现状）

## 背景

折叠能力现存三份同构实现：x-expandable（把手 + 滑出/收缩双通道，ADR-0069）、x-splitter 的 `collapsible`（分隔条子元素把手 + 派生态折叠 + 负 margin slide，ADR-0067）、x-drawer 的 `trigger`（覆盖物容器常驻把手 + 折叠 ≡ visible 归假，ADR-0063）。三者的把手（圆形按钮 / 内置 arrow 图标 / 滑轨三态坐标 / 半圆折叠态 / 箭头翻转矩阵）与折叠动画通道（负 margin 滑出）高度重复。ADR-0069 决策一预留两阶段策略：第二阶段重构 splitter / drawer 组合之。本决策即第二阶段的落定——用户终局裁决：自有机制全部清除、x-expandable 唯一实现、无弃用期（引擎未发版，无 version 字段）。

## 决策

### 一、唯一实现：折叠机制全归 x-expandable

x-splitter 与 x-drawer 的自有折叠实现**整体删除**（把手 DOM/CSS、坐标解析、动画纪律、事件派发），折叠机制（把手/动画/事件）唯一实现 = x-expandable。无弃用期、无别名兼容（未发版，双契约是永久税）。组合形态分岔：splitter 是**全机制组合**（面板上实例化 x-expandable，承担把手/动画/事件全部）；drawer 是**把手层组合**（共享把手模块，overlay 生命周期不动）。

### 二、共享把手模块（drawer 消费形态）

把手元素构建 / 滑轨坐标解析 / 半圆折叠态视觉 / 箭头旋转矩阵抽为共享模块（ADR-0069 决策一预留的抽取，抽取对象至此明确），x-drawer 为第二消费者。上下文差异（z-index 基准、生命周期宿主、fixed vs absolute 定位）由消费方参数注入，不进类名/变量名。契约统一（breaking）：把手类名 `.autospark-expandable-trigger`、变量族 `--autospark-expandable-trigger-*`——`.autospark-drawer-trigger` 类名与 `--autospark-drawer-trigger-size` 变量删除，drawer 把手默认直径 24px → 20px 对齐 expandable。

### 三、x-splitter：面板声明 `data-expandable` 启用折叠

- **声明面**：面板元素 `data-expandable` 启用（仅**定容面板**，自适应面板 warn + 忽略）；空属性 = 全默认，JSON 对象 = 透传 x-expandable options。**折叠布尔为真相**（expandable 持有）：把手点击/外部翻转布尔 → expandable 管线写尺寸；拖拽跨折叠目标 → splitter 检测并翻转布尔（派生检测收敛为此单点）。
- **语义接管**：折叠目标 = `data-expandable` 的 `minSize`（`data-minimize-size` 删除；0 负 margin 滑出 / >0 收缩，分派与原实现同构零漂移）；`direction` 按 sized 位次推导（首位 `left` / 次位 `right`，vertical 类推，options 中写 direction 无效）；展开尺寸由 splitter 写回（`lastSize` 记忆链保留——面板尺寸经拖拽动态产生，声明值不代表用户期望的展开尺寸；options 中 `maxSize` 无效 warn）。splitter 宿主恒 `overflow:hidden`，expandable 的父容器注入幂等跳过。
- **显隐**：把手默认 `showTrigger:'hover'`（2026-09-30 修订，用户裁决推翻初版 `always` 默认）——分隔条本身充当**全长感应线**（divider hover 经 `autospark-expandable-edge-hover` 桥接类显形把手），x-expandable 的感应边条在 splitter 语境被样式表抑制（24px 边条会整体遮挡分隔条拖拽命中区）；把手本体 hover/聚焦照常显形。
- **清除清单**：`collapsible` 选项（含表达式热重定位）、`data-minimize-size`（含绑定形态）、`splitter:collapse` / `splitter:expand` 事件、分隔条把手 DOM/CSS、`--autospark-splitter-trigger-*` 变量、pane `data-collapsed` overflow 规则。`splitter:resize` 与拖拽/键盘机制不动。
- **ADR-0067 决策七修订**：「否决独立 collapsed 布尔源」在组合语境被推翻——折叠布尔由 expandable 持有，尺寸跟随布尔。

### 四、x-drawer：`expandable` 选项承接 `trigger`，overlay 生命周期不动

- **仅把手层统一**（结构矛盾所定：drawer 关闭 = 面板整树销毁，expandable 无法为已销毁面板提供机制）：`trigger` 选项删除，取值域移交 `x-drawer-options.expandable`——`false` 不建把手（承接 `trigger: false` 能力）/ `true` 全默认（居中）/ 对象 `{ pos }` 传坐标。边缘锚定坐标模型语义原样保留（正距主边、负距对面边、越界静默钳制、成员属性表达式热应用、created 期创建断言）。
- **保留不动**：关闭销毁（destroy-on-close）、visible 唯一真相、shell 滑入滑出动画（遮罩淡入淡出与家族 animate 契约在 shell 承载，expandable 不管遮罩）、ESC/mask/嵌套、`requestClose("trigger")` source 标签、锚定模式把手贴锚内侧边、把手实例外常驻（生命周期挂指令实例）、点击行为接线（折叠态 `writeVisible(true)` / 展开态 `requestClose("trigger")`）。
- **drawer 语境显隐**：`showTrigger` 默认 `'hover'`（2026-09-30 修订，用户裁决推翻初版「恒常驻」）——展开态隐藏、hover/聚焦显形；**折叠态恒显**（data-collapsed 独立规则，唯一重开触点不可让渡）；触屏恒显；hover 模式含**全长感应边条**（fixed 定位、几何随把手同一 `line`/滑轨基准同步，置于把手之前的兄弟使共享 `edge:hover ~ trigger` 规则直接生效）。把手恒常驻的旧表述仅折叠态成立。

### 五、事件

面板折叠事件 = `expandable:collapse` / `expandable:expand`（面板派发、冒泡）——splitter 宿主上监听靠冒泡（`@expandable:collapse` 挂宿主仍可达）。`splitter:collapse/expand` 删除不桥接。drawer 维持 `overlay:open/close`（无 `drawer:*` 命名空间，不涉及）。

## 被否决的方案

- **drawer 关闭态改造为「折叠不销毁」**（开合全管线归并路线）：推翻 ADR-0052/0063 的 destroy-on-close 架构（ESC 栈/嵌套/DOM 清理全部重审），为归并动画管线代价不成比例；「关闭态保活」若未来有真实需求应独立立项而非搭车。
- **`splitter:collapse/expand` 事件桥接**（ADR-0069 决策八的第二阶段承诺）：未发版双契约是永久税，直接删除——ADR-0069 决策八相应修订。
- **`data-expandable` 支持状态路径绑定**：值专职 options JSON（形态单一），折叠态内部持有 + 事件外泄；程序控制有真实需求再加（YAGNI）。
- **把手 hover 显隐作为 splitter 默认**：感应边条与分隔条拖拽命中区冲突，让位实现复杂度不成比例。

## 后果

- **ADR-0069 决策一/八修订**：「用户模板不变」对 splitter 不成立（`collapsible` → 面板 `data-expandable` 是模板变更）；事件桥接承诺取消。
- **breaking 清单**（未发版仓库内一次改净）：splitter 容器选项 / drawer 把手选项 / 两指令折叠事件 / 把手类名与变量族 / drawer 把手默认直径。
- 全链同步：测试（x-splitter 折叠用例重写、x-drawer 把手用例重写、expandable 增组合场景）、文档三页、demo、CONTEXT.md 词条（「折叠（x-splitter）」「展开把手」「抽屉把手」「贴边抽屉」「自适应面板」「展开折叠」）。

## 修订记录

- 2026-09-30 初版（grilling Q1–Q9 闭合即初版，实施随修订追加）。
- 2026-09-30 修订：**显隐默认翻转 + 两项实施缺陷**（用户反馈）——① x-splitter 与 x-drawer 把手默认 `showTrigger` 均改 `'hover'`（推翻决策三/四的 `always`/恒常驻初版；折叠态恒显保留——唯一重开触点）；splitter 以分隔条为全长感应线（桥接类 + 边条抑制），drawer 自建 fixed 感应边条；② drawer `expandable` 新增 `showTrigger` 取值（'hover' 默认 / 'always'，非法 warn 回退）；③ 修复 resize 会话把手不跟随（`_applyResize` 补 rAF 合帧重定位——调节改变开口边线，此前仅 open/close/viewport 同步）。新增 `offset` 选项见 ADR-0069 修订。
- 2026-09-30 修订：**resize × expandable 共存（grilling 四题全 A）**——「边线交互元素优先」原则确立：drawer hover + resize 时边条抑制（面板 stacking context 封顶、抬层不可行的几何必然）、面板手柄经统一契约 `data-edge-hover` 桥接显形；通用语境（同元素 x-resize + x-expandable）resize 本可用（手柄 z 10 > 边条 z 4）但感应链被截断——x-expandable 宿主级事件委托自动桥接（对 x-resize 零耦合）；splitter 桥接迁移至同一契约。详见 ADR-0069 修订。
- 2026-09-30 修订：**drawer 把手 vs resize 手柄的命中让位**（用户复核「冲突未解决」驱动）——边条之上有第二层抢夺：把手 z(overlay+1) 高于面板内手柄（≤1000），开口边中央（pos 默认 `'50%'` 恰在此）抓手柄命中的是把手（hover 模式隐形，症状为「神秘折叠/无法 resize」）。让位语义：resize 启用 + 展开态 + 指针落在手柄带内（getBoundingClientRect 判定）→ 把手 pointerdown **转发手柄**（resize 会话以原坐标启动）+ preventDefault 抑制兼容鼠标事件链（click 不触发折叠，测试环境以标志位兜底）；把手外半（面板外侧突出部）照常折叠。
