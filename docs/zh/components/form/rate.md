# Rate 评分

## 概述

Rate 是 AutoSpark 的官方评分组件（组件库 P1 form 批，ADR-0018），走**自绘路线**（无原生对应控件）：引擎内置 `star` 星形图标 ×N（`max` 可配，x-for 渲染），每星双层——灰星底层 + 亮星覆盖层（`clip-path` 百分比裁剪，100% 整星 / 50% 半星）。

可访问性自持：星组挂 `role="slider"` 单焦点键盘模型（`tabindex` + `aria-valuemin/now/max` 随动 + 方向键调分 + Home / End 归位）——与 Switch 的 `role="switch"` 同款自持范式（ADR-0018 决策 7 表单基座策略内的自绘例外形态）。零内置文案的可访问性标注经宿主 `aria-label` 透传。

能力面：**悬停预览**（半星粒度判定）、**allowHalf 半星**、**clearable 同分清零**、**readonly / disabled**。组件继承 `autospark.base-field` 表单域骨架（状态色通道 / 焦点态 / disabled 同步，裸态无盒饰，ADR-0020）；表单提交走 hidden 载体（自绘控件无原生真身的代理形态，Switch 同款）。

视觉全走 `--auto-*` 语义变量三级回退链（ADR-0129）；**不设自有尺寸属性**——星形 em 基准随主题 `data-size` 档位字号缩放（button 同范式 ADR-0012）；暗色态容器裸挂 `data-dark`。无内置文案、不接 i18n（ADR-0018 决策 1）。

引入方式：引擎之后加载 `<script src="/autospark/autospark.rate.js"></script>`（自举注册，产物已内嵌 base-field 注册），或聚合产物 `autospark.plugins.js`。

## 快速入门

引擎之后加载组件脚本即注册完成，以指令值形态实例化；值通道直接在宿主上写 `x-model`（数字语域值桥）：

```html
<script src="autospark.js"></script>
<script src="autospark.rate.js"></script>

<span aria-label="整体评分" x-model.number="form.score" x-component:autospark.rate></span>
```

<demo html="components/form/rate/basic.html"/>

## 指南

### max

**类型**: `number`
**默认**: `5`

星形总数（`>= 1`，非法归 5）；运行时变化自动重建星组并夹取当前值，`aria-valuemax` 随动。

### allowHalf

**类型**: `boolean`
**默认**: `false`

半星粒度：悬停预览与点击提交均按 0.5 步进（星内左右半判定）；键盘方向键同样 0.5 粒度调分。

### clearable

**类型**: `boolean`
**默认**: `false`

再次点击当前同分时清零（`value` 归 0 并派发 change），antd 同款「点击取消评分」语义。

### 值通道（x-model 桥）

**受控真相走宿主 `x-model`**：组件把宿主 `el.value` 劫持为数字语域（`"0"` ~ `"N"`，allowHalf 时含 `.5`）；提交（点击 / 键盘）派发 `input`（非冒泡，x-model 监听在宿主自身回写 state，配 `.number` 修饰符保真数字类型）。

`value` 属性是**非受控初值 / 单向同步值**：无 x-model 时外部状态变化经 watch 同步点亮（单向），受控场景请恒用 `x-model`。

```html
<!-- 双向绑定（推荐） -->
<span x-model.number="form.score" x-component:autospark.rate></span>
<!-- 单向同步（无回写） -->
<span x-component:autospark.rate="{ value: form.score }"></span>
```

### change 事件（提交确认）

点击或键盘调分后派发 `change`（冒泡，`detail = { value }`，value 为 `number`）。表单同步惯用法：

```html
<div @change="form.score = $event.detail.value">
  <span x-model.number="form.score" x-component:autospark.rate></span>
</div>
```

<demo html="components/form/rate/variants.html"/>

### 悬停预览

鼠标悬停星组时按目标位置实时预览点亮（半星粒度判定），移出恢复实际值；预览态宿主挂 `data-hover` 标记、表单载体不随预览（恒随实际值）。readonly / disabled 时预览与提交均阻断。

### 键盘（role=slider 单焦点模型）

星组可聚焦，方向键调分（`ArrowRight` / `ArrowUp` 加分，`ArrowLeft` / `ArrowDown` 减分，半星粒度随 `allowHalf`）、`Home` 归 0、`End` 满分；`aria-valuenow` 随动，默认滚动行为阻断。

### disabled / readonly

**类型**: `boolean`
**默认**: `false`

`disabled` 由骨架同步到 hidden 载体（**禁用即出表**，原生表单语义）+ 宿主 `data-disabled` 反射（淡化 + 禁点）；`readonly` 阻断预览与提交（值不可变语义，无淡化），宿主 `data-readonly` 反射。

### status 状态色（x-field 协作）

**类型**: `"" | "error" | "success" | "warning"`
**默认**: `""`

表单域状态色通道（base-field 骨架）：亮星色消费 `--asc-field-tone`（status 在场随语义色联动——error 评分红显等）；`error` 态同步星组 `aria-invalid`。校验结果来自 x-field（组件不做校验，ADR-0020 决策 1）。

### 表单提交（hidden 载体）

内嵌 `input[type=hidden]` 表单载体：value 恒随当前分值（数字字面串恒提交）、宿主 `name` 透传、disabled 时随载体出表——自绘控件无原生真身的代理形态（Switch / StateButton 同款，对照 Slider 的 range 直提交分叉，ADR-0020 决策 6）。

### 可访问性标注（aria-label 透传）

组件零内置文案——宿主 `aria-label` 属性自动透传到星组（`role="slider"` 的可访问名称），请务必为每个实例提供。

### 主题化

尺寸档位：任意祖先容器挂 `data-size="x-small | small | medium | large | x-large"`（theme 手动通道）整片生效——星形 em 基准随字号缩放；暗色：容器裸挂 `data-dark`。使用者覆盖通道 `--asc-rate-*`（如 `--asc-rate-off` 灰星底色）与骨架通道 `--asc-field-*`；均可被同名覆盖变量接管（三级回退链第二级）。

## 参考

### 属性

| 属性 | 类型 | 默认 | 说明 |
|---|---|---|---|
| value | `number` | `0` | 非受控初值 / 单向同步值（0-N；受控真相走宿主 x-model） |
| max | `number` | `5` | 星形总数（>=1；运行时变化重建星组） |
| allowHalf | `boolean` | `false` | 半星粒度（悬停 / 点击 / 键盘均 0.5 步进） |
| clearable | `boolean` | `false` | 再次点击同分清零 |
| status | `"" \| error \| success \| warning` | `""` | 状态色通道（base-field 骨架；tone 联动亮星色） |
| disabled | `boolean` | `false` | 禁用（载体出表 + 淡化；预览与提交阻断） |
| readonly | `boolean` | `false` | 只读（预览与提交阻断，无淡化） |

### 事件

| 事件 | 参数 | 说明 |
|---|---|---|
| input | 组件派发 | 提交时非冒泡派发（x-model 监听在宿主自身回写） |
| change | `detail: { value }` | 提交确认（点击 / 键盘调分），value 为 `number` |

### Slots

| 插槽 | 说明 |
|---|---|
| 默认 | 整段控件区覆盖（一般不用——传入内容会替换星组结构，属逃生通道） |
