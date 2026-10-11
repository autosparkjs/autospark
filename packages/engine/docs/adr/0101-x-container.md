# ADR-0101：x-container 响应式容器——断点档位判定 + 按档 max-width + 档名写回

- 状态：已采纳（2026-10-10 两轮 grilling 共识落盘，实施待启动）
- 日期：2026-10-10
- 关联：ADR-0007（指令选项回退链——整表替换沿用「回退不合并」惯例）、ADR-0064
  （x-resize——值双态先例 + parseCssLength 复用）、ADR-0072（x-layout——「布局容器」
  词汇消歧对象）、ADR-0098（x-foldable——全局样式注入 / 单测驱动通道同期惯例）

## 背景

布局指令家族（x-layout 骨架 / x-splitter 分割 / x-foldable 溢出折叠）覆盖了页面内布局，
但缺最外层的一环：**断点容器**——Bootstrap `.container` 心智的页面容器（视口宽度落入
某档位时切换 max-width），以及让模板逻辑感知当前档位的**响应式状态源**（`x-show="
viewport==='md'"` 一类的联动）。引擎此前无任何视口/断点机制，x-container 是第一个。
两轮 grilling（Q1~Q11）闭合全部决策面，本文记录定案。

## 决策

### 1. 核心定位：视觉容器 + 状态源兼有，值双态、写回单向

x-resize 值双态先例：值留空 = 纯视觉容器（Bootstrap 全套视觉契约，见决策 6）；值 =
简单状态路径 = **响应式状态源**——当前断点档名（**字符串**，如 `"md"`）随切换实时写回。
写回是**单向**的：档位是测量真相，外部对绑定路径的写不解释、不同步（区别于 x-model /
x-resize 的双向——视口宽度不可由状态驱动）。宿主无论是否绑定值均常驻
`data-breakpoint="<档名>"` 属性——纯 CSS 子代选择器（`[data-breakpoint=md] .sidebar`）
与测试断言的 DOM 暴露面。档位跨越时派发 `viewport:change` 事件（决策 8）。

### 2. 命名 x-container 与词汇消歧

「容器」语境拥挤：词汇表 x-layout 正名「布局容器」；CSS 原生 `@container` /
container queries 语义存在，`x-container` 极易被误读为「容器查询」。裁决保留
`x-container`（Bootstrap 心智认知度最高、容器语义为主、状态源为值扩展），代价以
CONTEXT.md 立词条消歧承担：Avoid 列表收录「布局容器」「@container/容器查询」。
另：「响应式」在本表默认 **reactive** 语义（AutoStore 响应式状态），指断点语义须写
全称「响应式容器」。

### 3. 断点档位：mobile-forward min-width + xs 隐含兜底

Bootstrap 5 语义：宽度 ≥ 档位阈值即命中该档，**当前档 = 命中档中最大者**（1000px 视口
→ lg）。**xs 是 < sm 的隐含兜底档、无阈值**——用户初稿 `xs:"576px"` 与 sm 完全重复、
区间重合永不独立命中，已纠正为 Bootstrap 正解（xs 在 Bootstrap 5 中本就不是断点，是
<576 的隐含区间）；xs 写入阈值表 warn + 忽略。默认表冻结（Bootstrap 5 对齐）：

| 档位 | 阈值（px） | 容器 max-width |
|------|-----------|----------------|
| xs   | —（<576 兜底） | 100% |
| sm   | 576 | 540px |
| md   | 768 | 720px |
| lg   | 992 | 960px |
| xl   | 1200 | 1140px |
| xxl  | 1400 | 1320px |

### 4. 判定基准：恒视口

视觉约束走**纯 CSS media query**（全局样式表一份、零 JS 布局开销），档位状态
（data-breakpoint / 写回 / 事件）走 matchMedia 按档 mql 监听——只在档位跨越时触发，
成本可忽略。**否决 CSS 原生 container query**：`@container` 无法样式化容器自身（只能
查子孙），纯 CSS 须给宿主包 wrapper（侵入 DOM 结构）；`container-type: inline-size`
的 size containment 副作用（宿主宽度不再由内容决定，flex/inline 场景破损）。元素宽度
判定形态（`.self`）曾随初版实施后裁剪（自指振荡缺陷 + 用户裁决收缩，见修订记录 1）。

### 5. 选项 schema：两表分离 + 三级回退、整表替换

- `breakpoints`（档位阈值表）与 `maxWidths`（按档 max-width 表）**两表分离**——按档
  合并形态（`sm:{min:576, maxWidth:'540px'}`）因 xs 兜底档无 min 结构不对称、改单值
  要重写整档对象而否决；
- 各自**整表替换**，不做按键合并（ADR-0007「回退不合并」惯例）；
- 三级回退：engine `options.container = { breakpoints?, maxWidths? }`（按特性命名空间，
  对齐 `options.components` 先例；**不扩基类 getOption**，指令自读 engine options）→
  实例 `x-container-options` → 内置 Bootstrap 5 缺省表。顶层 `options.breakpoints`
  刻意不建——留给未来通用响应特性（YAGNI）；
