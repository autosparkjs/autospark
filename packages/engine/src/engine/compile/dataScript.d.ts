import type { AutoSpark } from "../engine";
/** 数据脚本的 type 值（ADR-0031 命名空间家族：autospark/actions、autospark/setup、autospark/data） */
export declare const DATA_SCRIPT_TYPE = "autospark/data";
/** 预扫产物：合成数据 + 可选挂载配置（`options` 属性） */
export interface DataScriptStash {
    data: Record<string, any>;
    options?: Record<string, any>;
}
/** 节点是否为数据脚本（compiler 剪枝 transformer 的 filter 与本模块共用同一真相源） */
export declare function isDataScript(node: Node): node is HTMLScriptElement;
/**
 * 预扫元素的**直接子级**数据脚本并合成。
 *
 * 每元素编译调用一次、随实例新鲜求值——x-for / x-component 复用同一模板时各实例拿到独立数据对象，
 * 嵌套对象不跨实例共享引用（x-data 属性值每次 parse 的等价保障）。
 *
 * @returns 合成产物；无数据脚本（且无 options 声明）返回 null
 */
export declare function collectDataScripts(engine: AutoSpark, template: HTMLElement): DataScriptStash | null;
