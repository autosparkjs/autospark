import { AutoSparkDirectiveBase } from "../features/directive/base";
/**
 * x-show：条件可见性。控制宿主**是否可见**，宿主**永留 DOM**。
 *
 * 假时 `display:none`——仍占 `:nth-child` 计数位、仍被表单提交、`querySelector` 仍命中——
 * 子树与 watcher 全保留、最轻量。与 x-if 的**条件存在性**（假时摘宿主 detach、离开 DOM）
 * 正交：x-show 切「可见性」，x-if 切「存在性」。
 *
 * **独立指令**——历史上 x-show 曾是 `x-if.keep` 的解析期别名（`getDirectives` 归一化为
 * `if` + `keep` 修饰符），把存在性（detach）与可见性（display:none）两个正交概念合并成
 * 一指令两态，造成 `.keep` 语义反复。现拆分：x-show 独立为可见性指令（display:none），
 * `x-if.keep` 升级为存在性指令（detach 保活）。详见 ADR-0016。
 *
 * 不占子树（ownsChildren=false），可与 x-for 同元素共存（x-for 占子树，本指令只切容器 display）。
 *
 * **进出场动画（ADR-0039）**：`x-show-options="{animate:'fade'}"` 声明后，display 切换经
 * 动画过渡——离场**延迟 display:none**（播完才隐藏），进场先恢复 display 再播 enter；
 * 快速翻转走抢占（在播即取消：离场的隐藏回调同步完成后再进场）。首次渲染静默（决策 6）。
 */
export declare class ShowDirective extends AutoSparkDirectiveBase {
    static readonly priority = 80;
    static readonly singleton = true;
    /** 首次切换守卫（ADR-0039 决策 6）：初始 display 定位不动画，此后状态变化才播 */
    private firstToggle;
    /** 动画配置缓存（DRY：避免每次事件重复 resolveAnimate + getOption） */
    private _anim;
    created(): void;
    /** 切 display：无动画直写；有动画则进场先显后播、离场播完再隐（宿主永留 DOM） */
    private toggle;
}
