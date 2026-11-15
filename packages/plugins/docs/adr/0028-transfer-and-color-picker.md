# ADR-0028: 穿梭框 transfer 与颜色选择器 color-picker——P3 重件对

- 状态：已接受（Accepted，2026-11-13）
- 日期：2026-11-13
- 关联：ADR-0018（组件库路线图——form/P3 批与决策 2 复用素材权威表的上位依据）、ADR-0020（input 与 BaseField——值桥协议与骨架消费契约）、ADR-0022（select——弹层面板范式与本件直接参照）、ADR-0023（table——x-for 行内 checkbox 组合先例）、ADR-0019/0021/0024（P0/P1/P2 合批——引擎边界规避清单）、ADR-0012（button 范式——样式基线）、ADR-0129（主题三级回退链）、ADR-0134（autospark.base 继承）、ADR-0117（元素名组件形态——demo/文档示例统一写法）

## 背景

transfer（穿梭框）与 color-picker（颜色选择器）是 P3 重件深水区的两枚 form 域组件（ADR-0018 决策 5），路线图复用素材列点名：transfer 装配 checkbox/button/list，color-picker 面板自绘 + x-popover 呈现。两件合批一 ADR（决策 8「重件每件一 ADR」的变通——两件共享「组合既有件 vs 复制结构」与「面板范式继承」两组决策面，独立成文将大量重复引用 ADR-0022/0023 既定结论）。

## 决策

### 决策 1：transfer 列表区复制 list 结构（不自嵌 autospark.list）

穿梭框双列表的视觉基线与 list 同源（边框/圆角/行距/hover，用户硬性要求），但**结构复制而非嵌套消费**——input-number 选复制、message-box 选组合的两先例之间，本件取复制，理由：

1. **结构不同构**：transfer 列表 = 头部（全选 checkbox + 标题）+ 过滤框 + 滚动体（checkbox 行）+ 底部计数四段；list 是单段行容器（无头部/尾部插槽协议）。嵌套消费须把 checkbox 行经 row 作用域插槽注入——插槽内容在调用方作用域求值，而 transfer 的行交互（选中集写回）是组件内部语义，跨作用域接线自找麻烦；
2. **状态通道不同**：transfer 行数据是组件内部派生态（sourceView/targetView 随 value/filter 重算），list 的 items 是调用方状态引用直通——嵌套要把内部态再包成 props 注入，多一层且引入值对象 props 死环面；
3. **视觉同源经 CSS 变量达成**：复制的是结构样式（边框 `--auto-border-*`、行距 em 基准、hover 反馈），不是拷贝字面值——主题在场两件自动同色系，不存在漂移。

### 决策 2：transfer 复选项组合 autospark.checkbox（table 先例直承）

行复选与头部全选经 `x-component:autospark.checkbox` 值对象形态组合（ADR-0023 行选择同款）：`checked` props 绑定 `pickedKeys.includes(item.key)`（**整体替换驱动全行重求值**），交互回传走 checkbox 宿主 `@change="togglePick(item.key)"` 事件通道（绑定表达式不含组件 methods——事件通道可用，家族纪律）。头部全选额外消费 `indeterminate` props（半选横线）。本产物以副作用导入**内嵌 checkbox 注册**（checkbox 是硬依赖非可选，对照 table 的可选依赖不内嵌）——继承链 transfer → autospark.base（经 checkbox 链附带 base-field 注册，transfer 自身不继承 base-field）。

- **transfer 不继承 base-field**：穿梭框是复合控件（非盒饰单控件——无焦点环/状态色语义面），继承 autospark.base 仅取主题档位（table 同款立场）；disabled 自持（宿主 data-disabled 反射 + checkbox props 通道下发 + 载体出表）。

### 决策 3：transfer 值桥——数组语域（el.value 桥 + hidden 载体逗号拼接）

- **宿主 `el.value` 劫持为数组语域**（目标侧 key 数组，非字符串化——x-model 无修饰符写回管道原样透传数组，select 标量语域对照）；getter 返回 data.value 引用、setter 归一数组（非数组包裹/清空防御）；
- **value 顺序恒为 data 声明序**（canonical）：任何穿梭后按 data 过滤重建数组——值序可预测，防两侧往返后乱序；
- **表单提交**：hidden 载体 value = key 逗号拼接字符串、name 透传（双通道：元素名形态 `name` 折叠为 props / 值对象形态宿主属性直读，props 优先）、禁用出表；
- **change detail = { value }**：value 为目标侧 key 数组；input 非冒泡（x-model 通道）双派发同款。
- 字符串归一比较（`String(k)`，select 同款）：key 数值/字符串互认。

