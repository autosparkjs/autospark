import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import "./setup";
import { mount, nextTick } from "./helpers";
import { AutoSpark } from "../engine";
import { iconRegistry } from "../icons/registry";
import { DEFAULT_ICON_STROKE_WIDTH } from "../icons/factory";
import {
    persistLookup,
    persistStore,
    resetIconPersistenceForTest,
    reloadIconPersistenceForTest,
} from "../icons/persist";

/**
 * x-icon / x-icon-define 图标指令测试（ADR-0046 本地物种 / ADR-0047 远程物种）。
 *
 * 注册表是 document 级全局单例（跨用例残留），每个 describe 前重置并重播内置 default
 * 图标；warn 去重（未命中/同名覆盖）按 name 跨用例累积，故各用例使用互异图标名。
 */

const DEFAULT_ICON_SVG =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="5" y="5" width="14" height="14" rx="3"/></svg>';

/** 重置全局注册表（保留 default 内置条目的原貌；含全局配置复位） */
function resetIcons() {
    for (const name of [...iconRegistry]) iconRegistry.delete(name);
    iconRegistry.add("default", DEFAULT_ICON_SVG);
    iconRegistry.options = {};
    resetIconPersistenceForTest();
    localStorage.clear();
}

/** 简单图标模板（marker 用于区分内容） */
const iconTpl = (name: string, marker: string) =>
    `<template x-icon-define="${name}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="${marker}"/></svg></template>`;

beforeEach(() => resetIcons());

describe("x-icon-define 图标定义（ADR-0046）", () => {
    test("模板定义注册到全局注册表且定义元素剪枝（不进结果 DOM）", () => {
        const { root } = mount(`${iconTpl("close", "M1")}<span x-icon="close"></span>`, {});
        expect(iconRegistry.has("close")).toBe(true);
        expect(root.querySelector("template")).toBeNull();
        expect(root.querySelector("span")!.classList.contains("close")).toBe(true);
    });

    test("同名覆盖：后者胜（URL 缓存随之失效）", () => {
        mount(
            `${iconTpl("dup", "OLD")} ${iconTpl("dup", "NEW")}<span x-icon="dup"></span>`,
            {},
        );
        expect(iconRegistry.getSvg("dup")).toContain("NEW");
        expect(iconRegistry.getSvg("dup")).not.toContain("OLD");
    });

    test("非法名（非 CSS ident / 保留名）warn + 拒绝注册，元素照剪枝", () => {
        const { root } = mount(
            `<template x-icon-define="2x"><svg/></template><template x-icon-define="as-icon"><svg/></template>`,
            {},
        );
        expect(iconRegistry.has("2x")).toBe(false);
        expect(iconRegistry.has("as-icon")).toBe(false);
        expect(root.querySelector("template")).toBeNull();
    });

    test("无 svg 子元素 / 无名：warn + 跳过注册", () => {
        mount(`<template x-icon-define="nosvg"><div>xx</div></template><template x-icon-define=""><svg/></template>`, {});
        expect(iconRegistry.has("nosvg")).toBe(false);
        expect(iconRegistry.size).toBe(1); // 仅 default
    });

    test("规范形：strip 全部 stroke-width + root 缺省补 xmlns/stroke（显式属性不动）", () => {
        mount(
            `<template x-icon-define="canon"><svg viewBox="0 0 24 24"><path stroke-width="2" d="M1"/><rect stroke-width="1.5" x="1"/></svg></template>`,
            {},
        );
        const svg = iconRegistry.getSvg("canon")!;
        expect(svg).not.toContain("stroke-width");
        expect(svg).toContain('stroke="currentColor"');
        // xmlns 缺省补齐（data URL 按 XML 解析的硬约束——缺失则 mask 无图隐形）
        expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
        // 作者显式属性不被覆盖
        mount(
            `<template x-icon-define="kept"><svg stroke="red" xmlns="http://www.w3.org/2000/svg"><path stroke-width="2" d="M1"/></svg></template>`,
            {},
        );
        const kept = iconRegistry.getSvg("kept")!;
        expect(kept).toContain('stroke="red"');
        expect((kept.match(/xmlns=/g) ?? []).length).toBe(1); // 已有 xmlns 不重复注入
        expect(kept).not.toContain("stroke-width");
    });

    test("样式表下发：:root 变量 + 裸名类规则（默认 sw=1.25）+ 基础规则排版免疫", () => {
        mount(`${iconTpl("sheet", "M1")}<span x-icon="sheet"></span>`, {});
        const style = document.getElementById("autospark-icons") as HTMLStyleElement;
        expect(style).not.toBeNull();
        // 排版免疫：content-box（免疫全局 border-box reset，padding 语义恒定）+ flex:none（flex 行内不缩）
        expect(style.textContent).toContain("box-sizing:content-box");
        expect(style.textContent).toContain("flex:none");
        expect(style.textContent).toContain(`--as-icon-sheet:url("data:image/svg+xml,`);
        // data URL 内属性经 encodeURIComponent 编码（stroke-width="1.25" → %3D%221.25%22）
        expect(style.textContent).toContain(
            encodeURIComponent(`stroke-width="${DEFAULT_ICON_STROKE_WIDTH}"`),
        );
        expect(style.textContent).toContain(".as-icon.sheet{");
        expect(style.textContent).toContain("mask-image:var(--as-icon-sheet)");
    });

    test("options.icons 种子：构造期并入全局注册表", () => {
        mount(`<span x-icon="seed"></span>`, {}, { icons: { seed: "<svg><path d='S'/></svg>" } });
        expect(iconRegistry.has("seed")).toBe(true);
    });
});

