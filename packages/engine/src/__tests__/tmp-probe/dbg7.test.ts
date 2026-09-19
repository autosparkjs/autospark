import { describe, test } from "bun:test";
import "../setup";
import { mount, nextTick } from "../helpers";

describe("dbg7", () => {
    test("$end + x-if 增项锚点追踪", async () => {
        const { root, engine } = mount(
            `<ul x-for="n of nums"><li x-text="n"></li><hr x-if="!$end"/></ul>`,
            { nums: ["a", "b", "c"] },
        );
        await nextTick();
        console.log("INIT:", root.innerHTML);
        engine.state.nums.push("d");
        await nextTick();
        console.log("PUSH:", root.innerHTML);
        // 节点级打印（含注释）
        const ul: any = root.querySelector("ul");
        console.log(
            "NODES:",
            Array.from(ul.childNodes)
                .map((n: any) =>
                    n.nodeType === 8
                        ? `<!--${n.nodeValue}-->`
                        : `<${n.nodeName.toLowerCase()}>${n.textContent ?? ""}</>`,
                )
                .join(" "),
        );
    });
});
