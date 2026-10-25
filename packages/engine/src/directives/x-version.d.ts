import { AutoSparkDirectiveBase } from "../features/directive/base";
import type { AutoSpark } from "../engine/engine";
/** 版本隐藏类（!important——版本隐藏恒胜 x-show 的 inline display 与用户 CSS） */
export declare const VERSION_HIDDEN_CLASS = "autospark-version-hidden";
/** 注入版本显隐全局样式（幂等） */
export declare function registerVersionStyles(): void;
/** 字面子句的比较算子（裸值归一为 "="） */
export type VersionOp = "=" | "!=" | "<" | "<=" | ">" | ">=";
/** 单个匹配子句（编译产物）：字面 `[op]value` 形态或正则形态 */
export type VersionClause = {
    type: "literal";
    op: VersionOp;
    value: string;
} | {
    type: "regex";
    re: RegExp;
};
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
 * 解析指令值 → 版本匹配子句列表（纯函数，单测直击）：`/.../` 区间感知 tokenizer 切分
 * + 逐子句编译。空值（trim 后为空）返回 null——有意的「不门控」声明，调用方静默忽略
 * （恒渲染、零告警）；含非法子句返回 `{ invalid: true, token }`——调用方 warn 一次 +
 * 指令整体忽略（恒渲染）；空白子句静默跳过。
 */
export declare function parseVersionMatch(raw: unknown): ParsedVersionMatch | null;
/**
 * 对 `$.version` 值执行子句匹配（纯函数，单测直击）：任一子句命中即 true（OR）。
 * 字面子句以 trim 后字符串参与比较；正则子句对原始字符串 test（`g` 标志的 lastIndex
 * 状态先复位，避免跨次 test 漂移）。
 */
export declare function matchVersion(value: unknown, clauses: VersionClause[]): boolean;
/**
 * x-version 指令（ADR-0119）：Compile kind（基类默认）、singleton、priority 80（显隐
 * 家族对齐 x-show / x-viewport）。订阅 `$.version` 切版本隐藏类，不碰 inline display。
 */
export declare class VersionDirective extends AutoSparkDirectiveBase {
    static readonly priority = 80;
    static readonly singleton = true;
    /** 类级初始化：注入版本显隐全局样式（幂等） */
    static initialize(_engine: AutoSpark): void;
    /** 匹配子句列表缓存（null = 指令失效——空值/非法子句，整体忽略不做动作） */
    private _clauses;
    created(): void;
    /**
     * 应用版本判定：任一子句命中摘类、未命中挂类；版本未知（undefined/null）静默
     * 短路（跳过匹配、零告警）但**必须摘除隐藏类**——恒渲染是每次重算都要维持的
     * 不变式，「有版本→隐藏」切到「未知」时若不摘类，隐藏态会残留（demo 实测）。
     */
    private _apply;
}
