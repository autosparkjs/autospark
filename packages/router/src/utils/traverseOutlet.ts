export type OutletRefs = WeakRef<HTMLElement>[][];

/**
 * 遍历并收集所有 outlet 元素，按层级分组返回
 * 使用 WeakRef 避免内存泄漏，允许元素被正常垃圾回收
 *
 * @param host - 宿主元素
 * @returns WeakRef<HTMLElement>[][] - 二维数组，索引 i 表示层级 i+1 的所有 outlets WeakRef 引用
 */
export function traverseOutlet(host: HTMLElement): OutletRefs {
    // 第一步：使用 querySelectorAll 一次性获取所有 outlets（性能优化）
    const allOutlets = Array.from(host.querySelectorAll("kylin-outlet"));

    if (allOutlets.length === 0) {
        return [];
    }

    // 第二步：为每个 outlet 计算 level 并收集
    const outletsWithLevel: Array<{
        outlet: HTMLElement;
        level: number;
    }> = [];

    for (const outlet of allOutlets) {
        const level = calculateOutletLevel(outlet, host);
        outletsWithLevel.push({ outlet, level });
    }

    // 第三步：找到最大层级
    const maxLevel = Math.max(...outletsWithLevel.map(({ level }) => level));

    // 第四步：创建二维数组（索引 i 存储层级 i+1 的 outlets）
    const groupedOutlets: WeakRef<HTMLElement>[][] = Array.from({ length: maxLevel }, () => []);

    // 第五步：按 level 分组（保持文档顺序），使用 WeakRef 包装
    outletsWithLevel.forEach(({ outlet, level }) => {
        // level 从 1 开始，数组索引从 0 开始，所以 level-1
        groupedOutlets[level - 1].push(new WeakRef(outlet));
    });

    return groupedOutlets;
}

/**
 * 计算 outlet 的层级深度
 * level = 直系祖先 outlet 数量 + 1
 *
 * @param outlet - 要计算的 outlet 元素
 * @param host - 宿主元素
 * @returns 层级深度
 */
function calculateOutletLevel(outlet: HTMLElement, host: HTMLElement): number {
    let level = 0;
    let element = outlet.parentElement;

    // 向上遍历父节点链，计算直系祖先 outlet 数量
    while (element && element !== host) {
        if (element.tagName.toLowerCase() === "kylin-outlet") {
            level++;
        }
        element = element.parentElement;
    }

    return level + 1;
}
