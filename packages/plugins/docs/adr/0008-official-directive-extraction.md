# ADR-0008: 官方指令/特性插件迁移（engine 核心集缩核执行侧）

- 状态：已接受（Accepted，2026-10-29）
- 日期：2026-10-29
- 关联：engine ADR-0128（决策主册——核心集定界、ForRenderStrategy 扩展点、overlay/tooltip 处置）；本包 ADR-0003（零静态依赖纪律与目录契约）、ADR-0004（vite 闭包构建）、ADR-0007（x-ripple/x-spin 拆分——产物级内联重复先例）；engine ADR-0111/0114（插件机制/预加载队列）、ADR-0041/0042（virtual/paging 策略语义平移）

## 背景

engine ADR-0128 定界核心指令集（约 22 名位）并将应用级构造块外移本包。本 ADR 记录迁移执行侧的产物原则与工程契约：七 个新产物、同类域组合粒度、运行时桥消费清单、渐进增强依赖模式。经 grilling 多轮收敛（家族粒度 → 一指令一产物 → **同类组合避免产物重复**为终稿）。

## 决策

### 决策 1：七产物清单与同类域组合粒度

| 产物 | 内容 | 源码行数 | 形态 |
|---|---|---|---|
| `autospark.tree.js` | x-tree | 1,431 | 指令插件 |
| `autospark.layout.js` | layout + pane（名位原子组，pane 无独立语义）/ splitter / expandable / resizable / container / viewport | 4,098 | 指令插件（域组合） |
| `autospark.version.js` | x-version（订阅核心 `$.version`） | 300 | 指令插件 |
| `autospark.overlay.js` | dialog / popover / drawer / foldable + overlay 机制主体（instance/anchor/contentHost/handle/registry/stack/wrappers + 基座 + visible-overlay） | 4,690 | 指令插件（域组合） |
| `autospark.virtual.js` | x-for `.virtual` 渲染策略 | ~400 | 策略插件 |
| `autospark.paging.js` | x-for `.paging` 渲染策略 | ~350 | 策略插件 |
| `autospark.tooltip.js` | tooltip 特性（manager/container/styles/types） | 797 | 特性插件 |

**粒度原则（终稿）**：同类域组合——**产物内共享、产物间零重复**。x-pane 随 layout（孤儿 warn 名位，拆开无意义）；foldable 随 overlay（对 popover 为运行时硬依赖——`scope.directives.find` 查找指令实例，同产物即自包含，原退化语义问题消解）；ResizeSession 于 layout 产物内单份（resizable 定义、expandable 复用）；overlay 机制于 overlay 产物内单份。

### 决策 2：产物级内联重复的量级边界（ADR-0007 先例放宽）

ADR-0007 确立「共享逻辑源码共享、产物各自内联」先例，量级为 decorate（gzip < 1kB）。本决策明确放宽边界：**纯函数工具（sanitize / floating / injectStylesheet / relaxedToJson 等 utils）与无状态核心（如未来可能出现的跨域小工具）允许跨产物复制，单处上限约 300 行级（ResizeSession 量级）**；有状态机制/领域语义代码（overlay 机制、animate 解析）禁止跨产物复制，一律走运行时桥消费核心公开面。

### 决策 3：运行时命名空间消费契约（零静态依赖纪律不变）

本包对 autospark 的依赖**全部运行时解析**（ADR-0003 实操守则不变，产物仅 IIFE）。本次迁移的消费清单：

- `AutoSparkDirectiveBase`（已有公开）——指令类经 `nsMember("AutoSparkDirectiveBase")` 取基类后 extends（类重载注册 `$.directive(name, Cls)`）；
- `resolveAnimate`（**engine 补公开导出**，ADR-0128 决策 5）——overlay 家族与 tooltip 消费；
- `getOverlayContainer`（已有公开）——overlay 产物容器宿主 + tooltip 渐进监听；
- `$.viewport` / `$.version` 公开状态路径——layout/version 产物运行时订阅（状态源留核心）；
- ForRenderStrategy 注册面（engine 新扩展点）——virtual/paging 产物注册策略。

### 决策 4：渐进增强——跨产物弱依赖统一模式

跨产物弱依赖（未来 drawer 把手组合 expandable 等）一律走**注册表检测**：安装器回调内查询对方指令/特性是否已注册，已注册则启用增强能力，缺席则静默不启用（无把手、不 warn）。硬依赖（foldable→popover）以同产物组合消解，不走渐进增强。

### 决策 5：聚合产物与全家桶语义

聚合产物 `autospark.plugins.js` 扩至 11 插件（现有 4 + 新 7），为「一个标签等价旧行为」的全家桶兜底（engine ADR-0128 决策 6 的发行侧承接）。聚合构建内共享代码只打一份（vite 同 bundle 去重，现状已然）。

### 决策 6：自举与注册通道

- 指令插件：模块加载即 `bootstrap`（双路径注册，ADR-0114）→ `AutoSpark.directive(name, Cls)` 类重载；
- 策略插件：同一自举通道 → ForRenderStrategy 注册面；
- 特性插件（tooltip）：同一自举通道 → 特性注册（engine.tooltip 薄壳 getter 委托；title→data-tooltip 编译期转换的开关查询，语义见 engine ADR-0128 决策 4）。

## 备选方案

- **一指令一产物**（14 产物）：否决——overlay 机制三份内联（约 2,000 行 × 3）违反零重复原则；同类域组合为终稿。
- **overlay 机制独立共享产物**（库产物形态）：否决——引入「库产物」新心智，破坏一域一产物对称性。
- **engine 转导出插件**（ESM 消费者补装通道）：否决——依赖倒灌（engine 依赖 plugins），ADR-0003 纪律崩塌。
- **virtual/paging 合并单产物**：两策略间零共享代码，分立无重复成本，尊重既有命名决策（`autospark.virtual.js` / `autospark.paging.js`）。

## 后果

- 产物清单 CLOSURE_ARTIFACTS 扩至 11 条（+聚合），dist 与 docs/public 同步复制；
- engine `__tests__` 对应目录迁本包 `__tests__`；docs/demos 对应目录迁移；本包 vite demo 增补指令/策略插件示例；
- 源码目录：`src/plugins/<name>/` 自包含（tree / layout / version / overlay / virtual / paging / tooltip），overlay 机制子目录随 overlay 插件内聚；
- CONTEXT.md（本包新建）：外移指令词条迁入 + 新增词条「指令插件」「策略插件」「选择性引入」（「按需加载」列入 Avoid）；
- 深相对导入全部重写：运行时桥（nsMember）+ utils 复制——x-for 级源码不迁移（本体留 engine），仅策略段抽出，漂移风险集中于迁移期一次;
- 第二批遗留（本 ADR 不覆盖）：form/field、icon/icons（编译期插件形态）、tooltip 编译期转换实现路径两候选的定夺。
