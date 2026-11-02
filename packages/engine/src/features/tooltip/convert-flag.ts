/**
 * tooltip 编译期 title 转换开关（ADR-0128 决策 4——tooltip 薄壳化）：
 * `title → data-tooltip` 的编译期剥除逻辑（compiler._convertTitleEl）保留 engine，
 * 但其激活由 tooltip 插件（autospark.tooltip.js）注册时开启——**选择性引入即开关**：
 * 未加载插件 = title 保持原生行为、data-tooltip 无消费方。
 */

/** 转换激活位（插件 bootstrap 经 AutoSpark.enableTooltipConvert() 置位） */
let convertEnabled = false;

/** 开启编译期 title→data-tooltip 转换（tooltip 插件注册面） */
export function enableTooltipConvert(): void {
    convertEnabled = true;
}

/** compiler 读取：是否执行 title 转换 */
export function isTooltipConvertEnabled(): boolean {
    return convertEnabled;
}
