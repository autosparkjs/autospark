import { patchAttrValue, createAttrPatchState } from "../utils/attrPatch";
import { isDirectiveAttr } from "../utils/isDirectiveAttr";
import type { BindDirective } from "./bind";

/**
 * 属性展开 / Attribute Spread（`x-bind="expr"` 无参形态，ADR-0043）
 *
 * 把一个对象**展开**成宿主元素的 N 个属性——`x-bind` 有参（`:title`）绑单属性、
 * 无参展 whole object（Vue `v-bind="obj"` 心智）。由 `BindDirective.created()` 在
 * `attr == null` 时组合委托，本类承载展开逻辑（单一职责），值→属性写入经共享的
 * `patchAttrValue` 五路分派（与单属性绑定依赖同一抽象，语义永不漂移）。
 *
 * ## 值分派（通用规则 + 四键特判）
 *
 * - **整值数组**（ADR-0043 数组扩展）：`x-bind="[{a:1},{b:'2'}]"` 多对象**合并**展开——
 *   JS spread 心智，键冲突后者覆盖前者；falsy 项跳过（`[cond && {a:1}, {b:2}]` 条件段），
 *   非对象项 warn（去重）+ 剔除（不支持嵌套数组）；
 * - **四特判键**（`class` / `style` / `value` / `checked`）走 bind 五路分派：
 *   `{class:{active:x}}` 对象 diff、`{style:{color:'red'}}` 键级增删、value/checked property 写入；
 * - **其余键**通用规则：`true → 裸属性`（presence/absence 语义，spread 场景布尔键常态，
 *   不查 bind 的布尔白名单——`aria-*` / `data-*` / 自定义元素属性全不在白名单）、
 *   `false / null / undefined → 移除`、`string / number → String()`、
 *   `object / array → warn + 剔除`（对象属性无法用属性值表达）。
 *
 * ## 覆盖顺序（JS spread 心智 + class 例外）
 *
 * - 书写在 spread **之前**的静态属性：被展开键覆盖（spread 管辖）；
 * - 书写在 spread **之后**的静态属性：**静态恒赢**（reservedKeys，本展开永不写、永不移除）；
 * - `class` 键例外：走 classList diff 合并语义，静态 token 永不被碰（引擎既有承诺）。
 *
 * ## 响应粒度（depth: 2，ADR-0043）
 *
 * - 裸 state 路径 `x-bind="props"` → 路径支路透传 `depth: 2`（自身 + 全部后代）：
 *   子键修改 / 新增键 / 删除键 / 整体替换均触发重展开；
 * - 字面量 `x-bind="{title: user.title}"` → 表达式支路 collectDependencies 键级响应
 *   （与 `x-class="{active:isActive}"` 同款通路）；
 * - **边界**：局部上下文（x-for item / x-data 局部）内的路径形态走表达式支路（读代理
 *   按实际读取收集依赖，无 depth 概念），仅整体替换触发——键级响应用字面量形态。
 *
 * ## 边界语义
 *
 * - 整值 `null` / `undefined` → 静默保留旧展开（合法空态，异步数据未落地不闪断）；
 * - 整值数组 → 多对象合并展开（见上）；整值非对象（`true` / 数字 / 字符串）→ warn（去重）+ 静默；
 * - 展开键名匹配指令属性形态（`x-*` / `@*` / `:*`）→ **指令屏障**：展开发生在运行期 patch，
 *   永不作为指令编译；照写为普通属性 + warn（可发现性，防「看似指令却不生效」的调试陷阱）；
 * - `.invert` 对对象取反无意义 → warn + 忽略；
 * - 键消失（上次有、本次无）→ 统一经 `patchAttrValue(el, key, undefined)` 清理：
 *   普通键 removeAttribute、property 键置空、class 清空本展开贡献的类、style 移除属性
 *   （与 `:style` falsy 既有语义一致——静态 style 一并移除，文档声明）。
 *
 * @example 静态字面量（字符串值须带引号——表达式求值，非 relaxed-json）
 * <div x-bind="{a:1, b:'2', c:true, d:false}">
 * // → <div a="1" b="2" c>（d 被移除；与 x-class 对象语法同构）
 *
 * @example 状态路径（depth:2：子键/新增/删除/替换均重展开）
 * <div x-bind="attrs">
 * // state.attrs = {title:'hi', disabled:true} → <div title="hi" disabled>
 * // store.state.attrs.title = 'yo' → <div title="yo" disabled>
 *
 * @example class 合并（静态 token 永不被碰）
 * <div class="btn" x-bind="{class:{primary:isPrimary}, title:tip}">
 */
