# ADR-0122：移除 x-fallback 指令（异步反馈收敛为元键 + x-loading + 条件渲染）

- **状态**：Accepted（grill-with-docs，三轮收敛）
- **日期**：2026-10-20
- **关联**：[ADR-0033](0033-x-data-async-source.md)（x-data 异步源——x-fallback 决策 4 被本 ADR 取代）、[ADR-0035](0035-x-html-async-source.md)（x-html 异步源——决策 1 / 3 / 6 被本 ADR 反转）、[ADR-0121](0121-remote-load-kernel-asyncloader.md)（远程加载内核——指出 x-fallback 同名词双语义）、[ADR-0034](0034-x-if-else-branch-chain.md)（x-if/else 链——替代方案的三态条件渲染载体）、[ADR-0010](0010-x-loading-actions-option.md)（x-loading progressbar 修饰符——手写接管通道）、[CONTEXT.md](../../CONTEXT.md)（「异步数据源」「异步 HTML 源」词条，「异步兜底 x-fallback」词条退役）

## 背景

x-fallback（ADR-0033 决策 4 / ADR-0035 决策 3）是异步源宿主的「特例子节点」兜底机制。落地后暴露出三处结构性问题：

1. **同名词双语义**（ADR-0121 已点出）：x-data 侧 fallback 是**编译子树**（可插值 `{{ $loading }}`、建 scope、detach 保活正常子树）；x-html 侧是**静态克隆**（不编译、`{{ }}` 显示原文、注入前移除）。同一指令属性两种语义，文档解释成本高、用户心智分裂；
2. **与 x-if/else 家族功能重叠**：fallback 本质是「按 `$loading`/`$error` 状态切换渲染分支」——这正是 x-if/x-else-if/x-else 的既有能力，x-fallback 是一条平行通道；
3. **x-html 无数据域的妥协产物**：ADR-0035 决策 3 当初选择「视觉通道完整、不注入元键」，导致 fallback 只能静态克隆（无元键可订阅）。元键缺位使「错误详情可插值」这一正当需求被迫走 action catch / x-data 中转的弯路。

用户裁决：彻底移除 x-fallback 指令，x-html 补注入元键，反馈通道统一收敛为「元键（数据通道）+ x-loading 合成（视觉通道）+ x-if/else 条件渲染（结构通道）」三件套。

## 决策

### 1. x-fallback 指令彻底移除

- 指令属性、compiler 剪枝 transformer、x-for 项模板跳过逻辑（x-for.ts）、物种指令的采集/同步/挂载/销毁代码全部删除；
- 文档（x-html.md / x-data.md / template-remote.md / comparison）与 demo（11 个）同步清理；
- 迁移路径：fallback 内容改写为 `x-if="$loading"` / `x-else-if="$error"` / `x-else` 三态条件块（文档提供 cookbook）。

### 2. x-html 注入 `$loading` / `$error` 元键（反转 ADR-0035 决策 3）

x-html 异步形态把元键注入**宿主 scope 的 localData**（普通对象域，非 `_data` 容器——x-html 无数据容器概念）：

- `$loading: boolean`——在途置 true，结果落地/失败置 false；
- `$error: Error | undefined`——失败时落地 Error 实例（`{{ $error.message }}` 可读），新一轮请求发起时清空；
- 注入后经 scope 链天然对子树可见（`x-text="$error.message"` / `x-if="$loading"` 直读），无需 watch 内部状态；
- 同步形态（表达式通道）不注入——与 x-data「不制造同步加载态假象」同构。

### 3. x-html 默认 loading 合成维持 overlay 形态

- 不再检测骨架内容（原「有 x-fallback 则不合成」互斥默认随 x-fallback 一并移除）；
- 默认合成 `x-loading="true"` 字面量切换（ADR-0035 决策 3 机制不变）；
- 用户写骨架屏时显式 `x-html-options="{loading:false}"` 关闭默认 overlay，自行用 `x-if="$loading"` 渲染骨架；或手写 `x-loading.progressbar` 等修饰符接管（宿主已有 x-loading 属性时不合成——既有规则不变）。

### 4. 双异步（异步 x-data + 异步 x-html 同元素）：反馈通道归 x-html 独占（反转 ADR-0035 决策 6）

