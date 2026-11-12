/**
 * autospark.text 组件插件（组件库 P0 轻件，ADR-0018 清单权威表 general 行 / ADR-0019）：
 * 经插件全局组件表注册（ADR-0111 决策 5，`AutoSpark.components[name] = 模板字符串`），
 * 跨 engine 真全局——晚注册立即生效，同名后注册覆盖先注册。
 *
 * 排版文本组件：层级/语义色（type）、加粗（strong）、溢出省略（ellipsis 单行省略号 /
 * 多行 line-clamp）、复制（copyable，navigator.clipboard + 成功反馈）。无内置文案、
 * 不接 i18n（ADR-0018 决策 1 备注——copyable 反馈走图标而非文案）；字号档位经主题
 * 通道 data-size 全跟随（不设自有字号属性，button 同范式 ADR-0012）。
 *
 * 模板自包含：`<script setup>`（props 与 mounted 同步）+ `<style global>`（CSS 变量
 * 主题化）随模板整体注册，无独立样式交付通道。
 *
 * IIFE 产物全局名 `AutoSparkText`（autospark.text.js）；双加载时序由
 * {@link installPlugin} 兜底（先于引擎加载推预加载队列，晚于引擎加载直注册）。
 */
import type { AutoSpark } from "autospark";
import { captureNamespace } from "../../../utils/namespace";
import { installPlugin } from "@autospark/utils";
import textTemplate from "./text.html?raw";

/** 组件注册名（autospark. 点前缀命名空间，ADR-0094；kebab 免疫 DOM 属性名小写化） */
export const TEXT_NAME = "autospark.text";

/**
 * 插件注册体：写插件全局组件表（普通 Record 赋值即生效，无 API 门面）。
 */
function mountTextPlugin(autospark: typeof AutoSpark): void {
    autospark.components[TEXT_NAME] = textTemplate;
}

bootstrapTextPlugin();

/**
 * 双路径注册（模块加载期执行一次，经 {@link installPlugin} 单点）。
 */
function bootstrapTextPlugin(): void {
    installPlugin((autospark) => {
        captureNamespace(autospark); // 运行时桥命名空间捕获（本插件当前零符号消费，预留统一通道）
        mountTextPlugin(autospark);
    });
}

export { bootstrapTextPlugin };
