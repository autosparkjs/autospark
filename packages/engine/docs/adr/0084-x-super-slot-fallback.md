# ADR-0084：x-super 插槽 fallback 展开标记

- **状态**：Accepted（grilling 五轮 Q1–Q14 共识 + 实施完成，11 组测试全绿，2026-10-04）
- **日期**：2026-10-04
- **关联**：[ADR-0056](0056-x-slot.md)（x-slot 插槽体系——本 ADR 为其内容侧增补「合成投影」面）、[ADR-0081](0081-component-define-inherit.md) / [ADR-0082](0082-component-inherit-super.md)（组件继承与 super 引用——概念同族与三层覆盖链）、[ADR-0083](0083-async-parent-deferred-inherit.md)（异步父解析——继承覆盖层的就绪语义）、[ADR-0004](0004-reactive-text-interpolation.md)（mustache 插值——插值载体否决的边界依据）、[CONTEXT.md](../../CONTEXT.md)（「super 标记 / x-super」词条）
- **共识来源**：grilling 五轮 Q1–Q14，前沿为空，用户全盘确认

## 背景

ADR-0056 的内容投影是二选一：有内容 → 整体覆盖 fallback（fallback 子树不进 DOM）；无内容 → 渲染 fallback。调用方想**叠加**原插槽内容（前/后置、包裹、交错）只能整段重写，或（ADR-0081）另立继承组件——但继承是组件级机制，实例级一次性增强（同一组件两处调用、一处要叠标题）用继承是杀鸡用牛刀。两者粒度正交，实例级合成需要独立机制。

## 决策

### 一、机制与命名（Q4、Q7、Q12）

- 插槽内容内的 `<x-super></x-super>` 标记元素 = **本段 fallback 展开点**：把该段所覆盖出口的最终生效 fallback（含继承覆盖层）展开进标记元素内部。
- **标记元素保留为包裹层**（不消失）——与出口标记对称（ADR-0056 Considered Options 首条同款理由：展开的 fallback 需要宿主）；布局影响用 `x-super { display: contents; }` 样式消除（文档建议）。
- 引擎**首个元素名形态指令**（注册键 `super`，元素名即触发、无属性形态）。
- 命名依据：与 `this.super`（ADR-0082）同概念族——**super = 被我覆盖的那一层**（方法面调父方法 / 内容面展开被覆盖的 fallback）；覆盖链「消费方内容 > 继承覆盖 > 父 fallback」使展开继承覆盖层时语义自洽。Django `{{ block.super }}` / Twig `parent()` 业界先例。
- **双标签强制**：HTML 解析器对未知元素不认自闭合（`<x-super/>` 斜杠被忽略、吞后续兄弟），文档与 demo 必须双标签写法。

### 二、语义边界（Q5、Q6、Q8、Q9、Q10）

| 边界 | 行为 |
| --- | --- |
| 引用范围 | 恒**自引用无名**：header 内容内的标记 = header 出口的 fallback，不跨段（跨段引用致未提供出口 fallback 双份渲染 + 破坏「内容去留归本段调用方」边界，YAGNI） |
| 多次出现 | 允许，**各自独立编译展开**（独立 watcher，响应式语义与单份一致） |
| fallback 作用域 | 恒**组件作用域**求值、**不接收作用域形参**（形参管内容求值、super 管 fallback 展开，正交并存） |
| 位置错（插槽内容之外） | **warn**（「x-super 仅在插槽内容内生效」）+ 保留空壳 |
| 出口无 fallback | **静默**展开为空 |
| overlay 路径 | 与组件路径同语法同行为（管道共用）；**live 段除外**（ADR-0062 已编译实例直挂不编译，标记不识别——文档声明） |
| 嵌套组件隔离 | 内容里嵌 x-component 时，其模板/内容内的 x-super 归内层出口解析（元素名指令经编译通道天然隔离） |
| 递归 | 无防护代码：super 只在内容侧识别、fallback 走正常编译，构造上无法递归（文档声明） |
| 未闭合误写 | 标记带子节点（`<x-super>xxx` 吞兄弟形态）→ warn + 丢弃子内容 |

### 三、实现接线（Q13）

1. **元素名指令注册表**：编译器新增「元素名 → 指令」识别通道（本 ADR 首用，未来元素名标记复用）；嵌套 x-component 宿主子树由组件 ownsChildren 接管，其内 x-super 天然归内层出口。
2. **super 句柄**：SlotDirective 编译内容时向内容 scope 注入**惰性句柄**；SuperDirective 命中即经句柄取「本段 fallback 的独立编译产物」挂入自身元素内（每次命中独立编译）。
3. **销毁归属**：嵌入 fallback 的 scopes 挂出口 binding 为 parent，outlet `destroy` 显式回收（与 `contentScopes` 同模式，`scope.destroyed` 幂等守卫复用；调用方先亡时二次 destroy 为 no-op）。
4. **engine.patch**：嵌入不新增动态区域，守卫不变（既有出口投影区域规则沿用）。

