# 动态模板

## 概述

普通响应式只能更新**已编译节点**的值（`textContent`、属性）。当你需要在运行时**改变模板结构本身**——增删元素、替换片段、动态加载子模板——就用动态 patch：修改模板片段，引擎增量同步到运行树。

## 快速入门

`#box` 是 `x-scope` 哨兵 scope。「重建子树」每次修改 `#box` 模板并触发子树重建（多出一个计数节点）；「只改 content」则走普通响应式，不重建结构。

<demo html="patch/rebuild.html"/>

## 指南

### engine.patch(selector, content, options?)

```typescript
engine.patch(selector, content, options?): this
// content: string（HTML 片段）| Node | updater 回调
// options: { mode?: 'replace' | 'inner' | 'prepend' | 'append'; ref?: string }
```

- `selector`：对**模板**（`engine.template`）的 CSS 选择器，命中的须是 scope 元素（含指令或插值）。
- `content`：三种形态任选——**string / Node** 直接投内容（配合 `mode` 决定放置方式），
  或 **updater 回调**（接收命中的模板元素，**就地修改它**，返回值决定重建范围，仅 replace 语义）。
- `options`：可选。`mode` 投放模式（缺省 `replace`）；`ref` 容器内锚点选择器（见下）。

#### updater 的四种返回值（replace 模式）

| 返回值 | 行为 |
| --- | --- |
| `undefined` / `void` 或返回入参本身 | **子树重建**：销毁并重编译该元素的子节点，元素自身不动 |
| 新 `Node` | **替换自身**：用该节点替换命中元素 |
| `string`（HTML） | **替换自身**：解析为节点替换；空串等同删除 |
| `null` | **删除自身**：移除该元素 |

```javascript
// 子树重建：改 #box 内部模板，返回 undefined
engine.patch("#box", (el) => {
    el.innerHTML = '<p x-text="content"></p><p>已更新</p>';
});

// 替换自身：返回 HTML 字符串
engine.patch("#old", () => '<div x-text="content"></div>');

// 删除自身：返回 null
engine.patch("#tmp", () => null);
```

::: tip 只动目标，保留其余运行态
patch 只重建目标子树，**其余子树原封不动**——焦点、滚动、未提交输入都保留。需要重建整棵树时用 `engine.compile()`（全量重编译，慎用）。
:::

### 内容投放模式（options.mode）

第二参直接投内容（string / Node）时，`options.mode` 决定放置方式（ADR-0109）：

| mode | 行为 | 空串 |
| --- | --- | --- |
| `replace`（缺省） | 内容**替换命中元素本身** | 删除该元素 |
| `inner` | **清空容器全部子级**后放入新内容，容器自身与指令保留 | 仅清空（等价 `innerHTML=''`） |
| `prepend` | 插为容器**第一个**子节点（可多节点） | 忽略 |
| `append` | 插为容器**最后一个**子节点（可多节点） | 忽略 |

```javascript
// 清空重填：outlet 容器固定，内容换装
engine.patch("#outlet", '<p x-text="title"></p>', { mode: "inner" });

// 增量加载：往列表尾部追加
engine.patch("#list", "<li>更多…</li>", { mode: "append" });

// 插顶
engine.patch("#list", '<li class="new">置顶</li>', { mode: "prepend" });
```

<demo html="patch/modes.html"/>

::: tip 插入模式的语义细节
- **编译先行**：`inner` / `prepend` / `append` 先编译新内容，编译成功才动 DOM（失败零副作用）；插入节点**继承容器的数据上下文**（挂容器的 scope）。
- **函数形态也支持插入模式**：返回 string/Node 即为待插入内容——可读取容器现状决定增量（如按现有子项数量追加下一项）；返回 `undefined` 静默忽略，返回 `null` 记警告（插入模式没有删除语义）。
- **`options.ref` 锚点**：仅 `prepend` / `append` 生效——指定容器内某 scope 子元素（CSS 选择器）时，改为插到该元素**之前/之后**；ref 为空则插容器首/尾，未命中或命中的不是 scope 元素时记警告且不操作（给锚点挂 `x-scope` 即可）。
:::

### 命中元素必须是 scope

`patch` 靠「模板元素 → scope」的正向桥定位运行元素。只有**含指令或插值的元素**才会建 scope、进正向桥。

纯静态裸元素（无指令、无插值）没有 scope，`patch` 找不到它——这时用 **`x-scope` 哨兵**让它成为 scope：

```html
<!-- 这个 div 原本是裸元素，加 x-scope 后即可被 patch 定位 -->
<div id="box" x-scope></div>
```

`x-scope` 是零副作用指令，唯一作用就是让元素进入正向桥、可被 `patch` 定位。

### 动态区域限制

`x-for` / `x-if` / `x-isolate` 内部是**动态区域**——运行侧结构由指令运行时生成，与模板非同构。`patch` 目标落在动态区域（目标自身或祖先链含这些结构指令）时**会被拒绝**并记日志。

需要变化动态区域的内容时，改驱动它的状态（如 `x-for` 的数组、`x-if` 的条件），而非 patch。

### engine.data(el, data)

向某个元素的局部数据域注入数据，触发该 scope 子树重算：

```javascript
engine.data(el, { temp: "临时值", flag: true });
```

- 元素原本有 `x-data`：`Object.assign` 合并进现有局部数据，路径订阅自动驱动更新。
- 元素原本无 `x-data`：新建局部数据域 + 子树重建（让子树 watcher 重新订阅新数据）。

---

动态模板至此讲完。接下来进入[指令](./directives/x-bind.md)逐个学习。
