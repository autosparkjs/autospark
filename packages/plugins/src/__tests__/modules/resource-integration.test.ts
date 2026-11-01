import { afterEach, describe, expect, test } from "bun:test";
import "../setup";
import { mount as _mount, nextTick } from "../helpers";
import type { AutoSpark } from "autospark";
// 插件自举（ADR-0011）：scriptType 注册 + x-resource 指令 + ready 挂 engine.resources
// + 类静态 AutoSpark.resources（测试环境无 globalThis.AutoSpark——经预加载队列 drain 挂载）
import "../../modules/resource";
import { getGlobalResourceManager } from "../../modules/resource";

/**
 * resource 插件集成测试（ADR-0011）：三条注册路径全链路（script 局部/global、
 * x-resource 指令、AutoSpark.resources.add 全局）× 点号 action 调用 × 三层选项回退 ×
 * mapping 覆盖合并 × 信号广播 × feedback 联动 × 错误形态。
 *
 * 纪律：断言面全标量（测试卫生）；全局单例可变量（AutoSpark.resources.options）用例内
 * 改动 finally 还原；全局 add 的资源名用例唯一（pluginActions 无 remove，跨用例残留无害）。
 */

const engines: AutoSpark[] = [];
const mount = ((...args: Parameters<typeof _mount>) => {
    const m = _mount(...args);
    engines.push(m.engine);
    return m;
}) as typeof _mount;
afterEach(() => {
    for (const e of engines) {
        try {
            e.destroy();
        } catch {
            /* 幂等销毁吞错 */
        }
    }
    engines.length = 0;
});

/** 可变响应 mock fetch：记录调用形态，respond 可换（延迟/错误） */
function makeFetch() {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const state = { respond: () => new Response(JSON.stringify({ ok: 1 }), { status: 200 }) };
    const fn = (async (url: any, init?: any) => {
        calls.push({ url: String(url), init });
        return state.respond();
    }) as typeof fetch;
    return { fn, calls, state };
}

/** 造 options.resources.fetch 配置 */
const fetchOpts = (fn: typeof fetch) => ({ resources: { fetch: fn } });

describe("x-resource 指令（纯 REST 注册位）", () => {
    test('声明即注册：@click="ord1.get(1)" 走默认映射 GET {url}/{id} + baseUrl 拼接', async () => {
        const { fn, calls } = makeFetch();
        const { root } = mount(
            `<div x-resource:ord1="/orders"><button @click="ord1.get(1)">x</button></div>`,
            {},
            fetchOpts(fn),
        );
        root.querySelector("button")!.click();
        await nextTick();
        expect(calls.length).toBe(1);
        expect(calls[0]!.url).toBe("/orders/1");
        expect((calls[0]!.init as RequestInit).method).toBe("GET");
    });

    test("指令属性编译期剪枝（结果 DOM 不留 x-resource 痕迹）", () => {
        const { root } = mount(
            `<div x-resource:ord1x="/orders"><button @click="ord1x.getMany()">x</button></div>`,
            {},
        );
        expect(root.querySelector("button")).not.toBeNull();
        expect(root.innerHTML).not.toContain("x-resource");
    });

    test("批删形态：delete([1,2]) → DELETE {url}?ids=1,2", async () => {
        const { fn, calls } = makeFetch();
        const { root } = mount(
            `<div x-resource:ord1d="/orders"><button @click="ord1d.delete([1,2])">x</button></div>`,
            {},
            fetchOpts(fn),
        );
        root.querySelector("button")!.click();
        await nextTick();
        expect(calls[0]!.url).toBe("/orders?ids=1%2C2");
        expect((calls[0]!.init as RequestInit).method).toBe("DELETE");
    });

    test("缺属性参数 / 缺 url 值：warn + 不注册", () => {
        const warns: string[] = [];
        const orig = console.warn;
        console.warn = (...a: any[]) => warns.push(String(a[0]));
        try {
            const { root, engine } = mount(`<div x-resource="/orders"><button>y</button></div>`, {});
            expect(root.querySelector("button")).not.toBeNull();
            expect(warns.some((w) => w.includes("x-resource"))).toBe(true);
            expect((engine as any).actions["ord.get"]).toBeUndefined();
        } finally {
            console.warn = orig;
        }
    });
});

