# 列表渲染

## 概述

`x-for` 根据数组重复渲染一段模板。带 `x-for` 的元素作为**容器**渲染一次，其元素子节点作为**项模板**被重复 N 次。

```html
<ul x-for="book of books" :key="book.id">
    <li>{{ book.title }}</li>
</ul>
```

它基于 `:key` 做 diff 复用——结构变化时尽量复用未变项（保留 DOM、scope、订阅），只增删差异项，避免列表重渲染丢失焦点与输入态。

::: tip 大数据量场景
如果列表数据量较大（> 1000 项），建议启用**虚拟列表**模式（`x-for.virtual`），只渲染可见区域的项，大幅提升滚动性能。详见[虚拟列表](../x-for.md)指南。
:::

## 快速入门

<demo html="for/basic.html"/>

```html
<ul x-for="book of books" :key="book.id">
    <li>{{ book.title }} — {{ book.author }}</li>
</ul>
```

语法：`<项变量> of <数组路径>`。`:key` 声明在**容器**上（如 `:key="book.id"`），缺省时用 index。

## 指南

### 基础列表与响应式

项模板里用项变量（`book`）访问当前项字段。增删数组元素（`push` / `shift` / `splice` / 整体赋值）自动触发重新渲染：

<demo html="for/basic.html"/>

```javascript
engine.state.books.push({ id: 3, title: "新书", author: "新" });
engine.state.books.shift();
```

### 循环派生变量

每项作用域自动注入一组 `$` 前缀派生变量（不占自定义命名空间）：

| 变量              | 含义                                     |
| ----------------- | ---------------------------------------- |
| `$index`          | 0-based 序号                             |
| `$length`         | 本次渲染项数（筛选后长度）               |
| `$begin` / `$end` | 是否首项 / 末项                          |
| `$odd` / `$even`  | 奇数行 / 偶数行（对齐 CSS `:nth-child`） |

<demo html="for/derived.html"/>

```html
<ul x-for="item of items">
    <li :class="$odd ? 'val' : 'muted'">第 {{ $index + 1 }} 项：{{ item }}</li>
</ul>
```

### x-empty 空状态

容器内带 `x-empty` 的子节点在数组为空时渲染一次、非空时拆除。它对**父作用域**求值（无 item / $index）：

<demo html="for/empty.html"/>

```html
<ul x-for="item of items">
    <li>{{ item }}</li>
    <li x-empty>没有数据</li>
</ul>
```

::: tip x-empty 标签须匹配容器内容模型
`<ul>` 内用 `<li x-empty>`、`<select>` 内用 `<option x-empty>`、`<tbody>` 内用 `<tr x-empty>`——与项模板同标签，避免浏览器解析期挪动节点。
:::

### 进出场动画

`animate` 指令选项为列表项提供进出场动画——**新项进场、消失项离场**（离场项播完才移除 DOM），`x-empty` 空状态的挂载/拆除同权播动画：

<demo html="for/animate.html"/>

```html
<ul x-for="task of tasks" :key="task.id" x-for-options="{animate:'slide'}">
    <li x-text="task.title"></li>
    <li x-empty>列表为空（空状态同样播动画）</li>
</ul>
```

行为要点：

- **首渲整队静默**：初次渲染 N 项不整队播进场，此后状态变化引起的增删才动画；
- **项的移动不动画**（无 FLIP）——排序、重排瞬时就位；
- 复合项（多成员节点）逐成员挂类，同组同时进/出；
- 离场项播完才移除 DOM，期间作为「外来节点」暂驻容器，不影响其余项的复用与重排。

内置 `fade` / `slide` 开箱即用；对象与分相配置、自定义动画（六类名契约）见[动画](../animate.md)。

### 与 x-if 组合

`x-for` 与 `x-if` 组合有多种写法，按「条件作用对象」选择：

**① 项内嵌 `x-if`——按每项数据条件渲染（最常用）**

把 `x-if` 写在**项模板内部**的子元素上，按当前项字段决定该子内容是否渲染。`x-if` 与 `x-for` 分处不同层级、各占自己的子树，互不冲突：

<demo html="for/if.html"/>

```html
<ul x-for="notice of notices" :key="notice.id">
    <li>
        {{ notice.title }}
        <span x-if="notice.unread" class="tag is-warning">未读</span>
    </li>
</ul>
```

`x-if` 订阅 `notice.unread`，字段变化时按细粒度响应式单独触发该项标记的显隐，无需整列表重渲染。

**② 同元素 `x-for` + `x-show`——控制整表显隐**

`x-show` 不占子树，可与 `x-for` 写在同一元素上，用 `display:none` 切换列表显隐：

<demo html="for/if-same-element.html"/>

```html
<!-- x-show 与 x-for 同元素：切换列表显隐 -->
<ul x-for="item of items" :key="item.id" x-show="visible">
    <li>{{ item.title }}</li>
</ul>
```

