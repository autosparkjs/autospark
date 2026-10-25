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
import type { AutoSpark } from "../../engine/engine";
import type { AutoSparkScope } from "../../engine/scope";
/** scope 侧图标域条目：图标名 → 声明令牌（指向 tokenTable 的声明组） */
export interface ScopeIconEntry {
    token: string;
}
/** 声明登记入参（compiler 收集侧组装；名字均已过 isValidIconName 校验） */
export interface RegisterIconDeclInput {
    /** 归全局（.global / options.global / 孤立声明静默归全局，决策 4） */
    global: boolean;
    /** 最近祖先 scope（global 或孤立时为 null） */
    ownerScope: AutoSparkScope | null;
    /** 内联定义：图标名 + svg 串（template 内 `<svg id>` 的 outerHTML） */
    inline: Array<{
        name: string;
        svg: string;
    }>;
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
    /** 引擎实例（fetcher 出站口，ADR-0121） */
    engine?: AutoSpark;
}
/**
 * 登记一份 x-icons 声明（compiler 前置 collector 调用，每份声明——含克隆——一次）。
 *
 * 局部：令牌 get-or-create（refs++）→ 内联立即注入（同名远程到达后覆盖同 id——「远程覆盖
 * 内联」，决策 12）→ scope 名字表登记（Map 后写胜 = 声明序所有权）→ 远程清单 kick fetch。
 * 全局：内联经注册表 add 立即入库 + 取走所有权；远程清单登记待定态 + kick fetch。
 */
export declare function registerIconDecl(input: RegisterIconDeclInput): void;
/** 图标名解析结果：就绪（href） / 待定（空占位） / 未命中（默认图标） */
export type IconResolution = {
    kind: "href";
    href: string;
} | {
    kind: "pending";
} | {
    kind: "miss";
};
/**
 * 图标域解析（x-icon 消费，决策 2）：自身 scope 沿 parent 链就近（内层遮蔽外层，命中即
 * 终态——待定/失败不穿透到全局：就近声明拥有该名）→ 全局注册表兜底 → 全局待定态。
 * 局部失败终态按未命中处理（默认图标，决策 11）；内联就绪者远程失败不受影响（names 优先）。
 */
export declare function resolveIconName(scope: AutoSparkScope | null, name: string): IconResolution;
/**
 * scope 销毁回收（scope.destroy 调用，决策 4）：逐令牌 refs--，归零摘除该组局部 symbol
 * 并删表项（后续同源声明按哈希重建、重新注入——声明数据确定性派生，无需持久保留）。
 * 全局 symbol 与注册表不清理（document 级资产纪律）。
 */
export declare function releaseScopeIcons(scope: AutoSparkScope): void;
/** 测试专用：清空图标域模块态（令牌表 / 全局远程态 / 所有权序号） */
export declare function resetIconDomainForTest(): void;
