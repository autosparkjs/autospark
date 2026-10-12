# ADR-0105：viewport 全局视口特性——`$` 元状态容器与 x-container 重写

- 状态：已采纳（2026-10-12 两轮 grilling 共识落盘，实施随本 ADR 进行）
- 日期：2026-10-12
- 关联：ADR-0101（x-container——决策 1/5/8 由本 ADR 取代）、ADR-0029（$scopes 保留键先例）、
  ADR-0072（$notifications 保留键第二例）、ADR-0007（选项回退链——整表替换沿用）、
  ADR-0044（store 自建——多 engine 共享 store 不存在，META 标记为防御性保留）

## 背景

ADR-0101 落地后，断点档位判定内嵌于 x-container：每实例自建按档 mql 监听、实例级自定义
断点表（三级回退）、档名写回 + `viewport:change` 事件。「模板逻辑感知当前档位」的实际
需求不限于容器宿主——任意元素、任意表达式都应能直接监听视口档位；且档位判定是**全局
事实**，实例级自定义阈值表与全局档位语义天然打架（A 容器按自定义表判在 md 档、全局状态
却是 lg）。本 ADR 把档位判定收归全局 viewport 特性，真相写入 `store.state.$.viewport`；
x-container 收窄为纯视觉容器（创建响应式容器——只消费全局档位）。

## 决策

### 1. `$` 元状态容器（META_KEY = "$"）

`state.$` 是**引擎内部状态的元容器**（consts.ts 第三例保留键）：框架私有的响应式数据根，
视口档位（`$.viewport`）是首个居民，后续引擎内部数据逐步迁入。与 `$scopes` / `$notifications`
（各自独立的顶层保留键）**并存**，旧键迁移另立课题（YAGNI——收编牵动 x-data mount 路径
契约，无本期收益）。

**严格保留键语义**：用户 state 顶层注入 `$` → 构造期 warn + delete + 引擎重建。框架注入
对象挂 Symbol 标记（META_MARK，LOCAL_PATHS 同法经代理可读）——检测有标记即复用，不 warn
不删（防御性保留：ADR-0044 后 store 恒自建、共享场景已不存在，但标记成本仅一个 Symbol，
防未来恢复借用形态时误删框架所有物）。

### 2. ViewportManager：每 engine 一例，状态真相 `$.viewport`

`src/features/viewport/`（types + manager），engine 构造期装配（对齐 TooltipManager /
NotificationManager 惯例）。**否决进程级单例**：按档 5 个 mql 是浏览器原生对象、每 engine
份开销可忽略，单例反引入共享可变状态与多配置冲突（KISS）。

职责链：构造期**同步**求值当前档并写入 `state.$.viewport`（消灭首渲染空档——对齐 ADR-0101
决策 7 精神）→ 按档 mql 监听（单档 change 触发全量重读，一次跨多档由全量重读兜住）→ 跨档
经 store 响应式写入。**只读约定**：`$.viewport` 是测量真相，外部写不解释、下次跨档自然
覆盖（不建 setter 拦截）；域内 `x-data="{ $: ... }"` 遮蔽全局读按保留键约定文档声明，
不做运行时特判。

### 3. 根元素暴露：`data-viewport`

ViewportManager 常驻写 engine 根元素 `data-viewport="<档名>"`（构造期初值、跨档即改、
destroy 摘除）。**纯暴露面**——CSS 属性选择器钩子（`[data-viewport=md] .sidebar{...}`）、
测试断言与调试可见；不承担 x-container 视觉约束（那走 media query）。与 x-container 宿主
的 `data-breakpoint`（实例档位）两级并存、命名区分。

### 4. 配置三态：`options.viewport`

- 缺省：默认开启 + 内置 Bootstrap 5 断点表；
- `false`：**整体关闭**——不建 mql、不写 `$.viewport`、不挂 `data-viewport`（对齐
  `tooltip: false` 先例；x-container 的 media 视觉与 JS 无关、照常生效，
  `data-breakpoint` 停留未写入）；
- `{ breakpoints?, maxWidths? }`：`breakpoints` 是 **engine 级唯一阈值真相**（
  ViewportManager 判定与 x-container media 样式同源消费），`maxWidths` 为 x-container
  的 engine 级兜底表。校验语义沿 ADR-0101（xs / 未知档名 / 非 px warn + 忽略、整表无
  有效项回退内置 + warn）。构造期配置语义：运行时突变不生效（options 家族纪律）。

**否决实例级 breakpoints**（ADR-0101 决策 5 的 breakpoints 支路废除）：保留则实例自定义
表与全局 `$.viewport` 档位语义矛盾，「全局性」名存实亡。

### 5. x-container 重写：创建响应式容器

- **保留**：基础契约类装配、`.fluid` 修饰符、`data-breakpoint` 常驻（值源改为
  `scope.watch("$.viewport")`）、`maxWidths` 回退链（实例 `x-container-options` / 宿主
  `x-options` → `options.viewport.maxWidths` → 内置表）与内容指纹 scoped style 机制
  （指纹输入收窄为「engine 生效阈值表 × 实例 maxWidths」，等值内置表时共享全局样式）；
- **删除**：值双态写回、`viewport:change` 事件族（`_dispatchChange` / `_eachDownwardListener`）、
  实例 mql 监听、实例级 `breakpoints`、`options.container` 键、`ContainerGlobalOptions`
  类型——档位写回与事件被 `$.viewport` 响应式订阅同位替代（x-show / 插值 / watch /
  x-effect 全通；`from`/`to` 由消费方自行记忆旧值，YAGNI）；
- **视觉保留 media query**（ADR-0101 决策 4 论证依旧成立：零 JS 布局开销；阈值统一后
  JS/CSS 双通道的不一致风险已消失）：默认表全局一份样式、指纹表 scoped 一份。

### 6. 类型迁移与命名

档位类型/常量迁 `features/viewport/types.ts` 更名 `ViewportTier` / `VIEWPORT_TIERS` /
`DEFAULT_VIEWPORT_BREAKPOINTS`（+ `DEFAULT_VIEWPORT_MAX_WIDTHS`），x-container 改引用、
不留旧名别名（monorepo 内部类型非公共 API 面，一次切干净）。阈值归一
`resolveViewportBreakpoints` 归 viewport 特性；maxWidths 归一留 x-container。
不建 `engine.viewport` 命令式 API（读走 `$.viewport`、配置走构造 options）。

### 7. 生命周期与边界

`destroy()`：反注册 mql + 摘根元素 `data-viewport`；`$.viewport` **残留**（对齐 `$scopes`：
destroy 不清保留键）。`stop()` 不停 viewport（store 活着、状态继续真）。不支持 SSR
（无 matchMedia 环境 warn 一次、状态不可用）。

## 后果

- 实施落盘物：`src/features/viewport/`（types + manager）+ `consts.ts`（META_KEY /
  META_MARK）+ `engine.ts` 装配 + `types/index.ts`（`options.container` → `options.viewport`）
  + `x-container.ts` 重写 + `src/__tests__/features/viewport.test.ts` 新增 +
  `x-container.test.ts` 重写 + 指南（viewport 特性页 + x-container.md 重写）+ demo 迁移 +
  CONTEXT.md 词条 + 本 ADR + ADR-0101 修订记录；
- 模板侧档位联动写法变更：`x-container="path"` 写回 / `@viewport:change` → `$.viewport`
  表达式订阅（如 `x-show="$viewport==='md'"`）；
- happy-dom 测试通道沿 ADR-0101 手法：可控 matchMedia 桩（宽度改值 + 手动触发监听），
  断言面只落标量与属性标记。

## 修订记录

（暂无）
