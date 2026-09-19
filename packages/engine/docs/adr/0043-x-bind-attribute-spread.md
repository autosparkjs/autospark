# ADR-0043：x-bind 无参属性展开（Attribute Spread）

- **状态**：Accepted（grill-with-docs，两轮十一问 + 响应粒度两度修订）
- **日期**：2026-09-19
- **关联**：[ADR-0004](0004-reactive-text-interpolation.md)（插值 desugar-to-bind 的合成绑定先例）、[ADR-0007](0007-directive-options-and-modifiers.md)（指令选项）、[ADR-0019](0019-x-bind-config-reference-prefix.md)（`@` 配置绑定）、[ADR-0025](0025-x-bind-invert-modifier.md)（`.invert`）、[CONTEXT.md](../../CONTEXT.md)（「属性展开 / Attribute Spread」词条）

## 背景

需求原提案以 JSX 风格语法把对象展开为元素属性：`<div {...{a:1, b:'2', c:true, d:false}}>` 展开为 `<div a="1" b="2" c>`（`true` → 裸属性、`false` → 剔除），并支持 `<div {...statePath}>` 指向响应式状态。

拷问暴露出连锁决策：语法载体在本仓库测试环境（happy-dom）下事实性不可行；`c:true → 裸 c` 的语义与 `BindDirective` 既有的布尔白名单制冲突；AutoStore 精确路径订阅不含子键修改（`watch('obj')` 仅整体替换触发）；响应粒度最终定为 `depth: 2` 选项。

## 决策

### 1. 语法载体：属性值（`x-bind="expr"` 无参），而非属性名

原提案把表达式塞进属性**名**（`{...expr}`）。实测死刑证据（happy-dom，`bun` 验证）：

| 写法 | happy-dom 实际解析 |
| --- | --- |
| `<div {...{a:1,b:'2'}}>` | 拆碎为 5 个独立属性：`...` / `a:1` / `b:` / `2` / `c:true` |
| `<div {...datapath}>` | 属性名 `...datapath`（外层花括号被剥，与浏览器解析不一致） |

happy-dom 的属性名解析不遵循 HTML5 属性名规则（把 `{` `}` `,` `:` 当分隔符），与真浏览器（parse error but tolerated、保留单属性名）**结果不同**——同一模板在测试与生产环境解析不一致，且对象字面量里的引号/空格在属性名位置本就是 parse error、无引号可保护。JSX 的 `{...props}` 是 JSX 语法，HTML 借属性名这条路事实性走不通。

改为**属性值**载体：`x-bind` **不带属性参数**时进入展开形态（Vue `v-bind="obj"` 心智；与 `x-class="{active:isActive}"` 既有对象语法同构；`BindDirective.created` 此前对 `attr == null` 本就是 no-op 空位）。值在引号内，无任何解析约束。

### 2. 值分派：通用规则 + 四特判键共享 bind 分派

既有 `BindDirective.patch` 五路分派对普通属性是 `true → "true"`（仅 `disabled/checked/readonly/hidden/selected/multiple` 白名单走裸属性）——白名单制在「展开任意属性集」场景无法解释（`aria-*`、`data-*`、自定义元素属性全不在白名单）。展开采用**统一通用规则**：

- `true` → 裸属性（presence/absence 语义，spread 场景布尔键常态）
- `false` / `null` / `undefined` → 移除
- `string` / `number` → `String()` 写入
- `object` / `array` → warn + 剔除（对象无法表达为属性值）

**四特判键** `class` / `style` / `value` / `checked` 仍走 bind 五路分派（`{class:{primary:x}}` 对象 diff、`{style:{color}}` 键级增删、property 写入）——为 DRY 把五路分派从 `BindDirective` 提炼为模块级 `patchAttrValue`（utils/attrPatch.ts，diff 状态以 `AttrPatchState` 参数传递），单属性绑定与展开**依赖同一抽象**，语义永不漂移。

### 3. 覆盖顺序：书写序后者赢 + class 合并例外

JS 展开心智：书写在展开**之前**的静态属性被展开键覆盖；**之后**的静态属性由静态恒赢（`reservedKeys`，从原始模板 `directive.template` 的保序 attributes 收集——展开指令属性之后的非指令属性）。`class` 键例外：走 classList diff 合并语义，静态 token 永不被碰（引擎既有承诺）。

### 4. 响应粒度：`depth: 2`（两度修订定案）

初版裁决「整体替换触发」（与 `:class="obj"` 现状一致）；用户修订为 deep；最终定 `store.watch` 的 **`depth: 2`** 选项（autostore 三档语义：0=仅自身重赋值 / 1=自身+恰好一级后代 / **≥2=自身+全部后代**）。实测五形态全触发：子键修改、孙键修改、新增键、删除键、整体替换。

- `scope.watchPath` 新增可选第三参透传 watch 选项（`scope.watch` 在路径支路透传；向后兼容），`SpreadBinder` 调 `binding.watch(value, listener, {depth: 2})`；
- 字面量形态 `x-bind="{title: state.title}"` 走表达式支路 `collectDependencies` 键级响应（每个引用独立追踪）；
- **边界**（机制限制）：depth 只作用于路径支路；局部上下文（x-for item / x-data 局部）内的路径形态强制走表达式支路（读代理按实际读取收集依赖，无 depth 概念）——仅整体替换触发，键级响应用字面量形态逃生。

### 5. 指令屏障：展开键永不作为指令编译