export class SpreadBinder {
    private directive: BindDirective;

    /** 上次展开管辖的键集合（含 false/null 值键——处理过即管辖；不含被剔除的对象值键） */
    private lastKeys = new Set<string>();
    /** class/style 分支的 diff 状态（与 BindDirective 各持一份，互不共享） */
    private patchState = createAttrPatchState();
    /** warn 去重：同类警告仅首次（键集合变化后新键各 warn 一次，防状态反复替换刷屏） */
    private warned = new Set<string>();
    /** 静态接管键：书写在 spread 之后的静态属性名（静态恒赢，本展开永不写、永不移除） */
    private reservedKeys: Set<string>;
    /** 已挂事件监听器：键 → 当前 listener（替换/消失时移除旧监听，ADR-0045 决策 6） */
    private listeners = new Map<string, EventListener>();

    constructor(directive: BindDirective) {
        this.directive = directive;
        this.reservedKeys = this._collectReservedKeys();
    }

    /** 建立订阅并首展（由 BindDirective.created 在 attr == null 时调用） */
    init(): void {
        // .invert 对对象取反无意义：warn + 忽略（展开照常）
        if (this.directive.getOption("invert")) {
            this._warnOnce(
                "invert",
                `x-bind: .invert 修饰符对无参属性展开无意义，已忽略（ADR-0043）`,
            );
        }
        const initial = this.directive.binding.watch(
            String(this.directive.value),
            ({ value }) => this.apply(value),
            { depth: 2 },
        );
        this.apply(initial);
    }

    /**
     * 收集静态接管键：原始模板（`directive.template`，属性保序未剥）上**位于本无参
     * spread 指令属性之后**的静态（非指令）属性名。JS spread 心智的「后写覆盖先写」
     * 落到 HTML 上即：后写的静态属性遮蔽展开的同名键。
     *
     * 本指令属性形态：`x-bind` 或 `x-bind.<修饰符>`（排除 `x-bind:*` 有参与 `x-bind-options`）。
     */
    private _collectReservedKeys(): Set<string> {
        const reserved = new Set<string>();
        const tpl = this.directive.template;
        if (!tpl) return reserved;
        const attrs = tpl.attributes;
        let after = false;
        for (let i = 0; i < attrs.length; i++) {
            const name = attrs[i]!.name;
            if (!after) {
                if (name === "x-bind" || /^x-bind\.[^.]+$/.test(name)) after = true;
                continue;
            }
            if (!isDirectiveAttr(name)) reserved.add(name);
        }
        return reserved;
    }