## Considered Options

- **插值载体 `{{ $header }}` / `{{ $default }}`（原始提案）**：否决——能力成立但载体类别错误：mustache 全库语义是「状态 → 文本」（ADR-0004，desugar 为 x-text/textContent，装不下 DOM）；`$` 前缀撞 AutoStore 保留键习惯（`$scopes`）；属性表面（`class="{{ $header }}"`）无意义；跨段引用双份渲染歧义。
- **标记消失（原位替换 fallback 节点）**：否决——展开的 fallback 失去宿主（ADR-0056 同款理由）、展开点不可 CSS 寻址、多一层 unwrap 特例。
- **段修饰符 `.append` / `.prepend`**：否决——只支持前/后置（需求形态为多点内插，Q1）。
- **出口侧修饰符（组件作者声明合成模式）**：否决——控制权在作者，与「内容去留归调用方」的既有权力分配相悖，且「某次想纯替换」无法表达。
- **不做（只靠 ADR-0081 继承）**：否决——组件级变体 vs 实例级一次性增强粒度正交（Q3），且实现共用「fallback 与内容双编译」管线增量，边际成本可控。
- **空 fallback warn**：否决——静默空（用户拍板，Q8）。
- **`x-fallback` / `x-parent` / `x-default` 命名**：否决——分别撞「异步兜底 x-fallback」词条、`$parent` Avoid 禁挪用、默认插槽名 `default`。

## Consequences

- 编译器新增元素名指令通道（首个；注册表与属性指令并列）。
- SlotDirective 内容编译管道增 super 句柄注入；新增 SuperDirective 指令类。
- `{{ $xxx }}` 插值语义保持纯文本（本 ADR 明确不为 DOM 投影开口子）。
- 与 ADR-0081/0082/0083 组成完整 super 家族：方法面（this.super）/ 内容面（x-super）/ 定义面（inherit）。

## 实现差异注记（实施期落定，2026-10-04）

1. **句柄三态判空用值比较而非自有键**：TS 可选字段（`superInlet?: X | null`）会被转译器物化为 `defineProperty undefined` 自有键——`hasOwnProperty` 无法区分「未设置」与「物化」，查找协议改为 `s.superInlet !== undefined` 定论（函数命中 / null 遮蔽 / undefined 上溯）。
2. **销毁归属比决策三更简**：fallback scopes 的 parent 挂出口 binding（组件作用域基准兼销毁级联），出口销毁**自动级联**；SuperDirective.destroy 显式销毁仅作**调用方先亡**（内容投影随 caller 销毁、出口仍活）场景的兜底——`scope.destroyed` 幂等守卫使双路径无冲突，无需登记回 SlotDirective。
3. **元素名识别双挂点**：`scope._createDirectives`（构造期 unshift 无属性指令信息）+ `compileElement` 快速路径判定（防无属性无插件元素被浅克隆跳过）；DirectiveManager 持惰性元素名反查索引（`findByElementName`，tagName 归一小写）。
4. **overlay 路径零额外代码**（Q9 预期兑现）：覆盖物出口与组件出口共用 SlotDirective 投影分支，句柄注入天然生效；live 段直挂不编译，标记不识别（文档声明）。

## 测试计划（11 组，Q14）

1. 命名段内单次展开；
2. 默认段裸文本内展开；
3. 多次出现独立编译、独立响应（状态变更各刷各）；
4. 句柄缺席 warn（fallback 内 / 普通模板误写，保留空壳）；
5. 嵌套组件隔离（内容里 x-component 的内层 x-super 归内层出口）；
6. 继承交互（x-define:inherit 覆盖 fallback 后，x-super 展开继承覆盖层）；
7. overlay 路径生效（x-dialog 内容内）；
8. 空 fallback 静默展开为空；
9. 作用域形参并存（fallback 恒无形参）；
10. 未闭合误写防御（标记带子节点 warn + 丢弃）；
11. 销毁归属与幂等（outlet destroy 回收嵌入 fallback scopes；调用方先亡 no-op）。

## 文档同步

- CONTEXT.md「super 标记 / x-super」词条（已落，含与 this.super 正交注记 + Avoid 列表）；
- `docs/zh/guide/component/` 插槽文档补节（双标签警示、`display: contents` 建议、live 段例外）；
- demo `x-super.html`（交错/包裹/多次展开 + 布局演示）。
