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
引擎自动注册的信号型全局 action（`yes` / `no` / `cancel` / `close` / `back`）：handle **透传首参**（`close(1)` → resolved 广播 `result:1`），价值在**广播语义**——祖先监听 `action:close` 等 DOM 冒泡事件（`detail.result` 读信号载荷）即可驱动关闭对话框/确认/取消等通用交互。`back` 无信号载荷，点击即 `history.back()`（ADR-0066 随内置 error 组件引入）。用户同名声明覆盖内置。详见 ADR-0036 决策 7。
_Avoid_: 默认动作（泛化）、系统动作（易与 DOM/浏览器原生事件联想）、公共动作（它们是信号不是共享实现）

### 配置层

**修饰符（Modifier）**:
指令名句点后、**无参数**的开关项，启用某项内置行为。它在解析期被注入为同名**指令选项**（布尔 `true`），故指令层不再单独读取修饰符——修饰符只是指令选项的快捷写法。是否提供某修饰符快捷方式，由指令作者决定。
_Avoid_: 修饰语、flag、参数（修饰符不带值）

**指令选项（Directive Option）**:
由 `x-{name}-options` 声明的**指令级**配置来源，是该指令的权威配置（修饰符在解析期并入其中）。整包形态值用宽松 JSON（relaxed-json）解析，须为普通对象；单个成员可拆散为「选项成员属性」（值为表达式）、可经「选项定向」配到特定参数实例。详见 ADR-0007 及其修订记录。
_Avoid_: 参数对象、props

**选项成员属性（Option Member Attribute）**:
`x-<指令名>-options.<选项名>` 形态的独立属性，把单个指令选项**拆散声明**：值为**表达式**（与指令值同一 watch 管道，可绑定响应式状态；顶层字符串字面量须 `"'xxxx'"`），优先级高于整包内嵌同名项（整键覆盖）。camelCase 键以 **kebab-case** 书写（HTML 属性名被 DOM 小写化，`close-on-mask` 归一 `closeOnMask`）。配置成员在指令既有消费时机生效，不热应用（props 是唯一热应用成员）。与「运行时选项覆盖」（ADR-0051 的 `data-*` 覆盖属性）正交：这是编译期声明面，那是运行时变更面。详见 ADR-0007 修订记录。
_Avoid_: 局部选项（泛化）、单键配置、成员修饰符（它是属性不是 modifier）、camelCase 属性名书写（DOM 小写化约束，须 kebab-case）

**选项定向（Option Targeting）**:
`x-<指令名>-options:<属性参数>` 前缀：把 options 声明（整包或成员）**定向到同元素同名主指令的特定参数实例**（如 `x-dialog-options:user.props` 定向 attr=user 的 x-dialog）——多同名指令同元素的精确配对通道。消歧：冒号后首段匹配主指令 attr 即定向、否则视为成员；定向找不到主指令静默丢弃。
_Avoid_: 参数化选项、命名选项（泛化）

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

**浅响应 / shallow（x-data）**:
x-data 数据域的**响应深度开关**（显式 opt-in，默认全深不变）：三入口同义——`.shallow` 修饰符（**0 档**）/ `x-data-options="{shallow:1}"`（**1 档**，显式选项键静默精调覆盖修饰符）/ 数据脚本 `options` 属性（同键同义）。档位语义：**0 档**域内容器仅一层浅代理——顶层键赋值（含整体替换）有事件，**键内字段深写静默失效**（读出即原始引用，仅整体替换键值可唤醒深路径订阅）、嵌套 computed 不激活；**1 档**顶层键成员再获一层浅代理——第二层字段（`user.name`）写有事件，第三层起失效。仅私有域（local 挂载形态）支持，root/path 声明 warn + 忽略；异步落地与 `engine.data()` 追加自动继承域档位。与 `$notifications` 的 shallow 选项（ADR-0072/0077）同词汇，值域 `0|1`。详见 ADR-0078。
_Avoid_: deep / `.deep` / `deep:true`（被否决的命名体系，该修饰符与选项键不存在）、浅代理（autostore 机制词汇，不承载档位语义）、深度 N≥2（autostore 值域仅 `0|1`，越界归 1）

**数据脚本 / Data Script**:
`<script type="autospark/data">`：父元素数据域的 **JS 对象字面量声明源**（x-data 的超集，非字面等效）。只作用于**直接父元素**（与 `autospark/actions` 的最近祖先语义有意分歧——数据是结构性的，归属必须一眼确定）；多个数据脚本与 x-data 经 `deepMerge` 深合并（数组替换、undefined 不覆盖、函数整体覆盖），**x-data 最后合并、优先级最高**；`options` 属性承载 mount/global/nearest/shallow（父元素 `x-data-options` 权威，冲突忽略 + warn）；求值注入 `computed`/`configurable`/`watch`，**普通函数值是 computed 简写**（方法归 `autospark/actions` / `<script setup>`；watch 是纯副作用声明，引擎注入后强制首读激活）。编译前预扫合成单一数据对象走既有挂载管道（位置无关、每实例独立数据域、回收同权）。详见 ADR-0032。
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
x-style / :style 的修饰符（仅 `attr === 'style'`），每次写样式时注入一条 CSS `transition` 声明，让内联样式的响应式变化被浏览器自动过渡动画，默认 `all 0.2s ease-in`。值取三级优先：用户样式对象自带的 `transition` key（显式）> `getOption('transition')`（`.transition` 注入的 `true`、或 `x-bind-options` 传的字符串）> 默认值。带 `.transition` 时覆盖/关闭须用 `x-bind-options`（指令选项层，早于修饰符合并），`x-options`（宿主层）被修饰符遮蔽、不生效。详见 ADR-0015。
_Avoid_: `animate`（那是结构指令的**进出场动画**选项——「元素在进出」，见「动画层」；本修饰符是「值在变」的属性过渡，二者正交）、`.smooth`/`.animated`（牺牲与 CSS `transition` 属性的直觉映射）

### 显隐控制层

**锚点注释（Anchor Comment）**:
x-if（eager / `.keepalive`）条件为假时留在宿主原位的注释节点，作宿主重挂载的 DOM 书签——随 DOM 移动、`parentNode` 恒为当前父，重插位稳定。仅 x-if 家族使用；x-show 宿主永留 DOM，无锚点。
_Avoid_: 占位符（歧义大，本表保留给空值渲染）、marker、占位节点

**条件存在性 / x-if（Conditional Presence）**:
x-if 控制宿主**是否存在于 DOM 树**。条件为假时**摘除宿主**（detach）并以锚点注释占位——宿主离开 DOM，不再被 `querySelector` / `:nth-child` / 表单提交命中。`.keepalive` 修饰符切两态：eager（默认）假时**销毁子树 scope**、真时重编译子树；`.keepalive` 假时**保活子树与 watcher**、真时原宿主 reattach（状态保留）。eager 占子树（ownsChildren）故与 x-for / x-component 同元素冲突；`.keepalive` 不占子树，可与 x-for / x-component 共存（与组件同元素 = 显隐保活，ADR-0022 决策五-5 修订注）。
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

### 传送层

**传送 / x-teleport（Teleport）**:
宿主元素脱离声明位置、挂到指定目标下的**一次性静态**结构指令（ADR-0059）：值为目标选择器字面量（`queryRelElement` 四形态：`/.foo` 全局、`../.foo` 父级爬升、`.foo` 宿主内、`^form` closest）。编译期接管子树（ownsChildren 剪枝），结果树挂载后的微任务解析目标 → 原位锚点注释 → 搬移宿主 → 按数据视图基准编译子树。三类失败（未命中 / 环与自引用 / 目标断连）均 warn + 原地渲染（降级不丢内容）。与 x-dialog 分工：无遮罩/打开栈/实例管理的静态轻量弹层（`/.body` + 外层 x-if），x-dialog 不被取代。
_Avoid_: 动态传送（值静态不响应式，运行时换挂载点不支持）、传送动画（v1 不接 animate，显隐动画由同元素 x-show 承担）、弹层（那是 overlay 家族词汇）、移动元素（泛化——搬移的是宿主自身，声明位置留锚点注释）

**传送目标（Teleport Target）**:
`x-teleport` 值解析出的挂载点元素。查询 defer 到结果树挂载后的微任务（编译期查询会命中尚未替换的旧模板树）；目标在 engine 树外时宿主子树经 `addExtraRoot` 登记 observer 视野（overlay 先例）；目标后续被移除则宿主成 detached 孤儿，不追踪不回收（文档声明）。
_Avoid_: 挂载点（泛化）、to（Vue 词汇）、锚点（锚点注释是原位书签，与目标相反端）

**x-teleport 数据视图基准（dataContext）**:
数据视图基准家族的 x-teleport 变体（ADR-0059）：`declarer`（默认，声明处上下文——宿主 scope 保持编译期 parent 链，DOM 移走数据视图不动）；`host`（挂载点上下文——搬移后 `findScopeByEl(目标)` 重挂宿主 scope parent 到目标所属 scope，重挂发生在子树编译前，故精准订阅按新链解析）；目标无所属 scope（engine 外直挂）降级 rootless 全局视图。`.host` 修饰符 ≡ `dataContext:'host'`。与组件/覆盖物家族的同名配置语义同源（host=消费位置、declarer=声明位置），轻量解析不依赖 ComponentDef。
_Avoid_: scope 键（家族旧键已废弃，ADR-0053 修订）

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

### 尺寸调节层

**尺寸调节 / x-resize（Resize）**:
宿主元素尺寸的拖拽调节指令（ADR-0064）：**可选值双向**——无值 = 纯 DOM 直改 `style.width/height`；有值（`x-resize="size"`）= 双向绑定，拖拽中实时写回 `{width, height}`（px number，经调度器合并），外部改状态反向同步宿主（过「尺寸钳制」管线、等值短路防循环），语义与 x-model 的双向同源。Compile 类（编译期注入「调节手柄」+ 建绑定），动态启停用 x-if 包宿主表达，不发明值语法。
_Avoid_: 缩放（那是 transform scale 语义）、可调节（泛化）、resize 绑定（它是交互指令，值是数据通道不是绑定目标）

**调节手柄 / Resize Handle**:
编译期注入宿主的**真实子元素**（`data-autospark-resize-handle="<方向>"` 契约，不参与子树重编译），可聚焦，方向键 ±1px / Shift+方向键 ±10px 微调（同「尺寸钳制」管线）。视觉经类级 `initialize` 全局注入（幂等），CSS 变量 `--autospark-resize-handle-*` 定制。8 向完整支持需宿主 `absolute/fixed`——文档流元素只保留自然方向（e/s/se），其余方向编译期丢弃 + warn（不自动改 position）。
_Avoid_: 拖拽手柄（那是 x-tree 拖拽预留的 drag handle 概念）、grip / sizer（英文别名）、resize 控件（它是子元素不是控件）

**方向枚举 / handles**:
八方向枚举 `n/s/e/w/ne/nw/se/sw`（北=上）。声明走 `handles` 选项（逗号串或数组），修饰符 `x-resize.e.s.se` 解析期并入（ADR-0007）；默认 `e,s,se`（流内自然最大集——流内元素左/上边缘锚定布局位，反向拖拽需补偿 left/top，非自然方向仅对定位元素开放）。**grid item 豁免**（ADR-0074）：父容器 `display:grid` 时 `w` 放行且免位置补偿——轨道定位下 width 单写即对缘让位；`n` 仍保守丢弃（行轨道下顶缘跟手性不保证）。
_Avoid_: 四边四角（口语——边和角统一叫方向）、edges（同上）、方位（泛化）

**尺寸钳制 / Clamp Chain**:
调节量的统一处理管线：**raw Δ → snap 吸附 → aspectRatio 等比 → min/max 钳制**（钳制恒最后，约束是硬边界）。约束值 `number`（px）| CSS 长度串；来源回退链：指令选项（`minWidth/maxWidth/minHeight/maxHeight`）→ 宿主 computed `min-width/max-width`（CSS 声明的约束天然生效，指令选项显式值优先）。`snap`（px 步进，默认 0 关）、`aspectRatio`（宽/高数值）。
_Avoid_: 边界限制（泛化）、min/max 选项（它们是四个独立键的统称，不是键名）、CSS 约束优先（方向反——指令选项才是权威层）

**调节事件 / resize:\***:
resize 手势生命周期的 DOM 冒泡事件（宿主派发）：`resize:start` / `resize:move`（持续） / `resize:end`，`detail = { width, height, handle }`（px number，end 为最终值），外界 `@resize:end="..."` 接。冒号命名空间对齐 `tree:*` / `tooltip:*` / `overlay:*` 惯例（grilling 共识曾为连字符，落盘时对齐家族词汇修正）；覆盖物形态同样派发在**指令宿主**（非 shell），绑定语法不变。
_Avoid_: resize-start 连字符（家族惯例是冒号命名空间）、裸 resize（与 DOM 原生 window resize 事件撞名）、resizing（英文进行态——move 对齐 tree:expand 的动词本干风格）

**覆盖物尺寸调节 / overlay resize（drawer / dialog）**:
覆盖物消费者的 `resize` 选项（ADR-0064）：`true`（方向自动推导 + 默认约束）| 对象（字段与 x-resize 选项表同构；`handles` 只能在合法集内**收窄**，越界 warn + 忽略）。方向推导贴合形态几何：drawer 贴边内侧单边（`placement: left` → `e`，类推）、dialog 四角（`ne,nw,se,sw`）。写路径走 **shell 定位体系**（与普通元素 style 直改分离，钳制/手柄/指针核心逻辑复用）；**不写回 store**（「调节事件」detail 即数据出口——overlay 选项语法无绑定位）；尺寸**会话内记忆**（指令实例状态，重开沿用、优先于声明 `size` / CSS 尺寸，engine destroy 才清）。
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
_Avoid_: 拖拽手柄（那是 x-resize 的 Resize Handle 概念）、指示线（只是它的视觉层，命中区是本体）、分割线（泛化）、grip / sizer（英文别名）

**折叠（x-splitter）**:
定容面板声明 `data-expandable` 启用的折叠（ADR-0070：机制整体组合 x-expandable，`collapsible` 选项与分隔条把手已清除）——面板上实例化 x-expandable，把手/动画/事件全走其原生管线。**折叠布尔为真相**（expandable 持有，ADR-0067 决策七在组合语境被推翻；派生检测仅存「拖拽跨折叠目标 → 翻转布尔」单点）。折叠目标 = `data-expandable` 的 `minSize`（未声明或 0 = 负 margin 滑出、`> 0` = 收缩迷你形态，`data-minimize-size` 已删除）；`direction` 按 sized 位次推导（首位 `left`/次位 `right`，vertical 类推，options 中写无效）；展开尺寸由 splitter 写回（`lastSize` 记忆链保留——面板尺寸经拖拽动态产生；options 中 `maxSize` 无效 warn）。把手骑面板活动边线（即分隔条所在边界，几何与旧分隔条把手重合）、默认 `showTrigger:'hover'`——分隔条本身充当**全长感应线**（divider hover 经桥接类显形把手，x-expandable 感应边条在本语境被样式表抑制以免遮挡拖拽命中区）、折叠态恒显。事件 `expandable:collapse/expand` 面板派发冒泡（`splitter:collapse/expand` 已删除，宿主监听靠冒泡）；`splitter:resize` 不受影响。属性值专职 options JSON（空属性 = 全默认），折叠态内部持有、程序控制经事件外泄。初始声明尺寸等于 minSize 即初始折叠（无动画不派发）。
_Avoid_: collapsible（已删除的旧容器选项）、minimize-size（已删除，折叠目标归 `data-expandable` 的 `minSize`）、collapsed 状态（组合后布尔为真相，派生词汇过时）、收起（单向词，折叠是双向翻转）、width:0 折叠（0 目标 = 负 margin 滑出）

### 布局层

