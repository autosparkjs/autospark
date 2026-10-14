/**
 * HeadManager 特性 —— SEO `<head>` 管理（两阶段）
 *
 * 纯前端路由无法被爬虫直接抓取子路由内容，本特性把「当前路由声明了什么」反映到文档
 * `<head>`，使**执行 JS 的爬虫**（Google / Bing）在渲染 SPA 后拿到完整的标题、描述、
 * canonical、robots、Open Graph 与 JSON-LD 结构化数据。不执行 JS 的弱爬虫（百度）
 * 看不到这些内容——见 docs 的服务端配合章节。
 *
 * ## 两阶段时序
 *
 * - **阶段 A（路由级）**：`onRouteUpdate` 中 `_renderRoutes` 完成后立即写入。
 *   声明来源是路由表（`route.title` + `route.meta` 固定键），父 → 子合并、子覆盖。
 * - **阶段 B（视图级）**：延后一个宏任务（engine 首渲 defer 至微任务，ADR-0017），
 *   读取已挂载视图里的 `<autospark-view-meta>` 同名属性，与阶段 A 的声明合并后再整体
 *   写入——即「视图声明覆盖路由声明」。导航版本号变化时该次延后写入作废。
 *
 * ## 不受影响的场景
 *
 * - **模态路由**（`push("!...")`）：不经过 `onRouteUpdate`，天然跳过 head 管理——
 *   模态是叠加在当前页之上的浮层，改 `document.title` 会破坏底页语义。
 * - **hash 模式**：`#` 之后的路径不参与服务端请求，SEO 硬能力（canonical/OG/结构化
 *   数据随 URL 变化）不成立，仅保留 head 管理本身；attach 时一次性告警提示。
 *
 * @module features/headManager
 */

import type { AutoSparkRouter } from "@/router";
import type { AutoSparkMatchedRouteItem, RouteErrorHookArgs } from "@/types";

/** 本特性写入的受管标签标记属性（用于识别「router 管理的 head 标签」） */
export const SEO_MARK_ATTR = "data-autospark-seo";

/**
 * 一条 SEO 声明——`route.meta` 与 `<autospark-view-meta>` 共用的同构键集
 */
export interface HeadDeclarations {
    /** 页面标题（经 titleTemplate 格式化后写入 document.title） */
    title?: string;
    /** meta description */
    description?: string;
    /** canonical 地址（仅显式声明才注入，不自动构造） */
    canonical?: string;
    /** meta robots */
    robots?: string;
    /** Open Graph 标签（属性名 → 内容，已归一到 `og:` 前缀） */
    og?: Record<string, string>;
    /** JSON-LD 结构化数据（对象或对象数组） */
    jsonLd?: unknown;
    /** 单路由 / 单视图的 head 管理开关（false = 本路由不管理） */
    seo?: boolean;
}

/** 受管标签登记簿条目 */
interface ManagedTag {
    el: Element;
    /** true = 本特性创建（清除时移除）；false = 复用既有标签（清除时还原原值） */
    created: boolean;
    /** 复用时的原始属性快照 */
    original: Array<[string, string | null]>;
}

// ===========================================================================
// 纯函数工具
// ===========================================================================

/** 宽松布尔化（`meta.seo` / ViewMeta `seo` 属性共用） */
function toBool(value: unknown): boolean {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") return value !== "false" && value !== "0";
    return !!value;
}

/** 归一 Open Graph 声明为「属性名 → 内容」；键已含 `:` 则原样保留（放行 twitter:* 等） */
function normalizeOg(og: unknown): Record<string, string> {
    const out: Record<string, string> = {};
    if (Array.isArray(og)) {
        for (const item of og) {
            if (item && typeof item === "object" && (item as any).property) {
                out[String((item as any).property)] = String((item as any).content ?? "");
            }
        }
    } else if (og && typeof og === "object") {
        for (const key of Object.keys(og as Record<string, unknown>)) {
            const value = (og as Record<string, unknown>)[key];
            if (value === undefined || value === null) continue;
            out[key.includes(":") ? key : `og:${key}`] = String(value);
        }
    }
    return out;
}

/** 解析 JSON 属性值，失败返回 undefined（声明视为未提供） */
function parseJson(value: string | null): unknown {
    if (value === null || value === "") return undefined;
    try {
        return JSON.parse(value);
    } catch {
        return undefined;
    }
}

/**
 * 合并两份声明：`over` 的**已声明键**覆盖 `base`；`og` 按属性逐键合并
 * （父/路由层提供骨架、子/视图层补字段的常见形态）
 */
