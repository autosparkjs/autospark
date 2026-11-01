/**
 * autospark.tag 组件插件（@autospark/plugins ADR-0003 组件形态）：列表 / 卡片里的
 * 状态标记。经插件全局组件表注册（ADR-0111 决策 5，`AutoSpark.components[name] =
 * 模板字符串`），跨 engine 真全局——晚注册立即生效，同名后注册覆盖先注册。
 *
 * 查找链语义（engine `_resolveGlobalComponent`）：`scope 局部 → options.components →
 * 本表 → builtinComponents`——业务侧 `options.components` 同名声明优先级高于本表，
 * 覆盖通道完好（tag 无继承家族，无 notifications 那样的 per-engine 种子诉求）。
 *
 * 能力面（props 单向注入组件 data 域）：
 * - `type`：语义色变体 default（中性淡底，缺省）/ primary / success / danger / warning / info；
 * - `size`：三档尺寸 sm / md（缺省）/ lg；
 * - `closable`：渲染 × 关闭钮——点击先派发组件事件 `close`（ADR-0117，宿主 / 祖先经
 *   `@close` 监听同步业务状态），再从 DOM 移除标签；
 * - `label`：默认插槽兜底文案（宿主裸子节点提供内容时被覆盖）。
 *
 * 模板自包含：`<script setup>`（type/size/closable/label 状态与 close 方法）+
 * `<style global>`（CSS 变量主题化）随模板整体注册，无独立样式交付通道。
 *
 * IIFE 产物消费契约文件名 `autospark.tag.js`；双加载时序由 {@link installPlugin}
 * 兜底（先于引擎加载推预加载队列，晚于引擎加载直注册）。
 */
import type { AutoSpark } from "autospark";
import { captureNamespace } from "../../utils/namespace";
import { installPlugin } from "@autospark/utils";
import tagTemplate from "./tag.html?raw";

/** 组件注册名（autospark. 点前缀命名空间，ADR-0094） */
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
