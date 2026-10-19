# ADR-0119：覆盖物 keepalive / key 缓存身份 / url 远程加载

- 状态：已接受（2026-10-19）
- 关联：扩展 ADR-0052 修订版（覆盖物组件化消费模型）、复用 ADR-0062（shell 机制）、ADR-0039（动画时序）、ADR-0022 决策六（x-import 远程管线）；ADR-0018 内置 error 组件

## 背景

覆盖物关闭即销毁（ADR-0052 修订共识 5）。高频重开场景（表单向导、多步配置）每次重开都要重建 DOM、丢用户输入；多标签页签切换需要同名覆盖物的多份并存；远程内容（片段/组件）目前只能经 x-import 预加载后按名消费，无「打开时按需加载」的通道。

## 决策

### 决策 1：keepalive——整实例挂起，声明式专属

`keepalive: true` 时，close 的 leave 动画播完后**不销毁**，改为容器内 `display:none` 隐藏（router keepAlive 同款语义，非摘除）：DOM、instanceScope/shellScope、watcher 全存活。重开走恢复路径：props 浅合并（仅出现的键 `Object.assign`）→ 重新 `_show()`（定位 + enter 动画 + 入栈 + 广播 open）。

关闭语义零变化：visible 回写、`overlay:close` 广播、ESC/遮罩/close action 三触点照常。

通道：
- 正典：`x-dialog-options="{keepalive: true}"`（或成员表达式 `x-dialog-options.keepalive="表达式"`）；
- 修饰符糖：`x-dialog:name.keepalive`——解析器把 modifier 注入为同名选项（ADR-0007：无参开关等价 `options[name] = true`，显式选项优先），经配置合并链自动生效，**无需指令层特判**。组件名取 attr 段，天然不含修饰符段。

**声明式专属**：命令式通道（`getOverlay(...).open({keepalive: true})`）不生效并 warn——命令式句柄无缓存归属方（无 destroy 钩子），挂起实例会孤儿化。实现上实例挂起语义以 `cacheKey` 注入为准（仅声明式构造时注入）。

回收点：宿主指令 destroy → 销毁其全部挂起实例（含打开中/关闭动画中）；`engine.destroy` 全回收。v1 无 LRU、无手动 clearCache API。

### 决策 2：key——保活缓存命名空间

`key`（表达式）参与缓存身份：**`组件名 + key + url` 复合键**（`buildOverlayCacheKey`）。同键且有存活挂起实例 → 复用（防重复堆叠，open 对已可见实例 no-op）；不同键 → 各自独立实例并存。

- key 每次打开求值一次（不 watch 热切换——key 变化即新缓存身份，下次打开生效）；
- 无 key → 键 = `组件名::`（单实例位）；
- key 对非 keepalive 路径不生效（无缓存），仅参与事件 payload；
- `OverlayEventDetail` 增可选 `key` 字段（`overlay:open`/`overlay:close` 双通道广播 payload 均携带）。

### 决策 3：url 远程加载——组件优先、片段兜底（双路径并存）

`config.url` 声明后，组件未注册时打开走远程路径：**面板先开**（shell + 内容出口占位锚 + 面板挂 `x-loading`），异步加载完成后原位附加内容、摘 `x-loading`。

加载经 x-import 管线（`importComponentsFromUrl`：fetch + 解析 + 组件注册 + url 缓存 + 循环引用防护），注册到消费处 scope（`this.binding.parent`，x-import 同款）。随后按内容分流：

- **组件优先**：远程声明了匹配名 `x-define` → 组件路径（`attachRemote`：编译组件实例原位换入、接管 snapshot/def/instanceScope 身份——此后与本地构建实例完全同权；出口清单就绪后分段插槽投影）；
- **片段兜底**：无匹配名声明 → 原始 HTML 作为**子模板编译**进面板出口（`attachFragment`，x-html.compile 同语义：可含任意指令、不要求组件声明）。以消费处 scope 为父编译（片段插值读声明处 state，响应式）；props 注入响应式数据域（热更新与组件路径同权）。片段中的 `x-define` 声明元素经编译器剪枝不渲染（组件已在加载阶段注册）。注册了其他名组件时 warn 一次名字提示（typo 可发现性，非失败）；片段文本按 url 指令级缓存（失败不缓存）。

