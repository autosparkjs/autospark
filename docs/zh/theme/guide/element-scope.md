# 元素域

## 概述

除了「作用域」（`ThemeScope`，一套完整主题参数 + 边界）之外，还有一层更轻的机制：
**任意元素裸挂 `data-*` 属性**即可局部启用某个样式域——不需要建作用域、不进持久化。

```html
<div data-dark>这块独立暗色</div>
<div data-size="x-small" data-radius="none">这块局部换档</div>
```

<demo html="theme/element-scope.html"/>

## 指南

### 属性总表

| 维度 | 属性 | 效果 |
| --- | --- | --- |
| 模式 | `data-dark` / `data-light` | 暗色 / 亮色（含 `color-scheme`，原生控件一并切换） |
| 色彩 | `data-colorized` / `data-uncolored` | 多彩 / 回灰（模式随语境） |
| 规模 | `data-size` / `data-radius` / `data-spacing` / `data-shadow` | 字号体系 / 圆角 / 间距 / 阴影换档 |

### 维度正交、可叠加

```html
<div data-dark data-size="x-small" data-radius="x-large">暗色 + 小字号 + 大圆角</div>
```

四类维度分属不同样式域，同元素叠加时各自生效、互不覆盖：

- **模式域**与**色彩域**要同时生效须**同元素**（模式切换会把色彩重置为灰）；
- **规模域**（四个尺寸档位）与模式 / 色彩无关，可任意组合；
- 组合时「谁的块后生成谁胜出」有明确顺序，见[多彩模式 · 实现基础](./color-colorized.md#实现基础别名层)。

### 与 JS 通道的分工

| 通道 | 载体 | 适用 |
| --- | --- | --- |
| **JS setter** | 作用域元素上的 `dark` / `colorized` / `data-size` 等 | 作用域整体切换，参与参数持久化 |
| **元素域** | 任意元素上的 `data-*` | 元素级局部开关，不进持久化 |

```js
themeManager.dark = true; // 写 root 元素的 dark 属性
document.querySelector(".preview").dataset.dark = ""; // 元素域：只影响这一个元素
```

两者长期并存、互不干扰。

### 作用域内的收敛

元素域属性在**局部作用域**内会被收敛：局部作用域的替选择器是「自身 + 后代」两式
（`S[data-X]` / `S [data-X]`），把命中约束在本作用域子树内。

**为什么必须收敛**：自定义属性继承的是**解析后的值**——裸属性若全局命中，作用域内的元素会错拿别的作用域的字面量梯度。
root 作用域则保持裸属性追加（它的子树就是文档，裸命中即正确）。

### 已知限制

| 限制 | 说明 |
| --- | --- |
| 叠加要求同元素 | `data-dark` 的父元素 + `data-colorized` 的子元素**不**命中叠加块，子元素会取亮语境的多彩映射 |
| 不带 `data-` 的裸 `dark` / `colorized` | 只命中叠加块、不命中普通暗色 / 多彩块——日常请统一用 `data-*` 或 setter |
| 组件层的字面量规则 | `alert.less` 等组件里的暗色规则是写死的 `color-mix`，更深的嵌套矛盾请走变量层 |

---

下一步：[局部主题](./local-scope.md)。