describe("x-icon 本地渲染（ADR-0046）", () => {
    test("命中：挂基础类 + 裸名类，无内联 mask（走类规则变量）", () => {
        const { root } = mount(`${iconTpl("hit", "M1")}<span x-icon="hit"></span>`, {});
        const el = root.querySelector(".as-icon")!;
        expect(el.classList.contains("as-icon")).toBe(true);
        expect(el.classList.contains("hit")).toBe(true);
        expect(el.style.getPropertyValue("mask-image")).toBe("");
    });

    test("值响应式：状态切换图标名，类随之交换", async () => {
        const { root, engine } = mount(
            `${iconTpl("a", "M1")} ${iconTpl("b", "M2")}<span x-icon="cur"></span>`,
            { cur: "a" },
        );
        const el = root.querySelector(".as-icon")!;
        expect(el.classList.contains("a")).toBe(true);
        engine.state.cur = "b";
        await nextTick();
        expect(el.classList.contains("b")).toBe(true);
        expect(el.classList.contains("a")).toBe(false);
    });

    test("未命中：渲染 default 图标；后注册经变更通知自动补渲染", async () => {
        const { root } = mount(`<span x-icon="late"></span>`, {});
        const el = root.querySelector(".as-icon")!;
        expect(el.classList.contains("default")).toBe(true);
        iconRegistry.add("late", "<svg><path d='L'/></svg>");
        expect(el.classList.contains("late")).toBe(true);
        expect(el.classList.contains("default")).toBe(false);
    });

    test("删除联动：使用中的图标被 delete → 回退 default", () => {
        const { root } = mount(`${iconTpl("gone", "M1")}<span x-icon="gone"></span>`, {});
        const el = root.querySelector(".as-icon")!;
        expect(el.classList.contains("gone")).toBe(true);
        expect(iconRegistry.delete("gone")).toBe(true);
        expect(el.classList.contains("default")).toBe(true);
        // 不存在的名称静默 false（Set 契约）
        expect(iconRegistry.delete("gone")).toBe(false);
    });

    test("default 可被同名覆盖自定义；删除后未命中退回空占位", () => {
        iconRegistry.add("default", "<svg><circle cx='1'/></svg>");
        expect(iconRegistry.getSvg("default")).toContain("circle");
        const { root } = mount(`<span x-icon="none-such"></span>`, {});
        const el = root.querySelector(".as-icon")!;
        expect(el.classList.contains("default")).toBe(true);
        iconRegistry.delete("default");
        expect(el.classList.contains("default")).toBe(false);
        expect(el.classList.contains("as-icon")).toBe(true); // 空占位保留尺寸
    });

    test("非默认 strokeWidth：内联 mask-image 为工厂产物（含注入的宽度）", () => {
        const { root } = mount(
            `${iconTpl("sw", "M1")}<span x-icon="sw" x-icon-options="{strokeWidth:2}"></span>`,
            {},
        );
        const el = root.querySelector(".as-icon")!;
        const mask = el.style.getPropertyValue("mask-image");
        // 必须带 url("") 包装——裸 data URL 是非法 CSS 图像值，真实浏览器 CSSOM 静默拒绝
        expect(mask.startsWith('url("data:image/svg+xml,')).toBe(true);
        expect(mask).toContain(encodeURIComponent('stroke-width="2"'));
    });

    test("size / color / padding 选项：数字 → px，字符串直传", () => {
        const { root } = mount(
            `${iconTpl("opt", "M1")}<span x-icon="opt" x-icon-options="{size:24,color:'red',padding:4}"></span>`,
            {},
        );
        const el = root.querySelector(".as-icon")!;
        expect(el.style.width).toBe("24px");
        expect(el.style.height).toBe("24px");
        expect(el.style.padding).toBe("4px");
        expect(el.style.backgroundColor).not.toBe("");
    });

    test("空值回退字面量：state 值清空后原值作图标名（未注册 → default）", async () => {
        const { root, engine } = mount(
            `${iconTpl("blank-fallback", "M1")}<span x-icon="v"></span>`,
            { v: "blank-fallback" },
        );
        const el = root.querySelector(".as-icon")!;
        expect(el.classList.contains("blank-fallback")).toBe(true);
        engine.state.v = null;
        await nextTick();
        // v=null → 原值 "v" 形匹配回退字面量 → 未注册 → 默认图标（空值字面量兜底心智）
        expect(el.classList.contains("blank-fallback")).toBe(false);
        expect(el.classList.contains("default")).toBe(true);
    });

    test("含点路径空值不回退字面量：维持空占位（无误导向 warn）", async () => {
        const { root } = mount(`<span x-icon="a.b"></span>`, {
            a: { b: null },
        });
        const el = root.querySelector(".as-icon")!;
        // a.b 不匹配图标名/远程形 → 空占位而非字面量（不触发未注册 warn / default）
        expect(el.classList.contains("as-icon")).toBe(true);
        expect(el.classList.contains("default")).toBe(false);
    });

    test("engine.destroy 不清理全局注册表与样式表（document 级资产）", () => {
        const { engine } = mount(`${iconTpl("keep", "M1")}<span x-icon="keep"></span>`, {});
        engine.destroy();
        expect(iconRegistry.has("keep")).toBe(true);
        expect(document.getElementById("autospark-icons")).not.toBeNull();
    });
});