**布局容器 / x-layout（Layout）**:
grid 骨架结构指令（ADR-0074）：宿主直接子元素中只认 x-pane 标记的**布局窗格**（其余编译期剪枝 + warn），编译期按窗格组合动态生成 `grid-template-areas`——header 全宽是缺省态，行带归属由窗格存在性与 through 组合决定。gap = 所有相邻窗格间距（number 按 px / 字符串原样作 CSS `gap` 值）。纯布局零视觉（背景/边框全由用户窗格自带），所有窗格 `position:relative`。嵌套零新机制（窗格归属**最近 x-layout 祖先**，窗格内是正常编译子树——可嵌 x-splitter / 子 layout）。ownsChildren：宿主区域自动成为 engine.patch 动态区域。
_Avoid_: 布局组件（无组件机制参与）、页面框架（泛化）、面板容器（那是 x-splitter 语境词汇）

**布局窗格 / Layout Pane（x-pane）**:
布局容器的**布局单元**——`x-pane:参数` 标记的直接子元素，参数词表固定 `header | content | sidebar | footer`；`sidebar` 必带 `.left` / `.right` 修饰符（缺省按 `.left`），参数不在词表 warn + 剪枝。content 必需（缺失 warn + 降级渲染空容器），header/footer/sidebar 可选。同侧多窗格按 DOM 序并排，**仅首个有 through 资格**。存在性与 x-if / x-show 正交配合（见「布局回流」）。
_Avoid_: 面板 / Pane（那是 x-splitter 的子元素正名——两概念并存，须以全称 Layout Pane / 分割器面板消歧）、x-slot（那是组件插槽出口，ADR-0056，命名竞选时因撞名被否）、区域 / region（命名竞选中落选词，勿混用）、布局块（x-block 是已废弃词条）

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
未参与分割的窗格的尺寸通道：**sidebar 默认注入** x-resize（内缘单方向手柄——left 拖东缘 / right 拖西缘）+ x-expandable（`compose` 程序化组合，ADR-0070 先例），拖拽跨折叠目标自动翻转折叠布尔（折叠目标 / lastSize 恢复链沿用 splitter 模型）；header / footer 显式挂 `x-resize` 合法（auto 轨道跟随元素尺寸）、content 上挂 warn（1fr 轨道拖拽无效）。**显式声明优先于默认注入**（options 全生效）；默认注入 = 内部态，状态绑定须显式 `x-expandable="路径"`；opt-out = `x-pane-options={expandable:false}` / `{resize:false}`；注入实例的 options 读同元素 `x-expandable-options`。默认尺寸（header/footer 64px、sidebar 240px）经 CSS 变量注入——用户 CSS 与窗格选项（`{height}` / `{width}`，inline）两条覆盖路都通。
_Avoid_: 默认可调（header/footer/sidebar 之外的窗格无默认注入）、单向吸收（pane 间分割是守恒语义，单侧吸收被否决）

### 展开折叠层

**展开折叠 / x-expandable（Expandable）**:
宿主元素的通用展开/折叠指令：值是**展开态布尔**（true=展开）双向绑定——简单路径点击把手经 `setVal` 回写（x-model 防循环纪律同款）、表达式 warn 一次只读降级。`direction` 指收起方向（停靠边：`left` = 向左收起，把手骑活动边即对侧边线；默认 `left`）。折叠通道由 `minSize` 分派：`0`（默认）= **滑出折叠**——宽度/高度保持不改，`collapse:'margin'`（默认）负 margin 滑出（占位归零、兄弟流入）或 `'slide'` transform 平移（占位不变，服务 fixed 覆盖形态），终态持续保持不归零；`> 0` = 尺寸收缩动画（width/height 过渡至 minSize，子内容不隐藏——迷你形态内容可见）。展开时 `maxSize` 有值写内联尺寸、缺省移除内联尺寸由 CSS 决定（不快照记忆）。初始值 false 编译期立即应用折叠态、无动画（splitter 惯例）。**折叠机制唯一实现**（ADR-0070 组合落定）：x-splitter 经面板 `data-expandable` 声明全机制组合（折叠布尔由本指令持有，splitter 折叠不再是纯派生态）；x-drawer 经共享把手模块统一把手层（折叠 ≡ visible 归假语义不变）。**内建单边 resize**（ADR-0072 内建 + ADR-0073 迁移）：`resize` 选项启用（方向由折叠方向推导、复用 x-resize 的 ResizeSession 核心、拖出尺寸接管展开尺寸真相），`enable:false` 退化为纯单边 resize——**与 x-resize 同元素互斥**（x-resize 自失效，边线交互单指令独占）；把手与手柄同骑活动边线时**把手压手柄之上**（宿主 `data-resize` 标记 + 样式表抬层级——手柄带盖住把手会让折叠不可点）、**感应边条让位手柄**（手柄 hover/聚焦经 `data-edge-hover` 桥接显形把手，与 splitter/drawer 同一契约）；drawer 的 resize 迁移至此通道（组合 `resized` 钩子路由会话记忆，dialog 四角保留 overlay 机制；splitter 面板调节走分隔条拖拽、`data-expandable` 的 resize 被接管 warn 忽略）。事件 `expandable:expand` / `expandable:collapse`（宿主派发、冒泡、detail `{size}`）。
_Avoid_: collapsed 状态（splitter 组合后布尔为真相，派生词汇已过时）、收起（单向词）、toggle / trigger（drawer 把手先后废弃的旧选项名，统一 `expandable`）、推挤 / push（未实现形态勿暗示）

**展开把手（Expandable Trigger）**:
**圆心骑边线**的圆形折叠控制按钮（20px、内置全局图标 `arrow`、样式契约同 splitter 折叠把手；`role=button` 键盘可达、箭头随折叠态翻转指向下一步动作）：展开态圆心骑宿主**活动边线**（外半圆突出）；滑出折叠态圆心骑父容器**停靠边线**（外一半被裁呈半圆把手，drawer 形态），图标缩至 0.65 倍并平移 1/4 圆径移入半圆中心保完整可见。滑轨坐标 `pos` 三态对齐家族惯例（`'center'` 默认 ≡ `'50%'` / number=px / CSS 长度串负值距对端，越界静默钳制——把手是唯一重开触点）。**动态挂载（reparent）**：展开态挂宿主内骑活动边；滑出折叠（minSize=0）完成后移入父容器骑停靠边线（宿主滑出后其内子元素随容器裁剪，把手外迁保常驻可达；滑出全程圆心恒贴边线，reparent 零跳变），展开动画启动前移回宿主；minSize>0 折叠不迁移（宿主不滑出）。折叠态子内容经 `[data-collapsed]` 规则 `visibility:hidden`（把手排除）——宿主自身不能 `overflow:hidden`（宽度保持的盒子会把 absolute 把手一并裁掉）；把手定位上下文由指令在宿主 computed `position` 为 static 时 inline 补 `relative`（fixed/absolute 宿主不动——slide 通道的覆盖形态）。**层级**：把手 z5、感应边条 z4、resize 手柄 z10；**同宿主启用内建 resize 时把手压手柄之上**（z11，否则调节线横穿圆面且命中被拦 → hover 模式下折叠不可点），手柄 hover/聚焦经 `data-edge-hover` 桥接显形把手（drawer 让位语义方向相反：其把手在覆盖物容器、层级抬不动只能把命中让给手柄）。**共享把手模块**（ADR-0070）：把手机制（元素构建/滑轨坐标/半圆折叠态/箭头矩阵）抽为独立模块，x-drawer 为第二消费者——抽屉把手不再有独立实现，本词条类名与变量族即全引擎折叠把手的唯一契约。
_Avoid_: 抽屉把手（x-drawer 已组合本机制，见「抽屉把手」词条）、拖拽手柄 / resize handle（x-resize 词汇）、grip（英文别名）、toggle 按钮（同已废弃词）

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

### 覆盖物（Overlay）

**覆盖物（Overlay）**:
任意组件被渲染到 `document.body` 容器的**消费方式**——内容就是普通组件（`x-define` 声明 / `options.components` 全局注册 / `x-import` 加载），**无独立声明指令**（旧 `x-overlay` 声明语法已删）。消费者指令（x-dialog 等）按组件名沿 scope 链就近 + 全局兜底查找（镜像组件查找协议 `getComponentDeclaration`），状态驱动地实例化渲染到 body 下本 engine 的覆盖物容器。详见 ADR-0052（修订版：组件化统一）。
_Avoid_: 覆盖层（旧称，随声明指令一起废弃）、弹层模板（泛化）、overlay 组件（无 x-component 参与）、内联弹层

**覆盖物实例（Overlay Instance）**:
覆盖物被消费者打开渲染出的**活体**：组件快照经独立 scope + watcher 子树编译（data/props、methods、hooks、scoped CSS 全生效），渲染进 body 下本 engine 的覆盖物容器。**每次打开新实例**（singleton 未引入）、关闭动画播完即销毁、多实例可并存；层叠 = DOM 追加顺序。挂链即基准（数据视图基准 `dataContext` 三合一：表达式上下文 / 数据视图 / 生命周期统一由 parentScope 表达，默认 `declarer`）。
_Avoid_: overlay 对象、弹层实例（泛化）、对话框实例（那是 x-dialog 消费者视角的产物）、单例（机制未引入）

**覆盖物消费者（Overlay Consumer）**:
把覆盖物组件实例化并驱动其生命周期的指令族（x-dialog / x-popover / x-drawer 已落地，x-popup 预留）：`OverlayDirective` 基座（继承组件实例化基座 `ComponentDirective`，ADR-0054 更名）上的**薄子类**，只叠加形态差异（外壳 / 定位 / 触发 / 关闭行为）；visible 驱动四形态承载于中间抽象基座 `VisibleOverlayDirective`（dialog 与 drawer 平级继承，ADR-0063）。**纯状态驱动**（家族默认；x-popover 的悬浮触发为唯一显式偏离，见「悬浮触发」）——宿主是纯声明点（无隐式交互），值**专职 visible 布尔控制**（简单路径可回写 / 表达式 / 字面量，对象形态已废弃，ADR-0052 v2.3），真值即开；props 经「选项成员属性」`x-dialog-options.props` 注入组件 data 域（表达式求值 + 持续热更新，与 x-component props 同构）。配置两级合并：`内置默认 < x-dialog-options`（可定向到特定组件名实例；组件 def 不携带配置）。形态与模态**正交**：x-dialog 恒模态，x-drawer 默认模态、`mask: false` 可关（ADR-0062 官方 mask 选项的声明式读取面）。
_Avoid_: 触发器（家族默认宿主无隐式交互；悬浮形态例外见「悬浮触发」）、弹出指令（泛化）、调用方（action 语境词汇）、保留键封闭清单（非保留键隐式作 props 的分流已删除，ADR-0052 v2.3）

**贴边抽屉（Drawer）**:
覆盖物消费者的贴边形态（x-drawer，ADR-0063）：面板从屏幕四边（默认）或锚元素边缘滑入滑出。**双定位模式**——屏幕贴边（无 `at`：fixed 贴视口对应边，贴边轴全屏展开）与**元素贴边锚定**（`at.selector` 命中：面板终态贴锚元素对应边**内侧**、恒在锚内不越界，**长轴 = 锚边长**随锚/视口变化重同步）；经实例定位策略钩子（`positioner`）整体接管，锚定未命中**回退屏幕贴边**（非家族「退居中」——居中对抽屉无意义）。`at.placement` 四主方向（展开/滑入起始边）、默认 `right`（`auto`/`-start/-end`/非法值两模式一律静默归一；浮动定位子键 `flip`/`offset`/`shift` 静默忽略）、无箭头。短轴尺寸走 `size` 选项（number/CSS 长度，方向中立，引擎 inline 写入，ADR-0063 实施期修订），缺省回退 CSS 变量 `--autospark-drawer-size`；声明 `resize` 选项启用拖拽调短轴后，会话内记忆值优先于声明 `size` 生效（见「覆盖物尺寸调节」）；默认动画 `'drawer'`（遮罩淡入淡出 + 面板位移滑入滑出，主流 drawer 形态语言）；默认带**抽屉把手**（`expandable` 选项，见专条，`expandable: false` 显式关闭、`pos` 沿边线滑轨可定位）；内置外壳 `drawer-shell`（直角、无箭头载体）。嵌套零新机制（子消费者声明在父组件模板内，ESC 打开栈只关栈顶）。
_Avoid_: 侧滑菜单（泛化场景词）、局部抽屉（指锚定模式时直说「元素贴边锚定」）、推挤模式（push mode 未实现，勿暗示）

**抽屉把手（Drawer Trigger）**:
贴边抽屉的常驻折叠/展开控制按钮（x-drawer `expandable` 选项，**默认开启**、`false` 显式关闭；ADR-0070：把手机制由 x-expandable 共享把手模块统一提供，旧 `trigger` 选项与 `.autospark-drawer-trigger` 类名、`--autospark-drawer-trigger-size` 变量已删除，契约统一为 `.autospark-expandable-trigger` / `--autospark-expandable-trigger-*`）。**折叠 ≡ visible 归假**（无第三态）：点把手即写回状态，面板滑出销毁、重开重建（「每次打开新实例」家族语义，内容运行态不保留）；把手是覆盖物家族**首个实例外常驻交互元素**——面板销毁后存活（生命周期挂指令实例，宿主脱离 / scope 死亡 / engine 销毁时摘除），折叠后骑屏幕边（屏幕模式）或锚内侧边线（锚定模式）露**面板展开侧**半圆，展开/折叠时沿边线同步滑移（与面板同曲线）。沿边线**滑轨位置**由 `expandable: { pos }` 控制（**边缘锚定模型**：正距主边 top/left、负距对面边 bottom/right 的绝对距离，`true` = 居中语法糖 ≡ `'50%'`；越界静默钳制——把手是唯一重开触发点，永可达），支持成员属性表达式响应式重定位；展开态无阴影（视觉属于面板）、折叠态保留阴影（独立浮起提示可点）。显隐 `showTrigger` 默认 `'hover'`：展开态隐藏、hover/聚焦显形（含全长固定定位感应边条，随把手同一边线基准同步）；**折叠态恒显**（唯一重开触点不可让渡）、触屏恒显。与 `mask` 正交。
_消歧_: 本词条的把手是**引擎生成的常驻按钮**——区别于 x-popover / x-tooltip 的「宿主触发器」（用户模板中的元素，见「悬浮触发」）与 action 的 triggerEl（事件派发点）；文档中指涉把手时优先用「把手」、写选项名时用 `expandable`。
_Avoid_: trigger（已删除的旧选项名）、toggle（更早废弃的选项名）、停靠 / dock、折叠态 / collapsed state、peek、最小化 / minimize（均在暗示「折叠是独立第三态」——折叠就是 visible 归假）、收起按钮（泛化，把手的语义是双向控制不只是收）

**面板外壳（Shell）**:
覆盖物**面板层形态**的可替换载体——一个声明了默认出口的普通组件，负责面板的边框 / 圆角 / 背景 / 箭头 / 内容布局；内容组件经默认出口进入外壳。**外壳不含遮罩**（遮罩是引擎结构，模态行为的一部分，换外壳不影响遮罩 / 定位 / 动画 / 关闭等行为）；箭头由外壳渲染、引擎定位。内置默认外壳寄存于 `options.uiShells` 引擎级注册表（ADR-0077——键 = 消费者裸名 `dialog` / `popover` / `drawer`，用户同键浅覆盖）开箱即用、不占用户组件命名空间；自定义外壳与内容组件同一查找协议，未命中回退内置默认。配置链：实例选项 > 宿主选项 > 引擎级默认（`options.overlay.{kind}.shell`）> uiShells > 内置默认。
_Avoid_: 包装器（wrapper，曾用名，已定名 shell）、皮肤（弱化了结构 + 出口职责）、容器（与覆盖物容器撞名）、mask（遮罩不归外壳）、面板（面板是外壳渲染出的那一层 DOM，外壳是渲染它的组件）、dialog-shell / popover-shell / drawer-shell（旧组件名已退役——uiShells 键为 dialog/popover/drawer）

