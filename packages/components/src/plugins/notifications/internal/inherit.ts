/**
 * 继承声明读取（自 engine engine/compile/inherit.ts vendor——`readInheritAttr` 纯函数）。
 * 通知插件装配链用途：type 组件快照未显式声明 `x-define:inherit` 时补写 shell 族根继承。
 */

/**
 * 读取元素上的继承声明（`x-define:inherit` 属性参数，ADR-0081；`x-define:extends` 为同义别名）。
 *
 * @returns trim 后的父组件名；未声明返回 null（空串 = 声明了但值为空，由解析器 warn + 拒绝）
 */
export function readInheritAttr(el: HTMLElement): string | null {
    for (const attr of Array.from(el.attributes)) {
        const n = attr.name;
        if (
            n === "x-define:inherit" ||
            n.startsWith("x-define:inherit.") ||
            n === "x-define:extends" ||
            n.startsWith("x-define:extends.")
        ) {
            return (attr.value ?? "").trim();
        }
    }
    return null;
}
