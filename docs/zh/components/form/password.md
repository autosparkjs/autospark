# Password 密码框

## 概述

Password 是 AutoSpark 的官方密码输入组件（ADR-0034），**继承 [`autospark.input`](/zh/components/form/input)**：值桥（宿主 `x-model` 直写）、`placeholder` / `maxlength` / `name` 同步、清除钮、`prefix` / `suffix` 装饰、`actions` 融合动作、`status` 状态色全部沿用，另加三件密码场景专属能力——**前缀钥匙装饰**、**明文可见切换（眼睛钮）**、**`minlength` / `autocomplete` 原生属性透传**。

组件继承链 `password → input → field → autospark.base`，视觉仍走 `--auto-*` 语义变量三级回退链（ADR-0129）；**不设自有尺寸属性**——高度/内距经主题 `data-size` 通道挂任意祖先容器全档位跟随。

`type` 由组件**冻结**为 `password`：外部传入的 `type` 会被静默忽略。需要其它输入类型请直接用 [Input](/zh/components/form/input)。

引入方式：引擎之后加载 `<script src="/autospark/autospark.password.js"></script>`（自举注册，产物已内嵌 input / field 注册，无须单独引入），或聚合产物 `autospark.plugins.js`。

## 快速入门

引擎之后加载组件脚本即注册完成；值通道直接在宿主上写 `x-model`，眼睛钮点击即切换掩码/明文：

```html
<script src="autospark.js"></script>
<script src="autospark.password.js"></script>

<x-password x-model="form.password" placeholder="请输入密码"></x-password>
```

<demo html="components/form/password/basic.html"/>

## 指南

### 明文可见切换（眼睛钮）

**类型**: 内置行为（无 props 开关）
**默认**: 掩码态

眼睛钮位于输入框最右侧（清除钮之后），点击在**掩码态**与**明文态**之间切换：

- 掩码态图标为 `eye`，明文态为 `eye-off`；`aria-label` 随之在「显示密码」/「隐藏密码」之间切换，`aria-pressed` 表达当前明文态；
- **明文态只改原生 `input.type`**（`password` ↔ `text`）——**不改值、不派发事件、不参与值通道**，`x-model` 与原生 `input` / `change` 事件完全不受影响；
- 切换后焦点回到控件，并恢复切换前的光标选区；
- **只读态仍可切换**（只读是禁止编辑，不禁止查看）；**禁用态点击零效果**（钮不隐藏，避免布局跳动）；
- **清空复位**：清除钮清空、或手动删到空值时，自动回到掩码态，避免后续输入以明文呈现。

### viewable

**类型**: `boolean`
**默认**: `true`

明文可见切换的能力开关。`false` 时眼睛钮**整钮不渲染（零 DOM）**，并在翻为 `false` 的瞬间强制复位为掩码态——不会出现「已明文但无钮可关」的悬空态。

需要「没有眼睛的密码框」时，`viewable="false"` 与 `<x-input type="password">` 都可行：前者保留钥匙装饰与 `minlength` / `autocomplete` 通道，后者是纯原生掩码输入。

<demo html="components/form/password/states.html"/>

### minlength / maxlength

**类型**: `number`
**默认**: `0`

两者都是**原生属性透传**，`> 0` 时写入内层原生控件，`0`（或负数）移除属性：

| 属性 | 行为 |
|---|---|
| `maxlength` | 浏览器原生截断——超出长度**无法继续输入**（继承自 input） |
| `minlength` | 只在表单提交 / 原生约束校验时校验，违规给 `tooShort` |

::: warning 无内置反馈
组件**不做**长度提示、**不做**计数、**不做**校验。`minlength` 不满足时界面不会有任何视觉变化（浏览器只在提交时拦截）。需要即时反馈请用 [x-form / x-field 指令](/zh/guide/engine/form/) 校验，并把结果经 `status` 染色：

```html
<div x-field="password">
  <x-password x-model="login.password" minlength="8" :status="$field.error ? 'error' : ''"></x-password>
</div>
```
:::

<demo html="components/form/password/limits.html"/>

### autocomplete

**类型**: `string`
**默认**: `""`

原生 `autocomplete` 提示，空值不写属性。密码字段是自动填充语义最重的场景——登录用 `current-password`、注册/改密用 `new-password`，可显著改善浏览器与密码管理器的行为。宿主元素上的 `autocomplete` 属性**不会**自动流到内层原生控件（input 只透传 `name`），因此本组件单独开放该 prop。

### 继承自 input 的能力

