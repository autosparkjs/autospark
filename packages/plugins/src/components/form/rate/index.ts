/**
 * autospark.rate 组件插件（组件库 P1 批 form 轻件，ADR-0018 清单权威表 form 行）：
 * 经插件全局组件表注册（ADR-0111 决策 5），跨 engine 真全局——晚注册立即生效，
 * 同名后注册覆盖先注册。
 *
 * 评分（自绘路线，无原生对应控件）：引擎内置 `star` 星形图标 ×N（x-for 渲染，
 * max 可配），点亮层 clip-path 百分比裁剪承载半星；可访问性自持——role=slider
 * 单焦点键盘模型（Arrow 方向调分 + Home/End 归位 + aria-valuenow 随动，switch
 * role=switch 同款自持范式）。继承 autospark.base-field 表单域骨架（状态色通道 /
 * 焦点态 / disabled 同步，裸态无盒饰）——本产物以副作用导入内嵌 base-field 注册
 * （继承链 rate → base-field → autospark.base，ADR-0020），按需加载场景无须单独
 * 引入 autospark.base-field.js。
 *
 * 值通道（x-model 兼容协议）：宿主 el.value 劫持为数字语域（"0".."N"[.5]）；提交
 * （点击 / 键盘）派发 input（x-model 回写，非冒泡）+ change（detail={ value } 冒泡
 * 供外层消费）。表单提交 = hidden 载体（自绘控件无原生真身，state-button/switch
 * 同款代理；name 透传）。clearable 再次点击同分清零；allowHalf 半星粒度（悬停
 * 预览与提交同粒度）。
 *
 * 无内置文案、不接 i18n（ADR-0018 决策 1）——可访问性标注经宿主 aria-label 透传；
 * 尺寸档位经主题 data-size 通道全跟随（星形 em 基准随字号缩放，不设自有尺寸属性，
 * button 同范式 ADR-0012）。
 *
 * IIFE 产物全局名 `AutoSparkRate`（autospark.rate.js）；双加载时序由
 * {@link installPlugin} 兜底（先于引擎加载推预加载队列，晚于引擎加载直注册）。
 */
import type { AutoSpark } from "autospark";
import { captureNamespace } from "../../../utils/namespace";
import { installPlugin } from "@autospark/utils";
import "../../base/base-field/index";
import rateTemplate from "./rate.html?raw";

/** 组件注册名（autospark. 点前缀命名空间，ADR-0094；kebab 免疫 DOM 属性名小写化） */
export const RATE_NAME = "autospark.rate";

/**
 * 插件注册体：写插件全局组件表（普通 Record 赋值即生效，无 API 门面）。
 */
function mountRatePlugin(autospark: typeof AutoSpark): void {
  autospark.components[RATE_NAME] = rateTemplate;
}

bootstrapRatePlugin();

/**
 * 双路径注册（模块加载期执行一次，经 {@link installPlugin} 单点）。
 */
function bootstrapRatePlugin(): void {
  installPlugin((autospark) => {
    captureNamespace(autospark); // 运行时桥命名空间捕获（本插件当前零符号消费，预留统一通道）
    mountRatePlugin(autospark);
  });
}

export { bootstrapRatePlugin };
