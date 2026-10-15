# 组件变量

## 概述

「组件变量」是派生层按**组件类型**重新分组后的视角：颜色与尺寸要素提供原料，
组件类（`.auto-card` / `.auto-btn` / `.auto-input` / `.auto-alert`）与业务自定义组件消费同一批变量。

| 小节 | 内容 | 主要变量 |
| --- | --- | --- |
| [段落](./component-paragraph.md) | 行高 / 字距 / 字体速写 | `--auto-line-height`、`--auto-letter-spacing`、`--auto-font` |
| [面板](./component-panel.md) | 容器：背景 / 边框 / 圆角 / 阴影 / 标题栏 | `--auto-panel-*`、`--auto-border`、`--auto-shadow` |
| [表单](./component-form.md) | 输入控件双形态 | `--auto-input-*` |
| [交互反馈](./component-feedback.md) | 悬停 / 按下 / 选中 / 禁用 | `--auto-{hover,active,selected,disable}-*` |

<demo html="theme/component-panel.html"/>

## 指南

### 内置组件类清单

静态样式层提供一组**类名即组件**的外观资产，全部只消费 `--auto-*`，因此随主题实时变化。

| 类名 | 说明 |
| --- | --- |
| `.auto-card` + `-header` / `-title` / `-body` / `-footer` | 卡片（默认无边框靠阴影浮起，加 `border` 类显示边框） |
| `.auto-btn` | 按钮（尺寸 / 形状 / 语义变体，见下） |
| `.auto-input` + `.auto-input-action` | 输入控件（单类双形态，见[表单](./component-form.md)） |
| `.auto-alert` | 提示块（`.title` / `.description` / `.closeable`） |
| `.closeable` | 关闭符（SVG mask 图标按钮） |
| `.auto-border` / `.auto-radius` / `.auto-shadow` | 工具类：一条声明引用对应派生值 |
| `.auto-text` / `.auto-title` / `.auto-disabled` / `.auto-selected` | 工具类：排版与状态观感 |
| `.autospark-container > .popup` | 下拉 / 气泡 / 对话框内容容器 |
| `.loading` | 旋转动画 |
| `--auto-icon-{alert,info,success,warning,error,focus}` | 内置 SVG 图标（data URI，可直接 `mask-image`） |

### 按钮变体

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

语义变体的底色来自 `--auto-primary-color` 或 `--x-color-{name}`，因此随主题色与模式变化。

### 完整示例

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

### 自定义组件怎么接

```css
/* 只消费派生层，就自动获得主题 / 模式 / 色彩 / 尺寸四种联动 */
.my-widget {
    background: var(--auto-bgcolor);
    color: var(--auto-color);
    border: var(--auto-border);
    border-radius: var(--auto-border-radius);
    box-shadow: var(--auto-shadow);
    padding: var(--auto-padding);
    font: var(--auto-font);
}
```

::: warning 组件层的暗色规则是字面量
`alert.less` 里针对 `[dark]` / `[data-dark]` 的暗色变体是**写死的** `color-mix` 规则（已为 `data-light` 补对偶反规则），
不随变量走。更深的嵌套矛盾（亮元素里再套暗元素）组件层兜不住，请改用变量层表达。
:::

---

下一步：[组件变量 · 段落](./component-paragraph.md)。
