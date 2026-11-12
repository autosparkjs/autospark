/**
 * i18n 插件自举（ADR-0136 决策八；形态对称 notifications bootstrap）。
 *
 * 模块加载期执行 {@link bootstrapI18nPlugin}，双路径注册（ADR-0114，单点收敛
 * `installPlugin`）：引擎先加载直注册；否则推预加载队列，首个 engine 构造 drain 执行。
 * **须早于 `new AutoSpark()` 加载**（选择性引入契约——参与首编译的注册晚到不被已编译树识别）。
 *
 * 注册时序双段（既有插件机制语义，零新机制）：
 * - **installPlugin 回调体**（引擎先加载 = 模块加载期；队列路径 = drain 期——构造开头、
 *   先于首编译）：`scriptType("autospark/locales")` + `x-locales` 指令安装——声明通道
 *   须参与首编译；
 * - **`$.ready` 回调**（构造末尾，晚于 autostart compile）：覆写 `engine.translate`
 *   翻译实现槽（表达式闭包与 `actions.t` 的 handle 动态分派，覆写即全通道升级）+
 *   `$.language` 兜底 ensure（无 t 模板的场景也注入初值）。`actions.t` 缺省描述符由
 *   engine 核心注册（handle 分派槽），插件无需重复注册——覆写槽即升级（Q25 单槽）。
 */
import type { AutoSpark } from "autospark";
import { captureNamespace } from "../../utils/namespace";
import { installPlugin } from "@autospark/utils";
import { createI18nTranslate, ensureLanguage } from "./translate";
import { LOCALES_SCRIPT_TYPE, localesScriptHandler } from "./script";
import { createLocalesDirective } from "./directive";

/** ready 回调：per-engine 挂载运行时面（槽覆写 + `$.language` 兜底 ensure + 首渲染换血） */
function mountI18n(engine: AutoSpark): void {
    // 翻译槽覆写（ADR-0136 决策四/Q25 单槽）：核心默认兜底 t → 完整实现（查表/复数/$.language）
    engine.translate = createI18nTranslate(engine);
    // $.language 兜底 ensure（决策七）：t 首次求值也会惰性 ensure，此处覆盖无 t 模板的场景
    ensureLanguage(engine);
    // 首渲染换血：ready 晚于 autostart compile——首渲染的 t 已用兜底槽输出原样，
    // 覆写槽本身无依赖变化不触发重渲染，须同步重跑全部求值闭包（scope.refresh 递归
    // 子作用域；重跑为幂等重渲染，与 scheduler flush 同款动作，ADR-0136 时序补偿）。
    const scopes = (engine as any).scopes as Map<unknown, { refresh(): void }> | undefined;
    if (scopes) for (const scope of scopes.values()) scope.refresh();
}

/**
 * 双路径注册（模块加载期执行一次，经 {@link installPlugin} 单点）。
 */
export function bootstrapI18nPlugin(): void {
    installPlugin((autospark) => {
        captureNamespace(autospark); // 运行时桥命名空间捕获（params 经闭包参数解析）
        // ── 声明通道：参与首编译（drain 期 / 模块加载期，先于 autostart compile）──
        autospark.scriptType(LOCALES_SCRIPT_TYPE, localesScriptHandler);
        autospark.directive(createLocalesDirective());
        // ── 运行时挂载：ready（构造末尾，晚于 compile）──
        autospark.ready(mountI18n);
    });
}
