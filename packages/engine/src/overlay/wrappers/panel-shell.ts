/**
 * 面板外壳组件（shell 机制，ADR-0062）——「现有面板形态」的组件化封装。
 *
 * **shell 不含遮罩**：遮罩是引擎结构（`mask` 选项控制显隐，ADR-0062），shell 只负责
 * **面板层**的形态——边框 / 圆角 / 背景 / 箭头载体 / 内容出口。DOM 层级与组件化前一致：
 *
 * ```
 * mask: true   容器 > .autospark-dialog-mask（引擎建，实例根） > shell 产物根（data-overlay） > [x-slot 出口 > 内容组件]
 * mask: false  容器 > shell 产物根（实例根 + data-overlay）                        > [x-slot 出口 > 内容组件]
 * ```
 *
 * 模板恒含箭头载体元素（`.autospark-overlay-arrow`）——**显隐归引擎**（`_show` 锚定判定：
 * 锚定命中且 `at.arrow !== false` 才保留并交给 floating-ui 定位；退居中 / `arrow: false`
 * 时引擎移除载体，防孤立菱形）。恒渲染而非 `x-if` 表达式：引擎锚定结果编译期不可知，
 * 且避免 x-if 微任务挂载与 floating-ui 同步查询的时序竞态。
 *
 * 类名即契约（`.autospark-dialog` / `.autospark-overlay-arrow` + `data-overlay-border` /
 * `data-overlay-placement` 标记）：自定义 shell 复用这些类名即继承默认视觉（可覆盖），
 * 完全自定义则自写样式。样式经 `registerShellStyles()` 幂等注入（非 scoped、引用无关——
 * 多实例共享一份，与组件 scoped CSS 的引用计数机制无关）。
 */

/** 面板 shell 模板（dialog-shell / popover-shell 同构共用）：根 + 默认出口 + 箭头载体 */
export const PANEL_SHELL_TEMPLATE =
    `<div class="autospark-dialog">` +
    `<div x-slot></div>` +
    `<div class="autospark-overlay-arrow"></div>` +
    `</div>`;

/**
 * 面板 shell 默认视觉（自 dialog 形态样式迁移，ADR-0062）：
 * - 面板相对定位（居中模式由遮罩 flex 承载；锚定模式被改写 fixed）+ 圆角 / 边框 / 背景
 *   （`data-overlay-border` 标记下，`border: true` 默认开——外壳模式，Tippy 同构）；
 * - 箭头**双伪元素**（载体由 floating-ui arrow middleware 定位，ADR-0052 决策 24）：
 *   `::before` 带阴影菱形（8×8 旋转 45°，立体感）；`::after` 无阴影同色菱形**尺寸外扩 1px**
 *   （10×10，对角半径 ≈7.07px）并按最终 placement 朝面板内侧偏移 4px（= 阴影模糊半径）：
 *   内向覆盖 7.07+4 = 11.07px ≥ 阴影最远端 ≈10.66px（嵌入段阴影完整遮蔽），外向 7.07-4 =
 *   3.07px < 5.66px（完全藏在带阴影菱形轮廓内，箭头尖锐度不受影响）。偏移方向经
 *   `data-overlay-placement` 前缀选择器表达（placement 由定位管线写回面板）。
 * - **`border: true`**：面板画 border，箭头双层**变色**融合——`::before` 变**边框色**
 *   （`--autospark-overlay-border`）、`::after` 变**面板背景色**（`--autospark-overlay-bg`）
 *   并外扩至 12×12（对角半径 ≈8.49px）：外向 8.49-4 = 4.49px，距带阴影菱形外尖 5.66px
 *   留出 ≈1.17px **边框色斜带**（视觉 ≈1px，与面板 border 在两个交点连续）；内向
 *   8.49+4 = 12.49px ≥ 10.66px（嵌入段的边框色与阴影仍被完整盖掉，无 V 形残留）。
 * - 颜色 / 圆角经 `--autospark-overlay-border` / `--autospark-overlay-bg` /
 *   `--autospark-overlay-radius` 定制。
 * - 裸面板（mask:false，容器**直接子级**；dialog 面板在遮罩内不受影响）补 z-index——
 *   面板 position:fixed 由锚定管线设置，无 z-index 会被页面高层级定位内容覆盖。
 */
export const PANEL_SHELL_STYLES = `
.autospark-dialog {
  position: relative;
  border-radius: var(--autospark-overlay-radius, 8px);
}
.autospark-dialog[data-overlay-border] {
  border: 1px solid var(--autospark-overlay-border, rgba(0, 0, 0, 0.1));
  background: var(--autospark-overlay-bg, #fff);
  /* 面板投影（浮层 elevation）：形态归 shell（ADR-0062）——与边框/背景/圆角同由外壳统一
     承担，不再要求内容组件自持阴影。柔和弥散投影，浮层与页面/遮罩拉开层次。 */
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.18);
}
.autospark-overlay-arrow {
  position: absolute;
  width: 8px;
  height: 8px;
  pointer-events: none;
}
.autospark-overlay-arrow::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--autospark-overlay-bg, #fff);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.18);
  transform: rotate(45deg);
}
/* 无阴影覆盖层：尺寸外扩 1px（10×10，对角半径 ≈7.07px）+ 朝面板内侧偏移 4px（= 阴影模糊半径）——
   内向覆盖到 ≈11.07px ≥ 阴影最远端 ≈10.66px（嵌入段阴影完整遮蔽）；外向 ≈3.07px 不出带阴影
   菱形轮廓（5.66px），箭头尖锐度不受影响 */
.autospark-overlay-arrow::after {
  content: '';
  position: absolute;
  inset: -1px;
  background: var(--autospark-overlay-bg, #fff);
  transform: rotate(45deg);
}
.autospark-dialog[data-overlay-border] > .autospark-overlay-arrow::before {
  background: var(--autospark-overlay-border, rgba(0, 0, 0, 0.1));
}
.autospark-dialog[data-overlay-border] > .autospark-overlay-arrow::after {
  inset: -2px;
}
/* 覆盖层偏移方向 = 面板内侧（嵌入段所在方向）。语义推导（防反向）：
   placement 'top' = 面板在锚点上方 → 箭头在面板底边 → 嵌入段是菱形上尖 → 覆盖层向上偏 -y；
   placement 'left' = 面板在锚点左侧 → 箭头在面板右边（朝右侧锚点）→ 嵌入段是菱形左尖 → 向 -x。 */
[data-overlay-placement^="top"] > .autospark-overlay-arrow::after {
  translate: 0 -4px;
}
[data-overlay-placement^="bottom"] > .autospark-overlay-arrow::after {
  translate: 0 4px;
}
[data-overlay-placement^="left"] > .autospark-overlay-arrow::after {
  translate: -4px 0;
}
[data-overlay-placement^="right"] > .autospark-overlay-arrow::after {
  translate: 4px 0;
}
/* 裸面板 z-index（mask:false 形态：面板是容器直接子级） */
[data-autospark-overlays] > .autospark-dialog {
  z-index: var(--autospark-overlay-z, 1000);
}`;
