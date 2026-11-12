/**
 * autospark.link 组件插件（组件库 P0 轻件，ADR-0018 清单权威表 general 行 / ADR-0019）：
 * 经插件全局组件表注册（ADR-0111 决策 5），跨 engine 真全局——晚注册立即生效，
 * 同名后注册覆盖先注册。
 *
 * 链接组件：href / target / disabled / icon / 语义色（type）/ 下划线档位（underline），
 * 语义色体系对齐 button 范式（ADR-0012：type 语义色 + theme 档位全跟随 + CSS 变量
 * 三级回退链）。
 *
 * 元素名快速写法 `<x-link href="..." label="...">` 由本文件的 precompile DOM 变换
 * 承载（宿主替换为真 a 元素——a 的原生导航语义（中键/右键/键盘/SEO 爬取）是化身
 * 复用 HTMLUnknownElement 宿主所不能保真的，button 同款教训与止血路线，ADR-0133）。
 *
 * IIFE 产物全局名 `AutoSparkLink`（autospark.link.js）；双加载时序由
 * {@link installPlugin} 兜底（先于引擎加载推预加载队列，晚于引擎加载直注册）。
 */
import type { AutoSpark } from "autospark";
import { captureNamespace } from "../../../utils/namespace";
import { installPlugin } from "@autospark/utils";
import { kebabToCamel } from "../../../utils/kebabToCamel";
import { propKey } from "../../../utils/propKey";
import { inferPropValue } from "../../../utils/inferPropValue";
import linkTemplate from "./link.html?raw";

/** 组件注册名（autospark. 点前缀命名空间，ADR-0094；kebab 免疫 DOM 属性名小写化） */
export const LINK_NAME = "autospark.link";

/**
 * 插件注册体：写插件全局组件表（普通 Record 赋值即生效，无 API 门面）。
 *
 * precompile 变换（与 button 同款折叠规则）：静态属性折叠为 props 字面量（类型
 * 推断）、`:key="expr"` 响应式项以原始表达式拼进值对象字面量，class / style / id /
 * data- 前缀 / x- 前缀 / @ 前缀属性保留给宿主，rel 透传（显式声明优先于
 * target=_blank 的自动补全），子内容随迁为默认插槽。
 */
function mountLinkPlugin(autospark: typeof AutoSpark): void {
    autospark.components[LINK_NAME] = linkTemplate;
    autospark.precompile?.((engine: InstanceType<typeof AutoSpark>) => {
        for (const el of Array.from(engine.el.querySelectorAll("x-link"))) {
            const anchor = document.createElement("a");
            // props 字面量键用裸标识符形态（引擎值解析对「引号键 + 表达式值」组合的成员
            // 求值会静默丢弃）；属性名 kebab-case 归一为 camelCase（DOM 属性名全量小写化）
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
                    attr.name === "rel" || // a 的原生关系提示属性——保留给宿主（自动补全 noopener 不覆盖显式声明）
                    attr.name.startsWith("data-") ||
                    attr.name.startsWith("x-") ||
                    attr.name.startsWith("@");
                if (kept) {
                    anchor.setAttribute(attr.name, attr.value);
                    continue;
                }
                parts.push(`${propKey(kebabToCamel(attr.name))}: ${JSON.stringify(inferPropValue(attr.value))}`);
            }
            anchor.setAttribute(`x-component:${LINK_NAME}`, `{ ${parts.join(", ")} }`);
            while (el.firstChild) anchor.appendChild(el.firstChild);
            el.replaceWith(anchor);
        }
    });
}

bootstrapLinkPlugin();

/**
 * 双路径注册（模块加载期执行一次，经 {@link installPlugin} 单点）。
 */
function bootstrapLinkPlugin(): void {
    installPlugin((autospark) => {
        captureNamespace(autospark); // 运行时桥命名空间捕获（本插件当前零符号消费，预留统一通道）
        mountLinkPlugin(autospark);
    });
}

export { bootstrapLinkPlugin };
