# ADR-0019: P0 轻件合批——纯样式件一组一 ADR

- 状态：已接受（Accepted，2026-11-12）——P0 轻件合批，随批追加；**2026-11-13 P0 十二件轻件全量入册，本 ADR 定稿**（后续批次轻件另立合批 ADR）
- 日期：2026-11-12
- 关联：ADR-0018（组件库路线图——清单权威表与四条全局约定，本 ADR 的上位依据；决策 8 轻件合批粒度）、ADR-0017（八分类归置——目录/产物/注册名三对齐）、ADR-0012（button 范式——全库样式基线）、ADR-0134（engine autospark.base——主题档位继承）、ADR-0129（三级样式回退链）

## 背景

ADR-0018 决策 8 确立 ADR 粒度：重件/新机制件每件一 ADR，**轻件（divider/space/text 等纯样式件）合批一个 ADR**。P0 基础批 13 件中九件为轻件（space/grid/card/tag/alert/empty/checkbox/radio/switch），首批三件（text/link/divider）先行落地——本 ADR 即其合批载体，后续轻件按批追加段落，不另开 ADR。

每件一节，统一声明：API 面、归类声明（引用 ADR-0017/0018 权威表）、复用说明（引用 ADR-0018 决策 2「内部装配、对外开箱」）。

## 决策

### 1. text 排版文本（general，P0）

**归类声明**：`src/components/general/text/`，产物 `autospark.text.js`，注册名 `autospark.text`（三对齐 kebab-case，ADR-0017 决策 1）。ADR-0018 清单权威表 general 行「text 含 ellipsis（P0）」。

**API 面**：

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| label | `string` | `""` | 兜底文案（插槽内容优先；text 无内置文案、不接 i18n——ADR-0018 决策 1 备注） |
| type | `default \| secondary \| third \| primary \| success \| warning \| danger \| info` | `default` | 文本层级/语义色：三中性档（正文/次要/辅助）+ 语义色（对齐 button 色板） |
| strong | `boolean` | `false` | 加粗（`--x-font-weight-large` 标尺档） |
| ellipsis | `false \| true \| number` | `false` | 溢出省略：`true` 单行省略号；`number n` 多行截断（line-clamp n，行数经 `--asc-text-lines` 变量 `:style` 内联下发——自定义属性键引擎走 setProperty 通道）；截断时静态检测自动挂 title/data-tooltip（双轨，对齐 button 范式） |
| copyable | `false \| true \| { text?: string }` | `false` | 复制：`true` 复制渲染文本；`{ text }` 复制指定文本。navigator.clipboard 写入 + 成功反馈（图标 copy ↔ 勾、success 色点亮，约 1.5s 自复原）；失败 console.warn 响而不哑。`editable` 不做（ADR-0018 决策 1 备注） |

事件：`copy`（detail = `{ text }`，复制成功冒泡）。Slots：默认（文本内容）。

**样式基线继承（ADR-0018 决策 6.4）**：type 语义色轴 + theme 档位全跟随（**不设自有字号属性**——字号经主题通道 `data-size` → `--auto-font-size`，与 button 同范式 ADR-0012）+ CSS 变量三级回退链（ADR-0129）+ 暗色兜底变体。纯样式件以中性档为主（default/secondary/third），语义色按需映射。

**复用说明**：复制图标经 engine 内置 `x-icon` 指令（`copy`/`yes` 内置图标，零额外引入）；溢出提示双轨对齐 button 既有判定口径（tooltip 特性在场挂 `data-tooltip`、缺席挂原生 `title`）；无其它机制依赖，组合件缺位即静默无害（x-icon 为 engine 内置恒在场）。

### 2. link 链接（general，P0）

**归类声明**：`src/components/general/link/`，产物 `autospark.link.js`，注册名 `autospark.link`。ADR-0018 清单权威表 general 行「link（P0）」。

