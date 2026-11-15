/**
 * autospark.steps 组件插件（组件库 P2 导航件，ADR-0018 清单权威表 navigation 行）：
 * 经插件全局组件表注册（ADR-0111 决策 5），跨 engine 真全局——晚注册立即生效，
 * 同名后注册覆盖先注册。
 *
 * 步骤条：items（{ title, description?, icon? }[]，状态引用注入）或子元素声明
 * （<x-step> 静态标量）两形态；current（当前步序号，受控缺省 0——clickable 开启时
 * 点击切换 + change 冒泡 detail = { current } + input 回写 x-model + el.value 桥）；
 * status（process 缺省 / finish / error——当前步状态，先行步恒 finish、后续步恒
 * wait）；direction（horizontal 缺省 / vertical）；已完成步打勾（x-icon 内置 yes）、
 * 连接线随完成染色。
 *
 * 元素名快速写法 `<x-steps>` 由本文件的 precompile DOM 变换承载（tabs/breadcrumb
 * 同款）：
 * - 静态属性折叠为 props 字面量（类型推断）、`:key="expr"` 响应式项以原始表达式拼进
 *   值对象字面量，class/style/id 与 data-、x-、@ 前缀属性保留给宿主（x-model 在场
 *   即经此激活值桥），子内容随迁为默认插槽；
 * - `<x-step title description icon>` 子元素声明折叠为 items JSON 落 data-items
 *   属性（字符串标量通道——规避值对象内字面量数组 props 的死环缺陷，P0 固化规避
 *   清单第 1 条），组件 mounted 解析写 data 响应渲染；裸 items 属性（JSON 字符串）
 *   同经此通道（不进 props 值对象）。
 *
 * IIFE 产物全局名 `AutoSparkSteps`（autospark.steps.js）；双加载时序由
 * {@link installPlugin} 兜底（先于引擎加载推预加载队列，晚于引擎加载直注册）。
 */
import type { AutoSpark } from "autospark";
import { captureNamespace } from "../../../utils/namespace";
import { installPlugin } from "@autospark/utils";
import { kebabToCamel } from "../../../utils/kebabToCamel";
import { propKey } from "../../../utils/propKey";
import { inferPropValue } from "../../../utils/inferPropValue";
import stepsTemplate from "./steps.html?raw";

/** 组件注册名（autospark. 点前缀命名空间，ADR-0094；kebab 免疫 DOM 属性名小写化——注册名/产物/目录三对齐 kebab） */
export const STEPS_NAME = "autospark.steps";

/**
 * 插件注册体：写插件全局组件表（普通 Record 赋值即生效，无 API 门面）。
 */
function mountStepsPlugin(autospark: typeof AutoSpark): void {
    autospark.components[STEPS_NAME] = stepsTemplate;
    autospark.precompile?.((engine: InstanceType<typeof AutoSpark>) => {
        for (const el of Array.from(engine.el.querySelectorAll("x-steps"))) {
            const host = document.createElement("div");
            // —— 子元素声明形态：<x-step> 静量折叠为 items JSON 落 data-items ——
            // 声明子元素恒摘除（其语法载体非内容）；JSON 序列化仅在 items 未声明时落盘
            // （props 状态引用优先）。裸 items 属性（JSON 字符串）同通道分流，不进 props 值对象
            const itemEls = Array.from(el.children).filter((c) => c.tagName.toLowerCase() === "x-step");
            const bareItems = el.getAttribute("items");
            const boundItems = el.hasAttribute(":items");
            el.removeAttribute("items"); // JSON 字符串语义走 data-items 通道（不折进 props）
            const declared = itemEls.length > 0 || (bareItems != null && bareItems !== "");
            if (declared && !boundItems) {
                let items: unknown = null;
                if (itemEls.length) {
                    // 子元素标量收集：title 必收，description/icon 可选（缺席不落键）
                    items = itemEls.map((s) => {
                        const entry: Record<string, string> = { title: s.getAttribute("title") ?? "" };
                        const description = s.getAttribute("description");
                        if (description != null) entry.description = description;
                        const icon = s.getAttribute("icon");
                        if (icon != null) entry.icon = icon;
                        return entry;
                    });
                } else {
                    // 裸 items 属性：期望 JSON 数组字符串，非法形态静默忽略（容错缺省空组）
                    try {
                        const parsed = JSON.parse(bareItems!);
                        if (Array.isArray(parsed)) items = parsed;
                    } catch {
                        /* 非法 JSON 忽略 */
                    }
                }
                if (items) host.setAttribute("data-items", JSON.stringify(items));
            }
            for (const s of itemEls) s.remove();
            // —— 属性折叠（tabs/breadcrumb 变换同款规则）——
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
                    attr.name.startsWith("x-") || // 指令/选项族（x-model、x-on 等）留给引擎编译消费
                    attr.name.startsWith("@"); // 事件绑定（化身封闭域求值，外层状态事件写包裹元素）
                if (kept) {
                    host.setAttribute(attr.name, attr.value);
                    continue;
                }
                if (attr.value === "") {
                    parts.push(`${propKey(kebabToCamel(attr.name))}: true`); // 裸属性 = 开（布尔开关语义，carousel 同款惯例——clickable 写裸属性即启用）
                    continue;
                }
                parts.push(`${propKey(kebabToCamel(attr.name))}: ${JSON.stringify(inferPropValue(attr.value))}`);
            }
            host.setAttribute(`x-component:${STEPS_NAME}`, `{ ${parts.join(", ")} }`);
            while (el.firstChild) host.appendChild(el.firstChild);
            el.replaceWith(host);
        }
    });
}

bootstrapStepsPlugin();

/**
 * 双路径注册（模块加载期执行一次，经 {@link installPlugin} 单点）。
 */
function bootstrapStepsPlugin(): void {
    installPlugin((autospark) => {
        captureNamespace(autospark); // 运行时桥命名空间捕获（本插件当前零符号消费，预留统一通道）
        mountStepsPlugin(autospark);
    });
}

export { bootstrapStepsPlugin };
