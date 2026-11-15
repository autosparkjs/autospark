# ColorPicker 颜色选择器

## 概述

ColorPicker 是 AutoSpark 的官方颜色选择器组件（组件库 P3 form 批重件，ADR-0028），属**弹层交互自绘**形态（ADR-0018 决策 7）：触发器是 Field 盒饰形态（`autospark.field` 骨架继承，select 同款 chrome）+ 色块预览 + hex 文案；取色面板**自绘 HSV 模型、零第三方库**（SV 面板 = div 双层 CSS 渐变 + H 条七色谱 + 预设色板 + hex 输入），呈现**不自建弹层**——复用 [x-popover 指令](/zh/guide/directives/x-popover.md)机制（`trigger:click` 形态，select 范式直承），点击切换 / 面板外点击 / ESC 关闭全部机制继承。

值域 `#rrggbb` 六位小写 hex（内部 HSV 转换）：`#rgb` 简写 / 无 `#` 前缀 / 大小写自动归一，**空值与非法归一 `#000000`**（不支持空值态——缺省黑）。拖拽实时改色（触发器色块与 hex 实时回显），**提交恒在松手**（`change` 不逐帧派发）。

label、校验文案、域布局由 engine 的 [x-form / x-field 指令](/zh/guide/engine/form/) 承担——组件只经 `status` 属性消费校验结果染色（field 骨架通道），**不双轨建域**。无内置多语文案（色值与控件自释）。暗色态整页经主题暗色模式跟随（弹层在 body 容器渲染，**局部** `data-dark` 容器不覆盖弹层）。

引入方式：引擎之后加载 `<script src="/autospark/autospark.color-picker.js"></script>`（自举注册，产物已内嵌 field 注册）；**面板呈现依赖 x-popover 指令，须同时引入 `autospark.overlay.js`**（聚合产物 `autospark.plugins.js` 无此问题）。

## 快速入门

