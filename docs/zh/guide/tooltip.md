# 全局工具提示（Tooltip）

## 概述

工具提示是**引擎级**的全局能力（ADR-0061）：引擎树内任意元素**零声明**获得统一样式的悬浮提示——不需要 `x-*` 指令，写一个 `data-tooltip` 属性（或写 `title`，编译期自动转换）即可：

```html
<button data-tooltip="提交表单">提交</button>
<button title="我会被自动转换">删除</button>
```

- **零依赖**：定位经内置的 `@floating-ui/dom`（已打包进产物）；
- **零声明**：约定驱动，无指令注册、无组件定义；
- **内容支持 HTML**：`data-tooltip="加<b>粗</b>提示"`（经 `options.sanitizer` 消毒，与 x-html 同一安全通道）；
- **默认好用**：`placement: 'top'` + 视口翻转、箭头、1px 边框（暗底白字）、方向自适应滑入动画全部开箱即用。

:::tip 手写 data-tooltip 与 title 均可
模板中直接写 `data-tooltip` 是首选形态（无转换成本）；存量模板的 `title` 无需迁移——编译期自动转换，行为与手写完全一致。
:::

## 快速入门

<demo html="tooltip/basic.html"/>

## 基本用法

### 字符串形态（纯内容）

属性值即内容，支持内联 HTML：

```html
<button data-tooltip="共 <b>3</b> 条未读">消息</button>
```

内容里的插值照常工作（响应式——表达式变化后**下次悬停**生效）：

```html
<button data-tooltip="共 {{count}} 项未读">消息</button>
```

### JSON 形态（内容 + 配置）

以 `{` 开头即配置（宽松 JSON：无引号键、单引号、尾逗号均可），`content` 键承载内容、其余键配置本元素：

```html
<button data-tooltip="{content: '向左弹出', placement: 'left', showDelay: 200}">帮助</button>
```

保留键封闭清单（未知键 warn + 忽略）：

<demo html="tooltip/config.html"/>

| 键 | 默认 | 说明 |
| --- | --- | --- |
| `content` | — | 内容（HTML；JSON 形态必填，缺失 warn） |
| `placement` | `'top'` | 弹出方向（floating-ui 12 方向值；不支持 `'auto'`） |
| `offset` / `shift` / `flip` | 让位 8px / — / `true` | 透传 floating-ui 中间件（箭头开启时的默认让位，与 12×12 箭头载体配套） |
| `arrow` | `true` | 箭头（复用 overlay 菱形视觉协议） |
| `showDelay` / `hideDelay` | `0` / `150` | 显示 / 隐藏延迟（ms）；隐藏延迟给鼠标跨越间隙移入浮层的时间（可交互 tooltip） |
| `className` | — | 附加类名（主题定制通道） |
| `maxWidth` / `maxHeight` | `70vw` / `70vh` | 浮层最大宽 / 高（数字 = px，字符串透传 CSS）；超出截断显示 `…` |
| `border` | `true` | 1px 边框（对齐 overlay 的 border 键先例） |
| `animate` | `'slide'` | 进出场动画（ADR-0039 三形态；`false` 关闭） |

### 大内容截断

浮层默认约束在 `70vw × 70vh` 内（也可全局经 `--autospark-tooltip-max-w` / `-max-h` CSS 变量调整，或元素级 `maxWidth` / `maxHeight` 保留键覆盖）。溢出行为：内容先按宽度换行，超出最大高度的行经 line-clamp 截断并显示省略号 `…`——纯文本与富 HTML 内联内容均适用：

<demo html="tooltip/overflow.html"/>

## title 自动转换

编译期引擎自动把 `title` 转换为 `data-tooltip`（值转移并剥除）——原生浏览器 tooltip 从根上不可能出现，存量模板零迁移升级：

```html
<!-- 你写的 -->
<button title="确认删除？">删除</button>

<!-- 结果 DOM -->
<button data-tooltip="确认删除？">删除</button>
```

规则：

- `title` 与 `data-tooltip` 并存 → **`data-tooltip` 优先**，仅剥 `title`（双显是 bug）；
- **绑定形态同样重定向**：`:title="expr"` / `x-bind:title` 的写回自动落 `data-tooltip`（x-model 的 schema `title` 注入亦然）——「结果 DOM 无 title」是引擎不变量；
- 转换覆盖 x-for 项、patch 重建、条件分支等全部编译通道；
- **关闭特性时（`tooltip: false`）不转换**，`title` 原样保留原生行为。

## 全局默认

