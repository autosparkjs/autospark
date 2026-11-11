# ADR-0014: autospark.button-group 按钮组——融合布局、缺省下发、x-model 单选选中模式

- 状态：已接受（Accepted，2026-11-09）
- 日期：2026-11-09
- 关联：ADR-0012（button API 重设计——组值桥 / 受控半双工 / base 继承的消费范式）、ADR-0003（插件形态）、ADR-0111（插件全局组件表注册）、ADR-0094（autospark. 点前缀命名空间）、ADR-0134（autospark.base 抽象基组件）

## 背景

现役 button（ADR-0012）是独立钮，多钮成排（分段选择器 / 工具栏）缺容器组织能力。需求：间距可调或融合一体、组级外观统一下发、可选的单选选中（表单联动 + 内嵌隐藏 input）。经 grilling 十四问逐项收敛（命名 / 单选语义 / 激活条件 / 子钮值机制 / gap 融合 / 方向属性 / 下发语义七项核心分叉 + 七项细节钉子）。

## 决策

### 决策 1：命名与落位——kebab 注册名 + 元素名 precompile 变换

- 注册名 **`autospark.button-group`**：camelCase 不可行——注册名走 `x-component:名称` 的**属性名位置**，DOM 对属性名全量小写化，`buttonGroup` 注册后实际查询 `autospark.buttongroup` 永不匹配。
- 目录 `src/components/button-group/`（index.ts + button-group.html 自包含）；IIFE 产物 `autospark.button-group.js`（vite config 增入口 + 聚合入口 import）。
- 元素名快速写法 `<x-button-group>` 经 precompile DOM 变换为根元素 + `x-component:autospark.button-group` 值形态（button 范式移植：静态属性折叠 props 字面量 + 类型推断、`:attr` 表达式转发、class/style/id/name/title/data-*/x-*/@ 保留宿主、子内容随迁默认插槽）。
- **组 transform 须先于 button 执行**（缺省下发与 data-value stamp 都必须在 button 折叠 props 之前落属性）——聚合入口 import 顺序：button-group 在 button 前。单产物加载顺序同理（`autospark.button-group.js` 需与 `autospark.button.js` 同页，子钮渲染依赖后者）。

### 决策 2：融合与 gap——无 gap 即融合，不设独立开关

- `gap: number | string = 0` 双形态（number 按 px、字符串原样作 CSS `gap` 值，对齐 `indent` 惯例）。
- **gap=0（缺省）= 融合**：相邻子钮相邻侧圆角清除 + 边线单线复用，整组呈一体分段胶囊；gap>0 各子钮独立圆角独立边线。融合触发即「无 gap」，不另设融合开关。
- `vertical: boolean = false` 垂直组合（拒绝 direction/orientation 枚举——两值轴布尔与 block/disabled 布尔惯例一致）；垂直下融合轴自动换为上下圆角 / 上下边线。
- `shape=circle` 子钮不豁免（圆钮入融合组会被切角）——不特调，文档注记劝退。

### 决策 3：缺省下发——子钮未显式声明才继承（声明式继承）

组级 `variant` / `type` / `disabled` 三键下发：

- **优先级：子钮显式声明恒优先，组只填充未声明者**（类 CSS 继承，留单钮差异化逃生通道——一组 danger 里放一个 text 钮是真实诉求）。antd 式「组强制覆盖」被否决：attr-stamp 机制下子钮将无法表达「不要组的值」。
- 机制为 precompile attr-stamp：组 transform 遍历子钮 `x-button`，把组级属性 stamp 到**未显式声明该属性**的子钮上——静态值原样、绑定表达式（`:variant="mode"`）原样转发为子钮 `:variant="mode"`（button 变换折叠进 props 后在子钮处响应式求值，同 scope 同路径，语义一致）。
- 不做组级 size 下发（button 无组件级 size，theme 档位全局跟随，ADR-0012 决策 2）；等高视觉由融合 CSS 天然保证，颜色一致由下发或子钮声明保证。
- 组样式表**不复制** button 的 5×5 形态×语义色矩阵来做 CSS 级下发（维护双份矩阵，否决）。

