# ADR-0037：x-switch 分支选择（x-case / x-default）

- **状态**：Accepted（grill-with-docs，两轮十问）
- **日期**：2026-09-13
- **关联**：[ADR-0034](0034-x-if-else-branch-chain.md)（条件分支链——共享基建的供体与本决策的形态先例）、[ADR-0016](0016-x-if-detach-and-x-show-independence.md)（锚点注释 detach 语义）、[ADR-0007](0007-directive-config.md)（keepalive 经修饰符注入指令选项）、[ADR-0002](0002-dynamic-patch.md)（模板只读契约——快照收集的根由）、[ADR-0022](0022-x-component.md)（use.ts 结构指令名单早已列入 x-switch 的预言兑现）、[CONTEXT.md](../../CONTEXT.md)（「分支选择 / x-switch」词条）

## 背景

多路条件已有 x-if 条件分支链（ADR-0034）：每分支一个**独立布尔表达式**、短路求值。但当各分支条件是「同一主表达式的不同取值」时（状态机 tab、level 分档），写成 `<div x-else-if="status==='a'">` 链存在三重冗余：主表达式重复书写、重复求值（每分支独立订阅）、比较意图被 `===` 淹没。

`src/directives/presets/switch.ts` 早有未注册的占位骨架（草案形态：宿主 + 直接子级 `x-case` + `x-default`），`use.ts` 结构指令冲突名单也已列入 x-switch。需求：落地 x-switch 分支选择指令，**最大程度复用 x-if 分支链基建**（用户明确诉求）。

grilling 两轮十问定案（第一轮核心语义五问、第二轮边界与实现形态五问）。

## 决策

### 1. 语法：子节点式，`x-case`（relaxed-json 字面量）+ `x-default`（裸兜底）

```html
<div x-switch="status">
    <div x-case="loading">加载中…</div>
    <div x-case="[error, fatal]">出错了</div>
    <div x-default>正常内容</div>
</div>
```

- **case 值是 relaxed-json 字面量**，不是表达式：`a` → 字符串 `"a"`、`1` → 数字、`true` → 布尔、`[a, 2]` → 多值数组（命中任一即可）。编译期解析定死、零 watcher 开销、JS `switch` 的 case 常量心智；与配置体系（relaxed-json，ADR-0007）解析惯例一致。
- 命名沿用占位草案：`x-case` / `x-default`（不引入 `x-when` 等新词）；**不复用 `x-else`**——else 的剪枝层判据（父有 x-if）会误伤，且「条件链尾」与「值匹配兜底」语义混载。
- 动态比较（case 值须读状态）**不是 x-switch 的职责**——那是 x-if 分支链的既有多路能力，两指令职责分明：x-if 链答「哪个条件真」、x-switch 答「这个值是什么」。

### 2. 宿主形态：锚点占位式（x-if 分支链同构）

宿主**摘除 + 锚点注释占位**，命中分支作为**独立元素插到宿主原位**（兄弟位）——与 x-if 分支链渲染机制完全同构（ADR-0034 决策 4）：

- 复用度最大化：锚点管理 / mountBranch / unmountBranch / eager/keepalive 两态整套基建直接共享（见决策 9）；
- 与 x-if 同属「条件/分支选择」域，心智一致——「写在宿主内、渲染在宿主外」的一跳差异引擎已有先例（x-if 分支链、x-component 摘除、x-slot 替换）；
- 代价同 x-if 分支链：`ul>li` 类容器结构须外层包裹书写（依赖子选择器的 CSS 按宿主父级书写）。

否决 **容器式**（x-for B 容器语义：宿主留存、分支作子级）：`<ul x-switch>` 结构虽自然，但须新造「容器内插分支」机制，x-if 分支链基建大半用不上——复用度是本决策的第一约束。

### 3. 比较算法：SameValueZero

主值与 case 字面量的相等判定用 **SameValueZero**：`NaN` 可匹配 `x-case="NaN"`、`+0/-0` 视为相等；多值数组直接 `Array.prototype.includes`（内部即 SameValueZero）。与「空值集判定用 includes（SameValueZero）」的既有惯例（ADR-0014）一条线，NaN 不成为玄学死角。

主值为对象/数组时 SameValueZero 退化为引用比较——字面量 case 实际永不匹配：**静默落 default/空态 + 文档声明「仅原始值有意义」**（运行时值类型多变，warn 需防重标记，复杂度不值）。

### 4. default 语义：JS switch 式位置无关

**先按文档顺序扫 case 找匹配，全不中才落 default——default 的书写位置不影响结果**。这是 JS `switch` 的直觉语义，且「default 非末位」无真实陷阱、无需防呆 warn（对比 x-if 链短路式须 warn「其后分支永不匹配」）。

否决**文档顺序短路式**（x-if 链同构、首个命中者胜含 default）：default 排前会遮蔽其后所有 case，反直觉且须加一类防呆。多个 `x-default` → warn + 取第一个（对齐 x-else 首个生效惯例）。

### 5. keepalive 两态对齐 x-if，首版即带

- **eager（默认）**：分支切换销毁/重建（scope destroy + DOM 移除），与 x-if 分支链同权；
- **keepalive（`.keepalive` 修饰符，≡ `x-switch-options="{keepalive:true}"`）**：**每分支独立保活**——渲染过的分支根 detach 留存（scope/watcher/引用不销毁），切回 reattach 同元素（状态保留）。

tab 切换正是保活高价值场景（表单页签切走再切回、输入不丢）；复用 x-if 基建后 keepalive 边际成本低，且避免与 x-if 行为不对称的心智负担。

