import { AutoSparkDirectiveBase } from "../features/directive/base";
import type { AutoSpark } from "../engine/engine";
import { injectStylesheet } from "../utils/injectStylesheet";

/**
 * x-version：版本显隐指令（ADR-0119）。
 *
 * `$.version`（`$` 元状态容器的版本居民，`options.version` 构造期注入初值）的声明式
 * 版本匹配糖：`x-version="2"` 仅版本 2 可见、`x-version="<=3,=1,2"` 任一子句命中即可见
 * （逗号分隔 OR）、`x-version="/^2\./"` 正则匹配。
 *
 * **显隐机制**：x-viewport 同构类方案（ADR-0106 决策 3）——隐藏 = 挂
 * `autospark-version-hidden` 类（全局样式 `display:none !important`，`static initialize`
 * 幂等注入），可见 = 摘类，**完全不碰 inline display**。组合语义：与 x-show 同元素时
 * **版本隐藏恒胜**（x-show 的显隐 / 动画 / 用户 CSS 只在版本可见时有话语权）；与
 * x-viewport 并列（两个类独立生效，任一命中即隐藏）；与 x-if / x-for / x-switch 正交
 * （不占子树）。v1 无动画（要动画用 `x-show="..."` 表达式形态）。
 *
 * **值语法（版本匹配表达式 DSL）**：逗号分隔子句、任一命中即可见（OR）；子句为
 * `[op]value` 或 `/pattern/flags`，op ∈ `= != < <= > >=`，裸值 ≡ `=`，子句与 token 均容忍
 * 空白；tokenizer 感知 `/.../` 区间——**正则子句内部逗号不分割**（`/1,2/` 合法）。
 * - 相等（`=`/裸值）：trim 后字符串全等；不等但两侧均可解析为有限数值时数值相等兜底
 *   （容 `$.version` 被写成数字 `2`）；
 * - `!=`：相等判定取反；
 * - 有序（`< <= > >=`）：两侧均可解析为有限数值 → 数值比较；两侧均为点分数字段
 *   （`2.1.3`）→ 逐段数值比较、短段补零（semver 风格）；其余不可比 → 该子句 false；
 * - 正则：解析期 `new RegExp(pattern, flags)` 编译一次，对 `$.version` 原始字符串 test。
 *
 * **失效语义**：`x-version=""` / 缺值 → **静默忽略**、元素恒渲染（有意的「不门控」
 * 声明，零告警）；`$.version` 为 undefined（版本未知）→ 静默短路恒渲染（版本未知时
 * 执行门控是语义错误，与 x-viewport 的「失效恒可见」同向）；非法子句（悬空运算符、
 * 未闭合正则、非法 pattern/flags）→ **warn 一次 + 指令整体忽略**（恒渲染）——手写短串
 * fail-fast，宽松跳过会吞掉 `"<3"` 误写 `<=3` 一类错误。无 `x-version-options` 配置项
 * （`!=` 与正则已覆盖反向语义）。
 */

/** 全局样式表 id（幂等；多 engine 共享、dispose 不移除——对齐 x-viewport 惯例） */
const VERSION_STYLE_ID = "autospark-version-styles";

/** 版本隐藏类（!important——版本隐藏恒胜 x-show 的 inline display 与用户 CSS） */
export const VERSION_HIDDEN_CLASS = "autospark-version-hidden";

/** 注入版本显隐全局样式（幂等） */
export function registerVersionStyles(): void {
    injectStylesheet(`.${VERSION_HIDDEN_CLASS}{display:none !important;}`, {
        id: VERSION_STYLE_ID,
    });
}

/** 字面子句的比较算子（裸值归一为 "="） */
export type VersionOp = "=" | "!=" | "<" | "<=" | ">" | ">=";

/** 单个匹配子句（编译产物）：字面 `[op]value` 形态或正则形态 */
export type VersionClause =
    | { type: "literal"; op: VersionOp; value: string }
    | { type: "regex"; re: RegExp };

/** 解析成功产物：clause 列表（编译一次，响应式重算只执行匹配） */
export interface ParsedVersionClauses {
    invalid: false;
    clauses: VersionClause[];
}

/** 解析失败产物：非法子句及其原文（调用方 warn 一次 + 指令整体忽略） */
export interface ParsedVersionInvalid {
    invalid: true;
    token: string;
}

export type ParsedVersionMatch = ParsedVersionClauses | ParsedVersionInvalid;

