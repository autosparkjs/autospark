/**
 * autospark.menu 组件插件（组件库 P2 导航件，ADR-0018 清单权威表 navigation 行）：
 * 经插件全局组件表注册（ADR-0111 决策 5），跨 engine 真全局——晚注册立即生效，
 * 同名后注册覆盖先注册。
 *
 * v2 数据驱动重设计（ADR-0033）：items 数据描述驱动（MenuEntry——item 透传 button
 * 全 props / group 分组标题 / separator 分隔线（≡ '-'）/ children 数组|SubmenuOptions
 * 配置对象，递归任意层）；expandLevel 初始展开 + popLevel 缩进/弹层分界 + openKeys
 * 全受控双绑；value 形态即语义（string 单选激活 / string[] checkable 勾选集合）；
 * collapsed 布尔折叠（垂直 = 整菜单收窄为 collapsedWidth + 子级全弹层 / 水平 = 仅一级项
 * 只显示图标，ADR-0033 修订）；width / collapsedWidth 宽度 props（0 = 自适应填充）；
 * trigger（hover 缺省 | click）透传 popover；同级 check / icon 统一占位；完整键盘导航
 * （roving tabindex）；header / footer 插槽为作用域插槽（slotParams 形参，按需解构）；
 * padding（main / 弹层面板内边距，弹层经 props 管道下传）；logo（Logo 区——icon 图片 URL
 * 或图标名一体两用、url 跳转、direction auto 容器查询二态、shape 裁剪、图无效首字符兜底、
 * 折叠只留图标，slot=logo 内容段可重载，2026-11-25 特性扩展）。
 *
 * 旧 `<x-menu-item>` 组合式**硬移除不警告**（ADR-0033 决策 1，0.x breaking 惯例）：
 * 声明子元素静默摘除；裸 `items='[…]'` JSON 字符串走 data-items 通道延续（字面量数组
 * props 死环规避，P0 固化规避清单第 1 条）。
 *
 * 三模板注册：主组件 autospark.menu + 内部递归节点 autospark-menu-node + 弹层面板
 * autospark-menu-panel（连字符注册名免疫 popover attr 参数点号切分，dropdown 同款
 * 成因，ADR-0022 决策 1）——后两者不对用户暴露。
 *
 * 跨插件依赖：弹层呈现须同引 `autospark.overlay.js`（x-popover，ADR-0128）与
 * `autospark.button.js`（项渲染载体），聚合产物无此问题；overlay 缺席时缩进域照常、
 * 弹层域无效（家族口径同 dropdown）。
 *
 * router 隔离（ADR-0018 决策 6 约定 2）：纯状态驱动、不 import router——配方文档交付。
 *
 * IIFE 产物全局名 `AutoSparkMenu`（autospark.menu.js）；双加载时序由
 * {@link installPlugin} 兜底（先于引擎加载推预加载队列，晚于引擎加载直注册）。
 */
import type { AutoSpark } from "autospark";
import { captureNamespace } from "../../../utils/namespace";
import { installPlugin } from "@autospark/utils";
import { kebabToCamel } from "../../../utils/kebabToCamel";
import { propKey } from "../../../utils/propKey";
import { inferPropValue } from "../../../utils/inferPropValue";
import menuTemplate from "./menu.html?raw";
import nodeTemplate from "./node.html?raw";
import panelTemplate from "./panel.html?raw";

/** 组件注册名（autospark. 点前缀命名空间，ADR-0094；kebab 免疫 DOM 属性名小写化） */
export const MENU_NAME = "autospark.menu";
/** 递归节点内部组件注册名（级列表渲染，非用户直接消费） */
export const MENU_NODE_NAME = "autospark-menu-node";
/** 弹层面板内部组件注册名（x-popover 内容，非用户直接消费） */
export const MENU_PANEL_NAME = "autospark-menu-panel";

