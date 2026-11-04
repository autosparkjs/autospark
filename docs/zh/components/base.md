# Base 基类组件

> ADR-0134。`autospark.base` 是 **engine 内置的抽象基组件**（`x-define.abstract`）——所有官方组件均继承它，为组件族统一提供**主题档位 props** 的宿主属性物化行为。它**不可直接实例化**、不贡献模板，仅可被 `x-define:inherit="autospark.base"` 继承。本文面向**组件开发者**；终端用户的主题档位用法见各组件文档（如 [Button · 主题档位](./button.md#主题档位)）。

## 概述

组件消费 `--auto-*` 语义变量即可自动响应主题（ADR-0129 三级回退链）；`autospark.base` 在此之上补齐**局部覆盖**通道——把六个主题档位 props 物化为宿主化身根上的 `data-*` 属性，接通 [@autospark/theme](../guide/theme/) 的手动通道 CSS（根域裸 `[data-size]` / `[data-dark]` 等属性选择器直接覆盖 `--auto-*` 变量、子树继承），形成**局部主题**。

```text
props(data-size="small")
  → base.mounted 物化 data-size="small" 到化身根
    → theme 手动通道 CSS：[data-size="small"] { --auto-font-size: …; --auto-padding: … }
      → 组件样式 var(--auto-font-size, var(--asc-<name>-font-size, 兜底值))
        → 局部档位覆盖祖先 scope 的全局档位
```

**零依赖 theme 代码**：base 只做 DOM 属性写入——theme 在场时 CSS 命中、不在场时属性静默无效（组件吃校准兜底值，同 x-ripple「未加载静默跳过」惯例）。

## 组件开发者：继承它

```html
<button class="asc-xxx" x-define="autospark.xxx" x-define:inherit="autospark.base">
  <!-- 模板/样式/script 原样；六个主题档位 props 与物化行为经继承自动获得 -->
</button>
```

- **不要**在自己的 `data()` 里声明这六键（子胜会静默击穿主题通道）；裸名 `size` / `dark` 等留给组件自有语义；
- **不要**在组件内部用这六个属性名做自有变体（theme 在场时会被档位块意外命中）；
- base 内置 engine——组件插件产物只依赖 engine，无额外引入成本。

## 主题档位 props（六键，名即通道）

props 键名 = 物化的 DOM 属性名（零映射表）。JS 侧访问连字符键须 `this.data["data-size"]`。

| 键 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `data-size` | `ThemeSize` | `""` | 字号/图标等尺寸档（缺省继承祖先 scope 档位） |
| `data-shadow` | `ThemeSize` | `""` | 阴影档 |
| `data-radius` | `ThemeSize` | `""` | 圆角档 |
| `data-spacing` | `ThemeSize` | `""` | 内外间距/行高密度档 |
| `data-dark` | `boolean` | `false` | 局部暗色语境（`true` 写存在性属性） |
| `data-colorized` | `boolean` | `false` | 局部多彩语境 |

`ThemeSize = none | x-small | small | medium | large | x-large`（透传不校验——theme 是唯一真值源）。

## 消费通道选型（三层）

| 通道 | 写法 | 响应式 | 适用 |
| --- | --- | --- | --- |
| 静态散属性 | `<x-button data-size="small">` | ✗（静态） | 固定档位——theme CSS 直通（不经 props） |
| 指令形态 props | `<button x-component:autospark.button="{ 'data-dark': flag }">` | ✓ | 动态档位——消费方上下文求值 → props 注入 → 物化 |
| 全局状态绑定 | `:data-dark="globalFlag"`（flag 为全局 state） | ✓ | bind 直写（化身根绑定以组件实例上下文求值，仅全局 state 可见） |

⚠️ 宿主化身根上的 `@click` / `:data-*` 以**组件实例上下文**求值——封闭数据边界（ADR-0053）下消费方 `x-data` 局部域不可见：事件绑组件外层元素，动态档位走指令形态 props 或全局状态。

## 不包含的维度

- `theme`（换主题色）：theme 无 `[data-theme]` 手动通道，局部换色用 `ThemeManager.scope()`；
- `border`：无手动通道，透传无效不如不做。