| 能力 | 说明 |
|---|---|
| 值通道 | 宿主 `x-model` 直写（`el.value` 劫持桥），修饰符 `.trim` / `.number` / `.boolean` 照常可用 |
| `value` | 非受控初值 / 单向同步值；受控真相走 `x-model` |
| `placeholder` | 同步原生占位文案 |
| `clearable` | 清除钮（非空且可交互时显形；点击清空 + 派发 `input` + 焦点回控件 + 复位掩码态） |
| `prefix` / `suffix` | 文本 / 图标装饰（`prefix` 排在钥匙之后）；对象形态 `{ icon }` 请经状态引用注入 |
| `status` / `disabled` / `readonly` | field 骨架通道（状态色 / 禁用 / 只读） |
| `actions` | field 融合动作（button props 数组，须状态引用注入；须同页加载 `autospark.button.js`） |
| 表单提交 | 宿主 `name` 透传到内层原生控件（原生直提交） |

### 装饰插槽

`prefix` / `suffix` 具名插槽经 field 骨架继承：任意 HTML，默认次要色。**投影 `prefix` 插槽会整段接管该出口**——此时内置钥匙图标让位（显式接管语义）；眼睛钮不受影响（它在控件侧，不在出口位）。

### 事件

组件默认封闭，**原生事件经冒泡到外层消费**，不派发自定义事件：

| 事件 | 说明 |
|---|---|
| `input` / `change` | 内层原生控件事件自然冒泡（`x-model` 与外层 `@input` / `@change` 直接消费） |
| `click` | 眼睛钮的点击**照常冒泡**（与清除钮的阻断语义不同），外层可观察 |

### 主题化

尺寸档位：任意祖先容器挂 `data-size="x-small | small | medium | large | x-large"` 整片生效；暗色：容器裸挂 `data-dark`。使用者覆盖通道 `--asc-password-*` 与继承通道 `--asc-input-*` / `--asc-field-*`，底层消费 `--auto-input-*` 语义令牌（三级回退链第二级可被同名覆盖变量接管）。

### 已知边界

1. **动作件键盘不可达**：眼睛钮与清除钮都是鼠标可达、Tab 不可达（同一已记录缺口，避免同盒内两个动作件行为分叉）；
2. **明文态会改变浏览器/密码管理器行为**：部分管理器在 `type=text` 时不提示保存，`autocomplete` 可缓解但不保证；
3. **`minlength` 无 UI 反馈**（见上）；
4. **内置钥匙图标可被同名覆盖**：`AutoSpark.icons.add("key", svg)` 即可替换。

## 参考

### 属性

| 属性 | 类型 | 默认 | 说明 |
|---|---|---|---|
| type | `"password"` | 冻结 | 组件身份，外部传值静默忽略 |
| viewable | `boolean` | `true` | 明文可见切换能力开关（false = 不渲染眼睛钮并强制复位） |
| minlength | `number` | `0` | >0 同步原生 minlength（仅原生约束校验，无提示/计数） |
| autocomplete | `string` | `""` | 原生 autocomplete 提示（空不写属性） |
| value | `string` | `""` | 非受控初值 / 单向同步值（受控真相走宿主 x-model） |
| placeholder | `string` | `""` | 占位文案（同步原生属性） |
| maxlength | `number` | `0` | >0 同步原生 maxlength（原生截断） |
| clearable | `boolean` | `false` | 清除钮（非空显形，点击清空 + input 派发 + 焦点回控件 + 复位掩码态） |
| prefix | `string \| { icon: string }` | `""` | 前置装饰（排在钥匙之后；对象经状态引用注入） |
| suffix | `string \| { icon: string }` | `""` | 后置装饰（形态同 prefix） |
| status | `"" \| error \| success \| warning` | `""` | 状态色通道（field 骨架） |
| disabled | `boolean` | `false` | 禁用（骨架同步原生控件；眼睛钮点击零效果） |
| readonly | `boolean` | `false` | 只读（骨架同步原生控件；眼睛钮仍可切换） |
| actions | `Array` | `[]` | 融合动作（field 骨架，须状态引用注入） |

### 事件

| 事件 | 参数 | 说明 |
|---|---|---|
| input / change | 原生事件 | 内层原生控件事件冒泡（外层 `@input` / `@change` 消费） |
| click | 原生事件 | 眼睛钮点击照常冒泡 |

### Slots

| 插槽 | 说明 |
|---|---|
| 默认 | 整段控件区覆盖（逃生通道——传入内容会替换内层控件结构，眼睛钮随之消失） |
| prefix | 前置装饰出口（投影后内置钥匙让位；交互件须标 `data-autospark-action` 自理焦点） |
| suffix | 后置装饰出口（形态同 prefix；眼睛钮恒在其内侧） |
