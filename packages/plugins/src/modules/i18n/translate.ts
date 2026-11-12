/**
 * i18n 插件翻译核心（ADR-0136）：查表回退链 + 复数 + 插值。
 *
 * 本文件是插件覆写 `engine.translate` 槽的实现体（表达式闭包与命令式 `actions.t`
 * 共同分派到槽——单实现源）。运行时零依赖 engine 源码：`params` / 类型经 "autospark"
 * 导入，闭包构建时由参数落定（utils/vite 闭包工具）。
 *
 * **查表（key 就近收口）**：scope 链（WeakMap，script 块 / x-locales 收集）→ engine
 * 全局层（顶层游离 / `global` script 收集）→ `options.i18n.messages`；命中即收口，
 * 不再外扩（就近覆盖语义；不支持 null 删除）。
 *
 * **语言链（Q14）**：当前语言全等（归一）→ 当前语言主子标签（`zh-TW` 命中 `zh-CN`）
 * → fallback 全等 → fallback 主子标签 → 键本身（键也照常插值）。命中失败仅在有字典
 * 体系时 dev warn 一次性去重（零配置恒等场景不告警）。
 *
 * **复数（Q6/Q7）**：命中值为数组即复数模式——候选 = 第一个数字位置参数（严格
 * `typeof number`）> 第一个 `$` 数字变量（对象键序）；无候选取末项（other 语义）；
 * 下标 = clamp(floor(n), 0, len-1)；数字/$ 变量兼任插值。
 *
 * **`$.language` 惰性 ensure（决策七）**：首次查表时未设置则注入
 * `options.i18n.language ?? default` 初值——经响应式代理写（写裸引用不触发订阅通知）。
 */
import { params } from "autospark";
import type { AutoSpark, AutoSparkScope, TranslateImpl } from "autospark";
import type { I18nOptions } from "./types";

/* ── 字典存储（插件自治 WeakMap，engine 类型面零侵入——"scope.locales" 是文档概念） ── */

/** scope 就近字典层（script 块收集最近祖先 scope、x-locales 挂自身 scope）；scope 销毁键自动回收 */
const scopeDicts = new WeakMap<object, Record<string, any>>();
/** engine 全局层（顶层游离 / `global` 属性 script 收集——等价 options.i18n.messages 的运行时补充） */
const engineDicts = new WeakMap<object, Record<string, any>>();

/** 向 scope 就近层合并字典（同 scope 内 x-locales > script：后收集者覆盖同键，ADR-0136 决策三） */
export function collectScopeDict(scope: AutoSparkScope, dict: Record<string, any>): void {
    scopeDicts.set(scope, { ...scopeDicts.get(scope), ...dict });
}

/** 向 engine 全局层合并字典（多块顶层/global script 按编译序后者覆盖同键） */
export function collectEngineDict(engine: AutoSpark, dict: Record<string, any>): void {
    engineDicts.set(engine, { ...engineDicts.get(engine), ...dict });
}

/* ── 工具 ── */

/** 语言码归一：大小写与 `-`/`_` 等价（对齐 router normalizeLanguageTag 语义，自实现免跨包依赖） */
function normalizeTag(tag: string): string {
    return tag.trim().toLowerCase().replace(/_/g, "-");
}

/** 类型谓词形态（收窄掉 null/undefined，供 messages 等可选字典字段的守卫） */
function isPlainObject(v: any): v is Record<string, any> {
    return v != null && typeof v === "object" && !Array.isArray(v);
}

function hasOwn(obj: any, key: string): boolean {
    return Object.prototype.hasOwnProperty.call(obj, key);
}

/** dev warn 一次性去重（key 级） */
const missWarned = new Set<string>();
const mixedWarned = new Set<string>();

/* ── `$.language` 惰性 ensure ── */

/**
 * 读当前语言；未设置且可注入初值时写 `options.i18n.language ?? default`。
 * 每次自 `store.state` 现读（`$` 容器与子键写必须经响应式代理——裸引用写不触发订阅，
 * `$.viewport` ensureMetaContainer 同款纪律）。
 */
export function ensureLanguage(engine: AutoSpark): string | undefined {
    const state = (engine.store as any)?.state as any;
    if (!state) return undefined;
    const current = state.$?.language;
    if (typeof current === "string" && current !== "") return current;
    const i18n = (engine.options.i18n ?? {}) as I18nOptions;
    const init = i18n.language ?? i18n.default;
    if (typeof init === "string" && init !== "") {
        try {
            if (!state.$) state.$ = {}; // 经代理写创建容器（viewport:false 等场景 `$` 可能缺席）
            state.$.language = init; // 现读子代理写——触发订阅
        } catch {
            // 只读 store 等防御：静默降级（查表按未设置处理）
        }
        return init;
    }
    return undefined;
}

/* ── 查表与语言链 ── */

interface LookupResult {
    /** 沿途所有含该 key 的字典条目（近 → 远有序） */
    layers: Record<string, any>[];
    /** 查表沿途是否见到任何字典（miss warn 只在有字典体系时发——零配置恒等不告警） */
    dictPresent: boolean;
}

/**
 * key 查表：scope 链 → engine 全局层 → options.i18n.messages，**沿途收集**所有含该 key
 * 的条目（近 → 远有序，分层语言链语义）。
 *
 * 消费侧（translate）按层做语言链匹配：**近层已有语言优先，近层缺的语言由远层补**——
 * 组件只内置两个语言包时，使用处可用 x-locales 注入第三语言的译文（同 key 同语言仍
 * 近层胜，就近覆盖语义不变；单层声明时与「key 收口」行为完全一致）。
 */
