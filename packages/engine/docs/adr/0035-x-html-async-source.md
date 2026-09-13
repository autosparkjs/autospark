# ADR-0035：x-html 远程异步 HTML 源（url / action 形态 + 视觉反馈）

- **状态**：Accepted（grill-with-docs，三轮九问）
- **日期**：2026-09-13
- **关联**：[ADR-0033](0033-x-data-async-source.md)（异步数据源——本 ADR 复用其骨架并做物种分化）、[ADR-0005](0005-x-html-directive.md)（x-html 默认消毒）、[ADR-0017](0017-x-html-compile.md)（`.compile` 子模板编译）、[ADR-0007](0007-directive-options-and-modifiers.md)（`x-html-options` 选项载体）、[CONTEXT.md](../../CONTEXT.md)（「异步数据源」家族词条、「异步 HTML 源」「异步兜底」词条）

## 背景

ADR-0033 让 x-data 具备了异步数据源能力（url / action 两形态、插值重取、竞态丢弃、x-fallback / x-loading 反馈）。需求：x-html 获得同构能力——`x-html="/api/partial.html"` 从远程加载 HTML 片段、`x-html.compile="/api/tpl.html"` 加载**模板**编译执行。

表面是「照搬 x-data 异步」，拷问暴露出三处物种差异，不可直搬：

1. **值身份根本不同**：x-data 的值是数据声明（非表达式），三分发无冲突；x-html 的值**本来就是表达式**（`x-html="content"` 是最常见用法）——url / action 判定必须证明不侵犯既有表达式语义；
2. **无数据域**：x-html 是绑定指令，没有可注入 `$loading` / `$error` 的落点——反馈通道需要重新设计；
3. **响应是 text 而非对象**：x-data 的「对象-only + path 提取」映射在 x-html 无对应物。

## 决策

### 1. 值形态分发：url 前缀复用 + action 判定必须带括号

- **url 形态**：复用 x-data 前缀集（`/`、`//`、`http://`、`https://`、`./`、`../`）。安全性：合法 JS 表达式几乎不可能以 `/` 开头（除正则字面量，作为 html 绑定值无意义），语法层面无歧义。裸词相对 url 不支持（与 action 名不可判定，同 ADR-0033）；
- **action 形态**：判定收紧为 `^标识符(实参)$`——**必须带调用括号**（`loadPartial(lang)` / `loadPartial()`）。这是与 x-data（裸词也算 action）的关键差异，理由：x-html 的裸词 `x-html="content"` 是读状态键的最常见用法，不可劫持；而**带括号的单段标识符调用在表达式通道本就失败**（`with(scope)` 求值视图不展开 `scope.actions`）——改走 action 链是零破坏的语义升级。多段 / 链式调用（`Math.ceil(x)`、`s.trim()`）含 `.` 不匹配，保持表达式。

### 2. 响应映射：text-only，类型不符即失败

`res.text()` 直取，无映射层、无 `path` 选项（JSON 包壳 `{code:0,data:'<html>'}` 场景归 action 形态自行解析——引入「猜内容类型」逻辑不值）。action 返回值 `typeof !== "string"` → 按加载失败处理（保旧值、fallback 认领、warn，不落地）——与 x-data「对象-only」姿态对称：产物类型不符是 bug 信号，注入 `"[object Object]"` 比显示错误更糟。空串照既有语义清空宿主（空串不在默认 emptyValues 内，同步行为照旧）。

### 3. 反馈通道：视觉完整、不注入元键（B 方案）

- **x-loading 覆盖层合成**：利用 x-loading 的**字面量模式**（裸 / `true` / `false` 静态显隐，无订阅）——指令内部直切合成属性的值，`attrChanged` 驱动显隐，无需状态键；
- **x-fallback 静态认领**：归属扩展——剪枝条件从「宿主有异步 x-data」扩为「宿主有异步 x-data **或** 异步 x-html」。x-html 侧 fallback 走**静态通道**：不编译、不可插值（`{{ }}` 显示原文）；显示条件 = 非就绪（加载中或失败）且**宿主无已注入内容**——首载显示、重取保旧值不闪断、失败也认领；注入内容写入前先移除 fallback；
- **`loading` 选项三态**同 x-data：`false` 恒关 / `{...}` 直传 x-loading 配置 / 默认自动（有 x-fallback 则不合成，互斥为默认）；
- **不注入 `$loading` / `$error`**：元状态键是数据域概念，归 x-data 独有——x-html 是绑定指令，越界持有数据域会撞上「同元素双异步踩踏」（见决策 7）。需要错误详情的场景走 action 形态（catch 后返回错误 html 字符串）或 x-data 中转。

### 4. `.compile` 组合：远程模板

`x-html.compile="/api/tpl.html"` 取回 text 作为**子模板编译**（ADR-0017 既有语义不变：建 scope/watcher、继承宿主作用域、隐式跳过消毒、值变全量重建）。重取时旧子树保留（保旧值）；x-fallback 在 compile 模式同样认领（加载中显示、成功后让位给编译产物）。**默认模式对远程内容维持默认消毒**——远程比本地更不可信，safe-by-default（ADR-0005）更该守；`.raw` 照旧退出消毒。

### 5. 复用抽象：组合式 `AsyncSourceRunner`（拒绝指令基类继承）