**悬浮触发（Hover Trigger）**:
x-popover 的触发模型（ADR-0060，家族「纯状态驱动」的唯一显式偏离）：宿主是**悬浮触发器**——`mouseenter`/`mouseleave` 悬浮意图语义（非字面 mouseover）驱动显示；指令值不参与驱动、无 visible 真相源（非空值 warn）。**共享 hover 域**：宿主与面板（body 容器内、DOM 分离）双侧监听视为同一域，宿主↔面板互移不闪关；离开域经 `delayHide`（默认 150ms）宽限关闭、宽限内回域取消；`delayShow`（默认 200ms）为悬浮意图延迟，快速掠过不触发。**hover 链**：嵌套 popover 经 document 级打开中注册表把后代域并入祖先域（指针位于任一后代 popover 上祖先保持），后代关闭后祖先经最后指针坐标 `elementFromPoint` 重估、已出域才关（ESC 关子父不残留）。形态默认：裸面板、锚=宿主自身、`placement` 默认 `'bottom'`（`at` 显式换锚只改位置不换触发关系）。悬浮离开走直接 UI 关闭（无写回目标，不经「请求关闭」）；ESC 照常走打开栈请求关闭。触摸设备 v1 不适配（触屏用 x-dialog）。
_Avoid_: mouseover 触发（字面 mouseover 冒泡、子元素间移动反复触发，非本语义）、tooltip（悬浮提示只是场景之一，本词条是触发模型）、外点关闭（已否决的关闭触点——离开即关场景下冗余）、混合驱动（悬浮之外再挂 visible 值通道 = 两个真相源，已否决）

**请求关闭（Request Close）**:
覆盖物关闭动作（ESC / 点遮罩 / close action）的统一语义——关闭是「请求」不是命令：visible 可回写（简单路径）则回写 `false`（状态是唯一真相源）；不可回写（表达式/字面量）仅 UI 关闭 + `overlay:close` 广播由用户善后。已知边界：表达式形态关闭后依赖变化重求值仍真会**重开**。子树内 close action 由消费者在实例根上委托监听（覆盖物 DOM 在 body 下，engine 树收不到冒泡）。
_Avoid_: 强制关闭（它是请求语义）、自动回写（仅简单路径可回写）、关闭回调（事件广播解耦，非配置函数）

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
`data-tooltip` 属性约定驱动的**全局工具提示**（ADR-0061）——引擎树内任意元素**零声明**生效（引擎级子系统 `TooltipManager`，非指令、非 overlay 消费者）。编译期静态 `title` 自动转换剥除（`title` → `data-tooltip` 值转移，双挂点：主 walk transformer + `compileChild` 项根 clone 行；`:title`/`x-bind:title` 绑定经 `BindDirective.created` 重定向写回 `data-tooltip`——「结果 DOM 无 title」不变量，原生浏览器 tooltip 从根上不可能出现）；手写 `data-tooltip` 委托照常生效（悬停现读属性，转换与消费两机制正交）。值两栖：字符串 = HTML 内容（经 `options.sanitizer` 消毒，x-html 同通道）；`{...}` = relaxed-json 配置（保留键封闭清单：`content`/`placement`/`offset`/`shift`/`flip`/`arrow`/`showDelay`/`hideDelay`/`className`/`maxWidth`/`maxHeight`/`border`/`animate`，未知键 warn）。委托监听 `mouseover`/`mouseout` + `focusin`/`focusout`（键盘可达）挂引擎根 + overlay 容器（body 侧渲染产物一并覆盖）；嵌套引擎按 `data-autospark` 根标识归属过滤防双显。**单例浮层**（每引擎一个共享 tip 元素常驻容器，内容随悬停目标切换）+ `showDelay`/`hideDelay` 延迟防抖（期间重新进入取消；移入浮层内取消隐藏——可交互 tooltip）。定位 floating-ui（`placement` 默认 `'top'` + flip，**不支持 `'auto'`**——小浮层与业界惯例，区别于 overlay 的 auto 默认），箭头默认开（复用 overlay 菱形伪元素视觉协议，载体类名 `autospark-tooltip-arrow`），`border` 默认开（暗底白字，配色 `--autospark-tooltip-bg/-fg/-border` CSS 变量）；最终方向写回 `data-tooltip-placement`。动画默认 `'slide'` **方向自适应**（复用全局 slide 六类名 + `.autospark-tooltip` 限定覆写层按弹出方位换 from 值——flip 改向动画自动跟随，150ms）。事件双通道 `tooltip:show`/`tooltip:hide`（payload `{el, tip}`，一切隐藏路径均广播）；命令式 `engine.tooltip.show(el, opts?)` / `hide()`（opts 与保留键同构单次覆盖，`content` 键优先于属性解析——无 DOM 属性注入内容）。`options.tooltip` 三态：缺省开启 / `false` 全关（title 保留原生、命令式 warn + no-op）/ 配置对象 = 全局默认（元素级覆盖）。详见 ADR-0061。
_Avoid_: data-tips（grilling 过程中的过渡命名，从未实施）、autospark-tip 类名（现行契约 `autospark-tooltip`）、x-tips 指令（非指令——属性约定驱动，与 observer 通道的 x-* 触发机制冲突）、title 属性（启用引擎后不进结果 DOM——全局转换剥除）、placement 'auto'（tooltip 不支持，小浮层用固定方向 + flip）

**浮层（Tip）**:
tooltip 的**单例浮层元素**（`autospark-tooltip` 类名契约）——每引擎一个、常驻 `autospark-tooltips` body 容器（首个 tooltip 显示时懒创建、`destroy()` 整体移除，overlays 容器先例），显示 = 填充内容 + 定位 + display，隐藏 = 离场动画后 display:none（不反复摘挂 DOM）。内容随悬停目标切换、上一目标的类名/边框/箭头全量重置。显示期间 rAF 兜底「曾连接 → 断开」跳变（x-for 回收 / patch / DOM 移除无事件可感知，立即隐藏）；`engine.stop()` 同步隐藏。
_Avoid_: tooltip 实例（无实例化概念——单例复用）、每元素独立浮层（单例是防多显的设计决策）

### 通知（Notification）

**通知 / notification（Notification）**:
引擎级子系统的**统一信息记录**（ADR-0071）——数据层收件箱式管理 + 屏幕分区栈呈现，承载轻提示 / 通知 / 业务提醒 / 任务跟踪。命令式 `engine.notifications.add(message | props | async factory)`（factory 求值 `undefined` → 静默跳过——条件通知）**返回组件实例**（ADR-0089——见「通知组件实例」词条；〔实施待启动，现行仍返回会话〕）；`engine.notifications` 继承 Map、键恒为 string id，可枚举范围 = 全部**存活记录**（`notifications.sessions` 即本表正名视图）。**记录与展示两态分离**：`persist`（ADR-0077 数值化 `0|1|2|3` + 常量 `NOTIFICATION_PERSIST`）决定记录存续——`0` 隐藏即删（toast 兼容）/ `1` **会话缓冲**（隐藏不删不持久化、复用 maxLen 淘汰、管理界面可再查看）/ `2` localStorage / `3` 服务器同步；`remove`/`delete`/`clear` **立即同步持久化**（local 即写 / remote 即 flush 全量覆盖）。展示走 queued / shown / closed 三态（按 pos 分区 FIFO 队列、同 id 原地更新、离场收拢，机制沿 ADR-0068）。记录级字段：`read`（卡片任意点击置已读）/ `status`（业务状态，引擎纯透传）/ `result`（action `value` 写入的应答）——**写一律走 `update(id, patch)` 单一通道**，session 只读 getter。辅助 API：`show(props | factory)` = `add` 别名 / `show(id)` 重显已隐藏记录（双形态消歧：字符串恒 id、对象恒新建——**发起统一入口**）、**type 快捷方式** `toast(props)` / `confirm(message, {yes,no}?)` / `task(props)`（均 ≡ `show({...props, type})` 强制对应 type；confirm 返回 **thenable** Confirm 会话——await 即得 choice 应答，sticky 永不 settle，`{yes,no}` 可提取键转按钮文案；task 返回 Task 会话，原 progressbar 糖同义更名）、`markRead(id)` / `markAllRead(type?)`、`load(url)` 服务器拉取（GET JSON 数组、按 id 覆盖合并、只入记录不弹）、`save()` 立即 flush 持久化。`maxLen` 存活记录数上限（溢出 FIFO 丢最旧，含会话缓冲记录）。**type 开放集合**（默认 `'toast'`；`'confirm'` 升内置——ADR-0077）驱动四层合并链 `内置默认 < options.notifications < types[type] < 单次 props` 与**双层渲染**（见「通知外壳」词条）。`anchor` **三职合一**（非定位——元素定位是 fast-follow）：局部 action 解析根 + 事件派发根 + **渲染数据视图基准（dataContext）**——anchor 存在时 shell 与 type renderer 挂链 anchor scope（表达式访问发起域数据），无 anchor rootless 仅 props。配套 action 家族 `toast` / `confirm` / `task` 在 DOM 处使用时自动注入发起元素为 anchor（编程式 API 仅显式传时生效）。actions 对象形态带 `value` 键：点击闭环 = 置已读 → 写 result → 发事件 → handle → hide 判定（Confirm 会话 `yes()/no()` 同路）。事件族 `notification:add/update/show/hide/read/status/action` 双通道（payload.message = 会话）。`engine.stop()` 不动通知、`destroy()` 收口（含持久化 flush）。**状态暴露（ADR-0072；`sessions` 键 ADR-0083 → **ADR-0089 退役**——display 模型下 DOM 与 `items[].closed` 投影双真相源，第三通道可派生）**：保留键 `store.state.$notifications = { items, options }`（`$scopes` 后第二例，永不整体替换、`notifications:false` 不注入）——`items` 为记录镜像（`AutoSparkNotification` = 数据记录 `AutoSparkNotificationRecord` + 渲染行为层；`shallow(items, options.shallow ?? 1)`——`0|1` 构造期一次性；**写通道仅本 API**，记录级变更 = 镜像内整条替换，模板直写违约自理）、`sessions` 展示序 id 数组已随 ADR-0089 退役（在屏观察 = `items[].closed` 投影 / DOM display——实例恒挂容器）、`options` 为生效配置**真身**（构造注入「内置默认 < options.notifications」合并结果，直写即对后续操作生效、已展示卡不回溯；边界键 `anchor`/`actions` 构造期私有固化——「函数、元素不入 state」；`shallow` 为唯一例外键——直写静默忽略）。`level` 严重度（ADR-0079，原 type 语义色数值化：`AutoSparkNotificationLevel` = `0`none/`1`info/`2`success/`3`warn/`4`error + 常量 `NOTIFICATION_LEVEL`；宽松入参收数字或名字符串、内部恒数字；驱动图标与语义色，**与展示位置无关**——原排序数字 level 已移除，列内与镜像纯到达序）；`owner` 归属者（业务透传不代填）；`styles` 内联样式 cssText（渲染键不入载荷，ADR-0077）；**尺寸五键** `width/height/minWidth/maxWidth/minHeight`（number=px、width/height 默认 auto、maxWidth 缺省走 shell CSS 兜底——**内置 type 种子层** confirm/task 默认 `width:300`，用户任意层可覆盖）；**sticky 自动关闭钮**（ADR-0077 修订）：`delayClose ≤ 0` 且整条链未显式声明 `closable` 时自动补 ×——否则除 API / actions 外无法关闭（显式 `false` 任意层压制，全局层以构造期显式键快照判定）；传输配置 `fetchOptions`（原 url+headers 合并）fetch 时现读 state——token 续期直改即生效。词汇全链路统一：正文 `description`（旧 body）、链接 `link`（旧 href，HTML 属性仍 href）。
_Avoid_: 通知中心 / 收件箱 UI（引擎只做数据层 + 呈现层；界面用指令自建——`$notifications` 直绑零桥接）、choices 按钮（已否决——actions value 键覆盖数据应答）、模态确认框（confirm 是加强版 toast 非模态，模态走 dialog）、type 数字值（string only——level 才数值化）、通知框（模态 alert，是 dialog 语义）、旧键 body / href / url / headers（ADR-0072 更名 description / link / fetchOptions）、persist 字符串值 'none'/'local'/'remote'（ADR-0077 数值化 0/1/2/3）、旧三键分工 kind / 语义色 type / 排序 level（ADR-0079 三键更名——写 type / level）

**轻提示 / toast（Toast）**:
通知的**瞬时呈现形态**（type='toast'，ADR-0071，机制沿 ADR-0068）——存活记录在分区栈短暂浮现、delayClose 后自动消失；persist 默认 0（隐藏即删）即 toast 语义。发起走统一入口 `show`（默认 type 即 'toast'）；全局 `toast` action（模板侧）转发同路（type='toast' 迁移期双发旧事件 `toast:show`/`toast:hide`，ADR-0077 `engine.toast()` 方法已退役）。呈现机制细节（pos 7 值枚举 `top-right` 默认 / level 5 档图标语义色 / hover 暂停 / closable）见「通知」词条。
_Avoid_: 通知（notification 是子系统正名——指记录与体系整体；对 toast 单体呈现仍避免混称，写「轻提示」或 toast）、吐司（音译不采纳）、浮层（tip 已占用）、toastManager（已更名 `engine.notifications`，见「已废弃」）

**通知外壳 / shell（原 notification-shell）**:
通知**卡片级外观**容器（ADR-0077 双层组合 → **ADR-0088 内容下放降级**）——**所有 type 共享**，只渲染 chrome：卡片根（边框 / 背景 / 阴影 / 圆角）+ **close 钮** + **type 默认出口**（裸 `x-slot`，type 模板的投影位）。icon/title/link/description/actions 等**内容渲染归 type 模板**（ADR-0088——原「shell 渲染公共元素」分工修订，接管 shell = 换整卡外观含关闭钮形态）。type 模板先编译、产物以 `mode:"live"` 段投影进出口；自定义 shell 未声明出口 → warn + type 区丢弃（数据无损）。查找链（shell 链）不变：`options.notifications.shell`（**选择器**，默认 `'notification'`，运行时直写换键对后续 add 生效）→ getComponentDeclaration 链 → `options.uiShells` 引擎级注册表 → 内置 shell 兜底。装配判据：内置种子（未被用户接管的 `notification` 键）模板自带双类名根（`autospark-dialog autospark-notification`；卡片根另挂 `data-notification-type` = 业务类别 / `data-notification-level` = level 名字面，ADR-0079）根即卡片根；用户模板包引擎 wrapper（零类污染）。props 数据域（**剥函数整包**，ADR-0088）同权注入 shell 与 type 组件两层；`$session` 派生变量已随 ADR-0089 退役（组件模板内 methods 直达，close/actions 点击走卡片根委托）。分区堆叠列是**引擎结构**不组件化。
_Avoid_: 显示容器（分区列是引擎结构非组件）、内容骨架（内容归 type 模板——ADR-0088 起 shell 只管外观）、整卡渲染 / 四级查找（ADR-0071 决策 16 旧语义已推翻）、notification-shell / task-shell（旧名——现内置 shell 名 `shell`、task 专属区归 task 模板）、taskWidget（中间名已退役不入词汇）

