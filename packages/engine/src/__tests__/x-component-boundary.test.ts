import { describe, test, expect, afterEach } from "bun:test";
import { mount, nextTick } from "./helpers";
import "./setup";

/**
 * 组件数据边界（ADR-0053）：x-component 实例化的组件默认**封闭**——实例只见自身
 * data（响应式，ADR-0057）/顶层私有变量、x-component props 与全局 state；`x-define.open` 开放边界，
 * `dataContext`（'host'|'declarer'）指定继承基准，`x-component-options.dataContext` 消费侧覆盖。
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
                    <div x-define="card"><span x-text="tip"></span></div>
                    <div id="h" x-component:card></div>
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
                    <div x-define="card"><span x-text="appName"></span></div>
                    <div id="h" x-component:card></div>
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
                <div x-define="card"><span x-text="label"></span></div>
                <div id="h" x-component:card="{label: '传入' }"></div>
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
                    <div x-define="card"><button id="b" x-on:click="count = 100">+</button></div>
                    <div id="h" x-component:card></div>
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

    test("x-define.open（修饰符）：默认基准 host，恢复读宿主上下文", async () => {
        const { root } = mount(
            `<div x-data="{ tip: '宿主数据' }">
                <div x-scope>
                    <div x-define.open="card"><span x-text="tip"></span></div>
                    <div id="h" x-component:card></div>
                </div>
             </div>`,
            {},
        );
        await nextTick();
        expect(root.querySelector<HTMLSpanElement>("#h span")!.textContent).toBe("宿主数据");
    });

    test("x-define-options={open:true} 与 .open 修饰符等价", async () => {
        const { root } = mount(
            `<div x-data="{ tip: '宿主数据' }">
                <div x-scope>
                    <div x-define="card" x-define-options="{ open: true }"><span x-text="tip"></span></div>
                    <div id="h" x-component:card></div>
                </div>
             </div>`,
            {},
        );
        await nextTick();
        expect(root.querySelector<HTMLSpanElement>("#h span")!.textContent).toBe("宿主数据");
    });

    test("dataContext:'declarer'：消费处同名键被遮蔽时读声明处上下文", async () => {
        const { root } = mount(
            `<div x-data="{ who: '声明处' }">
                <div x-scope>
                    <div x-define="card" x-define-options="{ open: true, dataContext: 'declarer' }"><span x-text="who"></span></div>
                    <div x-data="{ who: '消费处' }">
                        <div id="h" x-component:card></div>
                    </div>
                </div>
             </div>`,
            {},
        );
        await nextTick();
        // 消费处视图 who='消费处'（host 基准会读到它），declarer 基准读声明处视图 who='声明处'
        expect(root.querySelector<HTMLSpanElement>("#h span")!.textContent).toBe("声明处");
    });

    test("dataContext:'host' 显式声明：读消费处上下文", async () => {
        const { root } = mount(
            `<div x-data="{ who: '声明处' }">
                <div x-scope>
                    <div x-define="card" x-define-options="{ open: true, dataContext: 'host' }"><span x-text="who"></span></div>
                    <div x-data="{ who: '消费处' }">
                        <div id="h" x-component:card></div>
                    </div>
                </div>
             </div>`,
            {},
        );
        await nextTick();
        expect(root.querySelector<HTMLSpanElement>("#h span")!.textContent).toBe("消费处");
    });

    test("x-component-options.dataContext 消费侧覆盖已开放组件的基准（无 warn）", async () => {
        captureWarn();
        const { root } = mount(
            `<div x-data="{ who: '声明处' }">
                <div x-scope>
                    <div x-define="card" x-define-options="{ open: true }"><span x-text="who"></span></div>
                    <div x-data="{ who: '消费处' }">
                        <div id="h" x-component:card x-component-options="{ dataContext: 'declarer' }"></div>
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

    test("消费侧 dataContext 落在封闭组件上：warn + 保持封闭", async () => {
        captureWarn();
        const { root } = mount(
            `<div x-data="{ tip: '消费处数据' }">
                <div x-scope>
                    <div x-define="card"><span x-text="tip"></span></div>
                    <div id="h" x-component:card x-component-options="{ dataContext: 'host' }"></div>
                </div>
             </div>`,
            {},
        );
        await nextTick();
        expect(warnHits("x-component-options.dataContext 不生效")).toBe(true);
        expect(root.querySelector<HTMLSpanElement>("#h span")!.textContent!.trim()).toBe("");
    });

    test("作者侧 dataContext 无 open：warn + 忽略（组件封闭）", async () => {
        captureWarn();
        const { root } = mount(
            `<div x-data="{ tip: '外部' }">
                <div x-scope>
                    <div x-define="card" x-define-options="{ dataContext: 'host' }"><span x-text="tip"></span></div>
                    <div id="h" x-component:card></div>
                </div>
             </div>`,
            {},
        );
        await nextTick();
        expect(warnHits("仅在 open 声明时生效")).toBe(true);
        expect(root.querySelector<HTMLSpanElement>("#h span")!.textContent!.trim()).toBe("");
    });

    test("无效 dataContext 基准值：warn + 忽略基准（open 仍生效、基准落默认 host）", async () => {
        captureWarn();
        const { root } = mount(
            `<div x-data="{ tip: '外部' }">
                <div x-scope>
                    <div x-define="card" x-define-options="{ open: true, dataContext: 'anywhere' }"><span x-text="tip"></span></div>
                    <div id="h" x-component:card></div>
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
                    <div id="h" x-component:gcard></div>
                </div>
             </div>`,
            {},
            {
                components: {
                    gcard: `<div x-define="gcard" x-define-options="{ open: true, dataContext: 'declarer' }"><span x-text="tip"></span></div>`,
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
                    <div x-define="outer" x-define-options="{ open: true }">
                        <span class="o1" x-text="inner"></span>
                        <div x-define="pinner"><span class="p1" x-text="inner"></span></div>
                        <div id="pi" x-component:pinner></div>
                    </div>
                    <div id="h" x-component:outer></div>
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
                <div x-define="outer">
                    <div x-define="pinner" x-define-options="{ open: true }"><span class="p1" x-text="inner"></span></div>
                    <div id="pi" x-component:pinner></div>
                    <script setup>{ data:{ inner: 'A数据' } }</script>
                </div>
                <div id="h" x-component:outer></div>
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
                    <div x-define="card">
                        <div x-data="{ injected: 'x' }" x-data-options="{ mount: '../..' }"></div>
                    </div>
                    <div id="h" x-component:card></div>
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
                <div x-define="card"><button id="b" x-on:click="go">go</button></div>
                <div id="h" x-component:card></div>
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
                <div x-define="parent" x-define-options="{ open: true }">
                    <div>
                        <div x-define="child">
                            <button class="cb" x-on:click="onlyInParent">go</button>
                        </div>
                        <div id="ch" x-component:child></div>
                    </div>
                    <script setup>{ methods:{ onlyInParent(){ globalThis.__mb = "parent" } } }</script>
                </div>
                <div id="h" x-component:parent></div>
             </div>`,
            {},
        );
        await nextTick();
        root.querySelector<HTMLButtonElement>(".cb")!.click();
        await nextTick();
        // 子组件 method 边界照常生效：调不到父组件 method（未命中，表达式兜底为空操作）
        expect((globalThis as any).__mb).toBe("");
    });
});

describe("消费侧 .open（ADR-0053 修订一：豁免作者契约）", () => {
    test(".open 修饰符打开封闭组件（默认 host 基准，读消费处上下文）", async () => {
        const { root } = mount(
            `<div x-data="{ tip: '外部数据' }">
                <div x-scope>
                    <div x-define="card"><span x-text="tip"></span></div>
                    <div id="h" x-component:card.open></div>
                </div>
             </div>`,
            {},
        );
        await nextTick();
        expect(root.querySelector<HTMLSpanElement>("#h span")!.textContent).toBe("外部数据");
    });

    test("x-component-options={open:true} 与 .open 修饰符等价", async () => {
        const { root } = mount(
            `<div x-data="{ tip: '外部数据' }">
                <div x-scope>
                    <div x-define="card"><span x-text="tip"></span></div>
                    <div id="h" x-component:card x-component-options="{ open: true }"></div>
                </div>
             </div>`,
            {},
        );
        await nextTick();
        expect(root.querySelector<HTMLSpanElement>("#h span")!.textContent).toBe("外部数据");
    });

    test(".open + x-component-options.dataContext='declarer' 组合：读声明处", async () => {
        const { root } = mount(
            `<div x-data="{ who: '声明处' }">
                <div x-scope>
                    <div x-define="card"><span x-text="who"></span></div>
                    <div x-data="{ who: '消费处' }">
                        <div id="h" x-component:card.open x-component-options="{ dataContext: 'declarer' }"></div>
                    </div>
                </div>
             </div>`,
            {},
        );
        await nextTick();
        // .open 打开封闭组件后，消费侧 dataContext 正常生效（不再走「未声明 open」warn 分支）
        expect(root.querySelector<HTMLSpanElement>("#h span")!.textContent).toBe("声明处");
    });

    test(".open 打开封闭组件不触发任何 warn（显式豁免即静默）", async () => {
        captureWarn();
        const { root } = mount(
            `<div x-data="{ tip: '外部数据' }">
                <div x-scope>
                    <div x-define="card"><span x-text="tip"></span></div>
                    <div id="h" x-component:card.open></div>
                </div>
             </div>`,
            {},
        );
        await nextTick();
        expect(root.querySelector<HTMLSpanElement>("#h span")!.textContent).toBe("外部数据");
        expect(warns).toHaveLength(0);
    });

    test("宿主 x-options 的 open 键不回退命中（消费 open 只读指令选项层）", async () => {
        const { root } = mount(
            `<div x-data="{ tip: '外部数据' }">
                <div x-scope x-options="{ open: true }">
                    <div x-define="card"><span x-text="tip"></span></div>
                    <div id="h" x-component:card></div>
                </div>
             </div>`,
            {},
        );
        await nextTick();
        // 宿主选项的 open 不打开组件（ADR-0007 回退语义的隔离例外）——保持封闭，渲染空
        expect(root.querySelector<HTMLSpanElement>("#h span")!.textContent!.trim()).toBe("");
    });
});
