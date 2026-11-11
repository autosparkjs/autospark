# ADR-0015: x-badge 徽标指令——独立于装饰动效家族的内容徽标

- 状态：已接受（Accepted，2026-11-10）
- 日期：2026-11-10
- 关联：ADR-0002（值订阅 / Runtime 通道 / 双路径自举——家族契约语义对齐）、ADR-0003（插件开发方式与 IIFE 产物契约）、ADR-0007（修饰符注入纪律——三通道等价）、ADR-0010（同词不同面先例——视觉同源命名）、ADR-0013（独立控制器先例——决策 6 同款「复用家族契约语义不共享实现」）；engine ADR-0135（x-icon badge 选项退役更名 shape）、ADR-0046/0058（x-icon 图标指令与 SMIL 动画）

## 背景

诉求：在 `@autospark/plugins` 新增 `x-badge` 指令——为宿主元素增加**内容徽标**（小红点 / 数字角标），**同时支持运行时**（动态插入 DOM 即生效）。经 grilling 两轮十一问收敛（术语冲突 / 值语义 / 零值规则 / 定位 / 键面 / 颜色形态 / 架构落点 / ripple 默认与载体 / 视觉规格 / 范围边界 / 溢出语义）。

访谈期浮出的关键事实：**`badge` 一词在项目内已有三处占用**——① 装饰动效家族的 `badge` 选项（x-ripple / x-spin 的波纹角标载体，波环自圆边扩散）；② button 的 `icon.badge` 键（伪元素红点角标）；③ engine x-icon 的 badge 选项（**已退役**，ADR-0135 更名 shape）。本指令是第四个占用面，须词条消歧而非改名收敛。

## 决策

### 决策 1：独立指令实现，不进 decorate 家族（SRP）

`src/directives/x-badge/index.ts` 独立内聚，**不**扩展 `DecorateStrategy` 钩子面：decorate 内核解决「装饰动效生命周期」（值 truthiness 开关、触发器 always/hover/click、载体伪元素探测降级、动画状态机），x-badge 解决「**常驻内容渲染 + 响应式数字**」——值是 count 数据流而非开关键、无触发器概念、无伪元素降级诉求，硬塞会留一堆空钩子（trigger / layerCount / animName 全无意义）。照 x-scrollbar 先例（ADR-0013 决策 6）：独立控制器，复用家族契约**语义**（生命周期形态、订阅双轨、CSS 幂等注入模式）不共享实现，decorate.ts 零改动。

### 决策 2：Runtime 通道 + 值订阅双轨

kind=1（Runtime，observer 通道，ADR-0002 决策 3 修订）：编译器致盲、属性保留在结果 DOM，`mounted/unmounted/attrChanged` 生命周期——**动态插入 DOM 即生效、改属性即重建**，即用户「同时支持运行时」的诉求本体。值订阅双轨：宿主 scope 命中走 `scope.watch`（支持相对路径），无 scope 回退 `engine.store.watch` 绝对路径；`attrChanged` 重新求值并重绑订阅。

### 决策 3：值与选项分工（键面）

值**专职 count 表达式**（字面量数字 / 状态路径，响应式重求值；dot 形态值可省略——红点不依赖数字），选项走 `x-badge-options`（relaxed-json，静态求值一次）：

| 键 | 取值 | 默认 | 语义 |
|---|---|---|---|
| `type` | `'dot' \| 'count'` | `'dot'` | 展示形态（与 button 插件 type 同词同义：决定长什么样） |
| `overflowCount` | number | `99` | `count > overflowCount` → 显示 `"${overflowCount}+"`（99→99，100→99+，「超过」即严格大于） |
| `color` | 任意 CSS 颜色值 | 见决策 8 回退链 | 徽标前景/底色 |
| `ripple` | boolean | `false` | 常驻脉冲动画（显式开启） |

修饰符糖三通道等价（ADR-0007 + decorate 家族惯例）：`x-badge.count` ≡ `type:'count'`、`x-badge.dot` ≡ `type:'dot'`、`x-badge.ripple` ≡ `ripple:true`。

### 决策 4：零值隐藏

值求值为 `0 / null / undefined / false / ''` → **不渲染徽标**（宿主干净，「0 条未读 = 无消息」）；dot 形态视为「有值即显」，**无值时恒显**——`x-badge`（无值）显红点、`x-badge="0"` 隐藏，二者语义正交不矛盾。`showZero` 选项 YAGNI 未立项。

### 决策 5：定位契约

固定**右上角骑跨**（`top:0; right:0; transform: translate(38%,-38%)`），不做 placement 四角选项（YAGNI）；宿主 computed `position` 为 static 时指令注入 `relative`（`:where()` 零特异性兜底，fixed/absolute 宿主不动）；**空宿主 + dot 即独立徽标**（列表状态点用法，无额外机制）。

### 决策 6：视觉规格

- **dot**：8px 正圆（对齐 decorate badge 载体惯例尺寸）
- **count**：高 16px / 字号 12px / 水平 padding 4px / `min-width:16px` / 圆角 `999px`——单数字正圆、多位数字自适应胶囊宽
- **白色 1px 分离边**：`box-shadow: 0 0 0 1px var(--autospark-badge-outline, #fff)`——不用 `outline` 属性（圆角场景兼容坑，box-shadow 在圆形/胶囊上可靠且不占布局）；暗色主题下仍默认白（徽标与宿主内容的分离边，非主题色）
- **无障碍**：徽标元素 `aria-hidden="true"`（纯视觉装饰不进读屏；数字信息由宿主内容或状态本身传达）
- CSS 变量族 `--autospark-badge-*`，实例值写宿主内联 style

