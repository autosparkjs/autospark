/**
 * autospark.carousel 组件插件（组件库 P2，ADR-0018 清单权威表 display 行
 * 「carousel（P2）」）：经插件全局组件表注册（ADR-0111 决策 5），跨 engine 真全局
 * ——晚注册立即生效，同名后注册覆盖先注册。
 *
 * 轮播：items（string 图片 url | { src?, alt?, caption?, html? } 内容项，状态引用注入）
 * 或子元素声明（<x-carousel-item src alt caption> 静态标量 + 子内容折叠 html 字段）两
 * 形态；autoplay（间隔毫秒，0 关——prefers-reduced-motion 停播）/ loop / indicator
 * （"top" | "bottom" | false）/ arrows（前后箭头开关，x-icon 内置 arrow）/ effect
 * （scroll 真滚动 scroll-snap | fade 淡入淡出）；切换广播 change（detail = { index }）
 * + el.value 劫持桥；键盘左右（stage 焦点域）。
 *
 * 实现取舍：scroll 档走 CSS scroll-snap 真滚动（原生滚动/触摸惯性免费，切换经
 * scrollTo 驱动——程序滚动 settleTarget 旗吞中间态防误同步）；fade 档纯 CSS 叠放
 * 透明度切换（stage 定高 --asc-carousel-height）。
 *
 * 元素名快速写法 `<x-carousel>` 由本文件的 precompile DOM 变换承载（breadcrumb/tabs
 * 同款，ADR-0133）：
 * - 静态属性折叠为 props 字面量（类型推断；裸布尔属性归一 true——loop/arrows 开关语
 *   义）、`:key="expr"` 响应式项以原始表达式拼进值对象字面量，class/style/id 与
 *   data-、x-、@ 前缀属性保留给宿主；
 * - `<x-carousel-item>` 子元素声明折叠为 items JSON 落 data-items 属性（字符串标量
 *   通道——规避值对象内字面量数组 props 的死环缺陷，ADR-0021 规避清单第 5 条），
 *   组件 mounted 解析写 data 响应渲染；裸 items 属性（JSON 字符串）同经此通道
 *   （不进 props 值对象）；子内容随迁为项 html 字段（内容幻灯片——静态声明语义，
 *   动态内容走 items 状态引用）。
 *
 * IIFE 产物全局名 `AutoSparkCarousel`（autospark.carousel.js）；双加载时序由
 * {@link installPlugin} 兜底（先于引擎加载推预加载队列，晚于引擎加载直注册）。
 */
import type { AutoSpark } from "autospark";
import { captureNamespace } from "../../../utils/namespace";
import { installPlugin } from "@autospark/utils";
import { kebabToCamel } from "../../../utils/kebabToCamel";
import { propKey } from "../../../utils/propKey";
import { inferPropValue } from "../../../utils/inferPropValue";
import carouselTemplate from "./carousel.html?raw";

/** 组件注册名（autospark. 点前缀命名空间，ADR-0094；kebab 免疫 DOM 属性名小写化） */
export const CAROUSEL_NAME = "autospark.carousel";

/**
 * 插件注册体：写插件全局组件表（普通 Record 赋值即生效，无 API 门面）。
 */
function mountCarouselPlugin(autospark: typeof AutoSpark): void {
    autospark.components[CAROUSEL_NAME] = carouselTemplate;
    autospark.precompile?.((engine: InstanceType<typeof AutoSpark>) => {
        for (const el of Array.from(engine.el.querySelectorAll("x-carousel"))) {
            const host = document.createElement("div");
            // —— 子元素声明形态：<x-carousel-item> 折叠为 items JSON 落 data-items ——
            // 声明子元素恒摘除（其语法载体即内容本体）；JSON 序列化仅在 items 未声明
            // 时落盘（props 状态引用优先）。裸 items 属性（JSON 字符串）同通道分流
            const itemEls = Array.from(el.children).filter((c) => c.tagName.toLowerCase() === "x-carousel-item");
            const bareItems = el.getAttribute("items");
            const boundItems = el.hasAttribute(":items");
            el.removeAttribute("items"); // JSON 字符串语义走 data-items 通道（不折进 props）
            const declared = itemEls.length > 0 || (bareItems != null && bareItems !== "");
            if (declared && !boundItems) {
                let items: unknown = null;
                if (itemEls.length) {
                    // 子元素标量收集：src/alt/caption 可选（缺席不落键）；子内容随迁为
                    // html 字段（内容幻灯片——声明形态为静态语义，动态内容走 items 引用）
                    items = itemEls.map((it) => {
                        const entry: Record<string, string> = {};
                        const src = it.getAttribute("src");
                        const alt = it.getAttribute("alt");
                        const caption = it.getAttribute("caption");
                        if (src != null) entry.src = src;
                        if (alt != null) entry.alt = alt;
                        if (caption != null) entry.caption = caption;
                        const html = (it.innerHTML || "").trim();
                        if (html !== "") entry.html = html;
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
            for (const it of itemEls) it.remove();
            // —— 属性折叠（breadcrumb 同款规则 + 裸布尔归一 true——loop/arrows 开关）——
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
                    parts.push(`${propKey(kebabToCamel(attr.name))}: true`); // 裸属性 = 开（布尔开关语义）
                    continue;
                }
                parts.push(`${propKey(kebabToCamel(attr.name))}: ${JSON.stringify(inferPropValue(attr.value))}`);
            }
            host.setAttribute(`x-component:${CAROUSEL_NAME}`, `{ ${parts.join(", ")} }`);
            // 无内容随迁（carousel 为 items 自包含组件，默认插槽不承载内容）
            el.replaceWith(host);
        }
    });
}

bootstrapCarouselPlugin();

/**
 * 双路径注册（模块加载期执行一次，经 {@link installPlugin} 单点）。
 */
function bootstrapCarouselPlugin(): void {
    installPlugin((autospark) => {
        captureNamespace(autospark); // 运行时桥命名空间捕获（本插件当前零符号消费，预留统一通道）
        mountCarouselPlugin(autospark);
    });
}

export { bootstrapCarouselPlugin };
