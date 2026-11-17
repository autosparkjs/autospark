# Textarea 多行文本框

## 概述

Textarea 是 AutoSpark 的官方多行文本框组件（ADR-0032），走**原生增强路线**：内层是真实的原生 `<textarea>` 控件 + 骨架样式包裹，不自绘输入面——原生可访问性（键盘 / IME 输入法 / 自动填充 / 移动端兼容）全保留（ADR-0018 决策 7）。

能力面：**autosize 自动增高**（默认开启，`minRows` / `maxRows` 夹取，到顶内部滚动）、**resize 原生拖拽**（关闭 autosize 后生效）、**maxlength 计数**、**clearable**（清除钮）、**disabled / readonly**。不提供 `prefix` / `suffix` **props**（单行 affix 习惯，多行盒内布局成本高；重装饰仍可走 field 的具名插槽）；label、校验文案、域布局由 engine 的 [x-form / x-field 指令](/zh/guide/engine/form/) 承担——组件只经 `status` 属性消费校验结果染色，**不双轨建域**。

组件继承 [`autospark.field` 表单域骨架](/zh/components/form/field)（状态色通道 / 焦点态 / 盒饰 chrome / [actions 融合动作](/zh/components/form/field#actions-融合动作)），视觉全走 `--auto-*` 语义变量三级回退链（ADR-0129）；**不设自有尺寸属性**——高度/内距消费 `--auto-input-height` / `--auto-input-padding`，经主题通道 `data-size` 挂任意祖先容器全档位跟随；暗色态容器裸挂 `data-dark` 即局部切换。无内置文案、不接 i18n（ADR-0018 决策 1）。

> **与 Input 的分工**（ADR-0032）：`autospark.input` 不再内置 textarea 形态，`<x-input type="textarea">` 已下线——`type` 会在原生 input 上被浏览器归一为 `text`，静默退化为单行输入（多行专属属性 `rows` 等被忽略）。多行输入请改用本组件。

引入方式：引擎之后加载 `<script src="/autospark/autospark.textarea.js"></script>`（自举注册，产物已内嵌 field 注册，无须单独引入），或聚合产物 `autospark.plugins.js`。

## 快速入门

引擎之后加载组件脚本即注册完成，以元素名或指令值形态实例化；值通道直接在宿主上写 `x-model`（值桥协议，见[指南 · 值通道](#值通道-x-model-桥)）：

```html
<script src="autospark.js"></script>
<script src="autospark.textarea.js"></script>

<x-textarea x-model="form.bio" rows="3" placeholder="请输入简介"></x-textarea>
<!-- 等价写法：显式声明组件名 -->
<span x-component:autospark.textarea="{ rows: 3, placeholder: '请输入简介' }" x-model="form.bio"></span>
```

`<x-textarea>` 的纯文本子内容会折叠为 `value` 初值：

```html
<x-textarea name="memo" rows="2">这段文字是初值</x-textarea>
```

<demo html="components/form/textarea/basic.html"/>

## 指南

### autosize 自动增高

**类型**: `boolean`
**默认**: `true`

开启时控件高度随内容增长，由 `minRows` / `maxRows` 夹取；到顶后转为内部滚动。高度重算覆盖四个时机：用户输入、程序化 `value` 变化、初始挂载、控件宽度变化（`ResizeObserver`——宽度改变折行数，只监听 value 会在侧栏展开或窗口缩放后失准）。高度变化不加过渡动画，避免连续输入时抖动。

> **与 resize 互斥**：autosize 开启时强制 `resize: none`；需要原生拖拽手柄请显式关闭 autosize（见下节）。

<demo html="components/form/textarea/autosize.html"/>

### rows / minRows / maxRows

**类型**: `number` / `number` / `number`
**默认**: `2` / `0` / `8`

- `rows`：原生初始行数，同时作为 `minRows` 的缺省值；
- `minRows`：autosize 最小行数，`0` 表示取 `rows`；显式声明时优先于 `rows`；
- `maxRows`：autosize 最大行数，默认 `8`；`0` 表示不限高。

### resize 原生拖拽

**类型**: `"none" | "vertical" | "horizontal" | "both"`（`""` 取缺省）
**默认**: `""`（autosize 关闭时按 `vertical` 处理）

仅在 `autosize` 关闭时生效；开启时该属性被忽略（强制 `resize: none`），不额外警告。

### placeholder / maxlength

**类型**: `string` / `number`
**默认**: `""` / `0`

`placeholder` 同步原生占位文案；`maxlength > 0` 同步原生 maxlength 属性（浏览器原生输入截断）并作为计数分母。

### 值通道（x-model 桥）

**受控真相走宿主 `x-model`**：组件把宿主 `el.value` 劫持桥接到内层原生 textarea——`x-model` 的读写都落在劫持位，内层原生 `input` 事件自然冒泡经过宿主被 `x-model` 直接监听（与 [Input](/zh/components/form/input#值通道-x-model-桥) 同一协议，ADR-0020）。修饰符（`.trim` / `.number` / `.boolean`）与 x-model 全部语义可用。

`value` 属性是**非受控初值 / 单向同步值**：无 x-model 时外部状态变化会写入控件（单向），受控场景请恒用 `x-model`。

```html
<!-- 双向绑定（推荐） -->
<x-textarea x-model="form.bio"></x-textarea>
<!-- 单向同步（无回写） -->
<x-textarea :value="form.bio"></x-textarea>
```

### clearable

**类型**: `boolean`
**默认**: `false`

值非空且可交互时，右上角显示清除钮（内部动作件，点击不转发焦点）：清空 + 手动派发 `input` 事件（冒泡过宿主驱动 x-model 回写 state）+ 焦点回控件。清除钮为浮层，不占文本行宽；控件右侧预留内距避免压字。

### 计数（maxlength / show-count）

**类型**: `boolean`
**默认**: `false`（`maxlength > 0` 时自动显示，无须开启）

- `maxlength > 0`：**自动**在右下角显示 `当前 / 上限`，超限整组染 danger 色；
- `show-count`：即使没有 `maxlength`，也显示当前字数。

计数器为浮层（绝对定位于右下角），不占文本行；控件底部预留内距避免压字。

<demo html="components/form/textarea/count.html"/>

### actions 融合动作

**类型**: `Array<button props & { pos?, name?, value? }>`
**默认**: `[]`

在控件上方 / 下方增加 1-N 个动作按钮——field 骨架层能力（继承即得，完整说明见 [BaseField · actions 融合动作](/zh/components/form/field#actions-融合动作)）。与 Input 的横向融合不同，**本组件把按钮段改为整行排布**：`pos: "before"` 在上、`after`（缺省）在下，右对齐，不与文本抢行宽；按钮恢复自有描边与圆角。

项为 **button props 全集** + 自有键 `pos` / `name` / `value`；数组**经状态引用注入**（`:actions="myActions"`——字面量数组触发引擎死环缺陷勿用）；点击组包派发 `action-click`（`detail = { index, name, value, item }`，`@` 监听写外层包裹元素）+ 原生 click 双通道；**须同页加载 `autospark.button.js`**（组合依赖）。

<demo html="components/form/textarea/actions.html"/>

### disabled / readonly

**类型**: `boolean`
**默认**: `false`

由 field 骨架统一同步到内层原生控件（`disabled` / `readOnly` 属性）+ 宿主 `data-disabled` / `data-readonly` 反射（禁用淡化 / 光标通道）。readonly 可聚焦可复制，仅阻输入。

### status 状态色（x-field 协作）

**类型**: `"" | "error" | "success" | "warning"`
**默认**: `""`

表单域状态色通道（field 骨架）：染边框与焦点环（`error`=danger / `success`=success / `warning`=warning），`error` 态内层控件同步 `aria-invalid="true"`。**校验结果来自 x-field**——组件不做校验，经绑定消费指令注入的 `$field.error`：

```html
<form x-form="profile">
  <div x-field="bio">
    <x-textarea x-model="profile.bio" :status="$field.error ? 'error' : ''"></x-textarea>
    <em>{{ $field.error }}</em>
  </div>
</form>
```

### 表单提交（原生直提交）

宿主 `name` 属性自动透传到内层原生 textarea——原生表单提交 / `FormData` 直接生效（无须隐藏代理载体，ADR-0020）。

### 事件

组件默认封闭，**原生事件经冒泡到外层消费**（不自定义事件面）：

| 事件 | 说明 |
| --- | --- |
| `input` / `change` | 内层原生控件事件自然冒泡（x-model 与外层 `@input` / `@change` 直接消费；清除钮的清空亦派发 `input`） |

### 主题化

尺寸档位：任意祖先容器挂 `data-size="x-small | small | medium | large | x-large"`（theme 手动通道）整片生效——高度 / 内距消费 `--auto-input-height` / `--auto-input-padding` 随档联动；暗色：容器裸挂 `data-dark`。使用者覆盖通道 `--asc-textarea-*`（如 `--asc-textarea-placeholder`、`--asc-textarea-count`）与骨架通道 `--asc-field-*`（如 `--asc-field-primary`、`--asc-field-bg`、`--asc-field-height`）；底层主题令牌仍为 `--auto-input-*`，`--asc-textarea-*` 只做组件级覆盖。

## 参考

### 属性

| 属性 | 类型 | 默认 | 说明 |
|---|---|---|---|
| value | `string` | `""` | 非受控初值 / 单向同步值（受控真相走宿主 x-model） |
| placeholder | `string` | `""` | 占位文案（同步原生属性） |
| maxlength | `number` | `0` | >0 同步原生 maxlength（原生截断）+ 自动显示计数 |
| rows | `number` | `2` | 初始行数；`minRows` 未声明时兼作最小行数 |
| minRows | `number` | `0` | autosize 最小行数（0 = 取 rows） |
| maxRows | `number` | `8` | autosize 最大行数（0 = 不限高，到顶内部滚动） |
| autosize | `boolean` | `true` | 自动增高；开启时强制 resize:none |
| resize | `"" \| none \| vertical \| horizontal \| both` | `""` | autosize 关闭时的原生拖拽（缺省 vertical） |
| clearable | `boolean` | `false` | 清除钮（非空显形，点击清空 + input 派发 + 焦点回控件） |
| showCount | `boolean` | `false` | 计数器（无 maxlength 时显式显示当前字数） |
| status | `"" \| error \| success \| warning` | `""` | 状态色通道（field 骨架；x-field 校验结果染色入口） |
| disabled | `boolean` | `false` | 禁用（骨架同步原生控件） |
| readonly | `boolean` | `false` | 只读（骨架同步原生控件） |
| actions | `Array<button props & { pos?, name?, value? }>` | `[]` | 控件上 / 下动作按钮（状态引用注入；须同页加载 autospark.button.js） |

### 事件

| 事件 | 参数 | 说明 |
|---|---|---|
| input / change | 原生事件 | 内层原生控件事件冒泡（外层 `@input` / `@change` 消费） |
| action-click | `{ index, name, value, item }` | actions 按钮点击（field 骨架组包，冒泡）+ 原生 click 双通道 |

### Slots

| 插槽 | 说明 |
|---|---|
| 默认 | 整段控件区覆盖（一般不用——传入内容会替换内层控件结构，属逃生通道） |
| prefix | 前置装饰出口（经 field 骨架继承）：任意 HTML，默认次要色；交互件须标 `data-autospark-action` 自理焦点 |
| suffix | 后置装饰出口（经 field 骨架继承）：形态同 prefix |
