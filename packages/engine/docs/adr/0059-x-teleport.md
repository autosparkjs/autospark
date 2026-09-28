# ADR-0059：x-teleport 传送（ownsChildren 延迟编译 + dataContext 基准）

- **状态**：Accepted
- **日期**：2026-09-28
- **关联**：[ADR-0001](0001-directive-kind-system.md)（指令类别与 ownsChildren）、[ADR-0002](0002-engine-patch.md)（patch 动态区域守卫）、[ADR-0007](0007-directive-options-and-modifiers.md)（配置体系：`.host` 修饰符 ≡ 布尔选项）、[ADR-0037](0037-x-switch.md)（BranchHost 锚点注释共享基建）、[ADR-0039](0039-animate-mechanism.md)（动画挂点预留，v1 不接入）、[ADR-0052](0052-x-overlay-and-x-dialog.md) / [ADR-0053](0053-component-data-boundary.md)（dataContext 基准家族与 `addExtraRoot` 观察根先例）、[CONTEXT.md](../../CONTEXT.md)（传送词条）
- **共识来源**：grilling 三轮决策（值语义、架构路线、dataContext 语义、失败降级、组合矩阵、keepalive 防线、animate 取舍），本文即共识落盘

## 背景

x-teleport 为规划中指令（占位空壳 + 文档预告）。目标：把元素**一次性**渲染到 DOM 树其他位置——脱离声明父级，挂到指定目标下（弹窗逃逸 `overflow:hidden`、渲染到 `body` 等）。

核心矛盾在架构路线：**搬移（DOM 操作）与绑定（响应式订阅）的时序解耦**。查询目标必须 defer 到结果树挂载后（编译期查询会命中尚未替换的旧模板树）；而「数据上下文跟随挂载点」（`dataContext:'host'`）要求子树绑定在**上下文确定之后**才建立——纯编译期搬移路线（子树照常编译，事后换 scope 挂链）无法做到：简单路径的精准订阅在编译期已按声明处上下文解析为绝对路径，事后重挂 scope 链不重解析，with 求值与精准订阅将读到两个上下文。

## 决策

### 一、架构路线：接管子树 + 延迟编译（否决纯搬移）

x-teleport 为 **Compile 指令、`ownsChildren=true`**：编译期剪枝子树（模板只读契约），结果树挂载后的微任务（`engine.scheduler.schedule`，x-if 首渲 defer 先例）完成「解析目标 → 校验 → 原位锚点注释 → 搬移宿主 → 按基准确定上下文 → 编译子树」。

- ✅ `dataContext` 两值真正生效（编译发生在上下文确定之后）；
- ✅ ownsChildren 自动纳入 `engine.patch` 动态区域守卫（判定按 ownsChildren 动态推导，零额外代码）；
- ✅ 一次性搬移语义下无 observer 通道需求（Compile 足够）；
- ❌ 代价：与其他 ownsChildren 结构指令同元素互斥（见决策六组合矩阵）。

否决的纯搬移路线（不接管子树、绑定照常编译）：与 x-for/eager x-if 等自由组合，但 `dataContext:'host'` 在响应式订阅模型下无法自洽（见背景）。

### 二、值语义：静态字面量，严格对齐 queryRelElement

值为**目标选择器静态字面量**——编译期不求值、不 watch、无表达式/两栖形态（`body` 是合法 JS 标识符，两栖分派会被状态键误读；运行时换挂载点属罕见场景）。解析统一走 `queryRelElement(宿主元素, 值)`，四形态：

| 写法 | 含义 |
|---|---|
| `/.foo` | 全局（`document.querySelector`）——主场景 `/.body`、`/#modal` |
| `../.foo`（可叠加） | 宿主父级内部 query |
| `.foo` | 宿主内部 query |
| `^form` | closest 上爬（含 `^../` 起点上爬） |

预告文档中「裸选择器=全局」「`./<sel>`=父元素下」两处与 `queryRelElement` 现状冲突，按工具现状修正文档（文档跟随事实，不为单指令定制公共工具语义）。

### 三、dataContext：同名同语义的基准家族新成员

`x-teleport-options="{dataContext:'host'}"`；修饰符 `.host` ≡ `{host:true}` 归一 `dataContext:'host'`（`.open` 修饰符先例）；标准 `getOption` 回退链（指令选项 → 宿主选项）。

