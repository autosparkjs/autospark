/**
 * 节点是否为数据脚本（自 engine compile/dataScript 复制最小判据，ADR-0008 决策 3）：
 * `<script type="autospark/data">` 数据声明载体，树节点模板内的预扫提取依赖此判定。
 */
const DATA_SCRIPT_TYPE = "autospark/data";

export function isDataScript(node: Node): node is HTMLScriptElement {
    return node instanceof HTMLScriptElement && node.type === DATA_SCRIPT_TYPE;
}
