/**
 * autospark.menu 组件插件（组件库 P2 导航件，ADR-0018 清单权威表 navigation 行）：
 * 经插件全局组件表注册（ADR-0111 决策 5），跨 engine 真全局——晚注册立即生效，
 * 同名后注册覆盖先注册。
 *
 * 导航菜单：items（{ key, label, icon?, disabled?, children?[]（一层子菜单嵌套）}[]，
 * 状态引用注入）或子元素声明（<x-menu-item> 静态标量，支持一层嵌套 children）两形态；
 * mode 双形态（vertical 缺省 / horizontal——子菜单 hover 浮层下拉）+ collapsed
 * （垂直收起为图标条，子菜单右飞浮层）；受控 value（el.value 劫持桥 + change 冒泡
 * detail = { value } + input 回写 x-model）；子菜单点击展开收起（openKeys 内部维护，
 * 整体替换驱动）+ 激活值祖先链自动展开。
 *
 * 元素名快速写法 `<x-menu>` 由本文件的 precompile DOM 变换承载（tabs/breadcrumb 同款）：
 * - 静态属性折叠为 props 字面量（类型推断）、`:key="expr"` 响应式项以原始表达式拼进
 *   值对象字面量，class/style/id 与 data-、x-、@ 前缀属性保留给宿主（x-model 在场
 *   即经此激活值桥），子内容随迁为默认插槽；
 * - `<x-menu-item key label icon disabled>` 子元素声明（含嵌套子 x-menu-item 折叠为
 *   children）折叠为 items JSON 落 data-items 属性（字符串标量通道——规避值对象内
 *   字面量数组 props 的死环缺陷，P0 固化规避清单第 1 条），组件 mounted 解析写 data
 *   响应渲染；裸 items 属性（JSON 字符串）同经此通道（不进 props 值对象）。
 *
 * router 隔离（ADR-0018 决策 6 约定 2）：纯状态驱动、不 import router——激活态映射
 * 路由与点击接管以配方文档交付（组件文档 router 配方节，breadcrumb 同款）。
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

/** 组件注册名（autospark. 点前缀命名空间，ADR-0094；kebab 免疫 DOM 属性名小写化——注册名/产物/目录三对齐 kebab） */
export const MENU_NAME = "autospark.menu";

/**
 * 递归收集 <x-menu-item> 声明子树为 items 数据：key/label 必收，icon/disabled 可选
 * （裸 disabled 归一 true），嵌套子 x-menu-item 折叠为 children（v1 一层嵌配）。
 */
function collectMenuItem(el: Element): Record<string, unknown> {
    const entry: Record<string, unknown> = {
        key: el.getAttribute("key") ?? "",
        label: el.getAttribute("label") ?? "",
    };
    const icon = el.getAttribute("icon");
    if (icon != null) entry.icon = icon;
    if (el.hasAttribute("disabled")) entry.disabled = true;
    const children = Array.from(el.children).filter((c) => c.tagName.toLowerCase() === "x-menu-item");
    if (children.length) entry.children = children.map(collectMenuItem);
    return entry;
}

/**
 * 插件注册体：写插件全局组件表（普通 Record 赋值即生效，无 API 门面）。
 */
function mountMenuPlugin(autospark: typeof AutoSpark): void {
    autospark.components[MENU_NAME] = menuTemplate;
    autospark.precompile?.((engine: InstanceType<typeof AutoSpark>) => {
        for (const el of Array.from(engine.el.querySelectorAll("x-menu"))) {
            const host = document.createElement("div");
            // —— 子元素声明形态：<x-menu-item> 静量（含嵌套 children）折叠为 items JSON 落 data-items ——
            // 声明子元素恒摘除（其语法载体非内容）；JSON 序列化仅在 items 未声明时落盘
            // （props 状态引用优先）。裸 items 属性（JSON 字符串）同通道分流，不进 props 值对象
            const itemEls = Array.from(el.children).filter((c) => c.tagName.toLowerCase() === "x-menu-item");
            const bareItems = el.getAttribute("items");
            const boundItems = el.hasAttribute(":items");
            el.removeAttribute("items"); // JSON 字符串语义走 data-items 通道（不折进 props）
            const declared = itemEls.length > 0 || (bareItems != null && bareItems !== "");
            if (declared && !boundItems) {
                let items: unknown = null;
                if (itemEls.length) {
                    items = itemEls.map(collectMenuItem);
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
                    parts.push(`${propKey(kebabToCamel(attr.name))}: true`); // 裸属性 = 开（布尔开关语义，carousel 同款惯例——collapsed 写裸属性即启用）
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
