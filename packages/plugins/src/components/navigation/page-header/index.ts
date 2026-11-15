/**
 * autospark.page-header 组件插件（组件库 P2 导航件，ADR-0018 清单权威表 navigation 行）：
 * 经插件全局组件表注册（ADR-0111 决策 5），跨 engine 真全局——晚注册立即生效，
 * 同名后注册覆盖先注册。
 *
 * 页头：title / subtitle 标题对 + back 返回钮（false 缺省不渲染 / true 图标钮 /
 * 文案字符串 = 图标 + 文案），点击派发 back 冒泡事件（组件不执行 history.back——
 * router 隔离，ADR-0018 决策 6 约定 2，接管动作由消费者决定）；slots：extra
 * （右侧动作区）/ 默认（内容区）。纯结构件，无 i18n 文案（返回钮缺省图标无字，
 * aria-label 以文案或标题自描述）。
 *
 * 返回钮为自绘轻量图标钮（不嵌套消费 autospark.button——保按需加载自包含，
 * 单一钮的盒饰成本低于跨产物依赖）。
 *
 * IIFE 产物全局名 `AutoSparkPageHeader`（autospark.page-header.js）；双加载时序由
 * {@link installPlugin} 兜底（先于引擎加载推预加载队列，晚于引擎加载直注册）。
 */
import type { AutoSpark } from "autospark";
import { captureNamespace } from "../../../utils/namespace";
import { installPlugin } from "@autospark/utils";
import pageHeaderTemplate from "./page-header.html?raw";

/** 组件注册名（autospark. 点前缀命名空间，ADR-0094；kebab 免疫 DOM 属性名小写化——注册名/产物/目录三对齐 kebab） */
export const PAGE_HEADER_NAME = "autospark.page-header";

/**
 * 插件注册体：写插件全局组件表（普通 Record 赋值即生效，无 API 门面）。
 */
function mountPageHeaderPlugin(autospark: typeof AutoSpark): void {
    autospark.components[PAGE_HEADER_NAME] = pageHeaderTemplate;
}

bootstrapPageHeaderPlugin();

/**
 * 双路径注册（模块加载期执行一次，经 {@link installPlugin} 单点）。
 */
function bootstrapPageHeaderPlugin(): void {
    installPlugin((autospark) => {
        captureNamespace(autospark); // 运行时桥命名空间捕获（本插件当前零符号消费，预留统一通道）
        mountPageHeaderPlugin(autospark);
    });
}

export { bootstrapPageHeaderPlugin };