x-data 与 x-html 异步逻辑的重复面精确定位在**取数执行器**（形态判定、url 插值 → watch 依赖重取、fetch 判重 / 竞态 / abort / method / header、action 调用）——抽为组合式 `AsyncSourceRunner` 类（非指令、无 DOM 耦合），回调接口 `{ responseParser, onLoading, onResult, onError }`；两指令**持有** runner 实例。响应消费（对象落域 vs text 注入）与反馈接线（元键 + 编译式 fallback vs 静态 fallback + 字面量切换）留在各自指令——是正当业务差异，不是重复。

拒绝 `AsyncSourceDirectiveBase` 指令基类：DataDirective 主体（同步形态、mount 三形态、回收）与异步无关，中间夹「异步源基类」is-a 不成立；模板方法 hook ≥5 个退化成上帝类；单一继承链锁死未来组合能力。fallback 管理同理不共享（x-data 版 stash 正常子树 + `compileChild` 编译，x-html 版纯静态挂 / 卸——共享面只剩两行，YAGNI）。

### 6. 同元素双异步：反馈通道归 x-data 独占

`<div x-data="/api/book" x-html.compile="/tpl/book.html">`（数据 + 模板双远程）合法且有价值，但反馈会撞车（x-loading 属性同名互覆、一个 fallback 两认领）。规则按优先级天然定序（DataDirective priority=200 先于 HtmlDirective 的 0）：

1. **fallback 归 x-data 独占**：x-html 的 fallback 认领条件含「宿主无异步 x-data」——双异步时 x-data 的 fallback 替换整个子树，已覆盖 x-html 的展示需求；
2. **x-loading 合成互斥**：x-html 合成前检查宿主已有 `x-loading` 属性（手写或 x-data 合成）或异步 x-data 在场 → 不合成；同元素双异步下显式声明 `x-html-options="{loading:{...}}"` 被忽略并 warn。

一句话：「同元素双异步时，反馈通道由 x-data 独占」。

### 7. 生命周期与语义沿用清单（与 ADR-0033 逐条同构）

| 项 | 沿用语义 |
| --- | --- |
| 请求生命周期 | 编译期首取；destroy 时 `abort()` + 请求序号自增（在途结果不落地） |
| 竞态 | 后发先至的旧响应按序号丢弃 |
| 保旧值 | 重取期间旧内容保留不闪断；fallback 仅在宿主无已注入内容时显示 |
| url 插值 | `{expr}` 单括号、`encodeURIComponent`、求值于宿主作用域、依赖变化自动重取 |
| 插值判重 | url 全值相同则跳过重取（`lastUrl` 机制） |
| 选项边界 | `method` / `header` 仅 url 形态有效；载体 `x-html-options`（ADR-0007 惯例） |
| 缓存 | 同 url 多元素不缓存（各取各的） |
| x-text 同元素 | x-html 确定性胜出规则照旧（含异步分支） |
| HTTP 错误 | `!res.ok` 抛错走失败通道（保旧值 + fallback + warn） |

## 被否决的方案

- **指令基类继承（`AsyncSourceDirectiveBase`）**：is-a 不成立（DataDirective 不是异步源，只是有异步分支）、hook ≥5 个的上帝类、继承链锁死——组合式 runner 精确抽净重复面。
- **action 判定含裸词（照搬 x-data）**：劫持 `x-html="content"` 读状态键的最常见用法——收紧到带括号，裸词恒为表达式。
- **`path` 提取 / JSON 包壳支持**：引入「先 text 再试 JSON」的猜内容型逻辑，html 接口 99% 直返 text/html——包壳场景归 action 形态。
- **`String()` 宽容转换非字符串返回**：对象注入 `"[object Object]"` 垃圾内容、静默出错——类型不符即失败（与 x-data 对象-only 姿态对称）。
- **反馈通道 C 方案（注入 `$loading` / `$error` 到宿主私有域）**：绑定指令越界持有数据域 + 同元素双异步元键踩踏——B 方案视觉反馈已完整，错误详情有 action / x-data 两条既有出路。
- **反馈通道 A 方案（仅覆盖层、无 fallback）**：首载空窗无内容——fallback 是「异步未就绪替换渲染」家族语义的正当成员。

## 后果

- ✅ x-html 成为第二家异步源指令；`AsyncSourceRunner` 无 DOM 耦合可独立单测，未来第三家（如 x-for 远程列表）即持即用。
- ✅ 「数据 + 模板双远程」组合（`x-data` + `x-html.compile`）解锁：模板表达式读数据域，二者天然经响应式协调（模板先到读 undefined → 空值占位 → 数据到达细粒度更新）。
- ⚠️ **判定差异是公开契约**：同字面值 `content` 在 x-data 是 action、在 x-html 是状态键；`loadPartial()` 两边都是 action——文档须给对照表。
- ⚠️ 静态 fallback 不可插值：`{{ $error.message }}` 显示原文（x-html 侧无元键）——错误详情的表达力损失是 aware 权衡。
- **交付**：实现（runner 抽取 + x-html 改造 + x-fallback 剪枝扩展）、测试、x-html.md「远程异步 HTML」节、demo 三件（async-url / async-compile / async-action）+ demo-api `.html` 程序化端点——待「实现」指令另行启动。
