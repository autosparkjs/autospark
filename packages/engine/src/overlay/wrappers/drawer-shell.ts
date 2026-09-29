/**
 * 抽屉面板外壳（shell 机制，ADR-0062/0063）——`drawer-shell` 内置私有组件。
 *
 * 形态语义（ADR-0063）：面板贴边（屏幕四边或锚元素边线外侧）滑入滑出的抽屉。与
 * dialog-shell/popover-shell 的形态分化点：
 *
 * - **无箭头载体**（ADR-0063 共识 Q14）：抽屉形态语言无箭头——模板不渲染
 *   `.autospark-overlay-arrow`，`at.arrow: true` 显式配置静默无效（引擎查不到载体，
 *   floating-ui 无箭头中间件）；
 * - **贴边直角**：`border-radius: 0`（边框/背景/阴影经 `.autospark-dialog` 类继承外壳
 *   联动样式——模板根双类名 `autospark-dialog autospark-drawer`）；
 * - **短轴尺寸默认**：经 CSS 变量 `--autospark-drawer-size`（左右抽屉的宽与上下抽屉的
 *   高共用，语义 = 抽屉短轴尺寸），按 `data-overlay-placement` 前缀分派——贴边另一轴由
 *   引擎 inline inset 对拉拉伸（屏幕模式全屏展开）或 JS 同步锚边长（锚定模式，ADR-0063）；
 * - **'drawer' 内置动画**（默认 animate）：类挂实例根（遮罩根或裸面板根，ADR-0039 六类名
 *   契约），placement 属性挂面板（= 根或根的直接子级）——复合选择器覆盖两种结构：模态
 *   遮罩淡入淡出 + 面板**位移滑入滑出**（`translate ±100%`，主流 drawer 形态语言：面板
 *   整体平移、内容不变形、纯合成零 reflow；placement 即滑入边——`right` = 从右缘滑入向
 *   左移动。锚定模式面板终态在锚内侧，位移只是入场轨迹）；裸面板仅滑动分量。引擎在
 *   进入动画前同步写 placement（屏幕模式定位时 / 锚定模式首帧预写，最终值由定位管线
 *   写回），首帧即有正确的滑入方向。
 */

/** 抽屉 shell 模板：双类名根（继承 dialog 外壳联动样式）+ 默认出口；无箭头载体（Q14） */
export const DRAWER_SHELL_TEMPLATE =
    `<div class="autospark-dialog autospark-drawer">` + `<div x-slot></div>` + `</div>`;

/**
 * 贴边主方向 → 面板滑入/滑出的离屏位移（enter-from 与 leave-to 同向）：
 * placement 即滑入边（`right` = 从面板终态位置右侧滑入、向左移动——主流右抽屉）。
 */
const DRAWER_SLIDE_TRANSFORMS: Record<string, string> = {
    right: "translateX(100%)",
    left: "translateX(-100%)",
    bottom: "translateY(100%)",
    top: "translateY(-100%)",
};

/** 生成四方向的滑入/滑出规则（复合选择器：裸面板自身 / 遮罩内面板后代） */
function buildSlideRules(): string {
    const rules: string[] = [];
    for (const [dir, transform] of Object.entries(DRAWER_SLIDE_TRANSFORMS)) {
        // enter-from 起点 / leave-to 终点：离屏位移（transform 不参与布局，面板布局恒终态）
        for (const phase of ["enter-from", "leave-to"]) {
            rules.push(
                `.drawer-${phase}[data-overlay-placement^="${dir}"],` +
                    `.drawer-${phase} > [data-overlay-placement^="${dir}"]` +
                    `{transform:${transform}}`,
            );
        }
    }
    // 过渡属性四方向统一（active 帧两形态共用）
    for (const phase of ["enter-active", "leave-active"]) {
        rules.push(
            `.drawer-${phase}[data-overlay-placement],` +
                `.drawer-${phase} > [data-overlay-placement]` +
                `{transition:transform .3s ease}`,
        );
    }
    // enter-to / leave-from 须显式写 identity 变换：摘 from 类后 transform 回退 `none`，
    // 而 `变换值 ↔ none` 不可插值（瞬间跳变）——显式 translateX(0) 才有可插值终点
    for (const phase of ["enter-to", "leave-from"]) {
        rules.push(
            `.drawer-${phase}[data-overlay-placement],` +
                `.drawer-${phase} > [data-overlay-placement]` +
                `{transform:translateX(0)}`,
        );
    }
    // enter-from 帧面板禁过渡：面板 append 后才挂类，挂类产生的「无类态 → from 态」变化
    // 会被 enter-active 复合规则的 transition 立即捕获（先播一场反向 unwanted 过渡，目标
    // 过渡起点被污染、滑入位移归零）。from 帧压制、摘 from 后 active 过渡生效（!important
    // 确保压过 active 的 (0,2,0) 特异性；实例根自身的 unwanted 过渡由 animate 机制 inline
    // transition:none 压制，此规则只补复合选择器作用的面板侧）
    rules.push(
        `.drawer-enter-from[data-overlay-placement],` +
            `.drawer-enter-from > [data-overlay-placement]` +
            `{transition:none!important}`,
    );
    return rules.join("\n");
}

/**
 * 抽屉 shell 默认视觉与 'drawer' 动画（样式随组件文件走，ADR-0062 决策七）：
 * 非 scoped、引用无关——多实例共享一份，经 `registerShellStyles()` 与面板样式合并注入。
 */
