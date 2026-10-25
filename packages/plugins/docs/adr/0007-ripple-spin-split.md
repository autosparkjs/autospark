# ADR-0007: x-spark 伞形指令拆分为 x-ripple / x-spin 双指令

- 状态：已接受（Accepted，2026-10-25）
- 日期：2026-10-25
- 关联：取代包内 ADR-0005（伞形模型退役）；涟漪独立指令形态部分回归 ADR-0002（注册通道 / 载体策略 / 停止语义继续平移继承，本文档不复述）；ADR-0003（插件目录与产物契约）、ADR-0004（vite 闭包构建）不变；engine ADR-0007（指令选项回退链）不受影响

## 背景

ADR-0005 将形态键 `type: ring|glow|echo` 改名 `rippleMode` 的唯一动因，是与外层效果族键 `type` 撞名让位——该包袱由伞形模型引入，并带来「type × (rippleMode | spinMode) × trigger」三层配置心智。评估确认：不预期出现第三种装饰动效（用户拍板），伞形的扩展价值不再成立；拆分后 `type` 回归形态键、单指令单职责，配置面更直白。经 grilling 十问逐项收敛后定稿。

## 决策

### 决策 1：拆分为 x-ripple / x-spin 两指令两产物，硬切零别名

- 指令：`x-spark` → `x-ripple`（涟漪扩散）+ `x-spin`（色环旋转）两条**独立指令**，注册通道不变（`AutoSpark.directive(spec)` 安装器队列，ADR-0002 决策 2 平移）。
- options 名：`x-spark-options` → `x-ripple-options` / `x-spin-options`。
- 产物：`autospark.spark.js` → `autospark.ripple.js` + `autospark.spin.js`（**一指令一产物**，与 notifications/button 先例一致）；载体/徽标/触发器/探测降级等共享逻辑源码共享、产物各自内联——自包含闭包契约（ADR-0003）允许产物级重复。
- 源码目录：`src/plugins/x-spark/` → `src/plugins/x-ripple/` + `src/plugins/x-spin/` + 共享模块（内部命名不受领域词汇退役约束）。
- CSS 类钩子与自定义属性全拆：`x-spark-on/echo/layer/badge…`、`--x-spark-duration/color/size…` → `x-ripple-*` / `--x-ripple-*` 与 `x-spin-*` / `--x-spin-*` 两套命名空间。
- 聚合产物 `autospark.plugins.js` 照常含两指令。不保留 x-spark 别名、不做兼容层（包内硬切先例）。

### 决策 2：type 回归形态键，三通道声明

- `x-ripple`：`type: 'ring' | 'glow' | 'echo'`（缺省 `echo`）；`x-spin`：`type: 'rotate' | 'beam' | 'chase'`（缺省 `beam`，2026-10-25 定稿平移）。
- **三通道等价**（与触发器通道镜像对称）：显式 `type` 键 / 布尔开关键 `{echo:true}` / 点修饰符 `x-ripple.echo`——修饰符经解析期按词表注入布尔开关键（与 options JSON 同一落点），机制零改造平移。
- 触发器 `trigger: 'always' | 'hover' | 'click'`（缺省 `always`）三通道不变，并存按 `hover > always > click` 取先。
- **修饰符词表分流、次序无关**：形态词表与触发器词表不相交，每段按词表归类——`x-spin.beam.click` ≡ `x-spin.click.beam` ≡ `{type:'beam',trigger:'click'}`；同类双段按值序合并不报错。
- **形态并存取先**：缺省垫底 + 枚举声明序——x-ripple 按 `glow > ring > echo`，x-spin 按 `chase > rotate > beam`（与触发器序中缺省 always 垫底同构）。
- 键面平铺：`color/speed/badge` 跨指令同语义（speed 缺省 3000ms、echo 错相位延迟连锁 -1500ms 平移）；`size` 按指令各自语义（x-ripple = 扩散距离缺省 12px，x-spin = 环宽缺省 4px）；`gap` 仅涟漪支持。**跨指令键 warn 忽略**：x-ripple 声明 spin 形态键、x-spin 声明 `gap` 时警告忽略不中断渲染（宽松策略一致）。
- 指令值三态（无值恒开 / 表达式 / `"false"`）、静态求值一次、渐变直连契约（ADR-0005 决策 3 修订条目平移）、reduced-motion 停播、播完当前周期再停——全部平移继承，行为零变化。

