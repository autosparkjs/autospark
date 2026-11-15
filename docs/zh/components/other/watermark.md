# Watermark 水印

## 概述

Watermark 是 AutoSpark 的官方水印组件（组件库 P4 other 件，ADR-0018 清单权威表 other 行 / ADR-0030 affix 与 watermark 轻件对 ADR）：在页面上添加文本水印——**容器形态**（缺省，水印层 absolute 铺满组件、覆盖默认插槽内容）或**全页形态**（`full-page`，水印层挂 body、fixed 铺满视口）。

技术路线：canvas 离屏绘制旋转文本单元 → data URL 作 `background-image` 平铺（repeating CSS 无法渲染旋转文字，canvas 是工程合理解——ADR-0030 声明）。文案色经水印层 `color` 三级回退链解析进 canvas（主题在场自动跟随、暗色提亮）；props 变化签名比对幂等重绘。

边界声明（v1 按简不做，ADR-0030）：**内容保护**（antd 的 pointer-events 拦截层——本件水印恒 `pointer-events: none`，只作视觉标记不拦交互）；**MutationObserver 防删除**（水印被 DOM 操作移除后自动重建）。

引入方式：引擎之后加载 `<script src="/autospark/autospark.watermark.js"></script>`（自举注册），或聚合产物 `autospark.plugins.js`。

## 快速入门

```html
<script src="autospark.js"></script>
<script src="autospark.watermark.js"></script>

<!-- 容器水印：覆盖插槽内容 -->
<x-watermark content="AutoSpark 机密">
  <div>被保护的内容</div>
</x-watermark>

<!-- 全页水印：裸属性糖（等价 full-page="true"） -->
<x-watermark content="全页水印" full-page></x-watermark>
```

<demo html="components/other/watermark/basic.html"/>

## 指南

### 水印文案（content）

**类型**: `string | string[]`
**默认**: `""`

单行文本直传；多行传字符串数组（状态引用注入 `:content="lines"`）或裸属性 JSON 字符串声明（`content='["行一","行二"]'`——经 data-content 标量通道，规避字面量数组 props 死环），逐行绘制、行高 1.3 倍字号。

### 字体（font / fontSize）

**类型**: `string` / `number`
**默认**: `""`（fontSize 合成）/ `16`

`font` 为完整 CSS font 速写（如 `"bold 24px serif"`）一键覆盖直传 canvas；缺省由 `fontSize` + 水印层 computed 字体族（主题 `--auto-font-family` 在场自动跟随）合成。

### 颜色与不透明度（color / opacity）

**类型**: `string` / `number`
**默认**: `""`（主题次要色）/ `1`

`color` 缺省走水印层 `color` 三级回退链（`--auto-secondary-color` → `--asc-watermark-color` → `rgba(0,0,0,0.15)`），canvas 取 computed 值——主题在场自动换肤、暗色兜底提亮（`rgba(255,255,255,0.18)`）；显式色值 JS 内联覆盖。`opacity` 作用于水印层整体（叠加在 color 之上）。

### 旋转角（rotate）

**类型**: `number`
**默认**: `-22`

旋转角（度，负值逆时针）——antd 同款缺省倾角。

### 平铺间隙（gap）

**类型**: `number | [number, number]`
**默认**: `null`（[100, 100]）

水印单元间的水平/垂直间隙（px）：数字等两轴、`[x, y]` 数组分轴（数组经状态引用或 JSON 字符串声明——`gap="[100, 60]"`）。

### 层级（zIndex）

**类型**: `number`
**默认**: `9`

水印层层级——全页形态常需压到页面内容之上（如 `:z-index="50"`）。

### 全页形态（fullPage）

**类型**: `boolean`
**默认**: `false`

true 时水印层挂 `document.body`、`position: fixed` 铺满视口；组件拆卸时自动收除（unmounted 清理）。元素名写法支持 `full-page` 裸属性糖（归一 `fullPage: true`）。运行时切换即时迁移（层在 body 与组件树间移动）。

**暗色边界**：fullPage 层挂 body 子树，`[data-dark]` 局部容器域不覆盖 body 子树——全页水印的暗色跟随全局 `[dark]` 通道。

<demo html="components/other/watermark/variants.html"/>

### 主题化与覆盖通道

色值/字体族消费 `--auto-secondary-color` / `--auto-font-family`（三级回退链，ADR-0129）；无主题场景可经覆盖变量定制：

```css
x-watermark {
  --asc-watermark-color: rgba(0, 120, 255, 0.2);
  --asc-watermark-font-family: "Courier New", monospace;
}
```

### 降级行为

无 canvas 2D 上下文环境（旧 happy-dom 等无头测试器）静默降级——水印层透明、不炸；真浏览器正常绘制（e2e 验证面）。

## 参考

### 属性

| 属性 | 类型 | 默认 | 说明 |
|---|---|---|---|
| content | `string \| string[]` | `""` | 水印文案（单行文本 / 多行数组） |
| font | `string` | `""` | CSS font 速写（完整覆盖；空 = fontSize + 主题字体族合成） |
| fontSize | `number` | `16` | 字号（px，font 缺省时的合成档） |
| color | `string` | `""` | 色（空 = 主题次要色三级回退；显式值覆盖） |
| opacity | `number` | `1` | 水印层整体不透明度（0-1） |
| rotate | `number` | `-22` | 旋转角（度） |
| gap | `number \| [number, number]` | `null` | 平铺间隙（缺省 [100, 100]；数字等两轴） |
| zIndex | `number` | `9` | 水印层层级 |
| fullPage | `boolean` | `false` | 全页形态（层挂 body fixed 铺满视口） |

### 事件

无（纯展示件）。

### Slots

| 插槽 | 说明 |
|---|---|
| 默认 | 被覆盖的内容（容器形态；fullPage 时通常空——层已全页） |
