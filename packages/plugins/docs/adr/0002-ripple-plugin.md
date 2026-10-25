# ADR-0002: x-ripple 涟漪指令插件化（@autospark/plugins）

- 状态：已被 ADR-0005 取代（Superseded，2026-10-25——x-ripple 升级为 x-spark 装饰动效伞形指令，本文档的注册通道 / 执行通道 / 载体策略 / 停止语义平移继承，视觉契约由 ADR-0005 重组为 type × (rippleMode | spinMode) × trigger 三维模型）
- 历史状态：已接受（Accepted，2026-10-23 实现期修订注册通道与执行通道，见决策 1/2/3 的修订说明；2026-10-24 包更名与产物 IIFE-only 见 ADR-0003）
- 日期：2026-10-23
- 关联：包内 ADR-0001（通知模块插件化，自举形态先例）；engine ADR-0001（指令 kind 体系）、ADR-0007（指令选项回退链）、ADR-0100（受控注册语义）、ADR-0111（插件机制与指令安装器队列）、ADR-0114（插件预加载队列）、ADR-0116（precompile 回调）；先例：x-error（Runtime 通道 findScopeByEl 取 scope）

## 背景

需要为宿主元素增加涟漪动画指令 `x-ripple`：从边框开始循环扩散渐隐，考虑圆角跟随，值通道控制显示/隐藏，`x-ripple-options` 静态配置（type/trigger/color/size/speed/gap）。

落点评估的关键矛盾：全部 40 个 `x-` 指令在 engine `src/directives/`，而 components 包定位是「运行时零依赖 autospark」的自包含资产面（包内 ADR-0001 决策 2 已将其升级为官方扩展集）——指令体系（`DirectiveKind`、`binding.watch`、`DirectiveManager`）全部在 engine。

## 决策

### 决策 1（修订）：插件形态注册，engine 零改动——注册通道为 `AutoSpark.directive(spec)` 安装器队列

x-ripple 不进 engine `presetDirectives`，以 AutoSpark 插件形态自举（ADR-0001 决策 4 对称）。**注册通道修订**：最初设计走 `AutoSpark.ready` 回调注册，实现期发现时序错误——ready 回调在 engine 构造**尾部**触发（`firePluginReady`），晚于 autostart compile；而编译器 `_runtimeKeepAttr` 只保留**已注册**的 Runtime/Hybrid 指令属性，首编译时 ripple 未注册 → `x-ripple`/`x-ripple-options` 被当普通属性剥除，之后任何重扫都无从补挂（DOM 上已无属性）。

正确通道是指令安装器队列（ADR-0111 决策 5，`AutoSpark.directive` 的共用后端）：`enqueueDirectiveInstaller` 入模块内存队列，engine 构造期 `setupPluginQueue`（DirectiveManager 创建后、autostart compile **前**）消费——指令参与首编译，属性得以保留，`dispatcher.start` 初始扫描随即 mount。晚入队（engine 已存活）广播即时安装（Runtime 指令重扫生效；首编译已剥属性的 engine 无属性可扫——IIFE 场景按 script 顺序加载保证先注册）。撞预设名走 `DirectiveManager.install` 既有语义（ADR-0100）。

自举双路径：`globalThis.AutoSpark` 已存在（引擎脚本先加载）→ 经类静态 `directive(spec)` 直接入队；否则推 `__AUTOSPARK_PLUGINS__` 预加载队列（首个 engine 构造开头 drain，插件体内再走 `directive(spec)`，赶在同构造的 setupPluginQueue 消费之前）。队列已 drain+冻结且全局类不可达时显式 error（响而不哑，对齐 ADR-0111 纪律）。

### 决策 2（修订）：落点 `src/directives/x-ripple.ts`，零依赖经 spec 重载 + 钩子委托

用户拍板物理落点 `packages/components/src/directives/x-ripple.ts`，「插件」是注册技术而非目录结构。

