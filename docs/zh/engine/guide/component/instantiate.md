# 实例化组件

`x-component` 在模板中实例化一个已声明的组件（ADR-0054 更名自 `x-use`）。

## 基础用法

语法职责分离：**属性参数承载组件名**、**值专职 props**。实例化时**宿主化身组件根**：宿主元素保留身份，组件快照子树编译挂入。

```html
<!-- 无 props 实例化 -->
<div x-component:counter></div>

<!-- 静态字面量 props -->
<div x-component:counter="{ count: 100 }"></div>

<!-- 绑定状态对象：按键展开为 props（v-bind="obj" 心智） -->
<div x-component:counter="order"></div>
```

要点：

- **组件名是静态的**（写在属性参数里，编译期可知）——不支持响应式切换组件名；要条件切换组件，把 `x-if` 写在外层包裹元素上，分支内各自实例化。
- **无属性参数**（如误写 `x-component="counter"`）会 `warn` 缺少组件名并跳过实例化；值恰为纯标识符时警告会附言迁移指引（旧定义写法请改用 `x-define`）。

## 传递 props

props 注入组件的**同一个 data 域**，合并顺序是 `data` 默认先注入、props 后覆盖（外部优先）。三种形态：

| 写法 | 语义 | 响应粒度 |
|---|---|---|
| `x-component:counter="{ count: 100 }"` | 静态字面量（成员可引用状态路径，如 `"{ count: order.count }"`） | 成员路径级触发 |
| `x-component:counter="order"` | 状态对象**按键展开**为 props | 深层触发（内部任意键变化实时更新） |
| `x-component:counter="{ count: order.count, step: 5 }"` | 混合 | 同字面量形态 |

配套约定：

- **单向数据流**：外部状态 → 组件。组件内修改 props 键**不回写**外部状态（双向绑定是 `x-model` 的职责）；
- 更新 = 重求值后先与上次应用的 props **浅值比较**：键值完全相同则跳过更新——静态字面量 props 被无关状态变化触发重算时，组件内交互改的同名键**不被打回**字面量初值；有变化才 `Object.assign` **只覆盖出现的键**——组件内部状态（用户交互改的）不被重置，绑定的状态对象删键后旧键残留在组件内（不做镜像同步）；
- props 值必须是对象形态，标量 / 数组会 `warn` 忽略（组件照常实例化，无 props）。

<demo html="component/props.html"/>

## 属性继承

宿主化身组件根后，组件快照根的属性并入宿主：

- `class`：**拼接**（宿主 class + 组件根 class）；
- `style`：合并，冲突键**组件根优先**；
- 其他属性：宿主已有则保留（不覆盖），否则复制组件根属性。

## 结构指令互斥

`x-component` 与结构指令（`x-if` / `x-for` / `x-isolate` / `x-switch` / `x-tree` 等）**不能同元素**——编译期 `warn` 并跳过实例化。要控制组件显隐，把 `x-show` / `x-if` 写在外层包裹元素上：

```html
<!-- ❌ 冲突：x-component 与 x-for 同元素 -->
<div x-for="i of 3" x-component:card></div>

<!-- ✅ 把结构控制写在外层 -->
<div x-if="show">
    <div x-component:card></div>
</div>
```
