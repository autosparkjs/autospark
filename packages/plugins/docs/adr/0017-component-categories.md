# ADR-0017: 组件分类目录——components/ 二级归置 + 文档侧边栏分组

- 状态：已接受（Accepted，2026-11-11；实施待在途改动收口提交后启动——见决策 7）
- 日期：2026-11-11
- 关联：ADR-0009（插件四形态分区——分类与之正交，见背景）、ADR-0003（插件开发方式：一插件一文件夹自包含）、ADR-0012/0014/0016（三个现有组件）、engine ADR-0134（autospark.base——撞名消解的对象）

## 背景

`src/components/` 已有三个组件（button / button-group / state-button），扁平无分类；组件数量必然增长，需要可扩展的归类维度。与 ADR-0009 插件四形态（directives / components / features / modules，按**插件形态**分 src 顶层四区）正交：本分类按**组件功能域**分 components/ 区**内部**目录，是二级归置维度——不拆插件盒（一插件一文件夹自包含不变）。

现状三事实：① 组件间零代码级依赖（继承走 html `x-define:inherit` **按注册名**，目录移动不影响继承链；button-group 对 button 是脚本加载顺序契约，与目录无关）；② 代码耦合点仅两处——`src/index.ts` 副作用 import 与 `vite.config.ts` 的 `CLOSURE_ARTIFACTS` 手工枚举 entry（硬编码字符串，须同步改）；③ `docs/zh/components/` 与 `docs/demos/components/` 均扁平，侧边栏无分组，且 `stateButton/` 目录为 camelCase（与 kebab 产物名/注册名不一致）。

## 决策

### 决策 1：八分类目录全建（含 .gitkeep 骨架）+ 目录名统一 kebab-case

| 目录 | 语义 | 归属（权威初值） |
| --- | --- | --- |
| `base/` | 可继承的组件基类（预留，暂空） | — |
| `general/` | 常规组件 | button、button-group、state-button |
| `layout/` | 布局 | grid、space、layout（未来） |
| `feedback/` | 反馈 | modal、message、alert（未来） |
| `navigation/` | 导航 | menu、tabs、pagination（未来） |
| `display/` | 展示 | table、card、tag（未来） |
| `form/` | 表单 | input、select、form（未来） |
| `other/` | 其他 | affix、watermark（未来） |

- 八目录**现在全建**，空目录以 `.gitkeep` 入库——分类骨架在文件树上直接可见（本地已预建 7 个，实施时补缺的 `other/`）。
- 目录名统一 **kebab-case**：`stateButton/` → `state-button/`（src 与 docs/demos 连带），达成**目录名 / 产物名 / 注册名三对齐**（DOM 属性小写化家族教训，ADR-0016 决策 11）。
- 本表即权威归类映射：未来组件的归类以落地的组件 ADR 声明为准。

### 决策 2：纯结构重组边界（零行为变更）

只移目录、改 import、改 vite entry、改侧边栏、改文档路径——组件行为 / API / 样式 / 主题零变更；IIFE 产物文件名（`autospark.button.js` 等）与全局注册名全部不变。同步面全部可机械枚举：

- `src/index.ts`：副作用 import 路径（顺序契约不变——button-group 仍先于 button）；
- `vite.config.ts`：`CLOSURE_ARTIFACTS` 的 entry 字符串（outFile 不动）；
- `src/components/<组件>/index.ts` 内部相对导入（`../../utils/` → `../../../utils/`）。

### 决策 3：归类扩展规则

**新组件必须归入既有八分类；新增分类需新 ADR**——防分类法碎片化（九类、十类随手加即失控）。归属存疑时在组件自身的 ADR 中声明分类并说明理由。

### 决策 4：文档侧边栏七分组——base 不进 docs