describe("x-icon 远程图标源（ADR-0047，mock fetch）", () => {
    const realFetch = globalThis.fetch;
    /** 按请求 URL 分发的可控 deferred */
    let routes: Record<string, () => Promise<string>> = {};
    let calls: string[] = [];

    function mockFetch() {
        globalThis.fetch = ((url: any) => {
            const u = String(url);
            calls.push(u);
            const handler = routes[u];
            if (!handler) return Promise.reject(new Error(`no route for ${u}`));
            return handler().then(
                (svg) => new Response(svg, { status: 200 }) as any,
                () => new Response("err", { status: 404 }) as any,
            );
        }) as any;
    }

    beforeEach(() => {
        routes = {};
        calls = [];
        mockFetch();
    });
    afterEach(() => {
        globalThis.fetch = realFetch;
        iconRegistry.baseUrl = "https://api.iconify.design";
    });

    test("斜杠形：取回升格为属性选择器规则，实例挂短属性（非内联）；冒号形已废除（落本地通道）", async () => {
        routes["https://api.iconify.design/mdi/home.svg"] = async () =>
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M1"/></svg>';
        const { root } = mount(`<span x-icon="mdi/home"></span>`, {});
        const el = root.querySelector(".as-icon")!;
        await nextTick();
        // 默认 sw：规则承载 mask，DOM 不背内联 data URL
        expect(el.getAttribute("data-as-icon")).toBe("mdi/home");
        expect(el.style.getPropertyValue("mask-image")).toBe("");
        const style = document.getElementById("autospark-icons-remote") as HTMLStyleElement;
        expect(style).not.toBeNull();
        expect(style.textContent).toContain('.as-icon[data-as-icon="mdi/home"]');
        const ruleUrl = style.textContent.match(/data-as-icon="mdi\/home"\]\{[^}]*url\("([^"]+)"/)![1]!;
        expect(decodeURIComponent(ruleUrl)).toContain('stroke-width="1.25"');
        expect(decodeURIComponent(ruleUrl)).toContain("xmlns=");
        // 冒号形不再触发远程（值含 / 才走远程通道）：本地未命中 → default，零 fetch
        const { root: root2 } = mount(`<span x-icon="mdi:home"></span>`, {});
        await nextTick();
        expect(calls.length).toBe(1);
        expect(root2.querySelector("span")!.classList.contains("default")).toBe(true);
    });

    test("多实例共享一条规则（幂等升格，无重复规则/无内联）；非默认 sw 仍内联", async () => {
        routes["https://api.iconify.design/mdi/multi.svg"] = async () =>
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M2"/></svg>';
        const { root } = mount(
            `<span x-icon="mdi/multi"></span><span x-icon="mdi/multi"></span>` +
                `<span x-icon="mdi/multi" x-icon-options="{strokeWidth:2}"></span>`,
            {},
        );
        await nextTick();
        const els = [...root.querySelectorAll("span")] as HTMLElement[];
        expect(els.length).toBe(3);
        for (const el of els) expect(el.getAttribute("data-as-icon")).toBe("mdi/multi");
        // 默认 sw 两实例：无内联；非默认 sw 一实例：内联工厂产物（url 包装）
        expect(els[0]!.style.getPropertyValue("mask-image")).toBe("");
        expect(els[1]!.style.getPropertyValue("mask-image")).toBe("");
        expect(els[2]!.style.getPropertyValue("mask-image").startsWith('url("data:image/svg+xml,')).toBe(true);
        // 幂等升格：规则只出现一次（in-flight 合并 + 样式表登记幂等）
        const style = document.getElementById("autospark-icons-remote") as HTMLStyleElement;
        expect(style.textContent.split('data-as-icon="mdi/multi"').length - 1).toBe(1);
    });

    test("加载中空占位（首取）；模块级缓存命中后免再取", async () => {
        let release!: (svg: string) => void;
        routes["https://api.iconify.design/mdi/star.svg"] = () =>
            new Promise((r) => (release = r));
        const { root } = mount(`<span x-icon="mdi/star"></span>`, {});
        const el = root.querySelector(".as-icon")!;
        expect(el.classList.contains("as-icon")).toBe(true);
        expect(el.style.getPropertyValue("mask-image")).toBe("");
        release("<svg viewBox='0 0 24 24'><path d='S'/></svg>");
        await nextTick();
        expect(el.getAttribute("data-as-icon")).toBe("mdi/star");
        expect(el.style.getPropertyValue("mask-image")).toBe("");
        // 缓存命中：第二个实例同步渲染（属性 + 共享规则）、零新请求
        const { root: root2 } = mount(`<span x-icon="mdi/star"></span>`, {});
        expect(root2.querySelector("span")!.getAttribute("data-as-icon")).toBe("mdi/star");
        expect(calls.length).toBe(1);
    });

    test("失败（HTTP 错误）：warn + 回退默认图标", async () => {
        routes["https://api.iconify.design/mdi/none.svg"] = () =>
            Promise.reject(new Error("x"));
        const { root } = mount(`<span x-icon="mdi/none"></span>`, {});
        await nextTick();
        expect(root.querySelector("span")!.classList.contains("default")).toBe(true);
    });

    test("非 SVG 响应按失败处理", async () => {
        routes["https://api.iconify.design/mdi/bad.svg"] = async () => "not json but no svg";
        const { root } = mount(`<span x-icon="mdi/bad"></span>`, {});
        await nextTick();
        expect(root.querySelector("span")!.classList.contains("default")).toBe(true);
    });

    test("baseUrl 自托管覆盖（AutoSpark.icons.baseUrl）", async () => {
        iconRegistry.baseUrl = "https://icons.internal";
        routes["https://icons.internal/mdi/home.svg"] = async () =>
            "<svg viewBox='0 0 24 24'><path d='H'/></svg>";
        const { root } = mount(`<span x-icon="mdi/home2"></span>`, {});
        await nextTick();
        expect(calls[0]).toBe("https://icons.internal/mdi/home2.svg");
    });

    test("远程 → 本地跨通道切换（值响应式，每值重判通道）", async () => {
        routes["https://api.iconify.design/mdi/x.svg"] = async () =>
            "<svg viewBox='0 0 24 24'><path d='X'/></svg>";
        const { root, engine } = mount(
            `${iconTpl("loc", "M1")}<span x-icon="cur"></span>`,
            { cur: "mdi/x" },
        );
        const el = root.querySelector(".as-icon")!;
        await nextTick();
        expect(el.getAttribute("data-as-icon")).toBe("mdi/x");
        engine.state.cur = "loc";
        await nextTick();
        expect(el.classList.contains("loc")).toBe(true);
        expect(el.getAttribute("data-as-icon")).toBeNull(); // 摘除远程载体属性
        expect(el.style.getPropertyValue("mask-image")).toBe(""); // 清内联，走类规则
    });

    test("远程失败后恢复（失败不落缓存，可重试）", async () => {
        let fail = true;
        routes["https://api.iconify.design/mdi/flaky.svg"] = () =>
            fail ? Promise.reject(new Error("net")) : Promise.resolve("<svg viewBox='0 0 24 24'><path d='F'/></svg>");
        const { root } = mount(`<span x-icon="mdi/flaky"></span>`, {});
        await nextTick();
        expect(root.querySelector("span")!.classList.contains("default")).toBe(true);
        fail = false;
        const { root: root2 } = mount(`<span x-icon="mdi/flaky"></span>`, {});
        await nextTick();
        expect(root2.querySelector("span")!.getAttribute("data-as-icon")).toBe("mdi/flaky");
    });

    test("非法远程形（注入尝试）落回本地通道", () => {
        const { root } = mount(`<span x-icon="mdi/home?x=1"></span>`, {});
        // 不匹配 REMOTE_ICON_RE → 本地未命中 → default（无 fetch 发出）
        expect(calls.length).toBe(0);
        expect(root.querySelector("span")!.classList.contains("default")).toBe(true);
    });

    test("429 限流：退避重试（400ms 递增）后成功", async () => {
        let hits = 0;
        globalThis.fetch = (async () => {
            hits++;
            return new Response(
                hits <= 2 ? "limited" : "<svg viewBox='0 0 24 24'><path d='R'/></svg>",
                { status: hits <= 2 ? 429 : 200 },
            ) as any;
        }) as any;
        const { root } = mount(`<span x-icon="mdi/rate429"></span>`, {});
        await new Promise((r) => setTimeout(r, 1600)); // 覆盖 400+800 退避窗口
        expect(hits).toBe(3);
        expect(root.querySelector("span")!.getAttribute("data-as-icon")).toBe("mdi/rate429");
    });

    test("并发上限：8 图标冷启动同时在途 ≤ 4（限流队列）", async () => {
        let inFlight = 0;
        let maxInFlight = 0;
        let done = 0;
        globalThis.fetch = (async () => {
            inFlight++;
            maxInFlight = Math.max(maxInFlight, inFlight);
            await new Promise((r) => setTimeout(r, 30));
            inFlight--;
            done++;
            return new Response("<svg viewBox='0 0 24 24'><path d='C'/></svg>", { status: 200 }) as any;
        }) as any;
        const marks = Array.from({ length: 8 }, (_, i) => `<span x-icon="mdi/cap${i}"></span>`).join("");
        mount(marks, {});
        await new Promise((r) => setTimeout(r, 300));
        expect(done).toBe(8);
        expect(maxInFlight).toBeLessThanOrEqual(4);
    });
});

