# AutoSpark

声明式模板渲染引擎：通过宿主元素上的 `x-*` / `@*` / `:*` 属性（指令）把 AutoStore 状态绑定到 DOM。本表固化引擎内部的领域语言，配置体系（指令选项 / 宿主选项）术语于 ADR-0007 引入。

## Language

### 指令层

**指令（Directive）**:
宿主元素上一个属性声明的行为单元，由指令类实例承载。名称经 `presetDirectives` 的 key 标识（如 `if`/`for`/`on`/`bind`/`data`），不由类的 `static name` 决定。
_Avoid_: 组件、标签、特性（attribute 仅是其 HTML 载体）

**属性参数（attr）**:
指令名冒号后的从属标识，指明指令作用于哪个具体目标，如 `x-on:click` 的 `click`、`x-bind:title` 的 `title`。
_Avoid_: 参数、子指令

**指令类别（DirectiveKind）**:
区分指令归属哪条执行通道的静态字段——`Compile`（编译期变换树、走 scope 通道）/ `Runtime`（编译器致盲、走 observer 通道）/ `Hybrid`（双通道）。详见 ADR-0001。
_Avoid_: 类型、模式

### 动作层

**动作声明脚本 / Action Script**:
模板内声明动作的 `<script type="autospark/actions">` 通道（ADR-0031 命名空间化）：内容为对象字面量，编译期提取后节点剪枝（不进渲染 DOM）。默认注入**最近祖先 scope.actions**（局部动作，只 DOM 冒泡）；带 `global` 属性则注入 `engine.actions`（全局动作，总线+DOM 双发）。普通 `<script>`（无该 type）不经此通道、原样保留。
_Avoid_: 动作脚本（泛化）、内联动作（易与 x-on 内联表达式混淆）、`type="actions"`（裸值旧写法已废弃）

**动作描述符 / ActionDesc**:
action 的**统一存储与读取形态**：`handle` 是唯一必需保留键（执行体），`name` 由注册键注入；`title` / `icon`（展示型）与 `hide`（行为型，见「hide 约定键」）为文档化约定键，其余自由键原样保留（开放元数据）。函数写法是它的**简写形态**（≡ `{ handle: fn }`），两种写法在任何声明入口可混用；`engine.actions[name]` / `getAction` 恒返回本对象，执行取 `.handle(...)`（引擎内部消费者透明解包，模板侧无感）。详见 ADR-0036 / 0038。
_Avoid_: action 对象（泛化）、action 配置（它是存储形态不是配置）、元数据对象（handle 也是它的一部分）

**hide 约定键（ActionDesc）**:
ActionDesc 的**行为型**文档化约定键（ADR-0038）：声明「触发后是否隐藏所在加载遮罩」，默认 `true`、显式 `false` 关闭，**逐 action 独立**（close 隐藏、retry 续显可并存）；由 x-loading 按钮委托在**点击时现读**（后注册不失效），其他场景不解释。
_Avoid_: autoHide / dismiss（英文别名）、hide 选项（它是 action 的键，不是指令配置）

**合成动作描述符 / Synthetic ActionDesc**:
x-loading 按钮点击遇到**未注册名**时就地合成的透传 descriptor（`{name, title: name, handle: (p) => p}`，与内置信号型同构、指令实例内按名缓存）——让未注册名同样走 buildAction 双通道广播（pending + resolved 同 tick）。逐次点击现查现决，先注册的真 action 优先；仅 x-loading 委托内部生效，不改 x-on「未命中→表达式兜底」。
_Avoid_: 匿名 action / 虚拟 action / 隐式 action（合成的是形态不是身份）、fallback action（与组件兜底撞义）

**动作自引用 / this.action**:
action 执行上下文（AutoSparkActionContext）中指向**自身动作描述符**的活引用：元数据（`this.action.title` 等）可读写但无响应式承诺；`this.action.handle(...)` 递归调用会再次触发完整生命周期广播。详见 ADR-0036。
_Avoid_: `$action`（$ 系是引擎注入特殊物，实体引用无前缀）、`this.meta`（窄化为只见元数据）、动作快照（它是活引用）

**内置动作 / Built-in Actions**:
引擎自动注册的信号型全局 action（`yes` / `no` / `cancel` / `close`）：handle **透传首参**（`close(1)` → resolved 广播 `result:1`），价值在**广播语义**——祖先监听 `action:close` 等 DOM 冒泡事件（`detail.result` 读信号载荷）即可驱动关闭对话框/确认/取消等通用交互。用户同名声明覆盖内置。详见 ADR-0036 决策 7。
_Avoid_: 默认动作（泛化）、系统动作（易与 DOM/浏览器原生事件联想）、公共动作（它们是信号不是共享实现）

### 配置层

**修饰符（Modifier）**:
指令名句点后、**无参数**的开关项，启用某项内置行为。它在解析期被注入为同名**指令选项**（布尔 `true`），故指令层不再单独读取修饰符——修饰符只是指令选项的快捷写法。是否提供某修饰符快捷方式，由指令作者决定。
_Avoid_: 修饰语、flag、参数（修饰符不带值）

**指令选项（Directive Option）**:
由 `x-{name}-options` 声明的**指令级**配置对象，是该指令的权威配置来源（修饰符在解析期并入其中）。值用宽松 JSON（relaxed-json）解析，须为普通对象。
_Avoid_: 参数对象、props

**宿主选项（Host Option）**:
由 `x-options` 声明的**元素级**共享配置对象，挂在宿主元素的 scope 上，供同元素所有指令回退读取。它**不是数据**，不进入表达式数据视图，仅作指令配置。
_Avoid_: 全局选项、元素配置、公共参数

**选项回退（Option Fallback）**:
读取某配置键时的两层查找顺序：先查指令选项，未命中再回退到宿主选项。**不做合并、不做覆盖**——缺失才回退。该顺序贯穿三个出口：基类 `getOption()`、action 侧 `$options` 代理、`OnDirective` 内部分派。
_Avoid_: 合并、级联、继承（回退不是合并）

**`$options` 代理**:
暴露给 `x-on` action 的只读聚合视图，以 `Option Fallback` 顺序虚拟合并指令选项与宿主选项，读取时按需回退、零拷贝。
_Avoid_: options 对象、配置快照

**运行时选项覆盖（Runtime Option Override）**:
指令选项的运行时更新机制：在宿主元素上以覆盖属性 `data-<指令名>-<选项名>`（如 `data-show-animate="fade"`）声明覆盖，经统一分发器在根元素全局监听，变更时把新值写回指令选项（删除属性即还原编译期值，初始值同样生效；值经宽松 JSON 单值解析）。生效时机惰性为默认——新值在下一次消费该选项时可见，需即时的指令自行重放。仅单例指令支持（ADR-0051）；区别于构造期配置纪律（全局组件等 options 的「运行时突变不失效」约定）——覆盖是显式声明的运行时通道，不是构造期突变的追认。详见 ADR-0051。
_Avoid_: 热更新、动态配置、动态指令配置（不表达「覆盖回退链、删除即还原」语义）

**覆盖属性（Override Attribute）**:
`data-<指令名>-<选项名>` 形态的 DOM 属性，运行时选项覆盖的载体（如 `data-loading-delay="300"`）。仅在指令显式声明的选项键上被观察与分发；未声明的 `data-*` 属性一律是普通属性、零观察（含 x-for 占用的 `data-index` / `data-paging`）。可被 `:` 绑定语法驱动，实现状态驱动配置。
_Avoid_: data 配置（泛化）、data 选项（它是属性载体，不是指令选项本体）

**选项策略（Option Policy）**:
指令类对单个选项键声明的运行时处置档位：`runtime`（可覆盖，进 `runtimeOptions`）/ `warn`（真·编译期选项，覆盖属性变更仅告警指回 `x-{name}-options`）/ `restart`（v2 预留：触发指令实例重启、子树按自持模板重建）。三分法的判据是选项的**消费时机**（现读 / 快照-运行时 / 真编译期），不是声明位置。详见 ADR-0051 决策 7。
_Avoid_: 选项类型（与 DirectiveKind 撞词）、编译/运行时二分（三分法，二分已否决）

### 数据声明层

**挂载 / Mount（x-data）**:
x-data 的统一挂载模型：数据总要挂进全局状态树的某个容器，`mount` 指令选项指定挂在哪。三形态：默认（私有域 `$scopes.<id>`）/ 挂根（`.global` ≡ `mount:""`，只挂根不设 `this.data`、不改 scope 行为）/ 挂路径（`mount:'x.y'` merge 进 `state.x.y`，`_data` 指向挂载容器——子树直读 + 全树路径读 + `this.data`/`engine.data` 直写，与默认模式行为同构）。写入恒为 **merge**（他人旧键保留）；中间路径不存在自动创建、断裂（存在但非对象/数组段）降级默认私有域。destroy 键级 CAS 删除 + 容器删空向上回收 + 运行时键（`engine.data` 追加）残留。详见 ADR-0029。
_Avoid_: global 路径化（global 只挂根，承载路径的旧提案已废弃）、挂载点路径（Mount 是机制名，路径是它的值）

**相对挂载语法（Relative Mount）**:
mount 值以 `.` / `..` 开头的形态，段间用 `/` 分隔（与 x-teleport 同构，规避 `..` 与状态路径分隔符 `.` 的字符冲突）：`'./x'` 自身容器下、每级 `'..'` 一个**直接父 scope**（不跳层）、越顶落根；命中的 scope 无 `_data` 则**就地创建空私有域**（含 x-for item scope，数据随 item 生死）。基准切换见 `.nearest`。
_Avoid_: 点分相对路径（`..` 与 `.` 分隔符字符冲突，无法按 splitPath 拆）

**`.nearest` 修饰符（x-data）**:
相对挂载的步进基准开关（≡ `nearest:true`）：每级 `..` 从「直接父 scope」改为「最近的持有 `_data` 的祖先 scope」（跳过 x-if/x-for/x-scope 等占位元素）；`./` 仍指自身容器；上溯无数据祖先落根；配绝对路径静默忽略。「跳层」语义只在此显式 opt-in，不是默认——默认步进的确定性优先。
_Avoid_: 自动跳层（默认语义已被否决，跳层必须显式声明）

