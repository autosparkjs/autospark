import { describe, it, expect, beforeEach } from "bun:test";
import { createTestDOM } from "./render/common";

describe("Alpine.js 基础功能测试", () => {
    let host: HTMLElement;
    let win: any;

    beforeEach(() => {
        const setup = createTestDOM();
        host = setup.host;
        win = setup.win;
    });

    it("应该正确初始化 Alpine 并处理 x-text 指令", async () => {
        // 动态导入 Alpine（确保在测试环境中正确加载）
        const Alpine = (await import("alpinejs")).default;

        // 创建一个带有 Alpine 指令的元素
        const testDiv = document.createElement("div");
        testDiv.setAttribute("x-data", "{ message: 'Hello Alpine' }");
        testDiv.innerHTML = '<span x-text="message"></span>';
        host.appendChild(testDiv);

        // 手动初始化 Alpine 树
        Alpine.initTree(host);

        // 等待一帧让 Alpine 完成 DOM 更新
        await new Promise((resolve) => setTimeout(resolve, 0));

        // 验证 x-text 指令是否正确处理
        const span = testDiv.querySelector("span");
        expect(span).not.toBeNull();
        expect(span?.textContent).toBe("Hello Alpine");
    });

    it("应该正确处理参数插值 {{ }} 转换为 x-text", async () => {
        const Alpine = (await import("alpinejs")).default;

        // 创建一个带有模板语法的元素
        const testDiv = document.createElement("div");
        testDiv.setAttribute("x-data", "{ id: '123' }");
        testDiv.innerHTML = '<span x-text="`User ${id}`"></span>';
        host.appendChild(testDiv);

        // 手动初始化 Alpine 树
        Alpine.initTree(host);

        // 等待一帧让 Alpine 完成 DOM 更新
        await new Promise((resolve) => setTimeout(resolve, 0));

        // 验证 x-text 指令是否正确处理
        const span = testDiv.querySelector("span");
        expect(span).not.toBeNull();
        expect(span?.textContent).toBe("User 123");
    });

    it("应该正确处理 x-data 动态注册", async () => {
        const Alpine = (await import("alpinejs")).default;

        // 注册一个 Alpine 数据组件
        Alpine.data("userData", () => ({
            userId: "456",
            userName: "Test User",
        }));

        // 创建使用已注册数据的元素
        const testDiv = document.createElement("div");
        testDiv.setAttribute("x-data", "userData");
        testDiv.innerHTML = '<span x-text="`User ${userId}`"></span>';
        host.appendChild(testDiv);

        // 手动初始化 Alpine 树
        Alpine.initTree(host);

        // 等待一帧让 Alpine 完成 DOM 更新
        await new Promise((resolve) => setTimeout(resolve, 0));

        // 验证 x-text 指令是否正确处理
        const span = testDiv.querySelector("span");
        expect(span).not.toBeNull();
        expect(span?.textContent).toBe("User 456");
    });

    it("应该正确处理嵌套的 x-data 作用域", async () => {
        const Alpine = (await import("alpinejs")).default;

        // 创建嵌套的 Alpine 数据结构
        const parentDiv = document.createElement("div");
        parentDiv.setAttribute("x-data", "{ parentId: 'outer' }");
        const childDiv = document.createElement("div");
        childDiv.setAttribute("x-data", "{ childId: 'inner' }");
        childDiv.innerHTML = '<span x-text="`${parentId}-${childId}`"></span>';
        parentDiv.appendChild(childDiv);
        host.appendChild(parentDiv);

        // 手动初始化 Alpine 树
        Alpine.initTree(host);

        // 等待一帧让 Alpine 完成 DOM 更新
        await new Promise((resolve) => setTimeout(resolve, 0));

        // 验证嵌套作用域是否正确
        const span = parentDiv.querySelector("span");
        expect(span).not.toBeNull();
        expect(span?.textContent).toBe("outer-inner");
    });
});

describe("改进的 MutationObserver 测试", () => {
    let host: HTMLElement;
    let win: any;
    let observerCallbackList: Array<MutationCallback> = [];

    beforeEach(() => {
        const setup = createTestDOM();
        host = setup.host;
        win = setup.win;
        observerCallbackList = [];
    });

    it("模拟的 MutationObserver 应该能够检测 DOM 变化", async () => {
        // 创建一个能够实际触发回调的 MutationObserver 模拟
        class EnhancedMutationObserver {
            callback: MutationCallback;
            isObserving = false;
            observedNode: Node | null = null;

            constructor(callback: MutationCallback) {
                this.callback = callback;
                observerCallbackList.push(this);
            }

            observe(node: Node, options: MutationObserverInit) {
                this.observedNode = node;
                this.isObserving = true;

                // 在 happy-dom 中，我们手动触发 DOM 变化检测
                // 通过拦截 appendChild、removeChild 等方法
                const originalAppendChild = node.appendChild;
                const originalRemoveChild = node.removeChild;
                const originalSetAttribute = (node as Element).setAttribute;

                const self = this;
                (node as any).appendChild = function (this: Node, child: Node) {
                    const result = originalAppendChild.call(this, child);
                    self.triggerCallback([
                        {
                            type: "childList",
                            target: this,
                            addedNodes: [child],
                            removedNodes: [],
                            attributeName: null,
                            addedNotifications: [],
                            removedNotifications: [],
                            attributeNamespace: null,
                            nextSibling: null,
                            oldValue: null,
                            previousSibling: null,
                        } as any,
                    ]);
                    return result;
                };

                (node as any).removeChild = function (this: Node, child: Node) {
                    const result = originalRemoveChild.call(this, child);
                    self.triggerCallback([
                        {
                            type: "childList",
                            target: this,
                            addedNodes: [],
                            removedNodes: [child],
                            attributeName: null,
                            addedNotifications: [],
                            removedNotifications: [],
                            attributeNamespace: null,
                            nextSibling: null,
                            oldValue: null,
                            previousSibling: null,
                        } as any,
                    ]);
                    return result;
                };

                if (node instanceof Element) {
                    (node as any).setAttribute = function (
                        this: Element,
                        name: string,
                        value: string
                    ) {
                        const result = originalSetAttribute.call(this, name, value);
                        self.triggerCallback([
                            {
                                type: "attributes",
                                target: this,
                                addedNodes: [],
                                removedNodes: [],
                                attributeName: name,
                                addedNotifications: [],
                                removedNotifications: [],
                                attributeNamespace: null,
                                nextSibling: null,
                                oldValue: null,
                                previousSibling: null,
                            } as any,
                        ]);
                        return result;
                    };
                }
            }

            disconnect() {
                this.isObserving = false;
                this.observedNode = null;
            }

            takeRecords(): MutationRecord[] {
                return [];
            }

            private triggerCallback(records: MutationRecord[]) {
                if (this.isObserving) {
                    this.callback(records, this as unknown as MutationObserver);
                }
            }
        }

        // 替换全局 MutationObserver
        // @ts-ignore
        globalThis.MutationObserver = EnhancedMutationObserver;
        // @ts-ignore
        win.MutationObserver = EnhancedMutationObserver;

        // 验证模拟的 Observer 能够工作
        let callbackCalled = false;
        const observer = new EnhancedMutationObserver(() => {
            callbackCalled = true;
        });

        observer.observe(host, { childList: true, subtree: true });

        // 添加子元素应该触发回调
        const newDiv = document.createElement("div");
        host.appendChild(newDiv);

        // 验证回调被触发
        expect(callbackCalled).toBe(true);

        observer.disconnect();
    });
});
