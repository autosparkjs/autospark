# ADR-0032: 多行文本框 Textarea 独立成件（修订 ADR-0020 决策 4）

- 状态：已接受（Accepted，2026-11-17）
- 日期：2026-11-17
- 关联：ADR-0020（**被本 ADR 修订**——决策 4「textarea 是 type 变体」与备选方案「textarea 独立组件：否决」同时废止；决策 5 值桥 / 决策 6 原生直提交 / 决策 7 样式基线由本组件原样继承）、ADR-0018（清单权威表 form 行口径同步）、ADR-0021（「复制而非嵌套」拼装方法论）、ADR-0027/0028（同族拼装与值桥对齐先例）、ADR-0081（继承覆盖）、ADR-0129（主题三级回退链）、ADR-0134（autospark.base 抽象基组件）

## 背景

ADR-0020 把多行输入做成 `autospark.input` 的 **type 变体**（`type: "textarea"`），并以「机制重复度高、注册面翻倍」为由明确否决独立 `autospark.textarea`（决策 4 与备选方案条目）。该判断在 P0 只求「先有输入框」的阶段成立；随着 form 族铺开，两类成本浮出水面：

1. **职责过载**：input 的 props 表同时承载文本族 `type` 透传、`showPassword`、前后置 `prefix`/`suffix`、多行 `rows` 与清除/计数。多行所需的能力（autosize / minRows / maxRows / resize）与单行 props 完全正交——继续并入会让一半 props 只对单一形态有意义，文档、测试与默认值越来越难讲清。
2. **形态切换的结构性缺陷**：ADR-0020 自己记录的已知边界①——运行时切换 `type` 进出 textarea 会重建控件、丢失焦点。这是「一组件多形态」的固有代价，不随实现优化消失。

同时，多行输入的真实需求已经超出旧形态：**自动增高（autosize）默认开启**、上下限行数与原生拖拽互斥、计数器不占文本行宽。这些都需要围绕 `<textarea>` 本身设计，而不是继续挂在 input 的形态分支上。

本次拆分的取舍不是「推翻旧决策的结论」，而是**重新称量同一组成本**：逻辑复制成本是确定的（约 110 行值桥/计数/清除/attrs 同步），而职责耦合成本随能力增长持续放大。ADR-0018 决策 7 已定下判据「第三个同类组件出现再抽」——本次是相反方向的判据应用：**当一个组件内部出现两个职责正交的形态时，优先按其消费面拆分，而不是等第三个形态出现**。

## 决策

### 1. 归类与命名

| 面 | 定名 |
|---|---|
| 目录 | `src/components/form/textarea/`（form 域，ADR-0017 八分类） |
| 注册名 | `autospark.textarea` |
| 产物 | `autospark.textarea.js`（IIFE 全局名 `AutoSparkTextarea`；内嵌 field 注册，自包含） |
| 元素名 | `<x-textarea>`（由本组件 precompile 独占，input 不再匹配） |
| 文档 | `docs/zh/components/form/textarea.md` + `docs/demos/components/form/textarea/*` |
| 根类 / 控件类 | `.asc-textarea` / `.asc-textarea-native` |
| 组件覆盖变量 | `--asc-textarea-*`（底层继续消费 `--auto-input-*` 主题令牌） |

`x-textarea` 的归属必须唯一：ADR-0020 时期 input 的 precompile 匹配 `x-input, x-textarea`，拆件后 input 只匹配 `x-input`，否则两个 precompile 回调会按注册顺序争抢同一标签。

### 2. 继承链与逻辑自持（修订 ADR-0020 的核心取舍）

```
autospark.textarea → autospark.field → autospark.base
```

- **只继承 field**，不继承 input。值桥 / 计数 / 清除 / attrs 同步 / watcher 按「复制而非嵌套」先例（ADR-0021）在组件内自持；
- 理由：`<script setup>` 无法 import 模块工具（ADR-0031 已记录该机制约束），跨组件复用只有「继承」一条通道；继承 input 会把单行专属逻辑（`type` 文本族、`showPassword`、`prefix`/`suffix`）一并带入，形成 `textarea → input → field` 的依赖链，input 的任何演进都会波及 textarea；
- 抽共享内部基座被否决（见备选方案）：当前只有 input / textarea 两件，抽取新基座属于架构级改动，第三件出现再按 ADR-0018 判据处理；
- ADR-0020 的「机制重复」批评因此**被显式接受**：用约 110 行确定性复制，换取两件职责单一、可独立演进。这是本 ADR 与 ADR-0020 决策 4 的正面冲突点，记录在此以免后人误读为遗漏。

