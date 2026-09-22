# ADR-0051：运行时选项覆盖（data-<指令名>-<选项名> 覆盖属性、统一分发器扩展与选项策略三分法）

- **状态**：Accepted（grill-with-docs，三轮十四问；本 ADR 定设计与 v1 边界，实现另起）
- **日期**：2026-09-22
- **关联**：[ADR-0001](0001-directive-kind-system.md)（指令通道）、[ADR-0002](0002-dynamic-patch.md)（patch 冲突防护）、[ADR-0003](0003-engine-event-bus.md)（事件总线，分发器的出处）、[ADR-0007](0007-directive-options-and-modifiers.md)（选项回退链——覆盖值写回 `options` 与其同构）、[ADR-0039](0039-animate-mechanism.md)（animate——覆盖机制的首个动因案例）、[ADR-0042](0042-x-for-paging.md)（`:data-paging`——既有运行时配置通道与命名避让）、[CONTEXT.md](../../CONTEXT.md)（「运行时选项覆盖 / 覆盖属性 / 选项策略」词条）

## 背景

ADR-0007 确立的指令选项体系（修饰符注入 + 指令选项 → 宿主选项回退）是**构造期静态**的：编译后 options 冻结在指令实例上，运行时改变行为的唯一通道是个别特化绑定（如 x-for 的 `:data-paging`）。需求：为所有指令提供通用的「渲染后改配置」能力——在宿主元素上写 `data-<指令名去 x--<选项名>`（如 `<div x-show="open" data-show-animate="fade"/>`），修改该属性即更新选项。

约束与既定事实：

- 不逐 scope 元素监听（资源），在根元素全局监听再分发——而 `RuntimeObserverDispatcher`（ADR-0003 决策 7）已是 engine 级**单** MutationObserver（attributeFilter 按注册表枚举、初始扫描、childList 跟进动态元素、slot 盲区致盲、属性三态路由），是现成分发骨架。
- `data-*` 属性不被编译剥除（只剥 `x-*`/`@*`/`:*`），且可被 `:` 绑定语法驱动——`:data-show-animate="expr"` 使**状态驱动的配置切换免费获得**。
- 拷问暴露的核心难题：指令选项按**消费时机**分三档，运行时更新的可行性与成本完全不同；「编译期 option」能否低成本生效需要单独裁决（这正是本 ADR 决策 7 三分法的由来）。

## 决策

### 1. 载体与命名：覆盖属性 `data-<指令名>-<选项名>`

术语定「**运行时选项覆盖**（Runtime Option Override）」，属性形态称「覆盖属性」。指令名取注册名去掉 `x-` 前缀（`data-show-animate` 的 `show`、`data-loading-delay` 的 `loading`）。

### 2. 统一分发器：扩展 RuntimeObserverDispatcher 为双注册表

同一个 observer、同一份 childList/attributes 监听，类内并行两张注册表：

- `x-*` 裸属性 → runtime 指令三态路由（现状不变）；
- `data-<name>-<option>` → 选项覆盖分发（新增）。

attributeFilter 为**全部已声明覆盖属性名的显式并集**（从各指令类的声明清单枚举，如 `data-show-animate`）。slot 盲区致盲、初始扫描、childList 动态元素（x-for 项）、engine 生命周期全部复用——每 engine 单 observer、DOM 插入单次扫描不变。scope 通道实例（Compile 指令）经 engine 级 `WeakMap<el, 实例[]>` 登记（scope 创建指令实例时，凡类声明了覆盖能力即注册）；Runtime 指令（x-loading）复用 dispatcher 既有 instances 表。

否决独立 OptionDispatcher + 双 observer：childList 双重扫描、slot 盲区 / 初始扫描 / 生命周期全要重做，而盲区致盲对选项分发**必须**同样生效——并入现有 observer 白得。

### 3. 声明契约：静态清单答「什么可更新」，实例钩子答「更新了做什么」

```ts
class ShowDirective extends AutoSparkDirectiveBase {
    static override readonly runtimeOptions = ["animate"];  // 可覆盖键（分发器据此枚举 filter）
    protected onOptionChanged(key: string, val: any): void { // 基类默认实现：
        // ① this.options[key] = val（undefined 时 delete）——写回单一数据源
        // ② 子类 override 追加缓存重 resolve（如 this._anim = resolveAnimate(...)）
    }
}
```

- 基类 `onOptionChanged(key, val)` 默认**把值写回 `this.options[key]`**（`undefined` 表示属性已删除，`delete` 还原）——`getOption()` 的 ADR-0007 回退链自动命中新值（「显式写值即命中」语义同构），**现读型指令零钩子生效**；`$options` 代理与 action 侧同链一致。
- 缓存型指令（如 `_anim`）override 钩子重 resolve 缓存——几行。
- 否决静态 handler 表 `{key: (inst, val) => ...}`：静态清单是分发器枚举 filter 之必需（回答 what），行为归实例（回答 how），分离更 DRY。

