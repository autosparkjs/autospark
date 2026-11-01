# ADR-0130：新增图标归一化——外来 SVG 风格自动对齐内置规约

- **状态**：Accepted（grill-with-docs，三轮）
- **日期**：2026-10-31
- **关联**：**修订** [ADR-0058](0058-icon-symbol-and-icon-domain.md) 决策 6（「缺 stroke 补 currentColor」条件收紧）与决策 10（fill 体系豁免改由**类型判定**承载，不再是路径豁免）；[ADR-0093](0093-src-four-layer-restructure.md) 决策 6（icons.ts 纯数据面——内置条目经同管道幂等无害）；[CONTEXT.md](../../CONTEXT.md)（「图标层」词条）

## 背景

内置图标统一规约（`icons.ts` 的 `SVG_BEGIN`）：`viewBox="0 0 24 24"` + `fill="none"` + `stroke="currentColor"` + `stroke-linecap="round"` + `stroke-linejoin="round"`（描边宽度不写死，经 CSS 变量下发）。外来图标（`icons.add` / `x-icons` 内联 / 远程 IconifyJSON）来源多样——Lucide / Feather / Heroicons 恰好同规约，Figma 导出、Bootstrap、Phosphor、图标站拷贝则不然。盘问收束的四大缺口：

1. **线帽/拐角缺失**：外来 stroke 图标无 `stroke-linecap` / `stroke-linejoin` → 渲染为方头平接，内置是圆头圆接——最刺眼的风格差异；
2. **补齐条件过窄**：stroke 图标缺 `fill="none"` → 路径被默认黑填充；stroke 属性挂在内容 path 而非根上（Figma 导出常见形态）→ 现规则 miss；
3. **硬编码颜色**：`stroke="#333"` / `fill="#555"` 不跟随文字色与暗色主题；
4. **描边粗细比例**：CSS `stroke-width` 按 symbol 用户单位解释，viewBox 越小视觉越粗——16 网格粗 1.5 倍、256 网格（Phosphor）细到近不可见。

架构约束：**symbol 层无法烘焙宽度补偿**——元素自带的 presentation attribute 优先级高于宿主继承值（ADR-0058 决策 6「剥离全部 stroke-width」哲学的根基），烘焙即破坏「覆盖永远可靠」不变量；`add` 会被模板克隆幂等重收集 → 归一化必须**幂等**；内置数据存在内容级反例（`more` 的 `fill="currentColor"` 圆点、`semi-checked` 的实心内矩形、`loading2` 的双色底圈）→ 内容级显式覆盖不可破坏。

## 决策

### 1. 单一归一化核心，三管道汇入；双层形态

机制本体是 `features/icons/` 新模块的**纯函数核心**（`SymbolSpec` 进、`SymbolSpec` 出，可单测）。三条管道汇入同一核心：本地串（`normalizeSvgSpec`——覆盖 `icons.add` / `x-icons` 内联 / `x-icons.global` 内联 / 内置数据；全局远程经 `svgFromResolved` → `add` 亦事实性流经）、远程（`specFromResolved`）、公开工具（`AutoSpark.normalizeIconSvg` 静态 + 包入口 named export，签名 `(svg: string) => string | null`——无效输入 null 与 `normalizeSvgSpec` 对齐，无 opts）。公开导出供构建期 / 脚本预处理图标库复用，与运行时同一语义。管线内自动接入保证「不写任何代码就一致」，这是目标本体。

### 2. 类型判定承载豁免（修订 ADR-0058 决策 10）

**stroke 型**判定：根 `stroke≠none` ∨ 内容任一元素含 `stroke≠none` ∨（根 `fill="none"` 且内容无任何显式 `fill`）；其余为 **fill 型**，stroke 系属性零接触。fill 体系的「零干扰」不再由远程路径豁免承载，而由**类型判定**承载——Iconify material 等 bare path fill 集天然不触发；lucide via Iconify（body 逐元素携带 stroke 系属性）可被内容级判定接住。无任何 stroke/fill 声明的纯 path 归 fill 型（SVG 默认黑填充是明确语义，不做灰区兜底）。

### 3. 四件套补齐，只补缺失不覆盖显式

判定 stroke 型且根缺某项才补：`fill="none"` / `stroke="currentColor"` / `stroke-linecap="round"` / `stroke-linejoin="round"`。显式声明不覆盖（作者意图优先；主流来源缺的恰好都是没写的）。**行为变更**：现行「根 `fill="none"` 且无 stroke → 补 currentColor」收紧为仅 stroke 型——修复「根 fill=none + 内容各自显式 fill」的 fill 型图标被强加描边轮廓的既有误伤（该形态下每个实心形状会叠一圈 currentColor 描边）。