**API 面**：

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| label | `string` | `""` | 兜底文案（插槽内容优先） |
| href | `string` | `""` | 链接地址（空 = 非链接态：宿主无 href 不导航） |
| target | `string` | `""` | 打开方式；含 `_blank` 时自动补 `rel="noopener"`（宿主显式 rel 永不覆盖） |
| type | `primary \| success \| warning \| danger \| info \| default` | `primary` | 语义色（`--asc-tone` 中转变量，对齐 button ADR-0012 语义色范式；`default` 中性档为正文色链接） |
| icon | `string \| { name: string }` | `""` | 图标名或 `{ name }` 对象（外链提示常用内置图标 `external`） |
| disabled | `boolean` | `false` | 禁用：摘 href + `aria-disabled` 标注 + 点击 preventDefault 拦截（视觉淡化、不可达） |
| underline | `hover \| always \| none` | `hover` | 下划线档位 |

事件：`click`（原生冒泡；disabled 态被拦截不导航）。Slots：默认（链接内容）。

**样式基线继承**：type 语义色正交轴（`--asc-tone` 中转 + `:has()` 反驱宿主，button 同款结构）+ theme 档位全跟随（字号经 `data-size` 主题通道）+ 三级回退链 + 暗色兜底。

**复用说明**：图标经 engine 内置 `x-icon`；元素名快速写法 `<x-link>` 由 precompile DOM 变换承载（宿主替换为**真 a 元素**——a 的原生导航语义（中键/右键/键盘/爬取）是化身复用 HTMLUnknownElement 所不能保真的，button 同款止血路线，ADR-0133）；href/target/rel 原生属性走 mounted JS 同步通道（化身路径约束 T4=B 的原生属性惯例）。text/divider 不做 precompile 变换（span/div 根无原生语义损失，引擎元素名通道直接可用）——「有原生语义损失的根标签才做变换」为后续组件的可复制判据。

### 3. divider 分割线（layout，P0；layout 分类首件）

**归类声明**：`src/components/layout/divider/`，产物 `autospark.divider.js`，注册名 `autospark.divider`。ADR-0018 清单权威表 layout 行「divider（P0）」。layout 分类首个落地组件（侧边栏「布局」空分组随本件填充）。

**API 面**：

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| vertical | `boolean` | `false` | 垂直分割线（缺省水平）；垂直态文字不渲染（对齐 antd 5 边界——垂直分割线为纯分隔） |
| dashed | `boolean` | `false` | 虚线（缺省实线） |
| align | `left \| center \| right` | `center` | 带文字时文字位置（仅水平态有意义） |
| spacing | `number \| string` | `""` | 与相邻内容间距：number 归一 px；水平态 = 上下 margin、垂直态 = 左右 margin（宿主 JS 通道；缺省无边距——间距编排交给 space 组件/使用者布局） |

Slots：默认（嵌线文字；空插槽时两段线连成整线，同一结构双态共用）。

**样式基线继承**：线色 `--auto-border-color` 三级回退链 + 暗色兜底；纯样式件无语义色轴（中性档）；字号经主题通道跟随。垂直态高度默认 `0.9em`（`--asc-divider-length` 可覆盖；flex 容器满高由使用者样式控制）。

**复用说明**：零机制依赖（纯 CSS 结构：body flex 线容器 + `::before`/`::after` 伪元素两段线）；与 layout 七指令（x-splitter 分割器等）**互补不重叠**——彼是可拖拽分栏的结构指令，此是装饰性视觉分割线（ADR-0018 清单表 layout 行边界）。spacing 不占用 `data-spacing` 主题通道名（ADR-0134 六通道名保留），走自有 prop + JS 通道。

### 4. alert 警示提示（feedback，P0；feedback 分类首件）

**归类声明**：`src/components/feedback/alert/`，产物 `autospark.alert.js`，注册名 `autospark.alert`（三对齐 kebab-case）。ADR-0018 清单权威表 feedback 行「alert（P0）」。feedback 分类首个落地组件（侧边栏「反馈」空分组随本件填充）。

