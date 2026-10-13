import { describe, expect, test } from "bun:test";
import "../setup";
import { mount, nextTick } from "../helpers";

/**
 * engine.patch 模板增量编译测试（ADR-0002）。
 *
 * 数据统一挂在 engine.state（全局），容器用 `x-data="{}"` 作 scope 锚（空私有域）；
 * `x-patch` 哨兵单独验证。updater 就地改入参（engine.template 的元素），返回值走四态。
 */
describe("engine.patch - 子树重建（void / 同引用）", () => {
    test("void：在 scope 容器内插入片段并生效绑定", () => {
        const { root, engine } = mount(`<div id="app"><div id="ws" x-data="{}"></div></div>`, {
            content: "hello",
        });
        engine.patch("#ws", (ws) => {
            ws.insertAdjacentHTML("beforeend", "<p x-text='content'></p>");
        });
        expect(root).toEqualHTML(`<div><div id="app"><div id="ws"><p>hello</p></div></div></div>`);
    });

    test("void：修改子节点的指令并重新编译", () => {
        const { root, engine } = mount(
            `<div id="app"><div id="ws" x-data="{}"><p x-text='content'></p></div></div>`,
            { content: "hello" },
        );
        engine.patch("#ws", (ws) => {
            ws.querySelector("p")!.setAttribute("x-text", "content + '!'");
        });
        expect(root).toEqualHTML(`<div><div id="app"><div id="ws"><p>hello!</p></div></div></div>`);
    });

    test("返回同引用 === templateEl：等价于 void 子树重建", () => {
        const { root, engine } = mount(`<div id="app"><div id="ws" x-data="{}"></div></div>`, {
            content: "hello",
        });
        engine.patch("#ws", (ws) => {
            ws.insertAdjacentHTML("beforeend", "<p x-text='content'></p>");
            return ws;
        });
        expect(root).toEqualHTML(`<div><div id="app"><div id="ws"><p>hello</p></div></div></div>`);
    });

    test("子树重建保留兄弟子树运行态（增量核心价值）", async () => {
        // tooltip: false——测 patch 增量语义，title 断言与 ADR-0061 的重定向无关
        const { root, engine } = mount(
            `<div id="app"><div id="ws" x-data="{}"></div><input id="keep" x-bind:title="content"></div>`,
            { content: "hello" },
            { tooltip: false },
        );
        engine.patch("#ws", (ws) => {
            ws.insertAdjacentHTML("beforeend", "<p x-text='content'></p>");
        });
        // #ws 已更新，兄弟 #keep 仍在且响应式未被破坏
        expect(root).toEqualHTML(
            `<div><div id="app"><div id="ws"><p>hello</p></div><input id="keep" title="hello"></div></div>`,
        );
        engine.state.content = "world";
        await nextTick();
        // 兄弟子树 #keep 与 #ws 内 <p> 都更新（证明 patch 未破坏 #keep 订阅）
        expect(root).toEqualHTML(
            `<div><div id="app"><div id="ws"><p>world</p></div><input id="keep" title="world"></div></div>`,
        );
    });
});

describe("engine.patch - 替换自身", () => {
    test("返回新 Node（含子树）：子节点被完整编译", () => {
        const { root, engine } = mount(`<div id="app"><div id="ws" x-data="{}"></div></div>`, {
            content: "hello",
        });
        engine.patch("#ws", () => {
            const next = document.createElement("section");
            next.innerHTML = "<p x-text='content'></p><span>tail</span>";
            return next;
        });
        expect(root).toEqualHTML(
            `<div><div id="app"><section><p>hello</p><span>tail</span></section></div></div>`,
        );
    });

    test("返回 HTML 字符串（单节点）", () => {
        const { root, engine } = mount(`<div id="app"><div id="ws" x-data="{}"></div></div>`, {
            content: "hello",
        });
        engine.patch("#ws", () => "<p x-text='content'></p>");
        expect(root).toEqualHTML(`<div><div id="app"><p>hello</p></div></div>`);
    });

    test("返回 HTML 字符串（多节点）", () => {
        const { root, engine } = mount(`<div id="app"><div id="ws" x-data="{}"></div></div>`, {
            content: "hello",
        });
        engine.patch("#ws", () => "<p x-text='content'></p><span>tail</span>");
        expect(root).toEqualHTML(`<div><div id="app"><p>hello</p><span>tail</span></div></div>`);
    });
});