**数据脚本 / Data Script**:
`<script type="autospark/data">`：父元素数据域的 **JS 对象字面量声明源**（x-data 的超集，非字面等效）。只作用于**直接父元素**（与 `autospark/actions` 的最近祖先语义有意分歧——数据是结构性的，归属必须一眼确定）；多个数据脚本与 x-data 经 `deepMerge` 深合并（数组替换、undefined 不覆盖、函数整体覆盖），**x-data 最后合并、优先级最高**；`options` 属性承载 mount/global/nearest（父元素 `x-data-options` 权威，冲突忽略 + warn）；求值注入 `computed`/`configurable`/`watch`，**普通函数值是 computed 简写**（方法归 `autospark/actions` / `<script setup>`；watch 是纯副作用声明，引擎注入后强制首读激活）。编译前预扫合成单一数据对象走既有挂载管道（位置无关、每实例独立数据域、回收同权）。详见 ADR-0032。
_Avoid_: 脚本数据（泛化）、x-data 脚本（它是声明源不是指令）、JSON 块（内容是 JS 不是 JSON）

**异步数据源 / Async Data Source（x-data）**:
**异步源家族**的 x-data 物种（家族骨架：url / action 形态判定、编译期首取、插值/实参依赖变化自动重取、请求序号竞态丢弃、destroy 中止——两物种共用同一执行器 `AsyncSourceRunner`）。x-data 侧：值以 `/`、`//`、`http(s)://`、`./`、`../` 开头经 fetch 取数、`标识符(实参?)` 执行 action 取数——结果（须为对象，或经 **path** 提取）后到 merge 进数据域，mount 三形态/回收语义照常（数据只是「晚点到」）；异步形态在数据域注入 `$loading` / `$error` 元状态键（`$error` 为 Error 实例），同步形态（对象 / 数据脚本）不注入。HTML 侧物种见「异步 HTML 源」。详见 ADR-0033 / 0035。
_Avoid_: 远程数据（泛化，action 形态不经网络）、异步 x-data（形态不是时态）、fetch 数据源（url 只是载体之一）

**异步 HTML 源 / Async HTML Source（x-html）**:
**异步源家族**的 x-html 物种：url 前缀集判定与 x-data 相同；action 判定**必须带调用括号**（`loadPartial(lang)`）——裸词恒为表达式读状态键（x-html 的值本就是表达式，与 x-data 数据声明身份的关键判定差异）。响应 **text-only**（`res.text()` 直取，无 path；action 返回非字符串按加载失败处理）；产物按 x-html 既有双通道消费——默认模式写 innerHTML（远程内容**维持默认消毒**）、`.compile` 模式作为远程子模板编译。反馈**只走视觉通道**（合成 x-loading 字面量切换 + x-fallback 静态认领），**不注入元状态键**（x-html 无数据域，元键归 x-data 独有）；同元素双异步时反馈通道归 x-data 独占。详见 ADR-0035。
_Avoid_: 异步模板（.compile 只是消费通道之一）、远程 HTML 数据（产物是内容不是数据）、html 数据源（泛化，撞数据源物种名）

**提取路径 / path（x-data-options）**:
异步数据源的响应映射选项：`path:'results'` 经 `getVal` 从响应结构下钻提取子对象作为数据结果；提取失败或提取后仍非对象，按加载失败姿态（`$error` + warn，数据不落地）。**区别于 mount**（挂载点是「数据的家」）与既有「状态路径 / 配置状态路径」术语族——path 是**读响应数据的提取路径**（ADR-0029 否决 mount 用此名时，正是为把这个语义留给提取场景）。
_Avoid_: result（旧提案名已弃）、字段名（不表达路径下钻）、挂载路径（那是 mount 的值）

**异步兜底 / x-fallback**:
异步源宿主（异步 x-data / 异步 x-html）的**特例子节点**（x-empty 之于 x-for 同构）：**非就绪态的替换渲染**——非就绪（加载中或失败）且**尚无内容**时显示（x-data 判「域内尚无数据」、x-html 判「宿主无已注入内容」；重取保旧值不闪断；要重取期视觉指示，显式声明 `loading` 选项叠加载遮罩）。x-data 侧 fallback 经编译（可插值读 `$error`）；x-html 侧走**静态通道**（不编译不可插值，注入内容写入前先移除）。与 x-loading 加载遮罩**互斥为默认**（声明 x-fallback 则不合成遮罩；`loading:{...}` 显式开启则并存、`loading:false` 恒关）；同元素双异步时归 x-data 独占。孤立 x-fallback（父元素无异步源）warn + 当普通元素放行。区别于空值占位（x-text 值级空态文案）、组件兜底（消费者未命中组件回退默认 UI）、空值回填（x-model 显示层回填）——三者均非「异步未就绪」语义。
_Avoid_: fallback 块（裸词歧义）、加载占位（不认领 error 态，窄化语义）、loading 块（与 x-loading 加载遮罩撞义）

### 内容渲染层

**空值占位（Empty Placeholder）**:
x-text / x-html 的**值级**空状态配置：当绑定求值结果落在 `emptyValues` 内时，渲染 `empty` 指定的占位内容（默认空串）。区别于 x-for 的**结构空状态** `x-empty`（items 为空数组时渲染整块 fallback 子节点）——二者机制层不同（指令选项键 vs 子节点指令），命名沿用 `empty` 以求心智一致。详见 ADR-0014。
_Avoid_: fallback、默认值、占位符（占位符歧义大）

**空值集（emptyValues）**:
判定绑定值是否为"空"的集合：默认集 `[null, undefined, NaN]`（代码硬编码）**加上**用户经 `x-*-options` 声明的附加值。用户声明是**附加而非覆盖**——因 relaxed-json 无法表达 `undefined`（解析为字符串 `"undefined"`）与 `NaN`（解析抛 `not a float`），默认三成员不经 JSON 解析、永不可移除。判定用 `Array.prototype.includes`（SameValueZero 算法，故 `NaN` 可命中）。默认纳入 `NaN` 是有意的行为变更：既有 `String(NaN)` 渲染 `"NaN"`，现归为空。x-text/x-html（空值占位）与 x-model（空值回填）共用本集与判定语义。
_Avoid_: falsy 集（不是 falsy 真值判定）

**空值回填 / Empty Fallback（x-model）**:
x-model 读方向的空状态处理：绑定状态落在空值集内时，控件显示 `default` 声明的回填值（无 default 则按控件空值显示——text-like 空串、select 首项、多选全不勾）。区别于 x-text 的**空值占位**（渲染占位内容，输出层）——回填作用于**控件的显示值**，且 `default` 是「字段默认值」概念（模板 > schema 同名两级，优先级链读作同一键的两级声明）。**不回写 state**（显示层语义，state 是真相源）。仅 text-like + select 参与（checkbox 布尔语义、radio 多元素无「第一支」概念）。与 HTML 原生 `defaultValue`（受控初始值，会写 value）无关。详见 ADR-0027。
_Avoid_: defaultValue（那是 HTML 原生属性，会写 value）、默认值显示（泛化）、空值占位（那是 x-text 的词条，输出占位内容）

**`.hide` 修饰符**:
x-text / x-html 的修饰符，绑定值为空时将宿主元素内联 `display` 置 `none`（隐藏且不占位）；值恢复非空时**还原原内联 display**（如原 `flex` 保持 `flex`；无内联则还原为空串，让 CSS 类重新接管）。是空值占位的强化手段——要占位文案用 `empty`，要整块消失用 `.hide`。键名 `hide` 与 `empty`（文案）分离，避免撞键。
_Avoid_: `.empty`（与 empty 文案配置撞键）、`.ghost`（暗示 visibility:hidden 占位，与 display:none 语义冲突）

**`.compile` 修饰符（x-html）**:
x-html 的修饰符，将绑定值作为**子模板编译执行**（而非静态 HTML 快照）——反转 x-html"不编译注入内容"的原定位。注入内容写回 `scope.template` 后调 `recompileSubtree`，建 scope/watcher、继承宿主作用域（localData/data 经 `_linkParent` 自动传递），支持嵌套 x-data/x-for/x-if，与正常模板一致。**隐式强制跳过消毒**（sanitize 会剥指令属性致模板失效），安全等级**高于 `.raw`：.raw 的 `<script>` 经 innerHTML 不执行，compile 注入的 `x-on` 会真实绑定执行**——须确保来源可信。每次值变全量销毁旧子树 + 重编译（无 diff）；空值销毁子树 + 清空宿主、忽略 `empty` 文案（结构空状态无文案占位语义），`.hide` 仍生效。异步源组合：`x-html.compile="url"` 取回**远程模板**编译（重取保旧子树、x-fallback 同样认领，见「异步 HTML 源」）。详见 ADR-0017 / 0035。
_Avoid_: `.template`（与 engine.template/`<template>` 标签重载）、`.render`（泛化）、`.eval`（求值联想 + 安全负面含义）

**`.transition` 修饰符（x-style）**:
x-style / :style 的修饰符（仅 `attr === 'style'`），每次写样式时注入一条 CSS `transition` 声明，让内联样式的响应式变化被浏览器自动过渡动画，默认 `all 0.3s ease-in`。值取三级优先：用户样式对象自带的 `transition` key（显式）> `getOption('transition')`（`.transition` 注入的 `true`、或 `x-bind-options` 传的字符串）> 默认值。带 `.transition` 时覆盖/关闭须用 `x-bind-options`（指令选项层，早于修饰符合并），`x-options`（宿主层）被修饰符遮蔽、不生效。详见 ADR-0015。
_Avoid_: `animate`（那是结构指令的**进出场动画**选项——「元素在进出」，见「动画层」；本修饰符是「值在变」的属性过渡，二者正交）、`.smooth`/`.animated`（牺牲与 CSS `transition` 属性的直觉映射）

### 显隐控制层

**锚点注释（Anchor Comment）**:
x-if（eager / `.keepalive`）条件为假时留在宿主原位的注释节点，作宿主重挂载的 DOM 书签——随 DOM 移动、`parentNode` 恒为当前父，重插位稳定。仅 x-if 家族使用；x-show 宿主永留 DOM，无锚点。
_Avoid_: 占位符（歧义大，本表保留给空值渲染）、marker、占位节点

**条件存在性 / x-if（Conditional Presence）**:
x-if 控制宿主**是否存在于 DOM 树**。条件为假时**摘除宿主**（detach）并以锚点注释占位——宿主离开 DOM，不再被 `querySelector` / `:nth-child` / 表单提交命中。`.keepalive` 修饰符切两态：eager（默认）假时**销毁子树 scope**、真时重编译子树；`.keepalive` 假时**保活子树与 watcher**、真时原宿主 reattach（状态保留）。eager 占子树（ownsChildren）故与 x-for 同元素冲突；`.keepalive` 不占子树，可与 x-for 共存。
_Avoid_: 显示/隐藏（那是 x-show 的可见性语义）、条件渲染（泛化词）

