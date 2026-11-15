# ADR-0027: 下拉族两件——autocomplete 自动补全与 dropdown 下拉菜单

- 状态：已接受（Accepted，2026-11-13）
- 日期：2026-11-13
- 关联：ADR-0018（组件库路线图——P3 清单与决策 3「dropdown 进清单 P3：popover + 菜单语义键盘导航/激活态/分隔线有真实增量」的上位依据）、ADR-0022（select——x-popover 机制复用、连字符面板注册名、scope 链哨兵键通信、uid 宽度配对先例）、ADR-0020（input 与 BaseField——值桥协议与盒饰消费契约）、ADR-0021/0024（P1/P2 固化规避清单）、ADR-0012（button 范式——样式基线）

## 背景

P3 重件深水区的下拉族两件（ADR-0018 决策 5）：**autocomplete**（自动补全输入，form 行）与 **dropdown**（下拉菜单，navigation 行）。两件同源——都是「触发器 + x-popover 机制弹层」形态，且分别有强参照：autocomplete = input 的真控件输入面 + select 的建议面板；dropdown = 任意内容触发区（默认插槽）+ menu 的菜单项语义。需要钉死：①autocomplete 触发器与 input 的关系（复制 or 嵌套）；②建议数据源双通道（suggestions / fetch）与防抖；③dropdown 与 menu 的组件边界（menu 是 P2 现役件，为何不嵌套消费）；④trigger / placement 对 popover 的透传通道；⑤键盘模型（WAI-ARIA menu 模式在 popover 机制上的落法）。

## 决策

### 决策 1：autocomplete 触发器——复制 input 结构而非嵌套（input-number 先例）

真原生 input + base-field 盒饰继承（`.asc-field-box`，input 同款 chrome），**复制** input 的控件裸化结构而非嵌套消费 `autospark.input`。理由与 input-number 同构（ADR-0020 家族第三件先例）：①交互面分叉——autocomplete 的输入事件被建议管道消费（防抖 / 组合态守卫 / 建议驱动开合），嵌套消费则 input 的原生行为（clearable 等）与外层建议面板语义互相渗透；②嵌套引入跨插件产物依赖，破坏按需加载自包含；③共享面（盒饰 / 状态色 / 焦点态 / disabled·readonly 同步）已由 base-field 骨架继承覆盖。继承链 autocomplete → base-field → autospark.base（产物内嵌 base-field 注册，ADR-0020 决策 2 同款）。

### 决策 2：建议面板——x-popover 机制复用（ADR-0022 协议整体沿袭）

面板不自建弹层，沿 select 全套协议：内层触发器包裹 span 即 popover 宿主（`trigger: 'click'` + `fit: true` + `at: { placement: 'bottom-start', arrow: false, offset: 4 }` + `padding: 0`）；面板注册名**连字符形态** `autospark-autocomplete-panel`（免疫 attr 参数点号切分，ADR-0022 决策 1）；面板零 props / 零自有状态，经 scope 链聚合视图读写触发器域；哨兵键协议（面板不能跨组件边界调触发器 method）——`pickTick/pickValue`（选项点击）、`hoverTick/hoverValue`（悬停高亮回传）；面板 mounted/unmounted 沿链写 `open`；uid 根属性配对测盒饰宽补面板 `min-width`（fit 基准是触发器内容区不含盒饰 padding，两段合成同 select）；程序化开合走 popover 自有 toggle 通道（click 模型程序化派发宿主点击）。**跨插件依赖声明**：面板呈现须同引 `autospark.overlay.js`（缺席时触发器仍可用，仅无建议面板）。

### 决策 3：建议数据源双通道——suggestions 本地 + fetch 异步（action 名通道）

