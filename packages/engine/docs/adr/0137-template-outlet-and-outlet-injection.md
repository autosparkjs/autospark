# ADR-0137：template 出口载体与出口注入（可选插槽）

- 状态：已采纳（2026-11-14 当日实施：单测 21 例 + 真浏览器 e2e 16 项断言全绿）
- 修订（2026-11-15）：**缺陷警示误报澄清 + 产物路径复证**。2026-11-14 晚间曾记录「Chromium IIFE 产物下 template 出口不展开」缺陷（症状：出口 template 残留、内容落 `template.content` 不可见）——该症状与本文背景第 4 点的**实施前半残现状**完全一致，实证所用产物为 ADR-0137 实施前构建的陈旧 IIFE，警示系误报。2026-11-15 以实施后源码重建产物（Bun.serve + Playwright 驱动 `template-outlet-e2e.html` 全 15 项断言）复证通过；消费侧 `autospark.field` 的 prefix/suffix 出口已切 template 载体（ADR-0020 注记闭环），专项 18 项断言（投影可见/类注入拼接/几何间距/防收缩/DOM 序/次要色/点击转发/空出口消失/裸态继承零残留）全绿。教训固化：**e2e 断言必须经 runner 驱动且产物须与被测源码同源重建**，陈旧产物 + 无 runner 的「全绿/翻车」双向皆不可信。
- 日期：2026-11-14
- 关联：[ADR-0056](0056-x-slot.md)（插槽机制）、[ADR-0062](0062-overlay-shell.md)（live 段 / shell）、[ADR-0081](0081-component-define-inherit.md)（继承覆盖段）、[ADR-0084](0084-x-super-slot-fallback.md)（x-super）、[ADR-0107](0107-slots-registry-and-dynamic-outlets.md)（动态出口名 / $slots）、[ADR-0108](0108-x-slot-bind-caller-bindings.md)（传递绑定）、[ADR-0124](0124-overlay-content-component.md)（点分出口名 / shell 分段）、[ADR-0125](0125-slot-forwarding.md)（插槽转发）

## 背景

组件作者在出口声明侧有三个既有体系表达不了的缺口，叠加一处**半残现状**：

1. **无包裹层出口**：元素出口铁律是「标记元素保留为真实包裹层」（fallback 需要宿主）——但 flex/grid 布局下包裹层破坏子项融合（容器组件的长期痛点，只能靠 `display:contents` 约定缓解）；
2. **可选区域**：fallback 铁律是「无内容则渲染出口子树」——「不填就整体消失」的可选区块无法表达（只能用空默认值 + x-show 之类绕行）；
3. **声明侧授形**：组件作者想让使用方填充的内容根统一获得 `class` / `data-*` / 行为（如 `x-show`）——现有通道只能靠使用方自觉或 JS 钩子；
4. **template 载体半残**：`<template x-slot:名>` 在出口清单推断（`collectOutletSlots` 递归 `.content`）与 `SlotDirective` 的 fallback / super 分支均已有局部处理，但投影与 fallback 的**挂载目标都是 `this.el`（template 元素自身）**——template 是 UA 样式 `display:none` 元素，真浏览器里挂上去的内容根本不可见（happy-dom 无渲染管线、结构可查，测试假绿）。

同时，ADR-0108 传递绑定建立了「内容侧 → 出口元素」的属性通道，「声明侧 → 内容根」的反向通道不存在。

## 决策

### 一、template 出口载体（空/非空分流语义）

出口标记的**第二载体**：`<template x-slot:header …>`（含裸 `x-slot` 与动态名值形态）。template 不进运行 DOM，按**空/非空**分流：

- **非空**（存在任一实质子节点；纯空白文本 / HTML 注释不算，对齐既有 `isWhitespaceOnlyCarrier` 判定）= **fallback 出口**：
  - 未填充 → 渲染 `.content` 子树 fallback（组件作用域求值，与元素出口一致）；fallback 根**同样享受出口注入**（防「填充有样式、未填充裸奔」的跳变——fallback 是声明侧自己的内容，注入零争议）；
  - **无包裹层**：template 消失，内容 / fallback 的元素根**直接上位**（出口位置即内容根的 DOM 位置）；
- **空** = **可选出口**：未填充 → **整个出口不渲染**（无包裹层、无占位）；填充时与非空形态无差异；
- **可选与注入正交**：空载体带注入属性（`<template class="x" x-slot:header></template>`）合法，四组合全成立；
- **`data-slot` 锚点**：投影内容 / fallback 的**首个元素根**承接（多根时后续不带；未填充的可选出口无锚）——保持运行期 DOM 注入通道（如 x-foldable 折叠中继）的寻址能力；
- **动态名组合**：裸 `x-slot="表达式"`（值非空，ADR-0107）写在 template 载体上同享注入——注入点在名解析之后，与静态名零特判。

### 二、出口注入（Outlet Injection）

声明侧 template 出口标记上的属性，注入到投影内容的根元素——与 ADR-0108 传递绑定**方向相反、互补并存**（注入 = 出口 → 内容根；绑定 = 内容侧 → 出口元素）。

