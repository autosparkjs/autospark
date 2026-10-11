import { describe, expect, test, afterEach } from "bun:test";
import "../setup";
import { mount, nextTick } from "../helpers";
import { AutoSpark } from "../../engine/engine";
import {
    resolveContainerTables,
    DEFAULT_CONTAINER_MAX_WIDTHS,
} from "../../directives/x-container";

/**
 * x-container 响应式容器测试（ADR-0101）。
 *
 * 覆盖面：断点表解析纯函数（三级回退整表替换 / xs 与非法项 warn 忽略 / number 与 px 串
 * 双收 / 全无效回退内置）、视口判定（类装配 / data-breakpoint 首值 / 档名单向写回 /
 * viewport:change 跨档事件与初值静默 / 非简单路径降级 / destroy 反注册）、自定义表
 * （指纹类 + scoped style 注入 / 同表多实例去重 / 引用计数回收）、.fluid（中立化类 +
 * 档位通道照常）。
 *
 * 约定：happy-dom 的 matchMedia 无 change 事件通道——经可控 matchMedia 桩驱动
 * （宽度改值 + 手动触发监听）。断言面只落标量与属性标记。
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
        /** 改视口宽度并广播（一次跨多档由指令全量重读兜住） */
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

// ── 断点表解析纯函数 ────────────────────────────────────────────────────

describe("resolveContainerTables", () => {
    test("缺省三级全空 → 内置缺省表（isDefault）", () => {
        const t = resolveContainerTables(() => undefined);
        expect(t.isDefault).toBe(true);
        expect(t.tiers).toEqual(["sm", "md", "lg", "xl", "xxl"]);
        expect(t.thresholds).toEqual([576, 768, 992, 1200, 1400]);
        expect(t.maxWidths).toEqual(DEFAULT_CONTAINER_MAX_WIDTHS);
        expect(t.cssText).toContain("(min-width:576px)");
    });

    test("xs 入阈值表与未知档位 warn + 忽略", () => {
        const read = () => ({ xs: 300, huge: 800, sm: 600 });
        const warns = catchWarns(() => resolveContainerTables(read, undefined, console.warn));
        expect(warns.join("\n")).toContain("xs 是 < sm 的隐含兜底档");
        expect(warns.join("\n")).toContain("未知档位");
        const t = resolveContainerTables(read);
        expect(t.tiers).toEqual(["sm"]);
        expect(t.thresholds).toEqual([600]);
    });

    test("阈值 number 与 px 串双收、升序排序", () => {
        const t = resolveContainerTables(() => ({ lg: 900, sm: "600px", xxl: 1600 }));
        expect(t.tiers).toEqual(["sm", "lg", "xxl"]);
        expect(t.thresholds).toEqual([600, 900, 1600]);
        expect(t.isDefault).toBe(false);
    });

    test("非 px 阈值 warn + 忽略（rem 等依赖布局基准）", () => {
        const read = () => ({ sm: "40rem", md: 768 });
        const warns = catchWarns(() => resolveContainerTables(read, undefined, console.warn));
        expect(warns.join("\n")).toContain("无法解析为 px");
        expect(resolveContainerTables(read).tiers).toEqual(["md"]);
    });

    test("maxWidths：number → px 串、字符串原样放行（缺档无规则）", () => {
        const read = (key: "breakpoints" | "maxWidths") =>
            key === "maxWidths" ? { sm: 600, md: "60rem" } : undefined;
        const t = resolveContainerTables(read);
        expect(t.maxWidths["sm"]).toBe("600px");
        expect(t.maxWidths["md"]).toBe("60rem");
        // maxWidths 表独立整表替换——未声明档即无规则
        expect(t.maxWidths["lg"]).toBeUndefined();
    });

    test("engine options.container 兜底（指令层缺失才回退）", () => {
        const global = { breakpoints: { sm: 500 }, maxWidths: { sm: "480px" } };
        expect(resolveContainerTables(() => undefined, global).tiers).toEqual(["sm"]);
        expect(resolveContainerTables(() => undefined, global).maxWidths["sm"]).toBe("480px");
        // 指令层命中优先于 engine 层
        const t2 = resolveContainerTables(
            (key) => (key === "breakpoints" ? { md: 800 } : undefined),
            global,
        );
        expect(t2.tiers).toEqual(["md"]);
        expect(t2.maxWidths["sm"]).toBe("480px");
    });

    test("整表无有效项 → 回退内置缺省表 + warn", () => {
        const read = () => ({});
        const warns = catchWarns(() => resolveContainerTables(read, undefined, console.warn));
        expect(warns.join("\n")).toContain("无任何有效项");
        expect(resolveContainerTables(read).isDefault).toBe(true);
    });
});

// ── 视口判定 ────────────────────────────────────────────────────────────

