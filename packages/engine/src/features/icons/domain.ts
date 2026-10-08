/**
 * 图标域（ADR-0058 决策 2/4/9/11/12）：scope 局部图标的名字表、声明令牌与生命周期。
 *
 * **声明令牌（token）**：每份 x-icons 声明按内容哈希得到稳定令牌，局部 symbol id 前缀
 * `as-i{令牌}-`。同一声明源（含 x-for / 组件快照的克隆）哈希相同 → 共享同一组 symbol，
 * 引用计数（refs）随收集它的 scope 增减——**克隆不放大**（决策 3「identity 去重」的实现
 * 载体：标记属性会被克隆链路洗掉，内容哈希对任意克隆天然稳定）。
 *
 * **名字表**：`scope.icons`（图标名 → 令牌）沿 parent 链就近查找、内层遮蔽外层，到顶兜底
 * 全局注册表（与 getComponentDeclaration 同构）。同 scope 多声明同名：Map 后写胜 = **编译期声明序
 * 所有权**，与 fetch 到达序无关（决策 12）。
 *
 * **待定名**：名字已登记但 symbol 未就绪（`names` 无此名且未 `failed`）——x-icon 渲染空
 * 占位；远程到达注入 symbol 或失败终态后经变更总线唤醒（决策 11）。
 *
 * **全局所有权**：全局声明同名按声明序取号（seq 后声明胜）；远程到达时非当前所有权者
 * 无注入权——网络时序不影响结果（决策 12）。全局远程产物经注册表 `add` 入库（`as-{name}`
 * + has/add/delete/广播全套复用）；全局待定态记于 `globalState`。
 */
import type { AutoSparkScope } from "../../engine/scope";
import { iconRegistry, GLOBAL_SYMBOL_PREFIX } from "./registry";
import { injectSymbol, normalizeSvgSpec, removeSymbol, type SymbolSpec } from "./symbol";
import { resolveIconifyIcon, specFromResolved, svgFromResolved } from "./iconify";
import { fetchIconifySet } from "./remote";

/** scope 侧图标域条目：图标名 → 声明令牌（指向 tokenTable 的声明组） */
export interface ScopeIconEntry {
    token: string;
}

/** 声明令牌数据：一组声明源共享的 symbol 集合 + 引用计数 */
interface TokenData {
    /** 局部 symbol id 前缀（`as-i{令牌}-`） */
    prefix: string;
    /** 已就绪 symbol（内联立即入 / 远程到达入）——就绪即待定终了 */
    names: Map<string, SymbolSpec>;
    /** 远程失败终态的原名（按未命中处理；内联已提供者不进此表——远程失败不杀内联） */
    failed: Set<string>;
    /** 引用计数：收集本声明的 scope 数（归零摘 symbol + 删表项；后续同源声明重建） */
    refs: number;
}

/** 声明令牌表（模块级跨 engine 共享，对齐 document 级纪律） */
const tokenTable = new Map<string, TokenData>();

/** 全局远程态：图标名 → 声明所有权（seq 后声明胜）+ 待定/失败态（registry.has 即就绪） */
const globalState = new Map<string, { owner: number; state: "pending" | "ready" | "failed" }>();
let globalSeq = 0;

/** 声明内容哈希（fnv-1a 32bit → base36；令牌只需稳定 + 文档内唯一，无密码学要求） */
function hashSource(s: string): string {
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h.toString(36);
}

/** 声明登记入参（compiler 收集侧组装；名字均已过 isValidIconName 校验） */
export interface RegisterIconDeclInput {
    /** 归全局（.global / options.global / 孤立声明静默归全局，决策 4） */
    global: boolean;
    /** 最近祖先 scope（global 或孤立时为 null） */
    ownerScope: AutoSparkScope | null;
    /** 内联定义：图标名 + svg 串（template 内 `<svg id>` 的 outerHTML） */
    inline: Array<{ name: string; svg: string }>;
    /** 远程清单（原名；空 = 纯内联声明） */
    remoteNames: string[];
    /** 已插值的最终 url */
    url: string;
    /** modify 后缀（已过值域校验；未声明为 undefined） */
    modify?: string;
    /** TTL 持久缓存时长（毫秒；已校验正数，0 = 不启用，ADR-0058 修订） */
    cache: number;
    /** warn 出口（compiler logger） */
    warn: (msg: string) => void;
}

