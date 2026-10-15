# 组件变量 · 段落

## 概述

段落类变量服务于**大段文本的阅读密度**：行高与字距两档基础量，经派生量供组件消费，
并被 `--auto-font` 速写一并聚合。

```css
p {
    font: var(--auto-font);
    line-height: var(--auto-line-height);
    letter-spacing: var(--auto-letter-spacing);
}
```

<demo html="theme/paragraph-overview.html"/>

## 指南

### 行高与字距

| 变量 | 说明 |
| --- | --- |
| `--x-line-height-*` | 行高五档，以 `--x-spacing-medium` 为基准计算 |
| `--x-letter-spacing-*` | 字距五档，同样以 `--x-spacing-medium` 为基准 |
| `--auto-line-height` | 当前档位的行高（随 `data-size` 联动） |
| `--auto-letter-spacing` | 当前档位的字距（随 `data-size` 联动） |

| 档 | 行高配方 | 字距配方 |
| --- | --- | --- |
| `x-small` | `--x-spacing-medium × 1.5` | `× 0.02` |
| `small` | `× 1.7` | `× 0.04` |
| `medium` | `× 1.9` | `× 0.06` |
| `large` | `× 2.1` | `× 0.08` |
| `x-large` | `× 2.3` | `× 0.1` |

<demo html="theme/paragraph-metrics.html"/>

### 消费派生量 vs 写死基础量

```css
/* ✅ 随全局档位联动 */
font: var(--auto-font);
line-height: var(--auto-line-height);

/* ❌ 永远停在 medium 档 */
font-size: var(--x-font-size-medium);
line-height: var(--x-line-height-medium);
```

两段初始观感在默认档下相同——切档（`x-small` / `x-large`）才暴露差异。这是排查「段落不跟着变」的第一个检查点。

<demo html="theme/paragraph-auto.html"/>

### 与间距的关系

行高与字距都以 `--x-spacing-medium` 为基准，因此[间距](./spacing.md)梯度是排版的底层标尺：
改间距梯度会同时影响段落的呼吸感。

### 典型用法：内容层级

```html
<div class="notice">
    <div class="notice-title">构建任务完成</div>
    <!-- 标题：主文字色 + 标题字体 -->
    <div class="notice-body">产物已发布，回归用例全部通过。</div>
    <!-- 正文：次要文字色 + 段落派生量 -->
    <div class="notice-time">3 分钟前</div>
    <!-- 时间戳：辅助文字色 -->
</div>
```

```css
.notice-title {
    color: var(--auto-color);
    font: var(--auto-title-font);
}
.notice-body {
    color: var(--auto-secondary-color);
    line-height: var(--auto-line-height);
    letter-spacing: var(--auto-letter-spacing);
}
.notice-time {
    color: var(--auto-third-color);
}
```

<demo html="theme/paragraph-usage.html"/>

---

下一步：[组件变量 · 面板](./component-panel.md)。
