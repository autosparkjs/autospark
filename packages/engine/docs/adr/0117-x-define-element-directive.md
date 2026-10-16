# ADR-0117：`x-define-options.directive`——组件声明即元素名指令

- 状态：已接受（2026-10-16）
- 关联：承接 [ADR-0084](0084-x-super-slot-fallback.md)（元素名形态指令通道，本决策把该通道从预设指令专属开放给组件声明）；复用 [ADR-0022](0022-x-component.md)（x-component 实例化全量机制）、[ADR-0054](0054-component-define-instantiation-rename.md)（props 值通道）、[ADR-0110](0110-x-component-value-semantics.md)（值语义三分与 props 双源合并）、[ADR-0007](0007-directive-options-and-modifiers.md)（x-define-options 手工解析通道）；继承联动 [ADR-0081](0081-component-define-inherit.md)；注册收口 [ADR-0085](0085-component-registered-event.md)（五条注册路径统一走 `registerComponentDef`）

## 背景

组件的常规消费形态是 `x-component:名称` 属性指令。元素名形态（`<x-counter>` 直接写标签即实例化）此前只有预设指令可用（首例 x-super，ADR-0084）——类静态 `elementName` 由框架代码声明，业务组件无法进入该通道。业务侧想要「以元素标签使用组件」的语义（设计系统组件、富文本内嵌组件等场景），只能退回属性写法。

本决策开放该通道：`x-define-options.directive` 声明后，组件自动注册为**元素名形态指令**——`<x-counter>` 与 `<div x-component:counter>` 完全等价（宿主化身组件根、插槽/props/事件全量同构）：

```html
<div x-define="counter" x-define-options="{directive: true}">
    <button @click="inc()" x-text="count"></button>
    <script setup>{ data: { count: 0 }, methods: { inc() { this.data.count++ } } }</script>
</div>

<!-- 直接写元素标签即实例化 -->
<x-counter count="100" :step="step" @bump="..."></x-counter>
```

## 决策

### 决策 1：`directive` 键双形态——布尔自动推导 / 含连字符自定义标签

`x-define-options="{directive: ...}"`：

- `true` → 标签自动推导为 `x-{组件名}`（小写化——HTML 元素名被 DOM 全量小写化，注册表以小写为基准，`findByElementName` 的查找归一与之对齐）；
- 非空且含连字符的字符串 → 自定义元素名（小写化；连字符为自定义元素惯例，防与原生/语义标签撞车）；
- `false` / 未声明 → 不注册（缺省关闭——显式声明才启用，与 `open` / `global` 键同纪律）；
- 其余值（数字 / 空串 / 无连字符字符串 / 对象等）→ warn + 忽略（不注册）。

### 决策 2：两段协作机制——编译期剥除 + created 折叠（实证驱动）

**关键实证**：元素名指令实例在 scope 构造期创建（`getDirectives` 从原模板解析 + `findByElementName` unshift），`created()` 在 `scope.compile()` 才执行——**created() 内 setAttribute 无法影响指令解析**（此时属性已不可再"变成"别的指令）。且 `transformElement` 的 transformer 返回节点不会重入 transformer 管线——编译期改写必须在 `compileElement` 内部完成。故采用两段协作：

- **编译期**（`compiler.compileElement`）：元素名命中自动组件类时，把宿主模板上的 `:expr` 形态 props 属性**临时剥除**（防被通用管线误实例化为 bind 指令）并以模板元素为 key 暂存（WeakMap）；`finally` 恢复原树（原模板不留痕、重编译幂等）；
- **运行期**（生成类 `created()`）：在 `super.created()` 前注入组件名（`this.attr`）与折叠产物（`this.value` props 字面量、`this.options` 选项属性解析），随后走 ComponentDirective 既有通道——props 响应式（值通道 watch）、`x-{名}-options` 选项、loader、边界覆盖、pending 重试等机制零复制。静态 props 属性折叠后从宿主移除（不留结果 DOM 残留）。

生成类继承 ComponentDirective 全量机制，仅两处特化：`static elementName = tag`（元素名触发）与 `created()` 前置注入。**生成类注册在 engine 的 directives 表**（key = 组件名），因此属性参数形态 `<div x-counter="...">` 天然同类实例化——此时 info 已带 attr/value，生成类让位（不注入不折叠），走属性参数既有语义。

### 决策 3：元素名形态的 props 折叠规则（专属，静态属性即 props）

- **保留属性**（不折叠，留给宿主化身/既有指令）：`class` / `style` / `id` / `data-*` / `x-*` 前缀、`@event`（事件本就是同元素 OnDirective 承接）、`:class` / `:style` / `:id` / `:data-*`（留走 bind 属性绑定语义——宿主化身的布局/标识属性不应被吃进 props）；
- `:name="expr"`：表达式条目（binding.watch 响应式），同名**覆盖**静态条目；
- 其余静态属性：类型推断——纯数字 → number、`true`/`false` → boolean、`{`/`[` 开头 → 宽松 JSON（失败回退原字符串）、否则原样字符串；
- 优先级：`:expr` > 静态属性 > `x-{组件名}-options.props`（兼容 `x-component-options` 别名）——由值通道覆盖 options 通道的既有合并序（`{...optionsProps, ...directiveProps}`）天然保证。

### 决策 4：`this.emit(event, detail)` 组件事件发射

methods / hooks 的 this（`getMethodThis` Proxy）新增 `emit` 框架键：向组件根元素派发 `CustomEvent(event, { detail, bubbles: true })`。宿主侧以同元素 `@event`（OnDirective）监听——元素名形态的事件与显式 `<div x-component:x @event>` 语义完全同构（事件留在模板 → OnDirective 实例化于宿主 scope）。`emit` 进 FRAMEWORK_KEYS 防整体覆盖（与 data/engine/super 同纪律）。