/**
 * 感知 `/.../` 区间的子句切分（tokenizer）：正则子句内部逗号不分割（`/1,2/` 合法）——
 * 子句首个非空白字符为 `/` 即进入正则区间，直至未转义收尾斜杠（`\` 转义不收尾）。
 * 返回切分结果；`unclosed` 非 null 表示存在未闭合正则，值为该问题片段（自其子句
 * 起始处到串尾，供 warn 定位）。
 */
function splitVersionClauses(source: string): { clauses: string[]; unclosed: string | null } {
    const clauses: string[] = [];
    let start = 0;
    let inRegex = false;
    let regexStart = -1;
    let clauseBegan = false; // 当前子句是否已出现首个非空白字符
    for (let i = 0; i < source.length; i++) {
        const ch = source.charAt(i); // charAt 恒返回 string（noUncheckedIndexedAccess 友好）
        if (inRegex) {
            if (ch === "\\") {
                i++; // 跳过转义字符（\/ 不作收尾）
            } else if (ch === "/") {
                inRegex = false;
            }
            continue;
        }
        if (ch === ",") {
            clauses.push(source.slice(start, i));
            start = i + 1;
            clauseBegan = false;
            continue;
        }
        if (!clauseBegan && !/\s/.test(ch)) {
            clauseBegan = true;
            if (ch === "/") {
                inRegex = true;
                regexStart = i;
            }
        }
    }
    if (inRegex) return { clauses, unclosed: source.slice(regexStart) };
    clauses.push(source.slice(start));
    return { clauses, unclosed: null };
}

/**
 * 解析单个子句 → 编译产物；非法子句返回 null（悬空运算符 / 纯运算符 / 未闭合正则 /
 * 非法 pattern 或 flags）。正则子句在此编译（new RegExp try/catch），解析产物缓存复用。
 */
function parseVersionClause(clause: string): VersionClause | null {
    if (clause.startsWith("/")) {
        // 正则形态 /pattern/flags：定位未转义收尾斜杠（tokenizer 已保证闭合，此处兜底）
        let close = -1;
        for (let i = 1; i < clause.length; i++) {
            const ch = clause[i];
            if (ch === "\\") {
                i++;
            } else if (ch === "/") {
                close = i;
                break;
            }
        }
        if (close === -1) return null;
        try {
            return {
                type: "regex",
                re: new RegExp(clause.slice(1, close), clause.slice(close + 1).trim()),
            };
        } catch {
            return null; // 非法 pattern / flags
        }
    }
    // 字面形态 [op]value：先试双字符算子再单字符；裸值 ≡ "="；算子与值之间容忍空白
    let op: VersionOp = "=";
    let rest = clause;
    const head2 = clause.slice(0, 2);
    if (head2 === "!=" || head2 === "<=" || head2 === ">=") {
        op = head2;
        rest = clause.slice(2);
    } else if (clause[0] === "=" || clause[0] === "<" || clause[0] === ">") {
        op = clause[0] as VersionOp;
        rest = clause.slice(1);
    }
    const value = rest.trim();
    if (value === "") return null; // 悬空运算符 / 纯运算符
    return { type: "literal", op, value };
}

/**
 * 解析指令值 → 版本匹配子句列表（纯函数，单测直击）：`/.../` 区间感知 tokenizer 切分
 * + 逐子句编译。空值（trim 后为空）返回 null——有意的「不门控」声明，调用方静默忽略
 * （恒渲染、零告警）；含非法子句返回 `{ invalid: true, token }`——调用方 warn 一次 +
 * 指令整体忽略（恒渲染）；空白子句静默跳过。
 */
export function parseVersionMatch(raw: unknown): ParsedVersionMatch | null {
    const source = String(raw ?? "").trim();
    if (source === "") return null;
    const { clauses: parts, unclosed } = splitVersionClauses(source);
    if (unclosed != null) return { invalid: true, token: unclosed };
    const compiled: VersionClause[] = [];
    for (const part of parts) {
        const clause = part.trim();
        if (clause === "") continue; // 空白子句静默跳过
        const parsed = parseVersionClause(clause);
        if (parsed == null) return { invalid: true, token: clause };
        compiled.push(parsed);
    }
    return { invalid: false, clauses: compiled };
}

/**
 * 数值有序比较：两侧均可解析为有限数值 → -1/0/1；否则 null（不可比，转点分比较）。
 */
function compareNumeric(a: string, b: string): number | null {
    const na = Number(a);
    const nb = Number(b);
    if (!Number.isFinite(na) || !Number.isFinite(nb)) return null;
    return na === nb ? 0 : na < nb ? -1 : 1;
}