describe("AutoSpark.icons 注册表 API（ADR-0046/0047）", () => {
    test("add(name, svg) / delete / 遍历产出名称字符串；Set 契约", () => {
        iconRegistry.add("api-a", "<svg><path d='A'/></svg>");
        iconRegistry.add("api-b", "<svg><path d='B'/></svg>");
        expect([...iconRegistry].includes("api-a")).toBe(true);
        expect(iconRegistry.delete("api-a")).toBe(true);
        expect([...iconRegistry].includes("api-a")).toBe(false);
        expect(AutoSpark.icons).toBe(iconRegistry);
        expect(AutoSpark.icons.baseUrl).toBe("https://api.iconify.design");
    });
});

describe("远程图标持久缓存（ADR-0048，localStorage）", () => {
    const realFetch = globalThis.fetch;
    const BASE = "https://api.iconify.design";
    let calls: string[] = [];
    beforeEach(() => {
        calls = [];
        globalThis.fetch = ((url: any) => {
            calls.push(String(url));
            return Promise.resolve(
                new Response(
                    "<svg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'><path d='P'/></svg>",
                    { status: 200 },
                ),
            ) as any;
        }) as any;
    });
    afterEach(() => {
        globalThis.fetch = realFetch;
        iconRegistry.baseUrl = BASE;
        iconRegistry.persist = true;
    });
    const stored = () => localStorage.getItem("autospark:icons:v1") ?? "";
    const flushWait = () => new Promise((r) => setTimeout(r, 400)); // 覆盖 300ms 写节流

    test("取回落盘：按源分组结构，节流窗口后写入", async () => {
        mount(`<span x-icon="mdi/save1"></span>`, {});
        expect(stored()).toBe(""); // 节流窗口内未落盘
        await flushWait();
        const parsed = JSON.parse(stored());
        expect(parsed[BASE]["mdi/save1"]).toContain("<svg");
    });

    test("二次访问零网络：预置持久层 → 同步渲染、零 fetch（核心目标）", () => {
        localStorage.setItem(
            "autospark:icons:v1",
            JSON.stringify({
                "https://api.iconify.design": {
                    "mdi/hot": "<svg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'><path d='H'/></svg>",
                },
            }),
        );
        reloadIconPersistenceForTest(); // 模拟页面重载后的模块初始化注水
        const { root } = mount(`<span x-icon="mdi/hot"></span>`, {});
        const el = root.querySelector(".as-icon")!;
        expect(el.getAttribute("data-as-icon")).toBe("mdi/hot"); // 同步渲染（持久回退注回内存）
        expect(el.style.getPropertyValue("mask-image")).toBe(""); // 默认 sw 走升格规则
        expect(document.getElementById("autospark-icons-remote")!.textContent).toContain(
            'data-as-icon="mdi/hot"',
        );
        expect(calls.length).toBe(0); // 零网络
    });

    test("persist=false 旁路：不查持久层、不落盘", async () => {
        localStorage.setItem(
            "autospark:icons:v1",
            JSON.stringify({ "https://api.iconify.design": { "mdi/off": "<svg/>" } }),
        );
        reloadIconPersistenceForTest();
        iconRegistry.persist = false; // reload 会复位开关，须在其后设置
        mount(`<span x-icon="mdi/off"></span>`, {});
        await nextTick();
        expect(calls.length).toBe(1); // 不查持久层，直接网络
        mount(`<span x-icon="mdi/w1"></span>`, {});
        await flushWait();
        expect(stored()).not.toContain("mdi/w1"); // 不落盘
    });

    test("prefetch：提前取回落盘；非远程形态静默忽略", async () => {
        iconRegistry.prefetch(["mdi/pre1", "mdi/pre2"]);
        await flushWait();
        const parsed = JSON.parse(stored());
        expect(parsed[BASE]["mdi/pre1"]).toContain("<svg");
        expect(parsed[BASE]["mdi/pre2"]).toContain("<svg");
        expect(() => iconRegistry.prefetch("close")).not.toThrow();
        expect(calls.length).toBe(2); // 本地名不发请求
    });

    test("源隔离：持久层键含 baseUrl，换源不串图（持久层单元级）", () => {
        persistStore("https://a.internal", "mdi/x", "<svg viewBox='0 0 1 1'><path d='A'/></svg>");
        expect(persistLookup("https://a.internal", "mdi/x")).toContain("A");
        expect(persistLookup("https://b.internal", "mdi/x")).toBeUndefined();
    });

    test("LRU 上限 500：超限淘汰最旧，命中刷新新旧", () => {
        for (let i = 0; i < 501; i++) persistStore(BASE, `mdi/lru${i}`, "<svg/>");
        expect(persistLookup(BASE, "mdi/lru0")).toBeUndefined(); // 最旧被淘汰
        expect(persistLookup(BASE, "mdi/lru500")).toContain("<svg");
        // 命中刷新：lru1 升到最新后，再写一条淘汰的是 lru2
        persistLookup(BASE, "mdi/lru1");
        persistStore(BASE, "mdi/lruNew", "<svg/>");
        expect(persistLookup(BASE, "mdi/lru2")).toBeUndefined();
        expect(persistLookup(BASE, "mdi/lru1")).toContain("<svg");
    });

    test("配额降级：首次写抛错 → 淘汰最旧一半重写成功", async () => {
        for (let i = 0; i < 10; i++) persistStore(BASE, `mdi/q${i}`, "<svg/>");
        // happy-dom 的 setItem 实例级覆写与 globalThis.localStorage 直接赋值均不可行
        // （readonly getter）——经 defineProperty 整体替换全局对象来 mock
        const backing = new Map<string, string>();
        const realDesc = Object.getOwnPropertyDescriptor(globalThis, "localStorage")!;
        let thrown = false;
        Object.defineProperty(globalThis, "localStorage", {
            value: {
                getItem: (k: string) => backing.get(k) ?? null,
                setItem: (k: string, v: string) => {
                    if (!thrown) {
                        thrown = true;
                        throw new Error("QuotaExceededError");
                    }
                    backing.set(k, v);
                },
                removeItem: (k: string) => void backing.delete(k),
                clear: () => backing.clear(),
                key: () => null,
                length: 0,
            },
            writable: true,
            configurable: true,
        });
        try {
            persistStore(BASE, "mdi/qnew", "<svg/>");
            await flushWait();
        } finally {
            Object.defineProperty(globalThis, "localStorage", realDesc);
        }
        const raw = backing.get("autospark:icons:v1") ?? "";
        expect(raw).toContain("mdi/qnew");
        // 11 条淘汰 ceil(11/2)=6 条最旧：q0..q5 出局，q6..q9 + qnew 存留
        expect(raw).not.toContain("mdi/q0");
        expect(raw).not.toContain("mdi/q5");
        expect(raw).toContain("mdi/q6");
    });
});

