# ADR-0060：x-isolate v2（inline 子引擎 / static 废止 / engine 根标识）

- **状态**：Accepted（grill-with-docs，三轮十问；本文即共识落盘）
- **日期**：2026-09-28
- **关联**：[ADR-0006](0006-x-isolate-directive.md)（**废止其决策 1/2**——static 冻结与威胁模型中 static 部分；remote 机制、盲区、teardown 级联继续有效）、[ADR-0001](0001-directive-kind-system.md)（ownsChildren）、[ADR-0007](0007-directive-options-and-modifiers.md)（`x-isolate-options` 回退链）、[ADR-0009](0009-store-or-state-input.md) / [ADR-0044](0044-engine-owned-store.md)（engine 自建 store）、[ADR-0022](0022-x-component.md) / [ADR-0053](0053-component-data-boundary.md)（props 注入的职责分界）、[ADR-0051](0051-runtime-option-override.md)（覆盖清单显式制）、[ADR-0059](0059-x-teleport.md)（queryRelElement 消费方）、[CONTEXT.md](../../CONTEXT.md)（隔离边界 / engine 根标识词条）
- **共识来源**：grilling 三轮决策（模式语法、state 注入语义、options 策略、remote 并存语义、根标识、宿主删除感知、求值方式、引用语义、创建时机、落盘形式）

## 背景

x-isolate v1（ADR-0006）两态：无值 = static 冻结快照（剥指令属性、不编译、内层绑定静默失效）；有值 = remote（url 响应式 fetch → 宿主上建完全独立 child engine）。需求升级：**基于内部模板完全创建一个独立的 engine**——内部模板不是冻结快照，而是被一个全新的独立子引擎编译，内层指令/插值正常生效，与父 engine 状态零耦合。

v1 的 static 冻结在本需求下成为负资产：内层写绑定即静默失效（warn 对冲只是止血），「隔离区域」的真实价值显然是「独立引擎边界」而非「冻结」。且项目未发布，语义翻转成本为零。拷问暴露的接缝：模式语法怎么分派、初始 state 从哪来、child options 给什么、值与内部内容并存怎么裁、子引擎嵌在父 DOM 里沿真实 DOM 的查找越界怎么防、宿主删除的感知边界。

## 决策

### 一、无值 = inline 子引擎；static 废弃删除

`<div x-isolate>`（无值）语义翻转为 **inline 模式**：内部模板由**完全独立的 child engine** 编译——自身 store（engine 自建，ADR-0044 路径）、自身 scope 树、自身 dispatcher/scheduler，与父 engine 状态零耦合；内层指令/`{{}}`/`x-data` 正常生效（由 child engine 编译，非父）。

**static 冻结模式整体删除**（决策 1/2 与 `_warnIfInnerDirectives`/`_stripDirectiveAttrs` 实现、对应测试一并移除）：「engine 永不触碰的第三方 DOM 空间」场景退出 x-isolate 职责——隔离的本意是**边界**而非**冻结**，冻结是边界的退化形态且以「绑定静默失效」为代价。ownsChildren 结构指令身份、dispatcher 盲区登记（`addIsolateRoot`）、`engine.patch` 动态区域守卫沿用不变。

### 二、值三形态分派：无值 / `{...}` 初值 / url 表达式

| 写法 | 模式 | 语义 |
|---|---|---|
| `x-isolate`（无值） | inline | 空 store，内部模板以 `x-data` 自治声明状态 |
| `x-isolate="{...}"`（值 trim 后以 `{` 开头） | inline + 种子 state | 表达式在**父 scope 求值一次**得对象，作为 child 初始 state（种子，ADR-0044 同款「建后身份失效」） |
| `x-isolate="expr"`（其余） | remote | url 表达式，响应式 watch（v1 行为不变） |