describe('script type="autospark/resources"（三形态定义）', () => {
    test("纯方法集写 state：this.store.state 联动 x-text（new Function 求值）", async () => {
        const { root } = mount(
            `<div x-data="{}"><button @click="res2b.mark">+</button><span x-text="tag"></span>` +
                `<script type="autospark/resources">{ res2b: { mark(){ this.store.state.tag = "hit" } } }</script></div>`,
            { tag: "none" },
        );
        root.querySelector("button")!.click();
        await nextTick();
        expect(root.querySelector("span")!.textContent).toBe("hit");
    });

    test("混搭：url 打底 + 覆写 getMany（内联 mapping 与手写方法两条路都生效）", async () => {
        const { fn, calls } = makeFetch();
        let result: any;
        const { root } = mount(
            `<div x-data="{}"><button @click="res3.getMany()">a</button><button @click="res3.get(5)">b</button>` +
                `<script type="autospark/resources">{ res3: { url: "/orders", getMany(){ return "custom" } } }</script></div>`,
            {},
            fetchOpts(fn),
        );
        const btns = root.querySelectorAll("button");
        // 手写方法返回值经局部 action 的 DOM 冒泡通道捕获（action:<id> CustomEvent，
        // detail.result——同步返回立即 resolved；总线仅全局 action，ADR-0012）
        btns[0]!.addEventListener("action:res3.getMany", (e: any) => (result = e.detail?.result));
        btns[0]!.click();
        await nextTick();
        expect(result).toBe("custom");
        expect(calls.length).toBe(0);
        btns[1]!.click(); // 未覆写的 get 走默认映射
        await nextTick();
        expect(calls[0]!.url).toBe("/orders/5");
    });

    test("global 属性：engine 级注册，任意 scope 可见 + 总线信号广播", async () => {
        const { fn } = makeFetch();
        const events: string[] = [];
        const { root, engine } = mount(
            `<div><button @click="res4g.get(1)">x</button>` +
                `<script type="autospark/resources" global>{ res4g: "/orders" }</script></div>`,
            {},
            fetchOpts(fn),
        );
        engine.on("actions/res4g.get/pending" as any, () => events.push("pending"));
        engine.on("actions/res4g.get/resolved" as any, () => events.push("resolved"));
        root.querySelector("button")!.click();
        await nextTick();
        expect(events).toEqual(["pending", "resolved"]);
    });

    test("局部 script 就近覆盖：内层同名资源遮蔽外层", async () => {
        const { root } = mount(
            `<div x-data="{}"><script type="autospark/resources">{ res5: { mark(){ this.store.state.tag = "outer" } } }</script>` +
                `<div x-data="{}"><script type="autospark/resources">{ res5: { mark(){ this.store.state.tag = "inner" } } }</script>` +
                `<button @click="res5.mark">x</button></div></div>`,
            { tag: "none" },
        );
        root.querySelector("button")!.click();
        await nextTick();
        const engine = engines[engines.length - 1]!;
        expect((engine.state as any).tag).toBe("inner");
    });

    test("逐名就近（非整资源覆盖）：内层 x-resource 未声明的方法沿链命中外层 script", async () => {
        const { root } = mount(
            `<div x-data="{}"><script type="autospark/resources">{ res6: { mark(){ this.store.state.tag = "script" } } }</script>` +
                `<div x-resource:res6="/inside"><button @click="res6.mark">x</button></div></div>`,
            { tag: "none" },
        );
        root.querySelector("button")!.click();
        await nextTick();
        const engine = engines[engines.length - 1]!;
        expect((engine.state as any).tag).toBe("script");
    });
});