- **`declarer`（默认）**：声明处上下文——宿主 scope 保持编译期 parent 链，DOM 移走、数据视图不动；
- **`host`**：挂载点上下文——搬移后 `findScopeByEl(目标)` 重挂宿主 scope 的 parent 到目标所属 scope（**重挂发生在子树编译之前**，精准订阅按新链解析——延迟编译路线的红利）；目标在 engine 树外（如 `/.body` 直挂）无所属 scope → **rootless 全局视图**（仅全局 state，对齐 overlay 命令式缺省的防御姿态，不抛错）；
- 无效值 warn + 按 `declarer` 处理。

不直接复用 `resolveDataContext`（其 declarer 载体是 `ComponentDef.declarerScope`，x-teleport 无组件定义），实现轻量版解析。

### 四、执行时序与失败降级

微任务流程：解析目标 → 三类校验（均 **warn + 原地渲染**，等效未写指令，子树照常在原位编译）：

1. **未命中 / 非法选择器**（`queryRelElement` 返回 null）；
2. **环 / 自引用**（目标 === 宿主或落入宿主子树内，appendChild 将抛 HierarchyRequestError）；
3. **目标断连**（`!target.isConnected`，如目标在 x-if 假分支已被摘除）。

校验通过：原位插入**锚点注释**（BranchHost 同款 DOM 书签，与 x-if 家族心智一致）→ 搬移宿主（appendChild 追加，多宿主声明序 = 文档序）→ 按基准施加上下文 → 编译子树 → 目标在 engine 树外时 `dispatcher.addExtraRoot(宿主)`（overlay 先例：engine 外的 Runtime 指令默认在 observer 视野外）。

**不追踪**：目标后续被移除 → 宿主成 detached 孤儿，不监听不回收（文档声明）；嵌套 x-teleport 允许（内层搬移在外层子树编译后执行，以内层为准）。`destroy()` 摘除传送 DOM + 移除额外观察根（engine destroy / 祖先 scope 销毁防残留）。

### 五、与 x-dialog 的分工（不互为实现）

x-dialog（overlay 家族）**不复用** x-teleport：内容来源（组件实例化 vs 声明处宿主子树）、生命周期（运行时反复开关多实例 vs 编译期一次性）、目标管理（专用容器 + 打开栈 vs 任意选择器）三维根本不同；强行复用等于把静态机制动态化。反向基建复用成立：`compileChild`、`findScopeByEl`、`onScopeDestroyed`、`addExtraRoot` 均自 overlay 路径共享。x-teleport 覆盖「无遮罩/无栈管理的静态轻量弹层」场景，x-dialog 不被取代。

### 六、组合矩阵

| 同元素组合 | 裁决 |
|---|---|
| `x-show` | ✅ 支持——display 正交于位置；x-show 自身 animate 在传送后照常生效（优于外层包裹：动画播在 body 可见处） |
| `x-for` / `x-component` / `x-isolate` / eager `x-switch` / `x-tree` | ⚠️ warn + 放弃传送、照常原地渲染（子树仍由 x-teleport 延迟编译；x-component U3 让位先例，先于 compiler 多 owner 抛错自检） |
| eager `x-if` | ⚠️ warn + 拒绝传送；外层包裹 `<div x-if="show"><div x-teleport="/.target">` 为等价写法（销毁重建语义一致） |
| `x-if.keepalive` | ⚠️ warn + 拒绝传送——障碍非重复搬移，是 **reattach 插回位置所有权**（BranchHost 把宿主插回原位锚点而非传送目标，宿主滞留原位） |
| 祖先链含 keepalive `x-if` | ⚠️ 编译期 warn——keepalive 摘外层宿主时传送内容物理在目标下不受影响，「已隐藏」内容残留可见；DOM 断链无事件可感知，只能编译期检测 |
| `x-else-if` / `x-case` 分支根 | 既有「分支根禁结构指令」防线 warn 跳过，不特判放行 |

### 七、animate v1 不接入（YAGNI）

ADR-0039 挂点结构保留。x-teleport 是一次性静态传送，无反复挂卸驱动动画叙事；离场动画与祖先销毁的叠加时序（延迟摘除、与外层 x-if animate 叠加）是真实复杂度。显隐动画需求由同元素 `x-show` 的 animate 承担。

## 测试

`src/__tests__/x-teleport.test.ts`：四形态解析、传送与原位锚点、三类失败降级、dataContext 双基准 + rootless 降级、组合矩阵逐行、嵌套传送、destroy 清理、patch 动态区域拒绝。

## 废止

- 无。预告文档「无独立指令选项与修饰符」的说法随本 ADR 失效（新增 dataContext 选项与 `.host` 修饰符）。
