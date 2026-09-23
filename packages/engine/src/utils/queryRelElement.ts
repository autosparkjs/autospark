/**
 * 相对元素查询（queryRelElement）：根据基准元素 + 相对选择器查找**关联元素**。
 *
 * 相对语法（四种形态）：
 * - `'.foo'`：在 el **内部** query（`el.querySelector('.foo')`，不含 el 自身）；
 * - `'../.foo'`：在 el 的**父元素**内部 query——`../` 可叠加（`'../../.foo'` = 祖父内部）；
 * - `'/.foo'`：**全局** query（`document.querySelector('.foo')`）；
 * - `'^a'`：从 el 向上 **closest**（`el.closest('a')`，含 el 自身）；`'^'` 后可叠加 `../` 前缀
 *   表示 closest 的**起点上爬**——`'^../a'` = `el.parentElement.closest('a')`、
 *   `'^../../.count'` = `el.parentElement.parentElement.closest('.count')`。
 *
 * 行为约定：
 * - **selector 为空（`''` / `undefined` / `null`）或 `'.'` / `'./'` → 返回 el 自身**（未指定
 *   关联元素 = 基准自身，与 x-loading「无 selector → 宿主」约定一致）；
 * - 未命中返回 `null`；**非法选择器**（querySelector/closest 抛 SyntaxError）同样返回 `null`
 *   （不抛错——调用方免 try-catch，与「未命中」同语义）；
 * - `el` 为空 → 返回 `null`；`'^'`/`'..'` 后无选择器 → 返回 `null`；
 * - **爬升超出文档根时停在根元素**（`../..` 超出不再上爬，剩余选择器在根内 query/closest）；
 * - 返回值不限定 HTMLElement（可能命中 SVG 等）——调用方按需收窄。
 *
 * 消费方：x-loading 的 `selector`、x-dialog 的 `at.selector`。
 */
export function queryRelElement(
    el: Element | null | undefined,
    selector: string | null | undefined,
): Element | null {
    if (!el || selector == null) return el ?? null;
    const sel = selector.trim();
    if (!sel || sel === "." || sel === "./") return el; // 未指定 / 自身

    try {
        // '^'：closest 模式——'^' 后的 '../' 前缀表示 closest 起点上爬（多级），剩余为 closest 选择器；
        // 超出文档根时停在根元素继续 closest
        if (sel.startsWith("^")) {
            let node: Element = el;
            let target = sel.slice(1);
            while (target.startsWith("../")) {
                target = target.slice(3);
                node = node.parentElement ?? node; // 超出根时停在根
            }
            if (!target) return null; // '^' 或 '^../../' 后无选择器
            return node.closest(target);
        }

        // '/'：全局 query
        if (sel.startsWith("/")) {
            const target = sel.slice(1);
            if (!target) return null;
            return document.querySelector(target);
        }

        // 普通选择器 / '../' 父级爬升：爬升后剩余选择器在**当前层级元素内部** query；
        // 超出文档根时停在根元素继续 query
        let node: Element = el;
        let target = sel;
        while (target.startsWith("../")) {
            target = target.slice(3);
            node = node.parentElement ?? node; // 超出根时停在根
        }
        if (!target) return null; // 纯 '..'（如 '..'、'../..'）无选择器
        return node.querySelector(target);
    } catch {
        return null; // 非法选择器（SyntaxError 等）→ 与未命中同语义
    }
}
