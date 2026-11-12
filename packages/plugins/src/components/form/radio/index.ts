/**
 * autospark.radio 组件插件（组件库 P0 form 批轻件，ADR-0018 清单权威表 form 行 /
 * ADR-0019 合批）：经插件全局组件表注册（ADR-0111 决策 5），跨 engine 真全局——晚注册
 * 立即生效，同名后注册覆盖先注册。
 *
 * 单选钮（原生增强路线，ADR-0018 决策 7）：真实原生 `<input type="radio">` + 自绘视觉
 * （选中圆点 CSS，选中态经 `:checked` 原生伪类驱动）。**组语义走原生 name 同名互斥**
 * （不建组容器组件）：同 x-model 路径的多枚实例经引擎缺省 name 注入（name=路径）天然
 * 同组，或显式写 name 属性——组样式编排用 space 组件 / flex 容器配方（组件文档给出）。
 *
 * 继承 autospark.base-field 表单域骨架（状态色通道 / 焦点态 / disabled 同步，裸态无盒饰）
 * ——本产物以副作用导入内嵌 base-field 注册（继承链 radio → base-field →
 * autospark.base，ADR-0020），按需加载场景无须单独引入 autospark.base-field.js。
 *
 * 值通道（x-model 兼容协议）：宿主 el.value 劫持为 checked 值桥——读 = 本钮 value
 * （勾选时派发 input，x-model 写 state = 本钮值；取消态不派发，被勾选的另一枚接管——
 * 与 x-model 原生 radio 语义同构）；写 = 按值匹配勾选（state === 本钮 value）。表单
 * 提交 = 原生直提交（内层真 input 即提交载体：组内勾选项提交 name=value）。
 *
 * 无内置文案、不接 i18n（ADR-0018 决策 1）；尺寸档位经主题 data-size 通道全跟随
 * （box 尺寸 em 基准随字号缩放，不设自有尺寸属性，button 同范式 ADR-0012）。
 *
 * IIFE 产物全局名 `AutoSparkRadio`（autospark.radio.js）；双加载时序由
 * {@link installPlugin} 兜底（先于引擎加载推预加载队列，晚于引擎加载直注册）。
 */
import type { AutoSpark } from "autospark";
import { captureNamespace } from "../../../utils/namespace";
import { installPlugin } from "@autospark/utils";
import "../../base/base-field/index";
import radioTemplate from "./radio.html?raw";

/** 组件注册名（autospark. 点前缀命名空间，ADR-0094；kebab 免疫 DOM 属性名小写化） */
export const RADIO_NAME = "autospark.radio";

/**
 * 插件注册体：写插件全局组件表（普通 Record 赋值即生效，无 API 门面）。
 */
function mountRadioPlugin(autospark: typeof AutoSpark): void {
  autospark.components[RADIO_NAME] = radioTemplate;
}

bootstrapRadioPlugin();

/**
 * 双路径注册（模块加载期执行一次，经 {@link installPlugin} 单点）。
 */
function bootstrapRadioPlugin(): void {
  installPlugin((autospark) => {
    captureNamespace(autospark); // 运行时桥命名空间捕获（本插件当前零符号消费，预留统一通道）
    mountRadioPlugin(autospark);
  });
}

export { bootstrapRadioPlugin };
