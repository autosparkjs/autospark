/**
 * x-slot 插槽标记识别与内容收集（ADR-0056）。
 *
 * 纯函数层：不依赖 engine/scope，供 collect（出口清单）、component/overlay（内容收集）
 * 与 SlotDirective（标记解析）共用。
 *
 * 两侧标记同形：
 * - 裸 `x-slot` / `x-slot.mod` → 默认出口/内容（名 `"default"`）；
 * - `x-slot:名称[.mod]` → 命名出口/内容；
 * - `x-slot-options` 等 `-options` 指令选项属性**不是**标记（不匹配 `x-slot` 正身、
 *   `x-slot.` 修饰前缀、`x-slot:` 属性参数前缀三者任一）。
 *
 * 内容侧值 = 解构形参（`{ item, index }` 简式，非 JSON）；出口侧值 = 对象字面量
 * （组件作用域求值）。形参解析只认简单键（无 rename/默认值）。
 */

/** 插槽标记（出口侧与内容侧共用的识别结果） */
export interface SlotMarker {
    /** 出口/内容名（裸 `x-slot` = `"default"`） */
    name: string;
    /** 标记命中的原始属性名（剥除时用；含修饰符形态） */
    attrName: string;
}

/** 内容侧一段插槽内容的收集产物（已克隆、已剥根标记属性） */
export interface SlotContent {
    /** 段名（`"default"` 或命名） */
    name: string;
    /**
     * 内容节点（深克隆、根标记属性已剥、深层嵌套标记已 warn+剥）。
     * 命名段恒单元素；默认段可为多根（裸子节点按文档序合并）。
     */
    nodes: ChildNode[];
    /** 内容侧解构形参键（裸子节点默认段恒 `[]`——无形参） */
    params: string[];
    /** 形参表达式原文（`{ item, index }`；无值 null）——出口侧 watch 注入时按 params 键抽取 */
    paramsExpr: string | null;
}

/** 属性名是否为插槽标记（裸 / 修饰 / 命名三形态；`x-slot-options` 不命中） */
function isSlotAttrName(name: string): boolean {
    return name === "x-slot" || name.startsWith("x-slot.") || name.startsWith("x-slot:");
}

/**
 * 识别元素上的插槽标记。
 *
 * @returns 标记（名 + 原始属性名）；无标记返回 null
 */
export function getSlotMarker(el: HTMLElement): SlotMarker | null {
    if (!(el instanceof HTMLElement)) return null;
    for (const attr of Array.from(el.attributes)) {
        const n = attr.name;
        if (n === "x-slot" || n.startsWith("x-slot.")) {
            return { name: "default", attrName: n };
        }
        if (n.startsWith("x-slot:")) {
            // 名取 `:` 后、`.` 前段（`x-slot:header.foo` → header；`.` 后为修饰符忽略）
            const rest = n.slice("x-slot:".length);
            const name = rest.split(".")[0] ?? "";
            return { name: name === "" ? "default" : name, attrName: n };
        }
    }
    return null;
}

/**
 * 解析内容侧解构形参 `{ item, index }` → 键列表。
 *
 * 仅认简单键（字母/数字/`_`/`$` 起头的标识符，无 rename、无默认值）。
 *
 * @returns 键列表；空 `{}` / 无值 → `[]`；形态非法（非对象字面量 / 含 rename）→ null（调用方 warn）
 */
export function parseSlotParams(raw: string | null | undefined): string[] | null {
    const s = (raw ?? "").trim();
    if (s === "") return [];
    const m = /^\{([\s\S]*)\}$/.exec(s);
    if (!m) return null;
    const inner = (m[1] ?? "").trim();
    if (inner === "") return [];
    const keys: string[] = [];
    for (const part of inner.split(",")) {
        const k = part.trim();
        if (k === "") continue;
        if (!/^[A-Za-z_$][\w$]*$/.test(k)) return null; // rename / 默认值 / 非法标识符
        keys.push(k);
    }
    return keys;
}

/** 剥除元素自身的全部插槽标记属性（内容克隆根 / 出口重复剥除共用） */
function stripOwnSlotAttrs(el: HTMLElement): void {
    const toRemove: string[] = [];
    for (const attr of Array.from(el.attributes)) {
        if (isSlotAttrName(attr.name)) toRemove.push(attr.name);
    }
    for (const n of toRemove) el.removeAttribute(n);
}

