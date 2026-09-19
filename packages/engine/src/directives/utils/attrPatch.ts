import { normalizeClass } from "./normalizeClass";

/**
 * 属性写入五路分派（bind 家族共享，ADR-0043）
 *
 * 把「求值结果 → DOM 属性」的分派逻辑从 BindDirective 提炼为模块级函数，供两个消费者
 * 依赖同一抽象（语义永不漂移）：
 * - `BindDirective`（`:attr` / `x-bind:attr` 单属性绑定）
 * - `SpreadBinder`（`x-bind="obj"` 无参属性展开，bind-spread.ts）
 *
 * 分派按 attr 顺序敏感（`checked` 同属 property 与 boolean → property 优先）：
 * - `class` → `normalizeClass` + `classList` diff（`lastAppliedClass` 状态，**绝不用 `className=`**，
 *   原生 `class` 属性的 token 永不被碰；静态类走原生 `class`、动态类走 diff 合并）
 * - `style` → 字符串 `cssText` 整体替换 / 对象按 key 增删 diff（`lastAppliedStyle` 清残留，
 *   避免 `Object.assign` 合并泄漏）
 * - property 型（`value` / `checked`）→ `el[attr] = value`（**单向 state→DOM，非 x-model 双向**）
 * - boolean 型（`disabled` / `readonly` / `hidden` / `selected` / `multiple`）→ truthy `setAttribute` / falsy `removeAttribute`
 * - 普通 attribute → null/undefined/false `removeAttribute`，否则 `setAttribute(attr, String(value))`
 *
 * diff 状态以 `AttrPatchState` 参数传递，每个消费者各持一份、互不共享——同元素多个 bind
 * 实例的 class 竞写不做引用计数，destroy 可能误删共有类（接受，文档不保证）。
 */

/** property 型属性：state→DOM 单向写入（`el[attr] = value`），不监听事件 = 不是 x-model */
const PROPERTY_ATTRS = new Set(["value", "checked"]);
/** boolean 型属性：truthy 时 setAttribute（存在即生效），falsy 时 removeAttribute */
const BOOLEAN_ATTRS = new Set([
    "disabled",
    "checked",
    "readonly",
    "hidden",
    "selected",
    "multiple",
]);

/** class/style 分支的脏追踪状态（每次 patch 与上次产出 diff，消费者各持一份） */
export interface AttrPatchState {
    /** class 分支：上次本消费者产出的类名集合，用于 diff 增删（原生 class 的 token 不在此集，永不被碰） */
    lastAppliedClass: Set<string>;
    /** style 分支：上次对象写入的 style key 集合，用于切换时清除「上次有、本次无」的残留 key */
    lastAppliedStyle: Set<string>;
}

/** 创建一份独立的分派 diff 状态 */
export function createAttrPatchState(): AttrPatchState {
    return { lastAppliedClass: new Set(), lastAppliedStyle: new Set() };
}

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
export function patchAttrValue(
    el: HTMLElement,
    attr: string,
    value: any,
    state: AttrPatchState,
    options: AttrPatchOptions = {},
): void {
    if (attr === "class") return patchClass(el, value, state);
    if (attr === "style") return patchStyle(el, value, state, options.transition);
    // property 优先于 boolean（checked 同属两者）
    if (PROPERTY_ATTRS.has(attr)) {
        (el as any)[attr] = value;
        return;
    }
    if (BOOLEAN_ATTRS.has(attr)) {
        if (value) el.setAttribute(attr, "");
        else el.removeAttribute(attr);
        return;
    }
    // 普通 attribute：falsy 移除，否则设为字符串（true → "true"）
    if (value == null || value === false) el.removeAttribute(attr);
    else el.setAttribute(attr, String(value));
}

/**
 * class 分支：normalizeClass → classList 增删 diff。
 *
 * 只动 `lastAppliedClass` 与本次 `current` 的差集；原生 `class` 属性的 token 从不进
 * `lastAppliedClass`，故永不被 remove——静态类（`class="btn"`）与动态类（`:class`）安全共存。
 */
function patchClass(el: HTMLElement, value: any, state: AttrPatchState): void {
    const current = normalizeClass(value);
    for (const c of state.lastAppliedClass) if (!current.has(c)) el.classList.remove(c);
    for (const c of current) if (!state.lastAppliedClass.has(c)) el.classList.add(c);
    state.lastAppliedClass = current;
}

/**
 * style 分支：字符串 → `cssText` 整体替换；对象 → 按 key 增删 diff（`lastAppliedStyle`
 * 清除「上次有、本次无」的残留 key，避免 `Object.assign` 合并造成的样式泄漏）；falsy → 移除 style 属性。
 *
 * **`.transition` 注入**（仅 style）：每次 patch 内部把有效 `transition` 合并进去——对象模式并入写入对象
 * （用户自带 `transition` key 显式优先），字符串模式前置注入（用户串内已声明的 `transition` 因 CSS
 * 「后声明优先」仍胜出）。**不在首次设一次**：字符串模式 `cssText` 整替会擦除一次性写入。
 * 注入项纳入 `lastAppliedStyle` 追踪，持续生效；falsy 清空时随 `removeAttribute('style')` 一并清除。
 */
function patchStyle(el: HTMLElement, value: any, state: AttrPatchState, transition?: string): void {
    if (value == null || value === false || value === "") {
        el.removeAttribute("style");
        state.lastAppliedStyle.clear();
        return;
    }
    if (typeof value === "object") {
        // 用户对象自带 transition key 即显式优先（①）；否则注入配置层默认/覆盖（②③）
        const merged =
            transition && !Object.prototype.hasOwnProperty.call(value, "transition")
                ? { ...value, transition }
                : value;
        const next = new Set(Object.keys(merged));
        // 清掉上次写过、本次对象里没有的 key，防止残留（如 warn→normal 后 fontWeight 仍停留）
        for (const k of state.lastAppliedStyle) if (!next.has(k)) (el.style as any)[k] = "";
        // 写本次对象里的 key（驼峰 key 经 CSSStyleDeclaration 的 camelCase 访问器生效）
        for (const k of next) (el.style as any)[k] = (merged as Record<string, any>)[k];
        state.lastAppliedStyle = next;
        return;
    }
    // 字符串模式：前置注入（用户串里若已声明 transition，CSS 后声明优先 → 显式仍胜出）
    el.style.cssText = transition ? `transition:${transition};${String(value)}` : String(value);
    state.lastAppliedStyle.clear();
}
