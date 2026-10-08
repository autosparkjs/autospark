# ADR-0062：覆盖物面板外壳（shell）——面板形态组件化，与遮罩正交

- **状态**：Accepted
- **日期**：2026-09-28
- **关联**：[ADR-0052](0052-x-overlay-and-x-dialog.md)（覆盖物组件化统一——shell 是「形态可定制」的延续）、[ADR-0056](0056-x-slot.md)（插槽投影——live 段扩展）、[ADR-0007](0007-directive-options-and-modifiers.md)（配置体系）、[ADR-0060](0060-x-popover.md)（悬浮形态同机制）、[CONTEXT.md](../../CONTEXT.md)（「面板外壳（Shell）」词条）
- **共识来源**：grilling 三轮决策（Q1–Q15）+ 实施中两次修订（mask 保留在引擎侧、shell 不含遮罩——用户明确「mask 应保留，其用于控制是否显示 mask」「shell 不包括 mask」），本文即共识落盘

## 背景

覆盖物面板的 DOM 结构与视觉（边框 / 圆角 / 背景 / 箭头 / 布局）硬编码在 `OverlayInstance._buildAndMount`（`div.autospark-dialog` + 引擎注入 CSS）——不可定制，与开发者自有 UI 环境冲突时只能覆盖 CSS 变量做有限调和。需求：把面板层形态抽为**可替换的全局组件**（shell），内置默认封装现有形态（开箱即用），开发者可用自家组件整体替换。

核心张力在**结构所有权**：引擎在面板层挂着一组行为契约（`data-overlay` 标记、`data-overlay-border`、placement 写回、箭头载体查询、animate 类、close action 委托、遮罩点击判定）——shell 化后契约与结构怎么分家。

## 决策

### 一、shell 与 mask 正交：外壳不含遮罩（用户修订的终局）

**遮罩是引擎结构**：`mask` 选项控制显隐（x-dialog 恒 `true`、x-popover 恒 `false`、命令式可配），遮罩 DOM（`.autospark-dialog-mask`，fixed 全屏 + flex 居中 + `closeOnMask` 点击判定）与样式由引擎创建注入（随 `getOverlayContainer` 懒建），**不进 shell 模板**。shell 只替换**面板层**。这保证了：换 shell 零影响模态行为；DOM 层级与组件化前一致（`遮罩 > 面板[data-overlay]` / 裸 `面板[data-overlay]`），既有测试与用户 CSS 选择器基本原样有效。

### 二、双层契约：行为挂实例根，面板契约挂 shell 根

- **实例根**（遮罩或裸面板）：animate 类（ADR-0039）、`action:close` 委托（ADR-0052 决策 7）、遮罩点击监听——引擎挂接，与 shell 无关；
- **面板 = shell 产物根**：`data-overlay="<名>"`、`data-overlay-border`（`border !== false` 时引擎打标）、`data-overlay-placement`（floating-ui 写回）——是定位目标与箭头载体宿主。

组件实例恒单根（全局组件字符串多根自动包装 / 局部 x-define 元素即根），实例根身份成立。

### 三、内容进入外壳：x-slot 通道扩展「活体段」（Q12-B）

内容组件仍由引擎独立实例化（props / 宿主插槽投影 / 数据基准路径不变），产物以 `mode: "live"` 的插槽段经 shell 的**默认出口**投影进入——`SlotContent` 增加 `mode: "template" | "live"`（缺省 template，收集管道产出恒 template；live 段仅引擎编程式构造）：

- live 段在 `SlotDirective.compile` **直挂出口**——不克隆、不重编译、不建内容 scope（活体组件自带 scope，DOM 移挂不破坏 watcher/监听）；
- 销毁权责归 `OverlayInstance` 统一回收（内容 scope + shell scope 双回收 + `$scopes[id]` 键删除 + scoped 样式对称释放）；
- shell 未声明默认出口（`def.slots` 为 undefined 或不含 `"default"`）→ **warn + 内容直挂面板根**（弹窗照常工作，失效可发现——Q2 哲学）。

备选「`data-overlay-content` 标记锚点 + 后置挂载」被否（更少的机制改动），用户拍板选 slot：渲染点用标准出口语法表达，**语义一致性优先**；代价是通用插槽机制引入第二内容形态（模板态克隆 / 活体直挂），以 mode 标记 + 销毁权责文档化控制。

### 四、注入契约：config 整包初始快照，props 热更新只热内容域

`config` 解析结果**整包**作为 props 注入 shell data 域（打开时一次——Q1/Q13：换外壳是换结构骨架，无运行中切换场景；与现状「config 是打开时静态快照」语义一致）。`props` 热更新通道保持现状（只热内容组件域）。shell 模板可直接消费任意配置键（`at.arrow`、自由键 `theme` 等——`x-if` / `x-text` / 属性绑定均可）。

