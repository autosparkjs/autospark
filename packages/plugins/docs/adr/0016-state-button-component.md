# ADR-0016: autospark.state-button 状态按钮——button 取消 checkable、继承骨架 + 机制自治

- 状态：已接受（Accepted，2026-11-10）
- 日期：2026-11-10
- 关联：ADR-0012（button checkable 桥与 checkStyle——本组件的直接前身，checkable 面随本决策整体移除）、ADR-0014（button-group——「选中模式」与本组件正交）、engine ADR-0081/0134（组件继承机制——架构的事实基础）

> **修订记**（同日 grilling 八轮收敛，架构经历一次翻转）：初版定「机制驻父泛化」（button 保留 checkable 二元速记、state-button 薄壳继承）；后续修订链——`checkStyle` 取消 → 移入 states 项键 `decorate` → **button 整体取消 checkable 特性**——逐步掏空「机制驻父」的存在理由（父不再消费机制），终态翻转为**继承骨架 + 机制自治**。事件模型同链修订：受控目标态 detail → 原生 click + dataset 反射；states 缺省组与 value 缺省两度反转后定稿。
>
> **2026-11-11 修订**：**x-button-options 泛化为 button props 透传**——状态项可携带 button 全部属性（variant/type/ghost/shape/loading/ripple/...），切态经显式键清单（`BUTTON_PROPS`）整组注入 data（未声明键回退底值快照），每态完全自定义按钮渲染与形态；原白名单视觉键 `color` **废弃**、对齐 button 原名 `type`（迁移动作 `color: 'danger'` → `type: 'danger'`）。theme 档位六键不在注入面（不在 data 域）。**实现约束**：注入键清单必须**显式硬编码**——`Object.keys(this.data)` 枚举出的是挂链根 state 键（含 `$scopes`/`$` 框架保留键），误枚举会把保留键写穿引发连锁回归。

## 背景

button 的 checkable（ADR-0012 决策 3 受控半双工 + 化身 checkbox 桥）为**二元专用**；需求扩张至 2-N 态循环切换。grilling 收敛期间查证两条关键事实：① 继承机制（engine ADR-0081/0134）——父快照深克隆、子只能替换出口 fallback、setup 浅合并子胜、hooks 父先子后串接，**子无法在父模板注入静态绑定**；② DOM 属性名全量小写化——camelCase 注册名永不匹配（button-group 同款教训）。

## 决策

### 决策 1：button 取消 checkable 特性（破坏性）；state-button 继承骨架 + 机制自治

- **button 删尽 checkable 面**：`checkable/checkValues/checkStyle/value` 四 props、mounted 桥（hidden input / `el.value` 劫持 / 翻转 click）、body 的 `:data-checked`/`:data-check-style` 绑定、`.asc-button-check` 占位 span、勾选 CSS（`.asc-checked`/`.asc-check-*` 族）——回归**纯按钮单一职责**。迁移动作：`checkable: true` → `<x-state-button>`（零配置即等价 check 按钮）。
- **state-button 经 `x-define:inherit="autospark.button"` 复用骨架**（快照克隆 = 纯按钮视觉全套，模板/CSS 骨架单份），**状态机制全套自持**：桥与翻转在子 mounted 自建（父已无逻辑可冲突，hooks 串接天然安全）、装饰渲染走**宿主 class 通道 + 子自己的 CSS**（不依赖父模板 `:has` 属性绑定——事实①的「子无法注入绑定」死锁被 class/JS 通道绕开）、dataset 反射经子 mounted watch 同步。
- 否决初版「机制驻父泛化」：其存在前提（父保留二元速记）被修订链推翻；机制自治反而单一职责干净。
- button tags 的 **tag 级 checkable 保留**（tags 子钮勾选是独立轴功能，与宿主机制无关）。

### 决策 2：states 双形态归一化 + x-button-options（button props 透传）+ decorate 项键

`states: x-button-options[] | (number|string)[]`——标量 `x` → `{value: x}` 简写；对象缺 `value` 回退**数组下标**。**x-button-options（即 `<x-button>` 的选项集）= button props 全集 + 状态机制键**（2026-11-11 泛化）：button props 键（variant/type/ghost/border/shape/wrap/loading/disabled/icon/label/memo/ripple/align/indent/menu/tags）切态经显式清单整组注入 data、未声明键回退底值——每态完全自定义按钮渲染与形态（原白名单 `color` 键废弃、对齐 button 原名 `type`）。`decorate?: solid | icon | corner | ripple` = **该状态的额外装饰**（每态属性，N 态任意佩戴——取代原组件级 checkStyle）：solid = tone 实底反白字（消费 `--asc-tone`，与 `type` 键协作）；icon = 最左 1.2em yes 占位；corner = 右上角越界打勾三角（不占布局）；ripple = 最左 CSS 自绘涟漪动画占位。**icon/ripple 为占位型**——佩戴即显、不佩戴即隐，组内不统一佩戴有布局跳动，文档建议统一佩戴（缺省组仅 corner 无此问题）。corner 按压预览对齐**目标态判定**（按压时若下一态佩戴 corner 则预显描边）。

