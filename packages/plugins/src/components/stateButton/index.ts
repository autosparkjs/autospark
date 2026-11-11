/**
 * autospark.state-button 组件插件（ADR-0016 继承骨架 + 机制自治）：
 * 经插件全局组件表注册（ADR-0111 决策 5），`x-define:inherit="autospark.button"`
 * 复用纯按钮视觉骨架，状态机制（2-N 态循环切换 / decorate 装饰 / 灰色无匹配态 /
 * 表单桥）自持于模板的 setup 与 styles。
 *
 * **产物依赖**：autospark.state-button.js 须与 autospark.button.js 同页加载
 * （继承解析查父——未加载时 warn + 组件注册失败，ADR-0081 fail-fast）；或直接用
 * 聚合产物 autospark.plugins.js（天然成对）。
 *
 * 元素名快速写法 `<x-state-button states="...">`：precompile DOM 变换复用 button
 * 范式（宿主替换为真 button 元素——button 原生语义是表单桥与键盘激活的前提）。
 *
 * IIFE 产物全局名 `AutoSparkStateButton`（autospark.state-button.js）；双加载时序
 * 由 {@link installPlugin} 兜底。
 */
import type { AutoSpark } from "autospark";
import { captureNamespace } from "../../utils/namespace";
import { installPlugin } from "@autospark/utils";
import { kebabToCamel } from "../../utils/kebabToCamel";
import { propKey } from "../../utils/propKey";
import { inferPropValue } from "../../utils/inferPropValue";
import stateButtonTemplate from "./state-button.html?raw";

/** 组件注册名（autospark. 点前缀命名空间，ADR-0094；kebab 免疫 DOM 属性名小写化） */
export const STATE_BUTTON_NAME = "autospark.state-button";

/**
 * 插件注册体：写插件全局组件表（普通 Record 赋值即生效，无 API 门面）。
 *
 * precompile 变换（与 button 同款折叠规则）：静态属性折叠为 props 字面量（类型
 * 推断）、`:key="expr"` 响应式项以原始表达式拼进值对象字面量，class/style/id/
 * data-* 保留给宿主，子内容随迁为默认插槽，name 属性透传（表单提交载体）。
 */
function mountStateButtonPlugin(autospark: typeof AutoSpark): void {
    autospark.components[STATE_BUTTON_NAME] = stateButtonTemplate;
    autospark.precompile?.((engine: InstanceType<typeof AutoSpark>) => {
        for (const el of Array.from(engine.el.querySelectorAll("x-state-button"))) {
            const btn = document.createElement("button");
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
                    attr.name === "title" ||
                    attr.name.startsWith("data-") ||
                    attr.name.startsWith("x-") ||
                    attr.name.startsWith("@");
                if (kept) {
                    btn.setAttribute(attr.name, attr.value);
                    continue;
                }
                parts.push(`${propKey(kebabToCamel(attr.name))}: ${JSON.stringify(inferPropValue(attr.value))}`);
            }
            btn.setAttribute(`x-component:${STATE_BUTTON_NAME}`, `{ ${parts.join(", ")} }`);
            while (el.firstChild) btn.appendChild(el.firstChild);
            el.replaceWith(btn);
        }
    });
}

bootstrapStateButtonPlugin();

/**
 * 双路径注册（模块加载期执行一次，经 {@link installPlugin} 单点）。
 */
function bootstrapStateButtonPlugin(): void {
    installPlugin((autospark) => {
        captureNamespace(autospark); // 运行时桥命名空间捕获（预留统一通道）
        mountStateButtonPlugin(autospark);
    });
}

export { bootstrapStateButtonPlugin };
