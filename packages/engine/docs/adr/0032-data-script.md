# ADR-0032：数据脚本 `<script type="autospark/data">`

- **状态**：Accepted
- **日期**：2026-09-12
- **关联**：[ADR-0031](0031-script-type-namespace.md)（script type 命名空间家族——本特性的 type 名直接沿用）、[ADR-0029](0029-x-data-mount.md)（x-data 挂载模型——合成结果完全复用其挂载/回收管道）、[ADR-0007](0007-directive-options-and-modifiers.md)（options 属性的解析形态）、[CONTEXT.md](../../CONTEXT.md)（「数据脚本 / Data Script」词条）

## 背景

x-data 的值写进 HTML 属性，注入大型 JSON 是转义地狱、易错。需求：把数据搬进元素体内容——`<script type="autospark/data">{...}</script>` 等效于在**其直接父元素**上写 x-data；多个脚本之间、脚本与 x-data 之间深合并。grilling 两轮（含 mid-turn 补充 watch 注入）就内容语言、作用目标、时序模型、合并语义、求值环境、options 冲突裁决逐一定案，关键行为均经 spike 实证。

## 决策

### 1. type 名：`autospark/data`（ADR-0031 命名空间家族新成员）

与 `autospark/actions` / `autospark/setup` 同族。新特性无旧写法，无需迁移告警。

### 2. 内容语言：JS 对象字面量（x-data 的超集），注入三个 builder

经 `new Function("computed", "configurable", "watch", "return (...)")(computed, configurable, watch)` 求值——比 x-data 的 relaxed-json 管道（纯 JSON 字面量、不求值）更强：

- **注入 `computed` / `configurable` / `watch`**（autostore 转导出，取用零成本）：async computed、`depends`、schema 元数据、侦听声明只有 builder 形态能表达；
- **普通函数值 = computed 简写**：AutoStore 见函数值即作 getter 求值（`(s) => s.base * 2` 直接是计算属性）。「存函数本身」无形态——方法归 `autospark/actions` / `<script setup>`，数据/方法分家写死；
- **`watch` 的激活机制（spike 实证）**：AutoStore 对 builder 的就地激活发生在响应式代理的 **GET 陷阱**（首读持有 builder 的键时创建 observer 并回写）。computed/configurable 天然被绑定首渲读到；**watch 是纯副作用声明、无人读取**——引擎注入后须**强制首读激活**（`_activateObservers`：数据含函数值时逐键 `void container[k]`，纯 JSON 路径零行为变化；只激活顶层键，嵌套 builder 由绑定读取自然激活，watch 请声明在顶层）；
- **`watch` 用法（spike 实证）**：`watch((sc) => { ... }, filter?)`——getter 即侦听体（`sc = {path, value}` 为变更位置与新值），第二函数参数为可选 filter（圈定触发路径）；
- `this` 无语义不承诺；外部全局变量技术上可见、文档不背书（与 actions/setup 同姿态）。

### 3. 作用目标：直接父元素（与 actions 有意分歧）

`autospark/actions` 挂**最近祖先 scope**（`_findNearestScope` 上溯）；数据脚本**只作用于直接父元素**。分歧理由：action 是惰性查找（触发时才解析，挂错层只是查不到），数据是结构性的（影响首渲与 scope 树形状），必须一眼确定；嵌套声明天然表达子域（想在哪层建域就把脚本放那层的直接子级）。

### 4. 首渲时序：位置无关（desugar 模型）

编译父元素前**预扫其直接子级数据脚本**（`compile/dataScript.ts` 的 `collectDataScripts`），与 x-data 值合成**单一数据对象**后走既有 `applyData` 注入管道——挂载解析（ADR-0029 三形态）、键回收（attachedKeys CAS）、响应式通知全部自动继承，零特判。预扫**每实例新鲜求值**（x-for / x-use 复用模板时各实例独立数据对象，嵌套对象不跨实例共享引用）。

否决「DFS 走到 script 才注入、靠响应式 set 自愈」：编译是先序 DFS，父元素指令（含 x-data `created()` 与同元素绑定的 watch 首渲）先于子元素访问，script 位置将变成隐性行为契约，且 x-if/x-for 会闪一拍空态。

实现约束：因内容可含函数 / builder，**不可**做「改写父元素 x-data 属性字符串」的字面 desugar（序列化丢函数）——是语义等价、内存合成。管线：

- `compileElement` 预扫 → stash 挂 compiler 的 `dataScriptStash`（WeakMap<scope>，读后即删）；
- `DataDirective.created()`（优先级 200，`scope.compile` 内最先执行）消费：**父元素无 x-data 时合成空值 DataDirective** 入列（unshift + 按类 priority 重排）——「脚本独立成立」等效 x-data，父元素即便无任何指令属性也建 scope；
- 剪枝：transformer 前置命中 `autospark/data` 即返回 null（不进渲染 DOM）。

### 5. 合成：flex-tools `deepMerge`，x-data 最后合并胜出