describe("engine.patch - 删除", () => {
    test("返回 null：删除自身（双侧移除 + scope destroy）", () => {
        const { root, engine } = mount(
            `<div id="app"><div id="ws" x-data="{}"><p x-text='content'></p></div></div>`,
            { content: "hello" },
        );
        engine.patch("#ws", () => null);
        expect(root).toEqualHTML(`<div><div id="app"></div></div>`);
    });

    test("返回空串：等价于 null（删除）", () => {
        const { root, engine } = mount(
            `<div id="app"><div id="ws" x-data="{}"><p x-text='content'></p></div></div>`,
            { content: "hello" },
        );
        engine.patch("#ws", () => "");
        expect(root).toEqualHTML(`<div><div id="app"></div></div>`);
    });
});

describe("engine.patch - 边界与守卫", () => {
    test("纯静态裸元素（无指令无插值）：非 scope，warn 拒绝，DOM 不变", () => {
        const { root, engine } = mount(`<div id="app"><div id="bare"></div></div>`, {});
        engine.patch("#bare", (el) => {
            el.insertAdjacentHTML("beforeend", "<p>x</p>");
        });
        expect(root).toEqualHTML(`<div><div id="app"><div id="bare"></div></div></div>`);
    });

    test("含 {{}} 的裸元素（合成 scope）：可 patch", () => {
        const { root, engine } = mount(`<div id="app"><div id="ws">{{content}}</div></div>`, {
            content: "hello",
        });
        engine.patch("#ws", (ws) => {
            ws.insertAdjacentHTML("beforeend", "<p x-text='content'></p>");
        });
        expect(root).toEqualHTML(
            `<div><div id="app"><div id="ws">hello<p>hello</p></div></div></div>`,
        );
    });

    test("动态区域 x-for 元素：拒绝，DOM 不变", () => {
        const { root, engine } = mount(
            `<div id="app"><ul x-for="item of items" :key="item.id"><li x-text="item.name"></li></ul></div>`,
            {
                items: [
                    { id: 1, name: "a" },
                    { id: 2, name: "b" },
                ],
            },
        );
        // patch x-for 元素自身（ownsChildren）→ 动态区域拒绝；updater 不执行、DOM 保持初始
        engine.patch("ul", (ul) => {
            ul.setAttribute("x-data", "{}");
        });
        expect(root).toEqualHTML(`<div><div id="app"><ul><li>a</li><li>b</li></ul></div></div>`);
    });

    test("updater 抛错：不重建，DOM 不变", () => {
        const { root, engine } = mount(
            `<div id="app"><div id="ws" x-data="{}"><p x-text='content'></p></div></div>`,
            { content: "hello" },
        );
        engine.patch("#ws", () => {
            throw new Error("oops");
        });
        expect(root).toEqualHTML(`<div><div id="app"><div id="ws"><p>hello</p></div></div></div>`);
    });
});

describe("engine.patch - 结构占位指令 x-scope", () => {
    test("纯静态裸元素挂 x-scope 后建 scope，可 patch", () => {
        const { root, engine } = mount(`<div id="app"><div id="ws" x-scope></div></div>`, {
            content: "hello",
        });
        engine.patch("#ws", (ws) => {
            ws.insertAdjacentHTML("beforeend", "<p x-text='content'></p>");
        });
        expect(root).toEqualHTML(`<div><div id="app"><div id="ws"><p>hello</p></div></div></div>`);
    });
});

describe("engine.patch - 响应式与事件", () => {
    test("patch 插入的绑定后续 state 变化自动更新", async () => {
        const { root, engine } = mount(`<div id="app"><div id="ws" x-data="{}"></div></div>`, {
            content: "hello",
        });
        engine.patch("#ws", (ws) => {
            ws.insertAdjacentHTML("beforeend", "<p x-text='content'></p>");
        });
        expect(root).toEqualHTML(`<div><div id="app"><div id="ws"><p>hello</p></div></div></div>`);
        engine.state.content = "world";
        await nextTick();
        expect(root).toEqualHTML(`<div><div id="app"><div id="ws"><p>world</p></div></div></div>`);
    });

    test("patch 触发 engine/patch/before|after 事件广播", () => {
        const { engine } = mount(`<div id="app"><div id="ws" x-data="{}"></div></div>`, {});
        const events: string[] = [];
        engine.on("engine/patch/before", () => events.push("before"));
        engine.on("engine/patch/after", () => events.push("after"));
        engine.patch("#ws", () => {});
        expect(events).toEqual(["before", "after"]);
    });
});

