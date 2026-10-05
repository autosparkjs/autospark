# ADR-0087：组件全局样式（`<style global>`）

- 状态：已采纳
- 日期：2026-10-04
- 关联：[ADR-0022](0022-x-component.md)（组件作用域 CSS / 样式绑定 / `<style>` 提取）、[ADR-0054](0054-define-formal.md)（x-define 声明族）、[ADR-0081](0081-component-define-inherit.md)（继承 styles 拼接语义）、[ADR-0086](0086-runtime-component-registration.md)（注册路径族与 `registerComponentDef` 收口）

## 背景

组件 `<style>` 此前只有 scoped 一种形态（ADR-0022 决策四-4）：选择器改写加 `[data-cmp-{id}]` 后缀、实例化期按 defName 缓存 + 引用计数注入 head。组件若需向页面贡献**全局规则**（`@keyframes`、跨组件主题类、供外部内容使用的公共类），只能把样式搬到页面 `<head>` 手写——破坏组件自包含性，x-import / `registerComponent` 加载的远程组件更是无处安放全局样式。

## 决策

### 一、`global` 布尔属性开启全局注入；默认行为不变

`<style global>` 不做 scoped 改写；无 `global` 的 `<style>` 维持既有 scoped 行为。多个 `<style>` 标签可混用（每标签独立分流：scoped / global / 带 id 的 global）。`global` 是原生标签的布尔属性，与 actions 脚本的 `global` 属性、`x-icons.global` 同惯例。无 `global` 的 `id` 静默忽略（HTML 合法属性，用户可能另有用途）。

### 二、注册时注入（声明即生效，无需实例化）

global 样式是**定义级资源**（与 `<script setup>` 同级提取），在组件定义注册时注入——页面中尚无 `<x-component>` 实例也生效；x-import / loader / `engine.registerComponent` 经同一注册路径天然覆盖。注入收口在 `engine.registerComponentDef(def)`（所有注册路径的公共后置步骤，含继承挂起排水后的 `registerResolved`），不在 `_collectComponent` 内联——避免五条注册路径各自接线。

### 三、容器聚合：无 id 合并共享容器，带 id 独立容器，同 id 追加

- 无 id 的 global 段（跨组件、同组件内多个）合并进**单一共享容器** `<style id="autospark-styles">`（HTML 同 id 多标签非法，且浏览器少解析样式表）；
- `<style id="xx" global>` 注入为独立容器 `<style id="xx">`——「共享命名主题样式池」是自然用法；
- 同 id 多段按声明序**追加**，不覆盖。

`autospark-styles` 命名已核查不与引擎既有 document 级资产（`autospark-error` / `autospark-animate-styles` / `autospark-icon-sprite`）撞名。

### 四、记账模型：`(styleId, engine, defName)` 三级段表；覆盖声明整组替换保位

内存账本 `Map<styleId, Map<engine, Map<defName, string[]>>>`（模块级），任何变更后重写容器 `textContent`（全体贡献者的段拼接）：

- **engine 维度**：多 engine 共页共享同一容器元素，`destroy()` 只移除本 engine 的段、重写容器，不误伤其他 engine；某容器段清空则移除该 `<style>` 元素；
- **defName 维度**：同名组件覆盖声明（ADR-0022 决策四-4 后者覆盖语义）时，该 defName 的段**整组替换**——与 scoped 侧按 defName 缓存天然覆盖的行为对齐，防被覆盖组件的幽灵样式；Map 同 key 重写保持插入序，注入位置不变。

### 五、生命周期挂 engine：destroy 统一移除，运行期常驻

不沿用 scoped 的引用计数模型——那是为「样式只作用于实例」设计的，global 无实例对应语义。engine 存活期常驻（页面反复实例化/卸载组件不产生样式表抖动），`destroy()` 一次性清理。

### 六、继承链沿用 styles 拼接语义，跨 def 重复不去重