**通知 type 组件（Notification Type Component，原 type 模板 / presets 预设组件族）**:
通知 type 的**实现单元 = 一个 autospark 组件**（ADR-0089，取代 ADR-0077/0083/0088 的「session class 行为 + 模板渲染」双层形态）：行为（setup **methods**——task 状态机、confirm yes/no 均为普通组件方法）、数据视图（setup **data** 响应式域）、渲染（模板 + scoped style）、生命周期（四阶段钩子）**全部住组件**；引擎读取的 type 声明经 **data 约定键**表达（如 `data.holdOpen` 响应式联动计时拦截）。**base 族根**：`autospark.notifications.base` 为组件族公共基座（结构 + 行为双继承——setup 按层合并），所有 type 组件**强制继承** base（引擎自动补 `x-define:inherit`，显式写不重复）；`autospark.notifications.actions` 按钮行为唯一公共组合件。经 `options.components` 种子注入（`autospark.*` 引擎保留命名空间，用户同名覆盖优先）；查找链不变：`types[type].render` → 全局组件表 `autospark.notifications.<type>` → base 兜底。内置 `toast` / `confirm` / `task` 同构（task 改「继承 + 覆盖出口」）。**数据层与组件分离**：跨态数据宿主在数据层（record + props），组件挂载注水、不担跨态责任；组件 data 不入持久化载荷。〔ADR-0089 已裁决，实施待启动——现行代码仍为 session class 形态〕
_Avoid_: kind renderer / type 模板（旧名，渲染层独占语义已退役——type 组件是行为+渲染完整单元）、BUILTIN_RENDERERS / 内置注册表（ADR-0083 退役）、renderers / presets 目录（ADR-0083 变体 A 聚合后退役）、session class 家族 / `sessions/` 目录（ADR-0089 退役——行为归组件 setup）、组件纯渲染（已失效表述——组件承载行为）、一个 type = 一个 TS 类 / `registerType`（评估中途方案，被否决——双轨两套心智）、type shell / 渲染插槽（它不是外壳是出口内容）、taskWidget（已退役中间名）

**通知组件实例（Notification Component Instance，原「通知会话」）**:
`add()` 的**恒一返回物 = 组件实例**（ADR-0089——「直接返回组件实例」，无二态判别）：add 即实例化挂 DOM，实例上 methods 直调即外部驱动（`session.progress(50)` / `session.yes()`——display:none 亦然，无需 invoke 通道）；数据型驱动走 `notifications.update(id, patch)`；confirm 实例 setup 定义 `then`（可 await，存量写法零改）。**可见性 = display 模型**（实例与 DOM 与记录三者恒同生命周期）：排队 `display:none`（满员不占可见容量）/ 显示可见 / persist ≥ 1 隐藏 `display:none` 保留实例 / `remove()`·淘汰·persist=0 关闭**真销毁**——queue 补位挂载机制简化为样式切换。跨态数据宿主在数据层（与组件分离）；factory 形态（`add(async (instance)=>…, 'task' | {type:'task',…})`）**调用瞬间即创建组件实例**注入——挂起 = `display:none` 特殊排队态（progress 直写 data 域，缓存机制退役；第二参对象形态携带初始 props 同刻注水；**主用法 = 立即 return**〔即时卡 + 后台驱动，长任务不 await 主线〕、await 形态仅属条件通知域；resolve 时 return props 落地注水〔与期间已写 data 同名键**闭包运行态胜**〕、`undefined` 静默销毁）。`notifications.sessions` = manager Map 正名视图（与 `$notifications.sessions` 展示序 **id 数组**是两个东西）。〔ADR-0089 已裁决，实施待启动——现行代码仍为 session class 形态〕
_Avoid_: 通知会话 / Session / NotificationSession 家族（ADR-0089 退役——历史沿革 ADR-0077 正名 → ADR-0083 class 化 → 0089 组件实例化）、`$session` 派生变量（退役——组件模板内 methods 直达，shell close/actions 走卡片根委托）、轻 token 句柄（评估否决——多一层无行为实体）、invoke 外部驱动通道（不需要——实例恒在方法直调）、闭包同构 / 运行时全集方法（ADR-0077 形态早已退役）、run() 展示周期 await 通道（已移除——观测走 notification:hide 事件，YAGNI）

**UI 外壳注册表 / uiShells**:
`options.uiShells: Record<string, string>`——引擎级「**带出口协议的骨架外壳**」统一寄存处（ADR-0077）：内置四件种子 `notification`（通知）/ `dialog` / `popover` / `drawer`（overlay 三件自模块级内置表迁入，键 = 消费者裸名）+ 用户同键浅覆盖。值为 HTML 模板字符串（懒预编译，与 `options.components` 同纪律）；**构造期固化**（运行时突变不失效缓存——注册与选择分离，运行时换 shell 走消费者选择器如 `notifications.shell` 直写换键）。解析链：消费者选项 shell 名 → getComponentDeclaration 链（局部覆盖能力保留）→ 本表 → 消费者内置默认。**边界**：只收外壳语义组件——loading 块 / error 组件 / tree-node / type renderer 不入。
_Avoid_: shell 注册表（泛化）、组件表（那是 options.components）、内置 shell 表 / BUILTIN_SHELL_NAMES / dialog-shell 组件名（旧机制已迁入并退役——键统一消费者裸名）、运行时可写注册表（已否决——构造期固化）

**通知记录（AutoSparkNotificationRecord）**——**纯业务数据（ADR-0072 → ADR-0089 纯化）**:
服务器通知 DTO 形态——`id/type/read` 恒有 + `owner/level/title/description/status/result/link` + `createAt/updateAt`（业务十二键封闭）。**三重身份零转换同构**：`$notifications.items` 元素（**只管数据**）/ persist·remote 持久化载荷 / entry 的 record 面。渲染配置与运行态投影**不在此**（ADR-0089：封装在组件中——前者活在实例 props 注水面、后者活在实例 data 域〔`notifications.get(id).data` 直读〕）；在屏观察走 DOM display。〔ADR-0089 已裁决，实施待启动〕
_Avoid_: NotificationRecord（简称废弃——正式名 AutoSparkNotificationRecord）、AutoSparkMessage（ADR-0089 退役——record+渲染+投影大杂烩镜像类型，其键归组件）、镜像携渲染键 / closed / progress 投影（数据/组件分离的例外条款已清除）、DTO 携渲染键（className 等不跨会话）

### 加载遮罩（Loading Mask）

> 旧称「加载覆盖层」已让位更名——「覆盖物」词汇归属弹层消费家族（正式词条见上方「覆盖物」章节，历史沿革见「已废弃」词条）。

**动作按钮清单 / actions（x-loading）**:
x-loading 配置的**动作名数组**（inline 主声明 → `x-loading-options` 回退，与其他配置字段同规则；非字符串元素 warn 剪枝）。挂载时解析为 `[{name, title}]` 注入块 data（`title = ActionDesc.title ?? name`），渲染归块作者、触发归指令（见「data-action 委托」）。详见 ADR-0038。
_Avoid_: 动作列表（泛化）、buttons（配置的是 action 名不是按钮）、对象形态（已否决——文案定制走 ActionDesc.title）

**data-action 委托（x-loading）**:
遮罩根上的点击委托契约：块内任意 `data-action="<name>"` 元素点击 → 经块 scope `getAction` 链逐次现查（已注册走真 action、未注册走「合成动作描述符」），以标准 AutoSparkActionContext（`el`=被点元素）调用 → 双通道广播；随后按「hide 约定键」决定是否自动隐藏遮罩。自定义 loading 组件零接线同享。详见 ADR-0038。
_Avoid_: 动作绑定（泛化）、action 属性（与广播事件名 `action:<name>` 撞形）

**进度条模式 / progressbar（x-loading）**:
x-loading 的第二种显示形态——不铺加载遮罩，仅在挂载目标顶部呈现一条约 3px 高的**不确定型**无限滚动条，宿主内容保持可见、可交互（条不拦截命中——这是与遮罩的**本质差异**，非尺寸差异，故本形态归「加载指示」而非遮罩家族）。经 `.progressbar` 修饰符启用（v1 仅修饰符入口、模式静态）；`color` 为滚动段色（**默认橙色**——细条以明显性优先，不沿用 loader 默认灰）、`bgColor`+`opacity` 为轨道底色（**缺省为浅轨**，深轨压暗段色），滚动段为 30% 宽实心纯色；`message`/`actions` 在条模式下静默不渲染、自定义 loading 组件不取用（条无内容可替换）。与 `.screen` 并存贴视口顶；`selector` 照常解析（条贴目标顶部）。
_Avoid_: 百分比进度（不表达完成度）、确定进度、进度指示器（泛化）、顶部进度条（条可经 selector 挂到任意目标，不限「顶部页面」语义）

### 表单绑定层

**双向绑定 / x-model（Two-way Binding）**:
输入控件与状态的双向同步——state→DOM（读方向）+ DOM→state（写方向）。区别于 `:value`/`x-bind:value` 的单向 state→DOM（"回写 state 须另用 x-model"）。控件按 **控件类别（ControlKind）** 分派读写：text-like（`<input>` 非 checkbox/radio + `<textarea>`，读 `el.value`）+ checkbox 单值布尔（读 `el.checked`，详见 ADR-0023）+ radio 值匹配 + select（选项子树见 **choices**，详见 ADR-0026）；checkbox 组 / radio 组收集暂不支持。详见 ADR-0018、ADR-0023、ADR-0026。
_Avoid_: 双向数据绑定（泛化）、表单绑定（泛化）

**写回落点透传 / Write-through（x-model）**:
x-model 简单路径写回（DOM→state）的落点规则：经聚合视图按「本层域 → 父域 → store 根」就近命中——域字段落域（多段路径留域内成员对象）、全链未命中落根，与读方向（scope.watch 表达式支路）**同源对称**。边界语义（组件封闭边界、declarer 基准、插槽改道）由聚合视图既有实现承担，无第二套落点判定（`scope.writeThrough` 是唯一入口，供指令写回快通道复用）。详见 ADR-0075。
_Avoid_: 直写根（旧语义，「读局部、写全局」分裂与根上幽灵键的根源）、set 桥接（那是写转换/字段拆分手段，不是落点规则——ADR-0075 后不再是域内绑定的必需品）

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

**字段绝对路径 / absPath**:
x-field 绑定值经 `resolveFieldAbsPath` 在编译期一次解析的**绝对状态路径**（从 store.state 根起算）——此后表单层（`$field.value` / reset / getState / dirty / 校验取值）全部按它读写同位（x-field 的对称范式，区别于 x-model 的运行期相对解释，ADR-0075）。首段沿 scope 链就近命中：x-for 项映射（`item.name` → `items.<index>.name`，ADR-0076）> `_data` 域（拼 `$scopes.<id>.` / 挂载段前缀）> 全局原样。表达式源 / 分页切片无稳定路径不记映射（项内回退全局解释）；异步数据未就绪按全局解析 + warn（完整修复立后续）。
_Avoid_: 相对路径（那是绑定值的书写形态，absPath 是解析产物）、项内路径（指 `items.<index>.name` 的解析结果，不是一种新路径类别）

**项映射 / LOCAL_PATHS**:
x-for 在项局部数据（localData）上记录的「项变量 → 绝对状态段」映射（`item → ["items","0"]`），供字段绝对路径解析沿链反解——纯路径源且非分页才记录；挂 Symbol 键不进聚合视图命中、不被 Object.assign 复用更新冲掉。x-for 的「同 key + index 变则销毁重订」铁律保证映射随 rebind 自动重解析（无陈旧路径）。详见 ADR-0076。
_Avoid_: 项路径表（实现细节视角）、item 绑定（那是 x-model 的语义，映射服务的是路径反解不是绑定）

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
x-form 作为**唯一订阅者**统一监听 configManager 元数据依赖，各 x-field 编译期注册（字段路径 + 消费回调）、变更由 x-form 分发——避免每字段独立建监听。是 x-field 强依赖 x-form 的架构根源。注册与注销生命周期对称（field 销毁即注销，引用校验删除——x-for 删项不留悬垂条目，ADR-0076）。
_Avoid_: 事件总线（订阅的是响应式依赖，不是事件）、字段监听器（监听集中在表单层不在字段层）

### 图标层

**图标 / Icon（x-icon）**:
以 SVG symbol + `<use>` 呈现的矢量图标渲染指令（ADR-0058）：宿主元素 `x-icon="名称"`，注入唯一子节点 `<svg aria-hidden><use href="#as-…"/></svg>`（撑满宿主）。名字解析走「图标域」（scope 链就近 + 全局注册表兜底）；**值两栖**——表达式求值优先，求值空/非法时原值形匹配才回退字面量（裸名不是合法 JS，状态命中优先、字面量为空值兜底），值为响应式表达式（切换即换图标）。**颜色主权在宿主**——currentColor 经 CSS 继承直达 use 内容，`color` 选项内联 `color` 覆盖；`strokeWidth` 经 `--as-icon-sw` 变量下发（见「symbol 归一化」）；`size`/`padding`/`badge`/`button`/`pointer` 为盒模型层选项照旧。未命中（未声明或已删除）warn + 渲染**默认图标**，声明后经变更通知自动补渲染；**待定名**（远程加载中）渲染空占位、不算未命中。旧远程值形 `集/名` 已废除（斜杠形是除法表达式求值 NaN → 空占位，对齐「含点路径不回退字面量」先例）。
_Avoid_: mask 图标（机制已下线）、background-color 换色（旧颜色模型）、svg 图标（那是数据形态）、icon 组件（无组件机制参与）、图标字体（那是 font-family 方案）

**图标集声明 / x-icons（Icon Set Declaration）**:
`<template x-icons>` 的批量图标声明（ADR-0058）：内联通道为多个带 `id` 的 `<svg>` 子元素（每个收集为一个 symbol）；值简写 `x-icons="save,home"` 承载远程清单（等效 `x-icons-options.icons`），与内联**可合并**进同一图标域。编译期前置 collector 收集后剪枝（不进结果 DOM，指令类仅名位）；**纯静态**——一次求值，不 watch 不响应式；同一声明源只收集一组 symbol（内容哈希令牌去重 + 引用计数，x-for / 组件克隆不放大、随 scope 销毁回收）。
_Avoid_: x-icon-define（已硬移除）、图标定义（旧词条名）、图标模板（泛化）、图标声明（与编程入口混淆）

**图标域（Icon Domain）**:
图标定义的可见范围与查找协议（ADR-0058）：默认归**最近祖先 scope**（后代沿链就近使用，内层遮蔽外层）；`x-icons.global`（≡ `global:true`）归全局；孤立声明（无 scope 祖先）静默归全局。x-icon 解析镜像 `getComponentDeclaration`：自身 scope 沿 parent 链 → 全局注册表兜底——与组件/action/data 的链式查找范式统一。同名冲突静默覆盖，胜者按编译期声明序（所有权登记，与 fetch 到达序无关）；同一 template 内**远程覆盖内联**（内联加载窗口期先显形）。局部 symbol 随 scope 销毁回收，全局不清理。
_Avoid_: 图标作用域（与 scope 撞名）、图标命名空间（是查找域不是命名空间）

**symbol 前缀（Symbol Prefix）**:
sprite 内 symbol id 的命名方案：全局 `as-{name}`、局部 `as-i{声明令牌}-{name}`（声明令牌按声明内容哈希生成——克隆同源（x-for 项 / 组件快照）哈希相同、共享同一组 symbol，是「克隆不放大」与引用计数回收的实现根基）。`<use href>` 按 id **文档全局解析**——「图标域局部」靠前缀 + 查找协议实现，非 DOM 隔离；`as-` 为引擎保留前缀（页面手写 svg id 避让）。图标名受 CSS ident 硬约束（`[A-Za-z0-9_-]`、非数字开头），`as-icon` 为保留名。
_Avoid_: asv-（未采用）、scopeId 前缀（初稿方案，克隆链无法保持已修订为令牌）、裸名 id（与页面自身 svg id 撞车）

**sprite 载体（Icon Sprite）**:
document 级唯一的隐藏 `<svg>` 容器（`width=0 height=0 position:absolute aria-hidden`，幂等创建），全部 symbol（全局 + 局部）同住其中、靠前缀区分（ADR-0058）。
_Avoid_: 图标样式表（mask 时代产物已废）、每处内联 svg（重复体积）

**symbol 归一化（Symbol Normalization）**:
图标内容的收集期归一化（ADR-0058）：剥离**全部** stroke-width（「宽度不是图标的一部分，是渲染参数」）、缺 stroke 才补 currentColor（作者显式属性不动）；viewBox 提取自 svg 属性（远程侧见「IconifyJSON 远程源」的合成规则）。生效 strokeWidth 经 `.as-icon{stroke-width:var(--as-icon-sw,1.25)}` 基础规则 + 四级链生效值内联变量下发；多笔画异宽图标失去表现力，为已知限制。
_Avoid_: 规范形 SVG（旧词条——data URL 时代产物，xmlns 补齐管线随 mask 下线）

