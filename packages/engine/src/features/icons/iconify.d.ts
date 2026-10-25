/**
 * IconifyJSON → symbol 转换（ADR-0058 决策 10，纯函数模块）。
 *
 * 转换规则：viewBox 自「JSON 根级默认 ← 图标级 ← 别名链（就近胜）」合成（兜底 0 0 16 16）；
 * rotate（90°×n）/ hFlip / vFlip → 内容包一层 `<g transform>`（围绕 viewBox 中心，转换期
 * 一次定型）；aliases 解引用（可选属性 alias 覆盖 parent、变换按 Iconify 语义合成——
 * rotate 相加、flip 异或；循环引用返回 null）；body 直塞不加工、不补 stroke 系属性
 * （Iconify 是 fill 体系）。
 */
import type { SymbolSpec } from "./symbol";
/** 图标的可选属性：可被图标单独定义，也可在图标集根层级设默认值 */
export interface IconifyOptional {
    left?: number;
    top?: number;
    width?: number;
    height?: number;
    /** 顺时针旋转次数（每次 90 度），默认 0 */
    rotate?: number;
    hFlip?: boolean;
    vFlip?: boolean;
}
/** 单个图标数据（icons 字段的值类型），body 是 svg 内部原始字符串 */
export interface IconifyIcon extends IconifyOptional {
    body: string;
}
/** 图标别名：复用 parent 的 body 并可叠加变换 */
export interface IconifyAlias extends IconifyOptional {
    parent: string;
}
/** IconifyJSON 图标集（消费子集：prefix/icons/aliases + 根级默认属性） */
export interface IconifyJSON extends IconifyOptional {
    prefix?: string;
    icons: Record<string, IconifyIcon>;
    aliases?: Record<string, IconifyAlias>;
}
/** 解析产物：viewBox + 已包裹变换的内容 */
export interface ResolvedIconify {
    viewBox: string;
    content: string;
}
/**
 * 解析图标集中的一个图标（经别名链解引用 + 根级默认合成）。
 * 未找到（不在 icons/aliases，或别名循环、parent 断链）返回 null——含 API 的 not_found 场景。
 */
export declare function resolveIconifyIcon(json: IconifyJSON, name: string): ResolvedIconify | null;
/** 解析产物 → SymbolSpec（viewBox + 内容；根级不补任何 stroke/fill 属性，ADR-0058 决策 10） */
export declare function specFromResolved(resolved: ResolvedIconify): SymbolSpec;
/** 解析产物 → svg 字符串（全局远程经注册表 add 通道入库的序列化形态） */
export declare function svgFromResolved(resolved: ResolvedIconify): string;
