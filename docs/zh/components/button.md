# Button 按钮

按钮组件：形态（主/次/虚线/文本/链接）与语义色正交组合，支持图标、加载、幽灵、块级、圆形、可勾选、菜单项等形态，全盘消费 `@autospark/theme` 语义变量（调节主题变量即时生效，暗色自动跟随）。

引入方式：`<script src="autospark.button.js"></script>`（引擎之后），或聚合产物 `autospark.plugins.js`。涟漪（`ripple`）需额外加载 `autospark.ripple.js`。

## 基础用法

形态经 `type` 指定，语义色经 `color` 指定，两者可自由组合（如危险虚线钮）。未提供插槽内容时显示 `label`。

<demo html="components/button/basic.html"/>

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| type | `primary \| secondary \| dashed \| text \| link` | `primary` | 形态：实底 / 次底 / 虚线 / 文本 / 链接 |
| color | `primary \| success \| warning \| danger \| info` | `primary` | 语义色（与任意形态组合） |
| label | string | `"按钮"` | 兜底文案（插槽无内容时显示） |
| icon | string | — | 图标名（`x-icon` 渲染；`loading` 时被加载图标替换） |
| loading | boolean | `false` | 加载态：左图标位转圈并禁点（视觉不淡化） |
| disabled | boolean | `false` | 禁用（opacity 淡化 + 不可点） |
| autoInsertSpace | boolean | `true` | label 恰为两个汉字时自动插入空格 |

## 变体与交互

幽灵、边框、块级、圆形、纵排 label、备注、tags 小圆钮、可勾选、菜单项形态：

<demo html="components/button/variants.html"/>

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| ghost | boolean | `false` | 幽灵按钮：背景透明、内容取语义色（常用在有色背景上）；可与任意形态组合 |
| border | boolean | `false` | 装饰性附加边框（默认无；不干预 dashed / ghost 的固有边框形态） |
| block | boolean | `false` | 适配父宽度 |
| shape | `default \| circle` | `default` | 圆形：纯图标呈正圆，带文字自动呈胶囊 |
| labelBelow | boolean | `false` | label 显示在图标下方（纵排） |
| align | `left \| center \| right` | `center` | 内容水平对齐（block / 菜单等宽内容时可见） |
| memo | string | — | label 下方的备注（小一号、淡色） |
| tags | `{icon?, tooltip?, name?}[]` | `[]` | 右侧小一号圆形小按钮；`tooltip` 走原生 title 悬停 |
| menu | boolean | `false` | 菜单项形态：占满宽、透明底、左对齐、hover 淡底；勾选态呈左竖条 + 淡色底 |
| checkable | boolean | `false` | 可勾选模式：点击自动翻转 `value` 并冒泡 `change`；勾选态使用与 `color` 匹配的背景色 |
| value | boolean | `false` | 勾选值（checkable 模式；受控显示方向经 props 单向注入响应） |
| ripple | boolean \| object | `false` | 点击涟漪（组件内 `inside` 形态动态挂载，ADR-0010）；需页面已加载 `autospark.ripple.js`，未加载时静默跳过 |

### 事件

组件默认封闭，事件经**冒泡**到外层消费（绑定写在组件外的包裹元素上）：

| 事件 | detail | 触发时机 |
| --- | --- | --- |
| change | `{ value }` | checkable 点击翻转后 |
| tag-click | `{ name, tag }` | tags 小圆钮点击（已阻断宿主翻转 / 涟漪） |

表单双向同步惯用法（checkable）：

```html
<span @change="picked = $event.detail.value">
    <button x-component:autospark.button="{ checkable: true, value: picked, label: '仅看优惠' }"></button>
</span>
```

::: warning
`tags` 传数组时建议放外层状态再以路径引用（`tags: btnTags`）——props 字面量数组存在引用比较层面的更新环缺陷（引擎侧修复中），路径引用不受影响。
:::

## 主题化

组件**不设尺寸属性**——字号、圆角、图标尺寸全盘消费 theme 档位（容器 `data-size` / `data-radius` 一键换档），内距与间距以 `em` 相对字号缩放。

消费的语义变量（三级回退链 `var(--auto-X, var(--asc-button-X, 兜底值))`，ADR-0129）：

| 用途 | 变量 |
| --- | --- |
| 语义色 | `--auto-primary-color` / `--auto-success-color` / `--auto-warning-color` / `--auto-danger-color` / `--auto-info-color` |
| 文字 / 底色 | `--auto-color` / `--auto-secondary-bgcolor` |
| 边框 | `--auto-border-size` / `--auto-border-color` |
| 悬停淡底 | `--auto-hover-bgcolor` |
| 勾选态（menu） | `--auto-selected-color` / `--auto-selected-bgcolor` |
| 排版 / 规模 | `--auto-font-size` / `--auto-border-radius` |

使用者覆盖通道：`--asc-button-*` 前缀私有变量（如 `--asc-button-primary` 换语义色兜底、`--asc-button-radius` 换圆角兜底）。调节主题色 / 切暗色 / 换档位即时生效——组件样式零硬编码语义色（第三级兜底字面值除外）。
