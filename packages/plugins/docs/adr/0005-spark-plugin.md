# ADR-0005: x-spark 装饰动效伞形指令（x-ripple 升级归一）

- 状态：已接受（Accepted，2026-10-25）
- 日期：2026-10-25
- 关联：取代包内 ADR-0002（x-ripple 涟漪指令插件化——注册通道 / 执行通道 / 载体策略 / 停止语义全部平移继承，本文档不再复述）；ADR-0003（插件目录与产物契约）、ADR-0004（vite 闭包构建）；engine ADR-0007（指令选项回退链）、ADR-0111（指令安装器队列）

## 背景

需要为宿主元素增加「环绕色环旋转」动画（进行中指示场景）。评估发现「扩散波纹」与「环绕旋转」是两类不同的装饰动效语义：若作为 x-ripple 的 option 塞入，ripple（扩散波纹）一词对旋转色环完全失真，且后续还会有更多装饰动效加入——指令名必须上升到「装饰动效」能力面的伞形词汇。

命名收敛为 **x-spark**：火花 = 为宿主「添一把火」的装饰动效意象，与项目名 AutoSpark 天然同源，词汇一致性最高。

## 决策

### 决策 1：x-ripple 升级为 x-spark 装饰动效伞形指令，硬切迁移零别名

指令名 `x-ripple` → `x-spark`（options 名 `x-spark-options`），插件目录 `src/plugins/x-ripple/` → `src/plugins/x-spark/`，产物 `autospark.ripple.js` → `autospark.spark.js`，全局名 `AutoSparkRipple` → `AutoSparkSpark`，CSS 自定义属性 `--x-ripple-*` → `--x-spark-*`，类钩子 `x-ripple-*` → `x-spark-*`，文档页与 demo 目录同步更名。不保留 x-ripple 别名、不做兼容层（包内先例：全局名退役、NOTIFICATION_PERSIST 迁移均为硬切）。注册通道（`AutoSpark.directive(spec)` 安装器队列）、Runtime 执行通道、伪元素载体策略、播完再停语义全部平移继承（ADR-0002 决策 1/2/3/5/6）。

### 决策 2：三维配置模型——type × (rippleMode | spinMode) × trigger

外层效果族 `type: 'ripple' | 'spin'`（缺省 `ripple`，裸 `x-spark` = 原 x-ripple 裸声明行为零漂移）。原 x-ripple 内部形态键 `type: ring|glow|echo` 与外层 type 撞名让位，**用户拍板拆分为各自独立键**（不统一为 mode）：

- `rippleMode: 'ring' | 'glow' | 'echo'`（原枚举与语义平移改名，缺省 `echo`）
- `spinMode: 'rotate' | 'beam' | 'chase'`（缺省 `beam`，2026-10-25 用户调整）

`trigger: 'always' | 'hover' | 'click'` 家族统一（缺省 `always`）。三通道等价声明平移并支持**修饰符链级联**：`x-spark.spin.click`（第一段效果族、第二段触发器）≡ `x-spark-options="{type:'spin',trigger:'click'}"`；布尔键（`{spin:true}`/`{hover:true}`）与显式键同通道等价；并存取先规则（hover > always > click）与 ADR-0002 决策 3 一致。

### 决策 3：spin 视觉契约