**IconifyJSON 远程源（Remote Icon Source）**:
`x-icons` 的远程物种（ADR-0058）：`x-icons-options` 的 `url`（默认 `https://api.iconify.design/material-symbols-light.json?icons={modify-icons}`——清单占位符用 `{modify-icons}`，未声明 modify 退化为原名清单）+ `icons`（逗号清单）+ `modify`（值域 rounded|sharp|outline|outline-rounded|outline-sharp，越界 warn + 忽略）+ `cache`（TTL 持久缓存时长**毫秒**，正数启用、默认 0——fetch 成功落 localStorage、TTL 内跨会话零网络、过期条目读取时即弃；ADR-0058 修订）。url 插值：`{icons}` 原名清单原始直书、`{modify}` 未声明为空串、`{modify-icons}` 未声明退化为 `{icons}`、未知占位符保留原样 + warn。编译期收集即 fetch；会话内存缓存 + in-flight 合并（同 url 一次）+ 可选 TTL 持久层（cache 选项），无限流。**原名注册**——响应键按「后缀名→原名」表回填，symbol 以原名注册（x-icon 不感知 modify）；`not_found` 后缀名按原名失败处理。转换：symbol id = 图标名（不含 prefix）、viewBox 自 JSON 根级默认合成（兜底 0 0 16 16）、rotate/hFlip/vFlip → `<g transform>`、aliases 解引用（循环 warn 丢弃）、body 直塞不补 stroke。
_Avoid_: 异步图标源（旧词条，per-icon 物种已废）、icon-url（不存在的指令/选项名）、baseUrl（旧协议基址已删）、持久缓存（那是旧词条名——本机制是声明级 TTL 选项）

**待定名（Pending Name）**:
远程声明收集期登记的「已声明未到达」名字（ADR-0058）：x-icon 遇待定名渲染**空占位**（不闪默认图标），symbol 注入后自动显形（onChange 唤醒兜底浏览器解析差异）；fetch 失败逐名转 warn + 默认图标——「声明了没到」与「根本没声明」两语义分离。
_Avoid_: 加载占位（与「异步兜底 / x-fallback」撞义）、占位符（歧义大）

**图标注册表 / Icon Registry（AutoSpark.icons）**:
document 级全局共享的 Set 子类（`AutoSpark.icons` 静态暴露，多 engine 共享）——**图标域的全局兜底层**（ADR-0058）：动态增删（`add(name, svg)` 注册（内部注入 `as-{name}` 全局 symbol）/ `delete` 移除，无 remove 别名——严守 Set 契约）、遍历产出**名称字符串**、`onChange` 变更通知（miss 唤醒依赖）。声明入口三通道：模板 `x-icons.global` / 编程 `AutoSpark.icons.add` / 构造 `options.icons` 种子；**局部图标无编程入口**（模板 x-icons 唯一）。`options` 字段——**全局图标默认配置**（配置链第三级：指令选项 > 宿主选项 > 本配置 > 内置默认，承载 strokeWidth/size 等渲染参数键；整体赋值广播重渲染，深修改不广播）。engine destroy 不清理（对齐 document 级共享先例）。图标名受 CSS ident 硬约束（`[A-Za-z0-9_-]`、非数字开头），`as-icon` 为保留名。
_Avoid_: engine.icons（实例级注册表已否决——document 级资产天然跨 engine）、baseUrl/persist/prefetch（旧远程协议 API 已删）、图标库（泛化）、图标 Map（对外是 Set 形态）

**默认图标 / Default Icon**:
图标域**未命中**（未声明或已删除）时替换渲染的内置回退图标（保留尺寸、照常 warn）——「缺图不破相」。以内置条目形态驻注册表（名为 `default`，可被用户同名覆盖；其被删除则未命中退回空占位）。**待定名不算未命中**（加载窗口期空占位，见「待定名」）。
_Avoid_: 空占位（已否决的未命中姿态——只保尺寸无内容）、fallback 图标（英文别名）、占位图标（与「空值占位」词条撞形）

**图标按钮 / Icon Button**:
`x-icon` 的 `button` 选项（修饰符 `.button`）声明的**纯视觉交互态**：hover / press 动效 + 隐含手型光标。**载体动效**——动效作用于既有视觉载体（非 badge = 图形本身加深/缩放；badge = 底板梯度加深/整体缩放），不新增视觉结构、不改布局占位；与 badge（管「板常驻」）正交。只做视觉可供性，**不承载控件语义**（无 role/tabindex/键盘激活）——点击行为归用户 `@click` 声明。详见 ADR-0049。
_Avoid_: button 组件（无组件机制参与）、可点击图标（视觉可供性与控件语义分离）、图标控件（语义升级歧义）

### 结构占位与组件层

**隔离边界 / x-isolate（Isolation Boundary）**:
把宿主声明为一块**独立子引擎（child engine）的根**——内部模板由完全独立的 AutoSpark 实例编译（自有 store、scope 树、调度与指令 observer），与父 engine 状态零耦合、双向不渗。三形态由指令值分派：**inline**（无值，内部 `x-data` 自治）、**种子状态**（值以 `{` 开头，在父作用域求值一次作初值快照、不随父变化、引用传递）、**remote**（其余值为 url 表达式，fetch 模板建子引擎，url 响应式）。子引擎配置经 `x-isolate-options` 全量透传、不自动继承父选项。详见 ADR-0060。
_Avoid_: 隔离快照 / 冻结快照（static 模式已废止，见「已废弃」）、插槽（易与 Vue 插槽撞义）、组件容器（带 props 的响应式复用是 x-component 的职责，种子状态是一次性初值快照）

**engine 根标识（Engine Root Marker）/ `data-autospark`**:
engine 构造时打在**根元素**上的标记属性——app 根与 x-isolate 宿主一视同仁。所有**沿真实 DOM 向上爬**的相对查找（`^` closest 上爬、`../` 父级爬升）遇之**止步**：engine 是相对查找的世界边界，不越入相邻 engine 的 DOM；跨边界用 `/` 全局选择器显式声明。scope 链与编译期查找走克隆链/scope 链，天然不跨 engine，与该标识无关。详见 ADR-0060。
_Avoid_: 根选择器（它是止步标记不是选择器）、挂载标记（泛化）、全局标记（`/` 全局查找不受其约束）

**结构占位 / x-scope（Structural Placeholder）**:
纯占位指令，元素上声明 `x-scope` 即令该元素建立 `AutoSparkScope`——即便它没有其他指令、没有插值。目的是在「无其他指令的纯容器 `<div>`」上插入一个 scope 锚点，让后代 scope 的 parent 链落到此处（而非更远的祖先），并为其后代 `x-define` 提供归属。注册占位类 `ScopeDirective`（`created`/`compile` 皆空，高优先级）；冗余声明（元素已有其他指令、本就建 scope）静默无副作用。**不建数据域**——与 x-data 的数据注入职责正交。
_Avoid_: 作用域容器（泛化）、命名空间（语义不符）、占位符（本表保留给空值渲染，歧义大）

**组件定义 / x-define（Component Definition）**:
编译期树变换标记，**不是渲染指令**。在 x-scope（或任意带 scope 的祖先）内声明一个命名组件片段，**值承载组件名**（无值取 `default`），编译时被**从渲染树摘除**（不进结果 DOM、不建 scope、不实例化指令），以**深克隆的冻结快照**形态上交给最近祖先 scope 的 `components`。组件上同元素的其他指令（如 `x-define="error" x-text="msg"`）随组件整体冻结，待消费者渲染该组件时才编译执行。**组件根 scope 由消费编译路径（`compiler.compileChild`）内禀保证**——消费者无条件 `new AutoSparkScope`，与根上是否有 `x-scope` 属性无关（原"注入 x-scope"已作废）。详见 ADR-0022（承接 ADR-0021）、ADR-0054。
_Avoid_: 片段（泛化）、插槽出口（那是 x-slot 的出口，不是定义本身；见「插槽出口」）、命名空间组件、x-component（该名已让位给实例化指令，见「组件实例化」）

**组件归属（Component Ownership）**:
一个 x-define 挂到其**最近的祖先 scope**——任意深度（跨中间无 scope 的纯 `<div>`），与 `_linkParent` 向上找最近 scope 的语义同构。嵌套 scope 时归最内层祖先；**消费宿主自身的 scope 对其子级声明而言亦是最近祖先**（此时声明处与消费处重合，数据视图两基准合一）；x-define 向上找不到任何带 scope 的祖先时，编译期 warn 并丢弃（无处归属）。`engine.registerComponent` 的 `opts.scope` / `opts.el` 是**声明处的显式等价物**（`el` 自该元素含自身向上取最近的 scope 根，与 x-define 同构；整条祖先链都查不到才降级为全局并 warn）——运行时无祖先链可走，须由调用方指明。
_Avoid_: 组件归属深度（实现细节）、组件父（用 scope 统一）

**`default` 组件唯一性（Default Component Uniqueness，已放宽）**:
该约束**已放宽**（ADR-0022 决策四-4）。原 ADR-0021 中"每个 scope 的 `components.default` 唯一、同名直接归属抛错"已废止——**同名组件直接归属同一 scope 时改为 warn + 后者覆盖**（不再抛错）。沿 parent 链**允许覆盖**：内层 scope 的 default 遮蔽外层同名 default，与组件查找的就近原则一致。此放宽为 x-component 引擎无实例缓存层、组件复用更灵活而设。
_Avoid_: 全局唯一（沿链可覆盖）、同名互斥（约束已放宽为 warn+覆盖）、抛错（已废止）

**组件查找（Component Lookup）**:
消费者（如 x-loading/x-empty/x-error）按约定名取**组件声明**的查找协议，经 `getComponentDeclaration(name)`（原 `getBlock`/`lookupBlock`/`getComponent`，ADR-0080 更名）执行：从自身 scope 起沿 parent 链向上取首个含该名 component 的 scope，**到顶兜底查全局组件**（先全局组件定义表，miss 再惰性读 `options.components`，见「全局组件定义表」）。命中则用该组件替换内置 UI；未命中则回退默认组件/内置 UI。**局部 x-component 沿链遮蔽全局同名组件**（就近原则，与 `getAction` 内层覆盖全局 `engine.actions` 同构）。与 action/data 的 parent 链查找范式统一，支持「局部覆盖、外层兜底」。三个落点：`scope.getComponentDeclaration(name)`（链终点兜底全局）、`engine.getComponentDeclaration(name, el?)`（el 省略或反查失败即纯全局，el 有 scope 走链，ADR-0094——供 Runtime 指令与命令式消费）、Compile/Hybrid 指令直接 `this.binding.scope.getComponentDeclaration(name)`。查**实例**（实例化后的组件）不经本协议，见「组件实例门面」。
_Avoid_: 组件解析、组件匹配（查找是按 scope 链就近+全局兜底，非内容匹配）、getComponent（该名已让位给实例读取，ADR-0080）

**组件兜底（Component Fallback）**:
消费者未查找到约定名组件时回退其默认渲染的行为。两种形态：**(a) 消费指令自带的默认组件**（如 x-loading 的 `DEFAULT_BLOCK` 模板串，渲染统一走「编译组件」路径，可被全局/局部组件覆盖）；**(b) 纯代码兜底**（已被 (a) 取代，x-loading 不再保留代码 DOM 路径）。组件是可选的覆盖资源，不存在时消费者回退其默认实现，引擎行为不退化。
_Avoid_: 降级渲染

**全局组件（Global Component）**:
经引擎构造选项 `AutoSparkOptions.components`（`Record<string, string>`）声明的、**全引擎复用**的命名组件，字符串入参；亦可由 `x-import` `.global`、loader 或 `engine.registerComponent` **运行时注册**（见「运行时组件注册」）落入全局组件定义表。是 scope 链查找的**终点兜底**（`getComponentDeclaration` 到顶后查此）。与局部组件（x-define 声明、入参为 DOM）相对——二者经同一条 `getComponentDeclaration` 链统一取用，消费者无需区分来源。字符串入参走懒预编译 + 自动包装（见「组件预编译」「组件自动包装」），**构造期配置语义、运行时突变不失效缓存**（与 `actions`/`sanitizer` 等 options 同纪律）。详见 ADR-0022（承接 ADR-0021）决策 9、ADR-0086。
_Avoid_: 全局模板（泛化）、注册组件（改称运行时组件注册/落入定义表，见下条）

**内置组件（Builtin Component）**:
随引擎发行的**默认全局组件**，模板住 `src/components/`（一组件一 `.html`），经 `components/index.ts` 唯一注册面（模板 `?raw` 导入 + 注册名常量 + 聚合种子表）在构造期落入 **`options.builtinComponents` 注册位**。**裸键注册**（`error`/`notification`/`dialog`/`popover`/`drawer` 及通知族 `autospark.notifications.*`），查找走标准组件链（就近遮蔽即定制）。**双注册位优先级**：`options.components` > `options.builtinComponents`——一般定制内置组件应使用 `components` 同名覆盖；`builtinComponents` 独立保存的目的是**避免内置默认被业务配置流意外覆盖**，供明确接管框架内建件时使用。详见 ADR-0092、ADR-0094。
_Avoid_: 混入 `options.components`（双注册位分立，ADR-0094）、`engine.builtinComponents` 公开字段（已删）、点前缀 shell 注册名 `autospark.notifications.shell` / `autospark.overlays.panel-shell` 等（已裸键化，ADR-0094）、uiShells（已退役，ADR-0092）

**全局组件定义表（Global Component Definition Table）**:
engine 私有的 `Map<组件名, ComponentDef | null>`——**全局组件的唯一运行时名册**，查找优先级高于构造选项两注册位（`options.components` > `options.builtinComponents`，均 miss 才惰性读配置并自动包装入表）。三条写入路径：`x-import` `.global`、loader 远程注册、`engine.registerComponent`（ADR-0086 决策四）。**`null` 是负缓存**（两注册位均 miss / 解析失败，只解析一次）。消费者经 `_resolveGlobalComponent` 取快照、`getGlobalComponentDef` 取定义元数据。运行时注册**不回写 `options.components`**——该配置是构造期事实源，回写会造成「配置 + 名册」两处真相。
_Avoid_: 全局组件缓存（强调单一名册，非某层缓存）、组件缓存表（未说明全局与 scope 的二分）、快照表 + 定义表两张（ADR-0086 前曾并存，已合并）

**运行时组件注册（Runtime Component Registration）**:
`engine.registerComponent(code, opts?)` —— 把一段**带 `x-define` 的单根组件模板字符串**在运行期登记为组件。归属三态由 `opts` 决定：`scope` / `el`（声明处锚点，等义；`el` 自该元素向上取最近 scope 根，整条链都查不到才降级全局）/ 都不传（全局）。严格单根契约——多根、元素与文本混排、缺声明一律 warn + `null`，**不套用「组件自动包装」**（那是配置入参的宽松面）。同名后注册覆盖并 warn（per 名去重）；**已实例化的组件不热替换**，仅后续实例化取新定义。`x-define:inherit` 复用编译期/x-import 同一继承管线（父未就绪则挂起待父注册事件排水，本次返回 `null`）。**只注册不注销**：作用域注册随 scope 对象一并失去引用而回收，全局注册随 `destroy()` 丢弃。详见 ADR-0086。
_Avoid_: 运行时定义组件（注册是登记动作，定义仍由 x-define 承载）、动态组件（那是 x-component 的实例化职责）、parseComponent（解析已私有化，不公开）

