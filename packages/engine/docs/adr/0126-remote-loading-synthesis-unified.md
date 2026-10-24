# ADR-0126：远程加载 loading 合成协议统一（宿主声明优先）

- **状态**：Accepted（grill-with-docs，四轮收敛）
- **日期**：2026-10-23
- **关联**：[ADR-0122](0122-remove-x-fallback.md)（三件套模型——本 ADR 使其在 x-component 上补齐、全家族成立）、[ADR-0121](0121-remote-load-kernel-asyncloader.md)（远程加载内核——家族适配层边界）、[ADR-0035](0035-x-html-async-source.md)（x-html 异步源——合成机制起源）、[ADR-0066](0066-x-component-remote-loader.md)（x-component loader——loading 选项落点）、[CONTEXT.md](../../CONTEXT.md)（新增「loading 合成协议」「元键注入」「loading 选项（x-component）」词条）

## 背景

ADR-0122 收敛出异步反馈三件套（元键数据通道 + x-loading 合成视觉通道 + x-if/else 结构通道），但仅落地于 x-data / x-html 两物种。核查全家族发现三类漂移：

1. **x-component 词汇与元键双缺位**：loader 场景只有 `fallback`（置换式占位）与内建默认遮罩（`_showLoadingPlaceholder`），既无 `loading` 选项定制遮罩（文案 / 视觉），也不注入 `$loading` / `$error` 元键——三件套在置换型物种上断链，用户只能整包接管（手写 x-loading 或 fallback）而无中间档；
2. **守卫与所有权闸缺失**：x-html 侧有 `hasAttribute("x-loading")` 守卫 + `loadingSynth` 所有权闸（只翻转 / 删除自己合成的属性）；x-component 的 `_showLoadingPlaceholder` / `_hideLoadingPlaceholder` 无条件 set / remove——宿主手写的 x-loading 声明会被覆盖，hide 时连宿主声明一起删；x-isolate、overlay 的 boundary 同样无守卫；
3. **实现四处漂移**：同一「合成遮罩」逻辑在 x-html / x-component / x-isolate / overlay 四处各写一份，且 toggle（`"true"`/`"false"` 字面量切换，x-html 式）与 set / remove（属性挂摘，x-component / x-isolate 式）两种协议并存——每处独立演化必然再漂移（x-isolate 不走 fetchHtml 的前车之鉴）。

用户裁决：**三层对齐——词汇 + 合成协议 + 冲突规则；验收面 = 用户可见行为，非源码形态**。

## 决策

### 1. 对齐基准：三层全对齐，验收看行为

词汇（loading 选项命名与值域）、合成协议（守卫 + 所有权闸 + options 透传 + 显隐切换）、冲突规则（宿主手写 x-loading 优先）三层统一；对齐的验收标准是**用户可见行为一致**，不要求源码形态逐字相同。

### 2. x-component 补 `loading` 选项（词汇层）

- 值域 `false | 文案字符串 | x-loading 配置子集`：`false` 关默认遮罩；字符串 → `message`；对象 → `x-loading-options` JSON 透传；
- 与 router loading 配置先例（boolean | 文案 | 配置子集）及 x-html / x-data 的 `loading` 选项同构，选项键归入 `x-component-options` 平铺归一层（与 fallback / error / width / height / request / retry 同级）；
- `fallback` 保留且**显式声明优先**：声明 fallback 即不合成遮罩——两种占位形态并存按声明分流（fallback = 置换式流内占位，loading = 遮罩）。

### 3. 占位语义不统一（物种差异成文）

内容型（x-data / x-html）加载中**保旧值 + 遮罩**；置换型（x-component）**清宿主 + 流内占位**。本 ADR 统一的是**视觉机制**（合成协议），不统一占位语义——物种差异写入文档，不做强统一。

### 4. x-component 注入 `$loading` / `$error` 元键（数据层）

