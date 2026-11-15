/**
 * autospark.time-picker 时间选择器组件插件（组件库 P3 时间族，ADR-0018 P3 清单 /
 * ADR-0025）：经插件全局组件表注册（ADR-0111 决策 5），跨 engine 真全局——晚注册
 * 立即生效，同名后注册覆盖先注册。
 *
 * 弹层交互自绘（ADR-0018 决策 7）：触发器 = Field 盒饰形态（继承
 * autospark.field 骨架，input/select 同款 chrome——本产物以副作用导入内嵌
 * field 注册）；时间面板**不自建弹层**——复用 x-popover 指令机制（trigger:click）
 * 呈现，面板组件 autospark-time-picker-panel（内部组件，随本插件注册，连字符注册名
 * 免疫 attr 参数点号切分，ADR-0022 决策 1 同款成因）渲染进 body 覆盖物容器。
 *
 * 面板形态（ADR-0025 决策 2 取舍）：**两列滚动列表**（时 0-23 / 分 0-59）而非刻度
 * 转盘——与族内 select 列表面板视觉同源；选择语义为**部分提交**（点击时/分格更新
 * value 对应位 + change 派发 + 面板保持开——两列需连续两次点选）；秒列与面板内键盘
 * 漫游裁剪（P3 按简）。
 *
 * **跨插件依赖声明**：x-popover 指令住 autospark.overlay.js——按需加载场景须同时
 * 引入 `autospark.overlay.js`（聚合产物无此问题）；overlay 缺席时触发器仍正常渲染。
 *
 * 面板 ↔ 触发器通信走 scope 链（哨兵键 hTick/hVal、mTick/mVal 回传点选，ADR-0022
 * 决策 2 协议）。值桥 = x-model 兼容协议（"HH:mm" 字符串语域，hidden 载体 +
 * input/change 双派发，对齐 ADR-0020/0022）。i18n 一键 time-picker.placeholder
 * （回退「请选择时间」）。
 *
 * IIFE 产物全局名 `AutoSparkTimePicker`（autospark.time-picker.js）；双加载时序由
 * {@link installPlugin} 兜底（先于引擎加载推预加载队列，晚于引擎加载直注册）。
 */
import type { AutoSpark } from "autospark";
import { captureNamespace } from "../../../utils/namespace";
import { installPlugin } from "@autospark/utils";
import "../../base/field/index";
import pickerTemplate from "./time-picker.html?raw";
import panelTemplate from "./panel.html?raw";

/** 组件注册名（autospark. 点前缀命名空间，ADR-0094；kebab 免疫 DOM 属性名小写化） */
export const TIME_PICKER_NAME = "autospark.time-picker";
/**
 * 时间面板内部组件注册名（非用户直接消费，无文档页投影，ADR-0025）。**连字符形态是
 * 有意的**：面板经 x-popover 指令 attr 参数消费，指令解析器把 attr 参数的点号切为
 * 修饰符（overlay 家族消费端无点号候选回溯，ADR-0022 遗留清单）——连字符免疫切分
 * 且保留 autospark 前缀命名空间意图（select 面板同款先例）。
 */
export const TIME_PICKER_PANEL_NAME = "autospark-time-picker-panel";

/** 时钟图标（lucide clock 造型，与 engine 内置图标同族描边风格）；组件自有图标经
 * 全局图标表编程通道注册（ADR-0058），名字空间化前缀防撞，同名静默覆盖——使用者可
 * 后注册同名图标定制视觉（select-down / date-calendar 同款纪律）。time-select 产物
 * 注册同名同图（双产物同载时幂等覆盖） */
const ICON_TIME_CLOCK =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>';

/**
 * 插件注册体：写插件全局组件表（触发器 + 面板双模板）+ 组件自有图标注册。
 */
function mountTimePickerPlugin(autospark: typeof AutoSpark): void {
  const icons = (autospark as { icons?: { add?: (name: string, svg: string) => unknown } }).icons;
  icons?.add?.("time-clock", ICON_TIME_CLOCK);
  autospark.components[TIME_PICKER_NAME] = pickerTemplate;
  autospark.components[TIME_PICKER_PANEL_NAME] = panelTemplate;
}

bootstrapTimePickerPlugin();

/**
 * 双路径注册（模块加载期执行一次，经 {@link installPlugin} 单点）。
 */
function bootstrapTimePickerPlugin(): void {
  installPlugin((autospark) => {
    captureNamespace(autospark); // 运行时桥命名空间捕获（本插件当前零符号消费，预留统一通道）
    mountTimePickerPlugin(autospark);
  });
}

export { bootstrapTimePickerPlugin };