/**
 * 剥除后代嵌套插槽标记（ADR-0056 决策九：内容侧无深层分段）。
 *
 * 深层 `x-slot:*` → warn + 剥属性（元素保留为普通内容）。
 */
function stripNestedSlotMarkers(root: HTMLElement, warn: (msg: string) => void): void {
    for (const el of Array.from(root.querySelectorAll("*"))) {
        if (!(el instanceof HTMLElement)) continue;
        if (getSlotMarker(el)) {
            warn(
                `x-slot: 插槽内容内部的嵌套 x-slot 标记已忽略（内容分段仅认宿主直接子级，ADR-0056）`,
            );
            stripOwnSlotAttrs(el);
        }
    }
}

/** 文本节点是否纯空白 */
function isWhitespaceText(node: Node): boolean {
    return node.nodeType === Node.TEXT_NODE && (node.nodeValue ?? "").trim() === "";
}

/**
 * 收集标记元素的内容节点（深克隆、剥根标记、剥深层嵌套标记）。
 *
 * `<template x-slot:…>` 特例：template 不渲染，取其 **content 子节点**展开为多根
 * （对齐 Vue `<template slot>` 直觉）；其余元素保留为包裹层（单根）。
 *
 * @param warn 嵌套标记 warn 透传（collectSlotContent 闭包）
 */
function collectMarkerNodes(child: HTMLElement, warn: (msg: string) => void): ChildNode[] {
    if (child instanceof HTMLTemplateElement) {
        const nodes: ChildNode[] = [];
        for (const n of Array.from(child.content.childNodes)) {
            const clone = n.cloneNode(true);
            if (clone instanceof HTMLElement) stripNestedSlotMarkers(clone, warn);
            nodes.push(clone);
        }
        return nodes;
    }
    const clone = child.cloneNode(true) as HTMLElement;
    stripOwnSlotAttrs(clone);
    stripNestedSlotMarkers(clone, warn);
    return [clone];
}

/**
 * 从宿主**直接子级**收集插槽内容并按名分段（ADR-0056 决策三/七/九）。
 *
 * 分段规则：
 * - 带 `x-slot:名称` 的直接子元素 → 命名段（标记元素保留为包裹层，深克隆）；
 * - 其余（裸文本 / 未标记元素 / 裸 `x-slot` 标记）参与**默认段**；
 * - 默认段归属按文档序「首个胜出」：先见裸子节点则裸段胜（后见裸 `x-slot` 标记 warn 丢弃），
 *   反之标记胜（后见裸子节点 warn 丢弃）；两者只择其一。
 * - 裸子节点 trim 后全纯空白 → 默认段**未提供**（不构成内容）；
 *   命名标记元素**存在即提供**（空/纯空白也覆盖 fallback）。
 * - 同名多段 → 首个胜 + warn。
 * - 逐段比对出口清单 `slots`：无对应出口 → warn + 丢弃（`slots` 缺省视为无出口，全丢）。
 *
 * 模板只读契约（ADR-0002）：一律 `cloneNode(true)`，不摘模板原节点。
 *
 * @param host  宿主（x-component / x-dialog 的 template——ownsChildren 下内容留在模板）
 * @param slots 组件出口清单（`ComponentDef.slots`；undefined = 无出口）
 * @param warn  warn 日志
 * @returns 名 → 内容段；无任何有效段返回 null
 */