- `suggestions`：`string[] | { value, label? , disabled? }[]` 状态引用注入（字面量数组 props 死环规避，P0 固化清单第 1 条），内部归一化为 `{ value, label }[]`（string 元素 `{value:s, label:s}`）；本地过滤 = 对 label·value 不区分大小写包含匹配（select filterable 同款简实现），query 为空显示全量。
- `fetch`：**action 名字符串**（如 `fetch: 'searchCity'`），组件内经 `scope.getAction` **延迟解析**（支持晚注册；描述符 `.handle` 命令式直调）。**取舍声明（实施期修订）：props 函数引用形态不可达**——autostore 对状态树函数值「见函数即求值」（computed 语义）：状态任何层（含对象成员）的函数经表达式读取即被求值（实参收整棵 state），`{ fetch: searchFn }` 的 props 求值当场把函数吃了；action 通道（`options.actions` / `engine.actions` Proxy / `<script type="autospark/actions">` 三入口统一）是引擎既有的函数外置通道，天然免疫。函数引用判定保留为兼容位（未来引擎 markRaw 化函数 props 后激活）。fetch 在场**全权接管**建议产出（不做本地过滤叠加——相关性由服务端裁决）且**空词不发请求**（挂载期 / 聚焦期不触发，输入驱动，antd 同款）；缺席回退 suggestions 本地过滤。
- `debounce`（默认 300ms）：fetch 与本地过滤共用输入防抖（0 = 即时）。
- **次序守卫**：fetch 异步回包以自增 seq 标记，过期回包（期间又有新输入）静默丢弃；pick 后清待发防抖计时器（防选完又弹旧建议）。
- **IME 组合态守卫**：composing 期间（compositionstart ~ compositionend）input 事件不驱动建议管道（拼音中间态不触发请求），compositionend 补一次解析——中文输入是本库一手场景。

### 决策 4：值桥与事件（文本语域，input 范式对齐）

- `el.value` 劫持 ↔ 内层原生控件（getter 读控件、setter 写控件；劫持前快照 expando、初始化窗口重放识别、`value` props 单向同步等值守卫——input 决策 5 全套）；
- **输入路径零手动派发**：原生 input 事件自然冒泡过宿主，x-model 直接命中（input 同款薄桥）；
- **pick 路径手动三派发**：选中建议程序化写控件后派发 `input`（自原生控件冒泡，x-model 回写）+ `change`（冒泡 `detail = { value }`）+ `select`（冒泡 `detail = { value }`——antd onSelect 同名语义：仅在选中建议时触发，区别于每次输入）；清除路径派发 `input`（x-model 清空回写）；
- 值域恒 string（文本语域，`String(item.value)` 落盘）；原生 blur 的无 detail change 仍自然冒泡（文本域原生语义保留）。

### 决策 5：建议面板开合模型——输入驱动（focus / 输入 / 空自动关）

popover `trigger:'click'` 为底座（面板外点击 / ESC 关闭机制继承），组件补三条开合规则：①**focus 确保开**（Tab 聚焦也开面板——click 模型只认点击，键盘聚焦须补程序化 toggle）；②**输入确保开**（已关状态输入即重开，antd 同款）；③**建议空自动关**（过滤 / 回包空组关面板）。**真实点击 latch**：focus 确保开与 popover 自身 click toggle 存在竞态（点击落焦点先于 click 派发）——触发器 capture 层记录最近真实点击时刻，focus 路径在短窗（400ms）内跳过程序化开（该点击已由 popover toggle 自理），防双 toggle 互关。点击已开面板的输入区再关面板是 popover toggle 语义的自然结果（再输入即重开），接受为边界。

### 决策 6：dropdown 触发区——默认插槽包裹交互 + 菜单项语义自持

- **触发区 = 默认插槽**：任意内容（button / 文本 / 图标）投影进触发器包裹 span。**出口与 popover 宿主同元素**（实施期实证修正）：`x-slot` 出口不能落在覆盖物宿主的**子树内**——ADR-0056 决策十把「覆盖物宿主子树内的 x-slot」判为**内容标记**直接剪枝（出口消失、consumer 内容丢失，card 对照实证）；出口与宿主合一（`<span class="asc-dropdown-trigger" x-popover:* x-slot>`）则不命中该判定（其匹配查 `parentElement` 链），consumer 内容直接成为宿主子级，点击即 toggle。包裹 span 同时是键盘监听点 + `tabindex=0`（文本触发区也可达；button 内容时多一个 tab 停靠点，接受为边界）+ `aria-haspopup="menu"` / `aria-expanded`（JS 通道随开合同步）。**为什么包裹而不直接把插槽内容作宿主**：插槽内容是使用者的任意元素，popover 指令须挂在组件自有的稳定元素上。
- **菜单项语义自持，不嵌套消费 autospark.menu**。**与 menu 的组件边界（路线图决策 3 增量的落实）**：menu = 页面导航区**常驻**组件（路由激活态映射、子菜单展开态、collapsed 形态，自身持有 value/openKeys 状态域）；dropdown = **动作触发型轻量菜单**（按钮旁弹出、即点即走、无激活态持久语义，select 后即复位）。嵌套 menu 会拖入无关的受控值通道 / 形态面，且 menu 是完整组件（自有状态域）与「面板即视图」的 popover 内容模型冲突。自持成本可控：菜单项渲染（icon / disabled / divided 分隔线 / danger 危险色）+ 键盘漫游 + select 事件，全部是 select 哨兵协议的直接复用。
- `items` 双形态（menu 同款）：`{ key, label, icon?, disabled?, divided?, danger? }[]` 状态引用注入；`<x-dropdown-item key label icon disabled divided danger>` 子元素声明（含裸 `items` JSON 属性）经 precompile 变换折叠为 items JSON 落宿主 `data-items` 字符串属性（标量通道绕开值对象字面量数组死环），mounted 解析写 data 响应渲染。