/**
 * 登记一份 x-icons 声明（compiler 前置 collector 调用，每份声明——含克隆——一次）。
 *
 * 局部：令牌 get-or-create（refs++）→ 内联立即注入（同名远程到达后覆盖同 id——「远程覆盖
 * 内联」，决策 12）→ scope 名字表登记（Map 后写胜 = 声明序所有权）→ 远程清单 kick fetch。
 * 全局：内联经注册表 add 立即入库 + 取走所有权；远程清单登记待定态 + kick fetch。
 */
export function registerIconDecl(input: RegisterIconDeclInput): void {
    if (input.global) {
        registerGlobalDecl(input);
        return;
    }
    const scope = input.ownerScope;
    if (!scope) {
        // 孤立声明（沿链无 scope 祖先）：静默归全局（决策 4——图标是纯资源，不惩罚）
        registerGlobalDecl(input);
        return;
    }
    const source = JSON.stringify([
        input.url,
        input.modify ?? "",
        input.remoteNames,
        input.inline.map((d) => [d.name, d.svg]),
    ]);
    const token = hashSource(source);
    let td = tokenTable.get(token);
    if (!td) {
        td = { prefix: `as-i${token}-`, names: new Map(), failed: new Set(), refs: 0 };
        tokenTable.set(token, td);
    }
    td.refs++;
    (scope.iconTokens ??= new Set()).add(token);
    const names = scope.icons ?? (scope.icons = new Map());

    // 内联：立即注入（无效数据 warn + 剔除，不进名字表）
    const valid: string[] = [];
    for (const def of input.inline) {
        const spec = normalizeSvgSpec(def.svg);
        if (!spec) {
            input.warn(`图标 "${def.name}" 的 SVG 数据无效（无法解析），已跳过`);
            continue;
        }
        injectSymbol(td.prefix + def.name, spec);
        td.names.set(def.name, spec);
        td.failed.delete(def.name);
        valid.push(def.name);
        iconRegistry.emitChange(def.name, "add");
    }
    // 名字表登记（声明序所有权：同 scope 后声明覆盖前者）
    for (const name of valid) names.set(name, { token });
    for (const name of input.remoteNames) names.set(name, { token });

    if (input.remoteNames.length > 0) kickRemote(input, token);
}

/** 远程清单落地（局部物种）：fetch → 逐名解引用 → 注入/失败终态 → 变更总线唤醒 */
function kickRemote(input: RegisterIconDeclInput, token: string): void {
    fetchIconifySet(input.url, input.cache).then(
        (json) => {
            const td = tokenTable.get(token);
            if (!td || td.refs <= 0) return; // 归属 scope 已全部销毁（令牌回收）
            for (const name of input.remoteNames) {
                const key = input.modify ? `${name}-${input.modify}` : name;
                const resolved = resolveIconifyIcon(json, key);
                if (!resolved) {
                    // not_found：内联已提供者保留（远程失败不杀内联），否则失败终态
                    if (!td.names.has(name)) {
                        td.failed.add(name);
                        input.warn(`图标 "${name}" 未在远程响应中找到（请求键 "${key}"），按未命中处理`);
                        iconRegistry.emitChange(name, "delete"); // 唤醒空占位实例 → 默认图标
                    }
                    continue;
                }
                const spec = specFromResolved(resolved);
                injectSymbol(td.prefix + name, spec); // 同 id 覆盖——远程到达替换内联
                td.names.set(name, spec);
                td.failed.delete(name);
                iconRegistry.emitChange(name, "add");
            }
        },
        (err: unknown) => {
            const td = tokenTable.get(token);
            if (!td || td.refs <= 0) return;
            input.warn(
                `远程图标集加载失败（${input.url}）：${(err as Error)?.message ?? err}——清单内名字按未命中处理`,
            );
            for (const name of input.remoteNames) {
                if (td.names.has(name)) continue; // 内联存活
                td.failed.add(name);
                iconRegistry.emitChange(name, "delete");
            }
        },
    );
}

