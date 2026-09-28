# ADR-0061：全局工具提示（TooltipManager 与 data-tooltip 约定）

- **状态**：Accepted（共识已 grilling 三轮确认，实现未开始）
- **日期**：2026-09-28
- **关联**：[ADR-0052](0052-x-overlay-and-x-dialog.md)（at 定位体系 / body 容器 / 双通道事件 / border 键先例）、[ADR-0039](0039-animate-mechanism.md)（animate 三形态与六类名，`engine.animate` 指令无关服务）、[ADR-0007](0007-directive-options-and-modifiers.md)（relaxed-json 选项解析）、[ADR-0030](0030-rename-to-autospark.md)（单包即用——floating-ui 已打包）、[ADR-0059](0059-x-teleport.md)（addExtraRoot / 容器先例）、[ADR-0004](0004-reactive-text-interpolation.md)（属性插值 desugar）、[CONTEXT.md](../../CONTEXT.md)（「工具提示 tooltip」词条）
- **共识来源**：grilling 三轮决策（Q1~Q15 + 实现落实清单），本文即共识落盘

## 背景

需求：引擎树内任意元素**零声明**获得工具提示——`title="xxx"` 自动转换为 `data-tooltip`，引擎根级委托监听悬停/聚焦控制显隐，`@floating-ui/dom` 自动定位；`data-tooltip` 字符串形态承载 HTML 内容、`{...}` JSON 形态附加配置；默认显示 border。

塑造设计的关键事实：

1. `@floating-ui/dom` **已是 dependencies 并打包进产物**（ADR-0052 决策 23）——零新依赖；
2. overlay 体系 = **组件消费体系**（ADR-0052 v2）：`OverlayInstance` 必须持有 `ComponentDef` 快照，tooltip 无组件定义、内容由属性承载——直接复用等于把组件实例化管道虚置；
3. **实际可复用面**：`overlay/anchor.ts` 的 floating-ui 装配（`applyAnchorPosition`）、body 容器懒创建/destroy 清理模式、样式幂等注入模式、`engine.animate`（ADR-0039 决策 5：指令无关服务）；
4. `mousein` 事件不存在；根级委托须 `mouseover`/`mouseout` + `relatedTarget` 包含判定（`mouseenter`/`mouseleave` 不冒泡、无法委托）——实现事实，非决策；
5. 内置 `slide` 纵向固定（`translateY(-12px→0)`，ADR-0039 决策 12「横向走自定义动画」）——「方向与弹出方位匹配」需 tooltip 侧覆写层；
6. 属性插值 desugar 覆盖普通属性（ADR-0004）——`data-tooltip="共 {{count}} 项"` 天然响应式，零增量机制；
7. 编译铁律：HTMLElement 必须走 `transformElement`（compiler.ts）——编译期 transformer 挂此即覆盖全部子树编译通道（主 walk / x-for 项 / patch 重建 / keepalive）。

## 决策

### 一、形态与归属

#### 决策 1：引擎级子系统 TooltipManager（非指令、非 overlay 消费者）

`src/tooltip/` 的 `TooltipManager`，服务挂 engine 实例（类比 `ActionManager`/`UpdateScheduler`）。生效方式为**属性约定**而非指令声明——`title`/`data-tooltip` 不是 `x-*` 属性，与指令体系（observer 通道按 `x-*` 属性触发）正面冲突；tooltip 亦无组件定义，`OverlayDirective`/`OverlayInstance` 路线不成立。

#### 决策 2：启用开关与全局默认——`options.tooltip`

`AutoSparkOptions.tooltip`：`false` = 整体关闭（**转换、委托、监听、命令式全关**——transformer 不剥 `title`，原生行为保留；`engine.tooltip.show()` warn + no-op，不给「半开」状态）| 配置对象 = 全局默认（与元素级保留键**同构**，元素级覆盖全局）；缺省 = 默认开启 + 内置默认。全局对象的 `content` 键无场景但**不特判**（静默，对齐 overlay「删干净不设防」立场）。

#### 决策 3：复用边界

- **复用**：`applyAnchorPosition` 的 floating-ui 装装逻辑（提取共享/泛化签名供 overlay 与 tooltip 双消费——实现期落定具体形态）、箭头菱形伪元素视觉协议（载体类名 tooltip 侧为 `autospark-tooltip-arrow`）、容器懒创建 + destroy 清理、样式幂等注入 head、`engine.animate` 服务、relaxed-json 解析、`dispatcher.addExtraRoot` 心智；
- **不复用**：`OverlayInstance`（组件管道虚置）、`autospark-overlays` 容器（组件实例领地）、overlay 事件与打开栈。

