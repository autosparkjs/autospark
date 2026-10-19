/**
 * 多语言内容通道（ADR-0013）
 *
 * 语言清单声明在 engine（`AutoSparkOptions.languages`，经插件自举挂载矩阵传递为
 * `AutoSparkRouterOptions.languages`），运行时归 router 消费：
 *
 * - **启动解析**（决策 4）：attach 早期（早于路由表加载——本地化 `routes.json`
 *   首次 fetch 即需语言）把 `$.language` 归一为清单中的具体 code；
 *   `auto`（或缺省）经三级匹配归一：tag 全等（大小写与 `-`/`_` 归一）→
 *   主语言子标签相同 → 回退 `languages[0]`；
 * - **URL 重写调度**（决策 2/7）：单钩子 `getLanguageUrl` 按 type 分流三通道完全接管
 *   （返回 `null`/`undefined` = 用原 URL）；未提供钩子时 view/routes 走内置文件名
 *   后缀规则（默认语言 `languages[0]` 免重写、query/hash 保留、根/目录形不重写），
 *   data 不重写；
 * - **切换语义**（决策 5）：`store.watch("$.language")` 监听赋值——完整导航管线
 *   重入当前 fullPath（不写历史、地址栏不变），经放行标记绕过同 URL 去重；
 * - **document.lang 跟随**（决策 8）：`document.documentElement.lang` 随当前语言更新。
 *
 * @module features/language
 */

import type { AutoSparkRouter } from "@/router";
import type {
    AutoSparkGetLanguageUrl,
    AutoSparkLanguageItem,
    AutoSparkLanguageUrlType,
} from "@/types/config";

/** 标签归一：大小写与 `-`/`_` 等价（`zh_cn` ↔ `zh-CN`） */
export function normalizeLanguageTag(tag: string): string {
    return tag.trim().toLowerCase().replace(/_/g, "-");
}

/**
 * 内置文件名后缀规则的共享纯函数（ADR-0013 决策 3）
 *
 * 末段扩展名前插 `suffix`；query/hash 原样保留在末尾；根路径与目录形 URL 不重写。
 */
