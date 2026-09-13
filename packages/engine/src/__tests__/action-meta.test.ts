import { describe, expect, test } from "bun:test";
import "./setup";
import { mount, nextTick } from "./helpers";
import type { ActionDesc } from "../actions/types";

/**
 * action 元数据化（ADR-0036）—— ActionDesc 统一存储形态。
 *
 * - **规范化**：三入口（options.actions / engine.actions Proxy / script type）统一接受
 *   函数简写 | 对象写法（`{ title, icon, handle }`，handle 必需、其余自由元数据），混用允许；
 *   存储层全量规范化为描述符，name 以注册键注入覆盖；非法声明 error + 跳过该条。
 * - **this.action**：handle 内自引用活引用（元数据可读写、无响应式承诺；递归调用再触发广播）。
 * - **广播**：两通道 payload/detail 嵌套 `action` = 完整描述符（含 handle 本体，不承诺可序列化），
 *   顶层字段不变。
 * - **透明解包**：x-on / x-model / 异步源内部取 `.handle` 调用，模板侧行为零变化。
 */
describe("action 元数据化（ADR-0036 ActionDesc）", () => {
    // ── 规范化：三入口统一 ─────────────────────────────────────────────

    test("options.actions 对象写法：规范化为描述符，name 注入，handle 可触发", async () => {
        const { root, engine } = mount(
            `<button @click="toggle">x</button>`,
            { local: false },
            {
                actions: {
                    toggle: {
                        title: "切换",
                        icon: "sun",
                        handle() {
                            this.engine.state.local = !this.engine.state.local;
                        },
                    },
                },
            },
        );
        // 存储层全量规范化：值恒为描述符（非函数）
        const desc = engine.actions.toggle as ActionDesc;
        expect(typeof desc).toBe("object");
        expect(desc.name).toBe("toggle");
        expect(desc.title).toBe("切换");
        expect(desc.icon).toBe("sun");
        expect(typeof desc.handle).toBe("function");
        // 模板侧零变化：@click 直接命中
        root.querySelector("button")!.click();
        await nextTick();
        expect(engine.state.local).toBe(true);
    });

    test("Proxy 赋值对象写法：engine.actions.x = {title, icon, handle} 自动规范化", async () => {
        const { root, engine } = mount(`<button @click="run">x</button>`, { n: 0 });
        engine.actions.run = {
            title: "执行",
            handle: () => {
                engine.state.n++;
            },
        };
        expect(engine.actions.run.name).toBe("run");
        expect(engine.actions.run.title).toBe("执行");
        root.querySelector("button")!.click();
        await nextTick();
        expect(engine.state.n).toBe(1);
    });

    test("script type 对象写法（局部）：编译期提取规范化，@click 触发", async () => {
        const { root, engine } = mount(
            `<div x-data="{}"><button @click="toggle">x</button>
             <script type="autospark/actions">
                { toggle: { title: "局部切换", icon: "moon", handle(){ this.engine.state.local = !this.engine.state.local; } } }
             </script></div>`,
            { local: false },
        );
        const desc = engine.actions.toggle as ActionDesc | undefined;
        // 局部 action 不进全局表（ADR-0012），经 scope.getAction 查到
        expect(desc).toBeUndefined();
        root.querySelector("button")!.click();
        await nextTick();
        expect(engine.state.local).toBe(true);
    });

    test("同一 script 块函数简写与对象写法混用（逐条独立判断形态）", async () => {
        const { root, engine } = mount(
            `<div x-data="{}"><button id="a" @click="pay">p</button><button id="b" @click="toggle">t</button>
             <script type="autospark/actions">
                {
                  pay(v){ this.engine.state.log.push("pay:" + v); },
                  toggle: { title: "切换", handle(){ this.engine.state.log.push("toggle:" + this.action.title); } }
                }
             </script></div>`,
            { log: [] as string[] },
        );
        root.querySelector("#a")!.click();
        root.querySelector("#b")!.click();
        await nextTick();
        expect([...engine.state.log]).toEqual(["pay:undefined", "toggle:切换"]);
    });

    test("name 以注册键注入覆盖（对象内声明 name 不生效）", () => {
        const { engine } = mount(`<div></div>`, {});
        engine.actions.real = {
            name: "wrong",
            handle() {},
        } as any;
        expect(engine.actions.real.name).toBe("real");
    });

    test("非法声明（对象缺 handle）error 日志 + 跳过该条，同块其他条目正常", async () => {
        const { root, engine } = mount(
            `<div x-data="{}"><button @click="ok">o</button>
             <script type="autospark/actions">
                { bad: { title: "缺 handle" }, ok(){ this.engine.state.hit = true; } }
             </script></div>`,
            {},
        );
        // bad 未注册（表达式兜底也不产生副作用）；ok 正常
        root.querySelector("button")!.click();
        await nextTick();
        expect(engine.state.hit).toBe(true);
        expect((engine.actions as any).bad).toBeUndefined();
    });

    test("非法声明（Proxy 赋值非函数非对象）：error + 不写入", () => {
        const { engine } = mount(`<div></div>`, {});
        (engine.actions as any).junk = "not-an-action";
        expect((engine.actions as any).junk).toBeUndefined();
    });

    // ── this.action 自引用（决策 4）───────────────────────────────────

    test("handle 内 this.action 自引用：name/title/icon 可读，活引用可写", async () => {
        const seen: any[] = [];
        const { root, engine } = mount(`<button @click="probe">x</button>`, {});
        engine.actions.probe = {
            title: "探针",
            icon: "dot",
            handle() {
                seen.push(this.action.name, this.action.title, this.action.icon);
                this.action.title = "已改"; // 活引用：元数据可写（无响应式承诺）
                this.engine.state.done = true;
            },
        };
        root.querySelector("button")!.click();
        await nextTick();
        expect(seen).toEqual(["probe", "探针", "dot"]);
        expect(engine.actions.probe.title).toBe("已改");
        expect(engine.state.done).toBe(true);
    });

    test("命令式 .handle() 直调：this 非 ctx，this.action 不可达", async () => {
        const seen: unknown[] = [];
        const { engine } = mount(`<div></div>`, {});
        engine.actions.direct = {
            handle() {
                seen.push((this as any)?.action);
            },
        };
        engine.actions.direct.handle();
        expect(seen).toEqual([undefined]);
    });

    test("this.action.handle 递归调用再次触发完整广播，descriptor 不自环", async () => {
        const events: string[] = [];
        let hits = 0;
        const { root, engine } = mount(`<button @click="rec">x</button>`, {});
        engine.actions.rec = {
            title: "递归",
            handle() {
                hits++;
                // 仅外层（this=ctx，this.action 已注入）递归；内层 this=descriptor，
                // 防自环不注入 this.action（ADR-0036 决策 4）——this.action 恒只属于 ctx 层
                if (hits === 1) this.action!.handle();
            },
        };
        engine.on("actions/rec/pending", () => events.push("pending"));
        engine.on("actions/rec/resolved", () => events.push("resolved"));
        root.querySelector("button")!.click();
        await nextTick();
        // 外层 + 递归①共 2 次执行：同步链 pending×2，再由内向外 resolved×2
        expect(events).toEqual(["pending", "pending", "resolved", "resolved"]);
        // descriptor 未被注入污染（无 action 自环字段）
        expect((engine.actions.rec as any).action).toBeUndefined();
    });

    // ── 广播带完整描述符（决策 5）─────────────────────────────────────

    test("总线 payload.action = 完整描述符（title/icon/handle 本体），顶层字段不变", async () => {
        const payloads: any[] = [];
        const { root, engine } = mount(`<button @click="save">x</button>`, {});
        engine.actions.save = {
            title: "保存",
            icon: "disk",
            async handle() {
                return "done";
            },
        };
        engine.on("actions/save/pending", (m: any) => payloads.push(["pending", m.payload]));
        engine.on("actions/save/resolved", (m: any) => payloads.push(["resolved", m.payload]));
        root.querySelector("button")!.click();
        await nextTick();
        expect(payloads[0][1].name).toBe("save"); // 顶层字段不动
        expect(payloads[0][1].action.title).toBe("保存");
        expect(payloads[0][1].action.icon).toBe("disk");
        expect(payloads[0][1].action.name).toBe("save");
        expect(typeof payloads[0][1].action.handle).toBe("function");
        expect(payloads[0][1].action.handle).toBe(engine.actions.save.handle); // 存储同源
        expect(payloads[1][1].result).toBe("done"); // resolved 顶层 result 不变
        expect(payloads[1][1].action.title).toBe("保存");
    });

    test("DOM 冒泡 detail.action = 完整描述符（局部 action 唯一通道同样携带）", async () => {
        const details: any[] = [];
        const { root } = mount(
            `<div id="host" x-data="{}"><button @click="localAct">x</button>
             <script type="autospark/actions">
                { localAct: { title: "局部动作", handle(){ this.engine.state.done = true; } } }
             </script></div>`,
            {},
        );
        root.querySelector("#host")!.addEventListener("action:localAct", (e: Event) => {
            details.push((e as CustomEvent).detail);
        });
        root.querySelector("button")!.click();
        await nextTick();
        expect(details.length).toBeGreaterThanOrEqual(1);
        expect(details[0].name).toBe("localAct");
        expect(details[0].phase).toBe("pending");
        expect(details[0].action.title).toBe("局部动作");
        expect(typeof details[0].action.handle).toBe("function");
        // 局部 action 不进总线：engine 总线无信号（ADR-0012 照旧）
        const resolved = details.find((d) => d.phase === "resolved");
        expect(resolved.action.title).toBe("局部动作");
    });

    // ── 防重包装（决策 6）─────────────────────────────────────────────

    test("跨名赋值同一已规范化描述符：解包重包装，广播名跟随注册键", async () => {
        const pendings: string[] = [];
        const { root, engine } = mount(`<button @click="copy">x</button>`, {});
        engine.actions.dup = { title: "原始", handle() {} };
        engine.actions.copy = engine.actions.dup as any; // 跨名赋值：浅拷贝解包，name 覆盖为 copy
        engine.on("actions/dup/pending", () => pendings.push("dup"));
        engine.on("actions/copy/pending", () => pendings.push("copy"));
        root.querySelector("button")!.click();
        await nextTick();
        // 广播名跟随注册键 copy（闭包重新捕获），各一次、无双重
        expect(pendings).toEqual(["copy"]);
        expect(engine.actions.copy.name).toBe("copy");
        expect(engine.actions.copy.handle).not.toBe(engine.actions.dup.handle);
    });

    // ── 内置信号型 action（决策 7）───────────────────────────────────

    test("内置 yes/no/cancel/close：自动注册，handle 透传首参 + title + builtin 标记", () => {
        const { engine } = mount(`<div></div>`, {});
        for (const name of ["yes", "no", "cancel", "close"]) {
            const desc = (engine.actions as any)[name] as ActionDesc;
            expect(desc.name).toBe(name);
            expect(typeof desc.handle).toBe("function");
            expect(desc.title).toBeTruthy();
            expect(desc.builtin).toBe(true);
            // 透传：close(1) → handle 调用返回 1
            expect(desc.handle(1)).toBe(1);
        }
    });

    test("内置信号语义：@click=\"close(1)\" 触发，resolved 广播透传载荷 result=1", async () => {
        const seen: any[] = [];
        const { root } = mount(
            `<div id="dialog">
               <button id="x" @click="close(1)">✕</button>
             </div>`,
            {},
        );
        root.querySelector("#dialog")!.addEventListener("action:close", (e: Event) => {
            const d = (e as CustomEvent).detail;
            seen.push(d.phase, d.result, d.action?.title);
        });
        root.querySelector("#x")!.click();
        await nextTick();
        // 透传 handle 同步完成：pending → resolved，resolved 携带 result=1，监听方可读载荷
        expect(seen).toEqual(["pending", undefined, "关闭", "resolved", 1, "关闭"]);
    });

    test("用户同名声明覆盖内置（用户优先，无 builtin 标记）", () => {
        const { engine } = mount(`<div></div>`, {}, { actions: { close: () => "mine" } });
        expect(engine.actions.close.builtin).toBeUndefined();
        expect(engine.actions.close.title).toBeUndefined();
        expect(engine.actions.close.handle()).toBe("mine");
    });

    // ── 消费者透明解包（决策 3：模板侧零变化）────────────────────────

    test("x-model get/set action 形态照常（descriptor 透明解包）", async () => {
        const { root, engine } = mount(
            `<input x-model="price" x-model-options="{get:'fmt(value)', set:'apply($value)'}" />`,
            { price: 100 },
            {
                actions: {
                    fmt: {
                        title: "格式化",
                        handle: (v: number) => `¥${v}`,
                    },
                    apply: {
                        handle($value: string) {
                            this.engine.state.price = Number($value.replace("¥", ""));
                        },
                    },
                },
            },
        );
        expect((root.querySelector("input") as HTMLInputElement).value).toBe("¥100");
        const input = root.querySelector("input") as HTMLInputElement;
        input.value = "¥250";
        input.dispatchEvent(new Event("input"));
        await nextTick();
        expect(engine.state.price).toBe(250);
    });

    test("x-data 异步源 action 形态照常（descriptor 透明解包 + this.action 可用）", async () => {
        const { root } = mount(
            `<div id="d" x-data="loadBook()" x-text="book.title"></div>`,
            {},
            {
                actions: {
                    loadBook: {
                        title: "取书",
                        async handle() {
                            expect(this.action.title).toBe("取书");
                            return { book: { title: "AutoSpark" } };
                        },
                    },
                },
            },
        );
        await nextTick();
        await nextTick();
        // 数据 merge 进 x-data 私有域（_scopes），x-text 细粒度更新
        expect(root.querySelector("#d")?.textContent).toContain("AutoSpark");
    });
});