### 决策 7：trigger / placement 透传——x-popover-options 成员属性表达式通道

- `trigger`（`'hover'` 缺省 | `'click'`，antd/element 同款缺省）经 `x-popover-options.trigger="trigger"` 成员属性表达式注入（可绑定状态热切换；打开中的面板不重估，切换自下一次触发生效——机制语义）；
- `placement`（缺省 `'bottom-start'`，12 方向透传）经 `x-popover-options.at="{ placement: placement }"` 注入——`at` 结构键跨层成员级合并（静态层 `arrow:false, offset:4` 与表达式层 placement 并存，selector 恒回退宿主）；
- **程序化开合按触发模型分派**（键盘开面板 / 选中即关）：click 模型派宿主 click（toggle 通道，select 同款）；hover 模型派宿主 `mouseenter`（含 delayShow 悬浮延迟）/ `mouseleave`（relatedTarget 空 → 离开共享 hover 域 → delayHide 宽限后关闭）——两模型各有原生关闭链，不绕开机制自建关闭。

### 决策 8：键盘（WAI-ARIA menu 模式，select 同款高亮漫游模型）

**高亮漫游而非 roving focus**：焦点恒留触发区，上下键移动 `data-active` 高亮（跳过禁用项、首尾环绕）、Enter 触发当前高亮项、ESC 归 popover 打开栈（机制继承不拦截）、Tab 自然移焦；高亮项 `scrollIntoView({ block: "nearest" })` 跟随（面板侧 watch）。**否决 roving tabindex**（ARIA menu 严格形态）：面板每次打开都是新实例（popover 无 keepalive），真焦点迁入 body 容器面板后的归还/时序管理复杂度高，select 高亮模型已是本库弹层族既定先例（ADR-0022 决策 6），族内一致性优先。dropdown 增量语义：开态 Enter 无高亮时关面板并 preventDefault（防误触发表单提交）；悬停高亮跟随（`hoverTick` 哨兵，antd 同款）。autocomplete 键盘同模型（上下选建议 / Enter 确认 / ESC 机制关闭），Enter 确认即 pick 三派发（决策 4）。

### 决策 9：样式基线（ADR-0018 决策 6 继承 + 用户视觉对齐硬性要求）

- **autocomplete 触发器与 input 同款盒饰**：base-field 继承（`.asc-field-box`），控件裸化（input 结构复制）；清除钮 / loading 指示复用 input 系动作件样式语义（`--auto-third-color` 常态 → hover 正文色）；
- **两件面板与 select 下拉面板同款**：字号 `--auto-font-size`（data-size 全跟随）/ 行高 / 列表最大高滚动 / 选项行内距与 `--auto-hover-bgcolor` hover·active 反馈 / 禁用淡化 / 空态辅助色；外壳（边框 / 阴影 / 定位）归 popover-shell；
- **dropdown 菜单项语义色 token 与 menu 同源**：hover 底 `--auto-hover-bgcolor`、danger 染 `--auto-danger-color`（hover 底 color-mix 8% tint，menu 激活 10% tint 同手法）、divided 分隔线 `--auto-border-color`、图标随文字色；
- 三级回退链全量（`--asc-autocomplete-*` / `--asc-dropdown-*` 覆盖通道）+ 暗色兜底变体成对写；弹层暗色边界同 select（局部 data-dark 容器不覆盖弹层）。

