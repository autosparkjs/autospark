# ADR-0134：抽象基组件（x-define.abstract）与 autospark.base 内置

- 状态：已采纳
- 日期：2026-11-04
- 关联：[ADR-0081](0081-component-define-inherit.md)（组件继承）、[ADR-0082](0082-component-inherit-super.md)（super 引用）、[ADR-0083](0083-async-parent-deferred-inherit.md)（懒预编译展开继承 / 父未就绪挂起）、[ADR-0094](0094-builtin-component-registry-and-unified-lookup.md)（内置组件注册表与统一查找）、[ADR-0117](0117-x-define-element-directive.md)（元素名形态）、[ADR-0129](0129-theme-integration.md)（theme 集成与三级回退链）、[ADR-0133](0133-component-tag-normalization.md)（懒预编译反查）

## 背景

官方组件族（@autospark/plugins）需要统一的主题接入契约：所有组件应消费 `--auto-*` 派生令牌自动响应主题（ADR-0129），且组件实例可经 props 做局部主题档位覆盖（`size` / `shadow` / `radius` / `spacing` / `dark` / `colorized`）。@autospark/theme 的手动通道 CSS（根域裸 `[data-size]` / `[data-dark]` 等属性选择器直接覆盖 `--auto-*` 变量）**已经存在**——缺的只是把组件 props 物化为宿主化身根上 `data-*` 属性的统一行为，以及承载该行为的基类组件。

两个前置冲突决定了本 ADR 的形态：

1. **继承机制的方向冲突**：ADR-0081 的模板语义是「父出骨架、子填肉」——子继承父时**根元素用父的**，子自己的 `x-define` 宿主元素被丢弃、只并属性。基类组件恰恰要求反向（骨架由子定、父只贡献行为）——基类不存在对所有子组件都无害的「万能根」（button 需要 `<button>` 根、input 需要 `<input>` 根）。
2. **props 裸名占用冲突**：`size` / `dark` 等裸名是组件自有语义的高频词（图标像素尺寸、深色视觉变体），而 `mergeSetups` data 浅合并**子胜且无警告**——子组件声明同名键会静默覆盖基类默认值，主题通道静默失效。

## 决策

### 一、x-define.abstract（无模板基组件声明形态）

给组件定义体系新增**抽象组件**形态：声明元素带 `x-define.abstract` 修饰符（对齐既有 `.open` 声明侧修饰符通道，≡ `x-define-options="{abstract:true}"`），`ComponentDef` 增加 `base?: boolean` 字段。语义以 OOP 抽象基类为概念模型：

- **快照弃权**：abstract 声明不贡献模板骨架——被继承时**子模板根胜出**（子 def 自身快照即解析后快照），不深克隆父快照、不做出口替换、不做子根属性并入。声明上的元素子节点（`<script setup>` / `<style>` 资源节点之外）与 `x-slot` 出口无意义，warn；
- **不可直接实例化**：`x-component:` 指令形态 warn（「xx 是抽象组件，不可实例化」）+ 不渲染；元素名形态标签（ADR-0117）对 abstract 组件**不安装**；
- **setup / styles / defaults 照常继承**：data 浅合并子胜、methods 同名子整体覆盖、hooks 父先子后串行、styles 拼接子在后、defaults 子声明胜、`super` 方法层表照常（ADR-0082）——**合并语义零改动**，全部复用 ADR-0081 既有管线；
- **`slots` 出口清单 = 子自身出口**（父无快照无出口，不缩减不传播）；
- **V1 禁止 abstract 再声明 `x-define:inherit`**：abstract 的无模板语义与「继承父模板」矛盾，只可作继承链根（abstract ← abstract 链式合并 setup 语义自洽但 YAGNI，砍）；有模板组件继承 abstract 组件 = 主路径，与既有「有模板继承」并存（`abstract base ← card ← orderCard` 链式混合中，card 以下走既有语义）。

### 二、autospark.base 内置 engine

基类组件 `autospark.base` 作为**内置组件**住 engine 数据资产层（`src/components/base.html`，与既有内置组件同机制注册进全局表、懒预编译展开），**不放 @autospark/plugins 作为独立 IIFE 产物**：

