/**
 * autospark.container 组件插件（组件库 P2 布局件，ADR-0018 清单权威表 layout 行）：
 * 经插件全局组件表注册（ADR-0111 决策 5，`AutoSpark.components[name] = 模板字符串`），
 * 跨 engine 真全局——晚注册立即生效，同名后注册覆盖先注册。
 *
 * 页面容器壳：header / aside / main / footer 四区结构（grid 区域布局，纯样式结构壳——
 * 无状态无事件无 JS 机制），侧栏位置可调（asidePosition：start 左 / end 右）。四区内容
 * 经命名插槽（header/aside/footer）+ 默认插槽（main）注入；子元素声明形态
 * （<x-container-header> / <x-container-aside> / <x-container-footer> /
 * <x-container-main>）由本文件的 precompile DOM 变换折叠为插槽声明。
 *
 * **三方名字撞车边界消歧（必读，P2 合批 ADR 边界声明）**——"container" 一名三物：
 * - **本组件 `autospark.container`**：页面结构壳——四区版式（header 横贯顶、aside 侧栏、
 *   main 主区、footer 横贯底），纯 CSS grid，组件形态（x-component / 元素名）；
 * - **x-layout 指令**（autospark.layout.js）：grid 窗格布局机制——x-pane 窗格声明、
 *   分割调节（与 x-splitter 协作）、窗格级布局指令族，页面骨架的机制层；
 * - **x-container 指令**（autospark.layout.js）：响应式断点容器——按视口档位切
 *   max-width + 居中（Bootstrap .container 心智，ADR-0101/0105）。
 *   本组件模板显式 `x-define-options="{tag:false}"` 关闭元素名自动推导（缺省推导
 *   x-container 标签与同名指令撞名——ADR-0133 撞名规则下 fail-fast），`<x-container>`
 *   元素形态由本文件 precompile 变换独占承载；写 `<div x-container>`（属性形态）恒指
 *   断点容器指令，两者通道不同互不干扰。选型：整页四区版式用本组件；窗格分割/调节用
 *   x-layout；内容宽度收束用 x-container 指令——三者可叠用（x-container 约束宽度、
 *   本件组版式、x-layout 在 main 区内做窗格）。
 *
 * IIFE 产物全局名 `AutoSparkContainer`（autospark.container.js）；双加载时序由
 * {@link installPlugin} 兜底（先于引擎加载推预加载队列，晚于引擎加载直注册）。
 */
import type { AutoSpark } from "autospark";
import { captureNamespace } from "../../../utils/namespace";
import { installPlugin } from "@autospark/utils";
import { kebabToCamel } from "../../../utils/kebabToCamel";
import { propKey } from "../../../utils/propKey";
import { inferPropValue } from "../../../utils/inferPropValue";
import containerTemplate from "./container.html?raw";

/** 组件注册名（autospark. 点前缀命名空间，ADR-0094；kebab 免疫 DOM 属性名小写化） */
export const CONTAINER_NAME = "autospark.container";

/** 子元素声明的区段标签名 → 插槽名映射（main 解包：子内容直落默认插槽） */
const SECTION_SLOTS: Record<string, string | null> = {
    "x-container-header": "header",
    "x-container-aside": "aside",
    "x-container-footer": "footer",
    "x-container-main": null, // main 是默认插槽：解包子内容（wrapper 不留）
};

/**
 * 插件注册体：写插件全局组件表 + precompile 元素名/区段声明变换。
 */
function mountContainerPlugin(autospark: typeof AutoSpark): void {
    autospark.components[CONTAINER_NAME] = containerTemplate;
    autospark.precompile?.((engine: InstanceType<typeof AutoSpark>) => {
        for (const el of Array.from(engine.el.querySelectorAll("x-container"))) {
            const host = document.createElement("div");
            // —— 区段声明折叠：x-container-header/aside/footer → <template x-slot:名>
            //    （子内容随迁）；x-container-main 解包（子内容直落默认插槽 = main 区）——
            //    已是 template x-slot:* 形态的子元素与普通子内容原样通过
            for (const child of Array.from(el.children)) {
                const slotName = SECTION_SLOTS[child.tagName.toLowerCase()];
                if (slotName === undefined) continue;
                if (slotName === null) {
                    // main 解包：子内容提升到宿主层（默认插槽通道）
                    child.replaceWith(...Array.from(child.childNodes));
                    continue;
                }
                const tpl = document.createElement("template");
                // 消费端命名插槽声明形态：<template x-slot:名>（template content 子节点展开）
                tpl.setAttribute(`x-slot:${slotName}`, "");
                while (child.firstChild) tpl.content.appendChild(child.firstChild);
                child.replaceWith(tpl);
            }
            // —— 属性折叠（breadcrumb 变换同款规则）——
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
                parts.push(`${propKey(kebabToCamel(attr.name))}: ${JSON.stringify(inferPropValue(attr.value))}`);
            }
            host.setAttribute(`x-component:${CONTAINER_NAME}`, `{ ${parts.join(", ")} }`);
            while (el.firstChild) host.appendChild(el.firstChild);
            el.replaceWith(host);
        }
    });
}

bootstrapContainerPlugin();

/**
 * 双路径注册（模块加载期执行一次，经 {@link installPlugin} 单点）。
 */
function bootstrapContainerPlugin(): void {
    installPlugin((autospark) => {
        captureNamespace(autospark); // 运行时桥命名空间捕获（本插件当前零符号消费，预留统一通道）
        mountContainerPlugin(autospark);
    });
}

export { bootstrapContainerPlugin };
