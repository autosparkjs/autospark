/**
 * 相对元素查询（queryRelElement）：根据基准元素 + 相对选择器查找**关联元素**。
 *
 * 相对语法（四种形态）：
 * - `'.foo'`：在 el **内部** query（`el.querySelector('.foo')`，不含 el 自身）；
 * - `'../.foo'`：在 el 的**父元素**内部 query——`../` 可叠加（`'../../.foo'` = 祖父内部）；
 * - `'/.foo'`：**全局** query（`document.querySelector('.foo')`）；
 * - `'^a'`：从 el 向上 **closest**（含 el 自身）；`'^'` 后可叠加 `../` 前缀
 *   表示 closest 的**起点上爬**——`'^../a'` = `el.parentElement.closest('a')`、
 *   `'^../../.count'` = `el.parentElement.parentElement.closest('.count')`。
 *
 * 行为约定：
 * - **selector 为空（`''` / `undefined` / `null`）或 `'.'` / `'./'` → 返回 el 自身**（未指定
 *   关联元素 = 基准自身，与 x-loading「无 selector → 宿主」约定一致）；
 * - 未命中返回 `null`；**非法选择器**（querySelector/matches 抛 SyntaxError）同样返回 `null`
 *   （不抛错——调用方免 try-catch，与「未命中」同语义）；
 * - `el` 为空 → 返回 `null`；`'^'`/`'..'` 后无选择器 → 返回 `null`；
 * - **engine 边界止步（ADR-0060）**：`../` 爬升与 `^` closest 的向上逐级匹配**遇
 *   `data-autospark` 元素即止**——该元素自身仍参与匹配/query 范围，但不再向其 parentElement
 *   爬升。engine（app 根 / x-isolate 宿主等）是相对查找的世界边界，不越入相邻 engine 的 DOM；
 *   跨边界用 `/` 全局形态显式声明。原生 `closest()` 无法中途截停，`^` 改为手动逐级 matches；
 * - 返回值不限定 HTMLElement（可能命中 SVG 等）——调用方按需收窄。
 *
 * 消费方：x-loading 的 `selector`、x-dialog 的 `at.selector`、x-teleport 的目标解析（ADR-0059）。
 */
export declare function queryRelElement(el: Element | null | undefined, selector: string | null | undefined): Element | null;
