# ADR-0055：组件 setup 段名词汇翻转（state() 响应式 / data 私有）

- **状态**：Superseded by [ADR-0057](0057-component-single-reactive-data.md)（2026-09-24 撤销本 ADR 段名决策——data 回归响应式容器名、私有数据改顶层变量、this.state 更名 globalState；回摆是有意的，正文保留为决策当时的记录）
- **日期**：2026-09-23
- **关联**：[ADR-0022](0022-x-component.md)（组件系统，本 ADR 更名其决策二-3 的 data/locals 段词汇）、[ADR-0031](0031-script-type-namespace.md)（旧写法 warn + 剪枝的处置惯例）、[ADR-0054](0054-component-define-instantiation-rename.md)（同日组件体系重塑的姊妹决策）、[CONTEXT.md](../../CONTEXT.md)（`<script setup>` 词条）
- **共识来源**：用户实施期直接拍板（ADR-0054 实施中途追加）

## 背景

ADR-0022 的 `<script setup>` 段名沿用了 Vue 习惯：`data()` 声明响应式状态、`locals` 声明非响应式局部变量。问题：

1. **词汇错位**：AutoStore 世界观里 **state 才是「响应式状态」的代名词**（`engine.store.state`、`this.state`），组件的响应式工厂却叫 `data()`——「改了会更新的」与「改了不更新的」都以 data 相称，教学上必须靠注释区分。
2. **locals 冷僻**：定时器句柄/缓存这类「实例私有数据」用 locals 命名不够直觉。

## 决策

### 一、段名翻转

| 新段名 | 形态 | 语义 | 注入目标 | 旧段名 |
|---|---|---|---|---|
| `state()` | **工厂函数** | 响应式状态：模板可见、修改驱动更新、先于 props 注入 | `scope._data`（响应式状态域） | `data()` |
| `data` | **静态对象** | 非响应式组件私有数据：模板读不到、仅 `this.<键>` 访问 | `scope._locals` | `locals` |

```javascript
{
    state() { return { time: '...' } },   // 响应式：改了驱动更新
    data: { timer: null, cache: {} },     // 非响应式：改了不更新，组件私有
}
```

### 二、this 访问器不变（两个层面）

`this.data`（聚合视图：state + props + 全局 state，响应式可写）与 `this.state`（全局 `engine.store.state`）**保持既有语义不变**——setup 段名是**声明词汇**，this 访问器是**实例访问层**，两者同名不同物。文档以「聚合视图 vs 私有数据段」显式区分（component.md「组件状态」「组件数据」两节）。

### 三、旧写法处置：warn + 剪枝（ADR-0031 同款）

- `data()` 函数 → warn「已更名为 state()」，**忽略不注入**（若静默当 data 对象会注入函数引用、产生隐蔽破坏）；
- `locals` 对象 → warn「已更名为 data」，忽略不注入；
- `state` 误写为对象（非函数）→ warn 忽略。

### 四、内部实现零结构变更

引擎内部字段（`scope._data` 响应式域、`scope._locals` 私有容器、`$scopes` 挂载、props 合并管道）**全部不动**——只改 `ComponentSetup` 接口段名、`mergeComponentSetups` 段分类、`injectComponentSemantics` 的读取键。行为等价，词汇翻转。

## 测试

既有组件/边界/overlay 套件全量改写段名（含手写 ComponentDef 字面量的用例）；新增 2 用例：旧段 `data()` warn 剪枝（模板读不到）、旧段 `locals` warn 剪枝。

## 废止

- ADR-0022 **决策二-3 (10)** 的 `locals` 段名与决策四-1 的 `data()` 段名——机制（非响应式私有容器、工厂函数注入响应式域）不变，词汇由本 ADR 翻转。
