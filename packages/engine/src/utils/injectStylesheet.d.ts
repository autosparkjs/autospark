/**
 * 样式表注入工具：引擎内 **document 级 `<style>` 注入的统一入口**（幂等）。
 *
 * 语义：
 * - **查重键**：提供 `id` 时按 id 查重（已存在即复用，不重复注入）；未提供 `id` 时无从查重，
 *   每次调用都新建一个 `<style>`（「只调一次」是调用方的约定）；
 * - **模式**：`default`（缺省）仅当样式表不存在时写入内容（存在则原样返回、内容不动）；
 *   `replace` 覆写已有内容；`patch` 仅当内容与既有不同时覆写（等值零开销——
 *   不触发浏览器重解析，组件 scoped 样式覆盖声明通道，ADR-0113）；`append` 在已有内容后追加；
 * - **位置**：缺省注入 `head`；`location: "body"` 注入 body；`el` 指定容器元素（查找先限定
 *   该元素内，未命中退回文档级——防同 id 重复元素）；
 * - **惰性内容**：`css` 可传 `() => string` 工厂——`default`/`append` 仅在真正需要写入（新建 /
 *   append）时求值，复用既有样式表时零成本；`replace` 与 `patch` 恒求值（后者须求值才能比对）；
 * - **SSR 守卫**：无 document 时静默返回 undefined。
 */
export interface InjectStylesheetOptions {
    /** 注入位置（无 el 时生效），默认 head */
    location?: "head" | "body";
    /** 样式表 id：注入元素的 id，亦是查重键 */
    id?: string;
    /** 缺省 default：仅当同 id 样式表不存在时写入；replace=覆写；patch=内容不同才覆写 */
    mode?: "replace" | "patch" | "append" | "default";
    /** 指定时在该元素下注入（查找先限定该元素内） */
    el?: HTMLElement;
}
export declare function injectStylesheet(css: string | (() => string), options?: InjectStylesheetOptions): HTMLStyleElement | undefined;
