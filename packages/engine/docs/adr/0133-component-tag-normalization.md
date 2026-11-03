# ADR-0133：组件标签归一化推导 + 撞名就近遮蔽 + 懒预编译缺口修复

- 状态：已接受（2026-11-03）
- 关联：修订 [ADR-0117](0117-x-define-element-directive.md)（决策 1 值域、决策 5 撞名规则、已知边界懒预编译时序）；上游 [ADR-0088](0088-dotted-component-name-candidates.md)（升序候选回溯机制复用）；[ADR-0116](0116-plugin-precompile-hook.md)（button 插件 precompile workaround 随本决策退役）；[ADR-0094](0094-builtin-components.md)（`autospark.*` 官方命名空间语义沿用）
- 前置共识：2026-11-03 grilling 定案（Q1~Q12 决策台账，本文按主题归并）

## 背景

ADR-0117 落地「组件声明即元素名指令」后，标签化使用存在三个断点：

1. **点号组件名推导出不可写的标签**：注册名合法含点（`autospark.button`，ADR-0094 官方命名空间），缺省推导却是纯小写拼接——`x-autospark.button` 是带点标签，基本不可用；`order.counter` 同病；
2. **camelCase 小写丢失**：`orderCard` 推导 `x-ordercard`（纯小写化），与 `x-component:orderCard` 不同源，tag.md 只能以「建议 kebab-case」警示绕行；
3. **全局表懒预编译时序缺口**（ADR-0117 已知边界）：`options.components` / 插件全局表组件的标签安装由 def 注册触发，而 def 要等首次消费才生成，晚于 `<x-*>` 元素首编译——button 插件被迫以 precompile DOM 变换（`querySelectorAll("x-button")` 硬编码改写为 `x-component` 值形态）自举，workaround 与引擎机制双轨。

## 决策

### 决策 1：名称→标签**归一化推导**（缺省通道）

`tag` 缺省 / `true` 的推导由「`x-{组件名}` 小写化」升级为归一化管线（`deriveComponentTag`）：

1. camelCase 边界插 `-`（**先于**小写化——HTML 解析器把元素名全量小写化，`x-orderCard` 到 DOM 已是 `x-ordercard`，不拆分则永远匹配不上）；
2. 小写化 + 连续无效字符（点 / 下划线 / 空格等非 `[a-z0-9]`）折叠为单个 `-` + 去首尾 `-`。

**同名异写归一**：`order.counter` / `orderCounter` / `order_counter` 同归 `x-order-counter`。归一化产物为空或非字母开头（如组件名 `"123"`）→ warn + 不注册。

**单向派生别名**：注册表键与 `x-component:` 查找**保持原名不变**（含 ADR-0088 点号候选回溯），标签只是「原名 → 标签」的单向派生——零回归面。

**存量切换不留双注册**（grilling Q8）：旧推导标签（`x-ordercard`）直接失效，文档写迁移说明；引擎 0.x 快速迭代期无稳定性承诺，双注册徒增机制复杂度。

### 决策 2：`autospark.` 前缀字面剥离（官方组件通道）

推导前先剥离**字面**头部 `autospark.`：`autospark.button` → `x-button`、`autospark.counter` → `x-counter`——官方组件获得最短标签。第三方命名空间**不剥离**（`mylib.counter` → `x-mylib-counter` 完整转换）：泛化剥首段会让第三方抢短名、标签与定义名的对应关系不可预测（grilling Q2）。

### 决策 3：`tag` 显式值域修订

- 不含连字符的非空字符串：**自动补 `x-` 前缀**（`tag: "div"` → `<x-div>`，`tag: "my"` → `<x-my>`）——原「无连字符即非法值」放宽，防撞标准元素的同时不再拒绝单词标签（grilling Q5）；
- 补前缀后须匹配 `^[a-z][a-z0-9]*(-[a-z0-9]+)*$`（空格 / 首尾 `-` 等）仍为非法：warn + 回落自动推导；
- 显式值**不做归一化魔法**（归一化只用于自动推导）——显式声明要么精确合法要么作废，语义清晰。

### 决策 4：不同组件撞同标签——**就近遮蔽**（grilling Q10 修订 + Q12）

撞名不再跳过：生成类从闭包**单一组件名**改为持有**候选名列表**（`autoComponentCandidates`，注册期可追加/摘除），`created()` 时经 `scope.resolveNearestComponentDeclaration(names)` 按**使用处 scope 链**逐层解析：

- 每层**层内试全部候选**——内层任意候选胜外层（就近遮蔽）：官方短标签 `<x-counter>` 可被子树内同名局部定义覆盖，子树外照常解析官方组件；
- 层内序：候选清单即声明（注册追加）序，**逆序遍历**——同 scope 多候选（就近失灵）后声明胜，与 CSS 后胜直觉一致，同时 warn 保留排错线索；
- 全局兜底段（scope 链到顶）按声明序正序，先者胜；
- 全候选 miss 回退首候选，走 ComponentDirective 既有 pending 等待。

价值场景：`autospark.counter`（全局）与局部 `counter` 同归 `<x-counter>`——不同子树各取所近，无需改名避让。

### 决策 5：撞名 fail-fast 边界（实施期收窄）

- **标签撞非组件指令的元素名**（如 `tag: "x-super"`，或推导标签撞预设元素名指令）：**CompileError**——作者明确要占该标签，全局注册语义无就近可言，静默跳过会让标签失效难排查（grilling Q10 拍板升格）；
- **组件名撞预设/自定义指令名**（如 `x-define="form"` 撞 `x-form` 指令）：维持 **warn + 跳过标签安装**（ADR-0117 原语义）。实施中发现原计划 error 会炸掉组件注册本身——注册键让位只影响标签安装，组件经 `x-component:form` 一直合法可用（存量测试即有此用法），error 属误伤，故收窄回 warn。

