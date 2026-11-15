# Menu 导航菜单

## 概述

Menu 是 AutoSpark 的官方导航菜单组件（组件库 P2 导航件，ADR-0018 清单权威表 navigation 行）：items 数据驱动菜单树（**一层子菜单嵌套**），**受控 value 单选**（`el.value` 桥 + `change` 事件 `detail = { value }` + `input` 回写 x-model），带 children 的父项点击展开/收起，激活值指向子项时**祖先链自动展开**。

两形态（统一收敛到 items 数据面渲染）：

- **items 数据驱动**：`{ key, label, icon?, disabled?, children?[] }[]` 经**状态引用**注入；
- **子元素声明**（静态菜单树）：`<x-menu-item key label icon disabled>` 快捷写法（支持一层嵌套 children），经 precompile 变换折叠为 items JSON（`data-items` 通道）。

形态（mode）：**vertical** 垂直（缺省，子菜单点击展开 + grid-rows 动画收张）/ **horizontal** 横向（子菜单 hover 浮层下拉）；**collapsed**（vertical 专属）收起为图标条，子菜单右飞浮层。

router 隔离（ADR-0018 决策 6 约定 2）：纯状态驱动、不 import router——联动以配方交付（见下方 router 配方节，breadcrumb 同款约定）。

v1 取舍：inline 内联形态不做（vertical + 展开常驻即近似形态）；children 仅一层嵌套（更深层不渲染）；键盘漫游不做（叶子项为真 `button`，原生 Tab 序聚焦可用）。

引入方式：引擎之后加载 `<script src="/autospark/autospark.menu.js"></script>`（自举注册），或聚合产物 `autospark.plugins.js`。

## 快速入门

```html
<script src="autospark.js"></script>
<script src="autospark.menu.js"></script>


<x-menu x-model="active" :items="menu"></x-menu>
```

```js
new AutoSpark(el, {
  active: "",
  menu: [
    { key: "home", label: "首页", icon: "file" },
    {
      key: "g",
      label: "组件",
      icon: "folder",
      children: [
        { key: "g1", label: "导航" },
        { key: "g2", label: "表单", disabled: true },
      ],
    },
  ],
});
```

等价的受控形态：`:value="active"` + 外层包裹元素 `@change="active = $event.detail.value"`。

`class` / `style` / `id` 与 `data-*` / `x-*` / `@` 前缀属性保留给宿主。

<demo html="components/navigation/menu/basic.html"/>

## 指南

### 菜单项（items）

**类型**: `Array<{ key, label, icon?, disabled?, children? }>`
**默认**: `[]`

`key` 为项标识（激活值语域）；`label` 为项文案；`icon` 为图标名（x-icon 渲染）；`disabled` 禁用该项（原生 disabled，点击/展开均拦截）；`children` 为子菜单项数组（**一层嵌套**，更深层不渲染）。带 children 的项渲染为父项（展开箭头 + 子菜单），叶子项点击激活。

> **注入提示**：items 恒经**状态引用**注入（`items: menu`，`menu` 为页面/局部状态）——当前引擎版本对值对象内的**字面量**数组 props 存在无限更新缺陷。静态菜单请用子元素声明形态（或裸 `items='[...]'` JSON 字符串属性，precompile 变换会分流到 `data-items` 通道）。动态增删菜单项须**数组整体替换**（引用变化触发重注入；原地 `push` 不换引用、不重渲染）。

### 子元素声明（`<x-menu-item>`）

静态菜单树的快捷写法：`key` / `label` / `icon` / `disabled` 标量属性 + 嵌套子 `<x-menu-item>` 折叠为 children，由 precompile DOM 变换折叠为 items JSON 落宿主 `data-items` 属性（字符串标量通道，规避字面量数组 props），组件 mounted 解析渲染；声明元素本身从 DOM 摘除。`:items` 状态引用在场时恒优先（声明子元素仍被摘除、不参与渲染）。

```html
<x-menu value="g1">
  <x-menu-item key="home" label="首页" icon="file"></x-menu-item>
  <x-menu-item key="g" label="组件">
    <x-menu-item key="g1" label="导航"></x-menu-item>
    <x-menu-item key="g2" label="表单" disabled></x-menu-item>
  </x-menu-item>
</x-menu>
```

### 激活值（value）与值通道

**类型**: `string`
**默认**: `""`（缺省无激活项）

受控单选（tabs 同构）：

