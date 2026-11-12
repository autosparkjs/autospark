# ADR-0018: 组件库路线图——55 组件五批清单与全局约定

- 状态：已接受（Accepted，2026-11-12）
- 日期：2026-11-12
- 修订：2026-11-12 antd 全量对照增补——transfer 补入 form/P3、float-button 补入 other/P3 并吸收 backtop 为其 `back-to-top` 形态（antd 5 同款路线），总量 55→56；mentions / qrcode / navbar 列入配方或观望（见决策 1 备注）
- 关联：ADR-0017（八分类骨架——本路线图往八类里填充）、ADR-0009（插件四形态）、ADR-0003（一插件一文件夹）、ADR-0012（button 范式——全库样式基线）、ADR-0014/0016（继承家族先例）、ADR-0011（resource——RPC 语义与组件层正交）

## 背景

`src/components/` 现有 general 三组件（button / button-group / state-button），八分类骨架已立（ADR-0017）。组件库将全量推进，需要一次性定界：**清单（做什么/不做什么）、顺序（先做什么）、约定（怎么做才不返工）**。本 ADR 记录五轮 grilling 收敛的全部共识；后续每个组件的 ADR 以本路线图为上位依据（归类声明、批次归属、约定继承）。

## 决策

### 决策 1：规模与总量——全量对标、55 收口宁缺毋滥

对标 Element Plus 量级的完整组件库（用户明确选择全量路线），但**不硬凑数**：清单落在 **56 个**（53 新增 + 3 现有，含 2026-11-12 antd 对照增补），砍掉与生态/指令重复及低频重件。边缘件不进首版清单，后续按需增补——增补走组件自身 ADR 声明归类即可（ADR-0017 决策 3 已开此门），不改本 ADR。antd 对照点名备注：**mentions**（提及以上输入，P3 autocomplete 落地后配方不够用再升级）、**qrcode**（与运行时零依赖基线有张力，先配方 qrcode.js CDN + x-html）、**navbar**（antd 无此件，场景由 x-layout 指令 + menu 组件组合承担，配方交付）、otp / copy-to-clipboard / banner / highlight（低频观望）；text 的 copyable 并入 P0 text 属性面（editable 缓议）。

### 决策 2：清单权威表（分类 × 组件 × 批次 × 复用素材）

新组件内部实现**优先装配已有机制**（指令/组件/模块，复用素材列即装配起点），无现成机制才自写；用户拿到的恒是开箱即用的 `x-component:` 标签——**内部装配、对外开箱**。

| 分类 | 组件（批次） | 主要复用素材 |
| --- | --- | --- |
| general | link（P0）、text 含 ellipsis（P0）；button / button-group / state-button（现有） | button 范式、语义色 token |
| layout | space（P0）、grid（P0）、divider（P0）、container（P2） | CSS 变量；与 layout 七指令（resizable/splitter/expandable/layout/pane/container/viewport）互补不重叠 |
| feedback | alert（P0）、progress（P1）、skeleton（P1）、message-box（P1）、result（P2） | x-icon、x-dialog、button、i18n、语义色 |
| navigation | tabs 含 segmented variant（P1）、breadcrumb（P1）、menu（P2）、steps（P2）、pagination（P2）、page-header（P2）、anchor（P3）、dropdown（P3） | x-icon、state-button、i18n、x-for.paging |
| display | card（P0）、tag（P0）、empty（P0）、avatar（P1）、image（P1）、list（P1）、table 含 virtual 模式（P2）、descriptions（P2）、timeline（P2）、statistic（P2）、image-viewer（P2）、carousel（P2）、collapse（P2） | x-for、virtual、x-loading、tooltip、x-scrollbar、tag/card/checkbox（跨组件）、语义色 |
| form | input 含 textarea/password 形态 + **BaseField**（P0）、checkbox（P0）、radio（P0）、switch（P0）、select（P1）、input-number（P1）、slider（P1）、rate（P1）、autocomplete（P3）、date-picker（P3）、time-picker（P3）、time-select（P3）、cascader（P3）、tree-select（P3）、color-picker（P3）、transfer（P3） | x-model、x-field、x-popover、x-tree、x-icon、checkbox/button/list（transfer 装配）、BaseField |
| other | float-button 含 back-to-top 形态（P3，吸收原 backtop 独立条目——antd 5 同款路线）、affix（P4）、watermark（P4）、tour（P4）、countdown（P4） | scroll 监听、expandable 共享把手、x-popover、i18n |
| base | BaseField（P0，**基类不计入清单数**） | 演进式抽取，见决策 7 |

### 决策 3：指令即终态——已覆盖能力不做组件化外壳

指令/模块已覆盖的能力**不做组件化外壳**（区别于 overlay 词条「面板外壳」——那是弹层面板层载体），指令即终态 API，避免同一能力双轨维护：

- 指令：x-icon/x-icons、x-scrollbar、x-badge、x-spin、x-ripple、x-loading、x-error、x-tree、x-dialog、x-popover、x-drawer、x-foldable（单面板）、layout 七指令、x-teleport
- features：tooltip、virtual
- modules：notifications（message/notification 已覆盖，**message-box 入清单因其是 confirm 询问语义、非通知**）

组件清单与指令的边界模糊件裁决：**dropdown 进 P3**（popover + 菜单语义——键盘导航/激活态有真实增量）、**collapse 进 P2**（x-foldable 单面板 + 「组 + 互斥手风琴」增量）、**popconfirm 不进清单**（popover + button + text 配方可得，以配方文档交付）、**segmented 并入 tabs** 作 variant 不独立成件。