### 决策 3：同宿主叠加允许

`x-ripple` 与 `x-spin` 可同宿主共存，两动效并行播放。伪元素冲突由既有「宿主伪元素占用探测降级注入子元素」机制兜底（后挂者自动降级）；badge 双开时角标重叠属装饰语义可接受。零新增检测逻辑——探测降级机制本为此类冲突设计的通用解。

### 决策 4：spark 领域词汇退役

「火花（Spark）」作为领域词汇退役：CONTEXT.md 指令域改写为「涟漪（x-ripple 指令）」「色环旋转（x-spin 指令）」两词条，家族共享概念（触发器 / 周期 / 载体 / 徽标）措辞中性化去 spark 词根。文档页 `x-spark.md` 拆回 `x-ripple.md` + 新建 `x-spin.md`（sidebar 两条目），demo 拆 `docs/demos/ripple/` + `docs/demos/spin/`，官方插件包页的指令插件样板引用同步更新（x-spark → x-ripple）。

## 备选方案

- **保留 x-spark 伞形指令**：否决——`type` 撞名让位是 ADR-0005 引入的历史包袱，不预期第三族，伞形扩展价值不成立（本次拆分的动因）。
- **单产物 autospark.spark.js 内注册双指令**：否决——一插件一产物心智（notifications/ripple/button 先例），两产物支持消费方按需加载（只用涟漪的页面不必背色环实现）；共享逻辑产物内联重复 gzip 后 < 1 kB 可接受。
- **形态两通道**（显式 type 键 + 修饰符，不设布尔开关键）：否决——修饰符注入天然落在布尔开关键上，砍布尔键需改机制且与触发器通道结构不对称。
- **修饰符固定次序**（第一段恒形态、第二段恒触发器）：否决——词表不相交无歧义，实现按词表归类，次序约束是不必要的文档负担。
- **同宿主互斥 warn**：否决——需新增检测逻辑且违背「装饰动效可组合」直觉；探测降级已是通用解。
- **保留 x-spark 别名过渡**：否决——双注册面 + 文档双轨维护，与包内硬切先例相悖。

## 后果

- 产物清单 CLOSURE_ARTIFACTS：spark 条目替换为 ripple + spin 两条；`autospark.spark.js` 从 dist 与 docs/public 退役，`autospark.ripple.js` / `autospark.spin.js` 上位（复制 docs/public）。
- 文档：`docs/zh/guide/directives/x-spark.md` → `x-ripple.md` + `x-spin.md`；demo `docs/demos/spark/` → `docs/demos/ripple/` + `docs/demos/spin/`；sidebar 同步两条目。
- 测试：`x-spark.test.ts` → `x-ripple.test.ts` + `x-spin.test.ts`，共享行为（载体降级 / 徽标 / 触发器状态机 / 宽松归一）两文件各自覆盖核心契约；形态并存值序、词表分流、跨指令键 warn 新增用例。
- 类型导出：`XSparkOptions/XSparkType/XSparkTrigger/XRippleMode/XSpinMode` → `XRippleOptions/XRippleMode`（形态）+ `XSpinOptions/XSpinMode`（形态）等，自各自插件入口导出供编程消费。
- CONTEXT.md 指令域改写；ADR-0005 状态标注「已被本 ADR 取代」。
- 指令值通道、触发器语义、载体策略、徽标契约、周期节奏（3000ms / -1500ms）全量零漂移——拆分是配置面的重组而非行为变更。
