# AutoSpark

AutoSpark 是信号驱动的声明式前端引擎家族：engine 核心、router、theme、plugins 等包共享一套模板指令与状态词汇。本文件是全家族共享的领域词汇表。

## Language

### 指令域

**涟漪（Ripple）**:
`x-ripple` 装饰动效指令：从宿主边框开始、循环向外扩散渐隐的动画层，不改变宿主布局与内容。形态经 `type` 声明（见「涟漪形态」）。
_Avoid_: 波纹、水波；x-spark（旧伞形指令，已拆分退役）

**涟漪形态（Ripple Mode）**:
涟漪的视觉形态，经 `type` 声明，三值：`ring`（外扩环）、`glow`（边框光晕呼吸）、`echo`（双环回声，缺省）。三通道等价声明：`type` 显式键 / 布尔开关键 / 点修饰符速记（`x-ripple.echo`），并存按 `glow > ring > echo` 取先。
_Avoid_: 模式、风格；rippleMode（伞形时代旧键名，已回归 type）

**色环旋转（Spin）**:
`x-spin` 装饰动效指令：环绕宿主边界的旋转色环动画，用于进行中指示。形态经 `type` 声明：`rotate`（整环匀速旋转）、`beam`（光段跑边，缺省）、`chase`（双段追逐），三通道等价声明同涟漪，并存按 `chase > rotate > beam` 取先。
_Avoid_: 加载（loading 是状态语义，spin 是装饰动效）、转圈；x-spark（旧伞形指令）

**触发器（Trigger）**:
装饰动效（x-ripple / x-spin 通用）的播放时机：`always` 持续循环；`hover` 仅悬停期间播放；`click` 每次点击播放一个完整周期后自动停止（涟漪 = 起一轮波，色环旋转 = 转一圈）。三通道等价声明：`trigger` 显式键 / 布尔开关键 / 点修饰符速记（可与形态段级联 `x-spin.beam.click`，次序无关），并存按 hover > always > click 取先。

**动效周期（Cycle）**:
一次完整的循环单元：涟漪为一次扩散-渐隐过程（speed 动画段 + gap 静止段），色环旋转为一圈旋转（仅 speed，无 gap）。

**扩散距离（Ripple Size）**:
涟漪自宿主边框向外扩散的最大距离，x-ripple 的 `size` 语义。
_Avoid_: 大小、半径

**环宽（Spin Size）**:
色环旋转的绘制宽度，x-spin 的 `size` 语义，色环贴合宿主 border-radius 自边界向内成环。
_Avoid_: 厚度、粗细（实现层词汇）

**载体（Carrier）**:
装饰动效层的 DOM 承载。宿主伪元素优先，宿主伪元素已被占用时自动降级为注入子元素——同宿主声明 x-ripple 与 x-spin 时后挂者经此机制降级共存。
_Avoid_: 容器、包装层

**徽标动效（Badge）**:
载体的徽标形态（涟漪/色环旋转通用）：载体缩为宿主右上角顶点处的正圆（圆心恰在角点，一半悬于宿主外）——涟漪下波环自圆边向外扩散，色环旋转下色环在圆内旋转。直径经 `badge` 声明（`true` = 默认直径，正数字 = 自定义直径），启用且未显式 color 时颜色缺省主题语义红。
_Avoid_: 红点、角标（未限定载体语义时）

### 插件域

**插件（Plugin）**:
扩展 AutoSpark 的机制单元：组件、指令、图标、动作等任意扩展 autospark 功能的形态，经全局 `AutoSpark` 命名空间注册（组件表 / action 表 / directive / icons / ready），加载即自举，engine 构造期自动消费。
_Avoid_: 静态 import 引入（源码级 static import 仅为构建期剥除的创作糖，产物零痕迹）、组件库

**插件闭包（Plugin Closure）**:
官方插件的产物形态（ADR-0004）：封进以全局命名空间为参数的 IIFE——`(function (AutoSpark) { ... })(globalThis.AutoSpark)`，闭包参数即命名空间本体；源码级 `import { AutoSpark } from "autospark"` 经官方 vite 工具（`buildAutoSparkPlugin()`）构建期剥除落定到闭包参数。外壳两形态：标准排队外壳（缺省，`AutoSpark === undefined` 时整包入预加载队列，engine 构造 drain 回放）与立即执行外壳（`shell: "immediate"`，库型插件专属，见「库型插件」）。
_Avoid_: globalName 全局名赋值（`AutoSparkPlugins` 等已退役）、exports 工厂形态（闭包无 exports 面）

**库型插件（Library Plugin）**:
兼具独立库身份的插件形态：包体对引擎零运行时引用（仅 `import type`），模块加载期副作用需「引入即生效」（不装引擎也完整可用）。产物走立即执行外壳（无整包排队），双路径自举由源码级插件安装器承担。theme 为首个实例（ADR-0007）。
_Avoid_: 双产物并存（tsup IIFE 库形态 + 闭包插件形态的分裂）、整包排队（会杀死无引擎消费）

**插件安装器（installPlugin）**:
双路径自举基建（收敛于 @autospark/utils，ADR-0006）：probe 探测全局命名空间命中即直取注册，否则仅将 register 回调入预加载队列——排队粒度是注册回调而非插件包体；队列冻结且全局不可达时报错响而不哑。
_Avoid_: 自举样板代码（各包内联副本已退役）、整包排队（那是外壳的职责，且仅标准外壳）

**插件开发工具箱（@autospark/utils）**:
家族插件开发公共基建单点（ADR-0001/0002）：源级自举（插件安装器）与构建期闭包打包（vite 工具 buildAutoSparkPlugin）双工具同包，插件作者单依赖即得；对引擎仅 type-only 依赖，运行时零静态依赖。
_Avoid_: 业务功能承载（基建层纪律）、构建工具随产物包分发（@autospark/plugins/vite 旧形态，已迁出）

**主题插件（Theme Plugin）**:
@autospark/theme 的插件身份（ADR-0007，Q10 修订）：模块加载期创建默认管理器单例并挂全局 `AutoSparkThemeManager`（引入即尽可能早实例化），ready 回调注入 `engine.themeManager` 引用 + 挂 `state.$.theme` 七维状态（dark/themeColor/size/spacing/shadow/radius/colorized）并**单向同步**（state → manager 经 `watch("$.theme.*")` 回写，manager 直改不回写投影）——模板写入 `theme.dark` 等即驱动主题切换，投影初值以 ready 期 manager 当前值播种；多 engine 共享同一单例（root scope 物理绑定 documentElement），manager 本体不随 engine 清理，watch 订阅随 engine destroy 摘除。
_Avoid_: per-engine 实例（双 root 冲突）、实例化职责（ready 只挂指针与接线）、双向绑定（manager 回写广播不值得）、只读单向投影（theme 是用户意图非环境事实）、accessor 活视图（autostore watch 断链）

**官方插件包（@autospark/plugins）**:
官方插件集与插件开发方式的载体：三种扩展形态各有一个官方样板（notifications 复合 / x-ripple 指令 / autospark.button 组件），产物仅 IIFE 脚本（脚本即契约）。
_Avoid_: 组件资产包、@autospark/components（旧名，已更名）、构建工具分发（vite 闭包构建工具已迁 @autospark/utils，ADR-0002）

**运行时桥（Runtime Bridge）**:
官方插件消费 autospark 能力的唯一通道：零静态值导入，运行期经 `globalThis.AutoSpark`（脚本场景）或预加载队列插件体第二参（先于引擎加载场景）解析命名空间成员。
_Avoid_: 静态依赖、桥接 stub
