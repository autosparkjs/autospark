# AutoSpark

AutoSpark 是信号驱动的声明式前端引擎家族：engine 核心、router、theme、plugins 等包共享一套模板指令与状态词汇。本文件是全家族共享的领域词汇表。

## Language

### 指令域

**涟漪（Ripple）**:
从宿主边框开始、循环向外扩散渐隐的装饰性动画层，不改变宿主自身布局与内容。
_Avoid_: 波纹、水波

**涟漪方式（Ripple Type）**:
涟漪的视觉形态，三值：`ring`（外扩环）、`glow`（边框光晕呼吸）、`echo`（双环回声）。
_Avoid_: 模式、风格

**触发器（Ripple Trigger）**:
涟漪循环的播放时机：`always` 挂载后持续循环；`hover` 仅悬停期间播放；`click` 每次点击播放一个完整周期后自动停止。三通道等价声明：`trigger` 显式键 / 布尔开关键 / 点修饰符速记（`x-ripple.hover`），并存按 hover > always > click 取先。

**涟漪周期（Ripple Cycle）**:
一次完整的扩散-渐隐过程，由动画段（speed）与末尾静止段（gap）组成，循环往复。

**扩散距离（Ripple Size）**:
涟漪自宿主边框向外扩散的最大距离；三种涟漪方式共用同一语义。
_Avoid_: 大小、半径

**载体（Ripple Carrier）**:
涟漪动画层的 DOM 承载。宿主伪元素优先，宿主伪元素已被占用时自动降级为注入子元素。
_Avoid_: 容器、包装层

**徽标涟漪（Ripple Badge）**:
涟漪载体的徽标形态：载体缩为宿主右上角顶点处的正圆（圆心恰在角点，一半悬于宿主外），波环自圆边向外扩散。直径经 `badge` 声明（`true` = 默认直径，正数字 = 自定义直径），启用时涟漪颜色缺省主题语义红。
_Avoid_: 红点、角标（未限定涟漪载体语义时）

### 插件域

**插件（Plugin）**:
扩展 AutoSpark 的机制单元：组件、指令、图标、动作等任意扩展 autospark 功能的形态，经全局 `AutoSpark` 命名空间注册（组件表 / action 表 / directive / icons / ready），加载即自举，engine 构造期自动消费。
_Avoid_: 静态 import 引入（源码级 static import 仅为构建期剥除的创作糖，产物零痕迹）、组件库

**插件闭包（Plugin Closure）**:
官方插件的产物形态（ADR-0004）：封进以全局命名空间为参数的 IIFE——`(function (AutoSpark) { ... })(globalThis.AutoSpark)`，闭包参数即命名空间本体；`AutoSpark === undefined`（插件先于引擎加载）时插件体自动入预加载队列，engine 构造 drain 回放。源码级 `import { AutoSpark } from "autospark"` 经官方 vite 工具（`installAutosparkPlugin()`）构建期剥除落定到闭包参数。
_Avoid_: globalName 全局名赋值（`AutoSparkPlugins` 等已退役）、exports 工厂形态（闭包无 exports 面）、自举样板代码（双路径自举是外壳固有职责）

**官方插件包（@autospark/plugins）**:
官方插件集与插件开发方式的载体：三种扩展形态各有一个官方样板（notifications 复合 / x-ripple 指令 / autospark.button 组件），产物仅 IIFE 脚本（脚本即契约）。
_Avoid_: 组件资产包、@autospark/components（旧名，已更名）

**运行时桥（Runtime Bridge）**:
官方插件消费 autospark 能力的唯一通道：零静态值导入，运行期经 `globalThis.AutoSpark`（脚本场景）或预加载队列插件体第二参（先于引擎加载场景）解析命名空间成员。
_Avoid_: 静态依赖、桥接 stub
