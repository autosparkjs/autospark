/**
 * 抽屉滑入/滑出动画规则（ADR-0063；ADR-0092 后仅存动态生成段——抽屉静态样式已随组件文件
 * components/drawer-shell.html 的 `<style global>` 注册期注入）。
 *
 * 'drawer' 内置动画：类挂实例根（遮罩根或裸面板根，ADR-0039 六类名契约），placement 属性
 * 挂面板（= 根或根的直接子级）——复合选择器覆盖两种结构：模态遮罩淡入淡出（静态段）+ 面板
 * **位移滑入滑出**（本模块，`translate ±100%`：面板整体平移、内容不变形、纯合成零 reflow；
 * placement 即滑入边——`right` = 从右缘滑入向左移动。锚定模式面板终态在锚内侧，位移只是
 * 入场轨迹）；裸面板仅滑动分量。引擎在进入动画前同步写 placement，首帧即有正确滑入方向。
 */

/** 贴边主方向 → 面板滑入/滑出的离屏位移（enter-from 与 leave-to 同向） */
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

/** 抽屉滑入/滑出动画规则（纯函数输出，模块加载时求值一次；经 registerShellStyles 注入） */
export const DRAWER_SLIDE_STYLES = buildSlideRules();
