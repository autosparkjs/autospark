# ADR-0057：组件单一响应式数据域（data 回归 / 顶层私有变量 / this 上下文更名）

- **状态**：Accepted（已实施，1311 测试通过）
- **日期**：2026-09-24
- **关联**：[ADR-0022](0022-x-component.md)（组件系统）、[ADR-0053](0053-component-data-boundary.md)（数据边界——本 ADR 零改动其机制）、[ADR-0054](0054-component-define-instantiation-rename.md)（x-define/x-component 语法）、[ADR-0055](0055-component-setup-state-data.md)（**本 ADR 显式撤销其段名决策**）、[ADR-0056](0056-x-slot.md)（插槽豁免，编号相邻但正交）、[CONTEXT.md](../../CONTEXT.md)（`<script setup>` / `this.globalState` 词条与已废弃清单）
- **共识来源**：grilling 会话用户逐项拍板（Q1~Q13）

## 背景

ADR-0055 刚完成段名翻转（`data()`→`state()`、`locals`→`data`），但双轨段名本身仍在：响应式容器与非响应式容器同置一个 setup 对象，「`this.data` 到底是谁的数据」（聚合视图混入全局 state）依旧语义含混，且 methods 内没有直达 props 的通道。用户实测后判定：**混乱的根源是双轨与词汇错位，不是翻转方向**。

## 决策

### 一、`data` 成为唯一响应式数据容器（撤销 ADR-0055 段名决策）

| 段 | 形态 | 语义 | 注入目标 | 旧对应物 |
|---|---|---|---|---|
| `data` | **对象字面量或工厂函数**（双形态） | 响应式数据：模板可见、修改驱动更新、先于 props 注入；字面量实例化时**深克隆**（多实例不共享嵌套引用）、工厂每实例调用 | `scope._data`（响应式数据域） | `state()` |
| **setup 顶层其余键** | 任意值（函数即私有方法） | 非响应式私有变量：模板读不到、仅 `this.<键>` 访问、与内置键重名 warn+忽略 | `scope._locals` | 旧非响应式 `data: {}` 段 |

**命名回摆是有意的**：ADR-0055 的理由（「state 才是响应式的代名词」）在 AutoStore 世界观内成立，但组件语境下 `data` 是组件数据的行业正名（Vue/Angular/Alpine 通识），双轨段名（`state()`/`data`）要求用户靠注释记忆哪个响应式——回摆后规则一句话讲完：**data 响应式、顶层变量私有**。本 ADR 显式撤销 0055 的段名翻转，防止后人把回摆当 bug 改回去。

`state()` 旧写法 warn + 剪枝（ADR-0031 同款）；`state` 非函数值不再是保留键（可作顶层私有变量名，文档 Avoid 提示规避）。

### 二、this 上下文更名与别名

| 键 | v2 语义 |
|---|---|
| `this.data` | **聚合视图**（机制零改动，ADR-0053 边界照旧）：自有 data+props → 祖先近层 → 全局 state；封闭组件 = 自有 + 全局 |
| `this.props` | `this.data` 的**完全等价别名**（同一对象引用，`===` 成立；props 键位于聚合自有层） |
| `this.globalState` | 全局树**无遮蔽明确通道**（`engine.store.state`；聚合同名键自有层优先遮蔽，取全局值用它） |
| `this.state` | **移除**——组件 Proxy 与 **action ctx 一并更名**（两个上下文对同一全局树不得异名）；内部 `scope.state` getter 同步更名 |

`props`/`globalState` 加入 FRAMEWORK_KEYS（禁整体覆盖 warn）。

### 三、边界机制零改动

ADR-0053 的 open/封闭、`dataContext`（host/declarer）、三处收口全部不动——本 ADR 只换 `_data` 与 `_locals` 的**内容来源**。聚合优先级链（本层 locals > `_data` > 祖先近层 > 全局 state）读写同序，不变。

### 四、props 更新协议不变

浅值比较、值无变化跳过、只覆盖出现过的键（ADR-0054 决策三）——只换数据容器，不动更新协议。

## 测试

全量迁移 6 测试文件（`state()` → `data`/`data()`；静态 `data:` → 顶层私有；`this.state` → `this.globalState`）；ADR-0055 的 2 个旧写法 warn 断言**翻转为合法行为断言**；新增：props 别名同一性、globalState 通道、重名 warn+忽略、state() 剪枝、data 响应式/私有变量非响应式对照。1311 pass / 0 fail。

## 废止

- ADR-0055 **决策一**（段名翻转）与**决策三**（data()/locals 废弃处置）——其「this 访问器不变」的判断（决策二）被本 ADR 决策二更名终结；ADR-0055 作为决策当时的记录保留正文。
- ADR-0022 决策二-3 的「无独立 `this.props`」——`this.props` 以 data 别名形态存在（非独立域）。
