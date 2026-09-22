# 任务：x-overlay 组件化统一重构（共识 v2，待实施）

> 2026-09-22 grilling 会话定稿。全部 14 条决策已确认，**实施未开始**。恢复实施时以本文档为唯一蓝图。

## 任务一句话

重构 x-overlay / x-dialog：覆盖物不再是独立声明指令，而是「**任意组件被渲染到 body 容器的消费方式**」；`OverlayDirective` 继承 `UseDirective` 作为消费侧公共基座，`x-dialog` 是其模态形态薄子类。

## 共识 v2（14 条）

1. **声明侧无专用指令**：覆盖物内容 = 任意组件（`x-component` 声明 / `options.components` 全局注册 / `x-import` 加载）；删除 `x-overlay` 声明语法、`.global` 修饰符、`engine._globalOverlays` 全局表。
2. **`OverlayDirective extends UseDirective`**：抽象基座，不注册 `presetDirectives`（模板无 `x-overlay` 语法）；继承组件实例化全套——`getComponent` 查找、`instantiateComponent` 管道、props 注入、`_waitForComponent`（等待 x-import）、递归深度防护。
3. **子类仅覆盖三处**：值语义（visible 驱动 vs 组件名）、实例化时机（visible 触发 vs 编译期一次）、目的地（body 容器 vs 宿主原地化身，跳过 `_mergeHostAttrs`）。
4. **消费形态薄子类**：`DialogDirective extends OverlayDirective` 仅叠加模态形态（遮罩、`closeOnMask`、居中默认）；`x-drawer` / `x-popup` / `x-popover` 为未来薄子类（fast-follow）。
5. **singleton 暂不引入**：每次 open 新实例、关闭动画播完即销毁（设计储备见下节）。
6. **配置三级链**：`内置默认（基座） < x-dialog-options < 值对象内联`（声明处配置层随声明指令消失；组件 def 不携带 options，无承载物）。
7. **props 统一**（x-use 约定）：值对象 / 命令式 options 的**非保留键全部作 props** 注入组件 data 域（覆盖 `data()` 默认）；`params` 键删除；保留键封闭清单 = `visible` + `closeOnMask` / `animate` / `anchor` / `scope`（撞保留键的风险由封闭清单文档化）。
8. **scope 基准统一 ADR-0053 `ComponentDataBasis`**：默认 `'declarer'`（定义闭包，免费获得悬空守卫 + 全局组件退化封闭）、可选 `'host'`（消费处）；`'consumer'` 更名废弃。
9. **type 彻底删除**：def 字段、事件 payload、校验 warn、文档全清；事件 payload 收窄 `{name, instance, scope}`。
10. **命令式对齐**：`engine.getOverlay(el, name, options?)` 镜像 `getComponent` 协议——`el` 起 scope 链查找（就近覆盖）+ `options.components` 兜底，省略 `el` 仅查全局；`options.scope` 元素仍为数据视图基准。
11. **全库术语「覆盖物」**：文档 / CONTEXT.md / 代码注释 / ADR 统一；英文标识符（`autospark-overlays`、事件名 `overlay:open/close`）不动。
12. **文档**：指南组新增「覆盖物」概念页（消费模型 + 消费者家族对比 + 公共机制契约）；`x-dialog.md` 收窄为模态形态页；sidebar 指南组 +覆盖物、指令组删 x-overlay 条目。
13. **决策记录**：修订 ADR-0052（相关决策改写 + 文末修订记录小节）+ 回链 ADR-0053（数据基准）；CONTEXT.md 词条重塑（「覆盖层定义」删除，「覆盖物实例」「覆盖物消费者」修订， Avoid 列表同步）。
14. **迁移面**：compiler 删 `_collectOverlay` / scope 删 `overlays` 字段与 `getOverlay` / engine `getOverlay` 重写、删全局表 / overlay.ts 重写为 UseDirective 子类 / dialog.ts 收缩为形态子类 / handle / presets / types；demo 3+12 个改写（声明改 `x-component`、params demo 改 props、singleton demo 删改）；测试对应重构。

## singleton 设计储备（将来引入时直接采用，勿重新推演）

- **场景**：多消费点驱动同一覆盖物（如侧边栏与顶栏两个按钮开同一登录框）→ 关闭只回写触发者，其余驱动源残留 `true` 脏状态（watcher 值不变不重开，行为无碍但违背「状态唯一真相源」）。
- **方案**：per-def 共享槽 + **open 幂等**（已显示时 no-op + props 重注入）+ **close 全量回写**（实例登记全部活跃驱动源回写点，任何触点触发关闭时全部可回写路径统一置 `false`；表达式源不可回写照旧仅收 UI）。
- **槽粒度**：per-def（v1 仅 dialog 一个消费者类时与 per-(def, 指令类) 物理等价）；跨形态共享边界（dialog + drawer 同消费一组件、形态配置互相覆盖）等 `x-drawer` 落地时再定是否分槽（届时槽键加一维即可，机制不变）。

## 关键事实核查结论（实施时直接引用）

- `instantiateComponent(hostScope, snapshot, def, props?, basis?)` 注释明说 `basis` 缺省路径「供 overlay 等非 x-use 路径」（`src/compile/compiler.ts` ~917）——**继承预留已存在**。
- 组件 def 不携带声明处 options（`x-component-options` 不存在，`collect.ts` 无收集）→ 配置只能走消费处（共识 6 的依据）。
- x-use 既有能力：值字符串 = 组件名 / 对象 = `{name|is|component, ...props}`（非保留键全作 props）、`_updateProps` 响应式 props、`MAX_DEPTH` 递归防护、`_waitForComponent` 等待组件就绪。
- `engine.getComponent(el, name)` 已是「el 起 scope 链查找 + 全局兜底」协议（共识 10 的镜像源）。
- ⚠️ 现状代码是旧模型（`x-overlay` 声明指令 + `type` + `params`）——实施是**按共识重写**，非增量微调。
