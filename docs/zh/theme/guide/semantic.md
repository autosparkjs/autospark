# 语义色

## 概述

**语义色（semantic color）** 是操作结果的语言：`primary`（品牌 / 主操作）、`success`、`warning`、`danger`、`info`。它们的值不是「一个颜色」，而是**梯度种子**——库里会展开成同系 10 阶标尺，亮色直引种子原值、暗色提亮引用浅档（`ADR-0002`）。

## 快速入门

```js
themeManager.update({ danger: "#ff4d4f", success: "#00b96b" });
```

```html
<div class="auto-alert danger">
    <div class="title">删除失败</div>
    <div class="description">颜色来自语义色 danger。</div>
</div>
```

## 指南

### 五个语义色与默认值

| 语义色 | 默认值 | 说明 |
| --- | --- | --- |
| `primary` | `var(--auto-theme-color)` | 默认**跟随主题色**（`var()` 引用，见下方豁免规则） |
| `success` | `#22c55e` | 成功 |
| `warning` | `#f59e0b` | 警告 |
| `danger` | `#ef4444` | 危险 / 错误（组件类里 `error` 是它的别名） |
| `info` | `#71717a` | 中性信息（`auto-alert` 的默认变体） |

### 梯度种子：值会被展开成 10 阶标尺

对一个可解析的颜色字面量，库里生成：

```css
/* 标尺：0 最浅 → 9 最深（与 palette.less 色系惯例同向，不随模式反转） */
--x-color-success-0 … --x-color-success-9

/* 亮色：直引种子原值（与固定 hex 时代零差异） */
--x-color-success: #22c55e;

/* 暗色：提亮引用第 3 档 */
--x-color-success: var(--x-color-success-3) !important;
```

设计依据：深底上语义色应当**提亮**而不是「混透明变暗」——旧方案（`color-mix(transparent 60%)`）对面板底的对比度只有 1.6~2.2:1，连图形线 3:1 都不到；改梯度种子后实测 4.67~10.93:1。

::: warning 传品牌基准色，不要传调浅色
语义色的含义从「一个颜色值」变成「一个梯度种子」。自定义时应传**品牌基准色**（如 `#ef4444`），而不是已经调浅的颜色——后者会被当成新种子再展开，暗色下会偏得更多。
:::

### `var()` 引用豁免梯度化

不可解析为颜色字面量的种子（`var(...)` 引用）会被豁免：只注入原值，**不生成标尺、也没有暗色覆盖**。

```js
// 默认值即此情形：primary 跟随主题色，其暗色适配由主题标尺提档（theme-5 → theme-6）承担
primary: "var(--auto-theme-color)";
```

判定规则：种子能被解析为颜色字面量（`#hex` / `rgb()` / 命名色）才生成梯度，否则走豁免通道。所以「把 primary 设成 `var(--...)`」与「设成 hex」是两条不同的实现路径，但视觉上都跟随主题。

### 覆盖方式：构造时 vs 运行时

```js
// 1. 构造作用域时
const scope = themeManager.addScope({
    id: "report",
    primary: "#722ed1",
    danger: "#ff4d4f",
});

// 2. 运行时（只重注入语义色块，不动主题标尺）
themeManager.update({ warning: "#faad14" });

// 3. 局部作用域运行时
themeManager.scopes.report.update({ info: "#13c2c2" });
```

`update()` 对语义色的处理是以 `Object.assign` 合并进 `options` 后**重新生成语义色样式块**（样式标签 id 为 `autospark-{id}-semantics`）；语义色与调色板参数属于**宿主级定制**，不进参数持久化。

### 生成的 CSS 结构

```css
/* 1) 标尺块：作用域 + 后代（局部作用域会收敛，见作用域章节） */
[data-theme-scope='report'] {
    --x-color-danger-0: …; … --x-color-danger-9: …;
}

/* 2) 亮色块 */
[data-theme-scope='report'], [data-theme-scope='report'][data-light] {
    --x-color-primary: …; --x-color-danger: #ff4d4f; …
}

/* 3) 暗色块 */
[data-theme-scope='report'][dark], [data-theme-scope='report'][data-dark] {
    --x-color-danger: var(--x-color-danger-3) !important;
}
```

注意：`data-light` / `data-dark` 会追加到语义色的亮/暗块选择器上——**独立样式域也能看到语义色的模式差异**。

### 语义色的消费方

| 变量 | 消费场景 |
| --- | --- |
| `--auto-primary-color` | 主按钮底、复选框 / 单选框选中态、`accent-color`、滑块拇指 |
| `--auto-success-color` / `--auto-danger-color` / `--auto-warning-color` / `--auto-info-color` | `.auto-alert` 的变体、业务状态色 |

```css
/* 自己的组件也可以直接引用 */
.my-badge {
    color: var(--auto-danger-color);
    border: 1px solid var(--x-color-danger-6);
}
```

### 对比度验收 {#contrast-check}

改变语义色后建议跑一次校准脚本（与 `src/vars` 变量**同源**，变量一改脚本自动跟随）：

```bash
cd packages/theme && bun scripts/check-dark-contrast.ts
```

26 项检查覆盖正文 / 次要文字 / 主色 / 语义色 / 交互态 / 边框 / 禁用态在亮暗与多彩矩阵下的表现，任一 FAIL 退出码为 1。

`blue` 主题的实测基准（作为参照）：

| 项 | 数值 |
| --- | --- |
| 正文 / 次要文字 | 13.55 / 11.73 |
| 主色（暗色 theme-6） | 6.99 |
| 语义色（暗色） | 4.67 ~ 10.93 |
| 交互态 | hover 1.34、selected 1.42（相对亮色基准 +14.5%，感知对称） |
| 边框（暗色） | 1.92 |
| 多彩暗底 | 正文 5.57 / 次要 4.53 |

::: warning 已知遗留：亮色侧的语义色受限
亮色下部分语义色（黄绿 / 黄色系）在白底上物理受限：亮色语义色约 2.03 ~ 4.58:1、亮色主色约 2.81:1，**未达 AA**。这是本轮范围约定（不改亮色视觉）下的已知遗留，若需达标可把对应档位整体加深 1~2 档，代价是亮色视觉变化。
:::

---

下一步：[显示模式与色彩维度](./mode.md)。
