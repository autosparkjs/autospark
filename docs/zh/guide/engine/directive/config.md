# 指令配置

一条指令声明可携带**属性参数**、**修饰符**、**指令选项**三种配置，外加元素级共享的**宿主选项**与引擎级共享的**指令全局默认**。本文说明这些配置方式及其读取优先级；各指令支持哪些具体选项，见对应指令文档的「配置」一节。

## 配置方式

以 `x-on:click.enter="submit"` 为例，一条指令声明可同时包含三种配置：

```html
<button x-on:click.enter="submit" x-on-options="{ once: true }"></button>
```

| 写法     | 形式                            | 作用                                          |
| -------- | ------------------------------- | --------------------------------------------- |
| 属性参数 | `x-on:click` 的 `click`         | 指明指令作用于哪个具体目标（事件名 / 属性名） |
| 修饰符   | `.enter`                        | 无值开关，启用某项内置行为                    |
| 指令选项 | `x-on-options="{ once: true }"` | 指令级配置对象，权威配置来源                  |

### 属性参数

指令名冒号后的标识。`x-on:click` 指事件类型 `click`，`x-bind:title` 指属性 `title`，`x-for` 无参数。参数是字符串，不带值。

### 修饰符

指令名点后的开关项，**不带值**。多个修饰符可串联：`@click.enter.ctrl`。修饰符只表示无值开关，纯数字修饰符不会注入指令选项；带值配置请写入指令选项。

### 指令选项

`x-{name}-options` 是指令级配置的**权威来源**，支持四种形态——可以**全量配置**（整包），也可以把单个选项**拆散为成员属性**，还可以按属性参数**定向**到同元素的某个具体指令实例：

```html
<!-- ① 整包（全量配置）：值为宽松 JSON 静态解析 -->
<div x-loading x-loading-options="{ message: '加载中', delay: 100 }"></div>

<!-- ② 成员属性（拆散写法）：值为表达式，优先级高于整包同名键 -->
<div x-loading x-loading-options.message="'加载中'" x-loading-options.delay="100"></div>

<!-- ③ 定向整包：按属性参数配对到 attr=user 的那一个 x-dialog 实例 -->
<button x-dialog:user="ui.open" x-dialog-options:user="{close-on-mask: false}"></button>

<!-- ④ 定向成员：定向 + 拆散 -->
<button x-dialog:user="ui.open" x-dialog-options:user.props="{userId: 42}"></button>
```

#### 成员属性（x-{name}-options.键）

把单个选项写成独立属性，值是**表达式**——可以绑定响应式状态（`x-loading-options.delay="ui.delay"`），这是成员属性相对整包的核心优势（整包是静态宽松 JSON）。规则：

- **优先级**：`整包内嵌 < 无定向成员 < 定向成员`，同名项**整键覆盖**（不做深合并）；
- **值语义**：一律按表达式求值——数字 / 布尔 / 对象字面量自然成立；**顶层字符串字面量须双层引号**（`x-loading-options.message="'加载中'"`）；
- **生效时机**：指令在既有消费时机读取最新求值值（如 x-dialog 每次打开现读——重开生效）；除各指令特别声明的热应用成员（如 x-dialog 的 `props`）外，配置变更不中途生效；
- **kebab-case**：HTML 属性名会被 DOM 全量小写化，camelCase 键须以 kebab-case 书写（`close-on-mask`、`delay-close`），引擎自动归一为 `closeOnMask` / `delayClose`；整包内嵌（属性值）不受影响。

#### 定向（x-{name}-options:参数）

冒号后首段若与同元素某同名指令的**属性参数**一致，即定向到该实例——同元素声明多个同名指令（如 `x-dialog:a` + `x-dialog:b`）时各自独立配置 / 传 props 的精确配对通道。消歧规则：首段匹配属性参数 → 定向；否则视为（无定向的）成员名。定向找不到对应主指令时**静默丢弃**（与 `-options` 无主指令先例一致）。

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

