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

const SVG_NS = "http://www.w3.org/2000/svg";

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

/** 别名链最大深度（循环引用守卫） */
const MAX_ALIAS_DEPTH = 32;

/**
 * 解析图标集中的一个图标（经别名链解引用 + 根级默认合成）。
 * 未找到（不在 icons/aliases，或别名循环、parent 断链）返回 null——含 API 的 not_found 场景。
 */
export function resolveIconifyIcon(json: IconifyJSON, name: string): ResolvedIconify | null {
    // 别名链回溯：从请求名沿 parent 上溯到底层图标（visited 防循环）
    const chain: IconifyAlias[] = [];
    const visited = new Set<string>();
    let cur = name;
    while (json.aliases && Object.prototype.hasOwnProperty.call(json.aliases, cur)) {
        if (visited.has(cur) || chain.length >= MAX_ALIAS_DEPTH) return null;
        visited.add(cur);
        const alias = json.aliases[cur]!;
        chain.push(alias);
        cur = alias.parent;
    }
    const base = json.icons?.[cur];
    if (!base) return null;

    // 可选属性合成（Iconify 语义）：尺寸类就近胜——根级默认 ← base ← 别名链（链从请求端向
    // parent 端推进，逆序应用使请求端最近的别名最后写入、优先级最高）；变换类与顺序无关——
    // rotate 相加（mod 4）、flip 异或。
    let left = json.left ?? 0;
    let top = json.top ?? 0;
    let width = json.width ?? 16;
    let height = json.height ?? 16;
    let rotate = 0;
    let hFlip = false;
    let vFlip = false;
    const apply = (o: IconifyOptional) => {
        if (o.left != null) left = o.left;
        if (o.top != null) top = o.top;
        if (o.width != null) width = o.width;
        if (o.height != null) height = o.height;
        rotate = (rotate + (o.rotate ?? 0)) % 4;
        hFlip = hFlip !== !!o.hFlip;
        vFlip = vFlip !== !!o.vFlip;
    };
    apply(base);
    for (let i = chain.length - 1; i >= 0; i--) apply(chain[i]!);

    const viewBox = `${left} ${top} ${width} ${height}`;
    const transform = flipRotateTransform(left, top, width, height, rotate, hFlip, vFlip);
    const content = transform ? `<g transform="${transform}">${base.body}</g>` : base.body;
    return { viewBox, content };
}

/** 变换 → transform 串（围绕 viewBox 中心：平移到中心 → 翻转/旋转 → 平移回） */
function flipRotateTransform(
    left: number,
    top: number,
    width: number,
    height: number,
    rotate: number,
    hFlip: boolean,
    vFlip: boolean,
): string | null {
    if (!rotate && !hFlip && !vFlip) return null;
    const cx = left + width / 2;
    const cy = top + height / 2;
    const parts = [`translate(${cx} ${cy})`];
    const sx = hFlip ? -1 : 1;
    const sy = vFlip ? -1 : 1;
    if (sx !== 1 || sy !== 1) parts.push(`scale(${sx} ${sy})`);
    if (rotate) parts.push(`rotate(${rotate * 90})`);
    parts.push(`translate(${-cx} ${-cy})`);
    return parts.join(" ");
}

/** 解析产物 → SymbolSpec（viewBox + 内容；根级不补任何 stroke/fill 属性，ADR-0058 决策 10） */
export function specFromResolved(resolved: ResolvedIconify): SymbolSpec {
    return { viewBox: resolved.viewBox, content: resolved.content, attrs: {} };
}

/** 解析产物 → svg 字符串（全局远程经注册表 add 通道入库的序列化形态） */
export function svgFromResolved(resolved: ResolvedIconify): string {
    return `<svg xmlns="${SVG_NS}" viewBox="${resolved.viewBox}">${resolved.content}</svg>`;
}
