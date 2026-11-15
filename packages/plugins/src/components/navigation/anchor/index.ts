/**
 * autospark.anchor 组件插件（组件库 P3 导航轻件，ADR-0018 清单权威表 navigation 行 /
 * ADR-0029 anchor 与 float-button 轻件对 ADR）：锚点导航——items（{ key, label, href? }[]，
 * 状态引用注入）驱动侧边文字列表；scroll + getBoundingClientRect 监听高亮当前锚
 * （offset 判定线，unmounted 清理——grid 的 matchMedia 先例）；点击平滑滚动到锚
 * （不写 hash——纯滚动语义，router 隔离 ADR-0018 决策 6 约定 2）+ change 冒泡
 * detail = { key }；affix 固定侧栏形态（fixed 定位）。
 *
 * 元素名快速写法 `<x-anchor>` 由本文件的 precompile DOM 变换承载（link 止血路线
 * ADR-0133，nav 地标语义保真）：
 * - 静态属性折叠为 props 字面量（类型推断）、`:key="expr"` 响应式项以原始表达式拼进
 *   值对象字面量，class/style/id 与 data-、x-、@ 前缀属性保留给宿主，子内容随迁
 *   （锚点列表由 items 驱动自渲染，无插槽语义）；
 * - `<x-anchor-item key label href>` 子元素声明折叠为 items JSON 落 data-items
 *   属性（字符串标量通道——规避值对象内字面量数组 props 的死环缺陷，P0 固化规避
 *   清单第 1 条），组件 mounted 解析写 data 响应渲染；裸 items 属性（JSON 字符串）
 *   同经此通道（不进 props 值对象）。
 *
 * IIFE 产物全局名 `AutoSparkAnchor`（autospark.anchor.js）；双加载时序由
 * {@link installPlugin} 兜底（先于引擎加载推预加载队列，晚于引擎加载直注册）。
 */
import type { AutoSpark } from "autospark";
import { captureNamespace } from "../../../utils/namespace";
import { installPlugin } from "@autospark/utils";
import { kebabToCamel } from "../../../utils/kebabToCamel";
import { propKey } from "../../../utils/propKey";
import { inferPropValue } from "../../../utils/inferPropValue";
import anchorTemplate from "./anchor.html?raw";

/** 组件注册名（autospark. 点前缀命名空间，ADR-0094；kebab 免疫 DOM 属性名小写化） */
export const ANCHOR_NAME = "autospark.anchor";

/**
 * 插件注册体：写插件全局组件表（普通 Record 赋值即生效，无 API 门面）。
 */
function mountAnchorPlugin(autospark: typeof AutoSpark): void {
    autospark.components[ANCHOR_NAME] = anchorTemplate;
    autospark.precompile?.((engine: InstanceType<typeof AutoSpark>) => {
        for (const el of Array.from(engine.el.querySelectorAll("x-anchor"))) {
            const host = document.createElement("nav");
            // —— 子元素声明形态：<x-anchor-item> 静量折叠为 items JSON 落 data-items ——
            // 声明子元素恒摘除（其语法载体非内容；锚点列表由 items 驱动自渲染）；
            // JSON 序列化仅在 items 未声明时落盘（props 状态引用优先）。裸 items 属性
            // （JSON 字符串）同通道分流，不进 props 值对象
            const itemEls = Array.from(el.children).filter((c) => c.tagName.toLowerCase() === "x-anchor-item");
            const bareItems = el.getAttribute("items");
            const boundItems = el.hasAttribute(":items");
            el.removeAttribute("items"); // JSON 字符串语义走 data-items 通道（不折进 props）
            const declared = itemEls.length > 0 || (bareItems != null && bareItems !== "");
            if (declared && !boundItems) {
                let items: unknown = null;
                if (itemEls.length) {
                    // 子元素标量收集：key/label 必收，href 可选（缺省 key 作锚 id #key）
                    items = itemEls.map((t) => {
                        const entry: Record<string, string> = {
                            key: t.getAttribute("key") ?? "",
                            label: t.getAttribute("label") ?? "",
                        };
                        const href = t.getAttribute("href");
                        if (href != null) entry.href = href;
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
            for (const t of itemEls) t.remove();
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
                // 裸属性（无值，如 <x-anchor affix>）按 HTML 语义归一 true——
                // inferPropValue("") 返回空串（falsy），布尔糖会静默失效
                parts.push(
                    `${propKey(kebabToCamel(attr.name))}: ${JSON.stringify(attr.value === "" ? true : inferPropValue(attr.value))}`,
                );
            }
            host.setAttribute(`x-component:${ANCHOR_NAME}`, `{ ${parts.join(", ")} }`);
            while (el.firstChild) host.appendChild(el.firstChild);
            el.replaceWith(host);
        }
    });
}

bootstrapAnchorPlugin();

/**
 * 双路径注册（模块加载期执行一次，经 {@link installPlugin} 单点）。
 */
function bootstrapAnchorPlugin(): void {
    installPlugin((autospark) => {
        captureNamespace(autospark); // 运行时桥命名空间捕获（本插件当前零符号消费，预留统一通道）
        mountAnchorPlugin(autospark);
    });
}

export { bootstrapAnchorPlugin };