describe("mapping 覆盖合并（默认表 ← options ← 内联，浅合并）", () => {
    test("options.resources.mapping 覆盖 getMany，get 仍走默认", async () => {
        const { fn, calls } = makeFetch();
        const { root } = mount(
            `<div x-resource:res7="/orders"><button @click="res7.getMany({page:2})">a</button><button @click="res7.get(1)">b</button></div>`,
            {},
            {
                resources: {
                    fetch: fn,
                    mapping: {
                        getMany: (url: string, o: any = {}) => ({
                            method: "GET",
                            url: `${url}/search`,
                            query: { p: o.page },
                        }),
                    },
                },
            },
        );
        const btns = root.querySelectorAll("button");
        btns[0]!.click();
        await nextTick();
        expect(calls[0]!.url).toBe("/orders/search?p=2"); // 覆盖生效
        btns[1]!.click();
        await nextTick();
        expect(calls[1]!.url).toBe("/orders/1"); // 未覆盖键沿用默认
    });

    test("资源内联 mapping 优先于 options 层", async () => {
        const { fn, calls } = makeFetch();
        const { root } = mount(
            `<div x-data="{}"><button @click="res8.get(1)">x</button>` +
                `<script type="autospark/resources">{ res8: { url: "/orders", mapping: { get: (url, id) => ({ method: "GET", url: url + "/" + id + "/detail" }) } } }</script></div>`,
            {},
            {
                resources: {
                    fetch: fn,
                    mapping: {
                        get: (url: string, id: any) => ({ method: "GET", url: `${url}/v9/${id}` }),
                    },
                },
            },
        );
        root.querySelector("button")!.click();
        await nextTick();
        expect(calls[0]!.url).toBe("/orders/1/detail"); // 内联 > options
    });
});

describe("请求选项三层回退（内联 > engine options > 全局默认）", () => {
    test("baseUrl 三层各生效 + 内联最高优先", async () => {
        const g = getGlobalResourceManager();
        const prev = g.options.baseUrl;
        g.options.baseUrl = "/g";
        try {
            const mk = (inlineHtml: string, engineBaseUrl?: string) => {
                const { fn, calls } = makeFetch();
                const { root } = mount(
                    `<div x-data="{}"><button @click="res9.get(1)">x</button>${inlineHtml}</div>`,
                    {},
                    engineBaseUrl
                        ? { resources: { fetch: fn, baseUrl: engineBaseUrl } }
                        : fetchOpts(fn),
                );
                return { calls, btn: root.querySelector("button")! };
            };
            // 全局层（engine 无 baseUrl）
            let m = mk(`<script type="autospark/resources">{ res9: { url: "/o" } }</script>`);
            m.btn.click();
            await nextTick();
            expect(m.calls[0]!.url).toBe("/g/o/1");
            // engine 层覆盖全局
            m = mk(`<script type="autospark/resources">{ res9: { url: "/o" } }</script>`, "/e");
            m.btn.click();
            await nextTick();
            expect(m.calls[0]!.url).toBe("/e/o/1");
            // 内联覆盖 engine
            m = mk(
                `<script type="autospark/resources">{ res9: { url: "/o", baseUrl: "/i" } }</script>`,
                "/e",
            );
            m.btn.click();
            await nextTick();
            expect(m.calls[0]!.url).toBe("/i/o/1");
        } finally {
            g.options.baseUrl = prev;
        }
    });

    test("unwrap 经 engine options 注入（映射方法剥壳后 resolve）", async () => {
        const { fn, state } = makeFetch();
        state.respond = () => new Response(JSON.stringify({ code: 0, data: [7, 8] }), { status: 200 });
        const { root } = mount(
            `<div x-data="{}"><button @click="grab">x</button>` +
                `<script type="autospark/resources" global>{ resA1: "/orders" }</script>` +
                `<script type="autospark/actions">{ async grab(){ this.store.state.r = JSON.stringify(await this.engine.actions["resA1.get"].handle.call(this, 1)) } }</script></div>`,
            { r: "none" },
            { resources: { fetch: fn, unwrap: (d: any) => d.data } },
        );
        root.querySelector("button")!.click();
        await nextTick();
        const engine = engines[engines.length - 1]!;
        expect((engine.state as any).r).toBe("[7,8]"); // 壳已剥（不剥则为整壳对象串）
    });
});

