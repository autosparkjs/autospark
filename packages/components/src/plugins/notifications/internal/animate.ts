/**
 * 动画选项解析（自 engine features/animate/animate.ts vendor——ADR-0039 三形态解析纯函数，
 * 不含引擎侧的类名生命周期执行器；执行经 `engine.animate.enter/leave` 公开面完成）。
 */

/** 单相（enter/leave）动画的解析结果 */
export interface PhaseAnim {
    /** 动画名（六类名的 `{name}` 前缀），如 fade / slide / 用户自定义名 */
    name: string;
    /** 时长 ms（经 inline style 同时覆盖 transition-* 与 animation-*） */
    duration?: number;
    /** 延迟 ms */
    delay?: number;
    /** 缓动函数 */
    easing?: string;
}

/** animate 选项的解析结果：enter/leave 各自的相配置；null = 该相禁用（或无动画） */
export interface ResolvedAnimate {
    enter: PhaseAnim | null;
    leave: PhaseAnim | null;
}

/**
 * 解析 animate 选项（ADR-0039 决策 3）：三形态——
 * - 字符串 `'fade'`：进出同名；
 * - 对象 `{name,duration,delay,easing}`：基础字段施于两相；
 * - 分相覆盖 `{enter:'slide', leave:false}`：相值各自接受 字符串 | 对象 | false（单相禁用），
 *   显式键胜出、缺相回退基础字段。无 name（基础与相均无）即该相无动画。
 */
export function resolveAnimate(option: unknown): ResolvedAnimate {
    if (option == null || option === false || option === "") {
        return { enter: null, leave: null };
    }
    if (typeof option === "string") {
        const phase: PhaseAnim = { name: option };
        return { enter: phase, leave: { ...phase } };
    }
    if (typeof option !== "object") return { enter: null, leave: null };
    const o = option as Record<string, any>;
    const base: Partial<PhaseAnim> = {};
    if (o.name != null) base.name = String(o.name);
    if (o.duration != null) base.duration = Number(o.duration);
    if (o.delay != null) base.delay = Number(o.delay);
    if (o.easing != null) base.easing = String(o.easing);
    return {
        enter: resolvePhase(o.enter, base),
        leave: resolvePhase(o.leave, base),
    };
}

/** 分相解析：false 禁用；缺省回退基础字段（有 name 才有效）；字符串即 name；对象并入基础 */
function resolvePhase(v: unknown, base: Partial<PhaseAnim>): PhaseAnim | null {
    if (v === false) return null;
    let name = base.name;
    let { duration, delay, easing } = base;
    if (typeof v === "string") {
        name = v;
    } else if (typeof v === "object") {
        const o = v as Record<string, any>;
        if (o.name != null) name = String(o.name);
        if (o.duration != null) duration = Number(o.duration);
        if (o.delay != null) delay = Number(o.delay);
        if (o.easing != null) easing = String(o.easing);
    }
    if (name == null) return null;
    const phase: PhaseAnim = { name };
    if (duration != null) phase.duration = duration;
    if (delay != null) phase.delay = delay;
    if (easing != null) phase.easing = easing;
    return phase;
}
