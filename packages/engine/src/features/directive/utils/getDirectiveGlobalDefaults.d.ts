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
 */
export declare function getDirectiveGlobalDefaults(engine: import("../../engine/engine").AutoSpark, directiveName: string): Record<string, any> | null;