**条件分支链 / x-else-if（Conditional Branch Chain）**:
x-if 宿主**直接子元素**中带 `x-else-if="expr"`（带值分支）/ 裸 `x-else`（兜底）构成的多路条件链：主表达式假时按文档顺序求值、**首个真者胜**；全假有兜底走兜底、无兜底皆不渲染（仅锚点占位）。分支编译期克隆为冻结快照（模板只读）、永不进 then 子树（compiler 剪枝）；命中分支作为**独立元素插到锚点位置**（宿主原位）完整编译执行——**渲染层级是宿主的兄弟、书写层级在宿主内**（一跳差异）。eager 切换销毁重建；keepalive **每分支独立保活**（切回状态保留）。分支根禁结构指令（ownsChildren 类，warn + 跳过）；孤儿分支（父非 x-if 宿主，含 x-for 容器直接子级）warn + 丢弃。详见 ADR-0034。
_Avoid_: 兄弟节点式（那是 Vue v-else 的形态，本引擎为子节点式自包含单元）、elseif 指令（名为 x-else-if，一名一义）、任意深度归属（仅直接子元素）

**分支选择 / x-switch（Branch Selection）**:
按**主表达式的值**多路选一渲染：宿主**直接子元素**中 `x-case`（relaxed-json **字面量**，多值数组任一命中）为分支、裸 `x-default` 为兜底。主表达式**求值一次**（单 watcher），与编译期定死的 case 字面量做 **SameValueZero** 比较（NaN 可匹配）；先扫 case 全不中才落 default（**位置无关**，JS switch 心智）。宿主摘除 + 锚点占位，命中分支作为独立元素插宿主原位（与 x-else-if 分支链渲染机制同构，一跳差异同样适用）；eager 切换销毁重建 / `.keepalive` 每分支独立保活。与 x-else-if 的分工：x-if 链答「哪个条件真」（分支各自布尔表达式），x-switch 答「这个值是什么」（一值对多字面量）。详见 ADR-0037。
_Avoid_: x-else 复用（那是条件链尾标记，剪枝判据与语义均不同）、switch 表达式求值（case 是字面量不是表达式，动态比较归 x-if 链）、短路链（default 位置无关，非文档顺序首个命中）、x-when（未采用的别名）

**条件可见性 / x-show（Conditional Visibility，独立指令）**:
控制宿主**是否可见**，宿主**永留 DOM**。条件为假时 `display:none`（仍占 `:nth-child` 位、仍被表单提交、`querySelector` 仍命中），子树与 watcher 全保留、最轻量。**独立指令，不再是 `x-if.keep` 的别名**（别名关系已废弃，见下）。不占子树，可与 x-for 共存。
_Avoid_: x-if.keep 别名/快捷方式（已废弃）、x-if（存在性 vs 可见性，二者正交）

### 动画层

**进出场动画 / animate（Enter/Leave Animation）**:
结构指令（x-if / x-show / x-for / x-switch）**状态变化引起挂载/卸载时**的转场动画，经指令选项 `animate` 声明（ADR-0007 回退链照常：指令选项 → 宿主选项）。取值三形态：字符串（进出同名，`animate:'fade'`）/ 对象（`{name,duration,delay,easing}`）/ 分相覆盖（见「分相配置」）。首次渲染静默（无 appear）；中断抢占（在播即取消、新动画从头播）；分支切换新旧同场共演。区别于 `:style` 的 `.transition`——那是**值在变**的 CSS 属性过渡，这是**元素在进出**。详见 ADR-0039。
_Avoid_: x-transition 指令（已否决的载体：引擎无指令间事件总线、感知不到宿主指令挂卸时机，空壳已删）、transition 选项键（与 `.transition` 修饰符撞义）、animation（泛化）

**六类名 / Six-phase Classes**:
进出场动画的 CSS 契约（Vue 同构）：`{name}-enter-from / -enter-active / -enter-to` 与 leave 三类镜像。进场 = 挂 from+active → 下一帧摘 from 挂 to → 结束全摘；出场镜像。自定义动画 = 用户按此约定写 CSS（**transition 型与 keyframe 型皆可**），传名即用、零注册 API。
_Avoid_: 二类名 fade-in/fade-out（已否决：keyframes-only 表达力受限）、autospark-* 前缀类名（已否决：与 Vue 词汇断裂）、WAAPI 程序化关键帧（已否决的基底）

**分相配置 / enter & leave**:
`animate` 的相位覆盖键：`enter` / `leave` 各自独立接受字符串 | 对象 | `false`（单相禁用，如 `{enter:'fade',leave:false}` 只动画进场）。一套词汇贯穿六类名（`enter` ↔ `enter-from`）。
_Avoid_: in / out（已否决的键名，与类名词汇错位）

**内置动画 / fade & slide & expand（Built-in Animations）**:
引擎内置的三个开箱即用动画名：fade（opacity 淡入淡出，300ms）、slide（translateY(-12px→0)＋opacity，300ms，离场反向、纵向固定）、expand（**高度型**：JS 测量自然高度 + `height`/`opacity` 同链 inline 过渡，300ms——布局高度参与动画，后续节点平滑跟随，不经六类名契约、无类 CSS）。fade/slide 样式经类级初始化注入，裸类名（`.fade-enter-active`）、用户同名 CSS 可覆盖。x-tree 默认 `expand`；x-for 仅项级进出（移动不动画）。
_Avoid_: 横向 slide 参数化（v1 纵向固定，横向走自定义动画）、FLIP / 移动动画（x-for 项移动暂不支持，留作后续）、改 slide 为 height 型（全局改既有内置语义，波及所有已用场景）

### 树形渲染层

**树形渲染 / x-tree（Tree Rendering）**:
嵌套子容器递归渲染树数据：`x-tree="node of nodes"`（`of` 必写，对齐 x-for），DOM 即树（`ul > li > ul > li…`）。容器直接子元素只认 `x-tree-node`（无值布尔标记，值 warn 忽略），其余 warn 丢弃；折叠两态对齐 x-if 家族——默认 eager（销毁子行）/ `.keepalive`（`display:none` 保活）。数据归一化：单根 `{...}` 与多根 `[{...}]` 归一为根数组；id 重复 / 循环引用 warn。节点 key 唯一来源 `idField`（默认 `"id"`，无 id 回退层级路径），`:key` 在宿主上 warn 忽略。空态 `x-empty` 只认真空数组 `[]`。详见 ADR-0040。
_Avoid_: 扁平连续段（已否决的结构：动画/保活/懒加载挂载全面劣势）、x-tree-node 带值特化（已否决：无场景输入，纯标记）、虚拟滚动（嵌套结构不可行，超大树靠折叠）、format:list / 平铺建树（已移除，ADR-0040 修订三：建树是数据转换职责归数据层，指令只接受嵌套格式）

**子容器 / x-tree-children（Children Container）**:
节点模板内声明「子节点渲染到这里」的无值标记（取第一个、多余 warn；模板无此标记 → warn + 不递归）。子容器位置天生固定（节点行的一部分），折叠 = `display` 翻转（keepalive 到此为止）或翻转 + 销毁子行 scope（eager）——**不走 x-if 的 detach/锚点机制**（位置固定无需锚点，且 display 翻转保住 CSS 过渡通道）。动画以子容器**整体**接入 Animator（见「进出场动画」），默认 `expand` 高度过渡（后续节点平滑跟随；类名型 transform/opacity 不参与布局，树上后续节点会跳位），折叠离场延迟最终态与 x-show 同构。
_Avoid_: 子树容器（泛化）、嵌套槽（与 x-slot 撞义——那是隔离快照机制）、递归点（实现视角词，用户词汇是容器）

**节点模板三级优先（Node Template Priority）**:
x-tree 渲染节点行的模板来源优先级：原地 `<li x-tree-node>`（用户定制）> `tree-node` 组件（scope 链 `getComponent` 就近 + `engine.options.components` 全局兜底）> 引擎内置默认节点模板（缩进 + 箭头 + `nameField` 字段，默认 `"name"`）——与 x-loading 的 DEFAULT_BLOCK 组件覆盖机制同构。「用 x-use 消费整棵树」由通用组件机制承担（用户 `x-component="my-tree"` 包装 x-tree 容器），引擎不内置递归组件。
_Avoid_: 插槽传模板（引擎无该机制）、内置递归组件（已否决：每节点组件实例开销 + 无工具链模板字符串）、默认模板（泛指——是三级中的最末级，非独立机制）

**展开回退（Expand Fallback）**:
节点有效展开态的回退规则：`expandField 有值 ? !!值 : (level + 1 < defaultExpandLevel)`——回退**永不落盘**；仅用户 toggle 时刻写 `expandField = !有效值`（惰性写回，引擎写用户数据的唯一例外场景之一）。`defaultExpandLevel = N` 即前 N 层可见（默认 `1` = 根层可见、根不展开），声明 `<1` 按 1 处理；`$level` 0-based（根 = 0）。否决「初始化期写数据」：异步数据下初始化时机不稳且反复污染源数据。toggle 触点：默认整行；模板内 `x-tree-toggle`（标记属性）收窄；声明 `selectedField`（P2）后整行点击自动改为选中、展开仅认 toggle 标记。
_Avoid_: expend（错拼，意为「花费」）、初始化展开（写盘时机不稳的已否决方案）、expandField 全量落盘（只有 toggle 才写）

**树循环变量（Tree Loop Variables）**:
x-tree 注入节点模板求值作用域的 `$` 前缀派生变量（对齐 x-for 派生变量惯例，不占用户命名空间）：`$level`（层级，根 0）、`$children`（原始子数据数组）、`$expanded`（**含回退的有效展开态**——不必手写 `node.expand ?? $level<2`）、`$leaf`（无子）、`$index` / `$first` / `$last`（兄弟内序号/首末）、`$parent`（父节点数据引用，根 null）、`$indeterminate`（复选半选派生态，不落盘——UI 态与数据态分离）。
_Avoid_: $depth（与 $level 撞义）、$hasChildren（用 $leaf 的反义已覆盖）、循环变量（泛指——这是树专属九元组）

**树交互三路分流（check / toggle / select）**:
x-tree 行点击的容器级委托判定序：① `x-tree-check` 标记元素 → 复选（级联 + `$indeterminate` 派生）；② `x-tree-toggle` 标记元素 → 展开/折叠（未启用选中且无标记时整行触发）；③ 启用选中（配置 `selectedField`，显式声明——它改变整行语义）后整行 → 选中（单选 toggle 清全树 / `multiSelect`）。复选启用**双通道**：自定义模板声明 `x-tree-check` 标记（标记即交互），或零模板场景 `checkedField` 显式声明（选项即标记，默认模板自动带三态触点——与 selectedField 声明哲学对称）。
_Avoid_: 独立复选开关选项（check:true 之类——启用语义已由「标记 / checkedField 声明」承担，开关是第三条不一致通道）、selectedField 默认启用（行为变更必须显式）