describe("AutoSpark.icons.options 全局默认配置（四级链：指令 > 宿主 > 全局 > 内置）", () => {
    const realFetch = globalThis.fetch;
    beforeEach(() => {
        globalThis.fetch = (async () =>
            new Response("<svg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'><path d='G'/></svg>", {
                status: 200,
            })) as any;
    });
    afterEach(() => {
        globalThis.fetch = realFetch;
    });

    test("全局默认生效：size/padding/color 无指令选项时落到实例", () => {
        iconRegistry.options = { size: 24, color: "red", padding: 2 };
        const { root } = mount(`${iconTpl("g1", "M1")}<span x-icon="g1"></span>`, {});
        const el = root.querySelector(".as-icon")!;
        expect(el.style.width).toBe("24px");
        expect(el.style.height).toBe("24px");
        expect(el.style.padding).toBe("2px");
        expect(el.style.backgroundColor).toBe("red");
    });

    test("指令选项覆盖全局（键级覆盖，非整体替换）", () => {
        iconRegistry.options = { size: 24, color: "red" };
        const { root } = mount(
            `${iconTpl("g2", "M1")}<span x-icon="g2" x-icon-options="{size:12}"></span>`,
            {},
        );
        const el = root.querySelector(".as-icon")!;
        expect(el.style.width).toBe("12px"); // 指令级胜
        expect(el.style.backgroundColor).toBe("red"); // 全局未覆盖键仍生效
    });

    test("全局 strokeWidth 参与规则烘焙：本地类规则与远程属性规则均按全局 sw，实例零内联", async () => {
        iconRegistry.options = { strokeWidth: 2 };
        const { root } = mount(`${iconTpl("g3", "M1")}<span x-icon="g3"></span>`, {});
        const local = root.querySelector("span")!;
        expect(local.style.getPropertyValue("mask-image")).toBe("");
        const sheet = document.getElementById("autospark-icons")!.textContent;
        expect(sheet).toContain(encodeURIComponent('stroke-width="2"'));
        // 远程属性规则同烘焙
        const { root: root2 } = mount(`<span x-icon="mdi/g4"></span>`, {});
        await nextTick();
        const remote = root2.querySelector("span")!;
        expect(remote.getAttribute("data-as-icon")).toBe("mdi/g4");
        expect(remote.style.getPropertyValue("mask-image")).toBe("");
        const remoteSheet = document.getElementById("autospark-icons-remote")!.textContent;
        expect(remoteSheet).toContain(encodeURIComponent('stroke-width="2"'));
        // 指令级 sw 覆盖才内联
        const { root: root3 } = mount(
            `${iconTpl("g5", "M1")}<span x-icon="g5" x-icon-options="{strokeWidth:1}"></span>`,
            {},
        );
        expect(root3.querySelector("span")!.style.getPropertyValue("mask-image")).toContain(
            encodeURIComponent('stroke-width="1"'),
        );
    });

    test("整体赋值广播重渲染：已渲染实例即时更新，远程规则按新默认重烘焙", async () => {
        const { root } = mount(`${iconTpl("g6", "M1")}<span x-icon="g6"></span>`, {});
        const el = root.querySelector(".as-icon")!;
        expect(el.style.width).toBe(""); // 内置默认 1em 走基础规则
        const { root: root2 } = mount(`<span x-icon="mdi/g7"></span>`, {});
        await nextTick();
        let remoteSheet = document.getElementById("autospark-icons-remote")!.textContent;
        expect(remoteSheet).toContain(encodeURIComponent('stroke-width="1.25"'));
        // 主题切换：整体赋值
        iconRegistry.options = { size: 32, strokeWidth: 2 };
        expect(el.style.width).toBe("32px");
        expect(el.style.getPropertyValue("mask-image")).toBe(""); // 仍走规则（新 sw 已烘焙）
        expect(document.getElementById("autospark-icons")!.textContent).toContain(
            encodeURIComponent('stroke-width="2"'),
        );
        remoteSheet = document.getElementById("autospark-icons-remote")!.textContent;
        expect(remoteSheet).toContain(encodeURIComponent('stroke-width="2"')); // 远程规则重烘焙
        expect(root2.querySelector("span")!.style.getPropertyValue("mask-image")).toBe("");
    });
});

