/**
 * x-for `<template>` 宿主形态测试。
 *
 * template 宿主的元素子节点在 content 隔离域（tpl.children 恒空）——项模板从 content
 * 收集；渲染项挂到 template 的**父节点**、恒插 template 之前（template 自身保留为声明位
 * 标记，不渲染内容、无痕）。对齐 Vue/Alpine 的 template 列表直觉写法。
 *
 * 框架：bun:test。初始渲染同步（engine 构造期 flush），状态变更后需 await nextTick()。
 */
import { describe, expect, test } from "bun:test";
import "../../setup";
import { mount, nextTick } from "../../helpers";

describe("x-for template 宿主形态", () => {
    test("初始渲染：项挂 template 之前的父节点，template 保留无痕", () => {
        const { root } = mount(
            `<ul>
               <template x-for="item of items" :key="item.id"><li x-text="item.name"></li></template>
             </ul>`,
            {
                items: [
                    { id: 1, name: "a" },
                    { id: 2, name: "b" },
                ],
            },
        );
        expect(root).toEqualHTML(`<div>
  <ul>
    <li>a</li>
    <li>b</li>
    <template></template>
  </ul>
</div>`);
    });

    test("增项/删项：项维护于 template 之前的文档序", async () => {
        const { root, engine } = mount(
            `<div class="list">
               <template x-for="item of items" :key="item.id"><span x-text="item.name"></span></template>
             </div>`,
            { items: [{ id: 1, name: "a" }] },
        );
        engine.state.items.push({ id: 2, name: "b" });
        await nextTick();
        expect(root.querySelector(".list")!.children.length).toBe(3); // span a + span b + template
        engine.state.items.splice(0, 1);
        await nextTick();
        const names = [...root.querySelectorAll("span")].map((s) => s.textContent);
        expect(names).toEqual(["b"]);
    });

    test("复合项模板（多元素成员）整组保序", () => {
        const { root } = mount(
            `<div class="list">
               <template x-for="item of items" :key="item.id">
                 <em x-text="item.name"></em>
                 <strong x-text="item.id"></strong>
               </template>
             </div>`,
            { items: [{ id: 1, name: "x" }] },
        );
        const list = root.querySelector(".list")!;
        // 复合项两成员 + template 尾锚，顺序 em → strong → template
        expect([...list.children].map((c) => c.tagName)).toEqual(["EM", "STRONG", "TEMPLATE"]);
    });

    test("x-empty 特例子节点在 template 宿主内同样生效", async () => {
        const { root, engine } = mount(
            `<ul>
               <template x-for="item of items" :key="item.id">
                 <li x-text="item.name"></li>
                 <li x-empty>没有数据</li>
               </template>
             </ul>`,
            { items: [] },
        );
        expect(root.querySelector("ul")!.textContent).toContain("没有数据");
        engine.state.items.push({ id: 1, name: "a" });
        await nextTick();
        expect(root.querySelector("ul")!.textContent).toContain("a");
        expect(root.querySelector("ul")!.textContent).not.toContain("没有数据");
    });
});