function collectLayers(
    engine: AutoSpark,
    scope: AutoSparkScope | undefined,
    key: string,
): LookupResult {
    const layers: Record<string, any>[] = [];
    let dictPresent = false;
    let s: AutoSparkScope | null | undefined = scope;
    while (s) {
        const dict = scopeDicts.get(s);
        if (dict) {
            dictPresent = true;
            if (hasOwn(dict, key) && isPlainObject(dict[key])) layers.push(dict[key]);
        }
        s = s.parent;
    }
    const globalDict = engineDicts.get(engine);
    if (globalDict) {
        dictPresent = true;
        if (hasOwn(globalDict, key) && isPlainObject(globalDict[key])) layers.push(globalDict[key]);
    }
    const messages = (engine.options.i18n as I18nOptions | undefined)?.messages;
    if (isPlainObject(messages)) {
        dictPresent = true;
        if (hasOwn(messages, key) && isPlainObject(messages[key])) layers.push(messages[key]);
    }
    return { layers, dictPresent };
}

/**
 * 单层语言匹配：① 全等（归一）→ ② 主子标签（候选主标签 == 键主标签，`zh-TW` 命中 `zh-CN`）。
 * 语言链序（language 全等 → 主子 → fallback 全等 → 主子）由调用点按 `matchEntry(entry, lang)
 * ?? matchEntry(entry, fallback)` 组装。
 */
function matchEntry(entry: Record<string, any>, lang: string | undefined): any {
    if (!entry || !lang) return undefined;
    const target = normalizeTag(lang);
    if (target === "") return undefined;
    for (const k of Object.keys(entry)) {
        if (normalizeTag(k) === target) return entry[k];
    }
    const primary = target.split("-")[0];
    for (const k of Object.keys(entry)) {
        if (normalizeTag(k).split("-")[0] === primary) return entry[k];
    }
    return undefined;
}

/* ── 复数 ── */

/** 复数候选（Q7）：第一个数字位置参数（严格 typeof number）> 第一个 `$` 数字变量（对象键序） */
function pickPluralCount(positional: any[], named: Record<string, any> | null): number | undefined {
    for (const a of positional) {
        if (typeof a === "number") return a;
    }
    if (named) {
        for (const [k, v] of Object.entries(named)) {
            if (k.startsWith("$") && typeof v === "number") return v;
        }
    }
    return undefined;
}

/** 复数选条：无候选取末项（other 语义）；下标 = clamp(floor(n), 0, len-1) */
function pickPlural(arr: any[], positional: any[], named: Record<string, any> | null): any {
    const count = pickPluralCount(positional, named);
    if (count === undefined) return arr[arr.length - 1];
    return arr[Math.min(Math.max(Math.floor(count), 0), arr.length - 1)];
}

/* ── 主流程 ── */

/**
 * 翻译主流程（`engine.translate` 槽的实现体）。
 * 未命中键返回键本身 + 插值（平滑降级，与核心兜底 t 输出形态一致）。
 */
export function translate(
    engine: AutoSpark,
    scope: AutoSparkScope | undefined,
    key: string,
    ...args: any[]
): string {
    // ① 参数分流（Q16：对象参数与位置参数混用不支持——warn + 忽略位置参数）
    let named: Record<string, any> | null = null;
    let positional: any[] = args;
    if (args.length >= 1 && isPlainObject(args[0])) {
        named = args[0] as Record<string, any>;
        positional = [];
        if (args.length > 1 && !mixedWarned.has(key)) {
            mixedWarned.add(key);
            engine.logger?.warn(
                `t("${key}"): 对象参数与位置参数混用不受支持，复数请用 {$count} 通道——位置参数已忽略（ADR-0136）`,
            );
        }
    }

    // ② 查表（key 就近收集）→ 分层语言链解析：近层已有语言优先，近层缺的语言由远层补
    const { layers, dictPresent } = collectLayers(engine, scope, key);
    let value: any;
    if (layers.length > 0) {
        const lang = ensureLanguage(engine);
        const i18n = (engine.options.i18n ?? {}) as I18nOptions;
        for (const layer of layers) {
            value = matchEntry(layer, lang) ?? matchEntry(layer, i18n.fallback);
            if (value !== undefined) break;
        }
    }

    // ③ 复数（命中值为数组即复数模式；fallback 命中的数组同语义）
    if (Array.isArray(value)) value = pickPlural(value, positional, named);

    // ④ 插值（未命中键本身也插值——与核心兜底 t 输出一致）
    const template = value === undefined || value === null ? key : String(value);
    const output = named ? params(template, named) : params(template, ...positional);

    // ⑤ miss warn（一次性，仅在有字典体系时——零配置恒等场景不告警）
    if ((value === undefined || value === null) && dictPresent && !missWarned.has(key)) {
        missWarned.add(key);
        engine.logger?.warn(
            `t("${key}"): 字典中无当前语言的翻译（语言链与 fallback 均未命中），已按原文返回（ADR-0136）`,
        );
    }
    return output;
}

/** 插件版翻译实现（`engine.translate` 槽的覆写体，bootstrap ready 调用） */
export function createI18nTranslate(engine: AutoSpark): TranslateImpl {
    return (scope, key, ...args) => translate(engine, scope, key, ...args);
}