- 注入宿主 scope locals，复用 x-html `_setMeta` 模式：原地改写不换引用（子 scope 经 `_linkParent` 共享同一对象，替换会断链）+ `invalidateScopeView` + 仅刷子 scope 不刷宿主自身（防 `_setMeta → refresh → invokeAction → _beginLoad → _setMeta` watcher 死循环）；
- 时序：占位显示置 `$loading=true`（含 pendingName 等待 `components/<名>/registered` 的 R6=B 路径）；loader 发起 / 重试清 `$error`；实例化成功 `$loading=false`；失败落地 `normalizeLoadError` 归一错误（`source:"load"`）；
- 占位上下文 `{url, name, error, message}` 保留并存（命名不冲突）；
- 至此 ADR-0122 三件套在全部远程加载物种成立。

### 5. 守卫 + 所有权闸（冲突规则层）

- x-component 补 `hasAttribute("x-loading")` 守卫 + `loadingSynth` 所有权闸：宿主手写 x-loading 优先——引擎**不合成、不触碰、不删除**；只有合成方持有所有权时才翻转显隐 / 摘除属性；
- x-isolate / overlay 随共享 helper 同批获得守卫（可见行为变化，见后果）。

### 6. 抽共享合成 helper（实现层）

守卫检查 + 挂属性 + options 透传 + 显隐 / 移除抽为共享 helper，x-html / x-component / x-isolate / overlay 四处改调；toggle（`"true"`/`"false"`）与 set / remove 两种协议在 helper 内统一（x-loading 字面量模式经 attrChanged 驱动显隐，视觉不可分辨）。逐处手改必再漂移，单点实现是本协议的存续前提。

### 7. x-data 不纳入

x-data 的遮罩合成走**响应式路径**（`x-loading="<元键 store 路径>"`，元键入 store 可订阅）——为物种特例，不接入共享 helper、不纳入本协议，现状保持（含无守卫的现状），物种差异仅文档标注。

## 被否决的方案

- **占位语义强统一**（如 x-component 也保旧值）：置换型物种「清宿主」是组件实例化语义的必然（宿主即组件根，无「旧内容」可保），强统一是削足适履；
- **x-component 元键豁免**（维持仅 fallback / 遮罩）：元键是三件套的数据通道，豁免则 x-component 用户无法 `x-if="$loading"` 自定义结构占位，只能整包接管——三件套「全家族」名存实亡；且 fallback / 错误占位经 compileChild 以宿主 scope 为 parent，可沿 scope 链直读元键，豁免反而制造「有的注入有的不注入」的隐性分裂；
- **全家族改响应式路径**（x-html / x-component 也学 x-data 把元键入 store）：x-html / x-component 无数据容器，为遮罩显隐引入容器是越界（ADR-0122 已裁决 locals 姿态）；x-data 的响应式路径是其「元键本就在 store」的既有物种特权，反向推广无收益；
- **不抽 helper、四处逐一手改**：四处各自演化正是本次漂移的成因，手改等于把同一批决策抄四遍——下一处变更（如新增视觉字段）必然漏改。

## 后果

- ✅ 三件套（元键 + x-loading 合成 + x-if/else）覆盖 x-data / x-html / x-component 全部异步物种；x-component 获得与 router / x-html 同词汇的 loading 配置；
- ✅ 「宿主手写 x-loading 声明优先」成为全家族一致契约：手写声明不再被覆盖 / 误删；
- ✅ 合成逻辑单点化（共享 helper），四种关注点（守卫 / 所有权 / 透传 / 显隐）一处维护；
- ⚠️ **可见行为变化（x-isolate / overlay）**：此前宿主手写 x-loading 会被引擎覆盖、hide 时删除，现在引擎不合成、不触碰——手写字面量 `"true"` 无翻转驱动会**常驻显示**，须由宿主自行控制；文档须显式标注；
- ⚠️ x-data 维持物种特例（响应式路径、无守卫）：对异步 x-data 宿主手写 x-loading 仍会被合成覆盖，现状不变、文档标注；
- **交付序列**：共享 helper → x-component（loading 选项 + 元键注入 + 守卫）→ x-html / x-isolate / overlay 接入 helper；配套单测 + 文档（x-component.md「平铺归一 / 失败呈现」节补 loading 选项与元键说明、x-isolate / overlay 手写守卫标注）+ demo。