- **注入集**：template 上除 **`x-slot` 标记家族**（`x-slot` / `x-slot:名` / `x-slot.*`，含 bind 载体）与**宿主配置家族**（`x-options` / `x-slot-options`——注入会污染内容根上其他指令的配置回退）外的**全部属性**；
- **活注入**：注入发生在内容编译**之前**（出口消费期对克隆节点 `setAttribute`）——`:class` / `@click` / `x-show` 等指令属性注入后在内容根**作为活指令生效**（调用方作用域求值）：声明侧可向使用方内容根植入样式、行为与响应式绑定；
- **注入目标**：
  - 内容为 template 载体（可多根）→ **每个元素根**都注入（对称、无首根特判）；
  - 内容为元素载体（`<span x-slot:header>`）→ 注入**载体元素自身**（span 保留为包裹层、被注入）；
  - 纯文本 / 插值根 → 无元素根可注入 → **warn + 丢弃属性**（绝不静默造包裹层，守「最小 DOM」一贯取舍）；
  - 默认段（裸子节点多根）→ 每个元素根；
- **冲突规则**：**调用方赢**（与传递绑定跨机制方向一致）；`class` / `style` 走 token 级合并（内容根已有 token 保留 + 声明侧追加，复用 `SpreadBinder` 既有 diff 语义）；其余同名属性内容根胜、声明侧不覆盖；
- **live 段豁免**（ADR-0062）：`mode:"live"` 活体段**跳过注入 + warn 一次**——活体元素生死归构造方（如 OverlayInstance），注入属性无人清理、实例复用有污染风险（notifications / dialog shell 三出口是高发场景）；
- **元素出口不注入**：元素自身属性是自身样式，与「注入意图」不可区分——注入是 **template 载体专属**能力（template 不进 DOM，其属性唯一去处就是注入，天然无歧义；这是必须引入第二载体的设计必然，而非语法糖）。

### 三、继承交互（ADR-0081）

- **空/非空判定以继承替换后的最终快照为准**：子覆盖段可把父的 fallback 出口翻转为可选（覆盖段为空），亦可反向——否则可选性被父声明锁死，继承失去差异化意义；
- **覆盖段 template 自身的属性集随段整段替换**父声明的注入属性集（不合并；要保留父属性须在覆盖段上重写）——与「覆盖段替换 fallback 子树、覆盖段就是新声明」同一逻辑。

### 四、兼容与适用面

- **元素出口三不变**：包裹层保留、fallback 语义保留、自身属性不注入；
- **传递绑定零改动**：方向相反的两机制并存，写法互不侵占（注入走 template 静态属性，绑定走 `x-slot.bind` 值表达式）；
- **覆盖物家族天然适用**：出口清单推断与 `SlotDirective` 是组件级通用机制，x-dialog / overlay shell 等组件模板内可自由使用 template 出口（live 段豁免已单独裁决）；
- **不受影响面**：`$slots` 注册表（段存在即注册）、插槽转发（ADR-0125，miss 走链语义不变）、x-super（可选出口无 fallback → 静默展开为空，既有语义）、作用域形参（双向数据面不变）。

## 实现要点（防再踩）

1. **挂载路径修复是最大实现点**：`SlotDirective` 投影（`compileSlotNodes` 挂 `this.el`）与 fallback（`compileChildNodes` 挂 `this.el`）在 template 载体下 `this.el` 是 `display:none` 的 template——须改为**原位替换**语义（内容挂到 template 的父节点、template 自身移出运行树），或编译期将 template 载体替换为锚点占位再填充；
2. **注入属性抄录时机**：编译器在编译期剥除指令属性、`SlotDirective.ownsChildren` 接管子树——注入集须在 `created` 期从 `this.template`（原 template 元素）**抄录原文**（含 `:*` / `@*` 指令属性），并从 template 上剥除除 `x-slot` 标记外的全部属性（防指令在 template 元素上二次实例化空转）；
3. **注入执行时机**：拿到 `content.nodes` 克隆后、`compileSlotNodes` 编译前 `setAttribute`——活注入的实现基础；live 段在既有直挂分支前拦截；
4. **出口清单推断可复用**：`collectOutletSlots` 已识别 template 载体并递归 `.content`，本 ADR 无需改动；
5. **空/非空判定**复用 `isWhitespaceOnlyCarrier`（`utils/slot.ts`）；
6. **测试纪律**：template light children 在 happy-dom（结构可查）与真浏览器（`display:none` 不渲染）语义存在分歧——本 ADR 修的半残正是这一盲区的产物，template 出口用例**必须真浏览器 e2e**（Bun.serve + Playwright 惯例）。

## 被否决 / 演变的方案

- **纯可选语义**（template 出口一律未填充不渲染，提案 A）：fallback 表达力在 template 载体上的延伸被丢弃，template 内写了内容却永不渲染（warn 浪费）——被空/非空混合语义取代；
- **纯 fallback 语义 + 可选另立机制**（提案 B，如 `x-slot.optional` 修饰符）：空/非空是天然可判的免语法判据，另立修饰符多一条语法分支——KISS 裁决砍掉；
- **仅静态属性注入**（指令属性出局，第一轮原推荐）：template 载体属性本无去处，排除指令属性反而多一条特判；「声明侧统一授形」含行为植入语义自洽——被全属性活注入取代；
- **编译后死属性注入**：属性以字符串残留不生效，能力自断——从未认真候选；
- **纯文本根包 span 承接属性**：静默造包裹层违反最小 DOM——warn + 丢弃；
- **继承覆盖属性集与父合并**（父属性保留 + 子追加）：与「覆盖段整段替换 fallback 子树」割裂——同一动作两套合并规则，拒。

## Future Work

- live 段注入授权面（构造方显式允许时出口注入可达活体根）——需求出现再开；
- 注入属性条件化（按状态动态开关某属性）——YAGNI，现可用 `:class` 活注入 + 调用方状态等价表达。
