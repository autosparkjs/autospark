# Dropdown 下拉菜单

## 概述

Dropdown 是 AutoSpark 的官方下拉菜单组件（组件库 P3 下拉族 navigation 件，ADR-0027）：**动作触发型轻量菜单**——触发区是默认插槽（任意内容：button / 文本 / 图标，包裹交互），点击或悬停弹出菜单面板。面板**不自建弹层**——复用 [x-popover 指令](/zh/guide/directives/x-popover.md)机制呈现（select 同款协议，ADR-0022）：面板外点击 / ESC 关闭机制继承，`trigger`（hover 缺省 / click）与 `placement`（12 方向）透传 popover。

**与 [Menu 导航菜单](./menu.md) 的边界**（ADR-0027 决策 6）：menu = 页面导航区**常驻**组件（路由激活态映射、子菜单展开态、collapsed 形态，自身持有 value / openKeys 状态域）；dropdown = 按钮旁弹出的**动作菜单**（即点即走、`select` 后即复位高亮，无激活态持久语义）。菜单项语义自持（不嵌套消费 autospark.menu）：`items` 声明面（icon / disabled / divided 分隔线 / danger 危险色）+ WAI-ARIA menu 键盘漫游 + `select` 事件（`detail = { key, item }`）。

`items` 双形态：状态引用注入（`:items="list"`）或子元素声明（`<x-dropdown-item>`，含裸 `items` JSON 属性，经 precompile 变换折叠——字面量数组 props 死环规避，menu 同款）。视觉全走 `--auto-*` 语义变量三级回退链（ADR-0129）；面板样式与 select 下拉面板同款、菜单项语义色 token 与 menu 同源；**不设自有尺寸属性**——经主题通道 `data-size` 挂任意祖先容器全档位跟随；暗色态整页经主题暗色模式跟随（弹层在 body 容器渲染，**局部** `data-dark` 容器不覆盖弹层）。空态文案走 i18n 词典（`dropdown.empty`，回退「暂无数据」）。

引入方式：引擎之后加载 `<script src="/autospark/autospark.dropdown.js"></script>`（自举注册）；**菜单面板呈现依赖 x-popover 指令，须同时引入 `autospark.overlay.js`**（聚合产物 `autospark.plugins.js` 无此问题）。

## 快速入门

引擎与 overlay 之后加载组件脚本即注册完成。推荐**元素名形态**：触发区内容写在标签内（默认插槽），静态属性直写、绑定走 `:属性`：

```html
<script src="autospark.js"></script>
<script src="autospark.overlay.js"></script>
<script src="autospark.dropdown.js"></script>

<x-dropdown :items="actions" trigger="click">
  <button type="button">更多操作 ▾</button>
</x-dropdown>
```

```js
new AutoSpark(el, {
  actions: [
    { key: "new", label: "新建", icon: "file" },
    { key: "copy", label: "复制" },
    { key: "del", label: "删除", danger: true },
  ],
});
```

`x-component:autospark.dropdown="{ ... }"` 值对象形态同样可用（触发区内容为宿主子内容）。

<demo html="components/navigation/dropdown/basic.html"/>

## 指南

### items 菜单项（双形态）

**类型**: `Array<{ key, label, icon?, disabled?, divided?, danger? }>`
**默认**: `[]`

**形态一 · 状态引用注入**（`:items="list"`）：`key` 是触发标识（`select` 事件携带）、`label` 呈现文案、`icon` 图标名（x-icon 域）、`disabled` 淡化不可选（键盘漫游跳过）、`divided` 顶部分隔线、`danger` 危险色。支持运行时整体替换（面板列表热更新）。

**形态二 · 子元素声明**：`<x-dropdown-item>` 静态标量（含裸 `items` JSON 属性同通道），经 precompile 变换折叠为 items JSON——字面量数组 props 死环规避（menu 同款）；`:items` 绑定在场时声明形态让位：

```html
<x-dropdown>
  <span style="cursor: pointer">悬停展开 ▾</span>
  <x-dropdown-item key="refresh" label="刷新" icon="refresh"></x-dropdown-item>
  <x-dropdown-item key="edit" label="编辑" icon="edit"></x-dropdown-item>
  <x-dropdown-item key="export" label="导出" divided></x-dropdown-item>
  <x-dropdown-item key="remove" label="删除" danger disabled></x-dropdown-item>
</x-dropdown>
```

### trigger 触发方式

**类型**: `'hover' | 'click'`
**默认**: `'hover'`

透传 popover 触发模型（antd 同款缺省）：`hover` 悬浮开关（离开「触发区∪面板」共享域经宽限后关闭）；`click` 点击开关（再点触发区 / 面板外点击 / ESC 关闭）。触屏场景请用 `click`。可绑定状态热切换（打开中的面板不重估，切换自下一次触发生效——机制语义）。

