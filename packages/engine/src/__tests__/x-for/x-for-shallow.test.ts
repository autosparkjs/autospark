import { describe, expect, test } from "bun:test";
import "../setup";
import { mount, nextTick } from "../helpers";
import { shallow } from "autostore";

describe("x-for + shallow 浅响应列表（文档 性能优化 demo 端到端验证）", () => {
    test("deep=1：初始渲染 / 项字段细粒度更新 / push 增项", async () => {
        const todos = shallow(
            [
                { id: 1, text: "a", done: false },
                { id: 2, text: "b", done: false },
            ],
            1,
        );
        const { root, engine } = mount(
            `<ul x-for="todo of todos" :key="todo.id"><li :class="todo.done ? 'done' : ''" x-text="todo.text"></li></ul>`,
            { todos },
        );
        expect(root).toEqualHTML(`<div>
  <ul>
    <li>a</li>
    <li>b</li>
  </ul>
</div>`);
        // deep=1：项成员属性写入经成员层代理，触发该绑定细粒度更新
        engine.state.todos[0]!.done = true;
        await nextTick();
        expect(root.querySelector("li")!.className).toBe("done");
        // 结构操作照常发事件：push 增项
        engine.state.todos.push({ id: 3, text: "c", done: false });
        await nextTick();
        expect(root.querySelectorAll("li").length).toBe(3);
        // 删除项
        engine.state.todos.splice(0, 1);
        await nextTick();
        expect(root.querySelectorAll("li").length).toBe(2);
        expect(root).toEqualHTML(`<div>
  <ul>
    <li>b</li>
    <li>c</li>
  </ul>
</div>`);
    });

    test("deep=0：结构操作响应、项字段直改不响应（读出即 raw）", async () => {
        const raw = { id: 1, text: "a", done: false };
        const { root, engine } = mount(
            `<ul x-for="todo of todos" :key="todo.id"><li :class="todo.done ? 'done' : ''" x-text="todo.text"></li></ul>`,
            { todos: shallow([raw], 0) },
        );
        expect(root.querySelector("li")!.className).toBe("");
        // deep=0：元素读出即 raw，直改字段不触发响应
        engine.state.todos[0]!.done = true;
        await nextTick();
        expect(root.querySelector("li")!.className).toBe("");
        // 但整体替换索引项（数组顶层 set）照常响应
        engine.state.todos[0] = { id: 1, text: "a2", done: true };
        await nextTick();
        expect(root.querySelector("li")!.className).toBe("done");
        expect(root.querySelector("li")!.textContent).toBe("a2");
        // push 照常
        engine.state.todos.push({ id: 2, text: "b", done: false });
        await nextTick();
        expect(root.querySelectorAll("li").length).toBe(2);
        expect(raw.done).toBe(true);
    });

    test("shallow 列表 + computed 统计：toggle / 增项后同步", async () => {
        const { root, engine } = mount(
            `<span x-text="remaining"></span><ul x-for="todo of todos" :key="todo.id"><li :class="todo.done ? 'done' : ''" x-text="todo.text"></li></ul>`,
            {
                todos: shallow(
                    [
                        { id: 1, text: "a", done: false },
                        { id: 2, text: "b", done: true },
                    ],
                    1,
                ),
                remaining: (scope: any) => scope.todos.filter((t: any) => !t.done).length,
            },
        );
        expect(root.querySelector("span")!.textContent).toBe("1");
        // toggle：done 由 false → true，remaining 1 → 0
        const todo = engine.state.todos.find((t: any) => t.id === 1)!;
        todo.done = true;
        await nextTick();
        expect(root.querySelector("span")!.textContent).toBe("0");
        expect(root.querySelector("li")!.className).toBe("done");
        // 增未完成项：remaining 0 → 1
        engine.state.todos.push({ id: 3, text: "c", done: false });
        await nextTick();
        expect(root.querySelector("span")!.textContent).toBe("1");
        expect(root.querySelectorAll("li").length).toBe(3);
    });
});