**API 面**：

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| type | `success \| warning \| danger \| info \| default` | `default` | 语义色五档（default 中性缺省；警示条无 primary 档） |
| title | `string` | `""` | 标题文案（空则不渲染标题行） |
| description | `string` | `""` | 描述文案（默认插槽内容优先——插槽可换富内容） |
| closable | `boolean` | `false` | 关闭按钮：closed 置位（宿主 `data-closed` 属性 → CSS `display:none`，属性驱动可接管动画）+ close 事件冒泡；原生 click 冒泡被阻断 |
| icon | `string \| { name: string } \| false` | `""` | 图标覆盖；空 = 按 type 映射内置图标（success→success / warning→warn / danger→error / info→info / 中性→bell，经 engine 内置 x-icon）；`false` 关闭图标位 |
| banner | `boolean` | `false` | 边缘通栏形态（圆角清零满宽） |
| closed | `boolean` | `false` | 关闭态（内部状态；外部状态注入兼作重开通道） |

事件：`close`（detail 为空，关闭即隐藏）。Slots：默认（描述内容，优先于 description）。

**样式基线继承（ADR-0018 决策 6.4——语义色基线在非 button 组件的首个落地）**：`--asc-tone` 中转变量 + body `data-type` 变体属性经 `:has()` 反驱宿主（button ADR-0012 同款结构，**组织方式定型可复制**：淡底 tone 10% + 半透明边框 tone 38% 均由 tone 单源 color-mix 派生，覆盖一个变量整体换色）+ theme 档位全跟随（字号经 `data-size` 主题通道，不设自有字号属性）+ 三级回退链 + 暗色兜底变体。

**复用说明**：图标经 engine 内置 `x-icon` 指令（内置图标零额外引入）；div 根无原生语义损失，不做 precompile 元素名变换（第 2 节 link 判据）；无其它机制依赖。**无内置文案、不接 i18n**（title/description 均使用者传入——ADR-0018 决策 6.1 的 i18n 通道对本件无消费面，原「内置文案走 i18n 词典」预期随本件定界收窄）。

**与 x-error 指令的边界消歧**：x-error 是 error 事件通道的**就近消费**（行为指令——捕获子树运行时错误并呈现，ADR-0118）；alert 是**静态展示组件**——内容全部使用者传入，不监听 error 通道。动态错误呈现用 x-error，静态警示条用 alert，两者正交不互相替代。

### 5. space 间距容器（layout，P0）

**归类声明**：`src/components/layout/space/`，产物 `autospark.space.js`，注册名 `autospark.space`（三对齐 kebab-case，ADR-0017 决策 1）。ADR-0018 清单权威表 layout 行「space（P0）」。

**API 面**：

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| size | `number \| string \| [h, v]` | `"medium"` | 间距四形态：档位名（x-small/small/medium/large/x-large → CSS 变量档直取 `--x-spacing-*` 标尺，medium 档经 `--auto-spacing` 接通 theme spacing 档位）\| number 归一 px \| 任意 CSS 值透传 \| [水平, 垂直] 两轴数组（antd 序，第二项缺省同第一项）。档位名走 body `data-gap` 属性 CSS 档位块，值形态走 mounted JS 通道内联 row-gap/column-gap（元素级覆盖档位块，两通道互补） |
| direction | `horizontal \| vertical` | `horizontal` | 排列方向（body flex 容器 row/column 切换） |
| align | `start \| center \| end \| baseline` | `center` | 交叉轴对齐（随 direction 自动换轴；缺省 horizontal 居中 / vertical 起缘，antd 观感） |
| wrap | `boolean` | `false` | 换行（horizontal 态 flex-wrap；行距=row-gap=垂直轴间距） |

Slots：默认（间距编排的子元素，正常编译）。无事件。

**样式基线继承（ADR-0018 决策 6.4）**：间距档位 CSS 变量档（`--x-spacing-*` 标尺 + `--asc-space-gap` 覆盖通道压全档）；**零色彩消费**（暗色模式天然无感，无暗色兜底块——纯布局件的基线收窄先例）；theme 档位经 medium 档 `--auto-spacing` 联动。插槽出口 `display: contents`：子项穿透出口成为 body 直接 flex 项（容器类组件的布局透明惯例，自此定型）。

