# 指令

## 概述

指令是宿主元素上一个**属性声明的行为单元**。模板引擎识别三种前缀的属性：

| 前缀  | 形态         | 示例                    | 归一化     |
| ----- | ------------ | ----------------------- | ---------- |
| `x-*` | 全称指令     | `x-text` `x-if` `x-for` | 原样       |
| `:*`  | 属性绑定简写 | `:class` `:title`       | `x-bind:*` |
| `@*`  | 事件绑定简写 | `@click` `@input`       | `x-on:*`   |

::: tip :class / :style 是 x-bind 的特例
`:class` / `:style` / `x-class` / `x-style` 没有独立指令类——它们在解析期归一化为 `x-bind` + `class` / `style` 参数，复用 `x-bind` 的五路分派。详见[x-bind](./directives/x-bind.md)。
:::

一条指令声明可同时携带三种配置：**属性参数**、**修饰符**、**指令选项**；渲染之后，还能通过**运行时选项覆盖**（`data-*` 属性）修改配置。本文[指令配置](#指令配置)一节讲清这套通用机制——它适用于所有指令，各指令文档的「配置」一节只列出该指令具体支持哪些项。

## 指令类型

### 指令名由注册表决定

指令名由预设注册表 `presetDirectives` 的 key 标识（如 `text` / `if` / `for` / `on` / `bind`），**不是**类的 `Function.name`。当前已注册：`text` `html` `if` `for` `data` `bind` `on` `loading` `isolate` `patch`。

### 一条声明的组成

```html
<button x-on:click.enter.once="submit"></button>
<!--       └┬┘ └─┬─┘ └─┬─┘ └─┬─┘ └──┬── -->
<!--      指令名  参数  修饰符 修饰符  指令值(表达式) -->
```

- **指令名**：`x-on`
- **参数**：`click`（指令作用于哪个目标）
- **修饰符**：`.enter` `.once`（无值开关，注入为指令选项）
- **指令值**：`submit`（表达式或动作名）

参数、修饰符、指令选项的通用机制见[指令配置](#指令配置)。

### 执行通道（用户视角）

指令分两类执行通道，了解这点有助于理解某些边界行为：

- **编译时指令**（`x-if` / `x-for` / `x-text` / `x-bind` 等）：在模板编译期变换结构或绑定，**指令属性会被剥除**，不出现在渲染 DOM 里。它们的响应式来源是 `scope.watch`，支持相对路径、`x-data` 局部变量、`x-for` 项。

- **运行时指令**（`x-loading`）：编译器「致盲」、**属性保留**在渲染 DOM，由 `MutationObserver` 在运行时驱动。响应式来源**只接受绝对路径**（运行时新增的 DOM 元素没有 scope 上下文）。

#### 为什么需要 x-scope 哨兵？

`engine.patch(selector, updater)` 靠「模板元素 → scope」的正向桥定位运行元素。但**纯静态裸元素没有指令、没有插值，不会建 scope**，也就进不了正向桥——`patch` 找不到它。

`x-scope` 就是为这种情况准备的零副作用哨兵指令：它让一个裸元素成为 scope、进入正向桥，从而能被 `patch` 定位，除此之外什么都不做。

```html
<!-- 这个 div 原本是裸元素，加 x-scope 后即可被 engine.patch('#box', ...) 定位 -->
<div id="box" x-scope></div>
```

详见[动态模板](./patch.md)。

### 自定义指令

所有内置指令都继承自 `AutoSparkDirectiveBase`。你可以编写自己的指令类，通过 `engine.directives.set(name, DirectiveClass)` 注册。自定义指令需声明静态元数据（`priority` / `kind` / `singleton`）并按通道实现生命周期钩子（`created` / `compile` / `destroy`，或运行时的 `mounted` / `unmounted`）。

::: info 进阶内容
自定义指令的开发细节（钩子契约、通道选择、选项消费）属于进阶主题，可在熟悉内置指令后参考源码 `src/directives/base.ts` 与内置指令实现。
:::

## 指令配置

### 三种配置写法

以 `x-on:click.enter="submit"` 为例，一条指令声明可同时包含三种配置：

```html
<button
    x-on:click.enter="submit"
    x-on-options="{ once: true }"
></button>
```

| 写法 | 形式 | 作用 |
| --- | --- | --- |
| 属性参数 | `x-on:click` 的 `click` | 指明指令作用于哪个具体目标（事件名 / 属性名） |
| 修饰符 | `.enter` | 无值开关，启用某项内置行为 |
| 指令选项 | `x-on-options="{ once: true }"` | 指令级配置对象，权威配置来源 |

#### 属性参数

指令名冒号后的标识。`x-on:click` 指事件类型 `click`，`x-bind:title` 指属性 `title`，`x-for` 无参数。参数是字符串，不带值。

#### 修饰符

指令名点后的开关项，**不带值**。多个修饰符可串联：`@click.enter.ctrl`。

#### 指令选项

`x-{name}-options="..."` 声明指令级配置对象，值用**宽松 JSON** 解析（见下文），必须是普通对象。

### 修饰符 = 指令选项的快捷写法

修饰符在解析期被**注入为同名的指令选项**（布尔 `true`）。因此二者等价：

```html
<!-- 修饰符写法 -->
<span x-text.hide="user.name"></span>

<!-- 等价的指令选项写法 -->
<span x-text="user.name" x-text-options="{ hide: true }"></span>
```

是否为某个开关提供修饰符快捷方式，由指令作者决定；但底层都走指令选项。

### 宿主选项 x-options

`x-options` 声明**元素级共享配置**，挂在宿主元素的 scope 上，供该元素上**所有指令**回退读取。它不是数据、不进入表达式视图，仅作配置。

```html
<!-- 该元素所有指令都能经回退读到 { empty: '暂无' } -->
<span x-options="{ empty: '暂无' }" x-text="stock"></span>
```

### 两层回退

读取某个配置键时，按固定顺序查找：

1. **指令选项**（`x-{name}-options`，含解析期注入的修饰符）
2. **宿主选项**（`x-options`）

**关键：缺失才回退，不做合并、不做覆盖。** 指令选项里显式写了某个键（哪怕 `false`）就命中、阻断回退；两层都没有返回 `undefined`。

<demo html="config/options.html"/>

```html
<!-- 1) 仅宿主选项：stock 为空时回退读到 x-options 的 empty -->
<span x-options="{ empty: '（宿主占位）' }" x-text="stock"></span>

<!-- 2) 指令选项直接给值：覆盖式，不走回退 -->
<span x-text="score" x-text-options="{ empty: '【指令占位】' }"></span>

<!-- 3) 两者并存：指令选项命中，宿主被阻断 -->
<span x-options="{ empty: '宿主' }" x-text="count" x-text-options="{ empty: '指令' }"></span>
```

### 宽松 JSON

`x-*-options` 的值用宽松 JSON（relaxed-json）解析，比标准 JSON 宽容：

```html
<!-- 键名可不加引号、单引号字符串、尾逗号 -->
<span x-text-options="{ empty: '暂无', emptyValues: [0,] }"></span>
```

::: warning 宽松 JSON 表达不了的值
`undefined` 会被解析成字符串 `"undefined"`，`NaN` 会解析报错。所以 `emptyValues` 只适合追加 `0` / `""` / `false` 这类 JSON 能表达的值；`null` / `undefined` / `NaN` 由默认集保证。
:::

### 运行时选项覆盖

前几种写法都在渲染前声明配置；覆盖属性让你在**渲染之后**修改它。写法是 `data-<指令名>-<选项名>`（指令名去掉 `x-` 前缀），加在宿主元素上：

```html
<!-- animate 选项编译期给 fade，运行时改属性即切到 slide -->
<div x-show="open" x-show-options="{ animate: 'fade' }" data-show-animate="slide"></div>
```

对覆盖属性的操作与效果：

| 操作 | 效果 |
| --- | --- |
| 渲染时已写 | 初始即生效（优先于 `x-*-options` / `x-options`） |
| 修改属性值 | 新值覆盖生效 |
| 删除属性 | 还原编译期值（重新按两层回退读取） |

规则：

- **生效时机是惰性的**：引擎把新值送达指令，在下一次消费该选项时可见（如 `animate` 在下一次进出场切换生效）；个别指令会立即重放（如 `x-loading` 的展示选项即刻刷新遮罩）。
- **值用宽松 JSON 做单值解析**：`"fade"` 是字符串、`500` 是数字、`true` 是布尔、`'{ enter: "fade", duration: 200 }'` 是对象；解析失败忽略本次并告警。
- **可以用绑定驱动**：`:data-show-animate="mode"` 让配置跟随状态自动切换。

支持范围：

- 仅**单例指令**支持（`x-on` / `x-bind` 同元素可多实例，无法定位，暂不支持）。
- 每个指令支持哪些键见对应指令文档的「配置」一节；**未声明的 `data-*` 属性就是普通属性**，引擎不观察、不解释（包括 x-for 使用的 `data-index` / `data-paging`）。
- **编译期选项不可覆盖**（如 `x-for` 的 `virtual`、`x-if` 的 `keepalive`——它们决定子树结构）：写了会收到告警，指回 `x-{name}-options`。

### 动作内的 $options

在 `x-on` 的动作函数里，可通过上下文的 `$options` 读取聚合后的配置（按两层回退虚拟合并、零拷贝）。这对自定义反馈逻辑有用，详见[x-on](./directives/x-on.md)。

---

各指令支持的选项与修饰符见对应指令文档的「配置」一节；接下来逐个学习指令，从[属性绑定 x-bind](./directives/x-bind.md) 开始。