**③ 同元素 `x-for` + `x-if.keepalive`——显隐时保活项子树**

`x-if.keepalive` 在 `false` 时 detach 容器但保活项子树与订阅，`true` 时原样 reattach：

```html
<!-- x-if.keepalive 与 x-for 同元素：隐藏时保活，显示时无需重建 -->
<ul x-for="item of items" :key="item.id" x-if.keepalive="visible">
    <li>{{ item.title }}</li>
</ul>
```

**④ 外层包裹——把条件渲染与列表渲染分层**

```html
<div x-if="visible">
    <ul x-for="item of items" :key="item.id">
        <li>{{ item.title }}</li>
    </ul>
</div>
```

::: warning 同元素 `x-for` + `x-if`（eager）会编译期报错
默认 `x-if` 与 `x-for` 都声明占有子树（`ownsChildren`），语义互斥：前者要按条件销毁/重建子树，后者要把子树当项模板重复渲染。写在同一元素会在编译期抛 `[x-if/x-for 冲突]`。同元素组合请用 `x-show` 或 `x-if.keepalive`。
:::

### 复合项

容器的多个元素子节点作为**一组**一起循环（如 `<dl>` 下的 dt/dd、卡片的头/体）。`:key` 按「项」计，一个 key 对应一组 DOM 节点。

<demo html="for/composite.html"/>

```html
<dl x-for="user of users" :key="user.id">
    <dt>{{ user.name }}</dt>
    <dd>{{ user.email }}</dd>
</dl>
```

### key优化 

`:key` 给每个列表项一个**稳定的唯一标识**，告诉引擎「结构变化前后，哪一项是哪一项」。数组发生增删、重排、整体替换时，引擎据此按 key 匹配，**复用未变项**——保留它的 DOM 节点、scope、订阅与输入态（焦点、半填表单等），只更新内容差异；无法匹配的才销毁或新建。

```html
<!-- 用数据自带的唯一 id 作 key -->
<ul x-for="item of items" :key="item.id">
    <li>{{ item.title }}</li>
</ul>
```

用数据自带的唯一且稳定的字段（数据库 id、业务主键）作 `:key`，让引擎在任何结构变化下都按「身份」而非「位置」匹配。代价极小（一次 key 求值），收益是：

- **正确性**：项内若依赖 `$index` 或按 index 订阅的状态，无 key 时中间增删会让项与数据错位；有 key 则项始终绑着自己那份数据。
- **性能**：重排、中间增删、整体替换只重建真正变动的项，其余项零成本复用。
- **状态保留**：输入框焦点、动画中途态、子组件状态随项 DOM 一并保留，不被位置变化打掉。

::: tip 什么算好的 `:key`
**唯一 + 稳定**。优先用数据自带的 `id` / 业务主键。避免用数组 `index`（结构一变即错位，等于无 key），也别用会变的字段（如自增序号、可编辑的标题）——这类 key 变动会让该项被判为「消失 + 新建」，反而触发销毁重建。
:::

### 分页

`x-for.paging` 为列表提供分页能力：支持**客户端分页**（全量数据已在本地，自动 slice）和**服务端分页**（通过 loader action 远程加载数据追加到 items）。

详见[分页](./x-for-paging.md)。

### 虚拟列表

当列表数据量较大（如上万条）时，全量渲染会导致性能问题。`x-for.virtual` 通过**虚拟列表**技术解决这一问题：只渲染当前可见区域的项，滚动时动态替换内容，大幅提升渲染性能。

详见[虚拟列表](./x-for-virtual.md)。

### 性能优化

列表大到千级以上时，开销集中在两头：**结构变化时的 DOM 重建**与**状态的深层代理**。重点就两件事——一是用 `:key`，二是用 autostore 新增的 `shallow` 函数包装列表数组。

#### 一、用 `:key`：按身份复用，只重建真正变动的项

`:key` 给每个列表项一个**稳定的唯一标识**，数组增删、重排、整体替换时引擎按 key 匹配新旧项——未变项的 DOM、scope、订阅**零成本复用**，只增删差异项；缺省 key（index）在中间增删时会让项与数据错位、大面积销毁重建，大列表下这是最主要的隐性开销：

```html
<!-- 数据自带的唯一 id 作 key：唯一 + 稳定 -->
<ul x-for="item of items" :key="item.id">
    <li>{{ item.title }}</li>
</ul>
```

