/**
 * autospark.result 组件插件（组件库 P2 反馈件，ADR-0018 清单权威表 feedback 行）：
 * 经插件全局组件表注册（ADR-0111 决策 5，`AutoSpark.components[name] = 模板字符串`），
 * 跨 engine 真全局——晚注册立即生效，同名后注册覆盖先注册。
 *
 * 结果页：语义色大图标（type：success/error/warning/info 经 x-icon 渲染）+ 标题
 * （title）+ 描述（description）+ 动作区（默认插槽，button 组合配方示例）。纯展示
 * 组件——无状态无事件；icon 插槽可整体换图（自定义 SVG / 图片 / 复合图形）。
 *
 * 与 alert 的边界：alert 是页内警示条（行内横条、随文中断性提示）；result 是操作
 * 终态页（居中纵排大图标 + 标题描述 + 动作区，整页/整卡占位）——前者打断阅读流，
 * 后者承载流程终点（提交成功/支付失败等），两者正交。
 *
 * 无内置文案、不接 i18n（title/description 均使用者传入，ADR-0018 决策 6 约定 1 的
 * i18n 通道对本件无消费面）；字号档位经主题通道 data-size 全跟随（不设自有字号属性）。
 *
 * 元素名快速写法 `<x-result type="success" title="...">` 由 engine 元素名自动组件承载
 * （ADR-0117 缺省注册 x-result 标签；全部 props 均标量，无字面量数组死环面）。
 *
 * IIFE 产物全局名 `AutoSparkResult`（autospark.result.js）；双加载时序由
 * {@link installPlugin} 兜底（先于引擎加载推预加载队列，晚于引擎加载直注册）。
 */
import type { AutoSpark } from "autospark";
import { captureNamespace } from "../../../utils/namespace";
import { installPlugin } from "@autospark/utils";
import resultTemplate from "./result.html?raw";

/** 组件注册名（autospark. 点前缀命名空间，ADR-0094；kebab 免疫 DOM 属性名小写化） */
export const RESULT_NAME = "autospark.result";

/**
 * 插件注册体：写插件全局组件表（普通 Record 赋值即生效，无 API 门面）。
 */
function mountResultPlugin(autospark: typeof AutoSpark): void {
    autospark.components[RESULT_NAME] = resultTemplate;
}

bootstrapResultPlugin();

/**
 * 双路径注册（模块加载期执行一次，经 {@link installPlugin} 单点）。
 */
function bootstrapResultPlugin(): void {
    installPlugin((autospark) => {
        captureNamespace(autospark); // 运行时桥命名空间捕获（本插件当前零符号消费，预留统一通道）
        mountResultPlugin(autospark);
    });
}

export { bootstrapResultPlugin };
