# ADR-0060：x-popover 悬浮形态（触发方式：悬浮/点击 + 共享 hover 域 + hover 链）

- **状态**：Accepted（2026-10-11 修订：新增 `trigger` 触发方式选项（`hover` | `click`），click 形态语义与 hover 链解耦见文末[修订记录](#修订记录2026-10-11触发方式选项-trigger)）
- **日期**：2026-09-28（初版） / 2026-10-11（修订）
- **关联**：[ADR-0052](0052-x-overlay-and-x-dialog.md)（覆盖物组件化统一——`x-popover` 为预留的「未来同构薄子类」）、[ADR-0007](0007-directive-options-and-modifiers.md)（配置体系：`x-popover-options` / 成员属性 / 定向）、[ADR-0053](0053-component-data-boundary.md)（dataContext 基准）、[ADR-0056](0056-x-slot.md)（插槽投影）、[CONTEXT.md](../../CONTEXT.md)（覆盖物消费者词条）
- **共识来源**：grilling 两轮决策（触发语义、关闭触点集、delayHide 配对、值语义、placement 默认、hover 链、运行时覆盖取舍、同宿主多声明处置），本文即共识落盘

## 背景

ADR-0052 修订版为覆盖物消费者家族预留了「薄子类 + 形态差异」的扩展路线，`x-popover` 是第二个落地成员（`x-dialog` 之后）。形态目标：**悬浮触发**的轻量贴附浮层——鼠标移入宿主元素显示、指针离开后关闭（悬浮菜单、卡片提示、级联面板）。

核心矛盾在家族原则：ADR-0052 把覆盖物消费者定义为**纯状态驱动**——「宿主是纯声明点（无隐式交互），值专职 visible 布尔控制，真值即开」。悬浮触发要求宿主成为**交互触发器**、且没有 visible 状态真相源——这是对家族原则的显式偏离，需要落盘偏离范围与不外溢边界。

## 决策

### 一、触发模型：对「纯状态驱动」的显式偏离（限本指令，不改家族）

> **触发方式可选（2026-10-11 修订）**：本节描述默认方式 `trigger: 'hover'`；`'click'` 点击 toggle 方式的语义、关闭触点重裁、hover 链解耦与修饰符桥接见文末[修订记录](#修订记录2026-10-11触发方式选项-trigger)。

`PopoverDirective` 为 `OverlayDirective` 薄子类，宿主承载 `mouseenter`/`mouseleave` 悬浮监听：

- **悬浮意图语义**（非字面 `mouseover`）：mouseover 冒泡、宿主子元素间移动反复触发，不是想要的语义；mouseenter/mouseleave 不冒泡、每元素一次，是「指针进入/离开这个元素」的准确表达；
- **无状态真相源**：指令值不参与驱动，非空值 warn（悬浮即驱动，引入值通道会制造两个真相源）；无写回（`_makeCloseRequest` 恒 null）；
- **偏离不外溢**：家族其余成员（x-dialog / 命令式 OverlayHandle）维持纯状态驱动；「悬浮之外还要程序化开关」的需求由 x-dialog + `@mouseenter` 改状态组合表达，不设混合驱动形态。

触摸设备 hover 不适配（悬浮无对应物），文档指引触屏场景改用 `trigger: 'click'`（2026-10-11 修订；初版指引改用 x-dialog）。

### 二、关闭触点集：共享域离开 + ESC，仅此两个（YAGNI）

| 触点 | 裁决 | 理由 |
|---|---|---|
| 指针离开共享 hover 域（delayHide 宽限） | ✅ | 悬浮模型的本质关闭语义 |
| ESC（打开栈栈顶） | ✅ | 家族既有机制零成本继承；嵌套时先关子级（栈序） |
| 点击外部区域关闭 | ❌（hover 方式） | 离开即关的场景下是冗余通道，需新建 document 级监听；click 方式下反转为主关闭通道（2026-10-11 修订） |
| 宿主点击 toggle | ❌（hover 方式） | 点击语义与悬浮模型冲突；click 方式即本语义（2026-10-11 修订） |

无遮罩（裸面板直挂容器），`closeOnMask` 无意义。

### 三、共享 hover 域：双侧监听 + relatedTarget 判定

面板渲染在 body 容器、与宿主 DOM 分离（兄弟而非后代）——「宿主→面板」在 DOM 层是真正的 leave。机制：

- 宿主与活跃面板（`inst.el`）**双侧**挂 mouseenter/mouseleave：一侧进入清除挂起关闭、一侧离开进入关闭判定；
- 关闭判定：`leave.relatedTarget` 落在共享域内 → 豁免；域外 → `delayHide` 宽限后关闭（到期**不重估**——宽限期内回到域内会触发域内 mouseenter 已清定时器）；
- **delayHide 与 delayShow 配对**（默认 150ms）：宿主↔面板间隙（箭头 + offset 6px）与手部抖动的关闭宽限，否则「还没移进面板就关了」的闪烁体验；delayShow 默认 200ms（悬浮意图延迟，快速掠过不触发），均 0 即无延迟，经 `getOption` 三层链（成员表达式 > 指令选项 > 宿主选项），不接 ADR-0051 运行时覆盖（机制未落地，表达式通道已覆盖状态驱动需求）。

### 四、hover 链：后代域并入 + 关闭后重估（嵌套的根基）

嵌套 popover 的面板全部在 body 容器内、互为 DOM 兄弟——指针「父面板→子面板」是父域的 DOM leave，朴素的域判定会闪关父级（多级菜单场景整个交互废掉）。机制（document 级**打开中消费者注册表**，对齐打开栈的多 engine 共享先例）：

- **后代域并入**：域收集从自身（宿主∪面板）出发，把「宿主落在本域内」的打开消费者的域递归并入——指针位于任一后代 popover（宿主或面板）上时祖先豁免；
- **关闭后重估**：后代关闭（含 ESC 关子）时通知祖先（宿主落在本实例面板内的消费者）重估——指针最后已知坐标经 `elementFromPoint` 反查现命中元素，已出域才关闭。重估是必须的：父的 leave 已被链豁免、不会再触发，浏览器在面板移除后的事件补发不可依赖（happy-dom 无此行为）；坐标取自最后一次鼠标事件（实例关闭后指针未动则坐标仍准确）；
- **级联自然发生**：子面板销毁 → 面内孙宿主随 scope 级联销毁 → 孙消费者的 destroy 清理自身，无需链式特判。

实例关闭的感知不走 DOM 冒泡（面板在 engine 树外），经 `engine.on("overlay:close")` 总线订阅 + instance 身份比对，统一覆盖 ESC / 悬浮离开 / close action / 销毁全路径。

### 五、形态默认：锚宿主 + bottom + 裸面板

- **默认锚 = 宿主元素自身**（元素引用两栖形态，免选择器查询）；`x-popover-options.at` 显式配置与默认锚**成员级合并**——用户写出的成员生效、缺省成员回退（selector 缺省宿主、placement 缺省 bottom），部分锚对象（如只写 `placement`）不丢锚、不退居中——**换锚只改位置不改变触发关系**（触发器恒为宿主、共享域恒为「宿主∪面板」；远程锚的指针长途旅行可能超出 delayHide 宽限，文档标注）；
- **placement 默认 `'bottom'`**（popover 惯例：菜单向下 + flip 兜底翻转；家族默认 `'auto'` 让位于此——触发点多是按钮/链接，向下符合直觉），箭头默认开（家族锚定行为）；
- `animate` 沿家族默认 `'fade'`；裸面板补 `z-index: var(--autospark-overlay-z)`（类级 initialize 注入，选择器 `[data-autospark-overlays] > .autospark-dialog` 只命中容器直接子级、不影响 dialog 遮罩内面板）——fixed 定位无 z-index 会被页面高层级内容覆盖。

基座配套最小改造：`OverlayDirective` 抽出 `_resolveConfig(optionLayer)` 配置出口钩子（开放-封闭），popover 覆写注入默认锚与 placement，不复制 `_instantiate` 全段。

### 六、值与多声明的防呆姿态（warn 不拦截，对齐家族哲学）

- **值不参与驱动**：非空值 warn 指回悬浮模型（失效可发现，不静默吞）；
- **同宿主多 popover 声明**：悬浮驱动源唯一重合（同一份 hover 将同时打开全部面板），warn 可发现、不去重不拦截——对齐基座 singleton=false「用户错误不静默纠正」哲学；与 x-dialog 多 attr（各有独立 visible 驱动源，合法并存）的本质区别在驱动源是否重合；
- **缺 attr**：warn（「缺少组件名 attr」）且不挂触发器（挂了也只会走基座的未命中等待）。

## 测试

`src/__tests__/x-popover.test.ts`：悬浮打开（裸面板/默认锚 placement）、delayShow 延迟与中途取消、共享域互移不闪关、delayHide 宽限与回域取消、ESC 关闭、消费者销毁清理、嵌套 hover 链（父保持 / ESC 关子重估保持 / 重估关闭）、值 warn / 多声明 warn / 缺 attr warn、自定义锚 placement、成员属性表达式延迟、props 通道、样式注入幂等；触发方式（2026-10-11 修订）测试面见文末修订记录第 9 条。

## 废止

- 无。CONTEXT.md「覆盖物消费者」词条的「v1 仅 x-dialog」清单一并修订（x-popover 纳入）。

## 修订记录（2026-10-11：触发方式选项 trigger）

初版触发模型仅有悬浮形态（上文决策一）；本修订引入 `trigger` 选项把触发方式扩展为 **`hover`（默认，即初版形态，完全向后兼容）| `click`** 两方式。动机：初版文档触屏 warning 遗留的「点按开关、外点关闭」债务的偿还路径 + 点击场景（常驻菜单、操作面板）的显式表达。

1. **选项定义**：`trigger` 走 `getOption` 三层链（整包 / 成员属性表达式 / 宿主选项），取值封闭 `hover` | `click`；非法值 warn + 回退 `hover`（对齐 `delayShow`/`delayHide` 非法值哲学）。`focus` / `manual` 不做（YAGNI）：键盘可达经 button 宿主 Enter/Space 天然触发 click；`manual`（程序化开关）与「值不参与驱动、无 visible 真相源」原则冲突，是 x-dialog 状态驱动的领地。
2. **click 方式语义**：宿主 click 即 **toggle**（开↔关，一次点击语义一致）；关闭触点三通道——再点宿主（toggle）、**点击面板外部**（document 级监听，命中目标不在活跃面板内即关；点其他 popover 宿主算外部，关旧开新自然发生）、ESC（打开栈栈顶，机制继承）；**面板内点击不关**。决策二原两条 ❌ 裁决的否决理由均限定 hover 语境（「离开即关场景冗余」/「与悬浮模型冲突」），click 方式下均不成立，本修订在 click 语境重裁为采纳。
3. **hover 设施不生效**：click 方式下宿主/面板悬浮监听按当前 trigger 现读分流忽略（鼠标移出面板无反应——面板内交互控件可安全使用）；`delayShow`/`delayHide` 静默不适用、不 warn（trigger 可为表达式热切换，静态 warn 会误伤合法场景），文档标注「仅 hover 方式生效」。
4. **读取时机**：监听恒挂 + 回调内现读 `getOption('trigger')` 分派——与 `_resolveDelay` 每次触发现读同构，热切换零特例；打开中的面板遇 trigger 值变化**不重估不打断**，切换自下一次触发生效（对齐本 ADR「配置应用点 = 每次打开现读，重开生效，不热应用」）。
5. **修饰符桥接**：`.click`（ADR-0007 修饰符解析期注入为 `options.click === true`，与 `trigger` 键名错位，指令内桥接）：显式 `options.trigger` 恒优先 > `options.click === true` → `'click'` > 默认 `hover`（对齐 ADR-0007「显式已写则不覆盖」同精神）；只做 `.click`、不做 `.hover`（修饰符惯例是打开非默认开关，无「写默认值」先例）。
6. **hover 链解耦（登记与触发解耦）**：click 消费者打开时仍登记 document 级打开中注册表（充当 hover 后代的域容器——嵌套 hover 子级的链判定需要父面板在表中），但自身不挂 leave（天然无豁免/关闭）、后代关闭后的重估通知**跳过 click 消费者**（防「子关闭重估时指针恰在面板外把 click 父误关」——click 父的关闭只听点击/外点/ESC）。反向组合（hover 父 + click 子）经既有链机制天然成立，零新决策。
7. **防呆措辞中性化（行为不变）**：指令值 warn（「悬浮触发模型…」→ 按 trigger 中性表述——click 方式同样值不参与驱动）；同宿主多声明 warn（「悬浮驱动源重合，hover 将同时打开」→「触发源重合，同一次触发将同时打开」——click 方式下一次 click 开全部面板，同样 warn 不拦截）。
8. **术语**：CONTEXT.md 新增「点击触发」词条；「悬浮触发」降格为默认触发方式描述（其 Avoid「外点关闭」限定 hover 方式语境）；「抽屉把手」消歧 x-popover `trigger`（触发方式枚举）与 x-drawer 已删除旧选项名 trigger 同名不同义；「悬浮形态」领域称呼保留（hover 仍是默认与主形态）。
9. **测试面**：click 打开 / 再点宿主 toggle 关 / 点击面板外部关 / ESC 关 / click 方式下 mouseenter 无反应 / `delayShow`/`delayHide` 被忽略 / `.click` 修饰符桥接生效 / 修饰符与显式 `trigger` 同写显式赢 / 非法值 warn 回退 hover / 嵌套混合（click 父 + hover 子：子正常 hover、子关闭时父不被重估误关）。