- 侧边栏登记 **7 个分组**（中文标题）：常规 / 布局 / 反馈 / 导航 / 展示 / 表单 / 其他——**无 Base 组**；**空分组现在就登记**（分组标题可见、暂无条目，与源码骨架呼应）。
- **base 不进 docs**：`base/` 是代码组织概念（基类不产出面向用户的组件文档），不应在文档侧边栏有投影。
- **撞名消解（engine 的 autospark.base）**：侧边栏现有「Base 基类组件」条目**删除**；`docs/zh/components/base.md` **删除独立页**，档位继承/主题合规的核心内容并入 `components/index.md` 已有的约定说明段（该段本就引用 engine ADR-0134）。`base/` 源码目录**不改名**——撞名只在文档侧消解。
- `components/index.md` 组件列表表格按分类重组（加分类维度），Base 行随之移除。

### 决策 5：文档与 demos 物理分目录 + 测试镜像

- `docs/zh/components/<分类>/<组件>.md`（URL 随之变为 `/zh/components/<分类>/<组件>`，内链同步改，站点未发布可接受）；`index.md` 留顶层作分区 landing。
- `docs/demos/components/<分类>/<组件>/`（同步分类；md 内 `<demo html="components/<分类>/<组件>/...">` 路径同步）。
- 测试镜像：`src/__tests__/components/<分类>/<组件>-plugin.test.ts`。
- **plugins 包内 `demo/` 保持平铺**（开发便签，分目录收益低）。

### 决策 6：分类边界（不参与者）

- **modules/ 不参与**（notifications / resource）：四形态是插件形态维度，本分类是组件功能域维度，modules 有自己的形态约定——两套正交维度互不混入。notifications 将来若出文档归反馈组，届时再议。
- **指令不参与**（x-badge / x-ripple / x-spin / x-scrollbar 等）：维持 demos「指令顶级、组件入 components/」二分与指令文档域（`guide/directives/`）不变。
- engine 机制教学 demo `docs/demos/component/`（单数）不受影响。

### 决策 7：实施时机

**等在途改动（button-group / state-button / x-badge 等）收口提交后再实施**——文件移动叠加未提交修改，diff 无法审读、回滚切不干净。重组须一次性完成（中途态侧边栏/链接断链）。

## 备选方案

- **文档平铺 + 仅侧边栏逻辑分组**：否决——源码树与文档树两棵树渐行渐远，长期可维护性差；URL 变化在站点未发布期可接受。
- **只建有内容的目录、空分组不登记（YAGNI 路线）**：否决——用户选择骨架全可见：分类法对贡献者/读者预先显形（.gitkeep 空目录 + 侧边栏空分组），后续组件归类零犹豫。
- **侧边栏保留「Base 基类组件」顶级条目（容纳 engine 的 autospark.base 文档）**：否决——它是 engine 机制文档而非 plugins 组件，且与 `base/` 分类撞名干扰；硬塞进任何分组都语义错位。
- **`base/` 分类改名（foundation/ 等）避撞**：否决——撞名经文档侧消解（base 不进 docs）后源码目录无需让步。
- **`stateButton/` 目录保持 camelCase**：否决——目录/产物/注册名三对齐；camelCase 在 `x-component:` 属性名位置被 DOM 全量小写化的家族教训（ADR-0014/0016）。
- **modules/ 纳入分类（如 notifications → feedback/）**：否决——形态维度与功能域维度混叠，ADR-0009 四区语义被侵蚀。
- **vite 入口改目录自动发现**：不在本 ADR 范围——`CLOSURE_ARTIFACTS` 手工枚举是「一产物一自包含闭包」契约的组成部分，本次仅同步 entry 字符串。

## 后果

- 文档 URL 变更（`/zh/components/button` → `/zh/components/general/button` 等）；`base.md` 删除（约定内容并入 `index.md`），引用处同步。
- 侧边栏（仅 zh，无 en）出现 6 个暂无条目的空分组——刻意为之（骨架可见），首个组件文档落地时填充。
- `vite.config.ts`、`src/index.ts`、组件内相对导入、md demo 路径四处为固定同步面；遗漏即构建失败或文档断链，机械可查。
- 仓库新增 7 个 `.gitkeep`（8 目录中 general 有内容不需要）。
