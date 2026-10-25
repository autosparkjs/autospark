/**
 * 插件双路径自举单点（utils ADR-0001；原收敛点 @autospark/plugins
 * runtime/bootstrap.ts 上移至此，plugins ADR-0006）：
 *
 * - `globalThis.AutoSpark` 已存在且 probe 命中（引擎脚本先加载）→ 直取注册；
 * - 否则推 `__AUTOSPARK_PLUGINS__` 预加载队列（ADR-0114），首个 engine 构造 drain 时
 *   插件体收 `(engine, autospark)` 双参——第二参即命名空间；
 * - 队列已被 drain + 冻结（注册通道关闭）且全局类不可达 → console.error 响而不哑
 *   （对齐 ADR-0111「误用会响而不是哑」纪律）。
 */
import type { AutoSpark, PluginBootstrap } from "autospark";

/** probe 键：自举前探测全局类可用性的方法名（插件注册面的最小依赖） */
export type PluginProbe = "ready" | "precompile" | "directive" | "components" | "actions" | "icons";

/**
 * 双路径注册（插件入口模块加载期调用一次）。
 *
 * @param tag 插件标识（错误信息前缀，如 "x-spark"）
 * @param probe 全局类探测方法名（如 ready/precompile/directive——注册面越窄误报越少）
 * @param register 实际注册体（收命名空间；内部应先 captureNamespace 再注册）
 */
export function installPlugin(
    tag: string,
    probe: PluginProbe,
    register: (autospark: typeof AutoSpark) => void,
): void {
    const existing = (globalThis as { AutoSpark?: typeof AutoSpark }).AutoSpark;
    const entry = existing?.[probe] as unknown;
    if (typeof entry === "function" || (probe !== "ready" && probe !== "directive" && entry != null)) {
        register(existing!);
        return;
    }
    const queue = ((globalThis as { __AUTOSPARK_PLUGINS__?: PluginBootstrap[] }).__AUTOSPARK_PLUGINS__ ??= []);
    if (Object.isFrozen(queue)) {
        console.error(
            `${tag}: 插件注册通道已关闭（__AUTOSPARK_PLUGINS__ 已消费且全局 AutoSpark 不可达），插件未注册`,
        );
        return;
    }
    queue.push((_engine, autospark) => register(autospark));
}
