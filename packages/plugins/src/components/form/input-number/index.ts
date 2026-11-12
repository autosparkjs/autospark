/**
 * autospark.input-number 组件插件（组件库 P1 批 form 轻件，ADR-0018 清单权威表
 * form 行）：经插件全局组件表注册（ADR-0111 决策 5），跨 engine 真全局——晚注册
 * 立即生效，同名后注册覆盖先注册。
 *
 * 数字输入框（原生增强路线，ADR-0018 决策 7）：真实原生 input（inputmode=decimal）
 * + 盒饰包裹 + 步进钮组（上/下，自绘 chevron 图标钮）。**复制 input 结构而非嵌套
 * 消费 autospark.input**：①值桥语域分叉——input 是 string 语域、本组件是 number
 * 语域（NaN 防御 / min·max 夹取 / precision 修约），两层劫持嵌套会让中间态输入
 * 被外层夹取破坏；②嵌套消费引入跨插件产物依赖，破坏按需加载自包含；③共享面
 * （盒饰 chrome / 状态色 / 焦点态 / disabled 同步）已由 base-field 骨架继承覆盖。
 * 继承 autospark.base-field（ADR-0020）——本产物以副作用导入内嵌 base-field
 * 注册（继承链 input-number → base-field → autospark.base），按需加载场景无须
 * 单独引入 autospark.base-field.js。
 *
 * 值通道（x-model 兼容协议）：宿主 el.value 劫持为数字语域（""=空）；输入过程
 * 自由中间态（"1." / "-" 等，capture 先于 x-model 冒泡监听更新缓存），change
 * （blur/Enter）归位——夹取 + 修约 + 规范文本 + 重派发 detail={ value }。步进
 * 钮 / ArrowUp·ArrowDown 键盘步进同语义。无内置文案、不接 i18n（ADR-0018 决策 1）；
 * 尺寸档位经主题 data-size 通道全跟随（不设自有尺寸属性，button 同范式 ADR-0012）。
 *
 * IIFE 产物全局名 `AutoSparkInputNumber`（autospark.input-number.js）；双加载时序
 * 由 {@link installPlugin} 兜底（先于引擎加载推预加载队列，晚于引擎加载直注册）。
 */
import type { AutoSpark } from "autospark";
import { captureNamespace } from "../../../utils/namespace";
import { installPlugin } from "@autospark/utils";
import "../../base/base-field/index";
import inputNumberTemplate from "./input-number.html?raw";

/** 组件注册名（autospark. 点前缀命名空间，ADR-0094；kebab 免疫 DOM 属性名小写化） */
export const INPUT_NUMBER_NAME = "autospark.input-number";

/**
 * 插件注册体：写插件全局组件表（普通 Record 赋值即生效，无 API 门面）。
 */
function mountInputNumberPlugin(autospark: typeof AutoSpark): void {
  autospark.components[INPUT_NUMBER_NAME] = inputNumberTemplate;
}

bootstrapInputNumberPlugin();

/**
 * 双路径注册（模块加载期执行一次，经 {@link installPlugin} 单点）。
 */
function bootstrapInputNumberPlugin(): void {
  installPlugin((autospark) => {
    captureNamespace(autospark); // 运行时桥命名空间捕获（本插件当前零符号消费，预留统一通道）
    mountInputNumberPlugin(autospark);
  });
}

export { bootstrapInputNumberPlugin };