- **三种 spin 形态（spinMode）**：`rotate`（整环匀速旋转：conic-gradient 渐变环沿宿主边界整体转动）、`beam`（光段跑边：一段亮弧沿 border 循环跑动，**缺省形态**，2026-10-25 用户调整）、`chase`（双段追逐：两段亮弧间隔追逐）。
- **环几何**：色环贴合宿主 border-radius 绘制；环宽 = `size`（缺省 4px）——ripple 下 size 是自边框向外扩散距离、spin 下是环宽，顶层键平铺按 type 分流语义（用户拍板，不子域化）。
- **触发器语义家族统一**：`always` 恒转；`hover` 悬停转、移出停；`click` 每次点击转一圈（一个周期）播完即停——与 ripple click「每次点击起一轮波」严格对齐（用户拍板，不做 toggle 开关）。spin 下 `gap` 无意义（恒转无静止段），声明时 warn 忽略。
- **周期**：`speed` = 单循环周期（ripple = 单波周期 / spin = 旋转一圈时长），统一缺省 3000ms（2026-10-25 定稿；初版 2500 后回调 3000 与涟漪时代节奏一致）；echo 错相位延迟连锁 -1500ms。
- **渐变直连契约（2026-10-25 修订，实现期实证）**：三形态 conic-gradient background **直写**于伪元素形态类规则（`.x-spark-spin-<mode>.x-spark-on::after`）与降级层内联样式（`spinGradientCss()` 单一模板源），直接引用 `var(--x-spark-angle)`。禁止经宿主级未注册自定义属性中转（初版 `--x-spark-spin-bg` 变量承载方案已退役）——注册属性动画的 paint 失效传播只保证覆盖「计算时直接解析到该变量的属性」，间接 var() 链在部分 Chromium 版本上不触发重绘，表现为 `--x-spark-angle` 计算值持续递增而色环静止不转。

### 决策 4：badge 徽标形态家族通用

`badge` 从 ripple 专属升为 spark 家族通用形态：ripple 下波环自角标圆边扩散（ADR-0002 决策 4 徽标条目语义平移）；spin 下 = 宿主右上角小圆内旋转色环（角标加载指示）——环几何缩至角标圆内，其余契约（圆心恰在宿主右上角顶点、z-index 最大值 `2147483647`、非法值 warn 后不启用）不变。color 缺省联动主题语义红 `var(--auto-danger-color, #ff4d4f)` 全家族生效（badge 启用且未显式 color 时，显式 color 恒优先）。

### 决策 5：键面平铺按 type 分流，宽松策略一致

`x-spark-options` 顶层平铺：`color/speed/badge` 跨效果通用（speed 周期语义按 type 分流注释），`size` 按 type 分流（扩散距离 / 环宽），`rippleMode/spinMode/gap` 为效果专属键（交叉声明时 warn 忽略）。非法值 warn 后回退缺省的宽松策略全家族一致（ADR-0002 先例）。

## 备选方案

- **作为 x-ripple option 塞入**：否决——ripple 语义对旋转色环失真，后续动效加入将使「波纹」一词彻底不可维护（本次升级的动因）。
- **统一 `mode` 键**（`mode: ring|glow|echo|rotate|beam|chase` 六枚举）：否决——用户拍板 `rippleMode`/`spinMode` 独立键，各效果形态面显式隔离，避免六值混排的枚举膨胀。
- **保留 x-ripple 别名过渡**：否决——双注册面 + 文档双轨维护，与包内硬切先例相悖。
- **x-motion / x-animate 等泛化伞形名**：否决——认知度泛化但与项目词汇无呼应；x-spark 与 AutoSpark 同源，「添一把火」意象在装饰动效语义上同样成立。
- **spin click = toggle 开关**：否决——与 ripple click「每次点击播一轮」通道语义漂移；click 通道家族统一为「单周期播放」。

## 后果

- 产物收敛为 `autospark.spark.js`（IIFE 闭包，全局名 `AutoSparkSpark`，复制 docs/public），原 `autospark.ripple.js` 从产物清单与 docs/public 退役。
- 文档 `docs/zh/guide/directives/x-ripple.md` → `x-spark.md`（sidebar 同步），demo 目录 `docs/demos/ripple/` → `docs/demos/spark/`，新增 spin 三形态与 badge 组合 demo。
- ADR-0002 状态改为「已被本 ADR 取代」，正文保留作注册通道 / 载体策略的历史论证（本文档继承不复述）。
- 测试迁移 `x-ripple.test.ts` → `x-spark.test.ts`：既有用例全量改名迁移 + spin 用例（三形态、trigger、badge 组合、speed 2500 连锁断言）。
- 类型导出更名：`XRIppleOptions/XRIppleType/XRIppleTrigger` → `XSparkOptions/XSparkType/XSparkTrigger`，新增 `XRippleMode/XSpinMode`，自插件入口导出供编程消费。
- 指令值三态、静态求值一次、hover 零延迟预探测、reduced-motion 停播等通道语义零变化（ADR-0002 决策 3/6 平移）。