export function mergeHeadDeclarations(
    base: HeadDeclarations,
    over: HeadDeclarations | null | undefined,
): HeadDeclarations {
    const out: HeadDeclarations = { ...base };
    if (!over) return out;
    if (over.title !== undefined) out.title = over.title;
    if (over.description !== undefined) out.description = over.description;
    if (over.canonical !== undefined) out.canonical = over.canonical;
    if (over.robots !== undefined) out.robots = over.robots;
    if (over.jsonLd !== undefined) out.jsonLd = over.jsonLd;
    if (over.seo !== undefined) out.seo = over.seo;
    if (over.og !== undefined) out.og = { ...(base.og ?? {}), ...over.og };
    return out;
}

/** 只抽取约定键——`route.meta` 的其余键（权限、页签等）不参与 head 写入 */
function metaToDeclarations(meta: Record<string, any>): HeadDeclarations {
    const decl: HeadDeclarations = {};
    if (typeof meta.title === "string" && meta.title !== "") decl.title = meta.title;
    if (typeof meta.description === "string") decl.description = meta.description;
    if (typeof meta.canonical === "string") decl.canonical = meta.canonical;
    if (typeof meta.robots === "string") decl.robots = meta.robots;
    if (meta.og !== undefined && meta.og !== null) decl.og = normalizeOg(meta.og);
    if (meta.jsonLd !== undefined && meta.jsonLd !== null) decl.jsonLd = meta.jsonLd;
    if (meta.seo !== undefined && meta.seo !== null) decl.seo = toBool(meta.seo);
    return decl;
}

/**
 * 沿匹配链收集路由级声明：`route.title` → `meta.title`，父 → 子合并、子覆盖
 */
export function collectRouteDeclarations(
    toRoute: AutoSparkMatchedRouteItem[],
): HeadDeclarations {
    let decl: HeadDeclarations = {};
    for (const matched of toRoute) {
        const route = matched.route;
        // 404 未匹配项 route 为 undefined（createUnmatchedRouteItem）
        if (!route) continue;
        if (route.title) decl.title = route.title;
        if (route.meta && typeof route.meta === "object") {
            decl = mergeHeadDeclarations(decl, metaToDeclarations(route.meta));
        }
    }
    return decl;
}

/** 元素是否落在指定 hash 的视图容器内（沿祖先链找最近的 data-view-hash） */
function insideViewHash(el: Element, hash: string, root: Element): boolean {
    let node: Element | null = el;
    while (node && node !== root) {
        const holder = node.getAttribute?.("data-view-hash");
        if (holder !== null && holder !== undefined) return holder === hash;
        node = node.parentElement;
    }
    return false;
}

/** 从 `<autospark-view-meta>` 属性读取声明（属性名与 route.meta 键同构） */
function viewMetaToDeclarations(el: Element): HeadDeclarations {
    const decl: HeadDeclarations = {};
    const title = el.getAttribute("title");
    if (title) decl.title = title;

    const description = el.getAttribute("description");
    if (description !== null) decl.description = description;

    const canonical = el.getAttribute("canonical");
    if (canonical !== null) decl.canonical = canonical;

    const robots = el.getAttribute("robots");
    if (robots !== null) decl.robots = robots;

    const seo = el.getAttribute("seo");
    if (seo !== null) decl.seo = toBool(seo);

    const og = parseJson(el.getAttribute("og"));
    if (og !== undefined) decl.og = normalizeOg(og);

    const jsonLd = parseJson(el.getAttribute("jsonld") ?? el.getAttribute("json-ld"));
    if (jsonLd !== undefined) decl.jsonLd = jsonLd;

    return decl;
}

/**
 * 阶段 B：从已挂载视图中收集 `<autospark-view-meta>` 声明
 *
 * 按匹配链顺序（父 → 子）遍历，每层只认挂在该层 `data-view-hash` 容器里的
 * ViewMeta——keepAlive 缓存的旧视图因此不会被误采。
 *
 * @returns 合并后的声明；链上没有任何 ViewMeta 时返回 null（阶段 A 的写入保持不变）
 */
export function collectViewDeclarations(
    router: AutoSparkRouter,
    toRoute: AutoSparkMatchedRouteItem[],
): HeadDeclarations | null {
    const host = router.host;
    if (!host || !host.querySelectorAll) return null;
    const metas = host.querySelectorAll("autospark-view-meta");
    if (!metas.length) return null;

    let found = false;
    let decl: HeadDeclarations = {};
    for (const matched of toRoute) {
        if (!matched.hash) continue;
        for (const el of Array.from(metas)) {
            if (!insideViewHash(el, matched.hash, host)) continue;
            found = true;
            decl = mergeHeadDeclarations(decl, viewMetaToDeclarations(el));
        }
    }
    return found ? decl : null;
}