### 决策 4：选中模式——x-model 在场即激活，单选不反选

- **激活条件 = x-model 在场**（用户原话语义）。无 x-model 为纯布局组（工具栏用法：确定/取消/帮助各干各的，无选中态、无 hidden input、无排他协调）。
- 单选（segmented control）：点击子钮 → 组值 = 该钮 value；**点击已选钮不反选**（radio 语义）。
- **初始值不匹配任何子钮 value（或为空）→ 全不选**：state 是唯一真相源，不猜首钮（antd Segmented 默认选首项只适合非受控组件）。
- 组值恒字符串（子钮 value 本是字符串属性，`value="7"` → 组值 `"7"`）；要数字配 `x-model.number`。
- 多选 / `multiple` 双模式否决（YAGNI）：多选是 checkbox 组场景，由多个 checkable button 自行组合承担（button 已有完整 checkable 能力）。非受控选中（`selectable` 独立开关）不立项。

### 决策 5：子钮值——静态 value 先行 stamp 为 data-value

选中模式需要组运行时读到每个子钮的身份值，但 `<x-button value="day">` 经 button 变换后 value 折叠进 `x-component` 值对象字面量，**DOM 上无痕**。机制：

- 组 precompile transform（先于 button）遍历子钮，把静态 `value` 属性落一份为 `data-value`——`data-*` 在 button 变换的保留清单内，存活到运行时供组 JS 读取。
- v1 仅静态值：响应式 `:value` 子钮值不支持（`:data-value` 会被 button 变换按 `:` 前缀折叠为 prop `dataValue`，非保留通道；分段选择器的值天然静态，YAGNI）。
- 备选否决：复用子钮 checkable + 组只做排他（用户每钮三属性写法冗长，组仍读不到值）；组 JS 运行时解析子钮 `x-component:autospark.button` 属性字面量（脆弱）。

### 决策 6：组值桥——checkable 桥范式移植（el.value 劫持 + 隐藏 input + 双事件）

ADR-0012 决策 3 已验证的家族模式原样移植到组根（engine 无组件双向协议，text 分型无元素守卫——div 根同样适用）：

- 组根 `defineProperty` 劫持 `el.value`（**字符串语域**，区别于 button checkable 桥的布尔语域——组值是子钮 value 字符串）。
- x-model 在场 → 组根内嵌 `input[type=hidden]`（`display:none`），`name` 有则透传、`value = String(选中值)`——表单提交载体（即需求原文「此时内部嵌入隐藏 input」）。
- 点击子钮：写 el.value → 派发 `input`（x-model 回写，bubbles:false）+ 冒泡 `change`（`detail = { value }`）。
- **受控半双工**：`value` prop 单向驱动视觉（组值变化 → 选中标记迁移）；翻转靠点击 + 外层一行 `@change="v = $event.detail.value"`（封闭域纪律内，同 button 惯用法）。

### 决策 7：选中视觉——组自有 class，与子钮 checkable 零冲突

- 选中子钮挂**组自有 class**（不碰子钮 `asc-checked`——那是 checkable 的通道）；选中视觉 = tone 实底反白（solid 语义），组样式表内高特异性选择器命中、tone 取子钮作用域已算好的 `--asc-tone`（组级 type 下发后语义色正确）。
- **选中模式下子钮禁用 `checkable`**（两套勾选机制语义冲突，文档约束不特调，违反者自负）。
- 选中态视觉推荐 default/text 变体子钮（primary 实底钮选中不显——文档注记）。

### 决策 8：杂项钉子

