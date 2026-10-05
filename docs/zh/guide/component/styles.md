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

## 全局样式（`<style global>`）

`<style>` 加 `global` 属性即切换为**全局注入**形态：不做 scoped 改写，组件**注册时**原样注入 `<head>`——页面里即使还没有任何实例，样式也已生效：

```html
<div x-define="card">
    <div class="title" x-text="title"></div>
    <style global>
        .title { color: #3273dc; font-weight: 700; }
        .title:hover { color: #23d160; }
    </style>
</div>
```

注入结果（`<head>` 内）：

```html
<style id="autospark-styles">
    .title { color: #3273dc; font-weight: 700; }
    .title:hover { color: #23d160; }
</style>
```

**规则**：

| 场景 | 行为 |
| --- | --- |
| `<style global>`（无 id） | 合并进共享容器 `<style id="autospark-styles">`——跨组件、同组件多段按声明序追加 |
| `<style id="xx" global>` | 注入为独立容器 `<style id="xx">`；同 id 跨组件**追加**，可作共享主题样式池 |
| `<style id="xx">`（无 global） | id 静默忽略，维持 scoped |
| 注入时机 | 组件**注册时**（声明即生效，无需实例化）；`x-import` / `registerComponent` 注册的组件同样生效 |
| 移除时机 | `engine.destroy()` 只移除本 engine 贡献的段；运行期常驻 |
| 同名组件覆盖声明 | 旧段**整组替换**、保持原注入位置（与组件「后者覆盖」语义一致，无幽灵样式） |
| 组件继承 | 样式拼接语义照常（父段经父、子两个定义各注入一次，重复无害） |
| 组件外声明 | 仅 `x-define` 内生效，其他位置 warn + 按普通样式元素处理 |

::: warning bind() 不支持 global
`<style global>` 内的 `bind()` 不生效（变量挂载点在全局语境无对应物）——warn 后原样保留（该声明被浏览器丢弃，不影响其余规则）。动态值请回到 scoped 段配合 [bind](#响应式样式-style-bind)，或使用 `:style`。
:::

scoped 与 global 可在同一组件**混用**——每个 `<style>` 标签独立分流：私有结构样式走 scoped（防泄漏），公共类 / `@keyframes` / 跨组件主题类走 global：

```html
<div x-define="card">
    <div class="body">...</div>
    <style>.body { padding: 8px }</style>          <!-- scoped：仅本组件实例 -->
    <style global>.card-theme { ... }</style>       <!-- 全局：合并进 autospark-styles -->
    <style id="theme" global>.btn { ... }</style>   <!-- 全局：独立容器 style#theme -->
</div>
```

<demo html="component/global-style.html"/>

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
