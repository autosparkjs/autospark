/**
 * 插件双路径自举单点（utils ADR-0001；原收敛点 @autospark/plugins
 * runtime/bootstrap.ts 上移至此，plugins ADR-0006）：
 *
 * - `globalThis.AutoSpark` 已存在且 identity 探测命中（引擎脚本先加载）→ 直取注册；
 * - 否则推 `__AUTOSPARK_PLUGINS__` 预加载队列（ADR-0114），首个 engine 构造 drain 时
 *   插件体收 `(engine, autospark)` 双参——第二参即命名空间；
 * - 队列已被 drain + 冻结（注册通道关闭）且全局类不可达 → console.error 响而不哑
 *   （对齐 ADR-0111「误用会响而不是哑」纪律）。
 */
import type { AutoSpark, PluginBootstrap } from "autospark";

/**
 * 内部 identity 探测键（恒 "ready"——每个引擎形态必有的最小注册面）：
 * 区分「全局名存在」与「存在的是注册可达的 AutoSpark」——引擎前被其他脚本
 * 占用 `window.AutoSpark` 时，无探测的直取会把注册落到冒名对象上，引擎后加载
 * 重写全局即静默失效（哑故障）；探测不命中 → 转队列路径，drain 时拿真命名空间。
 * （原为插件自声明的 probe 键，2026-10-27 收敛为内部常量——API 单回调化。）
 */
const IDENTITY_PROBE = "ready";

/**
 * 双路径注册（插件入口模块加载期调用一次，仅收注册体一份入参）。
 *
 * @param register 实际注册体（收命名空间；内部应先 captureNamespace 再注册）
 */
export function installPlugin(register: (autospark: typeof AutoSpark) => void): void {
    const existing = (globalThis as { AutoSpark?: typeof AutoSpark }).AutoSpark;
    if (typeof (existing as Record<string, unknown> | undefined)?.[IDENTITY_PROBE] === "function") {
        register(existing!);
        return;
    }
    const queue = ((globalThis as { __AUTOSPARK_PLUGINS__?: PluginBootstrap[] }).__AUTOSPARK_PLUGINS__ ??= []);
    if (Object.isFrozen(queue)) {
        console.error(
            "installPlugin: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册",
        );
        return;
    }
    queue.push((_engine, autospark) => register(autospark));
}