### 4. 颜色规约：唯一色值才换

全图（根 + 内容）`fill` / `stroke` 的显式色值去重后**唯一** → 替换为 `currentColor`（黑白也换——硬编码黑白同样不跟随暗色主题）；出现 ≥2 种颜色、或含 `url()` / `var()` 引用 → 一律保留（多色是作者意图）。只碰 presentation attributes，不解析内容级 `style`。

### 5. 网格补偿：渲染期换算，symbol 层不承载

`SymbolSpec` 增 `grid` 字段 = **max(viewBox 宽, 高)**（`preserveAspectRatio=meet` 下等比缩放由较大边决定，视觉描边粗细比例 = sw/max(宽,高)；viewBox 缺失 / 畸形 = null 不补偿）。x-icon 渲染期按 `生效 sw × grid/24` 换算，非默认值才内联 `--as-icon-sw` 变量（零内联纪律照旧）。16 网格 × 2/3、256 网格 × 1/10.67。**存储与查询面**：注册表存 per-icon grid（全局）；局部 `td.names` 已存 `SymbolSpec` 顺带可达；x-icon 名字解析结果携带 grid 供渲染期换算。

### 6. `data-raw` 逃逸阀

根 `<svg data-raw>`（布尔存在性标志、无值）跳过本机制**全部**（四件套 / 颜色 / 网格——grid 记 null 自然不补偿）；**不豁免** ADR-0058 决策 6 的 stroke-width 剥离（那是渲染参数化的地基而非「优化」——不剥离则宽度失控）；标志本身进 `ROOT_STRIP` 不落 symbol；`normalizeIconSvg` 同尊重。无「全局关 + 单图标开」的反向开窗。

### 7. 默认开启 + 全局单开关；声明与产物分离

默认开启（目标即零成本一致，默认关形同虚设）；`AutoSpark.icons.options.normalize = false` 为唯一关闭位（无细粒度）。`getSvg` 恒返**原始声明串**——归一化只作用于派生 spec（symbol 是渲染产物、声明是声明），便于排查「我给了什么 vs 引擎做了什么」。静默执行，`engine.logger.debug` 级输出变换摘要且按「名 + 变换集」去重一次（add 幂等重收集不刷屏；归一化是预期行为不是异常，不 warn）。

## 被否决的方案

- **纯工具函数（用户手动调用后再 add）**：不调不生效，防御性弱。→ 双层：管线自动 + 同函数公开导出（决策 1）。
- **覆盖显式声明的强统一**：「我写的属性被引擎改了」的惊异。→ 只补缺失（决策 3）。
- **symbol 层烘焙 stroke-width 补偿**：presentation attribute 会被宿主继承的 CSS 变量值压过，破坏「覆盖永远可靠」不变量（ADR-0058 决策 6）。→ 渲染期变量换算（决策 5）。
- **viewBox 重写为 24 + `<g transform>` 包裹**：scale 不改 stroke-width 的局部单位解释，无视觉收益徒增一层 g。→ 不做（决策 5）。
- **`vector-effect="non-scaling-stroke"`**：把宽度钉在屏幕像素，破坏 1em 缩放体系。→ 否决。
- **全部颜色 → currentColor**：毁 duotone / 多色品牌图标。→ 唯一色值才换（决策 4）。
- **默认关 / 细粒度开关 / 反向开窗**：默认关使机制形同虚设；细粒度无真实场景（YAGNI）。→ 默认开 + 全局单开关（决策 7）。
- **内容级灰区兜底（无任何 stroke/fill 声明的纯 path 当 stroke 型）**：SVG 默认黑填充是明确语义，臆测作者意图。→ 归 fill 型不动（决策 2）。

## 后果

- ✅ 外来图标零代码对齐内置风格（线帽 / 拐角 / 颜色 / 粗细四维）；`data-raw` 提供逐图标逃逸。
- ✅ 修复既有误伤：根 `fill="none"` + 内容显式 fill 的 fill 型图标不再被强加描边——**唯一行为变更点**，既有测试断言同步更新。
- ⚠️ 内置反例回归义务：`more` / `semi-checked` / `loading2` 的内容级覆盖不得被颜色规约破坏（唯一色值规则天然豁免，需测试钉死）。
- ⚠️ 跨文件协同是实现重点：`SymbolSpec` 增字段 + 注册表 / 令牌表查询面 + x-icon 渲染换算三处；归一化幂等性须有测试钉死（模板克隆重收集安全）。
- 🔴 归一化改写外来图标的呈现（线帽变圆、粗细对齐 24 网格、单色跟主题）是**有意的目标行为变更**；远程 Iconify 路径纳入承诺（决策 2），lucide 等 stroke 集经内容级判定生效。
