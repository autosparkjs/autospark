/**
 * autospark.button 组件插件（@autospark/plugins ADR-0003 组件形态官方样板）：
 * 经插件全局组件表注册（ADR-0111 决策 5，`AutoSpark.components[name] = 模板字符串`），
 * 跨 engine 真全局——晚注册立即生效，同名后注册覆盖先注册。
 *
 * 查找链语义（engine `_resolveGlobalComponent`）：`scope 局部 → options.components →
 * 本表 → builtinComponents`——业务侧 `options.components` 同名声明优先级高于本表，
 * 覆盖通道完好（button 无继承家族，无 notifications 那样的 per-engine 种子诉求）。
 *
 * 元素名快速写法（precompile DOM 变换，2026-11-06 恢复）：`<x-button variant="primary"
 * label="...">` 在 precompile 期（template 克隆前）被纯 DOM 变换为 `x-component` 值形态
 * （宿主替换为真 button 元素）。引擎 ADR-0133 元素名通道的化身**复用 x-button 宿主
 * （HTMLUnknownElement）**——button 原生语义全丢（disabled / loading 禁点 / el.value
 * （state-button 表单桥前提，ADR-0016）/ 表单提交 / Enter+Space 键盘激活），实测全面回归，
 * 故恢复本变换止血；ADR-0133 让位条款（同元素显式 x-component 声明则元素名指令让位）
 * 与之兼容。引擎侧「宿主替换为组件根标签」正确化后本变换可再退役。
 *
 * 模板自包含：`<script setup>`（形态/语义色/图标/加载/tags 等 props 与 mounted
 * 同步）+ `<style global>`（CSS 变量主题化）随模板整体注册，无独立样式交付通道。
 *
 * IIFE 产物全局名 `AutoSparkButton`（autospark.button.js）；双加载时序由
 * {@link installPlugin} 兜底（先于引擎加载推预加载队列，晚于引擎加载直注册）。
 */
import type { AutoSpark } from "autospark";
import { captureNamespace } from "../../utils/namespace";
import { installPlugin } from "@autospark/utils";
import { kebabToCamel } from "../../utils/kebabToCamel";
import { propKey } from "../../utils/propKey";
import { inferPropValue } from "../../utils/inferPropValue";
import buttonTemplate from "./button.html?raw";

/** 组件注册名（autospark. 点前缀命名空间，ADR-0094） */
export const BUTTON_NAME = "autospark.button";

/**
 * 插件注册体：写插件全局组件表（普通 Record 赋值即生效，无 API 门面）。
 *
 * precompile 变换：静态属性折叠为 props 字面量（类型推断）、`:key="expr"` 响应式项以
 * 原始表达式拼进值对象字面量（成员本就支持引用状态路径），class/style/id/data-* 保留
 * 给宿主，子内容随迁为默认插槽，name 属性透传（state-button 表单提交载体，ADR-0016）。
 */
function mountButtonPlugin(autospark: typeof AutoSpark): void {
    autospark.components[BUTTON_NAME] = buttonTemplate;
    autospark.precompile?.((engine: InstanceType<typeof AutoSpark>) => {
        for (const el of Array.from(engine.el.querySelectorAll("x-button"))) {
            const btn = document.createElement("button");
            // props 字面量键用裸标识符形态（引擎值解析对「引号键 + 表达式值」组合的成员求值会
            // 静默丢弃——实测 { "checkValues": (cv) } 丢、{ checkValues: (cv) } 注入成功）；
            // 属性名 kebab-case 归一为 camelCase（HTML 属性名被 DOM 全量小写化，label-pos → labelPos）
            const parts: string[] = [];
            for (const attr of Array.from(el.attributes)) {
                if (attr.name.startsWith(":")) {
                    parts.push(`${propKey(kebabToCamel(attr.name.slice(1)))}: (${attr.value})`);
                    continue;
                }
                const kept =
                    attr.name === "class" ||
                    attr.name === "style" ||
                    attr.name === "id" ||
                    attr.name === "name" ||
                    attr.name === "title" || // HTML 全局提示属性——保留给宿主（labelPos none / 溢出双轨挂载的「显式提示优先」判定读它）
                    attr.name.startsWith("data-") ||
                    attr.name.startsWith("x-") || // 指令/选项族（x-model、x-on 等）留给引擎编译消费
                    attr.name.startsWith("@"); // 事件绑定（注意：宿主化身封闭域求值，外层状态事件仍应写包裹元素）
                if (kept) {
                    btn.setAttribute(attr.name, attr.value);
                    continue;
                }
                parts.push(`${propKey(kebabToCamel(attr.name))}: ${JSON.stringify(inferPropValue(attr.value))}`);
            }
            btn.setAttribute(`x-component:${BUTTON_NAME}`, `{ ${parts.join(", ")} }`);
            while (el.firstChild) btn.appendChild(el.firstChild);
            el.replaceWith(btn);
        }
    });
}

bootstrapButtonPlugin();

/**
 * 双路径注册（模块加载期执行一次，经 {@link installPlugin} 单点）。
 */
function bootstrapButtonPlugin(): void {
    installPlugin((autospark) => {
        captureNamespace(autospark); // 运行时桥命名空间捕获（本插件当前零符号消费，预留统一通道）
        mountButtonPlugin(autospark);
    });
}

export { bootstrapButtonPlugin };

