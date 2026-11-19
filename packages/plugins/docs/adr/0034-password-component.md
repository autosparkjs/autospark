# ADR-0034: 密码框 Password（继承 input；承接 ADR-0020 修订三移除的明文可见能力）

- 状态：已接受（Accepted，2026-11-18）
- 日期：2026-11-18
- 关联：ADR-0020（**被本 ADR 补充**——修订三移除 `showPassword` / `showCount` 后，明文可见能力以独立组件回归；决策 3「功能动作件留 body」、决策 5 值桥、决策 6 原生直提交、决策 7 样式基线、决策 8 图标注册的处置均由本组件承接）、ADR-0032（textarea 拆件——「复制而非嵌套」先例的**反向判据对照**）、ADR-0021（拼装方法论）、ADR-0081 / ADR-0137（继承覆盖与出口注入）、ADR-0129（主题三级回退链）、ADR-0134（autospark.base 抽象基组件）、ADR-0058（图标注册表）

## 背景

ADR-0020 修订三（2026-11-18）把 `showPassword` / `showCount` 从 `autospark.input` 整体移除，理由是两个能力都让单行输入框的 props 表承载了与「输入」本体正交的职责；`input-eye` / `input-eye-off` 的组件自有图标注册与资产同时删除。

移除留下了两个空位：**密码场景仍然需要「看一眼我输对了没有」**，而它的自然形态不是通用输入框的一个开关，而是**一个专门组件**。本次新建 `autospark.password` 承接该能力，同时把密码场景真正需要的原生属性（`minlength` / `autocomplete`）补齐——这两项此前在 input 上完全没有通道（宿主属性不会流到内层原生控件）。

关键张力：ADR-0032 刚刚以「单行专属逻辑渗透 + 依赖链」为由否决了 `textarea` 继承 `input`。password 却要**继承 input**。这不是判据反复，而是同一判据在不同组件上的正确结论——必须在文档里写明分野，否则后来人会把两条判据读成矛盾。

## 决策

### 1. 归类与命名

| 面 | 定名 |
|---|---|
| 目录 | `src/components/form/password/`（form 域，ADR-0017 八分类） |
| 注册名 | `autospark.password` |
| 产物 | `autospark.password.js`（IIFE 全局名 `AutoSparkPassword`；内嵌 input / field 注册，自包含） |
| 元素名 | `<x-password>`（由本组件 precompile 独占） |
| 文档 | `docs/zh/components/form/password.md` + `docs/demos/components/form/password/*` |
| 根类 / 控件类 | `.asc-password`（并入继承来的 `.asc-field` / `.asc-input` / `.asc-field-box`）/ `.asc-input-native`（复用） |
| 组件覆盖变量 | `--asc-password-*`（底层继续消费 `--asc-input-*` / `--auto-input-*`） |

### 2. 继承形态：真继承 input（与 ADR-0032 的判据分野）

```
autospark.password → autospark.input → autospark.field → autospark.base
```

- **为什么继承**：password 的「多出来的东西」只有两件——前缀钥匙装饰与明文可见切换；而它的底座恰好需要 input 的**全部**机制：`el.value` 劫持值桥（含 `initDone` 重放门闩）、`placeholder` / `maxlength` / `name` 同步、清除钮、`prefix` / `suffix` props 装饰上提、styles 拼接、`type` 文本族通道。
- **与 ADR-0032 的分野**：textarea 否决继承的理由是「不愿让单行专属逻辑渗透」——多行件的底座与单行件的附加件正交，渗透即污染。password 的附加件本身就是单行件的扩展，**渗透正是目的**；反之若复制，那份最易出错的值桥门闩逻辑会出现第二份副本，两份随版本漂移是必然。
- **代价（显式接受）**：继承覆盖只传导 `data` / `methods` / `hooks` / `styles`，**模板出口 fallback 不传导**——默认段必须整段重声明（内层 `<input>` + 清除钮 + 眼睛钮）。父层模板的结构改动不会自动出现在本组件里，需人工同步。
- 产物以副作用导入 `../input/index`（连带 field），按需加载一个文件即自包含。