- **x-html 独占视觉通道**：合成 x-loading overlay（双异步时 x-data 不再合成 overlay，显式声明 loading 也忽略并 warn）；
- **x-data 保留元键写入**（B 方案）：`$loading`/`$error` 仍写入数据容器（数据通道可观测性保留，用户可 `x-text="$loading"` 读），但不合成 overlay；
- x-html 的元键写入宿主 localData，与 x-data 的容器元键不冲突（两个 scope 层：localData 优先命中，读 `$loading` 得 x-html 侧状态——模板就近语义）。

### 5. x-data 移除 fallback 机制（含 detach 保活正常子树）

- `fallbackTpls` / `fallbackLive` / `stashedNodes` / `collectFallback` / `syncFallback` / `activateFallback` / `deactivateFallback` 全部删除；
- x-loading 合成的「有 fallback 不合成」互斥默认移除——只要未显式 `loading:false` 且宿主无手写 x-loading 即合成；
- 用户改用 `$loading`/`$error` + x-if/x-else-if/x-else 三态条件渲染（文档 cookbook）：
  - 首载占位：`x-if="$loading"` 渲染骨架；
  - 失败态：`x-else-if="$error"` 渲染错误块（`{{ $error.message }}` 可插值）；
  - 就绪态：`x-else` 渲染正常内容；
  - 保旧值语义（Q11 裁决保留）改由用户显式表达：`x-if="$loading && !data"` 或维持旧内容不包条件块。

### 6. 编译器与工具层清理

- compiler.ts：x-fallback 前置 transformer 删除（剪枝 + 孤立 warn）；
- x-for.ts：项模板克隆时的 x-fallback 跳过逻辑删除（指令已不存在，无需跳过）；
- async-source-utils.ts：头部注释清理（移除 x-fallback 编排引用）；
- `getDirectiveAttrValue` 辅助函数随唯一消费方（x-fallback transformer）一并删除。

## 被否决的方案

- **保留 x-fallback 但统一语义为编译版**：x-html 侧补编译版 fallback 仍与 x-if/else 功能重叠，且引入「x-html 宿主 template 子节点被编译两次」的新风险面——不如直接收敛到 x-if/else；
- **保留 x-fallback 但统一语义为静态版**：x-data 侧损失「fallback 插值 `$error.message`」的正当表达力，且静态版在 x-data 侧同样与 x-if/else 重叠——退一步的方案不值得保留；
- **x-html 注入元键到 `_data` 容器**：x-html 是绑定指令，越界持有数据容器（ADR-0035 决策 3 当初的核心顾虑）；localData 是普通对象域，注入即停，无容器生命周期/回收负担；
- **双异步归 x-data 独占（维持 ADR-0035 决策 6）**：x-data 已负责数据通道，再叠加视觉通道使指令过重；x-html 本就是视觉指令（innerHTML 注入），反馈归它更贴职责；
- **双异步 x-data 完全不写元键**：损失数据通道可观测性（用户无法 `x-text="$loading"` 读 x-data 在途状态），且与 x-data 单异步的元键语义产生分支差异——保留元键、仅让出 overlay 合成，语义更平滑。

## 后果

- ✅ 异步反馈心智模型统一：元键（数据）+ x-loading（视觉）+ x-if/else（结构）三件套，跨 x-data / x-html 通用；
- ✅ x-fallback 同名词双语义消除；x-html 错误详情可插值（`{{ $error.message }}`）不再绕弯路；
- ✅ 指令表减一（x-fallback 退役），compiler transformer 减一，x-for 项克隆逻辑减一处特判；
- ⚠️ **破坏性变更**：存量 x-fallback 用法的模板静默失效（子节点当普通元素渲染），须迁移到 x-if/else 三态；发版说明须显式标注；
- ⚠️ x-data 首载期正常子树不再 detach 保活——首载 pending 期间子树会渲染出 `{{ }}` 未填充态（`x-text="msg"` 显示空串），用户须自行 `x-if="$loading"` 包裹；文档 cookbook 须明确说明这一行为变化；
- **交付**：ADR（本文）+ ADR-0033/0035 修订 + CONTEXT.md 术语更新 + 源码（x-html.ts / x-data.ts / compiler.ts / x-for.ts / async-source-utils.ts）+ 测试改写 + 文档（x-html.md / x-data.md / template-remote.md / comparison）+ demo 11 个。