**复用说明**：零机制依赖（纯 CSS flex 容器）；与 layout 七指令**互补不重叠**——彼是页面骨架窗格结构指令，此是成组内容的间距编排（ADR-0018 清单表 layout 行边界）。size 为自有 prop，档位属性用 `data-gap` 非通道名（`data-spacing` 主题六通道名保留，ADR-0134）；嵌套数组 props 经状态引用注入（ADR-0019 后果节第 2 条引擎缺陷规避）。

### 6. grid 栅格容器（layout，P0）

**归类声明**：`src/components/layout/grid/`，产物 `autospark.grid.js`，注册名 `autospark.grid`。ADR-0018 清单权威表 layout 行「grid（P0）」。

**API 面**：

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| cols | `number \| "auto" \| { xs?, sm?, md?, lg?, xl?, xxl? }` | `3` | 列数三形态：number 固定列（写 `--asc-grid-cols` 变量，`repeat(n, minmax(0, 1fr))` 防子项撑破轨道）；`"auto"` 自适应（auto-fill，最小列宽 `--asc-grid-min` 缺省 16rem）；响应式档位对象——档名对齐 viewport 六档（xs..xxl）、断点自持 Bootstrap 5 min-width（sm 576/md 768/lg 992/xl 1200/xxl 1400，xs 无阈值基础档），matchMedia 自高向低探测取最高命中档（全未命中回退 `xs ?? 1`），跨断点监听自动重算 + unmounted 清理，**不依赖 x-viewport 指令** |
| gap | `number \| string \| [h, v]` | `0` | 间隙四形态（与 space.size 同构）；缺省 0（CSS 原生栅格语义） |
| justify | `start \| center \| end \| between \| around \| evenly` | `start` | 轨道水平分布 justify-content（列宽不满容器时有效，如 auto 列） |
| align | `stretch \| start \| center \| end \| baseline` | `stretch` | 项的块轴对齐 align-items（缺省随轨道拉伸） |

Slots：默认（栅格子元素，正常编译）。无事件。

**样式基线继承（ADR-0018 决策 6.4）**：与 space 同构（`--x-spacing-*` 档位 + `--asc-grid-gap`/`--asc-grid-cols`/`--asc-grid-min` 覆盖通道）；零色彩消费无暗色块；插槽出口 `display: contents` 同 space 惯例。

**复用说明**：零机制依赖（纯 CSS grid + matchMedia 原生 API）；与 layout 七指令（x-layout/x-pane 管页面骨架窗格）**互补不重叠**——彼是页面结构级窗格编排，此是通用内容栅格（卡片列表/表单行/缩略图墙），ADR-0018 清单表 layout 行边界；与 space 的间距机制同构复用（档位块+JS 通道双轨模式自此双件定型）。嵌套对象 props 经状态引用注入（ADR-0019 后果节第 2 条规避）。

### 7. card 卡片（display，P0；display 分类首件）

**归类声明**：`src/components/display/card/`，产物 `autospark.card.js`，注册名 `autospark.card`（三对齐 kebab-case）。ADR-0018 清单权威表 display 行「card（P0）」。display 分类首个落地组件（侧边栏「展示」空分组随本件填充）。

**API 面**：

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| title | `string` | `""` | 头部标题（header 槽可整体重载，槽内容优先） |
| bordered | `boolean` | `true` | 边框开关（false 转透明色占位稳定；绑定通道取反落 `data-borderless`——假值属性整个移除的家族约定下缺省即有边框） |
| hoverable | `boolean` | `false` | 悬停浮起（边框点亮主色 + 阴影抬升，`--asc-card-hover-shadow` 可覆盖） |
| collapsible | `boolean` | `false` | 头部可折叠（点击标题区含箭头切换；extra 区域不触发） |
| collapsed | `boolean` | `false` | 折叠态（受控可驱动；body/footer 经 x-show 显隐——勿引重机制） |