展开发生在运行期 patch，编译期指令收集早已完成，时序上天然不可能成为指令。键名匹配指令属性形态（`x-*` / `@*` / `:*`）→ warn + 照写为普通属性（字面值不执行）——可发现性保障，防「看似指令却不生效」的调试陷阱。

### 6. 边界语义

- 整值 `null` / `undefined` → 静默保留旧展开（合法空态，异步数据未落地不闪断）；
- 整值**数组** → 多对象合并展开（决策 8 数组扩展）；整值非对象（`true` / 数字 / 字符串）→ warn + 静默；
- `.invert` 对对象取反无意义 → warn + 忽略；
- warn 以实例级 `Set` 去重（每类警告仅首次，防状态反复替换刷屏；与 x-model「只读降级 warn 一次」先例对齐）；
- 键消失清理：普通键 `removeAttribute`、class 清空本展开贡献的类、style 移除属性（与 `:style` falsy 既有语义一致——静态 style 一并移除）；`value` / `checked` 显式置空（property setter 对 `undefined` 会 String 化为 `"undefined"`，不能走共享分派器的 undefined 语义）。

### 8. 数组扩展：整值为对象数组时合并展开（修订决策 2/6 的「数组即非法值」）

初版把整值数组与 `true` / 数字 / 字符串并列为非法值（warn + 静默）。落地后用户恢复 x-class 数组语法的需求揭示了数组的正当语义：`x-bind="[{a:1}, {b:'2'}]"` 按 **JS spread 心智**多对象合并——`Object.assign` 逐项折叠，键冲突**后者覆盖前者**，合并产物走既有对象展开管线（特判键 / 通用规则 / 键消失清理全部免费复用）。项级规则：

- `falsy` 项（`null` / `undefined` / `false`）跳过——`[cond && {a:1}, {b:2}]` 条件段惯用法；
- 非对象项（字符串 / 数字 / 嵌套数组）→ warn（去重）+ 剔除（不支持嵌套数组，扁平一层）。

配套：`normalizeClass` 同步恢复数组语法（`x-class` / `:class` / `x-bind:class`）——逐项**递归归一并集**（字符串 / 对象 / 嵌套数组混排，falsy 项跳过），撤销「数组语法已废弃」告警及其 logger 管道（`normalizeClass` / `patchClass` / `AttrPatchOptions.logger` 一并移除，YAGNI）。

### 7. 实现载体：组合委托

展开逻辑承载于独立单元 `SpreadBinder`（presets/bind-spread.ts），`BindDirective.created()` 在 `attr == null` 时委托调用——单一职责（S），且与单属性绑定依赖同一 `patchAttrValue` 抽象（D）。`singleton=false` 维持（同元素多个 `:attr` 与无参展开各自独立）。

## 被否决的方案

- **`{...expr}` / `...expr` 属性名载体**：happy-dom 拆碎属性名（决策 1 死刑证据）；值仅限无空格/引号/逗号路径，对象字面量永不可写。
- **新指令 `x-spread`**：多一个指令名概念；`x-bind` 无参空位 + Vue `v-bind` 心智已足够表达。
- **沿用 bind 布尔白名单**：非白名单键 `true → "true"`，直接不满足需求例示（`c:true → 裸 c`）。
- **展开恒赢静态**：`<div class="btn" x-bind="props">` 会干掉静态类，背叛「静态 token 永不被碰」承诺。
- **深遍历 collectDependencies**（求值时递归读所有叶子键收集依赖）：子键可响应但**运行期新增键仍不触发**（读取快照时没读到的键不产生依赖）——「改键响应、加键不响应」的残余盲区比一律不响应更难解释。
- **`obj.**` 递归通配**：与 `depth:2` 实测等价（五形态全覆盖）；选 `depth` 选项为载体——API 语义显式（选项比路径魔法字符串清晰），且不与「通配须绕开表达式支路直连 watchPath」的既有特例纠缠。
- **展开与显式 `:attr` 同键竞写裁决**（实例间协调）：为边缘场景违反 KISS；沿用 bind 多实例「文档不保证」哲学。
- **每次 patch 都 warn**：状态反复替换刷屏；warn 是可发现性手段不是惩罚。

## 后果

- ✅ `<div x-bind="{title:tip, disabled:locked}">` / `x-bind="attrs"` 单声明覆盖整组属性；四特判键与单属性绑定行为逐字节一致（同一分派器）。
- ✅ `scope.watch` / `watchPath` 获得订阅选项透传能力（`depth`），后续深订阅需求可复用。
- ⚠️ **同元素无参展开至多一个**：HTML duplicate attribute 规则下 `x-bind="a" x-bind="b"` 后者被解析器丢弃——「多展开书写序覆盖」仅 DOM API 手工构造可达，竞写不裁决（文档不保证）。
- ⚠️ style 键消失移除整个 `style` 属性（含静态部分）：与 `:style` falsy 既有语义一致，文档声明。
- ⚠️ 局部上下文内路径形态仅整体替换触发（决策 4 边界）：collectDependencies 读代理机制的本质限制，非可修实现问题。
- 交付：`SpreadBinder`（presets/bind-spread.ts）+ `patchAttrValue` 提炼（utils/attrPatch.ts）+ `scope.watch/watchPath` options 透传 + `x-bind-spread.test.ts`（23 用例：值分派 / depth 五形态 / 字面量键级 / 覆盖顺序与静态接管 / class·style·property 特判 / 指令屏障 / 边界语义 / 局部上下文边界）+ 文档站 x-bind 指南节与 demo（bind/spread.html）+ CONTEXT.md 词条 + 本 ADR。