### 二、属性约定与转换

#### 决策 4：`title` → `data-tooltip` 编译期转换

编译期 transformer（`transformElement` 前置层）：`title` 存在且无 `data-tooltip` → 转移值并剥 `title`；两者并存 → `data-tooltip` 优先、仅剥 `title`（原生 tooltip 与自定义浮层同屏双显是 bug）；无 `title` → 不动。转换后结果 DOM 无 `title`，原生浏览器 tooltip 从根上不可能出现；x-for 每项克隆、patch 重建、keepalive 通道经 `transformElement` 统一覆盖。

**悬停时读 `title` 的路线被否决**：浏览器原生 tooltip 无法抑制，必双显。

#### 决策 5：转换范围与逃生门

转换仅发生于编译树，**含引擎根自身**（`engine.template` 含容器克隆）。手动注入引擎树的 DOM 不经编译、不剥 `title`，但手写 `data-tooltip` 经委托监听**照常生效**（悬停时现读属性，无需编译参与——转换与消费两机制正交）。v1 不做 a11y 补偿（`aria-label`/`aria-describedby`）、不做原生 `title` 保留逃生门（YAGNI，fast-follow）。

#### 决策 6：内容响应式 = 下次悬停生效

属性插值免费获得（决策事实 6）：`:data-tooltip` / `data-tooltip="{{expr}}"` 更新 attribute，TooltipManager **悬停时现读**——下次悬停即新内容；显示中不热更（KISS）。空值（含表达式求值为 `''`）→ 静默不显示。

### 三、值语法与配置

#### 决策 7：值两栖——字符串 HTML / JSON 配置

- `data-tooltip="纯文本或 <b>HTML</b>"`：整个值为内容，`innerHTML` 直注（信任模板作者，对齐 x-html 立场，无消毒）；
- `data-tooltip="{content: '...', placement: 'left', ...}"`：`{` 开头即 relaxed-json 配置（kebab 裸键支持，ADR-0007）；`content` 键载内容，缺失 → warn 空内容；不设转义机制——内容恰以 `{` 开头须写 JSON 形态（文档声明）。

#### 决策 8：保留键封闭清单

`content` / `placement` / `offset` / `shift` / `flip` / `arrow` / `showDelay` / `hideDelay` / `className` / `border` / `animate`。定位五键透传 floating-ui（词汇对齐，ADR-0052 决策 24 先例）；未知键 **warn + 忽略**（对齐 x-define 未知修饰符先例）。

内置默认：`placement: 'top'`（flip 兜底）、`arrow: true`、`border: true`、`showDelay: 0`、`hideDelay: 80`、`animate: 'slide'`。

#### 决策 9：配色定制走 CSS 变量（对齐 overlay 契约）

`--autospark-tooltip-border`（边框色）/ `--autospark-tooltip-bg`（面板背景色）；默认视觉**暗底白字 + 1px border**，样式幂等注入 head，用户 CSS 可覆盖。

### 四、交互语义

#### 决策 10：委托命中语义

`e.target.closest("[data-tooltip]")` 取最近祖先——悬停 data-tooltip 元素的后代同样触发；嵌套 data-tooltip 取最近者。`mouseover`/`mouseout` + `relatedTarget` 包含判定抑制元素内部移动的伪离场。

#### 决策 11：单例浮层 + 延迟防抖

每引擎**一个共享浮层**（内容随悬停目标切换），天然保证同时至多一个可见。`showDelay`（默认 0）悬停后延迟显示；`hideDelay`（默认 80）离开后延迟隐藏，期间重新进入取消隐藏——跨目标快速移动防闪烁。延迟计时互斥：悬停 A 计时中移至 B → 取消 A、重启 B。

#### 决策 12：键盘可达（focusin/focusout）

`focusin`/`focusout` 与 hover 同管道驱动单例浮层（带 `title` 的元素多为按钮/链接，键盘不可达是硬伤；成本 ≈ 20 行）。hover + focus 同元素并存时单例天然只显示一份。

#### 决策 13：边界兜底

- 显示期间触发元素 `isConnected === false`（x-for 回收 / patch / DOM 移除）→ 立即隐藏（移除无事件，渲染帧兜底检查）；
- `engine.stop()` 同步隐藏，`destroy()` 摘除容器；
- 嵌套引擎：委托命中时按 scope 链判定元素归属引擎，只由归属引擎的 TooltipManager 响应（防父引擎与子引擎双显）；
- 触摸设备无专属逻辑——点按的合成 mouse 事件自然退化可用，长按显提示不做（fast-follow）；
- SSR `typeof document` 守卫（overlay 先例）。