- **props 单向驱动**：`:value="active"` 变化即时迁移激活态，且祖先链自动跟随展开；
- **点击叶子项**：写组件内部状态 + 双派发——`input`（非冒泡，x-model 监听回写）+ `change`（冒泡，`detail = { value }`，外层一行回写）；
- **el.value 桥**：宿主元素 `value` 属性劫持（读 = 当前激活 key、写 = 激活迁移 + 祖先展开），程序读写皆经此；
- **初值落定序**：`x-model` 初值 > props `value` > 空（菜单缺省无激活项——与 tablist 恒有一项激活不同）。

同值点击短路（不重复派发）；禁用项不可激活。

### 子菜单展开（openKeys）

带 children 的父项点击切换展开/收起（vertical 形态 grid-rows 动画收张，箭头随开合旋转）。展开态 `openKeys`（`{ [父项 key]: true }`）由组件内部维护（整体替换驱动），也可经**状态引用**注入初始展开：

```html
<!-- 保留值形态：openKeys 动态 camelCase 键在元素名形态无 :绑定通道（DOM 属性名小写化失配） -->
<div x-component:autospark.menu="{ items: menu, openKeys: initialOpen }"></div>
```

```js
// 仅作初值消费；运行期切换由组件内部接管（外部整体替换同样生效）
new AutoSpark(el, { initialOpen: { g: true } });
```

horizontal 形态下子菜单为 hover 浮层下拉（CSS 悬停驱动 + focus-within 键盘可达，openKeys 点击切换对横向无效）；collapsed 图标条形态下子菜单右飞浮层。

### 形态（mode）与收起（collapsed）

**mode 类型**: `vertical | horizontal`，**默认** `vertical`
**collapsed 类型**: `boolean`，**默认** `false`

`vertical` 垂直菜单（缺省）；`horizontal` 横向菜单（子菜单 hover 浮层下拉）；`collapsed` 垂直收起为图标条（仅对 vertical 生效，横向下被忽略）：顶层文字/箭头隐藏、悬停父项右飞浮层展开子菜单。

<demo html="components/navigation/menu/modes.html"/>

### router 配方（纯状态驱动，不耦合 router）

组件遵循 router 隔离约定（ADR-0018 决策 6 约定 2）：**不 import router 包**，激活态由状态表达。联动两步——路由切换时把当前路径映射为激活 key 写回状态；点击接管交外层 `change` 事件改调 `router.push`：

```html
<div @change="onMenuChange($event.detail.value)">
  <x-menu :items="menu" :value="active"></x-menu>
</div>
```

```js
// ① 路由 → 状态：路由切换时按 path 映射激活 key（如 /zh/components/navigation/ → "navigation"）
router.afterEach((to) => {
  state.active = pathToKey(to.path);
});
// ② 状态 → 路由：change 事件改调 router.push（key → path 映射由 items 定义承载）
function onMenuChange(key) {
  router.push(keyToPath(key));
}
```

### 事件

| 事件 | 形态 | 说明 |
| --- | --- | --- |
| change | 冒泡，`detail = { value }` | 激活叶子项变化（点击/程序写值时派发；props 驱动变化不广播防回环；父项展开切换不派发） |
| input | 非冒泡 | x-model 回写通道（同 change 时机） |

### 主题化

字号档位：任意祖先容器挂 `data-size`（theme 手动通道，经 autospark.base 继承）；暗色：容器裸挂 `data-dark`。使用者覆盖通道 `--asc-menu-*`（如 `--asc-menu-primary`、`--asc-menu-color`、`--asc-menu-hover-bg`、`--asc-menu-border`、`--asc-menu-panel-bg`）。

## 参考

### 属性

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| value | `string` | `""` | 受控激活 key（缺省无激活项；el.value 桥） |
| items | `Array<{ key, label, icon?, disabled?, children? }>` | `[]` | 菜单项（状态引用注入；children 一层嵌套） |
| mode | `vertical \| horizontal` | `vertical` | 形态（horizontal 子菜单 hover 浮层） |
| collapsed | `boolean` | `false` | 垂直收起为图标条（vertical 专属） |
| openKeys |`Record<string, boolean>` | `{}` | 子菜单展开态（内部维护，可经状态引用注入初始展开） |

### 事件

| 事件 | 参数 | 说明 |
| --- | --- | --- |
| change | `detail: { value }` | 激活叶子项变化冒泡（外层一行回写惯用法） |
| input | — | x-model 回写通道（非冒泡） |

### Slots

| 插槽 | 说明 |
| --- | --- |
| — | 无插槽（菜单树全部由 items 数据驱动） |