**组件预编译（Component Precompile）**:
`options.components` 字符串入参首次被 `getComponentDeclaration` 命中时，经 `parseHtmlFragment` 解析 + 自动包装（见「组件自动包装」）为「恰好一个带 `x-define` 的根元素」，组装为 `ComponentDef` 存入**全局组件定义表**（key=组件名，value=定义；快照由 `def.snapshot` 派生），后续命中只 `cloneNode(true)` 不重复解析。**懒编译**——仅首次使用时预编译，未用的全局组件永不解析；失败以 `null` 负缓存，同样只解析一次。预编译产物形态与局部组件 `_collectComponent` 快照一致（未编译、保留指令属性、**不注入 x-scope**），消费者经同一路径渲染。解析失败/空串 → `logger.warn` + 视为未命中。详见 ADR-0022（承接 ADR-0021）决策 11、ADR-0086 决策四。
_Avoid_: 组件编译（预编译只解析+包装，编译在消费时）、组件缓存（强调的是懒解析+复用，非单纯存储）

**组件自动包装（Component Auto-wrap）**:
`options.components` 字符串入参规范化为「恰好一个带 `x-define` 属性的根元素」的规则（**仅配置字符串入参适用**：局部组件入参已是 DOM、`engine.registerComponent` 刻意走严格单根契约）：单顶级元素无 `x-define` → 根打本 key 名；已含 `x-define` → 尊重原值不重命名；多顶级节点/元素+文本混排 → 包一层 `<div x-define="name">`；纯文本无元素 → 包成 `<div x-define="name">文本`。包装标签固定 `<div>`（不开放配置）。详见 ADR-0022（承接 ADR-0021）决策 10、ADR-0086 决策二。
_Avoid_: 组件归一化（泛化）、组件封装

**跨指令供体协议（Cross-directive Provider Protocol）**:
x-define 不绑定具体消费者，是声明性资源——任意指令按约定名从 `scope.components` 取用。组件名**纯自由命名**（各消费指令文档自定其读取名与兜底逻辑），引擎**不预定义 UI 态名册**（如 loading/error/empty），不限制指令开发者发明新消费场景（开放-封闭）。
_Avoid_: UI 态注册表（引擎不维护名册）

**组件冻结（Component Frozen Snapshot）**:
x-define 收集时 `cloneNode(true)` 产出的、独立于 template 事实源的洁净副本。保留指令属性、未编译、可被多消费者重复取用而不相互污染。机制与 x-isolate static 模式的「深克隆子节点」同构。
_Avoid_: 组件克隆（强调的是冻结独立事实，非单纯克隆操作）

**插槽 / x-slot（Slot）**:
组件模板的声明式内容投影机制（ADR-0056）：`x-define` 在组件模板内声明**出口**（Outlet），`x-component` 在调用方宿主子级提供**内容**（Content），实例化时内容按名投影进对应出口；无内容则渲染出口内的 fallback。出口清单编译期从模板自动推断（`ComponentDef.slots`），命名靠属性参数（`x-slot:header`），裸 `x-slot`=默认出口/默认内容。内容在**调用方作用域链**求值（不受 ADR-0053 组件封闭边界约束），fallback 在**组件作用域**求值。覆盖物消费者家族（x-dialog 等）用同一套出口/内容/形参语法，但宿主侧内容归属规则不同（裸子节点永不参与，须显式声明，见「归属容器」）。
_Avoid_: 槽（单字生歧义）、Vue slot 撞名不加说明（本引擎指令为 x-slot）、内容插槽/模板插槽（泛化——就叫插槽）、`x-slots`（那是覆盖物宿主的归属容器，不是插槽标记本身——多一个 s，出口名与归属是两个概念）

**插槽出口（Outlet）**:
组件模板内声明「内容可替换到这里」的 `x-slot` 标记元素（定义侧）。标记元素**始终保留为真实包裹层**（出口位置即 DOM 位置，fallback 有宿主）；任意深度合法；无对应内容时渲染出口子树 fallback（组件作用域求值）。同名多出口 → 首个胜 + warn。
_Avoid_: 出口点、插槽定义（那是 x-define 的职责，出口只是其中的标记）、slot outlet 英文混用

**插槽内容（Content）**:
提供给组件出口的模板片段（内容侧）。**组件路径（x-component）**：宿主子级即声明点——带 `x-slot:*` 的直接子元素切命名段，其余（含裸文本）按文档序合并单一默认段（=默认出口，无形参）；命名标记元素存在即视为提供（空也覆盖 fallback）；裸子节点全纯空白=未提供。**覆盖物路径（x-dialog 等）**：宿主**裸子节点永不参与收集**（宿主子节点只属于宿主，如按钮标签），内容须显式声明——单消费者可将 `x-slot:*` 标记直接写宿主子级，多消费者须用 `x-slots="组件名"` 归属容器包裹（容器内裸子节点才是该覆盖物的默认段）。两路径共用：深层 `x-slot:*` → 忽略（剥属性、元素留作普通内容）；无对应出口 → warn+丢弃（不留宿主前缀）；内容 `cloneNode(true)`（模板只读契约，ADR-0002）后在调用方作用域编译。声明侧的标记与容器**编译期剪枝**，不进运行 DOM。
_Avoid_: 插槽体、传入内容（content 是与 outlet 对称的固定词）、默认插槽内容（组件路径裸子节点即默认内容，不需定语；覆盖物路径裸子节点根本不参与）、自动继承（旧语义已废弃：覆盖物宿主不再隐式收集裸子节点）

**归属容器 / x-slots（Slots Container）**:
覆盖物宿主上包裹插槽内容、声明**内容归属哪个覆盖物**的容器元素（ADR-0056 决策十修订）：`x-slots="覆盖物组件名"`，值须命中宿主上的某个 `x-dialog:名称` 消费者。容器内即该覆盖物的内容集（裸子节点=默认段、`x-slot:*`=命名段），单消费者可省容器把标记直写宿主子级、多消费者**必须**各套容器（裸标记无法判定归属 → warn+丢弃）。编译期剪枝：容器与标记子级不进运行 DOM（收集从只读 template 克隆）。与 `x-component` 不得同宿主（化身与声明点对宿主子节点的定位互斥，component 让步跳过实例化）。
_Avoid_: `x-slot-for`（早期命名，已废弃为 x-slots）、插槽容器（泛化——重点是归属而非包裹）、归属标记（那是属性不是元素）、`x-slot`（多一个 s：`x-slot:名` 恒为出口名段，归属不进它）

**作用域形参（Slot Params）**:
作用域插槽（scoped slot）的双向数据面：出口侧值承载对象字面量 `x-slot:header="{ item: row }"`（组件作用域经 watch 求值，注入变化→形参容器 `Object.assign` + `scope.refresh()` 刷新）；内容侧值承载**解构形参** `x-slot:header="{ item, index }"`（自定义 `{ 键, 键 }` 解析，非 JSON）。形参挂内容作用域 `locals`（进聚合视图）。裸子节点=默认插槽无形参；默认内容要形参须显式 `<div x-slot="{ item }">`。
_Avoid_: scoped props（props 是 x-component 的注入通道，形参是插槽投影的数据面）、插槽变量（泛化）、解构绑定（那是形参的写法不是概念名）

**super 标记 / x-super（Super Marker）**:
插槽内容内的 fallback 展开标记（内容侧，ADR-0084）：`<x-super></x-super>` 把**本段所覆盖出口的最终生效 fallback**（含继承覆盖层）展开进标记元素内部——标记元素保留为包裹层（与出口标记对称），引擎首个元素名形态指令。语义恒**自引用无名**（header 内容内的标记 = header 出口的 fallback，不跨段，Twig `parent()` 同款）；可多次出现、各自独立展开；展开的 fallback 恒组件作用域求值、不接收作用域形参。与「super 引用 / this.super」（ADR-0082）正交同族：super = 被我覆盖的那一层（方法面调父方法 / 内容面展开被覆盖的 fallback）。出口无 fallback → 静默展开为空；出现在插槽内容之外 → warn。
_Avoid_: `{{ $header }}` 插值形态（已否决载体——mustache 是「状态→文本」通道，投影 DOM 属类别错误）、`x-slot:super`（冒号段恒为出口名，super 不是出口名）、x-fallback（与「异步兜底 / x-fallback」撞义）、x-parent（`$parent` 是嵌套父实例通道，组合 ≠ 继承）、跨段/带名引用（无名自引用是唯一语义）、自闭合 `<x-super/>`（HTML 解析器不认未知元素自闭合、吞兄弟节点——必须双标签）、标记消失/原位替换（已否决——展开的 fallback 需要宿主）

**组件继承 / x-define:inherit（Component Inheritance）**:
x-define 的**属性参数形态**继承声明（`x-define:inherit="card"`：参数=关键字 `inherit`、值=单个父组件名，静态编译期解析非表达式；`x-define:extends` 为同义别名，正名 `inherit`）——子组件复用父组件的模板结构、`<script setup>` 与 `<style>`，经「继承覆盖」做内容差异化。**单继承、可链式**（解析期递归展开到根，子有效快照=父**已解析**快照的深克隆、父永不被变异）；父查找走 `getComponentDeclaration` 链（声明处就近 + 全局兜底，**就绪即解析**——同步在场立即解析、x-import 异步父挂起至 `components/<父名>/registered` 排水，ADR-0083）；值空 / 指向自身 / 继承环 → warn + 拒绝注册（不降级空壳）。setup 经既有合并管道按 **[父, 子]** 顺序合并（data / methods / locals 子同名胜、hooks 串行父先子后、全静默）；同名方法覆盖后可经「super 引用」调用父方法（ADR-0082）；styles 拼接子在后、open / dataContext 子重声明胜否则继承、出口清单=父全量。详见 ADR-0081 / 0082。
_Avoid_: 双别名同元素并写（应二选一，首个胜 + warn）、多继承 / mixin（刻意单继承，差异化组合走插槽）、模板继承（继承的是整个组件定义——setup / 样式 / 边界一并，不止模板）

**组件注册事件 / components:\<名\>/registered**:
组件注册成功的引擎级广播信号（按名动态事件键，ADR-0085）：五条注册路径（本地 x-define / 继承解析 / x-import 远程 / 全局组件懒预编译）成功注册即发，载荷 `{ name, global }`。**保留事件（retain）**——订阅晚于注册也立即补发（依赖指定组件的场景不漏听，如 `x-define:inherit` 的父组件依赖）；通配符 `components/*/registered` 订阅即补发全部已注册名。挂起继承排水与消费侧等待（x-component pending）共用本事件。事件是「该名已有注册」的引擎级信号，链上可见性由消费方沿「组件查找」自查。
_Avoid_: component/registered（旧单数全局事件已废弃）、注册回调、组件就绪事件（就绪判定归查找协议）

**继承覆盖（Inherit Override）**:
子定义直接子节点（非 `<script setup>` / `<style>`）按**插槽内容分段规则**原样收集的覆盖段（`<template x-slot:名>`=命名段、裸子节点=默认段；无对应父出口 warn+丢弃、未提及出口保留父 fallback）——解析期**替换父快照中该出口的 fallback 子树**，故在组件实例作用域（合并后 data 域）求值。实例化时三层优先级：**消费方内容 > 继承覆盖 > 父 fallback**——继承只改默认，不锁死出口。覆盖段声明作用域形参 → warn + 忽略。详见 ADR-0081。
_Avoid_: 覆盖插槽（那是消费方内容侧词汇）、默认内容覆盖（与 fallback 混淆——覆盖动作发生在定义期，覆盖产物成为新 fallback）

### 引擎结构层

**特性 / Feature**:
引擎子系统的归类单元：自成体系的机制域（覆盖物、工具提示、通知、图标、动作、动画、组件机制等），由「特性机制」（manager / 注册表 / 生命周期，供引擎与指令共同消费）与「具体指令实现」两半组成。区别于引擎核心（编译 / 调度 / 作用域主干，不含业务性机制）。特性间允许横向引用、禁止成环。详见 ADR-0093。
_Avoid_: 模块（泛化）、插件（无动态注册语义）、功能（口语词）

**组装根 / Composition Root**:
engine 门面的架构角色——全引擎**唯一豁免分层依赖规则**的位置：它在构造期引用并装配各特性的 manager，使「引擎核心不反向感知特性」成为可能。除它以外，运行时依赖一律单向（指令与动作实现 → 特性机制 → 引擎核心 → 常量 / 类型 / 工具）。详见 ADR-0093。
_Avoid_: 门面（那是其形态词，不表达豁免职责）、入口文件（那是包导出面 index.ts）、上帝对象（贬义且不表达组装职责）

**内置资产 / Builtin Assets**:
随引擎发行的**纯数据面**：内置组件模板、图标注册数据、内置动作声明——只存数据不存机制（机制住特性层）；「新增内置内容 = 改数据文件」，不动机制代码。被上层单向引用，自身不引用任何层。组件模板经 `components/index.ts` 唯一注册面聚合（`?raw` 导入 + 注册名常量 + 种子表，engine 单点引用——features 层零 `?raw` 导入，ADR-0094）。详见 ADR-0091/0092/0093/0094。
_Avoid_: 静态资源（泛化）、内置资源（与远程加载资源撞义）

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

> 组件定义正身词条见上方「结构占位与组件层」的「组件定义 / x-define」——本层曾与其重复，ADR-0054 更名时收敛。

**`<script setup>`**:
组件的数据/方法/生命周期声明，识别 `<script setup>` 布尔属性或 `<script type="autospark/setup">`（ADR-0031 命名空间化）二者择一。对象字面量经 new Function 求值（信任代码），多个按段（data/methods/locals/hooks）分类合并。**data**（ADR-0057 回归 data 名，撤销 ADR-0055 的 state() 更名）是组件**响应式数据**——对象字面量（实例化时深克隆）或 `data()` 工厂（每实例调用），注入组件响应式数据域（模板可见、修改驱动更新，先于 props 注入）；**setup 顶层其余键（非保留键）= 顶层私有变量**（ADR-0057，程序化形态字段名 `locals`）——非响应式组件私有数据，仅经 `this.<键>` 访问、模板读不到，与内置上下文键重名 warn + 忽略；methods 注入 scope.methods（组件边界查找，ADR-0022 决策二-3 修订后不再进 scope.actions）；hooks 挂 scope.hooks。旧写法 `state()` warn + 剪枝（ADR-0057 移除）。注意：`this.data` 访问器是**聚合视图**（自有 data+props → 祖先近层 → 全局 state），`this.props` 是其等价别名，与 setup 的 data 段是两个层面。
_Avoid_: 组件脚本（泛化）、setup 函数（Vue 术语，机制不同）、`type="setup"`（裸值旧写法已废弃）、state()（响应式数据段已回归 data/data()，ADR-0057）、非响应式 data 段语义（data 已整体响应式化，私有数据用顶层变量）

**this.globalState（组件/action 上下文的全局状态通道）**:
组件 methods/钩子 Proxy 与 action 求值上下文中的全局 store 状态引用（= `engine.store.state`）。ADR-0057 更名自 `this.state`——「state」与组件自有数据语义撞车；更名后语义精确：聚合视图 `this.data` 同名键自有层优先遮蔽，`this.globalState` 是**无遮蔽的明确通道**（保证拿到全局值）。`state` 不再是保留键（顶层私有变量可命名 state，但不建议）。
_Avoid_: this.state（已更名）、全局数据（泛化）、root state（不一致）

**super 引用 / this.super（Inheritance Super）**:
组件 method / 钩子内调用**继承链父方法**的通道（ADR-0082，修订 ADR-0081 的「无 super」决策）：`this.super.方法名(...)`，仅继承组件可用（非继承 `undefined`）。语义为**精确词法链**——super 指「当前执行方法**声明层**的下一层」方法集，`base ← card ← order-card` 三层同名覆盖时 card 方法内 `this.super` 正确解析到 base，不串层无递归。this 绑定当前组件实例（父子方法同一合并 data 域）；视图**仅 methods**（data/locals 扁平可见、hooks 串行全跑，均无遮蔽问题）。`super` 是 setup 顶层私有变量保留键 + method this 的禁覆盖键；门面 `engine.getComponent(el).super` 对称同源。与 `this.$parent`（运行时嵌套父**实例**，组合关系）正交——super 是定义期继承链（is-a 关系）。
_Avoid_: $super（未采纳的前缀形态）、$parent 挪用（那是嵌套父实例通道，组合 ≠ 继承）、super.super 套娃（成员是绑定函数非视图）、万能父视图（super 不暴露父 data/locals——扁平合并已可见）