describe("AutoSpark.resources.add（跨 engine 全局唯一动态入口）", () => {
    test("add 后新 engine 模板可调（插件全局表惰性物化）+ 同名覆盖 warn", async () => {
        const g = getGlobalResourceManager();
        const warns: string[] = [];
        const orig = console.warn;
        console.warn = (...a: any[]) => warns.push(String(a[0]));
        try {
            g.add("resG1", "/g-orders");
            g.add("resG1", "/g-orders-2"); // 同名覆盖 + warn
        } finally {
            console.warn = orig;
        }
        expect(warns.some((w) => w.includes("resG1"))).toBe(true);
        expect(g.get("resG1")).toBe("/g-orders-2");
        expect(g.has("resG1")).toBe(true);

        const { fn, calls } = makeFetch();
        const { root } = mount(
            `<div><button @click="resG1.get(3)">x</button></div>`,
            {},
            fetchOpts(fn),
        );
        root.querySelector("button")!.click();
        await nextTick();
        expect(calls[0]!.url).toBe("/g-orders-2/3"); // 覆盖后的定义生效
    });

    test("批量重载 add({ name: def })", async () => {
        const g = getGlobalResourceManager();
        g.add({ resG2: "/g2", resG3: "/g3" });
        expect(g.has("resG2") && g.has("resG3")).toBe(true);
        const { fn, calls } = makeFetch();
        const { root } = mount(`<button @click="resG3.delete(9)">x</button>`, {}, fetchOpts(fn));
        root.querySelector("button")!.click();
        await nextTick();
        expect(calls[0]!.url).toBe("/g3/9");
        expect((calls[0]!.init as RequestInit).method).toBe("DELETE");
    });

    test("engine.resources 视图：add 注册 engine 私有（engine.actions 可见）", async () => {
        const { fn, calls } = makeFetch();
        const { root, engine } = mount(`<button @click="resE1.get(1)">x</button>`, {}, fetchOpts(fn));
        engine.resources.add("resE1", "/e-orders");
        root.querySelector("button")!.click();
        await nextTick();
        expect(calls[0]!.url).toBe("/e-orders/1");
        // engine 视图 options 即 options.resources（编程面）
        const opts: any = engine.resources.options;
        expect(opts.fetch).toBe(fn);
    });
});

describe("错误形态与 feedback 联动", () => {
    test("非 2xx：rejected 信号 + ResourceError 标量（engine 级资源总线可见）", async () => {
        const { fn, state } = makeFetch();
        state.respond = () => new Response("nope", { status: 404 });
        const events: any[] = [];
        const { root, engine } = mount(
            `<div><button @click="resErr.get(1)">x</button>` +
                `<script type="autospark/resources" global>{ resErr: "/orders" }</script></div>`,
            {},
            fetchOpts(fn),
        );
        engine.on("actions/resErr.get/rejected" as any, (envelope: any) => events.push(envelope));
        root.querySelector("button")!.click();
        await new Promise((r) => setTimeout(r, 10)); // rejected 经 promise then 广播（微任务链）
        expect(events.length).toBe(1);
        // 总线回调收 {type, payload} 信封（FastLiteEvent 契约）；payload = { id, action, error }
        // （buildAction 决策 5）；投影断言标量
        const err = events[0]?.payload?.error;
        expect(err?.name).toBe("ResourceError");
        expect(err?.status).toBe(404);
        expect(err?.url).toBe("/orders/1");
        expect(err?.method).toBe("GET");
    });

    test("@click.feedback：资源 Promise pending 期 pending 类 + 终态切换（返回值捕获联动）", async () => {
        let release!: (v: void) => void;
        const gate = new Promise<void>((r) => (release = r));
        // 延迟响应：gate 放行前保持 pending（feedback 信号源 = 返回值捕获，ADR-0008）
        const slowFetch = (async (_url: any, _init?: any) => {
            await gate;
            return new Response(JSON.stringify({ ok: 1 }), { status: 200 });
        }) as typeof fetch;
        const { root } = mount(
            `<div><button @click.feedback="resFb.get(1)">x</button>` +
                `<script type="autospark/resources" global>{ resFb: "/orders" }</script></div>`,
            {},
            fetchOpts(slowFetch),
        );
        const btn = root.querySelector("button")!;
        btn.click();
        await nextTick();
        expect(btn.classList.contains("pending")).toBe(true); // pending 期（裸 .feedback = 类名模式）
        release();
        await new Promise((r) => setTimeout(r, 20));
        expect(btn.classList.contains("pending")).toBe(false); // 终态移除 pending
        expect(btn.classList.contains("resolved")).toBe(true); // 加终态类（timeout:0 常驻）
    });
});
