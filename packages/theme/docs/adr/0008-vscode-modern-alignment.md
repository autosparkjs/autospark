# ADR-0008: 配色对齐 VSCode Modern——双轨灰阶、种子换血与派生态重校

- 状态：已接受（Accepted）
- 日期：2026-11-19
- 关联：包内 ADR-0002（语义色梯度种子）；dark-optimization.md §4.5/§9（边框派生）；border-contrast.test.ts

## 背景

对齐前 dark 面板 = gray-8 = **#606060（中灰）**——单条亮灰阶（`#FFFFFF→#3C3C3C`）供 light/dark 共用、dark 仅反转映射的直接后果。这与 VSCode Dark Modern 的深底世界（#1F1F1F/#181818）量级差距巨大，也是校准脚本 8 项既存 FAIL 的根源（dark 正文 6.02:1，文档历史记录 13.55:1 对应的深面板世界已不存在）。light 侧同期漂移出次要文字 3.56:1（< AA）等回归。

用户决策（四轮 grilling 共识）：dark 与 light **全套对齐 VSCode Dark/Light Modern**，且立下实现原则——**所有颜色必须在梯度标尺基础上经 color-mix 等派生到最接近，变量层不散落固定 hex**（该原则直接否决了「dark 映射层内联字面量」方案）。

## 决策

### 决策 1：双轨灰阶——dark 专属 dgray 标尺，锚点入档

共享单轨在精确锚定下数学不可行：gray-9 需同时等于 dark 工作区（#181818）与 light 最深文字（#1F1F1F）。故：

- `styles/colors.less` 新增 `--x-color-dgray-0..9`（0 最亮），暗端档位 = Dark Modern 面板族锚点：dgray-5 #3C3C3C（input.border）/ dgray-6 #313131（input.background）/ dgray-7 #222222（widget #202020 与 quickInput #222222 合并档，差 2/255）/ dgray-8 #1F1F1F（editor）/ dgray-9 #181818（sideBar）；亮端 dgray-1 #CCCCCC（editor.foreground）/ dgray-2 #9D9D9D（descriptionForeground）+ 插值延拓
- light gray-0..9 重锚 Light Modern：gray-1 #F8F8F8（sideBar）/ gray-3 #E5E5E5（panel.border，即 light 边框档）/ gray-8 #3B3B3B（正文）/ gray-9 #1F1F1F
- `vars/dark.ts` 的 `--x-plain-*` 仅把 `gray-*` 引用换为 `dgray-*`——dark 反转映射结构与 VSCode 浮起梯度天然同构，映射层一行逻辑未改，锚点全部精确落位（零 mix 逼近、零偏差）

hex 只允许出现在标尺层（与 light gray 既有惯例一致）；标尺是「梯度调色板」本身，满足「颜色源于梯度」原则的最严格解读。

### 决策 2：种子换血——主题色 #0078D4 + 语义色 GitHub Primer 系

- blue 预设种子 `#1677ff → #0078d4`（VSCode focusBorder/button 官方蓝；同步 `presets.ts` 与 `themes.json` 两份真值源）
- 语义色种子换 GitHub Primer light 系：danger `#CF222E` / success `#1A7F37` / warning `#9A6700` / info `#0969DA`。VSCode Modern 仅定义 errorForeground #F85149（dark/light 同值），warning/success/info 无权威 token——GitHub 系与 VSCode 同源观感且五色齐全；dark 经既有「提亮第 3 档」机制（ADR-0002）自然趋近 GitHub dark 观感（#F85149/#3FB950/#D29922/#58A6FF），实测 5.70~11.89:1 全过 AA
- 主色档位（档位机制不动，档随新标尺重定）：light `--auto-theme-color` theme-5→**theme-8**（#0067C2，5.13:1，观感对齐 Light Modern 链接蓝 #005FB8；theme-5 仅 2.97:1 天蓝差距过大）；dark theme-6→**theme-5**（#3CA7F6，6.48:1，对齐 Dark Modern 链接蓝 #4daafc 的 6.65:1，Δrgb≈17）；light active-color 随动 theme-8→theme-9 保持「active 深于主色」梯度关系

### 决策 3：dark 输入底——凹陷流派改浮起（VSCode 流派）

`--auto-input-bgcolor` 由工作区色（`--x-bgcolor-1`，凹陷）改 `--x-bgcolor-3`（#313131，浮起亮于面板）。凹陷是为旧 #606060 中灰面板校的；VSCode 输入底比面板亮，深底上浮起才与其观感一致。light 输入底=面板白的现状与 VSCode 恰好一致，无需动。

### 决策 4：边框混白比例 25%→12%——派生机制不动，比例受输入底约束

面板底 #1F1F1F 后，混白 25% 产物 ≈#4E4E4F 远亮于 VSCode 边框；但对齐观感的直觉值 8% 产物**恰为 #313131，与输入底 1:1 同色**（输入框轮廓消失）。定 **12%**：产物 ≈#3A3A3A，对齐 VSCode input.border #3C3C3C（单一 --auto-border-color 须同时服务面板与输入，取较强一族），对面板 1.45:1（VSCode panel.border 为 1.19:1，同为弱边框流派）。断言阈值 dark 灰/彩 1.7→**1.2**（防融合底线 1.05 与结构格不变）。light 边框仍固定档（机制不对称为既定接受），重锚后自然为 #E5E5E5。

### 决策 5：dark 次要文字透明度 25%→12%（dark 专属覆盖）

彩色暗底（theme-0 面板）比灰面板亮，次要文字混底衰减更深——25% 时 colorized 仅 3.83:1 < AA。darkDerivedVars 增 `--auto-secondary-color` 覆盖（transparent 12%），两域通吃（灰 ≈8.1 / 彩 ≈4.7）。

## 后果

- **量化验收**：校准脚本 32 项全绿（dark 正文 10.26 / 次要 7.78 / 主色 6.48 / hover 底感知对称 1.27 vs 基准 1.23 / colorized 正文 5.57 次要 4.7 边框 1.31 / light 正文 11.20 次要 5.25）；**8 项既存基线漂移 FAIL 全部消解**
- light 观感变化（已确认接受）：正文 #606060→#3B3B3B、边框 #F0F0F0→#E5E5E5、主色天蓝→深蓝；light 主色 2.97→5.13 与语义色 4.87~5.36（旧 2.03~4.58）两条旧账顺带清偿
- golden 快照 `static-theme-blue.css` 重生成（指纹种子字段自动变 #0078d4，schema 不需 bump——指纹字段值变但结构未动，同源断言保产物一致）
- 静态主题包指纹含种子与语义种子，已水合的持久化快照将指纹失配→自动回退动态注入（ADR-0004 设计内行为，无迁移成本）
- colorized dark 映射结构（面板 theme-0 / 工作区混黑 30%）原样保留，仅随新种子重校断言