**scope.hooks**:
组件实例的四阶段生命周期钩子（created/mounted/beforeUnmount/unmounted），砍掉 activated/deactivated（引擎无实例缓存层）、beforeUpdate/updated（细粒度无组件整体重渲染）。每个 hook 用 ComponentMethodContext 作 this（data/props/globalState/scope）。
_Avoid_: 生命周期（泛化）、组件钩子（泛化）

**组件作用域 CSS（Scoped CSS）**:
`<style>` 的**默认**形态（无 `global` 属性时）。属性后缀法（仿 Vue scoped，不支持穿透）：组件根+后代打 `data-cmp-{id}` 属性，选择器末尾追加 `[data-cmp-{id}]`，实例化期按组件定义缓存 + 引用计数注入 head。`id` 取 **def 级稳定值**（`componentScopedId`，ADR-0087 修订）——同 def 全部实例共享同一后缀，与按 defName 缓存一份样式的模型对齐。
_Avoid_: CSS 隔离（泛化）、CSS Modules（机制不同）、全局注入（那是 `<style global>` 的语义，见「全局样式」）

**全局样式 / Global Style（`<style global>`）**:
`<style>` 的全局注入形态（ADR-0087）：不做 scoped 改写，组件**注册时**（声明即生效，无需实例化）原样注入 head——无 id 的多段（跨组件）合并进共享容器 `<style id="autospark-styles">`，带 id（`<style id="xx" global>`）注入独立容器，同 id 按声明序**追加**。生命周期挂 engine（`destroy()` 只移除本 engine 贡献的段，运行期常驻）；同名组件覆盖声明时该组件旧段**整组替换、保持原注入位置**；继承链沿用 styles 拼接语义（跨 def 重复不去重）。`bind()` 不支持（warn + 原样保留，非法声明由浏览器丢弃）；无 `global` 的 `id` 静默忽略；仅 x-define 内生效（组件外 warn）。与组件作用域 CSS 可在同一组件混用——每个 `<style>` 标签独立分流。`global` 是原生标签的**布尔属性**（与 actions 脚本的 `global` 属性、`x-icons.global` 同惯例），不是指令修饰符。
_Avoid_: 全局 CSS（泛化）、global 修饰符（`<style>` 非指令）、document 级资产（那是引擎内置注入物 `autospark-error` 等的用语，用户声明物叫全局样式）

**样式绑定 / CSS 变量响应式（Style Bind）**:
scoped CSS 之上的值响应式能力。`<style>` 声明值写 `bind(expr)`（引号可选，仅作整个属性值，支持任意表达式），编译期提取为 `ComponentDef.styleBinds` 清单、`bind()` 替换为 `var(--name, unset)`；实例化期对每个 bind 调 `hostScope.watch` 求值并写入**组件根元素**的 CSS 变量（每实例独立，与 data-cmp-{id} 同构隔离）。变量名：纯路径→`--{路径}`（`.`→`-`、`*`→`_`，如 `bind("order.style")`→`--order-style`），表达式→`--h{hash36}`（`h` 保 CSS 合法，首字符非数字）。同表达式复用同一变量（一处 watch、多处 var 共享）。null/undefined 不写变量走 `unset` 回退（fallback 固定不可配，要自定义默认值用 `:style`）。详见 ADR-0022 决策四-4.1。
_Avoid_: 内联样式绑定（`:style` 指令是元素级，style bind 是组件级样式表）、CSS-in-JS（无运行时对象）

**组件实例化 / x-component（Component Instantiation）**:
在模板中实例化一个已声明组件的指令：**属性参数承载组件名**（`x-component:counter`，编译期静态可知），**值专职 props**（见「props 注入」）。宿主化身组件根（属性继承：class 合并拼接、style 合并冲突键组件根优先、其他不覆盖）。无属性参数（`x-component="xxx"`）warn 缺组件名并跳过实例化。组件名静态、不支持响应式切换（条件切换用外层 x-if）。组件未就绪（x-import 加载中）显示 loading 占位，就绪后重实例化。远程组件可经 `x-component-options.loader` 一步加载实例化（见「远程直接实例化」）。详见 ADR-0054、ADR-0066。
_Avoid_: x-use（已废弃旧名）、组件渲染（泛化）、组件挂载（Vue 术语）

**组件实例门面 / ComponentInstance（engine.getComponent）**:
外部读取**组件实例**的稳定门面：`engine.getComponent(el)` 自任意元素沿 DOM 链向上找最近的组件实例 scope（就近即止——嵌套组件返回内层；元素在组件外返回 undefined），返回与组件内 `this`（ComponentMethodContext）同构的对象：`el` / `name` / `data`（聚合视图，响应式可写）/ `props`（`data` 别名）/ `globalState` / `methods`（同一 this 绑定的代理）/ `scope`（逃生舱）。心智一句话：**实例就是组件外的 this**。覆盖物实例不经此（渲染于 body 容器，触发处 DOM 链不通），用 `engine.getOverlay` → OverlayHandle。详见 ADR-0080。
_Avoid_: getComponentDeclaration（那是查声明快照）、直接暴露 scope（内部对象，字段布局非公开契约）、覆盖物句柄（OverlayHandle 是覆盖物家族）

**props 注入 / Props Injection（x-component）**:
实例化指令值的语义：对象字面量（成员可引用状态路径）或纯状态路径（对象按键展开，v-bind="obj" 心智）作为 props 集合，注入组件 data 域、后于 data 默认覆盖。**单向**——外部状态 → 组件，组件内修改不回写外部状态（双向是 x-model 的职责）。更新 = 重求值后先与上次应用值**浅值比较**（值无变化跳过）再 Object.assign **只覆盖出现键**（组件内部状态不被重置；绑定的状态对象删键后旧键残留，不做镜像同步）。响应粒度：字面量按成员路径触发；纯状态路径**深层触发**（递归通配订阅，内部任意键变化可见）。组件内经 `this.data.<键>` 或别名 `this.props.<键>` 访问（ADR-0057：`this.props` === `this.data`，同一聚合视图）。
_Avoid_: 双向绑定（那是 x-model）、props 同步（不是镜像同步）、组件通信（泛化）、独立 props 域（props 与 data 同域合并，无独立容器）

**x-import（远程组件加载）**:
fetch 远程 HTML 加载组件定义（可含 1-N 个 x-define）。`.global` 修饰符注册全局组件，否则作用域组件（挂最近祖先 `scope.components`）。url 缓存 + 循环 import 检测。
_Avoid_: 组件异步加载（泛化）、组件懒加载（语义不符）

**远程直接实例化 / loader（Direct Remote Instantiation）**:
x-component 经 `x-component-options.loader` 一步完成「远程加载 + 注册 + 实例化」（ADR-0066）——相对「x-import + x-component」两步组合的**声明糖**，内部复用同一管线（url 缓存、循环检测、注册、`components/<名>/registered` 广播），加载的组件照常进组件查找链供他人复用。loader 语义「**以此 url 为准**」：组件已注册仍 fetch 并以远程版覆盖注册（覆盖 warn，已实例化不受影响）；首帧严格等待 fetch（期间 fallback 占位）。url **响应式**（loader 表达式重求值，url 变化 → 中止旧请求 → 重载重实例化，组件内部状态丢失）；新 url 无同名组件 → error 呈现。`.global` 修饰符注册全局（`x-component:名.global`）。
_Avoid_: 值传 url（值仍专职 props，ADR-0054 不变）、远程加载新机制（纯糖非新管线）、动态加载器抽象（loader 只是选项键名）

**loader 选项（loader Option）**:
`x-component-options.loader` 的声明形态：**string 简写**（以 `/`、`./`、`http(s)://` 开头等字面量 url 直接加载、其余作表达式 watch——与 x-import 双轨同构）| **对象** `{ url, request, fallback, error, width, height }`。`request` 整包透传 fetch（requestInit，参与 url 缓存 key）；`width/height` 是加载中宿主的临时占位尺寸（防布局跳动，成功与出错均移除）；`fallback`（加载中占位）与 `error`（失败呈现）见「loader 占位呈现」。整包/成员属性/定向三形态照 ADR-0007；响应式 url 写成员属性表达式（`x-component-options.loader="表达式"`，成员属性须单段）。
_Avoid_: `loader.url` 多段子路径写法（成员属性须单段，响应用整体表达式）、fallback 声明自身 loader（占位组件不支持嵌套远程加载）

**loader 占位呈现（loader Placeholder）**:
loader 的 `fallback`（加载中）与 `error`（失败）呈现值的统一形态：**HTML 字符串**（静态插入、不参与编译）或 **`{ name, props }`**（引入具名组件：用户 props 与引擎注入上下文 `{ url, name, error }` 合并、**引擎注入优先**）；无 fallback → 默认 x-loading 占位；error 缺省用**内置 error 组件**。error 阶段引擎注入 `error`（Error 实例）与 `message`（引擎生成的友好文案）。
_Avoid_: 占位模板编译（HTML 形态纯静态）、用户 props 覆盖注入键（撞名时注入优先）

**内置 error 组件（Built-in Error Component）**:
engine 初始化注册进全局组件表的**默认错误呈现组件**（ADR-0066）——loader 失败的缺省呈现，亦可 `x-component:error` 显式实例化渲染任意错误。props 契约 `{ error, message, icon, hasRetry, hasClose, hasBack }`：`message` 为引擎友好文案；`icon` 为图标名称（x-icon 机制，未注册静默）；`hasRetry/hasClose/hasBack` 为**布尔显隐键**（falsy 不渲染对应按钮），执行体走 **action 通道**（loader 注入实例 `retry`=重新 fetch、`close`=清除本实例 error 并照常广播信号；`back` 天然命中内置 action）——**函数值不入响应式 data 域**（autostore 当 computed 执行，无限循环陷阱）。用户同名声明沿查找链天然覆盖。error 呈现**替换宿主内容**（非覆盖层）。
_Avoid_: 错误边界（React 术语）、错误拦截器（无拦截语义，纯呈现组件）、props 传执行函数（computed 陷阱，执行体走 action 通道）

**组件数据边界（Component Data Boundary）**:
组件实例化（x-component）的组件默认**封闭**数据边界：组件内表达式只能读自身 data/顶层私有变量、props 与全局 state，祖先 scope 的局部数据域（x-data 域、x-for locals）不可见，读+写一并切断。收口三处：`getContext` 聚合视图、`hasLocalContext` 探测、x-data 相对挂载上溯（越过边界视同越顶落根）。边界只封**数据视图**——action 沿链查找、getComponentDeclaration 定义查找、`this.$parent` 显式寻址照常；与 methods 组件边界（方法查找止步，ADR-0022 决策二-3）正交并存。模板片段渲染（x-loading 遮罩 / x-empty / tree-node 行模板等无组件语义注入的原地 UI 替换）不受边界管辖。详见 ADR-0053。
_Avoid_: 沙箱、数据隔离（那是 scoped CSS 的领域）、穿透（指 method 查找越界，另一通道）、作用域隔离（泛化）

**开放边界（open）**:
`x-define` 的**声明侧**布尔开关（`.open` 修饰符 ≡ `x-define-options="{open:true}"`）：开放该组件的数据边界。默认封闭是**作者契约**——消费侧（x-component-options）只能覆盖已开放组件的基准，不能打开封闭组件。**open 不传播**：开放组件内嵌套声明的私有子组件仍默认封闭（各组件定义独立持有）。
_Avoid_: public / expose（对外词汇不一致）、透明模式（不表达「声明侧契约 + 不可被消费侧打开」语义）

**数据视图基准（Data Context）**:
上下文继承基准，组件与覆盖物家族通用、**同名同语义**（ADR-0053 修订：配置键统一更名 `dataContext`——原 `scope` 与 x-scope/AutoSparkScope 撞名）。两值：`'host'`（消费处上下文）| `'declarer'`（声明处上下文，词法基准——嵌套私有子组件的声明处是外层组件的实例 scope）。解析链：`x-component-options.dataContext`（消费覆盖，仅已开放组件生效）> `x-define-options.dataContext`（作者默认，须配合 open）> `'host'`；覆盖物 `dataContext` 缺省 `'declarer'`（挂链即基准：表达式上下文/数据视图/生命周期统一由 parentScope 表达）。**两栖键**：声明式给基准名，命令式 `open()` 给基准载体（HTMLElement）。三类退化（均 warn 一次）：作者侧 dataContext 无 open、消费侧 dataContext 落封闭组件、全局组件声明 declarer（无声明 scope）；declarer 声明 scope 销毁后悬空降级封闭。
_Avoid_: 数据源（那是异步源家族术语）、上下文基准（中英混杂）、基准点、consumer（已废弃）、scope（配置键语境已统一更名 dataContext；engine scope 语境——AutoSparkScope/x-scope/scope 链——不受影响）

## 已废弃

**Message 家族旧名（ADR-0096 全链更名，未发布零迁移）**:
已废弃。原「消息」子系统全链正名为**通知（Notification）**：目录 `features/messages/` → `notifications/`、`MessageManager` → `NotificationManager`、`engine.messages` → `engine.notifications`、`options.messages` → `options.notifications`、保留键 `$messages` → `$notifications`、全部 `AutoSparkMessage*` / `Message*` 类型与 `MESSAGE_*` 常量 → `Notification*` / `NOTIFICATION_*`、事件 `message:*` → `notification:*`（`toast:show`/`toast:hide` 迁移期双发一并移除）、内置组件键 `autospark.messages.*` → `autospark.notifications.*`、shell 裸键 `message` → `notification`、CSS `autospark-message*` / `data-message-*` / `--autospark-message-*` → `autospark-notification*` / `data-notification-*` / `--autospark-notification-*`、localStorage 键 `autospark-messages` → `autospark-notifications`、自动 id 前缀 `message-N` → `notification-N`。完整映射表见 ADR-0096。
_Avoid_: engine.messages / $messages / options.messages / AutoSparkMessage* / MessageManager / MESSAGE_* / message:* 事件 / autospark.messages.* / `message` shell 裸键 / autospark-message 类名 / data-message-* 属性（一律按上表写 Notification 形态）；本节以下旧词条内的 Message 时代名目为决策当时记录，现名按本条映射换读

**AutoSparkMessage（镜像混合类型，ADR-0089 退役，实施待启动）**:
已废弃。`AutoSparkMessage extends AutoSparkNotificationRecord`（record + closed + 渲染配置 + task 投影的大杂烩镜像类型，ADR-0072/0077 时代 `$notifications.items` 元素）退役——`items` 纯化为 `AutoSparkNotificationRecord[]`（只管数据，与持久化载荷零转换同构）；渲染配置归组件实例 props 注水面、运行态投影归实例 data 域、在屏观察走 DOM display（$notifications.sessions 同批退役）。
_Avoid_: AutoSparkMessage / MessageRecord（写 AutoSparkNotificationRecord）、items 绑渲染键（r.icon/r.width 等——经 `notifications.get(id).data` 读组件面）

**消息会话 / Session class 家族（ADR-0089 退役，实施待启动）**:
已废弃。`MessageSessionBase` / `MessageToastSession` / `MessageTaskSession` / `MessageConfirmSession`（`sessions/` 目录，ADR-0083 class 化产物）整体退役——通知 type 的行为与渲染统一归 **autospark 组件**（x-define + `<script setup>` 的 data/methods/locals/hooks，见「通知 type 组件」词条）；`add()` 返回物从「按 type 分派的会话实例」改为**恒组件实例**（见「通知组件实例」）；`$session` 派生变量同步退役（组件模板内 methods 直达）。历史沿革：ADR-0077 闭包句柄正名 → ADR-0083 class 家族 → ADR-0089 组件化。
_Avoid_: MessageSession / MessageTaskSession / sessions 目录 / $session 派生变量（新架构均不再存在）、session.el / 死会话 / 挂起会话（组件实例恒挂 DOM，语义随可见性模型取代）

