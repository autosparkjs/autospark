/**
 * autospark.statistic 组件插件（组件库 P2 展示轻件，ADR-0018 清单权威表 display 行
 * 「statistic（P2）」；归类声明见 P2 轻件合批 ADR）：经插件全局组件表注册
 * （ADR-0111 决策 5），跨 engine 真全局——晚注册立即生效，同名后注册覆盖先注册。
 *
 * 统计数值：value（number|string，number 经 Intl.NumberFormat 按语言环境格式化）/
 * precision 小数位 / grouping 千分位（groupSeparator 自定义分组符）/ prefix·suffix
 * 前后缀（props 与插槽双通道）/ title / valueStyle 数值区样式。倒计时形态不做
 * （countdown 独立件 P4，边界声明）。纯展示无事件。
 *
 * 语言环境联动（ADR-0018 决策 6 约定 1 精神）：Intl 的 locale 取全局状态
 * `$.language`（i18n 插件在场时的当前语言）——经组件域 watch 表达式订阅，语言切换
 * 即时重算；未装 i18n / `$.language` 未设置时回退 `zh` 缺省（依赖松弛不强制）。
 *
 * 元素名快速写法 `<x-statistic value="1024">` 由 engine 元素名自动组件承载
 * （ADR-0117 缺省注册 x-statistic 标签；ADR-0133 懒预编译时序缺口已由引擎编译期
 * 反查修复），静态属性折叠（数字类型推断）整体无须自持 precompile。title 经引擎
 * 编译期组件宿主豁免守卫保真进 props（tooltip title→data-tooltip 转换跳过组件宿主，
 * 引擎修复后已撤组件侧 `:title` 前置防御）。
 *
 * IIFE 产物全局名 `AutoSparkStatistic`（autospark.statistic.js）；双加载时序由
 * {@link installPlugin} 兜底（先于引擎加载推预加载队列，晚于引擎加载直注册）。
 */
import type { AutoSpark } from "autospark";
import { captureNamespace } from "../../../utils/namespace";
import { installPlugin } from "@autospark/utils";
import statisticTemplate from "./statistic.html?raw";

/** 组件注册名（autospark. 点前缀命名空间，ADR-0094；kebab 免疫 DOM 属性名小写化） */
export const STATISTIC_NAME = "autospark.statistic";

/**
 * 插件注册体：写插件全局组件表。
 */
function mountStatisticPlugin(autospark: typeof AutoSpark): void {
    autospark.components[STATISTIC_NAME] = statisticTemplate;
}

bootstrapStatisticPlugin();

/**
 * 双路径注册（模块加载期执行一次，经 {@link installPlugin} 单点）。
 */
function bootstrapStatisticPlugin(): void {
    installPlugin((autospark) => {
        captureNamespace(autospark); // 运行时桥命名空间捕获（本插件当前零符号消费，预留统一通道）
        mountStatisticPlugin(autospark);
    });
}

export { bootstrapStatisticPlugin };