export function applyNameSuffix(url: string, suffix: string): string {
    // 分离 query/hash（二者原样保留在末尾）
    const sep = url.search(/[?#]/);
    const main = sep >= 0 ? url.slice(0, sep) : url;
    const tail = sep >= 0 ? url.slice(sep) : "";
    const slash = main.lastIndexOf("/");
    const last = slash >= 0 ? main.slice(slash + 1) : main;
    // 根路径与目录形（末段为空）不重写
    if (last === "") return url;
    const dot = last.lastIndexOf(".");
    // `dot > 0`：dotfile（`.html`）按无扩展名处理，整段为词干
    const stem = dot > 0 ? last.slice(0, dot) : last;
    const ext = dot > 0 ? last.slice(dot) : "";
    return `${main.slice(0, slash + 1)}${stem}${suffix}${ext}${tail}`;
}

/**
 * 内置文件名后缀规则（ADR-0013 决策 3）
 *
 * 末段扩展名前插 `_${code}`（`x.html → x_zh-CN.html`；无扩展名末段同插
 * `/a/x → /a/x_zh-CN`）；query/hash 原样保留在末尾；根路径与目录形 URL 不重写；
 * `code` 原样使用（BCP 47 连字符风格），无 `-`→`_` 转换。
 */
export function applyLanguageSuffix(url: string, code: string): string {
    return applyNameSuffix(url, `_${code}`);
}

/**
 * 浏览器语言偏好标签（偏好序）
 * happy-dom 等环境可能缺 navigator.languages，逐级兜底
 */
function navigatorLanguageTags(): string[] {
    const nav = (globalThis as { navigator?: { languages?: readonly string[]; language?: string } })
        .navigator;
    if (!nav) return [];
    if (Array.isArray(nav.languages) && nav.languages.length > 0) return [...nav.languages];
    return nav.language ? [nav.language] : [];
}

/** autostore watcher 的最小结构面（引擎内核实际类型更宽，按需窄化） */
interface LanguageStoreWatcher {
    off(): void;
}

/** router 消费的 engine store 最小面（测试 stub 可能缺 store，逐项防御） */
interface LanguageStoreLike {
    state?: Record<string, any>;
    watch?: (path: string, listener: (payload?: unknown) => void) => LanguageStoreWatcher;
}

/**
 * 语言管理器
 *
 * 挂在 router 实例上（`router.language`），非 Mixin 特性——生命周期与 router 一致，
 * 在 attach 前即可用（路由表加载早于 engine 绑定完成，语言解析必须更早）。
 */
export class LanguageManager {
    router: AutoSparkRouter;

    /** 当前生效的具体语言 code（启用后恒有值） */
    private _current?: string;
    /** `$.language` 订阅句柄 */
    private _watcher?: LanguageStoreWatcher;
    /** 内部写入标记：抑制 watch 对自身写入的响应（配合「值 === _current」双保险） */
    private _internalWrite = false;

    constructor(router: AutoSparkRouter) {
        this.router = router;
    }

    /** 是否启用多语言（语言清单非空，ADR-0013 决策 1） */
    get enabled(): boolean {
        return (this.router.options.languages?.length ?? 0) > 0;
    }

    /** 语言清单 */
    get languages(): AutoSparkLanguageItem[] {
        return this.router.options.languages ?? [];
    }

    /** 当前生效语言 code（未启用时 undefined） */
    get current(): string | undefined {
        return this._current;
    }

    /** 当前是否为默认语言（`languages[0]`，内置规则下免重写） */
    get isDefault(): boolean {
        return this._current !== undefined && this._current === this.languages[0]?.code;
    }

    /** 按 code 精确取清单项（code 为归一后的清单原文） */
    languageItem(code: string): AutoSparkLanguageItem | undefined {
        return this.languages.find((l) => l.code === code);
    }

    // ========================================================================
    // 启动解析（决策 4）
    // ========================================================================

    /**
     * 启动解析：早于路由表加载调用（router.attach 顶部）。
     *
     * 读初始输入（`$.language` 已有值则尊重，缺省视同 `auto`）→ 三级解析 →
     * 写入 `$.language`（watch 注册前，天然不触发重载）→ document.lang 跟随 →
     * 注册 watch。
     */
    bootstrap(): void {
        if (!this.enabled) return;
        const initial = this._readStateLanguage();
        this._current = this.resolve(initial);
        this._writeStateLanguage(this._current!);
        this.syncDocumentLang();
        this._setupWatch();
    }

    /**
     * 三级解析（决策 4）：① tag 全等（大小写与 `-`/`_` 归一）→ ② 主语言子标签相同
     * （navigator `zh-HK` 命中配置 `zh-CN`）→ ③ 回退 `languages[0]`。
     *
     * 具体输入值归一后命中清单即原样采用（清单原文）；未命中视同 `auto` 再走
     * 浏览器语言解析。配置纯语言 tag（`zh`）与完整 tag（`zh-CN`）均合法。
     */
    resolve(input?: string): string {
        const list = this.languages;
        if (list.length === 0) return "";
        // 具体值：归一全等命中即用
        if (input && input !== "auto") {
            const hit = list.find(
                (l) => normalizeLanguageTag(l.code) === normalizeLanguageTag(input),
            );
            if (hit) return hit.code;
        }
        // auto / 未命中：按浏览器偏好序逐 tag 匹配（全等 → 主子标签）
        for (const tag of navigatorLanguageTags()) {
            const normalized = normalizeLanguageTag(tag);
            if (!normalized) continue;
            const exact = list.find((l) => normalizeLanguageTag(l.code) === normalized);
            if (exact) return exact.code;
            const primary = normalized.split("-")[0];
            const primaryHit = list.find(
                (l) => normalizeLanguageTag(l.code).split("-")[0] === primary,
            );
            if (primaryHit) return primaryHit.code;
        }
        return list[0].code;
    }

    // ========================================================================
    // URL 重写调度（决策 2/7）
    // ========================================================================

    /**
     * 语言化 URL 重写调度
     *
     * 未启用 / 未解析完成原样返回。提供钩子 = 三通道完全接管（默认语言豁免不再
     * 强制，钩子内自行按 type 分流），返回 `null`/`undefined` 用原 URL（而非回退
     * 内置规则）；未提供钩子时默认矩阵：view/routes 内置后缀规则（默认语言免重写），
     * data 不重写。
     */
    rewriteUrl(url: string, type: AutoSparkLanguageUrlType): string {
        if (!this.enabled || !this._current) return url;
        const hook = this.router.options.getLanguageUrl as AutoSparkGetLanguageUrl | undefined;
        if (hook) {
            const item = this.languageItem(this._current);
            if (!item) return url;
            const rewritten = hook(item, url, type);
            return rewritten == null ? url : rewritten;
        }
        if (type === "data") return url;
        if (this.isDefault) return url;
        return applyLanguageSuffix(url, this._current);
    }

    // ========================================================================
    // document.lang 跟随（决策 8）
    // ========================================================================

    /** `document.documentElement.lang` 跟随当前语言（BCP 47 连字符原样） */
    syncDocumentLang(): void {
        if (!this.enabled || !this._current) return;
        try {
            document.documentElement.lang = this._current;
        } catch {
            // 无 document 环境（极端测试桩）静默
        }
    }

    // ========================================================================
    // $.language 注入与 watch（决策 4/5）
    // ========================================================================

    /** engine store 最小面（缺 engine / 测试 stub 无 store 时语言状态面静默降级） */
    private _store(): LanguageStoreLike | undefined {
        const engine = this.router.options.engine as
            | { store?: LanguageStoreLike }
            | undefined;
        const store = engine?.store;
        return store && typeof store === "object" ? store : undefined;
    }

    private _readStateLanguage(): string | undefined {
        const state = this._store()?.state;
        const value = state?.$?.language;
        return typeof value === "string" ? value : undefined;
    }

    /**
     * 写入 `$.language`（内部写入：经 store 响应式代理，同引用根回写兜底触发——
     * `$.route` 同款 autostore 嵌套写入坑，见 router._syncRouteState）
     */
    private _writeStateLanguage(code: string): void {
        const store = this._store();
        if (!store?.state) return;
        try {
            const state = store.state;
            const meta = (state.$ ??= {});
            this._internalWrite = true;
            try {
                meta.language = code;
                state.$ = state.$;
            } finally {
                this._internalWrite = false;
            }
        } catch {
            // 最小 engine 面写入失败静默（语言状态非加载链关键路径）
        }
    }

    /** 注册 `$.language` 订阅（store 不支持 watch 的最小面静默跳过） */
    private _setupWatch(): void {
        const store = this._store();
        if (!store?.state || typeof store.watch !== "function") return;
        try {
            this._watcher = store.watch("$.language", () => this._onStateLanguage());
        } catch {
            // 老内核不支持路径订阅：切换语义降级为不可用（解析与重写不受影响）
        }
    }

    /**
     * `$.language` 赋值响应（决策 5）
     *
     * 具体值须命中清单（未命中 warn 并回写原值）；`auto` 再解析。值确实变化时
     * 清当前链加载状态并触发完整导航管线重入（清缓存键已含新语言，加载域不跳层）。
     */
    private _onStateLanguage(): void {
        if (this._internalWrite || !this.enabled) return;
        const next = this._readStateLanguage();
        if (next == null) return;
        // 内部写入的值恒等于 _current（异步批量通知下的兜底判据）
        if (next === this._current) return;

        if (next === "auto") {
            const resolved = this.resolve("auto");
            if (resolved === this._current) {
                // 解析回同值：状态归一为具体 code，无导航
                this._writeStateLanguage(resolved);
                return;
            }
            this._applySwitch(resolved);
            return;
        }

        const hit = this.languages.find(
            (l) => normalizeLanguageTag(l.code) === normalizeLanguageTag(next),
        );
        if (!hit) {
            this.router.logger.warn(
                "$.language 赋值 {} 不在语言清单中，已回退为 {}",
                next,
                this._current,
            );
            this._writeStateLanguage(this._current!);
            return;
        }
        this._applySwitch(hit.code);
    }

    /** 应用语言切换：内部回写 + document.lang + 导航管线重入 */
    private _applySwitch(resolved: string): void {
        const prev = this._current;
        this._current = resolved;
        this._writeStateLanguage(resolved);
        this.syncDocumentLang();
        this.router.logger.debug("语言切换: {} -> {}", prev ?? "?", resolved);
        // 完整导航管线重入当前 fullPath（ADR-0013 决策 5）：guards、事件、渲染链
        // 按既有语义重跑，不写历史（与版本切换共用 router 的元状态切换重入）
        this.router._rerunForMetaChange();
    }

    /** 清理订阅（router.detach 时调用） */
    dispose(): void {
        try {
            this._watcher?.off();
        } catch {
            // 重复 off 无害（scope.destroy 同款语义）
        }
        this._watcher = undefined;
    }
}
