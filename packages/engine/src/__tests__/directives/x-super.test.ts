import { describe, expect, test, afterEach } from "bun:test";
import "../setup";
import { AutoSpark } from "../../engine/engine";
import { mount, nextTick } from "../helpers";

/**
 * x-super 插槽 fallback 展开标记测试（ADR-0084）。
 *
 * 11 组：命名段单次展开、默认段裸文本内展开、多次独立编译独立响应、句柄缺席 warn
 *（普通模板 / fallback 内误写）、嵌套组件隔离、继承交互（展开继承覆盖层）、overlay
 * 路径生效、空 fallback 静默、作用域形参并存、未闭合误写防御、销毁归属与幂等。
 */

/** 挂载并拦截 logger.warn（编译期同步 warn 也可靠捕获） */
function mountCaptureWarn(html: string, state: any, options?: any) {
    const root = document.createElement("div");
    root.innerHTML = html.trim();
    const engine = new AutoSpark(root, state, { autostart: false, ...options });
    const warns: string[] = [];
    (engine.logger as any).warn = (msg: any) => warns.push(String(msg));
    engine.compile();
    return { root, engine, warns };
}

const engines: any[] = [];
const mountSuper = (html: string, state: any, options?: any) => {
    const m = mountCaptureWarn(html, state, options);
    engines.push(m.engine);
    return m;
};

afterEach(() => {
    while (engines.length) engines.pop()?.destroy();
});

