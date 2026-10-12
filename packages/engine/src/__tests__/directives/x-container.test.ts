import { describe, expect, test, afterEach } from "bun:test";
import "../setup";
import { mount, nextTick } from "../helpers";
import { resolveContainerMaxWidths } from "../../directives/x-container";
import { DEFAULT_VIEWPORT_MAX_WIDTHS } from "../../features/viewport/types";

/**
 * x-container 响应式容器测试（ADR-0101 立 / ADR-0105 重写）。
 *
 * 覆盖面：maxWidths 解析纯函数（三级回退整表替换 / 未知档与非 CSS 值 warn 忽略 /
 * number 与 px 串双收 / 全无效回退内置）、档位消费（契约类装配 / data-breakpoint 首值
 * 与跨档跟随——经全局 $.viewport 响应式链路 / 非法档名忽略 / destroy 后不再跟随）、
 * 自定义表（指纹类 + scoped style 注入 / 同表多实例去重 / 引用计数回收）、.fluid
 * （中立化类 + data-breakpoint 照常）、viewport: false（无全局档位，data-breakpoint 缺席）。
 *
 * 约定：happy-dom 的 matchMedia 无 change 事件通道——经可控 matchMedia 桩驱动
 * （宽度改值 + 手动触发监听，全局档位经 ViewportManager → $.viewport 反映）。
 * 断言面只落标量与属性标记。
 */

const engines: any[] = [];
const roots: HTMLElement[] = [];

/** 挂载并连接 document，登记待清理 */
function mountC(html: string, state: any, options?: any) {
    const m = mount(html, state, options);
    document.body.appendChild(m.root);
    roots.push(m.root);
    engines.push(m.engine);
    return m;
}

afterEach(() => {
    for (const e of engines.splice(0)) e.destroy();
    for (const r of roots.splice(0)) r.remove();
    restoreMatchMedia();
});

/** 劫持 console.warn 收集（同步窗口） */
function catchWarns(open: () => void): string[] {
    const warns: string[] = [];
    const orig = console.warn;
    console.warn = (...args: any[]) => warns.push(String(args[0] ?? ""));
    try {
        open();
    } finally {
        console.warn = orig;
    }
    return warns;
}

/** 宿主上的指纹类名（自定义表才挂；排除 -fluid 模式类） */
const hashClassOf = (host: Element) =>
    [...host.classList].find((c) => /^autospark-container-(?!fluid$)[a-z0-9]+$/.test(c)) ?? null;

/** 当前存活的自定义表 scoped style 元素清单 */
const customStyles = () => [...document.querySelectorAll("style[id^='autospark-container-style-']")];

// ── 可控 matchMedia 桩（宽度驱动 matches + 手动派发 change）────────────────

const mqlFakes: any[] = [];
let realMatchMedia: any = null;

/** 安装桩：视口宽度 → 各 (min-width:Npx) 的 matches；setWidth 触发全部 change 监听 */
function stubMatchMedia(initialWidth = 1000) {
    const state = { width: initialWidth };
    realMatchMedia ??= (globalThis as any).matchMedia;
    const factory = (query: string) => {
        const min = parseFloat(query.match(/min-width:\s*([\d.]+)px/)?.[1] ?? "0");
        const fake: any = {
            media: query,
            get matches() {
                return state.width >= min;
            },
            _cb: new Set<() => void>(),
            addEventListener(_t: string, cb: () => void) {
                fake._cb.add(cb);
            },
            removeEventListener(_t: string, cb: () => void) {
                fake._cb.delete(cb);
            },
        };
        mqlFakes.push(fake);
        return fake;
    };
    (globalThis as any).matchMedia = factory;
    (window as any).matchMedia = factory;
    return {
        /** 改视口宽度并广播（跨档经 ViewportManager → $.viewport 反映） */
        setWidth(w: number) {
            state.width = w;
            for (const f of mqlFakes) for (const cb of f._cb) cb();
        },
    };
}

function restoreMatchMedia() {
    if (realMatchMedia == null) return;
    (globalThis as any).matchMedia = realMatchMedia;
    (window as any).matchMedia = realMatchMedia;
    realMatchMedia = null;
    mqlFakes.length = 0;
}

// ── maxWidths 解析纯函数 ────────────────────────────────────────────────

