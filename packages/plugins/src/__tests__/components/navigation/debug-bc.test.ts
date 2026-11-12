import "../../setup";
import { test } from "bun:test";
import { mount, nextTick } from "../../helpers";

test("D: 无 :key", async () => {
    const { root } = mount(`<ul><li x-for="item of arr"><span x-text="item.label"></span></li></ul>`, { arr: [{ label: "X" }, { label: "Y" }] });
    await nextTick();
    console.log("D li count:", root.querySelectorAll("li").length);
});

test("E: :key=book.id 文档形态", async () => {
    const { root } = mount(`<ul x-for="item of arr" :key="item.label"><li><span x-text="item.label"></span></li></ul>`, { arr: [{ label: "X" }, { label: "Y" }] });
    await nextTick();
    console.log("E ul children:", root.querySelector("ul")!.children.length, "li:", root.querySelectorAll("li").length);
});
