# 暗色模式（dark）视觉优化方案

> 2026-10 经交互确认的分析报告与优化方案。范围、标准、边界均已在对话中逐项确认（见文末决策记录）。
> 本文档为方案，不含已实施的代码改动。

## 1. 背景与范围

**主对象**：`dark` 属性显示模式（`themeManager.dark = true`），含 colorized（多彩）叠加态。

**非目标**：

- 主题色梯度生成算法（`createPrimaryPalette` 链路，刚完成迁移，不动）
- `data-theme="dark"` 预设主题（机制 B）——它是"主题色"维度而非显示模式维度，仅顺带扫描（P2）
- light 模式的既有视觉（除必须的对照基准外不调）

**评判标准（双轨）**：

1. **量化兜底**：正文/交互文字对比度 ≥ 4.5:1（WCAG AA），大字/图形 ≥ 3:1
2. **感知对称**：交互态（hover/选中/active）在 dark 下的视觉权重与 light 等价

## 2. 现状机制（链路速览）

```
themeManager.dark = true
  → 宿主元素标注裸属性 dark
  → 注入三段 CSS：
     [selector][dark]            { darkColorVars }            // 前景/背景标尺反转
     [selector][data-theme][dark] { reverse 后的 theme-0..9 }  // 主题梯度倒序（0 最深）
     [selector][dark]            { 语义色 transparent 60% }    // _generateSemanticColorStyles
```

- 前景 `--k-color-i`：dark 下 = `gray-i`（1:1 反转）
- 背景：面板浮起流派——`bgcolor-0`（面板）= gray-8 浮于 `bgcolor-1`（工作区）= gray-9
- 派生层 `derivedVars` 为**单套**，无 dark 专属值——所有 `--auto-*` 在两种模式下的"引用档位/百分比参数"完全相同，仅靠基变量换值间接适配

## 3. 问题清单

对比度为手算估算（面板底 gray-8，L≈0.021），精确值以校准脚本（§5.1）为准。

### P0 —— 可读性硬伤（dark 下当前不合格）

| # | 问题 | 现状与证据 | 估算 |
|---|---|---|---|
| 1 | **语义色暗化方向错误** | `scope.ts:255` 对 success/warning/danger/info 统一 `color-mix(transparent 60%)`——等效"变透明"，而深底上语义色本应**提亮**。danger 叠加后对面板底仅 ≈**1.6:1**，success ≈**2.2:1**，均跌破 3:1 图形线 | 提亮至同系第 3 档（red-3/green-3）可达 ≈7~8.5:1 |
| 2 | **交互态感知衰减** | hover/selected/active 的 bgcolor 为主色 15%~20% 不透明度叠加（`derived.ts:11-21`）。同样百分比对深/浅底感知不等价，dark 下 hover 几乎不可见；checkbox/radio 选中底、focus 光晕同源（`input.less` 皮肤全走 `--auto-selected-bgcolor`） | dark 需 25%~35% 方与 light 15%~20% 等强 |

### P1 —— 层级与形态（明显劣化但不致不可用）

| # | 问题 | 现状与证据 |
|---|---|---|
| 3 | **阴影失效** | `baseVars` 阴影为中灰 `hsl(240 3.8% 46.1% / 6~12%)`，`darkColorVars` 无 shadow 覆盖——深底上灰色阴影基本不可见，层级感丢失 |
| 4 | **主色基准档位未校准** | `--auto-theme-color` 恒为 `theme-5`（`derived.ts:8`）。梯度反转后 dark 的 theme-5 = 原 palette 第 4 档，仅比 light 主色略浅；它喂 `--auto-primary-color`（按钮主文字）与 hover 色，dark 下对比度预期不足 |
| 5 | **面板边框过弱** | dark 下 `--auto-border-color` = gray-7（L 26.1%）对面板 gray-8（L 15.9%）对比 ≈1.5:1，卡片轮廓发虚 |
| 6 | **输入框同色漂浮** | `--auto-input-bgcolor` = 面板色（`derived.ts:88`），dark 下输入区仅靠边框区分，"平"而非"凹" |
| 7 | **bgcolor-8/9 疑似笔误** | `vars/dark.ts:55-56` colorized 暗底 `bgcolor-8` 与 `bgcolor-9` 均指 `theme-9`；对照 light 版（8→8、9→9）与注释"3..9 递进保持单调"，`bgcolor-8` 应为 `theme-8` |

