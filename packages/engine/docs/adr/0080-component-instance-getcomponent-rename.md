# ADR-0080：组件实例读取 API 与 getComponent 语义易主

- 状态：已采纳
- 日期：2026-10-03
- 关联：[ADR-0022](0022-x-component.md)（x-component 体系与 `getBlock`→`getComponent` 更名史、硬切惯例）、[ADR-0052](0052-x-overlay-and-x-dialog.md)（getOverlay 镜像组件查找协议）、[ADR-0054](0054-x-use-rename.md)（x-use → x-component）、[ADR-0057](0057-component-data-model-v2.md)（ComponentMethodContext 数据模型）

## 背景

「查找组件」一词长期承载两个混淆含义：

1. **查声明**——`getComponent(name)` 按 scope 链就近取 `x-define` 冻结快照（ADR-0022 确立的现行职责）；
2. **取实例**——组件被 `x-component` 实例化之后，外部脚本如何拿到这个**实例**（调 method、读写 data）——此前**无公开 API**，只能 `findScopeByEl` 抠内部 scope（`_data` 私有命名、字段布局入契约）。

grilling 八问拍板（Q1~Q8）：新增实例读取 API，且把短名 `getComponent` 让给实例——旧查声明职责两级同步更名 `getComponentDeclaration`。

## 决策

### 一、`engine.getComponent(el)` → `ComponentInstance` 门面

- **向上冒泡、就近即止**：任意元素沿 DOM parent 链向上找**最近的 `isComponent` scope**——嵌套组件的内部元素返回内层实例；元素在组件外（含 el 无 scope）返回 `undefined`。「这个按钮属于哪个组件实例」是自然问法，比「只认 x-component 宿主的精确匹配」宽容；
- **与组件内 `this` 同构**（核心卖点）：门面字段对齐 `ComponentMethodContext`——`el` / `name`（`scope.componentName`，compileChild 已有）/ `data`（`getContext()` 聚合视图，响应式可写）/ `props`（`data` 别名）/ `globalState`（无遮蔽全局通道）/ `methods`（经 `scope.getMethodThis()` 代理——与组件内 `this.inc()` 同一 this 绑定）/ `scope`（逃生舱，同 `this.scope`）。心智一句话：**实例就是组件外的 this**；
- **覆盖物边界**：冒泡对覆盖物实例天然无效——覆盖物渲染于 body 容器，触发按钮的 DOM 链通不到实例 scope。分工：内联组件 `getComponent(el)`、覆盖物 `engine.getOverlay(el, name)` → `OverlayHandle`。

### 二、查声明职责两级同步更名 `getComponentDeclaration`

- `scope.getComponent(name)` → `scope.getComponentDeclaration(name)`；`engine.getComponent(el, name)` → `engine.getComponentDeclaration(el, name)`；
- 全库统一「**`getComponent` = 实例、`getComponentDeclaration` = 声明**」，与文档两分（lookup.md「查找组件声明」/「获取组件实例」）严格镜像；
- **硬切无别名**（ADR-0022 同款惯例）：无运行时守卫、无弃用垫片——TS 消费者编译期即发现（`getComponentDeclaration` 缺参会直接类型报错）；测试与内部调用点同步替换。

### 三、文档

`docs/zh/guide/component/lookup.md` 重构为双章：既有全部内容归「查找组件声明」章；新增「获取组件实例」章（场景引入 → `getComponent(el)` 用法与冒泡语义 → 覆盖物分工 → 组件内 `this` 与事件通道顺带）。配 demo `component/instance.html`；`component/index.md`、`communication.md`、`scope.md` 交叉链接同步。

## 实现要点（防再踩）

1. **冒泡实现无反向索引**：沿 DOM parent 每层 `findScopeByEl`（O(深度 × scope 总数)）——页面脚本低频调用可接受，勿为它建 el→scope 全局索引（YAGNI）。engine 边界天然不越：`findScopeByEl` 只查本 `engine.scopes`，x-isolate 子引擎的 scope 查不到即止步；
2. **门面 `methods` 用 lazy getter**（首次访问才建 `getMethodThis()` 代理），`data` 直接暴露 `getContext()`——每次取门面都是现算，**不缓存实例列表**（引擎无实例注册表，勿引入）；
3. **`getOverlay` 不动**：它取的是声明快照 + 构建 OverlayHandle，协议未变，仅其镜像对象更名（内部 `scope.getComponent` 调用点随全局替换）；
4. **CONTEXT.md 已废弃区**登记旧签名（参照 `scope` 配置键硬切先例），活文档正文 `getComponent` 字样全部换新名（历史 ADR 正文保留旧称）。

## 被否决 / 演变的方案

- **单参重载分流**（`getComponent(el)` 实例 / `getComponent(el, name)` 声明）：语义靠参数个数区分，正是本轮要拆的混淆在 API 层复活，运行时无守卫；
- **仅 engine 级更名、scope 级不动**：省约 40 处机械替换，但造成两级同名异义（`engine.getComponent(el)` 拿实例、`this.scope.getComponent(name)` 拿声明），且 scope 经 `this.scope` 用户可达；
- **精确宿主匹配（不冒泡）**：querySelector 直达宿主虽可行，冒泡语义无歧义且覆盖「从组件内元素反查」场景，实现代价相同；
- **裸 scope 返回**：`_data` 私有命名入公开契约、二十余字段布局泄漏；
- **全功能句柄**（门面加 `destroy()` / `setProps()`）：无场景（YAGNI），需要时追加不破坏兼容。