### 五、定位与视觉

#### 决策 14：定位——placement 默认 top + flip，复用 anchor 装配

`placement` 默认 `'top'`（tooltip 业界惯例）+ flip 视口翻转兜底；不支持 `'auto'`（autoPlacement 对小浮层意义有限且与惯例不符）。`offset`/`shift`/`flip`/`arrow` 透传；`arrow` 默认开启（复用菱形伪元素视觉，载体类名 `autospark-tooltip-arrow`，floating-ui 官方协议 staticSide 反偏）；最终方向写回 `data-tooltip-placement`（`data-overlay-placement` 契约先例）。

#### 决策 15：挂载——每引擎独立容器

`<div class="autospark-tooltips">` 挂 `document.body`，首个 tooltip 显示时懒创建，`engine.destroy()` 整体移除（overlays 容器先例；不塞入 overlays 容器——那是组件实例领地）。tooltip 内容为静态 HTML 无响应式绑定，**不需注册额外观察根**。x-dialog 内容渲染在 body 容器、物理上在引擎根之外——**overlay 容器一并注册为委托监听点**（`addExtraRoot` 同构心智，一行成本，消除 dialog 内 title 退回原生 tooltip 的坑）。

### 六、动画

#### 决策 16：默认 `slide` + 方向自适应覆写层

默认 `animate: 'slide'` **复用全局内置类名**（ADR-0039），TooltipManager 注入 specificity 更高的覆写 CSS——按 `data-tooltip-placement` 属性选择器把 from 值换为 CSS 变量，滑入方向自动匹配弹出方位（top → 自锚侧下方 6px 滑入；离场向锚侧滑出，`leave-to` = `enter-from` 同值视觉对称）：

```css
.autospark-tooltip[data-tooltip-placement^="top"]    { --tip-slide-from: translateY(6px);  }
.autospark-tooltip[data-tooltip-placement^="bottom"] { --tip-slide-from: translateY(-6px); }
.autospark-tooltip[data-tooltip-placement^="left"]   { --tip-slide-from: translateX(6px);  }
.autospark-tooltip[data-tooltip-placement^="right"]  { --tip-slide-from: translateX(-6px); }
.autospark-tooltip.slide-enter-active,
.autospark-tooltip.slide-leave-active { transition-duration: .15s; }
```

红利：flip/autoUpdate 运行中改向时动画方向**自动跟随**（纯 CSS，零 JS）；默认时长覆写 150ms（tooltip 高频场景，300ms 偏晃），`animate: {duration}` 对象形态仍可覆盖；`animate: 'fade'` / 自定义动画 / `false` 照常（六类名机制通用）；非 tooltip 元素的 slide 不受影响（覆写带 `.autospark-tooltip` 限定）。显隐经 `engine.animate.enter/leave` 驱动（指令无关服务，ADR-0039 决策 5），离场 onDone 延迟隐藏、切换目标时抢占语义（cancel = 同步完成）天然复用。

### 七、事件与命令式 API

#### 决策 17：双通道事件 `tooltip:show` / `tooltip:hide`

浮层元素 `dispatchEvent` + 引擎事件总线双通道（浮层 DOM 在 body 下，引擎树内物理收不到冒泡——ADR-0052 决策 13 同构约束）。payload `{ el, tip }`（`el` = 触发元素，`tip` = 浮层单例元素，可读 `tip.innerHTML` / `data-tooltip-placement`）。**一切隐藏路径均广播 hide**：移出、聚焦离场、断连兜底、`stop()`、命令式 `hide()`。

#### 决策 18：命令式——`engine.tooltip` 命名空间

`engine.tooltip.show(el, opts?)` / `engine.tooltip.hide()`（命名空间子对象，引擎表面不膨胀——`engine.actions` 先例）。`opts` 与元素级保留键**同构**，单次 `show` 生效、覆盖该元素属性解析结果；`content` 键在命令式有真实价值（无 DOM 属性注入内容——动态提示、测试）。非持久覆盖。`options.tooltip: false` 时调用 warn + no-op（决策 2 全关语义）。

## 被否决的方案