    /** 整对象展开：diff 键集 + 逐键分派写入 */
    apply(value: any): void {
        const el = this.directive.el;
        if (!el) return;
        // 合法空态（异步数据未落地）：静默保留旧展开，不闪断
        if (value == null) return;
        // 数组形态（ADR-0043 数组扩展）：多对象合并展开——JS spread 心智，后者覆盖前者；
        // falsy 项跳过（[cond && {a:1}, {b:2}] 条件段惯用法），非对象项 warn（去重）+ 剔除
        if (Array.isArray(value)) {
            const merged: Record<string, any> = {};
            for (const item of value) {
                if (item == null) continue;
                if (typeof item !== "object" || Array.isArray(item)) {
                    this._warnOnce(
                        "non-object-item",
                        `x-bind: 展开数组项须为对象，实际得到 ${Array.isArray(item) ? "数组" : typeof item}，已剔除（ADR-0043）`,
                    );
                    continue;
                }
                Object.assign(merged, item);
            }
            value = merged;
        }
        // 整值非普通对象（true/数字/字符串）：笔误可发现，warn（去重）+ 静默
        if (typeof value !== "object") {
            this._warnOnce(
                "non-object",
                `x-bind: 展开值须为对象，实际得到 ${typeof value}，已忽略（ADR-0043）`,
            );
            return;
        }
        const nextKeys = new Set<string>();
        for (const key of Object.keys(value)) {
            // 静态接管：后写静态属性恒赢，本展开不写不删（键不入 lastKeys，清理循环也不会碰）
            if (this.reservedKeys.has(key)) continue;
            const v = (value as Record<string, any>)[key];
            // 四特判键：复用 bind 五路分派（class/style 对象 diff、value/checked property 写入）
            if (SPREAD_SPECIAL_KEYS.has(key)) {
                patchAttrValue(el, key, v, this.patchState);
                nextKeys.add(key);
                // select 的 value patch 在编译产物搬运（replaceChildren）后会丢失选中
                //（ADR-0026 同款坑，x-model 经推迟重放解决）——microtask 幂等重放
                if (
                    key === "value" &&
                    el instanceof HTMLSelectElement &&
                    v != null &&
                    String(v) !== ""
                ) {
                    const want = String(v);
                    queueMicrotask(() => {
                        if (el.value !== want) el.value = want;
                    });
                }
                continue;
            }
            // 事件监听器键（ADR-0045 决策 6）：`onXxx` 命名 + 函数值 → addEventListener
            // （$field.onInput / $field.onChange 的挂载通道；替换/消失时移除旧监听）
            if (typeof v === "function" && /^on[a-zA-Z]/.test(key)) {
                this._setEventListener(el, key, v);
                nextKeys.add(key);
                continue;
            }
            // choices 特判键（ADR-0045 决策 6 修订）：select 宿主 + 数组值 → option 子树
            // 全量重建（schema.choices 响应式变更 → form 的 schema watcher → refresh →
            // re-apply 重渲染；选中态经 value 键的 microtask 重放恢复）。非 select 宿主剔除
            if (key === "choices" && Array.isArray(v)) {
                if (el instanceof HTMLSelectElement) {
                    // 静态 <option> 优先：宿主已有手写选项时忽略两处 choices（与 x-model 三源同序）
                    if (!this._hasStaticOptions()) {
                        this._renderSelectChoices(el, v);
                        nextKeys.add(key);
                    }
                    continue;
                }
                this._warnOnce(
                    "choices-non-select",
                    `x-bind: 展开键 "choices" 的数组值仅在 <select> 宿主上渲染选项，${el.tagName} 上已剔除（ADR-0045）`,
                );
                continue;
            }
            // 指令屏障：展开键永不作为指令编译（编译期指令收集早于运行期展开），
            // 照写为普通属性 + warn——防「看似指令却不生效」的调试陷阱
            if (isDirectiveAttr(key)) {
                this._warnOnce(
                    `directive-key:${key}`,
                    `x-bind: 展开键 "${key}" 形似指令属性（x-* / @* / :*），仅作为普通属性写入、不会被编译执行（ADR-0043）`,
                );
            }
            // 通用规则：true 裸属性 / false·null·undefined 移除 / string·number String() / object·array 剔除
            if (v === true) {
                el.setAttribute(key, "");
                nextKeys.add(key);
            } else if (v === false || v == null) {
                el.removeAttribute(key);
                nextKeys.add(key);
            } else if (typeof v === "string" || typeof v === "number") {
                el.setAttribute(key, String(v));
                nextKeys.add(key);
            } else {
                this._warnOnce(
                    `object-value:${key}`,
                    `x-bind: 展开键 "${key}" 的值为对象/数组，无法表达为属性值，已剔除（ADR-0043）`,
                );
            }
        }
        // 键消失清理：上次管辖、本次没有的键——普通键移除、class 清空本展开贡献的类、
        // style 移除属性（与 :style falsy 既有语义一致）。value/checked 的 property 写入对
        // undefined 会 String 化为 "undefined"（HTML setter 语义），须显式置空 + 移除属性。
        for (const key of this.lastKeys) {
            if (nextKeys.has(key)) continue;
            const listener = this.listeners.get(key);
            if (listener) {
                // 事件监听器键消失：移除监听（ADR-0045 决策 6）
                el.removeEventListener(key.slice(2).toLowerCase(), listener);
                this.listeners.delete(key);
                continue;
            }
            if (key === "value") {
                (el as any).value = "";
                el.removeAttribute("value");
            } else if (key === "checked") {
                (el as any).checked = false;
                el.removeAttribute("checked");
            } else {
                patchAttrValue(el, key, undefined, this.patchState);
            }
        }
        this.lastKeys = nextKeys;
    }

