/**
 * autospark.time-select 时间点下拉组件插件（组件库 P3 时间族，ADR-0018 P3 清单 /
 * ADR-0025）：经插件全局组件表注册（ADR-0111 决策 5），跨 engine 真全局——晚注册
 * 立即生效，同名后注册覆盖先注册。
 *
 * 定位比 time-picker 轻（ADR-0025 决策 3）：起止/步长生成**离散时间点列表**直接作为
 * options——**select 范式的简单列表面板直系克隆**（ADR-0022 面板的非 filter/virtual
 * 子集）：选项列表 + 选中标记 + 键盘导航（上下高亮 / Enter 确认 / 选中即关面板）+
 * fit 宽度匹配 + uid 配对 min-width 两段合成（面板与 select 下拉同款观感）。
 *
 * 触发器 = Field 盒饰形态（继承 autospark.field 骨架，本产物以副作用导入
 * 内嵌 field 注册）；面板**不自建弹层**——复用 x-popover 指令机制（trigger:click）
 * 呈现，面板组件 autospark-time-select-panel（内部组件，随本插件注册，连字符注册名
 * 免疫 attr 参数点号切分，ADR-0022 决策 1 同款成因）渲染进 body 覆盖物容器。
 *
 * **跨插件依赖声明**：x-popover 指令住 autospark.overlay.js——按需加载场景须同时
 * 引入 `autospark.overlay.js`（聚合产物无此问题）；overlay 缺席时触发器仍正常渲染。
 *
 * 面板 ↔ 触发器通信走 scope 链（哨兵键 pickTick/pickValue、keyTick/keyDir 回传交互，
 * ADR-0022 决策 2 协议）。值桥 = x-model 兼容协议（"HH:mm" 字符串语域，hidden 载体 +
 * input/change 双派发，对齐 ADR-0020/0022）。i18n 两键 time-select.placeholder
 * （回退「请选择时间」）/ time-select.empty（回退「暂无数据」——病态起止配置兜底）。
 *
 * IIFE 产物全局名 `AutoSparkTimeSelect`（autospark.time-select.js）；双加载时序由
 * {@link installPlugin} 兜底（先于引擎加载推预加载队列，晚于引擎加载直注册）。
 */
import type { AutoSpark } from "autospark";
import { captureNamespace } from "../../../utils/namespace";
import { installPlugin } from "@autospark/utils";
import "../../base/field/index";
import pickerTemplate from "./time-select.html?raw";
import panelTemplate from "./panel.html?raw";

/** 组件注册名（autospark. 点前缀命名空间，ADR-0094；kebab 免疫 DOM 属性名小写化） */
export const TIME_SELECT_NAME = "autospark.time-select";
/**
 * 时间点列表面板内部组件注册名（非用户直接消费，无文档页投影，ADR-0025）。**连字符
 * 形态是有意的**：面板经 x-popover 指令 attr 参数消费，指令解析器把 attr 参数的点号
 * 切为修饰符（overlay 家族消费端无点号候选回溯，ADR-0022 遗留清单）——连字符免疫
 * 切分且保留 autospark 前缀命名空间意图（select 面板同款先例）。
 */
export const TIME_SELECT_PANEL_NAME = "autospark-time-select-panel";

/** 时钟图标（lucide clock 造型）：与 time-picker 产物注册同名同图（双产物同载时
 * 同名静默覆盖幂等，ADR-0058）；使用者可后注册同名图标定制视觉 */
const ICON_TIME_CLOCK =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>';

/**
 * 插件注册体：写插件全局组件表（触发器 + 面板双模板）+ 组件自有图标注册。
 */
function mountTimeSelectPlugin(autospark: typeof AutoSpark): void {
  const icons = (autospark as { icons?: { add?: (name: string, svg: string) => unknown } }).icons;
  icons?.add?.("time-clock", ICON_TIME_CLOCK);
  autospark.components[TIME_SELECT_NAME] = pickerTemplate;
  autospark.components[TIME_SELECT_PANEL_NAME] = panelTemplate;
}

bootstrapTimeSelectPlugin();

/**
 * 双路径注册（模块加载期执行一次，经 {@link installPlugin} 单点）。
 */
function bootstrapTimeSelectPlugin(): void {
  installPlugin((autospark) => {
    captureNamespace(autospark); // 运行时桥命名空间捕获（本插件当前零符号消费，预留统一通道）
    mountTimeSelectPlugin(autospark);
  });
}

export { bootstrapTimeSelectPlugin };