/**
 * 插件注册体：写插件全局组件表（主组件 + 递归节点 + 弹层面板三模板）+ precompile
 * 元素名变换。
 *
 * precompile 变换（tabs/breadcrumb/dropdown 同款折叠规则）：静态属性折叠为 props
 * 字面量（类型推断）、`:key="expr"` 响应式项以原始表达式拼进值对象字面量，
 * class/style/id 与 data-、x-、@ 前缀属性保留给宿主（x-model 在场即经此激活值桥），
 * 子内容随迁为插槽内容（直接子级 `<template header>` / `<template footer>` 快捷形态归一为
 * 正典 `x-slot:header` / `x-slot:footer`，形参声明原值保留）；`<x-menu-item>`
 * 旧组合式子元素静默摘除（ADR-0033 决策 1 硬移除）。
 */
function mountMenuPlugin(autospark: typeof AutoSpark): void {
    autospark.components[MENU_NAME] = menuTemplate;
    autospark.components[MENU_NODE_NAME] = nodeTemplate;
    autospark.components[MENU_PANEL_NAME] = panelTemplate;
    autospark.precompile?.((engine: InstanceType<typeof AutoSpark>) => {
        for (const el of Array.from(engine.el.querySelectorAll("x-menu"))) {
            const host = document.createElement("div");
            // —— 旧组合式子元素硬移除（不警告、不转换——ADR-0033 决策 1）——
            for (const it of Array.from(el.children)) {
                if (it.tagName.toLowerCase() === "x-menu-item") it.remove();
            }
            // —— header / footer / logo 插槽声明快捷形态归一：`<template header>` / `<template footer>`
            // / `<template logo>` → 正典 `<template x-slot:名>`（属性值原值保留，即形参声明）——
            // 引擎只认 x-slot 标记，未标记的 template 会落入默认段而不渲染；仅认宿主直接子级，
            // 正典写法已在场则不动 ——
            for (const it of Array.from(el.children)) {
                if (it.tagName.toLowerCase() !== "template") continue;
                for (const name of ["header", "footer", "logo"]) {
                    if (!it.hasAttribute(name)) continue;
                    const declared = it.getAttribute(name);
                    it.removeAttribute(name);
                    if (!it.hasAttribute(`x-slot:${name}`)) it.setAttribute(`x-slot:${name}`, declared ?? "");
                }
            }
            // —— 裸 items 属性（JSON 字符串）走 data-items 通道（不进 props 值对象）——
            const bareItems = el.getAttribute("items");
            const boundItems = el.hasAttribute(":items");
            el.removeAttribute("items");
            if (bareItems != null && bareItems !== "" && !boundItems) {
                // 期望 JSON 数组字符串，非法形态静默忽略（容错缺省空组）
                try {
                    const parsed = JSON.parse(bareItems);
                    if (Array.isArray(parsed)) host.setAttribute("data-items", JSON.stringify(parsed));
                } catch {
                    /* 非法 JSON 忽略 */
                }
            }
            // —— 属性折叠（dropdown 变换同款规则）——
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
                // 裸属性 = 开（布尔开关语义，carousel 惯例；裸 collapsed 即折叠，旧数值 1/2 亦归一为 true）
                if (attr.value === "") {
                    parts.push(`${propKey(kebabToCamel(attr.name))}: true`);
                    continue;
                }
                parts.push(`${propKey(kebabToCamel(attr.name))}: ${JSON.stringify(inferPropValue(attr.value))}`);
            }
            host.setAttribute(`x-component:${MENU_NAME}`, `{ ${parts.join(", ")} }`);
            while (el.firstChild) host.appendChild(el.firstChild);
            el.replaceWith(host);
        }
    });
}

bootstrapMenuPlugin();

/**
 * 双路径注册（模块加载期执行一次，经 {@link installPlugin} 单点）。
 */
function bootstrapMenuPlugin(): void {
    installPlugin((autospark) => {
        captureNamespace(autospark); // 运行时桥命名空间捕获（本插件当前零符号消费，预留统一通道）
        mountMenuPlugin(autospark);
    });
}

export { bootstrapMenuPlugin };
