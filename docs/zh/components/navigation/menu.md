# Menu 导航菜单

## 概述

Menu 是 AutoSpark 的官方导航菜单组件（组件库 P2 导航件，ADR-0018 清单权威表 navigation 行）：**items 数据驱动**任意层嵌套菜单树（ADR-0033 v2 重设计，废弃 v1 `<x-menu-item>` 组合式），**value 形态即语义**（`string` 单选激活 / `string[]` checkable 勾选集合），缩进折叠与弹层弹出双机制（`expandLevel` / `popLevel`），同级 check / icon 统一占位，collapsed 三档折叠，完整键盘导航（roving tabindex）。

- **items 数据描述**：`MenuEntry[]`——`item`（透传 button 全 props）/ `group`（纯视觉分组标题）/ `separator`（分隔线，`'-'` 字符串等价）；`children` 支持数组或 `SubmenuOptions` 配置对象（弹层 header/title/footer/padding/indent/slotDir 自定义），递归任意层；
- **value 双语义**：`string` → 单选激活（高亮当前项，受控 + `el.value` 桥 + 祖先链自动展开）；`string[]` → checkable 勾选集合（toggle 数组成员）；
- **层级机制**：`expandLevel` 初始展开到第 N 级（默认 1，可手动改）；`popLevel` 指定 `level > popLevel` 的子菜单走 popover 弹出（默认 0 全缩进折叠；弹层内更深层级继续级联）；`openKeys` 全受控展开态（显式键优先于 expandLevel 默认）；
- **collapsed 三档**：`0` 常规 / `1` 图标条（宽度动画 + tooltip + children 全弹层）/ `2` 单指示按钮 + 整菜单弹层；
- **trigger**：弹层触发 `hover`（缺省）| `click`（透传 popover；缩进域折叠组恒 click）。

router 隔离（ADR-0018 决策 6 约定 2）：纯状态驱动、不 import router——联动以配方交付（见下方 router 配方节，breadcrumb 同款约定）。

引入方式（依赖 `autospark.overlay.js` 与 `autospark.button.js` 先于本组件加载，聚合产物 `autospark.plugins.js` 无此问题）：

```html
<script src="/autospark/autospark.js"></script>
<script src="/autospark/autospark.overlay.js"></script>
<script src="/autospark/autospark.button.js"></script>
<script src="/autospark/autospark.menu.js"></script>
```

## 快速入门

```html
<x-menu x-model="active" :items="menu"></x-menu>
```

```js
new AutoSpark(document.body, {
    active: "home",
    menu: [
        { key: "home", label: "首页", icon: "file" },
        { type: "group", title: "组件" },
        { key: "nav", label: "导航", children: [
            { key: "n1", label: "指令" },
            { key: "n2", label: "组件" },
        ] },
        "-",
        { key: "set", label: "设置" },
    ],
});
```

`<x-menu>` 元素名快捷写法经 precompile 变换承载：静态属性折叠为 props（类型推断）、`:key="expr"` 响应式项以原始表达式拼进值对象，子内容（含 `template header` / `template footer` 具名插槽声明）随迁为插槽内容；**裸 `items='[…]'` JSON 字符串**走 `data-items` 通道（静态菜单树免状态声明）。`<x-menu-item>` 旧组合式已硬移除（ADR-0033 决策 1，0.x breaking）。

<demo html="components/navigation/menu/basic.html"/>

## 指南

### 菜单项 items

```ts
type MenuEntry =
  | MenuItem                                            // type 缺省 'item'；透传 button 全 props
  | { type: 'group';    title: string; icon?: string }  // 分组标题：纯视觉、不可折叠、无缩进层级
  | { type: 'separator' }                                // 分隔线（≡ '-' 字符串）
  | '-'

type MenuItem = {
  type?: 'item'
  key?: string                       // 状态锚点：value 激活/勾选、openKeys 展开按 key 定位
                                     // （无 key 项可渲染不可引用——控制台 warn）
  children?: MenuEntry[] | SubmenuOptions   // 数组 或 配置对象（递归任意层）
} & ButtonProps                      // label / icon / disabled / memo / tags / checkable /
                                     // checkStyle / loading / indent / caret / type / variant …

type SubmenuOptions = {
  header?:  string | '#模板id'       // 弹层头部：纯文本 或 template 内容引用
  footer?:  string | '#模板id'       // 弹层尾部：形态同 header
  title?:   string                   // 弹层标题行（仅弹层域显示）
  padding?: number | string          // 弹层内边距覆盖
  indent?:  number | string          // 缩进域缩进量覆盖（缺省 0.4em）
  slotDir?: 'vertical' | 'horizontal' // 分区方向逐层覆盖
  children:  MenuEntry[]             // 必需：真正的项列表
}
```

