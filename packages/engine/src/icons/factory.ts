/**
 * 图标数据处理管线（ADR-0046 决策 4/5、ADR-0047 决策 2/3）。
 *
 * **规范形 SVG（canonical）** 是图标注册表与远程缓存的统一存储形态：
 * - strip **全部** `stroke-width`（root 与所有后代元素）——生效 strokeWidth 是**渲染参数**，
 *   渲染期注入 root（「宽度不是图标的一部分」）；多笔画故意异宽的图标失去表现力为已知限制。
 * - root `<svg>` 缺 `stroke` 属性才补 `currentColor`（作者显式属性不动——fill 型图标自带
 *   `fill="currentColor"` 不被破坏）。
 * - 字符串级处理 root 标签（KISS），不 DOMParser。
 *
 * **URL 工厂**：规范形 SVG + 生效 strokeWidth → `data:image/svg+xml,${encodeURIComponent(svg)}`，
 * 按 (缓存键, strokeWidth) 缓存——同组合全页只编码一次（重复的只是缓存条目，存储只有一份
 * 规范形）。base64 已否决：体积 +33%，且 btoa 无法直接处理非 Latin1 字符。
 */
import { persistLookup, persistStore } from "./persist";

/** 默认描边宽度（ADR-0046 决策 6：:root 变量按此生成） */
export const DEFAULT_ICON_STROKE_WIDTH = 1.25;

/** strokeWidth 值归一化：合法正数返回数值，否则 null（由调用方决定回退到哪层默认） */
export function normalizeStrokeWidth(v: unknown): number | null {
    const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;
    return Number.isFinite(n) && n > 0 ? n : null;
}

/** 本地图标名约束（CSS ident：同时是类名与自定义属性名载体，ADR-0046 决策 10） */
export const ICON_NAME_RE = /^[A-Za-z_-][A-Za-z0-9_-]*$/;

/** 远程图标形（ADR-0047 决策 1）：`prefix/name`，各段小写字母数字连字符（仅斜杠形——冒号形已废除） */
export const REMOTE_ICON_RE = /^[a-z0-9-]+\/[a-z0-9-]+$/;

/** strip 全部 stroke-width 属性（双引号/单引号两种载体，ADR-0046 决策 4） */
const STROKE_WIDTH_ATTR_RE = /\sstroke-width\s*=\s*(?:"[^"]*"|'[^']*')/gi;

/** root `<svg>` 开标签（取首个；规范形处理与 sw 注入共用的定位锚） */
const SVG_ROOT_TAG_RE = /<svg\b[^>]*>/i;

/**
 * 规范化 SVG 为规范形：strip 全部 stroke-width + root 缺省补齐（xmlns / stroke）。
 * 替换一律经函数形态（规避替换串中 `$` 的正则转义语义）。
 *
 * **xmlns 是 data URL 的硬约束**：CSS mask 引用的 SVG 按 XML 图像解析，缺
 * `xmlns="http://www.w3.org/2000/svg"` 声明直接解析失败 → mask 无图 → 图标隐形
 * （inline HTML 中浏览器自动归 SVG 命名空间，故模板里不写 xmlns 也能渲染——
 * 但 `outerHTML` 序列化不会补上，规范形必须统一补齐）。
 */
export function canonicalizeSvg(svg: string): string {
    let out = svg.replace(STROKE_WIDTH_ATTR_RE, "");
    const m = out.match(SVG_ROOT_TAG_RE);
    if (m) {
        const tag = m[0];
        let inject = "";
        if (!/\bxmlns\s*=/.test(tag)) inject += ' xmlns="http://www.w3.org/2000/svg"';
        if (!/\bstroke\s*=/.test(tag)) inject += ' stroke="currentColor"';
        if (inject) out = out.replace(tag, () => tag.slice(0, -1) + inject + ">");
    }
    return out;
}

/** (缓存键, strokeWidth) → data URL 缓存：同组合全页只编码一次 */
const dataUrlCache = new Map<string, string>();

/**
 * 按缓存键失效 data URL 缓存（全部 strokeWidth 变体）：图标同名覆盖时调用——
 * 缓存键不含 SVG 内容，不失效则样式表与内联 mask 仍引用旧图。
 */
export function invalidateIconDataUrls(cacheKey: string): void {
    const prefix = `${cacheKey}|`;
    for (const key of dataUrlCache.keys()) {
        if (key.startsWith(prefix)) dataUrlCache.delete(key);
    }
}

