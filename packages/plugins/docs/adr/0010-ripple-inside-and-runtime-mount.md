# ADR-0010: x-ripple inside 形态与运行时动态挂载契约

- 状态：已接受（Accepted，2026-10-31；决策 1 于 2026-11-07 修订——inside 单圆化，移除环）
- 日期：2026-10-31
- 关联：ADR-0002（值三态 / 触发器 / 停止语义 / 载体策略 / 注册通道与加载顺序——inside 全量继承，仅 click 连点语义一点特例）、ADR-0007（三通道等价与跨指令键宽松忽略纪律——inside 互斥族沿用）、ADR-0005 决策 4 修订（「双环一次起波」观感结论——原用于论证 inside 双圆同拍，2026-11-07 修订后 inside 单圆、引证终结）；不涉 ADR-0008/0009 的提取与目录形态

## 背景

两个诉求：① **运行时动态挂载**——不经编译、直接对 DOM 元素加/删 `x-ripple` 属性即生效/失效；② **按钮点击涟漪形态**——现有三形态（ring/glow/echo）全是 box-shadow 自边框**向外**扩散，无法表达「宿主内部、自点击点铺开」的 Material 式按钮涟漪。经 grilling 十四问逐项收敛（含键名从 inline 改定 inside——避让 x-isolate 无值形态 / x-loading 主声明位的既有术语）。①经实证（bun test 探针）确认 engine 侧机制已完备，本 ADR 只固化契约边界；②为新增形态键。

## 决策

### 决策 1：inside 形态键——单圆（实心填充圆）

> **修订（2026-11-07）**：原设计为「一芯一环双圆」（芯 = 实心填充圆 + 环 = 芯圆周描边，同心同步）。用户定稿移除环——单圆即 Material 本义，环属冗余 flourish（否决记录见备选「保留环」条目）；填充圆透明度维持 ~0.3 不补偿；命名随单圆收敛（类 `x-ripple-inside-circle` / 变量 `--x-ripple-inside-alpha` / keyframes `x-ripple-inside-<speed>-<gap>`）。原「同心同步」论证（任何错相呈第二道波峰）随第二圆消失而失效，与 ADR-0005 决策 4 的引证关系就此终结。

- 键：`inside?: boolean`（`x-ripple-options` 布尔键；`x-ripple.inside` 修饰符经解析期词表注入，三通道等价沿用 ADR-0007 纪律）。
- 视觉：**单圆 = 实心填充圆，自起点放大 + 渐隐**（Material 式按钮涟漪本义，无描边环）。
- 固定缺省观感参数烘进 CSS 变量、不开配置键（YAGNI）：填充圆透明度 ~0.3；`color` 键只管色相（缺省色链不变）。

### 决策 2：互斥族（宽松忽略纪律）

- `inside:true` **接管渲染**：type 词表（`ring`/`glow`/`echo` + 修饰符/布尔开关）warn 忽略——外扩 box-shadow 与内部填充圆渲染机制不兼容，正交组合会逼着为每种组合发明语义。
- `badge` 优先：badge 启用时 `inside` warn 忽略（badge 语义更具体且已成文；两者对载体的理解冲突——角标圆 vs 宿主内部）。
- `size` warn 忽略：半径走自动几何（决策 3）。

### 决策 3：半径自动几何

起点（点击坐标或中心）到宿主 border box **最远角**的距离——铺满宿主是「约束在宿主内部」的自然本义（Material 同款）；按钮尺寸千差万别，沿用 size 缺省 12px 几乎不可见、让用户逐个算 px 不合理。

### 决策 4：触发器语义（触发器通道正交性不变）

- always/hover：起点固定宿主**几何中心**，单周期双圆扩散渐隐后循环；hover 移出播完当前周期再停（家族停止语义，ADR-0002 决策 6）。
- click：起点 = 点击坐标（click 事件相对宿主换算）；单周期自止；**连点取消上次、立即重起**——家族 click 契约（在播中连点忽略）的**唯一点特例**，落在 decorate 共享状态机的策略分支；非 inside 的 click 与 x-spin 维持原语义。
- 值三态（无值恒开 / 表达式 truthiness / 字面 `"false"` 恒关）与「值关点击不播」全量继承。

### 决策 5：speed 条件缺省 600ms

`speed`/`gap` 键语义沿用（动画段 / 周期末静止段）；inside 形态下 speed **缺省 600ms**（全局 3000ms 是外扩环呼吸节奏，按钮涟漪常见 400~800ms）——显式声明恒优先；条件缺省先例 = badge 启用时 color 缺省联动语义红（ADR-0002）。gap 缺省 0 沿用。

### 决策 6：载体——clipper 子元素，不动宿主样式

