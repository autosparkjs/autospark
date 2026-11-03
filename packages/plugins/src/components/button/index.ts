/**
 * autospark.button 组件插件（@autospark/plugins ADR-0003 组件形态官方样板）：
 * 经插件全局组件表注册（ADR-0111 决策 5，`AutoSpark.components[name] = 模板字符串`），
 * 跨 engine 真全局——晚注册立即生效，同名后注册覆盖先注册。
 *
 * 查找链语义（engine `_resolveGlobalComponent`）：`scope 局部 → options.components →
 * 本表 → builtinComponents`——业务侧 `options.components` 同名声明优先级高于本表，
 * 覆盖通道完好（button 无继承家族，无 notifications 那样的 per-engine 种子诉求）。
 *
 * 模板自包含：`<script setup>`（形态/语义色/图标/加载/勾选/tags 等 props 与 mounted
 * 同步）+ `<style global>`（CSS 变量主题化）随模板整体注册，无独立样式交付通道。
 *
 * IIFE 产物全局名 `AutoSparkButton`（autospark.button.js）；双加载时序由
 * {@link installPlugin} 兜底（先于引擎加载推预加载队列，晚于引擎加载直注册）。
 */
import type { AutoSpark } from "autospark";
import { captureNamespace } from "../../utils/namespace";
import { installPlugin } from "@autospark/utils";
import buttonTemplate from "./button.html?raw";

/** 组件注册名（autospark. 点前缀命名空间，ADR-0094） */
export const BUTTON_NAME = "autospark.button";

/**
 * 静态属性值类型推断（对齐引擎元素名形态 ADR-0117 的推断规则）：
 * 数字 / true / false / 宽松 JSON（失败回退原串）/ 原样字符串。
 */
function inferPropValue(raw: string): unknown {
    const v = raw.trim();
    if (v === "") return "";
    if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
    if (v === "true") return true;
    if (v === "false") return false;
    if (v.startsWith("{") || v.startsWith("[")) {
        try {
            return JSON.parse(v);
        } catch {
            return raw;
        }
    }
    return raw;
}

/**
 * 插件注册体：写插件全局组件表（普通 Record 赋值即生效，无 API 门面）。
 *
 * 元素名快速实例化（ADR-0116 precompile DOM 预处理）：`<x-button variant="primary"
 * label="主要按钮" :value="picked">` 在 precompile 期（template 克隆前）被纯 DOM 变换为
 * `x-component` 值形态——静态属性折叠为 props 字面量（class/style/id/data-* 保留给宿主），
 * `:key="expr"` 响应式属性以原始表达式拼进值对象字面量（成员本就支持引用状态路径），
 * 子内容随迁为默认插槽。事件监听（@event）写在**外层包裹元素**上消费（组件封闭域，
 * 宿主上的表达式在组件域求值见不到外层状态）。引擎元素名形态（ADR-0117）对全局表惰性
 * 组件存在时序缺口（懒预编译由首次 x-component 消费触发，晚于 `<x-button>` 元素的首编译；
 * ready 亦晚于 autostart 编译；precompile 期 engine 内部未建不可触碰），故由插件侧以
 * DOM 变换自举。
 */
function mountButtonPlugin(autospark: typeof AutoSpark): void {
    autospark.components[BUTTON_NAME] = buttonTemplate;
    autospark.precompile?.((engine: InstanceType<typeof AutoSpark>) => {
        for (const el of Array.from(engine.el.querySelectorAll("x-button"))) {
            const btn = document.createElement("button");
            // 值对象字面量成员：静态项 JSON 序列化、表达式项裸拼（:key="expr" → "key": (expr)）
            const parts: string[] = [];
            for (const attr of Array.from(el.attributes)) {
                if (attr.name.startsWith(":")) {
                    parts.push(`${JSON.stringify(attr.name.slice(1))}: (${attr.value})`);
                    continue;
                }
                const kept =
                    attr.name === "class" ||
                    attr.name === "style" ||
                    attr.name === "id" ||
                    attr.name.startsWith("data-");
                if (kept) {
                    btn.setAttribute(attr.name, attr.value);
                    continue;
                }
                parts.push(`${JSON.stringify(attr.name)}: ${JSON.stringify(inferPropValue(attr.value))}`);
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
