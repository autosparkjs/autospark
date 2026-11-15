/**
 * autospark.countdown 组件插件（组件库 P4 other 分类，ADR-0018 清单权威表 other 行
 * 「countdown（P4）」；语域/计时引擎取舍见 ADR-0031）：经插件全局组件表注册
 * （ADR-0111 决策 5），跨 engine 真全局——晚注册立即生效，同名后注册覆盖先注册。
 *
 * 倒计时：time（毫秒时长，变化即重启新一轮——绝对时刻场景表达式
 * `:time="deadline - Date.now()"` 可达）+ format token 模板（{d}{h}{m}{s}，缺省
 * "{h}:{m}:{s}" 时:分:秒观感）。计时引擎 = 递归 setTimeout + 绝对 deadline 真值
 * （tick 只触发重渲染不累积误差；整秒边界对齐；后台节流免疫——visibilitychange
 * 回页仅补一次重算/finish）。归零一次性派发 finish（detail 空）。样式复用 statistic
 * 的数值排版语言（tabular-nums + 1.5em 大字重）——与 statistic 的边界：statistic
 * 是静态数值展示（Intl 格式化），countdown 是时间衰减动态组件，正交（ADR-0024
 * statistic 边界声明的承接）。
 *
 * 元素名快速写法 `<x-countdown :time="60000">` 由 engine 元素名自动组件承载
 * （ADR-0117 缺省注册 x-countdown 标签，:expr 响应式条目引擎折叠），本插件无须
 * 自持 precompile 变换（无 x-countdown 指令撞名、无宿主级特殊属性转移需求）。
 *
 * IIFE 产物全局名 `AutoSparkCountdown`（autospark.countdown.js）；双加载时序由
 * {@link installPlugin} 兜底（先于引擎加载推预加载队列，晚于引擎加载直注册）。
 */
import type { AutoSpark } from "autospark";
import { captureNamespace } from "../../../utils/namespace";
import { installPlugin } from "@autospark/utils";
import countdownTemplate from "./countdown.html?raw";

/** 组件注册名（autospark. 点前缀命名空间，ADR-0094；kebab 免疫 DOM 属性名小写化） */
export const COUNTDOWN_NAME = "autospark.countdown";

/**
 * 插件注册体：写插件全局组件表（普通 Record 赋值即生效，无 API 门面）。
 */
function mountCountdownPlugin(autospark: typeof AutoSpark): void {
  autospark.components[COUNTDOWN_NAME] = countdownTemplate;
}

bootstrapCountdownPlugin();

/**
 * 双路径注册（模块加载期执行一次，经 {@link installPlugin} 单点）。
 */
function bootstrapCountdownPlugin(): void {
  installPlugin((autospark) => {
    captureNamespace(autospark); // 运行时桥命名空间捕获（本插件当前零符号消费，预留统一通道）
    mountCountdownPlugin(autospark);
  });
}

export { bootstrapCountdownPlugin };
