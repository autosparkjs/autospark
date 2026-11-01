/**
 * 图标归一化核心（ADR-0130）——纯数据机制：类型判定 → 四件套补齐 → 颜色规约 → 网格计算。
 *
 * 输入是 `normalizeSvgSpec`（本地串）/ `specFromResolved`（Iconify 远程）解析出的**基础归一化**
 * 产物（内容已剥离全部 stroke-width，ADR-0058 决策 6——本模块不重复也不豁免该剥离），在其上
 * 做**风格对齐**，使外来图标与内置规约（viewBox 0 0 24 24 + fill=none + stroke=currentColor +
 * 圆线帽/圆拐角）尽量一致：
 *
 * - **类型判定**（stroke 型 / fill 型）：fill 体系的「零干扰」由判定承载，非路径豁免
 *   （修订 ADR-0058 决策 10）。stroke 型 = 根 stroke≠none ∨ 内容含 stroke≠none ∨
 *   （根 fill=none 且内容无显式 fill）——第三条件是旧规则「根 fill=none 即补 stroke」的
 *   收紧（内容各自显式 fill 的 fill 型不再被强加描边，既有误伤修复）；
 * - **四件套补齐**：stroke 型且根缺某项才补 fill=none / stroke=currentColor /
 *   stroke-linecap=round / stroke-linejoin=round——**只补缺失、不覆盖显式声明**；
 * - **颜色规约**：全图（根+内容）fill/stroke 显式色值去重后**唯一**才换 currentColor
 *   （黑白也换——硬编码黑白同样不跟随暗色主题）；≥2 色 / url() / var() 引用一律保留
 *   （多色是作者意图）。只碰 presentation attributes，不解析内容级 style；
 * - **网格计算**：grid = max(viewBox 宽, 高)（preserveAspectRatio=meet 等比缩放由较大边
 *   决定），供渲染期描边粗细补偿（sw × grid/24，x-icon 内联 --as-icon-sw 承载）；
 *   viewBox 缺失/畸形为 null（不补偿）。
 *
 * 幂等（模板克隆重收集安全）；`raw`（根 data-raw 标志，normalizeSvgSpec 检出）跳过全部
 * 风格对齐。核心不读全局配置——`normalize` 开关由各管道调用侧传入（registry.options）。
 */

/** 内容级 fill/stroke 属性扫描（值双/单引号；前置空白防 stroke-width 等复合名误配） */
const PAINT_ATTR_RE = /\s(fill|stroke)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;

/** 值是否为可替换色值字面量（none / currentColor / url() / var() 引用系不算） */
function isPaintLiteral(v: string): boolean {
    const s = v.trim().toLowerCase();
    return s !== "" && s !== "none" && s !== "currentcolor" && !s.startsWith("url(") && !s.startsWith("var(");
}

/** 大小写不敏感取属性值（fill / stroke / data-raw 均小写，沿用 attrGet 的宽容口径） */
function attrValueCi(attrs: Record<string, string>, name: string): string | null {
    const lower = name.toLowerCase();
    for (const [k, v] of Object.entries(attrs)) {
        if (k.toLowerCase() === lower) return v;
    }
    return null;
}

