/**
 * 测试环境设置文件
 * 在所有测试运行前加载，设置必要的全局 mocks
 */

import { Window } from "happy-dom";
import { DOMParser } from "linkedom";

/**
 * happy-dom（20.x / 21.0.1）属性索引缺陷的绕行。
 *
 * happy-dom 把属性名里的 `:` 当作前缀分隔符解析：`setAttribute(":class", …)` 得到的
 * 属性 `localName` 仍是 `class`，于是它与模板里的原生 `class` 属性共用
 * `itemsByNamespaceURI` 的 `":class"` 索引键。engine 编译期 `removeDirectives` 移除
 * `:class` 指令属性时，会把原生 `class` 的索引一并删掉——此后 `getAttribute("class")`
 * / `classList` 读到旧值、`outerHTML` 却是新值（后续 setAttribute 还会在
 * `itemsByName` 里堆出两条 class 记录）。
 *
 * 绕行方式：移除以 `:` 开头的指令属性后，若元素上仍存在同名原生属性，则以当前值
 * 重建（remove + set 把三张索引表恢复一致）。仅测试环境需要——真实浏览器无此缺陷。
 */
function patchHappyDomColonAttributeBug(win: Window): void {
    const proto = (win as any).HTMLElement?.prototype;
    if (!proto || proto.__autosparkColonAttrPatched) return;
    const originalRemoveAttribute: (name: string) => void = proto.removeAttribute;

    proto.removeAttribute = function (this: any, name: string): void {
        originalRemoveAttribute.call(this, name);
        const key = String(name);
        if (!key.startsWith(":")) return;
        const plain = key.slice(1);
        if (!plain) return;
        // NamedNodeMap 迭代走 items 表（未损坏），据此取原生属性的真实当前值
        let value: string | null | undefined;
        for (const attr of Array.from(this.attributes ?? [])) {
            if ((attr as any).name === plain) {
                value = (attr as any).value;
                break;
            }
        }
        if (value === undefined || value === null) return;
        // remove + set 一次：把 items / itemsByName / itemsByNamespaceURI 三张索引重建一致
        originalRemoveAttribute.call(this, plain);
        this.setAttribute(plain, value);
    };
    proto.__autosparkColonAttrPatched = true;
}

/**
 * 初始化测试环境
 * 设置全局 DOM 环境和必要的 mocks
 */
export function setupTestEnvironment(): void {
    // 创建一个全局 window 对象用于 Alpine.js
    const win = new Window({ url: "http://localhost/" });

    // @ts-ignore
    globalThis.window = win;
    // @ts-ignore
    globalThis.document = win.document;
    // @ts-ignore
    globalThis.Node = win.Node;
    // @ts-ignore
    globalThis.NodeList = win.NodeList;

    // Mock MutationObserver for Alpine.js
    // @ts-ignore
    globalThis.MutationObserver = class MockMutationObserver {
        constructor(callback: MutationCallback) {}
        disconnect() {}
        observe(node: Node, options: any) {}
        takeRecords(): MutationRecord[] {
            return [];
        }
    };

    // Mock RequestAnimationFrame
    // @ts-ignore
    globalThis.requestAnimationFrame = (callback: FrameRequestCallback) => {
        return setTimeout(callback, 16) as unknown as number;
    };

    // @ts-ignore
    globalThis.cancelAnimationFrame = (handle: number) => {
        clearTimeout(handle);
    };

    // DOMParser 来源于 happy-dom 的 Window 实例
    // @ts-ignore
    globalThis.DOMParser = DOMParser;

    // router / engine 构造期与模块加载期引用的一组 DOM 全局：从 happy-dom 的 Window 桥接。
    // 仅补缺，不覆盖上文已注册的 window/document/Node/MutationObserver 等。
    // （components/* 在模块加载期读取 customElements，缺了会直接抛 ReferenceError）
    for (const key of [
        "HTMLElement", "HTMLScriptElement", "HTMLStyleElement", "HTMLTemplateElement",
        "HTMLInputElement", "HTMLAnchorElement", "HTMLSpanElement", "HTMLDivElement",
        "SVGElement", "DocumentFragment", "ShadowRoot", "Text", "Comment",
        "NodeFilter", "TreeWalker", "Range", "Element", "Document",
        "Event", "MouseEvent", "KeyboardEvent", "CustomEvent", "PointerEvent",
        "History", "Location", "URL", "URLSearchParams", "FormData", "Blob",
        "getComputedStyle", "customElements", "CSSStyleSheet",
        "history", "location", "console", "AbortController", "AbortSignal",
    ] as const) {
        if ((globalThis as any)[key] === undefined && (win as any)[key] !== undefined) {
            (globalThis as any)[key] = (win as any)[key];
        }
    }

    // history / location 始终与当前 window 同步（每个用例重建 window 后必须跟着换）
    // @ts-ignore
    globalThis.history = win.history;
    // @ts-ignore
    globalThis.location = win.location;

    patchHappyDomColonAttributeBug(win);
}

// 自动执行设置（用于 --preload 场景）
setupTestEnvironment();

/**
 * 自建 engine 模式（ADR-0002 产物零耦合契约）：router 不 import engine 产物，构造期
 * 经 `window.AutoSparkSpaces.AutoSpark` 探测构造器。测试环境注入真实 engine，使未显式
 * 传 `options.engine` 的用例走完整自建管线（x-outlet 预处理 → 编译 → outlet 组件）。
 */
const { AutoSpark } = await import("autospark");
(globalThis as any).AutoSparkSpaces = { AutoSpark };