- 多个数据脚本按**文档顺序**后者覆盖前者，最后与 x-data 值 deepMerge——**x-data 优先级最高**（脚本装大 JSON 基底、属性写微调覆盖的分工）；
- deepMerge 实测语义即契约：数组**替换**、**undefined 不覆盖**（`$ignoreUndefined` 默认开）、函数 / computed descriptor **整体覆盖**（`computed()` 返回函数形态，`isPlainObject=false`，同名 computed 不会递归混坏 descriptor）；
- 调用纪律（实现内固化）：**恒在末尾追加空对象 `{}`** 隔离 `$merge` / `$ignoreUndefined` 指令键探测（flex-tools 按**最后一个实参**探测，用户数据撞名 `$merge` 会被吞——有测试钉住）；单参数抛错（仅一个源时不调用）；首参被原地 mutate 并返回（脚本求值结果恒为新对象，无碍）。

### 6. `options` 属性：与 `x-data-options` 同款键，父元素权威

`<script type="autospark/data" options="{mount:'x.y'}">`（relaxed-json 解析）承载 mount / global / nearest——**不发明新键**；多个脚本同键后者覆盖（与数据合成同序）。冲突裁决与数据层同向对称：父元素存在 `x-data-options` 则脚本 options **忽略 + `logger.warn`**。「数据挂在哪」仍只有 mount 一个权威答案（ADR-0029 纪律）。

### 7. 边界

- **动态区统一**：x-for item 模板 / eager x-if 子树 / x-use 组件实例化均经 `compileChild → compileSubtree → transformElement` 复用同一管道，数据脚本就地 desugar，**每实例独立数据域**、随实例生死；
- **x-component 冻结快照内**数据脚本原样保留（快照未编译），消费实例化时才生效——天然成为组件私有数据声明；
- **x-for 成员根绕过 transformer 的补丁**：项成员以 `cloneNode(false)` 直建根、不走 transformElement（只有其子节点走），脚本作为直接子级会成为成员根被原样克隆进 DOM——`ForDirective.parse` 采集项模板时**跳过数据脚本**（不进渲染 DOM、不随项重复）；
- **结构指令宿主的直接子级**（x-for / eager x-if / x-slot 宿主）：compileElement 预扫命中 → `logger.warn` + 放弃注入（其子节点是项模板材料，脚本无处挂载；指引移入项模板内目标元素的直接子级）；
- **错误姿态**：求值失败 / 非对象 / options 解析失败 → `logger.error` + 该脚本视为 `{}` 继续编译（不中断，与 actions 同款）；
- **回收同权**：合成数据整体进声明清单（attachedKeys），destroy 键级 CAS 删除，脚本键与 x-data 键同责。注：builder 激活回写会使容器键值偏离登记末值，root/path 模式的 destroy CAS 因此不删 builder 键（残留语义与「运行时键视为用户接管」一致，可接受）。

### 8. HTML 转义限制

script 体内容含 `</script>` 会截断 HTML 解析——字符串中需写 `<\/script>`（文档化，引擎不接管）。

## 被否决的方案

- **内容语言走 x-data 同款 relaxed-json 管道**（字面「等效于 x-data」）：无法声明 computed / configurable / watch，能力被属性形态锁死——用户裁决要 JS 超集。
- **作用于最近祖先 scope**（与 actions 一致）：数据归属靠上溯推理、中途隔结构指令时难讲，确定性差。
- **DFS 到达时注入、响应式自愈**：见决策 4——script 位置变隐性契约 + 空态闪烁。
- **script 自带 `global` 标志等挂载口子**（actions 同款）：挂载位置出现第二个权威源；收敛为 `options` 属性 + 父元素权威（决策 6）。
- **字面 desugar（改写父元素 x-data 属性串）**：函数 / builder 无法序列化，丢能力。
- **深合并自研**（手写递归 merge）：flex-tools `deepMerge` 语义实测全部命中需求（数组 replace、undefined 不覆盖、函数整体覆盖），自研无增益。

## 后果

- ✅ 大型数据对象获得可注释、可换行的书写位（script 体），属性回归微调覆盖的角色。
- ✅ computed / configurable / watch 首次可在模板内声明（x-data 属性形态做不到）。
- ✅ 复用 ADR-0029 全部挂载/回收语义，零新心智模型。
- ⚠️ watch 依赖「注入后强制首读」激活——只覆盖顶层键，嵌套 watch 不激活（文档化：watch 声明在顶层）。
- **实现落点**：`src/compile/dataScript.ts`（预扫/求值/合成）、`compiler.ts`（剪枝 transformer + `_applyDataScriptStash` / `consumeDataScriptStash` + compileElement 钩子）、`data.ts`（created 合成消费 + `_activateObservers`）、`for.ts`（项模板跳过数据脚本）。
- **交付**：22 用例 `data-script.test.ts` 全绿、既有 795 用例回归通过；CONTEXT.md「数据脚本 / Data Script」词条；docs/zh x-data 指南小节 + demo `data/script.html`。
