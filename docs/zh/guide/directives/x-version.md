# x-version 版本显隐

## 概述

版本显隐指令（[ADR-0119](https://github.com/zhangfisher/autospark/blob/main/packages/engine/docs/adr/0119-x-version-directive.md)）：`$.version`（[版本](../../guide/engine/version.md)全局元状态）的**声明式版本匹配糖**——`x-version="2"` 仅版本 2 可见、`x-version="<=3,=1,2"` 任一子句命中即可见、`x-version="/^2\./"` 正则匹配。

与 [x-show](./x-show.md) 的关系：x-version 内部订阅全局 `$.version` 判定，但显隐走**独立的类通道**（挂 `autospark-version-hidden` 类 = `display:none !important`），不碰 inline display——与 x-show 同元素组合时**版本隐藏恒胜**，x-show 的显隐 / 动画 / 用户 CSS 只在版本可见时有话语权。与 [x-if](./x-if.md)（条件存在性，摘 DOM）正交。

版本门控要写 `x-show="['1','2'].includes($.version)"`、比较语义（`<=3`、`!=2`）与正则匹配无法在表达式里简洁书写——本指令把「版本 → 显隐」收敛为一个属性声明，且 `$.version` 快速切换时即时显隐（版本切换预览场景）。

<demo html="version/basic.html"/>

::: tip 插件指令
`x-version` 由官方插件包 `@autospark/plugins` 提供（ADR-0128 核心集外移），使用前须加载插件脚本，且**先于 engine 实例化**：

```html
<script src="/autospark/autospark.js"></script>
<script src="/autospark/autospark.version.js"></script>
```

未加载插件时 `x-version` 属性会被编译器当作普通属性剥除，指令不生效。聚合产物 `autospark.plugins.js` 一个标签包含全部官方插件。
:::

## 快速入门

```html
<!-- 仅版本 2 可见 -->
<div x-version="2">v2 内容</div>

<!-- 多子句 OR：≤2 或 =3 或正则命中即可见 -->
<div x-version="<=2,3,/^1\./">多条件内容</div>

<!-- 非 2 可见 -->
<div x-version="!=2">非 v2 内容</div>
```

隐藏 = 挂 `autospark-version-hidden` 类（`display:none !important`），可见 = 摘类；对 `$.version` 赋值即可切换——纯响应式元状态写入，无校验、无导航（见[版本](../../guide/engine/version.md#切换版本)）。

## 指南

### 指令值：版本匹配表达式

值为**版本匹配表达式**（DSL）：逗号分隔子句、**任一子句命中即可见（OR）**；v1 无 AND——组合需求用嵌套元素表达。子句为 `[op]value` 字面形态或 `/pattern/flags` 正则形态：

| 算子 | 含义 | 示例 |
| --- | --- | --- |
| （裸值） | 等价于 `=` | `x-version="2"` |
| `=` | 相等 | `x-version="=2"` |
| `!=` | 不等 | `x-version="!=2"` |
| `<` `<=` `>` `>=` | 有序比较 | `x-version=">=2"` |

- **相等**：trim 后字符串全等；不等但两侧均可解析为有限数值时按数值相等兜底（容 `$.version` 被写成数字 `2`）；
- **有序比较**：两侧均可解析为有限数值 → 数值比较；两侧均为点分数字段（如 `2.1.3`）→ 逐段数值比较、短段补零（semver 风格，`2.1` ≥ `2.1.0` 成立）；其余不可比 → 该子句 false；
- **正则**：`/pattern/flags` 斜杠定界（必须），解析期编译一次，对 `$.version` 原始字符串 test；正则子句内部逗号不分割（`/1,2/` 合法）；
- 子句与算子两侧均容忍空白：`x-version=" <= 2 , 3 "` 合法。

### 组合语义

x-version 与其他显隐/结构指令正交，可同元素组合：

```html
<!-- 组合：版本隐藏恒胜——x-show 只在版本 2 内有话语权 -->
<div x-version="2" x-show="expanded">…</div>
```

| 组合对象 | 规则 |
| --- | --- |
| [x-show](./x-show.md) | **版本隐藏恒胜**——`!important` 类压过 x-show 的 inline display、进出场动画与用户 CSS |
| [x-viewport](./x-viewport.md) | 两个类独立生效，任一命中即隐藏 |
| [x-if](./x-if.md) / x-for / x-switch | 正交可共存（本指令不占子树） |

本指令自身不参与动画编排（要动画用表达式形态 `x-show="$.version === '2'"`，继承 `x-show-options.animate`）。

<demo html="version/basic.html"/>

### 失效语义

| 场景 | 行为 |
| --- | --- |
| `x-version=""` / 缺值 | 静默忽略——有意的「不门控」声明，元素恒渲染，零告警 |
| `$.version` 为 undefined（版本未知） | 静默短路，元素恒渲染——版本未知时执行门控是语义错误（与 [x-viewport](./x-viewport.md) 的「失效恒可见」同向） |
| 非法子句（悬空运算符、未闭合正则、纯运算符、非法 pattern/flags） | warn 一次 + **指令整体忽略**（恒渲染）——手写短串 fail-fast，宽松跳过会吞掉 `"<3"` 误写 `"<=3"` 一类错误 |
| 空白子句 | 静默跳过——`x-version="2, ,3"` 中 `2` / `3` 照常生效 |

## 配置选项

无配置项——`!=` 与正则已覆盖反向语义，无 `x-version-options`。`$.version` 的初值由引擎级 `options.version` 预置、`versions` 清单在构造期归一（见[版本](../../guide/engine/version.md)）。

## 注意事项

- **版本隐藏恒胜**：`!important` 类无法被用户 CSS 覆盖——这是"版本显隐"的语义强度（与 x-viewport 同款取舍）；需要可覆盖的隐藏用 x-show 表达式形态。
- **无动画**：切类不经 animate 编排；需要进出场动画用 `x-show="$.version === '2'"` 表达式形态。
- **宿主永留 DOM**：隐藏只是 `display:none`——子树仍渲染、watcher 仍存活、表单仍提交；要存在性（摘 DOM 省渲染）用 `x-if="$.version === '2'"`。
- **失效即恒渲染**：`$.version` 未知时元素不会被隐藏（零告警）——依赖版本隐藏的关键内容不要假设版本未知场景下仍会隐藏。
- **不校验清单**：本指令对任意 `$.version` 值求值——清单校验只发生在构造期归一（`versions` 非空时），运行时赋任意字符串都生效。
- **与 `$.version` 的分工**：本指令只做"版本 → 显隐"映射；需要把版本用于非显隐逻辑（换 class、拼 URL）直接订阅 `$.version`。
