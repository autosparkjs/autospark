# Tag 标签

用于列表、卡片中的**状态标记**：小体量、带语义色的行内标签，支持尺寸三档与可关闭。适合订单状态、文章分类、筛选条件等「一排小标记」场景；需要更强动作语义时用 Button 组件。

引入方式：`<script src="/autospark/autospark.tag.js"></script>`（引擎之后加载，自举注册零手动接线），或聚合产物 `autospark.plugins.js` 一个标签挂全部官方插件。

## 基础用法

实例化写法 `x-component:autospark.tag`，属性参数承载组件名、指令值专职 props 注入：

```html
<span x-component:autospark.tag="{ label: '待支付', type: 'warning' }"></span>
```

props 一览：

| prop | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `type` | `string` | `"default"` | 语义色变体：`default` / `primary` / `success` / `danger` / `warning` / `info` |
| `size` | `string` | `"md"` | 尺寸三档：`sm` / `md` / `lg`（`md` 即基础样式） |
| `label` | `string` | `"标签"` | 缺省文案：未提供插槽内容时显示（插槽内容优先） |
| `closable` | `boolean` | `false` | 可关闭：显示右侧 × 按钮，点击后整标签从 DOM 移除 |

未提供子内容时组件显示 `label` 兜底文案；提供子内容时插槽内容优先。

<demo html="components/tag/basic.html"/>

## 尺寸与可关闭

三档尺寸（`sm`/`md`/`lg`）与可关闭交互：点击 × 后标签从 DOM 移除（组件内 `close` 方法执行 `this.el.remove()`，无状态清理诉求）。

<demo html="components/tag/variants.html"/>

## 暗色模式

两种暗色路径：

- **主题暗色**：引入 `autospark-theme.css` 并启用主题暗色（`data-theme="dark"`），组件消费的 `--auto-*` 语义变量自动跟随换肤；
- **独立暗色域**：任意容器裸挂 `data-dark` 属性即局部切换暗色（无需主题在场，吃组件暗色兜底变体）——上方 variants demo 的暗色块即此形态。

## 主题化

组件样式全部走 CSS 变量三级回退链（ADR-0129）：主题在场吃 `--auto-*` 语义变量，主题不在场吃使用者覆盖变量，都没有吃兜底字面值（组件脱离主题独立可用）。

消费的 `--auto-*` 语义变量清单：

| 变量 | 用途 |
| --- | --- |
| `--auto-secondary-bgcolor` | 默认（default）变体底色 |
| `--auto-color` | 默认变体文字色 |
| `--auto-border-color` | 默认变体边框色 |
| `--auto-border-radius` | 圆角 |
| `--auto-primary-color` / `--auto-success-color` / `--auto-danger-color` / `--auto-warning-color` / `--auto-info-color` | 各语义变体 accent 基色（底色与边框经 `color-mix` 调浅派生） |

使用者覆盖通道（`--asc-tag-*` 前缀，优先级在主题变量之后、兜底字面值之前）：

```css
/* 例：把默认标签调成暖灰底 + 更大圆角 */
.asc-tag {
    --asc-tag-bg: rgba(250, 235, 215, 0.6);
    --asc-tag-radius: 999px;
}
/* 例：覆盖 primary 变体 accent 基色 */
.asc-tag {
    --asc-tag-primary-color: #7c3aed;
}
```

::: info
变体绑定落在组件内层插槽出口元素上（`:data-type` / `:data-size`），经宿主 `:has()` 选择器驱动外观——这是化身路径约束（x-component T4=B）的既定模式；尺寸档位直取 `--x-font-size-*` 标尺（字面值兜底）。
:::
