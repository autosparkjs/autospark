import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import "../setup";
import { mount, nextTick } from "../helpers";
import { queryRelElement } from "../../utils/queryRelElement";

describe("x-isolate inline 子引擎", () => {
    test("inline：内部模板由独立 child engine 编译（x-data/x-text 正常生效）", () => {
        const { root } = mount(
            `<div x-isolate><div x-data="{ n: 1 }"><span x-text="n"></span></div></div>`,
            {},
        );
        expect(root.querySelector("span")?.textContent).toBe("1");
        // child engine 编译产物剥除指令属性（引擎全局惯例）
        expect(root.querySelector("div")?.hasAttribute("x-data")).toBe(false);
    });

    test("inline：与父状态零耦合（child 读不到父 state，父变化不影响 child）", async () => {
        const { root, engine } = mount(
            `<div><span x-text="n"></span><div x-isolate><span x-text="n"></span></div></div>`,
            { n: "P" },
        );
        const spans = root.querySelectorAll("span");
        expect(spans[0]!.textContent).toBe("P"); // 父绑定正常
        expect(spans[1]!.textContent).toBe(""); // child 无 n（隔离，undefined 求值为空）
        engine.state.n = "Q";
        await nextTick();
        expect(root.querySelectorAll("span")[0]!.textContent).toBe("Q");
        expect(root.querySelectorAll("span")[1]!.textContent).toBe(""); // child 仍不受影响
    });

    test("inline 种子：{...} 字面量作为 child 初始 state", () => {
        const { root } = mount(
            `<div x-isolate="{ n: 5 }"><span x-text="n"></span></div>`,
            {},
        );
        expect(root.querySelector("span")?.textContent).toBe("5");
    });

    test("inline 种子：引用父状态求值一次（初值快照），父变化不跟随", async () => {
        const { root, engine } = mount(
            `<div x-isolate="{ n: seed }"><span x-text="n"></span></div>`,
            { seed: 7 },
        );
        expect(root.querySelector("span")?.textContent).toBe("7");
        engine.state.seed = 9;
        await nextTick();
        expect(root.querySelector("span")?.textContent).toBe("7"); // 不订阅：初值快照
    });

    test("inline 种子：求值失败 / 非对象 → warn + 空对象兜底（child 仍建立）", () => {
        // 求值出非对象（{a:1}.a → 数字 1）
        const a = mount(`<div x-isolate="{a:1}.a"><span x-text="n"></span></div>`, {});
        expect(a.root.querySelector("span")).not.toBeNull(); // child 正常建立，state 空 → n 为空
        // 语法错误
        const b = mount(`<div x-isolate="{ a: }"><span>OK</span></div>`, {});
        expect(b.root.querySelector("span")?.textContent).toBe("OK");
    });

    test("inline：x-isolate-options 全量透传为 child engine options（全局组件表可消费）", () => {
        const { root } = mount(
            `<div x-isolate x-isolate-options='{"components":{"greet":"<b>HI</b>"}}'><span x-component:greet></span></div>`,
            {},
        );
        // x-component 实例化：组件模板内容渲染进宿主（宿主即组件根）
        expect(root.querySelector("span")?.textContent).toBe("HI");
    });

    test("teardown：x-if toggle → inline child engine 随 scope 销毁/重建（不跨 toggle 保内容）", async () => {
        const { root, engine } = mount(
            `<div x-if="show"><div x-isolate><div x-data="{ n: 1 }"><span x-text="n"></span></div></div></div>`,
            { show: true },
        );
        await nextTick();
        expect(root.querySelector("span")?.textContent).toBe("1");
        engine.state.show = false;
        await nextTick();
        expect(root.querySelector("span")).toBeNull(); // 子树随 scope 销毁
        engine.state.show = true;
        await nextTick();
        expect(root.querySelector("span")?.textContent).toBe("1"); // 重回填模板 + 重建 child engine
    });

    test("盲区：child 子树内的 runtime 指令不被父 dispatcher 二次 mount", () => {
        const { root } = mount(
            `<div x-isolate><div x-loading><button>go</button></div></div>`,
            {},
        );
        // x-loading 属性由 child dispatcher mount，父 dispatcher 致盲（严格后代）→ 遮罩仅一份
        expect(root.querySelectorAll(".x-loading-overlay").length).toBe(1);
    });
});