事件：`collapse`（detail = `{ collapsed }` 翻转后新值；外部受控变化不广播防回环）。Slots：默认（body 出口即容器，投影内容为直接子级）/ `header`（整体重载标题区）/ `extra`（头部右缘动作区）/ `footer`（底部动作区）。空段自动隐藏：title 空 + header/extra 槽无内容 + 不可折叠 → 头部不占位（`:has` + `:empty` 判定，真浏览器已验证）；footer/body 空同理。

**样式基线继承（ADR-0018 决策 6.4）**：底色/边框/阴影/圆角全走 `--auto-*`（阴影消费 `--auto-shadow`——**卡片阴影即 theme 手动通道 `data-shadow` 档位**，组件无自有阴影属性）；变体数据属性落内层 inner（T4=B 化身路径约束，盒子样式直接命中 inner 选择器无 `:has` 反驱）；内距消费 `--auto-padding`（`data-spacing` 档位生效）；暗色兜底变体在场。

**复用说明**：零机制依赖；div 根无原生语义损失不做 precompile（link 判据）；折叠箭头用内置 `arrow` 图标（x-icon 零额外引入）。

### 8. tag 标签（display，P0）

**归类声明**：`src/components/display/tag/`，产物 `autospark.tag.js`，注册名 `autospark.tag`。ADR-0018 清单权威表 display 行「tag（P0）」。

**API 面**：

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| type | `primary \| success \| warning \| danger \| info \| default` | `default` | 语义色五档 + 中性档（对齐 button/link 范式 ADR-0012） |
| variant | `light \| solid \| outline` | `light` | 形态轴与语义色正交：light 淡底 / solid 实底白字（白字为恒定设计）/ outline 描边 |
| icon | `string \| { name: string }` | `""` | 前置图标（经 x-icon 值通道，响应式切换；空值不渲染） |
| closable | `boolean` | `false` | 关闭钮（内置 no 图标）：close 事件冒泡（cancelable） |
| closed | `boolean` | `false` | 关闭态（`:has` 通道隐藏整枚；受控可回 false 重现） |

事件：`close`（detail = `{ event }` 原始点击事件；未 preventDefault 自动置 closed 隐藏，preventDefault 交外部接管——受控惯用法）。Slots：默认（标签文字，空插槽出口隐藏）。尺寸档无自有属性：经 theme `data-size` 通道全跟随（字号 `--auto-font-size` + em 内距，真浏览器 18/16/14px 实测）。

**样式基线继承（ADR-0018 决策 6.4）**：`--asc-tone` 中转 + body `data-type`/`data-variant` 变体属性经 `:has()` 反驱宿主（button/alert 同款已定型结构）；solid 白字恒定设计非变量映射（ADR-0129 备注）；三级回退链 + 暗色兜底。

**复用说明**：与 **x-badge 指令正交**（彼是宿主内容角标标记，此是行内语义标签，ADR-0018 清单表边界）。

### 9. empty 空状态（display，P0）

**归类声明**：`src/components/display/empty/`，产物 `autospark.empty.js`，注册名 `autospark.empty`。ADR-0018 清单权威表 display 行「empty（P0）」。

**API 面**：

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| description | `string` | `""` | 描述文案；空时走 i18n 词典 `empty.description` 键（ADR-0018 决策 6 约定 1——i18n 在场按 `$.language` 查表，语言切换响应式即时生效；未装 i18n/词典未命中回退硬编码中文「暂无数据」，键等值判定双场景共用） |
| icon | `string \| { name: string }` | `"file"` | 图标（经 x-icon 值通道；image 槽可整体换图，空串不渲染） |

无事件。Slots：`image`（图区整体换图，默认大号内置图标兜底——辅助色、2.6em 相对字号随档位缩放）/ 默认（描述下方附加动作区，空不占位）。

**样式基线继承**：图区 `--auto-third-color` / 描述 `--auto-secondary-color` 三级回退链 + 暗色兜底；字号经 `data-size` 主题通道。

