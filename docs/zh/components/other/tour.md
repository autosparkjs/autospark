# Tour 漫游引导

## 概述

Tour 是 AutoSpark 的官方漫游引导组件（组件库 P4 **other 分类**，ADR-0018 清单权威表 other 行 / ADR-0031）：分步高亮页面目标元素 + 气泡说明——新功能导览、复杂表单分步指引、首访用户教育的开箱件。

- **高亮遮罩**：box-shadow 大投影单元素方案（intro.js 同款路线）——圆角高亮免费、步进过渡平滑、`pointer-events: none` 不拦截页面交互；
- **气泡**：自绘 fixed 锚定（目标下方优先 / 视口空间不足上翻 / 水平 clamp），滚动与 resize 自动跟随，**首开零闪烁**（定位落位前不可见）；
- **受控面**：`visible`（受控开关 + `el.value` 桥）与 `current`（当前步受控）双通道；末步「完成」**自动关**（未接线的调用方亦能自然关闭，接线方经 `close` / `input` 回写闭环）;
- **容错**：目标选择器未命中时 warn + 自动跳步；全部 miss 走关闭链；
- **i18n**：上一步 / 下一步 / 跳过 / 完成文案走 `tour.prev / next / skip / finish` 词典键（未装 i18n 或无词典时回退中文）。

引入方式：引擎之后加载 `<script src="/autospark/autospark.tour.js"></script>`（自举注册），或聚合产物 `autospark.plugins.js`。

## 快速入门

```html
<script src="autospark.js"></script>
<script src="autospark.tour.js"></script>

<button @click="tourOn = true">开始引导</button>

<!-- 元素名写法：steps 状态引用注入 + visible 受控 + 事件沿 DOM 冒泡模板监听 -->
<x-tour
  :steps="steps"
  :visible="tourOn"
  @close="tourOn = false"
  @change="cur = $event.detail.current"
></x-tour>

<script>
  new AutoSpark(el, {
    tourOn: false,
    steps: [
      { target: "#nav", title: "标题栏", content: "这里是控制台标题。" },
      { target: ".card", title: "业务卡片", content: "核心指标一屏速览。" },
      { target: "#save", title: "保存", content: "完成后点击保存。" },
    ],
  });
</script>
```

`steps` / `visible` 经元素名写法的 `:属性` 响应式绑定注入（等价于 `x-component:autospark.tour` 值对象形态）；`@close` / `@change` 为普通模板事件监听。

<demo html="components/other/tour/basic.html"/>

## 指南

### 步骤（steps）

**类型**: `{ target: string, title?: string, content: string }[]`
**默认**: `[]`

步骤数组经状态引用注入（调用方状态 → `:steps="steps"`）。每步：

- `target`：目标元素的 CSS 选择器，在 `document` 范围解析——目标可在页面任意位置（不必与组件同容器）；
- `title`：气泡标题（可选，空则标题行不占位）；
- `content`：气泡说明文本。

注意：`steps` 为引用共享数据，**原地修改（push / splice）不触发更新**——变更步骤须整体替换数组（引擎响应式边界，list / carousel 同款纪律）。

### 受控开关（visible）

**类型**: `boolean`
**默认**: `false`

`true` 打开引导；关闭有三条路径——跳过钮 / 末步完成（组件内建，**自动关**：内部写 `visible=false` 并广播 `close` + 非冒泡 `input` 回写 x-model）/ 调用方状态置 `false`（受控驱动）。

`el.value` 桥提供命令式读写：读 = 当前开关；写 = 打开 / 关闭（不广播）：

```js
const tour = document.querySelector(".asc-tour");
tour.value = true;  // 打开
```

打开边沿不重置 `current`（纯受控语义）——重开从头引导建议在 `@close` 中随开关一并归零。

### 当前步（current）

**类型**: `number`
**默认**: `0`

当前步受控：props 单向驱动（外部写 `current` 直达该步）+ 内部步进（下一步 / 上一步按钮）写组件 data 并广播 `change`（`detail={current}`）——两个方向同一 data 通道，状态恒同步。

### 目标 miss 跳步

目标选择器未命中（元素未渲染 / 选择器笔误 / 非法选择器）时：`console.warn` 提示 + 自动跳到下一步（链式跳过多个失步）；全部 miss 或末步 miss 时走关闭链（`close` 广播）。引导永不因失步卡死。

### 文案（i18n）

按钮文案走 i18n 词典键等值判定回退（未装 i18n / 词典无键时 `t(键)===键` → 回退硬编码中文）：

| 键 | 回退中文 |
|---|---|
| `tour.prev` | 上一步 |
| `tour.next` | 下一步 |
| `tour.skip` | 跳过 |
| `tour.finish` | 完成（末步「下一步」的文案切换） |

### 事件

| 事件 | 参数 | 说明 |
| --- | --- | --- |
| change | `detail={ current }` | 步切换（内部步进 / miss 跳步），冒泡 |
| close | detail 空 | 跳过或末步完成（自动关），冒泡 |
| input | detail 空 | 关闭时的 x-model 回写通道（非冒泡——监听须挂组件宿主） |

事件沿 DOM 冒泡（组件层渲染在 engine 宿主树内），外层 `@close` / `@change` 模板监听直接可收。

<demo html="components/other/tour/controlled.html"/>

### 主题化

气泡盒饰（底色 / 圆角 / 阴影 / 文字色）走 `--auto-*` 语义变量三级回退（theme 在场自动跟随档位与暗色）；遮罩色恒半透明黑（`--asc-tour-mask` 可覆盖——遮罩语境恒暗，不随主题明暗切换）。覆盖通道：`--asc-tour-*`（`mask` / `bg` / `radius` / `shadow` / `z` 层级基准等）。

### 边界披露

- 高亮遮罩不拦截页面交互（`pointer-events: none` 设计取舍）——拦截式遮罩为后续增补面；
- 组件 fixed 层渲染在宿主树内：宿主祖先链上有 `transform` / `filter` 时 fixed 相对该祖先定位（CSS 含有块规则）——避免在变换容器内实例化；
- ESC 关闭、步级 placement（每步自定义气泡方位）为后续按需增补。

## 参考

### 属性

| 属性 | 类型 | 默认 | 说明 |
|---|---|---|---|
| steps | `{ target, title?, content }[]` | `[]` | 步骤数组（状态引用注入，变更须整体替换）；target 为 CSS 选择器（document 范围解析） |
| visible | `boolean` | `false` | 受控开关（el.value 桥读写；末步完成 / 跳过自动关） |
| current | `number` | `0` | 当前步（props 单向驱动 + 内部步进 change 广播；打开边沿不重置） |

### 事件

| 事件 | 参数 | 说明 |
|---|---|---|
| change | `{ current }` | 步切换（含 miss 自动跳步），冒泡 |
| close | — | 引导结束（跳过 / 末步完成），冒泡 |
| input | — | 关闭时 x-model 回写（非冒泡） |

### Slots

| 插槽 | 说明 |
|---|---|
| — | 无插槽（气泡内容为纯文本驱动，富内容由调用方经 steps 内容自组） |
