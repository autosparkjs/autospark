import { describe, expect, test } from "bun:test";
import "../../setup";
import { mount, nextTick } from "../../helpers";
import { getDirectiveGlobalDefaults } from "../../../features/directive/utils/getDirectiveGlobalDefaults";
import { createDirectiveOptions } from "../../../features/directive/utils/createDirectiveOptions";
import { AutoSparkDirectiveBase } from "../../../features/directive/base";
import type { AutoDirectiveInfo } from "../../../features/directive/types";
import type { AutoSpark } from "../../../engine/engine";

/**
 * 指令全局默认（ADR-0127）：`AutoSparkOptions.directives` 的回退链、key 归一、活读与
 * 双出口（基类 getOption / $options 代理）行为验证。
 */

/** helper 用的最小 engine 替身（仅读 options.directives） */
function stubEngine(directives: any) {
    return { options: { directives } } as unknown as AutoSpark;
}

describe("getDirectiveGlobalDefaults - key 归一与取值", () => {
    test("带前缀主形态命中", () => {
        const d = getDirectiveGlobalDefaults(stubEngine({ "x-text": { empty: "暂无" } }), "text");
        expect(d).toEqual({ empty: "暂无" });
    });

    test("裸名等价容忍", () => {
        const d = getDirectiveGlobalDefaults(stubEngine({ text: { empty: "暂无" } }), "text");
        expect(d).toEqual({ empty: "暂无" });
    });

    test("双形态并存带前缀优先", () => {
        const d = getDirectiveGlobalDefaults(
            stubEngine({ "x-text": { a: 1 }, text: { a: 2 } }),
            "text",
        );
        expect(d).toEqual({ a: 1 });
    });

    test("前缀键显式 null 视为缺省（不落裸名）", () => {
        const d = getDirectiveGlobalDefaults(stubEngine({ "x-text": null, text: { a: 1 } }), "text");
        expect(d).toBeNull();
    });

    test("非普通对象值（false/字符串/数组）视为缺省", () => {
        expect(getDirectiveGlobalDefaults(stubEngine({ "x-text": false }), "text")).toBeNull();
        expect(getDirectiveGlobalDefaults(stubEngine({ "x-text": "x" }), "text")).toBeNull();
        expect(getDirectiveGlobalDefaults(stubEngine({ "x-text": [1] }), "text")).toBeNull();
    });

    test("未注册指令名与缺省表返回 null", () => {
        expect(getDirectiveGlobalDefaults(stubEngine({ "x-dialog": {} }), "text")).toBeNull();
        expect(getDirectiveGlobalDefaults(stubEngine(undefined), "text")).toBeNull();
        expect(getDirectiveGlobalDefaults(stubEngine({}), "text")).toBeNull();
    });
});

describe("createDirectiveOptions - 三层虚拟合并（$options 代理）", () => {
    test("读取回退：指令选项 > 宿主选项 > 全局默认", () => {
        const $o = createDirectiveOptions(
            { a: 1 },
            { a: 2, b: 2 },
            () => ({ a: 3, b: 3, c: 3 }),
        );
        expect($o.a).toBe(1);
        expect($o.b).toBe(2);
        expect($o.c).toBe(3);
    });

    test("显式写值（含 false）即命中、阻断回退", () => {
        const $o = createDirectiveOptions({ a: false }, {}, () => ({ a: true }));
        expect($o.a).toBe(false);
    });

    test("键级回退不深合并：对象值整键覆盖", () => {
        const $o = createDirectiveOptions({ a: { x: 1 } }, {}, () => ({ a: { y: 2 } }));
        expect($o.a).toEqual({ x: 1 });
    });

    test("has 与 ownKeys 为三层并集", () => {
        const $o = createDirectiveOptions({ a: 1 }, { b: 2 }, () => ({ c: 3 }));
        expect("a" in $o).toBe(true);
        expect("b" in $o).toBe(true);
        expect("c" in $o).toBe(true);
        expect("d" in $o).toBe(false);
        expect(Object.keys($o).sort()).toEqual(["a", "b", "c"]);
    });

    test("全局层活读：解析器每次访问现调（挂载后注入可见）", () => {
        let table: Record<string, any> | null = null;
        const $o = createDirectiveOptions({ a: 1 }, {}, () => table);
        expect($o.late).toBeUndefined();
        table = { late: "注入后" };
        expect($o.late).toBe("注入后");
    });

    test("解析器抛错按「无本层」处理（不炸求值）", () => {
        const $o = createDirectiveOptions({ a: 1 }, {}, () => {
            throw new Error("boom");
        });
        expect($o.a).toBe(1);
        expect($o.b).toBeUndefined();
    });

    test("第三参缺省时退化为既有两层语义（向后兼容）", () => {
        const $o = createDirectiveOptions({ a: 1 }, { b: 2 });
        expect($o.a).toBe(1);
        expect($o.b).toBe(2);
        expect($o.c).toBeUndefined();
    });
});

