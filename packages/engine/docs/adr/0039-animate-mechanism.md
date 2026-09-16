# ADR-0039：结构指令进出场动画（animate 选项、Vue 六类名与内置 fade/slide/expand）

- **状态**：Accepted（grill-with-docs，三轮十九问；决策 13 实现期增补 2026-09-16）
- **日期**：2026-09-14
- **关联**：[ADR-0007](0007-directive-options-and-modifiers.md)（animate 选项的读取回退链）、[ADR-0015](0015-x-style-transition-modifier.md)（`:style` 的 `.transition`——同名正交概念，键名规避的由来）、[ADR-0016](0016-x-if-detach-and-x-show-independence.md)（x-if detach / x-show 独立）、[ADR-0034](0034-x-if-else-branch-chain.md) / [0037](0037-x-switch-branch-selection.md)（BranchHost 共享挂点）、[CONTEXT.md](../../CONTEXT.md)（「进出场动画 / animate」「六类名」「分相配置」「内置动画」词条）

## 背景

结构指令（x-if / x-show / x-for / x-switch）的挂载/卸载都是同步 DOM 变更（`el.remove()` / `display:none`），显隐切换生硬。需求：参考 Vue 的 transition 机制，为四指令提供声明式进出场动画，并内置 fade / slide 两个开箱即用的动画——`x-if-options="{animate:'fade'}"` 即自动应用进出场。

拷问暴露的核心难题：**离场动画必须延迟移除**。所有卸载都是同步 `el.remove()`，MutationObserver 事后补偿不可行（元素已移除），必须在卸载点之前拦截。幸运的是四指令的 DOM 变更点高度集中（`BranchHost` 挂卸分支、`IfDirective` 挂卸 then、`ShowDirective.toggle`、`ForDirective` 项创建/销毁与 special 挂卸，共六处收口），拦截可以集中落地。

## 决策

### 1. 载体：指令选项 `animate`，非独立指令

`animate` 是结构指令的指令选项，经 ADR-0007 既有回退链读取（`x-{name}-options` → 宿主 `x-options`，缺失才回退、不合并），四指令各自读取，动画机制本身做成共享服务（决策 5）。键名定 `animate` 而非 `transition`——`transition` 已被 `:style` 的 `.transition` 修饰符（ADR-0015，CSS 属性过渡）占用，一词两义必生混淆。

`transition.ts` 中未注册的 `TransitionDirective` 空壳删除：它预设了 `x-transition="fade"` 的独立指令形态，而该形态已被否决。

### 2. 类名契约：Vue 六类名

生命周期 class 采用 Vue 同构的六类名：`{name}-enter-from / -enter-active / -enter-to` 与 leave 三类。进场 = 挂 from+active → 下一帧摘 from 挂 to → 结束全摘；出场镜像。自定义动画 = 用户按此约定写 CSS，**transition 型与 keyframe 型皆可**，传名即用、零注册 API。

### 3. 配置形态：字符串 / 对象 / 分相覆盖

`animate` 取值三形态（relaxed-json 下均合法）：

- 字符串：`animate:'fade'`——进出同名；
- 对象：`animate:{name:'fade', duration:300, delay:0, easing:'ease'}`——经 inline style 同时覆盖 `transition-*` 与 `animation-*`（自定义动画两种基底都存在）；
- 分相覆盖：`animate:{enter:'slide', leave:'fade'}`，`enter` / `leave` 各自接受字符串 | 对象 | `false`（单相禁用）。

分相键定 `enter` / `leave`，与六类名词汇一套贯通（`enter` ↔ `enter-from`）。

### 4. 实现基底：CSS class 生命周期

动画经 class 挂摘驱动，结束检测 = `animationend` / `transitionend`（须过滤 `e.target === el`，冒泡）+ computed `transition/animation` duration+delay 取最大值 + 小 buffer 超时兜底。同元素动画互斥经 WeakMap 跟踪（决策 7 的实现面）。离场动画期间不额外禁用 pointer-events。

### 5. 挂点收口与内部 Animator 服务

共享动画服务挂 engine 实例（`engine.animate.enter(el, config)` / `leave(el, config, onDone)`），**不对消费者文档化**（非公共 API 承诺），但接口按公共质量设计——后续 x-teleport / x-loading / x-tree 等接入只需加挂点。挂点六处：