**拖拽三态定位（Drop Position）**:
x-tree 拖拽（`draggable: true`）的落点语义：目标行上 1/4 → `before`（移到其前）、下 1/4 → `after`（移到其后）、中段 → `inside`（收纳为子 + 自动展开）。拖入自身子孙被环检测拒绝；单根数据的根行仅允许 `inside`。数据 splice 写回（同父移动修正索引偏移；收纳叶子目标先建 childrenField 容器）。
_Avoid_: 拖拽手柄（v1 整行可拖，手柄等真实需求）、FLIP 移动动画（落点即数据重排，watcher 驱动重渲染）

**树事件 / tree:\*（Tree Events）**:
树交互的 DOM 冒泡广播事件：`tree:expand` / `tree:collapse` / `tree:select` / `tree:check` / `tree:drop`（`tree:load` 留给懒加载），宿主 `dispatchEvent`，`detail` 统一 `{ id, node, level }`（id 取 `idField` 值，无 id 为 undefined；check 另带 `checked`、drop 为 `{source, target, position}` 三段式——source/target 各含 `{id, node, level}`）。命名对齐 action 广播 `action:<name>` 惯例，外界 `@tree:expand="..."` 监听。
_Avoid_: 展开回调（配置函数形态已弃——事件广播解耦）、tree-expand 连字符（对齐冒号命名空间惯例）

### 虚拟列表层

**虚拟列表 / Virtual Scrolling（x-for）**:
x-for 的 `.virtual` 修饰符启用的渲染模式：只渲染可见项 + 缓冲区（overscan），回收池复用离开视口的 DOM 节点，解决大数据集（10000+ 项）的性能瓶颈。语法：`x-for.virtual="item of items"`。滚动容器为 x-for 宿主元素，不限制高度（支持固定高度和自适应高度），通过 ResizeObserver 监听容器尺寸变化重新计算可见范围。详见 ADR-0041。
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

### 分页层

**分页模式 / Paging Mode（x-for）**:
x-for 的 `.paging` 修饰符启用的分页渲染模式：支持客户端分页（全量数组 slice）和服务端分页（loader action 远程加载）；服务端按总页数是否已知分流渲染——`pageCount>0` 翻页渲染当前页，`pageCount=0`（load-more）累积渲染。语法：`x-for.paging="item of items"`。通过 `x-for-options="{pageSize:10, loader:'actionName'}"` 配置。详见 ADR-0042。
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

### 覆盖层（Overlay）

**覆盖层定义（Overlay Definition）**:
`x-overlay:<名称>` 声明的弹层模板资源（dialog / drawer / popup / popover 家族的声明侧）：编译期剪枝缓存为冻结快照、挂最近祖先 scope（`.global` 升 engine 级），不进结果 DOM（声明处无闪现）。值是**类型认领**标记（消费者类型不匹配 warn 仍渲染；无值 = 通用），同名定义后者覆盖。声明元素上其他指令随快照冻结、消费时才编译——模板具完整组件能力（`<script setup>`/`<style>` 生效）。存储与查找沿 scope 链就近 + engine 全局兜底（与组件查找同构）。详见 ADR-0052。
_Avoid_: 覆盖物（口语变体）、弹层模板（泛化）、overlay 组件（无 x-component 参与）、内联弹层（定义不在消费处渲染）

**覆盖层实例（Overlay Instance）**:
覆盖层定义被消费者打开渲染出的**活体**：独立 scope + watcher 子树，渲染进 body 下本 engine 的覆盖层容器。表达式上下文 / 挂链 / 生命周期由 **scope 基准**三合一决定（`scope: 'consumer' | 'declarer'`，默认 declarer——declarer 实例随声明处 scope 近永续，consumer 实例随消费者 scope 生死）。singleton 定义单例复用（关闭隐藏保活、重注入 params），非单例每次新实例可并存、关闭即销毁；层叠 = DOM 追加顺序。
_Avoid_: overlay 对象、弹层实例（泛化）、对话框实例（那是 x-dialog 消费者视角的产物）

**覆盖层消费者（Overlay Consumer）**:
把覆盖层定义实例化并驱动其生命周期的指令族（x-dialog / x-drawer / x-popup / x-popover，v1 仅 x-dialog）：**纯状态驱动**——宿主是纯声明点（无隐式点击），visible 绑定（简单路径可回写 / 表达式 / 字面量三形态）真值即开；params 打开时快照注入实例数据域顶层（覆盖同名）。per-实例配置经值对象内联（visible/params 保留键、其余键入配置链），配置四级深度合并：`内置默认 < x-overlay-options < x-dialog-options < 值对象内联`。
_Avoid_: 触发器（宿主无隐式点击）、弹出指令（泛化）、调用方（action 语境词汇）

**请求关闭（Request Close）**:
覆盖层关闭动作（ESC / 点遮罩 / close action）的统一语义——关闭是「请求」不是命令：visible 可回写（简单路径）则回写 `false`（状态是唯一真相源）；不可回写（表达式/字面量）仅 UI 关闭 + `overlay:close` 广播由用户善后。已知边界：表达式形态关闭后依赖变化重求值仍真会**重开**。子树内 close action 由消费者在实例根上委托监听（overlay DOM 在 body 下，engine 树收不到冒泡）。
_Avoid_: 强制关闭（它是请求语义）、自动回写（仅简单路径可回写）、关闭回调（事件广播解耦，非配置函数）

**覆盖层定义句柄（Overlay Handle）**:
`engine.getOverlay(name, options?)` 返回的**定义编程视图**（命令式消费入口）：`open(options?)` 打开、`close()` 关闭该定义当前全部打开实例。仅 `.global` 声明的定义命令式可达（「命令式 = 全局消费」）；options 是消费者配置级（与 x-dialog-options 同级），命令式合并链比声明式少一级。
_Avoid_: overlay 对象（泛化）、定义引用（「句柄」对齐 handle 惯例）、组件句柄（与 x-component 撞义）

**覆盖层实例句柄（Overlay Instance Handle）**:
定义句柄 `open(options?)` 返回的**单个实例编程视图**：`close()` 精确关闭、`el` / `name` / `scope` 读取——非单例多实例并存时唯一能精确关闭单个实例的通道。`options.scope`（元素）声明数据视图基准（缺省 engine 根全局视图），与声明式 scope 键同概念两表达面（声明式给基准名、命令式给基准载体）；命令式实例与声明式实例**同权同池**（共享单例池；单例重复 open 幂等——同句柄 + 重注入 params + 不重播动画）。
_Avoid_: anchor（那是定位锚点，数据视图是 scope）、实例对象（泛化）

**打开栈（Open Stack）**:
document 级共享的**打开实例顺序栈**（所有 engine 的实例同栈同权，声明式与命令式同权入栈）：ESC 经此只关**全局栈顶**实例（多 engine 并存也不连环关）；遮罩点击不依赖它——DOM 层叠天然让点击命中最上层。
_Avoid_: 层级栈（z-index 显式层级管理是另一件事）、单 engine 栈（跨 engine 全局协调正是决策核心）

**定位锚点（Anchor）**:
`anchor` 配置指定的**显示定位参考**（与 scope 正交：scope 管数据视图、anchor 管位置）：`anchor.at` 两栖——字符串选择器（`@` 前缀全局 / 无前缀 scope 子树内查，打开时现查，未命中 warn 退屏幕居中）或元素引用（命令式）。dialog 恒模态——anchor 只改位置不改模态性（有 anchor 遮罩照常渲染）；定位计算经 floating-ui（placement / offset / shift / flip，flip 与滚动重定位默认开），箭头由引擎自动注入载体 + 伪元素默认视觉（8×8 旋转 45°，模板零约定）。
_Avoid_: 锚点 el（键名是 at）、scope 锚点（scope 是数据视图，二者正交）、popup 专属（dialog 有 anchor 时同样锚定定位）

### 加载遮罩（Loading Mask）

> 旧称「加载覆盖层」已让位更名——「覆盖层」词汇整体归属 x-overlay 弹层家族（正式词条见上方「覆盖层」章节，历史沿革见「已废弃」词条）。

**动作按钮清单 / actions（x-loading）**:
x-loading 配置的**动作名数组**（inline 主声明 → `x-loading-options` 回退，与其他配置字段同规则；非字符串元素 warn 剪枝）。挂载时解析为 `[{name, title}]` 注入块 data（`title = ActionDesc.title ?? name`），渲染归块作者、触发归指令（见「data-action 委托」）。详见 ADR-0038。
_Avoid_: 动作列表（泛化）、buttons（配置的是 action 名不是按钮）、对象形态（已否决——文案定制走 ActionDesc.title）

**data-action 委托（x-loading）**:
遮罩根上的点击委托契约：块内任意 `data-action="<name>"` 元素点击 → 经块 scope `getAction` 链逐次现查（已注册走真 action、未注册走「合成动作描述符」），以标准 AutoSparkActionContext（`el`=被点元素）调用 → 双通道广播；随后按「hide 约定键」决定是否自动隐藏遮罩。自定义 loading 组件零接线同享。详见 ADR-0038。
_Avoid_: 动作绑定（泛化）、action 属性（与广播事件名 `action:<name>` 撞形）

### 表单绑定层

**双向绑定 / x-model（Two-way Binding）**:
输入控件与状态的双向同步——state→DOM（读方向）+ DOM→state（写方向）。区别于 `:value`/`x-bind:value` 的单向 state→DOM（"回写 state 须另用 x-model"）。控件按 **控件类别（ControlKind）** 分派读写：text-like（`<input>` 非 checkbox/radio + `<textarea>`，读 `el.value`）+ checkbox 单值布尔（读 `el.checked`，详见 ADR-0023）+ radio 值匹配 + select（选项子树见 **choices**，详见 ADR-0026）；checkbox 组 / radio 组收集暂不支持。详见 ADR-0018、ADR-0023、ADR-0026。
_Avoid_: 双向数据绑定（泛化）、表单绑定（泛化）

**getter（state→DOM 变换）**:
x-model **读取方向**的状态值加工（如 `value.split('.')[0]`），把状态值变成 DOM 显示值。经 `x-model-options="{get:'...'}"` 声明，字符串形态（表达式形参 `value` / action 名）。
_Avoid_: 格式化器（泛化）、读取函数