**static 冻结快照（x-isolate 旧无值语义，ADR-0060 废弃）**:
已废弃。x-isolate 无值原为「冻结快照」——剥除指令属性、不编译、内层指令/插值静默失效（仅防反应式刷新擦内容）。现无值语义翻转为 **inline 子引擎**：内部模板由完全独立的 child engine 编译，内层绑定正常生效（见「隔离边界 / x-isolate」）。「engine 永不触碰的第三方 DOM 空间」场景退出 x-isolate 职责。翻转无迁移警告通道（语法相同、语义已变），以文档声明 breaking。详见 ADR-0060。
_Avoid_: 静态模式、static 模式、冻结快照（均已废止）；「隔离 = 冻结」的旧心智（隔离是引擎边界，不是内容冻结）

**state() 段 / 非响应式 data 段 / this.state（ADR-0057 数据模型 v2 废弃）**:
已废弃。`<script setup>` 的 `state()`（响应式状态工厂）移除——响应式数据回归 **`data`**（对象字面量或 `data()` 工厂，ADR-0057 显式撤销 ADR-0055 的 data()→state() 更名，回摆是有意的：data 是组件数据的正名，双轨段名是混乱源）；旧非响应式 `data: {}` 段移除——私有数据改用 **setup 顶层变量**（程序化形态 `locals`）；组件/action 上下文 `this.state` 更名 **`this.globalState`**（无遮蔽明确通道）。旧写法 `state()` warn + 剪枝，`this.state` 不再被 Proxy 拦截（落入普通键解析）。
_Avoid_: state()（写 data/data()）、this.state（写 this.globalState）、data 非响应式语境（data 现恒为响应式）

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
已废弃，升级为 x-component / components / getComponent（ADR-0022；其中 getComponent 后经 ADR-0080 更名 getComponentDeclaration）。default 块唯一性抛错语义亦废止，改为 warn + 后者覆盖。
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
已废弃，更名为**加载遮罩（Loading Mask）**——「覆盖物」词汇归属弹层消费家族（覆盖物 / 覆盖物实例 / 覆盖物消费者），x-loading 在宿主上方的覆盖指示层改称遮罩，语义不变。历史 ADR（0008/0021/0038 等）正文保留旧称，作为决策当时的记录。
_Avoid_: 覆盖层（旧称）、loading 层、浮层

**x-overlay 声明语法家族（ADR-0052 修订版废弃）**:
已废弃，升级为「覆盖物 = 任意组件的消费方式」（ADR-0052 组件化统一修订）：`x-overlay:<名称>` 声明语法、`.global` 修饰符、`x-overlay-options` 声明处选项、`engine._globalOverlays` 全局表、`type` 类型认领字段、`params` 消费键、`scope: 'consumer'` 基准值一并删除。新写法：内容直接声明组件（`x-component` / `options.components` / `x-import`），配置只走消费处（`x-dialog-options`，props 走选项成员属性——ADR-0052 v2.3），命令式 `engine.getOverlay(el, name, options?)` 镜像组件查找协议（时名 `getComponent`，ADR-0080 更名 `getComponentDeclaration`）。
_Avoid_: x-overlay、.global（覆盖物）、x-overlay-options、type 认领值、params 键、scope: 'consumer'

**x-dialog 值对象形态（visible 混排 props / 配置，ADR-0052 v2.3 废弃）**:
已废弃，重构为三者正交：值专职 visible（简单路径 / 表达式 / 字面量）、props 走「选项成员属性」`x-dialog-options.props`、配置走 `x-dialog-options`（可定向）。旧写法 `x-dialog:user="{visible: 'ui.flag', userId: 42}"` 值遇 `{` warn + 忽略整个指令；命令式旧隐式写法 `open({userId: 42})`（非保留键自动作 props）**静默失效**（沦入配置自由键，零告警），改用 `open({props: {userId: 42}})`。保留键封闭清单（`visible` + 6 配置键）与 `splitReservedKeys` 隐式分流一并删除。
_Avoid_: x-dialog:<名>="{...}"、params 键、保留键封闭清单、非保留键作 props

**x-use / x-use-options（组件实例化旧名）**:
已废弃，升级为 **x-component:名称 / x-component-options**（ADR-0054 更名）。旧写法 `x-use="counter"`（字面量名）改写 `x-component:counter`；`x-use="{name:'counter',count:1}"`（对象内 name/is/component 字段识别组件名）改写 `x-component:counter="{count:1}"`——特殊字段识别已废除，`name` 等键回归普通 prop 名。x-use 彻底移除：注册表不注册、静默失效，无运行时诊断。
_Avoid_: x-use、x-use-options（改用新写法）

**x-component 值承载名（定义旧写法）**:
已废弃。`x-component="counter"` 的**定义**语义已更名 `x-define="counter"`（ADR-0054）——`x-component` 一词整体让位给实例化指令（属性参数承载名）。旧写法被读作缺少属性参数的实例化（warn 缺组件名）；值恰为纯标识符时 warn 附言迁移指引（指向 x-define）。
_Avoid_: x-component="名称"（定义请改 x-define="名称"）

**`scope` 配置键（数据基准旧名）**:
已废弃，统一更名为 **`dataContext`**（ADR-0053 修订：`x-define-options.scope` / `x-component-options.scope` / 覆盖物配置键与命令式 `open({scope: el})` 一并更名，消除与 x-scope/AutoSparkScope 的第三重重载）。**硬切无兜底**（开发阶段，区别于本表其他条目的 warn 迁移）：旧键静默失效；覆盖物侧旧键 `scope` 脱离保留清单后作为普通 props 注入组件 data 域。值域不变（`'host' | 'declarer'`；覆盖物命令式可传元素）。事件 payload `detail.scope` 同步更名 `detail.dataContext`、实例句柄字段更名 `dataContextEl`。
_Avoid_: x-define-options.scope、x-component-options.scope、open({scope})、detail.scope（均改用 dataContext；engine scope 语境不受影响）

**x-icon-define（ADR-0058 硬移除）**:
已废弃。升级为 **x-icons** 批量声明（`<template x-icons>` 内多个带 id 的 `<svg>`；图标定义从全局注册表演进为 scope 局部「图标域」+ `.global` 全局）。注册表不注册、静默失效，无 warn 无迁移（x-use 先例）。
_Avoid_: x-icon-define（改用 x-icons）

**mask 图标机制家族（ADR-0058 取代）**:
已废弃。CSS mask 渲染管线整体下线：URL 工厂（data URL 生成与 (名称,sw) 缓存）、`--as-icon-<名>` 变量与裸名类规则、`background-color` 颜色模型（data URL 内 currentColor 解析为黑的间接层）、远程属性选择器规则（`data-as-icon`）一并删除；「规范形 SVG」演进为「symbol 归一化」（stroke-width 全 strip 哲学延续，xmlns/data URL 管线不再需要）。`color` 选项语义迁移：background-color → color。历史 ADR（0046）正文保留旧机制描述，作为决策当时的记录。
_Avoid_: mask-image、data-as-icon、`--as-icon-<名>` 变量

**异步图标源 / 远程图标持久缓存 / 图标预取（ADR-0047/0048 → ADR-0058 取代）**:
已废弃。per-icon 远程物种（`x-icon="集/名"` 值形 + `baseUrl/<集>/<名>.svg` 协议）、localStorage 持久缓存、`prefetch` 预取、并发限流整体移除；远程加载统一为 x-icons 声明处批量 IconifyJSON（编译期 fetch + 原名注册 + 会话内存缓存）。旧值形求值 NaN → 空占位（斜杠是除法表达式，复杂形态不回退字面量）。**修订注**：持久缓存后来以「`cache` 选项（声明级 opt-in + TTL）」的受限形态回归（见「IconifyJSON 远程源」），与本词条废弃的无条件持久层（无过期 + LRU + `persist` 全局开关 + 预取）不是同一方案。历史 ADR（0047/0048）正文保留旧协议描述，作为决策当时的记录。
_Avoid_: `集/名` 值形、baseUrl、persist、prefetch

**MessageTask / ProgressTask / persist 字符串值 / 四级渲染链（ADR-0077 更名与重构）**:
已废弃。`MessageTask` / `ProgressTask` 更名 **`AutoSparkMessageSession` 家族**（基类 show/hide/remove + `AutoSparkTaskMessageSession` / `AutoSparkConfirmMessageSession` 子类；`notifications.sessions` 正名视图）；`persist` 字符串值 `'none'/'local'/'remote'` 数值化 **`0/1/2/3`**（常量 `NOTIFICATION_PERSIST`，新增级别 1 会话缓冲）；ADR-0071 决策 16 的四级互斥渲染链（`kinds[kind].render` → `shell` → 内置注册表 → message-shell）被**双层正交组合**取代（公共 shell + kind renderer 经 `x-slot` 出口）；`message-shell` → `shell`、`task-shell` → task renderer、目录 `renders/` → `renderers/`；overlay 内置 shell 表 `BUILTIN_SHELL_NAMES` / `resolveBuiltinShell` 迁入 `options.uiShells`（键 = 消费者裸名）。均未发布零迁移。
_Avoid_: MessageTask / ProgressTask（写 Session 家族）、persist 'none'/'local'/'remote'（写 0/1/2/3 或常量）、message-shell / task-shell / taskWidget（现名 shell / task renderer）、四级查找 / 整卡渲染（双层组合）

**toastManager / ToastProps 旧字段（ADR-0071 更名）**:
已废弃。`engine.toastManager` 更名 **`engine.notifications`**、`ToastManager` → `NotificationManager`（ADR-0071 曾名 MessageManager）、`src/features/messages/` → `src/features/notifications/`（ADR-0071 轻提示升维为通知模块）。`engine.toast()` 方法与全局 `toast` action **保留为别名**（转发 `notifications.add({kind:'toast',...})`）；`engine.toastManager` 属性面不留旧名。ToastProps 旧字段同步更名：`message` → `title`、`delay` → `delayClose`（旧键按未知键 warn + 忽略）。详见 ADR-0071。ADR-0072 再更名（未发布零迁移）：`body` → `description`、`href` → `link`（HTML 属性仍 href）、`url` + `headers` 合并 → `fetchOptions`。
_Avoid_: engine.toastManager、toastManager 类名引用（现 NotificationManager）、旧 props 键 message / delay（写 title / delayClose）

**消息三键旧分工（kind / 语义色 type / 排序 level，ADR-0079 更名）**:
已废弃。`kind`（业务类别）更名 **`type`**（开放集合不变，默认 `'toast'`）；语义色 `type`（五值字符串）更名 **`level`**（`AutoSparkNotificationLevel` 数值枚举 `0`none/`1`info/`2`success/`3`warn/`4`error + 常量 `NOTIFICATION_LEVEL`——宽松入参收数字或名字符串、内部恒数字、success 保留）；排序用 `level`（数字级别）**移除**——列内与镜像纯到达序 FIFO（原「越高级越靠列边端」定序能力整体删除）。连带全链：`options.notifications.kinds` → `types`、`markAllRead(kind?)` → `(type?)`、Session `kind` getter → `type`、kind renderer → type renderer、`BUILTIN_KIND_DEFAULTS` → `BUILTIN_TYPE_DEFAULTS`、DOM `data-message-type` 让位业务类别（语义色迁 `data-notification-level`，值 = level 名字面，CSS 选择器同步换挂；换肤变量 `--autospark-notification-{名}-color`）、出口类名 `autospark-notification-kind` → `autospark-notification-type`。均未发布零迁移：旧键 `kind` 脱离保留键清单（携带 → 未知键 warn，可发现）。
_Avoid_: kind 键 / kinds 配置 / markAllRead(kind) / kind renderer / 内置 kind（写 type / types / type renderer / 内置 type）、data-message-type 当语义色选择器用（改挂 data-notification-level）、level 当排序数字用（定序已删）

**getComponent 查声明旧签名（ADR-0080 语义易主）**:
已废弃。`getComponent` 短名让位给**实例读取**（`engine.getComponent(el)` → ComponentInstance 门面）；查声明职责两级同步更名 **`getComponentDeclaration`**——`scope.getComponentDeclaration(name)`、`engine.getComponentDeclaration(el, name)`，全库统一「getComponent = 实例、getComponentDeclaration = 声明」。硬切无兜底（开发阶段、TS 消费者编译期可发现，`scope` 配置键先例）；历史 ADR 正文保留旧称，作为决策当时的记录。详见 ADR-0080。
_Avoid_: scope.getComponent(name)、engine.getComponent(el, name)（查声明改用 getComponentDeclaration）、按参数个数分流旧/新语义（重载方案已否决）

**component/registered（单数全局注册事件，ADR-0085 更名）**:
已废弃。升级为按名动态键 **`components/<名>/registered`**（保留事件 + 晚订阅补发，见「组件注册事件」）——旧单数全局形态整体移除、不保留双发兼容层：内部消费者（x-component pending 等待）改订带名事件，`on("component/registered")` 从此永不触发（硬切无 warn，`scope` 配置键先例）。历史 ADR（0022/0066/0083）正文保留旧称，作为决策当时的记录。
_Avoid_: component/registered（改用 components/<名>/registered）

**消息闭包同构 / BUILTIN_RENDERERS / renderers 目录（ADR-0083 取代）**:
已废弃。ADR-0077 的 session「闭包全集方法 + 类型窄化」实现被 **class 家族**取代（`MessageSessionBase` + Toast/Task/Confirm 子类真继承——类型面 = 运行时面，基类实例不再携带 task/confirm 域方法）；`src/features/messages/renderers/` 目录更名 **`presets/`**，`BUILTIN_RENDERERS` 引擎私有注册表退役（预设组件经 `options.components` 种子进全局表：`autospark.notifications.base/toast/task/confirm` 继承族）；Task 会话补 `complete`（≡ stop）、基类补 `update/cancel`、manager 补 `respond(id, value)`、factory 升挂起注入形态 `add(async (session) => ...)`。`run()` 展示周期 await 通道曾随本 ADR 实施、随后移除（展示结束感知走 `notification:hide` 事件 + `closed` getter，YAGNI）。均未发布零迁移。
_Avoid_: run() 方法 / await session.run()（已移除——写事件族 / closed getter）、闭包同构 / 运行时全集方法（写 class 家族）、renderers 目录 / resolveBuiltinRendererByKind（写 presets / 全局组件表预设名）
_Avoid_: 闭包同构 / 运行时全集方法（写 class 家族）、renderers 目录 / resolveBuiltinRendererByKind（写 presets / 全局组件表预设名）、（session as any).progress 跨面断言（基类实例真无此方法）

**shell 内容渲染 / 三控制键 action 通道 / 白名单投影（ADR-0088 取代）**:
已废弃。ADR-0077 的「shell 渲染公共元素（title/description/actions 行）」分工修订——内容下放 type 模板，shell 降级为外观容器（chrome + close 钮 + 出口）；ADR-0083 的三控制键二次修订（引擎向 entry.actions 注入控制 action、走 message:action 闭环、不可变更新刷文案）被 **task 模板分立按钮**取代（x-show 数据域驱动、@click 直调 session 方法、不发 notification:action——观测走 notification:update/show/hide）；`_buildInjectProps` 白名单投影改**剥函数整包注入**（task 专属键 warn / 未知键 warn 取消——自定义 type 自有键可进模板）；`autospark.notifications.base` 从薄基类（纯继承协议零内容）升格**默认内容模板**兼 type 链 fallback（「出口空置」退役——自定义 type 不配模板也得标准内容卡）。`_injectTaskOps` / `_dropTaskOps` / `_setPaused` 不可变更新整套随通道删除。均未发布零迁移。
_Avoid_: 控制钮走 actions / 以 notification:action 观测控制行为（改模板按钮 + message:update/show/hide）、出口空置（自定义 type 落 base 兜底）、薄基类 base（有实体内容）、白名单注入（整包剥函数）
