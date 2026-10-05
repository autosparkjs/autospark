# ADR-0082：super 引用（继承链父方法通道）

- 状态：已采纳
- 日期：2026-10-04
- 关联：[ADR-0081](0081-component-define-inherit.md)（组件继承——本 ADR 修订其「不引入 super」决策）、[ADR-0022](0022-x-component.md)（methods 组件边界查找）、[ADR-0057](0057-component-single-reactive-data.md)（setup 数据模型与 this 上下文）、[ADR-0080](0080-component-instance-getcomponent-rename.md)（ComponentInstance 门面对称承诺）

## 背景

ADR-0081 拍板 setup 扁平合并、**不引入 super/$parent**——当时的场景（`this.data.count` 直访父键）不需要它。随后出现真实缺口：**子组件覆盖父同名方法后，需要保留并调用父方法的行为**（如子把 `inc` 步长翻倍、前后加钩子，核心逻辑复用父实现）。扁平合并下子覆盖即**彻底遮蔽**——父函数引用在 `{...p, ...c}` 展开中丢失，无通道找回。

grilling 八问拍板引入**受限 super**：只解决「方法被覆盖」这一个问题。

## 决策

### 一、书写形态与可用面

- `this.super.<方法名>(...)`——**仅继承组件**（`x-define:inherit`）可用；class super 心智零学习成本，且 JS 保留字天然防用户误占键名；
- 非继承组件 `this.super === undefined`（不建视图零成本，误用 `this.super.x` 自然 TypeError 指向病灶）；
- 继承组件但父无 methods：super 为**空冻结对象**（成员访问 undefined）；
- this 绑定 = **当前组件实例**（父子方法读写同一合并 data 域）；super 视图**仅 methods**——data/locals 已扁平合并可见无遮蔽、hooks 串行全跑，均不需要 super 通道。

### 二、精确词法链（class 语义，本决策核心）

`base ← card ← order-card` 三层同名覆盖、各层都写 `this.super.inc()` 时：

- `this.super` 解析为「**当前执行方法声明层的下一层**」的方法集——card 的 `inc` 经 super 被调用时，其内 `this.super` 正确指向 **base**，不串层、无无限递归；
- 实现：解析期在 def 上累积**方法层表**（`methodLayers`：自身声明层 → 链根，随 ADR-0081 解析管道逐层拼接；全局父 = 单层）；注入期把合并后每个方法包一层「调用前置当前声明层、finally 还原」的包装器——**所有入口**（method this 代理互调 / `@click` / super 调用 / 门面）统一经包装器，super 视图按「当前层 + 1」取层表构建。

### 三、保留键与写防护

- `super` 加入 setup 顶层私有变量**内置保留键**（重名 warn + 忽略，对齐 props/globalState/…/$parent 纪律）；
- method/hook 内 `this.super = xxx` 整体覆盖 → set 陷阱 warn + 忽略（入 FRAMEWORK_KEYS）。

### 四、门面对称与自动生效面

- `engine.getComponent(el).super` → 同一 super 视图（ADR-0080「实例就是组件外的 this」字段对称承诺延续）；门面调用时不在任何方法执行栈内，按**实例自身层**（第 0 层）解析；
- overlay 家族（`instantiateDetachedComponent` 共享 `injectComponentSemantics`）、远程子组件（同一 resolver）、全局父（单层 def）——**零额外接线自动生效**。

## 实现要点（防再踩）

1. **层表在 resolver 累积**：`resolvedDef.methodLayers = [子声明层, ...parentDef.methodLayers]`；独立 def 单层（无 methods 可不带层表）。层表持有的是**各层自己声明的原始 methods 对象**（非合并结果）；
2. **包装器统一入口是词法正确性的唯一保证**：不要只在 super 视图里包——普通调用（`@click` / `this.inc()` / 引擎直调 `scope.methods[k]`）也必须置层，否则父方法体内 super 会错解析为实例层的父；
3. **还原用 try/finally**：super 调用链异常时当前层指针必须回栈（作用域级可变状态 `_superDepth`）；
4. **fn 归属即层归属**：层表按声明层存原始对象，方法包装时闭包捕获自己的层号——同名方法经合并取「最近声明层」的函数引用，其层号即它的词法层；
5. super 视图按 (scope) 缓存冻结对象，成员为绑定 this 的包装函数；`super.super` 套娃不存在（成员是函数非视图）。

## 被否决 / 演变的方案

- **ADR-0081「不引入 super」**：本 ADR 修订——覆盖后保留父行为的需求成立；维持「$parent 语义不变」（那是运行时嵌套父实例通道，与本机制正交）；
- **`this.$super` 前缀形态**：对齐 $ 系惯例但与 class 心智断裂一层，`$parent`（组合）与 `super`（继承）词汇已天然分流；
- **实例级单层 super**（恒指直接父 methods，不跟踪执行层）：三层链中 card 方法内 `this.super` 会解析回 card 自己 → 无限递归，只能靠文档约束——被精确词法链取代；
- **万能父视图**（super 上暴露父 data/locals）：data/locals 扁平合并后无遮蔽问题，super 只做方法通道（KISS）；
- **非继承组件空 Proxy + 首次访问 warn**：误用是编程错误，TypeError 堆栈比 warn 更指向病灶。
