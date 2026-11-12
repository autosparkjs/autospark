# ADR-0136：i18n 插件（多语言）与核心兜底 t

- 状态：已采纳
- 日期：2026-11-12
- 关联：[ADR-0007](0007-directive-options-and-modifiers.md)（选项/值通道）、[ADR-0031](0031-script-type-namespace.md)（script type 命名空间）、[ADR-0036](0036-action-descriptor-metadata.md)（action 描述符与缺省补键）、[ADR-0105](0105-viewport-global-feature.md) + [ADR-0112](0112-state-typed-meta-container.md)（`$` 元状态容器）、[ADR-0111](0111-plugin-mechanism.md) + [ADR-0114](0114-plugin-preload-queue.md)（插件机制与预加载队列）、[ADR-0128](0128-core-directive-set-and-plugin-extraction.md)（核心集定界）、[ADR-0132](0132-script-type-dispatch.md)（scriptType 派发注册表）；router 侧协同（`$.language` 读写、`normalizeLanguageTag`、清单共享、params 改引）见 router 包 ADR-0013 系列

## 背景

多语言需求：模板内联翻译（以**默认语言原文为键**查表）、变量插值、复数、响应式切换语言。三个张力点：

1. **归属**：i18n 是应用级构造块（ADR-0128 核心集定界方向 = engine 收敛响应式语言核心），但 `t` 又像模板表达能力——任意绑定表达式开箱可用。且未装载体时模板里的 `t(...)` 不能报错。
2. **表达式体系事实**：actions 不参与 mustache/属性绑定表达式（action 仅 x-on 经 `getAction` 解析）；autostore 对响应式域中的函数值按 computed 执行（state/data 放 `t` 函数不可行）；`buildAction` 的 pending/resolved 双通道广播不适合渲染热路径（每次求值两次广播 = 事件风暴）。
3. **`$.language` 先例**：router 的 LanguageManager 已读写并 watch `state.$.language`（URL 驱动的语言解析），`$` 元容器（ADR-0105/0112）定位就是框架内部响应式数据根。

## 决策

### 一、归属分层：完整能力外移 i18n 插件，核心保留兜底 t

- **`packages/plugins/src/modules/i18n`**（产物 `autospark.i18n.js`，选择性引入）：字典三源收集（`autospark/locales` script / `x-locales` 指令 / `options.i18n.messages`）、查表回退链、复数、`$.language` 注入、翻译实现槽升级。
- **engine 核心**（少量新代码）：`getContext` 聚合视图兜底 `t` 标识符 + 单一**翻译实现槽**（默认 = 恒等 + params 插值）+ `actions.t` 缺省描述符 + `params.ts` 自 router 迁入。
- **平滑降级**：未装插件时 `t(key, ...args)` = 恒等 + 插值（无查表/复数/`$.language` 依赖）——模板不报错、不露裸 `{}`，与装插件后「未命中键」的输出形态一致。

### 二、配置：`AutoSparkOptions.i18n`（插件 augment，engine 零解释）

```js
i18n: {
  default:   'zh-CN',   // 键的书写语言——仅元数据（与 languages[0].code 不一致 dev warn）
  language:  'zh-CN',   // 当前语言初值（$.language 未设置时注入）
  fallback:  'en-US',   // 二级回退语言（未配置则不回退，直接返回键）
  languages: [...],     // 语言清单（{code,name,nativeName}）——只读透出，核心查表不依赖
  messages:  { "原文": { "语言码": 译文 | 复数数组 } },  // 全局字典层（最低优先级）
}
```

- 类型面由**插件 augment**（notifications/resources 先例），engine 运行时不解释本字段；
- `messages` 以原文为键——**与 vue-i18n 按 locale 分组的嵌套形态不同**（`{en:{key:val}}` vs 本项目 `{原文:{lang:val}}`），文档显式标注防误用；
- **router 清单共享**：router 未显式传 `options.languages` 时自动取 `engine.options.i18n.languages`，显式传入优先（向后兼容）。router 只读 options 字段，不依赖插件在场——未装 i18n 插件但配了清单时，router 的 URL 多语言机制照常工作。

### 三、字典三源与就近覆盖

| 源 | 层级 | 机制 |
|---|---|---|
| `options.i18n.messages` | 全局层（最低） | 查表链末端兜底 |
| `<script type="autospark/locales">` | 最近 scope | 插件经 `AutoSpark.scriptType` **开放注册表**注册处理器（ADR-0132；非内置保留名）；`new Function` 对象字面量求值（对齐 `extractScript`），失败 error 跳过；**顶层游离自动挂全局层**（用户示例的常见形态，不静默丢弃）；`global` 属性显式全局（对齐 actions script）；提取后剪枝 |
| `x-locales="{...}"` | 自身 scope（最高） | Compile 静态：**编译期求值一次任意表达式**（对象字面量/状态路径初值），不订阅后续变化——字典是模板结构性数据非动态 UI 状态 |

