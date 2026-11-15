/**
 * autospark.transfer 组件插件（组件库 P3 form 批重件，ADR-0018 清单权威表 form 行 /
 * ADR-0028）：经插件全局组件表注册（ADR-0111 决策 5），跨 engine 真全局——晚注册立即
 * 生效，同名后注册覆盖先注册。
 *
 * 穿梭框（双列表 + 中间穿梭钮，ADR-0028）：列表区**复制** list 结构（视觉同源经 CSS
 * 变量达成，非嵌套消费——结构四段不同构，见 ADR-0028 决策 1）；复选项**组合**
 * autospark.checkbox（table 行选择先例直承：checked props 整体替换驱动重求值 + @change
 * 事件通道回传）；穿梭钮自绘原生 button（button 同档视觉）。继承 autospark.base 取主题
 * 档位（复合控件不继承 field——无盒饰/焦点环语义面，disabled 自持，ADR-0028 决策 2）。
 *
 * 本产物以副作用导入内嵌 checkbox 注册（checkbox 是硬依赖非可选，对照 table 的可选
 * 依赖不内嵌）——继承链附带 field 注册；**无跨产物运行时依赖**，单独引入即用。
 *
 * 值通道（x-model 兼容协议，ADR-0028 决策 3）：宿主 el.value 劫持为**数组语域**
 * （目标侧 key 数组，value 顺序恒为 data 声明序）；穿梭/清空路径派发 input（非冒泡，
 * x-model 回写）+ change（冒泡 detail={ value }，外层消费）；内嵌 input[type=hidden]
 * 载体 value = key 逗号拼接（表单提交字符串域）、name 透传、禁用出表。
 *
 * 内置文案三条走 i18n 词典（transfer.search / transfer.total / transfer.empty，回退
 * 硬编码中文，ADR-0018 决策 6 约定 1）；尺寸档位经主题 data-size 通道全跟随（em 基准，
 * button 同范式 ADR-0012）。
 *
 * IIFE 产物全局名 `AutoSparkTransfer`（autospark.transfer.js）；双加载时序由
 * {@link installPlugin} 兜底（先于引擎加载推预加载队列，晚于引擎加载直注册）。
 */
import type { AutoSpark } from "autospark";
import { captureNamespace } from "../../../utils/namespace";
import { installPlugin } from "@autospark/utils";
import "../checkbox/index";
import transferTemplate from "./transfer.html?raw";

/** 组件注册名（autospark. 点前缀命名空间，ADR-0094；kebab 免疫 DOM 属性名小写化） */
export const TRANSFER_NAME = "autospark.transfer";

/**
 * 插件注册体：写插件全局组件表（普通 Record 赋值即生效，无 API 门面）。
 */
function mountTransferPlugin(autospark: typeof AutoSpark): void {
  autospark.components[TRANSFER_NAME] = transferTemplate;
}

bootstrapTransferPlugin();

/**
 * 双路径注册（模块加载期执行一次，经 {@link installPlugin} 单点）。
 */
function bootstrapTransferPlugin(): void {
  installPlugin((autospark) => {
    captureNamespace(autospark); // 运行时桥命名空间捕获（本插件当前零符号消费，预留统一通道）
    mountTransferPlugin(autospark);
  });
}

export { bootstrapTransferPlugin };
