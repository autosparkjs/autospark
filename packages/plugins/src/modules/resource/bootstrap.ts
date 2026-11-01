/**
 * resource 插件自举（ADR-0011；形态对称 notifications bootstrap）。
 *
 * 模块加载期经 {@link bootstrapResourcePlugin} 双路径注册（ADR-0114）：
 *
 * 1. 挂类静态 `AutoSpark.resources = 全局管理器单例`（幂等——ADR-0111 命名空间成员挂类
 *    静态；IIFE/ESM 同一后端）；
 * 2. 注册 script type 派发：`AutoSpark.scriptType("autospark/resources", handler)`
 *    （ADR-0132 通用派发点）——`<script type="autospark/resources">` 声明的编译期入口；
 * 3. 注册 `x-resource` 指令（`$.directive` spec 重载，唯一公共入口）；
 * 4. `AutoSpark.ready`：每 engine 挂 `engine.resources` 实例视图（engine 级 add/读
 *    options.resources 的编程面）。
 *
 * 未装插件时的行为（硬切，不留薄桥）：`autospark/resources` script 未注册被 warn 丢弃、
 * `x-resource` 未知指令、`AutoSpark.resources`/`engine.resources` 缺失——报错本身即引导。
 */
import { captureNamespace } from "../../utils/namespace";
import { installPlugin } from "@autospark/utils";
import { AutoSparkResourceManager } from "./manager";
import { getGlobalResourceManager } from "./global";
import { resourceScriptHandler } from "./script";
import { createResourceDirectiveSpec } from "./directive";

/**
 * 双路径注册（模块加载期执行一次，单点收敛于 {@link installPlugin}；见模块注释）。
 */
export function bootstrapResourcePlugin(): void {
    installPlugin((autospark) => {
        captureNamespace(autospark); // 运行时桥命名空间捕获（脚本场景 globalThis 直取；队列路径插件体注入）
        // 1. 类静态全局管理器（幂等挂载；类型面 augment 无法覆盖类静态，消费方经运行时访问）
        if (!(autospark as any).resources) {
            (autospark as any).resources = getGlobalResourceManager();
        }
        // 2. script type 派发（注册表 warn + 覆盖语义兜底双加载场景）
        autospark.scriptType("autospark/resources", resourceScriptHandler);
        // 3. x-resource 指令（spec 重载：Compile 通道 + created 钩子足够）
        autospark.directive(createResourceDirectiveSpec());
        // 4. engine.resources 视图（ready：每 engine 各一次，retain 语义）
        autospark.ready((engine) => {
            (engine as any).resources = new AutoSparkResourceManager(engine);
        });
    });
}