- **箭头覆盖层朝面板内侧偏移（translate 4~6px）**：嵌入深度 = 偏移 + 覆盖层半对角，随偏移线性加深（12×12 载体下达 15.3px）突破 padding 盖住文字首行；配套的「箭头侧 padding 让位（14px）」又破坏内容居中。同心外扩（零偏移）下嵌入恒 = 半对角 8.49px，被 padding + 行盒留白天然容纳——露出视觉不受影响（半对角决定，非偏移）。
- **Runtime 指令形态（`x-tips`）**：observer 通道按 `x-*` 属性触发，`title`/`data-tooltip` 约定式生效与指令体系正面冲突；每元素一指令实例与单例浮层模型不合。
- **overlay 家族消费者（继承 `OverlayDirective`）**：`OverlayInstance` 必须持组件 def 快照，tooltip 无组件定义——组件实例化管道被虚置。
- **复用 `autospark-overlays` 容器**：组件实例领地，语义混杂；tooltip 独立容器 destroy 干净。
- **悬停时读 `title`**：浏览器原生 tooltip 无法抑制，与自定义浮层同屏双显。
- **`mouseenter`/`mouseleave`**：不冒泡，根级委托不可行（实现事实）。
- **默认开启 a11y 补偿 / 原生 title 逃生门**：无场景输入，YAGNI——fast-follow 清单。
- **placement 默认 `'auto'`**：autoPlacement 对小浮层意义有限；`'top'` 是 tooltip 业界惯例。
- **事件仅总线单通道**：丢失「不经引擎实例监听」通道，违背 overlay 双通道先例。
- **在触发元素上派发事件**：`@` 语法对带冒号事件名支持需额外验证，payload 已含触发元素引用、价值边际。
- **tooltip 专用动画名（`tip-slide-*` 六类名）**：复用全局 `slide` 类名 + `.autospark-tooltip` 限定覆写更简洁——零新动画名、用户认知一致（`animate:'slide'` 语义同源）、非 tooltip 场景零影响。
- **直接使用内置 slide（纵向固定）**：不满足「方向与弹出方位匹配」（ADR-0039 决策 12 的既有边界）。
- **触摸长按显提示**：合成 mouse 事件已自然退化可用，无场景压力。
- **显示中热更内容**：高频悬停下无场景，下次悬停现读已覆盖响应式诉求（KISS）。
- **单键 `delay`**：show/hide 两相默认值不同（0/80），单键表达不了；拆 `showDelay`/`hideDelay`。

## 后果

- ✅ 引擎树内零声明获得工具提示：存量模板的 `title` 升级为统一样式浮层，无迁移成本。
- ✅ 零新依赖、零新机制：floating-ui / animate / 容器模式 / relaxed-json 全部现成。
- ⚠️ `title` 剥除是全局行为变更：启用引擎的原生 tooltip 全部替换（a11y 短板 v1 存在，文档标注 + fast-follow）。
- ⚠️ 单例浮层：同引擎同时至多一个 tooltip 可见（业界惯例，触摸多指场景无支持）。
- ⚠️ `data-tooltip` HTML 无消毒：信任模板作者（与 x-html 同立场），文档标注。
- ⚠️ overlay 容器纳入监听：dialog 内 hover 生效，但监听点数量随打开 overlay 数增长（常数级，可忽略）。

## 测试

`src/__tests__/tooltip.test.ts`：title 转换三态（转移 / 并存剥除 / 不动）、data-tooltip 优先、字符串与 JSON 两态、保留键 warn、未知键 warn、单例切换、showDelay/hideDelay 计时（定时器推进）、focusin/focusout、closest 嵌套命中、空值静默、断连兜底、placement 写回（happy-dom `await nextTick()` 断言 `data-tooltip-placement`，循 `x-overlay.test.ts` 模式）、动画类挂摘 + 超时兜底（happy-dom 无真实 transition）、事件双通道 payload、命令式 show/hide、`tooltip: false` 全关（title 保留原生）、嵌套引擎归属过滤、destroy 容器摘除。

## fast-follow 清单

1. a11y：`role="tooltip"` + `aria-describedby` 动态关联、转换时补 `aria-label`。
2. 原生 `title` 保留逃生门（`data-tooltip-native` 类属性）。
3. 触屏长按显提示。
4. 显示中内容热更（如有真实场景）。
5. 命令式 `engine.tooltip` 扩展位（如配置级默认 content fallback）。

## 废止

- 无。全新特性，无既有词条受影响；CONTEXT.md 登记词条「工具提示 tooltip」，`data-tips` / `autospark-tip`（grilling 过程中的过渡命名）入 Avoid 列表。

## 修订记录（实现期，2026-09-28）

实施中经测试暴露四处语义细化，随实现一并落盘：