/** 全局声明：内联立即入库 + 所有权取号（ready）；远程清单登记待定态（registry.has 即就绪态） */
function registerGlobalDecl(input: RegisterIconDeclInput): void {
    const seq = ++globalSeq;
    for (const def of input.inline) {
        // ready：就绪态由 registry.has 承载；条目保留以持有所有权（先前的在途远程解析时
        // 对比 owner 无注入权；registry.delete 后 state=ready 落 miss 而非永久 pending）
        globalState.set(def.name, { owner: seq, state: "ready" });
        iconRegistry.add(def.name, def.svg); // 注入 as-{name} + 广播
    }
    if (input.remoteNames.length === 0) return;
    for (const name of input.remoteNames) {
        globalState.set(name, { owner: seq, state: "pending" });
    }
    fetchIconifySet(input.url, input.cache).then(
        (json) => {
            for (const name of input.remoteNames) {
                const gs = globalState.get(name);
                if (!gs || gs.owner !== seq) continue; // 非当前所有权者：无注入权（决策 12）
                const key = input.modify ? `${name}-${input.modify}` : name;
                const resolved = resolveIconifyIcon(json, key);
                if (!resolved) {
                    if (!iconRegistry.has(name)) {
                        gs.state = "failed";
                        input.warn(`图标 "${name}" 未在远程响应中找到（请求键 "${key}"），按未命中处理`);
                        iconRegistry.emitChange(name, "delete");
                    }
                    continue;
                }
                iconRegistry.add(name, svgFromResolved(resolved)); // 原名注册：x-icon 不感知 modify（决策 9）
                gs.state = "ready"; // 就绪态由 registry.has 承载；条目保留所有权
            }
        },
        (err: unknown) => {
            input.warn(
                `远程图标集加载失败（${input.url}）：${(err as Error)?.message ?? err}——清单内名字按未命中处理`,
            );
            for (const name of input.remoteNames) {
                const gs = globalState.get(name);
                if (!gs || gs.owner !== seq || iconRegistry.has(name)) continue;
                gs.state = "failed";
                iconRegistry.emitChange(name, "delete");
            }
        },
    );
}

/** 图标名解析结果：就绪（href） / 待定（空占位） / 未命中（默认图标） */
export type IconResolution =
    | { kind: "href"; href: string }
    | { kind: "pending" }
    | { kind: "miss" };

/**
 * 图标域解析（x-icon 消费，决策 2）：自身 scope 沿 parent 链就近（内层遮蔽外层，命中即
 * 终态——待定/失败不穿透到全局：就近声明拥有该名）→ 全局注册表兜底 → 全局待定态。
 * 局部失败终态按未命中处理（默认图标，决策 11）；内联就绪者远程失败不受影响（names 优先）。
 */
export function resolveIconName(scope: AutoSparkScope | null, name: string): IconResolution {
    let s = scope;
    while (s) {
        const entry = s.icons?.get(name);
        if (entry) {
            const td = tokenTable.get(entry.token);
            if (td) {
                if (td.names.has(name)) return { kind: "href", href: `#${td.prefix}${name}` };
                if (td.failed.has(name)) return { kind: "miss" };
                return { kind: "pending" };
            }
            return { kind: "pending" }; // 令牌已回收的窄边界：视作待定防闪默认图标
        }
        s = s.parent;
    }
    if (iconRegistry.has(name)) {
        return { kind: "href", href: `#${GLOBAL_SYMBOL_PREFIX}${name}` };
    }
    const gs = globalState.get(name);
    if (gs && gs.state === "pending") return { kind: "pending" };
    return { kind: "miss" };
}

/**
 * scope 销毁回收（scope.destroy 调用，决策 4）：逐令牌 refs--，归零摘除该组局部 symbol
 * 并删表项（后续同源声明按哈希重建、重新注入——声明数据确定性派生，无需持久保留）。
 * 全局 symbol 与注册表不清理（document 级资产纪律）。
 */
export function releaseScopeIcons(scope: AutoSparkScope): void {
    if (!scope.iconTokens) return;
    for (const token of scope.iconTokens) {
        const td = tokenTable.get(token);
        if (!td) continue;
        td.refs--;
        if (td.refs <= 0) {
            for (const name of td.names.keys()) removeSymbol(td.prefix + name);
            tokenTable.delete(token);
        }
    }
    scope.iconTokens.clear();
    scope.icons?.clear();
}

/** 测试专用：清空图标域模块态（令牌表 / 全局远程态 / 所有权序号） */
export function resetIconDomainForTest(): void {
    tokenTable.clear();
    globalState.clear();
    globalSeq = 0;
}