/**
 * URL 工厂：规范形 SVG + 生效 strokeWidth → data URL（注入 root stroke-width 后编码）。
 * @param cacheKey    缓存键（本地图标名，或 `remote/prefix/name`）
 * @param canonicalSvg 规范形 SVG（无 stroke-width）
 * @param strokeWidth 生效描边宽度（渲染参数，注入 root）
 */
export function iconDataUrl(
    cacheKey: string,
    canonicalSvg: string,
    strokeWidth: number,
): string {
    const key = `${cacheKey}|${strokeWidth}`;
    let url = dataUrlCache.get(key);
    if (url) return url;
    let svg = canonicalSvg;
    const m = svg.match(SVG_ROOT_TAG_RE);
    if (m && !/\bstroke-width\s*=/i.test(m[0])) {
        const tag = m[0];
        svg = svg.replace(tag, () => tag.slice(0, -1) + ` stroke-width="${strokeWidth}">`);
    }
    url = `data:image/svg+xml,${encodeURIComponent(svg)}`;
    dataUrlCache.set(key, url);
    return url;
}

// ── 远程图标缓存（ADR-0047 决策 3）──────────────────────────────────────────
// 独立于图标注册表（遍历/delete 语义保持「用户声明的资产」纯净，`mdi/home` 亦非合法
// CSS ident 进不了类名/变量体系）；模块级跨 engine 共享，对齐 document 级纪律。

/** 远程图标缓存：key = "prefix/name" → 规范形 SVG */
const remoteCache = new Map<string, string>();
/** in-flight 合并：同图标多实例同 tick 只发一次请求 */
const remoteInflight = new Map<string, Promise<string>>();

/** 远程并发上限：冷启动整页图标并发打满会触发 Iconify 公共 API 429 限流（实现期实测），排队放行 */
const REMOTE_MAX_CONCURRENT = 4;
/** 429 退避重试上限（400ms × 尝试次数递增） */
const REMOTE_MAX_RETRY = 2;

let remoteActive = 0;
const remoteQueue: Array<() => void> = [];

/** 占用一个远程并发槽执行任务（超出上限排队；槽内等待退避即天然背压） */
async function withRemoteSlot<T>(task: () => Promise<T>): Promise<T> {
    if (remoteActive >= REMOTE_MAX_CONCURRENT) {
        await new Promise<void>((release) => remoteQueue.push(release));
    }
    remoteActive++;
    try {
        return await task();
    } finally {
        remoteActive--;
        remoteQueue.shift()?.();
    }
}

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** 同步读取远程缓存：内存 → 持久层（命中注回内存，零网络同步渲染，ADR-0048） */
export function getCachedRemoteIcon(key: string, baseUrl?: string): string | undefined {
    const hit = remoteCache.get(key);
    if (hit) return hit;
    if (baseUrl != null) {
        const persisted = persistLookup(baseUrl, key);
        if (persisted !== undefined) {
            remoteCache.set(key, persisted);
            return persisted;
        }
    }
    return undefined;
}

/**
 * fetch 远程图标（裸 `.svg` 无查询参数——sw/颜色本地注入，ADR-0047 决策 2）。
 * 缓存三层：模块级内存 → in-flight 合并 → 浏览器 HTTP 缓存（API cache headers）；
 * 另加**并发限流（4 路）+ 429 退避重试**——缓存只解重复请求，不解冷启动并发风暴
 * （32 图标整页冷启动实测触发 429）。失败清 in-flight（后续实例可重试）。
 */
export function fetchRemoteIcon(key: string, baseUrl: string): Promise<string> {
    const cached = remoteCache.get(key);
    if (cached) return Promise.resolve(cached);
    const inflight = remoteInflight.get(key);
    if (inflight) return inflight;
    const p = withRemoteSlot(async () => {
        const url = `${baseUrl}/${key}.svg`;
        for (let attempt = 0; ; attempt++) {
            const res = await fetch(url);
            if (res.status === 429 && attempt < REMOTE_MAX_RETRY) {
                await delay(400 * (attempt + 1));
                continue;
            }
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}${res.statusText ? ` ${res.statusText}` : ""}`);
            }
            const text = await res.text();
            if (!text.includes("<svg")) throw new Error("响应不是有效 SVG");
            const canonical = canonicalizeSvg(text.trim());
            remoteInflight.delete(key);
            remoteCache.set(key, canonical);
            persistStore(baseUrl, key, canonical);
            return canonical;
        }
    });
    remoteInflight.set(key, p);
    // 副分支仅作失败清理（派生 promise 已处理，调用方的 rejection 由其自行 catch）
    p.catch(() => remoteInflight.delete(key));
    return p;
}