- **求值一次、不订阅**：`{...}` 经 `with(scope)` 在 `binding.getContext()` 聚合视图上求值一次（`loading.ts` resolveLiteral 同款内核），拿初值快照——既可写纯字面量 `{count: 0}`，也可引用父状态/局部变量取初值（`{count: parentCount, theme: config.theme}`）。**不订阅**：父后续变化不影响 child——响应式跟随意味着父每次变化销毁重建 child engine，且违反隔离本义。求值失败 / 结果为 nullish / 非对象 → warn + 空对象兜底（child 仍建立，失效可发现）。
- **分派规则安全**：URL 不可能以 `{` 开头，`{` 前缀分派无歧义。
- **引用语义**：种子 state **引用传递不深拷贝**——字面量中的对象/数组与父共享同一引用，隔离责任在书写者（真隔离传纯数据/基本类型）；`structuredClone` 不可克隆函数且引入意外语义，不做。文档明示。

### 三、child options 经 `x-isolate-options` 全量透传，不自动继承

child engine 构造第三参 = `x-isolate-options`（relaxed-json 整包，ADR-0007 回退链：指令选项 → 宿主选项）的解析产物，直接作为 `AutoSparkOptions` 透传。**不自动继承**父 options 的任何字段：

- `sanitizer`/`components` 等定制需要就显式写进 `x-isolate-options`——显式优于隐式，隔离边界不藏隐藏耦合；
- `actions`/`storeOptions` 同理不继承，child 模板经自身 `<script type="autospark/actions">` / `x-data` 自治；
- 全局单例（图标注册表 `AutoSpark.icons`）天然 document 级共享，与继承无关；
- **编译期静态**：x-isolate 不进 ADR-0051 的 `runtimeOptions`/`compileOnlyOptions` 清单（显式清单制，未声明键零观察）——`data-isolate-*` 是普通属性，options 无运行时覆盖通道，child engine 不因 options 变化重建。

remote 模式同样消费 `x-isolate-options`（fetch 成功建 engine 时透传），与 inline 一致。

### 四、remote + 内部内容并存：互斥，warn + 忽略

`x-isolate="url"` 宿主内部声明内容 → 编译期 warn（「remote 模式忽略内部内容」）+ 内容照旧被 fetch 结果替换（现状 `replaceChildren`）。不引入「内部内容 = fallback/初始占位」语义（HTML `<object>` 式）：那会让内部模板经历「编译 → 覆盖时销毁」的 engine 生命周期纠缠，时序复杂化违反 KISS；加载占位由 x-loading 遮罩承担（ADR-0006 决策 6 沿用）。inline 模式（无值 / `{...}`）内部内容即主体，无此 warn。

### 五、engine 根标识 `data-autospark`：真实 DOM 上爬的边界止步

child engine 根 = x-isolate 宿主，**嵌在父 engine DOM 内部**——所有沿**真实 DOM** 向上爬的查找会越界穿入父 engine 的 DOM。逐一核查的结论：

- `findScopeByEl`（engine.ts）：scopes Map 精确匹配 `scope.el === el`，不沿 DOM 上爬——天然不串；
- 编译期 scope 挂链（templateScopeMap 上溯）：沿**克隆树** parentElement 上爬，快照根处自然断裂（compiler.ts 克隆链注释）——天然隔离；
- scope parent 链：编译期建立，child 的 parent 链不指向父 scope——天然隔离；
- **`queryRelElement` 的 `^` closest 与 `../` 爬升**（utils/queryRelElement.ts）：走真实 DOM——child 内元素 `^foo`/`../foo` 会命中父 engine DOM。**唯一真实越界点**。

**标识机制**：engine 构造期统一给根元素打 `data-autospark` 属性（app 根与 isolate 宿主一视同仁；打点在 `template = el.cloneNode(true)` **之后**，属性不进模板、不随编译产物克隆扩散），`destroy()` 移除。`queryRelElement` 的上爬（`^` closest 逐级匹配与 `../` 前缀爬升）**遇 `data-autospark` 元素即止步**——该元素自身仍参与 closest 匹配/query 范围，但不再向其 parentElement 爬升。`/` 全局 query 不受影响（显式跨边界，x-teleport `/.body` 主场景）。爬出 app 根到 body 的罕见写法随之收紧——engine 是相对查找的世界边界，跨边界用 `/` 显式声明。