## 备选方案

- **autocomplete 嵌套消费 autospark.input**：否决——见决策 1（input-number 先例三理由）。
- **fetch 走 props 函数引用（状态引用注入函数）**：否决——autostore 见函数即求值（决策 3 实证），props 求值当场把函数吃了；action 通道是引擎既有的函数外置通道。
- **fetch 自动经 `actions['<实例名>/search']` 命名空间约定注册**：否决——发明隐式命名约定，使用者心智多一层；显式传 action 名（或将来函数引用兼容位）是可预期契约。
- **dropdown 嵌套消费 autospark.menu**：否决——见决策 6（menu 自有状态域与面板即视图模型冲突；动作菜单无激活态持久语义）。
- **roving tabindex 键盘模型（ARIA menu 严格形态）**：否决——见决策 8。
- **trigger/placement 运行时改写 popover 指令选项**（mounted 读 props 再 setAttribute）：否决——指令选项编译期消费，运行时改属性不重估；成员属性表达式是机制原生热切换通道。
- **hover 模式禁用键盘开面板**：否决——合成 mouseenter/mouseleave 可达原生开闭链（决策 7），无须裁剪键盘可达性。
- **建议面板自建弹层（absolute + 外点关闭自实现）**：否决——路线图决策 2 硬约束（复用 x-popover）。
- **面板经 DOM CustomEvent + uid 配对回传**：否决——scope 链哨兵键是 ADR-0022 已验证协议（零全局总线）。

## 后果

- 交付物：`autospark.autocomplete`（+ 内部面板 `autospark-autocomplete-panel`，产物 `autospark.autocomplete.js`，内嵌 base-field 注册，同引 `autospark.overlay.js`）；`autospark.dropdown`（+ 内部面板 `autospark-dropdown-panel`，产物 `autospark.dropdown.js`，同引 `autospark.overlay.js`）。测试 `src/__tests__/components/form/autocomplete-plugin.test.ts`（27 用例）与 `src/__tests__/components/navigation/dropdown-plugin.test.ts`（19 用例），均显式 import overlay 家族自举（跨插件依赖镜像）。
- 两件沿用 select 的哨兵键协议族（pickTick / hoverTick / open），后续弹层型组件（date-picker / cascader / tree-select）继续沿袭；hoverTick（悬停高亮回传）是本批新增协议成员。
- **本批实证的引擎/autostore 边界**（后续组件照此规避，根治归 engine/autostore 侧）：
  1. **状态树函数值见函数即求值**（computed 语义，含对象成员层）——函数经表达式读取即被求值，props 函数引用通道不可达；可调用面走 action 通道（决策 3）；
  2. **覆盖物宿主子树内的 x-slot 被判为内容标记剪枝**（ADR-0056 决策十）——弹层型组件的插槽出口须与覆盖物宿主同元素（决策 6）；
  3. **detached 容器 focus() 不更新 activeElement**（happy-dom 实证）——聚焦判定用组件自维护 focused 旗（focusin/focusout），不现查 activeElement。
- **遗留清单**：
  1. autocomplete 无 virtual（长建议列表虚拟化）——建议列表天然短（防抖 + 相关性裁剪），超长场景 P4 按需增补（协议同 select 决策 4）；
  2. dropdown 面板宽度不跟随触发器（无 fit）——动作菜单面板宽随内容为 antd 同款；需对齐形态后续开 `fit` props；
  3. hover 模式选中后经 delayHide（150ms）宽限关闭——非即时，接受为机制语义；
  4. `x-popover-options.at` 成员表达式的 placement 热切换对**打开中**面板不重估（机制语义，自下一次触发生效）——文档已注记；
  5. 引擎修复（overlay 家族 attr 参数点号候选回溯，ADR-0022 遗留 1）后，面板注册名可随 select 一并迁回点号主名；
  6. dropdown 触发区含可聚焦内容（button）时包裹 span 多一个 tab 停靠点——ARIA 严格形态须 roving focus 配套（已否决），接受为边界；
  7. autostore 侧若提供函数值免求值通道（markRaw 化 props 或状态函数豁免），fetch 的函数引用兼容位可转正为主通道之一（决策 3 修订可回访）。
