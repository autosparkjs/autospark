/**
 * autospark.color-picker 组件插件（组件库 P3 form 批重件，ADR-0018 清单权威表 form 行 /
 * ADR-0028）：经插件全局组件表注册（ADR-0111 决策 5），跨 engine 真全局——晚注册立即
 * 生效，同名后注册覆盖先注册。
 *
 * 颜色选择器（弹层交互自绘，ADR-0018 决策 7）：触发器 = Field 盒饰形态（继承
 * autospark.field 骨架，select 同款 chrome）+ 色块预览 + hex 文案；面板**自绘 HSV
 * 模型**（H 条 + SV 面板 + 预设色板 + hex 输入，零第三方库——路线图张力已裁定，
 * ADR-0028 决策 5）：SV 面板 = div 双层 CSS 渐变（不用 canvas）、thumb 百分比定位；
 * 拖拽经 pointer 事件 + setPointerCapture（缺席环境降级元素直挂监听）。
 *
 * 面板呈现**不自建弹层**——复用 x-popover 指令机制（trigger:click 形态，select 范式
 * 直承，ADR-0028 决策 6），面板组件 autospark-color-panel（内部组件，随本插件注册，
 * 连字符注册名免疫 attr 参数点号切分）渲染进 body 覆盖物容器，固定宽度（无 fit）。
 *
 * **跨插件依赖声明**：x-popover 指令住 autospark.overlay.js（ADR-0128 批次 4 外移）——
 * 按需加载场景须同时引入 `autospark.overlay.js`（聚合产物 autospark.plugins.js 无此
 * 问题）；overlay 缺席时触发器仍正常渲染（仅不开面板）。
 *
 * 面板 ↔ 触发器通信走 scope 链（open + dataContext:host 聚合视图沿链读写，零 DOM 事件、
 * 零 uid 配对，ADR-0022 决策 2 同款）：读 h/s/v/hueColor/liveHex/presets/disabled 呈现；
 * 写三类——拖拽直写 h/s/v（连续值无同值去重面）、离散交互哨兵键（pickTick/applyTick/
 * commitTick 自增免疫同值去重）、开合态（mounted/unmounted 沿链写 open）。
 *
 * 值域 "#rrggbb" 六位小写 hex（内部 HSV 转换，双真相防环见 ADR-0028 决策 7）；值桥 =
 * x-model 兼容协议（宿主 el.value 劫持 + 内嵌 input[type=hidden] 表单载体 +
 * input/change 双派发，对齐 ADR-0020）。无内置多语文案（色值与控件自释）。
 *
 * IIFE 产物全局名 `AutoSparkColorPicker`（autospark.color-picker.js）；双加载时序由
 * {@link installPlugin} 兜底（先于引擎加载推预加载队列，晚于引擎加载直注册）。
 */
import type { AutoSpark } from "autospark";
import { captureNamespace } from "../../../utils/namespace";
import { installPlugin } from "@autospark/utils";
import "../../base/field/index";
import colorPickerTemplate from "./color-picker.html?raw";
import panelTemplate from "./panel.html?raw";

/** 组件注册名（autospark. 点前缀命名空间，ADR-0094；kebab 免疫 DOM 属性名小写化） */
export const COLOR_PICKER_NAME = "autospark.color-picker";
/**
 * 颜色面板内部组件注册名（非用户直接消费，无文档页投影，ADR-0028）。**连字符形态是有意的**
 * （select 同款，ADR-0022 决策 1 注记）：面板经 x-popover 指令 attr 参数消费
 * （`x-popover:名称`），指令解析器把 attr 参数的点号切为修饰符——连字符免疫切分且保留
 * autospark 前缀命名空间意图。overlay 家族补点号候选回溯后可迁回点号主名。
 */
export const COLOR_PICKER_PANEL_NAME = "autospark-color-panel";

/**
 * 插件注册体：写插件全局组件表（触发器 + 面板双模板）。
 */
function mountColorPickerPlugin(autospark: typeof AutoSpark): void {
  autospark.components[COLOR_PICKER_NAME] = colorPickerTemplate;
  autospark.components[COLOR_PICKER_PANEL_NAME] = panelTemplate;
}

bootstrapColorPickerPlugin();

/**
 * 双路径注册（模块加载期执行一次，经 {@link installPlugin} 单点）。
 */
function bootstrapColorPickerPlugin(): void {
  installPlugin((autospark) => {
    captureNamespace(autospark); // 运行时桥命名空间捕获（本插件当前零符号消费，预留统一通道）
    mountColorPickerPlugin(autospark);
  });
}

export { bootstrapColorPickerPlugin };
