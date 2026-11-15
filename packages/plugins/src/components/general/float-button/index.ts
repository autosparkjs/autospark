/**
 * autospark.float-button 组件插件（组件库 P3 other 分类首件，ADR-0018 清单权威表
 * other 行 / 修订吸收原 backtop 独立条目为 back-to-top 形态——antd 5 同款路线 /
 * ADR-0029 轻件对 ADR）：悬浮按钮——fixed 右下悬浮钮；type 双形态（default 常规
 * icon 必选 + click 原生冒泡事件出口 | back-to-top 滚动超 visibilityHeight 阈值
 * 渐显 + 点击回顶）；shape 双形状（circle 缺省 / square）；right/bottom 定位偏移；
 * reduced-motion 停播过渡。组形态（group 多钮展开菜）为 P4 增补面（ADR-0029 声明）。
 *
 * 元素名快速写法 `<x-float-button>` 由本文件的 precompile DOM 变换承载（link 止血
 * 路线 ADR-0133，button 语义保真——宿主替换为真 button 且固定 type="button"，防
 * 表单内默认 submit 误触）：
 * - 静态属性折叠为 props 字面量（类型推断；裸属性按 HTML 语义归一 true）、`:key="expr"`
 *   响应式项以原始表达式拼进值对象字面量，class/style/id 与 data-、x-、@ 前缀属性
 *   保留给宿主，子内容随迁为默认插槽（label 文案）；
 * - `back-to-top` 裸属性糖归一 `type: "back-to-top"`（显式 type 声明在场时糖失效）；
 * - 裸 `items` 属性（JSON 字符串）语义不适用本件（无 items 面）。
 *
 * IIFE 产物全局名 `AutoSparkFloatButton`（autospark.float-button.js）；双加载时序由
 * {@link installPlugin} 兜底（先于引擎加载推预加载队列，晚于引擎加载直注册）。
 */
import type { AutoSpark } from "autospark";
import { captureNamespace } from "../../../utils/namespace";
import { installPlugin } from "@autospark/utils";
import { kebabToCamel } from "../../../utils/kebabToCamel";
import { propKey } from "../../../utils/propKey";
import { inferPropValue } from "../../../utils/inferPropValue";
import floatButtonTemplate from "./float-button.html?raw";

/** 组件注册名（autospark. 点前缀命名空间，ADR-0094；kebab 免疫 DOM 属性名小写化） */
export const FLOAT_BUTTON_NAME = "autospark.float-button";

/**
 * 插件注册体：写插件全局组件表（普通 Record 赋值即生效，无 API 门面）。
 */
function mountFloatButtonPlugin(autospark: typeof AutoSpark): void {
    autospark.components[FLOAT_BUTTON_NAME] = floatButtonTemplate;
    autospark.precompile?.((engine: InstanceType<typeof AutoSpark>) => {
        for (const el of Array.from(engine.el.querySelectorAll("x-float-button"))) {
            // 宿主固定真 button + type="button"：原生语义保真（键盘/焦点免费）且防表单内
            // 默认 submit 误触；type props 折叠值（"back-to-top"）不落宿主原生属性
            const host = document.createElement("button");
            host.setAttribute("type", "button");
            // back-to-top 裸属性糖：归一 type props（显式 type/:type 在场时糖失效）
            const hasBackTopSugar = el.hasAttribute("back-to-top");
            el.removeAttribute("back-to-top");
            const hasType = el.hasAttribute("type") || el.hasAttribute(":type");
            // —— 属性折叠（link/tabs 变换同款规则）——
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
                    attr.name.startsWith("data-") ||
                    attr.name.startsWith("x-") || // 指令/选项族（x-on 等）留给引擎编译消费
                    attr.name.startsWith("@"); // 事件绑定（化身封闭域求值，外层状态事件写包裹元素）
                if (kept) {
                    host.setAttribute(attr.name, attr.value);
                    continue;
                }
                // 裸属性（无值）按 HTML 语义归一 true——inferPropValue("") 返回空串（falsy）
                parts.push(
                    `${propKey(kebabToCamel(attr.name))}: ${JSON.stringify(attr.value === "" ? true : inferPropValue(attr.value))}`,
                );
            }
            if (hasBackTopSugar && !hasType) parts.push(`type: ${JSON.stringify("back-to-top")}`);
            host.setAttribute(`x-component:${FLOAT_BUTTON_NAME}`, `{ ${parts.join(", ")} }`);
            while (el.firstChild) host.appendChild(el.firstChild);
            el.replaceWith(host);
        }
    });
}

bootstrapFloatButtonPlugin();

/**
 * 双路径注册（模块加载期执行一次，经 {@link installPlugin} 单点）。
 */
function bootstrapFloatButtonPlugin(): void {
    installPlugin((autospark) => {
        captureNamespace(autospark); // 运行时桥命名空间捕获（本插件当前零符号消费，预留统一通道）
        mountFloatButtonPlugin(autospark);
    });
}

export { bootstrapFloatButtonPlugin };