### 6. 结构约定与防呆（编译期 warn，运行时按既定语义）

对齐 ADR-0034 决策 3/6/7/8 的同族约定：

- **识别范围**：仅宿主的**直接子元素**中的 `x-case` / `x-default` 是分支；嵌套就近归属（分支内再嵌 x-switch 递归成立）；
- **非分支子元素**：warn + 忽略（随宿主离开 DOM 天然不可见）；
- **分支根禁结构指令**（ownsChildren 类：x-for / eager x-if / x-slot）→ warn + 跳过该分支；
- **孤儿分支**（父无 x-switch，含误写在 x-if 宿主内的 x-case）→ warn + 丢弃；三处剪枝点同步扩展（compiler 前置 transformer / `compileOneChild` / `for.ts` 项模板采集）；
- **x-case 空值** → warn + 按 x-default 兜底处理（对齐「x-else-if 空值按兜底」惯例）；
- **x-default 带值** → warn + 忽略值（裸属性形态为准）；
- **x-switch 空值** → warn + no-op 不渲染（对齐 x-if 空值 no-op 惯例）；
- **case 字面量 relaxed-json 解析失败** → warn + 跳过该分支。

### 7. 同元素冲突：ownsChildren 对齐 x-if

eager x-switch 占子树（ownsChildren）→ 与 x-for / eager x-if / x-slot 同元素走既有互斥报错；keepalive 不占子树、可与 x-for 共存（对齐 x-if.keepalive）。`use.ts` 结构指令冲突名单中的 x-switch 从预言变事实（ADR-0022 决策五-5 无需改动）。

### 8. 注册与优先级

`presetDirectives` 注册三名：`switch` → `SwitchDirective`（实类）、`case` / `default` → 空名位类（同 ElseDirective 模式——声明性标记，逻辑在 SwitchDirective 与剪枝层）。priority = 80（对齐 x-if，同域同档）、singleton。

### 9. 实现复用：抽共享分支基建模块，IfDirective 同步改造委托

把分支链的**机制**从 if.ts 抽到共享模块（条目结构 / 锚点管理 / mountBranch / unmountBranch 的 compileChild + eager/keepalive 两态），**IfDirective 与 SwitchDirective 共同委托**：

- x-if 保留自有部分：then 态（宿主自身展示）、短路 evaluate、主/分支表达式多 watcher；
- x-switch 自有部分：更简单的 evaluate（主表达式单 watcher 求值一次 + 编译期定死的字面量匹配，无 then 态）；
- IfDirective 改造有 908 个既有测试做回归护栏。

否决两个替代方案：

- **SwitchDirective extends IfDirective**：继承改造须参数化 evaluate + 关闭 then 态，if.ts 被塞进模式开关，复杂度反噬——组合优于继承；
- **编译期 desugar 成 x-if 链**（`x-case="'a'"` → `x-else-if="status==='a'"`）：主表达式被拼进每个分支表达式独立订阅、**重复求值**（含函数调用副作用），switch「求值一次」的核心语义破产；复杂表达式拼串另有注入与边界风险。

### 10. 文档落点

ADR-0037（本文）；CONTEXT.md「分支选择 / x-switch」词条（显隐控制层，与「条件分支链」对仗）；`docs/zh/directives/x-switch.md` 指令页 + demos（基础 / default 兜底 / keepalive 保活 / 多值数组）；根 + engine CLAUDE.md ADR 索引更到 0037。

## 被否决的方案

- **case 值为表达式**（读状态动态比较）：每 case 一 watcher、主值与 case 值双边可变、比较语义漂移；动态比较是 x-if 链既有职责。
- **容器式宿主**（x-for B 容器语义）：结构自然但复用度低，与「最大程度复用」第一约束冲突。
- **复用 x-else 作兜底标记**：剪枝判据误伤 + 「条件链尾」与「值匹配兜底」语义混载。
- **严格相等 `===`**：NaN 匹配不到成玄学死角；多值数组须另定义比较。
- **文档顺序短路式 default**：default 排前遮蔽后续 case，反直觉。
- **keepalive 后置（YAGNI 第一版只做 eager）**：tab 场景恰是保活高价值区，复用基建后边际成本低。
- **SwitchDirective 继承 IfDirective**：模式开关复杂度反噬。
- **编译期 desugar 成 x-if 链**：主表达式重复求值，switch 核心语义破产。

## 后果

- ✅ 多路值匹配单元素自包含表达，主表达式求值一次、零分支 watcher；
- ✅ 分支链基建（快照收集 / 锚点 / 挂卸 / keepalive）由两指令共享，后续修一处两边受益；
- ✅ 顺手修复 ADR-0034 遗留：孤儿分支判据 `hasAttribute("x-if")` 对 `x-if.keepalive` 宿主（属性名含修饰符后缀）误报孤儿 warn——抽 `hasDirectiveAttr`（匹配 `x-if` 与 `x-if.<modifiers>` 两形态），x-if / x-switch 判据同构沿用，防回归用例锁定；
- ✅ 顺带将 `_resolveOwnership` 冲突报错文案从硬编码「x-if/x-for 冲突」改为动态列出冲突指令名（x-switch 参与冲突时不再张冠李戴）；
- ⚠️ 分支渲染的 DOM 层级与模板书写有一跳差异（同 ADR-0034，文档声明）；
- ⚠️ IfDirective 同步改造是既有行为的风险面——908 测试回归护栏 + x-if 分支链专项用例覆盖；
- 测试环境注意同 ADR-0034：happy-dom 对 compileChild 路径元素的 classList 有 quirk，分支根 class 断言宜用属性绑定或 outerHTML。