**setter（DOM→state 变换）**:
x-model **写入方向**的输入值拆解（如 `user.first=$value`），把 DOM 输入写回一个或多个状态字段。经 `x-model-options="{set:'...'}"` 声明。与 getter 方向相反。
_Avoid_: 解析器（泛化）、写入函数

**toInput / toState（schema 视图转换）**:
autostore `AutoStateSchemaBase` 元数据键，x-field 消费：`toInput`（state→输入值）与 `toState`（输入值→state）互为逆变换（如 sex：`1 ↔ "男"`）。声明 toInput 即**接管空值显示**（default 回填与 select 首项兜底退出，空值恒喂给 toInput）；显式 `get` 优先于 toInput（toState 无模板侧竞争者——x-field 的 `set` 恒直写）。写管道序：修饰符 → toState → 写 state（toState 落 `_writeToState` 统一出口入口，autoSelect 回写全过）。仅 schema 来源（函数进不了 relaxed-json）；created 期静态读取，后注册不生效。声明 toInput 后 `$field.value` 即「字段输入值」。详见 ADR-0050。
_Avoid_: 与 getter/setter 混称（get/set 是模板侧字符串表达式/action，toInput/toState 是 schema 侧函数）、「状态转换」（只转视图通道——form 层快照/getState 恒原始状态值）、视图格式化器（泛化）

**只读降级（Read-only Degradation）**:
表达式/computed 无 setter 时，x-model 退化为单向 state→DOM（DOM→state 静默），`logger.warn` 一次，不抛错、不魔法猜左值。
_Avoid_: 只读模式（泛化）

**x-model 防循环（Self-write Guard）**:
onInput 写 state 触发的 read 回调跳过回写，避免 getter 立即覆盖用户输入。经实例级 `_selfWriting` 标志实现（`scope.watch` 的 scheduler 合并模型不透传 `operate.flags`），写入仍带 `flags:-seq` 供 syncer 识别。
_Avoid_: 死循环防护（实际无栈溢出，是冗余回写/输入覆盖防护）

**元数据自动注入 / Schema Auto-injection**:
x-model 元素自动从 configManager schema 合成 input 原生属性的隐式 `@` 绑定——用户只写 `<input x-model="order.price"/>`，引擎按注入白名单与 schema 属性的交集自动合成 placeholder/title/required/min/max 等。合成实体是标准 BindDirective（复用 ADR-0019）。详见 ADR-0020。
_Avoid_: 字段属性注入（泛化）、自动绑定（歧义）

**注入白名单 / Injection Whitelist**:
元数据自动注入的候选属性集，按 input type 精准匹配：通用集（placeholder/title/required/readonly/enable/pattern/minlength/maxlength）+ numeric type 扩展（min/max/step）。仅注入 schema 实际承载的属性（动态交集）。不含 value/checked（x-model 自管）。enable 经 `.invert` 修饰符合成反向绑定（见「enable 反向映射」）。
_Avoid_: schema 属性集（那是 schema 的，白名单是 input 原生属性的候选）

**`.invert` 修饰符（x-bind，值取反）**:
x-bind 的修饰符，对求值结果取反（`!value`），状态绑定与 `@` 配置绑定均生效。语义化为 boolean 型属性的反向词汇映射而生（schema `enable` → DOM `disabled`），非布尔属性约定不使用（引擎不强制）。enable 元数据注入即合成 `:disabled.invert="path@enable"`。详见 ADR-0025。
_Avoid_: 反向绑定（泛化）、not 修饰符（与 JS 词汇混淆）

**属性展开 / Attribute Spread（x-bind 无参）**:
`x-bind="expr"` **不带属性参数**的形态：值须为对象，整对象摊开成宿主的 N 个属性——有参 `:title` 绑单属性、无参展 whole object（`v-bind="obj"` 心智）。值分派**通用规则**（`true→裸属性`、`false/null/undefined→移除`、`string/number→String()`、`object/array→warn 剔除`）+ **四特判键**（`class`/`style`/`value`/`checked` 复用单属性绑定的五路分派）。响应粒度：裸 state 路径经 `depth:2` 订阅（子键修改/新增/删除/整体替换全触发）、字面量内嵌引用键级响应；局部上下文（x-for item / x-data 局部）内的路径形态仅整体替换触发（表达式支路无 depth 概念）。覆盖顺序：书写序后者赢（展开之后的静态属性恒赢）+ class 合并例外；展开键**永不作为指令编译**（指令屏障：warn + 照写普通属性）。详见 ADR-0043。
_Avoid_: 属性解构（destructuring 方向相反——它是"收"，spread 是"放"）、`{...expr}` 属性名写法（happy-dom 拆碎属性名、与浏览器解析不一致，已否决的载体）、x-spread（未采用的新指令名）

**enable 反向映射 / enable Inversion**:
schema 的 `enable`（boolean，true=可用）映射到 input 的 `disabled` 属性时**值取反**（enable=false → disabled）。经绑定层的 `.invert` 修饰符实现（合成 `:disabled.invert="path@enable"`，ADR-0025）——与普通 `@` 绑定同一套依赖收集/订阅/patch，仅求值结果取反。与 Field.tsx 的 enable 语义对齐。
_Avoid_: disabled 绑定（语义反向，易误解）、专用注入器（ADR-0020 决策 7 原实现，已由 ADR-0025 取代）

**合成绑定 / Synthesized Binding**:
compiler 在 scope.compile() 后、对含 x-model 的元素合成的隐式 BindDirective 实例（构造合成 AutoDirectiveInfo 喂给 createDirectives）。合成知识封装在 `ModelDirective.synthesizeSchemaBindings` 静态方法（compiler 只管调用时机）。
_Avoid_: 隐式指令（那是插值 desugar 的术语）

**控件类别 / ControlKind**:
x-model 内部对表单控件的分型（text / checkbox / radio / select），决定读源（`el.value` / `el.checked` / selectedOptions）、写目标、默认事件（text-like=`input`、select=`change`）、单值/组模式（select 的 multiple 多值 `string[]`）。分派发生在 `writeToDom`/`_handleInput` 底层，与 get/set、防循环、元数据注入正交。select 分支见 ADR-0026（选项源见 **choices**、分组见 **group 分组**）。
_Avoid_: 控件类型（与 schema.widget 重载——widget 是 schema 声明的控件类型，ControlKind 是 x-model 运行期按元素判定的绑定分型）、模式（mode）

**控件感知冲突 / Control-aware Conflict**:
x-model 与显式 bind 的冲突判据随控件类别变化：text-like/`<select>` 查 `:value`（竞写 `el.value`）、`<input type=checkbox>`/`<input type=radio>` 查 `:checked`（竞写 `el.checked`）且 `:value` 放行（设选项值，必需）。取代 ADR-0018 决策 7 的「同元素一律查 `:value`」。详见 ADR-0023。
_Avoid_: 冲突规则（泛化）、竞写检测（实现细节）

**choices（选项列表）**:
选项类控件的选项数据（`{ label?; value?; default?; [k: string]: any }[]`，label/value 均可缺省走 HTML 原生回退，附加字段可作 **group 分组** 键或 `default:true` **自动选中** 标记）。select 的选项源三级优先：**静态 `<option>`/`<optgroup>` > 模板 choices（x-model-options）> schema choices（响应式，变更全量重建子树后重放选中）**；静态模式忽略两处 choices。checkbox 组 / radio 组收集暂未接入（词汇已统一，待组收集落地）。详见 ADR-0026。
_Avoid_: options（泛化）、备选项（与 `AutoWidgetSelect.select` 撞义，统一后原名废弃）

**自动选中 / Auto-select（select）**:
x-model select 的值不在选项集内时的行为（默认开启）：自动选中 choices 项含 `default:true` 的第一个项（无则渲染后首个 option）并**回写 state**——与用户手选同一条写路径（flags/防循环/set 全复用），回写触发下游级联，链路闭合。类型不匹配（非字符串配单选）与空选项集不触发（维持不勾中）；多选是**过滤式**（剔除数组中过期项）。`autoSelect:false` 显式退回旧行为（不勾中不回写）；声明两级：模板 > schema，默认 true。级联联动的可用性基石。详见 ADR-0028。
_Avoid_: 默认选中（与 ADR-0027 的 default 回填混淆——那是空值显示回填，这是过期值重选+回写）、自动补全（输入联想，无关）

**group 分组（select）**:
choices 渲染的分组方式：`x-model-options="{group:'字段名'}"` 按项的该字段值聚合到 `<optgroup label>`，无该字段的项渲染为顶层 `<option>`（顺序遍历可与组交错）。仅作用于 choices 路径（两来源均可），静态手写 optgroup 不适用；group 键只在模板侧声明，schema 不承载。详见 ADR-0026。
_Avoid_: 分组字段（那是 group 的值，不是机制）、optgroup（那是 DOM 产物）

### 表单层

**表单域 / x-form（Form）**:
仅合法于 `<form>` 元素的**表单行为壳**：submit 拦截 + 校验门 + reset 快照回滚 + 元数据中心化监听（见「中心化监听」）。值三形态：空（行为壳，字段走全局状态）/ 对象字面量（自建 `$scopes` 私有域）/ 状态路径（`$scopes` 祖先链优先全局兜底，建立**路径上下文**供后代 x-field 相对路径拼接）。继承 x-data 全部值形态（url / action / 数据脚本），mount 强制 local。只处理表单逻辑，不处理模板和渲染。详见 ADR-0045。
_Avoid_: 表单组件（它不渲染 UI）、独立表单 store（已否决——复用 `$scopes` 域，引擎单 store）、x-form 挂任意元素（仅 `<form>`）

**字段域 / x-field（Field）**:
声明一个表单字段的指令，单指令双形态（按宿主分派）：标准控件（input/textarea/select）上 = **x-model 全部语义** + `$field` 注入（表单内正身，散装控件仍用 x-model）；非控件元素上 = 字段域声明，渲染完全归模板（不 ownsChildren、不自动渲染）。**必须在 x-form 内**（注册消费其中心化监听）。详见 ADR-0045。
_Avoid_: 字段组件、自动渲染器（已否决——不生成模板）、表单版 x-model（它是超集，双向绑定只是其一面）

**字段上下文 / $field**:
x-field 注入后代作用域的 **Proxy 对象**：`.value`（**字段输入值**，读写——schema 声明 toInput/toState 时为转换后的输入值，未声明即状态值，ADR-0050）、`.error`（校验错误）、`.onInput`/`.onChange`（写方向事件封装）、`.xxx`（任意 configurable 元数据，经元数据覆盖链解析）。响应式三分层：value 靠根 store 依赖收集穿透；error 与动态控制白名单（enable/visible/disabled/readOnly）靠 configManager.watch 桥接 + refresh；其余静态快照。作为 `x-bind` 展开源时暴露控件展开键集。详见 ADR-0045、ADR-0050。
_Avoid_: 字段元数据对象（它含动态值与事件封装，不止元数据）、field props、`$field.input` 属性包（grilling 中间形态，已并入本体）