export const DRAWER_SHELL_STYLES = `
/* 抽屉形态：贴边直角 + 内容滚动 + border-box（短轴变量尺寸含边框不溢出） */
.autospark-drawer {
  border-radius: 0;
  box-sizing: border-box;
  overflow: auto;
}
/* 短轴尺寸默认（placement 前缀分派；贴边另一轴由引擎 inline inset 对拉或锚定长轴同步承担）。
   自定义 shell 不带本类名即无默认尺寸——完全自由。 */
.autospark-drawer[data-overlay-placement^="left"],
.autospark-drawer[data-overlay-placement^="right"] {
  width: var(--autospark-drawer-size, 280px);
}
.autospark-drawer[data-overlay-placement^="top"],
.autospark-drawer[data-overlay-placement^="bottom"] {
  height: var(--autospark-drawer-size, 280px);
}
/* 'drawer' 动画遮罩分量：淡入淡出（模态形态；裸面板无遮罩不淡） */
.autospark-dialog-mask.drawer-enter-active,
.autospark-dialog-mask.drawer-leave-active {
  transition: opacity .3s ease;
}
.autospark-dialog-mask.drawer-enter-from,
.autospark-dialog-mask.drawer-leave-to {
  opacity: 0;
}
/* 抽屉把手（trigger，ADR-0063 修订）：实例外常驻圆形按钮——骑面板活动边线（引擎
   inline 写 left/top），展开↔折叠沿边线同步滑移（与面板同曲线 .3s）；视觉继承面板
   边框/背景配色变量；箭头 CSS 三角指向「下一步动作」，折叠态 180° 翻转；折叠态半圆
   裁切（露面板展开侧半圆——屏幕模式朝外半圆在屏外不可见的显式统一）。
   阴影仅折叠态保留：展开态把手骑面板边线、视觉属于面板；折叠态独立浮起须提示可点。 */
.autospark-drawer-trigger {
  position: fixed;
  width: var(--autospark-drawer-trigger-size, 24px);
  height: var(--autospark-drawer-trigger-size, 24px);
  box-sizing: border-box;
  border-radius: 50%;
  border: 1px solid var(--autospark-overlay-border, rgba(0, 0, 0, 0.1));
  background: var(--autospark-overlay-bg, #fff);
  cursor: pointer;
  z-index: calc(var(--autospark-overlay-z, 1000) + 1);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  user-select: none;
  transition: left .3s ease, top .3s ease, clip-path .3s ease, transform .3s ease;
}
.autospark-drawer-trigger[data-collapsed] {
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
}
.autospark-drawer-trigger::after {
  /* 箭头三角：border 绘制（border-left 着色 = 右指基准），基准角按 placement 分派，
     折叠态整体翻转 180°（指向「下一步动作」：展开态指折叠方向、折叠态指展开方向） */
  content: '';
  border: 3px solid transparent;
  border-left: 4px solid var(--autospark-overlay-border, rgba(0, 0, 0, 0.45));
  border-right-width: 0;
  margin-right: -1px;
}
.autospark-drawer-trigger[data-overlay-placement="right"]::after { transform: rotate(0deg); }
.autospark-drawer-trigger[data-overlay-placement="left"]::after { transform: rotate(180deg); }
.autospark-drawer-trigger[data-overlay-placement="top"]::after { transform: rotate(-90deg); }
.autospark-drawer-trigger[data-overlay-placement="bottom"]::after { transform: rotate(90deg); }
/* 折叠态：翻转指展开方向 + 向可见半边平移（圆径 1/4，随尺寸变量缩放）——半圆裁切下
   三角仍居中圆心会被裁掉朝外一半，须落位到可见半圆的视觉中心 */
.autospark-drawer-trigger[data-collapsed][data-overlay-placement="right"]::after { transform: translateX(calc(var(--autospark-drawer-trigger-size, 24px) / -4)) rotate(180deg); }
.autospark-drawer-trigger[data-collapsed][data-overlay-placement="left"]::after { transform: translateX(calc(var(--autospark-drawer-trigger-size, 24px) / 4)) rotate(0deg); }
.autospark-drawer-trigger[data-collapsed][data-overlay-placement="top"]::after { transform: translateY(calc(var(--autospark-drawer-trigger-size, 24px) / 4)) rotate(90deg); }
.autospark-drawer-trigger[data-collapsed][data-overlay-placement="bottom"]::after { transform: translateY(calc(var(--autospark-drawer-trigger-size, 24px) / -4)) rotate(-90deg); }
/* 折叠态半圆裁切：保留面板展开侧半圆（right 骑右缘 → 露左半、top 骑顶缘 → 露下半；
   屏幕模式下朝外半圆本就在屏外，锚定模式露展开侧与面板原位置视觉连续——四方向同构） */
.autospark-drawer-trigger[data-collapsed][data-overlay-placement="right"] { clip-path: inset(0 50% 0 0); }
.autospark-drawer-trigger[data-collapsed][data-overlay-placement="left"] { clip-path: inset(0 0 0 50%); }
.autospark-drawer-trigger[data-collapsed][data-overlay-placement="top"] { clip-path: inset(50% 0 0 0); }
.autospark-drawer-trigger[data-collapsed][data-overlay-placement="bottom"] { clip-path: inset(0 0 50% 0); }
${buildSlideRules()}
`;
