# 组件递归

## 概述

**组件递归**指组件在自己的模板内实例化自身（`x-component:自身名`）——用于渲染**数据驱动的自相似结构**：文件树、多级菜单、嵌套评论、组织架构等任意深度的层级 UI。

```html
<div x-scope>
    <!-- 递归组件：一行节点 + 子级容器（子级再实例化自身） -->
    <div x-define="tree-item">
        <div class="row" x-on:click="toggle"><span x-text="node.name"></span></div>
        <div class="kids" x-show="node.open">
            <div x-for="child of node.children">
                <div x-component:tree-item="{ node: child }"></div>
            </div>
        </div>
        <script setup>
            {
                methods: {
                    toggle() {
                        this.data.node.open = !this.data.node.open;
                    },
                },
            }
        </script>
    </div>

    <!-- 顶层：每棵根树实例化一次，之后逐层自我复制 -->
    <div x-for="root of tree">
        <div x-component:tree-item="{ node: root }"></div>
    </div>
</div>
```

递归的每一层都是一个**独立的组件实例**——有自己的 data 域（收一个 `node` props）、自己的方法与生命周期；层级间的关联只靠 props 下传的节点对象引用。

<demo html="component/recursive.html"/>

## 机制：自引用为什么能解析

组件模板内的 `x-component:tree-item` 沿**实例 scope 链**就近查找声明（`getComponentDeclaration`）——实例 scope 的 parent 链通向消费处，而消费处必然能看见该组件的声明（否则第一层都实例化不出来）。因此**递归不需要任何注册**：声明一次，模板内写自身名即可。

这依赖「嵌套私有子组件」机制（组件模板内声明的 `x-define` 归属外层组件的**实例 scope**，仅实例内部可见）——递归是它的自然推论：组件模板里的名字，实例化后在自身实例链上就近命中。

## 终止条件与深度保护

递归必须由**数据**终止——上例中无 `children` 的节点不再实例化下一层（`x-for` 空数组零渲染）。数据深度即渲染深度，声明侧无需写任何边界。

若数据出现无终止的自相似引用（或逻辑缺陷导致无限自我实例化），引擎带**递归深度保护**：沿 scope 链统计同名组件的实例化深度，超过上限（100）`warn` + 停止实例化——不会栈溢出或页面卡死，但应修复数据。

## 编写要点

### props 下传节点对象

递归层之间用 props 传当前节点：`x-component:tree-item="{ node: child }"`。注意 props 是**对象引用共享**——`toggle` 里写 `this.data.node.open` 穿透到全局状态里的同一个响应式代理，显隐（`x-show` / `x-if` 监听 `node.open`）随之刷新。这是树形交互的常用姿势；但**标量 props 的替换不会回写外部状态**（单向注入语义不变），不要把两者混淆。

### x-for 与 x-component 不能同元素

`x-for` 与 `x-component` 都是占子树的结构指令，同元素互斥（编译期 `warn` + 拒绝实例化）。逐项实例化组件时**套一层**：`x-for` 写外层容器，组件化身放其子级（上例的 `<div x-for>` + 内层 `<div x-component>`）。

另注意本引擎的 `x-for` 形态是**宿主即容器**：`<div x-for="child of node.children">` 的元素子节点即项模板——不是 Vue 的 `<template x-for>` 包裹写法。

### 显隐用 x-show，重建用 x-if

- `x-show="node.open"`：子树保活、只切 `display`——展开 / 收起状态不丢，切换零重建成本（上例采用）；
- `x-if="node.open"`：收起时**销毁**子树 scope——深层大子树收起后不占内存，重新展开时重建。

超大树建议默认收起（`x-if`）+ 数据分页 / 懒加载，避免一次性实例化过深。

### 组件名用 kebab-case

`x-component:名称` 的属性参数会被 DOM 小写化，`x-define="treeItem"` 与 `x-component:treeItem` 因大小写不一致无法命中——递归组件名请用小写 / kebab-case（如 `tree-item`）。

## 递归组件 vs x-tree

| | 递归组件 | [x-tree](../directives/x-tree.md) |
| --- | --- | --- |
| 定位 | 通用机制：任意自相似结构（菜单 / 评论 / 组织架构…） | 树形**专职**指令：`ul > li` 嵌套渲染 |
| 树交互 | 自行实现（折叠 / 选中 / 复选按需写） | 内置（三路分流 / 半选 / 拖拽 / 懒加载预留） |
| 每节点成本 | 一个组件实例（data 域 + 方法） | 轻量行渲染（无组件开销） |
| 定制 | 模板完全自由 | 节点模板三级优先（原地 `x-tree-node` > `tree-node` 组件 > 内置默认） |

数据量大或需要成熟树交互时优先 `x-tree`；结构不是严格树形、或每层需要独立组件语义（独立 data / 方法 / 样式）时用递归组件。两者可组合——递归组件的某一层内部用 `x-tree` 渲染其子级。

## 常见问题

### 递归组件能和组件继承组合吗？

可以——`x-define:inherit` 声明的子组件照常可被递归实例化（继承发生在定义期，递归发生在实例化期，两个阶段正交）。详见[组件继承](./inherit.md)。

### 递归深度上限是多少？超了会怎样？

上限 100 层同名组件实例化深度，超出 `warn` + 停止该分支继续实例化。正常业务层级远达不到；触达通常意味着数据自引用环——先修数据。

### 每层实例的 props 变了会怎样？

props 按[单向注入](./instantiate.md)语义更新（对象按键覆盖）。树形场景里节点对象引用稳定，`child` 数组本身变化（增删节点）由 `x-for` 重建对应层的实例。