| 挂点 | 覆盖 |
|---|---|
| `BranchHost.mountBranch` / `unmountBranch` | x-if 分支链、x-switch 分支（eager / keepalive 同权） |
| `IfDirective.mountThen` / `unmountThen` | x-if 宿主（then 态） |
| `ShowDirective.toggle` | x-show display 切换（离场须延迟 `display:none`） |
| `ForDirective` 项创建 / `destroyItem`、`mountSpecial` / `destroySpecial` | 列表项与 `x-empty` 空状态 |

### 6. 首次渲染静默

引擎初次编译、元素首次挂载不播动画（x-for 首渲 N 项不整队 fade-in）——只有**状态变化**引起的挂载/卸载才动画。不做 `appear` 开关（等真实需求）。

### 7. 中断语义：抢占

动画进行中状态又翻转 → Vue 式抢占：取消在播动画（摘类）、立即按新状态处理 DOM、新动画从头播。「同元素动画互斥、后者抢占」是唯一能防御快速连点的模型。

### 8. 分支切换：新旧同场共演

x-switch A→B、x-if then→else：旧分支离场与新分支进场**同时**进行（Vue 语义）。两者短暂同处文档流、容器高度会跳动——文档标注注意事项，要平滑的用户自行对离场分支加 `position:absolute`。

### 9. eager 离场：scope 立即销毁、DOM inert 播完即移

eager 卸载照常立即销毁子树 scope / watcher，DOM 留在原地播完离场动画再移除——离场元素是 inert 的（内容冻结 300ms，不可感知）。中断时语义干净：取消动画、同步完成移除、重新挂载即全新编译。

### 10. x-for：仅项级 enter/leave

列表动画只做新项进场、消失项出场；**移动不做动画**（无 FLIP——与 key-based 4-pass diff 的 Pass 3 重排耦合深，独立量级工程，留作后续 ADR）。复合项（多成员节点）逐节点挂类（本就作为一组同时插入/移除）；`x-empty` 空状态经 special 挂点同权。

### 11. keepalive 同权、宿主统一、reduced-motion 交给 CSS

- `x-if.keepalive` / `x-switch.keepalive` 的 detach/reattach 播同样动画（对用户是同一次显隐变化，挂点已统一）；
- v1 动画配置宿主统一施于全部分支（含 then），**不做分支级覆盖**（挂点在 `mountBranch` 收口，届时是局部改动）；
- 无引擎级 `prefers-reduced-motion` 开关：用户 CSS `@media (prefers-reduced-motion: reduce){ .fade-enter-active{transition:none} }` 即降级——引擎按 computed duration=0s 立即完成清理，天然兼容（前提是决策 4 的超时兜底，本就必须有）。

### 12. 内置 fade / slide 与裸类名注入

- **fade**：opacity 0↔1，300ms；
- **slide**：translateY(-12px→0) + opacity，300ms，离场反向（纵向固定，横向走自定义动画）。

内置样式经 `static initialize` 注入带 id 的 `<style>`（防多 engine 实例重复注入，先例 loading.ts），**裸类名**（`.fade-enter-active`）无命名空间前缀——与 Vue 生态词汇一致，用户同名 CSS 可直接覆盖（这本来就是「用户可自定义」的接缝）；transition 型实现。

### 13. 高度型内置动画 expand（实现期增补，x-tree 驱动）

类名型动画 transition 的是 transform/opacity——**不参与布局**。展开/折叠类场景（x-tree 子容器、手风琴）的症状：进场元素插入即占满布局高度，后续节点**瞬跳**到位；离场延迟移除期间仍占位、播完移除时才**瞬跳**收回——跳动只是被换个时点，并未消除（决策 8 当年的「文档标注注意事项」对树场景不够用）。用户侧补足路径也全不适配：max-height 大高度差曲线失真（ADR-0040 已否决）、grid 0fr/1fr 要求宿主恰好一个子元素（树子容器天然多行）、keyframes 定高不可伸缩。

裁决：Animator 新增高度型分支——`expand` 为 **JS 测量自然高度（`offsetHeight`）+ `height`/`opacity` 同链 inline 过渡**（from/to 是动态测量值，静态 CSS 类无法表达，故不经六类名契约、无需类 CSS）。实现要点：

