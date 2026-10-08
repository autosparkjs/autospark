/**
 * SVG sprite 与 symbol 归一化（ADR-0058 决策 1/6）。
 *
 * **单一 document 级 sprite**：隐藏 `<svg>`（width/height 0 + absolute + aria-hidden，幂等
 * 创建），全部 symbol（全局 + 局部）同住其中、靠 id 前缀区分（`as-{name}` / `as-i{令牌}-{name}`）。
 * `<use href>` 按 id 文档全局解析——「图标域局部」靠前缀 + scope 链查找协议实现，非 DOM 隔离。
 *
 * **symbol 归一化**：剥离**全部** stroke-width（「宽度不是图标的一部分，是渲染参数」——生效
 * 宽度经 `.as-icon` 基础规则的 `--as-icon-sw` 变量下发，CSS 继承直达 use shadow 内容）；
 * root 缺 stroke 且 `fill="none"`（stroke 型图标）才补 currentColor——fill 体系（Iconify）
 * 零干扰（ADR-0058 决策 10「不补 stroke 系属性」）。xmlns 补齐不再需要（symbol 住 DOM，
 * 不走 data URL 图像解析）。
 */
export const SVG_NS = "http://www.w3.org/2000/svg";

/** sprite 容器 id（document 级共享，多 engine 同住） */
const SPRITE_ID = "autospark-icon-sprite";

/** symbol 内容规格：viewBox + 归一化内容 + 根级承载属性（fill / stroke / 线帽等） */
export interface SymbolSpec {
    /** viewBox 值（`left top width height`）；null = 声明未携带（use 按内容自然尺寸） */
    viewBox: string | null;
    /** 归一化后的 svg 内部内容（已剥离全部 stroke-width） */
    content: string;
    /** 根级承载属性（viewBox 之外：fill / stroke / stroke-linecap / stroke-linejoin 等） */
    attrs: Record<string, string>;
}

/** strip 全部 stroke-width 属性（双引号/单引号两种载体，ADR-0046 决策 4 哲学延续） */
const STROKE_WIDTH_ATTR_RE = /\sstroke-width\s*=\s*(?:"[^"]*"|'[^']*')/gi;

/** root `<svg>` 开标签（取首个；归一化处理的定位锚） */
const SVG_ROOT_TAG_RE = /<svg\b[^>]*>/i;

/** 属性对解析（值支持双/单引号；键保留原大小写——viewBox 是 camelCase） */
const ATTR_RE = /([:A-Za-z_][-:A-Za-z0-9_.]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;

/** symbol 归一化时 root 不承载的属性（id 被令牌化重建、宽高对 symbol 无意义） */
const ROOT_STRIP = new Set([
    "xmlns",
    "id",
    "width",
    "height",
    "class",
    "style",
    "x",
    "y",
    "stroke-width",
    "viewBox",
    "viewbox",
]);

function parseAttrs(src: string): Record<string, string> {
    const out: Record<string, string> = {};
    ATTR_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = ATTR_RE.exec(src))) out[m[1]!] = m[2] ?? m[3] ?? "";
    return out;
}

/** 大小写不敏感取属性（viewBox / viewbox 两种书写） */
function attrGet(attrs: Record<string, string>, name: string): string | null {
    if (attrs[name] != null) return attrs[name]!;
    const lower = name.toLowerCase();
    for (const [k, v] of Object.entries(attrs)) {
        if (k.toLowerCase() === lower) return v;
    }
    return null;
}

/**
 * svg 字符串 → symbol 归一化规格：剥离全部 stroke-width、root 属性白名单承载
 * （xmlns/id/宽高/class/style/stroke-width/viewBox 之外全承载）、缺 stroke 且
 * `fill="none"` 才补 currentColor。非 svg 输入返回 null。
 */