### 决策 4：排除域（明确不进清单）

图表（echarts 类）、富文本编辑器、地图、代码编辑器、完整日历组件（日历仅作 date-picker 内部面板）、文件上传后端交互（upload）。虚拟表不独立成件——virtual 模式并入 table。

### 决策 5：五批划分与排序原则

排序主轴 = **依赖链拓扑优先**（被后续组件消费的公共素材先行），同类内按价值微调。批次是交付/验收单位（每批可发布可验收），**不是时间承诺**：

- **P0 基础批（13）**：text、link、space、grid、divider、card、tag、alert、empty、input（携 BaseField，启用 base/）、checkbox、radio、switch——后续所有批次都消费这批素材；同时验证全库基线（button 范式 / i18n / 语义色）。
- **P1 表单+反馈主力（12）**：select、input-number、slider、rate、progress、skeleton、message-box、avatar、image、list、breadcrumb、tabs。
- **P2 展示+导航主力（13）**：table、descriptions、timeline、statistic、image-viewer、carousel、menu、steps、pagination、page-header、result、collapse、container。
- **P3 重件深水区（11）**：date-picker、time-picker、time-select、autocomplete、cascader、tree-select、color-picker、transfer、anchor、dropdown、float-button（含 back-to-top 形态）。
- **P4 长尾（4）**：affix、watermark、tour、countdown。

### 决策 6：四条全局约定（组件 ADR 必须继承）

1. **i18n 词典**：组件内置文案（pagination「下一页」、empty「暂无数据」等）统一走 modules/i18n 词典，首版 zh 预留 en；未加载 i18n 插件时回退硬编码中文——依赖松弛，不强制。
2. **router 隔离**：navigation 类组件纯状态驱动（active 态由状态表达），不 import router 包——plugins 包自包含闭包架构不破；router 侧以**配方**形式提供联动文档。
3. **排除域**：见决策 4，新增组件不得踏入。
4. **样式基线**：button 范式全库强制推广——type 形态 / color 语义色正交 + theme 档位全跟随 + CSS 变量；每个组件 ADR 照此声明。

### 决策 7：表单基座与基类策略

- **原生增强 + x-field 协作**：input/checkbox/radio 等用原生控件 + 样式包裹（保原生可访问性与移动端兼容），select/日历类弹层交互自绘；label/校验/域布局由 engine x-form/x-field 指令承担，组件专注控件本身——不双轨建域。
- **base/ 目录 P0 启用**：form 域组件高度同构，**BaseField 随 input 首件即抽**入 base/（前瞻性唯一例外）；其余基类**演进式抽取**——第三个同类组件出现时再抽象，防过早设计。

### 决策 8：流程约定

- **开发统一走 autospark-component 技能**全流程（组件插件创建 + demo + 文档 + 侧边栏登记）。
- **ADR 粒度**：重件/新机制件（input+BaseField、select、table、date-picker、message-box、menu 等）每件一 ADR；轻件（divider/space/text 等纯样式件）合批一个 ADR。
- **验收**：件级四项（单测绿 + demo 真浏览器 e2e + 文档结构校验过 + 侧边栏登记）+ 批级回归（全量测试 + demo 站过一遍）。

## 备选方案

- **中量级 30-40 / 轻量 15-20 规模**：否决——用户明确全量对标；八分类骨架大部分长期空置与 ADR-0017 骨架预显形意图相违。
- **高频者做薄组件化外壳 / 全部双轨组件化**：否决——同一能力双轨维护面翻倍，样式一致性难保；指令即终态。
- **组合可得即不做组件（配方交付为常态）**：否决——把组装成本转嫁给用户，与「官方组件库」开箱即用定位相悖；配方仅限增量极薄者（popconfirm）。
- **价值优先 / 分类顺序排序**：否决——table/modal 等招牌件依赖的基础件会被迫边做边补（返工多）；分类序在跨类依赖（form 控件要 icon、grid 被 table 消费）下名存实亡。
- **P0 先全面设计 BaseField/BasePopup/BaseList 三基座**：否决——一步到位的接口拍脑袋成分高、过早抽象风险大；演进式 + form 前瞻是折中。
- **表单件全自绘 / 自带完整域**：否决——可访问性与工期代价高；label/校验/布局与 x-field 双轨重复建设。
- **组件文案 props 直传 / 部分接 i18n**：否决——多组件场景每处都传繁琐；「部分接」规则模糊难执行。
- **navigation 可选自动联动 router**：否决——运行时可选依赖打破 plugins 与 router 互不感知的现行架构。

## 后果

- 52 个新增组件的归类、批次、约定以本表为权威映射；组件 ADR 声明归类时引用本 ADR。
- 清单增补/移除不必改本 ADR（组件自身 ADR 声明即可），但**排除域（决策 4）与四约定（决策 6）的变更必须修订本 ADR**。
- 侧边栏空分组（常规外的六组）随各批交付逐组填充；`.gitkeep` 空目录逐件退场。
- P0 的 BaseField 是 base/ 目录首个产物——base/ 从预留态转入现役，文档侧仍不投影（ADR-0017 决策 4 不变）。
- message-box 与 x-dialog 的边界（询问语义 vs 通用弹层）须在其组件 ADR 中显式声明，防后续「为啥有 x-dialog 还做 message-box」的疑惑回潮。