`group` 是**纯视觉分组标题**（不可点击、不产生缩进层级）；与 select 的 `group`（x-model-options 按字段聚合 optgroup）同名不同义。首尾分隔线自动修剪。

### 值通道：形态即语义

- **单选激活**（`value: string`）：点击非禁用叶子 → 更新 value + 双派发（`input` 非冒泡 x-model 回写；`change` 冒泡 `detail = { value }`）+ 关闭弹层链；外部 value 变化 → 激活迁移 + **祖先链自动展开**（antd 同款）；同值点击短路；
- **勾选集合**（`value: string[]`）：元素为 checkable 项 key；点击 toggle 数组成员 + `change` 派发（勾选不关弹层——调参非导航）；勾选视觉 = `item.checkStyle ?? 'check'`（menu 语境覆盖 button 全局缺省 `corner`）；
- 两形态互斥；`el.value` 劫持桥服务单值语域（数组消费走 `:value` + `@change` 惯用法）。

### 层级机制：expandLevel / popLevel / openKeys

- **层级计数**：菜单主体直接渲染的项 = level 1，其 children = level 2，依此递推；
- `expandLevel`（默认 1，0 = 全折叠）：初始展开到第 N 级（可手动改），运行时变更响应式生效；
- `popLevel`（默认 0）：`level > popLevel` 的子菜单走 popover 弹出（0 = 全部缩进折叠）；`expandLevel` 只作用于缩进域；弹层内更深层级继续级联弹出；
- `openKeys`（`Record<key, boolean>`）：**全受控双绑**——外部替换即应用（显式 `true`/`false` 优先于 expandLevel 默认）；内部展开/折叠 → 更新 openKeys + `expand` 事件（`detail = { key, expanded }`）；
- items 运行时整体替换：**按 key 保留展开态**（勾选态真源在 value 数组，不动）。

### 弹层交互

- `trigger`（默认 `hover` | `click`）只管弹层域，直接映射 popover 同名选项；缩进域折叠组恒 click（button `caret` 尾箭头指示，展开朝下/收起朝右，弹层父项恒朝弹出方向）；
- 关闭行为：叶子选中 → 关闭整条级联链（click 模型经 popover 原生「外点关闭」链即刻全关；hover 模型面板随指针离开自然收起）；有 children 的项点击 toggle；勾选类叶子**不关**弹层；Esc 逐层（popover 全局栈）；点击外部整链关；
- **依赖声明**：弹层呈现须同引 `autospark.overlay.js`（x-popover，ADR-0128）——缺席时缩进域照常、弹层域无效（与 dropdown 家族同口径）。

### 同级统一占位

同级任一项 `checkable` → 全级统一 check 占位列；同级任一项有 icon → 全级统一图标占位列；**check 列在 icon 列左侧**。占位经 button `checkMark`（纯视觉占位通道）与占位图标 + `visibility: hidden`（保宽不可见）承载。

### collapsed 三档

| 档 | 形态 |
|---|---|
| `0` | 常规模式（缺省） |
| `1` | 图标条：宽度过渡动画收窄，label 隐藏（button `labelPos: none` 既有通道自动转悬停提示），children 一律 popover，激活/勾选 = 图标染激活色 |
| `2` | 单指示按钮：原菜单区收成一个 ☰ 按钮，点击弹出完整菜单弹层（不含 header/footer；层级以弹层首层为 level 1 重新计数）——v2 已知边界：弹层内容链待引擎侧复查，当前以 0 / 1 两档为完整可用形态 |

`collapsed` 支持响应式绑定（联动汉堡按钮切换）。collapsed=1/2 的弹层内 `expandLevel` / `popLevel` 以弹层首层为 level 1 **重新计数**。

### horizontal 与 slotDir

- `mode: vertical（默认） | horizontal`：横排 level 1，子级全部弹层（level 2 `bottom-start` 向下、level 3+ `right-start` 向右级联）；`expandLevel` / `popLevel` / `openKeys` / `collapsed` **静默不适用**（文档明示，不 warn；mode 可响应式切换）；
- `slotDir: vertical（默认：header 上 / footer 下） | horizontal（header 左 / footer 右）`：作用于本体 header/footer 插槽位置与各级弹层内部分区；SubmenuOptions.slotDir 逐层覆盖弹层。