- 覆盖总原则**就近覆盖**（子覆盖父）；同 scope 内 `x-locales` > script 块（scriptType transformer 先收集、指令编译后写，后写覆盖天然成立）；
- 不支持 `null` 值删除父级键（YAGNI）；
- 字典存储 = 插件自治 `WeakMap<AutoSparkScope, dict>`（engine 类型面零侵入；"scope.locales" 作为文档概念），查表沿 `scope.parent` 链到根再兜底全局层；scope 销毁 WeakMap 键自动回收。

### 四、t 三形态单实现源

- **表达式通道**：per-scope 翻译闭包，挂 `getContext` 聚合视图**兜底层**——`t` 键在 locals/data/state 全部未命中才兜底返回（表达式环境保留标识符，用户在 x-data/locals 放同名变量即可替换翻译逻辑）。模板任意表达式（插值/`:attr`/x-on）可用；渲染热路径零广播。
- **命令式通道**：`engine.actions.t` 描述符（构造期缺省补键、用户同名先占，对齐 ADR-0036 决策 7 与内置 action 惯例），handle 分派到槽——命令式直调照常获得 buildAction 广播（低频，合理）。
- **单一实现槽**：per-engine 可覆写的翻译实现位。核心默认 = 兜底 t；i18n 插件 `$.ready` 覆写为完整实现（WeakMap 查表 + 复数 + `$.language` 响应式依赖）。双通道共同分派到槽——DRY 单实现源；槽切换后 `watchExpression` 的动态依赖重收集自动生效。

### 五、查表与回退链（插件实现）

- **双规则匹配**：字典键（原文）**全等**（不 trim、不归一空白）；语言码键走归一匹配（大小写不敏感、`_`→`-` 等价，插件内自实现四行 normalize，不跨包依赖 router）；
- **回退链**：`$.language` 全等 → 主子标签匹配（`zh-TW` 命中字典键 `zh-CN`）→ `fallback` 全等 → fallback 主子标签 → **返回键本身**（键也照常插值）；与 router `resolve()` 同语义；
- 命中失败 dev warn **一次性去重**（每键一次），生产静默；
- 命中值分派：`string` 普通翻译；`array` 复数模式。
- **分层语言链修订**（实施期修订）：查表从「key 就近收口」改为「**key 就近收集 + 分层语言链**」——沿途收集所有含该 key 的层（近 → 远），逐层做语言链匹配，**近层已有语言优先，近层缺的语言由远层补**。动机：组件只内置部分语言包时，使用处可在消费容器上用 `x-locales` 注入其他语言的译文，组件内文案即按注入语言渲染（同 key 同语言仍近层胜，就近覆盖语义不变；单层声明时与收口行为完全一致）。

### 六、插值与复数

- **params 迁入 engine**（`src/utils/params.ts`，router 改引 engine 导出，`String.prototype.params` 契约不变）并**放宽正则**支持 `$` 前缀键：`\{\s*(\$?[a-zA-Z\d]*)\s*\}`——`{$count}` 可解析（纯放宽，向后兼容）；
- **复数触发**：命中值为数组；候选优先级 = **第一个数字位置参数**（严格 `typeof number`）> **第一个 `$` 数字变量**（对象键序）；无候选取**末项**（other 语义）；
- **下标选择** = `clamp(floor(n), 0, len-1)`（0→零体、1→单体、2→双体、大数→末项）；数字参数/`$` 变量**兼任插值**（有 `{}` 时照常填充）；
- **混用不支持**：对象参数与位置参数并存时 dev warn + 忽略位置参数（复数场景统一走 `{$count}` 通道）；
- 边界：无 `{a.b}` 嵌套路径插值、无数字本地化格式化（`1000` → `"1000"` 原样，`Intl` 待真实需求）。

### 七、`$.language` 响应式（`$` 元容器居民）

- **唯一运行时真相**，切换入口 = 直写 `state.$.language`（响应式天然生效，无 manager API——`setLanguage` 已否决）；
- **engine 核心不写**：插件版 t 闭包**首次求值时惰性 ensure**（写 `options.i18n.language ?? default` 初值，经响应式代理写——`ensureMetaContainer` 先例），`$.ready` 再主动 ensure 一次兜底（无 t 模板场景）；router bootstrap 的 resolve 结果覆写（URL 驱动优先）；
- 所有 `t(...)` 绑定经 `watchExpression` 依赖收集自动随切换重渲染——正是「t 生成一个依赖 `$.language` 的计算属性」的落地形态，无需新建 computed 机制；模板亦可直用 `{{ $.language }}`（纯路径精准订阅）。

### 八、插件时序（ADR-0111/0114/0132 既有语义，零新机制）

