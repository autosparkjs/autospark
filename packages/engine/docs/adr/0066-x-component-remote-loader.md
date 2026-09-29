# ADR-0066：x-component 远程直接实例化（loader 选项）+ 内置 error 组件

- **状态**：Accepted
- **日期**：2026-09-29
- **关联**：[ADR-0022](0022-x-component.md) 决策六（x-import 远程加载管线）、[ADR-0054](0054-component-define-instantiation-rename.md)（x-component 属性参数承载组件名、值专职 props）、[ADR-0007](0007-directive-options-and-modifiers.md)（loader 四形态声明与 `.global` 修饰符）、[ADR-0036](0036-action-descriptor-metadata.md) 决策 7（内置动作信号）、[ADR-0038](0038-x-loading-actions-option.md)（动作按钮先例）、[ADR-0058](0058-icon-symbol-and-icon-domain.md)（icon 注册表）、[CONTEXT.md](../../CONTEXT.md)（「远程直接实例化」「loader 选项」「loader 占位呈现」「内置 error 组件」词条）
- **共识来源**：grilling 五轮决策（Q1–Q21），本文即共识落盘。

## 背景

远程组件的现行用法是两步组合：`x-import` 发起加载注册，`x-component:名` 按名实例化——依赖未就绪时已有 loading 占位 + `component/registered` 重试机制（ADR-0022 决策六 / R6=B）。该组合功能完备，但每处使用都要写一个 import 壳元素，声明分散。

本决策给 x-component 增加**直接使用远程组件**的能力：经 `x-component-options.loader` 声明远程 url，一步完成「加载 + 注册 + 实例化」。同时补齐失败路径的缺省呈现——引入**内置 error 组件**（engine 初始化注册的全局组件，供 loader 及任意错误场景使用）。

## 决策

### 一、定位：纯声明糖，复用 x-import 管线

loader 不引入新的加载机制——内部复用 `importComponentsFromUrl` 全部既有设施：url 缓存、循环 import 检测、注册写入（作用域 / 全局）、`component/registered` 广播。加载的组件**照常进组件查找链**（供同 scope 其他 x-component 复用，url 多组件时指定名实例化、其余注册备用）。声明糖定位意味着：pending 占位（R6=B）、递归保护、异步时序全部天然继承，零平行逻辑。

### 二、语法：`x-component-options.loader`，值仍专职 props

ADR-0054 决策三「值专职 props」**不动**。url 走 ADR-0007 选项体系，形态：

```html
<!-- string 简写：字面量 url（isLiteralUrl 双轨，与 x-import 同构）/ 表达式 -->
<div x-component:like-button x-component-options.loader="/a.html"></div>
<!-- 对象（relaxed-json，经整包或成员属性） -->
<div x-component:like-button="{count: 1}"
     x-component-options="{ loader: { url: '/a.html', width: 120 } }"></div>
<!-- 成员属性表达式：响应式 url -->
<div x-component:like-button x-component-options.loader="loaderCfg"></div>
<!-- 全局注册 -->
<div x-component:like-button.global x-component-options.loader="/a.html"></div>
```

- **string 简写双轨**：以 `/`、`./`、`../`、`http(s)://` 开头等命中 `isLiteralUrl` → 字面量 url 直接加载；其余作表达式经 watch 求值（复用 `import.ts` 既有判定，避免 `/a.html` 被当正则）。
- **成员属性须单段**：`loader.url` 多段子路径写法不支持（`getDirectives` 既有约束）；响应式 url 写 loader 整体表达式。
- **`.global` 修饰符**：`x-component:名.global`（解析期注入 `options.global`，与 `.open` 同通道），语义对齐 `x-import.global`。

### 三、注册语义：「以此 url 为准」

loader 的语义是**该实例声明以 url 来源为准**，而非「确保可用」：

- 组件**已注册仍 fetch**，远程版**覆盖注册**（后续实例化用远程版；已实例化实例不受影响）；
- 覆盖已注册同名组件时 **warn**——统一加在 `importComponentsFromUrl` 注册循环（x-import 与 loader 同口径，同一覆盖语义不搞两套警告）；
- **首帧严格**：fetch 必然异步，首次实例化恒先显示 fallback 占位，注册完成后渲染 url 版本——渲染的永远是 url 版。

### 四、响应式 url

url 支持响应式（loader 表达式重求值）：

- url 变化 → **abort 旧请求**（x-import 的 AbortController 先例）→ 重新 fetch → 重实例化（宿主清空重建，**组件内部状态丢失**——与「组件名静态、条件切换用 x-if」（ADR-0054 决策二）同代价，已在语义上接受）；
- 新 url 内**无属性参数指定的同名组件** → 走 error 呈现；
- error 后 url 再变化 → 重新尝试（回到 fallback → fetch）；error **不自愈**——其他来源恰好注册同名组件不触发恢复，恢复途径仅 url 变化或重新编译。

### 五、loader 对象字段