**复用说明**：i18n 词典机制复用（键带组件前缀 `empty.description`，使用者经 x-locales / 顶层 locales script / `options.i18n.messages` 三通道任意语言覆译；**依赖松弛不强制**——未装 i18n 平滑回退）；默认图标用内置 `file`（engine 暂无空态专属图标，增补后可换默认值）。

**与 x-empty 属性标记的命名消歧**：`x-empty` 作为**属性标记**是 x-for / x-tree 认的结构空态触发器（容器直接子元素上的无值属性，空数组时渲染该子树）；本组件是通用空状态**展示组件**（`autospark.empty`，元素名形态 `<x-empty>`）——分属元素/属性两通道互不相认；x-tree 容器内结构空态仍用属性标记，页面级/卡片级空状态展示用本组件（组件文档同步披露）。

### 10. checkbox 复选框（form，P0）

**归类声明**：`src/components/form/checkbox/`，产物 `autospark.checkbox.js`，注册名 `autospark.checkbox`（三对齐 kebab-case）。ADR-0018 权威表 form 行「checkbox（P0）」。

**API 面**：

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| label | `string` | `""` | 勾选框文案（真实 label 包裹，点击文字/盒子任一处切换；继承形态下嵌套插槽出口被忽略 ADR-0056，文案走 props，消费者内容经 base-field 出口整段替换控件区为逃生通道） |
| checked | `boolean` | `false` | 非受控初值/单向同步值（受控真相走宿主 x-model——el.value 布尔语域 `"true"/"false"`，配 `.boolean` 保真，state-button 布尔组桥同款） |
| indeterminate | `boolean` | `false` | 半选态（JS 通道设原生 property——无 HTML 属性形态，与勾选正交，tone 底白横线视觉） |
| status / disabled / readonly | — | — | 走 BaseField 骨架通道（ADR-0020） |

事件：`change`（原生冒泡），切换时宿主另派发 `input`（x-model 回写，非冒泡）。表单提交：内层真 input 即载体（勾选提交 `name=true`、未勾选不提交，ADR-0020 决策 6；宿主 name 透传）。

**样式基线继承**：裸态无盒饰（不加 asc-field-box），勾选/半选底色经 `--asc-field-tone`（status 联动），em 基准随 `data-size` 档位，三级回退链 + 暗色兜底，`--asc-checkbox-*` 覆盖通道。

**复用说明**：继承 `autospark.base-field`（产物内嵌注册）；视觉 `:checked`/`:indeterminate` 伪类经 `:has()` 驱动，零图标/机制依赖。

### 11. radio 单选钮（form，P0）

**归类声明**：`src/components/form/radio/`，产物 `autospark.radio.js`，注册名 `autospark.radio`。ADR-0018 权威表 form 行「radio（P0）」。

**API 面**：

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| value | `string` | `""` | 本钮值（组内唯一标识——勾选写 state、按值匹配勾选，与 x-model 原生 radio 语义同构） |
| label | `string` | `""` | 同 checkbox |
| checked | `boolean` | `false` | 非受控初值/单向同步值 |
| status / disabled / readonly | — | — | 骨架通道 |

事件：`change`（原生冒泡）；**勾选态**派发 `input` 回写、取消态不派发（被勾选的另一枚接管）。**组语义走原生 name 同名互斥，不建组容器组件**：同 x-model 路径多枚经引擎缺省 name 注入天然同组（或显式 name）；组样式编排用 flex/space 配方（文档给出）；受控按钮形态单选组由 button-group 选中模式承接。表单提交：内层真 input 即载体（勾选项提交 `name=value`）。

**样式基线继承**：同 checkbox（裸态/tone 圆点/em 档位/回退链/暗色兜底/`--asc-radio-*` 覆盖通道）。

**复用说明**：继承 `autospark.base-field`（产物内嵌注册）；圆点 `:checked` 伪类驱动；键盘方向键移组等原生能力保留；零机制依赖。

### 12. switch 开关（form，P0；form 族唯一自绘控件）

**归类声明**：`src/components/form/switch/`，产物 `autospark.switch.js`，注册名 `autospark.switch`。ADR-0018 权威表 form 行「switch（P0）」。