describe("基类 getOption - 全局默认层（ADR-0127）", () => {
    /** 构造裸基类实例（不走完整编译），直接驱动 getOption */
    function probe(engine: AutoSpark, binding: any, name: string) {
        return new AutoSparkDirectiveBase(
            engine,
            binding,
            { name } as unknown as AutoDirectiveInfo,
        );
    }

    test("scope 通道：指令选项 > 宿主选项 > 全局默认", () => {
        const { engine } = mount("<div></div>", {});
        engine.options.directives!["x-text"] = { empty: "全局", top: "G" };
        const d = probe(engine, { hostOptions: { empty: "宿主", host: "H" } } as any, "text");
        (d as any).options = { empty: "指令", opt: "O" };
        expect(d.getOption("empty")).toBe("指令");
        expect(d.getOption("host")).toBe("H");
        expect(d.getOption("top")).toBe("G");
        expect(d.getOption("opt")).toBe("O");
    });

    test("Runtime 通道（无 binding）：跳过宿主层、全局默认层照常生效", () => {
        const { engine } = mount("<div></div>", {});
        engine.options.directives!["x-loading"] = { delay: 500 };
        const d = probe(engine, undefined, "loading");
        expect(d.getOption("delay")).toBe(500);
        expect(d.getOption("nope")).toBeUndefined();
    });

    test("活读：构造后改表，之后的读取即见新值", () => {
        const { engine } = mount("<div></div>", {});
        const d = probe(engine, undefined, "text");
        expect(d.getOption("empty")).toBeUndefined();
        engine.options.directives!["x-text"] = { empty: "后来" };
        expect(d.getOption("empty")).toBe("后来");
    });

    test("构造器默认补空表（运行时注入路径可用）", () => {
        const { engine } = mount("<div></div>", {});
        expect(engine.options.directives).toEqual({});
    });
});

describe("集成 - x-text 空值占位读全局默认", () => {
    test('全局 {"x-text":{empty}} 生效（内置默认空串被覆盖）', () => {
        const { root } = mount(`<span x-text="v"></span>`, { v: null }, {
            directives: { "x-text": { empty: "暂无数据" } },
        } as any);
        expect(root.querySelector("span")!.textContent).toBe("暂无数据");
    });

    test("裸名 key 等价生效", () => {
        const { root } = mount(`<span x-text="v"></span>`, { v: null }, {
            directives: { text: { empty: "裸名" } },
        } as any);
        expect(root.querySelector("span")!.textContent).toBe("裸名");
    });

    test("元素级 x-text-options 压全局默认", () => {
        const { root } = mount(
            `<span x-text="v" x-text-options="{empty:'元素级'}"></span>`,
            { v: null },
            { directives: { "x-text": { empty: "全局级" } } } as any,
        );
        expect(root.querySelector("span")!.textContent).toBe("元素级");
    });

    test("宿主 x-options 压全局默认", () => {
        const { root } = mount(
            `<span x-text="v" x-options="{empty:'宿主级'}"></span>`,
            { v: null },
            { directives: { "x-text": { empty: "全局级" } } } as any,
        );
        expect(root.querySelector("span")!.textContent).toBe("宿主级");
    });

    test("显式写值（false）阻断全局默认", () => {
        const { root } = mount(
            `<span x-text="v" x-text-options="{empty:false}"></span>`,
            { v: null },
            { directives: { "x-text": { empty: "全局级" } } } as any,
        );
        // 显式 false 即命中（String(false) 渲染 "false"），不回退全局
        expect(root.querySelector("span")!.textContent).toBe("false");
    });

    test("编译期快照的选项成员不追溯（empty 于 created 期读取一次，运行时注入不热应用）", async () => {
        const { root, engine } = mount(`<span x-text="v"></span>`, { v: "a" });
        expect(root.querySelector("span")!.textContent).toBe("a");
        engine.options.directives!["x-text"] = { empty: "后来注入" };
        engine.state.v = null; // 仍走编译期快照的空串（既有「配置成员不热应用」语义）
        await nextTick();
        expect(root.querySelector("span")!.textContent).toBe("");
    });
});

describe("集成 - x-on $options 代理读全局默认", () => {
    test('action 上下文 $options 回退到 directives["x-on"]（挂载后注入、触发时活读）', () => {
        const seen: string[] = [];
        const { root, engine } = mount(`<button @click="read"></button>`, {}, {
            actions: {
                read(this: any) {
                    seen.push(this.$options.flag);
                },
            },
        } as any);
        // 挂载后才注入全局默认：$options 在事件触发时经代理现读（活读，ADR-0127）
        engine.options.directives!["x-on"] = { flag: "全局" };
        root.querySelector("button")!.dispatchEvent(new Event("click"));
        expect(seen).toEqual(["全局"]);
    });
});