`x-define:inherit` 的 styles 父子拼接（子在后）照常作用于对象数组（global/id 元数据随段携带）。父组件独立注册 + 子组件继承时同一段内容会注入两次——**接受重复**（CSS 规则幂等、仅多几十字节），与 scoped 继承现状（拼接不去重）对称；内容寻址去重需多一层记账，收益不抵复杂度。

### 七、边界行为

- global 段中的 `bind(expr)` **不支持**：warn + CSS 原样保留（非法声明由浏览器丢弃，不影响其余规则）。变量挂组件根与 global 选择器常命中组件外元素语义矛盾；挂 `:root` 则多实例写同一全局变量必然打架（ADR-0022 决策四-4.1 的每实例隔离模型在全局语境无对应物）；
- 仅 x-define 内生效：编译普通子树遇 `<style global>`（非组件定义收集路径）warn + 不注入；
- CSS 文本原样注入：不压缩、不去注释、不排序。

## 实现要点（防再踩）

1. `ComponentDef.styles` 由 `string[]` 改对象数组 `{ css, global, id? }`——消费方两处：compiler 实例化路径过滤 `!global` 段喂 `injectComponentStyle`、inherit 拼接（数组拼接不变）；`styleBinds` 提取只对 scoped 段跑 `extractStyleBinds`；
2. global 段的 `bind(` 检测在 `buildComponentDef` 提取期做（不入 bindMap、不产生 styleBinds）；
3. 账本重写 textContent 时必须**遍历全体 engine** 的段（每 engine 独立重写会抹掉他人贡献）；
4. `registerComponentDef` 收口注入时注意继承挂起路径：父未就绪时 def 未注册、global 段不注入，排水成功 `registerResolved` 后经同一方法注入；
5. 容器元素查找用 `querySelector("style#...")`，id 含特殊字符时 CSS 转义（对齐 `scopedStyle.cssEscape`）。

## 修订记录

- **scoped id 改 def 级稳定值**（实施期修订）：`styles` 对象化改造时发现既有 scoped 机制的隐患——`injectComponentStyle` 按 defName 缓存改写样式，但改写用的 `data-cmp-{id}` 取**实例 scope.id**，二次实例化打的新属性与缓存样式失配。修订为 `componentScopedId(defName)`（def 级稳定 id）：同 def 的全部实例共享同一属性后缀，与「按 defName 缓存一份样式」的既有模型对齐（`mountComponentScopedAttr` 与 `injectComponentStyle` 统一改传该值）。

## 被否决 / 演变的方案

- **首次实例化时注入**（与 scoped 同步走 `injectComponentStyle`）：global 语义不依赖实例，声明即生效才是「全局」；
- **沿用引用计数移除**：无实例对应语义，模型空转；
- **同 id 后者覆盖**：共享主题池场景互相误伤，追加语义与共享容器一致；
- **内容寻址去重**（段 key = id + 内容 hash + 引用计数）：继承场景重复无语义危害，记账复杂度不抵收益；
- **bind 挂 `:root` / 挂组件根**：多实例竞写全局变量 / 选择器命中域与变量挂载域矛盾；
- **普适收集**（任意模板位置的 `<style global>` 都注入）：需求就是组件的声明性资源；扫描 compiler 全主干收益不明；
- **`def.styles` 之外另立 `globalStyles` 字段**：消费方（inherit 拼接、实例化过滤）都需全量看 styles，拆字段制造两处真相。

## 语义代价（有意接受）

1. **注册即生效**：组件从未实例化、其 global 样式也在页面生效（全局语义的直接推论）；
2. **继承重复注入**：父段经父 def 与子 def 各注入一次（字节浪费，CSS 幂等）；
3. **global 段无响应式**：`bind()` 不可用，动态值须回到 scoped 段或 `:style`；
4. **多 engine 共容器**：同 id 容器内段交错按 (engine, defName) 插入序——只保证 engine 内声明序，不保证跨 engine 全序。
