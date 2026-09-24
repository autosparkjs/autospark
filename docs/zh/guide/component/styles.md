# 样式

## 作用域 CSS（scoped）

组件内的 `<style>` 默认仅命中本组件实例，机制是**属性后缀法**（仿 Vue `<style scoped>`）：

1. 实例化时给**组件根 + 所有后代元素**打唯一 `data-cmp-{id}` 属性；
2. `<style>` 每条选择器末尾自动追加 `[data-cmp-{id}]`，使样式隔离到本实例；
3. 同名组件的样式按**组件定义缓存**（只改写注入一次），多实例共享，引用计数管理移除。

改写规则覆盖：媒体查询（`@media`）内部照常改写、逗号选择器各组分别加、伪类伪元素（`:hover`/`::before`）属性后缀置于其前。

<demo html="component/scoped-style.html"/>

```html
<div x-define="card">
    <div class="title" x-text="title"></div>
    <style>
        /* 仅命中本组件实例的 .title，不影响页面同名 class */
        .title { color: #3273dc; font-weight: 700; }
        .title:hover { color: #23d160; }   /* 属性后缀置于伪类前 */
    </style>
</div>
```

::: warning 不支持深度穿透
当前不支持 `:deep()` / `>>>`（纯隔离）。真实穿透需求出现时再加——它只是改写器的一个额外规则，不影响架构。
:::

## 响应式样式（`<style>` bind）

`<style>` 的声明值可以写 `bind(expr)`，把状态/表达式注入为 **CSS 变量**，实现样式的响应式——状态变，样式跟着变，无需 `:style` 逐元素绑定：

```html
<div x-define="bar">
    <div class="bar-track"></div>
    <style>
        .bar-track {
            width: bind("barWidth + 'px'");     /* 表达式 → 注入为 --h{hash} */
            background: bind("barColor");        /* 纯路径 → 注入为 --bar-color */
        }
    </style>
</div>
```

**工作原理**：编译期扫描 `<style>`，把 `bind(expr)` 替换为 `var(--变量名, unset)` 并记录绑定清单；实例化时对每个绑定订阅表达式，求值结果写入**组件根元素**的 CSS 变量。状态变化 → 变量更新 → 所有引用该变量的样式自动刷新。

<demo html="component/style-bind.html"/>

**bind 语法**：

- `bind(expr)` 或 `bind("expr")`——**引号可选**，二者等价；
- **仅作为整个属性值**：`bind()` 必须独占声明值位置，不能嵌入复合值（`margin: 8px bind("gap")` 非法）；
- 参数支持**任意表达式**（纯路径如 `theme.primary`，或运算式如 `w + base`、`count * 2`）。

**变量名规则**——同一表达式在多处 `bind()` 共享同一个变量名（只订阅一次，多处引用）：

| 形态 | 规则 | 示例 |
| --- | --- | --- |
| **纯路径**（仅 `字母/数字/_/$/.`） | `--{路径}`，`.`→`-` | `bind("order.style")` → `--order-style` |
| **表达式**（含运算符等） | `--h{hash}`（确定性短 hash，`h` 保变量名合法） | `bind("a+b")` → `--h1a2b3c` |

::: warning 数字值需配 calc
CSS 变量是**字符串**——`bind("count")` 注入 `100` 时，`width: var(--count)` 无效（需 `100px`）。两种写法：表达式里拼单位 `bind("count + 'px'")`，或用 `calc`：`width: calc(var(--count) * 1px)`。
:::

**无效值的安全回退**：当表达式返回 `null` / `undefined`（或求值失败），**不写入变量**，CSS 自动走 `var(--name, unset)` 回退——无效值不影响布局。`bind` 的回退值固定为 `unset`、不可配；需要自定义默认值时改用 `:style` 指令。