describe("resolveContainerMaxWidths", () => {
    test("缺省全空 → 内置缺省表", () => {
        const t = resolveContainerMaxWidths(() => undefined);
        expect(t).toEqual(DEFAULT_VIEWPORT_MAX_WIDTHS);
    });

    test("maxWidths：number → px 串、字符串原样放行（缺档无规则）", () => {
        const t = resolveContainerMaxWidths(() => ({ sm: 600, md: "60rem" }));
        expect(t["sm"]).toBe("600px");
        expect(t["md"]).toBe("60rem");
        // 整表替换——未声明档即无规则
        expect(t["lg"]).toBeUndefined();
    });

    test("engine options.viewport.maxWidths 兜底（指令层缺失才回退）", () => {
        const global = { sm: "480px" };
        expect(resolveContainerMaxWidths(() => undefined, global)["sm"]).toBe("480px");
        // 指令层命中优先于 engine 层
        const t2 = resolveContainerMaxWidths(() => ({ sm: 600 }), global);
        expect(t2["sm"]).toBe("600px");
    });

    test("未知档位与非 CSS 宽度值 warn + 忽略", () => {
        const warns = catchWarns(() =>
            resolveContainerMaxWidths(() => ({ huge: 100, sm: -5 }), undefined, console.warn),
        );
        expect(warns.join("\n")).toContain('未知档位 "huge"');
        expect(warns.join("\n")).toContain("无法解析为 CSS 宽度");
    });

    test("整表无有效项 → 回退内置缺省表 + warn", () => {
        const warns: string[] = [];
        const t = resolveContainerMaxWidths(() => ({}), undefined, (m) => warns.push(m));
        expect(warns.join("\n")).toContain("无任何有效项");
        expect(t).toEqual(DEFAULT_VIEWPORT_MAX_WIDTHS);
    });
});

// ── 视觉契约与档位消费 ──────────────────────────────────────────────────

describe("x-container 视觉契约与档位消费", () => {
    test("默认形态：契约类 + data-breakpoint 首值（$.viewport 驱动）+ 全局样式表", () => {
        const stub = stubMatchMedia(1000); // ≥992 <1200 → lg
        const m = mountC("<div x-container></div>", {});
        const host = m.root.firstElementChild as HTMLElement;
        expect(host.classList.contains("autospark-container")).toBe(true);
        // 全内置表 → 无指纹类（类清单 = 仅契约类）
        expect(hashClassOf(host)).toBeNull();
        expect(host.getAttribute("data-breakpoint")).toBe("lg");
        // 根元素全局档位属性同场（两级并存：根 data-viewport / 宿主 data-breakpoint）
        expect(m.engine.el.getAttribute("data-viewport")).toBe("lg");
        const style = document.getElementById("autospark-container-styles");
        expect(style).toBeTruthy();
        expect(style!.textContent).toContain("max-width:540px");
        expect(style!.textContent).toContain("--autospark-container-gutter");
    });

    test("跨档联动：setWidth → $.viewport 变更 → data-breakpoint 响应式跟随", async () => {
        const stub = stubMatchMedia(1000);
        const m = mountC(
            `<div x-container><span class="tier">{{ $.viewport }}</span></div>`,
            {},
        );
        const host = m.root.firstElementChild as HTMLElement;
        stub.setWidth(1500); // lg → xxl
        await nextTick(); // 插值重渲染走微任务调度
        expect(host.getAttribute("data-breakpoint")).toBe("xxl");
        expect(host.querySelector(".tier")!.textContent).toContain("xxl");
        stub.setWidth(500); // → xs（兜底档）
        await nextTick();
        expect(host.getAttribute("data-breakpoint")).toBe("xs");
    });

    test("多容器实例：data-breakpoint 同步跟随全局档位", async () => {
        const stub = stubMatchMedia(1000);
        const m = mountC('<div><div class="a" x-container></div><div class="b" x-container></div></div>', {});
        const a = m.root.querySelector(".a") as HTMLElement;
        const b = m.root.querySelector(".b") as HTMLElement;
        expect(a.getAttribute("data-breakpoint")).toBe("lg");
        expect(b.getAttribute("data-breakpoint")).toBe("lg");
        stub.setWidth(1300); // → xl（store 通知走微任务批处理，await 后断言）
        await nextTick();
        expect(a.getAttribute("data-breakpoint")).toBe("xl");
        expect(b.getAttribute("data-breakpoint")).toBe("xl");
    });

    test("非法 $.viewport 值（用户违约写入）：data-breakpoint 忽略不变", () => {
        stubMatchMedia(1000);
        const m = mountC("<div x-container></div>", {});
        const host = m.root.firstElementChild as HTMLElement;
        expect(host.getAttribute("data-breakpoint")).toBe("lg");
        (m.engine.store.state as any).$.viewport = "foo";
        expect(host.getAttribute("data-breakpoint")).toBe("lg");
    });

    test("destroy 后跨档：watcher 随 scope 清理，data-breakpoint 不再跟随", () => {
        const stub = stubMatchMedia(1000);
        const m = mountC("<div x-container></div>", {});
        const host = m.root.firstElementChild as HTMLElement;
        m.engine.destroy();
        stub.setWidth(1500);
        expect(host.getAttribute("data-breakpoint")).toBe("lg");
    });
});

