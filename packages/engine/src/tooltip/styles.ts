import {
    TOOLTIP_ARROW_CLASS,
    TOOLTIP_CLASS,
    TOOLTIP_PLACEMENT_ATTR,
    TOOLTIP_BORDER_ATTR,
} from "./container";

/**
 * tooltip 默认样式注入（ADR-0061 决策 9/16，幂等——多 engine 实例共享 document）：
 *
 * - **默认视觉**：暗底白字 + 1px border（`border: true` 打 `data-tooltip-border` 标记），
 *   配色经 CSS 变量定制（对齐 overlay 契约）：`--autospark-tooltip-bg` / `-fg` / `-border` /
 *   `-radius`，层高 `--autospark-tooltip-z`（默认 1100，高于 overlay 默认 1000——tooltip
 *   悬浮于对话框之上是常见组合）。**变量须定在 `:root` / `body` 层**——浮层单例挂 body
 *   容器下，业务容器上的变量继承不到（单例模型 = 全局换肤语义；单元素级差异用 className）。
 * - **箭头双层变色融合**（视觉协议同 overlay 箭头家族，暗底下无阴影层）：`::before` 菱形
 *   承担**边框色**（border 模式）/ 背景色（无 border 模式），`::after` 承担**面板背景色**
 *   并**同心**外扩 2px（10→12，半对角 8.49）——盖住嵌入段的边框色、露出段留 ≈1.4px 均匀
 *   环带（箭头描边，与面板 border 连续）。**无朝向面板内侧的偏移**：嵌入深度恒 = 覆盖层
 *   半对角 8.49px < padding 7 + 行盒留白，内容零遮挡且保持居中（覆盖层偏移会线性加深嵌入、
 *   突破 padding 盖住文字——曾经的设计教训，见 ADR-0061 修订记录）。
 * - **slide 方向自适应覆写层**（决策 16）：复用全局内置 slide 六类名（ADR-0039），
 *   `.autospark-tooltip` 限定的 specificity 覆写按 `data-tooltip-placement` 前缀把
 *   from 值换为 CSS 变量——滑入方向自动匹配弹出方位（top → 自锚侧下方 6px 滑入），
 *   **flip/autoUpdate 运行中改向时动画方向自动跟随**（纯 CSS，零 JS）；默认时长覆写
 *   150ms（tooltip 高频场景），`animate: {duration}` 对象形态仍可覆盖（inline 优先级更高）。
 *   非 tooltip 元素的 slide 不受影响（覆写带类名限定）。
 */
const STYLES_ID = "autospark-tooltip-styles";

const SLIDE_FROM_VAR = "--autospark-tip-slide-from";

export function injectTooltipStyles(): void {
    if (typeof document === "undefined" || !document.head) return;
    if (document.getElementById(STYLES_ID)) return;
    const style = document.createElement("style");
    style.id = STYLES_ID;
    style.textContent = `
.${TOOLTIP_CLASS} {
  position: fixed;
  inset: 0 auto auto 0;
  display: none;
  /* 大内容约束：默认 70vw/70vh（CSS 变量全局定制；元素级 maxWidth/maxHeight 保留键经
     inline style 覆盖，manager 显示时测量溢出并以 -webkit-line-clamp 截断显示省略号） */
  max-width: var(--autospark-tooltip-max-w, 70vw);
  max-height: var(--autospark-tooltip-max-h, 70vh);
  overflow: hidden;
  /* 上下 7px：箭头覆盖层同心嵌入面板 ≈8.5px，须容纳在 padding + 行盒留白（≈3.25px）内
     （7 + 3.25 = 10.25 > 8.49，文字墨迹零遮挡且内容保持居中——勿改回对称性破坏的侧向让位） */
  padding: 7px 10px;
  border-radius: var(--autospark-tooltip-radius, 6px);
  background: var(--autospark-tooltip-bg, #1f2937);
  color: var(--autospark-tooltip-fg, #fff);
  font-size: 13px;
  line-height: 1.5;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
  z-index: var(--autospark-tooltip-z, 1100);
}
.${TOOLTIP_CLASS}[${TOOLTIP_BORDER_ATTR}] {
  border: 1px solid var(--autospark-tooltip-border, rgba(255, 255, 255, 0.2));
}
.${TOOLTIP_ARROW_CLASS} {
  position: absolute;
  width: 10px;
  height: 10px;
  pointer-events: none;
}
.${TOOLTIP_ARROW_CLASS}::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--autospark-tooltip-bg, #1f2937);
  transform: rotate(45deg);
}
.${TOOLTIP_CLASS}[${TOOLTIP_BORDER_ATTR}] > .${TOOLTIP_ARROW_CLASS}::before {
  background: var(--autospark-tooltip-border, rgba(255, 255, 255, 0.2));
}
/* 覆盖层与 ::before **同心**（无嵌入段偏移）：外扩 2px（10→12，半对角 8.49）盖住嵌入段
   的边框色 ::before、露出段留 ≈1.4px 均匀环带（箭头描边，与面板 border 连续）。嵌入深度
   = 覆盖层半对角 8.49px < padding 7 + 行盒留白，内容零遮挡——勿加朝向面板内侧的偏移
   （嵌入深度 = 偏移 + 半对角，会突破 padding 盖住文字）。 */
.${TOOLTIP_ARROW_CLASS}::after {
  content: '';
  position: absolute;
  inset: -1px;
  background: var(--autospark-tooltip-bg, #1f2937);
  transform: rotate(45deg);
}
/* slide 方向自适应覆写层（ADR-0061 决策 16）：全局内置 slide 纵向固定（translateY(-12px)），
   此处以更高 specificity 按最终弹出方位覆写 from 值——滑入自锚侧、滑出向锚侧（对称）。
   变量挂在浮层自身（placement 写回属性所在元素），flip 改向即时生效。 */
.${TOOLTIP_CLASS}[${TOOLTIP_PLACEMENT_ATTR}^="top"] {
  ${SLIDE_FROM_VAR}: translateY(6px);
}
.${TOOLTIP_CLASS}[${TOOLTIP_PLACEMENT_ATTR}^="bottom"] {
  ${SLIDE_FROM_VAR}: translateY(-6px);
}
.${TOOLTIP_CLASS}[${TOOLTIP_PLACEMENT_ATTR}^="left"] {
  ${SLIDE_FROM_VAR}: translateX(6px);
}
.${TOOLTIP_CLASS}[${TOOLTIP_PLACEMENT_ATTR}^="right"] {
  ${SLIDE_FROM_VAR}: translateX(-6px);
}
.${TOOLTIP_CLASS}.slide-enter-active,
.${TOOLTIP_CLASS}.slide-leave-active {
  transition-duration: 0.15s;
}
.${TOOLTIP_CLASS}.slide-enter-from,
.${TOOLTIP_CLASS}.slide-leave-to {
  opacity: 0;
  transform: var(${SLIDE_FROM_VAR}, translateY(6px));
}`;
    document.head.appendChild(style);
}
