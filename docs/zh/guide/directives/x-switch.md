# 分支选择

## 概述

`x-switch` 按**主表达式的值**在多个候选分支中**切换显示其一**——各分支条件是「同一个表达式的不同取值」时（状态机、tab、level 分档），比串联多个 `x-else-if="status === 'a'"` 更直白：主表达式只写一次、只求值一次，比较意图一目了然。

```html
<div x-switch="order.state">
    <div x-case="paid">✅ 已支付</div>
    <div x-case="pending">⏳ 待支付</div>
    <div x-case="refunded">↩️ 已退款</div>
    <div x-default>未知状态</div>
</div>
```

::: tip 与 x-if 分支链的分工
[x-if + x-else-if](./x-if.md#条件分支链-x-else-if-x-else) 答「**哪个条件真**」——每个分支是独立布尔表达式，条件可以各不相同；`x-switch` 答「**这个值是什么**」——一个判别表达式对多个字面量。判别场景用 `x-switch`，异构条件用 `x-if` 链。
:::

## 快速入门

<demo html="switch/basic.html"/>

```html
<div x-switch="order.state">
    <div x-case="paid" class="notification is-primary">订单已支付</div>
    <div x-case="pending" class="notification is-info">待支付</div>
    <div x-default class="notification is-danger">未知状态：{{ order.state }}</div>
</div>
```

`x-switch` 宿主的**直接子元素**中，带 `x-case`（匹配分支）或裸 `x-default`（兜底）者构成分支表；其余子元素不会渲染（编译期 warn）。**宿主自身永不渲染**——命中的分支作为**独立元素插到宿主原位**（与 x-else-if 分支的渲染机制完全同构）。

## 指南

### case 值是字面量，不是表达式

`x-case` 的值经 relaxed-json 解析为**字面量**，编译期定死、零订阅开销：

| 写法                 | 匹配目标                       |
| -------------------- | ------------------------------ |
| `x-case="paid"`      | 字符串 `"paid"`（裸词即字符串）|
| `x-case="'paid'"`    | 同上（引号可省）               |
| `x-case="1"`         | 数字 `1`                       |
| `x-case="true"`      | 布尔 `true`                    |
| `x-case="null"`      | `null`                         |
| `x-case="NaN"`       | `NaN`（特判识别）              |
| `x-case="[1, 2, 3]"` | 多值数组——命中**任一**即可     |

<demo html="switch/multi.html"/>

主表达式与 case 字面量做 **SameValueZero** 比较（`NaN` 可匹配、`+0/-0` 相等；多值数组按 `includes` 同语义）。主值为**对象/数组**时退化为引用比较——字面量分支永不匹配，落 `x-default` 或空态（`x-switch` 只对原始值有意义）。

需要**动态比较**（case 值须读状态）时，那不是 `x-switch` 的场景——用 [x-if 分支链](./x-if.md#条件分支链-x-else-if-x-else)。

### default 兜底：位置无关

全部分支都不匹配时落 `x-default`——**书写位置不影响结果**（先扫 case，全不中才落 default，与 JS `switch` 一致）：

```html
<div x-switch="v">
    <div x-default>兜底写在前面也可以</div>
    <div x-case="a">A 依然可命中</div>
</div>
```

无匹配且无 `x-default` → 皆不渲染（宿主原位仅锚点注释占位）。多个 `x-default` → warn，取第一个。

### eager / keepalive 两态

与 x-if 家族对称：

- **eager（默认）**：分支切换**销毁重建**（scope 与 watcher 销毁），切回状态重置；
- **keepalive（`.keepalive`）**：**每分支独立保活**——渲染过的分支 detach 留存，切回**同一元素** reattach，输入等运行态保留：

<demo html="switch/keepalive.html"/>

```html
<div x-switch.keepalive="tab">
    <div x-case="basic"><input placeholder="姓名" /></div>
    <div x-case="contact"><input placeholder="邮箱" /></div>
</div>
```

tab 页签正是 keepalive 的高价值场景——表单切走再切回，输入不丢。

### 进出场动画

`animate` 指令选项让分支切换播转场动画——**新旧分支同场共演**（旧分支离场 + 新分支进场同时进行）。默认共演下两个分支短暂**同处文档流**，容器高度短暂 = 两者之和（**有高度跳动**）；给包裹层加 grid 同格叠放即得平滑 cross-fade：

<demo html="switch/animate.html"/>

```html
<style>
    /* 平滑方案：grid 同格叠放——新旧分支重叠（cross-fade）而非堆叠，等高分支完全无跳动 */
    .tab-stack { display: grid; }
    .tab-stack > * { grid-area: 1/1; margin: 0; }
</style>

<div class="tab-stack">
    <div x-switch="tab" x-switch-options="{animate:'fade'}">
        <div x-case="list">📋 列表页</div>
        <div x-case="form">📝 表单页</div>
    </div>
</div>
```

**tabs 变体：左右滑动（坐标衔接）**——自定义 `sx` 动画：新页从 `+100%` 滑入、旧页向 `-100%` 滑出、**不动画 opacity**——同一缓动曲线下任意时刻**旧面板右缘 == 新面板左缘**，两面板如同一整条连续滑动（carousel 效果，需容器 `overflow: hidden` 裁剪越出部分）；`.keepalive` 保活各 tab 内容（表单切回不丢）：

```html
<style>
    .sx-enter-active,
    .sx-leave-active {
        transition: transform 0.3s ease;
    }
    .sx-enter-from {
        transform: translateX(100%); /* 新页从右侧整宽滑入 */
    }
    .sx-leave-to {
        transform: translateX(-100%); /* 旧页向左侧整宽滑出 */
    }
    /* 同格叠放 + 裁剪：两面板同格重叠，越出容器的部分被裁剪 */
    .tab-stack { display: grid; overflow: hidden; }
    .tab-stack > * { grid-area: 1/1; margin: 0; }
</style>

<div class="tab-stack">
    <div x-switch.keepalive="tab" x-switch-options="{animate:'sx'}">
        <div x-case="list">📋 列表页</div>
        <div x-case="form">📝 表单页</div>
    </div>
</div>
```

行为要点：

- **默认共演有高度跳动**（新旧分支同处文档流，高度短暂 = 两者之和）——平滑方案：**grid 同格叠放**（上面 CSS，新旧分支同格 cross-fade，等高分支完全平滑、不等高一步落定在较高者）或**离场绝对定位**（`.tab-stack .fade-leave-active { position: absolute; width: 100% }` + 包裹层 `relative`，即刻落在新分支高度），详见[动画 · 避免高度跳动](../animate.md#避免高度跳动)；
- **eager / keepalive 两态同权**；动画配置在宿主上声明、统一施于全部分支（无分支级差异）；
- **抢占**：切换动画播到一半值又变，在播动画立即取消、按新命中分支全新处理；
- 首次渲染静默，只有状态变化引起的分支切换才动画。

内置 `fade` / `slide` 开箱即用；对象与分相配置、自定义动画（六类名契约）见[动画](../animate.md)。

### 渲染位置

命中分支插到**宿主原位**（锚点位置）、完整编译执行——分支内的插值、指令、嵌套结构（含再嵌 x-switch / x-for）都正常工作。注意分支的**渲染层级是宿主的兄弟**（模板里书写在宿主内）——依赖 `.宿主 > .分支` 子选择器的 CSS 不会命中，请按宿主的父级书写（同 [x-else-if](./x-if.md#条件分支链-x-else-if-x-else)）。

### 书写规则（违规编译期 warn，不中断）

- 分支必须是 `x-switch` 宿主的**直接子元素**——隔层声明按孤儿丢弃（warn）；嵌套场景就近归属；
- `x-case` 缺值 → 按 `x-default` 兜底处理（warn）；
- `x-default` 带值 → 值被忽略（warn）；同元素 `x-case` + `x-default` → 按 `x-case` 处理（warn）；
- case 字面量非法（解析失败）→ 该分支跳过（warn）；
- 分支根可写普通指令（`:class` / `x-text` / `x-on`…随分支编译执行），但**不能写结构指令**（`x-for` / eager `x-if` / `x-isolate`——该分支被跳过，warn）；
- `x-switch` 缺少匹配表达式 → warn，不渲染任何分支。

### 与 x-for 的关系

- **eager 模式禁止与 `x-for` 同元素**（均占子树，编译期报错）——需要时用外层包裹，或 `x-switch.keepalive`（不占子树，可与 `x-for` 共存）；
- **x-switch 可以写在 x-for 项内**（判别 `item.xxx`），分支随项编译、就近归属。

## 配置

`x-switch` 的指令值是判别表达式（必填，支持相对表达式与 x-for 的 item 等局部变量）。下列配置项控制分支切换方式；带 ✅ 者可用修饰符方式启用。

| 配置项       | 默认值 | 修饰符 | 说明                                                                                      |
| ------------ | ------ | ------ | ----------------------------------------------------------------------------------------- |
| `.keepalive` | 未启用 | ✅     | 每分支独立保活（切回原元素 reattach，状态保留）；默认 eager 切换销毁/重建分支             |
| `animate`    | 无     |        | 分支进出场动画：字符串（`'fade'` / `'slide'` / 自定义名）/ 对象（name/duration/delay/easing）/ 分相（`enter` / `leave` 各自可配，`false` 单相禁用），见[动画](../animate.md) |

::: info 关于指令配置体系
指令选项 / 修饰符 / 宿主选项 / 两层回退见[指令配置](../directive.md#指令配置)。
:::

## 注意事项

- **宿主永不渲染**：与 x-if（真时展示宿主自身）不同，`x-switch` 宿主是纯声明容器——非分支子元素不会渲染（warn）；
- **仅原始值有意义**：主值为对象/数组时引用比较，字面量分支永不匹配——落 `x-default` 或空态；
- **分支不重复求值**：主表达式单 watcher 求值一次，case 字面量编译期定死（对比 x-if 链的 N 个表达式各一订阅）；
- **eager 频繁切换有成本**：每次切换销毁/重建分支子树与 watcher，频繁切换（tab 类）用 `.keepalive`；
- **渲染层级一跳差异**：分支渲染后是宿主的兄弟（书写在宿主内、渲染在宿主原位）。