describe("x-isolate engine 根标识（data-autospark，ADR-0060）", () => {
    test("app 根与 isolate 宿主打点；destroy 移除", () => {
        const { root, engine } = mount(`<div x-isolate><span>in</span></div>`, {});
        expect(root.hasAttribute("data-autospark")).toBe(true); // app 根
        // inline 编译剥除 x-isolate 属性——宿主是 root 中唯一被 child engine 打点的直接子元素
        const host = root.firstElementChild!;
        expect(host.hasAttribute("data-autospark")).toBe(true); // 宿主 = child engine 根
        engine.destroy();
        expect(root.hasAttribute("data-autospark")).toBe(false); // 对称移除
    });
});

describe("queryRelElement engine 边界止步（data-autospark，ADR-0060）", () => {
    test("^ closest 与 ../ 爬升止于 engine 根，不越入相邻 engine DOM；/ 全局不受限", () => {
        // 结构：outer-target（父 engine DOM）> mid > isolate 宿主（child engine 根）> span
        const { root } = mount(
            `<div class="outer-target"><div class="mid"><div x-isolate><span>in</span></div></div></div>`,
            {},
        );
        // mount 的 root 是 detached 容器——/ 全局 query 查 document，须挂到 body 才可见
        document.body.appendChild(root);
        const host = root.querySelector(".mid > div")!; // isolate 宿主（child engine 根）
        const span = host.querySelector("span")!;
        const mid = root.querySelector(".mid")!; // 父 engine 内元素

        // ^ closest：child 内元素爬到宿主（engine 根）即止——不命中父 DOM 的 .outer-target
        expect(queryRelElement(span, "^.outer-target")).toBeNull();
        // .mid 在宿主之外（父 engine DOM），child 内不可达
        expect(queryRelElement(span, "^.mid")).toBeNull();
        // 父 engine 内元素不受影响（同一 engine 内正常 closest）
        expect(queryRelElement(mid, "^.outer-target")).toBe(mid.parentElement);

        // ../ 爬升：child 内元素爬升止于宿主，query 范围限于宿主内部
        expect(queryRelElement(span, "../.outer-target")).toBeNull();

        // / 全局显式跨边界，不受止步约束
        expect(queryRelElement(span, "/.outer-target")).not.toBeNull();

        root.remove();
    });
});

