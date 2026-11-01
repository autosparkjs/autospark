# Alert 警告条

警告条（Alert）用于在页面内常驻展示一条需要用户知晓的语义信息——信息提示、成功反馈、注意事项或危险警告。支持**标题 + 描述两行布局**、**四种语义色**、**可关闭**（点击收起，父组件状态可控制重新显示）与**可选左侧语义图标**。

引入方式：`<script src="/autospark/autospark.alert.js"></script>`（在引擎 `autospark.js` 之后加载），或聚合产物 `autospark.plugins.js` 一个标签挂全部官方插件。

## 基础用法

用 `x-component:autospark.alert` 实例化，指令值为 props 对象：

```html
<div x-component:autospark.alert="{ type: 'info', title: '信息提示', description: '这是一条信息类警告条。' }"></div>
```

<demo html="components/alert/basic.html"/>

### 属性（props）

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `type` | `"info" \| "success" \| "warning" \| "danger"` | `"info"` | 语义类型，驱动配色与左侧图标 |
| `title` | `string` | `"提示"` | 标题行文案 |
| `description` | `string` | `""` | 描述行文案；为空时自然收成单行布局 |
| `icon` | `boolean` | `true` | 是否显示左侧语义图标（随 `type` 自动切换） |
| `closable` | `boolean` | `false` | 是否显示右侧关闭按钮（点击收起） |
| `visible` | `boolean` | `true` | 显示状态；父组件注入此 prop 即可控制显示 / 重新显示 |

## 语义类型

`type` 四态各有独立的浅底深字配色（主题在场时随 `--auto-info-color` / `--auto-success-color` / `--auto-warning-color` / `--auto-danger-color` 自动换肤）：

- `info`——中性信息（蓝色系）
- `success`——成功反馈（绿色系）
- `warning`——注意事项（黄色系）
- `danger`——危险警告（红色系）

## 插槽自定义内容

组件默认插槽出口承载正文区：宿主提供子内容时，投影替换标准的「标题 + 描述」两行，图标、关闭按钮与配色外壳保留——适合嵌入链接、强调标记等富文本：

```html
<div x-component:autospark.alert="{ type: 'info' }">
  <strong>自定义正文</strong>——替换默认两行布局。
</div>
```

## 可关闭与重新显示

`closable: true` 时右侧出现关闭按钮。点击后：

1. 组件自身立即收起（`visible` 置 false，不依赖父组件配合）；
2. 同时从组件根派发冒泡的 `close` 事件，父组件在**组件外的包裹元素**上监听（组件域封闭，宿主上的表达式见不到外层状态），把源状态同步置 false。

父组件把 `visible` 作为 prop 注入自己的状态，即可实现「关闭后重新显示」的完整闭环：

```html
<div x-data="{ shown: true }">
  <!-- 事件绑定写在组件外的包裹元素上，点击经冒泡触发 -->
  <div @close="shown = false">
    <div
      x-component:autospark.alert="{ type: 'success', title: '已保存', visible: shown, closable: true }"
    ></div>
  </div>
  <button x-show="!shown" @click="shown = true">重新显示</button>
</div>
```

<demo html="components/alert/closable.html"/>

## 暗色模式

主题在场时配色自动跟随暗色；无主题场景在任意容器裸挂 `data-dark`（或 `dark`）属性即走暗色兜底校准值，见基础用法 demo 的暗色区块。

## 主题化

组件只消费 CSS 变量，不产字面色值（兜底位除外）。主要消费的语义变量：

| 变量 | 用途 |
| --- | --- |
| `--auto-info-color` / `--auto-success-color` / `--auto-warning-color` / `--auto-danger-color` | 四态主色（背景与边框经 `color-mix` 从主色派生） |
| `--auto-secondary-bgcolor` / `--auto-color` | 中性兜底态（未知 `type` 时）的背景与文字 |
| `--auto-border-radius` | 圆角 |
| `--auto-font-size` / `--x-font-size-small` | 标题 / 描述字号 |
| `--auto-icon-size` | 左侧图标尺寸 |

使用者覆盖通道（`--asc-alert-*` 前缀，三级回退链的第二级——主题不在场时生效）：

```css
/* 例：加大圆角、定制 info 主色 */
.asc-alert {
  --asc-alert-radius: 0.75rem;
  --asc-alert-info-color: #1677ff;
}
```
