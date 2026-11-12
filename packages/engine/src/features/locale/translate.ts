/**
 * 翻译实现槽与兜底 t（ADR-0136）。
 *
 * engine 核心只保留「不报错」的最小翻译面（完整查表/复数/`$.language` 能力外移
 * `@autospark/plugins` 的 i18n 插件，产物 `autospark.i18n.js` 选择性引入）：
 *
 * - **单一实现槽** `engine.translate`：per-engine 可覆写的翻译实现位，核心默认 =
 *   {@link createFallbackTranslate}（恒等 + params 插值）——未装插件时模板 `t(...)`
 *   平滑降级，与装插件后「未命中键」的输出形态一致；插件 `$.ready` 覆写本槽即升级。
 * - **per-scope t 闭包** {@link createScopeT}：`watchExpression` / `read` / x-on 求值器
 *   经 `new Function("...", "t", "with(scope){...}")` 的函数参数注入表达式环境
 *   （with 链上无 `t` 标识符才落到该参数——用户 data/locals 同名变量天然优先）。
 *   闭包**每次调用动态分派槽**：插件晚于 scope 创建覆写也生效；`watchExpression`
 *   的动态依赖重收集保证槽内读取（如插件版读 `$.language`）变化时绑定自动重渲染。
 *
 * t 不进 actions 表的求值路径、不进 state（autostore 函数值 computed 陷阱）——
 * 表达式环境保留标识符 `t`；命令式通道见 ActionManager 的 `t` 缺省描述符（同分派本槽）。
 */
import { params } from "../../utils/params";
import type { AutoSpark } from "../../engine/engine";
import type { AutoSparkScope } from "../../engine/scope";

/** 翻译实现的统一签名：`scope` 供查表实现沿 scope 链取就近字典（核心兜底不消费） */
export type TranslateImpl = (
    scope: AutoSparkScope | undefined,
    key: string,
    ...args: any[]
) => string;

/** 表达式环境注入的 t 闭包形态 */
export type ScopeT = (...args: any[]) => string;

/**
 * 核心兜底实现：恒等返回键 + params 插值（无查表/复数/`$.language` 依赖）。
 * 未装 i18n 插件时 `t(key, ...args)` 行为 = 万能插值函数，零广播零响应式开销。
 */
export function createFallbackTranslate(): TranslateImpl {
    return (_scope, key, ...args) => params(key, ...args);
}

/**
 * per-scope t 闭包工厂：动态分派 `engine.translate` 槽。
 * 闭包持有 scope 供查表实现取「就近字典」（scope.parent 链是 i18n 插件的数据）。
 */
export function createScopeT(engine: AutoSpark, scope: AutoSparkScope): ScopeT {
    // spread 以 tuple 断言（TS7 对 any[] 展开到「固定参 + rest」签名报 TS2556）
    return (...args: any[]) => engine.translate(scope, ...(args as [string, ...any[]]));
}
