/**
 * autospark.message-box 组件插件（组件库 P1，ADR-0018 清单权威表 feedback 行
 * 「message-box（P1）」——决策 3：notifications 的 message/notification 已覆盖通知语义，
 * message-box 入清单因其是 confirm 询问语义、非通知）：
 * 经插件全局组件表注册（ADR-0111 决策 5，`AutoSpark.components[name] = 模板字符串`），
 * 跨 engine 真全局——晚注册立即生效，同名后注册覆盖先注册。
 *
 * 确认询问对话——**x-dialog 的确认语义组合壳**（ADR-0018 决策 3 已裁，勿自建弹层）：
 * 弹层机制全由 x-dialog 指令承担（遮罩/居中/ESC/遮罩关闭/visible 回写），本组件只提供
 * 询问语义内容（type 图标 + 标题/内容 + 确认/取消双钮——确认/取消钮组合消费
 * autospark.button）。消费形态：`x-dialog:message-box="ui.visible"`（visible 走 x-dialog
 * 值通道，与 props 正交；overlay 指令属性参数句点被切为修饰符、无点号候选回溯——
 * 经无点消费别名注册，见 {@link MESSAGE_BOX_ALIAS}）；确认/取消点击广播 confirm/cancel
 * 事件（detail 空）+ action:close 信号（overlay 实例根接住走「请求关闭」链，visible
 * 自动回写闭环）。
 *
 * i18n 消费（ADR-0018 决策 6 约定 1）：confirmText/cancelText 缺省走词典
 * message-box.confirm / message-box.cancel 键——未装 i18n / 未命中回退硬编码中文
 * 「确定」「取消」（键等值判定，empty 先例）；依赖松弛不强制。
 *
 * 模板自包含：`<script setup>`（props 与动作委托）+ `<style global>`（CSS 变量主题化）
 * 随模板整体注册，无独立样式交付通道。
 *
 * IIFE 产物全局名 `AutoSparkMessageBox`（autospark.message-box.js）；双加载时序由
 * {@link installPlugin} 兜底（先于引擎加载推预加载队列，晚于引擎加载直注册）。
 */
import type { AutoSpark } from "autospark";
import { captureNamespace } from "../../../utils/namespace";
import { installPlugin } from "@autospark/utils";
import messageBoxTemplate from "./message-box.html?raw";

/** 组件注册名（autospark. 点前缀命名空间，ADR-0094；kebab 免疫 DOM 属性名小写化） */
export const MESSAGE_BOX_NAME = "autospark.message-box";

/**
 * overlay 消费别名（无点）：x-dialog 等覆盖物指令的属性参数句点段被解析器切为修饰符
 * （getDirectives splitHeadAndModifiers），且 overlay 侧无 x-component 的点号候选回溯
 * （ADR-0088 pending 修订只覆盖 x-component）——`x-dialog:autospark.message-box` 的
 * 组件名会被截断为 `autospark` 而永久 miss。本别名让消费处写 `x-dialog:message-box`
 * 即用（overlay 缺口修复后可直用全名）；用户 options.components / scope 局部同名声明
 * 优先于全局表（查找链语义），命名空间占用可控。
 */
export const MESSAGE_BOX_ALIAS = "message-box";

/**
 * 插件注册体：写插件全局组件表（普通 Record 赋值即生效，无 API 门面）——主名 +
 * overlay 消费别名双键同模板（别名原因见 {@link MESSAGE_BOX_ALIAS} 注释）。
 */
function mountMessageBoxPlugin(autospark: typeof AutoSpark): void {
    autospark.components[MESSAGE_BOX_NAME] = messageBoxTemplate;
    autospark.components[MESSAGE_BOX_ALIAS] = messageBoxTemplate;
}

bootstrapMessageBoxPlugin();

/**
 * 双路径注册（模块加载期执行一次，经 {@link installPlugin} 单点）。
 */
function bootstrapMessageBoxPlugin(): void {
    installPlugin((autospark) => {
        captureNamespace(autospark); // 运行时桥命名空间捕获（本插件当前零符号消费，预留统一通道）
        mountMessageBoxPlugin(autospark);
    });
}

export { bootstrapMessageBoxPlugin };
