# ADR-0078：x-data 浅响应选项（shallow）

- **状态**：Accepted（已实现——`data.ts` 归一与容器标记落地，`src/__tests__/x-data-shallow.test.ts` 11 用例全绿）
- **日期**：2026-10-01
- **关联**：[ADR-0029](0029-scopes-reserved-key.md)（mount 三形态——本选项仅 local）、[ADR-0032](0032-data-script.md)（数据脚本 options 通道与遮蔽裁决）、[ADR-0007](0007-directive-options.md)（修饰符并入指令选项）、[ADR-0072](0072-messages-state.md)/[ADR-0077](0077-message-session-dual-shell.md)（`$messages` shallow 先例）、autostore ADR-0006/0007（`shallow` 语义）
- **共识来源**：grilling 三轮（默认值策略 → 档位/边界/脚本形态/验收 → 归一表与总清单），本文即共识落盘

## 背景

原提案：x-data 数据默认以 autostore `shallow` 包装（省深层代理开销），配 `.deep` 逃生舱与 `deep:0|1|boolean` 映射。决策前查证的关键事实（autostore 4.7.0，dist 压缩包逐 trap 核对）：

1. `shallow(obj, deep)` 值域**严格 `0|1`**——`deep≥2` 是类型错误，运行时归 1（其 JSDoc 明言哲学：「静默降 0 会砍掉用户以为有的响应，更危险」）；
2. `shallow()` 是**原地标记**（写 `Symbol.for("__AS_SHALLOW_PROXY__")` 后返回裸引用），真正的代理在节点进入 store 代理树时按标记构建——标记可打在容器或值上；
3. 浅域第二层及以下**读出即原始引用**——无代理即无 trap，深写不产生任何事件，且**运行时无从拦截检测**（想发警告都拦不到写入）；
4. 例外：**整体替换键值**触发父路径 set，并为已订阅后代派生通知——深路径订阅者在「换整个对象」时活、「改对象内部」时死；
5. 0 档下嵌套对象内的 computed **永不激活**（读不到代理）；顶层函数成员照常变计算属性（函数分支在浅检查之前执行）；
6. 1 档成员在**首次经代理读取时惰性纳管**，之后 push/set 进来的新成员同样生效——「域级声明覆盖后续写入」的实现根基；
7. AutoStore 构造**无全局 shallow 配置项**——粒度控制只能靠标记嵌入状态树。

## 决策

### 一、opt-in 而非默认反转

#### 决策 1：默认全深不变，shallow 显式开启

否决原提案的「默认 shallow」：默认反转使所有存量深层数据（`user.name` 这类）的写入**静默失效**，是最坏失败模式；且无代理无 trap（事实 3），运行时检测深写补警告不可行。默认行为零变化，风险面收敛到显式声明的用户。

#### 决策 2：命名 `shallow`（非 `deep`），`.deep` 不做

默认反转被否决后 `.deep` 修饰符失去存在意义（默认即全深）。选项键定名 `shallow`，与 `$messages` 的 `options.shallow`（ADR-0072/0077，值域 `0|1`）领域语言对齐。误写 `.deep` / `deep` 键静默 no-op 不 warn（本提案未发布、无存量迁移人群；x-data 修饰符无白名单校验机制）。

### 二、声明面

#### 决策 3：三入口同义

| 写法 | 档位 |
|---|---|
| 缺省 / `false` | 不标记，全深（现状默认） |
| `.shallow` 修饰符 ≡ `shallow:true` | **0 档**（最省） |
| `x-data-options="{shallow:0}"` | 0 档 |
| `x-data-options="{shallow:1}"` | **1 档** |
| 数据脚本 `<script type="autospark/data" options="{shallow:…}">` | 同键同义（复用 ADR-0032 通道 + 决策 6 父元素权威遮蔽裁决，**不新增独立 shallow HTML 属性**） |

文档只推荐三种写法：**缺省（全深）/ `.shallow`（0 档）/ `{shallow:1}`（1 档）**——`true`/`0` 是机制产物不进示例。bare `.shallow` 取 0 档而非 1 档：修饰符承载「最省」意图，要保第二层响应显式写 `shallow:1`。

#### 决策 4：engine 侧归一，布尔不透传

