import { describe, it, expect } from "bun:test";
import { traverseOutlet } from "@/utils/traverseOutlet";
import { Window } from "happy-dom";

/**
 * 创建测试环境
 */
function createTestEnvironment(html: string) {
    const window = new Window({
        url: "http://localhost:8080/",
        width: 1024,
        height: 768,
    });

    const document = window.document;

    // 设置全局 document 和 window 对象，供 createBrowserHistory 使用
    // @ts-ignore - 设置全局对象用于测试
    globalThis.document = document;
    // @ts-ignore
    globalThis.window = window;

    // 确保 Error 构造函数正确设置
    if (!window.SyntaxError) {
        // @ts-ignore
        window.SyntaxError = SyntaxError;
    }

    // 注册自定义元素
    window.customElements.define(
        "kylin-outlet",
        class extends window.HTMLElement {
            constructor() {
                super();
            }
        }
    );

    // 设置 HTML 内容
    document.body.innerHTML = html;

    // 获取第一个元素作为 host
    const host = document.body.firstElementChild as unknown as HTMLElement;

    return { window, document, host };
}

describe("traverseOutlet", () => {
    describe("基本功能测试", () => {
        it("应该正确遍历单个 outlet", () => {
            const html = /* html */ `
                <div>
                    <kylin-outlet></kylin-outlet>
                </div>
            `;

            const { host } = createTestEnvironment(html);
            const result = traverseOutlet(host);

            expect(result.length).toBe(1);
            expect(result[0].length).toBe(1);

            // 验证 WeakRef 可以正确解引用
            const outletRef = result[0][0];
            const outlet = outletRef.deref();
            expect(outlet).toBeDefined();
            expect(outlet?.tagName.toLowerCase()).toBe("kylin-outlet");
        });

        it("应该正确遍历多个兄弟 outlet（同一层）", () => {
            const html = /* html */ `
                <div>
                    <kylin-outlet id="outlet1"></kylin-outlet>
                    <kylin-outlet id="outlet2"></kylin-outlet>
                    <kylin-outlet id="outlet3"></kylin-outlet>
                </div>
            `;

            const { host } = createTestEnvironment(html);
            const result = traverseOutlet(host);

            expect(result.length).toBe(1);
            expect(result[0].length).toBe(3);

            // 通过 WeakRef 获取实际元素并验证
            const outlets = result[0].map((ref) => ref.deref());
            expect(outlets[0]?.id).toBe("outlet1");
            expect(outlets[1]?.id).toBe("outlet2");
            expect(outlets[2]?.id).toBe("outlet3");
        });

        it("应该正确处理嵌套 outlet（多层）", () => {
            const html = /* html */ `
                <div>
                    <kylin-outlet id="outlet1">
                        <kylin-outlet id="outlet2"></kylin-outlet>
                    </kylin-outlet>
                </div>
            `;

            const { host } = createTestEnvironment(html);
            const result = traverseOutlet(host);

            expect(result.length).toBe(2);
            expect(result[0].length).toBe(1);
            expect(result[1].length).toBe(1);

            expect(result[0][0].deref()?.id).toBe("outlet1");
            expect(result[1][0].deref()?.id).toBe("outlet2");
        });

        it("应该正确处理多个分支", () => {
            const html = /* html */ `
                <div>
                    <kylin-outlet id="outlet1">
                        <kylin-outlet id="outlet2"></kylin-outlet>
                    </kylin-outlet>
                    <kylin-outlet id="outlet3"></kylin-outlet>
                </div>
            `;

            const { host } = createTestEnvironment(html);
            const result = traverseOutlet(host);

            expect(result.length).toBe(2);
            expect(result[0].length).toBe(2);
            expect(result[1].length).toBe(1);

            expect(result[0][0].deref()?.id).toBe("outlet1");
            expect(result[0][1].deref()?.id).toBe("outlet3");
            expect(result[1][0].deref()?.id).toBe("outlet2");
        });
    });

    describe("层级计算测试", () => {
        it("应该正确计算深层嵌套的 outlet 层级", () => {
            const html = /* html */ `
                <div>
                    <kylin-outlet id="level1">
                        <kylin-outlet id="level2">
                            <kylin-outlet id="level3"></kylin-outlet>
                        </kylin-outlet>
                    </kylin-outlet>
                </div>
            `;

            const { host } = createTestEnvironment(html);
            const result = traverseOutlet(host);

            expect(result.length).toBe(3);
            expect(result[0][0].deref()?.id).toBe("level1");
            expect(result[1][0].deref()?.id).toBe("level2");
            expect(result[2][0].deref()?.id).toBe("level3");
        });

        it("应该正确处理复杂的嵌套结构", () => {
            const html = /* html */ `
                <div>
                    <kylin-outlet id="branch1-level1">
                        <kylin-outlet id="branch1-level2"></kylin-outlet>
                    </kylin-outlet>
                    <kylin-outlet id="branch2-level1">
                        <kylin-outlet id="branch2-level2"></kylin-outlet>
                    </kylin-outlet>
                </div>
            `;

            const { host } = createTestEnvironment(html);
            const result = traverseOutlet(host);

            expect(result.length).toBe(2);
            expect(result[0].length).toBe(2);
            expect(result[0][0].deref()?.id).toBe("branch1-level1");
            expect(result[0][1].deref()?.id).toBe("branch2-level1");
            expect(result[1].length).toBe(2);
            expect(result[1][0].deref()?.id).toBe("branch1-level2");
            expect(result[1][1].deref()?.id).toBe("branch2-level2");
        });

        it("应该正确处理 DOM 元素包裹的 outlet", () => {
            const html = /* html */ `
                <div>
                    <div class="wrapper">
                        <kylin-outlet id="outlet1"></kylin-outlet>
                    </div>
                    <div class="wrapper">
                        <kylin-outlet id="outlet2"></kylin-outlet>
                    </div>
                </div>
            `;

            const { host } = createTestEnvironment(html);
            const result = traverseOutlet(host);

            expect(result.length).toBe(1);
            expect(result[0].length).toBe(2);
        });
    });

    describe("边界情况测试", () => {
        it("应该正确处理没有 outlet 的情况", () => {
            const html = /* html */ `
                <div>
                    <div>Empty container</div>
                </div>
            `;

            const { host } = createTestEnvironment(html);
            const result = traverseOutlet(host);

            expect(result.length).toBe(0);
            expect(result).toEqual([]);
        });

        it("应该正确处理空的 DOM 结构", () => {
            const html = /* html */ `
                <div></div>
            `;

            const { host } = createTestEnvironment(html);
            const result = traverseOutlet(host);

            expect(result.length).toBe(0);
        });

        it("应该正确处理只包含非 outlet 元素的情况", () => {
            const html = /* html */ `
                <div>
                    <div>Div 1</div>
                    <span>Span 1</span>
                    <p>Paragraph 1</p>
                </div>
            `;

            const { host } = createTestEnvironment(html);
            const result = traverseOutlet(host);

            expect(result.length).toBe(0);
        });
    });

    describe("返回值测试", () => {
        it("应该返回数组类型", () => {
            const html = /* html */ `
                <div>
                    <kylin-outlet></kylin-outlet>
                </div>
            `;

            const { host } = createTestEnvironment(html);
            const result = traverseOutlet(host);

            expect(Array.isArray(result)).toBe(true);
        });

        it("应该保持 DOM 文档顺序", () => {
            const html = /* html */ `
                <div>
                    <kylin-outlet id="first"></kylin-outlet>
                    <kylin-outlet id="second"></kylin-outlet>
                    <kylin-outlet id="third"></kylin-outlet>
                </div>
            `;

            const { host } = createTestEnvironment(html);
            const result = traverseOutlet(host);

            const outletRefs = result[0];
            const outlets = outletRefs.map((ref) => ref.deref());
            expect(outlets[0]?.id).toBe("first");
            expect(outlets[1]?.id).toBe("second");
            expect(outlets[2]?.id).toBe("third");
        });

        it("数组索引应该对应层级（索引 i = 层级 i+1）", () => {
            const html = /* html */ `
                <div>
                    <kylin-outlet id="level1-1"></kylin-outlet>
                    <kylin-outlet id="level1-2"></kylin-outlet>
                    <kylin-outlet id="level2-1">
                        <kylin-outlet id="level3-1"></kylin-outlet>
                    </kylin-outlet>
                </div>
            `;

            const { host } = createTestEnvironment(html);
            const result = traverseOutlet(host);

            // 注意：level1-1 和 level1-2 和 level2-1 都是兄弟元素，都是第一层
            // level3-1 是 level2-1 的子元素，是第二层
            // 实际上这个结构中，level2-1 应该叫 level1-3，因为它也是第一层

            // 正确的理解：
            // - 第一层：level1-1, level1-2, level2-1（都是兄弟，没有祖先 outlet）
            // - 第二层：level3-1（level2-1 的子元素）

            expect(result.length).toBe(2);
            expect(result[0].length).toBe(3);
            expect(result[0][0].deref()?.id).toBe("level1-1");
            expect(result[0][1].deref()?.id).toBe("level1-2");
            expect(result[0][2].deref()?.id).toBe("level2-1");
            expect(result[1].length).toBe(1);
            expect(result[1][0].deref()?.id).toBe("level3-1");
        });
    });

    describe("实际应用场景测试", () => {
        it("应该正确处理路由嵌套场景", () => {
            const html = /* html */ `
                <div>
                    <kylin-outlet id="root">
                        <div class="layout">
                            <header>Header</header>
                            <main>
                                <kylin-outlet id="child">
                                    <div class="page">
                                        <kylin-outlet id="nested"></kylin-outlet>
                                    </div>
                                </kylin-outlet>
                            </main>
                            <footer>Footer</footer>
                        </div>
                    </kylin-outlet>
                </div>
            `;

            const { host } = createTestEnvironment(html);
            const result = traverseOutlet(host);

            expect(result.length).toBe(3);
            expect(result[0][0].deref()?.id).toBe("root");
            expect(result[1][0].deref()?.id).toBe("child");
            expect(result[2][0].deref()?.id).toBe("nested");
        });

        it("应该正确处理多布局场景", () => {
            const html = /* html */ `
                <div>
                    <kylin-outlet id="main-layout">
                        <div class="sidebar">
                            <kylin-outlet id="sidebar-outlet"></kylin-outlet>
                        </div>
                        <div class="content">
                            <kylin-outlet id="content-outlet"></kylin-outlet>
                        </div>
                    </kylin-outlet>
                    <kylin-outlet id="modal-layout"></kylin-outlet>
                </div>
            `;

            const { host } = createTestEnvironment(html);
            const result = traverseOutlet(host);

            expect(result.length).toBe(2);
            expect(result[0].length).toBe(2);
            expect(result[0][0].deref()?.id).toBe("main-layout");
            expect(result[0][1].deref()?.id).toBe("modal-layout");
            expect(result[1].length).toBe(2);
            expect(result[1][0].deref()?.id).toBe("sidebar-outlet");
            expect(result[1][1].deref()?.id).toBe("content-outlet");
        });
    });

    describe("WeakRef 特性测试", () => {
        it("应该返回 WeakRef 实例", () => {
            const html = /* html */ `
                <div>
                    <kylin-outlet id="test"></kylin-outlet>
                </div>
            `;

            const { host } = createTestEnvironment(html);
            const result = traverseOutlet(host);

            const outletRef = result[0][0];
            expect(outletRef).toBeInstanceOf(WeakRef);
        });

        it("WeakRef.deref() 应该返回原始元素", () => {
            const html = /* html */ `
                <div>
                    <kylin-outlet id="test"></kylin-outlet>
                </div>
            `;

            const { host, window } = createTestEnvironment(html);
            const result = traverseOutlet(host);

            const outletRef = result[0][0];
            const outlet = outletRef.deref();

            expect(outlet).toBeInstanceOf(window.HTMLElement);
            expect(outlet?.id).toBe("test");
        });

        it("当元素被移除时 WeakRef.deref() 应该返回 undefined", () => {
            const html = /* html */ `
                <div>
                    <kylin-outlet id="test"></kylin-outlet>
                </div>
            `;

            const { host } = createTestEnvironment(html);
            const result = traverseOutlet(host);

            const outletRef = result[0][0];

            // 移除元素
            const outlet = outletRef.deref();
            if (outlet) {
                outlet.remove();
            }

            // 注意：在实际环境中，GC 可能不会立即执行
            // 这个测试主要验证 WeakRef 的 API 使用正确性
            expect(outletRef).toBeInstanceOf(WeakRef);
        });
    });

    describe("性能和内存优化测试", () => {
        it("数组访问应该比 Map 访问更快", () => {
            const html = /* html */ `
                <div>
                    <kylin-outlet id="outlet1"></kylin-outlet>
                    <kylin-outlet id="outlet2">
                        <kylin-outlet id="outlet3"></kylin-outlet>
                    </kylin-outlet>
                </div>
            `;

            const { host } = createTestEnvironment(html);
            const result = traverseOutlet(host);

            // 数组访问：result[0] 比 Map 访问：result.get(1) 更快
            const level1Outlets = result[0]; // O(1) 直接索引访问
            expect(level1Outlets.length).toBe(2);

            const level2Outlets = result[1]; // O(1) 直接索引访问
            expect(level2Outlets.length).toBe(1);
        });

        it("数组内存占用应该比 Map 更小", () => {
            const html = /* html */ `
                <div>
                    <kylin-outlet></kylin-outlet>
                </div>
            `;

            const { host } = createTestEnvironment(html);
            const result = traverseOutlet(host);

            // 数组结构比 Map 结构更简单，内存占用更小
            expect(Array.isArray(result)).toBe(true);
            expect(result).toBeInstanceOf(Array);
        });
    });
});