> **修订（2026-10-24，ADR-0003）**：包更名与按插件重组，落点现址 `packages/plugins/src/plugins/x-ripple/index.ts`（一插件一目录自包含，插件入口统一 `index.ts`——ADR-0004 修订：目录名随指令名 `x-ripple`）。

零依赖实现修订：最初设计鸭子类型类直接经 `engine.directives.set` 注册，实现期发现 `AutoSpark.directive` 类重载硬性校验 `instanceof AutoSparkDirectiveBase`（鸭子类型类被 throw）——零依赖类改走 **spec 重载**：`autospark.directive({ name, kind, priority, mounted, unmounted, attrChanged })`，engine 侧造类（继承基类）并挂 spec 钩子。spec 钩子的 `this` 是 engine 造的基类实例（engine/info/value/el 契约面），控制器 `RippleDirective`（纯本包类，不继承基类）经 WeakMap 挂靠承接全部实例状态与逻辑，spec 钩子只做存取转发。

### 决策 3（修订）：Runtime（observer）通道，相对表达式经 findScopeByEl 等价支持

指令值三态：无值 = 恒开；字面 `"false"` = 恒关；表达式 = mounted 中经 `engine.findScopeByEl(el)` 取宿主 scope `watch(expr)` 响应式跟随（scope 缺失回退 `engine.store.watch` 绝对路径；watcher 注册进 scope.watchers 由 scope.destroy 统一回收）——语义与 Compile 的 `binding.watch` 等价（同一 scope.watch 实现，`x-data` 局部变量可读；x-error 先例）。

**通道从 Compile 修订为 Runtime**（实现期论证）：
1. Compile 指令晚注册错过首编译且无补挂通道（scope 实例只在未来编译产生），Runtime 指令经 dispatcher 的 mounted 通道对已保留属性的宿主可即时补挂（含编译期卸下、x-if 动态挂载的宿主）；
2. 涟漪是纯呈现副作用（无编译期变换、无子树占有），observer 通道的 mounted/unmounted/attrChanged 与其生命周期天然同构；
3. 相对表达式支持的缺口经 findScopeByEl 补齐（上段），不再构成 Compile 通道的独占理由。

`x-ripple-options` 静态求值一次（用户拍板）：涟漪参数是设计期配置，响应式收益低；经 `getDirectives` 整包解析（dispatcher mount 时 info.options 已含静态快照），不走表达式 watch。

**hover 零延迟**（实现期补充）：载体形态探测与触发器无关，hover 模式在 mounted 即预探测定形态（不挂起播放）——悬停触发时形态已定，播放无一帧探测延迟。

### 决策 4：涟漪视觉契约

