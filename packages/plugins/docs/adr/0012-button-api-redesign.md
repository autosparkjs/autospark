# ADR-0012: autospark.button API 重设计——形态/语义色正交、checkable 冒泡受控、theme 档位全盘跟随

- 状态：已接受（Accepted，2026-11-02；2026-11-03 更名修订）
- 日期：2026-11-02
- 关联：ADR-0129（engine，三级样式回退链——本组件全量消费范式）、ADR-0010（运行时动态挂载契约——ripple prop 的消费方）、ADR-0094（点前缀命名空间）；不涉 ADR-0003 插件形态（注册结构不变）

> **2026-11-03 修订**：属性更名——原 `type`（形态）→ **`variant`**、原 `color`（语义色）→ **`type`**（对齐 `type` 专属语义色的通用语感，正文保留原始决策名以便对照）；`ripple` 默认值 `false` → **`true`**（点击涟漪默认开启，页面未加载 autospark.ripple.js 时静默跳过）。
>
> **2026-11-07 修订**：新增 `wrap`（label 换行控制，决策 7）、`iconPlacement`（图标位置，决策 8）——**默认行为反转**：label 从可折行变为单行溢出省略号 + 溢出时静态检测自动挂 title。

## 背景

现役 button 只有 type（语义色）/size/label/disabled 四 props，需求扩张至形态×语义色、幽灵、块级、圆形、纵排 label、备注、tags 子按钮、菜单项、可勾选（表单）、涟漪、汉字空格、内容对齐、装饰边框——经 grilling 十五问逐项收敛（含两条 engine 事实查证：① theme `--auto-*` 纯 CSS 级联、组件消费即自动跟随，无需额外机制；② **engine 不存在自定义组件双向绑定协议**——x-model 对非表单元素静默按 text 分型，button 宿主上 DOM→state 监听 `input` 永不触发；props 单向不回写）。本次为**破坏性重写**：`type` 语义重定义（语义色 → 形态），旧枚举 `success/danger` 等不再是合法 type。

## 决策

### 决策 1：type（形态）与 color（语义色）正交双属性

- `type: primary | secondary | dashed | text | link`（形态，默认 primary）；`color: primary | success | warning | danger | info`（语义色，默认 primary）。
- 5×5 组合经 **CSS 中转变量层**线性表达，拒绝选择器笛卡尔积：`.asc-button:has(> .asc-button-body[data-color="X"]) { --asc-tone: var(--auto-X-color, …) }` 五条注入语义色，形态块只消费 `var(--asc-tone)`（primary 实底 / dashed 描边 / ghost 反色等）——CSS 行数 5+形态数，不随组合数增长。
- 勾选态（`data-checked="true"`）统一 tone 实底 + 反白字（「与 type 匹配的背景色」落在当前 color 语义上）。

### 决策 2：尺寸零组件属性，全盘跟随 theme 档位

不设组件级 size（删除旧 sm/md/lg）——字号/圆角消费 `--auto-font-size`/`--auto-border-radius`（容器 `data-size`/`data-radius` 档位切换自动跟随），内距与间距以 `em` 相对字号缩放。特殊尺寸走使用者 `--asc-button-*` 覆盖变量。「全面引入 theme」的验收口径 = 所有视觉属性一律三级回退链、零硬编码（第三级校准兜底值除外）。

### 决策 3：checkable 冒泡受控半双工（不做 x-model）

engine 无组件双向协议（背景②），硬凑存在类型陷阱：x-model text 分型经 `el.value` 字符串化布尔。定案为官方通道组合：

- 显示方向：props 单向注入天然响应（`value: flag` 变化 → 视觉更新）；
- 翻转方向：组件内自动取反 `data.value` + 宿主冒泡 `change` CustomEvent（`detail.value`）；
- 表单双向 = 外层一行：包裹元素 `@change="flag = $event.detail.value"`（外层域求值，封闭域纪律内）。

与 x-tree `tree:check` 事件、x-loading action 双通道同家族模式。

### 决策 4：tags 子按钮结构——x-for 宿主为纯克隆载体

**x-for 宿主元素自身的普通绑定（`:attr`/`@event`）不被编译**（ownsChildren 结构指令接管子树编译，宿主绑定不在编译面；宿主上的 `:key` 是 x-for 专用键不受此限）。故 tags 结构为「x-for 宿主（纯克隆载体，`display: contents`）> 内层 tag 圆钮（`:title`/`@click` 绑定所在层，x-for locals 可见）> icon（`x-icon` 指令值在项 scope 求值正常）」。tag 点击冒泡 `tag-click`（`detail = { name, tag }`），method 内 `stopPropagation` 阻断宿主 checkable 翻转。

### 决策 5：ripple prop 消费 ADR-0010 运行时挂载契约

`ripple` 是组件对外语义；挂载实现走**双属性通道**：`x-ripple-options`（配置）+ 裸 `x-ripple`（开关）——裸属性值只参与三态判定、不承载配置（x-ripple 插件的配置读取面是 `info.options`，实测值对象通道静默丢失、全落 echo+always 缺省）。`ripple: false` 移除两属性；启用时缺省 `{ trigger: "click", inside: true }`（点击播一个周期自止 + 约束按钮内部），**对象形态全键可覆盖**（含 inside，可换外扩形态）。options 运行时改值无效（ADR-0010 决策 7）——变化时先摘 `x-ripple` 触发重挂再重读。前置：页面已加载 `autospark.ripple.js`——未加载时属性无人消费、静默无害。

