# x-teleport 传送

## 概述

把元素**一次性**渲染到 DOM 树的其他位置——脱离当前父级，挂到指定目标下。常用于弹窗、提示等需要脱离溢出隐藏（`overflow:hidden`）容器、渲染到 `body` 的场景。

x-teleport 是**静态**指令：目标选择器编译期确定、传送只发生一次（不随状态变化反复搬移）。逻辑作用域默认仍随原模板位置——传送只改变 DOM 挂载点，元素的数据上下文、响应式绑定照常工作。

## 快速入门

把 `overflow:hidden` 容器里的弹窗传送到 `body` 下的全局目标，不受父级裁剪影响：

<demo html="teleport/basic.html"/>

```html
<body>
  <div id="tp-root">
    <div class="overflow-hidden">
      <!-- 这个弹窗传送到 body 下的全局目标，不受父级 overflow:hidden 影响 -->
      <div x-teleport="/#modal-host" x-show="show" class="modal">弹窗内容</div>
    </div>
    <div id="modal-host"></div>
  </div>
</body>
```

## 指南

### 指令值

指令值是**目标选择器**（必填，静态字面量），经 `queryRelElement` 编译期解析一次——**不做表达式求值、不随状态变化**。空值 `warn` 后原地渲染；`.` / `./` / 空选择器指向宿主自身。

::: warning 值不是表达式
值是纯选择器字面量。运行时切换挂载点暂不支持；显隐控制请配合 `x-show`（同元素）或外层 `x-if`（包裹）。
:::

选择器有四种相对形态：

#### 宿主内部 `.sel`

在宿主**内部** query：

```html
<div class="wrapper">
  <div class="target">…</div>
  <div x-teleport=".target">…</div>
</div>
```

注意：命中宿主子树内的元素会形成 DOM 环，按失败降级处理（见[执行时机与失败降级](#执行时机与失败降级)）。

#### 父级爬升 `../sel`

从宿主**父元素**内部查找，`../` 可叠加（`../../` = 祖父内部）：

```html
<div class="target">
  <div x-teleport="../.target">…</div>
</div>
```

#### 全局 `/sel`

走 `document.querySelector`，可跨 engine 边界：

```html
<div x-teleport="/#modal-host">…</div>
```

#### closest `^sel`

从宿主向上 `closest` 查找祖先（含自身）；`^../` 前缀表示 closest 起点继续上爬：

```html
<form x-teleport="^form">…</form>
```

### 数据视图

默认（`declarer`）：传送后元素的数据上下文**保持声明处**——DOM 移走、表达式读的仍是声明位置的 x-data 域。

`dataContext:'host'`（快捷修饰符 `.host`）：数据上下文切到**挂载点所属 scope**——表达式读目标元素处的上下文；目标在引擎树外（如 `/.body` 直挂）时降级为仅全局 state。

```html
<!-- 默认：读声明处数据 -->
<div x-data="{ who: '声明处' }">
  <div class="target" x-data="{ who: '目标处' }"></div>
  <div x-teleport="../.target"><span x-text="who"></span></div>
  <!-- → 声明处 -->

  <!-- .host：读挂载点数据 -->
  <div x-teleport.host="../.target"><span x-text="who"></span></div>
  <!-- → 目标处 -->
</div>
```

<demo html="teleport/data-context.html"/>

### 执行时机与失败降级

目标解析与搬移发生在编译完成、结果树挂载之后（微任务）——同一模板中文档序在后的目标也能命中。原声明位置留一个**锚点注释**作 DOM 书签。

以下情况 **warn + 原地渲染**（等效未写指令，内容不丢失）：

- 目标未命中 / 选择器非法；
- 目标落在宿主自身子树内（将形成 DOM 环）；
- 目标未连接（已被摘除）。

::: warning 目标生命周期
目标元素后续被移除时，传送的宿主会成为游离节点（不可见），引擎**不追踪不回收**——请保证目标与宿主生命周期匹配（外层用 `x-if` 包裹可整体销毁重建）。
:::

### 与其他指令的组合

| 组合                                                                       | 行为                                                                          |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `x-show` 同元素                                                            | ✅ 支持——显隐与位置正交，`x-show` 的 `animate` 动画在传送后照常生效           |
| `x-for` / `x-component` / `x-isolate` / eager `x-switch` / `x-tree` 同元素 | ⚠️ warn + 放弃传送，子树由该结构指令接管（外层包裹即可组合）                  |
| eager `x-if` 同元素                                                        | ⚠️ warn + 放弃传送；改用外层包裹：`<div x-if="show"><div x-teleport="…">`     |
| `x-if.keepalive` / `x-switch.keepalive` 同元素                             | ⚠️ warn + 拒绝传送（keepalive 切回会把宿主插回原位，传送失效）                |
| 祖先链含 keepalive 显隐指令                                                | ⚠️ warn（外层摘除时传送内容物理在目标下、不受影响——显隐失效，请确认符合预期） |

与 [`x-dialog`](./x-dialog.md) 的分工：x-teleport 是**静态轻量弹层**（无遮罩、无打开栈、无实例管理）；需要 ESC 关闭、遮罩、多实例管理的对话框请用 x-dialog。

## 配置选项

下列配置项控制传送后的数据上下文：

| 配置项       | 默认值     | 修饰符 | 说明                                                                                                                                                        |
| ------------ | ---------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dataContext` | `declarer` | —      | `'declarer'`（默认）读声明处数据；`'host'` 读挂载点所属 scope（目标在引擎树外时降级为全局 state）。非法值 `warn` 后回落 `declarer`                           |
| `host`       | 未启用     | `.host` | `dataContext:'host'` 的修饰符糖（≡ `x-teleport-options="{host:true}"`）；显式 `dataContext` 优先于本修饰符                                                  |

```html
<div x-teleport="selector" x-teleport-options="{dataContext:'host'}">...</div>
<!-- 等价快捷写法 -->
<div x-teleport.host="selector">...</div>
```

::: info 关于指令配置体系
指令选项 / 修饰符 / 宿主选项 / 两层回退见[指令配置](../directive/config.md)。
:::

## 注意事项

- 传送是**搬移宿主元素自身**（连同编译后的子树），声明位置的锚点注释仅作书签。
- 多个元素传送到同一目标时按声明顺序**追加**（后声明者在后）。
- 支持**嵌套传送**：内层传送在外层子树编译后执行，以内层为准。
- 引擎 `destroy()` 或宿主的祖先 scope 销毁时，被传送的 DOM 会被一并摘除。
- 传送目标在引擎树外时，宿主子树的运行时指令由引擎额外观察根覆盖，行为与树内一致。