- **三种涟漪方式（type）**：`ring`（外扩环：一圈边框自宿主边框向外扩散放大并渐隐）、`glow`（边框光晕：box-shadow 呼吸式明暗脉冲，不位移）、`echo`（回声双环：双伪元素错相位 ring，相位差 = (speed+gap)/2）。默认 `echo`（2026-10-24 用户调整，初版默认 `ring`）。**echo+click 双环一次起波**（2026-10-24 用户三度反馈后定稿）：click 触发下第二环与主环**同时起波**（相位差 0——任何非零错位都会呈现第二道波峰，观感即「执行两遍」），双环区分走尺寸通道：第二环同心缩小至 0.6 倍（`--x-ripple-echo-size`），与主环同拍收束，收口窗恒为整周期（gap 静止段不跳过）；always/hover 维持 -周期/2 错相位同尺寸双环（回声本义）不变。
- **触发器（trigger）三通道等价**：`always`（默认，挂载后持续循环）| `hover`（悬停期间播放，移出停止）| `click`（2026-10-24 增补：点击启动一个完整周期后自动收口，在播中连点忽略，周期末可再点重播——`start()` 内按触发器自动排周期末停止，挂起探测的延迟启动同样经此收口；mounted 预探测定形态保证首次点击零探测延迟）。声明通道三选一：`trigger` 显式键 / `hover`-`always`-`click` 布尔开关键 / `x-ripple.hover` 等点修饰符速记（引擎 getDirectives.ts 的 modifier 开关注入使修饰符与布尔键同一落点，零指令侧成本）。多处并存时按 **hover > always > click** 跨通道统一取先（用户拍板「取第一个值」）；显式 `false` 压制开关（JSON 键占位阻断 modifier 注入，ADR-0007 语义自然成立）。
- **扩散距离（size）**：统一语义 = 自边框向外扩散的最大距离（默认 12px）——ring/echo 是外扩距离，glow 是光晕外扩半径上限；环线粗细由各 type 内部定死，不开放配置面。
- **徽标涟漪（badge，2026-10-24 增补）**：`badge?: boolean | number` 将涟漪载体从「inset:0 全域」覆盖为「宿主右上角正圆」——圆心恰在宿主 border box 右上角顶点（`top/right = -直径/2`，一半悬于宿主外）。`true` = 默认直径 8px；正数字 = 自定义直径 px；非法值（字符串/0/负数/非有限数）warn 后不启用（宽松策略与其余键一致）。启用且未显式给 color 时 color 缺省联动主题语义红 `var(--auto-danger-color, #ff4d4f)`（显式 color 恒优先）。`type`/`trigger`/`size`/`speed`/`gap` 语义零变化：波环动画完全复用既有 keyframes（box-shadow spread 自圆边起波），echo+click「双环一次起波」定稿语义自动继承；`size` 仍管自圆边向外的扩散距离，与直径是独立两通道。载体 z-index 取 CSS 最大值 `2147483647`，覆盖宿主内容与同上下文定位元素——z-index 只在宿主所在层叠上下文内生效（宿主自带 transform/filter 等创建的上下文构成边界，无法穿透逃逸）；宿主 `overflow: hidden` 会裁剪 badge 与波环（属宿主自身裁剪上下文的正常行为），不强制干预。
- **颜色（color）**：缺省 `var(--auto-theme-color)`，跟随 ThemeManager 动态主题；显式传值优先（badge 徽标形态缺省联动语义红，见上条）。
- **涟漪周期**：`speed` = 动画段时长 ms（默认 3000，2026-10-24 用户调整——默认节奏放缓，初版 2000），`gap` = 末尾静止段 ms（默认 0）；静止段烘进 keyframes 百分比（动画段占 speed/(speed+gap) 比例），单 animation 无缝循环，ease-out 曲线。
- **圆角跟随**：载体 `border-radius: inherit`，自动贴合宿主圆角（50% 圆、局部圆角均一致），不开放覆盖配置（badge 徽标形态除外——载体恒 50% 正圆，见徽标条目）。
- **减弱动效**：`prefers-reduced-motion: reduce` 下停播（装饰性动画的可访问性底线）。

### 决策 5：载体策略——伪元素优先，占用自动降级子元素

载体优先宿主伪元素（`::after`；echo 占 `::before` + `::after`），零 DOM 侵入。宿主伪元素被占用时（`getComputedStyle(el, '::after').content` 非 `none`/`normal`）自动降级为注入 `position:absolute` 子元素——脱离文档流不参与 flex/gap 布局。纯自动检测，不加显式配置项（用户拍板）：配置面最小化，检测误报的极端场景可回退为改用子元素形态的宿主自身调整。

### 决策 6：停止语义——播完当前周期再停

指令值转假或 hover 移出时不打断在播周期：计算当前周期剩余时长（已播时间 mod 周期），延迟到周期末移除动画并复位载体。周期末本就近乎透明（渐隐尾态），复位即自然消失，无需退场动画。

## 备选方案