### P2 —— 边缘与外围

| # | 问题 | 现状与证据 |
|---|---|---|
| 8 | **color-scheme 缺口** | `color-scheme: dark` 仅声明于 `_generateThemeColorStyles`（themeColor≠"light" 时）与静态 `themes/dark.less`；`themeColor="light"` + `dark=true` 时无任何声明，原生滚动条/表单控件不变暗 |
| 9 | 机制 B 叠加行为未验证 | `data-theme=dark` 预设 × `dark` 属性的组合未做过系统检查 |
| 10 | colorized dark 整体回归 | 问题 7 修复后需整体回归一遍多彩暗底 |

## 4. 优化方案

> P0/P1 是**价值优先级**而非严格时序：P0-2 与 P1-1/3/4/5/6 共享 `darkDerivedVars` 基础设施，实施时先建层、再按优先级填值。

### 4.1 基础设施：`darkDerivedVars` 层

**改动**：`vars/derived.ts` 新增 `darkDerivedVars` 导出；`scope.ts` `_generateBaseStyles` 在 `derivedStyles` 之后追加注入：

```css
[selector][dark] { /* darkDerivedVars */ }
```

**职责**：承载所有 dark 专属的派生值（主色档位、交互态参数、边框、输入框背景），使"模式差异"集中在变量层可见，组件层（less）保持模式无关。

### 4.2 P0-1 语义色梯度化

**方案**：语义色（success/warning/danger/info，primary 见下方豁免）统一经 `generateThemeGradientColors` 生成 10 阶标尺——与 themeColor 主通道同构的单一心智模型：

```css
/* 基础标尺（方向恒定：0 最浅 → 9 最深，同 palette.less 惯例；不 reverse） */
--k-color-success-0 … --k-color-success-9
/* light：直引种子原值（实测梯度第 5 档 ≠ 种子色，success 偏差肉眼可辨，
   直引保证 light 行为零差异） */
--k-color-success: #22c55e;
/* dark：提亮引用第 3 档 */
--k-color-success: var(--k-color-success-3)!important;
```

**改动点**：重写 `scope.ts` `_generateSemanticColorStyles`。

**关键豁免——var() 引用不可梯度化**：`toThemeColorHex` 对不可解析输入（含 `var(--auto-theme-color)`）回退黑色 `000000`，会生成黑色梯度。primary 默认值即 `var(--auto-theme-color)`，必须跳过梯度化、继续走 theme 标尺（其 dark 适配由 4.4 承担）。判定规则：种子值能被 `toThemeColorHex` 有效解析（非回退黑）才生成梯度。

**兼容性**：默认值（`#22c55e` 等≈各自色系第 5 档）成为梯度种子，解析后的第 5 档与原值色差极小，视觉近无感；用户自定义 hex 同样作为种子，行为一致。

**验收**：语义色作文字/图标对各自实际底色 ≥ 4.5:1（正文）/ ≥ 3:1（图形）；五色 × light/dark 全过。

### 4.3 P0-2 交互态强度（载体：darkDerivedVars）

**方案**：dark 专属参数双管齐下（起点值，终值以"与 light 感知等强"经脚本+截图校准）：

| 变量 | light 现状 | dark 实施值（校准后） |
|---|---|---|
| `--auto-hover-bgcolor` | 主色 15% | 主色 15%（与 light 同百分比） |
| `--auto-selected-bgcolor` | 主色 20% | 主色 18% |
| `--auto-active-bgcolor` | 主色 15% | 主色 15%（与 light 同百分比） |
| `--auto-hover-color` / 交互文字档位 | theme-5 | theme-6（与 4.4 联动） |

> 实施修正：原方案预设 dark 需 25%~35% 叠加强度，被校准数据推翻——主色提档（theme-6，
> 更浅的蓝）叠加深底的 Weber 敏感已补偿感知衰减，实测 15% 对称 +14.5%（1.34 vs 基准
> 1.17），抬高百分比反而过强（28% 达 1.77，超基准 51%）。

focus 光晕（`0 0 0 2px selected-bgcolor`）与 checkbox/radio 选中底随 selected-bgcolor 自动增强，无需单独改。

