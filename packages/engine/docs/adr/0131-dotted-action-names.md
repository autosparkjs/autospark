# ADR-0131: 点号名 action（ACTION_RE 扩展）

- 状态：已接受（Accepted，2026-11-01）
- 日期：2026-11-01
- 关联：plugins 包 ADR-0011（resource 插件——本决策的第一消费者）；ADR-0036（ActionDesc 规范化）、ADR-0010/0011/0012（action 双通道广播与全局/局部分流）、ADR-0031（script type 命名空间化）

## 背景

resource 插件（plugins ADR-0011）把服务端资源操作转换为 action 暴露给模板：一个资源 `order` 展开为 `order.get` / `order.add` 等方法。但 `x-on/eval.ts` 的 `ACTION_RE` 只匹配**裸标识符**——`order.add(args)` 不走 action 通道，落入 `with(data)` 表达式兜底按 state 属性访问求值；且 actions 不注入表达式求值上下文（`getContext()` 不含 actions）。资源方法若要可调，只能在「扩展 ACTION_RE 支持点号」「资源对象注入求值上下文」「换调用语法」三条路中选择。

## 决策

### 决策 1：ACTION_RE 扩展点号，资源方法注册为平铺点号名 action

`ACTION_RE` 从 `^Identifier(args)?$` 扩为 `^Identifier(.Identifier)*(args)?$`——`order.add(1, x)` 命中后以**整名** `order.add` 查 `getAction`（Map 查找天然支持任意字符串键），未命中仍落表达式兜底。**查找顺序不变**（method → action → 表达式兜底），现有行为零破坏：`user.name`（点号属性访问）命中后 method/action 均未注册同名时照常走兜底，仅当注册了点号名 action 才分叉——分叉即特性。

资源方法以**平铺点号名**（`order.get` 等）注册进现有容器（`scope.actions` / `engine.actions` / 插件全局表），零新容器；经 `_normalize` + `buildAction` 包装后即标准 action，三通道（`actions/order.get/pending|resolved|rejected` 信号、`action:order.get` DOM 冒泡、`@click.feedback` 返回值捕获）全部继承。

### 决策 2：x-model 的 ACTION_RE 复制件**不**跟随扩展

`x-model.ts` 存在同构复制件（注释自称复用 x-on 的 ACTION_RE）。x-model 的 get/set 是**状态绑定语义**（input 事件回写 state），无点号 action 用例——保持裸标识符，注释标注分叉（YAGNI；将来有需要再扩，两处正则各自演进）。

### 决策 3：调用边界即特性边界

点号名 action 只在**事件表达式顶层**可达；作为子表达式内嵌（`x-text="order.get(1).title"`）不可达——资源不在表达式求值上下文中。这是纯 RPC 语义（plugins ADR-0011）的自然推论：资源调用是命令而非派生数据源，派生取值应由调用方把结果写入 state 后绑定。

## 后果

- **兼容性**：正则放宽对存量模板无行为影响（未注册点号名 action 时 `a.b(...)` 照旧走表达式兜底）；`a(x).b(y)` 等怪匹配形态与扩前一致（argsSrc 吞到末括号，行为不变）。
- **命名空间**：点号进入 action 名合法域——`order.get` 与「资源 order 的方法 get」的约定属 plugins 层词汇，engine 只认字符串键；引擎内置 action（yes/no/cancel/close）无点号，无冲突面。
- **信号名**：点号 id 直接嵌入 `actions/<id>/<verb>`（如 `actions/order.get/pending`）；FastLiteEvent 通配 `actions/*/pending` 的 `*` 匹配单段任意字符（含点号），已验证可订阅。
- 局部 action 的 ADR-0012 分流（只 DOM 冒泡不进总线）对点号名同样适用——局部资源方法的信号消费走 DOM 通道。