export function collectSlotContent(
    host: HTMLElement,
    slots: string[] | undefined,
    warn: (msg: string) => void,
): Map<string, SlotContent> | null {
    const named = new Map<string, SlotContent>();
    /** 裸默认段节点（文档序） */
    const bareNodes: ChildNode[] = [];
    /** 裸 `x-slot` 标记默认段 */
    let markerDefault: SlotContent | null = null;
    /** 首个裸子节点在直接子级中的序号（与标记段比较归属） */
    let firstBareIndex = -1;
    let markerIndex = -1;

    const children = Array.from(host.childNodes);
    for (let i = 0; i < children.length; i++) {
        const child = children[i]!;
        if (child.nodeType === Node.COMMENT_NODE) continue;
        if (child.nodeType === Node.TEXT_NODE) {
            if (isWhitespaceText(child) && bareNodes.length === 0 && firstBareIndex < 0) {
                // 领先的纯空白不启动裸段（避免前后空白让「全空白」误判为已提供）；
                // 已有裸节点时后续空白并入（保留段内空白文本）。
                // 但若尚无任何默认归属，纯空白仍不计入——全空白最终判未提供。
                // 例外：空白夹在命名段之间时也不该构成默认段——不计入即正确。
                continue;
            }
            if (firstBareIndex < 0) firstBareIndex = i;
            bareNodes.push(child.cloneNode(true));
            continue;
        }
        if (!(child instanceof HTMLElement)) {
            // 其余节点类型（罕见）：计入裸段
            if (firstBareIndex < 0) firstBareIndex = i;
            bareNodes.push(child.cloneNode(true));
            continue;
        }
        const marker = getSlotMarker(child);
        if (!marker) {
            // 未标记元素 → 裸默认段（剥深层嵌套标记，防内容编译期二次实例化 SlotDirective）
            if (firstBareIndex < 0) firstBareIndex = i;
            const clone = child.cloneNode(true) as HTMLElement;
            stripNestedSlotMarkers(clone, warn);
            bareNodes.push(clone);
            continue;
        }
        if (marker.name !== "default") {
            // 命名段
            if (named.has(marker.name)) {
                warn(`x-slot: 插槽内容 "${marker.name}" 重复，后者已忽略（ADR-0056）`);
                continue;
            }
            const rawVal = child.getAttribute(marker.attrName);
            let params = parseSlotParams(rawVal);
            if (params === null) {
                warn(
                    `x-slot: 内容 "${marker.name}" 的形参须为简单解构形（{ item, index }），已按无形参处理`,
                );
                params = [];
            }
            named.set(marker.name, {
                name: marker.name,
                nodes: collectMarkerNodes(child, warn),
                params,
                paramsExpr: params.length > 0 ? (rawVal ?? "").trim() || null : null,
            });
            continue;
        }
        // 裸 `x-slot` 标记 → 默认段（标记形态）
        if (markerDefault) {
            warn(`x-slot: 默认插槽内容重复（裸 x-slot 标记），后者已忽略（ADR-0056）`);
            continue;
        }
        markerIndex = i;
        const rawVal = child.getAttribute(marker.attrName);
        let params = parseSlotParams(rawVal);
        if (params === null) {
            warn(`x-slot: 默认插槽标记的形参须为简单解构形（{ item }），已按无形参处理`);
            params = [];
        }
        markerDefault = {
            name: "default",
            nodes: collectMarkerNodes(child, warn),
            params,
            paramsExpr: params.length > 0 ? (rawVal ?? "").trim() || null : null,
        };
    }

    // 默认段归属：裸 vs 标记，文档序首个胜 + 另一方 warn 丢弃
    const map = new Map<string, SlotContent>(named);
    const hasBare = bareNodes.length > 0;
    if (hasBare && markerDefault) {
        if (markerIndex >= 0 && firstBareIndex >= 0 && markerIndex < firstBareIndex) {
            warn(
                `x-slot: 默认插槽同时存在裸 x-slot 标记与裸子节点，标记在前——裸子节点已丢弃（ADR-0056）`,
            );
            map.set("default", markerDefault);
        } else {
            warn(
                `x-slot: 默认插槽同时存在裸子节点与裸 x-slot 标记，裸子节点在前——x-slot 标记已丢弃（ADR-0056）`,
            );
            map.set("default", {
                name: "default",
                nodes: bareNodes,
                params: [],
                paramsExpr: null,
            });
        }
    } else if (markerDefault) {
        map.set("default", markerDefault);
    } else if (hasBare) {
        // 裸段全纯空白 → 未提供（leading/trailing 空白已被跳过；中间空白+元素/非空白文本 = 已提供）
        // 再保险：若全部节点仍是纯空白文本 → 未提供
        const allWs = bareNodes.every((n) => isWhitespaceText(n));
        if (!allWs) {
            map.set("default", {
                name: "default",
                nodes: bareNodes,
                params: [],
                paramsExpr: null,
            });
        }
    }

    // 出口清单校验：无对应出口 → warn + 丢弃
    const slotSet = slots ? new Set(slots) : null;
    const result = new Map<string, SlotContent>();
    for (const [name, content] of map) {
        if (!slotSet || !slotSet.has(name)) {
            warn(
                `x-slot: 内容 "${name}" 无对应出口（组件未声明该 x-slot 出口），已丢弃（ADR-0056）`,
            );
            continue;
        }
        result.set(name, content);
    }
    return result.size > 0 ? result : null;
}
