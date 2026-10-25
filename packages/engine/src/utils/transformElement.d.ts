/** 节点过滤器：返回 true 表示该节点命中此转换器（始终接收原始 Node） */
export type NodeFilter = (node: Node) => boolean;
/**
 * "占有子树"信号：挂接 `node` 到新树，但**跳过其子节点递归**。
 *
 * 供结构指令（如 x-for）使用：其子节点不由通用 walk 自动编译，而由指令自行编译，
 * 避免"正常通道编译一次 + 指令克隆再编译"的双重编译冲突。
 */
export type OwnsChildrenResult = {
    node: Node;
    ownsChildren: true;
};
/**
 * 节点转换器。
 *
 * @typeParam T - 当前节点的精确类型，默认 `Node`；可收窄为 `HTMLElement`/`Text` 等以获得更精确的类型推断。
 * @param node - 当前节点
 * @returns 新节点、HTML 字符串、占有子树信号或空值：
 *   - 返回 `Node` → 用其替换原节点，并继续递归处理原子节点
 *   - 返回 `string` → 按 HTML 片段用 `<template>` 解析，所有顶层节点替代原节点（原内容丢弃、不递归）
 *   - 返回 `{ node, ownsChildren: true }` → 挂接 `node`，但**不递归其子节点**（子节点由调用方自行处理）
 *   - 返回 `null`/`undefined`/空字符串 → 丢弃该节点及其整个子树（剪枝）
 */
export type NodeTransform<T extends Node = Node> = (node: T) => Node | string | null | undefined | OwnsChildrenResult;
/** 转换器对：`[filter, transform]`，按数组顺序首个命中即生效 */
export type NodeTransformer<T extends Node = Node> = [
    filter: NodeFilter,
    transform: NodeTransform<T>
];
/**
 * 将 HTML 字符串解析为 DocumentFragment。
 *
 * 用 `<template>` 元素的 innerHTML 解析——inert（不执行脚本、不加载资源、不渲染），
 * 且能正确处理 `<tr>`/`<td>`/`<option>` 等需特定父上下文的元素
 * （`<div>.innerHTML` 会丢弃这些元素）。
 *
 * @param html - HTML 片段字符串
 * @returns 解析后的 DocumentFragment；空或纯空白字符串返回 `null`（表示剪枝）
 */
export declare function parseHtmlFragment(html: string): DocumentFragment | null;
/**
 * 顶级单根判定：片段是否为「恰好一个根元素」（同级无非空白文本）。
 *
 * 组件字符串入参的两套规范化规则共用此判定——差异只在「不单根时怎么办」（ADR-0086）：
 * - 自动包装版（`options.components` / `options.uiShells` 字符串，ADR-0022/0077）：不单根则包一层 `<div x-define>`；
 * - 严格注册版（`engine.registerComponent`）：不单根则 warn + 拒绝注册。
 *
 * 注释节点与缩进空白不参与判定（HTML 片段常带二者，二者不改变「单根」语义）；
 * 元素 + 文本混排视为**不**单根（顶级文本无从归属组件根）。
 *
 * @param frag - 待判定的片段（须非空）
 * @returns 唯一根元素；不满足单根形态返回 `null`
 */
export declare function pickSingleRootElement(frag: DocumentFragment): HTMLElement | null;
/**
 * 深度优先遍历 DOM 树，基于 `transformers` 声明式地重建一棵新树。
 *
 * 原树保持只读、不会被修改；函数返回由转换器构建出的全新根元素。
 *
 * 遍历规则：
 * - 对**每个节点**（元素/文本/注释等）按 `transformers` 数组顺序匹配：
 *   - **首个** `filter` 返回 `true` 的转换器生效（first-match-wins）
 *   - 命中的 `transform` 返回 `Node` → 用其替换原节点，并继续递归处理原子节点
 *   - 命中的 `transform` 返回 `string` → 按 HTML 片段用 `<template>` 解析，所有顶层节点替代原节点（原内容丢弃、不递归；生成的节点视为成品，不再走 transformers）
 *   - 命中的 `transform` 返回 `{ node, ownsChildren: true }` → 挂接 `node`，但**不递归其子节点**（结构指令占有子树，子节点由其自行编译）
 *   - 命中的 `transform` 返回 `null`/`undefined`/空字符串 → 丢弃该节点及其整个子树（剪枝）
 *   - **无任何 `filter` 命中** → 浅克隆原节点（`cloneNode(false)`），继续递归子节点
 * - `filter` 可按 `nodeType`/`nodeName` 等对节点类型分流
 * - 根节点的字符串替换必须只产生一个节点，否则抛异常
 *
 * 类型约定：
 * - `transform` 的 `node` 支持所有节点类型；通过泛型 `T` 可收窄到具体类型（如 `HTMLElement`/`Text`）
 *   以获得精确的属性推断。默认 `T = Node`。工具内部对 `node` 做 `as T` 断言，
 *   类型安全性由调用方 `filter` 保证（约定：`filter` 返回 `true` ⇔ `node` 是 `T`）。
 *
 * @typeParam T - `transform` 处理的目标节点类型，默认 `Node`
 * @param el - 原始根元素（保持只读）
 * @param transformers - 转换器对数组，按序首个命中即生效
 * @returns 由转换器构建出的新根元素
 * @throws 根节点被转换器剪枝时抛出异常
 */
export declare function transformElement<T extends Node = Node>(el: HTMLElement, transformers: NodeTransformer<T>[]): HTMLElement;
