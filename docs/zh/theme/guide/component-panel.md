# 组件变量 · 面板

## 概述

面板类变量把「容器」拆成四件可复用的东西：**背景层次**、**边框**、**圆角**、**阴影**；
标题栏再额外消费一组「头部」变量（字体 / 颜色 / 背景）。

```css
.my-panel {
    background: var(--auto-panel-bgcolor);
    border: var(--auto-border);
    border-radius: var(--auto-border-radius);
    box-shadow: var(--auto-shadow);
    padding: var(--auto-padding);
}
```

<demo html="theme/component-panel.html"/>

## 指南

### 变量清单

| 变量 | 用途 |
| --- | --- |
| `--auto-panel-bgcolor` | 面板 / 区块 / Drawer 背景 |
| `--auto-panel-header-bgcolor` | 标题栏 / 标签页头背景 |
| `--auto-panel-header` | 标题栏字体（速写） |
| `--auto-panel-header-color` | 标题栏文字色 |
| `--auto-bgcolor` / `--auto-secondary-bgcolor` / `--auto-workspace-bgcolor` | 面板 / 次级 / 工作区背景（见[背景色](./color-background.md)） |
| `--auto-border` / `--auto-border-radius` / `--auto-shadow` / `--auto-padding` | 外框三件套 + 内距 |

### 四种容器形态

| 形态 | 组合 | 场景 |
| --- | --- | --- |
| 连通面板 | 头部背景 + 主体，上圆下圆分写 | 表单 / 设置面板 |
| 浮起卡片 | `--auto-shadow`，无边框 | 内容卡片 |
| 描边卡片 | `--auto-border`，无阴影 | 表格 / 内嵌分区 |
| 次级面板 | `--auto-secondary-bgcolor` | 分区 / 内嵌块 |

```css
/* 连通面板：头部与主体共用一组圆角 */
.panel-head {
    background: var(--auto-panel-header-bgcolor);
    font: var(--auto-panel-header);
    border-radius: var(--auto-border-radius) var(--auto-border-radius) 0 0;
}
.panel-body {
    background: var(--auto-panel-bgcolor);
    border: var(--auto-border);
    border-top: none;
    border-radius: 0 0 var(--auto-border-radius) var(--auto-border-radius);
}
```

### 内置 `.auto-card`

```html
<div class="auto-card border">
    <div class="auto-card-header">
        <span class="auto-card-title">卡片标题</span>
        <span class="closeable"></span>
    </div>
    <div class="auto-card-body">内容</div>
    <div class="auto-card-footer">
        <button class="auto-btn primary">保存</button>
    </div>
</div>
```

- 默认无边框（浮起靠阴影），加 `border` 类显示边框；
- `auto-card-header` 背景取 `--auto-panel-header-bgcolor`；`auto-card-body` 无 footer 时自动补下方圆角；
- `auto-card-footer` 上边框分隔，按钮自动靠右；标题栏里的 `.closeable` 自动靠右。

### 四种颜色模式下的面板

面板变量全部引用派生层，因此四种颜色模式、任意主题色、任意尺寸档位下都自动成立。
Demo 页给出四模式并排对照与「紧凑 / 宽松」两套档位组合。

---

下一步：[组件变量 · 表单](./component-form.md)。