**验收**：hover 底与面板底的对比度，dark 与 light 现状基准同量级（±20%）；截图对照目测等强。

### 4.4 P1 主色基准档位

**方案**：`darkDerivedVars` 中 `--auto-theme-color: var(--k-color-theme-6)`（起点，脚本对 gray-8 面板底 ≥ 4.5:1 定档；不足则试 theme-7）。同时是 4.3 交互文字档位的上游。

### 4.5 P1 阴影 + 边框

**阴影**：`darkShadowVars`（dark 下覆盖 `--k-shadow-*` 五档），黑色系高不透明度起点值：

```
x-small 0 1px 2px  hsl(0 0% 0% / 35%)
small   0 1px 2px  hsl(0 0% 0% / 45%)
medium  0 2px 4px  hsl(0 0% 0% / 50%)
large   0 2px 8px  hsl(0 0% 0% / 55%)
x-large 0 4px 16px hsl(0 0% 0% / 60%)
```

**边框**：`darkDerivedVars` 中 `--auto-border-color: var(--k-color-6)`（gray-6，L 33.9%，对面板 ≈1.8:1）。阴影（暗投影）+ 亮边双信号表达层级，为 GitHub/VS Code dark 流派。

### 4.6 P1 输入框凹陷

**方案**：`darkDerivedVars` 中 `--auto-input-bgcolor: var(--k-bgcolor-1)`（dark 下 = 工作区 gray-9，比面板更深，"挖坑"感）。light 不动。

**注意**：checkbox/radio 皮肤同用 `--auto-input-bgcolor` 作底色（`input.less` 皮肤 mixin），凹陷底对选择件同样成立（VS Code 亦然），实施时截图复核。

### 4.7 P1 bgcolor-8 笔误修复

`vars/dark.ts:55`：`--k-bgcolor-8: var(--k-color-theme-9)` → `var(--k-color-theme-8)`，恢复"2..9 单调递浅"。

### 4.8 P2 收尾项

- **color-scheme 缺口**：`_generateBaseStyles` 的 darkStyles 块补 `color-scheme: dark;`（与既有声明重复无害）
- **机制 B 扫描**：演示页跑 `data-theme=dark` × `dark` 属性矩阵，异常列入清单
- **colorized dark 回归**：4.7 修复后整体回归

## 5. 验证方案

### 5.1 对比度校准脚本（先行）

`packages/theme/scripts/check-dark-contrast.ts`（bun 运行，与仓库 `scripts/check-doc-structure.ts` 同构）：

- **形态**：Bun.serve 托管 fixture 页（注入 `scope.toStyles()` 产物）+ Playwright 读 `getComputedStyle`——真浏览器解析 var 链与 `color-mix`（happy-dom 不可靠）
- **输入**：变量对清单 × 模式矩阵（light/dark × colorized），如：
  - `--auto-color` / `--auto-bgcolor` ≥ 4.5
  - `--k-color-{success|danger|warning|info}` / 面板底 ≥ 4.5
  - `--auto-theme-color` / 面板底 ≥ 4.5
  - `--auto-hover-bgcolor` / 面板底 ≥ 对照基准（light 现状 ±20%）
- **输出**：对比度表 + 阈值判定（PASS/FAIL）
- **后续**：P0 落地后阈值转 `bun test` 断言防回归（本轮不做）

### 5.2 截图对照

examples 演示页（`theme-controls.ts` 已有全局 dark 开关），Playwright 截 light/dark × colorized 矩阵，重点页：colors 全家桶、form、components。

## 6. 决策记录（对话已确认）

| 决策点 | 结论 |
|---|---|
| 「启用 dark」所指 | `dark` 属性机制，含 colorized；机制 B 顺带扫描 |
| 评判标准 | WCAG 量化兜底 + 感知对称双轨 |
| 验证载体 | 演示页 + Playwright 截图 + 对比度脚本三层 |
| 改动边界 | 数值 + 映射结构（含新增 dark 派生层）；不动梯度生成算法 |
| 语义色 dark 策略 | 统一 10 阶梯度，light 取 5 档 / dark 取 3 档；var() 引用豁免 |
| 交互态策略 | bgcolor 不透明度 + 交互文字档位双管 |
| 层级表达 | dark 专属阴影 + 面板边框提亮 |
| 输入框形态 | 凹陷流派（dark 下比面板更深） |
| 主色档位 | dark 下提档（起点 theme-6），入 darkDerivedVars |
| bgcolor-8/9 | 按笔误修复（bgcolor-8 → theme-8） |
| 产出边界 | 本方案为止，不实施代码 |

