/**
 * autospark.slider 组件插件（组件库 P1 批 form 轻件，ADR-0018 清单权威表 form 行）：
 * 经插件全局组件表注册（ADR-0111 决策 5），跨 engine 真全局——晚注册立即生效，
 * 同名后注册覆盖先注册。
 *
 * 滑动条（原生增强路线，ADR-0018 决策 7）：真实原生 `<input type=range>` 藏起仍可
 * 交互（opacity:0 覆盖层模式——点击/拖拽/键盘/触屏原生行为全保留），轨道 / 已填充
 * 段 / 滑块视觉自绘（百分比经 CSS 变量 --asc-slider-pos 驱动）。继承
 * autospark.base-field 表单域骨架（状态色通道 / 焦点态 / disabled 同步，裸态无盒饰）
 * ——本产物以副作用导入内嵌 base-field 注册（继承链 slider → base-field →
 * autospark.base，ADR-0020），按需加载场景无须单独引入 autospark.base-field.js。
 *
 * 值通道（x-model 兼容协议）：宿主 el.value 劫持为数字语域——原生 input 事件自然
 * 冒泡过宿主被 x-model 直接监听（无须手动派发）；change（松手）capture 归位后阻断
 * 重派发 detail={ value }。showInput 联动 input-number 为跨产物组合（模板字符串
 * 引用不构成构建依赖，按需加载场景须同引 autospark.input-number.js，聚合产物无此
 * 问题）。range 双滑块 P3 按需（ADR-0018 边界声明）。
 *
 * 无内置文案、不接 i18n（ADR-0018 决策 1）；尺寸档位经主题 data-size 通道全跟随
 * （em 基准随字号缩放，不设自有尺寸属性，button 同范式 ADR-0012）。
 *
 * IIFE 产物全局名 `AutoSparkSlider`（autospark.slider.js）；双加载时序由
 * {@link installPlugin} 兜底（先于引擎加载推预加载队列，晚于引擎加载直注册）。
 */
import type { AutoSpark } from "autospark";
import { captureNamespace } from "../../../utils/namespace";
import { installPlugin } from "@autospark/utils";
import "../../base/base-field/index";
import sliderTemplate from "./slider.html?raw";

/** 组件注册名（autospark. 点前缀命名空间，ADR-0094；kebab 免疫 DOM 属性名小写化） */
export const SLIDER_NAME = "autospark.slider";

/**
 * 插件注册体：写插件全局组件表（普通 Record 赋值即生效，无 API 门面）。
 */
function mountSliderPlugin(autospark: typeof AutoSpark): void {
  autospark.components[SLIDER_NAME] = sliderTemplate;
}

bootstrapSliderPlugin();

/**
 * 双路径注册（模块加载期执行一次，经 {@link installPlugin} 单点）。
 */
function bootstrapSliderPlugin(): void {
  installPlugin((autospark) => {
    captureNamespace(autospark); // 运行时桥命名空间捕获（本插件当前零符号消费，预留统一通道）
    mountSliderPlugin(autospark);
  });
}

export { bootstrapSliderPlugin };
