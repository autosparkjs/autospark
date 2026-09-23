import { describe, expect, test, mock, beforeEach, afterEach } from "bun:test";
import "./setup";
import { AutoSpark } from "../engine";
import { mount, nextTick } from "./helpers";

/**
 * 挂载并拦截 logger.warn（编译期同步 warn 也可靠捕获）：
 * autostart:false 构造 → 先替换 warn → 再手动 compile。
 */
function mountCaptureWarn(html: string, state: any) {
    const root = document.createElement("div");
    root.innerHTML = html.trim();
    const engine = new AutoSpark(root, state, { autostart: false });
    const warns: string[] = [];
    (engine.logger as any).warn = (msg: any) => warns.push(String(msg));
    engine.compile();
    return { root, engine, warns };
}

/**
 * x-component 实例化指令的 props 语义测试（ADR-0054）。
 *
 * 覆盖：
 * - 组件名静态承载于属性参数：缺参 warn（纯标识符值附言迁移指引）+ 跳过实例化
 * - 无值 = 无 props
 * - 字面量成员引用状态路径：成员级响应式（表达式支路依赖收集）
 * - 纯状态路径：按键展开 + 深层触发（depth:2——子键改/增/整体替换均触发、删键残留）
 * - 单向数据流：组件内改 props 不回写外部状态
 * - `name` 等旧特殊字段回归普通 prop 名
 * - 标量 / 数组 props 值 warn 忽略
 * - 旧 x-use 静默失效（彻底移除，无 warn）
 */