describe("x-container 视口判定", () => {
    test("默认形态：契约类 + data-breakpoint 首值 + 全局样式表注入", () => {
        const stub = stubMatchMedia(1000); // ≥992 <1200 → lg
        const m = mountC('<div x-container></div>', {});
        const host = m.root.firstElementChild as HTMLElement;
        expect(host.classList.contains("autospark-container")).toBe(true);
        // 全内置表 → 无指纹类（类清单 = 仅契约类）
        expect(hashClassOf(host)).toBeNull();
        expect(host.getAttribute("data-breakpoint")).toBe("lg");
        const style = document.getElementById("autospark-container-styles");
        expect(style).toBeTruthy();
        expect(style!.textContent).toContain("max-width:540px");
        expect(style!.textContent).toContain("--autospark-container-gutter");
    });

    test("值绑定：档名单向写回（初值同步）", () => {
        stubMatchMedia(1000);
        const m = mountC('<div x-container="ui.vp"></div>', { ui: { vp: "" } });
        expect((m.engine.store.state as any).ui.vp).toBe("lg");
    });

    test("跨档：data-breakpoint / 写回 / viewport:change（detail from→to）", () => {
        const stub = stubMatchMedia(1000);
        const m = mountC('<div x-container="ui.vp"></div>', { ui: { vp: "" } });
        const host = m.root.firstElementChild as HTMLElement;
        const events: any[] = [];
        host.addEventListener("viewport:change", (e: any) => events.push(e.detail));
        stub.setWidth(1500); // lg → xxl
        expect(host.getAttribute("data-breakpoint")).toBe("xxl");
        expect((m.engine.store.state as any).ui.vp).toBe("xxl");
        expect(events).toEqual([{ from: "lg", to: "xxl" }]);
        stub.setWidth(500); // xxl → xs（兜底档）
        expect(events).toEqual([{ from: "lg", to: "xxl" }, { from: "xxl", to: "xs" }]);
    });

    test("初值静默：首值同步不派发 viewport:change（编译顺序可靠性）", () => {
        stubMatchMedia(1000);
        const root = document.createElement("div");
        root.innerHTML = '<div x-container="ui.vp"></div>';
        const events: any[] = [];
        root.addEventListener("viewport:change", (e: any) => events.push(e.detail));
        const engine = new AutoSpark(root, { ui: { vp: "" } }, { autostart: false });
        engines.push(engine);
        roots.push(root);
        document.body.appendChild(root);
        engine.compile();
        expect(events.length).toBe(0);
        expect((engine.store.state as any).ui.vp).toBe("lg");
    });

    test("非简单路径值：warn 一次 + 写回忽略（视觉契约照常）", () => {
        stubMatchMedia(1000);
        const html = '<div x-container="ui.vp + \'!\'"></div>';
        const warns = catchWarns(() => mountC(html, { ui: { vp: "" } }));
        expect(warns.join("\n")).toContain("非简单状态路径");
        const m = mountC(html, { ui: { vp: "" } });
        expect((m.engine.store.state as any).ui.vp).toBe("");
        expect((m.root.firstElementChild as HTMLElement).classList.contains("autospark-container")).toBe(true);
    });

    test("向下传播：后代 @viewport:change 先于祖先收到，每元素恰好一次", async () => {
        const stub = stubMatchMedia(1000);
        const m = mountC(
            `<div x-container="ui.vp">
               <div class="inner" @viewport:change="hits = hits + 1">后代监听 {{ hits }}</div>
             </div>`,
            { ui: { vp: "" }, hits: 0 },
        );
        const inner = m.root.querySelector(".inner") as HTMLElement;
        const order: string[] = [];
        inner.addEventListener("viewport:change", () => order.push("down"));
        m.root.addEventListener("viewport:change", () => order.push("up"));
        stub.setWidth(1500); // lg → xxl
        expect(order).toEqual(["down", "up"]); // 先下行后上行（捕获→冒泡心智）
        expect((m.engine.store.state as any).hits).toBe(1);
        await nextTick(); // mustache 重渲染走微任务调度
        expect(inner.textContent).toContain("后代监听 1");
        stub.setWidth(1600); // xxl → xxl 同档不派发
        expect((m.engine.store.state as any).hits).toBe(1);
    });

    test("destroy 反注册 mql：跨档广播不再触达", () => {
        const stub = stubMatchMedia(1000);
        const m = mountC('<div x-container="ui.vp"></div>', { ui: { vp: "" } });
        const host = m.root.firstElementChild as HTMLElement;
        const events: any[] = [];
        host.addEventListener("viewport:change", (e: any) => events.push(e.detail));
        m.engine.destroy();
        stub.setWidth(1500);
        expect(events.length).toBe(0);
        expect((m.engine.store.state as any).ui.vp).toBe("lg");
    });
});

// ── 自定义表 ────────────────────────────────────────────────────────────

describe("x-container 自定义断点表", () => {
    test("指纹类 + scoped style 注入（双类选择器压过全局单类规则）", () => {
        stubMatchMedia(1000); // sm:600 / lg:900 → 1000 ≥ 900 → lg
        const m = mountC(
            '<div x-container x-container-options="{breakpoints:{sm:600,lg:900}}"></div>',
            {},
        );
        const host = m.root.firstElementChild as HTMLElement;
        const hashClass = hashClassOf(host);
        expect(hashClass).toBeTruthy();
        const styleEl = customStyles().find((s) =>
            (s.textContent ?? "").includes("(min-width:600px)"),
        );
        expect(styleEl).toBeTruthy();
        expect(styleEl!.textContent).toContain(`.autospark-container.${hashClass}`);
        expect(host.getAttribute("data-breakpoint")).toBe("lg");
    });

    test("同表多实例共享一份 scoped style，引用计数随 destroy 回收", () => {
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
});

// ── .fluid ─────────────────────────────────────────────────────────────

describe("x-container.fluid", () => {
    test("恒无 max-width 约束，档位通道照常（判定/写回/事件）", () => {
        const stub = stubMatchMedia(1000);
        const m = mountC('<div x-container.fluid="ui.vp"></div>', { ui: { vp: "" } });
        const host = m.root.firstElementChild as HTMLElement;
        expect(host.classList.contains("autospark-container-fluid")).toBe(true);
        expect(host.getAttribute("data-breakpoint")).toBe("lg");
        expect((m.engine.store.state as any).ui.vp).toBe("lg");
        const events: any[] = [];
        host.addEventListener("viewport:change", (e: any) => events.push(e.detail));
        stub.setWidth(1300);
        expect(events).toEqual([{ from: "lg", to: "xl" }]);
        expect(host.style.maxWidth).toBe("");
    });
});
