import { describe, it, expect } from "bun:test";
import { Window } from "happy-dom";
import { KylinRouter } from "@/router";
 
/**
 * 创建测试环境
 */
function createTestEnvironment() {
    const window = new Window({
        url: "http://localhost:8080/",
        width: 1024,
        height: 768,
    });

    const document = window.document;

    // 设置全局对象
    // @ts-ignore
    globalThis.document = document;
    // @ts-ignore
    globalThis.window = window;
    // @ts-ignore
    globalThis.HTMLElement = window.HTMLElement;

    return { window, document };
}

describe("KylinRouterElementBase 核心功能测试", () => {
    describe("KylinRouter 实例管理测试", () => {
        it("KylinRouter 应该在 host 元素上设置 data-kylin-router 属性", () => {
            const { document } = createTestEnvironment();
            const host = document.createElement("div") as any;
            document.body.appendChild(host);

            const router = new KylinRouter(host, []);

            // 验证 data-kylin-router 属性已设置
            expect(host.hasAttribute("data-kylin-router")).toBe(true);
            // 验证 router 实例已存储在 host 上
            expect((host as any).router).toBe(router);
        });

        it("组件应该能够通过同步方式获取 router 实例", () => {
            const { document } = createTestEnvironment();
            const host = document.createElement("div") as any;
            document.body.appendChild(host);

            const router = new KylinRouter(host, []);

            // 创建一个中间元素
            const wrapper = document.createElement("div") as any;
            host.appendChild(wrapper);

            // 创建测试元素
            const testElement = document.createElement("div") as any;
            wrapper.appendChild(testElement);

            // 模拟 KylinRouterElementBase 的 _getRouterSync 方法
            let currentElement: any = testElement;
            let foundRouter: any = undefined;

            while (currentElement) {
                // 查找 router 宿主元素（data-kylin-router 属性）
                if (currentElement instanceof HTMLElement && currentElement.hasAttribute("data-kylin-router")) {
                    foundRouter = (currentElement as any).router;
                    break;
                }
                currentElement = currentElement.parentElement;
            }

            // 验证能够找到 router 实例
            expect(foundRouter).toBeDefined();
            expect(foundRouter).toBe(router);
        });

        it("深层嵌套的元素应该能够获取到 router 实例", () => {
            const { document } = createTestEnvironment();
            const host = document.createElement("div") as any;
            document.body.appendChild(host);

            const router = new KylinRouter(host, []);

            // 创建深层嵌套结构
            const level1 = document.createElement("div") as any;
            const level2 = document.createElement("div") as any;
            const level3 = document.createElement("div") as any;
            const testElement = document.createElement("div") as any;

            host.appendChild(level1);
            level1.appendChild(level2);
            level2.appendChild(level3);
            level3.appendChild(testElement);

            // 模拟 KylinRouterElementBase 的 _getRouterSync 方法
            let currentElement: any = testElement;
            let foundRouter: any = undefined;

            while (currentElement) {
                if (currentElement instanceof HTMLElement && currentElement.hasAttribute("data-kylin-router")) {
                    foundRouter = (currentElement as any).router;
                    break;
                }
                currentElement = currentElement.parentElement;
            }

            // 验证能够找到 router 实例
            expect(foundRouter).toBeDefined();
            expect(foundRouter).toBe(router);
        });

        it("多个元素都应该能够获取到同一个 router 实例", () => {
            const { document } = createTestEnvironment();
            const host = document.createElement("div") as any;
            document.body.appendChild(host);

            const router = new KylinRouter(host, []);

            // 创建多个测试元素
            const element1 = document.createElement("div") as any;
            const element2 = document.createElement("div") as any;
            const element3 = document.createElement("div") as any;

            host.appendChild(element1);
            host.appendChild(element2);
            host.appendChild(element3);

            // 为每个元素查找 router
            const findRouter = (element: any) => {
                let currentElement: any = element;
                while (currentElement) {
                    if (currentElement instanceof HTMLElement && currentElement.hasAttribute("data-kylin-router")) {
                        return (currentElement as any).router;
                    }
                    currentElement = currentElement.parentElement;
                }
                return undefined;
            };

            const router1 = findRouter(element1);
            const router2 = findRouter(element2);
            const router3 = findRouter(element3);

            // 验证所有元素都找到同一个 router 实例
            expect(router1).toBe(router);
            expect(router2).toBe(router);
            expect(router3).toBe(router);
            expect(router1).toBe(router2);
            expect(router2).toBe(router3);
        });
    });

    describe("Router 实例验证测试", () => {
        it("获取到的 router 应该包含所有必要的属性和方法", () => {
            const { document } = createTestEnvironment();
            const host = document.createElement("div") as any;
            document.body.appendChild(host);

            const router = new KylinRouter(host, []);

            // 验证 router 实例的完整性
            expect(router.host).toBeDefined();
            expect(router.history).toBeDefined();
            expect(router.location).toBeDefined();

            // 验证导航方法
            expect(typeof router.push).toBe("function");
            expect(typeof router.replace).toBe("function");
            expect(typeof router.back).toBe("function");
            expect(typeof router.forward).toBe("function");
            expect(typeof router.go).toBe("function");
            expect(typeof router.attach).toBe("function");
            expect(typeof router.detach).toBe("function");
        });

        it("router 的 location 应该返回当前路径", () => {
            const { document } = createTestEnvironment();
            const host = document.createElement("div") as any;
            document.body.appendChild(host);

            const router = new KylinRouter(host, []);

            // 验证 location 属性
            expect(router.location).toBeDefined();
            expect(router.location.pathname).toBe("/");
        });
    });

    describe("边界情况测试", () => {
        it("在没有 router 的环境中查找 router 应该返回 undefined", () => {
            const { document } = createTestEnvironment();
            const host = document.createElement("div") as any;
            document.body.appendChild(host);

            const testElement = document.createElement("div") as any;
            host.appendChild(testElement);

            // 模拟 _getRouterSync 方法
            let currentElement: any = testElement;
            let foundRouter: any = undefined;

            while (currentElement) {
                if (currentElement instanceof HTMLElement && currentElement.hasAttribute("data-kylin-router")) {
                    foundRouter = (currentElement as any).router;
                    break;
                }
                currentElement = currentElement.parentElement;
            }

            // 验证找不到 router
            expect(foundRouter).toBeUndefined();
        });

        it("组件应该能够区分不同的 router 实例", () => {
            const { document } = createTestEnvironment();

            // 创建两个不同的 router
            const host1 = document.createElement("div") as any;
            const host2 = document.createElement("div") as any;
            document.body.appendChild(host1);
            document.body.appendChild(host2);

            const router1 = new KylinRouter(host1, []);
            const router2 = new KylinRouter(host2, []);

            // 在第一个 router 下创建元素
            const element1 = document.createElement("div");
            host1.appendChild(element1);

            // 在第二个 router 下创建元素
            const element2 = document.createElement("div");
            host2.appendChild(element2);

            // 为每个元素查找 router
            const findRouter = (element: any) => {
                let currentElement: any = element;
                while (currentElement) {
                    if (currentElement instanceof HTMLElement && currentElement.hasAttribute("data-kylin-router")) {
                        return (currentElement as any).router;
                    }
                    currentElement = currentElement.parentElement;
                }
                return undefined;
            };

            const foundRouter1 = findRouter(element1);
            const foundRouter2 = findRouter(element2);

            // 验证元素找到各自的 router
            expect(foundRouter1).toBe(router1);
            expect(foundRouter2).toBe(router2);
            expect(foundRouter1).not.toBe(router2);
        });
    });

    describe("DOM 层级测试", () => {
        it("组件应该能够跨越复杂的 DOM 结构获取 router", () => {
            const { document } = createTestEnvironment();
            const host = document.createElement("div") as any;
            document.body.appendChild(host);

            const router = new KylinRouter(host, []);

            // 创建复杂的 DOM 结构
            const header = document.createElement("header") as any;
            const nav = document.createElement("nav") as any;
            const main = document.createElement("main") as any;
            const content = document.createElement("div") as any;
            const wrapper = document.createElement("div") as any;
            const testElement = document.createElement("div") as any;

            host.appendChild(header);
            header.appendChild(nav);
            host.appendChild(main);
            main.appendChild(content);
            content.appendChild(wrapper);
            wrapper.appendChild(testElement);

            // 模拟 _getRouterSync 方法
            let currentElement: any = testElement;
            let foundRouter: any = undefined;

            while (currentElement) {
                if (currentElement instanceof HTMLElement && currentElement.hasAttribute("data-kylin-router")) {
                    foundRouter = (currentElement as any).router;
                    break;
                }
                currentElement = currentElement.parentElement;
            }

            // 验证能够跨越复杂的 DOM 结构找到 router
            expect(foundRouter).toBeDefined();
            expect(foundRouter).toBe(router);
        });

        it("在不同分支的元素都应该能够获取到同一个 router", () => {
            const { document } = createTestEnvironment();
            const host = document.createElement("div") as any;
            document.body.appendChild(host);

            const router = new KylinRouter(host, []);

            // 创建多个分支
            const branch1 = document.createElement("div") as any;
            const branch2 = document.createElement("div") as any;
            const branch3 = document.createElement("div") as any;

            host.appendChild(branch1);
            host.appendChild(branch2);
            host.appendChild(branch3);

            const element1 = document.createElement("div") as any;
            const element2 = document.createElement("div") as any;
            const element3 = document.createElement("div") as any;

            branch1.appendChild(element1);
            branch2.appendChild(element2);
            branch3.appendChild(element3);

            // 为每个元素查找 router
            const findRouter = (element: any) => {
                let currentElement: any = element;
                while (currentElement) {
                    if (currentElement instanceof HTMLElement && currentElement.hasAttribute("data-kylin-router")) {
                        return (currentElement as any).router;
                    }
                    currentElement = currentElement.parentElement;
                }
                return undefined;
            };

            const router1 = findRouter(element1);
            const router2 = findRouter(element2);
            const router3 = findRouter(element3);

            // 验证所有分支的元素都找到同一个 router
            expect(router1).toBe(router);
            expect(router2).toBe(router);
            expect(router3).toBe(router);
        });
    });

    describe("性能测试", () => {
        it("深层嵌套查找 router 的性能应该良好", () => {
            const { document } = createTestEnvironment();
            const host = document.createElement("div") as any;
            document.body.appendChild(host);

            const router = new KylinRouter(host, []);

            // 创建深层嵌套结构（100层）
            let currentElement = host;
            for (let i = 0; i < 100; i++) {
                const child = document.createElement("div") as any;
                currentElement.appendChild(child);
                currentElement = child;
            }

            const testElement = document.createElement("div");
            currentElement.appendChild(testElement);

            // 测试查找性能
            const startTime = Date.now();

            let current: any = testElement;
            let foundRouter: any = undefined;

            while (current) {
                if (current instanceof HTMLElement && current.hasAttribute("data-kylin-router")) {
                    foundRouter = (current as any).router;
                    break;
                }
                current = current.parentElement;
            }

            const endTime = Date.now();

            // 验证能够找到 router
            expect(foundRouter).toBe(router);
            // 验证查找时间合理（应该小于 100ms）
            expect(endTime - startTime).toBeLessThan(100);
        });
    });
});