**API 面**：

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| label | `string` | `""` | 整组热区：轨道+文案都触发 |
| checked | `boolean` | `false` | el.value 布尔语域桥，配 `.boolean` 保真 |
| loading | `boolean` | `false` | 加载态（滑块转 CSS 旋转圈 + 阻断切换，视觉优先于 disabled 不淡化） |
| status / disabled / readonly | — | — | 骨架通道（disabled 载体出表；error 态轨道 aria-invalid） |

事件：`change`（detail = `{ value: boolean }` 新布尔值，冒泡）；`input`（x-model 回写通道，非冒泡）。表单提交：内嵌 `input[type=hidden]` 载体（value = 当前布尔字面串**恒提交**、name 透传宿主——state-button N>2 表单桥同构；disabled 时载体随禁用出表，服务端按 true/false 值域约定）。

**可访问性自持**：`role="switch"` + aria-checked + tabindex + Space/Enter（`data-autospark-action` 交互件通道，点击不转发焦点）。

**样式基线继承**：开态底色 `--asc-field-tone`（status 联动）、关态中性（`--auto-color` 派生淡灰）；轨道 em 基准随 `data-size`；三级回退链 + 暗色兜底（滑块白色恒定设计）；`--asc-switch-*` 覆盖通道。

**复用说明**：继承 `autospark.base-field`（产物内嵌注册；hidden 载体挂 `data-autospark-control` 承接骨架 disabled 同步）；零机制依赖。

P0 的 input（携 BaseField）为重件，独立 ADR（ADR-0018 决策 8），不入本合批。

## 备选方案

- **每件一 ADR**：否决——纯样式件决策面薄（样式基线继承 + API 罗列），逐件开 ADR 文档噪声大于信息量（ADR-0018 决策 8 已裁）。
- **P0 全部 12 件一个 ADR**：否决——input+BaseField 是重件含机制决策，与轻件混装稀释两端的记录精度。
- **text 设自有 size 字号属性**：否决——与主题 `data-size` 档位通道双轨（同一维度两个入口），违反「theme 档位全跟随」基线；字号档位统一走主题通道（button 同范式）。
- **link 不做 precompile 变换（仅值形态写法）**：否决——`<x-link>` 经引擎元素名通道化身复用 HTMLUnknownElement 宿主，a 原生导航语义全丢（button ADR-0133 同款家族教训），官方组件库开箱即用定位不可接受静默降级。
- **divider 垂直态支持竖排文字**：否决——antd 5 同边界（垂直分割线纯分隔），竖排文字场景低频且 writing-mode 布局成本高，需求出现时按 ADR-0018 决策 1 增补通道升格。

## 后果

- 本 ADR 成为 P0 轻件的合批载体，九件余件按落地节奏追加第 4 节列表中的对应小节（编号顺延），不另开 ADR；重件（input+BaseField）走独立 ADR。
- 「有原生语义损失的根标签才做 precompile 变换」成为后续组件的判据（link 先例）；三件的全局约定继承（i18n / router 隔离 / 排除域 / button 范式样式基线）以 ADR-0018 决策 6 为准，不在本 ADR 重复展开。
- text 的 ellipsis 溢出提示为纯静态检测（不引入 ResizeObserver），插槽内容后续变化不重查为已知温和妥协（button 范式同款边界）。
- 实施中固化的两条引擎行为约定（后续组件照此规避，根治在 engine 侧另行跟进）：
  1. **`:class` 简写与静态 `class` 同元素共存时不生效**（表达式/字面量/纯路径均然；无静态 class 共存或 `x-class` 指令通道正常）——组件模板内的动态类切换一律用 `x-class` 指令（text 的 ellipsis 类切换先例）。
  2. **值对象内的字面量对象/数组 props 触发无限更新**（`_propsEqual` 引用比较死循环，修复在途的 engine 已知缺陷）——对象/数组 props 一律经**状态引用**注入（button tags / text copyable / link icon 同款规避），文档各组件 API 节统一披露此提示。
