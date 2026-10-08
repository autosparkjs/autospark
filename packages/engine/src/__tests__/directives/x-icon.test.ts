import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import "../setup";
import { mount, nextTick } from "../helpers";
import { AutoSpark } from "../../engine/engine";
import {
    iconRegistry,
    GLOBAL_SYMBOL_PREFIX,
    DEFAULT_ICON_STROKE_WIDTH,
} from "../../features/icons/registry";
import { DEFAULT_REMOTE_URL, resetIconCacheForTest } from "../../features/icons/remote";
import { resetIconDomainForTest } from "../../features/icons/domain";
import { spriteSymbolIds } from "../../features/icons/symbol";
import { resolveIconifyIcon, type IconifyJSON } from "../../features/icons/iconify";

/**
 * x-icon / x-icons 图标指令测试（ADR-0058：symbol 机制 + 图标域 + IconifyJSON 远程源）。
 *
 * 注册表 / sprite / 图标域令牌表是 document 级全局单例（跨用例残留），每个 describe 前
 * 重置并重播内置 default 图标；warn 去重（未命中）按 name 跨用例累积，故各用例使用互异图标名。
 */

const DEFAULT_ICON_SVG =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="5" y="5" width="14" height="14" rx="3"/></svg>';

/** 重置全局态：注册表（保留 default 原貌）+ 全局配置 + 图标域令牌表 + sprite 残余 symbol */
function resetIcons() {
    for (const name of [...iconRegistry]) iconRegistry.delete(name);
    // 先摘 sprite 再重播 default（重播会重建 sprite 并注入 as-default symbol）
    document.getElementById("autospark-icon-sprite")?.remove();
    iconRegistry.add("default", DEFAULT_ICON_SVG);
    iconRegistry.options = {};
    resetIconDomainForTest();
    resetIconCacheForTest(); // 远程会话缓存隔离（同 url 跨用例不串响应）
    localStorage.clear();
}

/** 内联 svg 声明（marker 用于区分内容） */
const svg = (id: string, marker: string, rootAttrs = "") =>
    `<svg id="${id}" viewBox="0 0 24 24" fill="none" stroke="currentColor" ${rootAttrs}><path d="${marker}"/></svg>`;
/** 纯内联 x-icons 声明模板 */
const iconsTpl = (svgs: string) => `<template x-icons>${svgs}</template>`;
/** 取宿主内 use 的 href（无 href 为 null） */
const useHref = (root: HTMLElement): string | null =>
    root.querySelector(".as-icon svg use")?.getAttribute("href") ?? null;
/** 按 href 取 symbol 元素（#id → 元素） */
const symbolOf = (href: string | null): Element | null =>
    href ? document.getElementById(href.slice(1)) : null;
/** sprite 内以 -<名> 结尾的 symbol id（令牌前缀无关的按名筛查） */
const symbolIdsByName = (name: string): string[] =>
    spriteSymbolIds().filter((id) => id.endsWith(`-${name}`));

beforeEach(() => resetIcons());

