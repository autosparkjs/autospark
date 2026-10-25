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
export declare const SVG_NS = "http://www.w3.org/2000/svg";
/** symbol 内容规格：viewBox + 归一化内容 + 根级承载属性（fill / stroke / 线帽等） */
export interface SymbolSpec {
    /** viewBox 值（`left top width height`）；null = 声明未携带（use 按内容自然尺寸） */
    viewBox: string | null;
    /** 归一化后的 svg 内部内容（已剥离全部 stroke-width） */
    content: string;
    /** 根级承载属性（viewBox 之外：fill / stroke / stroke-linecap / stroke-linejoin 等） */
    attrs: Record<string, string>;
}
/**
 * svg 字符串 → symbol 归一化规格：剥离全部 stroke-width、root 属性白名单承载
 * （xmlns/id/宽高/class/style/stroke-width/viewBox 之外全承载）、缺 stroke 且
 * `fill="none"` 才补 currentColor。非 svg 输入返回 null。
 */
export declare function normalizeSvgSpec(svg: string): SymbolSpec | null;
/** 幂等创建/取回 document 级 sprite（SSR 无 document 守卫；body 缺席退 documentElement） */
export declare function ensureSprite(): SVGSVGElement | null;
/**
 * 注入/覆盖 symbol（同 id 后写胜——同名覆盖与「远程覆盖内联」共用的载体语义，ADR-0058 决策 12）。
 * 已存在则清空属性与内容重建。返回 symbol 元素（SSR 无 document 返回 null）。
 */
export declare function injectSymbol(id: string, spec: SymbolSpec): SVGSymbolElement | null;
/** 摘除 symbol（局部令牌引用计数归零时按前缀逐名清理，ADR-0058 决策 4） */
export declare function removeSymbol(id: string): void;
/** 取回 sprite 内全部 symbol id（测试与调试用） */
export declare function spriteSymbolIds(): string[];