代价极小（一次 key 求值），收益是正确性（项不随位置错位）、性能（重排与中间增删只动真正变动的项）与状态保留（焦点、半填表单、动画中途态随项保留）。key 的选择与反例详见上方 [key优化](#key优化)。

#### 二、用 `shallow`：仅做浅层代理，不做深层嵌套代理

AutoStore 缺省对整棵状态树做**深层代理**——递归代理数组的每个成员、成员内的每个嵌套对象。上万项的大列表初始化时要逐层建立代理，初始化耗时与内存开销随嵌套深度放大。`shallow`（autostore 新增的函数，经 autospark 全量转导出，`import { shallow } from "autospark"` 即可用）把一个对象或数组标记为**仅做浅层代理**：进入状态树后只代理浅层，不再嵌套式向下代理，这对大型数组或对象在性能敏感场景下很有用：

```javascript
import { AutoSpark, shallow } from "autospark";

const engine = new AutoSpark(el, {
    // 数组 + 成员各一层浅代理，孙级及以下读出即原始引用
    todos: shallow(bigTodos, 1),
});
```

`shallow(obj, deep)` 的 `deep` 有两档（缺省 `0`），响应行为不同：

| 写法               | 代理层数           | 响应行为                                                   |
| ------------------ | ------------------ | ---------------------------------------------------------- |
| `shallow(list)`    | 仅数组本身一层     | `push` / `splice` / 索引整体替换等结构操作照常响应；**元素读出即原始引用**——直改元素内部字段不触发更新（需 `list[i] = {...}` 整体替换该项） |
| `shallow(list, 1)` | 数组一层 + 成员一层 | 成员字段读写仍响应（如 `todo.done = !todo.done` 触发该项 `:class` 细粒度更新），成员内函数照常成为计算属性；**孙级及以下读出即原始引用**（成员首次经代理读取时惰性纳管） |

按列表的需求选档：

- 项字段需要细粒度响应（输入绑定、单项状态切换）→ `shallow(list, 1)`；
- 只需要整体增删、内容整体替换 → `shallow(list)` 最省；
- 项内还有需要**深层响应**的嵌套结构 → 浅代理下深层修改不触发更新，此时保持默认深层代理。

配合 `:key` 的完整示例（可灌入 1000 条体验大列表的初始化与操作）：

<demo html="for/shallow-todo.html"/>

```html
<!-- :key 稳定复用 + shallow 浅层代理：前者省 DOM 重建，后者省代理开销 -->
<ul x-for="todo of todos" :key="todo.id">
    <li :class="todo.done ? 'done' : ''">{{ todo.text }}</li>
</ul>
```

```javascript
// 列表数组在进入状态前用 shallow 包装（demo 中为 AutoSparkSpaces.shallow）
{
    todos: shallow(todos, 1),
}
```

## 配置

`x-for` 的指令值形如 `项变量[, index变量] of 数组路径\|表达式`（必填，如 `x-for="item of items"`）。下列配置项控制项标识；带 ✅ 者可用修饰符方式启用。

| 配置项 | 默认值  | 修饰符 | 说明                                               |
| ------ | ------- | ------ | -------------------------------------------------- |
| `:key` | `index` |        | 容器上的 `:key="expr"`，项的唯一标识，缺省用 index |
| `animate` | 无 |      | 项级进出场动画：字符串（`'fade'` / `'slide'` / 自定义名）/ 对象（name/duration/delay/easing）/ 分相（`enter` / `leave` 各自可配，`false` 单相禁用），见[动画](../animate.md) |
| `pageSize` | `10` | ✅ `.paging` | 每页条数，详见[分页](./x-for-paging.md) |
| `loader` | 无 | | 服务端分页的 loader action 名，详见[分页](./x-for-paging.md) |
| `autoLoad` | `true` | | 首次是否自动加载第一页，详见[分页](./x-for-paging.md) |
| `itemHeight` | 自动检测 | ✅ `.virtual` | 列表项固定高度（像素），详见[虚拟列表](./x-for-virtual.md) |
| `overscan` | `5` | ✅ `.virtual` | 可见区域外额外渲染的项数，详见[虚拟列表](./x-for-virtual.md) |
| `:data-index` | - | ✅ `.virtual` | 滚动位置绑定的状态路径，详见[虚拟列表](./x-for-virtual.md) |

::: info 关于指令配置体系
指令选项 / 修饰符 / 宿主选项 / 两层回退见[指令配置](../directive.md#指令配置)。
:::

## 注意事项

- **与 `x-if`（eager）互斥**：二者都要独占子树，同元素会报错。需要时用 `x-show` / `x-if.keepalive`，或外层包裹。
- **`:key` 声明在容器上**，不是项模板上。
- **嵌套遮蔽**：内层 `$index` / 项变量遮蔽外层同名；跨层引用外层序号用自定义 index 名（如 `cell, cidx of ...` 后用 `cidx`）。
- **派生变量靠 refresh 重算**：`$end` / `$length` 等随数组增删变化，复用项会原地重算并重跑绑定。
- **表达式数组退粗粒度**：纯路径 `items` 保留字段级细粒度；`items.filter(...)` 等表达式会让字段变更也触发整列表 render。
- **分页与虚拟列表互斥**：`.paging` 与 `.virtual` 不能同时使用。同时声明时 `.paging` 优先。
- **虚拟列表性能**：启用 `.virtual` 修饰符后，只渲染可见区域的项。详见[虚拟列表](../x-for.md)指南。