**数据基准**：片段路径不经 x-html 指令委托（shell 面板 rootless 挂 body 容器，委托会导致片段读不到任何状态）——编程式 `compileChild(wrapper, 消费处 scope, {}, undefined, props)`。

**失败语义**：加载失败（fetch 非 2xx/网络错误/解析为空）→ 面板内 `autospark.error` 错误占位（ADR-0018 契约：`retryable`/`closeable`；retry/close 走 action 注入），**不自动关**；`_remoteFailed` 旗标使 close 走销毁、不进 keepalive 缓存——重开自然重建面板并重新加载。retry action 经 `onRemoteRetry` 钩子原位重载（回到「面板先开」加载中形态）。

**时序**：首次打开才加载（非指令初始化时）；url 经成员表达式管道每次打开重求值；url 变 = 新缓存身份 = 重建（旧条目活到回收点）。

### 决策 4：实例层支撑——shell-only 构建 + 延迟内容附加

现行构建是「先编内容组件再编 shell」（内容产物是 shell 默认出口的 live 插槽段）。远程路径需反转：`_buildShellAndMount(contentEl | null)` 统一两路径——`contentEl` 为 null 时出口放占位锚（`data-overlay-remote-pending`）并捕获内容出口（SlotDirective 出口恒留 `data-slot` 属性），附加阶段 `replaceWith` 原位换入。插槽分段延迟：打开时预收集原始子节点（`collectSlotGroups`），出口清单（def.slots）加载后才可知，attach 前按加载产物分段。

props 加载中丢失防护：面板已开（visible）但内容未附加（instanceScope null）时段，`_onPropsChange` 暂存 props，attach 时一并应用。

级联死亡感知换轨：shell-only 阶段监视 parentScope（内容 scope 尚不存在），attach 后换轨到内容/片段 scope。

### 决策 5：关闭动画中重开的复活修复（顺带）

既有缺陷：`open()` 在关闭动画中重开 → `animate.cancel` 同步执行 onDone → `destroy()` 置 `_destroyed` → 随后无守卫重建 → 僵尸实例（此后 requestClose/close 全被 `_destroyed` 守卫吞掉，无法再关闭）。修复：cancel 后若已销毁则重置旗标按全新构建走（复活重建语义）；keepalive 语义下 cancel 完成离场后已挂起，走恢复。

## 后果

**正面**：

- 表单类覆盖物的输入状态跨开关保留（keepalive）；多页签并存与独立恢复（key）；远程内容按需加载且双形态（组件/片段）覆盖声明式与轻量两种消费习惯；
- 失败可发现（error 占位 + 名字提示）、可重试（retry action / 重开重建）、不留僵尸（失败不进缓存、close 走销毁）。

**代价 / 边角（不做）**：

- keepalive 挂起实例无 LRU/上限——量大由消费者自行规划（v1 明码标价）；
- 命令式通道无 keepalive（无缓存归属方）；
- 片段路径不支持插槽内容投影（无组件出口概念，声明了则 warn 丢弃）；
- 片段兜底路径有两次网络请求（注册尝试 + 片段文本）——组件路径主流场景单请求，兜底场景浏览器 HTTP 缓存通常兜住；
- url 片段不缓存到引擎级（仅指令级文本缓存）；跨指令共享由 x-import url 缓存承担（组件部分）。

## 实施落点

- `src/features/overlay/types.ts`——`OverlayConfig` 增 `keepalive`/`key`/`url`；`OverlayEventDetail` 增 `key`；`buildOverlayCacheKey`；
- `src/features/overlay/handle.ts`——命令式通道 keepalive warn；
- `src/features/overlay/instance.ts`——`cacheKey` 注入、`_suspend`/`_resume`、`_buildAndMount` 拆分 `_compileContent`/`_buildShellAndMount`、`openRemote`/`attachRemote`/`attachFragment`/`failRemote`/`beginRemoteReload`、占位锚与错误占位辅助、事件 payload key、destroy 动画取消兜底、复活修复；
- `src/features/directive/overlay.ts`——keepalive 缓存 Map 与同键复用、`_openRemote`/`_loadRemoteFor` 双路径分流、插槽预收集/延迟分段、`_pendingRemoteProps`、destroy 回收；
- `src/__tests__/directives/x-overlay.test.ts`——keepalive/key/url 用例组。
