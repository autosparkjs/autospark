/**
 * autospark.date-picker 日期选择器组件插件（组件库 P3 时间族，ADR-0018 P3 清单 /
 * ADR-0025）：经插件全局组件表注册（ADR-0111 决策 5），跨 engine 真全局——晚注册立即
 * 生效，同名后注册覆盖先注册。
 *
 * 弹层交互自绘（ADR-0018 决策 7 / 排除域裁定：完整日历组件不做，日历仅作本件内部
 * 面板）：触发器 = Field 盒饰形态（继承 autospark.field 骨架，input/select
 * 同款 chrome——本产物以副作用导入内嵌 field 注册，继承链
 * date-picker → field → autospark.base）；日历面板**不自建弹层**——复用
 * x-popover 指令机制（trigger:click）呈现，面板组件 autospark-date-picker-panel
 * （内部组件，随本插件注册，连字符注册名免疫 attr 参数点号切分——ADR-0022 决策 1
 * 同款成因）渲染进 body 覆盖物容器。
 *
 * **跨插件依赖声明**：x-popover 指令住 autospark.overlay.js（ADR-0128 批次 4 外移）
 * ——按需加载场景须同时引入 `autospark.overlay.js`（聚合产物无此问题）；overlay 缺席
 * 时触发器仍正常渲染（仅无面板呈现通道）。
 *
 * 面板 ↔ 触发器通信走 scope 链（open + dataContext:host 聚合视图沿链读写，ADR-0022
 * 决策 2 协议）：面板写哨兵键（pickTick/pickValue 日格点击与今天快捷、monthTick/
 * monthDelta 月份切换）回传交互，mounted/unmounted 沿链写 open 开合态。值桥 = x-model
 * 兼容协议（宿主 el.value 劫持 + 内嵌 input[type=hidden] 表单载体 + input/change 双
 * 派发，"YYYY-MM-DD" 字符串语域，对齐 ADR-0020/0022）。i18n 文案四键
 * （date-picker.placeholder/weekdays/month-format/today，回退硬编码中文）；键盘 =
 * 面板 grid 日间漫游（±1/±7 天跨月跟随）+ PageUp/PageDown 切月 + Enter 确认（按简）。
 *
 * IIFE 产物全局名 `AutoSparkDatePicker`（autospark.date-picker.js）；双加载时序由
 * {@link installPlugin} 兜底（先于引擎加载推预加载队列，晚于引擎加载直注册）。
 */
import type { AutoSpark } from "autospark";
import { captureNamespace } from "../../../utils/namespace";
import { installPlugin } from "@autospark/utils";
import "../../base/field/index";
import pickerTemplate from "./date-picker.html?raw";
import panelTemplate from "./panel.html?raw";

/** 组件注册名（autospark. 点前缀命名空间，ADR-0094；kebab 免疫 DOM 属性名小写化） */
export const DATE_PICKER_NAME = "autospark.date-picker";
/**
 * 日历面板内部组件注册名（非用户直接消费，无文档页投影，ADR-0025）。**连字符形态是有意
 * 的**：面板经 x-popover 指令 attr 参数消费（`x-popover:名称`），指令解析器把 attr 参数
 * 的点号切为修饰符（overlay 家族消费端无点号候选回溯，ADR-0022 遗留清单）——连字符免疫
 * 切分且保留 autospark 前缀命名空间意图（select 面板同款先例）。
 */
export const DATE_PICKER_PANEL_NAME = "autospark-date-picker-panel";

/** 日历图标（lucide calendar 造型，与 engine 内置图标同族描边风格）；组件自有图标经
 * 全局图标表编程通道注册（ADR-0058），名字空间化前缀防撞，同名静默覆盖——使用者可
 * 后注册同名图标定制视觉（select-down / input-eye 同款纪律） */
const ICON_DATE_CALENDAR =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>';

/**
 * 插件注册体：写插件全局组件表（触发器 + 面板双模板）+ 组件自有图标注册。
 */
function mountDatePickerPlugin(autospark: typeof AutoSpark): void {
  const icons = (autospark as { icons?: { add?: (name: string, svg: string) => unknown } }).icons;
  icons?.add?.("date-calendar", ICON_DATE_CALENDAR);
  autospark.components[DATE_PICKER_NAME] = pickerTemplate;
  autospark.components[DATE_PICKER_PANEL_NAME] = panelTemplate;
}

bootstrapDatePickerPlugin();

/**
 * 双路径注册（模块加载期执行一次，经 {@link installPlugin} 单点）。
 */
function bootstrapDatePickerPlugin(): void {
  installPlugin((autospark) => {
    captureNamespace(autospark); // 运行时桥命名空间捕获（本插件当前零符号消费，预留统一通道）
    mountDatePickerPlugin(autospark);
  });
}

export { bootstrapDatePickerPlugin };
