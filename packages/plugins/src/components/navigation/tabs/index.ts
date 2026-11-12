/**
 * autospark.tabs 组件插件（组件库 P1 导航件，ADR-0018 清单权威表 navigation 行 /
 * 决策 3 裁定 segmented 并入本件作 variant）：
 * 经插件全局组件表注册（ADR-0111 决策 5），跨 engine 真全局——晚注册立即生效，
 * 同名后注册覆盖先注册。
 *
 * 页签：items（{ key, label, icon?, disabled? }[]，状态引用注入）或子元素声明
 * （<x-tab> 静态标量）两形态驱动页签头；受控 value（el.value 劫持桥 + change 冒泡
 * detail = { value } + input 回写 x-model）；variant 三形态（line / card / segmented
 * 分段控制器）；键盘左右移焦（tablist 语义）；面板区为默认插槽（消费者 x-show /
 * x-if.keepalive 切换——组件不代理面板生命周期，声明式动态命名出口因插槽出口名
 * 编译期静态收集不可行，面板恒走默认出口）。
 *
 * 元素名快速写法 `<x-tabs>` 由本文件的 precompile DOM 变换承载（link 变换同款，
 * ADR-0133）：
 * - 静态属性折叠为 props 字面量（类型推断）、`:key="expr"` 响应式项以原始表达式拼进
 *   值对象字面量，class/style/id 与 data-、x-、@ 前缀属性保留给宿主（x-model 在场
 *   即经此激活值桥），子内容随迁为默认插槽（面板区）；
 * - `<x-tab key label icon disabled>` 子元素声明折叠为 items JSON 落 data-items
 *   属性（字符串标量通道——规避值对象内字面量数组 props 的死环缺陷，P0 固化规避
 *   清单第 1 条），组件 mounted 解析写 data 响应渲染；裸 items 属性（JSON 字符串）
 *   同经此通道（不进 props 值对象）。
 *
 * IIFE 产物全局名 `AutoSparkTabs`（autospark.tabs.js）；双加载时序由
 * {@link installPlugin} 兜底（先于引擎加载推预加载队列，晚于引擎加载直注册）。
 */
import type { AutoSpark } from "autospark";
import { captureNamespace } from "../../../utils/namespace";
import { installPlugin } from "@autospark/utils";
import { kebabToCamel } from "../../../utils/kebabToCamel";
import { propKey } from "../../../utils/propKey";
import { inferPropValue } from "../../../utils/inferPropValue";
import tabsTemplate from "./tabs.html?raw";

/** 组件注册名（autospark. 点前缀命名空间，ADR-0094；kebab 免疫 DOM 属性名小写化——注册名/产物/目录三对齐 kebab） */
export const TABS_NAME = "autospark.tabs";

/**
 * 插件注册体：写插件全局组件表（普通 Record 赋值即生效，无 API 门面）。
 */
function mountTabsPlugin(autospark: typeof AutoSpark): void {
    autospark.components[TABS_NAME] = tabsTemplate;
    autospark.precompile?.((engine: InstanceType<typeof AutoSpark>) => {
        for (const el of Array.from(engine.el.querySelectorAll("x-tabs"))) {
            const host = document.createElement("div");
            // —— 子元素声明形态：<x-tab> 静量折叠为 items JSON 落 data-items ——
            // 声明子元素恒摘除（其语法载体非内容；面板写在默认插槽，x-tab 不承载内容）；
            // JSON 序列化仅在 items 未声明时落盘（props 状态引用优先）。裸 items 属性
            // （JSON 字符串）同通道分流，不进 props 值对象
            const tabEls = Array.from(el.children).filter((c) => c.tagName.toLowerCase() === "x-tab");
            const bareItems = el.getAttribute("items");
            const boundItems = el.hasAttribute(":items");
            el.removeAttribute("items"); // JSON 字符串语义走 data-items 通道（不折进 props）
            const declared = tabEls.length > 0 || (bareItems != null && bareItems !== "");
            if (declared && !boundItems) {
                let items: unknown = null;
                if (tabEls.length) {
                    // 子元素标量收集：key/label 必收，icon/disabled 可选（裸 disabled 归一 true）
                    items = tabEls.map((t) => {
                        const entry: Record<string, string | boolean> = {
                            key: t.getAttribute("key") ?? "",
                            label: t.getAttribute("label") ?? "",
                        };
                        const icon = t.getAttribute("icon");
                        if (icon != null) entry.icon = icon;
                        if (t.hasAttribute("disabled")) entry.disabled = true;
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
            for (const t of tabEls) t.remove();
            // —— 属性折叠（link 变换同款规则）——
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
                parts.push(`${propKey(kebabToCamel(attr.name))}: ${JSON.stringify(inferPropValue(attr.value))}`);
            }
            host.setAttribute(`x-component:${TABS_NAME}`, `{ ${parts.join(", ")} }`);
            while (el.firstChild) host.appendChild(el.firstChild);
            el.replaceWith(host);
        }
    });
}

bootstrapTabsPlugin();

/**
 * 双路径注册（模块加载期执行一次，经 {@link installPlugin} 单点）。
 */
function bootstrapTabsPlugin(): void {
    installPlugin((autospark) => {
        captureNamespace(autospark); // 运行时桥命名空间捕获（本插件当前零符号消费，预留统一通道）
        mountTabsPlugin(autospark);
    });
}

export { bootstrapTabsPlugin };