| # | 原表述 | 现行语义 |
|---|---|---|
| 1 | 决策 7「innerHTML 直注，无消毒」 | 内容经 `options.sanitizer`（缺省内置极简 `sanitizeHtml`）消毒——**x-html 同通道**；原表述与 x-html 的实际安全姿态不符。不设 `.raw` 逃生门（fast-follow） |
| 2 | 决策 4「编译期 transformer 转换 title」 | **静态 `title` 转换双挂点**：主 walk 前置 transformer + `compileChild` 块根 clone 行——项根/x-loading 块根/组件根绕过 transformElement（ownsChildren 既有设计），不经 transformer 链（同 `_compileAttrInterpolation` 的「项根须补」先例）。**绑定形态 `:title`/`x-bind:title` 的重定向由 `BindDirective.created` 承担**（写回落 `data-tooltip`）——`scope.compile()` 从只读模板收集指令（scope.ts:751），clone 侧转换拦不住绑定注册，bind 层重定向天然覆盖主 walk / 项根 / patch / x-model schema 合成 bind 全通道 |
| 3 | 决策 13「显示期间 `isConnected === false` → 隐藏」 | 兜底语义细化为**「曾连接 → 断开」跳变**（rAF 逐帧比对上一帧连接态）——detached 树内的悬停/命令式 show（测试挂载、离屏构建）不误杀，挂载后被移除才触发 |
| 4 | 决策 11（未及） | **移入浮层内不隐藏**（可交互 tooltip）：`relatedTarget` 落在浮层内时取消延迟隐藏——浮层内有链接/按钮可 hover 的场景（`hideDelay` 防抖窗口之外显式取消） |
| 5 | 决策 18（未细化） | 命令式 `show(el, opts)` 的 `content` 键**优先于属性解析**（opts.content 存在时跳过 `data-tooltip` 属性读取）——无 DOM 属性注入内容是命令式的核心价值 |
| 6 | 决策 14「复用 overlay 菱形伪元素视觉协议」（8×8 载体 / 让位 6px） | 箭头放大为 **10×10 载体 + 让位 8px**（`TooltipManager.ARROW_DEFAULT_OFFSET`，仅 tooltip 侧——共享底座的 6px 默认仍是 overlay 的 8×8 几何）：露出尖角 ≈8.5px（原 5.66px），尖端轻微搭住锚边缘（越界 ≈0.5px）。**覆盖层同心、零偏移**：`::after` 外扩 2px（10→12，半对角 8.49）盖住嵌入段边框色、露出段 ≈1.4px 均匀环带（箭头描边）——曾有「覆盖层朝面板内侧偏移」的版本，嵌入深度随偏移线性加深（15.3px）突破 padding 盖住文字、且侧向 padding 让位破坏内容居中，均被否决；同心嵌入恒 = 半对角 8.49 < padding 7 + 行盒留白，内容零遮挡且居中。几何参数以 styles.ts / manager.ts 注释为准 |
| 7 | 决策 8 保留键清单（11 键）/ 浮层 `max-width: 280px` 硬编码 | 新增保留键 **`maxWidth` / `maxHeight`**（数字 = px、字符串透传 CSS；清单扩至 13 键）——浮层默认约束改为 CSS 变量 **`70vw` / 70vh**（`--autospark-tooltip-max-w/-max-h`，元素级 inline 覆盖）。溢出行为：内容先按宽度 wrap、超出高度的行经 **-webkit-line-clamp** 截断显示省略号（显示帧同步测量行数 = ⌊内容区高 / 行高⌋，有溢出才切换 -webkit-box；happy-dom 无布局环境跳过）——纯文本与富 HTML 内联内容均优雅，宽度与高度两维协同（先 wrap 后 clamp） |
| 8 | 决策 11「移入浮层取消隐藏」/ `hideDelay` 默认 80 | 可交互 tooltip 落地加固：① **浮层容器注册为委托监听点**（`_ensureTip` 时 `attachDelegationRoot`）——浮层挂 body 下、引擎根监听不可达，原实现浮层内 mouseover/out 全部失聪，「移入浮层取消隐藏」从未实际生效（真实缺陷，非增强）；② **浮层内移出补出口**（mouseout 且 related 不回浮层 → 延迟隐藏）；③ **离场动画播中移回浮层恢复显示**（idle 且浮层可见 → 取消离场、按 `_lastTarget` 重播）；④ `hideDelay` 默认 80 → **150**（给鼠标跨越让位间隙移入浮层的反应时间） |

测试修正记录：10 个存量用例（interpolation / x-bind / x-bind-config / engine-patch / x-else / x-model-schema-inject / x-model-select）断言 `title` 属性行为——用例本意是测 bind/插值/patch/schema 注入机制，与 ADR-0061 无关，改传 `options.tooltip: false` 保持原意（x-model 两个用例改为断言 `data-tooltip`，固化「schema 注入经合成 bind 自动重定向」的新行为）。