### 3. API 面

| 属性 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `value` | `string` | `""` | 非受控初值 / 单向同步值（受控真相走宿主 `x-model`） |
| `placeholder` | `string` | `""` | 同步原生 placeholder |
| `maxlength` | `number` | `0` | >0 同步原生 maxlength + 自动显示计数 |
| `rows` | `number` | `2` | 初始行数；`minRows` 未声明时兼作最小行数（与旧 textarea 形态默认值一致） |
| `minRows` | `number` | `0` | autosize 最小行数（0 = 取 `rows`） |
| `maxRows` | `number` | `8` | autosize 最大行数（0 = 不限高） |
| `autosize` | `boolean` | `true` | 自动增高（默认开启） |
| `resize` | `"" \| none \| vertical \| horizontal \| both` | `""` | autosize 关闭时的原生拖拽（缺省 vertical） |
| `clearable` | `boolean` | `false` | 清除钮（右上角浮层） |
| `showCount` | `boolean` | `false` | 计数显式开关（`maxlength > 0` 时无须开启） |
| `status` / `disabled` / `readonly` | — | — | 由 field 骨架继承 |
| ~~`actions`~~ | — | — | **不支持（2026-11-17 修订取消）**：注入静默忽略 + warn，渲染段 CSS 整段屏蔽；曾实施的「上/下整行布局」方案废止 |

**不提供** `prefix` / `suffix`：单行 affix 的交互习惯，迁入多行盒会造成布局复杂度，且与「多行文本 + 浮层计数」的排版目标冲突。这是相对旧 textarea 形态的一处**有意收缩**（旧形态支持前后置）。

### 4. autosize 与 resize 契约

- **默认开启**：高度随内容增长，`minRows`（缺省取 `rows`）/ `maxRows`（默认 8）夹取，到顶后内部滚动；`maxRows: 0` 表示不限高；
- **重算时机**：用户输入、程序化 `value` 变化、初始挂载、控件宽度变化（`ResizeObserver`）——只监听 value 会在侧栏展开 / 窗口缩放改变折行数后失准。高度变化不加 transition，避免连续输入抖动；
- **与 resize 互斥**：autosize 开启时强制 `resize: none`；关闭后尊重 `resize` 属性（缺省 `vertical`）。自动高度与手动拖拽本质冲突，不做「拖拽后临时关闭 autosize」的混合态；
- 测量口径：`scrollHeight + borderY`，下限取行高 × `minRows`，上限取行高 × `maxRows`；超上限转 `overflow-y: auto`。

### 5. 计数与清除的视觉位置

- **计数器**：绝对定位于盒内右下角，不占文本行宽；`maxlength > 0` 自动显示 `当前 / 上限`（超限整组染 danger），`showCount` 允许无上限时只显示当前字数；
- **清除钮**：绝对定位于盒内右上角；
- 两个浮层在场时，控件经 `:has()` 预留对应侧的 `padding`，避免文字压在浮层下。`padding` 参与 autosize 的行高夹取计算（读取 computed style），不会破坏高度。
- ~~保留 field 的 `actions`，但**布局改为控件上 / 下**~~ **2026-11-17 修订：取消 actions 支持**——多行形态不再提供融合动作（曾以上/下整行布局承载，实施后取消；注入静默忽略 + mounted warn，渲染段经 `.asc-textarea .asc-field-actions { display: none }` 整段屏蔽）。多行动作需求走 field 直实例化或消费方自理。

### 6. 兼容策略（`<x-input type="textarea">` 下线）

- **硬移除，不警告**：input 删除 `type` 的 `"textarea"` 取值、`rows` props、`data-form` 形态标记与 textarea CSS/模板分支；
- 旧写法 `<x-input type="textarea">` 静默按普通单行 input 处理：`type` 在原生 `<input>` 上被浏览器归一为 `text`；`rows` 不再是 input 的 props，落不进原生控件（被忽略）；`value` / `x-model` / `name` / `disabled` / `readonly` / `placeholder` / `maxlength` / `clearable` / `showCount` 等通用能力照常；
- 文档**不保留迁移提示**：`input.md` 删除 textarea 章节与 `rows` 属性行，多行内容整体归 `textarea.md`；
- `x-textarea` 由新组件接管，行为与旧写法不等价（多了 autosize 默认开启），属于有意变更，在 `textarea.md` 顶部以「与 Input 的分工」说明。

