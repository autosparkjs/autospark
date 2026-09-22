import { describe, test, expect, afterEach } from "bun:test";
import { mount, nextTick } from "./helpers";
import "./setup";

/**
 * 组件数据边界（ADR-0053）：x-use 实例化的组件默认**封闭**——实例只见自身
 * data()/locals、x-use props 与全局 state；`x-component.open` 开放边界，
 * `scope`（'host'|'declarer'）指定继承基准，`x-use-options.scope` 消费侧覆盖。
 */

let warns: string[] = [];
const origWarn = console.warn;

/** 捕获 warn 日志（引擎 logger 走 console.warn） */
function captureWarn() {
    warns = [];
    console.warn = (msg?: any) => warns.push(String(msg));
}
function releaseWarn() {
    console.warn = origWarn;
}
function warnHits(keyword: string): boolean {
    return warns.some((w) => w.includes(keyword));
}

afterEach(() => {
    releaseWarn();
});

describe("组件数据边界（ADR-0053）", () => {
    test("默认封闭：组件内读不到外部 x-data 键（空渲染）", async () => {
        const { root } = mount(
            `<div x-data="{ tip: '外部数据' }">
                <div x-scope>
                    <div x-component="card"><span x-text="tip"></span></div>
                    <div id="h" x-use="card"></div>
                </div>
             </div>`,
            {},
        );
        await nextTick();
        // tip 不可见 → 落空值集，渲染空占位（空串）
        const span = root.querySelector<HTMLSpanElement>("#h span")!;
        expect(span).not.toBeNull();
        expect(span.textContent!.trim()).toBe("");
    });

    test("默认封闭：全局 state 键仍然可见（裸标识符）", async () => {
        const { root } = mount(
            `<div x-data="{ user: '外层' }">
                <div x-scope>
                    <div x-component="card"><span x-text="appName"></span></div>
                    <div id="h" x-use="card"></div>
                </div>
             </div>`,
            { appName: "全局应用" },
        );
        await nextTick();
        expect(root.querySelector<HTMLSpanElement>("#h span")!.textContent).toBe("全局应用");
    });

    test("默认封闭：props 正常注入", async () => {
        const { root } = mount(
            `<div x-scope>
                <div x-component="card"><span x-text="label"></span></div>
                <div id="h" x-use="{ name: 'card', label: '传入' }"></div>
             </div>`,
            {},
        );
        await nextTick();
        expect(root.querySelector<HTMLSpanElement>("#h span")!.textContent).toBe("传入");
    });

    test("默认封闭：读+写一并切断（外层 x-data 域不被穿透写入）", async () => {
        const { root, engine } = mount(
            `<div x-data="{ count: 1 }">
                <div x-scope>
                    <div x-component="card"><button id="b" x-on:click="count = 100">+</button></div>
                    <div id="h" x-use="card"></div>
                </div>
             </div>`,
            {},
        );
        await nextTick();
        root.querySelector<HTMLButtonElement>("#b")!.click();
        await nextTick();
        // 外层 x-data 域保持原值；state 根也不被写（count 不在组件视图内，with 松散模式落全局而非 state）
        const outerData = (engine.store.state as any).$scopes;
        const outerCount = Object.keys(outerData)
            .map((k) => outerData[k].count)
            .filter((v: any) => v !== undefined);
        expect(outerCount).toEqual([1]);
        expect((engine.store.state as any).count).toBeUndefined();
    });

    test("x-component.open（修饰符）：默认基准 host，恢复读宿主上下文", async () => {
        const { root } = mount(
            `<div x-data="{ tip: '宿主数据' }">
                <div x-scope>
                    <div x-component.open="card"><span x-text="tip"></span></div>
                    <div id="h" x-use="card"></div>
                </div>
             </div>`,
            {},
        );
        await nextTick();
        expect(root.querySelector<HTMLSpanElement>("#h span")!.textContent).toBe("宿主数据");
    });

    test("x-component-options={open:true} 与 .open 修饰符等价", async () => {
        const { root } = mount(
            `<div x-data="{ tip: '宿主数据' }">
                <div x-scope>
                    <div x-component="card" x-component-options="{ open: true }"><span x-text="tip"></span></div>
                    <div id="h" x-use="card"></div>
                </div>
             </div>`,
            {},
        );
        await nextTick();
        expect(root.querySelector<HTMLSpanElement>("#h span")!.textContent).toBe("宿主数据");
    });

    test("scope:'declarer'：消费处同名键被遮蔽时读声明处上下文", async () => {
        const { root } = mount(
            `<div x-data="{ who: '声明处' }">
                <div x-scope>
                    <div x-component="card" x-component-options="{ open: true, scope: 'declarer' }"><span x-text="who"></span></div>
                    <div x-data="{ who: '消费处' }">
                        <div id="h" x-use="card"></div>
                    </div>
                </div>
             </div>`,
            {},
        );
        await nextTick();
        // 消费处视图 who='消费处'（host 基准会读到它），declarer 基准读声明处视图 who='声明处'
        expect(root.querySelector<HTMLSpanElement>("#h span")!.textContent).toBe("声明处");
    });

    test("scope:'host' 显式声明：读消费处上下文", async () => {
        const { root } = mount(
            `<div x-data="{ who: '声明处' }">
                <div x-scope>
                    <div x-component="card" x-component-options="{ open: true, scope: 'host' }"><span x-text="who"></span></div>
                    <div x-data="{ who: '消费处' }">
                        <div id="h" x-use="card"></div>
                    </div>
                </div>
             </div>`,
            {},
        );
        await nextTick();
        expect(root.querySelector<HTMLSpanElement>("#h span")!.textContent).toBe("消费处");
    });

    test("x-use-options.scope 消费侧覆盖已开放组件的基准（无 warn）", async () => {
        captureWarn();
        const { root } = mount(
            `<div x-data="{ who: '声明处' }">
                <div x-scope>
                    <div x-component="card" x-component-options="{ open: true }"><span x-text="who"></span></div>
                    <div x-data="{ who: '消费处' }">
                        <div id="h" x-use="card" x-use-options="{ scope: 'declarer' }"></div>
                    </div>
                </div>
             </div>`,
            {},
        );
        await nextTick();
        // 作者默认 host（读消费处），消费侧覆盖为 declarer（读声明处）
        expect(root.querySelector<HTMLSpanElement>("#h span")!.textContent).toBe("声明处");
        expect(warns).toHaveLength(0);
    });

    test("消费侧 scope 落在封闭组件上：warn + 保持封闭", async () => {
        captureWarn();
        const { root } = mount(
            `<div x-data="{ tip: '消费处数据' }">
                <div x-scope>
                    <div x-component="card"><span x-text="tip"></span></div>
                    <div id="h" x-use="card" x-use-options="{ scope: 'host' }"></div>
                </div>
             </div>`,
            {},
        );
        await nextTick();
        expect(warnHits("x-use-options.scope 不生效")).toBe(true);
        expect(root.querySelector<HTMLSpanElement>("#h span")!.textContent!.trim()).toBe("");
    });

    test("作者侧 scope 无 open：warn + 忽略（组件封闭）", async () => {
        captureWarn();
        const { root } = mount(
            `<div x-data="{ tip: '外部' }">
                <div x-scope>
                    <div x-component="card" x-component-options="{ scope: 'host' }"><span x-text="tip"></span></div>
                    <div id="h" x-use="card"></div>
                </div>
             </div>`,
            {},
        );
        await nextTick();
        expect(warnHits("仅在 open 声明时生效")).toBe(true);
        expect(root.querySelector<HTMLSpanElement>("#h span")!.textContent!.trim()).toBe("");
    });

    test("无效 scope 基准值：warn + 忽略基准（open 仍生效、基准落默认 host）", async () => {
        captureWarn();
        const { root } = mount(
            `<div x-data="{ tip: '外部' }">
                <div x-scope>
                    <div x-component="card" x-component-options="{ open: true, scope: 'anywhere' }"><span x-text="tip"></span></div>
                    <div id="h" x-use="card"></div>
                </div>
             </div>`,
            {},
        );
        await nextTick();
        expect(warnHits("无效值")).toBe(true);
        expect(root.querySelector<HTMLSpanElement>("#h span")!.textContent).toBe("外部");
    });

    test("全局组件 open+declarer：退化为封闭行为 + 每组件定义 warn 一次", async () => {
        captureWarn();
        const { root } = mount(
            `<div x-data="{ tip: '外部' }">
                <div x-scope>
                    <div id="h" x-use="gcard"></div>
                </div>
             </div>`,
            {},
            {
                components: {
                    gcard: `<div x-component="gcard" x-component-options="{ open: true, scope: 'declarer' }"><span x-text="tip"></span></div>`,
                },
            },
        );
        await nextTick();
        expect(warnHits("无声明处 scope")).toBe(true);
        expect(warns.filter((w) => w.includes("无声明处 scope")).length).toBe(1);
        expect(root.querySelector<HTMLSpanElement>("#h span")!.textContent!.trim()).toBe("");
    });

    test("open 不传播：开放组件内嵌套声明的私有子组件仍默认封闭", async () => {
        const { root } = mount(
            `<div x-data="{ inner: 'A外部' }">
                <div x-scope>
                    <div x-component="outer" x-component-options="{ open: true }">
                        <span class="o1" x-text="inner"></span>
                        <div x-component="pinner"><span class="p1" x-text="inner"></span></div>
                        <div id="pi" x-use="pinner"></div>
                    </div>
                    <div id="h" x-use="outer"></div>
                </div>
             </div>`,
            {},
        );
        await nextTick();
        // outer 开放（host 基准）：读到外部 inner
        expect(root.querySelector<HTMLSpanElement>(".o1")!.textContent).toBe("A外部");
        // pinner 是 outer 实例内嵌套声明的私有子组件：默认封闭，读不到 outer 消费处的 inner
        const p1 = root.querySelector<HTMLSpanElement>(".p1")!;
        expect(p1).not.toBeNull();
        expect(p1.textContent!.trim()).toBe("");
    });

    test("嵌套私有子组件 open 后可读外层组件实例的数据域", async () => {
        const { root } = mount(
            `<div x-scope>
                <div x-component="outer">
                    <div x-component="pinner" x-component-options="{ open: true }"><span class="p1" x-text="inner"></span></div>
                    <div id="pi" x-use="pinner"></div>
                    <script setup>{ data(){ return { inner: 'A数据' } } }</script>
                </div>
                <div id="h" x-use="outer"></div>
             </div>`,
            {},
        );
        await nextTick();
        // pinner open（host 基准）：消费点在 outer 实例子树内，链路穿过 outer 实例 scope → 读到其 data
        expect(root.querySelector<HTMLSpanElement>(".p1")!.textContent).toBe("A数据");
    });

    test("封闭组件内 x-data 相对挂载 '../../'：越界落根（不写外层 x-data 域）", async () => {
        const { root, engine } = mount(
            `<div x-data="{ outerFlag: true }">
                <div x-scope>
                    <div x-component="card">
                        <div x-data="{ injected: 'x' }" x-data-options="{ mount: '../..' }"></div>
                    </div>
                    <div id="h" x-use="card"></div>
                </div>
             </div>`,
            {},
        );
        await nextTick();
        expect(root.querySelector("#h")).not.toBeNull();
        const state = engine.store.state as any;
        // 越界落根：injected 落 state 根，外层 x-data 域不被污染
        expect(state.injected).toBe("x");
        const domains = Object.values(state.$scopes) as any[];
        expect(domains.every((d) => d.injected === undefined)).toBe(true);
        expect(domains.some((d) => d.outerFlag === true)).toBe(true);
    });

    test("getAction 沿链查找不受封闭影响（跨组件调 action）", async () => {
        (globalThis as any).__act_hit = false;
        const { root } = mount(
            `<div x-scope>
                <script type="autospark/actions">
                    { go(){ globalThis.__act_hit = true } }
                </script>
                <div x-component="card"><button id="b" x-on:click="go">go</button></div>
                <div id="h" x-use="card"></div>
             </div>`,
            {},
        );
        await nextTick();
        root.querySelector<HTMLButtonElement>("#b")!.click();
        await nextTick();
        expect((globalThis as any).__act_hit).toBe(true);
    });

    test("methods 边界不受 open 影响（开放组件也不穿透 method 查找）", async () => {
        (globalThis as any).__mb = "";
        const { root } = mount(
            `<div x-scope>
                <div x-component="parent" x-component-options="{ open: true }">
                    <div>
                        <div x-component="child">
                            <button class="cb" x-on:click="onlyInParent">go</button>
                        </div>
                        <div id="ch" x-use="child"></div>
                    </div>
                    <script setup>{ methods:{ onlyInParent(){ globalThis.__mb = "parent" } } }</script>
                </div>
                <div id="h" x-use="parent"></div>
             </div>`,
            {},
        );
        await nextTick();
        root.querySelector<HTMLButtonElement>(".cb")!.click();
        await nextTick();
        // 子组件 method 边界照常生效：调不到父组件 method（未命中，表达式兜底为空操作）
        expect((globalThis as any).__mb).toBe("");
    });

    test("x-use 值变化切换组件：基准随新组件重置（open → 封闭）", async () => {
        const { root, engine } = mount(
            `<div x-data="{ tip: '外部' }">
                <div x-scope>
                    <div x-component="a" x-component-options="{ open: true }"><span class="v" x-text="tip"></span></div>
                    <div x-component="b"><span class="v" x-text="tip"></span></div>
                    <div id="h" x-use="{ name: compName }"></div>
                </div>
             </div>`,
            { compName: "a" },
        );
        await nextTick();
        expect(root.querySelector<HTMLSpanElement>(".v")!.textContent).toBe("外部");
        // 切到封闭组件 b：tip 不可见
        (engine.store.state as any).$scopes; // 触碰域容器（确保响应式已建）
        const state = engine.store.state as any;
        // compName 经 state 驱动：直接改根状态（compName 不在任何 x-data 域内）
        state.compName = "b";
        await nextTick();
        await nextTick();
        expect(root.querySelector<HTMLSpanElement>(".v")!.textContent!.trim()).toBe("");
    });
});