describe("engine.patch - 内容投放模式（ADR-0109）", () => {
    test("replace 直投 string：等价 updater 返回字符串", () => {
        const { root, engine } = mount(`<div id="app"><div id="ws" x-data="{}"></div></div>`, {
            content: "hello",
        });
        engine.patch("#ws", "<p x-text='content'></p>");
        expect(root).toEqualHTML(`<div><div id="app"><p>hello</p></div></div>`);
    });

    test("replace 直投 Node：等价 updater 返回 Node", () => {
        const { root, engine } = mount(`<div id="app"><div id="ws" x-data="{}"></div></div>`, {
            content: "hello",
        });
        const next = document.createElement("section");
        next.innerHTML = "<p x-text='content'></p>";
        engine.patch("#ws", next);
        expect(root).toEqualHTML(`<div><div id="app"><section><p>hello</p></section></div></div>`);
    });

    test("inner：清空子级后放入新内容（宿主自身与指令保留）", async () => {
        const { root, engine } = mount(
            `<div id="app"><div id="ws" x-data="{}"><p>old</p></div></div>`,
            { content: "hi" },
        );
        engine.patch("#ws", "<b x-text='content'></b>", { mode: "inner" });
        expect(root).toEqualHTML(`<div><div id="app"><div id="ws"><b>hi</b></div></div></div>`);
        // 宿主 x-data 域仍在：新内容接续响应状态变化
        engine.state.content = "yo";
        await nextTick();
        expect(root).toEqualHTML(`<div><div id="app"><div id="ws"><b>yo</b></div></div></div>`);
    });

    test("inner 空串：仅清空容器（等价 innerHTML=''）", () => {
        const { root, engine } = mount(
            `<div id="app"><div id="ws" x-data="{}"><p>old</p><span>tail</span></div></div>`,
            {},
        );
        engine.patch("#ws", "", { mode: "inner" });
        expect(root).toEqualHTML(`<div><div id="app"><div id="ws"></div></div></div>`);
    });

    test("append：尾部插入多节点", () => {
        const { root, engine } = mount(
            `<div id="app"><ul id="ws" x-data="{}"><li>a</li></ul></div>`,
            {},
        );
        engine.patch("#ws", "<li>b</li><li>c</li>", { mode: "append" });
        expect(root).toEqualHTML(
            `<div><div id="app"><ul id="ws"><li>a</li><li>b</li><li>c</li></ul></div></div>`,
        );
    });

    test("prepend：首部插入", () => {
        const { root, engine } = mount(
            `<div id="app"><ul id="ws" x-data="{}"><li>a</li></ul></div>`,
            {},
        );
        engine.patch("#ws", "<li>z</li>", { mode: "prepend" });
        expect(root).toEqualHTML(
            `<div><div id="app"><ul id="ws"><li>z</li><li>a</li></ul></div></div>`,
        );
    });

    test("prepend/append 空串：no-op", () => {
        const { root, engine } = mount(
            `<div id="app"><ul id="ws" x-data="{}"><li>a</li></ul></div>`,
            {},
        );
        engine.patch("#ws", "  ", { mode: "append" });
        engine.patch("#ws", "", { mode: "prepend" });
        expect(root).toEqualHTML(`<div><div id="app"><ul id="ws"><li>a</li></ul></div></div>`);
    });

    test("函数 + append：返回 string 即插入内容（可读 T 现状决定增量）", () => {
        const { root, engine } = mount(
            `<div id="app"><ul id="ws" x-data="{}"><li>a</li></ul></div>`,
            {},
        );
        engine.patch("#ws", (ul) => `<li>after-${ul.children.length}</li>`, { mode: "append" });
        expect(root).toEqualHTML(
            `<div><div id="app"><ul id="ws"><li>a</li><li>after-1</li></ul></div></div>`,
        );
    });

    test("函数 + append 返回 undefined/T：静默 no-op", () => {
        const { root, engine } = mount(
            `<div id="app"><ul id="ws" x-data="{}"><li>a</li></ul></div>`,
            {},
        );
        engine.patch("#ws", () => undefined, { mode: "append" });
        engine.patch("#ws", (ul) => ul, { mode: "append" });
        expect(root).toEqualHTML(`<div><div id="app"><ul id="ws"><li>a</li></ul></div></div>`);
    });

    test("函数 + append 返回 null：warn no-op，DOM 不变", () => {
        const { root, engine } = mount(
            `<div id="app"><ul id="ws" x-data="{}"><li>a</li></ul></div>`,
            {},
        );
        engine.patch("#ws", () => null, { mode: "append" });
        expect(root).toEqualHTML(`<div><div id="app"><ul id="ws"><li>a</li></ul></div></div>`);
    });

    test("插入顶层插值文本挂 T 的 scope：注册成功且持续响应", async () => {
        const { root, engine } = mount(
            `<div id="app"><div id="ws" x-data="{}"><span>{{content}}</span></div></div>`,
            { content: "A" },
        );
        engine.patch("#ws", "{{content}}", { mode: "append" });
        expect(root).toEqualHTML(
            `<div><div id="app"><div id="ws"><span>A</span>A</div></div></div>`,
        );
        engine.state.content = "B";
        await nextTick();
        expect(root).toEqualHTML(
            `<div><div id="app"><div id="ws"><span>B</span>B</div></div></div>`,
        );
    });

    test("非法 mode：warn no-op，DOM 不变", () => {
        const { root, engine } = mount(
            `<div id="app"><ul id="ws" x-data="{}"><li>a</li></ul></div>`,
            {},
        );
        engine.patch("#ws", "<li>x</li>", { mode: "befor" } as any);
        expect(root).toEqualHTML(`<div><div id="app"><ul id="ws"><li>a</li></ul></div></div>`);
    });

    test("事件载荷携带 mode", () => {
        const { engine } = mount(
            `<div id="app"><ul id="ws" x-data="{}"><li>a</li></ul></div>`,
            {},
        );
        const seen: string[] = [];
        engine.on("engine/patch/before", (m: any) => seen.push(`before:${m.payload.mode}`));
        engine.on("engine/patch/after", (m: any) => seen.push(`after:${m.payload.mode}`));
        engine.patch("#ws", "<li>x</li>", { mode: "append" });
        engine.patch("#ws", ""); // replace + 空串 = 删除（事件照发）
        expect(seen).toEqual([
            "before:append",
            "after:append",
            "before:replace",
            "after:replace",
        ]);
    });

    test("append + ref：插到容器内 ref 锚点之后（锚点须为 scope 元素）", async () => {
        const { root, engine } = mount(
            `<div id="app"><ul id="ws" x-data="{}"><li id="first" x-text="first"></li><li id="second" x-text="second"></li></ul></div>`,
            { first: "a", second: "b" },
        );
        engine.patch("#ws", "<li>new</li>", { mode: "append", ref: "#first" });
        expect(root).toEqualHTML(
            `<div><div id="app"><ul id="ws"><li id="first">a</li><li>new</li><li id="second">b</li></ul></div></div>`,
        );
        // 锚点与插入内容的绑定均持续响应
        engine.state.first = "A";
        await nextTick();
        expect(root).toEqualHTML(
            `<div><div id="app"><ul id="ws"><li id="first">A</li><li>new</li><li id="second">b</li></ul></div></div>`,
        );
    });

    test("prepend + ref：插到 ref 锚点之前", () => {
        const { root, engine } = mount(
            `<div id="app"><ul id="ws" x-data="{}"><li id="first" x-text="first"></li><li id="second" x-text="second"></li></ul></div>`,
            { first: "a", second: "b" },
        );
        engine.patch("#ws", "<li>new</li>", { mode: "prepend", ref: "#second" });
        expect(root).toEqualHTML(
            `<div><div id="app"><ul id="ws"><li id="first">a</li><li>new</li><li id="second">b</li></ul></div></div>`,
        );
    });

    test("ref 未命中：warn no-op，DOM 不变", () => {
        const { root, engine } = mount(
            `<div id="app"><ul id="ws" x-data="{}"><li id="first" x-text="first"></li></ul></div>`,
            { first: "a" },
        );
        engine.patch("#ws", "<li>x</li>", { mode: "append", ref: "#nope" });
        expect(root).toEqualHTML(
            `<div><div id="app"><ul id="ws"><li id="first">a</li></ul></div></div>`,
        );
    });

    test("ref 命中非 scope 静态元素：warn no-op（锚点须挂 x-scope）", () => {
        const { root, engine } = mount(
            `<div id="app"><ul id="ws" x-data="{}"><li id="plain">a</li></ul></div>`,
            {},
        );
        engine.patch("#ws", "<li>x</li>", { mode: "append", ref: "#plain" });
        expect(root).toEqualHTML(
            `<div><div id="app"><ul id="ws"><li id="plain">a</li></ul></div></div>`,
        );
    });

    test("inner / replace 忽略 ref：行为与无 ref 一致", () => {
        const { root, engine } = mount(
            `<div id="app"><ul id="ws" x-data="{}"><li id="first" x-text="first"></li><li>old</li></ul></div>`,
            { first: "a" },
        );
        engine.patch("#ws", "<li>only</li>", { mode: "inner", ref: "#first" });
        expect(root).toEqualHTML(
            `<div><div id="app"><ul id="ws"><li>only</li></ul></div></div>`,
        );
        engine.patch("#ws", (ul) => ul, { mode: "replace", ref: "#first" });
        expect(root).toEqualHTML(
            `<div><div id="app"><ul id="ws"><li>only</li></ul></div></div>`,
        );
    });
});
