# autospark.tag 状态标签

## 概述

`autospark.tag` 渲染**状态标记**——列表、卡片里的小尺寸标签（tag / badge），如订单状态、文章发布态、技能标签。六种语义色变体 + 三档尺寸 + 可关闭（点 `×` 从 DOM 移除），样式淡底描边字（区别于 [autospark.button](https://github.com/zhangfisher/autospark/tree/main/packages/plugins/src/components/button) 的实底按钮形态）。

```html
<span x-component:autospark.tag="{ label: '已发布', type: 'success' }"></span>
```

宿主标签即组件根标签（化身语义）——行内标记用 `span` 宿主；宿主裸子节点填入默认插槽，未提供时显示 `label` 兜底文案。

::: tip 插件组件
`autospark.tag` 由官方插件包 `@autospark/plugins` 以**组件插件**形态提供（`$.components["autospark.tag"] = 模板`，engine 侧零改动），使用前须加载插件脚本：

```html
<script src="/autospark/autospark.js"></script>
<script src="/autospark/autospark.tag.js"></script>
```

组件表跨 engine 真全局、晚注册立即生效；官方建议仍按引擎在前、插件在后的顺序直引。
:::

## 快速入门

<demo html="plugin/tag.html"/>

```html
<!-- 基础（default 中性淡底） -->
<span x-component:autospark.tag="{ label: '草稿' }"></span>
<!-- 语义色 + 尺寸 -->
<span x-component:autospark.tag="{ label: '已发货', type: 'primary', size: 'sm' }"></span>
<!-- 可关闭：点 × 从 DOM 移除，移除前派发组件事件 close -->
<span x-component:autospark.tag="{ label: '临时标记', type: 'warning', closable: true }"></span>
<!-- 插槽内容覆盖 label 兜底 -->
<span x-component:autospark.tag="{ type: 'success' }"><b>已</b>完成</span>
```

## 指南

### 类型变体（type）

`type` 选择语义色变体，默认 `default`（中性淡底）。标记形态为「淡底 + 描边 + 语义色文字」：底为语义色淡染于面板底、边框为文字色淡染，整体轻量不抢占卡片视觉焦点：

| type      | 语义     | 主题链（`--auto-*`）        |
| --------- | -------- | --------------------------- |
| `default` | 中性     | `--auto-color` + `--auto-secondary-bgcolor` |
| `primary` | 主要     | `--auto-primary-color`      |
| `success` | 成功     | `--auto-success-color`      |
| `danger`  | 危险     | `--auto-danger-color`       |
| `warning` | 警告     | `--auto-warning-color`      |
| `info`    | 信息     | `--auto-info-color`         |

未知取值静默回落 `default`（变体选择器不命中即基础样式，不告警不中断）。

### 尺寸（size）

| size | 字号    | 内边距            |
| ---- | ------- | ----------------- |
| `sm` | `0.75rem`   | `0.0625rem 0.5rem`  |
| `md` | `0.8125rem` | `0.125rem 0.625rem`（默认） |
| `lg` | `0.875rem`  | `0.25rem 0.75rem`   |

关闭钮 `×` 以 `em` 定尺寸，随 `size` 与宿主字号自动缩放。

### 可关闭（closable）

`closable: true` 时渲染 `×` 关闭钮（键盘可达：原生 `button`，Enter / Space 触发）。点击动作分两步：

1. **派发组件事件 `close`**（ADR-0117）——自组件根冒泡的 `CustomEvent`，`$event.detail` 携带 `{ label, type }`；
2. **从 DOM 移除**标签宿主。

事件沿 DOM 冒泡，消费侧在组件宿主**同元素**或任意**祖先元素**上写 `@close` 监听。状态驱动的列表（`x-for` 渲染）应在监听里同步移除 state 项，让数据与视图双通道一致收敛：

```html
<div @close="articles = articles.filter(a => a.title !== $event.detail.label)" x-for="article of articles" :key="article.title">
    <div class="card">
        <span>{{ article.title }}</span>
        <span x-component:autospark.tag="{ label: article.title, type: article.status, closable: true }"></span>
    </div>
</div>
```

### 插槽

宿主裸子节点填入默认插槽（可放图标、强调标记等富内容）；未提供时显示 `{{ label }}`（组件自身状态求值）。

## Props

props 经 `x-component` 值对象**单向注入**组件 data 域（在消费处求值）：

| Prop       | 类型      | 默认值     | 说明                                               |
| ---------- | --------- | ---------- | -------------------------------------------------- |
| `type`     | `string`  | `'default'` | 语义色变体：`default` / `primary` / `success` / `danger` / `warning` / `info` |
| `size`     | `string`  | `'md'`      | 尺寸档位：`sm` / `md` / `lg`                       |
| `closable` | `boolean` | `false`     | 渲染 `×` 关闭钮（点击派发 `close` 事件并从 DOM 移除） |
| `label`    | `string`  | `'标签'`    | 默认插槽兜底文案（宿主提供内容时被覆盖）           |

## 事件

| 事件    | 触发时机       | `detail` 载荷              |
| ------- | -------------- | --------------------------- |
| `close` | 点击 `×` 关闭钮 | `{ label, type }`（当前 props） |

监听写法：宿主同元素或祖先元素 `@close="..."`（`$event.detail` 取载荷）。

## 主题化

样式走三级回退链 `var(--auto-X, var(--asc-tag-X, 校准兜底值))`——接入 `@autospark/theme` 后自动随主题与明暗模式联动；未接入 theme 时可用 `--asc-tag-*` 覆盖位定制，再不济为校准兜底字面值：

| 覆盖位           | 作用                       |
| ---------------- | -------------------------- |
| `--asc-tag-bg`   | 淡染基色（面板底回退位）   |
| `--asc-tag-color`| 中性文字色                 |
| `--asc-tag-primary` / `--asc-tag-success` / `--asc-tag-danger` / `--asc-tag-warning` / `--asc-tag-info` | 五语义色 |
| `--asc-tag-radius` | 圆角（默认 `0.375rem`）  |

暗色模式：`[dark]` / `[data-dark]` 祖先下兜底字面值自动切换为 theme 默认暗色校准值（淡染浓度 10% → 16%）。

## 注意事项

- **加载顺序**：官方建议按引擎在前、插件在后直引脚本；组件表为跨 engine 真全局，晚注册亦即时生效（同名后注册覆盖先注册）。
- **closable 只管 DOM**：组件自带的关闭仅做 DOM 移除；数据驱动列表须在 `@close` 监听里同步 state（见上文模式），否则重渲染会再生物质化来源的标签。
- **变体回落静默**：未知 `type` / `size` 回落 `default` / `md`，无告警。
- **不换行**：标记为 `inline-flex` + `white-space: nowrap`，超长文案不换行（状态标记语义约定），长文本请用其他载体。
- **覆盖通道**：业务侧 `options.components` 同名声明优先级高于插件全局表，可整体替换组件模板。
