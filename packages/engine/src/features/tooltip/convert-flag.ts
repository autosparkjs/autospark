/**
 * tooltip 编译期 title 转换开关（ADR-0128 决策 4——tooltip 薄壳化）：
 * `title → data-tooltip` 的编译期剥除逻辑（compiler._convertTitleEl）保留 engine，
 * 但其激活由 tooltip 插件（autospark.tooltip.js）注册时开启——**选择性引入即开关**：
 * 未加载插件 = title 保持原生行为、data-tooltip 无消费方。
 */
import { isAutoComponentClass } from "../component/auto-component";
import type { DirectiveManager } from "../directive/manager";

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

/**
 * title 转换的组件宿主豁免判定（P1 修复——title 吞噬温床根治）。
 *
 * 转换（ADR-0061 决策 4）曾在编译期先于元素名组件的静态属性折叠（ADR-0117）执行，
 * 凡以 title 作 props 主通道的组件宿主其标题被吞：转换产物 `data-*` 属保留属性不折叠，
 * 值永久丢失。豁免面：
 * - **元素名自动组件**（`<x-card title="...">`）：静态属性折叠进 props 值通道，title 是
 *   props 语义，转换即吞值；
 * - **`x-component` 属性形态**（`x-component` / `x-component:名称`）：宿主化身语义下
 *   title 归组件消费面，统一豁免保两种实例化形态双态一致。
 *
 * 普通元素的 title（ADR-0061 决策 4 正路）不受影响，照常转换。
 */
export function isComponentTitleHost(
    el: Element,
    directives: Pick<DirectiveManager, "findByElementName" | "get">,
): boolean {
    // x-component 属性形态（含属性参数 x-component:名称）：仅主声明属性命中，
    // x-component-options 等同前缀选项族不在此列
    for (let i = 0; i < el.attributes.length; i++) {
        const name = el.attributes[i]!.name;
        if (name === "x-component" || name.startsWith("x-component:")) return true;
    }
    // 元素名自动组件：x-* 标签反查命中本机制生成的自动组件类（预设元素名指令如
    // x-super 不豁免——其 title 是普通原生语义，照常转换）
    const tag = el.tagName.toLowerCase();
    if (tag.startsWith("x-") && tag.length > 2) {
        const directiveName = directives.findByElementName(tag);
        if (directiveName) {
            const cls = directives.get(directiveName);
            if (isAutoComponentClass(cls)) return true;
        }
    }
    return false;
}