describe("x-icon 修饰选项（badge / pointer）", () => {
    test("badge：挂载后包裹 as-icon-badge 底板层（宿主 mask 裁伪元素，板必须独立盒承载）", async () => {
        const { root } = mount(
            `${iconTpl("b1", "M1")}<span x-icon="b1" x-icon-options="{badge:true}"></span>`,
            {},
        );
        await nextTick(); // 包裹在挂载后微任务执行
        const el = root.querySelector(".as-icon")!;
        expect(el.parentElement!.classList.contains("as-icon-badge")).toBe(true);
        // 板规则常驻基础样式表（wrapper 自身圆角 + 淡色背景 + 排版免疫：
        // flex:none + aspect-ratio:1 + height:fit-content 防 stretch 拉伸）
        const sheet = document.getElementById("autospark-icons")!.textContent!;
        expect(sheet).toContain(
            ".as-icon-badge{display:inline-flex;flex:none;aspect-ratio:1;height:fit-content",
        );
        expect(sheet).toContain("color-mix(in srgb,currentColor 5%");
    });

    test("badge 修饰符快捷（x-icon.badge ≡ options）与未声明不包裹", async () => {
        const { root: r1 } = mount(
            `${iconTpl("b2", "M2")}<span x-icon.badge="b2"></span>`,
            {},
        );
        await nextTick();
        expect(r1.querySelector(".as-icon")!.parentElement!.classList.contains("as-icon-badge")).toBe(true);
        const { root: r2 } = mount(`${iconTpl("b3", "M3")}<span x-icon="b3"></span>`, {});
        await nextTick();
        expect(r2.querySelector(".as-icon")!.parentElement!.classList.contains("as-icon-badge")).toBe(false);
    });

    test("pointer：内联 cursor:pointer，未声明清除", () => {
        const { root: r1 } = mount(
            `${iconTpl("b4", "M4")}<span x-icon="b4" x-icon-options="{pointer:true}"></span>`,
            {},
        );
        expect(r1.querySelector("span")!.style.cursor).toBe("pointer");
        const { root: r2 } = mount(
            `${iconTpl("b5", "M5")}<span x-icon.pointer="b5"></span>`,
            {},
        );
        expect(r2.querySelector("span")!.style.cursor).toBe("pointer");
        const { root: r3 } = mount(`${iconTpl("b6", "M6")}<span x-icon="b6"></span>`, {});
        expect(r3.querySelector("span")!.style.cursor).toBe("");
    });

    test("badge/pointer 走全局配置链（icons.options 整体赋值生效）", async () => {
        const { root } = mount(`${iconTpl("b7", "M7")}<span x-icon="b7"></span>`, {});
        const el = root.querySelector(".as-icon")!;
        await nextTick();
        expect(el.parentElement!.classList.contains("as-icon-badge")).toBe(false);
        iconRegistry.options = { badge: true, pointer: true };
        await nextTick();
        expect(el.parentElement!.classList.contains("as-icon-badge")).toBe(true);
        expect(el.style.cursor).toBe("pointer");
    });

    test("badge 默认 padding 0.3em 作用于包裹层（图形恒 size 不放大；显式声明优先，含 0）", async () => {
        // 未声明 padding + badge → 默认 0.3em 写 wrapper（宿主恒无 padding）
        const { root: r1 } = mount(`${iconTpl("b8", "M8")}<span x-icon.badge="b8"></span>`, {});
        await nextTick();
        const icon1 = r1.querySelector(".as-icon")!;
        expect(icon1.parentElement!.style.padding).toBe("0.3em");
        expect(icon1.style.padding).toBe("");
        // 显式 padding 优先（含 0 —— 板贴图形）
        const { root: r2 } = mount(
            `${iconTpl("b9", "M9")}<span x-icon.badge="b9" x-icon-options="{padding:0}"></span>`,
            {},
        );
        await nextTick();
        expect(r2.querySelector(".as-icon")!.parentElement!.style.padding).toBe("0px");
        // 无 badge：padding 照旧内联宿主
        const { root: r3 } = mount(
            `${iconTpl("b10", "M10")}<span x-icon="b10" x-icon-options="{padding:4}"></span>`,
            {},
        );
        await nextTick();
        const icon3 = r3.querySelector(".as-icon")!;
        expect(icon3.style.padding).toBe("4px");
        expect(icon3.parentElement!.classList.contains("as-icon-badge")).toBe(false);
    });

    test("比例固定：基础规则内置 aspect-ratio:1", () => {
        expect(document.getElementById("autospark-icons")!.textContent).toContain("aspect-ratio:1");
    });
});