引擎与 overlay 之后加载组件脚本即注册完成，以元素名形态实例化（ADR-0117）；值通道直接在宿主上写 `x-model`（hex 字符串语域，见[指南 · 值通道](#值通道-x-model-桥)）。`presets` 预设色板**经状态引用注入**（字面量数组有引擎 props 死环缺陷）：

```html
<script src="autospark.js"></script>
<script src="autospark.overlay.js"></script>
<script src="autospark.color-picker.js"></script>

<x-color-picker x-model="theme.color"></x-color-picker>
```

```js
new AutoSpark(el, {
  theme: { color: "#4098fc" },
});
```

<demo html="components/form/color-picker/basic.html"/>

## 指南

### value 值域与归一

**类型**: `string`（`#rrggbb`）
**默认**: `"#000000"`

值域恒为六位小写 hex。归一器接受 `#rgb` 简写展开、无 `#` 前缀、大小写；空值与非法色值（如 `"xyz"`）归一 `#000000`——组件**不支持空值态**（缺省黑，ADR-0028 决策 7）。内部 HSV 转换（双真相模型：提交值 / 编辑值两域 + 派生态，watch 幂等守卫防回环）。

### 值通道（x-model 桥）

**受控真相走宿主 `x-model`**：组件把宿主 `el.value` 劫持为 hex 字符串语域——提交路径（拖拽松手 / 预设点击 / hex 输入应用）派发 `input`（非冒泡，x-model 宿主监听回写 state）+ `change`（冒泡，`detail = { value }`，外层消费）。`value` 属性是**非受控初值 / 单向同步值**（快照序：x-model 初值 > props.value）。

```html
<!-- 双向绑定（推荐） -->
<x-color-picker x-model="theme.color"></x-color-picker>
<!-- 单向同步（无回写） -->
<x-color-picker :value="theme.color"></x-color-picker>
```

### 面板交互

| 区域 | 交互 | 说明 |
| --- | --- | --- |
| SV 面板 | 拖拽 / 点击 | 横向饱和度、纵向明度；**实时改色**（触发器色块与 hex 回显），松手提交 |
| H 条 | 拖拽 / 点击 | 色相 0-360（七色谱恒定渐变）；SV 底色跟随 |
| 预设色板 | 点击 | 即应用 + `data-active` 高亮当前色；**不关面板**（连续试色语义） |
| hex 输入 | 回车 / 失焦 | 合法色值（`#rgb`/`#rrggbb`/无 `#`）应用；非法回显当前色不应用 |

拖拽经 pointer 事件 + `setPointerCapture`（缺席环境降级元素直挂监听）；提交恒在 pointerup——拖拽过程不刷 `change` 事件流。

### presets 预设色板

**类型**: `string[]`（可选）
**默认**: `[]`（不渲染色板区）

预设色值数组（`["#009aff", ...]`），**经状态引用注入**（字面量数组触发引擎值对象 props 死循环——修复在途）；当前色命中预设时该色块高亮。

### 键盘与可访问性

触发器聚焦（`tabindex=0`，role=combobox + aria-haspopup=dialog + aria-expanded 随开合同步）后：`Enter` / `Space` 开面板；ESC 关闭（popover 打开栈机制继承）；Tab 自然移焦。面板内键盘调色（方向键微调 H/S/V）列入后续 a11y 增量（ADR-0028 遗留）。

### disabled / status

**类型**: `boolean` / `"" | "error" | "success" | "warning"`
**默认**: `false` / `""`

`disabled`：整体淡化 + 触发器退出焦点序（tabindex=-1）+ 表单载体出表 + CSS 拦截点击开面板（`pointer-events` 阻断——popover 宿主监听不知禁用态）；`status` 经 field 骨架染边框与焦点环（`error` 态同步 `aria-invalid`），校验结果来自 x-field（组件不做校验）：

```html
<form x-form="theme">
  <div x-field="color">
    <x-color-picker x-model="theme.color"
      :status="$field.error ? 'error' : ''"></x-color-picker>
    <em>{{ $field.error }}</em>
  </div>
</form>
```

<demo html="components/form/color-picker/presets.html"/>

### 表单提交（hidden 载体）

内嵌 `input[type=hidden]` 表单载体：宿主 `name` 透传（元素名形态 `name` 属性折叠为 props 优先 / 值对象形态宿主属性直读），提交值为当前 hex；禁用时载体出表。原生表单提交 / `FormData` 直接生效。

### 事件

| 事件 | 说明 |
| --- | --- |
| `change` | 提交路径（拖拽松手 / 预设点击 / hex 应用）冒泡派发，`detail = { value }`——外层 `@change` 挂**内层包裹元素**消费 |
| `input` | 同路径非冒泡派发（x-model 专用通道） |

### 与 x-popover 的组合边界（ADR-0028）

面板的呈现 / 定位 / 关闭触点 / 层级全部由 x-popover 机制承担，组件不自建弹层；组件侧自实现的是**取色内容与交互**（HSV 模型 / 拖拽 / 预设 / hex 应用）。面板与触发器的通信走 scope 链（open + dataContext:host 聚合视图沿链读写，零 DOM 事件配对；离散交互经哨兵键、拖拽直写编辑值）。面板内部注册名用连字符形态 `autospark-color-panel`（overlay 家族点号组件名候选回溯缺口，select 同款绕行）。SV 面板白/黑叠加与 H 条七色谱为 HSV 色彩模型常数，不参与主题化。

### 主题化

尺寸档位：任意祖先容器挂 `data-size="x-small | small | medium | large | x-large"` 整片生效——触发器高度 / 内距消费 `--auto-input-*` 随档联动，面板字号随档；暗色：整页经主题暗色模式自动跟随（弹层在 body 容器，**局部** `data-dark` 容器不覆盖弹层兜底值）。使用者覆盖通道 `--asc-color-picker-*`（触发器）与 `--asc-color-panel-*`（面板，如 `--asc-color-panel-width`、`--asc-color-preset-border`）。

### 写法对照（元素名 vs 值对象）

元素名形态是推荐写法（ADR-0117）；`x-component` 值对象形态完全等价：

```html
<x-color-picker :presets="palette" :value="brand"></x-color-picker>
<span x-component:autospark.color-picker="{ presets: palette, value: brand }"></span>
```

## 参考

### 属性

| 属性 | 类型 | 默认 | 说明 |
|---|---|---|---|
| value | `string` | `"#000000"` | `#rrggbb` 非受控初值 / 单向同步值（空/非法归一 #000000；受控真相走宿主 x-model） |
| presets | `string[]` | `[]` | 预设色板（**状态引用注入**，可选；缺省不渲染色板区） |
| disabled | `boolean` | `false` | 禁用（淡化 + 退出焦点序 + 载体出表 + 不可开面板） |
| status | `"" \| error \| success \| warning` | `""` | 状态色通道（field 骨架；x-field 校验结果染色入口） |
| name | `string` | `""` | 表单提交名（元素名形态属性折叠 props 优先，回退宿主属性） |

### 事件

| 事件 | 参数 | 说明 |
|---|---|---|
| change | `detail: { value }` | 提交路径（拖拽松手 / 预设点击 / hex 应用）冒泡派发 |
| input | 原生事件 | 同路径非冒泡派发（x-model 回写通道） |

### Slots

| 插槽 | 说明 |
|---|---|
| — | 不开插槽（继承形态嵌套插槽出口被忽略，ADR-0056——色值回显走绑定通道，ADR-0028） |