describe("x-isolate 远程子引擎", () => {
    let origFetch: typeof globalThis.fetch;
    let fetchCalls: string[] = [];

    beforeEach(() => {
        origFetch = globalThis.fetch;
        fetchCalls = [];
    });
    afterEach(() => {
        globalThis.fetch = origFetch;
    });

    /** 按 url → body 映射 mock fetch（未命中 url 返回 404） */
    function mockFetch(map: Record<string, string>) {
        globalThis.fetch = (async (input: any) => {
            const url = String(typeof input === "string" ? input : (input?.url ?? input));
            fetchCalls.push(url);
            const body = map[url];
            if (body === undefined) return { ok: false, status: 404, text: async () => "" } as any;
            return { ok: true, status: 200, text: async () => body } as any;
        }) as any;
    }

    test("remote：fetch url → child engine 编译 fetched HTML（独立 store，自身 x-data 自治）", async () => {
        mockFetch({ "/post": `<div x-data="{ name: 'child' }"><span x-text="name"></span></div>` });
        const { root } = mount(`<div x-isolate="url"></div>`, { url: "/post" });
        await nextTick();
        // child engine 用自身 x-data 的 name 渲染（与父 store 完全隔离）
        expect(root.querySelector("span")?.textContent).toBe("child");
    });

    test("remote：宿主内部内容 → warn + 忽略（互斥，fetch 结果替换）", async () => {
        mockFetch({ "/x": `<span>REMOTE</span>` });
        const { root } = mount(`<div x-isolate="url"><p>IGNORED</p></div>`, { url: "/x" });
        await nextTick();
        expect(root.querySelector("p")).toBeNull(); // 内容被替换
        expect(root.querySelector("span")?.textContent).toBe("REMOTE");
    });

    test("remote：url 响应式变化 → 销毁旧 child engine + 重 fetch 新模板", async () => {
        mockFetch({
            "/a": `<div x-data="{ name: 'A' }"><span x-text="name"></span></div>`,
            "/b": `<div x-data="{ name: 'B' }"><span x-text="name"></span></div>`,
        });
        const { root, engine } = mount(`<div x-isolate="url"></div>`, { url: "/a" });
        await nextTick();
        expect(root.querySelector("span")?.textContent).toBe("A");
        engine.state.url = "/b";
        await nextTick();
        expect(root.querySelector("span")?.textContent).toBe("B");
    });

    test("remote：初值空 → 不 fetch、宿主空；赋值后 fetch", async () => {
        mockFetch({ "/late": `<span>LATE</span>` });
        const { root, engine } = mount(`<div x-isolate="url"></div>`, { url: "" });
        await nextTick();
        expect(fetchCalls.length).toBe(0);
        expect(root.querySelector("span")).toBeNull();
        engine.state.url = "/late";
        await nextTick();
        expect(fetchCalls).toContain("/late");
        expect(root.querySelector("span")?.textContent).toBe("LATE");
    });

    test("remote：fetch 失败 → 错误占位（不静默）", async () => {
        mockFetch({}); // 所有 url 404
        const { root } = mount(`<div x-isolate="url"></div>`, { url: "/bad" });
        await nextTick();
        expect(root.querySelector(".x-isolate-error")).not.toBeNull();
    });

    test("remote：fetch 期间经 x-loading 显示遮罩，完成后移除并替换为产物", async () => {
        let resolveFetch: () => void = () => {};
        globalThis.fetch = (async () => {
            await new Promise<void>((r) => {
                resolveFetch = r;
            });
            return { ok: true, status: 200, text: async () => `<span>OK</span>` } as any;
        }) as any;
        const { root } = mount(`<div x-isolate="url"></div>`, { url: "/slow" });
        await nextTick();
        // 复用 x-loading 运行时指令：宿主加属性 → dispatcher mount 遮罩
        expect(root.querySelector(".x-loading-overlay")).not.toBeNull();
        resolveFetch();
        await nextTick();
        // 完成后移除属性 → 遮罩消失、换上 child engine 产物
        expect(root.querySelector(".x-loading-overlay")).toBeNull();
        expect(root.querySelector("span")?.textContent).toBe("OK");
    });

    test("teardown：x-if toggle false→true 重新 fetch（child engine 随 scope 销毁，β 不跨 toggle 保内容）", async () => {
        mockFetch({ "/t": `<span>T</span>` });
        const { root, engine } = mount(`<div x-if="show"><div x-isolate="url"></div></div>`, {
            show: true,
            url: "/t",
        });
        await nextTick();
        expect(root.querySelector("span")?.textContent).toBe("T");
        const firstCalls = fetchCalls.length;

        engine.state.show = false; // 销毁子树（含 child engine）
        await nextTick();
        expect(root.querySelector("span")).toBeNull();

        engine.state.show = true; // 重建 → 重新 fetch（β）
        await nextTick();
        expect(root.querySelector("span")?.textContent).toBe("T");
        expect(fetchCalls.length).toBeGreaterThan(firstCalls); // 确认重新 fetch，非保内容
    });
});