/** 按 tag + 单一属性值查找（避免把值拼进选择器——og 属性名含 `:` 等字符） */
function findByAttr(root: ParentNode, tag: string, attr: string, value: string): Element | null {
    for (const el of Array.from(root.querySelectorAll(tag))) {
        if (el.getAttribute(attr) === value) return el;
    }
    return null;
}

/** canonical 兼容 `rel` 多值形态（`rel="canonical alternate"`） */
function findCanonical(root: ParentNode): Element | null {
    for (const el of Array.from(root.querySelectorAll("link"))) {
        const rel = el.getAttribute("rel");
        if (rel && rel.split(/\s+/).includes("canonical")) return el;
    }
    return null;
}

/** 相对地址按 siteUrl 解析为绝对地址；已绝对或未配置 siteUrl 时原样返回 */
function resolveWithSiteUrl(url: string, siteUrl: string | undefined): string {
    if (!siteUrl) return url;
    if (/^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith("//")) return url;
    return siteUrl.replace(/\/+$/, "") + (url.startsWith("/") ? url : `/${url}`);
}

// ===========================================================================
// Mixin
// ===========================================================================

/**
 * SEO head 管理器（ts-mixer 混入 AutoSparkRouter）
 *
 * 全部字段不带初始化器（ts-mixer 不执行 mixin 的字段初始化），改由
 * `_headAttach` 懒初始化——与 Context 特性的写法一致。
 */
export class HeadManager {
    /** attach 时捕获的种子 `<title>`：路由未声明标题时的回退值 */
    protected _headSeedTitle?: string;
    /** 本特性是否写入过 `document.title` */
    protected _headTitleApplied?: boolean;
    /** 受管标签登记簿 */
    protected _headTags?: ManagedTag[];
    /** 当前导航的渲染 / 加载错误（routeError 钩子置位，阶段 A 读取后清空） */
    protected _headRenderError?: unknown;
    /** 阶段 A 算出的路由级声明（阶段 B 在其上叠加视图声明） */
    protected _headRouteDecl?: HeadDeclarations;
    /** 阶段 B 的延后定时器 */
    protected _headViewTimer?: ReturnType<typeof setTimeout>;
    /** 已注册的内部 routeError 钩子（detach 时移除） */
    protected _headRouteErrorHook?: (args: RouteErrorHookArgs) => void;
    /** hash 模式告警只发一次 */
    protected _headHashWarned?: boolean;

    /** head 管理是否启用（`head: false` 整体关闭） */
    protected _headEnabled(this: AutoSparkRouter): boolean {
        return this.options.head !== false;
    }

    /** 本次导航的 head 配置（未声明 = 默认开启） */
    protected _headConfig(this: AutoSparkRouter) {
        const head = this.options.head;
        return head === false || head === undefined ? undefined : head;
    }

    /**
     * attach 时初始化：捕获种子标题 + 注册内部 routeError 钩子
     *
     * `head: false` 时整体跳过——router 不再读写 `<head>`。
     */
    protected _headAttach(this: AutoSparkRouter): void {
        if (!this._headEnabled()) return;
        this._headSeedTitle = typeof document !== "undefined" ? document.title : "";
        this._headTags = [];
        this._headTitleApplied = false;

        this._headRouteErrorHook = (args: RouteErrorHookArgs) => {
            this._headRenderError = args.error;
        };
        this.hooks.add("routeError", this._headRouteErrorHook);

        // hash 模式：`#` 后的路径不参与服务端请求，SEO 硬能力（canonical / OG /
        // 结构化数据随 URL 变化）不成立——一次性告警，head 管理本身仍然生效
        if (this.mode === "hash" && !this._headHashWarned) {
            this._headHashWarned = true;
            this.logger.warn(
                "SEO head 管理在 hash 模式下能力受限：`#` 后的子路由对搜索引擎不可见（弱 JS 爬虫更是完全看不到）。需要 SEO 请使用 history 模式。",
            );
        }
    }

    /** detach 时清理：移除内部钩子、撤销全部受管标签、还原种子标题 */
    protected _headDetach(this: AutoSparkRouter): void {
        if (!this._headEnabled()) return;
        if (this._headViewTimer !== undefined) {
            clearTimeout(this._headViewTimer);
            this._headViewTimer = undefined;
        }
        if (this._headRouteErrorHook) {
            this.hooks.remove("routeError", this._headRouteErrorHook);
            this._headRouteErrorHook = undefined;
        }
        this._headClearTags();
        this._headRestoreTitle();
        this._headSeedTitle = undefined;
        this._headRouteDecl = undefined;
        this._headRenderError = undefined;
    }

