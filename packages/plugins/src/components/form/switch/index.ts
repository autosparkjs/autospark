/**
 * autospark.switch 组件插件（组件库 P0 form 批轻件，ADR-0018 清单权威表 form 行 /
 * ADR-0019 合批）：经插件全局组件表注册（ADR-0111 决策 5），跨 engine 真全局——晚注册
 * 立即生效，同名后注册覆盖先注册。
 *
 * 开关（**自绘**——无原生对应，ADR-0018 决策 7 表单基座策略的例外形态）：轨道 + 滑块
 * 纯 CSS 自绘，可访问性自持——`role="switch"` + `aria-checked` + `tabindex` + 键盘
 * Space/Enter 切换（data-autospark-action 交互件通道，点击不转发焦点）。开/关双态 +
 * loading 态（滑块转 CSS 旋转圈）+ disabled。
 *
 * 继承 autospark.base-field 表单域骨架（状态色通道 / 焦点态 / disabled 同步，裸态无
 * 盒饰）——本产物以副作用导入内嵌 base-field 注册（继承链 switch → base-field →
 * autospark.base，ADR-0020），按需加载场景无须单独引入 autospark.base-field.js。
 *
 * 值通道（x-model 兼容协议）：宿主 el.value 劫持为**布尔语域**（"true"/"false"，配
 * `x-model.boolean` 类型保真）；切换派发 input（x-model 回写）+ change（detail =
 * `{ value }` 新布尔值）。表单提交 = 内嵌 `input[type=hidden]` 载体（value = 当前布尔
 * 字面串恒提交、name 透传宿主——state-button N>2 表单桥同构；disabled 时载体随禁用
 * 出表）。语义色：开态主色（status 在场随 tone 联动）、关态中性。
 *
 * 无内置文案、不接 i18n（ADR-0018 决策 1）；尺寸档位经主题 data-size 通道全跟随
 * （轨道尺寸 em 基准随字号缩放，不设自有尺寸属性，button 同范式 ADR-0012）。
 *
 * IIFE 产物全局名 `AutoSparkSwitch`（autospark.switch.js）；双加载时序由
 * {@link installPlugin} 兜底（先于引擎加载推预加载队列，晚于引擎加载直注册）。
 */
import type { AutoSpark } from "autospark";
import { captureNamespace } from "../../../utils/namespace";
import { installPlugin } from "@autospark/utils";
import "../../base/base-field/index";
import switchTemplate from "./switch.html?raw";

/** 组件注册名（autospark. 点前缀命名空间，ADR-0094；kebab 免疫 DOM 属性名小写化） */
export const SWITCH_NAME = "autospark.switch";

/**
 * 插件注册体：写插件全局组件表（普通 Record 赋值即生效，无 API 门面）。
 */
function mountSwitchPlugin(autospark: typeof AutoSpark): void {
  autospark.components[SWITCH_NAME] = switchTemplate;
}

bootstrapSwitchPlugin();

/**
 * 双路径注册（模块加载期执行一次，经 {@link installPlugin} 单点）。
 */
function bootstrapSwitchPlugin(): void {
  installPlugin((autospark) => {
    captureNamespace(autospark); // 运行时桥命名空间捕获（本插件当前零符号消费，预留统一通道）
    mountSwitchPlugin(autospark);
  });
}

export { bootstrapSwitchPlugin };
