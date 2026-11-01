/**
 * `<script type="autospark/resources">` 处理器（ADR-0011；经 ADR-0132 script type 派发注册）。
 *
 * 内容为对象字面量：`{ 资源名: 资源定义, … }`（定义三形态见 types.ts），经 `new Function`
 * 求值（与 actions script 同款先例——手写方法的箭头函数/闭包均可）。
 *
 * 注入目标由 `global` 属性分流（与 `autospark/actions` 同构，ADR-0012）：
 *
 * - 默认（无 global）：**局部资源** → 展开为点号名声明表经
 *   `engine.actionsManager.registerScoped` 注入最近祖先 scope.actions（local 包装只 DOM
 *   冒泡；scope 沿链就近覆盖祖先同名资源）；
 * - `<script type="autospark/resources" global>`：**engine 级资源** → 注入
 *   `engine.actions`（Proxy set trap 自动规范化包装，双发总线+DOM），本 engine 任意
 *   scope 可见（跨 engine 共享走 `AutoSpark.resources.add`——全局唯一动态入口）。
 */
import type { AutoSparkScriptHandler } from "autospark";
import { expandResource } from "./define";
import type { ResourceDef } from "./types";
import { getGlobalResourceManager } from "./global";

/**
 * script type 派发处理器（bootstrap 经 `AutoSpark.scriptType("autospark/resources", …)` 注册）。
 */
export const resourceScriptHandler: AutoSparkScriptHandler = (script, scope, engine) => {
    const text = script.textContent?.trim();
    if (!text) return;
    let parsed: Record<string, ResourceDef>;
    try {
        const result = new Function(`return (${text})`)();
        if (!result || typeof result !== "object" || Array.isArray(result)) {
            engine.logger.error(`<script type="autospark/resources"> 内容须为对象字面量`);
            return;
        }
        parsed = result;
    } catch (e: any) {
        engine.logger.error(
            `<script type="autospark/resources"> 解析失败: ${e?.message ?? e}`,
        );
        return;
    }
    const globalOptions = getGlobalResourceManager().options;
    const useGlobal = script.hasAttribute("global");
    for (const [name, def] of Object.entries(parsed)) {
        const decls = expandResource(name, def, engine, globalOptions);
        if (Object.keys(decls).length === 0) {
            engine.logger.warn(
                `资源 "${name}" 定义为空（无 url 也无方法），已跳过（ADR-0011）`,
            );
            continue;
        }
        if (useGlobal) {
            // engine 级：Proxy set trap 自动规范化包装（信号/DOM 双通道）
            for (const [id, fn] of Object.entries(decls)) engine.actions[id] = fn;
        } else if (scope) {
            // 局部：local 包装（只 DOM 冒泡，ADR-0012），挂最近祖先 scope 就近覆盖
            engine.actionsManager.registerScoped(scope, decls);
        } else {
            // 局部声明但无祖先 scope（顶层游离）：提示应加 global 或移入容器
            engine.logger.warn(
                `资源 "${name}" 局部声明无祖先 scope（顶层游离）——加 global 属性声明 engine 级，或移入任意容器元素内`,
            );
        }
    }
};
