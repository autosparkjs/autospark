# ADR-0127：指令全局默认层（AutoSparkOptions.directives）

- **状态**：Accepted（grill-with-docs，三轮收敛）
- **日期**：2026-10-28
- **关联**：[ADR-0007](0007-directive-options-and-modifiers.md)（指令选项配置体系——本 ADR 在其回退链尾追加全局层）、[ADR-0051](0051-runtime-option-override.md)（运行时选项覆盖——覆盖写回指令选项层，与本层正交）、[CONTEXT.md](../../CONTEXT.md)（新增「指令全局默认」「内置兜底」词条，修订「选项回退」「$options 代理」）

## 背景

指令的默认姿态（如 x-dialog 是否可关闭、x-text 空值占位文案）此前散落在各指令代码的 `?? 兜底` 里，且 ADR-0007 的选项回退链止步于元素级（指令选项 → 宿主选项）。同一页面大量使用同一指令时，「全站统一切换默认姿态」无处下手——要么逐元素写 `x-{name}-options`，要么改源码重新分发。

需求：`AutoSparkOptions.directives` 按指令名提供 engine 级全局默认，如 `directives: {"x-dialog": {closeable: false}}`；任意指令均可以此方式获得全局默认。

用户裁决（关键修正）：优先级骨架为**指令内置默认 < 全局默认 < 元素级指令选项**——全局默认要能覆盖指令内置默认，又被元素级显式声明压过。

## 决策

### 1. 回退链定序：全局层插在宿主选项之下、内置兜底之上

完整链（高 → 低）：**选项成员表达式终值 → 指令选项（`x-{name}-options` + 修饰符注入）→ 宿主选项（`x-options`）→ 指令全局默认（本 ADR）→ 指令内置兜底（代码内 `??` 习语）**。

- 宿主选项压全局默认：同为元素级 vs engine 级，更具体者胜——`x-options` 是「本元素所有指令共享的局部配置」，被远端全局压过会反直觉；
- 全局默认压内置兜底：这正是本机制的存在意义（改全局表即可覆盖内置值，零指令改造）。

键级回退、不深合并，hasOwnProperty 语义全链统一：任一层显式写键（含 `false` / `null`）即命中、阻断下层；深合并会让「对象值选项到底哪层赢」不可预测，与 ADR-0007「缺失才回退」惯例一致。

### 2. key 归一：带前缀主形态、裸名容忍、带前缀优先

内部指令名是裸名（`info.name`，如 `"dialog"`），故查表按裸名匹配：**带前缀 `"x-dialog"` 为文档主形态，裸名 `"dialog"` 等价容忍，双形态并存带前缀优先**（hasOwnProperty 判定，前缀键显式 `null` 亦算命中、不再落裸名）。字面 kebab-case 匹配，不做 case 归一（JS 对象 key 不经 DOM 小写化）；别名以注册表真实指令名为准（`:title` / `x-class` 归一为 bind，写 `"x-bind"`）；无 `*` 通配。未注册指令名静默忽略——按消费方名字查表、无从命中，与孤儿 `-options` 策略一致，且插件指令注册可晚于 engine 构造，warn 会误伤。

### 3. 双出口获能：基类 getOption 与 $options 代理

机制单点落在两个函数，全部注册指令（含 `installPlugin` / `$.directive` 插件指令）零改造自动获能：

- **基类 `getOption`**：链尾追加全局层；
- **`createDirectiveOptions`（`$options` 代理）**：第三参注入全局层，x-model / x-on 两消费点同步接线。**第三参是解析器函数**（`() => getDirectiveGlobalDefaults(engine, name)`）而非解析产物——代理在指令 created 期构造一次、闭包长存，急切解析会把挂载后的表注入对闭包永久遮蔽；解析器形态让代理每次访问活读，与 getOption 语义对齐。解析器抛错按「无本层」处理（配置面不得炸求值）。

### 4. Runtime 通道同样生效

Runtime 指令（无 binding）本就无宿主选项层（无元素 scope），但**全局默认层照常生效**（链：表达式终值 → 指令选项 → 全局默认）——engine 级配置不应因执行通道差异失效；宿主层跳过是「无 scope」的天然限制，全局层无此限制。

### 5. 活读，不快照

每次读取现查 `engine.options.directives`（不快照）：构造后对该表的增改对**之后的读取**生效（含运行时 `engine.options.directives["x-dialog"] = {...}` 注入、`engine.patch` 后编译的新指令），不追溯已渲染结果、不触发重渲染。与「运行时选项覆盖」词条既有「构造期配置纪律（options 运行时突变不失效）」同向；要响应式联动应走 state 而非 options。构造器 init 补 `directives: {}` 默认（同 `actions: {}` 先例），使「构造后注入」路径无需中转判空。

### 6. 内置兜底留在指令代码（否决 static defaults）

内置默认保持各指令 `getOption(key) ?? 默认值` 习语，**不做** `static defaults` 显式默认表 + 基类第五层注入的集中化改造。集中式的可内省收益（默认值文档自动化、`Object.keys` 可见全部可配键）当前无消费方，而代价是全量存量指令改造。语义上「内置 < 全局 < 元素级」由链序 + 既有 `??` 习语自然成立，无需动指令。

### 7. 存量直读点收敛

`x-error._staticOption` / `x-error._bindExprOption` / `x-field._meta` 三处绕过 `getOption` 直读 `this.options[key]` 的读取收敛到 `getOption`，保证「任意指令」承诺成立（二者均未用 `_watchOptionExprs`，`_optionExprValues` 恒 null，收敛无表达式层副作用）。

## 被否决的方案

- **`static defaults` 集中默认表**（见决策 6）：改动面全量指令，可内省收益无消费方；未来做「默认值文档自动化」时再升级；
- **全局默认压宿主选项**：元素级显式声明被远端全局压过，违反「更具体者胜」的配置直觉；
- **深合并**：对象值选项的胜者不可预测，与 ADR-0007 键级回退惯例断裂；
- **构造期快照**：`engine.patch` 后编译的指令读不到挂载后注入的全局默认，活读零成本且语义更直觉；
- **未注册 key warn**：插件指令注册可晚于 engine 构造，时序上无从区分「写错」与「未装」，静默与孤儿 `-options` 策略对齐；
- **`$options` 代理急切解析全局层**：代理闭包长存，急切解析把挂载后注入永久遮蔽（实现期实测踩中，改解析器形态修复）。

## 后果

- **正向**：全站统一切换指令默认姿态有了单一配置点；插件指令零改造获能；`$options` 表达式视图与 `getOption` 行为重新对齐（三层一致）；
- **行为对齐变更**：`x-error` / `x-field` 的选项读取此前**不回退宿主选项**，收敛后 `x-options` 与全局默认对二者生效——这是 ADR-0007 本意的追认（回退链应贯穿全部指令），依赖旧行为（在 x-field 宿主上放无关同名键）的场景理论存在、实际未见；
- **`x-field._meta` 链序**：`x-field-options > 宿主 x-options > 全局默认 > configurable schema`——schema 是字段级声明，落至最具体的指令选项未命中之后、逐层兜底之前；
- **非对象值**（`false` / 字符串 / 数组）的表项视为缺省：配置面宽容（不炸），静默忽略；
- 编译期快照类选项成员（如 x-text `empty` 在 created 期读一次）不因本层引入热应用——「配置成员在指令既有消费时机生效」惯例不变，活读只作用于**消费时现读**的出口（getOption 调用点 / 事件触发时的 `$options`）。
