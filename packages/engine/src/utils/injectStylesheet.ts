/**
 * 样式表注入工具：引擎内 **document 级 `<style>` 注入的统一入口**（幂等）。
 *
 * 语义：
 * - **查重键**：提供 `id` 时按 id 查重（已存在即复用，不重复注入）；未提供 `id` 时无从查重，
 *   每次调用都新建一个 `<style>`（「只调一次」是调用方的约定）；
 * - **模式**：`default`（缺省）仅当样式表不存在时写入内容（存在则原样返回、内容不动）；
 *   `replace` 覆写已有内容；`append` 在已有内容后追加；
 * - **位置**：缺省注入 `head`；`location: "body"` 注入 body；`el` 指定容器元素（查找先限定
 *   该元素内，未命中退回文档级——防同 id 重复元素）；
 * - **惰性内容**：`css` 可传 `() => string` 工厂——仅在真正需要写入（新建 / replace / append）
 *   时求值，复用既有样式表时零成本（组件 scoped 样式改写经此规避重复改写）；
 * - **SSR 守卫**：无 document 时静默返回 undefined。
 */
export interface InjectStylesheetOptions {
    /** 注入位置（无 el 时生效），默认 head */
    location?: "head" | "body";
    /** 样式表 id：注入元素的 id，亦是查重键 */
    id?: string;
    /** 缺省 default：仅当同 id 样式表不存在时写入；replace=覆写；append=追加 */
    mode?: "replace" | "append" | "default";
    /** 指定时在该元素下注入（查找先限定该元素内） */
    el?: HTMLElement;
}

export function injectStylesheet(
    css: string | (() => string),
    options?: InjectStylesheetOptions,
): HTMLStyleElement | undefined {
    if (globalThis.document === undefined) return;
    const { id, mode = "default", location = "head", el } = options ?? {};
    const resolve = () => (typeof css === "function" ? css() : css);
    const existing = findStylesheet(id, el);
    if (!existing) {
        const style = document.createElement("style");
        // property 赋值登记 id（happy-dom 仅认 property 形态登记查询表）
        if (id) style.id = id;
        style.textContent = resolve();
        if (el) {
            el.appendChild(style);
        } else if (location == "body") {
            document.body.appendChild(style);
        } else {
            document.head.appendChild(style);
        }
        return style;
    }
    if (mode == "replace") {
        existing.textContent = resolve();
    } else if (mode == "append") {
        existing.textContent += resolve();
    }
    return existing;
}

/**
 * 查找既有样式表：无 id 无从查重返回 null；`el` 内优先，未命中退回文档级。
 * 命中非 `<style>` 元素（id 撞名）视为未命中。
 */
function findStylesheet(id: string | undefined, el?: HTMLElement): HTMLStyleElement | null {
    if (!id) return null;
    const escaped = id.replace(/["\\]/g, "\\$&");
    const found = el?.querySelector(`[id="${escaped}"]`) ?? document.getElementById(id);
    return found?.tagName === "STYLE" ? (found as HTMLStyleElement) : null;
}