/** 内容中某属性的全部值（fill / stroke 专用扫描；正则每次重置 lastIndex） */
function collectPaintValues(content: string, key: "fill" | "stroke"): string[] {
    const re = new RegExp(`\\s${key}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, "gi");
    const out: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(content))) out.push(m[1] ?? m[2] ?? "");
    return out;
}

/** viewBox（`left top width height`）→ 网格宽 = max(width, height)；四段非有限数或非正数为 null */
function parseGrid(viewBox: string | null): number | null {
    if (!viewBox) return null;
    const parts = viewBox.trim().split(/[\s,]+/).map(Number);
    if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) return null;
    const grid = Math.max(parts[2]!, parts[3]!);
    return grid > 0 ? grid : null;
}

/** 归一化核心入参：基础归一化产物三元组 + raw 标志（不依赖 SymbolSpec——纯数据处理，零模块环） */
export interface IconNormalizeInput {
    viewBox: string | null;
    /** 已剥离全部 stroke-width 的内容 */
    content: string;
    /** 根承载属性（xmlns/宽高/class/style/stroke-width/viewBox 已剥；data-raw 由调用侧检出转 raw） */
    attrs: Record<string, string>;
    /** 根 data-raw 标志——跳过全部风格对齐（ADR-0130 决策 6） */
    raw: boolean;
}

/** 归一化核心产物 */
export interface IconNormalizeOutput {
    content: string;
    attrs: Record<string, string>;
    /** 网格宽（max(viewBox 宽,高)）；缺失/畸形/raw/未启用为 null（渲染期不补偿） */
    grid: number | null;
    /** 变换摘要（debug 输出用；空数组 = 无变换） */
    changes: string[];
}

/** 四件套（stroke 型且根缺某项才补——只补缺失，不覆盖显式声明） */
const FOUR_PIECES: ReadonlyArray<readonly [string, string]> = [
    ["fill", "none"],
    ["stroke", "currentColor"],
    ["stroke-linecap", "round"],
    ["stroke-linejoin", "round"],
];

/**
 * 归一化核心（ADR-0130）。`enabled = false`（全局关）或 `raw` 时跳过全部风格对齐、
 * grid 记 null（网格补偿属本机制，随开关与逃逸阀一并失效）。
 */
export function normalizeIconCore(input: IconNormalizeInput, enabled: boolean): IconNormalizeOutput {
    const attrs = { ...input.attrs };
    if (!enabled || input.raw) return { content: input.content, attrs, grid: null, changes: [] };
    const changes: string[] = [];

    // 1) 类型判定：根/内容 stroke≠none，或根 fill=none 且内容无显式 fill（旧规则的收紧形态）
    const rootStroke = attrValueCi(attrs, "stroke");
    const rootFill = attrValueCi(attrs, "fill");
    const isStrokeType =
        (rootStroke != null && rootStroke.toLowerCase() !== "none") ||
        collectPaintValues(input.content, "stroke").some((v) => v.toLowerCase() !== "none") ||
        (rootFill != null && rootFill.toLowerCase() === "none" &&
            collectPaintValues(input.content, "fill").length === 0);

    // 2) 四件套补齐（只补缺失）
    if (isStrokeType) {
        for (const [k, v] of FOUR_PIECES) {
            if (attrValueCi(attrs, k) == null) {
                attrs[k] = v;
                changes.push(`补 ${k}="${v}"`);
            }
        }
    }

    // 3) 颜色规约：全图色值字面量去重后唯一才换（多色保留）
    let content = input.content;
    const literals = new Set<string>();
    for (const key of ["fill", "stroke"] as const) {
        const v = attrValueCi(attrs, key);
        if (v != null && isPaintLiteral(v)) literals.add(v);
    }
    PAINT_ATTR_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = PAINT_ATTR_RE.exec(content))) {
        const v = m[2] ?? m[3] ?? "";
        if (isPaintLiteral(v)) literals.add(v);
    }
    if (literals.size === 1) {
        const color = literals.values().next().value as string;
        for (const k of Object.keys(attrs)) {
            const kl = k.toLowerCase();
            if ((kl === "fill" || kl === "stroke") && attrs[k] === color) attrs[k] = "currentColor";
        }
        content = content.replace(PAINT_ATTR_RE, (whole, key: string, dq?: string, sq?: string) =>
            (dq ?? sq) === color ? ` ${key}="currentColor"` : whole,
        );
        changes.push(`颜色 ${color} → currentColor`);
    }

    // 4) 网格计算（渲染期补偿的几何事实，与风格变换无耦合）
    return { content, attrs, grid: parseGrid(input.viewBox), changes };
}

/** debug 摘要去重表（名+变换集）——add 幂等重收集不刷屏（ADR-0130 决策 7；console.debug 级静默姿态） */
const debugSeen = new Set<string>();

/** 输出归一化变换摘要（console.debug 级——归一化是预期行为非异常，不进 warn） */
export function logIconNormalize(name: string, changes: string[]): void {
    if (changes.length === 0) return;
    const key = `${name}｜${changes.join(",")}`;
    if (debugSeen.has(key)) return;
    debugSeen.add(key);
    console.debug(`[autospark/icons] 图标 "${name}" 归一化：${changes.join("；")}`);
}
