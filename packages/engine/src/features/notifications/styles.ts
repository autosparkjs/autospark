/**
 * 通知引擎结构样式（ADR-0071；ADR-0092 后仅存**分区列定位**——引擎结构层，不归任何组件；
 * 卡片 chrome / 内容结构 / actions 按钮行样式已随各组件文件的 `<style global>` 注册期注入）。
 * 幂等注入 head，首个通知容器懒建时调用（container.ts）。
 *
 * 分区列定位契约（7 pos × fixed inset，ADR-0068 决策 7 沿用）：
 * - 边距走 CSS 变量 `--autospark-notification-inset`（默认 16px；`offset` 键在列创建时由引擎
 *   inline 写入覆盖）——列不迁移约定下的唯一定制点；
 * - `center` 列经 `translate(-50%, -50%)` 居中——transform 在**列**上，卡片 slide 动画的
 *   transform 在**卡片**上，不同元素互不干扰；
 * - `z-index` 走 `--autospark-notification-z`（默认 1100，高于 overlay 的 1000——通知浮于对话框之上）；
 * - `pointer-events: none` + 卡片 `auto`：列不拦截空白区域的页面点击（容器透明壳惯例的
 *   列级延续）。
 */
// 引擎结构样式 id 独立命名：不得与组件 <style global id="autospark-notification-styles">（base/
// notification-shell/actions 三处共享的 ADR-0087 覆盖挂载点）同 id——否则组件样式先注入时本表
// 被幂等检查顶掉，分区列 fixed 定位全丢。
const NOTIFICATION_STYLES_ID = "autospark-notification-column-styles";

/**
 * 分区列卡片间距（px）。离场收拢（manager `_dismiss`）以 `margin-bottom: -GAP` 抵消
 * 收拢卡后侧的列 gap——remove 瞬间兄弟零跳变，此值须与 manager 侧保持同步。
 */
export const NOTIFICATION_COLUMN_GAP = 10;

/** 分区列定位样式（引擎结构层；含 GAP 插值故不可静态化） */
const COLUMN_STYLES = `
/* 分区列：fixed 纵向堆叠栈（每 pos 一列，data-notification-pos 标记）；空白区不拦截点击 */
.autospark-notification-column {
  position: fixed;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: ${NOTIFICATION_COLUMN_GAP}px;
  z-index: var(--autospark-notification-z, 1100);
  pointer-events: none;
}
.autospark-notification-column > * { pointer-events: auto; }
.autospark-notification-column[data-notification-pos="top-left"] {
  top: var(--autospark-notification-inset, 16px);
  left: var(--autospark-notification-inset, 16px);
  align-items: flex-start;
}
.autospark-notification-column[data-notification-pos="top-center"] {
  top: var(--autospark-notification-inset, 16px);
  left: 50%;
  transform: translateX(-50%);
  align-items: center;
}
.autospark-notification-column[data-notification-pos="top-right"] {
  top: var(--autospark-notification-inset, 16px);
  right: var(--autospark-notification-inset, 16px);
  align-items: flex-end;
}
.autospark-notification-column[data-notification-pos="bottom-left"] {
  bottom: var(--autospark-notification-inset, 16px);
  left: var(--autospark-notification-inset, 16px);
  align-items: flex-start;
}
.autospark-notification-column[data-notification-pos="bottom-center"] {
  bottom: var(--autospark-notification-inset, 16px);
  left: 50%;
  transform: translateX(-50%);
  align-items: center;
}
.autospark-notification-column[data-notification-pos="bottom-right"] {
  bottom: var(--autospark-notification-inset, 16px);
  right: var(--autospark-notification-inset, 16px);
  align-items: flex-end;
}
.autospark-notification-column[data-notification-pos="center"] {
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  align-items: center;
}
`;

/** 幂等注入通知结构样式（已存在则跳过） */
export function injectNotificationStyles(): void {
    if (typeof document === "undefined" || !document.head) return;
    if (document.getElementById(NOTIFICATION_STYLES_ID)) return;
    const style = document.createElement("style");
    style.id = NOTIFICATION_STYLES_ID;
    style.textContent = COLUMN_STYLES;
    document.head.appendChild(style);
}
