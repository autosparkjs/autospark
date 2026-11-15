# ADR-0022: 下拉选择器 select——x-popover 机制复用与哨兵键通信

- 状态：已接受（Accepted，2026-11-13）
- 日期：2026-11-13
- 关联：ADR-0018（组件库路线图——form 批与决策 2 复用素材权威表的上位依据）、ADR-0020（input 与 BaseField——值桥协议与骨架消费契约）、ADR-0019（P0 合批——checkbox/radio/switch 骨架消费先例）、ADR-0060（x-popover 触发模型）、ADR-0052/0123（overlay 家族与内容宿主——open + dataContext:host 实例化契约）、ADR-0119（overlay 实例 keepalive——本组件不启用）、ADR-0056（决策十·插槽收集）、ADR-0088（x-component 点号组件名候选回溯）、ADR-0128 批次 4（overlay 家族外移 plugins）、ADR-0129（主题三级回退链）、ADR-0012（button 范式——样式基线）

## 背景

select 是 P1 表单+反馈主力批的首件（ADR-0018 决策 5），也是路线图点名的**重件**（每件一 ADR，决策 8）：它是 form 族第一个**弹层交互自绘**形态（对照 input/checkbox 的原生增强路线——决策 7 中「select/日历类弹层交互自绘」的显式分支）。需要钉死四件事：①下拉面板与 x-popover 指令的组合边界（复用多少、自建多少）；②面板组件与触发器组件的通信协议；③长选项列表的 virtual 接入方式；④多选裁剪与值桥协议（对齐 ADR-0020）。

## 决策

### 决策 1：与 x-popover 的组合边界——呈现归机制、内容归组件

**面板不自建弹层**（路线图决策 2 的硬约束）：内层触发器元素即 popover 宿主（`x-popover:autospark-select-panel` + `x-popover-options`），面板组件渲染进 body 覆盖物容器。职责切分：

| 面 | 承担方 | 说明 |
|---|---|---|
| 呈现 / 定位 / 层级 / 动画 | x-popover 机制（继承） | `trigger: 'click'`（点击 toggle）、面板外点击关闭、ESC 关闭（打开栈机制）、shift 视口防溢出、flip 翻转 |
| 锚定与宽度 | x-popover `fit` 选项 + 本组件补测 | `fit: true` 使 shell 面板宽随**触发器内容区**（popover 宿主元素）；`at: { placement: 'bottom-start' }` 左对齐（`bottom` 是居中语义，下拉惯例是 start 对齐）、`arrow: false`、`offset: 4` |
| 选项内容与交互 | 本组件（自建） | 列表渲染（x-for）、键盘高亮、过滤、选中联动、禁用态、空态 |

**宽度匹配的两段合成**：`fit` 的基准是 popover 宿主（触发器 span，不含盒饰 padding 与边框），面板会比盒饰窄——组件补第二段：触发器侧生成实例 uid 落根属性 `data-asc-select-uid`，面板 mounted 按uid 配对测盒饰宽、写 shell 面板 `min-width`（`fit` 持续写 `width`，min-width 抬到盒宽；popover 无 keepalive，每次打开新实例重测，盒宽变化随重开自适应）。

**程序化关闭走 popover 自有通道**：选中 / 禁用联动需要主动关面板——`engine.getOverlay().close()` 只回收**命令式通道**打开的实例（声明式 x-popover 面板不入实例注册表，对指令面板无效），故 closePanel 程序化派发触发器点击走「再点宿主关闭」的 toggle 通道（与用户操作同一关闭路径；`open` 守卫防已关态误开）。

**跨插件依赖声明**：x-popover 指令住 `autospark.overlay.js`（ADR-0128 批次 4 外移）——按需加载场景须同时引入 `autospark.overlay.js`（聚合产物无此问题）；overlay 缺席时触发器仍正常渲染（仅无面板呈现通道）。**已知引擎缺口与绕行**：x-popover attr 参数的点号组件名被指令解析器切为修饰符（`autospark.select-panel` → 组件名截断为 `autospark` 永久 MISS），x-component 化身路径已做升序候选回溯（ADR-0088）而 overlay 家族消费端未跟——面板注册名采用**连字符形态** `autospark-select-panel`（免疫点号切分且保留 autospark 前缀命名空间意图），overlay 家族补回溯后可迁回点号主名（见遗留）。

### 决策 2：面板 ↔ 触发器通信走 scope 链（零 DOM 事件、零全局总线）

overlay 内容宿主恒以 `open: true + dataContext: 'host'` 实例化面板组件（ADR-0123 决策 2 的机制红利）：面板组件零 props、零自有状态，全部数据经聚合视图沿 scope 链读写触发器组件 data 域（`getContext` 的 Proxy get/set 沿链透传——读 `filteredOptions`/`activeValue`/`value` 呈现，写交互回传）。通信协议三通道：

