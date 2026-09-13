# ADR-0034：x-if 条件分支链（x-else-if / x-else）

- **状态**：Accepted
- **日期**：2026-09-13
- **关联**：[ADR-0016](0016-x-if-detach-and-x-show-independence.md)（x-if detach 语义与锚点注释——分支链完全复用）、[ADR-0002](0002-dynamic-patch.md)（模板只读契约——分支收集用克隆快照的根由）、[ADR-0022](0022-x-component.md)（注册名位模式与冻结快照先例）、[CONTEXT.md](../../CONTEXT.md)（「条件分支链 / x-else-if」词条）

## 背景

x-if 只有单条件（真挂假摘），多路条件须嵌套取反或拆多个 x-if。需求：给 x-if 配套 else 分支，支持多路条件链。用户草案把分支画成 x-if 宿主的**子节点**且带值（`x-else="x1"`），grilling 三轮十问定案（含一次结构形态重开对比）。

## 决策

### 1. 语法：子节点式（A 形态），`x-else-if`（带值）+ `x-else`（裸兜底）

```html
<div x-if="expr">
    <div>then 内容（非分支的直接子元素）</div>
    <div x-else-if="x1">分支 1</div>
    <div x-else-if="x2">分支 2</div>
    <div x-else>兜底分支</div>
</div>
```

**结构形态曾专门重开对比**（兄弟节点式 vs 子节点式）：

| 维度 | 子节点式（选定） | 兄弟节点式（Vue 惯例，被否） |
|---|---|---|
| 渲染一致性 | 声明位置≠渲染位置（分支写在宿主内、渲染在宿主外顶位，DOM 层级变一跳） | 所见即所得 ✅ |
| 单元完整性 | 条件组自包含一个元素，无断链概念 ✅ | 依赖「紧跟」关系，中间插入元素即断链（Vue v-else 高频踩坑点） |
| 实现成本 | 借 eager x-if 的 ownsChildren 顺水推舟，逻辑闭环在 IfDirective ✅ | 须发明横向兄弟归组协议（compiler 预扫归链 + 断链检测），引擎现有协调全是纵向的 |
| 生态心智 | 独创形态（类比 JSX 三元 / Svelte 块） | Vue 用户零学习 ✅ |

选子节点式：实现优雅度差距实在（闭环 vs 全新协议），且根除断链类静默错误；「写在里面、渲染在外面」的间接性在引擎有既有先例（x-component 摘除、x-slot 替换、x-if 自身 detach），非首创心智负担。

**指令名**：带值分支用 `x-else-if="expr"`、裸兜底用 `x-else`（两个属性名；最初草案是单 `x-else` 一名两态，定案时改为两名——带值语义显式化，读模板时「否则若」一目了然）。

### 2. 值语义：elseif 短路链，首个真者胜

主表达式真 → then（宿主）；假 → 按文档顺序求值各 `x-else-if` 表达式，**首个真者胜**；全假且有裸 `x-else` → 兜底；全假无兜底 → 皆不渲染（仅锚点注释占位，与「无 else 的 x-if 为假」一致）。任一表达式变化（含主表达式）**从头重算整链**——所有表达式在 `binding.watch` 独立订阅（与主表达式同 scope，支持相对表达式 / x-for item），回调触发即重算。

### 3. 识别范围：仅直接子元素；嵌套就近归属

只有 x-if 宿主的**直接子元素**中的 `x-else-if` / `x-else` 才是分支；其余子节点（含各层后代）皆为 then 内容。隔层声明（如包在中间 div 里）= 孤儿（见决策 7）。嵌套场景就近归属：分支内再嵌 x-if + 分支链，内层分支归内层宿主（分支快照编译时递归成立）。否决「任意深度归属」（x-component 式）：x-if 子树语义是「宿主内容 = then 内容」，任意深度的分支与「wrap div 是 then 内容一部分」存在归属歧义。

### 4. 渲染机制：编译期克隆快照 + 锚点位渲染，模板只读

