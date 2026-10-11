import type { KylinOutlet } from "@/components/Outlet";

/**
 * 检查元素的祖先中是否包含 kylin-outlet
 */
function hasOutletAncestor(el: HTMLElement, root: HTMLElement): boolean {
    let parent = el.parentElement;
    while (parent) {
        if (parent === root) return false;
        if (parent.tagName === "KYLIN-OUTLET") {
            return true;
        }
        parent = parent.parentElement;
    }
    return false;
}

/**
 * 在指定元素内部查找 kylin-outlet 元素
 * 采用广度优先遍历（BFS），同一分支找到第一个 outlet 后停止深入
 * @param el - 要搜索的父元素
 * @returns 找到的 kylin-outlet 元素数组，按层级顺序排列
 */
export function findOutlet(el: HTMLElement): KylinOutlet[] {
    if (!el) return [];

    const result: KylinOutlet[] = [];
    const queue: HTMLElement[] = [el];
    const OUTLET_TAG = "KYLIN-OUTLET";

    while (queue.length > 0) {
        const current = queue.shift()!;

        for (const child of current.children) {
            const childEl = child as HTMLElement;
            // 跳过已有 outlet 祖先的元素（嵌套在已找到的 outlet 内部）
            if (hasOutletAncestor(childEl, el)) {
                continue;
            }

            if (child.tagName === OUTLET_TAG) {
                result.push(childEl as KylinOutlet);
                // 不将 outlet 加入队列，自然就不会遍历其子元素
            } else {
                queue.push(childEl);
            }
        }
    }

    return result;
}