- **读通道**：面板绑定（x-for / x-bind:data-* / x-if / x-text / x-loading）链读触发器域——面板编译远晚于触发器 props 注入，且链读按实际路径订阅，无「props 晚注入不重算」坑（该坑仅在同域 props 注入通道）；
- **写通道·哨兵键**：面板模板不能跨组件边界调触发器 method（x-on 的组件 method 查找以组件实例为边界不穿透父组件，ADR-0022 决策 3 的机制事实）——交互回传走 data 域哨兵键：`pickTick/pickValue`（选项点击与过滤框 Enter 确认）、`keyTick/keyDir`（过滤框上下键导航）、`filterText`（过滤输入）。**自增 tick 免疫同值去重**（直接写值键时同值二次触发不通知 watcher，连选同项第二次会失灵）；
- **开合态通道**：面板 mounted / unmounted 沿链写 `open`（触发器侧 watch 派生箭头旋转、aria-expanded、过滤词复位、高亮定位）。

事件表达式纪律：**逗号运算符单表达式形态**（`pickTick = pickTick + 1, pickValue = option.value`）——分号多语句依赖新版引擎 x-on 的回退分支，旧 IIFE 产物上 SyntaxError 直接失效，逗号形态新旧通吃。

### 决策 3：值桥协议（对齐 ADR-0020，switch hidden 载体同构）

- **宿主 `el.value` 劫持** ↔ 组件 data.value（快照序：x-model expando 初值 > props.value；setter 等值守卫防 x-model 回写环）；
- **DOM→state**：选中 / 清除路径手动派发 `input`（**非冒泡**——x-model 监听在宿主自身，checkbox/switch 同款）+ `change`（冒泡，`detail = { value }`，外层消费；监听须挂内层包裹元素，engine 根元素 `@事件` 绑定不生效）；
- **表单提交**：内嵌 `input[type=hidden]` 载体，宿主 `name` 透传，提交值为当前值字符串形态，禁用时载体出表；
- **值类型边界**：x-model 对 text 控件语义把值往返归一为字符串（与原生 input 一致）——组件内部选项匹配（labelText 解析 / pick 守卫 / 选中态标记）一律**字符串归一比较**（`String(o.value) === String(v)`，`7` 与 `"7"` 互认）；需要数值 state 配 `.number` 修饰符。

### 决策 4：virtual 接入——选项开关 + 渐进增强 + 固定行高

路线图授权「懒增强或选项开关，按工程合理性定」——采用**选项开关**（`virtual: false` 缺省）：

- 面板列表双分支：普通分支（template 形态 x-for，字号档位全跟随）与虚拟分支（`x-if="virtual"` 包一层分叉避免与 x-for 同元素互斥——结构指令独占宿主）；
- **虚拟分支必须用容器形态**（`x-for.virtual` 直接挂列表容器，规范用法）：template 形态下容器无已渲染子元素，`itemHeight` 自动检测取 0 退化全量（首渲染前无子元素可测是鸡生蛋问题——规范用法恒显式传 `itemHeight`）；
- **行高固定 32px**（CSS + `x-for-options="{ itemHeight: 32 }"` 配套）：虚拟化需确定项高，与字号档位解耦（文档已声明）；
- 渐进增强：须加载 `autospark.virtual.js`，缺席时引擎 warn + 降级全量渲染（不失效，ADR-0041 决策 15 哲学）；1000 项实测窗口渲染 18 项、滚动 data-index 跟随、窗口内点选正常。

### 决策 5：多选裁剪至 P2

`multiple` / 标签形态 / 折行 / 全选 / 反选裁剪出 P1（路线图授权「多选 `multiple` P2 按需——ADR 声明边界」）。理由：①单选是值桥协议的最小完备验证面（hidden 载体 / x-model 语义在多值数组形态下需重定义，`x-model` 数组语义牵动 `.boolean` 等修饰符组合）；②多选的触发器形态（标签组 + 折行 + 计数）与面板形态（checkbox 行 + 全选）是独立的交互面，P1 并入会让首件偏离「范式定调」目标；③P0-F（checkbox）已覆盖多选语义的最小单元，组合可得。P2 增量面：`multiple` props + 值域数组 + 触发器标签组——值桥协议预留（el.value 劫持返回数组 / hidden 载体逗号拼接）。

### 决策 6：键盘与可访问性自持

弹层自绘形态无原生语义可借（switch 同款立场）：触发器 `role="combobox"` + `aria-haspopup="listbox"` + `aria-expanded`（JS 通道随开合同步）+ `tabindex="0"`（禁用时 -1 退出焦点序）；键盘：上下移动高亮（跳过禁用项、首尾环绕、打开时落当前选中项）/ Enter 确认或开面板 / ESC 归 popover 打开栈（机制继承不拦截）/ Tab 自然移焦；filterable 过滤框内键盘经哨兵键走同一导航（面板自有 method 写链——事件通道内 method 调用合法）。`aria-invalid` 经骨架 error 态同步；高亮项 `scrollIntoView({ block: "nearest" })` 跟随（面板侧 watch activeValue）。

### 决策 7：样式基线（ADR-0018 决策 6 继承）