- **收集**：IfDirective.`created` 扫描宿主模板直接子元素，`cloneNode(true)` 为冻结快照（保留指令属性、未编译）——**不修改模板**（ADR-0002 只读契约 + transformElement「原树只读」约定），可反复克隆渲染；
- **剪枝**：compiler 前置 transformer 拦截 `x-else-if` / `x-else` 元素返回 null（同 x-fallback 模式）——分支是备选模板，**永不进结果 DOM**，eager 的 `compileSubtree` 与 keepalive 的主 walk 两条子树编译通道统一拦截。另 `compileOneChild` 对分支标记统一剪枝：作为 `transformElement` 的**根**传入时，前置剪枝返回 null 会触发其单根约束抛「根元素被丢弃」（作为非根子孙时剪枝无此问题）；
- **渲染**：命中分支经 `compileChild`（x-for 项根同款机制：浅克隆 + 剥指令属性 + 建 scope 挂 `binding.children` + locals 透传）编译执行，作为**独立元素插到锚点位置**（宿主原位，`insertBefore(el, anchor)`）。x-if 的 detach 语义零改动——then 分支行为与既有完全一致；
- **DOM 层级注意**：分支渲染后是宿主的**兄弟**（模板里写在宿主内）——依赖子选择器的 CSS 须按宿主父级书写。

### 5. 两模式对称：eager 销毁重建 / keepalive 每分支独立保活

- **eager（默认）**：分支切换销毁/重建（分支 scope destroy + DOM 移除，下次命中重新编译快照），与 then 分支同权；
- **keepalive（`.keepalive`）**：**每分支独立保活**——渲染过的分支根 detach 留存（scope/watcher/引用不销毁），切回原宿主 reattach 同元素（状态保留），与 then 的保活语义对称（复用同一套 detach/reattach 基建）。

### 6. 分支根指令：普通指令允许、结构指令禁止

分支根本就是待编译子树的根：普通指令（`:class` / `x-text` / `x-on`…）随分支编译正常执行。同元素**结构指令**（ownsChildren 类：x-for / eager x-if / x-slot）→ 编译期 warn + **跳过该分支**（「分支根循环 / 再条件化」语义混乱；keepalive x-if 不占子树，放行）。

### 7. 孤儿分支：warn + 丢弃

无 x-if 宿主祖先（或非其直接子级）→ 编译期 warn + 摘除丢弃（不进结果 DOM），同 x-component 孤儿惯例。**x-for 容器直接子级**的分支标记同理：x-for 项模板采集（parse 阶段二分）绕过主 walk 剪枝层，须在采集处显式跳过 + warn（项成员编译走 `compileChild` 不经 transformer）。

### 8. 防呆（编译期 warn，运行时按既定语义）

- 裸 `x-else` 非末位（其后仍有分支）→ warn「其后分支永不匹配」，运行时按短路语义（兜底命中即链终止）；
- 同元素 `x-else` + `x-else-if` → warn，按 `x-else-if` 处理；
- `x-else-if` 空值 → warn，按裸兜底处理。

### 9. 与 x-for 复用项的 DOM 重排交互（实现期实证）

x-for Pass3 重排按 `entry.nodes` 全量 `insertBefore`，**不感知 x-if 的 detach 状态**——已 detach 的宿主会被外部插回。据此 `show()` 的卸载分派须区分：

- 空态重复（目标仍为空）→ **重放 detachHost**（幂等：有父摘、无父 no-op），恢复空态；
- 空态 → then → **不先摘再按锚插回**：Pass3 可能已把宿主摆到正确位置，reattachHost 对有父者 no-op 即可；先拆会按「重排后已错位的旧锚」插回，反而错位；
- 空/初始 → 分支 → 宿主完整卸载让位（锚点由 detachHost 确立，分支插锚前）。

## 实现

- `src/directives/presets/else.ts`：`ElseDirective` 空类（注册名位，同 x-component 模式）；
- `src/directives/presets/if.ts`：`_collectBranches`（收集 + 防呆）/ `evaluate`（整链重算）/ `show`（态机分派）/ `mountBranch` / `unmountBranch`；
- `src/directives/presets/index.ts`：`"else-if"` / `else` 显式映射到 `ElseDirective`；
- `src/compile/compiler.ts`：前置剪枝 transformer（孤儿 warn）+ `compileOneChild` 分支标记统一剪枝 + `compileChild` 的 `localData` 放宽为可空（分支透传 `binding.locals`，与 `_linkParent` 自动继承语义一致）；
- `src/directives/presets/for.ts`：项模板采集跳过分支标记 + warn。

## 后果

- 多路条件单元素自包含表达，无断链脆弱性；
- 分支渲染的 DOM 层级与模板书写有一跳差异（文档声明）；
- 测试环境注意：happy-dom 对 `compileChild` 路径元素的 `classList` 存在 token/attribute/contains 三态分裂 quirk（真实浏览器按规范同步），分支根 class 断言宜用属性绑定或 outerHTML。