`options.tooltip` 承载全局默认配置（与元素级保留键同构，元素级覆盖全局）：

```ts
const app = new AutoSpark(el, state, {
  tooltip: {
    placement: "bottom",
    showDelay: 100,
    className: "my-tip",
  },
});
```

`tooltip: false` **整体关闭**：转换、悬停监听、命令式 API 全部停用（`engine.tooltip.show()` 调用 warn + no-op），原生 tooltip 行为完整保留。

## 交互语义

- **单例浮层**：每引擎一个共享浮层，内容随悬停目标切换——同时至多一个可见；
- **延迟防抖**：`showDelay` 窗口内移出取消显示；`hideDelay`（默认 150ms）窗口内重新进入触发元素、或鼠标移入浮层，均取消隐藏（跨目标快速移动不闪烁）；
- **浮层可交互**：鼠标移入浮层内不隐藏（浮层内可放链接/按钮），移出浮层后延迟隐藏——离场动画播放中移回浮层同样恢复显示；
- **键盘可达**：`focusin` / `focusout` 与悬停同管道——Tab 聚焦同样触发提示；
- **委托命中**：悬停目标的后代元素同样触发（`closest` 取最近祖先，嵌套 `data-tooltip` 取最近者）。

## 定位与视觉

定位默认 `top` + 视口翻转兜底（空间不足自动 flip），滚动 / 窗口缩放自动跟随；最终弹出方向写回 `data-tooltip-placement` 属性（CSS 可按此前缀定制方向性视觉）。

视觉默认**暗底白字 + 1px 边框**，全部经 CSS 变量定制。**变量须定在 `:root` / `body` 层**——浮层单例挂在 body 容器下，业务容器上的变量继承不到（单例模型 = 全局换肤语义；单元素级差异用 `className` 主题）：

```css
:root {
  --autospark-tooltip-bg: #1f2937;      /* 浮层背景 */
  --autospark-tooltip-fg: #fff;         /* 文字色 */
  --autospark-tooltip-border: rgba(255, 255, 255, 0.2); /* 边框色（border: true） */
  --autospark-tooltip-radius: 6px;      /* 圆角 */
  --autospark-tooltip-z: 1100;          /* 层高（默认高于 overlay 的 1000） */
}
```

`className` 键追加主题类，配合 `.autospark-tooltip` 精准覆盖内置样式。

<demo html="tooltip/theme.html"/>

### 方向自适应动画

默认动画 `slide`：滑入方向**自动匹配弹出方位**（`top` 弹出自锚侧下方 6px 滑入，离场向锚侧滑出，视觉对称）——flip 运行中改向时动画方向即时跟随，无需任何 JS。默认 150ms；`animate: {duration: 300}` 可覆盖，`animate: 'fade'` / `false` / 自定义六类名动画照常（ADR-0039 通用机制）。

## 事件

双通道广播（浮层元素 `dispatchEvent` + 引擎事件总线），payload `{ el, tip }`：

```ts
engine.on("tooltip:show", ({ el, tip }) => console.log(el, tip.dataset));
document.body.addEventListener("tooltip:hide", (e) => {
  console.log("隐藏：", e.detail.el);
});
```

一切隐藏路径均广播 `tooltip:hide`：移出、聚焦离场、触发元素被移除、`engine.stop()`、命令式 `hide()`。

## 事件与命令式 API

<demo html="tooltip/api.html"/>

命令式入口：

```ts
// opts 与元素级保留键同构，单次生效；content 可无 DOM 属性直接注入
engine.tooltip.show(document.querySelector("#help"), {
  content: "动态生成的提示",
  placement: "right",
});
engine.tooltip.hide(); // 立即隐藏（不走 hideDelay）
```

## 边界与限制

- **嵌套引擎**：按 `data-autospark` 根标识归属过滤——内层引擎（x-isolate）内的元素只由内层引擎响应，不双显；
- **断连兜底**：显示期间触发元素被移除（x-for 回收 / patch）→ 立即隐藏；
- **overlay 内容**：x-dialog 等渲染在 body 容器内的元素**同样生效**（容器已纳入监听）；
- **触摸设备**：无专属逻辑——点按的合成 mouse 事件自然退化（轻点即显）；
- **无障碍**：当前版本不做 `aria-*` 补偿与原生 `title` 保留逃生门（fast-follow 清单，见 ADR-0061）。

技术决策与被否决方案详见 [ADR-0061](https://github.com/autosparkjs/autospark/blob/main/packages/engine/docs/adr/0061-tooltip.md)。