`x-options` 声明**元素级共享配置**，挂在宿主元素的 scope 上，供该元素上的**编译期指令**回退读取。它不是数据、不进入表达式视图，仅作配置。运行时指令（如 `x-loading`）不读取宿主选项（无元素 scope），但会读取下文的[指令全局默认](#指令全局默认)；其配置应写入 `x-loading-options`。

```html
<!-- 该元素的编译期指令都能经回退读到 { empty: '暂无' } -->
<span x-options="{ empty: '暂无' }" x-text="stock"></span>
```

### 回退链

读取某个配置键时，按固定顺序查找：

1. **指令选项**（`x-{name}-options`——成员属性表达式层先在指令选项内部收敛出终值，再参与对外回退；含解析期注入的修饰符）
2. **宿主选项**（`x-options`）
3. **指令全局默认**（`AutoSparkOptions.directives`，见下节）

**关键：缺失才回退，不做合并、不做覆盖。** 任一层显式写了某个键（哪怕 `false`）就命中、阻断回退；三层都没有返回 `undefined`，由指令代码的内置兜底收尾（如 x-text 的 `empty` 默认空串——内置默认在链外、表达式视图不可见）。

### 指令全局默认

`new AutoSpark(el, state, options)` 的 `options.directives` 是**引擎级**的按指令名默认配置表——每个 engine 实例各自独立，常用于「全站统一切换某指令的默认姿态」（如全部对话框默认不可关闭）：

```ts
new AutoSpark(el, state, {
    directives: {
        "x-dialog": { closeable: false }, // 带前缀主形态
        // text: { empty: "暂无" },       // 裸名等价容忍
    },
});
```

规则：

- **key 为指令名**：带前缀（`"x-dialog"`）为主形态，裸名（`"dialog"`）等价容忍，双形态并存带前缀优先；字面 kebab-case 匹配；别名以注册表真实指令名为准（`:title` / `x-class` 归一为 bind，写 `"x-bind"`）；无 `*` 通配；写错指令名静默忽略。
- **值为普通对象**：键级回退、不深合并——元素级任何一层（指令选项 / 宿主选项 / 修饰符）显式写键即压过全局默认。
- **全部指令自动生效**：含插件注册的指令与运行时通道指令（运行时指令跳过宿主选项层、全局默认层照常生效），零改造。
- **活读**：每次读取现查本表——构造后 `engine.options.directives["x-dialog"] = { closeable: true }` 注入对之后的读取生效，不追溯已渲染结果、不触发重渲染；需要响应式联动请走 state 而非 options。

```html
<!-- 全局 directives: {"x-text":{empty:"暂无"}} 下，三个元素的行为 -->
<span x-text="a"></span>                                  <!-- a 为空值 → 暂无（全局默认） -->
<span x-text="b" x-options="{empty:'宿主'}"></span>        <!-- 宿主（压全局） -->
<span x-text="c" x-text-options="{empty:'指令'}"></span>   <!-- 指令（压全局） -->
```

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

::: warning 运行时选项变更
当前版本尚未实现 ADR-0051 规划的 `data-<指令名>-<选项名>` 通用覆盖通道。指令选项在编译或指令初始化时读取，运行时修改对应的 `data-*` 属性不会更新已创建指令的选项；需要状态驱动的行为，请使用对应指令自身支持的响应式表达式或运行时入口。
:::

### 动作内的 $options

在 `x-on` 的动作函数里，可通过上下文的 `$options` 读取聚合后的配置（按回退链三层虚拟合并——含指令全局默认，零拷贝且只读）。这对自定义反馈逻辑有用，详见[x-on](../directives/x-on.md)。

---

各指令支持的选项与修饰符见对应指令文档的「配置」一节；接下来逐个学习指令，从[属性绑定 x-bind](../directives/x-bind.md) 开始。