### 7. 产物、文档与测试

- `vite.config.ts` 的 `CLOSURE_ARTIFACTS` 与 `build:demo` 入口各加一条；`src/index.ts` 聚合导入追加；`docs/public/autospark.textarea.js` 随构建产出；
- 侧边栏「表单」组 Input 之后新增「多行文本框 Textarea」；`docs/zh/components/index.md` Input 行去掉 textarea、新增 Textarea 行；
- 独立测试文件 `src/__tests__/components/form/textarea-plugin.test.ts`；input 测试删除 textarea 形态与 `x-textarea` precompile 用例，并断言 input 模板零 textarea 残留；
- `CONTEXT.md` 表单域层新增 Textarea 词条，组件计数 54 → 55（52 新增 + 3 现有）。

## 备选方案

- **维持 type 变体（ADR-0020 原判）**：否决——理由见背景。多行的 autosize / resize / 行数夹取与单行 props 正交，继续合并会让 input 的 API 面持续膨胀；形态切换重建控件的缺陷也无法消除。
- **textarea 继承 input（复用值桥）**：否决——会继承 `type` 文本族、`showPassword`、`prefix`/`suffix` 等单行专属逻辑，并形成 `textarea → input → field` 依赖链；复用省下的 110 行，换来的是长期耦合。
- **抽取共享内部基座（input 与 textarea 共同继承）**：否决——架构级改动，牵涉 input 的既有继承快照与全部 form 族回归；当前仅两件，收益不抵成本。第三件同类控件出现时再按 ADR-0018 判据评估。
- **保留 `type="textarea"` 作为跨组件别名（input 内部转投 textarea）**：否决——产生跨插件依赖与「组件内部实例化另一个组件」的时序复杂度，且与「硬移除」的决策冲突；静默降级为单行输入是更可预测的行为。
- **autosize 默认关闭（保持原生拖拽）**：否决——多行输入的最高频诉求就是「写完不被小盒子挡住」，默认关闭等于把这项能力藏起来；需要原生拖拽时显式 `autosize="false"`。
- **`autosize: { minRows, maxRows }` 对象形态**：否决——嵌套对象 props 在当前引擎有字面量死环缺陷（ADR-0021 规避 5），拆成 `minRows` / `maxRows` 原始值 props 更稳。
- **`showWordLimit` 新命名**：否决——与既有 `showCount` 分叉会造成同族 API 两套词；计数语义沿用 `showCount`。

## 后果

- `autospark.textarea` 交付：注册名 `autospark.textarea`，产物 `autospark.textarea.js`（内嵌 field 注册，自包含；actions 场景另需 `autospark.button.js`）；测试 `src/__tests__/components/form/textarea-plugin.test.ts`。
- **ADR-0020 修订**：决策 4 中「textarea 是 type 变体、不独立成件」一段与备选方案「textarea 独立组件：否决」条目由本 ADR 废止；决策 2 继承链图、决策 3 actions 备注（「textarea 形态照常可用」→ 由本组件继承并改上下布局）、后果节测试计数与已知边界①同步更新。
- **ADR-0018 修订**：form 行「input 含 textarea/password 形态」改为 input（password 等文本族）与 textarea 分列，并注明拆件依据（本 ADR）。
- **组件计数**：54 → 55（多行能力由 input 内部形态升为独立组件）。
- **回归面**：`<x-input type="textarea">` 的存量用法静默退化为单行输入（不警告）；`x-textarea` 用法行为变更（autosize 默认开启、无 prefix/suffix）。
- **已知边界**：①autosize 的高度依赖 `getComputedStyle` 行高——consumer 把 `line-height` 设为 `normal` 等不可解析值时放弃行数夹取（只随内容增高，不误裁内容）；表单场景通常显式给行高，theme 默认档不受影响；②`ResizeObserver` 仅在宽度变化超过 1px 时重算，亚像素抖动被忽略（避免高度抖动）；③浮层计数与清除的 `:has()` 预留内距需要 `:has` 支持（Chrome 105+ / Safari 15.4+ / Firefox 121+，与 button / field 的既有 `:has` 依赖一致）；④prefix / suffix 不提供，需要重装饰时用 field 的具名插槽。
- **后续**：若出现第三件同类控件（如自动增高代码输入），再按 ADR-0018 判据评估抽共享基座，而非继续复制值桥。