    /** 挂载/替换事件监听（`onXxx` 键）：同引用幂等（$field 的事件封装缓存稳定引用，重复 apply 不重挂） */
    private _setEventListener(el: HTMLElement, key: string, fn: EventListener): void {
        const type = key.slice(2).toLowerCase();
        const prev = this.listeners.get(key);
        if (prev === fn) return; // 同引用：已挂载，幂等
        if (prev) el.removeEventListener(type, prev);
        el.addEventListener(type, fn);
        this.listeners.set(key, fn);
    }

    /**
     * 静态选项判定（与 x-model 的三级优先同序，ADR-0026 决策 1）：原始模板（`directive.template`）
     * 的 select 子级含 `<option>`/`<optgroup>` 即静态——两处 choices 整体忽略（手写优先）。
     * 须查 template 而非渲染 el：编译期 el 是浅克隆（静态子节点未挂入），且动态渲染的
     * options 也会出现在 el 上、不能据此误判。
     */
    private _hasStaticOptions(): boolean {
        const tpl = this.directive.template as HTMLSelectElement | undefined;
        if (!tpl) return false;
        for (const child of tpl.children) {
            if (child.tagName === "OPTION" || child.tagName === "OPTGROUP") return true;
        }
        return false;
    }

    /**
     * choices → option 子树全量重建（无 diff，ADR-0045 决策 6 修订；x-model _renderChoices 精简版）：
     * 项形态 `{label?, value?, ...}` / 字符串 / 数字（裸值 label=value）；value 缺省不设属性
     * （HTML 原生回退 textContent 即 value）；label 缺省回退 `String(value)`。选中态由 value 键的
     * microtask 重放恢复（重建在同轮 apply 的 value patch 之后清掉了选中）。
     */
    private _renderSelectChoices(el: HTMLSelectElement, choices: unknown[]): void {
        while (el.firstChild) el.removeChild(el.firstChild);
        for (const item of choices) {
            if (item == null) continue;
            const option = document.createElement("option");
            let label: unknown;
            let value: unknown;
            if (typeof item === "object") {
                label = (item as any).label;
                value = (item as any).value;
            } else {
                label = item;
                value = item;
            }
            if (value !== undefined && value !== null) option.value = String(value);
            option.textContent =
                label !== undefined && label !== null ? String(label) : String(value ?? "");
            el.appendChild(option);
        }
    }

    /** warn 去重：同一标记仅首次 */
    private _warnOnce(tag: string, msg: string): void {
        if (this.warned.has(tag)) return;
        this.warned.add(tag);
        this.directive.engine.logger.warn(msg);
    }
}

/** 走 bind 五路分派的特判键（其余键走通用规则） */
const SPREAD_SPECIAL_KEYS = new Set(["class", "style", "value", "checked"]);
