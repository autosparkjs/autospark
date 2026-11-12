/**
 * autospark.select 组件插件（组件库 P1 form 批重件，ADR-0018 清单权威表 form 行 /
 * ADR-0022）：经插件全局组件表注册（ADR-0111 决策 5），跨 engine 真全局——晚注册立即
 * 生效，同名后注册覆盖先注册。
 *
 * 下拉选择器（弹层交互自绘，ADR-0018 决策 7）：触发器 = BaseField 盒饰形态（继承
 * autospark.base-field 骨架，input 同款 chrome——本产物以副作用导入内嵌 base-field
 * 注册，继承链 select → base-field → autospark.base，按需加载场景无须单独引入
 * autospark.base-field.js）；下拉面板**不自建弹层**——复用 x-popover 指令机制
 * （trigger:click 形态）呈现，面板组件 autospark-select-panel（内部组件，随本插件注册，
 * 连字符注册名免疫 attr 参数点号切分——见 SELECT_PANEL_NAME 注注）渲染进 body 覆盖物容器。
 *
 * **跨插件依赖声明**：x-popover 指令住 autospark.overlay.js（ADR-0128 批次 4 外移）——
 * 按需加载场景须同时引入 `autospark.overlay.js`（聚合产物 autospark.plugins.js 无此
 * 问题）；长列表虚拟化（virtual props）另需 `autospark.virtual.js`（渐进增强，缺席时
 * 引擎降级全量渲染）。overlay 缺席时触发器仍正常渲染（仅不开面板——面板本就没有
 * 呈现通道）。
 *
 * 面板 ↔ 触发器通信走 scope 链（open + dataContext:host 聚合视图沿链读写，零 DOM 事件、
 * 零 uid 配对，ADR-0022 决策 3）；值桥 = x-model 兼容协议（宿主 el.value 劫持 + 内嵌
 * input[type=hidden] 表单载体 + input/change 双派发，对齐 ADR-0020）。无多语文案除
 * placeholder 与空态（i18n 词典 select.placeholder / select.empty，回退硬编码中文，
 * ADR-0018 决策 6 约定 1）；尺寸档位经主题 data-size 通道全跟随（不设自有尺寸属性，
 * button 同范式 ADR-0012）。
 *
 * IIFE 产物全局名 `AutoSparkSelect`（autospark.select.js）；双加载时序由
 * {@link installPlugin} 兜底（先于引擎加载推预加载队列，晚于引擎加载直注册）。
 */
import type { AutoSpark } from "autospark";
import { captureNamespace } from "../../../utils/namespace";
import { installPlugin } from "@autospark/utils";
import "../../base/base-field/index";
import selectTemplate from "./select.html?raw";
import panelTemplate from "./panel.html?raw";

/** 组件注册名（autospark. 点前缀命名空间，ADR-0094；kebab 免疫 DOM 属性名小写化） */
export const SELECT_NAME = "autospark.select";
/**
 * 下拉面板内部组件注册名（非用户直接消费，无文档页投影，ADR-0022）。**连字符形态是有意
 * 的**：面板经 x-popover 指令 attr 参数消费（`x-popover:名称`），指令解析器把 attr 参数
 * 的点号切为修饰符（`autospark.select-panel` → 组件名截断为 `autospark` 永久 MISS）——
 * x-component 化身路径已做升序候选回溯（ADR-0088），overlay 家族消费端未跟；连字符免疫
 * 切分且保留 autospark 前缀命名空间意图。overlay 家族补回溯后可迁回点号主名（ADR-0022
 * 遗留清单）。
 */
export const SELECT_PANEL_NAME = "autospark-select-panel";

/** 下拉箭头图标（lucide chevron-down 造型，与 engine 内置图标同族描边风格）；
 * 组件自有图标经全局图标表编程通道注册（ADR-0058），名字空间化前缀防撞，同名静默
 * 覆盖——使用者可后注册同名图标定制视觉（ADR-0020 决策 8 input-eye 同款纪律） */
const ICON_SELECT_DOWN =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>';

/**
 * 插件注册体：写插件全局组件表（触发器 + 面板双模板）+ 组件自有图标注册。
 */
function mountSelectPlugin(autospark: typeof AutoSpark): void {
  const icons = (autospark as { icons?: { add?: (name: string, svg: string) => unknown } }).icons;
  icons?.add?.("select-down", ICON_SELECT_DOWN);
  autospark.components[SELECT_NAME] = selectTemplate;
  autospark.components[SELECT_PANEL_NAME] = panelTemplate;
}

bootstrapSelectPlugin();

/**
 * 双路径注册（模块加载期执行一次，经 {@link installPlugin} 单点）。
 */
function bootstrapSelectPlugin(): void {
  installPlugin((autospark) => {
    captureNamespace(autospark); // 运行时桥命名空间捕获（本插件当前零符号消费，预留统一通道）
    mountSelectPlugin(autospark);
  });
}

export { bootstrapSelectPlugin };
