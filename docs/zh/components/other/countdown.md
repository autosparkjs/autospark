# Countdown 倒计时

## 概述

Countdown 是 AutoSpark 的官方倒计时组件（组件库 P4 **other 分类**，ADR-0018 清单权威表 other 行 / ADR-0031）：秒杀场次、验证码重发、活动截止等时间衰减场景的动态展示件。

- **语域**：`time` 毫秒时长（变化即重启新一轮——重发 / 补货一行接线）；绝对时刻场景经表达式 `:time="deadline - Date.now()"` 表达；
- **计时引擎**：递归 setTimeout + **绝对 deadline 真值**——tick 只触发重渲染不累积误差、整秒边界对齐（走秒无相位漂移、`finish` 在截止时刻精确触发）、后台标签页节流免疫（回页即正确，`visibilitychange` 仅补一次重算 / 补发）；
- **format 模板**：`{d}{h}{m}{s}` token 替换（缺省 `{h}:{m}:{s}` 时:分:秒观感）——含 `{d}` 时 `{h}` 为日内余时、不含时为总小时（antd 同款语义）；
- **排版**：复用 statistic 数值排版语言——`tabular-nums` 等宽数字（走秒不跳宽）+ 1.5em 大字重 + em 基准随 `data-size` 档位全跟随。

与 **statistic** 的边界：statistic 是静态数值展示（Intl 语言环境格式化，值由调用方给）；countdown 是时间衰减动态组件（内部驱动、随时间自走）——两者正交（ADR-0024 statistic 边界声明的承接）。

引入方式：引擎之后加载 `<script src="/autospark/autospark.countdown.js"></script>`（自举注册），或聚合产物 `autospark.plugins.js`。

## 快速入门

```html
<script src="autospark.js"></script>
<script src="/autospark/autospark.countdown.js"></script>

<!-- 元素名写法：90 秒倒计时（缺省 时:分:秒） -->
<x-countdown :time="90000"></x-countdown>

<!-- 自定义模板 + finish 事件 -->
<x-countdown :time="code" format="{m} 分 {s} 秒后可重发" @finish="sent = true"></x-countdown>
```

`time` / `format` 经元素名写法的 `:属性` / 静态属性注入（等价于 `x-component:autospark.countdown` 值对象形态）。

<demo html="components/other/countdown/basic.html"/>

## 指南

### 时长（time）

**类型**: `number`（毫秒）
**默认**: `0`

倒计时总时长。`time` 变化即**重启新一轮**（deadline 重算——验证码重发、秒杀补货场景直接改状态即可）；`time=0` 为合法边界：即刻归零并派发 `finish`。

绝对时刻场景（固定截止时间点）经表达式换算：

```html
<x-countdown :time="deadline - Date.now()" format="{h}:{m}:{s}"></x-countdown>
```

### 格式模板（format）

**类型**: `string`
**默认**: `"{h}:{m}:{s}"`

token 替换模板，token 与任意文本混排自由组合：

| token | 语义 | 补零 |
|---|---|---|
| `{d}` | 天 | 不补零 |
| `{h}` | 含 `{d}` 时为日内余时（0-23）；不含时为总小时（可超 24） | 两位 |
| `{m}` | 分（0-59） | 两位 |
| `{s}` | 秒（0-59） | 两位 |

显示取整为 `Math.ceil`（剩 59.95s 显示 60 秒——倒计时直觉：不足 1 秒按 1 秒计）；归零后渲染全零（`00:00:00`）。

注意：`{m}` / `{s}` 恒为**位段值**（0-59，与其他 token 组合成时分秒序列）——整段倒计时展示（如验证码「xx 秒后可重发」）应使用 `{m} 分 {s} 秒` 组合而非单 `{s}`（60 秒的 `{s}` 位段是 `00`）。

<demo html="components/other/countdown/format.html"/>

### 事件（finish）

**参数**: detail 空

倒计时归零时**一次性**派发（冒泡；防重发标志守卫——tick 与回页补触发双通道只发一次）。`onFinish` 语义经事件承载：

```html
<x-countdown :time="5000" @finish="alert('时间到')"></x-countdown>
```

### 计时精度与后台节流

真值恒为 `deadline - Date.now()`（tick 只是重渲染触发器）——误差不累积；后台标签页定时器被浏览器节流（1s → 1min）只影响刷新频率不影响正确性：回页瞬间即显示正确剩余（`visibilitychange` 监听做一次即时重算，已过期则立即补发 `finish`）。**无须显式暂停逻辑**。

组件销毁（`unmounted`）时定时器与 document 监听自动清理。

### 主题化

数值区颜色 / 字号走 `--auto-*` 语义变量三级回退（theme 在场自动跟随档位与暗色）；字号以 em 标定（1.5em）随 `data-size` 档位全跟随（autospark.base 继承）。覆盖通道：`--asc-countdown-*`（`value-color` / `font-size` 等）。

### 边界披露

- 毫秒级 token（`{ms}`）与自定义走秒间隔不做——秒级粒度是首版语域边界（毫秒级倒计时场景罕见，需要时增补）；
- 无插槽、无受控值通道（纯展示 + 单向 finish 事件）。

## 参考

### 属性

| 属性 | 类型 | 默认 | 说明 |
|---|---|---|---|
| time | `number` | `0` | 倒计时总时长（毫秒）；变化即重启新一轮；0 即刻归零 + finish |
| format | `string` | `"{h}:{m}:{s}"` | token 模板（{d}{h}{m}{s}；含 {d} 时 {h} 为日内余时、不含时为总小时） |

### 事件

| 事件 | 参数 | 说明 |
|---|---|---|
| finish | — | 归零一次性派发（冒泡，防重发） |

### Slots

| 插槽 | 说明 |
|---|---|
| — | 无插槽（纯展示件——前后缀场景经外层模板自组或组合 statistic） |
