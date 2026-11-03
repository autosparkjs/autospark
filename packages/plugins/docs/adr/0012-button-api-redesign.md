# ADR-0012: autospark.button API 重设计——形态/语义色正交、checkable 冒泡受控、theme 档位全盘跟随

- 状态：已接受（Accepted，2026-11-02）
- 日期：2026-11-02
- 关联：ADR-0129（engine，三级样式回退链——本组件全量消费范式）、ADR-0010（运行时动态挂载契约——ripple prop 的消费方）、ADR-0094（点前缀命名空间）；不涉 ADR-0003 插件形态（注册结构不变）

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

## 备选方案

- **antd 风格 type 兼载形态 + danger 布尔**：否决——success 虚线钮等组合表达受限，语义色独立成 color 更干净（grilling Q11 定案）。
- **x-model 组合协议（props 读 + 组件 dispatch input + 同步 el.value）**：否决——text 分型经 el.value 把布尔字符串化（"true"/"false"），且依赖「text 分型无元素守卫」的 incidental 行为，engine 改进 x-model 时会静默碎裂。
- **保留组件级 size 属性**：否决——与 theme 档位双体系并存，「全面引入 theme」名不副实（Q12）。
- **:has() 笛卡尔积逐组合写选择器**：否决——5 色 × 5 形态 × ghost × checked 组合爆炸；中转变量层线性化。
- **tags 用 mounted 全局事件委托**：否决——与 checkable 宿主 listener 同元素竞争顺序（stopPropagation 不阻断同元素监听），需 stopImmediatePropagation + 注册顺序耦合；模板内层绑定无此问题。

## 后果

- 破坏性：旧 `type: "success"/"danger"`（语义色）用法失效——迁移动作 `type: "success"` → `type: "primary", color: "success"`；旧 `size` 属性删除。
- 组件级 CSS 变量中转层（`--asc-tone/--asc-bg/--asc-ink/--asc-line`）是组件内部实现细节，不在 `--asc-button-*` 公开覆盖面承诺内（覆盖通道仍是语义变量与 `--asc-button-*` 兜底位）。
- 纯图标正圆用法需显式 `label: ''`（label 默认 "按钮" 非空会占位）；空出口经 `:empty` + `:has` 整组隐藏，插槽有内容不受影响。