### 决策 6：懒预编译时序缺口修复——编译期反查（ADR-0117 已知边界关闭）

`compiler.compileElement` 前置反查：元素名 miss 且形如 `x-*` 时，按标签反推候选组件名触发 `_resolveGlobalComponent`（命中即懒预编译 → `registerComponentDef` → 标签安装，索引随注册重建），本元素随后照常命中元素名通道。

- **反查候选序**：`autospark.{rest}` 优先（官方通道）、`{rest}` 兜底；另补 kebab→camel（`orderCounter`）与 kebab→dot（`order.counter`）还原——归一化多名归一，反向枚举确定形态共六候选去重；
- **反查 miss** 且形如 `x-*`：warn 一次（每标签每 engine 去重）——排错线索，原先是静默素标签；
- 非 `x-` 前缀元素零开销跳过（前缀快速判定，普通元素每元素仅一次 `startsWith`）；
- **button 插件 precompile workaround 退役**：引擎原生通道承接 `<x-button>`，插件回归纯注册（模板字符串入全局表），双轨消除。

### 决策 7：选项属性按**标签基名**读取

元素名形态的孤儿选项属性由 `x-{组件名}-options` 改为 `x-{标签基名}-options`（标签去 `x-` 前缀，如 `x-order-counter-options`）——组件名可含点号/大写，依组件名拼属性名不可书写，标签才是作者直接书写面。`x-component-options` 兼容别名不变。

## 已知边界（V1 明确不做）

- **反查候选枚举有限**：归一化多名归一（`a.b` / `aB` / `a_b` 同标签），反向只枚举六种确定形态（`autospark.{rest}` / `{rest}` / camel / dot 及其 `autospark.` 前缀变体）——极端异写（`a.b-C` 混合形态）反查不到，可先 `x-component:名` 暖注册；
- **使用点先于局部定义**的既有顺序约束不变（编译 DFS 文档序）：定义在使用点之后时元素按素标签输出——新行为是反查 miss warn 提供线索（原为静默）；
- **就近解析仅元素名形态**：`x-component:名` 是显式名，无撞名场景，不走候选链。

## 被否决的方案

- **双注册过渡期**（旧标签 `x-ordercard` 与新标签并存 + deprecated warn）：0.x 无稳定性承诺，双注册徒增机制复杂度（grilling Q8）；
- **泛化剥首段命名空间**（`mylib.counter` 也剥 → `x-counter`）：第三方抢短名、冲突面剧增、标签与定义名对应不可预测（grilling Q2）；
- **点分属性 `x-define-options.tag="xxx"`**：撞修饰符解析切分（ADR-0088 同族坑）与 DOM 属性名小写化两坑，走既有 relaxed-json 选项通道（grilling Q3）；
- **撞名就近遮蔽时同 scope error**：误伤「先粗版后同名细版」的渐进写法，改后声明胜 + warn（grilling Q12）；
- **标签命中时反查 scope 链逐 scope 延迟绑定**（每次实例化全链重解析）：候选解析收敛在 created() 一次（快照语义），后续实例化复用类候选清单，仅名解析按使用处就近；
- **编译期全树预扫描全局表组件**（不按需反查）：全部懒预编译违背「懒」的本意，未知标签无差别触发编译开销。

## 后果

- ✅ 官方组件获得最短标签（`autospark.button` → `<x-button>`），无插件自举；
- ✅ 点号 / camelCase / 下划线组件名全部可标签化，同名异写归一到同一标签；
- ✅ 全局表组件纯标签首消费可用（时序缺口关闭），未知 `x-*` 标签有 warn 线索；
- ✅ 撞名就近遮蔽：官方短标签可被局部定义覆盖，子树间互不干扰；
- ⚠️ 旧推导标签（camelCase 小写型 `x-ordercard`）失效——**破坏性变更**，迁移：组件名改 kebab-case 或显式 `tag` 声明旧标签；
- ⚠️ `x-{组件名}-options` → `x-{标签基名}-options`（含点/大写组件名的场景旧形态本就不可写，实际影响面小）；
- ⚠️ `DirectiveManager.delete` 新增 override（元素名索引失效）——候选摘除依赖。

## 实现注记（非架构决策，落地时遵循）

- `engine/compile/collect.ts`：`deriveComponentTag`（归一化 + 剥离，导出）、`extractTagOption` 值域修订；
- `features/component/auto-component.ts`：`AutoComponentCandidate`（name + declarerScope）、`createAutoComponentClass(candidates, tag)`（静态 `autoComponentCandidates` 数组 + `autoComponentName` 兼容首候选）、`detachAutoComponentCandidate`（换标签摘除）、`installAutoComponentTag(engine, def)`（签名改传 def——同 scope 判据需 declarerScope）、`readElementComponentOptions` 按标签基名；
- `engine/scope.ts`：`resolveNearestComponentDeclaration(names)`（层内逆序 + 全局兜底正序）；
- `features/directive/manager.ts`：`delete` override 置空元素名索引；
- `engine/engine.ts`：`registerComponentDef` 调 `installAutoComponentTag(this, def)`；
- `engine/compile/compiler.ts`：`_resolveUnknownElementComponent`（compileElement 前置反查）+ `_warnedUnknownTags` 去重；
- plugins：`components/button/index.ts` precompile DOM 变换与 `inferPropValue` 删除；
- 测试：`x-define-tag.test.ts`（归一化 / 剥离 / 就近遮蔽 / 后声明胜 / 撞名收窄语义 / 反查 / miss warn）；plugins `button-plugin.test.ts` 补 `<x-button>` 原生通道用例；
- 文档：guide `component/tag.md` / `instantiate.md`；CONTEXT.md「元素名组件」词条。
