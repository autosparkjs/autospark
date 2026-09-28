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
 *   遮罩淡入淡出 + 面板按方向滑动（translate ±100%）；裸面板仅滑动分量。引擎在进入
 *   动画前同步写 placement（屏幕模式定位时 / 锚定模式首帧预写，最终值由定位管线写回），
 *   首帧即有正确的滑入方向。
 */

/** 抽屉 shell 模板：双类名根（继承 dialog 外壳联动样式）+ 默认出口；无箭头载体（Q14） */
export const DRAWER_SHELL_TEMPLATE =
    `<div class="autospark-dialog autospark-drawer">` + `<div x-slot></div>` + `</div>`;

/** 贴边主方向 → 面板滑入/滑出的离屏位移（enter-from 与 leave-to 同向） */
const DRAWER_SLIDE_TRANSFORMS: Record<string, string> = {
    right: "translateX(100%)",
    left: "translateX(-100%)",
    bottom: "translateY(100%)",
    top: "translateY(-100%)",
};

/** 生成四方向的滑入/滑出偏移规则（复合选择器：裸面板自身 / 遮罩内面板后代） */
function buildSlideRules(): string {
    const rules: string[] = [];
    for (const [dir, transform] of Object.entries(DRAWER_SLIDE_TRANSFORMS)) {
        for (const phase of ["enter-from", "leave-to"]) {
            rules.push(
                `.drawer-${phase}[data-overlay-placement^="${dir}"],` +
                    `.drawer-${phase} > [data-overlay-placement^="${dir}"]` +
                    `{transform:${transform}}`,
            );
        }
    }
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
  width: var(--autospark-drawer-size, 320px);
}
.autospark-drawer[data-overlay-placement^="top"],
.autospark-drawer[data-overlay-placement^="bottom"] {
  height: var(--autospark-drawer-size, 320px);
}
/* 'drawer' 动画过渡分量：遮罩淡入淡出（模态形态；裸面板无遮罩不淡） */
.autospark-dialog-mask.drawer-enter-active,
.autospark-dialog-mask.drawer-leave-active {
  transition: opacity .3s ease;
}
.autospark-dialog-mask.drawer-enter-from,
.autospark-dialog-mask.drawer-leave-to {
  opacity: 0;
}
/* 面板滑动分量：类挂实例根、placement 挂面板（裸面板=根自身复合；遮罩结构=直接子级） */
.drawer-enter-active[data-overlay-placement],
.drawer-leave-active[data-overlay-placement],
.drawer-enter-active > [data-overlay-placement],
.drawer-leave-active > [data-overlay-placement] {
  transition: transform .3s ease;
}
${buildSlideRules()}
`;