- `block: boolean = false` 只撑容器占满父宽，**不强制子钮等分**（等分需求使用者自行 CSS / 子钮 :style）。
- 组继承 `autospark.base` 六键（组根物化 `data-size` 等级联整组——正好承担「一组统一档位」通道；组自身无盒视觉但作主题容器有效）。
- `gap` / `vertical` / `block` / 下发三键 / `value` 均支持响应式绑定（props 通道天然响应）。

## 备选方案

- **多选 / `multiple` 双模式**：否决——按钮组主场景是分段选择器，多选由多个 checkable button 组合承担；双模式 API 与 CSS 翻倍（YAGNI）。
- **`selectable` 独立开关（非受控选中）**：否决——需求原文即 x-model 驱动；纯布局组不该被强加选中行为。日后有需求再加，不预支。
- **复用子钮 checkable + 组排他协调**：否决——用户每钮 `checkable` + `check-values` 写法冗长，且组仍需读各钮值（同一 data-value 问题）。
- **组 JS 解析子钮 x-component 属性字面量读值**：否决——耦合 button 的 props 折叠格式，脆弱。
- **antd 式组强制覆盖下发**：否决——堵死单钮差异化；attr-stamp 天然表达「缺省下发」，显式优先是唯一可表达「退出继承」的方向。
- **CSS 复制 5×5 variant 矩阵做组级下发**：否决——button 样式矩阵维护双份，改一处漏一处。
- **缺省选中首钮**：否决——受控语义下 state 是唯一真相源，猜首钮制造视图与 state 不一致的幽灵态。
- **direction/orientation 枚举轴**：否决——两值轴布尔足够（KISS），与既有布尔 props 惯例一致。

## 后果

- 无破坏性（新组件首发）。
- **聚合入口 import 顺序成为契约**：button-group 必须先于 button import（precompile 注册顺序 = 执行顺序）；日后新增「组-成员」类组件同例。
- **跨插件耦合点两处**：① button 变换的属性保留清单（`data-*` 保留）是 data-value stamp 通道契约，button 侧改保留清单须同步本组件；② 组识别子钮依赖 button 的元素名 `x-button`。
- 组内 x-for 动态生成的子钮：precompile 在模板 DOM 上 stamp，克隆体天然携带（下发 / data-value 均覆盖）；运行时动态插入的非模板子钮不享受 stamp（文档边界注记）。
- 选中协调为组 JS 查询 DOM 子钮（mounted 一跳后首查 + 点击时现读），不做子钮增删监听——x-for 子钮变化后选中标记迁移由 `value` prop 受控通道驱动（watch 重排），静态工具栏组无选中态不涉及。
- **引擎侧配套修复两处（实施期发现，均为引擎既有缺陷被本组件的正当用法暴露）**：
  1. **插槽查找边界穿透**（`compiler.ts` instantiateComponent / instantiateDetachedComponent 两处）：stash 原为「有内容才写」——插槽内容里实例化自带 default 出口的组件（button 模板即如此）时，其出口沿 parent 链穿透吃到外层收集它进来的 slotContents map，把自身宿主克隆投影进自己的出口 → 无限递归实例化 + 微任务饿死。修复：恒写 map（空 map 即组件实例边界），回归测试 `engine/src/__tests__/directives/x-slot-boundary.test.ts`。
  2. **化身内容 scope 的组件 data 视图断链**（`scope.ts` hasLocalContext）：T4=B 宿主化身下插槽内容 scope 同时是组件实例 scope（组件 `_data` 注入其上），但 hasLocalContext 的插槽特例只查 `locals` 跳过 `_data`——模板内简单路径（`:data-type="type"`）误判无局部走 `store.state` 直读，组件 data 被绕过（props 全部静默失效）。修复：isSlotContent 分支补查 `_data`。
- 组 mounted 的选中协调激活条件为「x-model 在场 **或** 显式受控 value」（决策 6 半双工的完整形态——纯布局组两者皆无才不激活）；el.value 劫持桥与隐藏 input 仅 modelBound 场景。
