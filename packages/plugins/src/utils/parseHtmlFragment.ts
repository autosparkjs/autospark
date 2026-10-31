/** HTML 字符串解析为 DocumentFragment（自 engine utils/transformElement 复制，ADR-0008 决策 3）：空片段返回 null */
export function parseHtmlFragment(html: string): DocumentFragment | null {
    const tpl = document.createElement("template");
    tpl.innerHTML = html.trim();
    const frag = tpl.content;
    return frag.childNodes.length === 0 ? null : frag;
}
