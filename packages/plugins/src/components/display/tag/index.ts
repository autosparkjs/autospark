/**
 * autospark.tag 组件插件（组件库 P0，ADR-0018 清单权威表 display 行 / ADR-0019）：
 * 经插件全局组件表注册（ADR-0111 决策 5），跨 engine 真全局——晚注册立即生效，
 * 同名后注册覆盖先注册。
 *
 * 行内语义标签组件：语义色五档 + 中性档（type，对齐 button/link 范式 ADR-0012）、
 * 形态正交（variant：light 淡底 / solid 实底 / outline 描边）、前置图标（icon）、
 * 可关闭（closable：关闭钮 + close 事件，未 preventDefault 自动隐藏）。
 * 与 x-badge 指令（内容角标）正交——彼是宿主内容的角标标记，此是行内语义标签。
 *
 * 元素名快速写法 `<x-tag type="success">` 由 engine 元素名自动组件承载（ADR-0117
 * 缺省注册 x-tag 标签；ADR-0133 懒预编译时序缺口已由引擎编译期反查修复）。
 *
 * IIFE 产物全局名 `AutoSparkTag`（autospark.tag.js）；双加载时序由
 * {@link installPlugin} 兜底（先于引擎加载推预加载队列，晚于引擎加载直注册）。
 */
import type { AutoSpark } from "autospark";
import { captureNamespace } from "../../../utils/namespace";
import { installPlugin } from "@autospark/utils";
import tagTemplate from "./tag.html?raw";

/** 组件注册名（autospark. 点前缀命名空间，ADR-0094；kebab 免疫 DOM 属性名小写化） */
export const TAG_NAME = "autospark.tag";

/**
 * 插件注册体：写插件全局组件表（普通 Record 赋值即生效，无 API 门面）。
 */
function mountTagPlugin(autospark: typeof AutoSpark): void {
    autospark.components[TAG_NAME] = tagTemplate;
}

bootstrapTagPlugin();

/**
 * 双路径注册（模块加载期执行一次，经 {@link installPlugin} 单点）。
 */
function bootstrapTagPlugin(): void {
    installPlugin((autospark) => {
        captureNamespace(autospark); // 运行时桥命名空间捕获（本插件当前零符号消费，预留统一通道）
        mountTagPlugin(autospark);
    });
}

export { bootstrapTagPlugin };
