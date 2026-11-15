# ADR-0031: P4 对二——tour 漫游引导与 countdown 倒计时

- 状态：已接受（Accepted，2026-11-13）
- 日期：2026-11-13
- 关联：ADR-0018（组件库路线图——清单权威表 other 行「tour（P4）/ countdown（P4）」与决策 6 四约定）、ADR-0021/0024（P1/P2 轻件合批——规避清单与视觉对齐基线全条继承）、ADR-0012（button 范式样式基线）

## 背景

P4 批四件中 affix / watermark 由并行开发承接（各自 ADR），本 ADR 收 tour 与 countdown 两件（按 ADR-0018 决策 8 粒度：两件均为机制性轻件，合批一个 ADR）。每件一节：归类声明、API 面、取舍与边界。全局约定（i18n 词典回退 / router 隔离 / 排除域 / button 范式）与视觉对齐基线（`--asc-tone` 中转、`--auto-*` 三级回退、字号 data-size 通道、em 基准）继承 ADR-0018 决策 6 与 ADR-0024 后果节，不在本 ADR 重复。

## 决策

### 1. tour 漫游引导（other，P4）

**归类声明**：`src/components/other/tour/`，产物 `autospark.tour.js`，注册名 `autospark.tour`（缺省元素名 `x-tour`，无指令撞名）。

**API 面**：

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| steps | `{ target, title?, content }[]` | `[]` | 步骤数组（状态引用注入——字面量数组死环规避，ADR-0021 规避 5；原地变更不发信号，变更须整体替换）；target 为 CSS 选择器，在 document 范围解析 |
| visible | `boolean` | `false` | 受控开关；el.value 桥（读 = 当前开关、写 = 开关并经 watch 走定位同步，不广播） |
| current | `number` | `0` | 当前步受控（props 单向驱动 + 内部步进写 data + change 广播）；打开边沿不重置（纯受控语义，重开从头建议调用方随 close 一并归零） |

事件：`change`（步切换，detail=`{ current }`，冒泡）/ `close`（跳过或末步完成，detail 空，冒泡 + `input` 非冒泡回写 x-model）。**末步自动关**：末步「下一步」按钮文案切换为完成语义（i18n `tour.finish` 回退「完成」），点击即内部写 `visible=false` + close 广播——未接线的调用方亦能自然关闭；接线受控的调用方经 close/input 回写状态闭环。

**遮罩高亮选型（box-shadow 大投影）**：候选四块遮罩（4 元素管理）/ SVG mask（复杂度最高）/ box-shadow 大投影三案比对——**box-shadow 单元素最简**（intro.js 同款路线）：高亮框一个 fixed 元素，`box-shadow: 0 0 0 100vmax` 半透明黑即全页遮罩，圆角高亮免费、步进过渡走 CSS transition（left/top/width/height 四属性）。高亮框 `pointer-events: none`——遮罩为纯视觉层不拦截页面交互（引导期间页面仍可操作，边界声明；拦截式遮罩后续按需增补）。

**气泡组合 x-popover 的取舍（不组合，自绘简版锚定）**：x-popover 机制两点结构性不适配——①触发模型：x-popover 由宿主 hover/click 驱动（指令值不参与驱动，无程序化 visible 通道），tour 需步进程序驱动；②锚定宿主：x-popover 声明在宿主上（触发源即锚），tour 的锚是组件外动态目标（每步不同、经选择器解析），组件模板内元素无法锚定外部目标。组合 message-box × x-dialog 的先例（壳机制全盘消费）在此不成立——按任务规格的 fallback 路线**自绘 fixed 气泡 + 高亮遮罩**（image-viewer 自建 fixed 层同款裁定逻辑，渲染在 engine 宿主树内非 teleport，事件沿 DOM 冒泡外层 `@close` / `@change` 直接可收；宿主祖先链 transform/filter 时 fixed 相对该祖先的已知边界同样披露）。气泡定位自绘简版：目标下方优先、视口空间不足上翻（`data-side` 数据属性驱动方向视觉）、水平 clamp 视口 8px 边距——约 20 行纯 JS，与 x-popover 的全功能定位（12 方向 / 箭头 / floating-ui autoUpdate）按需正交；模板 `<script setup>` 无法 import 模块工具（机制通道约束），`utils/floating.ts` 不越通道强引。滚动/resize 跟随：window scroll capture（整页任意滚动容器）+ resize 监听 + 目标 ResizeObserver 重算。

**首开零闪烁协议**：气泡/高亮框 `:not([data-placed])` 时 `visibility: hidden`（display 经 x-show 切换但坐标未写定前不可见），JS 通道写完坐标后落 `data-placed`——首帧直接到位不闪 (0,0)；`data-placed` 在场后 transition 生效，步进高亮框平滑移动。关闭重开若步骤未变，坐标保留即所见即所得。

**动作钮自绘（page-header 先例）**：上一步/下一步/完成自绘轻量钮、跳过为链接式文本钮——三钮盒饰成本低于组合 autospark.button 的跨插件产物依赖（保按需加载自包含；message-box 组合 button 的对照取舍）。文案走 i18n 键 `tour.prev / next / skip / finish` 键等值判定回退硬编码中文（pagination/message-box 同款纪律，词典由使用方页面提供，不内置）。