### 决策 6：autoInsertSpace 走 computed（插值视图无 methods）

模板插值表达式在数据视图求值，**methods 不在数据视图内**（x-on 的 getAction 链可见，插值不可见）——`displayLabel` 以「普通函数值即 computed 简写」（x-data 惯用法）实现：两汉字正则命中时插空格，`autoInsertSpace: false` 关闭。

### 决策 7：wrap（label 换行控制）——默认单行省略号 + 溢出静态挂 title（2026-11-07）

- **默认反转**：`wrap: boolean` 默认 `false` = label 单行 + 溢出省略号（截断三件套进 `.asc-button-label` 基础规则）；此前 label 无 `white-space` 约束、宽度受限时可折行。反转动机：单行省略是按钮 label 主流语义，折行撑高按钮是布局事故源——换行须显式声明（`wrap: true` 回 `normal`，按钮高度随行数增长由使用者担责）。
- **纯声明通道**：`:data-wrap` 挂 body（布尔 props 惯例）、`[data-wrap="true"]` 解除截断，零 JS 布局参与；截断只在按钮宽度受约束时发生（block / menu / 容器挤压；inline-flex 收缩到内容宽永不触发）。
- **溢出自动挂提示（纯静态检测，2026-11-08 双轨修订）**：挂载属性随 tooltip 特性分流——`engine.tooltip?.enabled` 在场挂 `data-tooltip`（插件接管；运行时 setAttribute 的原生 title 不在插件消费面，故须显式双轨，与 x-bind title 重定向同判定口径）、缺席挂原生 `title` 兜底；mounted 一跳首查 + `watch(label)` / `watch(wrap)` 重查，`scrollWidth > clientWidth` 判定；仅截断态挂、文本取 `.asc-button-label` 的 `textContent`（插槽 / 默认文案同源）、宿主显式 title 永不覆盖、溢出消失只摘自挂的（闭包标记自持）。
- **正交不特调**：memo 保持 `line-clamp: 2` 独立截断（行数轴语义独立）；`shape: "circle"` 遇 wrap 呈竖长胶囊的组合不特调，责任归使用者。

### 决策 8：iconPlacement——start/end 走 CSS order，组合语义四个子决策（2026-11-07）

`iconPlacement: start | end`（默认 start）：`end` 经 body 的 `data-icon-placement` + `.asc-button-icon { order: 5 }` 实现（纯 CSS 零结构改动）。组合语义（grilling 四问定案）：

- **纵排映射**：labelBelow 下 start/end 映射为上/下（流向语义自然延伸，非失效）；
- **loading 随行**：loading 是图标位的临时内容，位置语义一致；
- **yes 占位恒最前**：check-style icon 的勾选占位（body::before）位置稳定（勾选/取消零布局跳动），iconPlacement 只管内容区内的用户图标；
- **tags 互换**：end 时图标移 tags 之后（图标恒最末，tags 退居其前）。

## 备选方案

- **antd 风格 type 兼载形态 + danger 布尔**：否决——success 虚线钮等组合表达受限，语义色独立成 color 更干净（grilling Q11 定案）。
- **x-model 组合协议（props 读 + 组件 dispatch input + 同步 el.value）**：否决——text 分型经 el.value 把布尔字符串化（"true"/"false"），且依赖「text 分型无元素守卫」的 incidental 行为，engine 改进 x-model 时会静默碎裂。
- **保留组件级 size 属性**：否决——与 theme 档位双体系并存，「全面引入 theme」名不副实（Q12）。
- **:has() 笛卡尔积逐组合写选择器**：否决——5 色 × 5 形态 × ghost × checked 组合爆炸；中转变量层线性化。
- **tags 用 mounted 全局事件委托**：否决——与 checkable 宿主 listener 同元素竞争顺序（stopPropagation 不阻断同元素监听），需 stopImmediatePropagation + 注册顺序耦合；模板内层绑定无此问题。
- **ResizeObserver 动态检测 title 挂/摘（决策 7）**：否决——按钮为高频组件，每实例一观察槽与收益不成比例，且组件为纯 HTML 资产（`script setup` 无模块级位置）做共享单例须引入 JS 模块载体；接受容器宽度单独变化后 title 过期的温和妥协（CSS 截断本身自适应不受影响）。
- **溢出 title 提示整体不做（决策 7 初案 YAGNI）**：修订——hover 补偿可达性价值成立，静态检测成本一段代码；落点收窄为「宿主无显式 title 时才挂、永不覆盖」。

## 后果

- 破坏性：旧 `type: "success"/"danger"`（语义色）用法失效——迁移动作 `type: "success"` → `type: "primary", color: "success"`；旧 `size` 属性删除。
- 破坏性（2026-11-07，决策 7）：宽度受限按钮（block / menu / 容器挤压）的长 label 从折行撑高变为单行省略号——需折行的存量用法迁移动作 `wrap: true`。
- 组件级 CSS 变量中转层（`--asc-tone/--asc-bg/--asc-ink/--asc-line`）是组件内部实现细节，不在 `--asc-button-*` 公开覆盖面承诺内（覆盖通道仍是语义变量与 `--asc-button-*` 兜底位）。
- 纯图标正圆用法需显式 `label: ''`（label 默认 "按钮" 非空会占位）；空出口经 `:empty` + `:has` 整组隐藏，插槽有内容不受影响。