- **engine 内置 `src/directives/x-ripple.ts`**：否决——纯装饰动画无 engine 内置必要，增大 engine 体积且与「官方扩展集入 components」的定位（包内 ADR-0001 决策 2）相悖。
- **components 资产表形态（模板字符串）**：否决——涟漪是行为指令不是模板资产，资产表无响应式与生命周期通道。
- **Compile 通道（最初拍板，实现期反转）**：否决——ready 回调晚于首编译，Compile 晚注册错过首编译且无补挂通道（scope 实例只在未来编译产生）；其相对表达式优势经 findScopeByEl 在 Runtime 通道等价复得（决策 3）。
- **`AutoSpark.ready` 注册（最初设计，实现期反转）**：否决——ready 回调在构造尾部触发，首编译时指令未注册，`_runtimeKeepAttr` 剥除属性后无任何挽救通道；安装器队列（决策 1）才是「参与首编译」的唯一时序正确入口。
- **`$.directive(name, Cls)` 类重载**：否决——硬性校验 `instanceof AutoSparkDirectiveBase`，零依赖鸭子类型类不可用；spec 重载（决策 2）由 engine 造类，零依赖保持。
- **显式 carrier 配置**：否决——见决策 5，自动检测覆盖主路径场景。
- **extends AutoSparkDirectiveBase**：否决——运行时 import 打破 components 零依赖纪律；spec 重载 + 钩子委托（决策 2）以更小的耦合面达成同等的注册与执行能力。

## 后果

- components 包 tsup 新增两组产物配置：ESM+CJS + IIFE（`autospark.ripple.js`，全局名 `AutoSparkRipple`，复制至 docs 公共资源）；x-ripple 运行时零 autospark 值导入，能力经 `src/runtime/bridge.ts` 运行时解析（包内 ADR-0001 决策 4 修订）——原「ESM/CJS `autospark` 外置 + IIFE 桥接 stub」形态随全家族零静态依赖修订整体退役（gzip ≈ 2.8 kB）。

  > **修订（2026-10-24，ADR-0003）**：产物收敛 IIFE-only（ESM+CJS 配置删除，gzip ≈ 3.0 kB），产物名与全局名不变；自举收敛为 `runtime/bootstrap.ts` 单点 `installPlugin`。
- **加载顺序契约**：IIFE 场景 `autospark.ripple.js` 须先于首个 engine 实例化加载（script 顺序或 defer 顺序保证）——晚于首编译加载时宿主上的 `x-ripple` 属性已被剥除，重扫无属性可扫，指令对存量 DOM 不生效（动态添加的宿主仍生效）。
- 未装插件时 `x-ripple` 属性被编译器视为普通属性剥除——无静默兜底，文档声明「该装插件了」。
- 涟漪参数改值需重挂宿主（静态求值一次），文档明示。
- engine 侧零**指令体系**改动：无新增导出、无类型变更（`XRIppleOptions` / `XRIppleType` / `XRIppleTrigger` 自插件入口 `src/directives/x-ripple.ts` 导出供编程消费；模板属性无 TS 检查面，`x-ripple-options` 无声明合并接缝可挂，engine 指令 options 均无类型增强先例，ADR 初稿设想的 `types/augment.ts` 不适用）。全家族零静态依赖修订后 engine 侧配套增量见包内 ADR-0001 决策 4 修订（类静态补挂 / `SCOPES_KEY` 公开导出 / scope.destroy 注册表回收），x-ripple 自身零符号消费、仅预留 `captureNamespace` 统一通道。
- 测试基建：setup.ts 预置 `globalThis.AutoSpark`（模拟 IIFE 引擎先加载时序，插件统一走 directive 通道，避免预加载队列 drain+freeze 后 push 抛 readonly 错）；happy-dom 无渲染泵（rAF 不调度 → 探测定时器用 setTimeout）且 `getComputedStyle(el,'::after').content` 恒为 `""`（伪元素占用判定需测试 mock probe 驱动降级路径）。