### 决策 7：ripple 动画——默认关、双形态载体

`ripple` **默认 false**（动画是增强不是基线，SMIL/CSS 持续动画有性能与 reduced-motion 成本；`ripple: true` 显式开启）。参考物是 engine 内置图标 `ripple`（`x-icon` 体系，SMIL 动画：中心点 1.5s 呼吸 + 双错相扩散渐隐环，持续循环；button `checkStyle="ripple"` 同款视觉同源先例 ADR-0010）。载体按形态分派：

- **dot + ripple**：内联 SMIL SVG 复刻该图标（`currentColor` 染色，视觉同源、零 CSS 动画设施）
- **count + ripple**：数字文本 + `::after` box-shadow 扩散环（CSS keyframes，不叠 SVG——会遮数字）
- `prefers-reduced-motion: reduce` 停播（decorate 家族惯例）

### 决策 8：color 三级回退链

缺省红走 `var(--auto-danger-color, var(--autospark-badge-color, #ef4444))`——theme 派生令牌 → 插件独立覆盖变量 → 校准字面值（ADR-0129 三级回退同款，decorate 家族 `RIPPLE_BADGE_COLOR` 同构），随 theme / 暗色翻转。**不支持语义色名**（danger/success/…）——那是 button 组件的 color 体系；指令家族惯例是裸 CSS 值（x-ripple / x-spin 同款）。

### 决策 9：术语消歧（不收敛）

`badge` 四占用面**共存**：本指令（通用内容徽标）/ decorate `badge` 选项（波纹角标载体，已发布 API 与波纹几何深度耦合）/ button `icon.badge` 键（伪元素红点）/ engine 退役词（ADR-0135）。收敛属重构非本任务范围；`packages/plugins/CONTEXT.md` 新增「徽标层」词条 + 「内部涟漪形态（inside）」词条补消歧注记。`ripple` 键同词不同面：badge 常驻脉冲 ≠ x-ripple 点击扩散（文档显式区分）。

## 备选方案

- **decorate 家族新成员**（扩展 `DecorateStrategy`）：否决——钩子面与内容渲染不同构，违反单一职责（决策 1）。
- **挂 decorate 之名的纯壳**：否决——名实不符，徒增间接层。
- **语义色名 color**（danger/success/...）：否决——指令家族无此约定（button 组件体系），三级回退链已覆盖主题联动。
- **placement 四角选项 / showZero / offset 偏移**：否决——YAGNI，等真实需求。
- **count + ripple 叠 SVG 环**：否决——SVG 载体会遮挡数字文本，CSS 扩散环不占内容位。
- **`outline` 属性白边**：否决——圆角兼容坑，`box-shadow` 可靠。
- **`role="status"` 无障碍语义**：否决——徽标是视觉装饰，数字信息另有真相源；`aria-hidden` 归位。
- **`<x-badge>` 组件形态 / button 内置集成**：否决——诉求是宿主增强指令语义；button 集成范围排除。
- **overflowCount 含等边界**（`>=` 显示 `+`）：否决——用户明示「超过」即严格大于。
- **badge 术语收敛**（废弃 decorate badge 选项统一走 x-badge 组合）：否决——已发布 API 且与波纹几何耦合，重构另立任务。

## 后果

- 实现：`src/directives/x-badge/index.ts`（单文件内聚：类型 + 样式注入 + 归一 + 控制器 + spec + 自举，`bootstrapBadgePlugin` 模块加载即执行 → `installPlugin` 双路径）；decorate.ts 零改动。
- 构建：`vite.config.ts` CLOSURE_ARTIFACTS 登记 `autospark.badge.js` + 聚合入口 `src/index.ts` 登记。
- 测试：`src/__tests__/directives/x-badge.test.ts`（bun:test + happy-dom，照 x-scrollbar/x-ripple 测试形态）。
- 文档：`docs/zh/guide/directives/x-badge.md` 五段骨架 + `docs/demos/badge/` demo + 侧边栏「扩展指令」登记。
- CONTEXT.md：新增「徽标层」x-badge 词条（含四占用消歧）；「内部涟漪形态（inside）」词条 `_Avoid_` 补 badge 同名不同物注记。
- engine 零改动；既有插件零影响（产物清单追加项）。

### 实施期发现（2026-11-10，真浏览器 e2e 揭示；同日家族统一修复）

**AutoStore 实例无 `read` 方法——decorate 家族值订阅回退分支共病**：无 scope 宿主（运行时动态 `setAttribute` / 动态插入元素，不在编译期 scopeMap）走 `engine.store.watch` 回退分支时，initial 取值写的是 `store.read?.(expr)`——该方法**不存在**（官方取值通道是 autostore 的 `getVal(state, path)`），恒 undefined，表达式值静默落入零值/恒关分支不渲染（单测全绿是因为编译产物内宿主 scope 命中不走回退）。**统一修复**：抽 `src/utils/readStorePath.ts`（一函数一文件，ADR-0009）——经运行时命名空间 `nsMember("getVal")` 取 `getVal`（engine IIFE 全量转导出 autostore 挂类静态，ADR-0030/0111，与 engine 侧 `scope.watchPath` 同一取值实现，零静态依赖纪律不破），四处消费收敛：x-badge / x-scrollbar（独立控制器内联回退）+ decorate.ts（x-ripple / x-spin 共享内核）；各补「动态插入元素 + 表达式值」回退分支测试，真浏览器抽验 x-ripple 恒开→转假按周期语义停全通。