- 组件插件产物回到「只依赖 engine」的原始形态——否则所有组件插件产物相互依赖 `autospark.base.js` 先行加载，引入跨产物时序契约（ADR-0083 挂起机制虽可兜底，契约面本身即是负担）；
- **engine 零依赖 theme**：base 的行为是纯 DOM 属性写入，不 import @autospark/theme 任何代码——theme 在场时 CSS 手动通道命中、不在场时属性静默无效（同 x-ripple「未加载静默跳过」惯例），不破坏「theme 包独立于 engine」；
- 代价：base 演进随 engine 版本发布（基类基础设施低频演进，可接受）。

### 三、主题档位 props 契约（data-\* 六键）

base 的 props 为**六个 data-* 形态键**，**名即通道**（props 键名 = 物化的 DOM 属性名，零映射表）：

| 键 | 值域 | 物化 |
|---|---|---|
| `data-size` / `data-shadow` / `data-radius` / `data-spacing` | ThemeSize（none/x-small/small/medium/large/x-large），**透传不校验**（theme 是唯一真值源，白名单校验会造第二真值源） | 有值即写属性 |
| `data-dark` / `data-colorized` | 布尔 | true 写存在性属性，false 移除 |

- **为什么 data-\* 形态而非裸名**：裸名空间（`size` / `dark`…）保留给子组件自有语义——防 `mergeSetups` 子胜静默覆盖（背景冲突 2）；且与终端用户对普通元素裸写 `<div data-size="small" data-dark>` 的手动通道心智合一，「控制主题档位就写 data-*」一个词汇贯穿组件内外；
- JS 侧访问须 `this.data["data-size"]`（连字符键不可点访问，影响面小——props 主通道是模板/属性声明）；
- `theme`（换主题色）**不纳入**：theme 的主题色标尺 CSS 无 `[data-theme]` 手动通道（标尺按 scope 选择器生成），补通道需预生成全部预设标尺或每组件建 scope——成本不成立；局部换色由 `ThemeManager.scope()` 正规承接；
- `border` **不纳入**：无手动通道（同上），透传无效不如不做。

### 四、物化行为与生效链路

base 的 `mounted` 钩子承担全部行为——**首挂物化一次 + `this.watch` 六键同步**：

- **落点：宿主化身根 `this.el`**——theme 根域裸 `[data-*]` 选择器直接命中、子树继承；
- **缺省不写属性**（`""` / `false`）→ 继承祖先 scope 档位（对齐 theme `_applySizeAttr` 的移除语义）；**显式即写含 `medium`**（显式声明优先于继承，对齐 ADR-0005 显式化判据精神）；
- **布尔走 `data-` 前缀**（`data-dark` / `data-colorized`）：裸 `dark` / `colorized` 属性只对 scope 元素生效，普通元素仅有 data- 前缀手动通道；
- **watch 不可省**：props 单向注入是响应式的（ADR-0022），`:data-dark="isDark"`（暗色切换——主题系统核心交互）要求「消费方状态 → props → 组件 data 域 → watch → setAttribute」全链响应——砍 watch 则绑定态首挂后静默断链；且化身路径约束（模板根动态绑定不求值）决定了这是响应式到达宿主 `data-*` 的唯一稳定通道。button 的 disabled / ripple 同步（首挂 + watch）为同构家族惯例；
- **props 物化后写胜出**：压过化身携带的同名散属性（显式 API 通道优先）；
- **生效链路**：`data-size="small"` @ 化身根 → theme 手动通道 CSS `[data-size="small"]{ --auto-*:… }` → 组件三级回退链第一级重定义 → 组件视觉跟随局部档位。**无 theme 在场时属性静默无效**，组件吃校准兜底值（medium 档视觉，ADR-0129）——**不做组件级档位兜底 CSS**（每组件重复梯度 CSS 违反 DRY，脱离主题的视觉一致性由校准兜底值承担）。

### 五、button 试点与登记面

- **button 单组件试点**接入（`x-define:inherit="autospark.base"` 一行声明，props 零声明——六键与 mounted 物化经继承自动获得），验证 props 链 / 响应式同步 / `data-size` + `data-dark` 叠加（theme 侧组合块特异性有前科）；notifications 后续批次；
- **登记面裁剪**（abstract 特性）：进 engine 内置注册（无 plugins 登记面——不进 `CLOSURE_ARTIFACTS` / 聚合入口）；文档 `docs/zh/components/base.md` 面向**组件开发者**（基类契约，非使用手册）；侧边栏「基础」类目；**不做独立 demo**（不可实例化）——主题覆盖效果在 button 的 demo / 文档展示（消费视角）。