### 决策 5：安装撞名规则——幂等 / 跳过 / 覆盖三态

安装收口于 `registerComponentDef`（五条组件注册路径统一走此方法，凡注册必安装），撞名规则：

- **同注册名 + 同元素名**（本机制重复安装，嵌套声明随实例重复收集）：静默幂等跳过；
- **撞预设指令名 / 用户自定义指令名**：warn + 跳过（不覆盖既有注册，与 `DirectiveManager.install` 的预设保护同纪律）；
- **元素名被其他指令占用**：warn + 跳过；
- **同注册名 + 元素名变化**（组件重声明且 directive 声明不同）：warn + 覆盖（组件定义本身已按覆盖语义更新，指令注册随之对齐）。

### 决策 6：所有权豁免——自动组件类并入 component 豁免族

生成类 ownsChildren（占子树）语义与 x-component 一致，`_resolveOwnership` 的 throwers 过滤补自动组件类豁免（与 `component` / `teleport` 同族）——与 `x-for` 等结构指令同元素时不触发通用抛错，走 ComponentDirective.created 的友好 warn 路径。`_hasStructuralConflict` 补 `d === this` 自我守卫（生成类的 info.name 是组件名而非 "component"，迭代会命中自身导致误报）。

### 决策 7：继承透传——声明为准，不默认扩散

`x-define:inherit` 继承解析的 merged def 以**子声明为准**透传 `directiveTag`：子声明了元素名即注册（子要元素名形态需自行声明），父未声明不默认扩散父的注册。

## 已知边界（V1 明确不做）

- **全局懒预编译通道的首个元素名消费不触发懒解析**：`options.components` 字符串声明的组件，其元素名指令在**首次解析**（首个 `x-component:名` 消费或 `registerComponent` 即时注册）后才安装；纯 `<x-名>` 首消费若无任何属性指令触发解析，元素保持素标签（无 pending 重试——pending 机制仅属性参数形态有）。推荐做法：`registerComponent` 即时注册，或首个消费点用 `x-component:名` 暖注册。
- **不加 `.directive` 修饰符形态**（`x-define.directive="名"`）：V1 仅 `x-define-options` 键形态，待真实需求再对齐修饰符约定。

## 被否决的方案

- **created() 内 setAttribute 注入**：实证无效——指令实例在 scope 构造期创建，created 时属性解析已完成，注入的属性不会再被解析为指令/props。
- **编译期永久改写模板**：`transformElement` 的 transformer 返回节点不重入管线，改写必须发生在 compileElement 内部；且永久改写会污染原模板（重编译/keepalive 复用场景不幂等）——剥除 + finally 恢复保证原树无痕。
- **基于 URL 查询参数 / 属性标记的 raw 化方案**：与业务属性冲突，弃。
- **元素名形态绕过 x-component、独立实现实例化管线**：props/loader/插槽/边界/pending 全量机制零复制是硬要求——生成类继承 ComponentDirective 只特化 created 前置注入，机制面单点。

## 后果

- ✅ 业务组件可声明为元素名形态，模板语义（设计系统标签化使用）达成；与属性形态全量同构，无双轨心智。
- ✅ 五条组件注册路径统一收口安装，无新表新通道；props/事件/选项全部复用既有机制。
- ✅ 元素名形态的 props 声明（静态即 props + `:expr` 响应式 + `@event` 事件）与属性形态体验对齐。
- ⚠️ 编译器新增剥除/恢复包裹（compileElement 两段化）；`getMethodThis` Proxy 新增 emit 框架键。
- ⚠️ 懒预编译通道的首消费时序边界（见「已知边界」）需文档明确。

## 实现注记（非架构决策，落地时遵循）

- `features/component/auto-component.ts`（新增）：`isAutoComponentClass`（静态标记判定）、`isReservedElementAttr`、`inferStaticPropValue`、`foldElementProps`、`readElementComponentOptions`（`x-{名}-options` 打底 + `x-component-options` 别名合并，孤儿属性原始读取——getDirectives 对无主指令的 -options 静默丢弃，须由生成类自行解析）、`createAutoComponentClass`（工厂；让位三态：info.attr/value 在场或同元素显式 `x-component` 声明时不注入不折叠）、`installAutoComponentDirective`（撞名规则）。
- `collect.ts`：`extractDirectiveOption`（决策 1 值域校验）→ `buildComponentDef` 返回 `directiveTag`。
- `inherit.ts`：merged def 补 `directiveTag: childDef.directiveTag`。
- `engine.ts`：`registerComponentDef` 末尾 `if (def.directiveTag) installAutoComponentDirective(...)`。
- `compiler.ts`：`_autoComponentProps` WeakMap + `_stripAutoComponentExprProps`（保留属性跳过；返回恢复闭包）+ `consumeAutoComponentProps`（读后即删）+ `compileElement` 两段化（剥除 → `_compileElementInner` → finally 恢复）+ `_resolveOwnership` throwers 豁免。
- `scope.ts`：FRAMEWORK_KEYS 加 `emit`；get 陷阱 case `emit`。
- `x-component.ts`：`_hasStructuralConflict` 补 `d === this` 自我守卫。
- 测试：`x-define-directive.test.ts`——自动标签/自定义标签/静态+表达式 props（类型推断、保留属性、同名覆盖、props 响应式）/@event+emit/options 通道优先级/缺省关闭/非法值 warn/撞名规则四态/registerComponent 路径/继承透传。
- 文档：x-define.md / options.md / instantiate.md / communication.md 补条目；guide/component/directive.md 新增「元素名组件」章节；demo `docs/demos/component/define-directive.html`。