### 3. API 面

| 属性 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `type` | `"password"` | 冻结 | **组件身份**：外部传值静默丢弃（precompile 折叠期丢弃 + 运行时 data 归一 + 明文态重裁定三重兜底） |
| `viewable` | `boolean` | `true` | 明文可见切换能力开关：`false` 时眼睛钮整钮零 DOM，并在翻假瞬间强制复位隐藏 |
| `minlength` | `number` | `0` | >0 同步原生 `minlength`（仅原生约束校验，无内置提示、无计数） |
| `autocomplete` | `string` | `""` | 原生 `autocomplete` 提示（`current-password` / `new-password` 等；空不写属性） |
| `value` | `string` | `""` | 继承：非受控初值 / 单向同步值（受控真相走宿主 `x-model`） |
| `placeholder` | `string` | `""` | 继承 |
| `maxlength` | `number` | `0` | 继承：>0 同步原生 `maxlength`（浏览器原生截断） |
| `clearable` | `boolean` | `false` | 继承：清除钮 |
| `prefix` / `suffix` | `string \| { icon: string }` | `""` | 继承：装饰 props（`prefix` 排在钥匙之后） |
| `status` / `disabled` / `readonly` | — | — | 继承（field 骨架） |
| `actions` | `Array` | `[]` | 继承（field 融合动作；须状态引用注入） |

`minlength` / `autocomplete` **只在 password 上新增**，不回填 input / textarea：最小长度与自动填充提示天然属于密码场景，而 input 刚经历 API 删减，不宜立即回填。需要「无眼睛的密码框」用 `<x-input type="password">` 即可，不需要第二套开关。

### 4. 明文态（`revealed`）：表现状态，不是值状态

- **只改原生 `input.type`**（`password` ↔ `text`）：不改值、不派发自定义事件、不参与 `el.value` 值桥；原生 `input` 事件与 `x-model` 完全不受影响。
- **术语**：能力开关叫 `viewable`（眼睛钮在不在），表现状态在文档与实现里叫**明文态**（内部键 `revealed`，与继承来的 `hasValue` 同级）。`visible` 是同形不同义的混称，禁用。
- **复位规则**（安全默认）：值清空（清除钮派发的 `input` 冒泡，或手输到空）→ 复位隐藏；`viewable` 翻假 → 强制复位隐藏（防「明文但无钮可关」的悬空态）。
- **切换细节**：切前暂存 `selectionStart` / `selectionEnd`，切后复原（改 `input.type` 会丢选区），随后 `focus()` 回控件。
- **不做**：失焦/提交自动隐藏、受控明文态 props、明文态事件、长按显示、强度条。意外隐藏会打断用户；受控可见意味着明文可长期常驻。

### 5. 装饰与动作件布局（ADR-0020 决策 3 的延续）

- **DOM 序**：`[actions:before] [slot:prefix] [input] [clear] [eye] [slot:suffix] [actions:after]`。
- **眼睛钮留 body**：功能动作件不进可被消费方投影顶掉的出口 fallback——若挂在 `suffix` 出口，消费方一投影 `suffix` 插槽密码框就失去核心能力。
- **钥匙装饰走 prefix 出口**：覆盖段整段替换（ADR-0137 决策三-b，不合并），故本组件重新声明 input 的 affix 段——单根容器 `.asc-input-affix` 承接出口注入类（次要色/间距/防收缩），内部序为 `[key][prefix.icon][prefix text]`。消费方投影 `prefix` 插槽时整段让位（显式接管语义）。
- **眼睛钮语义**：`<i class="asc-input-action asc-password-eye" role="button" data-autospark-action>` + 动态 `aria-label`（「显示密码」/「隐藏密码」）+ `aria-pressed`。`data-autospark-action` 使 field 的点击转发焦点跳过它（动作件自理焦点）。点击**照常冒泡**（不 `stopPropagation`）——与清除钮的阻断语义有意不同，保留外层观察原生 click 的通道。
- **键鼠可达性缺口**：不加 `tabindex`，与清除钮同轨（鼠标可达、键盘不可达）——记入已知边界，不在本组件单独破例以免同盒内两个动作件行为分叉。

