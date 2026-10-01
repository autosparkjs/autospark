import { buildComponentDef } from "../../compile/collect";
import type { ComponentDef } from "../../directives/component-def";
import { parseHtmlFragment } from "../../utils/transformElement";

/**
 * toast renderer（kind='toast' 专属区组件，ADR-0077）——**空占位**：toast 的全部视觉都由
 * 公共 shell 承担（close/type/title/description/actions），无专属内容。价值在结构对称：
 * 三个内置 kind 在 `kinds[kind].render` 覆盖链上完全一致，用户可整键替换 toast 专属区
 * 做扩展（零新机制）。空元素零内容天然不占位。
 */

/** toast renderer 模板：空占位（projection 位 = shell kind 出口内） */
export const TOAST_RENDERER_TEMPLATE = `<div></div>`;

/** 内置 toast renderer 的定义缓存（懒构建，模块级单例） */
let builtinToastRenderer: { snapshot: HTMLElement; def: ComponentDef | null } | null = null;

/** 解析内置 toast renderer（懒构建，同 shell 纪律） */
export function resolveToastRenderer(): { snapshot: HTMLElement; def: ComponentDef | null } {
    if (!builtinToastRenderer) {
        const root = parseHtmlFragment(TOAST_RENDERER_TEMPLATE)!.firstElementChild as HTMLElement;
        root.setAttribute("x-define", "toast");
        const def = buildComponentDef(root, "toast", (msg) => console.warn(msg));
        builtinToastRenderer = { snapshot: def.snapshot, def };
    }
    return builtinToastRenderer;
}