**控件展开键集 / Control Spread Whitelist**:
`x-bind="$field"` 展开时 `$field` 暴露的键集（Proxy ownKeys）：`type`（widget 映射）/ `value`（checkbox widget 为 `checked`）/ `name` + 注入白名单属性（enable→disabled 反向，schema 有才出键）+ `onInput`/`onChange` + `choices`（仅 widget=select 且 schema.choices 存在——select 宿主上渲染 `<option>` 子树，静态手写优先）。label/help/widget 原键等非控件元数据**不进键集**。与「注入白名单」（x-model 元数据自动注入的候选集）同族不同集。详见 ADR-0045。
_Avoid_: 全量展开（非控件元数据不进键集）、spread 白名单（那是渲染安全概念）、choices 不渲染（已修订——原 select 边界被推翻）

**表单上下文 / $form**:
x-form 注入容器的表单级对象，键集五元：`getState()`（**方法**——无参 `{name:值}`、`getState(true)` `{path:value}`，聚合已注册 x-field 的分散字段）、`valid`、`errors`（`Record<字段路径, 信息>`）、`dirty`（任何字段 ≠ 初始快照）、`reset()`（与 reset 按钮同管道）。详见 ADR-0045。
_Avoid_: `$form.state`（已否决——字段分散于状态树，无单一 state 对象可指）、表单状态（getState() 才是取值方法）

**字段名 / name（三层解析）**:
字段的显示名解析链：默认路径末段（`login.username` → `username`）→ `configurable(v,{name})` schema 指定 → `x-field-options="{name}"` 最高。是 `getState()` 无参形态的键与控件 `name` 属性注入的来源；同名冲突 warn + 后者覆盖。
_Avoid_: 字段路径（那是 `getState(true)` 的键）、字段 key（key 是 configManager 的 fullKey 概念）

**元数据覆盖 / x-field-options**:
字段级元数据覆盖（ADR-0007 标准形态），优先级链 **x-field-options > configurable schema > 默认值**。覆盖仅作用于 `$field` 读取视图与行为（元数据键、getState 键、name 属性注入），**不写回** configManager 注册的 schema 本体——schema 是状态层资产，指令选项是视图层覆盖。
_Avoid_: schema 修改（方向反——视图层覆盖，schema 不动）、字段配置（泛化）

**中心化监听 / Centralized Watching**:
x-form 作为**唯一订阅者**统一监听 configManager 元数据依赖，各 x-field 编译期注册（字段路径 + 消费回调）、变更由 x-form 分发——避免每字段独立建监听。是 x-field 强依赖 x-form 的架构根源。
_Avoid_: 事件总线（订阅的是响应式依赖，不是事件）、字段监听器（监听集中在表单层不在字段层）

### 图标层

**图标 / Icon（x-icon）**:
以 CSS mask 呈现的矢量图标渲染指令：宿主元素 `x-icon="名称"`，输出裸名类（`as-icon` + 图标名）+ 尺寸内联。值两形态：**本地名**（纯 CSS ident，查图标注册表）/ **远程形**（`图标集/名`，仅斜杠形——冒号形已废除，见「异步图标源」）；**值两栖**——表达式求值优先，求值空/非法时原值形匹配才回退字面量（裸名不是合法 JS，状态命中优先、字面量为空值兜底）。**颜色主权在宿主**——mask 只取 alpha 通道，data URL 内的 currentColor 解析为黑，实际颜色取宿主 `background-color`（默认 currentColor，随文字色）。值为响应式表达式（切换即换图标）；未命中（未注册或已删除）warn + 渲染**默认图标**（保留尺寸），注册后经变更通知自动补渲染。
_Avoid_: svg 图标（那是数据形态）、icon 组件（无组件机制参与）、图标字体（那是 font-family 方案）

**默认图标 / Default Icon**:
图标注册表**未命中**（未注册或已删除）时替换渲染的内置回退图标（保留尺寸、照常 warn）——「缺图不破相」。以内置条目形态驻注册表（名为 `default`，可被用户同名覆盖；其被删除则未命中退回空占位）。
_Avoid_: 空占位（已否决的未命中姿态——只保尺寸无内容）、fallback 图标（英文别名）、占位图标（与「空值占位」词条撞形）

**图标按钮 / Icon Button**:
`x-icon` 的 `button` 选项（修饰符 `.button`）声明的**纯视觉交互态**：hover / press 动效 + 隐含手型光标。**载体动效**——动效作用于既有视觉载体（非 badge = 图形本身加深/缩放；badge = 底板梯度加深/整体缩放），不新增视觉结构、不改布局占位；与 badge（管「板常驻」）正交。只做视觉可供性，**不承载控件语义**（无 role/tabindex/键盘激活）——点击行为归用户 `@click` 声明。详见 ADR-0049。
_Avoid_: button 组件（无组件机制参与）、可点击图标（视觉可供性与控件语义分离）、图标控件（语义升级歧义）

**图标定义 / x-icon-define（Icon Definition）**:
`<template x-icon-define="名称">` 声明的**声明性资源**（与 x-component 同构）：编译期前置 collector 拦截，取首个 `<svg>` 子元素上交全局图标注册表后剪枝（不进结果 DOM，指令类仅名位）。同名覆盖 + warn 去重。
_Avoid_: 图标注册（那是注册表的动作）、图标模板（泛化）、图标声明（与注册表编程入口混淆）、name 属性装名（已否决——名称走指令值，对齐 x-component）

**规范形 SVG / Canonical SVG**:
图标注册表的存储形态：strip **全部** stroke-width、缺 stroke 才补 currentColor、缺 xmlns 才补声明（作者显式属性不动；**xmlns 是 data URL 图像解析的硬约束**，缺失则 mask 无图隐形）的归一化 SVG。生效 strokeWidth 渲染期注入 root——「宽度不是图标的一部分，是渲染参数」。
_Avoid_: 原始 SVG（未归一化）、图标数据（泛化）

**URL 工厂 / Icon URL Factory**:
规范形 SVG + 生效 strokeWidth → `data:image/svg+xml,${encodeURIComponent(svg)}` 的生成器，按 (名称, strokeWidth) 缓存（同组合全页只编码一次）。默认 1.25 经 `:root` 变量 + 裸名类规则下发；非默认实例内联 mask-image 覆盖。
_Avoid_: base64 编码（已否决：体积 +33% 且 btoa 有 Unicode 陷阱）、图标序列化（泛化）

**图标注册表 / Icon Registry（AutoSpark.icons）**:
document 级全局共享的 Set 子类（`AutoSpark.icons` 静态暴露，多 engine 共享）：动态增删（`add(name, svg)` 注册 / `delete` 移除，无 remove 别名——严守 Set 契约）、遍历产出**名称字符串**（SVG 数据不外露）。声明入口三通道：模板 `x-icon-define` / 编程 `AutoSpark.icons.add` / 构造 `options.icons` 种子。另承载 `baseUrl` 字段——远程图标协议基址（URL 约定 `baseUrl/<图标集>/<图标名>.svg`，默认 Iconify 公共 API、不限于 Iconify，兼容服务可自托管；远程缓存不进本表）、`options` 字段——**全局图标默认配置**（配置链第三级：指令选项 > 宿主选项 > 本配置 > 内置默认，生效默认 strokeWidth 参与规则烘焙；整体赋值广播重渲染，深修改不广播）、`persist` 开关与 `prefetch` 方法（见「远程图标持久缓存」「图标预取」）。engine destroy 不清理（对齐 document 级共享 style 先例）。图标名受 CSS ident 硬约束（`[A-Za-z0-9_-]`、非数字开头），`as-icon` 为保留名。
_Avoid_: engine.icons（实例级注册表已否决——document 级样式天然跨 engine）、图标库（泛化）、图标 Map（对外是 Set 形态）

**异步图标源 / Async Icon Source（x-icon）**:
**异步源家族**的 x-icon 物种：值形如 `mdi/home`（**仅斜杠形**，冒号形已废除；本地图标名受 CSS ident 约束天然不含 `/`，两通道零冲突）→ 经 `AutoSpark.icons.baseUrl` fetch SVG 文本，走规范形 → URL 工厂全管线（sw / 颜色模型与本地物种同构）。产物进**模块级远程缓存 + 持久缓存（见「远程图标持久缓存」）+ in-flight 合并 + 并发限流（4 路，429 退避重试）**（不进图标注册表——遍历 / delete 语义保持用户资产纯净），默认 sw 形态**升格为属性选择器规则**（`.as-icon[data-as-icon="集/名"]`，指令自管样式表即登记表，实例挂 `data-as-icon` 短属性共享一条规则）、非默认 sw 才内联。姿态：加载中空占位、失败 warn + 默认图标、重取保旧图。fetch 竞态 / abort 骨架复用 AsyncSourceRunner（值 watch 与通道判定物种侧自有——runner 的形态判定是 url/action 声明形，不适配表达式值）。详见 ADR-0047 / 0048。
_Avoid_: Iconify 指令（不是独立指令，是 x-icon 的值形态）、远程图标注册（不进注册表）、在线图标（泛化）

**远程图标持久缓存 / Persistent Icon Cache**:
远程图标的**跨会话存储层**（挂 localStorage，按源分组）——二次访问零网络请求、同步渲染，观感等同本地图标。键含 baseUrl（换源不串图）；无过期（图标版本不可变）+ 条数上限 LRU 淘汰；模块加载即注水进内存（先于任何渲染）；`AutoSpark.icons.persist` 可关（禁用 / 环境不可用时静默退回内存缓存）。详见 ADR-0048。
_Avoid_: 图标离线包（那是构建期资产）、HTTP 缓存（那是浏览器层）、会话缓存（那是内存层）

**图标预取 / prefetch（AutoSpark.icons）**:
`AutoSpark.icons.prefetch(名 | 名单)` 的编程式**提前取回**（走限流、落内存与持久缓存、失败静默）——持久缓存只救二次访问，首次使用的等待只能靠提前量（下一屏 / 悬停目标的闲时预热）。详见 ADR-0048 决策 6。
_Avoid_: preload（与 x-import 远程组件加载撞义）、预热（泛化）

### 结构占位与组件层