- 值双形态：number（按 px）与 CSS 长度串（复用 x-resize 的 `parseCssLength`）。

### 6. 视觉契约：Bootstrap 全套 + `.fluid`

`width:100%` + 按档 `max-width` + `margin-inline:auto` 居中（默认开、不可关——想不
居中别用容器）+ gutter 水平 padding 经 CSS 变量 `--autospark-container-gutter`
（缺省 0.75rem，用户覆写变量即可，**零选项 API 面**）。`.fluid` 修饰符关闭按档
max-width（恒 100% 通栏），档位判定 / data-breakpoint / 写回照常——「纯状态探针 +
无约束容器」用法。

### 7. 技术底座

- **Compile 类**、singleton、priority 0：编译期建值绑定与样式接线，非结构指令、
  不 ownsChildren，与 x-if / x-show / x-for 正交；
- **CSS 注入两层**：默认表经 `static initialize()` 注入一份全局样式表（media query，
  全实例共享）；实例自定义表按表内容哈希去重生成 scoped `<style>`——CSS 自定义属性
  不能参数化 media query 断点，自定义阈值无法共享全局表（每实例 inline style 同理
  不可行）；
- **首值同步**：编译后立即求值当前档（data-breakpoint + 写回），消灭首渲染空档闪烁；
- 监听清理：matchMedia mql / ResizeObserver 随 destroy 反注册。

### 8. 断点事件：`viewport:change`（向下传播）

档位跨越时派发 `viewport:change`（冒号命名空间对齐 `resize:*` / `tree:*` /
`expandable:*` 家族惯例），`detail = { from, to }`（跨档前后档名字符串）。**向下传播**
（修订记录 3）：先下行——沿 scope 子树发现声明 `@viewport:change` 的后代元素逐个派发
（不冒泡，每元素恰好一次；DOM 事件物理上只向上流，向下经 scope 树实现）；后上行——
宿主派发冒泡（祖先监听）。嵌套容器各自独立派发（同刻跨档时后代监听收到多层事件）。
**只在跨越时派发、初始同步不派发**——监听在编译期建立，编译期派发受指令编译顺序影响
不可靠，初值经状态写回 / `data-breakpoint` 读取。（共识沿革：初稿「不派发事件
（YAGNI）」→ 用户裁决增加，初名 `container:change` → 修订记录 2 更名 → 修订记录 3
改向下传播。）

## 后果

- 实施落盘物：`src/directives/x-container.ts` + `directives/index.ts` 注册 +
  `src/__tests__/directives/x-container.test.ts`（驱动通道：happy-dom 的 matchMedia 无
  change 事件，经可控桩宽度改值 + 手动触发）+ 指南五段骨架
  （`docs/zh/guide/directives/x-container.md`，过 check-doc-structure）+ demo +
  本 ADR + CONTEXT.md 词条（均已先行落盘）；
- 视觉不依赖 JS（media query 原生生效，JS 只服务档位状态暴露与事件）；
- `options.container` 为构造期配置（运行时突变不生效，options 家族纪律）；
- 未来扩展出口预留（今日全部 YAGNI）：每档布尔写回（「md 及以上」查询）、顶层
  `options.breakpoints` 通用断点特性、元素宽度判定形态（`.self` 曾实施后裁剪——恢复
  须先解决自指振荡与探测成本，元素级响应优先考虑 CSS 原生 container query）。

## 修订记录

1. **2026-10-11 裁剪 `.self`（元素宽度判定）**：初版含 `.self` 修饰符（宿主可用宽度
   判定，ResizeObserver + JS inline max-width），浏览器实测暴露**自指振荡**缺陷——
   直量宿主宽度会被自身按档约束污染（约束收窄 → 测得更低档 → 更窄约束，每帧换档 +
   事件风暴），曾以「可用宽度探测」（暂摘 inline max-width 再测）修复；用户裁决**整体
   裁剪**——本指令只处理视口，元素级响应归还 CSS 原生 container query。连带移除：
   `autospark-container-self` 中立化类、RO / window resize 通道、就近低档延续查表、
   self demo 与对应测试。
2. **2026-10-11 事件更名 `container:change` → `viewport:change`**：判定基准恒视口后
   名实对齐（事件描述的就是视口档位跨越），并消除「container 事件」与 CSS
   `@container` 的又一处词汇纠缠。
3. **2026-10-11 事件改向下传播**：初版为宿主单点冒泡（仅宿主与祖先可监听）——但实际
   场景中响应视口档位的是**容器内部**的组件（卡片换列、侧栏收起），后代元素声明
   `@viewport:change` 听不到。DOM 事件物理上只向上流，向下传播经 **scope 子树**实现：
   跨档时沿 `scope.children` 收集声明该事件的元素（`@` 属性编译期剥除，监听信息只在
   scope 指令表；x-if / x-for 重建子树随 children 增删，跨档时现走现得）逐个派发
   （不冒泡、每元素恰好一次），宿主再冒泡上行——先下后上，对齐捕获→冒泡心智。嵌套
   容器各自独立派发为已知语义。
