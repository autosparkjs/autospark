# 组件变量 · 表单

## 概述

表单外观由 `--auto-input-*` 一组变量统一承载。它们全部**转发**通用派生值，
因此主题色、模式、色彩、尺寸任一维变化都自动跟随。

```html
<input class="auto-input" placeholder="文本框" />
```

<demo html="theme/form-overview.html"/>

## 指南

### 变量清单

| 变量 | 转发到 |
| --- | --- |
| `--auto-input-font` | `--auto-font`（随 `data-size` 档） |
| `--auto-input-border` | `--auto-border` |
| `--auto-input-bgcolor` | `--auto-bgcolor`（暗色改指工作区色，凹陷流派） |
| `--auto-input-placeholder` | 主文字色 40% 不透明 |
| `--auto-input-padding` | `--auto-padding`（`data-size` / `data-spacing` 同步换档） |
| `--auto-input-radius` | `--auto-border-radius` |
| `--auto-input-height` | `--x-input-height-*`——**该基础量当前未定义**，变量解析为空，高度实际由行高决定 |

### 输入控件：`.auto-input` 单类双形态

一个类名承载两种形态，形态由宿主标签判别，使用者无需记住第二个类名。

#### 元素形态（直接标注在表单元素上）

```html
<input class="auto-input" placeholder="文本框" />
<select class="auto-input"><option>选项</option></select>
<textarea class="auto-input"></textarea>

<label><input class="auto-input" type="checkbox" /> 复选</label>
<label><input class="auto-input" type="radio" name="g" /> 单选</label>
<input class="auto-input" type="range" />
```

- 承载完整的输入外观（背景、边框、聚焦光晕、占位符色）；
- `checkbox` / `radio` / `range` 的定制**只存在于此形态**（元素形态与容器形态共用同一套 Less mixin，源码只有一份）。

#### 容器形态（标注在布局元素上）

```html
<!-- 前后缀 -->
<div class="auto-input">
    <span class="auto-input-action">¥</span>
    <input placeholder="金额" />
    <span class="auto-input-action"><button>清空</button></span>
</div>

<!-- 字段标签 -->
<div class="auto-input">
    <label>姓名</label>
    <input placeholder="请输入" />
</div>

<!-- 选择类组合：容器退去输入框外观，label 与控件状态联动 -->
<div class="auto-input">
    <input type="checkbox" id="a" /><label for="a">同意协议</label>
</div>
```

| 情形 | 表现 |
| --- | --- |
| 内部文本类表单元素 | 一律**裸化**（去边框 / 背景 / 内边距，含误带 `.auto-input` 类的），外观由容器承载 |
| 内部 `checkbox` / `radio` | 直接拿到定制皮肤 |
| 内部 `range` | 撑满剩余宽度 |
| 内部 `:focus` | 容器以 `:focus-within` 高亮 |
| 内部有禁用控件 | 容器整体降调（`:has()` 渐进增强，不可用时无害降级） |
| 纯选择类组合 | 容器去掉边框 / 背景 / 内边距，`label` 随选中 / 悬停 / 禁用联动 |
| 首尾子元素是 `.auto-input-action` | 对应侧内边距归零，操作件贴住容器边框 |

#### 操作件与字段标签

```html
<div class="auto-input">
    <span class="auto-input-action">前缀</span>
    <input />
    <span class="auto-input-action">后缀</span>
</div>
```

- **操作件**（`.auto-input-action`）：容器内前后缀按钮 / 图标，位置由 DOM 顺序决定；与容器等高、
  垂直分割线贯穿容器全高；内含 `<button>` 时自动按钮化（无需 `.auto-btn`），端部按钮自动贴合容器圆角；
- **字段标签**（容器内 `label`）：与选择控件组合时表达选项并联动状态，与文本输入组合时表达字段名。
  分工：字段标签回答「这是什么」，操作件回答「能做什么」。

<demo html="theme/form-input.html"/>

### 自定义表单控件

```css
.my-field {
    font: var(--auto-input-font);
    color: var(--auto-color);
    background: var(--auto-input-bgcolor);
    border: var(--auto-input-border);
    border-radius: var(--auto-input-radius);
    padding: var(--auto-input-padding);
}
.my-field::placeholder {
    color: var(--auto-input-placeholder);
}
```

逐项引用 `--auto-input-*`（而不是自己写颜色），即可与 `.auto-input` 保持同一观感并自动跟随主题。

<demo html="theme/form-custom.html"/>

---

下一步：[组件变量 · 交互反馈](./component-feedback.md)。