### 决策 3：缺省组与初值——零配置即 check 按钮

**states 缺省组 `[{value:false},{value:true,decorate:'corner'}]`**（假值在前）+ `value` 缺省 = **`states[0].value`**（初始态即首态，统一规则 N>2 同规——状态机直觉）。零配置的 `<x-state-button>` 即传统双态 check 按钮（false 无装饰、true 角标打勾；点击 false→true→false 循环正确）。勾选视觉按 **decorate 佩戴态判定**（位置无关）。

### 决策 4：切换语义——循环 next + 四重判定链

- 命中点击：`states[i] → states[(i+1) % N]`（尾态回卷）；无匹配 → `states[0]`。
- 生效条件：`autoswitch !== false && 当前态 clickable !== false && !disabled && !loading`；无匹配态恒可点（仍受三锁管）。

### 决策 5：事件模型——change + 原生 click + dataset 反射（不引入自定义 click）

- **原生 click 不可携带组件数据**（`MouseEvent.detail` 是点击计数、原型只读 getter；强 `defineProperty` 改写破坏原生语义）——组件**不派发**同名自定义事件（双触发不可接受）。
- state 数据通道 = **宿主常驻 dataset 反射**：`data-value` 反射当前值（标量 `String`、对象 `JSON.stringify`；button-group「子钮值」同款家族模式）——外层 `@click="v = $event.currentTarget.dataset.value"` 一行读取（内层命中场景 `target.closest`）。
- `change` 仅**切换实际发生后**派发（冒泡，`detail = {value, index, state}` 新态三元组）。
- 两模式：`autoswitch=true`（缺省）→ 切态 + `change` + 原生 click；`false` → 仅原生 click（不切不发 change——受控交互 = `@click` + dataset 读当前值，next 目标态按自有 states 计算）。

### 决策 6：autoswitch 与 clickable（两把行为锁，均不绑视觉）

- `autoswitch: false` = 纯受控（决策 5）；视觉不特调（暗示由使用者经 states 项自表达）。
- `clickable: false`（项键，缺省 true）= 该态**出边锁**：处于该态时点击零效果（不切换不派发；需点击信号走原生 click）。锁定从该态出发的切换，非「点击跳过锁定态」（外部 value 改走后循环照常）。

### 决策 7：灰色无匹配态（asc-unmatched）

value 不在 states 值域内 → **专属灰色渲染态**：统一中性灰**覆盖** variant/type（元语义不属任何形态/语义色）；icon/label/memo/tags 照常显示仅灰化；`cursor:pointer` + hover 轻反馈（**与 disabled 的 opacity 0.55 + not-allowed 明确分野——可点击是硬需求**）。触发场景：显式域外 value、states 运行时替换后无匹配（value 是受控真相不被擅改）。实现：宿主 class（子 mounted toggle）+ 子 CSS。**缺省不落此态**（value 缺省 = `states[0].value`）。

### 决策 8：states 项注入通道（仅当前态生效）

**button props 透传**（2026-11-11 泛化）：显式键清单（`BUTTON_PROPS`，与 button data 键面一一对应）整组注入——variant/type/ghost/shape/loading/ripple 等全键面随态切换，未声明键回退底值快照（init 时按清单读取）；theme 档位六键不在 data 域、不参与注入（档位不随态切换）。机制键：`style` = cssText 字符串（宿主原样式为基底整写，对齐 tags.styles 通道）；`class` 附加化身根（切态摘旧加新）；`tooltip` 双轨 title/data-tooltip。**优先级：宿主显式 title/data-tooltip > 当前态 tooltip > 溢出/labelPos none 自动提示**（切态摘旧挂新）。未匹配时全部不生效（回退底值）。`label` 经 data 键 + **span 直写双通道**（displayLabel computed 对后续赋值不重算，见实施注记；插槽仍优先——fallback 特征探测）。

### 决策 9：表单桥分叉与 x-model 值域口径

- **≤2 态**：内嵌 `input[type=checkbox]` + `el.value` 布尔语域劫持（配 `x-model.boolean` 保真）；**按值匹配非位置匹配**（缺省组顺序反转无影响）；未勾选不提交、提交值 `String(勾选态 value)`。
- **N>2**：内嵌 `input[type=hidden]`，`value = String(当前值)`（对象 `JSON.stringify`）、恒随表单提交、`name` 透传宿主——`<x-state-button name="mode">` 天然表单控件。
- **N>2 受控通道 = `@change`**；x-model 仅二元推荐（text 分型字符串化固有——`1` → `"1"` 后 `!==` 死锁，自担组合，ADR-0012 备选方案已论证 engine 层无解）。

### 决策 10：边缘语义