### 决策 4：transfer 交互面——选中集单集制 + 全选按过滤视图

- **单一 pickedKeys 选中集**（跨两侧共用——同一 key 任一时刻只在一侧，无需分侧两集）；穿梭后仅清移动侧选中（目标侧选中保留）；
- **头部全选作用于当前过滤视图**的可用项（disabled 项跳过）：全选/半选态由「视图内已选/可选项数」派生（JS 通道维护 sourceAll/sourceHalf/targetAll/targetHalf 四态）；
- **按钮态与选中集联动**（用户硬性要求）：canRight/canLeft 由「选中集 ∩ 对应侧（非过滤视图——跨过滤维度的选中仍可穿梭）」派生，`:disabled` 绑定驱动（carousel 先例）；穿梭钮自绘（原生 button + 内嵌 chevron SVG，button 同档视觉——组合 autospark.button 须为其绑定态再接线 props，两枚小组件收益为负）；
- **filterable 本地搜索**：每侧独立过滤框（裸 input 复制，input-number 复制先例），label 不区分大小写包含匹配；过滤词不清选中集（antd 同款语义）。

### 决策 5：color-picker 面板自绘 HSV（零第三方库，路线图张力已裁定）

ADR-0018 决策 4 排除域张力由路线图预先裁定：**不引任何取色三方库**，HSV 模型自实现（标准 RGB↔HSV 公式，约 40 行）。技术形态：

- **SV 面板 = div 双层 CSS 渐变**（底色 hueColor + 白→透明横向 + 黑→透明纵向叠加），不用 canvas（canvas 须 JS 重绘与 DPR 适配，div 渐变纯 CSS 且响应式）；thumb 经百分比 `:style` 绑定（s/1-v）；
- **H 条 = CSS 七色渐变条**，thumb 同款百分比绑定（h/360）；
- **SVG 规避**（ADR-0021 后果 1：SVG 子树指令属性不编译）：全部 JS 通道（拖拽监听在 mounted/面板自有 methods）+ CSS 渐变，产物零 SVG 节点。

### 决策 6：color-picker 面板呈现与通信全承 select 范式（ADR-0022）

- **x-popover 机制复用**（trigger:click + bottom-start + padding:0 + closeable:false）：面板注册名连字符形态 `autospark-color-panel`（overlay 家族点号候选回溯缺口未修，ADR-0022 决策 1 同款绕行）；面板**固定宽度**（无 fit、无 uid 配对测宽——与 select 的宽度匹配分叉点）；
- **scope 链通信**（open + dataContext:host 聚合视图）：读通道链读触发器域（h/s/v/hueColor/liveHex/presets/disabled）；写通道三类——**拖拽直写 h/s/v**（拖拽值连续变化无同值去重面，对照 select 的哨兵键——哨兵仅用于自增语义的离散交互）、**离散交互哨兵键**（pickTick/pickValue 预设点击、applyTick/applyHex hex 应用、commitTick 拖拽结束提交）、**开合态**（面板 mounted/unmounted 沿链写 open）；
- **拖拽交互**：pointerdown 在面板元素上 setPointerCapture（缺席环境降级为元素直挂监听——happy-dom 直派事件仍达）+ pointermove 连续写 s/v（或 h）+ pointerup 写 commitTick 触发器提交（input/change 双派发）；拖拽过程只改 h/s/v/liveHex（视觉实时），**提交（派发）恒在 pointerup**——拖拽不刷 change 事件流。

### 决策 7：color-picker 值域与值桥

- **值域 "#rrggbb" 六位小写 hex**（内部 HSV 转换，提交面恒归一形态）；归一器接受 #rgb/#rrggbb/无 # 前缀/大小写，**非法与空值归一 #000000**（不支持空值态——缺省黑，文档声明；空值态的棋盘格占位/首次提交语义留 P4 观察）；
- **双真相防环**：value（提交值）与 h/s/v（编辑值）两域，liveHex/hueColor 为派生态（JS 通道维护——绑定表达式不能调组件 methods）；watch("value") 以 `hsvToHex(h,s,v) === norm` 幂等守卫防自写回环（HSV→RGB 整数化往返精确）；
- 值桥对齐 ADR-0020：el.value 劫持（hex 字符串语域）+ hidden 载体 + input/change 双派发 + 快照序（x-model expando > props.value）；触发器 BaseField 盒饰（`.asc-field-box`，select 同款 chrome）+ 色块预览；status 经 base-field 骨架通道（用户硬性要求）。
- **presets 状态引用注入**（可选；字面量数组有 props 死环面，options 同款提示）；预设点击应用 + `data-active` 高亮，**不关面板**（连续试色语义，antd 同款）。