    /** 开始一次新导航：清掉上一次导航遗留的错误标记 */
    protected _headBeginNavigation(this: AutoSparkRouter): void {
        this._headRenderError = undefined;
    }

    /**
     * 阶段 A：写入路由级声明
     *
     * 在 `onRouteUpdate` 的 `_renderRoutes` 之后调用——此时守卫已通过、视图已挂载，
     * 被守卫取消或被新导航中止的路径根本走不到这里。
     */
    protected _headApplyRoutePhase(
        this: AutoSparkRouter,
        toRoute: AutoSparkMatchedRouteItem[],
    ): void {
        if (!this._headEnabled()) return;

        let decl = collectRouteDeclarations(toRoute);

        // 错误路由（404 未匹配 / 加载与渲染错误）默认 noindex——除非链上显式声明了 robots
        const is404 = toRoute.some((matched) => matched.route === undefined);
        const hasError = this._headRenderError != null || toRoute.some((m) => m.error != null);
        if ((is404 || hasError) && decl.robots === undefined) {
            decl.robots = "noindex, nofollow";
        }
        this._headRenderError = undefined;

        this._headRouteDecl = decl;
        this._headWrite(decl.seo === false ? null : decl);
    }

    /** 调度阶段 B：延后一个宏任务等 engine flush（首渲 defer 至微任务，ADR-0017） */
    protected _headScheduleViewPhase(
        this: AutoSparkRouter,
        toRoute: AutoSparkMatchedRouteItem[],
        navVersion: number,
    ): void {
        if (!this._headEnabled()) return;
        if (this._headViewTimer !== undefined) clearTimeout(this._headViewTimer);
        this._headViewTimer = setTimeout(() => {
            this._headViewTimer = undefined;
            // 期间发生了新导航：本次延后写入作废
            if (this.currentNavVersion !== navVersion) return;
            this._headApplyViewPhase(toRoute);
        }, 0);
    }

    /**
     * 阶段 B：视图级 `<autospark-view-meta>` 覆盖
     *
     * 无 ViewMeta 声明时直接返回——阶段 A 的写入保持不变。
     */
    protected _headApplyViewPhase(
        this: AutoSparkRouter,
        toRoute: AutoSparkMatchedRouteItem[],
    ): void {
        if (!this._headEnabled()) return;
        const routeDecl = this._headRouteDecl;
        if (!routeDecl) return;
        if (routeDecl.seo === false) return;

        const viewDecl = collectViewDeclarations(this, toRoute);
        if (!viewDecl) return;

        const merged = mergeHeadDeclarations(routeDecl, viewDecl);
        this._headWrite(merged.seo === false ? null : merged);
    }

    // -----------------------------------------------------------------------
    // 写入
    // -----------------------------------------------------------------------

    /** 还原种子标题（仅当本特性写入过） */
    private _headRestoreTitle(this: AutoSparkRouter): void {
        if (this._headTitleApplied && this._headSeedTitle !== undefined) {
            document.title = this._headSeedTitle;
        }
        this._headTitleApplied = false;
    }

    /** 移除 / 还原上一轮写入的全部受管标签 */
    private _headClearTags(this: AutoSparkRouter): void {
        const tags = this._headTags ?? [];
        for (const tag of tags) {
            if (tag.created) {
                tag.el.parentNode?.removeChild(tag.el);
                continue;
            }
            // 复用的既有标签：删掉我们加的属性，还原原始属性
            const live = new Set<string>();
            for (let i = 0; i < tag.el.attributes.length; i++) {
                live.add(tag.el.attributes[i].name);
            }
            for (const name of live) {
                if (!tag.original.some(([key]) => key === name)) {
                    tag.el.removeAttribute(name);
                }
            }
            for (const [key, value] of tag.original) {
                if (value === null) tag.el.removeAttribute(key);
                else tag.el.setAttribute(key, value);
            }
        }
        this._headTags = [];
    }

    /** 登记一个复用的既有标签（先快照原始属性，再由调用方改写） */
    private _headAdopt(this: AutoSparkRouter, el: Element): void {
        const tags = (this._headTags ??= []);
        if (tags.some((tag) => tag.el === el)) return;
        const original: Array<[string, string | null]> = [];
        for (let i = 0; i < el.attributes.length; i++) {
            const attr = el.attributes[i];
            original.push([attr.name, attr.value]);
        }
        tags.push({ el, created: false, original });
    }

    /** 登记一个由本特性新建的标签 */
    private _headCreate(this: AutoSparkRouter, el: Element): void {
        const tags = (this._headTags ??= []);
        if (tags.some((tag) => tag.el === el)) return;
        tags.push({ el, created: true, original: [] });
    }