describe("x-super 插槽 fallback 展开标记（ADR-0084）", () => {
    test("命名段单次展开：fallback 在组件作用域求值、标记保留为包裹层", async () => {
        const { root } = mountSuper(
            `<div x-scope>
                <div x-define="card">
                    <header class="h" x-slot:header>默认头 · {{title}}</header>
                </div>
                <div class="use" x-component:card>
                    <template x-slot:header><h3>自定义标题</h3><x-super></x-super></template>
                </div>
            </div>`,
            { title: "状态标题" },
        );
        await nextTick();
        const header = root.querySelector(".h")!;
        // 内容照常投影 + 标记原位展开 fallback（组件作用域插值已求值）
        expect(header.querySelector("h3")!.textContent).toBe("自定义标题");
        const superEl = header.querySelector("x-super")!;
        expect(superEl).not.toBeNull();
        expect(superEl.textContent).toInclude("默认头 · 状态标题");
    });

    test("默认段裸文本内展开：标记嵌在裸默认段元素内部任意位置", async () => {
        const { root } = mountSuper(
            `<div x-scope>
                <div x-define="card">
                    <div class="body" x-slot>默认正文</div>
                </div>
                <div class="use" x-component:card>
                    <p class="p">前缀<x-super></x-super>后缀</p>
                </div>
            </div>`,
            {},
        );
        await nextTick();
        const p = root.querySelector(".p")!;
        // 交错形态：fallback 展开进 p 内标记位置，前后文本保留
        expect(p.textContent).toBe("前缀默认正文后缀");
        expect(p.querySelector("x-super")!.textContent).toBe("默认正文");
    });

    test("多次出现各自独立编译、独立响应（各挂各的 watcher）", async () => {
        const { root, engine } = mountSuper(
            `<div x-scope>
                <div x-define="card">
                    <div class="body" x-slot>计数{{count}}</div>
                </div>
                <div class="use" x-component:card>
                    <p class="p">甲<x-super></x-super>乙<x-super></x-super></p>
                </div>
            </div>`,
            { count: 1 },
        );
        await nextTick();
        const p = root.querySelector(".p")!;
        expect(p.textContent).toBe("甲计数1乙计数1");
        engine.state.count = 9;
        await nextTick();
        // 两份独立 watcher 均收到更新
        expect(p.textContent).toBe("甲计数9乙计数9");
    });

    test("句柄缺席 warn：普通模板与 fallback 内误写均空壳保留（不穿透组件边界）", async () => {
        const { root, warns } = mountSuper(
            `<div x-scope>
                <div x-define="card">
                    <div class="body" x-slot>默认头<x-super></x-super></div>
                </div>
                <div class="use" x-component:card></div>
                <div class="plain"><x-super></x-super></div>
            </div>`,
            {},
        );
        await nextTick();
        // 普通模板：warn + 空壳
        const plain = root.querySelector(".plain x-super")!;
        expect(plain.childNodes.length).toBe(0);
        // fallback 内误写（未提供内容 → fallback 编译 → 组件作用域无句柄）：warn + 空壳
        const inFallback = root.querySelector(".body x-super")!;
        expect(inFallback.childNodes.length).toBe(0);
        const hit = warns.filter((w) => w.includes("仅在插槽内容内生效"));
        expect(hit.length).toBe(2);
    });

    test("嵌套组件隔离：内层内容里的 x-super 归内层出口，内层模板不穿透外层句柄", async () => {
        const { root, warns } = mountSuper(
            `<div x-scope>
                <div x-define="outer">
                    <div class="o" x-slot>外层默认</div>
                </div>
                <div x-define="inner">
                    <div class="i" x-slot>内层默认</div>
                    <div class="fixed">固定<x-super></x-super></div>
                </div>
                <div class="use" x-component:outer>
                    <div x-component:inner>
                        <p class="p"><x-super></x-super></p>
                    </div>
                </div>
            </div>`,
            {},
        );
        await nextTick();
        // inner 的内容（宿主子级）里的 x-super → 展开 inner 出口 fallback
        expect(root.querySelector(".p")!.textContent).toBe("内层默认");
        // inner 模板固定区里的 x-super → 不穿透外层句柄（边界遮蔽）：warn 空壳
        expect(root.querySelector(".fixed x-super")!.childNodes.length).toBe(0);
        expect(warns.some((w) => w.includes("仅在插槽内容内生效"))).toBe(true);
    });

    test("继承交互：x-super 展开继承覆盖层（最终生效 fallback）", async () => {
        const { root } = mountSuper(
            `<div x-scope>
                <div x-define="card">
                    <header class="h" x-slot:header>父默认头</header>
                </div>
                <div x-define="order-card" x-define:inherit="card">
                    <template x-slot:header>子覆盖头 · {{title}}</template>
                </div>
                <div class="use" x-component:order-card>
                    <template x-slot:header><b>前缀</b><x-super></x-super></template>
                </div>
            </div>`,
            { title: "T" },
        );
        await nextTick();
        // 继承覆盖替换快照 fallback → super 展开的是继承覆盖层（组件作用域求值）
        const header = root.querySelector(".h")!;
        expect(header.querySelector("b")!.textContent).toBe("前缀");
        expect(header.querySelector("x-super")!.textContent).toBe("子覆盖头 · T");
    });

    test("overlay 路径：x-dialog 内容里的 x-super 同语法生效", async () => {
        const { root, engine } = mountSuper(
            `<div id="app">
                <div x-scope>
                    <div x-define="confirm">
                        <div class="body"><div class="slot" x-slot>默认正文</div></div>
                    </div>
                    <button id="t" x-dialog:confirm="ui.open">
                        打开
                        <div x-slot><x-super></x-super>要确认吗？</div>
                    </button>
                </div>
            </div>`,
            { ui: { open: false } },
            { animate: false },
        );
        engine.state.ui.open = true;
        await nextTick();
        const mask = document.querySelector(`.autospark-dialog-mask [data-overlay="confirm"]`)?.parentElement;
        expect(mask).not.toBeNull();
        const slot = mask!.querySelector(".slot")!;
        // 覆盖物出口 fallback 展开进标记 + 内容文本照常投影
        expect(slot.querySelector("x-super")!.textContent).toBe("默认正文");
        expect(slot.textContent).toInclude("要确认吗？");
    });

    test("空 fallback 出口：静默展开为空（不 warn）", async () => {
        const { root, warns } = mountSuper(
            `<div x-scope>
                <div x-define="card">
                    <header class="h" x-slot:header></header>
                </div>
                <div class="use" x-component:card>
                    <template x-slot:header><x-super></x-super></template>
                </div>
            </div>`,
            {},
        );
        await nextTick();
        const superEl = root.querySelector(".h x-super")!;
        expect(superEl).not.toBeNull();
        expect(superEl.childNodes.length).toBe(0);
        expect(warns.some((w) => w.includes("x-super"))).toBe(false);
    });

    test("作用域形参并存：形参管内容求值，展开的 fallback 恒组件作用域无形参", async () => {
        const { root } = mountSuper(
            `<div x-scope>
                <div x-define="list">
                    <div class="row" x-slot:item="{ name: row.name }">默认行 · {{title}}</div>
                </div>
                <div class="use" x-component:list>
                    <template x-slot:item="{ name }">【{{name}}】<x-super></x-super></template>
                </div>
            </div>`,
            { title: "组件T", row: { name: "苹果" } },
        );
        await nextTick();
        const row = root.querySelector(".row")!;
        // 形参注入内容（调用方数据面）；fallback 展开读组件作用域 title、不接收形参
        expect(row.textContent).toInclude("【苹果】");
        expect(row.querySelector("x-super")!.textContent).toInclude("默认行 · 组件T");
        expect(row.querySelector("x-super")!.textContent).not.toInclude("苹果");
    });

    test("未闭合误写防御：标记带子节点 → warn + 子节点丢弃，fallback 照常展开", async () => {
        const { root, warns } = mountSuper(
            `<div x-scope>
                <div x-define="card">
                    <div class="body" x-slot>默认正文</div>
                </div>
                <div class="use" x-component:card>
                    <p class="p">前缀<x-super><b>误写子内容</b></x-super>后缀</p>
                </div>
            </div>`,
            {},
        );
        await nextTick();
        const p = root.querySelector(".p")!;
        // 误写子节点不进 DOM（ownsChildren 拦截），fallback 照常展开
        expect(p.querySelector("b")).toBeNull();
        expect(p.textContent).toBe("前缀默认正文后缀");
        expect(warns.some((w) => w.includes("双标签空元素"))).toBe(true);
    });

    test("销毁归属与幂等：调用方先亡（x-if 切走）不抛错、出口销毁级联回收", async () => {
        const { root, engine } = mountSuper(
            `<div x-scope>
                <div x-define="card">
                    <div class="body" x-slot>计数{{count}}</div>
                </div>
                <div x-if="show" class="wrap">
                    <div class="use" x-component:card>
                        <p><x-super></x-super></p>
                    </div>
                </div>
            </div>`,
            { show: true, count: 1 },
        );
        await nextTick();
        expect(root.querySelector(".body x-super")!.textContent).toBe("计数1");
        // 调用方先亡：内容投影随 x-if 销毁 → SuperDirective.destroy 兜底回收 fallback scopes
        engine.state.show = false;
        await nextTick();
        expect(root.querySelector(".body")).toBeNull();
        // 已销毁的 watcher 不再响应（无异常、无泄漏路径）
        engine.state.count = 99;
        await nextTick();
        expect(root.querySelector(".body")).toBeNull();
        // 出口先亡幂等：整树 destroy 二次调用 no-op
        engine.destroy();
        engine.destroy();
    });
});