inside 恒走注入子元素载体：clipper span（`position:absolute; inset:0; border-radius:inherit; overflow:hidden; pointer-events:none`）内含芯/环两个 span（transform scale 动画，半径预置尺寸）。**不写宿主 overflow**（Material 式 overflow:hidden 会裁掉宿主的 dropdown / 角标 / 溢出内容）；伪元素路径不适用（伪元素无法被独立裁剪，clip-path 无法跟随宿主任意 border-radius）。宿主 position 兜底沿用 HOST_CLASS；prefers-reduced-motion 停播沿用。

**载体显示生命周期（实施期补记，2026-10-31）**：注入即 `display:none`、播放即恢复、停止（click 收口 / hover 移出 / 值转假）即再隐藏——芯带静态底色（background 无动画态兜底），动画摘除后若载体可见会以静态 `opacity:1` + 上次播放几何显形，整宿主被实心色块盖住（非 inside 降级层无此问题：box-shadow 动画摘除后静态值透明）。隐藏而非摘除：载体复用零重建，display 翻转可逆。

### 决策 7：运行时动态挂载契约成文（机制已在，零机制新增）

实证结论（bun test 探针，2026-10-31）：engine `RuntimeObserverDispatcher._attrThreeState` 的属性三态路由（新增→mount / 删除→unmount / 值变→attrChanged）+ childList 增删扫描**已完整覆盖**运行时动态加/删属性与动态插入元素，插件侧零改造。边界随文档成文：

1. 仅 engine 观察根内生效（engine.el 子树 + 覆盖层额外观察根；x-isolate 盲区归 child engine dispatcher）；
2. `x-ripple-options` 静态求值一次（mount 期读取）——运行时改 options 值无效，须移除重加 `x-ripple` 属性重挂；
3. 移除即失效 = unmounted 立即清理（类/载体/事件），不等在播周期；
4. 修饰符形式的**值变化**不触发 attrChanged（dispatcher attributeFilter 只含裸 `x-<name>`，engine 侧既有已知限制）；其增/删仍生效；
5. 插件晚于首编译加载时存量属性已被编译器剥除（ADR-0002 加载顺序契约不变）——运行时动态添加不受此限。

## 备选方案

- **键名 inline**：否决——撞 x-isolate 无值形态（inline 子引擎）与 x-loading 主声明位的既有术语；改定 inside。
- **inside × type 正交组合**：否决——ring 内扩 / glow 内发光等组合语义需逐一发明（YAGNI）；互斥 + warn 忽略复用跨指令键纪律。
- **双环错相 / 环领先（1.2× 或更快）**：否决——错相呈第二道波峰、观感「执行两遍」（ADR-0005 决策 4 修订同结论）；环领先无真实需求支撑。
- **保留环（halo 描边圆）**：否决（2026-11-07 修订）——单圆即 Material 本义，环属设计冗余；同时否决为其保留配置开关或兼容类钩子/变量（YAGNI——inside 上线一周无存量生态负担，硬删最简）。
- **size 沿用 / size 作上限 cap**：否决——12px 缺省对按钮涟漪几乎不可见；cap 引入两参数交互心智，直接自动几何最简。
- **透明度 / 环宽开配置键**：否决——开箱即用缺省够用，真需求出现再加键（YAGNI）。
- **badge 让位于 inside**：否决——badge 是 ADR-0002 成文契约、语义更具体；新键让路。
- **宿主注入 overflow:hidden（Material 做法）**：否决——裁掉 dropdown / 角标 / 溢出内容，副作用不可控。
- **伪元素 + clip-path 裁剪**：否决——clip-path 无法跟随宿主任意 border-radius，几何不可靠。
- **家族 click 契约整体改「连点重启」**：否决——惊动 x-spin 与既有文档/测试承诺；特例分支改动面最小。
- **inside 下 speed 沿用 3000ms 缺省**：否决——按钮涟漪节奏 400~800ms，3s 明显迟滞；条件缺省有先例。
- **运行时挂载新增插件级全局 observer**：否决——engine 观察根内已实证支持，全局 observer 突破「插件经 engine 注册」契约且代价大。

## 后果

- 实现：`src/directives/x-ripple/index.ts`（inside 归一 / 互斥 / keyframes / 载体）+ `src/utils/decorate.ts`（策略面扩展 + inside+click 重启分支）；共享状态机其余行为零变化。
- 测试：x-ripple.test.ts 补运行时动态加/删用例（含动态插入元素）与 inside 全行为用例（形态 / 互斥 / 自动几何 / 连点重启 / 条件缺省 / 载体结构）。
- 文档：`docs/zh/guide/directives/x-ripple.md` 新键面 + 「运行时动态挂载」小节（过 check-doc-structure）；demo `docs/demos/ripple/runtime.html` + `inside.html`。
- CONTEXT.md：新建「装饰动效层」，`inside` 词条首条；树形渲染层「拖拽三态定位」词条加同名消歧注记。
- x-spin 不受影响；既有 x-ripple 行为零变化（inside 缺省 false）。