describe("x-component props 语义（ADR-0054）", () => {
    test("缺少属性参数：warn 缺组件名 + 跳过实例化（值非纯标识符无附言）", async () => {
        const { root, warns } = mountCaptureWarn(
            `<div x-scope>
                <div x-define="greeting"><span class="hi">你好</span></div>
                <div id="h" x-component="order.label"></div>
             </div>`,
            { order: { label: "x" } },
        );
        await nextTick();
        const host = root.querySelector("#h")!;
        // 不实例化：宿主无组件内容
        expect(host.querySelector(".hi")).toBeNull();
        const hit = warns.find((w) => w.includes("缺少组件名"));
        expect(hit).toBeDefined();
        expect(hit).not.toInclude("x-define");
    });

    test("缺少属性参数且值为纯标识符：warn 附言迁移指引（指向 x-define）", async () => {
        const { root, warns } = mountCaptureWarn(
            `<div x-scope>
                <div id="h" x-component="counter"></div>
             </div>`,
            {},
        );
        await nextTick();
        const host = root.querySelector("#h")!;
        expect(host.children.length).toBe(0);
        const hit = warns.find((w) => w.includes("缺少组件名"));
        expect(hit).toBeDefined();
        expect(hit!).toContain('x-define="counter"');
    });

    test("无值形态：无 props 实例化", async () => {
        const { root } = mount(
            `<div x-scope>
                <div id="h" x-component:plain></div>
                <div x-define="plain"><span class="v" x-text="count"></span></div>
                <script></script>
             </div>`,
            {},
        );
        await nextTick();
        expect(root.querySelector("#h .v")).toBeDefined();
    });

    test("字面量成员引用状态路径：成员级响应式（order.count 变 → 组件更新）", async () => {
        const { root, engine } = mount(
            `<div x-scope>
                <div id="h" x-component:counter="{ count: order.count }"></div>
                <div x-define="counter">
                    <span class="c" x-text="count"></span>
                    <script setup>{ state(){ return { count: 0 } } }</script>
                </div>
             </div>`,
            { order: { count: 1 } },
        );
        await nextTick();
        expect(root.querySelector(".c")?.textContent).toBe("1");
        (engine.store.state as any).order.count = 99;
        await nextTick();
        expect(root.querySelector(".c")?.textContent).toBe("99");
    });

    test("纯状态路径：按键展开为 props（v-bind=obj 心智）", async () => {
        const { root } = mount(
            `<div x-scope>
                <div id="h" x-component:box="order"></div>
                <div x-define="box">
                    <span class="a" x-text="a"></span><span class="b" x-text="b"></span>
                </div>
             </div>`,
            { order: { a: 1, b: 2 } },
        );
        await nextTick();
        expect(root.querySelector(".a")?.textContent).toBe("1");
        expect(root.querySelector(".b")?.textContent).toBe("2");
    });

    test("纯状态路径：深层触发——子键值变（标量拷贝需重求值）", async () => {
        const { root, engine } = mount(
            `<div x-scope>
                <div id="h" x-component:box="order"></div>
                <div x-define="box"><span class="a" x-text="a"></span></div>
             </div>`,
            { order: { a: 1 } },
        );
        await nextTick();
        expect(root.querySelector(".a")?.textContent).toBe("1");
        (engine.store.state as any).order.a = 5;
        await nextTick();
        expect(root.querySelector(".a")?.textContent).toBe("5");
    });

    test("纯状态路径：深层触发——新增子键（props 集合扩展）", async () => {
        const { root, engine } = mount(
            `<div x-scope>
                <div id="h" x-component:box="order"></div>
                <div x-define="box"><span class="b" x-text="b"></span></div>
             </div>`,
            { order: {} as Record<string, any> },
        );
        await nextTick();
        expect(root.querySelector(".b")?.textContent).toBe("");
        (engine.store.state as any).order.b = "新键";
        await nextTick();
        expect(root.querySelector(".b")?.textContent).toBe("新键");
    });

    test("纯状态路径：整体替换触发 + 删键残留（不镜像同步）", async () => {
        const { root, engine } = mount(
            `<div x-scope>
                <div id="h" x-component:box="order"></div>
                <div x-define="box"><span class="a" x-text="a"></span><span class="b" x-text="b"></span></div>
             </div>`,
            { order: { a: 1, b: 2 } },
        );
        await nextTick();
        expect(root.querySelector(".a")?.textContent).toBe("1");
        // 整体替换为少键对象：出现键覆盖、被删键残留（组件内部状态不被重置，ADR-0054 决策三）
        (engine.store.state as any).order = { a: 10 };
        await nextTick();
        expect(root.querySelector(".a")?.textContent).toBe("10");
        expect(root.querySelector(".b")?.textContent).toBe("2"); // b 残留
    });

    test("单向数据流：组件内修改 props 不回写外部状态", async () => {
        const { root, engine } = mount(
            `<div x-scope>
                <div id="h" x-component:box="{ n: order.n }"></div>
                <div x-define="box">
                    <span class="n" x-text="n"></span>
                    <button class="inc" x-on:click="n = n + 1">+</button>
                </div>
             </div>`,
            { order: { n: 1 } },
        );
        await nextTick();
        expect(root.querySelector(".n")?.textContent).toBe("1");
        root.querySelector<HTMLButtonElement>(".inc")!.click();
        await nextTick();
        // 组件内 n 已变（DOM 反映）
        expect(root.querySelector(".n")?.textContent).toBe("2");
        // 外部状态不被回写（单向：外部 → 组件）
        expect((engine.store.state as any).order.n).toBe(1);
    });

    test("name 字段回归普通 prop（旧组件名识别废除）", async () => {
        const { root } = mount(
            `<div x-scope>
                <div id="h" x-component:box="{ name: '张三' }"></div>
                <div x-define="box"><span class="nm" x-text="name"></span></div>
             </div>`,
            {},
        );
        await nextTick();
        // name 不再被识别为组件名标识，作为普通 prop 注入组件 data 域
        expect(root.querySelector(".nm")?.textContent).toBe("张三");
    });

    test("标量 props 值：warn 忽略（仍实例化组件，无 props）", async () => {
        const { root, warns } = mountCaptureWarn(
            `<div x-scope>
                <div id="h" x-component:box="order.label"></div>
                <div x-define="box"><span class="a" x-text="a"></span></div>
             </div>`,
            { order: { label: "纯字符串" } },
        );
        await nextTick();
        // 组件照常实例化（宿主有组件内容），标量 props 被忽略
        expect(root.querySelector("#h .a")).toBeDefined();
        expect(warns.some((w) => w.includes("props 值须为对象"))).toBe(true);
    });

    test("旧 x-use 静默失效：彻底移除（不注册、无 warn、不实例化）", async () => {
        const { root, warns } = mountCaptureWarn(
            `<div x-scope>
                <div id="h" x-use="box"></div>
                <div x-define="box"><span class="a">内容</span></div>
             </div>`,
            {},
        );
        await nextTick();
        // x-use 是未知属性：不实例化、无 warn
        expect(root.querySelector("#h .a")).toBeNull();
        expect(warns.length).toBe(0);
    });

    test("旧 setup 段 data()：warn 指引更名 state()，剪枝不生效（ADR-0055）", async () => {
        const { root, warns } = mountCaptureWarn(
            `<div x-scope>
                <div id="h" x-component:box></div>
                <div x-define="box">
                    <span class="c" x-text="count"></span>
                    <script setup>{ data(){ return { count: 7 } } }</script>
                </div>
             </div>`,
            {},
        );
        await nextTick();
        // 旧 data() 不注入响应式状态域（模板读不到 count）
        expect(root.querySelector(".c")?.textContent ?? "").toBe("");
        expect(warns.some((w) => w.includes("data() 已更名为 state()"))).toBe(true);
    });

    test("旧 setup 段 locals：warn 指引更名 data，剪枝不生效（ADR-0055）", async () => {
        const { root, warns } = mountCaptureWarn(
            `<div x-scope>
                <div id="h" x-component:box></div>
                <div x-define="box">
                    <script setup>{ locals:{ secret: "隐秘" } }</script>
                </div>
             </div>`,
            {},
        );
        await nextTick();
        // 旧 locals 段不注入 _locals
        expect(warns.some((w) => w.includes("locals 已更名为 data"))).toBe(true);
    });
});