- 盒饰 = `.asc-field-box`（input 同款 chrome，ADR-0020 消费契约），状态色经 `--asc-field-tone`；触发器热区负 margin 全铺盒饰内距（popover 点击 toggle 覆盖整个盒面）；禁用态触发器 `pointer-events: none` CSS 拦截开面板（popover 宿主监听不知禁用态）；
- 面板样式（选项 / 过滤框 / 空态 / 虚拟行高）随触发器模板同 `<style global>` 注入（面板与触发器同产物加载，幂等键单一）；选项悬停 / 高亮 / 选中 / 禁用态经 `data-*` 属性选择器驱动（x-bind 假值整属性移除 = 无态，绑定语义天然契合）；
- 三级回退链全量 + 暗色兜底变体成对写；**弹层暗色边界**：面板在 body 容器渲染，整页主题暗色（:root `dark` 属性）正常跟随，**局部 `data-dark` 容器不覆盖弹层**（[dark] 后代选择器不通达 body 容器，popover-shell 同款边界，tooltip 决策 13 同构）；
- i18n 文案两条：`select.placeholder`（回退「请选择」）与 `select.empty`（回退「暂无数据」）——空态文案超出路线图「无多语文案除 placeholder」的字面授权，按 ADR-0018 决策 1 词典约定与 empty 组件先例纳入（必要 UX 面，此处显式声明）。

## 备选方案

- **自建弹层（absolute 定位 + 点击外部关闭自实现）**：否决——路线图决策 2 硬约束（复用 x-popover，勿自建）；层叠 / 翻转 / 视口防溢出 / ESC 栈全要重写。
- **面板 ↔ 触发器经 DOM CustomEvent（bubbles 到 document + uid 过滤）配对**：否决——面板在 body 容器，事件须经 document 总线转发 + uid 身份匹配，多一层全局态；scope 链读写是 overlay 宿主机制的原生红利（ADR-0123 已把 open + dataContext:host 钉进契约）。
- **面板写值键直传（pickValue 直接驱动选中）**：否决——AutoStore 同值写入不通知 watcher，连选同项第二次「关面板」副作用失灵；自增 tick 哨兵免疫同值去重。
- **props 注入通道传选项给面板**（`x-popover-options.props`）：否决——props 对象字面量 / 数组有引擎死环缺陷（值对象 `_propsEqual` 引用比较，修复在途）；且 open + host 基准下面板链读是更短路径。
- **virtual 懒增强（超阈值自动切虚拟分支）**：否决——自动切换的行高测量依赖布局时序（首渲染鸡生蛋），且策略缺席时的降级 warn 对普通用户是噪音；显式开关 + 文档声明是可预期契约。
- **多选并入 P1**：否决——见决策 5。
- **面板注册名迁回点号 `autospark.select-panel`（双名注册）**：否决——同一模板两名会产生两份快照，overlay 实例注册表按快照键回收，`getOverlay().close()` 跨名失效；单连字符名是当前引擎缺口下的最小正确解。

## 后果

- `autospark.select` 交付：注册名 `autospark.select`（触发器）+ `autospark.select-panel`（面板内部组件，连字符注册名——非用户直接消费，无文档页投影）；产物 `autospark.select.js`（内嵌 base-field 注册，跨插件依赖 `autospark.overlay.js`，virtual 另需 `autospark.virtual.js`）；测试 `src/__tests__/components/form/select-plugin.test.ts`（27 用例，须 import overlay 家族自举——跨插件依赖的镜像）。
- 面板组件零 props / 零自有状态（data() 空对象占位建 data 层）——全部状态归触发器域，单点真相；哨兵键协议（pickTick/keyTick）可被后续弹层型组件（date-picker / time-picker / cascader / tree-select）沿袭。
- 表单桥与 ADR-0020 决策 6 分叉声明：input 控件即真身走原生直提交，select 无原生对应走 hidden 载体（switch 同构）——P1 弹层自绘族（日历类）预期同款载体。
- **遗留清单**（修复后须回访本文档）：
  1. 引擎缺口：x-popover / x-dialog / x-drawer attr 参数点号组件名无候选回溯（x-component 已修 ADR-0088）——overlay 家族补回溯后面板迁回点号主名 `autospark.select-panel`；
  2. 引擎缺口：`engine.getOverlay().close()` 只回收命令式通道实例，声明式指令面板不入实例注册表——声明式面板的程序化关闭只能走 toggle 通道模拟（选中即关依赖它，嵌套 overlay 场景下 ESC 栈顶语义不受影响但直接句柄缺失）；
  3. 引擎缺口：x-model 写入对 x-data 局部域裸名按 store 根路径解析（写落根层成孤儿键）——demo/使用侧建模绑定值走构造器全局状态（文档已注记）；
  4. 引擎值对象字面量数组/对象 props 死环（`_propsEqual` 引用比较）修复后，options 的「状态引用注入」提示可撤；
  5. P2 增量面：`multiple` 多选（值域数组 + 触发器标签组 + 面板 checkbox 行，见决策 5）、远程搜索 filterable（filter-method props）、嵌套分组选项（children / group 分组）；
  6. 面板宽度匹配的 uid 配对测量在盒宽**打开期间**变化不自动跟随（重开重测）；fit 的 autoUpdate 持续写 width、min-width 不随动——接受为 P1 边界。