    /** 写入 / 更新单值 meta（`description` / `robots`），已有同名标签则复用 */
    private _headSetMeta(this: AutoSparkRouter, name: string, content: string): void {
        const head = document.head;
        if (!head) return;
        let el = findByAttr(head, "meta", "name", name);
        if (el) {
            this._headAdopt(el);
        } else {
            el = document.createElement("meta");
            el.setAttribute("name", name);
            this._headCreate(el);
            head.appendChild(el);
        }
        el.setAttribute(SEO_MARK_ATTR, "");
        el.setAttribute("content", content);
    }

    /** 写入 / 更新 Open Graph 标签（`meta[property]`，已有同 property 则复用） */
    private _headSetOg(this: AutoSparkRouter, property: string, content: string): void {
        const head = document.head;
        if (!head) return;
        let el = findByAttr(head, "meta", "property", property);
        if (!el) el = findByAttr(head, "meta", "name", property);
        if (el) {
            this._headAdopt(el);
        } else {
            el = document.createElement("meta");
            el.setAttribute("property", property);
            this._headCreate(el);
            head.appendChild(el);
        }
        el.setAttribute(SEO_MARK_ATTR, "");
        el.setAttribute("content", content);
        if (!el.hasAttribute("property")) el.setAttribute("property", property);
    }

    /** 写入 / 更新 canonical（仅显式声明才注入，绝不自动构造 URL） */
    private _headSetCanonical(this: AutoSparkRouter, href: string): void {
        const head = document.head;
        if (!head) return;
        let el = findCanonical(head);
        if (el) {
            this._headAdopt(el);
        } else {
            el = document.createElement("link");
            el.setAttribute("rel", "canonical");
            this._headCreate(el);
            head.appendChild(el);
        }
        el.setAttribute(SEO_MARK_ATTR, "");
        el.setAttribute("href", href);
    }

    /** 写入 JSON-LD 结构化数据（始终新建——不接管种子文档里的既有结构化数据） */
    private _headSetJsonLd(this: AutoSparkRouter, value: unknown): void {
        const head = document.head;
        if (!head) return;
        const nodes = Array.isArray(value) ? value : [value];
        for (const node of nodes) {
            if (node === null || node === undefined) continue;
            let json: string | undefined;
            try {
                json = JSON.stringify(node);
            } catch {
                continue;
            }
            if (typeof json !== "string") continue;
            const el = document.createElement("script");
            el.setAttribute("type", "application/ld+json");
            el.setAttribute(SEO_MARK_ATTR, "");
            el.textContent = json;
            this._headCreate(el);
            head.appendChild(el);
        }
    }

    /** 标题模板格式化（`%s` 占位；模板无 `%s` 时退化为 `"{标题} - {模板}"`） */
    private _headFormatTitle(this: AutoSparkRouter, title: string): string {
        const template = this._headConfig()?.titleTemplate;
        if (!template) return title;
        if (template.includes("%s")) return template.replace("%s", title);
        return `${title} - ${template}`;
    }

    /**
     * 整体写入一轮声明
     *
     * **先清后写**：上一轮登记的受管标签全部移除（自建）或还原（复用），因此
     * 「本轮未声明的动态字段」会被主动清掉——`noindex` / canonical 不会跨路由残留。
     *
     * @param decl - `null` 表示本路由关闭 head 管理（`meta.seo: false`）
     */
    protected _headWrite(this: AutoSparkRouter, decl: HeadDeclarations | null): void {
        if (typeof document === "undefined") return;
        this._headClearTags();

        if (!decl) {
            // 关闭管理：撤销此前的写入，回到种子状态
            this._headRestoreTitle();
            return;
        }

        if (decl.title) {
            document.title = this._headFormatTitle(decl.title);
            this._headTitleApplied = true;
        } else {
            // 未声明标题且本特性写过 → 还原种子标题；从未写过则保持文档原样
            this._headRestoreTitle();
        }

        if (decl.description !== undefined) this._headSetMeta("description", decl.description);
        if (decl.robots !== undefined) this._headSetMeta("robots", decl.robots);

        if (decl.canonical !== undefined) {
            const siteUrl = this._headConfig()?.siteUrl;
            this._headSetCanonical(resolveWithSiteUrl(decl.canonical, siteUrl));
        }

        if (decl.og) {
            for (const property of Object.keys(decl.og)) {
                this._headSetOg(property, decl.og[property]);
            }
        }

        if (decl.jsonLd !== undefined) this._headSetJsonLd(decl.jsonLd);
    }
}
