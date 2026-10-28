import type { AutoSpark } from "../../engine/engine";
import type { AutoSparkOptions } from "../../types";

/**
 * 解析指令全局默认（ADR-0127）：按**裸指令名**从 `engine.options.directives` 取该指令的
 * 全局默认配置表——选项回退链全局层的取值单点（`getOption` 与 `$options` 代理共用）。
 *
 * key 归一：带前缀 `"x-{name}"` 为主形态、裸名 `"{name}"` 等价容忍，**双形态并存带前缀
 * 优先**（hasOwnProperty 判定，前缀键显式 `null` 亦算命中、不再落裸名）；字面 kebab-case
 * 匹配，不做 case 归一；无 `*` 通配；未注册指令名天然静默（按消费方名字查表，无从命中）。
 * 值非普通对象（`false` / 字符串 / 数组等）视为缺省（静默，与孤儿 `-options` 策略一致）。
 *
 * **活读**：每次调用现读 `engine.options.directives`（不快照）——构造后对该表的增改对
 * 之后的读取生效，不追溯已渲染结果、不触发重渲染。
 *
 * @param engine        引擎实例
 * @param directiveName 裸指令名（`info.name`，如 `"dialog"`；解析期别名已归一，`"bind"`
 *                      覆盖 `:title` / `x-class` 全家族）
 * @returns 该指令的全局默认对象；无命中返回 `null`（调用方按「无本层」处理）
 */
export function getDirectiveGlobalDefaults(
    engine: AutoSpark,
    directiveName: string,
): Record<string, any> | null {
    const table = (engine.options as AutoSparkOptions | undefined)?.directives;
    if (!table || typeof table !== "object") return null;
    const has = Object.prototype.hasOwnProperty;
    const prefixed = "x-" + directiveName;
    const hit = has.call(table, prefixed)
        ? table[prefixed]
        : has.call(table, directiveName)
          ? table[directiveName]
          : undefined;
    return hit !== null && typeof hit === "object" && !Array.isArray(hit) ? hit : null;
}