### 五、配置链四层与内置私有表

- 求值链：`x-{name}-options.shell`（成员表达式，打开时求值一次）> 宿主 `x-options` > **引擎级默认** `options.overlay.{dialog|popover}.shell`（「全站换肤」单一配置点，Q5）> 内置默认（`dialog-shell` / `popover-shell`；`drawer-shell` 随 x-drawer 落地）；
- 查找协议与内容组件同源（scope 链 `x-define` → `options.components` 全局表；x-import 的远程 shell 天然可配）；**显式名未命中 → warn + 回退内置默认，不等待 x-import**（Q2——shell 是结构骨架，异步期错误形态比延迟打开更糟，回退 warn 提示注册时机）；
- 内置 shell 是**引擎私有组件**（模块级懒构建缓存，模板字符串经 `buildComponentDef` 产出）：不进用户 `options.components` 命名空间（Q7——同名互不干扰，「覆盖内置样式」用显式 `shell` 指定自家组件名表达，不做隐式同名覆盖魔法）；
- 命令式（OverlayHandle）：`shell` 选项同协议（锚点 scope 链 + 全局表）；**`mask` 选项保留**并新开放可配（缺省 `true` 维持模态现状）——遮罩显隐与 shell 面板形态正交选择（Q15 演进为用户修订「统称 shell」+「mask 应保留」的合取：正式接口两者并存、各管一摊）。

### 六、箭头分工：渲染归 shell、显隐与定位归引擎（Q10）

箭头视觉与面板圆角/边框强耦合（伪元素变色联动 `data-overlay-border`），归形态；「贴锚、指锚」归行为。内置 shell 模板**恒渲染** `.autospark-overlay-arrow` 载体（不用 `x-if`——引擎锚定结果编译期不可知，且避免微任务挂载与 floating-ui 同步查询的时序竞态）；引擎 `_show` 锚定判定：命中且 `at.arrow !== false` → 保留并交给 floating-ui（`:scope >` 直接子级查询不变）；退居中 / `arrow: false` → 引擎移除载体（防未定位残留孤立菱形）。自定义外壳放同类名元素即获定位，不放则静默无箭头、定位照常。

### 七、样式随组件文件走，类名与 CSS 变量契约保留（Q11）

内置 shell 的面板视觉样式（圆角 / 边框 / 背景 / 箭头双伪元素 / placement 方向偏移 / 裸面板 z-index）自 `DialogDirective`/`PopoverDirective` 的注入代码迁移至 `src/features/overlay/wrappers/`（template + styles 同文件内聚），经 `registerShellStyles()` 幂等注入（消费者类级 `initialize` 调用，FOUC 防御时机不变）。**不走组件 scoped CSS**（跨实例共享 + 类名契约语义）。`.autospark-dialog` / `.autospark-dialog-mask` / `.autospark-overlay-arrow` 类名与 `--autospark-overlay-z/-bg/-border/-radius` 变量原样保留——既有用户样式覆盖习惯不破坏；自定义外壳复用类名即继承默认视觉，完全自写则完全自由。

### 八、单一渲染路径（Q14）

引擎的面板 DOM 硬编码创建**删除**（`_modalMask` 保留、面板创建逻辑移除）——内置默认 shell 就是「一个普通的 shell」（默认值而非特殊分支），所有覆盖物实例（声明式 / 命令式 / 三消费者）走同一条「内容编译 → shell 编译（live 投影）→ 组装挂载」路径。无双路径行为漂移。

## 测试

`src/__tests__/x-overlay-shell.test.ts`：内置默认面板结构（类名契约 / data-overlay 挂 shell 根 / 出口投影 / 退居中无箭头）、模态遮罩层级（引擎遮罩 > shell 面板）、live 投影下内容响应式存活、自定义 shell（全局注册 / 局部 x-define / config 整包注入消费 / 成员属性表达式 / 引擎级默认 / 未命中 warn 回退 / 缺默认出口 warn 直挂）、箭头分工三态（锚定保留定位 / arrow:false 移除 / 无 at 移除）、双 scope 生命周期（打开 +2 关闭对称回收 / engine.destroy 摘除）、命令式（mask 缺省模态 / mask:false 裸面板 / shell 选项）。既有 `x-overlay.test.ts` / `x-popover.test.ts` 断言几乎原样通过（DOM 层级不变的结构红利），仅样式 id 断言随迁移更新。

## 废止

- 无废弃 API。`DialogDirective`/`PopoverDirective` 的类级样式注入函数（`autospark-dialog-styles` / `autospark-popover-styles` 两个 `<style>` id）迁并为 `autospark-shell-styles`——若用户脚本依赖旧 id 选择器（罕见）需改。
- `OverlayInstanceOptions.mask` 语义不变；引擎内部 `_buildAndMount` 的面板硬编码创建为私有实现，无外部消费面。
