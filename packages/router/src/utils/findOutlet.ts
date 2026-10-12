/**
 * 检查元素的祖先中是否包含 outlet 组件宿主（data-autospark-outlet 标记）
 */
function hasOutletAncestor(el: Element, root: HTMLElement): boolean {
    let parent = el.parentElement;
    while (parent) {
        if (parent === root) return false;
        if (parent instanceof HTMLElement && parent.hasAttribute("data-autospark-outlet")) {
            return true;
        }
        parent = parent.parentElement;
    }
    return false;
}

/**
 * 在指定元素内部查找 autospark.outlet 组件宿主
 *
 * 宿主标记 = 组件模板根元素自带的 data-autospark-outlet 属性（编译保留，见 outletComponent.ts）。
 * 采用广度优先遍历（BFS），同一分支找到第一个 outlet 后不再深入——保证返回的是
 * 「离根最近」的出口层级，嵌套出口（远程模板内的 x-outlet）由更深层调用各自查找。
 *
 * @param el - 要搜索的父元素
 * @returns 找到的 outlet 宿主元素数组，按层级顺序排列
 */
export function findOutlet(el: HTMLElement): HTMLElement[] {
    if (!el) return [];

    const result: HTMLElement[] = [];
    const queue: HTMLElement[] = [el];

    while (queue.length > 0) {
        const current = queue.shift()!;

        for (const child of Array.from(current.children)) {
            // 跳过已有 outlet 祖先的元素（嵌套在已找到的 outlet 内部）
            if (hasOutletAncestor(child, el)) {
                continue;
            }

            if (child instanceof HTMLElement && child.hasAttribute("data-autospark-outlet")) {
                result.push(child);
                // 不将 outlet 加入队列，自然就不会遍历其子元素
            } else if (child instanceof HTMLElement) {
                queue.push(child);
            }
        }
    }

    return result;
}