export function normalizeSvgSpec(svg: string): SymbolSpec | null {
    const m = svg.match(SVG_ROOT_TAG_RE);
    if (!m) return null;
    const rootTag = m[0];
    const rest = svg.slice(svg.indexOf(rootTag) + rootTag.length);
    const closeIdx = rest.toLowerCase().lastIndexOf("</svg");
    const inner = closeIdx >= 0 ? rest.slice(0, closeIdx) : "";
    const content = inner.replace(STROKE_WIDTH_ATTR_RE, "");
    const attrs = parseAttrs(rootTag);
    const carried: Record<string, string> = {};
    for (const [k, v] of Object.entries(attrs)) {
        if (ROOT_STRIP.has(k) || ROOT_STRIP.has(k.toLowerCase())) continue;
        carried[k] = v;
    }
    if (attrGet(attrs, "stroke") == null && attrGet(attrs, "fill") === "none") {
        carried.stroke = "currentColor";
    }
    return { viewBox: attrGet(attrs, "viewBox"), content, attrs: carried };
}

/** 幂等创建/取回 document 级 sprite（SSR 无 document 守卫；body 缺席退 documentElement） */
export function ensureSprite(): SVGSVGElement | null {
    if (typeof document === "undefined") return null;
    let sprite = document.getElementById(SPRITE_ID) as SVGSVGElement | null;
    if (!sprite) {
        sprite = document.createElementNS(SVG_NS, "svg") as SVGSVGElement;
        sprite.id = SPRITE_ID;
        sprite.setAttribute("xmlns", SVG_NS);
        sprite.setAttribute("width", "0");
        sprite.setAttribute("height", "0");
        sprite.setAttribute("aria-hidden", "true");
        sprite.style.position = "absolute";
        sprite.style.overflow = "hidden";
        (document.body ?? document.documentElement).appendChild(sprite);
    }
    return sprite;
}

/** 在 svg 上下文解析内容片段为节点（DOMParser text/html 的 foreign content 规则保证 SVG 命名空间） */
function parseSvgNodes(html: string): Node[] {
    if (!html.trim()) return [];
    const doc = new DOMParser().parseFromString(`<svg xmlns="${SVG_NS}">${html}</svg>`, "text/html");
    const svg = doc.body?.firstElementChild;
    if (!svg) return [];
    return Array.from(svg.childNodes).map((n) => document.importNode(n, true));
}

/**
 * 注入/覆盖 symbol（同 id 后写胜——同名覆盖与「远程覆盖内联」共用的载体语义，ADR-0058 决策 12）。
 * 已存在则清空属性与内容重建。返回 symbol 元素（SSR 无 document 返回 null）。
 */
export function injectSymbol(id: string, spec: SymbolSpec): SVGSymbolElement | null {
    const sprite = ensureSprite();
    if (!sprite) return null;
    let sym = document.getElementById(id) as SVGSymbolElement | null;
    if (sym && sym.tagName.toLowerCase() !== "symbol") sym = null; // id 被外部元素占用：不劫持他元素
    if (!sym) {
        sym = document.createElementNS(SVG_NS, "symbol") as SVGSymbolElement;
        sym.id = id;
        sprite.appendChild(sym);
    }
    while (sym.firstChild) sym.removeChild(sym.firstChild);
    for (const a of Array.from(sym.attributes)) {
        if (a.name !== "id") sym.removeAttribute(a.name);
    }
    if (spec.viewBox) sym.setAttribute("viewBox", spec.viewBox);
    for (const [k, v] of Object.entries(spec.attrs)) sym.setAttribute(k, v);
    for (const node of parseSvgNodes(spec.content)) sym.appendChild(node);
    return sym;
}

/** 摘除 symbol（局部令牌引用计数归零时按前缀逐名清理，ADR-0058 决策 4） */
export function removeSymbol(id: string): void {
    if (typeof document === "undefined") return;
    const sym = document.getElementById(id);
    if (sym && sym.tagName.toLowerCase() === "symbol") sym.remove();
}

/** 取回 sprite 内全部 symbol id（测试与调试用） */
export function spriteSymbolIds(): string[] {
    if (typeof document === "undefined") return [];
    const sprite = document.getElementById(SPRITE_ID);
    if (!sprite) return [];
    return Array.from(sprite.children)
        .filter((c) => c.tagName.toLowerCase() === "symbol")
        .map((c) => c.id);
}
