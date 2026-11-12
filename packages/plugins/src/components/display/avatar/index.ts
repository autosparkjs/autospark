/**
 * autospark.avatar 组件插件（组件库 P1，ADR-0018 清单权威表 display 行「avatar（P1）」）：
 * 经插件全局组件表注册（ADR-0111 决策 5），跨 engine 真全局——晚注册立即生效，
 * 同名后注册覆盖先注册。
 *
 * 头像组件：src（图片，加载失败自动回退）/ icon（x-icon 内置图标回退）/ label（首字符
 * 回退源，兼职 alt）三源优先级链 + shape（circle 缺省 / square）。尺寸无自有属性——
 * em 基准随 theme 手动通道 data-size 档位全跟随（tag 同范式）；角标不内建，经 x-badge
 * 指令外挂组合（文档配方，ADR-0018 决策 3「指令即终态」边界）。
 *
 * 元素名快速写法 `<x-avatar label="...">` 由 engine 元素名自动组件承载（ADR-0117
 * 缺省注册 x-avatar 标签）；span 根无原生语义损失，不做 precompile 变换（ADR-0019
 * link 判据）。
 *
 * IIFE 产物全局名 `AutoSparkAvatar`（autospark.avatar.js）；双加载时序由
 * {@link installPlugin} 兜底（先于引擎加载推预加载队列，晚于引擎加载直注册）。
 */
import type { AutoSpark } from "autospark";
import { captureNamespace } from "../../../utils/namespace";
import { installPlugin } from "@autospark/utils";
import avatarTemplate from "./avatar.html?raw";

/** 组件注册名（autospark. 点前缀命名空间，ADR-0094；kebab 免疫 DOM 属性名小写化） */
export const AVATAR_NAME = "autospark.avatar";

/**
 * 插件注册体：写插件全局组件表（普通 Record 赋值即生效，无 API 门面）。
 */
function mountAvatarPlugin(autospark: typeof AutoSpark): void {
    autospark.components[AVATAR_NAME] = avatarTemplate;
}

bootstrapAvatarPlugin();

/**
 * 双路径注册（模块加载期执行一次，经 {@link installPlugin} 单点）。
 */
function bootstrapAvatarPlugin(): void {
    installPlugin((autospark) => {
        captureNamespace(autospark); // 运行时桥命名空间捕获（本插件当前零符号消费，预留统一通道）
        mountAvatarPlugin(autospark);
    });
}

export { bootstrapAvatarPlugin };