- enter：测量 → 起始帧 `height:0 / opacity:0` → reflow → 目标帧 `height:测量值 / opacity:1`；leave 镜像（锁定自然高度收到 0，onDone 延迟最终态）；
- 动画期 `overflow:hidden` + `box-sizing:border-box`（height 数值与 offsetHeight 渲染语义对齐，content-box 的 padding/border 不产生测量误差），finish 经既有 inline 备份机制全还原（`height:''` 回归内容自然高度，不锁死后续内容变化）；
- 结束检测/超时兜底/抢占互斥/cancel 同步完成 onDone 全部复用既有 `_registerEnd`/`_finish`（与类名型共一 `active` 表）；测量值为 0（空容器 / 无布局环境）返回 false，调用方同步处理（契约同 phase=null）；
- 默认时长 300ms 对齐内置类名动画 `.3s` 惯例；`duration`/`delay`/`easing` 配置照常生效；
- 受益方泛化：任何结构指令（x-if/x-show/x-switch/x-for）配 `animate:'expand'` 均得手风琴效果——x-tree 只是把它设为默认（ADR-0040 决策 9 修订）。

否决「改 slide 为 height 型」：全局改既有内置语义，波及所有已用 slide 的场景；「引擎包 wrapper 层做高度」：改 DOM 结构，用户 CSS 选择器（`li > ul`）断裂。

## 被否决的方案

- **`x-transition` 独立指令**：无法感知宿主指令的挂卸时机（引擎无指令间事件总线），x-if 反查同元素 transition 指令——耦合只换形式不减少。
- **WAAPI 程序化关键帧**：happy-dom 测试环境支持存疑；自定义动画只能 JS 对象描述、不能复用 CSS。
- **二类名 `{name}-in` / `{name}-out`（keyframes-only）**：自定义动画表达力受限，Vue 生态现成 transition 型 CSS 不可复用。
- **配置键 `in` / `out`**：与六类名（`enter-from`）词汇错位。
- **`transition` 选项键**：与 `:style` 的 `.transition` 撞义。
- **首渲动画 / `appear` 开关**：首屏动画风暴、列表场景灾难。
- **中断排队**：UI 与状态脱节。
- **分支串行切换**：切换耗时翻倍，非 Vue 心智。
- **eager 离场延迟销毁 scope**（Vue 语义）：多一条「延迟销毁 + 中断立即销毁」状态机分支；冻结 300ms 不可感知，不值。
- **FLIP 移动动画**：独立量级工程，v1 YAGNI。
- **分支级动画覆盖**：挂点已收口，等真实需求。
- **引擎级 reduced-motion 开关**：CSS 一行可降级，引擎零成本。
- **类名前缀 `autospark-*`**：与「参考 Vue」定位冲突，碰撞风险低且可覆盖。
- **Animator v1 公开 API**：公开即承诺、承诺即负债，先内部化。

## 后果

- ✅ 四指令获得声明式进出场动画，`animate:'fade'` 一行开箱即用；自定义动画纯 CSS（六类名约定）、零注册 API。
- ✅ 挂点六处收口 + 指令无关的 Animator 接口——后续 x-teleport / x-loading / x-tree 接入免费。
- ✅ expand 高度型动画补齐布局维度（决策 13）——树/手风琴场景后续节点平滑跟随，浏览器实测连续移动无跳变。
- ⚠️ 分支共演期间新旧分支同处文档流，容器高度跳动——文档标注（离场分支加 `position:absolute` 可解；单分支手风琴场景改用 `expand`）。
- ⚠️ eager 离场元素动画期间 inert（状态变更不再影响它）——接受，离场元素不应「复活」。
- ⚠️ x-for 项移动无动画；x-show 离场延迟 `display:none` 期间仍占 `:nth-child` 位（本就是 x-show 语义，无新增差异）。
- 交付：`src/animate.ts`（Animator + 内置 CSS 常量 + 注入）、四指令挂点改造、`transition.ts` 空壳删除、x-if / x-show / x-for / x-switch 测试增补（happy-dom 无真实 transition，断言类挂摘 + 定时器推进超时兜底路径）、`docs/zh/guide/` 动画页 + `docs/demos/` 示例、本 ADR + CONTEXT.md 词条。
