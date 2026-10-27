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
import type { AutoSpark } from "autospark";
/**
 * 双路径注册（插件入口模块加载期调用一次，仅收注册体一份入参）。
 *
 * @param register 实际注册体（收命名空间；内部应先 captureNamespace 再注册）
 */
export declare function installPlugin(register: (autospark: typeof AutoSpark) => void): void;
