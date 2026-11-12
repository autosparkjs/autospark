/**
 * autospark.card 组件插件（组件库 P0，ADR-0018 清单权威表 display 行 / ADR-0019；
 * display 分类首件）：经插件全局组件表注册（ADR-0111 决策 5），跨 engine 真全局——
 * 晚注册立即生效，同名后注册覆盖先注册。
 *
 * 卡片容器组件：header（title / header 槽 / extra 槽）+ body（默认插槽出口）+
 * footer（插槽）、边框开关（bordered）/ 阴影走 theme 手动通道（data-shadow）、
 * 悬停浮起（hoverable）、可折叠头部（collapsible 组合 x-show，勿引重机制）。
 *
 * 元素名快速写法 `<x-card title="...">` 由 engine 元素名自动组件承载（ADR-0117
 * 缺省注册 x-card 标签；ADR-0133 懒预编译时序缺口已由引擎编译期反查修复）——
 * card 宿主无原生语义要保真（div），整体无须 link/button 式 precompile 替换；仅 title
 * 一项做 precompile 前置（tooltip 特性在场时静态 title 被编译期转移为 data-tooltip、
 * 先于静态属性折叠执行，见 mountCardPlugin）。
 *
 * IIFE 产物全局名 `AutoSparkCard`（autospark.card.js）；双加载时序由
 * {@link installPlugin} 兜底（先于引擎加载推预加载队列，晚于引擎加载直注册）。
 */
import type { AutoSpark } from "autospark";
import { captureNamespace } from "../../../utils/namespace";
import { installPlugin } from "@autospark/utils";
import { inferPropValue } from "../../../utils/inferPropValue";
import cardTemplate from "./card.html?raw";

/** 组件注册名（autospark. 点前缀命名空间，ADR-0094；kebab 免疫 DOM 属性名小写化） */
export const CARD_NAME = "autospark.card";

/**
 * 插件注册体：写插件全局组件表 + precompile 元素名 title 前置。
 */
function mountCardPlugin(autospark: typeof AutoSpark): void {
    autospark.components[CARD_NAME] = cardTemplate;
    // title 防御性前置（tooltip 插件互操作）：tooltip 特性在场时引擎编译期把宿主**静态**
    // title 转移为 data-tooltip（ADR-0061 决策 4），且先于元素名自动组件的静态属性折叠
    // 执行——title 是 card 的 props 主通道（与 button/link/input 的「宿主全局提示属性」
    // 语义不同），不前置即被吞。precompile（构造早期、template 克隆前）把静态 title 改写
    // 为 `:title` 字面量表达式（类型推断同静态折叠），经 :expr stash 折叠进 props
    // （ADR-0117 优先级 :expr > 静态）；`:title` 不在 title 转换目标内，两态（tooltip
    // 在场/缺席）行为恒一致。显式 `:title` 声明优先（静态 title 仅移除，不改写）；
    // 显式 x-component 声明形态让位（title 是宿主属性，不折叠）。
    autospark.precompile?.((engine: InstanceType<typeof AutoSpark>) => {
        for (const el of Array.from(engine.el.querySelectorAll("x-card"))) {
            if (el.hasAttribute("x-component")) continue;
            const title = el.getAttribute("title");
            if (title == null) continue;
            if (!el.hasAttribute(":title")) {
                el.setAttribute(":title", JSON.stringify(inferPropValue(title)));
            }
            el.removeAttribute("title");
        }
    });
}

bootstrapCardPlugin();

/**
 * 双路径注册（模块加载期执行一次，经 {@link installPlugin} 单点）。
 */
function bootstrapCardPlugin(): void {
    installPlugin((autospark) => {
        captureNamespace(autospark); // 运行时桥命名空间捕获（本插件当前零符号消费，预留统一通道）
        mountCardPlugin(autospark);
    });
}

export { bootstrapCardPlugin };