### placement 定位方向

**类型**: `string`（popover `at.placement` 12 方向）
**默认**: `'bottom-start'`

面板相对触发区的弹出方向（`bottom-start` 左对齐下拉惯例 / `top-start` / `right-start` / `bottom-end` 等 12 方向），透传 popover 锚定（视口防溢出 shift / 翻转 flip 机制继承）。

```html
<x-dropdown :items="actions" placement="top-start" trigger="click">
  <button type="button">向上弹出 ▴</button>
</x-dropdown>
```

### 触发区（默认插槽）

触发区内容是使用者的任意元素（button / 文本 / 图标），组件以包裹 span 承载交互：popover 宿主 + 键盘监听点 + `tabindex=0` 聚焦位（纯文本触发区也键盘可达；button 内容时包裹层多一个 tab 停靠点，ADR-0027 边界声明）+ `aria-haspopup="menu"` / `aria-expanded`（随开合同步）。

### 键盘导航（WAI-ARIA menu 模式）

触发区聚焦后：

| 键 | 行为 |
| --- | --- |
| `ArrowUp` / `ArrowDown` | 未开先开菜单；已开移动高亮（跳过禁用项，首尾环绕），高亮项滚动跟随可见 |
| `Enter` | 开态：触发当前高亮项（`select` + 关面板）；无高亮时关面板并 `preventDefault`（防误触发表单提交）；关态原生放行（触发内容自身的按钮语义归使用者） |
| `Escape` | 关闭菜单（popover 打开栈机制继承，不拦截） |
| `Tab` | 自然移焦 |

面板内鼠标悬停同样驱动高亮（与键盘漫游同通道）。hover 触发模式下键盘开面板经合成悬浮通道（含 delayShow 延迟）。

### select 事件（detail = { key, item }）

点击菜单项或 Enter 触发时冒泡派发：`detail = { key, item }`（item 为声明项的浅拷贝快照）——选中即关面板并复位高亮（动作菜单无激活态持久语义，重开从头漫游）；禁用项不触发。消费监听挂**内层包裹元素**（engine 根元素 `@事件` 绑定不生效）：

```html
<div @select="onMenuSelect">
  <x-dropdown :items="actions" trigger="click">
    <button type="button">操作 ▾</button>
  </x-dropdown>
</div>
```

```js
new AutoSpark(el, {
  actions: [...],
  onMenuSelect(e) {
    const { key, item } = e.detail;
  },
});
```

### disabled 禁用

**类型**: `boolean`
**默认**: `false`

整体退出交互：触发区退出焦点序（tabindex=-1）+ CSS 拦截开面板（click 与 hover 两模型一并阻断）+ 整体淡化。

### 主题化

尺寸档位：任意祖先容器挂 `data-size="x-small | small | medium | large | x-large"`（theme 手动通道）触发区生效（触发区内容随档缩放）；菜单面板在 body 容器渲染，跟随**页面级**主题档位（局部容器档位不覆盖弹层，与暗色边界同构）；暗色：整页经主题暗色模式自动跟随（弹层在 body 容器，**局部** `data-dark` 容器不覆盖弹层）。使用者覆盖通道 `--asc-dropdown-*`（如 `--asc-dropdown-item-hover-bg`、`--asc-dropdown-max-height`、`--asc-dropdown-item-danger`）；菜单项语义色 token 与 menu 同源（hover 底 `--auto-hover-bgcolor` / danger 染 `--auto-danger-color` / 分隔线 `--auto-border-color`）。

## 参考

### 属性

| 属性 | 类型 | 默认 | 说明 |
|---|---|---|---|
| items | `Array<{ key, label, icon?, disabled?, divided?, danger? }>` | `[]` | 菜单项（状态引用注入或 `<x-dropdown-item>` 声明形态，支持运行时整体替换） |
| trigger | `'hover' \| 'click'` | `'hover'` | 触发方式（透传 popover 触发模型，可热切换） |
| placement | `string` | `'bottom-start'` | 面板弹出方向（popover at.placement 12 方向透传） |
| disabled | `boolean` | `false` | 禁用（退出焦点序 + 拦截开面板 + 淡化） |

### 事件

| 事件 | 参数 | 说明 |
|---|---|---|
| select | `detail: { key, item }` | 菜单项触发（点击 / Enter）冒泡派发；选中即关面板 + 高亮复位 |

### Slots

| 插槽 | 说明 |
|---|---|
| —（默认） | 触发区内容（任意元素：button / 文本 / 图标——包裹层承载 popover 宿主与键盘交互） |