### 键盘导航

| 键 | 行为 |
|---|---|
| ↑ / ↓ | 同级项间移动焦点（跳过分隔线/分组/禁用项，首尾环绕） |
| → | 有子菜单项：缩进域展开并焦点入子级首项 / 弹层域打开并焦点入首项 |
| ← | 收起当前子层并焦点返回父项（面板内为关闭本面板） |
| Enter / Space | 激活项（原生 button 语义） |
| Esc | 逐层关弹层（popover 全局栈只关栈顶） |
| Home / End | 焦点跳本级首项 / 末项 |

roving tabindex（容器托管 Tab 序，方向键移动真实焦点）；type-ahead 字母导航不做。

<demo html="components/navigation/menu/modes.html"/>

### 主题化

继承 `autospark.base`（ADR-0134）主题档位六键（`data-size` / `data-shadow` / `data-radius` / `data-spacing` / `data-dark` / `data-colorized`）；样式三级回退链（ADR-0129）——`var(--auto-X, var(--asc-menu-X, 校准兜底值))`，暗色兜底变体在场，接 `@autospark/theme` 自动换肤。

### router 配方

激活态映射路由（纯状态驱动约定，组件不 import router）：

```html
<x-menu :value="route.path" :items="navItems"
        @change="router.push($event.detail.value)"></x-menu>
```

路由变化写 `route.path` → value 受控迁移（激活项祖先链自动展开）；点击叶子 → `change` → `router.push`。

## 参考

### 属性

| 属性 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `items` | `MenuEntry[]` | `[]` | 菜单树数据（状态引用注入 / 裸 JSON 字符串 `data-items` 通道） |
| `value` | `string \| string[]` | `""` | 单选激活 key / checkable 勾选集合（形态即语义，受控） |
| `expandLevel` | `number` | `1` | 初始展开到第 N 级（缩进域默认策略；0 全折叠） |
| `popLevel` | `number` | `0` | `level > popLevel` 的子菜单走 popover（0 全缩进折叠） |
| `openKeys` | `Record<string, boolean>` | `{}` | 全受控展开态（显式键优先于 expandLevel 默认） |
| `collapsed` | `0 \| 1 \| 2` | `0` | 常规 / 图标条 / 单按钮+整菜单弹层（响应式可切） |
| `trigger` | `'hover' \| 'click'` | `'hover'` | 弹层触发方式（透传 popover；缩进域折叠组恒 click） |
| `mode` | `'vertical' \| 'horizontal'` | `'vertical'` | 排列形态（horizontal 下结构 props 静默不适用） |
| `slotDir` | `'vertical' \| 'horizontal'` | `'vertical'` | header/footer 分区方向（SubmenuOptions.slotDir 逐层覆盖弹层） |

### 事件

| 事件 | 冒泡 | detail | 说明 |
|---|---|---|---|
| `change` | ✓ | `{ value }` | 叶子激活（单值）/ 勾选集合变化（数组）；外层一行回写惯用法 |
| `input` | ✗ | — | x-model 回写通道 |
| `expand` | ✓ | `{ key, expanded }` | 缩进域折叠组展开态变化（内部切换派发；外部替换不广播） |

### Slots

| 插槽 | 说明 |
|---|---|
| `header` | 顶部（slotDir=horizontal 时左端）自定义区，`collapsed=2` 隐藏 |
| `footer` | 底部（slotDir=horizontal 时右端）自定义区，`collapsed=2` 隐藏 |

### 已知边界（v2）

1. `collapsed=2` 的整菜单弹层内容链待引擎侧复查（面板桥对组件模板内层宿主的数据可达性），当前以 0 / 1 两档为完整可用形态；
2. hover 模型下叶选后弹层不即刻关闭（随指针离开自然收起）——hover 无 click 监听，「选完即走」语义由指针离开承载；
3. 面板内缩进域折叠组（collapsed 重计下 `popFrom > depth` 的层）的子级深层递归受桥面板表达式域限制（常规 popLevel 级联不受影响）；
4. items 的**原地变更**（同引用改字段）不触发影子树重建——修改请整体替换（状态锚点语义，按 key 保留展开/勾选态）。
