import { TOAST_SHELL_STYLES } from "./shell";

/**
 * 轻提示引擎结构样式（ADR-0068）：分区列定位（引擎结构，不归 shell——遮罩同构分界）+
 * toast shell 形态样式。幂等注入 head（tooltip / registerShellStyles 同构纪律），首个
 * toast 容器懒建时调用（container.ts）。
 *
 * 分区列定位契约（7 pos × fixed inset，ADR-0068 决策 7）：
 * - 边距走 CSS 变量 `--autospark-toast-inset`（默认 16px；`offset` 键在列创建时由引擎
 *   inline 写入覆盖）——列不迁移约定下的唯一定制点；
 * - `center` 列经 `translate(-50%, -50%)` 居中——transform 在**列**上，卡片 slide 动画的
 *   transform 在**卡片**上，不同元素互不干扰；
 * - `z-index` 走 `--autospark-toast-z`（默认 1100，高于 overlay 的 1000——toast 浮于对话框之上）；
 * - `pointer-events: none` + 卡片 `auto`：列不拦截空白区域的页面点击（容器透明壳惯例的
 *   列级延续——列矩形覆盖屏幕一角，不能挡住下面的可点内容）。
 */
const TOAST_STYLES_ID = "autospark-toast-styles";

/**
 * 分区列卡片间距（px）。离场收拢（manager `_dismiss`）以 `margin-bottom: -GAP` 抵消
 * 收拢卡后侧的列 gap——remove 瞬间兄弟零跳变，此值须与 manager 侧保持同步。
 */
export const TOAST_COLUMN_GAP = 10;

/** 幂等注入 toast 样式（已存在则跳过） */
export function injectToastStyles(): void {
    if (typeof document === "undefined" || !document.head) return;
    if (document.getElementById(TOAST_STYLES_ID)) return;
    const style = document.createElement("style");
    style.id = TOAST_STYLES_ID;
    style.textContent = COLUMN_STYLES + "\n" + TOAST_SHELL_STYLES;
    document.head.appendChild(style);
}

/** 分区列定位样式（引擎结构层） */
const COLUMN_STYLES = `
/* 分区列：fixed 纵向堆叠栈（每 pos 一列，data-toast-pos 标记）；空白区不拦截点击 */
.autospark-toast-column {
  position: fixed;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: ${TOAST_COLUMN_GAP}px;
  z-index: var(--autospark-toast-z, 1100);
  pointer-events: none;
}
.autospark-toast-column > * { pointer-events: auto; }
.autospark-toast-column[data-toast-pos="top-left"] {
  top: var(--autospark-toast-inset, 16px);
  left: var(--autospark-toast-inset, 16px);
  align-items: flex-start;
}
.autospark-toast-column[data-toast-pos="top-center"] {
  top: var(--autospark-toast-inset, 16px);
  left: 50%;
  transform: translateX(-50%);
  align-items: center;
}
.autospark-toast-column[data-toast-pos="top-right"] {
  top: var(--autospark-toast-inset, 16px);
  right: var(--autospark-toast-inset, 16px);
  align-items: flex-end;
}
.autospark-toast-column[data-toast-pos="bottom-left"] {
  bottom: var(--autospark-toast-inset, 16px);
  left: var(--autospark-toast-inset, 16px);
  align-items: flex-start;
}
.autospark-toast-column[data-toast-pos="bottom-center"] {
  bottom: var(--autospark-toast-inset, 16px);
  left: 50%;
  transform: translateX(-50%);
  align-items: center;
}
.autospark-toast-column[data-toast-pos="bottom-right"] {
  bottom: var(--autospark-toast-inset, 16px);
  right: var(--autospark-toast-inset, 16px);
  align-items: flex-end;
}
.autospark-toast-column[data-toast-pos="center"] {
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  align-items: center;
}
`;
