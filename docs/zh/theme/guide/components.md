# 内置组件与工具类

## 概述

静态样式层提供一组**类名即组件**的外观资产，全部只消费 `--auto-*` 变量，因此随主题实时变化。本章列出类名清单与用法要点；真实效果请跑示例页（`packages/theme` 下 `bun run dev`，5180 端口）。

## 快速入门

```html
<div class="auto-card border">
    <div class="auto-card-header">
        <span class="auto-card-title">标题</span>
        <span class="closeable"></span>
    </div>
    <div class="auto-card-body">
        <div class="auto-input">
            <span class="auto-input-action">https://</span>
            <input placeholder="域名" />
            <span class="auto-input-action"><button>前往</button></span>
        </div>
    </div>
    <div class="auto-card-footer">
        <button class="auto-btn primary">确定</button>
        <button class="auto-btn">取消</button>
    </div>
</div>
```

## 输入控件：`.auto-input`

**单类双形态**（`ADR-0001`）：一个类名承载两种形态，形态由宿主标签判别。

### 元素形态（直接标注在表单元素上）

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

### 容器形态（标注在布局元素上）

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

容器形态的规则：

| 情形 | 表现 |
| --- | --- |
| 内部文本类表单元素 | 一律**裸化**（去边框 / 背景 / 内边距，含误带 `.auto-input` 类的），外观由容器承载 |
| 内部 `checkbox` / `radio` | 直接拿到定制皮肤 |
| 内部 `range` | 撑满剩余宽度 |
| 内部 `:focus` | 容器以 `:focus-within` 高亮 |
| 内部有禁用控件 | 容器整体降调（`:has()` 渐进增强，不可用时无害降级） |
| 纯选择类组合（只有 checkbox/radio + label） | 容器去掉边框 / 背景 / 内边距，`label` 随选中 / 悬停 / 禁用联动 |
| 首尾子元素是 `.auto-input-action` | 对应侧内边距归零，操作件贴住容器边框 |

### 操作件：`.auto-input-action`

容器内前后缀（按钮、图标），位置由 DOM 顺序决定：

```html
<div class="auto-input">
    <span class="auto-input-action">前缀</span>
    <input />
    <span class="auto-input-action">后缀</span>
</div>
```

- 与容器等高、垂直分割线贯穿容器全高；相邻操作件紧贴（分割线即唯一分隔）；
- 内含 `<button>` 时自动按钮化（无需 `.auto-btn`），端部按钮自动贴合容器圆角。

## 按钮：`.auto-btn`

```html
<button class="auto-btn">默认</button>
<button class="auto-btn primary">主操作</button>
<button class="auto-btn danger">删除</button>
<button class="auto-btn small pill">小号胶囊</button>
<button class="auto-btn circle">+</button>
```

| 维度 | 类名 |
| --- | --- |
| 尺寸 | `x-small` / `small` / `medium` / `large` / `x-large` |
| 形状 | `compact`（更紧凑内距）、`circle`（圆形）、`pill`（胶囊） |
| 语义变体 | `primary` / `success` / `warning` / `error`（与 `danger` 等价）/ `info` |

也支持 `.auto-btn > button` 结构（外层作容器、内层是原生按钮）。语义变体的底色来自 `--auto-primary-color` 或 `--x-color-{name}`，因此随主题色与模式变化。

## 卡片：`.auto-card`

```html
<div class="auto-card border">
    <div class="auto-card-header">
        <span class="auto-card-title">标题</span>
        <span class="closeable"></span>
    </div>
    <div class="auto-card-body">内容</div>
    <div class="auto-card-footer">
        <button class="auto-btn primary">保存</button>
    </div>
</div>
```

- 默认无边框（浮起靠阴影），加 `border` 类显示边框；
- 结构类：`auto-card-header`（标题栏，背景取 `--auto-panel-header-bgcolor`）、`auto-card-title`、`auto-card-body`（无 footer 时自动补下方圆角）、`auto-card-footer`（上边框分隔，按钮自动靠右）；
- 标题栏里的 `.closeable` 自动靠右。

## 提示：`.auto-alert`

```html
<div class="auto-alert success">
    <div class="title">保存成功<span class="closeable"></span></div>
    <div class="description">这条描述用次要文字色。</div>
</div>
```

| 类名 | 说明 |
| --- | --- |
| `.auto-alert` | 基础容器（左侧自动加图标位，默认 `info`） |
| `.warning` / `.success` / `.primary` / `.error`（或 `.danger`） | 语义变体：底色 / 边框 / 文字 / 图标取对应语义色 |
| `.title` / `.description` | 标题（标题字体）/ 次要描述（弱化字号 + 次要文字色） |
| `.closeable` | 放标题内右侧或容器内（绝对定位靠右） |

::: warning 组件层的暗色规则是字面量
`alert.less` 里针对 `[dark]` / `[data-dark]` 的暗色变体是**写死的** `color-mix` 规则（已为 `data-light` 补对偶反规则），不随变量上下班。更深的嵌套矛盾（亮元素里再套暗元素）组件层兜不住，请改用变量层表达。
:::

## 关闭符：`.closeable`

```html
<span class="closeable"></span>
```

圆形图标按钮（SVG 走 `mask-image`，颜色随 `currentColor`），自带 hover / active 反馈。常与 `auto-card-header`、`auto-alert .title` 搭配。

## 工具类

| 类名 | 效果 |
| --- | --- |
| `.auto-border` | `border: var(--auto-border)` |
| `.auto-radius` | `border-radius: var(--auto-border-radius)` |
| `.auto-shadow` | `box-shadow: var(--auto-shadow)` |
| `.auto-text` | 正文字体（`.colorized` 变体取面板标题色） |
| `.auto-title` | 标题字体 |
| `.auto-disabled` | 禁用观感 |
| `.auto-selected` | 选中观感（主色底 + 白字） |

## 其它

| 资产 | 说明 |
| --- | --- |
| `.autospark-container > .popup` | 下拉 / 气泡 / 对话框内容容器（边框 + 阴影 + 圆角 + 面板底色） |
| `.loading` | 旋转动画（`spin` 2s 线性无限） |
| `--auto-icon-{alert,info,success,warning,error,focus}` | 内置 SVG 图标（data URI），可直接 `mask-image` 使用 |

## 引入哪些文件

| 文件 | 内容 | 是否在聚合入口 `index.css` 中 |
| --- | --- | --- |
| `styles/reset.less` | 基础 reset | ✅ |
| `styles/animates.less` | 关键帧动画 | ✅ |
| `styles/utils.less` | 工具类 | ✅ |
| `styles/colors.less` | 灰阶常量 | ✅ |
| `styles/components.less` | `.autospark-container` | ✅ |
| `styles/icons.less` | 图标 data URI | ✅ |
| `styles/input.less` | Firefox 焦点框微调 | ❌ 需单独引 |
| `components/*.less` | 卡片 / 按钮 / 提示 / 关闭符 / 输入控件 | ❌ 需单独引 |

```js
import "../src/styles/index.less";
import "../src/styles/input.less";
import "../src/components/index.less";
```

::: tip 层叠顺序
静态层的样式应在运行时注入的变量**之前**加载（示例页把控制面板的 `import` 放在样式导入之后，正是为此）。变量与静态规则不冲突，但让运行时注入的 `.auto-*` 变量规则位于其后，层叠上更稳。
:::

---

下一步：[持久化与回访零闪](./persistence.md)。