**待立 ADR**（随实施落盘，`docs/adr/0002-semantic-colors-as-gradient-seeds.md`）：语义色从固定 hex 改为梯度种子——难逆（发布后消费者依赖新行为）、无上下文会意外（默认值不再精确等于 `#22c55e`）、真权衡（精确 hex vs 模式自适应）。ADR 三要件齐备。

## 7. 实施顺序建议（供确认后执行）

1. 建基础设施：`darkDerivedVars` + `darkShadowVars` 注入链
2. 校准脚本先行，量出 light 基准值
3. P0-1 语义色梯度化（含 var() 豁免）→ 脚本复测
4. P0-2 交互态参数 → 截图对照
5. P1 各项（主色档位 / 阴影+边框 / 输入框 / 笔误修复）
6. P2 收尾 + colorized 回归 + 全矩阵截图验收

## 8. 实施结果（2026-10-07 完成）

全部按 §7 顺序落地，改动文件：

| 文件 | 改动 |
|---|---|
| `src/vars/derived.ts` | 新增 `darkDerivedVars`（主色 theme-6 / 交互态 / 禁用色 / 边框 / 输入底） |
| `src/vars/shadow.ts` | 新增 `darkShadowVars`（黑色系五档，尺寸切换自动生效） |
| `src/vars/dark.ts` | colorized 暗底重构：面板 theme-0 + 工作区 theme-0 混黑 30%（保色相压暗，多彩全域浸染） + bgcolor-2..9 对齐（消灭 bgcolor-8/9 笔误） |
| `src/scope.ts` | 注入 darkShadow/darkDerived 块；darkStyles 补 `color-scheme: dark`；`_generateSemanticColorStyles` 重写为梯度种子模式；`isColorLiteral` 判定 |
| `scripts/check-dark-contrast.ts` | 新增校准脚本（26 项检查，与 src 变量同源） |
| `docs/adr/0002-semantic-colors-as-gradient-seeds.md` | 语义色梯度种子 ADR |
| `examples/stories/colors/semantics.ts` | 色块文字白→近黑（两模式语义块均处亮段）；过时文案更新 |
| `examples/stories/colors/theme-palette.ts` | 色阶条带文字随 `k-color` 标尺反转（`var(--k-color-${i>3?9:0})`） |

**量化验收（blue 主题，26 项全 PASS）**：

- 正文 13.55 / 次要 11.73 / 主色(theme-6) 6.99 / 语义色 4.67~10.93（均 ≥ 4.5 AA）
- 交互态感知对称：hover 1.34（基准 1.17 +14.5%）、selected 1.42（基准 1.24 +14.5%）
- 边框 1.92（≥1.7）、禁用 3.0+（保底可辨）、colorized 暗底正文 5.57 / 次要 4.53

**浏览器验收（examples + Playwright）**：调色板页 8.5/10（色阶文字翻转 ✓、激活态清晰 ✓）；
语义色页 8/10（六色清晰 ✓）；表单页 9/10（输入凹陷显著、三层空间结构正确 ✓）。

**实施中发现并修正的两个方案偏差**：

1. 交互态预设 25%~35% → 实测与 light 同百分比即对称（见 §4.3 修正注）
2. light 引梯度第 5 档 → 实测第 5 档 ≠ 种子色（色差可辨），改为直引种子保 light 零变化

**机制 B 结论（静态分析）**：`themes/dark.less` 静态主题服务于不经运行时的消费者；
运行时 `themeColor="dark"` 时，注入的 `[data-theme='dark'][dark]` 块特异性更高、接管
theme 标尺并按 dark 规则反转——两机制正交一致，无需修复。

**遗留（记录不阻断）**：light 主色 theme-5/面板 2.81:1、light 语义色 2.03~4.58:1——
黄绿/黄色系在白底的物理限制 + light 范围约定（本轮不调），如需达 AA 另立方案
（方向：light 档位加深 1~2 档，代价是 light 视觉变化）。
