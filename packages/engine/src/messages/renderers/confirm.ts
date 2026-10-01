import { buildComponentDef } from "../../compile/collect";
import type { ComponentDef } from "../../directives/component-def";
import { parseHtmlFragment } from "../../utils/transformElement";

/**
 * confirm renderer（kind='confirm' 专属区组件，ADR-0077）——**空占位**：确认按钮行走
 * shell 公共 actions 行（confirm = value-only actions 糖，S5 决议数据通道不变），
 * 无专属视觉。价值同 toast：结构对称 + `kinds.confirm.render` 整键替换扩展点。
 */

/** confirm renderer 模板：空占位（projection 位 = shell kind 出口内） */
export const CONFIRM_RENDERER_TEMPLATE = `<div></div>`;

/** 内置 confirm renderer 的定义缓存（懒构建，模块级单例） */
let builtinConfirmRenderer: { snapshot: HTMLElement; def: ComponentDef | null } | null = null;

/** 解析内置 confirm renderer（懒构建，同 shell 纪律） */
export function resolveConfirmRenderer(): { snapshot: HTMLElement; def: ComponentDef | null } {
    if (!builtinConfirmRenderer) {
        const root = parseHtmlFragment(CONFIRM_RENDERER_TEMPLATE)!.firstElementChild as HTMLElement;
        root.setAttribute("x-define", "confirm");
        const def = buildComponentDef(root, "confirm", (msg) => console.warn(msg));
        builtinConfirmRenderer = { snapshot: def.snapshot, def };
    }
    return builtinConfirmRenderer;
}