### 决策 8：样式基线（ADR-0018 决策 6 继承）与 i18n

- transfer：列表盒/行距/边框与 list 同源（`--auto-border-*`/`--auto-bgcolor`/em 基准）；穿梭钮与 button 同档（`--auto-primary-color` tone/圆角/hover 反馈强度）；字号档位经 data-size 全跟随（em 基准）；
- color-picker：盒饰/面板与 select 同款（`.asc-field-box` chrome + 面板 `--asc-select-*` 同结构的 `--asc-color-picker-*` 覆盖通道）；预设色板网格 + hex 输入行裸 input；
- i18n 三键：`transfer.search`（回退「请输入搜索内容」）、`transfer.total`（计数文案后缀，回退「项」）、`transfer.empty`（回退「暂无数据」）——color-picker 面板无内置文案（色值与控件自释）；三级回退链全量 + 暗色兜底变体成对写（ADR-0129）。

## 备选方案

- **transfer 嵌套消费 autospark.list（组合路线）**：否决——见决策 1（结构不同构/状态通道不同/CSS 变量已达成视觉同源）。
- **transfer 分侧双选中集**：否决——key 任一时刻只在一侧，单集 + 侧交集判定更简且语义等价。
- **transfer 组合 autospark.button 穿梭钮**：否决——两枚小组件的禁用联动须 props 接线，自绘原生 button 同档视觉更薄（决策 4）。
- **transfer 值桥字符串语域（逗号拼接）**：否决——x-model 无修饰符透传原值，数组语域 state 侧免拆装；字符串化留给 hidden 载体（表单提交域本就是字符串）。
- **color-picker canvas 绘制 SV 面板**：否决——JS 重绘 + DPR 适配 + resize 监听全套成本，CSS 渐变零成本达成同视觉（决策 5）。
- **color-picker 拖拽也走哨兵键（svTick + 坐标载荷）**：否决——连续值每步互异无同值去重面，直写 h/s/v 更短；哨兵留给离散交互（自增语义必要处）。
- **color-picker 拖拽过程逐帧派发 change**：否决——事件流刷屏且与 input/change 双通道语义冲突（input=x-model 连续、change=确认）；提交恒在 pointerup。
- **color-picker 支持空值态（未选色）**：否决——棋盘格占位/首次提交语义是独立交互面，P3 简实现归一 #000000（决策 7）。
- **颜色命名值/rgba 支持**：否决——超出路线图「HEX/RGB 输入，按简实现：H 条 + SV 面板 + hex 输入起步」授权面。

## 后果

- transfer 交付：注册名 `autospark.transfer`（元素名形态 `<x-transfer>`）；产物 `autospark.transfer.js`（内嵌 checkbox + base-field 注册；**无跨产物运行时依赖**——聚合/单独引入均即用）；测试 `src/__tests__/components/form/transfer-plugin.test.ts`。
- color-picker 交付：注册名 `autospark.color-picker`（元素名 `<x-color-picker>`）+ 内部面板 `autospark-color-panel`（无文档页投影）；产物 `autospark.color-picker.js`（内嵌 base-field 注册；**面板呈现跨插件依赖 `autospark.overlay.js`**——x-popover 指令，select 同款声明）；测试 `src/__tests__/components/form/color-picker-plugin.test.ts`。
- demo/文档示例统一**元素名组件写法**（ADR-0117，2026-11-13 用户新规范）：`<x-transfer :data="items">` / `<x-color-picker :presets="palette">`——静态属性直写（布尔显式 `"true"`/`"false"`、JSON 数组直写）、绑定走 `:属性`；值对象形态仅在写法对比处保留示例。
- 本对实证的引擎边界沿用（不新增规避）：值对象字面量数组 props 死环（options/presets 提示）、x-for 宿主绑定不编译（行模板一律 template 形态内层绑定）、绑定表达式不含组件 methods（派生态经 JS 通道维护键承载）。
- 遗留清单：
  1. transfer 无 virtual 长列表分支（万级 data 场景待需——x-for.virtual 接入面已由 table/list 验证，增量时另订）；
  2. color-picker 无 RGB 输入通道/透明度（alpha）——路线图简实现授权面内的裁剪，P4 按需；
  3. color-picker 面板内无键盘导航（H/SV 方向键微调）——触发器 Enter/Space 开面板已可达，键盘调色待 a11y 增量批；
  4. transfer 行拖拽排序（sortable）未做——非路线图面。