/**
 * 点分数字段有序比较（semver 风格）：两侧均匹配 /^\d+(\.\d+)*$/ → 逐段数值比较、
 * 短段补零（如 "2.1.3" vs "3.0"）；否则 null（不可比，子句 false）。
 */
function compareDotted(a: string, b: string): number | null {
    if (!/^\d+(\.\d+)*$/.test(a) || !/^\d+(\.\d+)*$/.test(b)) return null;
    const as = a.split(".");
    const bs = b.split(".");
    const len = Math.max(as.length, bs.length);
    for (let i = 0; i < len; i++) {
        const x = Number(as[i] ?? 0);
        const y = Number(bs[i] ?? 0);
        if (x !== y) return x < y ? -1 : 1;
    }
    return 0;
}

/**
 * 字面相等判定：trim 后字符串全等；不等但两侧均可解析为有限数值 → 数值相等兜底
 * （容 `$.version` 被写成数字 `2`）。
 */
function isLiteralEqual(v: string, value: string): boolean {
    if (v === value) return true;
    const nv = Number(v);
    const nvalue = Number(value);
    return Number.isFinite(nv) && Number.isFinite(nvalue) && nv === nvalue;
}

/**
 * 对 `$.version` 值执行子句匹配（纯函数，单测直击）：任一子句命中即 true（OR）。
 * 字面子句以 trim 后字符串参与比较；正则子句对原始字符串 test（`g` 标志的 lastIndex
 * 状态先复位，避免跨次 test 漂移）。
 */
export function matchVersion(value: unknown, clauses: VersionClause[]): boolean {
    const v = String(value).trim();
    for (const clause of clauses) {
        if (clause.type === "regex") {
            clause.re.lastIndex = 0;
            if (clause.re.test(String(value))) return true;
            continue;
        }
        switch (clause.op) {
            case "=":
                if (isLiteralEqual(v, clause.value)) return true;
                break;
            case "!=":
                if (!isLiteralEqual(v, clause.value)) return true;
                break;
            default: {
                // 有序：两侧均有限数值 → 数值比较；两侧均点分数字段 → 逐段比较、短段补零；
                // 其余不可比 → 该子句 false
                const cmp = compareNumeric(v, clause.value) ?? compareDotted(v, clause.value);
                if (cmp == null) break;
                const hit =
                    (clause.op === "<" && cmp < 0) ||
                    (clause.op === "<=" && cmp <= 0) ||
                    (clause.op === ">" && cmp > 0) ||
                    (clause.op === ">=" && cmp >= 0);
                if (hit) return true;
            }
        }
    }
    return false;
}

/**
 * x-version 指令（ADR-0119）：Compile kind（基类默认）、singleton、priority 80（显隐
 * 家族对齐 x-show / x-viewport）。订阅 `$.version` 切版本隐藏类，不碰 inline display。
 */
export class VersionDirective extends AutoSparkDirectiveBase {
    static override readonly priority = 80;
    static override readonly singleton = true;

    /** 类级初始化：注入版本显隐全局样式（幂等） */
    static override initialize(_engine: AutoSpark): void {
        registerVersionStyles();
    }

    /** 匹配子句列表缓存（null = 指令失效——空值/非法子句，整体忽略不做动作） */
    private _clauses: VersionClause[] | null = null;

    override created(): void {
        const parsed = parseVersionMatch(this.value);
        if (parsed == null) return; // 空值：静默忽略（有意的「不门控」声明，恒渲染零告警）
        if (parsed.invalid) {
            this.warn(
                `x-version: 值 "${String(this.value ?? "")}" 含非法子句 "${parsed.token}"，指令已忽略（恒渲染）`,
            );
            return;
        }
        // 解析产物缓存：clause 列表编译一次，响应式重算只执行匹配
        this._clauses = parsed.clauses;
        // 订阅全局版本元状态（ADR-0105 容器 / ADR-0119）：初值即动作（x-show / x-viewport
        // 同法）；$.version 为 undefined（版本未知）→ _apply 静默短路恒渲染
        this.binding.watch("$.version", ({ value }) => this._apply(value));
        this._apply(this.binding.read("$.version"));
    }

    /** 应用版本判定：版本未知静默短路（恒渲染零告警）；否则任一子句命中摘类、未命中挂类 */
    private _apply(v: unknown): void {
        if (this._clauses == null) return;
        if (v == null) return;
        const hit = matchVersion(v, this._clauses);
        this.el.classList.toggle(VERSION_HIDDEN_CLASS, !hit);
    }
}
