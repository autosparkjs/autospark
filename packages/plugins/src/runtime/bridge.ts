/**
 * autospark 运行时桥（@autospark/plugins 全包零静态依赖纪律，ADR-0003 实操守则）：
 *
 * 本包对 autospark 的依赖**全部运行时解析**，编译期零 import（类型导入除外——编译期剥除，
 * 产物零痕迹）。IIFE 产物统一「引入即可」：无需 external、无需构建期桥接 stub，autospark
 * 以**运行时命名空间**形态被消费——脚本场景为 `globalThis.AutoSpark`
 * （engine IIFE 全量导出挂类静态，ADR-0111 决策 1，jQuery $ 同构），先于引擎加载的场景经
 * 预加载队列插件体第二参捕获（engine 构造 drain 时传入，无论引擎加载形态）。
 *
 * ## 双路径捕获（{@link bootstrapRipplePlugin} 等插件自举的 register 内调用）
 *
 * - `globalThis.AutoSpark` 已存在（引擎脚本先加载）→ register 直取即捕获；
 * - 否则插件体推 `__AUTOSPARK_PLUGINS__` 预加载队列（ADR-0114），首个 engine 构造 drain 时
 *   插件体收 `(engine, autospark)` 双参——第二参即命名空间，{@link captureNamespace} 存档。
 *
 * 符号解析恒发生在运行期（卡片装配 / actions 物化），恒晚于捕获，无时序缺口。
 *
 * ## 符号清单（engine 公开导出面，IIFE 后处理自动挂类静态）
 *
 * - `getOverlayContainer`：引擎渲染根（overlay 容器宿主）
 * - `markRaw` / `shallow`：autostore API（engine 入口全量转导出，ADR-0030）
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

/** 引擎渲染根（overlay 容器宿主；engine 公开 API） */
export function getOverlayContainer(engine: any): HTMLElement | null {
    return nsMember<(engine: any) => HTMLElement | null>("getOverlayContainer")(engine);
}

/** 免代理标记（autostore API）：落响应式域的对象须绕过代理语义时使用 */
export function markRaw<T>(value: T): T {
    return nsMember<(value: any) => T>("markRaw")(value);
}

/** 浅响应包装（autostore API）：depth 0/1 控制浅层深度 */
export function shallow<T>(value: T, depth: 0 | 1): T {
    return nsMember<(value: any, depth: 0 | 1) => T>("shallow")(value, depth);
}

/**
 * scope 注册表键（store.state[SCOPES_KEY][scope.id]）：按路径精准订阅 scope 数据的
 * 坐标前缀。点路径订阅同步 fire（per 写入触发）——契约广播类订阅（如 task 运行键的
 * update 事件「首个真实变更不吞」，ADR-0102）必须走此通道；scope.watch 经 scheduler
 * 微任务合并，连续写入只保留末值，不适用。
 */
export function scopesKey(): string {
    return nsMember<string>("SCOPES_KEY");
}
