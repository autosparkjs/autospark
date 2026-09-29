---
title: 对比评测：AutoSpark vs Vue 3 vs Alpine.js
---

# 对比评测：AutoSpark vs Vue 3 vs Alpine.js

> **评测日期**：2026-09-29
> **评测对象**：Vue 3.5.43（`vue.global.prod.js`）、Alpine.js 3.17.4（`dist/cdn.min.js`）、AutoSpark（本仓库 `packages/engine`，`bun run build` 产物 `dist/index.global.js`）

## 一、评测口径

在开始之前，先把「比什么、怎么比」说清楚，否则对比评测极易变成各说各话：

1. **只比框架自身内置能力**。生态、第三方库、工具链的能力不计入框架能力。唯一的例外是[第七章](#七、包体积与综合成本)——那里会额外给出「要在 Vue/Alpine 上补齐同等能力需要叠加多少体积」的参照数据。
2. **体积全部实测**。官方 CDN 产物或本地构建产物，经 Node `zlib.gzip` 压缩后取值，不引用厂商宣传数字，也不引用没有测试环境说明的性能跑分。
3. **性能只讲机制**。「谁更快」依赖数据规模、更新频率、浏览器等一长串变量，脱离环境的数字没有意义；本文化解三者的渲染与调度机制差异，把判断依据交给读者。
4. **指令清单以注册表为准**：Vue 取官方 Built-in Directives 页（15 条），Alpine 取官方文档 `directives/` 目录（18 条），AutoSpark 取 `presetDirectives` 注册表（31 条，`packages/engine/src/directives/presets/index.ts:82`）。

### 1.1 评测对象速览

| 维度 | Vue 3.5.43 | Alpine.js 3.17.4 | AutoSpark |
| --- | --- | --- | --- |
| **定位** | 以组件为核心的全功能框架 | 以 HTML 为核心的轻量增强器 | 声明式响应式模板引擎，可独立构建应用 |
| **模板形态** | SFC（`.vue`）/ JSX / 运行时 HTML 模板 | 原生 HTML + `x-*` | 原生 HTML + `x-*` / `@*` / `:*` / `{{}}` |
| **状态层** | 内置 reactivity（`ref`/`reactive`/`effect`） | `x-data` 局域响应式 + `$store` | AutoStore（计算属性 / 异步计算 / 监听 / 批量更新），随包全量转导出 |
| **渲染模型** | 虚拟 DOM + diff + patch | 表达式级 effect + 直接 DOM 操作 | 编译期重建运行树 + 细粒度 patch（**无 VNode**） |
| **组件系统** | 完整（SFC + Composition API + 插槽 + 生命周期） | **无组件系统** | `x-define` / `x-component` / `x-slot` / `x-import` |
| **SSR** | 内置 | 有限 | 无（客户端引擎） |

一个容易被名字误导的事实：AutoSpark 虽然叫「模板引擎」，但它是与 Vue、Alpine.js 同属一类的**响应式前端应用框架**——状态层、指令层、组件层、动作层齐备，可以直接从零搭建完整的交互式应用（见[首页说明](../index.md)）。

---

## 二、AutoSpark 的设计理念（总结）

AutoSpark 与 Vue / Alpine 的差异不是「功能多少」，而是**设计理念不同**。四条核心理念彼此咬合，理解了它们，后面所有对比项都能顺理成章地推出结论。

### 2.1 全响应式——状态是唯一事实来源

**理念**：应用里一切会变的东西都应该是响应式的，而不只是「文本跟着变量变」。

在 AutoSpark 里，被响应式覆盖的远不止视图绑定：

| 被响应式化的对象 | 表现 |
| --- | --- |
| 视图绑定 | 状态变更 → 只重写订阅了该路径的节点 |
| 表达式依赖 | `x-text="a + b"` 这类表达式自动收集依赖，依赖集变化时**漂移重订** |
| 结构指令 | `x-if` / `x-switch` 的分支选择、`x-for` 的列表项复用 |
| 覆盖物显隐 | `x-dialog:login="ui.loginVisible"`——**visible 是唯一真相源**，关闭自动回写 `false` |
| 动作生命周期 | 异步 action 的 `pending` / `resolved` / `rejected` 自动广播，`x-loading` 与 `.feedback` 直接消费 |
| 表单状态 | `$form.valid` / `$form.dirty` / `$form.errors` 随字段输入实时派生 |
| 异步数据 | `x-data` 异步源、`x-html` 异步源、`x-import` 远程组件到位即渲染 |
| 图标异步加载 | 远程图标集**未就绪占位、就绪后自动唤醒**待决实例 |
| 配置绑定 | `@` 配置引用经 configManager 订阅，配置中心一变界面即变 |

实现底座是 AutoStore 的路径订阅 + 引擎的双轨 `watch`（`packages/engine/src/scope.ts:773`）：**纯标识符路径走精准订阅**（编译期就确定绝对路径，直连 `store.watch(path)`），**含运算符 / 函数调用的表达式走依赖收集**（`new Function` + `with(scope)` 求值，运行时收集读依赖、依赖集变化即重订）。两条轨的回调都只做一件事——`scheduler.schedule()`，微任务 flush 时 `Set` 天然去重（`src/scheduler.ts:39`），再由各指令的 `updateFn` **重新求值**取累积结果。

**与 Vue / Alpine 的差别**：

- Vue：状态变更 → **组件级重渲染** → 构建 VNode 树 → diff → patch。粒度是组件，组件越大重跑越多。
- Alpine：`x-data` 内的表达式挂 effect，**每次触发都重新执行整段表达式并重收集依赖**，粒度是表达式，但没有跨表达式的调度合并策略。
- AutoSpark：粒度是**指令 × 状态路径**，且同一 tick 的多次变更合并为一次 patch，更新路径最短，且**不重建子树**——焦点、滚动位置、未提交的输入等运行态天然保留。

> 一句话：全响应式不是「多几个响应式 API」，而是**把「什么该随状态变」这件事从应用代码里彻底拿掉**。

### 2.2 基础能力内置——综合成本最低

**理念**：tooltip、对话框、弹出层、图标这类能力，**不是可选的装饰，而是任何应用都应当具备的基础能力**。传统上它们由基于 Vue / Alpine 的组件库实现；AutoSpark 把它们做进引擎。

作者的判断是：**内置确实增加了包大小，但对最终应用而言，综合成本却是最低的。**

这个判断背后的账要这么算——一个能力有三种成本：

1. **显性成本**：体积。这是唯一能直接量化的，也是内置方案唯一「变贵」的地方。
2. **隐性成本**：集成。选型、装包、对版本、配构建、接样式体系、写胶水代码、读三份互不相干的文档。在 Vue 里做一个「带定位的对话框」，至少要同时协调组件库、定位库、状态三者的版本与 API。
3. **一致性成本**：长期维护。第二套 API 就是第二种心智；组件库的 `size` 语义与引擎的 `size` 语义、组件库的动画类名与引擎的动画契约，迟早打架。升级时两套体系各自 breaking change，排查问题要先确定「这是谁的行为」。

内置把 2 和 3 归零，代价只是 1。而 1 是**一次性的、可量化的、随时间递减的**（用户带宽与设备性能持续增长），2 和 3 却是**每次都发生、且随项目规模线性放大的**。

内置之后获得的附加收益是**能力之间的免费联动**——这是组件库给不了的：

- 图标、覆盖物、动画、动作、表单用的是**同一套配置体系**（指令选项 → 宿主 `x-options` → 引擎级默认 → 内置默认，见[指令配置](../guide/directive/config.md)）；
- 弹层关闭、`ESC`、遮罩点击走的是**同一个全局打开栈**（`ADR-0052`）；
- `x-loading` 能直接订阅 action 生命周期，因为 action 也是引擎的一等公民（[动作](../guide/action.md)）；
- 抽屉的 `resize` 能复用 `x-resize` 的 `ResizeSession`，因为两者同源（`ADR-0064`）。

> 体积数据见[第七章](#七、包体积与综合成本)：AutoSpark 全量产物 104.9 KiB gzip，比 Vue full build 多 44.9 KiB，比 Alpine 多 85.4 KiB。

### 2.3 可扩展——内置不等于封闭

**理念**：内置的是**默认值**，不是**天花板**。

最能说明问题的是覆盖物的 shell 机制（`ADR-0062`）：默认对话框面板是引擎内置的，但面板形态被抽成了**可替换的普通组件**——开发者对默认外观不满意时，可以直接换掉：

```html
<!-- 自定义外壳：x-slot 默认出口 = 内容组件渲染点 -->
<div x-define="fancy-shell" class="fancy-shell" :data-theme="theme">
    <header class="bar"></header>
    <div class="body"><div x-slot></div></div>
</div>

<!-- 消费处指定（配置整包注入 shell 数据域，theme 等自由键 shell 模板可直接消费） -->
<button x-dialog:login="ui.loginVisible" x-dialog-options="{shell: 'fancy-shell', theme: 'teal'}">登录</button>
```

求值链有四层：`x-dialog-options.shell`（成员表达式，**打开时求值一次**）→ 宿主 `x-options` → 引擎级默认 `options.overlay.dialog.shell`（**全站换肤的单一配置点**）→ 内置 `dialog-shell`。ADR 里有一句关键的实现约束：**内置 shell 就是「一个普通的 shell」（默认值而非特殊分支）**，所有覆盖物实例（声明式 / 命令式）走同一条「内容编译 → shell 编译 → 组装挂载」路径，没有双路径行为漂移。

同理，视觉层留了三层逃生口：CSS 变量（`--autospark-overlay-z / -bg / -border / -radius`）、类名契约（`.autospark-dialog` / `.autospark-dialog-mask` / `.autospark-overlay-arrow`）、以及完全自写 shell。**自定义外壳复用类名即继承默认视觉，完全自写则完全自由。**

引擎级的扩展通道见[第六章](#六、扩展性实测-内置怎么改成自己的)。

### 2.4 无需 Vue 式的编译过程——HTML 就是模板

**理念**：模板应该能直接交付，而不是必须先进构建器。

| | Vue | AutoSpark | Alpine |
| --- | --- | --- | --- |
| **编译发生在哪** | **构建期**：`.vue` → 经 vite/webpack + loader → render 函数 | **浏览器首帧**：一次性重建运行树 | **元素初始化时**：逐指令现场编译表达式 |
| **需要工具链** | 需要（Node + 打包器 + loader/plugin 版本矩阵） | **不需要**（`<script>` 引入即用） | 不需要 |
| **之后还解析模板吗** | 不（render 函数已生成） | **不**（运行树已重建、指令属性已剥除） | 持续（每次 effect 重跑重新编译求值） |

AutoSpark 的「编译」发生在浏览器里，但**性质与 Alpine 不同**：它深度优先重建整棵模板树、剥除指令属性、为每条指令注册好订阅（`src/compile/compiler.ts:792`），**一次性完成**；此后状态更新不再触碰模板解析，只做定点 patch。某种意义上，它把 Vue 在构建期做的事搬到了浏览器首帧执行——于是既拿到了**零构建**，又避开了「每次更新都重新解释模板」的成本。

**收益**：零构建依赖（首页称其为「零编译时依赖」）、无工具链版本矩阵、CDN 一个 `<script>` 即可点亮任意 DOM 子树、HTML 可直接作为交付物。
**代价**：首帧要付一次编译成本；无 SSR / 水合；运行时编译要求完整 DOM 环境（源码中以 `typeof document` 守卫降级）。

> 需要澄清一处常见误解：Vue 的 CDN full build（`vue.global.prod.js`）同样能在浏览器编译模板——但代价是多背一个编译器（实测 60.0 KiB gzip vs runtime-only 40.3 KiB），且脱离了 SFC 生态。**「不需要 Vue 式的编译过程」指的是不需要 SFC 构建链路，而不是「Vue 不能在浏览器跑」。**

### 2.5 四条理念的咬合关系

| 理念 | 支撑机制 | 换来的 | 付出的 |
| --- | --- | --- | --- |
| 全响应式 | AutoStore 路径订阅 + 双轨 watch + 微任务调度 | 应用代码里没有「手动同步 UI」这件事 | 表达式轨需要依赖收集与漂移重订 |
| 基础能力内置 | 图标 / 覆盖物 / 树 / 表单 / 虚拟列表全部做成引擎机制 | 综合成本最低、能力免费联动 | 包体积最大（104.9 KiB gzip） |
| 可扩展 | shell 组件化、四层配置链、CSS 变量、自定义指令 | 内置的是默认值而非天花板 | 配置体系复杂度上升（需文档化优先级） |
| 无需构建编译 | 浏览器内一次性预编译运行树 | 零工具链、HTML-first | 首帧编译成本、无 SSR |

四者是**互相成立**的：不全响应式，内置能力就只能是「黑盒组件」；不内置，综合成本就下不来；不可扩展，内置就变成强制；不零构建，「基础能力开箱可用」就会被构建配置稀释。

---

## 三、架构与渲染机制对比

| 维度 | Vue 3 | Alpine.js | AutoSpark |
| --- | --- | --- | --- |
| **编译时机** | 构建期：SFC → render 函数 | 运行时：逐指令解释 | 浏览器首帧：一次性重建运行树 |
| **中间表示** | VNode 树 | 无 | 无（直接是 DOM 运行树） |
| **更新粒度** | 组件级 | 表达式级 | **指令 × 状态路径** |
| **批处理** | `nextTick` 合并 | 无（同步逐条写） | **微任务 `Set` 天然去重**（`src/scheduler.ts:39`） |
| **列表更新** | key-based diff，O(n) | 逐项重跑 | `x-for` 自带 key-based 四趟 diff + 复用（`src/directives/presets/for.ts:1120`） |
| **大数据量方案** | 需第三方虚拟滚动库 | 需第三方 | **内置 `x-for.virtual` / `x-for.paging`** |
| **运行态保留** | 依赖 diff 精确性（同标签通常保留） | 直写保留 | **不重建子树，焦点 / 滚动 / 输入天然保留** |
| **GC 压力** | 中高（VNode 短命对象） | 低 | 低（无 VNode） |
| **指令通道** | 单一（编译进 render） | 单一 | **双通道**：Compile（剥属性 + scope 订阅）/ Runtime（保留属性 + 共享 MutationObserver）（`ADR-0001`） |

几个值得注意的机制细节：

- **指令属性会被剥除**。编译时 `removeDirectives(el, "x-")` 把 `x-*` 属性从运行树里移除（`src/compile/compiler.ts:804`），只有少数 Runtime 指令（目前仅 `x-loading`）保留属性由单一 `MutationObserver` 分发器监听——**全库只开一个 observer**，这与 Alpine 早期因全量 DOM 扫描导致的卡顿问题（其 GitHub Issues #566 / #570 有记录）是两种思路。
- **更新是「重求值 + 单点写」**，不是「重建 + diff」。watcher 回调只标脏，flush 时 updateFn 重新求值并直接写 DOM，属性写入走五路分派（`src/directives/utils/attrPatch.ts:67`）。
- **运行时局部换模板**：`engine.patch(selector, updater)` 支持四态返回值决定重建语义（`ADR-0002`），且有冲突防护——不允许 patch 落入 `x-for` / eager `x-if` 等动态区域。Vue 里对应能力通常是动态组件 `<component :is>` 或 `v-if` 切换。

---

## 四、指令与能力全景

AutoSpark 注册 **31 条**指令，Vue 内置 **15 条**，Alpine 内置 **18 条**。

### 4.1 能力域对照

| 能力域 | Vue 3 | Alpine.js | AutoSpark |
| --- | --- | --- | --- |
| 条件渲染 | `v-if` / `v-else-if` / `v-else` | `x-if` / `x-show`（无 else） | `x-if` / `x-else-if` / `x-else` / `x-show` / **`x-switch` + `x-case`** |
| 列表渲染 | `v-for` | `x-for` | `x-for`（含 **`.virtual` 虚拟列表**、**`.paging` 分页**） |
| 树形渲染 | 无（需第三方） | 无 | **`x-tree`**（递归渲染 + 展开 + 复选级联 + 拖拽） |
| 绑定 / 事件 | `v-bind` / `v-on` | `x-bind` / `x-on` | `x-bind`（`.invert`、属性展开）/ `x-on`（action、`.feedback`、`.debounce`） |
| 双向绑定 | `v-model` | `x-model` | `x-model` + **`x-field` 字段级绑定** |
| 表单整体能力 | 无（需第三方） | 无 | **`x-form`**（校验门 / reset 快照 / 错误显示 / 跨字段联动） |
| 组件 | SFC + Composition API + 插槽 | **无组件系统** | `x-define` / `x-component` / `x-slot` / `x-import` |
| 传送 | `<Teleport>` 组件 | `x-teleport` | `x-teleport` |
| 动画 | `<Transition>` 组件 | `x-transition` | **`animate` 指令选项**（六类名契约，内置 fade/slide/expand，`ADR-0039`） |
| 保活 | `<KeepAlive>` 组件 | 无 | `x-if.keepalive` / `x-switch.keepalive` 修饰符 |
| 加载态 | 无 | 无 | **`x-loading`**（唯一 Runtime 指令，订阅 action / 状态） |
| 对话框 / 抽屉 / 弹层 | **组件库**（Element Plus 等） | **三方插件或手写** | **`x-dialog` / `x-drawer` / `x-popover`** |
| 工具提示 | **三方**（tippy / @vueuse） | **三方**（tippy 等） | **全局 tooltip**（`data-tooltip`，零声明，`ADR-0061`） |
| 图标 | **图标包**（@element-plus/icons 等） | **图标包 / 手写 SVG** | **`x-icon` / `x-icons`**（symbol + `<use>`，远程 Iconify，`ADR-0058`） |
| 尺寸拖拽 | 无 | 无 | **`x-resize`**（手柄 + 键盘可达 + 钳制管线，`ADR-0064`） |
| 动作体系 | 无（需自行封装） | 无 | **action 注册 + 双通道广播 + 生命周期信号** |
| 异步数据源 | 无（自行 `fetch` + `onMounted`） | 无 | **`x-data` 异步源** / `x-html` 异步源 / `x-import` |
| 运行时局部换模板 | 动态组件 | 无 | **`engine.patch()`**（`ADR-0002`） |
| 独立子应用边界 | 多 app 实例 | `x-ignore`（弱） | **`x-isolate`**（独立 engine + 选项透传） |

### 4.2 三者对比，只有 AutoSpark 内置的能力（19 条）

`x-switch` / `x-case` / `x-default`、`x-tree`、`x-data`、`x-loading`、`x-isolate`、`x-scope`、`x-dialog`、`x-drawer`、`x-popover`、`x-component`、`x-define`、`x-import`、`x-form`、`x-field`、`x-icon` / `x-icons`、`x-resize`

反向也如实列出 **AutoSpark 缺失**的：`v-pre` / `v-once` / `v-memo` / `v-cloak`、`x-init`、`x-effect`、`x-ref`、`x-modelable`、以及 Vue 的 SSR 与完整组件生态。

---

## 五、UI 能力内置：把组件库的活做进引擎

这是本次评测最想讲清楚的部分——**`x-icon`、`x-dialog`、`x-popover` 这类能力，传统上属于组件库的领地，AutoSpark 为什么要把它们做成内置指令？**

### 5.1 传统路径长什么样

**在 Vue 里**，做一个「带定位的悬浮提示」，官方框架本身没有任何内置：`<Tooltip>` / `<Dialog>` / `<Popover>` / `<Drawer>` 全部来自组件库（Element Plus、Naive UI、Ant Design Vue……），图标来自图标包（`@element-plus/icons-vue` 等），定位来自 tippy.js 或 `@vueuse/core`。你会得到三套依赖、三套 API、三套样式体系。

**在 Alpine 里**，官方插件只有 `anchor` / `collapse` / `focus` / `intersect` / `mask` / `morph` / `persist` / `history`——`anchor` 解决定位（底层是 Floating UI），`focus` 解决焦点陷阱，但**对话框、弹出层、图标、树、表单都没有**，要嘛用三方（如 tippy.js），要嘛手写。更关键的是 **Alpine 没有组件系统**，UI 片段复用只能靠 `Alpine.data` + 模板字符串，这正是「组件库」在 Alpine 生态里格外难产的原因。

**共同点**：能力越靠后，集成链条越长；而每加一层，就多一套生命周期、一套配置命名、一次版本对齐。

### 5.2 AutoSpark 的做法

#### tooltip：引擎级、零声明

引擎树内**任意元素**不写任何 `x-*` 指令即可获得工具提示，写 `title` 也会被编译期自动转换：

```html
<button data-tooltip="提交后发送">提交</button>
<button title="会被自动转换">删除</button>
<button data-tooltip="{content: '最大弹出', placement: 'left', showDelay: 200}">设置</button>
```

默认 `placement: 'top'` + 箭头 + 翻转 + 1px 边框，HTML 内容经与 `x-html` 同一套 `options.sanitizer` 消毒；命令式出口 `engine.tooltip.show(el, opts)`，全局开关 `options.tooltip: false`。定位由 `@floating-ui/dom` 承担（**已打包进产物**）。详见[工具提示](../guide/tooltip.md)。

#### x-icon：图标域 + 远程图标集

```html
<template x-icons>
  <svg id="close" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 6l12 12M18 6L6 18"/></svg>
  <svg id="check" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 6 9 17l-5-5"/></svg>
</template>

<span x-icon="close"></span>
<button x-icon.button="check"></button>   <!-- .button：hover/press 载体动效，零 DOM 变化 -->
```

渲染走 **SVG symbol + `<use>` + document 级唯一 sprite**（`ADR-0058`），颜色经 `currentColor` 继承、尺寸默认 `1em`。图标集有**作用域链**（默认挂最近祖先 scope，内层遮蔽外层，`.global` 进 `AutoSpark.icons`），与 `getComponent` 同构。远程图标经 IconifyJSON 批量转 symbol，支持 TTL 持久缓存（`ADR-0047`/`0048`），**异步未就绪占位、就绪自动唤醒**。详见 [x-icon](../guide/directives/x-icon.md)。

#### x-dialog / x-drawer / x-popover：组件即内容，状态驱动

三者同基座（`ADR-0052` / `0062` / `0063`），差别只在形态与触发：

```html
<!-- 内容：就是一个普通组件 -->
<div x-define="login">
  <form x-form="{username:'', password:''}">…</form>
</div>

<!-- 对话框：visible 是唯一真相源，关闭自动回写 false -->
<button x-dialog:login="ui.loginVisible" @click="ui.loginVisible = true">登录</button>

<!-- 抽屉：贴屏幕边滑入，placement 默认 right -->
<button x-drawer:filters="ui.filtersOpen" @click="ui.filtersOpen = true">过滤器</button>

<!-- 弹层：宿主悬浮触发，指令值不参与驱动 -->
<button x-popover:tip>悬停查看</button>
```

关键能力（均为内置，非组件库）：

- **定位**：`at` 配 `selector`（四种相对/绝对形态）/ `placement` / `offset` / `shift` / `flip` / `arrow`，由打包进产物的 Floating UI 支撑；
- **全局打开栈**：`document` 级栈，`ESC` 只关栈顶（`ADR-0052` 决策 20）；
- **hover 语义**：`x-popover` 的**共享 hover 域**（宿主↔面板互移不闪关）+ **hover 链**（多级菜单祖先域并入，`ADR-0060`）+ `delayShow` 200 / `delayHide` 150；
- **props 热更新**：`x-dialog-options.props` 绑定状态路径，变更 `Object.assign` 进活跃实例；
- **壳可换**：`shell` 选项（见 [2.3](#_2-3-可扩展——内置不等于封闭)）；
- **抽屉专属**：`mask`（家族首个可配）、`size`、`trigger` 滑轨、`resize` 会话尺寸记忆。

详见[覆盖物](../guide/overlays.md)、[x-dialog](../guide/directives/x-dialog.md)、[x-popover](../guide/directives/x-popover.md)、[x-drawer](../guide/directives/x-drawer.md)。

#### 同一思路的其他内置能力

| 能力 | 为什么它也属于「基础能力」 | 传统做法 |
| --- | --- | --- |
| `x-tree` | 任何后台系统早晚要渲染树 | Vue/Alpine 均需第三方树组件或手写递归 |
| `x-for.virtual` / `.paging` | 万级列表是常态 | vue-virtual-scroller 等第三方库 |
| `x-form` / `x-field` | 表单是 Web 应用的主干 | vee-validate / vuetify-form 等 |
| `x-loading` | 加载态是最普遍的反馈 | 手写遮罩 + 请求拦截器 |
| `x-resize` | 侧栏/面板可调尺寸是中后台标配 | 原生 CSS `resize` 只有右下角、无回调 |

### 5.3 设计考虑：为什么是指令，而不是组件？

ADR 里给出了四条明确理由，值得原样转述：

1. **指令是对既有管线的全额复用，组件是换壳**。`ADR-0040` 在否决「用组件实现树」时写道：组件方案有三处硬伤——引擎当时的模板插槽机制不完整、**每节点一个完整组件实例（独立响应式域 + hooks）在大树下开销数量级放大**、树域逻辑会被塞进「无 TS / 无 lint / 无断点」的模板字符串里。结论是：「复用现有指令避免重复实现」是部分错觉，**树的本质复杂度不因换壳消失，只是从 TS 指令类搬进了组件模板字符串**。
2. **渲染模板，不生成模板**。`ADR-0045` 明确否决了「widget 自动渲染器」方案——那会让引擎变成 UI 组件库（每 widget 一个渲染器 + 注册表 + 定制点爆炸）。**这是全库唯一直接回答「为什么不是组件库」的原文。**
3. **覆盖物是组件的消费方式，不是独立模板资源**（`ADR-0052`）。`OverlayDirective extends UseDirective`，子类只需覆盖三处（值语义 / 实例化时机 / 目的地），`x-dialog` 约 300 行。内容、定位、触发是**行为**，交给指令；视觉是**形态**，交给可替换的 shell（`ADR-0062`）。行为与形态由此彻底解耦。
4. **单包即用的发行纪律**（`ADR-0030` / `ADR-0052` 决策 23）。`@floating-ui/dom` 走 dependencies + `tsup noExternal` 打包进三格式产物，**明确否决了 peerDependency 方案**（理由：违背单包即用承诺）。

**把这四条合起来**，就是那句最凝练的话：**能力下沉为引擎机制，视觉留给可替换的 shell 与 CSS 变量**。于是同一套指令 / 选项 / 响应式语言就能覆盖图标、弹层、贴附、贴边、提示、拖拽、树、列表、表单、动画——而不必引入一个 UI 库。

### 5.4 这么做换来了什么（优点）

1. **综合成本最低**（[2.2](#_2-2-基础能力内置——综合成本最低)）：体积一次性付费，集成与一致性成本归零。
2. **能力免费联动**：`x-loading` 订阅 action 生命周期、抽屉复用 `x-resize` 的 ResizeSession、覆盖物与 tooltip 共用 Floating UI 与容器、动画契约（六类名）跨 `x-show` / `x-if` / `x-for` / 覆盖物统一。
3. **同一门语言**：学会 `x-dialog-options` 的四层回退，就同时学会了 `x-popover-options`、`x-drawer-options`、`x-icons-options`——配置体系只有一套（`ADR-0007`）。
4. **全响应式贯通**：对话框开关是状态、`x-icon` 的图标名是表达式、tooltip 的延迟可以绑 `ui.slow`——不存在「组件库内部自己一套状态」的裂缝。
5. **粒度可控**：内置能力走的仍是引擎的细粒度 patch，不会因为用了对话框就把整棵子树重渲染。
6. **默认值而非天花板**：shell 可换、CSS 变量可改、类名可覆写、指令可自定义（[第六章](#六、扩展性实测-内置怎么改成自己的)）。
7. **零构建可用**：这些能力不依赖打包器，CDN 引入即生效。

### 5.5 代价与边界（如实列出）

评测不能只报喜。ADR 自陈的限制包括：

| 代价 | 出处 / 现状 |
| --- | --- |
| **包体积最大**：104.9 KiB gzip，约 Alpine 的 5.4 倍 | 实测，见第七章 |
| **焦点陷阱 / body 滚动锁定 / z-index 管理未进 v1** | `ADR-0052` 被否决清单 + fast-follow |
| **无障碍（a11y）短板**：tooltip 不保留原生 `title`、无 `aria-label` 补偿 | `ADR-0061` fast-follow 1–3 |
| **document 级全局态**：图标 sprite、覆盖物打开栈、tooltip 单例为跨引擎共享 | `ADR-0058` 标注 🔴；`ADR-0061` 单例 |
| **覆盖物每次打开新建实例**：组件内部状态不跨开合保留 | `ADR-0052` |
| **`x-popover` 触摸设备不适配**，关闭仅 hover 域离开 + `ESC`（点外关闭未做） | `ADR-0060` |
| **`x-tree` 不支持虚拟滚动**（嵌套结构使然，靠折叠控制 DOM 量） | `ADR-0040` ⚠️ |
| **`x-for.virtual` 与 `.paging` 互斥**，且严格固定行高 | `ADR-0041` / `0042` |
| **图标 `stroke-width` 全剥离**：多笔画异宽图标失去表现力 | `ADR-0046` ⚠️、`ADR-0058` 有意的破坏性变更 |
| **outside-click（点外关闭）尚未实现** | `ADR-0063` / `0060` |

结论是：**内置的边界被显式文档化为 fast-follow 或已知 caveat，而不是被藏进第三方库的 issue 列表里**。这两者的差别是——前者你知道该等什么，后者你要自己 fork 或换库。

---

## 六、扩展性实测：内置怎么改成自己的

| 想改什么 | 怎么改 | 参考 |
| --- | --- | --- |
| 对话框 / 弹层 / 抽屉的**面板形态** | `x-dialog-options.shell` 指定自家组件；或改 `options.overlay.dialog.shell` 全站换肤 | [覆盖物](../guide/overlays.md) |
| **视觉细节** | CSS 变量 `--autospark-overlay-z/-bg/-border/-radius`；类名 `.autospark-dialog` 等 | `ADR-0062` |
| **任何指令的行为** | 继承 `AutoSparkDirectiveBase`，声明 `kind` / `priority` / `singleton` / `ownsChildren`，注册进 `presetDirectives` | [自定义指令](../guide/directive/custom.md) |
| **指令选项与修饰符** | `x-{name}-options` 四形态 + 宿主 `x-options` 两层回退 | [指令配置](../guide/directive/config.md) |
| **图标来源与风格** | `x-icons-options` `{url, icons, modify, cache}`（四级配置链）；`AutoSpark.icons.add/delete` | [x-icon](../guide/directives/x-icon.md) |
| **HTML 消毒策略** | `options.sanitizer` 替换为 DOMPurify；`.raw` 跳过消毒 | [x-html](../guide/directives/x-html.md) |
| **局部模板（运行时）** | `engine.patch(selector, updater)` 四态返回值 | [动态模板](../guide/patch.md) |
| **隔离成子应用** | `x-isolate` + `x-isolate-options` 全量透传 | [x-isolate](../guide/directives/x-isolate.md) |
| **远程组件 / 远程 shell** | `x-import`（可 `.global` 注册） | [远程组件](../guide/component/remote.md) |
| **动作与反馈** | `options.actions` / `engine.actions` / `<script type="autospark/actions">` 三入口 | [动作](../guide/action.md) |

---

## 七、包体积与综合成本

### 7.1 实测数据

方法：官方 CDN 产物或 `bun run build` 产物，Node `zlib.gzip`（Optimal）压缩；单位 KiB（÷1024）。测量日期 2026-09-29。

| 产物 | 原始 | **gzip** |
| --- | --- | --- |
| **AutoSpark IIFE**（`dist/index.global.js`，minify，含 autostore + `@floating-ui/dom`） | 347.2 | **104.9** |
| **AutoSpark ESM**（`dist/index.js`） | 339.9 | 102.7 |
| Vue 3.5.43 full build（`vue.global.prod.js`，含编译器） | 164.4 | 60.0 |
| Vue 3.5.43 runtime-only（`vue.runtime.global.prod.js`） | 106.8 | 40.3 |
| Alpine.js 3.17.4（`cdn.min.js`） | 54.6 | 19.5 |
| — 以下为「补齐同等能力」参照 — | | |
| tippy.js 6 UMD bundle（tooltip + 定位） | 25.1 | 8.4 |
| `@floating-ui/dom` UMD | 9.7 | 3.9 |
| Alpine 官方 `anchor` 插件 | 15.2 | 6.0 |
| Alpine 官方 `focus` 插件（焦点陷阱） | 14.6 | 5.2 |
| Alpine 官方 `morph` 插件 | 4.0 | 1.7 |
| Element Plus 2.9.5 full（全量，未 tree-shake） | 2105.4 | 403.0 |
| `@element-plus/icons-vue` IIFE | 205.0 | 51.2 |

### 7.2 三句话读完这张表

1. **AutoSpark 最贵**：104.9 KiB gzip，是 Vue full build 的 1.75 倍、Alpine 的 5.4 倍。这是「基础能力内置」理念的**直接账单**，没有回避的余地。
2. **但比的必须是「等价能力」**：Vue full build 的 60.0 KiB 里**没有任何** tooltip / dialog / popover / icon / tree / form / 虚拟列表；要补齐，至少再加 tippy（8.4）+ 组件库（全量 403.0，实际 tree-shake 后仍通常是数百 KB 级）+ 图标包（51.2）+ 虚拟列表库。Alpine 的 19.5 KiB 更是**连组件系统都没有**——加上 `anchor` + `focus` + `morph` 后约 32.4 KiB（分项 gzip 近似和），依然没有对话框、图标、树、表单。
3. **AutoSpark 的 104.9 KiB 是「能力全开」的全量价**，且 autostore / floating-ui 已打包在内（单包即用，`ADR-0030`），用户不再需要为这些依赖单独做版本对齐。

### 7.3 综合成本的算法

把三种成本放在一起（[2.2](#_2-2-基础能力内置——综合成本最低)的展开）：

| 成本项 | 组件库路径（Vue/Alpine） | AutoSpark 内置路径 |
| --- | --- | --- |
| 体积 | 基础框架 + 组件库 + 定位库 + 图标库 + 虚拟列表库 + 表单库 | **单包 104.9 KiB** |
| 集成 | 多包选型、版本对齐、样式体系接入、构建配置 | 一个 `<script>` |
| 一致性 | 多套 API / 动画 / 生命周期 / 主题变量 | 一套选项体系、一套动画契约、一套 CSS 变量 |
| 联动 | 自己写胶水（loading ↔ 请求、drawer ↔ resize） | 引擎内建（`x-loading` ↔ action、drawer ↔ `x-resize`） |
| 升级 | 各包独立 breaking change | 单版本号演进 |

**结论**：如果应用只需要 tooltip + 少量交互，Alpine 的 19.5 KiB 确实无可替代；但只要开始要对话框、图标、树、表单、虚拟列表，**内置路径的综合成本就会反超**——这正是「虽然增加了包大小，但对最终应用而言综合成本最低」这句话的量化含义。

> 一处需要如实说明的工程事实：AutoSpark 的 ESM 与 IIFE 体积几乎相同（102.7 vs 104.9 KiB gzip），因为 `presetDirectives` 是全量注册的，**tree-shaking 收益有限**；而 Vue 在 Vite + ESM 下按需引入的实际产物通常远小于 full build。体积优化仍是 AutoSpark 需要持续投入的方向。

---

## 八、生态与工程化

| 维度 | Vue 3 | Alpine.js | AutoSpark |
| --- | --- | --- | --- |
| **SSR / 水合** | 内置 | 有限 | ❌ 客户端引擎 |
| **组件生态** | 最庞大（Element Plus / Naive UI / Ant Design…） | 稀少（无组件系统） | 自带 `x-define` / `x-component` / `x-import` |
| **Router / 状态库** | 官方 Router + Pinia | 无官方 | 状态层即 AutoStore（随包） |
| **DevTools** | 成熟的独立扩展 | 独立扩展 | 暂无 |
| **插件机制** | `app.use()` | `Alpine.plugin()` | 无插件系统（功能内聚，靠自定义指令 / 组件扩展） |
| **TypeScript** | 原生 | 一般 | 原生（TS 7.x 编写） |
| **测试** | 官方 Test Utils | 社区 | `bun test` + happy-dom，指令级测试 |
| **文档** | 极完善 | 完善 | 中文 ADR 决策文档（64 篇）+ 指令参考 |
| **成熟度** | 生产级、社区庞大 | 生产级（多用于 SSR 页面增强） | **v0.x，开发中** |

这一章没有可辩驳的余地：**生态是 Vue 的绝对优势，AutoSpark 的最大短板不在能力而在成熟度与社区**。选型时必须把「出问题有没有人踩过」「招人好不好招」计入成本。

值得多想一层：Vue 之所以能把生态做得最大，正是因为它**刻意只保留原子能力**——核心越精简，留给生态的空间越大。但同一件事在 AI coding 时代会翻转成局限，见[第九章](#九、ai-coding-时代-谁对-ai-更友好)。

---

## 九、AI coding 时代：谁对 AI 更友好

AI 编码代理（Copilot / Cursor / Claude Code / opencode）已经成为默认生产力，于是「框架对 AI 是否友好」成了新的选型维度。一个框架的 AI 友好性可以拆成三件事：**AI 产出正确代码的概率 × 产出后被验证的效率 × 长期可维护性（不被模型改坏）**。按这三条来比，三者的差异相当明显。

### 9.1 先看 Vue 的取舍：只保留原子能力，把其余交给生态

要谈 AI 时代谁更友好，得先理解 Vue 的设计立场。Vue 刻意**只保留最基础的原子能力**——响应式系统、组件模型、15 条内置指令，外加 `<Teleport>` / `<Transition>` / `<KeepAlive>` / `<Suspense>` 少数几个内置组件；路由、状态库、UI 组件库、表单、图标、虚拟滚动**全部外置**，交给生态。它的信条是「渐进式」：核心保持精简稳定，其余按需引入、由社区互相制衡。

这个取舍在**人选型的时代是对的**：核心 API 面小而稳定、生态繁荣、按需 tree-shaking、遇到问题搜得到答案。但到了 **AI coding 时代，同一条取舍暴露出三点局限**：

1. **契约面从「框架」膨胀成「组合」**。模型要正确产出的不再是 Vue 的 API，而是「Element Plus 哪个版本 + Pinia 写法 + Vite 插件配置 + 路由守卫」的**组合正确性**。每一个组合点都是一次幻觉与错配的机会，而且这些错误**不会在编译期报出来**——它们藏在运行时与版本差异里。
2. **原子能力 = 决策成本转嫁给模型**。AI 手里只有 15 条指令和一堆组件库文档，它还得自己决定「用哪家的 Dialog、定位怎么接、loading 怎么写、图标用哪个包」。模型的依据是**训练语料的流行度**，不是你项目的当下最优解；一旦语料过期，就会引用已废弃的 API 或不存在的版本特性。**原子能力把「选型」留给了使用者——在人身上这是自由，在模型身上这是风险。**
3. **契约不可枚举、验证闭环变长**。生态 API 分散在多个包、多个版本里，没有一份可以整表读完的清单；RAG 命中的可能是旧版文档，一次改动可能牵动数个依赖，验证还得先跑起构建。

当然有反面：Vue 的公开语料量级最大，模型先验最强，**在没有仓库文档可检索的裸问场景下**，它的首版正确率确实更高（详见 [9.4](#_9-4-诚实的反面)）。

> 一句话：**「原子能力 + 生态补齐」在人选型的时代是优势；在 AI 选型的时代，「选型」本身成了最大的风险点。** 这也解释了为什么 [第二章](#二、autospark-的设计理念-总结) 的「基础能力内置」理念，在 agent 场景下反而变成了优点——它把最容易出错的那一步直接删掉了。

### 9.2 六个维度对照

| 维度 | Vue 3 | Alpine.js | AutoSpark |
| --- | --- | --- | --- |
| **单文件信息密度** | SFC 三段清晰，但组件 / 路由 / 类型通常跨文件 | 高（HTML 即全部） | **高**：结构、样式、状态、事件、动作同文件 |
| **产物能否直接运行** | 否（需 `npm i` + 打包器 + dev server） | 是 | **是**（`<script>` 引入即跑） |
| **需检索的生态面** | **巨大**：组件库 / 路由 / 状态库 / 构建插件的组合正确性 | 中：官方插件少，复杂 UI 要挑三方 | **小**：能力内置，31 条指令封闭可枚举 |
| **API 可枚举性** | 长尾 API 多、多版本并存 | 插件版本易错配 | 指令 + 修饰符 + 四层选项链，规则成表 |
| **错误可发现性** | 编译错误清晰，运行时依赖 DevTools | 以运行时错误为主 | **编译期 warn + 回退语义**（「失效可发现」的 Q2 哲学） |
| **可供 RAG 的材料** | 公开语料极多（模型先验最强） | 公开语料多 | 仓库内中文文档 + 64 篇 ADR + 源码与测试 |

### 9.3 AutoSpark 更友好的四个理由

**一、验证闭环最短。** AI 真正昂贵的不是「写」，而是「我写对了吗」。AutoSpark 零构建——AI 产出的 HTML **打开即跑**；本仓库 `docs/demos/` 下全是纯 HTML 可运行示例，代理可以直接读取、复制、改造；指令级测试用 `bun test` + happy-dom，**机器可验证**。闭环越短，同样的时间里被纠正的次数越多，幻觉存活时间越短。相比之下，Vue 的产出要经过安装依赖、启动 dev server、看 HMR 结果才进入验证；SSR 项目还得先起服务。

**二、封闭可枚举的指令面 = 更小的幻觉空间。** AI 幻觉的高发区从来不是「怎么写这段逻辑」，而是「**该用哪个库、这个 API 属于哪个版本**」。AutoSpark 只有 31 条指令，注册表 `presetDirectives` 是显式映射（不依赖 `Function.name`），模型可以整表枚举；每个指令的选项、默认值、优先级在文档里成表，RAG 能精确命中。Vue 的难点不在那 15 条内置指令，而在 Element Plus + Pinia + Vue Router + 构建插件的**组合正确性**；Alpine 的难点在于**没有组件系统**，AI 一旦需要复用 UI，就得临时发明方案或引入三方库——每一步都是幻觉机会。这与[第二章](#二、autospark-的设计理念-总结)的「基础能力内置」同源：**内置能力把「选型」这个最容易出错的环节，从 AI 面前直接删掉了。**

**三、改动面小、diff 局部。** AI 最擅长的是小而精确的增量修改，最怕的是「为了加一个功能重写整棵组件树」。指令是离散的属性：把某个区域变成抽屉，在 AutoSpark 里是**加一个 `x-drawer:名称="状态"` + 一行状态**，不引入依赖、不改路由、不重构组件树。再叠上细粒度 patch（改动只影响订阅了该路径的节点），**改动的可预测性高，回归面小**——这正是 agent 长链路改码时最需要的性质。

**四、意图可追溯，避免「用过时 API」。** 本仓库 64 篇中文 ADR 记录了「为什么这么设计 + 哪些方案被否决」。模型读到 ADR 就不会把已废弃写法当最佳实践（例如 `x-patch` 已由 `x-scope` 取代、`x-use` 已更名 `x-component`、旧 `x-icon-define` 已硬移除）。「引用不存在 / 已过时的 API」是 AI 维护存量项目时的高频失败点，**仓库内决策文档恰好补上互联网语料缺的那块**。

### 9.4 诚实的反面

- **通用语料先验**：Vue / React 的公开语料量级最大，模型默认先验最强。在**没有仓库文档可检索**的裸问场景下，Vue 代码首版正确率更高是事实。AutoSpark 的优势是**项目内**（文档 / ADR / 类型 / 测试就在仓库里），不是**互联网上**。
- **能力越内置，专属词汇越多**：31 条指令 + 修饰符 + 四层选项链意味着模型要对齐的「方言」更多。若模型只见过 Alpine，可能把 `x-dialog-options` 写成 Alpine 风格的对象——因此**仓库级指引（`AGENTS.md` / `CLAUDE.md`）是 AI 友好性的另一半**：本仓库的 `CLAUDE.md`、`CONTEXT.md` 词条表、`bun scripts/check-doc-structure.ts` 文档结构校验，都是在替模型把方言钉死。
- **成熟度**：v0.x 意味着公开纠错样本少，模型踩坑后可参考的社区讨论也少。

### 9.5 给用 AI 开发的人的结论

| 你的情况 | 建议 |
| --- | --- |
| 用 AI 从零写中后台 CRUD / 内部工具 | **AutoSpark**：能力内置 + 零构建 + 文档在仓，agent 闭环最短 |
| 已有 Vue 大型项目，AI 做存量维护 | **Vue**：语料与生态先验最强，纠错样本最多 |
| 让 AI 快速出一次性工具页 | AutoSpark 或 Alpine（都零构建）；**一旦要对话框 / 图标 / 树，选 AutoSpark** |
| 对幻觉零容忍、要求可枚举契约与编译期反馈 | **AutoSpark**（封闭指令集 + warn + ADR） |
| 裸问、仓库里没有文档可检索 | Vue / React 更稳（先验强），记得给 AutoSpark 项目补 `AGENTS.md` |

---

## 十、选型建议

| 场景 | 推荐 | 理由 |
| --- | --- | --- |
| 中大型 SPA、需要 SSR、需要成熟生态与团队协作 | **Vue 3** | 组件生态 + Router/Pinia + SSR + DevTools，无争议 |
| 服务端渲染页面的轻量渐进增强、体积极度敏感 | **Alpine.js** | 19.5 KiB gzip、零构建、上手最快 |
| 后台管理系统 / 表单密集型应用 | **AutoSpark** | `x-form` / `x-field` / `x-tree` / `x-loading` 全内置，能力开箱即用 |
| 中后台里大量对话框、抽屉、弹层、图标、悬浮提示 | **AutoSpark** | 这正是它把组件库能力做进引擎的主战场 |
| 万级列表 + 分页 | **AutoSpark** | 内置 `.virtual` / `.paging`（三者中唯一框架自带） |
| 已有 AutoStore 状态层，只缺 DOM 渲染 | **AutoSpark** | 单包转导出，`import { AutoSpark, AutoStore } from "autospark"` |
| 零构建、CDN 引入、快速出活 | AutoSpark ≈ Alpine > Vue | 前两者无需工具链 |
| 需要 SSR、需要最大人才池 | **Vue 3** | AutoSpark 明确不支持 SSR |
| 只要 3~5 个交互的小静态页 | **Alpine.js** | 全量内置能力对它是过度配置 |

**不该用 AutoSpark 的情形**：强 SSR 需求、必须依赖成熟 DevTools 工作流、团队只熟 Vue 生态、或项目要求「经过十年生产验证」。

---

## 十一、结论：四条设计理念的最终核算

回到[第二章](#二、autospark-的设计理念-总结)的四条理念，用评测数据各自结一次账：

1. **全响应式**——成立。三者里只有 AutoSpark 把覆盖物显隐、动作生命周期、表单校验、异步数据源、图标异步加载全部纳入同一响应式体系，且更新粒度做到了「指令 × 状态路径」，不重建子树、保留运行态。
2. **基础能力内置，综合成本最低**——**有条件成立**。条件是「应用确实需要这些能力」：全量能力下单包 104.9 KiB gzip，比 Vue full build 贵 44.9 KiB，但省掉了组件库（全量 403 KiB gzip 级）、定位库、图标库、虚拟列表库、表单库的体积与全部集成 / 一致性 / 联动成本；反之，若只要少量交互，Alpine 的 19.5 KiB 更划算。**它买的是「能力全开时的总账最优」，不是「能力最少时的单价最低」。**
3. **可扩展**——成立且是内置理念的必要条件。shell 组件化 + 四层配置链 + CSS 变量 + 类名契约 + 自定义指令，保证了「内置的是默认值而非天花板」；`ADR-0062` 的「内置 shell 就是一个普通的 shell」是这条理念最漂亮的落法。
4. **无需 Vue 式编译**——成立。HTML 即模板，浏览器首帧一次性预编译运行树，零工具链；代价是首帧编译成本与无 SSR。它取到了 Vue 的「编译期优化」与 Alpine 的「零构建」两头，但**首帧成本与 DOM 环境依赖是真实代价**。

附带一笔红利：[第九章](#九、ai-coding-时代-谁对-ai-更友好)说明，这四条理念在 AI coding 时代恰好同时命中了 agent 的三个痛点——**能力内置 → 可枚举（少幻觉）、零构建 → 可验证（闭环短）、文档与 ADR 在仓 → 可检索（不引用过时 API）**。

**一句话总结**：Vue 是「组件优先、构建期编译、生态补齐」的全能框架，Alpine 是「HTML 优先、零构建、最小内核」的增强器，AutoSpark 走的是第三条路——**把响应式做彻底，把基础能力做进引擎，把形态留给你覆盖，把编译留在浏览器里**。它用最大的单包体积换取最低的综合集成成本，用 v0.x 的成熟度换取最完整的开箱能力。这笔账划不划算，取决于你的应用到底要用到多少能力——**用得越多，它越划算**。

---

**相关阅读**：[特征与优势](./features.md) · [快速入门](./get-started.md) · [覆盖物](../guide/overlays.md) · [指令配置](../guide/directive/config.md) · [名词解释](./glossary.md)