```js
{
    url: "/a.html",          // 必需
    request: { headers: {...} }, // 整包透传 fetch（requestInit）；参与缓存 key（见决策九）
    fallback: ...,           // 加载中占位，见决策六；缺省 = x-loading
    error: ...,              // 失败呈现，见决策六；缺省 = 内置 error 组件
    width: 120, height: 40,  // 加载中宿主临时占位尺寸（防布局跳动），成功与出错均移除
}
```

### 六、loader 占位呈现（fallback / error 统一形态）

`fallback`（加载中）与 `error`（失败）的值形态统一：

- **HTML 字符串**：静态插入，**不参与编译**（占位内容无需响应性）；
- **`{ name, props }`**：引入具名组件（沿链查找），props 与引擎注入上下文 **`{ url, name, error }`** 合并，**引擎注入优先**（防用户 props 撞名污染语义）；url 响应式变化时占位组件的 `url` prop 同步更新（props 走响应式通道）；
- 无 `fallback` → 默认 x-loading 占位（复用「loading 组件」约定名机制）；
- `error` 缺省 → 内置 error 组件（决策七）；
- error 阶段引擎注入 `error`（Error 实例）与 `message`（引擎生成友好文案，含组件名与 url）。

### 七、内置 error 组件

engine 初始化**真内置**注册进全局组件表（区别于 loading 的「约定名 + CSS 兜底」模式——error 自带完整默认 UI），用户同名 `x-define` / `options.components` 声明经查找链顺序**天然覆盖**。亦可 `x-component:error` 显式实例化，渲染任意错误。

props 契约：`{ error: Error, message: string, icon?, hasRetry?, hasClose?, hasBack? }`

- `message`：引擎生成的友好文案；`error`：原始 Error 对象；
- `icon`：**图标名称**（现有 x-icon 机制渲染，未注册静默 miss）；
- `hasRetry` / `hasClose` / `hasBack`：**布尔显隐键**——`undefined`（falsy）时**不渲染对应按钮**。loader 场景注入 `hasRetry/hasClose`（true）；手动使用场景按需传布尔；
- **执行体走 action 通道，不入 props**：loader 场景把 `retry`（重新 fetch 当前 url）与 `close`（清除本实例 error、宿主清空，**同时照常广播 close 信号**——嵌套 overlay 内时语义自动兼容）注入实例 `scope.actions`，按钮 `@click` 经 getAction 命中；`back` 天然命中内置 action（决策八）；
- **函数值严禁入响应式 data 域**（实现期发现的 autostore 陷阱）：autostore 把 state 中的函数值当 computed，依赖收集（watch 读取）时**执行函数**——retry 注入 data 域时形成「失败重渲染 → 依赖收集执行 retry → 再失败」的无限循环（实测抓栈证实）。因此显隐用布尔键、执行体走非响应式的 action 通道；占位呈现 `{name, props}` 的用户 props 中的函数值也自动分流到非响应式 locals（防御）；
- 按钮点击经**既有动作信号体系**广播（对齐 ADR-0038 动作按钮先例）；
- error 呈现**替换宿主内容**（非覆盖层）——x-component 宿主是组件化身，失败时无用户内容可覆盖。

### 八、内置动作信号 `back`

内置动作家族（`yes` / `no` / `cancel` / `close`，ADR-0036 决策 7）新增 **`back`**：无信号载荷，点击即 `history.back()`，经同一动作广播体系注册/冒泡/总线广播。`close` / `yes` / `no` / `cancel` 已存在，不新增。

### 九、url 缓存 key 扩展

loader 支持 `request` 透传后，url 缓存 key 由裸 url 扩展为 **`url + 序列化(request)`**——同 url 不同请求参数不串缓存。无 `request` 时 key 退化为裸 url（x-import 既有行为不变）。

## 被否决的方案

- **值双语义分流**（`x-component:名="/a.html"` 值以 url 形态判定）：破坏 ADR-0054「值专职 props」的单一职责，同样写法含义随值形态漂移，工具链与可读性双输。
- **修饰符带值**（`.src="/a.html"`）：ADR-0007 决策五明确修饰符无值，带值统一走指令选项——语法不存在。
- **已注册跳过 fetch**（loader 退化为「确保可用」）：与「以此 url 为准」的声明语义矛盾，且 url 缓存下重复 fetch 成本可忽略。
- **首帧宽松**（先渲染已注册本地版，fetch 覆盖只影响后续实例）：首帧渲染的不是 url 版，与声明语义不一致；fallback 占位已为等待兜底体验。
- **error 用覆盖层**（与 fallback 的 x-loading 同机制）：宿主是组件化身空壳，替换内容语义更准（「这个位置的组件失败了」）。
- **新增全局 `close` action**：`close` 已是内置动作信号（ADR-0036），error 场景的 close 是实例注入的闭包行为 + 信号广播，无需新全局 action。
- **fallback 支持 loader 嵌套**（占位组件自己声明远程加载）：递归异步场景复杂度不成比例，YAGNI。
