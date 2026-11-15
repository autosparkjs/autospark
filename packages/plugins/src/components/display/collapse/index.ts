/**
 * autospark.collapse 组件插件（组件库 P2 展示件，ADR-0018 清单权威表 display 行 /
 * 决策 3 裁定入清单：x-foldable 单面板 + 「组 + 互斥手风琴」增量）：经插件全局组件表
 * 注册（ADR-0111 决策 5），跨 engine 真全局——晚注册立即生效，同名后注册覆盖先注册。
 *
 * 折叠面板组：面板元信息双形态——items 数据形态（{ key, title, disabled?, content? }[]，
 * 状态引用注入；content 为 HTML 字符串经 x-html 渲染）/ 子元素声明形态
 * （<x-collapse-item key title disabled> 子元素为面板模板内容，绑定可用）。展开 key 集
 * 受控（value 数组 + el.value 桥 + change detail={value}）、手风琴互斥（accordion，
 * 同时仅一开）、展开图标位置（expandIconPosition：start/end）。
 *
 * 面板开合自实现 CSS 高度过渡（grid-template-rows 0fr→1fr），不组合 x-foldable 指令：
 * x-foldable 是 nowrap flex 容器的**行内溢出折叠**结构指令（工具栏/面包屑/标签条——空间
 * 不足把溢出子元素收进 more 弹出面板，ADR-0098），与本件「内容面板垂直展开」语义不同构
 * （无互斥手风琴、无受控 value 集、弹出面板非原地展开），适配性不成立——取舍理由详见
 * P2 合批 ADR 边界声明。
 *
 * 元素名快速写法 `<x-collapse>` 由本文件的 precompile DOM 变换承载（breadcrumb 同款）：
 * - 静态属性折叠为 props 字面量（类型推断）、`:key="expr"` 响应式项以原始表达式拼进
 *   值对象字面量，class/style/id 与 data-、x-、@ 前缀属性保留给宿主；
 * - `<x-collapse-item key title disabled>` 子元素声明展开为面板结构（item 容器 +
 *   header 按钮 + content 内容体，子内容随迁进 content），面板结构经默认插槽投影
 *   （消费者作用域编译——面板内容内的绑定/指令照常工作）；
 * - 裸 items 属性（JSON 字符串）折为 data-items 属性（字符串标量通道——规避值对象内
 *   字面量数组 props 的死环缺陷，P0 固化规避清单第 1 条）。
 *
 * IIFE 产物全局名 `AutoSparkCollapse`（autospark.collapse.js）；双加载时序由
 * {@link installPlugin} 兜底（先于引擎加载推预加载队列，晚于引擎加载直注册）。
 */
import type { AutoSpark } from "autospark";
import { captureNamespace } from "../../../utils/namespace";
import { installPlugin } from "@autospark/utils";
import { kebabToCamel } from "../../../utils/kebabToCamel";
import { propKey } from "../../../utils/propKey";
import { inferPropValue } from "../../../utils/inferPropValue";
import collapseTemplate from "./collapse.html?raw";

/** 组件注册名（autospark. 点前缀命名空间，ADR-0094；kebab 免疫 DOM 属性名小写化） */
export const COLLAPSE_NAME = "autospark.collapse";

/**
 * 插件注册体：写插件全局组件表 + precompile 元素名/声明子元素变换。
 */
function mountCollapsePlugin(autospark: typeof AutoSpark): void {
    autospark.components[COLLAPSE_NAME] = collapseTemplate;
    autospark.precompile?.((engine: InstanceType<typeof AutoSpark>) => {
        for (const el of Array.from(engine.el.querySelectorAll("x-collapse"))) {
            const host = document.createElement("div");
            // —— 子元素声明形态：<x-collapse-item> 展开为面板结构（item 容器 + header 按钮 +
            //    content 内容体，子内容随迁）——面板结构作为宿主子内容经默认插槽投影，
            //    消费者作用域编译（面板内容内绑定可用）；交互不走模板绑定（头部点击由组件
            //    根 JS 委托统一承载，开合态由组件 mounted 的 data-open 属性同步通道驱动）
            const itemEls = Array.from(el.children).filter((c) => c.tagName.toLowerCase() === "x-collapse-item");
            for (const item of itemEls) {
                const key = item.getAttribute("key") ?? "";
                const itemDiv = document.createElement("div");
                itemDiv.className = "asc-collapse-item";
                itemDiv.setAttribute("data-key", key);
                // header 按钮：title 静态标量 + 内置 arrow 图标（旋转通道在 CSS）；
                // 裸 disabled 归一原生禁用属性（点击/聚焦原生拦截）
                const header = document.createElement("button");
                header.type = "button";
                header.className = "asc-collapse-header";
                header.setAttribute("data-key", key);
                if (item.hasAttribute("disabled")) header.setAttribute("disabled", "");
                const title = document.createElement("span");
                title.className = "asc-collapse-title";
                title.textContent = item.getAttribute("title") ?? "";
                const icon = document.createElement("i");
                icon.className = "asc-collapse-icon";
                icon.setAttribute("x-icon", "'arrow'");
                header.appendChild(title);
                header.appendChild(icon);
                // content 内容体：grid 高度过渡载体（0fr→1fr）+ inner 溢出裁剪层，
                // 声明子内容随迁进 inner（单行裁剪层是 grid-rows 过渡的标准结构）
                const content = document.createElement("div");
                content.className = "asc-collapse-content";
                const inner = document.createElement("div");
                inner.className = "asc-collapse-inner";
                while (item.firstChild) inner.appendChild(item.firstChild);
                content.appendChild(inner);
                itemDiv.appendChild(header);
                itemDiv.appendChild(content);
                item.replaceWith(itemDiv);
            }
            // —— 裸 items 属性（JSON 字符串）折为 data-items 通道（不进 props 值对象） ——
            const bareItems = el.getAttribute("items");
            const boundItems = el.hasAttribute(":items");
            el.removeAttribute("items");
            if (bareItems != null && bareItems !== "" && !boundItems && !itemEls.length) {
                try {
                    if (Array.isArray(JSON.parse(bareItems))) host.setAttribute("data-items", bareItems);
                } catch {
                    /* 非法 JSON 忽略（容错缺省空组） */
                }
            }
            // —— 属性折叠（breadcrumb 变换同款规则；布尔 props 裸属性归一 true——HTML
            //    presence 语义，inferPropValue 对空值推断为空串的补正）——
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
                    attr.name.startsWith("x-") ||
                    attr.name.startsWith("@");
                if (kept) {
                    host.setAttribute(attr.name, attr.value);
                    continue;
                }
                const value = attr.name === "accordion" && attr.value === "" ? true : inferPropValue(attr.value);
                parts.push(`${propKey(kebabToCamel(attr.name))}: ${JSON.stringify(value)}`);
            }
            host.setAttribute(`x-component:${COLLAPSE_NAME}`, `{ ${parts.join(", ")} }`);
            while (el.firstChild) host.appendChild(el.firstChild);
            el.replaceWith(host);
        }
    });
}

bootstrapCollapsePlugin();

/**
 * 双路径注册（模块加载期执行一次，经 {@link installPlugin} 单点）。
 */
function bootstrapCollapsePlugin(): void {
    installPlugin((autospark) => {
        captureNamespace(autospark); // 运行时桥命名空间捕获（本插件当前零符号消费，预留统一通道）
        mountCollapsePlugin(autospark);
    });
}

export { bootstrapCollapsePlugin };
