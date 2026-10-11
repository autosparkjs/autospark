import { describe, it, expect } from "bun:test";
import { findOutlet } from "@/utils/findOutlet";
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

    return { window, document, host: document.body.firstElementChild as unknown as HTMLElement };
}

describe("findOutlet", () => {
    describe("广度优先遍历 (BFS)", () => {
        it("应该按层级顺序找到 outlet，不嵌套在 outlet 内部", () => {
            const { host } = createTestEnvironment(`
                <div>
                    <kylin-outlet id="outlet1"></kylin-outlet>
                    <div>
                        <kylin-outlet id="outlet2-nested"></kylin-outlet>
                    </div>
                    <kylin-outlet id="outlet3"></kylin-outlet>
                </div>
            `);

            const result = findOutlet(host!);

            // outlet2-nested 在独立的 div 分支中，应该被找到
            // 因为它的父元素链中（host -> div -> outlet2-nested）没有其他 outlet
            // BFS 按层级遍历，所以顺序是：第二层级的 outlet1/outlet3，然后第三层级的 outlet2-nested
            expect(result.length).toBe(3);
            expect(result.map(o => o.id)).toEqual(["outlet1", "outlet3", "outlet2-nested"]);
        });

        it("同一分支找到 outlet 后不应继续深入", () => {
            const { host } = createTestEnvironment(`
                <div>
                    <kylin-outlet id="outlet1">
                        <kylin-outlet id="outlet1-child"></kylin-outlet>
                        <kylin-outlet id="outlet1-child2"></kylin-outlet>
                    </kylin-outlet>
                    <kylin-outlet id="outlet2"></kylin-outlet>
                </div>
            `);

            const result = findOutlet(host!);

            // 应该找到 outlet1 和 outlet2，不深入 outlet1 的子元素
            expect(result.length).toBe(2);
            expect(result[0].id).toBe("outlet1");
            expect(result[1].id).toBe("outlet2");
        });

        it("深层嵌套结构测试", () => {
            const { host } = createTestEnvironment(`
                <div>
                    <div>
                        <div>
                            <kylin-outlet id="deep-outlet"></kylin-outlet>
                        </div>
                    </div>
                    <kylin-outlet id="top-outlet"></kylin-outlet>
                </div>
            `);

            const result = findOutlet(host!);

            // BFS 应该先找到 top-outlet（第二层级），再找到 deep-outlet（第四层级）
            expect(result.length).toBe(2);
            expect(result[0].id).toBe("top-outlet");
            expect(result[1].id).toBe("deep-outlet");
        });

        it("空元素应该返回空数组", () => {
            const { host } = createTestEnvironment(`<div></div>`);

            const result = findOutlet(host!);

            expect(result.length).toBe(0);
        });
    });
});
