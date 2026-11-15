/**
 * autospark.table 数据表格组件插件（组件库 P2 最重件，ADR-0018 清单权威表 display 行
 * 「table 含 virtual 模式（P2）」；接线决策详见 ADR-0023）：经插件全局组件表注册
 * （ADR-0111 决策 5），跨 engine 真全局——晚注册立即生效，同名后注册覆盖先注册。
 *
 * 数据驱动表格容器：columns（列定义）+ rows（数据数组）均**状态引用注入**（字面量
 * 数组触发 props 更新死环，ADR-0019 后果 2 规避）；行 × 列双 x-for 装配（行循环
 * viewRows 为排序派生视图，列循环 template 形态挂行内——选择列与循环列共存同一行）；
 * 自定义单元格经 `col-<key>` 动态名作用域插槽（形参 `{ row, column, rowIndex,
 * colIndex }`，ADR-0107 对象形态出口）；sortable 列本地三态排序（升/降/取消，
 * remoteSort 交调用方远端）；selectable 行选择（checkbox 列组合消费
 * autospark.checkbox，全选/半选 + selection 受控单向内同步 + selection-change 事件）；
 * loading（引擎 x-loading 组合）/ empty（autospark.empty 组合 + empty 插槽重载）；
 * virtual 长表虚拟滚动（网格分叉 + x-for.virtual，行定高 40px，表头恒渲染外置）。
 *
 * 与 x-for / list 的边界（ADR 消歧）：x-for 是引擎渲染指令（全权自定义）；list 是单列
 * 数据的列表容器；table 是**列结构化**数据的表格容器（表头/对齐/列宽/排序/选择/斑马纹
 * 开箱）。行选择要 checkbox 列、列要排序表头——这些列结构语义 list 不承载。
 *
 * 元素名快速写法 `<x-table>` 由 engine 元素名自动组件承载（ADR-0117 缺省注册 x-table
 * 标签）；div 根无原生语义损失，不做 precompile 变换（ADR-0019 link 判据）。
 *
 * 跨插件依赖（按需加载须同页引入，聚合产物 autospark.plugins.js 无此问题）：
 * autospark.empty.js（空态兜底组合）、autospark.checkbox.js（selectable 行选择）、
 * autospark.virtual.js（virtual=true 时，缺位 warn 退化全量渲染）。
 *
 * IIFE 产物全局名 `AutoSparkTable`（autospark.table.js）；双加载时序由
 * {@link installPlugin} 兜底（先于引擎加载推预加载队列，晚于引擎加载直注册）。
 */
import type { AutoSpark } from "autospark";
import { captureNamespace } from "../../../utils/namespace";
import { installPlugin } from "@autospark/utils";
import tableTemplate from "./table.html?raw";

/** 组件注册名（autospark. 点前缀命名空间，ADR-0094；kebab 免疫 DOM 属性名小写化） */
export const TABLE_NAME = "autospark.table";

/**
 * 插件注册体：写插件全局组件表（普通 Record 赋值即生效，无 API 门面）。
 */
function mountTablePlugin(autospark: typeof AutoSpark): void {
    autospark.components[TABLE_NAME] = tableTemplate;
}

bootstrapTablePlugin();

/**
 * 双路径注册（模块加载期执行一次，经 {@link installPlugin} 单点）。
 */
function bootstrapTablePlugin(): void {
    installPlugin((autospark) => {
        captureNamespace(autospark); // 运行时桥命名空间捕获（本插件当前零符号消费，预留统一通道）
        mountTablePlugin(autospark);
    });
}

export { bootstrapTablePlugin };