归一表（engine 自行转换后再交 autostore）：`false`/缺省 → 不标记；`true` → **0 档**；`0` → 0 档；`1` → 1 档；数值 `≥2` → warn + 归 1；其他类型 → warn + 忽略（不生效）。

**`true → 0` 必须在 engine 侧完成**：autostore 运行时 `shallow(obj, true)` 归 **1**（`t>0?1:0`），与决策 3 的 `.shallow`≡`true`≡0 档矛盾（ADR-0007 机制下修饰符并入选项就是写 `shallow:true`），透传即精神分裂。

#### 决策 5：显式 options 键 > 修饰符，静默优先

`x-data.shallow` 与 `x-data-options="{shallow:1}"` 同写 → options 赢、不 warn——沿 x-define `.open` 先例（`collect.ts`：「`.open` 修饰符是 `open:true` 的糖，显式 options 键优先（`{open:false}` 可关掉修饰符）」）。

### 三、作用域与实现载体

#### 决策 6：v1 仅 local 挂载形态

mount 三形态（ADR-0029）下 shallow 的实现载体不一致：local 可安全标记独占容器 `$scopes[id]`；**root 不能标记根 state**（越权波及所有全局键）、只能逐值标记且后续写入不带标记（同域深浅混杂）；**path 挂载容器可能与既有数据共享**（标记容器 = 单方面改共享者响应深度）。故 root/path 声明 `shallow` → warn + 忽略（保持全深）。

#### 决策 7：容器级标记，不递归逐值

标记打在 `$scopes[id]` 容器**建立时**（原地 mutate 不换引用，「永不整体替换 `$scopes[id]`」铁律不破）。不递归标记到每个对象值——`shallow(c,1)` 下 `c.list` 成员获一层浅代理、数组结构变更（push/splice）有事件、`list[i].field` 深写无事件，即 x-for + shallow 既有场景（`x-for-shallow.test.ts` 先例）。异步落地（`applyFetched`）与运行时 `engine.data()` 追加**零特判自动继承**：1 档惰性纳管（事实 6）使后续写入的新键值随容器代理读取纳入浅语义——此继承性列为测试验证点。

### 四、边界与交付

#### 决策 8：失效边界文档化；编译期校验 v1 不做

失效边界（文档义务）：0 档 = 键内字段深写静默失效，仅整体替换键值可唤醒深路径订阅、嵌套 computed 不激活；1 档 = 第三层起失效。编译期订阅深度校验（`scope.watch` 注册时比对路径深度 vs 域档位 → dev warn）是真实增强但须动 watch 管道，v1 不做（YAGNI），留作独立后续 ADR 候选。

#### 决策 9：轻量验收，「可选开销关闭」叙事

交付物：本 ADR、`data.ts` 实现、测试（1 档第二层写触发/第三层不触发、0 档仅整体替换触发、root/path warn 忽略、三入口等价、异步与运行时追加自动继承）、`x-data.md` 文档节 + demo（深浅对照）、CONTEXT.md 词条。文档定位「**大/深数据域的可选深层代理开销关闭**」，不写「性能优化」为默认收益；demo 附深浅两域对照。

## 被否决 / 演变的方案

- **默认 shallow + `.deep` 逃生舱**（原提案）：静默失效破坏性变更，无代理无 trap 无法运行时检测；文档/demo 存量深层响应全崩。opt-in 取代；
- **`deep` 命名体系**（`deep:true`=全深 / `deep:0`=`shallow(_,0)` 映射表）：随默认反转一并消亡——默认即全深，`.deep` 成无人认领的冗余声明；
- **`deep:N`（N≥2）任意深度**：autostore 值域严格 `0|1`（类型错误 + 运行时归 1），除非先改 autostore；
- **bare `.shallow` = 1 档**（对齐 autostore `true→1` 归一）：被「修饰符=最省意图」取代——0 档作简写默认，1 档显式精调；
- **root/path 值级标记 + 全写入入口补标记管道**：复杂度高且 path 共享容器标记越权，v1 拒载（决策 6）；
- **数据脚本独立 `shallow` HTML 属性**：与既有 `options` 属性通道构成双真相源，DRY 失败；
- **编译期订阅深度校验**：opt-in 后风险面缩小，增强不阻塞特性（决策 8）。

## 修订记录

- 无。