### 4. 分发三态：增/变 = 覆盖，删 = 还原，初始值生效

- 属性**新增 / 值变** → `onOptionChanged(key, 解析值)`；
- 属性**删除** → `onOptionChanged(key, undefined)` → 回退编译期值（`x-{name}-options` → `x-options` 原链重读）。三态对称，与 runtime 指令属性三态心智一致；
- **初始值生效**：编译时 DOM 上已存在的覆盖属性，由 dispatcher `start()` 初始扫描统一走同一条 apply 路径（时序在 created 之后，缓存重 resolve 同步补正，无观察窗口）。否决「仅后续变更生效」——「写了不生效、改了才生效」surprising，且初始扫描代码反正必须存在（动态元素同靠它进来）。

### 5. 值解析：relaxed-json 单值

复用 `relaxedToJson` + `JSON.parse`（先例：x-case 字面量解析；`NaN` 裸词需先行特判）：`"fade"` → 字符串、`"500"` → 数字、`"true"/"false"` → 布尔、`'{"enter":"fade","duration":200}'` → 对象（animate 分相配置可写）。解析失败 → warn + 忽略本次。与 `x-{name}-options` 的类型语义同族（DRY），否决纯字符串原样（数字/布尔/对象选项失配，指令各自 ad-hoc 转型）。

### 6. 生效时机：惰性为默认语义

机制只负责**把新值送达指令实例**，何时对 DOM/行为可见由指令语义决定：`animate` 下次 enter/leave、`icon` 下次渲染、`model.trim` 下次输入。需即时的指令在钩子内自行重放——`loading` 为首例（重 parse config + 刷新 overlay，仿其 `attrChanged` 既有闭环）。否决「机制统一即时重放」：重放含义逐指令不同，机制层无统一切入点，复杂度上移。

### 7. 选项策略三分法：编译期 option 的低成本生效路径

选项按消费时机分三档，处置各异：

| 档 | 特征 | 处置 | 成本 |
|---|---|---|---|
| 现读型 | 每次使用时 `getOption` 现读 | 进 `runtimeOptions`，零钩子 | 行级 |
| 快照-运行时型 | created 读一次缓存，运行时消费缓存 | 进 `runtimeOptions` + 钩子重 resolve | 几行/指令 |
| 真·编译期型 | 编译决策进了模板树/子树结构 | 进 `static compileOnlyOptions: Record<string, 'warn' \| 'restart'>` | 声明级 |

- **真·编译期型 v1 全 `'warn'`**：覆盖属性名照常进 attributeFilter，变更仅 **warn 指引**「X 为编译期选项，请用 `x-{name}-options`」——把「写了没反应」变成「写了有解释」，filter 枚举让 warn 也近乎零成本。`'restart'` 为 v2 预留档（决策 11）。
- 两清单皆**显式枚举**；**未声明键零观察静默**——`data-show-foo`、`data-index`、`data-paging` 等一切未声明 data-* 就是普通属性。命名冲突（含 x-for 已占用并经 `:data-paging` 绑定真实写 DOM 的 `data-paging`/`data-index`）由此自然消解，无需避让清单。
- 「所谓编译时 option」多数其实是快照-运行时型（读一次、用多次），改造即几行——三分法纠正了「编译期 = 不可运行时更新」的粗分。

### 8. v1 成员清单

**`runtimeOptions`（可覆盖）**：

| 指令 | 键 | 生效时机 | 钩子 |
|---|---|---|---|
| show / if / switch / for / tree | `animate` | 下次 enter/leave | 重 resolve `_anim` |
| loading | `message` `bgColor` `color` `opacity` `delay` `selector` `actions` | 即时刷新 overlay | 重 parse config |
| model | `get` `set` `default` `autoSelect` `trim` `number` `boolean` `group` | 下次对应消费点 | 零钩子 |
| field | `trim` `number` `boolean` | 下次写入事件 | 零钩子 |
| icon | `size` `padding` `badge` `button` `color` `pointer` `strokeWidth` | 下次渲染 | 零钩子 |
| form | `validateOnSubmit` | 下次 submit | 零钩子 |
| import | `global` | 下次 load | 零钩子 |
| html / data | `method` `header`（data 另有 `path`） | 下次取数 / arrive | 零钩子 |

**`compileOnlyOptions`（v1 全 warn）**：`if`/`switch` 的 `keepalive`（`static ownsChildren` 编译期静态读取，结构级）、`for` 的 `paging` `virtual` `loader` `autoLoad` `itemHeight` `overscan`（`pageSize` warn 时**指引既有 `:data-paging` 通道**）、`tree` 的 resolveConfig 字段族（`animate` 除外）、`data`/`form` 的 `mount` `global` `nearest`、`html` 的 `compile` `raw` `loading` `empty` `hide` `emptyValues`、`text` 的 `empty` `hide` `emptyValues`、`model` 的 `change` `multiple` `choices` `emptyValues`、`field` 的 `name`。

