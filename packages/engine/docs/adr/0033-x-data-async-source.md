# ADR-0033：x-data 异步数据源（url / action 形态 + 异步兜底）

- **状态**：Accepted
- **日期**：2026-09-13
- **关联**：[ADR-0029](0029-x-data-mount.md)（挂载模型——异步数据后到走同一管道）、[ADR-0032](0032-data-script.md)（数据脚本——异步形态与之的合成次序）、[ADR-0007](0007-directive-options-and-modifiers.md)（path / loading / header / method 选项载体）、[ADR-0010](0010-action-dom-bubble-event.md)/[ADR-0011](0011-sync-action-lifecycle.md)（action 三信号复用）、[CONTEXT.md](../../CONTEXT.md)（「异步数据源」「提取路径 path」「异步兜底 x-fallback」词条）

## 背景

x-data 此前只有同步形态（`{...}` 对象 / 数据脚本）。需求：数据声明直接指向**异步来源**——`x-data="/api/books"`（fetch 远程）与 `x-data="loadBooks(arg)"`（执行动作取数），并要求加载过程有状态反馈（自动 x-loading）、可选的加载兜底渲染（x-fallback）、url 插值（`/api/books?order={book.order}`）。两轮 grilling 就值形态分发、响应映射、元状态、反馈通道、重取语义、HTTP 边界逐一裁决。

## 决策

### 1. 值形态分发：前缀/语法三分

| 值形态 | 判定 | 通道 |
| --- | --- | --- |
| 对象（现状） | `{` 开头 | relaxed-json / 数据脚本既有管道 |
| url | `/`、`//`、`http://`、`https://`、`./`、`../` 开头 | fetch |
| action | `^标识符(实参?)$` | getAction 链执行 |

其余维持现状（warn + 空对象）。**裸词相对 url 不支持**（`api/books` 与 action 名不可判定）——相对路径写 `./api/books`。

### 2. 响应映射：对象-only + `path` 提取

- fetch/action 的结果**只接受对象**——非对象（裸数组 / 标量 / null，含 `path` 提取后仍非对象、提取失败）→ `$error` 置错（Error 实例）+ `logger.warn`，数据不落地，x-fallback 认领显示（Q9 用户裁决：与加载失败同级，不静默）；
- 可选 `x-data-options="{path:'results'}"`：`getVal` 从响应结构下钻提取子对象。**选项名 `path` 与 ADR-0029 否决过的 mount:path 不冲突**——彼处否决的理由是「挂载点不是读数据的路径」，此处 path 恰是「读响应数据的提取路径」，语义正是这个词的本义（词条显式区分）；
- 曾提议「响应为数组自动包 `{items:[...]}`」「选项名 `result`」均被用户裁决否决——映射保持最小：对象直入、path 一条提取口。

### 3. 元状态键：`$loading` / `$error`（仅异步形态注入）

- `$loading`（boolean）/ `$error`（Error 实例，`{{ $error.message }}` 可读）注入数据域——`$` 前缀避撞用户键；模板可自由分支（`{{ $loading ? '中' : $error.message }}`）；
- 合成 x-loading 覆盖层有了现成绑定路径（元键的全局路径）；
- 新一轮请求发起时清 `$error`；成功后 `$loading=false`；
- **同步形态（对象 / 数据脚本）不注入**——`$loading` 恒 false 的同步域注入元键只会污染命名空间；
- 元键与数据键**同责回收**（进 attachedKeys，destroy 键级 CAS 删）。

### 4. 反馈通道：x-fallback（双态兜底）+ x-loading（覆盖层），互斥为默认

- **x-fallback**：x-data 异步形态宿主的**特例子节点**（x-empty 之于 x-for 同构：编译期剪出、状态切换挂载/卸载）。**双态认领**：`$error` 或 `$loading`；**显示条件 = 非就绪且域内尚无数据**——首载显示，**重取保旧值、不闪断**（SWR 式；要重取期视觉指示，显式声明 `loading` 选项叠覆盖层）。孤立 x-fallback（父元素无异步 x-data）→ warn + 当普通元素放行；x-for 项模板采集跳过 x-fallback（数据脚本同款先例，for.ts）；
- **x-loading 覆盖层**：异步形态默认**合成** `x-loading="<元键全局路径>"` 属性（Runtime 指令属性保留在结果 DOM，dispatcher 自然拾取；合成指令先例 ADR-0020）。**互斥默认**：声明了 x-fallback 子节点则不合成覆盖层，避免「fallback 替换内容 + overlay 盖宿主」双重加载指示；`loading:{...}` 显式声明则并存，`loading:false` 恒关；
- `loading` 选项值域 = x-loading 的 LoadingConfig 直传（message / color / bgColor / opacity / delay / selector）。