- **无效状态集**（归一化后 length < 2）：静默退化为不可切态（恒无匹配灰、点击无状态效果、hidden input 挂着不切）——不 warn 不拒绝（IIFE 无 dev/prod 分档）。
- states 运行时替换：value 不在新值域 → 保持无匹配回灰（不重置、不擅改）。

### 决策 11：命名三件套与产物依赖

- 注册名 **`autospark.state-button`**（kebab 免疫 DOM 小写化）；元素名 `<x-state-button>`（precompile DOM 变换复用 button 范式，公共函数抽 utils——产物级重复内联为 ADR-0003 既有契约）；产物 `autospark.state-button.js`（vite entries 加一条）+ 并入聚合产物。
- **不内联**：文档声明「须先加载 `autospark.button.js`，或直接用聚合产物」（父未找到 warn + 注册失败，ADR-0081 fail-fast）。
- 入 button-group 选中模式时状态切换机制禁用（ADR-0014 两套机制冲突约束）。

## 备选方案

- **机制驻父泛化（初版架构 A）**：否决——修订链（checkStyle 取消 → checkable 取消）使其前提失效；父持无消费者的机制违反单一职责。
- **复制独立（纯 C）**：否决——模板/CSS 全量双份维护；继承骨架已解决复用，机制自治补足差异面。
- **组件派发自定义 `click` 事件**：否决——与原生 click 同名双触发；换名（state-click）又被 dataset 反射覆盖（YAGNI）。
- **原生 click detail 注入**：否决——`MouseEvent.detail` 原型只读且承载点击计数语义，强改是破坏性 hack。
- **value 缺省 undefined（灰首屏）/ states[1].value（第二态）**：均否决——前者与「零配置即 check 按钮」目标相悖，后者对 N>2 无语义；`states[0].value`（首态）统一规则。
- **点击跳过锁定态（入边锁解读）**：否决——clickable 是「处于该态时可否离开」（出边），跳过使循环序不可预测。
- **state-button.js 内联 button（单文件自足）**：否决——体积翻倍换独立性无人付费，依赖一行文档说清。

## 后果

- **破坏性（button）**：`checkable/checkValues/checkStyle/value` 四 props 失效——迁移动作 `checkable: true` → `<x-state-button>`；`checkStyle: 'icon'` → `states: [{value:假值},{value:真值,decorate:'check'}]`（路径引用；2026-11-11 装饰值 icon 更名 check）。button-plugin.test.ts 的 checkable/checkStyle 用例迁往 state-button 测试文件。
- button.html 大幅减重（纯按钮单一职责）；state-button 自持全套状态机制（setup + styles），依赖 button 同页加载。
- button-group「选中模式下子钮禁用 checkable」约束语序更新为「禁用状态切换机制」（checkable 词条已亡）。
- ADR-0012 增补破坏性修订：决策 3（checkable）与 checkStyle 相关段落标记由本 ADR 承接移除。
- 灰色无匹配态是显式域外 value 的观感（缺省不触发）——文档引导「初始态默认首态，域外值灰色可点回域」。

## 实施注记（2026-11-10 落地）

- **继承管线验证**：engine `_resolveGlobalComponent` 对字符串模板的 `x-define:inherit` 原生支持（`_globalDefForInherit` 沿全局表递归懒预编译父 def，ADR-0083）——插件全局表注册的模板继承开箱即用；唯一时序约束是**父组件表项须先注册**（测试/页面先加载 button 插件模块）。
- **字面量数组 props 死环（引擎既有缺陷）**：x-component 值对象含**任何字面量数组**（含标量 `[1,2]` 与空 `[]`）即触发更新环死锁（`_propsEqual` 对数组键引用比较 + 重求值新引用，微任务风暴吞掉宏任务——setTimeout 永不排上，进程挂死无输出）。**states 数组一律路径引用**（`:states="myStates"`），文档警示与 tags 同口径；引擎侧修复在独立分支未合入 HEAD。
- **ripple 装饰指示器降级为 CSS 自绘**：mounted 注入的 DOM 无编译通道（x-icon 是编译期指令），呼吸点 + 扩散环改 keyframes 自绘（视觉对齐内置 ripple 图标动效语言，非 x-icon 同源）。
- x-model 修饰符为单属性写法 `x-model.boolean="flag"`（误写双属性会让空值属性被解析为独立绑定）。
- **`Object.keys(this.data)` 不可枚举组件 props 面**（2026-11-11 泛化实施实证）：mounted 内 `this.data` 是挂链数据视图——**读取**穿透组件域可用，**枚举**（ownKeys）却列出根 state 键（含 `$scopes`/`$` 框架保留键）——按 keys 遍历会把框架保留键写穿，引发跨用例连锁回归（绑定断链、原生 click 冒泡计数失效等怪象）。态注入/底值快照一律走**显式键清单**（`BUTTON_PROPS`，与 button data 键面同步维护）。