**暂缓 v2**：`on` 的 `debounce` `feedback`（重建 handler 链）、`text` empty 族升 runtime、`bind` 的 `invert`、`tree` 其余 config 字段。

### 9. 单例限制：v1 覆盖属性仅支持单例指令

`on`/`bind` 为 `singleton=false`（同元素可多实例），`data-on-debounce` 无法定位是哪个 `@event` 的配置、`data-bind-invert` 会打到全部绑定实例——寻址歧义，**整体排除**。规则干脆：「v1 仅单例指令」。多实例寻址的扩展语法（如 `data-on-<event>-<option>`）留待真实需求单独立项。否决「bind 半收（transition）on 排除」的不对称规则。

### 10. 事件与生命周期

apply 成功广播 `directive/<name>/option-changed`（对齐既有 `attr-changed` 惯例，调试/测试钩子）；不新增 stop/start 特殊处理，随 dispatcher 既有生命周期。

### 11. v2 规划：重启通道（'restart' 档的落地形状）

对真·编译期选项中**翻开关用例真实**者，升 `'restart'` 档触发**实例级重启**：

```
覆盖属性变更 → options 写回 → scope 重启该指令：
destroy 旧实例（unwatch inst.watchers + destroy(el)）
→ 工厂从同一 info 重建实例（options 已是新值，created() 自动读到）
→ 重放 created/mounted
```

可行性依据（实现前已验证）：结构指令**自持源码**——`IfDirective` 持 `this.template` 冻结快照（每次 toggle 重新 clone 编译）、`ForDirective` 持 `itemTemplates`，二者 destroy 均已相对完整（if.ts `host.destroy()`、for.ts `override destroy`）；实例从 info 重建**不需要 DOM 源码**（编译剥除属性的死穴被绕开）。用户可见代价（子树运行态丢失：焦点/滚动/输入中间态；x-for N 项重建）是「翻结构开关」的**语义固有代价**，非机制缺陷。首批候选：`for` 的 `paging`/`virtual`、`if`/`switch` 的 `keepalive`。

### 12. 通用局部重编译（re-scope）否决

「引擎对任意元素重新编译」不可行于低成本：编译期**剥除指令属性**，运行时 DOM 无源码——通用重编译需先建「源码快照」基础设施（全量 = 内存膨胀；按需 = 不可预知用户将翻哪个开关），再加携带父 scope 链上下文的子树编译入口，独立量级工程。真需「换结构」走既有通道：x-use / x-component 重挂。与决策 11 的区别：重启是**实例级**、依赖指令自持模板，不需要任何源码快照。

## 被否决的方案

- **每 scope 元素自建属性监听**：资源目标否定（需求原点）。
- **独立 OptionDispatcher + 第二个 observer**：childList 双扫描、slot 盲区/初始扫描/生命周期全重做（见决策 2）。
- **静态 handler 表** `{key: (inst, val) => ...}`：what 与 how 分离（决策 3）。
- **仅后续变更生效**（忽略初始值）：surprising 语义，初始扫描代码反正要写（决策 4）。
- **删属性保持最后覆盖值**：覆盖载体语义不可预测，三态对称被破坏（决策 4）。
- **纯字符串原样解析**：数字/布尔/对象选项全失配（决策 5）。
- **机制统一即时重放**：无统一切入点，复杂度上移（决策 6）。
- **bind 半收（transition）、on 排除**：规则不对称（决策 9）。
- **通用 re-scope**：源码快照 + 子编译入口，最高成本路线（决策 12）。
- **命名「热更新 / 动态配置」**：工程黑话、未表达「覆盖回退链、删除即还原」语义（CONTEXT 词条 Avoid）。

## 后果

- ✅ 全部单例指令获得声明式运行时配置更新；`:data-<name>-<option>` 绑定使**状态驱动配置切换**免费获得。
- ✅ v1 全部行级成本：现读型零钩子、快照型几行钩子、编译期选项 warn 可解释；每 engine 仍单 observer。
- ✅ 覆盖值写回 `this.options` 使 `getOption` / `$options` 代理 / action 侧自动一致——ADR-0007 单一数据源保持。
- ⚠️ `data-<指令名>-<选项名>` 成为**公共 API 契约**（属性命名空间入用户文档）；`this.options` 从「解析产物」正式转为可变运行时状态。
- ⚠️ 惰性生效需文档明确（如 icon 改 `data-icon-size` 后下次渲染才可见）。
- ⚠️ v1 不覆盖：singleton=false 指令（寻址）、真编译期选项的生效（仅 warn）；restart 通道与多实例扩展语法留 v2。
- 交付（实现期）：dispatcher 双注册表扩展、基类 `onOptionChanged` 与 `runtimeOptions`/`compileOnlyOptions` 静态字段、决策 8 清单逐指令落地、测试、docs 页 + demos、CONTEXT.md 词条（本次已随 ADR 建立）。