## 实现要点（防再踩）

1. **继承解析加形态分支**（`compile/inherit.ts`）：父 `def.base === true` 时——快照取 `childDef.snapshot`（`buildComponentDef` 产物已剥资源节点，直接可用）+ 补 `stripDeclareFamilyAttrs`（子快照根仍带 x-define 族属性）；**跳过**覆盖段收集 / 出口替换 / 子根属性并入；`slots = childDef.slots`；其余（setup/hooks/styles/defaults/边界/methodLayers）复用既有合并零改动；
2. **声明解析**：`x-define.abstract` 修饰符（`extractBoundaryOptions` 同族通道）→ `ComponentDef.base`；abstract 上声明 `x-define:inherit` → warn + 拒绝注册；
3. **直接实例化拦截**：x-component 消费侧查 `def.base` → warn + 不渲染（不装元素名标签在 `registerComponentDef` 的 tag 安装分支跳过）；
4. **内置注册 × 继承反查**：base 经内置种子表 / 全局表注册后，plugins 组件的 `x-define:inherit="autospark.base"` 走懒预编译反查（ADR-0083/0133 路径）——**实施期必须实测**（新鲜机制，不可假设）；
5. **化身散属性合并行为（已实测定案）**：三层通道语义——①静态散属性（元素名形态保留属性，`isReservedElementAttr`）直通 theme CSS，物化不碰；②`:data-*` 走 bind 直写（化身根绑定以**组件实例上下文**求值——封闭边界下消费方 x-data 局部域不可见，仅全局 state 场景可用）；③props 通道（指令形态值 / 元素名静态折叠）物化写入。物化实现：首跑快照「外部通道在场键集」（external），applyAll 三态——props 值在场写入、external 键不动（不与 bind 竞争 flush 顺序）、皆无移除。**同键静态 + 绑定混写不支持**（病态场景）。实测坑：连字符键不能直接 `watch`（`"data-size"` 被表达式支路解析为 `data - size` 减法）——经 computed 聚合键 `themeAttrs`（成员访问 `s["data-size"]` 收集依赖）订阅；
6. **base 零依赖 theme**：`base.html` 内不得 import / 探测 theme——纯 DOM 属性写入，主题在场性由 CSS 级联自然决定。

## 被否决 / 演变的方案

- **plugins 包家族工具路线**（base 非组件，共享 TS 模块 + 各组件两行样板消费）：零 engine 改动，但「所有组件必须继承」退化为纪律约定、每组件样板税、漏写无告警——一次性 engine 投资换永久零样板更划算；
- **plugins 独立 IIFE 产物**（`autospark.base.js` + 加载顺序契约）：引入跨产物运行时依赖契约，组件插件失去「只依赖 engine」形态——被内置 engine 方案取代；
- **裸名 props + 保留字 warn 机制**：要 engine 再造一套保留字表，且拦截的是合法自定义场景——被 data-* 形态命名取代（天然命名空间隔离，零机制成本）；
- **裸名 props + 文档纪律约定**：挡不住 `mergeSetups` 子胜的静默破坏；
- **纯静态物化（无 watch）**：`:data-dark` 绑定态首挂后静默断链——响应式引擎砍响应式是本末倒置；
- **`theme` prop 仅透传 `data-theme` 属性**（当前无效、未来生效）：写了没效果的预期管理成本 > 收益；
- **`headless` / `base` / `mixin` 命名**：headless 语义偏「无样式」（base 恰恰可能有共享样式）；base 描述角色而非约束且与组件注册名撞概念；mixin 是 ADR-0081 否决的多继承词汇——abstract 有 OOP/Vue abstract component 双先例，且命名本身承诺「不可实例化」语义；
- **组件级档位兜底 CSS**（无 theme 时 size 仍生效）：每组件复制梯度 CSS，违反 DRY；
- **终端用户透传容器组件**（如 `autospark.theme-box`）：终端用户已有裸写 `data-*` 属性与 `ThemeManager.scope()` 两条路，YAGNI。

## Future Work

- `theme` prop（需 theme 包补 `[data-theme]` 手动通道——预生成全部预设标尺的体积 / 每组件 scope 的成本权衡）；
- abstract ← abstract 链式继承（合并 setup 语义自洽，需求出现再开）；
- 「抽象方法」形态（强制子组件实现某键/方法——接口语义，与基类的「自动装上行为」反向，无现实诉求）。
