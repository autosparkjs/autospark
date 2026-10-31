/**
 * autospark 运行时命名空间解析（@autospark/plugins 全包零静态依赖纪律，ADR-0003 实操守则；
 * ADR-0009 自 src/runtime/bridge.ts 拆入 utils——captureNamespace/resolveNamespace/nsMember
 * 三件套共享 captured 状态，强内聚单文件，decorate.ts 同款先例）：
 *
 * 本包对 autospark 的依赖**全部运行时解析**，编译期零 import（类型导入除外——编译期剥除，
 * 产物零痕迹）。IIFE 产物统一「引入即可」：autospark 以**运行时命名空间**形态被消费——
 * 脚本场景为 `globalThis.AutoSpark`（engine IIFE 全量导出挂类静态，ADR-0111 决策 1，
 * jQuery $ 同构），先于引擎加载的场景经预加载队列插件体第二参捕获（engine 构造 drain 时
 * 传入，无论引擎加载形态）。
 *
 * ## 双路径捕获（各插件自举 register 内调用 captureNamespace）
 *
 * - `globalThis.AutoSpark` 已存在（引擎脚本先加载）→ register 直取即捕获；
 * - 否则插件体推 `__AUTOSPARK_PLUGINS__` 预加载队列（ADR-0114），首个 engine 构造 drain 时
 *   插件体收 `(engine, autospark)` 双参——第二参即命名空间，captureNamespace 存档。
 *
 * 符号解析恒发生在运行期（卡片装配 / actions 物化），恒晚于捕获，无时序缺口。
 *
 * engine 公开成员的具名包装见同目录 getOverlayContainer.ts / markRaw.ts / shallow.ts /
 * scopesKey.ts（一函数一文件，ADR-0009）。
 */

/** 已捕获的命名空间引用（预加载队列插件体注入；脚本场景 globalThis 直取优先） */
let captured: any = null;

/** 捕获命名空间（插件自举 register 内调用——两路径殊途同归于此） */
export function captureNamespace(autospark: unknown): void {
    captured = autospark;
}

/** 解析命名空间：脚本场景 globalThis 直取优先（最新全局态），否则用捕获引用 */
export function resolveNamespace(): any {
    return (globalThis as { AutoSpark?: unknown }).AutoSpark ?? captured;
}

/**
 * 取命名空间成员（缺位即 error——响而不哑，对齐 ADR-0111「误用会响而不是哑」纪律：
 * 引导缺失/成员缺失是集成错误，静默 undefined 会把故障推迟到使用点更难排查）。
 */
export function nsMember<T = any>(name: string): T {
    const ns = resolveNamespace();
    const value = ns?.[name];
    if (value == null) {
        throw new Error(
            `[autospark/components] autospark 运行时命名空间不可达或缺少成员 "${name}"` +
                "——autospark 须先于本插件加载（或经 __AUTOSPARK_PLUGINS__ 预加载队列引导）",
        );
    }
    return value as T;
}