### 5. url 形态：单括号插值 + 依赖驱动重取

- **插值语法 `{expr}`**（单花括号，RFC 6570 URI Template 同构）：与模板 mustache `{{}}`（渲染到 DOM）用途天然区分；求值于**宿主聚合视图**（可读父链与全局状态）；
- 插值段值默认 `encodeURIComponent`（URL 安全），URL 其余部分原样；「不编码」转义口子 YAGNI；
- **重取**：编译期首取；watch 插值依赖路径，变化经 scheduler 合并重取；**竞态按请求序号丢弃过期响应**（后发先至的旧响应直接扔）；不做防抖（scheduler 已合并同 tick）；
- **HTTP 边界**：`method` 选项直传 fetch（默认 GET，用户裁决增加）；`header:{...}` 静态对象传 headers；**body 不做**（Q10 用户裁决：非幂等/带体场景用 action 形态）。

### 6. action 形态：复用既有 action 体系

- 查找走既有 **getAction 链**（局部 `autospark/actions` → 全局 engine.actions）；`x-data="action"` 无参直调、`x-data="action(arg)"` 实参为**表达式**（宿主 scope 求值，与 x-on 内联调用同构）；
- **实参依赖变化对称重执行**（与 url 插值共用「依赖收集 → 变化重取」机制——否则「url 会自动刷、action 不会」是无理由的不对称）；
- 返回值 / Promise resolve 值经决策 2 同规则映射；`$loading`/`$error` 由既有 pending/resolved/rejected 三信号驱动（ADR-0010/0011，零新机制）。

### 7. 管道与边界

- 异步数据到达后走**同一 `applyData` 管道**——mount 三形态（ADR-0029）、键回收语义自动兼容（数据只是「晚点到」）；
- **与数据脚本合成**（ADR-0032）：脚本是同步基底，异步数据**后到、deepMerge 覆盖**（远程是权威数据）；
- destroy 经 **AbortController 中止**进行中请求（action 形态至少做到结果不落地）；
- **多元素同 url 不缓存**（各挂各域；共享用 mount 同路径 + engine.data 手工实现，YAGNI）。

## 被否决的方案

- **响应数组自动包 `{items:[...]}`**：魔法映射，键名不可控——收敛为对象-only + `path` 提取（用户裁决）。
- **选项名 `result`**：`path` 更贴「下钻提取」语义且与 getVal 心智一致（用户裁决）。
- **插值用双花括号 `{{}}`**：与模板 mustache 混淆——单括号有 RFC 6570 背书，用途天然分区。
- **重取时清旧值 / 每次加载都显示 x-fallback**：改筛选条件闪断整块内容，体验最差——保旧值（SWR 式）+ fallback 仅在无数据时显示（Q11 用户裁决）。
- **覆盖层与 x-fallback 默认并存**：双重加载指示——互斥为默认，显式 opt-in 并存。
- **method 一并带 body**：开半个 HTTP 客户端——url 形态是声明式幂等取数，命令式全能力归 action。
- **响应非对象静默忽略**：渲染空白且无指示——按加载失败同级（$error + fallback）。
- **裸词相对 url（`api/books`）**：与 action 名不可判定——相对路径必须 `./`/`../` 前缀。

## 后果

- ✅ x-data 成为三种数据来源的统一声明口（字面量 / 数据脚本 / 异步源），挂载与回收模型零新增心智。
- ✅ action 体系零改动复用（三信号 + getAction 链）；x-loading 零改动复用（状态驱动 + 合成属性）。
- ✅ 模板对异步状态完全可见（`$loading`/`$error`），不再依赖指令副作用才能表达。
- ⚠️ 值域扩容是公开契约：`{` / url 前缀 / action 名三分的判定规则一旦发布即不可轻动（分发歧义即破坏性变更）。
- ⚠️ `path` 选项名与 ADR-0029 的否决史需在文档里显式和解（挂载点 ≠ 提取路径），避免后来者误判撞名。
- **交付（文档本轮）**：CONTEXT.md 三词条；实现与测试、x-data.md「异步数据源」小节、demo `data/async.html` 另行启动。