**目标 miss 跳步**：目标选择器未命中 → `console.warn("[autospark.tour] …")` + 自动跳下一步（链式重入直至命中）；全部 miss 或末步 miss → warn + 走关闭链。steps 为空数组时打开为无操作（遮罩/气泡均不亮相）。

### 2. countdown 倒计时（other，P4）

**归类声明**：`src/components/other/countdown/`，产物 `autospark.countdown.js`，注册名 `autospark.countdown`（缺省元素名 `x-countdown`，无指令撞名）。

**API 面**：

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| time | `number` | `0` | 倒计时总时长（毫秒）；变化即重启新一轮（deadline 重算） |
| format | `string` | `"{h}:{m}:{s}"` | 格式模板：token `{d}` 天（不补零）/ `{h}` 时 / `{m}` 分 / `{s}` 秒（补零两位）；模板含 `{d}` 时 `{h}` 为日内余时（0-23），不含时为总小时（可超 24）——antd 同款语义；token 替换走 split/join（指令值正则规避的家族纪律延伸，零正则字面量） |

事件：`finish`（归零一次性派发，detail 空，冒泡；防重发标志守卫）。**onFinish 语义经事件承载**（action 通道不进组件 props——与 alert/message-box 的事件出口纪律一致）。

**语域定夺（time 毫秒时长，非绝对时间戳）**：候选「value 绝对时间戳」与「time 毫秒时长」——取 `time` 时长语域：重启语义天然（time 变化即新一轮，秒杀补货/验证码重发场景一行接线），绝对时刻场景调用方表达式 `:time="deadline - Date.now()"` 可达；反向（时长语域仿真）须自行维护 deadline 状态，成本更高。

**计时引擎（递归 setTimeout + 绝对 deadline 真值）**：真值恒为 `deadline - Date.now()`（mounted 时 `deadline = Date.now() + time`），tick 只触发重渲染不累积误差；递归 setTimeout 每跳对齐 deadline 整秒边界（`remain % 1000`）——走秒无相位漂移、finish 在截止时刻精确触发。**页面隐藏无须显式暂停**：后台标签页定时器被浏览器节流（1s → 1min）只影响刷新频率不影响正确性——真值是绝对时间，回页即正确；visibilitychange 回页监听仅做一次即时重算 + finish 补触发（节流下 finish 至多迟到 1min，回页即时补发）。unmounted 清理定时器与 document 监听（image-viewer 监听卫生同款纪律）。`time=0` 即刻归零 + finish（合法边界，非错误）。

**显示取整语义**：`Math.ceil(remain/1000)`——剩 59.95s 显示 60 秒（倒计时用户直觉：不足 1 秒按 1 秒计），归零后渲染全零（"00:00:00"）。

**与 statistic 的边界（ADR-0024 statistic 边界声明的承接）**：statistic 是静态数值展示（Intl 语言环境格式化，值由调用方给）；countdown 是时间衰减动态组件（内部驱动、随时间自走）——正交。样式复用 statistic 的数值排版语言：`font-variant-numeric: tabular-nums` 等宽数字 + 1.5em 大字重（`--x-font-weight-large`）+ em 基准随 data-size 档位全跟随（数值文本经 mounted + watch JS 直写 span——绑定表达式不含组件 methods 的引擎边界，statistic/button 同款纪律）。

## 后果

- P4 批四件中的 tour/countdown 两件全量入册；affix/watermark 由并行 ADR 承接。
- 本批固化/实证的可复制约定（后续组件照此执行）：
  1. **组合 x-popover 判定样例**：触发模型（hover/click vs 程序受控）与锚定宿主（模板内声明 vs 组件外动态目标）两点任一不适配即走自绘——机制组合不是教条；
  2. **fixed 层首开零闪烁协议**（`:not([data-placed])` visibility 隐藏 + 定位完成标记 + 标记在场后 transition 生效）——后续带定位浮层的组件件照此；
  3. **绝对 deadline 真值计时**（tick 只触发渲染、节流免疫、visibilitychange 仅补触发）——后续定时驱动组件（轮询刷新类）同构；
  4. **`<script setup>` 零 import 约束的明文化**：模板内逻辑只能用全局环境 + this 通道，模块工具（utils/）消费须走 index.ts 注册面或组件外接线——本批两件的定位/计时逻辑均控制在模板内纯 JS；
  5. **methods this 的 expando 多实例共享**（真浏览器实证，countdown 三实例同页全部跟随最后挂载实例的 deadline 同值衰减）：组件 per-instance 状态一律挂 `this.el` expando（化身宿主元素实例唯一，image-viewer 清理器先例）——`this.xxx = ...` 直挂仅限无状态方法；happy-dom 单实例用例不暴露此缺陷，**多实例同页场景进真浏览器 e2e 验收面**。
- tour 遮罩为非拦截式（pointer-events: none）：引导期间页面仍可交互是设计取舍而非缺陷，拦截式遮罩为后续增补面（props 化）；ESC 关闭、步级 placement 定制同列后续按需增补。
- countdown 不提供毫秒 token（`{ms}`）与步进间隔 props——秒级粒度是首版语域边界（毫秒级倒计时场景罕见，需要时增补）。
