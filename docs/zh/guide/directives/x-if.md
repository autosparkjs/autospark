# 条件渲染

## 概述

`x-if` 根据表达式真假，控制元素的**存在性**：表达式为假时，**宿主元素本身离开 DOM**（detach），原位留一个锚点注释作书签；为真时再挂回。变的不只是显隐，而是**节点是否在 DOM 树中**。

```html
<div x-if="show">
    <p>条件为真时显示</p>
</div>
```

它有两种模式：**eager**（默认，真则编译子树、假则销毁子树）与 **keepalive**（假时仅摘除宿主、子树与 watcher 全部保留）。配套的 **`x-else-if` / `x-else`** 条件分支链支持多路条件（见[指南](#条件分支链-x-else-if-x-else)）。

::: tip 与 x-show 的区别
`x-show` 切**可见性**（假时 `display:none`，宿主永留 DOM，仍被表单提交/`querySelector` 命中）；`x-if` 切**存在性**（假时宿主离开 DOM）。两者是各自独立的指令，详见 [x-show](./x-show.md)。
:::

## 快速入门

<demo html="if/eager.html"/>

```html
<button @click="toggle">{{ show ? "隐藏" : "显示" }}详情</button>
<div x-if="show">
    <p class="card">详情内容</p>
</div>
```

## 指南

### eager 模式（默认）

默认 `x-if="expr"` 是**结构指令**：表达式为真时编译并挂载子树；为假时**摘除宿主**（detach，锚点注释占位）+ 移除子树 DOM + **销毁子 scope**（子树 watcher 一并 off）。

<demo html="if/eager.html"/>

```javascript
engine.state.show = false; // 宿主离开 DOM、子树移除、watcher 销毁
engine.state.show = true; // 宿主挂回、子树重新编译挂载、watcher 重建
```

宿主离开 DOM 意味着假时：不被 `querySelector` 命中、不占 `:nth-child` 计数位、不被 `<form>` 提交。

eager 适合「假时彻底卸载」的场景——省掉隐藏期间的订阅与渲染开销。

### keepalive 模式（x-if.keepalive）

`.keepalive` 修饰符假时同样**摘除宿主**（detach，锚点注释占位），但**子树与 watcher 全部保留**；真时**原宿主 reattach**（同一个元素实例，状态保留）：

<demo html="if/keepalive.html"/>

```html
<div x-if.keepalive="on">...</div>
```

keepalive 适合「假时要保留子树状态」的场景——隐藏期间 watcher 仍存活、继续 patch 到已 detach 的子树；重新挂回的是**同一个** DOM 实例（非 state 的 DOM 状态如焦点、滚动位置也一并保留）。

::: info eager 与 keepalive 的唯一差别
eager 假时**销毁子树**（真时重新编译重建）；keepalive 假时**保活子树**（真时原实例挂回）。两者假时都摘除宿主（detach），都不被表单提交/`querySelector` 命中。
:::

### 条件分支链（x-else-if / x-else）

x-if 宿主的**直接子元素**中带 `x-else-if="expr"`（带值分支）/ 裸 `x-else`（兜底）者构成多路条件链——整个 if/else 单元**自包含在一个元素内**，复制/移动这一个 div 即搬走完整条件逻辑：

<demo html="if/else.html"/>

```html
<div x-if="level >= 0">
    <div>then 内容（非分支的直接子元素）</div>
    <div x-else-if="level === -1">分支 1</div>
    <div x-else-if="level === -2">分支 2</div>
    <div x-else>兜底分支</div>
</div>
```

**求值语义**——主表达式假时按文档顺序求值各 `x-else-if` 表达式，**首个真者胜**；全假且有裸 `x-else` 走兜底；全假无兜底则皆不渲染（仅锚点注释占位）。任一表达式变化都会**从头重算整链**。分支表达式与主表达式同求值上下文（支持相对表达式、x-for 的 item 等局部变量）。

**渲染位置**：命中的分支作为**独立元素插到宿主原位**（锚点位置）、完整编译执行——分支内的插值、指令、嵌套结构都正常工作。注意分支的**渲染层级是宿主的兄弟**（模板里书写在宿主内），依赖子选择器的 CSS 请按宿主的父级书写。

**两模式对称**：

- eager（默认）：分支切换**销毁重建**（与 then 同权），切回分支状态重置；
- keepalive：**每分支独立保活**——渲染过的分支 detach 留存、切回原元素 reattach，输入等运行态保留：

<demo html="if/else-keepalive.html"/>

```html
<div x-if.keepalive="on">
    <div>主内容 <input /></div>
    <div x-else>兜底分支 <input /></div>
</div>
```

**书写规则**（违规编译期 warn，不中断）：

- 分支必须是 x-if 宿主的**直接子元素**——隔层声明（如包在中间 div 里）按孤儿丢弃；嵌套场景就近归属（分支内再嵌 x-if + 分支链，内层分支归内层宿主）；
- 裸 `x-else` 应放**最后**——其后仍声明分支则其后分支永不匹配（warn）；
- 分支根可写普通指令（`:class` / `x-text` / `x-on`…随分支编译执行），但**不能写结构指令**（`x-for` / eager `x-if` / `x-isolate`——该分支被跳过）。

### 与 x-for 的关系

- **eager 模式禁止与 `x-for` 同元素**（二者都要独占子树，语义冲突，编译期报错）。需要时用外层包裹，或改用 `x-show` / `x-if.keepalive`（均不占子树）。
- **keepalive 模式可与 `x-for` 共存**：`x-for` 独占子树做列表，`x-if.keepalive` 只切容器的存在性。

### 叶子元素

叶子元素（无子树，如 `<hr x-if>`、`<input x-if>`）两态等价——假时均退化为**摘除宿主**（detach）。

### 进出场动画

`animate` 指令选项让真假切换播转场动画——**离场动画播完，宿主才真正离开 DOM**：

<demo html="if/animate.html"/>

```html
<!-- 内置 slide：上滑浮入 / 下滑淡出 -->
<div x-if="show" x-if-options="{animate:'slide'}">...</div>

<!-- 分相配置：只播进场淡入，离场直接消失 -->
<div x-if="show" x-if-options="{animate:{enter:'fade',leave:false}}">...</div>
```

行为要点：

- **eager / keepalive 两态同权**，分支链（`x-else-if` / `x-else`）切换时新旧分支同场共演；
- **抢占**：动画播到一半条件又翻转，在播动画立即取消、按新状态全新处理；
- **首次渲染静默**：只有状态变化引起的挂载/卸载才动画；
- eager 离场动画期间元素内容冻结（子树 watcher 已销毁、状态变更不再影响它）。

内置 `fade` / `slide` 开箱即用；对象配置（时长/延迟/缓动）、自定义动画（六类名契约）见[动画](../animate.md)。

## 配置

`x-if` 的指令值是条件表达式（必填）。下列配置项控制条件为假时的处理方式；带 ✅ 者可用修饰符方式启用。

| 配置项       | 默认值 | 修饰符 | 说明                                                                                |
| ------------ | ------ | ------ | ----------------------------------------------------------------------------------- |
| `.keepalive` | 未启用 | ✅     | 假时摘宿主但保活子树与 watcher（真时原宿主 reattach）；默认 eager 假时销毁/重建子树 |
| `animate`    | 无     |        | 进出场动画：字符串（`'fade'` / `'slide'` / 自定义名）/ 对象（name/duration/delay/easing）/ 分相（`enter` / `leave` 各自可配，`false` 单相禁用），见[动画](../animate.md) |

::: info 关于指令配置体系
指令选项 / 修饰符 / 宿主选项 / 两层回退见[指令配置](../directive/config.md)。
:::

## 注意事项

- **宿主随条件离开/回到 DOM**：`x-if` 控制的是宿主本身的存在性——假时宿主离开 DOM（锚点注释占位）、真时挂回。这与 `x-show`（宿主永留 DOM、仅切 `display`）正交。要连父容器一起移除，把 `x-if` 上移一层。
- **eager 与 x-for 互斥**：同元素同时写 `x-if`（eager）与 `x-for` 会报错，改用 `x-show` / `x-if.keepalive` 或外层包裹。
- **eager 频繁切换有成本**：每次真假切换都重建/销毁子树与 watcher，频繁切换用 `x-if.keepalive` 或 `x-show` 更省。
- **keepalive 保活的是子树 DOM 与 watcher**，与 Vue `<keep-alive>`（缓存组件实例）概念相邻但不等同。
- **分支链的渲染层级**：`x-else-if` / `x-else` 分支渲染后是宿主的**兄弟**（书写在宿主内、渲染在宿主原位顶替）——依赖 `.宿主 > .分支` 子选择器的 CSS 不会命中，请按宿主的父级书写。
- **分支不参与 then**：分支元素是备选模板，条件为真时不会渲染进宿主子树；孤儿分支（父元素未声明 x-if）编译期 warn 并丢弃。