### 6. 图标：复用引擎内置，不注册组件自有图标

`key`（前缀）/ `eye`（掩码态）/ `eye-off`（明文态）三枚已驻引擎内置图标表（`packages/engine/src/icons.ts`，随本批一并提交）。**不再走 ADR-0058 的组件自有注册**——`input-eye` / `input-eye-off` 那条链刚在修订三被清理，重新引入会让「图标命名空间化」的复杂度回到组件侧。消费方仍可 `AutoSpark.icons.add("eye", svg)` 同名覆盖做定制（ADR-0058 决策 12）。

### 7. 样式

- 复用继承来的 `.asc-input-native` / `.asc-input-affix` / `.asc-input-action` 全部规则与暗色兜底（styles 父子拼接）。
- 本组件只补一条：抑制 Edge/IE 的原生密码显露钮（`::-ms-reveal` / `::-ms-clear`）——本组件的眼睛/清除钮是唯一动作面，放任 UA 钮并排会出现两套语义相同的控件。这同时收口 ADR-0020 后果里记录的边界④。
- 无内置文案、不接 i18n（ADR-0018 决策 1）；`aria-label` 属可访问性语义文案（`carousel` / `image-viewer` 同款硬编码先例）。

## 备选方案

- **照 textarea 先例继承 field + 复制值桥**：否决——password 的底座就是单行 input 的全部机制，「不想让单行逻辑渗透」的前提不成立；复制会生产第二份 `initDone` 重放门闩逻辑，必然漂移。
- **继续在 input 上保留 `showPassword`**：否决——ADR-0020 修订三刚以「职责正交」删除，回填等于自我推翻；且密码场景还要求 `minlength` / `autocomplete`，会进一步膨胀 input。
- **把 `showPassword` 做成 input 的插槽/组件外置增强**：否决——眼睛钮必须与盒饰、清除钮、焦点转发共享 field 骨架的布局与状态通道，外部增强拿不到这些。
- **眼睛钮放 suffix 出口**：否决——可被消费方投影顶掉，密码框失去核心能力（见决策 5）。
- **`type` 允许外部覆盖（`<x-password type="email">`）**：否决——身份漂移，且眼睛钮在该形态下语义空洞；需要别的 type 请用 input。
- **受控明文态 props（`visible` / `defaultVisible`）**：否决——受控可见 = 明文可长期常驻的安全隐患；内部态已覆盖交互需求。
- **组件自注册 `password-eye` 图标**：否决——内置 `eye` / `eye-off` 已在引擎，组件侧注册只增加命名空间负担（见决策 6）。

## 后果

- 交付 `autospark.password`：产物 `autospark.password.js`（内嵌 input / field 注册）；测试 `src/__tests__/components/form/password-plugin.test.ts`；文档页 + 侧边栏「表单」组 + demo 三页 + 独立演示站页面。
- ADR-0020 的后果条目④（password 形态浏览器原生显露钮未协调）由本组件收口；修订三移除的能力以本组件形态回归，`autospark.input` 保持瘦身状态。
- CONTEXT 词条新增「密码框 / autospark.password」，并把 textarea 的 `_Avoid_` 条目改写为「多行件判据 + 指向本 ADR 的反向判据」，避免两条判据被读成矛盾。
- **已知边界**：①动作件（眼睛/清除）键盘不可达，与清除钮同轨；②明文态下浏览器与密码管理器的行为可能变化（`autocomplete` 提示可缓解）；③`minlength` 违规只有浏览器在提交/约束校验时给出 `tooShort`，UI 无任何视觉反馈（文档明示）；④默认段整段重声明，父层模板演进需人工同步（继承机制固有）。
