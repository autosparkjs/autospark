/**
 * autospark.checkbox 组件插件（组件库 P0 form 批轻件，ADR-0018 清单权威表 form 行 /
 * ADR-0019 合批）：经插件全局组件表注册（ADR-0111 决策 5），跨 engine 真全局——晚注册
 * 立即生效，同名后注册覆盖先注册。
 *
 * 复选框（原生增强路线，ADR-0018 决策 7）：真实原生 `<input type="checkbox">` + 自绘
 * 视觉（勾形 / 半选横线 CSS，选中态经 `:checked` / `:indeterminate` 原生伪类驱动）。
 * 继承 autospark.base-field 表单域骨架（状态色通道 / 焦点态 / disabled 同步，裸态无盒饰）
 * ——本产物以副作用导入内嵌 base-field 注册（继承链 checkbox → base-field →
 * autospark.base，ADR-0020），按需加载场景无须单独引入 autospark.base-field.js。
 *
 * 值通道（x-model 兼容协议）：宿主 el.value 劫持为**布尔语域**（"true"/"false"，配
 * `x-model.boolean` 类型保真——state-button 布尔组桥同款惯用法）；原生 change 冒泡过
 * 宿主时派发 input 驱动 x-model 回写。表单提交 = 原生直提交（内层真 input 即天然提交
 * 载体：勾选时提交 name=true、未勾选不提交）。indeterminate 半选态走 JS 通道设原生
 * indeterminate 属性（该属性无 HTML 属性形态）。
 *
 * 无内置文案、不接 i18n（ADR-0018 决策 1）；尺寸档位经主题 data-size 通道全跟随
 * （box 尺寸 em 基准随字号缩放，不设自有尺寸属性，button 同范式 ADR-0012）。
 *
 * IIFE 产物全局名 `AutoSparkCheckbox`（autospark.checkbox.js）；双加载时序由
 * {@link installPlugin} 兜底（先于引擎加载推预加载队列，晚于引擎加载直注册）。
 */
import type { AutoSpark } from "autospark";
import { captureNamespace } from "../../../utils/namespace";
import { installPlugin } from "@autospark/utils";
import "../../base/base-field/index";
import checkboxTemplate from "./checkbox.html?raw";

/** 组件注册名（autospark. 点前缀命名空间，ADR-0094；kebab 免疫 DOM 属性名小写化） */
export const CHECKBOX_NAME = "autospark.checkbox";

/**
 * 插件注册体：写插件全局组件表（普通 Record 赋值即生效，无 API 门面）。
 */
function mountCheckboxPlugin(autospark: typeof AutoSpark): void {
  autospark.components[CHECKBOX_NAME] = checkboxTemplate;
}

bootstrapCheckboxPlugin();

/**
 * 双路径注册（模块加载期执行一次，经 {@link installPlugin} 单点）。
 */
function bootstrapCheckboxPlugin(): void {
  installPlugin((autospark) => {
    captureNamespace(autospark); // 运行时桥命名空间捕获（本插件当前零符号消费，预留统一通道）
    mountCheckboxPlugin(autospark);
  });
}

export { bootstrapCheckboxPlugin };