消费点原则落盘：**任何未来新增的「沿真实 DOM 上爬」机制须遵守同一止步约定**（遇 `data-autospark` 停，不越入相邻 engine）。

### 六、teardown 沿用级联；外部 DOM API 删除不担保（T2 威胁模型不变）

child engine 生命周期接线与 v1 remote 完全一致（ADR-0006 决策 5）：挂指令实例 `this.childEngine`，`destroy()` 里 `childEngine?.destroy()` + abort 在途 fetch；`scope.destroy()` 级联覆盖全部 engine 内路径（x-if toggle / `engine.data` 子树重建 / `engine.patch` / `engine.destroy`）。「x-isolate 宿主删除时 engine 也删除」由该级联承载。**外部 DOM API 直接删除宿主**（第三方 `el.remove()`）父 engine 不知情、child engine 泄漏——与 T2 威胁模型一致文档声明不担保；失联检测（disconnect 自杀）列 fast-follow，不为罕例引入误杀风险。

### 七、inline 同步创建：模板回填 + 立即编译

child engine 在指令 `created()` 内**同步创建**：先从 `this.template` 把原始模板子节点**回填**到宿主（`cloneNode(true)`、**保留指令属性不剥除**——它们是 child engine 的编译输入；已核实结果树中 ownsChildren 宿主的子节点为空，transformElement 挂接时跳过递归），再 `new EngineCtor(this.el, state, options)`（经 `this.engine.constructor` 取同类构造，避循环依赖 + 子类跟随，v1 先例）。同步的依据：inline 无网络等待，defer 的动机（查结果树、等上下文确定）在「child 上下文 = 宿主自身」场景不存在——同步无中间态、无 FOUC（原始模板不短暂裸露）。remote 仍异步 fetch 后建（时序不变）。

## 测试

`src/__tests__/x-isolate.test.ts` 重写 static describe 为 inline：① 内部模板由 child engine 编译（x-data/x-text 生效）；② 与父状态隔离（父变化不影响 child、child x-data 自治）；③ `{...}` 种子（纯字面量 / 引用父状态初值快照 / 父变化不跟随）；④ `{...}` 求值失败 / 非对象 → warn + 空 state 兜底；⑤ `x-isolate-options` 透传（child 经全局组件表消费）；⑥ remote + 内部内容 warn + 忽略；⑦ teardown——x-if toggle → inline child engine 销毁重建；⑧ `data-autospark` 标识——app 根与宿主打点、destroy 移除；⑨ queryRelElement 止步——child 内 `^`/`../` 不越出宿主、`/` 全局不受限；⑩ 盲区——child 子树 runtime 指令不被父 dispatcher 二次 mount。remote describe 现有用例保留。

## 废止

- **ADR-0006 决策 1（static 冻结快照）与决策 2 的 T1 威胁模型叙述**：static 模式删除，无值语义由本文 inline 子引擎取代。ADR-0006 其余决策（remote 生命周期、盲区、teardown、x-loading 复用、错误占位）继续有效。
- 旧 static 写法无迁移警告通道——`<div x-isolate>` 语法不变而语义翻转（内层绑定从静默失效变为生效），breaking 以文档声明。

## 后果

- ✅ 内层绑定静默失效的脚枪拔除：inline 模式下「写了绑定就生效」，心智与普通模板一致。
- ✅ 完全独立子引擎获得一等声明语法：`x-isolate` + 可选种子 state + 可选 options，三属性内表达完整。
- ✅ 真实 DOM 查找的 engine 世界边界确立：`data-autospark` + queryRelElement 止步，跨 engine 越界查找（唯一真实越界点）封死。
- ⚠️ 无值语义 breaking（static → inline）：旧冻结用法无替代语法，文档声明。
- ⚠️ `../` 爬出 app 根的写法收紧（止于 app 根）——影响面极小（queryRelElement 消费方 x-loading/x-dialog/x-teleport 的爬升目标几乎总在 engine 内），跨边界用 `/` 显式声明。
- ⚠️ `{...}` 种子为引用语义：传入对象与父共享，写时注意（文档明示）。
