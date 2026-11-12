/**
 * `<script type="autospark/locales">` 处理器（ADR-0136 决策三）。
 *
 * 经 `AutoSpark.scriptType` 开放注册表注册（ADR-0132，插件注册非内置保留名）；
 * 未装本插件时引擎派发 transformer 对未注册类型 warn + 剪枝丢弃（compiler 既有
 * 行为，script 不进渲染 DOM）——降级面零动作。
 *
 * 收集语义三层兜底：`global` 属性显式全局；顶层游离（无祖先 scope）**自动全局**
 * （用户模板根无指令属性时不丢字典）；默认挂最近祖先 scope（就近覆盖）。
 * 内容 = JS 对象字面量（`new Function` 求值，对齐 `extractScript` 先例——天然容许
 * 单引号/尾逗号），解析失败 error 日志 + 该脚本跳过（不中断编译）。
 */
import type { AutoSpark, AutoSparkScriptHandler } from "autospark";
import { collectEngineDict, collectScopeDict } from "./translate";

/** script type 值（autospark/ 命名空间家族，ADR-0031） */
export const LOCALES_SCRIPT_TYPE = "autospark/locales";

export const localesScriptHandler: AutoSparkScriptHandler = (
    script: HTMLScriptElement,
    scope,
    engine: AutoSpark,
): void => {
    const text = script.textContent?.trim();
    if (!text) return;
    let parsed: unknown;
    try {
        parsed = new Function(`return (${text})`)();
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
            engine.logger.error(`<script type="autospark/locales"> 内容须为字典对象字面量`);
            return;
        }
    } catch (e: any) {
        engine.logger.error(`<script type="autospark/locales"> 解析失败: ${e?.message ?? e}`);
        return;
    }
    const dict = parsed as Record<string, any>;
    // global 显式全局 / 顶层游离自动全局 / 默认最近祖先 scope（就近覆盖）
    if (script.hasAttribute("global") || !scope) {
        collectEngineDict(engine, dict);
    } else {
        collectScopeDict(scope, dict);
    }
};
