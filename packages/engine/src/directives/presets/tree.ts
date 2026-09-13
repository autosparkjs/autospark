import { AutoSparkDirectiveBase } from "../base";

/**
 * 
 *  用于渲染树
 * 
 * 根据表达式的值，切换其中一个元素
 * 
 * <ul x-tree="树数据" x-tree-options="{....}">
 *  <li x-tree-node="节点id" x-text="node.id" x-tree-node-options="{
 *           format:"json | list"
 *           idField:"id",
 *           childrenField:"children",
 *           pidField:"pid",
 *           defaultExpandLevel:2
 *     }">
 *      <span x-text="node.text"></span>
 *  </li>
 * </ul>
 * 
 *  x-tree在渲染时会自动注入 $level($level), $children（子节点数据）
 * 
 *  树数据可以是 *  多根[{...}] *  单根{...}
 *  
 * 
 * 
 * varName指向的如果是对象
 *  

 */
export class TreeDirective extends AutoSparkDirectiveBase {
    render() {}
}