**结构占位 / x-scope（Structural Placeholder）**:
纯占位指令，元素上声明 `x-scope` 即令该元素建立 `AutoSparkScope`——即便它没有其他指令、没有插值。目的是在「无其他指令的纯容器 `<div>`」上插入一个 scope 锚点，让后代 scope 的 parent 链落到此处（而非更远的祖先），并为其后代 `x-component` 提供归属。注册占位类 `ScopeDirective`（`created`/`compile` 皆空，高优先级）；冗余声明（元素已有其他指令、本就建 scope）静默无副作用。**不建数据域**——与 x-data 的数据注入职责正交。
_Avoid_: 作用域容器（泛化）、命名空间（语义不符）、占位符（本表保留给空值渲染，歧义大）

**组件 / x-component（Component）**:
编译期树变换标记，**不是渲染指令**。在 x-scope（或任意带 scope 的祖先）内声明一个命名组件片段，编译时被**从渲染树摘除**（不进结果 DOM、不建 scope、不实例化指令），以**深克隆的 template 元素副本**形态上交给最近祖先 scope 的 `components`。无值时取名 `default`。组件上同元素的其他指令（如 `x-component="error" x-text="msg"`）随组件整体冻结，待消费者渲染该组件时才编译执行。**组件根 scope 由消费编译路径（`compiler.compileChild`）内禀保证**——消费者无条件 `new AutoSparkScope`，与根上是否有 `x-scope` 属性无关；`_collectComponent` 不再给快照根注入任何属性（原"注入 x-scope"已作废，ADR-0022（承接 ADR-0021）决策 7 修订）。详见 ADR-0022（承接 ADR-0021）。
_Avoid_: 片段（泛化）、插槽（那是 x-slot，正交）、命名空间组件

**组件归属（Component Ownership）**:
一个 x-component 挂到其**最近的祖先 scope**——任意深度（跨中间无 scope 的纯 `<div>`），与 `_linkParent` 向上找最近 scope 的语义同构。嵌套 scope 时归最内层祖先；x-component 向上找不到任何带 scope 的祖先时，编译期 warn 并丢弃（无处归属）。
_Avoid_: 组件归属深度（实现细节）、组件父（用 scope 统一）

**`default` 组件唯一性（Default Component Uniqueness，已放宽）**:
该约束**已放宽**（ADR-0022 决策四-4）。原 ADR-0021 中"每个 scope 的 `components.default` 唯一、同名直接归属抛错"已废止——**同名组件直接归属同一 scope 时改为 warn + 后者覆盖**（不再抛错）。沿 parent 链**允许覆盖**：内层 scope 的 default 遮蔽外层同名 default，与组件查找的就近原则一致。此放宽为 x-component 引擎无实例缓存层、组件复用更灵活而设。
_Avoid_: 全局唯一（沿链可覆盖）、同名互斥（约束已放宽为 warn+覆盖）、抛错（已废止）

**组件查找（Component Lookup）**:
消费者（如 x-loading/x-empty/x-error）按约定名取组件的查找协议，经 `getComponent(name)`（原 `getBlock`/`lookupBlock`）执行：从自身 scope 起沿 parent 链向上取首个含该名 component 的 scope，**到顶兜底查 `engine.options.components`（全局组件，懒预编译缓存）**。命中则用该组件替换内置 UI；未命中则回退默认组件/内置 UI。**局部 x-component 沿链遮蔽全局同名组件**（就近原则，与 `getAction` 内层覆盖全局 `engine.actions` 同构）。与 action/data 的 parent 链查找范式统一，支持「局部覆盖、外层兜底」。三个落点：`scope.getComponent(name)`（链终点兜底全局）、`engine.getComponent(el, name)`（经 el 反查 scope，供 Runtime 指令）、Compile/Hybrid 指令直接 `this.binding.scope.getComponent(name)`。
_Avoid_: 组件解析、组件匹配（查找是按 scope 链就近+全局兜底，非内容匹配）

**组件兜底（Component Fallback）**:
消费者未查找到约定名组件时回退其默认渲染的行为。两种形态：**(a) 消费指令自带的默认组件**（如 x-loading 的 `DEFAULT_BLOCK` 模板串，渲染统一走「编译组件」路径，可被全局/局部组件覆盖）；**(b) 纯代码兜底**（已被 (a) 取代，x-loading 不再保留代码 DOM 路径）。组件是可选的覆盖资源，不存在时消费者回退其默认实现，引擎行为不退化。
_Avoid_: 降级渲染

**全局组件（Global Component）**:
经引擎构造选项 `AutoSparkOptions.components`（`Record<string, string>`）声明的、**全引擎复用**的命名组件，字符串入参。是 scope 链查找的**终点兜底**（`getComponent` 到顶后查此）。与局部组件（x-component 声明、入参为 DOM）相对——二者经同一条 `getComponent` 链统一取用，消费者无需区分来源。懒预编译（见「组件预编译」），**构造期配置语义、运行时突变不失效缓存**（与 `actions`/`sanitizer` 等 options 同纪律）。详见 ADR-0022（承接 ADR-0021）决策 9。
_Avoid_: 全局模板（泛化）、注册组件（无注册表，引擎不维护名册）

**组件预编译（Component Precompile）**:
全局组件字符串入参首次被 `getComponent` 命中时，经 `parseHtmlFragment` 解析 + 自动包装（见「组件自动包装」）为「恰好一个带 `x-component` 的根元素」，存入 engine 私有缓存 Map（key=组件名，value=预编译根），后续命中只 `cloneNode(true)` 不重复解析。**懒编译**——仅首次使用时预编译，未用的全局组件永不解析。预编译产物形态与局部组件 `_collectComponent` 快照一致（未编译、保留指令属性、**不注入 x-scope**），消费者经同一路径渲染。解析失败/空串 → `logger.warn` + 视为未命中。详见 ADR-0022（承接 ADR-0021）决策 11。
_Avoid_: 组件编译（预编译只解析+包装，编译在消费时）、组件缓存（强调的是懒解析+复用，非单纯存储）

**组件自动包装（Component Auto-wrap）**:
全局组件字符串入参规范化为「恰好一个带 `x-component` 属性的根元素」的规则（仅全局组件字符串入参适用，局部组件入参已是 DOM）：单顶级元素无 `x-component` → 根打本 key 名；已含 `x-component` → 尊重原值不重命名；多顶级节点/元素+文本混排 → 包一层 `<div x-component="name">`；纯文本无元素 → 包成 `<div x-component="name">文本`。包装标签固定 `<div>`（不开放配置）。详见 ADR-0022（承接 ADR-0021）决策 10。
_Avoid_: 组件归一化（泛化）、组件封装

**跨指令供体协议（Cross-directive Provider Protocol）**:
x-component 不绑定具体消费者，是声明性资源——任意指令按约定名从 `scope.components` 取用。组件名**纯自由命名**（各消费指令文档自定其读取名与兜底逻辑），引擎**不预定义 UI 态名册**（如 loading/error/empty），不限制指令开发者发明新消费场景（开放-封闭）。
_Avoid_: 插槽契约（与 x-slot 撞义）、UI 态注册表（引擎不维护名册）

**组件冻结（Component Frozen Snapshot）**:
x-component 收集时 `cloneNode(true)` 产出的、独立于 template 事实源的洁净副本。保留指令属性、未编译、可被多消费者重复取用而不相互污染。机制与 x-slot static 模式的「深克隆子节点」同构。
_Avoid_: 组件克隆（强调的是冻结独立事实，非单纯克隆操作）

### 引擎构造层

**数据源 / Data Source**:
构造器第二参，**只收裸状态对象**（种子）：engine 在 `private _createStore()` 内自建 store 并拥有。传入 `AutoStore` 实例 → throw（附迁移指引）；`null`/`undefined` 静默兜空 store。详见 ADR-0044。
_Avoid_: 借用 store、共享 store（ADR-0009 借用轨已被 ADR-0044 移除）

**种子状态 / Seed State**:
数据源的裸对象形态，仅作**初始种子**——建 store 后其身份失效（对原对象赋值不触发更新），唯响应式状态句柄（`engine.state`）有效，建后应弃。
_Avoid_: 初始状态、初始数据（"种子"强调一次性播种、建后即弃）

**引擎自建 store / Engine-owned Store**:
store 恒由 engine 创建并拥有（**创建权换确定性**：configManager / configKey 可控，`@` 配置绑定行为可预测）；`engine.destroy()` 恒销毁之。无借用/共享形态（1 engine 1 store）。详见 ADR-0044。
_Avoid_: 外部 store、`_ownsStore`（借用/拥有分流的字段已删除）

**默认 configManager / In-memory ConfigManager**:
`storeOptions.configManager` 为 nullish 时 engine 补的**内存空 source** 实例（纯响应式 schema 注册表，无持久化、engine 间隔离），使 `@` 绑定与 x-model 元数据注入开箱即用；`configKey` **恒 `''`**（无条件覆盖——引擎自建 store 的 fullKey 恒无前缀，显式传入的 configKey 不生效）。多 store 共用同一 cm 须在 schema 键上自行避让。详见 ADR-0044。
_Avoid_: 全局 configManager（不注册 `globalThis` 默认，隔离是决策）、显式 configKey 生效（三态中的该态已废止，恒覆盖为空）

### 配置绑定层

**配置分隔符 `@`（Config Separator）**:
x-bind 值中的路径中缀，声明该绑定指向 configManager 元数据而非 store 状态。`:placeholder="order.price@placeholder"` 中 `@` 把值来源从 `scope.watch(state)` 切到 `configManager`，左侧为配置状态路径、右侧为配置属性路径。无 `@` 即状态绑定（支持相对表达式）——配置绑定仅绝对配置路径。
_Avoid_: 元数据前缀、schema 前缀、配置引用前缀（初版 `~` 已废弃）

**配置引用（Config Reference）**:
`@` 分隔的整体路径串（如 `order.price@placeholder`），由「配置状态路径 + 配置属性路径」组成。用 `indexOf("@")` 取第一个 `@` 分割，两侧再各用 `splitPath(".")` 拆，与 configManager state key 的 `.` join 同构。
_Avoid_: 配置路径（歧义，下分）

**配置状态路径（Config State Path）**:
配置引用中 `@` 左侧部分（`order.price`），定位 configManager.state 中的 schema 条目。注意它指向 configManager 的 flat schema 表，非 store 状态树。
_Avoid_: 状态路径（那是 store.state 的）

**配置属性路径（Config Attribute Path）**:
配置引用中 `@` 右侧部分（`placeholder` 或 `style.color`），schema 对象的属性路径，**支持多段嵌套**（`getVal(schema, rightPath)` 读任意深度）。schema 是可扩展数据结构，故**无白名单**。
_Avoid_: schema 字段（泛化）、配置属性（已升级为路径，支持嵌套）