- **installPlugin 回调体**（引擎先加载时模块加载期直注册；队列路径时 drain 在构造开头——均早于首编译）：`scriptType("autospark/locales", handler)` + `AutoSpark.directive(x-locales)`；
- **`$.ready` 回调**（构造末尾，晚于 compile）：翻译槽覆写、`actions.t` 补键自查（`'t' in engine.actions` 则跳过，notifications 先例）、`$.language` 兜底 ensure；
- 文档写明：`autospark.i18n.js` 须早于 `new AutoSpark()` 加载（选择性引入契约）。

## 实现要点（防再踩）

1. **getContext 兜底**：get/has 陷阱对 `'t'` 键兜底返回 per-scope 懒建闭包；闭包**每次调用分派现读槽**（动态分派——插件晚于 scope 创建装载也生效）；
2. **依赖收集**：插件实现闭包内读 `store.state.$.language`（响应式代理）→ `collectDependencies` 窗口内自然收集；核心兜底不读（零依赖）；`t(...)` 含括号恒走表达式支路，无路径误判；
3. **`$.language` 初值不能指望 `$.ready` 后的首渲染**（ready 晚于 autostart compile——`{{ $.language }}` 会先渲染空帧再收敛）；惰性 ensure 在 t 首求值期（store 已建、首渲染同步期）无空档；**写必须经响应式代理**（裸引用写不触发订阅通知，`$.viewport` 同坑）；
4. **t 绝不进 state/data**：autostore 函数值 computed 陷阱（依赖收集时执行）；
5. **未装插件时的降级面**：locales script 由引擎 scriptType 派发 transformer **warn + 剪枝丢弃**（compiler ADR-0132 既有行为——未注册的 `autospark/*` 类型一律丢弃不进渲染 DOM，零新增引擎代码；warn 即「该装插件了」的引导，notifications 同哲学）；`x-locales` 属性无指令注册、原样留在产物 DOM（未知 x-* 属性引擎不动，无害）；`t(...)` 走兜底实现（决策一）；
6. params 正则放宽是**纯放宽**（新增可选 `\$?` 前缀），router 现有插值行为零变化；
7. 复数下标对 2 项数组（`[零体, other]`）自然退化：`n=1` → 下标 1（other 形态），与 CLDR 最简形态一致。

## 被否决 / 演变的方案

- **engine 全量核心**（grilling 初稿共识）：与 ADR-0128 核心集定界方向相反；插件化后按需加载，核心只留「不报错」的最小兜底；
- **t 进 actions 表由表达式解析**：actions 本就不参与 mustache 表达式（语义扩面大）；且 buildAction 广播在渲染热路径造成事件风暴；
- **state/data 放 t 函数**：autostore 函数值 computed 陷阱；编译期 desugar `t(`（字符串改写有语法风险，getContext 兜底一行陷阱即可，否决）;
- **BCP47 逐级粗化匹配**（`zh-TW`→`zh` 要求字典有 `zh` 键）：主子标签匹配与 router `resolve()` 同语义且 `zh-TW` 命中 `zh-CN` 译文更合理；
- **根键 `$language`**：router 现网已用 `$.language`，`$` 元容器（ADR-0105）方向就是框架内部数据统一居民；
- **`i18n.data` 字段名**（初稿）：`data` 与 x-data / 路由 data 撞义，定名 `messages`（vue-i18n 惯例，形态差异文档标注）；`resources` 撞 resource 插件；
- **`setLanguage` manager API**：`$.language` 直写天然响应式，双入口徒增面（`$.viewport` 的「只读约定」反例——`$.language` 是用户可写切换面，语义刻意相反）；
- **`scope.locales` 实例字段**：WeakMap 零类型侵入，scope 实例挂插件字段有侵入感；
- **表达式 t 被 actions 同名 t 接管**：表达式 t 恒为内置（用户替换通道 = 表达式环境同名变量），保持渲染热路径零广播不可让渡；
- **script type 更名 `autospark/messages`**（script 名与配置面同名的家族惯例——actions/data/resources 均同名）：保留 `autospark/locales`——声明通道（script + `x-locales` 指令）统一 locales 词族，`messages` 专职数据字段名（`i18n.messages`），双词分工定案；连带在 CONTEXT.md 的 ADR-0096 废弃词条加辨析注，防 `i18n.messages` 被按「通知旧名」误纠。

## Future Work

- 数字/日期本地化格式化（`Intl.NumberFormat` / `Intl.DateTimeFormat` 选项通道）待真实需求；
- CLDR 复数类别（zero/one/two/few/many/other）当前以简化下标 clamp 表达，多语种真实落地后再议；
- 语言清单驱动的 `<html lang>` 同步归 router（既有 `syncDocumentLang`），未装 router 时 i18n 插件不接管。
