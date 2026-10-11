/**
 * 测试环境设置文件
 * 在所有测试运行前加载，设置必要的全局 mocks
 */

import { Window } from "happy-dom";
import { DOMParser } from "linkedom";

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
}

// 自动执行设置（用于 --preload 场景）
setupTestEnvironment();