**配置绑定（Config Binding）**:
经 `@` 把 configManager 元数据响应式注入 DOM 属性的行为。经 `configManager.collectDependencies("read")` 自动追踪依赖（含嵌套层，规避手工拼 watch 路径），回调同样经 scheduler 合并。三层降级：configManager/schema 不存在 → warn + 静默；属性取不到（含嵌套中途断裂）→ 复用 patch removeAttribute。详见 ADR-0019。
_Avoid_: 元数据绑定（泛化）

## 组件层

**组件 / x-component（Component）**:
承接 x-block 的命名组件供体，升级为带数据/方法/生命周期/CSS 的完整组件（ADR-0022）。编译期树变换标记，剪枝后冻结快照挂最近祖先 `scope.components`；子节点可含 `<script setup>`/`<style>`（收集期提取移除）。消费（x-use）时实例化。
_Avoid_: 片段（泛化）、插槽（那是 x-slot，正交）、命名空间组件

**`<script setup>`**:
组件的数据/方法/生命周期声明，识别 `<script setup>` 布尔属性或 `<script type="autospark/setup">`（ADR-0031 命名空间化）二者择一。对象字面量经 new Function 求值（信任代码），多个按段（data/methods/hooks）分类合并。data() 返回值注入组件 data 域，methods 注入 scope.methods（组件边界查找，ADR-0022 决策二-3 修订后不再进 scope.actions），hooks 挂 scope.hooks。
_Avoid_: 组件脚本（泛化）、setup 函数（Vue 术语，机制不同）、`type="setup"`（裸值旧写法已废弃）

**scope.hooks**:
组件实例的四阶段生命周期钩子（created/mounted/beforeUnmount/unmounted），砍掉 activated/deactivated（引擎无实例缓存层）、beforeUpdate/updated（细粒度无组件整体重渲染）。每个 hook 用 ComponentMethodContext 作 this（data/state/scope）。
_Avoid_: 生命周期（泛化）、组件钩子（泛化）

**组件作用域 CSS（Scoped CSS）**:
属性后缀法（仿 Vue scoped，不支持穿透）。组件根+后代打 `data-cmp-{id}` 属性，`<style>` 选择器末尾追加 `[data-cmp-{id}]`，按组件定义缓存 + 引用计数注入 head。
_Avoid_: CSS 隔离（泛化）、CSS Modules（机制不同）

**样式绑定 / CSS 变量响应式（Style Bind）**:
scoped CSS 之上的值响应式能力。`<style>` 声明值写 `bind(expr)`（引号可选，仅作整个属性值，支持任意表达式），编译期提取为 `ComponentDef.styleBinds` 清单、`bind()` 替换为 `var(--name, unset)`；实例化期对每个 bind 调 `hostScope.watch` 求值并写入**组件根元素**的 CSS 变量（每实例独立，与 data-cmp-{id} 同构隔离）。变量名：纯路径→`--{路径}`（`.`→`-`、`*`→`_`，如 `bind("order.style")`→`--order-style`），表达式→`--h{hash36}`（`h` 保 CSS 合法，首字符非数字）。同表达式复用同一变量（一处 watch、多处 var 共享）。null/undefined 不写变量走 `unset` 回退（fallback 固定不可配，要自定义默认值用 `:style`）。详见 ADR-0022 决策四-4.1。
_Avoid_: 内联样式绑定（`:style` 指令是元素级，style bind 是组件级样式表）、CSS-in-JS（无运行时对象）

**x-use（组件实例化）**:
实例化组件的指令。宿主化身组件根（属性继承：class 合并拼接、style 合并冲突键组件根优先、其他不覆盖），props 注入组件 data 域覆盖 data() 默认。组件未就绪（x-import 加载中）显示 loading 占位，就绪后重实例化。
_Avoid_: 组件渲染（泛化）、组件挂载（Vue 术语）

**x-import（远程组件加载）**:
fetch 远程 HTML 加载组件定义（可含 1-N 个 x-component）。`.global` 修饰符注册全局组件，否则作用域组件（挂最近祖先 `scope.components`）。url 缓存 + 循环 import 检测。
_Avoid_: 组件异步加载（泛化）、组件懒加载（语义不符）

**组件数据边界（Component Data Boundary）**:
x-use 实例化的组件默认**封闭**数据边界：组件内表达式只能读自身 data()/locals、x-use props 与全局 state，祖先 scope 的局部数据域（x-data 域、x-for locals）不可见，读+写一并切断。收口三处：`getContext` 聚合视图、`hasLocalContext` 探测、x-data 相对挂载上溯（越过边界视同越顶落根）。边界只封**数据视图**——action 沿链查找、getComponent 定义查找、`this.$parent` 显式寻址照常；与 methods 组件边界（方法查找止步，ADR-0022 决策二-3）正交并存。模板片段渲染（x-loading 遮罩 / x-empty / tree-node 行模板等无组件语义注入的原地 UI 替换）不受边界管辖。详见 ADR-0053。
_Avoid_: 沙箱、数据隔离（那是 scoped CSS 的领域）、穿透（指 method 查找越界，另一通道）、作用域隔离（泛化）

**开放边界（open）**:
`x-component` 的**声明侧**布尔开关（`.open` 修饰符 ≡ `x-component-options="{open:true}"`）：开放该组件的数据边界。默认封闭是**作者契约**——消费侧（x-use-options）只能覆盖已开放组件的基准，不能打开封闭组件。**open 不传播**：开放组件内嵌套声明的私有子组件仍默认封闭（各组件定义独立持有）。
_Avoid_: public / expose（对外词汇不一致）、透明模式（不表达「声明侧契约 + 不可被消费侧打开」语义）

**scope 基准（Scope Basis）**:
开放状态下的上下文继承基准，组件与覆盖层家族通用（组件用 `host` 指消费处，overlay 沿用 `consumer`——同一概念两表达面）。组件两值：`'host'`（默认，消费处上下文 ≈ 封闭化之前的既有行为）| `'declarer'`（声明处上下文，词法基准——嵌套私有子组件的声明处是外层组件的实例 scope）。解析链：`x-use-options.scope`（消费覆盖，仅已开放组件生效）> `x-component-options.scope`（作者默认，须配合 open）> `'host'`。三类退化（均 warn 一次）：作者侧 scope 无 open、消费侧 scope 落封闭组件、全局组件声明 declarer（无声明 scope）；declarer 声明 scope 销毁后悬空降级封闭。
_Avoid_: 数据源（那是异步源家族术语）、上下文基准（中英混杂）、基准点

**组件查找（Component Lookup）**:
`getComponent` 沿 scope 链就近 + 全局兜底，与原 getBlock 同构。default 唯一性放宽（同名 warn+覆盖）。
_Avoid_: 组件解析、组件匹配（查找是按 scope 链就近+全局兜底，非内容匹配）

## 已废弃

**x-show 别名（x-show as x-if.keep alias）**:
已废弃。x-show 曾是 `x-if.keep` 的解析期别名（`getDirectives.ts` 归一化为 `if` + `keep` 修饰符，零运行时实体），把「条件存在性」与「条件可见性」两个正交概念合并成一指令的两态，造成 `.keep` 到底 detach 还是 display:none 的语义反复。现拆分：x-show 独立为可见性指令（display:none），`x-if.keep` 升级为存在性指令（detach 保活）。详见 ADR-0016。
_Avoid_: （不再使用）

**`.keep` 修饰符（已更名为 `.keepalive`）**:
已废弃。`x-if` 的 `.keep` 修饰符（及对应指令选项键 `keep`，即 `x-if-options="{keep:true}"`）已重命名为 **`.keepalive`** / 键 `keepalive`，语义不变（摘宿主但保活子树与 watcher，见「条件存在性 / x-if」）。更名理由：「保活」直译、与通用 keep-alive 概念对齐（注意此处保活的是子树 DOM + watcher，非 Vue 的组件实例）。
_Avoid_: `.keep`（已更名为 `.keepalive`）、`x-if-options="{keep:true}"`（改用 `{keepalive:true}`）

**位置参数修饰符（Positional Modifier Argument）**:
已被废弃的修饰符带值语法，形如 `.debounce.500` 中句点后的数字段。带值配置现统一走**指令选项**（如 `x-on-options="{debounce:500}"`）。详见 ADR-0007。
_Avoid_: （不再使用）

**x-block / blocks / getBlock 全套术语**:
已废弃，升级为 x-component / components / getComponent（ADR-0022）。default 块唯一性抛错语义亦废止，改为 warn + 后者覆盖。
_Avoid_: （不再使用）

**AutoTemplate / AutoStore Template（旧品牌名）**:
已废弃。项目品牌更名为 **AutoSpark**（ADR-0030）：npm 包名 `autospark`、代码标识符前缀 `AutoSpark*`、IIFE 全局变量 `AutoSparkSpaces`。历史 ADR 正文中的旧名保留原词，作为决策当时的记录；活文档（本表、specs、docs/zh）一律用新名。
_Avoid_: AutoTemplate Engine、AutoStore Template（均系更名前旧称）

**`type="actions"` / `type="setup"`（script type 裸值写法）**:
已废弃，升级为 `autospark/actions` / `autospark/setup`（ADR-0031 命名空间化，规避裸 type 值与他库/标准扩展撞车）。旧写法编译期 warn + 剪枝不执行——actions 脚本未注册、setup 脚本不再求值，失效可发现。`<script setup>` 布尔属性形态不受影响。
_Avoid_: type="actions"、type="setup"（改用 autospark/ 前缀写法）

**`visible`（x-loading 配置键）**:
已废弃，更名为 `value`（与指令值统一：快速绑定整值即 value 表达式）。旧键编译期 warn + 忽略不生效——缺失 value ≡ 裸属性恒显示，失效可发现。历史 ADR（0008/0021）正文保留旧称。
_Avoid_: visible（x-loading 配置对象内改用 value；x-show 等指令的 visible 状态字段名不受影响）

**加载覆盖层（x-loading 旧称）**:
已废弃，更名为**加载遮罩（Loading Mask）**——「覆盖层」词汇整体让渡给 x-overlay 弹层家族（覆盖层定义 / 覆盖层实例），x-loading 在宿主上方的覆盖指示层改称遮罩，语义不变。历史 ADR（0008/0021/0038 等）正文保留旧称，作为决策当时的记录。
_Avoid_: 覆盖层（裸词现指 x-overlay 家族）、loading 层、浮层
