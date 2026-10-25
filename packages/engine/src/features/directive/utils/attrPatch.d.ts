/** class/style 分支的脏追踪状态（每次 patch 与上次产出 diff，消费者各持一份） */
export interface AttrPatchState {
    /** class 分支：上次本消费者产出的类名集合，用于 diff 增删（原生 class 的 token 不在此集，永不被碰） */
    lastAppliedClass: Set<string>;
    /** style 分支：上次对象写入的 style key 集合，用于切换时清除「上次有、本次无」的残留 key */
    lastAppliedStyle: Set<string>;
}
/** 创建一份独立的分派 diff 状态 */
export declare function createAttrPatchState(): AttrPatchState;
/** 分派选项 */
export interface AttrPatchOptions {
    /**
     * `.transition` 注入的有效 CSS `transition` 声明（仅 style 分支消费）。
     * undefined 不注入；由调用方解析三级优先（BindDirective.resolveTransitionOption）。
     */
    transition?: string;
}
/**
 * 按 attr 分派写入。求值为 undefined（宽松求值兜底）时走普通 attr 分支 removeAttribute。
 *
 * @param el      宿主元素
 * @param attr    属性名
 * @param value   求值结果（任意类型）
 * @param state   消费者持有的 diff 状态（跨次调用保持）
 * @param options 分派选项（transition 注入）
 */
export declare function patchAttrValue(el: HTMLElement, attr: string, value: any, state: AttrPatchState, options?: AttrPatchOptions): void;