// ── 自定义表 ────────────────────────────────────────────────────────────

describe("x-container 自定义表", () => {
    test("engine breakpoints × 实例 maxWidths：指纹类 + scoped style（双类选择器压全局）", () => {
        stubMatchMedia(1000); // sm:600 / lg:900 → 1000 ≥ 900 → lg
        const m = mountC(
            '<div x-container x-container-options="{maxWidths:{sm:600}}"></div>',
            {},
            { viewport: { breakpoints: { sm: 600, lg: 900 } } },
        );
        const host = m.root.firstElementChild as HTMLElement;
        const hashClass = hashClassOf(host);
        expect(hashClass).toBeTruthy();
        const styleEl = customStyles().find((s) => (s.textContent ?? "").includes("(min-width:600px)"));
        expect(styleEl).toBeTruthy();
        expect(styleEl!.textContent).toContain(`.autospark-container.${hashClass}`);
        // 档位判定同源：engine 自定义阈值驱动全局 $.viewport
        expect(m.engine.el.getAttribute("data-viewport")).toBe("lg");
        expect(host.getAttribute("data-breakpoint")).toBe("lg");
    });

    test("同 maxWidths 多实例共享一份 scoped style，引用计数随 destroy 回收", () => {
        stubMatchMedia(1000);
        const html = '<div x-container x-container-options="{maxWidths:{sm:600}}"></div>';
        const m1 = mountC(html, {});
        const m2 = mountC(html, {});
        expect(customStyles().length).toBe(1);
        m1.engine.destroy();
        expect(customStyles().length).toBe(1);
        m2.engine.destroy();
        expect(customStyles().length).toBe(0);
    });

    test("engine options.viewport.maxWidths 兜底（实例未声明也出指纹）", () => {
        stubMatchMedia(1000);
        const m = mountC("<div x-container></div>", {}, { viewport: { maxWidths: { sm: "480px" } } });
        const host = m.root.firstElementChild as HTMLElement;
        expect(hashClassOf(host)).toBeTruthy();
        const styleEl = customStyles().find((s) => (s.textContent ?? "").includes("480px"));
        expect(styleEl).toBeTruthy();
    });
});

// ── .fluid ─────────────────────────────────────────────────────────────

describe("x-container.fluid", () => {
    test("恒无 max-width 约束，data-breakpoint 照常", async () => {
        const stub = stubMatchMedia(1000);
        const m = mountC('<div x-container.fluid><span class="tier">{{ $.viewport }}</span></div>', {});
        const host = m.root.firstElementChild as HTMLElement;
        expect(host.classList.contains("autospark-container-fluid")).toBe(true);
        expect(hashClassOf(host)).toBeNull(); // fluid 不吃 media 规则，无指纹类
        expect(host.getAttribute("data-breakpoint")).toBe("lg");
        stub.setWidth(1300);
        await nextTick(); // store 通知走微任务批处理
        expect(host.getAttribute("data-breakpoint")).toBe("xl");
        expect(host.style.maxWidth).toBe("");
    });
});

// ── viewport: false 协同 ────────────────────────────────────────────────

describe("options.viewport: false 协同", () => {
    test("无全局档位：data-breakpoint 缺席，media 视觉样式照常注入（CSS 与 JS 无关）", () => {
        stubMatchMedia(1000);
        const m = mountC("<div x-container></div>", {}, { viewport: false });
        const host = m.root.firstElementChild as HTMLElement;
        expect(host.classList.contains("autospark-container")).toBe(true);
        expect(host.hasAttribute("data-breakpoint")).toBe(false);
        expect(m.engine.el.hasAttribute("data-viewport")).toBe(false);
        // 视觉约束走纯 CSS media query——不依赖 JS 档位状态
        const style = document.getElementById("autospark-container-styles");
        expect(style).toBeTruthy();
        expect(style!.textContent).toContain("(min-width:576px)");
    });
});