describe("x-icons 内联声明与 symbol 归一化（ADR-0058 决策 1/3/6）", () => {
    test("多 svg 收集为 symbol + 声明元素剪枝；x-icon 经 use 引用（局部前缀 as-i{令牌}-）", () => {
        const { root } = mount(
            `<div x-scope>${iconsTpl(svg("close", "M1") + svg("menu", "M2"))}<span x-icon="close"></span></div>`,
            {},
        );
        expect(root.querySelector("template")).toBeNull();
        const href = useHref(root);
        expect(href).toMatch(/^#as-i[a-z0-9]+-close$/);
        const sym = symbolOf(href);
        expect(sym).not.toBeNull();
        expect(sym!.getAttribute("viewBox")).toBe("0 0 24 24");
        expect(sym!.innerHTML).toContain("M1");
        expect(sym!.getAttribute("stroke")).toBe("currentColor"); // 根级承载属性上移到 symbol
        expect(symbolIdsByName("menu").length).toBe(1); // 未消费的声明同样注入
    });

    test("归一化：strip 全部 stroke-width；缺 stroke 且 fill=none 才补 currentColor（fill 型不补）", () => {
        mount(
            iconsTpl(
                `<svg id="swx" viewBox="0 0 24 24" fill="none"><path stroke-width="2" d="M1"/><rect stroke-width="1.5" x="1"/></svg>` +
                    `<svg id="fillx" viewBox="0 0 16 16"><path d="F"/></svg>` +
                    `<svg id="keptx" viewBox="0 0 24 24" fill="none" stroke="red"><path stroke-width="2" d="M1"/></svg>`,
            ),
            {},
        );
        const sw = document.getElementById(symbolIdsByName("swx")[0]!)!;
        expect(sw.getAttribute("stroke")).toBe("currentColor"); // fill=none 缺 stroke 才补
        expect(sw.querySelector("path")!.getAttribute("stroke-width")).toBeNull();
        expect(sw.querySelector("rect")!.getAttribute("stroke-width")).toBeNull();
        const fill = document.getElementById(symbolIdsByName("fillx")[0]!)!;
        expect(fill.getAttribute("stroke")).toBeNull(); // fill 体系不补 stroke（Iconify 同轨）
        const kept = document.getElementById(symbolIdsByName("keptx")[0]!)!;
        expect(kept.getAttribute("stroke")).toBe("red"); // 作者显式属性不动
        expect(kept.querySelector("path")!.getAttribute("stroke-width")).toBeNull();
    });

    test("非法名（ident 外/保留名）剔除；非 svg 根节点忽略；空声明跳过", () => {
        mount(
            `${iconsTpl(
                `<svg id="2x" viewBox="0 0 1 1"><path d="A"/></svg><svg id="as-icon" viewBox="0 0 1 1"><path d="B"/></svg><div>noise</div>`,
            )}` + `<template x-icons></template>`,
            {},
        );
        expect(symbolIdsByName("2x").length).toBe(0);
        expect(symbolIdsByName("as-icon").length).toBe(0);
        expect(iconRegistry.size).toBe(1); // 仅 default（未污染全局）
    });

    test("选项成员属性不支持（warn + 忽略）；未知修饰符忽略", () => {
        mount(
            `<template x-icons.fast="sv" x-icons-options.icons="'sv'">${svg("sv", "M1")}</template>`,
            {},
        );
        // 内联照常收集（成员属性与未知修饰符均不阻断声明）
        expect(symbolIdsByName("sv").length).toBe(1);
    });
});

describe("图标域：scope 局部 / 就近遮蔽 / 生命周期（ADR-0058 决策 2/4/12）", () => {
    test("归最近祖先 scope：后代沿链使用（跨无 scope 的纯 div）", () => {
        const { root } = mount(
            `<div x-scope>${iconsTpl(svg("sc", "M1"))}<div><div><span x-icon="sc"></span></div></div></div>`,
            {},
        );
        expect(useHref(root)).toMatch(/-sc$/);
        expect(symbolOf(useHref(root))!.innerHTML).toContain("M1");
    });

    test("就近遮蔽：内层 scope 同名覆盖外层（marker 区分）", () => {
        const { root } = mount(
            `<div x-scope>${iconsTpl(svg("sh", "OUTER"))}` +
                `<div x-scope>${iconsTpl(svg("sh", "INNER"))}<span x-icon="sh"></span></div>` +
                `</div>`,
            {},
        );
        expect(symbolIdsByName("sh").length).toBe(2); // 两组令牌各自注入
        expect(symbolOf(useHref(root))!.innerHTML).toContain("INNER");
    });

    test("同 scope 两声明同名：静默覆盖（后者胜，不 warn）", () => {
        const { root } = mount(
            `<div x-scope>${iconsTpl(svg("dup", "OLD"))}${iconsTpl(svg("dup", "NEW"))}<span x-icon="dup"></span></div>`,
            {},
        );
        const href = useHref(root)!;
        expect(symbolOf(href)!.innerHTML).toContain("NEW");
    });

    test("scope 销毁回收局部 symbol（x-if eager 切走）；registry 全局不受影响", async () => {
        const { root, engine } = mount(
            `<div x-scope>${iconsTpl(svg("gone", "M1"))}<span x-icon="gone"></span></div>` +
                `<div x-if="show"><div x-scope>${iconsTpl(svg("tmp", "M2"))}<span x-icon="tmp"></span></div></div>`,
            { show: true },
        );
        expect(useHref(root)).toMatch(/-gone$/);
        expect(symbolIdsByName("tmp").length).toBe(1);
        engine.state.show = false;
        await nextTick();
        expect(symbolIdsByName("tmp").length).toBe(0); // x-if 子树 scope 销毁 → 令牌 refs 归零摘除
        expect(symbolIdsByName("gone").length).toBe(1); // 其他 scope 的声明不受牵连
    });

    test("engine.destroy 回收局部 symbol；全局注册表与全局 symbol 不清理（document 级资产）", () => {
        const { engine } = mount(
            `<div x-scope>${iconsTpl(svg("loc", "M1"))}<span x-icon="loc"></span></div>`,
            {},
        );
        expect(symbolIdsByName("loc").length).toBe(1);
        engine.destroy();
        expect(symbolIdsByName("loc").length).toBe(0); // 根 scope 销毁 → 局部回收
        expect(iconRegistry.has("default")).toBe(true); // 全局注册表不清
        expect(symbolIdsByName("default").length).toBe(1); // 全局 symbol 不清
        expect(document.getElementById("autospark-icons")).not.toBeNull(); // 样式表常驻
    });

    test("x-for 克隆不放大：3 项共享一组 symbol（内容哈希令牌去重）", async () => {
        const { root, engine } = mount(
            `<ul x-for="i of [1,2,3]"><li>${iconsTpl(svg("fx", "M1"))}<span x-icon="fx"></span></li></ul>`,
            {},
        );
        await nextTick();
        expect(symbolIdsByName("fx").length).toBe(1); // 一份声明源 → 一组 symbol
        const hrefs = [...root.querySelectorAll("li svg use")].map((u) => u.getAttribute("href"));
        expect(new Set(hrefs).size).toBe(1); // 各项引用同一 symbol
        engine.destroy();
        expect(symbolIdsByName("fx").length).toBe(0); // 引用计数归零回收
    });

    test(".global 归全局：注册表入库 + symbol as-{name} + engine.destroy 不清理", () => {
        const { root, engine } = mount(
            `<template x-icons.global>${svg("glob", "M1")}</template><span x-icon="glob"></span>`,
            {},
        );
        expect(iconRegistry.has("glob")).toBe(true);
        expect(useHref(root)).toBe(`#${GLOBAL_SYMBOL_PREFIX}glob`);
        engine.destroy();
        expect(iconRegistry.has("glob")).toBe(true); // document 级资产纪律
        expect(symbolIdsByName("glob").length).toBe(1);
    });
});

describe("x-icon 渲染语义（ADR-0058 决策 1/2/11）", () => {
    test("值响应式：状态切换图标名，href 随之交换", async () => {
        const { root, engine } = mount(
            `${iconsTpl(svg("ra", "M1") + svg("rb", "M2"))}<span x-icon="cur"></span>`,
            { cur: "ra" },
        );
        const href1 = useHref(root)!;
        expect(href1).toMatch(/-ra$/);
        engine.state.cur = "rb";
        await nextTick();
        expect(useHref(root)).toMatch(/-rb$/);
        expect(useHref(root)).not.toBe(href1);
    });

    test("未命中：渲染 default symbol（缺图不破相）；后注册经变更总线唤醒补渲染", async () => {
        const { root } = mount(`<span x-icon="late"></span>`, {});
        expect(useHref(root)).toBe(`#${GLOBAL_SYMBOL_PREFIX}default`);
        iconRegistry.add("late", "<svg><path d='L'/></svg>");
        expect(useHref(root)).toBe(`#${GLOBAL_SYMBOL_PREFIX}late`);
    });

    test("删除联动：使用中的全局图标被 delete → 回退 default；不存在的名称静默 false", () => {
        const { root } = mount(
            `<template x-icons.global>${svg("del", "M1")}</template><span x-icon="del"></span>`,
            {},
        );
        expect(useHref(root)).toBe("#as-del");
        expect(iconRegistry.delete("del")).toBe(true);
        expect(useHref(root)).toBe("#as-default");
        expect(iconRegistry.delete("del")).toBe(false); // Set 契约
    });

    test("default 可被同名覆盖；删除后未命中退回空占位（保留基础类与尺寸）", () => {
        iconRegistry.add("default", "<svg><circle cx='1'/></svg>");
        expect(iconRegistry.getSvg("default")).toContain("circle");
        const { root } = mount(`<span x-icon="none-such"></span>`, {});
        const el = root.querySelector(".as-icon")!;
        expect(useHref(root)).toBe("#as-default");
        iconRegistry.delete("default");
        expect(useHref(root)).toBeNull();
        expect(el.classList.contains("as-icon")).toBe(true); // 空占位保留载体
    });

    test("空值回退字面量：state 值清空后原值作图标名；含点路径不回退（维持空占位）", async () => {
        const { root, engine } = mount(
            `${iconsTpl(svg("bf", "M1"))}<span x-icon="v"></span><span x-icon="a.b"></span>`,
            { v: "bf", a: { b: null } },
        );
        expect(useHref(root)).toMatch(/-bf$/);
        engine.state.v = null;
        await nextTick();
        // v=null → 原值 "v" 形匹配回退字面量 → 未声明 → 默认图标
        expect(useHref(root)).toBe("#as-default");
        // a.b 求值 null → 原值含点不匹配图标名 → 空占位（无 default 闪现）
        const use2 = root.querySelectorAll(".as-icon svg use")[1]!;
        expect(use2.getAttribute("href")).toBeNull();
    });

    test("旧远程形（斜杠）废除：求值 NaN → 空占位（形不匹配不回退字面量，零 fetch）", () => {
        const { root } = mount(`<span x-icon="mdi/home"></span>`, {});
        expect(useHref(root)).toBeNull();
    });

    test("选项：size/padding 数字 → px、字符串直传；color → 内联 color（currentColor 体系）", () => {
        const { root } = mount(
            `${iconsTpl(svg("opt", "M1"))}<span x-icon="opt" x-icon-options="{size:24,color:'red',padding:4}"></span>`,
            {},
        );
        const el = root.querySelector(".as-icon")!;
        expect(el.style.width).toBe("24px");
        expect(el.style.height).toBe("24px");
        expect(el.style.padding).toBe("4px");
        expect(el.style.color).toBe("red");
        expect(el.style.backgroundColor).toBe(""); // 旧 mask 颜色模型不再使用
    });

    test("strokeWidth：默认零内联（基础规则 var 兜底）；非默认内联 --as-icon-sw 变量", () => {
        const { root: r1 } = mount(
            `${iconsTpl(svg("sw1", "M1"))}<span x-icon="sw1"></span>`,
            {},
        );
        expect(r1.querySelector(".as-icon")!.style.getPropertyValue("--as-icon-sw")).toBe("");
        const { root: r2 } = mount(
            `${iconsTpl(svg("sw2", "M1"))}<span x-icon="sw2" x-icon-options="{strokeWidth:2}"></span>`,
            {},
        );
        expect(r2.querySelector(".as-icon")!.style.getPropertyValue("--as-icon-sw")).toBe("2");
    });

    test("基础样式表：--as-icon-sw 变量规则 + >svg 撑满规则 + badge/button 修饰规则常驻", () => {
        mount(`${iconsTpl(svg("sheet", "M1"))}<span x-icon="sheet"></span>`, {});
        const sheet = document.getElementById("autospark-icons")!.textContent!;
        expect(sheet).toContain(
            `stroke-width:var(--as-icon-sw,${DEFAULT_ICON_STROKE_WIDTH})`,
        );
        expect(sheet).toContain(".as-icon>svg{width:100%;height:100%;display:block}");
        expect(sheet).toContain(".as-icon-badge{display:inline-flex;flex:none;aspect-ratio:1;height:fit-content");
        expect(sheet).toContain(".as-icon.as-icon-button:hover{filter:brightness(.75)}");
        expect(sheet).toContain("box-sizing:content-box"); // 排版免疫
        expect(sheet).toContain("aspect-ratio:1");
    });

    test("options.icons 种子：构造期并入全局注册表", () => {
        mount(`<span x-icon="seed"></span>`, {}, { icons: { seed: "<svg><path d='S'/></svg>" } });
        expect(iconRegistry.has("seed")).toBe(true);
        expect(symbolIdsByName("seed")[0]).toBe("as-seed");
    });
});

describe("AutoSpark.icons 注册表 API（ADR-0058 决策 7）", () => {
    test("add 注入全局 symbol / delete 摘除 / 遍历产出名称字符串；旧远程 API 已删", () => {
        iconRegistry.add("api-a", "<svg><path d='A'/></svg>");
        iconRegistry.add("api-b", "<svg><path d='B'/></svg>");
        expect([...iconRegistry].includes("api-a")).toBe(true);
        expect(symbolIdsByName("api-a")[0]).toBe("as-api-a");
        expect(iconRegistry.delete("api-a")).toBe(true);
        expect(symbolIdsByName("api-a").length).toBe(0); // symbol 同步摘除
        expect([...iconRegistry].includes("api-a")).toBe(false);
        expect(AutoSpark.icons).toBe(iconRegistry);
        // baseUrl / persist / prefetch 已随 per-icon 远程物种删除
        expect((iconRegistry as unknown as Record<string, unknown>).baseUrl).toBeUndefined();
        expect((iconRegistry as unknown as Record<string, unknown>).prefetch).toBeUndefined();
    });

    test("全局默认配置四级链 + 整体赋值广播重渲染", () => {
        iconRegistry.options = { size: 24, color: "red", strokeWidth: 2 };
        const { root } = mount(
            `${iconsTpl(svg("g1", "M1"))}<span x-icon="g1" x-icon-options="{size:12}"></span>`,
            {},
        );
        const el = root.querySelector(".as-icon")!;
        expect(el.style.width).toBe("12px"); // 指令级胜
        expect(el.style.color).toBe("red"); // 全局未覆盖键仍生效
        // 全局 sw=2 即生效默认 → 零内联（基础规则 var 兜底，ADR-0058 决策 6「与生效默认一致零内联」）
        expect(el.style.getPropertyValue("--as-icon-sw")).toBe("");
        // 主题切换：整体赋值广播 → 已渲染实例即时更新（新 sw 仍是生效默认 → 维持零内联）
        iconRegistry.options = { strokeWidth: 3 };
        expect(el.style.width).toBe("12px"); // 指令级 size 声明不受全局重置影响
        expect(el.style.color).toBe(""); // 全局级 color 随新配置对称清除
        expect(el.style.getPropertyValue("--as-icon-sw")).toBe("");
    });
});

describe("IconifyJSON 远程源（ADR-0058 决策 8/9/11，mock fetch）", () => {
    const realFetch = globalThis.fetch;
    let routes: Record<string, () => Promise<unknown>> = {};
    let calls: string[] = [];
    /** 构造 IconifyJSON（根级 24×24 默认） */
    const makeSet = (
        icons: Record<string, { body: string; width?: number; rotate?: number; hFlip?: boolean }>,
        extra: Partial<IconifyJSON> = {},
    ): IconifyJSON =>
        ({
            prefix: "material-symbols-light",
            width: 24,
            height: 24,
            icons: Object.fromEntries(
                Object.entries(icons).map(([k, v]) => [k, { ...v, body: `<path d="${v.body}"/>` }]),
            ),
            ...extra,
        }) as IconifyJSON;

    beforeEach(() => {
        routes = {};
        calls = [];
        globalThis.fetch = ((url: unknown) => {
            const u = String(url);
            calls.push(u);
            const handler = routes[u];
            if (!handler) return Promise.reject(new Error(`no route for ${u}`));
            return handler().then(
                (json) => new Response(JSON.stringify(json), { status: 200 }) as any,
                () => new Response("err", { status: 500 }) as any,
            );
        }) as any;
    });
    afterEach(() => {
        globalThis.fetch = realFetch;
    });

    test("值简写清单 → 默认 url 插值（原名直书）→ 原名注册 + viewBox 根级默认合成", async () => {
        // route key 是**插值后**的最终 url（默认清单占位符为 {modify-icons}，未声明 modify 退化为原名清单）
        const finalUrl = DEFAULT_REMOTE_URL.replace("{modify-icons}", "save,home");
        routes[finalUrl] = async () => makeSet({ save: { body: "SV" }, home: { body: "HO" } });
        const { root } = mount(
            `<template x-icons="save,home"></template><span x-icon="save"></span>`,
            {},
        );
        expect(calls[0]).toBe(
            "https://api.iconify.design/material-symbols-light.json?icons=save,home",
        );
        expect(useHref(root)).toBeNull(); // 加载窗口期：待定空占位（不闪默认图标）
        await nextTick();
        const href = useHref(root)!;
        expect(href).toMatch(/-save$/);
        const sym = symbolOf(href)!;
        expect(sym.getAttribute("viewBox")).toBe("0 0 24 24"); // 根级 width/height 默认
        expect(sym.innerHTML).toContain("SV");
        expect(sym.getAttribute("stroke")).toBeNull(); // fill 体系不补 stroke
    });

    test("modify：url 用后缀清单取数、symbol 以原名注册（x-icon 不感知 modify）", async () => {
        routes["https://m.test/?i=save-rounded&m=rounded"] = async () =>
            makeSet({ "save-rounded": { body: "R" } });
        const { root } = mount(
            `<template x-icons="save" x-icons-options="{url:'https://m.test/?i={modify-icons}&m={modify}',modify:'rounded'}"></template><span x-icon="save"></span>`,
            {},
        );
        await nextTick();
        expect(useHref(root)).toMatch(/-save$/); // 原名注册
        expect(symbolOf(useHref(root))!.innerHTML).toContain("R");
    });

    test("未声明 modify：{modify} 空串、{modify-icons} 退化为 {icons}；未知占位符保留原样", async () => {
        routes["https://d.test/?i=save&m="] = async () => makeSet({ save: { body: "S" } });
        mount(
            `<template x-icons="save" x-icons-options="{url:'https://d.test/?i={modify-icons}&m={modify}'}"></template>`,
            {},
        );
        expect(calls[0]).toBe("https://d.test/?i=save&m=");
        routes["https://u.test/?x={foo}&i={icons}"] = async () => makeSet({ u1: { body: "U" } });
        mount(
            `<template x-icons="u1" x-icons-options="{url:'https://u.test/?x={foo}&i={icons}'}"></template>`,
            {},
        );
        expect(calls[1]).toBe("https://u.test/?x={foo}&i=u1");
    });

    test("modify 越界：warn + 按未声明处理（url 用原名清单）", async () => {
        routes["https://v.test/set"] = async () => makeSet({ sv: { body: "S" } });
        const { root } = mount(
            `<template x-icons="sv" x-icons-options="{url:'https://v.test/set',modify:'fat'}"></template><span x-icon="sv"></span>`,
            {},
        );
        await nextTick();
        expect(calls[0]).toBe("https://v.test/set");
        expect(useHref(root)).toMatch(/-sv$/);
    });

    test("not_found：响应缺键 → warn + 该名按未命中处理（默认图标，失败终态）", async () => {
        routes["https://n.test/set"] = async () => makeSet({ other: { body: "O" } });
        const { root } = mount(
            `<template x-icons="nf" x-icons-options="{url:'https://n.test/set'}"></template><span x-icon="nf"></span>`,
            {},
        );
        await nextTick();
        expect(useHref(root)).toBe("#as-default");
    });

    test("fetch 失败（HTTP 错误）：清单逐名按未命中处理；失败不落缓存可重试", async () => {
        let fail = true;
        routes["https://f.test/set"] = () =>
            fail ? Promise.reject(new Error("net")) : Promise.resolve(makeSet({ fl: { body: "F" } }));
        const { root } = mount(
            `<template x-icons="fl" x-icons-options="{url:'https://f.test/set'}"></template><span x-icon="fl"></span>`,
            {},
        );
        await nextTick();
        expect(useHref(root)).toBe("#as-default");
        fail = false;
        const { root: root2 } = mount(
            `<template x-icons="fl" x-icons-options="{url:'https://f.test/set'}"></template><span x-icon="fl"></span>`,
            {},
        );
        await nextTick();
        expect(useHref(root2)).toMatch(/-fl$/); // 同声明重收集 → 重新 fetch → 成功
        expect(calls.length).toBe(2);
    });

    test("待定名唤醒：fetch resolve 后 use href 出现（变更总线按名唤醒）", async () => {
        let release!: (v: unknown) => void;
        routes["https://p.test/set"] = () => new Promise((r) => (release = r));
        const { root } = mount(
            `<template x-icons="lazy" x-icons-options="{url:'https://p.test/set'}"></template><span x-icon="lazy"></span>`,
            {},
        );
        const use = root.querySelector(".as-icon svg use")!;
        expect(use.getAttribute("href")).toBeNull();
        release(makeSet({ lazy: { body: "LZ" } }));
        await nextTick();
        expect(use.getAttribute("href")).toMatch(/-lazy$/);
    });

    test("同一 template 内联 + 远程同名合并：内联加载窗口期先显形，远程到达覆盖（同 id）", async () => {
        routes["https://b.test/set"] = async () => makeSet({ both: { body: "REMOTE" } });
        const { root } = mount(
            `<template x-icons="both" x-icons-options="{url:'https://b.test/set'}">${svg("both", "INLINE")}</template><span x-icon="both"></span>`,
            {},
        );
        const href = useHref(root)!;
        expect(symbolOf(href)!.innerHTML).toContain("INLINE"); // 内联立即可用
        await nextTick();
        expect(symbolOf(href)!.innerHTML).toContain("REMOTE"); // 远程覆盖内联（同 id 内容替换）
        expect(symbolOf(href)!.innerHTML).not.toContain("INLINE");
        expect(useHref(root)).toBe(href); // href 不变——内容热替换，零重渲染协调
    });

    test("内联 + 远程同名且远程失败：内联存活（远程失败不杀内联）", async () => {
        routes["https://c.test/set"] = () => Promise.reject(new Error("x"));
        const { root } = mount(
            `<template x-icons="keep" x-icons-options="{url:'https://c.test/set'}">${svg("keep", "INLINE")}</template><span x-icon="keep"></span>`,
            {},
        );
        await nextTick();
        expect(useHref(root)).toMatch(/-keep$/);
        expect(symbolOf(useHref(root))!.innerHTML).toContain("INLINE");
    });

    test("in-flight 合并：同 url 多声明只 fetch 一次", async () => {
        routes["https://i.test/set"] = async () => makeSet({ i1: { body: "I" }, i2: { body: "J" } });
        mount(
            `<div x-scope><template x-icons="i1" x-icons-options="{url:'https://i.test/set'}"></template></div>` +
                `<div x-scope><template x-icons="i2" x-icons-options="{url:'https://i.test/set'}"></template></div>`,
            {},
        );
        await nextTick();
        expect(calls.length).toBe(1);
        expect(symbolIdsByName("i1").length).toBe(1);
        expect(symbolIdsByName("i2").length).toBe(1);
    });

    test("全局远程：x-icons.global + 清单 → registry 入库（as-{原名}）；engine.destroy 不清理", async () => {
        routes["https://g.test/set"] = async () => makeSet({ gsave: { body: "G" } });
        const { root, engine } = mount(
            `<template x-icons.global="gsave" x-icons-options="{url:'https://g.test/set'}"></template><span x-icon="gsave"></span>`,
            {},
        );
        expect(iconRegistry.has("gsave")).toBe(false); // 待定未入库
        await nextTick();
        expect(iconRegistry.has("gsave")).toBe(true);
        expect(useHref(root)).toBe("#as-gsave");
        engine.destroy();
        expect(iconRegistry.has("gsave")).toBe(true); // 全局资产不清理
    });

    test("全局所有权（声明序）：后声明者胜，旧声明的迟到响应无注入权（网络时序无关）", async () => {
        let releaseA!: (v: unknown) => void;
        routes["https://a.test/set"] = () => new Promise((r) => (releaseA = r));
        routes["https://b.test/set"] = async () => makeSet({ dup: { body: "NEW" } });
        mount(
            `<template x-icons.global="dup" x-icons-options="{url:'https://a.test/set'}"></template>` +
                `<template x-icons.global="dup" x-icons-options="{url:'https://b.test/set'}"></template>`,
            {},
        );
        await nextTick(); // 后声明（B）先到并注册
        expect(iconRegistry.getSvg("dup")).toContain("NEW");
        releaseA(makeSet({ dup: { body: "OLD" } })); // 先声明（A）迟到
        await nextTick();
        expect(iconRegistry.getSvg("dup")).toContain("NEW"); // 无注入权，内容不被旧响应翻转
    });

    test("cache > 0：fetch 成功落 localStorage；跨会话（内存清空）持久层命中零网络", async () => {
        const url = "https://cache.test/set";
        routes[url] = async () => makeSet({ cs: { body: "C" } });
        const decl = `<template x-icons="cs" x-icons-options="{url:'${url}',cache:86400000}"></template><span x-icon="cs"></span>`;
        mount(decl, {});
        await nextTick();
        expect(localStorage.getItem(`autospark:icon-cache:v1:${url}`)).not.toBeNull(); // 落盘
        resetIconCacheForTest(); // 模拟页面重载：内存缓存清空、localStorage 保留
        const { root } = mount(decl, {});
        await nextTick();
        expect(calls.filter((c) => c === url).length).toBe(1); // 零新请求
        expect(useHref(root)).toMatch(/-cs$/); // 持久层命中照常注入
    });

    test("cache TTL 过期：过期条目即弃并重新 fetch", async () => {
        const url = "https://ttl.test/set";
        routes[url] = async () => makeSet({ tv: { body: "T" } });
        const key = `autospark:icon-cache:v1:${url}`;
        const decl = `<template x-icons="tv" x-icons-options="{url:'${url}',cache:100}"></template><span x-icon="tv"></span>`;
        mount(decl, {});
        await nextTick();
        expect(localStorage.getItem(key)).not.toBeNull();
        // 改写落盘时刻为已过期（ttl=100ms，t 回拨 1s）
        const entry = JSON.parse(localStorage.getItem(key)!);
        entry.t = Date.now() - 1000;
        localStorage.setItem(key, JSON.stringify(entry));
        resetIconCacheForTest();
        const { root } = mount(decl, {});
        await nextTick();
        expect(calls.filter((c) => c === url).length).toBe(2); // 过期即弃 → 重新 fetch
        expect(useHref(root)).toMatch(/-tv$/);
    });

    test("cache 未声明（默认 0）：不落 localStorage", async () => {
        const url = "https://noc.test/set";
        routes[url] = async () => makeSet({ nc: { body: "N" } });
        mount(
            `<template x-icons="nc" x-icons-options="{url:'${url}'}"></template><span x-icon="nc"></span>`,
            {},
        );
        await nextTick();
        expect(localStorage.getItem(`autospark:icon-cache:v1:${url}`)).toBeNull();
    });

    test("cache 无效值（负数）：warn + 按未启用处理（不落盘、功能不受影响）", async () => {
        const url = "https://badcache.test/set";
        routes[url] = async () => makeSet({ bc: { body: "B" } });
        const { root } = mount(
            `<template x-icons="bc" x-icons-options="{url:'${url}',cache:-5}"></template><span x-icon="bc"></span>`,
            {},
        );
        await nextTick();
        expect(localStorage.getItem(`autospark:icon-cache:v1:${url}`)).toBeNull();
        expect(useHref(root)).toMatch(/-bc$/);
    });
});

describe("IconifyJSON 转换规则（resolveIconifyIcon 纯函数，ADR-0058 决策 10）", () => {
    const set: IconifyJSON = {
        prefix: "t",
        width: 24,
        height: 24,
        icons: {
            base: { body: "<path d='B'/>" },
            big: { body: "<path d='G'/>", width: 48, top: 8 },
            rot: { body: "<path d='R'/>", rotate: 1 },
            flip: { body: "<path d='F'/>", hFlip: true },
        },
        aliases: {
            "base-alias": { parent: "base" },
            "rot-alias": { parent: "rot", rotate: 1 }, // 变换合成：1+1=2
            "dim-alias": { parent: "big", width: 32 }, // 尺寸就近胜：alias 覆盖 parent
            cyc1: { parent: "cyc2" } as any,
            broken: { parent: "no-such" } as any,
        },
    };
    Object.assign(set.aliases!, { cyc2: { parent: "cyc1" } });

    test("基础解析 + 根级默认合成（viewBox 兜底链）", () => {
        const r = resolveIconifyIcon(set, "base")!;
        expect(r.viewBox).toBe("0 0 24 24");
        expect(r.content).toBe("<path d='B'/>"); // 无变换不包裹 g
    });

    test("图标级尺寸覆盖根级默认", () => {
        expect(resolveIconifyIcon(set, "big")!.viewBox).toBe("0 8 48 24");
    });

    test("rotate → g transform（90°×n 围绕中心）", () => {
        const r = resolveIconifyIcon(set, "rot")!;
        expect(r.content).toContain("<g transform=");
        expect(r.content).toContain("rotate(90)");
        expect(r.content).toContain("translate(12 12)"); // 中心 = 0+24/2
    });

    test("hFlip → scale(-1 1)", () => {
        expect(resolveIconifyIcon(set, "flip")!.content).toContain("scale(-1 1)");
    });

    test("别名：body 取 parent、变换合成（rotate 相加）、尺寸就近胜（alias 覆盖）", () => {
        expect(resolveIconifyIcon(set, "base-alias")!.content).toContain("d='B'");
        expect(resolveIconifyIcon(set, "rot-alias")!.content).toContain("rotate(180)");
        expect(resolveIconifyIcon(set, "dim-alias")!.viewBox).toBe("0 8 32 24");
    });

    test("未找到 / 循环别名 / parent 断链 → null（not_found 姿态）", () => {
        expect(resolveIconifyIcon(set, "no-such")).toBeNull();
        expect(resolveIconifyIcon(set, "cyc1")).toBeNull();
        expect(resolveIconifyIcon(set, "broken")).toBeNull();
    });
});

describe("x-icon 修饰选项（badge / pointer / button，ADR-0049 沿用）", () => {
    test("badge：挂载后包裹 as-icon-badge 底板层；未声明不包裹", async () => {
        const { root: r1 } = mount(
            `${iconsTpl(svg("b1", "M1"))}<span x-icon="b1" x-icon-options="{badge:true}"></span>`,
            {},
        );
        await nextTick(); // 包裹在挂载后微任务执行
        expect(r1.querySelector(".as-icon")!.parentElement!.classList.contains("as-icon-badge")).toBe(true);
        const { root: r2 } = mount(`${iconsTpl(svg("b2", "M2"))}<span x-icon="b2"></span>`, {});
        await nextTick();
        expect(r2.querySelector(".as-icon")!.parentElement!.classList.contains("as-icon-badge")).toBe(false);
    });

    test("badge 修饰符快捷（x-icon.badge ≡ options）与三形态板 padding", async () => {
        const { root: r1 } = mount(`${iconsTpl(svg("b3", "M3"))}<span x-icon.badge="b3"></span>`, {});
        await nextTick();
        expect(r1.querySelector(".as-icon")!.parentElement!.style.padding).toBe("0.3em"); // true 默认
        const { root: r2 } = mount(
            `${iconsTpl(svg("b4", "M4"))}<span x-icon="b4" x-icon-options="{badge:6}"></span>`,
            {},
        );
        await nextTick();
        expect(r2.querySelector(".as-icon")!.parentElement!.style.padding).toBe("6px"); // number → px
        const { root: r3 } = mount(
            `${iconsTpl(svg("b5", "M5"))}<span x-icon="b5" x-icon-options="{badge:'1em'}"></span>`,
            {},
        );
        await nextTick();
        expect(r3.querySelector(".as-icon")!.parentElement!.style.padding).toBe("1em"); // string 直传
    });

    test("badge 走全局配置链（icons.options 整体赋值生效）", async () => {
        const { root } = mount(`${iconsTpl(svg("b6", "M6"))}<span x-icon="b6"></span>`, {});
        await nextTick();
        expect(root.querySelector(".as-icon")!.parentElement!.classList.contains("as-icon-badge")).toBe(false);
        iconRegistry.options = { badge: true, pointer: true };
        await nextTick();
        expect(root.querySelector(".as-icon")!.parentElement!.classList.contains("as-icon-badge")).toBe(true);
        expect(root.querySelector(".as-icon")!.style.cursor).toBe("pointer");
    });

    test("pointer：内联 cursor:pointer（修饰符与选项双通道）；button 挂 as-icon-button 类", () => {
        const { root: r1 } = mount(
            `${iconsTpl(svg("c1", "M1"))}<span x-icon.pointer="c1"></span>`,
            {},
        );
        expect(r1.querySelector(".as-icon")!.style.cursor).toBe("pointer");
        const { root: r2 } = mount(`${iconsTpl(svg("c2", "M2"))}<span x-icon.button="c2"></span>`, {});
        expect(r2.querySelector(".as-icon")!.classList.contains("as-icon-button")).toBe(true);
        // button 隐含 pointer 由类规则承载（内联通道不写）
        expect(r2.querySelector(".as-icon")!.style.cursor).toBe("");
    });

    test("button + badge：动效载体是板——wrapper 挂 button 类、宿主不挂（载体唯一防双动效）", async () => {
        const { root } = mount(`${iconsTpl(svg("c3", "M3"))}<span x-icon.badge.button="c3"></span>`, {});
        await nextTick();
        const el = root.querySelector(".as-icon")!;
        expect(el.classList.contains("as-icon-button")).toBe(false);
        expect(el.parentElement!.classList.contains("as-icon-button")).toBe(true);
    });

    test("button 走全局配置链（options setter 同步广播）", () => {
        const { root } = mount(`${iconsTpl(svg("c4", "M4"))}<span x-icon="c4"></span>`, {});
        const el = root.querySelector(".as-icon")!;
        expect(el.classList.contains("as-icon-button")).toBe(false);
        iconRegistry.options = { button: true };
        expect(el.classList.contains("as-icon-button")).toBe(true);
    });
});
